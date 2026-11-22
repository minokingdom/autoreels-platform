'use strict';
// 사용량 계산·제한: 성우 글자 수, AI 대본 횟수.
// 운영은 DB 예산을 필수 확인하고, 로컬 시연만 메모리 한도를 사용합니다.
const crypto = require('node:crypto');
const db = require('./db');
const { readiness } = require('./config');
const { readSession } = require('./session');
const { FREE_TRIAL_DAYS, limits } = require('./plans');
const { effectiveSubscription } = require('./comp-pro');

function monthKey(d = new Date()) {
  // 한국 시간 기준 달
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return k.toISOString().slice(0, 7);
}
function dayKey(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return k.toISOString().slice(0, 10);
}

const TRIAL_PERIOD = 'trial';

function trialFor(createdAt, now = new Date()) {
  const start = createdAt ? new Date(createdAt).getTime() : NaN;
  if (!Number.isFinite(start)) return { active: false, endsAt: null };
  const end = start + FREE_TRIAL_DAYS * 86400000;
  return { active: start <= now.getTime() && now.getTime() < end, endsAt: new Date(end).toISOString() };
}

function legacyTrialPeriods(createdAt, now) {
  return [...new Set([monthKey(new Date(createdAt)), monthKey(now)])];
}
function hourKey(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return k.toISOString().slice(0, 13);
}

function isSameSiteRequest(req) {
  const host = String((req && req.headers && req.headers.host) || '').toLowerCase();
  const source = (req && req.headers && (req.headers.origin || req.headers.referer)) || '';
  if (!source) return true;
  try {
    return new URL(source).host.toLowerCase() === host;
  } catch (e) {
    return false;
  }
}

// DB가 꺼져 있을 때(시연 모드) 비용 누수를 막기 위한 메모리 기반 IP 일일 + 인스턴스 시간당 한도
const MEM_USAGE = new Map();
const MEM_DAILY_IP_CAPS = { ai: 30, tts: 3000, trends: 30, export: 0 };
const MEM_HOURLY_GLOBAL_CAPS = { ai: 120, tts: 25000, trends: 40, export: 0 };

function memPruneIfNeeded() {
  if (MEM_USAGE.size < 2000) return;
  const today = dayKey();
  const curHour = hourKey();
  for (const k of MEM_USAGE.keys()) {
    if (!k.includes(today) && !k.includes(curHour)) MEM_USAGE.delete(k);
  }
}

function memSubjectKey(req) {
  const salt = String(process.env.AUTH_SECRET || 'ar_mem_fallback');
  return crypto.createHash('sha256').update(salt + clientIp(req)).digest('hex').slice(0, 20);
}

function memConsume(req, kind, units) {
  memPruneIfNeeded();
  const ipCap = MEM_DAILY_IP_CAPS[kind];
  const hrCap = MEM_HOURLY_GLOBAL_CAPS[kind];
  if (ipCap === undefined || hrCap === undefined) return { ok: true, skipped: true };
  const ipKey = `ip:${kind}:${dayKey()}:${memSubjectKey(req)}`;
  const gKey = `gl:${kind}:${hourKey()}`;
  const ipUsed = MEM_USAGE.get(ipKey) || 0;
  const gUsed = MEM_USAGE.get(gKey) || 0;
  if (ipUsed + units > ipCap || gUsed + units > hrCap) {
    return {
      ok: false,
      status: 429,
      body: {
        ok: false,
        error: 'quota_exceeded',
        kind,
        tier: 'anonymous',
        message: '체험 한도를 초과했습니다. 잠시 후 다시 시도하거나 로그인해 주세요.'
      }
    };
  }
  MEM_USAGE.set(ipKey, ipUsed + units);
  MEM_USAGE.set(gKey, gUsed + units);
  return { ok: true, used: ipUsed + units, cap: ipCap, tier: 'anonymous', memoryFallback: true };
}

function memRefund(req, kind, units) {
  const ipKey = `ip:${kind}:${dayKey()}:${memSubjectKey(req)}`;
  const gKey = `gl:${kind}:${hourKey()}`;
  if (MEM_USAGE.has(ipKey)) MEM_USAGE.set(ipKey, Math.max(0, (MEM_USAGE.get(ipKey) || 0) - units));
  if (MEM_USAGE.has(gKey)) MEM_USAGE.set(gKey, Math.max(0, (MEM_USAGE.get(gKey) || 0) - units));
}

function clientIp(req) {
  const f = String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim();
  return f || String((req.socket && req.socket.remoteAddress) || 'unknown');
}

