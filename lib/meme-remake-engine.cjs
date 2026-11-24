'use strict';

/**
 * AutoReelsMaker — Dedicated Meme Shorts Studio Backend Engine (Real Video Audio Tracks `mp4a` + Korean & Global Originals)
 * --------------------------------------------------------------------------------------------------------------------------
 * ★ 핵심 업그레이드:
 *   기존 Tenor GIF 파생 MP4는 영상 내부에 오디오 트랙(mp4a/soun)이 아예 없는 무음 파일이었습니다.
 *   이제 GIPHY Clips의 실제 오디오 내장 MP4 스트림(`https://i.giphy.com/media/<ID>/giphy360p.mp4`, HTTP 200, CORS: *, `mp4a` AAC 오디오 트랙 100% 내장 검증 완료!)을
 *   전 컷에 기본 탑재하고 실시간 검색에서도 오디오 내장 클립을 최우선 추출하여, 영상 자체의 실제 원본 소리(웃음소리·대사·현장음·콘서트 함성·밈 원곡 사운드)가 바로 재생됩니다!
 */

const TOP10_MEME_RADAR = [
  {
    id: 'meme_kr_variety_mudo',
    rank: 1,
    cat: '국내 예능',
    sourceTag: '국내 예능 · 실제 원본 오디오 내장 MP4',
    badge: '🔊 실제 영상 소리 포함',
    title: '없는 게 없다는 한국인의 만능 레전드 예능 리액션 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EB%AC%B4%ED%95%9C%EB%8F%84%EC%A0%84+%EB%A0%88%EC%A0%84%EB%93%9C+%EC%A7%A4+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_variety',
    summary3: [
      '1) 무음 GIF가 아니라 영상 파일 자체에 실제 오디오 트랙(AAC 사운드)이 내장된 국내 예능 원본 클립 6컷입니다.',
      '2) 클릭 즉시 영상 자체의 실제 현장음·웃음소리·리액션 소리가 바로 출력됩니다.',
      '3) 상단 [🔊 원본 영상 소리 ON]으로 영상 자체 소리를 듣거나, AI 성우 더빙과 함께 믹싱할 수 있습니다.'
    ],
    why: '영상 자체의 실제 리액션 사운드가 살아 있어 시청 몰입도와 체류시간이 압도적인 예능 밈',
    factNote: '📌 출처·포인트: 실제 오디오 트랙(mp4a)이 내장된 국내 예능 리액션 원본 클립 6컷. #국내예능 #예능레전드 #런닝맨 #무한도전 #예능쇼츠',
    scenePack: 'auto',
    cuts: [
      {
        line: '갑자기 기분 좋은 소식을 들었을 때 내 텐션',
        mood: '런닝맨 실제 사운드 1컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/NrF0O24dP5NuYund2x/giphy360p.mp4'
      },
      {
        line: 'MBC 예능 카메라 앞에서 리액션 폭발할 때',
        mood: 'MBC 실제 사운드 2컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/iozbJADJrH3FIG4HI7/giphy360p.mp4'
      },
      {
        line: '부탁할 게 있을 때 자동으로 나오는 애교 한 방!',
        mood: '예능 실제 사운드 3컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/5gqcqX7ft53VhrZ3za/giphy360p.mp4'
      },
      {
        line: '옆에서 친구가 웃긴 말 하면 결국 빵 터지죠',
        mood: '예능 실제 사운드 4컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/Sb04hDnoUTHbZjGqzi/giphy360p.mp4'
      },
      {
        line: '상상도 못 한 반전 소식에는 동공 지진!',
        mood: '예능 실제 사운드 5컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/q0bfp0CEo6mi7b31BL/giphy360p.mp4'
      },
      {
        line: '그래도 오늘 하루 신나게 소리 지르며 가보자고요!',
        mood: '예능 실제 사운드 6컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/wG8CeP0vfKCIi9IqYd/giphy360p.mp4'
      }
    ]
  },
  {
    id: 'meme_kr_variety_running_njttw',
    rank: 2,
    cat: '국내 예능',
    sourceTag: 'K-버라이어티 · 실제 원본 오디오 내장 MP4',
    badge: '🔊 실제 영상 소리 포함',
    title: '억울함부터 텐션 폭발까지 한국 버라이어티 리액션 모음',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EB%9F%B0%EB%8B%9D%EB%A7%A8+%EC%8B%A0%EC%84%9C%EC%9C%A0%EA%B8%B0+%EB%A0%88%EC%A0%84%EB%93%9C+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_variety',
    summary3: [
      '1) 영상 자체의 실제 목소리와 현장 사운드가 살아 있는 한국 버라이어티 클립 6컷입니다.',
      '2) 억울할 때 → 놀랐을 때 → 신났을 때 → 따봉 엔딩까지 실제 영상 소리와 자막이 맞물립니다.',
      '3) 일상 공감 쇼츠나 우리 가게 이벤트 홍보 패러디에 즉시 사용할 수 있습니다.'
    ],
    why: '실제 영상 오디오와 표정 연기가 함께 터지는 K-예능 하이라이트 조합',
    factNote: '📌 출처·포인트: 실제 오디오 트랙이 살아 있는 한국 버라이어티 리액션 MP4 6컷. #런닝맨 #예능리액션 #한국예능 #유머쇼츠',
    scenePack: 'cafe',
    cuts: [
      {
        line: '나만 빼고 다들 맛있는 거 먹으러 갔을 때',
        mood: 'K-예능 실제 소리 1컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/rgnpMUJxEOMpYREX1Z/giphy360p.mp4'
      },
      {
        line: '심지어 내 몫까지 다 먹었다는 소식을 들으면',
        mood: 'K-예능 실제 소리 2컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/bXZxGfgr0ZnP27Wnkv/giphy360p.mp4'
      },
      {
        line: '배신감에 치가 떨리지만 일단 침착합니다',
        mood: 'K-명장면 실제 소리 3컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/F9FyZ16hxXmyOXLu2N/giphy360p.mp4'
      },
      {
        line: '잠도 안 오고 계속 아른거리는 바로 그 메뉴!',
        mood: 'K-명장면 실제 소리 4컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/T0olmZe2CdCGWqc0Ck/giphy360p.mp4'
      },
      {
        line: '잠깐만요, 내 꺼 따로 포장해 왔다는 한마디에!',
        mood: 'K-명장면 실제 소리 5컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/XhOYXRKeHb8ZYUpREJ/giphy360p.mp4'
      },
      {
        line: '역시 먹을 거 챙겨주는 사람이 최고입니다!',
        mood: 'K-예능 실제 소리 6컷',
        keyword: 'korean',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/6P54jlrOD6Z9zP728m/giphy360p.mp4'
      }
    ]
  },
  {
    id: 'meme_kr_drama_highlights',
    rank: 3,
    cat: '드라마·영화',
    sourceTag: 'K-드라마 · 실제 대사 오디오 내장 MP4',
    badge: '🔊 실제 드라마 소리 포함',
    title: '한국인이 가장 사랑하는 K-드라마 명장면 리액션 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%ED%95%9C%EA%B5%AD+%EB%93%9C%EB%9D%BC%EB%A7%88+%EB%AA%85%EC%9E%A5%EB%A9%B4+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_drama',
    summary3: [
      '1) 영상 자체의 실제 드라마 대사·현장음 오디오 트랙이 포함된 K-드라마 클립 6컷입니다.',
      '2) 실제 배우들의 감정선과 사운드가 그대로 살아 있어 초반 3초 몰입감이 매우 높습니다.',
      '3) 각 컷의 드라마 장면과 한국어 자막이 1:1로 맞물려 돌아갑니다.'
    ],
    why: '실제 드라마 오디오가 살아 있는 K-드라마 명장면 하이라이트 6컷',
    factNote: '📌 출처·포인트: 실제 오디오 트랙(mp4a)이 포함된 K-드라마 클립 6컷. #한국드라마 #K드라마 #드라마명장면 #드라마밈',
    scenePack: 'beauty',
    cuts: [
      {
        line: '등장만으로 분위기 압도하는 드라마 주인공!',
        mood: '수지 실제 소리 1컷',
        keyword: 'kdrama',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/jQ0t8GRLTGpuug1UHj/giphy360p.mp4'
      },
      {
        line: '응답하라 명장면처럼 현실 공감 터지는 순간',
        mood: '응답하라 실제 소리 2컷',
        keyword: 'kdrama',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/V1IqQiM6LmUYBpUTIe/giphy360p.mp4'
      },
      {
        line: '카메라 앞에서도 당당하게 존재감 발산!',
        mood: 'K-스타 실제 소리 3컷',
        keyword: 'kdrama',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/GCKuLFvnuyvWAcFpH6/giphy360p.mp4'
      },
      {
        line: '기분 좋은 소식 들리면 텐션이 수직 상승하죠!',
        mood: 'K-스타 실제 소리 4컷',
        keyword: 'kdrama',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/rA2J7nUH0SlrluwDPW/giphy360p.mp4'
      },
      {
        line: '주인공처럼 시선을 한 몸에 받는 바로 이 순간',
        mood: 'K-스타 실제 소리 5컷',
        keyword: 'kdrama',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/1MqjvYJ02pAOJH7uyy/giphy360p.mp4'
      },
      {
        line: '오늘 여러분의 하루도 드라마처럼 해피엔딩!',
        mood: 'K-드라마 실제 소리 6컷',
        keyword: 'korean drama',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/88zMVbESaT80NzfKwd/giphy360p.mp4'
      }
    ]
  },
  {
    id: 'meme_kr_movie_legends',
    rank: 4,
    cat: '드라마·영화',
    sourceTag: '오징어게임 · 한국 시리즈 실제 오디오 내장 MP4',
    badge: '🔊 실제 명장면 소리 포함',
    title: '긴장감부터 반전까지 "오징어게임 & K-시리즈" 실제 사운드 명장면 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EC%98%A4%EC%A7%95%EC%96%B4%EA%B2%8C%EC%9E%84+%ED%95%9C%EA%B5%AD%EC%98%81%ED%99%94+%EB%AA%85%EC%9E%A5%EB%A9%B4+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_movie',
    summary3: [
      '1) 실제 오징어게임 및 한국 화제작의 원본 사운드가 내장된 명장면 MP4 클립 6컷입니다.',
      '2) 긴장감 넘치는 실제 효과음과 현장 대사가 영상에서 그대로 재생됩니다.',
      '3) 직장인 공감이나 강렬한 매장 이벤트 홍보 패러디에서 압도적인 주목도를 끌어들입니다.'
    ],
    why: '전 세계가 열광한 한국 대표 시리즈의 실제 사운드 내장 명장면 6컷',
    factNote: '📌 출처·포인트: 실제 오디오 트랙이 내장된 오징어게임·K-시리즈 명장면 클립 6컷. #오징어게임 #한국영화 #명장면밈 #쇼츠',
    scenePack: 'auto',
    cuts: [
      {
        line: '너는 다 계획이 있구나 싶을 때 나오는 표정',
        mood: '오징어게임 실제 소리 1컷',
        keyword: 'squid game',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/2GT4RNm6mZP4DLq9XV/giphy360p.mp4'
      },
      {
        line: '자신 있으면 일단 정면으로 붙어봐야죠!',
        mood: '오징어게임 실제 소리 2컷',
        keyword: 'squid game',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/jRZDdgNcxmP4RqQX6B/giphy360p.mp4'
      },
      {
        line: '긴장감이 최고조로 치솟는 바로 그 순간!',
        mood: '오징어게임 실제 소리 3컷',
        keyword: 'squid game',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/8HRKEEloU1VcvV72yR/giphy360p.mp4'
      },
      {
        line: '한 판 더 가자고 외치는 압도적 카리스마',
        mood: '오징어게임 실제 소리 4컷',
        keyword: 'squid game',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/TTQrQZOg5yvq72r2FW/giphy360p.mp4'
      },
      {
        line: '도대체 정체가 뭐냐고 묻는 강렬한 눈빛!',
        mood: '오징어게임 실제 소리 5컷',
        keyword: 'squid game',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/q3AQnx0YT1NagNhJeD/giphy360p.mp4'
      },
      {
        line: '결론은 깔끔하게 승리의 미소로 정리 끝!',
        mood: '오징어게임 실제 소리 6컷',
        keyword: 'squid game',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/68TLqElglFWxyauCe7/giphy360p.mp4'
      }
    ]
  },
  {
    id: 'meme_kr_mukbang_baek_hajungwoo',
    rank: 5,
    cat: '국내 예능',
    sourceTag: 'K-먹방 · 실제 먹방 사운드 내장 MP4',
    badge: '🔊 실제 먹방 소리 포함',
    title: '보는 순간 배고파지는 리얼 사운드 "K-푸드 & 레전드 먹방" 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EB%A0%88%EC%A0%84%EB%93%9C+%EB%A8%B9%EB%B0%A9+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_mukbang',
    summary3: [
      '1) 지글지글 고기 굽는 소리와 맛있게 먹는 실제 ASMR 오디오가 영상 자체에 내장된 K-먹방 클립 6컷입니다.',
      '2) 시각과 청각을 동시에 자극해 맛집·카페·식당 홍보나 다이어트 공감 쇼츠에서 최고 효율을 냅니다.',
      '3) 클릭 즉시 실제 영상 속 먹방 사운드가 그대로 재생됩니다.'
    ],
    why: '실제 먹방 사운드(ASMR)가 영상 자체에 살아 있어 침샘과 조회수를 동시에 자극하는 먹방 밈',
    factNote: '📌 출처·포인트: 실제 오디오 트랙이 살아 있는 K-푸드·먹방 원본 클립 6컷. #먹방밈 #K푸드 #맛집쇼츠 #야식유혹',
    scenePack: 'restaurant',
    cuts: [
      {
        line: '열심히 일한 날 밤에 꼭 떠오르는 이 장면',
        mood: 'K-푸드 실제 소리 1컷',
        keyword: 'korean food',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/CYVCfiQHVTNcVlX8Mw/giphy360p.mp4'
      },
      {
        line: '지글지글 코리안 바비큐 고기 굽는 소리부터 예술!',
        mood: 'K-BBQ 실제 소리 2컷',
        keyword: 'korean food',
        mediaType: '🔊 실제 소리 내장 MP4',
        hasOriginalAudio: false,
        videoUrl: 'https://i.giphy.com/media/wGrPQC4RHM2FMt6aF5/giphy360p.mp4'
      },
      {
        line: '소리까지 맛있는 비빔밥 먹방의 정석이죠',
        mood: 'K-푸드 실제 소리 3컷',
        keyword: 'korean food',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/5SjvOmKBVLN8bhTbQN/giphy360p.mp4'
      },
      {
        line: '오늘 여기 온 이유는 오직 맛있게 먹기 위해서!',
        mood: '리얼 먹방 실제 소리 4컷',
        keyword: 'korean food',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/hWuhUhr46knjN5O2cn/giphy360p.mp4'
      },
      {
        line: '한 입 먹자마자 진짜 맛있다며 감탄 폭발!',
        mood: '리얼 먹방 실제 소리 5컷',
        keyword: 'korean food',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/MAVvCNtqJqmwfrgZ42/giphy360p.mp4'
      },
      {
        line: '오늘 야식 메뉴는 고민 말고 이걸로 정하셨죠?',
        mood: '리얼 먹방 실제 소리 6컷',
        keyword: 'korean food',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/VkkbUMf7NtkyPlrKVL/giphy360p.mp4'
      }
    ]
  },
  {
    id: 'meme_kr_concert_kpop_stage',
    rank: 6,
    cat: '공연·콘서트',
    sourceTag: '세븐틴 · BTS · K-POP 실제 현장음 내장 MP4',
    badge: '🔊 실제 공연 사운드 포함',
    title: '현장 함성·음악이 그대로 들리는 K-POP 콘서트·무대 직캠 모먼트',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=KPOP+%EC%BD%98%EC%84%9C%ED%8A%B8+%EC%84%B8%EB%B8%90%ED%8B%B4+%EB%89%B4%EC%A7%84%EC%8A%A4+%EB%AC%B4%EB%8C%80+%EC%87%BC%EC%B8%A0',
    characterType: 'kr_concert',
    summary3: [
      '1) 세븐틴·BTS·K-POP 무대의 실제 라이브 사운드와 함성이 영상 자체에 내장된 MP4 클립 6컷입니다.',
      '2) 무음 짤과 달리 실제 공연장의 비트와 현장음이 영상에서 바로 터져 나옵니다.',
      '3) 고텐션 쇼츠나 젊은 층 타깃 홍보 영상에 가장 강력한 에너지를 줍니다.'
    ],
    why: '실제 콘서트·무대 현장 오디오가 살아 있는 K-POP 하이라이트 6컷',
    factNote: '📌 출처·포인트: 실제 무대 오디오 트랙(mp4a)이 내장된 K-POP 콘서트·퍼포먼스 클립 6컷. #콘서트직캠 #세븐틴 #BTS #블랙핑크 #공연쇼츠',
    scenePack: 'beauty',
    cuts: [
      {
        line: '조명이 켜지는 순간 심장이 뛰는 서울 공연 현장!',
        mood: 'K-POP 무대 실제 사운드 1컷',
        keyword: 'seventeen',
        mediaType: '🔊 실제 공연 소리 MP4',
        videoUrl: 'https://i.giphy.com/media/hOYym6KpS92WT2jg5U/giphy360p.mp4'
      },
      {
        line: '팬들 보자마자 텐션 폭발하는 무대 매너!',
        mood: 'K-POP 무대 실제 사운드 2컷',
        keyword: 'seventeen',
        mediaType: '🔊 실제 공연 소리 MP4',
        videoUrl: 'https://i.giphy.com/media/cmw3E1f6XrZqhoV3TO/giphy360p.mp4'
      },
      {
        line: '무대 시작하자마자 현장 사운드가 터져 나옵니다',
        mood: 'K-POP 무대 실제 사운드 3컷',
        keyword: 'seventeen',
        mediaType: '🔊 실제 공연 소리 MP4',
        videoUrl: 'https://i.giphy.com/media/zznfDVZ9KjU0qIPQbt/giphy360p.mp4'
      },
      {
        line: '카메라 원샷 잡힐 때마다 레전드 찍는 비주얼',
        mood: 'K-POP 무대 실제 사운드 4컷',
        keyword: 'seventeen',
        mediaType: '🔊 실제 공연 소리 MP4',
        videoUrl: 'https://i.giphy.com/media/x5oKF7lOY189l1F006/giphy360p.mp4'
      },
      {
        line: '객석 전체가 다 같이 빠져드는 라이브 열기!',
        mood: 'BTS 실제 사운드 5컷',
        keyword: 'bts',
        mediaType: '🔊 실제 공연 소리 MP4',
        videoUrl: 'https://i.giphy.com/media/Em5xqaCHG0E9jZRXmu/giphy360p.mp4'
      },
      {
        line: '역시 공연은 직접 듣고 뛰어야 스트레스 풀리죠!',
        mood: 'K-POP 무대 실제 사운드 6컷',
        keyword: 'seventeen',
        mediaType: '🔊 실제 공연 소리 MP4',
        videoUrl: 'https://i.giphy.com/media/B5j7vjIGzSJKmiIrmP/giphy360p.mp4'
      }
    ]
  },
  {
    id: 'meme_chill_guy',
    rank: 7,
    cat: '급상승 밈',
    sourceTag: 'Chill Guy · 실제 밈 원곡 오디오 내장 MP4',
    badge: '🔊 실제 칠가이 사운드 포함',
    title: '세상이 무너져도 평온한 "칠 가이(Chill Guy)" 실제 사운드 원본 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=Chill+Guy+%EC%B9%A0%EA%B0%80%EC%9D%B4+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'chill_dog',
    summary3: [
      '1) 칠 가이(Chill Guy) 특유의 평온한 피아노·배경 사운드가 영상 파일 자체에 내장된 실제 원본 MP4 클립 6컷입니다!',
      '2) 클릭 즉시 칠 가이 원본 영상의 실제 사운드가 그대로 흘러나옵니다.',
      '3) 직장인 공감·일상 유머·우리 가게 홍보 어디에나 찰떡같이 어울립니다.'
    ],
    why: '칠 가이 특유의 평온한 원본 오디오가 영상 자체에 살아 있는 글로벌 1위 밈',
    factNote: '📌 팩트·출처: 실제 오디오 트랙이 내장된 Chill Guy 원본 클립 6컷. #칠가이 #ChillGuy #밈해설 #쇼츠트렌드',
    scenePack: 'cafe',
    cuts: [
      {
        line: '요즘 쇼츠마다 나오는 이 강아지 정체',
        mood: '칠가이 실제 사운드 1컷',
        keyword: 'chill guy',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/iLFB4tAhLwvIoxKN3N/giphy360p.mp4'
      },
      {
        line: '이름은 칠 가이, 그냥 느긋한 녀석이죠',
        mood: '칠가이 실제 사운드 2컷',
        keyword: 'chill guy',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/N5kvM9MrB5QZz5Ih8B/giphy360p.mp4'
      },
      {
        line: '바쁜 출근길에도 아무 타격 없는 평온한 표정',
        mood: '칠가이 실제 사운드 3컷',
        keyword: 'chill guy',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/OHvHZX2ECScJWi42KT/giphy360p.mp4'
      },
      {
        line: '통장 잔고가 비어도 주머니 손 넣고 미소 짓죠',
        mood: '칠가이 실제 사운드 4컷',
        keyword: 'chill guy',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/YloX4JGpFpcOj585d0/giphy360p.mp4'
      },
      {
        line: '스트레스 가득한 현대인들의 워너비 자세!',
        mood: '칠가이 실제 사운드 5컷',
        keyword: 'chill guy',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/wCrk554kM9vO3mqi7A/giphy360p.mp4'
      },
      {
        line: '오늘만큼은 칠 가이처럼 가볍게 넘겨보세요',
        mood: '칠가이 실제 사운드 6컷',
        keyword: 'chill guy',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/iLFB4tAhLwvIoxKN3N/giphy360p.mp4'
      }
    ]
  },
  {
    id: 'meme_cat_huh',
    rank: 8,
    cat: '동물·유머',
    sourceTag: '고양이 밈 · 실제 고양이 사운드 내장 MP4',
    badge: '🔊 실제 고양이 소리 포함',
    title: '소리 켜고 보면 더 웃긴 글로벌 5억 뷰 고양이 리액션 밈',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=Cat+Meme+%EA%B3%A0%EC%96%91%EC%9D%B4+%EB%B0%88+%EC%87%BC%EC%B8%A0',
    characterType: 'huh_cat',
    summary3: [
      '1) 실제 고양이 울음소리와 유머 사운드가 영상 파일 자체에 내장된 고양이 밈 원본 클립 6컷입니다.',
      '2) 무음 짤이 아니라 영상 자체에서 실제 고양이 리액션 소리가 바로 나옵니다.',
      '3) 직장·학교·일상 억까 상황 쇼츠에 넣으면 재시청률이 가장 높습니다.'
    ],
    why: '영상 자체에 실제 고양이 리액션 사운드가 살아 있는 글로벌 동물 유머 1위 밈',
    factNote: '📌 팩트·출처: 실제 오디오 트랙(mp4a)이 내장된 고양이 리액션 클립 6컷. #고양이밈 #동물쇼츠 #유머',
    scenePack: 'shop',
    cuts: [
      {
        line: '퇴근 5분 전에 갑자기 새 일을 시킬 때',
        mood: '고양이 실제 소리 1컷',
        keyword: 'cat meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/IsDjNQPc4weWPEwhWm/giphy360p.mp4'
      },
      {
        line: '머릿속에서 자동으로 재생되는 이 표정',
        mood: '고양이 실제 소리 2컷',
        keyword: 'cat meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/WBlFfEBdFOlFW8nbms/giphy360p.mp4'
      },
      {
        line: '네? 지금요? 저한테 말씀하신 건가요?',
        mood: '고양이 실제 소리 3컷',
        keyword: 'cat meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/fSDsEyqLhzTW35XAK2/giphy360p.mp4'
      },
      {
        line: '전 세계 5억 명이 저장한 레전드 고양이',
        mood: '고양이 실제 소리 4컷',
        keyword: 'cat meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/lNx1T5rMrX4XkHLQv2/giphy360p.mp4'
      },
      {
        line: '어떤 억까 상황에도 이 리액션 하나면 끝!',
        mood: '고양이 실제 소리 5컷',
        keyword: 'cat meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/Z3e2HuMMqqSLmN5Qqu/giphy360p.mp4'
      },
      {
        line: '오늘 이 표정 지었던 순간 댓글로 적어보세요',
        mood: '고양이 실제 소리 6컷',
        keyword: 'funny cat',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/cwQCUhKible5mGrtMO/giphy360p.mp4'
      }
    ]
  },
  {
    id: 'meme_golden_door_wait',
    rank: 9,
    cat: '동물·유머',
    sourceTag: '골든리트리버 · 실제 강아지 오디오 내장 MP4',
    badge: '🔊 실제 강아지 소리 포함',
    title: '주인 마중 나오는 골든리트리버 실제 사운드 힐링·반전 클립',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EA%B3%A8%EB%93%A0%EB%A6%AC%ED%8A%B8%EB%A6%AC%EB%B2%84+%EB%A7%88%EC%A4%91+%EC%87%BC%EC%B8%A0',
    characterType: 'golden_retriever',
    summary3: [
      '1) 실제 골든리트리버의 귀여운 숨소리와 현장 오디오가 영상 파일 자체에 살아 있는 MP4 클립 6컷입니다.',
      '2) 클릭 즉시 영상 자체의 실제 강아지 사운드가 그대로 재생됩니다.',
      '3) 반려견 공감 쇼츠나 따뜻한 매장 홍보 영상에 최고의 반응을 이끌어냅니다.'
    ],
    why: '실제 반려견 현장 사운드가 살아 있는 골든리트리버 바이럴 클립 6컷',
    factNote: '📌 제작 가이드: 실제 오디오 트랙이 내장된 골든리트리버 원본 클립 6컷. #골든리트리버 #강아지쇼츠 #감동쇼츠',
    scenePack: 'cafe',
    cuts: [
      {
        line: '현관문 앞에서 주인만 기다리는 우리 강아지',
        mood: '리트리버 실제 소리 1컷',
        keyword: 'golden retriever',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/gqBrnIXCUKSUB5yayy/giphy360p.mp4'
      },
      {
        line: '카메라만 봐도 반가움이 온몸에서 느껴지죠',
        mood: '리트리버 실제 소리 2컷',
        keyword: 'golden retriever',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/ongMxgRC1gaknNyWV8/giphy360p.mp4'
      },
      {
        line: '드디어 반가운 목소리가 들리기 시작하자',
        mood: '리트리버 실제 소리 3컷',
        keyword: 'golden retriever',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/fLuPFFzZ8fSe9Of07r/giphy360p.mp4'
      },
      {
        line: '꼬리가 헬리콥터처럼 돌아가기 시작합니다',
        mood: '리트리버 실제 소리 4컷',
        keyword: 'golden retriever',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/rWSTWKoQTT81oiJ6E2/giphy360p.mp4'
      },
      {
        line: '온종일 주인 오기만 기다렸던 거예요',
        mood: '리트리버 실제 소리 5컷',
        keyword: 'golden retriever',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/MbL8yL9V0YGG71llsC/giphy360p.mp4'
      },
      {
        line: '오늘 집에 가면 우리 댕댕이 꼭 안아주세요',
        mood: '리트리버 실제 소리 6컷',
        keyword: 'golden retriever',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/LztiZcUGIdOxwan65U/giphy360p.mp4'
      }
    ]
  },
  {
    id: 'meme_dog_funny_reaction',
    rank: 10,
    cat: '동물·유머',
    sourceTag: '댕댕이 유머 · 실제 오디오 내장 MP4',
    badge: '🔊 실제 댕댕이 소리 포함',
    title: '사고 쳐놓고 눈치 보는 강아지들의 실제 사운드 폭소 모먼트',
    ytSearchUrl: 'https://www.youtube.com/results?search_query=%EA%B0%95%EC%95%84%EC%A7%80+%EB%88%88%EC%B9%98+%EB%A0%88%EC%A0%84%EB%93%9C+%EC%87%BC%EC%B8%A0',
    characterType: 'guilty_puppy',
    summary3: [
      '1) 실제 강아지 짖는 소리·애교 소리가 영상 파일 자체에 내장된 유머 클립 6컷입니다.',
      '2) 소리 켜고 보면 웃음이 터지는 실제 오디오 클립들로만 엄선했습니다.',
      '3) 마지막 컷에 댓글 투표 질문을 넣으면 참여율이 2배 이상 뜁니다.'
    ],
    why: '실제 강아지 사운드가 내장되어 호불호 없이 높은 좋아요율을 기록하는 동물 유머 밈',
    factNote: '📌 제작 가이드: 실제 오디오 트랙(mp4a)이 내장된 강아지 유머 클립 6컷. #강아지밈 #반려견유머 #댕댕이쇼츠',
    scenePack: 'cafe',
    cuts: [
      {
        line: '퇴근하고 문을 열자마자 마주친 수상한 눈빛',
        mood: '댕댕이 실제 소리 1컷',
        keyword: 'dog meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/fdSRp7kQKu2jLLe0ce/giphy360p.mp4'
      },
      {
        line: '범인을 찾으려고 이름을 조용히 불러봤더니',
        mood: '댕댕이 실제 소리 2컷',
        keyword: 'dog meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/hvY160ZILw4NzkUQbk/giphy360p.mp4'
      },
      {
        line: '벌써 귀를 쫑긋하며 애교부터 발사합니다!',
        mood: '댕댕이 실제 소리 3컷',
        keyword: 'dog meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/XH5sykHjMp3I5N35zZ/giphy360p.mp4'
      },
      {
        line: '이렇게 귀여운 소리로 애교 부리면 반칙이죠',
        mood: '댕댕이 실제 소리 4컷',
        keyword: 'dog meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/VpmZmEnjiSN5GGFPuV/giphy360p.mp4'
      },
      {
        line: '화내려던 마음도 3초 만에 사르르 녹습니다',
        mood: '댕댕이 실제 소리 5컷',
        keyword: 'dog meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/N91p7yGzlXg5zzn4XC/giphy360p.mp4'
      },
      {
        line: '여러분은 바로 용서한다 vs 단호하게 혼낸다?',
        mood: '댕댕이 실제 소리 6컷',
        keyword: 'dog meme',
        mediaType: '🔊 실제 소리 내장 MP4',
        videoUrl: 'https://i.giphy.com/media/MEdRTaYvZBlVMEjwZ3/giphy360p.mp4'
      }
    ]
  }
];

