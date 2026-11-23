import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json'};
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (pathname === '/studio' ? '/studio.html' : pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
  res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {});
try {
  const page = await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  page.setDefaultTimeout(15000);
  if (!process.env.INSPECTOR_SCREENSHOTS) await page.route(/^https:\/\//, route => route.abort());
  await page.goto('http://127.0.0.1:' + server.address().port + '/studio', {waitUntil:'domcontentloaded'});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.locator('[onclick="arOpenCardNewsModal()"]:visible').first().click();
  const panel = page.getByRole('dialog', {name:'카드 편집'});
  const click = name => panel.getByRole('button', {name,exact:true}).click();
  await panel.waitFor();
  if (process.env.INSPECTOR_SCREENSHOTS) {
    await panel.scrollIntoViewIfNeeded();
    await panel.screenshot({path:path.join(process.env.INSPECTOR_SCREENSHOTS,'cardnews-inspector.png'),timeout:45000});
  }
  await click('복사');
  await click('뒤로');
  await click('길이 늘리기');
  await click('Aa 문구 고치기');
  await panel.getByLabel('자막 문구', {exact:true}).fill('편집된 카드 제목');
  await click('적용');
  await click('#fb7185');
  await click('아래 이름');
  await click('Aa 문구 고치기');
  await panel.getByLabel('아래 이름 문구', {exact:true}).fill('우리 가게');
  await click('적용');
  await click('화이트 카드');
  await click('꾸밈');
  await click('본문 · 상단 배지 · 강조 문구');
  await page.locator('#arCnBody').fill('사진 아래에 남는 카드 본문');
  assert.equal(await page.locator('#arCnTitle').inputValue(),'편집된 카드 제목');
  const download = page.waitForEvent('download');
  await page.locator('[onclick="arCnDownloadCurrentPng()"]:visible').first().click();
  const bytes = fs.readFileSync(await (await download).path());
  assert.equal(bytes.subarray(1,4).toString(),'PNG');
  assert.equal(bytes.readUInt32BE(16),1080);
  assert.equal(bytes.readUInt32BE(20),1350);
  const pinkPixels = await page.evaluate(async data => {
    const image = new Image(); image.src = 'data:image/png;base64,' + data; await image.decode();
    const cv = document.createElement('canvas'); cv.width = image.width; cv.height = image.height;
    const ctx = cv.getContext('2d'); ctx.drawImage(image,0,0);
    const pixels = ctx.getImageData(0,0,cv.width,cv.height).data;
    let count = 0;
    for (let i=0; i<pixels.length; i+=4) if (pixels[i] === 251 && pixels[i+1] === 113 && pixels[i+2] === 133) count++;
    return count;
  }, bytes.toString('base64'));
  assert.ok(pinkPixels > 20,'PNG에 적용된 제목 색상');
  await page.locator('[data-cn-dock="text"]').click();
  await click('전환');
  await click('릴스로 변환하고 이 장의 전환 편집');
  const reel = page.locator('#cutEditorPanel');
  await reel.waitFor();
  assert.deepEqual(await page.evaluate(()=>[window.__arPinnedCut,window.__arActiveCutElKey,computeFittedDurations().lengths[2]]),[2,'transition',2.8]);
  await page.evaluate(()=>closeCutEditor());
  await page.locator('#showStudioServices').click();
  await page.locator('#openPhotoCollageBtn').click();
  const photo = color => ({name:color+'.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="'+color+'"/></svg>')});
  await page.locator('#arCollageFileInput').setInputFiles(['purple','orange','blue','green'].map(photo));
  await page.waitForFunction(()=>_arCollageState.photos.length === 4);
  await page.locator('[data-cl-cnt="2"]').click();
  await page.locator('#arCollageSlotPills button').first().click();
  await page.locator('#arCollageApplyBtn').click();
  await reel.waitFor();
  assert.deepEqual(await page.evaluate(()=>[window.__arPinnedCut,window.__arActiveCutElKey]),[0,'caption']);
  if (process.env.INSPECTOR_SCREENSHOTS) {
    await reel.scrollIntoViewIfNeeded();
    await reel.screenshot({path:path.join(process.env.INSPECTOR_SCREENSHOTS,'collage-inspector.png'),timeout:45000});
  }
  const renderSourceColors = () => page.evaluate(()=>Array.from({length:getTargetCutCount()}, (_, i)=>{
    const frame = kitScene((i+.5)*getMainDuration()/getTargetCutCount(),getMainDuration(),false);
    const cv=document.createElement('canvas');
    cv.width=1; cv.height=1;
    const g=cv.getContext('2d'); g.drawImage(kitImg(frame,0),345,310,1,1,0,0,1,1);
    return Array.from(g.getImageData(0,0,1,1).data).slice(0,3);
  }));
  const originalColors = await renderSourceColors();
  assert.notDeepEqual(originalColors[0],originalColors[1]);
  await reel.getByRole('button',{name:/뒤로/}).click();
  await reel.getByRole('button',{name:/복사/}).click();
  assert.deepEqual(await renderSourceColors(),[originalColors[1],originalColors[0],originalColors[0]]);
  await reel.getByRole('button',{name:'사진',exact:true}).click();
  await reel.getByRole('button',{name:/콜라주 칸별 맞추기/}).click();
  assert.equal(await page.locator('#arCollageSlotPills button').count(),2);
  await page.locator('#arCollageSlotPills button').first().click();
  await page.locator('#arCollageSlotReplaceInput').setInputFiles(photo('red'));
  await page.waitForFunction(()=>arCollageGetEdit(0,0).imgOverride?.complete);
  await page.locator('#arCollageApplyBtn').click();
  await reel.waitFor();
  const edited = await renderSourceColors();
  assert.deepEqual(edited.slice(0,2),[originalColors[1],originalColors[0]]);
  assert.ok(edited[2][0]>240 && edited[2][1]<10 && edited[2][2]<10);
  assert.equal(await page.evaluate(()=>window.__arPinnedCut),2);
  assert.deepEqual(errors,[]);
  console.log('카드뉴스 편집, PNG, 릴스 변환 길이, 콜라주 슬롯 편집 통과');
} finally {
  await browser.close();
  server.close();
}
