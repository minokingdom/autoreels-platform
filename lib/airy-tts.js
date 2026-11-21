'use strict';

const { CURATED_VOICE_IDS } = require('./fish-voices');
const { normalizeKoreanNumbers } = require('./korean-numbers');

const MODEL = 'airy-tts-v1';
const VOICES = [
  { id: 'a597bb7a98fc9ec1', title: 'Silvia' },
  { id: 'bdb7de5e2cdd3324', title: 'Rowan' },
  { id: 'ed722872eac4198e', title: 'Sori' }
];

function usesAiry(provider) {
  return provider !== 'fish' && process.env.TTS_PROVIDER === 'airy';
}

function listAiryVoices() {
  // 기존 프로젝트에 저장된 성우 선택을 같은 순번으로 복원합니다.
  return VOICES.map((voice, index) => ({ id: CURATED_VOICE_IDS[index], title: voice.title }));
}

class AiryError extends Error {
  constructor(code, status = 502) {
    super(code);
    this.status = status;
  }
}

async function synthesizeAiry(text, ref, tone, deadline) {
  const apiKey = String(process.env.AIRY_API_KEY || '').trim();
  if (!apiKey) throw new AiryError('airy_api_key_missing', 503);
  const voice = VOICES[CURATED_VOICE_IDS.indexOf(ref)] || VOICES[0];
  const payload = {
    model: MODEL,
    input: normalizeKoreanNumbers(text),
    language: 'ko',
    voice: voice.id,
    style: tone === 'plain' ? 'normal' : 'bright',
    response_format: 'mp3'
  };
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new AiryError('airy_timeout', 504);
  const response = await fetch('https://api.airy.so/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(Math.min(remaining, 12000))
  });
  if (response.status === 429) throw new AiryError('airy_rate_limited', 429);
  if (response.status === 402) throw new AiryError('airy_credit_exhausted', 503);
  if (!response.ok) throw new AiryError('airy_tts_failed');
  if (!(response.headers.get('content-type') || '').toLowerCase().startsWith('audio/')) {
    throw new AiryError('airy_invalid_audio');
  }
  const audio = Buffer.from(await response.arrayBuffer());
  if (!audio.length) throw new AiryError('airy_invalid_audio');
  return audio;
}

async function synthesizeAiryScript(lines, ref, tone) {
  const deadline = Date.now() + 35000;
  const clips = [];
  const cached = new Map();
  let base64Size = 0;
  // 계정 동시 요청 한도가 작으므로 한 대본의 컷은 순서대로 합성합니다.
  for (const line of lines) {
    if (!cached.has(line)) {
      const audio = await synthesizeAiry(line, ref, tone, deadline);
      cached.set(line, audio.toString('base64'));
    }
    const clip = cached.get(line);
    base64Size += clip.length;
    if (base64Size > 4000000) throw new AiryError('airy_script_too_large', 413);
    clips.push(clip);
  }
  return clips;
}

function sendAiryError(res, error) {
  res.setHeader('Cache-Control', 'no-store');
  if (error instanceof AiryError) return res.status(error.status).json({ ok: false, error: error.message });
  const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
  return res.status(timedOut ? 504 : 502).json({ ok: false, error: timedOut ? 'airy_timeout' : 'airy_tts_unreachable' });
}

module.exports = { MODEL, usesAiry, listAiryVoices, synthesizeAiry, synthesizeAiryScript, sendAiryError };
