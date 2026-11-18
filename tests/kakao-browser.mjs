import {chromium} from 'playwright';
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import assert from 'node:assert/strict'; import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {buildApp}=await import('../scripts/build-app.mjs');buildApp(root);
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.wasm':'application/wasm','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const srv=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]);if(pathname.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});return res.end('{"ok":false}');}let f=path.join(root,'public',pathname);if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'public/studio.html');res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:320,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/account?action=config',route=>route.fulfill({json:{ok:true,serverMode:true,kakaoLogin:true,phoneVerification:true,snsScheduling:false,sns:{}}}));
await page.route('**/api/account?action=me',route=>route.fulfill({json:{ok:false,guest:true}}));
await page.route('**/api/account?action=phone-code',route=>route.fulfill({json:{ok:true,challengeId:'browser-otp-test'}}));
const guestGenerationRequests=[];
page.on('request',request=>{
 const url=new URL(request.url());
 if(['/api/generate-script','/api/tts','/api/tts-script'].includes(url.pathname)||url.searchParams.get('action')==='generate-bgm') {
  guestGenerationRequests.push(url.pathname);
 }
});
try{
 await page.goto(`http://127.0.0.1:${srv.address().port}/studio`);await page.waitForFunction(()=>window.AR_SERVER?.mode===true);
 await page.locator('#dealerAuthModal').waitFor({state:'visible'});
 await page.locator('#arKakaoLoginBtn').waitFor({state:'visible'});
 await page.getByRole('button',{name:'로그인 없이 둘러보기'}).click();
 await page.locator('#arQuickBar [data-qb="settings"]').click();
 const settings=page.getByRole('dialog',{name:'스튜디오 설정'});
 assert.equal(await settings.locator('#settingsBusinessProfile').isVisible(),false);
 await settings.getByRole('button',{name:'로그인 · 가입'}).click();
 const auth=page.getByRole('dialog',{name:'로그인 · 회원가입'});
 const kakao=auth.getByRole('link',{name:'카카오 로그인'});
 assert.equal(await kakao.isVisible(),true);
 assert.equal(await kakao.getAttribute('href'),'/api/account?action=kakao-start');
 assert.equal(await auth.getByLabel('휴대폰 번호',{exact:true}).isVisible(),false);
 assert.equal(await auth.locator('#arPhoneVerification').isVisible(),false);
 assert.equal(await kakao.locator('img').evaluate(img=>img.naturalWidth>0),true);
 assert.equal(await auth.locator('.ar-modal-card').evaluate(card=>card.scrollWidth<=card.clientWidth),true);
 await page.locator('#arKakaoPrivacy').click();assert.equal(await page.locator('#arLegalModal').isVisible(),true);assert.match(await page.locator('#arLegalModalBody').textContent(),/카카오 회원 식별자/);
 await page.evaluate(()=>closeArLegalModal());
 await auth.locator('#arPhoneLoginOptions summary').press('Enter');
 assert.equal(await auth.getByLabel('휴대폰 번호',{exact:true}).isVisible(),true);
 assert.equal(await auth.locator('#arPhoneVerification').isVisible(),false);
 await auth.getByRole('button',{name:'비밀번호 찾기',exact:true}).click();
 assert.equal(await auth.locator('#arPhoneVerification').isVisible(),true);
 assert.equal(await auth.locator('#arPhoneCode').isVisible(),false);
 await auth.getByLabel('휴대폰 번호',{exact:true}).fill('01012345678');
 await auth.getByRole('button',{name:'인증번호 받기'}).click();
 await auth.getByLabel('인증번호 6자리').waitFor();
 await auth.getByLabel('휴대폰 번호',{exact:true}).fill('01012345679');
 assert.equal(await auth.getByLabel('인증번호 6자리').isVisible(),false);
 await auth.getByRole('button',{name:'닫기'}).click();
 await page.locator('#topicCards [data-topic-idx]').first().click();
 await page.locator('#authGenerationNotice').waitFor({state:'visible'});
 assert.equal(await kakao.isVisible(),true);
 assert.equal(await page.locator('#scriptGeneratingStatus').isVisible(),false);
 await auth.getByRole('button',{name:'닫기'}).click();
 await page.evaluate(()=>toggleAudioMaster(true));
 assert.equal(await page.evaluate(()=>AudioEngine.ttsProvider),'browser');
 assert.deepEqual(guestGenerationRequests,[]);
 const user={id:'733',phone:null,name:'사용자',title:'',branch:'',promo:'',industry:'auto'};
 await page.evaluate(user=>arApplyMe({user,entitlement:{pro:false},usage:{}}),user);
 assert.equal(await page.evaluate(()=>selectedDealerId),'account_733');
 await page.locator('#arQuickBar [data-qb="settings"]').click();
 await settings.getByRole('button',{name:'계정 · 요금제'}).click();
 assert.equal(await page.locator('#arPasswordSecurity').isVisible(),false);
 const oldAddress=await browser.newPage({viewport:{width:390,height:844}});
 oldAddress.on('pageerror',error=>errors.push(error.message));
 let sendConfig;
 const configReady=new Promise(resolve=>{sendConfig=resolve;});
 await oldAddress.route('https://autoreels-studio.vercel.app/**',async route=>{
  const url=new URL(route.request().url());
  if(url.searchParams.get('action')==='config'){
   await configReady;
   return route.fulfill({json:{ok:true,serverMode:true,kakaoLogin:false,phoneVerification:false,sns:{}}});
  }
  return route.fulfill({response:await route.fetch({url:`http://127.0.0.1:${srv.address().port}${url.pathname}${url.search}`})});
 });
 await oldAddress.goto('https://autoreels-studio.vercel.app/studio',{waitUntil:'domcontentloaded'});
 await oldAddress.locator('#arQuickBar [data-qb="settings"]').click();
 await oldAddress.getByRole('button',{name:'로그인 · 가입'}).click();
 const pendingKakao=oldAddress.getByRole('link',{name:'카카오 로그인'});
 assert.equal(await pendingKakao.isVisible(),true);
 assert.equal(await pendingKakao.getAttribute('href'),'https://autoreelsmaker.kr/api/account?action=kakao-start');
 sendConfig();
 await pendingKakao.waitFor({state:'hidden'});
 assert.equal(await oldAddress.getByLabel('휴대폰 번호',{exact:true}).isVisible(),true);
 await oldAddress.getByRole('button',{name:'비밀번호 찾기',exact:true}).click();
 assert.equal(await oldAddress.getByRole('button',{name:'인증번호 받기'}).isDisabled(),true);
 assert.deepEqual(errors,[]);console.log('kakao browser ok: button visible, phone-free account uses unique identity');
}finally{await browser.close();await new Promise(r=>srv.close(r));}
