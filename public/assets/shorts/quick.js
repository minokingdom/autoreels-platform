function updateHighlightEdit(s) {
  const clip = s.clip, segments = s.plan.segments;
  const kept = [{...segments[0]}], gaps = byId('trimmedGaps');
  gaps.replaceChildren();
  for (let i=1; i<segments.length; i++) {
    const before = segments[i-1].end, after = segments[i].start;
    const protectsPeak = Number.isFinite(clip.peak) && clip.peak+1.2 > before && clip.peak-1.5 < after;
    if (protectsPeak || s.restored.has(i)) kept.at(-1).end = segments[i].end;
    else {
      kept.push({...segments[i]});
      const restore = document.createElement('button');
      restore.type = 'button'; restore.textContent = before.toFixed(1)+'–'+after.toFixed(1)+'초 복원';
      restore.addEventListener('click',() => {
        if (s !== session || s.exporting) return;
        s.restored.add(i); updateHighlightEdit(s); markEdited(); video.currentTime=Math.max(0,before-1);
      });
      gaps.append(restore);
    }
  }
  clip.montage = kept;
  byId('peakTime').textContent = Number.isFinite(clip.peak) ? '하이라이트 · '+clip.peak.toFixed(1)+'초' : '강조할 순간을 타임라인에서 골라 주세요.';
  byId('previewPeak').disabled = !Number.isFinite(clip.peak);
  byId('transitionControl').hidden = !kept.some(r=>r.transition);
  const removed = (video.duration-kept.reduce((sum,r)=>sum+r.end-r.start,0));
  byId('montageStatus').textContent = removed>.1 ? '중간 대기 '+removed.toFixed(1)+'초를 줄였어요.' : '원본 흐름을 유지했어요.';
  updateQuickTimes(clip);
}

