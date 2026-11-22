// AutoReels — 07-studio-styles-103.js
// 스타일 100종 프로젝트 Batch 3 (41~60 / 100종):
// 장르 5 방송·뉴스·예능·유튜브 (10종) + 장르 6 게임·픽셀·만화 (10종)

    const STUDIO_100_B3_SPECS = [
      // ── 장르 5: 방송 · 뉴스 · 예능 · 유튜브 (10종) ────────────────────────
      ['s100_tv_breaking',    '속보 뉴스 티커',    '뉴스·방송', '#0b1020', '#121b33', '#dc2626', '#ffffff', 'dohyeon', false, 'broadcast', 'news',     'LIVE 속보 배지와 하단 스크롤 뉴스 티커'],
      ['s100_tv_variety',     '예능 자막 팝',      '재미',     '#11131a', '#1d1f2b', '#facc15', '#ffffff', 'gasoek',  false, 'broadcast', 'funk',     '통통 튀는 예능 스티커와 굵은 2중 테두리 자막'],
      ['s100_tv_docu_nar',    '다큐 나레이션',     '뉴스·방송', '#0d0e12', '#171920', '#d4af37', '#f4f4f5', 'gowun',   false, 'broadcast', 'cinema',   '방송 스페셜 워터마크와 골드라인 나레이션 바'],
      ['s100_tv_podcast',     '팟캐스트 파형',     '상담·정보', '#0f121a', '#181e2c', '#38bdf8', '#f8fafc', 'pretM',   false, 'broadcast', 'lofi',     '실시간 움직이는 오디오 이퀄라이저 파형 스튜디오'],
      ['s100_tv_sports',      '스포츠 스코어보드',  '스포츠',    '#091326', '#102140', '#a3e635', '#ffffff', 'gasoek',  false, 'broadcast', 'edm',      '라이브 스코어보드 HUD와 사선 스피드 스트라이프'],
      ['s100_tv_finance',     '금융 브리핑',       '상담·정보', '#08101e', '#0f1d36', '#10b981', '#ecfdf5', 'pretM',   false, 'broadcast', 'news',     '실시간 상승 차트와 경제 채널 브리핑 바'],
      ['s100_tv_interview',   '인터뷰 하단 바',    '신뢰',     '#0d1017', '#161b26', '#6366f1', '#ffffff', 'pretM',   false, 'broadcast', 'showroom', '깔끔한 인터뷰 화자 하단 바와 인디고 포인트'],
      ['s100_tv_top5',        '랭킹 TOP5',        '재미',     '#120f17', '#21192b', '#f59e0b', '#ffffff', 'gasoek',  false, 'broadcast', 'urban',    '메탈릭 골드 순위 배지와 카운트다운 프레임'],
      ['s100_tv_review',      '별점 리뷰 카드',    '신뢰',     '#14151a', '#1d1f27', '#facc15', '#ffffff', 'pretM',   false, 'broadcast', 'bright',   '5.0 별점 배지와 실구매 인증 리뷰 카드'],
      ['s100_tv_qa',          'Q&A 말풍선',       '상담·정보', '#0f172a', '#1e293b', '#38bdf8', '#0f172a', 'jua',     false, 'broadcast', 'bright',   '상단 질문 배지와 하단 화이트 답변 말풍선'],

      // ── 장르 6: 게임 · 픽셀 · 만화 (10종) ─────────────────────────────────
      ['s100_gm_rpg',         '16비트 픽셀 RPG',   '재미',     '#0c1026', '#161d40', '#facc15', '#ffffff', 'mono',    false, 'game',      'funk',     'HP 상태바와 클래식 RPG 대화창 커서'],
      ['s100_gm_arcade',      '아케이드 HUD',      '재미',     '#0a0818', '#171033', '#22d3ee', '#fde047', 'mono',    false, 'game',      'edm',      '1UP 하이스코어와 하트 라이프 오락실 화면'],
      ['s100_gm_manga',       '흑백 만화 컷',      '재미',     '#f6f4ee', '#eae6dc', '#111111', '#111111', 'dohyeon', true,  'game',      'urban',    '만화 집중선과 잉크 컷 분할 효과음 배지'],
      ['s100_gm_webtoon',     '웹툰 말풍선',       '재미',     '#ffffff', '#f4f4f6', '#18181b', '#18181b', 'jua',     true,  'game',      'bright',   '깔끔한 세로 웹툰 컷과 둥근 대화 말풍선'],
      ['s100_gm_gameboy',     '레트로 게임보이',    '재미',     '#c4c8b8', '#b0b5a2', '#306230', '#0f380f', 'mono',    true,  'game',      'funk',     '올리브그린 도트매트릭스 휴대용 게임기 베젤'],
      ['s100_gm_popart',      '팝아트 하프톤',     '재미',     '#fde047', '#facc15', '#ef4444', '#111111', 'gasoek',  true,  'game',      'funk',     '강렬한 원색 하프톤 도트와 코믹 폭발 프레임'],
      ['s100_gm_stickerbook', '스티커북 콜라주',    '재미',     '#fdf2f8', '#fce7f3', '#ec4899', '#3b1c32', 'jua',     true,  'game',      'bright',   '하얀 칼선 스티커 프레임과 별·하트 데코'],
      ['s100_gm_toyblock',    '3D 토이 블록',      '재미',     '#eff6ff', '#dbeafe', '#ef4444', '#1e293b', 'jua',     true,  'game',      'bright',   '원색 브릭 스터드 레일과 입체 토이 프레임'],
      ['s100_gm_terminal',    '사이버 터미널',     '테크',     '#070c0a', '#0c1612', '#22c55e', '#86efac', 'mono',    false, 'game',      'drive',    '개발자 콘솔 타이틀바와 깜빡이는 프롬프트 커서'],
      ['s100_gm_tcg',         '트레이딩 카드',     '재미',     '#1e1b4b', '#312e81', '#fbbf24', '#fef3c7', 'dohyeon', false, 'game',      'edm',      '무지개 홀로그램 광택과 레어 카드 스탯 프레임']
    ];

    if (typeof s100RegisterStyles === 'function') s100RegisterStyles(STUDIO_100_B3_SPECS, 940);

    if (typeof STUDIO_100_RENDERERS !== 'undefined') {
      // ── 장르 5: 방송 · 뉴스 · 예능 · 유튜브 (10종) ────────────────────────
      STUDIO_100_RENDERERS.s100_tv_breaking = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent, brandName }) => {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.03 + lp * 0.04, 0);
        // 상단 LIVE 속보 버그 & 시계
        c.fillStyle = accent; gRoundRect(c, 22, 34, 96, 30, 5); c.fill();
        if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(38, 49, 4.5, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#ffffff'; c.font = `900 13px Pretendard, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('LIVE 속보', 49, 50);
        c.fillStyle = 'rgba(11,16,32,0.82)'; gRoundRect(c, W - 104, 34, 82, 30, 5); c.fill();
        c.fillStyle = '#e2e8f0'; c.font = `700 12px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        const now = new Date();
        c.fillText(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, W - 63, 49);
        // 하단 2단 뉴스 바 + 스크롤 티커
        if (caption && !capHidden) {
          c.fillStyle = accent; c.fillRect(22, 686, 114 * ent, 28);
          c.fillStyle = '#ffffff'; c.font = `900 12px Pretendard, sans-serif`; c.textAlign = 'center';
          c.fillText('BREAKING', 22 + 57 * ent, 700);
          c.fillStyle = 'rgba(11,16,32,0.92)'; c.fillRect(22, 714, W - 44, 126);
          c.fillStyle = accent; c.fillRect(22, 714, 5, 126);
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: 40, y: 777, maxW: W - 82, maxLines: 3, maxSize: 31, minSize: 20, color: '#ffffff', align: 'left', ent, capHidden });
        }
        // 최하단 무한 스크롤 속보 티커
        c.fillStyle = '#0f172a'; c.fillRect(0, H - 54, W, 32);
        c.fillStyle = accent; c.fillRect(0, H - 54, 72, 32);
        c.fillStyle = '#ffffff'; c.font = `800 11.5px Pretendard, sans-serif`; c.textAlign = 'center'; c.fillText('NEWS', 36, H - 38);
        c.save(); c.beginPath(); c.rect(72, H - 54, W - 72, 32); c.clip();
        c.fillStyle = '#e2e8f0'; c.font = `600 12px Pretendard, sans-serif`; c.textAlign = 'left';
        const msg = `   ●  ${String(brandName)} 특별 브리핑   ●  지금 주목해야 할 핵심 포인트   ●  SCENE 0${cutIdx + 1}   `;
        const mw = c.measureText(msg).width;
        const off = ((t * 68) % mw + mw) % mw;
        for (let x = 72 - off; x < W + mw; x += mw) c.fillText(msg, x, H - 38);
        c.restore();
      };

      STUDIO_100_RENDERERS.s100_tv_variety = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.04 + lp * 0.04, 0);
        const botG = c.createLinearGradient(0, H * 0.58, 0, H);
        botG.addColorStop(0, 'rgba(0,0,0,0)'); botG.addColorStop(1, 'rgba(12,14,22,0.72)');
        c.fillStyle = botG; c.fillRect(0, H * 0.58, W, H * 0.42);
        // 예능 우측 상단 통통 튀는 스티커 배지
        const pop = 1 + Math.sin(t * 6) * 0.04;
        c.save();
        c.translate(W - 96, 66); c.rotate(0.08); c.scale(pop * ent, pop * ent);
        gRoundRect(c, -74, -22, 148, 44, 22); c.fillStyle = '#ec4899'; c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.stroke();
        c.fillStyle = '#ffffff'; c.font = `900 14px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`★ 주목 포인트 ${cutIdx + 1}`, 0, 1);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 768, maxW: W * 0.86, maxLines: 3, maxSize: 39, minSize: 23, color: accent, strokeCol: '#1e1b4b', strokeW: 9, offsetColor: '#ec4899', offsetDx: 0, offsetDy: 5, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_docu_nar = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.02 + lp * 0.035, 0);
        const vg = c.createLinearGradient(0, H * 0.60, 0, H);
        vg.addColorStop(0, 'rgba(10,12,16,0)'); vg.addColorStop(1, 'rgba(10,12,16,0.88)');
        c.fillStyle = vg; c.fillRect(0, H * 0.60, W, H * 0.40);
        // 방송사 스페셜 워터마크 (우측 상단)
        c.fillStyle = 'rgba(255,255,255,0.62)'; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'right';
        c.fillText('SPECIAL DOCU', W - 28, 52);
        c.fillStyle = accent; c.fillRect(W - 82, 60, 54, 1.5);
        if (caption && !capHidden) {
          c.fillStyle = accent; c.fillRect(36, 738, 3, 66 * ent);
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: 52, y: 772, maxW: W - 92, maxLines: 3, maxSize: 30, minSize: 20, color: '#f4f4f5', align: 'left', shadow: 'rgba(0,0,0,0.8)', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_tv_podcast = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // ON AIR 상단 배지
        gRoundRect(c, W / 2 - 72, 42, 144, 28, 14); c.fillStyle = 'rgba(239,68,68,0.18)'; c.fill();
        c.strokeStyle = 'rgba(239,68,68,0.55)'; c.lineWidth = 1.2; c.stroke();
        c.fillStyle = '#ef4444'; c.beginPath(); c.arc(W / 2 - 48, 56, 4.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#f8fafc'; c.font = `700 11.5px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`ON AIR · EP.0${cutIdx + 1}`, W / 2 + 6, 56);
        // 중앙 팟캐스트 영상 창
        const px = 42, py = 92, pw = W - 84, ph = 492;
        c.save(); gRoundRect(c, px, py, pw, ph, 22); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = 'rgba(56,189,248,0.45)'; c.lineWidth = 2; gRoundRect(c, px, py, pw, ph, 22); c.stroke();
        // 실시간 24채널 오디오 이퀄라이저 파형
        const bars = 24, bw = 8, gap = 8, totalW = bars * bw + (bars - 1) * gap, sx = (W - totalW) / 2;
        for (let i = 0; i < bars; i++) {
          const h = 10 + Math.abs(Math.sin(t * 5.2 + i * 0.65) * Math.cos(t * 2.3 + i * 0.3)) * 42;
          c.fillStyle = i % 3 === 0 ? accent : 'rgba(148,163,184,0.55)';
          gRoundRect(c, sx + i * (bw + gap), 638 - h / 2, bw, h, 4); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 774, maxW: W * 0.82, maxLines: 3, maxSize: 32, minSize: 20, color: '#f8fafc', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_sports = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.05 + lp * 0.05, 0);
        const shade = c.createLinearGradient(0, H * 0.56, 0, H);
        shade.addColorStop(0, 'rgba(9,19,38,0)'); shade.addColorStop(1, 'rgba(9,19,38,0.88)');
        c.fillStyle = shade; c.fillRect(0, H * 0.56, W, H * 0.44);
        // 상단 스포츠 스코어보드 HUD
        gRoundRect(c, 22, 34, 242, 36, 8); c.fillStyle = 'rgba(9,19,38,0.88)'; c.fill();
        c.fillStyle = accent; gRoundRect(c, 22, 34, 62, 36, 8); c.fill();
        c.fillStyle = '#091326'; c.font = `900 12px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('LIVE', 53, 52);
        c.fillStyle = '#ffffff'; c.textAlign = 'left';
        c.fillText(`Q${cutIdx + 1}  ·  ${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * 60)).padStart(2, '0')}`, 96, 52);
        // 사선 스피드 스트라이프
        c.fillStyle = accent;
        for (let i = 0; i < 3; i++) {
          c.beginPath(); c.moveTo(W - 84 + i * 20, 34); c.lineTo(W - 72 + i * 20, 34); c.lineTo(W - 86 + i * 20, 70); c.lineTo(W - 98 + i * 20, 70); c.closePath(); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 768, maxW: W * 0.84, maxLines: 3, maxSize: 37, minSize: 22, color: '#ffffff', strokeCol: '#091326', strokeW: 6, offsetColor: accent, offsetDx: 3, offsetDy: 3, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_finance = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 상단 마켓 티커 바
        c.fillStyle = '#0f1d36'; c.fillRect(0, 28, W, 34);
        c.fillStyle = accent; c.font = `700 11.5px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`MARKET BRIEF  ▲ +12.4%   ·   INDEX 0${cutIdx + 1}`, 24, 45);
        const px = 28, py = 80, pw = W - 56, ph = 528;
        c.save(); gRoundRect(c, px, py, pw, ph, 14); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = 'rgba(16,185,129,0.45)'; c.lineWidth = 1.5; gRoundRect(c, px, py, pw, ph, 14); c.stroke();
        // 하단 상승 스파크라인 그래프
        c.save();
        c.strokeStyle = accent; c.lineWidth = 2.4;
        c.beginPath();
        const pts = 14;
        for (let i = 0; i <= pts; i++) {
          const gx = 28 + (W - 56) * (i / pts);
          const gy = 668 - (i / pts) * 34 - Math.sin(t * 2 + i * 0.8) * 6;
          if (i === 0) c.moveTo(gx, gy); else c.lineTo(gx, gy);
        }
        c.stroke();
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: 28, y: 782, maxW: W - 56, maxLines: 3, maxSize: 32, minSize: 20, color: '#ecfdf5', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_interview = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent, brandName }) => {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.02 + lp * 0.035, 0);
        const shade = c.createLinearGradient(0, H * 0.56, 0, H);
        shade.addColorStop(0, 'rgba(13,16,23,0)'); shade.addColorStop(1, 'rgba(13,16,23,0.88)');
        c.fillStyle = shade; c.fillRect(0, H * 0.56, W, H * 0.44);
        // 화자 이름표 로어서드
        c.fillStyle = accent; c.fillRect(28, 668, 5, 34 * ent);
        c.fillStyle = 'rgba(13,16,23,0.78)'; c.fillRect(33, 668, 190 * ent, 34);
        c.fillStyle = '#e0e7ff'; c.font = `700 12.5px Pretendard, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(String(brandName).slice(0, 16), 46, 685);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: 28, y: 774, maxW: W - 56, maxLines: 3, maxSize: 32, minSize: 20, color: '#ffffff', align: 'left', shadow: 'rgba(0,0,0,0.75)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_top5 = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 28, py = 104, pw = W - 56, ph = 564;
        c.save(); gRoundRect(c, px, py, pw, ph, 18); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.04 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 3; gRoundRect(c, px, py, pw, ph, 18); c.stroke();
        // 좌상단 메탈릭 골드 순위 배지
        const sc = 0.7 + 0.3 * ent;
        c.save(); c.translate(82, 104); c.scale(sc, sc);
        gRoundRect(c, -54, -34, 108, 68, 14); c.fillStyle = accent; c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = '#120f17'; c.font = `900 11px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('RANKING', 0, -14);
        c.font = `900 28px 'Black Han Sans', sans-serif`;
        c.fillText(`TOP ${cutIdx + 1}`, 0, 12);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 776, maxW: W * 0.84, maxLines: 3, maxSize: 35, minSize: 22, color: '#ffffff', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_tv_review = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 34, py = 94, pw = W - 68, ph = 540;
        c.save(); gRoundRect(c, px, py, pw, ph, 20); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 상단 5.0 별점 인증 필
        gRoundRect(c, W / 2 - 114, 42, 228, 36, 18); c.fillStyle = 'rgba(20,21,26,0.92)'; c.fill();
        c.strokeStyle = 'rgba(250,204,21,0.55)'; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = accent; c.font = `800 14px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('★★★★★  5.0  실제 후기', W / 2, 60);
        if (caption && !capHidden) {
          gRoundRect(c, 34, 668, W - 68, 176, 16); c.fillStyle = '#1d1f27'; c.fill();
          c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1.2; c.stroke();
          s100DrawCaption(c, W, H, `“${caption}”`, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 756, maxW: W - 108, maxLines: 3, maxSize: 30, minSize: 19, color: '#ffffff', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_tv_qa = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 32, py = 86, pw = W - 64, ph = 548;
        c.save(); gRoundRect(c, px, py, pw, ph, 22); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        gRoundRect(c, 32, 36, 118, 34, 17); c.fillStyle = accent; c.fill();
        c.fillStyle = '#0f172a'; c.font = `900 13px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`Q&A  #0${cutIdx + 1}`, 91, 53);
        if (caption && !capHidden) {
          // 꼬리 달린 화이트 답변 말풍선
          gRoundRect(c, 32, 672, W - 64, 174, 22); c.fillStyle = '#ffffff'; c.fill();
          c.beginPath(); c.moveTo(96, 672); c.lineTo(116, 650); c.lineTo(136, 672); c.closePath(); c.fill();
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 759, maxW: W - 104, maxLines: 3, maxSize: 32, minSize: 20, color: '#0f172a', ent, capHidden });
        }
      };

      // ── 장르 6: 게임 · 픽셀 · 만화 (10종) ─────────────────────────────────
      STUDIO_100_RENDERERS.s100_gm_rpg = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 상단 RPG 스테이터스 바
        c.fillStyle = '#090c1e'; c.fillRect(24, 30, W - 48, 44);
        c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.strokeRect(24, 30, W - 48, 44);
        c.fillStyle = accent; c.font = `800 13px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`LV.99  STAGE 0${cutIdx + 1}`, 38, 52);
        c.fillStyle = '#22c55e'; c.fillRect(W - 156, 45, 114 * (0.4 + 0.6 * lp), 14);
        c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(W - 156, 45, 114, 14);
        // 게임 화면 창
        const px = 24, py = 88, pw = W - 48, ph = 556;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.strokeRect(px, py, pw, ph);
        // 하단 클래식 RPG 대화창 + 깜빡이는 ▼ 커서
        c.fillStyle = '#0c1642'; c.fillRect(24, 666, W - 48, 198);
        c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.strokeRect(24, 666, W - 48, 198);
        c.lineWidth = 1.5; c.strokeRect(32, 674, W - 64, 182);
        if (Math.floor(t * 2.5) % 2 === 0) {
          c.fillStyle = accent; c.font = `900 16px monospace`; c.textAlign = 'right';
          c.fillText('▼', W - 44, 842);
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: 48, y: 762, maxW: W - 96, maxLines: 3, maxSize: 28, minSize: 18, color: '#ffffff', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_arcade = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = '#ef4444'; c.font = `900 13px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`1UP  00${(cutIdx + 1) * 2450}`, 26, 46);
        c.fillStyle = '#fde047'; c.textAlign = 'center'; c.fillText('HI-SCORE 99990', W / 2, 46);
        c.fillStyle = '#fb7185'; c.textAlign = 'right'; c.fillText('♥ ♥ ♥', W - 26, 46);
        const px = 26, py = 68, pw = W - 52, ph = 592;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.fillStyle = s100Pattern(c, 'scanline'); c.fillRect(px, py, pw, ph);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 3.5; c.strokeRect(px, py, pw, ph);
        if (Math.floor(t * 2) % 2 === 0) {
          c.fillStyle = '#fde047'; c.font = `800 12px 'JetBrains Mono', monospace`; c.textAlign = 'center';
          c.fillText('PRESS START · INSERT COIN', W / 2, H - 40);
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: W / 2, y: 774, maxW: W * 0.84, maxLines: 3, maxSize: 30, minSize: 19, color: '#fde047', shadow: accent, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_manga = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        // 만화 집중선 배경
        c.save();
        c.strokeStyle = 'rgba(17,17,17,0.22)'; c.lineWidth = 2;
        const cx = W / 2, cy = 380;
        for (let i = 0; i < 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          const r1 = 235 + (i % 3) * 18;
          c.beginPath(); c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          c.lineTo(cx + Math.cos(a) * 620, cy + Math.sin(a) * 620); c.stroke();
        }
        c.restore();
        const px = 34, py = 86, pw = W - 68, ph = 558;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.04 + lp * 0.04, 0);
        c.fillStyle = s100Pattern(c, 'halftone'); c.fillRect(px, py, pw, ph);
        c.restore();
        c.strokeStyle = '#111111'; c.lineWidth = 5; c.strokeRect(px, py, pw, ph);
        // 뾰족한 효과음 배지
        c.save(); c.translate(W - 76, 118); c.rotate(0.14);
        c.fillStyle = '#ffffff'; c.strokeStyle = '#111111'; c.lineWidth = 3;
        c.beginPath();
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2, r = k % 2 ? 28 : 42;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          if (k === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#111111'; c.font = `900 18px 'Black Han Sans', sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('주목!', 0, 2);
        c.restore();
        if (caption && !capHidden) {
          c.fillStyle = '#ffffff'; c.fillRect(34, 674, W - 68, 174);
          c.strokeStyle = '#111111'; c.lineWidth = 4; c.strokeRect(34, 674, W - 68, 174);
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 761, maxW: W - 104, maxLines: 3, maxSize: 33, minSize: 21, color: '#111111', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_gm_webtoon = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        const px = 28, py = 64, pw = W - 56, ph = 566;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#18181b'; c.lineWidth = 3.5; c.strokeRect(px, py, pw, ph);
        if (caption && !capHidden) {
          // 둥근 웹툰 타원 말풍선
          c.save();
          c.fillStyle = '#ffffff'; c.strokeStyle = '#18181b'; c.lineWidth = 3.5;
          c.beginPath(); c.ellipse(W / 2, 766, W * 0.43, 92, 0, 0, Math.PI * 2); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(W / 2 - 18, 676); c.lineTo(W / 2 - 4, 640); c.lineTo(W / 2 + 16, 676); c.closePath();
          c.fill(); c.stroke();
          c.fillStyle = '#ffffff'; c.fillRect(W / 2 - 20, 674, 40, 10);
          c.restore();
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 768, maxW: W * 0.72, maxLines: 3, maxSize: 30, minSize: 19, color: '#18181b', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_gm_gameboy = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        // 회색 렌즈 베젤 + BATTERY 빨간 LED
        gRoundRect(c, 20, 44, W - 40, 622, 18); c.fillStyle = '#4a4e57'; c.fill();
        c.fillStyle = '#ef4444'; c.beginPath(); c.arc(46, 132, 6, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#d4d4d8'; c.font = `700 9px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText('BATTERY', 46, 152);
        c.font = `700 10px 'JetBrains Mono', monospace`; c.fillText('DOT MATRIX WITH STEREO SOUND', W / 2 + 12, 66);
        const sx = 72, sy = 84, sw = W - 110, sh = 548;
        c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip();
        inPhotoFade(c, S, cutIdx, local, sx, sy, sw, sh, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(139,172,15,0.28)'; c.fillRect(sx, sy, sw, sh);
        c.fillStyle = s100Pattern(c, 'scanline'); c.fillRect(sx, sy, sw, sh);
        c.restore();
        c.strokeStyle = '#0f380f'; c.lineWidth = 3; c.strokeRect(sx, sy, sw, sh);
        // 하단 올리브 LCD 자막
        gRoundRect(c, 34, 694, W - 68, 174, 10); c.fillStyle = '#9bbc0f'; c.fill();
        c.strokeStyle = '#0f380f'; c.lineWidth = 3; c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: W / 2, y: 781, maxW: W - 104, maxLines: 3, maxSize: 28, minSize: 18, color: '#0f380f', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_popart = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = s100Pattern(c, 'halftone'); c.fillRect(0, 0, W, H);
        const px = 30, py = 86, pw = W - 60, ph = 556;
        c.fillStyle = '#2563eb'; c.fillRect(px + 12, py + 12, pw, ph);
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.04 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#111111'; c.lineWidth = 5; c.strokeRect(px, py, pw, ph);
        c.fillStyle = accent; c.fillRect(px, 34, 146, 36);
        c.strokeStyle = '#111111'; c.lineWidth = 3.5; c.strokeRect(px, 34, 146, 36);
        c.fillStyle = '#ffffff'; c.font = `900 15px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`POP! #0${cutIdx + 1}`, px + 73, 52);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 37, minSize: 22, color: '#ffffff', strokeCol: '#111111', strokeW: 8, offsetColor: accent, offsetDx: 5, offsetDy: 5, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_stickerbook = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 다이어리 모눈 배경
        c.strokeStyle = 'rgba(236,72,153,0.12)'; c.lineWidth = 1;
        for (let x = 0; x < W; x += 28) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
        for (let y = 0; y < H; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        // 하얀 칼선 스티커 프레임
        const px = 44, py = 96, pw = W - 88, ph = 532;
        c.save();
        c.translate(W / 2, py + ph / 2); c.rotate((cutIdx % 2 ? 1 : -1) * 0.025);
        c.shadowColor = 'rgba(236,72,153,0.22)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
        gRoundRect(c, -pw / 2 - 12, -ph / 2 - 12, pw + 24, ph + 24, 28); c.fillStyle = '#ffffff'; c.fill();
        c.shadowBlur = 0; c.shadowOffsetY = 0;
        gRoundRect(c, -pw / 2, -ph / 2, pw, ph, 18); c.clip();
        inPhotoFade(c, S, cutIdx, local, -pw / 2, -ph / 2, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 장식 미니 스티커
        [['★', 58, 86, '#facc15'], ['♥', W - 58, 126, '#ec4899'], ['✦', W - 64, 624, '#60a5fa'], ['●', 62, 646, '#a78bfa']].forEach(([ch, sx, sy, col], i) => {
          c.save(); c.translate(sx, sy + Math.sin(t * 2 + i) * 4);
          c.font = `900 28px sans-serif`; c.fillStyle = col; c.textAlign = 'center'; c.fillText(ch, 0, 0);
          c.restore();
        });
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 758, maxW: W * 0.80, maxLines: 3, maxSize: 34, minSize: 21, color: '#3b1c32', boxBg: '#ffffff', boxRadius: 22, padX: 22, padY: 14, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_toyblock = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        // 상단·하단 브릭 스터드 레일
        const cols = ['#ef4444', '#3b82f6', '#facc15', '#22c55e'];
        const drawRail = (ry, col) => {
          c.fillStyle = col; gRoundRect(c, 22, ry, W - 44, 34, 8); c.fill();
          for (let i = 0; i < 6; i++) {
            c.fillStyle = col; gRoundRect(c, 42 + i * 78, ry - 8, 44, 10, 4); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.28)'; gRoundRect(c, 46 + i * 78, ry - 6, 36, 3, 2); c.fill();
          }
        };
        drawRail(42, cols[cutIdx % 4]);
        drawRail(H - 62, cols[(cutIdx + 1) % 4]);
        const px = 30, py = 96, pw = W - 60, ph = 552;
        c.save();
        c.shadowColor = 'rgba(30,41,59,0.18)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
        gRoundRect(c, px, py, pw, ph, 18); c.fillStyle = '#ffffff'; c.fill();
        c.restore();
        c.save(); gRoundRect(c, px + 8, py + 8, pw - 16, ph - 16, 12); c.clip();
        inPhotoFade(c, S, cutIdx, local, px + 8, py + 8, pw - 16, ph - 16, 1.03 + lp * 0.04, 0);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 766, maxW: W * 0.82, maxLines: 3, maxSize: 34, minSize: 21, color: '#1e293b', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_terminal = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 터미널 창 프레임 + macOS 3점 타이틀바
        gRoundRect(c, 22, 36, W - 44, H - 72, 14); c.fillStyle = '#0c1410'; c.fill();
        c.strokeStyle = 'rgba(34,197,94,0.42)'; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = '#132019'; gRoundRect(c, 22, 36, W - 44, 34, 14); c.fill();
        ['#ef4444', '#facc15', '#22c55e'].forEach((col, i) => {
          c.fillStyle = col; c.beginPath(); c.arc(44 + i * 18, 53, 5, 0, Math.PI * 2); c.fill();
        });
        c.fillStyle = '#86efac'; c.font = `600 11px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`zsh — scene_0${cutIdx + 1}.sh`, W / 2, 53);
        const px = 34, py = 86, pw = W - 68, ph = 556;
        c.save(); gRoundRect(c, px, py, pw, ph, 8); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.fillStyle = s100Pattern(c, 'scanline'); c.fillRect(px, py, pw, ph);
        c.restore();
        c.strokeStyle = 'rgba(34,197,94,0.35)'; c.lineWidth = 1.2; gRoundRect(c, px, py, pw, ph, 8); c.stroke();
        c.fillStyle = accent; c.font = `700 12px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`$ run --scene=0${cutIdx + 1}` + (Math.floor(t * 2.5) % 2 ? ' █' : ''), 36, 676);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: 36, y: 780, maxW: W - 72, maxLines: 3, maxSize: 28, minSize: 18, color: '#86efac', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_gm_tcg = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 홀로그램 트레이딩 카드 외곽
        const shift = Math.sin(t * 1.4) * 220;
        const holo = c.createLinearGradient(shift, 0, W + shift, H);
        holo.addColorStop(0, '#fbbf24'); holo.addColorStop(0.25, '#f472b6'); holo.addColorStop(0.5, '#38bdf8'); holo.addColorStop(0.75, '#a78bfa'); holo.addColorStop(1, '#fbbf24');
        gRoundRect(c, 18, 22, W - 36, H - 44, 24); c.fillStyle = holo; c.fill();
        gRoundRect(c, 26, 30, W - 52, H - 60, 18); c.fillStyle = '#1b183d'; c.fill();
        // 상단 카드 타이틀 & 등급
        c.fillStyle = accent; c.font = `900 14px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`SSR ★ NO.00${cutIdx + 1}`, 42, 60);
        c.textAlign = 'right'; c.fillText('HP 9900', W - 42, 60);
        const px = 40, py = 84, pw = W - 80, ph = 528;
        c.save(); gRoundRect(c, px, py, pw, ph, 12); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = holo; c.lineWidth = 3; gRoundRect(c, px, py, pw, ph, 12); c.stroke();
        // 하단 스탯 바 & 카드 설명 박스
        gRoundRect(c, 40, 626, W - 80, 26, 6); c.fillStyle = 'rgba(251,191,36,0.16)'; c.fill();
        c.fillStyle = '#fde68a'; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText('ATK 990   ·   SPD 950   ·   LIMITED EDITION', W / 2, 639);
        gRoundRect(c, 40, 666, W - 80, 198, 12); c.fillStyle = 'rgba(15,12,38,0.86)'; c.fill();
        c.strokeStyle = 'rgba(251,191,36,0.45)'; c.lineWidth = 1.5; c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 765, maxW: W - 116, maxLines: 3, maxSize: 31, minSize: 20, color: '#fef3c7', ent, capHidden });
      };
    }
