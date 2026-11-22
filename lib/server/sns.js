'use strict';
// SNS 계정 연결(OAuth)과 영상 올리기: 인스타그램·페이스북, 유튜브, 틱톡
// - 토큰은 TOKEN_ENC_KEY로 암호화해 DB에 저장하고, 화면에는 계정 이름만 보냅니다.
// - 키가 없는 서비스는 "준비 중"으로만 표시되고 연결 버튼이 열리지 않습니다.
const crypto = require('crypto');
const db = require('./db');
const scheduler = require('./scheduler');
const { AsyncLocalStorage } = require('node:async_hooks');
const jobDeadline = new AsyncLocalStorage();
function remaining(ms) { return Math.max(1,Math.min(ms,(jobDeadline.getStore() || Infinity)-Date.now())); }
const { clean, siteUrl, instagramConfigId } = require('./config');

const TARGETS = ['instagram', 'facebook', 'youtube', 'tiktok', 'threads'];
const PROVIDER_OF = { instagram: 'meta', facebook: 'meta', youtube: 'youtube', tiktok: 'tiktok', threads: 'threads' };
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

class SnsError extends Error {
  constructor(message, status = 400, code = 'sns_error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function env(name) {
  return clean(process.env[name]);
}
function graphVer() {
  return env('META_GRAPH_VERSION') || 'v23.0';
}
function redirectUri() {
  return `${siteUrl()}/api/sns`;
}
function providerReady(provider) {
  if (Buffer.byteLength(env('TOKEN_ENC_KEY'), 'utf8') < 32) return false;
  if (provider === 'instagram') return Boolean(env('META_APP_ID') && env('META_APP_SECRET') && instagramConfigId());
  if (provider === 'meta') return Boolean(env('META_APP_ID') && env('META_APP_SECRET'));
  if (provider === 'youtube') return Boolean(env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET'));
  if (provider === 'tiktok') return Boolean(env('TIKTOK_CLIENT_KEY') && env('TIKTOK_CLIENT_SECRET'));
  if (provider === 'threads') return Boolean(env('THREADS_APP_ID') && env('THREADS_APP_SECRET'));
  return false;
}

// ---------- 토큰 암호화 (AES-256-GCM) ----------
function encKey() {
  const k = env('TOKEN_ENC_KEY');
  if (Buffer.byteLength(k, 'utf8') < 32) throw new SnsError('SNS 연결이 아직 준비되지 않았습니다.', 503, 'not_ready');
  return crypto.createHash('sha256').update(k).digest();
}
function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64');
}
function unseal(s) {
  const b = Buffer.from(String(s || ''), 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', encKey(), b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'));
}
function digest(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}
function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------- HTTP ----------
async function call(url, opts = {}, timeoutMs = 25000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), remaining(timeoutMs));
  let res;
  try {
    res = await fetch(url, { ...opts, signal: ac.signal });
  } catch (e) {
    const error = new SnsError('서비스 응답을 확인하지 못했습니다.', 502, 'network');
    error.uncertain = Boolean(opts.method && opts.method !== 'GET');
    clearTimeout(t);
    throw error;
  }
  let text;
  try { text = await res.text(); } catch (_) {
    const error = new SnsError('서비스 응답을 읽지 못했습니다.', 502, 'network');
    error.uncertain = Boolean(opts.method && opts.method !== 'GET');
    throw error;
  } finally { clearTimeout(t); }
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text.slice(0, 300) }; }
  if (!res.ok) {
    const msg = (data.error && (data.error.message || data.error.error_user_msg || data.error_description || data.error)) ||
      data.error_description || data.message || `HTTP ${res.status}`;
    const error = new SnsError(typeof msg === 'string' ? msg.slice(0, 300) : `HTTP ${res.status}`, 502, 'provider');
    error.uncertain = res.status >= 500 && Boolean(opts.method && opts.method !== 'GET');
    throw error;
  }
  return { data, headers: res.headers, status: res.status };
}
function form(obj) {
  return new URLSearchParams(Object.entries(obj).filter(([, v]) => v != null && v !== '')).toString();
}
const FORM = { 'Content-Type': 'application/x-www-form-urlencoded' };

// ---------- 연결 시작 / 콜백 ----------
async function startAuth(user, target, host) {
  const provider = target === 'instagram' && providerReady('instagram') ? 'instagram' : PROVIDER_OF[target] || target;
  if (!['instagram', 'meta', 'youtube', 'tiktok', 'threads'].includes(provider)) throw new SnsError('지원하지 않는 서비스입니다.');
  if (!providerReady(provider)) throw new SnsError('이 SNS 연결은 아직 준비 중입니다.', 503, 'not_ready');
  const state = b64url(crypto.randomBytes(24));
  const redirect = provider === 'instagram' && host === 'autoreelsmaker.kr' ? 'https://autoreelsmaker.kr/api/sns' : redirectUri();
  let verifier = provider === 'youtube' ? b64url(crypto.randomBytes(48)) : null;
  if (provider === 'instagram') verifier = JSON.stringify({ configId: instagramConfigId(), redirect });
  await db.query('DELETE FROM ar_oauth_states WHERE expires_at < now()');
  await db.query(
    `INSERT INTO ar_oauth_states (state_digest, user_id, provider, verifier, expires_at) VALUES ($1, $2, $3, $4, now() + interval '10 minutes')`,
    [digest(state), user.id, provider, verifier]
  );
  if (provider === 'instagram') {
    return 'https://www.facebook.com/dialog/oauth?' + form({
      client_id: env('META_APP_ID'), config_id: instagramConfigId(), redirect_uri: redirect,
      response_type: 'code', override_default_response_type: 'true', prompt: 'login', state
    });
  }
  if (provider === 'meta') {
    const scope = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'business_management',
      'instagram_basic', 'instagram_content_publish', 'instagram_manage_comments', 'instagram_manage_messages', 'publish_video'].join(',');
    return `https://www.facebook.com/${graphVer()}/dialog/oauth?` + form({ client_id: env('META_APP_ID'), redirect_uri: redirect, state, scope, response_type: 'code' });
  }
  if (provider === 'youtube') {
    const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + form({
      client_id: env('GOOGLE_CLIENT_ID'), redirect_uri: redirect, response_type: 'code', state,
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
      access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true',
      code_challenge: challenge, code_challenge_method: 'S256'
    });
  }
  if (provider === 'threads') {
    return 'https://threads.net/oauth/authorize?' + form({
      client_id: env('THREADS_APP_ID'), redirect_uri: redirect, response_type: 'code', state,
      scope: 'threads_basic,threads_content_publish'
    });
  }
  return 'https://www.tiktok.com/v2/auth/authorize/?' + form({
    client_key: env('TIKTOK_CLIENT_KEY'), redirect_uri: redirect, response_type: 'code', state,
    scope: 'user.info.basic,video.upload'
  });
}

