import {chromium} from 'playwright';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {buildApp} from '../scripts/build-app.mjs';
const repo=path.resolve(import.meta.dirname,'..'),root=path.join(repo,'public');buildApp(repo);
const server=http.createServer((req,res)=>{let file=path.join(root,req.url.split('?')[0]);if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'studio.html');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();const page=await browser.newPage();
try{
 await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"ok":false}'}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/studio`);await page.waitForFunction(()=>typeof arRenderReferenceFrame==='function');
 const result=await page.evaluate(()=>{
  setIndustry('cafe');const base={id:'ref_0123456789abcdef',name:'분석 렌더 시험',summary:'시험',category:'감성',layout:'full',font:'pretM',captionPosition:'bottom',textMotion:'rise',camera:'zoom-in',transition:'fade',background:'#141414',foreground:'#ffffff',accent:'#ccaa88',captionSize:.06,zoom:.04,shade:.4,grain:.02,entrySeconds:.5};
  campaign.cutCaptions=Array.from({length:8},(_,i)=>`서로 다른 사진과 자막 ${i+1}`);
  const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;const c=canvas.getContext('2d');let frames=0;
  const before=JSON.stringify(campaign.cutCaptions);
  for(const layout of ['full','inset','polaroid'])for(const textMotion of ['fade','rise','mask','focus'])for(const camera of ['still','zoom-in','zoom-out','pan-left','pan-right'])for(const transition of ['cut','fade']){
   const r={...base,layout,textMotion,camera,transition};
   for(const t of [.1,2.99,3.01,23.9]){arRenderReferenceFrame(c,540,960,t,24,8,{name:'카페'}, {referenceStyle:r});frames++;}
   if(c.getTransform().a!==1||c.globalAlpha!==1)throw Error('canvas state leaked');
  }
  if(before!==JSON.stringify(campaign.cutCaptions))throw Error('caption mutation');
  const ref={...base,layout:'polaroid'};arRenderReferenceFrame(c,540,960,2,24,8,{name:'카페'}, {referenceStyle:ref});
  return {frames,png:canvas.toDataURL()};
 });
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(repo,'tests/reference-style-preview.png'),Buffer.from(result.png.split(',')[1],'base64'));
 console.log('reference styles browser ok',result.frames,'frames');
}finally{await browser.close();server.close();}
