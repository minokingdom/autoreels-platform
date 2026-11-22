// 전환은 두 컷의 원본 위치를 기준으로 연결한다. 앞쪽 편집으로 시간이 바뀌어도 따라간다.
const cutStyles={push:'휩 슬라이드',burn:'필름 번',iris:'원형 열기',dissolve:'디졸브',none:'하드 컷'};

function cutBoundaries(s){
  const takes=sequenceTakes(s),cuts=[];
  let start=0;
  for(let i=1;i<takes.length;i++){
    const before=takes[i-1],after=takes[i];
    start+=takeDuration(before);
    const key=JSON.stringify([before.url,before.end,after.url,after.start]);
    cuts.push({before,after,start,key,index:i,max:Math.min(1.5,takeDuration(after))});
  }
  return cuts;
}

function lightSweep(ctx,phase,strength){
  const {width:w,height:h}=ctx.canvas;
  const x=w*(-.85+phase*2.7);
  const glow=ctx.createLinearGradient(x-w*.62,0,x+w*.62,h*.18);
  glow.addColorStop(0,'rgba(255,82,30,0)');glow.addColorStop(.36,'rgba(255,104,36,.55)');
  glow.addColorStop(.56,'rgba(255,226,153,.96)');glow.addColorStop(1,'rgba(250,87,47,0)');
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=strength*Math.sin(Math.PI*phase);
  ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);ctx.restore();
}

// 현재 프레임 위에 이전 컷의 마지막 프레임을 합성한다. 미리보기와 MP4가 같은 함수를 쓴다.
function compositeCut(ctx,previous,kind,phase){
  if(kind==='none'||phase>=1)return;
  const {width:w,height:h}=ctx.canvas;
  const t=Math.min(1,Math.max(0,phase)),ease=t*t*(3-2*t);
  ctx.save();
  if(kind==='push'){
    const d=Math.round(w*ease);
    if(d>0 && d<w)ctx.drawImage(ctx.canvas,0,0,d,h,w-d,0,d,h);
    if(d<w)ctx.drawImage(previous,-d,0,w,h);
  }else if(kind==='iris'){
    ctx.beginPath();ctx.rect(0,0,w,h);
    ctx.moveTo(w/2+Math.hypot(w,h)*ease/2,h/2);
    ctx.arc(w/2,h/2,Math.hypot(w,h)*ease/2,0,2*Math.PI);
    ctx.clip('evenodd');ctx.drawImage(previous,0,0,w,h);
  }else{
    ctx.globalAlpha=1-ease;ctx.drawImage(previous,0,0,w,h);
    ctx.globalAlpha=1;if(kind==='burn')lightSweep(ctx,t,1);
  }
  ctx.restore();
}

function renderCutMarkers(s){
  const layer=byId('cutMarkers');layer.replaceChildren();
  if(!s?.clip)return;
  const total=mixTotal(s);
  s.visibleTransitions=[];
  for(const cut of cutBoundaries(s)){
    const effect=s.cutTransitions?.get(cut.key);
    if(effect)s.visibleTransitions.push({...effect,start:cut.start,duration:Math.min(cut.max,effect.duration)});
    const name=effect?cutStyles[effect.kind]:'전환 추가';
    const marker=mixButton(effect?'◆':'＋',()=>openCutPicker(s,cut),'cut-marker');
    marker.setAttribute('aria-label',cutClock(cut.start)+' 컷 경계 · '+name);
    marker.classList.toggle('applied',!!effect);marker.style.left=100*cut.start/total+'%';
    layer.append(marker);
  }
}