async function saveAccount(userId, provider, account) {
  await db.query(
    `INSERT INTO ar_sns_accounts (user_id, provider, account_id, account_name, token_enc, refresh_enc, expires_at, meta, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
     ON CONFLICT (user_id, provider) DO UPDATE SET account_id = EXCLUDED.account_id, account_name = EXCLUDED.account_name,
       token_enc = EXCLUDED.token_enc, refresh_enc = COALESCE(EXCLUDED.refresh_enc, ar_sns_accounts.refresh_enc),
       expires_at = EXCLUDED.expires_at, meta = EXCLUDED.meta, updated_at = now()`,
    [userId, provider, String(account.id || ''), String(account.name || '').slice(0, 120), seal(account.token),
      account.refresh ? seal({ r: account.refresh }) : null, account.expiresAt || null, JSON.stringify(account.meta || {})]
  );
}

function pickPage(pages, wantId) {
  return pages.find((p) => p.id === wantId) || pages.find((p) => p.ig) || pages[0] || null;
}

async function finishAuth(state, code, sessionUserId) {
  if (!state || !code) throw new SnsError('연결 정보가 올바르지 않습니다.');
  const r = await db.query('DELETE FROM ar_oauth_states WHERE state_digest = $1 AND expires_at > now() RETURNING user_id, provider, verifier', [digest(state)]);
  const st = r.rows[0];
  if (!st) throw new SnsError('연결 시간이 지났습니다. 다시 시도해 주세요.', 400, 'state');
  const redirect = redirectUri();
  const userId = st.user_id;

  if (st.provider === 'instagram') {
    if (!sessionUserId || String(sessionUserId) !== String(userId)) throw new SnsError('연결을 시작한 스튜디오 계정으로 다시 로그인해 주세요.', 403, 'wrong_session');
    const { configId, redirect } = JSON.parse(st.verifier);
    if (!configId || configId !== instagramConfigId()) throw new SnsError('연결 설정이 바뀌었습니다. 다시 연결해 주세요.');
    const graph = 'https://graph.facebook.com/' + graphVer();
    const exchange = await call(graph + '/oauth/access_token?' + form({ client_id: env('META_APP_ID'),
      client_secret: env('META_APP_SECRET'), redirect_uri: redirect, code }));
    const token = exchange.data.access_token;
    if (!token) throw new SnsError('인스타그램 연결을 완료하지 못했습니다.');
    const options = { headers: { Authorization: 'Bearer ' + token } };
    const [business, accounts] = await Promise.all([
      call(graph + '/me?fields=client_business_id', options),
      call(graph + '/me/assigned_instagram_accounts?fields=id,username&limit=2', options)
    ]);
    const shared = accounts.data.data || [];
    if (!business.data.client_business_id || !shared.length) throw new SnsError('게시할 인스타그램 프로페셔널 계정을 선택해 주세요.');
    if (shared.length !== 1 || accounts.data.paging?.next) throw new SnsError('연결할 때 이번에 게시할 인스타 계정 하나만 선택해 주세요.');
    const { id, username } = shared[0];
    if (!id || !username) throw new SnsError('인스타그램 계정 정보를 확인하지 못했습니다.');
    await saveAccount(userId, 'instagram', { id, name: username, token: { access: token },
      expiresAt: exchange.data.expires_in > 0 ? new Date(Date.now() + Number(exchange.data.expires_in) * 1000) : null,
      meta: { businessId: String(business.data.client_business_id), configId } });
    return { userId, provider: 'instagram' };
  }
  if (st.provider === 'meta') {
    const ver = graphVer();
    const short = await call(`https://graph.facebook.com/${ver}/oauth/access_token?` + form({
      client_id: env('META_APP_ID'), client_secret: env('META_APP_SECRET'), redirect_uri: redirect, code
    }));
    const long = await call(`https://graph.facebook.com/${ver}/oauth/access_token?` + form({
      grant_type: 'fb_exchange_token', client_id: env('META_APP_ID'), client_secret: env('META_APP_SECRET'), fb_exchange_token: short.data.access_token
    }));
    const userToken = long.data.access_token || short.data.access_token;
    const acc = await call(`https://graph.facebook.com/${ver}/me/accounts?` + form({
      fields: 'id,name,access_token,instagram_business_account{id,username}', limit: '50', access_token: userToken
    }));
    const pages = (acc.data.data || []).map((p) => ({
      id: String(p.id), name: String(p.name || ''), token: p.access_token,
      ig: p.instagram_business_account ? { id: String(p.instagram_business_account.id), username: String(p.instagram_business_account.username || '') } : null
    }));
    if (!pages.length) throw new SnsError('연결할 페이스북 페이지가 없습니다. 인스타그램은 프로페셔널 계정을 페이스북 페이지에 연결해야 올릴 수 있습니다.', 400, 'no_page');
    const sel = pickPage(pages);
    await saveAccount(userId, 'meta', {
      id: sel.id, name: sel.name, token: { userToken, pages },
      meta: { page: sel.id, pages: pages.map((p) => ({ id: p.id, name: p.name, ig: p.ig })) }
    });
    return { userId, provider: 'meta' };
  }

  if (st.provider === 'youtube') {
    const tok = await call('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: FORM,
      body: form({ code, client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), redirect_uri: redirect, grant_type: 'authorization_code', code_verifier: st.verifier })
    });
    const access = tok.data.access_token;
    let name = '';
    let id = '';
    try {
      const ch = await call('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: `Bearer ${access}` } });
      const c = (ch.data.items || [])[0];
      if (c) { id = c.id; name = c.snippet && c.snippet.title; }
    } catch (e) {}
    await saveAccount(userId, 'youtube', {
      id, name: name || '유튜브 채널', token: { access }, refresh: tok.data.refresh_token,
      expiresAt: new Date(Date.now() + (Number(tok.data.expires_in) || 3600) * 1000)
    });
    return { userId, provider: 'youtube' };
  }

  if (st.provider === 'threads') {
    const short = await call('https://graph.threads.net/oauth/access_token', {
      method: 'POST', headers: FORM,
      body: form({ client_id: env('THREADS_APP_ID'), client_secret: env('THREADS_APP_SECRET'), grant_type: 'authorization_code', redirect_uri: redirect, code })
    });
    let accessToken = short.data.access_token;
    let expiresIn = 3600;
    try {
      const long = await call('https://graph.threads.net/access_token?' + form({
        grant_type: 'th_exchange_token', client_secret: env('THREADS_APP_SECRET'), access_token: accessToken
      }));
      if (long.data.access_token) { accessToken = long.data.access_token; expiresIn = Number(long.data.expires_in) || 5184000; }
    } catch (e) {}
    let username = '';
    let id = String(short.data.user_id || '');
    try {
      const me = await call('https://graph.threads.net/v1.0/me?' + form({ fields: 'id,username', access_token: accessToken }));
      if (me.data.id) id = String(me.data.id);
      if (me.data.username) username = String(me.data.username);
    } catch (e) {}
    await saveAccount(userId, 'threads', {
      id, name: username || '스레드 계정', token: { access: accessToken },
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    });
    return { userId, provider: 'threads' };
  }

  // tiktok
  const tok = await call('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST', headers: FORM,
    body: form({ client_key: env('TIKTOK_CLIENT_KEY'), client_secret: env('TIKTOK_CLIENT_SECRET'), code, grant_type: 'authorization_code', redirect_uri: redirect })
  });
  if (tok.data.error) throw new SnsError(String(tok.data.error_description || tok.data.error), 502, 'provider');
  const access = tok.data.access_token;
  let name = '';
  try {
    const u = await call('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name', { headers: { Authorization: `Bearer ${access}` } });
    name = u.data.data && u.data.data.user && u.data.data.user.display_name;
  } catch (e) {}
  await saveAccount(userId, 'tiktok', {
    id: tok.data.open_id, name: name || '틱톡 계정', token: { access }, refresh: tok.data.refresh_token,
    expiresAt: new Date(Date.now() + (Number(tok.data.expires_in) || 86400) * 1000)
  });
  return { userId, provider: 'tiktok' };
}

