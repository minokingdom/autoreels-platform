import {chromium} from 'playwright';
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {buildApp}=await import('../scripts/build-app.mjs');buildApp(root);
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.wasm':'application/wasm','.jpg':'image/jpeg'};
const srv=http.createServer((req,res)=>{
 let f=path.join(root,'public',decodeURIComponent(req.url.split('?')[0]));
 if(req.url.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});return res.end('{"ok":false}');}
 if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,req.url.split('?')[0]==='/admin'?'public/admin.html':'public/studio.html');res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);
});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const projects=new Map();
const pixelLogo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
const styleFixture={id:'custom:browser-test',name:'우리 매장 테마',baseStyleId:'in_x_cover',fontKey:'maru',colors:{primary:'#f6f1e7',accent:'#756452'},caption:{position:'top',sizeRatio:0.06},logo:{dataUrl:pixelLogo,corner:'top-left',widthRatio:0.12},pinned:true};
const sharedStyles={styles:[],revision:0};
const sharedProjects=new Map();
async function openStyleDevice(legacy, width) {
 const device=await browser.newPage({viewport:{width,height:844}});
 device.on('pageerror',error=>errors.push(error.stack || error.message));
 if(legacy) await device.addInitScript(style=>localStorage.setItem('autoreels:user-styles:v1:browser',JSON.stringify({version:1,styles:[style]})),styleFixture);
 await device.route('**/api/account?action=*',async route=>{
  const action=new URL(route.request().url()).searchParams.get('action');
  const body=route.request().method()==='POST'?route.request().postDataJSON():null;
  if(action==='config') return route.fulfill({json:{ok:true,serverMode:true,plans:[]}});
  if(action==='me') return route.fulfill({json:{ok:true,user:{id:'71',name:'매장',phone:null,industry:'auto',title:'',branch:'',promo:''},entitlement:{pro:false}}});
  if(action==='styles-list') return route.fulfill({json:{ok:true,accountId:'71',...sharedStyles}});
  if(action==='styles-save') {
   assert.equal(body.accountId,'71'); assert.equal(body.revision,sharedStyles.revision);
   sharedStyles.styles=body.styles; sharedStyles.revision++;
   return route.fulfill({json:{ok:true,...sharedStyles}});
  }
  if(action==='project-save') {
   const project={...body,revision:1,updated_at:new Date().toISOString()};
   sharedProjects.set(project.id,project);
   return route.fulfill({json:{ok:true,project}});
  }
  if(action==='project-load') return route.fulfill({json:{ok:true,project:sharedProjects.get(body.id)}});
  return route.fulfill({json:{ok:true,projects:[...sharedProjects.values()]}});
 });
 await device.goto(`http://127.0.0.1:${srv.address().port}/studio`);
 await device.waitForFunction(()=>arCustomRevision!==null);
 await device.evaluate(()=>{isPlaying=false;AudioEngine.enabled=false;AudioEngine.ttsVoice='off';});
 return device;
}
await page.route('**/api/account?action=project-*',async route=>{
 const a=new URL(route.request().url()).searchParams.get('action'),b=route.request().postDataJSON();let body={ok:true};
 if(a==='project-save'){const p={...b,revision:(projects.get(b.id)?.revision||0)+1,updated_at:new Date().toISOString()};console.log('snapshot bytes',Buffer.byteLength(JSON.stringify(b.snapshot)));projects.set(b.id,p);body.project=p;}
 if(a==='project-list')body.projects=[...projects.values()];
 if(a==='project-load')body.project=projects.get(b.id);
 if(a==='project-delete')projects.delete(b.id);
 await route.fulfill({json:body});
});
try{
 const original=await openStyleDevice(true,1280);
 await original.evaluate(()=>arOpenCustomStyle());
 assert.equal(await original.locator('#arCustomSavedList').getByText(styleFixture.name).count(),0);
 const downloadStarted=original.waitForEvent('download');
 await original.locator('#arCustomExport').click();
 const styleDownload=await downloadStarted;
 const styleFile=fs.readFileSync(await styleDownload.path());
 assert.equal(JSON.parse(styleFile.toString('utf8')).styles[0].logo.dataUrl,pixelLogo);
 await original.locator('#arCustomImport').click();
 await original.locator('#arCustomSavedList').getByText(styleFixture.name,{exact:true}).waitFor();
 await original.locator('#arCustomSavedList').getByRole('button',{name:'편집'}).click();
 await original.locator('#arCustomStyleForm [type=submit]').click();
 await original.waitForFunction(id=>campaign.designStyle===id,styleFixture.id);
 await original.evaluate(()=>document.getElementById('arCustomStylePanel').close());
 await original.evaluate(()=>arOpenProjects());
 await original.waitForFunction(()=>!arProjectBusy);
 await original.locator('#arProjectName').fill('테마 보관 검증');
 await original.locator('#arProjectSave').click();
 await original.waitForFunction(()=>!arProjectBusy);
 const saved= [...sharedProjects.values()][0];
 assert.equal(saved.snapshot.customStyles[0].name,styleFixture.name);
 assert.equal(saved.snapshot.customStyles[0].logo.dataUrl,pixelLogo);

 const newDevice=await openStyleDevice(false,390);
 await newDevice.evaluate(()=>arOpenCustomStyle());
 await newDevice.locator('#arCustomSavedList').getByText(styleFixture.name,{exact:true}).waitFor();
 assert.equal(await newDevice.locator('#arCustomImport').isVisible(),false);
 await newDevice.locator('#arCustomSavedList').getByRole('button',{name:`${styleFixture.name} 삭제`}).click();
 await newDevice.waitForFunction(()=>!arCustomSaving && arCustomStyles.length===0);
 await newDevice.evaluate(()=>document.getElementById('arCustomStylePanel').close());
 newDevice.on('dialog',dialog=>dialog.accept());
 await newDevice.evaluate(()=>arOpenProjects());
 await newDevice.locator('#arProjectList').getByRole('button',{name:'불러오기'}).click();
 await newDevice.waitForFunction(id=>getActiveDesign().id===id,styleFixture.id);
 assert.equal(await newDevice.evaluate(()=>getActiveDesign().custom.colors.primary),styleFixture.colors.primary);
 assert.equal(await newDevice.evaluate(()=>getActiveDesign().custom.logo.dataUrl),pixelLogo);
 await newDevice.locator('#arProjectsClose').click();
 await newDevice.evaluate(()=>arOpenCustomStyle());
 const chooserPromise=newDevice.waitForEvent('filechooser');
 await newDevice.locator('#arCustomImportFileButton').click();
 await (await chooserPromise).setFiles({name:styleDownload.suggestedFilename(),mimeType:'application/json',buffer:styleFile});
 await newDevice.locator('#arCustomSavedList').getByText(styleFixture.name,{exact:true}).waitFor();
 await original.close(); await newDevice.close();
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
 const profile = {id:'1', phone:null, industry:'clinic', specialty:'치과', name:'테스트', title:'', branch:'', promo:''};
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
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByText('치과 확인 주제',{exact:true}).waitFor();
 await page.locator('#headerSettingsBtn').click();
 const settings = page.locator('#studioSettingsModal');
 await settings.locator('#settingsBusinessDetails summary').click();
 const detail = settings.getByLabel('세부 업종 (직접 입력)',{exact:true});
 const industry = settings.getByLabel('업종 대분류',{exact:true});
 assert.equal(await detail.inputValue(),'치과');
 assert.equal(await industry.locator('option').count(),10);
 await detail.fill('교정 전문 치과');
 await settings.getByRole('button',{name:'업종 저장',exact:true}).click();
 await settings.getByText('저장했습니다.',{exact:true}).waitFor();
 await page.getByText('교정 전문 치과 확인 주제',{exact:true}).waitFor();
 assert.deepEqual(aiRequests.at(-1).trends,['교정 전문 치과 첫 방문']);
 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByText('교정 전문 치과 확인 주제',{exact:true}).waitFor();
 await page.locator('#arQuickBar [data-qb="settings"]').click();
 await settings.locator('#settingsBusinessDetails summary').click();
 assert.equal(await detail.inputValue(),'교정 전문 치과');
 assert.ok(await detail.evaluate(el=>el.getBoundingClientRect().bottom < innerHeight));
 await industry.selectOption('restaurant');
 assert.equal(await detail.inputValue(),'');
 await detail.fill('태국 음식점');
 await settings.getByRole('button',{name:'업종 저장',exact:true}).click();
 await settings.getByText('저장했습니다.',{exact:true}).waitFor();
 await page.getByText('태국 음식점 확인 주제',{exact:true}).waitFor();
 assert.equal(aiRequests.at(-1).industry,'restaurant');
 assert.deepEqual(aiRequests.at(-1).trends,['태국 음식점 첫 방문']);
 assert.equal(await page.getByText('교정 전문 치과 확인 주제',{exact:true}).count(),0);
 await settings.getByRole('button',{name:'닫기',exact:true}).click();
 await page.evaluate(()=>{openDealerAuthModal();switchAuthModalTab('signup');});
 await page.locator('#arPhoneLoginOptions').evaluate(el=>{el.open=true;});
 await page.locator('#authIndustryInput').selectOption('beauty');
 await page.locator('#authSpecialtyInput').fill('남성 전문 미용실');
 assert.equal(await page.locator('#authSpecialtyInput').inputValue(),'남성 전문 미용실');
 let adminAuthenticated = false;
 await page.route(/\/api\/account\?action=admin-/, async route => {
  const params = new URL(route.request().url()).searchParams;
  const action = params.get('action');
  if (action === 'admin-console-login') {
   adminAuthenticated = route.request().postDataJSON().token === 'local-admin';
   return route.fulfill({status:adminAuthenticated ? 200 : 401,json:{ok:adminAuthenticated,message:'관리자 키가 올바르지 않습니다.'}});
  }
  if (action === 'admin-console-logout') {
   adminAuthenticated = false;
   return route.fulfill({json:{ok:true}});
  }
  if (!adminAuthenticated) return route.fulfill({status:401,json:{ok:false}});
  const rows = [{industry:'clinic',specialty:'치과',accounts:2,attempted_day:'2026-11-18',last_result:'collected',keywords:['치과 검진 안내'],fresh:true}];
  return route.fulfill({json:{ok:true,rows:params.get('industry')==='restaurant'?[]:rows,summary:{accounts:3,configured:2,specialties:1},hasNext:false,
   lastRun:{status:'complete',finished_at:'2026-11-18T19:04:00.000Z',attempted:3,collected:1,failed:1}}});
 });
 await page.route('**/trends-today.json', route => route.fulfill({json:{date:'2026-11-18',updatedAt:'2026-11-18T19:14:00.000Z',industries:{restaurant:{keywords:['태국식 메뉴 추천']}}}}));
 await page.route('**/assets/reference-styles.json', route => route.fulfill({json:[
  {id:'example',name:'검증용 포토 프레임',category:'감성',addedAt:new Date().toISOString()}
 ]}));
 await page.goto(`http://127.0.0.1:${srv.address().port}/admin`);
 await page.getByLabel('관리자 키').fill('wrong');
 await page.getByRole('button',{name:'로그인',exact:true}).click();
 await page.getByText('관리자 키가 올바르지 않습니다.',{exact:true}).waitFor();
 await page.getByLabel('관리자 키').fill('local-admin');
 await page.getByRole('button',{name:'로그인',exact:true}).click();
 await page.getByText('치과 검진 안내',{exact:true}).waitFor();
 await page.getByText('참조 스타일 1개 등록 · 신규 1개',{exact:false}).waitFor();
 assert.match(await page.locator('#specialtyRunStatus').textContent(),/3개 시도, 1개 수집, 1개 결과 없음, 1개 실패/);
 assert.match(await page.locator('#sharedTrendStatus').textContent(),/1\/10개 업종 갱신/);
 await page.getByText('공통 업종 키워드 보기',{exact:true}).click();
 assert.equal(await page.getByText('태국식 메뉴 추천',{exact:true}).isVisible(),true);
 await page.getByText('등록된 스타일 보기',{exact:true}).click();
 assert.equal(await page.getByText('검증용 포토 프레임 · 감성',{exact:false}).isVisible(),true);
 await page.getByLabel('대분류',{exact:true}).selectOption('restaurant');
 await page.getByText('이 페이지에 표시할 세부 업종이 없습니다.',{exact:true}).waitFor();
 await page.reload();
 await page.getByText('이 페이지에 표시할 세부 업종이 없습니다.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'로그아웃',exact:true}).click();
 await page.getByText('로그아웃했습니다.',{exact:true}).waitFor();
 assert.equal(await page.locator('#adminDashboard').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('project browser ok: project restore, password recovery, specialty editing, admin login/filter/reload/logout');
}finally{await browser.close();await new Promise(r=>srv.close(r));}
