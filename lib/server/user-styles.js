'use strict';

const db = require('./db');

function fail(code, status, message) {
  throw Object.assign(new Error(message), { code, status });
}

function validateStyles(styles, limit = 5) {
  if (!Array.isArray(styles) || styles.length > limit) {
    fail('invalid_styles', 400, `스타일은 ${limit}개까지 저장할 수 있어요.`);
  }
  const ids = new Set();
  return styles.map(style => {
    const { id, name, baseStyleId, fontKey, colors, caption, logo } = style || {};
    const hex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
    if (typeof id !== 'string' || !/^custom:[a-z0-9-]{8,64}$/.test(id) || ids.has(id) ||
        typeof name !== 'string' || !name.trim() || name.length > 24 ||
        !['in_x_cover', 'in_h_plaque', 'in_card_news'].includes(baseStyleId) ||
        !['maru', 'pretM', 'pen'].includes(fontKey) || !hex(colors?.primary) || !hex(colors?.accent) ||
        !['top', 'middle', 'bottom'].includes(caption?.position) ||
        !Number.isFinite(caption?.sizeRatio) || caption.sizeRatio < 0.045 || caption.sizeRatio > 0.085 ||
        !['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(logo?.corner) ||
        (logo.dataUrl != null && (typeof logo.dataUrl !== 'string' || logo.dataUrl.length > 180000 || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(logo.dataUrl)))) {
      fail('invalid_styles', 400, '스타일 이름, 디자인이나 로고 설정을 확인해 주세요.');
    }
    ids.add(id);
    return { id, name: name.trim(), baseStyleId, fontKey,
      colors: { primary: colors.primary, accent: colors.accent },
      caption: { position: caption.position, sizeRatio: caption.sizeRatio },
      logo: { dataUrl: logo.dataUrl || null, corner: logo.corner, widthRatio: 0.12 }, pinned: true };
  });
}

async function list(user) {
  const result = await db.query('SELECT styles, revision FROM ar_user_styles WHERE user_id=$1', [user.id]);
  return result.rows[0] || { styles: [], revision: 0 };
}

async function save(user, body) {
  if (body.accountId !== String(user.id)) fail('style_account_changed', 409, '로그인 계정이 바뀌었어요. 새로고침한 뒤 다시 시도해 주세요.');
  const revision = body.revision;
  if (!Number.isSafeInteger(revision) || revision < 0) fail('invalid_styles', 400, '스타일 목록을 다시 열어 주세요.');
  const styles = JSON.stringify(validateStyles(body.styles));
  const result = revision === 0
    ? await db.query('INSERT INTO ar_user_styles(user_id, styles) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING RETURNING styles, revision', [user.id, styles])
    : await db.query('UPDATE ar_user_styles SET styles=$2, revision=revision+1 WHERE user_id=$1 AND revision=$3 RETURNING styles, revision', [user.id, styles, revision]);
  if (!result.rows.length) fail('style_conflict', 409, '다른 기기에서 스타일을 변경했어요. 최신 목록을 불러왔으니 확인하고 다시 시도해 주세요.');
  return result.rows[0];
}

module.exports = { list, save, validateStyles };
