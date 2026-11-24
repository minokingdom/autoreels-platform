const aliases = {
  '무한도전':['infinite challenge','infinity challenge'], '런닝맨':['running man'], '이광수':['lee kwang soo','kwangsoo'],
  '신서유기':['new journey to the west','njttw'], '강호동':['kang ho dong'], '박명수':['park myung soo','park myeong su'],
  '유재석':['yoo jae suk','yoo jae seok'], '도깨비':['goblin','guardian the lonely and great god'], '공유':['gong yoo'],
  '더글로리':['the glory'], '선재업고튀어':['lovely runner'], '선업튀':['lovely runner'], '범죄도시':['the outlaws','the roundup'],
  '마동석':['ma dong seok','don lee'], '기생충':['parasite'], '오징어게임':['squid game'],
  '백종원':['paik jong won','baek jong won'], '아이유':['iu','lee ji eun'], '세븐틴':['seventeen','svt'],
  '뉴진스':['newjeans','new jeans'], '콘서트':['concert','on stage','live performance'], '고양이':['cat','cats','kitten'],
  '강아지':['dog','dogs','puppy'], '리트리버':['retriever'], '칠가이':['chill guy']
};
function words(text) {
  return String(text || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
function contains(tags,text) {
  const phrase=words(text);
  return phrase && (' '+tags+' ').includes(' '+phrase+' ');
}
async function queryTerms(query,key,model) {
  const tokens=words(query).split(' ').filter(Boolean);
  let terms=tokens.map(t=>[t,...(aliases[t] || [])]);
  // Translate free-form Korean too. Keep every subject and modifier in the search.
  if (key && tokens.some(t=>/[가-힣]/.test(t) && !aliases[t])) {
    try {
      const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(key),{
        method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(3500),
        body:JSON.stringify({systemInstruction:{parts:[{text:'Translate the search phrase into a concise English media search query. Preserve every name, subject, action and modifier. Use the official English title for named works. Do not broaden, suggest related items or invent details. Return JSON {"translation":"..."}.'}]},
          contents:[{parts:[{text:query}]}],generationConfig:{temperature:0,responseMimeType:'application/json'}})
      });
      if (response.ok) {
        const data=await response.json();
        const translation=words(JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}').translation);
        if (translation && translation.length<160) return {terms,translation};
      }
    } catch (_) {}
  }
  return {terms,translation:''};
}
function fromGiphy(html) {
  const clips=[];
  function visit(node) {
    if (!node || typeof node!=='object') return;
    if (Array.isArray(node.initialGifs)) {
      for (const gif of node.initialGifs) {
        if (!/^[a-zA-Z0-9]+$/.test(gif.id) || !['video','gif'].includes(gif.type) || gif.is_removed || gif.is_sticker || !['g','pg','pg-13'].includes(gif.rating)) continue;
        const sound=gif.type==='video';
        if (sound ? !gif.video?.assets?.['360p'] : !gif.images?.original?.mp4) continue;
        clips.push({id:gif.id,title:String(gif.title || gif.slug || 'GIPHY').replace(/[<>]/g,'').slice(0,110),
          tags:(Array.isArray(gif.tags)?gif.tags:[]).map(words),
          url:'https://media.giphy.com/media/'+gif.id+'/'+(sound?'giphy360p.mp4':'giphy.mp4'),
          isVideo:true,hasAudio:sound,source:sound?'GIPHY 원본 클립':'GIPHY 무음 클립'});
      }
      return;
    }
    Object.values(node).forEach(visit);
  }
  for (const match of html.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)) {
    for (const line of JSON.parse(match[1]).split('\n')) {
      if (!line.includes('"initialGifs"')) continue;
      try {visit(JSON.parse(line.slice(line.indexOf(':')+1)));} catch (_) {}
    }
  }
  return clips;
}
async function page(query,clips) {
  const slug=encodeURIComponent(query.replace(/\s+/g,'-'));
  const response=await fetch('https://giphy.com/search/'+slug+(clips?'-clips':''),{signal:AbortSignal.timeout(4200)});
  return response.ok ? fromGiphy(await response.text()) : [];
}
async function tenor(query) {
  const response=await fetch('https://tenor.com/ko/search/'+encodeURIComponent(query.replace(/\s+/g,'-'))+'-gifs',{signal:AbortSignal.timeout(4200)});
  if (!response.ok) return [];
  const match=(await response.text()).match(/<script id="store-cache"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];
  const rows=Object.values(JSON.parse(match[1]).universal?.search || {}).flatMap(group=>group.results || []);
  return rows.flatMap(row=>{
    const url=row.media_formats?.mp4?.url;
    if (!/^https:\/\/media\d*\.tenor\.com\/[^"<> ]+\.mp4$/.test(url || '') || !/^\d+$/.test(row.id)) return [];
    const title=String(row.title || row.h1_title || row.tags?.join(' · ') || row.content_description || 'Tenor').replace(/[<>]/g,'').slice(0,110);
    return [{id:'tenor_'+row.id,url,title,isVideo:true,hasAudio:row.hasaudio===true,source:row.hasaudio?'Tenor 원본 클립':'Tenor 무음 클립',
      tags:(row.tags || []).map(words)}];
  });
}
async function searchMedia(query,limit=6) {
  query=String(query || '').trim().slice(0,140);
  if (!words(query)) return [];
  const key=process.env.GEMINI_API_KEY;
  const {terms,translation}=await queryTerms(query,key,(process.env.GEMINI_SCRIPT_MODEL || 'gemini-2.5-flash').split(',')[0]);
  const canonical=terms.map(group=>group[1] || group[0]).join(' ');
  const variants=[...new Set([translation || canonical,words(query)])];
  const batches=await Promise.allSettled([...variants.flatMap(q=>[page(q,true),page(q,false)]),tenor(query)]);
  const results=new Map();
  const translatedWords=words(translation).split(' ').filter(t=>t && !['the','a','of','to','in','and','on','with'].includes(t));
  for (const batch of batches) for (const clip of batch.value || []) {
    const title=words(clip.title);
    function relevance(group) {
      let score=0;
      for (const alias of group) {
        const term=words(alias);
        if (contains(title,term)) score=Math.max(score,5);
        if (clip.tags.includes(term)) score=Math.max(score,3);
        if (clip.tags.some(tag=>contains(tag,term))) score=Math.max(score,1);
      }
      return score;
    }
    const direct=terms.map(relevance);
    const translated=translatedWords.map(term=>relevance([term]));
    let scores=direct;
    if (!direct.every(Boolean) && translated.length && translated.every(Boolean) && terms.filter(group=>group.length>1).every(relevance)) scores=translated;
    if (!scores.every(Boolean) || results.has(clip.id)) continue;
    const {tags,...source}=clip;
    const score=scores.reduce((sum,value)=>sum+value,0)/scores.length;
    results.set(clip.id,{source,score});
  }
  const ranked=[...results.values()].sort((a,b)=>b.score-a.score || Number(b.source.hasAudio)-Number(a.source.hasAudio));
  return ranked.filter(row=>row.score>=Math.max(2,ranked[0].score-2)).slice(0,limit).map(row=>row.source);
}
module.exports={searchMedia};
