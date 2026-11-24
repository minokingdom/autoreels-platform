const fs=require('node:fs'), os=require('node:os'), path=require('node:path'), assert=require('node:assert/strict');
const cp=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ar-meme-mix-'));
(async()=>{
  let srv,br;
  try {
    for (const [name,volume,hz] of [['soft',0.4,440],['loud',4,620]]) {
      cp.execFileSync('ffmpeg',['-loglevel','error','-f','lavfi','-i','color=c=blue:s=100x100:r=24:d=4','-f','lavfi','-i','sine=frequency='+hz+':duration=4','-af','volume='+volume,'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',path.join(dir,name+'.mp4')]);
    }
    srv=require('../server'); await new Promise(r=>srv.listen(0,'127.0.0.1',r));
    br=await require('playwright').chromium.launch({channel:'chrome',args:['--autoplay-policy=no-user-gesture-required']});
    const p=await br.newPage({viewport:{width:390,height:844},isMobile:true});
    p.on('pageerror',e=>console.log('JS',e.message));
    await p.route('**/meme-fixture-*.mp4',r=>r.fulfill({path:path.join(dir,r.request().url().includes('soft')?'soft.mp4':'loud.mp4'),contentType:'video/mp4'}));
    const item={id:'test-mix',title:'음량 검증',cuts:['soft','loud','soft'].map((name,i)=>({line:['첫 장면','큰 소리로 녹음한 두 번째 장면','마무리'][i],videoUrl:'/meme-fixture-'+name+'.mp4',mediaType:'원본 영상'}))};
    await p.route('**/api/**',r=>{
      const body=r.request().postDataJSON?.();
      return r.fulfill({json:body?.mode==='meme-radar'?{ok:true,items:[item]}:{ok:true}});
    });
    await p.goto('http://127.0.0.1:'+srv.address().port+'/studio',{waitUntil:'domcontentloaded'});
    await p.locator('#openMemeShortsBtn').click();
    await p.waitForFunction(()=>window.__arCurrentMemeItem?.id==='test-mix',null,{timeout:25000});
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
        records.push({idx,local:at-getCutStart(idx),rms:Math.sqrt(sum/data.length),players:videos.filter(v=>!v.paused).length,tail:Boolean(arMemePlayback.tail)});
      }
      input.disconnect();
      const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
      return {gain:videos.map(v=>v._memeSound?.gain),rms:[0,1].map(i=>median(records.filter(x=>x.idx===i&&x.local>0.5&&x.rms>0).map(x=>x.rms))),overlap:records.filter(x=>x.tail && x.players===2).length,boundary:records.filter(x=>x.idx===1&&x.local<0.35).map(x=>+x.rms.toFixed(3)),players:Math.max(...records.map(x=>x.players)),lengths:getCutLengths()};
    });
    console.log('MIX',JSON.stringify(result));assert.ok(result.gain[0]/result.gain[1]>8);assert.ok(result.rms.every(x=>x>0.03));assert.ok(Math.abs(20*Math.log10(result.rms[0]/result.rms[1]))<2);
    assert.ok(result.boundary.length && result.boundary.every(level=>level>0.02));assert.ok(result.overlap>0);assert.ok(result.players<=2);
    await p.locator('#arMemeCutNext').click();await p.waitForFunction(()=>document.querySelector('#arMemeCutCounter').textContent==='2 / 3');
    await p.locator('#arMemeCutNext').click();assert.ok(await p.locator('#arMemeCutNext').isDisabled());
    await p.locator('#arMemeCutPrev').click();
    const strip=await p.locator('#arMemeCutVisualStrip').evaluate(el=>[el.scrollLeft,el.clientWidth,el.children.length]);assert.ok(Math.abs(strip[0]-strip[1])<2);console.log('CAROUSEL',strip);
  } finally {if(br)await br.close();if(srv)srv.close();for(const name of ['soft','loud'])fs.rmSync(path.join(dir,name+'.mp4'),{force:true});fs.rmdirSync(dir);}
})().catch(e=>{console.error(e);process.exitCode=1;});
