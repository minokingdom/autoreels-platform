// AutoReels 랜딩 (/) — GSAP 3 + ScrollTrigger 전 섹션 인터랙션 & unslop 정제 모션
(function () {
  var INDS = window.AR_LP_INDUSTRIES || {};
  var current = 'auto';
  var currentCut = 0;
  var playing = true;
  var cutTimer = null;
  var CUT_MS = 3400;
  var activeAct = 0;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      { tag: '01 / 03', kicker: '01 · 시선 잡기', hook: hook, sub: where + (quote ? ' · "' + quote + '"' : ''), tags: (ind.hashtags || []).slice(0, 3) },
      { tag: '02 / 03', kicker: '02 · 구어체 성우 대사', hook: quote || hook, sub: ind.promise || (ind.role + ' · ' + ind.product + ' 핵심 포인트를 15초 안에 전달합니다'), tags: (ind.hashtags || []).slice(1, 5) },
      { tag: '03 / 03', kicker: '03 · 매장·혜택 엔딩', hook: promo || (where + '에서 만나요'), sub: where + ' · ' + ind.title + ' — 연락처·로고·혜택 엔딩 카드', tags: (ind.hashtags || []).slice(0, 4) }
    ];
  }

  function renderBars() {
    var wrap = document.getElementById('landingPhoneBars');
    if (!wrap) return;
    wrap.querySelectorAll('.lp-bar').forEach(function (bar, i) {
      bar.classList.remove('is-done', 'is-active', 'is-paused');
      var fill = bar.querySelector('.lp-bar-fill');
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
    var amb = document.getElementById('lpAmbientPhoto');
    if (amb) amb.style.backgroundImage = 'url("' + photoUrl + '")';

    setText('landingPhoneCutTag', c.tag);
    setText('landingPhoneKicker', c.kicker);
    setText('landingPhoneHook', c.hook);
    setText('landingPhoneSub', c.sub);
    var tags = document.getElementById('landingPhoneTags');
    if (tags) {
      tags.innerHTML = (c.tags || []).map(function (t) {
        return '<span class="px-1.5 py-0.5 rounded-[4px] bg-black/45 border border-white/15 text-[10px] text-white/90">#' + esc(t) + '</span>';
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
        return '<button type="button" data-ind="' + esc(it.key) + '" class="lp-ind-card px-3.5 py-3 rounded-[10px] border text-left cursor-pointer transition-colors ' +
          (on ? 'bg-[#f2f2f0] text-[#0b0b0d] border-[#f2f2f0] font-semibold' : 'bg-[#131316] hover:bg-[#1a1a1f] text-[#d4d4d8] border-white/[0.08]') + '">' +
          '<div class="flex items-center justify-between gap-2"><span class="text-[13.5px] truncate">' + esc(it.name) + '</span><span class="font-mono text-[10.5px] opacity-55">' + num + '</span></div>' +
          '<div class="text-[11.5px] opacity-65 truncate mt-1">' + esc(it.role) + ' · ' + esc(it.product) + '</div></button>';
      }).join('');
    }

    var quick = document.getElementById('landingQuickInds');
    if (quick) {
      quick.innerHTML = keys.map(function (k) {
        var it = INDS[k], on = it.key === ind.key;
        return '<button type="button" data-ind="' + esc(it.key) + '" data-quick="1" class="lp-quick-chip' + (on ? ' is-active' : '') + '">' + esc(it.name) + '</button>';
      }).join('');
    }

    var where = ind.branchPlaceholder || ind.place || '';
    setText('landingPhoneBadge', ind.name);
    setText('landingPhonePlace', where + ' · ' + ind.title);
    setText('landingPhonePromo', ind.promoPlaceholder || '');
    setText('landingStartIndustryBtn', ind.name + josaRo(ind.name) + ' 바로 만들기');

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

  // 히어로 3막 상태 전환
  var ACT_TIMECODES = [
    '00:00 / 00:15 · 사진으로 컷 구성',
    '00:05 / 00:15 · 링크 분석 · 하이라이트',
    '00:12 / 00:15 · MP4 저장 · SNS 발행'
  ];
  function setHeroAct(idx) {
    if (idx === activeAct) return;
    activeAct = idx;
    ['lpAct1', 'lpAct2', 'lpAct3'].forEach(function (id, i) {
      var el = document.getElementById(id);
      if (!el) return;
      var on = i === idx;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    document.querySelectorAll('.lp-tl-step').forEach(function (btn, i) {
      btn.classList.toggle('is-active', i === idx);
    });
    setText('lpHeroTimecode', ACT_TIMECODES[idx] || ACT_TIMECODES[0]);
    var ind = INDS[current] || INDS.auto;
    if (ind && idx !== currentCut) {
      renderCut(ind, idx);
      scheduleNextCut();
    }
  }

  // 상단 1px 플레이헤드 진행률
  var scrollBar = document.getElementById('lpScrollBar');
  function updatePlayhead() {
    if (!scrollBar) return;
    var docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollBar.style.width = (clamp(window.scrollY / docH, 0, 1) * 100).toFixed(2) + '%';
  }
  window.addEventListener('scroll', updatePlayhead, { passive: true });
  window.addEventListener('resize', updatePlayhead, { passive: true });

  // 해시가 없는 일반 진입/새로고침 시 항상 히어로 섹션 맨 위(00:00)부터 시작
  if (!location.hash) {
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
    window.scrollTo(0, 0);
  }

  // =========================================================================
  // GSAP 3 + ScrollTrigger 전 섹션 모션 코레오그래피
  // =========================================================================
  function initGsapMotion() {
    if (!window.gsap || !window.ScrollTrigger || reducedMotion) return;
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ST.refresh(); }).catch(function () {});
    }

    // 1) 첫 화면 절제된 입장 애니메이션
    gsap.from('.lp-hero-left > *, .lp-main-reel', {
      y: 18,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
      clearProps: 'transform,opacity'
    });

    // 2) 데스크톱 히어로 3막 ScrollTrigger 스크럽 (부드러운 사이드 카드 펼침 + 메인 릴스 포커스)
    if (window.innerWidth >= 960) {
      var heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#arCineHero',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          onUpdate: function (self) {
            var p = self.progress;
            var nextAct = p < 0.36 ? 0 : (p < 0.72 ? 1 : 2);
            setHeroAct(nextAct);
          }
        }
      });
      heroTl
        .to('.lp-side-left', { xPercent: -175, opacity: 0.18, scale: 0.84, ease: 'none' }, 0)
        .to('.lp-side-right', { xPercent: 75, opacity: 0.18, scale: 0.84, ease: 'none' }, 0)
        .to('#landingPhoneStage', { scale: 1.05, ease: 'none' }, 0);
    }

    // 3) 필름 스트립: 스크롤 속도 반응형 Velocity Skew (GSAP Showcase 시그니처)
    var marqueeTrack = document.getElementById('lpMarqueeTrack');
    if (marqueeTrack) {
      var skewProxy = { skew: 0 };
      var skewSetter = gsap.quickSetter(marqueeTrack, 'skewX', 'deg');
      ST.create({
        trigger: '.lp-marquee-section',
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: function (self) {
          var v = clamp(self.getVelocity() / -360, -6, 6);
          if (Math.abs(v) > Math.abs(skewProxy.skew)) {
            skewProxy.skew = v;
            gsap.to(skewProxy, {
              skew: 0,
              duration: 0.65,
              ease: 'power3.out',
              overwrite: true,
              onUpdate: function () { skewSetter(skewProxy.skew); }
            });
          }
        }
      });
    }

    // 4) 편집실 스펙 바 숫자 카운트업 (ScrollTrigger 1회 실행)
    document.querySelectorAll('[data-count-to]').forEach(function (el) {
      var target = Number(el.getAttribute('data-count-to')) || 0;
      var suffix = el.getAttribute('data-count-suffix') || '';
      var obj = { val: 0 };
      ST.create({
        trigger: '#arLandingMetrics',
        start: 'top 84%',
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            val: target,
            duration: 1.0,
            ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.round(obj.val) + suffix; }
          });
        }
      });
    });

    // 5) 실제 앱 MacBook Pro + iPhone 쇼케이스 ScrollTrigger 3D 언폴드 (rotateX 14deg -> 0deg)
    if (document.getElementById('lp3dUnfoldRig')) {
      gsap.fromTo('#lp3dUnfoldRig',
        { rotateX: 14, scale: 0.94, y: 24 },
        {
          rotateX: 0,
          scale: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '#lp3dDeviceStage',
            start: 'top 90%',
            end: 'top 30%',
            scrub: 0.6
          }
        }
      );
    }

    // 6) 스타일 무드 4종 카드 홀짝 패럴랙스 깊이차
    document.querySelectorAll('[data-parallax-y]').forEach(function (el) {
      var dy = Number(el.getAttribute('data-parallax-y')) || 0;
      gsap.fromTo(el, { y: dy }, {
        y: -dy,
        ease: 'none',
        scrollTrigger: {
          trigger: '#arLandingGallery',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6
        }
      });
    });

    // 7) 기능·요금제·FAQ 그룹 스태거 리빌
    document.querySelectorAll('.lp-gsap-group').forEach(function (group) {
      var items = group.querySelectorAll('.lp-gsap-item');
      if (!items.length) return;
      gsap.from(items, {
        y: 22,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: group,
          start: 'top 84%',
          once: true
        }
      });
    });

    // 8) 업종 11종 그리드 웨이브 스태거 등장
    ST.create({
      trigger: '#arLandingIndustries',
      start: 'top 84%',
      once: true,
      onEnter: function () {
        gsap.from('#landingIndustryGrid .lp-ind-card', {
          y: 16,
          opacity: 0,
          duration: 0.45,
          stagger: { amount: 0.35, from: 'start' },
          ease: 'power2.out',
          clearProps: 'transform,opacity'
        });
      }
    });

    // 9) 파이널 CTA 배너 시네마틱 클립패스 확장 리빌
    if (document.getElementById('arLandingFinalCta')) {
      gsap.fromTo('#arLandingFinalCta',
        { clipPath: 'inset(10% 4% round 28px)', opacity: 0.6 },
        {
          clipPath: 'inset(0% 0% round 20px)',
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '#arLandingFinalCta',
            start: 'top 92%',
            end: 'top 48%',
            scrub: 0.6
          }
        }
      );
    }
  }

  // 히어로 타임라인 단계 버튼 클릭
  document.querySelectorAll('.lp-tl-step').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = Number(btn.getAttribute('data-act')) || 0;
      setHeroAct(idx);
      var hero = document.getElementById('arCineHero');
      if (hero && window.innerWidth >= 960) {
        var span = Math.max(1, hero.offsetHeight - window.innerHeight);
        var targets = [0, 0.50, 0.92];
        window.scrollTo({ top: Math.round(span * (targets[idx] || 0)), behavior: 'smooth' });
      }
    });
  });

  // 실제 앱 3단계 탭 전환 (GSAP 크로스페이드)
  var APP_VIEWS = {
    main: { desktop: '/assets/landing/studio-desktop-main.jpg', mobile: '/assets/landing/studio-mobile-main.jpg', caption: '실시간 9:16 미리보기 · 상단 컷 빠른 점프 바 · AI 대본 다시 쓰기' },
    design: { desktop: '/assets/landing/studio-desktop-design.jpg', mobile: '/assets/landing/studio-mobile-main.jpg', caption: '747종 디자인 스타일 서랍 · 내 스타일 만들기 · 지금 대본에 어울리는 자동 추천' },
    edit: { desktop: '/assets/landing/studio-desktop-design.jpg', mobile: '/assets/landing/studio-mobile-cutedit.jpg', caption: '모바일 1컷 세부 편집 · 자막 직접 수정·드래그 · 폰트·색상·전환 즉시 적용' }
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
      if (window.gsap && !reducedMotion) {
        window.gsap.fromTo([dImg, mImg], { opacity: 0.4 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      }
    });
  });

  // 3가지 제작 방식 탭 전환 (GSAP 스태거 등장)
  var modeTabs = document.querySelectorAll('.lp-mode-tab[data-mode]');
  var modePanels = document.querySelectorAll('.lp-mode-panel[data-mode-panel]');
  modeTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-mode');
      modeTabs.forEach(function (b) {
        var on = b === tab;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      modePanels.forEach(function (p) {
        var on = p.getAttribute('data-mode-panel') === target;
        p.classList.toggle('is-active', on);
        if (on && window.gsap && !reducedMotion) {
          window.gsap.fromTo(p.querySelectorAll('h3, li, .lp-flow-board, .lp-mock-panel'),
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.38, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity' }
          );
        }
      });
    });
  });

  // 오리지널 BGM 1클릭 미리듣기
  var bgmAudio = null;
  var playingBgmBtn = null;
  var bgmStatusEl = document.getElementById('lpBgmNowStatus');
  function stopLandingBgm() {
    if (bgmAudio) { try { bgmAudio.pause(); } catch (e) {} }
    if (playingBgmBtn) {
      playingBgmBtn.classList.remove('is-playing');
      var icon = playingBgmBtn.querySelector('.lp-bgm-btn');
      if (icon) icon.textContent = '▶';
      playingBgmBtn = null;
    }
    if (bgmStatusEl) bgmStatusEl.textContent = '대기';
  }
  document.querySelectorAll('#lpBgmList .lp-bgm-row').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = btn.getAttribute('data-bgm-src');
      var name = btn.getAttribute('data-bgm-name') || 'BGM';
      if (playingBgmBtn === btn) { stopLandingBgm(); return; }
      stopLandingBgm();
      if (!bgmAudio) { bgmAudio = new Audio(); bgmAudio.loop = true; bgmAudio.volume = 0.65; }
      bgmAudio.src = src;
      playingBgmBtn = btn;
      btn.classList.add('is-playing');
      var icon = btn.querySelector('.lp-bgm-btn');
      if (icon) icon.textContent = '❚❚';
      if (bgmStatusEl) bgmStatusEl.textContent = '재생 중 · ' + name;
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
  updatePlayhead();
  initGsapMotion();
})();
