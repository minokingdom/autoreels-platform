import {env,pipeline} from '../shorts/runtime/transformers.min.js';

self.onmessage=async({data:{audio}})=>{
  try{
    env.allowLocalModels=false;
    env.backends.onnx.wasm.numThreads=1;
    env.backends.onnx.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';
    const recognizer=await pipeline('automatic-speech-recognition','Xenova/whisper-tiny',{
      revision:'5332fcc35e32a33b86612b9a57a89be7906102b1',quantized:true,
      progress_callback:event=>{if(event.status==='progress')self.postMessage({state:'음성 모델을 다운로드하고 있어요.'});}
    });
    for(let from=0;from<audio.length;from+=25*16000){
      const offset=from/16000;
      self.postMessage({state:'대사를 읽고 있어요 · '+Math.floor(offset)+'초 / '+Math.ceil(audio.length/16000)+'초'});
      const result=await recognizer(audio.subarray(from,from+25*16000),{language:'korean',task:'transcribe',return_timestamps:true});
      const chunks=result.chunks?.length?result.chunks:[{timestamp:[0],text:result.text}];
      for(const c of chunks)if(c.text?.trim())self.postMessage({start:offset+(c.timestamp[0]||0),text:c.text.trim()});
    }
    self.postMessage({done:true});
  }catch{self.postMessage({error:'휴대폰에서 음성 모델을 실행하지 못했어요.'});}
};