function openQuickClip(s,file,fullSource=false) {
  byId('joinFiles').disabled=false;
  s.file=file;
  openEditorPublish(s);
  s.filename=file.name || '현재 편집본';
  byId('joinTools').hidden=false;
  byId('editSettings').open=false;
  const end = video.duration;
  const clip = {start:0,end,rate:1,keepAudio:true,transitions:false,peak:null,peakEffect:true,music:'',style:'box',title:'',customTitle:true,
    showCaptions:true,lines:[{start:0,end,text:''}]};
  video.playbackRate = 1;
  video.muted = false;
  byId('music').selectedIndex = 0;
  byId('speed').value = '1';
  byId('sourceSound').checked = true;
  byId('sceneTransitions').checked = false; byId('peakEffect').checked=true; byId('editCursor').max=end; s.restored=new Set();
  byId('captionStyle').value = 'box';
  byId('quickControls').disabled = false;
  byId('quickControls').hidden = false;
  selected(s,clip,null);
  byId('editor').open = true;
  updateQuickTimes(clip);
  s.sourceLevels=queueSourceWave(s,clip,file,end);
  if (fullSource) setQuickMode(s,false); else startMontage(s,file);
}
function updateQuickTimes(clip) {
  for (const [key,control,output] of [['start','trimStart','startTime'],['end','trimEnd','endTime']]) {
    byId(control).max = video.duration;
    byId(control).value = clip[key];
    byId(output).textContent = clip[key].toFixed(1) + '초';
  }
  renderCutTrack(session);
  detail(session,'원본 ' + video.duration.toFixed(1) + '초 · 편집 후 ' + sequenceDuration(sequenceTakes(session)).toFixed(1) + '초');
}
async function prepareQuickMusic(context,dest,url,signal) {
  const response = await fetch(url,{signal});
  if (!response.ok) throw Error('배경 음악을 불러올 수 없어요.');
  const sound = context.createBufferSource(), volume = context.createGain();
  sound.buffer = await context.decodeAudioData(await response.arrayBuffer());
  signal.throwIfAborted();
  volume.gain.value = .25;
  sound.loop = true;
  sound.connect(volume).connect(dest);
  return {sound,volume};
}
function updateAnalysisStatus(s,percent) {
  if(session!==s)return;
  const box=byId('analysisInfo'),apply=byId('applyReadyPlan');
  const pending=!!s.planReady && s.wantMontage && !s.timelineCuts && !s.joined;
  const working=s.analyzing && s.wantMontage && !s.joined && !s.timelineCuts;
  const showResult=s.wantMontage && !s.joined && !s.timelineCuts && !working && !pending && s.plan &&
    (s.analysisFailed || (s.clip.montage?.length===1 && !Number.isFinite(s.clip.peak)));
  box.hidden=!working && !pending && !showResult;
  apply.hidden=!pending;
  if(percent!==undefined)s.analysisPercent=Math.min(99,Math.max(0,Math.round(percent)));
  if(pending)byId('analysisText').textContent='자동 편집 준비됨';
  else if(working)byId('analysisText').textContent='장면 분석 중 · '+(s.analysisPercent||0)+'%';
  else byId('analysisText').textContent=s.analysisFailed?'장면 분석 실패 · 원본 편집 가능':'추천 구간 없음 · 원본 유지';
}
function finishBackgroundPlan(s){
  if(!s.wantMontage || s.timelineCuts || s.joined)return;
  if(s.previewTouched || !video.paused || s.exporting || s.postBusy || s.adding || byId('mixDialog').open){
    s.planReady=true;
  }else setQuickMode(s,true);
}
function setQuickMode(s,automatic) {
  if (session !== s || s.exporting || s.joined) return;
  video.pause();
  s.planReady=false;
  s.wantMontage = automatic;
  if(automatic && s.plan && !s.peakInitialized){s.clip.peak=s.plan.peak;s.peakInitialized=true;}
  s.clip.montage = null;
  byId('highlightEditor').hidden = !(automatic && s.plan);
  byId('useMontage').setAttribute('aria-pressed',String(automatic));
  byId('useManual').setAttribute('aria-pressed',String(!automatic));
  byId('manualTrim').hidden = automatic;
  byId('transitionControl').hidden = !s.clip.montage?.some(r => r.transition);
  const waiting = automatic && !s.plan;
  byId('montageProgress').hidden = !waiting;
  save.disabled = play.disabled = false;
  updateAnalysisStatus(s);
  const notice = byId('montageStatus');
  if (waiting) notice.textContent = '움직임과 컷을 고르는 중이에요.';
  else if (automatic) updateHighlightEdit(s);
  else notice.textContent = '';
  video.currentTime = clipRanges(s.clip)[0].start;
  markEdited(); updateQuickTimes(s.clip); renderPreview();
}
async function startMontage(s,file) {
  s.analyzing=true;
  byId('useMontage').disabled = false;
  byId('montageProgress').value = 0;
  setQuickMode(s,true);
  s.previewTouched=false;s.trackAnalysisEdits=true;
  updateAnalysisStatus(s,0);
  try {
    const {buildMontage} = await import('./montage.mjs?v=wave1');
    s.plan = await buildMontage(file,video.duration,s.controller.signal,pct => {
      if (session === s) {byId('montageProgress').value=pct;updateAnalysisStatus(s,pct);}
    },s.sourceLevels);
    if (session !== s) return;
    renderCutTrack(s);
    finishBackgroundPlan(s);
  } catch(error) {
    if (session !== s || s.controller.signal.aborted) return;
    console.warn('장면 분석 중단',error);
    s.analysisFailed=true;s.plan={segments:[{start:0,end:video.duration}],peak:null};
    if(!s.previewTouched && video.paused && !s.exporting && !s.postBusy && !s.adding && !byId('mixDialog').open && s.wantMontage && !s.timelineCuts && !s.joined)setQuickMode(s,true);
    byId('montageStatus').textContent='자동 분석이 어려운 영상이에요. 타임라인에서 강조할 순간을 골라 주세요.';
  } finally {s.analyzing=false;s.trackAnalysisEdits=false;updateAnalysisStatus(s);}
}
if (quickEdit) {
  byId('applyReadyPlan').addEventListener('click',()=>{if(editableEffects() && session.planReady){
    const s=session,at=video.currentTime;setQuickMode(s,true);seekCutTrack(s,outputTimeAt(s,at));
  }});
  byId('useMontage').addEventListener('click',() => {
    if (!session.plan && !session.analyzing) startMontage(session,session.file);
    else setQuickMode(session,true);
  });
  byId('useManual').addEventListener('click',() => setQuickMode(session,false));
  byId('editCursor').addEventListener('input',e=>{
    video.pause(); video.currentTime=e.target.valueAsNumber;
    byId('cursorTime').textContent=video.currentTime.toFixed(1)+'초';
  });
  video.addEventListener('timeupdate',()=>{
    byId('editCursor').value=video.currentTime;
    byId('cursorTime').textContent=video.currentTime.toFixed(1)+'초';
    if (session?.peakPreviewEnd != null && video.currentTime >= session.peakPreviewEnd) video.pause();
  });
  video.addEventListener('pause',()=>{ if(session) session.peakPreviewEnd=null; });
  byId('setPeak').addEventListener('click',()=>{
    if (!session?.plan || session.exporting) return;
    video.pause(); session.clip.peak=video.currentTime; updateHighlightEdit(session); markEdited(); renderPreview();
  });
  byId('previewPeak').addEventListener('click',async()=>{
    const s=session, peak=s?.clip?.peak;
    if (!Number.isFinite(peak) || s.exporting) return;
    video.currentTime=Math.max(0,peak-1.5); s.peakPreviewEnd=Math.min(video.duration,peak+1.2);
    try { await video.play(); } catch { detail(s,'강조 구간을 재생할 수 없어요.'); }
  });
  let previewFrame;
  const advanceMontage = () => {
    const plan = session?.clip?.montage;
    if (video.paused || (!plan && !session?.effects?.length && !session?.captions?.length)) return;
    if(!plan){renderPreview();previewFrame=requestAnimationFrame(advanceMontage);return;}
    const t = video.currentTime;
    if (!video.seeking) {
      const next = plan.find(r => t < r.end);
      if (!next) { video.pause(); return; }
      if (t < next.start) video.currentTime = next.start;
      else { renderPreview(t); music.volume = quickMusicGain(session.clip,t); }
    }
    previewFrame = requestAnimationFrame(advanceMontage);
  };
  video.addEventListener('play',advanceMontage);
  video.addEventListener('pause',() => cancelAnimationFrame(previewFrame));

  fileInput.multiple=true;
  document.body.classList.add('quick-video');
  document.title = '오토릴스메이커 · 영상 편집기';
  document.querySelectorAll('h1').forEach(h => { h.textContent = '영상 편집기'; });
  byId('entry').querySelectorAll('.hint,.field,#initialGuide').forEach(el => { el.hidden = true; });
  byId('guideForm').hidden = byId('rankStatus').hidden = byId('clips').hidden = byId('progress').hidden = true;
  document.querySelector('label[for="file"] small').hidden = true;
  save.textContent = '편집한 영상 MP4로 저장';
  const back = document.querySelector('[data-studio-back]');
  if (window.parent !== window) back.addEventListener('click', e => {
    e.preventDefault(); e.stopImmediatePropagation();
    window.parent.postMessage('close-quick-video',location.origin);
  },true);

  const music = new Audio();
  music.volume = .25; music.loop = true;
  fetch('/assets/audio-library.json').then(r => r.json()).then(library => {
    for (const track of library.music) {
      byId('music').add(new Option(track.name,'/assets/bgm/pack/' + track.id + '.mp3'));
    }
  }).catch(() => {});
  const syncMusic = () => {
    const clip = session?.clip;
    if (!clip?.music || !(music.duration > 0)) return;
    const elapsed = clipRanges(clip).reduce((sum,r) => sum+Math.max(0,Math.min(r.end,video.currentTime)-r.start),0);
    music.currentTime = (elapsed/clip.rate) % music.duration;
  };
  video.addEventListener('play',() => {
    if (session?.clip?.music) { syncMusic(); music.play().catch(() => {}); }
  });
  video.addEventListener('pause',() => music.pause());
  video.addEventListener('seeked',syncMusic);
  byId('back').addEventListener('click',() => { music.pause(); byId('quickControls').hidden = true; });
  byId('quickControls').addEventListener('input',e => {
    const clip = session?.clip;
    if (!clip || session.exporting) return;
    video.pause();
    const field = e.target;
    const gap = Math.min(.1,video.duration);
    switch (field.id) {
      case 'trimStart':
        clip.start = Math.min(field.valueAsNumber,clip.end-gap);
        video.currentTime = clip.start; break;
      case 'trimEnd':
        clip.end = Math.max(field.valueAsNumber,clip.start+gap);
        video.currentTime = clip.end; break;
      case 'peakEffect':
        clip.peakEffect=field.checked; break;
      case 'sceneTransitions':
        clip.transitions = field.checked; break;
      case 'speed':
        clip.rate = video.playbackRate = Number(field.value); break;
      case 'sourceSound':
        clip.keepAudio = field.checked; video.muted = !field.checked; break;
      case 'music':
        clip.music = field.value;
        if (clip.music) music.src = clip.music;
        else { music.removeAttribute('src'); music.load(); }
        break;
      case 'captionStyle':
        clip.style = field.value; break;
      default: return;
    }
    markEdited(); updateQuickTimes(clip); renderPreview();
  });
}
