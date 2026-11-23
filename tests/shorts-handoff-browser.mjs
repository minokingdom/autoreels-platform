// '내 영상으로 쇼츠 만들기'에서 고른 추천 구간이 여섯 트랙 편집기로 그대로 넘어가는지 확인한다.
// 받아쓰기 모델은 내려받지 않고, 분석 결과와 같은 형태의 추천 구간을 넣어 이후 흐름만 본다.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const isolated = {'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'};
const browser = await chromium.launch(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {});
try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.protocol === 'blob:' || url.protocol === 'data:') return route.continue();
    if (url.hostname !== 'localhost') return route.abort();
    if (url.pathname.startsWith('/api/')) return route.fulfill({json:{ok:true,user:{id:'local'},entitlement:{pro:true}}, headers:isolated});
    try { await route.fulfill({path:path.join(root, url.pathname === '/studio' ? 'studio.html' : url.pathname), headers:isolated}); } catch { await route.abort(); }
  });
  await page.goto('http://localhost/assets/shorts/index.html', {waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(() => crossOriginIsolated), true);
  await page.locator('#file').setInputFiles(path.join(root, 'assets/remix/fixtures/remix-spoken-ko.mp4'));
  await page.waitForFunction(() => session && video.duration > 0, null, {timeout:15000});
  await page.evaluate(() => {
    const s = session; s.engine?.remove(); clearTimeout(s.timer);
    s.pending = [{start:.4,end:2.2,text:'오늘 점심은 김치찌개'},{start:2.3,end:4.6,text:'국물이 진하게 우러났어요'}];
    flush(s);
  });
  await page.locator('#openInEditor').click();
  const frame = page.frameLocator('dialog.ar-video-editor iframe');
  await frame.locator('#cutTimeline.has-media').waitFor({timeout:20000});
  const state = await frame.locator('body').evaluate(() => ({
    takes: sequenceTakes(session).map(t => [+t.start.toFixed(2), +t.end.toFixed(2)]),
    captions: [...document.querySelectorAll('#captionLane .cue-block')].map(b => b.textContent).sort()
  }));
  await frame.locator('#trackWave:not([hidden])').waitFor({timeout:10000});
  assert.deepEqual(state.takes, [[.4, 4.6]], '추천 구간만 타임라인에 올라가야 함');
  assert.deepEqual(state.captions, ['국물이 진하게 우러났어요', '오늘 점심은 김치찌개'], '받아쓴 대사가 자막 트랙에 올라가야 함');
  const inspector = frame.locator('dialog.arcp[open]');
  await inspector.getByRole('button', {name:'프리젠테이션', exact:true}).click();
  assert.deepEqual(await frame.locator('body').evaluate(() => {
    const owner = currentTake(session).take.owner;
    return [owner.cutCaption.font, owner.cutCaption.text, activeCaption(owner, .7), activeCaption(owner, 3)];
  }), ['freesentation', undefined, '오늘 점심은 김치찌개', '국물이 진하게 우러났어요']);
  await inspector.getByRole('button', {name:'복사',exact:true}).click();
  await inspector.getByRole('button', {name:'Aa 문구 고치기'}).click();
  await inspector.getByRole('textbox', {name:'자막 문구'}).fill('복사본의 자막');
  await inspector.getByRole('button', {name:'적용',exact:true}).click();
  await inspector.getByRole('button', {name:'길이 줄이기'}).click();
  await inspector.getByRole('button', {name:'앞으로',exact:true}).click();
  assert.deepEqual(await frame.locator('body').evaluate(() => sequenceTakes(session).map(cut => [
    cut.owner.cutCaption.text || '', Number(takeDuration(cut).toFixed(1)), cut.owner.lines[1].text
  ])), [['복사본의 자막', 4, '국물이 진하게 우러났어요'], ['', 4.2, '국물이 진하게 우러났어요']]);
  await inspector.getByRole('button', {name:'빼기',exact:true}).click();
  await inspector.getByRole('button', {name:/^접기/}).click();
  await frame.locator('[data-studio-back]').click();
  await page.locator('dialog.ar-video-editor').waitFor({state:'detached'});
  assert.equal(await page.locator('#clips button').count(), 1, '편집기를 닫으면 추천 목록으로 돌아와야 함');
  assert.deepEqual(errors, []);
  console.log('쇼츠 추천 구간 → 편집기 구간·자막 연결 확인');
  await page.goto('http://localhost/studio', {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => typeof arOpenQuickVideoEditor === 'function');
  await page.locator('#quickShortVideoInput').setInputFiles(fileURLToPath(new URL('./fixtures/remix-caption.webm', import.meta.url)));
  await frame.locator('#headerStudioEdit').click();
  await inspector.getByRole('button', {name:'아래 이름',exact:true}).click();
  await inspector.getByRole('button', {name:'Aa 문구 고치기'}).click();
  await inspector.getByRole('textbox', {name:'아래 이름 문구'}).fill('GALLERY');
  await inspector.getByRole('button', {name:'적용',exact:true}).click();
  await inspector.getByRole('button', {name:'사진',exact:true}).click();
  const choosing = page.waitForEvent('filechooser');
  await inspector.getByRole('button', {name:'이 컷에 사진 넣기'}).click();
  const green = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 90; c.height = 160;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#00ff00'; ctx.fillRect(0,0,90,160);
    return c.toDataURL().split(',')[1];
  });
  await (await choosing).setFiles({name:'green.png',mimeType:'image/png',buffer:Buffer.from(green,'base64')});
  await frame.locator('#overlay').evaluate(async c => {
    const ctx = c.getContext('2d');
    for (let i=0;i<100;i++) {
      if (ctx.getImageData(270,480,1,1).data[1] > 240 && ctx.getImageData(270,480,1,1).data[0] < 20) return;
      await new Promise(resolve => setTimeout(resolve,50));
    }
    throw Error('컷 사진이 미리보기에 나타나지 않았어요.');
  });
  await frame.locator('#mixPublish').click();
  await frame.locator('#save').click();
  await frame.locator('#download:not([hidden])').waitFor({timeout:20000});
  const exported = await frame.locator('#download').evaluate(async link => {
    const v = document.createElement('video'); v.muted = true; v.src = link.href;
    await v.play();
    await new Promise(resolve => v.requestVideoFrameCallback(resolve));
    v.pause();
    const c = document.createElement('canvas'); c.width=108; c.height=192;
    const g = c.getContext('2d'); g.drawImage(v,0,0,c.width,c.height);
    const center = [...g.getImageData(54,96,1,1).data];
    const band = g.getImageData(0,147,108,44).data;
    let whitePixels = 0;
    for (let i=0; i<band.length; i+=4) if (band[i]>130 && band[i+2]>130) whitePixels++;
    return {width:v.videoWidth,height:v.videoHeight,center,whitePixels};
  });
  assert.equal(exported.width,1080); assert.equal(exported.height,1920);
  assert.ok(exported.center[1]>215 && exported.center[0]<35 && exported.whitePixels>8, JSON.stringify(exported));
  assert.deepEqual(errors, []);
  console.log('갤러리 → 컷 사진·아래 이름 → 실제 MP4 픽셀 확인');
} finally { await browser.close(); }
