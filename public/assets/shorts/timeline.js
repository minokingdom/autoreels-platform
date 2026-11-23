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
  const previous=s.trackTime;
  s.trackTime=Math.min(total,Math.max(0,time));
  const pos=trackPosition(takes,s.trackTime);
  if(!pos) return;
  const cursor=byId('trackCursor');
  byId('trackNeedle').style.left=(100*s.trackTime/total)+'%';
  // 재생선은 화면 가운데에 고정하고 타임라인이 그 밑으로 흘러간다.
  if(quickEdit)centerTrackScroll(s);
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
    for(const b of document.querySelectorAll('#mixActions [data-mirrors]'))mixOff(b,byId(b.dataset.mirrors).disabled);
  }
  return pos;
}

async function trackThumbnails(s,takes,buttons,signal) {
  const probe=document.createElement('video');
  probe.muted=true;probe.playsInline=true;
  try {
    for (const [index,take] of takes.entries()) {
      const canvas=buttons[index].querySelector('canvas'),ctx=canvas.getContext('2d');
      const cells=Math.max(1,Math.min(96,Math.ceil(buttons[index].clientWidth/55)));
      const cellWidth=64, cellHeight=50;
      canvas.width=cells*cellWidth;canvas.height=cellHeight;
      // 확대 직후에는 새 썸네일이 나올 때까지 이전 그림을 늘려서 보여 준다.
      const previous=s.prevThumbs?.[index];
      if(previous)ctx.drawImage(previous,0,0,canvas.width,canvas.height);
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
  finally {probe.removeAttribute('src');probe.load();if(!signal.aborted)s.prevThumbs=null;}
}
function drawTrackWave(takes) {
  const canvas=byId('trackWave'),label=byId('sourceWaveState');
  const waves=takes.map(t=>t.owner.waveform);
  const visible=waves.some(w=>w?.levels.length);
  const muted=takes.length>0 && takes.every(t=>t.owner.keepAudio===false);
  canvas.hidden=!visible;
  const reading=waves.some(w=>!w || w.state==='reading');
  const quiet=visible && !reading && !waves.some(w=>w?.peak>0);
  label.hidden=visible && !muted && !quiet;
  label.textContent=muted?'음소거':quiet?'무음':reading?'파형 읽는 중…':
    waves.length && waves.every(w=>w?.state==='no-audio')?'원본에 오디오 트랙 없음':'이 기기에서 파형을 읽을 수 없어요';
  if(!visible)return;
  const resolution=Math.min(8192,Math.max(640,Math.round(canvas.clientWidth*1.5)));
  if(canvas.width!==resolution)canvas.width=resolution;
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,total=sequenceDuration(takes);
  ctx.clearRect(0,0,w,h);
  const max=Math.max(.0001,...waves.map(w=>w?.peak||0));
  let offset=0;
  for(const take of takes){
    const end=offset+takeDuration(take),levels=take.owner.waveform?.levels;
    if(levels?.length){
      ctx.fillStyle=take.owner.keepAudio===false?'#677078':'#65d9c7';
      const rate=take.owner.rate||1;
      for(let x=Math.ceil(w*offset/total);x<w*end/total;x+=3){
        const sec=take.start+(x*total/w-offset)*rate;
        const start=Math.floor(sec*10);
        if(start>=levels.length)break;
        const stop=Math.min(levels.length,Math.ceil(Math.min(take.end,sec+3*total/w*rate)*10));
        let peak=0;
        for(let i=start;i<stop;i++)peak=Math.max(peak,levels[i]||0);
        const height=Math.max(1,Math.sqrt(peak/max)*(h-2));
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
    layoutTrackBoard(s,takes);
    s.trackThumbController=new AbortController();
    trackThumbnails(s,takes,buttons,s.trackThumbController.signal);
  }
  updateAnalysisStatus(s);
  drawTrackWave(takes);
  renderCutMarkers(s);
  renderEffectLanes(s);
  if(typeof renderMix==="function")renderMix(s);
  trackTime(s,s.trackTime||0);
}
// 1초가 차지하는 폭(px). 처음에는 화면에 약 6초가 보이고, 두 손가락으로 늘이거나 줄인다.
function trackPps(s) {
  const scroll=byId('trackScale').closest('.mix-scroll'),view=scroll.clientWidth||300;
  const total=sequenceDuration(sequenceTakes(s))||1;
  const min=Math.min(30,view*.8/total),max=260;
  if(!s.trackPps)s.trackPps=view/6;
  s.trackPps=Math.max(min,Math.min(max,s.trackPps));
  return s.trackPps;
}
function layoutTrackBoard(s,takes) {
  const total=sequenceDuration(takes), scale=byId('trackScale');
  const board=scale.closest('.track-board'),pps=trackPps(s);
  board.style.width=Math.round(total*pps)+'px';
  // 눈금 사이가 60px 이상 되도록 간격을 고른다.
  const tickSeconds=[.5,1,2,5,10,15,30,60].find(step=>step*pps>=60)||120;
  const ticks=[];
  for(let tick=0;tick<total-.0001;tick+=tickSeconds){
    const label=document.createElement('span');
    label.textContent=(tick>=60?Math.floor(tick/60)+':'+String(tick%60).padStart(2,'0'):tick+'초');
    label.style.left=(100*tick/total)+'%';ticks.push(label);
  }
  const last=document.createElement('span');last.textContent=Number(total.toFixed(1))+'초';last.className='last-tick';
  if(ticks.length>1 && total-(ticks.length-1)*tickSeconds<tickSeconds*.6)ticks.pop();
  scale.replaceChildren(...ticks,last);
  board.style.setProperty('--tick-step',(100*tickSeconds/total)+'%');
}
function centerTrackScroll(s) {
  const scroll=byId('trackScale').closest('.mix-scroll');
  if(!scroll || s.trackPinch) return;
  const view=scroll.clientWidth||300;
  const x=Math.round((s.trackTime||0)*trackPps(s));
  // 왼쪽 끝(0초)부터 자연스럽게 시작하고, 재생선이 화면 오른쪽 밖으로 나갈 때만 따라 스크롤
  let target=scroll.scrollLeft;
  if(x<target+16) target=Math.max(0,x-24);
  else if(x>target+view*0.82) target=Math.max(0,x-view*0.25);
  if(Math.abs(scroll.scrollLeft-target)>1){scroll.scrollLeft=target;}
  s.trackScrollAuto=scroll.scrollLeft;
}
function zoomTrack(s,pps) {
  const takes=sequenceTakes(s);
  s.trackPps=pps;trackPps(s);
  layoutTrackBoard(s,takes);
  drawTrackWave(takes);
  if(typeof renderMix==='function')renderMix(s);
  const scroll=byId('trackScale').closest('.mix-scroll');
  scroll.scrollLeft=Math.round((s.trackTime||0)*s.trackPps);s.trackScrollAuto=scroll.scrollLeft;
}
function finishTrackZoom(s) {
  // 확대가 끝나면 늘어난 폭에 맞춰 썸네일을 다시 뽑는다.
  s.prevThumbs=[...byId('trackClips').querySelectorAll('canvas')].map(c=>{
    const copy=document.createElement('canvas');copy.width=c.width;copy.height=c.height;
    if(c.width&&c.height)copy.getContext('2d').drawImage(c,0,0);return copy;
  });
  s.trackKey=null;renderCutTrack(s);
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
      cuts.splice(i,1,{...take,end:sourceTime,sourceLimit:sourceTime},{...take,start:sourceTime});
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
  {
    const scroll=byId('trackScale').closest('.mix-scroll');
    // 두 손가락 확대·축소
    let pinch=null;
    const gap=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
    scroll.addEventListener('touchstart',e=>{
      const s=session;
      if(!s?.clip || e.touches.length!==2) return;
      pinch={dist:gap(e.touches),pps:trackPps(s)};s.trackPinch=true;
    },{passive:true});
    scroll.addEventListener('touchmove',e=>{
      const s=session;
      if(!pinch || !s?.clip || e.touches.length!==2) return;
      e.preventDefault();
      zoomTrack(s,pinch.pps*gap(e.touches)/pinch.dist);
    },{passive:false});
    const endPinch=()=>{
      const s=session;
      if(!pinch)return;
      pinch=null;
      if(s){s.trackPinch=false;centerTrackScroll(s);finishTrackZoom(s);}
    };
    scroll.addEventListener('touchend',e=>{if(e.touches.length<2)endPinch();});
    scroll.addEventListener('touchcancel',endPinch);
    // 컴퓨터: Ctrl+휠로 확대, 마우스로 트랙 끌어서 이동
    let wheelTimer=0;
    scroll.addEventListener('wheel',e=>{
      const s=session;
      if(!s?.clip || !(e.ctrlKey||e.metaKey)) return;
      e.preventDefault();
      zoomTrack(s,trackPps(s)*Math.exp(-e.deltaY*.004));
      clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{if(session===s)finishTrackZoom(s);},250);
    },{passive:false});
    let drag=null,dragged=false;
    scroll.addEventListener('pointerdown',e=>{
      dragged=false;
      if(e.pointerType!=='mouse' || e.button!==0 || e.target.closest('button,canvas,.track-ruler')) return;
      drag={x:e.clientX,left:scroll.scrollLeft};scroll.setPointerCapture(e.pointerId);
    });
    scroll.addEventListener('pointermove',e=>{
      if(!drag)return;
      if(Math.abs(e.clientX-drag.x)>3)dragged=true;
      if(dragged)scroll.scrollLeft=drag.left-(e.clientX-drag.x);
    });
    scroll.addEventListener('pointerup',()=>{drag=null;});
    // 눈금을 클릭하거나 좌우로 드래그하면 재생선이 즉시 그 시각으로 이동
    const ruler=scroll.querySelector('.track-ruler');
    let scrubbing=false;
    const seekAtClientX=clientX=>{
      const s=session;
      if(!s?.clip) return;
      const board=scroll.querySelector('.track-board').getBoundingClientRect();
      seekCutTrack(s,(clientX-board.left)/trackPps(s));
    };
    ruler.addEventListener('pointerdown',e=>{
      if(e.button && e.button!==0) return;
      scrubbing=true;
      try{ruler.setPointerCapture(e.pointerId);}catch(_){}
      seekAtClientX(e.clientX);
    });
    ruler.addEventListener('pointermove',e=>{if(scrubbing)seekAtClientX(e.clientX);});
    ruler.addEventListener('pointerup',()=>{scrubbing=false;});
    ruler.addEventListener('pointercancel',()=>{scrubbing=false;});
    // 주소창이 접히는 세로 크기 변화는 무시하고, 폭이 바뀔 때만 다시 맞춘다.
    let lastWidth=innerWidth;
    addEventListener('resize',()=>{
      const s=session;
      if(innerWidth===lastWidth)return;
      lastWidth=innerWidth;
      if(s?.clip){s.trackPps=0;finishTrackZoom(s);}
    });
  }
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
  renderCutMarkers(null);
  renderEffectLanes(null);
  byId('emptyVideoPick').hidden=false;
  byId('cutTimeline').classList.remove('has-media');
  byId('trackWave').hidden=true;byId('trackScale').replaceChildren();
  byId('trackScale').closest('.track-board').style.removeProperty('width');
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
