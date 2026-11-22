// 완성 파일 확인 후 같은 내보내기 요청은 한 번만 차감합니다.
async function arCheckShortsAccess(signal) {
  const response = await fetch('/api/account?action=me', {credentials:'same-origin', signal});
  const account = await response.json();
  if (!response.ok || !account.user || !account.entitlement?.pro) throw Error('스튜디오에서 로그인과 이용권을 확인한 뒤 저장해 주세요.');
}
async function arValidateShortsExport(blob) {
  if (blob.size < 1000 || !blob.type.startsWith('video/mp4')) throw Error('완성된 MP4를 확인하지 못했어요.');
  const url = URL.createObjectURL(blob);
  const video = document.createElement('video');
  try {
    await new Promise((resolve,reject) => {
      const timeout = setTimeout(() => reject(Error('완성된 MP4를 확인하지 못했어요.')),10000);
      video.onloadedmetadata = () => { clearTimeout(timeout); resolve(); };
      video.onerror = () => { clearTimeout(timeout); reject(Error('MP4를 읽지 못했어요.')); };
      video.src = url;
    });
    if (video.videoWidth !== 1080 || video.videoHeight !== 1920) throw Error('영상 해상도를 확인하지 못했어요.');
  } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
}
async function arConfirmShortsExport(blob, requestId, isCurrent) {
  await arValidateShortsExport(blob);
  if (!isCurrent()) throw Error('저장이 중단됐어요.');
  const response = await fetch('/api/account?action=consume-export', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId})});
  const result = await response.json();
  if (!response.ok || !result.ok) throw Error(result.message || '스튜디오에서 로그인과 이용권을 확인해 주세요.');
}
