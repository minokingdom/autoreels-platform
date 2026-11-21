function arOpenQuickVideoEditor(file) {
  if (!(file instanceof Blob) || document.querySelector('dialog.ar-video-editor')) return;
  arPauseForStudioEdit();
  const dialog = document.createElement('dialog');
  const frame = document.createElement('iframe');
  dialog.className = 'ar-video-editor';
  frame.title = '짧은 내 영상 바로 편집하기';
  dialog.setAttribute('aria-label', frame.title);
  frame.src = '/assets/shorts/index.html?mode=edit';
  frame.addEventListener('load', () => {
    if (typeof frame.contentWindow.openShortsFile === 'function') frame.contentWindow.openShortsFile(file);
    else { dialog.close(); arToast('편집기를 열지 못했어요. 다시 시도해 주세요.'); }
  }, {once:true});
  const closeEditor = event => {
    if (event.origin === location.origin && event.source === frame.contentWindow && event.data === 'close-quick-video') dialog.close();
  };
  window.addEventListener('message', closeEditor);
  dialog.addEventListener('close', () => {
    window.removeEventListener('message', closeEditor);
    dialog.remove();
  }, {once:true});
  dialog.append(frame);
  document.body.append(dialog);
  dialog.showModal();
}
document.getElementById('quickShortVideoInput')?.addEventListener('change', event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (file) arOpenQuickVideoEditor(file);
});
