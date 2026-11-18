import {chromium} from 'playwright';
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {buildApp}=await import('../scripts/build-app.mjs');buildApp(root);
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.wasm':'application/wasm','.jpg':'image/jpeg'};
const srv=http.createServer((req,res)=>{
 let f=path.join(root,'public',decodeURIComponent(req.url.split('?')[0]));
 if(req.url.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});return res.end('{"ok":false}');}
 if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'public/studio.html');res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);
});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const projects=new Map();
await page.route('**/api/account?action=project-*',async route=>{
 const a=new URL(route.request().url()).searchParams.get('action'),b=route.request().postDataJSON();let body={ok:true};
 if(a==='project-save'){const p={...b,revision:(projects.get(b.id)?.revision||0)+1,updated_at:new Date().toISOString()};console.log('snapshot bytes',Buffer.byteLength(JSON.stringify(b.snapshot)));projects.set(b.id,p);body.project=p;}
 if(a==='project-list')body.projects=[...projects.values()];
 if(a==='project-load')body.project=projects.get(b.id);
 if(a==='project-delete')projects.delete(b.id);
 await route.fulfill({json:body});
});
try{
 await page.goto(`http://127.0.0.1:${srv.address().port}/studio`);await page.waitForTimeout(1000);
 await page.evaluate(()=>{isPlaying=false;AudioEngine.enabled=false;AudioEngine.ttsVoice='off';AudioEngine.bgmStyle='off';AR_SERVER.mode=true;AR_SERVER.me={user:{id:'1'}};});
 await page.evaluate(()=>arOpenProjects());await page.waitForFunction(()=>!arProjectBusy);
 await page.locator('#arProjectName').fill('브라우저 저장 검증');
 await page.evaluate(()=>AudioEngine.loadRemoteBgmUrl('/assets/bgm/pack/cafe.mp3','카페 음악',false));
 const before=await page.evaluate(()=>{campaign.cutCaptions[0]='저장할 첫 자막';campaign.ttsLines[0]='저장할 멘트';campaign.cutFilters=['warm'];return {style:campaign.designStyle,photos:campaign.uploadedPhotos.length};});
 await page.locator('#arProjectSave').click();await page.waitForFunction(()=>!arProjectBusy);
 assert.equal(projects.size,1,await page.locator('#arProjectNotice').textContent());
 assert.equal([...projects.values()][0].snapshot.audio.packPath,'/assets/bgm/pack/cafe.mp3');
 await page.evaluate(()=>{campaign.cutCaptions[0]='바뀐 내용';campaign.cutFilters=[];});
 page.on('dialog',d=>d.accept());await page.locator('#arProjectList button').filter({hasText:'불러오기'}).click();await page.waitForFunction(()=>!arProjectBusy);
 console.log('load notice',await page.locator('#arProjectNotice').textContent());
 const after=await page.evaluate(()=>({caption:campaign.cutCaptions[0],line:campaign.ttsLines[0],filter:campaign.cutFilters[0],photos:campaign.uploadedPhotos.length,loaded:campaign.uploadedPhotos.every(p=>p.naturalWidth>0)}));
 assert.deepEqual(after,{caption:'저장할 첫 자막',line:'저장할 멘트',filter:'warm',photos:before.photos,loaded:true});
 assert.equal(await page.evaluate(()=>new URL(AudioEngine.customBgmAudioEl.src).pathname),'/assets/bgm/pack/cafe.mp3');
 await page.locator('#arProjectsClose').click();assert.equal(await page.locator('#arProjectsModal').isVisible(),false);
 await page.waitForTimeout(500);
 await page.reload();await page.waitForTimeout(800);
 await page.evaluate(async()=>{isPlaying=false;AudioEngine.enabled=false;AR_SERVER.mode=true;AR_SERVER.me={user:{id:'1'}};await arRestoreLastProject();});
 assert.equal(await page.evaluate(()=>campaign.cutCaptions[0]),'저장할 첫 자막');
 await page.evaluate(()=>{openDealerAuthModal();AR_SERVER.mode=true;});await page.locator('#arForgotPassword').click();await page.waitForTimeout(50);
 assert.equal(await page.locator('#arPhoneVerification').isVisible(),true);assert.equal(await page.locator('#authSubmitBtn').textContent(),'인증하고 비밀번호 재설정');
 await page.evaluate(()=>closeDealerAuthModal());
 const profile = {id:'1', industry:'clinic', specialty:'치과', name:'테스트'};
 const aiRequests = [];
 await page.route('**/api/account?action=*', async route => {
  const action = new URL(route.request().url()).searchParams.get('action');
  if (action === 'config') return route.fulfill({json:{ok:true,serverMode:true,plans:[]}});
  if (action === 'profile') Object.assign(profile, route.request().postDataJSON());
  if (action === 'specialty-trends') {
   return route.fulfill({json:{...profile,keywords:[profile.specialty + ' 첫 방문'],updatedAt:'test-batch'}});
  }
  if (action === 'me' || action === 'profile') return route.fulfill({json:{ok:true,user:profile,entitlement:{pro:false}}});
  return route.fulfill({json:{ok:true,projects:[]}});
 });
 await page.route('**/api/generate-script', async route => {
  const body = route.request().postDataJSON();
  if (body.mode !== 'topics' || !body.specialty) return route.fulfill({status:503,json:{ok:false}});
  aiRequests.push(body);
  return route.fulfill({json:{ok:true,topics:[{title:body.specialty + ' 확인 주제',why:'업종 맞춤',prompt:body.specialty + ' 첫 방문 안내'}]}});
 });
 await page.reload();
 await page.getByText('치과 확인 주제',{exact:true}).waitFor();
 await page.locator('#headerSettingsBtn').click();
 assert.match(await page.locator('#settingsIndustrySummary').textContent(),/치과/);
 await page.getByRole('button',{name:'업종 바꾸기',exact:true}).click();
 assert.equal(await page.locator('#industrySpecialtyInput').inputValue(),'치과');
 await page.locator('#industrySpecialtyInput').fill('교정 전문 치과');
 await page.locator('#industryPickerSave').click();
 await page.getByText('교정 전문 치과 확인 주제',{exact:true}).waitFor();
 assert.deepEqual(aiRequests.at(-1).trends,['교정 전문 치과 첫 방문']);
 await page.reload();
 await page.getByText('교정 전문 치과 확인 주제',{exact:true}).waitFor();
 await page.locator('#headerSettingsBtn').click();
 await page.getByRole('button',{name:'업종 바꾸기',exact:true}).click();
 await page.locator('#industryPickerGrid button[data-ind="restaurant"]').click();
 assert.equal(await page.locator('#industrySpecialtyInput').inputValue(),'');
 await page.locator('#industrySpecialtyInput').fill('태국 음식점');
 await page.locator('#industryPickerSave').click();
 await page.getByText('태국 음식점 확인 주제',{exact:true}).waitFor();
 assert.equal(aiRequests.at(-1).industry,'restaurant');
 assert.deepEqual(aiRequests.at(-1).trends,['태국 음식점 첫 방문']);
 assert.equal(await page.getByText('교정 전문 치과 확인 주제',{exact:true}).count(),0);
 await page.evaluate(()=>{openDealerAuthModal();switchAuthModalTab('signup');});
 await page.locator('#authIndustryInput').selectOption('beauty');
 await page.locator('#authSpecialtyInput').fill('남성 전문 미용실');
 assert.equal(await page.locator('#authSpecialtyInput').inputValue(),'남성 전문 미용실');
 assert.deepEqual(errors,[]);console.log('project browser ok: save, load photos/cuts/voice settings, refresh restore, modal close, password recovery UI');
}finally{await browser.close();await new Promise(r=>srv.close(r));}
