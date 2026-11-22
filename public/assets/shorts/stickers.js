// Studio-identical 120+ Sticker & Frame Library for Shorts Editor
// (Widgets 16 + Photo Sticker + Frames 8 + Doodles 16 + Badges 24 + Emojis 56 + legacy 12 compatibility)
(function () {
  const WIDGETS = [
    { key: 'loc', label: '📍 위치 태그', sub: 'SEOUL · HOT', bg: 'linear-gradient(90deg,#ec4899,#8b5cf6)' },
    { key: 'time', label: '🕒 시간 스탬프', sub: 'NOW · LIVE', bg: '#18181b' },
    { key: 'date', label: '📅 날짜 카드', sub: 'TODAY EDITION', bg: '#27272a' },
    { key: 'music', label: '🎵 뮤직 플레이어', sub: 'Now Playing', bg: '#0f172a' },
    { key: 'poll', label: '📊 투표 스티커', sub: '좋아요 | 궁금해요', bg: '#3f3f46' },
    { key: 'slider', label: '😍 만족 슬라이더', sub: '100% 추천', bg: '#7c2d12' },
    { key: 'tag', label: '🏷️ 특가 행택', sub: 'SPECIAL PRICE', bg: '#ca8a04' },
    { key: 'stars5', label: '★ 5.0 리뷰', sub: '★★★★★', bg: '#18181b' },
    { key: 'dm', label: '💬 DM 질문박스', sub: '편하게 문의', bg: '#312e81' },
    { key: 'follow', label: '🔔 팔로우 알림', sub: '+ FOLLOW', bg: '#be185d' },
    { key: 'dday', label: '🔥 타임세일', sub: 'TODAY ONLY', bg: '#991b1b' },
    { key: 'verified', label: '✅ 100% 정품', sub: 'VERIFIED', bg: '#065f46' },
    { key: 'rec', label: '● REC VLOG', sub: '4K · 60FPS', bg: '#7f1d1d' },
    { key: 'open', label: '☕ OPEN 사인', sub: 'WELCOME', bg: '#1e293b' },
    { key: 'gift', label: '🎁 선착순 혜택', sub: 'EVENT GIFT', bg: '#581c87' },
    { key: 'ready', label: '⚡ 즉시 가능', sub: 'FAST BOOKING', bg: '#0e7490' }
  ];
  const FRAMES = [
    { key: 'viewfinder', label: '📷 뷰파인더', sub: 'REC ● 4K' },
    { key: 'film', label: '🎞️ 필름 프레임', sub: 'KODAK 400' },
    { key: 'polaroid', label: '🖼️ 폴라로이드', sub: 'MEMORIES' },
    { key: 'magazine', label: '📰 매거진 커버', sub: 'EDITION' },
    { key: 'cinema', label: '🎬 시네마 바', sub: '21:9 WIDE' },
    { key: 'sparkleBorder', label: '✨ 글리터 테두리', sub: 'GLOW' },
    { key: 'tape', label: '🏷️ 마스킹 테이프', sub: 'DIARY' },
    { key: '', label: '✕ 프레임 제거', sub: 'CLEAR' }
  ];
  const DOODLES = [
    { key: 'sparkle3', label: '스파클', color: '#ffffff' },
    { key: 'sparkleGold', label: '골드빛', color: '#facc15' },
    { key: 'sparklePink', label: '핑크빛', color: '#fb7185' },
    { key: 'sparkleMint', label: '민트빛', color: '#34d399' },
    { key: 'arrow', label: '화살표', color: '#ffffff' },
    { key: 'arrowPink', label: '핑크화살', color: '#fb7185' },
    { key: 'arrowGold', label: '골드화살', color: '#facc15' },
    { key: 'doubleArrow', label: '더블화살', color: '#38bdf8' },
    { key: 'heart', label: '라인하트', color: '#fb7185' },
    { key: 'heartFill', label: '채움하트', color: '#ef4444' },
    { key: 'underline', label: '골드물결', color: '#facc15' },
    { key: 'underlineWhite', label: '화이트물결', color: '#ffffff' },
    { key: 'check', label: '체크도장', color: '#34d399' },
    { key: 'crown', label: '왕관', color: '#facc15' },
    { key: 'bang', label: '강조 !!', color: '#facc15' },
    { key: 'circleMark', label: '강조원', color: '#fb7185' }
  ];
  const BADGES = [
    { text: 'NEW', bg: '#ef4444', fg: '#ffffff' },
    { text: 'BEST', bg: '#facc15', fg: '#09090b' },
    { text: 'HOT 🔥', bg: '#f97316', fg: '#ffffff' },
    { text: 'SALE', bg: '#ec4899', fg: '#ffffff' },
    { text: 'EVENT', bg: '#8b5cf6', fg: '#ffffff' },
    { text: '추천!', bg: '#38bdf8', fg: '#09090b' },
    { text: '예약중', bg: '#10b981', fg: '#09090b' },
    { text: '한정수량', bg: '#18181b', fg: '#fde047' },
    { text: '오늘만', bg: '#ffffff', fg: '#09090b' },
    { text: '무료배송', bg: '#2563eb', fg: '#ffffff' },
    { text: 'DM문의', bg: '#db2777', fg: '#ffffff' },
    { text: 'SOLD OUT', bg: '#27272a', fg: '#f87171' },
    { text: '1 + 1', bg: '#f43f5e', fg: '#ffffff' },
    { text: 'VIP', bg: '#18181b', fg: '#facc15' },
    { text: 'PICK ✨', bg: '#6366f1', fg: '#ffffff' },
    { text: '인기폭발', bg: '#ea580c', fg: '#ffffff' },
    { text: '마감임박', bg: '#dc2626', fg: '#ffffff' },
    { text: '할인특가', bg: '#eab308', fg: '#09090b' },
    { text: '오픈런', bg: '#0ea5e9', fg: '#ffffff' },
    { text: '재입고', bg: '#14b8a6', fg: '#09090b' },
    { text: '실물깡패', bg: '#ec4899', fg: '#ffffff' },
    { text: '단독특가', bg: '#7c3aed', fg: '#ffffff' },
    { text: '당일발송', bg: '#059669', fg: '#ffffff' },
    { text: '선착순', bg: '#f59e0b', fg: '#09090b' }
  ];
  const EMOJIS = [
    '✨', '🔥', '💖', '⭐', '🎉', '👑', '💯',
    '👇', '👉', '👆', '📌', '💎', '🌸', '🍀',
    '⚡', '💥', '🎯', '🎁', '☕', '🍰', '🚗',
    '💅', '🏋️', '🏠', '📸', '🎵', '🫶', '🥳',
    '🤍', '🖤', '💛', '🩵', '🩷', '🌟', '🫧',
    '🦋', '🌷', '🍓', '🥂', '🎬', '🛍️', '🏷️',
    '📍', '🕒', '🔔', '💬', '👍', '👏', '🙌',
    '😍', '🤩', '😎', '🥹', '✅', '🚀', '❤️'
  ];

  window.arStickerPresets = WIDGETS;
  const photoCache = {};
  function getPhotoImg(src) {
    if (!src) return null;
    let img = photoCache[src];
    if (!img) {
      img = new Image();
      img.onload = () => { if (typeof renderPreview === 'function') renderPreview(); };
      img.src = src;
      photoCache[src] = img;
    }
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const rad = Math.min(Math.max(0, r), w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function drawSparkleShape(c, x, y, r, col) {
    c.save();
    c.translate(x, y);
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, -r);
    c.quadraticCurveTo(0, 0, r, 0);
    c.quadraticCurveTo(0, 0, 0, r);
    c.quadraticCurveTo(0, 0, -r, 0);
    c.quadraticCurveTo(0, 0, 0, -r);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawFrameOverlay(c, W, H, fk, t) {
    if (!fk) return;
    const u = Math.min(W, H) / 1080;
    c.save();
    if (fk === 'viewfinder') {
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = Math.max(2, 4 * u);
      const m = 24 * u, len = 36 * u;
      [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => {
        c.beginPath(); c.moveTo(x + dx * len, y); c.lineTo(x, y); c.lineTo(x, y + dy * len); c.stroke();
      });
      c.fillStyle = Math.floor(t * 2) % 2 === 0 ? '#ef4444' : 'rgba(239,68,68,0.4)';
      c.beginPath(); c.arc(m + 20 * u, m + 24 * u, 7 * u, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff';
      c.font = `700 ${Math.round(18 * u)}px "JetBrains Mono", monospace`;
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('REC  4K · 60FPS', m + 36 * u, m + 25 * u);
    } else if (fk === 'film') {
      const bar = Math.round(34 * u);
      c.fillStyle = 'rgba(10,10,12,0.92)';
      c.fillRect(0, 0, bar, H);
      c.fillRect(W - bar, 0, bar, H);
      c.fillStyle = 'rgba(255,255,255,0.22)';
      for (let y = 18 * u; y < H; y += 38 * u) {
        roundRectPath(c, 8 * u, y, 16 * u, 20 * u, 3 * u); c.fill();
        roundRectPath(c, W - 24 * u, y, 16 * u, 20 * u, 3 * u); c.fill();
      }
    } else if (fk === 'polaroid') {
      const bw = Math.round(28 * u), bot = Math.round(110 * u);
      c.strokeStyle = '#ffffff';
      c.lineWidth = bw;
      c.strokeRect(bw / 2, bw / 2, W - bw, H - bw);
      c.fillStyle = '#ffffff';
      c.fillRect(0, H - bot, W, bot);
      c.fillStyle = '#18181b';
      c.font = `400 ${Math.round(30 * u)}px "Nanum Pen Script", cursive`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('Special Moment', W / 2, H - bot * 0.45);
    } else if (fk === 'magazine') {
      c.fillStyle = 'rgba(255,255,255,0.92)';
      c.font = `900 ${Math.round(54 * u)}px "Song Myung", "Gowun Batang", serif`;
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('EDITION', W / 2, 26 * u);
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.lineWidth = Math.max(1.5, 2 * u);
      c.strokeRect(20 * u, 20 * u, W - 40 * u, H - 40 * u);
    } else if (fk === 'cinema') {
      const bar = Math.round(H * 0.11);
      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, bar);
      c.fillRect(0, H - bar, W, bar);
    } else if (fk === 'sparkleBorder') {
      c.strokeStyle = 'rgba(253,224,71,0.58)';
      c.lineWidth = Math.max(2, 3 * u);
      roundRectPath(c, 20 * u, 20 * u, W - 40 * u, H - 40 * u, 22 * u);
      c.stroke();
      drawSparkleShape(c, 34 * u, 34 * u, 18 * u, '#fde047');
      drawSparkleShape(c, W - 34 * u, H - 34 * u, 18 * u, '#fde047');
    } else if (fk === 'tape') {
      c.fillStyle = 'rgba(253,224,71,0.45)';
      [[36 * u, 36 * u, -0.4], [W - 36 * u, 36 * u, 0.4], [36 * u, H - 36 * u, 0.4], [W - 36 * u, H - 36 * u, -0.4]].forEach(([x, y, a]) => {
        c.save(); c.translate(x, y); c.rotate(a); c.fillRect(-34 * u, -10 * u, 68 * u, 20 * u); c.restore();
      });
    }
    c.restore();
  }

  function drawWidgetOrDoodle(c, k, txt, color, sc) {
    c.save();
    if (k === 'loc' || k === 'location') {
      const label = `📍 ${txt || 'SEOUL HOTPLACE'}`;
      c.font = `800 ${Math.round(25 * sc)}px "Pretendard Variable", Pretendard, sans-serif`;
      const bw = Math.max(210 * sc, c.measureText(label).width + 44 * sc), bh = 54 * sc;
      const grd = c.createLinearGradient(-bw / 2, 0, bw / 2, 0);
      grd.addColorStop(0, '#ec4899'); grd.addColorStop(1, '#8b5cf6');
      c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 14 * sc;
      roundRectPath(c, -bw / 2, -bh / 2, bw, bh, 14 * sc);
      c.fillStyle = '#ffffff'; c.fill();
      c.shadowBlur = 0; c.fillStyle = grd; c.fillText(label, 0, 2 * sc);
    } else if (k === 'time' || k === 'timestamp') {
      const now = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const label = txt || `${days[now.getDay()]} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      c.font = `700 ${Math.round(27 * sc)}px "JetBrains Mono", monospace`;
      const bw = Math.max(195 * sc, c.measureText(label).width + 40 * sc), bh = 54 * sc;
      c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 14 * sc;
      roundRectPath(c, -bw / 2, -bh / 2, bw, bh, 14 * sc);
      c.fillStyle = 'rgba(15,15,18,0.82)'; c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = Math.max(1.2, 2 * sc); c.stroke();
      c.shadowBlur = 0; c.fillStyle = '#ffffff'; c.fillText(label, 0, 2 * sc);
    } else if (k === 'music') {
      const bw = 270 * sc, bh = 74 * sc;
      c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 16 * sc;
      roundRectPath(c, -bw / 2, -bh / 2, bw, bh, 16 * sc);
      c.fillStyle = 'rgba(20,20,26,0.86)'; c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = Math.max(1, 1.5 * sc); c.stroke();
      c.shadowBlur = 0;
      roundRectPath(c, -bw / 2 + 10 * sc, -24 * sc, 48 * sc, 48 * sc, 10 * sc);
      c.fillStyle = '#38bdf8'; c.fill();
      c.fillStyle = '#09090b'; c.font = `800 ${Math.round(22 * sc)}px sans-serif`;
      c.fillText('♫', -bw / 2 + 34 * sc, 1 * sc);
      c.textAlign = 'left';
      c.fillStyle = '#ffffff'; c.font = `700 ${Math.round(18 * sc)}px "Pretendard Variable", Pretendard, sans-serif`;
      c.fillText(txt || 'Now Playing BGM', -bw / 2 + 70 * sc, -9 * sc);
      c.fillStyle = '#a1a1aa'; c.font = `500 ${Math.round(14 * sc)}px "Pretendard Variable", Pretendard, sans-serif`;
      c.fillText('Now Playing · LIVE', -bw / 2 + 70 * sc, 13 * sc);
    } else if (k === 'poll') {
      const bw = 270 * sc, bh = 112 * sc;
      c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 16 * sc;
      roundRectPath(c, -bw / 2, -bh / 2, bw, bh, 18 * sc);
      c.fillStyle = '#ffffff'; c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#09090b'; c.font = `800 ${Math.round(19 * sc)}px "Pretendard Variable", Pretendard, sans-serif`;
      c.fillText(txt || '지금 느낌 어때요?', 0, -28 * sc);
      roundRectPath(c, -bw / 2 + 14 * sc, -4 * sc, bw - 28 * sc, 36 * sc, 10 * sc);
      c.fillStyle = '#f4f4f5'; c.fill();
      c.fillStyle = '#09090b'; c.font = `700 ${Math.round(16 * sc)}px "Pretendard Variable", Pretendard, sans-serif`;
      c.fillText('🔥 완전 좋아요!   |   👀 궁금해요', 0, 14 * sc);
    } else if (k === 'slider') {
      const bw = 260 * sc, bh = 74 * sc;
      c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 14 * sc;
      roundRectPath(c, -bw / 2, -bh / 2, bw, bh, 18 * sc);
      c.fillStyle = '#ffffff'; c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#18181b'; c.font = `800 ${Math.round(17 * sc)}px "Pretendard Variable", Pretendard, sans-serif`;
      c.fillText(txt || '만족도 100% 추천', 0, -14 * sc);
      roundRectPath(c, -bw / 2 + 22 * sc, 10 * sc, bw - 44 * sc, 10 * sc, 5 * sc);
      c.fillStyle = '#e4e4e7'; c.fill();
      const grd = c.createLinearGradient(-bw / 2 + 22 * sc, 0, bw / 2 - 42 * sc, 0);
      grd.addColorStop(0, '#f43f5e'); grd.addColorStop(1, '#facc15');
      roundRectPath(c, -bw / 2 + 22 * sc, 10 * sc, (bw - 44 * sc) * 0.82, 10 * sc, 5 * sc);
      c.fillStyle = grd; c.fill();
      c.font = `${Math.round(28 * sc)}px sans-serif`;
      c.fillText('😍', bw / 2 - 42 * sc, 14 * sc);
    } else if (k === 'tag' || k === 'price') {
      const label = txt || 'SPECIAL PRICE';
      c.font = `900 ${Math.round(23 * sc)}px "Do Hyeon", Pretendard, sans-serif`;
      const bw = Math.max(200 * sc, c.measureText(label).width + 58 * sc), bh = 58 * sc;
      c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 14 * sc;
      roundRectPath(c, -bw / 2, -bh / 2, bw, bh, 12 * sc);
      c.fillStyle = '#facc15'; c.fill(); c.shadowBlur = 0;
      c.beginPath(); c.arc(-bw / 2 + 20 * sc, 0, 6 * sc, 0, Math.PI * 2);
      c.fillStyle = '#09090b'; c.fill();
      c.fillStyle = '#09090b'; c.fillText(label, 10 * sc, 2 * sc);
    } else if (k === 'stars5' || k === 'rating') {
      const bw = 210 * sc, bh = 54 * sc;
      c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 12 * sc;
      roundRectPath(c, -bw / 2, -bh / 2, bw, bh, bh / 2);
      c.fillStyle = 'rgba(15,15,18,0.86)'; c.fill();
      c.strokeStyle = '#facc15'; c.lineWidth = Math.max(1.4, 2 * sc); c.stroke();
      c.shadowBlur = 0; c.fillStyle = '#facc15';
      c.font = `800 ${Math.round(24 * sc)}px sans-serif`;
      c.fillText(txt || '★★★★★', 0, 1 * sc);
    } else if (k === 'dm' || k === 'bubble') {
      const bw = 250 * sc, bh = 78 * sc;
      c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 14 * sc;
      roundRectPath(c, -bw / 2, -bh / 2, bw, bh, 16 * sc);
      c.fillStyle = 'rgba(255,255,255,0.95)'; c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#18181b'; c.font = `800 ${Math.round(18 * sc)}px "Pretendard Variable", Pretendard, sans-serif`;
      c.fillText(txt || '💬 편하게 DM 주세요!', 0, -10 * sc);
      c.fillStyle = '#71717a'; c.font = `500 ${Math.round(14 * sc)}px "Pretendard Variable", Pretendard, sans-serif`;
      c.fillText('예약 · 가격 · 상담 환영', 0, 16 * sc);
    } else if (k === 'date' || k === 'follow' || k === 'dday' || k === 'verified' || k === 'rec' || k === 'open' || k === 'gift' || k === 'ready' || k === 'hot' || k === 'new' || k === 'hashtag' || k === 'pointer') {
      const now = new Date();
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const cfg = {
        date: { text: `${months[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')} · TODAY`, bg: '#ffffff', fg: '#09090b', bd: 'rgba(255,255,255,0.4)' },
        follow: { text: '🔔 팔로우 + 알림설정', bg: '#db2777', fg: '#ffffff', bd: '#f472b6' },
        dday: { text: '🔥 TODAY ONLY 특가', bg: '#dc2626', fg: '#ffffff', bd: '#fca5a5' },
        verified: { text: '✅ 100% 정품 인증', bg: '#059669', fg: '#ffffff', bd: '#6ee7b7' },
        rec: { text: '● REC  4K VLOG', bg: 'rgba(15,15,18,0.85)', fg: '#f87171', bd: 'rgba(248,113,113,0.6)' },
        open: { text: '☕ OPEN · 영업중', bg: '#1e293b', fg: '#38bdf8', bd: '#38bdf8' },
        gift: { text: '🎁 선착순 사은품', bg: '#7c3aed', fg: '#ffffff', bd: '#c4b5fd' },
        ready: { text: '⚡ 당일 즉시 가능', bg: '#0891b2', fg: '#ffffff', bd: '#67e8f9' },
        hot: { text: '🔥 HOT 추천', bg: '#f97316', fg: '#ffffff', bd: '#fdba74' },
        new: { text: '✨ NEW ARRIVAL', bg: '#2563eb', fg: '#ffffff', bd: '#93c5fd' },
        hashtag: { text: '#오토릴스 #오늘추천', bg: '#e11d48', fg: '#ffffff', bd: '#fda4af' },
        pointer: { text: '필수 체크 👇', bg: 'rgba(17,24,39,0.88)', fg: '#ffffff', bd: 'rgba(255,255,255,0.3)' }
      }[k];
      const label = txt || cfg.text;
      c.font = `800 ${Math.round(21 * sc)}px "Pretendard Variable", Pretendard, sans-serif`;
      const bw = Math.max(190 * sc, c.measureText(label).width + 40 * sc), bh = 52 * sc;
      c.shadowColor = 'rgba(0,0,0,0.42)'; c.shadowBlur = 14 * sc;
      roundRectPath(c, -bw / 2, -bh / 2, bw, bh, 14 * sc);
      c.fillStyle = cfg.bg; c.fill();
      c.strokeStyle = cfg.bd; c.lineWidth = Math.max(1.2, 2 * sc); c.stroke();
      c.shadowBlur = 0; c.fillStyle = cfg.fg; c.fillText(label, 0, 2 * sc);
    } else if (k === 'sparkle3' || k === 'sparkleGold' || k === 'sparklePink' || k === 'sparkleMint') {
      const col = color || (k === 'sparkleGold' ? '#facc15' : k === 'sparklePink' ? '#fb7185' : k === 'sparkleMint' ? '#34d399' : '#ffffff');
      c.shadowColor = col; c.shadowBlur = 16 * sc;
      drawSparkleShape(c, 0, 0, 28 * sc, col);
      drawSparkleShape(c, -30 * sc, -22 * sc, 13 * sc, col);
      drawSparkleShape(c, 28 * sc, 22 * sc, 16 * sc, col);
    } else if (k === 'arrow' || k === 'arrowPink' || k === 'arrowGold' || k === 'doubleArrow') {
      const col = color || (k === 'arrowPink' ? '#fb7185' : k === 'arrowGold' ? '#facc15' : k === 'doubleArrow' ? '#38bdf8' : '#ffffff');
      c.strokeStyle = col; c.lineWidth = 6 * sc; c.lineCap = 'round'; c.lineJoin = 'round';
      c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 8 * sc;
      c.beginPath(); c.moveTo(-42 * sc, -26 * sc); c.quadraticCurveTo(-8 * sc, 24 * sc, 36 * sc, 12 * sc); c.stroke();
      c.beginPath(); c.moveTo(16 * sc, -4 * sc); c.lineTo(38 * sc, 12 * sc); c.lineTo(20 * sc, 30 * sc); c.stroke();
      if (k === 'doubleArrow') {
        c.beginPath(); c.moveTo(2 * sc, -10 * sc); c.lineTo(20 * sc, 4 * sc); c.lineTo(4 * sc, 20 * sc); c.stroke();
      }
    } else if (k === 'heart' || k === 'heartFill') {
      const col = color || (k === 'heartFill' ? '#ef4444' : '#fb7185');
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 5 * sc; c.lineCap = 'round';
      c.shadowColor = col; c.shadowBlur = 12 * sc;
      c.beginPath();
      c.moveTo(0, 28 * sc);
      c.bezierCurveTo(-48 * sc, -4 * sc, -30 * sc, -42 * sc, 0, -14 * sc);
      c.bezierCurveTo(30 * sc, -42 * sc, 48 * sc, -4 * sc, 0, 28 * sc);
      if (k === 'heartFill') c.fill(); else c.stroke();
    } else if (k === 'underline' || k === 'underlineWhite') {
      const col = color || (k === 'underlineWhite' ? '#ffffff' : '#facc15');
      c.strokeStyle = col; c.lineWidth = 6 * sc; c.lineCap = 'round';
      c.beginPath();
      for (let x = -72 * sc; x <= 72 * sc; x += 6 * sc) {
        const y = Math.sin(x / (12 * sc)) * 7 * sc;
        if (x === -72 * sc) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    } else if (k === 'bang') {
      c.fillStyle = color || '#facc15';
      c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 10 * sc;
      c.font = `900 ${Math.round(58 * sc)}px "Black Han Sans", sans-serif`;
      c.fillText('!!', 0, 4 * sc);
    } else if (k === 'circleMark') {
      c.strokeStyle = color || '#fb7185'; c.lineWidth = 6 * sc; c.lineCap = 'round';
      c.beginPath(); c.ellipse(0, 0, 56 * sc, 30 * sc, -0.1, 0, Math.PI * 1.88); c.stroke();
    } else if (k === 'check') {
      c.strokeStyle = color || '#34d399'; c.lineWidth = 5 * sc; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.arc(0, 0, 32 * sc, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(-14 * sc, 2 * sc); c.lineTo(-3 * sc, 14 * sc); c.lineTo(18 * sc, -12 * sc); c.stroke();
    } else if (k === 'crown') {
      c.fillStyle = color || '#facc15'; c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 10 * sc;
      c.beginPath();
      c.moveTo(-34 * sc, 18 * sc); c.lineTo(-38 * sc, -18 * sc); c.lineTo(-14 * sc, 0);
      c.lineTo(0, -26 * sc); c.lineTo(14 * sc, 0); c.lineTo(38 * sc, -18 * sc); c.lineTo(34 * sc, 18 * sc);
      c.closePath(); c.fill();
    }
    c.restore();
  }

  function drawSingleSticker(ctx, st, time, w, h) {
    const local = time - (st.start || 0);
    const dur = st.duration || 3;
    if (local < 0 || local >= dur) return;
    const enter = Math.min(1, local / 0.22);
    const exit = Math.min(1, (dur - local) / 0.18);
    const alpha = Math.min(enter, exit);
    const pop = enter >= 1 ? 1 : 1 - Math.exp(-7 * enter) * Math.cos(10 * enter);
    const u = Math.min(w, h) / 1080;
    const sc = (Number(st.scale) || 1) * u * (0.88 + 0.12 * pop);
    const cx = (typeof st.x === 'number' ? st.x : 0.5) * w;
    const cy = (typeof st.y === 'number' ? st.y : 0.28) * h;
    const rot = ((Number(st.rot) || 0) * Math.PI) / 180;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (st.variant === 'photo' && st.photoSrc) {
      const img = getPhotoImg(st.photoSrc);
      if (img) {
        const shape = st.photoShape || 'round';
        const base = 280 * sc;
        const asp = Number(st.aspect) || 1;
        const pw = asp >= 1 ? base : base * asp;
        const ph = asp >= 1 ? base / asp : base;
        ctx.shadowColor = 'rgba(0,0,0,0.42)'; ctx.shadowBlur = 18 * sc; ctx.shadowOffsetY = 6 * sc;
        if (shape === 'polaroid') {
          const pad = 14 * sc, bot = 42 * sc;
          roundRectPath(ctx, -pw / 2 - pad, -ph / 2 - pad, pw + pad * 2, ph + pad + bot, 8 * sc);
          ctx.fillStyle = '#ffffff'; ctx.fill();
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph);
        } else if (shape === 'circle') {
          const d = Math.min(pw, ph);
          ctx.beginPath(); ctx.arc(0, 0, d / 2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.save(); ctx.beginPath(); ctx.arc(0, 0, d / 2, 0, Math.PI * 2); ctx.clip();
          ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph); ctx.restore();
          ctx.beginPath(); ctx.arc(0, 0, d / 2, 0, Math.PI * 2);
          ctx.lineWidth = Math.max(2, 4 * sc); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
        } else {
          const rad = 24 * sc;
          roundRectPath(ctx, -pw / 2, -ph / 2, pw, ph, rad);
          ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.save(); roundRectPath(ctx, -pw / 2, -ph / 2, pw, ph, rad); ctx.clip();
          ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph); ctx.restore();
          roundRectPath(ctx, -pw / 2, -ph / 2, pw, ph, rad);
          ctx.lineWidth = Math.max(1.5, 3 * sc); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
        }
      }
    } else if (st.variant === 'badge') {
      const fs = Math.round(32 * sc);
      ctx.font = `800 ${fs}px "Pretendard Variable", Pretendard, sans-serif`;
      const txt = String(st.text || 'NEW');
      const tw = ctx.measureText(txt).width;
      const bw = tw + 44 * sc, bh = 54 * sc;
      ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 14 * sc; ctx.shadowOffsetY = 4 * sc;
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
      ctx.fillStyle = st.bg || '#ef4444'; ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.fillStyle = st.fg || '#ffffff';
      ctx.fillText(txt, 0, 2 * sc);
    } else if (st.variant === 'emoji') {
      const fs = Math.round(92 * sc);
      ctx.font = `${fs}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12 * sc;
      ctx.fillText(String(st.text || '✨'), 0, 0);
    } else {
      drawWidgetOrDoodle(ctx, st.kind || 'loc', String(st.text || '').trim(), st.color, sc);
    }
    ctx.restore();
  }

  function drawStrokesOverlay(ctx, strokes, w, h) {
    if (!Array.isArray(strokes) || !strokes.length) return;
    const u = Math.min(w, h) / 1080;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const st of strokes) {
      if (!st || !Array.isArray(st.points) || !st.points.length) continue;
      ctx.save();
      const sz = Math.max(2, (Number(st.size) || 14) * u);
      ctx.strokeStyle = st.color || '#ffffff';
      ctx.lineWidth = st.brush === 'highlighter' ? sz * 2.1 : sz;
      if (st.brush === 'highlighter') ctx.globalAlpha = 0.42;
      else if (st.brush === 'neon') {
        ctx.shadowColor = st.color || '#38bdf8';
        ctx.shadowBlur = Math.max(10, sz * 1.8);
      }
      ctx.beginPath();
      st.points.forEach((p, i) => {
        const px = p.x * w, py = p.y * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      if (st.points.length === 1) ctx.lineTo(st.points[0].x * w + 0.5, st.points[0].y * h + 0.5);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  window.arPaintShortsStickers = function arPaintShortsStickers(ctx, s, time) {
    if (!s) return;
    const w = ctx.canvas.width, h = ctx.canvas.height;
    if (s.activeFrame) drawFrameOverlay(ctx, w, h, s.activeFrame, time);
    if (Array.isArray(s.strokes) && s.strokes.length) drawStrokesOverlay(ctx, s.strokes, w, h);
    const list = s.stickers;
    if (!Array.isArray(list) || !list.length) return;
    for (const st of list) drawSingleSticker(ctx, st, time, w, h);
  };

  let curTab = 'widget';
  window.openShortsStickerDialog = function openShortsStickerDialog(s) {
    if (!s || !s.clip || typeof mixDialog !== 'function') return;
    const total = typeof mixTotal === 'function' ? mixTotal(s) : 5;
    const box = mixDialog('스티커 · 프레임', null);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = '스티커 문구 직접 입력 (선택 · 위젯/배지)';
    textInput.style.cssText = 'width:100%;margin-bottom:8px;padding:7px 10px;border-radius:8px;border:1px solid #3f414c;background:#15161b;color:#fff;font-size:12.5px;';
    box.append(textInput);

    const tabBar = document.createElement('div');
    tabBar.className = 'ar-st-tabs';
    const content = document.createElement('div');
    const activeList = document.createElement('div');
    activeList.style.cssText = 'display:flex;flex-direction:column;gap:5px;margin-top:10px;';
    box.append(tabBar, content, activeList);

    const photoInput = document.createElement('input');
    photoInput.type = 'file';
    photoInput.accept = 'image/*';
    photoInput.style.display = 'none';
    box.append(photoInput);

    function addStickerItem(item) {
      const start = Math.max(0, Math.min(s.trackTime || 0, Math.max(0, total - 0.5)));
      const duration = Math.min(Math.max(2.5, total - start), Math.max(0.8, total - start));
      const full = Object.assign({ x: 0.5, y: 0.34, scale: 1, rot: 0, start, duration }, item);
      (s.stickers ||= []).push(full);
      if (typeof window.selectShortsSticker === 'function') window.selectShortsSticker(full);
      if (typeof showMixHint === 'function') showMixHint(`${full.label || '스티커'} 추가 · 화면에서 끌어 위치·크기 조절`);
      if (typeof mixChanged === 'function') mixChanged(s);
      else if (typeof renderPreview === 'function') renderPreview();
      renderActiveStickers();
    }

    photoInput.addEventListener('change', () => {
      const f = photoInput.files && photoInput.files[0];
      photoInput.value = '';
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || '');
        const img = new Image();
        img.onload = () => {
          photoCache[src] = img;
          addStickerItem({
            variant: 'photo',
            kind: 'photo',
            label: '📷 사진 스티커',
            photoSrc: src,
            photoShape: 'round',
            aspect: (img.naturalWidth || 1) / (img.naturalHeight || 1),
            x: 0.5,
            y: 0.45
          });
        };
        img.src = src;
      };
      reader.readAsDataURL(f);
    });

    const TABS = [
      { id: 'widget', label: '위젯' },
      { id: 'frame', label: '프레임' },
      { id: 'doodle', label: '두들' },
      { id: 'badge', label: '배지' },
      { id: 'emoji', label: '이모지' }
    ];

    function renderTab() {
      tabBar.replaceChildren();
      TABS.forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = t.label;
        b.setAttribute('aria-pressed', String(curTab === t.id));
        b.addEventListener('click', () => { curTab = t.id; renderTab(); });
        tabBar.append(b);
      });
      content.replaceChildren();

      if (curTab === 'widget') {
        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'ar-st-photo-btn';
        upBtn.innerHTML = '📷 내 사진 스티커 올리기 <small>(갤러리 사진)</small>';
        upBtn.addEventListener('click', () => photoInput.click());
        content.append(upBtn);

        const grid = document.createElement('div');
        grid.className = 'ar-st-grid-2';
        WIDGETS.forEach((w) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ar-st-widget-btn';
          b.style.background = w.bg;
          b.innerHTML = `<strong>${w.label}</strong><small>${w.sub}</small>`;
          b.addEventListener('click', () => {
            addStickerItem({ variant: 'widget', kind: w.key, label: w.label, text: textInput.value.trim() });
          });
          grid.append(b);
        });
        content.append(grid);
      } else if (curTab === 'frame') {
        const grid = document.createElement('div');
        grid.className = 'ar-st-grid-2';
        FRAMES.forEach((fr) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ar-st-frame-btn';
          b.setAttribute('aria-pressed', String((s.activeFrame || '') === fr.key));
          b.innerHTML = `<strong>${fr.label}</strong><small>${fr.sub}</small>`;
          b.addEventListener('click', () => {
            s.activeFrame = fr.key;
            if (typeof markEdited === 'function') markEdited();
            if (typeof mixChanged === 'function') mixChanged(s);
            else if (typeof renderPreview === 'function') renderPreview();
            renderTab();
          });
          grid.append(b);
        });
        content.append(grid);
      } else if (curTab === 'doodle') {
        const grid = document.createElement('div');
        grid.className = 'ar-st-grid-4';
        DOODLES.forEach((d) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ar-st-doodle-btn';
          b.innerHTML = `<i style="background:${d.color}"></i><span>${d.label}</span>`;
          b.addEventListener('click', () => {
            addStickerItem({ variant: 'doodle', kind: d.key, label: d.label, color: d.color });
          });
          grid.append(b);
        });
        content.append(grid);
      } else if (curTab === 'badge') {
        const wrap = document.createElement('div');
        wrap.className = 'ar-st-badge-wrap';
        BADGES.forEach((bd) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ar-st-badge-pill';
          b.style.background = bd.bg;
          b.style.color = bd.fg;
          b.textContent = bd.text;
          b.addEventListener('click', () => {
            const txt = textInput.value.trim() || bd.text;
            addStickerItem({ variant: 'badge', kind: 'badge', label: txt, text: txt, bg: bd.bg, fg: bd.fg });
          });
          wrap.append(b);
        });
        content.append(wrap);
      } else {
        const grid = document.createElement('div');
        grid.className = 'ar-st-grid-7';
        EMOJIS.forEach((em) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ar-st-emoji-btn';
          b.textContent = em;
          b.addEventListener('click', () => {
            addStickerItem({ variant: 'emoji', kind: 'emoji', label: em, text: em });
          });
          grid.append(b);
        });
        content.append(grid);
      }
    }

    function renderActiveStickers() {
      activeList.replaceChildren();
      const arr = s.stickers || [];
      if (!arr.length) return;
      const head = document.createElement('div');
      head.textContent = `추가된 스티커 (${arr.length}개)`;
      head.style.cssText = 'font-size:11.5px;color:#9ca3af;margin-top:2px;';
      activeList.append(head);
      arr.forEach((st, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 8px;border-radius:8px;background:#16171d;border:1px solid #2e303a;font-size:12px;';
        const info = document.createElement('span');
        info.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        info.textContent = `${st.label || st.kind}${st.text && st.text !== st.label ? ' · ' + st.text : ''} (${(st.start || 0).toFixed(1)}초)`;
        const controls = document.createElement('div');
        controls.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';
        if (st.variant === 'photo') {
          const shBtn = document.createElement('button');
          shBtn.type = 'button';
          const shapes = ['round', 'circle', 'polaroid'];
          const names = { round: '둥글게', circle: '원형', polaroid: '폴라로이드' };
          shBtn.textContent = names[st.photoShape || 'round'];
          shBtn.style.cssText = 'padding:3px 7px;border-radius:6px;border:1px solid #454750;background:#262830;color:#e5e7eb;font-size:11px;cursor:pointer;';
          shBtn.addEventListener('click', () => {
            st.photoShape = shapes[(shapes.indexOf(st.photoShape || 'round') + 1) % shapes.length];
            if (typeof mixChanged === 'function') mixChanged(s);
            renderActiveStickers();
          });
          controls.append(shBtn);
        }
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = '삭제';
        delBtn.style.cssText = 'padding:3px 7px;border-radius:6px;border:1px solid #7f1d1d;background:#450a0a;color:#fecaca;font-size:11px;cursor:pointer;';
        delBtn.addEventListener('click', () => {
          arr.splice(idx, 1);
          if (typeof mixChanged === 'function') mixChanged(s);
          else if (typeof renderPreview === 'function') renderPreview();
          renderActiveStickers();
        });
        controls.append(delBtn);
        row.append(info, controls);
        activeList.append(row);
      });
    }

    renderTab();
    renderActiveStickers();
  };
})();