// ---------- 연결 상태 ----------
async function status(user) {
  const r = await db.query('SELECT provider, account_name, meta, updated_at FROM ar_sns_accounts WHERE user_id = $1', [user.id]);
  const rows = Object.fromEntries(r.rows.map((x) => [x.provider, x]));
  const meta = rows.meta;
  const pages = meta ? (meta.meta.pages || []) : [];
  const page = meta ? pages.find((p) => p.id === meta.meta.page) || null : null;
  const legacyIg = !meta?.meta?.instagramDetached && page?.ig;
  return {
    targets: {
      instagram: { ready: providerReady('instagram') || providerReady('meta'), connected: Boolean(rows.instagram || legacyIg),
        name: rows.instagram ? '@' + rows.instagram.account_name : legacyIg ? '@' + legacyIg.username : '',
        direct: Boolean(rows.instagram), directLoginReady: providerReady('instagram'),
        note: meta && !legacyIg && !providerReady('instagram') ? '선택한 페이지에 인스타그램 프로페셔널 계정이 연결되어 있지 않습니다' : '' },
      facebook: { ready: providerReady('meta'), connected: Boolean(page), name: page ? page.name : '' },
      youtube: { ready: providerReady('youtube'), connected: Boolean(rows.youtube), name: rows.youtube ? rows.youtube.account_name : '' },
      tiktok: { ready: providerReady('tiktok'), connected: Boolean(rows.tiktok), name: rows.tiktok ? rows.tiktok.account_name : '' },
      threads: { ready: providerReady('threads'), connected: Boolean(rows.threads), name: rows.threads ? `@${rows.threads.account_name.replace(/^@/, '')}` : '' }
    },
    pages: pages.map((p) => ({ id: p.id, name: p.name, ig: p.ig ? p.ig.username : '' })),
    page: page ? page.id : '',
    storage: Boolean(env('BLOB_READ_WRITE_TOKEN'))
  };
}

async function disconnect(user, target) {
  if (target === 'instagram') {
    return db.tx(async c => {
      await c.query("DELETE FROM ar_sns_accounts WHERE user_id=$1 AND provider='instagram'", [user.id]);
      await c.query("UPDATE ar_sns_accounts SET meta=meta || jsonb_build_object('instagramDetached',true) WHERE user_id=$1 AND provider='meta'", [user.id]);
    });
  }
  const provider = PROVIDER_OF[target] || target;
  await db.query('DELETE FROM ar_sns_accounts WHERE user_id = $1 AND provider = $2', [user.id, provider]);
}

async function selectPage(user, pageId) {
  const r = await db.query("SELECT meta FROM ar_sns_accounts WHERE user_id = $1 AND provider = 'meta'", [user.id]);
  if (!r.rows[0]) throw new SnsError('먼저 메타(인스타그램·페이스북)를 연결해 주세요.');
  const m = r.rows[0].meta || {};
  const p = (m.pages || []).find((x) => x.id === String(pageId));
  if (!p) throw new SnsError('페이지를 찾지 못했습니다.');
  m.page = p.id;
  await db.query("UPDATE ar_sns_accounts SET meta = $2, account_id = $3, account_name = $4, updated_at = now() WHERE user_id = $1 AND provider = 'meta'",
    [user.id, JSON.stringify(m), p.id, p.name]);
}

// 저장된 토큰 꺼내기 (만료되면 새로 받기)
async function access(user, provider, { preferInstagram = false } = {}) {
  // 화면에 표시한 계정과 같은 우선순위로 하나의 연결만 선택합니다.
  const result = preferInstagram
    ? await db.query("SELECT * FROM ar_sns_accounts WHERE user_id=$1 AND (provider='instagram' OR (provider='meta' AND NOT (meta @> '{\"instagramDetached\":true}'))) ORDER BY (provider='instagram') DESC LIMIT 1", [user.id])
    : await db.query('SELECT * FROM ar_sns_accounts WHERE user_id = $1 AND provider = $2', [user.id, provider]);
  const row = result.rows[0];
  if (preferInstagram && row) provider = row.provider;
  if (!row) throw new SnsError('계정이 연결되어 있지 않습니다.', 400, 'not_connected');
  const tok = unseal(row.token_enc);
  if (provider === 'meta') {
    const page = (tok.pages || []).find((p) => p.id === (row.meta || {}).page) || pickPage(tok.pages || []);
    if (!page) throw new SnsError('페이스북 페이지를 다시 연결해 주세요.', 400, 'not_connected');
    return { page };
  }
  if (provider === 'instagram') {
    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
      throw new SnsError('인스타그램 연결이 만료됐어요. 다시 연결해 주세요.', 400, 'expired');
    }
    return { id: row.account_id, token: tok.access };
  }
  if (provider === 'threads') {
    const expired = !row.expires_at || new Date(row.expires_at).getTime() < Date.now() + 86400000;
    if (!expired) return { token: tok.access };
    const fresh = await call('https://graph.threads.net/refresh_access_token?' + form({
      grant_type: 'th_refresh_token', access_token: tok.access
    }));
    const nextToken = fresh.data.access_token || tok.access;
    await db.query('UPDATE ar_sns_accounts SET token_enc = $3, expires_at = $4, updated_at = now() WHERE user_id = $1 AND provider = $2', [
      user.id, 'threads', seal({ access: nextToken }),
      new Date(Date.now() + (Number(fresh.data.expires_in) || 5184000) * 1000)
    ]);
    return { token: nextToken };
  }
  const expired = !row.expires_at || new Date(row.expires_at).getTime() < Date.now() + 60000;
  if (!expired) return { token: tok.access };
  const refresh = row.refresh_enc ? unseal(row.refresh_enc).r : '';
  if (!refresh) throw new SnsError('계정 연결이 만료되었습니다. 다시 연결해 주세요.', 400, 'expired');
  let fresh;
  if (provider === 'youtube') {
    fresh = await call('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: FORM,
      body: form({ client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), refresh_token: refresh, grant_type: 'refresh_token' })
    });
  } else {
    fresh = await call('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST', headers: FORM,
      body: form({ client_key: env('TIKTOK_CLIENT_KEY'), client_secret: env('TIKTOK_CLIENT_SECRET'), refresh_token: refresh, grant_type: 'refresh_token' })
    });
  }
  const accessToken = fresh.data.access_token;
  if (!accessToken) throw new SnsError('계정 연결이 만료되었습니다. 다시 연결해 주세요.', 400, 'expired');
  await db.query('UPDATE ar_sns_accounts SET token_enc = $3, refresh_enc = COALESCE($4, refresh_enc), expires_at = $5, updated_at = now() WHERE user_id = $1 AND provider = $2', [
    user.id, provider, seal({ access: accessToken }), fresh.data.refresh_token ? seal({ r: fresh.data.refresh_token }) : null,
    new Date(Date.now() + (Number(fresh.data.expires_in) || 3600) * 1000)
  ]);
  return { token: accessToken };
}

