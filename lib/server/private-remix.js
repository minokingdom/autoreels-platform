'use strict';
const crypto = require('node:crypto');
const db = require('./db');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function error(status, message) { return Object.assign(new Error(message), {status}); }

// 작업기 비밀값은 Windows 사용자 자격 증명으로 보관하고, 서버에는 단방향 검증값만 둡니다.
function verifyWorker(header) {
  if (typeof header !== 'string' || !/^Bearer [A-Za-z0-9+/]{43}=$/.test(header)) return false;
  const actual = crypto.createHash('sha256').update(header.slice(7)).digest();
  return crypto.timingSafeEqual(actual, Buffer.from('975b61cc28f2ebba774e8c9d25a03c4a3cf65313ded79d81febf701481e0da17', 'hex'));
}
function videoURL(input) {
  const bad = () => error(400,'공개 쇼츠·릴스·틱톡 영상 또는 CapCut 템플릿 링크 하나를 넣어 주세요.');
  if (typeof input !== 'string' || input.length > 5000) throw bad();
  const matches = input.match(/https?:\/\/[^\s<>"\u200b]+/g);
  if (matches?.length !== 1) throw bad();
  let u;
  try { u = new URL(matches[0].replace(/[.,!?\])}〉》”’]+$/u,'')); } catch { throw bad(); }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) throw bad();
  const host = u.hostname, path = u.pathname;
  if (['youtu.be','youtube.com','www.youtube.com','m.youtube.com'].includes(host)) {
    const id = host === 'youtu.be' ? path.slice(1) : path === '/watch' ? u.searchParams.get('v') : path.match(/^\/(?:shorts|embed)\/([\w-]+)\/?$/)?.[1];
    if (id && /^[\w-]{11}$/.test(id)) return 'https://www.youtube.com/watch?v='+id;
  }
  if (['instagram.com','www.instagram.com'].includes(host) && /^\/(?:reels?|p)\/[\w-]{1,60}\/?$/.test(path)) return 'https://www.instagram.com'+path.replace('/reels/','/reel/').replace(/\/?$/,'/');
  if (['capcut.com','www.capcut.com'].includes(host)) {
    const id = path.match(/^\/template-detail\/(?:[\w%~-]+\/)?(\d{10,24})\/?$/)?.[1];
    if (id) return 'https://www.capcut.com/template-detail/'+id;
    if (/^\/tv2\/[A-Za-z0-9]{5,40}\/?$/.test(path)) return 'https://www.capcut.com'+path.replace(/\/?$/,'/');
  }
  if (['www.tiktok.com','tiktok.com'].includes(host) && /^\/@[\w.-]+\/video\/\d{10,24}\/?$/.test(path)) return 'https://www.tiktok.com'+path;
  if (['vm.tiktok.com','vt.tiktok.com'].includes(host) && /^\/[A-Za-z0-9]{4,24}\/?$/.test(path)) return u.origin+path;
  throw bad();
}
function checkedScenes(rows) {
  let end = 0;
  if (!Array.isArray(rows) || !rows.length || rows.length > 10) throw error(400,'잘못된 장면 수');
  return rows.map(row => {
    if (!row || row.start !== end || !Number.isInteger(row.end) || row.end <= end || row.end > 2700 ||
      !/^#[\da-f]{6}$/i.test(row.accent) || !['top','bottom'].includes(row.position)) throw error(400,'잘못된 장면 분석 결과');
    end = row.end;
    const screen = String(row.screen || '').slice(0,600);
    const speech = String(row.speech || '').slice(0,600);
    return {start:row.start,end,accent:row.accent,position:row.position,screen,speech,caption:(screen.split(' / ')[0] || speech).slice(0,56)};
  });
}
async function submit(user, input, id, sourceId, change) {
  const adapt = sourceId !== undefined;
  const url = adapt ? null : videoURL(input);
  const instruction = typeof change === 'string' ? change.trim() : '';
  if (adapt && (!uuid.test(sourceId) || !instruction || instruction.length>240)) throw error(400,'바꿀 주제나 내용을 한 줄로 입력해 주세요.');
  if (!uuid.test(id)) throw error(400,'요청 번호를 확인해 주세요.');
  return db.tx(async client => {
    await client.query('SELECT id FROM ar_users WHERE id=$1 FOR UPDATE',[user.id]);
    if (adapt) {
      const original = await client.query("SELECT 1 FROM ar_private_remix WHERE id=$1 AND user_id=$2 AND source_id IS NULL AND status='done' AND expires_at>now()",[sourceId,user.id]);
      if (!original.rows.length) throw error(404,'원본 분석이 만료됐거나 찾을 수 없어요.');
    }
    const {rows} = await client.query("SELECT id,url,status,source_id,requested_change FROM ar_private_remix WHERE user_id=$1 AND expires_at>now() AND (id=$2 OR status IN ('queued','running')) ORDER BY (id=$2) DESC LIMIT 1",[user.id,id]);
    if (rows.length) {
      if (rows[0].id === id || (adapt ? rows[0].source_id === sourceId && rows[0].requested_change === instruction : rows[0].url === url)) return {id:rows[0].id,status:rows[0].status};
      throw error(409,'앞서 요청한 영상의 분석이 끝나면 새 링크를 넣을 수 있어요.');
    }
    const recent = await client.query("SELECT count(*) AS n FROM ar_private_remix WHERE user_id=$1 AND created_at>now()-interval '1 hour'",[user.id]);
    if (Number(recent.rows[0].n)>=12) throw error(429,'분석 요청이 많아요. 잠시 후 다시 시도해 주세요.');
    await client.query("INSERT INTO ar_private_remix (id,user_id,url,source_id,requested_change) VALUES ($1,$2,$3,$4,$5)",[id,user.id,url,sourceId || null,adapt ? instruction : null]);
    return {id,status:'queued'};
  });
}
async function status(user, id) {
  if (!uuid.test(id)) throw error(404,'분석 요청을 찾을 수 없어요.');
  const {rows} = await db.query('SELECT status,scenes,context,draft,source_id FROM ar_private_remix WHERE id=$1 AND user_id=$2 AND expires_at>now()',[id,user.id]);
  if (!rows.length) throw error(404,'분석 요청이 만료됐거나 찾을 수 없어요.');
  return rows[0];
}
async function worker(body) {
  if (body.op === 'claim') {
    await db.query("DELETE FROM ar_private_remix s WHERE s.expires_at<=now() AND NOT EXISTS (SELECT 1 FROM ar_private_remix child WHERE child.source_id=s.id AND child.expires_at>now() AND child.status IN ('queued','running'))");
    const lease = crypto.randomUUID();
    const {rows} = await db.query(`WITH claimed AS (UPDATE ar_private_remix SET status='running',lease=$1,leased_at=now(), attempts=attempts+1
      WHERE id=(SELECT id FROM ar_private_remix WHERE expires_at>now() AND
        (status='queued' OR (status='running' AND leased_at<now()-interval '15 minutes' AND attempts<2))
        ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id,user_id,url,lease,source_id,requested_change)
      SELECT c.id,c.url,c.lease,c.source_id,c.requested_change,s.context,s.scenes
      FROM claimed c LEFT JOIN ar_private_remix s ON s.id=c.source_id AND s.user_id=c.user_id`,[lease]);
    await db.query("UPDATE ar_private_remix SET status='failed',url=NULL,lease=NULL WHERE status='running' AND attempts>=2 AND leased_at<now()-interval '15 minutes'");
    return {job:rows[0] || null};
  }
  if (body.op !== 'complete' || !uuid.test(body.id) || !uuid.test(body.lease)) throw error(400,'잘못된 작업 요청');
  const draft = body.draft;
  if (draft && (!Array.isArray(draft) || draft.length<1 || draft.length>10 || !draft.some(t=>typeof t==='string' && t.trim()) || !draft.every(t=>typeof t==='string' && t.length<=56))) throw error(400,'잘못된 대본');
  const scenes = body.failed || draft ? null : checkedScenes(body.scenes);
  const context = scenes ? {topic:String(body.context?.topic || '').slice(0,140),title:String(body.context?.title || '').slice(0,160)} : null;
  await db.query("UPDATE ar_private_remix SET status=$3,scenes=$4,context=$5,draft=$6,url=NULL,lease=NULL,requested_change=NULL WHERE id=$1 AND lease=$2 AND status='running' AND expires_at>now()",[body.id,body.lease,body.failed ? 'failed':'done',scenes && JSON.stringify(scenes),context && JSON.stringify(context),draft ? JSON.stringify(draft) : null]);
  return {ok:true};
}
module.exports = {videoURL, verifyWorker, submit, status, worker};
