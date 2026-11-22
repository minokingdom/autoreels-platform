// 각 원본의 시간 구간을 순서대로 재생하고 같은 순서로 MP4에 그린다.
async function openQuickFiles(files) {
  if (!files.length) return;
  const opened=openShortsFile(files[0],files.length>1);
  const s=session;
  await opened;
  if (session===s && s?.clip && files.length>1) await appendJoinedFiles(s,files.slice(1));
}
function sequenceTakes(s) {
  if (s.timelineCuts) return s.timelineCuts;
  const items=s.joined || [{url:s.url,clip:s.clip}];
  return items.flatMap(item=>clipRanges(item.clip).map(range=>({
    start:range.start,end:range.end,url:item.url,owner:item.clip
  })));
}
function sequenceDuration(takes) {
  return takes.reduce((sum,take)=>sum+(take.end-take.start)/(take.owner.rate||1),0);
}
function awaitMedia(el,event,action,signal) {
  return new Promise((resolve,reject)=>{
    signal.throwIfAborted();
    const listeners=new AbortController();
    const finish=error=>{
      clearTimeout(timer);listeners.abort();signal.removeEventListener('abort',cancel);
      if(error) reject(error); else resolve();
    };
    const cancel=()=>finish(signal.reason);
    const timer=setTimeout(()=>finish(Error('영상을 여는 데 시간이 오래 걸려요.')),15000);
    signal.addEventListener('abort',cancel,{once:true});
    el.addEventListener(event,()=>finish(),{once:true,signal:listeners.signal});
    el.addEventListener('error',()=>finish(Error('재생할 수 없는 영상이에요.')),{once:true,signal:listeners.signal});
    try {action();} catch(error) {finish(error);}
  });
}
async function positionJoinedTake(source,take,signal) {
  if(source.src!==take.url || source.readyState<2) await awaitMedia(source,'loadeddata',()=>{source.src=take.url;},signal);
  if(Math.abs(source.currentTime-take.start)>.001) await awaitMedia(source,'seeked',()=>{source.currentTime=take.start;},signal);
  source.playbackRate=take.owner.rate||1;
}
function stopJoinedPreview(s) { s.previewController?.abort(); }
function clearJoinedFiles(s) {
  stopJoinedPreview(s);s.coverController?.abort();s.trackThumbController?.abort();
  if(s.coverSource){s.coverSource.removeAttribute('src');s.coverSource.load();}
  byId("cutTimeline").hidden=true;byId("work").classList.remove("cut-arranged");
  for(const item of s.joined||[]) if(item.url!==s.url) URL.revokeObjectURL(item.url);
  byId('joinList').replaceChildren(); byId('joinNotice').textContent=''; byId('joinTools').hidden=true;
}
async function appendJoinedFiles(s,files) {
  if(!s || !files.length || s.exporting || s.adding) return;
  s.adding=true; stopJoinedPreview(s); video.pause(); byId('joinFiles').disabled=true;
  save.disabled=play.disabled=true;
  const notice=byId('joinNotice'), added=[]; let skipped=0;
  try {
    for(const file of files) {
      const url=URL.createObjectURL(file), probe=document.createElement('video');
      probe.preload='metadata';probe.muted=true;
      try {
        notice.textContent='영상 확인 중 · '+(added.length+skipped+1)+' / '+files.length;
        await awaitMedia(probe,'loadedmetadata',()=>{probe.src=url;},s.controller.signal);
        if(!Number.isFinite(probe.duration)||probe.duration<=0)throw Error();
        added.push({url,name:file.name||'추가 영상',clip:{start:0,end:probe.duration,rate:1,keepAudio:true,lines:[]}});
      } catch {URL.revokeObjectURL(url);skipped++;s.controller.signal.throwIfAborted();}
      finally {probe.removeAttribute('src');probe.load();}
    }
    if(added.length){
      s.joined ||= [{url:s.url,name:s.filename,clip:s.clip}];
      if (s.timelineCuts) {
        s.trackUndo=[{cuts:s.timelineCuts,cursor:s.trackTime||0}];
        s.timelineCuts=[...s.timelineCuts,...added.map(item=>({url:item.url,owner:item.clip,start:item.clip.start,end:item.clip.end}))];
      }
      s.joined.push(...added);renderJoinedList(s);
    }
    notice.textContent=skipped ? '재생할 수 없는 영상 '+skipped+'개를 제외했어요.' : '';
  } finally {
    if(session===s) {
      s.adding=false;byId('joinFiles').disabled=false;
      save.disabled=play.disabled=!!(!s.joined && s.wantMontage && !s.plan);
    } else for(const item of added) URL.revokeObjectURL(item.url);
  }
}
function renderJoinedList(s) {
  stopJoinedPreview(s);markEdited();
  if(!s.timelineCuts && s.joined.length===1 && s.joined[0].url===s.url){
    s.coverController?.abort();s.joined=null;byId('joinList').replaceChildren();
    byId('quickControls').hidden=byId('editor').hidden=false;
    setQuickMode(s,!!s.wantMontage);return;
  }
  byId('quickControls').hidden=byId('editor').hidden=true;
  const list=byId('joinList');list.replaceChildren();
  s.joined.forEach((item,i)=>{
    const row=document.createElement('div'),name=document.createElement('span');
    row.className='join-row';name.textContent=(i+1)+'. '+item.name+' · '+editedSeconds(item.clip).toFixed(1)+'초';row.append(name);
    for(const [label,offset] of [['앞으로',-1],['뒤로',1],['빼기',0]]) {
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.disabled=offset ? !s.joined[i+offset] : s.joined.length===1;
      button.addEventListener('click',()=>{
        if(s.exporting||s.adding) return;
        if(offset) [s.joined[i],s.joined[i+offset]]=[s.joined[i+offset],s.joined[i]];
        else {s.joined.splice(i,1);if(item.url!==s.url) URL.revokeObjectURL(item.url);}
        renderJoinedList(s);
      });
      row.append(button);
    }
    list.append(row);
  });
  detail(s,s.joined.length+'개 영상 · 이어붙인 길이 '+sequenceDuration(sequenceTakes(s)).toFixed(1)+'초');
  renderCutTrack(s);showJoinedCover(s);
}
async function showJoinedCover(s,selectedTake) {
  s.coverController?.abort();
  const controller=s.coverController=new AbortController();
  const source=s.coverSource ||= document.createElement('video');
  source.muted=true;source.playsInline=true;
  try {
    const first=selectedTake || sequenceTakes(s)[0];
    await positionJoinedTake(source,first,controller.signal);
    if(session===s && !controller.signal.aborted) paintClip(byId('overlay').getContext('2d'),source,activeCaption(first.owner,first.start),first.owner,selectedTake?s.trackTime||0:0);
  } catch { /* 다음 탐색이나 재생이 시작되면 이전 프레임 요청을 취소한다. */ }
}
async function previewJoined(s) {
  if(s.previewController){stopJoinedPreview(s);return;}
  s.coverController?.abort();
  const controller=s.previewController=new AbortController(),source=document.createElement('video');
  source.playsInline=true;
  const music=s.clip.music ? new Audio(s.clip.music) : null;
  if(music){music.loop=true;music.volume=.25;}
  const ctx=byId('overlay').getContext('2d');
  play.textContent='Ⅱ';play.setAttribute('aria-label','미리보기 정지');
  try {
    const takes=sequenceTakes(s), total=sequenceDuration(takes);
    const cursor=s.trackTime>=total-.05 ? 0 : s.trackTime||0;
    const pos=trackPosition(takes,cursor);
    if(music && cursor) music.addEventListener('loadedmetadata',()=>{if(music.duration>0)music.currentTime=cursor%music.duration;},{once:true});
    let offset=pos.offset;
    for(let i=pos.i;i<takes.length;i++){
      const original=takes[i];
      const take=i===pos.i ? {...original,start:pos.sourceTime} : original;
      await positionJoinedTake(source,take,controller.signal);
      source.muted=take.owner.keepAudio===false;
      await source.play();music?.play().catch(()=>{});
      await new Promise((resolve,reject)=>{
        let raf;
        const finish=error=>{cancelAnimationFrame(raf);controller.signal.removeEventListener('abort',cancel);source.onerror=null;error?reject(error):resolve();};
        const cancel=()=>finish(controller.signal.reason);
        controller.signal.addEventListener('abort',cancel,{once:true});source.onerror=()=>finish(Error('영상을 재생할 수 없어요.'));
        const tick=()=>{if(controller.signal.aborted){cancel();return;}trackTime(s,offset+(source.currentTime-original.start)/(original.owner.rate||1));if(music)music.volume=quickMusicGain(take.owner,source.currentTime);paintClip(ctx,source,activeCaption(take.owner,source.currentTime),take.owner,s.trackTime);
          if(source.ended||source.currentTime>=take.end)finish();else raf=requestAnimationFrame(tick);};
        tick();
      });
      source.pause();music?.pause();offset+=takeDuration(original);
    }
  } catch(error){if(!controller.signal.aborted && session===s) detail(s,error.message);}
  finally {
    source.pause();source.removeAttribute('src');source.load();music?.pause();
    s.previewController=null;
    if(session===s){play.textContent='▶';play.setAttribute('aria-label','이어붙인 영상 재생');}
  }
}
document.addEventListener('visibilitychange',()=>{if(document.hidden && session)stopJoinedPreview(session);});
byId('joinFiles').addEventListener('change',async e=>{
  const files=Array.from(e.target.files);e.target.value='';
  try {await appendJoinedFiles(session,files);} catch(error){if(error.name!=='AbortError') byId('joinNotice').textContent=error.message;}
});