// ---------- 영상 올리기 ----------
function checkVideoUrl(u) {
  let url;
  try { url = new URL(String(u || '')); } catch (e) { throw new SnsError('영상 주소가 올바르지 않습니다.'); }
  if (url.protocol !== 'https:' || !/\.public\.blob\.vercel-storage\.com$/.test(url.hostname)) {
    throw new SnsError('영상은 이 서비스 저장소에 올린 파일만 발행할 수 있습니다.');
  }
  return url.toString();
}

async function downloadVideo(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), remaining(30000));
  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) throw new SnsError('저장된 영상을 읽지 못했습니다.', 502, 'storage');
    const len = Number(res.headers.get('content-length') || 0);
    if (len > MAX_VIDEO_BYTES) throw new SnsError('영상 파일이 너무 큽니다 (200MB 이하).');
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_VIDEO_BYTES) throw new SnsError('영상 파일이 너무 큽니다 (200MB 이하).');
    return { buf, type: (res.headers.get('content-type') || 'video/mp4').split(';')[0] };
  } catch (e) {
    if (e instanceof SnsError) throw e;
    throw new SnsError('저장된 영상을 읽지 못했습니다.', 502, 'storage');
  } finally {
    clearTimeout(t);
  }
}

function splitCaptionAndHashtags(caption) {
  const raw = String(caption || '').trim();
  const lines = raw.split(/\r?\n/);
  const tags = [];
  const body = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && /^(#[^\s#]+(\s+|$))+$/.test(trimmed)) tags.push(trimmed);
    else body.push(line);
  }
  const tagText = tags.join(' ').trim();
  const bodyText = body.join('\n').trim();
  return tagText && bodyText ? { body: bodyText, firstComment: tagText } : { body: raw, firstComment: '' };
}

async function instagramAccess(user, mode) {
  const account = await access(user, mode, { preferInstagram: !mode });
  if (!account.page) return { ...account, mode: 'instagram', graph: 'https://graph.facebook.com/' + graphVer() };
  const { page } = account;
  if (!page.ig) throw new SnsError('인스타그램 프로페셔널 계정이 연결된 페이지가 아닙니다.');
  return { id: page.ig.id, token: page.token, mode: 'meta', graph: 'https://graph.facebook.com/' + graphVer() };
}

function normalizeAutoDm(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const enabled = Boolean(raw.enabled);
  const dmText = String(raw.dmText || raw.dm_text || '').trim().slice(0, 950);
  if (!enabled || !dmText) return null;
  const matchMode = raw.matchMode === 'all' || raw.match_mode === 'all' ? 'all' : 'contains';
  const keywords = String(raw.keywords || '')
    .split(/[,，\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20)
    .join(', ')
    .slice(0, 200);
  if (matchMode !== 'all' && !keywords) return null;
  const replyText = String(raw.replyText || raw.reply_text || '').trim().slice(0, 280);
  const scope = raw.scope === 'all' ? 'all' : 'reel';
  return { enabled: true, matchMode, keywords, dmText, replyText, scope };
}

async function resolveUserIgId(user) {
  try {
    const ig = await instagramAccess(user);
    return String(ig.id || '');
  } catch (_) {
    return '';
  }
}

async function listIgDmRules(user) {
  const [rulesRes, logsRes, igId] = await Promise.all([
    db.query(
      `SELECT id, ig_account_id AS "igAccountId", media_id AS "mediaId", enabled, keywords, match_mode AS "matchMode",
              dm_text AS "dmText", reply_text AS "replyText", title, sent_count AS "sentCount",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM ar_ig_dm_rules WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 30`,
      [user.id]
    ),
    db.query(
      `SELECT comment_id AS "commentId", rule_id AS "ruleId", media_id AS "mediaId", commenter,
              comment_text AS "commentText", status, error, created_at AS "createdAt"
       FROM ar_ig_dm_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [user.id]
    ),
    resolveUserIgId(user)
  ]);
  return {
    igAccountId: igId,
    webhookUrl: `${siteUrl()}/api/sns?action=ig-webhook`,
    verifyTokenConfigured: Boolean(env('META_WEBHOOK_VERIFY_TOKEN') || env('IG_WEBHOOK_VERIFY_TOKEN')),
    rules: rulesRes.rows.map((r) => ({ ...r, id: String(r.id) })),
    logs: logsRes.rows
  };
}

async function saveIgDmRule(user, raw) {
  const dm = normalizeAutoDm({ ...raw, enabled: true });
  if (!dm) throw new SnsError('키워드(또는 모든 댓글)와 보낼 DM 내용을 입력해 주세요.');
  const igId = await resolveUserIgId(user);
  const mediaId = raw.mediaId && String(raw.mediaId).trim() ? String(raw.mediaId).trim().slice(0, 80) : '*';
  const title = String(raw.title || (mediaId === '*' ? '전체 릴스 공통 자동 DM' : '릴스 댓글 자동 DM')).trim().slice(0, 100);
  if (raw.id && /^\d+$/.test(String(raw.id))) {
    const upd = await db.query(
      `UPDATE ar_ig_dm_rules
       SET ig_account_id = CASE WHEN $3 <> '' THEN $3 ELSE ig_account_id END,
           media_id = $4, keywords = $5, match_mode = $6, dm_text = $7, reply_text = $8, title = $9, enabled = true, updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [raw.id, user.id, igId, mediaId, dm.keywords, dm.matchMode, dm.dmText, dm.replyText, title]
    );
    if (upd.rows.length) return { id: String(upd.rows[0].id), ...(await listIgDmRules(user)) };
  }
  const ins = await db.query(
    `INSERT INTO ar_ig_dm_rules (user_id, ig_account_id, media_id, enabled, keywords, match_mode, dm_text, reply_text, title)
     VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8) RETURNING id`,
    [user.id, igId, mediaId, dm.keywords, dm.matchMode, dm.dmText, dm.replyText, title]
  );
  return { id: String(ins.rows[0].id), ...(await listIgDmRules(user)) };
}

async function toggleIgDmRule(user, id, enabled) {
  if (!/^\d+$/.test(String(id || ''))) throw new SnsError('규칙을 찾지 못했습니다.');
  await db.query('UPDATE ar_ig_dm_rules SET enabled = $3, updated_at = now() WHERE id = $1 AND user_id = $2', [id, user.id, Boolean(enabled)]);
  return listIgDmRules(user);
}

async function deleteIgDmRule(user, id) {
  if (!/^\d+$/.test(String(id || ''))) throw new SnsError('규칙을 찾지 못했습니다.');
  await db.query('DELETE FROM ar_ig_dm_rules WHERE id = $1 AND user_id = $2', [id, user.id]);
  return listIgDmRules(user);
}

async function attachAutoDmOnPublish(userId, igAccountId, mediaId, title, autoDm) {
  const dm = normalizeAutoDm(autoDm);
  if (!dm || !igAccountId || !mediaId) return false;
  const targetMedia = dm.scope === 'all' ? '*' : String(mediaId);
  const label = String(title || (targetMedia === '*' ? '전체 릴스 자동 DM' : '릴스 댓글 자동 DM')).trim().slice(0, 100);
  await db.query(
    `INSERT INTO ar_ig_dm_rules (user_id, ig_account_id, media_id, enabled, keywords, match_mode, dm_text, reply_text, title)
     VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8)`,
    [userId, String(igAccountId), targetMedia, dm.keywords, dm.matchMode, dm.dmText, dm.replyText, label]
  );
  return true;
}

function verifyIgWebhook(query) {
  const mode = String(query['hub.mode'] || '');
  const token = String(query['hub.verify_token'] || '');
  const challenge = String(query['hub.challenge'] || '');
  const expected = env('META_WEBHOOK_VERIFY_TOKEN') || env('IG_WEBHOOK_VERIFY_TOKEN') || 'autoreels_ig_webhook';
  if (mode === 'subscribe' && token && token === expected) {
    return { ok: true, challenge };
  }
  return { ok: false };
}

function verifyMetaSignature(rawBuf, sigHeader) {
  const secret = env('META_APP_SECRET');
  if (!secret) return true;
  if (!sigHeader || !String(sigHeader).startsWith('sha256=')) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBuf).digest('hex');
  const a = Buffer.from(String(sigHeader));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function matchesDmRule(rule, text) {
  if (rule.match_mode === 'all') return true;
  const hay = String(text || '').toLowerCase().replace(/\s+/g, '');
  if (!hay) return false;
  const kws = String(rule.keywords || '').split(/[,，\n]+/).map((s) => s.trim().toLowerCase().replace(/\s+/g, '')).filter(Boolean);
  return kws.some((kw) => hay.includes(kw));
}

async function handleIgWebhook(rawBuf, sigHeader) {
  if (!verifyMetaSignature(rawBuf, sigHeader)) {
    throw new SnsError('invalid_signature', 403, 'bad_signature');
  }
  let payload = {};
  try { payload = JSON.parse(rawBuf.toString('utf8') || '{}'); } catch (_) { return { processed: 0 }; }
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  let sent = 0;
  for (const entry of entries) {
    const igId = String(entry && entry.id || '');
    const changes = Array.isArray(entry && entry.changes) ? entry.changes : [];
    for (const ch of changes) {
      if (!ch || ch.field !== 'comments' || !ch.value) continue;
      const v = ch.value;
      const commentId = String(v.id || '');
      const mediaId = String((v.media && v.media.id) || '');
      const commentText = String(v.text || '').trim();
      const commenterId = String((v.from && v.from.id) || '');
      const commenterName = String((v.from && v.from.username) || '').slice(0, 80);
      if (!commentId || !igId || !commentText) continue;
      if (commenterId && commenterId === igId) continue; // 본인 댓글 무시

      const rulesRes = await db.query(
        `SELECT * FROM ar_ig_dm_rules
         WHERE ig_account_id = $1 AND enabled = true AND (media_id = $2 OR media_id = '*')
         ORDER BY (media_id = $2) DESC, updated_at DESC LIMIT 10`,
        [igId, mediaId]
      );
      const matched = rulesRes.rows.find((r) => matchesDmRule(r, commentText));
      if (!matched) continue;

      // 중복 발송 방지 (동일 comment_id 1회 선점)
      const claimed = await db.query(
        `INSERT INTO ar_ig_dm_logs (comment_id, rule_id, user_id, ig_account_id, media_id, commenter, comment_text, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         ON CONFLICT (comment_id) DO NOTHING RETURNING comment_id`,
        [commentId, matched.id, matched.user_id, igId, mediaId, commenterName, commentText.slice(0, 300)]
      );
      if (!claimed.rows.length) continue;

      try {
        const ig = await instagramAccess({ id: matched.user_id });
        // Meta 공식 Instagram Private Reply API (댓글 작성자에게 DM 발송)
        await call(`${ig.graph}/${ig.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ig.token}` },
          body: JSON.stringify({
            recipient: { comment_id: commentId },
            message: { text: String(matched.dm_text || '').slice(0, 950) }
          })
        });
        if (matched.reply_text) {
          try {
            await call(`${ig.graph}/${commentId}/replies`, {
              method: 'POST',
              headers: FORM,
              body: form({ message: String(matched.reply_text).slice(0, 280), access_token: ig.token })
            });
          } catch (_) {}
        }
        await db.query("UPDATE ar_ig_dm_logs SET status = 'sent', error = NULL WHERE comment_id = $1", [commentId]);
        await db.query('UPDATE ar_ig_dm_rules SET sent_count = sent_count + 1, updated_at = now() WHERE id = $1', [matched.id]);
        sent++;
      } catch (err) {
        await db.query("UPDATE ar_ig_dm_logs SET status = 'failed', error = $2 WHERE comment_id = $1", [commentId, String(err && err.message || 'dm_failed').slice(0, 300)]);
      }
    }
  }
  return { processed: sent };
}

