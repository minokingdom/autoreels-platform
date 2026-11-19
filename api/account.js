'use strict';
// POST/GET /api/account?action=...
// 회원가입·로그인·내 정보·구독 결제(베이온)·해지·결제 내역을 한 곳에서 처리합니다.
// (Vercel 함수 개수를 아끼려고 하나로 묶음)
const db = require('../lib/server/db');
const security = require('../lib/server/security');
const projects = require('../lib/server/projects');
const userStyles = require('../lib/server/user-styles');
const scheduler = require('../lib/server/scheduler');
const { readiness } = require('../lib/server/config');
const { setSession, clearSession, readSession, hashPassword, checkPassword, sameOrigin } = require('../lib/server/session');
const billing = require('../lib/server/billing');
const { FREE_TRIAL_DAYS, limits, publicPlans } = require('../lib/server/plans');
const { usageFor, isActive, consume } = require('../lib/server/usage');
const { normalizeSpecialty } = require('../lib/business-specialty.cjs');
const { readSpecialtyTrends, readAdminSpecialties } = require('../lib/server/specialty-trends');
const adminSession = require('../lib/server/admin-session');
const kakao = require('../lib/server/kakao-login');

const INDUSTRY_KEYS = ['auto', 'restaurant', 'cafe', 'beauty', 'realestate', 'academy', 'clinic', 'fitness', 'shop', 'interior', 'personal'];

