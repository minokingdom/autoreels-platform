// Reels cut inspector for editors that own their own media or slide timeline.
(() => {
  const fonts = [
      // ── 임팩트 · 포스터 · 바이럴 볼드 (상업용 무료 42종) ──
      { id: 'sans', label: '프리텐다드', css: "'Pretendard Variable', 'Pretendard', sans-serif", weight: 800 },
      { id: 'freesentation', label: '프리젠테이션', css: "'Freesentation', 'Paperlogy', sans-serif", weight: 900 },
      { id: 'paperlogy', label: '페이퍼로지', css: "'Paperlogy', 'Pretendard Variable', sans-serif", weight: 800 },
      { id: 'suite', label: '스위트 헤비', css: "'SUITE', 'Pretendard Variable', sans-serif", weight: 900 },
      { id: 'gmarket', label: '지마켓산스', css: "'GmarketSans', 'Pretendard Variable', sans-serif", weight: 700 },
      { id: 'aggro', label: '어그로 볼드', css: "'SBAggroB', 'Paperlogy', sans-serif", weight: 700 },
      { id: 'jalnan', label: '잘난체', css: "'yg-jalnan', 'SBAggroB', sans-serif", weight: 700 },
      { id: 'blackhansans', label: '검은고딕', css: "'Black Han Sans', 'Paperlogy', sans-serif", weight: 400 },
      { id: 'gasoekone', label: '가석원 울트라', css: "'Gasoek One', 'SBAggroB', sans-serif", weight: 400 },
      { id: 'gangwon', label: '강원파워', css: "'GangwonEduPower', 'Paperlogy', sans-serif", weight: 800 },
      { id: 'lineseed', label: '라인 시드', css: "'LINESeedKR', 'Pretendard Variable', sans-serif", weight: 700 },
      { id: 'ibmplex', label: 'IBM 플렉스', css: "'IBM Plex Sans KR', 'Pretendard Variable', sans-serif", weight: 700 },
      { id: 'tenada', label: '테나다 볼드', css: "'Tenada', 'Cafe24Ssurround', sans-serif", weight: 800 },
      { id: 'cafe24ohsquare', label: '카페24 아네모네', css: "'Cafe24Ohsquare', 'SBAggroB', sans-serif", weight: 700 },
      // ── 예능 · 팝 · 둥근체 ──
      { id: 'cafe24', label: '카페24 둥근', css: "'Cafe24Ssurround', 'Bagel Fat One', sans-serif", weight: 700 },
      { id: 'bagel', label: '베이글 팻', css: "'Bagel Fat One', 'Cafe24Ssurround', sans-serif", weight: 400 },
      { id: 'dohyeon', label: '배민 도현체', css: "'Do Hyeon', sans-serif", weight: 400 },
      { id: 'jua', label: '배민 주아체', css: "'Jua', sans-serif", weight: 400 },
      { id: 'dongle', label: '동글', css: "'Dongle', sans-serif", weight: 700, sz: 20 },
      { id: 'cute', label: '큐트폰트', css: "'Cute Font', cursive", weight: 400, sz: 20 },
      { id: 'stylish', label: '스타일리시', css: "'Stylish', sans-serif", weight: 400, sz: 16 },
      // ── 매거진 · 에디토리얼 명조 ──
      { id: 'hahmlet', label: '함렛 명조', css: "'Hahmlet', 'Noto Serif KR', serif", weight: 900 },
      { id: 'serif', label: '본명조 볼드', css: "'Noto Serif KR', serif", weight: 900 },
      { id: 'chosun', label: '조선일보명조', css: "'Chosunilbo_myungjo', 'MaruBuri', serif", weight: 400 },
      { id: 'songmyung', label: '송명 세리프', css: "'Song Myung', serif", weight: 400 },
      { id: 'maru', label: '마루부리', css: "'MaruBuri', 'Gowun Batang', serif", weight: 600 },
      { id: 'diphylleia', label: '디필레이아', css: "'Diphylleia', 'MaruBuri', serif", weight: 400 },
      { id: 'grandiflora', label: '그란디플로라', css: "'Grandiflora One', 'Gowun Batang', serif", weight: 400 },
      { id: 'batang', label: '고운바탕', css: "'Gowun Batang', serif", weight: 700 },
      { id: 'dodum', label: '고운돋움', css: "'Gowun Dodum', sans-serif", weight: 400 },
      { id: 'sunflower', label: '해바라기', css: "'Sunflower', sans-serif", weight: 700 },
      // ── 테크 · 레트로 · 스트릿 ──
      { id: 'orbit', label: '오르빗 테크', css: "'Orbit', 'Gowun Dodum', sans-serif", weight: 400 },
      { id: 'gugi', label: '구기체', css: "'Gugi', sans-serif", weight: 400 },
      { id: 'bwpicture', label: '흑백사진체', css: "'Black And White Picture', sans-serif", weight: 400, sz: 17 },
      { id: 'moirai', label: '모이라이', css: "'Moirai One', cursive", weight: 400, sz: 16 },
      { id: 'kirang', label: '기랑해랑', css: "'Kirang Haerang', cursive", weight: 400, sz: 17 },
      // ── 손글씨 · 붓글씨 · 캘리 ──
      { id: 'dokdo', label: '동해독도체', css: "'East Sea Dokdo', cursive", weight: 400, sz: 20 },
      { id: 'brush', label: '나눔붓글씨', css: "'Nanum Brush Script', cursive", weight: 400, sz: 19 },
      { id: 'pen', label: '나눔손글씨 펜', css: "'Nanum Pen Script', cursive", weight: 400, sz: 19 },
      { id: 'gaegu', label: '개구쟁이', css: "'Gaegu', cursive", weight: 700, sz: 17 },
      { id: 'singleday', label: '싱글데이', css: "'Single Day', cursive", weight: 400, sz: 17 },
      { id: 'yeonsung', label: '연성체', css: "'Yeon Sung', cursive", weight: 400, sz: 16 },
      { id: 'himelody', label: '하이멜로디', css: "'Hi Melody', cursive", weight: 400, sz: 18 },
      { id: 'gamja', label: '감자꽃', css: "'Gamja Flower', cursive", weight: 400, sz: 17 },
      { id: 'poorstory', label: '푸어스토리', css: "'Poor Story', cursive", weight: 400, sz: 16 },
      { id: 'script', label: '영문필기', css: "'Great Vibes', 'Pinyon Script', cursive", weight: 400, sz: 18 }
    ];
  const colors = ['#ffffff','#09090b','#facc15','#fb7185','#ef4444','#f97316','#38bdf8','#3b82f6','#34d399','#a3e635','#c084fc','#f472b6'];
  const tabs = {caption:'자막',chip:'아래 이름',photo:'사진',transition:'전환',deco:'꾸밈'};
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  const make = (tag,cls,text) => {
    const element = document.createElement(tag);
    if (cls) element.className = cls;
    if (text != null) element.textContent = text;
    return element;
  };
  let current;
  function open(adapter) {
    if (!adapter.count()) return;
    current?.close();
    const dialog = make('dialog','arcp');
    dialog.setAttribute('aria-label',adapter.unit==='장'?'카드 편집':'컷 편집');
    const panel = make('div','arcp-panel');
    const grip=make('div','arcp-grip');
    grip.setAttribute('aria-hidden','true');
    dialog.append(grip);
    dialog.append(panel);
    document.body.append(dialog);
    current=dialog;
    dialog.addEventListener('close',()=>{
      if(current===dialog) current=null;
      dialog.remove();
      adapter.close?.();
    },{once:true});
    let tab='caption', expanded=false, editing=false;
    function render() {
      const i=adapter.index(), n=adapter.count(), item=adapter.read(i), unit=adapter.unit||'컷';
      const selected=item[tab]||{};
      const scroll=panel.scrollTop, gridScroll=panel.querySelector('.arcp-grid')?.scrollTop||0;
      const horizontal=panel.querySelector('.arcp-strip')?.scrollLeft||0;
      panel.replaceChildren();
      function row(cls='') {
        const r=make('div','arcp-row '+cls);
        panel.append(r); return r;
      }
      function button(parent,label,fn,{active,disabled,cls='',title}={}) {
        const b=make('button',cls,label); b.type='button';
        if(active!=null)b.setAttribute('aria-pressed',String(active));
        if(disabled)b.disabled=true;
        if(title){b.title=title;b.setAttribute('aria-label',title);}
        b.addEventListener('click',fn); parent.append(b); return b;
      }
      function commit(patch) {
        adapter.write(i,patch);adapter.changed();render();
      }
      function style(patch){commit({[tab]:{...selected,...patch}});}
      function go(j){editing=false;adapter.select(j);render();}
      const nav=row('arcp-nav');
      button(nav,'‹',()=>go(i-1),{disabled:i===0,title:'이전 '+unit});
      nav.append(make('strong','',(i+1)+' / '+n+unit));
      button(nav,'›',()=>go(i+1),{disabled:i===n-1,title:'다음 '+unit});
      button(nav,'처음대로',()=>commit({caption:{text:item.caption?.text||''},chip:{text:item.chip?.text||''}}),{cls:'arcp-end',title:'이 '+unit+'의 자막과 아래 이름 스타일 초기화'});
      button(nav,'×',()=>dialog.close(),{title:'편집창 닫기'});
      const actions=row('arcp-actions');
      const moves=make('div','ar-cut-moves');actions.append(moves);
      [['left','◀','앞으로',i===0],['right','▶','뒤로',i===n-1],['copy','⧉','복사',n>=(adapter.maxCount||Infinity)],['delete','⌫','빼기',n<=(adapter.minCount||1)]].forEach(([key,glyph,label,disabled])=>{
        const move=key==='left'||key==='right';
        const b=button(move?moves:actions,'',()=>{adapter.order(key,i);adapter.changed();editing=false;render();},{disabled,title:label});
        if(move){b.className='ar-cut-move ar-cut-'+key;b.textContent=label;}
        else b.append(make('b','',glyph),make('small','',label));
      });
      const duration=row('arcp-duration');
      duration.append(make('span','arcp-grow','이 '+unit+' 길이'));
      const seconds=Number(item.duration);
      for(const step of [-.2,.2]){
        if(step>0)duration.append(make('strong','',Number(seconds.toFixed(1))+'초'));
        const next=Math.round((seconds+step)*10)/10;
        button(duration,step<0?'−':'+',()=>commit({duration:next}),{disabled:next<(item.minDuration??.2)||next>(item.maxDuration??Infinity),title:'길이 '+(step<0?'줄이기':'늘리기')});
      }
      const switcher=row('arcp-tabs');
      for(const [key,label] of Object.entries(tabs))button(switcher,label,()=>{tab=key;editing=false;render();},{active:tab===key});
      if(tab!=='caption'&&tab!=='chip'){
        const tools=row('arcp-tools');
        for(const tool of adapter.tools(tab,i))button(tools,tool.label,()=>{dialog.close();tool.run();},{disabled:tool.disabled,active:tool.active});
      }else{
        const controls=row('arcp-controls');
        button(controls,'Aa 문구 고치기',()=>{editing=!editing;render();if(editing)panel.querySelector('textarea')?.focus();},{cls:'arcp-primary'});
        button(controls,selected.hidden?'숨김':'보임',()=>style({hidden:!selected.hidden}),{title:tabs[tab]+' 보임 또는 숨김'});
        button(controls,'모든 '+unit+'에 똑같이',()=>{
          const {text,...attributes}=selected;
          for(let j=0;j<n;j++)if(j!==i){const old=adapter.read(j)[tab]||{};adapter.write(j,{[tab]:{text:old.text||'',...attributes}});}
          adapter.changed();render();
        },{title:'문구를 유지하고 모든 '+unit+'에 스타일 적용'});
        if(editing){
          const field=make('textarea');field.value=selected.text||'';field.setAttribute('aria-label',tabs[tab]+' 문구');panel.append(field);
          const submit=row();button(submit,'적용',()=>{editing=false;style({text:field.value});});
        }
        const head=row('arcp-font-head');
        head.append(make('span','arcp-grow','글꼴 미리보기 ('+fonts.length+'종)'),make('small','','상업용 무료'));
        button(head,'기본 ↺',()=>style({font:''}));
        button(head,expanded?'☰':'⊞',()=>{expanded=!expanded;render();},{title:expanded?'글꼴 캐러셀 보기':'모든 글꼴 보기'});
        const grid=make('div','arcp-grid'+(expanded?'':' arcp-strip'));panel.append(grid);
        for(const font of fonts){
          const b=button(grid,'',()=>style({font:font.id}),{active:selected.font===font.id,title:font.label});
          b.append(make('b','arcp-font-'+font.id,selected.text||tabs[tab]+' 미리보기'),make('small','',font.label));
        }
        grid.scrollTop=gridScroll;grid.scrollLeft=horizontal;
        const palette=row('arcp-scroll arcp-palette');
        const custom=make('input');custom.type='color';custom.value=selected.color||'#ffffff';custom.setAttribute('aria-label','직접 색상 선택');custom.addEventListener('change',()=>style({color:custom.value}));palette.append(custom);
        colors.forEach((color,k)=>button(palette,'',()=>style({color}),{cls:'arcp-color-'+k,active:selected.color===color,title:color}));
        function slider(parent,label,value,min,max,step,apply,fmt){
          const group=make('label','arcp-slider');
          const input=make('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=value;
          const output=make('strong','',fmt(value));group.append(make('span','',label),input,output);
          input.addEventListener('input',()=>{output.textContent=fmt(+input.value);});
          input.addEventListener('change',()=>apply(+input.value));parent.append(group);
        }
        slider(panel,'가',selected.scale||1,.5,2,.05,v=>style({scale:v}),v=>Math.round(v*100)+'%');
        const types=row('arcp-scroll');
        [['left','⇤'],['center','↔'],['right','⇥']].forEach(([key,label])=>button(types,label,()=>style({align:key}),{active:(selected.align||'center')===key,title:{left:'왼쪽 정렬',center:'가운데 정렬',right:'오른쪽 정렬'}[key]}));
        [['plain','스타일 기본'],['glass','시네마틱 글래스'],['card','화이트 카드']].forEach(([key,label])=>button(types,label,()=>style({box:key}),{active:(selected.box||'plain')===key}));
        if(adapter.motion!==false){
          const motion=row('arcp-scroll');motion.append(make('span','','움직임'));
          [['none','없음(고정)'],['pop','스프링 팝'],['fade','페이드인']].forEach(([key,label])=>button(motion,label,()=>style({motion:key}),{active:(selected.motion||'none')===key}));
        }
        const details=make('details');details.append(make('summary','','위치 숫자로 맞추기 · 초기화'));panel.append(details);
        for(const [key,label,def] of [['x','가로',.5],['y','세로',adapter.defaultY?.[tab]??(tab==='caption'?.73:.87)]])slider(details,label,selected[key]??def,.05,.95,.01,v=>style({[key]:v}),v=>Math.round(v*100)+'%');
        button(details,'위치 초기화',()=>style({x:undefined,y:undefined}));
      }
      panel.scrollTop=scroll;
    }
    render();dialog.show();
    dialog.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();dialog.close();}
    });
  }
  function paint(ctx,style,defaultY,elapsed=1) {
    if(!style||style.hidden||!style.text)return;
    const {width:w,height:h}=ctx.canvas;
    const font=fonts.find(f=>f.id===style.font)||fonts[0];
    const size=w*.065*clamp(style.scale||1,.5,2), maxWidth=w*.87;
    const phase=clamp(elapsed/.32,0,1), step=size*1.2;
    ctx.save();ctx.font=font.weight+' '+size+'px '+font.css;
    ctx.textAlign=style.align||'center';ctx.textBaseline='middle';
    const anchor=style.x??(ctx.textAlign==='left'?.07:ctx.textAlign==='right'?.93:.5);
    ctx.translate(w*anchor,h*(style.y??defaultY));
    if(style.motion==='fade')ctx.globalAlpha*=phase;
    if(style.motion==='pop'){const zoom=1-.16*(1-phase)*Math.cos(phase*5);ctx.scale(zoom,zoom);}
    const lines=[];
    for(const paragraph of String(style.text).split('\n')){
      let line='';
      for(const char of paragraph){
        if(line&&ctx.measureText(line+char).width>maxWidth){lines.push(line.trimEnd());line='';}
        line+=char;
      }
      lines.push(line.trimEnd());
    }
    lines.forEach((line,i)=>{
      const y=(i-(lines.length-1)/2)*step, width=ctx.measureText(line).width;
      const left=ctx.textAlign==='left'?0:ctx.textAlign==='right'?-width:-width/2;
      if(style.box==='glass'||style.box==='card'){
        ctx.fillStyle=style.box==='card'?'#fffffff2':'#101116b8';
        ctx.fillRect(left-size*.17,y-step/2,width+size*.34,step);
      }
      ctx.fillStyle=style.color||(style.box==='card'?'#171719':'#ffffff');
      ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=style.box==='card'?0:size*.075;
      ctx.fillText(line,0,y,maxWidth);ctx.shadowBlur=0;
    });
    ctx.restore();
  }
  window.arCutPanel={open,paint,fonts};
})();
