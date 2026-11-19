// 같은 탭에서 스튜디오를 통해 들어온 경우에만 실제 방문 기록으로 복귀합니다.
const studioBack = document.querySelector('[data-studio-back]');
if (studioBack) {
  const previous = document.referrer ? new URL(document.referrer) : null;
  if (previous?.origin === location.origin && ['/studio', '/studio/', '/studio.html'].includes(previous.pathname)) {
    history.replaceState({ ...history.state, fromStudio: true }, '');
  }
  studioBack.addEventListener('click', event => {
    if (history.state?.fromStudio && history.length > 1 && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      history.back();
    }
  });
}
