async function arSnsApi(action, body) {
  const opt = { method: body ? 'POST' : 'GET', headers: {}, credentials: 'same-origin' };
  if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch(`/api/sns?action=${encodeURIComponent(action)}`, opt);
  const j = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok && j.ok !== false, body: j };
}

let arVercelBlob = null;
async function arLoadBlobClient() {
  if (!arVercelBlob) arVercelBlob = await import('https://esm.sh/@vercel/blob@2.9.0/client');
  return arVercelBlob;
}


async function arUploadSnsVideo(blob, onProgress) {
  const tk = await arSnsApi('upload-token',{size:blob.size,type:blob.type || 'video/mp4'});
  if (!tk.ok) throw Error(tk.body.message || '업로드 권한을 받지 못했어요.');
  const { put } = await arLoadBlobClient();
  const uploaded = await put(tk.body.pathname, blob, {
    access:'public', token:tk.body.clientToken, contentType:tk.body.contentType,
    onUploadProgress:event => onProgress(Math.round(event.percentage || 0))
  });
  return uploaded.url;
}
