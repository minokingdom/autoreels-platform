import init, { init as initRuntime, webgpu_self_test, load_model } from './vox-runtime/voxcpm_rs.js';
import { install, localBase, localWeights, weightsForLines } from './vox-model.mjs';

const networkFetch = self.fetch.bind(self);
let weights;
self.fetch = (input, options) => input instanceof Request && input.url.startsWith(localBase)
  ? localWeights(input, weights) : networkFetch(input, options);

let session;
async function checkGpu() {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter || adapter.info?.isFallbackAdapter) throw new Error('device_gpu');
  await init();
  initRuntime('warn');
  try { await webgpu_self_test(); } catch { throw new Error('device_gpu'); }
}
self.onmessage = async ({ data }) => {
  const status = message => self.postMessage({ status: message });
  try {
    if (data.install) {
      status('휴대폰 GPU 확인 중…');
      await checkGpu();
      await install((done, total) => status('VoxCPM2 다운로드 · ' + Math.floor(100 * done / total) + '%'));
      self.postMessage({ installed: true });
      return;
    }
    if (!session) {
      status('VoxCPM2를 휴대폰 메모리에 불러오는 중…');
      await checkGpu();
      weights = await weightsForLines(data.lines);
      session = await load_model(JSON.stringify({ base: localBase }), undefined,
        (stage, done, total) => status('VoxCPM2 준비 중' + (total ? ' · ' + Math.floor(100 * done / total) + '%' : '…')),
        undefined, 'q8');
    }
    const clips = [];
    for (const [index, line] of data.lines.entries()) {
      const update = () => status('VoxCPM2 음성 생성 중 · ' + (index + 1) + '/' + data.lines.length);
      update();
      const maxPatches = Math.min(600, 32 + 4 * Array.from(line).length);
      const pcm = await session.generate_streaming(line, update, 2, 10, maxPatches, 8, undefined, undefined);
      if (!pcm.length || !pcm.every(Number.isFinite) || !pcm.some(v => Math.abs(v) > 0.0001)) throw new Error('device_audio');
      clips.push(pcm);
    }
    self.postMessage({ clips, sampleRate: Math.round(session.sample_rate * (data.speed || 1)) }, clips.map(x => x.buffer));
  } catch (error) {
    self.postMessage({ error: error.name === 'QuotaExceededError' ? 'device_space' : String(error.message || error) });
  }
};
