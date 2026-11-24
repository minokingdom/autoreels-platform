const fs=require('node:fs'), os=require('node:os'), path=require('node:path'), assert=require('node:assert/strict');
const cp=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ar-meme-mix-'));
(async()=>{
  let srv,br;
  try {
    for (const [name,volume,hz] of [['soft',0.4,440],['loud',4,620]]) {
      cp.execFileSync('ffmpeg',['-loglevel','error','-f','lavfi','-i','color=c='+(name==='soft'?'blue':'red')+':s=100x100:r=24:d=4'+(name==='soft'?",drawbox=x=0:y=0:w=iw:h=ih:color=green:t=fill:enable='between(t,0.65,1.35)'":''),'-f','lavfi','-i','sine=frequency='+hz+':duration=4','-af','volume='+volume,'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',path.join(dir,name+'.mp4')]);
    }
    cp.execFileSync('ffmpeg',['-loglevel','error','-i',path.join(dir,'soft.mp4'),'-t','1.8','-c:v','libx264','-an',path.join(dir,'mini.mp4')]);
    srv=require('../server'); await new Promise(r=>srv.listen(0,'127.0.0.1',r));
    br=await require('playwright').chromium.launch({channel:'chrome',args:['--autoplay-policy=no-user-gesture-required']});
    const p=await br.newPage({viewport:{width:390,height:844},isMobile:true});
    p.on('pageerror',e=>console.log('JS',e.message));
    await p.route('**/meme-fixture-*.mp4',r=>r.fulfill({path:path.join(dir,r.request().url().includes('mini')?'mini.mp4':r.request().url().includes('soft')?'soft.mp4':'loud.mp4'),contentType:'video/mp4'}));
    const item={id:'test-mix',title:'음량 검증',cuts:['soft','loud','soft'].map((name,i)=>({line:['첫 장면','큰 소리로 녹음한 두 번째 장면','마무리'][i],videoUrl:'/meme-fixture-'+name+'.mp4',mediaType:'원본 영상'}))};
    await p.route('**/api/**',r=>{
      const body=r.request().postDataJSON?.();
      return r.fulfill({json:body?.mode==='meme-radar'?{ok:true,items:[item]}:{ok:true}});
    });
    await p.goto('http://127.0.0.1:'+srv.address().port+'/studio',{waitUntil:'domcontentloaded'});
    await p.locator('#openMemeShortsBtn').click();
    await p.waitForFunction(()=>window.__arCurrentMemeItem?.id==='test-mix',null,{timeout:25000});
    await p.waitForFunction(()=>document.querySelector('#arMemeRadarStatus').textContent.includes('적용했어요'));
    const buffered=await p.evaluate(async()=>{
      const item=window.__arCurrentMemeItem, video=campaign.uploadedPhotos[0];
      window.__timelines.main.seek(0);
      isPlaying=true;
      const until=performance.now()+5000;
      while(video.currentTime<0.85 && performance.now()<until) await new Promise(requestAnimationFrame);
      isPlaying=false;
      video.pause();
      const canvas=document.createElement('canvas');
      canvas.width=270;canvas.height=480;
      const ctx=canvas.getContext('2d');
      const sample=()=>{
        arDrawMemeCharacterStage(ctx,270,480,1,0,.3,item,item.cuts[0]);
        return Array.from(ctx.getImageData(135,215,1,1).data);
      };
      const decoded=sample();
      Object.defineProperty(video,'readyState',{configurable:true,value:1});
      try { return [decoded,sample()]; }
      finally { delete video.readyState; }
    });
    console.log('BUFFERED FRAME',buffered);
    assert.ok(buffered[0][1]>75 && buffered[0][2]<25);
    assert.deepEqual(buffered[0],buffered[1]);
    const dialogue=await p.evaluate(()=>{
      const current=campaign.cutCaptions.slice();
      const defaultMuted=campaign.uploadedPhotos.every(v=>v.muted && !v._keepAudio);
      updateCutCaptionDirect(1,'방금 고친 두 번째 대사');
      const edited=[arMemeDialogueAt(1),AudioEngine.getCutNarration(1),window.__arCurrentMemeItem.cuts[1].line];
      updateCutCaptionDirect(1,'');
      const silent=AudioEngine.getCutNarration(1);
      updateCutCaptionDirect(1,current[1]);
      return {defaultMuted,edited,silent};
    });
    assert.ok(dialogue.defaultMuted);
    assert.deepEqual(dialogue.edited,Array(3).fill('방금 고친 두 번째 대사'));
    assert.equal(dialogue.silent,'');
    await p.locator('#arMemeOrigAudioBtn').click();
    const result=await p.evaluate(async()=>{
      const videos=campaign.uploadedPhotos;
      const ctx=AudioEngine.ctx, an=ctx.createAnalyser(), input=ctx.createMediaStreamSource(AudioEngine.streamDest.stream);
      input.connect(an);an.fftSize=1024;const data=new Float32Array(1024);
      window.__timelines.main.seek(0.1); isPlaying=true;
      const records=[];const start=performance.now();
      while(performance.now()-start<11000){
        await new Promise(r=>setTimeout(r,35));
        an.getFloatTimeDomainData(data);
        let sum=0;for(const x of data)sum+=x*x;
        const at=window.__realTimelineT, idx=getCutIndexAt(at);
        const canvas=document.getElementById('reelCanvas');
        const pixel=canvas.getContext('2d').getImageData(canvas.width*0.4,canvas.height*0.45,1,1).data;
        records.push({red:pixel[0],green:pixel[1],blue:pixel[2],idx,local:at-getCutStart(idx),rms:Math.sqrt(sum/data.length),players:videos.filter(v=>!v.paused).length,tail:Boolean(arMemePlayback.tail)});
      }
      input.disconnect();
      const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
      return {darkFrames:records.filter(x=>Math.max(x.red,x.green,x.blue)<60).length,redFrames:records.filter(x=>x.red>200&&x.idx===1).length,blueFrames:records.filter(x=>x.blue>200&&x.idx===0).length,gain:videos.map(v=>v._memeSound?.gain),rms:[0,1].map(i=>median(records.filter(x=>x.idx===i&&x.local>0.5&&x.rms>0).map(x=>x.rms))),overlap:records.filter(x=>x.tail && x.players===2).length,boundary:records.filter(x=>x.idx===1&&x.local<0.35).map(x=>+x.rms.toFixed(3)),players:Math.max(...records.map(x=>x.players)),lengths:getCutLengths()};
    });
    console.log('MIX',JSON.stringify(result));assert.equal(result.darkFrames,0);assert.ok(result.redFrames>0 && result.blueFrames>0);assert.ok(result.gain[0]/result.gain[1]>8);assert.ok(result.rms.every(x=>x>0.03));assert.ok(Math.abs(20*Math.log10(result.rms[0]/result.rms[1]))<2);
    assert.ok(result.boundary.length && result.boundary.every(level=>level>0.02));assert.ok(result.overlap>0);assert.ok(result.players<=2);
    await p.locator('#arMemeCutNext').click();await p.waitForFunction(()=>document.querySelector('#arMemeCutCounter').textContent==='2 / 3');
    await p.locator('#arMemeCutNext').click();assert.ok(await p.locator('#arMemeCutNext').isDisabled());
    await p.locator('#arMemeCutPrev').click();
    const strip=await p.locator('#arMemeCutVisualStrip').evaluate(el=>[el.scrollLeft,el.clientWidth,el.children.length]);assert.ok(Math.abs(strip[0]-strip[1])<2);console.log('CAROUSEL',strip);
    const sample=await p.evaluate(async()=>{
      window.__arMemeRadarItems=[{id:'short-reaction',singleReaction:true,title:'짧은 원본',cuts:[{line:'',videoUrl:'/meme-fixture-mini.mp4'}]}];
      await arApplyMemeItemToStudio(0,'pure');
      isPlaying=false;
      window.__timelines.main.seek(.9);
      await new Promise(r=>setTimeout(r,200));
      arFinalAudioUnlocked=true;
      evaluateDealerDrmStatus=()=>1; // Local recording fixture, no account or billing.
      AR_SERVER.mode=false;
      await exportSynthesizedVideo();
      if(!window.lastRecordedVideoBlob) throw new Error('short silent meme export failed');
      return await new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result.split(',')[1]);reader.readAsDataURL(window.lastRecordedVideoBlob);});
    });
    const file=path.join(dir,'rendered.mp4');
    fs.writeFileSync(file,Buffer.from(sample,'base64'));
    const seconds=Number(cp.execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',file]));
    assert.ok(seconds>1.5 && seconds<2.2,'short meme duration '+seconds);
    const rgb=cp.execFileSync('ffmpeg',['-loglevel','error','-i',file,'-vf','crop=2:2:540:860,scale=1:1','-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','pipe:1']);
    assert.ok(rgb[2]>130 && rgb[1]<50,'first frame should be blue, before the green action');
    console.log('SHORT EXPORT',seconds,Array.from(rgb));
  } finally {if(br)await br.close();if(srv)srv.close();for(const name of ['soft','loud','mini','rendered'])fs.rmSync(path.join(dir,name+'.mp4'),{force:true});fs.rmdirSync(dir);}
})().catch(e=>{console.error(e);process.exitCode=1;});
