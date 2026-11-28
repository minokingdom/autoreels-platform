// 배경 인화 사진은 고정하고 디스크 안의 현재 컷 사진만 회전시킨다.
function arPhotoDisc(c,W,H,S,idx,p,count) {
  const t=(idx+p)/count;
  const cards=[[-.04,.12,-.28],[.60,.10,.23],[.19,.41,.16],[.83,.47,-.23],
    [.17,.80,-.30],[.72,.87,.19],[.96,.10,-.28]];
  for(let i=0;i<cards.length;i++){
    const [x,y,angle]=cards[i];
    const shot=Math.floor(i*count/cards.length);
    arLookbookCard(c,W,H,S,shot,x,y,.76,.38,angle,1);
  }
  c.fillStyle='rgba(62,38,27,.24)';c.fillRect(0,0,W,H);
  const cx=W*.5,cy=H*.49,r=W*.455;
  c.save();c.translate(cx,cy);
  c.save();c.shadowBlur=W*.025;c.shadowOffsetY=H*.008;
  c.shadowColor='rgba(25,16,11,.6)';c.fillStyle='#302820';c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.restore();
  c.save();c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();
  c.rotate(2*Math.PI*2.35*t);
  mPhoto(c,arReferenceFanScene(S,idx),0,-r,-r,r*2,r*2,1.02);
  c.restore();
  const glaze=c.createLinearGradient(-r,-r,r,r);
  glaze.addColorStop(0,'rgba(255,246,222,.28)');glaze.addColorStop(.42,'rgba(255,246,222,0)');
  glaze.addColorStop(1,'rgba(42,20,7,.19)');
  c.fillStyle=glaze;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
  for(const q of [.928,.948,.97,.994]){
    c.strokeStyle=q>.98?'rgba(255,250,234,.82)':'rgba(248,231,200,.32)';
    c.lineWidth=W*.0018;c.beginPath();c.arc(0,0,r*q,0,Math.PI*2);c.stroke();
  }
  c.restore();
  c.fillStyle='rgba(11,8,7,'+arReferenceFanEase((t-.91)/.067)+')';c.fillRect(0,0,W,H);
}

function arBoothHousing(c,W,H) {
  const metal=c.createLinearGradient(0,0,W,H);
  metal.addColorStop(0,'#d2d1ce');metal.addColorStop(.36,'#a7a6a2');
  metal.addColorStop(.65,'#81817d');metal.addColorStop(1,'#a4a3a0');
  c.fillStyle=metal;c.fillRect(0,0,W,H);
  const rim=c.createLinearGradient(0,H*.275,0,H*.397);
  rim.addColorStop(0,'#f0efeb');rim.addColorStop(.18,'#b7b7b3');
  rim.addColorStop(.57,'#656460');rim.addColorStop(.84,'#d3d2ce');rim.addColorStop(1,'#f1f0ed');
  c.fillStyle=rim;gRoundRect(c,W*.045,H*.277,W*.91,H*.121,W*.045);c.fill();
  c.fillStyle='#333330';gRoundRect(c,W*.073,H*.299,W*.854,H*.077,W*.031);c.fill();
  c.fillStyle='#0e0f0f';gRoundRect(c,W*.082,H*.306,W*.836,H*.060,W*.023);c.fill();
}

function arBoothPrint(c,W,H,S,idx,p,count) {
  arBoothHousing(c,W,H);
  const base=Math.floor(idx/4)*4, group=Math.min(4,count-base);
  const progress=(idx-base+p)/group;
  const feed=arReferenceFanEase((progress-.035)/.77);
  const lip=H*.354, left=W*.144, paperW=W*.712, paperH=H*.54;
  const top=lip-paperH*(1-feed), margin=paperW*.049;
  const cellW=(paperW-3*margin)/2,cellH=(paperH-3*margin)/2;
  c.save();c.beginPath();c.rect(0,lip,W,H-lip);c.clip();
  c.shadowColor='rgba(18,18,16,.35)';c.shadowBlur=W*.012;c.shadowOffsetY=W*.008;
  c.fillStyle='#f4f2ec';c.fillRect(left,top,paperW,paperH);
  c.shadowBlur=0;c.shadowOffsetY=0;c.shadowColor='transparent';
  for(let i=0;i<4;i++){
    const scene=arReferenceFanScene(S,base+i%group);
    const x=left+margin+(i%2)*(cellW+margin);
    const y=top+margin+Math.floor(i/2)*(cellH+margin);
    mPhoto(c,scene,0,x,y,cellW,cellH,1.04+(group===1?.055*i:0));
  }
  const shadow=c.createLinearGradient(0,lip,0,lip+H*.023);
  shadow.addColorStop(0,'rgba(13,13,12,.55)');shadow.addColorStop(1,'rgba(13,13,12,0)');
  c.fillStyle=shadow;c.fillRect(left,lip,paperW,Math.min(H*.023,paperH*feed));
  c.restore();
}
