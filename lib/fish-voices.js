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
  { id: '7e81718fea7a4eacbd0ce650e457500f', title: '민수 · 따뜻한 내레이션' }
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
