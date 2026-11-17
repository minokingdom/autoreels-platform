'use strict';
// 공급자 호출 전에 사용량을 예약합니다. 조회 실패 시 비용 발생 요청을 차단합니다.
const { consume, refundUsage, isSameSiteRequest } = require('./usage');

function withMeter(handler, kind, unitsOf) {
  return async function metered(req, res) {
    if (req.method === 'OPTIONS') return handler(req, res);
    if (!isSameSiteRequest(req)) return res.status(403).json({ ok: false, error: 'forbidden_origin' });
    let units;
    try {
      units = Number(unitsOf(req));
      if (!Number.isFinite(units) || units < 0) throw new Error('invalid_units');
      units = Math.ceil(units);
    } catch (_) {
      return res.status(400).json({ ok: false, error: 'invalid_request' });
    }
    let gate;
    if (units > 0) {
      try {
        gate = await consume(req, kind, units);
        if (!gate.ok) {
          res.setHeader('Cache-Control', 'no-store');
          return res.status(gate.status).json(gate.body);
        }
      } catch (e) {
        console.error('[meter] usage unavailable:', e.code || 'database_error');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(503).json({ ok: false, error: 'usage_unavailable', message: '사용량을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
      }
    }
    let failed = false;
    const status = res.status.bind(res), json = res.json.bind(res);
    res.status = code => { if (code >= 400) failed = true; return status(code); };
    res.json = body => { if (body && body.ok === false) failed = true; return json(body); };
    try {
      return await handler(req, res);
    } catch (e) {
      failed = true;
      throw e;
    } finally {
      if (gate && !gate.skipped && failed) await refundUsage(req, kind, units, gate);
    }
  };
}
module.exports = { withMeter };
