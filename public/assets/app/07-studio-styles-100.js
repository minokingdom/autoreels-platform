// AutoReels — 07-studio-styles-100.js
// 100% 자체 제작 9:16 프로시저럴 캔버스 스타일 엔진 (상업용 안전 · 60fps 경량 캐시 · 컷 편집 호환)
// Batch 1 (20종): 회화·일러스트 아트 10종 + 레트로·아날로그 필름 10종

    const STUDIO_100_SPECS = [
      // ── 장르 1: 회화 · 일러스트 아트 (10종) ──────────────────────────────
      ['s100_art_watercolor',   '수채화 번짐',      '손글씨', '#f7f3ea', '#ece3d2', '#2b7a78', '#22211f', 'gowun',   true,  'art',  'lofi',   '수채 물감 번짐과 찢은 종이 프레임'],
      ['s100_art_ukiyoe',       '우키요에 목판화',   '감성',   '#efe4cd', '#e3d4b4', '#b83227', '#1a2738', 'maru',    true,  'art',  'ballad', '전통 목판화 파도 문양과 인장 프레임'],
      ['s100_art_oil',          '유화 붓터치',      '고급',   '#1b1713', '#2a221b', '#d4a656', '#f7efe1', 'maru',    false, 'art',  'jazz',   '캔버스 질감과 미술관 금장 액자'],
      ['s100_art_sumi',         '수묵화 먹물',      '손글씨', '#f2ede2', '#e5dfd1', '#b22c24', '#181818', 'brush',   true,  'art',  'ballad', '한지 먹물 번짐과 붉은 낙관'],
      ['s100_art_risograph',    '리소그래프 판화',   '타이포', '#f5efe4', '#ebe2d3', '#e63975', '#1b3bb5', 'dohyeon', true,  'art',  'funk',   '형광 핑크·코발트 핀 어긋남 판화'],
      ['s100_art_pastel',       '파스텔 초크',      '감성',   '#fbf3f7', '#f0e8fb', '#d96b98', '#33283c', 'gaegu',   true,  'art',  'bright', '부드러운 파스텔 리본과 초크 아치'],
      ['s100_art_botanical',    '보태니컬 스케치',   '감성',   '#f4f0e6', '#e9e3d5', '#3d6b4e', '#232e26', 'gowun',   true,  'art',  'lofi',   '식물 도감 라인 일러스트와 아치 창'],
      ['s100_art_stainedglass', '스테인드글라스',    '고급',   '#0d0e14', '#161826', '#f2b84b', '#faf3e0', 'maru',    false, 'art',  'cinema', '고딕 성당 모자이크 유리와 금빛 아치'],
      ['s100_art_pencil',       '색연필 드로잉',    '손글씨', '#f7f4ec', '#eee9dc', '#d64545', '#242933', 'pen',     true,  'art',  'bright', '스케치북 해칭과 손그림 이중 테두리'],
      ['s100_art_acrylic',      '아크릴 나이프',    '타이포', '#141318', '#1d1b24', '#facc15', '#ffffff', 'gasoek',  false, 'art',  'urban',  '두꺼운 페인트 나이프 붓터치 갤러리'],

      // ── 장르 2: 레트로 · 아날로그 필름 (10종) ────────────────────────────
      ['s100_film_super8',      '슈퍼 8mm 필름',    '감성',   '#0e0c0a', '#1a1511', '#f5a623', '#f7ebd5', 'mono',    false, 'film', 'lofi',   '8mm 영사기 둥근 게이트와 스프로킷'],
      ['s100_film_vhs',         'VHS 캠코더',       '브이로그','#0b0d14', '#131826', '#38bdf8', '#ffffff', 'mono',    false, 'film', 'vlog',   '90년대 캠코더 타임코드와 트래킹 노이즈'],
      ['s100_film_kodak35',     '코닥 35mm 필름',   '감성',   '#100f0d', '#1c1814', '#f2a93b', '#faf3e6', 'gowun',   false, 'film', 'cinema', '양쪽 35mm 필름 구멍과 웜 포트라 톤'],
      ['s100_film_polaroid',    '폴라로이드 일기',   '감성',   '#e8e0d2', '#dcd1be', '#c95f44', '#221f1c', 'pen',     true,  'film', 'lofi',   '마스킹 테이프와 손글씨 즉석 사진'],
      ['s100_film_crt',         'CRT 브라운관',     '테크',   '#090d11', '#101820', '#4ade80', '#d1fae5', 'mono',    false, 'film', 'drive',  '곡면 모니터 베젤과 그린 포스포 자막'],
      ['s100_film_newspaper',   '신문 1면 헤드라인', '뉴스·방송','#ece6d8','#dfd7c5', '#b91c1c', '#141414', 'maru',    true,  'film', 'news',   '클래식 일간지 1면 지면과 흑백 보도사진'],
      ['s100_film_poster',      '빈티지 포스터',    '타이포', '#1c2331', '#253045', '#e05336', '#f5ebd6', 'dohyeon', false, 'film', 'funk',   '미드센추리 여행·영화 포스터 레이아웃'],
      ['s100_film_cassette',    '카세트 테이프',    '재미',   '#161820', '#232634', '#f97316', '#fff7ed', 'dohyeon', false, 'film', 'funk',   '회전 릴 데크와 오렌지 믹스테이프 라벨'],
      ['s100_film_90smag',      '90년대 잡지',      '재미',   '#141219', '#241a2e', '#facc15', '#ffffff', 'gasoek',  false, 'film', 'urban',  '90년대 스트릿 매거진 커버와 특집 스티커'],
      ['s100_film_docu',        '다큐멘터리 필름',   '고급',   '#09090b', '#131317', '#d9b566', '#f4f4f5', 'maru',    false, 'film', 'cinema', '2.39:1 시네마 레터박스와 챕터 하단 자막']
    ];

    const STUDIO_100_RENDERERS = {};
    function s100RegisterStyles(specs, seedOffset = 900) {
      if (typeof DESIGN_STYLES === 'undefined' || !Array.isArray(DESIGN_STYLES)) return;
      specs.forEach((r, idx) => {
        if (DESIGN_STYLES.some((d) => d.id === r[0])) return;
        DESIGN_STYLES.push({
          id: r[0],
          name: r[1],
          cat: r[2],
          engine: 'motion',
          mstyle: r[0],
          genre: 'motion',
          bg1: r[3],
          bg2: r[4],
          accent: r[5],
          accent2: r[6],
          font: r[7],
          light: Boolean(r[8]),
          s100Genre: r[9],
          bgm: r[10],
          desc: r[11],
          label: r[1],
          insta: true,
          isOpusArt: true,
          isStudio100: true,
          addedAt: '2026-11-22',
          seed: seedOffset + idx
        });
      });
    }
    s100RegisterStyles(STUDIO_100_SPECS, 900);

    // ── 경량 캐시 패턴 (한 번만 생성, 60fps 유지) ──────────────────────────
    const _s100TexCache = {};
    function s100Pattern(c, kind) {
      if (_s100TexCache[kind]) return _s100TexCache[kind];
      const off = document.createElement('canvas');
      if (kind === 'paper') {
        off.width = 128; off.height = 128;
        const g = off.getContext('2d');
        for (let i = 0; i < 420; i++) {
          const x = (i * 73) % 128, y = (i * 41) % 128;
          g.fillStyle = i % 2 ? 'rgba(110,90,60,0.045)' : 'rgba(255,255,255,0.06)';
          g.fillRect(x, y, 2, 2);
        }
        g.strokeStyle = 'rgba(120,100,70,0.03)';
        for (let y = 0; y < 128; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
      } else if (kind === 'canvas') {
        off.width = 64; off.height = 64;
        const g = off.getContext('2d');
        g.strokeStyle = 'rgba(255,245,225,0.05)';
        for (let i = 0; i < 64; i += 4) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke();
        }
      } else if (kind === 'halftone') {
        off.width = 16; off.height = 16;
        const g = off.getContext('2d');
        g.fillStyle = 'rgba(20,25,40,0.075)';
        g.beginPath(); g.arc(4, 4, 1.5, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(12, 12, 1.5, 0, Math.PI * 2); g.fill();
      } else if (kind === 'scanline') {
        off.width = 8; off.height = 6;
        const g = off.getContext('2d');
        g.fillStyle = 'rgba(0,0,0,0.22)';
        g.fillRect(0, 0, 8, 2);
      } else {
        off.width = 96; off.height = 96;
        const g = off.getContext('2d');
        for (let i = 0; i < 240; i++) {
          g.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
          g.fillRect((i * 53) % 96, (i * 29) % 96, 1.5, 1.5);
        }
      }
      const pat = c.createPattern(off, 'repeat');
      _s100TexCache[kind] = pat;
      return pat;
    }

    function s100DecklePath(c, x, y, w, h, seed) {
      c.beginPath();
      const step = 16;
      const jit = (i, k) => Math.sin(i * 1.9 + seed * 3.1 + k) * 3.4 + Math.cos(i * 3.7 + k) * 1.8;
      c.moveTo(x, y);
      for (let px = x + step; px < x + w; px += step) c.lineTo(px, y + jit(px, 1));
      c.lineTo(x + w, y);
      for (let py = y + step; py < y + h; py += step) c.lineTo(x + w + jit(py, 2), py);
      c.lineTo(x + w, y + h);
      for (let px = x + w - step; px > x; px -= step) c.lineTo(px, y + h + jit(px, 3));
      c.lineTo(x, y + h);
      for (let py = y + h - step; py > y; py -= step) c.lineTo(x + jit(py, 4), py);
      c.closePath();
    }

    function s100DrawCaption(c, W, H, caption, opts) {
      if (!caption || opts.capHidden) return;
      const { cutIdx, local, fontKey, x, y, maxW, maxLines, maxSize, minSize, color, align = 'center', shadow, boxBg, boxRadius = 10, padX = 16, padY = 10, strokeCol, strokeW = 0, offsetColor, offsetDx = 0, offsetDy = 0, ent = 1 } = opts;
      const F = KIT_FONTS[mCapFont(cutIdx, fontKey)] || KIT_FONTS.sans;
      const fit = mFit(c, caption, maxW, maxLines || 3, maxSize || 34, minSize || 20, fontKey);
      if (!fit.lines.length) return;
      const fillCol = mCapColor(cutIdx, color);
      const totalH = fit.lines.length * fit.lh;
      const startY = y - totalH / 2 + fit.lh / 2;

      c.save();
      c.globalAlpha *= Math.min(1, ent * 1.25);
      c.font = gFont(F.w || 700, fit.size, F.f);
      c.textAlign = align;
      c.textBaseline = 'middle';

      if (boxBg) {
        let bw = 0;
        fit.lines.forEach((ln) => { bw = Math.max(bw, c.measureText(ln).width); });
        const rw = Math.min(maxW + padX * 2, bw + padX * 2);
        const rh = totalH + padY * 2;
        const rx = align === 'left' ? x - padX : align === 'right' ? x - rw + padX : x - rw / 2;
        const ry = startY - fit.lh / 2 - padY;
        gRoundRect(c, rx, ry, rw, rh, boxRadius);
        c.fillStyle = boxBg;
        c.fill();
      }

      if (shadow) {
        c.shadowColor = shadow;
        c.shadowBlur = 14;
        c.shadowOffsetY = 3;
      }

      fit.lines.forEach((ln, li) => {
        const lineEnt = mEase((local - li * 0.08) / 0.32);
        const ly = startY + li * fit.lh + (1 - lineEnt) * 14;
        c.save();
        c.globalAlpha *= Math.min(1, lineEnt * 1.35);
        if (offsetColor) {
          c.fillStyle = offsetColor;
          c.fillText(ln, x + offsetDx, ly + offsetDy, maxW);
        }
        if (strokeCol && strokeW > 0) {
          c.lineJoin = 'round';
          c.lineWidth = strokeW;
          c.strokeStyle = strokeCol;
          c.strokeText(ln, x, ly, maxW);
        }
        c.fillStyle = fillCol;
        c.fillText(ln, x, ly, maxW);
        c.restore();
      });
      c.restore();
    }

    function arRenderStudio100Frame(c, W, H, t, mainDuration, totalCuts, d, sp) {
      const cutDur = Math.max(0.5, mainDuration / Math.max(1, totalCuts));
      const cutIdx = Math.min(totalCuts - 1, Math.floor(t / cutDur));
      const local = Math.max(0, t - cutIdx * cutDur);
      const lp = mClamp(local / cutDur);
      const M = sp.mstyle;
      const S = kitScene(t, mainDuration, false);
      const rawCap = (campaign.cutCaptions && campaign.cutCaptions[cutIdx]) || campaign.hook || '';
      const capOv = mCapOv(cutIdx);
      const caption = capOv.hidden ? '' : gCleanCaption(rawCap);
      const _ov = typeof getCutElementOverride === 'function' ? getCutElementOverride(cutIdx) : null;
      const capHidden = Boolean(_ov && _ov.caption && (_ov.caption.hidden || (typeof isCutElementPropCustomized === 'function' && isCutElementPropCustomized(_ov.caption))));
      const ent = 1 - Math.pow(1 - mClamp(local / 0.42), 3);
      const rem = 1 - ent;
      const accent = sp.accent || '#d97706';
      const fg = sp.accent2 || (sp.light ? '#18181b' : '#ffffff');
      const brandName = (d && (d.branch || d.name)) || (typeof IND !== 'undefined' && IND.place) || 'AUTOREELS';

      c.save();
      const bgGrad = c.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, sp.bg1 || '#111216');
      bgGrad.addColorStop(1, sp.bg2 || sp.bg1 || '#1a1c24');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, W, H);

      if (typeof STUDIO_100_RENDERERS[M] === 'function') {
        STUDIO_100_RENDERERS[M]({ c, W, H, t, mainDuration, totalCuts, d, sp, cutDur, cutIdx, local, lp, S, caption, capHidden, ent, rem, accent, fg, brandName });
        c.restore();
        return;
      }

      // ════════════════════════════════════════════════════════════════════
      // 장르 1: 회화 · 일러스트 아트 (10종)
      // ════════════════════════════════════════════════════════════════════
      if (M === 's100_art_watercolor') {
        // 1. 수채화 번짐: 코튼 페이퍼 + 부드럽게 번지는 수채 얼룩 + 찢은 종이 덱클 프레임
        c.fillStyle = s100Pattern(c, 'paper');
        c.fillRect(0, 0, W, H);
        const blooms = [
          [W * 0.16, H * 0.13, 190, 'rgba(43,122,120,0.16)'],
          [W * 0.86, H * 0.24, 175, 'rgba(232,126,105,0.16)'],
          [W * 0.20, H * 0.84, 210, 'rgba(227,178,76,0.17)'],
          [W * 0.82, H * 0.78, 180, 'rgba(92,138,176,0.15)']
        ];
        blooms.forEach(([bx, by, br, col], i) => {
          const pulse = 1 + Math.sin(t * 0.8 + i * 1.4) * 0.06;
          const rg = c.createRadialGradient(bx, by, 10, bx, by, br * pulse);
          rg.addColorStop(0, col); rg.addColorStop(0.68, col.replace(/0\.\d+\)/, '0.06)')); rg.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = rg; c.beginPath(); c.arc(bx, by, br * pulse, 0, Math.PI * 2); c.fill();
        });
        const px = 42, py = 128 + rem * 18, pw = W - 84, ph = 528;
        c.save();
        c.shadowColor = 'rgba(43,122,120,0.22)'; c.shadowBlur = 24; c.shadowOffsetY = 8;
        s100DecklePath(c, px, py, pw, ph, cutIdx + 1);
        c.fillStyle = '#ffffff'; c.fill();
        c.restore();
        c.save();
        s100DecklePath(c, px + 8, py + 8, pw - 16, ph - 16, cutIdx + 1);
        c.clip();
        inPhotoFade(c, S, cutIdx, local, px + 8, py + 8, pw - 16, ph - 16, 1.03 + lp * 0.04, 0);
        const glaze = c.createLinearGradient(px, py, px + pw, py + ph);
        glaze.addColorStop(0, 'rgba(255,244,225,0.10)'); glaze.addColorStop(1, 'rgba(43,122,120,0.12)');
        c.fillStyle = glaze; c.fillRect(px, py, pw, ph);
        c.restore();
        c.font = `600 12px 'Gowun Batang', serif`; c.fillStyle = 'rgba(43,122,120,0.75)'; c.textAlign = 'center';
        c.fillText(`WATERCOLOR · NO. 0${cutIdx + 1}`, W / 2, 92);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 748, maxW: W * 0.80, maxLines: 3, maxSize: 33, minSize: 21, color: '#22211f', ent });

      } else if (M === 's100_art_ukiyoe') {
        // 2. 우키요에 목판화: 한지 바탕 + 세이가이하(청해파) 파도 패턴 + 이중 남색/주홍 판화 테두리 + 우측 상단 붉은 판화 인장
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        // 하단 전통 파도 아크 장식
        c.save();
        c.strokeStyle = 'rgba(26,58,92,0.18)'; c.lineWidth = 2;
        for (let row = 0; row < 4; row++) {
          const wy = H - 18 - row * 28;
          const offX = (row % 2) * 36;
          for (let wx = -36 + offX; wx < W + 72; wx += 72) {
            for (let r = 12; r <= 34; r += 11) {
              c.beginPath(); c.arc(wx, wy, r, Math.PI, 0); c.stroke();
            }
          }
        }
        c.restore();
        // 외곽 이중 목판 테두리
        c.strokeStyle = '#1a3554'; c.lineWidth = 4; c.strokeRect(20, 24, W - 40, H - 48);
        c.strokeStyle = accent; c.lineWidth = 1.5; c.strokeRect(28, 32, W - 56, H - 64);
        // 중앙 판화 프레임
        const px = 44, py = 92, pw = W - 88, ph = 540;
        c.save();
        c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(239,224,195,0.14)'; c.fillRect(px, py, pw, ph);
        c.restore();
        c.strokeStyle = '#1a2738'; c.lineWidth = 3; c.strokeRect(px, py, pw, ph);
        // 우측 상단 세로 카르투슈 명패
        const cx = W - 92, cy = 114;
        c.save();
        c.globalAlpha = ent;
        c.fillStyle = '#efe4cd'; c.fillRect(cx, cy, 34, 118);
        c.strokeStyle = accent; c.lineWidth = 2; c.strokeRect(cx, cy, 34, 118);
        c.fillStyle = accent; c.fillRect(cx + 5, cy + 88, 24, 24);
        c.fillStyle = '#efe4cd'; c.font = `700 12px 'Song Myung', serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`0${cutIdx + 1}`, cx + 17, cy + 100);
        c.fillStyle = '#1a2738'; c.font = `700 13px 'Song Myung', serif`;
        ['판', '화', '첩'].forEach((ch, i) => c.fillText(ch, cx + 17, cy + 20 + i * 22));
        c.restore();
        // 하단 목판 자막 띠
        c.fillStyle = '#1a3554'; c.fillRect(44, 654, W - 88, 6);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 744, maxW: W * 0.80, maxLines: 3, maxSize: 33, minSize: 21, color: '#1a2738', ent });

      } else if (M === 's100_art_oil') {
        // 3. 유화 붓터치: 깊은 캔버스 직조 + 코너 임파스토 브러시 + 금장 미술관 액자 + 하단 황동 명판
        c.fillStyle = s100Pattern(c, 'canvas'); c.fillRect(0, 0, W, H);
        // 배경 유화 붓질
        c.save();
        c.globalAlpha = 0.22;
        [[30, 50, 180, 26, -0.22, '#c79444'], [340, 80, 170, 22, 0.18, '#7c4d2b'], [20, 860, 210, 28, 0.15, '#9b6b3a'], [330, 830, 190, 24, -0.18, '#d4a656']].forEach(([x, y, w, h, rot, col]) => {
          c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; gRoundRect(c, 0, 0, w, h, 8); c.fill(); c.restore();
        });
        c.restore();
        // 금장 액자 외곽
        const fx = 34, fy = 96, fw = W - 68, fh = 556;
        const gold = c.createLinearGradient(fx, fy, fx + fw, fy + fh);
        gold.addColorStop(0, '#a87e34'); gold.addColorStop(0.35, '#f2d58b'); gold.addColorStop(0.65, '#8c6222'); gold.addColorStop(1, '#e8c474');
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 28; c.shadowOffsetY = 12;
        c.fillStyle = gold; c.fillRect(fx, fy, fw, fh);
        c.restore();
        c.fillStyle = '#241d17'; c.fillRect(fx + 14, fy + 14, fw - 28, fh - 28);
        c.save();
        c.beginPath(); c.rect(fx + 22, fy + 22, fw - 44, fh - 44); c.clip();
        inPhotoFade(c, S, cutIdx, local, fx + 22, fy + 22, fw - 44, fh - 44, 1.03 + lp * 0.04, 0);
        c.fillStyle = s100Pattern(c, 'canvas'); c.fillRect(fx + 22, fy + 22, fw - 44, fh - 44);
        c.restore();
        // 하단 황동 명판 박스
        const bx = 46, by = 684, bw = W - 92, bh = 162;
        c.fillStyle = 'rgba(20,16,12,0.92)'; gRoundRect(c, bx, by, bw, bh, 8); c.fill();
        c.strokeStyle = accent; c.lineWidth = 1.6; gRoundRect(c, bx, by, bw, bh, 8); c.stroke();
        c.font = `600 11px 'JetBrains Mono', monospace`; c.fillStyle = accent; c.textAlign = 'center';
        c.fillText(`GALLERY COLLECTION · 0${cutIdx + 1}`, W / 2, by + 24);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: by + 94, maxW: bw - 36, maxLines: 3, maxSize: 30, minSize: 19, color: '#f7efe1', ent });

      } else if (M === 's100_art_sumi') {
        // 4. 수묵화 먹물: 한지 + 먹물 산수 안개 + 원형 붓터치 엔소(원상) 프레임 + 붉은 낙관
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        // 부드러운 먹물 안개 번짐
        for (let i = 0; i < 3; i++) {
          const mx = W * (0.2 + i * 0.32) + Math.sin(t * 0.5 + i) * 18;
          const my = H * (0.14 + (i % 2) * 0.72);
          const mg = c.createRadialGradient(mx, my, 8, mx, my, 180);
          mg.addColorStop(0, 'rgba(24,24,26,0.13)'); mg.addColorStop(1, 'rgba(24,24,26,0)');
          c.fillStyle = mg; c.beginPath(); c.arc(mx, my, 180, 0, Math.PI * 2); c.fill();
        }
        // 원형 먹물 창
        const cx = W / 2, cy = 372, rad = 208;
        c.save();
        c.beginPath(); c.arc(cx, cy, rad, 0, Math.PI * 2); c.clip();
        inPhotoFade(c, S, cutIdx, local, cx - rad, cy - rad, rad * 2, rad * 2, 1.04 + lp * 0.05, 0);
        c.fillStyle = 'rgba(242,237,226,0.12)'; c.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
        c.restore();
        // 붓으로 그린 듯한 불규칙 먹선 원상(엔소)
        c.save();
        c.strokeStyle = 'rgba(20,20,22,0.88)'; c.lineCap = 'round';
        c.lineWidth = 10; c.beginPath(); c.arc(cx, cy, rad + 6, -0.4, Math.PI * 1.45 * ent + 0.4); c.stroke();
        c.lineWidth = 3.5; c.strokeStyle = 'rgba(20,20,22,0.45)';
        c.beginPath(); c.arc(cx + 2, cy - 2, rad + 14, 0.8, Math.PI * 2.1); c.stroke();
        c.restore();
        // 붉은 낙관 도장
        c.save();
        c.translate(W - 76, 616); c.rotate(-0.06);
        c.fillStyle = accent; c.fillRect(-20, -28, 40, 56);
        c.strokeStyle = '#f2ede2'; c.lineWidth = 1.5; c.strokeRect(-16, -24, 32, 48);
        c.fillStyle = '#f2ede2'; c.font = `400 20px 'Nanum Brush Script', cursive`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('수', 0, -10); c.fillText('묵', 0, 11);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'brush', x: W / 2, y: 742, maxW: W * 0.82, maxLines: 3, maxSize: 44, minSize: 26, color: '#181818', ent });

      } else if (M === 's100_art_risograph') {
        // 5. 리소그래프 판화: 하프톤 도트 + 형광 핑크/코발트 블루 핀 어긋남(오프셋) 프레임 + 4코너 십자 레지스트레이션 마크
        c.fillStyle = s100Pattern(c, 'halftone'); c.fillRect(0, 0, W, H);
        // 4코너 인쇄 레지스트레이션 마크 (+)
        c.strokeStyle = '#1b3bb5'; c.lineWidth = 1.5;
        [[30, 42], [W - 30, 42], [30, H - 42], [W - 30, H - 42]].forEach(([rx, ry]) => {
          c.beginPath(); c.moveTo(rx - 9, ry); c.lineTo(rx + 9, ry); c.moveTo(rx, ry - 9); c.lineTo(rx, ry + 9); c.stroke();
          c.beginPath(); c.arc(rx, ry, 5, 0, Math.PI * 2); c.stroke();
        });
        const px = 46, py = 114, pw = W - 92, ph = 516;
        // 핑크 & 블루 핀 어긋남 레이어
        c.fillStyle = 'rgba(230,57,117,0.82)'; c.fillRect(px + 10 * ent, py + 10 * ent, pw, ph);
        c.fillStyle = 'rgba(27,59,181,0.82)'; c.fillRect(px - 8 * ent, py - 8 * ent, pw, ph);
        c.save();
        c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.fillStyle = s100Pattern(c, 'halftone'); c.fillRect(px, py, pw, ph);
        c.restore();
        c.strokeStyle = '#141414'; c.lineWidth = 2.5; c.strokeRect(px, py, pw, ph);
        // 상단 리소 잉크 배지
        c.fillStyle = '#e63975'; c.fillRect(px, 66, 98, 26);
        c.fillStyle = '#ffffff'; c.font = `800 12px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`RISO · 0${cutIdx + 1}`, px + 49, 79);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 740, maxW: W * 0.82, maxLines: 3, maxSize: 36, minSize: 22, color: '#1b3bb5', offsetColor: 'rgba(230,57,117,0.55)', offsetDx: 3.5, offsetDy: 3, ent });

      } else if (M === 's100_art_pastel') {
        // 6. 파스텔 초크: 파스텔 사선 리본 + 둥근 아치 창 + 둥실 떠다니는 초크 반짝이
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        c.save();
        c.globalAlpha = 0.35;
        c.fillStyle = '#fbcfe8'; c.beginPath(); c.moveTo(0, 120); c.lineTo(W, 20); c.lineTo(W, 180); c.lineTo(0, 280); c.closePath(); c.fill();
        c.fillStyle = '#ddd6fe'; c.beginPath(); c.moveTo(0, 760); c.lineTo(W, 660); c.lineTo(W, 840); c.lineTo(0, 920); c.closePath(); c.fill();
        c.restore();
        // 아치형 사진 창
        const ax = 48, ay = 104, aw = W - 96, ah = 532, ar = aw / 2;
        const archPath = () => {
          c.beginPath();
          c.moveTo(ax, ay + ah);
          c.lineTo(ax, ay + ar);
          c.arc(ax + ar, ay + ar, ar, Math.PI, 0);
          c.lineTo(ax + aw, ay + ah);
          c.closePath();
        };
        c.save();
        c.shadowColor = 'rgba(217,107,152,0.22)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
        archPath(); c.fillStyle = '#ffffff'; c.fill();
        c.restore();
        c.save();
        archPath(); c.clip();
        inPhotoFade(c, S, cutIdx, local, ax, ay, aw, ah, 1.03 + lp * 0.04, 0);
        c.restore();
        c.save();
        c.setLineDash([8, 6]); c.strokeStyle = accent; c.lineWidth = 2.5;
        archPath(); c.stroke();
        c.restore();
        // 떠다니는 파스텔 입자
        for (let i = 0; i < 8; i++) {
          const dx = 40 + ((i * 77) % (W - 80)), dy = 90 + ((i * 113) % (H - 180)) + Math.sin(t * 2 + i) * 8;
          c.fillStyle = i % 2 ? 'rgba(217,107,152,0.45)' : 'rgba(139,92,246,0.35)';
          c.beginPath(); c.arc(dx, dy, 4 + (i % 3) * 2, 0, Math.PI * 2); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gaegu', x: W / 2, y: 742, maxW: W * 0.80, maxLines: 3, maxSize: 38, minSize: 24, color: '#33283c', boxBg: 'rgba(255,255,255,0.82)', boxRadius: 18, padX: 20, padY: 12, ent });

      } else if (M === 's100_art_botanical') {
        // 7. 보태니컬 스케치: 아이보리 식물 도감 + 미세 잎사귀 라인 아트 + 표본 번호
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(61,107,78,0.42)'; c.lineWidth = 1.5;
        c.strokeRect(22, 26, W - 44, H - 52);
        c.strokeRect(28, 32, W - 56, H - 64);
        // 코너 보태니컬 잎사귀 라인 아트
        const drawLeaf = (ox, oy, flipX, flipY) => {
          c.save(); c.translate(ox, oy); c.scale(flipX, flipY);
          c.strokeStyle = 'rgba(61,107,78,0.55)'; c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(38, 12, 68 * ent, 56 * ent); c.stroke();
          for (let k = 1; k <= 3; k++) {
            const lx = k * 18 * ent, ly = k * 14 * ent;
            c.beginPath(); c.ellipse(lx + 8, ly - 6, 12, 5, -0.5, 0, Math.PI * 2); c.stroke();
            c.beginPath(); c.ellipse(lx - 4, ly + 10, 11, 4.5, 0.7, 0, Math.PI * 2); c.stroke();
          }
          c.restore();
        };
        drawLeaf(32, 36, 1, 1); drawLeaf(W - 32, 36, -1, 1); drawLeaf(32, H - 36, 1, -1); drawLeaf(W - 32, H - 36, -1, -1);
        c.font = `600 12px 'Gowun Batang', serif`; c.fillStyle = accent; c.textAlign = 'center';
        c.fillText(`BOTANICAL PLATE · FIG. 0${cutIdx + 1}`, W / 2, 74);
        const px = 54, py = 104, pw = W - 108, ph = 524;
        c.save();
        gRoundRect(c, px, py, pw, ph, 140); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = accent; c.lineWidth = 2; gRoundRect(c, px, py, pw, ph, 140); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 742, maxW: W * 0.78, maxLines: 3, maxSize: 32, minSize: 20, color: '#232e26', ent });

      } else if (M === 's100_art_stainedglass') {
        // 8. 스테인드글라스: 보석 색감 다각형 모자이크 테두리 + 고딕 뾰족 아치 창
        const jewels = ['#991b1b', '#1e3a8a', '#b45309', '#065f46', '#581c87', '#0f766e'];
        c.save();
        for (let r = 0; r < 12; r++) {
          for (let col = 0; col < 6; col++) {
            const tx = col * 90, ty = r * 80;
            if (tx > 55 && tx < W - 145 && ty > 85 && ty < 650) continue;
            const shimmer = 0.52 + 0.18 * Math.sin(t * 1.4 + r + col * 1.3);
            c.globalAlpha = shimmer;
            c.fillStyle = jewels[(r * 3 + col + cutIdx) % jewels.length];
            c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + 90, ty); c.lineTo(tx + 90, ty + 80); c.lineTo(tx, ty + 80); c.closePath(); c.fill();
            c.globalAlpha = 0.9;
            c.strokeStyle = '#09090d'; c.lineWidth = 3.5; c.stroke();
          }
        }
        c.restore();
        // 고딕 뾰족 아치 프레임
        const gx = 48, gy = 76, gw = W - 96, gh = 564;
        const gothic = () => {
          c.beginPath();
          c.moveTo(gx, gy + gh);
          c.lineTo(gx, gy + 168);
          c.quadraticCurveTo(gx + 10, gy + 40, gx + gw / 2, gy);
          c.quadraticCurveTo(gx + gw - 10, gy + 40, gx + gw, gy + 168);
          c.lineTo(gx + gw, gy + gh);
          c.closePath();
        };
        c.save();
        gothic(); c.clip();
        inPhotoFade(c, S, cutIdx, local, gx, gy, gw, gh, 1.04 + lp * 0.05, 0);
        c.restore();
        c.save();
        c.shadowColor = accent; c.shadowBlur = 18;
        c.strokeStyle = accent; c.lineWidth = 4; gothic(); c.stroke();
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 748, maxW: W * 0.78, maxLines: 3, maxSize: 32, minSize: 20, color: '#faf3e0', boxBg: 'rgba(13,14,20,0.84)', boxRadius: 12, padX: 18, padY: 12, ent });

      } else if (M === 's100_art_pencil') {
        // 9. 색연필 드로잉: 스케치북 대각선 해칭 + 손그림 이중 흔들림 테두리 + 빨강/파랑 밑줄
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        // 상단·하단 색연필 대각선 해칭
        c.save();
        c.strokeStyle = 'rgba(214,69,69,0.20)'; c.lineWidth = 2;
        for (let i = -20; i < W + 40; i += 14) {
          c.beginPath(); c.moveTo(i, 16); c.lineTo(i - 22, 62); c.stroke();
        }
        c.strokeStyle = 'rgba(43,108,176,0.18)';
        for (let i = -20; i < W + 40; i += 14) {
          c.beginPath(); c.moveTo(i, H - 64); c.lineTo(i + 22, H - 16); c.stroke();
        }
        c.restore();
        const px = 44, py = 104, pw = W - 88, ph = 528;
        c.save();
        c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        // 손으로 두 번 그은 이중 스케치 테두리
        c.strokeStyle = '#242933'; c.lineWidth = 2.4;
        c.strokeRect(px - 3, py - 2, pw + 6, ph + 4);
        c.strokeStyle = accent; c.lineWidth = 1.8;
        c.save(); c.translate(W / 2, py + ph / 2); c.rotate(0.012); c.strokeRect(-pw / 2 - 2, -ph / 2 - 2, pw + 4, ph + 4); c.restore();
        // 하단 색연필 물결 밑줄
        c.strokeStyle = accent; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath();
        for (let x = 90; x <= W - 90; x += 10) {
          const y = 824 + Math.sin(x * 0.08) * 3;
          if (x === 90) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pen', x: W / 2, y: 736, maxW: W * 0.82, maxLines: 3, maxSize: 44, minSize: 28, color: '#242933', ent });

      } else if (M === 's100_art_acrylic') {
        // 10. 아크릴 나이프: 대담한 임파스토 페인트 스트로크 블록 + 살짝 기운 갤러리 컷 + 볼드 오버랩 타이포
        c.fillStyle = s100Pattern(c, 'canvas'); c.fillRect(0, 0, W, H);
        const smears = [
          [-20, 74, 240 * ent, 44, -0.14, '#e11d48'],
          [W - 220 * ent, 130, 260, 38, 0.12, '#2563eb'],
          [-10, 626, W + 20, 62, -0.05, accent],
          [W - 200 * ent, 810, 240, 34, 0.1, '#ffffff']
        ];
        smears.forEach(([x, y, w, h, rot, col]) => {
          c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.fillRect(0, 0, w, h); c.restore();
        });
        const px = 44, py = 112, pw = W - 88, ph = 524;
        c.save();
        c.translate(W / 2, py + ph / 2); c.rotate((cutIdx % 2 === 0 ? -1 : 1) * 0.022);
        c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 24;
        c.fillStyle = '#ffffff'; c.fillRect(-pw / 2 - 6, -ph / 2 - 6, pw + 12, ph + 12);
        c.beginPath(); c.rect(-pw / 2, -ph / 2, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, -pw / 2, -ph / 2, pw, ph, 1.04 + lp * 0.05, 0);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 742, maxW: W * 0.84, maxLines: 3, maxSize: 36, minSize: 22, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent });

      // ════════════════════════════════════════════════════════════════════
      // 장르 2: 레트로 · 아날로그 필름 (10종)
      // ════════════════════════════════════════════════════════════════════
      } else if (M === 's100_film_super8') {
        // 11. 슈퍼 8mm 필름: 좌측 8mm 스프로킷 구멍 + 둥근 영사 게이트 + 웜 플리커 & 스크래치
        const flicker = 0.96 + Math.sin(t * 24) * 0.03;
        c.fillStyle = '#0a0908'; c.fillRect(0, 0, W, H);
        // 왼쪽 8mm 스프로킷
        c.fillStyle = '#181512'; c.fillRect(0, 0, 50, H);
        const spOff = (t * 48) % 92;
        c.fillStyle = '#ece1cf';
        for (let sy = -92 + spOff; sy < H + 92; sy += 92) {
          gRoundRect(c, 13, sy, 24, 34, 6); c.fill();
        }
        const gx = 62, gy = 84, gw = W - 82, gh = 612;
        c.save();
        gRoundRect(c, gx, gy, gw, gh, 26); c.clip();
        c.globalAlpha = flicker;
        inPhotoFade(c, S, cutIdx, local, gx, gy, gw, gh, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(245,166,35,0.12)'; c.fillRect(gx, gy, gw, gh);
        // 미세 세로 필름 스크래치
        c.strokeStyle = 'rgba(255,244,220,0.18)'; c.lineWidth = 1;
        const sx = gx + ((Math.floor(t * 10) * 97) % gw);
        c.beginPath(); c.moveTo(sx, gy); c.lineTo(sx + 2, gy + gh); c.stroke();
        c.restore();
        c.font = `700 12px 'JetBrains Mono', monospace`; c.fillStyle = accent; c.textAlign = 'left';
        c.fillText(`SUPER 8MM · 18FPS · REEL 0${cutIdx + 1}`, gx, 58);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: gx + gw / 2, y: 786, maxW: gw - 16, maxLines: 3, maxSize: 31, minSize: 20, color: '#f7ebd5', ent });

      } else if (M === 's100_film_vhs') {
        // 12. VHS 캠코더: 풀블리드 + 주사선 + 트래킹 바 + PLAY ▶ + 1998 타임코드 OSD
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(18,32,68,0.14)'; c.fillRect(0, 0, W, H);
        c.fillStyle = s100Pattern(c, 'scanline'); c.fillRect(0, 0, W, H);
        // 가끔 흘러내리는 VHS 트래킹 노이즈 바
        const trackY = ((t * 110) % (H + 140)) - 70;
        c.fillStyle = 'rgba(255,255,255,0.09)'; c.fillRect(0, trackY, W, 16);
        // 하단 그라데이션 스크림
        const vg = c.createLinearGradient(0, H * 0.56, 0, H);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,7,14,0.82)');
        c.fillStyle = vg; c.fillRect(0, H * 0.56, W, H * 0.44);
        // VHS OSD
        c.save();
        c.font = `700 17px 'JetBrains Mono', monospace`;
        c.fillStyle = '#ffffff'; c.shadowColor = '#38bdf8'; c.shadowBlur = 6;
        c.textAlign = 'left'; c.fillText('PLAY ▶', 30, 62);
        c.textAlign = 'right'; c.fillText('SP · HI-FI', W - 30, 62);
        const sec = Math.floor(t);
        const tc = `00:${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
        c.textAlign = 'left'; c.fillText(tc, 30, H - 56);
        c.textAlign = 'right'; c.fillText('NOV 22 1998', W - 30, H - 56);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 760, maxW: W * 0.84, maxLines: 3, maxSize: 36, minSize: 22, color: '#ffffff', offsetColor: 'rgba(56,189,248,0.65)', offsetDx: -2.5, offsetDy: 0, shadow: 'rgba(244,63,94,0.65)', ent });

      } else if (M === 's100_film_kodak35') {
        // 13. 코닥 35mm 필름: 양옆 35mm 스프로킷 + 앰버 엣지코드 + 포트라 골든 글레이즈
        c.fillStyle = '#0e0d0b'; c.fillRect(0, 0, W, H);
        // 양쪽 스프로킷 구멍
        c.fillStyle = '#d6c8b0';
        for (let sy = 22; sy < H - 16; sy += 44) {
          gRoundRect(c, 11, sy, 18, 24, 4); c.fill();
          gRoundRect(c, W - 29, sy, 18, 24, 4); c.fill();
        }
        // 상단 앰버 엣지코드
        c.font = `700 11px 'JetBrains Mono', monospace`; c.fillStyle = accent;
        c.textAlign = 'left'; c.fillText('KODAK PORTRA 400', 44, 52);
        c.textAlign = 'right'; c.fillText(`◀ 3${cutIdx + 1}A`, W - 44, 52);
        const fx = 42, fy = 74, fw = W - 84, fh = 602;
        c.save();
        gRoundRect(c, fx, fy, fw, fh, 6); c.clip();
        inPhotoFade(c, S, cutIdx, local, fx, fy, fw, fh, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(242,169,59,0.11)'; c.fillRect(fx, fy, fw, fh);
        c.fillStyle = s100Pattern(c, 'grain'); c.fillRect(fx, fy, fw, fh);
        c.restore();
        c.strokeStyle = 'rgba(242,169,59,0.4)'; c.lineWidth = 1.2; gRoundRect(c, fx, fy, fw, fh, 6); c.stroke();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 780, maxW: W * 0.78, maxLines: 3, maxSize: 31, minSize: 20, color: '#faf3e6', ent });

      } else if (M === 's100_film_polaroid') {
        // 14. 폴라로이드 일기: 린넨 바탕 + 살짝 기운 즉석 인화지 + 상단 마스킹 테이프 + 하단 여백 손글씨
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        const angle = (cutIdx % 2 === 0 ? -0.028 : 0.028) * ent;
        c.save();
        c.translate(W / 2, H * 0.49 + rem * 22);
        c.rotate(angle);
        const cw = 448, ch = 720;
        c.shadowColor = 'rgba(34,26,18,0.28)'; c.shadowBlur = 28; c.shadowOffsetY = 14;
        c.fillStyle = '#fdfcf9'; gRoundRect(c, -cw / 2, -ch / 2, cw, ch, 6); c.fill();
        c.shadowBlur = 0; c.shadowOffsetY = 0;
        // 사진 영역
        const px = -cw / 2 + 24, py = -ch / 2 + 26, pw = cw - 48, ph = 500;
        c.save();
        c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 1; c.strokeRect(px, py, pw, ph);
        // 상단 반투명 마스킹 테이프
        c.save(); c.rotate(-angle * 1.4);
        c.fillStyle = 'rgba(232,199,134,0.72)'; c.fillRect(-62, -ch / 2 - 14, 124, 30);
        c.restore();
        // 폴라로이드 하단 여백 손글씨 자막
        c.font = `600 11px 'JetBrains Mono', monospace`; c.fillStyle = 'rgba(120,105,88,0.68)'; c.textAlign = 'right';
        c.fillText(`INSTANT #0${cutIdx + 1}`, cw / 2 - 26, ch / 2 - 18);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pen', x: 0, y: ch / 2 - 102, maxW: pw - 16, maxLines: 3, maxSize: 38, minSize: 24, color: '#221f1c', ent });
        c.restore();

      } else if (M === 's100_film_crt') {
        // 15. CRT 브라운관: 둥근 모니터 베젤 + 유리 반사 하이라이트 + 주사선 + 그린 포스포 터미널 자막
        c.fillStyle = '#14171c'; c.fillRect(0, 0, W, H);
        // 외곽 모니터 하우징
        gRoundRect(c, 16, 26, W - 32, H - 52, 34); c.fillStyle = '#1e232c'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 2; c.stroke();
        // 내부 곡면 CRT 스크린
        const sx = 34, sy = 56, sw = W - 68, sh = 610;
        c.save();
        gRoundRect(c, sx, sy, sw, sh, 28); c.clip();
        inPhotoFade(c, S, cutIdx, local, sx, sy, sw, sh, 1.04 + lp * 0.04, 0);
        c.fillStyle = 'rgba(16,64,40,0.16)'; c.fillRect(sx, sy, sw, sh);
        c.fillStyle = s100Pattern(c, 'scanline'); c.fillRect(sx, sy, sw, sh);
        // 브라운관 곡면 유리 반사광
        const glare = c.createLinearGradient(sx, sy, sx + sw * 0.6, sy + sh * 0.45);
        glare.addColorStop(0, 'rgba(255,255,255,0.15)'); glare.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = glare; c.fillRect(sx, sy, sw, sh * 0.45);
        c.restore();
        c.strokeStyle = 'rgba(74,222,128,0.45)'; c.lineWidth = 2; gRoundRect(c, sx, sy, sw, sh, 28); c.stroke();
        // 하단 포스포 자막 콘솔 + 전원 LED
        gRoundRect(c, 34, 686, W - 68, 178, 16); c.fillStyle = '#090f0c'; c.fill();
        c.strokeStyle = 'rgba(74,222,128,0.35)'; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = Math.floor(t * 2) % 2 ? '#4ade80' : '#166534';
        c.beginPath(); c.arc(W - 56, H - 46, 5, 0, Math.PI * 2); c.fill();
        c.font = `700 11px 'JetBrains Mono', monospace`; c.fillStyle = '#4ade80'; c.textAlign = 'left';
        c.fillText(`CH-0${cutIdx + 1} // SIGNAL LOCKED`, 50, 710);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: W / 2, y: 786, maxW: W - 110, maxLines: 3, maxSize: 28, minSize: 18, color: '#d1fae5', shadow: 'rgba(74,222,128,0.55)', ent });

      } else if (M === 's100_film_newspaper') {
        // 16. 신문 1면 헤드라인: 일간지 제호 + 이중 괘선 + 단(컬럼) 구분선 + 속보 붉은 띠
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        const pad = 28;
        c.fillStyle = '#141414';
        c.fillRect(pad, 36, W - pad * 2, 4);
        c.font = `900 32px 'Song Myung', serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('THE DAILY EDITION', W / 2, 68);
        c.fillRect(pad, 92, W - pad * 2, 1.5);
        c.font = `600 11px 'JetBrains Mono', monospace`; c.fillStyle = '#52504a';
        c.textAlign = 'left'; c.fillText(`VOL. 0${cutIdx + 1} · SPECIAL ISSUE`, pad, 108);
        c.textAlign = 'right'; c.fillText(String(brandName).slice(0, 14).toUpperCase(), W - pad, 108);
        c.fillStyle = '#141414'; c.fillRect(pad, 120, W - pad * 2, 3);
        // 헤드라인 자막 (상단 배치)
        c.fillStyle = accent; c.fillRect(pad, 134, 86, 22);
        c.fillStyle = '#ffffff'; c.font = `800 11px Pretendard, sans-serif`; c.textAlign = 'center';
        c.fillText('SPECIAL REPORT', pad + 43, 145);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 222, maxW: W - pad * 2 - 8, maxLines: 3, maxSize: 34, minSize: 21, color: '#141414', ent });
        // 하단 보도 사진 + 하프톤
        const px = pad, py = 296, pw = W - pad * 2, ph = 564;
        c.save();
        c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(236,230,216,0.16)'; c.fillRect(px, py, pw, ph);
        c.fillStyle = s100Pattern(c, 'halftone'); c.fillRect(px, py, pw, ph);
        c.restore();
        c.strokeStyle = '#141414'; c.lineWidth = 2; c.strokeRect(px, py, pw, ph);
        c.fillStyle = '#52504a'; c.font = `600 11px 'Gowun Batang', serif`; c.textAlign = 'left';
        c.fillText(`▲ SCENE 0${cutIdx + 1} / 0${totalCuts} · PHOTO PRESS`, pad, H - 64);

      } else if (M === 's100_film_poster') {
        // 17. 빈티지 포스터: 크림 테두리 + 기하 선버스트 아치 + 미드센추리 블록 헤드라인
        c.fillStyle = '#f5ebd6'; c.fillRect(0, 0, W, H);
        c.fillStyle = sp.bg1 || '#1c2331'; c.fillRect(18, 22, W - 36, H - 44);
        // 상단 선버스트 반원
        c.save();
        c.beginPath(); c.arc(W / 2, 134, 88, Math.PI, 0); c.fillStyle = accent; c.fill();
        c.fillStyle = '#f5ebd6'; c.font = `800 12px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`CLASSIC EDITION · 0${cutIdx + 1}`, W / 2, 102);
        c.restore();
        const px = 44, py = 134, pw = W - 88, ph = 524;
        c.save();
        c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#f5ebd6'; c.lineWidth = 4; c.strokeRect(px, py, pw, ph);
        // 하단 버밀리온 포스터 블록
        c.fillStyle = accent; c.fillRect(44, 678, W - 88, 178);
        c.strokeStyle = '#f5ebd6'; c.lineWidth = 2; c.strokeRect(52, 686, W - 104, 162);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 767, maxW: W - 128, maxLines: 3, maxSize: 34, minSize: 21, color: '#f5ebd6', ent });
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);

      } else if (M === 's100_film_cassette') {
        // 18. 카세트 테이프: 상단 사진 윈도우 + 하단 회전 릴 2개 + 오렌지 J-카드 스티커 라벨
        const pad = 26;
        gRoundRect(c, pad, 34, W - pad * 2, H - 68, 26); c.fillStyle = '#222531'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 2; c.stroke();
        // 4모서리 나사못
        c.fillStyle = '#0f1118';
        [[pad + 18, 52], [W - pad - 18, 52], [pad + 18, H - 52], [W - pad - 18, H - 52]].forEach(([nx, ny]) => {
          c.beginPath(); c.arc(nx, ny, 7, 0, Math.PI * 2); c.fill();
        });
        // 상단 투명 사진 창
        const px = 46, py = 74, pw = W - 92, ph = 492;
        c.save();
        gRoundRect(c, px, py, pw, ph, 16); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.strokeStyle = '#f97316'; c.lineWidth = 3; gRoundRect(c, px, py, pw, ph, 16); c.stroke();
        // 하단 오렌지/크림 믹스테이프 스티커 + 회전 릴 2개
        gRoundRect(c, 46, 588, W - 92, 268, 16); c.fillStyle = '#fff7ed'; c.fill();
        c.fillStyle = accent; gRoundRect(c, 46, 588, W - 92, 34, 14); c.fill();
        c.fillStyle = '#ffffff'; c.font = `800 12px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`SIDE A · C-90`, 62, 608);
        c.textAlign = 'right'; c.fillText(`TRACK 0${cutIdx + 1}`, W - 62, 608);
        // 회전하는 카세트 릴 2개
        [156, W - 156].forEach((rx) => {
          c.save(); c.translate(rx, 668); c.rotate(t * 2.6);
          c.fillStyle = '#181920'; c.beginPath(); c.arc(0, 0, 26, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#fff7ed'; c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#f97316'; c.lineWidth = 3;
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            c.beginPath(); c.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); c.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); c.stroke();
          }
          c.restore();
        });
        c.fillStyle = '#181920'; gRoundRect(c, 200, 652, W - 400, 32, 8); c.fill();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 778, maxW: W - 124, maxLines: 2, maxSize: 32, minSize: 20, color: '#181920', ent });

      } else if (M === 's100_film_90smag') {
        // 19. 90년대 잡지: 풀블리드 + 매거진 마스트헤드 + 대각선 특집 스타 스티커 + 팝 드롭섀도우 자막
        inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, 1.04 + lp * 0.04, 0);
        const topGrad = c.createLinearGradient(0, 0, 0, 210);
        topGrad.addColorStop(0, 'rgba(14,10,22,0.78)'); topGrad.addColorStop(1, 'rgba(14,10,22,0)');
        c.fillStyle = topGrad; c.fillRect(0, 0, W, 210);
        const botGrad = c.createLinearGradient(0, H * 0.58, 0, H);
        botGrad.addColorStop(0, 'rgba(14,10,22,0)'); botGrad.addColorStop(1, 'rgba(14,10,22,0.86)');
        c.fillStyle = botGrad; c.fillRect(0, H * 0.58, W, H * 0.42);
        // 90s 잡지 마스트헤드
        c.save();
        c.font = `900 62px 'Black Han Sans', sans-serif`; c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillStyle = '#ec4899'; c.fillText('STREET 99', W / 2 + 4, 34);
        c.fillStyle = accent; c.fillText('STREET 99', W / 2, 30);
        c.restore();
        // 우측 상단 특집 원형 스티커
        c.save();
        c.translate(W - 74, 152); c.rotate(0.14);
        c.fillStyle = '#ec4899'; c.beginPath(); c.arc(0, 0, 42 * ent, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = '#ffffff'; c.font = `800 13px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('SPECIAL', 0, -7); c.fillText(`NO.0${cutIdx + 1}`, 0, 10);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 760, maxW: W * 0.84, maxLines: 3, maxSize: 38, minSize: 22, color: '#ffffff', strokeCol: '#141219', strokeW: 6, offsetColor: '#ec4899', offsetDx: 4, offsetDy: 4, ent });

      } else {
        // 20. 다큐멘터리 필름 (s100_film_docu): 2.39:1 시네마 레터박스 + 텅스텐 필름 그레인 + 챕터 하단 자막
        inPhotoFade(c, S, cutIdx, local, 0, 88, W, H - 248, 1.02 + lp * 0.04, 0);
        c.fillStyle = s100Pattern(c, 'grain'); c.fillRect(0, 88, W, H - 248);
        // 상·하단 시네마 레터박스
        c.fillStyle = '#09090b';
        c.fillRect(0, 0, W, 90);
        c.fillRect(0, H - 240, W, 240);
        c.strokeStyle = 'rgba(217,181,102,0.35)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(0, 90.5); c.lineTo(W, 90.5); c.moveTo(0, H - 239.5); c.lineTo(W, H - 239.5); c.stroke();
        // 상단 챕터 인덱스
        c.font = `600 11px 'JetBrains Mono', monospace`; c.fillStyle = accent; c.textAlign = 'left';
        c.fillText(`DOCUMENTARY · CHAPTER 0${cutIdx + 1}`, 34, 56);
        c.textAlign = 'right'; c.fillStyle = 'rgba(244,244,245,0.45)';
        c.fillText(`24FPS · ANAMORPHIC`, W - 34, 56);
        // 하단 골드 라인 + 에디토리얼 자막
        c.fillStyle = accent; c.fillRect(34, H - 208, 44 * ent, 3);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: 34, y: H - 122, maxW: W - 68, maxLines: 3, maxSize: 31, minSize: 20, color: '#f4f4f5', align: 'left', ent });
      }
      c.restore();
    }
