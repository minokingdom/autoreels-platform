import {mediaEvent} from './analysis.mjs';
import {linkedFile,analyzeOnPhone,rewriteOnPhone} from './on-phone.mjs';

import {nativeYouTube} from './native-reference.mjs';
if(nativeYouTube){
  document.getElementById('sourceTypes').textContent='유튜브 쇼츠·영상 파일·참고 링크 지원';
  document.getElementById('refName').textContent='휴대폰에 저장된 참고 영상 · 최대 250MB';
}

const byId = id => document.getElementById(id);
const preview = byId('preview');
const status = message => { byId('status').textContent = message; };
let scenes = [], referenceScenes = [], photos = [], analysis, photoVersion = 0;
let playing = 0, selected = 0, savedUrl = '', exportId = '', busy = false;
const photoAt = i => photos[scenes[i]?.mediaIndex];
let activeVideo = null, activeScene = -1, audioContext, audioOutput;
function haltMedia() {
  activeVideo?.pause();
  activeVideo = null;
  activeScene = -1;
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
  return scenes[index].mediaOffset || 0;
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
  if (index === activeScene) return;
  const sameVideo = video && video === activeVideo;
  if (sameVideo) {
    activeScene = index;
    const target = (offsetFrames(index)/30 + Math.max(0,seconds-scenes[index].start/30)) % video.duration;
    if (Math.abs(video.currentTime-target) > .05) video.currentTime = target;
    return;
  }
  haltMedia();
  activeScene = index;
  if (!video) return;
  activeVideo = video;
  const target = (offsetFrames(index)/30 + Math.max(0,seconds-scenes[index].start/30)) % video.duration;
  if (Math.abs(video.currentTime-target) > 1/60) video.currentTime = target;
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
function paint(canvas, index, layer = 'all', elapsed = 1) {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const photo = photoAt(index), scene = scenes[index];
  ctx.clearRect(0,0,w,h);
  if (layer !== 'caption' && photo) {
    const sw = photo.videoWidth || photo.width, sh = photo.videoHeight || photo.height;
    const scale = Math.max(w/sw,h/sh);
    ctx.drawImage(photo,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);
  }
  if (layer === 'photo') return;
  if (scene.decoration === 'frame') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = w*.006;
    ctx.strokeRect(w*.045,h*.04,w*.91,h*.92);
    ctx.restore();
  }
  if (scene.caption && !scene.captionStyle?.hidden) {
    if (scene.captionStyle && Object.keys(scene.captionStyle).length) {
      window.arCutPanel.paint(ctx,{...scene.captionStyle,text:scene.caption},scene.position==='top'?.18:.8,elapsed);
    } else paintReferenceCaption(ctx,scene,w,h);
  }
  if (scene.chip?.text && !scene.chip.hidden) window.arCutPanel.paint(ctx,scene.chip,.87,elapsed);
  if (scene.transition && elapsed < .35) {
    ctx.save();
    ctx.globalAlpha = Math.max(0,1-elapsed/.35);
    ctx.fillStyle = scene.transition === 'white' ? '#fff' : '#000';
    ctx.fillRect(0,0,w,h);
    ctx.restore();
  }
}
function paintReferenceCaption(ctx,scene,w,h) {
  ctx.font = '700 '+Math.round(w*.06)+'px Pretendard, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  const lines = []; let row = '';
  for (const word of scene.caption.trim().split(/\s+/)) {
    const next = row ? row+' '+word : word;
    if (row && ctx.measureText(next).width > w*.86) { lines.push(row); row = word; }
    else row = next;
  }
  if (row) lines.push(row);
  const top = scene.position === 'top';
  const step = w*.084, bottom = top ? h*.12+lines.length*step : h*.84;
  const shade = top ? ctx.createLinearGradient(0,bottom+step,0,0) : ctx.createLinearGradient(0,bottom-(lines.length+2)*step,0,h);
  shade.addColorStop(0,'rgba(0,0,0,0)'); shade.addColorStop(1,'rgba(0,0,0,.8)');
  ctx.fillStyle = shade; ctx.fillRect(0,0,w,h);
  if (scene.accent) {
    ctx.fillStyle = scene.accent;
    ctx.fillRect(w*.07,bottom-lines.length*step-w*.016,w*.11,w*.011);
  }
  ctx.fillStyle = '#fff8f0';
  lines.forEach((line,i) => ctx.fillText(line,w*.07,bottom-(lines.length-1-i)*step,w*.86));
}
function showFrame(elapsed = 1) { if (photos.length && scenes.length) paint(preview,selected,'all',elapsed); }
function selectScene(index) {
  stopPreview();
  selected = index;
  const item = photoAt(index);
  if (item?.file) item.currentTime = (offsetFrames(index)/30) % item.duration;
  showFrame();
}
function openEditor(index = selected) {
  if (busy || !photoAt(index)) return;
  selectScene(index);
  byId('stage').scrollIntoView({block:'start'});
  window.arCutPanel.open(cutAdapter);
}
function showScenes() {
  byId('scenes').replaceChildren(...scenes.map((scene,i) => {
    const row = document.createElement('div'); row.className = 'scene';
    const img = document.createElement('img'); img.alt = '';
    if (photos.length) img.src = photoAt(i).thumbnail;
    const label = document.createElement('label');
    label.textContent = (i+1)+'번째 장면 · '+(scene.start/30).toFixed(1)+'–'+(scene.end/30).toFixed(1)+'초';
    const input = document.createElement('input'); input.className = 'edit-input'; input.maxLength = 56;
    input.placeholder = '화면에 넣을 문구 (선택)'; input.value = scene.caption;
    input.addEventListener('focus',() => selectScene(i));
    input.addEventListener('input',() => {scene.caption = input.value; resetDownload(); rememberStory(); showFrame();});
    label.append(input); row.append(img,label);
    if (photos.length) {
      const edit = document.createElement('button');
      edit.type = 'button'; edit.className = 'secondary'; edit.textContent = (i+1)+'컷 편집';
      edit.addEventListener('click',()=>openEditor(i));
      row.append(edit);
    }
    return row;
  }));
  byId('stage').hidden = byId('actions').hidden = !photos.length || !scenes.length;
  byId('editCut').hidden = byId('stage').hidden;
  showFrame();
}
let storyContext;
function showStory(context) {
  byId('referenceStory').hidden = false;
  byId('sourceTopic').textContent = context?.topic || context?.title || '확인된 주제 없음';
  byId('sourceLines').replaceChildren(...referenceScenes.map(scene=>{
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
  releaseMedia(photos); photos = []; scenes = []; referenceScenes = []; byId('photos').value = ''; byId('arrange').hidden = true; showScenes();
  return analysis;
}
const localKey='ar_remix_phone_story_v1';
function rememberStory(){
  try {sessionStorage.setItem(localKey,JSON.stringify({scenes,referenceScenes,context:storyContext,expires:Date.now()+3600000}));} catch {}
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
    scenes=result.scenes;referenceScenes=structuredClone(scenes);storyContext=result.context;
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
    startReference();scenes=saved.scenes;referenceScenes=saved.referenceScenes || structuredClone(scenes);storyContext=saved.context;
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
    const offsets = next.map(()=>0);
    scenes.forEach((scene,i)=>{
      scene.mediaIndex = i % next.length;
      scene.mediaOffset = offsets[scene.mediaIndex];
      offsets[scene.mediaIndex] += scene.end-scene.start;
    });
    releaseMedia(photos); photos = next; selected = 0; showScenes();
    status('선택한 파일 '+count+'개를 '+scenes.length+'개 장면에 배치했어요.' + (files.length > count ? ' 앞에서 '+count+'개를 사용했어요.' : ''));
  } catch { if (version === photoVersion) {showScenes(); status('파일을 열지 못했어요. 이 기기에서 재생되는 영상이나 사진을 골라 주세요.');} }
  finally {if (photos !== next) releaseMedia(next); if (version === photoVersion) e.target.value = '';}
});
function reflowScenes() {
  let frame = 0;
  for (const scene of scenes) {
    const length = scene.end-scene.start;
    scene.start = frame;
    frame += length;
    scene.end = frame;
  }
}
function discardUnusedMedia() {
  const used = [...new Set(scenes.map(s=>s.mediaIndex))];
  const next = used.map(i=>photos[i]);
  releaseMedia(photos.filter((_,i)=>!used.includes(i)));
  scenes.forEach(s=>{s.mediaIndex = used.indexOf(s.mediaIndex);});
  photos = next;
}
function changed() {
  resetDownload();
  showScenes();
  rememberStory();
}
let replaceTarget;
byId('replaceMedia').addEventListener('change',async event=>{
  const file = event.target.files[0], scene = replaceTarget;
  event.target.value = '';
  if (!file || busy || !scenes.includes(scene)) return;
  const version = ++photoVersion;
  busy = true; byId('inputs').disabled = true;
  try {
    const item = await openMedia(file,analysis.signal);
    if (version !== photoVersion || !scenes.includes(scene)) {releaseMedia([item]); return;}
    scene.mediaIndex = photos.push(item)-1;
    scene.mediaOffset = 0;
    discardUnusedMedia(); selected = scenes.indexOf(scene); changed();
    status((selected+1)+'컷의 파일을 교체했어요.');
  } catch {status('파일을 열지 못했어요. 이 기기에서 재생되는 영상이나 사진을 골라 주세요.');}
  finally {busy = false; byId('inputs').disabled = false;}
});
const cutAdapter = {
  unit:'컷', count:()=>scenes.length, index:()=>selected, select:selectScene,
  read(i) {
    const scene = scenes[i];
    return {duration:(scene.end-scene.start)/30, caption:{...scene.captionStyle,text:scene.caption}, chip:scene.chip || {text:''}};
  },
  write(i,patch) {
    const scene = scenes[i];
    if (Number.isFinite(patch.duration)) {
      scene.end = scene.start+Math.max(1,Math.round(30*patch.duration));
      reflowScenes();
    }
    if (patch.caption) {
      const {text,...style} = patch.caption;
      scene.caption = text; scene.captionStyle = style;
    }
    if (patch.chip) scene.chip = {...patch.chip};
  },
  order(action,i) {
    if (action === 'copy') {
      selected = i+1; scenes.splice(selected,0,structuredClone(scenes[i]));
    } else if (action === 'delete' && scenes.length > 1) {
      scenes.splice(i,1); selected = Math.min(i,scenes.length-1); discardUnusedMedia();
    } else {
      const target = i+(action==='left'?-1:1);
      if (!['left','right'].includes(action) || !scenes[target]) return;
      [scenes[i],scenes[target]] = [scenes[target],scenes[i]];
      selected = target;
    }
    reflowScenes();
    selectScene(selected);
  },
  changed,
  tools(tab,i) {
    const scene = scenes[i];
    if (tab === 'photo') return [{label:'이 컷 영상·사진 교체',run:()=>{
      replaceTarget = scene; byId('replaceMedia').click();
    }}];
    const choices = tab==='transition'
      ? [['','전환 없음'],['black','검정에서 페이드인'],['white','흰색에서 페이드인']]
      : [['','꾸밈 없음'],['frame','흰색 프레임']];
    const key = tab === 'transition' ? 'transition' : 'decoration';
    return choices.map(([value,label])=>({label,active:(scene[key]||'')===value,run:()=>{
      scene[key] = value; changed(); status((i+1)+'컷 · '+label);
    }}));
  }
};
byId('editCut').addEventListener('click',()=>openEditor());
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
    selected = indexAt(seconds); advanceMedia(selected,seconds,fail); showFrame(seconds-scenes[selected].start/30);
    if (seconds*30 >= scenes.at(-1).end) stopPreview();
    else playing = requestAnimationFrame(tick);
  };
  playing = requestAnimationFrame(tick);
});
async function recordMp4(mime) {
  const first = photoAt(0);
  if (first?.file) {
    const target = (offsetFrames(0)/30) % first.duration;
    if (first.seeking || Math.abs(first.currentTime-target) > 1/60) {
      await mediaEvent(first,'seeked',()=>{first.currentTime=target;},analysis.signal);
    }
  }
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
  paint(canvas,0,'all',0);
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
        paint(canvas,index,'all',seconds-scenes[index].start/30);
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
      if(window.AutoReelsExport){const {saveAndroidFile}=await import('./native-export.mjs');await saveAndroidFile(zip,'zip');status('프로젝트를 저장했어요.');return;}
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
byId('download').addEventListener('click',async event=>{
  if(!window.AutoReelsExport || !savedUrl)return;
  event.preventDefault();if(busy)return;busy=true;
  try{const {saveAndroidFile}=await import('./native-export.mjs');await saveAndroidFile(await (await fetch(savedUrl)).blob(),'mp4');status('MP4를 저장했어요.');}
  catch(error){status(error.message);}finally{busy=false;}
});
byId('save').addEventListener('click',() => save('mp4'));
byId('project').addEventListener('click',() => save('project'));
document.addEventListener('visibilitychange',() => {if (document.hidden) stopPreview();});
