const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('api/generate-script.js', 'utf8');
const start = source.indexOf('async function generateSingleKieSceneImage(');
const end = source.indexOf('\nconst { isSameSiteRequest', start);
assert(start >= 0 && end > start);
let calls = [], mode = 'success';
const imageBytes = Buffer.from('test-image');
const response = (value, status = 200) => ({ok: status === 200, status, json: async () => value});
const env = {KIE_API_KEY:'fake-key'};
const context = vm.createContext({
  URL, Buffer, AbortSignal, process:{env},
  setTimeout: (fn) => { fn(); return 0; },
  fetch: async (url, options = {}) => {
    calls.push({url:String(url), options});
    if (String(url).includes('createTask')) {
      if (mode === 'credits') return response({code:402});
      return response({code:200,data:{taskId:'test-task'}});
    }
    if (String(url).includes('recordInfo')) return response({code:200,data:{state:'success',resultJson:JSON.stringify({resultUrls:[mode === 'unsafe' ? 'https://example.org/image.png' : 'https://tempfile.aiquickdraw.com/image.png']})}});
    return {ok:true,headers:new Headers({'content-type':'image/png'}),body:(async function*(){yield imageBytes})()};
  },
  buildTopicScenePrompts: async () => ['scene one'],
});
vm.runInContext(source.slice(start,end) + '\nthis.handleSceneImages = handleSceneImages;',context);
const req = async (body) => { const res = {status(){return this},json(x){this.body=x;return x}}; await context.handleSceneImages(body,res); return res.body; };
(async () => {
  let r = await req({mode:'scene-image',imagePrompt:'portrait',aspectRatio:'9:16',index:2});
  assert.equal(r.ok,true); assert.equal(r.image.index,2); assert.equal(r.image.dataUrl,'data:image/png;base64,'+imageBytes.toString('base64'));
  const input=JSON.parse(calls[0].options.body);assert.equal(input.model,'z-image');assert.equal(input.input.aspect_ratio,'9:16');assert.equal(calls[0].options.headers.Authorization,'Bearer fake-key');
  calls=[];r=await req({mode:'scene-image',imagePrompt:'icon',aspectRatio:'1:1'});assert.equal(JSON.parse(calls[0].options.body).input.aspect_ratio,'1:1');assert.equal(r.ok,true);
  calls=[];mode='credits';r=await req({mode:'scene-image',imagePrompt:'x'});assert.equal(r.error,'kie_insufficient_credits');assert.equal(calls.length,1);
  calls=[];mode='unsafe';r=await req({mode:'scene-image',imagePrompt:'x'});assert.equal(r.error,'kie_image_download_failed');assert.equal(calls.length,2);
  delete env.KIE_API_KEY;calls=[];r=await req({mode:'scene-image',imagePrompt:'x'});assert.equal(r.error,'missing_kie_key');assert.equal(calls.length,0);
  console.log('z-image mocked tests ok');
})().catch(e => {console.error(e);process.exitCode=1});