// 지금 이 요청을 한 사람의 이용권 (가입자는 구독 상태까지)
async function resolveSubject(req) {
  const s = readSession(req);
  if (s) {
    const r = await db.query(
      `SELECT u.id, u.phone, u.created_at, u.session_version, s.plan, s.status, s.current_period_end
         FROM ar_users u LEFT JOIN ar_subscriptions s ON s.user_id = u.id WHERE u.id = $1`,
      [s.uid]
    );
    const row = r.rows[0];
    if (row && Number(row.session_version) === Number(s.v || 1)) {
      const sub = effectiveSubscription(row, row);
      const active = isActive(sub);
      return {
        kind: 'user', subject: `u:${row.id}`, userId: row.id,
        tier: active ? sub.plan : 'free', createdAt: row.created_at,
        unlimitedAi: active && sub.comp === true && sub.unlimitedAi === true
      };
    }
  }
  const salt = String(process.env.AUTH_SECRET || '');
  const ipHash = crypto.createHash('sha256').update(salt + clientIp(req)).digest('hex').slice(0, 24);
  return { kind: 'anonymous', subject: `ip:${ipHash}`, userId: null, tier: 'anonymous' };
}

function isActive(row) {
  if (!row || !row.plan) return false;
  if (row.comp === true && row.plan === 'pro' && row.status === 'active') return true;
  if (!['active', 'past_due', 'canceling'].includes(row.status)) return false;
  return row.current_period_end && new Date(row.current_period_end).getTime() > Date.now();
}

// 전체 예산과 회원 한도를 한 트랜잭션에서 예약합니다.
async function consume(req, kind, units, options = {}) {
  if (kind === 'trends') return memConsume(req, kind, units);
  if (!['tts', 'ai', 'export'].includes(kind) || !Number.isSafeInteger(units) || units < 1) throw new Error('invalid_usage');
  const loginRequired = { ok: false, status: 401, body: { ok: false, error: 'login_required', message: 'AI 기능을 쓰려면 로그인해 주세요.' } };
  if (!readiness().serverMode) {
    if (process.env.VERCEL === '1') throw new Error('usage_not_configured');
    return loginRequired;
  }
  const who = await resolveSubject(req);
  if (who.kind !== 'user') return loginRequired;
  if (kind === 'tts' && options.requirePro && who.tier !== 'pro') {
    return { ok: false, status: 403, body: {
      ok: false, error: 'fish_pro_required', message: 'Fish Audio 성우는 프로 요금제에서 사용할 수 있습니다.'
    } };
  }
  return recordUsage(who, kind, units, options);
}

// 야간 작업은 등급에 관계없이 전용 인증과 전체 한도를 모두 확인합니다.
async function consumeNightlyMedia(req, kind, units) {
  const expected = process.env.NIGHTLY_MEDIA_TOKEN || '';
  const supplied = req.headers?.['x-autoreels-nightly-token'];
  const tokenFormat = /^[0-9a-f]{64}$/;
  if (req.method !== 'POST' || kind !== 'ai' || units !== 1
      || !['nightly-topics', 'nightly-scene-prompts'].includes(req.body?.mode)
      || typeof supplied !== 'string' || !tokenFormat.test(expected) || !tokenFormat.test(supplied)
      || !crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(supplied, 'hex'))) {
    return { ok: false, status: 403, body: { ok: false, error: 'nightly_media_forbidden' } };
  }
  if (!readiness().serverMode) throw new Error('usage_not_configured');
  return recordUsage({ kind: 'service', subject: 'nightly:media', tier: 'nightly' }, kind, units, {});
}

// 카카오 영상 분석기는 회원 세션 대신 용도가 제한된 별도 키를 사용합니다.
async function consumeReferenceStyle(req, kind, units) {
  const expected = process.env.REFERENCE_STYLE_WORKER_TOKEN || '';
  const supplied = req.headers?.['x-autoreels-style-token'];
  const tokenFormat = /^[0-9a-f]{64}$/;
  if (req.method !== 'POST' || kind !== 'ai' || units !== 1
      || req.body?.mode !== 'reference-style-worker'
      || typeof supplied !== 'string' || !tokenFormat.test(expected) || !tokenFormat.test(supplied)
      || !crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(supplied, 'hex'))) {
    return { ok: false, status: 403, body: { ok: false, error: 'style_worker_forbidden' } };
  }
  const { requestId, frames, timeline } = req.body;
  if (typeof requestId !== 'string' || !/^reference-[a-zA-Z0-9_-]{8,80}$/.test(requestId)) {
    return { ok: false, status: 400, body: { ok: false, error: 'invalid_style_request_id' } };
  }
  if (!readiness().serverMode) throw new Error('usage_not_configured');
  const signature = crypto.createHash('sha256').update(JSON.stringify({ frames, timeline })).digest('hex');
  return recordUsage({ kind: 'service', subject: 'style:reference', tier: 'style-worker' }, kind, units,
    { requestId, signature, rejectReplay: true });
}

