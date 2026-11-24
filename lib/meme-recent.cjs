// 게시일이 확인된 원본만 보관한다. 수집일은 신선도 판단에 쓰지 않는다.
const DAY = 86400000;
const channels = [
  ['UChpjIaEgwtDZtmWEkzFulSA', 'KBS Drama', '드라마'],
  ['UC7lb15P-Hux7A5gBuhCxtuQ', 'MBCdrama', '드라마'],
  ['UCRV0Gb4i99Aj9UiqCE8xlvw', 'CJ ENM Movie', '영화']
];
function recent(date, days = 7) {
  const age = Date.now() - Date.parse(date);
  return age >= 0 && age <= days * DAY;
}
function plain(text) {
  return String(text || '').replace(/&quot;|&#39;|&amp;|&lt;|&gt;/g, v => ({'&quot;':'"', '&#39;':"'",'&amp;':'&','&lt;':'<','&gt;':'>'})[v])
    .replace(/[<>]/g, '').trim();
}
async function pageText(url) {
  const response = await fetch(url, {signal:AbortSignal.timeout(5500)});
  if (!response.ok) throw Error(String(response.status));
  return response.text();
}
async function channelQuotes([channel, publisher, genre]) {
  const xml = await pageText('https://www.youtube.com/feeds/videos.xml?channel_id=' + channel);
  const result = [];
  for (const entry of xml.match(/<entry>[\s\S]*?<\/entry>/g) || []) {
    const id = entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!id || !recent(publishedAt)) continue;
    const headline = plain(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]).normalize('NFKC');
    const match = headline.match(/["“]([^"”]{3,58})["”]/);
    const work = [...headline.matchAll(/[\[〈《]([^\]〉》]{2,32})[\]〉》]/g)].map(m=>m[1].replace(/\s*\d+\s*회.*$/,'').trim()).filter(v=>v && !/예고|하이라이트|선공개|^\d/.test(v)).pop();
    if (!match || !work || !/[가-힣]/.test(match[1])) continue;
    const quote = match[1].trim();
    const context = headline.replace(match[0],'').replace(/\[[^\]]+\]/g,'').split(/[,|]/)[0].trim();
    result.push({id, work, quote, genre, publisher, publishedAt, context});
  }
  return result;
}
async function recentClips(query) {
  const html = await pageText(query === 'trending' ? 'https://giphy.com/trending-gifs' : 'https://giphy.com/search/' + query + '-clips');
  const found = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.import_datetime && node.id && /^[a-zA-Z0-9]+$/.test(node.id)) {
      const publishedAt = String(node.import_datetime).replace(' ','T') + 'Z';
      const hasOriginalAudio = node.type === 'video';
      const asset = hasOriginalAudio ? node.video?.assets?.['360p'] : node.images?.original?.mp4;
      const url = typeof asset === 'string' ? asset : asset?.url;
      if (['gif','video'].includes(node.type) && ['g','pg','pg-13'].includes(node.rating) && recent(publishedAt) &&
          /^https:\/\/(?:[a-z0-9-]+\.)*giphy\.com\//i.test(url || '') && !node.is_sticker && !node.is_removed) {
        found.push({id:node.id, title:plain(node.title || '리액션').slice(0,72), publisher:plain(node.user?.display_name || node.username || 'GIPHY'),publishedAt,url:hasOriginalAudio ? url : "https://media.giphy.com/media/"+node.id+"/giphy.mp4",hasOriginalAudio});
      }
      return;
    }
    for (const value of Object.values(node)) visit(value);
  }
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)) {
    for (const line of JSON.parse(m[1]).split('\n')) {
      if (!line.includes('"import_datetime"')) continue;
      try { visit(JSON.parse(line.slice(line.indexOf(':')+1))); } catch {}
    }
  }
  return found;
}
function mergeRecent(lists) {
  return Array.from(new Map(lists.flat().filter(x=>recent(x.publishedAt)).map(x=>[x.id,x])).values())
    .sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,50);
}
async function collect(kind, prior=[]) {
  const jobs = kind === 'quotes' ? channels.map(channelQuotes) : ['trending','reaction','korean'].map(recentClips);
  const results = await Promise.allSettled(jobs);
  return mergeRecent([prior,...results.filter(x=>x.status==='fulfilled').map(x=>x.value)]);
}
const cache = new Map();
async function loadRecent(kind, refresh) {
  const cached = cache.get(kind);
  if (cached && (!refresh || Date.now()-cached.at<60000) && Date.now()-cached.at<900000) return (await cached.items).filter(x=>recent(x.publishedAt));
  const snapshot = require('../public/meme-recent.json');
  const items = collect(kind, [...(snapshot[kind] || []), ...(cached ? await cached.items : [])]);
  cache.set(kind,{at:Date.now(),items});
  return items;
}
module.exports = {collect,loadRecent,recent};
