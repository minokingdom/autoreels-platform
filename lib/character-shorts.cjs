'use strict';
const {Resvg}=require('@resvg/resvg-js');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {createHash}=require('node:crypto');
const encoder=require('@ffmpeg-installer/ffmpeg').path;

const palettes={
  paper:{sky:'#f7d4a1',light:'#fff3ce',wall:'#e8aa74',trim:'#395b59',floor:'#c78266',accent:'#f08f5f',ink:'#453e43'},
  comic:{sky:'#bcdfe9',light:'#ffeb87',wall:'#aaa2d3',trim:'#305779',floor:'#7497b0',accent:'#ff858a',ink:'#252847'},
  night:{sky:'#57537b',light:'#f9c99b',wall:'#7c7296',trim:'#434961',floor:'#505672',accent:'#ea8994',ink:'#292b42'}
};
const places=['cafe','street','shop','office'];
const actions=['enter','notice','offer','surprise','celebrate','think'];
const FPS=24, SECONDS=3;
function seedOf(text){return createHash('sha256').update(String(text)).digest().readUInt32BE(0);}
function validScene(scene,index=0){
  return {line:String(scene?.line || '').trim().slice(0,72),place:places.includes(scene?.place)?scene.place:'street',
    action:actions.includes(scene?.action)?scene.action:['enter','surprise','celebrate'][index%3],
    actor:scene?.actor==='cat'?'cat':'fox'};
}
function defaultPlan(topic){
  const place=/카페|커피|주문|마감/.test(topic)?'cafe':/쇼핑|가게|매장|쇼핑|판매/.test(topic)?'shop':/회사|회의|업무|출근/.test(topic)?'office':'street';
  const lines=place==='cafe'?[topic,'잠깐만요, 한 잔만 더 될까요?','둘이 마실 거면 두 잔이죠!']:
    place==='office'?[topic,'비어 있는 회의실을 찾았어!','오늘 회의는 산책하면서 하자.']:
    place==='shop'?[topic,'마지막 하나를 둘이 골랐네?','선물이라면 주인은 정해졌지!']:[topic,'혹시 너도 같은 생각이야?','그럼, 같이 해 보자!'];
  return lines.map((line,i)=>validScene({line,place,action:['enter','notice','celebrate'][i],actor:i===1?'cat':'fox'},i));
}
async function plan(topic){
  const key=process.env.GEMINI_API_KEY;
  if (!key) return defaultPlan(topic);
  try{
    const model=(process.env.GEMINI_SCRIPT_MODEL || 'gemini-2.5-flash').split(',')[0];
    const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(key),{
      method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(6500),
      body:JSON.stringify({systemInstruction:{parts:[{text:'Write an original Korean three-shot dialogue between a fox and a cat about the supplied topic. Setup, turn, payoff. Each line must be speakable in three seconds, up to 24 Korean characters. Return a JSON array of three objects with line, actor (fox/cat), place (cafe/street/shop/office), action (enter/notice/offer/surprise/celebrate/think).'}]},contents:[{parts:[{text:topic}]}],generationConfig:{responseMimeType:'application/json',temperature:0.75}})
    });
    if(response.ok){
      const data=await response.json();
      const scenes=JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || 'null');
      if(Array.isArray(scenes)&&scenes.length===3&&scenes.every(s=>typeof s?.line==='string'&&s.line.trim()))return scenes.map(validScene);
    }
  }catch(_){}
  return defaultPlan(topic);
}
function path(d,fill,stroke='none',w=2){return '<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+w+'" stroke-linejoin="round" stroke-linecap="round"/>';}
function oval(x,y,rx,ry,fill){return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'"/>';}
function box(x,y,w,h,fill,r=0){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'"/>';}
function character(cat,act,t,talking,p) {
  const fur=cat?'#83c9b5':'#f39a63',cream=cat?'#e1f4d7':'#fff0d4',coat=cat?'#956697':'#527e9a', ink=p.ink;
  const blink=Math.abs((t*1.18+(cat?.36:0))%2.8-1.8)<.065;
  const beat=Math.sin(Math.PI*Math.min(1,t/.8)),wave=Math.sin(t*6);
  const jump=act==='celebrate'?-Math.abs(wave)*9:act==='surprise'?-beat*9:Math.sin(t*2.6)*1.5;
  const raised=act==='offer'||act==='notice'||act==='celebrate';
  let g=path('M-17 -28 Q-64 -69 -57 -31 Q-48 -8 -21 -13',fur,ink,3)+path('M-56 -34 Q-61 -49 -59 -52 L-49 -44 L-45 -36Z',cream);
  g+=path('M-19 -13L-23 3 M13 -13L18 3','none',ink,9)+oval(-24,4,11,4,ink)+oval(20,4,11,4,ink);
  g+='<g transform="translate(0 '+jump+')">';
  g+=path('M-23 -55Q0 -67 24 -52L30 -14Q8 -4 -30 -15Z',coat,ink,3)+path('M-11 -56L0 -43L11 -56',cream,ink,2);
  g+=path('M-19 -44Q-29 -39 -29 -28','none',ink,9)+path('M-19 -44Q-29 -39 -29 -28','none',fur,6);
  const hand=raised?-66+wave*4:-29+wave*2;
  g+=path('M19 -44Q34 -42 40 '+hand,'none',ink,9)+path('M19 -44Q34 -42 40 '+hand,'none',fur,6)+oval(40,hand,5,5,cream);
  if(act==='offer'){
    g+=path('M34 '+(hand-11)+'h19l-2 13q-7 5 -14 0Z',cream,ink,2)+path('M53 '+(hand-9)+'q12 0 0 7','none',ink,2);
    g+=path('M40 '+(hand-15)+'q-3 -3 0 -7 M47 '+(hand-16)+'q3 -3 0 -6','none',cream,1.8);
  }
  if(cat)g+=path('M-16 -41q16 8 33 0 M-18 -32q17 8 38 0','none','#c6a3bf',3);
  else g+=path('M-16 -49l-2 26q14 5 30 0l-1 -26 M-8 -35h12v6q-6 4 -12 0Z','none','#b8d3cc',2);
  g+='<g transform="rotate('+(act==='think'?-8:wave*1.6)+' 0 -71)">';
  g+=path(cat?'M-31 -79L-33 -110L-13 -99Q-1 -102 12 -98L33 -109L31 -80Q33 -59 3 -53Q-28 -55 -31 -79Z':'M-35 -83L-34 -116L-12 -102Q0 -106 15 -101L35 -116L34 -83L40 -74L19 -59L1 -53L-23 -60L-40 -75Z',fur,ink,3.2);
  g+=path('M-29 -105L-27 -91L-19 -99Z M20 -99L27 -91L29 -105Z','#ce7e77');
  g+=path('M-31 -76Q-18 -82 -3 -69Q13 -80 31 -76Q23 -59 1 -56Q-19 -58 -31 -76Z',cream);
  for(const x of [-13,13]){
    if(blink)g+=path('M'+(x-3)+' -83q3 3 6 0','none',ink,2);
    else g+=oval(x+(cat?-1:1),-83,2.7,act==='surprise'?5:3.8,ink);
  }
  g+=oval(-23,-76,4.5,2.3,'#e39c91')+oval(23,-76,4.5,2.3,'#e39c91');
  if(cat)g+=path('M-32 -74l-7 -2 M-32 -71l-7 1 M32 -74l7 -2 M32 -71l7 1','none',ink,1.3);
  if(act==='surprise')g+=path('M22 -120l4 -9 M30 -116l8 -5','none',cream,3);
  g+=oval(0,-72,3.6,2.6,ink);
  g+=talking && Math.sin(t*12)>.05?oval(1,-65,4,2.6+Math.sin(t*12)*1.1,ink):path('M-4 -66q5 4 10 -1','none',ink,1.8);
  return g+'</g></g>';
}
// Perspective projection for the moving camera and the set's walls, counters and floor.
function frame(scene,style,seed,t){
  const p=palettes[style],activeCat=scene.actor==='cat';
  const close=scene.action==='surprise'||scene.action==='think';
  const focus=(activeCat?32:-32)*(close?1:.28);
  const camera=focus+Math.sin((seed%7)*.3+t*.48)*6;
  function project(x,y,z){const k=370/(390+z);return [(180+(x-camera)*k).toFixed(1),(357+(0-y)*k+(k-.65)*80).toFixed(1)];}
  function face(points,color){return path('M'+points.map(a=>project(...a).join(' ')).join(' L')+'Z',color,p.ink,1);}
  function block(x,y,z,w,h,d,front,top,side){
    return face([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],front)
      +face([[x,y+h,z],[x+w,y+h,z],[x+w,y+h,z+d],[x,y+h,z+d]],top)
      +face([[x+w,y,z],[x+w,y,z+d],[x+w,y+h,z+d],[x+w,y+h,z]],side);
  }
  let svg='<svg xmlns="http://www.w3.org/2000/svg" width="432" height="768" viewBox="0 0 360 640"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="'+p.sky+'"/><stop offset="1" stop-color="'+p.light+'"/></linearGradient><pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.8" fill="'+p.ink+'" opacity=".16"/></pattern></defs>';
  svg+=box(0,0,360,640,'url(#sky)')+oval(270-camera*.09,105,38,38,p.light);
  let set='';
  for(let i=-4;i<5;i++){
    const h=180+((i+8)*73+seed%47)%135;
    set+=block(i*80,0,270,77,h,26,i%2?p.wall:p.trim,p.light,p.trim);
    for(let j=0;j<3;j++){
      const [x,y]=project(i*80+15+j*18,h-22,269);
      set+=box(x,y,5,11,p.light,1);
    }
  }
  set+=box(-200,355,800,550,p.floor);
  set+=face([[-800,0,-300],[800,0,-300],[800,0,240],[-800,0,240]],p.floor);
  for(let col=-3;col<4;col++)set+=path('M'+project(col*94,0,-200)+' L'+project(col*94,0,240),'none',p.wall,1);
  for(let row=0;row<5;row++)set+=path('M'+project(-500,0,-165+row*76)+' L'+project(500,0,-165+row*76),'none',p.wall,1);
  if(scene.place==='cafe'||scene.place==='shop'){
    set+=block(-163,0,100,300,265,14,p.wall,p.light,p.trim);
    const [x,y]=project(-132,215,98);
    set+=box(x,y,131,86,p.trim,6)+box(+x+5,+y+5,121,76,p.sky,4);
    for(let i=0;i<7;i++)set+=box(+x-5+i*21,+y-14,21,19,i%2?p.light:p.accent,3);
    for(const offset of [22,66,108]){
      set+=path('M'+(+x+offset)+' '+(+y+6)+'v16','none',p.trim,1.7);
      set+=path('M'+(+x+offset-7)+' '+(+y+27)+'q7 -16 14 0Z',p.light,p.trim,1.5);
    }
    set+=box(+x+8,+y+60,115,3,p.trim);
    for(let i=0;i<5;i++)set+=box(+x+12+i*20,+y+49,10,10,i%2?p.wall:p.trim,2);
    set+=block(-155,0,67,145,70,35,p.trim,p.light,p.wall);
    for(let i=0;i<3;i++){const [a,b]=project(-135+i*39,92,74);set+=box(a,b,17,16,scene.place==='cafe'?p.light:p.accent,4);}
    const [a,b]=project(75,176,96);set+=box(a,b,33,61,p.trim,3)+box(+a+4,+b+5,25,42,p.light,1);
  } else if(scene.place==='office'){
    set+=block(-169,0,86,305,220,10,p.wall,p.light,p.trim);
    for(let i=0;i<4;i++){const [a,b]=project(-148+i*67,198,85);set+=box(a,b,38,58,p.sky,2)+box(+a+18,b,2,58,p.light);}
    set+=block(-150,0,55,96,61,40,p.trim,p.light,p.wall);
  } else {
    for(const x of [-134,118]){const [a,b]=project(x,0,62);set+=box(+a-4,+b-82,8,82,'#805b4f')+oval(a,+b-95,29,43,p.trim)+oval(+a-15,+b-88,18,27,'#87ab87');}
    set+=block(-156,12,72,72,16,23,p.wall,p.light,p.trim);
  }
  for(const cat of [false,true]){
    const active=cat===activeCat, action=active?scene.action:'think';
    const walk=action==='enter'?(1-Math.min(1,t/.95))*(cat?45:-45):0;
    const [x,y]=project((cat?62:-65)+walk,0,cat?8:0);
    set+=oval(x,+y+4,38,7,'#6c55524d');
    const scale=cat?1.05:1.16;
    set+='<g transform="translate('+x+' '+y+') scale('+(cat?-scale:scale)+' '+scale+')">'+character(cat,action,t,active,p)+'</g>';
  }
  const zoom=(close?1.47:1.24)+t*.025+(seed%3)*.032,pan=(close?(activeCat?-26:26):0)+(seed%17)-8;
  svg+='<g transform="translate('+(180+pan)+' 322) scale('+zoom+') translate(-180 -322)">'+set+'</g>';
  if(style==='night'){
    for(let i=0;i<15;i++)svg+=oval((i*73+23)%360,35+(i*29)%115,1.5,.8+Math.abs(Math.sin(t+i)),'#fff3c7');
  }
  if(style==='comic')svg+=box(0,0,360,640,'url(#dots)');
  return svg+'</svg>';
}

async function renderScene(scene,style,seed){
  const ff=spawn(encoder,['-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s','432x768','-r',String(FPS),'-i','pipe:0','-f','lavfi','-i','sine=frequency='+(scene.action==='celebrate'?660:390)+':duration=3','-af','volume=0.16,afade=t=in:d=0.05,afade=t=out:st=0.11:d=0.32','-t',String(SECONDS),'-threads','2','-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-movflags','frag_keyframe+empty_moov+default_base_moof','-f','mp4','pipe:1'],{stdio:['pipe','pipe','pipe'],windowsHide:true});
  const chunks=[],errors=[];ff.stdout.on('data',b=>chunks.push(b));ff.stderr.on('data',b=>errors.push(b));
  ff.stdin.on('error',()=>{});
  const done=new Promise((resolve,reject)=>{ff.once('error',reject);ff.once('close',code=>code===0?resolve(Buffer.concat(chunks)):reject(Error(Buffer.concat(errors).toString().slice(-250)||'encoder failed')));});
  done.catch(()=>{});
  const timer=setTimeout(()=>ff.kill(),22000);
  try{
    for(let i=0;i<FPS*SECONDS;i++){
      const r=new Resvg(frame(scene,style,seed,i/FPS),{font:{loadSystemFonts:false}}).render();
      if(!ff.stdin.write(Buffer.from(r.pixels)))await Promise.race([once(ff.stdin,'drain'),done.then(()=>{throw Error('encoder closed');})]);
    }
    ff.stdin.end();return await done;
  }finally{clearTimeout(timer);if(ff.exitCode==null)ff.kill();}
}
async function handleCharacter(body,res){
  res.setHeader('Cache-Control','no-store');
  const topic=String(body.topic || '').trim().slice(0,100);
  const style=Object.hasOwn(palettes,body.style)?body.style:'paper';
  if(!topic)return res.status(400).json({ok:false,message:'이야기 주제를 입력해 주세요.'});
  if(body.mode==='character-plan'){
    const scenes=await plan(topic),videos=[];
    try {
      for(const scene of scenes)videos.push((await renderScene(scene,style,seedOf(topic+scene.action))).toString('base64'));
      return res.status(200).json({ok:true,scenes,videos});
    } catch(error){console.error('character storyboard:',error.message);return res.status(503).json({ok:false,message:'장면을 완성하지 못했어요. 다시 시도해 주세요.'});}
  }
  if(!body.scene || !String(body.scene.line||'').trim())return res.status(400).json({ok:false,message:'장면 대사를 입력해 주세요.'});
  const scene=validScene(body.scene);
  const seed=seedOf(topic+'|'+String(Number(body.variant)||0)+'|'+scene.action);
  try {
    const video=await renderScene(scene,style,seed);
    res.setHeader('Content-Type','video/mp4');return res.status(200).send(video);
  }catch(error){console.error('character render:',error.message);return res.status(503).json({ok:false,message:'장면을 렌더링하지 못했어요. 다시 시도해 주세요.'});}
}
module.exports={handleCharacter,renderScene,frame};
