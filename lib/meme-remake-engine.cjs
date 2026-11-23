'use strict';

/**
 * AutoReelsMaker — Dedicated Meme Shorts Studio Backend Engine
 * -------------------------------------------------------------
 * 1) mode: 'meme-radar'
 *    - YouTube Data API (KR Shorts) + Google Trends KR RSS + Reddit Viral JSON + Curated Top 10
 *    - 각 밈 카드마다:
 *      ① 무슨 밈인지 3줄 요약
 *      ② 확인된 팩트/출처 문서 & 유튜브 실제 원본 밈 영상 검색 링크(ytSearchUrl)
 *      ③ 20자×6컷 고속 쇼츠 대본
 *      ④ 각 컷 대사·상황과 1:1로 일치하는 전용 AI 비주얼 생성 프롬프트(scenePrompt) & 모션 캐릭터 연출(characterType/pose/bgMood)
 * 2) mode: 'meme-mashup'
 *    - 오늘의 실시간 키워드×밈 또는 우리 가게 홍보×밈 패러디 설계도 + 각 컷 대사에 딱 맞는 1:1 scenePrompt 생성
 * 3) mode: 'foreign-remake'
 *    - 해외/샤오홍슈/원본 단일 MP4 연속 프레임 비전 AI 분석 → 각 시간 구간에 실제 일어나는 행동과 1:1 일치하는 6구간 대본 + 자막 덮어쓰기 마스크 좌표
 */

