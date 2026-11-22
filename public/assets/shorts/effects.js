const effectNames={flash:'플래시',zoom:'펀치 줌',echo:'이중상'};
const effectRecipes=[
  {kind:'flash',duration:.24,strength:.75},
  {kind:'zoom',duration:.48,strength:.65},
  {kind:'echo',duration:.4,strength:.55},
  {kind:'flash',duration:.267,strength:.41,tint:'#ffda91',label:'폴라로이드 · 골든 플래시'}
];

function outputTimeAt(s,sourceTime){
  let offset=0;
  for(const take of sequenceTakes(s)){
    if(sourceTime<=take.end)return offset+Math.max(0,sourceTime-take.start)/(take.owner.rate||1);
    offset+=takeDuration(take);
  }
  return offset;
}

function paintEffects(ctx,s,time){
  const {width:w,height:h}=ctx.canvas;
  for(const effect of s?.effects||[]){
    const phase=(time-effect.start)/effect.duration;
    if(phase<0 || phase>=1)continue;
    const amount=effect.strength*(effect.kind==='flash'?1-phase:Math.sin(Math.PI*phase));
    if(!amount)continue;
    ctx.save();
    if(effect.kind==='flash'){
      ctx.globalAlpha=amount;ctx.fillStyle=effect.tint||'white';ctx.fillRect(0,0,w,h);
    }else if(effect.kind==='zoom'){
      const z=1+amount*.32;
      ctx.drawImage(ctx.canvas,(w-w/z)/2,(h-h/z)/2,w/z,h/z,0,0,w,h);
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
  markEdited();
  if(s.joined || s.timelineCuts)seekCutTrack(s,s.trackTime||0);
  else renderPreview();
}
function renderEffectLanes(s){
  const panel=byId('fxPanel'),inspector=byId('fxInspector'),lanes=byId('fxLanes');
  panel.hidden=!s?.clip;
  lanes.replaceChildren();inspector.hidden=true;
  if(panel.hidden)return;
  if(!s.effects?.length){
    const empty=document.createElement('div');
    empty.className='fx-empty';empty.textContent='효과 트랙';lanes.append(empty);
  }
  const total=sequenceDuration(sequenceTakes(s));
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
    button.type='button';button.textContent=label;button.dataset.kind=effectRecipes[index].kind;
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
