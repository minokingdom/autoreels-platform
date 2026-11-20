import assert from 'node:assert/strict';
import koreanNumbers from '../lib/korean-numbers.js';
for (const [input, spoken] of [
  ['1,150만원', '천백오십만 원'], ['1150만 원까지', '천백오십만 원까지'],
  ['1,050만원', '천오십만 원'], ['10,000만 원', '일억 원'],
  ['11,500,000원', '천백오십만 원'], ['월 0원', '월 영 원'],
  ['-480만원', '사백팔십만 원 할인'], ['차량 4대', '차량 네 대'],
  ['BMW 3시리즈와 5 시리즈를 비교합니다.', 'BMW 삼시리즈와 오시리즈를 비교합니다.'],
  ['bmw 세 시리즈와 비엠더블유 다섯시리즈', 'bmw 삼시리즈와 비엠더블유 오시리즈'],
  ['13시리즈, 15시리즈, 차량 3대와 5대', '13시리즈, 15시리즈, 차량 세 대와 다섯 대']
]) assert.equal(koreanNumbers.normalizeKoreanNumbers(input), spoken);
assert.equal(koreanNumbers.normalizeKoreanNumbers('BMW 7시리즈, BMW 일곱 시리즈, 재고 7대'), 'BMW 칠시리즈, BMW 칠시리즈, 재고 일곱 대');
import fs from 'node:fs';
import vm from 'node:vm';
const timing=fs.readFileSync('public/assets/app/03-campaign-timing.js','utf8');
const audio=fs.readFileSync('public/assets/app/04-audio-engine.js','utf8');
const clipRangeSource=audio.match(/^      chirpClipRange\([^]*?^      \},?\r?$/m)[0];
const {chirpClipRange}=vm.runInNewContext('({' + clipRangeSource + '})');
const paddedVoice=new Float32Array(1000);
paddedVoice.fill(0.002,200,700);
const clipRange=samples=>JSON.parse(JSON.stringify(chirpClipRange({
 numberOfChannels:1,sampleRate:1000,length:samples.length,getChannelData:()=>samples
})));
assert.deepEqual(clipRange(paddedVoice),{start:150,end:800});
assert.deepEqual(clipRange(new Float32Array(1000)),{start:0,end:1000});
assert.deepEqual(clipRange(new Float32Array(1000).fill(0.01)),{start:0,end:1000});
const methods=['shouldUseCutSyncedPlayback','playMasterAt','stopMasterSource','stopTts','syncWithTimeline','onPlayStateChange'].map(name=>{
 const m=audio.match(new RegExp('^      '+name+'\\([^]*?^      \\},?\\r?$','m'));
 assert.ok(m,name); return m[0].trimEnd().replace(/,$/, '');
}).join(',\n');
for(const factor of [0.5,1,4]) for (const card of [false,true]) for(const base of [8,12,20,30]) {
 const rawBounds=card?[0,2.21,3.65,5.03,5.8775,7.4]:[0,2.21,3.65,5.03,5.8775];
 const bounds=rawBounds.map(x=>x*factor);
 const sources=[];
 const ctx={currentTime:1,createBufferSource(){const s={connect(){},start(t,offset){this.offset=offset},stop(){this.stopped=true}};sources.push(s);return s},createGain(){return {connect(){},gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}}}}};
 const env={BASE_DURATION:base,TOTAL_DURATION:base,OUTRO_DURATION:0,campaign:{cutLenScale:[2,1,1,1]},arCardEmpty:()=>!card,audioEngineReady:()=>true,getTargetCutCount:()=>4,arVoiceAllowed:()=>true,getMainDuration:()=>env.TOTAL_DURATION-env.OUTRO_DURATION,isPlaying:true,arEditSheetOpen:false,window:{__timelines:{main:{currentTime:2}}}};
 vm.createContext(env);
 vm.runInContext('this.AudioEngine={'+methods+'}',env);
 Object.assign(env.AudioEngine,{ctx,enabled:true,ttsVoice:'test',masterBuffer:{duration:bounds.at(-1)},masterDuration:bounds.at(-1),masterCutBounds:bounds,masterPeak:1,ttsGain:{},ensureContext:()=>ctx,handleSceneSfx(){},getNarrationSeconds:()=>bounds.slice(1).map((b,i)=>b-bounds[i]),speakCutLine(){throw Error('continuous narration interrupted by a cut')}});
 const compute=timing.slice(timing.indexOf('    function computeFittedDurations()'),timing.indexOf('    // 성우 음성을 새로 받았을 때'));
 vm.runInContext(compute,env);
 const fit=env.computeFittedDurations();
 let t=0;
 for(let i=0;i<3;i++){t+=fit.lengths[i];assert.ok(Math.abs(t-bounds[i+1])<.01, 'cut must follow narration: '+JSON.stringify({card,base,i,t,bound:bounds[i+1]}))}
 assert.equal(fit.total,bounds.at(-1), "video must end with narration, without a padded tail");
 assert.ok(Math.abs(fit.lengths.reduce((a,b)=>a+b,0)+fit.outro-fit.total)<0.001);
 assert.ok(Math.abs(fit.outro-(card?bounds.at(-1)-bounds[4]:0))<0.001, "ending follows its own narration only");
 env.TOTAL_DURATION=fit.total;env.OUTRO_DURATION=fit.outro;
 env.AudioEngine.playMasterAt(0);
 assert.equal(sources.length,1);
 const first=env.AudioEngine.masterSource;
 for(const t of [1,2.22,3.66,5.04])env.AudioEngine.syncWithTimeline(t);
 assert.equal(env.AudioEngine.masterSource,first);
 assert.ok(!first.stopped);
 env.AudioEngine.onPlayStateChange(false);
 assert.ok(first.stopped);
 env.arEditSheetOpen=true;
 env.AudioEngine.onPlayStateChange(true);
 env.AudioEngine.syncWithTimeline(2);
 assert.equal(env.AudioEngine.masterSource,null);
 assert.equal(sources.length,1);
 env.arEditSheetOpen=false;
 env.AudioEngine.onPlayStateChange(true);
 assert.equal(env.AudioEngine.masterSource.offset,2);
 env.AudioEngine.playMasterAt(0);
 assert.equal(env.AudioEngine.masterSource.offset,0);
}
console.log('narration continuity ok: 24 short/long narration and duration/card combinations, cut boundaries, pause/resume/restart');
