'use strict';

const { normalizeKoreanNumbers } = require('./korean-numbers');

const WAVENET_MODEL = 'google-wavenet';
const CHIRP_MODEL = 'google-chirp3-hd';
const BASE_URL = 'https://texttospeech.googleapis.com';
const MAX_SSML_BYTES = 5000;
const WAVENET_VOICES = [
  { id: 'ko-KR-Wavenet-A', title: '맑은 상품 소개 · 여성' },
  { id: 'ko-KR-Wavenet-B', title: '부드러운 혜택 안내 · 여성' },
  { id: 'ko-KR-Wavenet-C', title: '또렷한 정보 전달 · 남성' },
  { id: 'ko-KR-Wavenet-D', title: '차분한 상담 안내 · 남성' }
];

const CHIRP_VOICES = [
  ['경쾌한 릴스', [
    ['Puck', '경쾌한 오프닝', '남성'],
    ['Leda', '발랄한 상품 소개', '여성'],
    ['Laomedeia', '활기찬 소식', '여성'],
    ['Autonoe', '맑은 첫인상', '여성'],
    ['Fenrir', '힘 있는 혜택 소개', '남성'],
    ['Sadachbia', '생동감 있는 진행', '남성'],
    ['Zephyr', '밝은 한 줄 소개', '여성'],
    ['Pulcherrima', '자신감 있는 추천', '여성']
  ]],
  ['친근한 소개', [
    ['Aoede', '산뜻한 일상 소개', '여성'],
    ['Achird', '친근한 상담', '남성'],
    ['Sulafat', '따뜻한 추천', '여성'],
    ['Callirrhoe', '편안한 대화', '여성'],
    ['Umbriel', '여유로운 소개', '남성'],
    ['Zubenelgenubi', '가벼운 수다', '남성'],
    ['Algieba', '부드러운 진행', '남성'],
    ['Despina', '매끄러운 설명', '여성'],
    ['Vindemiatrix', '다정한 인사', '여성'],
    ['Achernar', '은은한 이야기', '여성']
  ]],
  ['또렷한 안내', [
    ['Charon', '알기 쉬운 정보', '남성'],
    ['Kore', '단정한 안내', '여성'],
    ['Orus', '단호한 핵심 정리', '남성'],
    ['Iapetus', '선명한 해설', '남성'],
    ['Erinome', '깔끔한 조건 설명', '여성'],
    ['Rasalgethi', '차분한 비교', '남성'],
    ['Alnilam', '무게감 있는 전달', '남성'],
    ['Gacrux', '성숙한 내레이션', '여성'],
    ['Algenib', '거친 중저음', '남성'],
    ['Schedar', '고른 리듬의 안내', '남성'],
    ['Sadaltager', '전문적인 설명', '남성'],
    ['Enceladus', '숨결이 섞인 독백', '남성']
  ]]
].flatMap(([group, voices]) => voices.map(([name, title, gender]) => ({
  id: 'ko-KR-Chirp3-HD-' + name,
  title: title + ' · ' + gender,
  group: 'Chirp 3 HD · ' + group,
  preferred: name === 'Puck'
})));

function googleVoiceModel(voice) {
  if (CHIRP_VOICES.some(({ id }) => id === voice)) return CHIRP_MODEL;
  return WAVENET_VOICES.some(({ id }) => id === voice) ? WAVENET_MODEL : '';
}

function isGoogleVoice(voice) {
  return Boolean(googleVoiceModel(voice));
}

function listGoogleVoices(version) {
  if (!googleApiKey() || !(version >= 2)) return [];
  if (version < 3) {
    return WAVENET_VOICES.map(({ id, title }) => ({
      id, title: 'Google WaveNet ' + id.slice(-1) + title.slice(title.lastIndexOf(' · '))
    }));
  }
  return [...CHIRP_VOICES, ...WAVENET_VOICES.map((voice) => ({ ...voice, group: 'Google WaveNet' }))];
}

function googleApiKey() {
  return (process.env.GOOGLE_TTS_API_KEY || '').trim();
}

