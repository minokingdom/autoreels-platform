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
    assert.deepEqual((await api({mode:'meme-radar',query:'missing subject'})).items,[]);
    const unsupported=await api({mode:'meme-url-import',url:'https://www.youtube.com/shorts/abcdefghijk'});
    assert.equal(unsupported.ok,false);
    assert.equal(unsupported.videoUrl,undefined);
  } finally {global.fetch=previous;}
  console.log('Search, import and mashup retain exact source IDs; unrelated results are excluded.');
})().catch(error=>{console.error(error);process.exitCode=1;});
