function cutClock(seconds) {
  const tenths=Math.floor(Math.max(0,seconds)*10+.001);
  return Math.floor(tenths/600)+':'+String(Math.floor(tenths/10)%60).padStart(2,'0')+'.'+tenths%10;
}
function takeDuration(take) { return (take.end-take.start)/(take.owner.rate||1); }

function trackPosition(takes,time) {
  let offset=0;
  for(let i=0;i<takes.length;i++) {
    const take=takes[i], end=offset+takeDuration(take);
    if(time<end-.00001 || i===takes.length-1) {
      const sourceTime=Math.min(take.end, take.start+Math.max(0,time-offset)*(take.owner.rate||1));
      return {i,offset,take,sourceTime};
    }
    offset=end;
  }
}
function trackTime(s,time,updateSelection=true) {
  const takes=sequenceTakes(s),total=sequenceDuration(takes);
  s.trackTime=Math.min(total,Math.max(0,time));
  const pos=trackPosition(takes,s.trackTime);
  if(!pos) return;
  const cursor=byId('trackCursor');
  byId('trackNeedle').style.left=(100*s.trackTime/total)+'%';
  cursor.max=total;cursor.value=s.trackTime;cursor.disabled=false;
  byId('trackTime').textContent=cutClock(s.trackTime)+' / '+cutClock(total);
  if(updateSelection) {
    const buttons=byId('trackClips').children;
    if(s.trackIndex!==pos.i || buttons[pos.i]?.getAttribute('aria-pressed')!=='true') {
      for(let i=0;i<buttons.length;i++) buttons[i].setAttribute('aria-pressed',String(i===pos.i));
      s.trackIndex=pos.i;
    }
    const head=buttons[pos.i]?.querySelector('progress');
    if(head)head.value=(pos.sourceTime-pos.take.start)/(pos.take.end-pos.take.start);
    byId('trackSplit').disabled=pos.sourceTime-pos.take.start<.10 || pos.take.end-pos.sourceTime<.10;
    byId('trackDelete').disabled=takes.length<=1;
    byId('trackLeft').disabled=pos.i===0;
    byId('trackRight').disabled=pos.i===takes.length-1;
    byId('trackUndo').disabled=!s.trackUndo?.length;
    if(byId('trackRedo'))byId('trackRedo').disabled=!s.trackRedo?.length;
    for(const b of document.querySelectorAll('#mixActions [data-mirrors]'))b.disabled=byId(b.dataset.mirrors).disabled;
  }
  return pos;
}

