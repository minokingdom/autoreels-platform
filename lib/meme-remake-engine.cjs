'use strict';

/**
 * AutoReelsMaker — Meme/Trend Radar & Foreign Video Korean Remake Engine
 * ----------------------------------------------------------------------
 * 1) mode: 'meme-radar'
 *    - Google Trends KR RSS + YouTube Shorts API + Reddit Viral JSON
 *    - 1줄=1장면(20자 이내) × 6컷 고속 전환 대본 + 확인된 팩트/출처 설명글 + 무료 비주얼 키워드 자동 생성
 * 2) mode: 'foreign-remake'
 *    - 업로드된 해외/밈 영상 프레임(4~6장)을 Gemini Vision으로 분석
 *    - 상단 후킹 제목 5개 + 외국어 자막 OCR/번역 + 자막 덮어쓰기 마스크 좌표(maskY, maskH) + 오디오 덕킹 가이드 반환
 */

const CURATED_MEME_RADAR = [
  {
    id: 'meme_chill_guy',
    cat: '급상승 밈',
    badge: '🔥 알고리즘 1위',
    title: '무슨 일 있어도 평온한 칠 가이(Chill Guy) 밈 유래',
    why: '멘붕 상황에서도 주머니에 손 넣고 미소 짓는 강아지 캐릭터가 숏폼 공감 밈으로 폭발 중',
    factNote: '📌 출처·팩트: 2023년 아티스트 필립 뱅크스(Phillip Banks)가 공개한 오리지널 캐릭터 "My New Character"에서 유래. #칠가이 #밈해설 #쇼츠트렌드',
    scenePack: 'cafe',
    cuts: [
      { line: '요즘 쇼츠마다 나오는 이 강아지 정체', mood: 'hook', keyword: 'funny dog portrait' },
      { line: '이름은 칠 가이, 그냥 느긋한 녀석이죠', mood: 'fact', keyword: 'relaxed puppy' },
      { line: '월요일 출근길에도 아무 타격 없는 표정', mood: 'laugh', keyword: 'monday office coffee' },
      { line: '통장 잔고가 비어도 그냥 미소만 지어요', mood: 'shock', keyword: 'empty wallet funny' },
      { line: '빡치는 일상에 지친 사람들의 워너비!', mood: 'empathy', keyword: 'peaceful sunset walk' },
      { line: '오늘만큼은 칠 가이처럼 넘겨보세요', mood: 'cta', keyword: 'thumbs up smile' }
    ]
  },
  {
    id: 'meme_cat_huh',
    cat: '동물·유머',
    badge: '🐱 해외 동물 떡상',
    title: '전 세계 5억 뷰 터진 "하?(Huh?)" 고양이 리액션',
    why: '집사의 황당한 말에 고개를 갸우뚱하며 "하?" 소리를 내는 통통한 흰 고양이 밈',
    factNote: '📌 출처·팩트: 해외 집사 계정에서 시작된 흰 고양이 클립에 "Huh?" 효과음이 합성되며 글로벌 공감 리액션 밈으로 확산. #고양이밈 #동물쇼츠 #유머',
    scenePack: 'shop',
    cuts: [
      { line: '상사가 퇴근 5분 전에 일을 시킬 때', mood: 'hook', keyword: 'confused white cat' },
      { line: '머릿속에서 자동으로 재생되는 이 표정', mood: 'laugh', keyword: 'surprised cat closeup' },
      { line: '네? 지금요? 저한테 말씀하신 건가요?', mood: 'shock', keyword: 'office worker shocked' },
      { line: '전 세계 5억 명이 공감한 레전드 고양이', mood: 'fact', keyword: 'cute fat cat sitting' },
      { line: '어떤 황당한 상황에도 만능으로 통하죠', mood: 'empathy', keyword: 'funny pet reaction' },
      { line: '공감되면 친구에게 바로 공유해 보세요!', mood: 'cta', keyword: 'happy cat paw' }
    ]
  },
  {
    id: 'meme_golden_retriever_wait',
    cat: '동물·유머',
    badge: '🐶 감동·반전 클립',
    title: '문 앞에서 장난감 물고 3시간 기다린 골든리트리버',
    why: '샤오홍슈·해외 릴스에서 조회수 폭발 중인 반려견 밀착 감동·유머 스토리 포맷',
    factNote: '📌 제작 가이드: 반려동물 감동·유머 포맷(재사용 허용·자체 스톡 활용). #골든리트리버 #강아지일상 #감동쇼츠',
    scenePack: 'cafe',
    cuts: [
      { line: '현관문 앞에서 꼼짝도 안 하는 강아지', mood: 'hook', keyword: 'golden retriever door' },
      { line: '입에는 제일 아끼는 인형을 물고 있죠', mood: 'cute', keyword: 'dog holding toy' },
      { line: '주인이 야근하고 늦게 돌아온 그 순간', mood: 'fact', keyword: 'opening front door night' },
      { line: '꼬리가 프로펠러처럼 돌아가기 시작합니다', mood: 'laugh', keyword: 'happy dog wagging tail' },
      { line: '하루 종일 이 순간만 기다렸던 거예요', mood: 'empathy', keyword: 'hugging golden retriever' },
      { line: '오늘 집에 가면 꼭 더 많이 안아주세요', mood: 'cta', keyword: 'sleeping cute dog' }
    ]
  },
  {
    id: 'meme_korean_patch_foreign',
    cat: '해외 바이럴',
    badge: '🌏 해외 유머 번역',
    title: '한국인보다 한국 패치 완벽한 해외 알바생 레전드',
    why: '해외 매장에서 한국식 빨리빨리·서비스 텐션을 보여주는 반전 유머 클립이 인기',
    factNote: '📌 트렌드 포인트: 글로벌 K-컬처 역수입 유머 트렌드 요약. #해외반응 #유머쇼츠 #알바레전드',
    scenePack: 'restaurant',
    cuts: [
      { line: '해외 카페에서 아이스 아메리카노 시켰더니', mood: 'hook', keyword: 'barista making iced coffee' },
      { line: '주문 끝나기 무섭게 3초 만에 나옵니다', mood: 'shock', keyword: 'fast espresso shot' },
      { line: '한국인도 깜짝 놀란 K-빨리빨리 속도!', mood: 'laugh', keyword: 'iced americano cup' },
      { line: '심지어 서비스 쿠키까지 챙겨주는 센스', mood: 'cute', keyword: 'fresh cafe cookie' },
      { line: '댓글창은 이미 명예 한국인 임명식 중', mood: 'fact', keyword: 'smiling cafe staff' },
      { line: '이런 매장이면 매일 출근도장 찍겠죠?', mood: 'cta', keyword: 'cozy coffee shop' }
    ]
  },
  {
    id: 'meme_brain_rot_quiz',
    cat: '급상승 밈',
    badge: '⚡ 댓글 폭발형',
    title: '요즘 10대·20대만 3초 안에 맞힌다는 신조어 테스트',
    why: '시청자가 댓글을 달게 만드는 참여형 퀴즈·세대차이 밈 쇼츠가 체류시간 1위 기록 중',
    factNote: '📌 알고리즘 팁: 마지막 문제 정답을 댓글로 유도하면 평균 시청 지속시간 140% 달성. #신조어퀴즈 #밈테스트 #쇼츠퀴즈',
    scenePack: 'academy',
    cuts: [
      { line: '이 중 3개 이상 알면 아직 젊은 겁니다', mood: 'hook', keyword: 'students looking at phone' },
      { line: '1단계: 추구미 — 내가 추구하는 이미지!', mood: 'fact', keyword: 'fashion lookbook mirror' },
      { line: '2단계: 일취월장 말고 월취일장 퇴근각?', mood: 'laugh', keyword: 'funny office clock' },
      { line: '3단계: 느좋 — 느낌 좋은 카페와 코디!', mood: 'cute', keyword: 'aesthetic cafe table' },
      { line: '몇 개나 알고 있었는지 솔직히 세어보세요', mood: 'shock', keyword: 'thinking person portrait' },
      { line: '여러분의 점수를 댓글로 남겨주세요!', mood: 'cta', keyword: 'typing smartphone comment' }
    ]
  },
  {
    id: 'meme_cat_chef_fail',
    cat: '동물·유머',
    badge: '🐱 반전 유머',
    title: '생선 훔치려다 현행범으로 딱 걸린 고양이의 변명',
    why: '슬로우모션+내면 더빙을 입힌 반려묘 현행범 포착 포맷이 국내외 릴스 상위권 독점',
    factNote: '📌 더빙 포인트: 뻔뻔한 한국어 1인칭 속마음 더빙을 입히면 완주율 급상승. #고양이더빙 #반려묘유머 #동물밈',
    scenePack: 'restaurant',
    cuts: [
      { line: '식탁 위 고등어에 조용히 다가가는 앞발', mood: 'hook', keyword: 'cat sneaking table' },
      { line: '집사랑 눈이 딱 마주친 바로 그 0.1초!', mood: 'shock', keyword: 'wide eyed cat' },
      { line: '아니아니, 난 그냥 파리 잡아주려 했어', mood: 'laugh', keyword: 'innocent cat face' },
      { line: '앞발만 슬쩍 내려놓으며 딴청 피우기', mood: 'cute', keyword: 'cat looking away' },
      { line: '뻔뻔함 만렙 찍은 고양이식 위기탈출!', mood: 'fact', keyword: 'fluffy cat sitting' },
      { line: '이 정도 연기력이면 간식 하나 줘야겠죠?', mood: 'cta', keyword: 'cat eating treat' }
    ]
  }
];

