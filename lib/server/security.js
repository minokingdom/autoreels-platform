'use strict';
const crypto=require('node:crypto');
const db=require('./db');
const {hashPassword}=require('./session');
function error(code,status,message) { return Object.assign(new Error(message),{code,status}); }
function digest(s) { return crypto.createHmac('sha256',process.env.AUTH_SECRET).update(s).digest('hex'); }
function aligoConfig() {
  const key=String(process.env.ALIGO_API_KEY||'').trim();
  const userId=String(process.env.ALIGO_USER_ID||'').trim();
  const sender=String(process.env.ALIGO_SENDER||'').replace(/[\s-]/g,'');
  return key && userId && /^\d{8,16}$/.test(sender) ? { key, userId, sender } : null;
}
function smsReady() { return Boolean(aligoConfig()); }

async function sendCode(config, phone, purpose, code) {
  const purposeLabel=purpose==='reset' ? '비밀번호 재설정' : '회원가입';
  const form=new URLSearchParams({
    key:config.key,
    user_id:config.userId,
    sender:config.sender,
    receiver:phone.replace(/\D/g,''),
    msg:'[오토릴스메이커] '+purposeLabel+' 인증번호 '+code+' (5분)',
    msg_type:'SMS',
    testmode_yn:'N'
  });
  const response=await fetch('https://apis.aligo.in/send/',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
    body:form,
    redirect:'error',
    signal:AbortSignal.timeout(10000)
  });
  if(!response.ok) {
    console.error('[aligo] transport failed', { status: response.status });
    throw new Error('sms_transport_failed');
  }
  const result=await response.json();
  // HTTP 응답 성공과 실제 발송 접수 성공을 따로 확인합니다.
  if(Number(result?.result_code)!==1 || Number(result.success_cnt)!==1 ||
    String(result.error_cnt)!=='0' || !/^[1-9]\d*$/.test(String(result.msg_id))) {
    console.error('[aligo] rejected', {
      result_code: result?.result_code,
      message: result?.message,
      success_cnt: result?.success_cnt,
      error_cnt: result?.error_cnt
    });
    throw new Error('sms_not_accepted');
  }
}
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
  const config=aligoConfig();
  if(!config) throw error('sms_not_ready',503,'문자 인증 연결을 준비 중입니다. 기존 회원은 로그인할 수 있습니다.');
  if(!['signup','reset'].includes(purpose)) throw error('invalid_purpose',400,'인증 목적을 다시 선택해 주세요.');
  // 불필요한 문자 과금 방지: 발송 전 가입 여부 사전 확인
  const existingUser=await db.query('SELECT id FROM ar_users WHERE phone=$1 LIMIT 1',[phone]);
  if(purpose==='reset' && !existingUser.rows.length) {
    throw error('user_not_found',404,'가입된 휴대폰 번호를 찾을 수 없습니다.');
  }
  if(purpose==='signup' && existingUser.rows.length) {
    throw error('phone_taken',409,'이미 가입된 휴대폰 번호입니다. 로그인해 주세요.');
  }
  const id=crypto.randomUUID(),code=String(crypto.randomInt(100000,1000000));
  await db.tx(async c=>{
    await limit(c,'sms-global',200,86400);
    await limit(c,'sms-ip:'+digest(ip(req)),10,3600);
    await limit(c,'sms-phone-day:'+digest(phone),5,86400);
    await limit(c,'sms-phone-minute:'+digest(phone),1,60);
    await c.query('INSERT INTO ar_phone_codes(id,phone,purpose,code_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval \'5 minutes\')',[id,phone,purpose,digest(id+':'+code)]);
  });
  try {
    await sendCode(config,phone,purpose,code);
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
    const updated=await c.query('UPDATE ar_users SET password_hash=$2,session_version=session_version+1,phone_verified_at=now(),updated_at=now() WHERE phone=$1 RETURNING id',[phone,hash]);
    if(!updated.rows.length) throw error('user_not_found',404,'가입된 휴대폰 번호를 찾을 수 없습니다.');
  });
}
module.exports={smsReady,requestCode,verifyCode,consumeCode,resetPassword,loginLimit,limit};
