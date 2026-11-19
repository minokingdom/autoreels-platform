import { env, pipeline } from './runtime/transformers.min.js';

// 모델 가중치만 내려받고, 문장 및 검색어는 이 워커의 메모리 안에서 비교합니다.
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';
const model = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const revision = '2c4055b12046f11709e9df2c122e59ffbdc2f900';
const themes = [
  ['방법', '효과가 있었던 구체적인 방법과 조언을 설명한다.'],
  ['경험', '직접 겪은 사건과 그때 깨달은 점을 이야기한다.'],
  ['이유', '중요한 선택을 한 이유와 그 결과를 설명한다.'],
  ['반전', '예상과 달랐던 결과나 의외의 사실을 털어놓는다.']
];
const filler = '안녕하세요. 반갑습니다. 감사합니다. 구독과 좋아요 부탁드립니다.';
const cache = new Map();
let extractor, queue = Promise.resolve();
const dot = (a,b) => a.reduce((sum,v,i) => sum + v*b[i],0);
async function vectors(texts) {
  const missing = [...new Set(texts)].filter(text => !cache.has(text));
  for (let i=0; i<missing.length; i+=6) {
    const batch = missing.slice(i,i+6);
    const output = await extractor(batch,{pooling:'mean',normalize:true});
    output.tolist().forEach((vector,j) => cache.set(batch[j],vector));
    output.dispose?.();
  }
  return texts.map(text => cache.get(text));
}
async function rank({version,guide,clips}) {
  extractor ||= await pipeline('feature-extraction',model,{quantized:true,revision});
  const prompts = guide ? [[guide,guide]] : themes;
  const keys = await vectors([...prompts.map(p=>p[1]),filler]);
  const background = keys.pop();
  const results = [];
  for (const clip of clips) {
    const utterances = await vectors(clip.lines);
    let best;
    utterances.forEach((vector,index) => {
      keys.forEach((key,j) => {
        const similarity = dot(vector,key);
        const score = similarity - Math.max(0,dot(vector,background)) * .28;
        if (!best || score > best.score) best = {score,index,reason:guide ? '입력한 주제와 가까운 대사' : prompts[j][0] + '에 관한 대사'};
      });
    });
    results.push({id:clip.id,...best});
  }
  postMessage({version,results});
}
onmessage = e => {
  queue = queue.then(() => rank(e.data)).catch(() => postMessage({version:e.data.version,error:true}));
};