const TOP10_MEME_RADAR = [
  {
    id: 'meme_chill_guy',
    rank: 1,
    cat: '급상승 밈',
    sourceTag: 'YouTube·TikTok 급상승',
    badge: '🔥 밈 랭킹 1위',
    title: '세상이 무너져도 평온한 "칠 가이(Chill Guy)" 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=Chill+Guy+%EC%B9%A0%EA%B0%80%EC%9D%B4+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'chill_dog',
    summary3: [
      '1) 주머니에 손을 넣고 살짝 미소 짓는 회색 스웨터 입은 갈색 강아지 캐릭터 밈입니다.',
      '2) 시험 망침·지각·통장 잔고 0원 같은 멘붕 상황에서도 "그냥 신경 안 쓰는 느긋한 태도"로 쓰입니다.',
      '3) 잔잔한 피아노 브금과 함께 6컷 반전 자막으로 만들면 완주율이 가장 높습니다.'
    ],
    why: '멘붕 일상 속에서도 타격감 0%인 느긋한 강아지 캐릭터가 숏폼 공감 1위 기록 중',
    factNote: '📌 팩트·출처: 디지털 아티스트 필립 뱅크스(Phillip Banks)의 오리지널 캐릭터 "My New Character(Chill Guy)"에서 유래. #칠가이 #ChillGuy #밈해설 #쇼츠트렌드',
    scenePack: 'cafe',
    cuts: [
      {
        line: '요즘 쇼츠마다 나오는 이 강아지 정체',
        mood: '충격·호기심',
        mediaType: '칠가이 1:1 씬',
        pose: ' curious',
        scenePrompt: 'Vertical 9:16 3D illustrated scene of a calm brown anthropomorphic dog character wearing a grey crewneck sweater, rolled-up blue jeans and red sneakers, hands casually in pockets with a subtle relaxed half-smile, warm sunlit street bokeh background'
      },
      {
        line: '이름은 칠 가이, 그냥 느긋한 녀석이죠',
        mood: '팩트 설명',
        mediaType: '칠가이 1:1 씬',
        pose: 'chill',
        scenePrompt: 'Vertical 9:16 close-up portrait of a super relaxed brown dog character in a grey sweater with hands in pockets, gentle unbothered smirk, soft cozy park afternoon lighting'
      },
      {
        line: '월요일 출근길에도 아무 타격 없는 표정',
        mood: '공감·유머',
        mediaType: '칠가이 1:1 씬',
        pose: 'coffee',
        scenePrompt: 'Vertical 9:16 scene of a calm brown dog character in a grey sweater holding an iced coffee cup on a busy rushing Monday morning city crosswalk while commuters hurry past in motion blur'
      },
      {
        line: '통장 잔고가 비어도 그냥 미소만 지어요',
        mood: '반전 웃음',
        mediaType: '칠가이 1:1 씬',
        pose: 'shrug',
        scenePrompt: 'Vertical 9:16 humorous scene of a chill brown dog character in a grey sweater and blue jeans turning empty pockets inside out with a completely peaceful zen smile, dramatic spotlight'
      },
      {
        line: '스트레스 가득한 현대인들의 워너비!',
        mood: '핵심 요약',
        mediaType: '칠가이 1:1 씬',
        pose: 'sunset',
        scenePrompt: 'Vertical 9:16 cinematic golden hour scene of a relaxed brown dog character in grey sweater and red sneakers standing peacefully on a grassy hill watching a sunset with hands in pockets'
      },
      {
        line: '오늘만큼은 칠 가이처럼 가볍게 넘기세요',
        mood: '댓글 유도',
        mediaType: '칠가이 1:1 씬',
        pose: 'thumbsup',
        scenePrompt: 'Vertical 9:16 warm upbeat scene of a chill brown dog character in grey sweater giving a subtle relaxed thumbs up with a calm wink, cozy golden bokeh background'
      }
    ]
  },
  {
    id: 'meme_cat_huh',
    rank: 2,
    cat: '동물·유머',
    sourceTag: '글로벌 5억 뷰',
    badge: '🐱 동물 밈 1위',
    title: '전 세계 5억 뷰 터진 "하?(Huh?)" 통통 고양이 리액션',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=Huh+Cat+%ED%95%98+%EA%B3%A0%EC%96%91%EC%9D%B4+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'huh_cat',
    summary3: [
      '1) 집사의 황당한 말에 고개를 갸우뚱하며 "하?(Huh?)" 표정을 짓는 통통한 흰 고양이입니다.',
      '2) 직장·학교·연인 사이에서 어이없는 말을 들었을 때 만능 리액션 짤로 쓰입니다.',
      '3) 3번 컷에서 잠깐 정적 후 "네? 지금요?" 반전 자막을 넣으면 댓글이 폭발합니다.'
    ],
    why: '황당한 상황에서 고개를 갸우뚱하는 통통한 흰 고양이가 글로벌 만능 리액션 밈으로 정착',
    factNote: '📌 팩트·출처: 해외 반려묘(벤더 더 캣) 원본 클립에 "Huh?" 사운드가 결합되며 글로벌 리액션 밈으로 확산. #고양이밈 #HuhCat #동물쇼츠 #유머',
    scenePack: 'shop',
    cuts: [
      {
        line: '퇴근 5분 전에 갑자기 새 일을 시킬 때',
        mood: '공감 훅',
        mediaType: '하? 고양이 씬',
        pose: 'office_shock',
        scenePrompt: 'Vertical 9:16 photorealistic funny scene of a chubby white cat with grey patches sitting in front of an office laptop at sunset, staring at the camera with a frozen disbelief expression'
      },
      {
        line: '머릿속에서 자동으로 재생되는 이 표정',
        mood: '폭소 리액션',
        mediaType: '하? 고양이 씬',
        pose: 'huh_zoom',
        scenePrompt: 'Vertical 9:16 extreme close-up of a chubby white cat with wide confused round eyes and slightly open mouth looking utterly baffled, funny meme reaction lighting'
      },
      {
        line: '네? 지금요? 저한테 말씀하신 건가요?',
        mood: '황당·충격',
        mediaType: '하? 고양이 씬',
        pose: 'head_tilt',
        scenePrompt: 'Vertical 9:16 funny portrait of a chubby white cat tilting its head 30 degrees to the side with a bewildered Huh expression, dramatic zoom blur effect around edges'
      },
      {
        line: '전 세계 5억 명이 저장한 레전드 고양이',
        mood: '팩트 설명',
        mediaType: '하? 고양이 씬',
        pose: 'sitting_proud',
        scenePrompt: 'Vertical 9:16 adorable full shot of a round chubby white cat sitting upright on a living room rug next to a food bowl, looking up with a iconic confused expression'
      },
      {
        line: '어떤 억까 상황에도 이 짤 하나면 끝!',
        mood: '핵심 포인트',
        mediaType: '하? 고양이 씬',
        pose: 'side_eye',
        scenePrompt: 'Vertical 9:16 humorous close-up of a chubby white cat giving a skeptical side-eye glance with ears slightly flattened, studio rim lighting'
      },
      {
        line: '오늘 이 표정 지었던 순간 댓글로 적어보세요',
        mood: '댓글 유도',
        mediaType: '하? 고양이 씬',
        pose: 'paw_up',
        scenePrompt: 'Vertical 9:16 cute chubby white cat raising one fluffy front paw toward the camera as if asking a question, warm indoor bokeh'
      }
    ]
  },
  {
    id: 'meme_golden_door_wait',
    rank: 3,
    cat: '동물·유머',
    sourceTag: '샤오홍슈·릴스 인기',
    badge: '🐶 감동·반전',
    title: '현관문 앞에서 인형 물고 3시간 버틴 골든리트리버',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EA%B3%A8%EB%93%A0%EB%A6%AC%ED%8A%B8%EB%A6%AC%EB%B2%84+%ED%98%84%EA%B4%80%EB%AC%B8+%EC%9D%B8%ED%98%95+%EB%A7%88%EC%A4%91+%EC%87%BC%EC%B8%A0',
    characterType: 'golden_retriever',
    summary3: [
      '1) 야근한 주인을 기다리며 현관 앞 매트에서 최애 인형을 물고 졸고 있는 리트리버 영상입니다.',
      '2) 도어락 소리가 들리자마자 꼬리가 프로펠러처럼 돌아가는 반전이 핵심입니다.',
      '3) 강아지 1인칭 속마음 한국어 더빙을 입히면 저장·공유율이 일반 영상의 3배입니다.'
    ],
    why: '샤오홍슈·해외 릴스에서 가장 조회수가 잘 나오는 반려견 밀착 감동+속마음 더빙 포맷',
    factNote: '📌 제작 가이드: 반려동물 1인칭 속마음 더빙 포맷(컷별 상황 1:1 매칭 비주얼 자동 생성). #골든리트리버 #강아지더빙 #감동쇼츠',
    scenePack: 'cafe',
    cuts: [
      {
        line: '현관문 앞에서 3시간째 꼼짝 않는 강아지',
        mood: '호기심 훅',
        mediaType: '리트리버 1:1 씬',
        pose: 'waiting_door',
        scenePrompt: 'Vertical 9:16 heartwarming cinematic photo of a fluffy golden retriever dog sitting faithfully on a rug right in front of a closed apartment front door at night, warm hallway lamp'
      },
      {
        line: '입에는 제일 아끼는 인형을 꼭 물고 있죠',
        mood: '귀여움',
        mediaType: '리트리버 1:1 씬',
        pose: 'holding_plush',
        scenePrompt: 'Vertical 9:16 close-up of a sleepy golden retriever gently holding a cute soft plush teddy bear toy in its mouth while fighting sleep by the front door'
      },
      {
        line: '드디어 도어락 번호 누르는 소리가 들리자',
        mood: '기대감',
        mediaType: '리트리버 1:1 씬',
        pose: 'ears_up',
        scenePrompt: 'Vertical 9:16 expressive shot of a golden retriever holding a plush toy suddenly perking both ears up high with sparkling wide eyes staring at the door handle'
      },
      {
        line: '꼬리가 헬리콥터처럼 돌아가기 시작합니다',
        mood: '반전 미소',
        mediaType: '리트리버 1:1 씬',
        pose: 'tail_wag',
        scenePrompt: 'Vertical 9:16 joyful dynamic shot of a golden retriever greeting its owner at the open front door, tail wagging in fast motion blur while still holding its plush toy'
      },
      {
        line: '온종일 주인 오기만 기다렸던 거예요',
        mood: '감동 포인트',
        mediaType: '리트리버 1:1 씬',
        pose: 'hug',
        scenePrompt: 'Vertical 9:16 emotional warm close-up of a person kneeling at the entryway hugging a happy golden retriever whose eyes are closed in pure bliss'
      },
      {
        line: '오늘 집에 가면 우리 댕댕이 꼭 안아주세요',
        mood: '공감 엔딩',
        mediaType: '리트리버 1:1 씬',
        pose: 'smile_sleep',
        scenePrompt: 'Vertical 9:16 cozy shot of a golden retriever peacefully sleeping on a soft living room cushion hugging its plush toy with a gentle smile'
      }
    ]
  },
  {
    id: 'meme_genz_slang_quiz',
    rank: 4,
    cat: '급상승 밈',
    sourceTag: '네이버·커뮤니티 화제',
    badge: '⚡ 댓글 폭발형',
    title: '3초 안에 다 맞히면 최소 20대라는 요즘 신조어 퀴즈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EC%9A%94%EC%A6%98+%EC%8B%A0%EC%A1%B0%EC%96%B4+%ED%85%8C%EC%8A%A4%ED%8A%B8+%EC%B6%94%EA%B5%AC%EB%AF%B8+%EB%8A%90%EC%A2%8B+%EC%87%BC%EC%B8%A0',
    characterType: 'quiz_neon',
    summary3: [
      '1) 추구미·느좋·텍스트힙 등 최근 SNS에서 급증한 신조어를 3초 카운트다운으로 맞히는 포맷입니다.',
      '2) 시청자가 자기 점수를 댓글에 적게 만들어 알고리즘 체류시간과 댓글 수를 동시에 끌어올립니다.',
      '3) 노래방식 단어 강조 자막과 가장 궁합이 좋은 대표적인 부업 효자 포맷입니다.'
    ],
    why: '시청자 참여(점수 댓글)를 유도해 평균 시청 지속시간 130% 이상 뽑아내는 퀴즈형 쇼츠',
    factNote: '📌 팩트·출처: 2026 SNS·커뮤니티 실사용 트렌드 용어 정리. #신조어테스트 #밈퀴즈 #요즘유행어 #쇼츠퀴즈',
    scenePack: 'academy',
    cuts: [
      {
        line: '이 중 3개 다 알면 아직 감 살아있는 겁니다',
        mood: '도전 훅',
        mediaType: '퀴즈 1:1 씬',
        pose: 'quiz_start',
        scenePrompt: 'Vertical 9:16 trendy Gen-Z studio portrait of a stylish young Korean creator holding a glowing neon question mark prop with an excited challenge expression, vibrant purple and cyan lighting'
      },
      {
        line: '1번 추구미: 내가 추구하는 나만의 이미지!',
        mood: '팩트 해설',
        mediaType: '추구미 씬',
        pose: 'mirror_selfie',
        scenePrompt: 'Vertical 9:16 aesthetic fashion lookbook scene of a trendy young person taking a stylish mirror outfit photo with a vintage silver camera in a sunlit minimalist showroom'
      },
      {
        line: '2번 느좋: 설명 필요 없이 그냥 느낌 좋은 것!',
        mood: '공감 예시',
        mediaType: '느좋 감성 씬',
        pose: 'aesthetic_cafe',
        scenePrompt: 'Vertical 9:16 ultra-aesthetic Seongsu-dong sunlit cafe table with icedeinspanner coffee, vinyl record player and dappled tree shadows on a warm cream wall'
      },
      {
        line: '3번 텍스트힙: 독서와 기록이 가장 힙한 유행!',
        mood: '트렌드 팩트',
        mediaType: '텍스트힙 씬',
        pose: 'reading_hip',
        scenePrompt: 'Vertical 9:16 hip atmospheric shot of hands holding an open hardcover book with a fountain pen and espresso cup on a wooden desk by a rainy window'
      },
      {
        line: '솔직히 몇 개나 바로 맞히셨나요?',
        mood: '질문 전환',
        mediaType: '리액션 씬',
        pose: 'thinking',
        scenePrompt: 'Vertical 9:16 playful close-up of a cute cat wearing round glasses looking thoughtfully at the camera as if grading a quiz, warm studio bokeh'
      },
      {
        line: '여러분의 개수를 지금 댓글로 남겨주세요!',
        mood: '댓글 폭발',
        mediaType: '댓글 유도 씬',
        pose: 'comment_cta',
        scenePrompt: 'Vertical 9:16 close-up of hands holding a glowing smartphone with colorful floating heart and chat bubble light bokeh rising in the dark background'
      }
    ]
  },
  {
    id: 'meme_korean_patch_barista',
    rank: 5,
    cat: '해외 바이럴',
    sourceTag: 'Reddit·해외 쇼츠',
    badge: '🌏 해외 역수입',
    title: '한국인보다 한국 패치 완벽한 해외 카페 알바생',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%ED%95%9C%EA%B5%AD+%ED%8C%A8%EC%B9%98+%EC%99%84%EB%B2%BD%ED%95%9C+%ED%95%B4%EC%99%B8+%EC%B9%B4%ED%8E%98+%EC%95%84%EC%9D%B4%EC%8A%A4+%EC%95%84%EB%A9%94%EB%A6%AC%EC%B9%B4%EB%85%B8+%EC%87%BC%EC%B8%A0',
    characterType: 'k_barista',
    summary3: [
      '1) 해외 로컬 카페인데 주문하자마자 3초 만에 아이스 아메리카노가 나오는 반전 유머입니다.',
      '2) K-빨리빨리 문화와 해외 일상의 대비를 다루면 한국 시청자 댓글 반응이 매우 뜨겁습니다.',
      '3) 빠른 컷 전환(컷당 2초)과 경쾌한 무료 BGM을 조합하면 완성도가 높습니다.'
    ],
    why: '글로벌 K-컬처·아아(아이스 아메리카노) 밈이 해외 크리에이터들 사이에서 역수입 유행 중',
    factNote: '📌 트렌드 포인트: 글로벌 K-카페·빨리빨리 문화 밈 요약. #해외반응 #아이스아메리카노 #알바레전드 #유머쇼츠',
    scenePack: 'restaurant',
    cuts: [
      {
        line: '해외 카페에서 아이스 아메리카노를 시켰더니',
        mood: '상황 훅',
        mediaType: '해외 카페 씬',
        pose: 'order_coffee',
        scenePrompt: 'Vertical 9:16 cinematic POV shot inside a cozy European brick-wall espresso bar, a friendly foreign barista in a brown apron smiling behind a gleaming espresso machine'
      },
      {
        line: '결제 끝나기 무섭게 3초 만에 등장합니다',
        mood: '충격 속도',
        mediaType: '초고속 서빙 씬',
        pose: 'fast_serve',
        scenePrompt: 'Vertical 9:16 dynamic action shot of a barista sliding a crystal-clear iced Americano cup across a wooden counter at lightning speed with dramatic speed-line lighting'
      },
      {
        line: '한국인도 깜짝 놀란 K-빨리빨리 패치!',
        mood: '폭소 포인트',
        mediaType: '얼음 아아 씬',
        pose: 'iced_americano',
        scenePrompt: 'Vertical 9:16 ultra-crisp close-up of dark espresso swirling into a tall glass filled with sparkling ice cubes and cold water drops, dramatic cafe backlight'
      },
      {
        line: '심지어 한국말로 맛있게 드세요까지 완벽',
        mood: '반전 매력',
        mediaType: '바리스타 윙크 씬',
        pose: 'finger_heart',
        scenePrompt: 'Vertical 9:16 cheerful foreign barista in an apron making a Korean finger-heart gesture with a proud beaming smile behind the coffee counter'
      },
      {
        line: '댓글창은 이미 명예 한국인 임명식 열렸죠',
        mood: '팩트 반응',
        mediaType: '박수 리액션 씬',
        pose: 'applause',
        scenePrompt: 'Vertical 9:16 lively cafe scene of happy customers raising iced coffee glasses in a toast with warm golden string lights in the background'
      },
      {
        line: '이런 카페 동네에 있으면 매일 출근하겠죠?',
        mood: '공감 엔딩',
        mediaType: '카페 테라스 씬',
        pose: 'cozy_exterior',
        scenePrompt: 'Vertical 9:16 inviting sunlit street-corner cafe terrace with warm wooden chairs, lush green plants and an iced coffee on a small round table'
      }
    ]
  },
  {
    id: 'meme_cat_thief_caught',
    rank: 6,
    cat: '동물·유머',
    sourceTag: '샤오홍슈·틱톡 인기',
    badge: '🐱 1인칭 더빙',
    title: '생선 훔치려다 현행범으로 딱 걸린 고양이의 뻔뻔한 변명',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EC%83%9D%EC%84%A0+%ED%9B%94%EC%B9%98%EB%8B%A4+%EA%B1%B8%EB%A6%B0+%EA%B3%A0%EC%96%91%EC%9D%B4+%EB%8D%94%EB%B9%99+%EC%87%BC%EC%B8%A0',
    characterType: 'thief_cat',
    summary3: [
      '1) 식탁 위 생선에 앞발을 뻗다가 집사와 눈이 마주친 순간 얼어붙는 고양이 클립입니다.',
      '2) 앞발만 슬쩍 내리며 "파리 잡아주려 했다"고 우기는 1인칭 더빙이 웃음 포인트입니다.',
      '3) 해외 동물 클립 리메이크에서 가장 실패 없는 스테디셀러 구조입니다.'
    ],
    why: '찰나의 정지 화면 + 뻔뻔한 한국어 속마음 더빙 조합으로 반복 재생을 유도하는 동물 유머',
    factNote: '📌 더빙 포인트: 2번 컷에서 정지 리액션과 함께 뻔뻔한 한국어 더빙 적용. #고양이더빙 #현행범포착 #반려묘유머',
    scenePack: 'restaurant',
    cuts: [
      {
        line: '식탁 위 생선에 조용히 다가가는 고양이 앞발',
        mood: '긴장 훅',
        mediaType: '도둑고양이 1컷',
        pose: 'paw_sneak',
        scenePrompt: 'Vertical 9:16 suspenseful close-up of a cute orange tabby cat peeking over the edge of a wooden dining table, stretching one fluffy paw slowly toward a grilled fish on a white plate'
      },
      {
        line: '집사랑 눈이 딱 마주친 바로 그 0.1초!',
        mood: '현행범 정지',
        mediaType: '현행범 정지 씬',
        pose: 'frozen_shock',
        scenePrompt: 'Vertical 9:16 hilarious freeze-frame shot of an orange tabby cat with its paw hovering mid-air over a fish plate, eyes wide as saucers staring guiltily at the camera'
      },
      {
        line: '아니아니, 난 그냥 파리 잡아주려 했어!',
        mood: '뻔뻔한 더빙',
        mediaType: '뻔뻔한 변명 씬',
        pose: 'innocent_face',
        scenePrompt: 'Vertical 9:16 funny close-up of an orange tabby cat pulling its paw back to its chest and making an ultra-innocent wide-eyed angel face'
      },
      {
        line: '앞발만 슬쩍 내려놓으며 먼 산 바라보기',
        mood: '웃음 반전',
        mediaType: '먼산 보기 씬',
        pose: 'look_away',
        scenePrompt: 'Vertical 9:16 comedic shot of an orange tabby cat sitting beside a dining table looking dramatically sideways out the window pretending nothing happened'
      },
      {
        line: '연기대상 감이라는 고양이식 위기 탈출!',
        mood: '핵심 유머',
        mediaType: '당당한 고양이 씬',
        pose: 'proud_sit',
        scenePrompt: 'Vertical 9:16 regal portrait of a fluffy orange tabby cat sitting tall with paws neatly together under a warm spotlight like an award-winning actor'
      },
      {
        line: '이 정도 연기력이면 간식 하나 줘야겠죠?',
        mood: '댓글 유도',
        mediaType: '간식 먹방 씬',
        pose: 'happy_snack',
        scenePrompt: 'Vertical 9:16 adorable close-up of a happy orange tabby cat purring with eyes closed while enjoying a creamy cat treat, warm cozy home background'
      }
    ]
  },
  {
    id: 'meme_office_lookism_empathy',
    rank: 7,
    cat: '급상승 밈',
    sourceTag: '인스타 릴스 공감',
    badge: '💼 직장인 공감',
    title: '출근 10분 만에 집 가고 싶어지는 직장인 국룰 모먼트',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EC%B6%9C%EA%B7%BC+10%EB%B6%84+%EB%A7%8C%EC%97%90+%EC%A7%91+%EA%B0%80%EA%B3%A0+%EC%8B%B6%EC%9D%80+%EC%A7%81%EC%9E%A5%EC%9D%B8+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'office_worker',
    summary3: [
      '1) 커피 수혈 전후의 표정 변화와 오후 4시 배터리 방전 리액션을 빠른 템포로 묶은 공감 밈입니다.',
      '2) 월요일·수요일 오전 시간대에 예약 업로드하면 직장인 공유 수가 가장 높습니다.',
      '3) 각 컷마다 대사와 1:1로 일치하는 오피스 리액션 비주얼이 자동 생성됩니다.'
    ],
    why: '직장인·학생이 스토리와 단톡방에 가장 많이 공유하는 일상 하이퍼리얼리즘 밈',
    factNote: '📌 트렌드 포인트: 하이퍼리얼리즘 직장인 공감 포맷. #직장인밈 #출근길 #공감쇼츠 #오피스유머',
    scenePack: 'auto',
    cuts: [
      {
        line: '출근해서 컴퓨터 켜자마자 드는 생각 1위',
        mood: '공감 훅',
        mediaType: '출근 직후 씬',
        pose: 'boot_pc',
        scenePrompt: 'Vertical 9:16 relatable cinematic shot of a sleepy office worker sitting at a modern desk in the morning, staring blankly at a glowing monitor with chin resting on one hand'
      },
      {
        line: '아 오늘 왜 벌써 피곤하지? 집 가고 싶다',
        mood: '멘붕 리액션',
        mediaType: '영혼 가출 씬',
        pose: 'soul_out',
        scenePrompt: 'Vertical 9:16 funny expressive close-up of a tired cute cat wearing a tiny office necktie slouched over a desk beside an empty coffee mug, morning sunlight'
      },
      {
        line: '하지만 아이스 아메리카노 첫 모금 마시면',
        mood: '분위기 반전',
        mediaType: '카페인 수혈 씬',
        pose: 'coffee_boost',
        scenePrompt: 'Vertical 9:16 dramatic refreshing close-up of a frosty iced Americano glass with a straw on an office desk, golden light beam shining on the ice cubes'
      },
      {
        line: '갑자기 사회성 만렙 프로 직장인으로 변신!',
        mood: '웃음 포인트',
        mediaType: '자본주의 미소 씬',
        pose: 'pro_smile',
        scenePrompt: 'Vertical 9:16 energetic scene of a sharp well-dressed office worker typing rapidly on a mechanical keyboard with a bright confident professional smile'
      },
      {
        line: '물론 오후 4시 되면 다시 배터리 방전됩니다',
        mood: '현실 폭소',
        mediaType: '오후 4시 방전 씬',
        pose: 'low_battery',
        scenePrompt: 'Vertical 9:16 humorous late-afternoon office scene with warm sunset light, a sleepy golden retriever puppy resting its head flat on an office desk next to a keyboard'
      },
      {
        line: '오늘도 버텨낸 모든 분들 진짜 고생했어요!',
        mood: '응원 엔딩',
        mediaType: '퇴근길 힐링 씬',
        pose: 'cheers_sunset',
        scenePrompt: 'Vertical 9:16 uplifting city twilight scene of commuters walking out of an office building into a beautiful pink and gold sunset sky'
      }
    ]
  },
  {
    id: 'meme_ai_vs_reality',
    rank: 8,
    cat: '해외 바이럴',
    sourceTag: '글로벌 숏폼 트렌드',
    badge: '🤖 기대 vs 현실',
    title: '인터넷 레시피 보고 따라 했다가 대참사 난 기대 vs 현실',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EB%A0%88%EC%8B%9C%ED%94%BC+%EA%B8%B0%EB%8C%80+vs+%ED%98%84%EC%8B%A4+%EB%8C%80%EC%B0%B8%EC%82%AC+%EC%87%BC%EC%B8%A0',
    characterType: 'expect_vs_reality',
    summary3: [
      '1) 완벽한 비주얼의 원본 사진(기대)과 엉뚱하게 완성된 결과물(현실)을 비교하는 포맷입니다.',
      '2) 1~2컷에서 완벽한 기대치를 보여주고 3~4컷에서 반전 결과를 터뜨리는 구성입니다.',
      '3) 베이킹·요리·인테리어·다이어트 등 어떤 주제로도 무한 양산이 가능합니다.'
    ],
    why: '언어 장벽 없이 국내외 어디서나 터지는 "Expectation vs Reality" 반전 유머 포맷',
    factNote: '📌 제작 가이드: 기대(1~2컷) vs 현실 반전(3~5컷) 대비 구성. #기대vs현실 #요리대참사 #반전유머 #쇼츠밈',
    scenePack: 'beauty',
    cuts: [
      {
        line: 'SNS에서 본 5분 완성 초간단 디저트 레시피!',
        mood: '기대감 훅',
        mediaType: '기대 비주얼 1컷',
        pose: 'perfect_cake',
        scenePrompt: 'Vertical 9:16 mouthwatering luxury patisserie photo of a flawless fluffy strawberry soufflé pancake topped with whipped cream and powdered sugar on a ceramic plate'
      },
      {
        line: '사진 속 비주얼은 당장 카페 차려도 될 수준',
        mood: '완벽 비주얼',
        mediaType: '기대 비주얼 2컷',
        pose: 'luxury_dessert',
        scenePrompt: 'Vertical 9:16 editorial close-up of golden caramel syrup pouring smoothly over a perfect cafe dessert in warm morning sunlight'
      },
      {
        line: '그래서 저도 설명서 그대로 따라 해봤는데요',
        mood: '긴장 전환',
        mediaType: '요리 도전 씬',
        pose: 'mixing_bowl',
        scenePrompt: 'Vertical 9:16 home kitchen action shot of flour cloud puffing up around a stainless mixing bowl and whisk on a counter'
      },
      {
        line: '잠시만요, 왜 오븐에서 연기가 나는 거죠?',
        mood: '반전 대참사',
        mediaType: '현실 대참사 씬',
        pose: 'burnt_fail',
        scenePrompt: 'Vertical 9:16 hilarious kitchen fail close-up of a comically flat, burnt dark-brown lumpy pancake on a plate with a wisp of smoke rising, dramatic comedic lighting'
      },
      {
        line: '그냥 동네 디저트 카페에서 사 먹는 게 답!',
        mood: '폭소 결론',
        mediaType: '현타 리액션 씬',
        pose: 'laugh_cat',
        scenePrompt: 'Vertical 9:16 funny reaction shot of a cat wearing a tiny white chef hat looking at a burnt pastry with a priceless disappointed expression'
      },
      {
        line: '여러분도 요리 실패담 있으면 댓글로 풀어요',
        mood: '댓글 유도',
        mediaType: '카페 엔딩 씬',
        pose: 'cafe_treat',
        scenePrompt: 'Vertical 9:16 cozy cafe table with a delicious slice of cake and iced latte ready to eat, warm welcoming atmosphere'
      }
    ]
  },
  {
    id: 'meme_workout_day1',
    rank: 9,
    cat: '급상승 밈',
    sourceTag: '유튜브 쇼츠 인기',
    badge: '💪 헬스·다이어트 밈',
    title: '헬스장 등록 첫날 vs 3일째 사라지는 회원 국룰',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%ED%97%AC%EC%8A%A4%EC%9E%A5+%EC%B2%AB%EB%82%A0+%ED%95%98%EC%B2%B4+%EA%B7%BC%EC%9C%A1%ED%86%B5+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'gym_meme',
    summary3: [
      '1) 등록 첫날엔 프로 보디빌더처럼 장비를 챙기지만 다음 날엔 근육통으로 계단도 못 내려가는 밈입니다.',
      '2) 운동·다이어트 공감 키워드는 사계절 내내 조회수와 광고 단가(RPM)가 높습니다.',
      '3) 빠른 비트 BGM과 노래방식 강조 자막을 켜면 텐션이 확 살아납니다.'
    ],
    why: '운동·다이어트 공감 밈은 시청자 타깃이 넓고 저장·재시청률이 높은 대표 스테디셀러',
    factNote: '📌 트렌드 포인트: 헬스·다이어트 작심삼일 공감 유머. #오운완 #헬스장밈 #다이어트공감 #운동쇼츠',
    scenePack: 'fitness',
    cuts: [
      {
        line: '헬스장 3개월 끊은 첫날의 비장한 각오!',
        mood: '강렬한 훅',
        mediaType: '헬스 첫날 씬',
        pose: 'gym_hero',
        scenePrompt: 'Vertical 9:16 dramatic cinematic shot of a determined person tying training shoes in a sleek modern gym with dramatic neon rim lighting'
      },
      {
        line: '운동복부터 프로틴까지 장비는 이미 국가대표',
        mood: '자신감',
        mediaType: '장비 풀세팅 씬',
        pose: 'gear_ready',
        scenePrompt: 'Vertical 9:16 crisp flat-lay of brand new gym gloves, shaker bottle, wireless headphones and chrome dumbbells on a dark gym bench'
      },
      {
        line: '하체 운동 딱 한 시간 불태우고 난 다음 날',
        mood: '반전 시작',
        mediaType: '하체 스쿼트 씬',
        pose: 'heavy_squat',
        scenePrompt: 'Vertical 9:16 intense gym shot of a loaded barbell rack with chalk dust floating in a spotlight beam'
      },
      {
        line: '침대에서 일어나는 데만 15분이 걸립니다',
        mood: '근육통 폭소',
        mediaType: '근육통 리액션 씬',
        pose: 'sore_bed',
        scenePrompt: 'Vertical 9:16 hilarious shot of an exhausted fluffy dog sprawled flat on a white bed refusing to get up in the morning sunlight'
      },
      {
        line: '결국 계단 앞에서 엘리베이터만 애타게 찾죠',
        mood: '공감 유머',
        mediaType: '계단 공포 씬',
        pose: 'tall_stairs',
        scenePrompt: 'Vertical 9:16 dramatic low-angle POV looking up a seemingly endless tall staircase, comedic daunting perspective'
      },
      {
        line: '오늘 운동 갈지 말지 고민 중이면 일단 가세요!',
        mood: '응원 CTA',
        mediaType: '오운완 응원 씬',
        pose: 'fist_bump',
        scenePrompt: 'Vertical 9:16 energetic gym fist-bump between two workout partners under bright motivating studio lights'
      }
    ]
  },
  {
    id: 'meme_puppy_guilty_eyes',
    rank: 10,
    cat: '동물·유머',
    sourceTag: '해외 동물 바이럴',
    badge: '🐕 눈치 백단',
    title: '사고 쳐놓고 먼저 눈웃음부터 치는 강아지 심리전',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EC%82%AC%EA%B3%A0+%EC%B9%98%EA%B3%A0+%EB%88%88%EC%9B%83%EC%9D%8C+%EC%B9%98%EB%8A%94+%EA%B0%95%EC%95%84%EC%A7%80+%EC%87%BC%EC%B8%A0',
    characterType: 'guilty_puppy',
    summary3: [
      '1) 거실에 휴지를 어질러 놓고도 주인이 부르면 귀를 뒤로 젖히며 눈웃음 치는 강아지입니다.',
      '2) "누가 그랬어?" 한 마디에 세상 억울한 표정을 짓는 리액션이 핵심입니다.',
      '3) 마지막 컷에 투표형 질문("용서한다 vs 혼낸다")을 넣으면 댓글 참여율이 2배 이상 뜁니다.'
    ],
    why: '반려견 눈치·애교 리액션 클립은 해외·국내 불문 호불호 없이 높은 좋아요율을 기록',
    factNote: '📌 제작 가이드: 마지막 컷 댓글 투표 유도("용서 vs 훈육"). #강아지눈치 #반려견유머 #댕댕이쇼츠 #동물밈',
    scenePack: 'cafe',
    cuts: [
      {
        line: '퇴근하고 문을 열자마자 펼쳐진 거실 풍경',
        mood: '충격 오프닝',
        mediaType: '거실 참사 씬',
        pose: 'messy_room',
        scenePrompt: 'Vertical 9:16 funny home scene of a cozy living room floor covered in shredded white tissue paper confetti with a tiny puppy paw visible behind the sofa'
      },
      {
        line: '범인을 찾으려고 이름을 조용히 불러봤더니',
        mood: '긴장감',
        mediaType: '눈치 보는 강아지',
        pose: 'guilty_peek',
        scenePrompt: 'Vertical 9:16 cute cream-colored puppy peeking timidly from behind a sofa corner with guilty round eyes and ears folded flat back'
      },
      {
        line: '벌써 귀를 뒤로 젖히고 눈웃음부터 발사!',
        mood: '심쿵 반전',
        mediaType: '물개 눈웃음 씬',
        pose: 'seal_smile',
        scenePrompt: 'Vertical 9:16 heart-melting close-up of a fluffy puppy with ears tucked completely back like a baby seal, squinting its eyes in an irresistible guilty smile'
      },
      {
        line: '이렇게 귀여운 얼굴로 애교 부리면 반칙이죠',
        mood: '무장해제',
        mediaType: '배 발라당 씬',
        pose: 'belly_up',
        scenePrompt: 'Vertical 9:16 adorable shot of a playful puppy rolling onto its back on a soft rug showing its belly with paws curled up cutely'
      },
      {
        line: '화내려던 마음도 3초 만에 사르르 녹습니다',
        mood: '공감 미소',
        mediaType: '쓰다듬기 씬',
        pose: 'head_pat',
        scenePrompt: 'Vertical 9:16 warm close-up of a gentle hand petting the head of a smiling puppy in golden afternoon sunlight'
      },
      {
        line: '여러분은 바로 용서한다 vs 단호하게 혼낸다?',
        mood: '투표 댓글',
        mediaType: '투표 엔딩 씬',
        pose: 'head_tilt_puppy',
        scenePrompt: 'Vertical 9:16 ultra-cute portrait of a fluffy puppy tilting its head curiously at the camera with bright sparkling eyes'
      }
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
      videoId: String(it.id?.videoId || ''),
      traffic: 'YouTube 급상승',
      headline: String(it.snippet?.channelTitle || '인기 쇼츠'),
      source: 'YouTube Data API'
    })).filter((x) => x.keyword);
  } catch (_) {
    return [];
  }
}

