const test=require('node:test'),assert=require('node:assert/strict');
const {validateCatalog,validateStyle}=require('../lib/reference-style.cjs');
const {handleReferenceAnalysis}=require('../lib/reference-analysis.cjs');
const style={name:'테스트 필름',summary:'테스트용 설정',category:'감성',layout:'full',font:'pretM',captionPosition:'bottom',textMotion:'rise',camera:'zoom-in',transition:'fade',background:'#141414',foreground:'#ffffff',accent:'#ccaa88',captionSize:.06,zoom:.04,shade:.4,grain:.02,entrySeconds:.5};
test('카탈로그는 코드·중복 ID·범위 밖 설정을 허용하지 않는다',()=>{
 assert.equal(validateCatalog([{id:'ref_0123456789abcdef',...style}]).length,1);
 for(const patch of [{name:'<img onerror=x>'},{zoom:100},{font:'url(https://x)'},{captionPosition:'outside'},{shade:NaN}])assert.throws(()=>validateStyle({...style,...patch}));
 assert.throws(()=>validateCatalog([{id:'ref_0123456789abcdef',...style},{id:'ref_0123456789abcdef',...style}]));
 assert.equal(validateStyle({...style,code:'evil()'}).code,undefined);
});
test('잘못된 프레임은 공급자 호출 전에 거부한다',async()=>{
 let called=false;const original=global.fetch;global.fetch=async()=>{called=true;throw Error()};
 const res={status(n){this.code=n;return this},json(b){this.body=b;return this}};
 try {await handleReferenceAnalysis({frames:['https://localhost/secret'],timeline:''},res);assert.equal(res.code,400);assert.equal(called,false);}finally{global.fetch=original;}
});
test('지원되지 않는 효과를 가짜 성공으로 바꾸지 않는다',async()=>{
 const original=global.fetch,old=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test';
 global.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({supported:false,reason:'별도 3D 구현 필요'})}]}}]})});
 const res={status(n){this.code=n;return this},json(b){this.body=b;return this}};
 try{await handleReferenceAnalysis({frames:['/9j/AA==','/9j/AA=='],timeline:'test'},res);assert.equal(res.code,422);assert.equal(res.body.ok,false);}finally{global.fetch=original;if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});
