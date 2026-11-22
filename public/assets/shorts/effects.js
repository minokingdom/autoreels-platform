const effectNames={
  flash:'플래시',zoom:'펀치 줌',echo:'이중상',dip:'딥 전환',leak:'빛 번짐',slice:'슬라이스 스텝',
  rgbSplit:'글리치 RGB',bloom:'소프트 블룸',bokeh:'보케 빛망울',snow:'눈 내림',sparks:'스파크 반짝임',
  letterbox:'필름 레터박스',scanline:'스캔라인',prism:'프리즘 빛갈림',zoomOut:'줌 아웃 펄스',blurPull:'렌즈 포커스',
  cutoutBlur:'인물 배경 블러',cutoutDark:'배경 제거 · 다크',cutoutCream:'배경 제거 · 크림',
  cutoutOutline:'인물 흰 테두리',cutoutBehindText:'인물 뒤 대형 자막',
  grain:'필름 그레인',warm:'따뜻한 필름',matte:'크림 매트',mono:'흑백',vignette:'비네팅',
  kodak:'코닥 골드',tealOrange:'시네마 틸&오렌지',kyoto:'교토 페이퍼',blush:'소프트 로즈',
  moody:'무디 다크',forest:'에메랄드 포레스트',sunset:'선셋 앰버',midnight:'미드나잇 블루',
  pastel:'파스텔 밀크',vivid:'선명한 비비드',vhs:'레트로 VHS',leicaMono:'라이카 실버 모노'
};
// 스튜디오 테마(에디토리얼·시네마·감성 계열) 색감·질감. 구간 내내 고르게 입힌다.
const lookKinds=new Set([
  'grain','warm','matte','mono','vignette',
  'kodak','tealOrange','kyoto','blush','moody','forest','sunset','midnight','pastel','vivid','vhs','leicaMono',
  'bokeh','snow','sparks','letterbox','scanline','prism',
  'cutoutBlur','cutoutDark','cutoutCream','cutoutOutline','cutoutBehindText'
]);
const effectRecipes=[
  // 인물 컷아웃 (AI 배경 제거 5종 — 무료 브라우저 GPU 처리)
  {kind:'cutoutBlur',duration:Infinity,strength:.85,tab:'cutout'},
  {kind:'cutoutBehindText',duration:Infinity,strength:1,tab:'cutout'},
  {kind:'cutoutDark',duration:Infinity,strength:1,tab:'cutout'},
  {kind:'cutoutCream',duration:Infinity,strength:1,tab:'cutout'},
  {kind:'cutoutOutline',duration:Infinity,strength:.9,tab:'cutout'},
  // 영상 효과 (18종)
  {kind:'leak',duration:.85,strength:.9},
  {kind:'slice',duration:.46,strength:.8},
  {kind:'flash',duration:.24,strength:.75},
  {kind:'zoom',duration:.48,strength:.65},
  {kind:'zoomOut',duration:.55,strength:.65},
  {kind:'blurPull',duration:.65,strength:.8},
  {kind:'echo',duration:.4,strength:.55},
  {kind:'rgbSplit',duration:.38,strength:.75},
  {kind:'bloom',duration:.8,strength:.75},
  {kind:'bokeh',duration:Infinity,strength:.75},
  {kind:'snow',duration:Infinity,strength:.75},
  {kind:'sparks',duration:Infinity,strength:.75},
  {kind:'letterbox',duration:Infinity,strength:.85},
  {kind:'scanline',duration:Infinity,strength:.65},
  {kind:'prism',duration:Infinity,strength:.75},
  {kind:'flash',duration:.267,strength:.41,tint:'#ffda91',label:'폴라로이드 · 골든 플래시'},
  {kind:'dip',duration:.65,strength:1,tint:'#06070a',label:'블랙 딥'},
  {kind:'dip',duration:.55,strength:1,tint:'#fff',label:'화이트 딥'},
  // 테마 색감 (18종 — 스튜디오 16색감 + 필름 룩)
  {kind:'kodak',duration:Infinity,strength:.8,tab:'theme'},
  {kind:'tealOrange',duration:Infinity,strength:.8,tab:'theme'},
  {kind:'kyoto',duration:Infinity,strength:.8,tab:'theme'},
  {kind:'blush',duration:Infinity,strength:.75,tab:'theme'},
  {kind:'moody',duration:Infinity,strength:.8,tab:'theme'},
  {kind:'forest',duration:Infinity,strength:.75,tab:'theme'},
  {kind:'sunset',duration:Infinity,strength:.8,tab:'theme'},
  {kind:'midnight',duration:Infinity,strength:.8,tab:'theme'},
  {kind:'pastel',duration:Infinity,strength:.75,tab:'theme'},
  {kind:'vivid',duration:Infinity,strength:.8,tab:'theme'},
  {kind:'vhs',duration:Infinity,strength:.8,tab:'theme'},
  {kind:'leicaMono',duration:Infinity,strength:.9,tab:'theme'},
  {kind:'grain',duration:Infinity,strength:.7,tab:'theme'},
  {kind:'warm',duration:Infinity,strength:.8,tab:'theme'},
  {kind:'matte',duration:Infinity,strength:.8,tab:'theme'},
  {kind:'mono',duration:Infinity,strength:1,tab:'theme'},
  {kind:'vignette',duration:Infinity,strength:.7,tab:'theme'},
  {kind:'flash',duration:.9,strength:.9,tint:'#f4ece0',label:'인화 페이드인',tab:'theme'}
];
let grainTile=null, scanlineTile=null, bokehSprite=null, fxMiniBlur=null;
function getScanlineTile(){
  if(scanlineTile)return scanlineTile;
  scanlineTile=document.createElement('canvas');scanlineTile.width=4;scanlineTile.height=64;
  const g=scanlineTile.getContext('2d');g.fillStyle='#000';
  for(let y=0;y<64;y+=4)g.fillRect(0,y,4,1.5);
  return scanlineTile;
}
function getBokehSprite(){
  if(bokehSprite)return bokehSprite;
  bokehSprite=document.createElement('canvas');bokehSprite.width=bokehSprite.height=64;
  const g=bokehSprite.getContext('2d'),rg=g.createRadialGradient(32,32,0,32,32,32);
  rg.addColorStop(0,'rgba(255,232,188,0.45)');rg.addColorStop(0.65,'rgba(255,232,188,0.14)');rg.addColorStop(1,'rgba(255,232,188,0)');
  g.fillStyle=rg;g.fillRect(0,0,64,64);
  return bokehSprite;
}
function getFxBlurCanvas(w,h){
  if(!fxMiniBlur)fxMiniBlur=document.createElement('canvas');
  if(fxMiniBlur.width!==w||fxMiniBlur.height!==h){fxMiniBlur.width=w;fxMiniBlur.height=h;}
  return fxMiniBlur;
}
function paintLook(ctx,kind,amount,time,w,h){
  if(kind==='grain'){
    if(!grainTile){
      grainTile=document.createElement('canvas');grainTile.width=grainTile.height=160;
      const g=grainTile.getContext('2d'),im=g.createImageData(160,160);
      for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}
      g.putImageData(im,0,0);
    }
    const cell=Math.max(160,Math.round(w/6.75)),ox=Math.floor((Math.sin(time*37.1)*.5+.5)*cell),oy=Math.floor((Math.cos(time*23.7)*.5+.5)*cell);
    ctx.globalAlpha=.24*amount;ctx.globalCompositeOperation='overlay';
    for(let y=-oy;y<h;y+=cell)for(let x=-ox;x<w;x+=cell)ctx.drawImage(grainTile,x,y,cell,cell);
  }else if(kind==='warm'){
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(255,196,140,${.32*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(60,44,30,${.16*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='matte'){
    ctx.globalCompositeOperation='saturation';ctx.fillStyle=`rgba(128,128,128,${.28*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(72,62,52,${.24*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(246,236,220,${.3*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='mono'){
    ctx.globalCompositeOperation='saturation';ctx.fillStyle=`rgba(128,128,128,${amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(20,20,20,${.25*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='leicaMono'){
    ctx.globalCompositeOperation='saturation';ctx.fillStyle=`rgba(128,128,128,${amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='overlay';ctx.fillStyle=`rgba(28,28,32,${.34*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='vignette'){
    const g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.32,w/2,h/2,Math.hypot(w,h)*.55);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${.6*amount})`);
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  }else if(kind==='kodak'){
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(255,204,112,${.38*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='overlay';ctx.fillStyle=`rgba(210,140,70,${.16*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='tealOrange'){
    const g=ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,`rgba(255,148,72,${.34*amount})`);g.addColorStop(1,`rgba(18,128,148,${.38*amount})`);
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  }else if(kind==='kyoto'){
    ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(84,74,60,${.18*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(236,222,196,${.36*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='blush'){
    ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(255,196,214,${.18*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(248,176,196,${.32*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='moody'){
    ctx.globalCompositeOperation='multiply';ctx.fillStyle=`rgba(34,38,48,${.28*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='overlay';ctx.fillStyle=`rgba(18,22,30,${.26*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='forest'){
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(32,126,92,${.36*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='multiply';ctx.fillStyle=`rgba(26,48,40,${.16*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='sunset'){
    const g=ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,`rgba(255,118,64,${.36*amount})`);g.addColorStop(1,`rgba(164,58,92,${.28*amount})`);
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  }else if(kind==='midnight'){
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(34,74,158,${.42*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='multiply';ctx.fillStyle=`rgba(20,30,58,${.22*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='pastel'){
    ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(244,238,248,${.22*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(232,224,255,${.24*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='vivid'){
    ctx.globalCompositeOperation='overlay';ctx.fillStyle=`rgba(255,244,230,${.18*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(255,180,140,${.16*amount})`;ctx.fillRect(0,0,w,h);
  }else if(kind==='vhs'){
    ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(128,48,148,${.14*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(92,164,196,${.26*amount})`;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.18*amount;
    const pat=ctx.createPattern(getScanlineTile(),'repeat');
    if(pat){ctx.fillStyle=pat;ctx.fillRect(0,0,w,h);}
  }else if(kind==='bokeh'){
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=.72*amount;
    const spr=getBokehSprite();
    for(let i=0;i<10;i++){
      const x=((Math.sin(i*12.7+time*.28)*.5+.5)*w),y=((Math.cos(i*9.3+time*.22)*.5+.5)*h);
      const d=w*(.09+(i%4)*.045);
      ctx.drawImage(spr,x-d/2,y-d/2,d,d);
    }
  }else if(kind==='snow'){
    ctx.fillStyle=`rgba(255,255,255,${.78*amount})`;
    ctx.beginPath();
    for(let i=0;i<28;i++){
      const sx=((i*97.3+Math.sin(time*1.3+i)*22)%w+w)%w;
      const sy=((i*53.1+time*(55+(i%4)*24))%h+h)%h;
      const r=1.4+(i%3)*1.1;
      ctx.moveTo(sx+r,sy);ctx.arc(sx,sy,r,0,Math.PI*2);
    }
    ctx.fill();
  }else if(kind==='sparks'){
    ctx.globalCompositeOperation='screen';
    ctx.strokeStyle=`rgba(255,236,168,${.85*amount})`;ctx.lineWidth=1.5;
    ctx.beginPath();
    for(let i=0;i<14;i++){
      const pulse=Math.pow(Math.sin(time*3.2+i*1.9)*.5+.5,3);
      if(pulse<.2)continue;
      const sx=(Math.sin(i*43.1)*.45+.5)*w,sy=(Math.cos(i*29.7)*.45+.5)*h;
      const r=w*.018*pulse;
      ctx.moveTo(sx-r,sy);ctx.lineTo(sx+r,sy);ctx.moveTo(sx,sy-r);ctx.lineTo(sx,sy+r);
    }
    ctx.stroke();
  }else if(kind==='letterbox'){
    const bar=Math.round(h*.105*amount);
    ctx.fillStyle='#050507';ctx.fillRect(0,0,w,bar);ctx.fillRect(0,h-bar,w,bar);
  }else if(kind==='scanline'){
    ctx.globalAlpha=.28*amount;
    const pat=ctx.createPattern(getScanlineTile(),'repeat');
    if(pat){ctx.fillStyle=pat;ctx.fillRect(0,0,w,h);}
  }else if(kind==='prism'){
    const g=ctx.createLinearGradient(0,0,w,h*.55);
    g.addColorStop(0,`rgba(255,80,150,${.26*amount})`);
    g.addColorStop(.45,`rgba(80,210,255,${.22*amount})`);
    g.addColorStop(1,'rgba(255,220,90,0)');
    ctx.globalCompositeOperation='screen';ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  }
}

function outputTimeAt(s,sourceTime){
  let offset=0;
  for(const take of sequenceTakes(s)){
    if(sourceTime<=take.end)return offset+Math.max(0,sourceTime-take.start)/(take.owner.rate||1);
    offset+=takeDuration(take);
  }
  return offset;
}

function paintEffects(ctx,s,time,activeText){
  const {width:w,height:h}=ctx.canvas;
  for(const effect of s?.effects||[]){
    const phase=(time-effect.start)/effect.duration;
    if(phase<0 || phase>=1)continue;
    const look=lookKinds.has(effect.kind);
    const amount=look?effect.strength:effect.strength*(effect.kind==='flash'||effect.kind==='blurPull'?1-phase:Math.sin(Math.PI*phase));
    if(!amount)continue;
    ctx.save();
    if(window.arCutoutKinds && window.arCutoutKinds.has(effect.kind) && typeof window.arPaintCutoutEffect==='function'){
      window.arPaintCutoutEffect(ctx,effect.kind,amount,time,s?.clip,activeText);
    }else if(look){
      paintLook(ctx,effect.kind,amount,time,w,h);
    }else if(effect.kind==='flash' || effect.kind==='dip'){
      ctx.globalAlpha=amount;ctx.fillStyle=effect.tint||'white';ctx.fillRect(0,0,w,h);
    }else if(effect.kind==='leak'){
      lightSweep(ctx,phase,effect.strength);
    }else if(effect.kind==='slice'){
      const shift=Math.round(w*.095*amount*(1-phase));
      for(const [y,height,direction] of [[.18,.16,1],[.43,.23,-1],[.76,.09,1]]){
        const dy=Math.round(h*y),band=Math.round(h*height),dx=direction*shift;
        if(shift)ctx.drawImage(ctx.canvas,Math.max(0,-dx),dy,w-shift,band,Math.max(0,dx),dy,w-shift,band);
      }
    }else if(effect.kind==='zoom'){
      const z=1+amount*.32;
      ctx.drawImage(ctx.canvas,(w-w/z)/2,(h-h/z)/2,w/z,h/z,0,0,w,h);
    }else if(effect.kind==='zoomOut'){
      const z=1+(1-phase)*effect.strength*.24;
      ctx.drawImage(ctx.canvas,(w-w/z)/2,(h-h/z)/2,w/z,h/z,0,0,w,h);
    }else if(effect.kind==='blurPull'){
      const bw=Math.max(42,Math.round(w*(0.35-0.25*amount))),bh=Math.max(74,Math.round(h*(0.35-0.25*amount)));
      const mini=getFxBlurCanvas(bw,bh);mini.getContext('2d').drawImage(ctx.canvas,0,0,bw,bh);
      ctx.imageSmoothingEnabled=true;ctx.drawImage(mini,0,0,w,h);
    }else if(effect.kind==='rgbSplit'){
      const off=Math.round(w*.024*amount);
      ctx.globalCompositeOperation='screen';ctx.globalAlpha=.38*amount;
      ctx.drawImage(ctx.canvas,-off,0,w,h);
      ctx.fillStyle='rgba(255,40,90,0.14)';ctx.fillRect(0,0,w,h);
      ctx.drawImage(ctx.canvas,off,0,w,h);
    }else if(effect.kind==='bloom'){
      const mini=getFxBlurCanvas(90,160);mini.getContext('2d').drawImage(ctx.canvas,0,0,90,160);
      ctx.globalCompositeOperation='screen';ctx.globalAlpha=.42*amount;
      ctx.imageSmoothingEnabled=true;ctx.drawImage(mini,0,0,w,h);
    }else{
      ctx.globalAlpha=.48*amount;ctx.drawImage(ctx.canvas,w*.045*amount,0,w,h);
    }
    ctx.restore();
  }
}

function editableEffects(){
  return quickEdit && session?.clip && !session.exporting && !session.adding && !session.postBusy;
}
function redrawEffects(s){
  renderEffectLanes(s);
  if(typeof renderMixActions==='function')renderMixActions(s);
  markEdited();
  if(s.joined || s.timelineCuts)seekCutTrack(s,s.trackTime||0);
  else renderPreview();
}
function renderEffectLanes(s){
  const panel=byId('fxPanel'),inspector=byId('fxInspector'),lanes=byId('fxLanes');
  panel.hidden=!s?.clip || !(byId('mixDialog').open && byId('mixTitle').textContent==='효과');
  lanes.replaceChildren();inspector.hidden=true;
  if(!s?.clip)return;
  const takes=sequenceTakes(s),total=sequenceDuration(takes);
  let offset=0;
  for(const take of takes){
    const clip=take.owner,peak=clip.peak,rate=clip.rate||1;
    if(clip.montage && clip.peakEffect && Number.isFinite(peak)){
      const from=Math.max(take.start,peak-1.1),to=Math.min(take.end,peak+.12);
      if(to>from){
        const start=offset+(from-take.start)/rate;
        const marker=document.createElement('button');marker.type='button';marker.className='peak-block';
        marker.textContent='하이라이트';marker.setAttribute('aria-label','자동 하이라이트 '+cutClock(start));
        positionBlock(marker,start,(to-from)/rate,total);
        const cursor=Math.min(total,offset+Math.max(0,Math.min(take.end,peak)-take.start)/rate);
        marker.addEventListener('click',()=>{if(editableEffects()){seekCutTrack(s,cursor);selectMix(s,'effect');}});
        lanes.append(marker);
      }
    }
    offset+=takeDuration(take);
  }
  if(!s.effects?.length && !lanes.children.length){
    const add=document.createElement('button');add.type='button';
    add.className='fx-empty';add.textContent='＋ 효과 추가';
    add.addEventListener('click',()=>{if(editableEffects()){selectMix(s,'effect');effectDialog();}});
    lanes.append(add);
  }
  for(const effect of s.effects||[]){
    const row=document.createElement('div'),bar=document.createElement('button');
    row.className='fx-lane';bar.className='fx-block';bar.type='button';
    const name=effect.label||effectNames[effect.kind];
    bar.textContent=name;bar.setAttribute('aria-label',name+' '+effect.start.toFixed(2)+'초');
    bar.setAttribute('aria-pressed',String(s.selectedEffect===effect));
    const place=()=>{
      bar.style.left=(100*Math.min(total,effect.start)/total)+'%';
      bar.style.width=(100*Math.max(0,Math.min(effect.duration,total-effect.start))/total)+'%';
    };
    place();row.append(bar);lanes.append(row);
    const select=()=>{if(!editableEffects())return;s.selectedEffect=effect;renderEffectLanes(s);};
    bar.addEventListener('click',select);
    bar.addEventListener('pointerdown',event=>{
      if(!editableEffects() || event.button!==0)return;
      const before=effect.start,length=effect.duration,x=event.clientX,width=row.getBoundingClientRect().width;
      const rect=bar.getBoundingClientRect();
      const edge=rect.width>=36 && x-rect.left<10?'start':rect.width>=36 && rect.right-x<10?'end':'move';
      bar.setPointerCapture(event.pointerId);
      bar.onpointermove=e=>{
        const delta=(e.clientX-x)*total/width;
        if(edge==='start'){
          effect.start=Math.max(0,Math.min(before+length-.05,before+delta));
          effect.duration=before+length-effect.start;
        }else if(edge==='end')effect.duration=Math.max(.05,Math.min(total-before,length+delta));
        else effect.start=Math.max(0,Math.min(total-effect.duration,before+delta));
        place();
      };
      const finish=cancel=>{
        bar.onpointermove=bar.onpointerup=bar.onpointercancel=null;
        if(cancel){effect.start=before;effect.duration=length;}
        s.selectedEffect=effect;
        if(effect.start!==before || effect.duration!==length)redrawEffects(s);else renderEffectLanes(s);
      };
      bar.onpointerup=()=>finish(false);bar.onpointercancel=()=>finish(true);
    });
    if(s.selectedEffect===effect){
      inspector.hidden=false;byId('fxName').textContent=name;
      byId('fxStart').value=effect.start.toFixed(2);
      byId('fxDuration').value=effect.duration.toFixed(2);
      byId('fxStrength').value=Math.round(100*effect.strength);
    }
  }
}

if(quickEdit){
  const option=(label,index)=>{
    const button=document.createElement('button');
    button.type='button';button.textContent=label;button.dataset.kind=effectRecipes[index].kind;button.dataset.recipe=index;
    button.setAttribute('aria-label',label+' 효과 추가');
    button.addEventListener('click',()=>addEffect(effectRecipes[index]));
    byId('fxPresetList').append(button);
  };
  effectRecipes.forEach((recipe,i)=>option(recipe.label||effectNames[recipe.kind],i));
  fetch('/assets/reference-styles.json').then(response=>response.json()).then(styles=>{
    for(const style of styles)for(const recipe of style.effects||[]){
      if(!Object.hasOwn(effectNames,recipe.kind) || !Number.isFinite(recipe.duration) || !Number.isFinite(recipe.strength))continue;
      option(style.name+' · '+effectNames[recipe.kind],effectRecipes.push(recipe)-1);
    }
  }).catch(()=>{});
  function addEffect(recipe){
    if(!editableEffects())return;
    const s=session,total=sequenceDuration(sequenceTakes(s));
    if(!recipe||total<.05)return;
    if(window.arCutoutKinds && window.arCutoutKinds.has(recipe.kind) && typeof window.arEnsureCutoutModel==='function'){
      window.arEnsureCutoutModel(false);
    }
    const duration=Math.min(recipe.duration,total);
    const effect={...recipe,start:Math.min(s.trackTime||0,total-duration),duration};
    (s.effects||=[]).push(effect);s.selectedEffect=effect;redrawEffects(s);
  }
  byId('fxInspector').addEventListener('change',e=>{
    if(!editableEffects())return;
    const s=session,fx=s.selectedEffect,v=e.target.valueAsNumber,total=sequenceDuration(sequenceTakes(s));
    if(!fx||!Number.isFinite(v)){renderEffectLanes(s);return;}
    if(e.target.id==='fxStart')fx.start=Math.max(0,Math.min(total-fx.duration,v));
    if(e.target.id==='fxDuration')fx.duration=Math.max(.05,Math.min(total-fx.start,v));
    if(e.target.id==='fxStrength')fx.strength=Math.min(1,Math.max(0,v/100));
    redrawEffects(s);
  });
  byId('fxCopy').addEventListener('click',()=>{
    if(!editableEffects()||!session.selectedEffect)return;
    const s=session,original=s.selectedEffect,total=sequenceDuration(sequenceTakes(s));
    const duration=Math.min(total,original.duration);
    const copy={...original,duration,start:Math.max(0,Math.min(total-duration,original.start+duration))};
    s.effects.push(copy);s.selectedEffect=copy;redrawEffects(s);
  });
  byId('fxRemove').addEventListener('click',()=>{
    if(!editableEffects())return;
    const s=session;s.effects=s.effects.filter(fx=>fx!==s.selectedEffect);
    s.selectedEffect=s.effects.at(-1);redrawEffects(s);
  });
}
