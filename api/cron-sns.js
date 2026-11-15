'use strict';
// GET /api/cron-sns — 예약 발행 실행 및 처리 중인 SNS 업로드 마무리
const crypto = require('node:crypto');
const sns = require('../lib/server/sns');
const { readiness } = require('../lib/server/config');
const trends = require('./trends');

async function refreshStaleTrends() {
  const keys = Object.keys(trends.INDUSTRY_QUERIES || {});
  const updated = {};
  for (const k of keys) {
    try {
      const cached = await trends.readTrendCache(k, 20);
      if (cached) { updated[k] = 'cached'; continue; }
      const { source, query, items } = await trends.fetchTrendsForIndustry(k, '');
      if (items && items.length) {
        await trends.writeTrendCache(k, source, query, items);
      }
      updated[k] = `${source}:${items ? items.length : 0}`;
    } catch (e) {
      updated[k] = `err:${e.message}`;
    }
  }
  return updated;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const secret = String(process.env.CRON_SECRET || '');
    const auth = String(req.headers.authorization || '');
    if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return res.status(401).json({ ok: false });
    if (!readiness().serverMode) return res.status(200).json({ ok: true, skipped: 'server_mode_off' });
    const out = await sns.runScheduledAndPending();
    const trendRefresh = await refreshStaleTrends();
    console.log('[cron-sns]', JSON.stringify({ ...out, trendRefresh }));
    return res.status(200).json({ ok: true, ...out, trendRefresh });
  } catch (e) {
    console.error('[cron-sns]', e.code || '', e.message);
    return res.status(Number(e.status) || 500).json({ ok: false, error: e.code || 'server_error', message: e.message });
  }
};
