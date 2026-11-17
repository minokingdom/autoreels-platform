const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function load(file,deps={},env={}){const module={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{module,exports:module.exports,require:n=>{if(Object.hasOwn(deps,n))return deps[n];if(n.startsWith('node:')||n==='crypto')return require(n);throw Error(n)},process:{env},Buffer,URL,URLSearchParams,console:{error(){}},setTimeout,clearTimeout});return module.exports;}
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
 const unitOf=load('api/generate-script.js',{'../lib/server/usage':{isSameSiteRequest:()=>true},'../lib/server/meter':{withMeter:(h,k,u)=>u}});
 for(const mode of ['topics','scene-prompts','scene-image','script'])assert.equal(unitOf({method:'POST',body:{mode}}),1);
 assert.equal(unitOf({method:'POST',body:{mode:'scene-images',count:4}}),5);
 assert.equal(unitOf({method:'POST',body:{mode:'scene-images',count:999}}),11);
 let balances=new Map(),receipts=new Map();
 const key=(s,p)=>s+'|'+p;
 const query=async(sql,p=[])=>{
  if(sql.includes('FROM ar_users'))return {rows:[{id:1,session_version:1,plan:'standard',status:'active',current_period_end:new Date(Date.now()+86400000)}]};
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
 const usage=load('lib/server/usage.js',{'./db':db,'./config':{readiness:()=>({serverMode:true})},'./session':{readSession:()=>({uid:'1',v:1})},'./plans':{limits:()=>({standard:{aiScripts:5,ttsChars:10,exportPublishLimit:2}})},'./comp-pro':{effectiveSubscription:(_,s)=>s}},{AI_DAILY_UNIT_CAP:'3',AI_MONTHLY_UNIT_CAP:'3'});
 const req={headers:{}};
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
 const sns=load('lib/server/sns.js',{'./db':snsDb,'./config':{clean:v=>String(v||'').trim(),siteUrl:()=>''}});
 const publishBody={targets:['instagram','instagram'],videoUrl:'https://test.public.blob.vercel-storage.com/publish/1/video.mp4',requestId:'sns-request-12345678'};
 const firstJobs=await sns.startPublish({id:1},publishBody),retryJobs=await sns.startPublish({id:1},publishBody);
 assert.equal(firstJobs.length,1);assert.equal(firstJobs[0].status,'failed');assert.equal(retryJobs[0].id,firstJobs[0].id);assert.equal(accesses,1);
 await assert.rejects(()=>sns.startPublish({id:1},{...publishBody,scheduledAt:'2026-12-01'}),e=>e.code==='scheduling_unavailable');
 let charged=0,returned=0;
 const snsApi=load('api/sns.js',{'../lib/server/db':{query:async()=>({rows:[{id:1,session_version:1}]})},'../lib/server/config':{readiness:()=>({serverMode:true}),siteUrl:()=>''},'../lib/server/session':{readSession:()=>({uid:'1',v:1}),sameOrigin:()=>true},'../lib/server/billing':{getSubscription:async()=>({})},'../lib/server/usage':{isActive:()=>true,consume:async()=>{charged++;return {ok:true}},refundUsage:async()=>{returned++}},'../lib/server/sns':{TARGETS:sns.TARGETS,SnsError:sns.SnsError,startPublish:async()=>[{status:'failed'}]}});
 let reply=response();await snsApi({query:{action:'publish'},method:'POST',body:{...publishBody,scheduledAt:'2026-12-01'}},reply);assert.equal(reply.statusCode,503);assert.equal(charged,0);
 reply=response();await snsApi({query:{action:'publish'},method:'POST',body:publishBody},reply);assert.equal(reply.statusCode,502);assert.equal(charged,1);assert.equal(returned,1);

 const source=fs.readFileSync(path.join(root,'lib/server/sns.js'),'utf8');
 assert.match(source,/status = 'starting'.*status = 'scheduled'/);
 assert.match(source,/ON CONFLICT \(user_id, request_key, provider\) DO NOTHING/);
 console.log('production safety ok: fail-closed meter, failed-response refund, all AI modes charged, atomic budget rollback, idempotent export/refund, SNS claim guards');
})().catch(e=>{console.error(e);process.exitCode=1});
