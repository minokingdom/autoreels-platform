// AutoReels — 07-studio-styles-103.js
// 스타일 100종 프로젝트 Batch 3 (41~60 / 100종 — 풀블리드 9:16 업그레이드):
// 장르 5 방송·뉴스·예능·유튜브 (10종) + 장르 6 게임·픽셀·만화 (10종)

    const STUDIO_100_B3_SPECS = [
      ['s100_tv_breaking',    '속보 뉴스 티커',    '뉴스·방송', '#0b1020', '#121b33', '#dc2626', '#ffffff', 'dohyeon', false, 'broadcast', 'news',     'LIVE 속보 배지와 하단 스크롤 뉴스 티커'],
      ['s100_tv_variety',     '예능 자막 팝',      '재미',     '#11131a', '#1d1f2b', '#facc15', '#ffffff', 'gasoek',  false, 'broadcast', 'funk',     '통통 튀는 예능 스티커와 굵은 2중 테두리 자막'],
      ['s100_tv_docu_nar',    '다큐 나레이션',     '뉴스·방송', '#0d0e12', '#171920', '#d4af37', '#f4f4f5', 'gowun',   false, 'broadcast', 'cinema',   '방송 스페셜 워터마크와 골드라인 나레이션 바'],
      ['s100_tv_podcast',     '팟캐스트 파형',     '상담·정보', '#0f121a', '#181e2c', '#38bdf8', '#f8fafc', 'pretM',   false, 'broadcast', 'lofi',     '풀화면 실시간 24채널 오디오 파형 스튜디오'],
      ['s100_tv_sports',      '스포츠 스코어보드',  '스포츠',    '#091326', '#102140', '#a3e635', '#ffffff', 'gasoek',  false, 'broadcast', 'edm',      '라이브 스코어보드 HUD와 사선 스피드 스트라이프'],
      ['s100_tv_finance',     '금융 브리핑',       '상담·정보', '#08101e', '#0f1d36', '#10b981', '#ecfdf5', 'pretM',   false, 'broadcast', 'news',     '풀화면 실시간 상승 차트와 경제 브리핑 바'],
      ['s100_tv_interview',   '인터뷰 하단 바',    '신뢰',     '#0d1017', '#161b26', '#6366f1', '#ffffff', 'pretM',   false, 'broadcast', 'showroom', '깔끔한 인터뷰 화자 하단 바와 인디고 포인트'],
      ['s100_tv_top5',        '랭킹 TOP5',        '재미',     '#120f17', '#21192b', '#f59e0b', '#ffffff', 'gasoek',  false, 'broadcast', 'urban',    '풀화면 메탈릭 골드 순위 배지 카운트다운'],
      ['s100_tv_review',      '한줄 리뷰 카드',    '신뢰',     '#14151a', '#1d1f27', '#facc15', '#ffffff', 'pretM',   false, 'broadcast', 'bright',   '풀화면 사진 위에 올린 한줄 리뷰'],
      ['s100_tv_qa',          'Q&A 말풍선',       '상담·정보', '#0f172a', '#1e293b', '#38bdf8', '#0f172a', 'jua',     false, 'broadcast', 'bright',   '풀화면 상단 질문 배지와 하단 화이트 말풍선'],

      ['s100_gm_rpg',         '16비트 픽셀 RPG',   '재미',     '#0c1026', '#161d40', '#facc15', '#ffffff', 'mono',    false, 'game',      'funk',     '풀화면 HP 상태바와 클래식 RPG 대화창'],
      ['s100_gm_arcade',      '아케이드 HUD',      '재미',     '#0a0818', '#171033', '#22d3ee', '#fde047', 'mono',    false, 'game',      'edm',      '풀화면 1UP 하이스코어와 하트 라이프 오락실'],
      ['s100_gm_manga',       '흑백 만화 컷',      '재미',     '#f6f4ee', '#eae6dc', '#111111', '#111111', 'dohyeon', true,  'game',      'urban',    '풀화면 만화 집중선과 효과음 배지'],
      ['s100_gm_webtoon',     '웹툰 말풍선',       '재미',     '#ffffff', '#f4f4f6', '#18181b', '#18181b', 'jua',     true,  'game',      'bright',   '풀화면 웹툰 잉크 프레임과 대화 말풍선'],
      ['s100_gm_gameboy',     '레트로 게임보이',    '재미',     '#c4c8b8', '#b0b5a2', '#306230', '#0f380f', 'mono',    true,  'game',      'funk',     '올리브그린 도트매트릭스 휴대용 게임기 베젤'],
      ['s100_gm_popart',      '팝아트 하프톤',     '재미',     '#fde047', '#facc15', '#ef4444', '#ffffff', 'gasoek',  false, 'game',      'funk',     '풀화면 팝아트 하프톤과 원색 코믹 테두리'],
      ['s100_gm_stickerbook', '스티커북 콜라주',    '재미',     '#fdf2f8', '#fce7f3', '#ec4899', '#3b1c32', 'jua',     true,  'game',      'bright',   '기울어진 칼선 스티커 프레임과 별·하트 데코'],
      ['s100_gm_toyblock',    '3D 토이 블록',      '재미',     '#eff6ff', '#dbeafe', '#ef4444', '#ffffff', 'jua',     false, 'game',      'bright',   '풀화면 원색 브릭 스터드 레일 오버레이'],
      ['s100_gm_terminal',    '사이버 터미널',     '테크',     '#070c0a', '#0c1612', '#22c55e', '#86efac', 'mono',    false, 'game',      'drive',    '풀화면 개발자 콘솔 타이틀바와 프롬프트 커서'],
      ['s100_gm_tcg',         '트레이딩 카드',     '재미',     '#1e1b4b', '#312e81', '#fbbf24', '#fef3c7', 'dohyeon', false, 'game',      'edm',      '풀화면 홀로그램 레어 카드와 스탯 바']
    ];

    if (typeof s100RegisterStyles === 'function') s100RegisterStyles(STUDIO_100_B3_SPECS, 940);

    if (typeof STUDIO_100_RENDERERS !== 'undefined') {
      STUDIO_100_RENDERERS.s100_tv_breaking = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent, brandName }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(11,16,32,0.82)', botH: 300 });
        c.fillStyle = accent; gRoundRect(c, 22, 34, 96, 30, 5); c.fill();
        if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(38, 49, 4.5, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#ffffff'; c.font = `900 13px Pretendard, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('LIVE 속보', 49, 50);
        c.fillStyle = 'rgba(11,16,32,0.82)'; gRoundRect(c, W - 104, 34, 82, 30, 5); c.fill();
        c.fillStyle = '#e2e8f0'; c.font = `700 12px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        const now = new Date();
        c.fillText(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, W - 63, 49);
        if (caption && !capHidden) {
          c.fillStyle = accent; c.fillRect(22, 686, 114 * ent, 28);
          c.fillStyle = '#ffffff'; c.font = `900 12px Pretendard, sans-serif`; c.textAlign = 'center';
          c.fillText('BREAKING', 22 + 57 * ent, 700);
          c.fillStyle = 'rgba(11,16,32,0.90)'; c.fillRect(22, 714, W - 44, 126);
          c.fillStyle = accent; c.fillRect(22, 714, 5, 126);
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: 40, y: 777, maxW: W - 82, maxLines: 3, maxSize: 34, minSize: 21, color: '#ffffff', align: 'left', ent, capHidden });
        }
        c.fillStyle = '#0f172a'; c.fillRect(0, H - 52, W, 32);
        c.fillStyle = accent; c.fillRect(0, H - 52, 72, 32);
        c.fillStyle = '#ffffff'; c.font = `800 11.5px Pretendard, sans-serif`; c.textAlign = 'center'; c.fillText('NEWS', 36, H - 36);
        c.save(); c.beginPath(); c.rect(72, H - 52, W - 72, 32); c.clip();
        c.fillStyle = '#e2e8f0'; c.font = `600 12px Pretendard, sans-serif`; c.textAlign = 'left';
        const msg = `   ●  ${brandName ? brandName + ' 특별 브리핑   ●  ' : ''}지금 주목해야 할 핵심 포인트   ●  SCENE 0${cutIdx + 1}   `;
        const mw = c.measureText(msg).width;
        const off = ((t * 68) % mw + mw) % mw;
        for (let x = 72 - off; x < W + mw; x += mw) c.fillText(msg, x, H - 36);
        c.restore();
      };

      STUDIO_100_RENDERERS.s100_tv_variety = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(12,14,22,0.74)', botH: 340 });
        const pop = 1;
        c.save(); c.translate(W - 96, 66); c.rotate(0.08); c.scale(pop * ent, pop * ent);
        gRoundRect(c, -74, -22, 148, 44, 22); c.fillStyle = '#ec4899'; c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.stroke();
        c.fillStyle = '#ffffff'; c.font = `900 14px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`★ 주목 포인트 ${cutIdx + 1}`, 0, 1); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 764, maxW: W * 0.86, maxLines: 3, maxSize: 42, minSize: 25, color: accent, strokeCol: '#1e1b4b', strokeW: 9, offsetColor: '#ec4899', offsetDx: 0, offsetDy: 5, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_docu_nar = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(10,12,16,0.88)', botH: 340 });
        c.fillStyle = 'rgba(255,255,255,0.68)'; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'right';
        c.fillText('SPECIAL DOCU', W - 28, 52);
        c.fillStyle = accent; c.fillRect(W - 82, 60, 54, 1.5);
        if (caption && !capHidden) {
          c.fillStyle = accent; c.fillRect(34, 736, 3, 72 * ent);
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: 50, y: 772, maxW: W - 88, maxLines: 3, maxSize: 34, minSize: 21, color: '#f4f4f5', align: 'left', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_tv_podcast = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(15,18,26,0.68)', botScrim: 'rgba(15,18,26,0.88)', botH: 380 });
        gRoundRect(c, W / 2 - 74, 38, 148, 30, 15); c.fillStyle = 'rgba(15,18,26,0.78)'; c.fill();
        c.strokeStyle = 'rgba(239,68,68,0.65)'; c.lineWidth = 1.4; c.stroke();
        c.fillStyle = '#ef4444'; c.beginPath(); c.arc(W / 2 - 48, 53, 4.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#f8fafc'; c.font = `700 11.5px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`ON AIR · EP.0${cutIdx + 1}`, W / 2 + 6, 53);
        // 하단 실시간 24채널 오디오 이퀄라이저 파형
        const bars = 24, bw = 8, gap = 8, totalW = bars * bw + (bars - 1) * gap, sx = (W - totalW) / 2;
        for (let i = 0; i < bars; i++) {
          const h = 10 + Math.abs(Math.sin(t * 5.2 + i * 0.65) * Math.cos(t * 2.3 + i * 0.3)) * 46;
          c.fillStyle = i % 3 === 0 ? accent : 'rgba(248,250,252,0.72)';
          gRoundRect(c, sx + i * (bw + gap), 864 - h / 2, bw, h, 4); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 742, maxW: W * 0.84, maxLines: 3, maxSize: 36, minSize: 22, color: '#f8fafc', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_sports = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { zoom: 1.05, botScrim: 'rgba(9,19,38,0.88)', botH: 340 });
        gRoundRect(c, 22, 34, 242, 36, 8); c.fillStyle = 'rgba(9,19,38,0.88)'; c.fill();
        c.fillStyle = accent; gRoundRect(c, 22, 34, 62, 36, 8); c.fill();
        c.fillStyle = '#091326'; c.font = `900 12px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('LIVE', 53, 52);
        c.fillStyle = '#ffffff'; c.textAlign = 'left';
        c.fillText(`Q${cutIdx + 1}  ·  ${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * 60)).padStart(2, '0')}`, 96, 52);
        c.fillStyle = accent;
        for (let i = 0; i < 3; i++) {
          c.beginPath(); c.moveTo(W - 84 + i * 20, 34); c.lineTo(W - 72 + i * 20, 34); c.lineTo(W - 86 + i * 20, 70); c.lineTo(W - 98 + i * 20, 70); c.closePath(); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', strokeCol: '#091326', strokeW: 6, offsetColor: accent, offsetDx: 3, offsetDy: 3, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_finance = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(8,16,30,0.78)', botScrim: 'rgba(8,16,30,0.90)', botH: 360 });
        c.fillStyle = 'rgba(15,29,54,0.88)'; c.fillRect(0, 28, W, 34);
        c.fillStyle = accent; c.font = `700 11.5px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`MARKET BRIEF  ▲ +12.4%   ·   INDEX 0${cutIdx + 1}`, 24, 45);
        c.save(); c.strokeStyle = accent; c.lineWidth = 2.6; c.beginPath();
        for (let i = 0; i <= 14; i++) {
          const gx = 28 + (W - 56) * (i / 14), gy = 876 - (i / 14) * 38 - Math.sin(t * 2 + i * 0.8) * 6;
          if (i === 0) c.moveTo(gx, gy); else c.lineTo(gx, gy);
        }
        c.stroke(); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: 28, y: 748, maxW: W - 56, maxLines: 3, maxSize: 36, minSize: 22, color: '#ecfdf5', align: 'left', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_interview = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent, brandName }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(13,16,23,0.88)', botH: 340 });
        if (brandName) {
          c.fillStyle = accent; c.fillRect(28, 668, 5, 34 * ent);
          c.fillStyle = 'rgba(13,16,23,0.82)'; c.fillRect(33, 668, 190 * ent, 34);
          c.fillStyle = '#e0e7ff'; c.font = `700 12.5px Pretendard, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
          c.fillText(String(brandName).slice(0, 16), 46, 685);
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: 28, y: 774, maxW: W - 56, maxLines: 3, maxSize: 36, minSize: 22, color: '#ffffff', align: 'left', shadow: 'rgba(0,0,0,0.8)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_top5 = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(18,15,23,0.86)', botH: 340 });
        const sc = 0.7 + 0.3 * ent;
        c.save(); c.translate(80, 82); c.scale(sc, sc);
        gRoundRect(c, -52, -32, 104, 64, 14); c.fillStyle = accent; c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = '#120f17'; c.font = `900 11px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('RANKING', 0, -13); c.font = `800 28px 'Paperlogy', sans-serif`; c.fillText(`TOP ${cutIdx + 1}`, 0, 12);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', strokeCol: '#120f17', strokeW: 6, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_review = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(12,15,20,0.94)', botH: H * 0.54 });
        if (!caption || capHidden) return;
        const x = W * 0.085;
        c.fillStyle = accent; c.fillRect(x, H * 0.65, W * 0.065 * ent, 3);
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.font = gFont(600, W * 0.032, 'Pretendard, sans-serif');
        c.fillStyle = '#fff8dc'; c.fillText('한줄 리뷰', x, H * 0.68);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x, y: H * 0.80, maxW: W - 2 * x, maxLines: 3, maxSize: 38, minSize: 22, color: '#ffffff', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_qa = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(15,23,42,0.72)', botH: 300 });
        gRoundRect(c, 26, 40, 122, 34, 17); c.fillStyle = accent; c.fill();
        c.fillStyle = '#0f172a'; c.font = `900 13px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`Q&A  #0${cutIdx + 1}`, 87, 57);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 774, maxW: W - 92, maxLines: 3, maxSize: 36, minSize: 22, color: '#0f172a', boxBg: 'rgba(255,255,255,0.95)', boxRadius: 22, padX: 24, padY: 16, ent, capHidden });
      };

      // ── 장르 6: 게임 · 픽셀 · 만화 (10종) ─────────────────────────────────
      STUDIO_100_RENDERERS.s100_gm_rpg = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(12,16,38,0.72)', botH: 300 });
        c.fillStyle = 'rgba(9,12,30,0.88)'; c.fillRect(20, 28, W - 40, 44);
        c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.strokeRect(20, 28, W - 40, 44);
        c.fillStyle = accent; c.font = `800 13px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`LV.99  STAGE 0${cutIdx + 1}`, 34, 50);
        c.fillStyle = '#22c55e'; c.fillRect(W - 152, 43, 114 * (0.4 + 0.6 * lp), 14);
        c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(W - 152, 43, 114, 14);
        if (caption && !capHidden) {
          c.fillStyle = 'rgba(12,22,66,0.90)'; c.fillRect(20, 696, W - 40, 178);
          c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.strokeRect(20, 696, W - 40, 178);
          c.lineWidth = 1.5; c.strokeRect(28, 704, W - 56, 162);
          if (Math.floor(t * 2.5) % 2 === 0) { c.fillStyle = accent; c.font = `900 16px monospace`; c.textAlign = 'right'; c.fillText('▼', W - 40, 854); }
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: 44, y: 784, maxW: W - 92, maxLines: 3, maxSize: 32, minSize: 20, color: '#ffffff', align: 'left', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_gm_arcade = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { pattern: 'scanline', topScrim: 'rgba(10,8,24,0.78)', botScrim: 'rgba(10,8,24,0.88)', botH: 340 });
        c.strokeStyle = accent; c.lineWidth = 3.5; c.strokeRect(14, 18, W - 28, H - 36);
        c.fillStyle = '#ef4444'; c.font = `900 13px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.fillText(`1UP 00${(cutIdx + 1) * 2450}`, 28, 46);
        c.fillStyle = '#fde047'; c.textAlign = 'center'; c.fillText('HI-SCORE 99990', W / 2, 46);
        c.fillStyle = '#fb7185'; c.textAlign = 'right'; c.fillText('♥ ♥ ♥', W - 28, 46);
        if (Math.floor(t * 2) % 2 === 0) {
          c.fillStyle = '#fde047'; c.font = `800 12px 'JetBrains Mono', monospace`; c.textAlign = 'center';
          c.fillText('PRESS START · INSERT COIN', W / 2, H - 40);
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 34, minSize: 21, color: '#fde047', shadow: accent, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_manga = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { pattern: 'halftone', botScrim: 'rgba(20,20,20,0.45)', botH: 260 });
        // 테두리 만화 집중선 오버레이
        c.save(); c.strokeStyle = 'rgba(17,17,17,0.38)'; c.lineWidth = 2.2;
        const cx = W / 2, cy = H / 2;
        for (let i = 0; i < 44; i++) {
          const a = (i / 44) * Math.PI * 2, r1 = 220 + (i % 3) * 24;
          c.beginPath(); c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          c.lineTo(cx + Math.cos(a) * 640, cy + Math.sin(a) * 640); c.stroke();
        }
        c.restore();
        c.strokeStyle = '#111111'; c.lineWidth = 8; c.strokeRect(10, 12, W - 20, H - 24);
        c.save(); c.translate(W - 76, 86); c.rotate(0.14);
        c.fillStyle = '#ffffff'; c.strokeStyle = '#111111'; c.lineWidth = 3; c.beginPath();
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, r = k % 2 ? 28 : 42; if (k === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r); else c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#111111'; c.font = `800 18px 'Paperlogy', sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('주목!', 0, 2); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 766, maxW: W * 0.80, maxLines: 3, maxSize: 38, minSize: 23, color: '#111111', boxBg: '#ffffff', boxBorder: '#111111', boxRadius: 4, padX: 20, padY: 14, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_webtoon = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, {});
        c.strokeStyle = '#ffffff'; c.lineWidth = 14; c.strokeRect(7, 7, W - 14, H - 14);
        c.strokeStyle = '#18181b'; c.lineWidth = 4; c.strokeRect(14, 14, W - 28, H - 28);
        if (caption && !capHidden) {
          c.save(); c.fillStyle = '#ffffff'; c.strokeStyle = '#18181b'; c.lineWidth = 3.5;
          c.beginPath(); c.ellipse(W / 2, 766, W * 0.42, 86, 0, 0, Math.PI * 2); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(W / 2 - 18, 684); c.lineTo(W / 2 - 4, 650); c.lineTo(W / 2 + 16, 684); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#ffffff'; c.fillRect(W / 2 - 20, 680, 40, 12); c.restore();
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 768, maxW: W * 0.70, maxLines: 3, maxSize: 34, minSize: 21, color: '#18181b', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_gm_gameboy = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        // 게임보이 휴대용 콘솔 베젤 (화면을 74%까지 크게 확장)
        gRoundRect(c, 16, 22, W - 32, H - 44, 24); c.fillStyle = '#4a4e57'; c.fill();
        c.fillStyle = '#ef4444'; c.beginPath(); c.arc(36, 120, 5.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#d4d4d8'; c.font = `700 10px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText('DOT MATRIX WITH STEREO SOUND', W / 2 + 8, 44);
        const sx = 54, sy = 62, sw = W - 82, sh = H - 102;
        c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip();
        inPhotoFade(c, S, cutIdx, local, sx, sy, sw, sh, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(139,172,15,0.28)'; c.fillRect(sx, sy, sw, sh);
        c.fillStyle = s100Pattern(c, 'scanline'); c.fillRect(sx, sy, sw, sh);
        c.restore();
        c.strokeStyle = '#0f380f'; c.lineWidth = 3; c.strokeRect(sx, sy, sw, sh);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: sx + sw / 2, y: 786, maxW: sw - 32, maxLines: 3, maxSize: 30, minSize: 19, color: '#0f380f', boxBg: 'rgba(155,188,15,0.92)', boxBorder: '#0f380f', boxRadius: 8, padX: 16, padY: 12, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_popart = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { pattern: 'halftone', botScrim: 'rgba(17,17,17,0.68)', botH: 320 });
        c.strokeStyle = '#fde047'; c.lineWidth = 10; c.strokeRect(10, 12, W - 20, H - 24);
        c.strokeStyle = '#111111'; c.lineWidth = 4; c.strokeRect(16, 18, W - 32, H - 36);
        c.fillStyle = accent; c.fillRect(28, 34, 138, 36);
        c.strokeStyle = '#111111'; c.lineWidth = 3.5; c.strokeRect(28, 34, 138, 36);
        c.fillStyle = '#ffffff'; c.font = `900 15px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`POP! #0${cutIdx + 1}`, 97, 52);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 764, maxW: W * 0.84, maxLines: 3, maxSize: 42, minSize: 25, color: '#fde047', strokeCol: '#111111', strokeW: 8, offsetColor: accent, offsetDx: 5, offsetDy: 5, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_stickerbook = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        // 파스텔 다이어리 배경 + 기울어진 칼선 스티커 (시그니처 비정형 구도)
        c.strokeStyle = 'rgba(236,72,153,0.12)'; c.lineWidth = 1;
        for (let x = 0; x < W; x += 28) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
        for (let y = 0; y < H; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        const pw = W - 76, ph = 640;
        c.save(); c.translate(W / 2, H * 0.48); c.rotate((cutIdx % 2 ? 1 : -1) * 0.03);
        c.shadowColor = 'rgba(236,72,153,0.22)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
        gRoundRect(c, -pw / 2 - 12, -ph / 2 - 12, pw + 24, ph + 24, 28); c.fillStyle = '#ffffff'; c.fill();
        c.shadowBlur = 0; c.shadowOffsetY = 0;
        gRoundRect(c, -pw / 2, -ph / 2, pw, ph, 18); c.clip();
        inPhotoFade(c, S, cutIdx, local, -pw / 2, -ph / 2, pw, ph, 1.03 + lp * 0.04, 0); c.restore();
        [['★', 54, 80, '#facc15'], ['♥', W - 54, 120, '#ec4899'], ['✦', W - 56, 700, '#60a5fa']].forEach(([ch, sx, sy, col], i) => {
          c.save(); c.translate(sx, sy + Math.sin(t * 2 + i) * 4); c.font = `900 30px sans-serif`; c.fillStyle = col; c.textAlign = 'center'; c.fillText(ch, 0, 0); c.restore();
        });
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 786, maxW: W * 0.80, maxLines: 3, maxSize: 38, minSize: 23, color: '#3b1c32', boxBg: '#ffffff', boxRadius: 22, padX: 22, padY: 14, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_toyblock = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(30,41,59,0.78)', botH: 320 });
        const cols = ['#ef4444', '#3b82f6', '#facc15', '#22c55e'];
        const drawRail = (ry, col) => {
          c.fillStyle = col; gRoundRect(c, 16, ry, W - 32, 30, 8); c.fill();
          for (let i = 0; i < 6; i++) {
            c.fillStyle = col; gRoundRect(c, 36 + i * 79, ry - 7, 42, 9, 4); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.32)'; gRoundRect(c, 40 + i * 79, ry - 5, 34, 3, 2); c.fill();
          }
        };
        drawRail(26, cols[cutIdx % 4]); drawRail(H - 46, cols[(cutIdx + 1) % 4]);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', strokeCol: '#1e293b', strokeW: 6, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_terminal = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { pattern: 'scanline', botScrim: 'rgba(7,12,10,0.88)', botH: 340 });
        c.fillStyle = 'rgba(19,32,25,0.92)'; c.fillRect(0, 0, W, 42);
        ['#ef4444', '#facc15', '#22c55e'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(24 + i * 18, 21, 5.5, 0, Math.PI * 2); c.fill(); });
        c.fillStyle = '#86efac'; c.font = `600 11.5px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`zsh — scene_0${cutIdx + 1}.sh`, W / 2, 21);
        c.strokeStyle = 'rgba(34,197,94,0.45)'; c.lineWidth = 2; c.strokeRect(10, 42, W - 20, H - 52);
        c.fillStyle = accent; c.font = `700 12px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`$ run --scene=0${cutIdx + 1}` + (Math.floor(t * 2.5) % 2 ? ' █' : ''), 28, 700);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: 28, y: 786, maxW: W - 56, maxLines: 3, maxSize: 32, minSize: 20, color: '#86efac', align: 'left', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_tcg = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(27,24,61,0.78)', botScrim: 'rgba(27,24,61,0.88)', botH: 340 });
        const shift = Math.sin(t * 1.4) * 220;
        const holo = c.createLinearGradient(shift, 0, W + shift, H);
        holo.addColorStop(0, '#fbbf24'); holo.addColorStop(0.25, '#f472b6'); holo.addColorStop(0.5, '#38bdf8'); holo.addColorStop(0.75, '#a78bfa'); holo.addColorStop(1, '#fbbf24');
        c.strokeStyle = holo; c.lineWidth = 8; gRoundRect(c, 12, 16, W - 24, H - 32, 22); c.stroke();
        c.fillStyle = accent; c.font = `900 14px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`SSR ★ NO.00${cutIdx + 1}`, 34, 48); c.textAlign = 'right'; c.fillText('HP 9900', W - 34, 48);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 766, maxW: W - 84, maxLines: 3, maxSize: 36, minSize: 22, color: '#fef3c7', boxBg: 'rgba(15,12,38,0.78)', boxBorder: accent, boxRadius: 12, padX: 18, padY: 12, ent, capHidden });
      };
    }
