/**
 * Fish Audio 한국어 보이스 목록 조회 (서버 전용 공용 모듈)
 * - GET https://api.fish.audio/model 로 한국어 보이스를 인기순으로 받아옵니다.
 * - 같은 서버 인스턴스 안에서는 10분간 결과를 재사용합니다.
 */

const FISH_MODEL_URL = 'https://api.fish.audio/model';
const CACHE_MS = 10 * 60 * 1000;
const VOICE_ID_PATTERN = /^[a-f0-9]{16,64}$/i;

// 서비스에서 쓰는 성우 (Fish Audio 보이스 모델 ID). 첫 번째가 기본 성우입니다.
const CURATED_VOICE_IDS = [
  '4e118bfbb83e401c84699c09b5f08257',
  '8cf5ee4cb0224c109852a206f185a05f',
  '9a50287ddd26414690b538539ad52d61'
  // 2026-11-14 제외: 8748b1f032e2418183a6ffb920724755 (同行激情带货, 중국어 쇼핑 라이브 목소리)
];

const PRO_FISH_VOICES = [
  { id: 'c3b8d25453d34dbab3b5e8b1b3e98d22', title: '혜수 · 밝고 또렷한 진행' },
  { id: '1faa840246094164bf4b0b0b94ae1675', title: '지훈 · 안정감 있는 안내' },
  { id: '117adf85c36c41a792662458db470777', title: '도현 · 다정한 설명' },
  { id: '96ed4e3f47334430b990df471d0a0268', title: '하윤 · 또렷한 상담' },
  { id: '14a76e187ac64a46b99f4f6b49f885b9', title: '서연 · 편안한 대화' },
  { id: '7e81718fea7a4eacbd0ce650e457500f', title: '민수 · 따뜻한 내레이션' },
  { id: '849c4e02d2f347bfafcbf355507f7808', title: '혜진 · 친근한 서울말' },
  { id: 'e2064c249afe4ac0abea622680a54073', title: '예린 · 편안한 일상' },
  { id: '2c0eeb4aaf4042d7a85843d1f6148c2c', title: '태오 · 친근한 대화' },
  { id: 'd02108f2e6124138b39004f3efce5e52', title: '서윤 · 자연스러운 대화' },
  { id: 'c57e2f9342954ccc9d676b25b676f92c', title: '준서 · 자연스러운 서울말' },
  { id: 'd7ec83d63be940f19abd933eb7b28816', title: '도윤 · 부담 없는 대화' },
  { id: '254244b09ba24af89b7e381c84a2506b', title: '민준 · 편안한 이야기' },
  { id: '3d31499f0e13438bbce8dcce7b7c4298', title: '유나 · 안정감 있는 안내' },
  { id: 'c09e0a67c0ec4e3f90d3a04a55bc0b46', title: '지우 · 일상적인 서울말' },
  { id: 'a450ded93e014e6aa0c4be3f2bb8594b', title: '재민 · 친근한 부산말' },
  { id: '909d2c17bfcd44d2803cf67fef9125b8', title: '미경 · 깊이 있는 스토리텔링' },
  { id: '69c83054095f4519b643d38b85446f27', title: '시우 · 편안한 서울말' },
  { id: 'f3b62ddeb0fb4cac8c796c97c064f7cf', title: '우진 · 자연스러운 일상' },
  { id: '8f3cc2e594cf4a96a5049cb538f1b6d6', title: '하은 · 친근한 일상' },
  { id: '82703151e4b043dbbd98f082d4841b71', title: '건우 · 또렷한 상담' },
  { id: '57f8381fb53c4bc68200d579c91c566b', title: '수아 · 편안한 대화' },
  // Fish Audio 라이선스 표시를 확인한 한국어 보이스입니다.
  { id: '1522b08ff8824100b4df795a4d149206', title: '스토리텔러 · 부드러운 남성' },
  { id: 'a1c0ed3c68454ad3a8a75a5364e6becf', title: '잔잔한 일상 · 따뜻한 여성' },
  { id: 'f195c5a1a07a47f990e6472f35e020b2', title: '보이스 내레이션 · 차분한 남성' },
  { id: '018197b06f034d37b4196dbc38253087', title: '편안한 일상 · 다정한 여성' }
];

async function fishProPreviewUrl(id) {
  if (!PRO_FISH_VOICES.some(voice => voice.id === id)) return null;
  const response = await fetch(FISH_MODEL_URL + '/' + id, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) return null;
  const model = await response.json();
  if (model.visibility !== 'public' || model.dmca_taken_down || !model.samples?.[0]?.audio) return null;
  const url = new URL(model.samples[0].audio);
  return url.protocol === 'https:' && /^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/.test(url.hostname) &&
    url.pathname.startsWith('/fish-platform-data/') ? url.href : null;
}

let cached = { at: 0, voices: [] };

function isValidVoiceId(id) {
  return typeof id === 'string' && VOICE_ID_PATTERN.test(id);
}

async function listKoreanVoices(apiKey) {
  if (cached.voices.length > 0 && Date.now() - cached.at < CACHE_MS) return cached.voices;

  const url = `${FISH_MODEL_URL}?page_size=20&page_number=1&language=ko&sort_by=task_count`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) {
    const err = new Error(`fish_model_list_${res.status}`);
    err.status = res.status;
    throw err;
  }
  const body = await res.json();
  const items = Array.isArray(body && body.items) ? body.items : [];
  const voices = items
    .filter((m) => m && isValidVoiceId(m._id))
    .filter((m) => !m.state || m.state === 'trained')
    .filter((m) => !m.type || m.type === 'tts')
    .map((m) => ({
      id: m._id,
      title: String(m.title || '이름 없는 보이스').slice(0, 40),
      description: String(m.description || '').slice(0, 80),
      tags: Array.isArray(m.tags) ? m.tags.slice(0, 4).map((t) => String(t).slice(0, 16)) : []
    }));

  if (voices.length > 0) cached = { at: Date.now(), voices };
  return voices;
}

module.exports = { listKoreanVoices, isValidVoiceId, CURATED_VOICE_IDS, PRO_FISH_VOICES, fishProPreviewUrl };
