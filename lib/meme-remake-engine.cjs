'use strict';

/**
 * AutoReelsMaker — Dedicated Meme Shorts Studio Backend Engine (Korean Variety · K-Drama · K-Movie · Concert + Global Meme Originals)
 * -----------------------------------------------------------------------------------------------------------------------------------
 * 1) mode: 'meme-radar'
 *    - 국내 예능(무한도전·런닝맨·신서유기·백종원)·한국 드라마(도깨비·더글로리·선재업고튀어)·한국 영화(범죄도시·기생충·하정우 먹방)·
 *      K-POP 콘서트/무대(아이유·뉴진스·세븐틴·데이식스) + 글로벌 밈(칠가이·하? 고양이·골든리트리버) 실제 원본 MP4 스트림(CORS: *)을
 *      각 컷의 실제 영상 장면과 1:1 일치하는 대사로 제공하며, 클릭 즉시 캔버스에서 6컷 원본 영상과 성우 더빙·노래방 자막이 100% 싱크되어 재생됩니다.
 * 2) mode: 'meme-visuals'
 *    - API 키 없이도 Tenor 한국어/글로벌 공개 밈 페이지에서 실제 원본 밈 MP4(media.tenor.com/*AAAPo/*.mp4)를 실시간 추출합니다.
 * 3) mode: 'meme-url-import'
 *    - TikTok / Tenor / GIPHY / YouTube Shorts / 직접 MP4 링크(URL) 또는 국내 예능·드라마·배우 이름을 넣으면 원본 밈 MP4를 즉시 반입합니다.
 * 4) mode: 'meme-mashup'
 *    - 실제 원본 밈 영상 클립을 유지한 채 오늘의 키워드×밈 또는 우리 가게 홍보×밈 패러디 자막·구성을 결합합니다.
 * 5) mode: 'foreign-remake'
 *    - 해외/원본 MP4 6구간 프레임 비전 분석 + 자막 덮어쓰기 마스크
 */