async function publishInstagram(user, job) {
  const ig = await instagramAccess(user);
  const split = ig.mode === 'meta' && job.igFirstComment ? splitCaptionAndHashtags(job.caption) : { body: job.caption, firstComment: '' };
  const r = await call(`${ig.graph}/${ig.id}/media`, {
    method: 'POST', headers: FORM,
    body: form({ media_type: 'REELS', video_url: job.videoUrl, caption: split.body, share_to_feed: 'true', access_token: ig.token })
  });
  return { status: 'processing', meta: { container: r.data.id, ig: ig.id, connection: ig.mode, firstComment: split.firstComment, igAutoDm: job.igAutoDm || null } };
}

async function publishThreads(user, job) {
  const { token } = await access(user, 'threads');
  const r = await call('https://graph.threads.net/v1.0/me/threads', {
    method: 'POST', headers: FORM,
    body: form({ media_type: 'VIDEO', video_url: job.videoUrl, text: String(job.caption || '').slice(0, 500), access_token: token })
  });
  return { status: 'processing', meta: { container: r.data.id } };
}

async function publishFacebook(user, job) {
  const { page } = await access(user, 'meta');
  const base = `https://graph.facebook.com/${graphVer()}/${page.id}/video_reels`;
  const start = await call(base, { method: 'POST', headers: FORM, body: form({ upload_phase: 'start', access_token: page.token }) });
  const videoId = start.data.video_id;
  await call(start.data.upload_url || `https://rupload.facebook.com/video-upload/${graphVer()}/${videoId}`, {
    method: 'POST', headers: { Authorization: `OAuth ${page.token}`, file_url: job.videoUrl }
  });
  await call(base, {
    method: 'POST', headers: FORM,
    body: form({ upload_phase: 'finish', video_id: videoId, video_state: 'PUBLISHED', description: job.caption, access_token: page.token })
  });
  return { status: 'processing', remoteId: videoId, meta: { video: videoId } };
}

async function publishYoutube(user, job, video) {
  const { token } = await access(user, 'youtube');
  const title = String(job.title || '').slice(0, 95) || '새 영상';
  const init = await call('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': video.type, 'X-Upload-Content-Length': String(video.buf.length)
    },
    body: JSON.stringify({
      snippet: { title: `${title} #Shorts`.slice(0, 100), description: String(job.caption || '').slice(0, 4900), categoryId: '22' },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false }
    })
  });
  const loc = init.headers.get('location');
  if (!loc) throw new SnsError('유튜브 업로드 주소를 받지 못했습니다.', 502, 'provider');
  const up = await call(loc, { method: 'PUT', headers: { 'Content-Type': video.type, 'Content-Length': String(video.buf.length) }, body: video.buf }, 50000);
  const id = up.data.id;
  return { status: 'done', remoteId: id, url: id ? `https://youtube.com/shorts/${id}` : '' };
}

