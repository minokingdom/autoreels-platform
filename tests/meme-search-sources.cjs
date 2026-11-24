const assert=require('node:assert/strict');
const {handleMemeRemakeRequest}=require('../lib/meme-remake-engine.cjs');

async function api(body) {
  let result;
  await handleMemeRemakeRequest(body,{setHeader(){},status(){return this},json(value){result=value}});
  return result;
}

(async()=>{
  const rows=[
    ['1','Iu Concert','iu','concert'],
    ['2','Seventeen Concert','seventeen','concert'],
    ['3','Iu Interview','iu','interview']
  ].map(([id,title,...tags])=>({id,title,tags,media_formats:{mp4:{url:'https://media.tenor.com/'+id+'/fixture.mp4'}}}));
  const page='<script id="store-cache">'+JSON.stringify({universal:{search:{fixture:{results:rows}}}})+'</script>';
  const previous=global.fetch;
  global.fetch=async url=>new Response(String(url).startsWith('https://tenor.com/') ? page : '',{status:200});
  try {
    for (const [query,id] of [['아이유 콘서트','1'],['세븐틴 콘서트','2'],['iu interview','3']]) {
      const {items}=await api({mode:'meme-radar',query});
      assert.equal(items.length,1);
      assert.deepEqual(items[0].cuts.map(c=>c.sourceId),['tenor_'+id]);
      const imported=await api({mode:'meme-url-import',url:query});
      assert.deepEqual(imported.item.cuts,items[0].cuts);
      const mashup=await api({mode:'meme-mashup',meme:items[0],mashupType:'keyword'});
      assert.deepEqual(mashup.item.cuts.map(c=>c.videoUrl),[items[0].cuts[0].videoUrl]);
    }
    const topic = '미사일급상승 시작 12:10 · 검색량 500+';
    const title = '조별 과제에서 내가 한 일';
    const line = '하이파이브는 다 내가 했다.';
    const body = {mode:'meme-mashup', mashupType:'keyword', issueKeyword:topic,
      meme:{singleReaction:true,title,cuts:[{line,videoUrl:'/team.mp4'}]}};
    const fallback = (await api(body)).item;
    assert.deepEqual([fallback.title, ...fallback.hookTitles], [title, title]);
    assert.equal(fallback.why, '선택한 키워드 · 미사일');
    assert.equal(fallback.cuts[0].line,line);
    global.fetch = async (_url, request) => {
      assert.doesNotMatch(request.body, /12:10|500\+/);
      const reply = {title:'미사일 10초 요약',hookTitles:['검색량 500+', '팀 점수에 손바닥만 보탰다'],cuts:[{line}]};
      return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(reply)}]}}]});
    };
    const generated = (await api({...body,adminGeminiKey:'fixture'})).item;
    assert.equal(generated.title,'팀 점수에 손바닥만 보탰다');
    assert.deepEqual(generated.hookTitles,[generated.title]);
    global.fetch=async url=>new Response(String(url).startsWith('https://tenor.com/') ? page : '',{status:200});
    assert.deepEqual((await api({mode:'meme-radar',query:'missing subject'})).items,[]);
    const unsupported=await api({mode:'meme-url-import',url:'https://www.youtube.com/shorts/abcdefghijk'});
    assert.equal(unsupported.ok,false);
    assert.equal(unsupported.videoUrl,undefined);
  } finally {global.fetch=previous;}
  console.log('Search, import and mashup retain exact source IDs; unrelated results are excluded.');
})().catch(error=>{console.error(error);process.exitCode=1;});
