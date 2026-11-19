const dbRemix = require('./private-remix');

// 플랫폼의 공개 주소와 제목만 확인합니다. 영상 바이트는 휴대폰이 원본 CDN에서 받습니다.
async function sourceLink(value) {
  const canonical = dbRemix.videoURL(value);
  const original = new URL(canonical);
  if (original.hostname !== 'www.capcut.com') {
    return {url:canonical};
  }
  const signal = AbortSignal.timeout(12000);
  let current = original;
  for (let i=0;i<5;i++) {
    const response = await fetch(current, {redirect:'manual',signal,headers:{'User-Agent':'Mozilla/5.0'}});
    if ([301,302,303,307,308].includes(response.status)) {
      await response.body?.cancel();
      current = new URL(response.headers.get('location'),current);
      if (!['www.capcut.com','capcut.com'].includes(current.hostname) || current.protocol!=='https:' || current.port || current.username || current.password) break;
      continue;
    }
    if (!response.ok) {await response.body?.cancel();break;}
    const reader = response.body.getReader(), decoder=new TextDecoder();
    let head='',length=0;
    try {
      while (length < 512000 && !head.includes('</head>')) {
        const part=await reader.read();if(part.done) break;
        head+=decoder.decode(part.value,{stream:true});length+=part.value.length;
      }
    } finally {await reader.cancel();}
    const props={};
    for (const tag of head.match(/<meta\b[^>]*>/gi)||[]) {
      const attrs=Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(m=>[m[1].toLowerCase(),m[3]]));
      if(attrs.property && attrs.content) props[attrs.property]=attrs.content.replaceAll('&amp;','&').replaceAll('&quot;','"');
    }
    const raw = props['og:video:secure_url'] || props['og:video:url'];
    if(raw) {
      const media=new URL(raw);
      if(media.protocol==='https:' && media.hostname.endsWith('.capcutvod.com') && !media.username && !media.password && !media.port)
        return {url:canonical,media:media.href,title:(props['og:title']||'').slice(0,160)};
    }
    break;
  }
  return {url:canonical};
}
module.exports={sourceLink};
