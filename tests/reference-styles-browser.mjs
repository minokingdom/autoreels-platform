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
  for(const layout of ['full','inset','polaroid','diagonal','type-cutout','stacked','type-echo','type-flow'])for(const textMotion of ['fade','rise','mask','focus'])for(const camera of ['still','zoom-in','zoom-out','pan-left','pan-right'])for(const transition of ['cut','fade']){
   const r={...base,layout,textMotion,camera,transition};
   for(const t of [.1,2.99,3.01,23.9]){arRenderReferenceFrame(c,540,960,t,24,8,{name:'카페'}, {referenceStyle:r});frames++;}
   if(c.getTransform().a!==1||c.globalAlpha!==1)throw Error('canvas state leaked');
  }
  if(before!==JSON.stringify(campaign.cutCaptions))throw Error('caption mutation');
  // 폴라로이드의 하단 글은 사진 아래 인화지에, 명함 안전 영역 위에 들어가야 합니다.
  const drawn=[], original=c.fillText.bind(c);
  c.fillText=function(text,x,y,...rest){drawn.push({text,y,alpha:this.globalAlpha});return original(text,x,y,...rest);};
  const paper={...base,layout:'polaroid',captionPosition:'bottom',textMotion:'fade',foreground:'#221b19'};
  campaign.cutCaptions[0]='오늘의 사진을 오래 기억하는 따뜻한 손글씨 한 줄';
  arRenderReferenceFrame(c,540,960,.02,24,8,{}, {referenceStyle:paper});
  const early=drawn.filter(x=>x.text.trim());
  if(!early.length||early.some(x=>x.y<=960*.72||x.y>=960*.88||x.alpha>=.5))throw Error('polaroid caption placement/fade failed');
  drawn.length=0;arRenderReferenceFrame(c,540,960,1,24,8,{}, {referenceStyle:paper});
  if(!drawn.some(x=>x.alpha>.99))throw Error('caption did not finish fading in');
  c.fillText=original;
  // 글자 사진 마스크가 비어 있거나 화면 전체에 새지 않고 현재 컷 사진을 쓰는지 확인합니다.
  const photos=['#ef1010','#10ef10'].map(color=>{const im=document.createElement('canvas');im.width=100;im.height=100;const cc=im.getContext('2d');cc.fillStyle=color;cc.fillRect(0,0,100,100);return im;});
  const oldPlan=campaign.scenePlan;campaign.scenePlan=[];
  for(let index=0;index<2;index++){
   c.fillStyle='#ffffff';c.fillRect(0,0,540,960);
   arReferenceComposition(c,540,960,{photos,n:2,idx:index,cutIdx:index,cuts:2},'사진 테스트',{...base,layout:'type-cutout',font:'dohyeon',foreground:'#111111'},index,.5,1);
   const pixels=c.getImageData(0,180,540,440).data;let colored=0;
   for(let i=0;i<pixels.length;i+=4)if(pixels[i+(index===0?0:1)]>150&&pixels[i+(index===0?1:0)]<80)colored++;
   if(colored<300||colored>540*440*.5)throw Error('photo text mask leaked, empty or used another cut');
  }
  campaign.scenePlan=oldPlan;
  const ref={...base,layout:'polaroid'};arRenderReferenceFrame(c,540,960,2,24,8,{name:'카페'}, {referenceStyle:ref});
  return {frames,png:canvas.toDataURL()};
 });
 const ids=await page.evaluate(()=>AR_REFERENCE_STYLES.map(x=>x.id));
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  await page.reload({waitUntil:'load'});
  await page.evaluate(()=>{setIndustry('cafe');Date.now=()=>Math.max(...AR_REFERENCE_STYLES.map(x=>Date.parse(x.addedAt)))+1000;});
  await page.waitForTimeout(500);
  await page.evaluate(()=>{pdMood='';openPresetDrawer('right');});
  console.log('clicking new tab',viewport.width);
  await page.locator('#pdCats button').filter({hasText:/^신규$/}).click();
  for(const id of ids)assert.equal(await page.locator('#pdthumb_'+id).count(),1,'new tab missing '+id);
  const first=ids.at(-1);
  await page.locator('#pdthumb_'+first).click();
  assert.equal(await page.evaluate(()=>getActiveDesign().id),first);
 }
 const categoryCheck=await page.evaluate(()=>{
  const added=Date.parse('2026-11-18T00:00:00Z'),sample={cat:'감성',addedAt:'2026-11-18T00:00:00Z'};
  if(!arDesignMatchesCat(sample,'신규',added+7*86400000-1))throw Error('expired too early');
  if(arDesignMatchesCat(sample,'신규',added+7*86400000))throw Error('did not expire after 7 days');
  if(!arDesignMatchesCat(sample,'감성',added+8*86400000))throw Error('original category lost after expiration');
  if(arDesignIsNew({addedAt:'invalid'},added)||arDesignIsNew(sample,added-1))throw Error('invalid or future date treated as new');
  const cats=DESIGN_CATS.slice(),refs=DESIGN_STYLES.filter(d=>d.referenceStyle);
  for(const d of refs){campaign.designCat=d.cat;if(!getDesignPickerList().some(x=>x.id===d.id))throw Error('original category lost');}
  campaign.designCat='신규';const picked=getDesignPickerList();
  if(refs.some(d=>!picked.some(x=>x.id===d.id)))throw Error('picker new category missing');
  setShuffleIncludeCats(['신규']);randomizePreviewDesignOnly();
  if(!arDesignMatchesCat(getActiveDesign(),'신규'))throw Error('new shuffle selected other category');
  if(refs.some(d=>!window.__arStyleBagKey.split(',').includes(d.id)))throw Error('new shuffle pool missing reference');
  setShuffleIncludeCats([]);return {categories:cats.length,newReferences:refs.length};
 });
 assert.equal(categoryCheck.categories,16);console.log('new category desktop/mobile click + original categories + shuffle ok',categoryCheck);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(repo,'tests/reference-style-preview.png'),Buffer.from(result.png.split(',')[1],'base64'));
 console.log('reference styles browser ok',result.frames,'frames');
}catch(error){await page.screenshot({path:path.join(repo,'tests/reference-style-failure.png')});throw error;}finally{await browser.close();server.close();}
