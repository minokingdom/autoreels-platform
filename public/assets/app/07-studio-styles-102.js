// AutoReels — 07-studio-styles-100-b2.js
// 스타일 100종 프로젝트 Batch 2 (21~40 / 100종):
// 장르 3 에디토리얼·매거진·럭셔리 (10종) + 장르 4 키네틱·모션 타이포 (10종)

    const STUDIO_100_B2_SPECS = [
      // ── 장르 3: 에디토리얼 · 매거진 · 럭셔리 (10종) ───────────────────────
      ['s100_ed_vogue',        '하이패션 매거진',   '고급',   '#0e0d0f', '#171519', '#e5c17b', '#ffffff', 'maru',    false, 'editorial', 'luxury', '풀블리드 하이패션 커버 마스트헤드'],
      ['s100_ed_swiss',        '스위스 그리드',     '타이포', '#f4f2ec', '#eae6dc', '#e11d2a', '#141416', 'pretM',   true,  'editorial', 'urban',  '비대칭 스위스 타이포 그리드와 레드 포인트'],
      ['s100_ed_museum',       '미술관 도록',       '고급',   '#f6f4ef', '#ece8df', '#5c5346', '#1c1917', 'gowun',   true,  'editorial', 'jazz',   '여백이 살아있는 전시 도록 매트 프레임'],
      ['s100_ed_goldfoil',     '골드 포일',         '고급',   '#0b0a09', '#171410', '#e5c17b', '#faf4e6', 'maru',    false, 'editorial', 'luxury', '움직이는 금박 광택과 아르데코 프레임'],
      ['s100_ed_noir',         '다크 노아르',       '고급',   '#070709', '#111116', '#cbd5e1', '#f8fafc', 'maru',    false, 'editorial', 'cinema', '블라인드 빛줄기와 누아르 명암 프레임'],
      ['s100_ed_monochrome',   '모노크롬 하이패션',  '고급',   '#0a0a0b', '#141416', '#ffffff', '#ffffff', 'pretM',   false, 'editorial', 'luxury', '흑백 하이패션 컬렉션 인덱스 프레임'],
      ['s100_ed_brutalist',    '브루탈리즘',        '타이포', '#d9ff00', '#c4ea00', '#0d0d0f', '#0d0d0f', 'gasoek',  true,  'editorial', 'edm',    '애시드 라임과 굵은 블랙 하드 오프셋 프레임'],
      ['s100_ed_whitegallery', '화이트 갤러리',     '감성',   '#fbfbfa', '#f2f1ed', '#18181b', '#18181b', 'gowun',   true,  'editorial', 'lofi',   '순백 벽면 그림자와 작품 번호 명패'],
      ['s100_ed_lookbook',     '룩북 분할',         '고급',   '#ede8df', '#e3dbd0', '#8c6239', '#1f1b18', 'maru',    true,  'editorial', 'jazz',   '좌측 포트레이트와 우측 컬러칩 룩북'],
      ['s100_ed_arch',         '미니멀 아키텍처',    '고급',   '#e9e7e2', '#dddad2', '#3f3f46', '#18181b', 'pretM',   true,  'editorial', 'showroom','건축 도면 치수선과 슬릿 윈도우 프레임'],

      // ── 장르 4: 키네틱 · 모션 타이포 (10종) ──────────────────────────────
      ['s100_kin_slam',        '슬램 임팩트',       '타이포', '#0b0b0f', '#151520', '#ef4444', '#ffffff', 'gasoek',  false, 'kinetic',   'edm',    '강력한 스프링 슬램과 대각선 에너지 바'],
      ['s100_kin_curtain',     '커튼 리빌',         '타이포', '#0d1117', '#161b26', '#38bdf8', '#f8fafc', 'dohyeon', false, 'kinetic',   'drive',  '좌우로 열리는 시네마 커튼 리빌 모션'],
      ['s100_kin_cyber',       '네온 사이버펑크',    '테크',   '#080714', '#140c24', '#22d3ee', '#f8fafc', 'dohyeon', false, 'kinetic',   'edm',    '네온 원근 그리드와 사이버 HUD 프레임'],
      ['s100_kin_glitch',      '글리치 시그널',     '테크',   '#09090d', '#12121c', '#f43f5e', '#ffffff', 'mono',    false, 'kinetic',   'drive',  'RGB 채널 분리 글리치와 디지털 시그널'],
      ['s100_kin_wave',        '웨이브 펄스',       '타이포', '#091118', '#0e1d29', '#34d399', '#ecfdf5', 'pretM',   false, 'kinetic',   'urban',  '동심원 파동 링과 플로팅 미디어 카드'],
      ['s100_kin_stamp',       '도장 스탬프',       '특가',   '#1a1612', '#26201a', '#f59e0b', '#fffbeb', 'gasoek',  false, 'kinetic',   'funk',   '탄성으로 찍히는 승인 도장과 포스터 카드'],
      ['s100_kin_iso',         '아이소메트릭',      '테크',   '#0f172a', '#1e293b', '#60a5fa', '#f1f5f9', 'pretM',   false, 'kinetic',   'drive',  '30도 아이소메트릭 그리드와 3D 입체 레이어'],
      ['s100_kin_marquee',     '키네틱 마키',       '타이포', '#0d0d10', '#18181f', '#facc15', '#ffffff', 'dohyeon', false, 'kinetic',   'urban',  '상하 반대 방향으로 흐르는 키네틱 전광판 띠'],
      ['s100_kin_liquid',      '리퀴드 메탈',       '고급',   '#0d0f14', '#171b24', '#cbd5e1', '#f8fafc', 'maru',    false, 'kinetic',   'luxury', '흐르는 크롬 실버 광택 리본과 메탈 프레임'],
      ['s100_kin_spotlight',   '스포트라이트 빔',    '고급',   '#08080b', '#121218', '#fde68a', '#ffffff', 'maru',    false, 'kinetic',   'cinema', '무대 위 움직이는 원뿔 스포트라이트 조명']
    ];

    if (typeof s100RegisterStyles === 'function') s100RegisterStyles(STUDIO_100_B2_SPECS, 920);

    if (typeof STUDIO_100_RENDERERS !== 'undefined') {
      // ── 장르 3: 에디토리얼 · 매거진 · 럭셔리 (10종) ───────────────────────
      STUDIO_100_RENDERERS.s100_ed_vogue = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent, brandName }) => {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.03 + lp * 0.04, 0);
        const topG = c.createLinearGradient(0, 0, 0, 220);
        topG.addColorStop(0, 'rgba(10,10,12,0.72)'); topG.addColorStop(1, 'rgba(10,10,12,0)');
        c.fillStyle = topG; c.fillRect(0, 0, W, 220);
        const botG = c.createLinearGradient(0, H * 0.56, 0, H);
        botG.addColorStop(0, 'rgba(10,10,12,0)'); botG.addColorStop(1, 'rgba(10,10,12,0.82)');
        c.fillStyle = botG; c.fillRect(0, H * 0.56, W, H * 0.44);
        c.strokeStyle = 'rgba(255,255,255,0.34)'; c.lineWidth = 1; c.strokeRect(18, 22, W - 36, H - 44);
        c.save();
        c.fillStyle = '#ffffff'; c.font = `900 72px 'Song Myung', serif`; c.textAlign = 'center'; c.textBaseline = 'top';
        c.globalAlpha = ent;
        c.fillText('A U R A', W / 2, 34);
        c.font = `600 10px 'JetBrains Mono', monospace`; c.fillStyle = accent;
        c.fillText(`EDITORIAL COLLECTION · ISSUE 0${cutIdx + 1}`, W / 2, 114);
        c.restore();
        // 좌우 매거진 서브 커버라인
        c.save();
        c.font = `600 10px Pretendard, sans-serif`; c.fillStyle = 'rgba(255,255,255,0.78)';
        c.textAlign = 'left'; c.fillText('CURATED', 30, 250); c.fillText(String(brandName).slice(0, 12).toUpperCase(), 30, 266);
        c.textAlign = 'right'; c.fillText('HIGH EDITION', W - 30, 250); c.fillText('SEASON 26', W - 30, 266);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 784, maxW: W * 0.80, maxLines: 3, maxSize: 34, minSize: 21, color: '#ffffff', shadow: 'rgba(0,0,0,0.65)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_swiss = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, ent, accent }) => {
        const pad = 28;
        c.strokeStyle = 'rgba(20,20,22,0.12)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(W * 0.34, 0); c.lineTo(W * 0.34, H); c.moveTo(0, 140); c.lineTo(W, 140); c.moveTo(0, 686); c.lineTo(W, 686); c.stroke();
        // 좌측 상단 초대형 인덱스 넘버
        c.fillStyle = accent; c.fillRect(pad, 36, 18, 18);
        c.fillStyle = '#141416'; c.font = `900 68px Pretendard, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'top';
        c.fillText(`0${cutIdx + 1}`, pad + 26, 36);
        c.font = `700 11px 'JetBrains Mono', monospace`; c.fillStyle = '#52525b'; c.textAlign = 'right';
        c.fillText(`SWISS GRID / 0${cutIdx + 1} OF 0${totalCuts}`, W - pad, 56);
        c.fillStyle = accent; c.fillRect(pad, 136, (W - pad * 2) * ent, 4);
        // 비대칭 사진 그리드 셀
        const px = pad, py = 158, pw = W - pad * 2, ph = 510;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.fillStyle = '#141416'; c.fillRect(px, py + ph - 6, 68, 6);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: pad, y: 786, maxW: W - pad * 2, maxLines: 3, maxSize: 33, minSize: 20, color: '#141416', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_museum = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, rem, accent, brandName }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        const mx = 52, my = 112 + rem * 14, mw = W - 104, mh = 516;
        c.save();
        c.shadowColor = 'rgba(28,25,23,0.14)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
        c.fillStyle = '#ffffff'; c.fillRect(mx - 14, my - 14, mw + 28, mh + 28);
        c.restore();
        c.strokeStyle = 'rgba(92,83,70,0.28)'; c.lineWidth = 1; c.strokeRect(mx - 14, my - 14, mw + 28, mh + 28);
        c.save(); c.beginPath(); c.rect(mx, my, mw, mh); c.clip();
        inPhotoFade(c, S, cutIdx, local, mx, my, mw, mh, 1.02 + lp * 0.035, 0);
        c.restore();
        c.font = `600 10.5px 'JetBrains Mono', monospace`; c.fillStyle = accent; c.textAlign = 'center';
        c.fillText(`EXHIBITION ARCHIVE · PLATE 0${cutIdx + 1}`, W / 2, 74);
        c.fillStyle = 'rgba(92,83,70,0.45)'; c.fillRect(W / 2 - 22, 676, 44, 1.2);
        c.font = `500 10.5px 'Gowun Batang', serif`; c.fillStyle = 'rgba(92,83,70,0.75)';
        c.fillText(String(brandName).slice(0, 18), W / 2, H - 56);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 762, maxW: W * 0.78, maxLines: 3, maxSize: 30, minSize: 19, color: '#1c1917', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_goldfoil = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 42, py = 104, pw = W - 84, ph = 548;
        // 움직이는 금박 사선 그라데이션
        const shift = Math.sin(t * 1.1) * 180;
        const gold = c.createLinearGradient(px + shift, py, px + pw + shift, py + ph);
        gold.addColorStop(0, '#8a6420'); gold.addColorStop(0.32, '#f6dfa1'); gold.addColorStop(0.55, '#a87d2e'); gold.addColorStop(0.82, '#fce9b5'); gold.addColorStop(1, '#7d5a1c');
        c.strokeStyle = gold; c.lineWidth = 2; c.strokeRect(20, 24, W - 40, H - 48);
        c.lineWidth = 1; c.strokeRect(27, 31, W - 54, H - 62);
        // 아르데코 4코너 다이아 장식
        [[27, 31], [W - 27, 31], [27, H - 31], [W - 27, H - 31]].forEach(([cx, cy]) => {
          c.save(); c.translate(cx, cy); c.rotate(Math.PI / 4); c.fillStyle = accent; c.fillRect(-5, -5, 10, 10); c.restore();
        });
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = gold; c.lineWidth = 2.5; c.strokeRect(px, py, pw, ph);
        c.font = `600 11px 'JetBrains Mono', monospace`; c.fillStyle = accent; c.textAlign = 'center';
        c.fillText(`✦  GOLD EDITION  ·  0${cutIdx + 1}  ✦`, W / 2, 72);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 760, maxW: W * 0.78, maxLines: 3, maxSize: 32, minSize: 20, color: '#faf4e6', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_noir = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.04 + lp * 0.04, 0);
        // 어두운 누아르 톤 + 블라인드 대각선 빛줄기
        c.fillStyle = 'rgba(7,7,10,0.34)'; c.fillRect(0, 0, W, H);
        c.save();
        c.globalAlpha = 0.16;
        c.fillStyle = '#e2e8f0';
        const drift = Math.sin(t * 0.6) * 14;
        for (let i = -2; i < 8; i++) {
          c.beginPath();
          c.moveTo(0, i * 115 + drift); c.lineTo(W, i * 115 - 140 + drift);
          c.lineTo(W, i * 115 - 105 + drift); c.lineTo(0, i * 115 + 35 + drift);
          c.closePath(); c.fill();
        }
        c.restore();
        const vg = c.createLinearGradient(0, H * 0.55, 0, H);
        vg.addColorStop(0, 'rgba(7,7,10,0)'); vg.addColorStop(1, 'rgba(7,7,10,0.88)');
        c.fillStyle = vg; c.fillRect(0, H * 0.55, W, H * 0.45);
        c.fillStyle = accent; c.fillRect(36, 712, 3, 98 * ent);
        c.font = `600 10.5px 'JetBrains Mono', monospace`; c.fillStyle = 'rgba(203,213,225,0.72)'; c.textAlign = 'left';
        c.fillText(`NOIR ARCHIVE // 0${cutIdx + 1}`, 36, 62);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: 52, y: 760, maxW: W - 92, maxLines: 3, maxSize: 32, minSize: 20, color: '#f8fafc', align: 'left', shadow: 'rgba(0,0,0,0.75)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_monochrome = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        c.fillStyle = '#0a0a0b'; c.fillRect(0, 0, W, H);
        const px = 32, py = 110, pw = W - 64, ph = 568;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(12,12,15,0.16)'; c.fillRect(px, py, pw, ph);
        c.restore();
        c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.strokeRect(px, py, pw, ph);
        c.fillStyle = '#ffffff'; c.font = `700 12px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`M O N O C H R O M E   ·   0 ${cutIdx + 1}`, W / 2, 68);
        c.fillRect(W / 2 - 18, 86, 36 * ent, 2);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 786, maxW: W * 0.80, maxLines: 3, maxSize: 32, minSize: 20, color: '#ffffff', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_brutalist = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        const px = 32, py = 104, pw = W - 64, ph = 528;
        // 하드 오프셋 블랙 그림자
        c.fillStyle = '#0d0d0f'; c.fillRect(px + 10, py + 10, pw, ph);
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#0d0d0f'; c.lineWidth = 4; c.strokeRect(px, py, pw, ph);
        // 상단 브루탈리즘 태그 블록
        c.fillStyle = '#0d0d0f'; c.fillRect(px, 42, 162, 38);
        c.fillStyle = '#d9ff00'; c.font = `900 15px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`RAW // 0${cutIdx + 1}`, px + 14, 61);
        c.strokeStyle = '#0d0d0f'; c.lineWidth = 3; c.strokeRect(W - px - 92, 42, 92, 38);
        c.fillStyle = '#0d0d0f'; c.textAlign = 'center'; c.fillText('2026', W - px - 46, 61);
        // 하단 하드박스 자막
        if (caption && !capHidden) {
          c.fillStyle = '#0d0d0f'; c.fillRect(px + 8, 672 + 8, pw, 168);
          c.fillStyle = '#ffffff'; c.fillRect(px, 672, pw, 168);
          c.strokeStyle = '#0d0d0f'; c.lineWidth = 4; c.strokeRect(px, 672, pw, 168);
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 756, maxW: pw - 32, maxLines: 3, maxSize: 33, minSize: 20, color: '#0d0d0f', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_ed_whitegallery = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, ent, rem }) => {
        const px = 48, py = 102 + rem * 12, pw = W - 96, ph = 548;
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.16)'; c.shadowBlur = 32; c.shadowOffsetY = 16;
        c.fillStyle = '#ffffff'; c.fillRect(px, py, pw, ph);
        c.restore();
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.02 + lp * 0.035, 0);
        c.restore();
        // 갤러리 벽면 작품 명패 (좌하단)
        c.fillStyle = '#18181b'; c.fillRect(48, 692, 24 * ent, 2);
        c.font = `600 10.5px 'JetBrains Mono', monospace`; c.fillStyle = '#71717a'; c.textAlign = 'left';
        c.fillText(`GALLERY NO. 0${cutIdx + 1} / 0${totalCuts}`, 80, 696);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: 48, y: 774, maxW: W - 96, maxLines: 3, maxSize: 30, minSize: 19, color: '#18181b', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_lookbook = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        // 좌측 72% 메인 룩북 사진
        const px = 26, py = 76, pw = 368, ph = 602;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 우측 컬러 스와치 & 세로 시즌 코드 사이드바
        const sx = 414;
        const swatches = ['#1f1b18', '#8c6239', '#c9a679', '#d6cfc2'];
        swatches.forEach((col, i) => {
          c.fillStyle = col; gRoundRect(c, sx, 84 + i * 38, 96, 26, 4); c.fill();
        });
        c.save();
        c.translate(sx + 48, 430); c.rotate(Math.PI / 2);
        c.font = `700 12px 'JetBrains Mono', monospace`; c.fillStyle = '#57534e'; c.textAlign = 'center';
        c.fillText(`LOOKBOOK SERIES · 0${cutIdx + 1}`, 0, 0);
        c.restore();
        c.fillStyle = accent; c.fillRect(px, 696, (W - 52) * ent, 2);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: px, y: 786, maxW: W - 52, maxLines: 3, maxSize: 32, minSize: 20, color: '#1f1b18', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_ed_arch = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        // 미세 건축 치수 가이드선
        c.strokeStyle = 'rgba(24,24,27,0.14)'; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(46, 56); c.lineTo(W - 46, 56);
        c.moveTo(46, 48); c.lineTo(46, 64);
        c.moveTo(W - 46, 48); c.lineTo(W - 46, 64);
        c.stroke();
        c.font = `600 10px 'JetBrains Mono', monospace`; c.fillStyle = '#52525b'; c.textAlign = 'center';
        c.fillText(`ELEVATION 1080 × 1920 · SEC 0${cutIdx + 1}`, W / 2, 44);
        // 슬릿 윈도우 사진 프레임 + 기하학적 그림자 플린스
        const px = 46, py = 84, pw = W - 92, ph = 582;
        c.fillStyle = 'rgba(24,24,27,0.12)'; c.fillRect(px + 12, py + 12, pw, ph);
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#18181b'; c.lineWidth = 1.5; c.strokeRect(px, py, pw, ph);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 782, maxW: W - 92, maxLines: 3, maxSize: 31, minSize: 20, color: '#18181b', ent, capHidden });
      };

      // ── 장르 4: 키네틱 · 모션 타이포 (10종) ──────────────────────────────
      STUDIO_100_RENDERERS.s100_kin_slam = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, accent }) => {
        const spScale = typeof arPmSpring === 'function' ? arPmSpring(local, 0.0) : mEase(local / 0.3);
        const zoom = 1.14 - 0.10 * spScale + lp * 0.04;
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, zoom, 0);
        const shade = c.createLinearGradient(0, H * 0.48, 0, H);
        shade.addColorStop(0, 'rgba(9,9,14,0)'); shade.addColorStop(1, 'rgba(9,9,14,0.88)');
        c.fillStyle = shade; c.fillRect(0, H * 0.48, W, H * 0.52);
        // 상단·하단 대각선 에너지 바
        c.fillStyle = accent;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(140 * spScale, 0); c.lineTo(95 * spScale, 14); c.lineTo(0, 14); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(W, H); c.lineTo(W - 180 * spScale, H); c.lineTo(W - 135 * spScale, H - 14); c.lineTo(W, H - 14); c.closePath(); c.fill();
        if (local < 0.14) {
          c.fillStyle = `rgba(255,255,255,${(1 - local / 0.14) * 0.28})`; c.fillRect(0, 0, W, H);
        }
        c.save();
        const sc = 1.24 - 0.24 * spScale;
        c.translate(W / 2, 756); c.scale(sc, sc);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: 0, y: 0, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', strokeCol: '#09090d', strokeW: 7, offsetColor: accent, offsetDx: 0, offsetDy: 5, ent: 1, capHidden });
        c.restore();
      };

      STUDIO_100_RENDERERS.s100_kin_curtain = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 26, py = 74, pw = W - 52, ph = 606;
        c.save();
        const openW = pw * ent;
        c.beginPath(); c.rect(W / 2 - openW / 2, py, openW, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.04 + lp * 0.04, 0);
        c.restore();
        // 커튼 경계 빛줄기
        if (ent < 0.99) {
          c.fillStyle = accent;
          c.fillRect(W / 2 - openW / 2 - 2, py, 3, ph);
          c.fillRect(W / 2 + openW / 2 - 1, py, 3, ph);
        }
        c.strokeStyle = 'rgba(56,189,248,0.45)'; c.lineWidth = 1.5; c.strokeRect(px, py, pw, ph);
        c.fillStyle = accent; c.fillRect(W / 2 - 42 * ent, 706, 84 * ent, 3);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 786, maxW: W * 0.82, maxLines: 3, maxSize: 35, minSize: 22, color: '#f8fafc', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_cyber = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 하단 네온 원근 플로어 그리드
        c.save();
        c.strokeStyle = 'rgba(244,63,94,0.28)'; c.lineWidth = 1.2;
        const horizon = 680;
        for (let i = -6; i <= 6; i++) {
          c.beginPath(); c.moveTo(W / 2 + i * 28, horizon); c.lineTo(W / 2 + i * 130, H); c.stroke();
        }
        const gOff = (t * 40) % 28;
        for (let y = horizon + gOff; y < H; y += 28) {
          c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
        }
        c.restore();
        const px = 34, py = 86, pw = W - 68, ph = 568;
        c.save(); gRoundRect(c, px, py, pw, ph, 14); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 네온 코너 브래킷
        c.save();
        c.shadowColor = accent; c.shadowBlur = 14; c.strokeStyle = accent; c.lineWidth = 3;
        [[px, py, 1, 1], [px + pw, py, -1, 1], [px, py + ph, 1, -1], [px + pw, py + ph, -1, -1]].forEach(([x, y, dx, dy]) => {
          c.beginPath(); c.moveTo(x + dx * 28, y); c.lineTo(x, y); c.lineTo(x, y + dy * 28); c.stroke();
        });
        c.restore();
        c.font = `700 11px 'JetBrains Mono', monospace`; c.fillStyle = '#f43f5e'; c.textAlign = 'left';
        c.fillText(`CYBER.SYS // 0${cutIdx + 1}`, px, 58);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 766, maxW: W * 0.82, maxLines: 3, maxSize: 35, minSize: 22, color: '#ffffff', shadow: accent, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_glitch = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const glitchOn = local < 0.32 || (Math.floor(t * 7) % 11 === 0);
        const jitter = glitchOn ? Math.sin(t * 85) * 10 : 0;
        inPhotoFade(c, S, cutIdx, local, jitter * 0.4, 0, W, H, 1.04 + lp * 0.04, 0);
        if (glitchOn) {
          c.fillStyle = 'rgba(34,211,238,0.18)'; c.fillRect(0, 180 + Math.abs(jitter) * 8, W, 14);
          c.fillStyle = 'rgba(244,63,94,0.20)'; c.fillRect(0, 520 - Math.abs(jitter) * 6, W, 10);
        }
        c.fillStyle = s100Pattern(c, 'scanline'); c.fillRect(0, 0, W, H);
        const vg = c.createLinearGradient(0, H * 0.56, 0, H);
        vg.addColorStop(0, 'rgba(9,9,13,0)'); vg.addColorStop(1, 'rgba(9,9,13,0.90)');
        c.fillStyle = vg; c.fillRect(0, H * 0.56, W, H * 0.44);
        c.font = `700 11px 'JetBrains Mono', monospace`; c.fillStyle = '#22d3ee'; c.textAlign = 'left';
        c.fillText(`SIG_ERR :: 0${cutIdx + 1}`, 28, 56);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 768, maxW: W * 0.84, maxLines: 3, maxSize: 36, minSize: 22, color: '#ffffff', offsetColor: '#22d3ee', offsetDx: -3, offsetDy: 0, shadow: accent, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_wave = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 동심원 파동 링
        c.save();
        for (let i = 0; i < 4; i++) {
          const prog = (t * 0.45 + i * 0.25) % 1;
          c.strokeStyle = `rgba(52,211,153,${(1 - prog) * 0.32})`;
          c.lineWidth = 2;
          c.beginPath(); c.arc(W / 2, 376, 120 + prog * 240, 0, Math.PI * 2); c.stroke();
        }
        c.restore();
        const px = 44, py = 96, pw = W - 88, ph = 552;
        c.save();
        c.shadowColor = 'rgba(52,211,153,0.25)'; c.shadowBlur = 28;
        gRoundRect(c, px, py, pw, ph, 26); c.fillStyle = '#0e1d29'; c.fill();
        c.restore();
        c.save(); gRoundRect(c, px, py, pw, ph, 26); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = 'rgba(52,211,153,0.55)'; c.lineWidth = 2; gRoundRect(c, px, py, pw, ph, 26); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 762, maxW: W * 0.82, maxLines: 3, maxSize: 33, minSize: 21, color: '#ecfdf5', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_stamp = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        const px = 38, py = 96, pw = W - 76, ph = 544;
        c.save();
        c.translate(W / 2, py + ph / 2); c.rotate((cutIdx % 2 ? 1 : -1) * 0.018);
        c.fillStyle = '#fffbeb'; c.fillRect(-pw / 2 - 8, -ph / 2 - 8, pw + 16, ph + 16);
        c.beginPath(); c.rect(-pw / 2, -ph / 2, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, -pw / 2, -ph / 2, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 탄성으로 쾅 찍히는 도장 스탬프
        const stP = mClamp((local - 0.12) / 0.24);
        if (stP > 0) {
          const stSc = 1.65 - 0.65 * (1 - Math.pow(1 - stP, 3));
          c.save();
          c.translate(W - 104, 152); c.rotate(0.22); c.scale(stSc, stSc);
          c.globalAlpha = Math.min(0.92, stP * 2);
          c.strokeStyle = '#ef4444'; c.lineWidth = 4;
          gRoundRect(c, -62, -26, 124, 52, 8); c.stroke();
          c.lineWidth = 1.5; gRoundRect(c, -56, -20, 112, 40, 5); c.stroke();
          c.fillStyle = '#ef4444'; c.font = `900 18px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('PICK ✓', 0, 1);
          c.restore();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 760, maxW: W * 0.82, maxLines: 3, maxSize: 35, minSize: 22, color: accent, shadow: 'rgba(0,0,0,0.65)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_iso = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 30도 아이소메트릭 배경 그리드
        c.save();
        c.strokeStyle = 'rgba(96,165,250,0.14)'; c.lineWidth = 1;
        for (let i = -10; i < 18; i++) {
          c.beginPath(); c.moveTo(0, i * 64); c.lineTo(W, i * 64 + W * 0.577); c.stroke();
          c.beginPath(); c.moveTo(W, i * 64); c.lineTo(0, i * 64 + W * 0.577); c.stroke();
        }
        c.restore();
        const px = 42, py = 92, pw = W - 98, ph = 544;
        // 3D 적층 깊이 플레이트
        c.fillStyle = 'rgba(96,165,250,0.22)'; gRoundRect(c, px + 22, py + 22, pw, ph, 16); c.fill();
        c.fillStyle = 'rgba(59,130,246,0.45)'; gRoundRect(c, px + 11, py + 11, pw, ph, 16); c.fill();
        c.save(); gRoundRect(c, px, py, pw, ph, 16); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 2; gRoundRect(c, px, py, pw, ph, 16); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 768, maxW: W * 0.82, maxLines: 3, maxSize: 33, minSize: 20, color: '#f1f5f9', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_marquee = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 28, py = 96, pw = W - 56, ph = 568;
        c.save(); gRoundRect(c, px, py, pw, ph, 16); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 상단·하단 반대 방향 무한 스크롤 키네틱 마키 띠
        const drawBand = (by, dir) => {
          c.fillStyle = accent; c.fillRect(0, by, W, 34);
          c.fillStyle = '#0d0d10'; c.font = `900 13px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
          const unit = '  ★  FEATURED STORY  ·  AUTOREELS  ';
          const uw = c.measureText(unit).width;
          const off = ((t * 75 * dir) % uw + uw) % uw;
          for (let x = -uw + off; x < W + uw; x += uw) c.fillText(unit, x, by + 17);
        };
        drawBand(36, -1);
        drawBand(H - 64, 1);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 774, maxW: W * 0.84, maxLines: 3, maxSize: 35, minSize: 22, color: '#ffffff', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_liquid = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        const px = 38, py = 98, pw = W - 76, ph = 556;
        // 흐르는 크롬 리퀴드 메탈 그라데이션 테두리
        const sh = Math.sin(t * 1.4) * 200;
        const chrome = c.createLinearGradient(px + sh, py, px + pw + sh, py + ph);
        chrome.addColorStop(0, '#475569'); chrome.addColorStop(0.28, '#f8fafc'); chrome.addColorStop(0.52, '#64748b'); chrome.addColorStop(0.76, '#e2e8f0'); chrome.addColorStop(1, '#334155');
        c.save();
        c.shadowColor = 'rgba(226,232,240,0.22)'; c.shadowBlur = 24;
        gRoundRect(c, px - 5, py - 5, pw + 10, ph + 10, 28); c.fillStyle = chrome; c.fill();
        c.restore();
        c.save(); gRoundRect(c, px, py, pw, ph, 24); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.fillStyle = chrome; gRoundRect(c, W / 2 - 48, 52, 96, 4, 2); c.fill();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 772, maxW: W * 0.82, maxLines: 3, maxSize: 33, minSize: 21, color: '#f8fafc', shadow: 'rgba(203,213,225,0.45)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_kin_spotlight = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 36, py = 94, pw = W - 72, ph = 556;
        c.save(); gRoundRect(c, px, py, pw, ph, 18); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 상단에서 무대 위로 비추는 원뿔 스포트라이트 빔
        c.save();
        const beamX = W * 0.5 + Math.sin(t * 0.9) * 76;
        const beamG = c.createRadialGradient(beamX, 40, 12, beamX, 340, 420);
        beamG.addColorStop(0, 'rgba(253,230,138,0.34)');
        beamG.addColorStop(0.5, 'rgba(253,230,138,0.10)');
        beamG.addColorStop(1, 'rgba(8,8,11,0)');
        c.globalCompositeOperation = 'screen';
        c.fillStyle = beamG;
        c.beginPath(); c.moveTo(W * 0.5 - 32, 0); c.lineTo(W * 0.5 + 32, 0); c.lineTo(beamX + 260, H * 0.72); c.lineTo(beamX - 260, H * 0.72); c.closePath(); c.fill();
        c.restore();
        c.strokeStyle = 'rgba(253,230,138,0.35)'; c.lineWidth = 1.5; gRoundRect(c, px, py, pw, ph, 18); c.stroke();
        c.fillStyle = accent; c.beginPath(); c.arc(W / 2, 42, 4, 0, Math.PI * 2); c.fill();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 768, maxW: W * 0.82, maxLines: 3, maxSize: 33, minSize: 21, color: '#ffffff', shadow: 'rgba(253,230,138,0.35)', ent, capHidden });
      };
    }
