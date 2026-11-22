// Browser-side real-time AI Person Cutout (MediaPipe Image Segmenter, Apache 2.0, 0 server cost)
(function () {
  const CUTOUT_KINDS = new Set([
    'cutoutBlur',
    'cutoutDark',
    'cutoutCream',
    'cutoutOutline',
    'cutoutBehindText'
  ]);
  window.arCutoutKinds = CUTOUT_KINDS;

  let segmenter = null;
  let loadPromise = null;
  let loadFailed = false;
  let lastMaskAt = -1;
  let hasValidMask = false;

  const MASK_W = 224;
  const MASK_H = 384;
  const srcSmall = document.createElement('canvas');
  srcSmall.width = MASK_W;
  srcSmall.height = MASK_H;
  const srcSmallCtx = srcSmall.getContext('2d', { willReadFrequently: true });

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = MASK_W;
  maskCanvas.height = MASK_H;
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  const maskImgData = maskCtx.createImageData(MASK_W, MASK_H);

  const bgCanvas = document.createElement('canvas');
  const fgCanvas = document.createElement('canvas');
  const outlineCanvas = document.createElement('canvas');

  async function ensureCutoutModel(silent) {
    if (segmenter) return segmenter;
    if (loadFailed) return null;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      try {
        if (!silent && typeof showMixHint === 'function') {
          showMixHint('인물 컷아웃 AI 모델 준비 중… (최초 1회)');
        }
        const visionMod = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
        const { FilesetResolver, ImageSegmenter } = visionMod;
        const wasm = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const modelAssetPath =
          'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
        try {
          segmenter = await ImageSegmenter.createFromOptions(wasm, {
            baseOptions: { modelAssetPath, delegate: 'GPU' },
            runningMode: 'IMAGE',
            outputCategoryMask: false,
            outputConfidenceMasks: true
          });
        } catch (_) {
          segmenter = await ImageSegmenter.createFromOptions(wasm, {
            baseOptions: { modelAssetPath, delegate: 'CPU' },
            runningMode: 'IMAGE',
            outputCategoryMask: false,
            outputConfidenceMasks: true
          });
        }
        if (!silent && typeof showMixHint === 'function') {
          showMixHint('인물 컷아웃 AI 준비 완료!');
        }
        if (typeof renderPreview === 'function') {
          try { renderPreview(); } catch (_) {}
        }
        return segmenter;
      } catch (err) {
        console.warn('Cutout model load failed, falling back to soft portrait mode:', err);
        loadFailed = true;
        return null;
      } finally {
        loadPromise = null;
      }
    })();
    return loadPromise;
  }
  window.arEnsureCutoutModel = ensureCutoutModel;

  function updatePersonMask(sourceCanvas, force) {
    if (!segmenter) {
      if (!loadPromise && !loadFailed) ensureCutoutModel(false);
      return hasValidMask;
    }
    const now = performance.now();
    if (!force && hasValidMask && now - lastMaskAt < 55) return true;
    try {
      srcSmallCtx.drawImage(sourceCanvas, 0, 0, MASK_W, MASK_H);
      const res = segmenter.segment(srcSmall);
      const conf = res && res.confidenceMasks && res.confidenceMasks[0];
      if (!conf) return hasValidMask;
      const arr = conf.getAsFloat32Array();
      const data = maskImgData.data;
      const len = Math.min(arr.length, MASK_W * MASK_H);
      for (let i = 0; i < len; i++) {
        // Smooth S-curve threshold for crisp yet feather-soft hair edges
        const v = arr[i];
        const a = v <= 0.25 ? 0 : v >= 0.72 ? 255 : Math.round(((v - 0.25) / 0.47) * 255);
        const p = i * 4;
        data[p] = 255;
        data[p + 1] = 255;
        data[p + 2] = 255;
        data[p + 3] = a;
      }
      maskCtx.putImageData(maskImgData, 0, 0);
      if (typeof conf.close === 'function') conf.close();
      if (res && typeof res.close === 'function') res.close();
      hasValidMask = true;
      lastMaskAt = now;
      return true;
    } catch (_) {
      return hasValidMask;
    }
  }

  function syncBufferSize(w, h) {
    if (bgCanvas.width !== w || bgCanvas.height !== h) {
      bgCanvas.width = w; bgCanvas.height = h;
      fgCanvas.width = w; fgCanvas.height = h;
      outlineCanvas.width = w; outlineCanvas.height = h;
    }
  }

  function drawBehindTypography(ctx, w, h, labelText, amount) {
    const raw = String(labelText || 'HIGHLIGHT').trim();
    if (!raw) return;
    const words = raw.split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const wd of words) {
      if ((cur + ' ' + wd).trim().length > 8 && cur) {
        lines.push(cur);
        cur = wd;
      } else {
        cur = (cur ? cur + ' ' : '') + wd;
      }
      if (lines.length >= 2) break;
    }
    if (cur && lines.length < 2) lines.push(cur);
    if (!lines.length) lines.push(raw.slice(0, 8));

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const baseSize = Math.round(w * (lines[0].length <= 4 ? 0.23 : 0.165));
    ctx.font = `900 ${baseSize}px "Pretendard Variable", Pretendard, sans-serif`;
    const lh = baseSize * 1.06;
    const startY = h * 0.30;
    ctx.globalAlpha = 0.94 * amount;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 18;
    lines.forEach((ln, idx) => {
      ctx.fillStyle = idx === 0 ? '#ffffff' : '#fde047';
      ctx.fillText(ln, w / 2, startY + idx * lh, w * 0.92);
    });
    ctx.restore();
  }

  window.arPaintCutoutEffect = function arPaintCutoutEffect(ctx, kind, amount, time, clip, activeText) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    // Skip heavy AI segmentation on tiny 96x84 thumbnail previews; render fast clean icon preview
    if (w < 160) {
      ctx.save();
      if (kind === 'cutoutBlur') {
        const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.16, w / 2, h / 2, w * 0.58);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.52)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      } else if (kind === 'cutoutDark') {
        ctx.fillStyle = 'rgba(10,12,18,0.55)'; ctx.fillRect(0, 0, w, h);
      } else if (kind === 'cutoutCream') {
        ctx.fillStyle = 'rgba(244,236,222,0.55)'; ctx.fillRect(0, 0, w, h);
      } else if (kind === 'cutoutOutline') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(w / 2, h * 0.56, w * 0.28, 0, Math.PI * 2); ctx.stroke();
      } else if (kind === 'cutoutBehindText') {
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fde047'; ctx.font = `900 ${Math.round(w * 0.24)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('DEPTH', w / 2, h * 0.42);
      }
      ctx.restore();
      return;
    }

    syncBufferSize(w, h);
    const bgCtx = bgCanvas.getContext('2d');
    const fgCtx = fgCanvas.getContext('2d');
    bgCtx.clearRect(0, 0, w, h);
    bgCtx.drawImage(ctx.canvas, 0, 0);

    const forceMask = !!(typeof session !== 'undefined' && session && session.exporting);
    const ready = updatePersonMask(bgCanvas, forceMask);

    if (!ready) {
      // Graceful fallback while model is downloading (first ~2s)
      ctx.save();
      if (kind === 'cutoutBehindText') {
        drawBehindTypography(ctx, w, h, activeText || (clip && clip.title) || 'FOCUS', amount * 0.85);
      } else {
        const g = ctx.createRadialGradient(w / 2, h * 0.48, w * 0.22, w / 2, h * 0.48, Math.hypot(w, h) * 0.55);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, kind === 'cutoutCream' ? 'rgba(245,238,225,0.55)' : 'rgba(6,8,12,0.62)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
      return;
    }

    // Extract foreground person with soft feathered alpha mask
    fgCtx.clearRect(0, 0, w, h);
    fgCtx.save();
    fgCtx.drawImage(bgCanvas, 0, 0);
    fgCtx.globalCompositeOperation = 'destination-in';
    try { fgCtx.filter = 'blur(2px)'; } catch (_) {}
    fgCtx.drawImage(maskCanvas, 0, 0, w, h);
    fgCtx.restore();

    ctx.save();
    if (kind === 'cutoutBlur') {
      // Blurred DSLR background + crisp person foreground
      ctx.save();
      try { ctx.filter = `blur(${Math.max(4, Math.round(14 * amount))}px) brightness(0.88)`; } catch (_) {}
      ctx.drawImage(bgCanvas, -14, -14, w + 28, h + 28);
      ctx.restore();
      ctx.drawImage(fgCanvas, 0, 0);
    } else if (kind === 'cutoutDark') {
      // Dark luxury studio backdrop + crisp person foreground
      const g = ctx.createRadialGradient(w / 2, h * 0.36, w * 0.08, w / 2, h * 0.5, h * 0.72);
      g.addColorStop(0, '#222938');
      g.addColorStop(0.55, '#10131a');
      g.addColorStop(1, '#07080c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(fgCanvas, 0, 0);
    } else if (kind === 'cutoutCream') {
      // Warm editorial cream studio backdrop + crisp person foreground
      const g = ctx.createRadialGradient(w / 2, h * 0.35, w * 0.06, w / 2, h * 0.5, h * 0.75);
      g.addColorStop(0, '#fcf9f3');
      g.addColorStop(0.65, '#efe7da');
      g.addColorStop(1, '#dfd4c2');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(fgCanvas, 0, 0);
    } else if (kind === 'cutoutOutline') {
      // White sticker border around subject over softly dimmed background
      ctx.save();
      try { ctx.filter = 'blur(5px) brightness(0.76)'; } catch (_) {}
      ctx.drawImage(bgCanvas, -6, -6, w + 12, h + 12);
      ctx.restore();

      const oCtx = outlineCanvas.getContext('2d');
      oCtx.clearRect(0, 0, w, h);
      oCtx.save();
      oCtx.drawImage(maskCanvas, 0, 0, w, h);
      oCtx.globalCompositeOperation = 'source-in';
      oCtx.fillStyle = '#ffffff';
      oCtx.fillRect(0, 0, w, h);
      oCtx.restore();

      const borderPx = Math.max(4, Math.round(w * 0.011 * amount));
      const dirs = [
        [-borderPx, 0], [borderPx, 0], [0, -borderPx], [0, borderPx],
        [-borderPx * 0.7, -borderPx * 0.7], [borderPx * 0.7, -borderPx * 0.7],
        [-borderPx * 0.7, borderPx * 0.7], [borderPx * 0.7, borderPx * 0.7]
      ];
      ctx.save();
      ctx.globalAlpha = 0.96;
      for (const [dx, dy] of dirs) ctx.drawImage(outlineCanvas, dx, dy);
      ctx.restore();
      ctx.drawImage(fgCanvas, 0, 0);
    } else if (kind === 'cutoutBehindText') {
      // Viral Reels Depth Effect: Background -> Huge Bold Text -> Sharp Person Foreground!
      ctx.save();
      ctx.fillStyle = 'rgba(8, 10, 14, 0.22)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      drawBehindTypography(ctx, w, h, activeText || (clip && clip.title) || 'FOCUS', amount);
      ctx.drawImage(fgCanvas, 0, 0);
    }
    ctx.restore();
  };
})();
