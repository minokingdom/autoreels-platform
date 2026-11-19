import {mediaEvent} from './analysis.mjs';
import {linkedFile,analyzeOnPhone,rewriteOnPhone} from './on-phone.mjs';

const byId = id => document.getElementById(id);
const preview = byId('preview');
const status = message => { byId('status').textContent = message; };
let scenes = [], photos = [], analysis, photoVersion = 0;
let playing = 0, selected = 0, savedUrl = '', exportId = '', busy = false;
const photoAt = i => photos[i % photos.length];
let activeVideo = null, audioContext, audioOutput;
function haltMedia() {
  activeVideo?.pause();
  activeVideo = null;
}
function releaseMedia(items) {
  for (const item of items) {
    if (!item.file) continue;
    item.pause();
    item.audioNode?.disconnect();
    const url = item.src;
    item.removeAttribute('src');
    item.load();
    URL.revokeObjectURL(url);
  }
}
function offsetFrames(index) {
  let offset = 0;
  for (let i = index - photos.length; i >= 0; i -= photos.length) offset += scenes[i].end - scenes[i].start;
  return offset;
}
function startAudio() {
  if (!photos.some(item=>item.file)) return;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) throw Error('이 브라우저는 영상 소리 편집을 지원하지 않아요.');
  audioContext ||= new Context();
  return audioContext.resume();
}
function advanceMedia(index, seconds, onError) {
  const item = photoAt(index);
  const video = item?.file ? item : null;
  if (video === activeVideo) return;
  haltMedia();
  if (!video) return;
  activeVideo = video;
  video.currentTime = (offsetFrames(index)/30 + Math.max(0,seconds-scenes[index].start/30)) % video.duration;
  video.audioNode ||= audioContext.createMediaElementSource(video);
  video.audioNode.disconnect();
  video.audioNode.connect(audioOutput || audioContext.destination);
  video.play().catch(error=>{ if (activeVideo===video && error.name!=='AbortError') onError(error); });
}

