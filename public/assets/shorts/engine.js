let instance, offset = 0, failed = false;
const send = (type, data = {}) => parent.postMessage({ type, ...data }, location.origin);
function readLog(message) {
  const line = String(message);
  const match = line.match(/\[(\d+:\d+:\d+[.,]\d+)\s*-->\s*(\d+:\d+:\d+[.,]\d+)\]\s*(.+)/);
  const seconds = time => time.replace(',','.').split(':').reduce((sum,n) => sum * 60 + Number(n), 0);
  if (match) send('segment', { start: offset + seconds(match[1]), end: offset + seconds(match[2]), text: match[3].trim() });
  if (line.includes('whisper_print_timings:') && line.includes('total time')) send('finished-window');
}
var Module = {
  print: readLog, printErr: readLog,
  onAbort() { failed = true; send('error', { message: '이 기기에서 음성 모델을 실행하지 못했어요.' }); },
  async onRuntimeInitialized() {
    try {
      const response = await fetch('https://huggingface.co/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-base-q5_1.bin', {credentials:'omit'});
      if (!response.ok) throw Error();
      const model = new Uint8Array(await response.arrayBuffer());
      Module.FS_createDataFile('/', 'base.bin', model, true, true);
      instance = Module.init('base.bin');
      if (!instance || failed) throw Error();
      send('ready');
    } catch { send('error', { message: '음성 모델을 준비하지 못했어요.' }); }
  }
};
addEventListener('message', e => {
  if (e.origin !== location.origin || e.source !== parent || e.data.type !== 'analyze') return;
  offset = e.data.offset;
  try {
    if (Module.full_default(instance, e.data.audio, 'ko', Math.max(1, Math.min(4,navigator.hardwareConcurrency || 1)), false)) throw Error();
  } catch { send('error', { message: '이 구간의 음성을 읽지 못했어요.' }); }
});