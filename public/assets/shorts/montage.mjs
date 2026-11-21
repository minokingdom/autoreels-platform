import {sampleMotion} from '../remix/analysis.mjs';

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
  return segments;
}
