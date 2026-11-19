// USB 실기기 검증 시 모델은 PC의 연결을 통해 전달해 휴대폰 데이터를 사용하지 않습니다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { Readable } from 'node:stream';
import { chromium } from 'playwright';
import { buildApp } from '../scripts/build-app.mjs';

const real = process.argv.includes('--android') || process.argv.includes('--real');
const android = process.argv.includes('--android');
const root = path.resolve('public');
buildApp(path.resolve('.'));
let downloads = 0, paid = 0;
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/fixture/')) {
      downloads++;
      if (!real) { res.end('fixture'); return; }
      const upstream = url.pathname.slice('/fixture/'.length);
      const model = 'https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/aafc6e32416a594460b32413efc49d7fe4ce6d46/';
      const source = upstream === 'runtime' ? 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort-wasm-simd-threaded.wasm'
        : /^(?:onnx\/(?:tts.json|unicode_indexer.json|duration_predictor.onnx|text_encoder.onnx|vector_estimator.onnx|vocoder.onnx)|voice_styles\/[FM]1.json)$/.test(upstream) ? model + upstream : null;
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
    if (url.pathname.endsWith('/model.mjs')) {
      res.end(fs.readFileSync(file, 'utf8').replace('wasm : base + name', "'/fixture/runtime' : '/fixture/' + name"));
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
  const result = await page.evaluate(async () => {
    const lines = ['눈길을 끄는 BMW i4 eDrive40, 오늘 만나 보세요.', '전시 차량은 4대, 할인은 최대 800만 원입니다.'];
    AudioEngine.restoreVoice('device-F1');
    const key = AudioEngine.masterWantKey = AudioEngine.scriptKeyFor(lines);
    const start = performance.now();
    await AudioEngine.fetchScriptNarration(lines);
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
} finally {
  await page.close();
  await browser.close();
  server.closeAllConnections();
  server.close();
}
