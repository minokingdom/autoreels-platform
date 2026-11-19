// AutoReels Editorial 3D Arc Gallery — Physics Drag/Swipe + One-Way Fullscreen Scroll Expand
(function () {
  var INDS = window.AR_LP_INDUSTRIES || {};
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 해시 없는 기본 진입 시 항상 히어로 맨 위부터 시작
  if (!location.hash) {
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
    window.scrollTo(0, 0);
  }

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

  // =========================================================================
  // 1. 5장 하이엔드 에디토리얼 3D 아크 갤러리 (마우스 드래그 + 터치 스와이프 물리 관성)
  // =========================================================================
  var ITEMS = [
    {
      idx: 0, ind: 'cafe', num: '01 / 05',
      kicker: '01 · CAFE & ROASTERY',
      title: '카페·디저트 — 에스프레소 크레마가 흐르는 15초',
      img: '/assets/landing/ed-cafe.jpg',
      aura: 'radial-gradient(ellipse 56% 48% at 50% 56%, rgba(196, 146, 86, 0.14) 0%, rgba(8, 8, 8, 0) 70%)'
    },
    {
      idx: 1, ind: 'beauty', num: '02 / 05',
      kicker: '02 · BEAUTY & RITUAL',
      title: '미용·뷰티 — 빛과 질감이 머무는 브랜드 무드',
      img: '/assets/landing/ed-beauty.jpg',
      aura: 'radial-gradient(ellipse 56% 48% at 50% 56%, rgba(214, 166, 108, 0.15) 0%, rgba(8, 8, 8, 0) 70%)'
    },
    {
      idx: 2, ind: 'auto', num: '03 / 05',
      kicker: '03 · AUTOMOTIVE GALLERY',
      title: '자동차 영업 — 전시장의 실루엣이 한 편의 릴스로',
      img: '/assets/landing/ed-auto.jpg',
      aura: 'radial-gradient(ellipse 56% 48% at 50% 56%, rgba(206, 184, 152, 0.12) 0%, rgba(8, 8, 8, 0) 70%)'
    },
    {
      idx: 3, ind: 'restaurant', num: '04 / 05',
      kicker: '04 · FINE DINING',
      title: '음식점·다이닝 — 셰프의 온기와 풍미를 그대로',
      img: '/assets/landing/ed-dining.jpg',
      aura: 'radial-gradient(ellipse 56% 48% at 50% 56%, rgba(190, 128, 84, 0.14) 0%, rgba(8, 8, 8, 0) 70%)'
    },
    {
      idx: 4, ind: 'interior', num: '05 / 05',
      kicker: '05 · ARCHITECTURE & SPACE',
      title: '인테리어·공간 — 오후의 빛이 완성하는 비포·애프터',
      img: '/assets/landing/ed-interior.jpg',
      aura: 'radial-gradient(ellipse 56% 48% at 50% 56%, rgba(212, 188, 150, 0.13) 0%, rgba(8, 8, 8, 0) 70%)'
    }
  ];

  var stageEl = document.getElementById('edArcStage');
  var cardEls = Array.prototype.slice.call(document.querySelectorAll('.ed-arc-card'));
  var arcPos = 2.0;      // 현재 아크 실수 위치 (0 ~ 4)
  var arcTarget = 2.0;   // 스냅 목표 위치
  var arcVel = 0;        // 드래그/스와이프 관성 속도
  var isDragging = false;
  var dragStartX = 0;
  var dragLastX = 0;
  var dragMoved = 0;
  var activeIdx = 2;
  var scrollExpandProgress = 0; // 0(아크) -> 1(풀스크린 확장)

  function syncActiveItem(idx) {
    var it = ITEMS[idx] || ITEMS[2];
    activeIdx = it.idx;
    setText('edArcNum', it.num);
    setText('edArcTitle', it.title);
    setText('edExpandKicker', it.kicker);

    var openLink = document.getElementById('edArcOpenLink');
    if (openLink) openLink.setAttribute('href', '/studio?ind=' + it.ind);
    var expCta = document.getElementById('edExpandCta');
    if (expCta) expCta.setAttribute('href', '/studio?ind=' + it.ind);
    var expImg = document.getElementById('edExpandImg');
    if (expImg && expImg.getAttribute('src') !== it.img) expImg.setAttribute('src', it.img);
    var aura = document.getElementById('edHeroAura');
    if (aura) aura.style.background = it.aura;

    cardEls.forEach(function (el, i) {
      el.classList.toggle('is-active', i === activeIdx);
    });
  }

  function layoutArcCards() {
    var w = window.innerWidth || 1280;
    var isMob = w < 768;
    var spacing = isMob ? Math.min(138, w * 0.34) : Math.min(232, w * 0.175);
    var arcDrop = isMob ? 18 : 26;
    var zDepth = isMob ? 72 : 118;
    var spreadBoost = 1 + scrollExpandProgress * 0.55;

    for (var i = 0; i < cardEls.length; i++) {
      var el = cardEls[i];
      var rel = i - arcPos;
      var absRel = Math.abs(rel);
      var x = rel * spacing * spreadBoost;
      var y = absRel * absRel * arcDrop;
      var z = -absRel * zDepth;
      var rotY = -rel * (isMob ? 14 : 17);
      var rotZ = rel * (isMob ? 6.5 : 7.5);
      var sc = Math.max(0.72, 1 - absRel * 0.095);
      var op = Math.max(0.18, 1 - absRel * 0.24);

      // 스크롤 풀스크린 확장 시 좌우 카드들은 자연스럽게 바깥으로 페이드아웃
      if (scrollExpandProgress > 0.02 && i !== activeIdx) {
        op *= Math.max(0, 1 - scrollExpandProgress * 2.2);
      }

      el.style.zIndex = String(10 - Math.round(absRel * 2));
      el.style.opacity = op.toFixed(3);
      el.style.transform =
        'translate3d(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px, ' + z.toFixed(1) + 'px) ' +
        'rotateY(' + rotY.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
    }
  }

  function tickArc() {
    if (!isDragging) {
      if (Math.abs(arcVel) > 0.0012) {
        arcPos += arcVel;
        arcVel *= 0.90;
        if (arcPos < -0.25) { arcPos = -0.25; arcVel = 0; }
        if (arcPos > ITEMS.length - 0.75) { arcPos = ITEMS.length - 0.75; arcVel = 0; }
        arcTarget = clamp(Math.round(arcPos), 0, ITEMS.length - 1);
      } else {
        arcVel = 0;
        var diff = arcTarget - arcPos;
        if (Math.abs(diff) > 0.0008) {
          arcPos += diff * 0.13;
        } else {
          arcPos = arcTarget;
        }
      }
    }

    var nearest = clamp(Math.round(arcPos), 0, ITEMS.length - 1);
    if (nearest !== activeIdx) syncActiveItem(nearest);
    layoutArcCards();
    requestAnimationFrame(tickArc);
  }

  if (stageEl && cardEls.length) {
    syncActiveItem(2);
    layoutArcCards();
    requestAnimationFrame(tickArc);

    stageEl.addEventListener('pointerdown', function (e) {
      if (scrollExpandProgress > 0.2) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragLastX = e.clientX;
      dragMoved = 0;
      arcVel = 0;
      stageEl.classList.add('is-dragging');
      try { stageEl.setPointerCapture(e.pointerId); } catch (err) {}
    });

    stageEl.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      var dx = e.clientX - dragLastX;
      dragLastX = e.clientX;
      dragMoved += Math.abs(dx);
      var divisor = window.innerWidth < 768 ? 165 : 230;
      var delta = -dx / divisor;
      arcPos = clamp(arcPos + delta, -0.35, ITEMS.length - 0.65);
      arcVel = delta * 0.85;
      arcTarget = clamp(Math.round(arcPos), 0, ITEMS.length - 1);
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      stageEl.classList.remove('is-dragging');
      try { if (e && e.pointerId != null) stageEl.releasePointerCapture(e.pointerId); } catch (err) {}
      if (Math.abs(arcVel) > 0.03) {
        arcTarget = clamp(Math.round(arcPos + arcVel * 4.5), 0, ITEMS.length - 1);
      } else {
        arcTarget = clamp(Math.round(arcPos), 0, ITEMS.length - 1);
      }
    }
    stageEl.addEventListener('pointerup', endDrag);
    stageEl.addEventListener('pointercancel', endDrag);

    // 카드 클릭 시 해당 카드로 부드럽게 회전 (드래그 직후 오작동 방지)
    cardEls.forEach(function (el, idx) {
      el.addEventListener('click', function () {
        if (dragMoved > 10 || scrollExpandProgress > 0.2) return;
        arcVel = 0;
        arcTarget = idx;
      });
    });

    var prevBtn = document.getElementById('edArcPrev');
    var nextBtn = document.getElementById('edArcNext');
    if (prevBtn) prevBtn.addEventListener('click', function () { arcVel = 0; arcTarget = clamp(activeIdx - 1, 0, ITEMS.length - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { arcVel = 0; arcTarget = clamp(activeIdx + 1, 0, ITEMS.length - 1); });

    window.addEventListener('keydown', function (e) {
      if (window.scrollY > window.innerHeight * 0.5) return;
      if (e.key === 'ArrowLeft') { arcVel = 0; arcTarget = clamp(activeIdx - 1, 0, ITEMS.length - 1); }
      if (e.key === 'ArrowRight') { arcVel = 0; arcTarget = clamp(activeIdx + 1, 0, ITEMS.length - 1); }
    });
  }

  // =========================================================================
  // 2. Lenis + GSAP 3 + ScrollTrigger (단방향 풀스크린 시네마 익스팬드 — PC & 모바일)
  // =========================================================================
  function initMotion() {
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;
    if (gsap && ST) {
      gsap.registerPlugin(ST);
      ST.config({ ignoreMobileResize: true });
    }

    // 데스크톱 관성 스크롤 (쫀쫀한 반응성)
    if (window.Lenis && !reducedMotion && window.innerWidth >= 960) {
      var lenis = new window.Lenis({
        duration: 1.0,
        lerp: 0.11,
        smoothWheel: true,
        wheelMultiplier: 1.0
      });
      if (ST) lenis.on('scroll', ST.update);
      lenis.on('scroll', syncNavPolarity);
      if (gsap && gsap.ticker) {
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      }
    }

    if (!gsap || !ST || reducedMotion) return;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ST.refresh(); }).catch(function () {});
    }

    // CH 01 히어로 단방향 풀스크린 시네마 익스팬드 (PC & 모바일 동일 작동, 되돌림 ZERO)
    var heroEl = document.getElementById('edHero');
    var expLayer = document.getElementById('edExpandLayer');
    if (heroEl && expLayer) {
      var isMob = window.innerWidth < 768;
      var startInset = isMob ? 'inset(26% 22% 16% 22% round 14px)' : 'inset(23% 39% 16% 39% round 14px)';
      gsap.set(expLayer, { clipPath: startInset, opacity: 0 });
      gsap.set('#edExpandImg', { scale: 1.12 });
      gsap.set('#edExpandCopy', { opacity: 0, y: 28 });

      var heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#edHero',
          start: 'top top',
          end: isMob ? '+=135%' : '+=155%',
          pin: true,
          scrub: isMob ? 0.22 : 0.35,
          anticipatePin: 1,
          onUpdate: function (self) {
            scrollExpandProgress = self.progress;
            expLayer.classList.toggle('is-interactive', self.progress > 0.48);
          }
        }
      });

      heroTl
        .to('#edHeroHeader', { y: -36, opacity: 0, ease: 'power2.in', duration: 0.32 }, 0)
        .to('#edHeroFooter', { y: 24, opacity: 0, ease: 'power2.in', duration: 0.28 }, 0)
        .to(expLayer, { opacity: 1, ease: 'power1.out', duration: 0.14 }, 0.06)
        .to(expLayer, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 0.52 }, 0.10)
        .to('#edExpandImg', { scale: 1.0, ease: 'power2.out', duration: 0.65 }, 0.10)
        .to('#edExpandCopy', { opacity: 1, y: 0, ease: 'power2.out', duration: 0.32 }, 0.56);
    }

    // CH 02 매니페스토 구절별 스크롤 점등
    var spans = document.querySelectorAll('#edManifesto span');
    if (spans.length) {
      ST.create({
        trigger: '#edManifesto',
        start: 'top 80%',
        end: 'bottom 45%',
        scrub: 0.3,
        onUpdate: function (self) {
          var litIdx = Math.floor(self.progress * (spans.length + 0.5));
          spans.forEach(function (sp, idx) { sp.classList.toggle('is-lit', idx <= litIdx); });
        }
      });
    }

    // CH 02 4대 엔진 & 섹션 리빌
    gsap.utils.toArray('.ed-reveal').forEach(function (el, idx) {
      gsap.from(el, {
        y: 24, opacity: 0, duration: 0.7, delay: (idx % 4) * 0.06, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    // CH 03 맥북 + 아이폰 3D 언폴드
    var hwStage = document.getElementById('edHardwareStage');
    if (hwStage) {
      gsap.fromTo(hwStage,
        { rotateX: 12, y: 32, opacity: 0.7 },
        { rotateX: 0, y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: hwStage, start: 'top 86%', end: 'top 32%', scrub: 0.6 } }
      );
    }
  }

  // 상단 네비게이션 라이트/다크 자동 극성 반전
  var navEl = document.getElementById('edNav');
  var lightZoneEl = document.getElementById('edLightZone');
  function syncNavPolarity() {
    if (!navEl || !lightZoneEl) return;
    var r = lightZoneEl.getBoundingClientRect();
    var isLight = r.top <= 56 && r.bottom >= 56;
    navEl.classList.toggle('is-light', isLight);
  }
  window.addEventListener('scroll', syncNavPolarity, { passive: true });
  window.addEventListener('resize', syncNavPolarity, { passive: true });

  // =========================================================================
  // 3. 실제 /studio 화면 탭 전환
  // =========================================================================
  var APP_VIEWS = {
    edit: {
      desktop: '/assets/landing/studio-desktop-main.jpg',
      mobile: '/assets/landing/studio-mobile-main.jpg',
      caption: '주제 선택부터 대본·사진 배치·실시간 9:16 미리보기까지 한 화면에서 작업합니다.'
    },
    design: {
      desktop: '/assets/landing/studio-desktop-design.jpg',
      mobile: '/assets/landing/studio-mobile-main.jpg',
      caption: '747종 스타일 프리셋과 나만의 브랜드 색·폰트 조합을 즉시 적용합니다.'
    },
    cutedit: {
      desktop: '/assets/landing/studio-desktop-main.jpg',
      mobile: '/assets/landing/studio-mobile-cutedit.jpg',
      caption: '모바일에서도 컷별 이동·사진 교체·자막 편집과 1080p MP4 저장까지 바로 이어집니다.'
    }
  };
  document.querySelectorAll('[data-app-view]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var k = btn.getAttribute('data-app-view');
      var v = APP_VIEWS[k];
      if (!v) return;
      document.querySelectorAll('[data-app-view]').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      var dImg = document.getElementById('lpAppDesktopImg');
      var mImg = document.getElementById('lpAppMobileImg');
      if (dImg) dImg.setAttribute('src', v.desktop);
      if (mImg) mImg.setAttribute('src', v.mobile);
      setText('lpAppCaption', v.caption);
    });
  });

  // =========================================================================
  // 4. 11개 업종 선택 & 4곡 오리지널 BGM 미리듣기
  // =========================================================================
  var selectedInd = 'auto';
  function renderIndustryGrid() {
    var grid = document.getElementById('edIndustryGrid');
    if (!grid) return;
    var keys = Object.keys(INDS);
    if (!keys.length) return;
    grid.innerHTML = keys.map(function (k) {
      var it = INDS[k];
      var on = it.key === selectedInd;
      return '<button type="button" data-ind="' + esc(it.key) + '" class="ed-ind-chip' + (on ? ' is-active' : '') + '">' + esc(it.name) + '</button>';
    }).join('');
    var cur = INDS[selectedInd] || INDS.auto;
    var btn = document.getElementById('edStartIndustryBtn');
    if (btn && cur) {
      btn.setAttribute('data-go', '/studio?ind=' + cur.key);
      btn.textContent = cur.name + josaRo(cur.name) + ' 시작하기 →';
    }
  }
  renderIndustryGrid();

  var bgmAudio = null;
  var playingBgmBtn = null;
  function stopBgm() {
    if (bgmAudio) { try { bgmAudio.pause(); bgmAudio.currentTime = 0; } catch (e) {} }
    if (playingBgmBtn) {
      playingBgmBtn.classList.remove('is-playing');
      var pl = playingBgmBtn.querySelector('.ed-bgm-play');
      if (pl) pl.textContent = 'PLAY';
      playingBgmBtn = null;
    }
  }

  document.addEventListener('click', function (e) {
    var bgmBtn = e.target.closest('[data-bgm-src]');
    if (bgmBtn) {
      var src = bgmBtn.getAttribute('data-bgm-src');
      if (playingBgmBtn === bgmBtn) { stopBgm(); return; }
      stopBgm();
      try {
        if (!bgmAudio) bgmAudio = new Audio();
        bgmAudio.src = src;
        bgmAudio.volume = 0.6;
        bgmAudio.play().catch(function () {});
        bgmAudio.onended = stopBgm;
        playingBgmBtn = bgmBtn;
        bgmBtn.classList.add('is-playing');
        var pl = bgmBtn.querySelector('.ed-bgm-play');
        if (pl) pl.textContent = 'STOP';
      } catch (err) {}
      return;
    }

    var indBtn = e.target.closest('#edIndustryGrid [data-ind]');
    if (indBtn) {
      selectedInd = indBtn.getAttribute('data-ind') || 'auto';
      renderIndustryGrid();
      return;
    }

    var goBtn = e.target.closest('[data-go]');
    if (goBtn) {
      var target = goBtn.getAttribute('data-go');
      if (target) location.href = target;
    }
  });

  initMotion();
  syncNavPolarity();
})();
