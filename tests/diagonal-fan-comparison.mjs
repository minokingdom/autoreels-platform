// 실제 앱 렌더 함수를 사용한 배포 전 비교 영상. 원본은 로컬 비교 파일에만 포함합니다.
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {buildApp} from '../scripts/build-app.mjs';
const root=path.resolve(import.meta.dirname,'../public');
const out=process.env.STYLE_COMPARISON_DIR;
const source=process.env.STYLE_SOURCE_VIDEO;
const ffmpeg=process.env.FFMPEG;
if(!out||!source||!ffmpeg)throw Error('STYLE_COMPARISON_DIR, STYLE_SOURCE_VIDEO, FFMPEG 필요');
fs.mkdirSync(out,{recursive:true});buildApp(path.dirname(root));
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local');
 let file=path.join(root,url.pathname);
 if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'studio.html');
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');
 res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(),page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function encode(args,frames){
 const proc=spawn(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-y',...args],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let stderr='';proc.stderr.on('data',x=>stderr+=x);
 const done=new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('close',n=>n?reject(Error(stderr)):resolve());});
 if(frames)await frames(proc.stdin);proc.stdin.end();await done;
}
try{
 await page.route('**/api/**',r=>r.fulfill({status:503,json:{ok:false}}));
 await page.goto(`http://127.0.0.1:${server.address().port}/studio`,{waitUntil:'load'});
 await page.waitForFunction(()=>typeof arReferenceFanLayers==='function');
 const bars=await page.evaluate(async()=>{
  isPlaying=false;AudioEngine.enabled=false;AudioEngine.stopTts();
  const photos=await Promise.all([1,3,5,7,2,4,6,8].map(n=>new Promise((resolve,reject)=>{
   const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=`/assets/topics/cafe/${n}.jpg`;
  })));
  campaign.uploadedPhotos=photos;campaign.isUserCustomPhotos=true;campaign.scenePlan=[];
  const r={...AR_REFERENCE_STYLES.find(x=>x.layout==='diagonal-fan'),camera:'still'};
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
  const c=canvas.getContext('2d');
  // 원본의 시작 도입과 사선 누적 구간을 같은 시간축으로 비교. 고객 음성 길이 변경 없음.
  const starts=[0,3.45,4.45,5.5,6.6,7.5,8.5,9.5,10.6];
  window.drawComparison=t=>{
   const idx=Math.max(0,Math.min(7,starts.findLastIndex(x=>x<=t)));
   const dur=starts[idx+1]-starts[idx],local=t-starts[idx];
   arReferenceDiagonalFan(c,640,360,{photos,n:8,idx,cutIdx:idx,cuts:8},r,idx,local/dur,local,dur);
   return canvas.toDataURL('image/png').split(',')[1];
  };
  const bar=(height,draw)=>{const b=document.createElement('canvas');b.width=1280;b.height=height;const bc=b.getContext('2d');bc.fillStyle='#121820';bc.fillRect(0,0,1280,height);bc.fillStyle='#f4f6f9';bc.font='bold 23px "Malgun Gothic",sans-serif';draw(bc);return b.toDataURL('image/png').split(',')[1];};
  return {header:bar(60,bc=>{bc.fillText('원본 · 작품 영역',22,39);bc.fillText('수정본 · 샘플 사진',662,39);}),footer:bar(40,bc=>{bc.font='18px "Malgun Gothic",sans-serif';bc.fillStyle='#bac3cf';bc.fillText('세로 4분할 → 왼쪽 아래 고정점 → 이전 장면 누적  |  운영 반영 전 비교',22,27);})};
 });
 for(const [name,b64] of Object.entries(bars))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(b64,'base64'));
 await encode(['-f','image2pipe','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'revised.mp4')],async stdin=>{
  for(let frame=0;frame<294;frame++){
   const b64=await page.evaluate(t=>window.drawComparison(t),frame/30);
   if(!stdin.write(Buffer.from(b64,'base64')))await once(stdin,'drain');
   if(frame%60===0)console.log(`render ${frame}/294`);
  }
 });
 await encode(['-i',source,'-i',path.join(out,'revised.mp4'),'-i',path.join(out,'header.png'),'-i',path.join(out,'footer.png'),'-filter_complex','[0:v]trim=duration=9.8,setpts=PTS-STARTPTS,crop=720:405:0:152,scale=640:360,setsar=1,fps=30[left];[1:v]setsar=1[right];[left][right]hstack=inputs=2[body];[2:v][body][3:v]vstack=inputs=3[v]','-map','[v]','-t','9.8','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'original-vs-revised.mp4')]);
 await encode(['-ss','7.9','-i',path.join(out,'original-vs-revised.mp4'),'-frames:v','1',path.join(out,'comparison-still.png')]);
 assert.deepEqual(errors,[]);console.log('comparison ready:',path.join(out,'original-vs-revised.mp4'));
}finally{await browser.close();server.close();}