function escapeSsml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function googleScriptSections(lines) {
  const sections = [];
  let sentences = [];
  const wrap = (parts) => '<speak>' + parts.join('') + '</speak>';
  const finish = () => {
    sections.push({
      ssml: wrap(sentences),
      count: sentences.length,
      units: wrap(sentences).replace(/<mark[^>]+\/>/g, '').length
    });
  };
  for (const line of lines) {
    const text = escapeSsml(normalizeKoreanNumbers(line));
    const sentence = '<s>' + text + '</s>';
    // 요청당 바이트 제한을 넘는 대본만 문장 경계에서 나눕니다.
    const mark = sentences.length ? '<mark name="cut_' + sentences.length + '"/>' : '';
    const marked = '<s>' + mark + text + '</s>';
    if (sentences.length && Buffer.byteLength(wrap([...sentences, marked])) > MAX_SSML_BYTES) {
      finish();
      sentences = [sentence];
    } else sentences.push(marked);
  }
  if (sentences.length) finish();
  return sections;
}

class GoogleTtsError extends Error {
  constructor(code, status = 502) {
    super(code);
    this.status = status;
  }
}

async function googleSynthesize(input, voice, speed, timed, deadline) {
  const key = googleApiKey();
  if (!key) throw new GoogleTtsError('google_api_key_missing', 503);
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new GoogleTtsError('google_tts_timeout', 504);
  const payload = {
    input,
    voice: { languageCode: 'ko-KR', name: voice },
    audioConfig: { audioEncoding: 'MP3', speakingRate: speed }
  };
  if (timed) payload.enableTimePointing = ['SSML_MARK'];
  const version = timed ? 'v1beta1' : 'v1';
  const response = await fetch(BASE_URL + '/' + version + '/text:synthesize', {
    method: 'POST',
    headers: { 'X-Goog-Api-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(Math.min(remaining, 15000))
  });
  if (response.status === 429) throw new GoogleTtsError('google_tts_rate_limited', 429);
  if ([401, 403].includes(response.status)) throw new GoogleTtsError('google_tts_access_denied', 503);
  if (!response.ok) throw new GoogleTtsError('google_tts_failed');
  const data = await response.json();
  if (typeof data.audioContent !== 'string' || !data.audioContent) throw new GoogleTtsError('google_tts_invalid_audio');
  return data;
}

async function synthesizeGoogleLine(text, voice, speed) {
  const data = await googleSynthesize({ text: normalizeKoreanNumbers(text) }, voice, speed, false, Date.now() + 15000);
  return Buffer.from(data.audioContent, 'base64');
}

async function synthesizeGoogleScript(lines, voice, speed) {
  const deadline = Date.now() + 35000;
  const parts = [];
  let encodedSize = 0;
  for (const { ssml, count } of googleScriptSections(lines)) {
    const data = await googleSynthesize({ ssml }, voice, speed, true, deadline);
    const marks = new Map((data.timepoints || []).map((point) => [point.markName, point.timeSeconds]));
    const starts = [0];
    for (let i = 1; i < count; i++) {
      const value = marks.get('cut_' + i);
      if (!Number.isFinite(value) || value <= starts[i - 1]) throw new GoogleTtsError('google_tts_invalid_timing');
      starts.push(value);
    }
    encodedSize += data.audioContent.length;
    if (encodedSize > 4000000) throw new GoogleTtsError('google_tts_script_too_large', 413);
    parts.push({ audio_base64: data.audioContent, starts });
  }
  return parts;
}

async function synthesizeChirpScript(lines, voice, speed) {
  const deadline = Date.now() + 35000;
  const clips = [];
  const cached = new Map();
  let encodedSize = 0;
  // Chirp는 컷 시각을 돌려주지 않으므로 컷 단위 음성을 만들어 브라우저가 이어 붙입니다.
  for (const line of lines) {
    const text = normalizeKoreanNumbers(line);
    if (!cached.has(text)) {
      const data = await googleSynthesize({ text }, voice, speed, false, deadline);
      cached.set(text, data.audioContent);
    }
    const clip = cached.get(text);
    encodedSize += clip.length;
    if (encodedSize > 4000000) throw new GoogleTtsError('google_tts_script_too_large', 413);
    clips.push(clip);
  }
  return clips;
}

function sendGoogleTtsError(res, error) {
  res.setHeader('Cache-Control', 'no-store');
  if (error instanceof GoogleTtsError) return res.status(error.status).json({ ok: false, error: error.message });
  const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
  return res.status(timedOut ? 504 : 502).json({ ok: false, error: timedOut ? 'google_tts_timeout' : 'google_tts_unreachable' });
}

module.exports = {
  CHIRP_MODEL, googleVoiceModel, isGoogleVoice, listGoogleVoices, googleScriptSections,
  synthesizeGoogleLine, synthesizeGoogleScript, synthesizeChirpScript, sendGoogleTtsError
};
