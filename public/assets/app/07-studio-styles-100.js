// AutoReels — 07-studio-styles-100.js
// 100% 자체 제작 9:16 프로시저럴 캔버스 스타일 엔진 (풀블리드 9:16 중심 · 상업용 안전 · 60fps 캐시)
// Batch 1 (20종): 회화·일러스트 아트 10종 + 레트로·아날로그 필름 10종

    const STUDIO_100_SPECS = [
      // ── 장르 1: 회화 · 일러스트 아트 (10종) ──────────────────────────────
      ['s100_art_watercolor',   '수채화 번짐',      '손글씨', '#f7f3ea', '#ece3d2', '#2b7a78', '#22211f', 'gowun',   true,  'art',  'lofi',   '풀화면 수채 물감 번짐과 감성 번짐 자막'],
      ['s100_art_ukiyoe',       '우키요에 목판화',   '감성',   '#efe4cd', '#e3d4b4', '#b83227', '#1a2738', 'maru',    true,  'art',  'ballad', '전통 목판화 파도 문양과 우측 붉은 인장'],
      ['s100_art_oil',          '유화 붓터치',      '고급',   '#1b1713', '#2a221b', '#d4a656', '#f7efe1', 'maru',    false, 'art',  'jazz',   '풀화면 캔버스 직조와 금장 코너 필리그리'],
      ['s100_art_sumi',         '수묵화 먹물',      '손글씨', '#f2ede2', '#e5dfd1', '#b22c24', '#181818', 'brush',   true,  'art',  'ballad', '원형 먹물 엔소 프레임과 붉은 낙관'],
      ['s100_art_risograph',    '리소그래프 판화',   '타이포', '#f5efe4', '#ebe2d3', '#e63975', '#1b3bb5', 'dohyeon', false, 'art',  'funk',   '풀화면 하프톤과 형광 핑크·블루 핀 어긋남'],
      ['s100_art_pastel',       '파스텔 초크',      '감성',   '#fbf3f7', '#f0e8fb', '#f472b6', '#ffffff', 'gaegu',   false, 'art',  'bright', '몽환적 파스텔 빛 번짐과 손글씨 리본'],
      ['s100_art_botanical',    '보태니컬 스케치',   '감성',   '#f4f0e6', '#e9e3d5', '#3d6b4e', '#232e26', 'gowun',   true,  'art',  'lofi',   '식물 도감 라인 일러스트와 아치 창'],
      ['s100_art_stainedglass', '스테인드글라스',    '고급',   '#0d0e14', '#161826', '#f2b84b', '#faf3e0', 'maru',    false, 'art',  'cinema', '풀화면 고딕 성당 모자이크 유리 아치'],
      ['s100_art_pencil',       '색연필 드로잉',    '손글씨', '#f7f4ec', '#eee9dc', '#f87171', '#ffffff', 'pen',     false, 'art',  'bright', '풀화면 이중 손그림 스케치 테두리와 해칭'],
      ['s100_art_acrylic',      '아크릴 나이프',    '타이포', '#141318', '#1d1b24', '#facc15', '#ffffff', 'gasoek',  false, 'art',  'urban',  '풀화면 대담한 페인트 나이프 붓터치 오버레이'],

      // ── 장르 2: 레트로 · 아날로그 필름 (10종) ────────────────────────────
      ['s100_film_super8',      '슈퍼 8mm 필름',    '감성',   '#0e0c0a', '#1a1511', '#f5a623', '#f7ebd5', 'mono',    false, 'film', 'lofi',   '풀화면 8mm 영사기 게이트와 회전 스프로킷'],
      ['s100_film_vhs',         'VHS 캠코더',       '브이로그','#0b0d14', '#131826', '#38bdf8', '#ffffff', 'mono',    false, 'film', 'vlog',   '90년대 캠코더 타임코드와 트래킹 노이즈'],
      ['s100_film_kodak35',     '코닥 35mm 필름',   '감성',   '#100f0d', '#1c1814', '#f2a93b', '#faf3e6', 'gowun',   false, 'film', 'cinema', '풀높이 35mm 스프로킷과 웜 포트라 글레이즈'],
      ['s100_film_polaroid',    '폴라로이드 일기',   '감성',   '#e8e0d2', '#dcd1be', '#c95f44', '#221f1c', 'pen',     true,  'film', 'lofi',   '마스킹 테이프와 기운 즉석 인화지 손글씨'],
      ['s100_film_crt',         'CRT 브라운관',     '테크',   '#090d11', '#101820', '#4ade80', '#d1fae5', 'mono',    false, 'film', 'drive',  '풀화면 곡면 모니터 주사선과 포스포 자막'],
      ['s100_film_newspaper',   '신문 1면 헤드라인', '뉴스·방송','#ece6d8','#dfd7c5', '#b91c1c', '#141414', 'maru',    true,  'film', 'news',   '상단 헤드라인 일간지 1면과 보도사진'],
      ['s100_film_poster',      '빈티지 포스터',    '타이포', '#1c2331', '#253045', '#e05336', '#f5ebd6', 'dohyeon', false, 'film', 'funk',   '풀화면 미드센추리 영화 포스터와 선버스트'],
      ['s100_film_cassette',    '카세트 테이프',    '재미',   '#161820', '#232634', '#f97316', '#fff7ed', 'dohyeon', false, 'film', 'funk',   '회전 릴 데크와 오렌지 믹스테이프 라벨'],
      ['s100_film_90smag',      '90년대 잡지',      '재미',   '#141219', '#241a2e', '#facc15', '#ffffff', 'gasoek',  false, 'film', 'urban',  '풀화면 90년대 스트릿 매거진 커버 스티커'],
      ['s100_film_docu',        '다큐멘터리 필름',   '고급',   '#09090b', '#131317', '#d9b566', '#f4f4f5', 'maru',    false, 'film', 'cinema', '슬림 시네마 레터박스와 챕터 하단 자막']
    ];

    const STUDIO_100_RENDERERS = {};
    function s100RegisterStyles(specs, seedOffset = 900) {
      if (typeof DESIGN_STYLES === 'undefined' || !Array.isArray(DESIGN_STYLES)) return;
      specs.forEach((r, idx) => {
        if (DESIGN_STYLES.some((d) => d.id === r[0])) return;
        DESIGN_STYLES.push({
          id: r[0], name: r[1], cat: r[2], engine: 'motion', mstyle: r[0], genre: 'motion',
          bg1: r[3], bg2: r[4], accent: r[5], accent2: r[6], font: r[7], light: Boolean(r[8]),
          s100Genre: r[9], bgm: r[10], desc: r[11], label: r[1], insta: true,
          isOpusArt: true, isStudio100: true, addedAt: '2026-11-22', seed: seedOffset + idx
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
          g.fillStyle = i % 2 ? 'rgba(110,90,60,0.045)' : 'rgba(255,255,255,0.06)';
          g.fillRect((i * 73) % 128, (i * 41) % 128, 2, 2);
        }
      } else if (kind === 'canvas') {
        off.width = 64; off.height = 64;
        const g = off.getContext('2d');
        g.strokeStyle = 'rgba(255,245,225,0.06)';
        for (let i = 0; i < 64; i += 4) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke();
        }
      } else if (kind === 'halftone') {
        off.width = 16; off.height = 16;
        const g = off.getContext('2d');
        g.fillStyle = 'rgba(20,25,40,0.08)';
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

    // 풀블리드 9:16 헬퍼 (전체 화면 꽉 채우고 필요 영역만 자연스러운 그라데이션 스크림)
    function s100FullBleed(c, S, cutIdx, local, lp, W, H, opts = {}) {
      inPhotoFade(c, S, cutIdx, local, 0, 0, W, H, (opts.zoom || 1.03) + lp * 0.04, 0);
      if (opts.tint) { c.fillStyle = opts.tint; c.fillRect(0, 0, W, H); }
      if (opts.pattern) { c.fillStyle = s100Pattern(c, opts.pattern); c.fillRect(0, 0, W, H); }
      if (opts.topScrim) {
        const tg = c.createLinearGradient(0, 0, 0, opts.topH || 210);
        tg.addColorStop(0, opts.topScrim); tg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = tg; c.fillRect(0, 0, W, opts.topH || 210);
      }
      if (opts.botScrim) {
        const bh = opts.botH || 340;
        const bg = c.createLinearGradient(0, H - bh, 0, H);
        bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, opts.botScrim);
        c.fillStyle = bg; c.fillRect(0, H - bh, W, bh);
      }
    }

    // 100종 스타일별 개성 있는 전용 한국어 디스플레이/에디토리얼/손글씨/테크 폰트 매핑 (26종 서체 골고루 분산)
    const S100_RICH_FONTS = {
      // 아트 10종
      s100_art_watercolor: 'grandiflora', s100_art_ukiyoe: 'songmyung', s100_art_oil: 'diphylleia',
      s100_art_sumi: 'dokdo', s100_art_risograph: 'kirang', s100_art_pastel: 'gaegu',
      s100_art_botanical: 'gowun', s100_art_stainedglass: 'hahmlet', s100_art_pencil: 'pen',
      s100_art_acrylic: 'aggro',
      // 필름 10종
      s100_film_super8: 'sunflower', s100_film_vhs: 'orbit', s100_film_kodak35: 'gowun',
      s100_film_polaroid: 'singleday', s100_film_crt: 'orbit', s100_film_newspaper: 'hahmlet',
      s100_film_poster: 'blackhan', s100_film_cassette: 'gugi', s100_film_90smag: 'aggro',
      s100_film_docu: 'diphylleia',
      // 매거진 10종
      s100_ed_vogue: 'diphylleia', s100_ed_swiss: 'paperlogy', s100_ed_museum: 'grandiflora',
      s100_ed_goldfoil: 'hahmlet', s100_ed_noir: 'songmyung', s100_ed_monochrome: 'paperlogy',
      s100_ed_brutalist: 'blackhan', s100_ed_whitegallery: 'gowun', s100_ed_lookbook: 'diphylleia',
      s100_ed_arch: 'gmarket',
      // 키네틱 10종
      s100_kin_slam: 'aggro', s100_kin_curtain: 'paperlogy', s100_kin_cyber: 'orbit',
      s100_kin_glitch: 'gugi', s100_kin_wave: 'stylish', s100_kin_stamp: 'blackhan',
      s100_kin_iso: 'gmarket', s100_kin_marquee: 'gasoek', s100_kin_liquid: 'diphylleia',
      s100_kin_spotlight: 'hahmlet',
      // 방송·TV 10종
      s100_tv_breaking: 'aggro', s100_tv_variety: 'cafe24', s100_tv_docu_nar: 'hahmlet',
      s100_tv_podcast: 'paperlogy', s100_tv_sports: 'blackhan', s100_tv_finance: 'gmarket',
      s100_tv_interview: 'dodum', s100_tv_top5: 'gasoek', s100_tv_review: 'cafe24',
      s100_tv_qa: 'jua',
      // 게임·만화 10종
      s100_gm_rpg: 'gugi', s100_gm_arcade: 'orbit', s100_gm_manga: 'kirang',
      s100_gm_webtoon: 'cafe24', s100_gm_gameboy: 'gugi', s100_gm_popart: 'bagel',
      s100_gm_stickerbook: 'cute', s100_gm_toyblock: 'bagel', s100_gm_terminal: 'orbit',
      s100_gm_tcg: 'aggro',
      // 노트·학습 10종
      s100_nt_chalkboard: 'gaegu', s100_nt_whiteboard: 'poorstory', s100_nt_gridnote: 'pen',
      s100_nt_blueprint: 'orbit', s100_nt_postit: 'gamja', s100_nt_infograph: 'gmarket',
      s100_nt_checklist: 'singleday', s100_nt_highlighter: 'cafe24', s100_nt_calendar: 'sunflower',
      s100_nt_mindmap: 'paperlogy',
      // 푸드·카페 10종
      s100_fd_michelin: 'hahmlet', s100_fd_brunch: 'sunflower', s100_fd_pocha: 'cafe24',
      s100_fd_dessert: 'cute', s100_fd_espresso: 'diphylleia', s100_fd_omakase: 'dokdo',
      s100_fd_recipe: 'yeonsung', s100_fd_delivery: 'aggro', s100_fd_wine: 'grandiflora',
      s100_fd_bakery: 'poorstory',
      // 라이프·뷰티 10종
      s100_lf_glassskin: 'grandiflora', s100_lf_beautyrev: 'stylish', s100_lf_looktag: 'paperlogy',
      s100_lf_roomtour: 'dodum', s100_lf_beforeafter: 'gmarket', s100_lf_perfume: 'diphylleia',
      s100_lf_wedding: 'grandiflora', s100_lf_wellness: 'gowun', s100_lf_pet: 'dongle',
      s100_lf_boarding: 'orbit',
      // 비즈니스·프로 10종
      s100_bz_showroom: 'paperlogy', s100_bz_hud: 'orbit', s100_bz_property: 'gmarket',
      s100_bz_report: 'hahmlet', s100_bz_clinic: 'dodum', s100_bz_academy: 'cafe24',
      s100_bz_bodypro: 'blackhan', s100_bz_timesale: 'aggro', s100_bz_ceo: 'hahmlet',
      s100_bz_vip: 'diphylleia'
    };
    let _s100ActiveStyleId = '';

    function s100DrawCaption(c, W, H, caption, opts) {
      if (!caption || opts.capHidden) return;
      const { cutIdx, local, fontKey, x, y, maxW, maxLines, maxSize, minSize, color, align = 'center', shadow, boxBg, boxBorder, boxRadius = 12, padX = 20, padY = 12, strokeCol, strokeW = 0, offsetColor, offsetDx = 0, offsetDy = 0, ent = 1 } = opts;
      const baseFontKey = (_s100ActiveStyleId && S100_RICH_FONTS[_s100ActiveStyleId]) || fontKey;
      const resolvedKey = mCapFont(cutIdx, baseFontKey);
      if (typeof kitEnsureFont === 'function') kitEnsureFont(resolvedKey);
      const F = KIT_FONTS[resolvedKey] || KIT_FONTS.sans;
      const fit = mFit(c, caption, maxW, maxLines || 3, maxSize || 40, minSize || 24, resolvedKey);
      if (!fit.lines.length) return;
      const fillCol = mCapColor(cutIdx, color);
      const totalH = fit.lines.length * fit.lh;
      const startY = y - totalH / 2 + fit.lh / 2;

      c.save();
      c.globalAlpha *= Math.min(1, ent * 1.25);
      c.font = gFont(F.w || 800, fit.size, F.f);
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
        if (boxBorder) { c.strokeStyle = boxBorder; c.lineWidth = 2; c.stroke(); }
      }

      if (shadow) { c.shadowColor = shadow; c.shadowBlur = 16; c.shadowOffsetY = 3; }

      fit.lines.forEach((ln, li) => {
        const lineEnt = mEase((local - li * 0.08) / 0.30);
        const ly = startY + li * fit.lh + (1 - lineEnt) * 14;
        c.save();
        c.globalAlpha *= Math.min(1, lineEnt * 1.35);
        if (offsetColor) { c.fillStyle = offsetColor; c.fillText(ln, x + offsetDx, ly + offsetDy, maxW); }
        if (strokeCol && strokeW > 0) {
          c.lineJoin = 'round'; c.lineWidth = strokeW; c.strokeStyle = strokeCol;
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
      const ent = 1 - Math.pow(1 - mClamp(local / 0.40), 3);
      const rem = 1 - ent;
      const accent = sp.accent || '#d97706';
      const fg = sp.accent2 || (sp.light ? '#18181b' : '#ffffff');
      const brandName = (campaign && campaign.hideCardOnVideo) ? '' : ((d && (d.branch || d.name)) || (typeof IND !== 'undefined' && IND.place) || 'AUTOREELS');

      c.save();
      const bgGrad = c.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, sp.bg1 || '#111216');
      bgGrad.addColorStop(1, sp.bg2 || sp.bg1 || '#1a1c24');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, W, H);

      if (typeof STUDIO_100_RENDERERS[M] === 'function') {
        _s100ActiveStyleId = M;
        try {
          STUDIO_100_RENDERERS[M]({ c, W, H, t, mainDuration, totalCuts, d, sp, cutDur, cutIdx, local, lp, S, caption, capHidden, ent, rem, accent, fg, brandName });
        } finally {
          _s100ActiveStyleId = '';
        }
        c.restore();
        return;
      }

      // ════════════════════════════════════════════════════════════════════
      // 장르 1: 회화 · 일러스트 아트 (10종 — 풀블리드 9:16 + 시그니처 변주)
      // ════════════════════════════════════════════════════════════════════
      if (M === 's100_art_watercolor') {
        // 1. 수채화 번짐: 풀블리드 + 부드러운 수채 비네트 + 코너 물감 번짐 블룸
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(247,243,234,0.12)', pattern: 'paper', botScrim: 'rgba(247,243,234,0.86)', botH: 360 });
        [[0, 0, 220, 'rgba(43,122,120,0.34)'], [W, 120, 200, 'rgba(232,126,105,0.30)'], [0, H, 240, 'rgba(227,178,76,0.32)'], [W, H - 80, 220, 'rgba(92,138,176,0.30)']].forEach(([bx, by, br, col], i) => {
          const rg = c.createRadialGradient(bx, by, 10, bx, by, br * (1 + Math.sin(t + i) * 0.06));
          rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = rg; c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fill();
        });
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 38, minSize: 24, color: '#1f2933', ent, capHidden });

      } else if (M === 's100_art_ukiyoe') {
        // 2. 우키요에 목판화: 풀블리드 + 목판 이중 테두리 + 하단 세이가이하 파도 띠 + 우상단 붉은 판화 인장
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(239,224,195,0.16)', pattern: 'paper', botScrim: 'rgba(26,39,56,0.82)', botH: 320 });
        c.strokeStyle = '#efe4cd'; c.lineWidth = 10; c.strokeRect(10, 12, W - 20, H - 24);
        c.strokeStyle = '#1a3554'; c.lineWidth = 3; c.strokeRect(18, 20, W - 36, H - 40);
        c.save();
        c.strokeStyle = 'rgba(239,224,195,0.32)'; c.lineWidth = 1.8;
        for (let wx = 0; wx < W + 64; wx += 64) {
          for (let r = 12; r <= 30; r += 9) { c.beginPath(); c.arc(wx, H - 22, r, Math.PI, 0); c.stroke(); }
        }
        c.restore();
        if (typeof arDrawEditableSeal === 'function') {
          arDrawEditableSeal(c, W, H, cutIdx, { x: W - 47, y: 103, w: 34, h: 98, text: '판화첩', bg: '#efe4cd', fg: '#1a2738', innerBorder: true, font: "'Song Myung', serif", weight: 700, vertical: true });
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 760, maxW: W * 0.82, maxLines: 3, maxSize: 38, minSize: 24, color: '#efe4cd', shadow: 'rgba(10,16,28,0.8)', ent, capHidden });

      } else if (M === 's100_art_oil') {
        // 3. 유화 붓터치: 풀블리드 캔버스 질감 + 금장 액자 테두리 + 코너 필리그리
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(27,23,19,0.16)', pattern: 'canvas', botScrim: 'rgba(20,16,12,0.86)', botH: 340 });
        const gold = c.createLinearGradient(0, 0, W, H);
        gold.addColorStop(0, '#a87e34'); gold.addColorStop(0.5, '#f2d58b'); gold.addColorStop(1, '#8c6222');
        c.strokeStyle = gold; c.lineWidth = 8; c.strokeRect(12, 14, W - 24, H - 28);
        c.lineWidth = 1.5; c.strokeRect(24, 26, W - 48, H - 52);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 766, maxW: W * 0.80, maxLines: 3, maxSize: 36, minSize: 23, color: '#f7efe1', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });

      } else if (M === 's100_art_sumi') {
        // 4. 수묵화 먹물 (시그니처 원형 엔소 — 2/3 사각형 아님!)
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        const cx = W / 2, cy = 412, rad = 224;
        c.save(); c.beginPath(); c.arc(cx, cy, rad, 0, Math.PI * 2); c.clip();
        inPhotoFade(c, S, cutIdx, local, cx - rad, cy - rad, rad * 2, rad * 2, 1.04 + lp * 0.05, 0);
        c.restore();
        c.save(); c.strokeStyle = 'rgba(20,20,22,0.88)'; c.lineCap = 'round';
        c.lineWidth = 11; c.beginPath(); c.arc(cx, cy, rad + 6, -0.4, Math.PI * 1.55 * ent + 0.4); c.stroke();
        c.lineWidth = 3.5; c.strokeStyle = 'rgba(20,20,22,0.42)';
        c.beginPath(); c.arc(cx + 2, cy - 2, rad + 15, 0.8, Math.PI * 2.1); c.stroke();
        c.restore();
        if (typeof arDrawEditableSeal === 'function') {
          arDrawEditableSeal(c, W, H, cutIdx, { x: W - 68, y: 650, w: 38, h: 54, text: '수묵', rot: -0.06, bg: accent, fg: '#f2ede2', innerBorder: true, font: "'Nanum Brush Script', cursive", weight: 400, vertical: true });
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'brush', x: W / 2, y: 786, maxW: W * 0.84, maxLines: 3, maxSize: 48, minSize: 28, color: '#181818', ent, capHidden });

      } else if (M === 's100_art_risograph') {
        // 5. 리소그래프 판화: 풀블리드 하프톤 + 형광 핑크/블루 핀 어긋남 프레임 + 4코너 십자 마크
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { pattern: 'halftone', botScrim: 'rgba(18,22,42,0.82)', botH: 340 });
        c.strokeStyle = '#e63975'; c.lineWidth = 4; c.strokeRect(22, 24, W - 44, H - 48);
        c.strokeStyle = '#3b82f6'; c.lineWidth = 3; c.strokeRect(14, 16, W - 44, H - 48);
        c.fillStyle = '#e63975'; c.fillRect(28, 36, 98, 28);
        c.fillStyle = '#ffffff'; c.font = `900 12px 'JetBrains Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`RISO · 0${cutIdx + 1}`, 77, 50);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 760, maxW: W * 0.84, maxLines: 3, maxSize: 42, minSize: 25, color: '#ffffff', offsetColor: '#e63975', offsetDx: 4, offsetDy: 4, ent, capHidden });

      } else if (M === 's100_art_pastel') {
        // 6. 파스텔 초크: 풀블리드 + 부드러운 파스텔 리본 빛 + 점선 초크 프레임 + 둥근 손글씨
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(251,207,232,0.14)', botScrim: 'rgba(42,26,48,0.72)', botH: 320 });
        c.save(); c.setLineDash([10, 7]); c.strokeStyle = 'rgba(255,255,255,0.72)'; c.lineWidth = 2.5;
        gRoundRect(c, 22, 26, W - 44, H - 52, 28); c.stroke(); c.restore();
        for (let i = 0; i < 8; i++) {
          const dx = 42 + ((i * 77) % (W - 84)), dy = 70 + ((i * 113) % (H - 140)) + Math.sin(t * 2 + i) * 8;
          c.fillStyle = i % 2 ? 'rgba(249,168,212,0.65)' : 'rgba(196,181,253,0.60)';
          c.beginPath(); c.arc(dx, dy, 4 + (i % 3) * 2, 0, Math.PI * 2); c.fill();
        }
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gaegu', x: W / 2, y: 764, maxW: W * 0.84, maxLines: 3, maxSize: 44, minSize: 26, color: '#fff5fa', shadow: 'rgba(217,107,152,0.75)', ent, capHidden });

      } else if (M === 's100_art_botanical') {
        // 7. 보태니컬 스케치: 풀블리드 + 코너 식물 라인 아트 + 올리브 이중 프레임
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(244,240,230,0.10)', botScrim: 'rgba(24,38,28,0.78)', botH: 320 });
        c.strokeStyle = 'rgba(244,240,230,0.78)'; c.lineWidth = 1.6; c.strokeRect(20, 24, W - 40, H - 48);
        const drawLeaf = (ox, oy, fx, fy) => {
          c.save(); c.translate(ox, oy); c.scale(fx, fy);
          c.strokeStyle = '#d9ead3'; c.lineWidth = 1.8;
          c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(38, 12, 70 * ent, 58 * ent); c.stroke();
          for (let k = 1; k <= 3; k++) {
            c.beginPath(); c.ellipse(k * 18 * ent + 8, k * 14 * ent - 6, 12, 5, -0.5, 0, Math.PI * 2); c.stroke();
          }
          c.restore();
        };
        drawLeaf(24, 28, 1, 1); drawLeaf(W - 24, 28, -1, 1); drawLeaf(24, H - 28, 1, -1); drawLeaf(W - 24, H - 28, -1, -1);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 766, maxW: W * 0.82, maxLines: 3, maxSize: 38, minSize: 23, color: '#f4f0e6', shadow: 'rgba(15,24,18,0.85)', ent, capHidden });

      } else if (M === 's100_art_stainedglass') {
        // 8. 스테인드글라스: 화면 86% 차지하는 풀높이 고딕 아치 + 보석 유리 테두리
        const jewels = ['#991b1b', '#1e3a8a', '#b45309', '#065f46', '#581c87', '#0f766e'];
        for (let r = 0; r < 12; r++) {
          for (let col = 0; col < 6; col++) {
            const tx = col * 90, ty = r * 80;
            if (tx > 55 && tx < W - 145 && ty > 75 && ty < H - 100) continue;
            c.globalAlpha = 0.62 + 0.16 * Math.sin(t * 1.4 + r + col);
            c.fillStyle = jewels[(r * 3 + col + cutIdx) % jewels.length];
            c.fillRect(tx, ty, 90, 80);
            c.globalAlpha = 0.92; c.strokeStyle = '#09090d'; c.lineWidth = 3.5; c.strokeRect(tx, ty, 90, 80);
          }
        }
        c.globalAlpha = 1;
        const gx = 32, gy = 36, gw = W - 64, gh = H - 72;
        const gothic = () => {
          c.beginPath(); c.moveTo(gx, gy + gh); c.lineTo(gx, gy + 170);
          c.quadraticCurveTo(gx + 12, gy + 36, gx + gw / 2, gy);
          c.quadraticCurveTo(gx + gw - 12, gy + 36, gx + gw, gy + 170);
          c.lineTo(gx + gw, gy + gh); c.closePath();
        };
        c.save(); gothic(); c.clip();
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(13,14,20,0.86)', botH: 340 });
        c.restore();
        c.save(); c.shadowColor = accent; c.shadowBlur = 16; c.strokeStyle = accent; c.lineWidth = 4; gothic(); c.stroke(); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 774, maxW: W * 0.78, maxLines: 3, maxSize: 36, minSize: 23, color: '#faf3e0', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });

      } else if (M === 's100_art_pencil') {
        // 9. 색연필 드로잉: 풀블리드 + 이중 손그림 흔들림 테두리 + 빨강·파랑 빗금 + 손글씨
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { pattern: 'paper', botScrim: 'rgba(20,24,34,0.78)', botH: 330 });
        c.strokeStyle = 'rgba(255,255,255,0.82)'; c.lineWidth = 2.6; c.strokeRect(20, 24, W - 40, H - 48);
        c.save(); c.translate(W / 2, H / 2); c.rotate(0.014); c.strokeStyle = accent; c.lineWidth = 2;
        c.strokeRect(-W / 2 + 22, -H / 2 + 26, W - 44, H - 52); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pen', x: W / 2, y: 766, maxW: W * 0.84, maxLines: 3, maxSize: 48, minSize: 28, color: '#ffffff', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });

      } else if (M === 's100_art_acrylic') {
        // 10. 아크릴 나이프: 풀블리드 + 대담한 페인트 나이프 붓터치 오버레이 + 중앙·하단 볼드 타이포
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { pattern: 'canvas', botScrim: 'rgba(18,16,24,0.82)', botH: 340 });
        [[-20, 44, 210 * ent, 36, -0.14, '#e11d48'], [W - 190 * ent, 88, 220, 32, 0.12, '#2563eb'], [-10, H - 72, 240 * ent, 34, -0.06, accent]].forEach(([x, y, w, h, rot, col]) => {
          c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.fillRect(0, 0, w, h); c.restore();
        });
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 762, maxW: W * 0.84, maxLines: 3, maxSize: 42, minSize: 25, color: '#ffffff', strokeCol: '#141318', strokeW: 6, offsetColor: accent, offsetDx: 4, offsetDy: 4, ent, capHidden });

      // ════════════════════════════════════════════════════════════════════
      // 장르 2: 레트로 · 아날로그 필름 (10종)
      // ════════════════════════════════════════════════════════════════════
      } else if (M === 's100_film_super8') {
        // 11. 슈퍼 8mm: 풀높이 8mm 게이트 + 좌측 회전 스프로킷 + 웜 플리커
        const flicker = 0.96 + Math.sin(t * 24) * 0.03;
        c.fillStyle = '#0a0908'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#181512'; c.fillRect(0, 0, 44, H);
        const spOff = (t * 48) % 92;
        c.fillStyle = '#ece1cf';
        for (let sy = -92 + spOff; sy < H + 92; sy += 92) { gRoundRect(c, 10, sy, 22, 34, 6); c.fill(); }
        const gx = 52, gy = 18, gw = W - 66, gh = H - 36;
        c.save(); gRoundRect(c, gx, gy, gw, gh, 26); c.clip(); c.globalAlpha = flicker;
        inPhotoFade(c, S, cutIdx, local, gx, gy, gw, gh, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(245,166,35,0.12)'; c.fillRect(gx, gy, gw, gh);
        const bg = c.createLinearGradient(0, H - 300, 0, H);
        bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(10,9,8,0.86)');
        c.fillStyle = bg; c.fillRect(gx, H - 300, gw, 300);
        c.restore();
        c.font = `700 12px 'JetBrains Mono', monospace`; c.fillStyle = accent; c.textAlign = 'left';
        c.fillText(`SUPER 8MM · 18FPS`, gx + 16, 48);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: gx + gw / 2, y: 786, maxW: gw - 28, maxLines: 3, maxSize: 36, minSize: 22, color: '#f7ebd5', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });

      } else if (M === 's100_film_vhs') {
        // 12. VHS 캠코더: 풀블리드
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { tint: 'rgba(18,32,68,0.14)', pattern: 'scanline', botScrim: 'rgba(5,7,14,0.84)', botH: 340 });
        const trackY = ((t * 110) % (H + 140)) - 70;
        c.fillStyle = 'rgba(255,255,255,0.09)'; c.fillRect(0, trackY, W, 16);
        c.save(); c.font = `700 17px 'JetBrains Mono', monospace`; c.fillStyle = '#ffffff'; c.shadowColor = '#38bdf8'; c.shadowBlur = 6;
        c.textAlign = 'left'; c.fillText('PLAY ▶', 28, 56);
        c.textAlign = 'right'; c.fillText('SP · HI-FI', W - 28, 56);
        const sec = Math.floor(t);
        c.textAlign = 'left'; c.fillText(`00:${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`, 28, H - 48);
        c.textAlign = 'right'; c.fillText('NOV 22 1998', W - 28, H - 48);
        c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 760, maxW: W * 0.84, maxLines: 3, maxSize: 40, minSize: 24, color: '#ffffff', offsetColor: 'rgba(56,189,248,0.7)', offsetDx: -3, offsetDy: 0, shadow: 'rgba(244,63,94,0.65)', ent, capHidden });

      } else if (M === 's100_film_kodak35') {
        // 13. 코닥 35mm 필름: 풀높이 35mm 스프로킷 양옆 레일 + 웜 포트라 글레이즈
        c.fillStyle = '#0e0d0b'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#d6c8b0';
        for (let sy = 18; sy < H - 14; sy += 44) {
          gRoundRect(c, 9, sy, 16, 24, 4); c.fill();
          gRoundRect(c, W - 25, sy, 16, 24, 4); c.fill();
        }
        const fx = 34, fy = 18, fw = W - 68, fh = H - 36;
        c.save(); gRoundRect(c, fx, fy, fw, fh, 8); c.clip();
        inPhotoFade(c, S, cutIdx, local, fx, fy, fw, fh, 1.03 + lp * 0.04, 0);
        c.fillStyle = 'rgba(242,169,59,0.12)'; c.fillRect(fx, fy, fw, fh);
        c.fillStyle = s100Pattern(c, 'grain'); c.fillRect(fx, fy, fw, fh);
        const bg = c.createLinearGradient(0, H - 300, 0, H);
        bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(14,13,11,0.86)');
        c.fillStyle = bg; c.fillRect(fx, H - 300, fw, 300);
        c.restore();
        c.font = `700 11px 'JetBrains Mono', monospace`; c.fillStyle = accent;
        c.textAlign = 'left'; c.fillText('KODAK PORTRA 400', 48, 46);
        c.textAlign = 'right'; c.fillText(`◀ 3${cutIdx + 1}A`, W - 48, 46);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gowun', x: W / 2, y: 786, maxW: fw - 28, maxLines: 3, maxSize: 36, minSize: 22, color: '#faf3e6', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });

      } else if (M === 's100_film_polaroid') {
        // 14. 폴라로이드 일기 (시그니처 기울어진 인화지)
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        const angle = (cutIdx % 2 === 0 ? -0.032 : 0.032) * ent;
        c.save(); c.translate(W / 2, H * 0.50 + rem * 20); c.rotate(angle);
        const cw = 456, ch = 740;
        c.shadowColor = 'rgba(34,26,18,0.28)'; c.shadowBlur = 28; c.shadowOffsetY = 14;
        c.fillStyle = '#fdfcf9'; gRoundRect(c, -cw / 2, -ch / 2, cw, ch, 6); c.fill();
        c.shadowBlur = 0; c.shadowOffsetY = 0;
        const px = -cw / 2 + 22, py = -ch / 2 + 24, pw = cw - 44, ph = 528;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.restore();
        c.save(); c.rotate(-angle * 1.4); c.fillStyle = 'rgba(232,199,134,0.75)'; c.fillRect(-64, -ch / 2 - 14, 128, 30); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'pen', x: 0, y: ch / 2 - 92, maxW: pw - 16, maxLines: 3, maxSize: 42, minSize: 25, color: '#221f1c', ent, capHidden });
        c.restore();

      } else if (M === 's100_film_crt') {
        // 15. CRT 브라운관: 화면 94% 꽉 차는 곡면 CRT + 주사선 + 유리 반사 + 그린 포스포 자막
        c.fillStyle = '#14171c'; c.fillRect(0, 0, W, H);
        const sx = 16, sy = 20, sw = W - 32, sh = H - 40;
        c.save(); gRoundRect(c, sx, sy, sw, sh, 34); c.clip();
        inPhotoFade(c, S, cutIdx, local, sx, sy, sw, sh, 1.04 + lp * 0.04, 0);
        c.fillStyle = 'rgba(16,64,40,0.18)'; c.fillRect(sx, sy, sw, sh);
        c.fillStyle = s100Pattern(c, 'scanline'); c.fillRect(sx, sy, sw, sh);
        const bg = c.createLinearGradient(0, H - 300, 0, H);
        bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(6,16,12,0.88)');
        c.fillStyle = bg; c.fillRect(sx, H - 300, sw, 300);
        c.restore();
        c.strokeStyle = 'rgba(74,222,128,0.52)'; c.lineWidth = 3; gRoundRect(c, sx, sy, sw, sh, 34); c.stroke();
        c.font = `700 11px 'JetBrains Mono', monospace`; c.fillStyle = '#4ade80'; c.textAlign = 'left';
        c.fillText(`CH-0${cutIdx + 1} // SIGNAL LOCKED`, 38, 52);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'mono', x: W / 2, y: 786, maxW: W - 92, maxLines: 3, maxSize: 33, minSize: 21, color: '#d1fae5', shadow: 'rgba(74,222,128,0.65)', ent, capHidden });

      } else if (M === 's100_film_newspaper') {
        // 16. 신문 1면 헤드라인 (상단 제호+대형 헤드라인 / 하단 62% 보도사진 — 2/3 역전 구도!)
        c.fillStyle = s100Pattern(c, 'paper'); c.fillRect(0, 0, W, H);
        const pad = 26;
        c.fillStyle = '#141414'; c.fillRect(pad, 30, W - pad * 2, 4);
        c.font = `900 32px 'Song Myung', serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('THE DAILY EDITION', W / 2, 62);
        c.fillRect(pad, 86, W - pad * 2, 2);
        c.fillStyle = accent; c.fillRect(pad, 100, 96, 22);
        c.fillStyle = '#ffffff'; c.font = `800 11px Pretendard, sans-serif`; c.fillText('SPECIAL REPORT', pad + 48, 111);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: W / 2, y: 196, maxW: W - pad * 2 - 8, maxLines: 3, maxSize: 38, minSize: 23, color: '#141414', ent, capHidden });
        const px = pad, py = 278, pw = W - pad * 2, ph = H - 314;
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        inPhotoFade(c, S, cutIdx, local, px, py, pw, ph, 1.03 + lp * 0.04, 0);
        c.fillStyle = s100Pattern(c, 'halftone'); c.fillRect(px, py, pw, ph);
        c.restore();
        c.strokeStyle = '#141414'; c.lineWidth = 2.5; c.strokeRect(px, py, pw, ph);

      } else if (M === 's100_film_poster') {
        // 17. 빈티지 포스터: 풀블리드 포스터 + 크림 프레임 + 상단 선버스트 + 하단 굵은 버밀리온 타이틀
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { pattern: 'paper', topScrim: 'rgba(28,35,49,0.72)', botScrim: 'rgba(28,35,49,0.88)', botH: 340 });
        c.strokeStyle = '#f5ebd6'; c.lineWidth = 10; c.strokeRect(12, 14, W - 24, H - 28);
        c.beginPath(); c.arc(W / 2, 116, 76, Math.PI, 0); c.fillStyle = accent; c.fill();
        c.fillStyle = '#f5ebd6'; c.font = `800 11.5px 'JetBrains Mono', monospace`; c.textAlign = 'center';
        c.fillText(`CLASSIC · 0${cutIdx + 1}`, W / 2, 90);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 774, maxW: W * 0.80, maxLines: 3, maxSize: 40, minSize: 24, color: '#f5ebd6', boxBg: accent, boxRadius: 8, padX: 22, padY: 14, ent, capHidden });

      } else if (M === 's100_film_cassette') {
        // 18. 카세트 테이프 (풀블리드 상단 + 하단 오렌지 테이프 회전 릴 데크 오버레이)
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { botScrim: 'rgba(18,20,28,0.86)', botH: 380 });
        gRoundRect(c, 26, 616, W - 52, 276, 18); c.fillStyle = 'rgba(255,247,237,0.94)'; c.fill();
        c.fillStyle = accent; gRoundRect(c, 26, 616, W - 52, 34, 16); c.fill();
        c.fillStyle = '#ffffff'; c.font = `800 12px 'JetBrains Mono', monospace`; c.textAlign = 'left';
        c.fillText(`SIDE A · C-90`, 42, 636); c.textAlign = 'right'; c.fillText(`TRACK 0${cutIdx + 1}`, W - 42, 636);
        [146, W - 146].forEach((rx) => {
          c.save(); c.translate(rx, 694); c.rotate(t * 2.6);
          c.fillStyle = '#181920'; c.beginPath(); c.arc(0, 0, 24, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#fff7ed'; c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#f97316'; c.lineWidth = 3;
          for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); c.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); c.stroke(); }
          c.restore();
        });
        c.fillStyle = '#181920'; gRoundRect(c, 192, 680, W - 384, 28, 7); c.fill();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'dohyeon', x: W / 2, y: 806, maxW: W - 92, maxLines: 2, maxSize: 36, minSize: 22, color: '#181920', ent, capHidden });

      } else if (M === 's100_film_90smag') {
        // 19. 90년대 잡지: 풀블리드
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { topScrim: 'rgba(14,10,22,0.74)', botScrim: 'rgba(14,10,22,0.86)', botH: 340 });
        c.save(); c.font = `900 66px 'Black Han Sans', sans-serif`; c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillStyle = '#ec4899'; c.fillText('STREET 99', W / 2 + 4, 34);
        c.fillStyle = accent; c.fillText('STREET 99', W / 2, 30); c.restore();
        c.save(); c.translate(W - 72, 152); c.rotate(0.14);
        c.fillStyle = '#ec4899'; c.beginPath(); c.arc(0, 0, 42 * ent, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = '#ffffff'; c.font = `800 13px Pretendard, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('SPECIAL', 0, -7); c.fillText(`NO.0${cutIdx + 1}`, 0, 10); c.restore();
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'gasoek', x: W / 2, y: 762, maxW: W * 0.84, maxLines: 3, maxSize: 42, minSize: 24, color: '#ffffff', strokeCol: '#141219', strokeW: 7, offsetColor: '#ec4899', offsetDx: 4, offsetDy: 4, ent, capHidden });

      } else {
        // 20. 다큐멘터리 필름: 슬림 시네마 레터박스 (72px) + 풀화면 느낌
        s100FullBleed(c, S, cutIdx, local, lp, W, H, { pattern: 'grain', botScrim: 'rgba(9,9,11,0.84)', botH: 300 });
        c.fillStyle = '#09090b'; c.fillRect(0, 0, W, 68); c.fillRect(0, H - 68, W, 68);
        c.strokeStyle = 'rgba(217,181,102,0.40)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(0, 68.5); c.lineTo(W, 68.5); c.moveTo(0, H - 68.5); c.lineTo(W, H - 68.5); c.stroke();
        c.font = `600 11px 'JetBrains Mono', monospace`; c.fillStyle = accent; c.textAlign = 'left';
        c.fillText(`DOCUMENTARY · CHAPTER 0${cutIdx + 1}`, 28, 42);
        c.fillStyle = accent; c.fillRect(32, 704, 44 * ent, 3);
        s100DrawCaption(c, W, H, caption, { cutIdx, local, fontKey: 'maru', x: 32, y: 780, maxW: W - 64, maxLines: 3, maxSize: 36, minSize: 22, color: '#f4f4f5', align: 'left', shadow: 'rgba(0,0,0,0.85)', ent, capHidden });
      }
      c.restore();
    }
