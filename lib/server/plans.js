'use strict';
// 요금제와 사용량 한도.
// 성우(Fish Audio)는 쓸수록 돈이 나가므로 글자 수로 한도를 둡니다 (한국어 1글자 ≈ 3바이트).
// 한도는 환경변수 PLAN_LIMITS_JSON 으로 바꿀 수 있습니다.

const PLANS = {
  standard: { key: 'standard', name: '스탠다드', amount: 29900, periodMonths: 1, label: '매달 자동 결제 · 다운로드·게시 20회' },
  pro: { key: 'pro', name: '프로 무제한', amount: 59000, periodMonths: 1, label: '매달 자동 결제 · 다운로드·게시 무제한' }
};

const FREE_TRIAL_DAYS = 7;

// 무료 회원은 가입 후 7일 전체에 한 번, 유료 회원은 매달 적용합니다.
const DEFAULT_LIMITS = {
  // 로그인 안 한 방문자: 하루 기준 (IP 단위) — 여러 업종·대본을 충분히 체험 가능하게 여유 확보
  anonymous: { ttsCharsDaily: 3000, aiScriptsDaily: 30, exportPublishLimit: 0 },
  // 가입 후 7일간 제공하는 총 이용량
  free: { ttsChars: 10000, aiScripts: 30, exportPublishLimit: 0 },
  standard: { ttsChars: 120000, aiScripts: 600, exportPublishLimit: 20 },
  pro: { ttsChars: 500000, aiScripts: 3000, exportPublishLimit: null }
};

function limits(env = process.env) {
  try {
    const override = JSON.parse(env.PLAN_LIMITS_JSON || '{}');
    const out = {};
    for (const k of Object.keys(DEFAULT_LIMITS)) out[k] = { ...DEFAULT_LIMITS[k], ...(override[k] || {}) };
    return out;
  } catch (e) {
    return DEFAULT_LIMITS;
  }
}

function addPeriod(from, plan) {
  const p = PLANS[plan];
  const d = new Date(from.getTime());
  if (!p) throw new Error('unknown plan');
  if (p.periodDays) d.setUTCDate(d.getUTCDate() + p.periodDays);
  else d.setUTCMonth(d.getUTCMonth() + p.periodMonths);
  return d;
}

function publicPlans() {
  return Object.values(PLANS).map((p) => ({ key: p.key, name: p.name, amount: p.amount, label: p.label }));
}

module.exports = { FREE_TRIAL_DAYS, PLANS, limits, addPeriod, publicPlans };
