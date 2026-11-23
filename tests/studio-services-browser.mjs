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
    assert.equal(await page.locator('.studio-topbar .studio-brand-name').innerText(),'AutoReelsMaker');
    const geometry=await menu.evaluate(el=>{
      const [hero,video,collage,cards,shorts,remix]=Array.from(el.querySelectorAll('button,a'),node=>node.getBoundingClientRect());
      return hero.width>video.width && video.top===collage.top && cards.top===shorts.top && remix.width===hero.width;
    });
    assert.ok(geometry,'service cards follow the approved two-column layout');
    for(const photo of await menu.locator('.service-photos img').all()) await photo.evaluate(image=>image.decode());
    const names=await menu.locator('strong').allTextContents();
    assert.deepEqual(names,['오토릴스 만들기','영상 편집기','사진 콜라주','인스타 카드뉴스','밈 쇼츠 만들기','참고 쇼츠·릴스 재구성']);
    if(width===390 && process.env.SERVICES_CAPTURE){
      await page.locator('#arSplashIntro').waitFor({state:'hidden'});
      await menu.getByRole('button',{name:/오토릴스 만들기/}).click({trial:true});
      await menu.screenshot({path:process.env.SERVICES_CAPTURE});
    }
    const offscreen=await menu.evaluate(el=>el.scrollWidth>innerWidth||el.getBoundingClientRect().top>=innerHeight);
    assert.equal(offscreen,false);
    await menu.getByRole('button',{name:/오토릴스 만들기/}).click({timeout:12000});
    await page.locator('#studioPanel_topic').waitFor();
    if(width===390){
      await page.waitForFunction(()=>document.getElementById('reelCanvas').getBoundingClientRect().height>100);
      const split=await page.evaluate(()=>({
        h: innerHeight,
        top: document.getElementById('studioWorkflowColumn').getBoundingClientRect().top,
        bottom: document.getElementById('reelCanvas').getBoundingClientRect().bottom
      }));
      assert.ok(Math.abs(split.top-split.h/2)<2 && split.bottom<=split.top+1,JSON.stringify(split));
      if(process.env.WORK_PREVIEW_CAPTURE)await page.screenshot({path:process.env.WORK_PREVIEW_CAPTURE});
    }
    await page.locator('#studioCutEdit').click({timeout:8000});
    const inspector=page.locator('#cutEditorPanel');
    await inspector.locator('.ar-font-carousel').waitFor({timeout:8000});
    assert.equal(await inspector.locator('.ar-font-carousel button').count(),46);
    await inspector.getByRole('button',{name:'전환',exact:true}).click();
    await inspector.getByRole('button',{name:'자막',exact:true}).click();
    if(width===390){
      const split=await inspector.evaluate(el=>({sheet:el.getBoundingClientRect().top,canvas:document.getElementById('reelCanvas').getBoundingClientRect().bottom,half:innerHeight/2}));
      assert.ok(Math.abs(split.sheet-split.half)<2 && split.canvas<=split.sheet+1,JSON.stringify(split));
      await page.waitForFunction(()=>history.state?.arNav?.ov>0);
      await page.goBack();
      await inspector.waitFor({state:'hidden'});
      await page.locator('#studioPanel_topic').waitFor();
    }
    await page.reload({waitUntil:'domcontentloaded'});
    await menu.waitFor();
    await menu.getByRole('button',{name:/영상 편집기/}).click();
    await page.frameLocator('dialog.ar-video-editor iframe').locator('#file').waitFor({state:'attached'});
    console.log(width+'px · 6개 메뉴, 오토릴스 주제, 컷 편집·전환·글꼴 46종, 영상 편집기 확인');
    await page.frameLocator('dialog.ar-video-editor iframe').locator('[data-studio-back]').click();
    await menu.getByRole('button',{name:/밈 쇼츠 만들기/}).click();
    await page.locator('#arMemeShortsBox').waitFor();
    await page.locator('#showStudioServices').click();
    await menu.waitFor();
    for(const [label,path] of [['참고 쇼츠·릴스 재구성','/assets/remix/index.html']]){
      await menu.getByRole('link',{name:new RegExp(label)}).click();
      await page.waitForURL(u=>u.pathname===path);
      await page.locator('[data-studio-back]').click();
      await menu.waitFor();
    }
    assert.deepEqual(errors,[]);
    await page.close();
  }
} finally {await browser.close();}
