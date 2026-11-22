// '내 영상으로 쇼츠 만들기' → 여섯 트랙 편집기 연결 (2026-11-22)
// 쇼츠 화면에서 추천 구간을 고르면 같은 편집기(?mode=edit)를 창으로 띄우고,
// 그 구간과 받아쓴 대사 자막을 그대로 넘겨 편집을 이어 간다.
// 쇼츠 화면 → 제작 화면: 다듬은 영상을 같은 사이트 브라우저 저장소(IndexedDB)에 잠깐 맡긴다.
function arStashThemeVideo(blob) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('ar-handoff', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('files');
    open.onerror = () => reject(Error('영상을 제작 화면으로 넘기지 못했어요.'));
    open.onsuccess = () => {
      const tx = open.result.transaction('files', 'readwrite');
      tx.objectStore('files').put({ blob, at: Date.now() }, 'themeVideo');
      tx.oncomplete = () => { open.result.close(); resolve(); };
      tx.onerror = () => { open.result.close(); reject(Error('영상이 너무 커서 넘기지 못했어요.')); };
    };
  });
}
(function () {
  if (quickEdit) {
    // 편집기 쪽: 쇼츠 화면이 넘긴 영상·구간·자막으로 편집 시작
    window.openShortsSelection = async function (file, pick) {
      // 쇼츠 화면(부모 창)의 File은 이 창에서 Blob으로 인식되지 않아 파형을 읽지 못한다.
      // 데이터 복사 없이 이 창의 File로 다시 감싸서 넘긴다.
      const own = new File([file], file.name || '쇼츠 원본.mp4', { type: file.type || 'video/mp4', lastModified: file.lastModified || Date.now() });
      await openQuickFiles([own]);
      const s = session;
      if (!s?.clip || !pick) return;
      const duration = video.duration;
      const start = Math.max(0, Math.min(duration, Number(pick.start) || 0));
      const end = Math.max(start + 0.1, Math.min(duration, Number(pick.end) || duration));
      // 받아쓴 대사는 원본 시간 기준 그대로 자막 트랙에 올림
      s.clip.lines = (pick.lines || []).filter(l => l && l.text).map(l => ({ start: l.start, end: l.end, text: String(l.text) }));
      s.clip.showCaptions = true;
      if (pick.title) { s.clip.title = pick.title; s.clip.customTitle = true; }
      // 추천 구간 하나만 타임라인에 올림 (자동 편집이 끝나도 덮어쓰지 않음)
      s.wantMontage = false;
      s.timelineCuts = [{ start, end, url: s.url, owner: s.clip }];
      byId('work').classList.add('cut-arranged');
      s.trackTime = 0;
      markEdited();
      renderCutTrack(s);
      seekCutTrack(s, 0);
      detail(s, '추천 구간 ' + clock(start) + ' – ' + clock(end) + ' · ' + (end - start).toFixed(1) + '초를 불러왔어요.');
    };
    // 스튜디오 안에서 연 편집기: 다듬은 영상을 제작 화면으로 넘겨 테마·대본·성우·명함을 입힌다.
    // 어디서 연 편집기든(제작 화면 · 내 영상으로 쇼츠 만들기) 같은 기능을 쓴다.
    // 제작 화면 안이면 바로 넘기고, 쇼츠 화면이면 영상을 브라우저 저장소에 맡긴 뒤 제작 화면으로 이동한다.
    const themeButton = byId('applyTheme');
    let studio = null;
    try { if (parent !== window && typeof parent.arApplyThemeToEditedVideo === 'function') studio = parent; } catch (e) {}
    if (themeButton) {
      themeButton.hidden = false;
      themeButton.addEventListener('click', async () => {
        const s = session;
        if (!s?.clip || s.exporting || s.adding) return;
        themeButton.disabled = true;
        try {
          const blob = await exportShortClip(true, { handoff: true });
          if (!blob || session !== s) return;
          if (studio) {
            // 제작 화면 창의 File로 만들어 넘김 (창이 닫혀도 영상이 남도록)
            const file = new studio.File([blob], '편집한 영상.mp4', { type: 'video/mp4', lastModified: Date.now() });
            await studio.arApplyThemeToEditedVideo(file);
          } else {
            statusLine.textContent = '제작 화면으로 넘어가는 중…';
            await arStashThemeVideo(blob);
            top.location.href = '/studio?applyTheme=1';
          }
        } catch (error) {
          statusLine.textContent = error?.message || '스튜디오로 넘기지 못했어요.';
        } finally { themeButton.disabled = false; }
      });
    }
    return;
  }

  // 쇼츠 화면 쪽: 구간을 고르면 '편집기에서 다듬기' 버튼을 보여 줌
  const button = byId('openInEditor');
  if (!button) return;
  document.body.classList.add('shorts-handoff');
  save.textContent = '편집 없이 바로 저장';

  function sync() {
    const s = session;
    button.hidden = !(s?.clip && s.file && !byId('work').hidden);
    button.disabled = !!s?.exporting;
  }
  new MutationObserver(sync).observe(byId('clips'), { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  new MutationObserver(sync).observe(save, { attributes: true, attributeFilter: ['disabled'] });
  new MutationObserver(sync).observe(byId('work'), { attributes: true, attributeFilter: ['hidden'] });
  sync();

  button.addEventListener('click', () => {
    const s = session, clip = s?.clip;
    if (!clip || !s.file || s.exporting || document.querySelector('dialog.ar-video-editor[open]')) return;
    video.pause();
    const pick = {
      start: clip.start, end: clip.end,
      lines: (clip.lines || []).map(l => ({ start: l.start, end: l.end, text: l.text })),
      title: clip.customTitle ? clip.title : ''
    };
    const dialog = document.createElement('dialog');
    const frame = document.createElement('iframe');
    dialog.className = 'ar-video-editor';
    frame.title = '영상 편집기';
    dialog.setAttribute('aria-label', frame.title);
    frame.src = 'index.html?mode=edit';
    frame.addEventListener('load', () => {
      const w = frame.contentWindow;
      if (typeof w.openShortsSelection === 'function') w.openShortsSelection(s.file, pick);
      else { dialog.close(); detail(s, '편집기를 열지 못했어요. 다시 시도해 주세요.'); }
    }, { once: true });
    const onMessage = e => {
      if (e.origin === location.origin && e.source === frame.contentWindow && e.data === 'close-quick-video') dialog.close();
    };
    window.addEventListener('message', onMessage);
    dialog.addEventListener('close', () => { window.removeEventListener('message', onMessage); dialog.remove(); }, { once: true });
    dialog.append(frame);
    document.body.append(dialog);
    dialog.showModal();
  });
})();
