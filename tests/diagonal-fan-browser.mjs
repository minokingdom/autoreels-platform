// 사선 마스크의 다중 사진·컷 지정·짧은 컷·탐색·엔딩 및 실제 선택 UI를 검증합니다.
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {buildApp} from '../scripts/build-app.mjs';
const repo=path.resolve(import.meta.dirname,'..'),root=path.join(repo,'public');
const remote=process.argv.find(x=>x.startsWith('https://'));
const output=process.env.STYLE_PREVIEW_DIR;
if(output)fs.mkdirSync(output,{recursive:true});
buildApp(repo);
const server=remote?null:http.createServer((req,res)=>{
 let file=path.join(root,new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'studio.html');
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');
 res.end(fs.readFileSync(file));
});
if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.route('**/api/**',r=>r.fulfill({status:503,json:{ok:false}}));
 await page.goto(remote||`http://127.0.0.1:${server.address().port}/studio`,{waitUntil:'load'});
 await page.waitForFunction(()=>typeof arReferenceDiagonalFan==='function');
 const result=await page.evaluate(()=>{
  isPlaying=false;AudioEngine.enabled=false;AudioEngine.stopTts();
  campaign.cutCountOverride=4;
  campaign.cutCaptions=['사선으로 만나는 사진','겹쳐지는 새로운 장면','사진마다 이어지는 이야기','나만의 영상으로 완성'];
  const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;
  const c=canvas.getContext('2d',{willReadFrequently:true});
  const colors=['#eb3020','#20d050','#2040eb','#ebc020'];
  const photos=colors.map(color=>{const im=document.createElement('canvas');im.width=100;im.height=100;const ctx=im.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,100,100);return im;});
  campaign.uploadedPhotos=photos;campaign.isUserCustomPhotos=true;
  campaign.scenePlan=[{photoIdx:3},{photoIdx:0},{photoIdx:2},{photoIdx:1}];
  const r=AR_REFERENCE_STYLES.find(x=>x.layout==='diagonal-fan');
  if(!r)throw Error('catalog missing');
  const spec=DESIGN_STYLES.find(x=>x.id===r.id);
  const S={photos,n:4,idx:3,cutIdx:3,cuts:4};
  const draw=(local,dur=3,cut=3)=>{c.clearRect(0,0,540,960);arReferenceDiagonalFan(c,540,960,S,{...r,camera:'still'},cut,local/dur,local,dur);};
  const pixel=(x,y)=>[...c.getImageData(x,y,1,1).data];
  draw(.85);
  const pixels=c.getImageData(0,0,540,960).data,found=new Set();
  for(let i=0;i<pixels.length;i+=4){
   if(pixels[i+3]!==255)throw Error('transparent hole in mask');
   if(i%64===0)found.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);
  }
  for(const color of ['235,192,32','235,48,32','32,64,235','32,208,80'])if(!found.has(color))throw Error('missing distinct layer '+color);
  draw(2.5);if(pixel(270,200).slice(0,3).join(',')!=='32,208,80')throw Error('scenePlan current cut ignored');
  if(pixel(500,600).slice(0,3).join(',')!=='32,64,235')throw Error('previous scene must remain below current ray');
  if(pixel(500,780).slice(0,3).join(',')!=='235,48,32')throw Error('older scene must remain in next wedge');
  draw(0);if(pixel(270,200).slice(0,3).join(',')!=='32,64,235')throw Error('previous cut continuity lost');
  draw(.28,.3);if(pixel(270,200).slice(0,3).join(',')!=='32,208,80')throw Error('short cut never opens');
  // 다음 사진을 먼저 보여 주지 않음: 1번 컷에서는 0/1번 컷 색상만 존재해야 합니다.
  draw(.8,3,1);
  const early=c.getImageData(0,0,540,960).data;
  for(let i=0;i<early.length;i+=4)if((early[i]===32&&early[i+1]===64&&early[i+2]===235)||(early[i]===32&&early[i+1]===208&&early[i+2]===80))throw Error('future scene leaked');
  // 기하 검증: 경계 끝점은 위/오른쪽 변, 반대쪽 꼭짓점은 항상 (0,H).
  for(const p of [.001,.04,.2,.8,1])for(const layer of arReferenceFanLayers(3,p,3,r)){
   if(!(layer.end.y===0||layer.end.x===1))throw Error('fan endpoint is not on border');
   if(layer.cut>3||layer.end.x<0||layer.end.y<0||layer.end.y>1)throw Error('invalid fan geometry');
  }
  // 첫 컷은 같은 장면의 세로 네 영역이 중앙 블록에서 전체 높이로 순차 확장합니다.
  draw(.36*3,3,0);
  for(const x of [65,200,335,470])if(pixel(x,480).slice(0,3).join(',')!=='235,192,32')throw Error('four panel introduction missing');
  if(pixel(65,100).slice(0,3).join(',')==='235,192,32')throw Error('intro starts at full height');
  draw(.70*3,3,0);
  if(pixel(65,100).slice(0,3).join(',')!=='235,192,32'||pixel(470,100).slice(0,3).join(',')==='235,192,32')throw Error('panels must expand one by one');
  draw(.85);const forward=canvas.toDataURL();draw(2.5);draw(.85);
  if(canvas.toDataURL()!==forward)throw Error('seek is not deterministic');
  if(c.globalAlpha!==1||c.getTransform().a!==1||c.globalCompositeOperation!=='source-over')throw Error('canvas state leaked');
  campaign.scenePlan=[];campaign.uploadedPhotos=[photos[0]];
  for(const count of [0,1]){
   const single={photos:photos.slice(0,count),n:count,idx:0,cutIdx:0,cuts:1};
   for(const local of [0,.001,.5,1.8,2.99]){
    c.clearRect(0,0,540,960);arReferenceDiagonalFan(c,540,960,single,r,0,local/3,local,3);
    if(pixel(270,200)[3]!==255)throw Error('empty/single image leaves hole');
   }
  }
  // 바깥 모션 엔진의 기존 명함 엔딩 경로를 그대로 사용하는지 확인합니다.
  let outroCalls=0;const originalOutro=renderInstaOutro;
  renderInstaOutro=()=>outroCalls++;
  renderMotionFrame(c,540,960,12.1,12,4,{name:'시험'},spec,{});
  renderInstaOutro=originalOutro;
  if(outroCalls!==1)throw Error('ending path lost');
  // 음성 기반 가변 컷 길이를 가상 시간으로 바꿀 때 사진 순서가 유지됩니다.
  const oldFit=CUT_LENGTHS;
  CUT_LENGTHS=[.8,2.1,1.2,3.4];TOTAL_DURATION=7.5;OUTRO_DURATION=0;
  const before=JSON.stringify(campaign.cutCaptions);
  for(const t of [0,.79,.81,2.89,2.91,4.11,7.49]){
   arRenderReferenceFrame(c,540,960,toVirtualTime(t),getMainDuration(),4,{},spec);
  }
  if(before!==JSON.stringify(campaign.cutCaptions))throw Error('caption changed');
  CUT_LENGTHS=oldFit;
  window.__diagonalPreviewCanvas=canvas;
  return {id:r.id,name:r.name,colors:found.size};
 });
 for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
  await page.setViewportSize(viewport);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>typeof arReferenceDiagonalFan==='function');
  await page.evaluate(()=>{pdMood='';openPresetDrawer('right');});
  await page.locator('#pdCats button').filter({hasText:/^신규$/}).click();
  await page.locator('button.pd-card').filter({has:page.locator('#pdthumb_'+result.id)}).click();
  assert.equal(await page.evaluate(()=>getActiveDesign().id),result.id);
 }
 if(output){
  const preview=await page.evaluate(async()=>{
   isPlaying=false;AudioEngine.enabled=false;AudioEngine.stopTts();
   const photos=await Promise.all([1,3,5,7].map(i=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=`/assets/topics/cafe/${i}.jpg`;})));
   campaign.uploadedPhotos=photos;campaign.isUserCustomPhotos=true;campaign.scenePlan=[];campaign.cutCountOverride=4;
   campaign.cutCaptions=['장면을 나누고, 순간을 잇다','한 장면에서 다음 장면으로','서로 다른 사진이 만나는 순간','내 사진으로 완성하는 영상'];
   const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;const c=canvas.getContext('2d');
   const r=AR_REFERENCE_STYLES.find(x=>x.layout==='diagonal-fan');
   const draw=t=>arRenderReferenceFrame(c,540,960,t,12,4,{}, {referenceStyle:r});
   const sheet=document.createElement('canvas');sheet.width=1080;sheet.height=1920;const sc=sheet.getContext('2d');
   [1.2,2.1,7.2,10.2].forEach((t,i)=>{draw(t);sc.drawImage(canvas,(i%2)*540,Math.floor(i/2)*960);});
   const still=sheet.toDataURL('image/png');
   draw(0);const stream=canvas.captureStream(30),chunks=[];
   const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:3500000});
   const complete=new Promise(resolve=>{recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=resolve;});
   recorder.start();const start=performance.now();
   await new Promise(resolve=>{function frame(){const t=(performance.now()-start)/1000;draw(Math.min(11.999,t));if(t<12)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
   recorder.stop();await complete;stream.getTracks().forEach(t=>t.stop());
   const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());let binary='';
   for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   return {still,video:btoa(binary)};
  });
  fs.writeFileSync(path.join(output,'diagonal-fan-contact.png'),Buffer.from(preview.still.split(',')[1],'base64'));
  fs.writeFileSync(path.join(output,'diagonal-fan-preview.webm'),Buffer.from(preview.video,'base64'));
 }
 assert.deepEqual(errors,[]);
 console.log('diagonal fan ok:',JSON.stringify(result),'four-panel intro, fixed-pivot history accumulation, no future photos, scene mapping, short cuts, seeking, empty/single photos, ending, timing, mobile/desktop picker');
}catch(error){if(output)await page.screenshot({path:path.join(output,'diagonal-fan-failure.png')});throw error;}
finally{await browser.close();if(server)server.close();}
