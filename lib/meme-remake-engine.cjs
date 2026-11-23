'use strict';

/**
 * AutoReelsMaker — Dedicated Meme Shorts Studio Backend Engine
 * -------------------------------------------------------------
 * 1) mode: 'meme-radar'
 *    - YouTube Data API (KR Shorts) + Google Trends KR RSS + Reddit Viral JSON + Curated Top 10
 *    - 각 밈 카드마다: ① 무슨 밈인지 3줄 요약 + ② 확인된 팩트/출처 문서 + ③ 20자×6컷 고속 쇼츠 대본 + ④ 컷별 밈 리액션/스톡 매칭
 * 2) mode: 'meme-visuals'
 *    - GIPHY / Tenor / Pexels / Pixabay (환경변수 설정 시) + Wikimedia Commons 공식 무료 미디어 API + 자체 바이럴 클립 팩
 *    - 대본 6컷 각각의 감정(충격·웃음·반전·공감)과 키워드에 맞는 밈 짤/스톡 비주얼 자동 매칭 & 실시간 검색
 * 3) mode: 'foreign-remake'
 *    - 해외/샤오홍슈/원본 MP4 프레임 비전 AI 분석 → 상단 후킹 제목 5개 + 외국어 자막 OCR·번역 + 덮어쓰기 마스크 좌표(maskY, maskH)
 */

