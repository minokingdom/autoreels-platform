import {analyzeReference,mediaEvent} from './analysis.mjs';

const MAX_BYTES = 250*1024*1024;
const galleryMessage='이 공유 링크는 휴대폰 브라우저에 영상 파일을 제공하지 않아요. 아래에서 갤러리에 저장한 참고 영상을 선택해 주세요.';
export async function linkedFile(input, signal, update) {
  const match=input.match(/https?:\/\/[^\s<>"]+/g);
  if(match?.length!==1) throw Error('참고 영상 링크 하나를 넣어 주세요.');
  let url;
  try {url=new URL(match[0]);} catch {throw Error('영상 주소를 확인해 주세요.');}
  if(url.protocol!=='https:' && url.origin!==location.origin || url.username || url.password) throw Error('공개 HTTPS 영상 주소를 넣어 주세요.');
  let title='';
  if (/(^|\.)(youtube\.com|youtu\.be|instagram\.com|tiktok\.com)$/.test(url.hostname)) throw Error(galleryMessage);
  if (/(^|\.)capcut\.com$/.test(url.hostname)) {
    const response=await fetch('/api/account?action=remix-source',{method:'POST',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url.href})});
    if(response.status===401) throw Object.assign(Error('CapCut 링크를 열려면 스튜디오에서 로그인해 주세요. 갤러리 영상은 바로 선택할 수 있어요.'),{status:401});
    if(!response.ok) throw Error('CapCut 미리보기를 열지 못했어요. 갤러리에서 참고 영상을 선택해 주세요.');
    const data=await response.json();
    if(!data.media) throw Error(galleryMessage);
    url=new URL(data.media); title=data.title||'';
  }
  update('참고 영상을 휴대폰으로 불러오고 있어요.');
  const response=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',signal});
  const type=response.headers.get('content-type')?.split(';')[0] || '';
  if(!response.ok || !/^(video\/|application\/octet-stream)/i.test(type)) {
    await response.body?.cancel();throw Error(galleryMessage);
  }
  const size=Number(response.headers.get('content-length'));
  if(size>MAX_BYTES){await response.body?.cancel();throw Error('250MB 이내의 영상을 골라 주세요.');}
  const reader=response.body.getReader(),chunks=[];let total=0;
  try {
    for(;;) {
      const part=await reader.read();if(part.done) break;
      total+=part.value.byteLength;
      if(total>MAX_BYTES) throw Error('250MB 이내의 영상을 골라 주세요.');
      chunks.push(part.value);
    }
  } finally {await reader.cancel();}
  return {file:new File(chunks,'reference',{type}),title};
}

async function screenText(file,scenes,signal,update) {
  const video=document.createElement('video'),url=URL.createObjectURL(file);
  video.muted=true;video.playsInline=true;video.preload='auto';
  let worker;
  const stop=()=>worker?.terminate();
  try {
    await mediaEvent(video,'loadeddata',()=>{video.src=url;},signal);
    const engine=(await import('./ocr/ocr.mjs')).default;
    const assets=new URL('./ocr/',import.meta.url).href;
    worker=await engine.createWorker('kor',1,{workerPath:assets+'worker.min.js',corePath:assets+'tesseract-core-lstm.wasm.js',langPath:assets,workerBlobURL:false});
    signal.throwIfAborted();
    signal.addEventListener('abort',stop,{once:true});
    await worker.setParameters({tessedit_pageseg_mode:'11'});
    const canvas=document.createElement('canvas'),scale=Math.min(1,960/Math.max(video.videoWidth,video.videoHeight));
    canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    for(const [i,s] of scenes.entries()){
      update('화면 문구를 읽고 있어요 · '+(i+1)+'/'+scenes.length);
      const when=(s.start+s.end)/60;
      if(Math.abs(video.currentTime-when)>.01) await mediaEvent(video,'seeked',()=>{video.currentTime=when;},signal);
      ctx.drawImage(video,0,0,canvas.width,canvas.height);
      // 대표 프레임에서 여백이 큰 쪽과 자주 쓰인 색을 찾습니다.
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data, buckets=new Uint32Array(512);
      let top=0,bottom=0;
      for(let y=0;y<canvas.height;y+=12){
        for(let x=12;x<canvas.width;x+=12){
          const j=(y*canvas.width+x)*4,r=pixels[j],g=pixels[j+1],b=pixels[j+2];
          const detail=Math.abs(r-pixels[j-48])+Math.abs(g-pixels[j-47])+Math.abs(b-pixels[j-46]);
          if(y<canvas.height*.3)top+=detail;
          if(y>canvas.height*.7)bottom+=detail;
          if(Math.max(r,g,b)-Math.min(r,g,b)>35)buckets[(r>>5)*64+(g>>5)*8+(b>>5)]++;
        }
      }
      s.position=top<bottom*.85?'top':'bottom';
      const bucket=buckets.indexOf(Math.max(...buckets));
      if(buckets[bucket])s.accent='#'+[bucket>>6,(bucket>>3)&7,bucket&7].map(v=>(v*32+16).toString(16).padStart(2,'0')).join('');
      const {data}=await worker.recognize(canvas);signal.throwIfAborted();
      s.screen=data.confidence>=48 ? data.text.trim().replace(/\s+/g,' ').slice(0,300) : '';
    }
  } finally {
    signal.removeEventListener('abort',stop);
    if(worker) await worker.terminate();
    video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url);
  }
}

