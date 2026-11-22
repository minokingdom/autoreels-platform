// AutoReels — 07-studio-styles-pm.js
// Prompt-Motion 스타일 시네마틱 모션그래픽 코레오그래피 8종 (100% 결정론적 seek(t) Canvas 2D · 60fps · 상업용 안전)
// 핵심 원칙: 단순 페이드/블러/글리치/흔들림 배제 → 셰이프 모핑 · 마스크 라인 자막 리빌 · 듀얼 스프링 스트레치 · 커서 인터랙션 · 벤토/아코디언 확장

    const PM_SHOWREEL_SPECS = [
      ['pm_keynote_morph',   '키노트 셰이프 모프',   '타이포',   '#f3efe6', '#eae4d7', '#d8432e', '#111111', 'paperlogy',  true,  'showreel', 'urban',  '알약 셰이프가 풀화면으로 모핑 확장 · 마스크 라인 자막'],
      ['pm_cursor_studio',   '커서 인터랙션 쇼릴',   '브이로그', '#f7f7f5', '#ecece8', '#2340e8', '#111111', 'gmarket',    true,  'showreel', 'vlog',   '미니멀 커서가 카드를 클릭하면 풀화면으로 물리 확장'],
      ['pm_stripe_slice',    '키네틱 스트라이프',    '타이포',   '#0e0e0e', '#17171a', '#2340e8', '#ffffff', 'aggro',      false, 'showreel', 'drive',  '고대비 가로 티커 리본이 화면을 가르며 새 장면 오픈'],
      ['pm_card_deck_cruise','스튜디오 카드 크루즈', '고급',     '#f2f3f6', '#e5e7ed', '#111111', '#111111', 'hahmlet',    true,  'showreel', 'cinema', '이전 카드가 물러나고 새 사진 카드가 렌즈 앞으로 부상'],
      ['pm_split_accordion', '아코디언 패널 모프',   '타이포',   '#111214', '#1a1b1f', '#d8432e', '#f3efe6', 'paperlogy',  false, 'showreel', 'funk',   '3단 비대칭 패널이 아코디언처럼 유려하게 펼쳐짐'],
      ['pm_grid_expand',     '벤토 그리드 익스팬드', '테크',     '#0b0d0c', '#141716', '#10b981', '#ffffff', 'orbit',      false, 'showreel', 'drive',  '애플 벤토 그리드 타일이 매끄럽게 풀화면으로 확장'],
      ['pm_iris_bloom',      '캡슐 블룸 어퍼처',     '감성',     '#f5f1e8', '#ebe4d6', '#2340e8', '#111111', 'diphylleia', true,  'showreel', 'lofi',   '가로 캡슐이 가로→세로 2단계 블룸으로 우아하게 오픈'],
      ['pm_paper_editorial', '에디토리얼 마스크 컷', '고급',     '#f3efe6', '#e8e2d5', '#d8432e', '#111111', 'diphylleia', true,  'showreel', 'jazz',   '갤러리 매트와 컬러 커튼이 밀어 올리는 화보 쇼릴']
    ];

    // 최상단 1군(isProReels: true)으로 등록해 디자인 서랍 상단과 '모션 쇼릴' 칩에서 바로 노출
    if (typeof DESIGN_STYLES !== 'undefined' && Array.isArray(DESIGN_STYLES)) {
      PM_SHOWREEL_SPECS.forEach((r, idx) => {
        if (DESIGN_STYLES.some((d) => d.id === r[0])) return;
        DESIGN_STYLES.push({
          id: r[0], name: r[1], cat: r[2], engine: 'motion', mstyle: r[0], genre: 'motion',
          bg1: r[3], bg2: r[4], accent: r[5], accent2: r[6], font: r[7], light: Boolean(r[8]),
          s100Genre: r[9], bgm: r[10], desc: r[11], label: r[1], insta: true,
          isProReels: true, isOpusArt: true, isStudio100: true, isPromptMotion: true,
          addedAt: '2026-11-23', seed: 1200 + idx
        });
      });
    }

    // S100_RICH_FONTS에도 연결
    if (typeof S100_RICH_FONTS === 'object' && S100_RICH_FONTS) {
      PM_SHOWREEL_SPECS.forEach((r) => { S100_RICH_FONTS[r[0]] = r[7]; });
    }

    // ── Prompt-Motion 전용 결정론적 물리/이징 헬퍼 ──
    function pmEaseIO(t) {
      const x = mClamp(t);
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    function pmEaseOut(t) {
      const x = mClamp(t);
      return 1 - Math.pow(1 - x, 4);
    }
    // 듀얼 스프링 스트레치 (앞쪽 경계가 먼저 도달하고 뒤쪽 경계가 따라와 쫀득한 액체 탄성 형성)
    function pmDualEdge(t, lag = 0.14) {
      return { lead: pmEaseIO(t), trail: pmEaseIO((t - lag) / Math.max(0.1, 1 - lag)) };
    }
    // 마스크 라인 수직 자막 리빌 (보이지 않는 가로 기준선 아래에서 위로 매끄럽게 솟아오름)
    function pmMaskCaption(c, W, H, caption, opts) {
      if (!caption || opts.capHidden) return;
      const { cutIdx, local, fontKey, x, y, maxW, maxLines = 3, maxSize = 42, minSize = 24, color = '#ffffff', align = 'center', delay = 0.22, dur = 0.52, pillBg = '', pillPadX = 20, pillPadY = 12, pillR = 14, shadow = '' } = opts;
      const resolvedKey = mCapFont(cutIdx, fontKey || 'paperlogy');
      if (typeof kitEnsureFont === 'function') kitEnsureFont(resolvedKey);
      const F = KIT_FONTS[resolvedKey] || KIT_FONTS.sans;
      const fit = mFit(c, caption, maxW, maxLines, maxSize, minSize, resolvedKey);
      if (!fit.lines.length) return;
      const fillCol = mCapColor(cutIdx, color);
      const totalH = fit.lines.length * fit.lh;
      const startY = y - totalH / 2 + fit.lh / 2;

      c.save();
      c.font = gFont(F.w || 800, fit.size, F.f);
      c.textAlign = align;
      c.textBaseline = 'middle';

      if (pillBg) {
        const pillP = pmEaseIO((local - delay * 0.6) / 0.42);
        if (pillP > 0.01) {
          let bw = 0;
          fit.lines.forEach((ln) => { bw = Math.max(bw, c.measureText(ln).width); });
          const rw = Math.min(maxW + pillPadX * 2, bw + pillPadX * 2) * (0.3 + 0.7 * pillP);
          const rh = totalH + pillPadY * 2;
          const rx = align === 'left' ? x - pillPadX : align === 'right' ? x - rw + pillPadX : x - rw / 2;
          const ry = startY - fit.lh / 2 - pillPadY;
          c.save();
          c.globalAlpha *= Math.min(1, pillP * 1.4);
          gRoundRect(c, rx, ry, rw, rh, pillR);
          c.fillStyle = pillBg;
          c.fill();
          c.restore();
        }
      }

      fit.lines.forEach((ln, li) => {
        const lp2 = pmEaseOut((local - delay - li * 0.09) / dur);
        if (lp2 <= 0.005) return;
        const ly = startY + li * fit.lh;
        const clipTop = ly - fit.lh * 0.62;
        const clipH = fit.lh * 1.24;
        c.save();
        c.beginPath();
        c.rect(0, clipTop, W, clipH);
        c.clip();
        if (shadow) { c.shadowColor = shadow; c.shadowBlur = 16; c.shadowOffsetY = 3; }
        c.fillStyle = fillCol;
        c.fillText(ln, x, ly + (1 - lp2) * fit.lh * 1.05, maxW);
        c.restore();
      });
      c.restore();
    }

    function pmDrawViewfinderHUD(c, W, H, cutIdx, totalCuts, color, accent, label) {
      c.save();
      c.strokeStyle = color;
      c.globalAlpha = 0.55;
      c.lineWidth = 1.5;
      const m = 24, arm = 16;
      // 4 corners [ ]
      c.beginPath();
      c.moveTo(m, m + arm); c.lineTo(m, m); c.lineTo(m + arm, m);
      c.moveTo(W - m - arm, m); c.lineTo(W - m, m); c.lineTo(W - m, m + arm);
      c.moveTo(m, H - m - arm); c.lineTo(m, H - m); c.lineTo(m + arm, H - m);
      c.moveTo(W - m - arm, H - m); c.lineTo(W - m, H - m); c.lineTo(W - m, H - m - arm);
      c.stroke();
      c.globalAlpha = 0.85;
      c.font = `700 11px 'JetBrains Mono', monospace`;
      c.fillStyle = color;
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(`${String(cutIdx + 1).padStart(2, '0')} / ${String(Math.max(1, totalCuts)).padStart(2, '0')}`, m + 22, m + 2);
      if (label) {
        c.textAlign = 'right';
        c.fillStyle = accent || color;
        c.fillText(String(label).toUpperCase().slice(0, 18), W - m - 22, m + 2);
      }
      c.restore();
    }

    function pmDrawCursor(c, x, y, press = 0) {
      c.save();
      c.translate(x, y);
      const sc = 1 - press * 0.16;
      c.scale(sc, sc);
      c.shadowColor = 'rgba(0,0,0,0.35)';
      c.shadowBlur = 10;
      c.shadowOffsetY = 3;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, 26);
      c.lineTo(7, 20);
      c.lineTo(13, 30);
      c.lineTo(17, 28);
      c.lineTo(11, 18);
      c.lineTo(20, 18);
      c.closePath();
      c.fillStyle = '#111111';
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2;
      c.stroke();
      c.restore();
    }

    function pmDrawPhotoInRect(c, S, offset, rx, ry, rw, rh, radius, zoom = 1.04, dx = 0, dy = 0) {
      c.save();
      if (radius > 0.5) { gRoundRect(c, rx, ry, rw, rh, radius); c.clip(); }
      else { c.beginPath(); c.rect(rx, ry, rw, rh); c.clip(); }
      mPhoto(c, S, offset, rx, ry, rw, rh, zoom, dx, dy);
      c.restore();
    }

    if (typeof STUDIO_100_RENDERERS === 'object' && STUDIO_100_RENDERERS) {

      // 1) 키노트 셰이프 모프: 중앙 알약 셰이프가 듀얼 스프링으로 확장되며 풀화면 사진 오픈 + 마스크 라인 자막
      STUDIO_100_RENDERERS.pm_keynote_morph = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, accent, brandName }) => {
        c.fillStyle = '#f3efe6'; c.fillRect(0, 0, W, H);
        const hasPrev = cutIdx > 0;
        const p = pmEaseIO(local / 0.92);
        const de = pmDualEdge(local / 0.92, 0.16);
        const gentleZ = 1.02 + lp * 0.04;

        if (hasPrev && p < 0.98) {
          // 이전 컷이 중앙 매트로 부드럽게 수축
          const prevW = W - p * 96, prevH = H - p * 160;
          pmDrawPhotoInRect(c, S, -1, (W - prevW) / 2, (H - prevH) / 2, prevW, prevH, p * 34, 1.04, 0, 0);
        }

        // 알약 셰이프(180x58) → 전체 풀블리드(W x H) 듀얼 스프링 2단 모핑
        const rw = 180 + (W - 180) * de.lead;
        const rh = 58 + (H - 58) * de.trail;
        const rx = (W - rw) / 2;
        const ry = (H - rh) / 2;
        const rad = Math.max(0, 32 * (1 - de.trail));

        if (de.trail < 0.18) {
          gRoundRect(c, rx, ry, rw, rh, rad);
          c.fillStyle = '#111111'; c.fill();
        }
        pmDrawPhotoInRect(c, S, 0, rx, ry, rw, rh, rad, gentleZ + (1 - de.trail) * 0.08, 0, 0);

        const bg = c.createLinearGradient(0, H * 0.56, 0, H);
        bg.addColorStop(0, 'rgba(17,17,17,0)'); bg.addColorStop(1, 'rgba(17,17,17,0.84)');
        c.fillStyle = bg; c.fillRect(0, H * 0.56, W, H * 0.44);

        // 상단 프로그레스 바 (매끄럽게 좌→우 드로잉)
        c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(24, 16, W - 48, 2.5);
        c.fillStyle = accent; c.fillRect(24, 16, (W - 48) * lp, 2.5);

        pmDrawViewfinderHUD(c, W, H, cutIdx, totalCuts, '#ffffff', accent, brandName);
        pmMaskCaption(c, W, H, caption, { cutIdx, local, fontKey: 'paperlogy', x: W / 2, y: 760, maxW: W * 0.84, maxLines: 3, maxSize: 42, minSize: 24, color: '#ffffff', delay: 0.34, dur: 0.52, shadow: 'rgba(0,0,0,0.65)', capHidden });
      };

      // 2) 커서 인터랙션 쇼릴: 미니멀 커서가 카드로 이동→클릭→카드가 풀화면으로 물리 확장
      STUDIO_100_RENDERERS.pm_cursor_studio = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, accent, brandName }) => {
        c.fillStyle = '#f7f7f5'; c.fillRect(0, 0, W, H);
        const moveP = pmEaseIO(local / 0.36);
        const clickT = mClamp((local - 0.36) / 0.16);
        const clickPress = clickT > 0 && clickT < 1 ? Math.sin(clickT * Math.PI) : 0;
        const expandP = pmEaseIO((local - 0.44) / 0.62);
        const gentleZ = 1.02 + lp * 0.04;

        // 배경 스튜디오 카드 독 (이전 컷 또는 부드러운 프레임)
        if (cutIdx > 0 && expandP < 0.98) {
          c.save(); c.globalAlpha = 1 - expandP * 0.85;
          pmDrawPhotoInRect(c, S, -1, 0, 0, W, H, 0, 1.03, 0, 0);
          c.fillStyle = 'rgba(247,247,245,0.55)'; c.fillRect(0, 0, W, H);
          c.restore();
        }

        // 클릭 대상 카드 → 클릭 후 풀블리드 확장
        const startW = W * 0.72, startH = H * 0.48;
        const pressSc = 1 - clickPress * 0.035;
        const cw = (startW + (W - startW) * expandP) * pressSc;
        const ch = (startH + (H - startH) * expandP) * pressSc;
        const cx0 = (W - cw) / 2;
        const cy0 = ((H * 0.46 - startH / 2) * (1 - expandP));
        const rad = Math.max(0, 26 * (1 - expandP));

        c.save();
        if (expandP < 0.95) {
          c.shadowColor = 'rgba(17,17,17,0.22)'; c.shadowBlur = 32 * (1 - expandP); c.shadowOffsetY = 14 * (1 - expandP);
        }
        gRoundRect(c, cx0, cy0, cw, ch, rad); c.fillStyle = '#111111'; c.fill();
        c.restore();
        pmDrawPhotoInRect(c, S, 0, cx0, cy0, cw, ch, rad, gentleZ, 0, 0);

        // 클릭 리플 & 미니멀 벡터 커서
        if (local < 0.82) {
          const curX = W * 0.82 + (W * 0.54 - W * 0.82) * moveP;
          const curY = H * 0.78 + (H * 0.48 - H * 0.78) * moveP;
          if (local > 0.36 && local < 0.75) {
            const rp = mClamp((local - 0.36) / 0.38);
            c.save();
            c.strokeStyle = accent; c.lineWidth = 2.5 * (1 - rp);
            c.globalAlpha = 1 - rp;
            c.beginPath(); c.arc(W * 0.54, H * 0.48, 8 + rp * 48, 0, Math.PI * 2); c.stroke();
            c.restore();
          }
          c.save(); c.globalAlpha = local > 0.60 ? Math.max(0, 1 - (local - 0.60) / 0.22) : 1;
          pmDrawCursor(c, curX, curY, clickPress);
          c.restore();
        }

        const bg = c.createLinearGradient(0, H * 0.58, 0, H);
        bg.addColorStop(0, 'rgba(17,17,17,0)'); bg.addColorStop(1, 'rgba(17,17,17,0.82)');
        c.fillStyle = bg; c.fillRect(0, H * 0.58, W, H * 0.42);
        pmDrawViewfinderHUD(c, W, H, cutIdx, totalCuts, '#ffffff', accent, brandName);
        pmMaskCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gmarket', x: W / 2, y: 766, maxW: W * 0.82, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', delay: 0.48, dur: 0.48, pillBg: 'rgba(17,17,17,0.78)', pillPadX: 22, pillPadY: 13, pillR: 16, capHidden });
      };

      // 3) 키네틱 스트라이프 슬라이스: 고대비 가로 리본이 쓸고 지나가며 중앙에서 상하로 새 사진 오픈
      STUDIO_100_RENDERERS.pm_stripe_slice = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, accent, brandName }) => {
        c.fillStyle = '#0e0e0e'; c.fillRect(0, 0, W, H);
        const p = pmEaseIO(local / 0.92);
        const de = pmDualEdge(local / 0.92, 0.14);
        const gentleZ = 1.02 + lp * 0.04;

        if (cutIdx > 0 && de.trail < 0.99) {
          pmDrawPhotoInRect(c, S, -1, 0, 0, W, H, 0, 1.03, 0, 0);
        }

        // 중앙에서 위·아래로 시원하게 펼쳐지는 슬라이스 오픈
        const openH = H * de.trail;
        const topY = (H - openH) / 2;
        pmDrawPhotoInRect(c, S, 0, 0, topY, W, Math.max(2, openH), 0, gentleZ + (1 - de.trail) * 0.06, 0, 0);

        // 전환 중 중앙 코발트/버밀리온 키네틱 리본 스윕
        const ribAlpha = p < 0.82 ? Math.sin(mClamp(p / 0.82) * Math.PI) : 0;
        if (ribAlpha > 0.02) {
          c.save();
          c.globalAlpha = ribAlpha * 0.92;
          const ribH = 44;
          c.fillStyle = accent;
          c.fillRect(0, H / 2 - ribH / 2, W * de.lead, ribH);
          c.fillStyle = '#ffffff';
          c.font = `800 16px 'JetBrains Mono', monospace`;
          c.textAlign = 'center'; c.textBaseline = 'middle';
          const tag = `SCENE ${String(cutIdx + 1).padStart(2, '0')}  ·  ${String(brandName || 'AUTOREELS').toUpperCase().slice(0, 14)}  ·  SCENE ${String(cutIdx + 1).padStart(2, '0')}`;
          c.fillText(tag, W / 2 + (1 - de.lead) * 60, H / 2);
          c.restore();
        }

        const bg = c.createLinearGradient(0, H * 0.56, 0, H);
        bg.addColorStop(0, 'rgba(14,14,14,0)'); bg.addColorStop(1, 'rgba(14,14,14,0.88)');
        c.fillStyle = bg; c.fillRect(0, H * 0.56, W, H * 0.44);
        pmDrawViewfinderHUD(c, W, H, cutIdx, totalCuts, '#ffffff', accent, brandName);
        pmMaskCaption(c, W, H, caption, { cutIdx, local, fontKey: 'aggro', x: W / 2, y: 760, maxW: W * 0.84, maxLines: 3, maxSize: 42, minSize: 24, color: '#ffffff', delay: 0.36, dur: 0.50, shadow: 'rgba(0,0,0,0.75)', capHidden });
      };

      // 4) 스튜디오 카드 크루즈: 스튜디오 플로어 위 이전 카드가 뒤로 밀리고 새 카드가 렌즈 앞으로 부상
      STUDIO_100_RENDERERS.pm_card_deck_cruise = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, accent, brandName }) => {
        const bgGrad = c.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.5, H * 0.75);
        bgGrad.addColorStop(0, '#f9fbfb'); bgGrad.addColorStop(1, '#e6e8ee');
        c.fillStyle = bgGrad; c.fillRect(0, 0, W, H);
        const p = pmEaseIO(local / 0.95);
        const gentleZ = 1.02 + lp * 0.035;

        // 이전 카드: 왼쪽 뒤로 차분하게 물러남
        if (cutIdx > 0 && p < 0.96) {
          const pw = W * (0.88 - 0.24 * p), ph = H * (0.74 - 0.16 * p);
          const px = (W - pw) / 2 - p * W * 0.65;
          const py = (H - ph) / 2 - 40 + p * 30;
          c.save(); c.globalAlpha = 1 - p * 0.85;
          c.shadowColor = 'rgba(0,0,0,0.14)'; c.shadowBlur = 24; c.shadowOffsetY = 12;
          gRoundRect(c, px, py, pw, ph, 24); c.fillStyle = '#ffffff'; c.fill();
          c.restore();
          pmDrawPhotoInRect(c, S, -1, px, py, pw, ph, 24, 1.03, 0, 0);
        }

        // 새 카드: 우측 원경에서 중앙 스튜디오 포컬 플레인으로 들어오며 풀블리드 가까이 확대
        const cw = W * (0.72 + 0.28 * p);
        const ch = H * (0.64 + 0.36 * p);
        const cx0 = (W - cw) / 2 + (1 - p) * W * 0.38;
        const cy0 = (H - ch) / 2 + (1 - p) * 40;
        const rad = Math.max(0, 28 * (1 - p));

        c.save();
        if (p < 0.96) {
          c.shadowColor = 'rgba(17,17,17,0.22)'; c.shadowBlur = 36 * (1 - p); c.shadowOffsetY = 18 * (1 - p);
          gRoundRect(c, cx0, cy0, cw, ch, rad); c.fillStyle = '#111111'; c.fill();
        }
        c.restore();
        pmDrawPhotoInRect(c, S, 0, cx0, cy0, cw, ch, rad, gentleZ, 0, 0);

        const bg = c.createLinearGradient(0, H * 0.56, 0, H);
        bg.addColorStop(0, 'rgba(17,17,17,0)'); bg.addColorStop(1, 'rgba(17,17,17,0.84)');
        c.fillStyle = bg; c.fillRect(0, H * 0.56, W, H * 0.44);
        pmDrawViewfinderHUD(c, W, H, cutIdx, totalCuts, '#ffffff', '#e5e7eb', brandName);
        pmMaskCaption(c, W, H, caption, { cutIdx, local, fontKey: 'hahmlet', x: W / 2, y: 764, maxW: W * 0.82, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', delay: 0.36, dur: 0.52, shadow: 'rgba(0,0,0,0.65)', capHidden });
      };

      // 5) 아코디언 패널 모프: 3개 세로 패널이 비대칭 아코디언 비율에서 풀화면으로 유려하게 펼쳐짐
      STUDIO_100_RENDERERS.pm_split_accordion = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, accent, brandName }) => {
        c.fillStyle = '#111214'; c.fillRect(0, 0, W, H);
        const p = pmEaseIO(local / 0.94);
        const gentleZ = 1.02 + lp * 0.04;

        if (cutIdx > 0 && p < 0.98) {
          pmDrawPhotoInRect(c, S, -1, 0, 0, W, H, 0, 1.03, 0, 0);
        }

        // 3개 패널이 순차적으로 폭을 넓히며 하나의 완전한 풀블리드 프레임으로 합체
        const activeCol = cutIdx % 3;
        const gap = Math.round(10 * (1 - p));
        const p0 = pmEaseIO(local / 0.78);
        const p1 = pmEaseIO((local - 0.10) / 0.80);
        const p2 = pmEaseIO((local - 0.18) / 0.80);
        const weights = [
          activeCol === 0 ? (0.52 + 0.48 * p0) : (0.24 * (1 - p1) + 0.33 * p1),
          activeCol === 1 ? (0.52 + 0.48 * p0) : (0.24 * (1 - p1) + 0.33 * p1),
          activeCol === 2 ? (0.52 + 0.48 * p0) : (0.24 * (1 - p2) + 0.33 * p2)
        ];
        const sumW = weights[0] + weights[1] + weights[2];
        let curX = 0;
        for (let i = 0; i < 3; i++) {
          const colW = (weights[i] / sumW) * W;
          const colP = i === activeCol ? p0 : (i === 1 ? p1 : p2);
          const curH = H * (0.22 + 0.78 * colP);
          const curY = (H - curH) / 2;
          const rx = curX + (i > 0 ? gap / 2 : 0);
          const rw = Math.max(2, colW - (i === 1 ? gap : gap / 2) + 1);
          c.save();
          gRoundRect(c, rx, curY, rw, curH, Math.max(0, 14 * (1 - p)));
          c.clip();
          mPhoto(c, S, 0, 0, 0, W, H, gentleZ + (1 - colP) * 0.06, 0, 0);
          c.restore();
          curX += colW;
        }

        const bg = c.createLinearGradient(0, H * 0.56, 0, H);
        bg.addColorStop(0, 'rgba(17,18,20,0)'); bg.addColorStop(1, 'rgba(17,18,20,0.88)');
        c.fillStyle = bg; c.fillRect(0, H * 0.56, W, H * 0.44);
        pmDrawViewfinderHUD(c, W, H, cutIdx, totalCuts, '#f3efe6', accent, brandName);
        pmMaskCaption(c, W, H, caption, { cutIdx, local, fontKey: 'paperlogy', x: W / 2, y: 762, maxW: W * 0.84, maxLines: 3, maxSize: 42, minSize: 24, color: '#f3efe6', delay: 0.38, dur: 0.50, shadow: 'rgba(0,0,0,0.75)', capHidden });
      };

      // 6) 벤토 그리드 익스팬드: 애플 스타일 벤토 타일에서 메인 타일이 풀화면으로 매끄럽게 확장
      STUDIO_100_RENDERERS.pm_grid_expand = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, accent, brandName }) => {
        c.fillStyle = '#0b0d0c'; c.fillRect(0, 0, W, H);
        const holdEnd = 0.24;
        const p = pmEaseIO((local - holdEnd) / 0.72);
        const introP = pmEaseOut(local / 0.35);
        const gentleZ = 1.02 + lp * 0.04;

        // 상단 2개 미니 벤토 카드 (확장하면서 위로 자연스럽게 퇴장)
        const topExitY = -p * 180;
        const cardAlpha = Math.max(0, 1 - p * 1.45) * introP;
        if (cardAlpha > 0.02) {
          c.save(); c.globalAlpha = cardAlpha;
          gRoundRect(c, 22, 26 + topExitY, (W - 56) * 0.54, 112, 18);
          c.fillStyle = '#161a18'; c.fill();
          c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1; c.stroke();
          c.fillStyle = accent; c.font = `700 11px 'JetBrains Mono', monospace`; c.textAlign = 'left'; c.textBaseline = 'top';
          c.fillText('ACTIVE FRAME', 38, 44 + topExitY);
          c.fillStyle = '#ffffff'; c.font = `800 32px 'JetBrains Mono', monospace`;
          c.fillText(`0${cutIdx + 1}`, 38, 68 + topExitY);

          const rx2 = 34 + (W - 56) * 0.54, rw2 = (W - 56) * 0.46;
          gRoundRect(c, rx2, 26 + topExitY, rw2, 112, 18);
          c.fillStyle = '#161a18'; c.fill(); c.stroke();
          c.fillStyle = '#a1a1aa'; c.font = `700 11px 'JetBrains Mono', monospace`;
          c.fillText('PROGRESS', rx2 + 16, 44 + topExitY);
          gRoundRect(c, rx2 + 16, 86 + topExitY, rw2 - 32, 8, 4);
          c.fillStyle = 'rgba(255,255,255,0.12)'; c.fill();
          gRoundRect(c, rx2 + 16, 86 + topExitY, (rw2 - 32) * Math.max(0.18, (cutIdx + 1) / Math.max(1, totalCuts)), 8, 4);
          c.fillStyle = accent; c.fill();
          c.restore();
        }

        // 메인 사진 벤토 타일 → 풀블리드 확장
        const bx = 22 * (1 - p);
        const by = 152 * (1 - p);
        const bw = W - 44 * (1 - p);
        const bh = (H - 290) + 290 * p;
        const rad = Math.max(0, 22 * (1 - p));
        pmDrawPhotoInRect(c, S, 0, bx, by, bw, bh, rad, gentleZ + (1 - p) * 0.04, 0, 0);

        const bg = c.createLinearGradient(0, H * 0.58, 0, H);
        bg.addColorStop(0, 'rgba(11,13,12,0)'); bg.addColorStop(1, 'rgba(11,13,12,0.88)');
        c.fillStyle = bg; c.fillRect(0, H * 0.58, W, H * 0.42);
        pmDrawViewfinderHUD(c, W, H, cutIdx, totalCuts, '#ffffff', accent, brandName);
        pmMaskCaption(c, W, H, caption, { cutIdx, local, fontKey: 'orbit', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 38, minSize: 23, color: '#ffffff', delay: 0.36, dur: 0.50, shadow: 'rgba(0,0,0,0.8)', capHidden });
      };

      // 7) 캡슐 블룸 어퍼처: 가로 캡슐이 먼저 좌우로 열리고 이어서 상하로 블룸 확장 (2단계 애플 키노트 모션)
      STUDIO_100_RENDERERS.pm_iris_bloom = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, accent, brandName }) => {
        c.fillStyle = '#f5f1e8'; c.fillRect(0, 0, W, H);
        const stageW = pmEaseIO(local / 0.52);
        const stageH = pmEaseIO((local - 0.24) / 0.70);
        const gentleZ = 1.02 + lp * 0.04;

        if (cutIdx > 0 && stageH < 0.98) {
          pmDrawPhotoInRect(c, S, -1, 0, 0, W, H, 0, 1.03, 0, 0);
        }

        const cw = 90 + (W - 90) * stageW;
        const ch = 48 + (H - 48) * stageH;
        const cx0 = (W - cw) / 2;
        const cy0 = (H - ch) / 2;
        const rad = Math.max(0, Math.min(cw, ch) * 0.48 * (1 - stageH));

        pmDrawPhotoInRect(c, S, 0, cx0, cy0, cw, ch, rad, gentleZ + (1 - stageH) * 0.06, 0, 0);

        const bg = c.createLinearGradient(0, H * 0.58, 0, H);
        bg.addColorStop(0, 'rgba(18,16,14,0)'); bg.addColorStop(1, 'rgba(18,16,14,0.82)');
        c.fillStyle = bg; c.fillRect(0, H * 0.58, W, H * 0.42);
        pmDrawViewfinderHUD(c, W, H, cutIdx, totalCuts, '#ffffff', '#f5f1e8', brandName);
        pmMaskCaption(c, W, H, caption, { cutIdx, local, fontKey: 'diphylleia', x: W / 2, y: 764, maxW: W * 0.82, maxLines: 3, maxSize: 42, minSize: 24, color: '#ffffff', delay: 0.42, dur: 0.52, shadow: 'rgba(0,0,0,0.65)', capHidden });
      };

      // 8) 에디토리얼 마스크 컷: 웜 페이퍼 + 버밀리온 컬러 매트가 밀어 올리며 새 화보 사진 언베일
      STUDIO_100_RENDERERS.pm_paper_editorial = ({ c, W, H, local, lp, S, cutIdx, totalCuts, caption, capHidden, accent, brandName }) => {
        c.fillStyle = '#f3efe6'; c.fillRect(0, 0, W, H);
        const de = pmDualEdge(local / 0.94, 0.18);
        const gentleZ = 1.02 + lp * 0.035;

        if (cutIdx > 0 && de.trail < 0.98) {
          pmDrawPhotoInRect(c, S, -1, 0, 0, W, H, 0, 1.03, 0, 0);
        }

        // 1단: 버밀리온 에디토리얼 커튼이 먼저 아래→위로 쓸고 올라감
        const curtainTop = H * (1 - de.lead);
        const photoTop = H * (1 - de.trail);
        if (photoTop > curtainTop + 1) {
          c.fillStyle = accent;
          c.fillRect(0, curtainTop, W, photoTop - curtainTop + 2);
        }
        // 2단: 커튼 뒤를 따라 새 사진이 매끄럽게 언베일
        pmDrawPhotoInRect(c, S, 0, 0, photoTop, W, Math.max(1, H - photoTop), 0, gentleZ + (1 - de.trail) * 0.05, 0, 0);

        const bg = c.createLinearGradient(0, H * 0.56, 0, H);
        bg.addColorStop(0, 'rgba(17,17,17,0)'); bg.addColorStop(1, 'rgba(17,17,17,0.84)');
        c.fillStyle = bg; c.fillRect(0, H * 0.56, W, H * 0.44);
        pmDrawViewfinderHUD(c, W, H, cutIdx, totalCuts, '#f3efe6', accent, brandName);
        pmMaskCaption(c, W, H, caption, { cutIdx, local, fontKey: 'diphylleia', x: W / 2, y: 760, maxW: W * 0.82, maxLines: 3, maxSize: 42, minSize: 24, color: '#f3efe6', delay: 0.40, dur: 0.52, shadow: 'rgba(0,0,0,0.65)', capHidden });
      };

    }