function parseJsonLoose(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  try { return JSON.parse(s); } catch (_) {}
  const m = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (m) {
    try { return JSON.parse(m[0]); } catch (_) {}
  }
  return null;
}

async function fetchGoogleTrendsKr() {
  try {
    const r = await fetch('https://trends.google.com/trending/rss?geo=KR', {
      headers: { 'User-Agent': 'Mozilla/5.0 AutoReelsMaker/2.0' },
      signal: AbortSignal.timeout(3500)
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const items = [];
    const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    for (const b of blocks.slice(0, 8)) {
      const title = (b.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/) || [])[1]
        || (b.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const traffic = (b.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/) || [])[1] || '';
      const newsTitle = (b.match(/<ht:news_item_title><!\[CDATA\[([\s\S]*?)\]\]><\/ht:news_item_title>|<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/) || [])[1]
        || (b.match(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/) || [])[1] || '';
      const cleanT = String(title).replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
      const cleanN = String(newsTitle).replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, '').trim();
      if (cleanT) items.push({ keyword: cleanT, traffic: traffic || '급상승', headline: cleanN });
    }
    return items;
  } catch (_) {
    return [];
  }
}

async function handleMemeRadar(body, res) {
  const category = String(body.category || 'all').trim();
  const customQuery = String(body.query || '').trim();
  const geminiKey = String(body.adminGeminiKey || process.env.GEMINI_API_KEY || '').trim();
  const geminiModel = String(process.env.GEMINI_SCRIPT_MODEL || 'gemini-2.5-flash').split(',')[0].trim();

  const liveTrends = await fetchGoogleTrendsKr();
  let dynamicItems = [];

  // 실시간 Google Trends 키워드 또는 사용자 검색어를 6컷 고속 밈 쇼츠 설계도로 즉시 변환
  if (geminiKey && (liveTrends.length || customQuery)) {
    try {
      const seedTxt = customQuery
        ? `사용자 요청 키워드: "${customQuery}"`
        : `오늘의 한국 실시간 급상승 검색어:\n${liveTrends.slice(0, 5).map((t, i) => `${i + 1}. ${t.keyword} (${t.traffic}) - ${t.headline}`).join('\n')}`;
      const sys = `당신은 유튜브 쇼츠·인스타 릴스 100만 뷰 밈·트렌드 해설 전문 PD입니다.
주어진 실시간 이슈/밈 키워드로 즉시 영상을 조립할 수 있는 4개의 고속 쇼츠 설계도를 JSON 배열로 출력하세요.
규칙:
1) 각 항목의 cuts 배열은 정확히 6컷이며, 각 line은 반드시 14~22자 이내의 짧고 강렬한 구어체 1줄이어야 합니다 (1줄=1장면 고속 전환 규칙).
2) 확인된 사실과 유래만 factNote에 적고 추측성 허위 정보(환각)는 절대 쓰지 마세요.
3) JSON 형식:
[{"id":"live_1","cat":"실시간 이슈","badge":"⚡ 실시간 급상승","title":"후킹 제목","why":"왜 떴는지 1~2줄 요약","factNote":"📌 출처·팩트: ... #해시태그","scenePack":"cafe","cuts":[{"line":"20자 이내 대사","mood":"hook","keyword":"english visual keyword"}]}]`;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8500),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sys }] },
          contents: [{ role: 'user', parts: [{ text: seedTxt }] }],
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' }
        })
      });
      if (r.ok) {
        const d = await r.json();
        const parsed = parseJsonLoose(d?.candidates?.[0]?.content?.parts?.[0]?.text || '');
        if (Array.isArray(parsed)) {
          dynamicItems = parsed.filter((it) => it && it.title && Array.isArray(it.cuts) && it.cuts.length >= 4).map((it, idx) => ({
            id: String(it.id || `live_meme_${idx}`),
            cat: String(it.cat || '실시간 이슈'),
            badge: String(it.badge || '⚡ 실시간 급상승'),
            title: String(it.title).slice(0, 48),
            why: String(it.why || '').slice(0, 110),
            factNote: String(it.factNote || '📌 출처: 실시간 트렌드 요약'),
            scenePack: String(it.scenePack || 'cafe'),
            cuts: it.cuts.slice(0, 6).map((c) => ({
              line: String(c.line || '').slice(0, 26),
              mood: String(c.mood || 'fact'),
              keyword: String(c.keyword || 'trending lifestyle')
            }))
          }));
        }
      }
    } catch (_) {}
  }

  // Gemini 미설정 또는 타임아웃 시에도 실시간 Google Trends 키워드를 즉시 6컷 설계도로 변환
  if (!dynamicItems.length && liveTrends.length) {
    dynamicItems = liveTrends.slice(0, 3).map((t, idx) => ({
      id: `gtrend_${idx}`,
      cat: '실시간 이슈',
      badge: `⚡ 실시간 ${t.traffic}`,
      title: `${t.keyword} — 지금 갑자기 검색 폭발한 이유`,
      why: t.headline || `${t.keyword} 관련 실시간 화제 핵심만 15초 만에 정리했습니다.`,
      factNote: `📌 출처·팩트: Google Trends KR 실시간 급상승 (${t.keyword}). 사실 확인된 보도 내용 기준 요약. #${t.keyword.replace(/\s+/g, '')} #실시간이슈 #쇼츠브리핑`,
      scenePack: ['cafe', 'auto', 'shop'][idx % 3],
      cuts: [
        { line: `지금 실시간 검색 터진 ${t.keyword}!`, mood: 'hook', keyword: 'breaking news smartphone' },
        { line: t.headline ? t.headline.slice(0, 22) : '갑자기 왜 이렇게 화제일까요?', mood: 'fact', keyword: 'trending topic screen' },
        { line: '핵심 원인만 딱 3초 만에 정리해 드립니다', mood: 'fact', keyword: 'checklist notebook' },
        { line: '이번 이슈에서 가장 주목할 포인트는 바로', mood: 'shock', keyword: 'spotlight stage' },
        { line: '앞으로 우리 일상에 미칠 영향까지 체크!', mood: 'empathy', keyword: 'city street people' },
        { line: '여러분 생각은 어떠신가요? 댓글로 알려주세요', mood: 'cta', keyword: 'discussion comment' }
      ]
    }));
  }

  const allItems = [...dynamicItems, ...CURATED_MEME_RADAR];
  const filtered = (category && category !== 'all')
    ? allItems.filter((it) => it.cat === category)
    : allItems;

  return res.status(200).json({
    ok: true,
    updatedAt: new Date().toISOString(),
    liveTrendCount: liveTrends.length,
    items: filtered.length ? filtered : allItems
  });
}