async function publishTiktok(user, job, video) {
  const { token } = await access(user, 'tiktok');
  const size = video.buf.length;
  if (size > 64 * 1024 * 1024) throw new SnsError('틱톡에는 64MB 이하 영상만 올릴 수 있습니다.');
  const init = await call('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: size, total_chunk_count: 1 } })
  });
  const d = init.data.data || {};
  if (!d.upload_url) throw new SnsError((init.data.error && init.data.error.message) || '틱톡 업로드를 시작하지 못했습니다.', 502, 'provider');
  await call(d.upload_url, {
    method: 'PUT', headers: { 'Content-Type': video.type, 'Content-Length': String(size), 'Content-Range': `bytes 0-${size - 1}/${size}` }, body: video.buf
  }, 50000);
  return { status: 'processing', remoteId: d.publish_id, meta: { publish: d.publish_id } };
}

async function executePublishTarget(user, t, job, video) {
  if (t === 'instagram') return publishInstagram(user, job);
  if (t === 'facebook') return publishFacebook(user, job);
  if (t === 'youtube') return publishYoutube(user, job, video);
  if (t === 'threads') return publishThreads(user, job);
  return publishTiktok(user, job, video);
}

function parseScheduledAt(v) {
  if (!v) return null;
  const when = new Date(v);
  if (!Number.isFinite(when.getTime()) || when.getTime() < Date.now()+120000 || when.getTime() > Date.now()+7*86400000) throw new SnsError('예약은 2분 뒤부터 7일 이내로 지정해 주세요.',400,'invalid_schedule');
  return when;
}
async function requireSchedule(v) {
  if (!await scheduler.available()) throw new SnsError('예약 실행 서비스가 연결되지 않았거나 멈췄습니다. 지금 게시를 이용해 주세요.',503,'scheduling_unavailable');
  return parseScheduledAt(v);
}
async function history(user) {
  const r = await db.query('SELECT id, provider AS target, status, scheduled_at AS "scheduledAt", created_at AS "createdAt", url, error FROM ar_publish_jobs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',[user.id]);
  return r.rows;
}
async function cancelJob(user,id) {
  if (!/^\d+$/.test(String(id))) throw new SnsError('예약을 다시 선택해 주세요.');
  const r = await db.query("UPDATE ar_publish_jobs SET status='cancelled',updated_at=now() WHERE user_id=$1 AND id=$2 AND status='scheduled' RETURNING request_key",[user.id,id]);
  if (!r.rows.length) throw new SnsError('이미 실행됐거나 취소할 수 없는 예약입니다.',409,'not_cancellable');
  const restored = await refundFailedRequest(user.id,r.rows[0].request_key);
  return {cancelled:true,restored};
}
async function startPublish(user, body) {
  const targets = [...new Set((Array.isArray(body.targets) ? body.targets : []).filter((t) => TARGETS.includes(t)))];
  if (!targets.length) throw new SnsError('발행할 SNS를 골라 주세요.');
  const job = {
    videoUrl: checkVideoUrl(body.videoUrl),
    caption: String(body.caption || '').slice(0, 2100),
    title: String(body.title || '').slice(0, 95),
    igFirstComment: Boolean(body.igFirstComment),
    igAutoDm: normalizeAutoDm(body.igAutoDm)
  };
  const scheduledAt = body.scheduledAt ? await requireSchedule(body.scheduledAt) : null;
  if (scheduledAt) {
    const url = new URL(job.videoUrl);
    if (!url.pathname.startsWith(`/publish/${user.id}/`)) throw new SnsError('내 계정에서 올린 영상만 예약할 수 있습니다.',403,'invalid_owner');
    return db.tx(async c => {
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`schedule:${user.id}`]);
      const old = await c.query('SELECT * FROM ar_publish_jobs WHERE user_id=$1 AND request_key=$2',[user.id,body.requestId]);
      if (old.rows.length) {
        if (old.rows.length !== targets.length || old.rows.some(r => !targets.includes(r.provider) || r.video_url !== job.videoUrl)) throw new SnsError('같은 요청 번호의 내용이 다릅니다.',409,'request_conflict');
        return old.rows.map(r=>({id:String(r.id),target:r.provider,status:r.status,scheduledAt:r.scheduled_at}));
      }
      const count = await c.query("SELECT count(*)::int AS n FROM ar_publish_jobs WHERE user_id=$1 AND status='scheduled'",[user.id]);
      if (count.rows[0].n+targets.length > 50) throw new SnsError('대기 예약은 계정당 50개까지 가능합니다.',429,'schedule_limit');
      const out=[];
      for (const t of targets) {
        const r=await c.query("INSERT INTO ar_publish_jobs (user_id,provider,status,video_url,scheduled_at,caption,title,meta,request_key) VALUES ($1,$2,'scheduled',$3,$4,$5,$6,$7,$8) RETURNING id",[user.id,t,job.videoUrl,scheduledAt,job.caption,job.title,JSON.stringify({igFirstComment:job.igFirstComment,igAutoDm:t==='instagram'?job.igAutoDm:null}),body.requestId]);
        out.push({id:String(r.rows[0].id),target:t,status:'scheduled',scheduledAt:scheduledAt.toISOString()});
      }
      return out;
    });
  }
  let video = null;
  const needBytes = !scheduledAt && targets.some((t) => t === 'youtube' || t === 'tiktok');
  const out = [];
  for (const t of targets) {
    const ins = await db.query(
      'INSERT INTO ar_publish_jobs (user_id, provider, status, video_url, caption, title, request_key) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (user_id, request_key, provider) DO NOTHING RETURNING id',
      [user.id, t, 'pending', job.videoUrl, job.caption, job.title, body.requestId]
    );
    if (!ins.rows.length) {
      const old = await db.query('SELECT id, status, url, error FROM ar_publish_jobs WHERE user_id = $1 AND request_key = $2 AND provider = $3', [user.id, body.requestId, t]);
      const row = old.rows[0];
      out.push({id:String(row.id),target:t,status:row.status,url:row.url || '',error:row.error || ''});
      continue;
    }
    const id = ins.rows[0].id;
    let result;
    try {
      if (needBytes && !video && (t === 'youtube' || t === 'tiktok')) video = await downloadVideo(job.videoUrl);
      result = await executePublishTarget(user, t, job, video);
    } catch (e) {
      result = { status: e.uncertain ? 'review' : 'failed', error: e.uncertain ? '게시 결과 확인 필요: 중복 방지를 위해 재게시하지 마세요.' : (e.message || '발행 실패') };
    }
    await db.query('UPDATE ar_publish_jobs SET status = $2, remote_id = $3, error = $4, url = $5, meta = $6, updated_at = now() WHERE id = $1',
      [id, result.status, result.remoteId || null, result.error || null, result.url || null, JSON.stringify(result.meta || {})]);
    out.push({ id: String(id), target: t, status: result.status, url: result.url || '', error: result.error || '' });
  }
  return out;
}

