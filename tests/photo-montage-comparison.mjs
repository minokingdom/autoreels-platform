// 승인용 비교: 실제 앱 렌더러와 원본을 같은 시간축에서 나란히 인코딩합니다.
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {buildApp} from '../scripts/build-app.mjs';
const repo=path.resolve(import.meta.dirname,'..'),root=path.join(repo,'public');
const out=process.env.STYLE_COMPARISON_DIR,source=process.env.STYLE_SOURCE_VIDEO,ffmpeg=process.env.FFMPEG;
if(!out||!source||!ffmpeg)throw Error('비교 파일 경로 필요');
fs.mkdirSync(out,{recursive:true});buildApp(repo);
const server=http.createServer((req,res)=>{
 let file=path.join(root,new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'studio.html');
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(),page=await browser.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function encode(args,frames){
 const proc=spawn(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-y',...args],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let err='';proc.stderr.on('data',x=>err+=x);
 const done=new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('close',n=>n?reject(Error(err)):resolve());});
 if(frames)await frames(proc.stdin);proc.stdin.end();await done;
}
try{
 await page.route('**/api/**',r=>r.fulfill({status:503,json:{ok:false}}));
 await page.goto(`http://127.0.0.1:${server.address().port}/studio`,{waitUntil:'load'});
 await page.waitForFunction(()=>typeof arReferencePhotoMontage==='function');
 const bars=await page.evaluate(async()=>{
  isPlaying=false;AudioEngine.enabled=false;AudioEngine.stopTts();
  const photos=await Promise.all([1,3,5,7,2,4,6].map(n=>new Promise((resolve,reject)=>{
   const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=`/assets/topics/cafe/${n}.jpg`;
  })));
  campaign.uploadedPhotos=photos;campaign.isUserCustomPhotos=true;campaign.scenePlan=[];
  const r={background:'#08090b',foreground:'#ffffff',camera:'still',shade:0,zoom:0,entrySeconds:.5};
  const canvas=document.createElement('canvas');canvas.width=480;canvas.height=600;const c=canvas.getContext('2d',{willReadFrequently:true});
  const starts=[0,1.45,3.0,4.23,6.23,8.2,10.07,12.1];
  window.drawComparison=t=>{
   c.reset();
   const idx=Math.max(0,Math.min(6,starts.findLastIndex(x=>x<=t))),dur=starts[idx+1]-starts[idx],local=t-starts[idx];
   arReferencePhotoMontage(c,480,600,{photos,n:7,idx,cutIdx:idx,cuts:7},r,idx,local/dur,local,dur);
   return canvas.toDataURL('image/png').split(',')[1];
  };
  const bar=(height,draw)=>{const b=document.createElement('canvas');b.width=960;b.height=height;const bc=b.getContext('2d');bc.fillStyle='#121820';bc.fillRect(0,0,960,height);bc.fillStyle='#f4f6f9';bc.font='bold 21px "Malgun Gothic",sans-serif';draw(bc);return b.toDataURL('image/png').split(',')[1];};
  // 탐색은 순차 재생과 같아야 합니다. 상태/필터는 밖으로 새지 않습니다.
  window.drawComparison(2.2);window.debugBefore=canvas.toDataURL();const before=c.getImageData(0,0,480,600).data;window.drawComparison(9);window.drawComparison(2.2);window.debugAfter=canvas.toDataURL();
  const after=c.getImageData(0,0,480,600).data;let error=0;for(let i=0;i<before.length;i++)error+=Math.abs(before[i]-after[i]);
  if(error/before.length>.5)throw Error('seek mismatch '+error/before.length);
  if(c.filter!=='none'||c.globalAlpha!==1||c.getTransform().a!==1)throw Error('canvas state leak');
  return {header:bar(60,bc=>{bc.fillText('원본',22,39);bc.fillText('구현본 · 샘플 사진',502,39);}),footer:bar(64,bc=>{bc.font='17px "Malgun Gothic",sans-serif';bc.fillStyle='#bac3cf';bc.fillText('콜라주 확대 → 사선 선명 마스크 → 사진 겹침 → 초점 표시',22,26);bc.fillText('승인 전 미등록 · 원본 음악·인물·문구는 구현본에 포함하지 않음',22,51);})};
 });
 for(const [name,b64] of Object.entries(bars))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(b64,'base64'));
 await encode(['-f','image2pipe','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'revised.mp4')],async stdin=>{
  for(let frame=0;frame<363;frame++){
   const b64=await page.evaluate(t=>window.drawComparison(t),frame/30);
   if(!stdin.write(Buffer.from(b64,'base64')))await once(stdin,'drain');
   if(frame%90===0)console.log(`render ${frame}/363`);
  }
 });
 await encode(['-i',source,'-i',path.join(out,'revised.mp4'),'-i',path.join(out,'header.png'),'-i',path.join(out,'footer.png'),'-filter_complex','[0:v]trim=duration=12.1,setpts=PTS-STARTPTS,scale=480:600,setsar=1,fps=30[left];[1:v]setsar=1[right];[left][right]hstack=inputs=2[body];[2:v][body][3:v]vstack=inputs=3[v]','-map','[v]','-t','12.1','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'original-vs-revised.mp4')]);
 await encode(['-ss','5.2','-i',path.join(out,'original-vs-revised.mp4'),'-frames:v','1',path.join(out,'comparison-still.png')]);
 assert.deepEqual(errors,[]);console.log('comparison ready');
}catch(e){for(const name of ['debugBefore','debugAfter']){const data=await page.evaluate(n=>window[n],name);if(data)fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));}throw e;}finally{await browser.close();server.close();}
