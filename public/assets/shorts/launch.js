function arOpenQuickVideoEditor(selection) {
  const files = Array.isArray(selection) ? selection : [selection];
  const file = files[0];
  if (!(file instanceof Blob) || document.querySelector('dialog.ar-video-editor[open]')) return;
  arPauseForStudioEdit();
  const dialog = document.createElement('dialog');
  const frame = document.createElement('iframe');
  dialog.className = 'ar-video-editor';
  frame.title = '짧은 내 영상 바로 편집하기';
  dialog.setAttribute('aria-label', frame.title);
  frame.src = '/assets/shorts/index.html?mode=edit';
  frame.addEventListener('load', () => {
    if (typeof frame.contentWindow.openQuickFiles === 'function') frame.contentWindow.openQuickFiles(files);
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
  const files = Array.from(event.target.files);
  event.target.value = '';
  if (files.length) arOpenQuickVideoEditor(files);
});
