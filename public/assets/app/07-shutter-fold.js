// 여섯 띠가 앞 컷과 현재 컷 사이를 교대한다. 경계는 양쪽 띠가 같은 좌표를 쓴다.
function arTravelShutter(c,W,H,S,idx,p,count) {
  const scene=arReferenceFanScene(S,idx);
  const journey=(idx+p)/count;
  const closing=arReferenceFanEase((journey-.875)/.085);
  c.save();
  c.beginPath(); c.rect(W*.5*closing,0,W*(1-closing),H); c.clip();
  if(idx>0)mPhoto(c,arReferenceFanScene(S,idx-1),0,0,0,W,H,1.035);
  const orders=[[0,1,2,3,4,5],[4,2,0,1,3,5],[5,4,3,2,1,0]];
  const order=orders[idx%orders.length];
  const panelDuration=idx===0&&count===1?.045:.13;
  const step=idx===0&&count===1?.019:.071;
  for(let col=0;col<6;col++){
    const x=Math.round(col*W/6), right=Math.round((col+1)*W/6);
    const q=arReferenceFanEase((p-order[col]*step)/panelDuration);
    if(q<=0)continue;
    const opening=(right-x)*q;
    c.save(); c.beginPath();
    c.rect(idx%3===2?right-opening:x,0,opening,H); c.clip();
    mPhoto(c,scene,0,0,0,W,H,1.035+.035*p);
    if(q<1 && idx%3===1){
      c.fillStyle='rgba(255,255,255,'+(.73*Math.sin(Math.PI*q))+')'; c.fillRect(x,0,right-x,H);
    }
    c.restore();
  }
  c.fillStyle='rgba(14,18,21,.36)';
  for(let col=1;col<6;col++)c.fillRect(Math.round(col*W/6),0,Math.max(.55,W*.0011),H);
  c.restore();
}


// The six panel boundaries are shared by the accordion and the two-row exit.
const AR_POSTCARD_EDGES=[0,.142,.322,.500,.680,.860,1];
const AR_POSTCARD_INSETS=[.034,.094,.127,.135,.125,.094,.034];
let arFoldPhotoSurface;
function arFoldPanels(c,W,H,S,t) {
  if(!arFoldPhotoSurface)arFoldPhotoSurface=document.createElement('canvas');
  const surface=arFoldPhotoSurface;
  if(surface.width!==W||surface.height!==H){surface.width=W;surface.height=H;}
  const sc=surface.getContext('2d');
  sc.clearRect(0,0,W,H);mPhoto(sc,S,0,0,0,W,H,1.015);
  const seconds=t*4.367,starts=[.07,.64,1.22,1.80,2.37,2.95];
  for(let i=0;i<6;i++){
    const q=arReferenceFanEase((seconds-starts[i])/.20);
    if(q<=0)continue;
    const left=W*AR_POSTCARD_EDGES[i],full=W*AR_POSTCARD_EDGES[i+1]-left,right=left+full*q;
    const a=H*AR_POSTCARD_INSETS[i],b=H*AR_POSTCARD_INSETS[i+1];
    const tip=b+(1-q)*H*.045;
    c.save();c.beginPath();c.moveTo(left,a);c.lineTo(right,tip);
    c.lineTo(right,H-tip);c.lineTo(left,H-a);c.closePath();c.clip();
    const top=Math.min(a,tip);
    c.drawImage(surface,left,0,full,H,left,top,full*q,H-2*top);
    const shadow=(1-q)*.45;
    if(shadow>0){c.fillStyle='rgba(20,14,18,'+shadow+')';c.fillRect(left,0,full*q,H);}
    if(i>0){c.fillStyle='rgba(12,9,13,.76)';c.fillRect(left,0,Math.max(.65,W*.0016),H);}
    c.restore();
  }
}

function arPostcardTriangle(c,ax,ay,bx,by,cx,cy){
  c.moveTo(ax,ay);c.lineTo(bx,by);c.lineTo(cx,cy);c.closePath();
}

function arPostcardX(c,W,H,S,seconds){
  const entry=arReferenceFanEase((seconds-4.367)/.14);
  const vertical=1-arReferenceFanEase((seconds-4.91)/.12);
  const side=1-arReferenceFanEase((seconds-5.14)/.12);
  const inset=(.16+.052*entry)*W,tip=(.22+.093*entry)*H;
  const sideTip=W*(.30+.074*entry);
  c.save();c.beginPath();c.rect(0,0,W,H);
  if(vertical>0){
    arPostcardTriangle(c,W/2-inset*vertical,0,W/2+inset*vertical,0,W/2,tip*vertical);
    arPostcardTriangle(c,W/2-inset*vertical,H,W/2+inset*vertical,H,W/2,H-tip*vertical);
  }
  if(side>0){
    arPostcardTriangle(c,0,H/2-H*.5*side,0,H/2+H*.5*side,sideTip*side,H/2);
    arPostcardTriangle(c,W,H/2-H*.5*side,W,H/2+H*.5*side,W-sideTip*side,H/2);
  }
  c.clip('evenodd');mPhoto(c,S,0,0,0,W,H,1.015);c.restore();
  // Each flap leaves a narrow fold line briefly after the photograph is revealed.
  c.save();c.strokeStyle='rgba(15,12,14,.8)';c.lineWidth=Math.max(.7,W*.002);
  c.beginPath();
  if(vertical<1){c.moveTo(W/2-inset,0);c.lineTo(W/2,tip);c.lineTo(W/2+inset,0);
    c.moveTo(W/2-inset,H);c.lineTo(W/2,H-tip);c.lineTo(W/2+inset,H);}
  if(side<1){c.moveTo(0,0);c.lineTo(sideTip,H/2);c.lineTo(0,H);
    c.moveTo(W,0);c.lineTo(W-sideTip,H/2);c.lineTo(W,H);}
  c.stroke();c.restore();
}

function arPostcardTiles(c,W,H,S,seconds){
  const lower=[5.46,5.47,5.60,5.70,5.84,5.97];
  const upper=[7.03,6.85,6.75,6.57,6.43,6.18];
  for(let row=0;row<2;row++){
    const mid=Math.round(H/2),y=row?mid:0,h=row?H-mid:mid;
    for(let i=0;i<6;i++){
      const q=arReferenceFanEase((seconds-(row?lower:upper)[i])/.09);
      if(q<=0)continue;
      const l=Math.round(AR_POSTCARD_EDGES[i]*W),r=Math.round(AR_POSTCARD_EDGES[i+1]*W);
      c.save();c.beginPath();c.rect(row?l:r-(r-l)*q,y,(r-l)*q,h);c.clip();
      mPhoto(c,S,0,0,0,W,H,1.015);
      c.fillStyle='rgba(10,8,12,.6)';
      if(i>0)c.fillRect(l,y,Math.max(.65,W*.0015),h);
      if(row)c.fillRect(l,mid,r-l,Math.max(.65,W*.0015));
      c.restore();
    }
  }
}

function arFoldPostcard(c,W,H,S,idx,p,count){
  const foldCuts=Math.max(1,Math.min(count-1,Math.round(count*.582)));
  const seconds=count===1?7.502*p:idx<foldCuts?4.367*(idx+p)/foldCuts:
    4.367+(7.502-4.367)*(idx-foldCuts+p)/(count-foldCuts);
  if(seconds<4.367)arFoldPanels(c,W,H,S,seconds/4.367);
  else if(seconds<5.467)arPostcardX(c,W,H,S,seconds);
  else arPostcardTiles(c,W,H,S,seconds);
}
