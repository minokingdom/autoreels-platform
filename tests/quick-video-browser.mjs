import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const {planMontage} = await import('../public/assets/shorts/montage.mjs');
const samples=Array.from({length:93},(_,i)=>({t:(i+1)/2,score:i>=18 && i<=29?0:8}));
const levels=Array.from({length:470},(_,i)=>i>=85 && i<155?0:.04);
const natural=planMontage(47,samples,levels);
assert.equal(natural.segments.length,2);
assert.equal(natural.segments[0].start,0);
assert.equal(natural.segments.at(-1).end,47);
assert.equal(planMontage(47,samples,levels.map(()=>.06)).segments.length,1);
assert.equal(planMontage(47,samples,[]).segments.length,1);

const root = fileURLToPath(new URL('../public/',import.meta.url));
const browser = await chromium.launch(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {});
try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors = [], requests = [], posts=[];
  page.on('console',msg=>{if(msg.type()==='warning' && msg.text().includes('장면 분석 중단')) console.warn(msg.text());});
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*',async route => {
    const url = new URL(route.request().url());
    if (url.protocol === 'blob:') return route.continue();
    if (url.hostname !== 'localhost') return route.abort();
    if (url.pathname === '/api/account') {
      requests.push(url.searchParams.get('action'));
      return route.fulfill({json:{ok:true,user:{id:'test'},entitlement:{pro:true}}});
    }
    if(url.pathname==='/api/sns') {
      const action=url.searchParams.get('action');
      if(action==='status')return route.fulfill({json:{ok:true,targets:{instagram:{ready:true,connected:true,name:'@test'}}}});
      if(action==='upload-token')return route.fulfill({json:{ok:true,pathname:'video.mp4',clientToken:'mock',contentType:'video/mp4'}});
      if(action==='publish'){posts.push(route.request().postDataJSON());return route.fulfill({json:{ok:true,jobs:[{id:'1',status:'processing',target:'instagram'}]}});}
      if(action==='jobs') return route.fulfill({json:{ok:true,jobs:[{id:'1',status:'done',target:'instagram'}]}});
    }
    if (url.pathname.startsWith('/api/')) return route.fulfill({json:{}});
    const file = path.join(root,url.pathname === '/studio' ? 'studio.html' : url.pathname);
    try { await route.fulfill({path:file}); } catch { await route.abort(); }
  });
  async function verifySourceWave(filename,large=false,nativeOnly=false){
    await page.goto('http://localhost/assets/shorts/index.html?mode=edit',{waitUntil:'load'});
    if(nativeOnly)await page.evaluate(()=>Object.defineProperty(window,'AudioDecoder',{value:undefined,configurable:true}));
    const data=await fs.readFile(filename);
    await page.evaluate(({bytes,large})=>{
      const parts=[Uint8Array.from(bytes)];
      if(large){
        // 유효한 MP4 free box로 영상 컨테이너의 크기만 키운다.
        const block=new Uint8Array(1024*1024);
        const header=new Uint8Array([0,0,0,0,102,114,101,101]);
        new DataView(header.buffer).setUint32(0,65*block.length+8);
        parts.push(header,...Array(65).fill(block));
      }
      const file=new File(parts,'wave.mp4',{type:'video/mp4'});
      if(large)file.arrayBuffer=async()=>{throw Error('전체 영상 메모리 복사');};
      const transfer=new DataTransfer();transfer.items.add(file);
      fileInput.files=transfer.files;fileInput.dispatchEvent(new Event('change'));
    },{bytes:[...data],large});
    await page.waitForFunction(()=>session?.clip?.waveform?.state==='ready',{},{timeout:25000});
    const result=await page.evaluate(()=>{
      const c=byId('trackWave'),pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      return {size:session.file.size,duration:video.duration,bins:session.clip.waveform.levels.length,
        peak:session.clip.waveform.peak,visible:!c.hidden && pixels.some((value,i)=>i%4===3&&value>0)};
    });
    assert.ok(result.visible && result.peak>0 && result.bins>=Math.floor(result.duration*10)-1,JSON.stringify(result));
    console.log('원본 파형',result.size,result.duration,result.bins,nativeOnly?'브라우저 오디오 디코더':'기본 디코더');
  }
  const speechFixture=path.join(root,'assets/remix/fixtures/remix-spoken-ko.mp4');
  await verifySourceWave(speechFixture,true);
  await verifySourceWave(speechFixture,true,true);
  let unblockAnalysis,analysisRequested;
  const blocked=new Promise(resolve=>{unblockAnalysis=resolve;});
  const requested=new Promise(resolve=>{analysisRequested=resolve;});
  const delayAnalysis=async route=>{analysisRequested();await blocked;await route.fallback();};
  await page.route('**/montage.mjs*',delayAnalysis);
  try{
    await page.goto('http://localhost/assets/shorts/index.html?mode=edit');
    await page.locator('#file').setInputFiles(fileURLToPath(new URL('./fixtures/montage-transition.webm',import.meta.url)));
    await requested;
    assert.ok(await page.locator('#play').isEnabled(),'분석 중 재생 가능');
    assert.ok(await page.locator('#analysisInfo').isVisible());
    await page.locator('#fxLanes').getByRole('button',{name:'＋ 효과 추가'}).click();
    await page.getByRole('button',{name:'펀치 줌 효과 추가',exact:true}).click();
    await page.locator('#mixDone').click();
    await page.locator('#trackCursor').fill('1.2');
    await page.locator('#play').click();
    await page.waitForFunction(()=>!video.paused && video.currentTime>1.4);
    unblockAnalysis();await page.locator('#applyReadyPlan').waitFor();
    const state=await page.evaluate(()=>({time:video.currentTime,playing:!video.paused,fx:session.effects.length,plan:session.clip.montage}));
    assert.ok(state.time>=1.4 && (state.playing || await page.locator('#sourceVideo').evaluate(v=>v.ended||v.currentTime>=v.duration-.1)),'분석 완료 시 재생 위치와 상태 유지');
    assert.equal(state.fx,1);assert.ok(!state.plan,'보고 있는 편집본 보존');
    await page.locator('#applyReadyPlan').click();
    assert.ok(await page.evaluate(()=>!!session.clip.montage));
    assert.equal(await page.locator('#fxLanes .fx-block').count(),1);
    console.log('장면 분석 중 재생·효과 추가 및 편집본 적용 확인');
  }finally{unblockAnalysis();await page.unroute('**/montage.mjs*',delayAnalysis);}
  await page.goto('http://localhost/studio',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => typeof arOpenQuickVideoEditor === 'function');
  const before = () => page.evaluate(() => [campaign.uploadedPhotos.length,campaign.designStyle,TOTAL_DURATION]);
  const original = await before();
  const fixture = new URL('./fixtures/remix-caption.webm',import.meta.url);
  const editorButton = page.getByRole('button', {name:/^영상 편집기/});
  await editorButton.click();
  const frame = page.frameLocator('dialog.ar-video-editor iframe');
  await frame.getByRole('heading', {name:'영상 편집기',exact:true}).waitFor();
  const openSettings=async()=>{
    const track=frame.locator('#cutTimeline.has-media');
    await track.waitFor();
    const geometry=await track.evaluate(el=>{
      const stage=document.querySelector('.stage').getBoundingClientRect(),board=el.getBoundingClientRect();
      return {gap:Math.abs(stage.bottom-board.top),bottom:board.bottom,height:innerHeight};
    });
    assert.ok(geometry.gap<3 && geometry.bottom<=geometry.height,'미리보기 아래에 타임라인 전체가 보여야 함');
    assert.equal(await frame.locator('[data-track]:visible').count(),6);
    await frame.locator('#mixSettings').click();
  };
  const chooser = page.waitForEvent('filechooser');
  await frame.locator('#emptyVideoPick').click();
  await (await chooser).setFiles({name:'test.webm',mimeType:'video/webm',buffer:await fs.readFile(fixture)});
  await openSettings();
  await frame.locator('#quickControls').waitFor({timeout:15000});
  await frame.getByRole('heading', {name:'타임라인',exact:true}).waitFor();
  assert.equal(await frame.locator('#trimEnd').inputValue(),'1');
  assert.equal(await frame.locator('#guideForm').isVisible(),false);
  await frame.locator('#useManual').click();
  await frame.locator('#trimStart').fill('0.2');
  await frame.locator('#speed').selectOption('1.25');
  await frame.locator('#sourceSound').uncheck();
  await frame.locator('#music').selectOption({index:1});
  await frame.locator('#clipTitle').fill('제목');
  await frame.locator('#lineFields textarea').fill('자막');
  await frame.locator('#captionStyle').selectOption('outline');
  await frame.locator('#play').click();
  assert.equal(await frame.locator('video').evaluate(el => el.muted && el.playbackRate === 1.25),true);
  await frame.locator('#save').click();
  try { await frame.locator('#download').waitFor({timeout:20000}); }
  catch (err) { throw Error((await frame.locator('#status').textContent()) + ' ' + errors.join(', '),{cause:err}); }
  assert.equal(requests.filter(a => a === 'consume-export').length,1);
  const resolution = await frame.locator('#download').evaluate(async el => {
    const out = document.createElement('video'); out.src = el.href;
    await new Promise((resolve,reject) => { out.onloadedmetadata = resolve; out.onerror = reject; });
    return [out.videoWidth,out.videoHeight];
  });
  assert.deepEqual(resolution,[1080,1920]);
  await frame.getByText('스튜디오로 돌아가기').click();
  await page.locator('dialog.ar-video-editor').waitFor({state:'detached'});
  assert.deepEqual(await before(),original);
  await page.locator('#quickShortVideoInput').setInputFiles(path.join(root,'assets/remix/fixtures/remix-spoken-ko.mp4'));
  await openSettings();
  try {await frame.locator('#highlightEditor').waitFor({timeout:9000});} catch(e){throw Error(JSON.stringify(await frame.locator('#work').evaluate(el=>({status:statusLine.textContent,analysis:byId('montageStatus').textContent,ready:video.readyState,plan:!!session?.plan,src:video.error?.message,progress:byId('montageProgress').value})))+' '+errors.join(', '),{cause:e});}
  const times=await frame.locator('#sourceVideo').evaluate(el=>[session.clip.montage[0].start,session.clip.montage.at(-1).end,el.duration]);
  assert.deepEqual(times,[0,times[2],times[2]]);
  await frame.locator('#editCursor').fill('1.5');
  await frame.locator('#setPeak').click();
  assert.match(await frame.locator('#peakTime').textContent(),/1.5초/);
  await frame.locator('#previewPeak').click();
  await frame.locator('#sourceVideo').evaluate(el=>new Promise(resolve=>el.addEventListener('pause',resolve,{once:true})));
  await frame.locator('#postCaption').fill('편집한 영상');
  await frame.locator('#postVideo').evaluate(()=>{arLoadBlobClient=async()=>({put:async(path,blob)=>{
    if(blob.type!=='video/mp4'||blob.size<1000) throw Error('MP4 누락');
    return {url:'https://example.test/video.mp4'};
  }});});
  await frame.locator('#postVideo').click();
  await frame.getByText('게시 완료',{exact:true}).waitFor({timeout:25000});
  assert.equal(posts.length,1); assert.deepEqual(posts[0].targets,['instagram']);
  assert.equal(posts[0].caption,'편집한 영상');
  assert.equal(requests.filter(a=>a==='consume-export').length,1);
  assert.equal(await frame.locator('#postVideo').isDisabled(),true);
  await frame.getByText('스튜디오로 돌아가기').click();
  await page.locator('dialog.ar-video-editor').waitFor({state:'detached'});
  await page.locator('#quickShortVideoInput').setInputFiles(fileURLToPath(new URL('./fixtures/montage-transition.webm',import.meta.url)));
  await openSettings();
  try {await frame.locator('#highlightEditor').waitFor({timeout:12000});} catch(e){throw Error(JSON.stringify(await frame.locator('body').evaluate(el=>({status:statusLine.textContent,pct:byId('montageProgress').value,controls:byId('quickControls').hidden,work:byId('work').hidden,style:getComputedStyle(byId('highlightEditor')).display,ready:video.readyState,src:video.error?.message,plan:!!session?.plan})))+' '+errors.join(', '),{cause:e});}
  await frame.locator('#editCursor').fill('2.2'); await frame.locator('#setPeak').click();
  const edgePixel = () => frame.locator('#overlay').evaluate(canvas=>{
    renderPreview();return canvas.getContext('2d').getImageData(canvas.width/2,canvas.height*.30,1,1).data[0];
  });
  await frame.locator('#editCursor').fill('2.1');
  await frame.locator('#sourceVideo').evaluate(el=>el.seeking?new Promise(r=>el.addEventListener('seeked',r,{once:true})):null);
  const withEffect=await edgePixel();
  await frame.locator('#peakEffect').uncheck();
  assert.ok(await edgePixel()>withEffect,'하이라이트 직전의 강조 효과 전환');
  await frame.locator('#peakEffect').check();
  // 고정된 컷 경계로 전환 효과의 미리보기와 MP4 합성을 각각 확인한다.
  await frame.locator('#sourceVideo').evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280;
    const ctx=canvas.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,720,1280);
    session.plan.segments=[{start:0,end:1.8},{start:3.6,end:6,transition:{kind:'dissolve',frame:canvas}}];
    session.clip.peak=null;updateHighlightEdit(session);
  });
  const switchEffect = frame.locator('#sceneTransitions');
  await switchEffect.waitFor();
  assert.equal(await switchEffect.isChecked(),false); await switchEffect.check();
  // 순색 두 장면의 경계에서 양쪽 색이 함께 보이는지 미리보기와 인코딩한 MP4에서 확인.
  const samplePreview = () => frame.locator('#overlay').evaluate(canvas => {
    const ctx=canvas.getContext('2d');
    return Array.from(ctx.getImageData(canvas.width/2,canvas.height/2,1,1).data);
  });
  await frame.locator('#sourceVideo').evaluate(async el => {
    const boundary=session.clip.montage[1].start;
    await new Promise(resolve => {el.addEventListener('seeked',resolve,{once:true});el.currentTime=boundary+.18;});
  });
  const blended=await samplePreview();
  assert.ok(blended[0]>50 && blended[2]>50,'미리보기 디졸브 '+blended);
  await switchEffect.uncheck();
  const plain=await samplePreview();
  assert.ok(plain[0]<20 && plain[2]>200,'전환 끄기 '+plain);
  await switchEffect.check();
  await frame.locator('#save').click();
  await frame.locator('#download').waitFor({timeout:20000});
  const mixedFrames=await frame.locator('#download').evaluate(async el => {
    const out=document.createElement('video');out.playsInline=true;out.muted=true;out.src=el.href;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    let mixed=0;
    const sample=() => {
      ctx.drawImage(out,0,0,1,1);
      const rgba=ctx.getImageData(0,0,1,1).data;
      if(rgba[0]>40 && rgba[2]>40) mixed++;
      if(!out.ended) out.requestVideoFrameCallback(sample);
    };
    out.requestVideoFrameCallback(sample);await out.play();
    await new Promise((resolve,reject) => {
      const timer=setTimeout(()=>reject(Error('전환 MP4 재생 시간 초과')),10000);
      out.onended=()=>{clearTimeout(timer);resolve();};
    });
    return mixed;
  });
  assert.ok(mixedFrames>=2,'완성 MP4에 두 장면이 섞인 프레임 '+mixedFrames);
  console.log('미리보기 전환 켜기·끄기 및 MP4 디졸브 확인',mixedFrames+' 프레임');
  await frame.getByText('스튜디오로 돌아가기').click();
  await page.locator('dialog.ar-video-editor').waitFor({state:'detached'});
  const one=fileURLToPath(new URL('./fixtures/remix-caption.webm',import.meta.url));
  const two=fileURLToPath(new URL('./fixtures/montage-transition.webm',import.meta.url));
  await page.locator('#quickShortVideoInput').setInputFiles([one,two]);
  await openSettings();
  try {await frame.getByText('2개 영상 · 이어붙인 길이 7.0초').waitFor({timeout:9000});} catch(err){throw Error(await frame.locator('#work').innerText()+' '+errors.join(', '),{cause:err});}
  await frame.locator('.join-row').nth(1).getByText('앞으로').click();
  assert.match(await frame.locator('.join-row').first().textContent(),/montage-transition/);
  await frame.locator('#joinFiles').setInputFiles(one);
  await frame.getByText('3개 영상 · 이어붙인 길이 8.0초').waitFor();
  await frame.locator('.join-row').last().getByText('빼기').click();
  await frame.locator('#play').click();
  await frame.locator('#play[aria-label="이어붙인 영상 재생"]').waitFor({timeout:13000});
  await frame.locator('#save').click();
  await frame.locator('#download').waitFor({timeout:25000});
  const samples=await frame.locator('#download').evaluate(async link=>{
    const out=document.createElement('video'),c=document.createElement('canvas');
    out.muted=true;out.playsInline=true;out.src=link.href;c.width=c.height=1;
    const g=c.getContext('2d',{willReadFrequently:true}),colors=[];
    const sample=()=>{g.drawImage(out,0,0,1,1);const [r,,b]=g.getImageData(0,0,1,1).data;
      if (out.currentTime>.4 && out.currentTime<1.2 && r>180) colors[0]=true;
      if (out.currentTime>4 && out.currentTime<5 && b>180) colors[1]=true;
      if(!out.ended)out.requestVideoFrameCallback(sample);};
    out.requestVideoFrameCallback(sample);await out.play();
    await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('이어붙인 MP4 재생 오류')),12500);out.onended=()=>{clearTimeout(t);resolve();};});
    return {duration:out.currentTime,colors};
  });
  assert.deepEqual(samples.colors,[true,true]);assert.ok(Math.abs(samples.duration-7)<.65);
  console.log('여러 영상 선택·추가·순서 변경·삭제·전체 미리보기·MP4 실제 재생 확인',samples.duration);

  await frame.getByText('스튜디오로 돌아가기').click();
  await page.locator('dialog.ar-video-editor').waitFor({state:'detached'});
  await page.locator('#openVideoEditor').click();
  await frame.getByRole('button',{name:'＋ 영상 추가'}).waitFor();
  assert.equal(await frame.locator('#trackSplit').isDisabled(),true);
  await frame.locator('#file').setInputFiles(two);
  await openSettings();
  await frame.locator('#highlightEditor').waitFor();
  await frame.locator('#trackCursor').fill('3');
  await frame.locator('#trackSplit').click();
  assert.equal(await frame.locator('#trackClips button').count(),2);
  await frame.locator('#trackUndo').click();
  await frame.locator('#trackRedo').click();
  await frame.locator('#cutMarkers button').click();
  await frame.getByRole('button',{name:'휩 슬라이드',exact:true}).click();
  await frame.locator('#mixOptions input').fill('1');
  await frame.locator('#mixDone').click();
  await frame.locator('#cutMarkers .applied').waitFor();
  const hasPush=async canvas=>{
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    const left=ctx.getImageData(w*.15,h*.5,1,1).data,right=ctx.getImageData(w*.85,h*.5,1,1).data;
    return left[0]>150 && left[2]<70 && right[0]<70 && right[2]>150;
  };
  await frame.locator('#trackCursor').fill('3.5');
  await frame.locator('#overlay').evaluate(async c=>{
    for(let i=0;i<80;i++){
      const ctx=c.getContext('2d'),w=c.width,h=c.height;
      if(ctx.getImageData(w*.15,h*.5,1,1).data[0]>150 && ctx.getImageData(w*.85,h*.5,1,1).data[2]>150)return;
      await new Promise(r=>setTimeout(r,25));
    }
    throw Error('컷 경계 미리보기 누락');
  });
  assert.ok(await frame.locator('#overlay').evaluate(hasPush));
  await frame.locator('#save').click();
  await frame.locator('#download').waitFor({timeout:20000});
  const transitionFrames=await frame.locator('#download').evaluate(async a=>{
    const v=document.createElement('video'),c=document.createElement('canvas');v.muted=true;v.playsInline=true;
    c.width=32;c.height=32;const g=c.getContext('2d',{willReadFrequently:true});
    let frames=0;v.src=a.href;
    const sample=()=>{
      g.drawImage(v,0,0,32,32);
      if(g.getImageData(5,16,1,1).data[0]>150 && g.getImageData(27,16,1,1).data[2]>150)frames++;
      if(!v.ended)v.requestVideoFrameCallback(sample);
    };
    v.requestVideoFrameCallback(sample);await v.play();
    await new Promise((ok,fail)=>{const t=setTimeout(()=>fail(Error('전환 MP4 확인 시간 초과')),11000);v.onended=()=>{clearTimeout(t);ok();};});
    return frames;
  });
  assert.ok(transitionFrames>=2,'MP4 슬라이드 전환 프레임 '+transitionFrames);
  console.log('모바일 편집기 컷 경계 선택과 저장한 MP4에서 휩 슬라이드 확인',transitionFrames);
  assert.equal(await frame.locator('#trackClips button').count(),2);
  await frame.locator('#trackLeft').click();
  const readCuts=()=>frame.locator('#work').evaluate(()=>sequenceTakes(session).map(t=>[t.start,t.end]));
  assert.deepEqual(await readCuts(),[[3,6],[0,3]]);
  await frame.locator('#trackUndo').click();
  assert.deepEqual(await readCuts(),[[0,3],[3,6]]);
  await frame.locator('#trackDelete').click();
  assert.deepEqual(await readCuts(),[[0,3]]);
  await frame.locator('#trackUndo').click();
  assert.deepEqual(await readCuts(),[[0,3],[3,6]]);
  await frame.locator('#trackDelete').click();
  await frame.locator('#trackCursor').fill('0.5');
  await frame.locator('[data-track=effect]').click();
  await frame.getByRole('button',{name:'폴라로이드 · 골든 플래시 효과 추가',exact:true}).click();
  assert.equal(await frame.locator('#fxDuration').inputValue(),'0.27');
  await frame.locator('#fxCopy').click();
  assert.equal(await frame.locator('.fx-block').count(),2);
  await frame.locator('#fxRemove').click();
  await frame.locator('#fxDuration').fill('1.5');
  await frame.locator('#fxDuration').press('Tab');
  await frame.locator('#fxStrength').fill('100');
  await frame.locator('#mixDone').click();
  await frame.locator('#sfxLane button').click();
  await frame.getByLabel('효과음 선택').selectOption('sfx-impact-01');
  await frame.locator('#mixDone').click();
  await frame.locator('#sfxLane .cue-block').waitFor();
  await frame.locator('#captionLane button').click();
  await frame.locator('#mixOptions input').first().fill('하이라이트');
  await frame.locator('#mixDone').click();
  assert.equal(await frame.locator('#captionLane .cue-block').textContent(),'하이라이트');
  await frame.locator('#trackCursor').fill('0.55');
  await frame.locator('#overlay').evaluate(async el=>{
    const ctx=el.getContext('2d');
    for(let i=0;i<80;i++){
      const rgb=ctx.getImageData(el.width/2,el.height/2,1,1).data;
      if(rgb[1]>130)return;
      await new Promise(resolve=>setTimeout(resolve,25));
    }
    throw Error('골든 플래시 미리보기 색상 불일치');
  });
  await frame.locator('#save').click();
  await frame.locator('#download').waitFor({timeout:18000});
  const peak=await frame.locator('#download').evaluate(async a=>{
    const bytes=await (await fetch(a.href)).arrayBuffer();
    const buf=await new OfflineAudioContext(1,1,22050).decodeAudioData(bytes);
    return buf.getChannelData(0).reduce((v,x)=>Math.max(v,Math.abs(x)),0);
  });
  assert.ok(peak>.02,'효과음이 합성된 MP4 오디오');
  const colors=await frame.locator('#download').evaluate(async link=>{
    const el=document.createElement('video');el.muted=true;el.src=link.href;
    const c=document.createElement('canvas');c.width=c.height=1;
    const ctx=c.getContext('2d',{willReadFrequently:true}),lit=[],plain=[];
    el.playsInline=true;
    const sample=(_,frame)=>{
      ctx.drawImage(el,0,0,1,1);
      const green=ctx.getImageData(0,0,1,1).data[1];
      if(frame.mediaTime>.58 && frame.mediaTime<1.1)lit.push(green);
      if(frame.mediaTime>2.15 && frame.mediaTime<2.9)plain.push(green);
      if(!el.ended)el.requestVideoFrameCallback(sample);
    };
    el.requestVideoFrameCallback(sample);
    const ended=new Promise((resolve,reject)=>{el.onended=resolve;el.onerror=reject;});
    await el.play();await ended;
    if(!lit.length || !plain.length)throw Error('MP4 효과 구간 디코딩 실패');
    return [Math.max(...lit),Math.max(...plain)];
  });
  assert.ok(colors[0]>colors[1]+60,'MP4 효과 구간의 녹색 채널 변화 '+colors);
  const trimmed=await frame.locator('#download').evaluate(async a=>{
    const out=document.createElement('video');out.muted=true;out.src=a.href;
    const ended=new Promise((res,rej)=>{out.onended=res;out.onerror=rej;});
    await out.play();await ended;return out.currentTime;
  });
  assert.ok(Math.abs(trimmed-3)<.6,'분할하고 뒷부분을 삭제한 MP4 길이 '+trimmed);
  await frame.locator('#postVideo').evaluate(()=>{
    window.arLoadBlobClient=async()=>({put:async(path,blob)=>{
      const saved=await fetch(session.saved).then(r=>r.blob());
      if(saved.size!==blob.size) throw Error('편집한 MP4가 발행에 사용되지 않았습니다.');
      return {url:'https://example.test/trimmed.mp4'};
    }});
  });
  await frame.locator('#postVideo').click();
  await frame.getByText('게시 완료',{exact:true}).waitFor();
  assert.equal(posts.at(-1).videoUrl,'https://example.test/trimmed.mp4');
  console.log('편집기 열기·썸네일 타임라인·분할·순서 변경·삭제·되돌리기·3초 MP4 재생 확인');

  assert.deepEqual(errors,[]);
  console.log('Independent file, full duration, trim, rate, sound, caption, music, portrait MP4, original studio preserved');
} finally { await browser.close(); }
