import {ALL_FORMATS, Input, BlobSource, AudioBufferSink, EncodedPacketSink, EncodedAudioPacketSource, Output, BufferTarget, Mp4OutputFormat, WebMOutputFormat} from '../vendor/mediabunny-1.66.2/mediabunny.min.mjs';

// 0.1초 구간의 모든 채널에서 RMS를 구한다. 편집 판단에는 원래 크기를 사용한다.
function collector(wave,duration,notify){
  const sums=[],counts=[],limit=Math.ceil(duration*10);
  let lastUpdate=-Infinity;
  return (buffer,time)=>{
    const rate=buffer.sampleRate;
    let offset=Math.max(0,Math.ceil(-time*rate));
    while(offset<buffer.length){
      const bin=Math.max(0,Math.floor((time+offset/rate)*10));
      if(bin>=limit)break;
      const end=Math.min(buffer.length,Math.max(offset+1,Math.ceil(((bin+1)/10-time)*rate)));
      let sum=0;
      for(let c=0;c<buffer.numberOfChannels;c++){
        const data=buffer.getChannelData(c);
        for(let j=offset;j<end;j++)sum+=data[j]*data[j];
      }
      sums[bin]=(sums[bin]||0)+sum;
      counts[bin]=(counts[bin]||0)+(end-offset)*buffer.numberOfChannels;
      while(wave.levels.length<bin)wave.levels.push(0);
      const rms=Math.sqrt(sums[bin]/counts[bin]);
      wave.levels[bin]=rms;wave.peak=Math.max(wave.peak,rms);offset=end;
    }
    if(performance.now()-lastUpdate>=300){
      lastUpdate=performance.now();notify();
    }
  };
}

function offlineDecoder(){
  const Decoder=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;
  if(!Decoder)throw Error('audio_decoder_unavailable');
  return new Decoder(1,1,16000);
}

// WebCodecs가 없는 기기에서는 영상 트랙을 제외하고 짧은 오디오 묶음만 네이티브 디코더에 전달한다.
async function decodePacketGroups(track,origin,append,signal){
  const codec=await track.getCodec(),config=await track.getDecoderConfig();
  const ctx=offlineDecoder(), packets=new EncodedPacketSink(track);
  let output,source,start;
  async function flush(){
    if(!output)return;
    await output.finalize();
    const bytes=output.target.buffer;output=null;
    signal.throwIfAborted();
    const buffer=await ctx.decodeAudioData(bytes);signal.throwIfAborted();append(buffer,start-origin);
  }
  try{
    for await(const packet of packets.packets()){
      signal.throwIfAborted();
      if(output && packet.timestamp-start>=24)await flush();
      if(!output){
        const format=['opus','vorbis'].includes(codec)?new WebMOutputFormat():new Mp4OutputFormat();
        output=new Output({format,target:new BufferTarget()});
        source=new EncodedAudioPacketSource(codec);output.addAudioTrack(source);
        start=packet.timestamp;await output.start();
      }
      await source.add(packet.clone({timestamp:Math.max(0,packet.timestamp-start)}),{decoderConfig:config});
    }
    await flush();
  }finally{if(output && output.state!=='finalized')await output.cancel();}
}

export async function readSourceWave(file,duration,wave,notify,signal){
  const input=new Input({formats:ALL_FORMATS,source:new BlobSource(file)});
  const dispose=()=>input.dispose();
  signal.addEventListener('abort',dispose,{once:true});
  const reset=()=>{wave.levels=[];wave.peak=0;return collector(wave,duration,notify);};
  let append=reset();
  try{
    signal.throwIfAborted();
    const track=await input.getPrimaryAudioTrack();
    if(!track){wave.state='no-audio';return;}
    const origin=Math.max(0,await input.getFirstTimestamp());
    try{
      if(!await track.canDecode())throw Error('native_decode_required');
      for await(const {buffer,timestamp} of new AudioBufferSink(track).buffers()){
        signal.throwIfAborted();append(buffer,timestamp-origin);
      }
    }catch{
      signal.throwIfAborted();append=reset();
      await decodePacketGroups(track,origin,append,signal);
    }
    wave.state=wave.levels.length?'ready':'unavailable';
  }catch{
    signal.throwIfAborted();
    // 컨테이너 판독에 실패한 작은 파일은 기존 브라우저 디코더로 한 번 더 읽는다.
    if(file.size<=64*1024*1024 && duration<=180){
      try{
        const buffer=await offlineDecoder().decodeAudioData(await file.arrayBuffer());
        signal.throwIfAborted();reset()(buffer,0);wave.state='ready';return;
      }catch{signal.throwIfAborted();}
    }
    wave.state='unavailable';
  }finally{
    signal.removeEventListener('abort',dispose);dispose();if(!signal.aborted)notify();
  }
}
