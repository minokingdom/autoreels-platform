// USB 실기기 검증 시 모델은 PC의 연결을 통해 전달해 휴대폰 데이터를 사용하지 않습니다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { Readable } from 'node:stream';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { buildApp } from '../scripts/build-app.mjs';

const samples = process.argv.includes('--samples');
const real = samples || process.argv.includes('--android') || process.argv.includes('--real');
const android = process.argv.includes('--android');
const vox = process.argv.includes('--vox');
const ranges = [];
let interrupted = false;
const root = path.resolve('public');
buildApp(path.resolve('.'));
let downloads = 0, paid = 0;
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (vox && url.pathname.startsWith('/vox-fixture/')) {
      downloads++;
      if (!req.headers.range) return res.end('1234');
      const [, first, last] = /^bytes=(\d+)-(\d+)$/.exec(req.headers.range);
      ranges.push(+first);
      if (+first === 16 && !interrupted) { interrupted = true; res.writeHead(503).end(); return; }
      res.writeHead(206, { 'Content-Range': 'bytes ' + first + '-' + last + '/35' });
      res.end(Buffer.alloc(+last - +first + 1, 1));
      return;
    }
    if (url.pathname.startsWith('/fixture/')) {
      downloads++;
      if (!real) { res.end('fixture'); return; }
      const upstream = url.pathname.slice('/fixture/'.length);
      const model = 'https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/aafc6e32416a594460b32413efc49d7fe4ce6d46/';
      const source = upstream === 'runtime' ? 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort-wasm-simd-threaded.wasm'
        : /^(?:onnx\/(?:tts.json|unicode_indexer.json|duration_predictor.onnx|text_encoder.onnx|vector_estimator.onnx|vocoder.onnx)|voice_styles\/[FM][1-5]\.json)$/.test(upstream) ? model + upstream : null;
      assert.ok(source);
      const response = await fetch(source);
      console.log('asset', upstream, response.status);
      res.writeHead(response.status);
      Readable.fromWeb(response.body).on('error', () => res.destroy()).pipe(res);
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      if (/^\/api\/tts(?:-script)?$/.test(url.pathname)) paid++;
      res.writeHead(401, { 'Content-Type': 'application/json' }).end('{}');
      return;
    }
    const file = path.resolve(root, '.' + (url.pathname === '/studio' ? '/studio.html' : url.pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    const mime = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    if (vox && url.pathname.endsWith('/vox-model.mjs')) {
      res.end(fs.readFileSync(file, 'utf8')
        .replace(/const base = .*?;/, "const base = '/vox-fixture';")
        .replace('16 * 1024 * 1024', '16').replace('4336', '4').replace('3676772', '4').replace('2629105078', '35'));
    } else if (vox && url.pathname.endsWith('/vox-runtime/voxcpm_rs.js')) {
      res.end(`export default async function initWasm() {}
        export function init() {}
        export async function webgpu_self_test() {}
        export async function load_model(sources) {
          const url = JSON.parse(sources).base + 'model.safetensors';
          const reply = await fetch(new Request(url, { headers: { Range: 'bytes=12-28' } }));
          if (reply.status !== 206 || (await reply.arrayBuffer()).byteLength !== 17) throw Error('weights_range');
          return { sample_rate: 48000, generate_streaming: async text => {
            if (text.includes('1,150')) throw Error('numeric_speech');
            return new Float32Array(48000).fill(.1);
          } };
        }`);
    } else if (vox && url.pathname.endsWith('/vox-worker.mjs')) {
      res.end(fs.readFileSync(file, 'utf8').replace('await navigator.gpu?.requestAdapter()', '({})')
        .replace('weights = await weightsForLines(data.lines);', ''));
    } else if (url.pathname.endsWith('/model.mjs')) {
      res.end(fs.readFileSync(file, 'utf8').replace('wasm :', "'/fixture/runtime' :").replaceAll('base + name', "location.origin + '/fixture/' + name"));
    } else if (!real && url.pathname.endsWith('/worker.mjs')) {
      res.end('onmessage=e=>postMessage({sampleRate:24000,clips:e.data.lines.map(()=>new Float32Array(24000).fill(.1))})');
    } else fs.createReadStream(file).pipe(res);
  } catch (error) { console.error(error.message); res.writeHead(502).end(); }
});
await new Promise(resolve => server.listen(android ? 49261 : 0, '127.0.0.1', resolve));
const browser = android ? await chromium.connectOverCDP('http://127.0.0.1:49262') : await chromium.launch();
const context = android ? browser.contexts()[0] : await browser.newContext();
const page = await context.newPage();
try {
  const origin = 'http://127.0.0.1:' + server.address().port;
  await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  await page.goto(origin + '/studio');
  const login = async () => page.evaluate(async () => {
    AR_SERVER.me = { user: { id: 'device-test' } };
    await arRefreshDeviceVoice();
  });
  assert.equal(await page.locator('#deviceVoiceControls').isHidden(), true);
  await login();
  assert.equal(await page.locator('#deviceAuditionSelect option').count(), 10);
  assert.equal(await page.evaluate(() => window.__koSpeech('최대 1,150만원')), '최대 천백오십만 원');
  await page.evaluate(() => document.getElementById('studioTabBtn_sound').click());
  if (vox) {
    const install = page.locator('#voxVoiceInstall');
    await install.click();
    await page.waitForFunction(() => document.getElementById('voxVoiceStatus').textContent.includes('멈췄습니다'));
    await install.click();
    await page.locator('#voxVoiceTest').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#voxVoiceApply').isHidden(), true);
    assert.deepEqual(ranges, [0, 16, 16, 32]);
    const transferCount = downloads;
    await page.reload();
    await login();
    await page.evaluate(() => document.getElementById('studioTabBtn_sound').click());
    await page.locator('#voxVoiceTest').click();
    await page.locator('#voxVoiceApply').click();
    assert.equal(await page.evaluate(() => AudioEngine.ttsVoice), 'device-voxcpm2');
    const bounds = await page.evaluate(async () => {
      const lines = ['1,150만 원입니다.', '반갑습니다.'];
      const key = AudioEngine.masterWantKey = AudioEngine.scriptKeyFor(lines);
      await AudioEngine.fetchScriptNarration(lines);
      return AudioEngine.scriptMasters.get(key).bounds;
    });
    assert.equal(bounds.length, 3);
    assert.ok(bounds[2] > bounds[1] && bounds[1] > 0);
    assert.equal(downloads, transferCount);
    assert.equal(paid, 0);
    console.log('VoxCPM2 login, resume, persistent install, voice selection and local narration OK');
  } else {
  await page.locator('#deviceAuditionSelect + .ig-select-row').click();
  await page.locator('#arOptionSheet [data-v="device-M5"]').click();
  assert.match(await page.locator('#deviceAuditionPlayer').getAttribute('src'), /M5\.mp3$/);
  const before = downloads;
  const start = Date.now();
  await page.evaluate(() => document.getElementById('deviceVoiceInstall').click());
  await page.waitForFunction(() => arDeviceInstalled, null, { polling: 250, timeout: 480000 });
  console.log('install seconds', (Date.now() - start) / 1000, 'assets', downloads - before);
  const count = downloads;
  await page.reload();
  await login();
  assert.equal(await page.evaluate(() => arDeviceInstalled), true);
  assert.equal(downloads, count);
  await page.evaluate(() => {
    const select = document.getElementById('deviceAuditionSelect');
    select.value = 'device-M5';
    select.dispatchEvent(new Event('change'));
    document.getElementById('deviceVoiceApply').click();
  });
  assert.equal(await page.evaluate(() => AudioEngine.ttsVoice), 'device-M5');
  const result = await page.evaluate(async () => {
    const lines = ['눈길을 끄는 BMW i4 eDrive40, 오늘 만나 보세요.', '전시 차량은 4대, 할인은 최대 800만 원입니다.'];
    AudioEngine.restoreVoice('device-F1');
    const key = AudioEngine.masterWantKey = AudioEngine.scriptKeyFor(lines);
    const start = performance.now();
    const recording = AudioEngine.fetchScriptNarration(lines);
    if (document.querySelector('#previewViewport [data-generation-status]').hidden) throw new Error('녹음 중 스피너 누락');
    await recording;
    if (!document.querySelector('#previewViewport [data-generation-status]').hidden) throw new Error('녹음 완료 후 스피너가 남았습니다.');
    const master = AudioEngine.scriptMasters.get(key);
    const result = { seconds: master.full.duration, elapsed: (performance.now() - start) / 1000,
      bounds: master.bounds, peak: master.peak, rate: master.full.sampleRate };
    await AudioEngine.fetchScriptNarration(lines);
    return result;
  });
  console.log('master', result);
  assert.ok(result.seconds > 0 && result.peak > .001 && result.bounds.length === 3);
  assert.equal(result.bounds.at(-1), result.seconds);
  assert.equal(paid, 0);
  if (samples) {
    const dir = path.join(root, 'assets/device-voice/samples');
    fs.mkdirSync(dir, { recursive: true });
    for (const sex of ['F', 'M']) for (let i = 1; i <= 5; i++) {
      const id = sex + i;
      const audio = await page.evaluate(async id => {
        const worker = window.sampleWorker ||= new Worker('/assets/device-voice/worker.mjs', { type: 'module' });
        return new Promise((resolve, reject) => {
          worker.onerror = () => reject(new Error('sample_worker_failed'));
          worker.onmessage = ({ data }) => {
            if (data.error) return reject(new Error(data.error));
            if (!data.clips) return;
            const pcm = Int16Array.from(data.clips[0], n => Math.round(Math.max(-1, Math.min(1, n)) * 32767));
            let binary = '';
            for (const byte of new Uint8Array(pcm.buffer)) binary += String.fromCharCode(byte);
            resolve({ rate: data.sampleRate, pcm: btoa(binary) });
          };
          worker.postMessage({ voice: 'device-' + id, speed: 1.1, lines: [window.__koSpeech('오늘의 혜택, 최대 1,150만 원 할인입니다.')] });
        });
      }, id);
      execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 's16le', '-ar', String(audio.rate), '-ac', '1', '-i', 'pipe:0',
        '-codec:a', 'libmp3lame', '-b:a', '96k', path.join(dir, id + '.mp3')], { input: Buffer.from(audio.pcm, 'base64') });
      console.log('sample', id);
    }
  }
  }
} finally {
  await page.close();
  await browser.close();
  server.closeAllConnections();
  server.close();
}
