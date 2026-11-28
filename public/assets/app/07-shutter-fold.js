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

// 상단과 하단의 꼭짓점을 공유하는 접이식 패널. 사진 자체도 접힘 폭을 따라 투영한다.
let arFoldPhotoSurface;
function arFoldPanels(c,W,H,S,t) {
  if(!arFoldPhotoSurface)arFoldPhotoSurface=document.createElement('canvas');
  const surface=arFoldPhotoSurface;
  const width=Math.max(1,Math.round(W)),height=Math.max(1,Math.round(H));
  if(surface.width!==width||surface.height!==height){surface.width=width;surface.height=height;}
  const sc=surface.getContext('2d');
  sc.clearRect(0,0,width,height);mPhoto(sc,S,0,0,0,width,height,1.045);
  const count=6;
  for(let i=0;i<count;i++){
    const q=arReferenceFanEase((t-i*.078)/.25);
    if(!q)continue;
    const left=i*W/count,full=(i+1)*W/count-left;
    const right=left+full*q;
    const bend=x=>Math.sin(Math.PI*x/W)*H*.057;
    const yl=bend(left),yr=bend(right)+(1-q)*H*.078;
    c.save();
    // 0폭 프레임을 건너뛰어 접히는 축의 나눗셈을 피한다.
    if(right-left>.05){
      c.transform(1,(yr-yl)/(right-left),0,1,left,yl);
      c.drawImage(surface,i*width/count,0,width/count,height,0,0,right-left,H*.90);
      if(i>0){c.fillStyle='rgba(15,16,22,.42)';c.fillRect(0,0,Math.min(full*.02,1),H*.90);}
      const sheen=1-Math.min(1,Math.abs(t-(.63+i*.054))/.045);
      if(sheen>0){c.fillStyle='rgba(255,255,255,'+(.80*sheen)+')';c.fillRect(0,0,right-left,H*.90);}
    }
    c.restore();
  }
}

function arFoldCrossOrTiles(c,W,H,S,phase,progress) {
  const q=arReferenceFanEase(progress);
  c.save(); c.beginPath();
  if(phase==='cross'){
    // 같은 원점에서 그린 두 대각 띠의 합집합으로 X를 연다.
    const angle=Math.atan2(H,W), diagonal=Math.hypot(W,H);
    const thickness=2*W*H/diagonal*(.26+.76*q);
    for(const sign of [-1,1]){
      c.save();c.translate(W/2,H/2);c.rotate(sign*angle);
      c.rect(-diagonal/2-1,-thickness/2,diagonal+2,thickness);c.restore();
    }
  }else{
    for(let row=0;row<2;row++){
      for(let col=0;col<4;col++){
        const rank=row===1?col:7-col;
        const reveal=arReferenceFanEase((progress-rank*.083)/.24);
        const left=Math.round(col*W/4),right=Math.round((col+1)*W/4);
        const mid=Math.round(H/2);
        const w=(right-left)*reveal;
        c.rect(row===1?left:right-w,row===1?mid:0,w,row===1?H-mid:mid);
      }
    }
  }
  c.clip(); mPhoto(c,S,0,0,0,W,H,1.025+.025*q);
  if(phase==='tiles'){
    c.fillStyle='rgba(16,19,23,'+(.30*(1-arReferenceFanEase((progress-.86)/.14)))+')';
    for(let i=1;i<4;i++)c.fillRect(Math.round(W*i/4),0,W*.0015,H);
    c.fillRect(0,Math.round(H/2),W,H*.0015);
  }
  c.restore();
}

function arFoldPostcard(c,W,H,S,idx,p,count) {
  const foldCuts=Math.max(1,Math.min(count-1,Math.round(count*.582)));
  const t=count===1?p:idx<foldCuts?.582*(idx+p)/foldCuts:.582+.418*(idx-foldCuts+p)/(count-foldCuts);
  if(t<.582){arFoldPanels(c,W,H,S,t/.582);return;}
  if(t<.729){arFoldCrossOrTiles(c,W,H,S,'cross',(t-.582)/.147);return;}
  arFoldCrossOrTiles(c,W,H,S,'tiles',(t-.729)/.271);
}
