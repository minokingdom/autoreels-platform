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
  let imageFailure=true, quotaExceeded=false;
  await cloud.route('**/api/generate-script',async route=>{
   const body=route.request().postDataJSON();
   requests.push(body);
   if(body.prompt==='bmw 7시리즈 출시'){
    const draft={vehicle:body.vehicle,hook:body.vehicle+' 출시',cutCaptions:[body.vehicle,'외관','실내','주행']};
    return route.fulfill({json:{ok:true,data:draft,variants:[draft,{...draft,hook:'7시리즈 안내'},{...draft,hook:'7시리즈 소개'}],aiFallback:{reason:'timeout'}}});
   }
   if(body.mode==='scene-prompts')return quotaExceeded
    ? route.fulfill({status:429,json:{ok:false,error:'quota_exceeded'}})
    : route.fulfill({json:{ok:true,prompts:['Front','Rear','Interior','On the road']}});
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
  const rewrite=cloud.locator('#scriptRewritePanel');
  const exclusions=rewrite.getByRole('textbox',{name:'제외할 문구'});
  assert.equal(await exclusions.isHidden(),true);
  await rewrite.locator('summary').click();
  await exclusions.fill('무료, 최저가');
  await rewrite.locator('summary').click();
  const editable=rewrite.getByRole('textbox',{name:'원하는 내용과 말투'});
  await editable.fill('bmw 7시리즈 출시');
  const submit=rewrite.getByRole('button',{name:'다시 쓰기',exact:true});
  await Promise.all([cloud.waitForRequest(r=>r.url().includes('/api/generate-script') && r.postDataJSON()?.exclude==='무료, 최저가'),submit.click()]);
  await submit.waitFor();
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
  quotaExceeded=true;
  const beforeQuota=requests.length;
  await photoButton.click();
  await cloud.waitForFunction(()=>!document.getElementById('regenTopicImgBtn').disabled);
  assert.match(await notice.textContent(),/0\/4컷 교체.*기존 사진을 유지.*AI 생성 한도/);
  assert.deepEqual(requests.slice(beforeQuota).map(r=>r.mode),['scene-prompts']);
  assert.deepEqual(await cloud.evaluate(()=>campaign.uploadedPhotos.map(img=>img.src)),final.photos);
  console.log('cloud images preserve the current BMW subject and report replaced cuts or the original photos remaining');
  await cloud.evaluate(()=>{
   arTopicsLoading++;
   arBusinessSpecialty='전기차';
   arSpecialtyIndustry='auto';
   window.arTodayTopic=null;
   arRenderTopics([
    {title:'충전 전 체크',why:'전기차'},
    {title:'겨울철 주행',why:'전기차',iconUrl:'/assets/topics/auto/missing.jpg'}
   ]);
   switchStudioTab('topic');
  });
  const topicCards=cloud.locator('#topicCards');
  await topicCards.locator('img').last().scrollIntoViewIfNeeded();
  await cloud.waitForFunction(()=>[...document.querySelectorAll('#topicCards img')].every(img=>img.naturalWidth>0));
  assert.deepEqual(await topicCards.locator('img').evaluateAll(imgs=>imgs.map(img=>img.getAttribute('src'))),[
   '/assets/topics/auto/1.jpg','/assets/topics/auto/2.jpg'
  ]);

  const openProduct=cloud.locator('#studioPanel_topic button').filter({has:cloud.locator('.ar-product-cover')});
  assert.equal(await openProduct.locator('.bgm-now-go').textContent(),'내 상품 확인 ›');
  await openProduct.click();
  const product=cloud.locator('#productSheet');
  assert.equal(await product.locator('#productExamples').isVisible(),false);
  await product.locator('#inputVehicle').fill('현대 아이오닉 6');
  await product.locator('#inputDiscount').fill('전기차 케어 지원');
  const beforeClose=await cloud.evaluate(()=>{
   window.arTodayTopic={title:'다른 차종 소개',prompt:'BMW X5 하이브리드 소개'};
   return arScriptGenerationId;
  });
  await product.getByRole('button',{name:'닫기'}).click();
  assert.equal(await cloud.evaluate(()=>arScriptGenerationId),beforeClose);
  await topicCards.getByRole('button',{name:/현대 아이오닉 6.*운전석/}).waitFor();
  const firstIdeas=await topicCards.locator('.topic-row strong').allTextContents();
  await cloud.locator('#studioPanel_topic').getByRole('button',{name:/다른 주제/}).click();
  await cloud.waitForFunction(title=>document.querySelector('#topicCards strong')?.textContent!==title,firstIdeas[0]);
  assert.ok((await topicCards.locator('.topic-row strong').allTextContents()).every(title=>title.includes('현대 아이오닉 6')&&!firstIdeas.includes(title)));
  await cloud.evaluate(()=>{
   window.arTodayTopic=null;
   document.getElementById('aiPromptInput').value='BMW X5 하이브리드 소개';
  });
  await openProduct.click();
  await product.getByRole('button',{name:'대본 만들기'}).click();
  await cloud.waitForFunction(previous=>arScriptGenerationId>previous && !window.__arScriptGenerating,beforeClose);
  assert.equal(await product.isVisible(),false);
  assert.equal(await cloud.locator('#studioTabBtn_script').getAttribute('aria-selected'),'true');
  await cloud.waitForFunction(()=>history.state?.arTab==='script' && !history.state?.arOverlay);
  assert.equal(requests.filter(r=>r.prompt==='BMW X5 하이브리드 소개').length,1);
  const enteredRequest=requests.find(r=>r.prompt==='BMW X5 하이브리드 소개');
  assert.deepEqual([enteredRequest.vehicle,enteredRequest.vehicleLocked,enteredRequest.discountNum,enteredRequest.discount],[
   '현대 아이오닉 6',true,0,'전기차 케어 지원'
  ]);
  const direct=await cloud.evaluate(()=>({
   vehicle:campaign.vehicle, captions:campaign.cutCaptions.join(' '), tts:campaign.ttsLines.join(' ')
  }));
  assert.equal(direct.vehicle,'현대 아이오닉 6');
  assert.match(direct.captions,/현대 아이오닉 6.*전기차 케어 지원/);
  assert.doesNotMatch(direct.tts,/BMW|480|3대|즉시출고/);
  const chipRects=await cloud.locator('#studioPanel_script .ig-ctx-chip').evaluateAll(chips=>chips.map(chip=>{
   const rect=chip.getBoundingClientRect();
   const text=chip.querySelector('strong').getBoundingClientRect();
   return {height:rect.height,top:rect.top,textCenter:text.top+text.height/2};
  }));
  assert.equal(chipRects.length,2);
  assert.equal(chipRects[0].height,28);
  assert.deepEqual(chipRects[0],chipRects[1]);
  console.log('topic photos, product-to-script button and aligned chips verified');
  const collectedAt = new Date().toISOString();
  const old = new Date(Date.now() - 86400000).toISOString();
  const kstDate = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'});
  const day = kstDate.format(new Date(collectedAt));
  const yesterday = kstDate.format(new Date(old));
  const feed = {
    source: 'https://trends.google.com/trending/rss?geo=KR', collectedAt,
    items: [{ term:'변상일', startedAt:collectedAt, traffic:'200+' }, { term:'생맥주', startedAt:collectedAt, traffic:'200+' }, { term:'치킨', startedAt:old }],
    previousIssues: [{term:'어제 이슈', day:yesterday, kind:'보도', publisher:'SBS', url:'https://news.sbs.co.kr/test', publishedAt:old}]
  };
  await cloud.route('**/daily-keywords.json', route => route.fulfill({json:feed}));
  await cloud.evaluate(async () => {
    setIndustry('restaurant'); switchStudioTab('topic'); arToggleSheet(false);
    arKeywordDay = ''; await arLoadDailyKeywords();
  });
  const daily = cloud.locator('#dailyKeywords');
  assert.equal(await daily.isVisible(),true);
  assert.equal(await daily.evaluate(el=>el.compareDocumentPosition(document.querySelector('#studioPanel_topic [data-business-product]')) & Node.DOCUMENT_POSITION_FOLLOWING),4);
  assert.equal(await daily.getByRole('button').count(),1);
  await daily.getByRole('button',{name:/생맥주.*200\+/}).click();
  assert.equal(await cloud.locator('#topicCustomInput').inputValue(),'생맥주');
  await cloud.evaluate(async () => { setIndustry('auto'); await arLoadDailyKeywords(); });
  await daily.getByRole('button',{name:/변상일/}).waitFor();
  assert.equal(await daily.getByRole('button').count(),2);
  assert.equal(await daily.getByRole('heading').textContent(),'오늘의 키워드');
  assert.match(await daily.getByRole('status').textContent(),new RegExp(day));
  assert.equal(await daily.getByRole('button',{name:/어제 이슈|치킨/}).count(),0);
  await cloud.evaluate(async () => { setIndustry('restaurant'); await arLoadDailyKeywords(); });
  const refreshDaily = () => cloud.evaluate(async () => { arKeywordDay = ''; await arLoadDailyKeywords(); });
  feed.issues = [
    {term:'수능', day, kind:'일정', publisher:'교육부', url:'https://www.moe.go.kr/boardCnts/viewRenew.do?boardSeq=100526'},
    {term:'시험과 AI 부정행위 논란', day, kind:'보도', publisher:'연합뉴스', url:'https://www.yna.co.kr/view/test', publishedAt:collectedAt}
  ];
  await refreshDaily();
  assert.equal(await daily.getByRole('button').count(),3);
  await daily.getByRole('button',{name:/시험과 AI 부정행위 논란/}).click();
  assert.equal(await cloud.locator('#topicCustomInput').inputValue(),'시험과 AI 부정행위 논란');
  assert.equal(await daily.getByRole('link',{name:'수능 출처 · 교육부'}).count(),1);
  await cloud.evaluate(async () => { setIndustry('auto'); await arLoadDailyKeywords(); });
  await daily.getByRole('button',{name:/변상일/}).waitFor();
  assert.equal(await daily.getByRole('button').count(),4);
  feed.collectedAt = old;
  feed.issues = feed.issues.map(issue=>({...issue,day:yesterday,publishedAt:old}));
  await refreshDaily();
  assert.equal(await daily.getByRole('button').count(),2);
  assert.match(await daily.locator('h3').textContent(),new RegExp(yesterday));
  assert.equal(await daily.getByRole('button',{name:/생맥주/}).count(),0);
  feed.previousIssues = feed.issues;
  feed.issues = [];
  feed.collectedAt = collectedAt;
  feed.items = [];
  await refreshDaily();
  assert.equal(await daily.getByRole('button').count(),2);
  feed.source = 'unverified';
  await refreshDaily();
  assert.equal(await daily.getByRole('button').count(),0);
  assert.equal(await cloud.locator('#storeTopicHeading').textContent(),'우리 가게 추천 주제');
  await cloud.evaluate(()=>{
    campaign.vehicleEntered=false;
    campaign.vehicle='메르세데스 벤츠';
    window.arTodayTopic={title:'AI 부정행위 논란'};
    arFinishScriptApply(4);
  });
  const productName=cloud.locator('#studioPanel_script .ar-product-name');
  assert.equal(await productName.textContent(),'상품 선택');
  await openProduct.click();
  assert.equal(await product.locator('#inputVehicle').inputValue(),'');
  await product.locator('#inputVehicle').fill('두부김치');
  await product.getByRole('button',{name:'닫기'}).click();
  assert.equal(await productName.textContent(),'두부김치');
 }
 assert.deepEqual(errors,[]);console.log('local image browser OK');
} finally {await browser.close();await new Promise(r=>server.close(r));}
