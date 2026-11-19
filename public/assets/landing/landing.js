// AutoReels 모뉴멘탈 시네마 랜딩 (Lenis + GSAP 3 + ScrollTrigger + 전술 타임코드 HUD + 황금 먼지 캔버스)
(function () {
  var INDS = window.AR_LP_INDUSTRIES || {};
  var current = 'auto';
  var currentCut = 0;
  var playing = true;
  var cutTimer = null;
  var CUT_MS = 3400;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 해시 없는 기본 진입/새로고침 시 항상 히어로 맨 위(00:00)부터 시작
  if (!location.hash) {
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
    window.scrollTo(0, 0);
  }

  var SCENE_DIR = {
    auto: 'auto', cafe: 'cafe', restaurant: 'restaurant', beauty: 'beauty',
    realestate: 'realestate', academy: 'academy', clinic: 'clinic',
    fitness: 'fitness', shop: 'shop', interior: 'interior', personal: 'cafe'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function josaRo(word) {
    var s = String(word || '').trim();
    if (!s) return '로';
    var code = s.charCodeAt(s.length - 1);
    if (code < 0xAC00 || code > 0xD7A3) return '로';
    var jong = (code - 0xAC00) % 28;
    return (jong === 0 || jong === 8) ? '로' : '으로';
  }

  function scenePhoto(indKey, cutIdx) {
    var dir = SCENE_DIR[indKey] || 'auto';
    return '/assets/scenes/' + dir + '/' + ((cutIdx % 3) + 1) + '.jpg';
  }

  function buildCuts(ind) {
    var where = ind.branchPlaceholder || ind.place || '';
    var hook = ind.vlogDone || (ind.name + ' 프로모션');
    var quote = ind.chatAsk || ind.cta || '';
    var promo = ind.promoPlaceholder || ind.promise || '';
    return [
      { tag: '01 / 03', kicker: '01 · HOOK', hook: hook, sub: where + (quote ? ' · "' + quote + '"' : ''), tags: (ind.hashtags || []).slice(0, 3) },
      { tag: '02 / 03', kicker: '02 · AI VOICE', hook: quote || hook, sub: ind.promise || (ind.role + ' · ' + ind.product + ' 핵심 포인트를 15초 안에 전달합니다'), tags: (ind.hashtags || []).slice(1, 5) },
      { tag: '03 / 03', kicker: '03 · ENDING', hook: promo || (where + '에서 만나요'), sub: where + ' · ' + ind.title + ' — 연락처·로고 자동 엔딩', tags: (ind.hashtags || []).slice(0, 4) }
    ];
  }

  function renderBars() {
    var wrap = document.getElementById('landingPhoneBars');
    if (!wrap) return;
    wrap.querySelectorAll('.mn-bar').forEach(function (bar, i) {
      bar.classList.remove('is-done', 'is-active', 'is-paused');
      var fill = bar.querySelector('.mn-bar-fill');
      if (fill) { fill.style.animation = 'none'; void fill.offsetWidth; fill.style.animation = ''; }
      if (i < currentCut) bar.classList.add('is-done');
      else if (i === currentCut) {
        bar.classList.add('is-active');
        if (!playing) bar.classList.add('is-paused');
      }
    });
  }

  function renderCut(ind, cutIdx) {
    var cuts = buildCuts(ind);
    currentCut = ((cutIdx % cuts.length) + cuts.length) % cuts.length;
    var c = cuts[currentCut];
    var photoUrl = scenePhoto(ind.key, currentCut);

    var mainImg = document.getElementById('lpMainPhoto');
    if (mainImg && mainImg.getAttribute('src') !== photoUrl) mainImg.setAttribute('src', photoUrl);
    var amb = document.getElementById('mnHeroAmbient');
    if (amb) amb.style.backgroundImage = 'url("' + photoUrl + '")';

    setText('landingPhoneCutTag', c.tag);
    setText('landingPhoneKicker', c.kicker);
    setText('landingPhoneHook', c.hook);
    setText('landingPhoneSub', c.sub);
    var tags = document.getElementById('landingPhoneTags');
    if (tags) {
      tags.innerHTML = (c.tags || []).map(function (t) {
        return '<span class="px-1.5 py-0.5 bg-black/55 border border-white/15 text-[10px] text-[#f5efe2]">#' + esc(t) + '</span>';
      }).join('');
    }
    if (window.gsap && !reducedMotion) {
      window.gsap.fromTo('#landingPhoneSlide', { y: 8, opacity: 0.35 }, { y: 0, opacity: 1, duration: 0.32, ease: 'power2.out' });
    }
    renderBars();
  }

  function scheduleNextCut() {
    if (cutTimer) { clearTimeout(cutTimer); cutTimer = null; }
    if (!playing) return;
    cutTimer = setTimeout(function () {
      var ind = INDS[current] || INDS.auto;
      if (!ind) return;
      renderCut(ind, currentCut + 1);
      scheduleNextCut();
    }, CUT_MS);
  }

  function syncPlayBtn() {
    var btn = document.getElementById('landingPhonePlayBtn');
    if (!btn) return;
    btn.textContent = playing ? '❚❚' : '▶';
    btn.setAttribute('aria-label', playing ? '미리보기 일시정지' : '미리보기 자동 재생');
  }

  function selectIndustry(key, opts) {
    var ind = INDS[key] || INDS.auto;
    if (!ind) return;
    current = ind.key;
    var keys = Object.keys(INDS);

    var grid = document.getElementById('landingIndustryGrid');
    if (grid) {
      grid.innerHTML = keys.map(function (k, idx) {
        var it = INDS[k], on = it.key === ind.key;
        var num = (idx + 1 < 10 ? '0' : '') + (idx + 1);
        return '<button type="button" data-ind="' + esc(it.key) + '" class="px-3 py-2.5 border text-left cursor-pointer transition-colors ' +
          (on ? 'bg-[#e07a4f] text-[#0b0a08] border-[#e07a4f] font-bold' : 'bg-[#161310] hover:bg-[#1f1b16] text-[#f5efe2] border-white/10') + '">' +
          '<div class="flex items-center justify-between gap-2"><span class="text-[12.5px] truncate">' + esc(it.name) + '</span><span class="font-mono text-[10px] opacity-60">' + num + '</span></div>' +
          '<div class="text-[11px] opacity-70 truncate mt-0.5">' + esc(it.role) + ' · ' + esc(it.product) + '</div></button>';
      }).join('');
    }

    var quick = document.getElementById('landingQuickInds');
    if (quick) {
      quick.innerHTML = keys.map(function (k) {
        var it = INDS[k], on = it.key === ind.key;
        return '<button type="button" data-ind="' + esc(it.key) + '" data-quick="1" class="mn-quick-chip' + (on ? ' is-active' : '') + '">' + esc(it.name) + '</button>';
      }).join('');
    }

    var where = ind.branchPlaceholder || ind.place || '';
    setText('landingPhoneBadge', ind.name);
    setText('landingPhonePlace', where + ' · ' + ind.title);
    setText('landingPhonePromo', ind.promoPlaceholder || '');
    setText('landingStartIndustryBtn', ind.name + josaRo(ind.name) + ' 바로 만들기 →');

    renderCut(ind, 0);
    scheduleNextCut();

    if (opts && opts.fromGrid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function renderMarqueeStrip() {
    var track = document.getElementById('lpMarqueeTrack');
    if (!track) return;
    var keys = Object.keys(INDS).filter(function (k) { return k !== 'personal'; });
    var cardsHtml = keys.map(function (k) {
      var it = INDS[k];
      var dir = SCENE_DIR[it.key] || 'auto';
      var photo = '/assets/scenes/' + dir + '/5.jpg';
      var hook = it.vlogDone || (it.name + ' 릴스');
      return '<button type="button" data-go="/studio?ind=' + esc(it.key) + '" class="lp-strip-card" aria-label="' + esc(it.name) + ' 스튜디오 열기">' +
        '<img src="' + photo + '" alt="" loading="lazy" />' +
        '<div class="lp-strip-scrim"></div>' +
        '<div class="lp-strip-meta"><span>' + esc(it.name) + '</span><strong>' + esc(hook) + '</strong></div>' +
        '</button>';
    }).join('');
    track.innerHTML = cardsHtml + cardsHtml;
  }

  // 히어로 황금빛 먼지 입자 캔버스 (theinfinitysocks volumetric dust motes)
  (function initDustCanvas() {
    var c = document.getElementById('mnDustCanvas');
    if (!c || reducedMotion) return;
    var ctx = c.getContext('2d');
    if (!ctx) return;
    var motes = Array.from({ length: 58 }, function () {
      return {
        x: Math.random(), y: Math.random(),
        r: 0.7 + Math.random() * 1.9,
        vx: (Math.random() - 0.5) * 0.00022,
        vy: -0.00018 - Math.random() * 0.00028,
        a: 0.15 + Math.random() * 0.5
      };
    });
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.max(1, Math.floor(c.clientWidth * dpr));
      c.height = Math.max(1, Math.floor(c.clientHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    function tick() {
      var w = c.clientWidth || 1, h = c.clientHeight || 1;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx; m.y += m.vy;
        if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
        if (m.x < -0.02) m.x = 1.02;
        if (m.x > 1.02) m.x = -0.02;
        ctx.fillStyle = 'rgba(245, 226, 196, ' + m.a.toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // 히어로 5장 부채꼴 3D 덱 마우스 틸트 (GSAP quickTo 부드러운 관성 보간)
  var fanDeckEl = document.getElementById('mnFanDeck');
  var bgWmEl = document.getElementById('mnBgWatermark');
  if (!reducedMotion && fanDeckEl && window.gsap) {
    var deckRotY = window.gsap.quickTo(fanDeckEl, 'rotationY', { duration: 0.85, ease: 'power3.out' });
    var deckRotX = window.gsap.quickTo(fanDeckEl, 'rotationX', { duration: 0.85, ease: 'power3.out' });
    var wmX = bgWmEl ? window.gsap.quickTo(bgWmEl, 'x', { duration: 1.0, ease: 'power3.out' }) : null;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || window.scrollY > window.innerHeight * 2.6) return;
      var nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      var ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      deckRotY(nx * 6.5);
      deckRotX(-ny * 4.0);
      if (wmX) wmX(-nx * 24);
    }, { passive: true });
  }

  // 우측 하단 전술 타임코드 HUD (24틱 + 실시간 타임코드 + 라이트 섹션 자동 극성 반전)
  var hudTicksEl = document.getElementById('mnHudTicks');
  var hudTickNodes = [];
  if (hudTicksEl) {
    hudTicksEl.innerHTML = Array.from({ length: 24 }, function () { return '<i></i>'; }).join('');
    hudTickNodes = hudTicksEl.querySelectorAll('i');
  }
  var scrollBar = document.getElementById('mnScrollBar');
  var navEl = document.getElementById('mnNav');
  var hudClockEl = document.getElementById('mnHudClock');
  var soundPillEl = document.getElementById('mnAmbientSoundBtn');
  var chapterEls = document.querySelectorAll('[data-chapter]');

  function updateTelemetry() {
    var docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p = clamp(window.scrollY / docH, 0, 1);
    if (scrollBar) scrollBar.style.width = (p * 100).toFixed(2) + '%';

    // 00:00 ~ 15:00 (초:프레임)
    var totalSec = p * 15;
    var sec = Math.floor(totalSec);
    var frm = Math.floor((totalSec - sec) * 60);
    setText('mnHudTime', (sec < 10 ? '0' : '') + sec + ':' + (frm < 10 ? '0' : '') + frm);

    var litCount = Math.round(p * 24);
    for (var i = 0; i < hudTickNodes.length; i++) {
      hudTickNodes[i].classList.toggle('is-lit', i < litCount);
    }

    // 현재 챕터 및 라이트 극성 반전 체크
    var midY = window.innerHeight * 0.48;
    var isLight = false;
    chapterEls.forEach(function (secEl) {
      var r = secEl.getBoundingClientRect();
      if (r.top <= midY && r.bottom >= midY) {
        setText('mnHudChapter', secEl.getAttribute('data-chapter') + ' / 06');
        setText('mnHudLabel', secEl.getAttribute('data-chapter-label') || '');
        if (secEl.hasAttribute('data-light-section')) isLight = true;
      }
    });
    if (navEl) navEl.classList.toggle('is-light', isLight);
    if (hudClockEl) hudClockEl.classList.toggle('is-light', isLight);
    if (soundPillEl) soundPillEl.classList.toggle('is-light', isLight);
  }
  window.addEventListener('scroll', updateTelemetry, { passive: true });
  window.addEventListener('resize', updateTelemetry, { passive: true });

  // =========================================================================
  // Lenis 관성 스크롤 + GSAP 3 + ScrollTrigger (핀 가로 스크럽 · 텍스트 필 · 3D 언폴드)
  // =========================================================================
  function initMotionEngine() {
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;
    if (gsap && ST) {
      gsap.registerPlugin(ST);
      ST.config({ ignoreMobileResize: true });
    }

    // Lenis + GSAP Ticker 단일 프레임 루프 동기화 (쫀쫀하고 즉각적인 60fps 관성 스크롤)
    if (window.Lenis && !reducedMotion && window.innerWidth >= 960) {
      var lenis = new window.Lenis({
        duration: 1.0,
        lerp: 0.11,
        smoothWheel: true,
        wheelMultiplier: 1.0
      });
      if (ST) lenis.on('scroll', ST.update);
      lenis.on('scroll', updateTelemetry);
      if (gsap && gsap.ticker) {
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
      }
    }

    if (!gsap || !ST || reducedMotion) return;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ST.refresh(); }).catch(function () {});
    }

    // 1) 히어로 5장 부채꼴 3D 덱 — 데스크톱 + 모바일 모두 GSAP Pinned 3막 시네마틱 스크롤 구동!
    gsap.from('.mn-fan-act.is-visible', { y: 16, opacity: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity' });
    gsap.from('.mn-hero-reel', { scale: 0.92, opacity: 0, duration: 0.75, delay: 0.08, ease: 'power3.out', clearProps: 'transform,opacity' });

    if (document.getElementById('mnHero')) {
      var isMob = window.innerWidth < 960;
      var actNodes = [
        document.getElementById('mnAct1'),
        document.getElementById('mnAct2'),
        document.getElementById('mnAct3')
      ];
      var lastHeroAct = 0;
      var lastHeroCut = -1;

      function setHeroAct(idx) {
        if (idx === lastHeroAct) return;
        lastHeroAct = idx;
        actNodes.forEach(function (el, i) {
          if (!el) return;
          var on = i === idx;
          el.classList.toggle('is-visible', on);
          el.setAttribute('aria-hidden', on ? 'false' : 'true');
        });
      }

      // 반응형 5장 부채꼴 3D 궤도 좌표 (데스크톱 & 모바일 각각 화면폭에 최적화)
      var g = isMob ? {
        sL2: { x: -124, y: 30, z: -100, ry: 20, rz: -15, sc: 0.68, op: 0.72 },
        sL1: { x: -70,  y: 12, z: -45,  ry: 11, rz: -7.5, sc: 0.80, op: 0.88 },
        eL2: { x: -178, y: 52, z: -80,  ry: 28, rz: -24, sc: 0.74, op: 0.88 },
        eL1: { x: -108, y: 20, z: -30,  ry: 16, rz: -13, sc: 0.86, op: 0.96 },
        wL2: { x: -290, y: 78, z: -180, ry: 52, rz: -36, sc: 0.56, op: 0.06 },
        wL1: { x: -210, y: 42, z: -120, ry: 38, rz: -24, sc: 0.66, op: 0.16 },
        bL2: { x: -148, y: 38, z: -90,  ry: 22, rz: -18, sc: 0.72, op: 0.78 },
        bL1: { x: -86,  y: 15, z: -40,  ry: 13, rz: -9,  sc: 0.84, op: 0.90 },
        cZoom: 1.12, cY: -10
      } : {
        sL2: { x: -290, y: 34, z: -130, ry: 22, rz: -14, sc: 0.82, op: 0.82 },
        sL1: { x: -160, y: 12, z: -55,  ry: 12, rz: -7,  sc: 0.91, op: 0.94 },
        eL2: { x: -455, y: 72, z: -90,  ry: 32, rz: -24, sc: 0.88, op: 0.94 },
        eL1: { x: -252, y: 26, z: -30,  ry: 18, rz: -12, sc: 0.96, op: 1.00 },
        wL2: { x: -690, y: 110, z: -220, ry: 58, rz: -36, sc: 0.64, op: 0.06 },
        wL1: { x: -480, y: 54, z: -150, ry: 42, rz: -23, sc: 0.74, op: 0.18 },
        bL2: { x: -375, y: 48, z: -110, ry: 26, rz: -18, sc: 0.85, op: 0.86 },
        bL1: { x: -208, y: 18, z: -45,  ry: 14, rz: -9,  sc: 0.93, op: 0.95 },
        cZoom: 1.20, cY: -12
      };

      // 초기 5장 부채꼴 3D 포즈 등록
      gsap.set('#mnFanDeck', { rotationX: 8 });
      gsap.set('#mnFanL2', { x: g.sL2.x, y: g.sL2.y, z: g.sL2.z, rotationY: g.sL2.ry, rotationZ: g.sL2.rz, scale: g.sL2.sc, opacity: g.sL2.op });
      gsap.set('#mnFanL1', { x: g.sL1.x, y: g.sL1.y, z: g.sL1.z, rotationY: g.sL1.ry, rotationZ: g.sL1.rz, scale: g.sL1.sc, opacity: g.sL1.op });
      gsap.set('#mnFanR1', { x: -g.sL1.x, y: g.sL1.y, z: g.sL1.z, rotationY: -g.sL1.ry, rotationZ: -g.sL1.rz, scale: g.sL1.sc, opacity: g.sL1.op });
      gsap.set('#mnFanR2', { x: -g.sL2.x, y: g.sL2.y, z: g.sL2.z, rotationY: -g.sL2.ry, rotationZ: -g.sL2.rz, scale: g.sL2.sc, opacity: g.sL2.op });
      gsap.set('#landingPhoneStage', { x: 0, y: 0, z: 40, scale: 1, opacity: 1 });
      gsap.set('#mnHudLeft', { x: -36, opacity: 0 });
      gsap.set('#mnHudRight', { x: 36, opacity: 0 });
      gsap.set('#mnMobileHud', { y: 14, opacity: 0 });

      var mobHudTexts = [
        'LINK REMIX · 컷 리듬 자동 분석',
        'AI VOICE · 747+ 스타일 · 오리지널 BGM',
        '9:16 1080p MP4 · 매장 엔딩 완성'
      ];

      var heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#mnHero',
          start: 'top top',
          end: isMob ? '+=185%' : '+=220%',
          pin: true,
          scrub: isMob ? 0.22 : 0.38,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var p = self.progress;
            var act = p < 0.28 ? 0 : (p < 0.64 ? 1 : 2);
            setHeroAct(act);
            if (p > 0.14 && p < 0.96) {
              var cut = p < 0.42 ? 0 : (p < 0.70 ? 1 : 2);
              if (cut !== lastHeroCut) {
                lastHeroCut = cut;
                var ind = INDS[current] || INDS.auto;
                if (ind && cut !== currentCut) {
                  renderCut(ind, cut);
                  scheduleNextCut();
                }
                setText('mnMobileHudText', mobHudTexts[cut] || mobHudTexts[0]);
              }
            }
            var cue = document.getElementById('mnScrollCue');
            if (cue) {
              cue.textContent = p < 0.28 ? 'SCROLL TO DIRECT · 01 / 03'
                : (p < 0.64 ? 'FAN EXPAND · 02 / 03' : 'MASTER FOCUS · 03 / 03');
            }
          }
        }
      });

      // Stage 1 (0 -> 0.36): 웅장한 부채꼴 대개방 + 3D 덱 정면 틸트 + 시네마 카메라 돌리-인 + 2.39:1 레터박스
      heroTl
        .to('#mnHeroKvImg', { scale: 1.28, yPercent: 4, ease: 'none', duration: 1 }, 0)
        .to('#mnBgWatermark', { scale: 1.18, opacity: 0.22, ease: 'power1.inOut', duration: 0.45 }, 0)
        .to('#mnFanDeck', { rotationX: 0, ease: 'power2.out', duration: 0.36 }, 0)
        .to('#mnHeroBarTop', { yPercent: 105, ease: 'power2.inOut', duration: 0.26 }, 0.05)
        .to('#mnHeroBarBot', { yPercent: -105, ease: 'power2.inOut', duration: 0.26 }, 0.05)
        .to('.mn-fan-bottom', { opacity: 0, y: 12, ease: 'power2.out', duration: 0.18 }, 0.06)
        .to('#mnFanL2', { x: g.eL2.x, y: g.eL2.y, z: g.eL2.z, rotationY: g.eL2.ry, rotationZ: g.eL2.rz, scale: g.eL2.sc, opacity: g.eL2.op, ease: 'power2.out', duration: 0.36 }, 0)
        .to('#mnFanL1', { x: g.eL1.x, y: g.eL1.y, z: g.eL1.z, rotationY: g.eL1.ry, rotationZ: g.eL1.rz, scale: g.eL1.sc, opacity: g.eL1.op, ease: 'power2.out', duration: 0.36 }, 0)
        .to('#mnFanR1', { x: -g.eL1.x, y: g.eL1.y, z: g.eL1.z, rotationY: -g.eL1.ry, rotationZ: -g.eL1.rz, scale: g.eL1.sc, opacity: g.eL1.op, ease: 'power2.out', duration: 0.36 }, 0)
        .to('#mnFanR2', { x: -g.eL2.x, y: g.eL2.y, z: g.eL2.z, rotationY: -g.eL2.ry, rotationZ: -g.eL2.rz, scale: g.eL2.sc, opacity: g.eL2.op, ease: 'power2.out', duration: 0.36 }, 0)
        // Stage 2 (0.36 -> 0.72): 좌우 4장 3D 윙 스윕(카메라 양옆으로 갈라짐) + 중앙 마스터 릴스 IMAX 돌진 + HUD 등장
        .to('#mnFanL2', { x: g.wL2.x, y: g.wL2.y, z: g.wL2.z, rotationY: g.wL2.ry, rotationZ: g.wL2.rz, scale: g.wL2.sc, opacity: g.wL2.op, ease: 'power2.inOut', duration: 0.34 }, 0.36)
        .to('#mnFanL1', { x: g.wL1.x, y: g.wL1.y, z: g.wL1.z, rotationY: g.wL1.ry, rotationZ: g.wL1.rz, scale: g.wL1.sc, opacity: g.wL1.op, ease: 'power2.inOut', duration: 0.34 }, 0.36)
        .to('#mnFanR1', { x: -g.wL1.x, y: g.wL1.y, z: g.wL1.z, rotationY: -g.wL1.ry, rotationZ: -g.wL1.rz, scale: g.wL1.sc, opacity: g.wL1.op, ease: 'power2.inOut', duration: 0.34 }, 0.36)
        .to('#mnFanR2', { x: -g.wL2.x, y: g.wL2.y, z: g.wL2.z, rotationY: -g.wL2.ry, rotationZ: -g.wL2.rz, scale: g.wL2.sc, opacity: g.wL2.op, ease: 'power2.inOut', duration: 0.34 }, 0.36)
        .to('#landingPhoneStage', { scale: g.cZoom, y: g.cY, z: 120, ease: 'power2.inOut', duration: 0.34 }, 0.36)
        .to('#mnHudLeft', { x: 0, opacity: 1, ease: 'power2.out', duration: 0.22 }, 0.42)
        .to('#mnHudRight', { x: 0, opacity: 1, ease: 'power2.out', duration: 0.22 }, 0.42)
        .to('#mnMobileHud', { y: 0, opacity: 1, ease: 'power2.out', duration: 0.22 }, 0.42)
        // Stage 3 (0.76 -> 1.0): 부채꼴 피날레 블룸 + 레터박스 오픈 -> CH 02 성명문으로 부드럽게 연결
        .to('#mnHudLeft', { x: -28, opacity: 0, ease: 'power2.in', duration: 0.18 }, 0.76)
        .to('#mnHudRight', { x: 28, opacity: 0, ease: 'power2.in', duration: 0.18 }, 0.76)
        .to('#mnMobileHud', { y: 12, opacity: 0, ease: 'power2.in', duration: 0.18 }, 0.76)
        .to('#mnFanL2', { x: g.bL2.x, y: g.bL2.y, z: g.bL2.z, rotationY: g.bL2.ry, rotationZ: g.bL2.rz, scale: g.bL2.sc, opacity: g.bL2.op, ease: 'power2.out', duration: 0.24 }, 0.76)
        .to('#mnFanL1', { x: g.bL1.x, y: g.bL1.y, z: g.bL1.z, rotationY: g.bL1.ry, rotationZ: g.bL1.rz, scale: g.bL1.sc, opacity: g.bL1.op, ease: 'power2.out', duration: 0.24 }, 0.76)
        .to('#mnFanR1', { x: -g.bL1.x, y: g.bL1.y, z: g.bL1.z, rotationY: -g.bL1.ry, rotationZ: -g.bL1.rz, scale: g.bL1.sc, opacity: g.bL1.op, ease: 'power2.out', duration: 0.24 }, 0.76)
        .to('#mnFanR2', { x: -g.bL2.x, y: g.bL2.y, z: g.bL2.z, rotationY: -g.bL2.ry, rotationZ: -g.bL2.rz, scale: g.bL2.sc, opacity: g.bL2.op, ease: 'power2.out', duration: 0.24 }, 0.76)
        .to('#landingPhoneStage', { scale: 1.04, y: 0, z: 50, ease: 'power2.out', duration: 0.24 }, 0.76)
        .to('#mnHeroBarTop', { yPercent: 0, ease: 'power2.inOut', duration: 0.22 }, 0.78)
        .to('#mnHeroBarBot', { yPercent: 0, ease: 'power2.inOut', duration: 0.22 }, 0.78)
        .to('.mn-fan-bottom', { opacity: 1, y: 0, ease: 'power2.out', duration: 0.20 }, 0.80);
    }

    // 2) CH 02 성명문 스크롤 컬러 필 (한 구절씩 어두움 -> 크림/테라코타 점등)
    var spans = document.querySelectorAll('#mnScrubText span');
    if (spans.length) {
      ST.create({
        trigger: '#mnStatement',
        start: 'top 78%',
        end: 'bottom 45%',
        scrub: 0.4,
        onUpdate: function (self) {
          var litIdx = Math.floor(self.progress * (spans.length + 0.5));
          spans.forEach(function (sp, idx) { sp.classList.toggle('is-lit', idx <= litIdx); });
        }
      });
    }

    // 3) CH 02 핀 고정 가로 스크럽 4대 엔진 (데스크톱 >= 960px)
    var hpinTrack = document.getElementById('mnHpinTrack');
    if (hpinTrack && window.innerWidth >= 960) {
      gsap.to(hpinTrack, {
        x: function () { return -(hpinTrack.scrollWidth - window.innerWidth + 80); },
        ease: 'none',
        scrollTrigger: {
          trigger: '#mnPipeline',
          start: 'top 14%',
          end: function () { return '+=' + Math.max(900, hpinTrack.scrollWidth - window.innerWidth); },
          pin: true,
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      });
    }

    // 4) CH 03 실제 앱 MacBook Pro + iPhone 3D 언폴드
    if (document.getElementById('lp3dUnfoldRig')) {
      gsap.fromTo('#lp3dUnfoldRig',
        { rotateX: 15, scale: 0.93, y: 24 },
        {
          rotateX: 0, scale: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: '#lp3dDeviceStage', start: 'top 90%', end: 'top 30%', scrub: 1.1 }
        }
      );
    }

    // 5) CH 04 필름 스트립 Velocity Skew
    var marqueeTrack = document.getElementById('lpMarqueeTrack');
    if (marqueeTrack) {
      var skewProxy = { skew: 0 };
      var skewSetter = gsap.quickSetter(marqueeTrack, 'skewX', 'deg');
      ST.create({
        trigger: '#mnGallery',
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: function (self) {
          var v = clamp(self.getVelocity() / -340, -6, 6);
          if (Math.abs(v) > Math.abs(skewProxy.skew)) {
            skewProxy.skew = v;
            gsap.to(skewProxy, {
              skew: 0, duration: 0.65, ease: 'power3.out', overwrite: true,
              onUpdate: function () { skewSetter(skewProxy.skew); }
            });
          }
        }
      });
    }

    // 6) CH 05 웜 샌드 피날레 요금제 스태거
    document.querySelectorAll('.mn-gsap-group').forEach(function (g) {
      var items = g.querySelectorAll('.mn-gsap-item');
      if (!items.length) return;
      gsap.from(items, {
        y: 28, opacity: 0, duration: 0.65, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: g, start: 'top 84%', once: true }
      });
    });
  }

  // 실제 앱 3단계 탭 전환
  var APP_VIEWS = {
    main: { desktop: '/assets/landing/studio-desktop-main.jpg', mobile: '/assets/landing/studio-mobile-main.jpg', caption: '01 · 실시간 9:16 미리보기 · 상단 컷 빠른 점프 바 · AI 대본 다시 쓰기' },
    design: { desktop: '/assets/landing/studio-desktop-design.jpg', mobile: '/assets/landing/studio-mobile-main.jpg', caption: '02 · 747종 디자인 스타일 서랍 · 내 스타일 만들기 · 지금 대본에 어울리는 자동 추천' },
    edit: { desktop: '/assets/landing/studio-desktop-design.jpg', mobile: '/assets/landing/studio-mobile-cutedit.jpg', caption: '03 · 모바일 1컷 세부 편집 · 자막 직접 수정·드래그 · 폰트·색상·전환 즉시 적용' }
  };
  var appTabs = document.querySelectorAll('.lp-app-tab[data-app-view]');
  appTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var v = APP_VIEWS[tab.getAttribute('data-app-view')] || APP_VIEWS.main;
      appTabs.forEach(function (b) {
        var on = b === tab;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      var dImg = document.getElementById('lpAppDesktopImg');
      var mImg = document.getElementById('lpAppMobileImg');
      if (dImg) dImg.setAttribute('src', v.desktop);
      if (mImg) mImg.setAttribute('src', v.mobile);
      setText('lpAppCaption', v.caption);
    });
  });

  // 오리지널 BGM 미리듣기 + 좌측 하단 글로벌 시네마 사운드 토글 공유
  var bgmAudio = null;
  var playingBgmBtn = null;
  var ambientOn = false;
  var bgmStatusEl = document.getElementById('lpBgmNowStatus');

  function syncAmbientBtn(on, label) {
    ambientOn = on;
    if (soundPillEl) soundPillEl.classList.toggle('is-on', on);
    setText('mnAmbientSoundLabel', on ? (label || 'SOUND ON') : 'SOUND OFF');
  }
  function stopAllBgm() {
    if (bgmAudio) { try { bgmAudio.pause(); } catch (e) {} }
    if (playingBgmBtn) {
      playingBgmBtn.classList.remove('is-playing');
      var ic = playingBgmBtn.querySelector('.mn-bgm-btn');
      if (ic) ic.textContent = '▶';
      playingBgmBtn = null;
    }
    if (bgmStatusEl) bgmStatusEl.textContent = 'READY';
    syncAmbientBtn(false);
  }
  if (soundPillEl) {
    soundPillEl.addEventListener('click', function () {
      if (ambientOn) { stopAllBgm(); return; }
      stopAllBgm();
      if (!bgmAudio) { bgmAudio = new Audio(); bgmAudio.loop = true; bgmAudio.volume = 0.55; }
      bgmAudio.src = '/assets/bgm/pack/cinema.mp3';
      syncAmbientBtn(true, 'CINEMA ON');
      bgmAudio.play().catch(function () {});
    });
  }
  document.querySelectorAll('#lpBgmList .mn-bgm-row').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = btn.getAttribute('data-bgm-src');
      var name = btn.getAttribute('data-bgm-name') || 'BGM';
      if (playingBgmBtn === btn) { stopAllBgm(); return; }
      stopAllBgm();
      if (!bgmAudio) { bgmAudio = new Audio(); bgmAudio.loop = true; bgmAudio.volume = 0.6; }
      bgmAudio.src = src;
      playingBgmBtn = btn;
      btn.classList.add('is-playing');
      var ic = btn.querySelector('.mn-bgm-btn');
      if (ic) ic.textContent = '❚❚';
      if (bgmStatusEl) bgmStatusEl.textContent = 'PLAYING · ' + name;
      syncAmbientBtn(true, 'PLAYING');
      bgmAudio.play().catch(function () {});
    });
  });

  // 메인 릴스 클릭/키보드 -> 다음 컷
  var mainReelEl = document.getElementById('landingPhoneStage');
  if (mainReelEl) {
    mainReelEl.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('#landingPhonePlayBtn')) return;
      var ind = INDS[current] || INDS.auto;
      if (!ind) return;
      renderCut(ind, currentCut + 1);
      scheduleNextCut();
    });
    mainReelEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var ind = INDS[current] || INDS.auto;
        if (!ind) return;
        renderCut(ind, currentCut + 1);
        scheduleNextCut();
      }
    });
  }
  var playBtn = document.getElementById('landingPhonePlayBtn');
  if (playBtn) {
    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      playing = !playing;
      syncPlayBtn();
      renderBars();
      scheduleNextCut();
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-ind],[data-go],[data-go-ind]');
    if (!t) return;
    if (t.hasAttribute('data-ind')) {
      selectIndustry(t.getAttribute('data-ind'), { fromGrid: !t.hasAttribute('data-quick') });
      return;
    }
    var url = t.hasAttribute('data-go-ind') ? '/studio?ind=' + encodeURIComponent(current) : t.getAttribute('data-go');
    try { localStorage.setItem('ar_visited_studio', '1'); } catch (err) {}
    location.href = url;
  });

  syncPlayBtn();
  selectIndustry('auto');
  renderMarqueeStrip();
  updateTelemetry();
  initMotionEngine();
})();
