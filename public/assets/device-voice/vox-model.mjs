// shi3z/VoxCPM2-q8 includes the AudioVAE. Pin all files to the same checkpoint.
const revision = '7678fd25ae7672430e62c70dcc3168affad464d4';
const base = 'https://huggingface.co/shi3z/VoxCPM2-q8/resolve/' + revision;
const files = new Map([
  ['config.json', 4336],
  ['tokenizer.json', 3676772],
  ['model.safetensors', 2629105078],
]);
const block = 16 * 1024 * 1024;
const total = [...files.values()].reduce((a, b) => a + b, 0);
export const localBase = new URL('./vox-weights/', import.meta.url).href;
const directory = async create => (await navigator.storage.getDirectory()).getDirectoryHandle('vox-' + revision, { create });

export async function isInstalled() {
  try {
    const dir = await directory(false);
    for (const [name, size] of files) {
      if ((await (await dir.getFileHandle(name)).getFile()).size !== size) return false;
    }
    return true;
  } catch { return false; }
}

// Runs inside a dedicated worker. Only a complete HTTP range is committed.
// A tab close or a full disk can leave a partial block, which is retried.
export async function install(progress) {
  const dir = await directory(true);
  const { quota, usage } = await navigator.storage.estimate();
  let saved = 0;
  for (const [name, size] of files) {
    const entry = await dir.getFileHandle(name, { create: true });
    const length = (await entry.getFile()).size;
    saved += length <= size ? length : 0;
  }
  if (quota - usage < total - saved) throw new Error('device_space');
  let completed = 0;
  for (const [name, size] of files) {
    const file = await dir.getFileHandle(name);
    const handle = await file.createSyncAccessHandle();
    try {
      let offset = handle.getSize();
      if (offset !== size) {
        offset = offset > size ? 0 : offset - offset % block;
        handle.truncate(offset);
      }
      progress(completed + offset, total);
      while (offset < size) {
        const end = Math.min(offset + block, size) - 1;
        const whole = size <= block;
        const response = await fetch(base + '/' + name + '?part=' + offset, {
          headers: whole ? {} : { Range: 'bytes=' + offset + '-' + end },
          cache: 'no-store',
          signal: AbortSignal.timeout(120000),
        });
        if (!response.ok || (!whole && (response.status !== 206 ||
          response.headers.get('Content-Range') !== 'bytes ' + offset + '-' + end + '/' + size))) {
          throw new Error('device_download');
        }
        const data = new Uint8Array(await response.arrayBuffer());
        if (data.length !== end - offset + 1) throw new Error('device_download');
        if (handle.write(data, { at: offset }) !== data.length) throw new Error('device_space');
        handle.flush();
        offset = end + 1;
        progress(completed + offset, total);
      }
    } finally { handle.close(); }
    completed += size;
  }
}

// The runtime requests small byte ranges. Serve them from origin-private
// storage without materializing a multi-gigabyte ArrayBuffer.
export async function localWeights(request, overrides) {
  const name = new URL(request.url).pathname.split('/').pop();
  if (!files.has(name)) return new Response(null, { status: 404 });
  const file = overrides?.get(name) ?? await (await (await directory(false)).getFileHandle(name)).getFile();
  const size = file.size;
  if (!overrides && size !== files.get(name)) throw new Error('device_model_missing');
  const range = request.headers.get('Range');
  if (!range && name !== 'model.safetensors') return new Response(file);
  const match = /^bytes=(\d+)-(\d+)$/.exec(range || '');
  if (!match || +match[1] > +match[2] || +match[2] >= size) return new Response(null, { status: 416 });
  return new Response(file.slice(+match[1], +match[2] + 1), {
    status: 206, headers: { 'Content-Range': 'bytes ' + match[1] + '-' + match[2] + '/' + size },
  });
}

// This pinned tokenizer prepends ▁ and replaces ASCII spaces with ▁ before
// BPE. Every merge on a line is therefore a substring of its normalized text.
// Keep those tokens, byte fallbacks and control IDs, and expose their original
// embedding rows through a file-backed Blob. The other tensors are unchanged.
export async function weightsForLines(lines) {
  const dir = await directory(false);
  const open = async name => (await dir.getFileHandle(name)).getFile();
  const model = await open('model.safetensors');
  const config = JSON.parse(await (await open('config.json')).text());
  const tokenizer = JSON.parse(await (await open('tokenizer.json')).text());
  const text = lines.map(line => '▁' + line.replaceAll(' ', '▁')).join('\u0000');
  const added = new Set(tokenizer.added_tokens.map(token => token.content));
  const original = Object.entries(tokenizer.model.vocab).sort((a, b) => a[1] - b[1]);
  const rows = [];
  const vocab = Object.create(null);
  for (const [word, id] of original) {
    if (id < 512 || added.has(word) || /^<0x[0-9A-F]{2}>$/i.test(word) || text.includes(word)) {
      vocab[word] = rows.length;
      rows.push(id);
    }
  }
  tokenizer.model.vocab = vocab;
  tokenizer.model.merges = tokenizer.model.merges.filter(pair => {
    const [a, b] = pair.split(' ');
    return Object.hasOwn(vocab, a) && Object.hasOwn(vocab, b) && Object.hasOwn(vocab, a + b);
  });
  for (const token of tokenizer.added_tokens) {
    if (Object.hasOwn(vocab, token.content)) token.id = vocab[token.content];
    else { rows.push(token.id); token.id = rows.length - 1; }
  }
  config.lm_config.vocab_size = rows.length;
  // The runtime allocates max(config.max_length, prompt tokens + requested
  // patches). Studio generates one cut at a time, so use its actual length.
  config.max_length = 1;
  const length = Number(new DataView(await model.slice(0, 8).arrayBuffer()).getBigUint64(0, true));
  const start = 8 + length;
  const header = JSON.parse(await model.slice(8, start).text());
  const embedding = header['base_lm.embed_tokens.weight'];
  const [first, last] = embedding.data_offsets;
  const stride = (last - first) / embedding.shape[0];
  const shrink = (last - first) - rows.length * stride;
  embedding.shape[0] = rows.length;
  embedding.data_offsets[1] -= shrink;
  for (const tensor of Object.values(header)) {
    if (tensor.data_offsets?.[0] >= last) tensor.data_offsets = tensor.data_offsets.map(n => n - shrink);
  }
  const json = new TextEncoder().encode(JSON.stringify(header));
  const headerSize = Math.ceil(json.length / 8) * 8;
  const prefix = new Uint8Array(8);
  new DataView(prefix.buffer).setBigUint64(0, BigInt(headerSize), true);
  const pieces = [prefix, json, ' '.repeat(headerSize - json.length), model.slice(start, start + first)];
  for (let i = 0; i < rows.length;) {
    const low = rows[i++];
    while (i < rows.length && rows[i] === rows[i - 1] + 1) i++;
    pieces.push(model.slice(start + first + low * stride, start + first + (rows[i - 1] + 1) * stride));
  }
  pieces.push(model.slice(start + last));
  return new Map([['model.safetensors', new Blob(pieces)], ['config.json', new Blob([JSON.stringify(config)])],
    ['tokenizer.json', new Blob([JSON.stringify(tokenizer)])]]);
}