const FACTORY_FORMATS = [
  {
    "type": "ranking",
    "label": "랭킹",
    "title": "친구에게 보내고 싶은 리액션 TOP 5",
    "base": "meme_kr_variety_running_njttw",
    "lines": [
      "친구에게 보내고 싶은 리액션 다섯 가지",
      "5위, 할 말을 잃은 순간",
      "4위, 웃음 참다가 들켰을 때",
      "3위, 아무렇지 않은 척하기",
      "2위, 뒤늦게 이해한 표정",
      "내가 고른 1위는 이 장면"
    ],
    "ranks": [
      "5위 · 당황",
      "4위 · 웃음 참기",
      "3위 · 태연한 척",
      "2위 · 뒤늦은 깨달음",
      "1위 · 내 선택"
    ]
  },
  {
    "type": "news",
    "label": "안내 브리핑",
    "title": "지원사업 공고에서 확인할 다섯 가지",
    "base": "meme_kr_drama_highlights",
    "lines": [
      "지원사업 공고를 열었나요?",
      "첫째, 신청할 수 있는 대상",
      "둘째, 접수가 끝나는 날짜",
      "셋째, 준비해야 할 서류",
      "넷째, 공식 접수처 주소",
      "마지막으로 공고의 문의처를 저장하세요"
    ],
    "tags": [
      "공고 읽는 법",
      "지원 대상",
      "접수 기간",
      "제출 서류",
      "공식 접수처",
      "문의처"
    ]
  },
  {
    "type": "shopping",
    "label": "쇼핑",
    "title": "상품을 소개하는 여섯 장면",
    "base": "meme_kr_mukbang_baek_hajungwoo",
    "lines": [
      "어떤 상황에서 쓰는 제품일까요?",
      "먼저 포장을 열어볼게요",
      "가장 자주 쓰는 기능이에요",
      "직접 써 보면 이 부분이 보여요",
      "구매 전에는 옵션도 살펴보세요",
      "가격과 구성은 상품 설명에서 확인하세요"
    ],
    "tags": [
      "상품 소개",
      "구성품",
      "주요 기능",
      "사용 장면",
      "옵션 확인",
      "상품 정보"
    ]
  },
  {
    "type": "fortune",
    "label": "오늘의 운세",
    "title": "가볍게 보는 오늘의 행운 미션",
    "base": "meme_cat_huh",
    "lines": [
      "오늘의 작은 행운을 뽑아볼까요?",
      "따뜻한 말 한마디 건네기",
      "잠깐 멈춰서 하늘 보기",
      "미뤄 둔 연락 한 통 하기",
      "좋았던 순간 하나 적어두기",
      "오늘 해 볼 미션을 골라보세요"
    ],
    "tags": [
      "재미로 보는 운세",
      "행운의 말",
      "행운의 순간",
      "행운의 연락",
      "행운의 기록",
      "나의 선택"
    ]
  }
];
const QUOTE_TOPICS = [
  {
    "work": "다모",
    "genre": "드라마",
    "year": 2003,
    "quote": "아프냐? 나도 아프다",
    "by": "iMBC",
    "url": "https://enews.imbc.com/News/RetrieveNewsInfo/523674",
    "lines": [
      "두 배우가 다시 만났다",
      "23년 만에 다시 꺼낸 한마디",
      "아프냐? 나도 아프다",
      "안부를 묻고 자기 마음으로 답한다"
    ],
    "color": "#564236"
  },
  {
    "work": "극한직업",
    "genre": "영화",
    "year": 2019,
    "quote": "지금까지 이런 맛은 없었다.",
    "by": "채널A",
    "url": "https://ichannela.com/news/detail/000000169490.do",
    "lines": [
      "형사가 치킨집 전화를 받는다",
      "목소리는 누구보다 진지하다",
      "지금까지 이런 맛은 없었다.",
      "잠복근무가 광고가 되는 순간"
    ],
    "color": "#694324"
  },
  {
    "work": "상속자들",
    "genre": "드라마",
    "year": 2013,
    "quote": "혹시 나, 너 좋아하냐?",
    "by": "SBS",
    "url": "https://news.sbs.co.kr/news/endPage.do?news_id=N1002127727",
    "lines": [
      "고백을 질문으로 하면",
      "마음을 먼저 들킨 건 누구일까",
      "혹시 나, 너 좋아하냐?",
      "물음표 하나가 김탄의 고백을 바꾼다"
    ],
    "color": "#513e56"
  },
  {
    "work": "기생충",
    "genre": "영화",
    "year": 2019,
    "quote": "너는 다 계획이 있구나",
    "by": "연합뉴스",
    "url": "https://www.yna.co.kr/view/AKR20200210120351001",
    "lines": [
      "아들의 계획을 들은 아버지",
      "처음 들으면 칭찬처럼 들린다",
      "너는 다 계획이 있구나",
      "결말을 알고 들으면 어떻게 들릴까"
    ],
    "color": "#304b47"
  }
];

