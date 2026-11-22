function scheduleRank(s) {
  clearTimeout(s.rankTimer);
  const version = ++s.rankVersion;
  if (!s.clips.length) return;
  byId('rankStatus').textContent = '발언 내용을 비교하는 중이에요. 먼저 나온 구간은 바로 재생할 수 있어요.';
  s.rankTimer = setTimeout(() => {
    if (s !== session) return;
    if (!s.rankWorker) {
      s.rankWorker = new Worker('rank.js',{type:'module'});
      s.rankWorker.onmessage = ({data}) => {
        if (session !== s || data.version !== s.rankVersion) return;
        if (s.exporting) s.deferredRank = data; else applyRank(s,data);
      };
      s.rankWorker.onerror = () => {
        if (session === s) applyRank(s,{version:s.rankVersion,error:true});
        s.rankWorker?.terminate(); s.rankWorker = null;
      };
    }
    s.rankWorker.postMessage({version,guide:s.guide,clips:s.clips.map(c => ({id:c.id,lines:c.guideText}))});
  },350);
}
function applyRank(s,data) {
  if (data.version !== s.rankVersion) return;
  if (data.error) {
    byId('rankStatus').textContent = '내용 분석 모델을 불러오지 못했어요. 대사 구간을 시간순으로 표시합니다.';
    for (const clip of s.clips) {clip.meta.textContent=clip.timeLabel;byId('clips').append(clip.button);}
    return;
  }
  const ordered = data.results.slice().sort((a,b) => b.score-a.score || a.id-b.id);
  for (const result of ordered) {
    const clip = s.clips[result.id], quote = clip.lines[result.index].text;
    clip.label.textContent = quote;
    clip.meta.textContent = result.reason + ' · ' + clip.timeLabel;
    if (!clip.customTitle) {
      const nextTitle = quote.length <= 52 ? quote : '';
      if (clip.title !== nextTitle) { clip.exportId = null; if (s.clip === clip) download.hidden = true; }
      clip.title = nextTitle;
      if (s.clip === clip) byId('clipTitle').value = clip.title;
    }
    byId('clips').append(clip.button);
  }
  if (!s.interacted && ordered.length) {
    const best = s.clips[ordered[0].id];
    if (s.clip !== best) selected(s,best,best.button);
  }
  byId('rankStatus').textContent = s.guide ? '“' + s.guide + '”와 의미가 가까운 발언부터 보여줘요.' : '방법·경험·이유·반전과 관련된 실제 발언부터 보여줘요.';
  renderPreview();
}
byId('guideForm').addEventListener('submit', e => {
  e.preventDefault(); if (!session || session.exporting) return;
  session.guide = byId('guide').value.trim(); scheduleRank(session);
});
function mountEditor(clip) {
  byId('editor').hidden = false;
  byId('fields').disabled = false;
  byId('clipTitle').value = clip.title;
  byId('showCaptions').checked = clip.showCaptions;
  const elements = clip.lines.map(line => {
    const label = document.createElement('label'), field = document.createElement('textarea');
    label.className = 'edit-line'; label.textContent = quickEdit ? '영상 자막' : clock(line.start) + ' – ' + clock(line.end);
    field.rows = 2; field.maxLength = Math.max(240,line.text.length); field.className = 'edit-input'; field.value = line.text;
    field.addEventListener('input',() => {
      line.text = field.value; video.pause();
      video.currentTime = quickEdit ? clip.start : line.start; markEdited(); renderPreview(video.currentTime);
    });
    label.append(field); return label;
  });
  byId('lineFields').replaceChildren(...elements);
}
function markEdited() {
  if(session?.trackAnalysisEdits)session.previewTouched=true;
  if (quickEdit) {
    clearEditorPost(session);
    if(session.timelineCuts && !session.previewController) {
      const pos=trackPosition(sequenceTakes(session),session.trackTime||0);
      if(pos)showJoinedCover(session,{...pos.take,start:pos.sourceTime});
    }
  }
  session.interacted = true; download.hidden = true; session.clip.exportId = null;
  if (session.saved) { URL.revokeObjectURL(session.saved); session.saved = null; download.removeAttribute('href'); }
}
byId('clipTitle').addEventListener('input',e => {
  const c = session.clip; c.title = e.target.value; c.customTitle = true; markEdited(); renderPreview();
});
byId('showCaptions').addEventListener('change',e => {
  session.clip.showCaptions = e.target.checked; markEdited(); renderPreview();
});
byId('editor').addEventListener('toggle',() => { if (session && byId('editor').open) session.interacted = true; });
const SHORTS_CAPTION_FONTS = {
  pretendard: '"Pretendard Variable", Pretendard, sans-serif',
  dohyeon: '"Do Hyeon", "Pretendard Variable", sans-serif',
  blackhan: '"Black Han Sans", sans-serif',
  jua: '"Jua", "Pretendard Variable", sans-serif',
  gugi: '"Gugi", "Pretendard Variable", sans-serif',
  bagel: '"Bagel Fat One", "Jua", sans-serif',
  gasoek: '"Gasoek One", "Black Han Sans", sans-serif',
  gowun: '"Gowun Batang", serif',
  songmyung: '"Song Myung", serif',
  hahmlet: '"Hahmlet", serif',
  pen: '"Nanum Pen Script", cursive',
  brush: '"Nanum Brush Script", cursive',
  gaegu: '"Gaegu", cursive',
  himelody: '"Hi Melody", cursive',
  gamja: '"Gamja Flower", cursive',
  poorstory: '"Poor Story", cursive',
  yeonsung: '"Yeon Sung", cursive',
  dokdo: '"East Sea Dokdo", cursive'
};
const SHORTS_FONT_SCALE = { pen: 1.28, brush: 1.30, dokdo: 1.36, himelody: 1.20, gaegu: 1.12, gamja: 1.10, poorstory: 1.08 };
const SHORTS_NORMAL_WEIGHT = new Set(['dohyeon','blackhan','jua','gugi','bagel','gasoek','songmyung','pen','brush','himelody','gamja','poorstory','yeonsung','dokdo']);
function drawTitles(ctx,clip,caption,cueOrStyle) {
  if (!clip) return;
  caption = caption || '';
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const cueObj = (cueOrStyle && typeof cueOrStyle === 'object') ? cueOrStyle : { style: cueOrStyle };
  function block(text,isTitle) {
    if (!text.trim()) return;
    ctx.save();
    const style = isTitle ? 'box' : (cueObj.style && cueObj.style !== 'inherit' ? cueObj.style : (clip.captionStyle || clip.style || 'box'));
    const fontKey = isTitle ? 'pretendard' : (cueObj.font || clip.captionFont || 'pretendard');
    const fontFam = SHORTS_CAPTION_FONTS[fontKey] || SHORTS_CAPTION_FONTS.pretendard;
    const sizeMul = isTitle ? 1 : Math.max(0.5, Math.min(2.0, Number(cueObj.size || clip.captionSize) || 1));
    const textCol = isTitle ? '#ffffff' : (cueObj.color || clip.captionColor || '#ffffff');
    const posX = isTitle ? 0.5 : Math.max(0.12, Math.min(0.88, Number(typeof cueObj.posX === 'number' ? cueObj.posX : clip.captionPosX) || 0.5));
    const posY = isTitle ? 0.085 : Math.max(0.10, Math.min(0.92, Number(typeof cueObj.posY === 'number' ? cueObj.posY : clip.captionPosY) || 0.82));
    const cinema = !isTitle && style === 'cinema';
    let size = w * (cinema ? .072 : isTitle ? .060 : .054) * sizeMul * (SHORTS_FONT_SCALE[fontKey] || 1);
    const limit = w * .90, lines = [];
    const maxLineCount = isTitle ? 3 : (sizeMul > 1.25 ? 6 : 4);
    const weight = SHORTS_NORMAL_WEIGHT.has(fontKey) ? '400 ' : (cinema ? 'italic 600 ' : '800 ');
    do {
      lines.length = 0; let row = '';
      ctx.font = weight + size + 'px ' + fontFam;
      for (const word of text.trim().split(/\s+/)) {
        const next = row ? row + ' ' + word : word;
        if (row && ctx.measureText(next).width > limit) {lines.push(row);row=word;}
        else row=next;
      }
      if(row) lines.push(row);
      if (lines.length <= maxLineCount || size <= w*.024) break;
      size *= .92;
    } while (true);
    const step = size*1.30;
    const totalH = lines.length * step;
    const top = isTitle ? h*.085 : Math.max(h*0.06, Math.min(h - totalH - h*0.04, h * posY - totalH * 0.5));
    let maxW = 0;
    lines.forEach(ln => { maxW = Math.max(maxW, Math.min(limit, ctx.measureText(ln).width) + w * .052); });
    const cx = isTitle ? w / 2 : Math.max(maxW / 2 + w * .03, Math.min(w - maxW / 2 - w * .03, w * posX));
    ctx.textAlign='center';ctx.textBaseline='middle';
    lines.forEach((line,i) => {
      const y=top+i*step, width=Math.min(limit,ctx.measureText(line).width)+w*.052;
      if(cinema){
        ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=size*.19;ctx.shadowOffsetY=size*.05;
        if(i===lines.length-1){
          const underline=Math.min(limit,width-w*.052);ctx.fillStyle=textCol;
          ctx.fillRect(cx - underline/2,y+step*.96,underline,Math.max(2,size*.055));
        }
        ctx.fillStyle=textCol;ctx.fillText(line,cx,y+step*.52,limit);
      } else if (style === 'outline') {
        ctx.lineJoin='round'; ctx.lineWidth=size*.14; ctx.strokeStyle='#111111';
        ctx.strokeText(line,cx,y+step*.52,limit);
        ctx.fillStyle=textCol;ctx.fillText(line,cx,y+step*.52,limit);
      } else if (style === 'shadow') {
        ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=size*.28;ctx.shadowOffsetY=size*.06;
        ctx.fillStyle=textCol;ctx.fillText(line,cx,y+step*.52,limit);
      } else if (style === 'yellowBox' || style === 'pinkBox') {
        ctx.fillStyle = style === 'yellowBox' ? '#facc15' : '#e11d48';
        const rx = cx - width/2, ry = y + step*.06, rh = step*.88;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(rx, ry, width, rh, 10) : ctx.rect(rx, ry, width, rh); ctx.fill();
        ctx.fillStyle = style === 'yellowBox' ? '#111111' : '#ffffff';
        ctx.fillText(line,cx,y+step*.52,limit);
      } else {
        ctx.fillStyle='rgba(12,14,18,.72)';
        const rx = cx - width/2, ry = y + step*.04, rh = step*.92;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(rx, ry, width, rh, 10) : ctx.rect(rx, ry, width, rh); ctx.fill();
        ctx.fillStyle=textCol;ctx.fillText(line,cx,y+step*.52,limit);
      }
    });
    ctx.restore();
  }
  const title = (clip.title || '').trim();
  if (clip.customTitle || !clip.showCaptions || title !== caption.trim()) block(title,true);
  if (clip.showCaptions) block(caption || '',false);
}
// 미리보기 화면에서 스티커·자막 모두 상하좌우(2D) 자유롭게 드래그해 위치 조절 (중앙 스냅 지원)
(function bindShortsCaptionDrag(){
  const ov=document.getElementById('overlay');
  if(!ov || ov.dataset.capDragBound)return;
  ov.dataset.capDragBound='1';
  let drag=null;
  ov.addEventListener('pointerdown',e=>{
    const s=typeof session!=='undefined'?session:null;
    if(!s?.clip || s.exporting)return;
    const rect=ov.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const nx=(e.clientX-rect.left)/rect.width;
    const ny=(e.clientY-rect.top)/rect.height;
    const curT=s.trackTime||0;
    // 1) 현재 시간에 표시 중인 스티커 히트 테스트 우선
    const stickers=Array.isArray(s.stickers)?s.stickers:[];
    for(let i=stickers.length-1;i>=0;i--){
      const st=stickers[i];
      if(curT<(st.start||0) || curT>=(st.start||0)+(st.duration||3))continue;
      const sx=typeof st.x==='number'?st.x:0.5, sy=typeof st.y==='number'?st.y:0.22;
      if(Math.abs(nx-sx)<=0.24 && Math.abs(ny-sy)<=0.11){
        drag={type:'sticker',st,startX:e.clientX,startY:e.clientY,origX:sx,origY:sy,w:rect.width,h:rect.height};
        try{ov.setPointerCapture(e.pointerId);}catch(_){}
        return;
      }
    }
    // 2) 자막 2D(상하좌우) 자유 드래그
    const cue=typeof activeCue==='function'?activeCue(s,curT):null;
    const curX=typeof cue?.posX==='number'?cue.posX:(s.clip.captionPosX||0.5);
    const curY=typeof cue?.posY==='number'?cue.posY:(s.clip.captionPosY||0.82);
    if(Math.abs(ny-curY)>0.20)return;
    drag={type:'caption',cue,startX:e.clientX,startY:e.clientY,origX:curX,origY:curY,w:rect.width,h:rect.height};
    try{ov.setPointerCapture(e.pointerId);}catch(_){}
  });
  ov.addEventListener('pointermove',e=>{
    if(!drag || !session?.clip)return;
    if(drag.type==='sticker'){
      drag.st.x=Math.max(0.08,Math.min(0.92,drag.origX+(e.clientX-drag.startX)/drag.w));
      drag.st.y=Math.max(0.08,Math.min(0.92,drag.origY+(e.clientY-drag.startY)/drag.h));
    }else{
      let nextX=Math.max(0.12,Math.min(0.88,drag.origX+(e.clientX-drag.startX)/drag.w));
      if(Math.abs(nextX-0.5)<0.025)nextX=0.5; // 중앙 자동 스냅
      const nextY=Math.max(0.10,Math.min(0.92,drag.origY+(e.clientY-drag.startY)/drag.h));
      if(drag.cue){drag.cue.posX=nextX;drag.cue.posY=nextY;}
      else{session.clip.captionPosX=nextX;session.clip.captionPosY=nextY;}
    }
    if(session.joined||session.timelineCuts){if(typeof seekCutTrack==='function')seekCutTrack(session,session.trackTime||0);}
    else renderPreview();
  });
  const end=()=>{if(drag){drag=null;if(typeof markEdited==='function')markEdited();}};
  ov.addEventListener('pointerup',end);ov.addEventListener('pointercancel',end);
})();
function renderPreview(at=video.currentTime) {
  if (session?.joined || session?.timelineCuts) return;
  const overlay=byId('overlay'),ctx=overlay.getContext('2d');
  const composite=session?.clip?.montage || session?.effects?.length || session?.captions?.length || session?.stickers?.length;
  if (composite && (video.seeking || video.readyState < 2)) return;
  ctx.clearRect(0,0,overlay.width,overlay.height);
  if (composite && video.readyState >= 2) paintClip(ctx,video,activeCaption(session.clip,at),session.clip,outputTimeAt(session,at));
  else drawTitles(ctx,session?.clip,activeCaption(session?.clip,at));
}
video.addEventListener('seeked',() => renderPreview());
async function confirmExport(s,clip,blob) {
  clip.exportId ||= crypto.randomUUID();
  await arConfirmShortsExport(blob,clip.exportId,() => session === s);
}
