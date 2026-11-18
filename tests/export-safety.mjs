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
    isPlaying=false;AudioEngine.stopTts();arFinalAudioUnlocked=true;evaluateDealerDrmStatus=()=>1;
    window.__charges=[];window.__notices=[];arToast=m=>window.__notices.push(m);
    AR_SERVER.mode=true;arApi=async(action,body)=>{window.__charges.push({action,body});return {ok:true,body:{used:window.__charges.length,cap:20}}};
    arCardEmpty=()=>true;campaign.cutCountOverride=4;
    AudioEngine.prefetchTtsBuffers=()=>Promise.resolve([]);AudioEngine.schedulePrefetch=()=>{};
    window.__originalRecorder=MediaRecorder;
  });
  await page.evaluate(async()=>{window.MediaRecorder=undefined;await exportSynthesizedVideo();window.MediaRecorder=window.__originalRecorder});
  assert.equal(await page.evaluate(()=>window.__charges.length),0);
  await page.evaluate(async()=>{AudioEngine.ttsVoice='audit';AudioEngine.masterBuffer=null;await exportSynthesizedVideo()});
  assert.equal(await page.evaluate(()=>window.__charges.length),0);
  assert.equal(await page.evaluate(()=>arExportBusy),false);
  const prepare=async()=>page.evaluate(async()=>{
    isPlaying=false;AudioEngine.stopTts();const ctx=AudioEngine.ensureContext();await ctx.resume();
    AudioEngine.enabled=true;AudioEngine.ttsVoice='audit';AudioEngine.bgmStyle='off';AudioEngine.sfxMode='off';
    const b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),samples=b.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=.04*Math.sin(2*Math.PI*220*i/ctx.sampleRate);
    AudioEngine.masterBuffer=b;AudioEngine.masterDuration=2;AudioEngine.masterCutBounds=[0,.5,1,1.5,2];
    AudioEngine.masterKey='audit';AudioEngine.masterWantKey='audit';refitDurationToNarration();
    window.lastRecordedVideoBlob=null;
  });
  await prepare();
  // 화면을 떠나는 경우 완성 처리·차감하지 않고 모든 실행 상태를 복원합니다.
  await page.evaluate(()=>{window.__run=exportSynthesizedVideo()});
  await page.waitForFunction(()=>window.__exportingVideo===true);
  await page.evaluate(async()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));await window.__run;delete document.hidden});
  assert.equal(await page.evaluate(()=>window.__charges.length),0);
  assert.equal(await page.evaluate(()=>arExportBusy),false);
  await prepare();
  await page.evaluate(async()=>{await exportSynthesizedVideo()});
  const result=await page.evaluate(async()=>{
    const b=window.lastRecordedVideoBlob;const v=document.createElement('video');v.src=window.lastRecordedVideoUrl;
    await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=reject});
    return {width:v.videoWidth,height:v.videoHeight,type:b.type,filename:window.lastRecordedFilename,charges:window.__charges.length,key:window.__charges[0].body.requestId,restored:[canvas.width,canvas.height],busy:arExportBusy,size:b.size};
  });
  assert.equal(result.width,1080);assert.equal(result.height,1920);assert.equal(result.charges,1);assert.match(result.key,/^[a-zA-Z0-9_-]{16,100}$/);assert.equal(result.busy,false);assert.deepEqual(result.restored,[540,960]);
  assert.ok(result.filename.endsWith(result.type.includes('mp4')?'.mp4':'.webm'));
  if(process.env.EXPORT_PROBE_DIR){
    const bytes=await page.evaluate(async()=>Array.from(new Uint8Array(await window.lastRecordedVideoBlob.arrayBuffer())));
    fs.writeFileSync(path.join(process.env.EXPORT_PROBE_DIR,result.filename),Buffer.from(bytes));
  }
  await prepare();
  // 저장 확인 응답이 유실되어도 같은 생성물은 같은 요청 ID로 재시도합니다.
  await page.evaluate(()=>{const originalSupport=MediaRecorder.isTypeSupported.bind(MediaRecorder);MediaRecorder.isTypeSupported=type=>type.startsWith('video/webm') && originalSupport(type);window.__retryKeys=[];arApi=async(a,b)=>{window.__retryKeys.push(b.requestId);return window.__retryKeys.length===1?{ok:false,body:{message:'retry'}}:{ok:true,body:{used:2,cap:20}};};});
  await page.evaluate(()=>exportSynthesizedVideo());assert.equal(await page.evaluate(()=>!!arPendingExport),true);
  await page.evaluate(()=>exportSynthesizedVideo());
  const keys=await page.evaluate(()=>window.__retryKeys);assert.equal(keys.length,2);assert.equal(keys[0],keys[1]); assert.equal(await page.evaluate(()=>window.lastRecordedMime),'video/webm'); assert.ok((await page.evaluate(()=>window.lastRecordedFilename)).endsWith('.webm'));
  assert.equal(await page.evaluate(()=>arPendingExport),null);
  const audioClip = (frames, frequency) => {
    const wav = Buffer.alloc(44 + frames * 2);
    wav.write('RIFF',0); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8);
    wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(1,22);
    wav.writeUInt32LE(24000,24); wav.writeUInt32LE(48000,28);
    wav.writeUInt16LE(2,32); wav.writeUInt16LE(16,34); wav.write('data',36); wav.writeUInt32LE(frames*2,40);
    for (let i=0;i<frames;i++) wav.writeInt16LE(Math.round(9000*Math.sin(2*Math.PI*frequency*i/24000)),44+i*2);
    return wav.toString('base64');
  };
  await page.route('**/api/tts-script?**',async route=>{
    const url = new URL(route.request().url());
    assert.equal(url.searchParams.get('v'),'10');
    assert.deepEqual(JSON.parse(url.searchParams.get('lines')),['첫 컷','둘째 컷','셋째 컷','마지막 컷']);
    await route.fulfill({json:{ok:true,model:'airy-tts-v1',clips_base64:[audioClip(4800,220),audioClip(9600,240),audioClip(14400,260),audioClip(19200,280)]}});
  });
  const airy = await page.evaluate(async()=>{
    AR_SERVER.me={user:{id:'331'},entitlement:{pro:true,tier:'pro'},usage:{aiLimit:null}};
    AudioEngine.ttsVoice='audit'; AudioEngine.ttsSpeed=1.2;
    const lines=['첫 컷','둘째 컷','셋째 컷','마지막 컷'];
    AudioEngine.masterWantKey=AudioEngine.scriptKeyFor(lines);
    await AudioEngine.fetchScriptNarration(lines);
    refitDurationToNarration();
    const bounds=AudioEngine.masterCutBounds.slice();
    const duration=AudioEngine.masterBuffer.duration;
    isPlaying=false; AudioEngine.stopTts();
    window.lastRecordedVideoBlob=null;
    await exportSynthesizedVideo();
    return {bounds,duration,provider:AudioEngine.ttsProvider,exportSize:window.lastRecordedVideoBlob?.size||0,
      badge:document.getElementById('ttsProviderBadge').textContent, audioTracks:AudioEngine.streamDest.stream.getAudioTracks().length};
  });
  [0,1/6,.5,1,5/3].forEach((bound,index)=>assert.ok(Math.abs(airy.bounds[index]-bound)<.003));
  assert.ok(Math.abs(airy.duration-5/3)<.003);
  assert.equal(airy.provider,'airy');
  assert.match(airy.badge,/Airy/);
  assert.equal(airy.audioTracks,1);
  assert.ok(airy.exportSize>1000);
  await page.route('**/api/tts-voices?v=2',route=>route.fulfill({json:{ok:true,voices:[
    {id:'ko-KR-Wavenet-C',title:'Google WaveNet C · 남성'}
  ]}}));
  await page.route('**/api/tts-script',async route=>{
    assert.equal(route.request().method(),'POST');
    assert.deepEqual(route.request().postDataJSON(),{ref:'ko-KR-Wavenet-C',speed:1.2,lines:['첫 컷','둘째 컷','셋째 컷','마지막 컷']});
    await route.fulfill({json:{ok:true,model:'google-wavenet',parts:[
      {audio_base64:audioClip(24000,220),starts:[0,.25]},
      {audio_base64:audioClip(24000,260),starts:[0,.6]}
    ]}});
  });
  const google=await page.evaluate(async()=>{
    AudioEngine.voiceListLoaded=false;
    await AudioEngine.loadVoiceList();
    const select=document.getElementById('ttsVoiceSelect');
    const option=Array.from(select.options).find(candidate=>candidate.value==='ko-KR-Wavenet-C');
    AudioEngine.restoreVoice(option.value);
    const lines=['첫 컷','둘째 컷','셋째 컷','마지막 컷'];
    AudioEngine.masterWantKey=AudioEngine.scriptKeyFor(lines);
    await AudioEngine.fetchScriptNarration(lines);
    refitDurationToNarration();
    const bounds=AudioEngine.masterCutBounds.slice();
    isPlaying=false; AudioEngine.stopTts();
    window.lastRecordedVideoBlob=null;
    await exportSynthesizedVideo();
    return {bounds,provider:AudioEngine.ttsProvider,selected:select.value,exportSize:window.lastRecordedVideoBlob?.size||0};
  });
  [0,.25,1,1.6,2].forEach((bound,index)=>assert.ok(Math.abs(google.bounds[index]-bound)<.003));
  assert.equal(google.provider,'google');
  assert.equal(google.selected,'ko-KR-Wavenet-C');
  assert.ok(google.exportSize>1000);

  assert.deepEqual(pageErrors,[]);assert.deepEqual(await page.evaluate(()=>window.__smokeAsyncErrors),[]);
  console.log('export safety ok',JSON.stringify(result));
} finally {await browser.close();if(srv)srv.close();}
