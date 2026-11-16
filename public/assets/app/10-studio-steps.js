// AutoReels — 10-studio-steps.js  (public/index.html 에서 나눔. 일반 <script> 로 순서대로 불러오며 전역 이름을 공유함)
    // 스튜디오 우측 단계 탭 전환 (대본 · 사진 · 사운드 · 명함 · 발행)
    // ==========================================================================
    // ★ 오늘의 주제: 처음에 막막하지 않게 "오늘 무엇을 올릴지"부터 고름
    //   - 요일·계절·시간대·다가오는 기념일(21일 안) + 그날 인기 키워드(/api/trends)를 AI에 넘겨 주제 6개를 받음
    //   - 같은 날·같은 업종은 브라우저에 저장해 다시 묻지 않음 ([다른 주제 보기]는 새로 받음)
    //   - AI가 실패하면 날짜로 만든 기본 주제를 보여 줌
    //   - 주제를 고르면 그 주제로 AI 대본 3안을 바로 만듦
    // ==========================================================================
    const AR_KO_WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    function arNthWeekday(y, m, weekday, n) { // m: 0~11, n번째 weekday(0=일)
      const d = new Date(y, m, 1);
      const shift = (weekday - d.getDay() + 7) % 7;
      return new Date(y, m, 1 + shift + (n - 1) * 7);
    }
    function arUpcomingEvents(now) {
      const y = now.getFullYear();
      const fixed = [[0, 1, '새해'], [1, 14, '발렌타인데이'], [2, 1, '삼일절'], [2, 14, '화이트데이'], [4, 5, '어린이날'], [4, 8, '어버이날'],
        [4, 15, '스승의 날'], [5, 6, '현충일'], [7, 15, '광복절'], [9, 3, '개천절'], [9, 9, '한글날'], [9, 31, '핼러윈'], [10, 11, '빼빼로데이'],
        [11, 24, '크리스마스이브'], [11, 25, '크리스마스'], [11, 31, '연말']];
      const lunar = { 2026: [[1, 17, '설날'], [8, 25, '추석']], 2027: [[1, 7, '설날'], [8, 15, '추석']], 2028: [[0, 27, '설날'], [9, 3, '추석']] };
      const list = [];
      [y, y + 1].forEach((yy) => {
        fixed.forEach(([m, d, n]) => list.push([new Date(yy, m, d), n]));
        (lunar[yy] || []).forEach(([m, d, n]) => list.push([new Date(yy, m, d), n]));
        list.push([arNthWeekday(yy, 10, 4, 3), '수능']); // 11월 셋째 목요일
        list.push([arNthWeekday(yy, 10, 5, 4), '블랙프라이데이']); // 11월 넷째 금요일
      });
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return list
        .map(([d, n]) => ({ name: n, days: Math.round((d - today) / 86400000) }))
        .filter((e) => e.days >= 0 && e.days <= 21)
        .sort((a, b) => a.days - b.days)
        .map((e) => (e.days === 0 ? `오늘 ${e.name}` : `${e.name} D-${e.days}`));
    }
    function arDateContext() {
      const now = new Date();
      const m = now.getMonth() + 1;
      const h = now.getHours();
      return {
        dateKey: `${now.getFullYear()}-${String(m).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        dateStr: `${m}월 ${now.getDate()}일`,
        weekday: AR_KO_WEEKDAYS[now.getDay()],
        weekend: now.getDay() === 0 || now.getDay() === 6,
        season: m >= 3 && m <= 5 ? '봄' : m >= 6 && m <= 8 ? '여름' : m >= 9 && m <= 11 ? '가을' : '겨울',
        timeOfDay: h < 11 ? '오전' : h < 14 ? '점심' : h < 18 ? '오후' : '저녁',
        events: arUpcomingEvents(now)
      };
    }
    // AI가 안 될 때 쓰는 기본 주제 (날짜·업종 단어로 만듦)
    function arFallbackTopics(dc) {
      const P = IND.product || '상품';
      const out = [];
      if (dc.events[0]) {
        const ev = dc.events[0].replace(/ D-\d+$|^오늘 /g, '');
        out.push({ title: `${ev} 맞이 ${P}`, why: dc.events[0], prompt: `${ev}에 어울리는 ${P} 추천과 혜택` });
      }
      if (IND.key === 'auto') {
        out.push({ title: '즉시출고 재고 안내', why: '바로 받을 수 있는 차 찾는 고객', prompt: '이번 주 즉시출고 가능한 재고 안내' });
        out.push({ title: '이달의 프로모션', why: `${dc.dateStr.split(' ')[0]} 조건 정리`, prompt: '이달 할인·금리 프로모션 핵심 정리' });
        out.push({ title: '출고 현장 보여주기', why: '신뢰를 주는 현장 영상', prompt: '오늘 출고 현장과 꼼꼼한 검수 과정' });
      } else {
        out.push({ title: `오늘의 추천 ${P}`, why: `${dc.weekday} ${dc.timeOfDay} 추천`, prompt: `오늘 꼭 소개하고 싶은 추천 ${P}` });
        out.push({ title: dc.weekend ? '주말 방문 혜택' : '평일 한정 혜택', why: dc.weekend ? '주말 나들이 수요' : `${dc.weekday} 한산한 시간 공략`, prompt: dc.weekend ? `주말에 방문하면 받는 ${P} 혜택` : `평일에만 드리는 ${P} 혜택` });
        out.push({ title: '준비 과정 보여주기', why: '정성과 신뢰를 보여 주기', prompt: `${P}을(를) 준비하는 과정과 정성` });
      }
      out.push({ title: `${dc.season} 시즌 추천`, why: `${dc.season}에 찾는 사람이 많음`, prompt: `${dc.season}에 딱 맞는 ${P} 추천` });
      out.push({ title: '자주 묻는 질문 답하기', why: '문의를 줄이고 신뢰를 높임', prompt: `손님들이 자주 묻는 ${P} 질문에 답하기` });
      return out.slice(0, 6);
    }
    let arTopicsLoading = 0;
    // 주제는 한 화면에 5개씩만 (나머지는 다음 페이지)
    const AR_TOPICS_PER_PAGE = 5;
    let arTopicPage = 0;
    function arTopicGoPage(n) {
      const topics = window.__arTopics || [];
      const pages = Math.max(1, Math.ceil(topics.length / AR_TOPICS_PER_PAGE));
      arTopicPage = Math.max(0, Math.min(pages - 1, n));
      arRenderTopics(topics, null, true);
      const box = document.getElementById('topicCards');
      if (box && box.getBoundingClientRect().top < 120) window.scrollTo({ top: Math.max(0, box.getBoundingClientRect().top + window.scrollY - 170), behavior: 'smooth' });
    }
    function arRenderTopics(topics, statusText, keepPage) {
      const box = document.getElementById('topicCards');
      if (!box) return;
      if (!keepPage) arTopicPage = 0;
      window.__arTopics = topics;
      const esc = (v) => String(v || '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      const pages = Math.max(1, Math.ceil(topics.length / AR_TOPICS_PER_PAGE));
      const from = arTopicPage * AR_TOPICS_PER_PAGE;
      const pager = pages > 1 ? `
        <div class="topic-pager">
          <button type="button" onclick="arTopicGoPage(${arTopicPage - 1})" ${arTopicPage === 0 ? 'disabled' : ''}>← 이전</button>
          <span>${arTopicPage + 1} / ${pages}</span>
          <button type="button" onclick="arTopicGoPage(${arTopicPage + 1})" ${arTopicPage >= pages - 1 ? 'disabled' : ''}>다음 주제 →</button>
        </div>` : '';
      // 인스타 목록처럼: 그림 칸 + 제목 + 이유 한 줄 + ›
      const topicIcon = (t) => {
        const x = [t.title, t.why, t.prompt].join(' ');
        if (/수능|시험|입시/.test(x)) return ['📝', '#6366f1', '#1e1b4b'];
        if (/블프|블랙|세일|할인|특가|혜택|쿠폰|이벤트/.test(x)) return ['🏷️', '#f43f5e', '#4c0519'];
        if (/가을|겨울|봄|여름|날씨|비 오|눈 오|추위|건조|크리스마스|연말/.test(x)) return ['🍂', '#f59e0b', '#451a03'];
        if (/비법|방법|팁|관리|주의|가이드|정보|과정/.test(x)) return ['💡', '#14b8a6', '#042f2e'];
        if (/인기|요즘|유행|트렌드|키워드/.test(x)) return ['🔥', '#fb923c', '#431407'];
        if (/바쁜|빠른|퇴근|점심|직장인|시간/.test(x)) return ['⏱️', '#38bdf8', '#082f49'];
        if (/평일|주말|월요|금요|오늘/.test(x)) return ['📅', '#a78bfa', '#2e1065'];
        return ['✨', '#4cc38a', '#052e16'];
      };
      const curTopic = window.arTodayTopic && window.arTodayTopic.title;
      box.innerHTML = topics.slice(from, from + AR_TOPICS_PER_PAGE).map((t, k) => ({ t, i: from + k })).map(({ t, i }) => {
        const ic = topicIcon(t);
        return `
        <button type="button" data-topic-idx="${i}" class="bgm-row topic-row ${curTopic === t.title ? 'on' : ''}">
          <span class="bgm-cover" style="width:52px;height:52px;background:linear-gradient(135deg, ${ic[1]}, ${ic[2]});font-size:22px">${ic[0]}</span>
          <span class="bgm-row-txt"><strong>${esc(t.title)}</strong><small><b>${esc(t.why)}</b>${t.prompt ? ' · ' + esc(t.prompt) : ''}</small></span>
          <span class="bgm-row-state">${curTopic === t.title ? '✓' : '›'}</span>        </button>`;
      }).join('') + pager;
      const st = document.getElementById('topicStatus');
      if (st && statusText !== null) st.textContent = statusText || '';
    }
    async function arLoadTopics(force) {
      const dc = arDateContext();
      const line = document.getElementById('topicDateLine');
      if (line) line.textContent = `${dc.dateStr} ${dc.weekday} · ${dc.season}${dc.events.length ? ' · ' + dc.events.slice(0, 2).join(' · ') : ''}`;
      const cacheKey = `ar_topics_v3_${IND.key}_${dc.dateKey}`;
      let pre = null;
      let trends = [];
      if (window.location.protocol.startsWith('http')) {
        try {
          pre = await fetch('/trends-today.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null));
          const row = pre && pre.industries && pre.industries[IND.key];
          const ageDays = pre && pre.date ? (Date.now() - Date.parse(pre.date)) / 86400000 : 99;
          if (row && Array.isArray(row.keywords) && ageDays < 3) trends = row.keywords.slice(0, 8);
        } catch (e) {}
      }
      const serverUpdatedAt = String((pre && pre.updatedAt) || '');
      if (!force) {
        try {
          const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
          if (cached && Array.isArray(cached.topics) && cached.topics.length && (!serverUpdatedAt || cached.trendsAt === serverUpdatedAt)) {
            arRenderTopics(cached.topics, '오늘의 추천 주제예요. 마음에 드는 게 없으면 [다른 주제 보기]를 눌러 보세요.');
            return;
          }
        } catch (e) {}
      }
      // 먼저 기본 주제를 바로 보여 주고, AI 추천이 오면 바꿈
      const myJob = ++arTopicsLoading;
      arRenderTopics(arFallbackTopics(dc), '오늘 요일·계절·인기 키워드로 주제를 고르는 중… (10초 정도)');
      if (!window.location.protocol.startsWith('http')) return;
      if (!trends.length) try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        const tr = await fetch(`/api/trends?industry=${encodeURIComponent(IND.key)}`, { signal: ctrl.signal }).then((r) => r.json());
        clearTimeout(timer);
        trends = (tr && Array.isArray(tr.items) ? tr.items : [])
          .map((it) => [String(it.title || (it.theme && it.theme.hookCaption) || '').replace(/#[^\s#]+/g, '').trim().slice(0, 50), (String(it.fullCaption || it.title || '').match(/#[가-힣a-zA-Z0-9_]+/g) || []).slice(0, 4).join(' ')].join(' ').trim())
          .filter(Boolean).slice(0, 8);
      } catch (e) {}
      if (myJob !== arTopicsLoading) return;
      try {
        const d = typeof getSelectedDealer === 'function' ? getSelectedDealer() : null;
        const copy = d && typeof arDealerForCopy === 'function' ? arDealerForCopy(d) : null;
        const prevTitles = force && Array.isArray(window.__arTopics)
          ? window.__arTopics.map((t) => t && t.title).filter(Boolean).slice(0, 12)
          : [];
        const res = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'topics',
            industry: IND.key,
            industryInfo: { name: IND.name, role: IND.role, product: IND.product, aiRole: IND.aiRole },
            dateContext: dc,
            trends,
            excludeTitles: prevTitles,
            refreshNonce: force ? Date.now() : 0,
            storeHint: copy ? [copy.name, copy.branch].filter(Boolean).join(' ') : ''
          })
        }).then((r) => r.json());
        if (myJob !== arTopicsLoading) return;
        if (res && res.ok && Array.isArray(res.topics) && res.topics.length) {
          try { localStorage.setItem(cacheKey, JSON.stringify({ topics: res.topics, at: Date.now(), trendsAt: serverUpdatedAt })); } catch (e) {}
          arRenderTopics(res.topics, `오늘 날짜${trends.length ? '와 요즘 인기 키워드' : ''}로 고른 주제예요. 하나를 누르면 대본을 바로 만들어요.`);
          return;
        }
      } catch (e) {}
      if (myJob === arTopicsLoading) {
        const st = document.getElementById('topicStatus');
        if (st) st.textContent = 'AI 추천을 받지 못해 기본 주제를 보여 드려요. 잠시 뒤 [다른 주제 보기]를 눌러 보세요.';
      }
    }
    // 주제 선택 → 대본 탭으로 이동해 그 주제로 AI 대본을 바로 만듦
    // ★ 내 상품 시트 (주제·대본 탭의 '내 상품' 한 줄) — 상품을 먼저 정해 두면 대본이 처음부터 맞게 나옴
    let arProductSnap = '';
    function arProductKey() {
      return ['inputVehicle', 'inputDiscountNum', 'inputDiscount'].map((id) => (document.getElementById(id) || {}).value || '').join('|');
    }
    function arSyncProductRows() {
      const name = String((typeof campaign !== 'undefined' && campaign.vehicle) || (document.getElementById('inputVehicle') || {}).value || '').trim() || '내 상품';
      const sub = String((document.getElementById('inputDiscount') || {}).value || '').trim();
      const num = Number((document.getElementById('inputDiscountNum') || {}).value || 0);
      document.querySelectorAll('.ar-product-name').forEach((el) => { el.textContent = name; });
      document.querySelectorAll('.ar-product-sub').forEach((el) => { el.textContent = [num > 0 && typeof IND !== 'undefined' && IND.key === 'auto' ? `최대 ${num}만원 할인` : '', sub].filter(Boolean).join(' · ') || '무엇을 알릴지 정해 두면 대본에 들어가요'; });
      const chip = document.getElementById('todayTopicChip');
      if (chip) chip.textContent = (window.arTodayTopic && window.arTodayTopic.title) || '고르기';
    }
    document.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'presetSelect') setTimeout(arSyncProductRows, 60);
    });
    function arOpenProductSheet() {
      const el = document.getElementById('productSheet');
      if (!el) return;
      arProductSnap = arProductKey();
      el.classList.remove('hidden');
      el.style.display = 'flex';
      setTimeout(() => arSyncIgSelects(el), 0);
    }
    function arCloseProductSheet() {
      const el = document.getElementById('productSheet');
      if (!el) return;
      el.classList.add('hidden');
      el.style.display = 'none';
      arSyncProductRows();
      // 주제를 고른 뒤 상품을 바꿨으면, 바뀐 상품으로 대본을 다시 씀 (상품과 대본이 어긋나지 않게)
      if (arProductKey() !== arProductSnap && window.arTodayTopic && typeof generateStoryboardFromPrompt === 'function') {
        if (typeof arToast === 'function') arToast('바뀐 상품으로 대본을 다시 써요.');
        generateStoryboardFromPrompt();
      }
    }

    function arPickTopic(topic) {
      if (!topic || !topic.prompt) return;
      window.arTodayTopic = topic;
      setTimeout(arSyncProductRows, 0);
      setTimeout(() => window.scrollTo({ top: Math.max(0, (document.getElementById('studioTabBtn_script') || document.body).getBoundingClientRect().top + window.scrollY - 160), behavior: 'smooth' }), 60);
      const promptEl = document.getElementById('aiPromptInput');
      if (promptEl) promptEl.value = topic.prompt;
      const badge = document.getElementById('todayTopicBadge');
      if (badge) { badge.textContent = `오늘 주제: ${topic.title} — 이 주제로 대본을 만들고 있어요`; badge.classList.remove('hidden'); }
      // 주제(키워드)와 같은 분위기의 디자인으로 맞춤 — 대본·디자인이 한 흐름이 되게
      const ds = arDesignForTopic(topic);
      if (ds && typeof selectDesignStyle === 'function') selectDesignStyle(ds.id);
      const tail = ds ? ` · 디자인: ${ds.name}` : '';
      if (badge) badge.textContent = `오늘 주제: ${topic.title} — 이 주제로 대본을 만들고 있어요${tail}`;
      switchStudioTab('script');
      if (typeof generateStoryboardFromPrompt === 'function') {
        Promise.resolve(generateStoryboardFromPrompt()).finally(() => {
          if (badge) badge.textContent = `오늘 주제: ${topic.title}${tail}`;
        });
      }
    }
    // 주제 문구의 분위기(특가·변신·계절 감성·정보·유행·바쁜 일상)를 읽어 맞는 디자인을 고름
    const AR_TOPIC_MOODS = [
      { t: /블프|블랙\s*프라이|세일|할인|특가|혜택|이벤트|쿠폰|오픈|1\+1|%|가격|무료/, d: /특가|세일|할인|혜택|이벤트|가격|SALE|ticket|band|impact|vivid|mo_number/i },
      { t: /수능|변신|비포|애프터|전후|before|after|달라|바뀐|새로워/i, d: /비포|애프터|변신|전후|before|after|split|wipe/i },
      { t: /가을|겨울|봄|여름|날씨|비 오는|눈 오는|크리스마스|연말|새해|감성|따뜻|추위|쌀쌀|건조|선선/, d: /감성|warm|sepia|film|polaroid|write|pen|손글씨|노트|편지|일기|필름|in_film|in_mood|in_letter|in_diary/i },
      { t: /비법|방법|팁|관리|주의|체크|정리|가이드|이유|고르는|차이|알아/, d: /상담|정보|news|kicker|headline|카드뉴스|체크|신문|chalk|메뉴판|card_news/i },
      { t: /인기|요즘|유행|트렌드|핫한|잘 나가|화제|난리/, d: /인기|🔥|트렌드|브이로그|vlog|handheld|POV|재미|ig_/i },
      { t: /빠른|바쁜|퇴근|점심|출근|짬|시간 없/, d: /브이로그|handheld|timestamp|vsub|타이포|zoom|주방|새벽/i }
    ];
    // ★ 분위기·컨셉 추천 (인스타 템플릿 추천처럼): 지금 주제·대본 문구를 읽어 어울리는 스타일을 이유와 함께 고름
    const AR_TOPIC_MOOD_LABELS = ['특가 강조', '변신 전후', '계절 감성', '알려 주는 정보', '요즘 유행', '바쁜 일상'];
    const AR_DESIGN_MOODS = [
      { id: 'soft', label: '감성', re: /감성|film|필름|sepia|손글씨|pen|gowun|maru|in_|polaroid|엽서|편지|일기|다이어리/i },
      { id: 'clean', label: '깔끔', re: /미니멀|minimal|깔끔|레터|letter|카드|glass|유리|화이트|white|plaque|전시/i },
      { id: 'trendy', label: '트렌디', re: /브이로그|vlog|ig_|스토리|키네틱|kinetic|pov|handheld|타임스탬프|timestamp|덤프|dump/i },
      { id: 'luxe', label: '고급', re: /고급|에디토리얼|vogue|cinema|시네마|serif|명조|luxury|gold|금|매거진|magazine/i },
      { id: 'warm', label: '따뜻', re: /warm|따뜻|크림|cream|오후|아치|arch|리넨|linen|햇살/i },
      { id: 'pop', label: '발랄', re: /바운스|bounce|pop|팝|bubble|말풍선|재미|jua|bagel|스티커|sticker|투표|poll/i }
    ];
    function arDesignHay(d) { return [d.id, d.name, d.label, d.cat, d.desc, d.outro, d.cap, d.layout, d.grade, d.font].filter(Boolean).join(' '); }
    function arDesignsForMood(moodId) {
      const m = AR_DESIGN_MOODS.find((x) => x.id === moodId);
      if (!m || typeof arVisibleDesigns !== 'function') return [];
      return arVisibleDesigns().filter((d) => m.re.test(arDesignHay(d)));
    }
    function arRecommendDesigns(limit = 6) {
      if (typeof arVisibleDesigns !== 'function') return [];
      const tp = window.arTodayTopic;
      // 고른 주제를 먼저(가중치 크게), 그다음 대본 문구
      const topicText = [tp && tp.title, tp && tp.why, tp && tp.prompt].filter(Boolean).join(' ');
      const capText = [campaign.hook, ...(campaign.cutCaptions || [])].filter(Boolean).join(' ');
      const all = AR_TOPIC_MOODS.map((m, i) => ({ m, label: AR_TOPIC_MOOD_LABELS[i] }));
      const moods = all.filter((x) => topicText && x.m.t.test(topicText)).map((x) => ({ ...x, w: 4 }))
        .concat(all.filter((x) => !(topicText && x.m.t.test(topicText)) && x.m.t.test(capText)).map((x) => ({ ...x, w: 2 })));
      const season = (typeof arDateContext === 'function' && arDateContext().season) || '';
      const cur = typeof getActiveDesign === 'function' ? getActiveDesign() : null;
      const scored = arVisibleDesigns().filter((d) => !cur || d.id !== cur.id).map((d) => {
        const hay = arDesignHay(d);
        let sc = 0, why = '';
        moods.forEach((x) => { if (x.m.d.test(hay)) { sc += x.w; if (!why) why = x.label === '계절 감성' && season ? `${season} 감성` : x.label; } });
        if (!why && /감성|warm|sepia|film/i.test(hay) && /가을|겨울/.test(season)) { sc += 1.2; why = `${season} 분위기`; }
        if (d.industry) { sc += 0.8; if (!why) why = '이 업종 전용'; }
        if (d.isTrend) { sc += 0.6; if (!why) why = '요즘 인기'; }
        // 매번 같은 줄이 되지 않게 살짝 섞음 (같은 점수 안에서 순서만 바뀜)
        return { d, sc: sc + Math.random() * 0.4, why: why || '새로운 느낌' };
      }).sort((a, b) => b.sc - a.sc);
      // 같은 묶음(분류)만 몰리지 않게 분류당 2개까지
      const perCat = {}, out = [];
      for (const r of scored) {
        const k = r.d.industry ? 'ind' : r.d.cat;
        if ((perCat[k] || 0) >= 2) continue;
        perCat[k] = (perCat[k] || 0) + 1;
        out.push(r);
        if (out.length >= limit) break;
      }
      return out;
    }
    function arDesignForTopic(topic) {
      if (!topic || typeof arVisibleDesigns !== 'function') return null;
      const text = [topic.title, topic.why, topic.prompt].filter(Boolean).join(' ');
      const moods = AR_TOPIC_MOODS.filter((m) => m.t.test(text));
      if (!moods.length) return null;
      const cur = typeof getActiveDesign === 'function' ? getActiveDesign() : null;
      let best = 0, pool = [];
      arVisibleDesigns().forEach((d) => {
        const hay = [d.id, d.name, d.label, d.cat, d.outro, d.cap, d.layout, d.grade].filter(Boolean).join(' ');
        // 앞쪽(주제를 가장 잘 나타내는) 분위기일수록 가중치를 크게, 업종 전용 테마는 조금 더
        let sc = moods.reduce((a, m, i) => a + (m.d.test(hay) ? 3 - Math.min(i, 2) * 0.5 : 0), 0);
        if (!sc) return;
        if (d.industry) sc += 0.5;
        if (sc > best) { best = sc; pool = [d]; } else if (sc === best) pool.push(d);
      });
      if (pool.length > 1 && cur) pool = pool.filter((d) => d.id !== cur.id);
      return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    }
    function arPickCustomTopic() {
      const el = document.getElementById('topicCustomInput');
      const v = (el && el.value || '').trim();
      if (!v) { if (el) el.focus(); return; }
      arPickTopic({ title: v.slice(0, 20), why: '직접 입력', prompt: v });
    }
    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('[data-topic-idx]');
      if (!btn) return;
      const t = (window.__arTopics || [])[Number(btn.getAttribute('data-topic-idx'))];
      if (t) arPickTopic(t);
    });

    const STUDIO_TABS = ['topic', 'script', 'photo', 'sound', 'card', 'publish'];
    // ★ 성우 목소리는 단계를 순서대로 명함까지 마친 뒤 발행 단계에서 처음 들려줌
    //   그 전에는 성우 녹음을 받지도 틀지도 않음 (배경음악 미리 듣기는 가능)
    //   발행 단계에 들어오면 고른 배경음악 + 성우 목소리를 섞은 완성본을 처음부터 재생
    const arStepsVisited = new Set(['topic']);
    let arFinalAudioUnlocked = false; // AGENTS.md: 성우 녹음은 발행 단계에서 처음 (그 전엔 받지도 틀지도 않음 — 크레딧 절약, 이전 대본 목소리 섞임 방지)
    function arVoiceAllowed() { return arFinalAudioUnlocked; }
    function arFirstMissingStep() {
      return ['topic', 'script', 'photo', 'sound', 'card'].find((k) => !arStepsVisited.has(k)) || null;
    }
    function arSetFinalPreviewStatus(text) {
      const el = document.getElementById('finalPreviewStatus');
      if (el) el.textContent = text;
    }
    // 발행 단계 진입: 완성본(배경음악 + 성우) 준비 후 처음부터 재생
    function arStartFinalPreview() {
      arFinalAudioUnlocked = true;
      if (window.innerWidth < 1024) scrollToMainMonitor();
      if (!AudioEngine.enabled) toggleAudioMaster(true);
      if (AudioEngine.ttsVoice === 'off') {
        arSetFinalPreviewStatus('성우를 끈 상태라 배경음악만 들어갑니다. 처음부터 재생합니다.');
        triggerFullAudioPreview();
        return;
      }
      arSetFinalPreviewStatus('완성본 준비 중… 성우가 대본을 한 번에 녹음하고 있어요 (10초 정도)');
      AudioEngine.stopTts();
      // 녹음이 끝나면 처음부터 배경음악과 함께 재생
      Promise.resolve(AudioEngine.scriptPending || AudioEngine.prefetchTtsBuffers()).then(() => {
        triggerFullAudioPreview();
        arSetFinalPreviewStatus(AudioEngine.masterBuffer
          ? '완성본 재생 중 — 고른 배경음악과 성우 목소리가 함께 들어갑니다.'
          : '성우 녹음을 받지 못해 배경음악만 재생합니다. 잠시 뒤 [처음부터 다시 보기]를 눌러 주세요.');
      });
    }
    function arReplayFinalPreview() {
      if (!arFinalAudioUnlocked) return arStartFinalPreview();
      if (window.innerWidth < 1024) scrollToMainMonitor();
      triggerFullAudioPreview();
    }
    function switchStudioTab(key) {
      if (!STUDIO_TABS.includes(key)) return;
      // 발행 단계는 명함까지 순서대로 마쳐야 열림
      if (key === 'publish' && !arFinalAudioUnlocked) {
        const missing = arFirstMissingStep();
        if (missing) {
          const names = { topic: '주제', script: '대본', photo: '사진', sound: '사운드', card: '엔딩' };
          if (typeof arToast === 'function') arToast(`${names[missing]} 단계부터 순서대로 마쳐 주세요. 엔딩까지 끝내면 완성본을 들려드려요.`);
          key = missing;
        }
      }
      arStepsVisited.add(key);
      if (key === 'sound') AudioEngine.loadVoiceList();
      if (key === 'card' && typeof arRenderCardShowToggles === 'function') arRenderCardShowToggles();
      if (key === 'sound' && typeof renderBgmRecommendations === 'function') renderBgmRecommendations();
      setTimeout(() => arSyncIgSelects(document.getElementById('studioPanel_' + key)), 0);
      if (key === 'topic' || key === 'script') setTimeout(arSyncProductRows, 0);
      // 사진 탭의 컷 카드에 대본 탭에서 고친 문구를 반영
      if (key === 'photo' && typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
      STUDIO_TABS.forEach((k) => {
        const panel = document.getElementById(`studioPanel_${k}`);
        const btn = document.getElementById(`studioTabBtn_${k}`);
        const active = k === key;
        if (panel) panel.classList.toggle('hidden', !active);
        if (btn) {
          btn.setAttribute('aria-selected', active ? 'true' : 'false');
          btn.className = active
            ? 'studio-tab bg-[#232325] text-[#ededed] font-medium'
            : 'studio-tab text-[#85858b] hover:text-[#ededed] font-normal';
        }
      });
      // 주제·대본 단계에서는 미리보기를 숨겨 넓게 쓰고, 사진 탭부터 미리보기 표시
      const showPreview = !['topic', 'script'].includes(key);
      const monCol = document.getElementById('mainMonitorColumn');
      const wfCol = document.getElementById('studioWorkflowColumn');
      if (monCol) monCol.classList.toggle('hidden', !showPreview);
      if (wfCol) {
        wfCol.className = showPreview ? 'lg:col-span-7 order-1 lg:order-2' : 'lg:col-span-12 order-1 lg:order-2';
      }
      if (typeof syncMobileDockVisibility === 'function') syncMobileDockVisibility();
      if (showPreview && window.__timelines && window.__timelines['main']) {
        window.__timelines['main'].seek(window.__timelines['main'].currentTime);
      }

      // 탭을 바꾸면 패널 맨 위가 보이도록 (긴 화면에서 아래쪽에 머무는 것 방지)
      const bar = document.querySelector('.studio-tablist');
      if (bar && bar.getBoundingClientRect().top < 0) {
        bar.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
      arUpdateEasyGuide(key);
      arUpdateMobileStepBar(key);
      if (key === 'publish' && !arFinalAudioUnlocked) arStartFinalPreview();
    }

    // ==========================================================================
    // ★ 모바일 아래 고정 단계 바: 긴 화면 맨 끝까지 내려가지 않아도 [이전]·[다음]으로 이동
    // ==========================================================================
    const AR_STEP_NAMES = { topic: '주제', script: '대본', photo: '사진', sound: '사운드', card: '엔딩', publish: '발행' };
    function arEnsureMobileStepBar() {
      let bar = document.getElementById('mobileStepBar');
      if (bar) return bar;
      bar = document.createElement('nav');
      bar.id = 'mobileStepBar';
      bar.setAttribute('aria-label', '단계 이동');
      bar.innerHTML = `
        <button type="button" id="mobileStepPrev" class="msb-btn">←</button>
        <button type="button" id="mobileStepMid" class="msb-mid" aria-label="미리보기로 이동">
          <span id="mobileStepCount" class="msb-count"></span>
          <span id="mobileStepName" class="msb-name"></span>
        </button>
        <button type="button" id="mobileStepNext" class="msb-btn msb-next"></button>`;
      document.body.appendChild(bar);
      bar.querySelector('#mobileStepMid').setAttribute('aria-label', '영상 크게 보기');
      bar.querySelector('#mobileStepMid').onclick = () => {
        const mon = document.getElementById('mainMonitorColumn');
        // 가운데(단계 이름)를 누르면 영상을 그 자리에서 크게 보기 (주제·대본 단계는 맨 위로)
        if (mon && !mon.classList.contains('hidden')) arOpenPreviewPop();
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      return bar;
    }
    function arUpdateMobileStepBar(key) {
      const bar = arEnsureMobileStepBar();
      const idx = STUDIO_TABS.indexOf(key);
      const prev = STUDIO_TABS[idx - 1];
      const next = STUDIO_TABS[idx + 1];
      const go = (k) => () => {
        switchStudioTab(k);
        // 새 단계는 맨 위(안내 문구)부터 보이게
        const panel = document.getElementById(`studioPanel_${k}`);
        const top = panel ? panel.getBoundingClientRect().top + window.scrollY - 150 : 0;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      };
      const pb = bar.querySelector('#mobileStepPrev');
      const nb = bar.querySelector('#mobileStepNext');
      pb.disabled = !prev;
      pb.textContent = prev ? `← ${AR_STEP_NAMES[prev]}` : '←';
      pb.onclick = prev ? go(prev) : null;
      nb.style.visibility = next ? 'visible' : 'hidden';
      nb.textContent = next ? `다음: ${AR_STEP_NAMES[next]} →` : '';
      // 주제 단계에서 주제를 고르지 않고 [다음]을 누르면 맨 위 추천 주제로 대본·디자인을 만듦
      nb.onclick = !next ? null : () => {
        if (key === 'topic' && !window.arTodayTopic && (window.__arTopics || []).length) {
          arPickTopic(window.__arTopics[0]);
          const panel = document.getElementById('studioPanel_script');
          const top = panel ? panel.getBoundingClientRect().top + window.scrollY - 150 : 0;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          return;
        }
        go(next)();
      };
      bar.querySelector('#mobileStepCount').textContent = `${idx + 1} / ${STUDIO_TABS.length}`;
      bar.querySelector('#mobileStepName').textContent = AR_STEP_NAMES[key] || '';
    }

    // ==========================================================================
    // ★ 쉬운 모드: 단계마다 꼭 필요한 것만 보이고 고급 기능([data-advanced])은 숨김
    //   body.ar-easy 클래스로 전환, 선택은 localStorage 'ar_ui_mode' 에 기억 (기본: 쉬운 모드)
    // ==========================================================================
    function arUpdateEasyGuide(key) {
      const steps = {
        topic: ['오늘의 주제', '오늘 올릴 주제를 골라 주세요. 고르면 그 주제로 AI가 대본 3안을 바로 만들어 드려요.'],
        script: ['대본 고르기', '상품 이름과 혜택을 확인하고 [AI로 만들기]를 누르세요. 대본 3안 중 마음에 드는 것을 고르면 됩니다.'],
        photo: ['사진 넣기', '내 사진이나 영상을 올리세요. 올리지 않으면 기본 사진으로 만들어집니다.'],
        sound: ['소리 고르기', '배경음악과 성우 목소리를 고르세요. 성우 목소리는 엔딩까지 마치면 발행 단계에서 음악과 함께 완성본으로 들려드려요.'],
        card: ['엔딩 꾸미기', '영상 마지막에 나올 가게 정보와 로고를 넣고, 보일 항목만 켜 두세요.'],
        publish: ['완성본 확인 · SNS에 올리기', '배경음악과 성우가 들어간 완성본을 확인하고, 올릴 곳을 켜고 [공유하기]를 누르세요.']
      };
      const idx = STUDIO_TABS.indexOf(key);
      const step = steps[key];
      if (idx < 0 || !step) return;
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('easyStepCount', `${idx + 1} / ${STUDIO_TABS.length}`);
      set('easyStepTitle', step[0]);
      set('easyStepText', step[1]);
    }

    // ★ 휴대폰의 기본 선택창(회색 안드로이드 목록) 대신 우리 디자인의 아래 시트로 고르기
    //   터치 화면에서만. 사진 고르기는 사진 미리보기 그리드로 보여 줌.
    function arIsTouchUi() {
      try { return window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; }
    }
    function arSelectLabel(sel) {
      const box = sel.closest('.cut-ctl');
      const span = box && box.querySelector('span');
      if (span) return span.textContent.trim();
      if (sel.id) {
        const lb = document.querySelector(`label[for="${sel.id}"]`);
        if (lb) return lb.textContent.trim();
      }
      const prev = sel.previousElementSibling;
      if (prev && prev.tagName === 'LABEL') return prev.textContent.trim();
      return sel.getAttribute('title') || '선택';
    }
    function arCloseOptionSheet() {
      const el = document.getElementById('arOptionSheet');
      if (el) { el.classList.add('hidden'); el.style.display = 'none'; el.innerHTML = ''; }
    }
    function arOpenOptionSheet(sel) {
      let el = document.getElementById('arOptionSheet');
      if (!el) {
        el = document.createElement('div');
        el.id = 'arOptionSheet';
        el.className = 'ar-modal hidden fixed inset-0 z-[95]';
        el.addEventListener('click', (e) => { if (e.target === el) arCloseOptionSheet(); });
        document.body.appendChild(el);
      }
      const esc = (v) => String(v || '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      const isPhoto = sel.getAttribute('data-sheet-kind') === 'photo';
      const photos = (typeof campaign !== 'undefined' && campaign.uploadedPhotos) || [];
      const opts = [...sel.options].filter((o) => !o.disabled && !o.hidden && !o.classList.contains('hidden'));
      const items = opts.map((o) => {
        const on = o.value === sel.value;
        const label = esc(o.textContent.trim().replace(/^\d+\.\s*/, isPhoto ? '' : '$&'));
        if (isPhoto) {
          const ph = photos[Number(o.value)];
          const src = ph ? (ph._dataUrl || ph.src || '') : '';
          return `<button type="button" class="aos-photo${on ? ' on' : ''}" data-v="${esc(o.value)}">${src ? `<img src="${esc(src)}" alt="" />` : '<span></span>'}<em>${label}</em></button>`;
        }
        return `<button type="button" class="aos-item${on ? ' on' : ''}" data-v="${esc(o.value)}"><span>${label}</span>${on ? '<b>✓</b>' : ''}</button>`;
      }).join('');
      el.innerHTML = `<div class="aos-card">
          <div class="aos-head"><strong>${esc(arSelectLabel(sel))}</strong><button type="button" class="ar-modal-x" aria-label="닫기">✕</button></div>
          <div class="${isPhoto ? 'aos-grid' : 'aos-list'}">${items}</div>
        </div>`;
      el.querySelector('.ar-modal-x').onclick = arCloseOptionSheet;
      el.querySelectorAll('[data-v]').forEach((b) => {
        b.onclick = () => {
          sel.value = b.getAttribute('data-v');
          arCloseOptionSheet();
          sel.dispatchEvent(new Event('input', { bubbles: true }));
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        };
      });
      el.classList.remove('hidden');
      el.style.display = 'flex';
      const cur = el.querySelector('.on');
      if (cur) cur.scrollIntoView({ block: 'center' });
    }
    // ★ 인스타 느낌으로: 제작 단계 안의 선택 상자를 "이름 · 지금 값 ›" 한 줄로 보여 주고, 누르면 아래 시트
    //   (컷 카드 안의 작은 선택칸·숨긴 선택칸은 그대로)
    function arIgSelectEligible(sel) {
      return sel && sel.tagName === 'SELECT' && !sel.multiple && !sel.hasAttribute('data-native') &&
        (sel.closest('.studio-panel') || sel.closest('#productSheet')) && !sel.closest('.cut-ctl') && !sel.classList.contains('hidden') &&
        sel.id !== 'bgmStyleSelect';
    }
    function arSyncIgSelects(root) {
      (root || document).querySelectorAll('.studio-panel select, #productSheet select').forEach((sel) => {
        let row = sel.__igRow;
        if (!row) {
          if (!arIgSelectEligible(sel)) return;
          row = document.createElement('button');
          row.type = 'button';
          row.className = 'ig-select-row';
          row.addEventListener('click', () => arOpenOptionSheet(sel));
          sel.insertAdjacentElement('afterend', row);
          sel.classList.add('ig-select-src');
          sel.__igRow = row;
          sel.addEventListener('change', () => arSyncIgSelects(sel.parentElement));
        }
        const o = sel.options[sel.selectedIndex];
        const txt = o ? o.textContent.trim() : '';
        row.innerHTML = `<span>${txt.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</span><b>›</b>`;
        row.disabled = sel.disabled;
      });
    }

    let arSelTouch = null; // 화면을 밀다가 선택칸 위에서 손을 떼도 열리지 않게, 손가락 이동 거리 확인
    document.addEventListener('touchstart', (e) => {
      const t = e.touches && e.touches[0];
      arSelTouch = t ? { x: t.clientX, y: t.clientY } : null;
    }, { capture: true, passive: true });
    ['mousedown', 'touchend'].forEach((type) => {
      document.addEventListener(type, (e) => {
        const sel = e.target && e.target.closest && e.target.closest('select');
        if (!sel || sel.disabled || sel.multiple || sel.hasAttribute('data-native') || !arIsTouchUi()) return;
        e.preventDefault();
        sel.blur();
        if (type === 'touchend') {
          const t = e.changedTouches && e.changedTouches[0];
          if (arSelTouch && t && Math.hypot(t.clientX - arSelTouch.x, t.clientY - arSelTouch.y) > 10) return;
          arOpenOptionSheet(sel);
        } else if (e.button === 0) arOpenOptionSheet(sel);
      }, { capture: true, passive: false });
    });
    // 키보드·접근성으로 열려고 할 때 대비: 포커스되면 기본 목록 대신 시트
    document.addEventListener('focusin', (e) => {
      const sel = e.target;
      if (!sel || sel.tagName !== 'SELECT' || sel.hasAttribute('data-native') || !arIsTouchUi()) return;
      sel.blur();
    });

    function arSetUiMode(mode, remember) {
      const easy = mode !== 'full';
      document.body.classList.toggle('ar-easy', easy);
      document.querySelectorAll('[data-ui-mode]').forEach((b) => {
        b.setAttribute('aria-pressed', String((b.getAttribute('data-ui-mode') === 'easy') === easy));
      });
      const sw = document.getElementById('editModeSwitch');
      if (sw) sw.setAttribute('aria-checked', String(!easy));
      if (remember && typeof arToast === 'function') arToast(easy ? '편집 모드를 껐어요. 기본 단계만 보여요.' : '편집 모드: 문구·효과음·속도 같은 세부 설정이 보여요.');
      if (remember) {
        try { localStorage.setItem('ar_ui_mode', easy ? 'easy' : 'full'); } catch (e) {}
      }
    }

    function arLoadUiMode() {
      try { return localStorage.getItem('ar_ui_mode') === 'full' ? 'full' : 'easy'; } catch (e) { return 'easy'; }
    }

    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('[data-ui-mode]');
      if (!b) return;
      arSetUiMode(b.getAttribute('data-ui-mode'), true);
    });

    function switchMainTab(tab) {
      document.getElementById('viewPreview').classList.toggle('hidden', tab !== 'preview');
      document.getElementById('viewAdmin').classList.toggle('hidden', tab !== 'admin');
      document.getElementById('viewTech').classList.toggle('hidden', tab !== 'tech');

      const tabs = [
        { id: 'tabBtnPreview', key: 'preview' },
        { id: 'tabBtnAdmin', key: 'admin' },
        { id: 'tabBtnTech', key: 'tech' }
      ];
      tabs.forEach((t) => {
        const el = document.getElementById(t.id);
        if (t.key === tab) {
          el.className = 'whitespace-nowrap h-8 px-3.5 rounded-[6px] text-[13px] font-medium transition-colors bg-[#232325] text-[#ededed]';
        } else {
          el.className = 'whitespace-nowrap h-8 px-3.5 rounded-[6px] text-[13px] font-normal transition-colors text-[#85858b] hover:text-[#ededed]';
        }
      });

      syncPreviewPanel();
      syncTechPanel();
    }

    function selectDealer(id, goPreview = false) {
      selectedDealerId = id;
      renderQuickSelector();
      renderAdminDealerList();
      syncPreviewPanel();
      syncTechPanel();
      document.getElementById('publishLogBox').classList.add('hidden');
      window.__timelines['main'].seek(window.__timelines['main'].currentTime);
      if (goPreview) switchMainTab('preview');
    }

    function renderQuickSelector() {
      const container = document.getElementById('dealerQuickSelector');
      container.innerHTML = dealers
        .map((d) => {
          const active = d.id === selectedDealerId;
          return `<button onclick="selectDealer('${d.id}')" class="h-8 px-3 rounded-[8px] text-[12px] font-medium transition-colors border cursor-pointer flex items-center gap-2 ${
            active
              ? 'bg-[#232325] text-[#ededed] border-[rgba(237,237,237,0.22)]'
              : 'bg-[#141415] text-[#85858b] border-[var(--border)] hover:text-[#ededed]'
          }"><span class="w-1.5 h-1.5 rounded-full ${active ? 'bg-[#4cc38a]' : 'bg-[#85858b]'}"></span>${d.name} ${d.title} <span class="text-[#85858b] font-normal">${d.branch.split(' ')[0]}</span></button>`;
        })
        .join('');
    }

    function renderAdminDealerList() {
      const listEl = document.getElementById('adminDealerList');
      const statBadge = document.getElementById('statSummaryBadge');
      statBadge.textContent = `${dealers.length}명 구독 중 · 주간 ${(dealers.length * 50000).toLocaleString()}원`;

      listEl.innerHTML = dealers
        .map((d) => {
          const badgeHtml =
            d.status === 'PUBLISHED'
              ? `<span class="tag-chip px-2 py-0.5 text-[11px] text-[#4cc38a]">발행 완료</span>`
              : d.status === 'REVISION'
              ? `<span class="tag-chip px-2 py-0.5 text-[11px] text-[#d97706]">수정 요청</span>`
              : `<span class="tag-chip px-2 py-0.5 text-[11px] text-[#a1a1a6]">검수 대기</span>`;

          const vLabel = d.variation ? d.variation.label : '기본 변주';
          return `
            <div class="p-4 rounded-[12px] bg-[#141415] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="w-2 h-2 rounded-full inline-block" style="background:${d.accentColor}"></span>
                  <span class="text-[14px] font-medium text-[#ededed]">${d.name} ${d.title}</span>
                  <span class="text-[12px] text-[#85858b]">${d.branch}</span>
                  ${badgeHtml}
                  <span class="font-mono text-[11px] text-[#85858b]">${vLabel}</span>
                </div>
                <div class="text-[12px] font-mono text-[#85858b]">
                  ${d.phone} · ${d.igUsername} · ${d.licenseKey}
                </div>
              </div>
              <button onclick="selectDealer('${d.id}', true)" class="btn-secondary h-8 px-3 text-[12px] cursor-pointer">
                스튜디오 열기
              </button>
            </div>
          `;
        })
        .join('');
    }

    function syncPreviewPanel() {
      const d = getSelectedDealer();
      const v = d.variation || VARIATION_RECIPES[0];
      document.getElementById('stagingUrlText').textContent = `https://staging.autoreels.kr/v/${d.token}`;
      document.getElementById('previewDealerHeader').textContent = '오늘의 릴스 만들기';
      document.getElementById('dlrInputName').value = d.name;
      document.getElementById('dlrInputTitle').value = d.title;
      document.getElementById('dlrInputPhone').value = d.phone;
      document.getElementById('dlrInputBranch').value = d.branch;
      document.getElementById('dlrInputPromo').value = d.promoTag;
      document.getElementById('igAccountBadge').textContent = window.AR_SERVER && AR_SERVER.mode ? ((AR_SNS_STATE && AR_SNS_STATE.targets.instagram.name) || '') : `${d.igUsername}`;
      document.getElementById('dlrCaptionTextarea').value = buildCaption(d);

      const hookInput = document.getElementById('inputHook');
      if (hookInput) hookInput.value = v.hook || campaign.hook;
      const bulletsInput = document.getElementById('inputBullets');
      if (bulletsInput && v.bullets) bulletsInput.value = v.bullets.join('\n');

      const totalCuts = getTargetCutCount();
      renderDynamicCutCardsUI(totalCuts);
      for (let i = 0; i < totalCuts; i++) {
        const cutEl = document.getElementById(`cutSub${i}`);
        if (cutEl && campaign.cutCaptions && campaign.cutCaptions[i] !== undefined) {
          cutEl.value = campaign.cutCaptions[i];
        }
        const ttsEl = document.getElementById(`cutTts${i}`);
        if (ttsEl) {
          ttsEl.value =
            (campaign.ttsLines && campaign.ttsLines[i]) ||
            (campaign.cutCaptions && campaign.cutCaptions[i]) ||
            '';
        }
      }

      syncScenePlanUI();
      syncDrmAndSnsUI();
      renderDealerVariationSummary();

      const statusContainer = document.getElementById('previewStatusBadge');
      if (d.status === 'PUBLISHED') {
        statusContainer.innerHTML = `<span class="tag-chip px-2.5 py-1 text-[12px] text-[#4cc38a]">발행 완료</span>`;
      } else if (d.status === 'REVISION') {
        statusContainer.innerHTML = `<span class="tag-chip px-2.5 py-1 text-[12px] text-[#d97706]">수정 요청됨</span>`;
      } else {
        statusContainer.innerHTML = ''; // '편집 중' 표시는 편집 모드 스위치와 헷갈려서 뺌
      }
    }

    function syncStudioSettingsModal() {
      const d = typeof getSelectedDealer === 'function' ? getSelectedDealer() : null;
      const accEl = document.getElementById('settingsAccountSummary');
      const authBtn = document.getElementById('settingsAuthActionBtn');
      const indEl = document.getElementById('settingsIndustrySummary');
      const cardSumEl = document.getElementById('cardTabSummaryText');
      const serverMe = window.AR_SERVER && AR_SERVER.mode ? AR_SERVER.me : null;
      if (accEl) {
        if (serverMe && serverMe.user) {
          const comp = serverMe.subscription && serverMe.subscription.comp === true;
          accEl.textContent = `${serverMe.user.name || ''} (${serverMe.user.phone || ''})${comp ? ' · 무상 PRO' : ''}`;
        } else if (d) {
          accEl.textContent = `${d.name || '게스트'} · ${d.phone || '미로그인'}`;
        }
      }
      if (authBtn) {
        authBtn.textContent = serverMe && serverMe.user ? '계정 · 로그아웃' : '로그인 · 회원가입';
      }
      if (indEl && typeof IND !== 'undefined') {
        indEl.textContent = `${IND.icon} ${IND.name}`;
      }
      if (typeof arRenderCardShowToggles === 'function') arRenderCardShowToggles();
    }

    function openStudioSettingsModal(focusSection) {
      syncStudioSettingsModal();
      const modal = document.getElementById('studioSettingsModal');
      if (!modal) return;
      modal.classList.remove('hidden');
      if (focusSection === 'card') {
        const sec = document.getElementById('settingsCardSection');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function closeStudioSettingsModal() {
      const modal = document.getElementById('studioSettingsModal');
      if (modal) modal.classList.add('hidden');
    }

    function evaluateDealerDrmStatus(d) {
      // 서버 모드에서는 로그인 세션과 서버 구독/무상 PRO 권한으로만 판정합니다.
      // (명함·매장 연락처 칸을 가게 전화번호로 바꾸거나 비워도 워터마크가 뜨지 않도록 함)
      if (window.AR_SERVER && AR_SERVER.mode) {
        const me = AR_SERVER.me;
        if (!me || !me.user || !me.entitlement || !me.entitlement.pro) return 0;
        const comp = me.subscription && me.subscription.comp === true;
        return comp || (me.entitlement.until && new Date(me.entitlement.until).getTime() > Date.now()) ? 1 : 0;
      }
      if (!d) return 0;
      const curP8 = extractPhoneLast8(d.phone);
      const regP8 = extractPhoneLast8(d.licensedPhone || d.phone);
      const sig = parseProvidedLicenseSig(d.licenseKey);
      const expiry = d.expiryYmd || 20261231;
      const today = 20261112;
      const domFlag = getCurrentDomainFlag();
      if (RustWasmCore && typeof RustWasmCore.verify_subscription_drm === 'function') {
        return RustWasmCore.verify_subscription_drm(curP8, regP8, sig, expiry, today, domFlag) >>> 0;
      }
      if (curP8 !== regP8) return 3;
      return sig > 0 ? 1 : 0;
    }

    function syncDrmAndSnsUI() {
      const d = getSelectedDealer();
      if (!d) return;

      const keyEl = document.getElementById('dlrLicenseKeyInput');
      if (keyEl) keyEl.value = d.licenseKey || '';
      const boundPhoneEl = document.getElementById('dlrLicensedPhoneView');
      if (boundPhoneEl) boundPhoneEl.value = d.licensedPhone || d.phone;
      const boundTextEl = document.getElementById('drmBoundPhoneText');
      if (boundTextEl) boundTextEl.textContent = d.licensedPhone || d.phone;
      const expEl = document.getElementById('dlrExpiryView');
      const comp = Boolean(window.AR_SERVER && AR_SERVER.mode && AR_SERVER.me && AR_SERVER.me.subscription && AR_SERVER.me.subscription.comp);
      if (expEl) {
        const ymdStr = String(d.expiryYmd || 20261231);
        expEl.value = ymdStr.length === 8
          ? `PRO 무제한 (${ymdStr.slice(0, 4)}-${ymdStr.slice(4, 6)}-${ymdStr.slice(6, 8)})`
          : 'PRO 무제한 구독';
        if (comp) expEl.value = '무상 PRO · 만료 없음';
      }

      const hdrNameEl = document.getElementById('headerDealerNameText');
      if (hdrNameEl) hdrNameEl.textContent = `${d.name} ${d.title}`;
      const hdrPhoneEl = document.getElementById('headerDealerPhoneText');
      if (hdrPhoneEl) hdrPhoneEl.textContent = d.phone || '';
      syncStudioSettingsModal();

      const drmCode = evaluateDealerDrmStatus(d);
      const badgeEl = document.getElementById('drmStatusBadge');
      const hdrDotEl = document.getElementById('headerDrmDot');
      if (badgeEl) {
        if (drmCode === 1) {
          badgeEl.className = 'tag-chip px-2.5 py-1 text-[12px] font-medium text-[#4cc38a]';
          badgeEl.textContent = comp ? '무상 PRO (워터마크 제거)' : '정품 구독 인증됨 (워터마크 제거)';
          if (hdrDotEl) hdrDotEl.style.background = '#4cc38a';
        } else if (drmCode === 3) {
          badgeEl.className = 'tag-chip px-2.5 py-1 text-[12px] font-medium text-[#e5484d]';
          badgeEl.textContent = '타 카마스터 번호 도용 감지 · 공유 차단됨';
          if (hdrDotEl) hdrDotEl.style.background = '#e5484d';
        } else {
          badgeEl.className = 'tag-chip px-2.5 py-1 text-[12px] font-medium text-[#d97706]';
          badgeEl.textContent = '미구독 · 체험판 상태 (워터마크 표시)';
          if (hdrDotEl) hdrDotEl.style.background = '#d97706';
        }
      }
      syncStudioSettingsModal();

      // 4대 SNS 연결 상태 UI 업데이트
      const sns = d.snsAccounts || { ig: d.igUsername, yt: '', tt: '', fb: '' };
      ['ig', 'yt', 'tt', 'fb'].forEach((ch) => {
        const handleEl = document.getElementById(`snsHandle_${ch}`);
        const btnEl = document.getElementById(`snsStatusBtn_${ch}`);
        const chkEl = document.getElementById(`snsCheck${ch[0].toUpperCase()}${ch[1]}`);
        let val = (sns[ch] || '').trim();
        // 견본 계정(@sample_…, OO자동차 …)은 연결된 것으로 보이지 않게
        if (/^@sample_|OO자동차|^@hyundai_minjun|^@minjun_/.test(val)) val = '';
        if (handleEl) handleEl.textContent = val || '연결 안 됨';
        if (btnEl) {
          btnEl.textContent = val ? '바꾸기' : '연결하기';
          btnEl.className = val ? 'tag-chip is-on' : 'tag-chip';
        }
        if (chkEl) {
          chkEl.disabled = !val;
          if (!val) chkEl.checked = false;
        }
      });
    }

    function onDealerLicenseInput() {
      const d = getSelectedDealer();
      const val = document.getElementById('dlrLicenseKeyInput')?.value.trim() || '';
      d.licenseKey = val;
      syncDrmAndSnsUI();
      window.__timelines['main'].seek(window.__timelines['main'].currentTime);
    }

    function simulateDrmMode(mode) {
      const d = getSelectedDealer();
      if (mode === 'PRO') {
        d.phone = d.licensedPhone;
        d.expiryYmd = 20261231;
        d.licenseKey = formatWasmLicenseKey(d.licensedPhone, 20261231);
      } else if (mode === 'TRIAL') {
        d.phone = d.licensedPhone;
        d.licenseKey = 'AR-000000 (미결제/만료)';
      } else if (mode === 'TAMPER') {
        d.phone = '010-9999-8282';
        d.licenseKey = formatWasmLicenseKey(d.licensedPhone, 20261231);
      }
      document.getElementById('dlrInputPhone').value = d.phone;
      syncDrmAndSnsUI();
      window.__timelines['main'].seek(window.__timelines['main'].currentTime);
    }

    function openSnsConnectModal(focusKey) {
      if (window.AR_SERVER && AR_SERVER.mode) return arSnsConnectClick(focusKey);
      const d = getSelectedDealer();
      const sns = d.snsAccounts || { ig: d.igUsername, yt: '', tt: '', fb: '' };
      document.getElementById('snsModalHeaderTitle').textContent = `[${d.name} ${d.title}] 내 4대 SNS 계정 연결 설정`;
      document.getElementById('snsInput_ig').value = sns.ig || '';
      document.getElementById('snsInput_yt').value = sns.yt || '';
      document.getElementById('snsInput_tt').value = sns.tt || '';
      document.getElementById('snsInput_fb').value = sns.fb || '';
      const notice = document.getElementById('snsModalNotice');
      if (notice) notice.classList.add('hidden');
      const modal = document.getElementById('snsConnectModal');
      if (modal) modal.classList.remove('hidden');
      if (focusKey && document.getElementById(`snsInput_${focusKey}`)) {
        setTimeout(() => document.getElementById(`snsInput_${focusKey}`).focus(), 80);
      }
    }

    function closeSnsConnectModal() {
      const modal = document.getElementById('snsConnectModal');
      if (modal) modal.classList.add('hidden');
    }

    function quickOAuthSimulate(channel) {
      const d = getSelectedDealer();
      const slug = d.token.replace('tok_', '');
      const defaults = {
        ig: `@${slug}_official_motors`,
        yt: `@${slug}_shorts_tv`,
        tt: `@${slug}_car_master`,
        fb: `${d.branch} ${d.name} ${d.title} 공식페이지`
      };
      const inputEl = document.getElementById(`snsInput_${channel}`);
      if (inputEl && !inputEl.value.trim()) {
        inputEl.value = defaults[channel];
      }
      const notice = document.getElementById('snsModalNotice');
      if (notice) {
        notice.classList.remove('hidden');
        notice.textContent = `OAuth 인증 토큰이 연결되었습니다. 아래 [저장 완료]를 눌러 반영하세요.`;
      }
    }

    function saveDealerSnsAccounts() {
      const d = getSelectedDealer();
      d.snsAccounts = {
        ig: document.getElementById('snsInput_ig').value.trim(),
        yt: document.getElementById('snsInput_yt').value.trim(),
        tt: document.getElementById('snsInput_tt').value.trim(),
        fb: document.getElementById('snsInput_fb').value.trim()
      };
      if (d.snsAccounts.ig) d.igUsername = d.snsAccounts.ig;
      saveDealerProfileToLocal(d);
      syncDrmAndSnsUI();
      closeSnsConnectModal();
      window.__timelines['main'].seek(window.__timelines['main'].currentTime);
    }

    function saveDealerProfileToLocal(d) {
      try {
        localStorage.setItem(
          'autoreels_my_dealer_profile_' + d.id,
          JSON.stringify({
            name: d.name,
            title: d.title,
            phone: d.phone,
            branch: d.branch,
            promoTag: d.promoTag,
            snsAccounts: d.snsAccounts,
            cardHide: d.cardHide || {}
          })
        );
        const badge = document.getElementById('mobileSavedBadge');
        if (badge) {
          badge.textContent = `[${d.name} ${d.title}] 엔딩 정보가 이 기기에 자동 저장됨`;
        }
      } catch (e) {}
    }

    function loadSavedDealerProfiles() {
      arLoadDealerLogos();
      try {
        dealers.forEach((d) => {
          const raw = localStorage.getItem('autoreels_my_dealer_profile_' + d.id);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.name) d.name = parsed.name;
            if (parsed.title) d.title = parsed.title;
            if (parsed.phone) d.phone = parsed.phone;
            if (parsed.branch) d.branch = parsed.branch;
            if (parsed.promoTag) d.promoTag = parsed.promoTag;
            if (parsed.snsAccounts) d.snsAccounts = parsed.snsAccounts;
            if (parsed.cardHide && typeof parsed.cardHide === 'object') d.cardHide = parsed.cardHide;
          }
        });
      } catch (e) {}
    }

    function updateCurrentDealerFromPreview() {
      const d = getSelectedDealer();
      d.name = document.getElementById('dlrInputName').value;
      d.title = document.getElementById('dlrInputTitle').value;
      d.phone = document.getElementById('dlrInputPhone').value;
      d.branch = document.getElementById('dlrInputBranch').value;
      d.promoTag = document.getElementById('dlrInputPromo').value;
      // 명함을 비우거나 채우면 명함 화면 유무·마지막 멘트가 바뀌므로 길이와 성우 녹음을 다시 맞춤
      const cardEmptyNow = arCardEmpty();
      if (cardEmptyNow !== d._cardEmptyLast) {
        d._cardEmptyLast = cardEmptyNow;
        applyVideoDurations();
      }
      if (typeof arResetAndRebuildNarration === 'function') {
        arResetAndRebuildNarration();
      } else if (typeof AudioEngine !== 'undefined' && AudioEngine.enabled && arVoiceAllowed()) {
        AudioEngine.masterBuffer = null;
        AudioEngine.masterDuration = 0;
        AudioEngine.schedulePrefetch();
      }
      document.getElementById('dlrCaptionTextarea').value = buildCaption(d);
      saveDealerProfileToLocal(d);
      syncDrmAndSnsUI();
      renderQuickSelector();
      renderAdminDealerList();
      renderDealerVariationSummary();
      syncTechPanel();
      window.__timelines['main'].seek(window.__timelines['main'].currentTime);
    }

    // ★ 명함 단계: 보일 항목 고르기 + 로고
    //   (설정창이 아니라 명함 단계에서 바로. 항목을 끄면 영상 끝 명함에서만 빠지고 적어 둔 내용은 그대로 남음)
    const AR_CARD_FIELDS = [
      ['name', '이름'], ['title', '직함'], ['phone', '연락처'], ['branch', '매장명'],
      ['promoTag', '혜택 문구'], ['avatar', '프로필 사진'], ['logo', '로고']
    ];
    function arCardFieldShown(d, k) { return !(d && d.cardHide && d.cardHide[k]); }
    function arRenderCardShowToggles() {
      const box = document.getElementById('cardShowToggles');
      const d = typeof getSelectedDealer === 'function' ? getSelectedDealer() : null;
      if (!box || !d) return;
      const isAuto = typeof IND !== 'undefined' && IND.key === 'auto';
      box.innerHTML = AR_CARD_FIELDS
        .filter(([k]) => !(isAuto && k === 'phone')) // 자동차 판매는 영상에 전화번호를 넣지 않음
        .map(([k, label]) => `<label class="ig-switch-row"><span>${label}</span><input type="checkbox" ${arCardFieldShown(d, k) ? 'checked' : ''} onchange="arToggleCardField('${k}', this.checked)" /><i></i></label>`).join('');
      const has = !!d.logoImg;
      const pv = document.getElementById('dealerLogoPreview');
      const tx = document.getElementById('dealerLogoLabelText');
      const clr = document.getElementById('dealerLogoClearBtn');
      if (pv) { pv.classList.toggle('hidden', !has); if (has) pv.src = d.logoImg.src; }
      if (tx) tx.textContent = has ? '다른 로고로 바꾸기' : '🏷️ 가게·회사 로고 올리기 (배경 없는 PNG가 좋아요)';
      if (clr) clr.classList.toggle('hidden', !has);
    }
    function arToggleCardField(k, on) {
      const d = getSelectedDealer();
      d.cardHide = Object.assign({}, d.cardHide || {});
      if (on) delete d.cardHide[k]; else d.cardHide[k] = true;
      updateCurrentDealerFromPreview();
      if (typeof seekToTime === 'function') seekToTime(Math.max(0, TOTAL_DURATION - 1.2)); // 명함 화면으로 이동해 바로 확인
    }
    function arSaveDealerLogo(d) {
      try {
        if (d.logoImg && d.logoImg.src && d.logoImg.src.startsWith('data:')) localStorage.setItem('autoreels_dealer_logo_' + d.id, d.logoImg.src);
        else localStorage.removeItem('autoreels_dealer_logo_' + d.id);
      } catch (e) {}
    }
    function arLoadDealerLogos() {
      try {
        dealers.forEach((d) => {
          const src = localStorage.getItem('autoreels_dealer_logo_' + d.id);
          if (src && !d.logoImg) { const img = new Image(); img.src = src; d.logoImg = img; }
        });
      } catch (e) {}
    }
    function handleDealerLogoUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const d = getSelectedDealer();
      const reader = new FileReader();
      reader.onload = () => {
        const raw = new Image();
        raw.onload = () => {
          // 저장 공간을 아끼려고 긴 변 400px로 줄임 (투명 배경 유지 위해 PNG)
          const k = Math.min(1, 400 / Math.max(raw.width, raw.height));
          const cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(raw.width * k));
          cv.height = Math.max(1, Math.round(raw.height * k));
          cv.getContext('2d').drawImage(raw, 0, 0, cv.width, cv.height);
          const img = new Image();
          img.onload = () => {
            d.logoImg = img;
            if (d.cardHide) delete d.cardHide.logo;
            arSaveDealerLogo(d);
            updateCurrentDealerFromPreview();
            arRenderCardShowToggles();
            if (typeof seekToTime === 'function') seekToTime(Math.max(0, TOTAL_DURATION - 1.2));
          };
          img.src = cv.toDataURL('image/png');
        };
        raw.src = reader.result;
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    }
    function clearDealerLogo() {
      const d = getSelectedDealer();
      d.logoImg = null;
      arSaveDealerLogo(d);
      updateCurrentDealerFromPreview();
      arRenderCardShowToggles();
    }

    function copyDealerCaption() {
      const d = getSelectedDealer();
      const text = document.getElementById('dlrCaptionTextarea')?.value || buildCaption(d);
      const btn = document.getElementById('copyCaptionBtn');
      const notice = document.getElementById('saveStatusNotice');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (btn) btn.textContent = '복사 완료';
          if (notice) {
            notice.textContent = '본문과 해시태그가 복사되었습니다. 업로드 시 붙여넣기 하세요.';
          }
          setTimeout(() => {
            if (btn) btn.textContent = '본문 복사';
          }, 2500);
        }).catch(() => {});
      }
    }

    function syncScenePlanUI() {
      const themeObj = DIRECTOR_THEMES[campaign.themeId] || DIRECTOR_THEMES.royal;
      const themeName = themeObj.name || themeObj.label || '로얄 골드';
      const totalCuts = getTargetCutCount();
      const badgeEl = document.getElementById('activeSceneRecipeBadge');
      if (badgeEl) {
        badgeEl.textContent = `테마: ${themeName} · ${totalCuts}컷 AI 위젯`;
      }
      if (Array.isArray(campaign.scenePlan)) {
        for (let i = 0; i < totalCuts; i++) {
          const cutBadge = document.getElementById(`cutWidgetBadge${i}`);
          const wKey = campaign.scenePlan[i]?.widget || WIDGET_POOL[i % WIDGET_POOL.length];
          if (cutBadge) {
            cutBadge.textContent = WIDGET_LABELS[wKey] || wKey;
          }
        }
      }
      if (typeof renderVisualStoryboardTrack === 'function') {
        renderVisualStoryboardTrack();
      }
    }

    function proceduralRestyleCurrentScene() {
      const themeKeys = Object.keys(DIRECTOR_THEMES);
      const positions = ['top', 'center', 'bottom'];
      const cameras = [0, 1, 2, 3];
      const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
      const totalCuts = getTargetCutCount();

      if (RustWasmCore && typeof RustWasmCore.compute_scene_slot === 'function') {
        const firstSlot = RustWasmCore.compute_scene_slot(seed, 0) >>> 0;
        const themeIdx = (firstSlot >>> 24) & 0xff;
        campaign.themeId = themeKeys[themeIdx % themeKeys.length] || themeKeys[0];

        campaign.scenePlan = Array.from({ length: totalCuts }, (_, idx) => {
          const packed = RustWasmCore.compute_scene_slot(seed, idx) >>> 0;
          const wIdx = packed & 0xff;
          const pIdx = (packed >>> 8) & 0xff;
          const cIdx = (packed >>> 16) & 0xff;
          return {
            cut: idx + 1,
            widget: WIDGET_POOL[wIdx % WIDGET_POOL.length],
            pos: positions[pIdx % positions.length],
            cam: cameras[cIdx % cameras.length]
          };
        });
      } else {
        const otherThemes = themeKeys.filter((k) => k !== campaign.themeId);
        campaign.themeId = otherThemes[Math.floor(Math.random() * otherThemes.length)] || themeKeys[0];
        const shuffled = [...WIDGET_POOL].sort(() => Math.random() - 0.5);
        campaign.scenePlan = Array.from({ length: totalCuts }, (_, idx) => ({
          cut: idx + 1,
          widget: shuffled[idx % shuffled.length],
          pos: positions[(idx + Math.floor(Math.random() * 3)) % positions.length],
          cam: cameras[(idx + Math.floor(Math.random() * 4)) % cameras.length]
        }));
      }

      syncScenePlanUI();
      const mainDur = Math.max(4.0, TOTAL_DURATION - OUTRO_DURATION);
      window.__timelines['main'].seek((window.__timelines['main'].currentTime + mainDur / totalCuts) % mainDur);
    }

    function updateCustomCutCaptions() {
      const totalCuts = getTargetCutCount();
      if (!Array.isArray(campaign.ttsLines)) campaign.ttsLines = [];
      for (let i = 0; i < totalCuts; i++) {
        const el = document.getElementById(`cutSub${i}`);
        // 대본 칸에서는 ' / ' 를 줄 나누기로 씀 (화면에서 직접 넣은 줄바꿈과 같은 뜻)
        if (el) campaign.cutCaptions[i] = el.value.replace(/\s+\/\s+/g, '\n').replace(/\n{2,}/g, '\n').trim();
        const ttsEl = document.getElementById(`cutTts${i}`);
        if (ttsEl) campaign.ttsLines[i] = ttsEl.value;
      }
      if (typeof arResetAndRebuildNarration === 'function') {
        arResetAndRebuildNarration();
      } else {
        AudioEngine.masterBuffer = null;
        AudioEngine.masterDuration = 0;
        if (AudioEngine.enabled) AudioEngine.schedulePrefetch();
      }
      if (typeof renderVisualStoryboardTrack === 'function') renderVisualStoryboardTrack();
      window.__timelines['main'].seek(0);
    }

    function saveAdminAiKeys() {
      try {
        const oa = document.getElementById('adminOpenAiKeyInput')?.value.trim() || '';
        const gm = document.getElementById('adminGeminiKeyInput')?.value.trim() || '';
        localStorage.setItem('autoreels_admin_openai_key', oa);
        localStorage.setItem('autoreels_admin_gemini_key', gm);
        const statusEl = document.getElementById('adminAiKeyStatus');
        const badgeEl = document.getElementById('aiEngineStatusBadge');
        if (oa) {
          if (statusEl) statusEl.textContent = '전용 OpenAI (GPT-4o-mini) 키가 연결되었습니다.';
          if (badgeEl) badgeEl.textContent = 'OpenAI GPT-4o-mini 전용 엔진';
        } else if (gm) {
          if (statusEl) statusEl.textContent = '전용 Google Gemini 2.0 Flash 키가 연결되었습니다.';
          if (badgeEl) badgeEl.textContent = 'Gemini 2.0 Flash 전용 엔진';
        } else {
          if (statusEl) statusEl.textContent = '현재 상태: AutoReels 기본 클라우드 LLM 엔진 활성';
          if (badgeEl) badgeEl.textContent = '중앙 AI 엔진 활성';
        }
      } catch (e) {}
    }

    function loadAdminAiKeys() {
      try {
        const oa = localStorage.getItem('autoreels_admin_openai_key') || '';
        const gm = localStorage.getItem('autoreels_admin_gemini_key') || '';
        const oaEl = document.getElementById('adminOpenAiKeyInput');
        const gmEl = document.getElementById('adminGeminiKeyInput');
        if (oaEl) oaEl.value = oa;
        if (gmEl) gmEl.value = gm;
        saveAdminAiKeys();
      } catch (e) {}
    }

    // 클라이언트 측 차종/타겟 정밀 파서 (예: "30대 여성 , 그랜저" 입력 시 차종 즉시 변경 & 30대 연령 오인 방지)
    function parsePromptVehicleAndTargetClient(rawPrompt) {
      const text = String(rawPrompt || '').trim();
      const carMap = [
        { kw: ['그랜저', '그랜져', 'gn7'], vehicle: '디 올 뉴 그랜저 하이브리드', discountNum: 450, discount: '월 48만원대 · 캘리그라피 즉시배정' },
        { kw: ['싼타페', '산타페'], vehicle: '디 올 뉴 싼타페 하이브리드', discountNum: 420, discount: '월 44만원대 · 선점재고 즉시출고' },
        { kw: ['쏘렌토', '소렌토'], vehicle: '2026 쏘렌토 하이브리드', discountNum: 480, discount: '월 46만원대 · 3일 즉시출고' },
        { kw: ['카니발', '하이리무진'], vehicle: '더 뉴 카니발 하이브리드 9인승', discountNum: 390, discount: '월 52만원대 · 부가세 환급 가능' },
        { kw: ['스포티지'], vehicle: '더 뉴 스포티지 하이브리드', discountNum: 310, discount: '월 36만원대 · 사회초년생·여성 추천' },
        { kw: ['아반떼'], vehicle: '더 뉴 아반떼 CN7 인스퍼레이션', discountNum: 220, discount: '월 27만원대 · 첫차 베스트셀러' },
        { kw: ['캐스퍼'], vehicle: '캐스퍼 일렉트릭 인스퍼레이션', discountNum: 340, discount: '월 24만원대 · 보조금 추가지원' },
        { kw: ['코나'], vehicle: '디 올 뉴 코나 하이브리드', discountNum: 280, discount: '월 32만원대 · 여성 오너 선호 1위' },
        { kw: ['투싼'], vehicle: '더 뉴 투싼 하이브리드', discountNum: 330, discount: '월 37만원대 · 즉시출고 특판' },
        { kw: ['팰리세이드', '펠리세이드'], vehicle: '디 올 뉴 팰리세이드 하이브리드', discountNum: 510, discount: '월 56만원대 · 패밀리 플래그십' },
        { kw: ['gv80'], vehicle: '제네시스 GV80 페이스리프트', discountNum: 620, discount: '월 78만원대 · 법인·사업자 비용처리' },
        { kw: ['gv70'], vehicle: '제네시스 GV70 스포츠 패키지', discountNum: 540, discount: '월 64만원대 · 3040 워너비 SUV' },
        { kw: ['g80'], vehicle: '제네시스 더 뉴 G80', discountNum: 590, discount: '월 69만원대 · 프리미엄 세단 특판' },
        { kw: ['bmw', '520i', '5시리즈'], vehicle: 'BMW 520i M Sport 패키지', discountNum: 1150, discount: '월 59만원대 · 즉시출고 가능' },
        { kw: ['벤츠', 'e클래스'], vehicle: '벤츠 E200 아방가르드', discountNum: 1080, discount: '월 68만원대 · 공식 프로모션' },
        { kw: ['테슬라', '모델y'], vehicle: '테슬라 Model Y RWD', discountNum: 650, discount: '월 49만원대 · 전기차 보조금 확정' }
      ];
      const lower = text.toLowerCase();
      let matchedCar = null;
      for (const item of carMap) {
        if (item.kw.some((k) => lower.includes(k))) {
          matchedCar = item;
          break;
        }
      }
      const ageMatch = text.match(/(20대|30대|40대|50대|60대)\s*(여성|여자|남성|남자|주부|직장인| 워킹맘|대표님|사장님|부부)?/);
      const targetPersona = ageMatch ? ageMatch[0].trim() : text.includes('여성') ? '여성 오너 맞춤' : '';
      const cleanedForStock = text.replace(/(20|30|40|50|60)\s*대\s*(여성|여자|남성|남자|주부|직장인|워킹맘|초반|중반|후반)?/g, '');
      const stockMatch = cleanedForStock.match(/(?:재고|선점|물량|한정|딱)\s*(\d{1,2})\s*대|([1-9])\s*대\s*(?:남음|한정|즉시|출고)/);
      const stockNum = stockMatch ? (stockMatch[1] || stockMatch[2]) : '3';
      return { matchedCar, targetPersona, stockNum };
    }

    async function generateStoryboardFromPrompt() {
      const promptEl = document.getElementById('aiPromptInput');
      const excludeEl = document.getElementById('aiExcludeInput');
      const btnEl = document.getElementById('aiGenBtn');
      const noticeEl = document.getElementById('aiGenNotice');
      const raw = (promptEl?.value || '').trim();
      const excludeRaw = (excludeEl?.value || '').trim();
      const stripExcludedLocal = (txt) => {
        let out = typeof indWord === 'function' ? indWord(String(txt || '')) : String(txt || '');
        if (!excludeRaw) return out;
        const terms = excludeRaw.split(/[,，/\n]+/).map((s) => s.trim()).filter(Boolean);
        terms.forEach((term) => {
          const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          out = out.replace(new RegExp(esc, 'gi'), '');
        });
        return out.replace(/\s{2,}/g, ' ').trim();
      };
      const d = getSelectedDealer();
      const totalCuts = getTargetCutCount();

      // 사용자 클릭 제스처 시점에 오디오/TTS 엔진을 즉시 활성화하여 음성이 100% 나오도록 보장
      if (!AudioEngine.enabled) {
        toggleAudioMaster(true);
      } else {
        AudioEngine.ensureContext();
      }

      // 1) 클라이언트에서 먼저 차종('그랜저' 등)을 즉시 인식하여 반영
      const parsedLocal = IND.key === 'auto' ? parsePromptVehicleAndTargetClient(raw) : {};
      if (parsedLocal.matchedCar) {
        campaign.vehicle = parsedLocal.matchedCar.vehicle;
        campaign.discountNum = parsedLocal.matchedCar.discountNum;
        campaign.discount = parsedLocal.matchedCar.discount;
      }

      if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = `AI ${totalCuts}컷 영상·성우 생성 중...`;
      }
      if (noticeEl) {
        noticeEl.classList.remove('hidden');
        noticeEl.textContent = `중앙 AI 엔진이 [${raw || campaign.vehicle}] 맞춤 ${totalCuts}컷 영상 대본·성우 음성·카톡 대화를 생성 중입니다...`;
      }

      const triggerTopicImages = (captions) => {
        if (!campaign.isUserCustomPhotos && (raw || (window.arTodayTopic && window.arTodayTopic.title))) {
          arApplyTopicSceneImages({
            prompt: raw || (window.arTodayTopic && window.arTodayTopic.title) || campaign.vehicle,
            vehicle: campaign.vehicle,
            topic: window.arTodayTopic || null,
            industry: IND.key,
            industryInfo: IND.key === 'auto' ? null : { name: IND.name },
            captions: Array.isArray(captions) ? captions : (campaign.cutCaptions || []),
            count: Math.min(4, totalCuts),
            totalCuts,
            adminGeminiKey: localStorage.getItem('autoreels_admin_gemini_key') || ''
          });
        }
      };

      try {
        const adminOpenAiKey = localStorage.getItem('autoreels_admin_openai_key') || '';
        const adminGeminiKey = localStorage.getItem('autoreels_admin_gemini_key') || '';

        const response = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: raw,
            exclude: excludeRaw,
            vehicle: campaign.vehicle,
            discountNum: campaign.discountNum,
            discount: campaign.discount,
            // 아직 바꾸지 않은 예시 매장 정보는 빼고 보냄 (자동차는 그대로)
            dealerName: arDealerForCopy(d).name,
            dealerTitle: arDealerForCopy(d).title,
            dealerBranch: arDealerForCopy(d).branch,
            dealerPromo: arDealerForCopy(d).promoTag,
            cutCount: totalCuts,
            bullets: campaign.bullets,
            // 오늘의 주제로 만든 대본이면 주제(계기·이유)를 같이 보내 "계기 → 손님 마음 → 우리 가게" 이야기로 이어지게 함
            topic: (window.arTodayTopic && raw === window.arTodayTopic.prompt) ? { title: window.arTodayTopic.title, why: window.arTodayTopic.why, prompt: window.arTodayTopic.prompt } : null,
            industry: IND.key,
            industryInfo: IND.key === 'auto' ? null : { name: IND.name, role: IND.role, product: IND.product, cta: IND.cta, aiRole: IND.aiRole, caution: IND.caution, place: IND.place },
            adminOpenAiKey,
            adminGeminiKey
          })
        });

        const result = await response.json();
        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.error || 'AI 서버 응답 오류');
        }

        // 대본 3안 저장 (예전 서버 응답이면 data 1개만)
        const variants = Array.isArray(result.variants) && result.variants.length ? result.variants : [result.data];
        arScriptVariants.list = variants;
        arScriptVariants.index = 0;
        arScriptVariants.strip = stripExcludedLocal;
        applyAiScriptToCampaign(variants[0], d, stripExcludedLocal);
        renderScriptVariantPicker();
        triggerTopicImages(variants[0]?.cutCaptions);
      } catch (err) {
        arScriptVariants.list = [];
        renderScriptVariantPicker();
        if (IND.key !== 'auto') {
          const tp = window.arTodayTopic;
          const topicTitle = (tp && tp.title) ? String(tp.title).trim() : (raw ? raw.slice(0, 24) : '');
          if (topicTitle) {
            const topicWhy = (tp && tp.why) ? String(tp.why).trim() : '';
            const shortRaw = (raw || topicTitle).replace(/[.!?]+$/, '').trim();
            const c1 = topicTitle;
            const c2 = topicWhy ? topicWhy.slice(0, 26) : `${shortRaw.slice(0, 22)} 포인트`;
            const c3 = `${IND.name} 맞춤 진행으로 깔끔하게`;
            const c4 = `${IND.cta || '상담 문의'} 바로 받아보세요`;
            const baseCaps = [c1, c2, c3, c4];
            const baseTts = [
              `${topicTitle}, 고민되시죠?`,
              topicWhy ? `${topicWhy}.` : `${shortRaw}, 핵심만 짚어드릴게요.`,
              `${IND.name}에서 딱 맞게 정리해 드립니다.`,
              `지금 편하게 ${IND.cta || '문의'} 남겨보세요.`
            ];
            const offlineAi = {
              vehicle: topicTitle,
              hook: topicTitle,
              discount: campaign.discount || (IND.cta || ''),
              cutCaptions: Array.from({ length: totalCuts }, (_, i) => baseCaps[i % baseCaps.length]),
              ttsLines: Array.from({ length: totalCuts }, (_, i) => baseTts[i % baseTts.length])
            };
            applyAiScriptToCampaign(offlineAi, d, stripExcludedLocal);
            if (noticeEl) noticeEl.textContent = `주제 [${topicTitle}] 기본 대본을 채웠고, 맞춤 이미지를 적용합니다.`;
          } else {
            if (campaign.presetKey && (AR_INDUSTRY_PRESETS[IND.key] || {})[campaign.presetKey]) applyIndustryPreset(campaign.presetKey);
            if (noticeEl) noticeEl.textContent = `AI 대본을 만들지 못해 기본 대본으로 채웠습니다. (${err.message || '연결 오류'})`;
          }
          triggerTopicImages(campaign.cutCaptions);
          return;
        }
        arFillAutoScriptOffline(parsedLocal, d);
        triggerTopicImages(campaign.cutCaptions);
      } finally {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.textContent = 'AI로 다시 만들기';
        }
      }

      arFinishScriptApply(totalCuts);
    }

    async function arDownscaleSceneDataUrl(dataUrl) {
      return new Promise((resolve) => {
        const rawImg = new Image();
        rawImg.onload = () => {
          try {
            const w = Math.min(720, rawImg.naturalWidth || 720);
            const h = Math.round(w * ((rawImg.naturalHeight || 1280) / Math.max(1, rawImg.naturalWidth || 720)));
            const cv = document.createElement('canvas');
            cv.width = w;
            cv.height = h;
            cv.getContext('2d').drawImage(rawImg, 0, 0, w, h);
            resolve(cv.toDataURL('image/jpeg', 0.86));
          } catch (e) {
            resolve(dataUrl);
          }
        };
        rawImg.onerror = () => resolve(dataUrl);
        rawImg.src = dataUrl;
      });
    }

    async function arApplyTopicSceneImages(payload) {
      const genId = (arApplyTopicSceneImages._seq = (arApplyTopicSceneImages._seq || 0) + 1);
      const noticeEl = document.getElementById('aiDirectorStatusNotice');
      const applySlotImage = (slot, dataUrl, doneCb) => {
        const img = new Image();
        img._dataUrl = dataUrl;
        img._label = `${slot + 1}. ${payload.prompt}`;
        img._sceneTitle = payload.prompt;
        img.onload = () => {
          if (genId !== arApplyTopicSceneImages._seq || campaign.isUserCustomPhotos) return;
          if (!Array.isArray(campaign.uploadedPhotos)) campaign.uploadedPhotos = [];
          if (!Array.isArray(campaign.scenePlan)) campaign.scenePlan = [];
          campaign.uploadedPhotos[slot] = img;
          if (!campaign.scenePlan[slot]) campaign.scenePlan[slot] = {};
          campaign.scenePlan[slot].photoIdx = slot;
          if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
          if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
          if (typeof renderCutEditorPanel === 'function') renderCutEditorPanel();
          if (typeof renderInlineQuickEditBar === 'function') renderInlineQuickEditBar();
          if (window.__timelines?.main) window.__timelines.main.seek(window.__timelines.main.currentTime);
          if (doneCb) doneCb();
        };
        img.src = dataUrl;
      };

      try {
        if (noticeEl) {
          noticeEl.classList.remove('hidden');
          noticeEl.textContent = `주제 [${payload.prompt}]에 맞는 씬 이미지를 생성 중입니다...`;
        }
        const promptRes = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'scene-prompts', ...payload })
        });
        const pj = await promptRes.json().catch(() => ({}));
        if (genId !== arApplyTopicSceneImages._seq || campaign.isUserCustomPhotos) return;
        const prompts = Array.isArray(pj.prompts) ? pj.prompts : [];
        if (!promptRes.ok || !pj.ok || !prompts.length) {
          if (noticeEl) noticeEl.textContent = `주제 [${payload.prompt}] 대본이 적용되었습니다. (이미지 생성 대기)`;
          return;
        }

        const totalCutsTarget = Math.max(prompts.length, Math.min(10, Number(payload.totalCuts) || prompts.length));
        let readyCount = 0;
        const firstReady = new Array(prompts.length).fill(null);

        await Promise.all(prompts.map(async (imagePrompt, idx) => {
          try {
            const imgRes = await fetch('/api/generate-script', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: 'scene-image', imagePrompt, index: idx, adminGeminiKey: payload.adminGeminiKey || '' })
            });
            const ij = await imgRes.json().catch(() => ({}));
            if (genId !== arApplyTopicSceneImages._seq || campaign.isUserCustomPhotos) return;
            if (!imgRes.ok || !ij.ok || !ij.image || !ij.image.dataUrl) return;
            const compactUrl = await arDownscaleSceneDataUrl(ij.image.dataUrl);
            if (genId !== arApplyTopicSceneImages._seq || campaign.isUserCustomPhotos) return;
            firstReady[idx] = compactUrl;
            for (let slot = idx; slot < totalCutsTarget; slot += prompts.length) {
              applySlotImage(slot, compactUrl, () => {
                readyCount += 1;
                if (noticeEl && readyCount >= totalCutsTarget) {
                  noticeEl.textContent = `주제 [${payload.prompt}] 맞춤 대본·이미지(${prompts.length}컷)가 적용되었습니다.`;
                }
              });
            }
          } catch (e) {}
        }));
      } catch (e) {
        if (noticeEl) noticeEl.textContent = `이미지 생성 중 일시적 지연이 발생했습니다. (${e.message || '네트워크 오류'})`;
      }
    }
