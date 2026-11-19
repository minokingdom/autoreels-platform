export const nativeYouTube = /\bAutoReelsMaker(?:Android|iOS)\/1\b/.test(navigator.userAgent);

export function videoId(url) {
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  const host=url.hostname, path=url.pathname;
  let id;
  if(host==='youtu.be') id=path.slice(1);
  else if(['www.youtube.com','youtube.com','m.youtube.com'].includes(host)){
    id=path==='/watch'?url.searchParams.get('v'):path.match(/^\/(?:shorts|embed)\/([\w-]+)\/?$/)?.[1];
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

export function nativeFile(id,signal,update) {
  signal.throwIfAborted();
  const input=document.createElement('input');
  input.type='file';input.accept='video/x-autoreels-youtube';input.hidden=true;
  input.id='androidReference';input.dataset.videoId=id;input.dataset.requestId=crypto.randomUUID();
  document.body.append(input);
  update('휴대폰에서 유튜브 쇼츠를 열고 있어요.');
  return new Promise((resolve,reject)=>{
    let timer, title='';
    function finish(error,file) {
      clearTimeout(timer);window.removeEventListener('ar-native-reference',message);signal.removeEventListener('abort',abort);
      input.remove();if(error)reject(error);else resolve({file,title});
    }
    function abort(){finish(signal.reason);}
    function watch(){clearTimeout(timer);timer=setTimeout(()=>finish(Error('유튜브 연결 시간이 길어졌어요. 다시 시도해 주세요.')),150000);}
    function message(e){
      if(e.detail?.id!==input.dataset.requestId)return;
      if(e.detail.kind==='title'){title=String(e.detail.message||'').slice(0,160);return;}
      if(e.detail.kind==='error')finish(Error(e.detail.message));
      else {watch();update(e.detail.message);}
    }
    input.onchange=()=>input.files[0] ? finish(null,input.files[0]) : finish(Error('영상 가져오기가 취소됐어요.'));
    input.oncancel=()=>finish(Error('영상 가져오기가 취소됐어요.'));
    signal.addEventListener('abort',abort,{once:true});window.addEventListener('ar-native-reference',message);
    watch();input.click();
  });
}