async function trackThumbnails(s,takes,buttons,signal) {
  const probe=document.createElement('video');
  probe.muted=true;probe.playsInline=true;
  try {
    for (const [index,take] of takes.entries()) {
      const canvas=buttons[index].querySelector('canvas'),ctx=canvas.getContext('2d');
      const cells=Math.max(1,Math.min(7,Math.round(buttons[index].clientWidth/55)));
      const cellWidth=64, cellHeight=50;
      canvas.width=cells*cellWidth;canvas.height=cellHeight;
      for(let n=0;n<cells;n++) {
        const at=take.start+(take.end-take.start)*(n+.5)/cells;
        await positionJoinedTake(probe,{...take,start:at},signal);
        signal.throwIfAborted();
        if(session!==s) return;
        const scale=Math.max(cellWidth/probe.videoWidth,cellHeight/probe.videoHeight);
        const w=cellWidth/scale,h=cellHeight/scale;
        ctx.drawImage(probe,(probe.videoWidth-w)/2,(probe.videoHeight-h)/2,w,h,n*cellWidth,0,cellWidth,cellHeight);
      }
    }
  } catch { /* 썸네일을 읽을 수 없어도 원본 클립을 편집할 수 있다. */ }
  finally {probe.removeAttribute('src');probe.load();}
}
function drawTrackWave(takes) {
  const canvas=byId('trackWave');
  canvas.hidden=!takes.some(t=>t.owner.keepAudio!==false && t.owner.audioLevels?.length);
  if(canvas.hidden)return;
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,total=sequenceDuration(takes);
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#65c8b7';
  let offset=0;
  for(const take of takes){
    const end=offset+takeDuration(take),levels=take.owner.audioLevels;
    if(take.owner.keepAudio!==false && levels?.length){
      for(let x=Math.ceil(w*offset/total);x<w*end/total;x+=3){
        const sec=take.start+(x*total/w-offset)*(take.owner.rate||1);
        const height=Math.max(1,Math.min(h,Math.sqrt(levels[Math.floor(sec*10)]||0)*h*2));
        ctx.fillRect(x,(h-height)/2,2,height);
      }
    }
    offset=end;
  }
}
function renderCutTrack(s) {
  if(!quickEdit || session!==s || !s?.clip) return;
  byId('emptyVideoPick').hidden=true;
  byId('cutTimeline').classList.add('has-media');
  byId('cutTimeline').hidden=false;
  const takes=sequenceTakes(s),strip=byId('trackClips');
  const key=takes.map(t=>[t.url,t.start,t.end,t.owner.rate].join('/')).join('|');
  if(s.trackKey!==key) {
    s.trackKey=key;s.trackThumbController?.abort();
    const buttons=takes.map((take,i)=>{
      const button=document.createElement('button'),canvas=document.createElement('canvas'),label=document.createElement('span');
      button.type='button';canvas.width=192;canvas.height=64;canvas.setAttribute('aria-hidden','true');
      const head=document.createElement('progress');head.max=1;head.value=0;head.setAttribute('aria-hidden','true');
      label.textContent=(i+1)+' · '+takeDuration(take).toFixed(1)+'초';button.append(canvas,label,head);
      button.setAttribute('aria-label','클립 '+(i+1)+' · '+takeDuration(take).toFixed(1)+'초');
      button.addEventListener('click',e=>{
        const rect=button.getBoundingClientRect(),fraction=e.detail?Math.max(0,Math.min(.999,(e.clientX-rect.left)/rect.width)):.5;
        seekCutTrack(s,sequenceDuration(takes.slice(0,i))+takeDuration(take)*fraction);
      });
      return button;
    });
    buttons.forEach((button,i)=>{button.style.flexGrow=takeDuration(takes[i]);});
    strip.replaceChildren(...buttons);
    byId('trackScale').replaceChildren(...[0,.25,.5,.75,1].map(f=>{
      const label=document.createElement('span');label.textContent=cutClock(sequenceDuration(takes)*f);return label;
    }));
    s.trackThumbController=new AbortController();
    trackThumbnails(s,takes,buttons,s.trackThumbController.signal);
  }
  updateAnalysisStatus(s);
  drawTrackWave(takes);
  renderEffectLanes(s);
  if(typeof renderMix==="function")renderMix(s);
  trackTime(s,s.trackTime||0);
}
function seekCutTrack(s,time) {
  if(session!==s || s.exporting || s.adding || s.postBusy) return;
  video.pause();stopJoinedPreview(s);
  if(s.trackAnalysisEdits)s.previewTouched=true;
  const pos=trackTime(s,time);
  if(!pos) return;
  if(s.joined || s.timelineCuts) showJoinedCover(s,{...pos.take,start:pos.sourceTime});
  else video.currentTime=pos.sourceTime;
}
function applyTrackTool(action) {
  const s=session;
  if(!s?.clip || s.exporting || s.adding || s.postBusy) return;
  const cuts=sequenceTakes(s).slice(), pos=trackPosition(cuts,s.trackTime||0);
  if(!pos) return;
  video.pause();stopJoinedPreview(s);
  let cursor=s.trackTime||0;
  s.trackUndo ||= [];
  s.trackRedo ||= [];
  if(action==='trackUndo'||action==='trackRedo') {
    const backwards=action==='trackUndo';
    const previous=(backwards?s.trackUndo:s.trackRedo).pop();if(!previous)return;
    (backwards?s.trackRedo:s.trackUndo).push({cuts:s.timelineCuts,cursor});
    s.timelineCuts=previous.cuts;cursor=previous.cursor;
  } else {
    const {i,take,sourceTime}=pos;
    if(action==='trackSplit') {
      if(sourceTime-take.start<.1 || take.end-sourceTime<.1) return;
      cuts.splice(i,1,{...take,end:sourceTime},{...take,start:sourceTime});
    } else if(action==='trackDelete') {
      if(cuts.length<2) return;
      cuts.splice(i,1);cursor=Math.min(pos.offset,sequenceDuration(cuts));
    } else {
      const to=i+(action==='trackLeft'?-1:1);
      if(!cuts[to]) return;
      [cuts[i],cuts[to]]=[cuts[to],cuts[i]];
      cursor=sequenceDuration(cuts.slice(0,to))+(cursor-pos.offset);
    }
    s.trackRedo=[];s.trackUndo.push({cuts:s.timelineCuts,cursor:s.trackTime||0});
    if(s.trackUndo.length>50)s.trackUndo.shift();
    s.timelineCuts=cuts;
  }
  byId('work').classList.toggle('cut-arranged',!!s.timelineCuts);
  s.trackTime=cursor;
  markEdited();renderCutTrack(s);seekCutTrack(s,cursor);
  detail(s,'편집본 '+sequenceDuration(sequenceTakes(s)).toFixed(1)+'초');
}

if(quickEdit) {
  byId('trackTools').addEventListener('click',e=>{const button=e.target.closest('button');if(button)applyTrackTool(button.id);});
  byId('trackCursor').addEventListener('input',e=>{if(session?.clip)seekCutTrack(session,e.target.valueAsNumber);});
  video.addEventListener('timeupdate',()=>{
    const s=session;
    if(!s?.clip || s.joined || s.timelineCuts) return;
    const takes=sequenceTakes(s),t=video.currentTime;
    let offset=0;
    for(const take of takes) {
      if(t<=take.end+.001){trackTime(s,offset+Math.max(0,t-take.start)/(take.owner.rate||1));break;}
      offset+=takeDuration(take);
    }
  });
}

function emptyCutTrack() {
  if(!quickEdit)return;
  document.querySelector('.stage').hidden=false;
  byId('analysisInfo').hidden=true;
  renderEffectLanes(null);
  byId('emptyVideoPick').hidden=false;
  byId('cutTimeline').classList.remove('has-media');
  byId('trackWave').hidden=true;byId('trackScale').replaceChildren();
  byId('editSettings').open=false;
  byId('cutTimeline').hidden=false;
  byId('trackClips').replaceChildren();byId('trackCursor').value=0;byId('trackCursor').disabled=true;
  byId('trackTime').textContent='0:00.0 / 0:00.0';
  for(const button of byId('trackTools').children)button.disabled=true;
}
if(quickEdit) {
  byId('emptyVideoPick').addEventListener('click',()=>fileInput.click());
  byId('back').addEventListener('click',emptyCutTrack);
  byId('back').textContent='‹ 다른 영상 선택';
  document.querySelector('.stage').after(byId('cutTimeline'));
  byId('dockFile').addEventListener('click',()=>byId('joinFiles').click());
  emptyCutTrack();
}
