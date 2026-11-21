// 오토릴스메이커 랜딩 — 히어로 릴스 재생기, 제작 화면 탭, 업종·배경음악 미리듣기
(function () {
  var INDS = window.AR_LP_INDUSTRIES || {};
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  function josaRo(word) {
    var s = String(word || '').trim();
    if (!s) return '로';
    var code = s.charCodeAt(s.length - 1);
    if (code < 0xAC00 || code > 0xD7A3) return '로';
    var jong = (code - 0xAC00) % 28;
    return (jong === 0 || jong === 8) ? '로' : '으로';
  }

  // =========================================================================
  // 1. 히어로 릴스 재생기 — 컷 3개 × 업종 5개 (자동차 영상에는 전화번호를 넣지 않음)
  // =========================================================================
  var REELS = {
    auto: {
      label: '자동차 영업', noun: '전시장', who: '카마스터의', accent: '#e6aa5c', img: '/assets/landing/ed-auto.jpg', bgm: '/assets/bgm/pack/cinema.mp3',
      name: '오토 공식전시장', avatar: '차', likes: '1,284', comments: '96',
      music: '시네마틱 드라이브 · 오토릴스 오리지널',
      caption: '신차 견적은 댓글에 ‘견적’이라고 남겨 주세요 #신차견적 #즉시출고',
      subs: ['이번 달 바로 출고,\n딱 세 대 남았어요', '전시장 조명 아래서 보면\n색이 또 달라요', '궁금하면 댓글에\n‘견적’ 남겨 주세요']
    },
    restaurant: {
      label: '음식점', noun: '가게', who: '음식점 사장님의', accent: '#f08a5d', img: '/assets/landing/ed-dining.jpg', bgm: '/assets/bgm/pack/funk.mp3',
      name: '오늘의 한상', avatar: '한', likes: '3,072', comments: '214',
      music: '키친 그루브 · 오토릴스 오리지널',
      caption: '이번 주말 단체 예약 받습니다 #동네맛집 #오늘뭐먹지',
      subs: ['오늘 들어온 한우,\n스무 접시만 준비했어요', '겉은 바삭하게,\n속은 촉촉하게 구웠습니다', '주말 예약은\n댓글로 남겨 주세요']
    },
    cafe: {
      label: '카페', noun: '카페', who: '카페 사장님의', accent: '#e8c48f', img: '/assets/landing/ed-cafe.jpg', bgm: '/assets/bgm/pack/cafe.mp3',
      name: '골목 로스터리', avatar: '골', likes: '2,418', comments: '131',
      music: '카페 로파이 · 오토릴스 오리지널',
      caption: '프로필 링크에서 첫 방문 쿠폰 받아 가세요 #카페추천 #핸드드립',
      subs: ['아침 첫 잔은\n매일 제가 직접 내려요', '크레마가 살아 있을 때\n한 모금 드셔 보세요', '첫 방문 쿠폰은\n프로필 링크에 있어요']
    },
    beauty: {
      label: '뷰티', noun: '샵', who: '뷰티샵 원장님의', accent: '#e9a7b4', img: '/assets/landing/ed-beauty.jpg', bgm: '/assets/bgm/pack/beauty.mp3',
      name: '결 스킨랩', avatar: '결', likes: '1,960', comments: '88',
      music: '라운지 앰비언트 · 오토릴스 오리지널',
      caption: '관리 예약은 댓글 ‘예약’으로 받아요 #피부관리 #홈케어',
      subs: ['바르는 순간\n결이 달라지는 세럼이에요', '집에서 관리하는 법도\n같이 알려 드려요', '예약은 댓글에\n‘예약’이라고 남겨 주세요']
    },
    interior: {
      label: '인테리어', noun: '시공 현장', who: '인테리어 대표님의', accent: '#b8c99f', img: '/assets/landing/ed-interior.jpg', bgm: '/assets/bgm/pack/bright.mp3',
      name: '오후 인테리어', avatar: '오', likes: '2,105', comments: '172',
      music: '브라이트 데이 · 오토릴스 오리지널',
      caption: '30평 아파트 시공 사례 더 보기는 프로필에서 #거실인테리어 #시공사례',
      subs: ['30평 거실,\n공사 전과 후예요', '오후 빛이 들어오게\n창을 넓혔어요', '견적 상담은\n댓글로 편하게 물어보세요']
    }
  };
  var CUT_MS = 2900;
  var reelKey = 'auto';
  var cutIdx = 0;
  var cutTimer = null;
  var reelVisible = true;
  var heroP = 0;          // 히어로 스크롤 진행도 0~1
  var fullCut = -1;       // 전체 화면에서 보이는 컷

  var reelEl = $('lpReel');
  var imgEl = $('lpReelImg');
  var subEl = $('lpReelSub');
  var progEl = $('lpReelProgress');

  function showCut(i) {
    var r = REELS[reelKey];
    cutIdx = i % r.subs.length;
    if (reelEl) {
      reelEl.classList.remove('cut-0', 'cut-1', 'cut-2');
      void reelEl.offsetWidth; // 애니메이션 다시 시작
      reelEl.classList.add('cut-' + cutIdx);
    }
    if (subEl) subEl.textContent = r.subs[cutIdx];
    if (progEl) {
      progEl.style.transition = 'none';
      progEl.style.width = (cutIdx / r.subs.length * 100) + '%';
      void progEl.offsetWidth;
      progEl.style.transition = 'width ' + CUT_MS + 'ms linear';
      progEl.style.width = ((cutIdx + 1) / r.subs.length * 100) + '%';
    }
  }
  function schedule() {
    clearTimeout(cutTimer);
    if (!reelVisible || document.hidden || heroP > 0.3) return;
    cutTimer = setTimeout(function () { showCut(cutIdx + 1); schedule(); }, reducedMotion ? CUT_MS + 1500 : CUT_MS);
  }
  function setReel(key) {
    var r = REELS[key];
    if (!r) return;
    reelKey = key;
    if (imgEl) imgEl.setAttribute('src', r.img);
    setText('lpReelName', r.name);
    setText('lpReelAvatar', r.avatar);
    setText('lpReelLikes', r.likes);
    setText('lpReelComments', r.comments);
    setText('lpReelCaption', r.caption.replace(/#/g, '#\u2060')); // 해시태그가 '#'만 남고 줄바꿈되지 않게
    setText('lpReelMusic', r.music);
    if (reelEl) reelEl.setAttribute('aria-label', r.label + ' 릴스 예시 재생 중');
    var cta = $('lpHeroCta');
    if (cta) cta.setAttribute('href', '/studio?ind=' + key);
    var fcta = $('lpFullCta');
    if (fcta) fcta.setAttribute('href', '/studio?ind=' + key);
    var fimg = $('lpFullImg');
    if (fimg) fimg.setAttribute('src', r.img);
    setText('lpFullName', r.name);
    setText('lpFullAvatar', r.avatar);
    fullCut = -1;
    document.querySelectorAll('[data-reel]').forEach(function (b) {
      var on = b.getAttribute('data-reel') === key;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    applyTheme(key);
    if (soundOn) playBgm(r.bgm, null);
    showCut(0);
    schedule();
  }

  // =========================================================================
  // 1-1. 업종 테마 (장면 색감·강조색·제목·모아보기) + 시간대 조명
  // =========================================================================
  var TOD = (function () {
    var h = new Date().getHours();
    var key = h >= 6 && h < 11 ? 'morning' : h >= 11 && h < 14 ? 'noon' : h >= 14 && h < 18 ? 'afternoon' : h >= 18 && h < 22 ? 'evening' : 'night';
    var word = { morning: '아침', noon: '점심', afternoon: '오후', evening: '저녁', night: '밤' }[key];
    var ampm = h < 12 ? '오전' : '오후';
    var hh = h % 12 === 0 ? 12 : h % 12;
    return { key: key, word: word, clock: ampm + ' ' + hh + '시' };
  })();
  // 시간대에 맞는 첫 업종: 아침 카페 → 점심 음식점 → 오후 뷰티 → 늦은 오후 인테리어 → 저녁·밤 자동차
  function themeForTime() {
    var h = new Date().getHours();
    if (h >= 6 && h < 11) return 'cafe';
    if (h >= 11 && h < 14) return 'restaurant';
    if (h >= 14 && h < 16) return 'beauty';
    if (h >= 16 && h < 19) return 'interior';
    return 'auto';
  }
  function pickInitialTheme() {
    var keys = Object.keys(REELS);
    try {
      var q = new URLSearchParams(location.search).get('theme');
      if (q && REELS[q]) return q;
    } catch (e) {}
    var last = null;
    try { last = localStorage.getItem('ar_lp_theme'); } catch (e) {}
    // 다시 온 사람은 지난번 다음 업종, 처음 온 사람은 시간대에 맞는 업종
    if (last && REELS[last]) return keys[(keys.indexOf(last) + 1) % keys.length];
    return themeForTime();
  }
  var tintFront = 'A';
  function applyTheme(key) {
    var r = REELS[key];
    var root = document.documentElement;
    root.setAttribute('data-theme', key);
    root.setAttribute('data-tod', TOD.key);
    setText('lpH1a', r.noun + ' 사진 몇 장이면');
    setText('lpHeroTime', TOD.clock + ' · ' + r.who + ' ' + TOD.word + ' 릴스');
    // 장면 색감: 두 장을 번갈아 겹쳐 부드럽게 바꿈
    var a = $('lpTint' + tintFront), b = $('lpTint' + (tintFront === 'A' ? 'B' : 'A'));
    if (a && b && a.getAttribute('src') !== r.img) {
      b.setAttribute('src', r.img);
      b.classList.add('is-on'); a.classList.remove('is-on');
      tintFront = tintFront === 'A' ? 'B' : 'A';
    } else if (a) { a.classList.add('is-on'); }
    document.querySelectorAll('[data-gal]').forEach(function (g) {
      var on = g.getAttribute('data-gal') === key;
      g.classList.toggle('is-on', on);
      g.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    root.style.setProperty('--lp-final-img', 'url(' + r.img + ')');
    try { localStorage.setItem('ar_lp_theme', key); } catch (e) {}
  }
  function renderGallery() {
    var row = $('lpGalleryRow');
    if (!row) return;
    row.innerHTML = Object.keys(REELS).map(function (k) {
      var r = REELS[k];
      return '<button type="button" role="radio" aria-checked="false" class="lp-gal" data-gal="' + k + '" data-reel="' + k + '" style="--gal-accent:' + r.accent + '">' +
        '<span class="lp-gal-media"><img src="' + r.img + '" alt="" loading="lazy" /></span>' +
        '<span class="lp-gal-sub">' + esc(r.subs[0]) + '</span>' +
        '<span class="lp-gal-meta"><b>' + esc(r.label) + '</b><i>' + esc(r.name) + '</i></span>' +
      '</button>';
    }).join('');
  }
  renderGallery();

  // 다른 업종 사진은 미리 받아 둠 (전환 때 깜빡임 방지)
  window.addEventListener('load', function () {
    Object.keys(REELS).forEach(function (k) { var im = new Image(); im.src = REELS[k].img; });
  });
  if (reelEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (ents) {
      reelVisible = ents[0].isIntersecting;
      if (reelVisible) schedule(); else clearTimeout(cutTimer);
    }).observe(reelEl);
  }
  document.addEventListener('visibilitychange', schedule);

  // =========================================================================
  // 2. 배경음악 (히어로 소리 버튼 + 음악 목록 공용)
  // =========================================================================
  var bgmAudio = null;
  var playingBgmBtn = null;
  var soundOn = false;
  var soundBtn = $('lpReelSound');

  function resetRowBtn() {
    if (playingBgmBtn) {
      playingBgmBtn.classList.remove('is-playing');
      var st = playingBgmBtn.querySelector('.lp-bgm-state');
      if (st) st.textContent = '재생';
      playingBgmBtn = null;
    }
  }
  function setSound(on) {
    soundOn = on;
    if (soundBtn) {
      soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      soundBtn.setAttribute('aria-label', on ? '배경음악 끄기' : '배경음악 듣기');
    }
  }
  function stopBgm() {
    if (bgmAudio) { try { bgmAudio.pause(); bgmAudio.currentTime = 0; } catch (e) {} }
    resetRowBtn();
    setSound(false);
  }
  function playBgm(src, rowBtn) {
    try {
      if (!bgmAudio) bgmAudio = new Audio();
      if (bgmAudio.getAttribute('src') !== src) bgmAudio.src = src;
      bgmAudio.volume = 0.6;
      bgmAudio.loop = !rowBtn;
      bgmAudio.play().catch(function () {});
      bgmAudio.onended = stopBgm;
    } catch (err) {}
  }
  if (soundBtn) {
    soundBtn.addEventListener('click', function () {
      if (soundOn) { stopBgm(); return; }
      resetRowBtn();
      setSound(true);
      playBgm(REELS[reelKey].bgm, null);
    });
  }

  // =========================================================================
  // 3. 제작 화면 탭
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
      caption: '747가지 스타일을 미리보기로 바로 바꿔 보고, 브랜드 색과 글꼴도 정할 수 있습니다.'
    },
    cutedit: {
      desktop: '/assets/landing/studio-desktop-main.jpg',
      mobile: '/assets/landing/studio-mobile-cutedit.jpg',
      caption: '휴대폰에서도 컷별 사진 교체·자막 편집과 1080p MP4 저장까지 이어집니다.'
    }
  };

  // =========================================================================
  // 4. 업종 목록
  // =========================================================================
  var selectedInd = 'auto';
  function renderIndustryGrid() {
    var grid = $('edIndustryGrid');
    if (!grid) return;
    var keys = Object.keys(INDS);
    if (!keys.length) return;
    grid.innerHTML = keys.map(function (k) {
      var it = INDS[k];
      var on = it.key === selectedInd;
      return '<button type="button" data-ind="' + esc(it.key) + '" aria-pressed="' + on + '" class="lp-chip' + (on ? ' is-on' : '') + '">' + esc(it.name) + '</button>';
    }).join('');
    var cur = INDS[selectedInd] || INDS.auto;
    var btn = $('edStartIndustryBtn');
    if (btn && cur) {
      btn.setAttribute('data-go', '/studio?ind=' + cur.key);
      btn.textContent = cur.name + josaRo(cur.name) + ' 시작하기';
    }
  }
  renderIndustryGrid();

  // =========================================================================
  // 5. 클릭 처리
  // =========================================================================
  document.addEventListener('click', function (e) {
    var pick = e.target.closest('[data-reel]');
    if (pick) { setReel(pick.getAttribute('data-reel')); return; }

    var tab = e.target.closest('[data-app-view]');
    if (tab) {
      var v = APP_VIEWS[tab.getAttribute('data-app-view')];
      if (!v) return;
      document.querySelectorAll('[data-app-view]').forEach(function (b) {
        b.classList.toggle('is-on', b === tab);
        b.setAttribute('aria-selected', b === tab ? 'true' : 'false');
      });
      var dImg = $('lpAppDesktopImg'), mImg = $('lpAppMobileImg');
      if (dImg) dImg.setAttribute('src', v.desktop);
      if (mImg) mImg.setAttribute('src', v.mobile);
      setText('lpAppCaption', v.caption);
      return;
    }

    var bgmBtn = e.target.closest('[data-bgm-src]');
    if (bgmBtn) {
      if (playingBgmBtn === bgmBtn) { stopBgm(); return; }
      stopBgm();
      playBgm(bgmBtn.getAttribute('data-bgm-src'), bgmBtn);
      playingBgmBtn = bgmBtn;
      bgmBtn.classList.add('is-playing');
      var st = bgmBtn.querySelector('.lp-bgm-state');
      if (st) st.textContent = '정지';
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

  // 스크롤하면 상단 메뉴에 밑줄
  var navEl = $('lpNav');
  function syncNav() { if (navEl) navEl.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', syncNav, { passive: true });
  syncNav();

  // =========================================================================
  // 6. 히어로 스크롤 연출 + 마우스 기울기 + 휴대폰 밀어서 업종 바꾸기
  // =========================================================================
  var heroEl = $('lpHero');
  var pinEl = $('lpHeroPin');
  var phoneEl = $('lpPhone');
  var sceneImg = document.querySelector('#lpHeroScene img');
  var dimEl = $('lpHeroDim');
  var fullEl = $('lpFull');
  var fullImg = $('lpFullImg');
  var fullSub = $('lpFullSub');
  var fullEnd = $('lpFullEnd');
  var fullHint = $('lpFullHint');
  var fullBars = fullEl ? fullEl.querySelectorAll('.lp-full-bars b') : [];
  var fadeEls = ['.lp-hero-copy', '.lp-picker', '.lp-hero-actions'].map(function (q) { return document.querySelector(q); });
  var base = null;       // 휴대폰 원래 위치(고정 영역 기준)
  var tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0;
  var heroOn = true;

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // 컷별 화면 구도 (휴대폰 미리보기와 같은 움직임을 스크롤로)
  var CUT_FRAMES = [
    [1.16, 0, 0, 1.04, 0, 0],
    [1.5, 9, 4, 1.42, 4, 2],
    [1.32, -6, -6, 1.48, -7, -8]
  ];

  function measure() {
    if (!phoneEl || !pinEl) return;
    var old = phoneEl.style.transform;
    phoneEl.style.transform = 'none';
    var pr = pinEl.getBoundingClientRect();
    var r = phoneEl.getBoundingClientRect();
    phoneEl.style.transform = old;
    base = { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height, W: pr.width, H: pr.height };
  }

  function applyHero() {
    if (!heroEl || !base) return;
    var rect = heroEl.getBoundingClientRect();
    var span = heroEl.offsetHeight - window.innerHeight;
    var p = span > 0 ? clamp01(-rect.top / span) : 0;
    heroP = p;

    var e1 = ease(seg(p, 0, 0.14));     // 제목 빠짐
    var e2 = ease(seg(p, 0.04, 0.34));  // 휴대폰 가운데로, 카메라 다가감
    var e3 = ease(seg(p, 0.34, 0.54));  // 릴스가 화면 전체로
    var e4 = seg(p, 0.58, 0.94);        // 스크롤로 컷 넘김
    var e5 = ease(seg(p, 0.9, 0.98));   // 마지막 버튼

    fadeEls.forEach(function (el, i) {
      if (!el) return;
      el.style.opacity = String(1 - e1);
      el.style.transform = 'translate3d(0,' + (-48 * e1 - i * 10 * e1).toFixed(1) + 'px,0)';
      el.style.visibility = e1 >= 1 ? 'hidden' : '';
    });
    if (sceneImg) sceneImg.style.transform = 'scale(' + (1 + 0.22 * e2 + 0.1 * e3).toFixed(4) + ') translate3d(' + (-tiltX * 10).toFixed(1) + 'px,' + (-tiltY * 8).toFixed(1) + 'px,0)';
    if (dimEl) dimEl.style.opacity = (0.35 * e2 + 0.5 * e3).toFixed(3);

    // 휴대폰: 원래 자리 → 화면 가운데, 조금 커짐
    var targetH = base.H * 0.82;
    var sc = lerp(1, Math.max(1, targetH / base.h), e2);
    var cx0 = base.x + base.w / 2, cy0 = base.y + base.h / 2;
    var dx = (base.W / 2 - cx0) * e2, dy = (base.H / 2 - cy0) * e2;
    var tilt = 1 - e2;
    if (phoneEl) {
      phoneEl.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ') perspective(900px) rotateY(' + (tiltX * 7 * tilt).toFixed(2) + 'deg) rotateX(' + (-tiltY * 5 * tilt).toFixed(2) + 'deg)';
      phoneEl.style.opacity = String(1 - clamp01((e3 - 0.1) * 5));
    }

    // 전체 화면 레이어: 휴대폰 화면 크기에서 시작해 화면 끝까지 펼쳐짐
    if (fullEl) {
      var pad = 8 * sc;
      var cw = base.w * sc, ch = base.h * sc;
      var left = cx0 + dx - cw / 2 + pad, top = cy0 + dy - ch / 2 + pad;
      var right = base.W - (left + cw - 2 * pad), bottom = base.H - (top + ch - 2 * pad);
      var k = 1 - e3;
      var rad = 36 * sc * k;
      fullEl.style.clipPath = 'inset(' + (top * k).toFixed(1) + 'px ' + (right * k).toFixed(1) + 'px ' + (bottom * k).toFixed(1) + 'px ' + (left * k).toFixed(1) + 'px round ' + rad.toFixed(1) + 'px)';
      fullEl.style.opacity = String(clamp01(e3 * 5));
      var live = e3 > 0.6;
      fullEl.classList.toggle('is-live', live);
      if (live) fullEl.removeAttribute('inert'); else fullEl.setAttribute('inert', '');

      // 스크롤 위치로 컷 고르기
      var r = REELS[reelKey];
      var n = r.subs.length;
      var pos = Math.min(n - 0.0001, e4 * n);
      var ci = Math.floor(pos), lt = pos - ci;
      if (ci !== fullCut) {
        fullCut = ci;
        if (fullSub) {
          fullSub.textContent = r.subs[ci];
          fullSub.classList.remove('is-in'); void fullSub.offsetWidth; fullSub.classList.add('is-in');
        }
      }
      var f = CUT_FRAMES[ci % CUT_FRAMES.length];
      if (fullImg) fullImg.style.transform = 'scale(' + lerp(f[0], f[3], lt).toFixed(4) + ') translate(' + lerp(f[1], f[4], lt).toFixed(2) + '%,' + lerp(f[2], f[5], lt).toFixed(2) + '%)';
      for (var b = 0; b < fullBars.length; b++) {
        fullBars[b].style.width = (b < ci ? 100 : (b === ci ? lt * 100 : 0)).toFixed(1) + '%';
      }
      var ui = clamp01((e3 - 0.6) * 3); // 화면이 거의 다 펼쳐진 뒤에 글자·막대 표시
      fullEl.style.setProperty('--ui', ui.toFixed(3));
      if (fullSub) fullSub.style.opacity = String(ui * (1 - e5 * 0.85));
      if (fullEnd) { fullEnd.style.opacity = String(e5); fullEnd.style.transform = 'translate(-50%,' + (16 * (1 - e5)).toFixed(1) + 'px)'; fullEnd.style.visibility = e5 > 0.02 ? '' : 'hidden'; }
      if (fullHint) fullHint.style.opacity = String(clamp01((e3 - 0.7) * 4) * (1 - seg(p, 0.62, 0.7)));
    }
  }

  function heroLoop() {
    if (!heroOn) return;
    tiltX += (tiltTX - tiltX) * 0.08;
    tiltY += (tiltTY - tiltY) * 0.08;
    applyHero();
    requestAnimationFrame(heroLoop);
  }

  if (heroEl && pinEl && phoneEl && !reducedMotion) {
    measure();
    window.addEventListener('resize', function () { measure(); });
    window.addEventListener('load', function () { measure(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(function () {});
    requestAnimationFrame(heroLoop);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        var was = heroOn; heroOn = ents[0].isIntersecting;
        if (heroOn && !was) requestAnimationFrame(heroLoop);
      }).observe(heroEl);
    }
    // 마우스 위치에 따라 장면과 휴대폰이 살짝 기욺
    if (window.matchMedia('(pointer: fine)').matches) {
      pinEl.addEventListener('pointermove', function (e) {
        var r = pinEl.getBoundingClientRect();
        tiltTX = ((e.clientX - r.left) / r.width - 0.5) * 2;
        tiltTY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      pinEl.addEventListener('pointerleave', function () { tiltTX = 0; tiltTY = 0; });
    }
  }

  // 휴대폰을 좌우로 밀면 업종이 바뀜
  if (phoneEl) {
    var keys = Object.keys(REELS);
    var sx = null, sy = 0;
    phoneEl.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; });
    window.addEventListener('pointerup', function (e) {
      if (sx == null) return;
      var ddx = e.clientX - sx, ddy = e.clientY - sy; sx = null;
      if (Math.abs(ddx) < 40 || Math.abs(ddx) < Math.abs(ddy)) return;
      var i = keys.indexOf(reelKey);
      setReel(keys[(i + (ddx < 0 ? 1 : -1) + keys.length) % keys.length]);
    });
  }

  setReel(pickInitialTheme());
})();