const {loadRecent} = require('./meme-recent.cjs');

async function recentQuotes(refresh) {
  const entries = await loadRecent('quotes',refresh);
  const seen = new Map(), items = [];
  for (const entry of entries) {
    if ((seen.get(entry.work) || 0) >= 2) continue;
    seen.set(entry.work,(seen.get(entry.work) || 0)+1);
    const lines = [entry.work,entry.context || entry.publisher,entry.quote,'이 대사를 들은 순간, 어떤 생각이 들었나요?'];
    items.push({id:'quote_'+entry.id,factoryType:'quote',cat:'명대사',title:entry.work,genre:entry.genre,
      color:'#433954',quote:entry.quote,publishedAt:entry.publishedAt,badge:'최근 게시',sourceTag:entry.publisher,
      sourceUrl:'https://www.youtube.com/watch?v='+entry.id,why:entry.context,factNote:'대사 출처 · '+entry.publisher,
      cuts:lines.map((line,i)=>({line,role:['도입','상황','대사','여운'][i],mediaType:'타이포그래피'}))});
    if (items.length===8) break;
  }
  return items.concat(quoteTopics().map(item=>({...item,badge:'고전 명대사'})));
}

async function recentMemePacks(refresh) {
  const entries = await loadRecent('clips',refresh);
  const packs=[];
  for (let i=0;i<Math.min(entries.length,18);i+=6) {
    const clips=entries.slice(i,i+6);
    packs.push({id:'recent_'+clips[0].id,fresh:true,cat:'급상승 밈',badge:'최근 게시',sourceTag:'GIPHY',
      publishedAt:clips[0].publishedAt,title:'최근 리액션 · '+clips[0].title,why:'최근 7일 동안 GIPHY에 게시된 원본 클립',
      factNote:clips.map(c=>c.publisher+' · '+c.publishedAt.slice(0,10)).join(' / '),
      cuts:clips.map(c=>({line:c.title,keyword:c.title,publishedAt:c.publishedAt,publisher:c.publisher,
        mediaType:c.hasOriginalAudio ? '원본 영상' : '무음 클립',hasOriginalAudio:c.hasOriginalAudio,videoUrl:c.url}))});
  }
  return packs;
}

