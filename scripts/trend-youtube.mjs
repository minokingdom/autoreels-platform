export function extractVideosFromYtHtml(html) {
  const marker = 'var ytInitialData = ';
  const idx = html.indexOf(marker);
  if (idx < 0) return [];
  const sub = html.slice(idx + marker.length);
  const end = sub.indexOf(';</script>');
  if (end < 0) return [];
  try {
    const data = JSON.parse(sub.slice(0, end));
    const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const results = [];
    const seen = new Set();
    // 2026년 이후 YouTube 쇼츠 검색 결과 형식: gridShelfViewModel > shortsLockupViewModel
    const pushShort = (sl) => {
      const videoId = sl?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId
        || String(sl?.entityId || '').replace(/^shorts-shelf-item-/, '');
      const title = sl?.overlayMetadata?.primaryText?.content || '';
      if (!videoId || !title || seen.has(videoId)) return;
      seen.add(videoId);
      results.push({
        videoId,
        url: `https://www.youtube.com/shorts/${videoId}`,
        title,
        views: sl?.overlayMetadata?.secondaryText?.content || '',
        author: '',
        platform: 'youtube'
      });
    };
    for (const sec of sections) {
      const items = sec?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const shelf = item.gridShelfViewModel?.contents || item.reelShelfRenderer?.items || [];
        for (const s of shelf) {
          if (s?.shortsLockupViewModel) pushShort(s.shortsLockupViewModel);
          if (results.length >= 6) return results;
        }
        const vr = item.videoRenderer;
        if (!vr || !vr.videoId || seen.has(vr.videoId)) continue;
        const title = vr.title?.runs?.map((r) => r.text).join('') || '';
        if (!title) continue;
        seen.add(vr.videoId);
        results.push({
          videoId: vr.videoId,
          url: `https://www.youtube.com/watch?v=${vr.videoId}`,
          title,
          views: vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || '',
          author: vr.ownerText?.runs?.[0]?.text || '',
          platform: 'youtube'
        });
        if (results.length >= 6) return results;
      }
    }
    return results;
  } catch (e) {
    return [];
  }
}

export async function fetchPublicYoutube(query, fetcher = fetch) {
  const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query) + '&sp=EgIYAQ%3D%3D';
  const res = await fetcher(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error('youtube_http_' + res.status);
  return extractVideosFromYtHtml(await res.text());
}
