'use strict';
const crypto=require('node:crypto');
const db=require('./db');
const {hashPassword}=require('./session');
function error(code,status,message) { return Object.assign(new Error(message),{code,status}); }
function digest(s) { return crypto.createHmac('sha256',process.env.AUTH_SECRET).update(s).digest('hex'); }
function smsReady() { return ['SOLAPI_API_KEY','SOLAPI_API_SECRET','SOLAPI_FROM'].every(k=>String(process.env[k]||'').trim()); }
function ip(req) { return String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim(); }
async function limit(c,key,max,seconds) {
  const r=await c.query(`INSERT INTO ar_auth_limits(key,hits,expires_at) VALUES($1,1,now()+$3*interval '1 second')
    ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN ar_auth_limits.expires_at<=now() THEN 1 ELSE ar_auth_limits.hits+1 END,
    expires_at=CASE WHEN ar_auth_limits.expires_at<=now() THEN now()+$3*interval '1 second' ELSE ar_auth_limits.expires_at END
    WHERE ar_auth_limits.expires_at<=now() OR ar_auth_limits.hits<$2 RETURNING hits`,[key,max,seconds]);
  if(!r.rows.length) throw error('rate_limit',429,'시도가 많습니다. 잠시 후 다시 시도해 주세요.');
}
async function loginLimit(req,phone) {
  await db.tx(async c=>{
    await limit(c,'login-ip:'+digest(ip(req)),60,900);
    await limit(c,'login-pair:'+digest(ip(req)+':'+phone),10,900);
  });
}
async function requestCode(req,phone,purpose) {
  if(!smsReady()) throw error('sms_not_ready',503,'문자 인증 연결을 준비 중입니다. 기존 회원은 로그인할 수 있습니다.');
  if(!['signup','reset'].includes(purpose)) throw error('invalid_purpose',400,'인증 목적을 다시 선택해 주세요.');
  const id=crypto.randomUUID(),code=String(crypto.randomInt(100000,1000000));
  await db.tx(async c=>{
    await limit(c,'sms-global',200,86400);
    await limit(c,'sms-ip:'+digest(ip(req)),10,3600);
    await limit(c,'sms-phone-day:'+digest(phone),5,86400);
    await limit(c,'sms-phone-minute:'+digest(phone),1,60);
    await c.query('INSERT INTO ar_phone_codes(id,phone,purpose,code_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval \'5 minutes\')',[id,phone,purpose,digest(id+':'+code)]);
  });
  const date=new Date().toISOString(),salt=crypto.randomBytes(16).toString('hex');
  const signature=crypto.createHmac('sha256',process.env.SOLAPI_API_SECRET).update(date+salt).digest('hex');
  try {
    const r=await fetch('https://api.solapi.com/messages/v4/send-many/detail',{
      method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json',Authorization:`HMAC-SHA256 apiKey=${process.env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`},
      body:JSON.stringify({messages:[{to:phone.replace(/\D/g,''),from:process.env.SOLAPI_FROM.replace(/\D/g,''),text:`[오토릴스] ${purpose==='reset'?'비밀번호 재설정':'회원가입'} 인증번호 ${code} (5분)`,type:'SMS'}]})
    });
    const body=await r.json();
    if(!r.ok || body.failedMessageList?.length || !body.groupInfo?.groupId) throw new Error('send failed');
    await db.query('UPDATE ar_phone_codes SET sent=true WHERE id=$1',[id]);
  } catch(_) { throw error('sms_failed',503,'인증번호 발송을 확인하지 못했습니다. 1분 뒤 다시 요청해 주세요.'); }
  return {challengeId:id,expiresIn:300};
}
// 틀린 번호 횟수는 롤백되지 않도록 별도 원자적 갱신으로 먼저 소비합니다.
async function verifyCode(phone,purpose,id,code) {
  if(!/^[a-f0-9-]{36}$/.test(String(id)) || !/^\d{6}$/.test(String(code))) return null;
  const r=await db.query('UPDATE ar_phone_codes SET attempts=attempts+1 WHERE id=$1 AND phone=$2 AND purpose=$3 AND sent=true AND consumed=false AND expires_at>now() AND attempts<5 RETURNING id,code_hash',[id,phone,purpose]);
  const row=r.rows[0];
  if(!row || row.code_hash!==digest(id+':'+code)) return null;
  return row.id;
}
async function consumeCode(c,id) {
  const r=await c.query('UPDATE ar_phone_codes SET consumed=true WHERE id=$1 AND consumed=false AND expires_at>now() RETURNING id',[id]);
  if(!r.rows.length) throw error('invalid_code',400,'인증번호가 만료되었거나 이미 사용됐습니다.');
}
async function resetPassword(req,phone,b) {
  await loginLimit(req,phone);
  const pw=String(b.password||'');
  if(pw.length<8||pw.length>128) throw error('weak_password',400,'새 비밀번호는 8~128자로 입력해 주세요.');
  const proof=await verifyCode(phone,'reset',b.challengeId,b.code);
  if(!proof) throw error('invalid_code',400,'인증번호가 만료되었거나 맞지 않습니다.');
  const hash=hashPassword(pw);
  await db.tx(async c=>{
    await consumeCode(c,proof);
    await c.query('UPDATE ar_users SET password_hash=$2,session_version=session_version+1,phone_verified_at=now(),updated_at=now() WHERE phone=$1',[phone,hash]);
  });
}
module.exports={smsReady,requestCode,verifyCode,consumeCode,resetPassword,loginLimit,limit};
