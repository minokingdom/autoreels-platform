// 영상 편집기 → 스튜디오 테마 입히기: '테마 색감' 효과를 넣고 넘긴 영상이 사진 칸에 연속 재생 영상으로 들어가는지 확인한다.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const { buildApp } = await import('../scripts/build-app.mjs');
buildApp(path.resolve(root, '..'));
const T = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.mp3':'audio/mpeg','.wasm':'application/wasm','.mp4':'video/mp4'};
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u.startsWith('/api/')) { r.writeHead(503, {'content-type':'application/json'}); return r.end('{}'); }
  let f = path.join(root, u);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'studio.html');
  r.writeHead(200, {'content-type': T[path.extname(f)] || 'application/octet-stream'});
  fs.createReadStream(f).pipe(r);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const browser = await chromium.launch(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH, args:['--no-sandbox']} : {});
try {
  const page = await browser.newPage({viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/studio`, {waitUntil:'load'});
  await page.waitForFunction(() => typeof arOpenQuickVideoEditor === 'function' && typeof arApplyThemeToEditedVideo === 'function');
  await page.evaluate(() => { if (window.dismissAutoReelsSplash) dismissAutoReelsSplash(); arOpenQuickVideoEditor(); });
  const frame = page.frameLocator('dialog.ar-video-editor iframe');
  const chooser = page.waitForEvent('filechooser');
  await frame.locator('#emptyVideoPick').click();
  await (await chooser).setFiles(path.join(root, 'assets/remix/fixtures/remix-spoken-ko.mp4'));
  await frame.locator('#cutTimeline.has-media').waitFor({timeout:20000});
  await frame.locator('.mix-label[data-track="effect"]').click();
  await frame.locator('.fx-tabs button', {hasText:'테마 색감'}).click();
  const themeNames = await frame.locator('#fxPresetList button:not([hidden])').allTextContents();
  assert.ok(themeNames.includes('필름 그레인') && themeNames.includes('따뜻한 필름'), '테마 색감 탭에 테마 효과가 보여야 함');
  assert.ok(!themeNames.includes('플래시'), '순간 효과는 영상 효과 탭에만');
  await frame.locator('#fxPresetList button:not([hidden])', {hasText:'따뜻한 필름'}).click();
  await frame.locator('#mixDone').click();
  assert.equal(await frame.locator('#fxLanes .fx-block').count(), 1);
  await frame.locator('#mixPublish').click();
  await frame.locator('#applyTheme').click();
  await page.waitForFunction(() => !document.querySelector('dialog.ar-video-editor') && campaign.uploadedPhotos[0]?._continuousVideo, null, {timeout:60000});
  const state = await page.evaluate(() => {
    const v = campaign.uploadedPhotos[0];
    return {count:campaign.uploadedPhotos.length, keepAudio:v._keepAudio, width:v.videoWidth, height:v.videoHeight,
      bar:!document.getElementById('arShortVideoBar').classList.contains('hidden')};
  });
  assert.deepEqual(state, {count:1, keepAudio:true, width:1080, height:1920, bar:true});
  assert.deepEqual(errors, []);
  console.log('편집기 테마 색감 → 스튜디오 테마 입히기 확인');
} finally { await browser.close(); srv.close(); }