async function recordUsage(who, kind, units, options) {
  const now = new Date();
  const freeGeneration = who.tier === 'free' && kind !== 'export';
  if (freeGeneration && !trialFor(who.createdAt, now).active) {
    return { ok: false, status: 403, body: { ok: false, error: 'trial_expired', message: '가입 후 7일 무료 AI 체험이 끝났어요.' } };
  }
  const L = limits()[who.tier] || limits().free;
  const month = monthKey(now);
  const period = who.kind === 'service' ? `d:${dayKey(now)}` : freeGeneration ? TRIAL_PERIOD : month;
  const col = kind === 'tts' ? 'tts_chars' : kind === 'export' ? 'exports' : 'ai_scripts';
  // 업종 10개 × 요청 2회와 같은 날 한 차례 재실행을 허용합니다.
  const cap = who.kind === 'service' ? 40 : kind === 'tts' ? L.ttsChars
    : kind === 'export' ? (L.exportPublishLimit === undefined ? 0 : L.exportPublishLimit)
    : who.unlimitedAi ? null : L.aiScripts;
  if (cap !== null && (!Number.isFinite(cap) || cap < 0)) throw new Error('invalid_usage_limit');
  const rejected = { ok: false, status: 429, body: { ok: false, error: 'quota_exceeded', kind, tier: who.tier,
    message: kind === 'export' ? '다운로드·게시 이용 횟수가 부족합니다. 내 계정에서 이용권을 확인해 주세요.' : '이번 이용 한도에 도달했습니다. 내 계정에서 사용량을 확인해 주세요.' } };
  const globalLimits = kind === 'ai'
    ? [[`d:${dayKey(now)}`, Number(process.env.AI_DAILY_UNIT_CAP || 2000)], [month, Number(process.env.AI_MONTHLY_UNIT_CAP || 20000)]]
    : kind === 'tts' ? [[month, Number(process.env.FISH_MONTHLY_CHAR_CAP || 2000000)]] : [];
  if (globalLimits.some(([, limit]) => !Number.isSafeInteger(limit) || limit < 1)) throw new Error('invalid_global_limit');
  const requestId = options.requestId;
  if (requestId !== undefined && (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(requestId))) throw new Error('invalid_request_id');
  const denied = gate => Object.assign(new Error('quota_rejected'), { gate });
  try {
    return await db.tx(async c => {
      if (requestId) {
        await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`usage:${who.subject}:${requestId}`]);
        const previous = await c.query('SELECT kind, result FROM ar_usage_requests WHERE subject = $1 AND request_id = $2', [who.subject, requestId]);
        if (previous.rows.length) {
          if (options.rejectReplay) throw denied({ok:false,status:409,body:{ok:false,error:'style_request_already_used',message:'이미 접수한 분석 작업입니다. 중복 분석하지 않습니다.'}});
          if (previous.rows[0].kind !== kind || (options.signature && previous.rows[0].result.signature !== options.signature)) throw denied({ok:false,status:409,body:{ok:false,error:'request_id_conflict',message:'이미 사용한 요청 번호입니다. 새 작업으로 다시 시도해 주세요.'}});
          if (previous.rows[0].result.refunded) throw denied({ok:false,status:409,body:{ok:false,error:'request_refunded',message:'실패한 발행입니다. 새 발행으로 다시 시도해 주세요.'}});
          return previous.rows[0].result;
        }
      }
      const add = async (subject, p, limit) => {
        if (limit !== null && units > limit) return null;
        const r = await c.query(
          `INSERT INTO ar_usage (subject, period, ${col}) VALUES ($1, $2, $3)
           ON CONFLICT (subject, period) DO UPDATE SET ${col} = ar_usage.${col} + EXCLUDED.${col}
             WHERE $4::bigint IS NULL OR ar_usage.${col} + EXCLUDED.${col} <= $4
           RETURNING ${col} AS used`, [subject, p, units, limit]);
        return r.rows[0] || null;
      };
      for (const [p, limit] of globalLimits) {
        if (!await add('global', p, limit)) throw denied({ ok: false, status: 429, body: { ok: false, error: 'service_budget_exceeded', message: '서비스 생성 한도에 도달했습니다. 잠시 후 다시 이용해 주세요.' } });
      }
      if (freeGeneration) {
        // 이전 월간 집계로 체험을 시작한 회원의 사용량을 한 번만 이관합니다.
        await c.query(
          `INSERT INTO ar_usage (subject, period, tts_chars, ai_scripts)
           SELECT $1, $2, COALESCE(SUM(tts_chars), 0), COALESCE(SUM(ai_scripts), 0)
             FROM ar_usage WHERE subject = $1 AND period = ANY($3::text[])
           ON CONFLICT (subject, period) DO NOTHING`,
          [who.subject, TRIAL_PERIOD, legacyTrialPeriods(who.createdAt, now)]
        );
      }
      const r = await add(who.subject, period, cap);
      if (!r) throw denied(rejected);
      const result = { ok: true, used: r.used, cap, tier: who.tier, requestId, signature: options.signature || null, expectedJobs: options.expectedJobs || null, accounting: { subject: who.subject, period, globalPeriods: globalLimits.map(([p]) => p) } };
      if (requestId) await c.query('INSERT INTO ar_usage_requests (subject, request_id, kind, result) VALUES ($1, $2, $3, $4)', [who.subject, requestId, kind, JSON.stringify(result)]);
      return result;
    });
  } catch (e) {
    if (e.gate) return e.gate;
    throw e;
  }
}

