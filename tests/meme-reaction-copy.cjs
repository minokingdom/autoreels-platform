const assert = require('node:assert/strict');
const {reactionCopy} = require('../lib/meme-reaction-copy.cjs');
(async () => {
  const previous = global.fetch;
  const before = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    const clips = [{id:'ZUEKsf5fbtd5j5Eg7J'},{id:'wVdeizmpZ4MGCbYtEb'},{id:'unknown',title:'Unrelated GIF by Author',url:'https://media.tenor.com/unknown.mp4'}];
    const copy = await reactionCopy(clips);
    assert.match(copy[0].line,/누우/);
    assert.match(copy[1].line,/하이파이브/);
    assert.equal(copy[2],null);
    process.env.GEMINI_API_KEY = 'fixture';
    let calls = 0;
    global.fetch = async (url, opts) => {
      if (url instanceof URL) return new Response(Buffer.from('movie'));
      calls++;
      const parts = JSON.parse(opts.body).contents[0].parts;
      assert.equal(parts[1].inlineData.data,Buffer.from('movie').toString('base64'));
      return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({clips:[
        {index:0,title:'문 열자마자',line:'택배가 먼저 와 있었다.'},
        {index:1,title:'수상한 클립',line:'절대 읽지 않을 대사'}
      ]})}]}}]});
    };
    const sources = [clips[2], {id:'no-bytes',url:'https://example.org/test.mp4'}];
    const fresh = await reactionCopy(sources);
    assert.deepEqual(fresh,[{title:'문 열자마자',line:'택배가 먼저 와 있었다.'},null]);
    assert.deepEqual(await reactionCopy(sources),fresh);
    assert.equal(calls,1);
  } finally {
    global.fetch = previous;
    if (before === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = before;
  }
  console.log('Scene captions use reviewed copy or supplied video. Missing footage never becomes dialogue.');
})().catch(e=>{ console.error(e); process.exitCode=1; });
