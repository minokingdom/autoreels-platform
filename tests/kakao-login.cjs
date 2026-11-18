'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'..');
function load(file,deps,env,extra={}){const module={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{module,exports:module.exports,require:n=>Object.hasOwn(deps,n)?deps[n]:require(n),process:{env},Buffer,URL,URLSearchParams,Date,AbortSignal,...extra});return module.exports;}
function response(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v},end(){}};}
(async()=>{
 const pg=new PGlite();
 try{
  const schema=fs.readFileSync(path.join(root,'lib/server/db.js'),'utf8').match(/const SCHEMA = `([\s\S]*?)`;/)[1];await pg.exec(schema);await pg.exec(schema);
  const wrap=c=>({query:(q,p=[])=>c.query(q,p)});const db={...wrap(pg),tx:fn=>pg.transaction(c=>fn(wrap(c)))};
  let calls=0,providerId='3456789';
  const session={parseCookies:req=>Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(x=>x.trim().split('='))),hashPassword:()=> 'hashed-random-password',setSession:(req,res,u)=>res.setHeader('Set-Cookie',`test_session=${u.id}`)};
  const env={KAKAO_REST_API_KEY:'test_key',KAKAO_CLIENT_SECRET:'test_secret',KAKAO_ADMIN_KEY:'test_admin',KAKAO_APP_ID:'123',KAKAO_LOGIN_ENABLED:'true'};
  const kakao=load('lib/server/kakao-login.js',{'./db':db,'./session':session},env,{fetch:async(url)=>{calls++;return {ok:true,json:async()=>url.includes('/token')?{access_token:'test_token'}:{id:providerId}};}});
  async function begin(user=null){const res=response();await kakao.begin({headers:{}},res,user);const url=new URL(res.headers.Location);return {state:url.searchParams.get('state'),cookie:res.headers['Set-Cookie'].split(';')[0]};}
  const first=await begin();
  let res=response();await kakao.complete({headers:{},query:{state:first.state,code:'test'}},res,null);assert.equal(calls,0);assert.match(res.headers.Location,/invalid/);
  res=response();await kakao.complete({headers:{cookie:first.cookie},query:{state:first.state,code:'test'}},res,null);assert.match(res.headers.Location,/success/);assert.equal(calls,2);
  assert.equal((await pg.query('SELECT count(*)::int n FROM ar_users')).rows[0].n,1);assert.equal((await pg.query('SELECT phone FROM ar_users')).rows[0].phone,null);
  res=response();await kakao.complete({headers:{cookie:first.cookie},query:{state:first.state,code:'test'}},res,null);assert.match(res.headers.Location,/invalid/);assert.equal(calls,2);
  const again=await begin();res=response();await kakao.complete({headers:{cookie:again.cookie},query:{state:again.state,code:'test'}},res,null);assert.match(res.headers.Location,/success/);assert.equal((await pg.query('SELECT count(*)::int n FROM ar_users')).rows[0].n,1);
  const cancel=await begin();res=response();await kakao.complete({headers:{cookie:cancel.cookie},query:{state:cancel.state,error:'access_denied'}},res,null);assert.match(res.headers.Location,/cancel/);
  const old=(await pg.query('INSERT INTO ar_users(phone,password_hash,name) VALUES ($1,$2,$3) RETURNING *',['010-1234-5678','old','기존'])).rows[0];
  providerId='4567890';const link=await begin(old);res=response();await kakao.complete({headers:{cookie:link.cookie},query:{state:link.state,code:'test'}},res,null);assert.match(res.headers.Location,/invalid/);
  const link2=await begin(old);res=response();await kakao.complete({headers:{cookie:link2.cookie},query:{state:link2.state,code:'test'}},res,old);assert.match(res.headers.Location,/success/);
  assert.equal(String((await pg.query("SELECT user_id FROM ar_login_identities WHERE provider_user_id='4567890'")).rows[0].user_id),String(old.id));
  providerId='3456789';const conflict=await begin(old);res=response();await kakao.complete({headers:{cookie:conflict.cookie},query:{state:conflict.state,code:'test'}},res,old);assert.match(res.headers.Location,/conflict/);
  res=response();await kakao.unlink({headers:{authorization:'KakaoAK wrong'}},res,{app_id:'123',user_id:'4567890'});assert.equal(res.statusCode,401);
  res=response();await kakao.unlink({headers:{authorization:'KakaoAK test_admin'}},res,{app_id:'123',user_id:'4567890'});assert.equal(res.statusCode,200);
  const detached=(await pg.query('SELECT i.connected,u.session_version FROM ar_login_identities i JOIN ar_users u ON u.id=i.user_id WHERE i.provider_user_id=$1',['4567890'])).rows[0];assert.equal(detached.connected,false);assert.equal(detached.session_version,2);
  console.log('kakao login tests ok: state binding, replay, cancellation, stable identity, account protection');
 }finally{await pg.close();}
})().catch(e=>{console.error(e);process.exit(1)});