async function refundUsage(req, kind, units, gate) {
  if (kind === 'trends' || (gate && gate.memoryFallback)) return memRefund(req, kind, units);
  if (!readiness().serverMode) return memRefund(req, kind, units);
  try {
    const who = gate && gate.accounting ? null : await resolveSubject(req);
    const a = (gate && gate.accounting) || { subject: who.subject, period: who.kind === 'anonymous' ? `d:${dayKey()}` : monthKey(), globalPeriods: [] };
    const col = kind === 'tts' ? 'tts_chars' : kind === 'export' ? 'exports' : 'ai_scripts';
    await db.tx(async c => {
      if (gate && gate.requestId) {
        await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`usage:${a.subject}:${gate.requestId}`]);
        const saved = await c.query('SELECT kind, result FROM ar_usage_requests WHERE subject = $1 AND request_id = $2', [a.subject, gate.requestId]);
        if (!saved.rows.length || saved.rows[0].result.refunded) return;
        await c.query("UPDATE ar_usage_requests SET result = jsonb_set(result, '{refunded}', 'true') WHERE subject = $1 AND request_id = $2", [a.subject, gate.requestId]);
      }
      for (const p of a.globalPeriods) await c.query(`UPDATE ar_usage SET ${col} = GREATEST(0, ${col} - $3) WHERE subject = $1 AND period = $2`, ['global', p, units]);
      await c.query(`UPDATE ar_usage SET ${col} = GREATEST(0, ${col} - $3) WHERE subject = $1 AND period = $2`, [a.subject, a.period, units]);
    });
    return true;
  } catch (e) { console.error('[usage] refund failed:', e.code || 'database_error'); return false; }
}

async function usageFor(user, tier, subscription) {
  const now = new Date();
  const trial = tier === 'free' ? trialFor(user.created_at, now) : null;
  const period = trial ? TRIAL_PERIOD : monthKey(now);
  const periods = trial?.active ? [period, ...legacyTrialPeriods(user.created_at, now)] : [period];
  const r = await db.query(
    'SELECT period, tts_chars, ai_scripts, exports FROM ar_usage WHERE subject = $1 AND period = ANY($2::text[])',
    [`u:${user.id}`, periods]
  );
  const L = limits()[tier] || limits().free;
  const row = r.rows.find(row => row.period === period) || r.rows.reduce((total, row) => ({
    tts_chars: total.tts_chars + row.tts_chars,
    ai_scripts: total.ai_scripts + row.ai_scripts,
    exports: total.exports + row.exports
  }), { tts_chars: 0, ai_scripts: 0, exports: 0 });
  return {
    ttsChars: row.tts_chars,
    ttsLimit: L.ttsChars,
    aiScripts: row.ai_scripts,
    aiLimit: tier === 'pro' && subscription?.comp === true && subscription.unlimitedAi === true ? null : L.aiScripts,
    exports: row.exports || 0,
    exportLimit: L.exportPublishLimit === undefined ? 0 : L.exportPublishLimit,
    period,
    trial
  };
}

module.exports = { consume, consumeNightlyMedia, consumeReferenceStyle, refundUsage, usageFor, trialFor, isActive, resolveSubject, monthKey, isSameSiteRequest };
