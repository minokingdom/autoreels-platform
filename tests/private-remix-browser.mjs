// 개인 결과를 받은 뒤 기존 원본을 보고 변경 요청만 입력해 장면 자막을 교체하는 흐름입니다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = fileURLToPath(new URL('../public/',import.meta.url));
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if (!file.startsWith(root) || !fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8'}[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:374,height:760}});
  const source={context:{topic:'점심 메뉴 비교'}, scenes:[{start:0,end:90,accent:'#f7d4aa',position:'bottom',screen:'오늘 점심은 김치찌개',speech:'오늘은 어떤 찌개를 드실 건가요?',caption:'오늘 점심은 김치찌개'}]};
  const actual=process.env.REMIX_QA_RESULT ? JSON.parse(fs.readFileSync(process.env.REMIX_QA_RESULT,'utf8')) : null;
  if (actual) {source.context=actual.context;source.scenes=actual.scenes.map(s=>({...s,caption:s.screen.slice(0,56)}));}
  const draft=actual?.draft || ['오늘은 커피와 차 중 어느 쪽?'];
  let sourceId,editId,sourcePolls=0,deny=false;
  let acceptSubmit;
  const submitted = new Promise(resolve=>{acceptSubmit=resolve;});
  await page.route('**/api/account?**',async route=>{
    const req=route.request(),url=new URL(req.url());
    if (req.method()==='POST') {
      const body=req.postDataJSON();
      if (deny) return route.fulfill({status:401,json:{ok:false}});
      if (!body.sourceId) await submitted;
      if (body.sourceId) {
        assert.equal(body.sourceId,sourceId);assert.match(body.change,/커피/);editId=body.id;
      } else {assert.match(body.url,/youtube/);sourceId=body.id;}
      return route.fulfill({json:{ok:true,id:body.id,status:'queued'}});
    }
    const id=url.searchParams.get('id');
    if (id===sourceId && sourcePolls++<2) {
      return route.fulfill({json:{ok:true,status:sourcePolls===1 ? 'queued' : 'running'}});
    }
    const result=editId && id===editId ? {draft,source_id:sourceId}:source;
    await route.fulfill({json:{ok:true,status:'done',...result}});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/assets/remix/index.html');
  await page.getByLabel('참고 영상 URL').fill('https://www.youtube.com/shorts/Iit7ZaSLRTw');
  await page.getByRole('button',{name:'링크 분석'}).click();
  const bar = page.getByRole('progressbar');
  await bar.waitFor();
  assert.match(await page.locator('#linkMessage').innerText(),/접수/);
  const input = await page.locator('#referenceUrl').boundingBox();
  const progress = await bar.boundingBox();
  const gallery = await page.locator('label[for=reference]').boundingBox();
  assert.ok(input.y < progress.y && progress.y < gallery.y && progress.y < 760);
  acceptSubmit();
  await page.getByText('분석 대기 중이에요.',{exact:true}).waitFor();
  await page.getByText('영상의 주제·화면 문구·대사를 분석하고 있어요.',{exact:true}).waitFor();
  assert.ok(await bar.isVisible());
  await page.locator('#sourceTopic').waitFor();
  assert.ok(await bar.isHidden());
  assert.match(await page.locator('#linkMessage').innerText(),/분석 완료/);
  assert.equal(await page.locator('#sourceTopic').textContent(),source.context.topic);
  await page.locator('#sourceDetails summary').click();
  assert.match(await page.locator('#sourceLines').innerText(),/김치/);
  await page.locator('#adaptChange').fill('커피와 차 비교로 바꿔줘');
  await page.locator('#adapt').click();
  await page.waitForFunction(v=>document.querySelector('.scene input').value===v,draft[0]);
  await page.reload();
  await page.waitForFunction(v=>document.querySelector('.scene input')?.value===v,draft[0]);
  if(process.env.REMIX_QA_SCREEN) {
    await page.locator('#sourceDetails summary').click();
    await page.screenshot({path:process.env.REMIX_QA_SCREEN,fullPage:true});
  }
  deny=true;
  await page.getByLabel('참고 영상 URL').fill('https://www.youtube.com/shorts/Iit7ZaSLRTw');
  await page.getByRole('button',{name:'링크 분석',exact:true}).click();
  await page.locator('#loginHelp').waitFor();
  assert.match(await page.locator('#linkMessage').innerText(),/로그인/);
  assert.ok(await bar.isHidden());
  assert.ok(await page.getByRole('button',{name:'링크 분석',exact:true}).isEnabled());
  console.log('원본 주제·문구·대사 확인, 변경 요청, 장면별 자막 적용 및 새로고침 복구 통과');
} finally {await browser.close();server.close();}
