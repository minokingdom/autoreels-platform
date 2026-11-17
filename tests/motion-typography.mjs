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

try {
  await page.evaluate(async () => {
    isPlaying = false;
    AudioEngine.enabled = false;
    AudioEngine.stopTts();
    await document.fonts.ready;
  });
  const result = await page.evaluate(async () => {
    const cv = document.createElement('canvas'); cv.width = 540; cv.height = 960;
    const c = cv.getContext('2d');
    const failures = [];
    const check = (ok, reason) => { if (!ok) failures.push(reason); };
    const text = '가을 컬러 네일로\n손끝에 담은 오늘의 기분';
    let checks = 0;
    for (const mode of ['mask', 'focus', 'spring']) {
      for (const duration of [0.3, 1.2, 8]) {
        cutElementOverrides = {};
        const draw = (t) => {
          c.clearRect(0, 0, 540, 960);
          mPromptType(c, 540, 960, text, 0, t, duration, mode);
          return cv.toDataURL();
        };
        const settled = draw(duration * 0.9);
        draw(duration * 0.1);
        check(draw(duration * 0.9) === settled, `${mode}/${duration}: seek mismatch`);
        cutElementOverrides = {0:{caption:{hidden:true}}};
        draw(duration * 0.9);
        check(!c.getImageData(0,0,540,960).data.some((v,i)=>i%4===3 && v), `${mode}: hidden caption visible`);
        cutElementOverrides = {0:{caption:{color:'#ffcc00',font:'pretM',customPos:true,x:0.5,y:0.45,scale:0.8,anim:'none'}}};
        draw(duration * 0.9);
        const box = window.__arLastRenderedBoxes[0].caption;
        check(Math.abs(box.cx-270)<1 && Math.abs(box.cy-432)<1, `${mode}: position override`);
        check(c.getTransform().isIdentity && c.globalAlpha===1, `${mode}: leaked canvas state`);
        checks += 4;
      }
    }
    cutElementOverrides = {};
    const ids = ['ty_mask','ty_focus','ty_spring'];
    for (const key of ['auto','restaurant','cafe','clinic','beauty']) {
      setIndustry(key);
      for (const id of ids) {
        const ds = DESIGN_STYLES.find(d=>d.id===id);
        check(ds && ds.cat === '타이포' && arDesignVisible(ds), `${key}/${id}: unavailable`); checks++;
      }
    }
    const photo = new Image(); photo.src='/assets/topics/beauty/1.jpg'; await photo.decode();
    const originalImg = kitImg;
    const sheet = document.createElement('canvas'); sheet.width=810; sheet.height=1500;
    const sc=sheet.getContext('2d'); sc.fillStyle='#161616'; sc.fillRect(0,0,810,1500);
    try {
      kitImg = () => photo;
      campaign.cutCaptions=[text]; campaign.hook=text; campaign.priceTag='';
      for (let row=0;row<3;row++) for (let col=0;col<3;col++) {
        const ds=DESIGN_STYLES.find(d=>d.id===ids[col]);
        const t=[0.1,0.35,1.6][row];
        c.clearRect(0,0,540,960);
        renderMotionFrame(c,540,960,t,4,1,{},ds,{});
        sc.drawImage(cv,col*270,row*500+20,270,480);
        sc.fillStyle='#ffffff'; sc.font='12px sans-serif';
        sc.fillText(`${ds.name} · ${t}s`,col*270+12,row*500+15);
      }
    } finally { kitImg=originalImg; }
    return {failures,checks,sheet:sheet.toDataURL()};
  });
  if (process.env.MOTION_ARTIFACT) fs.writeFileSync(process.env.MOTION_ARTIFACT, Buffer.from(result.sheet.split(',')[1], 'base64'));
  console.log(JSON.stringify({checks:result.checks,failures:result.failures,pageErrors}));
  if(result.failures.length || pageErrors.length) process.exitCode=1;
} finally { await browser.close(); if(srv) srv.close(); }
