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

 const request = {
  method:'POST', headers:{origin:'https://example.com',host:'example.com'},
  body:{prompt:'BMW 520i 할인',vehicle:'현대 아이오닉 6',vehicleLocked:true,discountNum:0,discount:'전기차 케어 지원',industry:'auto',cutCount:4}
 };
 await moduleObj.exports(request,res);
 const assertEnteredProduct = () => {
  assert.equal(res.statusCode,200);
  assert.equal(res.body.variants.length,3);
  for (const v of res.body.variants) {
   assert.equal(v.vehicle,'현대 아이오닉 6');
   assert.equal(v.discountNum,0);
   assert.equal(v.discount,'전기차 케어 지원');
   assert.doesNotMatch(JSON.stringify(v),/BMW|520i|1,150|480|3대|즉시출고/);
  }
 };
 assertEnteredProduct();
 assert.ok(res.body.aiFallback);
 let input;
 ctx.fetch=async(url,options)=>{
  input=JSON.parse(options.body).contents[0].parts[0].text;
  const variants=[
   {vehicle:'BMW 520i',cutCaptions:['BMW 520i 특판','둘','셋','넷']},
   {vehicle:'현대 아이오닉 6',discountNum:1150,discount:'제공하지 않은 판매 조건',cutCaptions:['현대 아이오닉 6','둘','셋','넷']}
  ];
  return {ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({variants})}]}}]})};
 };
 await moduleObj.exports(request,res);
 assertEnteredProduct();
 assert.match(input,/지정 차량.*현대 아이오닉 6/);
 assert.match(input,/직접 입력한 혜택.*전기차 케어 지원/);
 assert.equal(res.body.aiFallback,undefined);
 console.log('entered model and offer survive conflicting topics, provider results and timeouts');
 await moduleObj.exports({
  ...request,
  body:{prompt:'딸기 라떼 출시',vehicle:'바닐라 라떼',vehicleLocked:true,discountNum:0,discount:'테이크아웃 안내',industry:'cafe',
   specialty:'디저트',industryInfo:{name:'카페',product:'메뉴',role:'바리스타',aiRole:'바리스타',cta:'문의'}}
 },res);
 assert(res.body.variants.every(v=>v.vehicle==='바닐라 라떼' && v.discount==='테이크아웃 안내'));
 assert.match(input,/지정 메뉴.*바닐라 라떼/);
 assert.doesNotMatch(JSON.stringify(res.body.variants),/딸기 라떼|현대 아이오닉 6/);
 console.log('confirmed product kept for a non-automotive script');
})().catch(e=>{console.error(e);process.exitCode=1});
