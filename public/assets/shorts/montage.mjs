import {mediaEvent,sampleMotion} from '../remix/analysis.mjs';

// 각 시점의 짧은 음량 구간을 써서 무음 여백과 말 중간 컷을 줄인다.
export async function audioLevels(file,duration) {
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
    const fit=Math.min(width/source.videoWidth,height/source.videoHeight);
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

export function planMontage(duration, samples, levels) {
  const median = values => [...values].sort((a,b) => a-b)[Math.floor(values.length/2)] || 0;
  const motionFloor = median(samples.map(s => s.score));
  const soundFloor = median(levels);
  const segments = [{start:0, end:duration}];
  let best = 1, peak = null, quietStart = null;
  for (let i = 0; i < samples.length; i++) {
    const {t,score} = samples[i];
    const start = samples[i-1]?.t || 0;
    const audio = levels.slice(Math.floor(start*10), Math.ceil(t*10));
    const loud = audio.reduce((max,x) => Math.max(max,x),0);
    // 한 프레임의 장면 전환보다 이어지는 움직임과 소리의 변화를 우선한다.
    const neighbor = Math.max(samples[i-1]?.score || 0, samples[i+1]?.score || 0);
    const motion = (Math.min(score,neighbor) + Math.min(12,score)*.2) / (motionFloor+6);
    const accent = Math.min(2, loud / (soundFloor+.035)) * .65;
    if (t >= 1 && t <= duration-.7 && motion+accent > best) {
      best = motion+accent; peak = t;
    }
    const quiet = audio.length > 0 && loud < .009 && score < 2.5;
    if (quiet && quietStart === null) quietStart = start;
    if (!quiet && quietStart !== null) {
      const from = Math.max(2,quietStart+.7), to = Math.min(duration-2,start-.7);
      if (quietStart > 0 && to-from >= 1.7 && segments.length < 7) {
        segments.at(-1).end = from;
        segments.push({start:to,end:duration});
      }
      quietStart = null;
    }
  }
  return {segments,peak};
}

export async function buildMontage(file,duration,signal,progress) {
  if (duration < 3) return {segments:[{start:0,end:duration}],peak:null,levels:await audioLevels(file,duration)};
  const [motion,levels] = await Promise.all([sampleMotion(file,signal,progress),audioLevels(file,duration)]);
  signal.throwIfAborted();
  const plan = planMontage(duration,motion.samples,levels);
  if (plan.segments.length > 1) {
    try { await prepareTransitions(file,plan.segments,signal); }
    catch { signal.throwIfAborted(); }
  }
  return {...plan,levels};
}
