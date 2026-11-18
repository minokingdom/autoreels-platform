/**
 * Vercel Serverless Function: GET /api/tts-voices
 *  - 기본 GET: 성우 목록 (id, 이름)
 *  - GET  ?action=bgm-list: 구글 Lyria AI BGM 팩 목록 + Vercel Blob 캐시 URL
 *  - POST ?action=generate-bgm: 구글 Lyria(lyria-3-clip-preview)로 30초 BGM 생성 후 Blob 캐시
 */
const { listCuratedVoices } = require('../lib/fish-voices');
const { isSameSiteRequest, consume, refundUsage } = require('../lib/server/usage');

const LYRIA_BGM_PACK = [
  { id: 'lyria_showroom', label: '쇼룸 일렉트로닉 하우스', prompt: 'Instrumental only, no vocals. Sleek modern luxury car showroom chill house beat, 118 BPM, warm analog bass, crisp hi-hats, clean commercial background music.' },
  { id: 'lyria_cafe', label: '감성 카페 보사노바·재즈', prompt: 'Instrumental only, no vocals. Cozy Korean aesthetic cafe acoustic jazz and light bossa nova, warm Rhodes electric piano, soft brushed drums, 102 BPM.' },
  { id: 'lyria_restaurant', label: '맛집 어쿠스틱 그루브', prompt: 'Instrumental only, no vocals. Upbeat appetizing food vlog indie pop groove, acoustic guitar, claps, bright marimba, 114 BPM, friendly commercial feel.' },
  { id: 'lyria_beauty', label: '뷰티·헤어 트렌디 R&B', prompt: 'Instrumental only, no vocals. Stylish modern beauty salon R&B chill groove, glassy synth pads, smooth sub bass, snappy rimshot, 105 BPM.' },
  { id: 'lyria_fitness', label: '피트니스 파워 트랩', prompt: 'Instrumental only, no vocals. High energy workout fitness reels phonk trap beat, punchy 808 bass, crisp snare, motivational synth lead, 134 BPM.' },
  { id: 'lyria_realestate', label: '프리미엄 하우스 라운지', prompt: 'Instrumental only, no vocals. Luxury real estate home tour ambient lounge, clean piano chords, subtle deep house pulse, airy pads, 110 BPM.' },
  { id: 'lyria_academy', label: '학원·교육 로파이 비트', prompt: 'Instrumental only, no vocals. Clean inspiring study lo-fi hip hop beat, soft piano melody, warm vinyl texture, crisp boom-bap drums, 92 BPM.' },
  { id: 'lyria_clinic', label: '클리닉 신뢰감 앰비언트', prompt: 'Instrumental only, no vocals. Trustworthy clean medical clinic background music, gentle marimba, warm strings, minimal soft percussion, 100 BPM.' },
  { id: 'lyria_shop', label: '패션·쇼핑몰 시티팝', prompt: 'Instrumental only, no vocals. Trendy Seoul fashion lookbook city pop synth funk, funky slap bass, retro brass synth, bright 120 BPM groove.' },
  { id: 'lyria_interior', label: '인테리어 북유럽 미니멀', prompt: 'Instrumental only, no vocals. Minimalist Scandinavian interior design vlog music, plucked acoustic guitar, warm cello pad, gentle shaker, 104 BPM.' }
];

function getBlobHelpers() {
  const token = String(process.env.BLOB_READ_WRITE_TOKEN || '').trim();
  if (!token) return null;
  try {
    const { list, put } = require('@vercel/blob');
    return { list, put, token };
  } catch (e) {
    return null;
  }
}

async function listCachedBgmUrls() {
  const blob = getBlobHelpers();
  if (!blob) return {};
  try {
    const res = await blob.list({ prefix: 'bgm-pack/', token: blob.token });
    const map = {};
    (res && Array.isArray(res.blobs) ? res.blobs : []).forEach((b) => {
      const m = String(b.pathname || '').match(/^bgm-pack\/([^.]+)\./);
      if (m && b.url) map[m[1]] = b.url;
    });
    return map;
  } catch (e) {
    return {};
  }
}

function extractAudioFromInteraction(data) {
  const candidates = [];
  const pushList = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (!item) continue;
      candidates.push(item);
      if (Array.isArray(item.parts)) candidates.push(...item.parts);
      if (Array.isArray(item.content)) candidates.push(...item.content);
    }
  };
  pushList(data && data.outputs);
  pushList(data && data.response && data.response.outputs);
  pushList(data && data.steps);
  for (const out of candidates) {
    if (!out) continue;
    const mime = out.mime_type || out.mimeType || (out.inlineData && out.inlineData.mimeType) || '';
    const b64 = out.data || (out.inlineData && out.inlineData.data) || '';
    if (b64 && String(mime).startsWith('audio/')) {
      return { mimeType: mime, base64: b64 };
    }
  }
  return null;
}