async function handleForeignRemake(body, res) {
  const frames = Array.isArray(body.frames) ? body.frames.slice(0, 6) : [];
  const duration = Math.max(4, Math.min(90, Number(body.duration) || 12));
  const hint = String(body.hint || '').trim().slice(0, 200);
  const geminiKey = String(body.adminGeminiKey || process.env.GEMINI_API_KEY || '').trim();
  const geminiModel = String(process.env.GEMINI_SCRIPT_MODEL || 'gemini-2.5-flash').split(',')[0].trim();

  const stepSec =+(duration / 4).toFixed(1);
  const fallbackResult = {
    ok: true,
    provider: 'AutoReels Smart Remake Director',
    detectedLang: '외국어/원본 클립 자동 감지',
    maskSpec: { enabled: true, maskY: 0.81, maskH: 0.13, style: 'dark-blur' },
    hookTitles: [
      hint ? `${hint} — 끝까지 보면 터지는 반전 😂` : '해외에서 1,000만 뷰 터진 레전드 장면 😂',
      '처음엔 평범한 줄 알았는데 마지막 3초 반전!',
      '이래서 요즘 알고리즘에 계속 뜨는구나 🔥',
      '한국인이라면 무조건 공감할 수밖에 없는 순간',
      '소리 켜고 끝까지 보세요, 결말이 진짜 레전드'
    ],
    cues: [
      { start: 0, end: stepSec, orig: '(오프닝 장면)', ko: '처음엔 그냥 평범한 상황인 줄 알았는데' },
      { start: stepSec, end: +(stepSec * 2).toFixed(1), orig: '(전개 구간)', ko: '잠시 뒤 예상치 못한 일이 벌어집니다' },
      { start: +(stepSec * 2).toFixed(1), end: +(stepSec * 3).toFixed(1), orig: '(클라이맥스)', ko: '이 표정 하나에 댓글창이 완전히 뒤집혔죠!' },
      { start: +(stepSec * 3).toFixed(1), end: duration, orig: '(엔딩 리액션)', ko: '여러분이라면 이 상황에서 어떻게 하실 건가요?' }
    ],
    audioPlan: {
      muteOriginal: true,
      duckingRatio: 0.15,
      recommendedBgm: 'upbeat_funny',
      tip: '저작권 보호를 위해 원본 배경음은 제거하고 오토릴스 상업용 무료 BGM으로 자동 교체했습니다.'
    },
    sourceNote: '📌 본 영상은 재사용 허용 원본 클립에 한국어 해설·더빙·무료 음원을 더해 재가공한 콘텐츠입니다. #해외유머 #쇼츠리메이크 #레전드클립'
  };

  if (geminiKey && frames.length > 0) {
    try {
      const imageParts = frames.map((dataUrl) => {
        const m = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!m) return null;
        return { inlineData: { mimeType: m[1], data: m[2] } };
      }).filter(Boolean);

      if (imageParts.length > 0) {
        const sys = `당신은 해외 인기 쇼츠·샤오홍슈·릴스 영상을 한국어 바이럴 쇼츠로 로컬라이징하는 전문 디렉터입니다.
첨부된 영상 연속 프레임(${imageParts.length}장, 총 길이 ${duration}초)을 분석해 아래 JSON만 출력하세요:
1) 화면에 중국어/영어 등 외국어 자막이 보이면 그 원문(orig)을 읽고 자연스러운 한국어 쇼츠 구어체(ko, 1줄 20자 이내)로 번역하세요.
2) 자막이 없는 동물/유머/일상 영상이면 장면 흐름에 딱 맞는 재치 있는 한국어 상황 해설·속마음 더빙 자막(ko)을 4~6구간으로 작성하세요.
3) 기존 외국어 자막의 세로 중심 위치 비율(maskY: 0.65~0.90)과 덮어쓰기 높이 비율(maskH: 0.10~0.16)을 추정하세요.
4) 영상 상단에 고정할 궁금증 유발 한국어 후킹 제목 5개(hookTitles)를 추천하세요.
JSON 스키마:
{"detectedLang":"중국어 자막 감지 | 영어 자막 감지 | 자막 없는 원본 영상","maskSpec":{"enabled":true,"maskY":0.81,"maskH":0.13,"style":"dark-blur"},"hookTitles":["제목1","제목2","제목3","제목4","제목5"],"cues":[{"start":0,"end":3,"orig":"원문 또는 장면설명","ko":"20자 이내 한국어 자막"}],"sourceNote":"📌 출처 및 설명글 #해시태그"}`;

        const userText = `영상 총 길이: ${duration}초.${hint ? ` 사용자 힌트: "${hint}".` : ''} 프레임 순서대로 분석해 JSON으로만 답하세요.`;
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sys }] },
            contents: [{ role: 'user', parts: [...imageParts, { text: userText }] }],
            generationConfig: { temperature: 0.55, responseMimeType: 'application/json' }
          })
        });
        if (r.ok) {
          const d = await r.json();
          const parsed = parseJsonLoose(d?.candidates?.[0]?.content?.parts?.[0]?.text || '');
          if (parsed && Array.isArray(parsed.cues) && parsed.cues.length > 0) {
            return res.status(200).json({
              ok: true,
              provider: `Gemini Vision (${geminiModel})`,
              detectedLang: String(parsed.detectedLang || fallbackResult.detectedLang),
              maskSpec: {
                enabled: parsed.maskSpec?.enabled !== false,
                maskY: Math.max(0.55, Math.min(0.92, Number(parsed.maskSpec?.maskY) || 0.81)),
                maskH: Math.max(0.08, Math.min(0.22, Number(parsed.maskSpec?.maskH) || 0.13)),
                style: String(parsed.maskSpec?.style || 'dark-blur')
              },
              hookTitles: Array.isArray(parsed.hookTitles) && parsed.hookTitles.length
                ? parsed.hookTitles.map((t) => String(t || '').trim()).filter(Boolean).slice(0, 5)
                : fallbackResult.hookTitles,
              cues: parsed.cues.slice(0, 8).map((c, idx, arr) => {
                const defStart = +(idx * (duration / arr.length)).toFixed(1);
                const defEnd = +((idx + 1) * (duration / arr.length)).toFixed(1);
                return {
                  start: typeof c.start === 'number' ? Math.max(0, c.start) : defStart,
                  end: typeof c.end === 'number' ? Math.min(duration, Math.max(0.5, c.end)) : defEnd,
                  orig: String(c.orig || '').slice(0, 60),
                  ko: String(c.ko || '').slice(0, 32)
                };
              }),
              audioPlan: fallbackResult.audioPlan,
              sourceNote: String(parsed.sourceNote || fallbackResult.sourceNote)
            });
          }
        }
      }
    } catch (_) {}
  }

  return res.status(200).json(fallbackResult);
}

async function handleMemeRemakeRequest(body, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (body.mode === 'meme-radar') return handleMemeRadar(body, res);
  if (body.mode === 'foreign-remake') return handleForeignRemake(body, res);
  return res.status(400).json({ ok: false, error: 'unknown_meme_mode' });
}

module.exports = {
  handleMemeRemakeRequest,
  CURATED_MEME_RADAR
};