// 처리 중인 발행 확인 (인스타그램은 처리가 끝나야 게시)
// 브라우저 폴링과 크론이 같은 게시 완료 요청을 보내지 않도록 먼저 선점합니다.
async function checkJob(user, row) {
  const claim = await db.query("UPDATE ar_publish_jobs SET status = 'checking', updated_at = now() WHERE id = $1 AND user_id = $2 AND status = 'processing' RETURNING id", [row.id, user.id]);
  if (!claim.rows.length) {
    const current = await db.query('SELECT status, url, error FROM ar_publish_jobs WHERE id = $1 AND user_id = $2', [row.id, user.id]);
    const value = current.rows[0] || {status:'processing'};
    return {...value,status:value.status === 'checking' ? 'processing' : value.status,claimedElsewhere:true};
  }
  let result;
  try { result = await checkJobOnce(user, row); }
  catch (e) { result = e.uncertain ? {status:'review',error:'게시 결과 확인 필요: 중복 방지를 위해 재게시하지 마세요.'} : {status:'processing',note:e.message}; }
  await db.query('UPDATE ar_publish_jobs SET status = $2, remote_id = COALESCE($3, remote_id), url = COALESCE($4, url), error = $5, updated_at = now() WHERE id = $1', [row.id,result.status,result.remoteId || null,result.url || null,result.error || null]);
  return result;
}
async function checkJobOnce(user, row) {
  const m = row.meta || {};
  if (row.provider === 'instagram') {
    const ig = await instagramAccess(user, m.connection || 'meta');
    if (String(ig.id) !== String(m.ig)) return { status: 'failed', error: '발행 도중 인스타그램 계정이 변경됐어요.' };
    const st = await call(`${ig.graph}/${m.container}?` + form({ fields: 'status_code,status', access_token: ig.token }));
    if (st.data.status_code === 'ERROR' || st.data.status_code === 'EXPIRED') return { status: 'failed', error: String(st.data.status || '인스타그램 영상 처리 실패').slice(0, 300) };
    if (st.data.status_code !== 'FINISHED') return { status: 'processing' };
    const pub = await call(`${ig.graph}/${m.ig}/media_publish`, {
      method: 'POST', headers: FORM, body: form({ creation_id: m.container, access_token: ig.token })
    });
    if (m.firstComment) {
      try {
        await call(`${ig.graph}/${pub.data.id}/comments`, {
          method: 'POST', headers: FORM, body: form({ message: m.firstComment, access_token: ig.token })
        });
      } catch (e) {}
    }
    let dmAttached = false;
    if (m.igAutoDm && m.igAutoDm.enabled && pub.data.id) {
      try {
        dmAttached = await attachAutoDmOnPublish(user.id, m.ig, pub.data.id, row.title || '', m.igAutoDm);
      } catch (e) {}
    }
    let url = '';
    try {
      const md = await call(`${ig.graph}/${pub.data.id}?` + form({ fields: 'permalink', access_token: ig.token }));
      url = md.data.permalink || '';
    } catch (e) {}
    return { status: 'done', remoteId: pub.data.id, url, note: dmAttached ? '댓글 자동 DM 연동됨' : '' };
  }
  if (row.provider === 'threads') {
    const { token } = await access(user, 'threads');
    const st = await call(`https://graph.threads.net/v1.0/${m.container}?` + form({ fields: 'status,error_message', access_token: token }));
    if (st.data.status === 'ERROR' || st.data.status === 'EXPIRED') return { status: 'failed', error: String(st.data.error_message || '스레드 영상 처리 실패').slice(0, 300) };
    if (st.data.status !== 'FINISHED') return { status: 'processing' };
    const pub = await call('https://graph.threads.net/v1.0/me/threads_publish', {
      method: 'POST', headers: FORM, body: form({ creation_id: m.container, access_token: token })
    });
    let url = '';
    try {
      const md = await call(`https://graph.threads.net/v1.0/${pub.data.id}?` + form({ fields: 'permalink', access_token: token }));
      url = md.data.permalink || '';
    } catch (e) {}
    return { status: 'done', remoteId: pub.data.id, url };
  }
  if (row.provider === 'facebook') {
    const { page } = await access(user, 'meta');
    const st = await call(`https://graph.facebook.com/${graphVer()}/${m.video}?` + form({ fields: 'status,permalink_url', access_token: page.token }));
    const vs = st.data.status || {};
    if (vs.video_status === 'error') return { status: 'failed', error: '페이스북 영상 처리 실패' };
    if (vs.video_status === 'ready' || (vs.publishing_phase && vs.publishing_phase.status === 'complete')) {
      const link = st.data.permalink_url || '';
      return { status: 'done', url: link ? (link.startsWith('http') ? link : `https://www.facebook.com${link}`) : '' };
    }
    return { status: 'processing' };
  }
  if (row.provider === 'tiktok') {
    const { token } = await access(user, 'tiktok');
    const st = await call('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ publish_id: m.publish })
    });
    const s = (st.data.data || {}).status;
    if (s === 'FAILED') return { status: 'failed', error: String((st.data.data || {}).fail_reason || '틱톡 업로드 실패') };
    if (s === 'SEND_TO_USER_INBOX') return { status: 'done', note: '틱톡 앱 알림함에서 게시를 마무리해 주세요' };
    if (s === 'PUBLISH_COMPLETE') return { status: 'done' };
    return { status: 'processing' };
  }
  return { status: row.status };
}

// 모든 대상이 확정 실패했을 때만 동일 요청의 차감을 한 번 환원합니다.
async function refundFailedRequest(userId, requestId, allowEmpty = false) {
  if (!requestId) return false;
  const saved = await db.query('SELECT result FROM ar_usage_requests WHERE subject = $1 AND request_id = $2', [`u:${userId}`, requestId]);
  const gate = saved.rows[0] && saved.rows[0].result;
  if (!gate || !gate.expectedJobs) return false;
  if (gate.refunded) return true;
  const jobs = await db.query('SELECT status FROM ar_publish_jobs WHERE user_id = $1 AND request_key = $2', [userId, requestId]);
  if (!(allowEmpty && jobs.rows.length === 0) && !(jobs.rows.length === gate.expectedJobs && jobs.rows.every(j => ['failed','cancelled'].includes(j.status)))) return false;
  return require('./usage').refundUsage(null, 'export', 1, gate);
}

