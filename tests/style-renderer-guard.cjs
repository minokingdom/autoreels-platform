const {test}=require('node:test'),assert=require('node:assert/strict');
const {validate}=require('../scripts/alerts/validate-style-renderer.cjs');
const name='arCustom_0123456789abcdef';
const wrap=code=>`function ${name}(c,W,H,S,r,idx,p,local,dur){${code}}`;
test('캔버스 렌더 함수와 로컬 계산만 허용',()=>assert(validate(wrap('c.save();const x=Math.sin(p)*W;c.fillRect(x,0,W,H);c.restore();'),name)));
for(const code of ['fetch("https://x")','window.location="x"','c.canvas.ownerDocument','c["constructor"]','const a=c; a.constructor','(()=>{}).constructor("return this")()','this.location','document.createElement("script")','eval("1")'])test('차단: '+code,()=>assert.throws(()=>validate(wrap(code),name)));
test('최상위 실행 불가',()=>assert.throws(()=>validate(wrap('')+';fetch("x")',name)));
