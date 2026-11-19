'use strict';
const db=require('./db');
const crypto=require('node:crypto');
const { validateStyles } = require('./user-styles');
const MAX_BYTES=2000000;
function fail(code,status,message) { throw Object.assign(new Error(message),{code,status}); }
function validate(snapshot) {
  const raw=JSON.stringify(snapshot);
  if(!raw || Buffer.byteLength(raw)>MAX_BYTES) fail('project_size',413,'프로젝트는 사진 포함 2MB까지 저장할 수 있습니다. 사진 크기를 줄여 주세요.');
  if(snapshot.version!==1 || !snapshot.campaign || !Array.isArray(snapshot.photos) || snapshot.photos.length>32) fail('invalid_project',400,'프로젝트 형식이 올바르지 않습니다.');
  if(!['auto','restaurant','cafe','beauty','realestate','academy','clinic','fitness','shop','interior','personal'].includes(snapshot.industry)) fail('invalid_project',400,'제작 유형을 확인해 주세요.');
  if(snapshot.campaign.cutCountOverride!=null && (!Number.isInteger(snapshot.campaign.cutCountOverride)||snapshot.campaign.cutCountOverride<1||snapshot.campaign.cutCountOverride>12)) fail('invalid_project',400,'컷 수를 확인해 주세요.');
  for(const k of ['cutCaptions','ttsLines','scenePlan']) if(!Array.isArray(snapshot.campaign[k])||snapshot.campaign[k].length>12) fail('invalid_project',400,'컷 정보를 확인해 주세요.');
  const walk=(v,depth=0)=>{
    if(depth>18) fail('invalid_project',400,'편집 정보가 너무 복잡합니다.');
    if(Array.isArray(v)){if(v.length>5000) fail('invalid_project',400,'편집 항목이 너무 많습니다.');v.forEach(x=>walk(x,depth+1));}
    else if(v && typeof v==='object') for(const k of Object.keys(v)){
      if(['__proto__','constructor','prototype'].includes(k)) fail('invalid_project',400,'허용되지 않는 필드입니다.');
      walk(v[k],depth+1);
    }
    else if(typeof v==='string' && /^(blob:|javascript:|data:(?!image\/(jpeg|png|webp);base64,))/i.test(v)) fail('invalid_media',400,'저장할 수 없는 미디어 형식입니다. 사진을 다시 선택해 주세요.');
  };
  walk(snapshot);
  for(const p of snapshot.photos) if(!p || typeof p.src!=='string' || !/^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|\/assets\/[a-zA-Z0-9_./-]+)$/.test(p.src) || p.src.includes('..')) fail('invalid_media',400,'사진을 다시 선택해 주세요.');
  if (snapshot.customStyles !== undefined) {
    const referenced = new Set([snapshot.campaign.designStyle, ...[].concat(snapshot.campaign.cutDesigns || [])]);
    const customStyles = validateStyles(snapshot.customStyles, 13);
    if (customStyles.some(style => !referenced.has(style.id))) fail('invalid_project', 400, '프로젝트에 적용된 스타일만 함께 저장할 수 있어요.');
    return JSON.stringify({ ...snapshot, customStyles });
  }
  return raw;
}
async function handle(user,action,b) {
  if(action==='project-list') return {projects:(await db.query('SELECT id,name,revision,updated_at FROM ar_projects WHERE user_id=$1 ORDER BY updated_at DESC',[user.id])).rows};
  const id=String(b.id||crypto.randomUUID());
  if(!/^[a-f0-9-]{36}$/.test(id)) fail('invalid_project',400,'프로젝트를 다시 선택해 주세요.');
  if(action==='project-save'){
    const raw=validate(b.snapshot),name=String(b.name||'새 프로젝트').trim().slice(0,80);
    return db.tx(async c=>{
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`projects:${user.id}`]);
      const old=await c.query('SELECT revision FROM ar_projects WHERE id=$1 AND user_id=$2 FOR UPDATE',[id,user.id]);
      let r;
      if(old.rows.length){
        if(Number(b.revision)!==old.rows[0].revision) fail('project_conflict',409,'다른 기기에서 수정됐습니다. 불러오거나 새 이름으로 저장해 주세요.');
        r=await c.query('UPDATE ar_projects SET name=$3,snapshot=$4,revision=revision+1,updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING id,name,revision,updated_at',[id,user.id,name,raw]);
      }else{
        if(b.revision) fail('project_missing',404,'프로젝트가 없거나 접근할 수 없습니다.');
        const count=await c.query('SELECT count(*)::int AS n FROM ar_projects WHERE user_id=$1',[user.id]);
        if(count.rows[0].n>=5) fail('project_limit',409,'프로젝트는 5개까지 저장할 수 있습니다. 기존 프로젝트를 정리해 주세요.');
        r=await c.query('INSERT INTO ar_projects(id,user_id,name,snapshot) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING RETURNING id,name,revision,updated_at',[id,user.id,name,raw]);
        if(!r.rows.length) fail('project_conflict',409,'새 프로젝트 번호로 다시 저장해 주세요.');
      }
      return {project:r.rows[0]};
    });
  }
  if(action==='project-load'){
    const r=await db.query('SELECT id,name,revision,snapshot,updated_at FROM ar_projects WHERE id=$1 AND user_id=$2',[id,user.id]);
    if(!r.rows.length) fail('project_missing',404,'프로젝트가 없거나 접근할 수 없습니다.');
    return {project:r.rows[0]};
  }
  if(action==='project-delete'){
    const r=await db.query('DELETE FROM ar_projects WHERE id=$1 AND user_id=$2 AND revision=$3 RETURNING id',[id,user.id,Number(b.revision)||0]);
    if(!r.rows.length) fail('project_conflict',409,'프로젝트가 변경됐습니다. 목록을 새로고침해 주세요.');
    return {deleted:true};
  }
  fail('unknown_action',404,'알 수 없는 작업입니다.');
}
module.exports={handle,validate};
