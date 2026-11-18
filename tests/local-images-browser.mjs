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
 const after=await page.evaluate(()=>({notice:document.getElementById('sceneImageNotice').textContent,photos:campaign.uploadedPhotos?.slice(0,8).map(x=>({src:x?.src,width:x?.naturalWidth,height:x?.naturalHeight})),slots:campaign.scenePlan.slice(0,8).map(x=>x.photoIdx)}));
 assert.match(after.notice,/이미지 8장이 각 컷/);assert.equal(after.photos.length,8);assert(after.photos.every((x,i)=>x.width>0&&x.src.startsWith('data:image/')&&x.src!==before[i]));assert.deepEqual(after.slots,[0,1,2,3,4,5,6,7]);assert.equal(paidCalls,0);assert.equal(new Set(after.photos.map(x=>x.src)).size,8);assert.equal(await page.evaluate(()=>campaign.uploadedPhotos.length),8);assert(!/로컬|이 PC/.test(after.notice));
 console.log(JSON.stringify({live,seconds:(Date.now()-start)/1000,notice:after.notice,paidCalls,dimensions:after.photos.map(x=>[x.width,x.height])}));
 if(!live){
  assert.equal(maxActive,1);assert.equal(images,8);
  const stable=await page.evaluate(()=>campaign.uploadedPhotos.map(x=>x?.src));
  mode='mismatch';await page.locator('#regenTopicImgBtn').click();await page.waitForFunction(()=>!document.getElementById('regenTopicImgBtn').disabled);assert.match(await page.locator('#sceneImageNotice').textContent(),/8컷에 맞는 장면 설명/);assert.equal(images,8);assert.deepEqual(await page.evaluate(()=>campaign.uploadedPhotos.map(x=>x?.src)),stable);
  mode='offline';await page.locator('#regenTopicImgBtn').click();await page.waitForFunction(()=>!document.getElementById('regenTopicImgBtn').disabled);assert.match(await page.locator('#sceneImageNotice').textContent(),/연결할 수 없/);assert.deepEqual(await page.evaluate(()=>campaign.uploadedPhotos.map(x=>x?.src)),stable);assert.equal(paidCalls,0);
  mode='success';const oldImages=images;await page.locator('#regenTopicImgBtn').click();while(images===oldImages)await new Promise(r=>setTimeout(r,30));await page.evaluate(()=>{campaign.cutCaptions=['사용자가 바꾼 새 대본'];});await page.waitForFunction(()=>!document.getElementById('regenTopicImgBtn').disabled);assert.equal(images,oldImages+1);assert.deepEqual(await page.evaluate(()=>campaign.uploadedPhotos.map(x=>x?.src)),stable);assert.equal(paidCalls,0);
  console.log('offline/no-paid-fallback, sequential generation, stale-result protection OK');
  const cloud=await browser.newPage({viewport:{width:390,height:844}});
  cloud.on('pageerror',e=>errors.push(e.message));
  const requests=[];
  let imageFailure=true;
  await cloud.route('**/api/generate-script',async route=>{
   const body=route.request().postDataJSON();
   requests.push(body);
   if(body.prompt==='bmw 7시리즈 출시'){
    const draft={vehicle:body.vehicle,hook:body.vehicle+' 출시',cutCaptions:[body.vehicle,'외관','실내','주행']};
    return route.fulfill({json:{ok:true,data:draft,variants:[draft,{...draft,hook:'7시리즈 안내'},{...draft,hook:'7시리즈 소개'}],aiFallback:{reason:'timeout'}}});
   }
   if(body.mode==='scene-prompts')return route.fulfill({json:{ok:true,prompts:['Front','Rear','Interior','On the road']}});
   if(body.mode==='scene-image')return route.fulfill({json:imageFailure
    ? {ok:false,error:'kie_insufficient_credits'}
    : {ok:true,image:{dataUrl:fixtures[body.index]}}});
   return route.fulfill({status:503,json:{ok:false}});
  });
  await cloud.goto('http://127.0.0.1:4173/studio?localImages=0',{waitUntil:'load'});
  await cloud.evaluate(()=>{
   AR_SERVER.me={user:{id:'mock'},usage:{}};
   campaign.vehicle='BMW 520i M Sport 패키지';
   campaign.cutCountOverride=4;
   switchStudioTab('topic');
  });
  await cloud.locator('#topicCustomInput').fill('bmw 7시리즈 출시');
  await cloud.getByRole('button',{name:'만들기',exact:true}).click();
  await cloud.locator('#aiVariantList').getByText('BMW 7시리즈 출시',{exact:true}).waitFor();
  assert.equal(requests.find(r=>r.prompt==='bmw 7시리즈 출시').vehicle,'BMW 7시리즈');
  await cloud.evaluate(async original=>{
   AR_SERVER.me={user:{id:'mock'},usage:{}};
   campaign.vehicle='BMW 520i M Sport 패키지';
   campaign.cutCountOverride=4;
   campaign.cutCaptions=['BMW','차량 옆모습','실내','주행'];
   window.arTodayTopic={title:'쏘렌토 할인',prompt:'이전 주제'};
   document.getElementById('aiPromptInput').value='bmw 7시리즈 하이브리드';
   const img=new Image();img.src=original;
   await img.decode();
   campaign.uploadedPhotos=Array(6).fill(img);
   switchStudioTab('photo');
  },fixtures[7]);
  const previousPhotos=await cloud.evaluate(()=>campaign.uploadedPhotos.map(img=>img.src));
  const photoButton=cloud.locator('#regenTopicImgBtn');
  const notice=cloud.locator('#sceneImageNotice');
  await photoButton.click();
  await cloud.waitForFunction(()=>!document.getElementById('regenTopicImgBtn').disabled);
  assert.equal(await notice.isVisible(),true);
  assert.match(await notice.textContent(),/0\/4컷 교체.*KIE 크레딧이 부족합니다/);
  assert.deepEqual(await cloud.evaluate(()=>campaign.uploadedPhotos.map(img=>img.src)),previousPhotos);
  imageFailure=false;
  await photoButton.click();
  await cloud.waitForFunction(()=>!document.getElementById('regenTopicImgBtn').disabled);
  assert.match(await notice.textContent(),/BMW 7시리즈 하이브리드.*4장으로 4컷을 교체/);
  const final=await cloud.evaluate(()=>({photos:campaign.uploadedPhotos.map(img=>img.src),slots:campaign.scenePlan.slice(0,4).map(p=>p.photoIdx)}));
  assert.equal(final.photos.length,4);
  assert(final.photos.every((src,index)=>src!==previousPhotos[index]));
  assert.deepEqual(final.slots,[0,1,2,3]);
  assert.equal(new Set(final.photos).size,4);
  const promptRequests=requests.filter(r=>r.mode==='scene-prompts');
  assert.equal(promptRequests.length,2);
  assert(promptRequests.every(r=>r.prompt==='bmw 7시리즈 하이브리드'&&r.vehicle==='BMW 7시리즈 하이브리드'&&r.topic===null));
  assert.equal(requests.filter(r=>r.mode==='scene-image'&&r.imagePrompt.startsWith('Main subject and vehicle identity: BMW 7시리즈 하이브리드.')).length,8);
  console.log('cloud images preserve the current BMW subject and report replaced cuts or the original photos remaining');
 }
 assert.deepEqual(errors,[]);console.log('local image browser OK');
} finally {await browser.close();await new Promise(r=>server.close(r));}
