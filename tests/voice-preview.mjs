import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import google from '../lib/google-tts.js';
import { buildApp } from '../scripts/build-app.mjs';

const root = path.resolve('public');
buildApp(path.resolve('.'));
process.env.GOOGLE_TTS_API_KEY = 'fixture';
const voices = google.listGoogleVoices(3);
const previewDir = path.join(root, 'assets/voice-previews');
assert.deepEqual(fs.readdirSync(previewDir).sort(), voices.map(v => v.id + '.mp3').sort());

let synthesisCalls = 0;
const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/api/tts-voices') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ voices }));
    return;
  }
  if (/^\/api\/tts(?:-script)?$/.test(pathname)) synthesisCalls++;
  const file = path.resolve(root, '.' + (pathname === '/studio' ? '/studio.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  const mime = { '.mp3': 'audio/mpeg', '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8' };
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = process.argv[2] || 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
try {
  for (const width of [393, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 860 } });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (process.argv[2] && url.pathname.startsWith('/api/') && url.pathname !== '/api/tts-voices') {
        if (/^\/api\/tts(?:-script)?$/.test(url.pathname)) synthesisCalls++;
        return route.fulfill({ status: 401, json: {} });
      }
      return route.continue();
    });
    await page.addInitScript(() => localStorage.setItem('autoreels_tts_voice', 'device-F1'));
    await page.goto(origin + '/studio');
    const actions = page.locator('#easyStepGuide #soundStepActions');
    assert.equal(await actions.isHidden(), true);
    assert.equal(await page.locator('#deviceVoiceControls,#deviceVoiceInstall,#voxVoiceInstall').count(), 0);
    assert.equal(await page.evaluate(() => AudioEngine.ttsVoice), 'off');
    await page.evaluate(() => {
      AR_SERVER.me = { user: { id: 'audition-test' } };
      window.__arUserMuted = true;
      switchStudioTab('sound');
      arToggleSheet(false);
    });
    const open = page.locator('#ttsVoiceSelect + .ig-select-row');
    assert.equal(await page.locator('#easyStepCount').textContent(), '4 / 6');
    assert.equal(await page.locator('#easyStepTitle').textContent(), '성우 · 배경음악');
    const buttons = actions.getByRole('button');
    assert.deepEqual((await buttons.allTextContents()).map(t => t.trim()), ['현재 컷 듣기', '처음부터 듣기']);
    for (const button of await buttons.all()) await button.click({ trial: true });
    const guide = page.locator('#easyStepGuide');
    for (const guideWidth of ['', '195px']) {
      await guide.evaluate((el, width) => { el.style.width = width; }, guideWidth);
      const count = await page.locator('#easyStepCount').boundingBox();
      const card = await guide.boundingBox();
      let right = count.x + count.width;
      for (const button of await buttons.all()) {
        const box = await button.boundingBox();
        assert.ok(Math.abs(box.y + box.height / 2 - count.y - count.height / 2) < 2,
          JSON.stringify({ width, guideWidth, card, count, button: box }));
        assert.ok(box.height >= 24 && box.height <= 30 && box.x >= right);
        right = box.x + box.width;
      }
      assert.ok(right <= card.x + card.width);
    }
    await guide.evaluate(el => el.style.removeProperty('width'));
    assert.deepEqual(await page.locator('#studioPanel_sound select').evaluateAll(els => els.map(el => el.id)),
      ['ttsVoiceSelect', 'bgmStyleSelect', 'sfxModeSelect', 'ttsSpeedSelect']);
    const sheet = page.locator('#arOptionSheet');
    const speed = sheet.getByRole('group', { name: '말하는 속도' });
    const speedOption = value => speed.locator('input[value="' + value + '"]');
    assert.equal(await page.locator('#ttsSpeedSelect').isHidden(), true);
    const option = id => sheet.locator('[data-v="' + id + '"]');
    const play = async id => {
      await option(id).waitFor();
      await option(id).click();
      await page.waitForFunction(id => {
        const audio = document.querySelector('#arOptionSheet audio');
        return audio && audio.currentSrc.endsWith('/' + id + '.mp3') && !audio.paused && audio.currentTime > 0;
      }, id);
    };
    synthesisCalls = 0;
    await open.click();
    await play('ko-KR-Chirp3-HD-Puck');
    await speedOption('1.2').check();
    assert.ok(Math.abs(await sheet.locator('audio').evaluate(el => el.playbackRate) - 1.2 / 1.1) < 0.001);
    await play('ko-KR-Wavenet-A');
    assert.equal(await page.evaluate(() => AudioEngine.ttsSpeed), 1.1);
    assert.equal(await page.evaluate(() => AudioEngine.ttsVoice), 'off');
    assert.equal(synthesisCalls, 0);
    await option('ko-KR-Wavenet-A').click();
    assert.equal(await sheet.locator('audio').evaluate(el => el.paused), true);
    await sheet.click({ position: { x: 2, y: 2 } });
    assert.equal(await page.evaluate(() => AudioEngine.ttsVoice), 'off');
    await open.click();
    assert.equal(await speedOption('1.1').isChecked(), true);
    await speedOption('1').check();
    await play('ko-KR-Wavenet-B');
    assert.equal(synthesisCalls, 0);
    const player = await sheet.locator('audio').elementHandle();
    await sheet.getByRole('button', { name: '적용', exact: true }).click();
    assert.equal(await player.evaluate(el => el.paused), true);
    assert.equal(await page.evaluate(() => AudioEngine.ttsVoice), 'ko-KR-Wavenet-B');
    assert.equal(await page.evaluate(() => AudioEngine.ttsSpeed), 1);
    await open.click();
    assert.equal(await speedOption('1').isChecked(), true);
    await speedOption('1.2').check();
    await sheet.getByRole('button', { name: '적용', exact: true }).click();
    assert.equal(await page.evaluate(() => AudioEngine.ttsSpeed), 1.2);
    assert.equal(await page.evaluate(() => AudioEngine.ttsVoice), 'ko-KR-Wavenet-B');
    assert.equal(await page.evaluate(() => localStorage.getItem('autoreels_tts_voice')), 'ko-KR-Wavenet-B');
    await page.evaluate(() => switchStudioTab('card'));
    assert.equal(await actions.isHidden(), true);
    const info = page.getByLabel('단계 설명', { exact: true });
    const tip = page.locator('#easyStepText');
    for (const [index, key] of ['topic', 'script', 'photo', 'sound', 'card', 'publish'].entries()) {
      await page.evaluate(key => { switchStudioTab(key); arToggleSheet(false); }, key);
      assert.equal(await page.locator('#easyStepCount').textContent(), (index + 1) + ' / 6');
      assert.equal(await tip.isHidden(), true);
      const tools = page.locator('#photoStepTools');
      assert.equal(await tools.isVisible(), key === 'photo');
      if (key === 'photo') {
        const photoButtons = tools.getByRole('button');
        assert.deepEqual(await photoButtons.allTextContents(), ['맞춤 이미지 생성', '기본 사진 복원', '한 장으로 통일', '구도 섞기']);
        for (const button of await photoButtons.all()) await button.click({ trial: true });
        const grid = tools.getByRole('group');
        const columns = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
        assert.equal(columns, await grid.evaluate(el => el.clientWidth >= 420) ? 4 : 2);
      }
      await info.click();
      assert.equal(await tip.isVisible(), true);
      await tip.click({ trial: true });
      assert.ok((await tip.textContent()).trim().length > 0);
      if (key === 'sound') {
        assert.match(await tip.textContent(), /성우 목소리와 배경음악/);
        await info.click();
        assert.equal(await tip.isHidden(), true);
        await info.press('Enter');
        assert.equal(await tip.isVisible(), true);
        await page.keyboard.press('Escape');
        assert.equal(await tip.isHidden(), true);
        await info.click();
        await page.locator('#easyStepCount').click();
        assert.equal(await tip.isHidden(), true);
      }
    }
    await page.close();
  }
  console.log('Voice previews, compact audio controls and help for all six steps OK');
} finally {
  await browser.close();
  server.closeAllConnections();
  server.close();
}
