const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{let server,browser;try{
server=require('../server');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const root='http://127.0.0.1:'+server.address().port;
browser=await chromium.launch({channel:'chrome',args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
page.on('pageerror',e=>console.log('JS ERROR',e.message));
await page.route('**/api/generate-script',async route=>{
  const b=route.request().postDataJSON();let status=200;
  const res={setHeader(){},status(n){status=n;return this},send(buf){return route.fulfill({status,body:buf,contentType:'video/mp4'})},json(json){return route.fulfill({status,json})}};
  await require('../lib/character-shorts.cjs').handleCharacter(b,res);
});
await page.route('**/api/account?*',r=>r.fulfill({json:{ok:true,user:{id:'test'},entitlement:{pro:true}}}));
await page.goto(root+'/studio',{waitUntil:'domcontentloaded'});
await page.locator('a[href*="story=1"]').click();
await page.locator('#storyTopic').fill('카페 마감 직전에 찾아온 손님');await page.locator('#storyMake').click();
await page.waitForFunction(()=>!document.querySelector('#storyCuts').hidden,null,{timeout:55000});
console.log('draft',await page.locator('#storyPreview').evaluate(v=>[v.videoWidth,v.duration]),await page.locator('#storySceneNav button').count());
await page.locator('#storySceneNav button').nth(1).click();await page.locator('#storyLine').fill('마지막 한 잔, 같이 마셔요.');
await page.locator('#storyAction').selectOption('celebrate');
const before=await page.locator('#storyPreview').getAttribute('src');
await page.locator('#storyRedo').click();
await page.waitForFunction(old=>document.querySelector('#storyPreview').src!==old,before,{timeout:30000});
const fits=await page.evaluate(()=>document.querySelector('#storyPreview').getBoundingClientRect().height<=document.querySelector('.story-screen').clientHeight+1);assert.ok(fits);
await page.locator('#storyEdit').click();
try{await page.waitForFunction(()=>!document.querySelector('#storyMaker').open,null,{timeout:12000})}catch(e){console.log('timeline failed',await page.locator('#storyStatus').textContent());throw e}
console.log('timeline',await page.evaluate(()=>[session.joined.length,sequenceDuration(sequenceTakes(session)),session.captions.map(c=>c.text)]));
await page.evaluate(()=>{effectDialog('효과');});
const btn=page.locator('#fxPresetList button[data-kind="paperConfetti"]');
await btn.click({timeout:4000});
const motion=await page.evaluate(async()=>{
  const c=document.createElement('canvas');c.width=360;c.height=640;const ctx=c.getContext('2d');
  const stats={};
  for(const kind of Object.keys(arMotionLibrary.names)){
    arMotionLibrary.paint(ctx,kind,.2);
    await new Promise(r=>setTimeout(r,150));
    ctx.clearRect(0,0,360,640);arMotionLibrary.paint(ctx,kind,.5);
    stats[kind]=ctx.getImageData(0,0,360,640).data.filter((x,i)=>i%4===3&&x>0).length;
  }return stats;
});console.log('motion pixels',motion);assert(Object.values(motion).every(n=>n>150));
await page.evaluate(()=>document.querySelector('#mixDialog').open&&document.querySelector('#mixDialog').close());
const output=await page.evaluate(async()=>{await exportShortClip(false);return {saved:session.saved,size:session.saved?(await(await fetch(session.saved)).blob()).size:0,effects:session.effects?.length,status:document.querySelector('#status').textContent}});
console.log('export',output);assert(output.size>10000&&output.effects>0);
}finally{await browser?.close();server?.closeAllConnections();server?.close();}})().catch(e=>{console.error(e.message);process.exitCode=1});