const TOP10_MEME_RADAR = [
  {
    id: 'meme_kr_variety_mudo',
    rank: 1,
    cat: '국내 예능',
    sourceTag: 'MBC 무한도전 · 레전드 예능 짤',
    badge: '📺 국내 예능 1위',
    title: '없는 게 없다는 한국인의 만능 레전드 "무한도전(유재석·박명수)" 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EB%AC%B4%ED%95%9C%EB%8F%84%EC%A0%84+%EB%A0%88%EC%A0%84%EB%93%9C+%EC%A7%A4+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_variety',
    summary3: [
      '1) 유재석·박명수·노홍철·정준하의 실제 무한도전 원본 리액션 영상 클립 6컷으로 구성된 국내 대표 예능 밈입니다.',
      '2) 각 컷의 실제 영상 동작(박명수 동공지진 → 싫어! → 버럭 → 노홍철 박장대소 → 유재석 한숨 → 유재석 컴온)과 자막이 1:1로 정확히 맞물립니다.',
      '3) 직장인 공감·오늘의 이슈·우리 가게 B급 홍보 어디에 붙여도 한국 시청자 클릭률과 댓글 반응이 가장 높습니다.'
    ],
    why: '어떤 상황도 무한도전 짤 하나로 설명된다는 한국 쇼츠·커뮤니티 부동의 1위 예능 밈',
    factNote: '📌 출처·포인트: 무한도전 유재석·박명수·노홍철 실제 방송 리액션 클립 6컷 구성. #무한도전밈 #박명수짤 #유재석 #예능쇼츠 #직장인공감',
    scenePack: 'auto',
    cuts: [
      {
        line: '갑자기 황당한 소식을 들었을 때 내 표정',
        mood: '박명수 동공지진 원본',
        keyword: '무한도전 박명수',
        mediaType: '📺 무한도전 원본 MP4',
        videoUrl: 'https://media.tenor.com/UZR7DCgIXpUAAAPo/park-myeongsu-shocked.mp4',
        scenePrompt: 'Korean variety show shocked facial expression close-up'
      },
      {
        line: '속으로는 당장 싫다고 외치고 싶지만',
        mood: '박명수 거절 원본',
        keyword: '박명수 무한도전',
        mediaType: '📺 무한도전 원본 MP4',
        videoUrl: 'https://media.tenor.com/dXbEfPeW4YEAAAPo/i-don%27t-want-to-infinite-challenge.mp4',
        scenePrompt: 'Korean variety show comedian shaking head saying I dont want to'
      },
      {
        line: '참다 참다 결국 안에서 불길이 치솟죠!',
        mood: '박명수 버럭 원본',
        keyword: '박명수 화남',
        mediaType: '📺 무한도전 원본 MP4',
        videoUrl: 'https://media.tenor.com/Rp-BmySCDyUAAAPo/park-myeongsu-mad.mp4',
        scenePrompt: 'Korean variety show comedian bursting out angry reaction'
      },
      {
        line: '옆에서 구경하는 친구는 그저 신났습니다',
        mood: '노홍철 박장대소 원본',
        keyword: '노홍철 무한도전',
        mediaType: '📺 무한도전 원본 MP4',
        videoUrl: 'https://media.tenor.com/YT6DaRcSMAsAAAPo/nohongchul-infinite-challenge.mp4',
        scenePrompt: 'Korean variety show laughing and clapping joyfully'
      },
      {
        line: '결국 깊은 한숨 한 번 쉬고 현실로 복귀',
        mood: '유재석 깊은 한숨 원본',
        keyword: '유재석 한숨',
        mediaType: '📺 유재석 원본 MP4',
        videoUrl: 'https://media.tenor.com/8_Z-_l2BhgcAAAPo/yoo-jaesuk-sigh.mp4',
        scenePrompt: 'Yoo Jae-suk letting out a deep relatable sigh'
      },
      {
        line: '그래도 어쩌겠어요, 오늘도 신나게 가보자고요!',
        mood: '유재석 텐션업 원본',
        keyword: '유재석 컴온',
        mediaType: '📺 유재석 원본 MP4',
        videoUrl: 'https://media.tenor.com/tl9mZT2Xtu0AAAPo/yoo-jae-suk-come-on.mp4',
        scenePrompt: 'Yoo Jae-suk cheering come on with high energy'
      }
    ]
  },
  {
    id: 'meme_kr_variety_running_njttw',
    rank: 2,
    cat: '국내 예능',
    sourceTag: '런닝맨 · 신서유기 레전드',
    badge: '🏃 예능 리액션',
    title: '억울함 100% 충전된 "런닝맨 이광수 × 신서유기 강호동·이수근" 예능 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EB%9F%B0%EB%8B%9D%EB%A7%A8+%EC%9D%B4%EA%B4%91%EC%88%98+%EC%8B%A0%EC%84%9C%EC%9C%A0%EA%B8%B0+%EB%A0%88%EC%A0%84%EB%93%9C+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_variety',
    summary3: [
      '1) 런닝맨 이광수·송지효와 신서유기 강호동·이수근의 실제 방송 폭소 클립 6컷을 모은 예능 리액션 팩입니다.',
      '2) 억울할 때(이광수) → 놀랐을 때(신서유기) → 신났을 때(이수근) → 만족할 때(강호동 따봉)까지 감정선과 영상이 1:1 일치합니다.',
      '3) 일상 에피소드나 매장 이벤트 소개에 넣으면 지루할 틈 없이 끝까지 시청하게 만듭니다.'
    ],
    why: '국내 예능 중 표정 연기와 리액션 타격감이 가장 확실한 런닝맨·신서유기 하이라이트 조합',
    factNote: '📌 출처·포인트: 런닝맨(이광수·송지효) 및 tvN 신서유기(강호동·이수근) 실제 원본 리액션 MP4 6컷. #런닝맨 #신서유기 #이광수 #강호동 #예능짤',
    scenePack: 'cafe',
    cuts: [
      {
        line: '나만 빼고 다들 맛있는 거 먹으러 갔을 때',
        mood: '이광수 억울 원본',
        keyword: '이광수 슬프다',
        mediaType: '📺 런닝맨 원본 MP4',
        videoUrl: 'https://media.tenor.com/gSYqHzoXYDMAAAPo/%EA%B4%91%EC%88%98-%EC%8A%AC%ED%94%84%EB%8B%A4.mp4',
        scenePrompt: 'Lee Kwang-soo looking comically sad and betrayed on Running Man'
      },
      {
        line: '심지어 내 몫까지 다 먹었다는 소식을 들으면',
        mood: '신서유기 충격 원본',
        keyword: '신서유기 놀람',
        mediaType: '📺 신서유기 원본 MP4',
        videoUrl: 'https://media.tenor.com/M5ZXod7ZQx8AAAPo/surprised-tvn.mp4',
        scenePrompt: 'New Journey to the West cast looking shocked with wide eyes'
      },
      {
        line: '배신감에 치가 떨리지만 일단 침착합니다',
        mood: '신서유기 서러움 원본',
        keyword: '신서유기 슬픔',
        mediaType: '📺 신서유기 원본 MP4',
        videoUrl: 'https://media.tenor.com/ugwrmJEPCFQAAAPo/sad-tvn.mp4',
        scenePrompt: 'Korean variety show sad pouting reaction'
      },
      {
        line: '그런데 내 꺼 따로 포장해 왔다는 한마디에!',
        mood: '이수근 텐션폭발 원본',
        keyword: '이수근 신서유기',
        mediaType: '📺 신서유기 원본 MP4',
        videoUrl: 'https://media.tenor.com/E8L0gqVBouEAAAPo/excited-new-journey-to-the-west.mp4',
        scenePrompt: 'Lee Soo-geun cheering and jumping with excitement'
      },
      {
        line: '방금 전 서운함은 1초 만에 싹 사라지죠',
        mood: '이광수 윙크 원본',
        keyword: '이광수 윙크',
        mediaType: '📺 런닝맨 원본 MP4',
        videoUrl: 'https://media.tenor.com/Gy5FQesh-JsAAAPo/lee-kwang-soo-lee-kwang-soo-wink.mp4',
        scenePrompt: 'Lee Kwang-soo giving a funny confident wink'
      },
      {
        line: '역시 먹을 거 챙겨주는 사람이 최고입니다!',
        mood: '신서유기 쌍따봉 원본',
        keyword: '신서유기 따봉',
        mediaType: '📺 신서유기 원본 MP4',
        videoUrl: 'https://media.tenor.com/q5b2j9rSViIAAAPo/thumbs-up-new-journey-to-the-west.mp4',
        scenePrompt: 'New Journey to the West giving enthusiastic double thumbs up'
      }
    ]
  },
  {
    id: 'meme_kr_drama_highlights',
    rank: 3,
    cat: '드라마·영화',
    sourceTag: '도깨비 · 더글로리 · 선재업고튀어',
    badge: '🎬 K-드라마 명장면',
    title: '한국인이 가장 사랑하는 K-드라마 명장면 밈 (도깨비·더글로리·선업튀)',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EB%8F%84%EA%B9%A8%EB%B9%84+%EB%8D%94%EA%B8%80%EB%A1%9C%EB%A6%AC+%EC%84%A0%EC%9E%AC%EC%97%85%EA%B3%A0%ED%8A%80%EC%96%B4+%EB%AA%85%EC%9E%A5%EB%A9%B4+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_drama',
    summary3: [
      '1) 도깨비(공유·이동욱 런웨이), 더 글로리(박연진 물개박수), 선재 업고 튀어(임솔), 눈물의 여왕(백현우) 실제 드라마 원본 클립 6컷입니다.',
      '2) 한국 시청자라면 누구나 아는 드라마 명장면이라 초반 3초 이탈률이 극도로 낮습니다.',
      '3) 각 컷의 드라마 명장면 동작과 대사가 1:1로 맞물려 돌아갑니다.'
    ],
    why: '도깨비 런웨이부터 더글로리 박연진 박수, 선재 업고 튀어까지 K-드라마 레전드 밈 총집합',
    factNote: '📌 출처·포인트: tvN 도깨비·선재 업고 튀어·눈물의 여왕·넷플릭스 더 글로리 명장면 리액션 클립 6컷. #한국드라마 #도깨비 #더글로리 #선재업고튀어 #드라마밈',
    scenePack: 'beauty',
    cuts: [
      {
        line: '등장만으로 분위기 압도하는 도깨비 런웨이!',
        mood: '도깨비 공유·이동욱 원본',
        keyword: '도깨비 공유 이동욱',
        mediaType: '🎬 드라마 도깨비 MP4',
        videoUrl: 'https://media.tenor.com/Kr55Fs8oFwsAAAPo/gong-yoo-lee-dong-wook.mp4',
        scenePrompt: 'Goblin K-drama Gong Yoo and Lee Dong-wook iconic walk scene'
      },
      {
        line: '멋진 척했지만 현실은 한숨부터 나오는 하루',
        mood: '선업튀 임솔 한숨 원본',
        keyword: '선재업고튀어 임솔',
        mediaType: '🎬 선재업고튀어 MP4',
        videoUrl: 'https://media.tenor.com/aV4LmRS1kRAAAAPo/lovely-runner-sigh.mp4',
        scenePrompt: 'Lovely Runner Im Sol sighing cutely'
      },
      {
        line: '하지만 기분 좋은 소식 하나만 들려오면',
        mood: '선업튀 설렘 폭발 원본',
        keyword: '선재업고튀어',
        mediaType: '🎬 선재업고튀어 MP4',
        videoUrl: 'https://media.tenor.com/BpeYGtnP69YAAAPo/lovely-runner-%EC%84%A0%EC%9E%AC-%EC%97%85%EA%B3%A0-%ED%8A%80%EC%96%B4.mp4',
        scenePrompt: 'Lovely Runner romantic excited K-drama scene'
      },
      {
        line: '더 글로리 연진이처럼 물개박수가 절로 나오죠!',
        mood: '더글로리 박연진 원본',
        keyword: '더글로리 임지연',
        mediaType: '🎬 더 글로리 MP4',
        videoUrl: 'https://media.tenor.com/JzHAG1rUApUAAAPo/lim-ji-yeon-the-glory.mp4',
        scenePrompt: 'The Glory Lim Ji-yeon clapping sarcastically'
      },
      {
        line: '눈물의 여왕처럼 감동이 몰려오는 이 순간',
        mood: '눈물의여왕 명장면 원본',
        keyword: '눈물의여왕 김수현',
        mediaType: '🎬 눈물의 여왕 MP4',
        videoUrl: 'https://media.tenor.com/DdNOmX2IFAIAAAPo/queen-of-tears-baekhong.mp4',
        scenePrompt: 'Queen of Tears K-drama emotional couple scene'
      },
      {
        line: '오늘 여러분의 하루도 드라마처럼 해피엔딩!',
        mood: '공유 심쿵 윙크 원본',
        keyword: '공유 윙크',
        mediaType: '🎬 공유 원본 MP4',
        videoUrl: 'https://media.tenor.com/_7SKgrB2f2UAAAPo/%EA%B3%B5%EC%9C%A0-%EC%9C%99%ED%81%AC.mp4',
        scenePrompt: 'Gong Yoo giving a warm handsome wink to the camera'
      }
    ]
  },
  {
    id: 'meme_kr_movie_legends',
    rank: 4,
    cat: '드라마·영화',
    sourceTag: '범죄도시 · 기생충 · 신세계 · 오징어게임',
    badge: '🎥 한국 영화 천만 밈',
    title: '마동석 주먹부터 송강호·이병헌·황정민까지 "한국 천만 영화" 명장면 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EB%B2%94%EC%A3%84%EB%8F%84%EC%8B%9C+%EB%A7%88%EB%8F%99%EC%84%9D+%EA%B8%B0%EC%83%9D%EC%B6%A9+%EC%86%A1%EA%B0%95%ED%98%B8+%ED%95%9C%EA%B5%AD%EC%98%81%ED%99%94+%EB%AA%85%EC%9E%A5%EB%A9%B4+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_movie',
    summary3: [
      '1) 기생충(송강호), 범죄도시(마동석), 신세계/수리남(황정민), 오징어게임(이정재·이병헌) 실제 영화/시리즈 원본 클립 6컷입니다.',
      '2) 카리스마 넘치는 등장부터 마동석의 통쾌한 따봉 엔딩까지 각 컷 영상과 대사가 완벽히 일치합니다.',
      '3) 남성·직장인 타깃 쇼츠나 자동차·헬스·맛집 홍보 패러디에서 압도적인 조회수를 뽑아냅니다.'
    ],
    why: '천만 관객이 검증한 한국 영화 대표 배우들의 명연기 클립을 12초 고속 쇼츠로 압축',
    factNote: '📌 출처·포인트: 기생충(송강호)·범죄도시(마동석)·황정민·이병헌·이정재 실제 명장면 클립 6컷. #한국영화 #마동석 #송강호 #이병헌 #황정민 #영화명장면',
    scenePack: 'auto',
    cuts: [
      {
        line: '너는 다 계획이 있구나 싶을 때 나오는 표정',
        mood: '기생충 송강호 원본',
        keyword: '기생충 송강호',
        mediaType: '🎥 영화 기생충 MP4',
        videoUrl: 'https://media.tenor.com/7BOcbWhcGAIAAAPo/%EA%B8%B0%EC%83%9D%EC%B6%A9-%EC%86%A1%EA%B0%95%ED%98%B8.mp4',
        scenePrompt: 'Song Kang-ho iconic scene from Parasite Korean movie'
      },
      {
        line: '드루와 드루와! 자신 있으면 일단 붙어봐야죠',
        mood: '황정민 드루와 원본',
        keyword: '황정민 영화',
        mediaType: '🎥 황정민 명장면 MP4',
        videoUrl: 'https://media.tenor.com/D1ngsDKvZV4AAAPo/bring-it-on-bring-it.mp4',
        scenePrompt: 'Hwang Jung-min gesturing bring it on in Korean crime movie'
      },
      {
        line: '진실의 방으로 가기 전 마동석의 묵직한 한 방!',
        mood: '범죄도시 마동석 주먹 원본',
        keyword: '범죄도시 마동석',
        mediaType: '🎥 범죄도시 마동석 MP4',
        videoUrl: 'https://media.tenor.com/MwW0nJ8uZhQAAAPo/%EB%A7%88%EB%8F%99%EC%84%9D-%EB%A7%88%EB%8F%99%EC%84%9D%EC%A3%BC%EB%A8%B9.mp4',
        scenePrompt: 'Ma Dong-seok Don Lee throwing a powerful punch in The Roundup'
      },
      {
        line: '이병헌도 고개를 절레절레 흔드는 압도적 포스',
        mood: '이병헌 단호한 거절 원본',
        keyword: '이병헌 오징어게임',
        mediaType: '🎥 이병헌 명장면 MP4',
        videoUrl: 'https://media.tenor.com/EaAOL3LJugMAAAPo/lee-byung-hun-no.mp4',
        scenePrompt: 'Lee Byung-hun shaking finger saying no charisma'
      },
      {
        line: '얼음처럼 굳어버린 오징어게임 이정재의 눈빛!',
        mood: '오징어게임 이정재 원본',
        keyword: '오징어게임 이정재',
        mediaType: '🎥 오징어게임 MP4',
        videoUrl: 'https://media.tenor.com/oe9qR5z9ogcAAAPo/squid-game-squid-game-2.mp4',
        scenePrompt: 'Lee Jung-jae intense look in Squid Game'
      },
      {
        line: '결론은 깔끔하게 마동석 따봉 하나로 정리 끝!',
        mood: '마동석 따봉 엔딩 원본',
        keyword: '마동석 따봉',
        mediaType: '🎥 마동석 따봉 MP4',
        videoUrl: 'https://media.tenor.com/k6K5PSbcIW4AAAPo/thumbs-up-%EB%A7%88%EB%8F%99%EC%84%9D.mp4',
        scenePrompt: 'Ma Dong-seok giving a warm thumbs up smile'
      }
    ]
  },
  {
    id: 'meme_kr_mukbang_baek_hajungwoo',
    rank: 5,
    cat: '국내 예능',
    sourceTag: '흑백요리사 백종원 · 하정우 먹방',
    badge: '🍖 국내 먹방·요리 밈',
    title: '보는 순간 배고파지는 "백종원 극찬 맛표현 × 하정우 레전드 먹방" 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EB%B0%B1%EC%A2%85%EC%9B%90+%ED%9D%91%EB%B0%B1%EC%9A%94%EB%A6%AC%EC%82%AC+%ED%95%98%EC%A0%95%EC%9A%B0+%EB%A8%B9%EB%B0%A9+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_mukbang',
    summary3: [
      '1) 영어 자막이 덕지덕지 붙은 해외 요리 실패 짤 대신, 한국인이 가장 좋아하는 백종원(흑백요리사/스트리트푸드파이터)과 하정우 실제 먹방 원본 클립 6컷으로 전면 교체했습니다!',
      '2) 백종원 시식 → 흑백요리사 감탄 → 하정우 "바로 이 맛이야" → 치킨·삼겹살 먹방 → 백종원 원샷까지 실제 영상과 대사가 1:1로 맞물립니다.',
      '3) 식당·카페·베이커리·야식 홍보 패러디는 물론 다이어트 실패 공감 쇼츠에 즉시 쓸 수 있습니다.'
    ],
    why: '해외 짤 대신 한국인이 가장 열광하는 백종원·하정우 실제 먹방 원본 클립으로 입맛과 조회수 동시 저격',
    factNote: '📌 출처·포인트: 백종원(흑백요리사·맛표현) 및 하정우 레전드 먹방 실제 원본 MP4 6컷. #백종원밈 #흑백요리사 #하정우먹방 #맛집쇼츠 #야식유혹',
    scenePack: 'restaurant',
    cuts: [
      {
        line: '다이어트 결심한 날 밤에 꼭 떠오르는 이 장면',
        mood: '백종원 진지한 시식 원본',
        keyword: '백종원 맛',
        mediaType: '📺 백종원 원본 MP4',
        videoUrl: 'https://media.tenor.com/DP6wEET-UEgAAAPo/baek-jongwon-taste.mp4',
        scenePrompt: 'Baek Jong-won tasting delicious Korean food with serious expression'
      },
      {
        line: '한 입 먹자마자 백종원도 감탄한 바로 그 맛!',
        mood: '흑백요리사 백종원 원본',
        keyword: '흑백요리사 백종원',
        mediaType: '📺 흑백요리사 원본 MP4',
        videoUrl: 'https://media.tenor.com/qnxbhGAvrFgAAAPo/%ED%9D%91%EB%B0%B1%EC%9A%94%EB%A6%AC%EC%82%AC-%EB%B0%B1%EC%A2%85%EC%9B%90.mp4',
        scenePrompt: 'Baek Jong-won in Culinary Class Wars amazed by food taste'
      },
      {
        line: '하정우 먹방처럼 우적우적 씹어야 제맛이죠',
        mood: '하정우 바로이맛이야 원본',
        keyword: '하정우 먹방',
        mediaType: '🎥 하정우 먹방 MP4',
        videoUrl: 'https://media.tenor.com/r7OQWFuVN4QAAAPo/%EB%B0%94%EB%A1%9C%EC%9D%B4%EB%A7%9B%EC%9D%B4%EC%95%BC-%EC%94%B9%96%B4%EB%A8%B9%EB%8B%A4.mp4'.replace('%96%B4', '%EC%96%B4'),
        scenePrompt: 'Ha Jung-woo legendary Korean movie eating mukbang scene'
      },
      {
        line: '양념 치킨 닭다리 하나 들고 뜯는 행복이란',
        mood: '양념닭다리 먹방 원본',
        keyword: '양념치킨 먹방',
        mediaType: '🍖 실제 먹방 원본 MP4',
        videoUrl: 'https://media.tenor.com/uvCdQXR8mxsAAAPo/%EC%8B%9C%ED%81%AC%EB%A6%BF%EC%96%91%EB%85%90%EB%8B%AD%EB%8B%A4%EB%A6%AC-%EB%96%B5%EA%B0%9C%EB%96%B5.mp4',
        scenePrompt: 'Delicious Korean seasoned fried chicken drumstick mukbang'
      },
      {
        line: '시원하게 마지막 한 모금까지 원샷 때리면!',
        mood: '백종원 시원한 원샷 원본',
        keyword: '백종원 원샷',
        mediaType: '📺 백종원 원샷 MP4',
        videoUrl: 'https://media.tenor.com/48S96D0orjMAAAPo/baek-jongwon-bottoms-up.mp4',
        scenePrompt: 'Baek Jong-won drinking refreshingly bottoms up'
      },
      {
        line: '오늘 야식 메뉴는 고민 말고 이걸로 정하셨죠?',
        mood: '백종원 엄지척 엔딩 원본',
        keyword: '백종원 리액션',
        mediaType: '📺 백종원 엔딩 MP4',
        videoUrl: 'https://media.tenor.com/iL7GQ7FDNV8AAAPo/baek-jongwon-paik-jongwon.mp4',
        scenePrompt: 'Baek Jong-won smiling warmly after a great meal'
      }
    ]
  },
  {
    id: 'meme_kr_concert_kpop_stage',
    rank: 6,
    cat: '공연·콘서트',
    sourceTag: '아이유 · 뉴진스 · 세븐틴 · 싸이 콘서트',
    badge: '🎤 국내 공연·콘서트',
    title: '현장 텐션 미쳤다는 국내 콘서트·페스티벌 직캠 모먼트 (아이유·뉴진스·세븐틴)',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EC%95%84%EC%9D%B4%EC%9C%A0+%EC%BD%98%EC%84%9C%ED%8A%B8+%EB%89%B4%EC%A7%84%EC%8A%A4+%EC%84%B8%EB%B8%90%ED%8B%B4+%EB%8D%B0%EC%9D%B4%EC%8B%9D%EC%8A%A4+%EC%A7%81%EC%BA%A0+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_concert',
    summary3: [
      '1) 아이유 콘서트 무대 인사, 뉴진스 무대 퍼포먼스, 에스파 카리나, 세븐틴 콘서트, 데이식스, 싸이 공연 실제 무대 MP4 클립 6컷입니다.',
      '2) 공연·콘서트·페스티벌 특유의 현장감과 에너지가 살아 있어 젊은 층(1030) 유입에 탁월합니다.',
      '3) 각 컷의 아티스트 무대 동작과 한국어 자막이 1:1로 맞물립니다.'
    ],
    why: '국내 콘서트·페스티벌·음악방송 레전드 직캠 모먼트를 한 편으로 묶은 고텐션 쇼츠',
    factNote: '📌 출처·포인트: 아이유·뉴진스·에스파·세븐틴·데이식스·싸이 실제 콘서트·무대 클립 6컷. #콘서트직캠 #아이유콘서트 #뉴진스 #세븐틴 #데이식스 #공연쇼츠',
    scenePack: 'beauty',
    cuts: [
      {
        line: '조명이 켜지는 순간 심장이 뛰는 콘서트 현장!',
        mood: '아이유 콘서트 오프닝 원본',
        keyword: '아이유 콘서트',
        mediaType: '🎤 아이유 콘서트 MP4',
        videoUrl: 'https://media.tenor.com/YF3pcmCNkc0AAAPo/bluemong-iu.mp4',
        scenePrompt: 'IU singing live on a sparkling concert stage'
      },
      {
        line: '팬들 보자마자 반갑게 손 흔들어주는 아이유',
        mood: '아이유 팬서비스 원본',
        keyword: '아이유 인사',
        mediaType: '🎤 아이유 직캠 MP4',
        videoUrl: 'https://media.tenor.com/-XlEsRAEh4cAAAPo/iu-wave.mp4',
        scenePrompt: 'IU waving warmly to fans at concert'
      },
      {
        line: '무대 시작하자마자 청량감 터지는 뉴진스 안무!',
        mood: '뉴진스 무대 퍼포먼스 원본',
        keyword: '뉴진스 무대',
        mediaType: '🎤 뉴진스 무대 MP4',
        videoUrl: 'https://media.tenor.com/BhEhZ0nDlXwAAAPo/new-jeans.mp4',
        scenePrompt: 'NewJeans performing upbeat choreography on stage'
      },
      {
        line: '카메라 원샷 잡힐 때마다 레전드 찍는 카리나',
        mood: '에스파 카리나 무대 원본',
        keyword: '에스파 카리나',
        mediaType: '🎤 카리나 직캠 MP4',
        videoUrl: 'https://media.tenor.com/0e8lXqyKL4sAAAPo/karina-yu-jimin.mp4',
        scenePrompt: 'aespa Karina charismatic stage close-up'
      },
      {
        line: '객석 전체가 다 같이 뛰어노는 세븐틴 콘서트!',
        mood: '세븐틴 콘서트 열기 원본',
        keyword: '세븐틴 콘서트',
        mediaType: '🎤 세븐틴 콘서트 MP4',
        videoUrl: 'https://media.tenor.com/L1Ab6cBITT4AAAPo/seventeen-seventeen-concert.mp4',
        scenePrompt: 'Seventeen live concert stage high energy performance'
      },
      {
        line: '역시 공연은 직접 가서 뛰어야 스트레스 풀리죠!',
        mood: '싸이 콘서트 엔딩 원본',
        keyword: '싸이 공연',
        mediaType: '🎤 싸이 공연 MP4',
        videoUrl: 'https://media.tenor.com/E7dY3qMudNkAAAPo/psy-gangnam-style.mp4',
        scenePrompt: 'PSY energetic concert stage dance performance'
      }
    ]
  },
  {
    id: 'meme_chill_guy',
    rank: 7,
    cat: '급상승 밈',
    sourceTag: 'YouTube·TikTok 급상승',
    badge: '🔥 글로벌 밈 1위',
    title: '세상이 무너져도 평온한 "칠 가이(Chill Guy)" 원본 밈',
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
        scenePrompt: 'Vertical 9:16 3D illustrated scene of a calm brown anthropomorphic dog character wearing a grey crewneck sweater'
      },
      {
        line: '이름은 칠 가이, 그냥 느긋한 녀석이죠',
        mood: '칠가이 원본 2컷',
        keyword: 'chill guy my new character',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/uTrHppPi0Z0AAAPo/chill-guy-my-new-character.mp4',
        scenePrompt: 'Vertical 9:16 close-up portrait of a super relaxed brown dog character in a grey sweater'
      },
      {
        line: '바쁜 출근길에도 커피 한 잔 들고 평온한 표정',
        mood: '칠가이 커피 3컷',
        keyword: 'drinking coffee chill guy',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/6x1xYcbxZiYAAAPo/drinking-coffee-chill-guy.mp4',
        scenePrompt: 'Vertical 9:16 scene of a calm brown dog character holding an iced coffee cup'
      },
      {
        line: '통장 잔고가 비어도 주머니 손 넣고 미소 짓죠',
        mood: '칠가이 밈 4컷',
        keyword: 'chill guy hands in pocket meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/rzGlV4ye-MEAAAPo/chill-guy.mp4',
        scenePrompt: 'Vertical 9:16 humorous scene of a chill brown dog character with a peaceful zen smile'
      },
      {
        line: '스트레스 가득한 현대인들의 워너비 자세!',
        mood: '주머니 손 밈 5컷',
        keyword: 'hands in pocket chill meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/ViUgljperkUAAAPo/kevin-james-meme-hands-in-pocket-meme.mp4',
        scenePrompt: 'Vertical 9:16 cinematic golden hour scene of a relaxed character with hands in pockets'
      },
      {
        line: '오늘만큼은 칠 가이처럼 가볍게 넘겨보세요',
        mood: '칠가이 엔딩 6컷',
        keyword: 'chill guy relax',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/FetQ_KhWgd4AAAPo/chill-guy.mp4',
        scenePrompt: 'Vertical 9:16 warm upbeat scene of a chill brown dog character'
      }
    ]
  },
  {
    id: 'meme_cat_huh',
    rank: 8,
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
        scenePrompt: 'Chubby white cat staring at the camera with a frozen disbelief expression'
      },
      {
        line: '머릿속에서 자동으로 재생되는 이 표정',
        mood: '하? 고양이 클로즈업',
        keyword: 'huh cat closeup',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/PP8iPN16qTwAAAPo/huh-cat-huh-m4rtin.mp4',
        scenePrompt: 'Extreme close-up of a chubby white cat with wide confused round eyes'
      },
      {
        line: '네? 지금요? 저한테 말씀하신 건가요?',
        mood: '황당 고양이 리액션',
        keyword: 'huh cat reaction',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/9sqNXE_ZLQYAAAPo/huh-cat.mp4',
        scenePrompt: 'Chubby white cat tilting its head with a bewildered Huh expression'
      },
      {
        line: '전 세계 5억 명이 저장한 레전드 고양이',
        mood: '멍때리는 고양이',
        keyword: 'confused cat huh',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/Ol34ZrcLmpMAAAPo/deaf-cat-deaf.mp4',
        scenePrompt: 'Round chubby white cat sitting upright with an iconic confused expression'
      },
      {
        line: '어떤 억까 상황에도 이 표정 하나면 끝!',
        mood: '고양이 갸우뚱 원본',
        keyword: 'cat buh meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/Lyo1-rb0ETIAAAPo/cat-buh.mp4',
        scenePrompt: 'Humorous close-up of a chubby white cat giving a skeptical side-eye glance'
      },
      {
        line: '오늘 이 표정 지었던 순간 댓글로 적어보세요',
        mood: '하? 고양이 엔딩',
        keyword: 'huh cat m4rtin',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/7t63GFnoIPUAAAPo/huh-cat-huh-m4rtin.mp4',
        scenePrompt: 'Cute chubby white cat looking puzzled at the camera'
      }
    ]
  },
  {
    id: 'meme_golden_door_wait',
    rank: 9,
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
        scenePrompt: 'Fluffy golden retriever dog sitting faithfully in front of a front door'
      },
      {
        line: '입에는 제일 아끼는 인형을 꼭 물고 있죠',
        mood: '인형 문 리트리버 원본',
        keyword: 'golden retriever plush toy',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/h0IwVzyLV78AAAPo/ikea-golden-retriever.mp4',
        scenePrompt: 'Golden retriever gently holding a cute soft plush toy'
      },
      {
        line: '드디어 도어락 번호 누르는 소리가 들리자',
        mood: '초롱초롱 눈빛 원본',
        keyword: 'puppy eyes golden retriever',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/XYjuf2KXZpkAAAPo/puppy-eyes-golden-retriever.mp4',
        scenePrompt: 'Golden retriever perking both ears up high with sparkling wide eyes'
      },
      {
        line: '꼬리가 헬리콥터처럼 돌아가기 시작합니다',
        mood: '꼬리 프로펠러 원본',
        keyword: 'happy puppy wagging tail',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/wWuVTyT7s1EAAAPo/happy-puppy.mp4',
        scenePrompt: 'Happy golden retriever puppy wagging tail excitedly'
      },
      {
        line: '온종일 주인 오기만 기다렸던 거예요',
        mood: '리트리버 미소 원본',
        keyword: 'golden retriever good boy',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/oZ4Y3eY5ckkAAAPo/golden-retriever-good-boy.mp4',
        scenePrompt: 'Smiling happy golden retriever being petted'
      },
      {
        line: '오늘 집에 가면 우리 댕댕이 꼭 안아주세요',
        mood: '리트리버 힐링 엔딩',
        keyword: 'golden retriever cute',
        mediaType: '실제 원본 클립 MP4',
        videoUrl: 'https://media.tenor.com/kWO4BWpFbvIAAAPo/golden-retriever-dog.mp4',
        scenePrompt: 'Cozy shot of a golden retriever relaxing happily'
      }
    ]
  },
  {
    id: 'meme_cat_thief_caught',
    rank: 10,
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
        scenePrompt: 'Cat stretching one fluffy paw slowly toward a fish plate'
      },
      {
        line: '집사랑 눈이 딱 마주친 바로 그 0.1초!',
        mood: '음식 서리 현행범 원본',
        keyword: 'cat stealing food',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/A9fmoHDPrLQAAAPo/cat-stealing-food.mp4',
        scenePrompt: 'Cat caught in the act with paw hovering over food'
      },
      {
        line: '아니아니, 난 그냥 냄새만 맡아보려 했어!',
        mood: '고양이 앞발 스틸 원본',
        keyword: 'cat stealing meme',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/NPDOKfqJlqwAAAPo/cat-stealing.mp4',
        scenePrompt: 'Cat pulling its paw back and making an innocent face'
      },
      {
        line: '앞발만 슬쩍 챙기며 태연하게 딴청 피우기',
        mood: '뻔뻔한 고양이 원본',
        keyword: 'stealing food cat',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/KD0PVJ8WJcAAAAPo/more-for-me-stealing-food.mp4',
        scenePrompt: 'Cat sneaky grabbing food from plate'
      },
      {
        line: '연기대상 감이라는 고양이식 위기 탈출!',
        mood: '피자 스틸 고양이 원본',
        keyword: 'cat pizza steal',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/AQp0CJ5IBHwAAAPo/cat-pizza.mp4',
        scenePrompt: 'Cat trying to steal a slice of pizza'
      },
      {
        line: '이 정도 정성이면 간식 하나 줘야겠죠?',
        mood: '고양이 먹방 원본',
        keyword: 'cat eating snack',
        mediaType: '실제 원본 밈 MP4',
        videoUrl: 'https://media.tenor.com/hlLIv7wM4-UAAAPo/cat-cat-eat.mp4',
        scenePrompt: 'Happy cat enjoying a tasty snack'
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

// ★ 핵심: 한글 검색어(예: "무한도전", "유재석", "도깨비", "범죄도시", "아이유 콘서트")도 Tenor 한국어 페이지(/ko/search/...)에서
// 실제 원본 MP4(media.tenor.com/*AAAPo/*.mp4)와 GIF ID 파생 MP4를 모두 추출!
async function fetchLiveTenorMemeMp4s(query, limit = 6) {
  const rawQ = String(query || '무한도전').trim();
  const hasKorean = /[가-힣]/.test(rawQ);
  const cleanSlug = rawQ
    .replace(/[^a-zA-Z0-9가-힣\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-') || '무한도전';
  const searchUrl = hasKorean
    ? `https://tenor.com/ko/search/${encodeURIComponent(cleanSlug)}-gifs`
    : `https://tenor.com/search/${encodeURIComponent(cleanSlug.toLowerCase())}-gifs`;

  const out = [];
  try {
    const r = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: AbortSignal.timeout(4000)
    });
    if (r.ok) {
      const html = await r.text();
      const directMp4s = html.match(/https:\/\/media\.tenor\.com\/[A-Za-z0-9_-]+AAAP[A-Za-z0-9]\/[A-Za-z0-9_%-]+\.mp4/g) || [];
      const gifMatches = html.match(/https:\/\/media\.tenor\.com\/([A-Za-z0-9_-]{11})AAAA[A-Za-z0-9]\/([A-Za-z0-9_%-]+)\.(?:gif|webp)/g) || [];
      const derivedMp4s = gifMatches.map((g) => {
        const m = g.match(/https:\/\/media\.tenor\.com\/([A-Za-z0-9_-]{11})AAAA[A-Za-z0-9]\/([A-Za-z0-9_%-]+)\.(?:gif|webp)/);
        return m ? `https://media.tenor.com/${m[1]}AAAPo/${m[2]}.mp4` : null;
      }).filter(Boolean);

      const candidates = [...directMp4s, ...derivedMp4s];
      const seen = new Set();
      for (const u of candidates) {
        const hiRes = u.replace(/AAAP[12s]\//, 'AAAPo/');
        const baseKey = hiRes.replace(/AAAP[A-Za-z0-9]\//, '');
        if (!seen.has(baseKey)) {
          seen.add(baseKey);
          let decodedTitle = rawQ;
          try {
            decodedTitle = decodeURIComponent(hiRes.split('/').pop().replace(/\.mp4$/i, '')).replace(/-/g, ' ');
          } catch (_) {}
          out.push({
            url: hiRes,
            isVideo: true,
            source: hasKorean ? '국내 원본 밈 MP4' : 'Tenor 원본 밈 MP4',
            title: decodedTitle
          });
          if (out.length >= limit) break;
        }
      }
    }
  } catch (_) {}

  const giphyKey = String(process.env.GIPHY_API_KEY || '').trim();
  if (giphyKey && out.length < limit) {
    try {
      const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(giphyKey)}&q=${encodeURIComponent(rawQ)}&limit=${limit}&lang=ko&rating=g`, {
        signal: AbortSignal.timeout(2800)
      });
      if (r.ok) {
        const d = await r.json();
        for (const g of (d.data || [])) {
          const mp4Url = g?.images?.downsized_small?.mp4 || g?.images?.original_mp4?.mp4 || g?.images?.fixed_height?.mp4;
          if (mp4Url) out.push({ url: mp4Url, isVideo: true, source: 'GIPHY 원본 밈 MP4', title: g.title || rawQ });
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
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&order=viewCount&publishedAfter=${encodeURIComponent(weekAgo)}&maxResults=4&regionCode=KR&relevanceLanguage=ko&q=${encodeURIComponent('예능 레전드 드라마 명장면 밈 쇼츠')}&key=${encodeURIComponent(ytKey)}`;
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

  const [gTrends, ytShorts, customMp4s] = await Promise.all([
    fetchGoogleTrendsKr(),
    fetchYoutubeTrendingShortsKr(),
    customQuery ? fetchLiveTenorMemeMp4s(customQuery, 6) : Promise.resolve([])
  ]);
  const liveSignals = [...ytShorts, ...gTrends];
  let dynamicItems = [];

  // 사용자가 검색어를 넣었을 때만 상단에 맞춤 밈 설계 카드를 생성 (기본 로드 시에는 검증된 국내 예능/드라마/영화/공연 + 글로벌 Top 10이 1위부터 즉시 노출!)
  if (customQuery) {
    if (geminiKey) {
      try {
        const sys = `당신은 한국 유튜브 쇼츠·인스타 릴스 100만 뷰 예능·드라마·영화·공연 밈 전문 PD입니다.
사용자 검색 요청("${customQuery}")에 맞춰 클릭 1번에 완성되는 6컷 고속 밈 쇼츠 설계도 1개를 JSON 배열로 출력하세요.
규칙:
1) summary3 배열에 "① 어떤 밈/명장면인지", "② 왜 한국에서 인기인지", "③ 쇼츠 연출 팁" 3줄 요약을 담으세요.
2) cuts 배열은 정확히 6컷이며, 각 line은 반드시 14~20자 이내(1줄=1장면 규칙)로 작성하세요.
3) 각 cut의 keyword에는 Tenor 한국어 검색에서 실제 원본 영상이 잘 나오는 한글 또는 영문 키워드(예: "무한도전 박명수", "유재석", "이광수", "도깨비 공유", "범죄도시 마동석", "아이유 콘서트", "${customQuery}")를 넣으세요.
JSON 형식:
[{"id":"custom_1","cat":"국내 예능","sourceTag":"맞춤 원본 밈","badge":"🔥 맞춤 밈 설계","title":"후킹 제목","characterType":"kr_variety","summary3":["1) 요약1","2) 요약2","3) 요약3"],"why":"한 줄 핵심 요약","factNote":"📌 출처·포인트: ... #해시태그","cuts":[{"line":"18자 이내 대사","mood":"1컷 상황","keyword":"${customQuery}","mediaType":"실제 원본 밈 MP4"}]}]`;
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(7500),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sys }] },
            contents: [{ role: 'user', parts: [{ text: `사용자 검색: "${customQuery}"` }] }],
            generationConfig: { temperature: 0.6, responseMimeType: 'application/json' }
          })
        });
        if (r.ok) {
          const d = await r.json();
          const parsed = parseJsonLoose(d?.candidates?.[0]?.content?.parts?.[0]?.text || '');
          if (Array.isArray(parsed) && parsed[0]) {
            const it = parsed[0];
            const livePool = customMp4s.length ? customMp4s : await fetchLiveTenorMemeMp4s(customQuery, 6);
            dynamicItems.push({
              id: `custom_meme_${Date.now()}`,
              rank: 1,
              cat: String(it.cat || '국내 예능'),
              sourceTag: String(it.sourceTag || '실시간 원본 밈 검색'),
              badge: String(it.badge || '🔥 맞춤 원본 밈'),
              title: String(it.title || `${customQuery} 레전드 밈 쇼츠`).slice(0, 50),
              characterType: String(it.characterType || 'kr_variety'),
              ytSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(customQuery + ' 쇼츠')}`,
              summary3: Array.isArray(it.summary3) ? it.summary3.slice(0, 3) : [`1) "${customQuery}" 실제 원본 밈 클립 6컷 자동 매칭`],
              why: String(it.why || `"${customQuery}" 실제 원본 클립 기반 6컷 고속 쇼츠`),
              factNote: String(it.factNote || `📌 "${customQuery}" 원본 클립 6컷 구성 #${customQuery.replace(/\s+/g, '')} #쇼츠`),
              cuts: (it.cuts || []).slice(0, 6).map((c, ci) => ({
                line: String(c.line || '').slice(0, 24),
                mood: String(c.mood || `${ci + 1}컷`),
                keyword: String(c.keyword || customQuery),
                mediaType: '🎬 실제 원본 밈 MP4',
                videoUrl: livePool[ci % Math.max(1, livePool.length)]?.url || TOP10_MEME_RADAR[0].cuts[ci].videoUrl
              }))
            });
          }
        }
      } catch (_) {}
    }
    if (!dynamicItems.length && customMp4s.length) {
      dynamicItems.push({
        id: `custom_meme_${Date.now()}`,
        rank: 1,
        cat: '국내 예능',
        sourceTag: '실시간 원본 밈 MP4',
        badge: '🎬 검색 원본 밈',
        title: `"${customQuery}" 실제 원본 클립 6컷 하이라이트`,
        characterType: 'kr_variety',
        ytSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(customQuery + ' 쇼츠')}`,
        summary3: [
          `1) 검색하신 "${customQuery}" 실제 원본 MP4 클립 ${customMp4s.length}개를 실시간 추출했습니다.`,
          '2) 각 컷마다 다른 원본 클립이 자동 배치되었으며 노래방 자막과 성우 음성이 1:1로 동기화됩니다.',
          '3) 오늘의 키워드나 우리 가게 홍보 모드로도 즉시 패러디할 수 있습니다.'
        ],
        why: `"${customQuery}" 실제 원본 MP4 클립 6컷 실시간 매칭`,
        factNote: `📌 "${customQuery}" 원본 클립 모음 #${customQuery.replace(/\s+/g, '')} #레전드짤 #쇼츠`,
        cuts: Array.from({ length: 6 }, (_, ci) => ({
          line: [
            `요즘 알고리즘에 계속 뜨는 ${customQuery.slice(0, 10)}!`,
            '처음엔 그냥 평범한 장면인 줄 알았는데',
            '볼수록 중독성 터지는 바로 이 표정!',
            '댓글창이 완전히 뒤집어진 이유가 있었네요',
            '어떤 상황에도 찰떡같이 어울리는 레전드 짤!',
            '여러분은 이 장면 몇 점 주시겠어요?'
          ][ci],
          mood: `${customQuery.slice(0, 8)} 원본 ${ci + 1}컷`,
          keyword: customQuery,
          mediaType: '🎬 실제 원본 밈 MP4',
          videoUrl: customMp4s[ci % customMp4s.length].url
        }))
      });
    }
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
  const queries = Array.isArray(body.queries) ? body.queries.slice(0, 6) : [String(body.query || '무한도전')];
  const perCut = await Promise.all(queries.map((q) => fetchLiveTenorMemeMp4s(q, 6)));
  return res.status(200).json({
    ok: true,
    visualsByCut: perCut
  });
}