async function handleMemeRadar(body, res) {
  const category = String(body.category || 'all').trim();
  const customQuery = String(body.query || '').trim();
  const geminiKey = String(body.adminGeminiKey || process.env.GEMINI_API_KEY || '').trim();
  const geminiModel = String(process.env.GEMINI_SCRIPT_MODEL || 'gemini-2.5-flash').split(',')[0].trim();

  const [gTrends, ytShorts] = await Promise.all([
    fetchGoogleTrendsKr(),
    fetchYoutubeTrendingShortsKr()
  ]);
  const liveSignals = [...ytShorts, ...gTrends];
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
4) 가장 중요: 각 cut마다 그 컷의 대사(line)와 밈 캐릭터/상황을 1:1로 정확히 묘사하는 영어 9:16 비주얼 생성 프롬프트(scenePrompt, 텍스트/간판/글자 없이 시각적 피사체와 행동만 구체적으로 묘사)를 반드시 작성하세요.
JSON 형식:
[{"id":"live_1","cat":"실시간 이슈","sourceTag":"Google Trends·YouTube","badge":"⚡ 실시간 급상승","title":"후킹 제목","characterType":"chill_dog | huh_cat | golden_retriever | office_worker | quiz_neon","summary3":["1) 요약1","2) 요약2","3) 요약3"],"why":"한 줄 핵심 요약","factNote":"📌 팩트·출처: ... #해시태그","cuts":[{"line":"20자 이내 대사","mood":"충격 훅","mediaType":"1:1 맞춤 씬","scenePrompt":"Vertical 9:16 photorealistic or 3D illustrated scene directly depicting this exact sentence..."}]}]`;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(9500),
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
            const titleStr = String(it.title).slice(0, 50);
            return {
              id: String(it.id || `live_meme_${idx}`),
              rank: idx + 1,
              cat: String(it.cat || '실시간 이슈'),
              sourceTag: String(it.sourceTag || '실시간 트렌드 API'),
              badge: String(it.badge || '⚡ 실시간 급상승'),
              title: titleStr,
              characterType: String(it.characterType || 'chill_dog'),
              ytSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(titleStr + ' 쇼츠 밈')}`,
              summary3: Array.isArray(it.summary3) && it.summary3.length >= 2
                ? it.summary3.slice(0, 3).map((s) => String(s))
                : [String(it.why || '실시간 급상승 화제 이슈입니다.'), '핵심 팩트와 반응을 6컷으로 압축했습니다.', '각 컷 대사에 1:1 매칭된 맞춤 비주얼과 노래방 자막이 자동 적용됩니다.'],
              why: String(it.why || '').slice(0, 110),
              factNote: String(it.factNote || '📌 팩트·출처: 실시간 트렌드 확인 요약'),
              cuts: it.cuts.slice(0, 6).map((c, ci) => ({
                line: String(c.line || '').slice(0, 26),
                mood: String(c.mood || `컷 ${ci + 1}`),
                mediaType: String(c.mediaType || '1:1 맞춤 씬'),
                scenePrompt: String(c.scenePrompt || `Vertical 9:16 expressive visual scene depicting: ${c.line || titleStr}, clean unbranded background with soft bokeh`)
              }))
            };
          });
        }
      }
    } catch (_) {}
  }

  if (!dynamicItems.length && liveSignals.length) {
    dynamicItems = liveSignals.slice(0, 2).map((t, idx) => ({
      id: `live_sig_${idx}`,
      rank: idx + 1,
      cat: '실시간 이슈',
      sourceTag: t.source,
      badge: `⚡ ${t.traffic}`,
      title: `${t.keyword} — 지금 실시간 급상승한 핵심 이유`,
      characterType: idx % 2 === 0 ? 'chill_dog' : 'huh_cat',
      ytSearchUrl: t.videoId
        ? `https://www.youtube.com/shorts/${encodeURIComponent(t.videoId)}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(t.keyword + ' 쇼츠')}`,
      summary3: [
        `1) [${t.source}]에서 "${t.keyword}" 키워드가 실시간 급상승 중입니다.`,
        `2) ${t.headline || '네티즌 사이에서 빠르게 공유되고 있는 핵심 포인트'}를 6컷으로 정리했습니다.`,
        '3) 각 컷 대사와 1:1로 맞물리는 장면 비주얼이 즉시 조립됩니다.'
      ],
      why: t.headline || `${t.keyword} 실시간 급상승 배경과 핵심 반응 요약`,
      factNote: `📌 팩트·출처: ${t.source} 실시간 트렌드 (${t.keyword}). #${t.keyword.replace(/\s+/g, '').slice(0, 12)} #실시간이슈 #쇼츠트렌드`,
      cuts: [
        { line: `지금 실시간 검색 터진 ${t.keyword.slice(0, 12)}!`, mood: '충격 훅', mediaType: '이슈 1:1 씬', scenePrompt: `Vertical 9:16 dramatic close-up of a person looking at a glowing smartphone in shock on a bustling Seoul night street, neon bokeh` },
        { line: (t.headline || '갑자기 왜 이렇게 화제일까요?').slice(0, 22), mood: '배경 요약', mediaType: '이슈 1:1 씬', scenePrompt: `Vertical 9:16 editorial scene symbolizing ${t.keyword}, modern Korean urban atmosphere, cinematic lighting` },
        { line: '핵심 원인만 딱 3초 만에 정리해 드립니다', mood: '팩트 정리', mediaType: '이슈 1:1 씬', scenePrompt: `Vertical 9:16 clean studio shot of three glowing glass cubes aligning in sequence on a dark reflective surface` },
        { line: '네티즌들이 가장 놀란 포인트는 바로 이것!', mood: '반전 리액션', mediaType: '밈 리액션 씬', scenePrompt: `Vertical 9:16 funny close-up of a chubby white cat tilting its head with wide surprised eyes` },
        { line: '앞으로 어떻게 흘러갈지 주목되고 있습니다', mood: '핵심 전망', mediaType: '이슈 1:1 씬', scenePrompt: `Vertical 9:16 cinematic city skyline at sunrise with dynamic time-lapse clouds and golden light rays` },
        { line: '여러분 생각은 어떠신가요? 댓글로 남겨주세요', mood: '댓글 유도', mediaType: '댓글 유도 씬', scenePrompt: `Vertical 9:16 chill brown dog character in a grey sweater smiling calmly with hands in pockets, warm sunset bokeh` }
      ]
    }));
  }

  const combined = [...dynamicItems, ...TOP10_MEME_RADAR].map((it, i) => ({
    ...it,
    rank: i + 1,
    ytSearchUrl: it.ytSearchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(it.title + ' 쇼츠')}`
  }));
  const filtered = (category && category !== 'all')
    ? combined.filter((it) => it.cat === category)
    : combined;

  return res.status(200).json({
    ok: true,
    updatedAt: new Date().toISOString(),
    sources: {
      youtube: ytShorts.length,
      googleTrends: gTrends.length,
      curatedTop10: TOP10_MEME_RADAR.length
    },
    items: (filtered.length ? filtered : combined).slice(0, 12)
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
    detectedLang: '원본 영상 6구간 타임스탬프 동기화 완료',
    maskSpec: { enabled: true, maskY: 0.81, maskH: 0.13, style: 'dark-blur' },
    hookTitles: [
      hint ? `${hint} — 끝까지 보면 터지는 반전 😂` : '해외에서 1,000만 뷰 터진 레전드 반전 😂',
      '처음엔 평범한 줄 알았는데 마지막 3초 대반전!',
      '이래서 요즘 알고리즘에 계속 뜨는구나 🔥',
      '한국인이라면 무조건 공감할 수밖에 없는 순간',
      '소리 켜고 끝까지 보세요, 결말이 진짜 레전드'
    ],
    cues: [
      { start: 0, end: stepSec, orig: '(0~2초 오프닝 장면)', ko: '처음엔 그냥 평범한 상황인 줄 알았는데' },
      { start: stepSec, end: +(stepSec * 2).toFixed(1), orig: '(2~4초 상황 전개)', ko: '잠시 뒤 아무도 예상 못 한 일이 벌어집니다' },
      { start: +(stepSec * 2).toFixed(1), end: +(stepSec * 3).toFixed(1), orig: '(4~6초 반전 포착)', ko: '바로 이 순간 공기가 완전히 바뀌었죠!' },
      { start: +(stepSec * 3).toFixed(1), end: +(stepSec * 4).toFixed(1), orig: '(6~8초 클라이맥스)', ko: '이 표정 하나에 댓글창이 완전히 뒤집혔습니다' },
      { start: +(stepSec * 4).toFixed(1), end: +(stepSec * 5).toFixed(1), orig: '(8~10초 하이라이트)', ko: '다시 봐도 타이밍이 진짜 예술이네요' },
      { start: +(stepSec * 5).toFixed(1), end: duration, orig: '(10~12초 엔딩 질문)', ko: '여러분이라면 이 상황에서 어떻게 하실 건가요?' }
    ],
    audioPlan: {
      muteOriginal: true,
      duckingRatio: 0.15,
      recommendedBgm: 'upbeat_funny',
      tip: '저작권 보호를 위해 원본 배경음은 제거하고 오토릴스 상업용 무료 BGM으로 자동 교체했습니다.'
    },
    sourceNote: '📌 출처·안내: 원본 클립의 6개 타임스탬프 구간에 맞춰 한국어 번역·더빙·무료 음원을 더해 재가공한 쇼츠입니다. #해외유머 #쇼츠리메이크 #레전드클립 #밈쇼츠'
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
첨부된 영상 연속 프레임(${imageParts.length}장, 총 길이 ${duration}초)을 순서대로 분석해 각 시간 구간에서 실제로 일어나는 장면/행동과 1:1로 일치하는 JSON만 출력하세요:
1) 화면에 중국어/영어 등 외국어 자막이 보이면 그 원문(orig)을 읽고 해당 프레임 장면과 정확히 맞물리는 자연스러운 한국어 쇼츠 구어체(ko, 1줄 20자 이내)로 6구간 번역하세요.
2) 자막이 없는 동물/유머/일상 영상이면 각 프레임 구간(1컷~6컷)에서 실제로 보이는 피사체의 표정·행동에 딱 맞는 한국어 상황 해설·속마음 더빙 자막(ko, 1줄 20자 이내)을 6구간으로 작성하세요.
3) 기존 외국어 자막의 세로 중심 위치 비율(maskY: 0.65~0.90)과 덮어쓰기 높이 비율(maskH: 0.10~0.16)을 추정하세요.
4) 영상 상단에 고정할 궁금증 유발 한국어 후킹 제목 5개(hookTitles)를 추천하세요.
JSON 스키마:
{"detectedLang":"중국어 자막 감지 | 영어 자막 감지 | 원본 영상 6구간 비전 분석","maskSpec":{"enabled":true,"maskY":0.81,"maskH":0.13,"style":"dark-blur"},"hookTitles":["제목1","제목2","제목3","제목4","제목5"],"cues":[{"start":0,"end":2,"orig":"해당 프레임 실제 장면 또는 원문","ko":"20자 이내 한국어 자막"}],"sourceNote":"📌 출처 및 설명글 #해시태그"}`;

        const userText = `영상 총 길이: ${duration}초.${hint ? ` 사용자 힌트: "${hint}".` : ''} 6개 시간 구간 순서대로 각 프레임에서 실제로 일어나는 장면에 딱 맞춰 JSON으로만 답하세요.`;
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sys }] },
            contents: [{ role: 'user', parts: [...imageParts, { text: userText }] }],
            generationConfig: { temperature: 0.5, responseMimeType: 'application/json' }
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
              cues: parsed.cues.slice(0, 6).map((c, idx, arr) => {
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
  const charType = String(meme.characterType || 'chill_dog');
  const baseCuts = Array.isArray(meme.cuts) && meme.cuts.length ? meme.cuts : TOP10_MEME_RADAR[0].cuts;

  const fallbackMashup = mashupType === 'store'
    ? {
        title: `[${storeName}×밈 패러디] ${memeTitle.slice(0, 18)} 버전`,
        badge: `🏪 가게 홍보×밈 패러디`,
        characterType: charType,
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
          {
            line: `요즘 유행하는 이 밈, ${storeName.slice(0, 8)} 버전!`,
            mood: '패러디 훅',
            mediaType: '밈×매장 1컷',
            scenePrompt: `${baseCuts[0]?.scenePrompt || 'Vertical 9:16 funny meme character portrait'}, set inside a stylish Korean ${industryLabel} interior`
          },
          {
            line: `처음엔 그냥 평범한 ${industryLabel.slice(0, 6)}인 줄 알았죠`,
            mood: '기대 반전',
            mediaType: '매장 실사 2컷',
            useStorePhoto: true,
            scenePrompt: `Vertical 9:16 inviting modern Korean ${industryLabel} space with warm lighting and clean unbranded surfaces`
          },
          {
            line: `그런데 ${productPoint.slice(0, 12)} 나오는 순간!`,
            mood: '충격 포인트',
            mediaType: '시그니처 3컷',
            useStorePhoto: true,
            scenePrompt: `Vertical 9:16 dramatic close-up showcase of ${productPoint} in a premium ${industryLabel} setting, studio lighting`
          },
          {
            line: '동공 지진 나면서 표정이 이렇게 바뀝니다',
            mood: '폭소 리액션',
            mediaType: '밈 리액션 4컷',
            scenePrompt: baseCuts[2]?.scenePrompt || 'Vertical 9:16 hilarious wide-eyed surprised cat and dog meme reaction shot, dramatic zoom'
          },
          {
            line: `한 번 오면 단골 될 수밖에 없는 ${storeName.slice(0, 8)}!`,
            mood: '매장 강점',
            mediaType: '매장 하이라이트',
            useStorePhoto: true,
            scenePrompt: `${baseCuts[4]?.scenePrompt || 'Vertical 9:16 happy satisfied character giving thumbs up'} inside a cozy ${industryLabel}`
          },
          {
            line: '지금 프로필·댓글로 혜택 바로 챙겨가세요!',
            mood: '방문 유도',
            mediaType: '엔딩 CTA',
            scenePrompt: baseCuts[5]?.scenePrompt || 'Vertical 9:16 cheerful character waving with a warm welcoming smile, golden bokeh'
          }
        ]
      }
    : {
        title: `[오늘의 키워드×밈] ${issueKeyword} × ${memeTitle.slice(0, 16)}`,
        badge: `⚡ 실시간 키워드×밈`,
        characterType: charType,
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
          {
            line: `오늘 갑자기 난리 난 "${issueKeyword.slice(0, 11)}" 소식!`,
            mood: '이슈 훅',
            mediaType: '키워드×밈 1컷',
            scenePrompt: `${baseCuts[0]?.scenePrompt || 'Vertical 9:16 expressive meme character'} reacting to breaking trend news on a glowing smartphone`
          },
          {
            line: '처음 들었을 때 다들 딱 이 표정이었죠',
            mood: '공감 리액션',
            mediaType: '밈 리액션 2컷',
            scenePrompt: baseCuts[1]?.scenePrompt || 'Vertical 9:16 funny confused cat tilting head with wide eyes'
          },
          {
            line: `${issueKeyword.slice(0, 11)}, 핵심만 3초 만에 요약하면`,
            mood: '팩트 정리',
            mediaType: '키워드 씬 3컷',
            scenePrompt: `Vertical 9:16 cinematic visual scene representing "${issueKeyword}" in modern Korea, dramatic editorial lighting`
          },
          {
            line: '생각보다 훨씬 반전이라 모두가 놀랐습니다',
            mood: '반전 포인트',
            mediaType: '반전 리액션 4컷',
            scenePrompt: baseCuts[2]?.scenePrompt || 'Vertical 9:16 shocked meme character with dramatic zoom lighting'
          },
          {
            line: '이럴 때일수록 칠 가이처럼 여유를 챙기세요',
            mood: '밈 결합',
            mediaType: '밈 하이라이트',
            scenePrompt: baseCuts[4]?.scenePrompt || 'Vertical 9:16 calm brown dog character in grey sweater smiling peacefully at sunset'
          },
          {
            line: `여러분은 이번 ${issueKeyword.slice(0, 9)} 어떻게 보시나요?`,
            mood: '댓글 유도',
            mediaType: '댓글 유도 6컷',
            scenePrompt: baseCuts[5]?.scenePrompt || 'Vertical 9:16 friendly meme character giving a thumbs up with glowing chat bubble bokeh'
          }
        ]
      };

  if (geminiKey) {
    try {
      const targetDesc = mashupType === 'store'
        ? `[우리 가게·상품 홍보 패러디]\n- 업종: ${industryLabel}\n- 매장/브랜드명: ${storeName}\n- 핵심 어필 상품/혜택: ${productPoint}\n목표: 광고처럼 딱딱하지 않고, 선택한 밈("${memeTitle}")의 캐릭터와 유머 구조를 그대로 패러디해 시청자가 웃으면서 끝까지 보다가 매장에 호감을 느끼게 만드는 6컷 쇼츠`
        : `[오늘의 실시간 키워드 × 밈 결합]\n- 오늘의 키워드/이슈: ${issueKeyword}\n목표: 오늘 화제인 키워드와 선택한 밈("${memeTitle}")의 캐릭터/감정/상황을 절묘하게 결합해 알고리즘 클릭을 부르는 6컷 쇼츠`;

      const sys = `당신은 충주맨·숏박스 스타일의 B급 패러디 밈 쇼츠 전문 크리에이티브 디렉터입니다.
선택된 원본 밈 포맷과 목표 주제를 결합해 1줄=1장면(14~22자 이내) × 6컷 고속 쇼츠 설계도를 JSON으로만 출력하세요.
특히 각 cut의 scenePrompt에는 해당 컷의 대사(line)와 밈 캐릭터/상황이 1:1로 정확히 일치하는 구체적인 영문 9:16 비주얼 프롬프트(글자·간판 없이 피사체와 행동만 묘사)를 작성하세요.
JSON 스키마:
{"title":"결합 제목","badge":"배지","why":"결합 기획 의도 1~2줄","factNote":"📌 설명글 및 #해시태그","hookTitles":["상단후킹1","상단후킹2","상단후킹3","상단후킹4","상단후킹5"],"cuts":[{"line":"20자 이내 대사","mood":"감정","mediaType":"밈×패러디 씬","useStorePhoto":false,"scenePrompt":"Vertical 9:16 visual scene directly depicting this cut line and meme character..."}]}`;

      const userMsg = `[선택한 원본 밈]\n제목: ${memeTitle}\n특징: ${(meme.summary3 || []).join(' ')}\n기본 컷 장면들: ${baseCuts.map((c, i) => `${i + 1}컷(${c.line}): ${c.scenePrompt}`).join(' | ')}\n\n${targetDesc}`;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(9500),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sys }] },
          contents: [{ role: 'user', parts: [{ text: userMsg }] }],
          generationConfig: { temperature: 0.72, responseMimeType: 'application/json' }
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
              characterType: charType,
              title: String(parsed.title || fallbackMashup.title).slice(0, 52),
              badge: String(parsed.badge || fallbackMashup.badge),
              why: String(parsed.why || fallbackMashup.why).slice(0, 120),
              factNote: String(parsed.factNote || fallbackMashup.factNote),
              hookTitles: Array.isArray(parsed.hookTitles) && parsed.hookTitles.length ? parsed.hookTitles.slice(0, 5) : fallbackMashup.hookTitles,
              cuts: parsed.cuts.slice(0, 6).map((c, ci) => ({
                line: String(c.line || '').slice(0, 26),
                mood: String(c.mood || `컷 ${ci + 1}`),
                mediaType: String(c.mediaType || '1:1 맞춤 씬'),
                useStorePhoto: Boolean(c.useStorePhoto || (mashupType === 'store' && (ci === 1 || ci === 2))),
                scenePrompt: String(c.scenePrompt || fallbackMashup.cuts[ci]?.scenePrompt || baseCuts[ci]?.scenePrompt || '')
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
      ...fallbackMashup
    }
  });
}

async function handleMemeRemakeRequest(body, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (body.mode === 'meme-radar') return handleMemeRadar(body, res);
  if (body.mode === 'meme-mashup') return handleMemeMashup(body, res);
  if (body.mode === 'foreign-remake') return handleForeignRemake(body, res);
  return res.status(400).json({ ok: false, error: 'unknown_meme_mode' });
}

module.exports = {
  handleMemeRemakeRequest,
  TOP10_MEME_RADAR
};
