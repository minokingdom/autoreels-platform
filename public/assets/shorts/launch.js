function arOpenQuickVideoEditor(selection=[]) {
  const files = Array.isArray(selection) ? selection : [selection];
  const file = files[0];
  if ((files.length && !(file instanceof Blob)) || document.querySelector('dialog.ar-video-editor[open]')) return;
  arPauseForStudioEdit();
  const dialog = document.createElement('dialog');
  const frame = document.createElement('iframe');
  dialog.className = 'ar-video-editor';
  frame.title = '영상 편집기';
  dialog.setAttribute('aria-label', frame.title);
  frame.src = '/assets/shorts/index.html?mode=edit&v=ready1';
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

document.getElementById('openVideoEditor')?.addEventListener('click',()=>arOpenQuickVideoEditor());
document.getElementById('editExportedVideo')?.addEventListener('click',()=>{
  const blob=window.lastRecordedVideoBlob;
  if(!blob?.size){arToast('먼저 영상을 만들어 주세요.');return;}
  document.getElementById('exportedVideoPlayer')?.pause();
  arOpenQuickVideoEditor(new File([blob],window.lastRecordedFilename || '완성 영상',{type:blob.type}));
});
