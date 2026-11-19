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
  const file = fileInput.files[0]; fileInput.value = ''; if (!file) return;
  reset();
  const s = session = {id:++sequence,url:URL.createObjectURL(file),pending:[],clips:[],rankVersion:0,guide:byId('initialGuide').value.trim(),offset:0,status:'',controller:new AbortController()};
  document.querySelector('.stage').hidden = false; byId('guide').value = s.guide;
  byId('entry').hidden = true; byId('work').hidden = false; byId('frame').classList.add('loaded');
  detail(s,'영상 여는 중…'); video.hidden = false;
  try {
    if (!crossOriginIsolated) throw Error('기기 안에서 분석하려면 전용 미리보기 주소로 열어 주세요.');
    if (file.size > 250 * 1024 * 1024) throw Error('250MB 이내 영상을 선택해 주세요.');
    const metadata = new Promise((resolve,reject) => {
      video.addEventListener('loadedmetadata',resolve,{once:true,signal:s.controller.signal});
      video.addEventListener('error',() => reject(Error('이 영상 형식을 재생할 수 없어요.')),{once:true,signal:s.controller.signal});
    });
    video.src = s.url; await metadata; if (session !== s) return;
    if (!(video.duration > 0 && video.duration <= 600)) throw Error('10분 이내 영상을 선택해 주세요.');
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
});
byId('back').addEventListener('click',reset);
function activeCaption(clip,t) {return clip?.lines.find(line => t >= line.start && t < line.end)?.text || '';}
play.addEventListener('click',async () => {
  const s = session; if (!s?.clip || s.exporting) return;
  s.interacted = true;
  if (!video.paused) { video.pause(); return; }
  if (video.currentTime < s.clip.start || video.currentTime >= s.clip.end - .15) video.currentTime = s.clip.start;
  try { await video.play(); } catch { detail(s,'영상을 재생할 수 없어요.'); }
});
video.addEventListener('timeupdate',() => {
  const c = session?.clip; if (!c) return;
  renderPreview();
  if (video.currentTime >= c.end && !video.paused) video.pause();
});
video.addEventListener('play',() => {play.textContent = 'Ⅱ'; play.setAttribute('aria-label','일시정지');});
video.addEventListener('pause',() => {play.textContent = '▶'; play.setAttribute('aria-label','선택 구간 재생');});
function paintClip(ctx, source, text) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const scale = Math.max(w/source.videoWidth,h/source.videoHeight);
  const sw = w/scale, sh = h/scale;
  ctx.drawImage(source,(source.videoWidth-sw)/2,(source.videoHeight-sh)/2,sw,sh,0,0,w,h);
  drawTitles(ctx,session.clip,text);
}
save.addEventListener('click',async () => {
  const s = session, clip = s?.clip; if (!clip || s.exporting) return;
  const mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4'].find(t => window.MediaRecorder?.isTypeSupported(t));
  if (!mime || !HTMLCanvasElement.prototype.captureStream) {detail(s,'이 브라우저는 MP4 저장을 지원하지 않아요.'); return;}
  video.pause(); byId('fields').disabled = true; s.exporting = true; save.disabled = true; download.hidden = true;
  statusLine.textContent = '선택 구간을 MP4로 만드는 중…'; let context, track, recorder, stream, raf, timeout;
  const source = document.createElement('video'); source.playsInline = true; source.muted = true;
  let rejectRender;
  const failure = new Promise((_,reject) => {rejectRender = reject;});
  failure.catch(() => {});
  s.stopExport = () => rejectRender(Error('저장이 중단됐어요.'));
  const visibility = () => {if(document.hidden) s.stopExport();};
  document.addEventListener('visibilitychange',visibility);
  try {
    context = new AudioContext(); const resume = context.resume();
    const account = await fetch('/api/account?action=me',{credentials:'same-origin',signal:s.controller.signal});
    const me = await account.json();
    if (!me.user || !me.entitlement?.pro) throw Error('스튜디오에서 로그인과 이용권을 확인한 뒤 저장해 주세요.');
    await Promise.race([failure,new Promise((resolve,reject) => {
      source.onloadeddata = resolve; source.onerror = () => reject(Error('영상을 열 수 없어요.')); source.src = s.url;
    })]); await resume;
    if (clip.start > 0) await Promise.race([failure,new Promise(resolve => {source.onseeked = resolve; source.currentTime = clip.start;})]);
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d',{alpha:false}); paintClip(ctx,source,activeCaption(clip,clip.start));
    stream = canvas.captureStream(30);
    const dest = context.createMediaStreamDestination(), node = context.createMediaElementSource(source);
    source.muted = false; node.connect(dest); track = dest.stream.getAudioTracks()[0]; stream.addTrack(track);
    recorder = new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});
    const chunks = [], done = new Promise((resolve,reject) => {
      recorder.ondataavailable = e => {if(e.data.size) chunks.push(e.data);};
      recorder.onerror = () => reject(Error('MP4를 만들 수 없어요.'));
      recorder.onstop = () => resolve(new Blob(chunks,{type:'video/mp4'}));
    });
    const stop = () => { if (recorder.state !== 'inactive') recorder.stop(); source.pause(); };
    const draw = () => {
      paintClip(ctx,source,activeCaption(clip,source.currentTime));
      if (source.currentTime >= clip.end || source.ended) stop(); else raf = requestAnimationFrame(draw);
    };
    source.onended = stop; timeout = setTimeout(s.stopExport,(clip.end-clip.start+20)*1000);
    recorder.start(300); await source.play(); draw();
    const blob = await Promise.race([done,failure]);
    if(session !== s || blob.size < 1000) throw Error('완성된 영상을 확인하지 못했어요.');
    await confirmExport(s,clip,blob);
    if (session !== s) return;
    if (s.saved) URL.revokeObjectURL(s.saved);
    s.saved = URL.createObjectURL(blob); download.href = s.saved; download.hidden = false;
    statusLine.textContent = 'MP4가 준비됐어요.';
  } catch (err) { if(session === s) statusLine.textContent = err.message || '저장 중 문제가 생겼어요.'; }
  finally {
    clearTimeout(timeout); cancelAnimationFrame(raf); document.removeEventListener('visibilitychange',visibility);
    if (recorder?.state === 'recording') recorder.stop(); source.pause(); source.removeAttribute('src'); source.load();
    stream?.getTracks().forEach(t => t.stop()); if(context) await context.close().catch(() => {});
    s.stopExport = null; s.exporting = false; if (session === s) { save.disabled = false; byId('fields').disabled = false; if (s.deferredRank) { applyRank(s,s.deferredRank); s.deferredRank = null; } }
  }
});
