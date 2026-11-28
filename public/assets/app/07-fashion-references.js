// 3:4 표지를 세로로 재구성한다. 사진 띠와 본문은 하나의 페이지로 함께 넘어간다.
function arMagazineSpread(c,W,H,S,cut,r) {
  const scene=arReferenceFanScene(S,cut);
  c.fillStyle=r.background;c.fillRect(0,0,W,H);
  const gutter=W*.025, rail=W*.18, top=H*.055, height=H*.80;
  mPhoto(c,scene,0,rail+2*gutter,top,W-rail-3*gutter,height,1.02);
  for(let i=0;i<3;i++){
    const h=(height-2*gutter)/3;
    mPhoto(c,arReferenceFanScene(S,Math.max(0,cut-2+i)),0,gutter,top+i*(h+gutter),rail,h,1.07+i*.08);
  }
}

function arMagazinePrint(c,W,H,S) {
  c.save();c.scale(W,H);
  const fabric=c.createLinearGradient(.1,.35,.88,.5);
  fabric.addColorStop(0,'#b7b6b1');fabric.addColorStop(.22,'#e1e0dc');
  fabric.addColorStop(.53,'#f7f7f2');fabric.addColorStop(.86,'#d9d8d3');fabric.addColorStop(1,'#aaa9a6');
  c.fillStyle=fabric;c.beginPath();c.moveTo(.37,.20);
  c.quadraticCurveTo(.50,.28,.63,.20);c.lineTo(.78,.25);c.lineTo(.97,.49);
  c.lineTo(.83,.55);c.lineTo(.75,.46);c.lineTo(.77,.79);
  c.quadraticCurveTo(.5,.82,.23,.79);c.lineTo(.25,.46);c.lineTo(.17,.55);
  c.lineTo(.03,.49);c.lineTo(.22,.25);c.closePath();c.fill();
  c.strokeStyle='#a8a8a2';c.lineWidth=.004;c.beginPath();c.moveTo(.37,.21);
  c.quadraticCurveTo(.5,.31,.63,.21);c.stroke();c.restore();
  mPhoto(c,S,0,W*.34,H*.34,W*.32,H*.25,1.02);
}

function arMagazineTurn(c,W,H,S,idx,p,count,r) {
  const t=(idx+p)/count;
  if(t>=.39 && t<.54){arMagazinePrint(c,W,H,S);return;}
  arMagazineSpread(c,W,H,S,idx,r);
  // 한 컷만 넣어도 같은 사진의 표지가 한 번 넘어간다.
  const progress=count===1?(p-.12)/.23:p/.40;
  if(progress<=0 || progress>=1 || (idx===0 && count>1))return;
  const q=arReferenceFanEase(progress);
  const x=W*(1.22-1.46*q), skew=W*.22;
  c.save();c.beginPath();c.moveTo(0,0);c.lineTo(x+skew,0);
  c.quadraticCurveTo(x+skew*.7,H*.56,x-skew,H);c.lineTo(0,H);c.closePath();c.clip();
  const previousCut=Math.max(0,idx-1);
  arMagazineSpread(c,W,H,S,previousCut,r);
  const fold=c.createLinearGradient(x-skew,0,x+skew,0);
  fold.addColorStop(0,'rgba(20,16,24,0)');fold.addColorStop(.34,'rgba(26,20,32,.42)');
  fold.addColorStop(.66,'#d7d1ca');fold.addColorStop(.87,'#f7f4ee');fold.addColorStop(1,'#aba5a2');
  c.fillStyle=fold;c.beginPath();c.moveTo(x+skew*.78,0);
  c.quadraticCurveTo(x-skew*.65,H*.7,x-skew*1.9,H);c.lineTo(x+skew,H);
  c.lineTo(x+skew,0);c.closePath();c.fill();c.restore();
}

function arMonoTeaser(c,W,H,S,t) {
  const cut=Math.floor(t*35), picks=[[1.24,-.08,.04],[1.76,.10,-.10],[1.32,.02,.08],[1.92,-.12,.07],[1.48,.07,-.06]];
  const [scale,dx,dy]=picks[cut%picks.length];
  mPhoto(c,S,0,0,0,W,H,scale,dx*W,dy*H);
  c.save();c.globalCompositeOperation='saturation';c.fillStyle='#888';c.fillRect(0,0,W,H);c.restore();
  const fade=arReferenceFanEase((t-.42)/.32);
  c.fillStyle='rgba(0,0,0,'+(.10+.90*fade)+')';c.fillRect(0,0,W,H);
  if(t>.93){
    const glow=c.createRadialGradient(0,H*.92,0,0,H*.92,W*.82);
    glow.addColorStop(0,'rgba(198,63,24,'+(.27*Math.sin(Math.PI*(t-.93)/.07))+')');
    glow.addColorStop(1,'rgba(130,36,16,0)');c.fillStyle=glow;c.fillRect(0,0,W,H);
  }
}

function arLookbookCard(c,W,H,S,cut,x,y,w,h,angle,scale) {
  if(scale<=0)return;
  c.save();c.translate(W*x,H*y);c.rotate(angle);c.scale(scale,scale);
  const cw=W*w,ch=H*h,pad=cw*.045;
  c.fillStyle='#f6f2e9';c.fillRect(-cw/2,-ch/2,cw,ch);
  mPhoto(c,arReferenceFanScene(S,cut),0,-cw/2+pad,-ch/2+pad,cw-2*pad,ch-pad*2-cw*.13,1.03);
  c.restore();
}

function arRunwayLookbook(c,W,H,S,cut,p,t) {
  if(t>=.37){
    mPhoto(c,S,0,0,0,W,H,1.03+.04*p);
    const shade=c.createLinearGradient(0,0,0,H);
    shade.addColorStop(0,'rgba(0,0,0,.42)');shade.addColorStop(.24,'rgba(0,0,0,0)');
    shade.addColorStop(.68,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.46)');
    c.fillStyle=shade;c.fillRect(0,0,W,H);return;
  }
  const open=t/.37;
  const cards=[[0,.53,.50,.58,.45,0],[1,.76,.20,.34,.25,.09],[2,.17,.20,.34,.25,-.22],
    [3,.20,.80,.38,.28,.19],[4,.82,.84,.35,.26,-.13]];
  for(const [i,x,y,w,h,angle] of cards){
    const enter=arReferenceFanEase((open-.13*i)/.19);
    arLookbookCard(c,W,H,S,Math.min((S.cuts||1)-1,cut+i),x,y,w,h,angle,enter);
  }
}

function arFashionReferenceFrame(c,W,H,S,r,idx,p,count,caption,entry,d) {
  const t=(idx+p)/count;
  let y=.72;
  if(r.layout==='magazine-turn'){
    arMagazineTurn(c,W,H,S,idx,p,count,r);y=.83;
  }else if(r.layout==='mono-teaser'){
    arMonoTeaser(c,W,H,S,t);y=.73-.33*arReferenceFanEase((t-.38)/.12);
  }else{
    arRunwayLookbook(c,W,H,S,idx,p,t);
    if(t>=.37){
      const masthead=gCleanCaption(campaign.hook||'');
      if(masthead && masthead!==caption)arReferenceCaption(c,masthead,W,H,H*.04,H*.13,{...r,foreground:r.accent},1);
    }
  }
  c.save();c.shadowColor='rgba(0,0,0,.8)';c.shadowBlur=W*.009;
  arReferenceCaption(c,caption,W,H,H*y,H*.15,r,entry);c.restore();
  inSign(c,d,W/2,H*.95,r.foreground,'center',W*.028);
}
