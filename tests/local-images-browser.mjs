import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { buildApp } from '../scripts/build-app.mjs';
const root=path.resolve('public'); buildApp(process.cwd());
const live=process.argv.includes('--live');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});res.end('{"ok":false}');return;}
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(root,'studio.html');
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm'};
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 const fixtures=await page.evaluate(()=>Array.from({length:8},(_,i)=>{const c=document.createElement('canvas');c.width=8;c.height=8;const x=c.getContext('2d');x.fillStyle=`hsl(${i*40},70%,50%)`;x.fillRect(0,0,8,8);return c.toDataURL('image/png')}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let paidCalls=0;page.on('request',r=>{if(r.url().includes('/api/generate-script')&&/scene-image|scene-prompts/.test(r.postData()||''))paidCalls++;});
 let mode='success',active=0,maxActive=0,images=0;
 if(!live)await page.route('http://127.0.0.1:8193/**',async route=>{
   const cors={'access-control-allow-origin':'http://127.0.0.1:4173','access-control-allow-headers':'content-type,x-autoreels-local','access-control-allow-methods':'GET,POST,OPTIONS'};
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(mode==='offline')return route.abort('connectionrefused');
   let result;
   if(route.request().url().endsWith('/health'))result={ok:true,service:'autoreels-local-images'};
   else {const body=route.request().postDataJSON();assert.equal(body.adminGeminiKey,undefined);
    if(body.mode==='scene-prompts'){assert.equal(body.count,8);assert.equal(body.captions.length,8);result={ok:true,prompts:Array(mode==='mismatch'?4:body.count).fill('Photorealistic cafe latte.')};}
    else {images++;active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,250));active--;result={ok:true,image:{index:body.index,dataUrl:fixtures[body.index]}};}
   }
   return route.fulfill({status:200,headers:cors,contentType:'application/json',body:JSON.stringify(result)});
 });
 await page.goto('http://127.0.0.1:4173/studio?localImages=1&ind=cafe',{waitUntil:'load',timeout:90000});
 await page.evaluate(()=>{setIndustry('cafe');window.arTodayTopic={title:'가을 라떼와 크루아상',why:'따뜻한 카페 시간'};campaign.vehicle='가을 라떼와 크루아상';BASE_DURATION=20;delete campaign.cutCountOverride;campaign.cutCaptions=['따뜻한 라떼 한 잔','바삭한 버터 크루아상','햇살 가득한 창가 자리','향긋한 원두','정성껏 내리는 커피','포근한 카페 소파','친구와 나누는 디저트','오늘도 편하게 쉬어 가세요'];switchStudioTab('photo');});
 assert.equal(await page.evaluate(()=>arUseLocalSceneImages()),true);
 const before=await page.evaluate(()=>campaign.uploadedPhotos?.map(x=>x?.src)||[]);
 const start=Date.now();await page.locator('#regenTopicImgBtn').click();
 await page.waitForFunction(()=>document.getElementById('regenTopicImgBtn').disabled===false,null,{timeout:360000});
 const after=await page.evaluate(()=>({notice:document.getElementById('aiGenNotice').textContent,photos:campaign.uploadedPhotos?.slice(0,8).map(x=>({src:x?.src,width:x?.naturalWidth,height:x?.naturalHeight})),slots:campaign.scenePlan.slice(0,8).map(x=>x.photoIdx)}));
 assert.match(after.notice,/이미지 8장이 각 컷/);assert.equal(after.photos.length,8);assert(after.photos.every((x,i)=>x.width>0&&x.src.startsWith('data:image/')&&x.src!==before[i]));assert.deepEqual(after.slots,[0,1,2,3,4,5,6,7]);assert.equal(paidCalls,0);assert.equal(new Set(after.photos.map(x=>x.src)).size,8);assert.equal(await page.evaluate(()=>campaign.uploadedPhotos.length),8);assert(!/로컬|이 PC/.test(after.notice));
 console.log(JSON.stringify({live,seconds:(Date.now()-start)/1000,notice:after.notice,paidCalls,dimensions:after.photos.map(x=>[x.width,x.height])}));
 if(!live){
  assert.equal(maxActive,1);assert.equal(images,8);
  const stable=await page.evaluate(()=>campaign.uploadedPhotos.map(x=>x?.src));
  mode='mismatch';await page.locator('#regenTopicImgBtn').click();await page.waitForFunction(()=>!document.getElementById('regenTopicImgBtn').disabled);assert.match(await page.locator('#aiGenNotice').textContent(),/8컷에 맞는 장면 설명/);assert.equal(images,8);assert.deepEqual(await page.evaluate(()=>campaign.uploadedPhotos.map(x=>x?.src)),stable);
  mode='offline';await page.locator('#regenTopicImgBtn').click();await page.waitForFunction(()=>!document.getElementById('regenTopicImgBtn').disabled);assert.match(await page.locator('#aiGenNotice').textContent(),/연결할 수 없/);assert.deepEqual(await page.evaluate(()=>campaign.uploadedPhotos.map(x=>x?.src)),stable);assert.equal(paidCalls,0);
  mode='success';const oldImages=images;await page.locator('#regenTopicImgBtn').click();while(images===oldImages)await new Promise(r=>setTimeout(r,30));await page.evaluate(()=>{campaign.cutCaptions=['사용자가 바꾼 새 대본'];});await page.waitForFunction(()=>!document.getElementById('regenTopicImgBtn').disabled);assert.equal(images,oldImages+1);assert.deepEqual(await page.evaluate(()=>campaign.uploadedPhotos.map(x=>x?.src)),stable);assert.equal(paidCalls,0);
  console.log('offline/no-paid-fallback, sequential generation, stale-result protection OK');
 }
 assert.deepEqual(errors,[]);console.log('local image browser OK');
} finally {await browser.close();await new Promise(r=>server.close(r));}
