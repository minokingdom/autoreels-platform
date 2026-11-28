// URL 분석 스타일. 검증된 선언형 데이터만 빌드에 포함하며 원본 영상/문구는 포함하지 않습니다.
for (const ref of AR_REFERENCE_STYLES) {
  // 디자인 품질 기준에서 제외된 레퍼런스 레이아웃(repeat-poster, type-rail, chevron-type, brush-frame)
  if (ref && (ref.layout === 'repeat-poster' || ref.layout === 'type-rail' || ref.layout === 'chevron-type' || ref.layout === 'brush-frame')) continue;
  DESIGN_STYLES.push({id:ref.id,name:ref.name,label:ref.name,cat:ref.category,engine:'motion',
    mstyle:'reference',addedAt:ref.addedAt,font:ref.font,bg1:ref.background,bg2:ref.background,accent:ref.accent,
    accent2:ref.foreground,light:false,insta:true,genre:'motion',grade:'none',seed:1500,
    desc:ref.summary,referenceStyle:ref});
}
function arRenderReferenceFrame(c,W,H,t,mainDuration,totalCuts,d,spec) {
  const r=spec.referenceStyle;
  // 호출부가 음성 경계에 맞춰 변환한 시간을 사용합니다. 원본 영상의 초수로 덮어쓰지 않습니다.
  const dur=mainDuration/Math.max(1,totalCuts), idx=Math.min(totalCuts-1,Math.floor(t/dur));
  const local=t-idx*dur, p=mClamp(local/dur), entry=mEase(local/Math.min(r.entrySeconds,dur*.3));
  const S=kitScene(t,mainDuration,false);
  const caption=gCleanCaption((campaign.cutCaptions||[])[idx]||campaign.hook||'');
  c.save();
  c.fillStyle=r.background;c.fillRect(0,0,W,H);
  if(r.layout==='travel-shutter' || r.layout==='fold-postcard') {
    const journey=(idx+p)/Math.max(1,totalCuts);
    const title=r.layout==='travel-shutter' && (journey<.155 || journey>.91);
    if(r.layout==='travel-shutter') arTravelShutter(c,W,H,S,idx,p,totalCuts);
    else arFoldPostcard(c,W,H,S,idx,p,totalCuts);
    arReferenceCaption(c,caption,W,H,title?H*.34:H*.73,title?H*.32:H*.16,r,entry);
    inSign(c,d,W/2,H*.94,r.foreground,'center',W*.03);
    c.restore();return;
  }
  if(r.layout==='beat-mask') {
    const titleVisible = arBeatMaskFrame(c,W,H,S,idx,totalCuts,p,caption,r.font);
    if (!titleVisible) arReferenceCaption(c,caption,W,H,H*.73,H*.15,r,entry);
    inSign(c,d,W/2,H*.94,r.foreground,'center',W*.03);
    c.restore();return;
  }
  if(r.layout==='custom') {
    const render=window[r.renderer];
    if(typeof render!=='function')throw Error('reference renderer missing');
    render(c,W,H,S,r,idx,p,local,dur);
    arReferenceCaption(c,caption,W,H,H*.73,H*.15,r,entry);
    inSign(c,d,W/2,H*.94,r.foreground,'center',W*.03);
    c.restore();return;
  }
  if(r.layout==='photo-montage') {
    arReferencePhotoMontage(c,W,H,S,r,idx,p,local,dur);
    arReferenceCaption(c,caption,W,H,H*.73,H*.15,r,entry);
    inSign(c,d,W/2,H*.94,r.foreground,'center',W*.03);
    c.restore();return;
  }
  if(r.layout==='diagonal-fan') {
    // 여러 컷 사진이 겹치는 마스크는 단일 사진 사선 띠와 별도 처리합니다.
    arReferenceDiagonalFan(c,W,H,S,r,idx,p,local,dur);
    const shade=c.createLinearGradient(0,H*.48,0,H);
    shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(1,`rgba(0,0,0,${r.shade})`);
    c.fillStyle=shade;c.fillRect(0,H*.48,W,H*.52);
    if(r.grain)inGrain(c,W,H,t,r.grain);
    arReferenceCaption(c,caption,W,H,H*.70,H*.16,{...r,textMotion:'fade'},entry);
    inSign(c,d,W/2,H*.94,r.foreground,'center',W*.03);
    c.restore();return;
  }
  if(['diagonal','diamond-reveal','type-cutout','stacked','type-echo','type-flow','editorial','news-marker','floating-type','type-rail','repeat-poster','chevron-type','brush-frame'].includes(r.layout)) {
    arReferenceComposition(c,W,H,S,caption,r,idx,p,entry);
    if(r.grain)inGrain(c,W,H,t,r.grain);
    inSign(c,d,W/2,H*.94,r.layout==='type-echo'&&idx%2?r.background:r.foreground,'center',W*.03);
    c.restore();return;
  }
  const inset=r.layout==='full'?0:W*.07;
  const paperCaption=r.layout==='polaroid'&&r.captionPosition==='bottom';
  const x=inset,y=r.layout==='full'?0:H*.08,pw=W-2*inset,ph=r.layout==='full'?H:paperCaption?H*.64:H*.75;
  if(r.layout==='polaroid') { c.fillStyle='#fffdf7';c.fillRect(x-W*.025,y-W*.025,pw+W*.05,paperCaption?H*.88-y+W*.025:ph+W*.09); }
  c.save();c.beginPath();c.rect(x,y,pw,ph);c.clip();
  let zoom=1.02+(r.camera==='zoom-out'?(1-p)*r.zoom:r.camera==='zoom-in'?p*r.zoom:0);
  const shift=r.camera==='pan-left'?-1:r.camera==='pan-right'?1:0;
  if(shift) { zoom+=r.zoom;c.translate(shift*(p-.5)*W*r.zoom*.5,0); }
  if(r.transition==='fade') inPhotoFade(c,S,idx,local,x,y,pw,ph,zoom,1);
  else mPhoto(c,S,0,x,y,pw,ph,zoom);
  c.restore();
  c.fillStyle=`rgba(0,0,0,${r.shade})`;c.fillRect(x,y,pw,ph);
  if(r.grain) inGrain(c,W,H,t,r.grain);
  const cy=paperCaption?H*.735:{top:H*.15,middle:H*.4,bottom:H*.65}[r.captionPosition],ch=paperCaption?H*.125:H*.19;
  c.save();
  if(r.textMotion==='mask') {c.beginPath();c.rect(W*.06,cy,W*.88,ch*entry);c.clip();}
  if(r.textMotion==='focus') {
    // 기존 키네틱 도우미는 하단 배치 고정이므로 번역해 분석 위치를 지킵니다.
    c.translate(0,cy-H*.62);
    mPromptType(c,W,H,caption,idx,local,dur,'focus',{font:r.font,accent:r.accent});
  } else {
    arReferenceCaption(c,caption,W,H,cy,ch,r,entry);
  }
  c.restore();
  inSign(c,d,W/2,H*.94,r.foreground,'center',W*.03);
  c.restore();
}
// 현재 컷 및 인접 컷에 지정한 사진만 사용합니다. 화면 녹화의 편집기 UI나 원본 소재는 복사하지 않습니다.
function arReferenceFanScene(S,cut) {
  const cuts=Math.max(1,S.cuts||1),target=Math.max(0,Math.min(cuts-1,cut));
  return {...S,cutIdx:target,idx:Math.min(Math.max(0,S.n-1),Math.floor(target*Math.max(1,S.n)/cuts))};
}
function makeCanvas(W,H) {const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.min(2048,Math.round(W)));canvas.height=Math.max(1,Math.min(2048,Math.round(H)));return canvas;}
// 사진 콜라주 → 사선 선명 마스크 → 겹침 → 초점 표시. 원본 인물/문구는 포함하지 않습니다.
// 모든 상태는 현재 시간에서 계산해 되감기·내보내기 결과가 같습니다.
function arReferenceMontageCard(c,W,H,S,cut,x,y,w,h,angle,alpha=1) {
  c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
  const border=W*.012;c.fillStyle='#ffffff';c.fillRect(-w/2-border,-h/2-border,w+2*border,h+2*border);
  mPhoto(c,arReferenceFanScene(S,cut),0,-w/2,-h/2,w,h,1.02);c.restore();
}
function arReferenceMontageCollage(c,W,H,S,cut,spread) {
  // 화면 바깥 카드까지 배치해 이동 중 검은 빈 곳과 흰 프레임이 원본처럼 드러납니다.
  const cards=[[-.30,-.55,-.34],[.65,-.72,.28],[-.78,.15,-.4],[.82,.38,.35],[-.50,.91,.30],[.55,1.16,-.32]];
  c.fillStyle='#08090b';c.fillRect(0,0,W,H);
  for(const [x,y,a] of cards)arReferenceMontageCard(c,W,H,S,cut,W/2+x*W*spread,H/2+y*H*spread,W*.55,H*.55,a*spread);
  const grow=1-spread;
  arReferenceMontageCard(c,W,H,S,cut,W/2,H/2,W*(.58+.42*grow),H*(.70+.30*grow),-.24*spread);
}
function arReferenceMontageFocus(c,W,H,p) {
  const pulse=Math.sin(Math.PI*mClamp(p/.82));
  const size=W*(.075+.14*pulse),x=W*.53,y=H*.58,k=size*.27;
  c.save();c.globalAlpha*=mClamp((1-p)*9);c.strokeStyle='#ffffff';c.lineWidth=Math.max(1,W*.005);
  for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
    const xx=x+sx*size/2,yy=y+sy*size/2;
    c.beginPath();c.moveTo(xx-sx*k,yy);c.lineTo(xx,yy);c.lineTo(xx,yy-sy*k);c.stroke();
  }
  c.lineWidth=Math.max(1,W*.003);c.beginPath();c.moveTo(x-W*.011,y);c.lineTo(x+W*.011,y);c.moveTo(x,y-W*.011);c.lineTo(x,y+W*.011);c.stroke();c.restore();
}
function arReferencePhotoMontage(c,W,H,S,r,idx,p,local,dur) {
  c.save();c.fillStyle=r.background;c.fillRect(0,0,W,H);
  const photo=(cut,alpha=1,zoom=1.02)=>{c.save();c.globalAlpha*=alpha;mPhoto(c,arReferenceFanScene(S,cut),0,0,0,W,H,zoom);c.restore();};
  const blend=arReferenceFanEase(local/Math.max(.001,Math.min(.5,dur*.25)));
  if(idx===0) {
    const spread=arReferenceFanEase((p-.43)/.35);
    if(spread===0)photo(0);else arReferenceMontageCollage(c,W,H,S,0,spread);
  } else if(idx===1) {
    const spread=1-arReferenceFanEase((p-.20)/.77);
    arReferenceMontageCollage(c,W,H,S,idx-1,Math.max(.01,spread));
    c.save();c.globalAlpha*=blend;arReferenceMontageCollage(c,W,H,S,idx,Math.max(.01,spread));c.restore();
  } else if(idx%6===3) {
    // 흐린 배경은 새 사진. 좁은 사선 띠가 회전·확대되며 같은 사진의 선명한 부분을 드러냅니다.
    c.save();c.filter=`blur(${W*.022*(1-arReferenceFanEase(p/.8))}px)`;photo(idx,1,1.12);c.restore();
    if(blend<1)photo(idx-1,1-blend);
    const q=arReferenceFanEase(p/.83),angle=-.85*Math.sin(Math.PI*q),width=W*(.025+1.55*q);
    c.save();c.translate(W/2,H/2);c.rotate(angle);c.beginPath();c.rect(-width/2,-H,width,H*2);c.clip();
    c.rotate(-angle);c.translate(-W/2,-H/2);photo(idx);c.restore();
    if(q<.999){c.save();c.translate(W/2,H/2);c.rotate(angle);c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=Math.max(1,W*.003);c.strokeRect(-width/2,-H,width,H*2);c.restore();}
  } else {
    photo(idx-1);photo(idx,blend,1.02+(idx%3===2?.035*p:0));
    if(idx%3===2&&idx>2)arReferenceMontageFocus(c,W,H,p);
  }
  if(r.shade){c.fillStyle=`rgba(0,0,0,${r.shade})`;c.fillRect(0,0,W,H);}
  c.restore();
}
function arReferenceFanEase(v) {v=mClamp(v);return v*v*(3-2*v);}
function arReferenceFanRay(slope) {
  // 모든 경계는 (0, 1)에 고정. 끝점만 위쪽 변 → 오른쪽 변으로 회전합니다.
  return slope>1?{x:1/slope,y:0}:{x:1,y:1-slope};
}
function arReferenceFanLayers(idx,p,dur,r) {
  const transition=Math.max(.001,Math.min(dur*.36,r.entrySeconds*.38));
  const q=arReferenceFanEase(p*dur/transition),layers=[];
  const settle=mClamp((p*dur-transition)/Math.max(.001,dur-transition));
  const currentSlope=.62-.22*settle;
  for(let cut=1;cut<=idx;cut++){
    const age=idx-cut;
    if(age===0){
      if(q<=0)continue;
      const angle=Math.PI/2+(Math.atan(currentSlope)-Math.PI/2)*q;
      layers.push({cut,end:arReferenceFanRay(Math.tan(angle))});
    } else {
      // 새 장면 진입 때 지난 장면의 쐐기를 아래로 압축합니다. 미래 컷은 읽지 않습니다.
      const before=.40*Math.pow(.48,age-1),after=currentSlope*Math.pow(.48,age);
      layers.push({cut,end:arReferenceFanRay(before+(after-before)*q)});
    }
  }
  return layers;
}
function arReferenceFanIntro(c,W,H,S,r,p,zoom) {
  c.fillStyle=r.background;c.fillRect(0,0,W,H);
  for(let col=0;col<4;col++){
    const arrive=arReferenceFanEase((p-col*.105+.025)/.075);
    if(arrive<=0)continue;
    const expand=arReferenceFanEase((p-(.49+col*.115))/.11);
    const h=H*(.44+.56*expand),y=(H-h)/2-(1-arrive)*H*.85;
    const x=W*col/4,gap=Math.max(.6,W*.002);
    c.save();c.beginPath();c.rect(x,y,W/4-gap,h);c.clip();
    // 한 사진을 네 번 반복하지 않고, 같은 전체 장면의 서로 다른 세로 부분을 보여줍니다.
    mPhoto(c,arReferenceFanScene(S,0),0,0,0,W,H,zoom);
    c.restore();
  }
}
function arReferenceDiagonalFan(c,W,H,S,r,idx,p,local,dur) {
  const zoomAt=v=>1.02+(r.camera==='still'?0:r.camera==='zoom-out'?(1-v)*r.zoom:v*r.zoom);
  arReferenceFanIntro(c,W,H,S,r,idx===0?p:1,zoomAt(idx===0?p:1));
  if(idx===0)return;
  for(const layer of arReferenceFanLayers(idx,p,dur,r)){
    const {x,y}=layer.end;
    c.save();c.beginPath();c.moveTo(0,H);c.lineTo(0,0);c.lineTo(x*W,0);
    if(y>0)c.lineTo(W,y*H);
    c.closePath();c.clip();
    mPhoto(c,arReferenceFanScene(S,layer.cut),0,0,0,W,H,zoomAt(layer.cut===idx?p:1));
    c.restore();
    c.save();c.strokeStyle=r.foreground;c.lineWidth=Math.max(.65,W*.0015);
    c.beginPath();c.moveTo(0,H);c.lineTo(x*W,y*H);c.stroke();c.restore();
  }
}
// 나머지 구성은 현재 컷의 같은 사진만 사용합니다. 별도 영상/이미지 생성은 없습니다.
let arReferenceMaskCanvas;
function arReferenceComposition(c,W,H,S,caption,r,idx,p,entry) {
  const zoom=1.02+(r.camera==='zoom-out'?(1-p)*r.zoom:p*r.zoom);
  if(r.layout==='brush-frame') {
    c.save();c.globalAlpha*=entry;c.translate(0,(1-entry)*H*.025);
    c.fillStyle=r.accent;c.fillRect(W*.28,H*.22,W*.58,H*.36);
    const x=W*.15,y=H*.26,pw=W*.64,ph=H*.37;
    c.save();c.beginPath();c.moveTo(x,y);
    c.lineTo(x+pw,y);c.lineTo(x+pw,y+ph*.81);
    for(let i=0;i<=64;i++)c.lineTo(x+pw*(1-i/64),y+ph*(.94+.012*Math.sin(i*3.7)+.009*Math.sin(i*1.3)));
    c.closePath();c.clip();mPhoto(c,S,0,x,y,pw,ph,zoom);c.restore();
    c.strokeStyle=r.accent;c.lineWidth=W*.012;c.lineCap='round';
    c.beginPath();c.moveTo(W*.12,H*.72);c.quadraticCurveTo(W*.35,H*.69,W*.70,H*.72);c.stroke();
    c.strokeStyle=r.foreground;c.lineWidth=W*.004;
    for(const [xx,yy,sx,sy] of [[x-W*.02,y-H*.012,1,1],[x+pw+W*.02,y+ph,-1,-1]]){
      c.beginPath();c.moveTo(xx,yy+sy*H*.025);c.lineTo(xx,yy);c.lineTo(xx+sx*W*.055,yy);c.stroke();
    }
    c.restore();
    const words=caption.trim().split(/\s+/);arReferenceCaption(c,words.slice(0,2).join(' '),W,H,H*.12,H*.09,{...r,captionSize:.075,textMotion:'fade'},entry);
    arReferenceCaption(c,caption,W,H,H*.73,H*.15,{...r,textMotion:'fade'},entry);
  } else if(r.layout==='type-rail') {
    const words=caption.split(/\s+/).filter(Boolean),key=words.slice(0,2).join(' '),F=KIT_FONTS[r.font];
    const fit=arReferenceFit(c,key,W*.85,H*.18,W*.19,r.font,2);
    c.save();c.fillStyle=r.foreground;c.textBaseline='middle';c.font=gFont(F.w,fit.size,F.f);
    for(let row=0;row<3;row++) {
      c.textAlign=row%2?'right':'left';
      fit.lines.forEach((line,i)=>c.fillText(line,W*(row%2?.92:.08)+(1-entry)*(row%2?1:-1)*W*.15,H*(.18+row*.24)+(i-(fit.lines.length-1)/2)*fit.lh));
    }
    c.restore();
    const x=W*(.19+.10*Math.sin(p*Math.PI)),y=H*.32;
    mPhoto(c,S,0,x,y,W*.62,H*.30,zoom);
    mPhoto(c,S,0,W*(.64-.08*p),H*.14,W*.25,H*.12,zoom+.10);
    // 큰 글자 일부가 사진에 가려져도 전체 문장은 별도로 끝까지 읽을 수 있습니다.
    arReferenceCaption(c,caption,W,H,H*.77,H*.12,{...r,textMotion:'fade'},entry);
  } else if(r.layout==='repeat-poster') {
    c.fillStyle=r.foreground;
    const key=caption.trim().split(/\s+/).slice(0,2).join(' '),F=KIT_FONTS[r.font];
    const fit=arReferenceFit(c,key,W*.86,H*.18,W*.23,r.font,1);
    c.save();c.globalAlpha*=entry;c.font=gFont(F.w,fit.size,F.f);c.textAlign='center';c.textBaseline='middle';
    for(let row=0;row<3;row++) c.fillText(fit.lines[0]||'',W/2,H*(.18+row*.24));
    c.fillStyle=r.foreground;c.fillRect(W*.20,H*.30,W*.60,H*.34);
    mPhoto(c,S,0,W*.215,H*.308,W*.57,H*.324,zoom);c.restore();
    arReferenceCaption(c,caption,W,H,H*.77,H*.12,{...r,textMotion:'fade'},entry);
  } else if(r.layout==='chevron-type') {
    const F=KIT_FONTS[r.font],fit=arReferenceFit(c,caption,W*.70,H*.40,W*.10,r.font,4);
    const rows=Math.max(3,fit.lines.length+1),photoRow=Math.floor(rows/2),step=H*.70/rows;
    for(let row=0;row<rows;row++) {
      const y=H*.14+row*step,h=step*.90,left=W*.05,right=W*.95,tip=W*.075,reverse=row%2;
      c.save();c.translate((1-entry)*(reverse?1:-1)*W*.25,0);c.globalAlpha*=entry;
      c.beginPath();
      if(reverse){c.moveTo(left+tip,y);c.lineTo(right,y);c.lineTo(right,y+h);c.lineTo(left+tip,y+h);c.lineTo(left,y+h/2);}
      else{c.moveTo(left,y);c.lineTo(right-tip,y);c.lineTo(right,y+h/2);c.lineTo(right-tip,y+h);c.lineTo(left,y+h);}
      c.closePath();c.clip();c.fillStyle=reverse?r.foreground:r.accent;c.fillRect(0,y,W,h);
      if(row===photoRow)mPhoto(c,S,0,left,y,right-left,h,zoom);
      else{const line=fit.lines[(row<photoRow?row:row-1)%fit.lines.length]||'';c.fillStyle=r.background;c.font=gFont(F.w,fit.size,F.f);c.textAlign='center';c.textBaseline='middle';c.fillText(line,W/2,y+h/2);}
      c.restore();
    }
  } else if(r.layout==='editorial') {
    mPhoto(c,S,0,0,0,W,H,zoom);
    const shade=c.createLinearGradient(0,0,W,H);shade.addColorStop(0,'rgba(0,0,0,.16)');shade.addColorStop(1,`rgba(0,0,0,${r.shade})`);
    c.fillStyle=shade;c.fillRect(0,0,W,H);
    const fit=mFit(c,caption,W*.76,4,W*.085,W*.045,r.font);
    c.save();c.globalAlpha*=entry;c.textAlign='left';c.textBaseline='middle';c.fillStyle=r.foreground;
    fit.lines.forEach((line,i)=>{const F=KIT_FONTS[i===0?'pen':r.font];c.font=gFont(F.w,fit.size,F.f);c.fillText(line,W*.10,H*.43+i*fit.lh+(1-entry)*H*.015);});c.restore();
  } else if(r.layout==='news-marker') {
    c.fillStyle=r.background;c.fillRect(0,0,W,H);
    // 허구의 기사 문장 대신 활자 단의 리듬을 추상적인 선으로 표현합니다.
    c.save();c.globalAlpha=.12;c.fillStyle=r.foreground;
    for(let col=0;col<2;col++)for(let line=0;line<23;line++) {
      const yy=H*.09+line*H*.033;
      c.fillRect(W*(.07+col*.46),yy,W*(line%5===4?.25:.38),W*.0025);
    }
    c.restore();
    const F=KIT_FONTS[r.font],fit=mFit(c,caption,W*.74,4,W*.085,W*.045,r.font);
    c.save();c.translate(W/2,H*.47);c.rotate(-.018);c.globalAlpha*=entry;c.textAlign='center';c.textBaseline='middle';c.font=gFont(F.w,fit.size,F.f);
    fit.lines.forEach((line,i)=>{const y=(i-(fit.lines.length-1)/2)*fit.lh,w=c.measureText(line).width;
      c.fillStyle=r.accent;c.fillRect(-w/2-W*.025,y-fit.lh*.43,(w+W*.05)*entry,fit.lh*.86);
      c.fillStyle=r.foreground;c.fillText(line,0,y);
    });c.restore();
  } else if(r.layout==='floating-type') {
    mPhoto(c,S,0,0,0,W,H,zoom);c.fillStyle=`rgba(0,0,0,${r.shade})`;c.fillRect(0,0,W,H);
    const words=caption.trim().split(/\s+/).filter(Boolean),parts=[words.slice(0,2).join(' '),words.slice(-2).join(' ')];
    c.save();c.fillStyle=r.foreground;c.textBaseline='middle';
    parts.forEach((text,i)=>{
      const F=KIT_FONTS[r.font],fit=mFit(c,text,W*.32,2,W*.044,W*.024,r.font);
      c.font=gFont(F.w,fit.size,F.f);c.textAlign=i?'right':'left';c.globalAlpha=entry*.4;
      fit.lines.forEach((line,j)=>c.fillText(line,W*(i?.92:.08),H*(i?.43:.2)+j*fit.lh+Math.sin(p*Math.PI)*H*(i?-.025:.025)));
    });c.restore();
    arReferenceCaption(c,caption,W,H,H*.67,H*.17,r,entry);
  } else if(r.layout==='diamond-reveal') {
    c.save();
    c.beginPath();
    const radius=W*(.16+entry*.56)+H*.5*entry;
    for(let i=0;i<3;i++) {
      const x=W*(i+.5)/3, y=H*.5;
      c.moveTo(x,y-radius);c.lineTo(x+radius,y);c.lineTo(x,y+radius);c.lineTo(x-radius,y);c.closePath();
    }
    c.clip();mPhoto(c,S,0,0,0,W,H,zoom);c.restore();
    c.fillStyle=`rgba(0,0,0,${r.shade})`;c.fillRect(0,0,W,H);
    arReferenceCaption(c,caption,W,H,H*.4,H*.19,r,entry);
  } else if(r.layout==='diagonal') {
    for(let i=0;i<3;i++) {
      const left=(i/3-.22)*W+(1-entry)*(i%2?1:-1)*W*.45;
      c.save();c.beginPath();c.moveTo(left,0);c.lineTo(left+W*.32,0);
      c.lineTo(left+W*.76,H);c.lineTo(left+W*.44,H);c.closePath();c.clip();
      mPhoto(c,S,0,0,0,W,H,zoom+i*.035);
      c.fillStyle=`rgba(0,0,0,${r.shade})`;c.fillRect(0,0,W,H);c.restore();
    }
    arReferenceCaption(c,caption,W,H,H*.4,H*.19,r,entry);
    c.fillStyle=r.accent;c.fillRect(W*.3,H*.61,W*.4*entry,Math.max(1,W*.003));
  } else if(r.layout==='type-cutout') {
    // 재사용하는 전용 캔버스에서 글자 알파를 사진 마스크로 사용합니다.
    if(!arReferenceMaskCanvas)arReferenceMaskCanvas=document.createElement('canvas');
    const mask=arReferenceMaskCanvas,scale=2;
    if(mask.width!==Math.round(W*scale)||mask.height!==Math.round(H*scale)) {
      mask.width=Math.round(W*scale);mask.height=Math.round(H*scale);
    }
    const mc=mask.getContext('2d');mc.setTransform(scale,0,0,scale,0,0);
    mc.clearRect(0,0,W,H);mc.save();
    const F=KIT_FONTS[r.font]||KIT_FONTS.sans;
    const fit=mFit(mc,caption,W*.84,4,W*.16,W*.065,r.font);
    mc.font=gFont(F.w,fit.size,F.f);mc.textAlign='center';mc.textBaseline='middle';mc.fillStyle=r.foreground;
    const top=H*.46-fit.lines.length*fit.lh/2;
    fit.lines.forEach((line,i)=>mc.fillText(line,W/2,top+(i+.5)*fit.lh));
    mc.globalCompositeOperation='source-in';mPhoto(mc,S,0,0,0,W,H,zoom);mc.restore();
    c.save();c.globalAlpha*=entry;c.drawImage(mask,0,0,W,H);c.restore();
    // 긴 문장과 밝은 사진에서도 원문 전체를 읽을 수 있는 보조 자막입니다.
    arReferenceCaption(c,caption,W,H,H*.72,H*.14,{...r,textMotion:'fade'},entry);
  } else if(r.layout==='stacked') {
    for(const angle of [-.09,.07]) {
      c.save();c.translate(W/2,H*.47);c.rotate(angle);
      c.fillStyle=angle<0?'#b9b0a1':'#ddd6c8';c.fillRect(-W*.4,-H*.335,W*.8,H*.67);c.restore();
    }
    c.save();c.translate(W/2,H*.47+(1-entry)*H*.06);
    c.rotate((idx%2?1:-1)*(.025+(1-entry)*.07));c.translate(-W/2,-H*.47);
    c.fillStyle='#fffdf7';c.fillRect(W*.1,H*.12,W*.8,H*.67);
    c.save();c.beginPath();c.rect(W*.14,H*.16,W*.72,H*.48);c.clip();
    mPhoto(c,S,0,W*.14,H*.16,W*.72,H*.48,zoom);c.restore();
    arReferenceCaption(c,caption,W,H,H*.66,H*.105,{...r,foreground:'#28211e',textMotion:'fade'},entry);
    c.restore();
  } else {
    const echo=r.layout==='type-echo',inverted=echo&&idx%2;
    c.fillStyle=inverted?r.foreground:idx%2?r.accent:r.background;c.fillRect(0,0,W,H);
    const ink=inverted?r.background:r.foreground,F=KIT_FONTS[r.font]||KIT_FONTS.sans;
    const fit=mFit(c,caption,W*.82,4,W*.105,W*.048,r.font);
    c.save();c.translate(W/2,H*.48);const s=1+(1-entry)*.16;c.scale(s,s);
    c.font=gFont(F.w,fit.size,F.f);c.textAlign='center';c.textBaseline='middle';c.fillStyle=ink;
    const top=-fit.lines.length*fit.lh/2;
    fit.lines.forEach((line,i)=>{
      const yy=top+(i+.5)*fit.lh;
      if(echo){c.globalAlpha=(1-entry)*.3;c.fillText(line,0,yy-H*.09);c.fillText(line,0,yy+H*.09);}
      c.globalAlpha=entry;c.fillText(line,echo?0:(1-entry)*(i%2?1:-1)*W*.12,yy);
    });c.restore();
  }
}
// 참조 스타일의 고정 상자 안에 원문 전체를 맞춥니다. 사용자가 넣은 줄바꿈은 유지합니다.
function arReferenceFit(c,text,maxW,maxH,size,fontKey,maxLines=4) {
  const F=KIT_FONTS[fontKey]||KIT_FONTS.sans,source=String(text||'').trim();
  const compact=s=>s.replace(/\s+/g,'');
  const initial=mFit(c,source,maxW,maxLines,size,size*.55,fontKey);
  if(compact(initial.lines.join(''))===compact(source)&&initial.lines.length*initial.lh<=maxH) return initial;
  const paragraphs=source.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const limit=Math.max(maxLines,paragraphs.length);
  let actual=size*F.k;
  for(let attempt=0;attempt<128;attempt++) {
    c.font=gFont(F.w,actual,F.f);
    const lines=[];
    for(const paragraph of paragraphs) {
      let line='';
      for(const word of paragraph.split(/\s+/).filter(Boolean)) {
        const joined=line?line+' '+word:word;
        if(line&&c.measureText(joined).width>maxW){lines.push(line);line=word;}else line=joined;
      }
      if(line)lines.push(line);
    }
    const width=Math.max(0,...lines.map(s=>c.measureText(s).width)),height=lines.length*actual*1.28;
    if(lines.length<=limit&&width<=maxW&&height<=maxH) return {lines,size:actual,lh:actual*1.28};
    actual*=Math.min(.93,width>0?maxW/width:1,height>0?maxH/height:1);
  }
  return {lines:[],size:actual,lh:actual*1.28};
}


// 공통 mCaption은 자체 alpha/이동을 설정하므로 분석 스타일의 페이드와 상승을 여기서 구분합니다.
function arReferenceCaption(c,text,W,H,y,h,r,entry) {
  const F=KIT_FONTS[r.font]||KIT_FONTS.sans,size=W*r.captionSize;
  const maxLines=Math.max(1,Math.min(3,Math.floor(h/(size*F.k*1.28))));
  const fit=arReferenceFit(c,text,W*.80,h,size,r.font,maxLines);
  const top=y+Math.max(0,(h-fit.lines.length*fit.lh)/2);
  c.save();c.textAlign='center';c.textBaseline='middle';c.font=gFont(F.w,fit.size,F.f);c.fillStyle=r.foreground;
  if(r.textMotion==='fade')c.globalAlpha*=entry;
  const dy=r.textMotion==='rise'?(1-entry)*H*.025:0;
  fit.lines.forEach((line,i)=>c.fillText(line,W/2,top+(i+.5)*fit.lh+dy));
  c.restore();
}