async function jobStatus(user, ids) {
  const list = (Array.isArray(ids) ? ids : []).map((x) => String(x)).filter((x) => /^\d+$/.test(x)).slice(0, 8);
  if (!list.length) return [];
  const r = await db.query('SELECT * FROM ar_publish_jobs WHERE user_id = $1 AND id = ANY($2::bigint[])', [user.id, list]);
  const out = [];
  for (const row of r.rows) {
    let cur = { status: row.status === 'checking' ? 'processing' : row.status, url: row.url, error: row.error };
    if (row.status === 'processing') {
      try {
        const next = await checkJob(user, row);
        cur = { ...cur, ...next };
        const stale = Date.now() - new Date(row.scheduled_at || row.created_at).getTime() > 30 * 60 * 1000;
        if (cur.status === 'processing' && stale) cur = { status: 'review', error: '처리 지연: 실제 게시 여부를 확인해 주세요. 자동 재게시하지 않습니다.' };
        if (!next.claimedElsewhere && (cur.status !== 'processing' || next.remoteId)) {
          await db.query('UPDATE ar_publish_jobs SET status = $2, remote_id = COALESCE($3, remote_id), url = COALESCE($4, url), error = $5, updated_at = now() WHERE id = $1',
            [row.id, cur.status, next.remoteId || null, cur.url || null, cur.error || null]);
        }
      } catch (e) {
        cur.note = e.message;
      }
    }
    out.push({ id: String(row.id), target: row.provider, status: cur.status, url: cur.url || '', error: cur.error || '', note: cur.note || '' });
  }
  for (const key of new Set(r.rows.map(row => row.request_key).filter(Boolean))) {
    try { await refundFailedRequest(user.id, key); } catch (e) { console.error('[sns] refund check failed'); }
  }
  return out;
}

// 브라우저가 영상 파일을 저장소에 바로 올릴 수 있게 하는 1회용 업로드 권한
async function uploadToken(user, body) {
  const rw = env('BLOB_READ_WRITE_TOKEN');
  if (!rw) throw new SnsError('영상 저장소가 아직 준비되지 않았습니다.', 503, 'not_ready');
  const type = String(body.type || 'video/mp4').split(';')[0];
  if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(type)) throw new SnsError('mp4 영상만 올릴 수 있습니다.');
  const size = Number(body.size) || 0;
  if (size <= 0 || size > MAX_VIDEO_BYTES) throw new SnsError('영상 파일 크기가 올바르지 않습니다 (200MB 이하).');
  const ext = type === 'video/webm' ? 'webm' : type === 'video/quicktime' ? 'mov' : 'mp4';
  const pathname = `publish/${user.id}/${Date.now().toString(36)}-${b64url(crypto.randomBytes(6))}.${ext}`;
  const { generateClientTokenFromReadWriteToken } = require('@vercel/blob/client');
  const clientToken = await generateClientTokenFromReadWriteToken({
    token: rw, pathname, allowedContentTypes: [type], maximumSizeInBytes: Math.min(MAX_VIDEO_BYTES, size + 1024),
    validUntil: Date.now() + 15 * 60 * 1000, ttlDays: 31
  });
  return { pathname, clientToken, contentType: type };
}

// 크론 워커: 예약 시간이 된 발행 시작 + 처리 중인 발행 마무리
async function runScheduledAndPending() {
  const deadline=Date.now()+45000;
  await db.query("UPDATE ar_publish_jobs SET status='failed',error='예약 실행이 15분 이상 지연되어 중단했습니다. 다시 예약해 주세요.',updated_at=now() WHERE status='scheduled' AND scheduled_at < now()-interval '15 minutes'");
  // 외부 게시 직후 응답이 유실된 작업은 자동 재게시하지 않습니다.
  await db.query("UPDATE ar_publish_jobs SET status = 'review', error = '게시 결과 확인 필요: 자동 재시도하지 않습니다', updated_at = now() WHERE status IN ('starting','pending','checking') AND updated_at < now() - interval '10 minutes'");
  const due = await db.query(
    "SELECT * FROM ar_publish_jobs WHERE status = 'scheduled' AND scheduled_at <= now() ORDER BY scheduled_at ASC LIMIT 4"
  );
  let started = 0;
  let failed = 0;
  await Promise.all(due.rows.map(row => jobDeadline.run(deadline,async () => {
    const claimed = await db.query("UPDATE ar_publish_jobs SET status = 'starting', attempts = attempts + 1, updated_at = now() WHERE id = $1 AND status = 'scheduled' RETURNING id", [row.id]);
    if (!claimed.rows.length) return;
    const user = { id: row.user_id };
    const m = row.meta || {};
    const job = {
      videoUrl: row.video_url,
      caption: row.caption || '',
      title: row.title || '',
      igFirstComment: Boolean(m.igFirstComment),
      igAutoDm: m.igAutoDm || null
    };
    let result;
    try {
      const needBytes = row.provider === 'youtube' || row.provider === 'tiktok';
      const video = needBytes ? await downloadVideo(job.videoUrl) : null;
      result = await executePublishTarget(user, row.provider, job, video);
      started++;
    } catch (e) {
      if (e.code === 'storage' && Number(row.attempts || 0) < 2) {
        await db.query("UPDATE ar_publish_jobs SET status='scheduled',scheduled_at=now()+interval '1 minute',error='영상 읽기 재시도 대기',updated_at=now() WHERE id=$1",[row.id]);
        return;
      }
      result = { status: e.uncertain ? 'review' : 'failed', error: e.message || '예약 발행 실패' };
      failed++;
    }
    await db.query(
      'UPDATE ar_publish_jobs SET status = $2, remote_id = $3, error = $4, url = $5, meta = $6, updated_at = now() WHERE id = $1',
      [row.id, result.status, result.remoteId || null, result.error || null, result.url || null, JSON.stringify(result.meta || {})]
    );
  })));
  const proc = await db.query(
    "SELECT * FROM ar_publish_jobs WHERE status = 'processing' ORDER BY updated_at ASC LIMIT 4"
  );
  let completed = 0;
  await Promise.all(proc.rows.map(row => jobDeadline.run(deadline,async () => {
    if(Date.now()>deadline-5000)return;
    try {
      const next = await checkJob({ id: row.user_id }, row);
      const stale = Date.now() - new Date(row.scheduled_at || row.created_at).getTime() > 30 * 60 * 1000;
      const cur = (next.status === 'processing' && stale) ? { status: 'review', error: '처리 지연: 실제 게시 여부를 확인해 주세요. 자동 재게시하지 않습니다.' } : next;
      if (!next.claimedElsewhere && (cur.status !== 'processing' || next.remoteId)) {
        await db.query(
          'UPDATE ar_publish_jobs SET status = $2, remote_id = COALESCE($3, remote_id), url = COALESCE($4, url), error = $5, updated_at = now() WHERE id = $1',
          [row.id, cur.status, next.remoteId || null, cur.url || null, cur.error || null]
        );
        if (cur.status === 'done') completed++;
      }
    } catch (e) {}
  })));
  const reconcile = await db.query("SELECT DISTINCT j.user_id,j.request_key FROM ar_publish_jobs j JOIN ar_usage_requests u ON u.subject='u:' || j.user_id::text AND u.request_id=j.request_key WHERE j.status IN ('failed','cancelled') AND COALESCE((u.result->>'refunded')::boolean,false)=false LIMIT 50");
  for (const row of reconcile.rows) {
    try { await refundFailedRequest(row.user_id, row.request_key); } catch (e) { console.error('[sns] refund check failed'); }
  }
  return { scheduledTotal: due.rows.length, started, failed, processingChecked: proc.rows.length, completed };
}

module.exports = { requireSchedule, parseScheduledAt, history, cancelJob, refundFailedRequest, TARGETS, SnsError, providerReady, startAuth, finishAuth, status, disconnect, selectPage, startPublish, jobStatus, uploadToken, runScheduledAndPending, seal, unseal, redirectUri, listIgDmRules, saveIgDmRule, toggleIgDmRule, deleteIgDmRule, verifyIgWebhook, handleIgWebhook, normalizeAutoDm };
