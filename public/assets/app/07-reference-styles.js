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
  const x=inset,y=r.layout==='full'?0:H*.08,pw=W-2*inset,ph=r.layout==='full'?H:H*.75;
  if(r.layout==='polaroid') { c.fillStyle='#fffdf7';c.fillRect(x-W*.025,y-W*.025,pw+W*.05,ph+W*.09); }
  c.save();c.beginPath();c.rect(x,y,pw,ph);c.clip();
  let zoom=1.02+(r.camera==='zoom-out'?(1-p)*r.zoom:r.camera==='zoom-in'?p*r.zoom:0);
  const shift=r.camera==='pan-left'?-1:r.camera==='pan-right'?1:0;
  if(shift) { zoom+=r.zoom;c.translate(shift*(p-.5)*W*r.zoom*.5,0); }
  if(r.transition==='fade') inPhotoFade(c,S,idx,local,x,y,pw,ph,zoom,1);
  else mPhoto(c,S,0,x,y,pw,ph,zoom);
  c.restore();
  c.fillStyle=`rgba(0,0,0,${r.shade})`;c.fillRect(x,y,pw,ph);
  if(r.grain) inGrain(c,W,H,t,r.grain);
  const cy={top:H*.15,middle:H*.4,bottom:H*.65}[r.captionPosition],ch=H*.19;
  c.save();
  if(r.textMotion==='mask') {c.beginPath();c.rect(W*.06,cy,W*.88,ch*entry);c.clip();}
  if(r.textMotion==='focus') {
    // 기존 키네틱 도우미는 하단 배치 고정이므로 번역해 분석 위치를 지킵니다.
    c.translate(0,cy-H*.62);
    mPromptType(c,W,H,caption,idx,local,dur,'focus',{font:r.font,accent:r.accent});
  } else {
    const a=r.textMotion==='fade'?entry:1;c.globalAlpha=a;
    mCaption(c,caption,W/2,cy,W*.86,ch,W*r.captionSize,r.font,r.foreground,r.textMotion==='rise'?entry:1);
  }
  c.restore();
  inSign(c,d,W/2,H*.94,r.foreground,'center',W*.03);
  c.restore();
}
