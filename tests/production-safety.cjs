const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function load(file,deps={},env={},globals={}){const module={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{module,exports:module.exports,require:n=>{if(Object.hasOwn(deps,n))return deps[n];if(n.startsWith('node:')||n==='crypto')return require(n);throw Error(n)},process:{env},Buffer,URL,URLSearchParams,console:{error(){}},setTimeout,clearTimeout,...globals});return module.exports;}
function response(){return {statusCode:200,body:null,setHeader(){},status(n){this.statusCode=n;return this},json(b){this.body=b;return this}};}
(async()=>{
 let called=0,refunds=0;
 let unavailable=true;
 const dependencies={consume:async()=>{if(unavailable)throw Error('db_down');return {ok:true}},refundUsage:async()=>refunds++,isSameSiteRequest:()=>true};
 const meter=load('lib/server/meter.js',{'./usage':dependencies});
 let res=response();await meter.withMeter(async()=>called++,'ai',()=>1)({method:'POST'},res);
 assert.equal(res.statusCode,503);assert.equal(called,0);
 unavailable=false;
 res=response();await meter.withMeter(async(q,r)=>r.json({ok:false}),'ai',()=>1)({method:'POST'},res);assert.equal(refunds,1);
 await assert.rejects(()=>meter.withMeter(async()=>{throw Error('provider')},'ai',()=>1)({method:'POST'},response()));assert.equal(refunds,2);
 await meter.withMeter(async(q,r)=>r.json({ok:true}),'ai',()=>1)({method:'POST'},response());assert.equal(refunds,2);
 const unitOf=load('api/generate-script.js',{'../lib/server/usage':{isSameSiteRequest:()=>true},'../lib/server/meter':{withMeter:(h,k,u)=>u},'../lib/business-specialty.cjs':require('../lib/business-specialty.cjs')});
 for(const mode of ['topics','scene-prompts','scene-image','script'])assert.equal(unitOf({method:'POST',body:{mode}}),1);
 assert.equal(unitOf({method:'POST',body:{mode:'scene-images',count:4}}),5);
 assert.equal(unitOf({method:'POST',body:{mode:'scene-images',count:999}}),11);
 const compConfig={COMP_PRO_USER_IDS:'41, 42',COMP_PRO_PHONES:'010-0000-0023, 010-0000-0024'};
 const config={readiness:()=>({serverMode:true})};
 const comp=load('lib/server/comp-pro.js',{'./config':config},compConfig);
 assert.equal(comp.hasCompProConfig({COMP_PRO_USER_IDS:'42'}),true);
 assert.equal(comp.isCompPro({id:42,phone:null}),true);
 assert.equal(comp.isCompPro({id:'420',phone:null}),false);
 assert.equal(comp.isCompPro({id:'23',phone:'01000000023'}),true);
 assert.equal(comp.isCompPro({id:'24',phone:'010-0000-0024'}),true);
 assert.equal(comp.isCompPro({id:'25',phone:'010-0000-0025'}),false);
 assert.equal(load('lib/server/comp-pro.js',{'./config':{readiness:()=>({serverMode:false})}},compConfig)
  .isCompPro({id:42,phone:null}),false);
 const testBilling=load('lib/server/billing.js',{
  './config':config,'./comp-pro':comp,'./veyon':{},'./plans':{PLANS:{}},
  './db':{query:async(sql)=>({rows:sql.includes('FROM ar_users')?[{id:42,phone:null}]:[]})}
 },{COMP_PRO_USER_IDS:'42'});
 const testSubscription=testBilling.publicSubscription(await testBilling.getSubscription(42));
 assert.equal(testSubscription.comp,true);
 assert.equal(testSubscription.plan,'pro');
 assert.equal(testSubscription.amount,0);
 await assert.rejects(()=>testBilling.prepareCard({id:42,phone:null},'pro'),{code:'COMP_PRO_ACTIVE'});
 let balances=new Map(),receipts=new Map();
 const key=(s,p)=>s+'|'+p;
 const query=async(sql,p=[])=>{
  if(sql.includes('FROM ar_users')) {
   if (p[0]==='42') return {rows:[{id:42,phone:null,session_version:1,created_at:new Date(Date.now()-8*86400000)}]};
   return {rows:p[0]==='2'
    ? [{id:2,session_version:1,created_at:new Date(Date.now()-8*86400000)}]
    : [{id:1,session_version:1,plan:'standard',status:'active',current_period_end:new Date(Date.now()+86400000)}]};
  }
  if(sql.includes('pg_advisory'))return {rows:[]};
  if(sql.startsWith('SELECT kind, result'))return {rows:receipts.has(key(p[0],p[1]))?[receipts.get(key(p[0],p[1]))]:[]};
  if(sql.startsWith('INSERT INTO ar_usage_requests')){receipts.set(key(p[0],p[1]),{kind:p[2],result:JSON.parse(p[3])});return {rows:[]};}
  if(sql.startsWith('UPDATE ar_usage_requests')){receipts.get(key(p[0],p[1])).result.refunded=true;return {rows:[]};}
  if(sql.startsWith('INSERT INTO ar_usage ')){
   assert.ok(sql.includes('WHERE $4::bigint IS NULL OR'));const k=key(p[0],p[1]),old=balances.get(k)||0;
   if(p[3]!==null&&old+p[2]>p[3])return {rows:[]};balances.set(k,old+p[2]);return {rows:[{used:old+p[2]}]};
  }
  if(sql.startsWith('UPDATE ar_usage SET')){const k=key(p[0],p[1]);balances.set(k,Math.max(0,(balances.get(k)||0)-p[2]));return {rows:[]};}
  throw Error(sql);
 };
 const db={query,tx:async fn=>{const before=new Map(balances),prior=structuredClone(receipts);try{return await fn({query})}catch(e){balances=before;receipts=prior;throw e}}};
 const usage=load('lib/server/usage.js',{'./db':db,'./config':{readiness:()=>({serverMode:true})},'./session':{readSession:req=>req.testSession},'./plans':{FREE_TRIAL_DAYS:7,limits:()=>({standard:{aiScripts:5,ttsChars:10,exportPublishLimit:2}})},'./comp-pro':comp},{AI_DAILY_UNIT_CAP:'3',AI_MONTHLY_UNIT_CAP:'3'});
 assert.equal((await usage.resolveSubject({testSession:{uid:'42',v:1}})).tier,'pro');
 assert.equal((await usage.resolveSubject({testSession:{uid:'42',v:2}})).kind,'anonymous');
 const guardedMeter = load('lib/server/meter.js', {'./usage':usage});
 const deps = {
   '../lib/server/usage':usage,
   '../lib/server/meter':guardedMeter,
   '../lib/business-specialty.cjs':require('../lib/business-specialty.cjs'),
   '../lib/reference-analysis.cjs':{handleReferenceAnalysis:()=>assert.fail('비로그인 영상 분석 실행')},
   '../lib/fish-voices':require('../lib/fish-voices'),
   '../lib/korean-numbers':require('../lib/korean-numbers')
 };
 let providerCalls = 0;
 const guardedApi = file => load('api/'+file+'.js', deps, {
   GEMINI_API_KEY:'test', KIE_API_KEY:'test', FISH_API_KEY:'test', BLOB_READ_WRITE_TOKEN:'test'
 }, {fetch:()=>{providerCalls++; throw Error('unexpected_provider_request')}});
 const scriptApi = guardedApi('generate-script');
 const cases = [
   ...['script','topics','scene-prompts','scene-image','scene-images','reference-style']
     .map(mode=>[scriptApi,{method:'POST',body:{mode,prompt:'sample',count:4}}]),
   ...['kie','gemini'].map(diag=>[scriptApi,{method:'GET',query:{diag}}]),
   [guardedApi('tts'),{method:'GET',query:{text:'sample'}}],
   [guardedApi('tts'),{method:'POST',body:'{}',query:{text:'sample'}}],
   [guardedApi('tts-script'),{method:'GET',query:{lines:JSON.stringify(['sample'])}}],
   [guardedApi('tts-voices'),{method:'POST',query:{action:'generate-bgm'},body:{prompt:'sample'}}]
 ];
 for(const [api,request] of cases){
   const headers={host:'app.test',origin:'https://app.test'};
   for(const testSession of [undefined,{uid:'1',v:2}]){
     const denied=response();
     await api({...request,testSession,headers},denied);
     assert.equal(denied.statusCode,401,JSON.stringify(request));
     assert.equal(denied.body.error,'login_required');
   }
   const expired=response();
   await api({...request,headers,testSession:{uid:'2',v:1}},expired);
   assert.equal(expired.statusCode,403,JSON.stringify(request));
   assert.equal(expired.body.error,'trial_expired');
 }
 assert.equal(providerCalls,0);
 assert.equal(balances.size,0);
 const publicUrls=[];
 const trends = load('api/trends.js',{
   pg:{Pool:class {}}, '../lib/server/usage':usage,
   '../lib/server/specialty-trends':{runScheduledSpecialtyTrends:()=>assert.fail('비로그인 배치 실행')}
 },{APIFY_TOKEN:'test',IG_ACCESS_TOKEN:'test',IG_USER_ID:'test',YOUTUBE_API_KEY:'test'},{
   AbortSignal, fetch:async url=>{publicUrls.push(new URL(url).hostname);return {ok:true,text:async()=>''}}
 });
 const publicTrends=response();
 await trends({method:'GET',query:{industry:'auto',refresh:'1'},headers:{}},publicTrends);
 assert.equal(publicTrends.statusCode,200);
 assert.deepEqual(publicUrls,['www.youtube.com']);
 const cronDenied=response();
 await trends({method:'GET',query:{cron:'1'},headers:{}},cronDenied);
 assert.equal(cronDenied.statusCode,403);
 const req={headers:{},testSession:{uid:'1',v:1}};
 const first=await usage.consume(req,'ai',2);assert.equal(first.ok,true);
 const before=[...balances];assert.equal((await usage.consume(req,'ai',2)).ok,false);assert.deepEqual([...balances],before);
 await usage.refundUsage(req,'ai',2,first);assert.ok([...balances.values()].every(x=>x===0));
 const id='test-export-request-001';
 const one=await usage.consume(req,'export',1,{requestId:id});const two=await usage.consume(req,'export',1,{requestId:id});
 assert.equal(one.used,1);assert.equal(two.used,1);
 await usage.refundUsage(req,'export',1,one);await usage.refundUsage(req,'export',1,one);
 assert.equal(balances.get(key('u:1',one.accounting.period)),0);
 assert.equal((await usage.consume(req,'export',1,{requestId:id})).status,409);
 const jobs=new Map();let accesses=0;
 const snsDb={query:async(sql,p=[])=>{
   if(sql.startsWith('INSERT INTO ar_publish_jobs')){
     const k=p[6]+'|'+p[1];if(jobs.has(k))return {rows:[]};jobs.set(k,{id:1,status:'pending',url:'',error:''});return {rows:[{id:1}]};
   }
   if(sql.startsWith('SELECT id, status'))return {rows:[jobs.get(p[1]+'|'+p[2])]};
   if(sql.startsWith('SELECT * FROM ar_sns_accounts')){accesses++;return {rows:[]};}
   if(sql.startsWith('UPDATE ar_publish_jobs')){const j=[...jobs.values()].find(x=>x.id===p[0]);j.status=p[1];j.error=p[3];return {rows:[]};}
   throw Error(sql);
 }};
 const sns=load('lib/server/sns.js',{'./db':snsDb,'./scheduler':{available:async()=>false},'./config':{clean:v=>String(v||'').trim(),siteUrl:()=>''}});
 const publishBody={targets:['instagram','instagram'],videoUrl:'https://test.public.blob.vercel-storage.com/publish/1/video.mp4',requestId:'sns-request-12345678'};
 const firstJobs=await sns.startPublish({id:1},publishBody),retryJobs=await sns.startPublish({id:1},publishBody);
 assert.equal(firstJobs.length,1);assert.equal(firstJobs[0].status,'failed');assert.equal(retryJobs[0].id,firstJobs[0].id);assert.equal(accesses,1);
 await assert.rejects(()=>sns.startPublish({id:1},{...publishBody,scheduledAt:'2026-12-01'}),e=>e.code==='scheduling_unavailable');
 let charged=0,returned=0;
 const snsApi=load('api/sns.js',{'../lib/server/db':{query:async()=>({rows:[{id:1,session_version:1}]})},'../lib/server/config':{readiness:()=>({serverMode:true}),siteUrl:()=>''},'../lib/server/session':{readSession:()=>({uid:'1',v:1}),sameOrigin:()=>true},'../lib/server/billing':{getSubscription:async()=>({})},'../lib/server/usage':{isActive:()=>true,consume:async()=>{charged++;return {ok:true}},refundUsage:async()=>{returned++}},'../lib/server/sns':{TARGETS:sns.TARGETS,SnsError:sns.SnsError,requireSchedule:sns.requireSchedule,startPublish:async()=>[{status:'failed'}]}});
 let reply=response();await snsApi({query:{action:'publish'},method:'POST',body:{...publishBody,scheduledAt:'2026-12-01'}},reply);assert.equal(reply.statusCode,503);assert.equal(charged,0);
 reply=response();await snsApi({query:{action:'publish'},method:'POST',body:publishBody},reply);assert.equal(reply.statusCode,502);assert.equal(charged,1);assert.equal(returned,1);

 const source=fs.readFileSync(path.join(root,'lib/server/sns.js'),'utf8');
 assert.match(source,/status = 'starting'.*status = 'scheduled'/);
 assert.match(source,/ON CONFLICT \(user_id, request_key, provider\) DO NOTHING/);
 console.log('production safety ok: fail-closed meter, failed-response refund, all AI modes charged, atomic budget rollback, idempotent export/refund, SNS claim guards');
})().catch(e=>{console.error(e);process.exitCode=1});
