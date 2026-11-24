// Captions commissioned for these exact source clips. Other clips are captioned from their footage.
const edited = new Map([
  ['ZUEKsf5fbtd5j5Eg7J', { title: '꽃다발 받을 때 상상한 내 모습', line: '우아하게 받으랬지. 누우랬냐.' }],
  ['wVdeizmpZ4MGCbYtEb', { title: '조별 과제에서 내가 한 일', line: '하이파이브는 다 내가 했다.' }]
]);
const cache = new Map();
const MAX_BYTES = 750_000;

async function readClip(clip) {
  const url = new URL(clip.url);
  if (url.protocol !== 'https:' || url.port || url.username || url.password ||
      !/^(?:media\d*\.tenor\.com|(?:[a-z0-9-]+\.)*giphy\.com)$/.test(url.hostname)) return null;
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(3500) });
  if (!response.ok || !response.body) return null;
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  return size ? Buffer.concat(chunks).toString('base64') : null;
}

function label(value, max) {
  const text = typeof value === 'string' ? value.trim() : '';
  return /[가-힣]/.test(text) && text.length <= max && !/[<>{}\n]|GIF|GIPHY|Tenor/i.test(text) ? text : '';
}

async function reactionCopy(clips) {
  const key = process.env.GEMINI_API_KEY;
  const missing = clips.filter(c => !edited.has(c.id) && !cache.has(c.id)).slice(0, 6);
  if (key && missing.length) {
    try {
      const parts = [];
      const footage = await Promise.allSettled(missing.map(readClip));
      for (const [i, file] of footage.entries()) {
        if (file.status !== 'fulfilled' || !file.value) continue;
        parts.push({text: '클립 번호 ' + i}, {inlineData: {mimeType: 'video/mp4', data: file.value}});
      }
      if (parts.length) {
        const model = (process.env.GEMINI_SCRIPT_MODEL || 'gemini-2.5-flash').split(',')[0].trim();
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
          method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':key}, signal:AbortSignal.timeout(9000),
          body:JSON.stringify({
            systemInstruction:{parts:[{text:'각 영상은 서로 독립적인 리액션 밈이다. 실제 동작을 보고 한국어 상황 제목(24자 이내)과 마지막 표정이나 행동에 맞물리는 일상적인 속마음 한 줄(20자 이내)을 쓴다. 제목과 대사는 다른 정보를 준다. 인물의 실제 발언이나 번역이라고 주장하지 않는다. 자극적인 홍보 문구, 행동을 그대로 해설하는 말, 감탄사만으로 끝나는 말을 피한다. 적합한 상황이 없으면 해당 번호를 생략한다. {"clips":[{"index":0,"title":"...","line":"..."}]} JSON만 반환한다.'}]},
            contents:[{parts}],generationConfig:{temperature:0.7,responseMimeType:'application/json'}
          })
        });
        if (response.ok) {
          const body = await response.json();
          const rows = JSON.parse(body.candidates?.[0]?.content?.parts?.[0]?.text || '{}').clips;
          for (const row of Array.isArray(rows) ? rows : []) {
            const i = row?.index;
            const title = label(row?.title, 32), line = label(row?.line, 32);
            if (!Number.isInteger(i) || !missing[i] || !footage[i].value || !title || !line || title === line) continue;
            if (cache.size >= 200) cache.delete(cache.keys().next().value);
            cache.set(missing[i].id, {title,line});
          }
        }
      }
    } catch { /* Keep the source editable when a visual caption is unavailable. */ }
  }
  return clips.map(clip => edited.get(clip.id) || cache.get(clip.id) || null);
}

module.exports = {reactionCopy};
