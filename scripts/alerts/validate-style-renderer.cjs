'use strict';
// 모델이 만든 렌더러는 캔버스 연산만 허용합니다. 브라우저/파일/네트워크 API는 없음.
const {parse}=require('acorn');
const fs=require('node:fs');
const globals=new Set(['Math','Number','Array','Path2D','mPhoto','mClamp','arReferenceFanScene','arReferenceFanEase','makeCanvas']);
const members=new Set(('save restore beginPath closePath moveTo lineTo bezierCurveTo quadraticCurveTo arc arcTo ellipse rect roundRect clip fill stroke fillRect strokeRect clearRect translate rotate scale transform setTransform resetTransform drawImage fillText measureText createLinearGradient createRadialGradient addColorStop setLineDash getContext width height fillStyle strokeStyle globalAlpha globalCompositeOperation lineWidth lineCap lineJoin font textAlign textBaseline filter shadowBlur shadowColor shadowOffsetX shadowOffsetY imageSmoothingEnabled imageSmoothingQuality canvas abs min max floor ceil round sin cos tan atan atan2 sqrt pow exp log PI hypot sign trunc isFinite from isArray forEach map reduce slice at push pop shift unshift length photos n idx cutIdx cuts p tp into sceneDur background foreground accent zoom shade grain entrySeconds camera captionSize font transition captionPosition textMotion x y w h a b c d e f start end duration color alpha angle offset').split(' '));
function validate(code,name){
 if(typeof code!=='string'||code.length>60000||!/^arCustom_[a-f0-9]{16}$/.test(name))throw Error('renderer_size_or_name');
 const ast=parse(code,{ecmaVersion:2022});
 if(ast.body.length!==1||ast.body[0].type!=='FunctionDeclaration'||ast.body[0].id.name!==name||ast.body[0].async||ast.body[0].generator)throw Error('renderer_entry');
 const names=new Set(globals);
 const bind=n=>{if(!n)return;if(n.type==='Identifier')names.add(n.name);else if(n.type==='ArrayPattern')n.elements.forEach(bind);else if(n.type==='ObjectPattern')n.properties.forEach(p=>bind(p.value));else if(n.type==='AssignmentPattern')bind(n.left);else throw Error('binding_not_supported');};
 const walk=(n,fn,parent,key)=>{if(!n||typeof n!=='object')return;if(n.type)fn(n,parent,key);for(const [k,v] of Object.entries(n)){if(Array.isArray(v))v.forEach(x=>walk(x,fn,n,k));else if(v&&typeof v==='object')walk(v,fn,n,k);}};
 walk(ast,n=>{if(n.type==='VariableDeclarator')bind(n.id);if(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(n.type)){if(n.id)bind(n.id);n.params.forEach(bind);}});
 walk(ast,(n,parent,key)=>{
  if(['ThisExpression','Super','ImportExpression','AwaitExpression','YieldExpression','WithStatement','DebuggerStatement','ClassDeclaration','ClassExpression','TaggedTemplateExpression','MetaProperty','WhileStatement','DoWhileStatement'].includes(n.type))throw Error('renderer_forbidden_'+n.type);
  if(n.type==='Literal'&&typeof n.value==='number'&&(!Number.isFinite(n.value)||Math.abs(n.value)>100000))throw Error('renderer_numeric_limit');
  if(n.type==='ForStatement'&&!(n.test?.type==='BinaryExpression'&&['<','<='].includes(n.test.operator)&&n.test.right.type==='Literal'&&n.test.right.value<=256&&n.update?.type==='UpdateExpression'&&n.update.operator==='++'))throw Error('renderer_loop_limit');
  if(n.type==='Property'&&(n.computed||['constructor','prototype','__proto__'].includes(n.key.name||n.key.value)))throw Error('renderer_property');
  if(['AssignmentExpression','UpdateExpression'].includes(n.type)){
   let target=n.left||n.argument;while(target?.type==='MemberExpression')target=target.object;
   if(target?.type==='Identifier'&&globals.has(target.name))throw Error('renderer_global_write');
  }
  if(n.type==='NewExpression'&&!(n.callee.type==='Identifier'&&n.callee.name==='Path2D'))throw Error('renderer_constructor');
  if(n.type==='MemberExpression'){
   if(n.computed){if(n.property.type!=='Literal'||!Number.isInteger(n.property.value)||n.property.value<0)throw Error('renderer_dynamic_property');}
   else if(!members.has(n.property.name))throw Error('renderer_member_'+n.property.name);
  }
  if(n.type==='Identifier'){
   if(parent?.type==='MemberExpression'&&key==='property'&&!parent.computed)return;
   if(parent?.type==='Property'&&key==='key'&&!parent.computed)return;
   if(!names.has(n.name))throw Error('renderer_identifier_'+n.name);
   if(['constructor','prototype','__proto__','eval','Function','window','globalThis','document','fetch','process','require'].includes(n.name))throw Error('renderer_forbidden_identifier');
  }
 });
 return true;
}
module.exports={validate};
if(require.main===module){validate(fs.readFileSync(process.argv[2],'utf8'),process.argv[3]);console.log('canvas-only renderer validated');}
