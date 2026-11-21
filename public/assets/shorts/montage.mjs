import {mediaEvent,sampleMotion} from '../remix/analysis.mjs';

// 각 시점의 짧은 음량 구간을 써서 무음 여백과 말 중간 컷을 줄인다.
async function audioLevels(file,duration) {
  if (file.size > 64*1024*1024 || duration > 180 || !window.OfflineAudioContext) return [];
  try {
    const ctx = new OfflineAudioContext(1,1,8000);
    const audio = await ctx.decodeAudioData(await file.arrayBuffer());
    const samples = audio.getChannelData(0), step = Math.round(audio.sampleRate/10), levels = [];
    for(let i=0;i<samples.length;i+=step) {
      let sum=0, count=0;
      for(let j=i;j<Math.min(i+step,samples.length);j+=4) {sum+=samples[j]*samples[j];count++;}
      levels.push(Math.sqrt(sum/count));
    }
    return levels;
  } catch { return []; }
}

// 잘라낸 구간을 건너뛴 뒤에도 앞 장면의 마지막 프레임으로 전환을 그린다.
async function prepareTransitions(file,segments,signal) {
  const source=document.createElement('video');
  source.muted=true; source.playsInline=true;
  const url=URL.createObjectURL(file);
  try {
    await mediaEvent(source,'loadeddata',() => {source.src=url;},signal);
    const width=720, height=1280;
    const fit=Math.min(width/source.videoWidth,height/source.videoHeight)*1.055;
    const sw=source.videoWidth*fit, sh=source.videoHeight*fit;
    for (let i=1;i<segments.length;i+=2) {
      const previous=segments[i-1];
      const t=Math.max(previous.start,previous.end-1/30);
      if (Math.abs(source.currentTime-t)>.001) {
        await mediaEvent(source,'seeked',() => {source.currentTime=t;},signal);
      }
      const frame=document.createElement('canvas');
      frame.width=width; frame.height=height;
      const ctx=frame.getContext('2d',{alpha:false});
      ctx.fillStyle='#09090b'; ctx.fillRect(0,0,width,height);
      ctx.drawImage(source,(width-sw)/2,(height-sh)/2,sw,sh);
      segments[i].transition={kind:i%4===3?'slide':'dissolve',frame};
    }
  } finally { source.removeAttribute('src'); source.load(); URL.revokeObjectURL(url); }
}

export async function buildMontage(file,duration,signal,progress) {
  if(duration <= 4) return [{start:0,end:duration}];
  const [motion,levels] = await Promise.all([sampleMotion(file,signal,progress),audioLevels(file,duration)]);
  signal.throwIfAborted();
  const count = Math.min(6,Math.max(2,Math.round(duration/8)));
  const target = Math.min(22,duration*.62);
  const beat = duration/count;
  const segments = [];
  for(let i=0;i<count;i++) {
    const from=i*beat, until=(i+1)*beat;
    const length=target/count*(i===0?.82:i===count-1?1.18:1);
    let best=-Infinity,start=from;
    const room=until-from-length;
    for(let choice=0;choice<=18;choice++) {
      const at=from+room*(.06+.88*choice/18);
      const ticks=motion.samples.filter(s=>s.t>=at && s.t<at+length);
      const changes=ticks.reduce((sum,s)=>sum+Math.min(s.score,50),0)/Math.max(1,ticks.length);
      const voice=levels.slice(Math.round(at*10),Math.round((at+length)*10));
      const audible=voice.filter(x=>x>.012).length/Math.max(1,voice.length);
      const boundary=(levels[Math.floor(at*10)]||0)+(levels[Math.floor((at+length)*10)]||0);
      const score=changes+audible*8-Math.min(.4,boundary)*24;
      if(score>best) {best=score;start=at;}
    }
    segments.push({start,end:start+length});
  }
  try { await prepareTransitions(file,segments,signal); }
  catch { signal.throwIfAborted(); }
  return segments;
}
