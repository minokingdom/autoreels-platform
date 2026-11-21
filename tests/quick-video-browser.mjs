import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../public/',import.meta.url));
const browser = await chromium.launch(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {});
try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*',async route => {
    const url = new URL(route.request().url());
    if (url.protocol === 'blob:') return route.continue();
    if (url.hostname !== 'localhost') return route.abort();
    if (url.pathname === '/api/account') {
      requests.push(url.searchParams.get('action'));
      return route.fulfill({json:{ok:true,user:{id:'test'},entitlement:{pro:true}}});
    }
    if (url.pathname.startsWith('/api/')) return route.fulfill({json:{}});
    const file = path.join(root,url.pathname === '/studio' ? 'studio.html' : url.pathname);
    try { await route.fulfill({path:file}); } catch { await route.abort(); }
  });
  await page.goto('http://localhost/studio',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => typeof arOpenQuickVideoEditor === 'function');
  const before = () => page.evaluate(() => [campaign.uploadedPhotos.length,campaign.designStyle,TOTAL_DURATION]);
  const original = await before();
  const fixture = new URL('./fixtures/remix-caption.webm',import.meta.url);
  await page.locator('#quickShortVideoInput').setInputFiles({name:'test.webm',mimeType:'video/webm',buffer:await fs.readFile(fixture)});
  const frame = page.frameLocator('dialog.ar-video-editor iframe');
  await frame.locator('#quickControls').waitFor({timeout:15000});
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
  await frame.getByText('2개 장면을 골라 원래 순서로 이었어요.').waitFor();
  const expected = await frame.locator('#sourceVideo').evaluate(el => el.duration*.62);
  await frame.locator('#play').click();
  const skipped = await frame.locator('#sourceVideo').evaluate(el => new Promise(resolve => {
    const timer = setTimeout(() => resolve(false),6000);
    el.addEventListener('seeking',() => {clearTimeout(timer);resolve(true);},{once:true});
  }));
  assert.equal(skipped,true);
  await frame.locator('#save').click();
  await frame.locator('#download').waitFor({timeout:20000});
  const duration = await frame.locator('#download').evaluate(async el => {
    const out = document.createElement('video'); out.playsInline = true; out.muted = true; out.src = el.href;
    await out.play();
    return new Promise((resolve,reject) => {
      const timer = setTimeout(() => reject(Error('MP4 재생 시간 초과')),10000);
      out.onended = () => {clearTimeout(timer);resolve(out.currentTime);};
    });
  });
  assert.ok(Math.abs(duration-expected)<.6,'편집 후 길이 '+duration+' / '+expected);
  console.log('자동 장면 선택·미리보기 컷 전환·완성 MP4 재생 확인',duration.toFixed(2)+'초');
  await frame.getByText('스튜디오로 돌아가기').click();
  await page.locator('#quickShortVideoInput').setInputFiles(fileURLToPath(new URL('./fixtures/montage-transition.webm',import.meta.url)));
  const switchEffect = frame.locator('#sceneTransitions');
  await switchEffect.waitFor();
  assert.equal(await switchEffect.isChecked(),true);
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
  assert.deepEqual(errors,[]);
  console.log('Independent file, full duration, trim, rate, sound, caption, music, portrait MP4, original studio preserved');
} finally { await browser.close(); }
