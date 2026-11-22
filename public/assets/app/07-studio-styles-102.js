// AutoReels — 07-studio-styles-102.js
// 스타일 100종 프로젝트 Batch 2 (21~40 / 100종 — 풀블리드 9:16 업그레이드):
// 장르 3 에디토리얼·매거진·럭셔리 (10종) + 장르 4 키네틱·모션 타이포 (10종)

    const STUDIO_100_B2_SPECS = [
      ['s100_ed_vogue',        '하이패션 매거진',   '고급',   '#0e0d0f', '#171519', '#e5c17b', '#ffffff', 'maru',    false, 'editorial', 'luxury', '풀블리드 하이패션 커버 마스트헤드'],
      ['s100_ed_swiss',        '스위스 그리드',     '타이포', '#f4f2ec', '#eae6dc', '#e11d2a', '#ffffff', 'pretM',   false, 'editorial', 'urban',  '풀화면 스위스 그리드 라인과 레드 인덱스'],
      ['s100_ed_museum',       '미술관 도록',       '고급',   '#f6f4ef', '#ece8df', '#5c5346', '#1c1917', 'gowun',   true,  'editorial', 'jazz',   '미술관 전시 매트 여백과 작품 명패'],
      ['s100_ed_goldfoil',     '골드 포일',         '고급',   '#0b0a09', '#171410', '#e5c17b', '#faf4e6', 'maru',    false, 'editorial', 'luxury', '풀화면 금박 아르데코 프레임과 골드 광택'],
      ['s100_ed_noir',         '다크 노아르',       '고급',   '#070709', '#111116', '#cbd5e1', '#f8fafc', 'maru',    false, 'editorial', 'cinema', '블라인드 빛줄기와 누아르 명암 프레임'],
      ['s100_ed_monochrome',   '모노크롬 하이패션',  '고급',   '#0a0a0b', '#141416', '#ffffff', '#ffffff', 'pretM',   false, 'editorial', 'luxury', '풀화면 흑백 컬렉션 프레임과 중앙 타이포'],
      ['s100_ed_brutalist',    '브루탈리즘',        '타이포', '#d9ff00', '#c4ea00', '#d9ff00', '#0d0d0f', 'gasoek',  false, 'editorial', 'edm',    '풀화면 애시드 라임 테두리와 브루탈 박스'],
      ['s100_ed_whitegallery', '화이트 갤러리',     '감성',   '#fbfbfa', '#f2f1ed', '#18181b', '#18181b', 'gowun',   true,  'editorial', 'lofi',   '순백 벽면 그림자와 작품 번호 명패'],
      ['s100_ed_lookbook',     '룩북 분할',         '고급',   '#ede8df', '#e3dbd0', '#8c6239', '#ffffff', 'maru',    false, 'editorial', 'jazz',   '풀높이 룩북과 우측 컬러칩 스와치 띠'],
      ['s100_ed_arch',         '미니멀 아키텍처',    '고급',   '#e9e7e2', '#dddad2', '#ffffff', '#ffffff', 'pretM',   false, 'editorial', 'showroom','풀화면 건축 치수선과 모던 그리드 오버레이'],

      ['s100_kin_slam',        '슬램 임팩트',       '타이포', '#0b0b0f', '#151520', '#ef4444', '#ffffff', 'gasoek',  false, 'kinetic',   'edm',    '풀화면 스프링 슬램과 대각선 에너지 바'],
      ['s100_kin_curtain',     '커튼 리빌',         '타이포', '#0d1117', '#161b26', '#38bdf8', '#f8fafc', 'dohyeon', false, 'kinetic',   'drive',  '풀화면 좌우 시네마 커튼 리빌 모션'],
      ['s100_kin_cyber',       '네온 사이버펑크',    '테크',   '#080714', '#140c24', '#22d3ee', '#f8fafc', 'dohyeon', false, 'kinetic',   'edm',    '풀화면 사이버 HUD 코너와 네온 원근 그리드'],
      ['s100_kin_glitch',      '글리치 시그널',     '테크',   '#09090d', '#12121c', '#f43f5e', '#ffffff', 'mono',    false, 'kinetic',   'drive',  'RGB 채널 분리 글리치와 디지털 시그널'],
      ['s100_kin_wave',        '웨이브 펄스',       '타이포', '#091118', '#0e1d29', '#34d399', '#ecfdf5', 'pretM',   false, 'kinetic',   'urban',  '풀화면 동심원 파동 링과 민트 펄스'],
      ['s100_kin_stamp',       '도장 스탬프',       '특가',   '#1a1612', '#26201a', '#f59e0b', '#fffbeb', 'gasoek',  false, 'kinetic',   'funk',   '풀화면 탄성 승인 도장과 임팩트 자막'],
      ['s100_kin_iso',         '아이소메트릭',      '테크',   '#0f172a', '#1e293b', '#60a5fa', '#f1f5f9', 'pretM',   false, 'kinetic',   'drive',  '풀화면 아이소메트릭 테크 프레임과 코너 HUD'],
      ['s100_kin_marquee',     '키네틱 마키',       '타이포', '#0d0d10', '#18181f', '#facc15', '#ffffff', 'dohyeon', false, 'kinetic',   'urban',  '풀화면 상하 반대 방향 무한 전광판 띠'],
      ['s100_kin_liquid',      '리퀴드 메탈',       '고급',   '#0d0f14', '#171b24', '#cbd5e1', '#f8fafc', 'maru',    false, 'kinetic',   'luxury', '풀화면 흐르는 크롬 실버 메탈 프레임'],
      ['s100_kin_spotlight',   '스포트라이트 빔',    '고급',   '#08080b', '#121218', '#fde68a', '#ffffff', 'maru',    false, 'kinetic',   'cinema', '풀화면 무대 원뿔 스포트라이트 조명']
    ];

    if (typeof s100RegisterStyles === 'function') s100RegisterStyles(STUDIO_100_B2_SPECS, 920);

    if (typeof STUDIO_100_RENDERERS !== 'undefined') {
      STUDIO_100_RENDERERS.s100_ed_vogue = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent, brandName }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(10,10,12,0.72)', botScrim: 'rgba(10,10,12,0.82)', botH: 340 });
        c.strokeStyle = 'rgba(255,255,255,0.34)'; c.lineWidth = 1; c.strokeRect(18, 22, W - 36, H - 44);
        c.save();
        c.fillStyle = '#ffffff'; c.font = `900 74px 'Song Myung', serif`; c.textAlign = 'center'; c.textBaseline = 'top';
        c.globalAlpha = ent; c.fillText('A U R A', W / 2, 32);
        c.font = `600 10px 'JetBrains Mono', monospace`; c.fillStyle = accent;
        c.fillText(`EDITORIAL COLLECTION · ISSUE 0${cutIdx + 1}`, W / 2, 114); c.restore();
        if (brandName) {
          c.font = `600 10px Pretendard, sans-serif`; c.fillStyle = 'rgba(255,255,255,0.78)';
          c.textAlign = 'left'; c.fillText(String(brandName).slice(0, 12).toUpperCase(), 30, 240);
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 780, maxW: W * 0.82, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.7)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_swiss = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(14,14,16,0.68)', botScrim: 'rgba(14,14,16,0.84)', botH: 340 });
        c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(W * 0.34, 0); c.lineTo(W * 0.34, H); c.moveTo(0, 134); c.lineTo(W, 134); c.stroke();
        c.fillStyle = accent; c.fillRect(26, 36, 18, 18);
        c.fillStyle = '#ffffff'; c.font = `900 66px Pretendard, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'top';
        c.fillText(`0${cutIdx + 1}`, 52, 34);
        c.font = `700 11px 'JetBrains Mono', monospace`; c.fillStyle = 'rgba(255,255,255,0.75)'; c.textAlign = 'right';
        c.fillText(`SWISS GRID / 0${cutIdx + 1} OF 0${totalCuts}`, W - 26, 54);
        c.fillStyle = accent; c.fillRect(26, 132, (W - 52) * ent, 4);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: 28, y: 774, maxW: W - 56, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', align: 'left', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_museum = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, rem, accent, brandName }) => {
        // 의도된 미술관 매트 여백 (중앙 정사각형에 가까운 세로 캔버스)
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        const mx = 42, my = 100 + rem * 12, mw = W - 84, mh = 590;
        c.save(); c.shadowColor = 'rgba(28,25,23,0.16)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
        c.fillStyle = '#ffffff'; c.fillRect(mx - 12, my - 12, mw + 24, mh + 24); c.restore();
        c.save(); c.beginPath(); c.rect(mx, my, mw, mh); c.clip();
        inPhotoFade(c, S, cutIdx, local, mx, my, mw, mh, 1.02 + lp * 0.035, 0); c.restore();
        c.font = `600 10.5px 'JetBrains Mono', monospace`; c.fillStyle = accent; c.textAlign = 'center';
        c.fillText(`EXHIBITION ARCHIVE · PLATE 0${cutIdx + 1}`, W / 2, 62);
        if (brandName) { c.font = `500 10.5px 'Gowun Batang', serif`; c.fillStyle = 'rgba(92,83,70,0.75)'; c.fillText(String(brandName).slice(0, 18), W / 2, H - 36); }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 794, maxW: W * 0.80, maxLines: 3, maxSize: 34, minSize: 22, color: '#1c1917', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_goldfoil = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(11,10,9,0.68)', botScrim: 'rgba(11,10,9,0.88)', botH: 340 });
        const shift = Math.sin(t * 1.1) * 180;
        const gold = c.createLinearGradient(shift, 0, W + shift, H);
        gold.addColorStop(0, '#8a6420'); gold.addColorStop(0.35, '#f6dfa1'); gold.addColorStop(0.7, '#a87d2e'); gold.addColorStop(1, '#fce9b5');
        c.strokeStyle = gold; c.lineWidth = 3; c.strokeRect(18, 22, W - 36, H - 44);
        c.lineWidth = 1; c.strokeRect(26, 30, W - 52, H - 60);
        [[26, 30], [W - 26, 30], [26, H - 30], [W - 26, H - 30]].forEach(([cx, cy]) => {
          c.save(); c.translate(cx, cy); c.rotate(Math.PI / 4); c.fillStyle = accent; c.fillRect(-5, -5, 10, 10); c.restore();
        });
        c.font = `600 11px 'JetBrains Mono', monospace`; c.fillStyle = accent; c.textAlign = 'center';
        c.fillText(`✦  GOLD EDITION  ·  0${cutIdx + 1}  ✦`, W / 2, 58);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 770, maxW: W * 0.80, maxLines: 3, maxSize: 38, minSize: 23, color: '#faf4e6', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_noir = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(7,7,10,0.34)', botScrim: 'rgba(7,7,10,0.88)', botH: 360 });
        c.save(); c.globalAlpha = 0.16; c.fillStyle = '#e2e8f0';
        const drift = Math.sin(t * 0.6) * 14;
        for (let i = -2; i < 8; i++) {
          c.beginPath(); c.moveTo(0, i * 115 + drift); c.lineTo(W, i * 115 - 140 + drift);
          c.lineTo(W, i * 115 - 105 + drift); c.lineTo(0, i * 115 + 35 + drift); c.closePath(); c.fill();
        }
        c.restore();
        if (caption && !capHidden) { c.fillStyle = accent; c.fillRect(34, 712, 3, 98 * ent); }
        c.font = `600 10.5px 'JetBrains Mono', monospace`; c.fillStyle = 'rgba(203,213,225,0.72)'; c.textAlign = 'left';
        c.fillText(`NOIR ARCHIVE // 0${cutIdx + 1}`, 34, 58);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: 50, y: 760, maxW: W - 88, maxLines: 3, maxSize: 36, minSize: 22, color: '#f8fafc', align: 'left', shadow: 'rgba(0,0,0,0.8)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_monochrome = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(10,10,12,0.22)', topScrim: 'rgba(10,10,12,0.68)', botScrim: 'rgba(10,10,12,0.82)', botH: 340 });
        c.strokeStyle = 'rgba(255,255,255,0.82)'; c.lineWidth = 1.5; c.strokeRect(20, 24, W - 40, H - 48);
        c.fillStyle = '#ffffff'; c.font = `700 12px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`M O N O C H R O M E   ·   0 ${cutIdx + 1}`, W / 2, 58);
        c.fillRect(W / 2 - 20, 76, 40 * ent, 2);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 500, maxW: W * 0.80, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_brutalist = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(13,13,15,0.72)', botH: 320 });
        c.strokeStyle = accent; c.lineWidth = 10; c.strokeRect(10, 10, W - 20, H - 20);
        c.fillStyle = '#0d0d0f'; c.fillRect(26, 30, 152, 36);
        c.fillStyle = accent; c.font = `900 14px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`RAW // 0${cutIdx + 1}`, 102, 48);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 760, maxW: W * 0.80, maxLines: 3, maxSize: 38, minSize: 23, color: '#0d0d0f', boxBg: accent, boxBorder: '#0d0d0f', boxRadius: 0, padX: 20, padY: 14, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_whitegallery = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, ent, rem }) => {
        // 순백 갤러리 월 (시그니처 여백형)
        const px = 44, py = 86 + rem * 10, pw = W - 88, ph = 602;
        c.save(); c.shadowColor = 'rgba(0,0,0,0.16)'; c.shadowBlur = 32; c.shadowOffsetY = 16;
        c.fillStyle = '#ffffff'; c.fillRect(px, py, pw, ph); c.restore();
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.02 + lp * 0.035, 0); c.restore();
        c.fillStyle = '#18181b'; c.fillRect(44, 720, 24 * ent, 2);
        c.font = `600 10.5px 'JetBrains Mono', monospace`; c.fillStyle = '#71717a'; c.textAlign = 'left';
        c.fillText(`GALLERY NO. 0${cutIdx + 1} / 0${totalCuts}`, 76, 724);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: 44, y: 800, maxW: W - 88, maxLines: 3, maxSize: 34, minSize: 21, color: '#18181b', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_lookbook = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        // 좌측 82% 풀높이 룩북 + 우측 18% 웜스톤 컬러 스와치 바 (좌우 비대칭 분할!)
        const pw = Math.round(W * 0.80);
        c.save(); c.beginPath(); c.rect(0, 0, pw, H); c.clip();
        inPhotoFade(c, S, cutIdx, local, 0, 0, pw, H, 1.03 + lp * 0.04, 0);
        const bg = c.createLinearGradient(0, H - 300, 0, H);
        bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(20,17,14,0.82)');
        c.fillStyle = bg; c.fillRect(0, H - 300, pw, 300);
        c.restore();
        const sx = pw + 18;
        ['#1f1b18', '#8c6239', '#c9a679', '#d6cfc2'].forEach((col, i) => {
          c.fillStyle = col; gRoundRect(c, sx, 84 + i * 42, W - sx - 18, 28, 4); c.fill();
        });
        c.save(); c.translate(pw + (W - pw) / 2, 540); c.rotate(Math.PI / 2);
        c.font = `700 12px 'JetBrains Mono', monospace`; c.fillStyle = '#57534e'; c.textAlign = 'center';
        c.fillText(`LOOKBOOK · 0${cutIdx + 1}`, 0, 0); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: 28, y: 786, maxW: pw - 44, maxLines: 3, maxSize: 36, minSize: 22, color: '#ffffff', align: 'left', shadow: 'rgba(0,0,0,0.8)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_arch = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(16,18,22,0.58)', botScrim: 'rgba(16,18,22,0.80)', botH: 320 });
        c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(32, 54); c.lineTo(W - 32, 54); c.moveTo(32, 46); c.lineTo(32, 62); c.moveTo(W - 32, 46); c.lineTo(W - 32, 62); c.stroke();
        c.font = `600 10px 'JetBrains Mono', monospace`; c.fillStyle = 'rgba(255,255,255,0.85)'; c.textAlign = 'center';
        c.fillText(`ELEVATION 1080 × 1920 · SEC 0${cutIdx + 1}`, W / 2, 40);
        c.strokeStyle = 'rgba(255,255,255,0.28)'; c.strokeRect(24, 72, W - 48, H - 104);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 780, maxW: W - 84, maxLines: 3, maxSize: 36, minSize: 22, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      // ── 장르 4: 키네틱 · 모션 타이포 (10종 — 100% 풀블리드 9:16!) ──────────
      STUDIO_100_RENDERERS.s100_kin_slam = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, accent }) => {
        const spScale = typeof arPmSpring === 'function' ? arPmSpring(local, 0.0) : mEase(local / 0.3);
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.14 - 0.10 * spScale + lp * 0.04, 0);
        const shade = c.createLinearGradient(0, H * 0.45, 0, H);
        shade.addColorStop(0, 'rgba(9,9,14,0)'); shade.addColorStop(1, 'rgba(9,9,14,0.86)');
        c.fillStyle = shade; c.fillRect(0, H * 0.45, W, H * 0.55);
        c.fillStyle = accent;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(148 * spScale, 0); c.lineTo(100 * spScale, 14); c.lineTo(0, 14); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(W, H); c.lineTo(W - 188 * spScale, H); c.lineTo(W - 140 * spScale, H - 14); c.lineTo(W, H - 14); c.closePath(); c.fill();
        if (local < 0.14) { c.fillStyle = `rgba(255,255,255,${(1 - local / 0.14) * 0.28})`; c.fillRect(0, 0, W, H); }
        c.save(); const sc = 1.24 - 0.24 * spScale; c.translate(W / 2, 520); c.scale(sc, sc);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: 0, y: 0, maxW: W * 0.84, maxLines: 3, maxSize: 44, minSize: 26, color: '#ffffff', strokeCol: '#09090d', strokeW: 8, offsetColor: accent, offsetDx: 0, offsetDy: 5, ent: 1, capHidden });
        c.restore();
      };

      STUDIO_100_RENDERERS.s100_kin_curtain = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const openW = W * ent;
        c.save(); c.beginPath(); c.rect(W / 2 - openW / 2, 0, openW, H); c.clip();
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(13,17,23,0.84)', botH: 340 });
        c.restore();
        if (ent < 0.99) { c.fillStyle = accent; c.fillRect(W / 2 - openW / 2 - 2, 0, 3, H); c.fillRect(W / 2 + openW / 2 - 1, 0, 3, H); }
        c.fillStyle = accent; c.fillRect(W / 2 - 44 * ent, 704, 88 * ent, 3);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 780, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#f8fafc', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_cyber = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(14,8,32,0.18)', botScrim: 'rgba(8,7,20,0.88)', botH: 360 });
        c.save(); c.strokeStyle = 'rgba(244,63,94,0.34)'; c.lineWidth = 1.2;
        const horizon = 720;
        for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(W / 2 + i * 28, horizon); c.lineTo(W / 2 + i * 130, H); c.stroke(); }
        const gOff = (t * 40) % 26;
        for (let y = horizon + gOff; y < H; y += 26) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        c.restore();
        c.save(); c.shadowColor = accent; c.shadowBlur = 14; c.strokeStyle = accent; c.lineWidth = 3;
        [[20, 24, 1, 1], [W - 20, 24, -1, 1], [20, H - 24, 1, -1], [W - 20, H - 24, -1, -1]].forEach(([x, y, dx, dy]) => {
          c.beginPath(); c.moveTo(x + dx * 32, y); c.lineTo(x, y); c.lineTo(x, y + dy * 32); c.stroke();
        }); c.restore();
        c.font = `700 11px 'JetBrains Mono', monospace`; c.fillStyle = '#f43f5e'; c.textAlign = 'left';
        c.fillText(`CYBER.SYS // 0${cutIdx + 1}`, 34, 52);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 760, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', shadow: accent, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_glitch = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const glitchOn = local < 0.32 || (Math.floor(t * 7) % 11 === 0);
        const jitter = glitchOn ? Math.sin(t * 85) * 10 : 0;
        inPhotoFade(c, S, cutIdx, local, jitter * 0.4, 0, W, H, 1.04 + lp * 0.04, 0);
        if (glitchOn) {
          c.fillStyle = 'rgba(34,211,238,0.20)'; c.fillRect(0, 180 + Math.abs(jitter) * 8, W, 14);
          c.fillStyle = 'rgba(244,63,94,0.22)'; c.fillRect(0, 520 - Math.abs(jitter) * 6, W, 10);
        }
        c.fillStyle = s100Pattern(c, 'scanline'); c.fillRect(0, 0, W, H);
        const vg = c.createLinearGradient(0, H * 0.56, 0, H);
        vg.addColorStop(0, 'rgba(9,9,13,0)'); vg.addColorStop(1, 'rgba(9,9,13,0.90)');
        c.fillStyle = vg; c.fillRect(0, H * 0.56, W, H * 0.44);
        c.font = `700 11px 'JetBrains Mono', monospace`; c.fillStyle = '#22d3ee'; c.textAlign = 'left';
        c.fillText(`SIG_ERR :: 0${cutIdx + 1}`, 28, 52);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', offsetColor: '#22d3ee', offsetDx: -3, offsetDy: 0, shadow: accent, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_wave = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(9,17,24,0.84)', botH: 340 });
        c.save();
        for (let i = 0; i < 4; i++) {
          const prog = (t * 0.45 + i * 0.25) % 1;
          c.strokeStyle = `rgba(52,211,153,${(1 - prog) * 0.42})`; c.lineWidth = 2.5;
          c.beginPath(); c.arc(W / 2, H * 0.44, 60 + prog * 260, 0, Math.PI * 2); c.stroke();
        }
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 38, minSize: 23, color: '#ecfdf5', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_stamp = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { pattern: 'paper', botScrim: 'rgba(26,22,18,0.84)', botH: 340 });
        const stP = mClamp((local - 0.12) / 0.24);
        if (stP > 0) {
          const stSc = 1.65 - 0.65 * (1 - Math.pow(1 - stP, 3));
          c.save(); c.translate(W - 96, 110); c.rotate(0.20); c.scale(stSc, stSc);
          c.globalAlpha = Math.min(0.95, stP * 2);
          c.strokeStyle = '#ef4444'; c.lineWidth = 4; gRoundRect(c, -62, -26, 124, 52, 8); c.stroke();
          c.fillStyle = 'rgba(239,68,68,0.16)'; c.fill();
          c.fillStyle = '#ef4444'; c.font = `900 18px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('PICK ✓', 0, 1); c.restore();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: accent, strokeCol: '#1a1612', strokeW: 6, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_iso = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(15,23,42,0.20)', botScrim: 'rgba(15,23,42,0.86)', botH: 340 });
        c.save(); c.strokeStyle = 'rgba(96,165,250,0.22)'; c.lineWidth = 1;
        for (let i = -4; i < 12; i++) {
          c.beginPath(); c.moveTo(0, i * 96); c.lineTo(W, i * 96 + W * 0.577); c.stroke();
        }
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 2.5; gRoundRect(c, 20, 24, W - 40, H - 48, 16); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 768, maxW: W * 0.84, maxLines: 3, maxSize: 38, minSize: 23, color: '#f1f5f9', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_marquee = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(13,13,16,0.82)', botH: 320 });
        const drawBand = (by, dir) => {
          c.fillStyle = accent; c.fillRect(0, by, W, 34);
          c.fillStyle = '#0d0d10'; c.font = `900 13px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
          const unit = '  ★  FEATURED STORY  ·  AUTOREELS  ';
          const uw = c.measureText(unit).width;
          const off = ((t * 75 * dir) % uw + uw) % uw;
          for (let x = -uw + off; x < W + uw; x += uw) c.fillText(unit, x, by + 17);
        };
        drawBand(28, -1); drawBand(H - 62, 1);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 760, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_liquid = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(13,15,20,0.86)', botH: 340 });
        const sh = Math.sin(t * 1.4) * 200;
        const chrome = c.createLinearGradient(sh, 0, W + sh, H);
        chrome.addColorStop(0, '#475569'); chrome.addColorStop(0.28, '#f8fafc'); chrome.addColorStop(0.52, '#64748b'); chrome.addColorStop(0.76, '#e2e8f0'); chrome.addColorStop(1, '#334155');
        c.strokeStyle = chrome; c.lineWidth = 6; gRoundRect(c, 16, 20, W - 32, H - 40, 26); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 768, maxW: W * 0.82, maxLines: 3, maxSize: 38, minSize: 23, color: '#f8fafc', shadow: 'rgba(203,213,225,0.55)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_spotlight = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(8,8,11,0.28)', botScrim: 'rgba(8,8,11,0.88)', botH: 340 });
        c.save();
        const beamX = W * 0.5 + Math.sin(t * 0.9) * 86;
        const beamG = c.createRadialGradient(beamX, 30, 12, beamX, 360, 480);
        beamG.addColorStop(0, 'rgba(253,230,138,0.38)'); beamG.addColorStop(0.5, 'rgba(253,230,138,0.10)'); beamG.addColorStop(1, 'rgba(8,8,11,0)');
        c.globalCompositeOperation = 'screen'; c.fillStyle = beamG;
        c.beginPath(); c.moveTo(W * 0.5 - 32, 0); c.lineTo(W * 0.5 + 32, 0); c.lineTo(beamX + 280, H * 0.78); c.lineTo(beamX - 280, H * 0.78); c.closePath(); c.fill();
        c.restore();
        c.fillStyle = accent; c.beginPath(); c.arc(W / 2, 34, 4.5, 0, Math.PI * 2); c.fill();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 768, maxW: W * 0.82, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(253,230,138,0.45)', ent, capHidden });
      };
    }
