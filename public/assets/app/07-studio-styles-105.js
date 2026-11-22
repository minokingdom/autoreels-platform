// AutoReels — 07-studio-styles-105.js
// 스타일 100종 프로젝트 Batch 5 (81~100 / 100종 — 풀블리드 9:16 업그레이드):
// 장르 9 뷰티·패션·인테리어·라이프 (10종) + 장르 10 비즈니스·자동차·부동산·클리닉 (10종)

    const STUDIO_100_B5_SPECS = [
      ['s100_lf_glassskin',   '글래스 스킨',       '감성',      '#f4f7fb', '#fceef5', '#f472b6', '#ffffff', 'gowun',   false, 'lifestyle', 'bright',   '풀화면 투명 물광 광택과 진주빛 유리 프레임'],
      ['s100_lf_beautyrev',   '뷰티 리뷰카드',     '신뢰',      '#fff7f8', '#ffeef1', '#f43f5e', '#ffffff', 'pretM',   false, 'lifestyle', 'bright',   '풀화면 98% 만족 뷰티 어워드 배지'],
      ['s100_lf_looktag',     '룩북 태그',         '고급',      '#f3f1ed', '#e8e4dc', '#18181b', '#ffffff', 'maru',    false, 'lifestyle', 'luxury',   '풀화면 살랑 흔들리는 의류 행택 룩북'],
      ['s100_lf_roomtour',    '공간 투어',         '브이로그',   '#f2eee8', '#e6dfd4', '#d97706', '#ffffff', 'gowun',   false, 'lifestyle', 'lofi',     '풀화면 공간 핀 배지와 따뜻한 인테리어 톤'],
      ['s100_lf_beforeafter', '비포&애프터 분할',   '비포·애프터','#0e1116', '#161b24', '#38bdf8', '#ffffff', 'dohyeon', false, 'lifestyle', 'urban',    '풀화면 좌우 슬라이더 핸들과 BEFORE·AFTER'],
      ['s100_lf_perfume',     '향수 에디토리얼',    '고급',      '#131110', '#1f1b18', '#e5c17b', '#faf3e6', 'maru',    false, 'lifestyle', 'luxury',   '타원 보틀 실루엣과 골드 링 아틀리에 무드'],
      ['s100_lf_wedding',     '웨딩 · 플라워',     '감성',      '#fcf8f5', '#f5ece4', '#e5c17b', '#ffffff', 'gowun',   false, 'lifestyle', 'ballad',   '풀화면 골드 플로럴 아치와 로맨틱 톤'],
      ['s100_lf_wellness',    '웰니스 클린',       '감성',      '#eef3ee', '#f6f4ee', '#6ee7b7', '#ffffff', 'pretM',   false, 'lifestyle', 'lofi',     '풀화면 세이지 그린 호흡 링과 웰니스 자막'],
      ['s100_lf_pet',         '펫 다이어리',       '재미',      '#fffbeb', '#fef3c7', '#f59e0b', '#451a03', 'jua',     false, 'lifestyle', 'bright',   '풀화면 발자국 포인트와 버터크림 펫 자막'],
      ['s100_lf_boarding',    '여행 보딩패스',     '감성',      '#e0f2fe', '#bae6fd', '#0284c7', '#0f172a', 'pretM',   false, 'lifestyle', 'vlog',     '풀화면 항공권 게이트 헤더와 하단 바코드 패스'],

      ['s100_bz_showroom',    '쇼룸 스펙시트',     '고급',      '#0b0d12', '#161a24', '#94a3b8', '#f8fafc', 'pretM',   false, 'business',  'showroom', '풀화면 브러시드 메탈 스펙 헤더와 쇼룸 톤'],
      ['s100_bz_hud',         '시승기 계기판 HUD',  '테크',      '#060b14', '#0d1729', '#22d3ee', '#ecfeff', 'mono',    false, 'business',  'drive',    '풀화면 디지털 클러스터 RPM 계기판 HUD'],
      ['s100_bz_property',    '매물 카드',         '신뢰',      '#f8fafc', '#e2e8f0', '#0284c7', '#ffffff', 'pretM',   false, 'business',  'showroom', '풀화면 추천 매물 인증 배지와 부동산 브리핑'],
      ['s100_bz_report',      '분양 리포트',       '상담·정보', '#0c1a30', '#162b4d', '#e5c17b', '#f8fafc', 'maru',    false, 'business',  'news',     '풀화면 네이비·골드 리포트 헤더와 브리핑'],
      ['s100_bz_clinic',      '클리닉 신뢰 카드',   '신뢰',      '#f4fbfb', '#e6f5f5', '#14b8a6', '#ffffff', 'pretM',   false, 'business',  'ballad',   '풀화면 메디컬 틸 십자 배지와 신뢰 안내'],
      ['s100_bz_academy',     '학원 성적 그래프',   '상담·정보', '#0f1d3a', '#172c56', '#facc15', '#ffffff', 'dohyeon', false, 'business',  'bright',   '풀화면 우상향 상승 막대 그래프 오버레이'],
      ['s100_bz_bodypro',     '바디프로필',        '스포츠',    '#08080a', '#141418', '#ef4444', '#ffffff', 'gasoek',  false, 'business',  'edm',      '풀화면 강렬한 스튜디오 명암과 애슬레틱 틱'],
      ['s100_bz_timesale',    '타임세일 카운트다운','특가',      '#18090c', '#2b0d14', '#ef4444', '#fde047', 'gasoek',  false, 'business',  'edm',      '풀화면 실시간 카운트다운 특가 시계'],
      ['s100_bz_ceo',         '대표 인터뷰',       '신뢰',      '#121318', '#1c1e26', '#f59e0b', '#f8fafc', 'maru',    false, 'business',  'showroom', '풀화면 대형 인용부호와 리더 인사이트'],
      ['s100_bz_vip',         'VIP 초대장',       '고급',      '#0a090c', '#16131b', '#e5c17b', '#faf4e6', 'maru',    false, 'business',  'luxury',   '풀화면 샴페인 골드 VIP 왁스실 프레임']
    ];

    if (typeof s100RegisterStyles === 'function') s100RegisterStyles(STUDIO_100_B5_SPECS, 980);

    if (typeof STUDIO_100_RENDERERS !== 'undefined') {
      STUDIO_100_RENDERERS.s100_lf_glassskin = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(252,238,245,0.08)', botScrim: 'rgba(30,24,38,0.72)', botH: 320 });
        const sw = ((t * 140) % (W + 180)) - 90;
        const sheen = c.createLinearGradient(sw, 0, sw + 100, 180);
        sheen.addColorStop(0, 'rgba(255,255,255,0)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0.28)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = sheen; c.fillRect(0, 0, W, 200);
        c.strokeStyle = 'rgba(255,255,255,0.68)'; c.lineWidth = 2; gRoundRect(c, 18, 22, W - 36, H - 44, 26); c.stroke();
        c.fillStyle = '#ffffff'; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`GLASS GLOW · 0${cutIdx + 1}`, W / 2, 52);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 766, maxW: W - 88, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(236,72,153,0.55)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_beautyrev = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(31,20,28,0.82)', botH: 340 });
        gRoundRect(c, 24, 34, 178, 34, 17); c.fillStyle = accent; c.fill();
        c.fillStyle = '#ffffff'; c.font = `800 12.5px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('★ 만족도 98% PICK', 113, 51);
        c.fillStyle = 'rgba(255,255,255,0.28)'; gRoundRect(c, 30, 868, W - 60, 8, 4); c.fill();
        c.fillStyle = accent; gRoundRect(c, 30, 868, (W - 60) * 0.94 * ent, 8, 4); c.fill();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 762, maxW: W - 80, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_looktag = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(20,18,16,0.82)', botH: 340 });
        c.save(); c.translate(W - 72, 40); c.rotate(Math.sin(t * 1.8) * 0.05);
        c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -40); c.lineTo(0, 6); c.stroke();
        c.fillStyle = 'rgba(250,248,244,0.95)'; c.strokeStyle = '#18181b'; c.lineWidth = 1.5;
        gRoundRect(c, -36, 4, 72, 114, 6); c.fill(); c.stroke();
        c.fillStyle = '#18181b'; c.beginPath(); c.arc(0, 18, 4.5, 0, Math.PI * 2); c.fill();
        c.font = `800 10px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText('ITEM', 0, 52); c.font = `900 18px 'JetBrains Mono', monospace`; c.fillText(`0${cutIdx + 1}`, 0, 74);
        c.font = `600 9px 'JetBrains Mono', monospace`; c.fillText('SEASON', 0, 100); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 768, maxW: W - 84, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_roomtour = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(28,24,20,0.80)', botH: 320 });
        const pulse = 1 + Math.sin(t * 4) * 0.16;
        gRoundRect(c, 26, 38, 158, 34, 17); c.fillStyle = 'rgba(255,252,247,0.92)'; c.fill();
        c.fillStyle = accent; c.beginPath(); c.arc(44, 55, 4.5 * pulse, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#292524'; c.font = `700 11.5px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`SPACE TOUR · 0${cutIdx + 1}`, 56, 55);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 774, maxW: W - 80, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_beforeafter = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(14,17,22,0.88)', botH: 340 });
        const splitX = W * (0.5 + Math.sin(t * 1.3) * 0.12);
        c.fillStyle = 'rgba(14,17,22,0.22)'; c.fillRect(0, 0, splitX, H);
        c.fillStyle = '#ffffff'; c.fillRect(splitX - 1.5, 0, 3, H);
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(splitX, H * 0.44, 20, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#0e1116'; c.font = `900 12px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('◀ ▶', splitX, H * 0.44);
        gRoundRect(c, 22, 40, 88, 28, 14); c.fillStyle = 'rgba(14,17,22,0.80)'; c.fill();
        c.fillStyle = '#d4d4d8'; c.font = `800 11px 'JetBrains Mono', monospace`; c.fillText('BEFORE', 66, 54);
        gRoundRect(c, W - 110, 40, 88, 28, 14); c.fillStyle = accent; c.fill();
        c.fillStyle = '#0e1116'; c.fillText('AFTER', W - 66, 54);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 780, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_perfume = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 시그니처 타원 보틀 실루엣 (2/3 사각형 아님!)
        const cx = W / 2, cy = 416, rx = 218, ry = 286;
        c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.clip();
        inPhotoFade(c, S, cutIdx, local, cx - rx, cy - ry, rx * 2, ry * 2, 1.03 + lp * 0.04, 0); c.restore();
        c.strokeStyle = accent; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy, rx + 8, ry + 8, 0, 0, Math.PI * 2); c.stroke();
        c.fillStyle = accent; c.font = `600 11px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`EAU DE PARFUM · NOTE 0${cutIdx + 1}`, W / 2, 66);
        for (let i = 0; i < 6; i++) {
          c.fillStyle = 'rgba(229,193,123,0.48)'; c.beginPath(); c.arc(80 + ((i * 89) % (W - 160)), 110 + ((i * 107) % 520) + Math.sin(t + i) * 10, 2.5, 0, Math.PI * 2); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 794, maxW: W * 0.80, maxLines: 3, maxSize: 35, minSize: 22, color: '#faf3e6', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_wedding = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(252,248,245,0.10)', botScrim: 'rgba(42,32,26,0.78)', botH: 340 });
        const ax = 22, ay = 26, aw = W - 44, ah = H - 52, ar = aw / 2;
        c.strokeStyle = accent; c.lineWidth = 2.2;
        c.beginPath(); c.moveTo(ax, ay + ah); c.lineTo(ax, ay + ar); c.arc(ax + ar, ay + ar, ar, Math.PI, 0); c.lineTo(ax + aw, ay + ah); c.closePath(); c.stroke();
        c.fillStyle = '#fffaf3'; c.font = `600 11px 'Gowun Batang', serif`; c.textAlign = 'center';
        c.fillText(`FOREVER MOMENT · 0${cutIdx + 1}`, W / 2, 60);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 768, maxW: W - 92, maxLines: 3, maxSize: 38, minSize: 23, color: '#fffaf3', shadow: 'rgba(42,32,26,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_wellness = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(24,38,30,0.80)', botH: 340 });
        const breath = 1 + Math.sin(t * 1.6) * 0.03;
        c.strokeStyle = 'rgba(110,231,183,0.45)'; c.lineWidth = 2;
        gRoundRect(c, 24 / breath, 28 / breath, W - 48 / breath, H - 56 / breath, 210); c.stroke();
        c.fillStyle = accent; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`WELLNESS ROUTINE · 0${cutIdx + 1}`, W / 2, 58);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 768, maxW: W - 88, maxLines: 3, maxSize: 36, minSize: 22, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_pet = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(48,28,10,0.62)', botH: 300 });
        c.font = `26px sans-serif`; c.textAlign = 'center'; c.fillText('🐾', 46, 56); c.fillText('🐾', W - 46, 56);
        gRoundRect(c, W / 2 - 84, 34, 168, 32, 16); c.fillStyle = 'rgba(255,251,235,0.92)'; c.fill();
        c.fillStyle = '#92400e'; c.font = `700 13px 'Jua', sans-serif`; c.textBaseline = 'middle'; c.fillText(`오늘의 펫 일기 #0${cutIdx + 1}`, W / 2, 50);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 766, maxW: W - 88, maxLines: 3, maxSize: 38, minSize: 23, color: '#451a03', boxBg: 'rgba(255,251,235,0.95)', boxBorder: accent, boxRadius: 22, padX: 22, padY: 14, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_boarding = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(15,23,42,0.78)', botH: 320 });
        c.fillStyle = accent; c.fillRect(0, 0, W, 72);
        c.fillStyle = '#ffffff'; c.font = `900 17px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`BOARDING PASS  ✈`, 24, 38); c.textAlign = 'right'; c.font = `700 13px 'JetBrains Mono', monospace`; c.fillText(`GATE 0${cutIdx + 1}`, W - 24, 38);
        c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillRect(0, H - 54, W, 54);
        c.fillStyle = '#0f172a';
        for (let i = 0; i < 38; i++) c.fillRect(46 + i * 12, H - 40, i % 3 === 0 ? 5 : 2, 24);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 84, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      // ── 장르 10: 비즈니스 · 자동차 · 부동산 · 클리닉 (10종 — 100% 풀블리드!) ─
      STUDIO_100_RENDERERS.s100_bz_showroom = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(11,13,18,0.70)', botScrim: 'rgba(11,13,18,0.88)', botH: 340 });
        c.fillStyle = 'rgba(148,163,184,0.20)'; c.fillRect(24, 34, W - 48, 30);
        c.fillStyle = '#e2e8f0'; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`SHOWROOM SPEC // 0${cutIdx + 1}`, 36, 49); c.textAlign = 'right'; c.fillText('SIGNATURE LINE', W - 36, 49);
        if (caption && !capHidden) { c.fillStyle = accent; c.fillRect(28, 704, 52 * ent, 2.5); }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: 28, y: 780, maxW: W - 56, maxLines: 3, maxSize: 36, minSize: 22, color: '#f8fafc', align: 'left', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_hud = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(6,11,20,0.82)', botScrim: 'rgba(6,11,20,0.90)', botH: 340 });
        c.save(); c.strokeStyle = 'rgba(34,211,238,0.32)'; c.lineWidth = 4;
        c.beginPath(); c.arc(72, 78, 34, Math.PI * 0.75, Math.PI * 2.25); c.stroke();
        c.strokeStyle = accent; c.beginPath(); c.arc(72, 78, 34, Math.PI * 0.75, Math.PI * (0.75 + 1.2 * (0.5 + 0.3 * Math.sin(t * 2)))); c.stroke();
        c.fillStyle = '#ecfeff'; c.font = `900 14px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`${Math.round(62 + Math.sin(t * 1.8) * 18)}`, 72, 78);
        c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'right'; c.fillStyle = accent;
        c.fillText(`DRIVE · MODE D · 0${cutIdx + 1}`, W - 26, 70); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: W / 2, y: 774, maxW: W * 0.84, maxLines: 3, maxSize: 34, minSize: 21, color: '#ecfeff', shadow: accent, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_property = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(15,23,42,0.86)', botH: 340 });
        gRoundRect(c, 24, 34, 146, 34, 8); c.fillStyle = accent; c.fill();
        c.fillStyle = '#ffffff'; c.font = `800 12.5px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`추천 매물 · 0${cutIdx + 1}`, 97, 51);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 770, maxW: W - 76, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_report = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(12,26,48,0.78)', botScrim: 'rgba(12,26,48,0.90)', botH: 340 });
        c.fillStyle = accent; c.fillRect(26, 36, W - 52, 2);
        c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`EXECUTIVE REPORT 2026 · PART 0${cutIdx + 1}`, 26, 56);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: 28, y: 770, maxW: W - 56, maxLines: 3, maxSize: 36, minSize: 22, color: '#f8fafc', align: 'left', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_clinic = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(19,78,74,0.84)', botH: 340 });
        gRoundRect(c, 24, 34, 156, 34, 17); c.fillStyle = 'rgba(255,255,255,0.92)'; c.fill();
        c.fillStyle = accent; c.fillRect(38, 49, 12, 4); c.fillRect(42, 45, 4, 12);
        c.fillStyle = '#134e4a'; c.font = `800 12px Pretendard, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`CARE GUIDE 0${cutIdx + 1}`, 58, 51);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 770, maxW: W - 76, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.8)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_academy = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(15,29,58,0.88)', botH: 380 });
        [24, 38, 54, 72, 90].forEach((bh, i) => {
          const bx = 54 + i * 90, h = bh * ent;
          c.fillStyle = i === 4 ? accent : 'rgba(56,189,248,0.52)';
          gRoundRect(c, bx, H - 34 - h, 54, h, 6); c.fill();
        });
        c.fillStyle = accent; c.font = `900 13px 'JetBrains Mono', monospace`; c.textAlign = 'right';
        c.fillText('▲ SCORE UP!', W - 34, H - 134);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 740, maxW: W - 76, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_bodypro = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(8,8,10,0.92)', botH: 360 });
        c.fillStyle = accent;
        for (let i = 0; i < 6; i++) {
          c.fillRect(14, 120 + i * 24, i % 2 ? 12 : 22, 3);
          c.fillRect(W - (i % 2 ? 26 : 36), 120 + i * 24, i % 2 ? 12 : 22, 3);
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 774, maxW: W * 0.84, maxLines: 3, maxSize: 42, minSize: 25, color: '#ffffff', offsetColor: accent, offsetDx: 3, offsetDy: 3, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_timesale = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(24,9,12,0.88)', botH: 340 });
        const remSec = Math.max(0, 3599 - Math.floor(t));
        c.fillStyle = accent; gRoundRect(c, 22, 30, W - 44, 48, 12); c.fill();
        c.fillStyle = '#ffffff'; c.font = `900 13px Pretendard, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('⚡ TIME SALE 마감 임박', 38, 54);
        c.fillStyle = '#fde047'; c.font = `900 20px 'JetBrains Mono', monospace`; c.textAlign = 'right';
        c.fillText(`00:${String(Math.floor(remSec / 60)).padStart(2, '0')}:${String(remSec % 60).padStart(2, '0')}`, W - 38, 54);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 42, minSize: 25, color: '#fde047', strokeCol: '#18090c', strokeW: 7, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_ceo = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(18,19,24,0.68)', botScrim: 'rgba(18,19,24,0.88)', botH: 340 });
        c.fillStyle = accent; c.fillRect(28, 48, 34, 3);
        c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`FOUNDER INSIGHT · 0${cutIdx + 1}`, 72, 52);
        if (caption && !capHidden) {
          c.fillStyle = 'rgba(245,158,11,0.42)'; c.font = `900 76px 'Song Myung', serif`; c.textAlign = 'left'; c.fillText('“', 26, 720);
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 774, maxW: W - 96, maxLines: 3, maxSize: 36, minSize: 22, color: '#f8fafc', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_bz_vip = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(10,9,12,0.72)', botScrim: 'rgba(10,9,12,0.88)', botH: 340 });
        const shift = Math.sin(t * 1.1) * 160;
        const gold = c.createLinearGradient(shift, 0, W + shift, H);
        gold.addColorStop(0, '#9c7832'); gold.addColorStop(0.5, '#f6dfa1'); gold.addColorStop(1, '#8c6926');
        c.strokeStyle = gold; c.lineWidth = 3; c.strokeRect(18, 22, W - 36, H - 44);
        c.lineWidth = 1; c.strokeRect(26, 30, W - 52, H - 60);
        c.save(); c.translate(W / 2, 62);
        c.fillStyle = accent; c.beginPath(); c.arc(0, 0, 22, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#0a090c'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 17, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#0a090c'; c.font = `900 11px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VIP', 0, 1); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 768, maxW: W - 96, maxLines: 3, maxSize: 36, minSize: 22, color: '#faf4e6', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      };
    }
