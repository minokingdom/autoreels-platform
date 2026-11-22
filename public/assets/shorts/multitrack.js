// 트랙 위치는 원본 시간이 아니라 최종 편집본의 초 단위 위치로 저장한다.
const mixNames={video:'영상',effect:'효과',sfx:'효과음',source:'원본 소리',music:'음악',caption:'자막'};
let mixLibrary, mixDialogSave, mixAudio;
const soundBuffers=new Map();
const mixButton=(name,action,cls)=>{
  const button=document.createElement('button');button.type='button';button.textContent=name;
  if(cls)button.className=cls;button.addEventListener('click',action);return button;
};
function mixTotal(s){return sequenceDuration(sequenceTakes(s));}
function activeCue(s,time){return s?.captions?.findLast(c=>c.start<=time && time<c.start+c.duration);}
function stopMixSounds(s){for(const node of s?.previewSounds||[])try{node.stop();}catch{} if(s)s.previewSounds=null;}
function scheduleSounds(s,context,destination,time){
  const nodes=[],total=mixTotal(s),now=context.currentTime;
  for(const cue of s.sounds||[]){
    const start=Math.max(time,cue.start),end=Math.min(total,cue.start+cue.duration);
    if(end<=start)continue;
    const source=context.createBufferSource(),gain=context.createGain();source.buffer=cue.buffer;
    gain.gain.value=.7;source.connect(gain).connect(destination);
    source.start(now+start-time,start-cue.start,end-start);nodes.push(source);
  }
  return nodes;
}
function previewSounds(s,time){
  stopMixSounds(s);
  if(s?.sounds?.length && mixAudio?.state==='running')s.previewSounds=scheduleSounds(s,mixAudio,mixAudio.destination,time);
}
function loadMixBuffer(url,signal){
  return fetch(url,{signal}).then(res=>{if(!res.ok)throw Error('소리를 불러올 수 없어요.');return res.arrayBuffer();})
    .then(bytes=>new OfflineAudioContext(1,1,22050).decodeAudioData(bytes));
}
function drawMixBuffer(canvas,buffer,seconds,color,loop){
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,data=buffer.getChannelData(0);
  ctx.clearRect(0,0,w,h);ctx.fillStyle=color;
  for(let x=0;x<w;x+=2){
    let at=x/w*seconds;if(loop)at%=buffer.duration;
    if(at>=buffer.duration)continue;
    const a=Math.floor(at*buffer.sampleRate),span=Math.max(1,Math.floor(seconds/w*2*buffer.sampleRate));
    let peak=0;
    for(let j=a;j<Math.min(data.length,a+span);j+=Math.max(1,Math.floor(span/24)))peak=Math.max(peak,Math.abs(data[j]));
    const size=Math.max(1,Math.sqrt(peak)*h);ctx.fillRect(x,(h-size)/2,1.5,size);
  }
}
function queueSourceWave(s,clip,file,duration){
  s.waveQueue=(s.waveQueue||Promise.resolve()).then(async()=>{
    if(session!==s)return;
    const {audioLevels}=await import('./montage.mjs?v=tracks1');
    clip.audioLevels=await audioLevels(file,duration);
    if(session===s && s.clip)renderCutTrack(s);
  }).catch(()=>{});
}
function renderMusicWave(s,total){
  const canvas=byId('musicWave'),url=s.clip.music;
  byId('musicLane').querySelector('span').textContent=url?(byId('music').selectedOptions[0]?.text||'배경 음악'):'＋ 음악';
  canvas.hidden=!url;
  if(!url){delete canvas.dataset.key;return;}
  const key=s.id+' '+url+' '+total;
  if(canvas.dataset.key===key)return;
  canvas.dataset.key=key;
  if(s.musicPreviewUrl!==url){
    s.musicPreviewUrl=url;s.musicPreview=loadMixBuffer(url,s.controller.signal);
  }
  s.musicPreview.then(buffer=>{
    if(canvas.dataset.key===key && session===s)drawMixBuffer(canvas,buffer,total,'#6fc28a',true);
  }).catch(()=>{if(canvas.dataset.key===key){canvas.hidden=true;delete canvas.dataset.key;}});
}
function showTools(target){
  if(!session?.clip)return;
  byId('editSettings').open=true;document.body.classList.add('show-tools');
  requestAnimationFrame(()=>byId(target)?.scrollIntoView({block:'nearest'}));
}
function mixDialog(title,saveFn){
  const dialog=byId('mixDialog');
  if(!dialog.open)dialog.showModal();
  byId('mixTitle').textContent=title;byId('mixError').textContent='';
  byId('mixOptions').replaceChildren();byId('fxPanel').hidden=true;
  mixDialogSave=saveFn;return byId('mixOptions');
}
function mixField(container,label,input){
  const el=document.createElement('label');el.append(label,input);container.append(el);return input;
}
function numField(container,label,value,max,min=0){
  const input=document.createElement('input');input.type='number';input.step='.01';input.min=min;input.max=max;input.value=Number(value.toFixed(3));
  return mixField(container,label,input);
}
function mixChanged(s){
  markEdited();renderCutTrack(s);seekCutTrack(s,s.trackTime||0);renderPreview();
}
function positionBlock(button,start,duration,total){
  button.style.left=(100*start/total)+'%';button.style.width=(100*Math.min(duration,total-start)/total)+'%';
}
function drawCues(s,type,total){
  const sound=type==='sfx',lane=byId(sound?'sfxLane':'captionLane');
  lane.replaceChildren();
  const cues=sound?(s.sounds||[]):(s.captions||[]);
  for(const cue of cues){
    if(cue.start>=total)continue;
    const name=sound?cue.name:cue.text;
    const button=mixButton(name,()=>{s.activeCue=cue;selectMix(s,type);editCue(s,type,cue);},'cue-block');
    button.setAttribute('aria-label',name+' '+cutClock(cue.start));
    button.setAttribute('aria-pressed',String(s.activeCue===cue));positionBlock(button,cue.start,cue.duration,total);
    if(sound){
      const wave=document.createElement('canvas');wave.width=120;wave.height=24;
      button.replaceChildren(wave);drawMixBuffer(wave,cue.buffer,cue.duration,'#bc86e9',false);
    }
    lane.append(button);
  }
  if(!sound){
    let offset=0;
    for(const take of sequenceTakes(s)){
      for(const line of take.owner.lines||[]){
        const start=Math.max(take.start,line.start),end=Math.min(take.end,line.end);
        if(!line.text||!take.owner.showCaptions||end<=start)continue;
        const button=mixButton(line.text,()=>editSourceCaption(s,line),'cue-block');
        positionBlock(button,offset+(start-take.start)/(take.owner.rate||1),(end-start)/(take.owner.rate||1),total);
        lane.prepend(button);
      }
      offset+=takeDuration(take);
    }
  }
  if(!lane.children.length)lane.append(mixButton(sound?'＋ 효과음':'＋ 자막',()=>{selectMix(s,type);editCue(s,type);},'mix-empty'));
}
function editSourceCaption(s,line){
  if(!editableEffects())return;
  const box=mixDialog('자막 편집',()=>{line.text=input.value.trim();mixChanged(s);});
  const input=mixField(box,'자막',document.createElement('input'));input.maxLength=240;input.value=line.text;
}
function editCue(s,type,cue){
  if(!editableEffects())return;
  const sound=type==='sfx',total=mixTotal(s);
  let choice,text,start,len;
  const box=mixDialog(mixNames[type],async()=>{
    const at=start.valueAsNumber;if(!Number.isFinite(at)||at<0||at>=total)throw Error('영상 안의 시작 시간을 입력해 주세요.');
    let data,duration;
    if(sound){
      const id=choice.value;if(!id)throw Error('효과음을 골라 주세요.');
      const url='/assets/sfx/'+id+'.wav';
      let buffer=soundBuffers.get(url);
      if(!buffer){buffer=await loadMixBuffer(url,s.controller.signal);soundBuffers.set(url,buffer);}
      data={buffer,id,name:choice.selectedOptions[0].text};duration=buffer.duration;
    }else{
      if(!text.value.trim())throw Error('자막을 입력해 주세요.');
      data={text:text.value.trim()};duration=len.valueAsNumber;
      if(!Number.isFinite(duration)||duration<=0)throw Error('자막 길이를 입력해 주세요.');
    }
    if(session!==s)return;
    const item=cue||{};Object.assign(item,data,{start:at,duration:Math.min(duration,total-at)});
    if(!cue)(sound?(s.sounds||=[]):(s.captions||=[])).push(item);
    s.activeCue=item;mixChanged(s);
  });
  if(sound){
    choice=mixField(box,'효과음 선택',document.createElement('select'));
    mixLibrary.then(library=>{for(const e of library.effects)choice.add(new Option(e.name,e.id));if(cue)choice.value=cue.id;}).catch(()=>{byId('mixError').textContent='효과음 목록을 불러올 수 없어요.';});
  }else{
    text=mixField(box,'자막',document.createElement('input'));text.maxLength=240;text.value=cue?.text||'';
  }
  start=numField(box,'시작(초)',cue?.start??Math.max(0,Math.min(s.trackTime||0,total-.1)),total);
  if(!sound)len=numField(box,'길이(초)',cue?.duration||Math.min(2,total),total,.01);
}
function effectDialog(tab='영상 효과'){
  const box=mixDialog('효과',null),nav=document.createElement('div');nav.className='fx-tabs';
  for(const name of ['영상 효과','전환','효과음']){
    const b=mixButton(name,()=>{if(name==='효과음'){selectMix(session,'sfx');editCue(session,'sfx');}else effectDialog(name);});
    b.setAttribute('aria-pressed',String(name===tab));nav.append(b);
  }
  box.append(nav);byId('fxPanel').hidden=false;
  const canvas=byId('overlay'),source=session.joined||session.timelineCuts?canvas:video;
  for(const button of byId('fxPresetList').children){
    button.hidden=(button.dataset.kind==='dip')!==(tab==='전환');
    let thumb=button.querySelector('canvas');
    if(!thumb){thumb=document.createElement('canvas');thumb.width=96;thumb.height=84;button.prepend(thumb);}
    const ctx=thumb.getContext('2d'),w=source.videoWidth||source.width,h=source.videoHeight||source.height;
    if(!w||!h)continue;
    const scale=Math.max(96/w,84/h)*(button.dataset.kind==='zoom'?1.25:1);
    ctx.drawImage(source,(96-w*scale)/2,(84-h*scale)/2,w*scale,h*scale);
    if(button.dataset.kind==='flash'){ctx.fillStyle='#ffe7a84d';ctx.fillRect(0,0,96,84);}
    if(button.dataset.kind==='dip'){ctx.fillStyle=button.textContent.includes('블랙')?'#0008':'#fff8';ctx.fillRect(0,0,96,84);}
    if(button.dataset.kind==='echo'){ctx.globalAlpha=.4;ctx.drawImage(thumb,5,0);ctx.globalAlpha=1;}
  }
}
function currentTake(s){return trackPosition(sequenceTakes(s),s.trackTime||0);}
function changeTake(s,replace){
  const cuts=sequenceTakes(s).slice(),pos=currentTake(s);
  if(!pos)return;
  s.trackRedo=[];(s.trackUndo||=[]).push({cuts:s.timelineCuts,cursor:s.trackTime||0});
  cuts[pos.i]=replace(pos.take);s.timelineCuts=cuts;
  byId('work').classList.add('cut-arranged');
  s.trackTime=Math.min(s.trackTime||0,mixTotal(s));mixChanged(s);
}
function pickSpeed(s){
  const box=mixDialog('클립 속도',()=>changeTake(s,t=>({...t,owner:{...t.owner,rate:Number(select.value)}})));
  const select=mixField(box,'재생 속도',document.createElement('select'));
  for(const value of [.5,.8,1,1.25,1.5,2])select.add(new Option(value+'×',value));
  select.value=currentTake(s).take.owner.rate||1;
}
function pickMusic(s){
  const box=mixDialog('배경 음악',()=>{
    byId('music').value=select.value;byId('music').dispatchEvent(new Event('input',{bubbles:true}));renderCutTrack(s);
  });
  const select=mixField(box,'곡 선택',byId('music').cloneNode(true));select.removeAttribute('id');select.value=s.clip.music||'';
}
function renderMixActions(s){
  const type=s.mixTrack||'video',panel=byId('mixActions');
  const call=id=>()=>byId(id).click();
  const selected=type==='sfx'?(s.sounds||[]):(s.captions||[]);
  const item=selected.includes(s.activeCue)?s.activeCue:selected.at(-1);
  const remove=()=>{if(item){selected.splice(selected.indexOf(item),1);s.activeCue=null;mixChanged(s);}};
  const tools={
    video:[['✂','분할',call('trackSplit')],['◴','속도',()=>pickSpeed(s)],['⇄','교체',()=>byId('mixReplace').click()],['⌫','삭제',call('trackDelete')]],
    effect:[['✧','효과 추가',effectDialog],['☷','강도',effectDialog],['▣','복제',call('fxCopy')],['⌫','삭제',call('fxRemove')]],
    sfx:[['＋','효과음 추가',()=>editCue(s,'sfx')],['⌁','효과음 편집',()=>editCue(s,'sfx',item)],['⌫','삭제',remove]],
    source:[['♩',currentTake(s)?.take.owner.keepAudio===false?'소리 켜기':'음소거',()=>changeTake(s,t=>({...t,owner:{...t.owner,keepAudio:t.owner.keepAudio===false}}))]],
    music:[['♫','곡 선택',()=>pickMusic(s)],['⌫','음악 제거',()=>{byId('music').value='';byId('music').dispatchEvent(new Event('input',{bubbles:true}));}]],
    caption:[['＋','자막 추가',()=>editCue(s,'caption')],['T','문구·시간',()=>editCue(s,'caption',item)],['⌫','삭제',remove]]
  };
  panel.replaceChildren(...tools[type].map(([icon,label,fn])=>{
    const button=mixButton(label,()=>{if(editableEffects())fn();});
    const i=document.createElement('i');i.textContent=icon;i.setAttribute('aria-hidden','true');button.prepend(i);
    if(type==='video' && (label==='분할'||label==='삭제')){
      button.dataset.mirrors=label==='분할'?'trackSplit':'trackDelete';button.disabled=byId(button.dataset.mirrors).disabled;
    }
    if(type==='effect' && label!=='효과 추가' && !s.selectedEffect)button.disabled=true;
    if((type==='sfx'||type==='caption')&&label==='삭제'&&!item)button.disabled=true;
    return button;
  }));
}
function selectMix(s,key){
  s.mixTrack=key;
  document.querySelectorAll('[data-track]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.track===key)));
  renderMixActions(s);
}
function renderMix(s){
  if(!s?.clip)return;
  const total=mixTotal(s);
  drawCues(s,'sfx',total);drawCues(s,'caption',total);renderMusicWave(s,total);
  byId('sourceLane').setAttribute('aria-label',currentTake(s)?.take.owner.keepAudio===false?'원본 소리 꺼짐':'원본 소리 편집');
  selectMix(s,s.mixTrack||'video');
}
if(quickEdit){
  const heading=document.querySelector('.track-heading');
  const settings=mixButton('☷',()=>showTools('editSettings'));settings.id='mixSettings';settings.setAttribute('aria-label','세부 편집 열기');
  const undo=byId('trackUndo');undo.textContent='↶';undo.setAttribute('aria-label','컷 편집 되돌리기');
  undo.addEventListener('click',()=>applyTrackTool('trackUndo'));
  const redo=mixButton('↷',()=>applyTrackTool('trackRedo'));redo.id='trackRedo';redo.disabled=true;redo.setAttribute('aria-label','컷 편집 다시 실행');
  heading.prepend(undo,redo,settings);heading.append(play);
  const fx=byId('fxPanel');byId('mixOptions').after(fx);fx.hidden=true;
  byId('mixPublish').hidden=false;byId('mixPublish').addEventListener('click',()=>showTools('quickPublish'));
  const close=mixButton('닫기',()=>document.body.classList.remove('show-tools'));close.id='mixHideTools';
  document.querySelector('.sheet').prepend(close);byId('trackTools').before(byId('mixActions'));byId('editSettings').append(byId('trackTools'));
  const replace=document.createElement('input');replace.id='mixReplace';replace.type='file';replace.accept='video/*';replace.hidden=true;document.body.append(replace);
  replace.addEventListener('change',async()=>{
    const s=session,file=replace.files[0];replace.value='';if(!file||!editableEffects())return;
    const url=URL.createObjectURL(file),probe=document.createElement('video');probe.muted=true;
    video.pause();stopJoinedPreview(s);s.adding=true;
    try{
      await awaitMedia(probe,'loadedmetadata',()=>{probe.src=url;},s.controller.signal);
      if(!Number.isFinite(probe.duration)||probe.duration<=0)throw Error();
      (s.replacementUrls||=[]).push(url);
      const owner={...currentTake(s).take.owner,start:0,end:probe.duration,lines:[],montage:null,audioLevels:null};
      changeTake(s,t=>({url,start:0,end:Math.min(t.end-t.start,probe.duration),owner}));
      queueSourceWave(s,owner,file,probe.duration);
    }catch{URL.revokeObjectURL(url);if(session===s){byId('mixError').textContent='다른 영상을 선택해 주세요.';detail(s,'교체할 영상을 열 수 없어요.');showTools('status');}}
    finally{probe.removeAttribute('src');probe.load();s.adding=false;if(s===session)seekCutTrack(s,s.trackTime||0);}
  });
  mixLibrary=fetch('/assets/audio-library.json').then(r=>r.json());
  mixLibrary.catch(()=>{});
  document.querySelectorAll('[data-track]').forEach(button=>button.addEventListener('click',()=>{
    if(!editableEffects())return;
    const s=session,type=button.dataset.track;selectMix(s,type);
    if(type==='effect'&&!s.effects?.length)effectDialog();
  }));
  byId('sourceLane').addEventListener('click',()=>{if(editableEffects())selectMix(session,'source');});
  byId('musicLane').addEventListener('click',()=>{if(editableEffects()){selectMix(session,'music');pickMusic(session);}});
  byId('mixClose').addEventListener('click',()=>byId('mixDialog').close());
  byId('mixDone').addEventListener('click',async()=>{
    if(!editableEffects())return;
    byId('mixDone').disabled=true;
    try{await mixDialogSave?.();byId('mixDialog').close();}
    catch{byId('mixError').textContent='입력한 시간과 미디어를 확인해 주세요.';}
    finally{byId('mixDone').disabled=false;}
  });
  play.addEventListener('click',()=>{
    if(session?.sounds?.length){
      mixAudio||=new AudioContext();mixAudio.resume().catch(()=>{});
    }
  },true);
  video.addEventListener('playing',()=>{if(session?.sounds?.length)previewSounds(session,outputTimeAt(session,video.currentTime));});
  video.addEventListener('pause',()=>stopMixSounds(session));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMixSounds(session);});
  byId('trackClips').addEventListener('click',()=>{if(session?.clip)selectMix(session,'video');});
  byId('fxLanes').addEventListener('pointerdown',()=>{if(session?.clip)selectMix(session,'effect');},true);
  byId('fxLanes').addEventListener('pointerup',()=>queueMicrotask(()=>{if(session?.clip)renderMixActions(session);}));
  byId('editor').addEventListener('input',()=>{if(session?.clip)renderMix(session);});
  byId('back').addEventListener('click',()=>document.body.classList.remove('show-tools'));
}