async function callGeminiLyria(prompt, apiKey) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ model: 'lyria-3-clip-preview', input: prompt, store: false })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (data && data.error && data.error.message) || `lyria_http_${r.status}`;
    if (r.status === 429 || /free tier|rate limit/i.test(msg)) {
      throw new Error('구글 AI Studio 무료 등급에서는 Lyria 음악 생성이 제한(한도 0)되어 있습니다. AI Studio에서 유료 결제(Pay-as-you-go)를 연결하면 바로 생성됩니다.');
    }
    throw new Error(msg);
  }
  let audio = extractAudioFromInteraction(data);
  if (!audio && data.id && data.status === 'in_progress') {
    for (let i = 0; i < 12; i++) {
      await new Promise((ok) => setTimeout(ok, 2000));
      const pr = await fetch(`${url}/${encodeURIComponent(data.id)}`, {
        headers: { 'x-goog-api-key': apiKey }
      });
      const pd = await pr.json().catch(() => ({}));
      audio = extractAudioFromInteraction(pd);
      if (audio || (pd.status && pd.status !== 'in_progress')) break;
    }
  }
  if (!audio) throw new Error('lyria_empty_audio');
  return audio;
}

// 주의: Fish Audio 한국어 "인기순" 목록을 그대로 붙이지 말 것.
// 2026-11-14 확인 결과 연예인 목소리 복제본(아이돌·배우)과 다른 언어 목소리가 섞여 있어
// 광고에 쓰면 퍼블리시티권 문제가 생길 수 있음. 성우는 직접 들어 보고 CURATED_VOICE_IDS 에만 추가.

module.exports = async function handler(req, res) {
  const action = String((req.query && req.query.action) || '').trim();

  if (action === 'bgm-list') {
    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    const cachedMap = await listCachedBgmUrls();
    const tracks = LYRIA_BGM_PACK.map((t) => ({
      id: t.id,
      label: t.label,
      url: cachedMap[t.id] || `/assets/bgm/pack/${t.id.replace(/^lyria_/, '')}.mp3`
    }));
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300');
    return res.status(200).json({ ok: true, geminiReady: Boolean((process.env.GEMINI_API_KEY || '').trim()), tracks });
  }

  if (action === 'generate-bgm') {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    if (!isSameSiteRequest(req)) return res.status(403).json({ ok: false, error: 'forbidden_origin' });
    res.setHeader('Cache-Control', 'no-store');
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const presetId = String(body.presetId || '').trim();
    const preset = LYRIA_BGM_PACK.find((t) => t.id === presetId);
    const customPrompt = String(body.prompt || '').trim();
    const kwHash = (!preset && customPrompt)
      ? 'kw_' + require('crypto').createHash('sha1').update(customPrompt.toLowerCase().replace(/\s+/g, ' ')).digest('hex').slice(0, 12)
      : '';

    const cacheId = preset ? preset.id : kwHash;

    const prompt = preset
      ? preset.prompt
      : (customPrompt ? `Instrumental background music for short-form reels video, no vocals unless requested: ${customPrompt}` : '');
    if (!prompt) return res.status(400).json({ ok: false, error: 'missing_prompt', message: '음악 분위기나 프롬프트를 입력해 주세요.' });

    let gate;
    try {
      gate = await consume(req, 'ai', 2);
    } catch (_) {
      return res.status(503).json({ ok: false, error: 'usage_unavailable', message: '사용량을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
    }
    if (!gate.ok) return res.status(gate.status).json(gate.body);

    try {
      const cachedMap = cacheId ? await listCachedBgmUrls() : {};
      if (cachedMap[cacheId]) {
        await refundUsage(req, 'ai', 2, gate);
        return res.status(200).json({
          ok: true,
          id: cacheId,
          label: preset ? preset.label : `✨ ${customPrompt.slice(0, 20)}`,
          url: cachedMap[cacheId],
          cached: true
        });
      }
      const geminiKey = String(process.env.GEMINI_API_KEY || '').trim();
      if (!geminiKey) {
        await refundUsage(req, 'ai', 2, gate);
        return res.status(503).json({ ok: false, error: 'gemini_api_key_missing', message: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
      }
      const audio = await callGeminiLyria(prompt, geminiKey);
      const buf = Buffer.from(audio.base64, 'base64');
      const ext = audio.mimeType.includes('wav') ? 'wav' : audio.mimeType.includes('ogg') ? 'ogg' : 'mp3';
      const blob = getBlobHelpers();
      let url = '';
      if (blob) {
        const key = preset ? preset.id : (kwHash || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
        const putRes = await blob.put(`bgm-pack/${key}.${ext}`, buf, {
          access: 'public',
          contentType: audio.mimeType,
          addRandomSuffix: false,
          token: blob.token
        });
        url = putRes && putRes.url ? putRes.url : '';
      }
      if (!url) url = `data:${audio.mimeType};base64,${audio.base64}`;
      return res.status(200).json({
        ok: true,
        id: preset ? preset.id : 'custom_lyria',
        label: preset ? preset.label : `✨ ${customPrompt.slice(0, 20)}`,
        url,
        mimeType: audio.mimeType,
        cached: false
      });
    } catch (err) {
      await refundUsage(req, 'ai', 2, gate);
      return res.status(502).json({ ok: false, error: 'lyria_failed', message: String(err && err.message || 'Lyria 생성 실패') });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  const apiKey = (process.env.FISH_API_KEY || '').trim();
  if (!apiKey) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ ok: false, error: 'fish_api_key_missing' });
  }
  try {
    const voices = await listCuratedVoices(apiKey);
    const allNamed = voices.every((v) => v.named);
    res.setHeader('Cache-Control', allNamed ? 'public, max-age=600, s-maxage=3600' : 'no-store');
    return res.status(200).json({ ok: true, voices });
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ ok: false, error: 'fish_voice_list_failed', detail: String(err && err.message) });
  }
};
