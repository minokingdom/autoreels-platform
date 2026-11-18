'use strict';

const { normalizeKoreanNumbers } = require('./korean-numbers');

const MODEL = 'google-wavenet';
const BASE_URL = 'https://texttospeech.googleapis.com';
const MAX_SSML_BYTES = 5000;
const VOICES = [
  { id: 'ko-KR-Wavenet-A', title: 'Google WaveNet A · 여성' },
  { id: 'ko-KR-Wavenet-B', title: 'Google WaveNet B · 여성' },
  { id: 'ko-KR-Wavenet-C', title: 'Google WaveNet C · 남성' },
  { id: 'ko-KR-Wavenet-D', title: 'Google WaveNet D · 남성' }
];

function isGoogleVoice(voice) {
  return VOICES.some(({ id }) => id === voice);
}

function listGoogleVoices() {
  return googleApiKey() ? VOICES : [];
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

function sendGoogleTtsError(res, error) {
  res.setHeader('Cache-Control', 'no-store');
  if (error instanceof GoogleTtsError) return res.status(error.status).json({ ok: false, error: error.message });
  const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
  return res.status(timedOut ? 504 : 502).json({ ok: false, error: timedOut ? 'google_tts_timeout' : 'google_tts_unreachable' });
}

module.exports = {
  MODEL, isGoogleVoice, listGoogleVoices, googleScriptSections, synthesizeGoogleLine, synthesizeGoogleScript, sendGoogleTtsError
};
