// Original vector overlays. The clock comes from the edit timeline, including during export.
window.arMotionLibrary=(()=>{
  const names={inkCircle:'손그림 포인트',paperConfetti:'종이꽃 팡',comicImpact:'만화 집중선'};
  const animations=new Map();
  const fixed=k=>({a:0,k});
  const prop=frames=>({a:1,k:frames.map(([t,s],i)=>i===frames.length-1?{t,s}:{t,s,e:frames[i+1][1],i:{x:[.68],y:[1]},o:{x:[.24],y:[0]}})});
  const fill=c=>({ty:'fl',c:fixed(c),o:fixed(100),r:1});
  function shape(points,closed=false){
    const ends=points.map(()=>[0,0]);
    return {ty:'sh',ks:fixed({i:ends,o:ends,v:points,c:closed})};
  }
  function layer(i,shapes,p,r=fixed(0),s=fixed([100,100,100]),o=fixed(100)){
    return {ty:4,ind:i,ip:0,op:60,st:0,sr:1,ks:{a:fixed([0,0,0]),p,r,s,o},shapes};
  }
  function design(kind){
    const layers=[],center=fixed([180,300,0]);
    const gold=[1,.81,.29],pink=[1,.42,.48],mint=[.36,.9,.78],white=[1,.98,.91];
    if(kind==='paperConfetti'){
      for(let i=0;i<30;i++){
        const a=(i*137.5)*Math.PI/180, d=65+(i*39)%131;
        const x=Math.cos(a)*d,y=Math.sin(a)*d;
        const pos=prop([[0,[180,316,0]],[16,[180+x,278+y,0]],[59,[180+x*1.22,360+y*1.35,0]]]);
        layers.push(layer(i+1,[{ty:'rc',p:fixed([0,0]),s:fixed([3+i%6,8+i%8]),r:fixed(1)},fill([gold,pink,mint,white][i%4])],pos,
          prop([[0,[i*27]],[59,[i*27+(i%2?235:-180)]]]),prop([[0,[10,10,100]],[9,[105,105,100]],[59,[75,80,100]]]),prop([[0,[0]],[4,[100]],[40,[100]],[59,[0]]])));
      }
    } else if(kind==='comicImpact'){
      for(let i=0;i<22;i++){
        const rad=110+((i*13)%68),angle=i*360/22;
        layers.push(layer(i+1,[shape([[-2,-rad-75],[3,-rad-92],[0,-rad]],true),fill(i%3?white:gold)],center,fixed(angle),
          prop([[0,[145,145,100]],[11,[90,90,100]],[45,[97,97,100]],[59,[115,115,100]]]),prop([[0,[0]],[5,[100]],[38,[100]],[59,[0]]])));
      }
    } else {
      const ring=Array.from({length:49},(_,i)=>{const a=(i/48*356-126)*Math.PI/180;return [Math.cos(a)*(77+Math.sin(a*3)*3),Math.sin(a)*39];});
      const stroke=(c,w)=>({ty:'st',c:fixed(c),o:fixed(100),w:fixed(w),lc:2,lj:2});
      for(let j=0;j<2;j++){
        layers.push(layer(j+1,[shape(ring),stroke(j?gold:[.23,.14,.12],j?4:7),
          {ty:'tm',s:fixed(0),e:prop([[0,[0]],[22,[100]],[59,[100]]]),o:fixed(0),m:1}],
          fixed([180,308+j*2,0]),fixed(-9),fixed([100,100,100]),prop([[0,[100]],[46,[100]],[59,[0]]])));
      }
    }
    return {v:'5.12.2',fr:30,ip:0,op:60,w:360,h:640,assets:[],layers};
  }
  function paint(ctx,kind,phase,opacity=1,width=ctx.canvas.width,height=ctx.canvas.height){
    if(!Object.hasOwn(names,kind)||!window.lottie||phase<0||phase>=1)return;
    if(!animations.has(kind)){
      const canvas=document.createElement('canvas');canvas.width=360;canvas.height=640;
      const animation=lottie.loadAnimation({renderer:'canvas',loop:false,autoplay:false,animationData:design(kind),
        rendererSettings:{context:canvas.getContext('2d'),clearCanvas:true,preserveAspectRatio:'xMidYMid meet'}});
      animations.set(kind,{canvas,animation});
    }
    const {canvas,animation}=animations.get(kind);
    animation.goToAndStop(Math.min(59,phase*60),true);
    ctx.save();ctx.globalAlpha*=opacity;ctx.drawImage(canvas,0,0,width,height);ctx.restore();
  }
  return {names,paint};
})();
