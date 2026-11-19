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
    return {start:row.start,end,accent:row.accent,position:row.position,caption:''};
  });
}
async function submit(user, input, id) {
  const url = videoURL(input);
  if (!uuid.test(id)) throw error(400,'요청 번호를 확인해 주세요.');
  return db.tx(async client => {
    await client.query('SELECT id FROM ar_users WHERE id=$1 FOR UPDATE',[user.id]);
    const {rows} = await client.query("SELECT id,url,status FROM ar_private_remix WHERE user_id=$1 AND expires_at>now() AND (id=$2 OR status IN ('queued','running')) ORDER BY (id=$2) DESC LIMIT 1",[user.id,id]);
    if (rows.length) {
      if (rows[0].id === id || rows[0].url === url) return {id:rows[0].id,status:rows[0].status};
      throw error(409,'앞서 요청한 영상의 분석이 끝나면 새 링크를 넣을 수 있어요.');
    }
    const recent = await client.query("SELECT count(*) AS n FROM ar_private_remix WHERE user_id=$1 AND created_at>now()-interval '1 hour'",[user.id]);
    if (Number(recent.rows[0].n)>=12) throw error(429,'분석 요청이 많아요. 잠시 후 다시 시도해 주세요.');
    await client.query("INSERT INTO ar_private_remix (id,user_id,url) VALUES ($1,$2,$3)",[id,user.id,url]);
    return {id,status:'queued'};
  });
}
async function status(user, id) {
  if (!uuid.test(id)) throw error(404,'분석 요청을 찾을 수 없어요.');
  const {rows} = await db.query('SELECT status,scenes FROM ar_private_remix WHERE id=$1 AND user_id=$2 AND expires_at>now()',[id,user.id]);
  if (!rows.length) throw error(404,'분석 요청이 만료됐거나 찾을 수 없어요.');
  return rows[0];
}
async function worker(body) {
  if (body.op === 'claim') {
    await db.query('DELETE FROM ar_private_remix WHERE expires_at<=now()');
    const lease = crypto.randomUUID();
    const {rows} = await db.query(`UPDATE ar_private_remix SET status='running',lease=$1,leased_at=now(), attempts=attempts+1
      WHERE id=(SELECT id FROM ar_private_remix WHERE expires_at>now() AND
        (status='queued' OR (status='running' AND leased_at<now()-interval '8 minutes' AND attempts<2))
        ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id,url,lease`,[lease]);
    await db.query("UPDATE ar_private_remix SET status='failed',url=NULL,lease=NULL WHERE status='running' AND attempts>=2 AND leased_at<now()-interval '8 minutes'");
    return {job:rows[0] || null};
  }
  if (body.op !== 'complete' || !uuid.test(body.id) || !uuid.test(body.lease)) throw error(400,'잘못된 작업 요청');
  const scenes = body.failed === true ? null : checkedScenes(body.scenes);
  await db.query("UPDATE ar_private_remix SET status=$3,scenes=$4,url=NULL,lease=NULL WHERE id=$1 AND lease=$2 AND status='running' AND expires_at>now()",[body.id,body.lease,scenes ? 'done':'failed',scenes && JSON.stringify(scenes)]);
  return {ok:true};
}
module.exports = {videoURL, verifyWorker, submit, status, worker};
