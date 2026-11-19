// 설치 목록은 모델 리비전과 실행기 버전에 고정합니다. 대본은 네트워크 요청에 포함하지 않습니다.
const revision = 'aafc6e32416a594460b32413efc49d7fe4ce6d46';
const base = 'https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/' + revision + '/';
const wasm = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort-wasm-simd-threaded.wasm';
const cacheName = 'autoreels-supertonic3-' + revision + '-ort122';
export const graphs = ['duration_predictor', 'text_encoder', 'vector_estimator', 'vocoder'];
const files = ['onnx/tts.json', 'onnx/unicode_indexer.json', 'voice_styles/F1.json', 'voice_styles/M1.json',
  ...graphs.map(name => 'onnx/' + name + '.onnx'), 'runtime.wasm'];
const key = name => new URL('./installed/' + name, import.meta.url).href;

export async function isInstalled() {
  if (!globalThis.caches || !await caches.has(cacheName)) return false;
  const keys = new Set((await (await caches.open(cacheName)).keys()).map(request => request.url));
  return files.every(name => keys.has(key(name)));
}

export async function install(progress) {
  const cache = await caches.open(cacheName);
  const present = new Set((await cache.keys()).map(request => request.url));
  for (const [i, name] of files.entries()) {
    progress(i + 1, files.length);
    if (present.has(key(name))) continue;
    const response = await fetch(name === 'runtime.wasm' ? wasm : base + name, { credentials: 'omit' });
    if (!response.ok) throw new Error('download_failed');
    await cache.put(key(name), response);
  }
}

export async function readAsset(name) {
  const cache = await caches.open(cacheName);
  let response = await cache.match(key(name));
  // 기존 설치에서도 새로 고른 성우의 작은 프로필만 한 번 받습니다.
  if (!response && /^voice_styles\/[FM][2-5]\.json$/.test(name)) {
    response = await fetch(base + name, { credentials: 'omit' });
    if (!response.ok) throw new Error('device_voice_download_failed');
    await cache.put(key(name), response.clone());
  }
  if (!response) throw new Error('device_model_missing');
  return name.endsWith('.json') ? response.json() : response.arrayBuffer();
}
