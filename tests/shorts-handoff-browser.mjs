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
    if (url.pathname.startsWith('/api/')) return route.fulfill({json:{ok:true}, headers:isolated});
    try { await route.fulfill({path:path.join(root, url.pathname), headers:isolated}); } catch { await route.abort(); }
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
  await frame.locator('[data-studio-back]').click();
  await page.locator('dialog.ar-video-editor').waitFor({state:'detached'});
  assert.equal(await page.locator('#clips button').count(), 1, '편집기를 닫으면 추천 목록으로 돌아와야 함');
  assert.deepEqual(errors, []);
  console.log('쇼츠 추천 구간 → 편집기 구간·자막 연결 확인');
} finally { await browser.close(); }
