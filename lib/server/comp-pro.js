'use strict';
const { readiness } = require('./config');

function normalizePhone(value) {
  return String(value == null ? '' : value).replace(/\D/g, '');
}

function hasCompProConfig(env = process.env) {
  return Boolean(String(env.COMP_PRO_PHONES || '').trim() || String(env.COMP_PRO_USER_IDS || '').trim());
}

function hasUserId(list, userId) {
  return String(list || '').split(/[,\s]+/).includes(String(userId));
}

function isCompPro(user, env = process.env) {
  if (!readiness(env).serverMode || !user || !user.id) return false;
  if (hasUserId(env.COMP_PRO_USER_IDS, user.id)) return true;
  const phone = normalizePhone(user.phone);
  if (!phone) return false;
  return String(env.COMP_PRO_PHONES || '').split(/[,\s]+/).some((entry) => normalizePhone(entry) === phone);
}

// 결제·구독 기록은 건드리지 않고, 서버에서 읽을 때만 이용 권한을 덮어씁니다.
function effectiveSubscription(user, subscription, env = process.env) {
  if (!isCompPro(user, env)) return subscription;
  return {
    plan: 'pro', status: 'active', comp: true, label: '무상 PRO (운영자)',
    unlimitedAi: hasUserId(env.COMP_PRO_UNLIMITED_AI_USER_IDS, user.id),
    current_period_end: null, cancel_at_period_end: false, retry_count: 0
  };
}

module.exports = { normalizePhone, hasCompProConfig, isCompPro, effectiveSubscription };
