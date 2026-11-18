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
  INSERT INTO ar_specialty_trends (industry, specialty_key, attempted_day, last_result)
  SELECT industry, specialty_key, day, 'started' FROM candidates
  ON CONFLICT (industry, specialty_key) DO UPDATE SET attempted_day = EXCLUDED.attempted_day, last_result = 'started'
  WHERE ar_specialty_trends.attempted_day IS DISTINCT FROM EXCLUDED.attempted_day
  RETURNING industry, specialty_key, attempted_day::text AS attempted_day`;

async function refreshSpecialtyTrends(fetchVideos) {
  const search = fetchVideos || (await import('../../scripts/trend-youtube.mjs')).fetchPublicYoutube;
  const { rows } = await db.query(CLAIM, [DAILY_LIMIT]);
  let collected = 0;
  let failed = 0;
  for (let start = 0; start < rows.length; start += PARALLEL) {
    await Promise.all(rows.slice(start, start + PARALLEL).map(async row => {
      const specialty = normalizeSpecialty(row.specialty_key);
      let result = 'failed';
      let keywords = [];
      try {
        if (specialty && Object.hasOwn(labels, row.industry)) {
          const items = await search(specialty + ' ' + labels[row.industry] + ' 쇼츠');
          keywords = extractKeywords(specialty, items);
          result = keywords.length ? 'collected' : 'empty';
        }
      } catch (_) {
        result = 'failed';
      }
      await db.query(`
        UPDATE ar_specialty_trends SET last_result = $3,
          keywords = CASE WHEN $3 = 'collected' THEN $4::jsonb ELSE keywords END,
          updated_at = CASE WHEN $3 = 'collected' THEN now() ELSE updated_at END
        WHERE industry = $1 AND specialty_key = $2 AND attempted_day = $5`,
      [row.industry, row.specialty_key, result, JSON.stringify(keywords), row.attempted_day]);
      if (result === 'collected') collected++;
      if (result === 'failed') failed++;
    }));
  }
  await db.query("DELETE FROM ar_specialty_trends WHERE attempted_day < timezone('Asia/Seoul', now())::date - 30");
  return { attempted: rows.length, collected, failed };
}

async function readAdminSpecialties(industry, offset) {
  const summary = await db.query(`
    SELECT count(*)::int AS accounts,
      count(*) FILTER (WHERE specialty <> '')::int AS configured,
      count(DISTINCT (industry, lower(specialty))) FILTER (WHERE specialty <> '')::int AS specialties
    FROM ar_users`);
  const rows = await db.query(`
    WITH active AS (
      SELECT industry, lower(specialty) AS specialty_key, min(specialty) AS specialty, count(*)::int AS accounts
      FROM ar_users WHERE specialty <> '' AND ($1 = '' OR industry = $1)
      GROUP BY industry, lower(specialty)
    )
    SELECT active.industry, active.specialty, active.accounts, trends.attempted_day::text AS attempted_day,
      trends.last_result, trends.keywords, trends.updated_at,
      (trends.updated_at > now() - interval '3 days') AS fresh
    FROM active LEFT JOIN ar_specialty_trends trends USING (industry, specialty_key)
    ORDER BY active.accounts DESC, active.industry, active.specialty_key
    LIMIT 31 OFFSET $2`, [industry, offset]);
  const runs = await db.query(`
    SELECT run_date::text AS run_date, status, started_at, finished_at, attempted, collected, failed
    FROM ar_specialty_trend_runs ORDER BY run_date DESC LIMIT 1`);
  return { summary: summary.rows[0], rows: rows.rows.slice(0, 30), hasNext: rows.rows.length > 30, lastRun: runs.rows[0] || null };
}

async function runScheduledSpecialtyTrends(fetchVideos) {
  const claimed = await db.query(`
    INSERT INTO ar_specialty_trend_runs (run_date)
    VALUES (timezone('Asia/Seoul', now())::date)
    ON CONFLICT (run_date) DO UPDATE
      SET status = 'running', started_at = now(), finished_at = NULL
      WHERE ar_specialty_trend_runs.status = 'failed'
         OR (ar_specialty_trend_runs.status = 'running' AND ar_specialty_trend_runs.started_at < now() - interval '2 minutes')
    RETURNING run_date::text AS day`);
  if (!claimed.rows.length) return { skipped: true };
  const day = claimed.rows[0].day;
  try {
    const result = await refreshSpecialtyTrends(fetchVideos);
    await db.query(`
      UPDATE ar_specialty_trend_runs SET status = 'complete', finished_at = now(),
        attempted = $2, collected = $3, failed = $4 WHERE run_date = $1`,
    [day, result.attempted, result.collected, result.failed]);
    return result;
  } catch (error) {
    await db.query("UPDATE ar_specialty_trend_runs SET status = 'failed', finished_at = now() WHERE run_date = $1", [day]);
    throw error;
  }
}

module.exports = { readSpecialtyTrends, refreshSpecialtyTrends, readAdminSpecialties, runScheduledSpecialtyTrends };
