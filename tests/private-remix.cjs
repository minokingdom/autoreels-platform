// 두 계정이 같은 URL을 넣어도 각자 요청한 결과만 읽을 수 있어야 합니다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {randomUUID} = require('node:crypto');
const {PGlite} = require('@electric-sql/pglite');
const db = require('../lib/server/db');
const remix = require('../lib/server/private-remix');

(async () => {
  const pg = new PGlite();
  try {
    await pg.exec(fs.readFileSync(require.resolve('../lib/server/db'),'utf8').match(/const SCHEMA = `([\s\S]*?)`;/)[1]);
    db.query = (...args) => pg.query(...args);
    db.tx = fn => pg.transaction(fn);
    const owner={id:1}, other={id:2}, id=randomUUID(), url='https://www.youtube.com/shorts/Iit7ZaSLRTw';
    await pg.exec("INSERT INTO ar_users(id,phone,password_hash) VALUES(1,'test1','test'),(2,'test2','test')");
    assert.equal(remix.videoURL('!분석 '+url),'https://www.youtube.com/watch?v=Iit7ZaSLRTw');
    assert.throws(()=>remix.videoURL('https://example.com/video'));
    assert.equal(remix.verifyWorker('Bearer untrusted'),false);
    await remix.submit(owner,url,id);
    assert.equal((await remix.submit(owner,url,randomUUID())).id,id);
    await assert.rejects(remix.status(other,id),e=>e.status===404);
    const anotherId=randomUUID();
    await remix.submit(other,url,anotherId);
    const {job}=await remix.worker({op:'claim'});
    assert.equal(job.id,id);
    const scene={start:0,end:90,accent:'#e4aa26',position:'bottom',screen:'어떤 청바지를 고를까?',speech:'오늘은 청바지를 비교해요.'};
    await remix.worker({op:'complete',id,lease:randomUUID(),scenes:[scene]});
    assert.equal((await remix.status(owner,id)).status,'running');
    await remix.worker({op:'complete',id,lease:job.lease,scenes:[scene],context:{topic:'청바지 비교'}});
    assert.equal((await remix.status(owner,id)).scenes[0].end,90);
    await assert.rejects(remix.status(other,id),e=>e.status===404);
    assert.equal((await remix.status(other,anotherId)).status,'queued');
    assert.equal((await db.query('SELECT url FROM ar_private_remix WHERE id=$1',[id])).rows[0].url,null);
    const claimedOther = await remix.worker({op:'claim'});
    await remix.worker({op:'complete',id:anotherId,lease:claimedOther.job.lease,failed:true});
    const editId = randomUUID();
    await assert.rejects(remix.submit(other,null,editId,id,'다른 업종으로'),e=>e.status===404);
    await remix.submit(owner,null,editId,id,'청바지를 운동화로 바꿔줘');
    assert.equal((await remix.submit(owner,null,randomUUID(),id,'청바지를 운동화로 바꿔줘')).id,editId);
    const {job:adapt}=await remix.worker({op:'claim'});
    assert.equal(adapt.context.topic,'청바지 비교');
    assert.equal(adapt.scenes[0].screen,'어떤 청바지를 고를까?');
    assert.equal(adapt.scenes[0].speech,'오늘은 청바지를 비교해요.');
    await remix.worker({op:'complete',id:editId,lease:adapt.lease,draft:['어떤 운동화를 고를까?']});
    assert.deepEqual((await remix.status(owner,editId)).draft,['어떤 운동화를 고를까?']);
    await assert.rejects(remix.status(other,editId),e=>e.status===404);
    console.log('private remix ownership, independent analysis, retry, lease and URL removal ok');
  } finally {await pg.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});