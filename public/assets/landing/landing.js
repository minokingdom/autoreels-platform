// AutoReels 랜딩 (/) — 업종별 3컷 자동 미리보기 + 제작 화면으로 이동
// 업종 데이터는 배포 때 scripts/build-app.mjs 가 01-industries.js 에서 뽑아 industries.js(window.AR_LP_INDUSTRIES)로 만듦
(function () {
  var INDS = window.AR_LP_INDUSTRIES || {};
  var current = 'auto';
  var currentCut = 0;
  var playing = true;
  var cutTimer = null;
  var CUT_MS = 3400;

  // 업종별 차분한 딥톤 배경 팔레트 (과한 네온 없이 실제 릴스 무드 차이만 표현)
  var IND_MOODS = {
    auto: 'linear-gradient(160deg, #27272a 0%, #171923 55%, #09090b 100%)',
    cafe: 'linear-gradient(160deg, #33271e 0%, #1c1714 55%, #0b0a09 100%)',
    restaurant: 'linear-gradient(160deg, #34211b 0%, #1c1412 55%, #0a0909 100%)',
    beauty: 'linear-gradient(160deg, #2f2228 0%, #1b1518 55%, #0a090a 100%)',
    realestate: 'linear-gradient(160deg, #1d2926 0%, #121917 55%, #090b0a 100%)',
    academy: 'linear-gradient(160deg, #1e2634 0%, #131720 55%, #090a0d 100%)',
    clinic: 'linear-gradient(160deg, #1b2a2f 0%, #111a1d 55%, #090c0d 100%)',
    fitness: 'linear-gradient(160deg, #2b221a 0%, #171411 55%, #0a0908 100%)',
    shop: 'linear-gradient(160deg, #292524 0%, #181616 55%, #090909 100%)',
    interior: 'linear-gradient(160deg, #282520 0%, #171614 55%, #090908 100%)',
    personal: 'linear-gradient(160deg, #24262d 0%, #15161b 55%, #09090b 100%)'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

  // 한국어 받침 조사 ('으로' vs '로', ㄹ 받침은 '로')
  function josaRo(word) {
    var s = String(word || '').trim();
    if (!s) return '로';
    var code = s.charCodeAt(s.length - 1);
    if (code < 0xAC00 || code > 0xD7A3) return '로';
    var jong = (code - 0xAC00) % 28;
    return (jong === 0 || jong === 8) ? '로' : '으로';
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
    var bars = wrap.querySelectorAll('.lp-bar');
    bars.forEach(function (bar, i) {
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
    setText('landingPhoneCutTag', c.tag);
    setText('landingPhoneKicker', c.kicker);
    setText('landingPhoneHook', c.hook);
    setText('landingPhoneSub', c.sub);
    var tags = document.getElementById('landingPhoneTags');
    if (tags) {
      tags.innerHTML = (c.tags || []).map(function (t) {
        return '<span class="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/80">#' + esc(t) + '</span>';
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

    var bg = document.getElementById('landingPhoneBg');
    if (bg) bg.style.background = IND_MOODS[ind.key] || IND_MOODS.auto;

    var where = ind.branchPlaceholder || ind.place || '';
    setText('landingPhoneBadge', ind.icon + ' ' + ind.name);
    setText('landingPhonePlace', where + ' · ' + ind.title);
    setText('landingPhonePromo', ind.promoPlaceholder || '');
    setText('landingStartIndustryBtn', ind.icon + ' ' + ind.name + josaRo(ind.name) + ' 바로 만들기 →');

    renderCut(ind, 0);
    scheduleNextCut();

    // 아래 업종 그리드에서 골랐을 때 폰이 화면 밖에 있으면 부드럽게 올려서 바로 확인 가능하게
    if (opts && opts.fromGrid) {
      var stage = document.getElementById('landingPhoneStage');
      if (stage) {
        var rect = stage.getBoundingClientRect();
        if (rect.bottom < 80 || rect.top > window.innerHeight - 60) {
          stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }

  var stageEl = document.getElementById('landingPhoneStage');
  if (stageEl) {
    stageEl.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('#landingPhonePlayBtn')) return;
      var ind = INDS[current] || INDS.auto;
      if (!ind) return;
      renderCut(ind, currentCut + 1);
      scheduleNextCut();
    });
    stageEl.addEventListener('keydown', function (e) {
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
})();
