self.onmessage=async({data:{scenes,change}})=>{
  try {
    const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js');
    env.allowLocalModels=false; env.backends.onnx.wasm.numThreads=1;
    const model='onnx-community/Qwen2.5-0.5B-Instruct';
    const generator=await pipeline('text-generation',model,{device:'wasm',dtype:'q4',revision:'22942cb7d7ba4cc81bb4673549ca4d4614469b5e',progress_callback:event=>{
      if(event.status==='progress') self.postMessage({state:'대본 모델을 다운로드하고 있어요.'});
    }});
    self.postMessage({state:'내 주제에 맞게 장면별 대본을 바꾸고 있어요.'});
    let indices=scenes.map((s,i)=>s.screen||s.speech?i:-1).filter(i=>i>=0);
    if(!indices.length) indices=[0];
    const draft=scenes.map(()=> '');
    for(const [order,i] of indices.entries()){
      self.postMessage({state:'장면별 대본을 바꾸고 있어요 · '+(order+1)+'/'+indices.length});
      const original=(scenes[i].speech||scenes[i].screen||'').slice(0,200);
      const prompt=[
        {role:'system',content:'당신은 한국어 영상 자막 편집자입니다. 요청에 맞게 원래 자막을 고쳐 주세요. 시청자가 볼 자막 한 문장만 답하세요.'},
        {role:'user',content:'원래 자막: 오늘 어떤 옷을 입을까요?\n요청: 옷 대신 신발을 고르는 질문으로 바꿔줘'},
        {role:'assistant',content:'오늘은 어떤 신발을 신을까요?'},
        {role:'user',content:'원래 자막: '+original+(order?'\n앞 장면 자막: '+draft[indices[order-1]]:'')+'\n요청: '+change}
      ];
      const out=await generator(prompt,{max_new_tokens:48,do_sample:false,return_full_text:false});
      const generated=out[0].generated_text;
      const text=Array.isArray(generated)?generated.at(-1).content:generated;
      const line=text.trim().split('\n').find(t=>/[가-힣]/.test(t))?.replace(/^(?:(?:수정한|새로운)\s*)?(?:한 줄 )?자막\s*[:：]\s*/,'').replace(/^["“「]|["”」]$/g,'').trim();
      if(!line || line.length>56 || /[{}\[\]]/.test(line))throw Error();
      draft[i]=line;
    }
    if(indices.every(i=>[scenes[i].screen,scenes[i].speech].includes(draft[i])))throw Error();
    self.postMessage({draft});
  }catch{self.postMessage({error:'이 기기에서 대본을 완성하지 못했어요. 원본 문구를 직접 수정하거나 바꿀 단어를 지정해 주세요.'});}
};