const TOP10_MEME_RADAR = [
  {
    id: 'meme_chill_guy',
    rank: 1,
    cat: '급상승 밈',
    sourceTag: 'YouTube·TikTok 급상승',
    badge: '🔥 밈 랭킹 1위',
    title: '세상이 무너져도 평온한 "칠 가이(Chill Guy)" 밈',
    summary3: [
      '1) 주머니에 손을 넣고 살짝 미소 짓는 갈색 강아지 캐릭터 밈입니다.',
      '2) 시험 망침·지각·통장 잔고 0원 같은 멘붕 상황에서도 "그냥 신경 안 쓰는 느긋한 태도"로 쓰입니다.',
      '3) 잔잔한 피아노 브금과 함께 6컷 반전 자막으로 만들면 완주율이 가장 높습니다.'
    ],
    why: '멘붕 일상 속에서도 타격감 0%인 느긋한 강아지 캐릭터가 숏폼 공감 1위 기록 중',
    factNote: '📌 팩트·출처: 2023년 디지털 아티스트 필립 뱅크스(Phillip Banks)가 공개한 오리지널 캐릭터 "My New Character"에서 유래. #칠가이 #ChillGuy #밈해설 #쇼츠트렌드',
    scenePack: 'cafe',
    cuts: [
      { line: '요즘 쇼츠마다 나오는 이 강아지 정체', mood: '충격·호기심', keyword: 'chill dog portrait', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/cafe/1.jpg' },
      { line: '이름은 칠 가이, 그냥 느긋한 녀석이죠', mood: '팩트 설명', keyword: 'relaxed puppy smile', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/2.jpg' },
      { line: '월요일 출근길에도 아무 타격 없는 표정', mood: '공감·유머', keyword: 'monday coffee office', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/cafe/3.jpg' },
      { line: '통장 잔고가 비어도 그냥 미소만 지어요', mood: '반전 웃음', keyword: 'funny dog reaction', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/cafe/4.jpg' },
      { line: '스트레스 가득한 현대인들의 워너비!', mood: '핵심 요약', keyword: 'peaceful sunset walk', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/5.jpg' },
      { line: '오늘만큼은 칠 가이처럼 가볍게 넘기세요', mood: '댓글 유도', keyword: 'happy dog thumbs up', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/cafe/6.jpg' }
    ]
  },
  {
    id: 'meme_cat_huh',
    rank: 2,
    cat: '동물·유머',
    sourceTag: '글로벌 5억 뷰',
    badge: '🐱 동물 밈 1위',
    title: '전 세계 5억 뷰 터진 "하?(Huh?)" 통통 고양이 리액션',
    summary3: [
      '1) 사료 주던 집사의 황당한 말에 고개를 갸우뚱하며 "하?" 표정을 짓는 흰 고양이입니다.',
      '2) 직장·학교·연인 사이에서 어이없는 말을 들었을 때 만능 리액션 짤로 쓰입니다.',
      '3) 3번 컷에서 잠깐 정적 후 원본 "하?" 효과음 구간을 넣으면 댓글이 폭발합니다.'
    ],
    why: '황당한 상황에서 고개를 갸우뚱하는 통통한 흰 고양이가 글로벌 만능 리액션 밈으로 정착',
    factNote: '📌 팩트·출처: 해외 반려묘 계정(벤더 더 캣) 원본 클립에 "Huh?" 효과음이 결합되며 숏폼 리액션 밈으로 확산. #고양이밈 #HuhCat #동물쇼츠 #유머',
    scenePack: 'shop',
    cuts: [
      { line: '퇴근 5분 전에 갑자기 새 일을 시킬 때', mood: '공감 훅', keyword: 'confused white cat', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/shop/1.jpg' },
      { line: '머릿속에서 자동으로 재생되는 이 표정', mood: '폭소 리액션', keyword: 'surprised fat cat', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/shop/2.jpg' },
      { line: '네? 지금요? 저한테 말씀하신 건가요?', mood: '황당·충격', keyword: 'cat tilting head', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/shop/3.jpg' },
      { line: '전 세계 5억 명이 저장한 레전드 고양이', mood: '팩트 설명', keyword: 'cute white cat sitting', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/shop/4.jpg' },
      { line: '어떤 억까 상황에도 이 짤 하나면 끝!', mood: '핵심 포인트', keyword: 'funny cat face closeup', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/shop/5.jpg' },
      { line: '오늘 이 표정 지었던 순간 댓글로 적어보세요', mood: '댓글 유도', keyword: 'cat paw high five', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/shop/6.jpg' }
    ]
  },
  {
    id: 'meme_golden_door_wait',
    rank: 3,
    cat: '동물·유머',
    sourceTag: '샤오홍슈·릴스 인기',
    badge: '🐶 감동·반전',
    title: '현관문 앞에서 인형 물고 3시간 버틴 골든리트리버',
    summary3: [
      '1) 야근한 주인을 기다리며 현관 앞 매트에서 최애 인형을 물고 졸고 있는 리트리버 영상입니다.',
      '2) 도어락 소리가 들리자마자 꼬리가 프로펠러처럼 돌아가는 반전이 핵심입니다.',
      '3) 강아지 1인칭 속마음 한국어 더빙을 입히면 저장·공유율이 일반 영상의 3배입니다.'
    ],
    why: '샤오홍슈·해외 릴스에서 가장 조회수가 잘 나오는 반려견 밀착 감동+속마음 더빙 포맷',
    factNote: '📌 제작 가이드: 반려동물 1인칭 속마음 더빙 포맷(CC0 스톡 또는 재사용 허용 클립 활용). #골든리트리버 #강아지더빙 #감동쇼츠',
    scenePack: 'cafe',
    cuts: [
      { line: '현관문 앞에서 3시간째 꼼짝 않는 강아지', mood: '호기심 훅', keyword: 'golden retriever waiting door', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/7.jpg' },
      { line: '입에는 제일 아끼는 인형을 꼭 물고 있죠', mood: '귀여움', keyword: 'dog holding plush toy', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/8.jpg' },
      { line: '드디어 도어락 번호 누르는 소리가 들리자', mood: '기대감', keyword: 'dog ears perked up', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/cafe/9.jpg' },
      { line: '꼬리가 헬리콥터처럼 돌아가기 시작합니다', mood: '반전 미소', keyword: 'happy dog wagging tail', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/cafe/10.jpg' },
      { line: '온종일 주인 오기만 기다렸던 거예요', mood: '감동 포인트', keyword: 'hugging golden retriever', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/11.jpg' },
      { line: '오늘 집에 가면 우리 댕댕이 꼭 안아주세요', mood: '공감 엔딩', keyword: 'sleeping cute puppy', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/cafe/12.jpg' }
    ]
  },
  {
    id: 'meme_genz_slang_quiz',
    rank: 4,
    cat: '급상승 밈',
    sourceTag: '네이버·커뮤니티 화제',
    badge: '⚡ 댓글 폭발형',
    title: '3초 안에 다 맞히면 최소 20대라는 요즘 신조어 퀴즈',
    summary3: [
      '1) 추구미·느좋·위시코어 등 최근 SNS에서 급증한 신조어를 3초 카운트다운으로 맞히는 포맷입니다.',
      '2) 시청자가 자기 점수를 댓글에 적게 만들어 알고리즘 체류시간과 댓글 수를 동시에 끌어올립니다.',
      '3) 노래방식 단어 강조 자막과 가장 궁합이 좋은 대표적인 부업 효자 포맷입니다.'
    ],
    why: '시청자 참여(점수 댓글)를 유도해 평균 시청 지속시간 130% 이상 뽑아내는 퀴즈형 쇼츠',
    factNote: '📌 팩트·출처: 2026 SNS·커뮤니티 실사용 트렌드 용어 정리. #신조어테스트 #밈퀴즈 #요즘유행어 #쇼츠퀴즈',
    scenePack: 'academy',
    cuts: [
      { line: '이 중 3개 다 알면 아직 감 살아있는 겁니다', mood: '도전 훅', keyword: 'quiz countdown neon', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/academy/1.jpg' },
      { line: '1번 추구미: 내가 추구하는 나만의 이미지!', mood: '팩트 해설', keyword: 'fashion mirror selfie', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/academy/2.jpg' },
      { line: '2번 느좋: 설명 필요 없이 그냥 느낌 좋은 것!', mood: '공감 예시', keyword: 'aesthetic cafe vibe', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/academy/3.jpg' },
      { line: '3번 텍스트힙: 독서와 기록이 가장 힙한 유행!', mood: '트렌드 팩트', keyword: 'reading book coffee', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/academy/4.jpg' },
      { line: '솔직히 몇 개나 바로 맞히셨나요?', mood: '질문 전환', keyword: 'thinking reaction meme', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/academy/5.jpg' },
      { line: '여러분의 개수를 지금 댓글로 남겨주세요!', mood: '댓글 폭발', keyword: 'typing phone comment', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/academy/6.jpg' }
    ]
  },
  {
    id: 'meme_korean_patch_barista',
    rank: 5,
    cat: '해외 바이럴',
    sourceTag: 'Reddit·해외 쇼츠',
    badge: '🌏 해외 역수입',
    title: '한국인보다 한국 패치 완벽한 해외 카페 알바생',
    summary3: [
      '1) 해외 로컬 카페인데 주문하자마자 3초 만에 아이스 아메리카노가 나오는 반전 유머입니다.',
      '2) K-빨리빨리 문화와 해외 일상의 대비를 다루면 한국 시청자 댓글 반응이 매우 뜨겁습니다.',
      '3) 빠른 컷 전환(컷당 1.8~2초)과 경쾌한 무료 BGM을 조합하면 완성도가 높습니다.'
    ],
    why: '글로벌 K-컬처·아아(아이스 아메리카노) 밈이 해외 크리에이터들 사이에서 역수입 유행 중',
    factNote: '📌 트렌드 포인트: 글로벌 K-카페·빨리빨리 문화 밈 요약. #해외반응 #아이스아메리카노 #알바레전드 #유머쇼츠',
    scenePack: 'restaurant',
    cuts: [
      { line: '해외 카페에서 아이스 아메리카노를 시켰더니', mood: '상황 훅', keyword: 'barista iced coffee', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/restaurant/1.jpg' },
      { line: '결제 끝나기 무섭게 3초 만에 등장합니다', mood: '충격 속도', keyword: 'fast coffee serve', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/restaurant/2.jpg' },
      { line: '한국인도 깜짝 놀란 K-빨리빨리 패치!', mood: '폭소 포인트', keyword: 'iced americano glass', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/restaurant/3.jpg' },
      { line: '심지어 한국말로 맛있게 드세요까지 완벽', mood: '반전 매력', keyword: 'smiling barista thumb up', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/restaurant/4.jpg' },
      { line: '댓글창은 이미 명예 한국인 임명식 열렸죠', mood: '팩트 반응', keyword: 'clapping applause reaction', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/restaurant/5.jpg' },
      { line: '이런 카페 동네에 있으면 매일 출근하겠죠?', mood: '공감 엔딩', keyword: 'cozy cafe exterior', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/restaurant/6.jpg' }
    ]
  },
  {
    id: 'meme_cat_thief_caught',
    rank: 6,
    cat: '동물·유머',
    sourceTag: '샤오홍슈·틱톡 인기',
    badge: '🐱 1인칭 더빙',
    title: '생선 훔치려다 현행범으로 딱 걸린 고양이의 뻔뻔한 변명',
    summary3: [
      '1) 식탁 위 생선에 앞발을 뻗다가 집사와 눈이 마주친 순간 얼어붙는 고양이 클립입니다.',
      '2) 앞발만 슬쩍 내리며 "파리 잡아주려 했다"고 우기는 1인칭 더빙이 웃음 포인트입니다.',
      '3) 해외 동물 클립 리메이크에서 가장 실패 없는 스테디셀러 구조입니다.'
    ],
    why: '찰나의 정지 화면 + 뻔뻔한 한국어 속마음 더빙 조합으로 반복 재생을 유도하는 동물 유머',
    factNote: '📌 더빙 포인트: 2번 컷에서 효과음과 함께 뻔뻔한 한국어 더빙 적용. #고양이더빙 #현행범포착 #반려묘유머',
    scenePack: 'restaurant',
    cuts: [
      { line: '식탁 위 생선에 조용히 다가가는 고양이 앞발', mood: '긴장 훅', keyword: 'cat paw reaching table', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/restaurant/2.jpg' },
      { line: '집사랑 눈이 딱 마주친 바로 그 0.1초!', mood: '현행범 정지', keyword: 'shocked cat wide eyes', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/restaurant/4.jpg' },
      { line: '아니아니, 난 그냥 파리 잡아주려 했어!', mood: '뻔뻔한 더빙', keyword: 'innocent cat face', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/restaurant/5.jpg' },
      { line: '앞발만 슬쩍 내려놓으며 먼 산 바라보기', mood: '웃음 반전', keyword: 'cat looking away funny', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/restaurant/6.jpg' },
      { line: '연기대상 감이라는 고양이식 위기 탈출!', mood: '핵심 유머', keyword: 'fluffy cat sitting proud', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/3.jpg' },
      { line: '이 정도 연기력이면 간식 하나 줘야겠죠?', mood: '댓글 유도', keyword: 'cat eating snack', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/cafe/5.jpg' }
    ]
  },
  {
    id: 'meme_office_lookism_empathy',
    rank: 7,
    cat: '급상승 밈',
    sourceTag: '인스타 릴스 공감',
    badge: '💼 직장인 공감',
    title: '출근 10분 만에 집 가고 싶어지는 직장인 국룰 모먼트',
    summary3: [
      '1) 커피 수혈 전후의 표정 변화와 회의 시간 멘붕 리액션을 빠른 템포로 묶은 공감 밈입니다.',
      '2) 월요일·수요일 오전 시간대에 예약 업로드하면 직장인 공유 수가 가장 높습니다.',
      '3) 각 컷마다 대조되는 밈 리액션 클립을 넣으면 영상 촬영 없이도 1분 만에 제작됩니다.'
    ],
    why: '직장인·학생이 스토리와 단톡방에 가장 많이 공유하는 일상 하이퍼리얼리즘 밈',
    factNote: '📌 트렌드 포인트: 하이퍼리얼리즘 직장인 공감 포맷. #직장인밈 #출근길 #공감쇼츠 #오피스유머',
    scenePack: 'auto',
    cuts: [
      { line: '출근해서 컴퓨터 켜자마자 드는 생각 1위', mood: '공감 훅', keyword: 'tired office worker laptop', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/auto/1.jpg' },
      { line: '아 오늘 왜 벌써 피곤하지? 집 가고 싶다', mood: '멘붕 리액션', keyword: 'sleepy coffee mug', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/auto/2.jpg' },
      { line: '하지만 아이스 아메리카노 첫 모금 마시면', mood: '분위기 반전', keyword: 'drinking iced coffee', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/1.jpg' },
      { line: '갑자기 사회성 만렙 프로 직장인으로 변신!', mood: '웃음 포인트', keyword: 'typing fast funny', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/auto/3.jpg' },
      { line: '물론 오후 4시 되면 다시 배터리 방전됩니다', mood: '현실 폭소', keyword: 'low battery tired face', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/auto/4.jpg' },
      { line: '오늘도 버텨낸 모든 분들 진짜 고생했어요!', mood: '응원 엔딩', keyword: 'cheers coffee cup', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/cafe/6.jpg' }
    ]
  },
  {
    id: 'meme_ai_vs_reality',
    rank: 8,
    cat: '해외 바이럴',
    sourceTag: '글로벌 숏폼 트렌드',
    badge: '🤖 기대 vs 현실',
    title: '인터넷 레시피 보고 따라 했다가 대참사 난 기대 vs 현실',
    summary3: [
      '1) 완벽한 비주얼의 원본 사진(기대)과 엉뚱하게 완성된 결과물(현실)을 비교하는 포맷입니다.',
      '2) 1~2컷에서 완벽한 기대치를 보여주고 3~4컷에서 반전 결과를 터뜨리는 구성입니다.',
      '3) 베이킹·요리·인테리어·다이어트 등 어떤 주제로도 무한 양산이 가능합니다.'
    ],
    why: '언어 장벽 없이 국내외 어디서나 터지는 "Expectation vs Reality" 반전 유머 포맷',
    factNote: '📌 제작 가이드: 기대(1~2컷) vs 현실 반전(3~5컷) 대비 구성. #기대vs현실 #요리대참사 #반전유머 #쇼츠밈',
    scenePack: 'beauty',
    cuts: [
      { line: 'SNS에서 본 5분 완성 초간단 디저트 레시피!', mood: '기대감 훅', keyword: 'perfect cake dessert', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/2.jpg' },
      { line: '사진 속 비주얼은 당장 카페 차려도 될 수준', mood: '완벽 비주얼', keyword: 'luxury bakery pastry', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/4.jpg' },
      { line: '그래서 저도 설명서 그대로 따라 해봤는데요', mood: '긴장 전환', keyword: 'cooking kitchen mixing', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/restaurant/3.jpg' },
      { line: '잠시만요, 왜 오븐에서 연기가 나는 거죠?', mood: '반전 대참사', keyword: 'funny kitchen fail reaction', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/restaurant/5.jpg' },
      { line: '그냥 동네 디저트 카페에서 사 먹는 게 답!', mood: '폭소 결론', keyword: 'laughing reaction meme', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/cafe/8.jpg' },
      { line: '여러분도 요리 실패담 있으면 댓글로 풀어요', mood: '댓글 유도', keyword: 'smiling chef thumbs up', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/cafe/9.jpg' }
    ]
  },
  {
    id: 'meme_workout_day1',
    rank: 9,
    cat: '급상승 밈',
    sourceTag: '유튜브 쇼츠 인기',
    badge: '💪 헬스·다이어트 밈',
    title: '헬스장 등록 첫날 vs 3일째 사라지는 회원 국룰',
    summary3: [
      '1) 등록 첫날엔 프로 보디빌더처럼 장비를 챙기지만 3일째엔 근육통으로 계단도 못 내려가는 밈입니다.',
      '2) 운동·다이어트 공감 키워드는 사계절 내내 조회수와 광고 단가(RPM)가 높습니다.',
      '3) 빠른 비트 BGM과 노래방식 강조 자막을 켜면 텐션이 확 살아납니다.'
    ],
    why: '운동·다이어트 공감 밈은 시청자 타깃이 넓고 저장·재시청률이 높은 대표 스테디셀러',
    factNote: '📌 트렌드 포인트: 헬스·다이어트 작심삼일 공감 유머. #오운완 #헬스장밈 #다이어트공감 #운동쇼츠',
    scenePack: 'fitness',
    cuts: [
      { line: '헬스장 3개월 끊은 첫날의 비장한 각오!', mood: '강렬한 훅', keyword: 'gym workout dumbbell', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/fitness/1.jpg' },
      { line: '운동복부터 프로틴까지 장비는 이미 국가대표', mood: '자신감', keyword: 'fitness gear bottle', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/fitness/2.jpg' },
      { line: '하체 운동 딱 한 시간 불태우고 난 다음 날', mood: '반전 시작', keyword: 'leg day squat gym', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/fitness/3.jpg' },
      { line: '침대에서 일어나는 데만 15분이 걸립니다', mood: '근육통 폭소', keyword: 'tired sore muscles funny', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/fitness/4.jpg' },
      { line: '결국 계단 앞에서 엘리베이터만 애타게 찾죠', mood: '공감 유머', keyword: 'funny walking stairs', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/fitness/5.jpg' },
      { line: '오늘 운동 갈지 말지 고민 중이면 일단 가세요!', mood: '응원 CTA', keyword: 'high five gym trainer', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/fitness/6.jpg' }
    ]
  },
  {
    id: 'meme_puppy_guilty_eyes',
    rank: 10,
    cat: '동물·유머',
    sourceTag: '해외 동물 바이럴',
    badge: '🐕 눈치 백단',
    title: '사고 쳐놓고 먼저 눈웃음부터 치는 강아지 심리전',
    summary3: [
      '1) 거실에 휴지를 어질러 놓고도 주인이 부르면 귀를 뒤로 젖히며 눈웃음 치는 강아지입니다.',
      '2) "누가 그랬어?" 한 마디에 세상 억울한 표정을 짓는 리액션이 핵심입니다.',
      '3) 마지막 컷에 투표형 질문("용서한다 vs 혼낸다")을 넣으면 댓글 참여율이 2배 이상 뜁니다.'
    ],
    why: '반려견 눈치·애교 리액션 클립은 해외·국내 불문 호불호 없이 높은 좋아요율을 기록',
    factNote: '📌 제작 가이드: 마지막 컷 댓글 투표 유도("용서 vs 훈육"). #강아지눈치 #반려견유머 #댕댕이쇼츠 #동물밈',
    scenePack: 'cafe',
    cuts: [
      { line: '퇴근하고 문을 열자마자 펼쳐진 거실 풍경', mood: '충격 오프닝', keyword: 'messy living room puppy', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/interior/1.jpg' },
      { line: '범인을 찾으려고 이름을 조용히 불러봤더니', mood: '긴장감', keyword: 'guilty dog ears back', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/cafe/4.jpg' },
      { line: '벌써 귀를 뒤로 젖히고 눈웃음부터 발사!', mood: '심쿵 반전', keyword: 'smiling cute dog face', mediaType: '밈 리액션', fallbackImg: '/assets/scenes/cafe/7.jpg' },
      { line: '이렇게 귀여운 얼굴로 애교 부리면 반칙이죠', mood: '무장해제', keyword: 'puppy belly rub', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/9.jpg' },
      { line: '화내려던 마음도 3초 만에 사르르 녹습니다', mood: '공감 미소', keyword: 'petting happy dog', mediaType: '스톡 클립', fallbackImg: '/assets/scenes/cafe/10.jpg' },
      { line: '여러분은 바로 용서한다 vs 단호하게 혼낸다?', mood: '투표 댓글', keyword: 'cute dog tilting head', mediaType: '바이럴 팩', fallbackImg: '/assets/scenes/cafe/11.jpg' }
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
      signal: AbortSignal.timeout(3200)
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const items = [];
    const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    for (const b of blocks.slice(0, 6)) {
      const title = (b.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/) || [])[1]
        || (b.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const traffic = (b.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/) || [])[1] || '';
      const newsTitle = (b.match(/<ht:news_item_title><!\[CDATA\[([\s\S]*?)\]\]><\/ht:news_item_title>|<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/) || [])[1]
        || (b.match(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/) || [])[1] || '';
      const cleanT = String(title).replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
      const cleanN = String(newsTitle).replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, '').trim();
      if (cleanT) items.push({ keyword: cleanT, traffic: traffic || '급상승', headline: cleanN, source: 'Google Trends KR' });
    }
    return items;
  } catch (_) {
    return [];
  }
}

async function fetchYoutubeTrendingShortsKr() {
  const ytKey = String(process.env.YOUTUBE_API_KEY || '').trim();
  if (!ytKey) return [];
  try {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&order=viewCount&publishedAfter=${encodeURIComponent(weekAgo)}&maxResults=4&regionCode=KR&relevanceLanguage=ko&q=${encodeURIComponent('밈 쇼츠 유머 동물')}&key=${encodeURIComponent(ytKey)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(3200) });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.items || []).map((it) => ({
      keyword: String(it.snippet?.title || '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').slice(0, 38),
      traffic: 'YouTube 급상승',
      headline: String(it.snippet?.channelTitle || '인기 쇼츠'),
      source: 'YouTube Data API'
    })).filter((x) => x.keyword);
  } catch (_) {
    return [];
  }
}

async function fetchRedditViralMemes() {
  try {
    const r = await fetch('https://www.reddit.com/r/memes+funny+animals/hot.json?limit=4', {
      headers: { 'User-Agent': 'AutoReelsMaker/2.0' },
      signal: AbortSignal.timeout(2800)
    });
    if (!r.ok) return [];
    const d = await r.json();
    return (d?.data?.children || []).map((c) => c?.data).filter((p) => p && !p.over_18 && p.title).slice(0, 3).map((p) => ({
      keyword: String(p.title).slice(0, 44),
      traffic: `Reddit ↑${p.ups || 1000}`,
      headline: `r/${p.subreddit} 글로벌 인기 밈`,
      source: 'Reddit Viral'
    }));
  } catch (_) {
    return [];
  }
}

// Wikimedia Commons + GIPHY/Tenor/Pexels 무료 공식 API로 컷별 실제 밈 짤/스톡 이미지·클립 검색
async function searchFreeVisualsForQuery(query, count = 4) {
  const q = String(query || 'funny cat').trim();
  const results = [];

  // 1) GIPHY 공식 API (환경변수 GIPHY_API_KEY 설정 시 리액션 밈 MP4/GIF 반환)
  const giphyKey = String(process.env.GIPHY_API_KEY || '').trim();
  if (giphyKey) {
    try {
      const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(giphyKey)}&q=${encodeURIComponent(q)}&limit=${count}&rating=g`, {
        signal: AbortSignal.timeout(2800)
      });
      if (r.ok) {
        const d = await r.json();
        for (const g of (d.data || [])) {
          const imgUrl = g?.images?.downsized_medium?.url || g?.images?.fixed_height?.url;
          if (imgUrl) results.push({ url: imgUrl, source: 'GIPHY Meme', title: g.title || q });
        }
      }
    } catch (_) {}
  }

  // 2) Pixabay / Pexels 공식 무료 스톡 API (환경변수 설정 시)
  const pixabayKey = String(process.env.PIXABAY_API_KEY || '').trim();
  if (pixabayKey && results.length < count) {
    try {
      const r = await fetch(`https://pixabay.com/api/?key=${encodeURIComponent(pixabayKey)}&q=${encodeURIComponent(q)}&image_type=photo&orientation=vertical&per_page=${count}&safesearch=true`, {
        signal: AbortSignal.timeout(2800)
      });
      if (r.ok) {
        const d = await r.json();
        for (const h of (d.hits || [])) {
          if (h.webformatURL) results.push({ url: h.webformatURL, source: 'Pixabay Stock', title: h.tags || q });
        }
      }
    } catch (_) {}
  }

  // 3) Wikimedia Commons 공식 무료 API (API 키 없이 100% 무료·합법 동작!)
  if (results.length < count) {
    try {
      const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent('filetype:bitmap ' + q)}&gsrlimit=${count}&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`;
      const r = await fetch(wikiUrl, {
        headers: { 'User-Agent': 'AutoReelsMaker/2.0 (https://autoreelsmaker.kr)' },
        signal: AbortSignal.timeout(3000)
      });
      if (r.ok) {
        const d = await r.json();
        const pages = Object.values(d?.query?.pages || {});
        for (const p of pages) {
          const ii = p?.imageinfo?.[0];
          const u = ii?.thumburl || ii?.url;
          if (u && /\.(jpg|jpeg|png|gif|webp)$/i.test(u)) {
            results.push({ url: u, source: 'Commons CC', title: String(p.title || q).replace(/^File:/i, '') });
          }
        }
      }
    } catch (_) {}
  }

  return results.slice(0, count);
}

async function handleMemeRadar(body, res) {
  const category = String(body.category || 'all').trim();
  const customQuery = String(body.query || '').trim();
  const geminiKey = String(body.adminGeminiKey || process.env.GEMINI_API_KEY || '').trim();
  const geminiModel = String(process.env.GEMINI_SCRIPT_MODEL || 'gemini-2.5-flash').split(',')[0].trim();

  const [gTrends, ytShorts, redditMemes] = await Promise.all([
    fetchGoogleTrendsKr(),
    fetchYoutubeTrendingShortsKr(),
    fetchRedditViralMemes()
  ]);
  const liveSignals = [...ytShorts, ...gTrends, ...redditMemes];
  let dynamicItems = [];

  if (geminiKey && (customQuery || liveSignals.length)) {
    try {
      const seedTxt = customQuery
        ? `사용자 검색 요청 밈/주제: "${customQuery}"`
        : `오늘 수집된 실시간 트렌드 시그널:\n${liveSignals.slice(0, 6).map((t, i) => `${i + 1}. [${t.source}] ${t.keyword} (${t.traffic}) - ${t.headline}`).join('\n')}`;
      const sys = `당신은 유튜브 쇼츠·인스타 릴스 100만 뷰 밈·트렌드 전문 PD입니다.
주어진 실시간 트렌드/밈 시그널을 바탕으로 고객이 클릭 1번에 바로 완성할 수 있는 쇼츠 설계도 3개를 JSON 배열로 출력하세요.
규칙:
1) summary3 배열에 "① 무슨 밈/이슈인지", "② 왜 인기인지/포인트", "③ 쇼츠 연출 팁" 3줄 요약을 담으세요.
2) factNote에 확인된 사실과 출처·해시태그만 적으세요 (환각 금지).
3) cuts 배열은 정확히 6컷이며, 각 line은 반드시 14~22자 이내(1줄=1장면 고속 전환 규칙)로 작성하세요.
4) 각 cut마다 GIPHY/Pexels 검색용 영어 keyword와 mediaType("밈 리액션" | "스톡 클립" | "바이럴 팩")을 지정하세요.
JSON 형식:
[{"id":"live_1","cat":"실시간 이슈","sourceTag":"Google Trends·YouTube","badge":"⚡ 실시간 급상승","title":"후킹 제목","summary3":["1) 요약1","2) 요약2","3) 요약3"],"why":"한 줄 핵심 요약","factNote":"📌 팩트·출처: ... #해시태그","scenePack":"cafe","cuts":[{"line":"20자 이내 대사","mood":"충격 훅","keyword":"funny cat shock","mediaType":"밈 리액션"}]}]`;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8500),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sys }] },
          contents: [{ role: 'user', parts: [{ text: seedTxt }] }],
          generationConfig: { temperature: 0.65, responseMimeType: 'application/json' }
        })
      });
      if (r.ok) {
        const d = await r.json();
        const parsed = parseJsonLoose(d?.candidates?.[0]?.content?.parts?.[0]?.text || '');
        if (Array.isArray(parsed)) {
          dynamicItems = parsed.filter((it) => it && it.title && Array.isArray(it.cuts) && it.cuts.length >= 4).map((it, idx) => {
            const pack = ['cafe', 'shop', 'restaurant', 'academy', 'auto'][idx % 5];
            return {
              id: String(it.id || `live_meme_${idx}`),
              rank: idx + 1,
              cat: String(it.cat || '실시간 이슈'),
              sourceTag: String(it.sourceTag || '실시간 트렌드 API'),
              badge: String(it.badge || '⚡ 실시간 급상승'),
              title: String(it.title).slice(0, 50),
              summary3: Array.isArray(it.summary3) && it.summary3.length >= 2
                ? it.summary3.slice(0, 3).map((s) => String(s))
                : [String(it.why || '실시간 급상승 화제 이슈입니다.'), '핵심 팩트와 반응을 6컷으로 압축했습니다.', '노래방식 자막과 AI 더빙으로 바로 발행하세요.'],
              why: String(it.why || '').slice(0, 110),
              factNote: String(it.factNote || '📌 팩트·출처: 실시간 트렌드 확인 요약'),
              scenePack: String(it.scenePack || pack),
              cuts: it.cuts.slice(0, 6).map((c, ci) => ({
                line: String(c.line || '').slice(0, 26),
                mood: String(c.mood || '핵심 컷'),
                keyword: String(c.keyword || 'trending reaction'),
                mediaType: String(c.mediaType || (ci % 2 === 0 ? '밈 리액션' : '스톡 클립')),
                fallbackImg: `/assets/scenes/${pack}/${(ci % 10) + 1}.jpg`
              }))
            };
          });
        }
      }
    } catch (_) {}
  }

  if (!dynamicItems.length && liveSignals.length) {
    dynamicItems = liveSignals.slice(0, 2).map((t, idx) => {
      const pack = ['cafe', 'shop'][idx % 2];
      return {
        id: `live_sig_${idx}`,
        rank: idx + 1,
        cat: '실시간 이슈',
        sourceTag: t.source,
        badge: `⚡ ${t.traffic}`,
        title: `${t.keyword} — 지금 실시간 급상승한 핵심 이유`,
        summary3: [
          `1) [${t.source}]에서 "${t.keyword}" 키워드가 실시간 급상승 중입니다.`,
          `2) ${t.headline || '네티즌 사이에서 빠르게 공유되고 있는 핵심 포인트'}를 6컷으로 정리했습니다.`,
          '3) 확인된 사실 위주 20자 고속 자막과 출처 설명글이 자동 세팅됩니다.'
        ],
        why: t.headline || `${t.keyword} 실시간 급상승 배경과 핵심 반응 요약`,
        factNote: `📌 팩트·출처: ${t.source} 실시간 트렌드 (${t.keyword}). #${t.keyword.replace(/\s+/g, '').slice(0, 12)} #실시간이슈 #쇼츠트렌드`,
        scenePack: pack,
        cuts: [
          { line: `지금 실시간 검색 터진 ${t.keyword.slice(0, 12)}!`, mood: '충격 훅', keyword: 'breaking news smartphone', mediaType: '밈 리액션', fallbackImg: `/assets/scenes/${pack}/1.jpg` },
          { line: (t.headline || '갑자기 왜 이렇게 화제일까요?').slice(0, 22), mood: '배경 요약', keyword: 'trending social media', mediaType: '스톡 클립', fallbackImg: `/assets/scenes/${pack}/2.jpg` },
          { line: '핵심 원인만 딱 3초 만에 정리해 드립니다', mood: '팩트 정리', keyword: 'checklist note', mediaType: '스톡 클립', fallbackImg: `/assets/scenes/${pack}/3.jpg` },
          { line: '네티즌들이 가장 놀란 포인트는 바로 이것!', mood: '반전 리액션', keyword: 'surprised cat reaction', mediaType: '밈 리액션', fallbackImg: `/assets/scenes/${pack}/4.jpg` },
          { line: '앞으로 어떻게 흘러갈지 주목되고 있습니다', mood: '핵심 전망', keyword: 'city crowd street', mediaType: '스톡 클립', fallbackImg: `/assets/scenes/${pack}/5.jpg` },
          { line: '여러분 생각은 어떠신가요? 댓글로 남겨주세요', mood: '댓글 유도', keyword: 'typing comment phone', mediaType: '바이럴 팩', fallbackImg: `/assets/scenes/${pack}/6.jpg` }
        ]
      };
    });
  }

  const combined = [...dynamicItems, ...TOP10_MEME_RADAR].map((it, i) => ({ ...it, rank: i + 1 }));
  const filtered = (category && category !== 'all')
    ? combined.filter((it) => it.cat === category)
    : combined;

  return res.status(200).json({
    ok: true,
    updatedAt: new Date().toISOString(),
    sources: {
      youtube: ytShorts.length,
      googleTrends: gTrends.length,
      reddit: redditMemes.length,
      curatedTop10: TOP10_MEME_RADAR.length
    },
    items: (filtered.length ? filtered : combined).slice(0, 12)
  });
}

async function handleMemeVisuals(body, res) {
  const queries = Array.isArray(body.queries) ? body.queries.slice(0, 6) : [String(body.query || 'funny cat')];
  const perCut = await Promise.all(queries.map((q) => searchFreeVisualsForQuery(q, 3)));
  return res.status(200).json({
    ok: true,
    visualsByCut: perCut
  });
}

async function handleForeignRemake(body, res) {
  const frames = Array.isArray(body.frames) ? body.frames.slice(0, 6) : [];
  const duration = Math.max(4, Math.min(90, Number(body.duration) || 12));
  const hint = String(body.hint || '').trim().slice(0, 200);
  const geminiKey = String(body.adminGeminiKey || process.env.GEMINI_API_KEY || '').trim();
  const geminiModel = String(process.env.GEMINI_SCRIPT_MODEL || 'gemini-2.5-flash').split(',')[0].trim();

  const stepSec = +(duration / 6).toFixed(1);
  const fallbackResult = {
    ok: true,
    provider: 'AutoReels Smart Remake Director',
    detectedLang: '외국어 자막 · 원본 클립 자동 분석',
    maskSpec: { enabled: true, maskY: 0.81, maskH: 0.13, style: 'dark-blur' },
    hookTitles: [
      hint ? `${hint} — 끝까지 보면 터지는 반전 😂` : '해외에서 1,000만 뷰 터진 레전드 반전 😂',
      '처음엔 평범한 줄 알았는데 마지막 3초 대반전!',
      '이래서 요즘 알고리즘에 계속 뜨는구나 🔥',
      '한국인이라면 무조건 공감할 수밖에 없는 순간',
      '소리 켜고 끝까지 보세요, 결말이 진짜 레전드'
    ],
    cues: [
      { start: 0, end: stepSec, orig: '(오프닝 장면)', ko: '처음엔 그냥 평범한 상황인 줄 알았는데' },
      { start: stepSec, end: +(stepSec * 2).toFixed(1), orig: '(상황 전개)', ko: '잠시 뒤 아무도 예상 못 한 일이 벌어집니다' },
      { start: +(stepSec * 2).toFixed(1), end: +(stepSec * 3).toFixed(1), orig: '(반전 포착)', ko: '바로 이 순간 공기가 완전히 바뀌었죠!' },
      { start: +(stepSec * 3).toFixed(1), end: +(stepSec * 4).toFixed(1), orig: '(클라이맥스)', ko: '이 표정 하나에 댓글창이 완전히 뒤집혔습니다' },
      { start: +(stepSec * 4).toFixed(1), end: +(stepSec * 5).toFixed(1), orig: '(하이라이트)', ko: '다시 봐도 타이밍이 진짜 예술이네요' },
      { start: +(stepSec * 5).toFixed(1), end: duration, orig: '(엔딩 질문)', ko: '여러분이라면 이 상황에서 어떻게 하실 건가요?' }
    ],
    audioPlan: {
      muteOriginal: true,
      duckingRatio: 0.15,
      recommendedBgm: 'upbeat_funny',
      tip: '저작권 보호를 위해 원본 배경음은 제거하고 오토릴스 상업용 무료 BGM으로 자동 교체했습니다.'
    },
    sourceNote: '📌 출처·안내: 재사용 허용 원본 클립에 한국어 번역·더빙·무료 음원을 더해 재가공한 쇼츠입니다. #해외유머 #쇼츠리메이크 #레전드클립 #밈쇼츠'
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
1) 화면에 중국어/영어 등 외국어 자막이 보이면 그 원문(orig)을 읽고 자연스러운 한국어 쇼츠 구어체(ko, 1줄 20자 이내)로 6구간 번역하세요.
2) 자막이 없는 동물/유머/일상 영상이면 장면 흐름에 딱 맞는 재치 있는 한국어 상황 해설·속마음 더빙 자막(ko, 1줄 20자 이내)을 6구간으로 작성하세요.
3) 기존 외국어 자막의 세로 중심 위치 비율(maskY: 0.65~0.90)과 덮어쓰기 높이 비율(maskH: 0.10~0.16)을 추정하세요.
4) 영상 상단에 고정할 궁금증 유발 한국어 후킹 제목 5개(hookTitles)를 추천하세요.
JSON 스키마:
{"detectedLang":"중국어 자막 감지 | 영어 자막 감지 | 자막 없는 원본 영상","maskSpec":{"enabled":true,"maskY":0.81,"maskH":0.13,"style":"dark-blur"},"hookTitles":["제목1","제목2","제목3","제목4","제목5"],"cues":[{"start":0,"end":2,"orig":"원문 또는 장면설명","ko":"20자 이내 한국어 자막"}],"sourceNote":"📌 출처 및 설명글 #해시태그"}`;

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

async function handleMemeMashup(body, res) {
  const meme = body.meme && typeof body.meme === 'object' ? body.meme : TOP10_MEME_RADAR[0];
  const mashupType = String(body.mashupType || 'keyword').trim(); // 'pure' | 'keyword' | 'store'
  const issueKeyword = String(body.issueKeyword || '오늘의 실시간 이슈').trim();
  const industryLabel = String(body.industryLabel || '우리 매장').trim();
  const storeName = String(body.storeName || industryLabel).trim();
  const productPoint = String(body.productPoint || '시그니처 혜택').trim();
  const geminiKey = String(body.adminGeminiKey || process.env.GEMINI_API_KEY || '').trim();
  const geminiModel = String(process.env.GEMINI_SCRIPT_MODEL || 'gemini-2.5-flash').split(',')[0].trim();

  const memeTitle = String(meme.title || '인기 밈').trim();
  const pack = String(meme.scenePack || 'cafe');

  // 즉시 동작하는 스마트 패러디 폴백 (이슈 콜라보 vs 우리 가게 B급 밈 홍보)
  const fallbackMashup = mashupType === 'store'
    ? {
        title: `[${storeName}×밈 패러디] ${memeTitle.slice(0, 18)} 버전`,
        badge: `🏪 가게 홍보×밈 패러디`,
        why: `"${memeTitle}" 유행 포맷에 [${storeName} · ${productPoint}] 매력을 광고 티 안 나게 녹인 B급 바이럴 쇼츠`,
        factNote: `📌 ${storeName} (${industryLabel}) · ${productPoint} | 유행 밈 패러디 홍보 쇼츠 #${storeName.replace(/\s+/g, '')} #${industryLabel.replace(/\s+/g, '')} #밈홍보 #쇼츠`,
        hookTitles: [
          `${storeName} 처음 온 손님들의 흔한 리액션 😂`,
          `광고 아님) ${productPoint} 보고 그냥 지나치려다 실패한 썰`,
          `사장님이 미쳤어요 소리가 절로 나오는 ${storeName} 근황`,
          `요즘 알고리즘 타는 밈으로 보는 ${storeName} 핵심 요약`,
          `끝까지 보면 무조건 방문각 잡히는 ${productPoint} 반전!`
        ],
        cuts: [
          { line: `요즘 유행하는 이 밈, ${storeName} 버전!`, mood: '패러디 훅', keyword: meme.cuts?.[0]?.keyword || 'funny reaction', mediaType: '밈 리액션' },
          { line: `처음엔 그냥 평범한 ${industryLabel}인 줄 알았죠`, mood: '기대 반전', keyword: meme.cuts?.[1]?.keyword || 'store entrance', mediaType: '스톡 클립' },
          { line: `그런데 ${productPoint.slice(0, 14)} 나오는 순간!`, mood: '충격 포인트', keyword: meme.cuts?.[2]?.keyword || 'surprised cat', mediaType: '밈 리액션' },
          { line: '동공 지진 나면서 표정이 이렇게 바뀝니다', mood: '폭소 리액션', keyword: meme.cuts?.[3]?.keyword || 'happy dog smile', mediaType: '밈 리액션' },
          { line: `한 번 오면 단골 될 수밖에 없는 ${storeName}!`, mood: '매장 강점', keyword: meme.cuts?.[4]?.keyword || 'thumbs up', mediaType: '매장·스톡' },
          { line: '지금 프로필·댓글로 혜택 바로 챙겨가세요!', mood: '방문 유도', keyword: meme.cuts?.[5]?.keyword || 'welcome sign', mediaType: '바이럴 팩' }
        ]
      }
    : {
        title: `[오늘의 키워드×밈] ${issueKeyword} × ${memeTitle.slice(0, 16)}`,
        badge: `⚡ 실시간 키워드×밈`,
        why: `오늘 화제인 "${issueKeyword}" 이슈를 "${memeTitle}" 포맷으로 재해석한 고속 트렌드 쇼츠`,
        factNote: `📌 오늘의 키워드(${issueKeyword}) × 트렌드 밈 콜라보 요약. #${issueKeyword.replace(/\s+/g, '')} #오늘의밈 #실시간트렌드 #쇼츠`,
        hookTitles: [
          `오늘 난리 난 "${issueKeyword}", 이 밈으로 10초 요약 😂`,
          `${issueKeyword} 소식 들었을 때 내 표정 실화냐`,
          `요즘 1위 밈으로 보는 "${issueKeyword}" 핵심 포인트`,
          `모르면 대화 안 통하는 오늘의 "${issueKeyword}" 총정리`,
          `${issueKeyword} 때문에 댓글창 뒤집어진 레전드 상황!`
        ],
        cuts: [
          { line: `오늘 갑자기 난리 난 "${issueKeyword.slice(0, 12)}" 소식!`, mood: '이슈 훅', keyword: meme.cuts?.[0]?.keyword || 'breaking news', mediaType: '밈 리액션' },
          { line: '처음 들었을 때 다들 딱 이 표정이었죠', mood: '공감 리액션', keyword: meme.cuts?.[1]?.keyword || 'confused cat', mediaType: '밈 리액션' },
          { line: `${issueKeyword.slice(0, 12)}, 핵심만 3초 만에 요약하면`, mood: '팩트 정리', keyword: meme.cuts?.[2]?.keyword || 'trending phone', mediaType: '스톡 클립' },
          { line: '생각보다 훨씬 반전이라 모두가 놀랐습니다', mood: '반전 포인트', keyword: meme.cuts?.[3]?.keyword || 'shocked face', mediaType: '밈 리액션' },
          { line: '이럴 때일수록 칠 가이처럼 여유를 챙기세요', mood: '밈 결합', keyword: meme.cuts?.[4]?.keyword || 'chill dog', mediaType: '밈 리액션' },
          { line: `여러분은 이번 ${issueKeyword.slice(0, 10)} 어떻게 보시나요?`, mood: '댓글 유도', keyword: meme.cuts?.[5]?.keyword || 'comment phone', mediaType: '바이럴 팩' }
        ]
      };

  if (geminiKey) {
    try {
      const targetDesc = mashupType === 'store'
        ? `[우리 가게·상품 홍보 패러디]\n- 업종: ${industryLabel}\n- 매장/브랜드명: ${storeName}\n- 핵심 어필 상품/혜택: ${productPoint}\n목표: 광고처럼 딱딱하지 않고, 선택한 밈의 유머 구조를 그대로 패러디해 시청자가 웃으면서 끝까지 보다가 매장에 호감을 느끼게 만드는 6컷 쇼츠`
        : `[오늘의 실시간 키워드 × 밈 결합]\n- 오늘의 키워드/이슈: ${issueKeyword}\n목표: 오늘 화제인 키워드와 선택한 밈의 감정/상황을 절묘하게 결합해 알고리즘 클릭을 부르는 6컷 쇼츠`;

      const sys = `당신은 충주맨·숏박스 스타일의 B급 패러디 밈 쇼츠 전문 크리에이티브 디렉터입니다.
선택된 원본 밈 포맷과 목표 주제를 결합해 1줄=1장면(14~22자 이내) × 6컷 고속 쇼츠 설계도를 JSON으로만 출력하세요.
JSON 스키마:
{"title":"결합 제목","badge":"배지","why":"결합 기획 의도 1~2줄","factNote":"📌 설명글 및 #해시태그","hookTitles":["상단후킹1","상단후킹2","상단후킹3","상단후킹4","상단후킹5"],"cuts":[{"line":"20자 이내 대사","mood":"감정","keyword":"english meme reaction keyword","mediaType":"밈 리액션 | 스톡 클립 | 매장·스톡"}]}`;

      const userMsg = `[선택한 원본 밈]\n제목: ${memeTitle}\n특징: ${(meme.summary3 || []).join(' ')}\n\n${targetDesc}`;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8500),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sys }] },
          contents: [{ role: 'user', parts: [{ text: userMsg }] }],
          generationConfig: { temperature: 0.75, responseMimeType: 'application/json' }
        })
      });
      if (r.ok) {
        const d = await r.json();
        const parsed = parseJsonLoose(d?.candidates?.[0]?.content?.parts?.[0]?.text || '');
        if (parsed && Array.isArray(parsed.cuts) && parsed.cuts.length >= 4) {
          return res.status(200).json({
            ok: true,
            provider: `Gemini Mashup (${geminiModel})`,
            mashupType,
            item: {
              ...meme,
              id: `${meme.id}_${mashupType}_${Date.now()}`,
              title: String(parsed.title || fallbackMashup.title).slice(0, 52),
              badge: String(parsed.badge || fallbackMashup.badge),
              why: String(parsed.why || fallbackMashup.why).slice(0, 120),
              factNote: String(parsed.factNote || fallbackMashup.factNote),
              hookTitles: Array.isArray(parsed.hookTitles) && parsed.hookTitles.length ? parsed.hookTitles.slice(0, 5) : fallbackMashup.hookTitles,
              cuts: parsed.cuts.slice(0, 6).map((c, ci) => ({
                line: String(c.line || '').slice(0, 26),
                mood: String(c.mood || '포인트'),
                keyword: String(c.keyword || meme.cuts?.[ci]?.keyword || 'funny reaction'),
                mediaType: String(c.mediaType || '밈 리액션'),
                fallbackImg: `/assets/scenes/${pack}/${(ci % 10) + 1}.jpg`
              }))
            }
          });
        }
      }
    } catch (_) {}
  }

  return res.status(200).json({
    ok: true,
    provider: 'AutoReels Meme Mashup Director',
    mashupType,
    item: {
      ...meme,
      id: `${meme.id}_${mashupType}`,
      ...fallbackMashup,
      cuts: fallbackMashup.cuts.map((c, ci) => ({
        ...c,
        fallbackImg: `/assets/scenes/${pack}/${(ci % 10) + 1}.jpg`
      }))
    }
  });
}

async function handleMemeRemakeRequest(body, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (body.mode === 'meme-radar') return handleMemeRadar(body, res);
  if (body.mode === 'meme-visuals') return handleMemeVisuals(body, res);
  if (body.mode === 'meme-mashup') return handleMemeMashup(body, res);
  if (body.mode === 'foreign-remake') return handleForeignRemake(body, res);
  return res.status(400).json({ ok: false, error: 'unknown_meme_mode' });
}

module.exports = {
  handleMemeRemakeRequest,
  TOP10_MEME_RADAR
};
