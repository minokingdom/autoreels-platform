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
    const scene={start:0,end:90,accent:'#e4aa26',position:'bottom'};
    await remix.worker({op:'complete',id,lease:randomUUID(),scenes:[scene]});
    assert.equal((await remix.status(owner,id)).status,'running');
    await remix.worker({op:'complete',id,lease:job.lease,scenes:[scene]});
    assert.equal((await remix.status(owner,id)).scenes[0].end,90);
    await assert.rejects(remix.status(other,id),e=>e.status===404);
    assert.equal((await remix.status(other,anotherId)).status,'queued');
    assert.equal((await db.query('SELECT url FROM ar_private_remix WHERE id=$1',[id])).rows[0].url,null);
    console.log('private remix ownership, independent analysis, retry, lease and URL removal ok');
  } finally {await pg.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});