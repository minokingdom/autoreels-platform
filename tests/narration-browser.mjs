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

import assert from 'node:assert/strict';
try {
  await page.evaluate(() => {
    isPlaying=false;
    AudioEngine.enabled=false;
    AudioEngine.stopTts();
    AudioEngine.prefetchTtsBuffers=()=>Promise.resolve([]);
    AudioEngine.schedulePrefetch=()=>{};
    arCardEmpty=()=>true;
    campaign.cutCountOverride=4;
    BASE_DURATION=12;
    const ctx=AudioEngine.ensureContext();
    const buffer=ctx.createBuffer(1,Math.round(ctx.sampleRate*5.8775),ctx.sampleRate);
    const samples=buffer.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=Math.sin(2*Math.PI*220*i/ctx.sampleRate)*0.03;
    AudioEngine.enabled=true;
    AudioEngine.masterBuffer=buffer;
    AudioEngine.masterDuration=buffer.duration;
    AudioEngine.masterCutBounds=[0,2.21,3.65,5.03,buffer.duration];
    AudioEngine.masterPeak=.03;
    AudioEngine.bgmStyle='off';
    AudioEngine.sfxMode='off';
    refitDurationToNarration();
    window.__voiceStarts=[];
    const create=ctx.createBufferSource.bind(ctx);
    ctx.createBufferSource=()=>{
      const src=create(),start=src.start.bind(src);
      src.start=(...args)=>{if(src.buffer===buffer)window.__voiceStarts.push(args);return start(...args)};
      return src;
    };
    window.__timelines.main.seek(0);
  });
  await page.click('#playPauseBtn');
  await page.waitForTimeout(800);
  assert.equal(await page.evaluate(()=>!!AudioEngine.masterSource),true);
  await page.click('#playPauseBtn');
  const paused=await page.evaluate(()=>({t:window.__timelines.main.currentTime,source:!!AudioEngine.masterSource}));
  assert.equal(paused.source,false);
  await page.click('#playPauseBtn');
  const offset=await page.evaluate(()=>window.__voiceStarts.at(-1)[1]);
  assert.ok(Math.abs(offset-paused.t)<.1);
  await page.evaluate(()=>seekToTime(0));
  const count=await page.evaluate(()=>window.__voiceStarts.length);
  await page.waitForTimeout(5400);
  const result=await page.evaluate(()=>({starts:window.__voiceStarts.length,active:!!AudioEngine.masterSource,t:window.__timelines.main.currentTime,boundaries:[getCutStart(1),getCutStart(2),getCutStart(3)],rate:AudioEngine.masterSource?.playbackRate.value}));
  assert.equal(result.starts,count,JSON.stringify(result));
  assert.equal(result.active,true);
  assert.equal(result.rate,1);
  result.boundaries.forEach((t,i)=>assert.ok(Math.abs(t-[2.21,3.65,5.03][i])<.01));
  console.log('browser narration continuity ok',JSON.stringify(result));
} finally { await browser.close(); if(srv)srv.close(); }
