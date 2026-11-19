// 휴대폰에서 링크 바이트를 받아 실제 컷/OCR을 실행합니다. 운영 분석 대기열 호출은 실패 처리합니다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=fileURLToPath(new URL('../public/',import.meta.url));
const fixture=fs.readFileSync(new URL('./fixtures/remix-caption.webm',import.meta.url));
let release;
const gate=new Promise(resolve=>{release=resolve;});
const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  if(u.pathname==='/clip.webm'){
    await gate;res.writeHead(200,{'Content-Type':'video/webm'});res.end(fixture);return;
  }
  const file=path.resolve(root,'.'+u.pathname);
  if(!file.startsWith(root)||!fs.existsSync(file))return res.writeHead(404).end();
  res.writeHead(200,{'Content-Type':{'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8'}[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch();
try{
  const page=await browser.newPage({viewport:{width:374,height:760},isMobile:true,hasTouch:true});
  const calls=[];page.on('request',req=>{if(req.url().includes('/api/account'))calls.push(req.url());});
  const host='http://127.0.0.1:'+server.address().port;
  await page.goto(host+'/assets/remix/index.html');
  const input=page.getByLabel('참고 영상 URL'),submit=page.locator('#urlSubmit'),bar=page.getByRole('progressbar');
  await input.fill(host+'/clip.webm');await submit.tap();await bar.waitFor();
  const box=await bar.boundingBox(),field=await input.boundingBox();
  assert.ok(box.y>field.y && box.y<760);
  assert.match(await page.locator('#linkMessage').innerText(),/휴대폰/);
  release();
  await page.locator('#sourceTopic').waitFor({timeout:45000});
  assert.match(await page.locator('#sourceLines').textContent(),/김치찌개/);
  assert.ok(await bar.isHidden());assert.match(await page.locator('#linkMessage').innerText(),/분석 완료/);
  await page.locator('#adaptChange').fill('김치찌개를 비빔밥으로 바꿔줘');
  await page.locator('#adapt').tap();
  await page.waitForFunction(()=>document.querySelector('.scene input').value.includes('비빔밥'));
  await page.reload();assert.match(await page.locator('.scene input').inputValue(),/비빔밥/);
  await input.fill('https://www.youtube.com/shorts/Iit7ZaSLRTw');await submit.tap();
  await page.getByText(/공유 링크는 휴대폰 브라우저에/).waitFor();
  assert.ok(await bar.isHidden());assert.ok(await submit.isEnabled());assert.deepEqual(calls,[]);
  for(const platform of ['Android','iOS']){
    const native=await browser.newPage({userAgent:'Mobile AutoReelsMaker'+platform+'/1'});
    await native.goto(host+'/assets/remix/index.html');
    await native.locator('#referenceUrl').fill('https://www.youtube.com/shorts/Iit7ZaSLRTw');
    const picking=native.waitForEvent('filechooser');
    await native.locator('#urlSubmit').click();
    const chooser=await picking;
    assert.equal(await chooser.element().getAttribute('data-video-id'),'Iit7ZaSLRTw');
    await chooser.setFiles({name:'reference.webm',mimeType:'video/webm',buffer:fixture});
    await native.locator('#sourceTopic').waitFor({timeout:45000});
    assert.match(await native.locator('#sourceLines').textContent(),/김치찌개/);
    await native.close();
  }
  console.log('직접 영상 링크, 모바일 로딩바, 실제 한국어 OCR, 대본 변경, 복구, 공유 링크 안내, 서버 작업 요청 0건');
}finally{release();await browser.close();server.close();}
