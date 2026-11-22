// 트랙 위치는 원본 시간이 아니라 최종 편집본의 초 단위 위치로 저장한다.
const mixNames={video:'영상',effect:'효과',sticker:'스티커',sfx:'효과음',source:'원본 소리',music:'음악',caption:'자막'};
let mixLibrary, mixDialogSave, mixAudio;
const soundBuffers=new Map();
const mixButton=(name,action,cls)=>{
  const button=document.createElement('button');button.type='button';button.textContent=name;
  if(cls)button.className=cls;button.addEventListener('click',action);return button;
};
const mixGlyphs={
  video:'M3 5h18v14H3z M7 5v14 M17 5v14 M3 10h4 M3 14h4 M17 10h4 M17 14h4',
  effect:'M12 2c1 6 4 9 10 10-6 1-9 4-10 10C11 16 8 13 2 12c6-1 9-4 10-10z',
  sfx:'M3 10v4 M7 6v12 M12 3v18 M17 7v10 M21 10v4',
  source:'M9 6a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0z M5 11v1a7 7 0 0 0 14 0v-1 M12 19v3 M8 22h8',
  music:'M9 17V6l12-3v12 M9 9l12-3 M9 17c0 4-7 5-7 2 0-3 5-4 7-2z M21 15c0 4-7 5-7 2 0-3 5-4 7-2z',
  caption:'M3 7V4h18v3 M12 4v16 M8 20h8',
  '✂':'M4 3l15 17 M20 3l-9 11 M9 15l-3 5 M4 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  '◴':'M4 18a9 9 0 1 1 16 0z M12 15l5-6',
  '⇄':'M3 8h16l-4-4 M21 16H5l4 4',
  '⌫':'M3 6h18 M8 6V3h8v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
  '☷':'M3 6h9 M16 6h5 M3 16h3 M10 16h11 M12 3v6 M7 13v6',
  '▣':'M8 4h12v12h-3 M4 8h12v12H4z','＋':'M12 4v16 M4 12h16',
  replace:'M4 4h7v7H4z M13 13h7v7h-7z M14 7h3a3 3 0 0 1 3 3v1 M10 17H7a3 3 0 0 1-3-3v-1'
};
function mixIcon(key){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','mix-icon');svg.setAttribute('aria-hidden','true');
  path.setAttribute('d',mixGlyphs[key]);svg.append(path);return svg;
}
function mixTotal(s){return sequenceDuration(sequenceTakes(s));}
function activeCue(s,time){return s?.captions?.findLast(c=>c.start<=time && time<c.start+c.duration);}
function stopMixSounds(s){for(const node of s?.previewSounds||[])try{node.stop();}catch{} if(s)s.previewSounds=null;}
function scheduleSounds(s,context,destination,time){
  if(s?.muteSfx)return [];
  const nodes=[],total=mixTotal(s),now=context.currentTime;
  for(const cue of s.sounds||[]){
    const start=Math.max(time,cue.start),end=Math.min(total,cue.start+cue.duration);
    if(end<=start)continue;
    const source=context.createBufferSource(),gain=context.createGain();source.buffer=cue.buffer;
    gain.gain.value=.7;source.connect(gain).connect(destination);
    source.start(now+start-time,start-cue.start,end-start);nodes.push(source);
  }
  return nodes;
}
function previewSounds(s,time){
  stopMixSounds(s);
  if(s?.sounds?.length && mixAudio?.state==='running')s.previewSounds=scheduleSounds(s,mixAudio,mixAudio.destination,time);
}
function loadMixBuffer(url,signal){
  return fetch(url,{signal}).then(res=>{if(!res.ok)throw Error('소리를 불러올 수 없어요.');return res.arrayBuffer();})
    .then(bytes=>new OfflineAudioContext(1,1,22050).decodeAudioData(bytes));
}
function drawMixBuffer(canvas,buffer,seconds,color,loop){
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,data=buffer.getChannelData(0);
  ctx.clearRect(0,0,w,h);ctx.fillStyle=color;
  for(let x=0;x<w;x+=2){
    let at=x/w*seconds;if(loop)at%=buffer.duration;
    if(at>=buffer.duration)continue;
    const a=Math.floor(at*buffer.sampleRate),span=Math.max(1,Math.floor(seconds/w*2*buffer.sampleRate));
    let peak=0;
    for(let j=a;j<Math.min(data.length,a+span);j+=Math.max(1,Math.floor(span/24)))peak=Math.max(peak,Math.abs(data[j]));
    const size=Math.max(1,Math.sqrt(peak)*h);ctx.fillRect(x,(h-size)/2,1.5,size);
  }
}
function queueSourceWave(s,clip,file,duration){
  // 분할·속도 변경으로 owner가 복사되어도 같은 원본의 진행 상태를 본다.
  const wave=clip.waveform={state:'reading',levels:[],peak:0};
  const notify=()=>{if(session===s && s.clip)drawTrackWave(sequenceTakes(s));};
  s.waveQueue=(s.waveQueue||Promise.resolve()).then(async()=>{
    if(s.controller.signal.aborted)return [];
    const {readSourceWave}=await import('./source-wave.mjs?v=wave1');
    await readSourceWave(file,duration,wave,notify,s.controller.signal);
    return wave.state==='ready'?wave.levels:[];
  }).catch(()=>{wave.state='unavailable';notify();return [];});
  return s.waveQueue;
}
function renderMusicWave(s,total){
  const canvas=byId('musicWave'),url=s.clip.music;
  byId('musicLane').querySelector('span').textContent=url?(byId('music').selectedOptions[0]?.text||'배경 음악'):'＋ 음악';
  canvas.hidden=!url;
  if(!url){delete canvas.dataset.key;return;}
  const key=s.id+' '+url+' '+total;
  if(canvas.dataset.key===key)return;
  canvas.dataset.key=key;
  if(s.musicPreviewUrl!==url){
    s.musicPreviewUrl=url;s.musicPreview=loadMixBuffer(url,s.controller.signal);
  }
  s.musicPreview.then(buffer=>{
    if(canvas.dataset.key===key && session===s)drawMixBuffer(canvas,buffer,total,'#6fc28a',true);
  }).catch(()=>{if(canvas.dataset.key===key){canvas.hidden=true;delete canvas.dataset.key;}});
}
function showTools(target){
  if(!session?.clip)return;
  byId('editSettings').open=true;document.body.classList.add('show-tools');document.body.dataset.tools=target==='quickPublish'?'publish':'settings';
  requestAnimationFrame(()=>byId(target)?.scrollIntoView({block:'nearest'}));
}
function mixDialog(title,saveFn){
  const dialog=byId('mixDialog');
  if(!dialog.open)dialog.showModal();
  byId('mixTitle').textContent=title;byId('mixError').textContent='';
  byId('mixOptions').replaceChildren();byId('fxPanel').hidden=true;
  mixDialogSave=saveFn;return byId('mixOptions');
}
function mixField(container,label,input){
  const el=document.createElement('label');el.append(label,input);container.append(el);return input;
}
function numField(container,label,value,max,min=0){
  const input=document.createElement('input');input.type='number';input.step='.01';input.min=min;input.max=max;input.value=Number(value.toFixed(3));
  const field=mixField(container,label,input);
  // 시작 시간은 숫자를 치지 않아도 지금 재생 위치로 맞출 수 있게
  if(label.startsWith('시작')){
    const now=mixButton('지금 재생 위치로',()=>{input.value=Number(Math.min(max,Math.max(min,session?.trackTime||0)).toFixed(2));},'mix-now');
    input.parentElement.append(now);
  }
  return field;
}
function mixChanged(s){
  markEdited();renderCutTrack(s);seekCutTrack(s,s.trackTime||0);renderPreview();
}
function positionBlock(button,start,duration,total){
  button.style.left=(100*start/total)+'%';button.style.width=(100*Math.min(duration,total-start)/total)+'%';
}
function drawCues(s,type,total){
  const sound=type==='sfx',lane=byId(sound?'sfxLane':'captionLane');
  lane.replaceChildren();
  const safeTotal=Math.max(0.1,total);
  const cues=sound?(s.sounds||[]):(s.captions||[]);
  for(const cue of cues){
    if(cue.start>=safeTotal)continue;
    const name=sound?cue.name:cue.text;
    const button=document.createElement('button');
    button.type='button';button.className='cue-block';button.textContent=name;
    button.setAttribute('aria-label',name+' '+cutClock(cue.start));
    button.setAttribute('aria-pressed',String(s.activeCue===cue));
    positionBlock(button,cue.start,cue.duration,safeTotal);
    if(sound){
      const wave=document.createElement('canvas');wave.width=120;wave.height=24;
      button.dataset.soundName=name;
      button.classList.toggle('short-sound',cue.duration/safeTotal*lane.clientWidth<32);
      button.replaceChildren(wave);drawMixBuffer(wave,cue.buffer,cue.duration,'#bc86e9',false);
    }
    let moved=false;
    button.addEventListener('pointerdown',event=>{
      if(!editableEffects()||event.button!==0)return;
      event.stopPropagation();
      moved=false;
      const beforeStart=cue.start||0, beforeDur=cue.duration||1;
      const startX=event.clientX, laneW=lane.getBoundingClientRect().width||1;
      const rect=button.getBoundingClientRect();
      const edge=(!sound && rect.width>=34 && event.clientX-rect.left<10)?'start':(!sound && rect.width>=34 && rect.right-event.clientX<10)?'end':'move';
      try{button.setPointerCapture(event.pointerId);}catch(_){}
      button.onpointermove=e=>{
        if(Math.abs(e.clientX-startX)>4)moved=true;
        if(!moved)return;
        const delta=(e.clientX-startX)*safeTotal/laneW;
        if(edge==='start'){
          cue.start=Math.max(0,Math.min(beforeStart+beforeDur-0.2,beforeStart+delta));
          cue.duration=beforeStart+beforeDur-cue.start;
        }else if(edge==='end'){
          cue.duration=Math.max(0.2,Math.min(safeTotal-beforeStart,beforeDur+delta));
        }else{
          cue.start=Math.max(0,Math.min(safeTotal-beforeDur,beforeStart+delta));
        }
        positionBlock(button,cue.start,cue.duration,safeTotal);
      };
      const finish=cancel=>{
        button.onpointermove=button.onpointerup=button.onpointercancel=null;
        if(cancel){cue.start=beforeStart;cue.duration=beforeDur;positionBlock(button,cue.start,cue.duration,safeTotal);return;}
        s.activeCue=cue;selectMix(s,type);
        if(moved){
          mixChanged(s);
          showMixHint(`${name} · ${cue.start.toFixed(1)}초`);
        }else{
          editCue(s,type,cue);
        }
      };
      button.onpointerup=()=>finish(false);
      button.onpointercancel=()=>finish(true);
    });
    lane.append(button);
  }
  if(!sound){
    let offset=0;
    for(const take of sequenceTakes(s)){
      const rate=take.owner.rate||1;
      for(const line of take.owner.lines||[]){
        const start=Math.max(take.start,line.start),end=Math.min(take.end,line.end);
        if(!line.text||!take.owner.showCaptions||end<=start)continue;
        const button=document.createElement('button');
        button.type='button';button.className='cue-block';button.textContent=line.text;
        const placeLine=()=>positionBlock(button,offset+(Math.max(take.start,line.start)-take.start)/rate,(Math.min(take.end,line.end)-Math.max(take.start,line.start))/rate,safeTotal);
        placeLine();
        let moved=false;
        button.addEventListener('pointerdown',event=>{
          if(!editableEffects()||event.button!==0)return;
          event.stopPropagation();
          moved=false;
          const bStart=line.start, bEnd=line.end, dur=bEnd-bStart;
          const startX=event.clientX, laneW=lane.getBoundingClientRect().width||1;
          const rect=button.getBoundingClientRect();
          const edge=rect.width>=34 && event.clientX-rect.left<10?'start':rect.width>=34 && rect.right-event.clientX<10?'end':'move';
          try{button.setPointerCapture(event.pointerId);}catch(_){}
          button.onpointermove=e=>{
            if(Math.abs(e.clientX-startX)>4)moved=true;
            if(!moved)return;
            const delta=(e.clientX-startX)*safeTotal/laneW*rate;
            if(edge==='start'){line.start=Math.max(take.start,Math.min(bEnd-0.2,bStart+delta));}
            else if(edge==='end'){line.end=Math.max(bStart+0.2,Math.min(take.end,bEnd+delta));}
            else{line.start=Math.max(take.start,Math.min(take.end-dur,bStart+delta));line.end=line.start+dur;}
            placeLine();
          };
          const finish=cancel=>{
            button.onpointermove=button.onpointerup=button.onpointercancel=null;
            if(cancel){line.start=bStart;line.end=bEnd;placeLine();return;}
            if(moved){mixChanged(s);showMixHint(`자막 이동 · ${line.start.toFixed(1)}초`);}
            else editSourceCaption(s,line);
          };
          button.onpointerup=()=>finish(false);
          button.onpointercancel=()=>finish(true);
        });
        lane.prepend(button);
      }
      offset+=takeDuration(take);
    }
  }
  if(!lane.children.length)lane.append(mixButton(sound?'＋ 효과음':'＋ 자막',()=>{selectMix(s,type);editCue(s,type);},'mix-empty'));
}
const MIX_CAPTION_FONTS=[
  {id:'pretendard',name:'프리텐다드',css:'"Pretendard Variable", Pretendard, sans-serif',w:700},
  {id:'dohyeon',name:'도현체',css:'"Do Hyeon", sans-serif',w:400},
  {id:'blackhan',name:'블랙한산스',css:'"Black Han Sans", sans-serif',w:400},
  {id:'jua',name:'주아체',css:'"Jua", sans-serif',w:400},
  {id:'bagel',name:'베이글팻',css:'"Bagel Fat One", sans-serif',w:400},
  {id:'gasoek',name:'가석체',css:'"Gasoek One", sans-serif',w:400},
  {id:'gugi',name:'구기체',css:'"Gugi", sans-serif',w:400},
  {id:'gowun',name:'고운바탕',css:'"Gowun Batang", serif',w:700},
  {id:'songmyung',name:'송명체',css:'"Song Myung", serif',w:400},
  {id:'hahmlet',name:'함렛 세리프',css:'"Hahmlet", serif',w:700},
  {id:'pen',name:'나눔손글씨 펜',css:'"Nanum Pen Script", cursive',w:400,sz:19},
  {id:'brush',name:'나눔손글씨 붓',css:'"Nanum Brush Script", cursive',w:400,sz:19},
  {id:'gaegu',name:'개구쟁이',css:'"Gaegu", cursive',w:700,sz:17},
  {id:'himelody',name:'하이멜로디',css:'"Hi Melody", cursive',w:400,sz:18},
  {id:'gamja',name:'감자꽃',css:'"Gamja Flower", cursive',w:400,sz:17},
  {id:'poorstory',name:'푸어스토리',css:'"Poor Story", cursive',w:400,sz:16},
  {id:'yeonsung',name:'연성체',css:'"Yeon Sung", cursive',w:400,sz:16},
  {id:'dokdo',name:'동해독도체',css:'"East Sea Dokdo", cursive',w:400,sz:20}
];
function buildCaptionStylePicker(box,opts){
  const state={
    font:opts.font||'pretendard',
    style:(opts.style&&opts.style!=='inherit')?opts.style:'box',
    size:Number(opts.size)||1,
    color:opts.color||'#ffffff',
    posX:typeof opts.posX==='number'?opts.posX:0.5,
    posY:typeof opts.posY==='number'?opts.posY:0.82
  };
  const emit=()=>{if(typeof opts.onLive==='function')opts.onLive({...state});};
  // 1) 라이브 폰트 미리보기: 기본 접힘(가로 캐러셀 18종) ↔ 전체 펼치기 토글
  const fHead=document.createElement('div');fHead.className='ar-font-head';
  const fLbl=document.createElement('span');fLbl.className='ar-cap-sec-lbl';fLbl.textContent=`글꼴 미리보기 (${MIX_CAPTION_FONTS.length}종)`;
  const toggleBtn=document.createElement('button');toggleBtn.type='button';toggleBtn.className='ar-font-toggle';toggleBtn.textContent='전체 펼치기 ▾';
  fHead.append(fLbl,toggleBtn);

  const carWrap=document.createElement('div');carWrap.className='ar-font-carousel-wrap';
  const prevNav=document.createElement('button');prevNav.type='button';prevNav.className='ar-font-nav';prevNav.textContent='‹';prevNav.setAttribute('aria-label','이전 폰트');
  const nextNav=document.createElement('button');nextNav.type='button';nextNav.className='ar-font-nav';nextNav.textContent='›';nextNav.setAttribute('aria-label','다음 폰트');
  const fList=document.createElement('div');fList.className='ar-font-carousel';
  const sampleEls=[];
  const getSampleText=()=>{
    const v=opts.textInput?opts.textInput.value.trim():(opts.sampleFallback||'');
    return v?v.slice(0,14):'가나다 릴스 자막';
  };
  MIX_CAPTION_FONTS.forEach(f=>{
    const card=document.createElement('button');card.type='button';card.className='ar-font-card';
    card.setAttribute('aria-pressed',String(state.font===f.id));
    const sample=document.createElement('span');sample.className='ar-font-sample';
    sample.style.fontFamily=f.css;sample.style.fontWeight=String(f.w);
    if(f.sz)sample.style.fontSize=f.sz+'px';
    sample.style.color=state.color==='#111111'?'#e5e7eb':state.color;
    sample.textContent=getSampleText();
    const nm=document.createElement('span');nm.className='ar-font-name';nm.textContent=f.name;
    card.append(sample,nm);
    card.addEventListener('click',()=>{
      state.font=f.id;
      [...fList.children].forEach(c=>c.setAttribute('aria-pressed','false'));
      card.setAttribute('aria-pressed','true');
      emit();
    });
    sampleEls.push(sample);
    fList.append(card);
  });
  prevNav.addEventListener('click',()=>{fList.scrollBy({left:-276,behavior:'smooth'});});
  nextNav.addEventListener('click',()=>{fList.scrollBy({left:276,behavior:'smooth'});});
  carWrap.append(prevNav,fList,nextNav);

  let expanded=false;
  toggleBtn.addEventListener('click',()=>{
    expanded=!expanded;
    toggleBtn.textContent=expanded?'캐러셀로 접기 ▴':'전체 펼치기 ▾';
    prevNav.style.display=expanded?'none':'flex';
    nextNav.style.display=expanded?'none':'flex';
    fList.className=expanded?'ar-font-grid':'ar-font-carousel';
  });

  const refreshSamples=()=>{
    const txt=getSampleText();
    sampleEls.forEach(el=>{el.textContent=txt;el.style.color=state.color==='#111111'?'#e5e7eb':state.color;});
  };
  if(opts.textInput)opts.textInput.addEventListener('input',()=>{refreshSamples();emit();});
  box.append(fHead,carWrap);

  // 2) 자막 모양 비주얼 칩
  const sLbl=document.createElement('span');sLbl.className='ar-cap-sec-lbl';sLbl.textContent='자막 모양';
  const sGrid=document.createElement('div');sGrid.className='ar-style-grid';
  [
    ['box','어두운 박스','background:#111318;color:#fff;'],
    ['cinema','시네마 밑줄','background:#181920;color:#fff;text-decoration:underline;font-style:italic;'],
    ['outline','검정 테두리','background:#2a2d36;color:#fff;text-shadow:-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000;'],
    ['yellowBox','노란 박스','background:#facc15;color:#111;'],
    ['pinkBox','네온 핑크','background:#e11d48;color:#fff;'],
    ['shadow','그림자','background:#22242c;color:#fff;text-shadow:0 2px 6px #000;']
  ].forEach(([val,lbl,css])=>{
    const b=document.createElement('button');b.type='button';b.className='ar-style-chip';b.textContent=lbl;b.style.cssText=css;
    b.setAttribute('aria-pressed',String(state.style===val));
    b.addEventListener('click',()=>{
      state.style=val;
      [...sGrid.children].forEach(c=>c.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true');
      emit();
    });
    sGrid.append(b);
  });
  box.append(sLbl,sGrid);

  // 3) 글자 색상 스와치 + 크기
  const cLbl=document.createElement('span');cLbl.className='ar-cap-sec-lbl';cLbl.textContent='글자 색상 · 크기';
  const cRow=document.createElement('div');cRow.className='ar-chip-row';cRow.style.alignItems='center';
  ['#ffffff','#fde047','#38bdf8','#fb7185','#4ade80','#fb923c','#111111'].forEach(hex=>{
    const sw=document.createElement('button');sw.type='button';sw.className='ar-swatch-btn';sw.style.background=hex;
    sw.setAttribute('aria-pressed',String(state.color.toLowerCase()===hex));
    sw.addEventListener('click',()=>{
      state.color=hex;
      cRow.querySelectorAll('.ar-swatch-btn').forEach(b=>b.setAttribute('aria-pressed','false'));
      sw.setAttribute('aria-pressed','true');
      refreshSamples();emit();
    });
    cRow.append(sw);
  });
  const colPick=document.createElement('input');colPick.type='color';colPick.value=state.color;
  colPick.style.cssText='width:26px;height:24px;padding:0;border:0;background:none;cursor:pointer;';
  colPick.addEventListener('input',()=>{state.color=colPick.value;refreshSamples();emit();});
  cRow.append(colPick);
  box.append(cLbl,cRow);

  const szRow=document.createElement('div');szRow.className='ar-chip-row';szRow.style.alignItems='center';
  const szRange=document.createElement('input');szRange.type='range';szRange.min='55';szRange.max='200';szRange.step='5';
  szRange.value=String(Math.round(state.size*100));
  szRange.style.cssText='flex:1;min-width:90px;';
  const szVal=document.createElement('span');szVal.style.cssText='font-size:11px;color:#cbd5e1;min-width:34px;text-align:right;font-variant-numeric:tabular-nums;';
  szVal.textContent=Math.round(state.size*100)+'%';
  const syncSzChips=()=>{
    const cur=Math.round(state.size*100);
    szVal.textContent=cur+'%';
    szRow.querySelectorAll('.ar-mini-chip').forEach(c=>c.setAttribute('aria-pressed',String(Math.abs(Number(c.dataset.sz)-cur)<=5)));
  };
  [['작게',75],['보통',100],['크게',135],['특대',175]].forEach(([lbl,pct])=>{
    const b=document.createElement('button');b.type='button';b.className='ar-mini-chip';b.textContent=lbl;b.dataset.sz=String(pct);
    b.addEventListener('click',()=>{
      state.size=pct/100;szRange.value=String(pct);syncSzChips();emit();
    });
    szRow.append(b);
  });
  szRange.addEventListener('input',()=>{state.size=Number(szRange.value)/100;syncSzChips();emit();});
  szRow.append(szRange,szVal);
  syncSzChips();
  box.append(szRow);

  // 4) 가로·세로 위치 칩 + 슬라이더 (상하좌우 자유 드래그)
  const pLbl=document.createElement('span');pLbl.className='ar-cap-sec-lbl';pLbl.textContent='위치 (미리보기 화면에서 상하좌우 직접 드래그 가능)';
  const xRow=document.createElement('div');xRow.className='ar-chip-row';
  const syncXChips=()=>{
    const curX=Math.round(state.posX*100);
    [...xRow.children].forEach(c=>c.setAttribute('aria-pressed',String(Math.abs(Number(c.dataset.xpct)-curX)<=8)));
  };
  [['← 왼쪽',26],['가운데',50],['오른쪽 →',74]].forEach(([lbl,pct])=>{
    const xb=document.createElement('button');xb.type='button';xb.className='ar-mini-chip';xb.textContent=lbl;xb.dataset.xpct=String(pct);
    xb.addEventListener('click',()=>{state.posX=pct/100;syncXChips();emit();});
    xRow.append(xb);
  });
  syncXChips();

  const pRow=document.createElement('div');pRow.className='ar-chip-row';
  const pRange=document.createElement('input');pRange.type='range';pRange.min='12';pRange.max='90';pRange.step='1';
  pRange.value=String(Math.round(state.posY*100));
  pRange.style.cssText='width:100%;margin-bottom:6px;';
  const syncPosChips=()=>{
    const cur=Math.round(state.posY*100);
    [...pRow.children].forEach(c=>c.setAttribute('aria-pressed',String(Math.abs(Number(c.dataset.pct)-cur)<=4)));
  };
  [['상단',18],['중상단',35],['정중앙',50],['중하단',68],['하단',82]].forEach(([lbl,pct])=>{
    const pb=document.createElement('button');pb.type='button';pb.className='ar-mini-chip';pb.textContent=lbl;pb.dataset.pct=String(pct);
    pb.addEventListener('click',()=>{state.posY=pct/100;pRange.value=String(pct);syncPosChips();emit();});
    pRow.append(pb);
  });
  pRange.addEventListener('input',()=>{state.posY=Number(pRange.value)/100;syncPosChips();emit();});
  syncPosChips();
  box.append(pLbl,xRow,pRow,pRange);
  return ()=>({...state});
}
function editSourceCaption(s,line){
  if(!editableEffects())return;
  const clip=s.clip;
  let input,getStyle;
  const box=mixDialog('자막 편집 · 폰트·위치',()=>{
    const st=getStyle();
    line.text=input.value.trim();
    clip.captionFont=st.font;clip.captionStyle=st.style;clip.captionSize=st.size;clip.captionColor=st.color;clip.captionPosX=st.posX;clip.captionPosY=st.posY;
    mixChanged(s);
  });
  input=mixField(box,'자막',document.createElement('input'));input.maxLength=240;input.value=line.text;
  getStyle=buildCaptionStylePicker(box,{
    textInput:input,font:clip.captionFont,style:clip.captionStyle||clip.style,size:clip.captionSize,color:clip.captionColor,posX:clip.captionPosX,posY:clip.captionPosY,
    onLive:(st)=>{
      line.text=input.value.trim()||line.text;
      clip.captionFont=st.font;clip.captionStyle=st.style;clip.captionSize=st.size;clip.captionColor=st.color;clip.captionPosX=st.posX;clip.captionPosY=st.posY;
      if(s.joined||s.timelineCuts)seekCutTrack(s,s.trackTime||0);else renderPreview();
    }
  });
}
function editCue(s,type,cue){
  if(!editableEffects())return;
  const sound=type==='sfx',total=mixTotal(s);
  let choice,text,start,len,getCapStyle;
  const box=mixDialog(mixNames[type],async()=>{
    const at=start.valueAsNumber;if(!Number.isFinite(at)||at<0||at>=total)throw Error('영상 안의 시작 시간을 입력해 주세요.');
    let data,duration;
    if(sound){
      const id=choice.value;if(!id)throw Error('효과음을 골라 주세요.');
      const url='/assets/sfx/'+id+'.wav';
      let buffer=soundBuffers.get(url);
      if(!buffer){buffer=await loadMixBuffer(url,s.controller.signal);soundBuffers.set(url,buffer);}
      data={buffer,id,name:choice.selectedOptions[0].text};duration=buffer.duration;
    }else{
      if(!text.value.trim())throw Error('자막을 입력해 주세요.');
      const st=getCapStyle();
      data={text:text.value.trim(),style:st.style,font:st.font,size:st.size,color:st.color,posX:st.posX,posY:st.posY};
      duration=len.valueAsNumber;
      if(!Number.isFinite(duration)||duration<=0)throw Error('자막 길이를 입력해 주세요.');
    }
    if(session!==s)return;
    const item=cue||{};Object.assign(item,data,{start:at,duration:Math.min(duration,total-at)});
    if(!cue)(sound?(s.sounds||=[]):(s.captions||=[])).push(item);
    s.activeCue=item;mixChanged(s);
  });
  if(sound){
    choice=mixField(box,'효과음 선택',document.createElement('select'));
    const sfxBar=document.createElement('div');
    sfxBar.style.cssText='display:flex;gap:5px;flex-wrap:wrap;margin:6px 0 8px;';
    const previewBtn=document.createElement('button');
    previewBtn.type='button';previewBtn.textContent='▶ 미리듣기';
    previewBtn.style.cssText='padding:5px 10px;border-radius:7px;border:1px solid #4cc38a;background:#112920;color:#86efac;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:6px;';
    let previewSrc=null;
    previewBtn.addEventListener('click',async()=>{
      const id=choice.value;if(!id)return;
      try{
        if(previewSrc){try{previewSrc.stop();}catch(_){}}
        mixAudio||=new AudioContext();if(mixAudio.state==='suspended')await mixAudio.resume();
        const url='/assets/sfx/'+id+'.wav';
        let buf=soundBuffers.get(url);
        if(!buf){buf=await loadMixBuffer(url,s.controller.signal);soundBuffers.set(url,buf);}
        const src=mixAudio.createBufferSource();src.buffer=buf;src.connect(mixAudio.destination);src.start();previewSrc=src;
      }catch(_){}
    });
    box.append(previewBtn,sfxBar);
    const cats=[['all','전체'],['transition','전환'],['impact','임팩트'],['sparkle','반짝임'],['camera','카메라'],['click','클릭'],['deal','강조'],['outro','아웃트로'],['texture','질감']];
    mixLibrary.then(library=>{
      const allFx=library.effects||[];
      const fillCat=(catKey)=>{
        const prev=choice.value;
        choice.replaceChildren();
        const list=catKey==='all'?allFx:allFx.filter(e=>String(e.id||'').includes('-'+catKey+'-'));
        for(const e of list)choice.add(new Option(e.name,e.id));
        if(cue&&list.some(e=>e.id===cue.id))choice.value=cue.id;
        else if(prev&&list.some(e=>e.id===prev))choice.value=prev;
      };
      cats.forEach(([k,lbl],idx)=>{
        const b=document.createElement('button');b.type='button';b.textContent=lbl;
        b.style.cssText='padding:4px 8px;border-radius:999px;border:1px solid #454750;background:'+(idx===0?'#3b82f6':'#262830')+';color:#fff;font-size:11px;cursor:pointer;';
        b.addEventListener('click',()=>{
          [...sfxBar.children].forEach(c=>c.style.background='#262830');
          b.style.background='#3b82f6';
          fillCat(k);
        });
        sfxBar.append(b);
      });
      fillCat('all');
    }).catch(()=>{byId('mixError').textContent='효과음 목록을 불러올 수 없어요.';});
  }else{
    text=mixField(box,'자막',document.createElement('input'));text.maxLength=240;text.value=cue?.text||'';
    text.placeholder='여기에 자막을 치면 아래 폰트가 바로 미리보기 됩니다';
    getCapStyle=buildCaptionStylePicker(box,{
      textInput:text,
      font:cue?.font||s.clip.captionFont,
      style:(cue?.style&&cue.style!=='inherit')?cue.style:(s.clip.captionStyle||'box'),
      size:cue?.size||s.clip.captionSize||1,
      color:cue?.color||s.clip.captionColor||'#ffffff',
      posX:typeof cue?.posX==='number'?cue.posX:(s.clip.captionPosX||0.5),
      posY:typeof cue?.posY==='number'?cue.posY:(s.clip.captionPosY||0.82),
      onLive:(st)=>{
        if(cue){
          Object.assign(cue,{text:text.value.trim()||cue.text,font:st.font,style:st.style,size:st.size,color:st.color,posX:st.posX,posY:st.posY});
          if(s.joined||s.timelineCuts)seekCutTrack(s,s.trackTime||0);else renderPreview();
        }
      }
    });
  }
  start=numField(box,'시작(초)',cue?.start??Math.max(0,Math.min(s.trackTime||0,total-.1)),total);
  if(!sound)len=numField(box,'길이(초)',cue?.duration||Math.min(2,total),total,.01);
}
function effectDialog(tab='영상 효과'){
  if(tab==='전환'){openCutPicker(session);return;}
  if(tab==='스티커'){if(typeof window.openShortsStickerDialog==='function')window.openShortsStickerDialog(session);return;}
  const box=mixDialog('효과',null),nav=document.createElement('div');nav.className='fx-tabs';
  for(const name of ['영상 효과','테마 색감','컷아웃','스티커','전환','효과음']){
    const b=mixButton(name,()=>{if(name==='효과음'){selectMix(session,'sfx');editCue(session,'sfx');}else effectDialog(name);});
    b.setAttribute('aria-pressed',String(name===tab));nav.append(b);
  }
  box.append(nav);byId('fxPanel').hidden=false;

  const live=byId('overlay'),source=session.joined||session.timelineCuts?live:video;
  const still=document.createElement('canvas');still.width=96;still.height=84;
  const w=source.videoWidth||source.width,h=source.videoHeight||source.height;
  if(w && h && (source!==video || video.readyState>=2)){
    const scale=Math.max(96/w,84/h);
    still.getContext('2d').drawImage(source,(96-w*scale)/2,(84-h*scale)/2,w*scale,h*scale);
  }
  const list=byId('fxPresetList'),previews=[];
  const tabKey=tab==='테마 색감'?'theme':tab==='컷아웃'?'cutout':'fx';
  for(const button of list.children){
    const rTab=effectRecipes[Number(button.dataset.recipe)]?.tab||'fx';
    button.hidden=rTab!==tabKey;
    if(button.hidden)continue;
    let thumb=button.querySelector('canvas');
    if(!thumb){thumb=document.createElement('canvas');thumb.width=96;thumb.height=84;button.prepend(thumb);}
    const ctx=thumb.getContext('2d'),recipe=effectRecipes[Number(button.dataset.recipe)];
    ctx.drawImage(still,0,0);previews.push({ctx,recipe,button});
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last=-100;
  function animate(now){
    if(!byId('mixDialog').open || !nav.isConnected)return;
    if(now-last>=80){
      last=now;const bounds=list.getBoundingClientRect();
      for(const {ctx,recipe,button} of previews){
        const rect=button.getBoundingClientRect();
        if(rect.right<bounds.left || rect.left>bounds.right)continue;
        ctx.drawImage(still,0,0);
        const phase=reduced?.45:Math.min(1,now%1450/950);
        paintEffects(ctx,{effects:[{...recipe,start:0,duration:1}]},phase);
      }
    }
    if(!reduced)requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
function currentTake(s){return trackPosition(sequenceTakes(s),s.trackTime||0);}
function changeTake(s,replace){
  const cuts=sequenceTakes(s).slice(),pos=currentTake(s);
  if(!pos)return;
  s.trackRedo=[];(s.trackUndo||=[]).push({cuts:s.timelineCuts,cursor:s.trackTime||0});
  cuts[pos.i]=replace(pos.take);s.timelineCuts=cuts;
  byId('work').classList.add('cut-arranged');
  s.trackTime=Math.min(s.trackTime||0,mixTotal(s));mixChanged(s);
}
function pickSpeed(s){
  const box=mixDialog('클립 속도',()=>changeTake(s,t=>({...t,owner:{...t.owner,rate:Number(select.value)}})));
  const select=mixField(box,'재생 속도',document.createElement('select'));
  for(const value of [.5,.8,1,1.25,1.5,2])select.add(new Option(value+'배',value));
  select.value=currentTake(s).take.owner.rate||1;
}
function applyMusicUrl(s,url,label){
  const musicSel=byId('music');
  if(url && ![...musicSel.options].some(o=>o.value===url)){
    const opt=new Option(label||'선택한 음악',url);
    musicSel.add(opt);
  }
  musicSel.value=url||'';
  musicSel.dispatchEvent(new Event('input',{bubbles:true}));
  renderCutTrack(s);
}
function pickMusic(s,tab='내장 100곡'){
  let previewAudio=null;
  const stopPreview=()=>{if(previewAudio){try{previewAudio.pause();previewAudio.src='';}catch(_){} previewAudio=null;}};
  const box=mixDialog('배경 음악',()=>{stopPreview();});
  byId('mixDialog').addEventListener('close',stopPreview,{once:true});
  const nav=document.createElement('div');nav.className='fx-tabs';
  for(const name of ['내장 100곡','실시간 스트리밍','내 음원·가요']){
    const b=mixButton(name,()=>{stopPreview();pickMusic(s,name);});
    b.setAttribute('aria-pressed',String(name===tab));nav.append(b);
  }
  box.append(nav);

  if(tab==='내장 100곡'){
    const select=mixField(box,'곡 선택',byId('music').cloneNode(true));select.removeAttribute('id');select.value=s.clip.music||'';
    select.addEventListener('change',()=>applyMusicUrl(s,select.value,select.selectedOptions[0]?.text));
    return;
  }

  if(tab==='내 음원·가요'){
    const fileBtn=document.createElement('label');
    fileBtn.style.cssText='display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:10px;border:1px dashed #3b82f6;background:#132038;color:#bfdbfe;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:10px;';
    fileBtn.textContent='📁 내 기기 음원(MP3·M4A·WAV) 불러오기';
    const inp=document.createElement('input');inp.type='file';inp.accept='audio/*,video/mp4';inp.style.display='none';
    inp.addEventListener('change',()=>{
      const file=inp.files&&inp.files[0];if(!file)return;
      const blobUrl=URL.createObjectURL(file);
      applyMusicUrl(s,blobUrl,'📁 '+file.name.replace(/\.[^.]+$/,''));
      showMixHint('내 음원을 배경음악으로 적용했어요!');
      byId('mixDialog').close();
    });
    fileBtn.append(inp);
    const instaBtn=document.createElement('button');
    instaBtn.type='button';
    instaBtn.style.cssText='width:100%;padding:12px;border-radius:10px;border:1px solid #e11d48;background:#2b111b;color:#fecdd3;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px;';
    instaBtn.textContent='🎵 인스타 인기 가요용 모드 (배경음악 끄기)';
    instaBtn.addEventListener('click',()=>{
      applyMusicUrl(s,'','');
      showMixHint('배경음악 없이 저장 → 인스타 릴스에서 인기 가요를 1탭으로 얹으세요!');
      byId('mixDialog').close();
    });
    const note=document.createElement('p');
    note.style.cssText='font-size:11.5px;color:#9ca3af;line-height:1.5;margin:0;';
    note.textContent='인스타그램 릴스 업로드 화면에서 공식 인기 가요를 얹을 때는 배경음악을 끄고 저장하는 것이 조회수와 저작권 모두 가장 안전합니다.';
    box.append(fileBtn,instaBtn,note);
    return;
  }

  // 실시간 스트리밍 탭 (Audius 오픈 스트리밍 API + 한글 검색 자동 매핑 + 스피너 고정 높이)
  const koMap = {
    '한국':'seoul kpop','한국곡':'seoul kpop','가요':'kpop vocal','케이팝':'kpop','서울':'seoul',
    '발라드':'korean ballad','카페':'cafe lofi','감성':'emotional chill','신나는':'upbeat pop',
    '힙합':'krnb hiphop','재즈':'jazz','운동':'workout trap','피아노':'piano','어쿠스틱':'acoustic',
    '로파이':'lofi','팝':'pop vocal','보컬':'vocal pop','브이로그':'vlog chill'
  };
  const mapKoQuery = (raw) => {
    const t = String(raw || '').trim();
    if (!t) return '';
    if (koMap[t]) return koMap[t];
    for (const [k, v] of Object.entries(koMap)) { if (t.includes(k)) return v; }
    return t;
  };
  const row=document.createElement('div');row.style.cssText='display:flex;gap:6px;margin-bottom:8px;';
  const qInp=document.createElement('input');qInp.type='text';qInp.placeholder='노래·장르 검색 (예: 케이팝, 감성, 카페, pop, vocal)';
  qInp.style.cssText='flex:1;padding:7px 9px;border-radius:8px;border:1px solid #454750;background:#16171c;color:#fff;font-size:12.5px;';
  const goBtn=document.createElement('button');goBtn.type='button';goBtn.textContent='검색';
  goBtn.style.cssText='padding:0 12px;border-radius:8px;border:0;background:#3b82f6;color:#fff;font-size:12px;font-weight:700;cursor:pointer;';
  row.append(qInp,goBtn);
  const chips=document.createElement('div');chips.style.cssText='display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;';
  const listEl=document.createElement('div');listEl.style.cssText='display:flex;flex-direction:column;gap:6px;min-height:210px;max-height:220px;overflow-y:auto;';
  box.append(row,chips,listEl);

  async function loadTracks(query,genre){
    stopPreview();
    listEl.innerHTML='<div class="ar-mix-loading"><span class="ar-mix-spinner"></span><span>실시간 스트리밍 곡을 불러오는 중…</span></div>';
    try{
      const mapped=mapKoQuery(query);
      const url=mapped
        ?`https://api.audius.co/v1/tracks/search?app_name=AutoReelsMaker&query=${encodeURIComponent(mapped)}&limit=15`
        :`https://api.audius.co/v1/tracks/trending?app_name=AutoReelsMaker&limit=15${genre?'&genre='+encodeURIComponent(genre):''}`;
      const res=await fetch(url,{headers:{Accept:'application/json'}});
      const data=(await res.json())?.data||[];
      const tracks=data.filter(t=>t&&t.id&&t.is_streamable!==false);
      listEl.replaceChildren();
      if(!tracks.length){listEl.innerHTML='<div class="ar-mix-loading" style="color:#9ca3af;">검색 결과가 없어요. 다른 키워드(예: 케이팝, 카페, pop, vocal)로 검색해 보세요.</div>';return;}
      tracks.forEach(t=>{
        const item=document.createElement('div');
        item.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;background:#181920;border:1px solid #2e303a;';
        const info=document.createElement('div');info.style.cssText='min-width:0;flex:1;';
        const ttl=document.createElement('div');ttl.textContent=t.title||'Untitled';ttl.style.cssText='font-size:12px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        const sub=document.createElement('div');sub.textContent=`${t.user?.name||''}${t.genre?' · '+t.genre:''}`;sub.style.cssText='font-size:10.5px;color:#9ca3af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        info.append(ttl,sub);
        const streamUrl=`https://api.audius.co/v1/tracks/${encodeURIComponent(t.id)}/stream?app_name=AutoReelsMaker`;
        const pBtn=document.createElement('button');pBtn.type='button';pBtn.textContent='▶';
        pBtn.style.cssText='width:28px;height:28px;border-radius:999px;border:0;background:#2e313c;color:#fff;font-size:11px;cursor:pointer;flex-shrink:0;';
        pBtn.addEventListener('click',()=>{
          if(previewAudio&&previewAudio._id===t.id){stopPreview();pBtn.textContent='▶';return;}
          stopPreview();
          listEl.querySelectorAll('button[data-p]').forEach(b=>b.textContent='▶');
          const a=new Audio(streamUrl);a.crossOrigin='anonymous';a.volume=0.72;a._id=t.id;previewAudio=a;
          pBtn.textContent='⏹';a.onended=()=>{pBtn.textContent='▶';};a.play().catch(()=>{});
        });
        pBtn.dataset.p='1';
        const useBtn=document.createElement('button');useBtn.type='button';useBtn.textContent='적용';
        useBtn.style.cssText='padding:5px 10px;border-radius:999px;border:0;background:#3b82f6;color:#fff;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;';
        useBtn.addEventListener('click',async()=>{
          stopPreview();
          useBtn.disabled=true;
          useBtn.innerHTML='<span class="ar-btn-spinner"></span>로딩';
          applyMusicUrl(s,streamUrl,`🌐 ${t.title||'스트리밍 곡'}`);
          try{if(s.musicPreview)await s.musicPreview;}catch(_){}
          useBtn.disabled=false;
          useBtn.textContent='적용됨';
          showMixHint(`🌐 ${t.title} 적용됨!`);
        });
        item.append(info,pBtn,useBtn);listEl.append(item);
      });
    }catch(_){listEl.innerHTML='<div class="ar-mix-loading" style="color:#fca5a5;">스트리밍 목록을 불러오지 못했어요.</div>';}
  }

  [['🔥 인기','',''],['🇰🇷 K-Pop·서울','seoul kpop',''],['🎤 팝','' ,'Pop'],['🎧 힙합','','Hip-Hop/Rap'],['☕ 로파이','','Lo-Fi'],['⚡ EDM','','Electronic'],['🎸 어쿠스틱','','Acoustic']].forEach(([lbl,q,g],i)=>{
    const cb=document.createElement('button');cb.type='button';cb.textContent=lbl;
    cb.style.cssText='padding:4px 8px;border-radius:999px;border:1px solid #454750;background:'+(i===0?'#3b82f6':'#262830')+';color:#fff;font-size:11px;cursor:pointer;';
    cb.addEventListener('click',()=>{
      [...chips.children].forEach(c=>c.style.background='#262830');cb.style.background='#3b82f6';
      loadTracks(q,g);
    });
    chips.append(cb);
  });
  goBtn.addEventListener('click',()=>loadTracks(qInp.value.trim(),''));
  qInp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loadTracks(qInp.value.trim(),'');}});
  loadTracks('','');
}
// 꺼진 도구는 눌렀을 때 왜 꺼졌는지 알려 줌 (disabled 대신 aria-disabled)
function mixOff(button,off,hint){
  button.setAttribute('aria-disabled',String(!!off));button.classList.toggle('is-off',!!off);
  if(hint)button.dataset.hint=hint;
}
function showMixHint(text){
  if(!text)return;
  let tip=byId('mixHint');
  if(!tip){tip=document.createElement('p');tip.id='mixHint';tip.setAttribute('role','status');document.body.append(tip);}
  tip.textContent=text;tip.classList.add('show');
  clearTimeout(showMixHint.timer);showMixHint.timer=setTimeout(()=>tip.classList.remove('show'),2600);
}
function editGlobalCaptionStyle(s){
  if(!editableEffects())return;
  const clip=s.clip;
  const activeSample=activeCue(s,s.trackTime||0)?.text || clip.lines?.[0]?.text || clip.title || '가나다 릴스 자막';
  let getStyle;
  const box=mixDialog('전체 자막 폰트·위치',()=>{
    const st=getStyle();
    clip.captionFont=st.font;clip.captionStyle=st.style;clip.captionSize=st.size;clip.captionColor=st.color;clip.captionPosX=st.posX;clip.captionPosY=st.posY;
    for(const c of s.captions||[]){c.font=st.font;c.style=st.style;c.size=st.size;c.color=st.color;c.posX=st.posX;c.posY=st.posY;}
    mixChanged(s);
    showMixHint('전체 자막 폰트와 위치를 적용했어요!');
  });
  getStyle=buildCaptionStylePicker(box,{
    sampleFallback:activeSample,
    font:clip.captionFont,style:clip.captionStyle||clip.style,size:clip.captionSize,color:clip.captionColor,posX:clip.captionPosX,posY:clip.captionPosY,
    onLive:(st)=>{
      clip.captionFont=st.font;clip.captionStyle=st.style;clip.captionSize=st.size;clip.captionColor=st.color;clip.captionPosX=st.posX;clip.captionPosY=st.posY;
      for(const c of s.captions||[]){c.font=st.font;c.style=st.style;c.size=st.size;c.color=st.color;c.posX=st.posX;c.posY=st.posY;}
      if(s.joined||s.timelineCuts)seekCutTrack(s,s.trackTime||0);else renderPreview();
    }
  });
}
function openAddTrackDialog(s){
  if(!editableEffects())return;
  const box=mixDialog('트랙 추가',null);
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;';
  const items=[
    ['🎬 영상 클립 추가','타임라인에 영상 이어붙이기',()=>{byId('mixDialog').close();byId('joinFiles').click();}],
    ['★ 스티커 트랙 추가','인스타 스토리 스티커 전용 트랙',()=>{s.showStickerTrack=true;byId('mixDialog').close();renderMix(s);selectMix(s,'sticker');if(typeof window.openShortsStickerDialog==='function')window.openShortsStickerDialog(s);}],
    ['✧ 효과 레이어 추가','색감·컷아웃·영상 효과 겹쳐 쌓기',()=>{byId('mixDialog').close();selectMix(s,'effect');effectDialog('영상 효과');}],
    ['T 자막 트랙 추가','폰트·위치 자유 지정 자막 추가',()=>{byId('mixDialog').close();selectMix(s,'caption');editCue(s,'caption');}],
    ['⌁ 효과음 트랙 추가','효과음 미리듣고 구간 배치',()=>{byId('mixDialog').close();selectMix(s,'sfx');editCue(s,'sfx');}],
    ['♫ 음악·스트리밍 추가','실시간 노래 검색 또는 내 MP3',()=>{byId('mixDialog').close();selectMix(s,'music');pickMusic(s,'실시간 스트리밍');}]
  ];
  items.forEach(([title,desc,fn])=>{
    const b=document.createElement('button');b.type='button';
    b.style.cssText='display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:11px 10px;border-radius:10px;border:1px solid #3a3d48;background:#22242c;color:#fff;text-align:left;cursor:pointer;';
    b.innerHTML=`<strong style="font-size:12.5px;">${title}</strong><span style="font-size:11px;color:#9ca3af;">${desc}</span>`;
    b.addEventListener('click',fn);
    grid.append(b);
  });
  box.append(grid);
}
function drawStickerLane(s,total){
  const label=document.querySelector('[data-track="sticker"]'),row=byId('stickerRow'),lane=byId('stickerLane');
  if(!label||!row||!lane)return;
  const list=s?.stickers||[];
  const show=Boolean(s?.showStickerTrack||list.length);
  label.hidden=!show;row.hidden=!show;
  if(!show)return;
  lane.replaceChildren();
  const safeTotal=Math.max(0.1,total);
  for(const st of list){
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='cue-block';
    btn.textContent=st.label+(st.text?' · '+st.text:'');
    const place=()=>{
      btn.style.left=(100*(st.start||0)/safeTotal)+'%';
      btn.style.width=(100*Math.max(0.25,Math.min(st.duration||2,safeTotal))/safeTotal)+'%';
    };
    place();
    let moved=false;
    btn.addEventListener('pointerdown',event=>{
      if(!editableEffects()||event.button!==0)return;
      event.stopPropagation();
      moved=false;
      const beforeStart=st.start||0, beforeDur=st.duration||2;
      const startX=event.clientX, laneW=lane.getBoundingClientRect().width||1;
      const rect=btn.getBoundingClientRect();
      const edge=rect.width>=34 && event.clientX-rect.left<10?'start':rect.width>=34 && rect.right-event.clientX<10?'end':'move';
      try{btn.setPointerCapture(event.pointerId);}catch(_){}
      btn.onpointermove=e=>{
        if(Math.abs(e.clientX-startX)>4)moved=true;
        if(!moved)return;
        const delta=(e.clientX-startX)*safeTotal/laneW;
        if(edge==='start'){
          st.start=Math.max(0,Math.min(beforeStart+beforeDur-0.25,beforeStart+delta));
          st.duration=beforeStart+beforeDur-st.start;
        }else if(edge==='end'){
          st.duration=Math.max(0.25,Math.min(safeTotal-beforeStart,beforeDur+delta));
        }else{
          st.start=Math.max(0,Math.min(safeTotal-beforeDur,beforeStart+delta));
        }
        place();
      };
      const finish=cancel=>{
        btn.onpointermove=btn.onpointerup=btn.onpointercancel=null;
        if(cancel){st.start=beforeStart;st.duration=beforeDur;place();return;}
        if(moved){
          mixChanged(s);
          showMixHint(`${st.label} · ${st.start.toFixed(1)}초 ~ ${(st.start+st.duration).toFixed(1)}초`);
        }else{
          selectMix(s,'sticker');
          if(typeof window.openShortsStickerDialog==='function')window.openShortsStickerDialog(s);
        }
      };
      btn.onpointerup=()=>finish(false);
      btn.onpointercancel=()=>finish(true);
    });
    lane.append(btn);
  }
  if(!lane.children.length)lane.append(mixButton('＋ 스티커 추가',()=>{selectMix(s,'sticker');if(typeof window.openShortsStickerDialog==='function')window.openShortsStickerDialog(s);},'mix-empty'));
}
function renderMixActions(s){
  const type=s.mixTrack||'video',panel=byId('mixActions');
  const call=id=>()=>byId(id).click();
  const selected=type==='sfx'?(s.sounds||[]):(s.captions||[]);
  const item=selected.includes(s.activeCue)?s.activeCue:selected.at(-1);
  const remove=()=>{if(item){selected.splice(selected.indexOf(item),1);s.activeCue=null;mixChanged(s);}};
  const tools={
    video:[['✂','분할',call('trackSplit')],['⇄','전환',()=>openCutPicker(s)],['◴','속도',()=>pickSpeed(s)],['replace','교체',()=>byId('mixReplace').click()],['⌫','삭제',call('trackDelete')]],
    effect:[['✧','효과 추가',()=>effectDialog('영상 효과')],['✦','컷아웃',()=>effectDialog('컷아웃')],['★','스티커',()=>effectDialog('스티커')],['▣','복제',call('fxCopy')],['⌫','삭제',call('fxRemove')]],
    sticker:[['＋','스티커 추가',()=>{if(typeof window.openShortsStickerDialog==='function')window.openShortsStickerDialog(s);}],['⌫','마지막 삭제',()=>{if(s.stickers?.length){s.stickers.pop();mixChanged(s);}}]],
    sfx:[['＋','효과음 추가',()=>editCue(s,'sfx')],['⌁','효과음 편집',()=>editCue(s,'sfx',item)],['⌫','삭제',remove]],
    source:[['♩',currentTake(s)?.take.owner.keepAudio===false?'소리 켜기':'음소거',()=>changeTake(s,t=>({...t,owner:{...t.owner,keepAudio:t.owner.keepAudio===false}}))]],
    music:[['♫','곡·스트리밍',()=>pickMusic(s,'실시간 스트리밍')],['📁','내 음원',()=>pickMusic(s,'내 음원·가요')],['⌫','음악 제거',()=>{byId('music').value='';byId('music').dispatchEvent(new Event('input',{bubbles:true}));}]],
    caption:[['＋','자막 추가',()=>editCue(s,'caption')],['Aa','폰트·위치',()=>item?editCue(s,'caption',item):editGlobalCaptionStyle(s)],['T','전체 스타일',()=>editGlobalCaptionStyle(s)],['⌫','삭제',remove]]
  };
  panel.replaceChildren(...tools[type].map(([icon,label,fn])=>{
    const button=mixButton(label,()=>{
      if(button.getAttribute('aria-disabled')==='true'){showMixHint(button.dataset.hint);return;}
      if(editableEffects())fn();
    });
    button.prepend(mixIcon(({'✧':'effect','⌁':'sfx','♩':'source','♫':'music','T':'caption'})[icon]||icon));
    if(type==='video' && (label==='분할'||label==='삭제')){
      button.dataset.mirrors=label==='분할'?'trackSplit':'trackDelete';
      mixOff(button,byId(button.dataset.mirrors).disabled,label==='분할'?'클립을 누르고 재생선을 클립 가운데에 두면 나눌 수 있어요.':'클립이 두 개 이상일 때 지울 수 있어요. 먼저 분할해 보세요.');
    }
    if(type==='effect' && label!=='효과 추가' && label!=='컷아웃' && label!=='스티커' && !s.selectedEffect)mixOff(button,true,'효과 트랙에서 효과 블록을 먼저 눌러 주세요.');
    if((type==='sfx'||type==='caption')&&label==='삭제'&&!item)mixOff(button,true,'지울 블록을 먼저 눌러 주세요.');
    return button;
  }));
}
function selectMix(s,key){
  s.mixTrack=key;
  document.querySelectorAll('[data-track]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.track===key)));
  renderMixActions(s);
}
const MUTE_SVG_ON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.8 5.8a9 9 0 0 1 0 12.4"/></svg>';
const MUTE_SVG_OFF='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>';
function syncTrackMuteUI(s){
  const map={
    sfx:{muted:!!s?.muteSfx,row:byId('sfxLane')?.closest('.mix-row')},
    source:{muted:!!(s?.muteSource || currentTake(s)?.take?.owner?.keepAudio===false),row:byId('sourceLane')?.closest('.mix-row')},
    music:{muted:!!s?.muteMusic,row:byId('musicLane')?.closest('.mix-row')}
  };
  for(const [k,info] of Object.entries(map)){
    const btn=document.querySelector(`[data-track="${k}"] .track-mute-btn`);
    if(btn){
      btn.setAttribute('aria-pressed',String(info.muted));
      btn.innerHTML=info.muted?MUTE_SVG_OFF:MUTE_SVG_ON;
      btn.title=info.muted?`${mixNames[k]} 음소거 해제`:`${mixNames[k]} 음소거`;
    }
    if(info.row)info.row.classList.toggle('is-muted',info.muted);
  }
}
function toggleTrackMute(s,key){
  if(!s?.clip)return;
  if(key==='sfx'){
    s.muteSfx=!s.muteSfx;
    if(s.muteSfx)stopMixSounds(s);
    showMixHint(s.muteSfx?'효과음 트랙 음소거됨':'효과음 트랙 소리 켜짐');
  }else if(key==='source'){
    s.muteSource=!s.muteSource;
    video.muted=!!(s.muteSource || s.clip.keepAudio===false);
    const cb=byId('sourceSound');if(cb)cb.checked=!s.muteSource;
    showMixHint(s.muteSource?'원본 소리 트랙 음소거됨':'원본 소리 트랙 소리 켜짐');
  }else if(key==='music'){
    s.muteMusic=!s.muteMusic;
    if(typeof music!=='undefined'&&music){
      music.muted=!!s.muteMusic;
      if(!s.muteMusic)music.volume=quickMusicGain(s.clip,video.currentTime||0);
    }
    showMixHint(s.muteMusic?'음악 트랙 음소거됨':'음악 트랙 소리 켜짐');
  }
  syncTrackMuteUI(s);
  markEdited();
}
function renderMix(s){
  if(!s?.clip)return;
  const total=mixTotal(s);
  drawStickerLane(s,total);drawCues(s,'sfx',total);drawCues(s,'caption',total);renderMusicWave(s,total);
  syncTrackMuteUI(s);
  // 효과 트랙에 여러 레이어가 쌓였을 때 왼쪽 라벨 높이 동기화
  const fxRow=byId('fxLanes')?.closest('.mix-row'), fxLbl=document.querySelector('[data-track="effect"]');
  if(fxRow&&fxLbl){const h=fxRow.offsetHeight;if(h>0)fxLbl.style.height=h+'px';}
  byId('sourceLane').setAttribute('aria-label',currentTake(s)?.take.owner.keepAudio===false?'원본 소리 꺼짐':'원본 소리 편집');
  selectMix(s,s.mixTrack||'video');
}
if(quickEdit){
  for(const label of document.querySelectorAll('.mix-label'))label.firstElementChild.replaceWith(mixIcon(label.dataset.track));
  const heading=document.querySelector('.track-heading');
  const settings=mixButton('☷',()=>showTools('editSettings'));settings.id='mixSettings';settings.setAttribute('aria-label','세부 편집 열기');
  const undo=byId('trackUndo');undo.textContent='↶';undo.setAttribute('aria-label','컷 편집 되돌리기');
  undo.addEventListener('click',()=>applyTrackTool('trackUndo'));
  const redo=mixButton('↷',()=>applyTrackTool('trackRedo'));redo.id='trackRedo';redo.disabled=true;redo.setAttribute('aria-label','컷 편집 다시 실행');
  heading.prepend(undo,redo,settings);heading.append(play);
  const fx=byId('fxPanel');byId('mixOptions').after(fx);fx.hidden=true;
  byId('mixPublish').hidden=false;byId('mixPublish').addEventListener('click',()=>showTools('quickPublish'));
  const close=mixButton('닫기',()=>{document.body.classList.remove('show-tools');delete document.body.dataset.tools;});close.id='mixHideTools';
  document.querySelector('.sheet').prepend(close);byId('trackTools').before(byId('mixActions'));byId('editSettings').append(byId('trackTools'));
  const replace=document.createElement('input');replace.id='mixReplace';replace.type='file';replace.accept='video/*';replace.hidden=true;document.body.append(replace);
  replace.addEventListener('change',async()=>{
    const s=session,file=replace.files[0];replace.value='';if(!file||!editableEffects())return;
    const url=URL.createObjectURL(file),probe=document.createElement('video');probe.muted=true;
    video.pause();stopJoinedPreview(s);s.adding=true;
    try{
      await awaitMedia(probe,'loadedmetadata',()=>{probe.src=url;},s.controller.signal);
      if(!Number.isFinite(probe.duration)||probe.duration<=0)throw Error();
      (s.replacementUrls||=[]).push(url);
      const owner={...currentTake(s).take.owner,start:0,end:probe.duration,lines:[],montage:null,waveform:null};
      changeTake(s,t=>({url,start:0,end:Math.min(t.end-t.start,probe.duration),owner}));
      queueSourceWave(s,owner,file,probe.duration);
    }catch{URL.revokeObjectURL(url);if(session===s){byId('mixError').textContent='다른 영상을 선택해 주세요.';detail(s,'교체할 영상을 열 수 없어요.');showTools('status');}}
    finally{probe.removeAttribute('src');probe.load();s.adding=false;if(s===session)seekCutTrack(s,s.trackTime||0);}
  });
  mixLibrary=fetch('/assets/audio-library.json').then(r=>r.json());
  mixLibrary.catch(()=>{});
  document.querySelectorAll('[data-track]').forEach(button=>button.addEventListener('click',()=>{
    if(!editableEffects())return;
    const s=session,type=button.dataset.track;selectMix(s,type);
    if(type==='effect'&&!s.effects?.length)effectDialog();
  }));
  byId('sourceLane').addEventListener('click',()=>{if(editableEffects())selectMix(session,'source');});
  byId('musicLane').addEventListener('click',()=>{if(editableEffects()){selectMix(session,'music');pickMusic(session);}});
  const addTrk=byId('addTrackBtn');
  if(addTrk)addTrk.addEventListener('click',()=>{if(editableEffects())openAddTrackDialog(session);});
  // 오디오 트랙(효과음·원본 소리·음악) 라벨마다 원탭 음소거 버튼 부착
  for(const key of ['sfx','source','music']){
    const lbl=document.querySelector(`[data-track="${key}"]`);
    if(!lbl || lbl.querySelector('.track-mute-btn'))continue;
    const mb=document.createElement('span');
    mb.setAttribute('role','button');mb.tabIndex=0;mb.className='track-mute-btn';mb.innerHTML=MUTE_SVG_ON;
    mb.setAttribute('aria-pressed','false');
    mb.setAttribute('aria-label',`${mixNames[key]} 음소거`);
    mb.title=`${mixNames[key]} 음소거`;
    mb.addEventListener('click',e=>{
      e.stopPropagation();
      e.preventDefault();
      if(editableEffects())toggleTrackMute(session,key);
    });
    lbl.append(mb);
  }
  byId('mixClose').addEventListener('click',()=>byId('mixDialog').close());
  byId('mixDone').addEventListener('click',async()=>{
    if(!editableEffects())return;
    byId('mixDone').disabled=true;
    try{await mixDialogSave?.();byId('mixDialog').close();}
    catch{byId('mixError').textContent='입력한 시간과 미디어를 확인해 주세요.';}
    finally{byId('mixDone').disabled=false;}
  });
  play.addEventListener('click',()=>{
    if(session?.sounds?.length){
      mixAudio||=new AudioContext();mixAudio.resume().catch(()=>{});
    }
  },true);
  video.addEventListener('playing',()=>{if(session?.sounds?.length)previewSounds(session,outputTimeAt(session,video.currentTime));});
  video.addEventListener('pause',()=>stopMixSounds(session));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMixSounds(session);});
  byId('trackClips').addEventListener('click',()=>{if(session?.clip)selectMix(session,'video');});
  byId('fxLanes').addEventListener('pointerdown',()=>{if(session?.clip)selectMix(session,'effect');},true);
  byId('fxLanes').addEventListener('pointerup',()=>queueMicrotask(()=>{if(session?.clip)renderMixActions(session);}));
  byId('editor').addEventListener('input',()=>{if(session?.clip)renderMix(session);});
  byId('back').addEventListener('click',()=>document.body.classList.remove('show-tools'));
}