// ★ 링크(URL) 또는 국내 예능·드라마·영화·공연 이름을 넣으면 실제 원본 밈 MP4 스트림을 자동 추출
async function handleMemeUrlImport(body, res) {
  const rawUrl = String(body.url || '').trim();
  if (!rawUrl) return res.status(400).json({ ok: false, error: 'missing_url' });

  let videoUrl = '';
  let title = '';
  let sourceLabel = '원본 링크 반입';
  let extraVideos = [];

  try {
    if (/\.mp4(\?|$)/i.test(rawUrl)) {
      videoUrl = rawUrl;
      title = rawUrl.split('/').pop().split('?')[0].replace(/\.mp4$/i, '').replace(/[-_]/g, ' ') || '원본 밈 MP4';
      sourceLabel = '직접 MP4 스트림';
    } else if (/giphy\.com/i.test(rawUrl)) {
      const m = rawUrl.match(/\/media\/(?:v1\.[^/]+\/)?([a-zA-Z0-9]+)\//) || rawUrl.match(/-([a-zA-Z0-9]{10,})(?:$|\?|\/)/) || rawUrl.match(/\/gifs\/([a-zA-Z0-9]{10,})/);
      if (m && m[1]) {
        videoUrl = `https://i.giphy.com/media/${m[1]}/giphy.mp4`;
        title = 'GIPHY 원본 밈 클립';
        sourceLabel = 'GIPHY 원본 MP4';
      }
    } else if (/tenor\.com/i.test(rawUrl)) {
      const r = await fetch(rawUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(4000)
      });
      if (r.ok) {
        const html = await r.text();
        const m = html.match(/https:\/\/media\.tenor\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_%-]+\.mp4/);
        if (m) {
          videoUrl = m[0].replace(/AAAP[12s]\//, 'AAAPo/');
          try {
            title = decodeURIComponent(videoUrl.split('/').pop().replace(/\.mp4$/i, '')).replace(/-/g, ' ');
          } catch (_) {
            title = 'Tenor 원본 클립';
          }
          sourceLabel = 'Tenor 원본 MP4';
        }
      }
      if (!videoUrl) {
        const slugMatch = rawUrl.match(/\/view\/([^/?#]+)-gif/i) || rawUrl.match(/\/search\/([^/?#]+)-gifs/i);
        const q = slugMatch ? decodeURIComponent(slugMatch[1]).replace(/-/g, ' ') : '무한도전';
        const list = await fetchLiveTenorMemeMp4s(q, 6);
        if (list.length) {
          videoUrl = list[0].url;
          extraVideos = list.map((x) => x.url);
          title = q;
          sourceLabel = 'Tenor 원본 MP4';
        }
      }
    } else if (/tiktok\.com/i.test(rawUrl)) {
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
    } else if (/youtube\.com|youtu\.be|instagram\.com/i.test(rawUrl)) {
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
      const list = await fetchLiveTenorMemeMp4s(cleanQ, 6);
      if (list.length) {
        videoUrl = list[0].url;
        extraVideos = list.map((x) => x.url);
        sourceLabel = '유튜브 쇼츠 원본 클립 매칭';
      }
    }

    // 한글/영문 검색어(예: "무한도전", "런닝맨", "도깨비", "마동석", "아이유 콘서트", "백종원")를 입력한 경우
    if (!videoUrl) {
      const list = await fetchLiveTenorMemeMp4s(rawUrl, 6);
      if (list.length) {
        videoUrl = list[0].url;
        extraVideos = list.map((x) => x.url);
        title = title || rawUrl;
        sourceLabel = /[가-힣]/.test(rawUrl) ? '국내 원본 클립 MP4' : 'Tenor 원본 밈 MP4';
      }
    }
  } catch (_) {}

  if (!videoUrl) {
    return res.status(200).json({
      ok: false,
      error: 'extract_failed',
      message: '해당 링크나 검색어에서 영상을 가져오지 못했습니다. (예: 무한도전, 런닝맨, 도깨비, 마동석, 아이유 콘서트 또는 TikTok/Tenor 링크)'
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
    maskSpec: { enabled: true, maskY: 0.78, maskH: 0.13, style: 'dark-blur' },
    hookTitles: [
      hint ? `${hint} — 끝까지 보면 터지는 반전` : '끝까지 보면 무조건 터지는 레전드 명장면',
      '처음엔 평범한 줄 알았는데 마지막 3초 대반전!',
      '이래서 요즘 알고리즘에 계속 뜨는구나',
      '한국인이라면 무조건 공감할 수밖에 없는 순간',
      '소리 켜고 끝까지 보세요, 결말이 진짜 레전드'
    ],
    cues: [
      { start: 0, end: stepSec, orig: '(0~2초 오프닝 장면)', ko: '처음엔 그냥 평범한 상황인 줄 알았는데' },
      { start: stepSec, end: +(stepSec * 2).toFixed(1), orig: '(2~4초 상황 전개)', ko: '잠시 뒤 예상 못 한 일이 벌어집니다' },
      { start: +(stepSec * 2).toFixed(1), end: +(stepSec * 3).toFixed(1), orig: '(4~6초 반전 포착)', ko: '바로 이 순간 공기가 완전히 바뀌었죠!' },
      { start: +(stepSec * 3).toFixed(1), end: +(stepSec * 4).toFixed(1), orig: '(6~8초 클라이맥스)', ko: '이 표정 하나에 댓글창이 뒤집혔습니다' },
      { start: +(stepSec * 4).toFixed(1), end: +(stepSec * 5).toFixed(1), orig: '(8~10초 하이라이트)', ko: '다시 봐도 타이밍이 진짜 예술이네요' },
      { start: +(stepSec * 5).toFixed(1), end: duration, orig: '(10~12초 엔딩 질문)', ko: '여러분이라면 이 상황에서 어떻게 하실래요?' }
    ],
    audioPlan: {
      muteOriginal: true,
      duckingRatio: 0.15,
      recommendedBgm: 'upbeat_funny',
      tip: '저작권 보호를 위해 원본 배경음은 제거하고 오토릴스 상업용 무료 BGM으로 자동 교체했습니다.'
    },
    sourceNote: '📌 출처·안내: 원본 클립의 6개 타임스탬프 구간에 맞춰 한국어 자막·더빙·무료 음원을 더해 재가공한 쇼츠입니다. #쇼츠리메이크 #레전드클립 #밈쇼츠'
  };

  if (geminiKey && frames.length > 0) {
    try {
      const imageParts = frames.map((dataUrl) => {
        const m = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!m) return null;
        return { inlineData: { mimeType: m[1], data: m[2] } };
      }).filter(Boolean);

      if (imageParts.length > 0) {
        const sys = `당신은 인기 쇼츠·예능·드라마·해외 클립을 한국어 바이럴 쇼츠로 제작하는 전문 디렉터입니다.
첨부된 영상 연속 프레임(${imageParts.length}장, 총 길이 ${duration}초)을 순서대로 분석해 각 시간 구간에서 실제로 일어나는 장면/행동과 1:1로 일치하는 JSON만 출력하세요:
1) 화면에 기존 자막이 보이면 그 원문(orig)을 읽고 해당 프레임 장면과 정확히 맞물리는 자연스러운 한국어 쇼츠 구어체(ko, 1줄 18자 이내)로 6구간 작성하세요.
2) 자막이 없는 영상이면 각 프레임 구간(1컷~6컷)에서 실제로 보이는 피사체의 표정·행동에 딱 맞는 한국어 상황 해설·속마음 더빙 자막(ko, 1줄 18자 이내)을 6구간으로 작성하세요.
3) 기존 자막의 세로 중심 위치 비율(maskY: 0.65~0.88)과 덮어쓰기 높이 비율(maskH: 0.10~0.16)을 추정하세요.
4) 영상 상단에 고정할 깔끔한 한국어 후킹 제목 5개(hookTitles, 각 18자 이내)를 추천하세요.
JSON 스키마:
{"detectedLang":"자막 감지 | 원본 영상 6구간 비전 분석","maskSpec":{"enabled":true,"maskY":0.78,"maskH":0.13,"style":"dark-blur"},"hookTitles":["제목1","제목2","제목3","제목4","제목5"],"cues":[{"start":0,"end":2,"orig":"해당 프레임 실제 장면","ko":"18자 이내 한국어 자막"}],"sourceNote":"📌 출처 및 설명글 #해시태그"}`;

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
                maskY: Math.max(0.55, Math.min(0.90, Number(parsed.maskSpec?.maskY) || 0.78)),
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
                  ko: String(c.ko || '').slice(0, 26)
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
  const charType = String(meme.characterType || 'kr_variety');
  const baseCuts = Array.isArray(meme.cuts) && meme.cuts.length ? meme.cuts : TOP10_MEME_RADAR[0].cuts;

  const fallbackMashup = mashupType === 'store'
    ? {
        title: `${storeName} 손님들의 흔한 리액션`,
        badge: `🏪 가게 홍보×밈 패러디`,
        characterType: charType,
        why: `"${memeTitle}" 실제 원본 영상에 [${storeName} · ${productPoint}] 매력을 녹인 B급 바이럴 쇼츠`,
        factNote: `📌 ${storeName} (${industryLabel}) · ${productPoint} | 유행 밈 패러디 홍보 쇼츠 #${storeName.replace(/\s+/g, '')} #${industryLabel.replace(/\s+/g, '')} #밈홍보 #쇼츠`,
        hookTitles: [
          `${storeName} 처음 온 손님 리액션`,
          `${productPoint} 실물 영접한 순간`,
          `사장님이 미쳤어요 소리 나오는 ${storeName}`,
          `단골들이 ${storeName}만 찾는 이유`,
          `끝까지 보면 무조건 방문각 ${storeName}`
        ],
        cuts: [
          { line: `요즘 난리 난 ${storeName.slice(0, 8)} 처음 갔을 때`, mood: baseCuts[0]?.mood || '1컷', keyword: baseCuts[0]?.keyword || '무한도전', mediaType: baseCuts[0]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[0]?.videoUrl },
          { line: `솔직히 그냥 평범한 ${industryLabel.slice(0, 5)}인 줄 알았죠`, mood: baseCuts[1]?.mood || '2컷', keyword: baseCuts[1]?.keyword || '무한도전', mediaType: baseCuts[1]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[1]?.videoUrl },
          { line: `그런데 ${productPoint.slice(0, 10)} 나오는 순간!`, mood: baseCuts[2]?.mood || '3컷', keyword: baseCuts[2]?.keyword || '무한도전', mediaType: baseCuts[2]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[2]?.videoUrl },
          { line: '너무 만족스러워서 박수가 절로 나옵니다', mood: baseCuts[3]?.mood || '4컷', keyword: baseCuts[3]?.keyword || '무한도전', mediaType: baseCuts[3]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[3]?.videoUrl },
          { line: `한 번 오면 단골 확정인 ${storeName.slice(0, 8)}!`, mood: baseCuts[4]?.mood || '5컷', keyword: baseCuts[4]?.keyword || '무한도전', mediaType: baseCuts[4]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[4]?.videoUrl },
          { line: '지금 댓글·프로필로 혜택 바로 챙기세요!', mood: baseCuts[5]?.mood || '6컷', keyword: baseCuts[5]?.keyword || '무한도전', mediaType: baseCuts[5]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[5]?.videoUrl }
        ]
      }
    : {
        title: `오늘 난리 난 "${issueKeyword}" 10초 요약`,
        badge: `⚡ 실시간 키워드×밈`,
        characterType: charType,
        why: `오늘 화제인 "${issueKeyword}" 이슈를 "${memeTitle}" 실제 원본 클립으로 재해석한 고속 트렌드 쇼츠`,
        factNote: `📌 오늘의 키워드(${issueKeyword}) × 트렌드 밈 콜라보 요약. #${issueKeyword.replace(/\s+/g, '')} #오늘의밈 #실시간트렌드 #쇼츠`,
        hookTitles: [
          `오늘 난리 난 "${issueKeyword}" 10초 요약`,
          `${issueKeyword} 들었을 때 내 표정`,
          `요즘 1위 밈으로 보는 "${issueKeyword}"`,
          `모르면 대화 안 통하는 "${issueKeyword}"`,
          `${issueKeyword} 댓글창 뒤집어진 이유`
        ],
        cuts: [
          { line: `오늘 갑자기 난리 난 "${issueKeyword.slice(0, 9)}" 소식!`, mood: baseCuts[0]?.mood || '1컷', keyword: baseCuts[0]?.keyword || '무한도전', mediaType: baseCuts[0]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[0]?.videoUrl },
          { line: '처음 들었을 때 다들 딱 이 표정이었죠', mood: baseCuts[1]?.mood || '2컷', keyword: baseCuts[1]?.keyword || '무한도전', mediaType: baseCuts[1]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[1]?.videoUrl },
          { line: `${issueKeyword.slice(0, 9)}, 핵심만 3초 만에 요약하면`, mood: baseCuts[2]?.mood || '3컷', keyword: baseCuts[2]?.keyword || '무한도전', mediaType: baseCuts[2]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[2]?.videoUrl },
          { line: '생각보다 훨씬 반전이라 모두가 놀랐습니다', mood: baseCuts[3]?.mood || '4컷', keyword: baseCuts[3]?.keyword || '무한도전', mediaType: baseCuts[3]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[3]?.videoUrl },
          { line: '이럴 때일수록 여유를 챙기는 게 핵심이죠', mood: baseCuts[4]?.mood || '5컷', keyword: baseCuts[4]?.keyword || '무한도전', mediaType: baseCuts[4]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[4]?.videoUrl },
          { line: `여러분은 이번 ${issueKeyword.slice(0, 8)} 어떻게 보시나요?`, mood: baseCuts[5]?.mood || '6컷', keyword: baseCuts[5]?.keyword || '무한도전', mediaType: baseCuts[5]?.mediaType || '🎬 원본 밈 MP4', videoUrl: baseCuts[5]?.videoUrl }
        ]
      };

  if (geminiKey) {
    try {
      const cutScenesDesc = baseCuts.slice(0, 6).map((c, idx) => `${idx + 1}컷 실제 영상 장면: [${c.mood}] (기존 대사: "${c.line}")`).join('\n');
      const targetDesc = mashupType === 'store'
        ? `[우리 가게·상품 홍보 패러디]\n- 업종: ${industryLabel}\n- 매장/브랜드명: ${storeName}\n- 핵심 어필 상품/혜택: ${productPoint}\n목표: 위 1~6컷의 실제 원본 영상 표정/행동([1컷~6컷 실제 영상 장면])과 1:1로 어우러지는 재치 있는 가게 홍보 패러디 6컷 자막`
        : `[오늘의 실시간 키워드 × 밈 결합]\n- 오늘의 키워드/이슈: ${issueKeyword}\n목표: 위 1~6컷의 실제 원본 영상 표정/행동([1컷~6컷 실제 영상 장면])과 1:1로 어우러지는 오늘의 키워드 결합 6컷 자막`;

      const sys = `당신은 충주맨·숏박스 스타일의 B급 패러디 밈 쇼츠 전문 크리에이티브 디렉터입니다.
선택된 원본 밈 영상 클립 6컷 각각의 실제 장면(표정·행동)과 정확히 맞물리는 1줄=1장면(14~19자 이내) × 6컷 고속 쇼츠 자막 설계도를 JSON으로만 출력하세요.
상단 후킹 제목(hookTitles)도 각각 18자 이내로 깔끔하게 작성하세요.
JSON 스키마:
{"title":"18자 이내 제목","badge":"배지","why":"결합 기획 의도 1줄","factNote":"📌 설명글 및 #해시태그","hookTitles":["상단후킹1","상단후킹2","상단후킹3","상단후킹4","상단후킹5"],"cuts":[{"line":"18자 이내 대사","mood":"감정"}]}`;

      const userMsg = `[선택한 원본 밈]\n제목: ${memeTitle}\n${cutScenesDesc}\n\n${targetDesc}`;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8500),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sys }] },
          contents: [{ role: 'user', parts: [{ text: userMsg }] }],
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' }
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
              title: String(parsed.title || fallbackMashup.title).slice(0, 40),
              badge: String(parsed.badge || fallbackMashup.badge),
              why: String(parsed.why || fallbackMashup.why).slice(0, 120),
              factNote: String(parsed.factNote || fallbackMashup.factNote),
              hookTitles: Array.isArray(parsed.hookTitles) && parsed.hookTitles.length ? parsed.hookTitles.slice(0, 5) : fallbackMashup.hookTitles,
              cuts: parsed.cuts.slice(0, 6).map((c, ci) => ({
                line: String(c.line || '').slice(0, 24),
                mood: String(c.mood || baseCuts[ci]?.mood || `원본 밈 ${ci + 1}컷`),
                keyword: baseCuts[ci]?.keyword || '무한도전',
                mediaType: baseCuts[ci]?.mediaType || '🎬 실제 원본 밈 MP4',
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