function resetDownload() {
  URL.revokeObjectURL(savedUrl); savedUrl = ''; exportId = '';
  byId('download').hidden = true; byId('download').removeAttribute('href');
}
function stopPreview() {
  haltMedia();
  cancelAnimationFrame(playing); playing = 0;
  byId('play').textContent = '▶'; byId('play').setAttribute('aria-label','미리보기 재생');
}
function paint(canvas, index, layer = 'all') {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const photo = photoAt(index), caption = scenes[index]?.caption.trim();
  ctx.clearRect(0,0,w,h);
  if (layer !== 'caption' && photo) {
    const sw = photo.videoWidth || photo.width, sh = photo.videoHeight || photo.height;
    const scale = Math.max(w/sw,h/sh);
    ctx.drawImage(photo,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);
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
    input.addEventListener('focus',() => {stopPreview(); selected = i; const item = photoAt(i); if (item?.file) item.currentTime = (offsetFrames(i)/30) % item.duration; showFrame();});
    input.addEventListener('input',() => {scene.caption = input.value; resetDownload(); showFrame();});
    label.append(input); row.append(img,label); return row;
  }));
  byId('stage').hidden = byId('actions').hidden = !photos.length || !scenes.length;
  showFrame();
}
let storyContext;
function showStory(context) {
  byId('referenceStory').hidden = false;
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
  storyContext=null; byId('adaptStatus').textContent=''; byId('referenceStory').hidden = true; byId('sourceDetails').open = false; byId('adaptChange').value = '';
  byId('urlSubmit').disabled = false; byId('loginHelp').hidden = true;
  stopPreview(); resetDownload(); selected = 0; photoVersion++;
  releaseMedia(photos); photos = []; scenes = []; byId('photos').value = ''; byId('arrange').hidden = true; showScenes();
  return analysis;
}
const localKey='ar_remix_phone_story_v1';
function rememberStory(){
  try {sessionStorage.setItem(localKey,JSON.stringify({scenes,context:storyContext,expires:Date.now()+3600000}));} catch {}
}
async function runReference(input,isLink){
  if(busy)return;
  const controller=startReference(),{signal}=controller;
  try {sessionStorage.removeItem(localKey);} catch {}
  byId('urlSubmit').disabled=true;
  const update=msg=>{if(!signal.aborted)linkFeedback(msg,true);};
  update(isLink?'휴대폰에서 링크를 확인하고 있어요.':'휴대폰에서 참고 영상을 열고 있어요.');
  try{
    const {file,title}=isLink?await linkedFile(input,signal,update):{file:input,title:''};
    signal.throwIfAborted();
    const result=await analyzeOnPhone(file,title,signal,update);signal.throwIfAborted();
    scenes=result.scenes;storyContext=result.context;
    byId('arrange').hidden=false;showScenes();showStory(storyContext);rememberStory();
    const warning=result.warnings.length?' · '+result.warnings.join('·')+' 인식 미완료':'';
    linkFeedback('휴대폰 분석 완료 · '+scenes.length+'개 장면'+warning);
  }catch(error){
    if(signal.aborted)return;
    byId('loginHelp').hidden=error.status!==401;
    linkFeedback(error instanceof TypeError?'휴대폰에서 영상에 접근할 수 없어요. 갤러리에서 참고 영상을 선택해 주세요.':error.message);
  }finally{if(!signal.aborted)byId('urlSubmit').disabled=false;}
}
byId('adaptForm').addEventListener('submit',async e=>{
  e.preventDefault();const change=byId('adaptChange').value.trim();
  if(busy||!scenes.length||!change)return;
  busy=true;stopPreview();byId('inputs').disabled=true;
  const msg=byId('adaptStatus');msg.textContent='휴대폰에서 대본을 바꾸고 있어요.';
  try{
    const draft=await rewriteOnPhone(scenes,change,analysis.signal,text=>{msg.textContent=text;});
    scenes.forEach((s,i)=>s.caption=draft[i]);resetDownload();showScenes();rememberStory();msg.textContent='장면별 대본을 바꿨어요.';
  }catch(error){msg.textContent=error.message;}
  finally{busy=false;byId('inputs').disabled=false;}
});
byId('urlForm').addEventListener('submit',e=>{
  e.preventDefault();const url=byId('referenceUrl').value.trim();if(url)runReference(url,true);
});
byId('urlSubmit').disabled=false;
function readSelectedReference(){
  const input=byId('reference'),file=input.files[0];if(!file)return;
  input.value='';byId('refName').textContent=file.name;runReference(file,false);
}
byId('reference').addEventListener('change',readSelectedReference);
if(byId('reference').files.length)readSelectedReference();
else try {
  const saved=JSON.parse(sessionStorage.getItem(localKey));
  if(saved?.expires>Date.now() && Array.isArray(saved.scenes)&&saved.scenes.length){
    startReference();scenes=saved.scenes;storyContext=saved.context;
    byId('arrange').hidden=false;showScenes();showStory(storyContext);linkFeedback('이 휴대폰에서 분석한 장면을 불러왔어요.');
  }
}catch{}
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
async function openMedia(file, signal) {
  if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v)$/i.test(file.name)) return openPhoto(file);
  const video = document.createElement('video');
  video.file = file;
  video.playsInline = true;
  video.preload = 'auto';
  video.loop = true;
  try {
    await mediaEvent(video,'loadeddata',()=>{video.src=URL.createObjectURL(file);},signal);
    if (!Number.isFinite(video.duration) || video.duration<=0) throw Error('재생 길이를 읽을 수 없는 영상이에요.');
    const thumb = document.createElement('canvas'); thumb.width=60; thumb.height=106;
    thumb.getContext('2d').drawImage(video,0,0,60,106);
    video.thumbnail = thumb.toDataURL('image/jpeg',.75);
    video.addEventListener('seeked',()=>{if (!playing && !busy && photoAt(selected)===video) showFrame();});
    return video;
  } catch (error) {releaseMedia([video]); throw error;}
}
byId('photos').addEventListener('change',async e => {
  const files = Array.from(e.target.files); if (!files.length) return;
  const version = ++photoVersion; stopPreview(); resetDownload();
  const count = Math.min(10, scenes.length, files.length);
  byId('actions').hidden = true; status('선택한 파일을 열고 있어요…');
  const next = [];
  try {
    for (const file of files.slice(0,count)) {
      next.push(await openMedia(file,analysis.signal));
      if (version !== photoVersion) return;
    }
    releaseMedia(photos); photos = next; selected = 0; showScenes();
    status('선택한 파일 '+count+'개를 '+scenes.length+'개 장면에 배치했어요.' + (files.length > count ? ' 앞에서 '+count+'개를 사용했어요.' : ''));
  } catch { if (version === photoVersion) {showScenes(); status('파일을 열지 못했어요. 이 기기에서 재생되는 영상이나 사진을 골라 주세요.');} }
  finally {if (photos !== next) releaseMedia(next); if (version === photoVersion) e.target.value = '';}
});
function indexAt(seconds) {
  const i = scenes.findIndex(scene => seconds*30 < scene.end);
  return i >= 0 ? i : scenes.length-1;
}
byId('play').addEventListener('click',() => {
  if (playing) {stopPreview(); return;}
  const fail = () => {stopPreview(); status('영상 재생을 시작하지 못했어요. 다시 눌러 주세요.');};
  try {startAudio()?.catch(fail);} catch {fail(); return;}
  const start = performance.now(); byId('play').textContent = 'Ⅱ'; byId('play').setAttribute('aria-label','일시정지');
  const tick = now => {
    const seconds = (now-start)/1000;
    selected = indexAt(seconds); advanceMedia(selected,seconds,fail); showFrame();
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
    if (photos.some(item=>item.file)) {
      audioOutput = audioContext.createMediaStreamDestination();
      for (const track of audioOutput.stream.getAudioTracks()) stream.addTrack(track);
    }
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
      advanceMedia(0,0,reject);
      recorder.start(300);
      const start = performance.now();
      const tick = now => {
        const seconds = (now-start)/1000;
        const index = indexAt(seconds);
        advanceMedia(index,seconds,reject);
        paint(canvas,index);
        if (seconds >= duration) recorder.stop(); else raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
  } finally {
    haltMedia(); audioOutput?.disconnect(); audioOutput = null;
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
      const zip = await projectZip(scenes,paint,photos,offsetFrames);
      const link = document.createElement('a'); link.href = URL.createObjectURL(zip);
      link.download = '오토릴스메이커-Hypit.zip'; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href),60000); status('프로젝트 파일이 준비됐어요.'); return;
    }
    const mime = ['video/mp4;codecs=avc1.42E01E','video/mp4'].find(type => window.MediaRecorder?.isTypeSupported(type));
    if (!mime || !HTMLCanvasElement.prototype.captureStream) throw Error('이 브라우저는 MP4 저장을 지원하지 않아요. Hypit 프로젝트로 저장할 수 있어요.');
    await startAudio();
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
