import {chromium} from 'playwright';
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import assert from 'node:assert/strict'; import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {buildApp}=await import('../scripts/build-app.mjs');buildApp(root);
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.wasm':'application/wasm','.jpg':'image/jpeg'};
const srv=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]);if(pathname.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});return res.end('{"ok":false}');}let f=path.join(root,'public',pathname);if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'public/studio.html');res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/account?action=config',route=>route.fulfill({json:{ok:true,serverMode:true,kakaoLogin:true,snsScheduling:false,sns:{}}}));
await page.route('**/api/account?action=me',route=>route.fulfill({json:{ok:false,guest:true}}));
try{
 await page.goto(`http://127.0.0.1:${srv.address().port}/studio`);await page.waitForFunction(()=>window.AR_SERVER?.mode===true);
 await page.evaluate(()=>openDealerAuthModal());assert.equal(await page.locator('#arKakaoLoginBtn').isVisible(),true);
 await page.locator('#arKakaoPrivacy').click();assert.equal(await page.locator('#arLegalModal').isVisible(),true);assert.match(await page.locator('#arLegalModalBody').textContent(),/카카오 회원 식별자/);
 await page.evaluate(()=>closeArLegalModal());
 const user={id:'733',phone:null,name:'사용자',title:'',branch:'',promo:'',industry:'auto'};
 await page.evaluate(user=>arApplyMe({user,entitlement:{pro:false},usage:{}}),user);
 assert.equal(await page.evaluate(()=>selectedDealerId),'account_733');
 assert.deepEqual(errors,[]);console.log('kakao browser ok: button visible, phone-free account uses unique identity');
}finally{await browser.close();await new Promise(r=>srv.close(r));}
