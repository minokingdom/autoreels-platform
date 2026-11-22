// AutoReels — 07-studio-styles-104.js
// 스타일 100종 프로젝트 Batch 4 (61~80 / 100종):
// 장르 7 칠판·노트·정보·교육 (10종) + 장르 8 식당·카페·푸드 특화 (10종)

    const STUDIO_100_B4_SPECS = [
      // ── 장르 7: 칠판 · 노트 · 정보 · 교육 (10종) ──────────────────────────
      ['s100_nt_chalkboard',  '초록 칠판 분필',    '손글씨',   '#17332a', '#10261f', '#fde047', '#f8fafc', 'gaegu',   false, 'note', 'lofi',     '교실 초록 칠판과 분필 손글씨 프레임'],
      ['s100_nt_whiteboard',  '화이트보드 마커',   '상담·정보', '#f8fafc', '#eef2f6', '#2563eb', '#1e293b', 'pretM',   true,  'note', 'bright',   '알루미늄 보드와 컬러 마커 필기 프레임'],
      ['s100_nt_gridnote',    '모눈종이 노트',     '손글씨',   '#f9faf8', '#eff2ec', '#0f766e', '#1f2937', 'pen',     true,  'note', 'lofi',     '스프링 제본 모눈종이와 손글씨 기록'],
      ['s100_nt_blueprint',   '블루프린트 청사진',  '테크',     '#0d3b66', '#0a2d4f', '#7dd3fc', '#ffffff', 'mono',    false, 'note', 'drive',    '건축 청사진 밀리미터 그리드와 도면 표제란'],
      ['s100_nt_postit',      '포스트잇 보드',     '재미',     '#d7b68a', '#c8a372', '#facc15', '#1c1917', 'pen',     true,  'note', 'bright',   '코르크 핀보드와 노란 포스트잇 메모'],
      ['s100_nt_infograph',   '인포그래픽 차트',   '카드뉴스',  '#0f172a', '#1e293b', '#38bdf8', '#f8fafc', 'pretM',   false, 'note', 'showroom', '도넛 게이지와 데이터 프로그레스 카드'],
      ['s100_nt_checklist',   '체크리스트 노트',   '카드뉴스',  '#faf7f0', '#f1ece0', '#16a34a', '#18181b', 'pretM',   true,  'note', 'bright',   '단계별 체크마크가 켜지는 정리 노트'],
      ['s100_nt_highlighter', '교과서 형광펜',     '상담·정보', '#fdfcf7', '#f5f2e6', '#fde047', '#18181b', 'pretM',   true,  'note', 'showroom', '노란 형광펜 밑줄이 쓱 그어지는 핵심 요약'],
      ['s100_nt_calendar',    '캘린더 일정표',     '감성',     '#ffffff', '#f4f4f5', '#dc2626', '#18181b', 'gowun',   true,  'note', 'lofi',     '빨간 월간 헤더와 펀칭 일력 캘린더'],
      ['s100_nt_mindmap',     '마인드맵 카드',     '상담·정보', '#111626', '#1a2238', '#a78bfa', '#f5f3ff', 'pretM',   false, 'note', 'showroom', '빛나는 연결선과 아이디어 노드 마인드맵'],

      // ── 장르 8: 식당 · 카페 · 푸드 특화 (10종) ────────────────────────────
      ['s100_fd_michelin',    '미슐랭 메뉴판',     '고급',     '#f5f1e8', '#eae3d3', '#7f1d1d', '#1c1917', 'maru',    true,  'food', 'jazz',     '파인다이닝 코스 메뉴판과 버건디 금선'],
      ['s100_fd_brunch',      '성수동 브런치',     '감성',     '#fbf5eb', '#f3e8d6', '#c26d48', '#2c221c', 'gowun',   true,  'food', 'lofi',     '따뜻한 테라코타 아치와 햇살 브런치 무드'],
      ['s100_fd_pocha',       '야시장 네온 포차',   '재미',     '#110918', '#1f0e2c', '#f43f5e', '#fde047', 'dohyeon', false, 'food', 'funk',     '깜빡이는 네온 튜브와 심야 포차 감성'],
      ['s100_fd_dessert',     '디저트 파스텔',     '감성',     '#fff0f5', '#ffe4ee', '#ec4899', '#4a1d32', 'jua',     true,  'food', 'bright',   '딸기우유 레이스 도일리와 디저트 카드'],
      ['s100_fd_espresso',    '에스프레소 다크',   '고급',     '#16100c', '#241912', '#d4a373', '#faedcd', 'maru',    false, 'food', 'jazz',     '크레마 골드 라인과 피어오르는 커피 김'],
      ['s100_fd_omakase',     '오마카세 한지',     '고급',     '#efe8da', '#e5dbc7', '#991b1b', '#1c1917', 'maru',    true,  'food', 'ballad',   '편백 나무 띠와 한지 특선 인장 프레임'],
      ['s100_fd_recipe',      '레시피 카드',       '상담·정보', '#faf8f3', '#f0ece1', '#ea580c', '#1c1917', 'pretM',   true,  'food', 'bright',   '스텝 넘버와 조리 시간 배지 레시피 카드'],
      ['s100_fd_delivery',    '배달 특가 전단',    '특가',     '#dc2626', '#991b1b', '#facc15', '#ffffff', 'gasoek',  false, 'food', 'funk',     '지그재그 쿠폰 띠와 강력한 특가 프로모션'],
      ['s100_fd_wine',        '와인바 라벨',       '고급',     '#1c0d12', '#2d141d', '#d4af37', '#f6efe4', 'maru',    false, 'food', 'jazz',     '보르도 와인 병 라벨과 빈티지 금박 테두리'],
      ['s100_fd_bakery',      '베이커리 크라프트',  '감성',     '#d8bc96', '#c8a87e', '#5c3a21', '#2b1b10', 'gaegu',   true,  'food', 'lofi',     '따뜻한 크라프트 봉투와 갓 구운 빵 스탬프']
    ];

    if (typeof s100RegisterStyles === 'function') s100RegisterStyles(STUDIO_100_B4_SPECS, 960);

    if (typeof STUDIO_100_RENDERERS !== 'undefined') {
      // ── 장르 7: 칠판 · 노트 · 정보 · 교육 (10종) ──────────────────────────
      STUDIO_100_RENDERERS.s100_nt_chalkboard = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        // 칠판 나무 프레임 & 하단 분필 받침대
        c.strokeStyle = '#7c4d2b'; c.lineWidth = 14; c.strokeRect(7, 7, W - 14, H - 14);
        c.fillStyle = '#5c381e'; c.fillRect(14, H - 30, W - 28, 16);
        c.fillStyle = '#ffffff'; c.fillRect(72, H - 36, 46, 6);
        c.fillStyle = accent; c.fillRect(132, H - 36, 36, 6);
        const px = 42, py = 92, pw = W - 84, ph = 532;
        c.save(); gRoundRect(c, px, py, pw, ph, 10); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.save(); c.setLineDash([10, 7]); c.strokeStyle = 'rgba(255,255,255,0.72)'; c.lineWidth = 2.5;
        gRoundRect(c, px - 6, py - 6, pw + 12, ph + 12, 12); c.stroke(); c.restore();
        c.fillStyle = accent; c.font = `700 18px 'Gaegu', cursive`; c.textAlign = 'center';
        c.fillText(`✦ 오늘의 핵심 포인트 0${cutIdx + 1} ✦`, W / 2, 58);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gaegu', x: W / 2, y: 748, maxW: W * 0.82, maxLines: 3, maxSize: 38, minSize: 24, color: '#f8fafc', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_whiteboard = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.strokeStyle = '#cbd5e1'; c.lineWidth = 12; c.strokeRect(6, 6, W - 12, H - 12);
        // 하단 마커 트레이
        c.fillStyle = '#94a3b8'; c.fillRect(20, H - 28, W - 40, 12);
        c.fillStyle = '#2563eb'; gRoundRect(c, 52, H - 36, 54, 9, 4); c.fill();
        c.fillStyle = '#ef4444'; gRoundRect(c, 118, H - 36, 54, 9, 4); c.fill();
        c.fillStyle = '#18181b'; gRoundRect(c, 184, H - 36, 54, 9, 4); c.fill();
        const px = 40, py = 94, pw = W - 80, ph = 528;
        c.save(); gRoundRect(c, px, py, pw, ph, 14); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 3; gRoundRect(c, px - 4, py - 4, pw + 8, ph + 8, 16); c.stroke();
        // 빨간 마커 원 강조
        c.fillStyle = '#ef4444'; c.font = `800 13px Pretendard, sans-serif`; c.textAlign = 'left';
        c.fillText(`CHECK #0${cutIdx + 1}`, px, 64);
        c.fillStyle = accent; c.fillRect(px, 72, 92 * ent, 3);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 748, maxW: W * 0.82, maxLines: 3, maxSize: 32, minSize: 20, color: '#1e293b', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_gridnote = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        // 모눈종이 격자 + 세로 레드 마진
        c.strokeStyle = 'rgba(15,118,110,0.12)'; c.lineWidth = 1;
        for (let x = 0; x < W; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
        for (let y = 0; y < H; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        c.strokeStyle = 'rgba(239,68,68,0.35)'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(46, 0); c.lineTo(46, H); c.stroke();
        // 상단 스프링 노트 링
        for (let i = 0; i < 11; i++) {
          const rx = 38 + i * 46;
          c.fillStyle = '#334155'; c.beginPath(); c.arc(rx, 32, 7, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#94a3b8'; c.lineWidth = 3; c.beginPath(); c.moveTo(rx, 6); c.lineTo(rx, 32); c.stroke();
        }
        const px = 54, py = 86, pw = W - 92, ph = 540;
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.14)'; c.shadowBlur = 14; c.shadowOffsetY = 6;
        c.fillStyle = '#ffffff'; c.fillRect(px - 8, py - 8, pw + 16, ph + 16);
        c.restore();
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 상단 테이프
        c.fillStyle = 'rgba(15,118,110,0.34)'; c.fillRect(W / 2 - 48, py - 18, 96, 22);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pen', x: W / 2, y: 760, maxW: W * 0.80, maxLines: 3, maxSize: 40, minSize: 25, color: '#1f2937', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_blueprint = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.strokeStyle = 'rgba(125,211,252,0.14)'; c.lineWidth = 1;
        for (let x = 0; x < W; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
        for (let y = 0; y < H; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = 2; c.strokeRect(18, 22, W - 36, H - 44);
        const px = 40, py = 86, pw = W - 80, ph = 532;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(13,59,102,0.18)'; c.fillRect(px, py, pw, ph);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 2; c.strokeRect(px, py, pw, ph);
        // 도면 치수 표기 & 우하단 표제란
        c.fillStyle = accent; c.font = `700 10.5px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`BLUEPRINT SPEC // DWG-0${cutIdx + 1}`, px, 58);
        c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.2; c.strokeRect(W - 190, H - 72, 162, 40);
        c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.fillText('SCALE 1:1 · REV.A', W - 109, H - 48);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: W / 2, y: 742, maxW: W - 92, maxLines: 3, maxSize: 29, minSize: 19, color: '#ffffff', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_postit = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        const px = 42, py = 74, pw = W - 84, ph = 524;
        c.save();
        c.shadowColor = 'rgba(40,24,10,0.28)'; c.shadowBlur = 20; c.shadowOffsetY = 10;
        c.fillStyle = '#ffffff'; c.fillRect(px - 10, py - 10, pw + 20, ph + 20);
        c.restore();
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 상단 빨간 압정
        c.fillStyle = '#dc2626'; c.beginPath(); c.arc(W / 2, py - 6, 11, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.arc(W / 2 - 3, py - 9, 3.5, 0, Math.PI * 2); c.fill();
        if (caption && !capHidden) {
          // 노란 포스트잇 메모
          c.save();
          c.translate(W / 2, 766); c.rotate((cutIdx % 2 ? 1 : -1) * 0.025);
          c.shadowColor = 'rgba(28,25,23,0.25)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
          c.fillStyle = '#fef08a'; c.fillRect(-206, -92, 412, 184);
          c.fillStyle = '#fde047'; c.fillRect(-206, -92, 412, 22);
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pen', x: 0, y: 12, maxW: 372, maxLines: 3, maxSize: 38, minSize: 24, color: '#1c1917', ent, capHidden });
          c.restore();
        }
      };

      STUDIO_100_RENDERERS.s100_nt_infograph = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, ent, accent }) => {
        // 상단 프로그레스 & 도넛 게이지 헤더
        const pct = Math.round(((cutIdx + lp) / Math.max(1, totalCuts)) * 100);
        gRoundRect(c, 28, 32, W - 56, 56, 14); c.fillStyle = '#1e293b'; c.fill();
        c.strokeStyle = 'rgba(56,189,248,0.35)'; c.lineWidth = 1.2; c.stroke();
        // 도넛 링
        c.strokeStyle = 'rgba(148,163,184,0.25)'; c.lineWidth = 5;
        c.beginPath(); c.arc(62, 60, 17, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = accent; c.beginPath(); c.arc(62, 60, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (pct / 100)); c.stroke();
        c.fillStyle = '#f8fafc'; c.font = `800 10px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`${pct}%`, 62, 60);
        c.textAlign = 'left'; c.font = `700 13px Pretendard, sans-serif`; c.fillText(`DATA INSIGHT · STEP 0${cutIdx + 1}`, 94, 53);
        c.fillStyle = 'rgba(148,163,184,0.3)'; gRoundRect(c, 94, 66, W - 144, 6, 3); c.fill();
        c.fillStyle = accent; gRoundRect(c, 94, 66, (W - 144) * (pct / 100), 6, 3); c.fill();
        const px = 28, py = 104, pw = W - 56, ph = 548;
        c.save(); gRoundRect(c, px, py, pw, ph, 18); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 768, maxW: W - 76, maxLines: 3, maxSize: 32, minSize: 20, color: '#f8fafc', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_checklist = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, ent, accent }) => {
        // 상단 체크리스트 단계 바
        const steps = Math.min(5, Math.max(3, totalCuts));
        const sw = (W - 56 - (steps - 1) * 8) / steps;
        for (let i = 0; i < steps; i++) {
          const sx = 28 + i * (sw + 8), done = i <= cutIdx;
          gRoundRect(c, sx, 38, sw, 32, 16); c.fillStyle = done ? accent : '#e5e0d4'; c.fill();
          c.fillStyle = done ? '#ffffff' : '#78716c'; c.font = `800 12px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(done ? `✓ 0${i + 1}` : `0${i + 1}`, sx + sw / 2, 54);
        }
        const px = 28, py = 88, pw = W - 56, ph = 552;
        c.save(); gRoundRect(c, px, py, pw, ph, 18); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = 'rgba(22,163,74,0.35)'; c.lineWidth = 2; gRoundRect(c, px, py, pw, ph, 18); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 76, maxLines: 3, maxSize: 32, minSize: 20, color: '#18181b', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_highlighter = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(220,38,38,0.28)'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(32, 0); c.lineTo(32, H); c.stroke();
        const px = 46, py = 74, pw = W - 80, ph = 552;
        c.save(); gRoundRect(c, px, py, pw, ph, 12); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        if (caption && !capHidden) {
          // 형광펜 브러시 쓱 그어지는 배경 띠
          c.fillStyle = accent;
          gRoundRect(c, 52, 742, (W - 104) * ent, 46, 6); c.fill();
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 762, maxW: W - 116, maxLines: 3, maxSize: 32, minSize: 20, color: '#18181b', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_nt_calendar = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 상단 캘린더 빨간 헤더 + 펀칭 구멍 2개
        c.fillStyle = accent; c.fillRect(0, 0, W, 114);
        [120, W - 120].forEach((hx) => {
          c.fillStyle = '#ffffff'; c.beginPath(); c.arc(hx, 34, 11, 0, Math.PI * 2); c.fill();
          c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 2; c.stroke();
        });
        c.fillStyle = '#ffffff'; c.font = `900 22px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`DAILY LOG · DAY 0${cutIdx + 1}`, W / 2, 82);
        const px = 36, py = 136, pw = W - 72, ph = 524;
        c.save(); gRoundRect(c, px, py, pw, ph, 12); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#e4e4e7'; c.lineWidth = 2; gRoundRect(c, px, py, pw, ph, 12); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 780, maxW: W - 84, maxLines: 3, maxSize: 31, minSize: 20, color: '#18181b', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_nt_mindmap = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 마인드맵 베지어 연결 브랜치
        c.save();
        c.strokeStyle = 'rgba(167,139,250,0.45)'; c.lineWidth = 2;
        [[86, 56], [W - 86, 56], [74, 654], [W - 74, 654]].forEach(([nx, ny]) => {
          c.beginPath(); c.moveTo(W / 2, 360); c.quadraticCurveTo(nx, 360, nx, ny); c.stroke();
        });
        c.restore();
        [['KEY', 86, 54], [`NODE 0${cutIdx + 1}`, W - 86, 54]].forEach(([lbl, nx, ny]) => {
          gRoundRect(c, nx - 46, ny - 15, 92, 30, 15); c.fillStyle = '#242b47'; c.fill();
          c.strokeStyle = accent; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = '#f5f3ff'; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(lbl, nx, ny);
        });
        const px = 42, py = 96, pw = W - 84, ph = 532;
        c.save(); gRoundRect(c, px, py, pw, ph, 22); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 2; gRoundRect(c, px, py, pw, ph, 22); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 84, maxLines: 3, maxSize: 32, minSize: 20, color: '#f5f3ff', ent, capHidden });
      };

      // ── 장르 8: 식당 · 카페 · 푸드 특화 (10종) ────────────────────────────
      STUDIO_100_RENDERERS.s100_fd_michelin = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        c.strokeStyle = accent; c.lineWidth = 2; c.strokeRect(20, 24, W - 40, H - 48);
        c.strokeStyle = 'rgba(180,140,70,0.55)'; c.lineWidth = 1; c.strokeRect(27, 31, W - 54, H - 62);
        c.fillStyle = accent; c.font = `700 11.5px 'Song Myung', serif`; c.textAlign = 'center';
        c.fillText(`COURSE 0${cutIdx + 1}  ·  CHEF’S SELECTION`, W / 2, 68);
        const px = 48, py = 96, pw = W - 96, ph = 540;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#b48c46'; c.lineWidth = 1.5; c.strokeRect(px, py, pw, ph);
        c.fillStyle = accent; c.fillRect(W / 2 - 26, 668, 52 * ent, 1.5);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 766, maxW: W - 104, maxLines: 3, maxSize: 31, minSize: 20, color: '#1c1917', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_brunch = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        const ax = 42, ay = 86, aw = W - 84, ah = 556, ar = aw / 2;
        const arch = () => {
          c.beginPath(); c.moveTo(ax, ay + ah); c.lineTo(ax, ay + ar);
          c.arc(ax + ar, ay + ar, ar, Math.PI, 0); c.lineTo(ax + aw, ay + ah); c.closePath();
        };
        c.save(); arch(); c.clip();
        inPhotoFade(c, S, cutIdx, local, ax, ay, aw, ah, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(251,191,36,0.08)'; c.fillRect(ax, ay, aw, ah);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 2.5; arch(); c.stroke();
        c.fillStyle = accent; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`SUNLIT BRUNCH · TABLE 0${cutIdx + 1}`, W / 2, 54);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 766, maxW: W - 92, maxLines: 3, maxSize: 31, minSize: 20, color: '#2c221c', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_pocha = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 30, py = 86, pw = W - 60, ph = 564;
        c.save(); gRoundRect(c, px, py, pw, ph, 18); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.04 + lp * 0.04, 0);
        c.restore();
        // 네온 포차 글로우 테두리 + 상단 홍등 불빛
        const pulse = 0.78 + 0.22 * Math.sin(t * 5);
        c.save();
        c.shadowColor = accent; c.shadowBlur = 18 * pulse; c.strokeStyle = accent; c.lineWidth = 3.5;
        gRoundRect(c, px, py, pw, ph, 18); c.stroke();
        c.restore();
        for (let i = 0; i < 5; i++) {
          const lx = 78 + i * 96;
          c.fillStyle = i % 2 ? '#fde047' : accent;
          c.beginPath(); c.arc(lx, 46, 9, 0, Math.PI * 2); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 768, maxW: W * 0.84, maxLines: 3, maxSize: 36, minSize: 22, color: '#fde047', shadow: accent, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_dessert = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 상·하단 베이커리 도일리 스캘럽 레이스
        c.fillStyle = '#fbcfe8';
        for (let x = 18; x < W + 18; x += 36) {
          c.beginPath(); c.arc(x, 14, 18, 0, Math.PI); c.fill();
          c.beginPath(); c.arc(x, H - 14, 18, Math.PI, 0); c.fill();
        }
        const px = 40, py = 86, pw = W - 80, ph = 548;
        c.save();
        c.shadowColor = 'rgba(236,72,153,0.18)'; c.shadowBlur = 22; c.shadowOffsetY = 8;
        gRoundRect(c, px - 8, py - 8, pw + 16, ph + 16, 30); c.fillStyle = '#ffffff'; c.fill();
        c.restore();
        c.save(); gRoundRect(c, px, py, pw, ph, 24); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.fillStyle = accent; c.font = `700 13px 'Jua', sans-serif`; c.textAlign = 'center';
        c.fillText(`♡ SWEET PICK 0${cutIdx + 1} ♡`, W / 2, 56);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 760, maxW: W * 0.82, maxLines: 3, maxSize: 34, minSize: 21, color: '#4a1d32', boxBg: 'rgba(255,255,255,0.88)', boxRadius: 20, padX: 20, padY: 12, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_espresso = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 38, py = 96, pw = W - 76, ph = 548;
        c.save(); gRoundRect(c, px, py, pw, ph, 12); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(22,16,12,0.16)'; c.fillRect(px, py, pw, ph);
        c.restore();
        c.strokeStyle = 'rgba(212,163,115,0.48)'; c.lineWidth = 1.5; gRoundRect(c, px, py, pw, ph, 12); c.stroke();
        // 상단 피어오르는 커피 김 곡선
        c.save();
        c.strokeStyle = 'rgba(250,237,205,0.34)'; c.lineWidth = 2; c.lineCap = 'round';
        for (let i = -1; i <= 1; i++) {
          const sx = W / 2 + i * 24;
          c.beginPath(); c.moveTo(sx, 74);
          c.quadraticCurveTo(sx + Math.sin(t * 2 + i) * 10, 56, sx - Math.sin(t * 2 + i) * 8, 34);
          c.stroke();
        }
        c.restore();
        c.fillStyle = accent; c.fillRect(W / 2 - 30, 676, 60 * ent, 1.5);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 770, maxW: W * 0.80, maxLines: 3, maxSize: 31, minSize: 20, color: '#faedcd', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_omakase = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        // 좌측 편백 원목 띠
        c.fillStyle = '#c8a97e'; c.fillRect(0, 0, 26, H);
        c.fillStyle = 'rgba(92,58,33,0.22)'; c.fillRect(26, 0, 3, H);
        const px = 48, py = 92, pw = W - 82, ph = 548;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 우상단 붉은 특선 인장
        c.fillStyle = accent; c.fillRect(W - 76, 46, 36, 36);
        c.strokeStyle = '#efe8da'; c.lineWidth = 1.5; c.strokeRect(W - 72, 50, 28, 28);
        c.fillStyle = '#efe8da'; c.font = `700 13px 'Song Myung', serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('특선', W - 58, 65);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: 52, y: 766, maxW: W - 92, maxLines: 3, maxSize: 32, minSize: 20, color: '#1c1917', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_recipe = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 상단 레시피 STEP 배지
        gRoundRect(c, 28, 38, 108, 32, 16); c.fillStyle = accent; c.fill();
        c.fillStyle = '#ffffff'; c.font = `800 12.5px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`STEP 0${cutIdx + 1}`, 82, 54);
        c.fillStyle = '#78716c'; c.font = `600 12px Pretendard, sans-serif`; c.textAlign = 'right';
        c.fillText('간단 레시피 · 요리 노트', W - 28, 54);
        const px = 28, py = 86, pw = W - 56, ph = 556;
        c.save(); gRoundRect(c, px, py, pw, ph, 20); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 76, maxLines: 3, maxSize: 32, minSize: 20, color: '#1c1917', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_delivery = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 노란 지그재그 쿠폰 외곽 띠
        c.fillStyle = accent; c.fillRect(0, 0, W, 16); c.fillRect(0, H - 16, W, 16);
        const px = 26, py = 74, pw = W - 52, ph = 558;
        c.save(); gRoundRect(c, px, py, pw, ph, 16); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.04 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 4; gRoundRect(c, px, py, pw, ph, 16); c.stroke();
        // 특가 배지
        gRoundRect(c, px, 32, 134, 34, 8); c.fillStyle = accent; c.fill();
        c.fillStyle = '#991b1b'; c.font = `900 14px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('🔥 오늘의 특가', px + 67, 49);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 37, minSize: 22, color: '#ffffff', strokeCol: '#7f1d1d', strokeW: 6, offsetColor: accent, offsetDx: 0, offsetDy: 4, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_wine = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 보르도 와인 병 라벨 카드
        gRoundRect(c, 26, 36, W - 52, H - 72, 12); c.fillStyle = '#f6efe4'; c.fill();
        c.strokeStyle = accent; c.lineWidth = 2; gRoundRect(c, 34, 44, W - 68, H - 88, 8); c.stroke();
        c.fillStyle = '#5c1928'; c.font = `700 11.5px 'Song Myung', serif`; c.textAlign = 'center';
        c.fillText(`GRAND RESERVE · VINTAGE 2026 · NO.0${cutIdx + 1}`, W / 2, 74);
        const px = 52, py = 98, pw = W - 104, ph = 524;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 1.5; c.strokeRect(px, py, pw, ph);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 758, maxW: W - 120, maxLines: 3, maxSize: 30, minSize: 19, color: '#2d141d', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_fd_bakery = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        // 박음질 스티치 외곽
        c.save(); c.setLineDash([8, 6]); c.strokeStyle = 'rgba(255,250,240,0.72)'; c.lineWidth = 2;
        gRoundRect(c, 20, 24, W - 40, H - 48, 16); c.stroke(); c.restore();
        const px = 42, py = 96, pw = W - 84, ph = 532;
        c.save(); gRoundRect(c, px, py, pw, ph, 16); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 우상단 타원형 베이커리 도장
        c.save(); c.translate(W - 88, 108); c.rotate(0.16);
        c.strokeStyle = accent; c.lineWidth = 2.5;
        c.beginPath(); c.ellipse(0, 0, 56, 26, 0, 0, Math.PI * 2); c.stroke();
        c.fillStyle = accent; c.font = `800 11px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('FRESH BAKED', 0, -5); c.fillText('DAILY', 0, 9);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gaegu', x: W / 2, y: 756, maxW: W - 92, maxLines: 3, maxSize: 38, minSize: 24, color: '#2b1b10', ent, capHidden });
      };
    }