async function speechText(file,scenes,signal,update) {
  const audioContext=new OfflineAudioContext(1,1,16000);
  let buffer;
  try {buffer=await audioContext.decodeAudioData(await file.arrayBuffer());}
  catch(error){if(error.name==='EncodingError') return;throw error;}
  signal.throwIfAborted();
  const audio=buffer.getChannelData(0);
  if(!audio.some((sample,i)=>i%32===0 && Math.abs(sample)>.002)) return;
  const frame=document.createElement('iframe');frame.hidden=true;frame.title='휴대폰 음성 분석';
  frame.src='../shorts/engine.html'; update('휴대폰에서 음성 분석을 준비하고 있어요.');
  await new Promise((resolve,reject)=>{
    let offset=0,timer;
    function finish(error){
      clearTimeout(timer);window.removeEventListener('message',receive);signal.removeEventListener('abort',abort);
      frame.remove();if(error)reject(error);else resolve();
    }
    function abort(){finish(signal.reason);}
    function watch(){clearTimeout(timer);timer=setTimeout(()=>finish(Error('음성 분석 시간이 초과됐어요.')),180000);}
    function next(){
      if(offset>=audio.length){finish();return;}
      const part=audio.slice(offset,offset+30*16000);
      update('대사를 읽고 있어요 · '+(Math.floor(offset/(30*16000))+1)+'/'+Math.ceil(audio.length/(30*16000)));
      const count=part.length;
      frame.contentWindow.postMessage({type:'analyze',offset:offset/16000,audio:part},location.origin,[part.buffer]);
      offset+=count; watch();
    }
    function receive(event){
      if(event.origin!==location.origin || event.source!==frame.contentWindow)return;
      const msg=event.data;
      if(msg.type==='error'){finish(Error(msg.message));return;}
      if(msg.type==='ready'||msg.type==='finished-window'){next();return;}
      if(msg.type==='segment' && msg.end>msg.start && msg.text){
        watch();const scene=scenes.find(s=>msg.start*30<s.end)||scenes.at(-1);
        scene.speech=(scene.speech+' '+msg.text.trim()).trim().slice(0,600);
      }
    }
    signal.addEventListener('abort',abort,{once:true});window.addEventListener('message',receive);watch();document.body.append(frame);
  });
}

export async function analyzeOnPhone(file,title,signal,update) {
  const scenes=await analyzeReference(file,signal,pct=>update('장면 전환을 찾고 있어요 · '+pct+'%'));
  for(const scene of scenes) Object.assign(scene,{screen:'',speech:'',position:'bottom',accent:'#70adff'});
  const warnings=[];
  for(const [read,name] of [[screenText,'화면 문구'],[speechText,'대사']]){
    signal.throwIfAborted();
    try {await read(file,scenes,signal,update);} catch(error){signal.throwIfAborted();warnings.push(name);}
  }
  signal.throwIfAborted();
  for(const s of scenes) s.caption=(s.screen||s.speech).slice(0,56);
  const topic=title || scenes.map(s=>s.speech||s.screen).find(Boolean)?.slice(0,140) || '';
  return {scenes,context:{topic,title},warnings};
}

export function replaceWords(scenes,change) {
  // 사용자가 원문과 교체할 표현을 모두 지정하면 모델 없이 그대로 치환합니다.
  const parts=change.trim().match(/^(.+?)(?:을|를|\s*→\s*)\s*(.+?)(?:으로|로)\s*(?:바꿔(?:줘|주세요)?|변경(?:해줘)?|교체(?:해줘)?)?[.!]?$/);
  const originals=scenes.map(s=>s.speech||s.screen||s.caption||'');
  if(!parts){
    const target=change.match(/^([가-힣A-Za-z0-9]+)(?:와|과|랑)\s+([가-힣A-Za-z0-9]+?)(?:으로|로)\s*(?:바꿔|변경|교체)/);
    const pair=originals.join(' ').match(/([가-힣A-Za-z0-9]+)(?:와|과|랑)\s+([가-힣A-Za-z0-9]+?)\s+중/);
    if(!target || !pair)return;
    return replaceWords(scenes,pair[1]+'와 '+pair[2]+'를 '+target[1]+'와 '+target[2]+'로 바꿔줘');
  }
  const split=s=>s.replace(/\s*비교$/,'').split(/(?:와|과|랑)\s+/).map(x=>x.trim());
  const from=split(parts[1]),to=split(parts[2]);if(from.length!==to.length || from.some(s=>!s))return;
  if(!from.every(word=>originals.some(line=>line.includes(word))))return;
  return originals.map(line=>{
    const pattern=from.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    return line.replace(new RegExp(pattern,'g'),found=>to[from.indexOf(found)]).slice(0,56);
  });
}

export async function rewriteOnPhone(scenes,change,signal,update) {
  const exact=replaceWords(scenes,change); if(exact) return exact;
  update('휴대폰에서 대본을 준비하고 있어요.');
  const worker=new Worker(new URL('./rewrite-worker.mjs',import.meta.url),{type:'module'});
  try {
    return await new Promise((resolve,reject)=>{
      const abort=()=>finish(signal.reason);
      let timer;
      function watch(){clearTimeout(timer);timer=setTimeout(()=>finish(Error('대본 준비 시간이 길어졌어요. 장면별 문구를 직접 수정할 수 있어요.')),240000);}
      watch();
      function finish(err,result){clearTimeout(timer);signal.removeEventListener('abort',abort);if(err)reject(err);else resolve(result);}
      worker.onerror=()=>finish(Error('이 기기에서 대본 모델을 열지 못했어요. 장면별 문구를 직접 수정할 수 있어요.'));
      worker.onmessage=({data})=>{if(data.state){watch();update(data.state);}else if(data.error)finish(Error(data.error));else finish(null,data.draft);};
      signal.throwIfAborted();signal.addEventListener('abort',abort,{once:true});
      worker.postMessage({scenes:scenes.map(s=>({screen:s.screen,speech:s.speech})),change});
    });
  } finally {worker.terminate();}
}
