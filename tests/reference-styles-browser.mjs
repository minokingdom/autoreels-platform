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
  for(const layout of ['full','inset','polaroid','diagonal','diamond-reveal','type-cutout','stacked','type-echo','type-flow','editorial','news-marker','floating-type','type-rail','repeat-poster','chevron-type','brush-frame'])for(const textMotion of ['fade','rise','mask','focus'])for(const camera of ['still','zoom-in','zoom-out','pan-left','pan-right'])for(const transition of ['cut','fade']){
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
 await page.evaluate(()=>{
  const layouts=['type-rail','repeat-poster','chevron-type','brush-frame'];
  const cases=[
   '오늘 카페에서 직접 구운 따뜻한 크루아상과 깊고 진한 풍미의 커피를 함께 즐기며 바쁜 하루 속에서 잠시 쉬어 가세요.',
   '오늘 카페에서 직접 구운 따뜻한 크루아상과 깊고 진한 풍미의 커피를 함께 즐기며 바쁜 하루 속에서 잠시 쉬어 가세요. 내일도 소중한 사람과 함께 편안하게 머무를 수 있도록 좋은 재료와 정성으로 매일 새로운 디저트와 향긋한 커피를 준비하겠습니다.',
   Array.from({length:8},(_,i)=>'문장 '+(i+1)).join('\n'),
   '가나다라마바사아자차카타파하'.repeat(3),'행복',''
  ];
  const c=document.createElement('canvas').getContext('2d');c.canvas.width=540;c.canvas.height=960;
  const image=document.createElement('canvas');image.width=100;image.height=100;
  const S={photos:[image],n:1,idx:0,cutIdx:0,cuts:1};
  const original=c.fillText.bind(c),drawn=[];
  c.fillText=function(text,x,y,...rest){
   const m=this.measureText(text),matrix=this.getTransform();
   drawn.push({text,top:matrix.d*y+matrix.f-m.actualBoundingBoxAscent,bottom:matrix.d*y+matrix.f+m.actualBoundingBoxDescent});
   return original(text,x,y,...rest);
  };
  for(const layout of layouts)for(const caption of cases){
   drawn.length=0;const style=AR_REFERENCE_STYLES.find(s=>s.layout===layout);
   arReferenceComposition(c,540,960,S,caption,style,0,.5,1);
   const compact=s=>s.replace(/\s+/g,'');
   if(caption&&!compact(drawn.map(x=>x.text).join('')).includes(compact(caption)))throw Error(layout+' lost caption ending');
   if(drawn.some(x=>x.top<0||x.bottom>960*.91))throw Error(layout+' caption outside safe area');
  }
 });
 console.log('reference caption multiline, long and unspaced full text + safe area ok');


 const ids=await page.evaluate(()=>AR_REFERENCE_STYLES.map(x=>x.id));
 for(const viewport of [{width:1920,height:910},{width:1280,height:900},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  await page.reload({waitUntil:'load'});
  await page.evaluate(()=>{setIndustry('cafe');Date.now=()=>Math.max(...AR_REFERENCE_STYLES.map(x=>Date.parse(x.addedAt)))+1000;});
  await page.waitForTimeout(500);
  const colorToggle = page.locator('#arQuickBar [data-qb="design"] + #arQuickColors summary');
  const palette = page.locator('#designColorSwatches');
  await colorToggle.click();
  const swatches = palette.getByRole('button');
  await swatches.first().waitFor();
  const paletteCount=await page.evaluate(()=>COLOR_PALETTES.length);
  assert.equal(await swatches.count(),paletteCount);
  const swatchBoxes = await swatches.evaluateAll(buttons=>buttons.map(b=>b.getBoundingClientRect().toJSON()));
  assert.equal(new Set(swatchBoxes.map(b=>b.x)).size,paletteCount);
  assert.equal(new Set(swatchBoxes.map(b=>b.y)).size,1);
  const previewBox = await page.locator('#previewViewport').boundingBox();
  assert.ok(swatchBoxes[0].y >= previewBox.y + previewBox.height - 1);
  await palette.getByRole('button', {name:'레드', exact:true}).click();
  assert.equal(await palette.isVisible(), true);
  assert.equal(await page.evaluate(()=>campaign.colorKey), 'red');
  assert.equal(await page.evaluate(()=>localStorage.getItem('autoreels_color')), 'red');
  assert.equal(await palette.getByRole('button', {name:'레드', exact:true}).getAttribute('aria-pressed'), 'true');
  await palette.getByRole('button', {name:'디자인 기본색', exact:true}).click();
  assert.equal(await page.evaluate(()=>campaign.colorKey), 'default');
  await page.keyboard.press('Escape');
  assert.equal(await palette.isHidden(), true);
  const shuffle = page.locator(viewport.width === 390 ? '#arQuickBar [data-qb="shuffle"]' : '#previewRandomDesignBtnMain');
  await page.evaluate(() => { arQuickRestart(); window.__timelines.main.seek(3); });
  await shuffle.click();
  await page.waitForFunction(() => isPlaying && window.__timelines.main.currentTime < 2);
  const restartTime = await page.evaluate(() => window.__timelines.main.currentTime);
  await page.waitForFunction(t => isPlaying && window.__timelines.main.currentTime > t + 0.3, restartTime);
  await page.evaluate(()=>{pdMood='';openPresetDrawer('right');});
  console.log('clicking new tab',viewport.width);
  assert.ok(await page.locator('#pdCats').evaluate(e=>e.clientHeight>=44),'category row compressed');
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
