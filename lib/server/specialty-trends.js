'use strict';

const db = require('./db');
const { normalizeSpecialty } = require('../business-specialty.cjs');

const DAILY_LIMIT = 32;
const PARALLEL = 8;
const labels = {
  auto: '자동차', restaurant: '음식점 메뉴', cafe: '카페 메뉴', beauty: '뷰티',
  realestate: '부동산', academy: '학원', clinic: '진료 안내', fitness: '운동',
  shop: '상품', interior: '시공'
};

async function readSpecialtyTrends(industry, specialty) {
  const result = await db.query(
    "SELECT keywords, updated_at FROM ar_specialty_trends WHERE industry = $1 AND specialty_key = lower($2) AND updated_at > now() - interval '3 days'",
    [industry, specialty]
  );
  return result.rows[0] || null;
}

function extractKeywords(specialty, items) {
  const compact = text => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const full = compact(specialty);
  const aliases = {
    남성: ['남성', '남자'], 남자: ['남자', '남성'],
    여성: ['여성', '여자'], 여자: ['여자', '여성'],
    미용실: ['미용실', '헤어', '커트', '다운펌', '바버샵'],
    중식당: ['중식당', '중식', '중국집', '짜장면', '짬뽕'],
    중국집: ['중국집', '중식', '짜장면', '짬뽕'],
    태국: ['태국', '팟타이', '똠얌꿍', '팟카파오']
  };
  const terms = specialty.toLowerCase().split(/[^\p{L}\p{N}]+/u)
    .map(term => term.replace(/(음식점|전문점|전문|전용|병원|학원|식당|메뉴)$/u, ''))
    .filter(term => term.length >= 2);
  return [...new Set(items.map(item => String(item.title || '').replace(/\s+/g, ' ').trim().slice(0, 90))
    .filter(title => {
      const value = compact(title);
      return value.includes(full) || (terms.length > 0 && terms.every(term =>
        (Object.hasOwn(aliases, term) ? aliases[term] : [term]).some(word => value.includes(word))));
    }))].slice(0, 8);
}

// 같은 세부 업종은 한 번만 검색하고, 겹쳐 실행되어도 같은 한국 날짜에 중복 예약하지 않습니다.
const CLAIM = `
  WITH kst AS (SELECT timezone('Asia/Seoul', now())::date AS day),
  active AS (
    SELECT DISTINCT industry, lower(specialty) AS specialty_key
    FROM ar_users WHERE specialty <> ''
  ), candidates AS (
    SELECT active.*, kst.day FROM active LEFT JOIN ar_specialty_trends USING (industry, specialty_key)
    CROSS JOIN kst WHERE attempted_day IS DISTINCT FROM kst.day
    ORDER BY attempted_day NULLS FIRST, industry, specialty_key
    LIMIT $1
  )
  INSERT INTO ar_specialty_trends (industry, specialty_key, attempted_day)
  SELECT industry, specialty_key, day FROM candidates
  ON CONFLICT (industry, specialty_key) DO UPDATE SET attempted_day = EXCLUDED.attempted_day
  WHERE ar_specialty_trends.attempted_day IS DISTINCT FROM EXCLUDED.attempted_day
  RETURNING industry, specialty_key`;

async function refreshSpecialtyTrends(fetchVideos) {
  const search = fetchVideos || (await import('../../scripts/trend-youtube.mjs')).fetchPublicYoutube;
  const { rows } = await db.query(CLAIM, [DAILY_LIMIT]);
  let collected = 0;
  let failed = 0;
  for (let start = 0; start < rows.length; start += PARALLEL) {
    await Promise.all(rows.slice(start, start + PARALLEL).map(async row => {
      const specialty = normalizeSpecialty(row.specialty_key);
      if (!specialty || !Object.hasOwn(labels, row.industry)) return;
      try {
        const items = await search(specialty + ' ' + labels[row.industry] + ' 쇼츠');
        const keywords = extractKeywords(specialty, items);
        if (!keywords.length) return;
        await db.query(
          'UPDATE ar_specialty_trends SET keywords = $3::jsonb, updated_at = now() WHERE industry = $1 AND specialty_key = $2',
          [row.industry, row.specialty_key, JSON.stringify(keywords)]
        );
        collected++;
      } catch (_) {
        failed++;
      }
    }));
  }
  await db.query("DELETE FROM ar_specialty_trends WHERE attempted_day < timezone('Asia/Seoul', now())::date - 30");
  return { attempted: rows.length, collected, failed };
}

module.exports = { readSpecialtyTrends, refreshSpecialtyTrends };
