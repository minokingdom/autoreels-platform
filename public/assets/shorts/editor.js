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
function drawTitles(ctx,clip,caption) {
  if (!clip) return;
  caption = caption || '';
  const w = ctx.canvas.width, h = ctx.canvas.height;
  function block(text,isTitle) {
    if (!text.trim()) return;
    ctx.save();
    let size = w * (isTitle ? .060 : .052);
    const limit = w * .86, lines = [];
    do {
      lines.length = 0; let row = '';
      ctx.font = '700 ' + size + 'px Pretendard, sans-serif';
      for (const word of text.trim().split(/\s+/)) {
        const next = row ? row + ' ' + word : word;
        if (row && ctx.measureText(next).width > limit) {lines.push(row);row=word;}
        else row=next;
      }
      if(row) lines.push(row);
      if (lines.length <= (isTitle ? 3 : 4) || size <= w*.030) break;
      size *= .9;
    } while (true);
    const step = size*1.32;
    const top = isTitle ? h*.085 : h*.82-lines.length*step;
    ctx.textAlign='center';ctx.textBaseline='middle';
    lines.forEach((line,i) => {
      const y=top+i*step, width=Math.min(limit,ctx.measureText(line).width)+w*.045;
      if (clip.style === 'outline') {
        ctx.lineJoin='round'; ctx.lineWidth=size*.12; ctx.strokeStyle='#161616';
        ctx.strokeText(line,w/2,y+step*.52,limit);
      } else { ctx.fillStyle='rgba(12,14,18,.68)'; ctx.fillRect((w-width)/2,y,width,step); }
      ctx.fillStyle='#fff';ctx.fillText(line,w/2,y+step*.52,limit);
    });
    ctx.restore();
  }
  const title = (clip.title || '').trim();
  if (clip.customTitle || !clip.showCaptions || title !== caption.trim()) block(title,true);
  if (clip.showCaptions) block(caption || '',false);
}
function renderPreview(at=video.currentTime) {
  const overlay=byId('overlay'),ctx=overlay.getContext('2d');
  ctx.clearRect(0,0,overlay.width,overlay.height);
  if (session?.clip?.montage && video.readyState >= 2) paintClip(ctx,video,activeCaption(session.clip,at));
  else drawTitles(ctx,session?.clip,activeCaption(session?.clip,at));
}
video.addEventListener('seeked',() => renderPreview());
async function confirmExport(s,clip,blob) {
  clip.exportId ||= crypto.randomUUID();
  await arConfirmShortsExport(blob,clip.exportId,() => session === s);
}
