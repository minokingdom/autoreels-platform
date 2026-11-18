// 화면 스모크 테스트: 페이지를 실제 브라우저로 열고, 모든 디자인 스타일을 여러 업종·여러 시점에서 그려 본다.
// 오류(예외)가 하나라도 나면 실패. 사용: node tests/smoke-render.mjs [url]  (기본: public 폴더를 직접 띄움)
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.SMOKE_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg' };

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
    window.__originalNarrationPrefetch = AudioEngine.prefetchTtsBuffers;
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
  const result=await page.evaluate(()=>({starts:window.__voiceStarts.length,active:!!AudioEngine.masterSource,t:window.__timelines.main.currentTime,total:TOTAL_DURATION,voiceDuration:AudioEngine.masterBuffer.duration,outro:OUTRO_DURATION,boundaries:[getCutStart(1),getCutStart(2),getCutStart(3)],rate:AudioEngine.masterSource?.playbackRate.value}));
  assert.equal(result.total,result.voiceDuration);
  assert.equal(result.outro,0);
  assert.equal(result.starts,count,JSON.stringify(result));
  assert.equal(result.active,true);
  assert.equal(result.rate,1);
  result.boundaries.forEach((t,i)=>assert.ok(Math.abs(t-[2.21,3.65,5.03][i])<.01));
  console.log('browser narration continuity ok',JSON.stringify(result));
  const ending = await page.evaluate(() => {
    isPlaying=false; AudioEngine.stopTts(); arCardEmpty=()=>false;
    const ctx=AudioEngine.ensureContext();
    AudioEngine.masterBuffer=ctx.createBuffer(1,Math.round(ctx.sampleRate*7.4),ctx.sampleRate);
    AudioEngine.masterDuration=AudioEngine.masterBuffer.duration;
    AudioEngine.masterCutBounds=[0,2.21,3.65,5.03,5.8775,AudioEngine.masterDuration];
    refitDurationToNarration();
    window.__timelines.main.seek(6.2);
    return {total:TOTAL_DURATION,voice:AudioEngine.masterDuration,main:getMainDuration(),outro:OUTRO_DURATION};
  });
  assert.equal(ending.total,ending.voice);
  assert.ok(Math.abs(ending.main-5.8775)<.001);
  assert.ok(Math.abs(ending.outro-1.5225)<.001);
  console.log('browser ending timing ok',JSON.stringify(ending));
  assert.equal(await page.evaluate(()=>window.__koSpeech('BMW 7시리즈, BMW 일곱 시리즈, 재고 7대')), 'BMW 칠시리즈, BMW 칠시리즈, 재고 일곱 대');
  await page.evaluate(()=>{
    switchStudioTab('card');
    AR_SERVER.me={user:{id:'test'},usage:{}};
    AudioEngine.prefetchTtsBuffers=window.__originalNarrationPrefetch;
    AudioEngine.fetchLineBuffer=()=>Promise.resolve(null);
    window.__endingRecordings=[];
    AudioEngine.fetchScriptNarration=function(lines){
      window.__endingRecordings.push(lines.at(-1));
      const key=this.scriptKeyFor(lines);
      return new Promise(resolve=>setTimeout(()=>{
        const ctx=this.ensureContext();
        const full=ctx.createBuffer(1,ctx.sampleRate*9,ctx.sampleRate);
        this.scriptMasters.set(key,{full,peak:.01,bounds:[0,2,3.5,5,7,9]});
        if(this.masterWantKey===key)this.useScriptMaster(key);
        resolve(true);
      },250));
    };
    window.__timelines.main.seek(2.5);
  });
  await page.locator('#dlrInputName').fill('Draft');
  await page.waitForTimeout(1050);
  await page.locator('#dlrInputName').fill('Final name');
  await page.locator('#dlrInputTitle').fill('Final title');
  await page.waitForTimeout(1050);
  assert.deepEqual(await page.evaluate(()=>window.__endingRecordings),[]);
  assert.equal(await page.evaluate(()=>window.__timelines.main.currentTime),2.5);
  await page.locator('#arApplyEndingBtn').click();
  await page.waitForFunction(()=>AudioEngine.masterDuration===9);
  const applied = await page.evaluate(()=>({
    records:window.__endingRecordings, position:window.__timelines.main.currentTime, playing:isPlaying,
    name:getSelectedDealer().name
  }));
  assert.equal(applied.records.length,1);
  assert.match(applied.records[0],/Final name Final title/);
  assert.equal(applied.position,2.5);
  assert.equal(applied.playing,false);
  assert.equal(applied.name,'Final name');
  await page.locator('#dlrInputBranch').fill('Display only');
  await page.locator('#arApplyEndingBtn').click();
  assert.equal(await page.evaluate(()=>window.__endingRecordings.length),1);
  await page.locator('#dlrInputTitle').fill('Applied on leaving');
  await page.locator('#studioTabBtn_sound').click();
  assert.equal(await page.evaluate(()=>getSelectedDealer().title),'Applied on leaving');
  await page.waitForFunction(()=>!AudioEngine.scriptPending);
  assert.equal(await page.evaluate(()=>window.__endingRecordings.length),2);
  console.log('ending edits recorded only on apply or on leaving, position preserved');
  await page.click('#playPauseBtn');
  await page.waitForFunction(()=>isPlaying);
  await page.evaluate(()=>openPresetDrawer('right'));
  await page.waitForFunction(()=>arEditSheetOpen && !isPlaying);
  const drawerTime=await page.evaluate(()=>window.__timelines.main.currentTime);
  await page.evaluate(()=>{
    const ctx=AudioEngine.ensureContext();
    AudioEngine.masterBuffer=ctx.createBuffer(1,ctx.sampleRate*10,ctx.sampleRate);
    AudioEngine.masterDuration=10;
    AudioEngine.masterCutBounds=[0,2,4,6,8,10];
    refitDurationToNarration();
  });
  await page.waitForTimeout(180);
  assert.equal(await page.evaluate(()=>window.__timelines.main.currentTime),drawerTime);
  await page.evaluate(()=>{openCutEditor(0);openCutPhotoReplaceModal(0);});
  await page.waitForFunction(()=>arEditSheetOpen && !isPlaying);
  await page.evaluate(()=>closeCutPhotoReplaceModal());
  assert.equal(await page.evaluate(()=>isPlaying),false);
  await page.evaluate(()=>closeCutEditor());
  await page.waitForFunction(()=>!arEditSheetOpen && isPlaying);
  assert.ok(await page.evaluate(()=>window.__timelines.main.currentTime>0));
  console.log('editor sheets pause on open and resume after the last close');
  await page.evaluate(() => {
    campaign.vehicle='가을 컬러 네일'; campaign.isUserCustomPhotos=false;
    window.__arTopics=[{title:'요즘 유행하는 3D 네일',iconUrl:'/assets/topics/beauty/2.jpg'},{title:'가을 찰떡 네일 추천',iconUrl:'/assets/topics/beauty/1.jpg'}];
    arSyncProductRows(); switchStudioTab('topic');
  });
  await page.waitForFunction(()=>document.querySelector('.ar-product-photo')?.naturalWidth>0);
  assert.equal(await page.locator('.ar-product-photo').getAttribute('src'),'/assets/topics/beauty/1.jpg');
  await page.locator('.ar-product-cover').click();
  assert.equal(await page.locator('#productSheet').isVisible(),true);
  await page.evaluate(()=>arCloseProductSheet());
  assert.equal(await page.locator('#productSheet').isVisible(),false);
  console.log('product photo and sheet click ok');
  await page.evaluate(() => {
    switchStudioTab('sound');
    window.__arUserMuted = true;
    AudioEngine.enabled = true;
    AudioEngine.sfxMode = 'off';
    if (!isPlaying) togglePlayPause();
    const ctx = AudioEngine.ensureContext();
    window.__auditionAnalyser = ctx.createAnalyser();
    AudioEngine.bgmGain.connect(window.__auditionAnalyser);
    renderBgmRecommendations();
  });
  await page.locator('#bgmRecommendRow .bgm-now').click();
  await page.waitForFunction(() => arEditSheetOpen && !isPlaying);
  const musicTime = await page.evaluate(() => window.__timelines.main.currentTime);
  const sheet = page.locator('#arBgmSheet');
  const search = sheet.locator('#arBgmSearch');
  const pick = async (name, id) => {
    await search.fill(name);
    await sheet.locator('.bgm-row').filter({ hasText: name }).click();
    await page.waitForFunction(track => {
      const audio = AudioEngine.customBgmAudioEl;
      const analyser = window.__auditionAnalyser;
      if (!audio || audio.paused || audio.currentTime < .12 || !audio.src.endsWith('/' + track + '.mp3')) return false;
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      return samples.some(sample => Math.abs(sample) > .002);
    }, id);
    assert.equal(await sheet.locator('.bgm-row.on .bgm-eq').count(), 1);
  };
  await pick('네온 골목', 'original-city-01');
  await pick('저녁 메모', 'original-lofi-01');
  assert.equal(await page.evaluate(() => window.__timelines.main.currentTime), musicTime);
  assert.equal(await page.evaluate(() => Boolean(AudioEngine.masterSource)), false);
  await sheet.locator('.bgm-done').click();
  await page.waitForFunction(time => isPlaying && window.__timelines.main.currentTime > time, musicTime);
  assert.equal(await page.evaluate(() => localStorage.getItem('autoreels_bgm_style')), 'original-lofi-01');
  assert.equal(await page.evaluate(() => arBgmListeningAudio), null);

  await page.evaluate(() => toggleAudioMaster(false));
  await page.locator('#bgmRecommendRow .bgm-now').click();
  await page.waitForFunction(() => arEditSheetOpen && !isPlaying);
  await pick('네온 골목', 'original-city-01');
  assert.equal(await page.evaluate(() => AudioEngine.enabled), false);
  await sheet.locator('.bgm-done').click();
  assert.equal(await page.evaluate(() => AudioEngine.customBgmAudioEl.paused), true);
  console.log('music sheet plays the selected track alone, preserves edit position and stops audition on close');
  assert.deepEqual(pageErrors,[]);
  assert.deepEqual(await page.evaluate(()=>window.__smokeAsyncErrors),[]);
} finally { await browser.close(); if(srv)srv.close(); }
