// URL 분석 스타일. 검증된 선언형 데이터만 빌드에 포함하며 원본 영상/문구는 포함하지 않습니다.
for (const ref of AR_REFERENCE_STYLES) {
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
  if(['diagonal','type-cutout','stacked','type-echo','type-flow'].includes(r.layout)) {
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
// 모든 사진 효과는 현재 컷의 같은 사진만 사용합니다. 별도 영상/이미지 생성은 없습니다.
let arReferenceMaskCanvas;
function arReferenceComposition(c,W,H,S,caption,r,idx,p,entry) {
  const zoom=1.02+(r.camera==='zoom-out'?(1-p)*r.zoom:p*r.zoom);
  if(r.layout==='diagonal') {
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
// 공통 mCaption은 자체 alpha/이동을 설정하므로 분석 스타일의 페이드와 상승을 여기서 구분합니다.
function arReferenceCaption(c,text,W,H,y,h,r,entry) {
  const F=KIT_FONTS[r.font]||KIT_FONTS.sans,size=W*r.captionSize;
  const maxLines=Math.max(1,Math.min(3,Math.floor(h/(size*F.k*1.28))));
  const fit=mFit(c,text,W*.80,maxLines,size,Math.round(size*.55),r.font);
  const top=y+Math.max(0,(h-fit.lines.length*fit.lh)/2);
  c.save();c.textAlign='center';c.textBaseline='middle';c.font=gFont(F.w,fit.size,F.f);c.fillStyle=r.foreground;
  if(r.textMotion==='fade')c.globalAlpha*=entry;
  const dy=r.textMotion==='rise'?(1-entry)*H*.025:0;
  fit.lines.forEach((line,i)=>c.fillText(line,W/2,top+(i+.5)*fit.lh+dy));
  c.restore();
}
