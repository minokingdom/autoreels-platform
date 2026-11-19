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
        // 교육부 수능 시행일 발표(보도자료 100526, 103512, 106921). 미발표 연도는 추정하지 않습니다.
        const examDay = { 2026: 19, 2027: 18, 2028: 16 }[yy];
        if (examDay) list.push([new Date(yy, 10, examDay), '수능']);
        const thanksgiving = arNthWeekday(yy, 10, 4, 4);
        list.push([new Date(yy, 10, thanksgiving.getDate() + 1), '블랙프라이데이']);
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
        out.push({ title: '처음 방문하는 손님께', why: '첫 방문 전에 궁금한 점', prompt: `처음 방문할 때 참고할 ${P} 선택 기준` });
        out.push({ title: '준비 과정 보여주기', why: '정성과 신뢰를 보여 주기', prompt: `${P}을(를) 준비하는 과정과 정성` });
      }
      out.push({ title: `${dc.season} 시즌 추천`, why: `${dc.season}에 어울리는 선택`, prompt: `${dc.season}에 어울리는 ${P} 추천` });
      out.push({ title: '자주 묻는 질문 답하기', why: '문의를 줄이고 신뢰를 높임', prompt: `손님들이 자주 묻는 ${P} 질문에 답하기` });
      out.push({ title: '비포 · 애프터 비교', why: '변화를 한눈에 보여 주기', prompt: `${P} 진행 전후 차이와 달라지는 점` });
      out.push({ title: '초보자가 많이 하는 실수', why: '저장·공유율이 높은 정보형', prompt: `${P} 고를 때 실패하지 않는 기준 3가지` });
      out.push({ title: '예약 · 방문 전 체크', why: '노쇼·오해를 줄이는 안내', prompt: `${P} 방문 전 미리 알면 좋은 꿀팁` });
      out.push({ title: '손님 후기 · 만족 포인트', why: '재방문이 많은 이유 소개', prompt: `실제로 찾은 분들이 가장 만족하는 ${P} 포인트` });
      out.push({ title: '선택 기준 비교', why: '손님이 직접 비교할 수 있게', prompt: `${P} 선택 전에 살펴볼 차이점` });
      return out.slice(0, 10);
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
    function arPickFallbackTopicPhoto(indKey, idx) {
      const k = indKey && indKey !== 'undefined' ? indKey : 'auto';
      const slot = ((idx % 10) + 1);
      return `/assets/scenes/${k}/${slot}.jpg`;
    }
    async function arDownscaleSquareIcon(dataUrl) {
      return new Promise((resolve) => {
        const raw = new Image();
        raw.onload = () => {
          try {
            const size = 160;
            const sw = raw.naturalWidth || size;
            const sh = raw.naturalHeight || size;
            const crop = Math.min(sw, sh);
            const sx = Math.floor((sw - crop) / 2);
            const sy = Math.floor((sh - crop) / 2);
            const cv = document.createElement('canvas');
            cv.width = size;
            cv.height = size;
            cv.getContext('2d').drawImage(raw, sx, sy, crop, crop, 0, 0, size, size);
            resolve(cv.toDataURL('image/jpeg', 0.84));
          } catch (e) { resolve(dataUrl); }
        };
        raw.onerror = () => resolve(dataUrl);
        raw.src = dataUrl;
      });
    }
    let arTopicIconJob = 0;
    async function arHydrateTopicIcons(topics, cacheKey, serverUpdatedAt) {
      if (!arCanUseAi()) return;
      if (!Array.isArray(topics) || !topics.length || !window.location.protocol.startsWith('http')) return;
      const missing = topics.map((t, i) => ({ t, i })).filter(({ t }) => t && !t.iconUrl);
      if (!missing.length) return;
      const jobId = ++arTopicIconJob;
      try {
        const th = typeof arBuildThemeContextForImages === 'function' ? arBuildThemeContextForImages() : {};
        const pRes = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'scene-prompts',
            isIcon: true,
            industry: IND.key,
            industryInfo: { name: IND.name },
            themeInfo: th,
            topicsList: missing.map(({ t }) => ({ title: t.title, why: t.why })),
            count: missing.length
          })
        });
        const pj = await pRes.json().catch(() => ({}));
        if (jobId !== arTopicIconJob || !pRes.ok || !pj.ok || !Array.isArray(pj.prompts)) return;

        // 현재 보이는 1페이지(처음 5개)부터 먼저 생성 후 나머지 병렬 생성
        const ordered = missing.map((m, k) => ({ ...m, prompt: pj.prompts[k] })).filter((x) => x.prompt);
        const runBatch = async (batch) => {
          await Promise.all(batch.map(async ({ t, i, prompt }) => {
            try {
              const ir = await fetch('/api/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'scene-image', imagePrompt: prompt, index: i, aspectRatio: '1:1' })
              });
              const ij = await ir.json().catch(() => ({}));
              if (jobId !== arTopicIconJob || !ir.ok || !ij.ok || !ij.image || !ij.image.dataUrl) return;
              const iconUrl = await arDownscaleSquareIcon(ij.image.dataUrl);
              if (jobId !== arTopicIconJob) return;
              t.iconUrl = iconUrl;
              const imgEl = document.querySelector(`#topicCards [data-topic-idx="${i}"] .bgm-cover img`);
              if (imgEl) imgEl.src = iconUrl;
              arSyncProductRows();
            } catch (e) {}
          }));
          if (jobId === arTopicIconJob && cacheKey) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify({ topics, at: Date.now(), trendsAt: serverUpdatedAt || '' }));
            } catch (e) {}
          }
        };
        await runBatch(ordered.slice(0, 5));
        if (ordered.length > 5 && jobId === arTopicIconJob) await runBatch(ordered.slice(5));
      } catch (e) {}
    }

    function arRenderTopics(topics, statusText, keepPage, cacheInfo) {
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
      const curTopic = window.arTodayTopic && window.arTodayTopic.title;
      const indKey = typeof IND !== 'undefined' && IND.key ? IND.key : 'auto';
      box.innerHTML = topics.slice(from, from + AR_TOPICS_PER_PAGE).map((t, k) => ({ t, i: from + k })).map(({ t, i }) => {
        const fallback = indKey === 'personal' ? '' : `/assets/topics/${indKey}/${(i % 10) + 1}.jpg`;
        const imgSrc = t.iconUrl || fallback;
        const cover = imgSrc ? `<span class="bgm-cover overflow-hidden"><img src="${esc(imgSrc)}" data-fallback="${esc(fallback)}" alt="" loading="lazy" /></span>` : '';
        return `
        <button type="button" data-topic-idx="${i}" class="bgm-row topic-row ${curTopic === t.title ? 'on' : ''}">
          ${cover}
          <span class="bgm-row-txt"><strong>${esc(t.title)}</strong><small><b>${esc(t.why)}</b>${t.prompt ? ' · ' + esc(t.prompt) : ''}</small></span>
          <span class="bgm-row-state">${curTopic === t.title ? '✓' : '›'}</span>        </button>`;
      }).join('') + pager;
      box.querySelectorAll('img[data-fallback]').forEach(img => {
        img.addEventListener('error', () => {
          if (img.getAttribute('src') !== img.dataset.fallback) img.src = img.dataset.fallback;
        }, { once: true });
      });
      arSyncProductRows();
      const st = document.getElementById('topicStatus');
      if (st && statusText !== null) st.textContent = statusText || '';
      if (cacheInfo && cacheInfo.hydrate) {
        arHydrateTopicIcons(topics, cacheInfo.cacheKey, cacheInfo.serverUpdatedAt);
      }
    }
    async function arLoadSpecialtyTopics(force, dc, industry, specialty, job) {
      const accountId = window.AR_SERVER?.me?.user?.id;
      const cacheKey = `ar_specialty_ideas_v2_${accountId || 'preview'}_${industry}_${specialty}_${dc.dateKey}`;
      const stillCurrent = () => job === arTopicsLoading && industry === IND.key && specialty === arIndustrySpecialty();
      const prevTitles = force ? (window.__arTopics || []).map(t => t.title).slice(0, 12) : [];
      const ideas = IND.key === 'clinic'
        ? ['첫 방문 준비', '예약 방법', '진료 전 자주 묻는 질문', '상담 때 확인할 점', '접수부터 진료까지']
        : ['처음 고르는 법', '실제 준비 과정', '자주 묻는 질문', '방문 전 확인', dc.season + ' 추천'];
      const fallback = ideas.map(idea => ({
        title: specialty + ' ' + idea,
        why: specialty,
        prompt: specialty + ' 손님을 위한 ' + idea + ' 안내. 확인된 내용만 소개하기.'
      }));
      arRenderTopics(fallback, specialty + ' 추천 주제예요.');
      if (!accountId || !arCanUseAi()) return;
      let batch = null;
      try {
        const r = await fetch('/api/account?action=specialty-trends', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
        if (r.ok) {
          const data = await r.json();
          if (data.industry === industry && data.specialty === specialty) batch = data;
        }
      } catch (_) {}
      if (!stillCurrent()) return;
      const trendsAt = batch?.updatedAt || '';
      if (!force) {
        try {
          const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
          if (cached?.trendsAt === trendsAt && Array.isArray(cached.topics) && cached.topics.length) {
            arRenderTopics(cached.topics, specialty + ' 추천 주제예요.');
            return;
          }
        } catch (_) {}
      }
      try {
        const r = await fetch('/api/generate-script', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'topics', industry, specialty, dateContext: dc, trends: batch?.keywords || [],
            industryInfo: { name: IND.name, role: IND.role, product: specialty, aiRole: IND.aiRole },
            excludeTitles: prevTitles
          })
        });
        if (!r.ok || !stillCurrent()) return;
        const data = await r.json();
        if (!stillCurrent() || !data.ok || !Array.isArray(data.topics) || !data.topics.length) return;
        try { localStorage.setItem(cacheKey, JSON.stringify({ topics: data.topics, trendsAt })); } catch (_) {}
        arRenderTopics(data.topics, specialty + ' 추천 주제예요.');
      } catch (_) {}
    }
    const AR_PERSONAL_TOPIC_IDEAS = {
      학생: ['시험 전 복습 루틴', '내가 정리한 공부 노트', '수업 끝나고 하는 일', '시간표 바뀐 날', '발표 준비 과정'],
      군인: ['공개 가능한 하루 루틴', '체력 관리 기록', '휴가 중 기억에 남은 일', '복무 중 배운 습관', '틈날 때 읽은 책'],
      야구선수: ['경기 전 몸 풀기', '타격 연습 한 장면', '글러브 챙기는 순서', '원정 경기 준비', '오늘 경기 돌아보기'],
      정치인: ['공개 일정 요약', '정책 용어 쉽게 설명', '공개 회의에서 나온 질문', '공개 자료 읽는 법', '지역 행사에서 들은 이야기']
    };
    function arPersonalTopics(role) {
      const common = ['기억에 남은 한 장면', '하루를 시작하는 습관', '이번 주에 배운 것', '준비 과정 기록', '요즘 바꾼 습관', '한 주 돌아보기', '자주 받는 질문'];
      const roleKey = role.replace(/\s/g, '');
      const roleIdeas = Object.hasOwn(AR_PERSONAL_TOPIC_IDEAS, roleKey) ? AR_PERSONAL_TOPIC_IDEAS[roleKey] : role ? [`${role}의 하루 기록`] : [];
      const ideas = [...roleIdeas, ...common];
      return ideas.slice(0, 10).map(title => ({
        title,
        why: role || '개인 기록',
        prompt: `${role ? role + '의 관점에서 ' : ''}${title}. 공개 가능한 실제 경험을 한 장면으로 소개하기.`
      }));
    }
    const arKstDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' });
    const arKstTime = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    let arKeywordDay = '';
    let arKeywordTimer;
    // Only match complete search phrases. A person's name in the national feed
    // carries no evidence of a connection to a particular business.
    const arIndustrySearchTerms = {
      restaurant: '외식|맛집|안주|맥주|생맥주|수제맥주|치킨|삼겹살|국밥|제철음식|호프집|맥주 안주',
      cafe: '커피|원두|라떼|카페|디저트|케이크|베이커리|크루아상|디카페인',
      auto: '자동차|전기차|하이브리드|중고차|전기차 보조금|자동차세',
      beauty: '미용실|네일아트|헤어스타일|염색|펌|피부관리',
      realestate: '부동산|전세|월세|청약|아파트 청약|전세대출',
      academy: '수능|대학수학능력시험|모의고사|대입|수시|정시|수능 등급컷',
      clinic: '예방접종|독감|독감 예방접종|건강검진|비염|알레르기',
      fitness: '헬스장|필라테스|웨이트 트레이닝|근력운동|요가',
      shop: '블랙프라이데이|쇼핑몰|온라인 쇼핑|코리아세일페스타',
      interior: '인테리어|리모델링|도배|바닥재|아파트 인테리어'
    };
    function arKeywordMatchText(value) {
      return String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g, '');
    }
    function arDailyKeywordRow(list, term, detailText, publisher, url) {
      const row = document.createElement('div');
      row.className = 'daily-keyword-row';
      const button = document.createElement('button');
      button.type = 'button';
      const title = document.createElement('span');
      title.textContent = term;
      const detail = document.createElement('small');
      detail.textContent = detailText;
      button.append(title, detail);
      button.addEventListener('click', () => {
        const input = document.getElementById('topicCustomInput');
        input.value = term;
        input.focus();
      });
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = publisher;
      link.setAttribute('aria-label', term + ' 출처 · ' + publisher);
      row.append(button, link);
      list.append(row);
    }
    async function arLoadDailyKeywords() {
      const panel = document.getElementById('dailyKeywords');
      const now = new Date();
      const day = arKstDay.format(now);
      const phrases = [arIndustrySpecialty(), campaign.vehicleEntered ? campaign.vehicle : '',
        ...(arIndustrySearchTerms[IND.key] || '').split('|')].map(arKeywordMatchText).filter(Boolean);
      const scope = JSON.stringify([day, Math.floor(now.getTime() / 3600000), IND.key, phrases]);
      if (!panel || arKeywordDay === scope) return;
      arKeywordDay = scope;
      const list = panel.querySelector('.daily-keyword-list');
      const heading = panel.querySelector('h3');
      const status = panel.querySelector('.daily-keyword-status');
      const yesterday = arKstDay.format(now.getTime() - 86400000);
      heading.textContent = '오늘의 키워드';
      list.replaceChildren();
      status.textContent = '키워드를 불러오는 중…';
      clearTimeout(arKeywordTimer);
      arKeywordTimer = setTimeout(arLoadDailyKeywords, 3600000 - now.getTime() % 3600000 + 50);
      try {
        const response = await fetch('/daily-keywords.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('키워드 수집 파일 없음');
        const data = await response.json();
        if (arKeywordDay !== scope) return;
        const collected = Date.parse(data.collectedAt);
        if (data.source !== 'https://trends.google.com/trending/rss?geo=KR' || !Number.isFinite(collected) || collected > Date.now() ||
            ![day, yesterday].includes(arKstDay.format(collected)) || !Array.isArray(data.items)) {
          status.textContent = '아직 오늘 확인된 키워드가 없습니다.';
          arKeywordDay = '';
          return;
        }
        const feedDay = arKstDay.format(collected);
        const shown = new Set();
        const origins = { '교육부': 'https://www.moe.go.kr', '연합뉴스': 'https://www.yna.co.kr', SBS: 'https://news.sbs.co.kr' };
        function showIssues(issues, issueDay) {
          for (const issue of Array.isArray(issues) ? issues : []) {
            if (issue?.day !== issueDay || typeof issue.term !== 'string' || !issue.term.trim() || shown.has(issue.term)) continue;
            if (!Object.hasOwn(origins, issue.publisher) || typeof issue.url !== 'string' ||
                !issue.url.startsWith(origins[issue.publisher] + '/')) continue;
            const schedule = issue.kind === '일정' && issue.publisher === '교육부';
            const published = Date.parse(issue.publishedAt);
            if (!schedule && (issue.kind !== '보도' || !Number.isFinite(published) ||
                published > collected || arKstDay.format(published) !== issueDay)) continue;
            const when = issueDay === day ? '오늘' : '어제';
            arDailyKeywordRow(list, issue.term, schedule ? when + ' 일정' : when + ' ' + arKstTime.format(published) + ' 보도', issue.publisher, issue.url);
            shown.add(issue.term);
          }
        }
        if (feedDay === day) showIssues(data.issues, day);
        for (const item of feedDay === day ? data.items : []) {
          const started = Date.parse(item?.startedAt);
          if (typeof item?.term !== 'string' || !item.term.trim() || !Number.isFinite(started) ||
              started > collected || arKstDay.format(started) !== day) continue;
          if (shown.has(item.term) || !phrases.includes(arKeywordMatchText(item.term))) continue;
          arDailyKeywordRow(list, item.term, '급상승 시작 ' + arKstTime.format(started) + (item.traffic ? ' · 검색량 ' + item.traffic : ''), 'Google 트렌드', data.source);
          shown.add(item.term);
        }
        if (shown.size) {
          status.textContent = day + ' ' + arKstTime.format(collected) + ' 수집';
        } else {
          showIssues(feedDay === yesterday ? data.issues : data.previousIssues, yesterday);
          if (shown.size) heading.textContent = '최근 이슈 · ' + yesterday;
          status.textContent = shown.size ? '오늘 확인된 키워드가 없어 어제 이슈를 표시합니다.' : '아직 오늘 확인된 키워드가 없습니다.';
        }
      } catch {
        if (arKeywordDay === scope) {
          status.textContent = '키워드를 불러오지 못했습니다.';
          arKeywordDay = '';
        }
      }
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) arLoadDailyKeywords(); });
    async function arLoadTopics(force) {
      arLoadDailyKeywords();
      document.getElementById('storeTopicHeading').textContent = IND.key === 'personal' ? '내 추천 주제' : '우리 가게 추천 주제';
      const myJob = ++arTopicsLoading;
      const dc = arDateContext();
      const line = document.getElementById('topicDateLine');
      if (line) line.textContent = `${dc.dateStr} ${dc.weekday} · ${dc.season}${dc.events.length ? ' · ' + dc.events.slice(0, 2).join(' · ') : ''}`;
      const specialty = arIndustrySpecialty();
      const currentTopic = window.arTodayTopic;
      if (currentTopic && (IND.key === 'personal' || currentTopic.industry === 'personal') &&
          (currentTopic.industry !== IND.key || currentTopic.specialty !== specialty)) {
        window.arTodayTopic = null;
        document.getElementById('todayTopicBadge')?.classList.add('hidden');
        const prompt = document.getElementById('aiPromptInput');
        if (prompt?.value === currentTopic.prompt) prompt.value = '';
      }
      if (IND.key === 'personal') {
        const topics = arPersonalTopics(specialty);
        const first = force ? topics.findIndex(t => t.title === window.__arTopics?.[0]?.title) : -1;
        const offset = first < 0 ? 0 : (first + 5) % topics.length;
        return arRenderTopics([...topics.slice(offset), ...topics.slice(0, offset)], `${specialty || '개인'} 추천 주제예요.`);
      }
      if (specialty) return arLoadSpecialtyTopics(force, dc, IND.key, specialty, myJob);
      const industry = IND.key;
      const cacheKey = `ar_topic_ideas_v5_${IND.key}_${dc.dateKey}`;
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
      if (myJob !== arTopicsLoading || industry !== IND.key || arIndustrySpecialty()) return;
      if (!force) {
        try {
          const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
          if (cached && Array.isArray(cached.topics) && cached.topics.length && (!serverUpdatedAt || cached.trendsAt === serverUpdatedAt)) {
            arRenderTopics(cached.topics, '오늘의 추천 주제예요. 마음에 드는 게 없으면 [다른 주제 보기]를 눌러 보세요.', false);
            return;
          }
        } catch (e) {}
        // 서버(trends-today.json)에 미리 제작된 주제·이미지가 있으면 추가 AI 과금 없이 즉시 표시
        const serverTopics = pre && pre.industries && pre.industries[IND.key] && Array.isArray(pre.industries[IND.key].topics)
          ? pre.industries[IND.key].topics
          : null;
        if (serverTopics?.length && pre.industries[IND.key].topicsDate === dc.dateKey) {
          try { localStorage.setItem(cacheKey, JSON.stringify({ topics: serverTopics, at: Date.now(), trendsAt: serverUpdatedAt })); } catch (e) {}
          const status = arCanUseAi() ? '하나를 누르면 대본을 바로 만들어요.' : arAiAccessNotice();
          arRenderTopics(serverTopics, status, false);
          return;
        }
      }
      if (!arCanUseAi()) {
        arRenderTopics(arFallbackTopics(dc), '기본 추천 주제예요. ' + arAiAccessNotice());
        return;
      }
      // 먼저 기본 주제를 바로 보여 주고, AI 추천이 오면 바꿈
      arRenderTopics(arFallbackTopics(dc), '업종에 맞는 릴스 주제를 고르는 중…');
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
      if (myJob !== arTopicsLoading || industry !== IND.key || arIndustrySpecialty()) return;
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
        if (myJob !== arTopicsLoading || industry !== IND.key || arIndustrySpecialty()) return;
        if (res && res.ok && Array.isArray(res.topics) && res.topics.length) {
          try { localStorage.setItem(cacheKey, JSON.stringify({ topics: res.topics, at: Date.now(), trendsAt: serverUpdatedAt })); } catch (e) {}
          arRenderTopics(res.topics, '하나를 누르면 대본을 바로 만들어요.', false);
          return;
        }
      } catch (e) {}
      if (myJob === arTopicsLoading) {
        const st = document.getElementById('topicStatus');
        if (st) st.textContent = 'AI 추천을 받지 못해 기본 주제를 보여 드려요. 잠시 뒤 [↻ 다른 주제]를 눌러 보세요.';
      }
    }
    // 주제 선택 → 대본 탭으로 이동해 그 주제로 AI 대본을 바로 만듦
    // ★ 내 상품 시트 (주제·대본 탭의 '내 상품' 한 줄) — 상품을 먼저 정해 두면 대본이 처음부터 맞게 나옴
    let arProductSnap = '';
    function arProductKey() {
      return ['inputVehicle', 'inputDiscountNum', 'inputDiscount'].map((id) => (document.getElementById(id) || {}).value || '').join('|');
    }
    function arProductPhoto(name) {
      const photos = campaign.uploadedPhotos || [];
      const photo = photos.find((p) => p && p.src);
      if (campaign.isUserCustomPhotos && photo) return photo.src;
      // 기본 업종 사진보다 상품명과 겹치는 주제 사진을 우선합니다.
      const words = String(name || '').split(/\s+/).filter((word) => word.length > 1);
      let best = null, bestScore = 0;
      for (const topic of (window.__arTopics || [])) {
        if (!topic.iconUrl) continue;
        const title = String(topic.title || '');
        const score = words.filter((word) => title.includes(word)).length;
        if (score > bestScore) { best = topic; bestScore = score; }
      }
      return (best && best.iconUrl) || (photo && photo.src) || arPickFallbackTopicPhoto(IND.key, 0);
    }
    function arSyncProductPreset() {
      if (IND.key === 'auto') return;
      const select = document.getElementById('presetSelect');
      const match = Object.entries(arPresetsForIndustry()).find(([, item]) =>
        item.vehicle === campaign.vehicle && (item.discountNum || 0) === campaign.discountNum && item.discount === campaign.discount
      );
      const key = match?.[0] || '';
      if (select.value !== key) {
        select.value = key;
        if (select.__igRow) arSyncIgSelects(select.parentElement);
      }
    }
    function arSyncProductRows() {
      const personal = IND.key === 'personal';
      const custom = document.getElementById('topicCustomInput');
      if (custom) custom.placeholder = personal ? '오늘 올릴 내용 적기 (예: 경기 전 루틴)' : '오늘 올릴 내용 적기 (예: 신메뉴 출시, 오늘만 할인)';
      document.querySelectorAll('[data-business-product]').forEach(el => { el.hidden = personal; });
      const chip = document.getElementById('todayTopicChip');
      if (chip) chip.textContent = (window.arTodayTopic && window.arTodayTopic.title) || '고르기';
      if (personal) return;
      arSyncProductPreset();
      const name = String((typeof campaign !== 'undefined' && campaign.vehicle) || (document.getElementById('inputVehicle') || {}).value || '').trim() || '내 상품';
      const sub = String((document.getElementById('inputDiscount') || {}).value || '').trim();
      const num = Number((document.getElementById('inputDiscountNum') || {}).value || 0);
      document.querySelectorAll('.ar-product-name').forEach((el) => { el.textContent = name; });
      document.querySelectorAll('.ar-product-sub').forEach((el) => { el.textContent = [num > 0 && typeof IND !== 'undefined' && IND.key === 'auto' ? `최대 ${num}만원 할인` : '', sub].filter(Boolean).join(' · ') || '무엇을 알릴지 정해 두면 대본에 들어가요'; });
      const photoSrc = arProductPhoto(name);
      document.querySelectorAll('.ar-product-photo').forEach((img) => {
        if (img.getAttribute('src') !== photoSrc) img.src = photoSrc;
        img.alt = name;
      });
    }
    document.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'presetSelect') setTimeout(arSyncProductRows, 60);
    });
    function arOpenProductSheet() {
      const el = document.getElementById('productSheet');
      if (!el) return;
      arWatchEditSheet(el);
      arProductSnap = arProductKey();
      el.classList.remove('hidden');
      el.style.display = 'flex';
      arSyncProductPreset();
      arSyncIgSelects(el);
    }
    function arCloseProductSheet() {
      const el = document.getElementById('productSheet');
      if (!el) return;
      el.classList.add('hidden');
      el.style.display = 'none';
      arSyncProductRows();
      if (arProductKey() !== arProductSnap && arHasEnteredVehicle()) saveAiScriptPrefs();
    }
    document.getElementById('arProductCloseBtn').addEventListener('click', arCloseProductSheet);
    document.getElementById('arProductScriptBtn').addEventListener('click', () => {
      if (window.__arScriptGenerating) return;
      const input = document.getElementById('inputVehicle');
      if (!input.value.trim()) {
        input.focus();
        arToast(`${IND.product} 이름을 입력해 주세요.`);
        return;
      }
      if (IND.key === 'auto') campaign.vehicleEntered = true;
      arCloseProductSheet();
      if (!arRequireAiAccess()) return;
      arResumeAfterEditSheets = false;
      switchStudioTab('script', false, { replaceClosedOverlay: true });
      generateStoryboardFromPrompt({ useCurrentProduct: true });
    });

    function arPickTopic(topic) {
      if (!topic || !topic.prompt) return;
      const promptEl = document.getElementById('aiPromptInput');
      if (promptEl) promptEl.value = topic.prompt;
      if (!arRequireAiAccess()) return;
      arSuspendScriptNarration();
      const picked = { ...topic, industry: IND.key, specialty: arIndustrySpecialty() };
      window.arTodayTopic = picked;
      setTimeout(arSyncProductRows, 0);
      setTimeout(() => window.scrollTo({ top: Math.max(0, (document.getElementById('studioTabBtn_script') || document.body).getBoundingClientRect().top + window.scrollY - 160), behavior: 'smooth' }), 60);
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
          if (badge && window.arTodayTopic === picked) badge.textContent = `오늘 주제: ${topic.title}${tail}`;
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
    let arFinalAudioUnlocked = false;
    let arPreviewPausedForEdit = false;
    let arPendingPreviewPlay = null;
    let arEditSheetOpen = false;
    let arResumeAfterEditSheets = false;
    const arWatchedEditSheets = new Map();
    const arEditSheetObserver = new MutationObserver(arSyncEditSheetPlayback);
    function arSyncEditSheetPlayback() {
      const open = [...arWatchedEditSheets].some(([sheet, openClass]) =>
        sheet.isConnected && (openClass ? sheet.classList.contains(openClass) : !sheet.classList.contains('hidden')));
      if (open === arEditSheetOpen) return;
      arEditSheetOpen = open;
      if (open) {
        arResumeAfterEditSheets = isPlaying;
        if (!isPlaying) AudioEngine.onPlayStateChange(false);
        arPauseForStudioEdit();
      } else {
        const resume = arResumeAfterEditSheets;
        arResumeAfterEditSheets = false;
        if (resume && !isPlaying) togglePlayPause();
      }
    }
    function arWatchEditSheet(sheet, openClass = '') {
      if (!sheet || arWatchedEditSheets.has(sheet)) return;
      arWatchedEditSheets.set(sheet, openClass);
      arEditSheetObserver.observe(sheet, { attributes: true, attributeFilter: ['class'] });
      queueMicrotask(arSyncEditSheetPlayback);
    }
    // ★ 2026-11-17 사장님 요청: 성우 목소리를 첫 화면부터 바로 들려줌 (발행 단계까지 기다리지 않음)
    //   크레딧 절약은 '소리를 켰을 때만 녹음'(prefetchTtsBuffers)으로, 이전 대본 목소리 섞임은 대본별 녹음(masterWantKey)으로 막음
    function arVoiceAllowed() { return !window.__arScriptGenerating; }
    function arHasGenerationAccount() { return Boolean(window.AR_SERVER?.me?.user); }
    function arTrialIsActive(trial) {
      return trial.active && Date.parse(trial.endsAt) > Date.now();
    }
    function arCanUseAi() {
      const trial = window.AR_SERVER?.me?.usage?.trial;
      return arHasGenerationAccount() && (!trial || arTrialIsActive(trial));
    }
    function arAiAccessNotice() {
      return arHasGenerationAccount() ? '가입 후 7일 무료 AI 체험이 끝났어요.' : 'AI 대본을 만들려면 로그인해 주세요.';
    }
    function arRequireAiAccess() {
      if (arCanUseAi()) return true;
      if (arHasGenerationAccount()) arToast(arAiAccessNotice());
      else openDealerAuthModal('generation');
      return false;
    }
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
        if (arPreviewPausedForEdit || arPendingPreviewPlay || document.getElementById('studioPanel_publish').classList.contains('hidden')) return;
        triggerFullAudioPreview();
        arSetFinalPreviewStatus(AudioEngine.masterBuffer
          ? '완성본 재생 중 — 고른 배경음악과 성우 목소리가 함께 들어갑니다.'
          : '성우 녹음을 받지 못해 배경음악만 재생합니다. 잠시 뒤 [처음부터 다시 보기]를 눌러 주세요.');
      });
    }
    function arReplayFinalPreview() {
      if (arEditSheetOpen) return;
      arPreviewPausedForEdit = false;
      arPendingPreviewPlay = null;
      if (!arFinalAudioUnlocked) return arStartFinalPreview();
      if (window.innerWidth < 1024) scrollToMainMonitor();
      triggerFullAudioPreview();
    }
    function switchStudioTab(key) {
      if (key !== 'sound' && document.querySelector('#arOptionSheet[data-source-select="ttsVoiceSelect"]:not(.hidden)')) arCloseOptionSheet();
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
      const changed = document.getElementById(`studioTabBtn_${key}`)?.getAttribute('aria-selected') !== 'true';
      const leavingEnding = key !== 'card' && arEndingTabActive();
      if (leavingEnding) updateCurrentDealerFromPreview();
      arStepsVisited.add(key);
      if (key === 'sound') AudioEngine.loadVoiceList();
      if (key === 'card' && arEndingForm.parentElement.id === 'arEndingFormHome') {
        updateCurrentDealerFromPreview();
        arRenderCardShowToggles();
      }
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
        if (btn) btn.setAttribute('aria-selected', String(active));
      });
      // ★ 2026-11-17: 미리보기는 첫 단계(주제)부터 항상 보임 (예전: 사진 탭부터)
      const showPreview = true;
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
      arSetupSheetMode();
      if (changed && arUsesWorkflowSheet() && wfCol) wfCol.scrollTop = 0;
      if (key === 'publish' && !arFinalAudioUnlocked) {
        if (arPreviewPausedForEdit) {
          arFinalAudioUnlocked = true;
          arSetFinalPreviewStatus('엔딩을 적용했어요. 재생을 누르면 멈춘 위치에서 이어집니다.');
        } else arStartFinalPreview();
      }
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
    // ==========================================================================
    // ★ 휴대폰: 미리보기 위 고정 + 아래 바텀시트 (2026-11-17 사장님 요청)
    //   body.ar-sheet 일 때 CSS 가 미리보기를 위에, 단계 칸을 아래 시트(화면 약 절반)로 고정
    // ==========================================================================
    function arToggleSheet(force) {
      const wasMin = document.body.classList.contains('ar-sheet-min');
      const min = typeof force === 'boolean' ? force : !wasMin;
      const closing = !wasMin && min && arUsesWorkflowSheet();
      const savedEnding = closing && arEndingTabActive() && (updateCurrentDealerFromPreview() || arEndingSavedInSheet);
      document.body.classList.toggle('ar-sheet-min', min);
      if (wasMin && arWorkflowSheetExpanded()) {
        arEndingSavedInSheet = false;
        arPauseForStudioEdit();
      }
      const h = document.getElementById('arSheetHandle');
      if (h) h.setAttribute('aria-expanded', min ? 'false' : 'true');
      if (savedEnding && !arEditSheetOpen && !isPlaying) togglePlayPause();
    }
    function arSetupSheetMode() {
      const wasOn = document.body.classList.contains('ar-sheet');
      const on = arUsesWorkflowSheet();
      document.body.classList.toggle('ar-sheet', on);
      arEnsureQuickBar();
      if (!on) return;
      if (!wasOn && arWorkflowSheetExpanded()) {
        arPauseForStudioEdit();
        const play = document.getElementById('playPauseBtn');
        if (play) play.textContent = '▶️ 재생';
      }
      const bar = document.getElementById('mobileStepBar');
      if (bar && bar.offsetHeight) document.body.style.setProperty('--ar-msb', `${bar.offsetHeight}px`);
      const wf = document.getElementById('studioWorkflowColumn');
      if (wf && !document.getElementById('arSheetHandle')) {
        const h = document.createElement('button');
        h.type = 'button';
        h.id = 'arSheetHandle';
        h.setAttribute('aria-label', '아래 칸 접기·펼치기');
        h.setAttribute('aria-expanded', 'true');
        h.innerHTML = '<span></span>';
        // 누르면 접기·펼치기, 끌어내리면 접기, 끌어올리면 펼치기
        let y0 = null;
        let moved = false;
        h.addEventListener('pointerdown', (e) => { y0 = e.clientY; moved = false; });
        h.addEventListener('pointermove', (e) => { if (y0 != null && Math.abs(e.clientY - y0) > 8) moved = true; });
        h.addEventListener('pointerup', (e) => {
          if (y0 == null) return;
          const dy = e.clientY - y0;
          y0 = null;
          if (!moved) { arToggleSheet(); return; }
          arToggleSheet(dy > 0);
        });
        wf.insertBefore(h, wf.firstChild);
      }
    }
    window.addEventListener('resize', () => { try { arSetupSheetMode(); } catch (e) {} });

    // ★ 미리보기 옆 바로 누르는 버튼: 소리 · 섞기 · 성우 · 처음부터 (어느 단계에서든)
    const AR_QB_ICONS = {
      color: '<path d="M12 3C7 3 3 6.8 3 12a9 9 0 0 0 9 9h1a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1.1-2.6H17a4 4 0 0 0 4-4c0-4.6-4.1-8-9-8Z"/><circle cx="7.5" cy="11" r=".8"/><circle cx="11" cy="7.5" r=".8"/><circle cx="16" cy="8.5" r=".8"/>',
      sound: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/>',
      mute: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M22 9l-6 6"/><path d="M16 9l6 6"/>',
      design: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      shuffle: '<path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
      voice: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
      restart: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
    };
    function arQbSvg(k) {
      if (k === 'shuffle') return '<span style="font-size:18px;line-height:1" aria-hidden="true">🎲</span>';
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${AR_QB_ICONS[k]}</svg>`;
    }
    function arEnsureQuickBar() {
      const vp = document.querySelector('#mainMonitorColumn > .monitor-frame');
      if (!vp || document.getElementById('arQuickBar')) return;
      const qb = document.createElement('div');
      qb.id = 'arQuickBar';
      qb.setAttribute('role', 'group');
      qb.setAttribute('aria-label', '미리보기 바로 조작');
      qb.innerHTML = ['sound', 'voice', 'shuffle', 'design', 'restart', 'settings'].map((k) => `<button type="button" class="aq-btn" data-qb="${k}"><span class="aq-dot">${arQbSvg(k === 'sound' ? 'mute' : k)}</span><span class="aq-label"></span></button>`).join('');
      const colors = document.createElement('details');
      colors.id = 'arQuickColors';
      colors.innerHTML = `<summary class="aq-btn"><span class="aq-dot">${arQbSvg('color')}</span><span class="aq-label">색상</span></summary>
        <div id="designColorSwatches" role="group" aria-label="디자인 색상"></div>`;
      qb.querySelector('[data-qb="design"]').after(colors);
      const colorToggle = colors.querySelector('summary');
      colors.addEventListener('toggle', () => {
        if (colors.open) renderColorPalettePicker();
      });
      colors.addEventListener('click', (event) => {
        if (event.target.closest('.color-swatch')) {
          colors.open = false;
          colorToggle.focus({ preventScroll: true });
        }
      });
      document.addEventListener('pointerdown', (event) => {
        if (colors.open && !colors.contains(event.target)) colors.open = false;
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && colors.open) {
          colors.open = false;
          colorToggle.focus({ preventScroll: true });
        }
      });
      qb.addEventListener('click', (e) => {
        const b = e.target.closest('[data-qb]');
        if (!b) return;
        colors.open = false;
        e.stopPropagation();
        arQuickAction(b.getAttribute('data-qb'));
      });
      vp.appendChild(qb);
      arSyncQuickBar();
    }
    function arQuickRestart() {
      if (!window.__timelines || !window.__timelines.main) return;
      if (arEditSheetOpen) return;
      if (arEndingTabActive()) updateCurrentDealerFromPreview();
      arPreviewPausedForEdit = false;
      arPendingPreviewPlay = null;
      if (typeof AudioEngine !== 'undefined') AudioEngine.stopTts();
      isPlaying = true;
      const pp = document.getElementById('playPauseBtn');
      if (pp) pp.textContent = '⏸ 일시정지';
      window.__timelines.main.seek(0);
      if (typeof AudioEngine !== 'undefined' && AudioEngine.enabled && AudioEngine.masterBuffer) AudioEngine.playMasterAt(0);
    }
    function arQuickAction(k) {
      if (k === 'sound') toggleAudioMaster();
      else if (k === 'design' && typeof openPresetDrawer === 'function') openPresetDrawer('right');
      else if (k === 'shuffle') randomizePreviewDesignOnly();
      else if (k === 'restart') arQuickRestart();
      else if (k === 'settings' && typeof openStudioSettingsModal === 'function') openStudioSettingsModal();
      else if (k === 'voice') {
        const sel = document.getElementById('ttsVoiceSelect');
        if (sel) {
          let saved = '';
          try { saved = localStorage.getItem('autoreels_tts_voice') || ''; } catch (e) {}
          const firstOn = Array.from(sel.options).map((o) => o.value).find((v) => v && v !== 'off') || '';
          sel.value = sel.value === 'off' ? (saved && Array.from(sel.options).some((o) => o.value === saved) ? saved : firstOn) : 'off';
          if (typeof onAudioConfigChange === 'function') onAudioConfigChange();
          if (typeof arSyncIgSelects === 'function') arSyncIgSelects();
          // 성우를 켰는데 소리가 꺼져 있으면 함께 켬
          if (sel.value !== 'off' && typeof AudioEngine !== 'undefined' && !AudioEngine.enabled) toggleAudioMaster(true);
        }
      }
      arSyncQuickBar();
    }
    function arSyncQuickBar() {
      const qb = document.getElementById('arQuickBar');
      if (!qb || typeof AudioEngine === 'undefined') return;
      const on = !!AudioEngine.enabled;
      const voiceOn = AudioEngine.ttsVoice !== 'off';
      const set = (k, label, icon, off) => {
        const b = qb.querySelector(`[data-qb="${k}"]`);
        if (!b) return;
        const l = b.querySelector('.aq-label');
        if (l.textContent !== label) l.textContent = label;
        if (b.getAttribute('data-icon') !== icon) { b.setAttribute('data-icon', icon); b.querySelector('.aq-dot').innerHTML = arQbSvg(icon); }
        b.classList.toggle('is-off', !!off);
        b.setAttribute('aria-label', label);
      };
      set('sound', on ? '소리켜짐' : '소리켜기', on ? 'sound' : 'mute', !on);
      set('voice', voiceOn ? '나레이션' : '나레이션끔', 'voice', !voiceOn);
      set('shuffle', '랜덤섞기', 'shuffle', false);
      set('design', '디자인', 'design', false);
      set('restart', '처음부터', 'restart', false);
      set('settings', '설정', 'settings', false);
    }

    function arUpdateMobileStepBar(key) {
      const bar = arEnsureMobileStepBar();
      const idx = STUDIO_TABS.indexOf(key);
      const prev = STUDIO_TABS[idx - 1];
      const next = STUDIO_TABS[idx + 1];
      const go = (k) => () => {
        switchStudioTab(k);
        // 바텀시트에서는 시트 안을 맨 위로 (미리보기는 그대로)
        if (document.body.classList.contains('ar-sheet')) {
          const wf = document.getElementById('studioWorkflowColumn');
          if (wf) wf.scrollTop = 0;
          arToggleSheet(false);
          return;
        }
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
    // 단계별 제작 안내
    // ==========================================================================
    document.addEventListener('click', (event) => {
      const help = document.querySelector('#easyStepHelp[open]');
      if (help && !help.contains(event.target)) help.open = false;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const help = document.querySelector('#easyStepHelp[open]');
      if (!help) return;
      help.open = false;
      if (help.contains(document.activeElement)) help.querySelector('summary').focus();
    });

    function arUpdateEasyGuide(key) {
      const steps = {
        topic: ['오늘의 주제', '오늘 올릴 주제를 골라 주세요. 고르면 그 주제로 AI가 대본 3안을 바로 만들어 드려요.'],
        script: ['대본 고르기', '영상 길이와 상품을 확인하고 대본을 고르세요. 원하는 내용과 말투를 적고 ‘다시 쓰기’를 누르면 대본 세 가지가 나와요. 하나를 고르면 컷별 자막과 성우 대사에 반영돼요.'],
        photo: ['사진 넣기', '사진이나 영상을 올리지 않으면 기본 사진을 사용해요. 주제와 테마에 맞는 이미지도 만들 수 있어요. 썸네일을 누르면 해당 장면으로 이동해 사진·영상, 구도와 카메라 움직임을 바꿀 수 있어요.'],
        sound: ['성우 · 배경음악', '성우 목소리와 배경음악을 골라 보세요. 현재 컷의 대사를 듣거나 영상 처음부터 들어볼 수 있어요.'],
        card: ['엔딩 꾸미기', '영상 마지막에 나올 가게 정보와 로고를 넣고, 보일 항목만 켜 두세요.'],
        publish: ['완성본 확인 · SNS에 올리기', '배경음악과 성우가 들어간 완성본을 확인하고, 올릴 곳을 켜고 [공유하기]를 누르세요.']
      };
      const idx = STUDIO_TABS.indexOf(key);
      const step = steps[key];
      if (idx < 0 || !step) return;
      document.getElementById('easyStepHelp').open = false;
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('easyStepCount', `${idx + 1} / ${STUDIO_TABS.length}`);
      set('easyStepTitle', step[0]);
      set('easyStepText', step[1]);
      document.getElementById('soundStepActions').hidden = key !== 'sound';
      document.getElementById('photoStepTools').hidden = key !== 'photo';
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
    function arShowVoiceChoices(el, sel) {
      el.innerHTML = `<div class="bgm-sheet" role="dialog" aria-modal="true" aria-label="성우 목소리">
        <div class="bgm-head"><strong>성우 목소리</strong><button type="button" class="bgm-done">적용</button></div>
        <label class="voice-speed-setting">말하는 속도<select class="studio-input"></select></label>
        <div class="bgm-list"></div><audio preload="none"></audio>
      </div>`;
      const list = el.querySelector('.bgm-list');
      const player = el.querySelector('audio');
      const speed = document.getElementById('ttsSpeedSelect');
      const draftSpeed = el.querySelector('.voice-speed-setting select');
      draftSpeed.replaceChildren(...Array.from(speed.options, option => option.cloneNode(true)));
      draftSpeed.value = String(AudioEngine.ttsSpeed || 1.1);
      // 예문은 1.1배로 합성한 파일이므로 미리듣기에서는 재생 속도만 조절합니다.
      const syncSampleSpeed = () => {
        player.defaultPlaybackRate = Number(draftSpeed.value) / 1.1;
        player.playbackRate = player.defaultPlaybackRate;
      };
      draftSpeed.onchange = syncSampleSpeed;
      syncSampleSpeed();
      let choice = sel.value;
      let hasChosen = false;
      let currentRow = null;
      function render() {
        list.replaceChildren();
        for (const opt of sel.options) {
          if (opt.hidden || opt.disabled || opt.classList.contains('hidden')) continue;
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'bgm-row' + (opt.value === choice ? ' on' : '');
          row.dataset.v = opt.value;
          row.setAttribute('aria-pressed', String(opt.value === choice));
          const name = document.createElement('strong');
          name.className = 'bgm-row-txt';
          name.textContent = opt.textContent;
          const state = document.createElement('span');
          state.className = 'bgm-row-state';
          state.textContent = opt.value === 'off' ? '' : '▶';
          state.setAttribute('aria-hidden', 'true');
          row.append(name, state);
          list.append(row);
        }
      }
      function stopSample() {
        player.pause();
        if (currentRow) currentRow.lastElementChild.textContent = '▶';
        currentRow = null;
      }
      player.onended = stopSample;
      player.onerror = () => {
        if (!currentRow) return;
        stopSample();
        arToast('예문을 재생하지 못했습니다. 다시 눌러 주세요.');
      };
      list.onclick = (event) => {
        const row = event.target.closest('button[data-v]');
        if (!row) return;
        const wasPlaying = currentRow === row;
        stopSample();
        choice = row.dataset.v;
        hasChosen = true;
        for (const item of list.children) {
          item.classList.toggle('on', item === row);
          item.setAttribute('aria-pressed', String(item === row));
        }
        if (choice === 'off' || wasPlaying) return;
        currentRow = row;
        const file = encodeURIComponent(choice);
        player.src = AudioEngine.isGoogleVoice(choice) ? '/assets/voice-previews/' + file + '.mp3'
          : '/api/tts?' + new URLSearchParams({ ref: choice, speed: '1.1', text: '오늘은 어떤 릴스를 만들어 볼까요? 오토릴스메이커와 함께 사진 한 장으로 시작해 보세요.' });
        row.lastElementChild.textContent = 'Ⅱ';
        player.play().catch(error => {
          if (currentRow !== row || error.name === 'AbortError') return;
          player.onerror();
        });
      };
      el.querySelector('.bgm-done').onclick = () => {
        arCloseOptionSheet();
        if (choice === sel.value && Number(draftSpeed.value) === AudioEngine.ttsSpeed) return;
        speed.value = draftSpeed.value;
        sel.value = choice;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      };
      render();
      if (!AudioEngine.voiceListLoaded && arCanUseAi()) {
        AudioEngine.loadVoiceList().then(() => {
          if (!list.isConnected || currentRow) return;
          if (!hasChosen) choice = sel.value;
          render();
        });
      }
    }
    function arCloseOptionSheet() {
      const el = document.getElementById('arOptionSheet');
      if (el) {
        const audio = el.querySelector('audio');
        if (audio) { audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load(); }
        el.classList.add('hidden');
        el.style.display = 'none';
        el.innerHTML = '';
      }
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
      el.dataset.sourceSelect = sel.id;
      arWatchEditSheet(el);
      if (sel.id === 'ttsVoiceSelect') {
        arShowVoiceChoices(el, sel);
        el.classList.remove('hidden');
        el.style.display = 'flex';
        arSyncEditSheetPlayback();
        return;
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
          }"><span class="w-1.5 h-1.5 rounded-full ${active ? 'bg-[#4cc38a]' : 'bg-[#85858b]'}"></span>${escapeHtmlInd(d.name)} ${escapeHtmlInd(d.title)} <span class="text-[#85858b] font-normal">${escapeHtmlInd(d.branch.split(' ')[0])}</span></button>`;
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
                  <span class="text-[14px] font-medium text-[#ededed]">${escapeHtmlInd(d.name)} ${escapeHtmlInd(d.title)}</span>
                  <span class="text-[12px] text-[#85858b]">${escapeHtmlInd(d.branch)}</span>
                  ${badgeHtml}
                  <span class="font-mono text-[11px] text-[#85858b]">${vLabel}</span>
                </div>
                <div class="text-[12px] font-mono text-[#85858b]">
                  ${escapeHtmlInd(d.phone)} · ${escapeHtmlInd(d.igUsername)} · ${escapeHtmlInd(d.licenseKey)}
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
      arEndingTabDraft = null;
      arFillEndingForm(d);
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
        statusContainer.innerHTML = '';
      }
    }

    function syncStudioSettingsModal() {
      const accEl = document.getElementById('settingsAccountSummary');
      const authBtn = document.getElementById('settingsAuthActionBtn');
      const serverMe = window.AR_SERVER && AR_SERVER.mode ? AR_SERVER.me : null;
      if (accEl) {
        const plan = serverMe?.subscription?.comp ? '무상 PRO' : serverMe?.entitlement?.pro ? 'PRO' : '무료 회원';
        accEl.textContent = serverMe?.user ? `${serverMe.user.name || '회원'} · ${plan}` : '체험 중';
      }
      if (authBtn) authBtn.textContent = serverMe?.user ? '계정 · 요금제' : '로그인 · 가입';
      document.getElementById('settingsPlanActionBtn').classList.toggle('hidden', Boolean(serverMe?.user));
      document.getElementById('settingsLegacyLicense')?.classList.toggle('hidden', Boolean(window.AR_SERVER?.mode && !isAdminMode));
      if (typeof arRenderCardShowToggles === 'function') arRenderCardShowToggles();
    }

    const arSettingsBusinessForm = document.getElementById('settingsBusinessProfile');
    function arSettingsBusinessChanged() {
      const select = document.getElementById('settingsIndustryInput');
      const input = document.getElementById('settingsSpecialtyInput');
      const save = document.getElementById('settingsBusinessSave');
      const pending = arSettingsBusinessForm.dataset.saving === 'true';
      save.disabled = pending || (select.value === IND.key && arNormalizeSpecialtyInput(input.value) === arIndustrySpecialty());
      select.disabled = pending;
      input.disabled = pending;
      arConfigureSpecialtyInput(input, select.value);
    }
    function arFillSettingsBusinessFields() {
      const select = document.getElementById('settingsIndustryInput');
      const input = document.getElementById('settingsSpecialtyInput');
      if (!select.options.length) {
        for (const ind of Object.values(AR_INDUSTRIES)) select.add(new Option(ind.icon + ' ' + ind.name, ind.key));
      }
      select.value = IND.key;
      input.value = arIndustrySpecialty();
      document.getElementById('settingsIndustrySummary').textContent = IND.key === 'personal' ? [IND.name, input.value].filter(Boolean).join(' · ') : input.value || IND.name;
      document.getElementById('settingsCardTitle').textContent = IND.key === 'personal' ? '엔딩 · 개인 프로필' : '엔딩 · 매장 정보';
      arSettingsBusinessChanged();
    }
    if (arSettingsBusinessForm) {
      const select = document.getElementById('settingsIndustryInput');
      const input = document.getElementById('settingsSpecialtyInput');
      const status = document.getElementById('settingsBusinessStatus');
      select.addEventListener('change', () => {
        input.value = select.value === IND.key ? arIndustrySpecialty() : '';
        status.textContent = '';
        arSettingsBusinessChanged();
      });
      input.addEventListener('input', () => {
        status.textContent = '';
        arSettingsBusinessChanged();
      });
      arSettingsBusinessForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (document.getElementById('settingsBusinessSave').disabled) return;
        arSettingsBusinessForm.dataset.saving = 'true';
        arSettingsBusinessChanged();
        status.textContent = '저장 중…';
        try {
          const result = await arSaveBusinessProfile(select.value, input.value, closeStudioSettingsModal);
          if (result.ok) arFillSettingsBusinessFields();
          status.textContent = result.ok ? '저장했습니다.' : (result.error || '');
        } finally {
          delete arSettingsBusinessForm.dataset.saving;
          arSettingsBusinessChanged();
        }
      });
    }

    function openStudioSettingsModal(focusSection) {
      syncStudioSettingsModal();
      const modal = document.getElementById('studioSettingsModal');
      if (!modal) return;
      arWatchEditSheet(modal);
      if (arSettingsBusinessForm && arSettingsBusinessForm.dataset.saving !== 'true') {
        arFillSettingsBusinessFields();
        document.getElementById('settingsBusinessStatus').textContent = '';
      }
      const endingHome = document.getElementById('settingsEndingFormHome');
      if (arEndingForm.parentElement !== endingHome) {
        arEndingTabDraft = { fields: arReadEndingInputs(), draft: { ...arEndingDraft, importing: false } };
        arEndingDraft = { ...arEndingTabDraft.draft };
        if (arEndingDraft.cardHide) arEndingDraft.cardHide = { ...arEndingDraft.cardHide };
        endingHome.append(arEndingForm);
        document.getElementById('arApplyEndingBtn').textContent = '엔딩 저장';
        arEndingStatus.textContent = '';
        arSyncEndingApplyButton();
      }
      modal.classList.remove('hidden');
      modal.firstElementChild.scrollTop = 0;
      document.getElementById('settingsBusinessDetails').open = false;
      if (focusSection === 'card') {
        const sec = document.getElementById('settingsCardSection');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function closeStudioSettingsModal() {
      const modal = document.getElementById('studioSettingsModal');
      const endingHome = document.getElementById('arEndingFormHome');
      if (arEndingForm.parentElement !== endingHome) {
        endingHome.append(arEndingForm);
        document.getElementById('arApplyEndingBtn').textContent = '엔딩 적용';
        const savedDraft = arEndingTabDraft;
        arEndingTabDraft = null;
        arFillEndingForm(savedDraft?.fields || getSelectedDealer(), savedDraft?.draft);
      }
      if (modal) modal.classList.add('hidden');
    }
    document.getElementById('settingsPlanActionBtn').addEventListener('click', () => {
      closeStudioSettingsModal();
      openBillingCheckoutModal();
    });

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
            cardHide: d.cardHide || {},
            endingFields: d._endingFields,
            avatar: d._customAvatar?.src || '',
            logo: d.logoImg?.src || ''
          })
        );
        const badge = document.getElementById('mobileSavedBadge');
        if (badge) {
          badge.textContent = `[${d.name} ${d.title}] 엔딩 정보가 이 기기에 자동 저장됨`;
        }
        return true;
      } catch (e) { return false; }
    }

    function loadSavedDealerProfile(d) {
      try {
        const saved = JSON.parse(localStorage.getItem('autoreels_my_dealer_profile_' + d.id));
        if (saved) {
          const explicit = {};
          for (const field of Object.values(AR_ENDING_INPUTS)) {
            if (typeof saved[field] !== 'string') continue;
            if (saved.endingFields ? Object.hasOwn(saved.endingFields, field) : saved[field] !== d[field]) {
              explicit[field] = saved[field];
            }
            d[field] = saved[field];
          }
          d._endingFields = explicit;
          if (saved.snsAccounts) d.snsAccounts = saved.snsAccounts;
          if (saved.cardHide && typeof saved.cardHide === 'object') d.cardHide = saved.cardHide;
        }
        // 예전 버전은 로고를 별도 키로 저장했습니다.
        const logo = saved?.logo ?? localStorage.getItem('autoreels_dealer_logo_' + d.id);
        if (logo?.startsWith('data:image/') && logo !== d.logoImg?.src) d.logoImg = arRestoreEndingImage(logo);
        if (saved?.logo === '') d.logoImg = null;
        const avatar = saved?.avatar;
        if (avatar?.startsWith('data:image/') && avatar !== d._customAvatar?.src) {
          d._customAvatar = d.avatarImg = arRestoreEndingImage(avatar);
        }
      } catch (e) {}
    }
    function arRestoreEndingImage(src) {
      const img = new Image();
      img.onload = () => window.__timelines?.main?.seek(window.__timelines.main.currentTime);
      img.src = src;
      return img;
    }
    function loadSavedDealerProfiles() {
      dealers.forEach(loadSavedDealerProfile);
    }

    const AR_ENDING_INPUTS = Object.freeze({
      dlrInputName: 'name', dlrInputTitle: 'title', dlrInputPhone: 'phone',
      dlrInputBranch: 'branch', dlrInputPromo: 'promoTag'
    });
    const arEndingForm = document.getElementById('arEndingForm');
    const arEndingStatus = document.getElementById('arEndingSaveStatus');
    let arEndingDraft = {};
    let arEndingTabDraft = null;
    let arEndingSavedInSheet = false;

    function arEndingTabActive() {
      return arEndingForm.parentElement.id === 'arEndingFormHome' &&
        !document.getElementById('studioPanel_card').classList.contains('hidden');
    }
    function arFillEndingForm(fields, draft = {}) {
      arEndingDraft = draft;
      for (const [id, key] of Object.entries(AR_ENDING_INPUTS)) document.getElementById(id).value = fields[key] ?? '';
      arEndingStatus.textContent = '';
      arSyncEndingApplyButton();
      arRenderCardShowToggles();
    }
    function arReadEndingInputs() {
      return Object.fromEntries(Object.entries(AR_ENDING_INPUTS).map(([id, key]) => [key, document.getElementById(id).value]));
    }
    function arSyncEndingApplyButton() {
      const dealer = getSelectedDealer();
      const fieldsChanged = Object.entries(arReadEndingInputs()).some(([key, value]) => value !== String(dealer[key] ?? ''));
      const draft = arEndingDraft;
      const visibilityChanged = draft.cardHide && AR_CARD_FIELDS.some(([key]) => arCardFieldShown(draft, key) !== arCardFieldShown(dealer, key));
      const changed = fieldsChanged || visibilityChanged || Boolean(draft.avatarImg) ||
        (Object.hasOwn(draft, 'logoImg') && Boolean(draft.logoImg || dealer.logoImg));
      document.getElementById('arApplyEndingBtn').disabled = !changed || Boolean(draft.importing);
      return changed;
    }
    function arEndingNarration() {
      return Array.from({ length: getTargetCutCount() + 1 }, (_, index) => AudioEngine.getCutNarration(index)).join('\n');
    }
    function arPauseForStudioEdit() {
      arPreviewPausedForEdit = true;
      arPendingPreviewPlay = null;
      if (isPlaying) togglePlayPause();
    }
    function arWaitForEditedPreview() {
      if (arPendingPreviewPlay) {
        arPendingPreviewPlay = null;
        arPreviewPausedForEdit = true;
        return true;
      }
      if (!arPreviewPausedForEdit) return false;
      if (arEndingTabActive()) updateCurrentDealerFromPreview();
      const pending = AudioEngine.scriptPending || (AudioEngine.ttsPrefetchTimer ? AudioEngine.prefetchTtsBuffers() : null);
      arPreviewPausedForEdit = false;
      if (!pending) return false;
      arPendingPreviewPlay = pending;
      const resume = () => {
        if (arPendingPreviewPlay !== pending) return;
        arPendingPreviewPlay = null;
        if (!isPlaying) togglePlayPause();
      };
      pending.then(resume, resume);
      return true;
    }
    function arRefreshEnding(prevNarration, contactCopyChanged = false) {
      const d = getSelectedDealer();
      if (prevNarration !== arEndingNarration()) arResetAndRebuildNarration(true);
      if (contactCopyChanged) {
        saveAiScriptPrefs();
        renderScriptVariantPicker();
      }
      document.getElementById('dlrCaptionTextarea').value = buildCaption(d);
      syncDrmAndSnsUI();
      renderQuickSelector();
      renderAdminDealerList();
      renderDealerVariationSummary();
      syncTechPanel();
      window.__timelines['main'].seek(window.__timelines['main'].currentTime);
    }
    function updateCurrentDealerFromPreview() {
      if (arEndingDraft.importing) return false;
      const dealer = getSelectedDealer();
      const changed = arSyncEndingApplyButton();
      const previousIdentity = arDealerContactIdentity(dealer);
      const prevNarration = arEndingNarration();
      if (changed) {
        const fields = arReadEndingInputs();
        const { avatarImg, logoImg, cardHide } = arEndingDraft;
        const editedFields = Object.entries(fields).filter(([key, value]) => value !== String(dealer[key] ?? ''));
        const updates = { ...fields, _endingFields: { ...dealer._endingFields, ...Object.fromEntries(editedFields) } };
        if (cardHide) updates.cardHide = cardHide;
        if (logoImg !== undefined) updates.logoImg = logoImg;
        if (avatarImg) Object.assign(updates, { avatarImg, _customAvatar: avatarImg });
        if (!saveDealerProfileToLocal({ ...dealer, ...updates })) {
          arEndingStatus.textContent = '이 기기에 엔딩 정보를 저장하지 못했어요.';
          return false;
        }
        if (avatarImg) arReleasePhoto(dealer._customAvatar);
        Object.assign(dealer, updates);
        arEndingTabDraft = null;
        arFillEndingForm(dealer);
        arEndingSavedInSheet = arEndingTabActive() && arWorkflowSheetExpanded();
        if (arEndingForm.parentElement.id === 'settingsEndingFormHome') arResumeAfterEditSheets = true;
        arEndingStatus.textContent = '저장했습니다.';
      }
      const copyChanged = arSyncEndingContactCopy(previousIdentity);
      if (changed || copyChanged) arRefreshEnding(prevNarration, copyChanged);
      return changed;
    }
    document.addEventListener('input', (event) => {
      const editor = event.target.closest('#studioPanel_topic, #studioPanel_script, #studioPanel_photo, #studioPanel_sound, #arEndingForm');
      if (!editor || !event.target.matches('input, textarea, select')) return;
      arPauseForStudioEdit();
      if (Object.hasOwn(AR_ENDING_INPUTS, event.target.id)) {
        arEndingStatus.textContent = '';
        arSyncEndingApplyButton();
      }
    }, true);
    arEndingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      updateCurrentDealerFromPreview();
    });

    const AR_CARD_FIELDS = [
      ['name', '이름'], ['title', '직함'], ['phone', '연락처'], ['branch', '매장명'],
      ['promoTag', '혜택 문구'], ['avatar', '프로필 사진'], ['logo', '로고']
    ];
    function arCardFieldShown(d, k) { return !d?.cardHide?.[k]; }
    function arRenderCardShowToggles() {
      const d = getSelectedDealer();
      const visibility = arEndingDraft.cardHide ? arEndingDraft : d;
      document.getElementById('cardShowToggles').innerHTML = AR_CARD_FIELDS
        .filter(([key]) => !(IND.key === 'auto' && key === 'phone'))
        .map(([key, label]) => `<label class="ig-switch-row"><span>${label}</span><input type="checkbox" data-ending-field="${key}" ${arCardFieldShown(visibility, key) ? 'checked' : ''} /><i></i></label>`).join('');
      const logo = Object.hasOwn(arEndingDraft, 'logoImg') ? arEndingDraft.logoImg : d.logoImg;
      const avatar = arEndingDraft.avatarImg || d._customAvatar;
      for (const [id, img] of [['dealerLogoPreview', logo], ['dealerAvatarPreview', avatar]]) {
        const preview = document.getElementById(id);
        preview.classList.toggle('hidden', !img);
        if (img) preview.src = img.src; else preview.removeAttribute('src');
      }
      document.getElementById('dealerLogoLabelText').textContent = logo ? '다른 로고로 바꾸기' : '가게·회사 로고 올리기';
      document.getElementById('dealerLogoClearBtn').classList.toggle('hidden', !logo);
    }
    function arSetEndingFieldVisibility(key, shown) {
      const hide = arEndingDraft.cardHide ||= { ...getSelectedDealer().cardHide };
      if (shown) delete hide[key]; else hide[key] = true;
    }
    async function arImportEndingImage(input, key) {
      const file = input.files[0];
      if (!file || arEndingDraft.importing) return;
      const draft = arEndingDraft;
      const options = { maxEdge: key === 'logo' ? 400 : 640, transparent: key === 'logo', dataUrl: true };
      arPauseForStudioEdit();
      draft.importing = true;
      input.value = '';
      arEndingStatus.textContent = '이미지를 불러오는 중…';
      arSyncEndingApplyButton();
      try {
        let image = await arImportPhoto(file, options);
        if (image.src.length > 420000) image = await arImportPhoto(file, { ...options, maxEdge: 256 });
        if (draft !== arEndingDraft) return;
        draft[key + 'Img'] = image;
        arSetEndingFieldVisibility(key, true);
        arRenderCardShowToggles();
        arEndingStatus.textContent = '';
      } catch (error) {
        if (draft === arEndingDraft) arEndingStatus.textContent = error.message;
      } finally {
        draft.importing = false;
        arSyncEndingApplyButton();
      }
    }
    arEndingForm.addEventListener('change', (event) => {
      const input = event.target;
      if (input.id === 'dealerFaceQuickInput') return arImportEndingImage(input, 'avatar');
      if (input.id === 'dealerLogoInput') return arImportEndingImage(input, 'logo');
      const key = input.dataset.endingField;
      if (!key) return;
      arSetEndingFieldVisibility(key, input.checked);
      arEndingStatus.textContent = '';
      arSyncEndingApplyButton();
    });
    document.getElementById('dealerLogoClearBtn').addEventListener('click', () => {
      if (arEndingDraft.importing) return;
      arPauseForStudioEdit();
      arEndingDraft.logoImg = null;
      arEndingStatus.textContent = '';
      arSyncEndingApplyButton();
      arRenderCardShowToggles();
    });

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
      const mainDur = getMainDuration();
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
      window.__timelines.main.seek(window.__timelines.main.currentTime);
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
          if (statusEl) statusEl.textContent = '현재 상태: AutoReelsMaker 기본 클라우드 LLM 엔진 활성';
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
    function arExplicitBmwName(text) {
      if (!/\bbmw\b|비엠더블유/i.test(text)) return '';
      const series = /(?<!\d)7\s*시리즈/.test(text) ? '7시리즈' : '';
      const model = text.match(/\b(?:x[135]\s*(?:xdrive\s*)?\d{2}e|[357]\d{2}e|xm)\b/i)?.[0];
      const hybrid = /하이브리드|플러그인|\bhybrid\b|\bphev\b/i.test(text);
      if (!series && !hybrid) return '';
      return ['BMW', model || series, hybrid ? '하이브리드' : ''].filter(Boolean).join(' ');
    }

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
      const explicitBmw = arExplicitBmwName(text);
      if (explicitBmw) matchedCar = { vehicle: explicitBmw, discountNum: 0, discount: '상담 시 조건 안내' };
      const ageMatch = text.match(/(20대|30대|40대|50대|60대)\s*(여성|여자|남성|남자|주부|직장인| 워킹맘|대표님|사장님|부부)?/);
      const targetPersona = ageMatch ? ageMatch[0].trim() : text.includes('여성') ? '여성 오너 맞춤' : '';
      const cleanedForStock = text.replace(/(20|30|40|50|60)\s*대\s*(여성|여자|남성|남자|주부|직장인|워킹맘|초반|중반|후반)?/g, '');
      const stockMatch = cleanedForStock.match(/(?:재고|선점|물량|한정|딱)\s*(\d{1,2})\s*대|([1-9])\s*대\s*(?:남음|한정|즉시|출고)/);
      const stockNum = stockMatch ? (stockMatch[1] || stockMatch[2]) : '3';
      return { matchedCar, targetPersona, stockNum };
    }

    let arScriptGenerationId = 0;
    function arSuspendScriptNarration() {
      window.__arScriptGenerating = true;
      if (typeof AudioEngine === 'undefined') return;
      AudioEngine.stopTts();
      AudioEngine.masterWantKey = '';
      AudioEngine.masterKey = '';
      AudioEngine.masterBuffer = null;
      AudioEngine.masterCutBounds = null;
      AudioEngine.masterDuration = 0;
      AudioEngine.lastSpokenCut = -1;
      AudioEngine.scriptPending = null;
      if (AudioEngine.ttsPrefetchTimer) clearTimeout(AudioEngine.ttsPrefetchTimer);
      AudioEngine.ttsPrefetchTimer = null;
    }
    function arSetScriptGenerating(loading) {
      if (loading) arSuspendScriptNarration();
      else window.__arScriptGenerating = false;
      const panel = document.getElementById('studioPanel_script');
      if (panel) panel.setAttribute('aria-busy', loading ? 'true' : 'false');
      const status = document.getElementById('scriptGeneratingStatus');
      if (status) status.classList.toggle('hidden', !loading);
      ['scriptResultsPanel', 'scriptRewritePanel', 'scriptCutsPanel'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('hidden', loading);
      });
    }

    async function generateStoryboardFromPrompt({ useCurrentProduct = false } = {}) {
      if (!arRequireAiAccess()) return;
      arPauseForStudioEdit();
      const generationId = ++arScriptGenerationId;
      const activity = arBeginGeneration('script', '대본 만드는 중…');
      let progressError = '';
      arSetScriptGenerating(true);
      const promptEl = document.getElementById('aiPromptInput');
      const excludeEl = document.getElementById('aiExcludeInput');
      const btnEl = document.getElementById('aiGenBtn');
      const noticeEl = document.getElementById('aiGenNotice');
      const rwBar = document.getElementById('scriptDurRewriteBar');
      if (rwBar) rwBar.classList.add('hidden');
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
      let aiUsedFallback = false;

      // 사용자 클릭 제스처 시점에 오디오/TTS 엔진을 즉시 활성화하여 음성이 100% 나오도록 보장
      if (!AudioEngine.enabled) {
        toggleAudioMaster(true);
      } else {
        AudioEngine.ensureContext();
      }

      const industryAtRequest = IND.key;
      const specialtyAtRequest = arIndustrySpecialty();
      const personal = industryAtRequest === 'personal';
      const vehicleLocked = !personal && (useCurrentProduct || arHasEnteredVehicle());
      const productAtRequest = arProductKey();
      const staleProduct = () => industryAtRequest !== IND.key || specialtyAtRequest !== arIndustrySpecialty() ||
        (productAtRequest !== arProductKey() && (vehicleLocked || arHasEnteredVehicle()));
      // 직접 입력한 차종이 없을 때 주제에서 차종을 찾습니다.
      const parsedLocal = IND.key === 'auto' && !vehicleLocked ? parsePromptVehicleAndTargetClient(raw) : {};
      if (!vehicleLocked) campaign.vehicleEntered = false;
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

      const triggerTopicImages = () => {
        // 고객 클릭마다 유료 이미지 API가 자동 과금되지 않도록, 사전 제작 이미지(/assets/scenes, /assets/topics)를 0원으로 매칭하고
        // 필요 시 사진 단계의 맞춤 이미지 생성 버튼에서 직접 생성
        if (!campaign.isUserCustomPhotos && typeof arMatchPhotosToCaptions === 'function') {
          try { arMatchPhotosToCaptions(); } catch (e) {}
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
            vehicleLocked,
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
            specialty: arIndustrySpecialty(),
            industryInfo: IND.key === 'auto' ? null : { name: IND.name, role: IND.role, product: IND.product, cta: IND.cta, aiRole: IND.aiRole, caution: IND.caution, place: IND.place },
            adminOpenAiKey,
            adminGeminiKey
          })
        });

        const result = await response.json();
        if (generationId !== arScriptGenerationId || staleProduct()) return;
        if (response.status === 401 && result.error === 'login_required') {
          noticeEl?.classList.add('hidden');
          openDealerAuthModal('generation');
          return;
        }
        if (['trial_expired', 'quota_exceeded', 'service_budget_exceeded'].includes(result.error)) {
          progressError = result.message || '대본 생성 한도에 도달했습니다.';
          if (noticeEl) noticeEl.textContent = result.message;
          return;
        }
        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.error || 'AI 서버 응답 오류');
        }

        // 대본 3안 저장 (예전 서버 응답이면 data 1개만)
        const variants = Array.isArray(result.variants) && result.variants.length ? result.variants : [result.data];
        arScriptVariants.list = variants;
        arScriptVariants.index = 0;
        arScriptVariants.strip = stripExcludedLocal;
        arScriptVariants.keepProduct = vehicleLocked;
        applyAiScriptToCampaign(variants[0], d, stripExcludedLocal, vehicleLocked);
        renderScriptVariantPicker();
        aiUsedFallback = Boolean(result.aiFallback);
        if (aiUsedFallback) progressError = 'AI 대본을 만들지 못해 기본 대본을 표시합니다.';
        triggerTopicImages(variants[0]?.cutCaptions);
      } catch (err) {
        if (generationId !== arScriptGenerationId || staleProduct()) return;
        progressError = 'AI 대본을 만들지 못해 기본 대본을 표시합니다.';
        arScriptVariants.list = [];
        renderScriptVariantPicker();
        if (IND.key !== 'auto') {
          const tp = window.arTodayTopic;
          const topicTitle = vehicleLocked ? campaign.vehicle : (tp && tp.title) ? String(tp.title).trim() : (raw ? raw.slice(0, 24) : personal ? '오늘의 기록' : '');
          if (topicTitle) {
            const topicWhy = (tp && tp.why) ? String(tp.why).trim() : '';
            const shortRaw = (raw || topicTitle).replace(/[.!?]+$/, '').trim();
            const c1 = topicTitle;
            const c2 = topicWhy ? topicWhy.slice(0, 26) : `${shortRaw.slice(0, 22)} 포인트`;
            const c3 = vehicleLocked ? (campaign.discount || '자세한 조건은 문의해 주세요.') : `${IND.name} 1:1 진행으로 깔끔하게`;
            const c4 = `${IND.cta || '상담 문의'} 바로 받아보세요`;
            const baseCaps = personal ? [topicTitle, '하루를 시작하며', '기억에 남은 장면', '오늘 느낀 점'] : [c1, c2, c3, c4];
            const baseTts = personal ? baseCaps : [
              `${topicTitle}, 고민되시죠?`,
              topicWhy ? `${topicWhy}.` : `${shortRaw}, 핵심만 짚어드릴게요.`,
              vehicleLocked ? c3 : `${IND.name}에서 딱 맞게 정리해 드립니다.`,
              `지금 편하게 ${IND.cta || '문의'} 남겨보세요.`
            ];
            const offlineAi = {
              vehicle: topicTitle,
              hook: topicTitle,
              discount: personal ? '' : campaign.discount || (IND.cta || ''),
              cutCaptions: Array.from({ length: totalCuts }, (_, i) => baseCaps[i % baseCaps.length]),
              ttsLines: Array.from({ length: totalCuts }, (_, i) => baseTts[i % baseTts.length])
            };
            applyAiScriptToCampaign(offlineAi, d, stripExcludedLocal, vehicleLocked);
            arSetScriptGenerating(false);
            arFinishScriptApply(totalCuts);
            if (noticeEl) noticeEl.textContent = `AI 대본을 만들지 못해 주제 [${topicTitle}]의 기본 대본을 표시합니다. 다시 쓰기로 재시도할 수 있어요.`;
            triggerTopicImages(campaign.cutCaptions);
            return;
          } else {
            if (campaign.presetKey && (AR_INDUSTRY_PRESETS[IND.key] || {})[campaign.presetKey]) applyIndustryPreset(campaign.presetKey);
            if (noticeEl) noticeEl.textContent = `AI 대본을 만들지 못해 기본 대본으로 채웠습니다. (${err.message || '연결 오류'})`;
            triggerTopicImages(campaign.cutCaptions);
            return;
          }
        }
        arFillAutoScriptOffline(parsedLocal, d);
        triggerTopicImages(campaign.cutCaptions);
      } finally {
        if (progressError) activity.fail(progressError);
        else activity.end();
        if (generationId === arScriptGenerationId) arSetScriptGenerating(false);
        if (btnEl && generationId === arScriptGenerationId) {
          btnEl.disabled = false;
          btnEl.textContent = '다시 쓰기';
        }
      }

      arFinishScriptApply(totalCuts);
      if (aiUsedFallback && noticeEl) noticeEl.textContent = 'AI 대본을 만들지 못해 기본 대본을 표시합니다. 다시 시도해 주세요.';
    }

    function arBuildThemeContextForImages() {
      const ds = typeof getActiveDesign === 'function' ? getActiveDesign() : null;
      const pal = typeof getActivePalette === 'function' ? getActivePalette() : null;
      const dirTheme = (typeof DIRECTOR_THEMES !== 'undefined' && campaign && campaign.themeId) ? DIRECTOR_THEMES[campaign.themeId] : null;
      return {
        designName: ds ? (ds.name || ds.label || ds.id || '') : '',
        designCat: ds ? (ds.cat || '') : '',
        designBg: ds ? (ds.bg || '') : '',
        designGrade: ds ? (ds.grade || '') : '',
        designLayout: ds ? (ds.layout || '') : '',
        accentColor: (pal && pal.accent) || (ds && ds.accent) || (dirTheme && dirTheme.accent) || '',
        themeName: dirTheme ? (dirTheme.name || dirTheme.label || '') : ''
      };
    }

    // 이 PC의 로컬 생성 모드. 다른 사용자에게 유료/로컬 설정을 강제로 바꾸지 않습니다.
    function arUseLocalSceneImages() {
      try {
        const requested = new URLSearchParams(location.search).get('localImages');
        if (requested === '1' || requested === '0') localStorage.setItem('autoreels_scene_image_provider', requested === '1' ? 'local' : 'gemini');
        return localStorage.getItem('autoreels_scene_image_provider') === 'local';
      } catch (_) { return false; }
    }

    // 업종 진입이 URL을 정리하기 전에 이 브라우저의 로컬 선택을 기억합니다.
    arUseLocalSceneImages();

    function arSceneImageContextKey() {
      return JSON.stringify([IND.key, window.arTodayTopic?.title || '', document.getElementById('aiPromptInput')?.value, campaign.vehicle, campaign.cutCaptions,
        campaign.designStyle, campaign.themeId, typeof getTargetCutCount === 'function' ? getTargetCutCount() : 4]);
    }

    function arScenePromptWithVehicle(prompt, payload) {
      return payload.industry === 'auto' && payload.vehicle
        ? `Main subject and vehicle identity: ${payload.vehicle}. Depict this vehicle, no substitute makes or models. ${prompt}`
        : prompt;
    }

    async function arLocalSceneRequest(path, payload, timeoutMs) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch('http://127.0.0.1:8193' + path, {
          method: payload ? 'POST' : 'GET', signal: controller.signal,
          ...(payload ? { headers: { 'Content-Type': 'application/json', 'X-AutoReels-Local': '1' }, body: JSON.stringify(payload) } : {})
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || '이미지 생성기가 아직 준비되지 않았어요. 생성기를 실행한 뒤 다시 눌러 주세요.');
        return data;
      } catch (error) {
        if (error.name === 'AbortError') throw new Error('이미지 생성 응답 시간이 초과됐어요. 진행 중인 작업이 끝난 뒤 다시 눌러 주세요.');
        if (error instanceof TypeError) throw new Error('이미지 생성기에 연결할 수 없어요. 생성기를 실행하고 브라우저 연결 권한을 확인해 주세요.');
        throw error;
      } finally { clearTimeout(timer); }
    }

    async function arApplyLocalSceneImages(payload, applySlotImage, stillCurrent, noticeEl) {
      const activity = arBeginGeneration('images', '컷 이미지 준비 중…');
      let progressError = '';
      let completed = 0;
      const update = (message) => {
        if (!stillCurrent()) return;
        if (noticeEl) { noticeEl.classList.remove('hidden'); noticeEl.textContent = message; }
        activity.update(message);
      };
      try {
        update('✨ 이미지 생성 준비 중...');
        const health = await arLocalSceneRequest('/health', null, 12000);
        if (health.service !== 'autoreels-local-images') throw new Error('이미지 생성기 연결을 확인해 주세요.');
        if (!stillCurrent()) return;
        update('✨ 주제에 맞는 장면 준비 중...');
        // 비밀키는 로컬 연결 서버에도 보내지 않습니다.
        const { adminGeminiKey, ...scenePayload } = payload;
        const total = Math.max(1, Math.min(10, Number(payload.totalCuts) || Number(payload.count) || 4));
        scenePayload.count = total;
        const planned = await arLocalSceneRequest('/scene', { ...scenePayload, mode: 'scene-prompts' }, 250000);
        if (!stillCurrent()) return;
        const prompts = Array.isArray(planned.prompts) ? planned.prompts : [];
        if (prompts.length !== total) throw new Error(`${total}컷에 맞는 장면 설명을 모두 만들지 못했어요. 다시 눌러 주세요.`);
        for (let index = 0; index < prompts.length; index++) {
          if (!stillCurrent()) return;
          update(`✨ 맞춤 이미지 ${index + 1}/${prompts.length} 생성 중...`);
          const result = await arLocalSceneRequest('/scene', { mode: 'scene-image', imagePrompt: arScenePromptWithVehicle(prompts[index], payload), index }, 250000);
          if (!stillCurrent()) return;
          if (!result.image?.dataUrl?.startsWith('data:image/')) throw new Error('이미지를 받지 못했어요.');
          const compact = await arDownscaleSceneDataUrl(result.image.dataUrl);
          if (!stillCurrent()) return;
          const applied = await new Promise(resolve => applySlotImage(index, compact, resolve));
          if (!stillCurrent()) return;
          if (!applied) throw new Error('생성된 이미지를 컷에 넣지 못했어요.');
          completed++;
        }
        if (stillCurrent()) {
          campaign.uploadedPhotos = campaign.uploadedPhotos.slice(0, total);
          if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
          if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
          if (noticeEl) noticeEl.textContent = `주제 [${payload.prompt}] · 이미지 ${completed}장이 각 컷에 적용되었습니다.`;
          if (typeof arToast === 'function') arToast(`이미지 ${completed}장이 각 컷에 적용됐어요`);
        }
      } catch (error) {
        if (!stillCurrent()) return;
        const message = `${completed ? completed + '장 적용 후 중단: ' : ''}${error.message || '이미지 생성에 실패했어요.'}`;
        progressError = message;
        if (noticeEl) { noticeEl.classList.remove('hidden'); noticeEl.textContent = message; }
        if (typeof arToast === 'function') arToast(message);
      } finally {
        if (progressError && stillCurrent()) activity.fail(progressError);
        else activity.end();
      }
    }

    function arRegenerateThemeImages() {
      if (!arUseLocalSceneImages() && !arRequireAiAccess()) return;
      arPauseForStudioEdit();
      const totalCuts = typeof getTargetCutCount === 'function' ? getTargetCutCount() : 4;
      const promptEl = document.getElementById('aiPromptInput');
      const rawPrompt = (promptEl && promptEl.value || '').trim();
      const selectedTopic = window.arTodayTopic;
      const tp = !rawPrompt || selectedTopic?.prompt === rawPrompt ? selectedTopic : null;
      const matchedBmw = IND.key === 'auto' && !arHasEnteredVehicle() ? arExplicitBmwName(rawPrompt) : '';
      const vehicle = matchedBmw || campaign.vehicle;
      const topicText = matchedBmw || tp?.title || rawPrompt || vehicle || IND.name;
      const imageContext = arSceneImageContextKey();
      campaign.isUserCustomPhotos = false;
      const btn = document.getElementById('regenTopicImgBtn');
      const idleLabel = btn?.textContent;
      const th = arBuildThemeContextForImages();
      if (btn) { btn.disabled = true; btn.textContent = '생성 중…'; }
      if (typeof arToast === 'function') arToast(`[${topicText}] · [${th.designName || '기본'} / ${th.themeName || '테마'}] 맞춤 이미지를 만들고 있어요`);
      return Promise.resolve(arApplyTopicSceneImages({
        prompt: rawPrompt || topicText,
        subjectLabel: topicText,
        vehicle,
        topic: tp || null,
        industry: IND.key,
        industryInfo: IND.key === 'auto' ? null : { name: IND.name },
        themeInfo: th,
        captions: Array.isArray(campaign.cutCaptions) ? campaign.cutCaptions : [],
        count: arUseLocalSceneImages() ? totalCuts : Math.min(4, totalCuts),
        totalCuts,
        adminGeminiKey: localStorage.getItem('autoreels_admin_gemini_key') || ''
      })).finally(() => {
        if (btn) { btn.disabled = false; btn.textContent = idleLabel; }
        if (imageContext !== arSceneImageContextKey()) {
          const notice = document.getElementById('sceneImageNotice');
          notice.textContent = '주제나 대본이 바뀌어 이전 이미지 생성 결과의 적용을 중단했어요.';
        }
      });
    }
    if (typeof window !== 'undefined') window.arRegenerateThemeImages = arRegenerateThemeImages;

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
      const noticeEl = document.getElementById('sceneImageNotice');
      const label = payload.subjectLabel || payload.prompt;
      const localContext = arSceneImageContextKey();
      const stillCurrent = () => genId === arApplyTopicSceneImages._seq && !campaign.isUserCustomPhotos && localContext === arSceneImageContextKey();
      const applySlotImage = (slot, dataUrl, doneCb) => {
        const img = new Image();
        img._dataUrl = dataUrl;
        img._label = `${slot + 1}. ${label}`;
        img._sceneTitle = label;
        img.onload = () => {
          if (!stillCurrent()) { if (doneCb) doneCb(false); return; }
          if (!Array.isArray(campaign.uploadedPhotos)) campaign.uploadedPhotos = [];
          if (!Array.isArray(campaign.scenePlan)) campaign.scenePlan = [];
          arReleasePhoto(campaign.uploadedPhotos[slot]);
          campaign.uploadedPhotos[slot] = img;
          if (!campaign.scenePlan[slot]) campaign.scenePlan[slot] = {};
          campaign.scenePlan[slot].photoIdx = slot;
          if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
          if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
          if (typeof renderCutEditorPanel === 'function') renderCutEditorPanel();
          if (typeof renderInlineQuickEditBar === 'function') renderInlineQuickEditBar();
          if (window.__timelines?.main) window.__timelines.main.seek(window.__timelines.main.currentTime);
          if (doneCb) doneCb(true);
        };
        img.onerror = () => { if (doneCb) doneCb(false); };
        img.src = dataUrl;
      };

      if (arUseLocalSceneImages()) return arApplyLocalSceneImages(payload, applySlotImage, stillCurrent, noticeEl);

      const activity = arBeginGeneration('images', '컷 이미지 만드는 중…');
      let progressError = '';
      try {
        if (noticeEl) {
          noticeEl.classList.remove('hidden');
          noticeEl.textContent = `[${label}]에 맞는 이미지를 만드는 중이에요.`;
        }
        const promptRes = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'scene-prompts', ...payload })
        });
        const pj = await promptRes.json().catch(() => ({}));
        if (!stillCurrent()) return;
        const prompts = Array.isArray(pj.prompts) ? pj.prompts : [];
        if (!promptRes.ok || !pj.ok || !prompts.length) {
          progressError = pj.message || '컷 이미지를 만들지 못했습니다.';
          if (noticeEl) {
            const reason = pj.error === 'quota_exceeded'
              ? '계정의 AI 생성 한도에 도달했어요. 내 계정에서 사용량을 확인해 주세요.'
              : pj.message || `[${label}]의 이미지 설명을 만들지 못했어요.`;
            noticeEl.textContent = `0/${payload.totalCuts}컷 교체 · 기존 사진을 유지했어요. ${reason}`;
          }
          return;
        }

        const totalCutsTarget = Math.max(prompts.length, Math.min(10, Number(payload.totalCuts) || prompts.length));
        let readyCount = 0;
        let failedCount = 0;
        let firstError = '';
        await Promise.all(prompts.map(async (imagePrompt, idx) => {
          if (!stillCurrent()) return;
          try {
            const imgRes = await fetch('/api/generate-script', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: 'scene-image', imagePrompt: arScenePromptWithVehicle(imagePrompt, payload), index: idx })
            });
            const ij = await imgRes.json().catch(() => ({}));
            if (!stillCurrent()) return;
            if (!imgRes.ok || !ij.ok || !ij.image || !ij.image.dataUrl) { failedCount += 1; firstError = firstError || ij.message || ij.error || 'kie_image_failed'; return; }
            const compactUrl = await arDownscaleSceneDataUrl(ij.image.dataUrl);
            if (!stillCurrent()) return;
            const applied = [];
            for (let slot = idx; slot < totalCutsTarget; slot += prompts.length) {
              applied.push(new Promise(resolve => applySlotImage(slot, compactUrl, resolve)));
            }
            const results = await Promise.all(applied);
            readyCount += results.filter(Boolean).length;
            activity.update(`컷 이미지 적용 중 · ${readyCount}/${totalCutsTarget}`);
            if (results.includes(false)) { failedCount += 1; firstError ||= 'kie_image_download_failed'; }
          } catch (e) { failedCount += 1; firstError = firstError || 'kie_image_failed'; }
        }));
        if (!stillCurrent()) return;
        if (readyCount === totalCutsTarget) {
          const replaced = campaign.uploadedPhotos.splice(totalCutsTarget);
          replaced.forEach(arReleasePhoto);
          renderPhotoThumbnailsGrid();
          renderDynamicCutCardsUI();
          if (noticeEl) noticeEl.textContent = `[${label}] 이미지 ${prompts.length}장으로 ${readyCount}컷을 교체했어요.`;
        } else if (failedCount && noticeEl) {
          progressError = `이미지 ${readyCount}/${totalCutsTarget}컷 적용 · 사진 단계에서 확인해 주세요.`;
          const messages = { missing_kie_key: 'KIE API 키가 설정되지 않았습니다.', kie_insufficient_credits: 'KIE 크레딧이 부족합니다.', kie_invalid_key: 'KIE API 키를 확인해 주세요.', kie_rate_limited: '요청이 많습니다. 잠시 후 다시 시도해 주세요.', kie_image_timeout: '이미지 생성이 지연되고 있습니다. 잠시 후 확인해 주세요.', kie_image_download_failed: '생성된 이미지를 받지 못했습니다.', kie_image_failed: 'KIE 이미지 생성에 실패했습니다.' };
          noticeEl.textContent = `${readyCount}/${totalCutsTarget}컷 교체 · 나머지 컷은 기존 사진을 유지했어요. ${messages[firstError] || firstError}`;
        }
      } catch (e) {
        if (noticeEl && stillCurrent()) noticeEl.textContent = '이미지 생성기에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.';
        progressError = '이미지 생성기에 연결하지 못했습니다.';
      } finally {
        if (progressError && stillCurrent()) activity.fail(progressError);
        else activity.end();
      }
    }
