// URL 분석 스타일. 검증된 선언형 데이터만 빌드에 포함하며 원본 영상/문구는 포함하지 않습니다.
for (const ref of AR_REFERENCE_STYLES) {
  DESIGN_STYLES.push({id:ref.id,name:ref.name,label:ref.name,cat:ref.category,engine:'motion',
    mstyle:'reference',font:ref.font,bg1:ref.background,bg2:ref.background,accent:ref.accent,
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
