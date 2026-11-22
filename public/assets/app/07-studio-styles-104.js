// AutoReels — 07-studio-styles-104.js
// 스타일 100종 프로젝트 Batch 4 (61~80 / 100종 — 풀블리드 9:16 업그레이드):
// 장르 7 칠판·노트·정보·교육 (10종) + 장르 8 식당·카페·푸드 특화 (10종)

    const STUDIO_100_B4_SPECS = [
      ['s100_nt_chalkboard',  '초록 칠판 분필',    '손글씨',   '#17332a', '#10261f', '#fde047', '#f8fafc', 'gaegu',   false, 'note', 'lofi',     '풀화면 칠판 테두리와 분필 손글씨 오버레이'],
      ['s100_nt_whiteboard',  '화이트보드 마커',   '상담·정보', '#f8fafc', '#eef2f6', '#2563eb', '#1e293b', 'pretM',   false, 'note', 'bright',   '풀화면 보드 프레임과 컬러 마커 강조 자막'],
      ['s100_nt_gridnote',    '모눈종이 노트',     '손글씨',   '#f9faf8', '#eff2ec', '#0f766e', '#1f2937', 'pen',     false, 'note', 'lofi',     '풀화면 스프링 제본 링과 손글씨 메모'],
      ['s100_nt_blueprint',   '블루프린트 청사진',  '테크',     '#0d3b66', '#0a2d4f', '#7dd3fc', '#ffffff', 'mono',    false, 'note', 'drive',    '풀화면 건축 청사진 그리드와 도면 표제란'],
      ['s100_nt_postit',      '포스트잇 보드',     '재미',     '#d7b68a', '#c8a372', '#facc15', '#1c1917', 'pen',     false, 'note', 'bright',   '풀화면 위 기울어진 노란 포스트잇 메모'],
      ['s100_nt_infograph',   '인포그래픽 차트',   '카드뉴스',  '#0f172a', '#1e293b', '#38bdf8', '#f8fafc', 'pretM',   false, 'note', 'showroom', '풀화면 상단 도넛 게이지와 프로그레스 바'],
      ['s100_nt_checklist',   '체크리스트 노트',   '카드뉴스',  '#faf7f0', '#f1ece0', '#16a34a', '#ffffff', 'pretM',   false, 'note', 'bright',   '풀화면 단계별 체크마크 스텝 배지'],
      ['s100_nt_highlighter', '교과서 형광펜',     '상담·정보', '#fdfcf7', '#f5f2e6', '#fde047', '#18181b', 'pretM',   false, 'note', 'showroom', '풀화면 노란 형광펜 밑줄이 쓱 그어지는 자막'],
      ['s100_nt_calendar',    '캘린더 일정표',     '감성',     '#ffffff', '#f4f4f5', '#dc2626', '#ffffff', 'gowun',   false, 'note', 'lofi',     '풀화면 상단 빨간 일력 헤더와 펀칭 구멍'],
      ['s100_nt_mindmap',     '마인드맵 카드',     '상담·정보', '#111626', '#1a2238', '#a78bfa', '#f5f3ff', 'pretM',   false, 'note', 'showroom', '풀화면 빛나는 마인드맵 노드와 연결선'],

      ['s100_fd_michelin',    '미슐랭 메뉴판',     '고급',     '#f5f1e8', '#eae3d3', '#d4a656', '#faf4e6', 'maru',    false, 'food', 'jazz',     '풀화면 파인다이닝 코스 헤더와 금박 테두리'],
      ['s100_fd_brunch',      '성수동 브런치',     '감성',     '#fbf5eb', '#f3e8d6', '#e08b65', '#ffffff', 'gowun',   false, 'food', 'lofi',     '풀화면 햇살 브런치 아치와 테라코타 라인'],
      ['s100_fd_pocha',       '야시장 네온 포차',   '재미',     '#110918', '#1f0e2c', '#f43f5e', '#fde047', 'dohyeon', false, 'food', 'funk',     '풀화면 깜빡이는 네온 튜브와 심야 포차 홍등'],
      ['s100_fd_dessert',     '디저트 파스텔',     '감성',     '#fff0f5', '#ffe4ee', '#ec4899', '#4a1d32', 'jua',     false, 'food', 'bright',   '풀화면 딸기우유 도일리 레이스와 파스텔 자막'],
      ['s100_fd_espresso',    '에스프레소 다크',   '고급',     '#16100c', '#241912', '#d4a373', '#faedcd', 'maru',    false, 'food', 'jazz',     '풀화면 다크 로스트 톤과 피어오르는 커피 김'],
      ['s100_fd_omakase',     '오마카세 한지',     '고급',     '#efe8da', '#e5dbc7', '#991b1b', '#faf3e6', 'maru',    false, 'food', 'ballad',   '풀화면 좌측 편백 원목 띠와 붉은 특선 인장'],
      ['s100_fd_recipe',      '레시피 카드',       '상담·정보', '#faf8f3', '#f0ece1', '#ea580c', '#ffffff', 'pretM',   false, 'food', 'bright',   '풀화면 상단 STEP 배지와 요리 노트 자막'],
      ['s100_fd_delivery',    '배달 특가 전단',    '특가',     '#dc2626', '#991b1b', '#facc15', '#ffffff', 'gasoek',  false, 'food', 'funk',     '풀화면 크림슨 특가 배지와 노란 쿠폰 띠'],
      ['s100_fd_wine',        '와인바 라벨',       '고급',     '#1c0d12', '#2d141d', '#d4af37', '#f6efe4', 'maru',    false, 'food', 'jazz',     '풀화면 보르도 금박 라벨 테두리와 빈티지 타이포'],
      ['s100_fd_bakery',      '베이커리 크라프트',  '감성',     '#d8bc96', '#c8a87e', '#fde68a', '#fffbeb', 'gaegu',   false, 'food', 'lofi',     '풀화면 스티치 테두리와 갓 구운 빵 도장']
    ];

    if (typeof s100RegisterStyles === 'function') s100RegisterStyles(STUDIO_100_B4_SPECS, 960);

    if (typeof STUDIO_100_RENDERERS !== 'undefined') {
      STUDIO_100_RENDERERS.s100_nt_chalkboard = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(18,46,36,0.24)', pattern: 'paper', botScrim: 'rgba(16,38,31,0.88)', botH: 340 });
        c.strokeStyle = '#7c4d2b'; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10);
        c.save(); c.setLineDash([10, 7]); c.strokeStyle = 'rgba(255,255,255,0.68)'; c.lineWidth = 2.2;
        gRoundRect(c, 20, 24, W - 40, H - 48, 12); c.stroke(); c.restore();
        c.fillStyle = accent; c.font = `700 18px 'Gaegu', cursive`; c.textAlign = 'center';
        c.fillText(`✦ 핵심 포인트 0${cutIdx + 1} ✦`, W / 2, 54);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gaegu', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 44, minSize: 26, color: '#f8fafc', shadow: 'rgba(0,0,0,0.75)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_whiteboard = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(15,23,42,0.76)', botH: 320 });
        c.strokeStyle = '#e2e8f0'; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10);
        c.fillStyle = accent; gRoundRect(c, 26, 30, 114, 30, 6); c.fill();
        c.fillStyle = '#ffffff'; c.font = `800 12px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`BOARD #0${cutIdx + 1}`, 83, 45);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W * 0.82, maxLines: 3, maxSize: 36, minSize: 22, color: '#1e293b', boxBg: 'rgba(255,255,255,0.94)', boxBorder: accent, boxRadius: 14, padX: 22, padY: 14, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_gridnote = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(15,24,22,0.82)', botH: 340 });
        c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1;
        for (let x = 0; x < W; x += 36) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
        for (let y = 0; y < H; y += 36) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        for (let i = 0; i < 11; i++) {
          const rx = 38 + i * 46;
          c.fillStyle = '#1e293b'; c.beginPath(); c.arc(rx, 28, 6.5, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#e2e8f0'; c.lineWidth = 3; c.beginPath(); c.moveTo(rx, 4); c.lineTo(rx, 28); c.stroke();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pen', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 46, minSize: 27, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_blueprint = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(13,59,102,0.34)', botScrim: 'rgba(10,45,79,0.88)', botH: 340 });
        c.strokeStyle = 'rgba(125,211,252,0.20)'; c.lineWidth = 1;
        for (let x = 0; x < W; x += 36) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
        for (let y = 0; y < H; y += 36) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2; c.strokeRect(16, 20, W - 32, H - 40);
        c.fillStyle = accent; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`BLUEPRINT // DWG-0${cutIdx + 1}`, 30, 48);
        c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.2; c.strokeRect(W - 180, H - 64, 152, 34);
        c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.fillText('SCALE 1:1 · REV.A', W - 104, H - 43);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: W / 2, y: 760, maxW: W - 84, maxLines: 3, maxSize: 33, minSize: 21, color: '#ffffff', shadow: 'rgba(10,30,60,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_postit = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(28,25,23,0.45)', botH: 260 });
        if (caption && !capHidden) {
          c.save(); c.translate(W / 2, 766); c.rotate((cutIdx % 2 ? 1 : -1) * 0.03);
          c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 22; c.shadowOffsetY = 10;
          c.fillStyle = '#fef08a'; c.fillRect(-208, -86, 416, 172);
          c.fillStyle = '#fde047'; c.fillRect(-208, -86, 416, 20);
          c.fillStyle = '#dc2626'; c.beginPath(); c.arc(0, -76, 8, 0, Math.PI * 2); c.fill();
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pen', x: 0, y: 12, maxW: 376, maxLines: 3, maxSize: 42, minSize: 25, color: '#1c1917', ent, capHidden });
          c.restore();
        }
      };

      STUDIO_100_RENDERERS.s100_nt_infograph = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(15,23,42,0.74)', botScrim: 'rgba(15,23,42,0.88)', botH: 340 });
        const pct = Math.round(((cutIdx + lp) / Math.max(1, totalCuts)) * 100);
        gRoundRect(c, 22, 30, W - 44, 54, 14); c.fillStyle = 'rgba(15,23,42,0.84)'; c.fill();
        c.strokeStyle = 'rgba(56,189,248,0.45)'; c.lineWidth = 1.2; c.stroke();
        c.strokeStyle = 'rgba(148,163,184,0.28)'; c.lineWidth = 4.5; c.beginPath(); c.arc(54, 57, 16, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = accent; c.beginPath(); c.arc(54, 57, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (pct / 100)); c.stroke();
        c.fillStyle = '#f8fafc'; c.font = `800 10px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`${pct}%`, 54, 57);
        c.textAlign = 'left'; c.font = `700 12.5px Pretendard, sans-serif`; c.fillText(`DATA INSIGHT · STEP 0${cutIdx + 1}`, 84, 50);
        c.fillStyle = 'rgba(148,163,184,0.32)'; gRoundRect(c, 84, 63, W - 128, 6, 3); c.fill();
        c.fillStyle = accent; gRoundRect(c, 84, 63, (W - 128) * (pct / 100), 6, 3); c.fill();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 76, maxLines: 3, maxSize: 36, minSize: 22, color: '#f8fafc', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_checklist = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(15,24,18,0.68)', botScrim: 'rgba(15,24,18,0.86)', botH: 340 });
        const steps = Math.min(5, Math.max(3, totalCuts));
        const sw = (W - 48 - (steps - 1) * 8) / steps;
        for (let i = 0; i < steps; i++) {
          const sx = 24 + i * (sw + 8), done = i <= cutIdx;
          gRoundRect(c, sx, 34, sw, 30, 15); c.fillStyle = done ? accent : 'rgba(255,255,255,0.22)'; c.fill();
          c.fillStyle = '#ffffff'; c.font = `800 12px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(done ? `✓ 0${i + 1}` : `0${i + 1}`, sx + sw / 2, 49);
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 76, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_highlighter = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(14,14,16,0.72)', botH: 320 });
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 764, maxW: W - 92, maxLines: 3, maxSize: 38, minSize: 23, color: '#18181b', boxBg: accent, boxRadius: 8, padX: 20, padY: 12, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_calendar = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(18,18,22,0.84)', botH: 340 });
        c.fillStyle = accent; c.fillRect(0, 0, W, 86);
        [116, W - 116].forEach((hx) => { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(hx, 26, 9, 0, Math.PI * 2); c.fill(); });
        c.fillStyle = '#ffffff'; c.font = `900 18px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`DAILY LOG · DAY 0${cutIdx + 1}`, W / 2, 60);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 774, maxW: W - 80, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_mindmap = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(17,22,38,0.68)', botScrim: 'rgba(17,22,38,0.88)', botH: 340 });
        [['KEY', 78, 52], [`NODE 0${cutIdx + 1}`, W - 78, 52]].forEach(([lbl, nx, ny]) => {
          gRoundRect(c, nx - 46, ny - 15, 92, 30, 15); c.fillStyle = 'rgba(26,34,56,0.85)'; c.fill();
          c.strokeStyle = accent; c.lineWidth = 1.6; c.stroke();
          c.fillStyle = '#f5f3ff'; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(lbl, nx, ny);
        });
        c.strokeStyle = 'rgba(167,139,250,0.55)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(124, 52); c.lineTo(W - 124, 52); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 84, maxLines: 3, maxSize: 36, minSize: 22, color: '#f5f3ff', shadow: accent, ent, capHidden });
      };

      // ── 장르 8: 식당 · 카페 · 푸드 특화 (10종 — 100% 풀블리드 9:16!) ───────
      STUDIO_100_RENDERERS.s100_fd_michelin = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(28,22,18,0.68)', botScrim: 'rgba(28,22,18,0.86)', botH: 340 });
        c.strokeStyle = accent; c.lineWidth = 2; c.strokeRect(18, 22, W - 36, H - 44);
        c.fillStyle = '#faf4e6'; c.font = `700 11.5px 'Song Myung', serif`; c.textAlign = 'center';
        c.fillText(`COURSE 0${cutIdx + 1}  ·  CHEF’S SELECTION`, W / 2, 54);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 768, maxW: W - 92, maxLines: 3, maxSize: 36, minSize: 22, color: '#faf4e6', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_brunch = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(251,191,36,0.08)', topScrim: 'rgba(44,34,28,0.52)', botScrim: 'rgba(44,34,28,0.82)', botH: 340 });
        c.strokeStyle = 'rgba(255,248,236,0.72)'; c.lineWidth = 2;
        const ax = 24, ay = 28, aw = W - 48, ah = H - 56, ar = aw / 2;
        c.beginPath(); c.moveTo(ax, ay + ah); c.lineTo(ax, ay + ar); c.arc(ax + ar, ay + ar, ar, Math.PI, 0); c.lineTo(ax + aw, ay + ah); c.closePath(); c.stroke();
        c.fillStyle = '#fff7ed'; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`SUNLIT BRUNCH · 0${cutIdx + 1}`, W / 2, 62);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 766, maxW: W - 92, maxLines: 3, maxSize: 38, minSize: 23, color: '#fff7ed', shadow: 'rgba(44,34,28,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_pocha = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(17,9,24,0.86)', botH: 340 });
        const pulse = 0.78 + 0.22 * Math.sin(t * 5);
        c.save(); c.shadowColor = accent; c.shadowBlur = 18 * pulse; c.strokeStyle = accent; c.lineWidth = 3.5;
        gRoundRect(c, 16, 20, W - 32, H - 40, 20); c.stroke(); c.restore();
        for (let i = 0; i < 5; i++) {
          c.fillStyle = i % 2 ? '#fde047' : accent; c.beginPath(); c.arc(78 + i * 96, 46, 8, 0, Math.PI * 2); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 768, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#fde047', shadow: accent, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_dessert = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(255,240,245,0.08)', botScrim: 'rgba(74,29,50,0.68)', botH: 300 });
        c.fillStyle = 'rgba(255,240,245,0.92)';
        for (let x = 18; x < W + 18; x += 36) {
          c.beginPath(); c.arc(x, 8, 18, 0, Math.PI); c.fill();
          c.beginPath(); c.arc(x, H - 8, 18, Math.PI, 0); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 764, maxW: W * 0.82, maxLines: 3, maxSize: 38, minSize: 23, color: '#4a1d32', boxBg: 'rgba(255,245,248,0.94)', boxBorder: accent, boxRadius: 22, padX: 22, padY: 14, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_espresso = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(22,16,12,0.22)', botScrim: 'rgba(22,16,12,0.88)', botH: 340 });
        c.strokeStyle = 'rgba(212,163,115,0.52)'; c.lineWidth = 1.5; gRoundRect(c, 20, 24, W - 40, H - 48, 14); c.stroke();
        c.save(); c.strokeStyle = 'rgba(250,237,205,0.42)'; c.lineWidth = 2; c.lineCap = 'round';
        for (let i = -1; i <= 1; i++) {
          const sx = W / 2 + i * 24;
          c.beginPath(); c.moveTo(sx, 78); c.quadraticCurveTo(sx + Math.sin(t * 2 + i) * 10, 58, sx - Math.sin(t * 2 + i) * 8, 36); c.stroke();
        }
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 768, maxW: W * 0.82, maxLines: 3, maxSize: 36, minSize: 22, color: '#faedcd', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_omakase = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(28,25,23,0.84)', botH: 340 });
        c.fillStyle = '#c8a97e'; c.fillRect(0, 0, 20, H);
        if (typeof arDrawEditableSeal === 'function') {
          arDrawEditableSeal(c, W, H, cutIdx, { x: W - 46, y: 52, w: 38, h: 38, text: '특선', bg: accent, fg: '#efe8da', innerBorder: true, font: "'Song Myung', serif", weight: 700, vertical: false });
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: 40, y: 768, maxW: W - 80, maxLines: 3, maxSize: 36, minSize: 22, color: '#faf3e6', align: 'left', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_recipe = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(28,25,23,0.58)', botScrim: 'rgba(28,25,23,0.84)', botH: 340 });
        gRoundRect(c, 24, 36, 108, 32, 16); c.fillStyle = accent; c.fill();
        c.fillStyle = '#ffffff'; c.font = `800 12.5px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`STEP 0${cutIdx + 1}`, 78, 52);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 76, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_delivery = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(127,29,29,0.86)', botH: 340 });
        c.fillStyle = accent; c.fillRect(0, 0, W, 14); c.fillRect(0, H - 14, W, 14);
        gRoundRect(c, 24, 32, 138, 36, 8); c.fillStyle = accent; c.fill();
        c.fillStyle = '#991b1b'; c.font = `900 14px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('🔥 오늘의 특가', 93, 50);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 42, minSize: 25, color: '#ffffff', strokeCol: '#7f1d1d', strokeW: 7, offsetColor: accent, offsetDx: 0, offsetDy: 4, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_wine = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(45,20,29,0.22)', topScrim: 'rgba(28,13,18,0.70)', botScrim: 'rgba(28,13,18,0.88)', botH: 340 });
        c.strokeStyle = accent; c.lineWidth = 2; gRoundRect(c, 18, 22, W - 36, H - 44, 10); c.stroke();
        c.fillStyle = '#f6efe4'; c.font = `700 11.5px 'Song Myung', serif`; c.textAlign = 'center';
        c.fillText(`GRAND RESERVE · VINTAGE 2026`, W / 2, 54);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 768, maxW: W - 92, maxLines: 3, maxSize: 36, minSize: 22, color: '#f6efe4', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_bakery = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(216,188,150,0.12)', botScrim: 'rgba(43,27,16,0.82)', botH: 340 });
        c.save(); c.setLineDash([8, 6]); c.strokeStyle = 'rgba(255,250,240,0.78)'; c.lineWidth = 2.2;
        gRoundRect(c, 18, 22, W - 36, H - 44, 16); c.stroke(); c.restore();
        c.save(); c.translate(W - 86, 68); c.rotate(0.14);
        c.fillStyle = 'rgba(92,58,33,0.85)'; c.beginPath(); c.ellipse(0, 0, 56, 26, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = accent; c.lineWidth = 2; c.stroke();
        c.fillStyle = accent; c.font = `800 11px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('FRESH BAKED', 0, -5); c.fillText('DAILY', 0, 9); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gaegu', x: W / 2, y: 766, maxW: W - 84, maxLines: 3, maxSize: 44, minSize: 26, color: '#fffbeb', shadow: 'rgba(43,27,16,0.85)', ent, capHidden });
      };
    }
