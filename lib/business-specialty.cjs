'use strict';

function normalizeSpecialty(value) {
  if (typeof value !== 'string') return null;
  const label = value.normalize('NFKC').replace(/\s+/gu, ' ').trim();
  if (!label) return '';
  if (label.length > 36 || !/^[\p{L}\p{N} ·&(),+/-]+$/u.test(label) ||
      !/\p{L}/u.test(label) || /\d(?:[ -]*\d){5}/u.test(label)) return null;
  return label;
}

module.exports = { normalizeSpecialty };
