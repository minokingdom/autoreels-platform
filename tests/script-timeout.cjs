const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let now=100000,attempts=[];
class FakeDate extends Date { static now(){ return now; } }
const moduleObj={exports:{}};
const ctx={module:moduleObj,exports:moduleObj.exports,require(n){if(n==='../lib/server/usage')return {isSameSiteRequest:()=>true};if(n==='../lib/server/meter')return {withMeter:h=>h};return require(n)},process:{env:{GEMINI_API_KEY:'fake',KIE_API_KEY:'fake',OPENAI_API_KEY:'fake'}},Buffer,URL,URLSearchParams,TextDecoder,Date:FakeDate,AbortSignal:{timeout(ms){return {ms}}},setTimeout,clearTimeout,console,
fetch:async(url,options)=>{attempts.push({url,ms:options.signal.ms});now+=options.signal.ms;throw Object.assign(new Error('timeout'),{name:'TimeoutError'});}
};
vm.runInNewContext(fs.readFileSync('api/generate-script.js','utf8'),ctx);
const res={statusCode:200,status(n){this.statusCode=n;return this},json(b){this.body=b;return this},setHeader(){}};
(async()=>{
 await moduleObj.exports({
  method:'POST',
  headers:{origin:'https://example.com',host:'example.com'},
  body:{prompt:'bmw 7시리즈 출시',vehicle:'BMW 520i M Sport 패키지',industry:'auto',cutCount:4}
 },res);
 assert.equal(res.statusCode,200);
 assert.equal(res.body.ok,true);
 assert.ok(res.body.aiFallback);
 assert.equal(now-100000,42000);
 assert.deepEqual(attempts.map(x=>x.ms),[14000,14000,12000,2000]);
 assert.equal(res.body.variants.length,3);
 assert(res.body.variants.every(variant=>variant.vehicle==='BMW 7시리즈'));
 assert.doesNotMatch(JSON.stringify(res.body.variants),/520i|5시리즈|0\s*만\s*원/);
 console.log('first script request keeps BMW 7시리즈 when every provider times out');
})().catch(e=>{console.error(e);process.exitCode=1});
