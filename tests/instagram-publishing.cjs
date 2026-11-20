'use strict';
// 외부 게시는 모의 응답으로 대체하고 연결·해제·발행 상태는 실제 PostgreSQL SQL로 확인합니다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const db = require('../lib/server/db');
const sns = require('../lib/server/sns');

async function run() {
  const pg = new PGlite();
  try {
    const schema = fs.readFileSync(require.resolve('../lib/server/db'), 'utf8').match(/const SCHEMA = `([\s\S]*?)`;/)[1];
    await pg.exec(schema);
    db.query = (sql, params) => pg.query(sql, params);
    db.tx = fn => pg.transaction(fn);
    await pg.query("INSERT INTO ar_users (id,phone,password_hash) VALUES (1,'test-1','test'),(2,'test-2','test')");
    const user = { id: '1' };
    Object.assign(process.env, { TOKEN_ENC_KEY: 't'.repeat(32), META_APP_ID: 'test', META_APP_SECRET: 'secret', META_INSTAGRAM_CONFIG_ID: '12345' });
    let publishes = 0;
    let accountList = [{ id: '91', username: 'test_reels' }];
    let caption;
    global.fetch = async (input, options) => {
      const u = new URL(input);
      assert.equal(u.hostname, 'graph.facebook.com');
      const path = u.pathname.replace(/^\/v\d+\.\d+/, '');
      let data;
      if (path === '/oauth/access_token') {
        assert.equal(u.searchParams.get('redirect_uri'), 'https://autoreelsmaker.kr/api/sns');
        data = { access_token: 'sample-token' };
      } else if (path === '/me') data = { client_business_id: '71' };
      else if (path === '/me/assigned_instagram_accounts') data = { data: accountList };
      else if (path === '/91/media') {
        const body = new URLSearchParams(options.body);
        assert.equal(body.get('media_type'), 'REELS');
        assert.equal(body.get('access_token'), 'sample-token');
        caption = body.get('caption');
        data = { id: '81' };
      } else if (path === '/81') data = { status_code: 'FINISHED' };
      else if (path === '/91/media_publish') {
        assert.equal(new URLSearchParams(options.body).get('creation_id'), '81');
        publishes++;
        data = { id: '82' };
      } else if (path === '/82') data = { permalink: 'https://www.instagram.com/reel/test/' };
      else throw Error('예상하지 않은 API ' + path);
      return new Response(JSON.stringify(data));
    };
    async function begin() {
      const u = new URL(await sns.startAuth(user, 'instagram', 'autoreelsmaker.kr'));
      assert.equal(u.searchParams.get('config_id'), '12345');
      assert.equal(u.searchParams.get('prompt'), 'login');
      assert.equal(u.searchParams.get('redirect_uri'), 'https://autoreelsmaker.kr/api/sns');
      return u.searchParams.get('state');
    }
    await assert.rejects(sns.finishAuth(await begin(), 'code', '2'), e => e.code === 'wrong_session');
    const state = await begin();
    await sns.finishAuth(state, 'code', user.id);
    await assert.rejects(sns.finishAuth(state, 'code', user.id), e => e.code === 'state');
    const info = await sns.status(user);
    assert.equal(info.targets.instagram.name, '@test_reels');
    assert.equal(info.targets.facebook.connected, false);
    accountList = [...accountList, { id: '92', username: 'other' }];
    await assert.rejects(sns.finishAuth(await begin(), 'code', user.id), /하나만/);
    const body = { targets: ['instagram'], requestId: 'test-instagram-reel-1',
      videoUrl: 'https://test.public.blob.vercel-storage.com/publish/1/reel.mp4', caption: '본문 #테스트', igFirstComment: true };
    const [job] = await sns.startPublish(user, body);
    assert.equal(job.status, 'processing', job.error);
    const [done] = await sns.jobStatus(user, [job.id]);
    assert.equal(done.url, 'https://www.instagram.com/reel/test/');
    assert.equal(caption, body.caption);
    await sns.startPublish(user, body);
    assert.equal(publishes, 1);
    await sns.disconnect(user, 'instagram');
    assert.equal((await sns.status(user)).targets.instagram.connected, false);
    console.log('인스타 통합 로그인, 사용자 일치, 계정 선택, 릴스 발행, 중복 방지, 연결 해제 통과');
  } finally { await pg.close(); }
}
run().catch(e => { console.error(e); process.exitCode = 1; });
