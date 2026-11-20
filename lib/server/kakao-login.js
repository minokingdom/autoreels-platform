'use strict';
// 카카오 계정 식별자는 전화번호나 이메일과 자동으로 합치지 않습니다.
const crypto = require('node:crypto');
const db = require('./db');
const { parseCookies, hashPassword, setSession } = require('./session');
const COOKIE = 'ar_kakao_state';
const IND_COOKIE = 'ar_kakao_ind';
const ALLOWED_INDS = new Set(['auto', 'restaurant', 'cafe', 'beauty', 'realestate', 'academy', 'clinic', 'fitness', 'shop', 'interior', 'personal']);
const CALLBACK = 'https://autoreelsmaker.kr/api/account?action=kakao-callback';
const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');
const random = () => crypto.randomBytes(32).toString('base64url');
function safeInd(v) { const k = String(v || '').trim().toLowerCase(); return ALLOWED_INDS.has(k) ? k : 'auto'; }

function configured() {
  return Boolean(process.env.KAKAO_REST_API_KEY && process.env.KAKAO_CLIENT_SECRET && process.env.KAKAO_ADMIN_KEY && process.env.KAKAO_APP_ID && process.env.KAKAO_LOGIN_ENABLED === 'true');
}
function redirect(res, path) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', path);
  res.statusCode = 302;
  return res.end();
}
function cookie(req, name, value) {
  const secure = process.env.VERCEL === '1' || req.headers['x-forwarded-proto'] === 'https';
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure ? '; Secure' : ''}`;
}
async function begin(req, res, user) {
  if (!configured()) return redirect(res, '/studio?kakao=unavailable');
  const chosenInd = safeInd(req.query && req.query.ind);
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  if (process.env.VERCEL === '1' && host !== 'autoreelsmaker.kr') {
    if (user) return redirect(res, 'https://autoreelsmaker.kr/studio?kakao=canonical');
    return redirect(res, 'https://autoreelsmaker.kr/api/account?action=kakao-start&ind=' + encodeURIComponent(chosenInd));
  }
  const state = random();
  const browser = random();
  await db.query('DELETE FROM ar_login_states WHERE expires_at < now()');
  await db.query('INSERT INTO ar_login_states (state_digest,browser_digest,user_id,expires_at) VALUES ($1,$2,$3,now()+interval \'10 minutes\')', [sha(state), sha(browser), user ? user.id : null]);
  res.setHeader('Set-Cookie', [cookie(req, COOKIE, browser), cookie(req, IND_COOKIE, chosenInd)]);
  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.search = new URLSearchParams({ client_id: process.env.KAKAO_REST_API_KEY, redirect_uri: CALLBACK, response_type: 'code', state }).toString();
  return redirect(res, url.toString());
}
async function complete(req, res, currentUser) {
  if (!configured()) return redirect(res, '/studio?kakao=unavailable');
  const state = String(req.query.state || '');
  const browser = parseCookies(req)[COOKIE] || '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(state) || !/^[A-Za-z0-9_-]{43}$/.test(browser)) return redirect(res, '/studio?kakao=invalid');
  const saved = await db.query('DELETE FROM ar_login_states WHERE state_digest=$1 AND browser_digest=$2 AND expires_at>now() RETURNING user_id', [sha(state), sha(browser)]);
  if (!saved.rows.length || (saved.rows[0].user_id && String(saved.rows[0].user_id) !== String(currentUser?.id || ''))) return redirect(res, '/studio?kakao=invalid');
  if (req.query.error || !req.query.code) return redirect(res, '/studio?kakao=cancel');
  const body = new URLSearchParams({ grant_type: 'authorization_code', client_id: process.env.KAKAO_REST_API_KEY, client_secret: process.env.KAKAO_CLIENT_SECRET, redirect_uri: CALLBACK, code: String(req.query.code) });
  const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }, body, signal: AbortSignal.timeout(10000) });
  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok || !tokens.access_token) return redirect(res, '/studio?kakao=failed');
  const profileResponse = await fetch('https://kapi.kakao.com/v2/user/me', { headers: { Authorization: `Bearer ${tokens.access_token}` }, signal: AbortSignal.timeout(10000) });
  const profile = await profileResponse.json();
  const id = String(profile.id || '');
  if (!profileResponse.ok || !/^\d{1,24}$/.test(id) || (typeof profile.id === 'number' && !Number.isSafeInteger(profile.id))) return redirect(res, '/studio?kakao=failed');
  let result;
  try {
    result = await db.tx(async (c) => {
      const existing = await c.query("SELECT u.* FROM ar_login_identities i JOIN ar_users u ON u.id=i.user_id WHERE i.provider='kakao' AND i.provider_user_id=$1", [id]);
      if (existing.rows.length) {
        if (saved.rows[0].user_id && String(existing.rows[0].id) !== String(saved.rows[0].user_id)) return null;
        await c.query("UPDATE ar_login_identities SET connected=true WHERE provider='kakao' AND provider_user_id=$1", [id]);
        return existing.rows[0];
      }
      if (saved.rows[0].user_id) {
        await c.query("INSERT INTO ar_login_identities(provider,provider_user_id,user_id) VALUES ('kakao',$1,$2)", [id, saved.rows[0].user_id]);
        return currentUser;
      }
      const chosenInd = safeInd(parseCookies(req)[IND_COOKIE]);
      const inserted = await c.query("INSERT INTO ar_users(phone,password_hash,name,industry) VALUES (NULL,$1,'사용자',$2) RETURNING *", [hashPassword(random()), chosenInd]);
      await c.query("INSERT INTO ar_login_identities(provider,provider_user_id,user_id) VALUES ('kakao',$1,$2)", [id, inserted.rows[0].id]);
      return inserted.rows[0];
    });
  } catch (e) {
    if (e.code !== '23505') throw e;
    return redirect(res, '/studio?kakao=conflict');
  }
  if (!result) return redirect(res, '/studio?kakao=conflict');
  setSession(req, res, result);
  return redirect(res, '/studio?kakao=success');
}
async function unlink(req, res, payload) {
  const expected = String(process.env.KAKAO_ADMIN_KEY || '');
  const authorization = String(req.headers.authorization || '');
  const given = authorization.startsWith('KakaoAK ') ? authorization.slice(8) : '';
  const a = Buffer.from(given), b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) { res.statusCode = 401; return res.end(); }
  const id = String(payload.user_id || '');
  if (String(payload.app_id || '') !== String(process.env.KAKAO_APP_ID || '') || !/^\d{1,24}$/.test(id)) { res.statusCode = 400; return res.end(); }
  await db.tx(async c => {
    const r = await c.query("UPDATE ar_login_identities SET connected=false WHERE provider='kakao' AND provider_user_id=$1 AND connected=true RETURNING user_id", [id]);
    if (r.rows.length) await c.query('UPDATE ar_users SET session_version=session_version+1,updated_at=now() WHERE id=$1', [r.rows[0].user_id]);
  });
  res.statusCode = 200;
  return res.end();
}
module.exports = { configured, begin, complete, unlink, CALLBACK };
