import {analyzeReference} from './analysis.mjs';

const byId = id => document.getElementById(id);
const preview = byId('preview');
const status = message => { byId('status').textContent = message; };
let scenes = [], photos = [], analysis, photoVersion = 0;
let playing = 0, selected = 0, savedUrl = '', exportId = '', busy = false;
const photoAt = i => photos[i % photos.length];

function resetDownload() {
  URL.revokeObjectURL(savedUrl); savedUrl = ''; exportId = '';
  byId('download').hidden = true; byId('download').removeAttribute('href');
}
function stopPreview() {
  cancelAnimationFrame(playing); playing = 0;
  byId('play').textContent = '▶'; byId('play').setAttribute('aria-label','미리보기 재생');
}
function paint(canvas, index, layer = 'all') {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const photo = photoAt(index), caption = scenes[index]?.caption.trim();
  ctx.clearRect(0,0,w,h);
  if (layer !== 'caption' && photo) {
    const scale = Math.max(w/photo.width,h/photo.height);
    ctx.drawImage(photo,(w-photo.width*scale)/2,(h-photo.height*scale)/2,photo.width*scale,photo.height*scale);
  }
  if (layer === 'photo' || !caption) return;
  ctx.font = '700 '+Math.round(w*.06)+'px Pretendard, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  const lines = []; let row = '';
  for (const word of caption.trim().split(/\s+/)) {
    const next = row ? row+' '+word : word;
    if (row && ctx.measureText(next).width > w*.86) { lines.push(row); row = word; }
    else row = next;
  }
  if (row) lines.push(row);
  const top = scenes[index]?.position === 'top';
  const step = w*.084, bottom = top ? h*.12+lines.length*step : h*.84;
  const shade = top ? ctx.createLinearGradient(0,bottom+step,0,0) : ctx.createLinearGradient(0,bottom-(lines.length+2)*step,0,h);
  shade.addColorStop(0,'rgba(0,0,0,0)'); shade.addColorStop(1,'rgba(0,0,0,.8)');
  ctx.fillStyle = shade; ctx.fillRect(0,0,w,h);
  if (scenes[index].accent) {
    ctx.fillStyle = scenes[index].accent;
    ctx.fillRect(w*.07,bottom-lines.length*step-w*.016,w*.11,w*.011);
  }
  ctx.fillStyle = '#fff8f0';
  lines.forEach((line,i) => ctx.fillText(line,w*.07,bottom-(lines.length-1-i)*step,w*.86));
}
function showFrame() { if (photos.length && scenes.length) paint(preview,selected); }
function showScenes() {
  byId('scenes').replaceChildren(...scenes.map((scene,i) => {
    const row = document.createElement('div'); row.className = 'scene';
    const img = document.createElement('img'); img.alt = '';
    if (photos.length) img.src = photoAt(i).thumbnail;
    const label = document.createElement('label');
    label.textContent = (i+1)+'번째 장면 · '+(scene.start/30).toFixed(1)+'–'+(scene.end/30).toFixed(1)+'초';
    const input = document.createElement('input'); input.className = 'edit-input'; input.maxLength = 56;
    input.placeholder = '화면에 넣을 문구 (선택)'; input.value = scene.caption;
    input.addEventListener('focus',() => {stopPreview(); selected = i; showFrame();});
    input.addEventListener('input',() => {scene.caption = input.value; resetDownload(); showFrame();});
    label.append(input); row.append(img,label); return row;
  }));
  byId('stage').hidden = byId('actions').hidden = !photos.length || !scenes.length;
  showFrame();
}
const jobKey = 'ar_private_remix_pending';
const draftKey = 'ar_private_remix_draft';
let sourceId = '';
function clearDraftId() {try {sessionStorage.removeItem(draftKey);} catch {}}
function showStory(id,context) {
  sourceId = id; byId('referenceStory').hidden = false;
  byId('sourceTopic').textContent = context?.topic || context?.title || '확인된 주제 없음';
  byId('sourceLines').replaceChildren(...scenes.map(scene=>{
    const item = document.createElement('li');
    const time = document.createElement('strong');
    time.textContent = (scene.start/30).toFixed(1)+'–'+(scene.end/30).toFixed(1)+'초';
    const screen = document.createElement('p'), speech = document.createElement('p');
    screen.textContent = '화면 문구 · '+(scene.screen || '인식된 문구 없음');
    speech.textContent = '대사 · '+(scene.speech || '인식된 대사 없음');
    item.append(time,screen,speech); return item;
  }));
}
function rememberJob(id) { try { sessionStorage.setItem(jobKey,id); } catch {} }
function forgetJob() { try { sessionStorage.removeItem(jobKey); } catch {} }
function linkFeedback(message = '', pending = false) {
  byId('linkFeedback').hidden = !message;
  byId('linkProgress').hidden = !pending;
  const label = byId('linkMessage');
  if (label.textContent !== message) label.textContent = message;
  byId('urlSubmit').textContent = pending ? '분석 중…' : '링크 분석';
}
function startReference() {
  linkFeedback();
  status('');
  analysis?.abort(); analysis = new AbortController();
  sourceId = ''; byId('referenceStory').hidden = true; byId('sourceDetails').open = false; byId('adaptChange').value = '';
  byId('urlSubmit').disabled = false; byId('loginHelp').hidden = true;
  stopPreview(); resetDownload(); selected = 0; photoVersion++;
  photos = []; scenes = []; byId('photos').value = ''; byId('arrange').hidden = true; showScenes();
  return analysis;
}
async function privateRequest(action, signal, data) {
  const response = await fetch('/api/account?action='+action, {
    method:data ? 'POST':'GET', credentials:'same-origin', cache:'no-store', signal,
    ...(data && {headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    const err = Error(result.message || '분석 상태를 확인하지 못했어요.');
    err.status = response.status;
    throw err;
  }
  return result;
}
function waitForPoll(signal, ms) {
  return new Promise((resolve,reject) => {
    signal.throwIfAborted();
    const abort = () => {clearTimeout(timer); reject(signal.reason);};
    const timer = setTimeout(() => {signal.removeEventListener('abort',abort); resolve();},ms);
    signal.addEventListener('abort',abort,{once:true});
  });
}
async function loadPrivateJob(url, previousId) {
  if (busy) return;
  const controller = startReference();
  const {signal} = controller;
  const button = byId('urlSubmit'); button.disabled = true;
  byId('refName').textContent = '최대 90초 · 250MB';
  linkFeedback(previousId ? '이전 링크의 분석 상태를 확인하고 있어요.' : '링크를 접수하고 있어요.', true);
  let id = previousId || crypto.randomUUID();
  try {
    if (!previousId) {
      clearDraftId();
      const job = await privateRequest('remix-url',signal,{url,id});
      signal.throwIfAborted();
      id = job.id;
      rememberJob(id);
      if (job.status === 'queued') linkFeedback('분석 대기 중이에요.', true);
    }
    let errors = 0;
    for (;;) {
      let result;
      try {result = await privateRequest('remix-status&id='+encodeURIComponent(id),signal);}
      catch (err) {
        if (signal.aborted || (err.status && err.status < 500) || ++errors >= 4) throw err;
        linkFeedback('연결을 다시 확인하고 있어요.', true); await waitForPoll(signal,5000); continue;
      }
      signal.throwIfAborted(); errors = 0;
      if (result.status === 'done') {
        scenes = result.scenes; byId('arrange').hidden = false; showScenes(); showStory(id,result.context);
        linkFeedback('분석 완료 · '+scenes.length+'개 장면을 찾았어요.');
        if (previousId) {
          let pendingDraft; try {pendingDraft=sessionStorage.getItem(draftKey);} catch {}
          if (pendingDraft) await adaptStory('',pendingDraft);
        }
        break;
      }
      if (result.status === 'failed') {
        forgetJob(); throw Error('공개 영상을 읽지 못했어요. 90초 이내의 공개 링크를 확인하거나 갤러리에서 선택해 주세요.');
      }
      linkFeedback(result.status === 'running' ? '영상의 주제·화면 문구·대사를 분석하고 있어요.' : '분석 대기 중이에요.', true);
      await waitForPoll(signal,5000);
    }
  } catch (err) {
    if (!signal.aborted) {
      if (err.status === 401 || err.status === 404) forgetJob();
      byId('loginHelp').hidden = err.status !== 401;
      linkFeedback(err.status === 401 ? '링크를 분석하려면 스튜디오에서 로그인해 주세요.' : err instanceof TypeError || err instanceof SyntaxError ? '연결을 확인하고 링크 분석을 다시 눌러 주세요.' : err.message || '링크 분석에 실패했어요. 다시 시도해 주세요.');
    }
  } finally {if (controller === analysis) button.disabled = false;}
}
async function adaptStory(change, previousId) {
  if (!sourceId || busy) return;
  const signal = analysis.signal;
  busy = true; stopPreview(); byId('inputs').disabled = true;
  try {
    const id = previousId || (await privateRequest('remix-url',signal,{id:crypto.randomUUID(),sourceId,change})).id;
    try {sessionStorage.setItem(draftKey,id);} catch {}
    for (;;) {
      const result = await privateRequest('remix-status&id='+encodeURIComponent(id),signal);
      if (result.source_id !== sourceId) throw Error('현재 영상에 맞는 대본을 찾지 못했어요.');
      if (result.status === 'done') {
        if (!Array.isArray(result.draft) || result.draft.length !== scenes.length) throw Error('장면 수를 확인하고 다시 시도해 주세요.');
        scenes.forEach((scene,i)=>{scene.caption=result.draft[i];});
        selected=0;resetDownload();showScenes();status('원본 흐름에 맞춰 대본을 바꿨어요. 장면별 문구를 눌러 고칠 수 있어요.');
        break;
      }
      if (result.status === 'failed') throw Error('대본을 완성하지 못했어요. 기존 문구를 확인하고 다시 시도해 주세요.');
      status('원본의 흐름에 맞춰 장면별 대본을 바꾸고 있어요…');
      await waitForPoll(signal,4000);
    }
    // 새로고침하면 계정 소유권을 다시 확인한 뒤 같은 결과를 복구합니다.
  } catch (err) {
    if (err.status === 404 || err.status === 401 || !err.status && !(err instanceof TypeError)) clearDraftId();
    if (!signal.aborted) status(err.message);
  } finally {busy=false;byId('inputs').disabled=false;}
}
byId('adaptForm').addEventListener('submit',e=>{
  e.preventDefault();
  const change=byId('adaptChange').value.trim();
  if(change) adaptStory(change);
});
byId('urlForm').addEventListener('submit',event => {
  event.preventDefault();
  const url = byId('referenceUrl').value.trim();
  if (url) loadPrivateJob(url);
});
byId('urlSubmit').disabled = false;
async function readSelectedReference() {
  const input = byId('reference');
  const file = input.files[0]; if (!file) return;
  forgetJob(); clearDraftId(); byId('referenceUrl').value = '';
  const controller = startReference();
  byId('refName').textContent = file.name; status('장면 전환을 찾고 있어요…');
  try {
    const next = await analyzeReference(file, controller.signal, pct => status('장면 전환을 찾고 있어요 · '+pct+'%'));
    if (controller !== analysis) return;
    scenes = next; byId('arrange').hidden = false; showScenes();
    status(scenes.length+'개 장면을 찾았어요. 내 사진을 선택해 주세요.');
  } catch (err) { if (!controller.signal.aborted) status(err.message); }
  finally { if (controller === analysis) input.value = ''; }
}
byId('reference').addEventListener('change', readSelectedReference);
// 모듈이 내려오는 동안 먼저 고른 파일도 처리합니다.
if (byId('reference').files.length) readSelectedReference();
else {
  try { const pending = sessionStorage.getItem(jobKey); if (pending) loadPrivateJob('',pending); } catch {}
}
async function openPhoto(file) {
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url; await image.decode();
    // 미리보기와 내보내기가 같은 크롭을 쓰도록 사진마다 세로 프레임 하나를 보관합니다.
    const frame = document.createElement('canvas'); frame.width = 1080; frame.height = 1920;
    const scale = Math.max(frame.width/image.width,frame.height/image.height);
    frame.getContext('2d',{alpha:false}).drawImage(image,(frame.width-image.width*scale)/2,(frame.height-image.height*scale)/2,image.width*scale,image.height*scale);
    const thumb = document.createElement('canvas'); thumb.width = 60; thumb.height = 106;
    thumb.getContext('2d').drawImage(frame,0,0,60,106); frame.thumbnail = thumb.toDataURL('image/jpeg',.75);
    return frame;
  } finally { URL.revokeObjectURL(url); }
}
byId('photos').addEventListener('change',async e => {
  const files = Array.from(e.target.files); if (!files.length) return;
  const version = ++photoVersion; stopPreview(); resetDownload();
  const count = Math.min(10, scenes.length, files.length);
  byId('actions').hidden = true; status('사진을 배치하고 있어요…');
  try {
    const next = [];
    for (const file of files.slice(0,count)) {
      next.push(await openPhoto(file));
      if (version !== photoVersion) return;
    }
    photos = next; selected = 0; showScenes();
    status(photos.length+'장의 사진을 '+scenes.length+'개 장면에 배치했어요.'+
      (photos.length < scenes.length ? ' 사진은 순서대로 반복해요.' : files.length > count ? ' 앞에서 '+count+'장을 사용했어요.' : ''));
  } catch { if (version === photoVersion) {showScenes(); status('열리지 않는 사진이 있어요. JPG나 PNG로 다시 골라 주세요.');} }
  finally {if (version === photoVersion) e.target.value = '';}
});
function indexAt(seconds) {
  const i = scenes.findIndex(scene => seconds*30 < scene.end);
  return i >= 0 ? i : scenes.length-1;
}
byId('play').addEventListener('click',() => {
  if (playing) {stopPreview(); return;}
  const start = performance.now(); byId('play').textContent = 'Ⅱ'; byId('play').setAttribute('aria-label','일시정지');
  const tick = now => {
    const seconds = (now-start)/1000;
    selected = indexAt(seconds); showFrame();
    if (seconds*30 >= scenes.at(-1).end) stopPreview();
    else playing = requestAnimationFrame(tick);
  };
  playing = requestAnimationFrame(tick);
});
async function recordMp4(mime) {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
  paint(canvas,0);
  const stream = canvas.captureStream(30);
  let recorder, raf, timer, hidden;
  try {
    recorder = new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});
    const duration = scenes.at(-1).end/30;
    return await new Promise((resolve,reject) => {
      const chunks = [];
      recorder.ondataavailable = e => {if(e.data.size) chunks.push(e.data);};
      recorder.onerror = () => reject(Error('MP4를 만들 수 없어요.'));
      recorder.onstop = () => resolve(new Blob(chunks,{type:'video/mp4'}));
      hidden = () => {if(document.hidden) reject(Error('저장하는 동안 이 화면을 열어 주세요.'));};
      document.addEventListener('visibilitychange',hidden);
      timer = setTimeout(() => reject(Error('영상 저장 시간이 초과됐어요.')), (duration+15)*1000);
      recorder.start(300);
      const start = performance.now();
      const tick = now => {
        const seconds = (now-start)/1000;
        paint(canvas,indexAt(seconds));
        if (seconds >= duration) recorder.stop(); else raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
  } finally {
    cancelAnimationFrame(raf); clearTimeout(timer);
    if (hidden) document.removeEventListener('visibilitychange',hidden);
    if (recorder?.state === 'recording') recorder.stop();
    stream.getTracks().forEach(track => track.stop());
  }
}
async function save(kind) {
  if (busy || !photos.length || !scenes.length) return;
  busy = true; stopPreview();
  for (const id of ['inputs','play','project','save']) byId(id).disabled = true;
  try {
    if (kind === 'project') {
      status('편집 프로젝트를 준비하고 있어요…');
      const {projectZip} = await import('./project.mjs');
      const zip = await projectZip(scenes,paint);
      const link = document.createElement('a'); link.href = URL.createObjectURL(zip);
      link.download = '오토릴스메이커-Hypit.zip'; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href),60000); status('프로젝트 파일이 준비됐어요.'); return;
    }
    const mime = ['video/mp4;codecs=avc1.42E01E','video/mp4'].find(type => window.MediaRecorder?.isTypeSupported(type));
    if (!mime || !HTMLCanvasElement.prototype.captureStream) throw Error('이 브라우저는 MP4 저장을 지원하지 않아요. Hypit 프로젝트로 저장할 수 있어요.');
    status('이용권을 확인하고 있어요…'); await arCheckShortsAccess();
    status('MP4를 만드는 동안 화면을 열어 주세요.');
    const blob = await recordMp4(mime);
    exportId ||= crypto.randomUUID();
    await arConfirmShortsExport(blob,exportId,() => !document.hidden);
    URL.revokeObjectURL(savedUrl); savedUrl = URL.createObjectURL(blob);
    byId('download').href = savedUrl; byId('download').hidden = false;
    status('MP4가 준비됐어요.');
  } catch (err) { status(err.message || '저장하지 못했어요. 다시 시도해 주세요.'); }
  finally {busy = false; for (const id of ['inputs','play','project','save']) byId(id).disabled = false;}
}
byId('save').addEventListener('click',() => save('mp4'));
byId('project').addEventListener('click',() => save('project'));
document.addEventListener('visibilitychange',() => {if (document.hidden) stopPreview();});