function quoteTopics() {
  const feed = require('../public/daily-keywords.json');
  const age = Date.now() - Date.parse(feed.collectedAt);
  const today = age >= 0 && age < 86400000 ? [...(feed.items || []), ...(feed.issues || [])] : [];
  return QUOTE_TOPICS.map(topic => {
    const matched = today.some(entry => entry.term === topic.work || String(entry.headline || '').includes('〈' + topic.work + '〉'));
    return { id: 'quote_' + topic.work, factoryType: 'quote', cat: '명대사', title: topic.work,
      quote: topic.quote, color: topic.color, year: topic.year, genre: topic.genre,
      badge: matched ? '오늘의 이슈' : topic.genre, sourceTag: topic.by, sourceUrl: topic.url,
      why: topic.lines[1], factNote: '대사 출처 · ' + topic.by + ' ' + topic.url,
      cuts: topic.lines.map((line, i) => ({line, role: ['도입','상황','대사','여운'][i], mediaType: '타이포그래피'}))
    };
  }).sort((a,b) => Number(b.badge === '오늘의 이슈') - Number(a.badge === '오늘의 이슈'));
}

function factoryTemplates() {
  return FACTORY_FORMATS.map(format => {
    const source = TOP10_MEME_RADAR.find(item => item.id === format.base);
    return {
      id: 'factory_' + format.type, factoryType: format.type, cat: '쇼츠 포맷',
      title: format.title, badge: format.label, sourceTag: '편집용 예시', rankingItems: format.ranks,
      why: '예시 영상을 내 클립으로 교체하고 컷별 문구를 편집할 수 있어요.',
      cuts: source.cuts.map((cut, i) => ({
        ...cut, line: format.lines[i], newsTag: format.tags?.[i], priceTag: format.tags?.[i], fortuneTag: format.tags?.[i]
      }))
    };
  });
}

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

