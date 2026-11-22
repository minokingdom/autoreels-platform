const quickEdit = new URLSearchParams(location.search).get('mode') === 'edit';
const byId = id => document.getElementById(id);
const fileInput = byId('file'), video = byId('sourceVideo'), play = byId('play');
const statusLine = byId('status'), save = byId('save'), download = byId('download');
let session, sequence = 0;
const clock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2,'0');
const detail = (s, text) => { if (s === session) { s.status = text; if (!s.exporting) statusLine.textContent = text; } };
function reset() {
  const s = session;
  session = null;
  if (s) {
    clearJoinedFiles(s);
    s.rankWorker?.terminate(); clearTimeout(s.rankTimer); s.controller.abort(); clearTimeout(s.timer); s.engine?.remove(); s.stopExport?.();
    URL.revokeObjectURL(s.url); if (s.saved) URL.revokeObjectURL(s.saved);
  }
  video.pause(); video.removeAttribute('src'); video.load(); video.hidden = true;
  byId('editor').hidden = true; byId('editor').open = false; byId('rankStatus').textContent = ''; document.querySelector('.stage').hidden = true; play.hidden = true; renderPreview(); byId('frame').classList.remove('loaded');
  byId('clips').replaceChildren(); download.removeAttribute('href'); download.hidden = true;
  byId('entry').hidden = false; byId('work').hidden = true; byId('progress').value = 0; save.disabled = true;
}
function selected(s, clip, button) {
  video.pause(); s.clip = clip; video.currentTime = clip.start; play.hidden = false; save.disabled = false;
  for (const item of byId('clips').children) item.setAttribute('aria-pressed', String(item === button));
  download.hidden = true; mountEditor(clip); renderPreview(clip.start);
}
function flush(s) {
  if (!s.pending.length) return;
  const lines = s.pending.splice(0), start = lines[0].start, end = lines.at(-1).end;
  if (end <= start) return;
  const clip = {lines,start,end,id:s.clips.length,showCaptions:true,title:'',customTitle:false};
  s.clips.push(clip);
  clip.guideText = lines.map(line=>line.text);
  const button = document.createElement('button'), title = document.createElement('strong'), meta = document.createElement('span');
  button.type = 'button'; button.className = 'choice'; button.setAttribute('aria-pressed','false');
  const words = lines.map(line => line.text).join(' ');
  title.textContent = words.length > 44 ? words.slice(0,43) + '…' : words;
  meta.className = 'meta'; meta.textContent = clock(start) + ' – ' + clock(end) + ' · ' + Math.round(end-start) + '초';
  clip.button = button; clip.label = title; clip.meta = meta; clip.timeLabel = meta.textContent;
  button.append(title,meta); button.addEventListener('click',() => { if (!s.exporting) { s.interacted = true; selected(s,clip,button); } });
  byId('clips').append(button); if (!s.clip) selected(s,clip,button);
  scheduleRank(s);
}
function watchdog(s) {
  clearTimeout(s.timer);
  s.timer = setTimeout(() => { s.engine?.remove(); detail(s,'기기에서 분석 응답이 지연됐어요. 앞에서 찾은 구간은 재생할 수 있어요.'); }, 180000);
}
function nextWindow(s) {
  if (s.offset >= s.audio.duration) {
    flush(s); byId('progress').value = 1; s.engine.remove();
    detail(s,s.clip ? '분석 완료 · 원하는 구간을 선택하세요.' : '인식된 대사가 없어요. 말소리가 있는 영상을 선택해 주세요.'); return;
  }
  const from = Math.round(s.offset * 16000), data = s.audio.getChannelData(0);
  const part = data.slice(from,from + 30 * 16000);
  let power = 0;
  for(let i = 0; i < part.length; i += 16) power += part[i] * part[i];
  s.windowEnd = Math.min(s.audio.duration,s.offset + part.length / 16000);
  if (power / Math.max(1,Math.ceil(part.length/16)) < 0.000001) { finishWindow(s); return; }
  detail(s,(s.clip ? '다음 구간 분석 중' : '첫 구간 받아쓰는 중') + ' · ' + clock(s.offset) + ' / ' + clock(s.audio.duration));
  watchdog(s); s.engine.contentWindow.postMessage({type:'analyze',offset:s.offset,audio:part},location.origin,[part.buffer]);
}
function finishWindow(s) {
  clearTimeout(s.timer); s.offset = s.windowEnd;
  byId('progress').value = s.offset / s.audio.duration;
  if (s.pending.length && s.pending.at(-1).end - s.pending[0].start >= 12 && !/[?？]$/.test(s.pending.at(-1).text)) flush(s);
  setTimeout(() => { if (session === s) nextWindow(s); },0);
}
addEventListener('message', e => {
  const s = session;
  if (!s?.engine || e.origin !== location.origin || e.source !== s.engine.contentWindow) return;
  const msg = e.data;
  if (msg.type === 'ready') { clearTimeout(s.timer); nextWindow(s); }
  if (msg.type === 'error') { clearTimeout(s.timer); s.engine.remove(); detail(s,msg.message); }
  if (msg.type === 'finished-window') finishWindow(s);
  if (msg.type === 'segment' && msg.text && msg.end > msg.start) {
    const start = Math.max(0,msg.start), end = Math.min(msg.end,s.audio.duration);
    if (end <= start) return;
    if (s.pending.length && ((start - s.pending.at(-1).end > 2.2 && !/[?？]$/.test(s.pending.at(-1).text)) || end - s.pending[0].start > 45)) flush(s);
    s.pending.push({start,end,text:msg.text}); watchdog(s);
  }
});
fileInput.addEventListener('change', async () => {
  const files = Array.from(fileInput.files); fileInput.value = ''; if (!files.length) return;
  if (quickEdit) await openQuickFiles(files); else await openShortsFile(files[0]);
});
async function openShortsFile(file,fullSource=false) {
  reset();
  const s = session = {id:++sequence,url:URL.createObjectURL(file),pending:[],clips:[],rankVersion:0,guide:byId('initialGuide').value.trim(),offset:0,status:'',controller:new AbortController()};
  document.querySelector('.stage').hidden = false; byId('guide').value = s.guide;
  byId('entry').hidden = true; byId('work').hidden = false; byId('frame').classList.add('loaded');
  detail(s,'영상 여는 중…'); video.hidden = false;
  try {
    if (!quickEdit && !crossOriginIsolated) throw Error('기기 안에서 분석하려면 전용 미리보기 주소로 열어 주세요.');
    if (!quickEdit && file.size > 250 * 1024 * 1024) throw Error('250MB 이내 영상을 선택해 주세요.');
    const metadata = new Promise((resolve,reject) => {
      video.addEventListener('loadedmetadata',resolve,{once:true,signal:s.controller.signal});
      video.addEventListener('error',() => reject(Error('이 영상 형식을 재생할 수 없어요.')),{once:true,signal:s.controller.signal});
    });
    video.src = s.url; await metadata; if (session !== s) return;
    if (!(video.duration > 0 && Number.isFinite(video.duration))) throw Error('이 영상의 길이를 읽을 수 없어요.');
    if (!quickEdit && video.duration > 600) throw Error('10분 이내 영상을 선택해 주세요.');
    if (quickEdit) { openQuickClip(s,file,fullSource); return; }
    detail(s,'기기에서 음성 준비 중…');
    const context = new OfflineAudioContext(1,1,16000);
    const decoded = await context.decodeAudioData(await file.arrayBuffer()); if (session !== s) return;
    if (decoded.numberOfChannels === 1) s.audio = decoded;
    else {
      const mono = new OfflineAudioContext(1,decoded.length,16000), node = mono.createBufferSource();
      node.buffer = decoded; node.connect(mono.destination); node.start(); s.audio = await mono.startRendering();
    }
    if (session !== s) return;
    detail(s,'준비 중…');
    s.engine = document.createElement('iframe'); s.engine.hidden = true; s.engine.title = '음성 분석'; s.engine.src = 'engine.html';
    document.body.append(s.engine); watchdog(s);
  } catch (err) {detail(s,err.message || '이 영상의 오디오를 읽을 수 없어요.');}
}
byId('back').addEventListener('click',reset);
function clipRanges(clip) { return clip.montage || [clip]; }
function editedSeconds(clip) { return clipRanges(clip).reduce((total,r) => total+r.end-r.start,0)/(clip.rate||1); }
function activeCaption(clip,t) {return clip?.lines.find(line => t >= line.start && t < line.end)?.text || '';}
play.addEventListener('click',async () => {
  const s = session; if (!s?.clip || s.exporting) return;
  s.interacted = true;
  if (s.joined) { await previewJoined(s); return; }
  if (!video.paused) { video.pause(); return; }
  const ranges = clipRanges(s.clip);
  if (!ranges.some(r => video.currentTime >= r.start && video.currentTime < r.end-.03)) video.currentTime = ranges[0].start;
  try { await video.play(); } catch { detail(s,'영상을 재생할 수 없어요.'); }
});
video.addEventListener('timeupdate',() => {
  const c = session?.clip; if (!c) return;
  renderPreview();
  if (!c.montage && video.currentTime >= c.end && !video.paused) video.pause();
});
video.addEventListener('play',() => {play.textContent = 'Ⅱ'; play.setAttribute('aria-label','일시정지');});
video.addEventListener('pause',() => {play.textContent = '▶'; play.setAttribute('aria-label','선택 구간 재생');});
function drawQuickFrame(ctx,source,zoom,x=0) {
  const w=ctx.canvas.width, h=ctx.canvas.height;
  const sw=source.videoWidth||source.width, sh=source.videoHeight||source.height;
  const fit=Math.min(w/sw,h/sh)*zoom;
  const width=sw*fit, height=sh*fit;
  ctx.save();
  ctx.beginPath(); ctx.rect(x,0,w,h); ctx.clip();
  ctx.fillStyle='#09090b'; ctx.fillRect(x,0,w,h);
  ctx.drawImage(source,x+(w-width)/2,(h-height)/2,width,height);
  ctx.restore();
}
function peakEnvelope(clip,t) {
  if (!clip.montage || !clip.peakEffect || !Number.isFinite(clip.peak)) return 0;
  const delta = t-clip.peak;
  if (delta < -1.1 || delta >= .12) return 0;
  return delta <= 0 ? (1+delta/1.1)**2 : 1-delta/.12;
}
function quickMusicGain(clip,t) {
  return .25-.16*peakEnvelope(clip,t);
}
function drawQuickScene(ctx,source,clip) {
  const t=source.currentTime;
  const take=clip.montage?.find(r => t>=r.start-.01 && t<=r.end+.02);
  const zoom=1;
  const transition=take?.transition;
  if (clip.transitions && transition) {
    const duration=Math.min(.36*(clip.rate||1),(take.end-take.start)/3);
    const phase=Math.max(0,(t-take.start)/duration);
    if (phase<1) {
      const ease=phase*phase*(3-2*phase);
      if (transition.kind==='slide') {
        const x=Math.round(ctx.canvas.width*ease);
        ctx.drawImage(transition.frame,-x,0,ctx.canvas.width,ctx.canvas.height);
        drawQuickFrame(ctx,source,zoom,ctx.canvas.width-x);
      } else {
        drawQuickFrame(ctx,source,zoom);
        // 바탕과 영상을 한 번에 합성해야 레터박스까지 같은 비율로 녹아든다.
        ctx.save(); ctx.globalAlpha=1-ease;
        ctx.drawImage(transition.frame,0,0,ctx.canvas.width,ctx.canvas.height);
        ctx.restore();
      }
      return;
    }
  }
  drawQuickFrame(ctx,source,zoom);
}
function paintClip(ctx, source, text, clip=session.clip) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  if (quickEdit) {
    drawQuickScene(ctx,source,clip);
    const strength=peakEnvelope(clip,source.currentTime);
    if (strength>0) {
      const shade=ctx.createRadialGradient(w/2,h/2,w*.18,w/2,h/2,Math.hypot(w,h)/2);
      shade.addColorStop(0,'transparent');
      shade.addColorStop(1,'rgba(0,0,0,'+(.44*strength)+')');
      ctx.fillStyle=shade; ctx.fillRect(0,0,w,h);
    }

    drawTitles(ctx,clip,text); return;
  }
  const scale = Math.max(w/source.videoWidth,h/source.videoHeight);
  const sw = w/scale, sh = h/scale;
  ctx.drawImage(source,(source.videoWidth-sw)/2,(source.videoHeight-sh)/2,sw,sh,0,0,w,h);
  drawTitles(ctx,session.clip,text);
}
save.addEventListener('click',() => exportShortClip(false));
async function exportShortClip(forPublish) {
  const s = session, clip = s?.clip; if (!clip || s.exporting || s.adding) return;
  const mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4'].find(t => window.MediaRecorder?.isTypeSupported(t));
  if (!mime || !HTMLCanvasElement.prototype.captureStream) {detail(s,'이 브라우저는 MP4 저장을 지원하지 않아요.'); return;}
  stopJoinedPreview(s); video.pause(); byId('fields').disabled = true; s.exporting = true; save.disabled = true; download.hidden = true;
  byId('quickControls').disabled = true; byId('joinFiles').disabled=true;
  statusLine.textContent = '선택 구간을 MP4로 만드는 중…'; let musicNode, context, track, recorder, stream, raf, timeout;
  const source = document.createElement('video'); source.playsInline = true; source.muted = true;
  let rejectRender;
  const failure = new Promise((_,reject) => {rejectRender = reject;});
  failure.catch(() => {});
  s.stopExport = () => rejectRender(Error('저장이 중단됐어요.'));
  const visibility = () => {if(document.hidden) s.stopExport();};
  document.addEventListener('visibilitychange',visibility);
  try {
    context = new AudioContext(); const resume = context.resume();
    await arCheckShortsAccess(s.controller.signal);
    await Promise.race([failure,new Promise((resolve,reject) => {
      source.onloadeddata = resolve; source.onerror = () => reject(Error('영상을 열 수 없어요.')); source.src = sequenceTakes(s)[0].url;
    })]); await resume;
    const ranges = sequenceTakes(s);
    let takeIndex = 0;
    const firstStart = ranges[0].start;
    await Promise.race([failure,positionJoinedTake(source,ranges[0],s.controller.signal)]);
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d',{alpha:false}); paintClip(ctx,source,activeCaption(ranges[0].owner,firstStart),ranges[0].owner);
    stream = canvas.captureStream(30);
    const dest = context.createMediaStreamDestination(), node = context.createMediaElementSource(source);
    source.muted = false;
    const gain = context.createGain(); gain.gain.value = ranges[0].owner.keepAudio === false ? 0 : 1;
    node.connect(gain).connect(dest);
    if (clip.music) musicNode = await prepareQuickMusic(context,dest,clip.music,s.controller.signal);
    track = dest.stream.getAudioTracks()[0]; stream.addTrack(track);
    recorder = new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});
    const chunks = [], done = new Promise((resolve,reject) => {
      recorder.ondataavailable = e => {if(e.data.size) chunks.push(e.data);};
      recorder.onerror = () => reject(Error('MP4를 만들 수 없어요.'));
      recorder.onstop = () => resolve(new Blob(chunks,{type:'video/mp4'}));
    });
    const stop = () => { if (recorder.state !== 'inactive') recorder.stop(); source.pause(); };
    const draw = async () => {
      try {
        if (musicNode) musicNode.volume.gain.value=quickMusicGain(ranges[takeIndex].owner,source.currentTime);
        if (source.currentTime >= ranges[takeIndex].end || source.ended) {
          if (++takeIndex >= ranges.length) { stop(); return; }
          recorder.pause(); source.pause();
          await context.suspend();
          const take = ranges[takeIndex];
          await Promise.race([failure,positionJoinedTake(source,take,s.controller.signal)]);
          gain.gain.value = take.owner.keepAudio === false ? 0 : 1;
          paintClip(ctx,source,activeCaption(take.owner,source.currentTime),take.owner);
          await context.resume(); await source.play(); recorder.resume();
        } else { const owner=ranges[takeIndex].owner; paintClip(ctx,source,activeCaption(owner,source.currentTime),owner); }
        raf = requestAnimationFrame(draw);
      } catch (error) { rejectRender(error); }
    };
    timeout = setTimeout(s.stopExport,(sequenceDuration(ranges)+30)*1000);
    recorder.start(300); await source.play(); musicNode?.sound.start(); draw();
    const blob = await Promise.race([done,failure]);
    if(session !== s || blob.size < 1000) throw Error('완성된 영상을 확인하지 못했어요.');
    if (forPublish) { await arValidateShortsExport(blob); return blob; }
    await confirmExport(s,clip,blob);
    if (session !== s) return;
    if (s.saved) URL.revokeObjectURL(s.saved);
    s.saved = URL.createObjectURL(blob); download.href = s.saved; download.hidden = false;
    statusLine.textContent = 'MP4가 준비됐어요.';
  } catch (err) { if(session === s) statusLine.textContent = err.message || '저장 중 문제가 생겼어요.'; }
  finally {
    clearTimeout(timeout); cancelAnimationFrame(raf); document.removeEventListener('visibilitychange',visibility);
    if (recorder && recorder.state !== 'inactive') recorder.stop(); source.pause(); source.removeAttribute('src'); source.load();
    stream?.getTracks().forEach(t => t.stop()); if (musicNode) { try { musicNode.sound.stop(); } catch {} }
    if(context) await context.close().catch(() => {});
    s.stopExport = null; s.exporting = false; if (session === s) { save.disabled = false; byId('joinFiles').disabled=false; byId('quickControls').disabled = false; byId('fields').disabled = false; if (s.deferredRank) { applyRank(s,s.deferredRank); s.deferredRank = null; } }
  }
}
