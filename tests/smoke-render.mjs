// 화면 스모크 테스트: 페이지를 실제 브라우저로 열고, 모든 디자인 스타일을 여러 업종·여러 시점에서 그려 본다.
// 오류(예외)가 하나라도 나면 실패. 사용: node tests/smoke-render.mjs [url]  (기본: public 폴더를 직접 띄움)
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.SMOKE_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.wasm': 'application/wasm' };

async function serve() {
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (u.startsWith('/api/')) { res.writeHead(503, { 'content-type': 'application/json' }); return res.end('{"ok":false}'); }
    let f = path.join(root, u === '/' ? 'index.html' : u);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'studio.html');
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return srv;
}

if (!process.argv[2]) {
  const { buildApp } = await import('../scripts/build-app.mjs');
  buildApp(path.resolve(root, '..'));
}
const srv = process.argv[2] ? null : await serve();
const url = process.argv[2] || `http://127.0.0.1:${srv.address().port}/studio`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')));
// Promise 안에서 난 오류(처리 안 된 rejection)도 모음 — 화면이 조용히 멈추는 원인
await page.addInitScript(() => {
  window.__smokeAsyncErrors = [];
  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason;
    window.__smokeAsyncErrors.push(String((r && (r.stack || r.message)) || r).split('\n').slice(0, 3).join(' | '));
  });
});
await page.goto(url, { waitUntil: 'load', timeout: 90000 });
// 디자인 썸네일이 실제로 채워지는지 (배경 작업이 멈추지 않았는지)
const thumbs = await page.waitForFunction(
  () => typeof designThumbCache !== 'undefined' && Object.keys(designThumbCache.fresh || {}).length >= 12,
  null, { timeout: 30000 }
).then(() => 'ok').catch(() => 'stuck');
if (thumbs !== 'ok') pageErrors.push('design thumbnails did not fill within 30s (background job stuck)');
const asyncErrors = await page.evaluate(() => window.__smokeAsyncErrors || []);
// 서버 API 가 없는 환경이라 /api 호출 실패는 제외
for (const e of asyncErrors) if (!/\/api\/|Failed to fetch|NetworkError|503/.test(e)) pageErrors.push('async: ' + e);
await page.waitForTimeout(1000);

const result = await page.evaluate(async () => {
  const out = { designs: 0, frames: 0, errors: [] };
  const inds = ['auto', 'restaurant', 'cafe', 'clinic', 'beauty'];
  for (const ind of inds) {
    try { setIndustry(ind); } catch (e) { out.errors.push(`setIndustry(${ind}): ${e.message}`); continue; }
    for (const ds of DESIGN_STYLES) {
      if (ind !== 'auto' && !arDesignVisible(ds)) continue;
      out.designs++;
      campaign.designStyle = ds.id;
      const times = [0.3, 2.1, 4.4, 7.7, Math.max(0, TOTAL_DURATION - 0.4)];
      for (const t of times) {
        try { renderHyperFramesComposition(t); out.frames++; }
        catch (e) { out.errors.push(`${ind}/${ds.id}@${t.toFixed(1)}: ${e.message}`); break; }
      }
    }
  }
  // 버튼 등에 직접 걸린 함수(onclick="함수(...)")가 모두 있는지
  const names = new Set();
  for (const el of document.querySelectorAll('*')) {
    for (const a of el.getAttributeNames()) {
      if (!a.startsWith('on')) continue;
      for (const mm of el.getAttribute(a).matchAll(/(?:^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) names.add(mm[1]);
    }
  }
  const skip = new Set(['if', 'return', 'function', 'typeof', 'event', 'alert', 'confirm', 'setTimeout', 'Number', 'String', 'Math', 'parseInt', 'parseFloat']);
  out.handlers = 0;
  for (const n of names) {
    if (skip.has(n)) continue;
    out.handlers++;
    let ty;
    try { ty = (0, eval)('typeof ' + n); } catch (e) { ty = 'error'; }
    if (ty !== 'function') out.errors.push(`handler ${n}: ${ty}`);
  }
  // 단계 탭을 차례로 눌러 봄
  for (const tab of ['topic', 'script', 'photo', 'sound', 'card', 'publish']) {
    try { if (typeof switchStudioTab === 'function') switchStudioTab(tab); } catch (e) { out.errors.push(`tab ${tab}: ${e.message}`); }
  }
  try {
    const still = arFindDesign('in_lookbook_still');
    const makePhoto = (width, height, color) => {
      const photo = document.createElement('canvas');
      photo.width = width;
      photo.height = height;
      const ctx = photo.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      return photo;
    };
    const group = makePhoto(260, 220, '#bd3c2d');
    const next = makePhoto(70, 180, '#244cc7');
    campaign.uploadedPhotos = [group, next, next, next];
    campaign.isUserCustomPhotos = true;
    campaign.cutCountOverride = 4;
    campaign.scenePlan = campaign.uploadedPhotos.map((_, photoIdx) => ({ photoIdx }));
    const frame = makePhoto(540, 960, '#ffffff');
    const ctx = frame.getContext('2d');
    const render = (time) => renderMotionFrame(ctx, 540, 960, time, 8, 4, {}, still, {});
    render(0);
    const cover = frame.toDataURL();
    if (ctx.getImageData(405, 499, 1, 1).data[0] !== 189) throw Error('cover did not use a single group photo');
    render(1.4);
    if (cover !== frame.toDataURL()) throw Error('cover moved within the same cut');
    render(2.01);
    if (cover === frame.toDataURL()) throw Error('the next card did not replace the cover');
    const item = makePhoto(90, 75, '#299452');
    const plan = campaign.scenePlan[1];
    plan.lookbookItems = [item.toDataURL()];
    await arLookbookItemImages(plan)[0].decode();
    render(2.01);
    if (ctx.getImageData(139, 545, 1, 1).data[1] !== 148 ||
        ctx.getImageData(351, 545, 1, 1).data[2] !== 199) {
      throw Error('distinct item and full outfit photos did not render side by side');
    }
    const portrait = makePhoto(20, 100, '#ff0000');
    portrait.getContext('2d').fillStyle = '#0000ff';
    portrait.getContext('2d').fillRect(0, 90, 20, 10);
    const fitted = makePhoto(100, 100, '#ffffff').getContext('2d');
    arLookbookPicture(fitted, portrait, 0, 0, 100, 100);
    if (fitted.getImageData(50, 3, 1, 1).data[0] !== 255 ||
        fitted.getImageData(50, 97, 1, 1).data[2] !== 255) {
      throw Error('the portrait lost its top or bottom edge');
    }
    const finished = makePhoto(540, 675, '#bd3c2d');
    campaign.uploadedPhotos[0] = finished;
    campaign.lookbookFinishedCards = true;
    render(0);
    const card = ctx.getImageData(0, 143, 540, 675).data;
    const source = finished.getContext('2d').getImageData(0, 0, 540, 675).data;
    if (!card.every((value, i) => value === source[i])) throw Error('finished card pixels changed');
  } catch (error) {
    out.errors.push('fixed lookbook: ' + error.message);
  }
  return out;
});
await browser.close();
if (srv) srv.close();

console.log(`designs=${result.designs} frames=${result.frames} handlers=${result.handlers} renderErrors=${result.errors.length} pageErrors=${pageErrors.length}`);
for (const e of result.errors.slice(0, 40)) console.log('  RENDER', e);
for (const e of pageErrors.slice(0, 20)) console.log('  PAGE', e);
if (result.errors.length || pageErrors.length || result.frames === 0) process.exit(1);
console.log('smoke ok');
