import * as ort from './ort.wasm.min.mjs';
import { Style, TextToSpeech, UnicodeProcessor } from './supertonic.mjs';
import { graphs, readAsset } from './model.mjs';

let engine;
async function loadEngine() {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = new URL('./', import.meta.url).href;
  ort.env.wasm.wasmBinary = await readAsset('runtime.wasm');
  const sessions = [];
  for (const graph of graphs) {
    self.postMessage({ status: '휴대폰 성우를 준비하고 있습니다…' });
    const bytes = await readAsset('onnx/' + graph + '.onnx');
    sessions.push(await ort.InferenceSession.create(new Uint8Array(bytes), { executionProviders: ['wasm'] }));
  }
  return new TextToSpeech(await readAsset('onnx/tts.json'), new UnicodeProcessor(await readAsset('onnx/unicode_indexer.json')), ...sessions);
}

self.onmessage = async ({ data }) => {
  try {
    engine ??= await loadEngine();
    const voice = await readAsset('voice_styles/' + (data.voice === 'device-F1' ? 'F1' : 'M1') + '.json');
    const tensor = v => new ort.Tensor('float32', Float32Array.from(v.data.flat(Infinity)), v.dims);
    const style = new Style(tensor(voice.style_ttl), tensor(voice.style_dp));
    const clips = [];
    for (const line of data.lines) {
      self.postMessage({ status: `대본 음성 만드는 중 · ${clips.length + 1}/${data.lines.length}` });
      const result = await engine.call(line, 'ko', style, 5, data.speed);
      const frames = Math.min(result.wav.length, Math.round(result.duration[0] * engine.sampleRate));
      if (!(frames > 0)) throw new Error('device_invalid_audio');
      clips.push(new Float32Array(result.wav.slice(0, frames)));
    }
    self.postMessage({ clips, sampleRate: engine.sampleRate }, clips.map(clip => clip.buffer));
  } catch (error) {
    self.postMessage({ error: String(error.message || error) });
  }
};
