export function mediaEvent(video, name, start, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const listeners = new AbortController();
    const finish = error => {
      clearTimeout(timer);
      listeners.abort();
      signal.removeEventListener('abort', aborted);
      if (error) reject(error); else resolve();
    };
    const aborted = () => finish(signal.reason);
    const timer = setTimeout(() => finish(Error('영상을 읽는 데 시간이 오래 걸려요. 다른 파일로 다시 시도해 주세요.')), 12000);
    signal.addEventListener('abort', aborted, {once:true});
    video.addEventListener(name, () => finish(), {once:true, signal:listeners.signal});
    video.addEventListener('error', () => finish(Error('이 영상 형식을 읽을 수 없어요.')), {once:true, signal:listeners.signal});
    start();
  });
}

// 저해상도 RGB 프레임 간 차이의 국소 최댓값을 컷 전환 후보로 사용합니다.
export async function analyzeReference(file, signal, progress) {
  if (file.size > 250 * 1024 * 1024) throw Error('250MB 이내의 영상을 골라 주세요.');
  const {duration,samples} = await sampleMotion(file,signal,progress,90.05);
  const median = samples.map(s => s.score).sort((a,b) => a-b)[Math.floor(samples.length/2)] || 0;
  const peaks = samples.filter((s,i) => s.score >= Math.max(24,median * 2.1) && s.score >= (samples[i-1]?.score || 0) && s.score > (samples[i+1]?.score || 0));
  const bounds = [0, duration];
  for (const s of peaks.sort((a,b) => b.score-a.score)) {
    if (bounds.length >= 11) break;
    if (bounds.every(t => Math.abs(t - s.t) >= .7)) bounds.push(s.t);
  }
  bounds.sort((a,b) => a-b);
  const frames = bounds.map(t => Math.round(t * 30));
  frames[frames.length-1] = Math.max(1, frames.at(-1));
  return frames.slice(1).map((end,i) => ({start:frames[i], end, caption:''}));
}

export async function sampleMotion(file, signal, progress, limit = Infinity) {
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.preload = 'auto';
  const url = URL.createObjectURL(file);
  try {
    await mediaEvent(video, 'loadeddata', () => { video.src = url; }, signal);
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0 || duration > limit) throw Error('90초 이내의 참고 영상을 골라 주세요.');
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d', {willReadFrequently:true});
    let previous;
    const samples = [];
    const step = Math.max(.25,duration/110);
    let lastPct = -1;
    for (let t = 0; t < duration - .015; t += step) {
      if (t) await mediaEvent(video, 'seeked', () => { video.currentTime = t; }, signal);
      ctx.drawImage(video, 0, 0, 32, 32);
      const pixels = ctx.getImageData(0, 0, 32, 32).data;
      let diff = 0;
      if (previous) {
        for (let i = 0; i < pixels.length; i += 4) {
          for (let c = 0; c < 3; c++) diff += Math.abs(pixels[i+c] - previous[i+c]);
        }
        samples.push({t, score:diff / (32 * 32 * 3)});
      }
      previous = pixels;
      const pct=Math.floor(100*t/duration);
      if(pct!==lastPct){progress(pct);lastPct=pct;}
    }
    return {duration,samples};
  } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
}