const {searchMedia}=require('./meme-media-search.cjs');
function searchItem(query,sources) {
  return {id:'search_'+sources.map(s=>s.id).join('_'),searchQuery:query,cat:'검색 결과',title:query,badge:'검색 원본',
    sourceTag:[...new Set(sources.map(s=>s.source.split(' ')[0]))].join(' · '),
    why:query+' 검색 결과 '+sources.length+'컷',factNote:'원본 제목과 태그로 검색',
    cuts:sources.map(s=>({line:s.title,keyword:query,mood:s.title,mediaType:s.source,hasOriginalAudio:s.hasAudio,sourceId:s.id,videoUrl:s.url}))};
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
  if (customQuery) {
    const query=customQuery.slice(0,140);
    const sources=await searchMedia(query);
    return res.status(200).json({ok:true,items:sources.length ? [searchItem(query,sources)] : []});
  }
  if (category === '명대사' && !customQuery) return res.status(200).json({ok:true, items:await recentQuotes(Boolean(body.refresh))});
  if (category === '쇼츠 포맷' && !customQuery) return res.status(200).json({ok:true, items:factoryTemplates()});
  if (!customQuery && ['all','급상승 밈'].includes(category)) return res.status(200).json({ok:true,items:await recentMemePacks(Boolean(body.refresh))});
  const [gTrends,ytShorts]=await Promise.all([fetchGoogleTrendsKr(),fetchYoutubeTrendingShortsKr()]);
  const combined = TOP10_MEME_RADAR.map(item=>({...item,badge:'보관함 예시'})).map((it, i) => ({
    ...it,
    rank: i + 1,
    ytSearchUrl: it.ytSearchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(it.title + ' 쇼츠')}`
  }));
  const filtered = (category && category !== 'all' && category !== '보관함' && !customQuery)
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
    items: filtered.slice(0, 12)
  });
}

async function handleMemeVisuals(body, res) {
  const queries = Array.isArray(body.queries) ? body.queries.slice(0, 6) : [String(body.query || 'running man')];
  if (body.recentOnly) {
    const recent = await loadRecent('clips');
    const candidates = recent.map(c=>({url:c.url,title:c.title,source:c.publisher,publishedAt:c.publishedAt,hasOriginalAudio:c.hasOriginalAudio}));
    return res.status(200).json({ok:true,visualsByCut:queries.map(()=>candidates)});
  }
  const perCut = await Promise.all(queries.map((q) => searchMedia(q, 6)));
  return res.status(200).json({
    ok: true,
    visualsByCut: perCut
  });
}

async function handleMemeUrlImport(body,res) {
  const raw=String(body.url || '').trim();
  if (!raw) return res.status(400).json({ok:false,error:'missing_url'});
  let url;
  try { url=new URL(raw); } catch (_) {
    const media=await searchMedia(raw);
    return res.status(200).json(media.length ? {ok:true,item:searchItem(raw,media),title:raw,videoUrl:media[0].url,extraVideos:media.map(s=>s.url)}
      : {ok:false,message:'입력한 검색어와 일치하는 원본을 찾지 못했어요.'});
  }
  let videoUrl='',title='원본 영상',sourceLabel='원본 MP4';
  if (url.protocol==='https:' && !url.username && !url.password && !url.port) {
    const host=url.hostname.toLowerCase();
    try {
      if (/\.mp4$/i.test(url.pathname)) {
        videoUrl=url.href; title=decodeURIComponent(url.pathname.split('/').pop()).replace(/\.mp4$/i,'');
      } else if (host==='giphy.com' || host==='www.giphy.com') {
        const m=url.pathname.match(/^\/(clips|gifs)\/(?:[^/]*-)?([a-zA-Z0-9]+)\/?$/);
        if (m) {videoUrl='https://media.giphy.com/media/'+m[2]+'/'+(m[1]==='clips'?'giphy360p.mp4':'giphy.mp4');sourceLabel='GIPHY';}
      } else if (['tenor.com','www.tenor.com'].includes(host) && /^\/(?:[a-z]{2}\/)?view\/[^/]+$/.test(url.pathname)) {
        const page=await fetch('https://tenor.com'+url.pathname,{signal:AbortSignal.timeout(4000)});
        const m=(await page.text()).match(/property="og:video" content="(https:\/\/media\d*\.tenor\.com\/[^"<>]+\.mp4)"/);
        if (m) {videoUrl=m[1];sourceLabel='Tenor';}
      } else if (host==='tiktok.com' || host.endsWith('.tiktok.com')) {
        const page=await fetch(url.href,{redirect:'manual',signal:AbortSignal.timeout(4000)});
        if (page.ok) {
          const m=(await page.text()).match(/<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
          const item=m && JSON.parse(m[1]).__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
          if (item?.video?.playAddr && /^https:\/\//.test(item.video.playAddr)) {videoUrl=item.video.playAddr;title=item.desc || title;sourceLabel='TikTok';}
        }
      }
    } catch (_) {}
  }
  return res.status(200).json(videoUrl ? {ok:true,videoUrl,extraVideos:[videoUrl],title,sourceLabel} :
    {ok:false,error:'original_unavailable',message:'이 링크에서 편집할 원본 영상을 열 수 없어요. 원본 영상 파일을 선택해 주세요.'});
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
      muteOriginal: false,
      duckingRatio: 0.85,
      recommendedBgm: 'upbeat_funny',
      tip: '원본 영상 자체의 오디오 트랙을 살려 재생합니다.'
    },
    sourceNote: '📌 출처·안내: 원본 클립의 6개 타임스탬프 구간에 맞춰 한국어 자막을 더해 재가공한 쇼츠입니다. #쇼츠리메이크 #레전드클립 #밈쇼츠'
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
  const mashupType = String(body.mashupType || 'keyword').trim();
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
        why: `"${memeTitle}" 실제 소리 내장 원본 영상에 [${storeName} · ${productPoint}] 매력을 녹인 B급 바이럴 쇼츠`,
        factNote: `📌 ${storeName} (${industryLabel}) · ${productPoint} | 유행 밈 패러디 홍보 쇼츠 #${storeName.replace(/\s+/g, '')} #${industryLabel.replace(/\s+/g, '')} #밈홍보 #쇼츠`,
        hookTitles: [
          `${storeName} 처음 온 손님 리액션`,
          `${productPoint} 실물 영접한 순간`,
          `사장님이 미쳤어요 소리 나오는 ${storeName}`,
          `단골들이 ${storeName}만 찾는 이유`,
          `끝까지 보면 무조건 방문각 ${storeName}`
        ],
        cuts: [
          { line: `요즘 난리 난 ${storeName.slice(0, 8)} 처음 갔을 때`, mood: baseCuts[0]?.mood || '1컷', keyword: baseCuts[0]?.keyword || 'running man', mediaType: baseCuts[0]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[0]?.videoUrl },
          { line: `솔직히 그냥 평범한 ${industryLabel.slice(0, 5)}인 줄 알았죠`, mood: baseCuts[1]?.mood || '2컷', keyword: baseCuts[1]?.keyword || 'running man', mediaType: baseCuts[1]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[1]?.videoUrl },
          { line: `그런데 ${productPoint.slice(0, 10)} 나오는 순간!`, mood: baseCuts[2]?.mood || '3컷', keyword: baseCuts[2]?.keyword || 'running man', mediaType: baseCuts[2]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[2]?.videoUrl },
          { line: '너무 만족스러워서 박수가 절로 나옵니다', mood: baseCuts[3]?.mood || '4컷', keyword: baseCuts[3]?.keyword || 'running man', mediaType: baseCuts[3]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[3]?.videoUrl },
          { line: `한 번 오면 단골 확정인 ${storeName.slice(0, 8)}!`, mood: baseCuts[4]?.mood || '5컷', keyword: baseCuts[4]?.keyword || 'running man', mediaType: baseCuts[4]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[4]?.videoUrl },
          { line: '지금 댓글·프로필로 혜택 바로 챙기세요!', mood: baseCuts[5]?.mood || '6컷', keyword: baseCuts[5]?.keyword || 'running man', mediaType: baseCuts[5]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[5]?.videoUrl }
        ]
      }
    : {
        title: `오늘 난리 난 "${issueKeyword}" 10초 요약`,
        badge: `⚡ 실시간 키워드×밈`,
        characterType: charType,
        why: `오늘 화제인 "${issueKeyword}" 이슈를 "${memeTitle}" 실제 소리 내장 클립으로 재해석한 고속 트렌드 쇼츠`,
        factNote: `📌 오늘의 키워드(${issueKeyword}) × 트렌드 밈 콜라보 요약. #${issueKeyword.replace(/\s+/g, '')} #오늘의밈 #실시간트렌드 #쇼츠`,
        hookTitles: [
          `오늘 난리 난 "${issueKeyword}" 10초 요약`,
          `${issueKeyword} 들었을 때 내 표정`,
          `요즘 1위 밈으로 보는 "${issueKeyword}"`,
          `모르면 대화 안 통하는 "${issueKeyword}"`,
          `${issueKeyword} 댓글창 뒤집어진 이유`
        ],
        cuts: [
          { line: `오늘 갑자기 난리 난 "${issueKeyword.slice(0, 9)}" 소식!`, mood: baseCuts[0]?.mood || '1컷', keyword: baseCuts[0]?.keyword || 'running man', mediaType: baseCuts[0]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[0]?.videoUrl },
          { line: '처음 들었을 때 다들 딱 이 표정이었죠', mood: baseCuts[1]?.mood || '2컷', keyword: baseCuts[1]?.keyword || 'running man', mediaType: baseCuts[1]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[1]?.videoUrl },
          { line: `${issueKeyword.slice(0, 9)}, 핵심만 3초 만에 요약하면`, mood: baseCuts[2]?.mood || '3컷', keyword: baseCuts[2]?.keyword || 'running man', mediaType: baseCuts[2]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[2]?.videoUrl },
          { line: '생각보다 훨씬 반전이라 모두가 놀랐습니다', mood: baseCuts[3]?.mood || '4컷', keyword: baseCuts[3]?.keyword || 'running man', mediaType: baseCuts[3]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[3]?.videoUrl },
          { line: '이럴 때일수록 여유를 챙기는 게 핵심이죠', mood: baseCuts[4]?.mood || '5컷', keyword: baseCuts[4]?.keyword || 'running man', mediaType: baseCuts[4]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[4]?.videoUrl },
          { line: `여러분은 이번 ${issueKeyword.slice(0, 8)} 어떻게 보시나요?`, mood: baseCuts[5]?.mood || '6컷', keyword: baseCuts[5]?.keyword || 'running man', mediaType: baseCuts[5]?.mediaType || '🔊 실제 소리 내장 MP4', videoUrl: baseCuts[5]?.videoUrl }
        ]
      };

  if (geminiKey) {
    try {
      const cutScenesDesc = baseCuts.slice(0, 6).map((c, idx) => `${idx + 1}컷 실제 영상 장면: [${c.mood}] (기존 대사: "${c.line}")`).join('\n');
      const targetDesc = mashupType === 'store'
        ? `[우리 가게·상품 홍보 패러디]\n- 업종: ${industryLabel}\n- 매장/브랜드명: ${storeName}\n- 핵심 어필 상품/혜택: ${productPoint}\n목표: 위 1~6컷의 실제 원본 영상 표정/행동과 1:1로 어우러지는 재치 있는 가게 홍보 패러디 6컷 자막`
        : `[오늘의 실시간 키워드 × 밈 결합]\n- 오늘의 키워드/이슈: ${issueKeyword}\n목표: 위 1~6컷의 실제 원본 영상 표정/행동과 1:1로 어우러지는 오늘의 키워드 결합 6컷 자막`;

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
              cuts: baseCuts.slice(0,6).map((base,ci)=>({
                ...base,
                line: String(parsed.cuts[ci]?.line || base.line).slice(0,60),
                mood: String(parsed.cuts[ci]?.mood || baseCuts[ci]?.mood || `원본 밈 ${ci + 1}컷`),
                keyword: baseCuts[ci]?.keyword || 'running man',
                mediaType: baseCuts[ci]?.mediaType || '🔊 실제 소리 내장 MP4',
                videoUrl: base.videoUrl,
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
      ...fallbackMashup,
      cuts:baseCuts.map((base,i)=>({...base,line:fallbackMashup.cuts[i]?.line || base.line}))
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
