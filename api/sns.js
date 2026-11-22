'use strict';
// GET/POST /api/sns?action=...
// SNS 계정 연결(인스타그램·페이스북·유튜브·틱톡)과 영상 발행. (Vercel 함수 개수를 아끼려고 하나로 묶음)
//   GET  ?action=status            내 연결 상태
//   POST ?action=connect           {target} → 로그인 주소
//   GET  /api/sns?code=..&state=.. 각 SNS 로그인 후 돌아오는 곳 (모든 서비스 공통 주소)
//   POST ?action=disconnect        {target}
//   POST ?action=select-page       {pageId}  (페이스북 페이지·인스타그램 계정 바꾸기)
//   POST ?action=upload-token      {size, type} → 브라우저가 영상을 저장소에 바로 올릴 1회용 권한
//   POST ?action=publish           {targets, videoUrl, caption, title}
//   POST ?action=jobs              {ids} → 발행 진행 상황
const db = require('../lib/server/db');
const { readiness } = require('../lib/server/config');
const { readSession, sameOrigin } = require('../lib/server/session');
const { getSubscription } = require('../lib/server/billing');
const { isActive, consume, refundUsage } = require('../lib/server/usage');
const sns = require('../lib/server/sns');

function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

async function readRawBuffer(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');
  if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body), 'utf8');
  return await new Promise((resolve) => {
    const chunks = [];
    let total = 0;
    req.on('data', (c) => {
      total += c.length;
      if (total > 200000) { req.destroy(); return; }
      chunks.push(Buffer.from(c));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.alloc(0)));
  });
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
  }
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 50000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

async function currentUser(req) {
  const s = readSession(req);
  if (!s) return null;
  const r = await db.query('SELECT * FROM ar_users WHERE id = $1', [s.uid]);
  const u = r.rows[0];
  if (!u || Number(u.session_version) !== Number(s.v || 1)) return null;
  return u;
}

