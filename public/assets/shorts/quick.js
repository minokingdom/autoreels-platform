function openQuickClip(s) {
  const end = video.duration;
  const clip = {start:0,end,rate:1,keepAudio:true,music:'',style:'box',title:'',customTitle:true,
    showCaptions:true,lines:[{start:0,end,text:''}]};
  video.playbackRate = 1;
  video.muted = false;
  byId('music').selectedIndex = 0;
  byId('speed').value = '1';
  byId('sourceSound').checked = true;
  byId('captionStyle').value = 'box';
  byId('quickControls').disabled = false;
  byId('quickControls').hidden = false;
  selected(s,clip,null);
  byId('editor').open = true;
  updateQuickTimes(clip);
}
function updateQuickTimes(clip) {
  for (const [key,control,output] of [['start','trimStart','startTime'],['end','trimEnd','endTime']]) {
    byId(control).max = video.duration;
    byId(control).value = clip[key];
    byId(output).textContent = clip[key].toFixed(1) + '초';
  }
  detail(session,'원본 ' + video.duration.toFixed(1) + '초 · 편집 후 ' + ((clip.end-clip.start)/clip.rate).toFixed(1) + '초');
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
  return sound;
}
if (quickEdit) {
  document.body.classList.add('quick-video');
  document.title = '오토릴스메이커 · 짧은 내 영상 바로 편집하기';
  document.querySelectorAll('h1').forEach(h => { h.textContent = '짧은 내 영상 바로 편집하기'; });
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
    music.currentTime = (Math.max(0,video.currentTime-clip.start)/clip.rate) % music.duration;
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
