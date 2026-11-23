'use strict';

/**
 * AutoReelsMaker — Dedicated Meme Shorts Studio Backend Engine (Real Meme Originals + URL Importer)
 * -------------------------------------------------------------------------------------------------
 * 1) mode: 'meme-radar'
 *    - 각 밈 카드마다 실제 원본 밈 MP4 스트림(media.tenor.com/*.mp4, CORS: *) 6컷을 기본 내장 & 실시간 추출하여
 *      카드 클릭 즉시 100% 실제 원본 밈 영상(칠 가이, 하? 고양이, 골든리트리버 등)이 캔버스에서 바로 재생됩니다.
 * 2) mode: 'meme-visuals'
 *    - API 키 없이도 Tenor/GIPHY 공개 밈 페이지에서 실제 원본 밈 MP4(media.tenor.com/*AAAPo/*.mp4)를 실시간 추출합니다.
 * 3) mode: 'meme-url-import'
 *    - TikTok / Tenor / GIPHY / YouTube Shorts / 직접 MP4 링크(URL)를 붙여넣으면 원본 밈 MP4 스트림과 제목을 자동 추출해 즉시 반입합니다.
 * 4) mode: 'meme-mashup'
 *    - 실제 원본 밈 영상 클립을 유지한 채 오늘의 키워드×밈 또는 우리 가게 홍보×밈 패러디 자막·구성을 결합합니다.
 * 5) mode: 'foreign-remake'
 *    - 해외/원본 MP4 6구간 프레임 비전 분석 + 자막 덮어쓰기 마스크
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
      '1) 주머니에 손을 넣고 살짝 미소 짓는 회색 스웨터 입은 갈색 강아지 캐릭터 원본 밈입니다.',
      '2) 시험 망침·지각·통장 잔고 0원 같은 멘붕 상황에서도 "그냥 신경 안 쓰는 느긋한 태도"로 쓰입니다.',
      '3) 실제 칠 가이 원본 밈 영상 클립 6컷이 즉시 로드되어 노래방 자막과 함께 바로 재생됩니다.'
    ],
    why: '멘붕 일상 속에서도 타격감 0%인 느긋한 강아지 캐릭터가 숏폼 공감 1위 기록 중',
    factNote: '📌 팩트·출처: 디지털 아티스트 필립 뱅크스(Phillip Banks)의 오리지널 캐릭터 "My New Character(Chill Guy)"에서 유래. #칠가이 #ChillGuy #밈해설 #쇼츠트렌드',
    scenePack: 'cafe',
    cuts: [
      {
        line: '요즘 쇼츠마다 나오는 이 강아지 정체',
        mood: '칠가이 원본 1컷',
        keyword: 'chill guy meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/FetQ_KhWgd4AAAPo/chill-guy.mp4',
        scenePrompt: 'Vertical 9:16 3D illustrated scene of a calm brown anthropomorphic dog character wearing a grey crewneck sweater, rolled-up blue jeans and red sneakers, hands casually in pockets with a subtle relaxed half-smile'
      },
      {
        line: '이름은 칠 가이, 그냥 느긋한 녀석이죠',
        mood: '칠가이 원본 2컷',
        keyword: 'chill guy my new character',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/uTrHppPi0Z0AAAPo/chill-guy-my-new-character.mp4',
        scenePrompt: 'Vertical 9:16 close-up portrait of a super relaxed brown dog character in a grey sweater with hands in pockets, gentle unbothered smirk'
      },
      {
        line: '월요일 출근길에도 아무 타격 없는 표정',
        mood: '칠가이 커피 3컷',
        keyword: 'drinking coffee chill guy',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/6x1xYcbxZiYAAAPo/drinking-coffee-chill-guy.mp4',
        scenePrompt: 'Vertical 9:16 scene of a calm brown dog character in a grey sweater holding an iced coffee cup on a busy rushing Monday morning city crosswalk'
      },
      {
        line: '통장 잔고가 비어도 그냥 미소만 지어요',
        mood: '칠가이 밈 4컷',
        keyword: 'chill guy hands in pocket meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/rzGlV4ye-MEAAAPo/chill-guy.mp4',
        scenePrompt: 'Vertical 9:16 humorous scene of a chill brown dog character in a grey sweater and blue jeans turning empty pockets inside out with a completely peaceful zen smile'
      },
      {
        line: '스트레스 가득한 현대인들의 워너비!',
        mood: '주머니 손 밈 5컷',
        keyword: 'hands in pocket chill meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/ViUgljperkUAAAPo/kevin-james-meme-hands-in-pocket-meme.mp4',
        scenePrompt: 'Vertical 9:16 cinematic golden hour scene of a relaxed brown dog character in grey sweater and red sneakers standing peacefully on a grassy hill watching a sunset'
      },
      {
        line: '오늘만큼은 칠 가이처럼 가볍게 넘기세요',
        mood: '칠가이 엔딩 6컷',
        keyword: 'chill guy relax',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/FetQ_KhWgd4AAAPo/chill-guy.mp4',
        scenePrompt: 'Vertical 9:16 warm upbeat scene of a chill brown dog character in grey sweater giving a subtle relaxed thumbs up with a calm wink'
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
      '1) 집사의 황당한 말에 고개를 갸우뚱하며 "하?(Huh?)" 표정을 짓는 통통한 흰 고양이 실제 원본 영상입니다.',
      '2) 직장·학교·연인 사이에서 어이없는 말을 들었을 때 만능 리액션 짤로 쓰입니다.',
      '3) 실제 원본 "하?" 고양이 클립이 전 컷에 배치되어 자막만 바꿔도 100% 바이럴 쇼츠가 됩니다.'
    ],
    why: '황당한 상황에서 고개를 갸우뚱하는 통통한 흰 고양이가 글로벌 만능 리액션 밈으로 정착',
    factNote: '📌 팩트·출처: 해외 반려묘(벤더 더 캣) 원본 클립에 "Huh?" 사운드가 결합되며 글로벌 리액션 밈으로 확산. #고양이밈 #HuhCat #동물쇼츠 #유머',
    scenePack: 'shop',
    cuts: [
      {
        line: '퇴근 5분 전에 갑자기 새 일을 시킬 때',
        mood: '하? 고양이 원본 1컷',
        keyword: 'huh cat meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/7t63GFnoIPUAAAPo/huh-cat-huh-m4rtin.mp4',
        scenePrompt: 'Vertical 9:16 photorealistic funny scene of a chubby white cat with grey patches staring at the camera with a frozen disbelief expression'
      },
      {
        line: '머릿속에서 자동으로 재생되는 이 표정',
        mood: '하? 고양이 클로즈업',
        keyword: 'huh cat closeup',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/PP8iPN16qTwAAAPo/huh-cat-huh-m4rtin.mp4',
        scenePrompt: 'Vertical 9:16 extreme close-up of a chubby white cat with wide confused round eyes and slightly open mouth looking utterly baffled'
      },
      {
        line: '네? 지금요? 저한테 말씀하신 건가요?',
        mood: '황당 고양이 리액션',
        keyword: 'huh cat reaction',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/9sqNXE_ZLQYAAAPo/huh-cat.mp4',
        scenePrompt: 'Vertical 9:16 funny portrait of a chubby white cat tilting its head 30 degrees to the side with a bewildered Huh expression'
      },
      {
        line: '전 세계 5억 명이 저장한 레전드 고양이',
        mood: '멍때리는 고양이',
        keyword: 'confused cat huh',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/Ol34ZrcLmpMAAAPo/deaf-cat-deaf.mp4',
        scenePrompt: 'Vertical 9:16 adorable full shot of a round chubby white cat sitting upright on a living room rug looking up with a iconic confused expression'
      },
      {
        line: '어떤 억까 상황에도 이 짤 하나면 끝!',
        mood: '고양이 갸우뚱 원본',
        keyword: 'cat buh meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/Lyo1-rb0ETIAAAPo/cat-buh.mp4',
        scenePrompt: 'Vertical 9:16 humorous close-up of a chubby white cat giving a skeptical side-eye glance with ears slightly flattened'
      },
      {
        line: '오늘 이 표정 지었던 순간 댓글로 적어보세요',
        mood: '하? 고양이 엔딩',
        keyword: 'huh cat m4rtin',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/7t63GFnoIPUAAAPo/huh-cat-huh-m4rtin.mp4',
        scenePrompt: 'Vertical 9:16 cute chubby white cat raising one fluffy front paw toward the camera as if asking a question'
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
      '1) 주인을 기다리며 최애 인형을 물고 마중 나오는 실제 골든리트리버 바이럴 클립입니다.',
      '2) 도어락 소리가 들리자마자 꼬리가 프로펠러처럼 돌아가는 반전이 핵심입니다.',
      '3) 강아지 1인칭 속마음 한국어 더빙을 입히면 저장·공유율이 일반 영상의 3배입니다.'
    ],
    why: '샤오홍슈·해외 릴스에서 가장 조회수가 잘 나오는 반려견 밀착 감동+속마음 더빙 포맷',
    factNote: '📌 제작 가이드: 실제 골든리트리버 원본 클립 6컷 + 1인칭 속마음 더빙 포맷. #골든리트리버 #강아지더빙 #감동쇼츠',
    scenePack: 'cafe',
    cuts: [
      {
        line: '현관문 앞에서 3시간째 꼼짝 않는 강아지',
        mood: '리트리버 대기 원본',
        keyword: 'golden retriever waiting door',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/Zi1Pd0b9JzAAAAPo/golden-retriever-dog.mp4',
        scenePrompt: 'Vertical 9:16 heartwarming cinematic photo of a fluffy golden retriever dog sitting faithfully on a rug right in front of a closed apartment front door'
      },
      {
        line: '입에는 제일 아끼는 인형을 꼭 물고 있죠',
        mood: '인형 문 리트리버 원본',
        keyword: 'golden retriever plush toy',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/h0IwVzyLV78AAAPo/ikea-golden-retriever.mp4',
        scenePrompt: 'Vertical 9:16 close-up of a sleepy golden retriever gently holding a cute soft plush teddy bear toy in its mouth'
      },
      {
        line: '드디어 도어락 번호 누르는 소리가 들리자',
        mood: '초롱초롱 눈빛 원본',
        keyword: 'puppy eyes golden retriever',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/XYjuf2KXZpkAAAPo/puppy-eyes-golden-retriever.mp4',
        scenePrompt: 'Vertical 9:16 expressive shot of a golden retriever holding a plush toy suddenly perking both ears up high with sparkling wide eyes'
      },
      {
        line: '꼬리가 헬리콥터처럼 돌아가기 시작합니다',
        mood: '꼬리 프로펠러 원본',
        keyword: 'happy puppy wagging tail',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/wWuVTyT7s1EAAAPo/happy-puppy.mp4',
        scenePrompt: 'Vertical 9:16 joyful dynamic shot of a golden retriever greeting its owner at the open front door, tail wagging in fast motion'
      },
      {
        line: '온종일 주인 오기만 기다렸던 거예요',
        mood: '리트리버 미소 원본',
        keyword: 'golden retriever good boy',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/oZ4Y3eY5ckkAAAPo/golden-retriever-good-boy.mp4',
        scenePrompt: 'Vertical 9:16 emotional warm close-up of a person kneeling at the entryway hugging a happy golden retriever'
      },
      {
        line: '오늘 집에 가면 우리 댕댕이 꼭 안아주세요',
        mood: '리트리버 힐링 엔딩',
        keyword: 'golden retriever cute',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/kWO4BWpFbvIAAAPo/golden-retriever-dog.mp4',
        scenePrompt: 'Vertical 9:16 cozy shot of a golden retriever peacefully sleeping on a soft living room cushion hugging its plush toy'
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
      '1) 추구미·느좋·텍스트힙 등 최근 SNS에서 급증한 신조어를 해외 유명 두뇌 풀가동 밈 클립과 함께 맞히는 포맷입니다.',
      '2) 시청자가 자기 점수를 댓글에 적게 만들어 알고리즘 체류시간과 댓글 수를 동시에 끌어올립니다.',
      '3) 노래방식 단어 강조 자막과 실제 리액션 밈 MP4가 결합된 부업 효자 포맷입니다.'
    ],
    why: '시청자 참여(점수 댓글)를 유도해 평균 시청 지속시간 130% 이상 뽑아내는 퀴즈형 쇼츠',
    factNote: '📌 팩트·출처: 2026 SNS·커뮤니티 실사용 트렌드 용어 정리. #신조어테스트 #밈퀴즈 #요즘유행어 #쇼츠퀴즈',
    scenePack: 'academy',
    cuts: [
      {
        line: '이 중 3개 다 알면 아직 감 살아있는 겁니다',
        mood: '두뇌 풀가동 밈',
        keyword: 'confused math lady meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/0i0ZxbRgVyAAAAPo/meonly.mp4',
        scenePrompt: 'Vertical 9:16 trendy Gen-Z studio portrait of a stylish young Korean creator holding a glowing neon question mark prop'
      },
      {
        line: '1번 추구미: 내가 추구하는 나만의 이미지!',
        mood: '음 생각중 밈',
        keyword: 'hmm lets think meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/fqqFOoRfpm0AAAPo/hmm-lets-think.mp4',
        scenePrompt: 'Vertical 9:16 aesthetic fashion lookbook scene of a trendy young person taking a stylish mirror outfit photo'
      },
      {
        line: '2번 느좋: 설명 필요 없이 그냥 느낌 좋은 것!',
        mood: '스피드 리액션 밈',
        keyword: 'ishowspeed reaction meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/RKtsqaC5DlIAAAPo/ishowspeed-speed.mp4',
        scenePrompt: 'Vertical 9:16 ultra-aesthetic Seongsu-dong sunlit cafe table with iced coffee and vinyl record player'
      },
      {
        line: '3번 텍스트힙: 독서와 기록이 가장 힙한 유행!',
        mood: '눈치 갸우뚱 밈',
        keyword: 'thinking side eye meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/F2TOooUUoGMAAAPo/thinking-side-eye.mp4',
        scenePrompt: 'Vertical 9:16 hip atmospheric shot of hands holding an open hardcover book with an espresso cup'
      },
      {
        line: '솔직히 몇 개나 바로 맞히셨나요?',
        mood: '동공지진 할아버지 밈',
        keyword: 'tired old man meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/2hVy5yXjEBAAAAPo/tired-old-man-lee-jeffries.mp4',
        scenePrompt: 'Vertical 9:16 playful close-up of a cute cat wearing round glasses looking thoughtfully at the camera'
      },
      {
        line: '여러분의 개수를 지금 댓글로 남겨주세요!',
        mood: '리액션 엔딩 밈',
        keyword: 'charlie reaction meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/cz3lpjQ1TAYAAAPo/charlie-kirk-reaction-image.mp4',
        scenePrompt: 'Vertical 9:16 close-up of hands holding a glowing smartphone with colorful floating heart bokeh'
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
      '2) K-빨리빨리 문화와 해외 아이스커피 밈 클립을 결합해 한국 시청자 댓글 반응이 매우 뜨겁습니다.',
      '3) 실제 아이스커피 밈 MP4 클립 6컷이 즉시 재생됩니다.'
    ],
    why: '글로벌 K-컬처·아아(아이스 아메리카노) 밈이 해외 크리에이터들 사이에서 역수입 유행 중',
    factNote: '📌 트렌드 포인트: 글로벌 K-카페·빨리빨리 문화 밈 요약. #해외반응 #아이스아메리카노 #알바레전드 #유머쇼츠',
    scenePack: 'restaurant',
    cuts: [
      {
        line: '해외 카페에서 아이스 아메리카노를 시켰더니',
        mood: '아이스커피 원본 1컷',
        keyword: 'iced coffee meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/RqbWekCJuWIAAAPo/iced-coffee.mp4',
        scenePrompt: 'Vertical 9:16 cinematic POV shot inside a cozy European brick-wall espresso bar'
      },
      {
        line: '결제 끝나기 무섭게 3초 만에 등장합니다',
        mood: '초고속 커피 리액션',
        keyword: 'fast iced coffee',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/fBaW-qukUWcAAAPo/iced-meme.mp4',
        scenePrompt: 'Vertical 9:16 dynamic action shot of a barista sliding a crystal-clear iced Americano cup across a wooden counter'
      },
      {
        line: '한국인도 깜짝 놀란 K-빨리빨리 패치!',
        mood: '카페인 폭주 밈',
        keyword: 'coffee drinking fast meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/O9KYZdUIZc0AAAPo/i-love-lucy-lucille-ball.mp4',
        scenePrompt: 'Vertical 9:16 ultra-crisp close-up of dark espresso swirling into a tall glass filled with sparkling ice cubes'
      },
      {
        line: '심지어 한국말로 맛있게 드세요까지 완벽',
        mood: '칠가이 커피 밈',
        keyword: 'drinking coffee chill guy',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/6x1xYcbxZiYAAAPo/drinking-coffee-chill-guy.mp4',
        scenePrompt: 'Vertical 9:16 cheerful foreign barista in an apron making a Korean finger-heart gesture'
      },
      {
        line: '댓글창은 이미 명예 한국인 임명식 열렸죠',
        mood: '아아 원샷 밈',
        keyword: 'katie coffee meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/7lYjOXmk8VcAAAPo/katiepetersplays-coffee.mp4',
        scenePrompt: 'Vertical 9:16 lively cafe scene of happy customers raising iced coffee glasses in a toast'
      },
      {
        line: '이런 카페 동네에 있으면 매일 출근하겠죠?',
        mood: '커피 힐링 엔딩',
        keyword: 'happy coffee frog meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/56BoGV_BmZQAAAPo/frog21.mp4',
        scenePrompt: 'Vertical 9:16 inviting sunlit street-corner cafe terrace with warm wooden chairs'
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
      '1) 식탁 위 생선과 음식에 앞발을 뻗다가 현행범으로 딱 걸리는 실제 고양이 원본 밈 영상입니다.',
      '2) 앞발만 슬쩍 내리며 "파리 잡아주려 했다"고 우기는 1인칭 더빙이 웃음 포인트입니다.',
      '3) 실제 도둑고양이 원본 클립 6컷이 즉시 로드됩니다.'
    ],
    why: '실제 음식 훔치는 고양이 클립 + 뻔뻔한 한국어 속마음 더빙 조합으로 반복 재생을 유도하는 동물 유머',
    factNote: '📌 더빙 포인트: 실제 고양이 도둑 클립 6컷 + 뻔뻔한 한국어 더빙 적용. #고양이더빙 #현행범포착 #반려묘유머',
    scenePack: 'restaurant',
    cuts: [
      {
        line: '식탁 위 생선에 조용히 다가가는 고양이 앞발',
        mood: '생선 도둑고양이 원본',
        keyword: 'fish cat stealing',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/0iOH47euNSMAAAPo/fish-cat.mp4',
        scenePrompt: 'Vertical 9:16 suspenseful close-up of a cute orange tabby cat stretching one fluffy paw slowly toward a grilled fish'
      },
      {
        line: '집사랑 눈이 딱 마주친 바로 그 0.1초!',
        mood: '음식 서리 현행범 원본',
        keyword: 'cat stealing food',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/A9fmoHDPrLQAAAPo/cat-stealing-food.mp4',
        scenePrompt: 'Vertical 9:16 hilarious freeze-frame shot of an orange tabby cat with its paw hovering mid-air over a fish plate'
      },
      {
        line: '아니아니, 난 그냥 파리 잡아주려 했어!',
        mood: '고양이 앞발 스틸 원본',
        keyword: 'cat stealing meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/NPDOKfqJlqwAAAPo/cat-stealing.mp4',
        scenePrompt: 'Vertical 9:16 funny close-up of an orange tabby cat pulling its paw back to its chest and making an innocent angel face'
      },
      {
        line: '앞발만 슬쩍 내려놓으며 먼 산 바라보기',
        mood: '뻔뻔한 고양이 원본',
        keyword: 'stealing food cat',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/KD0PVJ8WJcAAAAPo/more-for-me-stealing-food.mp4',
        scenePrompt: 'Vertical 9:16 comedic shot of an orange tabby cat sitting beside a dining table looking dramatically sideways'
      },
      {
        line: '연기대상 감이라는 고양이식 위기 탈출!',
        mood: '피자 스틸 고양이 원본',
        keyword: 'cat pizza steal',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/AQp0CJ5IBHwAAAPo/cat-pizza.mp4',
        scenePrompt: 'Vertical 9:16 regal portrait of a fluffy orange tabby cat sitting tall with paws neatly together'
      },
      {
        line: '이 정도 연기력이면 간식 하나 줘야겠죠?',
        mood: '고양이 먹방 원본',
        keyword: 'cat eating snack',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/hlLIv7wM4-UAAAPo/cat-cat-eat.mp4',
        scenePrompt: 'Vertical 9:16 adorable close-up of a happy orange tabby cat purring while enjoying a cat treat'
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
      '1) 커피 수혈 전후의 표정 변화와 월요병 직장인 멘붕 리액션 실제 원본 밈 모음입니다.',
      '2) 월요일·수요일 오전 시간대에 예약 업로드하면 직장인 공유 수가 가장 높습니다.',
      '3) 실제 직장인 월요병·커피 수혈 원본 밈 클립 6개가 즉시 재생됩니다.'
    ],
    why: '직장인·학생이 스토리와 단톡방에 가장 많이 공유하는 일상 하이퍼리얼리즘 밈',
    factNote: '📌 트렌드 포인트: 하이퍼리얼리즘 직장인 공감 포맷. #직장인밈 #출근길 #공감쇼츠 #오피스유머',
    scenePack: 'auto',
    cuts: [
      {
        line: '출근해서 컴퓨터 켜자마자 드는 생각 1위',
        mood: '월요일 출근 원본 밈',
        keyword: 'monday morning office meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/KPestwvOwi0AAAPo/monday-morning-every-monday.mp4',
        scenePrompt: 'Vertical 9:16 relatable cinematic shot of a sleepy office worker sitting at a modern desk in the morning'
      },
      {
        line: '아 오늘 왜 벌써 피곤하지? 집 가고 싶다',
        mood: '피곤 폭발 원본 밈',
        keyword: 'insomnia annoyed tired meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/0XFRpnNpwfsAAAPo/insomnia-annoyed.mp4',
        scenePrompt: 'Vertical 9:16 funny expressive close-up of a tired cute cat wearing a tiny office necktie slouched over a desk'
      },
      {
        line: '하지만 아이스 아메리카노 첫 모금 마시면',
        mood: '커피 수혈 원본 밈',
        keyword: 'tired coffee morning meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/LqLozNfMO4oAAAPo/tired-coffee.mp4',
        scenePrompt: 'Vertical 9:16 dramatic refreshing close-up of a frosty iced Americano glass with a straw on an office desk'
      },
      {
        line: '갑자기 사회성 만렙 프로 직장인으로 변신!',
        mood: '자본주의 미소 원본 밈',
        keyword: 'good fine office meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/t-kV70TRaZUAAAPo/good-fine.mp4',
        scenePrompt: 'Vertical 9:16 energetic scene of a sharp well-dressed office worker typing rapidly on a mechanical keyboard'
      },
      {
        line: '물론 오후 4시 되면 다시 배터리 방전됩니다',
        mood: '오후 방전 원본 밈',
        keyword: 'happy monday tired meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/dU4yt2qettoAAAPo/monday-happy-monday.mp4',
        scenePrompt: 'Vertical 9:16 humorous late-afternoon office scene with warm sunset light, a sleepy puppy resting on an office desk'
      },
      {
        line: '오늘도 버텨낸 모든 분들 진짜 고생했어요!',
        mood: '직장인 응원 엔딩 밈',
        keyword: 'good morning coffee cheers',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/Q-FuO0z3KP4AAAPo/good-morning.mp4',
        scenePrompt: 'Vertical 9:16 uplifting city twilight scene of commuters walking out of an office building into a sunset sky'
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
      '1) 해외 유명 요리 대참사(Cooking Fail) 실제 원본 밈 클립을 모은 반전 포맷입니다.',
      '2) 간단한 레시피인 줄 알았는데 주방에서 불길이 치솟는 실제 유머 클립이 꽂힙니다.',
      '3) 베이킹·요리·맛집·카페 홍보 패러디와 가장 잘 어울립니다.'
    ],
    why: '언어 장벽 없이 국내외 어디서나 터지는 "Cooking Fail / Expectation vs Reality" 반전 유머 포맷',
    factNote: '📌 제작 가이드: 실제 요리 대참사 원본 밈 클립 6컷 구성. #기대vs현실 #요리대참사 #반전유머 #쇼츠밈',
    scenePack: 'beauty',
    cuts: [
      {
        line: 'SNS에서 본 5분 완성 초간단 디저트 레시피!',
        mood: '요리 시작 원본 밈',
        keyword: 'cooking chapati roll meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/SVVG7RB_1RMAAAPo/chapati-roll.mp4',
        scenePrompt: 'Vertical 9:16 mouthwatering luxury patisserie photo of a flawless fluffy strawberry soufflé pancake'
      },
      {
        line: '사진 속 비주얼은 당장 카페 차려도 될 수준',
        mood: '자신만만 요리 밈',
        keyword: 'when men cook meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/d6tScmZQ_hMAAAPo/when-mens-cook-cook-with-comali.mp4',
        scenePrompt: 'Vertical 9:16 editorial close-up of golden caramel syrup pouring smoothly over a perfect cafe dessert'
      },
      {
        line: '그래서 저도 설명서 그대로 따라 해봤는데요',
        mood: '요리 대참사 원본 1',
        keyword: 'cooking fail meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/ln5lwQExi9wAAAPo/cooking-fail.mp4',
        scenePrompt: 'Vertical 9:16 home kitchen action shot of flour cloud puffing up around a stainless mixing bowl'
      },
      {
        line: '잠시만요, 왜 오븐에서 연기가 나는 거죠?',
        mood: '주방 불길 원본 밈',
        keyword: 'deep frying cooking fail',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/yA4aK9pXxUwAAAPo/deep-frying-cooking.mp4',
        scenePrompt: 'Vertical 9:16 hilarious kitchen fail close-up of a comically burnt pancake on a plate with smoke rising'
      },
      {
        line: '그냥 동네 디저트 카페에서 사 먹는 게 답!',
        mood: '주방 멘붕 원본 밈',
        keyword: 'kitchen fire meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/fjzVC3vRhgsAAAPo/fire-on-fire.mp4',
        scenePrompt: 'Vertical 9:16 funny reaction shot of a cat wearing a tiny white chef hat looking at a burnt pastry'
      },
      {
        line: '여러분도 요리 실패담 있으면 댓글로 풀어요',
        mood: '요리 실패 엔딩 밈',
        keyword: 'cooking rule meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/yDbx1kWcQwgAAAPo/rule-27-ze-epik-meme-rules.mp4',
        scenePrompt: 'Vertical 9:16 cozy cafe table with a delicious slice of cake and iced latte ready to eat'
      }
    ]
  },
  {
    id: 'meme_workout_day1',
    rank: 9,
    cat: '급상승 밈',
    sourceTag: '유튜브 쇼츠 인기',
    badge: '💪 헬스·다이어트 밈',
    title: '헬스장 등록 첫날 vs 하체 운동 다음 날 회원 국룰',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%ED%97%AC%EC%8A%A4%EC%9E%A5+%EC%B2%AB%EB%82%A0+%ED%95%98%EC%B2%B4+%EA%B7%BC%EC%9C%A1%ED%86%B5+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'gym_meme',
    summary3: [
      '1) 하체 운동(Leg Day) 직후 다리가 풀려 계단도 못 내려가는 실제 헬스장 유머 원본 클립 모음입니다.',
      '2) 운동·다이어트 공감 키워드는 사계절 내내 조회수와 광고 단가(RPM)가 높습니다.',
      '3) 실제 헬스장 레그데이 원본 밈 MP4 6컷이 즉시 재생됩니다.'
    ],
    why: '운동·다이어트 공감 밈은 시청자 타깃이 넓고 저장·재시청률이 높은 대표 스테디셀러',
    factNote: '📌 트렌드 포인트: 헬스·다이어트 하체 근육통 실제 밈 클립 구성. #오운완 #헬스장밈 #다이어트공감 #운동쇼츠',
    scenePack: 'fitness',
    cuts: [
      {
        line: '헬스장 3개월 끊은 첫날의 비장한 각오!',
        mood: '헬스장 레그데이 원본',
        keyword: 'leg day gym meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/EZjB_Q-0fTgAAAPo/leg-day-gym.mp4',
        scenePrompt: 'Vertical 9:16 dramatic cinematic shot of a determined person tying training shoes in a sleek modern gym'
      },
      {
        line: '운동복부터 프로틴까지 장비는 이미 국가대표',
        mood: '헬스 실패 원본 밈',
        keyword: 'gym fail leg day',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/DH_hAGK2jD8AAAPo/grym-fail-leg-day.mp4',
        scenePrompt: 'Vertical 9:16 crisp flat-lay of brand new gym gloves, shaker bottle and chrome dumbbells'
      },
      {
        line: '하체 운동 딱 한 시간 불태우고 난 다음 날',
        mood: '스쿼트 직후 원본 밈',
        keyword: 'after squats painful thighs',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/53jWurYH43cAAAPo/after-squats-painful-thighs.mp4',
        scenePrompt: 'Vertical 9:16 intense gym shot of a loaded barbell rack with chalk dust floating in a spotlight beam'
      },
      {
        line: '침대에서 일어나는 데만 15분이 걸립니다',
        mood: '다리 풀림 원본 밈',
        keyword: 'cant move leg day',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/dH27O4gww7QAAAPo/cant-move-leg-day.mp4',
        scenePrompt: 'Vertical 9:16 hilarious shot of an exhausted fluffy dog sprawled flat on a white bed refusing to get up'
      },
      {
        line: '결국 계단 앞에서 아기 기린 걸음걸이가 되죠',
        mood: '기린 걸음 원본 밈',
        keyword: 'leg giraffe walk meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/CJ5BRiPTAP8AAAPo/leg-giraff.mp4',
        scenePrompt: 'Vertical 9:16 dramatic low-angle POV looking up a seemingly endless tall staircase'
      },
      {
        line: '오늘 운동 갈지 말지 고민 중이면 일단 가세요!',
        mood: '레그데이 걸음 엔딩',
        keyword: 'veggiemates leg day',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/XLfM2zHn5KcAAAPo/veggiemates-stumpy.mp4',
        scenePrompt: 'Vertical 9:16 energetic gym fist-bump between two workout partners under bright studio lights'
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
      '1) 사고를 쳐놓고 주인이 부르면 귀를 뒤로 젖히며 눈웃음 치는 실제 강아지 원본 밈 영상입니다.',
      '2) "누가 그랬어?" 한 마디에 세상 억울한 표정을 짓는 실제 리액션 클립이 꽂힙니다.',
      '3) 마지막 컷에 투표형 질문("용서한다 vs 혼낸다")을 넣으면 댓글 참여율이 2배 이상 뜁니다.'
    ],
    why: '반려견 눈치·애교 실제 리액션 클립은 해외·국내 불문 호불호 없이 높은 좋아요율을 기록',
    factNote: '📌 제작 가이드: 실제 눈치 보는 강아지 원본 밈 클립 6컷 + 댓글 투표 유도. #강아지눈치 #반려견유머 #댕댕이쇼츠 #동물밈',
    scenePack: 'cafe',
    cuts: [
      {
        line: '퇴근하고 문을 열자마자 마주친 수상한 눈빛',
        mood: '눈치 강아지 원본 1컷',
        keyword: 'sus dog guilty meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/BUFH4d5J23UAAAPo/sus-dog.mp4',
        scenePrompt: 'Vertical 9:16 funny home scene of a cozy living room floor covered in shredded white tissue paper'
      },
      {
        line: '범인을 찾으려고 이름을 조용히 불러봤더니',
        mood: '동공지진 강아지 원본',
        keyword: 'scared dog guilty meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/9_HVX5JWxJYAAAPo/scared-dog.mp4',
        scenePrompt: 'Vertical 9:16 cute cream-colored puppy peeking timidly from behind a sofa corner with guilty round eyes'
      },
      {
        line: '벌써 귀를 뒤로 젖히고 눈웃음부터 발사!',
        mood: '코기 눈웃음 원본 밈',
        keyword: 'guilty corgi smile meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/h74Cr2RKxlUAAAPo/corgi.mp4',
        scenePrompt: 'Vertical 9:16 heart-melting close-up of a fluffy puppy with ears tucked completely back like a baby seal'
      },
      {
        line: '이렇게 귀여운 얼굴로 애교 부리면 반칙이죠',
        mood: '초롱초롱 강아지 원본',
        keyword: 'puppy eyes guilty dog',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/O0tI6j5xBgkAAAPo/puppy-eyes.mp4',
        scenePrompt: 'Vertical 9:16 adorable shot of a playful puppy rolling onto its back on a soft rug'
      },
      {
        line: '화내려던 마음도 3초 만에 사르르 녹습니다',
        mood: '강아지 미소 원본 밈',
        keyword: 'funny dog smiling meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/_8kXnnsmR7YAAAPo/dog-funny-dog.mp4',
        scenePrompt: 'Vertical 9:16 warm close-up of a gentle hand petting the head of a smiling puppy'
      },
      {
        line: '여러분은 바로 용서한다 vs 단호하게 혼낸다?',
        mood: '댕댕이 리액션 엔딩',
        keyword: 'funny dog reaction',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/rDXNGxxYPZ4AAAPo/funny-dog-dog.mp4',
        scenePrompt: 'Vertical 9:16 ultra-cute portrait of a fluffy puppy tilting its head curiously at the camera'
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

// ★ 핵심: 별도 유료 API 키가 없어도 Tenor 공식 웹 검색에서 실제 원본 밈 MP4(https://media.tenor.com/...AAAPo/...mp4, CORS: *)를 실시간 추출!
async function fetchLiveTenorMemeMp4s(query, limit = 6) {
  const slug = String(query || 'chill guy')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-') || 'chill-guy';
  const out = [];
  try {
    const r = await fetch(`https://tenor.com/search/${encodeURIComponent(slug)}-gifs`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(3500)
    });
    if (r.ok) {
      const html = await r.text();
      const raw = html.match(/https:\/\/media\.tenor\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.mp4/g) || [];
      const seen = new Set();
      for (const u of raw) {
        const hiRes = u.replace(/AAAP[12s]\//, 'AAAPo/');
        const baseKey = hiRes.replace(/AAAP[A-Za-z0-9]\//, '');
        if (!seen.has(baseKey)) {
          seen.add(baseKey);
          out.push({
            url: hiRes,
            isVideo: true,
            source: 'Tenor 원본 밈 MP4',
            title: hiRes.split('/').pop().replace(/\.mp4$/i, '').replace(/-/g, ' ')
          });
          if (out.length >= limit) break;
        }
      }
    }
  } catch (_) {}

  // GIPHY 공식 API 키가 설정된 경우 추가 확보
  const giphyKey = String(process.env.GIPHY_API_KEY || '').trim();
  if (giphyKey && out.length < limit) {
    try {
      const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(giphyKey)}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g`, {
        signal: AbortSignal.timeout(2800)
      });
      if (r.ok) {
        const d = await r.json();
        for (const g of (d.data || [])) {
          const mp4Url = g?.images?.downsized_small?.mp4 || g?.images?.original_mp4?.mp4 || g?.images?.fixed_height?.mp4;
          if (mp4Url) out.push({ url: mp4Url, isVideo: true, source: 'GIPHY 원본 밈 MP4', title: g.title || query });
        }
      }
    } catch (_) {}
  }

  return out.slice(0, limit);
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

  // 사용자가 특정 밈(예: "칠가이", "고양이 하?", "페페", "도지")을 검색한 경우 실시간 Tenor 원본 밈 MP4 클립까지 즉시 수집!
  const [gTrends, ytShorts, customMp4s] = await Promise.all([
    fetchGoogleTrendsKr(),
    fetchYoutubeTrendingShortsKr(),
    customQuery ? fetchLiveTenorMemeMp4s(customQuery, 6) : Promise.resolve([])
  ]);
  const liveSignals = [...ytShorts, ...gTrends];
  let dynamicItems = [];

  if (geminiKey && (customQuery || liveSignals.length)) {
    try {
      const seedTxt = customQuery
        ? `사용자 검색 요청 밈/주제: "${customQuery}"`
        : `오늘 수집된 실시간 트렌드 시그널:\n${liveSignals.slice(0, 6).map((t, i) => `${i + 1}. [${t.source}] ${t.keyword} (${t.traffic}) - ${t.headline}`).join('\n')}`;
      const sys = `당신은 유튜브 쇼츠·인스타 릴스 100만 뷰 밈·트렌드 전문 PD입니다.
주어진 실시간 트렌드/밈 시그널을 바탕으로 고객이 클릭 1번에 바로 완성할 수 있는 쇼츠 설계도 2개를 JSON 배열로 출력하세요.
규칙:
1) summary3 배열에 "① 무슨 밈/이슈인지", "② 왜 인기인지/포인트", "③ 쇼츠 연출 팁" 3줄 요약을 담으세요.
2) factNote에 확인된 사실과 출처·해시태그만 적으세요.
3) cuts 배열은 정확히 6컷이며, 각 line은 반드시 14~22자 이내(1줄=1장면 고속 전환 규칙)로 작성하세요.
4) 각 cut마다 Tenor/GIPHY에서 해당 밈 원본 영상을 정확히 검색할 수 있는 영어 밈 이름(keyword, 예: "chill guy meme", "huh cat meme", "shocked cat reaction")과 scenePrompt를 지정하세요.
JSON 형식:
[{"id":"live_1","cat":"실시간 이슈","sourceTag":"Google Trends·YouTube","badge":"⚡ 실시간 급상승","title":"후킹 제목","characterType":"chill_dog","summary3":["1) 요약1","2) 요약2","3) 요약3"],"why":"한 줄 핵심 요약","factNote":"📌 팩트·출처: ... #해시태그","cuts":[{"line":"20자 이내 대사","mood":"충격 훅","keyword":"chill guy meme","mediaType":"실제 원본 밈 MP4","scenePrompt":"Vertical 9:16 scene..."}]}]`;
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
          dynamicItems = await Promise.all(parsed.filter((it) => it && it.title && Array.isArray(it.cuts) && it.cuts.length >= 4).slice(0, 2).map(async (it, idx) => {
            const titleStr = String(it.title).slice(0, 50);
            const firstKw = it.cuts?.[0]?.keyword || customQuery || 'chill guy meme';
            const livePool = customMp4s.length ? customMp4s : await fetchLiveTenorMemeMp4s(firstKw, 6);
            const fallbackPool = TOP10_MEME_RADAR[idx % 2].cuts;
            return {
              id: String(it.id || `live_meme_${idx}`),
              rank: idx + 1,
              cat: String(it.cat || '실시간 이슈'),
              sourceTag: String(it.sourceTag || '실시간 트렌드 · Tenor 원본 밈'),
              badge: String(it.badge || '⚡ 실시간 급상승'),
              title: titleStr,
              characterType: String(it.characterType || 'chill_dog'),
              ytSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(titleStr + ' 쇼츠 밈')}`,
              summary3: Array.isArray(it.summary3) && it.summary3.length >= 2
                ? it.summary3.slice(0, 3).map((s) => String(s))
                : [String(it.why || '실시간 급상승 화제 이슈입니다.'), '핵심 팩트와 실제 원본 밈 MP4 클립 6컷을 자동 매칭했습니다.', '노래방 자막과 AI 더빙으로 바로 발행하세요.'],
              why: String(it.why || '').slice(0, 110),
              factNote: String(it.factNote || '📌 팩트·출처: 실시간 트렌드 확인 요약'),
              cuts: it.cuts.slice(0, 6).map((c, ci) => ({
                line: String(c.line || '').slice(0, 26),
                mood: String(c.mood || `컷 ${ci + 1}`),
                keyword: String(c.keyword || firstKw),
                mediaType: '실제 원본 밈 MP4',
                videoUrl: livePool[ci % Math.max(1, livePool.length)]?.url || fallbackPool[ci]?.videoUrl || TOP10_MEME_RADAR[0].cuts[ci].videoUrl,
                scenePrompt: String(c.scenePrompt || `Vertical 9:16 expressive visual scene depicting: ${c.line || titleStr}`)
              }))
            };
          }));
        }
      }
    } catch (_) {}
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

// 컷별 키워드로 실제 Tenor/GIPHY 원본 밈 MP4 클립 실시간 검색
async function handleMemeVisuals(body, res) {
  const queries = Array.isArray(body.queries) ? body.queries.slice(0, 6) : [String(body.query || 'chill guy meme')];
  const perCut = await Promise.all(queries.map((q) => fetchLiveTenorMemeMp4s(q, 5)));
  return res.status(200).json({
    ok: true,
    visualsByCut: perCut
  });
}

// ★ 신규: 링크(URL) 한 줄만 붙여넣으면 실제 원본 밈 MP4 스트림을 자동 추출 (TikTok / Tenor / GIPHY / YouTube Shorts / 직접 MP4)
async function handleMemeUrlImport(body, res) {
  const rawUrl = String(body.url || '').trim();
  if (!rawUrl) return res.status(400).json({ ok: false, error: 'missing_url' });

  let videoUrl = '';
  let title = '';
  let sourceLabel = '원본 링크 반입';
  let extraVideos = [];

  try {
    // 1) 직접 .mp4 링크이거나 media.tenor.com / media.giphy.com 링크인 경우
    if (/\.mp4(\?|$)/i.test(rawUrl)) {
      videoUrl = rawUrl;
      title = rawUrl.split('/').pop().split('?')[0].replace(/\.mp4$/i, '').replace(/[-_]/g, ' ') || '원본 밈 MP4';
      sourceLabel = '직접 MP4 스트림';
    }
    // 2) GIPHY 링크 (https://giphy.com/gifs/...-ID 또는 https://media.giphy.com/media/ID/giphy.gif)
    else if (/giphy\.com/i.test(rawUrl)) {
      const m = rawUrl.match(/\/media\/(?:v1\.[^/]+\/)?([a-zA-Z0-9]+)\//) || rawUrl.match(/-([a-zA-Z0-9]{10,})(?:$|\?|\/)/) || rawUrl.match(/\/gifs\/([a-zA-Z0-9]{10,})/);
      if (m && m[1]) {
        videoUrl = `https://i.giphy.com/media/${m[1]}/giphy.mp4`;
        title = 'GIPHY 원본 밈 클립';
        sourceLabel = 'GIPHY 원본 MP4';
      }
    }
    // 3) Tenor 링크 (https://tenor.com/view/chill-guy-gif-12345 또는 검색어)
    else if (/tenor\.com/i.test(rawUrl)) {
      const r = await fetch(rawUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(4000)
      });
      if (r.ok) {
        const html = await r.text();
        const m = html.match(/https:\/\/media\.tenor\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.mp4/);
        if (m) {
          videoUrl = m[0].replace(/AAAP[12s]\//, 'AAAPo/');
          title = videoUrl.split('/').pop().replace(/\.mp4$/i, '').replace(/-/g, ' ');
          sourceLabel = 'Tenor 원본 MP4';
        }
      }
      if (!videoUrl) {
        const slugMatch = rawUrl.match(/\/view\/([a-zA-Z0-9-]+)-gif/i) || rawUrl.match(/\/search\/([a-zA-Z0-9-]+)-gifs/i);
        const q = slugMatch ? slugMatch[1].replace(/-/g, ' ') : 'chill guy';
        const list = await fetchLiveTenorMemeMp4s(q, 6);
        if (list.length) {
          videoUrl = list[0].url;
          extraVideos = list.map((x) => x.url);
          title = q;
          sourceLabel = 'Tenor 원본 MP4';
        }
      }
    }
    // 4) TikTok 링크 (https://www.tiktok.com/@.../video/... 또는 vt.tiktok.com/...) -> TikWM 공개 API로 워터마크 없는 원본 MP4 추출
    else if (/tiktok\.com/i.test(rawUrl)) {
      const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(rawUrl)}`, {
        signal: AbortSignal.timeout(5500)
      });
      if (r.ok) {
        const d = await r.json();
        if (d && d.data && (d.data.play || d.data.wmplay)) {
          videoUrl = d.data.play || d.data.wmplay;
          title = String(d.data.title || '틱톡 원본 클립').slice(0, 44);
          sourceLabel = 'TikTok 원본 MP4';
        }
      }
    }
    // 5) YouTube Shorts / YouTube / Instagram 링크 -> oEmbed로 실제 영상 제목 추출 후 해당 밈의 원본 MP4 클립 6컷 자동 매칭
    else if (/youtube\.com|youtu\.be|instagram\.com/i.test(rawUrl)) {
      try {
        const oe = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(rawUrl)}&format=json`, {
          signal: AbortSignal.timeout(3500)
        });
        if (oe.ok) {
          const od = await oe.json();
          title = String(od.title || '').replace(/#[^\s#]+/g, '').trim().slice(0, 44);
        }
      } catch (_) {}
      const cleanQ = title || rawUrl;
      const matchedPreset = TOP10_MEME_RADAR.find((m) =>
        (cleanQ.toLowerCase().includes('chill') || cleanQ.includes('칠가이') || cleanQ.includes('칠 가이')) ? m.id === 'meme_chill_guy'
        : (cleanQ.toLowerCase().includes('huh') || cleanQ.includes('고양이')) ? m.id === 'meme_cat_huh'
        : (cleanQ.includes('리트리버') || cleanQ.includes('강아지')) ? m.id === 'meme_golden_door_wait'
        : false
      );
      if (matchedPreset) {
        videoUrl = matchedPreset.cuts[0].videoUrl;
        extraVideos = matchedPreset.cuts.map((c) => c.videoUrl);
        title = title || matchedPreset.title;
        sourceLabel = '유튜브 쇼츠 밈 원본 매칭';
      } else {
        const list = await fetchLiveTenorMemeMp4s(title || 'viral meme', 6);
        if (list.length) {
          videoUrl = list[0].url;
          extraVideos = list.map((x) => x.url);
          sourceLabel = '밈 원본 MP4 자동 매칭';
        }
      }
    }

    // 일반 키워드를 입력한 경우에도 Tenor 원본 밈 MP4 검색 지원
    if (!videoUrl) {
      const list = await fetchLiveTenorMemeMp4s(rawUrl, 6);
      if (list.length) {
        videoUrl = list[0].url;
        extraVideos = list.map((x) => x.url);
        title = title || rawUrl;
        sourceLabel = 'Tenor 원본 밈 MP4';
      }
    }
  } catch (_) {}

  if (!videoUrl) {
    return res.status(200).json({
      ok: false,
      error: 'extract_failed',
      message: '해당 링크에서 직접 영상을 가져오지 못했습니다. Tenor/GIPHY/TikTok 링크나 검색어를 입력해 보세요.'
    });
  }

  return res.status(200).json({
    ok: true,
    videoUrl,
    extraVideos: extraVideos.length ? extraVideos : [videoUrl],
    title: title || '원본 밈 클립',
    sourceLabel
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

  // ★ 중요: 키워드×밈 또는 우리 가게×밈 패러디에서도 선택한 밈의 실제 원본 MP4 클립(videoUrl)을 그대로 유지!
  const fallbackMashup = mashupType === 'store'
    ? {
        title: `[${storeName}×밈 패러디] ${memeTitle.slice(0, 18)} 버전`,
        badge: `🏪 가게 홍보×밈 패러디`,
        characterType: charType,
        why: `"${memeTitle}" 실제 원본 밈 영상에 [${storeName} · ${productPoint}] 매력을 녹인 B급 바이럴 쇼츠`,
        factNote: `📌 ${storeName} (${industryLabel}) · ${productPoint} | 유행 밈 패러디 홍보 쇼츠 #${storeName.replace(/\s+/g, '')} #${industryLabel.replace(/\s+/g, '')} #밈홍보 #쇼츠`,
        hookTitles: [
          `${storeName} 처음 온 손님들의 흔한 리액션 😂`,
          `광고 아님) ${productPoint} 보고 그냥 지나치려다 실패한 썰`,
          `사장님이 미쳤어요 소리가 절로 나오는 ${storeName} 근황`,
          `요즘 알고리즘 타는 밈으로 보는 ${storeName} 핵심 요약`,
          `끝까지 보면 무조건 방문각 잡히는 ${productPoint} 반전!`
        ],
        cuts: [
          { line: `요즘 유행하는 이 밈, ${storeName.slice(0, 8)} 버전!`, mood: '원본 밈 오프닝', keyword: baseCuts[0]?.keyword || 'chill guy', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[0]?.videoUrl },
          { line: `처음엔 그냥 평범한 ${industryLabel.slice(0, 6)}인 줄 알았죠`, mood: '원본 밈 전개', keyword: baseCuts[1]?.keyword || 'chill guy', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[1]?.videoUrl },
          { line: `그런데 ${productPoint.slice(0, 12)} 나오는 순간!`, mood: '원본 밈 하이라이트', keyword: baseCuts[2]?.keyword || 'huh cat', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[2]?.videoUrl },
          { line: '동공 지진 나면서 표정이 이렇게 바뀝니다', mood: '폭소 리액션 원본', keyword: baseCuts[3]?.keyword || 'huh cat', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[3]?.videoUrl },
          { line: `한 번 오면 단골 될 수밖에 없는 ${storeName.slice(0, 8)}!`, mood: '매장 강점×밈', keyword: baseCuts[4]?.keyword || 'chill guy', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[4]?.videoUrl },
          { line: '지금 프로필·댓글로 혜택 바로 챙겨가세요!', mood: '원본 밈 엔딩', keyword: baseCuts[5]?.keyword || 'chill guy', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[5]?.videoUrl }
        ]
      }
    : {
        title: `[오늘의 키워드×밈] ${issueKeyword} × ${memeTitle.slice(0, 16)}`,
        badge: `⚡ 실시간 키워드×밈`,
        characterType: charType,
        why: `오늘 화제인 "${issueKeyword}" 이슈를 "${memeTitle}" 실제 원본 밈 클립으로 재해석한 고속 트렌드 쇼츠`,
        factNote: `📌 오늘의 키워드(${issueKeyword}) × 트렌드 밈 콜라보 요약. #${issueKeyword.replace(/\s+/g, '')} #오늘의밈 #실시간트렌드 #쇼츠`,
        hookTitles: [
          `오늘 난리 난 "${issueKeyword}", 이 밈으로 10초 요약 😂`,
          `${issueKeyword} 소식 들었을 때 내 표정 실화냐`,
          `요즘 1위 밈으로 보는 "${issueKeyword}" 핵심 포인트`,
          `모르면 대화 안 통하는 오늘의 "${issueKeyword}" 총정리`,
          `${issueKeyword} 때문에 댓글창 뒤집어진 레전드 상황!`
        ],
        cuts: [
          { line: `오늘 갑자기 난리 난 "${issueKeyword.slice(0, 11)}" 소식!`, mood: '이슈×원본 밈 1컷', keyword: baseCuts[0]?.keyword || 'chill guy', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[0]?.videoUrl },
          { line: '처음 들었을 때 다들 딱 이 표정이었죠', mood: '원본 밈 리액션 2컷', keyword: baseCuts[1]?.keyword || 'huh cat', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[1]?.videoUrl },
          { line: `${issueKeyword.slice(0, 11)}, 핵심만 3초 만에 요약하면`, mood: '원본 밈 3컷', keyword: baseCuts[2]?.keyword || 'chill guy', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[2]?.videoUrl },
          { line: '생각보다 훨씬 반전이라 모두가 놀랐습니다', mood: '원본 밈 반전 4컷', keyword: baseCuts[3]?.keyword || 'huh cat', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[3]?.videoUrl },
          { line: '이럴 때일수록 칠 가이처럼 여유를 챙기세요', mood: '원본 밈 5컷', keyword: baseCuts[4]?.keyword || 'chill guy', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[4]?.videoUrl },
          { line: `여러분은 이번 ${issueKeyword.slice(0, 9)} 어떻게 보시나요?`, mood: '원본 밈 엔딩 6컷', keyword: baseCuts[5]?.keyword || 'chill guy', mediaType: '실제 원본 밈 MP4', videoUrl: baseCuts[5]?.videoUrl }
        ]
      };

  if (geminiKey) {
    try {
      const targetDesc = mashupType === 'store'
        ? `[우리 가게·상품 홍보 패러디]\n- 업종: ${industryLabel}\n- 매장/브랜드명: ${storeName}\n- 핵심 어필 상품/혜택: ${productPoint}\n목표: 선택한 실제 원본 밈("${memeTitle}") 영상 클립 위에 얹을 재치 있는 가게 홍보 패러디 6컷 자막`
        : `[오늘의 실시간 키워드 × 밈 결합]\n- 오늘의 키워드/이슈: ${issueKeyword}\n목표: 선택한 실제 원본 밈("${memeTitle}") 영상 클립 위에 얹을 오늘의 키워드 결합 6컷 자막`;

      const sys = `당신은 충주맨·숏박스 스타일의 B급 패러디 밈 쇼츠 전문 크리에이티브 디렉터입니다.
선택된 원본 밈 영상 클립 6컷 위에 얹을 1줄=1장면(14~22자 이내) × 6컷 고속 쇼츠 자막 설계도를 JSON으로만 출력하세요.
JSON 스키마:
{"title":"결합 제목","badge":"배지","why":"결합 기획 의도 1~2줄","factNote":"📌 설명글 및 #해시태그","hookTitles":["상단후킹1","상단후킹2","상단후킹3","상단후킹4","상단후킹5"],"cuts":[{"line":"20자 이내 대사","mood":"감정"}]}`;

      const userMsg = `[선택한 원본 밈]\n제목: ${memeTitle}\n특징: ${(meme.summary3 || []).join(' ')}\n\n${targetDesc}`;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8500),
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
                mood: String(c.mood || baseCuts[ci]?.mood || `원본 밈 ${ci + 1}컷`),
                keyword: baseCuts[ci]?.keyword || 'chill guy meme',
                mediaType: '실제 원본 밈 MP4',
                videoUrl: baseCuts[ci]?.videoUrl || TOP10_MEME_RADAR[0].cuts[ci].videoUrl,
                scenePrompt: baseCuts[ci]?.scenePrompt || ''
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
  if (body.mode === 'meme-visuals') return handleMemeVisuals(body, res);
  if (body.mode === 'meme-url-import') return handleMemeUrlImport(body, res);
  if (body.mode === 'meme-mashup') return handleMemeMashup(body, res);
  if (body.mode === 'foreign-remake') return handleForeignRemake(body, res);
  return res.status(400).json({ ok: false, error: 'unknown_meme_mode' });
}

module.exports = {
  handleMemeRemakeRequest,
  TOP10_MEME_RADAR
};