function backTo(res, params) {
  const q = new URLSearchParams(params).toString();
  res.statusCode = 302;
  res.setHeader('Location', `/studio?${q}#publish`);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

module.exports = async function handler(req, res) {
  const q = req.query || {};
  const action = String(q.action || '').trim();
  const ready = readiness();

  if (!ready.serverMode) {
    if (q.code || q.state || q.error) return backTo(res, { sns: 'error', reason: 'server_off' });
    return send(res, 503, { ok: false, error: 'server_mode_off', message: '회원 서버가 아직 준비되지 않았습니다.' });
  }

  // Meta Instagram 댓글 Webhook (GET 검증 챌린지 + POST 댓글 자동 DM 처리)
  if (action === 'ig-webhook' || (req.method === 'GET' && q['hub.mode'] === 'subscribe')) {
    if (req.method === 'GET') {
      const v = sns.verifyIgWebhook(q);
      if (!v.ok) return res.status(403).send('forbidden');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(v.challenge);
    }
    if (req.method === 'POST') {
      try {
        const rawBuf = await readRawBuffer(req);
        const sig = req.headers['x-hub-signature-256'] || '';
        const out = await sns.handleIgWebhook(rawBuf, sig);
        return send(res, 200, { ok: true, ...out });
      } catch (e) {
        if (e instanceof sns.SnsError && e.status === 403) return send(res, 403, { ok: false, error: 'bad_signature' });
        console.error('[sns-webhook]', e && e.message);
        return send(res, 200, { ok: false, error: 'webhook_error' });
      }
    }
    return send(res, 405, { ok: false, error: 'method' });
  }

  // SNS 로그인 후 돌아오는 곳
  if (!action && req.method === 'GET' && (q.state || q.error)) {
    if (q.error) return backTo(res, { sns: 'error', reason: String(q.error_reason || q.error).slice(0, 60) });
    try {
      const out = await sns.finishAuth(String(q.state), String(q.code || ''), readSession(req)?.uid);
      return backTo(res, { sns: 'connected', provider: out.provider });
    } catch (e) {
      return backTo(res, { sns: 'error', reason: String(e.code || 'failed').slice(0, 40), msg: String(e.message || '').slice(0, 120) });
    }
  }

  if (req.method === 'POST' && !sameOrigin(req)) return send(res, 403, { ok: false, error: 'bad_origin' });

  try {
    const user = await currentUser(req);
    if (!user) return send(res, 401, { ok: false, error: 'login_required', message: '로그인해 주세요.' });

    if (action === 'status') {
      return send(res, 200, { ok: true, ...(await sns.status(user)) });
    }
    if (action === 'dm-rules') {
      return send(res, 200, { ok: true, ...(await sns.listIgDmRules(user)) });
    }
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method' });
    const b = await readBody(req);

    if (action === 'dm-save') {
      return send(res, 200, { ok: true, ...(await sns.saveIgDmRule(user, b)) });
    }
    if (action === 'dm-toggle') {
      return send(res, 200, { ok: true, ...(await sns.toggleIgDmRule(user, b.id, b.enabled)) });
    }
    if (action === 'dm-delete') {
      return send(res, 200, { ok: true, ...(await sns.deleteIgDmRule(user, b.id)) });
    }

    if (action === 'connect') {
      return send(res, 200, { ok: true, url: await sns.startAuth(user, String(b.target || ''), req.headers.host) });
    }
    if (action === 'disconnect') {
      await sns.disconnect(user, String(b.target || ''));
      return send(res, 200, { ok: true, ...(await sns.status(user)) });
    }
    if (action === 'select-page') {
      await sns.selectPage(user, String(b.pageId || ''));
      return send(res, 200, { ok: true, ...(await sns.status(user)) });
    }

    // 영상 올리기·발행은 구독 중인 회원만
    if (action === 'upload-token' || action === 'publish') {
      const sub = await getSubscription(user.id);
      if (!isActive(sub)) return send(res, 402, { ok: false, error: 'pro_required', message: 'SNS 자동 발행은 PRO 구독 회원만 쓸 수 있습니다.' });
    }
    if (action === 'upload-token') {
      return send(res, 200, { ok: true, ...(await sns.uploadToken(user, b)) });
    }
    if (action === 'publish') {
      if (b.scheduledAt) await sns.requireSchedule(b.scheduledAt);
      if (!/^[a-zA-Z0-9_-]{16,100}$/.test(String(b.requestId || ''))) return send(res,400,{ok:false,error:'request_id_required',message:'화면을 새로고침한 뒤 다시 게시해 주세요.'});
      const expectedJobs = new Set((Array.isArray(b.targets) ? b.targets : []).filter(t => sns.TARGETS.includes(t))).size;
      if (!expectedJobs) return send(res,400,{ok:false,error:'targets_required',message:'발행할 SNS를 골라 주세요.'});
      const signature='sns:'+require('node:crypto').createHash('sha256').update(JSON.stringify([[...new Set(b.targets)].sort(),b.videoUrl,b.caption||'',b.title||'',b.scheduledAt||'',Boolean(b.igFirstComment),b.igAutoDm||null])).digest('hex');
      const q = await consume(req, 'export', 1, {requestId:b.requestId,expectedJobs,signature});
      if (!q.ok) return send(res, q.status, q.body);
      try {
        const jobs = await sns.startPublish(user, b);
        if (jobs.length && jobs.every(job => job.status === 'failed')) {
          const restored = await refundUsage(req, 'export', 1, q);
          return send(res,502,{ok:false,error:'publish_failed',jobs,message:restored ? '모든 SNS 게시가 실패했습니다. 이용 횟수를 되돌렸습니다.' : '모든 SNS 게시가 실패했습니다. 이용 횟수 복구 확인이 필요합니다.'});
        }
        return send(res, 200, { ok: true, jobs, usage: { used: q.used, cap: q.cap } });
      } catch (pubErr) {
        try { await sns.refundFailedRequest(user.id,b.requestId,true); } catch (_) {}
        throw pubErr;
      }
    }
    if (action === 'history') return send(res,200,{ok:true,jobs:await sns.history(user)});
    if (action === 'cancel-job') return send(res,200,{ok:true,...await sns.cancelJob(user,b.id)});
    if (action === 'jobs') {
      return send(res, 200, { ok: true, jobs: await sns.jobStatus(user, b.ids) });
    }
    return send(res, 404, { ok: false, error: 'unknown_action' });
  } catch (e) {
    if (e instanceof sns.SnsError) return send(res, e.status || 400, { ok: false, error: e.code, message: e.message });
    console.error('[sns]', e && e.message);
    return send(res, 500, { ok: false, error: 'server_error', message: '잠시 후 다시 시도해 주세요.' });
  }
};
