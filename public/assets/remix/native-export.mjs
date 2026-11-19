export async function saveAndroidFile(blob,format) {
  const bridge=window.AutoReelsExport;
  if(!bridge)throw Error('Android 시스템 WebView를 업데이트하고 다시 시도해 주세요.');
  const id=crypto.randomUUID();
  async function send(data,expected){
    await new Promise((resolve,reject)=>{
      let timer;
      function finish(error){clearTimeout(timer);bridge.onmessage=null;if(error)reject(error);else resolve();}
      bridge.onmessage=e=>finish(e.data===expected?null:Error(e.data==='cancel'?'저장을 취소했어요.':'파일을 저장하지 못했어요.'));
      if(data.op!=='begin')timer=setTimeout(()=>finish(Error('파일 저장이 중단됐어요.')),30000);
      bridge.postMessage(JSON.stringify({id,...data}));
    });
  }
  await send({op:'begin',size:blob.size,format},'ready');
  for(let offset=0;offset<blob.size;offset+=65536){
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob.slice(offset,offset+65536));});
    await send({op:'write',data},'ok');
  }
  await send({op:'end'},'done');
}
