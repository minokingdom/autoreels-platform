// AutoReels 랜딩 (/) — 시네마틱 스크롤-드리븐 히어로 + 마우스 3D 틸트 + 3컷 실사 미리보기
(function () {
  var INDS = window.AR_LP_INDUSTRIES || {};
  var current = 'auto';
  var currentCut = 0;
  var playing = true;
  var cutTimer = null;
  var CUT_MS = 3400;
  var lastScrollCut = -1;

  // 업종별 실제 고화질 씬 이미지 3장 (/assets/scenes/<dir>/1~3.jpg)
  var SCENE_DIR = {
    auto: 'auto',
    cafe: 'cafe',
    restaurant: 'restaurant',
    beauty: 'beauty',
    realestate: 'realestate',
    academy: 'academy',
    clinic: 'clinic',
    fitness: 'fitness',
    shop: 'shop',
    interior: 'interior',
    personal: 'cafe'
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
    var n = (cutIdx % 3) + 1;
    return '/assets/scenes/' + dir + '/' + n + '.jpg';
  }

  function buildCuts(ind) {
    var where = ind.branchPlaceholder || ind.place || '';
    var hook = ind.vlogDone || (ind.name + ' 프로모션');
    var quote = ind.chatAsk || ind.cta || '';
    var promo = ind.promoPlaceholder || ind.promise || '';
    return [
      {
        tag: 'CUT 1/3 · 후킹',
        kicker: '01 · 시선 잡기',
        hook: hook,
        sub: where + (quote ? ' · "' + quote + '"' : ''),
        tags: (ind.hashtags || []).slice(0, 3)
      },
      {
        tag: 'CUT 2/3 · AI 대본',
        kicker: '02 · 구어체 성우 대사',
        hook: quote || hook,
        sub: ind.promise || (ind.role + ' · ' + ind.product + ' 핵심 포인트를 15초 안에 깔끔하게 전달해요.'),
        tags: (ind.hashtags || []).slice(1, 5)
      },
      {
        tag: 'CUT 3/3 · 엔딩',
        kicker: '03 · 매장·혜택 엔딩',
        hook: promo || (where + '에서 만나요'),
        sub: where + ' · ' + ind.title + ' — 연락처·로고·혜택을 자동 엔딩 카드로 마무리해요.',
        tags: (ind.hashtags || []).slice(0, 4)
      }
    ];
  }

  function renderBars() {
    var wrap = document.getElementById('landingPhoneBars');
    if (!wrap) return;
    wrap.querySelectorAll('.lp-bar').forEach(function (bar, i) {
      bar.classList.remove('is-done', 'is-active', 'is-paused');
      var fill = bar.querySelector('.lp-bar-fill');
      if (fill) {
        fill.style.animation = 'none';
        void fill.offsetWidth;
        fill.style.animation = '';
      }
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
    var amb = document.getElementById('lpAmbientPhoto');
    if (amb) amb.style.backgroundImage = 'url("' + photoUrl + '")';

    setText('landingPhoneCutTag', c.tag);
    setText('landingPhoneKicker', c.kicker);
    setText('landingPhoneHook', c.hook);
    setText('landingPhoneSub', c.sub);
    var tags = document.getElementById('landingPhoneTags');
    if (tags) {
      tags.innerHTML = (c.tags || []).map(function (t) {
        return '<span class="px-1.5 py-0.5 rounded bg-black/45 border border-white/15 text-[10px] text-white/90">#' + esc(t) + '</span>';
      }).join('');
    }
    var slide = document.getElementById('landingPhoneSlide');
    if (slide) {
      slide.classList.remove('lp-cut-enter');
      void slide.offsetWidth;
      slide.classList.add('lp-cut-enter');
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
      grid.innerHTML = keys.map(function (k) {
        var it = INDS[k], on = it.key === ind.key;
        return '<button type="button" data-ind="' + esc(it.key) + '" class="px-3 py-2.5 rounded-[10px] border text-left cursor-pointer transition ' +
          (on ? 'bg-[#ededed] text-[#09090b] border-[#ededed] font-semibold' : 'bg-[#141415] hover:bg-[#1b1b1e] text-[#d4d4d8] border-[var(--border)]') + '">' +
          '<div class="text-[13px] truncate">' + esc(it.icon) + ' ' + esc(it.name) + '</div>' +
          '<div class="text-[11px] opacity-70 truncate mt-0.5">' + esc(it.role) + ' · ' + esc(it.product) + '</div></button>';
      }).join('');
    }

    var quick = document.getElementById('landingQuickInds');
    if (quick) {
      quick.innerHTML = keys.map(function (k) {
        var it = INDS[k], on = it.key === ind.key;
        return '<button type="button" data-ind="' + esc(it.key) + '" data-quick="1" class="lp-quick-chip' + (on ? ' is-active' : '') + '">' +
          esc(it.icon) + ' ' + esc(it.name) + '</button>';
      }).join('');
    }

    var where = ind.branchPlaceholder || ind.place || '';
    setText('landingPhoneBadge', ind.icon + ' ' + ind.name);
    setText('landingPhonePlace', where + ' · ' + ind.title);
    setText('landingPhonePromo', ind.promoPlaceholder || '');
    setText('landingStartIndustryBtn', ind.icon + ' ' + ind.name + josaRo(ind.name) + ' 바로 만들기 →');

    renderCut(ind, 0);
    scheduleNextCut();

    if (opts && opts.fromGrid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // =========================================================================
  // 시네마틱 스크롤 드리븐 + 마우스 3D 패럴랙스 엔진 (60fps rAF)
  // =========================================================================
  var heroEl = document.getElementById('arCineHero');
  var deckEl = document.getElementById('lpReelDeck');
  var mainReelEl = document.getElementById('landingPhoneStage');
  var fanL2 = document.querySelector('.lp-fan-l2');
  var fanL1 = document.querySelector('.lp-fan-l1');
  var fanR1 = document.querySelector('.lp-fan-r1');
  var fanR2 = document.querySelector('.lp-fan-r2');
  var hudL = document.getElementById('lpHudLeft');
  var hudR = document.getElementById('lpHudRight');
  var act1 = document.getElementById('lpAct1');
  var act2 = document.getElementById('lpAct2');
  var wmEl = document.getElementById('lpBgWatermark');
  var scrollBar = document.getElementById('lpScrollBar');
  var scrollCue = document.getElementById('lpScrollCue');
  var glowEl = document.getElementById('lpMouseGlow');

  var targetMx = 0, targetMy = 0; // -1 ~ 1
  var curMx = 0, curMy = 0;
  var targetPx = 50, targetPy = 42;
  var scrollP = 0; // 히어로 내부 스크롤 진행도 0 ~ 1
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function computeScrollProgress() {
    var docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var globalP = clamp(window.scrollY / docH, 0, 1);
    if (scrollBar) scrollBar.style.width = (globalP * 100).toFixed(2) + '%';
    if (!heroEl) return;
    var rect = heroEl.getBoundingClientRect();
    var span = Math.max(1, heroEl.offsetHeight - window.innerHeight);
    scrollP = clamp(-rect.top / span, 0, 1);
  }

  function applyCineFrame() {
    curMx += (targetMx - curMx) * 0.08;
    curMy += (targetMy - curMy) * 0.08;

    var p = scrollP;
    var spread = clamp(1 - p * 1.45, 0, 1); // 0% -> 1, 70% -> 0 (부채꼴이 서서히 열리며 빠짐)
    var focus = clamp(p * 1.4, 0, 1);        // 0% -> 0, 70% -> 1 (중앙 릴스 집중)
    var isMobile = window.innerWidth < 768;

    // 1) 전체 덱 3D 틸트 (마우스 따라 입체 반응)
    if (deckEl && !reducedMotion) {
      var rx = (-curMy * 6 * (1 - p * 0.35)).toFixed(2);
      var ry = (curMx * 8 * (1 - p * 0.35)).toFixed(2);
      deckEl.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    }

    // 2) 중앙 메인 릴스: 스크롤 시 시네마틱하게 커지며 정면 포커스
    if (mainReelEl) {
      var mScale = (1 + focus * (isMobile ? 0.05 : 0.09)).toFixed(3);
      var mY = (-focus * 6).toFixed(1);
      mainReelEl.style.transform = 'translate3d(0,' + mY + 'px,0) scale(' + mScale + ')';
    }

    // 3) 좌우 부채꼴 4장: 스크롤에 따라 바깥으로 펼쳐지며 시네마틱 페이드아웃
    var dx1 = isMobile ? 116 : 210;
    var dx2 = 380;
    var outX = (1 - spread) * (isMobile ? 90 : 170);
    if (fanL1) {
      fanL1.style.transform = 'translate(-50%, -50%) translate3d(' + (-dx1 - outX).toFixed(1) + 'px,' + (14 + (1 - spread) * 20).toFixed(1) + 'px,-60px) rotate(' + (-9 - (1 - spread) * 7).toFixed(1) + 'deg) scale(' + (0.9 - (1 - spread) * 0.08).toFixed(3) + ')';
      fanL1.style.opacity = (spread * 0.88).toFixed(3);
      fanL1.style.pointerEvents = spread > 0.25 ? 'auto' : 'none';
    }
    if (fanR1) {
      fanR1.style.transform = 'translate(-50%, -50%) translate3d(' + (dx1 + outX).toFixed(1) + 'px,' + (14 + (1 - spread) * 20).toFixed(1) + 'px,-60px) rotate(' + (9 + (1 - spread) * 7).toFixed(1) + 'deg) scale(' + (0.9 - (1 - spread) * 0.08).toFixed(3) + ')';
      fanR1.style.opacity = (spread * 0.88).toFixed(3);
      fanR1.style.pointerEvents = spread > 0.25 ? 'auto' : 'none';
    }
    if (fanL2) {
      fanL2.style.transform = 'translate(-50%, -50%) translate3d(' + (-dx2 - outX * 1.35).toFixed(1) + 'px,' + (36 + (1 - spread) * 28).toFixed(1) + 'px,-120px) rotate(' + (-17 - (1 - spread) * 9).toFixed(1) + 'deg) scale(0.8)';
      fanL2.style.opacity = (spread * 0.62).toFixed(3);
      fanL2.style.pointerEvents = spread > 0.25 ? 'auto' : 'none';
    }
    if (fanR2) {
      fanR2.style.transform = 'translate(-50%, -50%) translate3d(' + (dx2 + outX * 1.35).toFixed(1) + 'px,' + (36 + (1 - spread) * 28).toFixed(1) + 'px,-120px) rotate(' + (17 + (1 - spread) * 9).toFixed(1) + 'deg) scale(0.8)';
      fanR2.style.opacity = (spread * 0.62).toFixed(3);
      fanR2.style.pointerEvents = spread > 0.25 ? 'auto' : 'none';
    }

    // 4) 좌우 시네마틱 HUD 카드: 스크롤 32% 이후 스윽 떠오름
    var hudAlpha = clamp((p - 0.28) / 0.32, 0, 1);
    var hudY = (1 - hudAlpha) * 28;
    if (hudL) {
      hudL.style.opacity = hudAlpha.toFixed(3);
      hudL.style.transform = 'translate3d(' + (-curMx * 10).toFixed(1) + 'px, calc(-50% + ' + hudY.toFixed(1) + 'px), 0)';
    }
    if (hudR) {
      hudR.style.opacity = hudAlpha.toFixed(3);
      hudR.style.transform = 'translate3d(' + (-curMx * 10).toFixed(1) + 'px, calc(-50% + ' + hudY.toFixed(1) + 'px), 0)';
    }

    // 5) 배경 워터마크 수평 패럴랙스 + 스크롤 큐 페이드
    if (wmEl) {
      wmEl.style.transform = 'translate(calc(-50% + ' + (-p * 140).toFixed(1) + 'px), -50%)';
    }
    if (scrollCue) {
      scrollCue.style.opacity = clamp(1 - p * 4, 0, 1).toFixed(2);
    }

    // 6) 상단 타이포 1막 ↔ 2막 크로스페이드
    var inAct2 = p >= 0.44;
    if (act1 && act2) {
      act1.classList.toggle('is-visible', !inAct2);
      act1.setAttribute('aria-hidden', inAct2 ? 'true' : 'false');
      act2.classList.toggle('is-visible', inAct2);
      act2.setAttribute('aria-hidden', inAct2 ? 'false' : 'true');
    }

    // 7) 스크롤에 연동된 3컷 자동 전환 (스크롤을 내릴 때 CUT 1 -> 2 -> 3 자연 전환)
    if (p > 0.08 && p < 0.98) {
      var desiredCut = p < 0.42 ? 0 : (p < 0.74 ? 1 : 2);
      if (desiredCut !== lastScrollCut) {
        lastScrollCut = desiredCut;
        var ind = INDS[current] || INDS.auto;
        if (ind && desiredCut !== currentCut) {
          renderCut(ind, desiredCut);
          scheduleNextCut();
        }
      }
    }

    requestAnimationFrame(applyCineFrame);
  }

  window.addEventListener('scroll', computeScrollProgress, { passive: true });
  window.addEventListener('resize', computeScrollProgress, { passive: true });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    targetMx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    targetMy = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    targetPx = (e.clientX / Math.max(1, window.innerWidth)) * 100;
    targetPy = (e.clientY / Math.max(1, window.innerHeight)) * 100;
    if (glowEl) {
      glowEl.style.setProperty('--mx', targetPx.toFixed(1) + '%');
      glowEl.style.setProperty('--my', targetPy.toFixed(1) + '%');
    }
  }, { passive: true });

  // 하단 섹션 스크롤 리빌
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (ent) {
        if (ent.isIntersecting) {
          ent.target.classList.add('is-in');
          io.unobserve(ent.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.ar-reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.ar-reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  // 메인 릴스 클릭/키보드 -> 다음 컷 전환
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
  computeScrollProgress();
  requestAnimationFrame(applyCineFrame);
})();
