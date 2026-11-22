// Instagram Story / Meta Edits style interactive stickers for Shorts Editor
(function () {
  const STICKER_PRESETS = [
    { id: 'location', icon: '📍', label: '위치 태그', defaultText: '성수동 핫플', x: 0.5, y: 0.17, editable: true },
    { id: 'hashtag', icon: '#', label: '해시태그', defaultText: '#오토릴스 #오늘추천', x: 0.5, y: 0.76, editable: true },
    { id: 'timestamp', icon: '🕒', label: '타임스탬프', defaultText: '', x: 0.28, y: 0.12, editable: false },
    { id: 'hot', icon: '🔥', label: 'HOT 추천', defaultText: 'HOT 추천', x: 0.76, y: 0.16, editable: true },
    { id: 'new', icon: '✨', label: 'NEW 신상', defaultText: 'NEW ARRIVAL', x: 0.25, y: 0.16, editable: true },
    { id: 'bubble', icon: '💬', label: '말풍선 메모', defaultText: '여기 진짜 추천해요!', x: 0.5, y: 0.28, editable: true },
    { id: 'rating', icon: '⭐', label: '별점 5.0', defaultText: '★★★★★ 5.0', x: 0.5, y: 0.22, editable: true },
    { id: 'price', icon: '🏷️', label: '특가 · 할인', defaultText: '오늘만 30% OFF', x: 0.74, y: 0.24, editable: true },
    { id: 'heart', icon: '❤️', label: '좋아요 팝', defaultText: 'LIKE', x: 0.80, y: 0.62, editable: false },
    { id: 'pointer', icon: '👇', label: '여기 주목', defaultText: '필수 체크', x: 0.5, y: 0.68, editable: true },
    { id: 'rec', icon: '🔴', label: 'REC 캠코더', defaultText: 'REC', x: 0.22, y: 0.10, editable: false },
    { id: 'music', icon: '🎵', label: 'NOW PLAYING', defaultText: 'BGM 재생 중', x: 0.5, y: 0.88, editable: true }
  ];
  window.arStickerPresets = STICKER_PRESETS;

  function roundRectPath(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function formatRecTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }

  function drawSingleSticker(ctx, st, time, w, h, clip) {
    const local = time - (st.start || 0);
    const dur = st.duration || 3;
    if (local < 0 || local >= dur) return;
    const enter = Math.min(1, local / 0.22);
    const exit = Math.min(1, (dur - local) / 0.18);
    const alpha = Math.min(enter, exit);
    const pop = enter >= 1 ? 1 : 1 - Math.exp(-7 * enter) * Math.cos(10 * enter);
    const sc = (st.scale || 1) * (0.86 + 0.14 * pop);
    const cx = (typeof st.x === 'number' ? st.x : 0.5) * w;
    const cy = (typeof st.y === 'number' ? st.y : 0.22) * h;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontBase = Math.round(w * 0.042);
    const txt = String(st.text || '').trim();

    if (st.kind === 'location') {
      const label = `📍 ${txt || '성수동 핫플'}`;
      ctx.font = `700 ${fontBase}px "Pretendard Variable", Pretendard, sans-serif`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 34, bh = fontBase * 1.95;
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#111827';
      ctx.fillText(label, 0, 1);
    } else if (st.kind === 'hashtag') {
      const label = txt || '#오토릴스 #오늘추천';
      ctx.font = `800 ${fontBase}px "Pretendard Variable", Pretendard, sans-serif`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 34, bh = fontBase * 1.95;
      const g = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
      g.addColorStop(0, '#ff4518'); g.addColorStop(1, '#e11d48');
      ctx.shadowColor = 'rgba(225,29,72,0.4)'; ctx.shadowBlur = 14;
      ctx.fillStyle = g;
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 12); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, 0, 1);
    } else if (st.kind === 'timestamp') {
      const now = new Date();
      const stamp = txt || `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      ctx.font = `700 ${Math.round(fontBase * 0.82)}px "JetBrains Mono", monospace`;
      const tw = ctx.measureText(stamp).width;
      const bw = tw + 26, bh = fontBase * 1.65;
      ctx.fillStyle = 'rgba(12,14,18,0.72)';
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(stamp, 0, 1);
    } else if (st.kind === 'hot' || st.kind === 'new' || st.kind === 'price') {
      const icon = st.kind === 'hot' ? '🔥 ' : st.kind === 'new' ? '✨ ' : '🏷️ ';
      const label = icon + (txt || (st.kind === 'hot' ? 'HOT 추천' : st.kind === 'new' ? 'NEW' : '특가 할인'));
      ctx.font = `800 ${Math.round(fontBase * 0.92)}px "Pretendard Variable", Pretendard, sans-serif`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 30, bh = fontBase * 1.85;
      ctx.fillStyle = st.kind === 'hot' ? '#f97316' : st.kind === 'new' ? '#2340e8' : '#facc15';
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12;
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = st.kind === 'price' ? '#111111' : '#ffffff';
      ctx.fillText(label, 0, 1);
    } else if (st.kind === 'bubble') {
      const label = txt || '여기 진짜 추천해요!';
      ctx.font = `700 ${fontBase}px "Pretendard Variable", Pretendard, sans-serif`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 38, bh = fontBase * 2.1;
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 18); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-12, bh / 2 - 2); ctx.lineTo(-2, bh / 2 + 12); ctx.lineTo(10, bh / 2 - 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#111827';
      ctx.fillText(label, 0, 1);
    } else if (st.kind === 'rating') {
      const label = txt || '★★★★★ 5.0';
      ctx.font = `800 ${fontBase}px "Pretendard Variable", Pretendard, sans-serif`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 30, bh = fontBase * 1.85;
      ctx.fillStyle = 'rgba(15,18,24,0.82)';
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(250,204,21,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.fillText(label, 0, 1);
    } else if (st.kind === 'heart') {
      const beat = 1 + Math.pow(Math.sin(time * 5.2) * 0.5 + 0.5, 4) * 0.16;
      ctx.scale(beat, beat);
      ctx.font = `${Math.round(w * 0.12)}px sans-serif`;
      ctx.shadowColor = 'rgba(225,29,72,0.55)'; ctx.shadowBlur = 18;
      ctx.fillText('❤️', 0, 0);
    } else if (st.kind === 'pointer') {
      const bob = Math.sin(time * 6.5) * 6;
      const label = `${txt || '필수 체크'} 👇`;
      ctx.font = `800 ${fontBase}px "Pretendard Variable", Pretendard, sans-serif`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 30, bh = fontBase * 1.85;
      ctx.translate(0, bob);
      ctx.fillStyle = 'rgba(17,24,39,0.88)';
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, 0, 1);
    } else if (st.kind === 'rec') {
      const blink = Math.floor(time * 2) % 2 === 0;
      const label = `REC  ${formatRecTime(time)}`;
      ctx.font = `700 ${Math.round(fontBase * 0.8)}px "JetBrains Mono", monospace`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 36, bh = fontBase * 1.6;
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 8); ctx.fill();
      if (blink) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(-bw / 2 + 14, 0, 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, 6, 1);
    } else if (st.kind === 'music') {
      const musicEl = document.getElementById('music');
      const selectedName = musicEl && musicEl.selectedOptions && musicEl.selectedOptions[0] && musicEl.value
        ? musicEl.selectedOptions[0].text : '';
      const label = `🎵 ${txt || selectedName || 'NOW PLAYING'}`;
      ctx.font = `700 ${Math.round(fontBase * 0.84)}px "Pretendard Variable", Pretendard, sans-serif`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 32, bh = fontBase * 1.75;
      ctx.fillStyle = 'rgba(14,16,22,0.78)';
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText(label, 0, 1);
    }
    ctx.restore();
  }

  window.arPaintShortsStickers = function arPaintShortsStickers(ctx, s, time) {
    const list = s && s.stickers;
    if (!Array.isArray(list) || !list.length) return;
    const w = ctx.canvas.width, h = ctx.canvas.height;
    for (const st of list) drawSingleSticker(ctx, st, time, w, h, s.clip);
  };

  window.openShortsStickerDialog = function openShortsStickerDialog(s) {
    if (!s || !s.clip || typeof mixDialog !== 'function') return;
    const total = typeof mixTotal === 'function' ? mixTotal(s) : 5;
    const box = mixDialog('인스타 스티커', null);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px;';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = '스티커 문구 입력 (선택)';
    textInput.style.cssText = 'width:100%;margin-bottom:10px;padding:8px 10px;border-radius:8px;border:1px solid #454750;background:#16171c;color:#fff;font-size:13px;';
    box.append(textInput);

    STICKER_PRESETS.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:10px 6px;border-radius:10px;border:1px solid #383a44;background:#262830;color:#f4f4f6;font-size:12px;cursor:pointer;';
      btn.innerHTML = `<span style="font-size:18px;line-height:1;">${p.icon}</span><span>${p.label}</span>`;
      btn.addEventListener('click', () => {
        const start = Math.max(0, Math.min(s.trackTime || 0, Math.max(0, total - 0.5)));
        const duration = Math.min(3.5, Math.max(0.6, total - start));
        const customText = textInput.value.trim();
        (s.stickers ||= []).push({
          kind: p.id,
          label: p.label,
          text: customText || p.defaultText,
          x: p.x,
          y: p.y,
          scale: 1,
          start,
          duration
        });
        if (typeof showMixHint === 'function') showMixHint(`${p.label} 스티커를 추가했어요.`);
        if (typeof mixChanged === 'function') mixChanged(s);
        else if (typeof renderPreview === 'function') renderPreview();
        renderActiveStickers();
      });
      wrap.append(btn);
    });
    box.append(wrap);

    const activeList = document.createElement('div');
    activeList.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    function renderActiveStickers() {
      activeList.replaceChildren();
      const arr = s.stickers || [];
      if (!arr.length) return;
      const head = document.createElement('div');
      head.textContent = `추가된 스티커 (${arr.length}개)`;
      head.style.cssText = 'font-size:12px;color:#9ca3af;margin-top:4px;';
      activeList.append(head);
      arr.forEach((st, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 8px;border-radius:8px;background:#18191f;border:1px solid #30323c;font-size:12px;';
        const info = document.createElement('span');
        info.textContent = `${st.label}${st.text ? ' · ' + st.text : ''} (${st.start.toFixed(1)}초)`;
        const controls = document.createElement('div');
        controls.style.cssText = 'display:flex;gap:4px;';
        const posBtn = document.createElement('button');
        posBtn.type = 'button';
        posBtn.textContent = '위치';
        posBtn.style.cssText = 'padding:3px 7px;border-radius:6px;border:1px solid #454750;background:#262830;color:#e5e7eb;font-size:11px;cursor:pointer;';
        posBtn.addEventListener('click', () => {
          const ys = [0.16, 0.32, 0.50, 0.72, 0.85];
          const curIdx = ys.findIndex((v) => Math.abs((st.y || 0.2) - v) < 0.08);
          st.y = ys[(curIdx + 1) % ys.length];
          if (typeof mixChanged === 'function') mixChanged(s);
          else if (typeof renderPreview === 'function') renderPreview();
        });
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = '삭제';
        delBtn.style.cssText = 'padding:3px 7px;border-radius:6px;border:0;background:#dc2626;color:#fff;font-size:11px;cursor:pointer;';
        delBtn.addEventListener('click', () => {
          arr.splice(idx, 1);
          if (typeof mixChanged === 'function') mixChanged(s);
          else if (typeof renderPreview === 'function') renderPreview();
          renderActiveStickers();
        });
        controls.append(posBtn, delBtn);
        row.append(info, controls);
        activeList.append(row);
      });
    }
    renderActiveStickers();
    box.append(activeList);
  };
})();