async function cutStill(take,time,canvas,signal){
  const media=document.createElement('video');media.muted=true;media.playsInline=true;
  try{
    await positionJoinedTake(media,{...take,start:time},signal);
    signal.throwIfAborted();drawQuickFrame(canvas.getContext('2d'),media,1);
  }finally{media.removeAttribute('src');media.load();}
}
function cutCanvas(width){
  const c=document.createElement('canvas');c.width=width;c.height=Math.round(width*16/9);return c;
}
function openCutPicker(s,cut){
  if(!editableEffects())return;
  video.pause();stopJoinedPreview(s);
  const cuts=cutBoundaries(s);
  cut=cut||cuts.reduce((best,c)=>!best||Math.abs(c.start-s.trackTime)<Math.abs(best.start-s.trackTime)?c:best,null);
  if(!cut){
    const box=mixDialog('장면 전환',null),total=mixTotal(s);
    const current=s.trackTime||0;
    const at=current>.1 && total-current>.1?current:total/2;
    const split=mixButton(cutClock(at)+'에서 분할하고 전환 선택',()=>{
      seekCutTrack(s,at);applyTrackTool('trackSplit');if(cutBoundaries(s).length)openCutPicker(s);
    },'cut-split');
    split.disabled=total<.22*(1/(currentTake(s)?.take.owner.rate||1));box.append(split);return;
  }
  const old=s.cutTransitions?.get(cut.key);
  let kind=old?.kind||'push',ready=false;
  const box=mixDialog('장면 전환',()=>{
    if(!cutBoundaries(s).some(c=>c.key===cut.key) || (!ready && kind!=='none'))throw Error();
    s.cutTransitions||=new Map();
    if(kind==='none')s.cutTransitions.delete(cut.key);
    else s.cutTransitions.set(cut.key,{kind,duration:validDuration(),frame:previous});
    markEdited();renderCutTrack(s);seekCutTrack(s,cut.start+Math.min(cut.max,Number(duration.value))*.45);
  });
  const label=document.createElement('p');label.className='cut-pair';
  label.textContent='클립 '+cut.index+' → '+(cut.index+1)+' · '+cutClock(cut.start);
  const demo=cutCanvas(144);demo.className='cut-demo';demo.setAttribute('aria-label','두 컷의 전환 미리보기');
  const choices=document.createElement('div');choices.className='cut-choices';box.append(label,demo,choices);
  const duration=numField(box,'전환 길이(초)',Math.min(old?.duration||.55,cut.max),cut.max,Math.min(.05,cut.max));
  duration.addEventListener('input',()=>duration.setCustomValidity(''));
  const previous=old?.frame||cutCanvas(540),next=cutCanvas(180);
  let began=performance.now(),raf;
  const context=demo.getContext('2d');
  const validDuration=()=>Math.min(cut.max,Math.max(Math.min(.05,cut.max),Number(duration.value)||.55));
  duration.onchange=()=>{duration.value=validDuration();began=performance.now();};
  for(const [key,name] of Object.entries(cutStyles)){
    const b=mixButton(name,()=>{
      kind=key;began=performance.now();
      for(const item of choices.children)item.setAttribute('aria-pressed',String(item===b));
      duration.disabled=kind==='none';byId('mixDone').disabled=!ready && kind!=='none';
    });
    b.setAttribute('aria-pressed',String(key===kind));choices.append(b);
  }
  const dialog=byId('mixDialog'),controller=new AbortController();
  const done=byId('mixDone');done.disabled=true;
  const stop=()=>{done.disabled=false;controller.abort();cancelAnimationFrame(raf);dialog.removeEventListener('close',stop);s.controller.signal.removeEventListener('abort',stop);};
  dialog.addEventListener('close',stop,{once:true});s.controller.signal.addEventListener('abort',stop,{once:true});
  const render=now=>{
    if(!dialog.open||!demo.isConnected){stop();return;}
    const ms=validDuration()*1000;
    const phase=Math.max(0,Math.min(1,((now-began)%(ms+950)-350)/ms));
    context.drawImage(kind==='none' && phase===0?previous:next,0,0,demo.width,demo.height);
    compositeCut(context,previous,kind,phase);raf=requestAnimationFrame(render);
  };
  Promise.all([old?null:cutStill(cut.before,Math.max(cut.before.start,cut.before.end-.035),previous,controller.signal),
    cutStill(cut.after,Math.min(cut.after.end-.001,cut.after.start+.035),next,controller.signal)]).then(()=>{
    if(controller.signal.aborted)return;ready=true;done.disabled=false;began=performance.now();raf=requestAnimationFrame(render);
  }).catch(()=>{if(!controller.signal.aborted)byId('mixError').textContent='두 컷의 영상을 불러올 수 없어요.';});
}
