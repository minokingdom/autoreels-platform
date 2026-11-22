// AutoReels — 07-studio-styles-105.js
// 스타일 100종 프로젝트 Batch 5 (81~100 / 100종 완성!):
// 장르 9 뷰티·패션·인테리어·라이프 (10종) + 장르 10 비즈니스·자동차·부동산·클리닉 (10종)

    const STUDIO_100_B5_SPECS = [
      // ── 장르 9: 뷰티 · 패션 · 인테리어 · 라이프 (10종) ────────────────────
      ['s100_lf_glassskin',   '글래스 스킨',       '감성',      '#f4f7fb', '#fceef5', '#ec4899', '#1e293b', 'gowun',   true,  'lifestyle', 'bright',   '투명 물광 유리 프레임과 진주빛 광택'],
      ['s100_lf_beautyrev',   '뷰티 리뷰카드',     '신뢰',      '#fff7f8', '#ffeef1', '#f43f5e', '#1f2937', 'pretM',   true,  'lifestyle', 'bright',   '98% 만족 뷰티 어워드 실과 촉촉 리뷰 카드'],
      ['s100_lf_looktag',     '룩북 태그',         '고급',      '#f3f1ed', '#e8e4dc', '#18181b', '#18181b', 'maru',    true,  'lifestyle', 'luxury',   '살랑 흔들리는 의류 행택과 미니멀 룩북'],
      ['s100_lf_roomtour',    '공간 투어',         '브이로그',   '#f2eee8', '#e6dfd4', '#854d0e', '#292524', 'gowun',   true,  'lifestyle', 'lofi',     '공간 핀 배지와 따뜻한 월넛 인테리어 프레임'],
      ['s100_lf_beforeafter', '비포&애프터 분할',   '비포·애프터','#0e1116', '#161b24', '#38bdf8', '#ffffff', 'dohyeon', false, 'lifestyle', 'urban',    '좌우 슬라이더 핸들과 BEFORE·AFTER 비교 프레임'],
      ['s100_lf_perfume',     '향수 에디토리얼',    '고급',      '#131110', '#1f1b18', '#e5c17b', '#faf3e6', 'maru',    false, 'lifestyle', 'luxury',   '타원 보틀 실루엣과 골드 링 아틀리에 무드'],
      ['s100_lf_wedding',     '웨딩 · 플라워',     '감성',      '#fcf8f5', '#f5ece4', '#b48c5a', '#3b2f26', 'gowun',   true,  'lifestyle', 'ballad',   '아이보리 청첩장 감성과 골드 플로럴 아치'],
      ['s100_lf_wellness',    '웰니스 클린',       '감성',      '#eef3ee', '#f6f4ee', '#3f7d58', '#1f2e24', 'pretM',   true,  'lifestyle', 'lofi',     '세이지 그린 캡슐 창과 호흡 링 웰니스'],
      ['s100_lf_pet',         '펫 다이어리',       '재미',      '#fffbeb', '#fef3c7', '#f59e0b', '#451a03', 'jua',     true,  'lifestyle', 'bright',   '귀여운 발자국 포인트와 버터크림 펫 일기'],
      ['s100_lf_boarding',    '여행 보딩패스',     '감성',      '#e0f2fe', '#bae6fd', '#0284c7', '#0f172a', 'pretM',   true,  'lifestyle', 'vlog',     '항공권 절취선과 게이트·바코드 트래블 패스'],

      // ── 장르 10: 비즈니스 · 자동차 · 부동산 · 클리닉 (10종) ───────────────
      ['s100_bz_showroom',    '쇼룸 스펙시트',     '고급',      '#0b0d12', '#161a24', '#94a3b8', '#f8fafc', 'pretM',   false, 'business',  'showroom', '티타늄 쇼룸 반사광과 브러시드 메탈 스펙 바'],
      ['s100_bz_hud',         '시승기 계기판 HUD',  '테크',      '#060b14', '#0d1729', '#22d3ee', '#ecfeff', 'mono',    false, 'business',  'drive',    '디지털 클러스터 RPM 게이지와 드라이브 HUD'],
      ['s100_bz_property',    '매물 카드',         '신뢰',      '#f8fafc', '#e2e8f0', '#0284c7', '#0f172a', 'pretM',   true,  'business',  'showroom', '추천 매물 인증 배지와 깔끔한 부동산 브리핑'],
      ['s100_bz_report',      '분양 리포트',       '상담·정보', '#0c1a30', '#162b4d', '#e5c17b', '#f8fafc', 'maru',    false, 'business',  'news',     '프리미엄 네이비·골드 리포트 커버 레이아웃'],
      ['s100_bz_clinic',      '클리닉 신뢰 카드',   '신뢰',      '#f4fbfb', '#e6f5f5', '#0d9488', '#134e4a', 'pretM',   true,  'business',  'ballad',   '메디컬 틸 십자 배지와 신뢰감 있는 안내 카드'],
      ['s100_bz_academy',     '학원 성적 그래프',   '상담·정보', '#0f1d3a', '#172c56', '#facc15', '#ffffff', 'dohyeon', false, 'business',  'bright',   '우상향 막대 그래프와 성적 상승 포인트'],
      ['s100_bz_bodypro',     '바디프로필',        '스포츠',    '#08080a', '#141418', '#ef4444', '#ffffff', 'gasoek',  false, 'business',  'edm',      '강렬한 스튜디오 명암과 애슬레틱 사이드 틱'],
      ['s100_bz_timesale',    '타임세일 카운트다운','특가',      '#18090c', '#2b0d14', '#ef4444', '#fde047', 'gasoek',  false, 'business',  'edm',      '실시간 흐르는 디지털 카운트다운 특가 시계'],
      ['s100_bz_ceo',         '대표 인터뷰',       '신뢰',      '#121318', '#1c1e26', '#d97706', '#f8fafc', 'maru',    false, 'business',  'showroom', '대형 인용부호와 리더 인사이트 매거진'],
      ['s100_bz_vip',         'VIP 초대장',       '고급',      '#0a090c', '#16131b', '#e5c17b', '#faf4e6', 'maru',    false, 'business',  'luxury',   '블랙·샴페인 골드 다이아몬드 VIP 왁스실 초대장']
    ];

    if (typeof s100RegisterStyles === 'function') s100RegisterStyles(STUDIO_100_B5_SPECS, 980);

    if (typeof STUDIO_100_RENDERERS !== 'undefined') {
      // ── 장르 9: 뷰티 · 패션 · 인테리어 · 라이프 (10종) ────────────────────
      STUDIO_100_RENDERERS.s100_lf_glassskin = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 진주빛 물방울 배경 글로우
        const gl = c.createRadialGradient(W * 0.25 + Math.sin(t) * 30, H * 0.18, 10, W * 0.25, H * 0.18, 220);
        gl.addColorStop(0, 'rgba(236,72,153,0.16)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = gl; c.fillRect(0, 0, W, H);
        const px = 38, py = 88, pw = W - 76, ph = 556;
        c.save();
        c.shadowColor = 'rgba(236,72,153,0.16)'; c.shadowBlur = 26; c.shadowOffsetY = 10;
        gRoundRect(c, px - 10, py - 10, pw + 20, ph + 20, 30); c.fillStyle = 'rgba(255,255,255,0.72)'; c.fill();
        c.restore();
        c.strokeStyle = 'rgba(255,255,255,0.92)'; c.lineWidth = 2; gRoundRect(c, px - 10, py - 10, pw + 20, ph + 20, 30); c.stroke();
        c.save(); gRoundRect(c, px, py, pw, ph, 22); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        // 상단 물광 하이라이트 스윕
        const sw = ((t * 140) % (pw + 180)) - 90;
        const sheen = c.createLinearGradient(px + sw, py, px + sw + 90, py + 120);
        sheen.addColorStop(0, 'rgba(255,255,255,0)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0.28)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = sheen; c.fillRect(px, py, pw, 160);
        c.restore();
        c.fillStyle = accent; c.font = `600 11px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`GLASS GLOW · STEP 0${cutIdx + 1}`, W / 2, 54);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 766, maxW: W - 92, maxLines: 3, maxSize: 31, minSize: 20, color: '#1e293b', boxBg: 'rgba(255,255,255,0.76)', boxRadius: 18, padX: 20, padY: 12, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_beautyrev = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 상단 뷰티 어워드 만족도 배지
        gRoundRect(c, 30, 36, 174, 32, 16); c.fillStyle = accent; c.fill();
        c.fillStyle = '#ffffff'; c.font = `800 12px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('★ 만족도 98% PICK', 117, 52);
        const px = 30, py = 84, pw = W - 60, ph = 532;
        c.save(); gRoundRect(c, px, py, pw, ph, 20); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 수분/지속력 게이지 바
        c.fillStyle = '#fecdd3'; gRoundRect(c, 30, 636, W - 60, 10, 5); c.fill();
        c.fillStyle = accent; gRoundRect(c, 30, 636, (W - 60) * 0.92 * ent, 10, 5); c.fill();
        c.fillStyle = '#9f1239'; c.font = `700 11px Pretendard, sans-serif`; c.textAlign = 'left'; c.fillText('추천 지수', 30, 662);
        c.textAlign = 'right'; c.fillText('98 / 100', W - 30, 662);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 774, maxW: W - 76, maxLines: 3, maxSize: 31, minSize: 20, color: '#1f2937', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_looktag = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent }) => {
        const px = 34, py = 84, pw = W - 68, ph = 564;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#18181b'; c.lineWidth = 1.5; c.strokeRect(px, py, pw, ph);
        // 우측 상단 살랑 흔들리는 의류 행택
        c.save();
        c.translate(W - 86, 84); c.rotate(Math.sin(t * 1.8) * 0.045);
        c.strokeStyle = '#57534e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -34); c.lineTo(0, 6); c.stroke();
        c.fillStyle = '#faf8f4'; c.strokeStyle = '#18181b'; c.lineWidth = 1.5;
        gRoundRect(c, -36, 4, 72, 114, 6); c.fill(); c.stroke();
        c.fillStyle = '#18181b'; c.beginPath(); c.arc(0, 18, 4.5, 0, Math.PI * 2); c.fill();
        c.font = `800 10px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText('ITEM', 0, 52); c.font = `900 18px 'JetBrains Mono', monospace`; c.fillText(`0${cutIdx + 1}`, 0, 74);
        c.font = `600 9px 'JetBrains Mono', monospace`; c.fillText('SEASON', 0, 100);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 768, maxW: W - 84, maxLines: 3, maxSize: 31, minSize: 20, color: '#18181b', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_roomtour = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 26, py = 74, pw = W - 52, ph = 594;
        c.save(); gRoundRect(c, px, py, pw, ph, 14); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 플로팅 공간 위치 핀
        const pulse = 1 + Math.sin(t * 4) * 0.16;
        gRoundRect(c, 42, 92, 152, 32, 16); c.fillStyle = 'rgba(255,252,247,0.92)'; c.fill();
        c.fillStyle = accent; c.beginPath(); c.arc(58, 108, 4.5 * pulse, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#292524'; c.font = `700 11.5px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`SPACE TOUR · 0${cutIdx + 1}`, 70, 108);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 782, maxW: W - 76, maxLines: 3, maxSize: 31, minSize: 20, color: '#292524', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_beforeafter = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.03 + lp * 0.04, 0);
        const splitX = W * (0.5 + Math.sin(t * 1.3) * 0.12);
        // 왼쪽 약간 톤다운 + 중앙 슬라이더 디바이더
        c.fillStyle = 'rgba(14,17,22,0.22)'; c.fillRect(0, 0, splitX, H);
        c.fillStyle = '#ffffff'; c.fillRect(splitX - 1.5, 0, 3, H);
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(splitX, H * 0.42, 20, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#0e1116'; c.font = `900 12px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('◀ ▶', splitX, H * 0.42);
        // 상단 BEFORE / AFTER 배지
        gRoundRect(c, 22, 40, 88, 28, 14); c.fillStyle = 'rgba(14,17,22,0.78)'; c.fill();
        c.fillStyle = '#d4d4d8'; c.font = `800 11px 'JetBrains Mono', monospace`; c.fillText('BEFORE', 66, 54);
        gRoundRect(c, W - 110, 40, 88, 28, 14); c.fillStyle = accent; c.fill();
        c.fillStyle = '#0e1116'; c.fillText('AFTER', W - 66, 54);
        const shade = c.createLinearGradient(0, H * 0.60, 0, H);
        shade.addColorStop(0, 'rgba(14,17,22,0)'); shade.addColorStop(1, 'rgba(14,17,22,0.88)');
        c.fillStyle = shade; c.fillRect(0, H * 0.60, W, H * 0.40);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 780, maxW: W * 0.84, maxLines: 3, maxSize: 35, minSize: 22, color: '#ffffff', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_perfume = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 타원 보틀 아틀리에 창 + 얇은 골드 링
        const cx = W / 2, cy = 376, rx = 204, ry = 266;
        c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.clip();
        inPhotoFade(c, S, cutIdx, local, cx - rx, cy - ry, rx * 2, ry * 2, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy, rx + 8, ry + 8, 0, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = 'rgba(229,193,123,0.32)'; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, rx + 18, ry + 18, 0, 0, Math.PI * 2); c.stroke();
        c.fillStyle = accent; c.font = `600 11px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`EAU DE PARFUM · NOTE 0${cutIdx + 1}`, W / 2, 62);
        // 은은한 미스트 입자
        for (let i = 0; i < 6; i++) {
          const sx = 80 + ((i * 89) % (W - 160)), sy = 100 + ((i * 107) % 520) + Math.sin(t + i) * 10;
          c.fillStyle = 'rgba(229,193,123,0.45)'; c.beginPath(); c.arc(sx, sy, 2.5, 0, Math.PI * 2); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 768, maxW: W * 0.80, maxLines: 3, maxSize: 31, minSize: 20, color: '#faf3e6', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_wedding = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(180,140,90,0.45)'; c.lineWidth = 1.5;
        c.strokeRect(20, 24, W - 40, H - 48);
        const ax = 48, ay = 94, aw = W - 96, ah = 540, ar = aw / 2;
        const arch = () => {
          c.beginPath(); c.moveTo(ax, ay + ah); c.lineTo(ax, ay + ar);
          c.arc(ax + ar, ay + ar, ar, Math.PI, 0); c.lineTo(ax + aw, ay + ah); c.closePath();
        };
        c.save(); arch(); c.clip();
        inPhotoFade(c, S, cutIdx, local, ax, ay, aw, ah, 1.02 + lp * 0.035, 0);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 2; arch(); c.stroke();
        c.fillStyle = accent; c.font = `600 11px 'Gowun Batang', serif`; c.textAlign = 'center';
        c.fillText(`FOREVER MOMENT · 0${cutIdx + 1}`, W / 2, 62);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 760, maxW: W - 104, maxLines: 3, maxSize: 31, minSize: 20, color: '#3b2f26', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_wellness = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const breath = 1 + Math.sin(t * 1.6) * 0.025;
        const px = 48, py = 86, pw = W - 96, ph = 548;
        c.save();
        c.strokeStyle = 'rgba(63,125,88,0.28)'; c.lineWidth = 2;
        gRoundRect(c, px - 12 * breath, py - 12 * breath, pw + 24 * breath, ph + 24 * breath, 200); c.stroke();
        c.restore();
        c.save(); gRoundRect(c, px, py, pw, ph, 190); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.02 + lp * 0.035, 0);
        c.restore();
        c.fillStyle = accent; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`WELLNESS ROUTINE · 0${cutIdx + 1}`, W / 2, 54);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 92, maxLines: 3, maxSize: 31, minSize: 20, color: '#1f2e24', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_pet = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 38, py = 88, pw = W - 76, ph = 540;
        c.save();
        c.shadowColor = 'rgba(245,158,11,0.22)'; c.shadowBlur = 22; c.shadowOffsetY = 8;
        gRoundRect(c, px - 10, py - 10, pw + 20, ph + 20, 28); c.fillStyle = '#ffffff'; c.fill();
        c.restore();
        c.save(); gRoundRect(c, px, py, pw, ph, 22); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.font = `24px sans-serif`; c.textAlign = 'center';
        c.fillText('🐾', 56, 60); c.fillText('🐾', W - 56, 60);
        c.fillStyle = accent; c.font = `700 14px 'Jua', sans-serif`; c.fillText(`오늘의 펫 일기 #0${cutIdx + 1}`, W / 2, 58);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'jua', x: W / 2, y: 762, maxW: W - 88, maxLines: 3, maxSize: 34, minSize: 21, color: '#451a03', boxBg: '#ffffff', boxRadius: 20, padX: 20, padY: 12, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_lf_boarding = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 항공권 티켓 카드
        gRoundRect(c, 24, 34, W - 48, H - 68, 22); c.fillStyle = '#ffffff'; c.fill();
        c.fillStyle = accent; gRoundRect(c, 24, 34, W - 48, 72, 22); c.fill();
        c.fillRect(24, 78, W - 48, 28);
        c.fillStyle = '#ffffff'; c.font = `900 18px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`BOARDING PASS  ✈`, 44, 70);
        c.textAlign = 'right'; c.font = `700 13px 'JetBrains Mono', monospace`; c.fillText(`GATE 0${cutIdx + 1}`, W - 44, 70);
        const px = 40, py = 124, pw = W - 80, ph = 504;
        c.save(); gRoundRect(c, px, py, pw, ph, 14); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 점선 절취선 + 양옆 반원 노치
        c.save(); c.setLineDash([7, 5]); c.strokeStyle = '#cbd5e1'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(42, 650); c.lineTo(W - 42, 650); c.stroke(); c.restore();
        c.fillStyle = '#bae6fd';
        c.beginPath(); c.arc(24, 650, 14, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(W - 24, 650, 14, 0, Math.PI * 2); c.fill();
        // 하단 미니 바코드
        c.fillStyle = '#0f172a';
        for (let i = 0; i < 36; i++) {
          c.fillRect(72 + i * 11, H - 66, i % 3 === 0 ? 5 : 2, 18);
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 760, maxW: W - 108, maxLines: 3, maxSize: 30, minSize: 19, color: '#0f172a', ent, capHidden });
      };

      // ── 장르 10: 비즈니스 · 자동차 · 부동산 · 클리닉 (10종) ───────────────
      STUDIO_100_RENDERERS.s100_bz_showroom = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 상단 브러시드 메탈 스펙 헤더
        c.fillStyle = 'rgba(148,163,184,0.16)'; c.fillRect(28, 40, W - 56, 30);
        c.fillStyle = accent; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`SHOWROOM SPEC // 0${cutIdx + 1}`, 40, 55);
        c.textAlign = 'right'; c.fillText('SIGNATURE LINE', W - 40, 55);
        const px = 28, py = 84, pw = W - 56, ph = 568;
        c.save(); gRoundRect(c, px, py, pw, ph, 10); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = 'rgba(148,163,184,0.45)'; c.lineWidth = 1.5; gRoundRect(c, px, py, pw, ph, 10); c.stroke();
        c.fillStyle = '#f8fafc'; c.fillRect(28, 678, 52 * ent, 2.5);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: 28, y: 774, maxW: W - 56, maxLines: 3, maxSize: 32, minSize: 20, color: '#f8fafc', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_hud = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.04 + lp * 0.04, 0);
        const topG = c.createLinearGradient(0, 0, 0, 170);
        topG.addColorStop(0, 'rgba(6,11,20,0.82)'); topG.addColorStop(1, 'rgba(6,11,20,0)');
        c.fillStyle = topG; c.fillRect(0, 0, W, 170);
        const botG = c.createLinearGradient(0, H * 0.58, 0, H);
        botG.addColorStop(0, 'rgba(6,11,20,0)'); botG.addColorStop(1, 'rgba(6,11,20,0.90)');
        c.fillStyle = botG; c.fillRect(0, H * 0.58, W, H * 0.42);
        // 좌우 디지털 계기판 아크 HUD
        c.save();
        c.strokeStyle = 'rgba(34,211,238,0.32)'; c.lineWidth = 4;
        c.beginPath(); c.arc(76, 84, 34, Math.PI * 0.75, Math.PI * 2.25); c.stroke();
        c.strokeStyle = accent;
        c.beginPath(); c.arc(76, 84, 34, Math.PI * 0.75, Math.PI * (0.75 + 1.2 * (0.4 + 0.5 * Math.sin(t * 2) * 0.5 + 0.3))); c.stroke();
        c.fillStyle = '#ecfeff'; c.font = `900 14px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`${Math.round(62 + Math.sin(t * 1.8) * 18)}`, 76, 84);
        c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'right'; c.fillStyle = accent;
        c.fillText(`DRIVE · MODE D · 0${cutIdx + 1}`, W - 28, 74);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: W / 2, y: 774, maxW: W * 0.84, maxLines: 3, maxSize: 31, minSize: 20, color: '#ecfeff', shadow: accent, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_property = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        gRoundRect(c, 28, 36, 146, 32, 8); c.fillStyle = accent; c.fill();
        c.fillStyle = '#ffffff'; c.font = `800 12px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`추천 매물 · 0${cutIdx + 1}`, 101, 52);
        const px = 28, py = 82, pw = W - 56, ph = 556;
        c.save(); gRoundRect(c, px, py, pw, ph, 16); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = 'rgba(2,132,199,0.28)'; c.lineWidth = 2; gRoundRect(c, px, py, pw, ph, 16); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 76, maxLines: 3, maxSize: 32, minSize: 20, color: '#0f172a', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_report = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        c.fillStyle = accent; c.fillRect(28, 42, W - 56, 2);
        c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`EXECUTIVE REPORT 2026 · PART 0${cutIdx + 1}`, 28, 62);
        const px = 28, py = 84, pw = W - 56, ph = 556;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 1.5; c.strokeRect(px, py, pw, ph);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: 28, y: 766, maxW: W - 56, maxLines: 3, maxSize: 32, minSize: 20, color: '#f8fafc', align: 'left', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_clinic = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 메디컬 십자 신뢰 엠블럼
        gRoundRect(c, 28, 36, 152, 32, 16); c.fillStyle = 'rgba(13,148,136,0.14)'; c.fill();
        c.fillStyle = accent; c.fillRect(42, 49, 12, 4); c.fillRect(46, 45, 4, 12);
        c.font = `800 12px Pretendard, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(`CARE GUIDE 0${cutIdx + 1}`, 62, 52);
        const px = 28, py = 84, pw = W - 56, ph = 556;
        c.save(); gRoundRect(c, px, py, pw, ph, 20); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = 'rgba(13,148,136,0.35)'; c.lineWidth = 2; gRoundRect(c, px, py, pw, ph, 20); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pretM', x: W / 2, y: 766, maxW: W - 76, maxLines: 3, maxSize: 31, minSize: 20, color: '#134e4a', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_academy = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 28, py = 74, pw = W - 56, ph = 532;
        c.save(); gRoundRect(c, px, py, pw, ph, 16); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 우상향 상승 막대 그래프
        const heights = [26, 40, 56, 74, 92];
        heights.forEach((bh, i) => {
          const bx = 54 + i * 90;
          const h = bh * ent;
          c.fillStyle = i === 4 ? accent : 'rgba(56,189,248,0.45)';
          gRoundRect(c, bx, 696 - h, 56, h, 6); c.fill();
        });
        c.fillStyle = accent; c.font = `900 13px 'JetBrains Mono', monospace`; c.textAlign = 'right';
        c.fillText('▲ SCORE UP!', W - 36, 628);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 794, maxW: W - 76, maxLines: 3, maxSize: 34, minSize: 21, color: '#ffffff', ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_bodypro = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.04 + lp * 0.04, 0);
        const shade = c.createLinearGradient(0, H * 0.56, 0, H);
        shade.addColorStop(0, 'rgba(8,8,10,0)'); shade.addColorStop(1, 'rgba(8,8,10,0.92)');
        c.fillStyle = shade; c.fillRect(0, H * 0.56, W, H * 0.44);
        // 좌우 애슬레틱 눈금 틱
        c.fillStyle = accent;
        for (let i = 0; i < 6; i++) {
          c.fillRect(14, 120 + i * 24, i % 2 ? 12 : 22, 3);
          c.fillRect(W - (i % 2 ? 26 : 36), 120 + i * 24, i % 2 ? 12 : 22, 3);
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 774, maxW: W * 0.84, maxLines: 3, maxSize: 38, minSize: 22, color: '#ffffff', offsetColor: accent, offsetDx: 3, offsetDy: 3, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_timesale = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        // 상단 실시간 카운트다운 디지털 시계
        const remSec = Math.max(0, 3599 - Math.floor(t));
        const mm = String(Math.floor(remSec / 60)).padStart(2, '0');
        const ss = String(remSec % 60).padStart(2, '0');
        c.fillStyle = accent; gRoundRect(c, 28, 30, W - 56, 48, 12); c.fill();
        c.fillStyle = '#ffffff'; c.font = `900 13px Pretendard, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('⚡ TIME SALE 마감 임박', 44, 54);
        c.fillStyle = '#fde047'; c.font = `900 20px 'JetBrains Mono', monospace`; c.textAlign = 'right';
        c.fillText(`00:${mm}:${ss}`, W - 44, 54);
        const px = 28, py = 92, pw = W - 56, ph = 548;
        c.save(); gRoundRect(c, px, py, pw, ph, 16); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.04 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#fde047'; c.lineWidth = 3; gRoundRect(c, px, py, pw, ph, 16); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 37, minSize: 22, color: '#fde047', strokeCol: '#18090c', strokeW: 6, ent, capHidden });
      };

      STUDIO_100_RENDERERS.s100_bz_ceo = ({ c, W, H, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const px = 32, py = 82, pw = W - 64, ph = 544;
        c.save(); gRoundRect(c, px, py, pw, ph, 12); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.fillStyle = accent; c.fillRect(32, 52, 34, 3);
        c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`FOUNDER INSIGHT · 0${cutIdx + 1}`, 76, 56);
        if (caption && !capHidden) {
          c.fillStyle = 'rgba(217,119,6,0.34)'; c.font = `900 72px 'Song Myung', serif`; c.textAlign = 'left';
          c.fillText('“', 30, 720);
          s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 774, maxW: W - 108, maxLines: 3, maxSize: 31, minSize: 20, color: '#f8fafc', ent, capHidden });
        }
      };

      STUDIO_100_RENDERERS.s100_bz_vip = ({ c, W, H, t, local, lp, S, cutIdx, caption, capHidden, ent, accent }) => {
        const shift = Math.sin(t * 1.1) * 160;
        const gold = c.createLinearGradient(shift, 0, W + shift, H);
        gold.addColorStop(0, '#9c7832'); gold.addColorStop(0.5, '#f6dfa1'); gold.addColorStop(1, '#8c6926');
        c.strokeStyle = gold; c.lineWidth = 2.5; c.strokeRect(20, 24, W - 40, H - 48);
        c.lineWidth = 1; c.strokeRect(28, 32, W - 56, H - 64);
        // 상단 중앙 VIP 왁스 실 엠블럼
        c.save(); c.translate(W / 2, 74);
        c.fillStyle = accent; c.beginPath(); c.arc(0, 0, 24, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#0a090c'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 19, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#0a090c'; c.font = `900 12px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('VIP', 0, 1);
        c.restore();
        const px = 46, py = 114, pw = W - 92, ph = 528;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = gold; c.lineWidth = 2; c.strokeRect(px, py, pw, ph);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 766, maxW: W - 108, maxLines: 3, maxSize: 31, minSize: 20, color: '#faf4e6', ent, capHidden });
      };
    }
