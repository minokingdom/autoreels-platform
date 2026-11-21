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
  assert.deepEqual(errors,[]);
  console.log('Independent file, full duration, trim, rate, sound, caption, music, portrait MP4, original studio preserved');
} finally { await browser.close(); }
