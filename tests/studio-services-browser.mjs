import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {buildApp} from '../scripts/build-app.mjs';

const root=fileURLToPath(new URL('../public/',import.meta.url));
const production=process.argv[2];
if(!production) buildApp(path.resolve(root,'..'));
const origin=production||'http://localhost';
const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
try {
  for(const width of [390,1280]) {
    const page=await browser.newPage({viewport:{width,height:844},isMobile:width<600});
    const errors=[];
    if(production){
      const guest=page.getByRole('button',{name:'로그인 없이 둘러보기'});
      await page.addLocatorHandler(guest,()=>guest.click());
    }
    page.on('pageerror',e=>errors.push(e.message));
    if(!production) await page.route('**/*',async route=>{
      const {hostname,pathname}=new URL(route.request().url());
      if(hostname!=='localhost'){
        if(hostname==='cdn.tailwindcss.com')return route.continue();
        return route.abort();
      }
      if(pathname.startsWith('/api/')) return route.fulfill({json:{ok:false}});
      const file=path.join(root,pathname==='/studio'?'studio.html':pathname);
      if(!fs.existsSync(file))return route.abort();
      return route.fulfill({path:file});
    });
    await page.goto(origin+'/studio',{waitUntil:'domcontentloaded',timeout:80000});
    const menu=page.getByRole('navigation',{name:'제작 메뉴',exact:true});
    await menu.waitFor();
    assert.equal(await menu.locator('.ar-menu-wordmark').innerText(),'오토릴스메이커');
    const names=await menu.locator('strong').allTextContents();
    assert.deepEqual(names,['오토릴스 만들기','영상 편집기','사진 콜라주로 만들기','인스타 카드뉴스 만들기','내 영상으로 쇼츠 만들기','참고 쇼츠·릴스로 재구성하기']);
    if(width===390 && process.env.SERVICES_CAPTURE){
      await page.locator('#arSplashIntro').waitFor({state:'hidden'});
      await menu.getByRole('button',{name:/오토릴스 만들기/}).click({trial:true});
      await menu.screenshot({path:process.env.SERVICES_CAPTURE});
    }
    const offscreen=await menu.evaluate(el=>el.scrollWidth>innerWidth||el.getBoundingClientRect().top>=innerHeight);
    assert.equal(offscreen,false);
    await menu.getByRole('button',{name:/오토릴스 만들기/}).click({timeout:12000});
    await page.locator('#studioPanel_topic').waitFor();
    await page.locator('#studioWorkPreview').click();
    const preview=page.locator('dialog.ar-work-preview[open]');
    await preview.locator('#arPreviewPopCanvas').waitFor();
    const bounds=await preview.evaluate(el=>[el.getBoundingClientRect().height,innerHeight,el.getBoundingClientRect().bottom]);
    assert.ok(Math.abs(bounds[0]-bounds[1]/2)<1 && Math.abs(bounds[2]-bounds[1])<1);
    if(width===390 && process.env.WORK_PREVIEW_CAPTURE)await page.screenshot({path:process.env.WORK_PREVIEW_CAPTURE});
    await preview.getByRole('button',{name:'미리보기 닫기'}).click();
    await page.locator('#studioCutEdit').click({timeout:8000});
    const inspector=page.locator('#cutEditorPanel');
    await inspector.locator('.ar-font-carousel').waitFor({timeout:8000});
    assert.equal(await inspector.locator('.ar-font-carousel button').count(),46);
    await inspector.getByRole('button',{name:'전환',exact:true}).click();
    await inspector.getByRole('button',{name:'자막',exact:true}).click();
    await page.reload({waitUntil:'domcontentloaded'});
    await menu.waitFor();
    await menu.getByRole('button',{name:/영상 편집기/}).click();
    await page.frameLocator('dialog.ar-video-editor iframe').locator('#file').waitFor({state:'attached'});
    console.log(width+'px · 6개 메뉴, 오토릴스 주제, 컷 편집·전환·글꼴 46종, 영상 편집기 확인');
    await page.frameLocator('dialog.ar-video-editor iframe').locator('[data-studio-back]').click();
    for(const [label,path] of [['내 영상으로 쇼츠 만들기','/assets/shorts/index.html'],['참고 쇼츠·릴스로 재구성하기','/assets/remix/index.html']]){
      await menu.getByRole('link',{name:new RegExp(label)}).click();
      await page.waitForURL(u=>u.pathname===path);
      await page.locator('[data-studio-back]').click();
      await menu.waitFor();
    }
    assert.deepEqual(errors,[]);
    await page.close();
  }
} finally {await browser.close();}
