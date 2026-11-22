// 신뢰된 비교/검증 실행기. 모델이 만든 Node 코드나 테스트는 실행하지 않습니다.
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {buildApp} from './build-app.mjs';
import rendererGuard from './alerts/validate-style-renderer.cjs';
import reference from '../lib/reference-style.cjs';
const repo=path.resolve(import.meta.dirname,'..'),root=path.join(repo,'public');
const job=path.resolve(process.argv[2]),out=path.join(job,'proposal');
const candidate=JSON.parse(fs.readFileSync(path.join(out,'candidate.json'),'utf8'));
const style=reference.validateStyle(candidate.style);
if(style.layout==='custom')rendererGuard.validate(candidate.renderer,style.renderer);
const ffmpeg=process.env.FFMPEG||'ffmpeg',ffprobe=process.env.FFPROBE||'ffprobe';
const meta=JSON.parse(execFileSync(ffprobe,['-v','error','-select_streams','v:0','-show_entries','stream=width,height:format=duration','-of','json',path.join(job,'source.mp4')],{encoding:'utf8',windowsHide:true}));
const duration=Number(meta.format.duration),starts=candidate.starts;
assert(duration>0&&duration<=180);assert(Array.isArray(starts)&&starts.length>=2&&starts.length<=21&&starts[0]===0);
assert(Math.abs(starts.at(-1)-duration)<.15);for(let i=1;i<starts.length;i++)assert(starts[i]>starts[i-1]);
const W=360,H=2*Math.round(W*meta.streams[0].height/meta.streams[0].width/2),previewDuration=Math.min(30,duration);
assert(H>=180&&H<=800);buildApp(repo);
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 let file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'studio.html');
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch(),page=await browser.newPage(),errors=[];
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
async function encode(args,frames){
 const p=spawn(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-y',...args],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let err='';p.stderr.on('data',x=>err+=x);const done=new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',n=>n?reject(Error(err)):resolve());});
 if(frames)await frames(p.stdin);p.stdin.end();await done;
}
try{
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.startsWith('/api/')?r.continue():r.fulfill({status:503,body:''});});
 await page.goto(origin+'/studio',{waitUntil:'load'});
 await page.waitForFunction(()=>typeof arRenderReferenceFrame==='function');
 if(style.layout==='custom')await page.addScriptTag({content:candidate.renderer});
 const bars=await page.evaluate(async({W,H,style,starts})=>{
  isPlaying=false;AudioEngine.enabled=false;AudioEngine.stopTts();
  const photos=await Promise.all(Array.from({length:starts.length-1},(_,i)=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=`/assets/topics/cafe/${[1,3,5,7,2,4,6,8].at(i%8)}.jpg`;})));
  campaign.uploadedPhotos=photos;campaign.isUserCustomPhotos=true;campaign.scenePlan=[];campaign.cutCaptions=[];campaign.hook='';
  const render=style.layout==='custom'?window[style.renderer]:style.layout==='photo-montage'?arReferencePhotoMontage:null;
  window.drawProposal=t=>{
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');
   const idx=Math.min(starts.length-2,Math.max(0,starts.findLastIndex(x=>x<=t))),dur=starts[idx+1]-starts[idx],local=t-starts[idx];
   const S={photos,n:photos.length,idx,cutIdx:idx,cuts:photos.length};
   c.fillStyle=style.background;c.fillRect(0,0,W,H);
   if(render)render(c,W,H,S,style,idx,local/dur,local,dur);
   else arRenderReferenceFrame(c,W,H,(idx+local/dur)*2,photos.length*2,photos.length,{}, {referenceStyle:style});
   if(c.globalAlpha!==1||Math.abs(c.getTransform().a-1)>.000001||Math.abs(c.getTransform().e)>.000001||c.filter!=='none')throw Error('renderer_canvas_state_leak');
   return canvas.toDataURL('image/png').split(',')[1];
  };
  // 모든 컷 진입/중간/끝과 역방향 탐색을 실행합니다. 원본 비율과 앱 세로 비율은 별도 스모크에서 확인.
  for(let i=starts.length-2;i>=0;i--)for(const p of [0,.1,.5,.99])window.drawProposal(starts[i]+(starts[i+1]-starts[i])*p);
  // 실제 앱의 세로 비율, 한 장/사진 없음, 짧은 컷도 검사합니다.
  const before=JSON.stringify(campaign.scenePlan);
  for(const size of [[360,640],[1080,1920]])for(const count of [0,1,photos.length]){
   const canvas=document.createElement('canvas');canvas.width=size[0];canvas.height=size[1];const c=canvas.getContext('2d');
   const S={photos:photos.slice(0,count),n:count,idx:0,cutIdx:0,cuts:Math.max(1,count)};
   if(render)for(const idx of [0,1,3,5])for(const p of [0,.5,.99])render(c,size[0],size[1],S,style,idx,p,.2*p,.2);
   if(c.globalAlpha!==1||c.filter!=='none'||Math.abs(c.getTransform().a-1)>.000001)throw Error('portrait state leak');
  }
  if(before!==JSON.stringify(campaign.scenePlan))throw Error('renderer changed scene plan');
  const bar=(height,lines)=>{const b=document.createElement('canvas');b.width=W*2;b.height=height;const c=b.getContext('2d');c.fillStyle='#121820';c.fillRect(0,0,b.width,height);c.fillStyle='#f5f7fa';c.font='bold 18px "Malgun Gothic",sans-serif';lines(c);return b.toDataURL('image/png').split(',')[1];};
  return {header:bar(48,c=>{c.fillText('원본',16,32);c.fillText('구현본 · 샘플 사진',W+16,32);}),footer:bar(52,c=>{c.font='14px "Malgun Gothic",sans-serif';c.fillText('승인 전 미등록 · 편집 효과 비교용',16,22);c.fillText('원본 인물·음악·문구는 구현본에 포함하지 않습니다.',16,43);})};
 },{W,H,style,starts});
 for(const [name,b64] of Object.entries(bars))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(b64,'base64'));
 await encode(['-f','image2pipe','-framerate','24','-i','pipe:0','-an','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'revised.mp4')],async stdin=>{
  for(let f=0;f<Math.ceil(previewDuration*24);f++){const b64=await page.evaluate(t=>window.drawProposal(t),Math.min(duration-.01,f/24));if(!stdin.write(Buffer.from(b64,'base64')))await once(stdin,'drain');}
 });
 await encode(['-i',path.join(job,'source.mp4'),'-i',path.join(out,'revised.mp4'),'-i',path.join(out,'header.png'),'-i',path.join(out,'footer.png'),'-filter_complex',`[0:v]trim=duration=${previewDuration},setpts=PTS-STARTPTS,scale=${W}:${H},setsar=1,fps=24[left];[1:v]setsar=1[right];[left][right]hstack=inputs=2[body];[2:v][body][3:v]vstack=inputs=3[v]`,'-map','[v]','-t',String(previewDuration),'-an','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'original-vs-revised.mp4')]);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({passed:true,frames:Math.ceil(previewDuration*24),duration:previewDuration,renderer:style.renderer||style.layout,tests:['syntax/allowlist','style schema','all cut edges + reverse seek','canvas state','browser page errors','comparison encode']},null,2));
 console.log('proposal preview and checks passed');
}finally{await browser.close();server.close();}