function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    if (String(req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(req.body));
    try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
  }
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (Buffer.byteLength(data) > 2200000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function normPhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (!/^01\d{8,9}$/.test(d)) return '';
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

function cut(v, n) {
  return String(v == null ? '' : v).trim().slice(0, n);
}

async function currentUser(req) {
  const s = readSession(req);
  if (!s) return null;
  const r = await db.query('SELECT * FROM ar_users WHERE id = $1', [s.uid]);
  const u = r.rows[0];
  if (!u || Number(u.session_version) !== Number(s.v || 1)) return null;
  return u;
}

function publicUser(u) {
  return { id: String(u.id), phone: u.phone, name: u.name, title: u.title, branch: u.branch, email: u.email, industry: u.industry, specialty: u.specialty || '', promo: u.promo };
}

function profileSpecialty(value, fallback = '') {
  const specialty = value === undefined ? fallback : normalizeSpecialty(value);
  if (specialty !== null) return specialty;
  throw Object.assign(new Error('세부 업종을 36자 이내로 입력해 주세요. 업종 이름에 쓸 수 있는 글자와 숫자만 사용해 주세요.'), { status: 400, code: 'invalid_specialty' });
}

async function mePayload(u) {
  const sub = await billing.getSubscription(u.id);
  const active = isActive(sub);
  const tier = active ? sub.plan : 'free';
  return {
    ok: true,
    user: publicUser(u),
    subscription: billing.publicSubscription(sub),
    entitlement: { pro: active, tier, until: active ? sub.current_period_end : null },
    usage: await usageFor(u, tier, sub)
  };
}

module.exports = async function handler(req, res) {
  const action = String((req.query && req.query.action) || '').trim();
  const ready = readiness();

  // 설정 상태(키 값 아님)와 요금제 — 화면이 시연 모드/실서비스 모드를 고를 때 사용
  if (action === 'config') {
    const free = limits().free;
    return send(res, 200, {
      ok: true,
      serverMode: ready.serverMode,
      billingReady: ready.billing,
      veyonEnv: ready.veyonEnv,
      sns: ready.sns,
      snsScheduling: await scheduler.available().catch(() => false),
      phoneVerification: security.smsReady(),
      kakaoLogin: ready.serverMode && kakao.configured(),
      freeTrial: { days: FREE_TRIAL_DAYS, aiLimit: free.aiScripts, ttsLimit: free.ttsChars },
      plans: publicPlans()
    });
  }

  if (action === 'admin-verify' && req.method === 'POST') {
    if (!sameOrigin(req)) return send(res, 403, { ok: false, error: 'bad_origin' });
    const adminTok = String(process.env.ADMIN_TOKEN || '').trim();
    if (!adminTok) return send(res, 503, { ok: false, error: 'admin_not_configured', message: '서버에 관리자 키(ADMIN_TOKEN)가 설정되지 않았습니다.' });
    const b = await readBody(req).catch(() => ({}));
    const given = String(b.token || '').trim();
    const a = Buffer.from(given, 'utf8');
    const c = Buffer.from(adminTok, 'utf8');
    if (a.length !== c.length || !require('node:crypto').timingSafeEqual(a, c)) {
      return send(res, 401, { ok: false, error: 'invalid_admin_token', message: '관리자 키가 올바르지 않습니다.' });
    }
    return send(res, 200, { ok: true });
  }

  if (!ready.serverMode) {
    return send(res, 503, { ok: false, error: 'server_mode_off', message: '회원 서버가 아직 준비되지 않았습니다.' });
  }
  if (req.method === 'POST' && !sameOrigin(req)) {
    return send(res, 403, { ok: false, error: 'bad_origin' });
  }

  try {
    if (action === 'remix-worker' && req.method === 'POST') {
      const remix = require('../lib/server/private-remix');
      if (!remix.verifyWorker(req.headers.authorization)) return send(res,403,{ok:false});
      return send(res,200,{ok:true,...await remix.worker(await readBody(req))});
    }
    if (action === 'admin-console-login' && req.method === 'POST') {
      const key = adminSession.adminKey();
      if (!key) return send(res, 503, { ok: false, message: '관리자 키가 설정되지 않았습니다.' });
      const body = await readBody(req);
      await security.loginLimit(req, 'admin-console');
      const given = typeof body.token === 'string' && body.token.length <= 512 ? body.token.trim() : '';
      if (!adminSession.equalSecret(given, key)) return send(res, 401, { ok: false, message: '관리자 키가 올바르지 않습니다.' });
      adminSession.openSession(req, res, key);
      return send(res, 200, { ok: true });
    }
    if (action === 'admin-console-logout' && req.method === 'POST') {
      adminSession.closeSession(req, res);
      return send(res, 200, { ok: true });
    }
    if (action === 'admin-specialties' && req.method === 'GET') {
      if (!adminSession.isAdmin(req)) return send(res, 401, { ok: false, error: 'admin_session_required' });
      const industry = INDUSTRY_KEYS.includes(req.query?.industry) ? req.query.industry : '';
      const page = Math.min(10000, Math.max(1, Number.parseInt(req.query?.page, 10) || 1));
      return send(res, 200, { ok: true, ...await readAdminSpecialties(industry, (page - 1) * 30) });
    }
    if (action === 'kakao-unlink' && req.method === 'POST') {
      return await kakao.unlink(req, res, await readBody(req));
    }
    if (action === 'kakao-start' && req.method === 'GET') {
      if (kakao.configured()) await security.loginLimit(req, 'kakao');
      return kakao.begin(req, res, null);
    }
    if (action === 'kakao-link' && req.method === 'POST') {
      const user = await currentUser(req);
      if (!user) return send(res, 401, { ok: false, error: 'login_required' });
      if (kakao.configured()) await security.loginLimit(req, 'kakao');
      return kakao.begin(req, res, user);
    }
    if (action === 'kakao-callback' && req.method === 'GET') {
      return await kakao.complete(req, res, await currentUser(req));
    }
    if (['phone-code', 'password-reset'].includes(action) && req.method === 'POST') {
      const b = await readBody(req);
      const phone = normPhone(b.phone);
      if (!phone) return send(res,400,{ok:false,error:'invalid_phone',message:'휴대폰 번호를 정확히 입력해 주세요.'});
      if (action === 'phone-code') return send(res,200,{ok:true,...await security.requestCode(req,phone,b.purpose)});
      await security.resetPassword(req,phone,b);
      clearSession(req,res);
      return send(res,200,{ok:true,message:'비밀번호가 변경되었습니다. 다시 로그인해 주세요.'});
    }
    if (action === 'signup' && req.method === 'POST') {
      const b = await readBody(req);
      const phone = normPhone(b.phone);
      const pw = String(b.password || '');
      if (!phone) return send(res, 400, { ok: false, error: 'invalid_phone', message: '휴대폰 번호를 정확히 입력해 주세요.' });
      if (pw.length < 8) return send(res, 400, { ok: false, error: 'weak_password', message: '비밀번호는 8자 이상으로 정해 주세요.' });
      if (pw.length > 128) return send(res,400,{ok:false,error:'weak_password',message:'비밀번호는 8~128자로 입력해 주세요.'});
      if (!security.smsReady()) return send(res,503,{ok:false,error:'sms_not_ready',message:'문자 인증 연결 준비 중입니다. 기존 회원은 로그인할 수 있습니다.'});
      const proof = await security.verifyCode(phone,'signup',b.challengeId,b.code);
      if (!proof) return send(res,400,{ok:false,error:'invalid_code',message:'인증번호가 만료되었거나 맞지 않습니다.'});
      const industry = INDUSTRY_KEYS.includes(b.industry) ? b.industry : 'auto';
      const specialty = profileSpecialty(b.specialty);
      const ins = await db.tx(async c => {
        await security.consumeCode(c,proof);
        return c.query(
        `INSERT INTO ar_users (phone, password_hash, name, title, branch, email, industry, promo, specialty, phone_verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now()) ON CONFLICT (phone) DO NOTHING RETURNING *`,
        [phone, hashPassword(pw), cut(b.name, 40) || '대표', cut(b.title, 40), cut(b.branch, 80), cut(b.email, 120), industry, cut(b.promo, 120), specialty]
      );
      });
      if (!ins.rows.length) return send(res, 409, { ok: false, error: 'phone_taken', message: '이미 가입된 번호입니다. 로그인해 주세요.' });
      setSession(req, res, ins.rows[0]);
      return send(res, 200, await mePayload(ins.rows[0]));
    }

    if (action === 'login' && req.method === 'POST') {
      const b = await readBody(req);
      const phone = normPhone(b.phone);
      if (!phone) return send(res, 400, { ok: false, error: 'invalid_phone', message: '휴대폰 번호를 정확히 입력해 주세요.' });
      await security.loginLimit(req,phone);
      const r = await db.query('SELECT * FROM ar_users WHERE phone = $1', [phone]);
      const u = r.rows[0];
      if (String(b.password || '').length > 128 || !u || !checkPassword(String(b.password || ''), u.password_hash)) {
        // 번호만으로 하루 종일 잠그지 않고 IP·번호 조합의 짧은 제한을 적용합니다.
        return send(res, 401, { ok: false, error: 'bad_credentials', message: '번호 또는 비밀번호가 맞지 않습니다.' });
      }
      setSession(req, res, u);
      return send(res, 200, await mePayload(u));
    }

    if (action === 'logout' && req.method === 'POST') {
      clearSession(req, res);
      return send(res, 200, { ok: true });
    }

    const user = await currentUser(req);
    if (!user) {
      if (action === 'me') return send(res, 200, { ok: false, error: 'login_required', guest: true });
      return send(res, 401, { ok: false, error: 'login_required', message: '로그인이 필요합니다.' });
    }

    if (action === 'me') return send(res, 200, await mePayload(user));
    if (action === 'remix-url' && req.method === 'POST') {
      const b = await readBody(req);
      return send(res,200,{ok:true,...await require('../lib/server/private-remix').submit(user,b.url,b.id,b.sourceId,b.change)});
    }
    if (action === 'remix-status' && req.method === 'GET') {
      return send(res,200,{ok:true,...await require('../lib/server/private-remix').status(user,req.query.id)});
    }
    if (action === 'specialty-trends' && req.method === 'GET') {
      const row = user.specialty ? await readSpecialtyTrends(user.industry, user.specialty) : null;
      return send(res, 200, { ok: true, industry: user.industry, specialty: user.specialty || '', keywords: row?.keywords || [], updatedAt: row?.updated_at || null });
    }
    if (action === 'styles-list' && req.method === 'GET') {
      return send(res, 200, { ok: true, accountId: String(user.id), ...await userStyles.list(user) });
    }
    if (action === 'styles-save' && req.method === 'POST') {
      return send(res, 200, { ok: true, ...await userStyles.save(user, await readBody(req)) });
    }
    if (action.startsWith('project-')) {
      if (req.method !== 'POST') return send(res,405,{ok:false,error:'method'});
      return send(res,200,{ok:true,...await projects.handle(user,action,await readBody(req))});
    }
    if (action === 'sessions-revoke' && req.method === 'POST') {
      const b = await readBody(req);
      await security.loginLimit(req,user.phone);
      if (!checkPassword(String(b.password || '').slice(0,129),user.password_hash)) return send(res,401,{ok:false,error:'bad_credentials',message:'현재 비밀번호를 확인해 주세요.'});
      const r = await db.query('UPDATE ar_users SET session_version = session_version + 1 WHERE id = $1 RETURNING *',[user.id]);
      setSession(req,res,r.rows[0]);
      return send(res,200,{ok:true});
    }

    if (action === 'profile' && req.method === 'POST') {
      const b = await readBody(req);
      const industry = INDUSTRY_KEYS.includes(b.industry) ? b.industry : user.industry;
      const currentSpecialty = industry === user.industry ? user.specialty || '' : '';
      const specialty = profileSpecialty(b.specialty, currentSpecialty);
      const r = await db.query(
        `UPDATE ar_users SET name = $2, title = $3, branch = $4, email = $5, industry = $6, promo = $7, specialty = $8, updated_at = now()
          WHERE id = $1 RETURNING *`,
        [user.id, cut(b.name, 40) || user.name, cut(b.title ?? user.title, 40), cut(b.branch ?? user.branch, 80), cut(b.email ?? user.email, 120), industry, cut(b.promo ?? user.promo, 120), specialty]
      );
      return send(res, 200, await mePayload(r.rows[0]));
    }

    if (action === 'password' && req.method === 'POST') {
      const b = await readBody(req);
      await security.loginLimit(req,user.phone);
      if (String(b.current || '').length > 128 || !checkPassword(String(b.current || ''), user.password_hash)) return send(res, 401, { ok: false, error: 'bad_credentials', message: '지금 비밀번호가 맞지 않습니다.' });
      if (String(b.next || '').length < 8 || String(b.next || '').length > 128) return send(res, 400, { ok: false, error: 'weak_password', message: '새 비밀번호는 8자 이상으로 정해 주세요.' });
      const r = await db.query('UPDATE ar_users SET password_hash = $2, session_version = session_version + 1, updated_at = now() WHERE id = $1 RETURNING *', [user.id, hashPassword(b.next)]);
      setSession(req, res, r.rows[0]);
      return send(res, 200, { ok: true });
    }

    if (action === 'card-ready' && req.method === 'POST') {
      const b = await readBody(req);
      return send(res, 200, { ok: true, ...(await billing.prepareCard(user, String(b.plan || ''))) });
    }

    if (action === 'card-complete' && req.method === 'POST') {
      const b = await readBody(req);
      const out = await billing.completeCard(user, b);
      const me = await mePayload(user);
      return send(res, out.charged || out.cardUpdated ? 200 : 402, { ...me, ok: Boolean(out.charged || out.cardUpdated), billing: out });
    }

    if (action === 'consume-export' && req.method === 'POST') {
      const body = await readBody(req);
      if (!/^[a-zA-Z0-9_-]{16,100}$/.test(String(body.requestId || ''))) return send(res, 400, {ok:false,error:'request_id_required',message:'화면을 새로고침한 뒤 다시 저장해 주세요.'});
      const q = await consume(req, 'export', 1, {requestId: body.requestId,signature:'download'});
      if (!q.ok) return send(res, q.status, q.body);
      return send(res, 200, { ok: true, used: q.used, cap: q.cap });
    }
    if (action === 'cancel' && req.method === 'POST') return send(res, 200, { ok: true, subscription: await billing.setCancel(user.id, true) });
    if (action === 'resume' && req.method === 'POST') return send(res, 200, { ok: true, subscription: await billing.setCancel(user.id, false) });
    if (action === 'payments') return send(res, 200, { ok: true, payments: await billing.paymentHistory(user.id) });

    return send(res, 404, { ok: false, error: 'unknown_action' });
  } catch (e) {
    const status = Number(e.status) || 500;
    if (status >= 500) console.error('[account]', action, e.code || '', e.message);
    return send(res, status, { ok: false, error: e.code || 'server_error', message: status >= 500 && !e.code ? '서버 오류가 났습니다. 잠시 후 다시 시도해 주세요.' : e.message });
  }
};
