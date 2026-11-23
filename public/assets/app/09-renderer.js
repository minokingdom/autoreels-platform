// AutoReels — 09-renderer.js  (public/index.html 에서 나눔. 일반 <script> 로 순서대로 불러오며 전역 이름을 공유함)
    // ★ 장르 엔진 끝

    // 540×960 논리 좌표를 유지하면서 출력 캔버스에 벡터·사진을 직접 그립니다.
    function renderHyperFramesComposition(t) {
      ctx.save();
      ctx.setTransform(canvas.width / 540, 0, 0, canvas.height / 960, 0, 0);
      try { arRenderLogicalComposition(t); } finally { ctx.restore(); }
    }
    function arRenderLogicalComposition(t) {
      const d = arDisplayDealer(getSelectedDealer());
      const W = 540;
      const H = 960;
      const HYUNDAI_NAVY = '#002C5F';
      const KIA_RED = '#BB162B';
      const mainDuration = getMainDuration();
      const totalCuts = getTargetCutCount();
      const cutDuration = mainDuration / totalCuts;
      const theme = DIRECTOR_THEMES[campaign.themeId] || DIRECTOR_THEMES.royal;
      const lMode = campaign.layoutMode || 'CLASSIC_SHOWROOM';

      // 텍스트가 절대 잘리거나 박스 밖으로 삐져나가지 않도록 폰트 크기를 자동 조절하는 범용 헬퍼 (본편 & 명함 공통)
      function drawFittedText(text, x, y, maxWidth, initialSize, minSize = 9, fontFamily = 'sans-serif') {
        const str = String(text || '').trim();
        if (!str) return;
        let size = initialSize;
        ctx.font = 'bold ' + size + 'px ' + fontFamily;
        while (ctx.measureText(str).width > maxWidth && size > minSize) {
          size -= 0.5;
          ctx.font = 'bold ' + size + 'px ' + fontFamily;
        }
        if (ctx.measureText(str).width <= maxWidth) {
          ctx.fillText(str, x, y);
          return;
        }
        // minSize에서도 넘치면 끝에 말줄임표(…)를 붙여 완벽히 박스 내부에 가둠!
        let fitted = str;
        while (ctx.measureText(fitted + '…').width > maxWidth && fitted.length > 1) {
          fitted = fitted.slice(0, -1);
        }
        ctx.fillText(fitted + '…', x, y);
      }
      // ========================================================================
      // 구간 1 & 2 (0.0s ~ mainDuration): 프로모션 본편(4~10컷) + AI 성우 자막 + 하단 카마스터 실물바
      // ========================================================================
      if (USE_GENRE_ENGINE) {
        // 장르 엔진 v2 (위에서 정의). 아래 기존 그리기 코드는 USE_GENRE_ENGINE=false일 때만 사용
        try {
          renderGenreFrame(t, mainDuration, totalCuts, d);
        } finally { window.__arMixCut = -1; }
        // 컷마다 섞기: 디자인이 바뀌는 컷 경계에서 짧게 번쩍 넘어감 (인스타 템플릿 전환 느낌)
        const mci = window.__arActiveRenderCutIdx, msec = window.__arActiveRenderLocalSec || 0;
        if (campaign.cutDesigns && mci > 0 && msec < 0.16 && campaign.cutDesigns[mci] !== campaign.cutDesigns[mci - 1]) {
          ctx.save();
          ctx.globalAlpha = (1 - msec / 0.16) * 0.55;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }
      } else if (t < mainDuration) {
        const vid = document.getElementById('hiddenCustomVideo');

        const v = d.variation || VARIATION_RECIPES[0];

        // 배경: 카마스터마다 다른 사진 순서(cutOrder) 및 카메라 무빙 조합(cameraOrder) 적용
        if (campaign.uploadedPhotos.length > 0) {
          const numPhotos = typeof arScenePhotos === 'function' ? arScenePhotos().length : campaign.uploadedPhotos.length;
          const slideDuration = mainDuration / numPhotos;
          const idx = Math.min(numPhotos - 1, Math.floor(t / slideDuration));
          const localProgress = Easing.clamp((t - idx * slideDuration) / slideDuration, 0, 1);

          const activeCutCount = typeof getTargetCutCount === 'function' ? Math.max(1, getTargetCutCount()) : numPhotos;
          const cutSlotForScene = Math.min(activeCutCount - 1, Math.floor(t / (mainDuration / activeCutCount)));
          const prevCutSlotForScene = Math.max(0, cutSlotForScene - 1);
          const curSceneOverride = campaign.scenePlan && campaign.scenePlan[cutSlotForScene];
          const prevSceneOverride = campaign.scenePlan && campaign.scenePlan[prevCutSlotForScene];

          const mappedPhotoIdx = (curSceneOverride && curSceneOverride.photoIdx !== undefined)
            ? (curSceneOverride.photoIdx % numPhotos)
            : ((idx < 4 && v.cutOrder && v.cutOrder[idx] !== undefined)
              ? (v.cutOrder[idx] % numPhotos)
              : (idx % numPhotos));
          const prevMappedPhotoIdx = idx > 0
            ? ((prevSceneOverride && prevSceneOverride.photoIdx !== undefined)
              ? (prevSceneOverride.photoIdx % numPhotos)
              : ((idx - 1 < 4 && v.cutOrder && v.cutOrder[idx - 1] !== undefined) ? (v.cutOrder[idx - 1] % numPhotos) : ((idx - 1) % numPhotos)))
            : 0;

          const mappedCamIdx = (v.cameraOrder && v.cameraOrder[idx % 4] !== undefined)
            ? (v.cameraOrder[idx % 4] + idx)
            : idx;
          const prevMappedCamIdx = idx > 0
            ? ((v.cameraOrder && v.cameraOrder[(idx - 1) % 4] !== undefined) ? (v.cameraOrder[(idx - 1) % 4] + idx - 1) : (idx - 1))
            : 0;

          const img = campaign.uploadedPhotos[mappedPhotoIdx];
          const prevImg = idx > 0 ? campaign.uploadedPhotos[prevMappedPhotoIdx] : null;
          // 영상 클립은 실제 시간 기준으로 재생 (가상 시간으로 돌리면 재생 속도가 흔들림)
          syncCutVideos(mappedPhotoIdx, Math.max(0, (window.__realTimelineT || 0) - toRealTime(idx * slideDuration)));

          // ================================================================
          // ★ 시네마틱 모션 라이브러리 (GSAP 스타일 · seek(t) 결정론적)
          //   카메라 무빙 14종 × 컷 전환 12종 — 카마스터·컷마다 다른 조합
          // ================================================================
          const motionSeed = (campaign.motionSeed !== undefined)
            ? campaign.motionSeed
            : hashMotionSeed(String(d.token || d.id || 'x'));
          const camType = (curSceneOverride && curSceneOverride.customCam !== undefined)
            ? (curSceneOverride.customCam % MOTION_COUNT)
            : ((mappedCamIdx * 5 + motionSeed) % MOTION_COUNT);
          const prevCamType = (prevSceneOverride && prevSceneOverride.customCam !== undefined)
            ? (prevSceneOverride.customCam % MOTION_COUNT)
            : ((prevMappedCamIdx * 5 + motionSeed) % MOTION_COUNT);
          const transType = (idx * 7 + motionSeed * 3) % TRANSITION_COUNT;

          function drawLayer(imageObj, cType, prog, o = {}) {
            if (!imageObj) return;
            // 원본 비율을 유지한 채 화면을 꽉 채움 (가로 사진·영상이 찌그러지지 않도록 가운데 기준으로 자름)
            const srcW = imageObj.videoWidth || imageObj.naturalWidth || imageObj.width || W;
            const srcH = imageObj.videoHeight || imageObj.naturalHeight || imageObj.height || H;
            const cover = Math.max(W / srcW, H / srcH);
            const drawW = srcW * cover;
            const drawH = srcH * cover;
            if (imageObj._isVideo && imageObj.readyState < 2) return;
            // 영상 클립은 자체 움직임이 있으므로 카메라 무빙 없이 전환 효과만 적용
            const c = imageObj._isVideo ? { s: 1, x: 0, y: 0, r: 0 } : cameraMotionState(cType, Easing.clamp(prog, 0, 1));

            ctx.save();
            if (o.clip) {
              ctx.beginPath();
              o.clip(ctx);
              ctx.clip();
            }
            ctx.globalAlpha = o.alpha === undefined ? 1 : Math.max(0, Math.min(1, o.alpha));
            if (o.filter && 'filter' in ctx) ctx.filter = o.filter;
            ctx.translate(W / 2 + c.x + (o.dx || 0), H / 2 + c.y + (o.dy || 0));
            const rot = (c.r || 0) + (o.rot || 0);
            if (rot) ctx.rotate(rot);
            if (c.ky || c.kx) ctx.transform(1, c.ky || 0, c.kx || 0, 1, 0, 0);
            // 회전 시 모서리 검은 여백이 보이지 않도록 자동 보정 확대
            const s = (c.s + Math.abs(rot) * 1.6 + Math.abs(c.ky || 0) * 1.2) * (o.scale || 1);
            ctx.scale(s, s);
            ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
          }

          function drawTransition(type, q, A, aCam, B, bCam, bProg) {
            const io = Easing.power3InOut(q);
            const o4 = Easing.power4Out(q);
            switch (type) {
              case 0: { // 크로스 디졸브
                drawLayer(A, aCam, 1);
                drawLayer(B, bCam, bProg, { alpha: io });
                break;
              }
              case 1: { // 휩 팬 (모션 블러 좌우 스윕)
                const blur = Math.sin(q * Math.PI) * 14;
                drawLayer(A, aCam, 1, { dx: -io * W, filter: `blur(${blur.toFixed(1)}px)` });
                drawLayer(B, bCam, bProg, { dx: (1 - io) * W, filter: `blur(${blur.toFixed(1)}px)` });
                break;
              }
              case 2: { // 줌 블러 펀치
                drawLayer(A, aCam, 1, { scale: 1 + io * 0.6, alpha: 1 - io, filter: `blur(${(io * 10).toFixed(1)}px)` });
                drawLayer(B, bCam, bProg, { scale: 1.35 - o4 * 0.35, alpha: Math.min(1, q * 1.6), filter: `blur(${((1 - o4) * 8).toFixed(1)}px)` });
                break;
              }
              case 3: { // 세로 푸시 (릴스 스와이프)
                drawLayer(A, aCam, 1, { dy: -io * H });
                drawLayer(B, bCam, bProg, { dy: (1 - io) * H });
                break;
              }
              case 4: { // 원형 아이리스 리빌
                drawLayer(A, aCam, 1);
                const rad = o4 * Math.hypot(W, H) * 0.62 + 1;
                drawLayer(B, bCam, bProg, { clip: (c) => c.arc(W / 2, H * 0.45, rad, 0, Math.PI * 2) });
                ctx.save();
                ctx.strokeStyle = `rgba(255,255,255,${(0.7 * (1 - q)).toFixed(3)})`;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(W / 2, H * 0.45, rad, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                break;
              }
              case 5: { // 대각선 와이프
                drawLayer(A, aCam, 1);
                const e = io * (W + H) * 1.05;
                drawLayer(B, bCam, bProg, {
                  clip: (c) => { c.moveTo(0, 0); c.lineTo(e, 0); c.lineTo(e - H, H); c.lineTo(0, H); c.closePath(); }
                });
                ctx.save();
                ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(e, 0);
                ctx.lineTo(e - H, H);
                ctx.stroke();
                ctx.restore();
                break;
              }
              case 6: { // 블라인드 스트립 (스태거)
                drawLayer(A, aCam, 1);
                const n = 6;
                const sh = H / n;
                drawLayer(B, bCam, bProg, {
                  clip: (c) => {
                    for (let i = 0; i < n; i++) {
                      const lp = Easing.power3InOut(Easing.clamp(q * 1.6 - i * 0.12, 0, 1));
                      c.rect(i % 2 === 0 ? 0 : W * (1 - lp), i * sh, W * lp, sh + 1);
                    }
                  }
                });
                break;
              }
              case 7: { // 화이트 플래시 컷
                if (q < 0.5) drawLayer(A, aCam, 1, { scale: 1 + q * 0.12 });
                else drawLayer(B, bCam, bProg, { scale: 1.06 - (q - 0.5) * 0.12 });
                ctx.save();
                ctx.globalAlpha = Math.max(0, 1 - Math.abs(q - 0.5) * 2.4);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, W, H);
                ctx.restore();
                break;
              }
              case 8: { // 글리치 슬라이스 + RGB 분리
                drawLayer(B, bCam, bProg);
                if (q < 0.85) {
                  const amt = 1 - q / 0.85;
                  const n = 9;
                  const sliceH = H / n;
                  for (let i = 0; i < n; i++) {
                    const v0 = Math.sin(i * 12.9898 + Math.floor(q * 14) * 78.233) * 43758.5453;
                    const rnd = v0 - Math.floor(v0);
                    const useA = rnd > 0.5;
                    drawLayer(useA ? A : B, useA ? aCam : bCam, useA ? 1 : bProg, {
                      dx: (rnd - 0.5) * 90 * amt,
                      clip: (c) => c.rect(0, i * sliceH, W, sliceH + 1)
                    });
                  }
                  ctx.save();
                  ctx.globalCompositeOperation = 'screen';
                  ctx.globalAlpha = 0.22 * amt;
                  ctx.fillStyle = 'rgb(255,0,80)';
                  ctx.fillRect(6 * amt, 0, W, H);
                  ctx.fillStyle = 'rgb(0,200,255)';
                  ctx.fillRect(-6 * amt, 0, W, H);
                  ctx.restore();
                }
                break;
              }
              case 9: { // 스핀 줌
                drawLayer(B, bCam, bProg, { scale: 1.25 - o4 * 0.25, rot: (1 - o4) * -0.18 });
                drawLayer(A, aCam, 1, { scale: 1 + io * 0.5, rot: io * 0.25, alpha: 1 - io });
                break;
              }
              case 10: { // 스플릿 도어 (위·아래 반쪽이 맞물리며 등장)
                drawLayer(A, aCam, 1, { scale: 1 - io * 0.08, alpha: 1 - io * 0.5 });
                const off = (1 - o4) * H / 2;
                drawLayer(B, bCam, bProg, { dy: -off, clip: (c) => c.rect(0, -off, W, H / 2 + 1) });
                drawLayer(B, bCam, bProg, { dy: off, clip: (c) => c.rect(0, H / 2 + off, W, H / 2) });
                break;
              }
              default: { // 카드 그로우 (작은 카드가 화면 가득 확장)
                drawLayer(A, aCam, 1, { filter: `blur(${(io * 6).toFixed(1)}px)` });
                ctx.save();
                ctx.fillStyle = `rgba(0,0,0,${(0.4 * io).toFixed(3)})`;
                ctx.fillRect(0, 0, W, H);
                ctx.restore();
                const k = 0.35 + o4 * 0.65;
                const cw = W * k, ch = H * k, cx = (W - cw) / 2, cy = (H - ch) / 2, rr = 28 * (1 - o4);
                drawLayer(B, bCam, bProg, {
                  clip: (c) => { if (c.roundRect) c.roundRect(cx, cy, cw, ch, rr); else c.rect(cx, cy, cw, ch); }
                });
              }
            }
          }

          // 컷 전환 (컷 시작 후 최대 0.45초 동안 전환 효과)
          const transSec = Math.min(0.45, slideDuration * 0.28);
          const tIn = t - idx * slideDuration;
          if (idx > 0 && prevImg && tIn < transSec) {
            drawTransition(transType, Easing.clamp(tIn / transSec, 0, 1), prevImg, prevCamType, img, camType, localProgress);
          } else {
            drawLayer(img, camType, localProgress);
          }

          // ★ 22대 독립 비주얼 장르별 맞춤형 배경 대기 FX
          if (lMode === 'EDITORIAL_VOGUE' || lMode === 'CANNES_FILM' || lMode === 'BLACK_OBSIDIAN' || lMode === 'VVIP_CONCIERGE') {
            const vig = ctx.createLinearGradient(0, 0, 0, H);
            vig.addColorStop(0, 'rgba(7, 8, 12, 0.7)');
            vig.addColorStop(0.2, 'rgba(0, 0, 0, 0)');
            vig.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
            vig.addColorStop(1, 'rgba(7, 8, 12, 0.78)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);
          } else if (lMode === 'MONACO_MARINE') {
            const vig = ctx.createLinearGradient(0, 0, 0, H);
            vig.addColorStop(0, 'rgba(10, 25, 47, 0.65)');
            vig.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
            vig.addColorStop(1, 'rgba(10, 25, 47, 0.85)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);
          } else if (lMode === 'BROADCAST_NEWS' || lMode === 'DDAY_COUNTDOWN' || lMode === 'CANCEL_STOCK' || lMode === 'FLASH_DEAL') {
            const vig = ctx.createLinearGradient(0, H - 240, 0, H);
            vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vig.addColorStop(0.4, 'rgba(15, 23, 42, 0.6)');
            vig.addColorStop(1, 'rgba(15, 23, 42, 0.94)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, H - 240, W, 240);
          } else if (lMode === 'SECRET_DOSSIER') {
            const vig = ctx.createLinearGradient(0, 0, 0, H);
            vig.addColorStop(0, 'rgba(28, 25, 23, 0.7)');
            vig.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
            vig.addColorStop(1, 'rgba(28, 25, 23, 0.88)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);
          } else if (lMode === 'CYBER_HUD' || lMode === 'AUTONOMOUS_LIDAR' || lMode === 'BATTERY_TELEMETRY' || lMode === 'TECH_ECO_V2L') {
            const vig = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, H * 0.7);
            vig.addColorStop(0, 'rgba(2, 6, 23, 0.15)');
            vig.addColorStop(0.7, 'rgba(2, 6, 23, 0.6)');
            vig.addColorStop(1, 'rgba(2, 6, 23, 0.88)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);
          } else if (lMode === 'RACING_ACTION' || lMode === 'LAUNCH_CONTROL' || lMode === 'EXHAUST_POP') {
            const vig = ctx.createLinearGradient(0, 0, 0, H);
            vig.addColorStop(0, 'rgba(15, 15, 20, 0.7)');
            vig.addColorStop(0.3, 'rgba(0, 0, 0, 0.05)');
            vig.addColorStop(0.7, 'rgba(0, 0, 0, 0.08)');
            vig.addColorStop(1, 'rgba(15, 15, 20, 0.85)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);
          } else if (lMode === 'TIKTOK_VIRAL_SPLIT' || lMode === 'TAX_CALCULATOR') {
            const vig = ctx.createLinearGradient(0, H - 280, 0, H);
            vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vig.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, H - 280, W, 280);
          } else {
            const vig = ctx.createLinearGradient(0, 0, 0, H);
            vig.addColorStop(0, 'rgba(0, 28, 62, 0.65)');
            vig.addColorStop(0.24, 'rgba(0, 0, 0, 0.05)');
            vig.addColorStop(0.56, 'rgba(0, 0, 0, 0.1)');
            vig.addColorStop(1, 'rgba(0, 20, 46, 0.85)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);
          }
        } else if (campaign.hasCustomVideo && vid.readyState >= 2) {
          ctx.drawImage(vid, 0, 0, W, H);
        } else {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, W, H);
        }

        // ★ [키네틱 타이포] 단어별 시차(Stagger) 팝업 리빌 헬퍼 (박스 오버플로우 방지 + 오버슈트 댐핑 완벽 적용)
        function drawKineticWords(text, x, y, maxWidth, initialSize, localT, baseDelay = 0, color = '#ffffff') {
          const str = String(text || '').trim();
          if (!str) return;
          const words = str.split(/\s+/);
          let size = initialSize;
          ctx.font = `900 ${size}px sans-serif`;
          while (ctx.measureText(str).width > maxWidth && size > 11) {
            size -= 0.5;
            ctx.font = `900 ${size}px sans-serif`;
          }
          const totalW = ctx.measureText(str).width;
          // 11px에서도 넘치면 비례 압축 스케일링으로 박스 절대 이탈 방지
          const scaleRatio = totalW > maxWidth && maxWidth > 50 ? maxWidth / totalW : 1;
          const spaceW = ctx.measureText(' ').width * scaleRatio;
          let curX = x - (totalW * scaleRatio) / 2;

          words.forEach((w, wIdx) => {
            const wordDelay = baseDelay + wIdx * 0.07;
            const wProg = Easing.clamp((localT - wordDelay) / 0.28, 0, 1);
            // Easing.backOut 오버슈트(최대 1.7배 팽창)로 인한 박스 탈출 버그 수정 -> 1.15배 이내로 댐핑!
            const rawPop = Easing.backOut(wProg);
            const wPop = 1 + (rawPop - 1) * 0.25;
            const wAlpha = Easing.power3InOut(wProg);
            const wordW = ctx.measureText(w).width * scaleRatio;

            ctx.save();
            ctx.globalAlpha = wAlpha;
            const wordCenterX = curX + wordW / 2;
            ctx.translate(wordCenterX, y);
            ctx.scale(wPop * scaleRatio, wPop);
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.fillText(w, 0, 0);
            ctx.restore();

            curX += wordW + spaceW;
          });
        }

        // ★ [시네마틱 마스크] 아래에서 수직으로 솟구치는 마스크 리빌 헬퍼 (길이 자동 압축/말줄임 완벽 방어)
        function drawMaskedRiseText(text, x, y, maxWidth, initialSize, localT, height = 48, color = '#ffffff') {
          const str = String(text || '').trim();
          if (!str) return;
          let size = initialSize;
          ctx.font = `900 ${size}px sans-serif`;
          while (ctx.measureText(str).width > maxWidth && size > 11) {
            size -= 0.5;
            ctx.font = `900 ${size}px sans-serif`;
          }
          let fitted = str;
          if (ctx.measureText(fitted).width > maxWidth) {
            while (ctx.measureText(fitted + '…').width > maxWidth && fitted.length > 1) {
              fitted = fitted.slice(0, -1);
            }
            fitted += '…';
          }
          const riseProg = Easing.power4Out(Easing.clamp(localT / 0.42, 0, 1));
          const offsetY = (1 - riseProg) * height;

          ctx.save();
          ctx.beginPath();
          ctx.rect(x - maxWidth / 2, y - height, maxWidth, height + 10);
          ctx.clip();

          ctx.textAlign = 'center';
          ctx.fillStyle = color;
          ctx.globalAlpha = riseProg;
          ctx.fillText(fitted, x, y + offsetY);
          ctx.restore();
        }

        // ★ [대각선 스탬프] 화면을 가로지르는 각도로 쾅 찍히는 임팩트 헬퍼
        function drawSlantedStamp(text, x, y, angleDeg, size, localT, bgColor = '#e11d48', textColor = '#ffffff') {
          const str = String(text || '').trim();
          if (!str) return;
          const prog = Easing.clamp(localT / 0.35, 0, 1);
          const slamScale = Math.max(1, 1 + (1 - prog) * 1.2);
          const alpha = Easing.clamp(localT / 0.12, 0, 1);

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((angleDeg * Math.PI) / 180);
          ctx.scale(slamScale, slamScale);
          ctx.globalAlpha = alpha;

          ctx.font = `900 ${size}px sans-serif`;
          const textW = Math.min(ctx.measureText(str).width, 240);
          const padX = 24;
          const padY = 14;

          // 배경 리본
          ctx.fillStyle = bgColor;
          drawRoundedRect(ctx, -textW / 2 - padX, -size / 2 - padY, textW + padX * 2, size + padY * 2, 8);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // 텍스트
          ctx.textAlign = 'center';
          ctx.fillStyle = textColor;
          drawFittedText(str, 0, size * 0.35, textW, size);

          // 충격파 링 효과 (초반 0.2초간 퍼져나감)
          if (localT > 0.15 && localT < 0.55) {
            const ringProg = (localT - 0.15) / 0.4;
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - ringProg})`;
            ctx.lineWidth = 3 * (1 - ringProg);
            ctx.strokeRect(-textW / 2 - padX - ringProg * 25, -size / 2 - padY - ringProg * 15, textW + padX * 2 + ringProg * 50, size + padY * 2 + ringProg * 30);
          }

          ctx.restore();
        }

        const currentCutSlot = Math.min(totalCuts - 1, Math.floor(t / cutDuration));
        const cutLocalT = t - currentCutSlot * cutDuration;
        const activePhotoIndex = currentCutSlot;
        const activeHookText = v.hook || campaign.hook;
        const activeBullets = (v.bullets && v.bullets.length > 0) ? v.bullets : campaign.bullets;

        // ====================================================================
        // ★ 무한 생성형 씬 그래프 렌더러 (8종 컬러 테마 × 12종 위젯 × 동적 N컷)
        // ====================================================================
        const plan = (campaign.scenePlan && campaign.scenePlan[currentCutSlot]) || {
          cut: currentCutSlot + 1,
          widget: WIDGET_POOL[currentCutSlot % WIDGET_POOL.length],
          pos: 'center'
        };
        const widgetType = plan.widget || WIDGET_POOL[currentCutSlot % WIDGET_POOL.length];
        const posMode = String(plan.pos || 'center').toLowerCase();
        const cutPop = Easing.backOut(cutLocalT / 0.38);
        const slideIn = Easing.power4Out(cutLocalT / 0.45);
        const subLine = (campaign.cutCaptions && campaign.cutCaptions[currentCutSlot]) || activeHookText;

        // ★ 상단 내비게이션: 22대 장르별 완전 분리 렌더링!
        if (lMode === 'CLASSIC_SHOWROOM' || lMode === 'BLUEHANDS_INSPECT' || lMode === 'FAMILY_SAFETY') {
          ctx.save();
          const gap = totalCuts > 6 ? 5 : 8;
          const totalAvailW = W - 64 - gap * (totalCuts - 1);
          const barW = totalAvailW / totalCuts;
          for (let c = 0; c < totalCuts; c++) {
            const barX = 32 + c * (barW + gap);
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            drawRoundedRect(ctx, barX, 20, barW, 5, 2.5);
            ctx.fill();
            if (c < currentCutSlot) {
              ctx.fillStyle = theme.accent || HYUNDAI_NAVY;
              drawRoundedRect(ctx, barX, 20, barW, 5, 2.5);
              ctx.fill();
            } else if (c === currentCutSlot) {
              const fillW = Math.max(6, barW * Easing.clamp(cutLocalT / cutDuration, 0, 1));
              ctx.fillStyle = '#ffffff';
              drawRoundedRect(ctx, barX, 20, fillW, 5, 2.5);
              ctx.fill();
            }
          }
          ctx.restore();
        } else if (lMode === 'EDITORIAL_VOGUE' || lMode === 'CANNES_FILM' || lMode === 'MONACO_MARINE' || lMode === 'BLACK_OBSIDIAN' || lMode === 'VVIP_CONCIERGE') {
          ctx.save();
          const romanNums = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
          const totalR = Math.min(totalCuts, 6);
          const rSpacing = 28;
          const startRX = W / 2 - ((totalR - 1) * rSpacing) / 2;
          for (let c = 0; c < totalR; c++) {
            const rx = startRX + c * rSpacing;
            ctx.font = c === currentCutSlot ? 'bold 12px serif' : '11px serif';
            ctx.fillStyle = c === currentCutSlot ? (theme.accent || '#d4af37') : 'rgba(255, 255, 255, 0.35)';
            ctx.textAlign = 'center';
            ctx.fillText(romanNums[c] || (c + 1), rx, 52);
            if (c === currentCutSlot) {
              ctx.fillStyle = theme.accent || '#d4af37';
              ctx.fillRect(rx - 8, 56, 16, 1.5);
            }
          }
          ctx.restore();
        } else if (lMode === 'DDAY_COUNTDOWN') {
          // D-DAY 타임어택: 상단 펄스 타이머 바
          ctx.save();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          drawRoundedRect(ctx, W / 2 - 130, 18, 260, 32, 16);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 13px sans-serif';
          ctx.textAlign = 'center';
          const secLeft = Math.max(1, Math.floor(cutDuration - cutLocalT));
          ctx.fillText(`⏱ D-DAY 마감임박 // 잔여시간 0${secLeft}초`, W / 2, 38);
          ctx.restore();
        } else if (lMode === 'CANCEL_STOCK') {
          ctx.save();
          ctx.fillStyle = 'rgba(220, 38, 38, 0.88)';
          drawRoundedRect(ctx, W / 2 - 140, 18, 280, 32, 16);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔥 [전산배정] 취소차량 1대 즉시출고 선점 대기', W / 2, 38);
          ctx.restore();
        } else if (lMode === 'SECRET_DOSSIER') {
          ctx.save();
          ctx.fillStyle = '#1c1917';
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, W / 2 - 140, 18, 280, 32, 8);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🔒 [CONFIDENTIAL] 비공개 1급 배정 쿼터', W / 2, 38);
          ctx.restore();
        } else if (lMode === 'FLASH_DEAL') {
          ctx.save();
          ctx.fillStyle = '#7c3aed';
          drawRoundedRect(ctx, W / 2 - 130, 18, 260, 32, 16);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.font = '900 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚡ 24H FLASH SALE // 게릴라 특판', W / 2, 38);
          ctx.restore();
        } else if (lMode === 'AUTONOMOUS_LIDAR') {
          ctx.save();
          ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, W / 2 - 130, 18, 260, 30, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#22d3ee';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('📡 360° LIDAR AUTO-NAV // SCANNING', W / 2, 37);
          ctx.restore();
        } else if (lMode === 'BATTERY_TELEMETRY') {
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, W / 2 - 130, 18, 260, 30, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚡ BATTERY SOH: 100% // 800V ULTRA-FAST', W / 2, 37);
          ctx.restore();
        } else if (lMode === 'LAUNCH_CONTROL') {
          ctx.save();
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, W / 2 - 130, 18, 260, 32, 8);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ef4444';
          ctx.font = '900 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🚀 LAUNCH CONTROL: 0-100 READY', W / 2, 38);
          ctx.restore();
        } else if (lMode === 'TAX_CALCULATOR') {
          ctx.save();
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, W / 2 - 140, 18, 280, 32, 8);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💼 100% 비용처리 · 종합소득세/법인세 절감', W / 2, 38);
          ctx.restore();
        }
        // ======================================================
        // ★ 시네마틱 대기 FX (Atmospheric Overlay FX - 6종 무작위 조합)
        // ======================================================
        const fxType = campaign.atmosphereFx || 'anamorphic_flare';
        if (fxType === 'anamorphic_flare') {
          ctx.save();
          const flareY = H * 0.36 + Math.sin(t * 3) * 15;
          const flareGrad = ctx.createLinearGradient(0, flareY, W, flareY);
          flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          flareGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.22)');
          flareGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = flareGrad;
          ctx.fillRect(0, flareY - 4, W, 8);
          ctx.restore();
        } else if (fxType === 'speed_lines') {
          ctx.save();
          ctx.strokeStyle = `${theme.accent}33`;
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 6; i++) {
            const ly = (H * 0.2 + i * 90 + (t * 800) % 600) % (H - 180);
            ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
          }
          ctx.restore();
        } else if (fxType === 'cyber_scanlines') {
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
          for (let y = 0; y < H - 160; y += 4) {
            ctx.fillRect(0, y, W, 1);
          }
          ctx.restore();
        } else if (fxType === 'bokeh_sparkles') {
          ctx.save();
          for (let i = 0; i < 8; i++) {
            const bx = (Math.sin(t * 1.5 + i * 2) * 0.5 + 0.5) * W;
            const by = (Math.cos(t * 1.2 + i * 1.7) * 0.5 + 0.5) * (H - 260) + 80;
            const br = 4 + (i % 5) * 3;
            ctx.fillStyle = `${theme.accent}25`;
            ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        } else if (fxType === 'film_grain') {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          for (let i = 0; i < 40; i++) {
            const gx = Math.random() * W;
            const gy = Math.random() * (H - 160);
            ctx.fillRect(gx, gy, 2, 2);
          }
          ctx.restore();
        }

        // lMode hoisted to function root

        // ★ TIKTOK_VIRAL_SPLIT: 하단 50% 분할 스테이지 배경을 위젯보다 먼저 선행 렌더링
        if (lMode === 'TIKTOK_VIRAL_SPLIT') {
          ctx.save();
          ctx.fillStyle = '#1e222d';
          ctx.fillRect(0, 476, W, H - 476);
          ctx.fillStyle = '#fee500';
          ctx.fillRect(0, 472, W, 4); // 중앙 옐로우 분할선
          ctx.restore();
        }

        // ★ 6대 레이아웃 모드 전체에서 22개 고유 씬 위젯이 매 컷마다 생생하게 살아 움직이도록 전면 활성화!
        const showCenterWidget = true;

        if (showCenterWidget) {
          // 레이아웃 모드별 최적 앵커 Y좌표 계산 (위젯이 헤더/푸터와 겹치지 않고 모드별 스테이지 중앙에 시원하게 안착)
        let baseAnchorY = 475;
        if (lMode === 'TIKTOK_VIRAL_SPLIT') {
          baseAnchorY = 690; // 하단 50% 분할 영역 중심
        } else if (lMode === 'EDITORIAL_VOGUE') {
          baseAnchorY = 450; // 시네마틱 레터박스 사이 중심
        } else if (lMode === 'BROADCAST_NEWS') {
          baseAnchorY = 420; // 상단 LIVE바와 하단 2단 뉴스자막 사이 중심
        } else if (lMode === 'CYBER_HUD') {
          baseAnchorY = 440; // 콕핏 HUD 중심
        } else if (lMode === 'RACING_ACTION') {
          baseAnchorY = 440; // 서킷 레이싱 중심
        }

        const anchorY = posMode === 'top' ? (lMode === 'TIKTOK_VIRAL_SPLIT' ? 570 : 210)
                      : posMode === 'bottom' ? (lMode === 'TIKTOK_VIRAL_SPLIT' ? 810 : 540)
                      : baseAnchorY;

          // --------------------------------------------------------------------
          // 위젯 1: BREAKING_NEWS ★ [화면 하단 풀와이드 방송국 2단 속보 티커]
        // (가운데 박스를 완전히 없애고 하단에 밀착된 정통 방송 뉴스룸 레이아웃!)
        // --------------------------------------------------------------------
        if (widgetType === 'BREAKING_NEWS') {
          const cnt = Math.round(campaign.discountNum * Easing.power4Out(cutLocalT / 0.9));
          const tickerY = 560;

          // 1단: 상단 LIVE 속보 빨간색 뱃지 + 차종 헤더
          ctx.save();
          ctx.translate(24, tickerY);
          ctx.globalAlpha = slideIn;
          
          // 빨간색 LIVE 펄싱 뱃지
          const pulse = 1 + Math.sin(t * 8) * 0.05;
          ctx.fillStyle = '#ef4444';
          drawRoundedRect(ctx, 0, -28, 92, 28, 6);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('● LIVE 속보', 46, -10);

          // 헤더 바
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          drawRoundedRect(ctx, 98, -28, W - 146, 28, 6);
          ctx.fill();
          ctx.fillStyle = theme.accent;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'left';
          drawFittedText(`[단독 긴급배정] ${campaign.vehicle}`, 112, -10, W - 170, 13);
          ctx.restore();

          // 2단: 풀와이드 메인 뉴스 자막 바
          ctx.save();
          ctx.translate(24, tickerY + 6);
          ctx.globalAlpha = slideIn;
          ctx.fillStyle = 'rgba(7, 11, 22, 0.94)';
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 2.5;
          drawRoundedRect(ctx, 0, 0, W - 48, 88, 12);
          ctx.fill();
          ctx.stroke();

          // 메인 자막 (키네틱 타이포)
          drawKineticWords(subLine, (W - 48) / 2, 34, W - 80, 24, cutLocalT, 0.05, '#ffffff');

          // 하단 혜택 캡슐 라인
          ctx.fillStyle = theme.sub;
          ctx.textAlign = 'center';
          drawFittedText(`최대 -${cnt.toLocaleString()}만 원 공식할인  |  ${campaign.discount}`, (W - 48) / 2, 68, W - 80, 16);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 2: MAGAZINE_COVER ★ [보그 스타일 초대형 에디토리얼 타이포 & 미니멀 레터박스]
        // (답답한 네모 상자 완전 제거! 사진 위에 직접 얹히는 하이패션 매거진 레이아웃!)
        // --------------------------------------------------------------------
        else if (widgetType === 'MAGAZINE_COVER') {
          // 상하단 얇은 골드 시네마틱 라인
          ctx.save();
          ctx.strokeStyle = theme.accent;
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(32, 54);
          ctx.lineTo(W - 32, 54);
          ctx.moveTo(32, H - 180);
          ctx.lineTo(W - 32, H - 180);
          ctx.stroke();

          // 상단 에디토리얼 헤더
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`AUTOREELSMAKER SHOWROOM · VOL. 0${currentCutSlot + 1}`, 36, 44);
          ctx.textAlign = 'right';
          ctx.fillStyle = theme.accent;
          ctx.fillText('SPECIAL EDITION', W - 36, 44);
          ctx.restore();

          // 중앙: 배경 박스 없이 사진 위에 직접 솟구쳐 올라오는 46px 초대형 타이포!
          ctx.save();
          ctx.translate(W / 2, 380);
          
          // 1행: 차종명 (마스크 리빌)
          drawMaskedRiseText(campaign.vehicle, 0, 0, W - 64, 40, cutLocalT, 44, '#ffffff');
          
          // 2행: 메인 훅 자막 (키네틱 팝)
          drawKineticWords(subLine, 0, 48, W - 64, 25, cutLocalT, 0.15, theme.accent);

          // 3행: 얇은 골드 디바이더 & 견적
          const lineProg = Easing.power3InOut(Easing.clamp(cutLocalT / 0.45, 0, 1));
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-160 * lineProg, 78);
          ctx.lineTo(160 * lineProg, 78);
          ctx.stroke();

          ctx.fillStyle = '#e2e8f0';
          ctx.textAlign = 'center';
          ctx.globalAlpha = lineProg;
          drawFittedText(`${campaign.discount}  |  최대 -${campaign.discountNum.toLocaleString()}만원 특판`, 0, 108, W - 80, 17);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 3: GIANT_DISCOUNT_STAMP ★ [대각선 -8° 슬래시 다이내믹 리본 & 도장 슬램]
        // (네모 박스 완전 탈피! 화면을 가로지르는 레이싱 리본 + 쾅 찍히는 스탬프 충격파!)
        // --------------------------------------------------------------------
        else if (widgetType === 'GIANT_DISCOUNT_STAMP') {
          const cnt = Math.round(campaign.discountNum * Easing.power4Out(cutLocalT / 0.95));

          // 1. 화면 전체를 가로지르는 -8도 대각선 슬래시 리본 배경 바
          ctx.save();
          ctx.translate(W / 2, 430);
          ctx.rotate((-8 * Math.PI) / 180);
          ctx.globalAlpha = slideIn;

          // 리본 배경
          ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
          ctx.fillRect(-W, -56, W * 2, 112);

          // 상하단 옐로우/테마 체커 스트라이프 라인
          ctx.fillStyle = theme.accent;
          ctx.fillRect(-W, -56, W * 2, 6);
          ctx.fillRect(-W, 50, W * 2, 6);

          // 리본 내부 서브 텍스트
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffffff';
          drawFittedText(`${campaign.vehicle} 공식 당월 특판 · ${campaign.discount}`, 0, -22, W - 60, 18);
          ctx.restore();

          // 2. 리본 위에 쾅 찍히는 초대형 스탬프 (충격파 슬램)
          drawSlantedStamp(`-${cnt.toLocaleString()}만 원`, W / 2, 452, -8, 48, cutLocalT, theme.badge, '#ffffff');

          // 3. 하단에 깔끔하게 안착하는 서브 자막
          ctx.save();
          ctx.translate(W / 2, 560);
          ctx.globalAlpha = slideIn;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          drawRoundedRect(ctx, -200, -18, 400, 36, 18);
          ctx.fill();
          ctx.fillStyle = theme.accent;
          ctx.textAlign = 'center';
          drawFittedText(subLine, 0, 6, 380, 17);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 4: SPEC_FLOATING_TAGS ★ [3D 미래형 HUD 타겟 조준선 & 3단 비대칭 핀]
        // (단일 박스 제거! 차량 주요 부위를 타겟팅하는 원형 조준선 + 리더라인 + 비대칭 캡슐)
        // --------------------------------------------------------------------
        else if (widgetType === 'SPEC_FLOATING_TAGS') {
          // 좌측 차체 타겟 조준선 (Reticle)
          ctx.save();
          const targetX = 78;
          const targetY = 310;
          const reticleProg = Easing.backOut(Easing.clamp(cutLocalT / 0.35, 0, 1));
          
          ctx.translate(targetX, targetY);
          ctx.scale(reticleProg, reticleProg);
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 2;

          // 원형 조준 링
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.stroke();

          // 중심 십자선
          ctx.beginPath();
          ctx.moveTo(-30, 0); ctx.lineTo(-12, 0);
          ctx.moveTo(12, 0);  ctx.lineTo(30, 0);
          ctx.moveTo(0, -30); ctx.lineTo(0, -12);
          ctx.moveTo(0, 12);  ctx.lineTo(0, 30);
          ctx.stroke();

          // 중심 펄싱 점
          const pDot = 1 + Math.sin(t * 9) * 0.2;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 5 * pDot, 0, Math.PI * 2);
          ctx.fill();

          // 조준선에서 우측으로 뻗어나가는 리더 라인 (꺾임선)
          ctx.beginPath();
          ctx.moveTo(22, 0);
          ctx.lineTo(55, -28);
          ctx.lineTo(110, -28);
          ctx.strokeStyle = theme.accent;
          ctx.stroke();
          ctx.restore();

          // 우측 상단 메인 헤드라인 캡슐
          ctx.save();
          ctx.translate(145, 270);
          ctx.globalAlpha = slideIn;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, 0, -20, W - 170, 42, 10);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = theme.accent;
          ctx.textAlign = 'left';
          drawFittedText(`KEY SPEC · ${CUT_NAMES[activePhotoIndex % 4]}`, 14, 6, W - 200, 15);
          ctx.restore();

          // 우측 하단 3단 비대칭 플로팅 칩 (순차적 팝업)
          const tags = [
            `✦ ${campaign.vehicle} 선점 즉시배정`,
            activeBullets[0] || '✔ 36가지 정밀검수 도장결함 제로',
            activeBullets[1] || `✔ 최대 -${campaign.discountNum.toLocaleString()}만원 특판 할인`
          ];
          tags.forEach((tg, i) => {
            const tp = Easing.backOut((cutLocalT - i * 0.12) / 0.38);
            if (tp <= 0) return;
            ctx.save();
            const yPos = 490 + i * 56;
            ctx.translate(W / 2 + (1 - tp) * 40, yPos);
            ctx.scale(tp, tp);
            ctx.fillStyle = i === 0 ? theme.primary : 'rgba(15, 23, 42, 0.92)';
            ctx.strokeStyle = i === 0 ? theme.accent : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, -220, -22, 440, 44, 12);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = i === 0 ? theme.accent : '#ffffff';
            drawFittedText(tg, -196, 6, 390, 16);
            ctx.restore();
          });
        }

        // --------------------------------------------------------------------
        // 위젯 5: KAKAO_CHAT_PAIR ★ [스마트폰 다이내믹 아일랜드 캡슐 & 리얼 카톡 버블 팝업]
        // --------------------------------------------------------------------
        else if (widgetType === 'KAKAO_CHAT_PAIR') {
          const chats = campaign.kakaoChat && campaign.kakaoChat.length >= 2
            ? campaign.kakaoChat
            : [
                { role: 'customer', text: `팀장님! ${campaign.vehicle} 지금 계약하면 오래 기다려야 하나요? 😭` },
                { role: 'dealer', text: `아닙니다 고객님! 선점 물량 확보해둬서 이번 주 즉시출고 가능합니다 🚗` }
              ];
          const pairOffset = (currentCutSlot % 2) * 2;
          const pair = [
            chats[pairOffset % chats.length],
            chats[(pairOffset + 1) % chats.length]
          ];

          // 상단: 스마트폰 다이내믹 아일랜드 알림 캡슐 (스르륵 떨어지는 모션)
          ctx.save();
          const islandProg = Easing.backOut(Easing.clamp(cutLocalT / 0.38, 0, 1));
          ctx.translate(W / 2, 60);
          ctx.scale(islandProg, islandProg);
          ctx.fillStyle = '#000000';
          drawRoundedRect(ctx, -140, -18, 280, 36, 18);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // 캡슐 내부 알림 뱃지
          ctx.fillStyle = '#FEE500';
          ctx.beginPath();
          ctx.arc(-114, 0, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`카카오톡 · ${d.name} 실시간 상담`, -96, 4);
          ctx.restore();

          // 하단: 실제 모바일 메신저 말풍선 2단 스택 (시간차 팝업)
          pair.forEach((msg, idx) => {
            const p = Easing.backOut((cutLocalT - 0.12 - idx * 0.22) / 0.38);
            if (p <= 0) return;
            const isCust = msg.role === 'customer';
            const yPos = 490 + idx * 88;

            ctx.save();
            ctx.translate(W / 2, yPos);
            ctx.scale(p, p);

            const textStr = msg.text || subLine;

            if (isCust) {
              // 고객 말풍선 (좌측 밀착)
              ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
              drawRoundedRect(ctx, -220, -26, 380, 52, 16);
              ctx.fill();
              ctx.fillStyle = '#0f172a';
              ctx.textAlign = 'left';
              drawFittedText(textStr, -200, 6, 340, 16);
            } else {
              // 카마스터 답변 말풍선 (우측 밀착 노란색 카톡 버블)
              ctx.fillStyle = '#FEE500';
              drawRoundedRect(ctx, -160, -26, 380, 52, 16);
              ctx.fill();
              ctx.fillStyle = '#0f172a';
              ctx.textAlign = 'left';
              drawFittedText(textStr, -140, 6, 340, 16);
            }
            ctx.restore();
          });
        }

        // --------------------------------------------------------------------
        // 위젯 6: RECEIPT_QUOTE ★ [실제 영수증 롤 톱니바닥 & 도트프린터 명세표]
        // --------------------------------------------------------------------
        else if (widgetType === 'RECEIPT_QUOTE') {
          const rollProg = Easing.power3InOut(Easing.clamp(cutLocalT / 0.42, 0, 1));
          const receiptH = 220 * rollProg;

          ctx.save();
          ctx.translate(W / 2, 530);

          // 영수증 본체
          ctx.fillStyle = '#ffffff';
          drawRoundedRect(ctx, -220, -110, 440, receiptH, 10);
          ctx.fill();

          // 하단 지그재그 톱니 바닥 (Sawtooth edge)
          if (receiptH > 40) {
            ctx.fillStyle = '#ffffff';
            const teeth = 20;
            const toothW = 440 / teeth;
            const bottomY = -110 + receiptH;
            ctx.beginPath();
            ctx.moveTo(-220, bottomY);
            for (let i = 0; i < teeth; i++) {
              ctx.lineTo(-220 + (i + 0.5) * toothW, bottomY + 8);
              ctx.lineTo(-220 + (i + 1) * toothW, bottomY);
            }
            ctx.fill();
          }

          // 영수증 헤더
          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.font = '900 16px monospace';
          ctx.fillText(`== ${campaign.vehicle} 공식 견적서 ==`, 0, -80);

          if (rollProg > 0.45) {
            ctx.textAlign = 'left';
            ctx.font = 'bold 15px sans-serif';
            ctx.fillStyle = '#475569';
            ctx.fillText('• 특별 프로모션 할인', -190, -42);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#e11d48';
            drawFittedText(`-${campaign.discountNum.toLocaleString()}만 원`, 190, -42, 160, 20);

            ctx.textAlign = 'left';
            ctx.fillStyle = '#475569';
            ctx.fillText('• 월 납입금 조건', -190, -10);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#0f172a';
            drawFittedText(campaign.discount, 190, -10, 210, 17);

            // 점선 구분선
            ctx.strokeStyle = '#cbd5e1';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(-190, 18); ctx.lineTo(190, 18);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#2563eb';
            drawFittedText(subLine, 0, 50, 380, 17);
            ctx.fillStyle = '#64748b';
            if (d.promoTag) drawFittedText(`🎁 ${d.promoTag}`, 0, 74, 380, 14);
          }
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 7: VS_FINANCE_BATTLE ★ [좌우 듀얼 분할 대비 카드 배틀]
        // --------------------------------------------------------------------
        else if (widgetType === 'VS_FINANCE_BATTLE') {
          const splitProg = Easing.backOut(Easing.clamp(cutLocalT / 0.42, 0, 1));
          const cardY = 540;

          // 1. 좌측 카드: [일반 신차 할부 ❌] (어둡고 회색빛)
          ctx.save();
          ctx.translate(135 - (1 - splitProg) * 60, cardY);
          ctx.scale(splitProg, splitProg);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -105, -75, 210, 150, 14);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#ef4444';
          ctx.font = '900 15px sans-serif';
          ctx.fillText('일반 신차할부 ❌', 0, -42);
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('• 대기 6개월 지연', 0, -12);
          ctx.fillText('• 취등록세 7% 별도', 0, 14);
          ctx.fillText('• 자동차세/보험료 X', 0, 40);
          ctx.restore();

          // 2. 우측 카드: [선점 즉시출고 👑] (화려한 테마 네온 하이라이트 + 스케일 1.05)
          ctx.save();
          ctx.translate(405 + (1 - splitProg) * 60, cardY);
          ctx.scale(splitProg * 1.05, splitProg * 1.05);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 3;
          drawRoundedRect(ctx, -105, -75, 210, 150, 14);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = theme.accent;
          ctx.font = '900 15px sans-serif';
          ctx.fillText('선점 즉시출고 👑', 0, -42);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('• 3일 이내 자택탁송', 0, -12);
          ctx.fillStyle = '#fde047';
          ctx.fillText('• 취등록세 0원 전액', 0, 14);
          ctx.fillStyle = theme.sub;
          drawFittedText(campaign.discount, 0, 42, 190, 14);
          ctx.restore();

          // 3. 중앙 VS 네온 뱃지
          ctx.save();
          ctx.translate(W / 2, cardY);
          const vsPop = Easing.backOut(Easing.clamp((cutLocalT - 0.1) / 0.35, 0, 1));
          ctx.scale(vsPop, vsPop);
          ctx.fillStyle = '#e11d48';
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('VS', 0, 6);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 8: CHECKLIST_GLASS ★ [스마트 글래스 HUD & 녹색 체크마크 찰칵 연출]
        // --------------------------------------------------------------------
        else if (widgetType === 'CHECKLIST_GLASS') {
          // 상단 투명 헤더
          ctx.save();
          ctx.translate(W / 2, 380);
          drawMaskedRiseText(subLine, 0, -20, W - 60, 26, cutLocalT, 36, theme.accent);
          drawKineticWords(campaign.vehicle, 0, 24, W - 60, 36, cutLocalT, 0.1, '#ffffff');
          ctx.restore();

          const items = [
            activeBullets[0] || '✔ 선점 재고 3일 이내 즉시출고 가능',
            activeBullets[1] || `✔ 최대 -${campaign.discountNum.toLocaleString()}만원 특판 할인 혜택`,
            d.promoTag ? `✔ ${d.promoTag}` : '✔ 견적부터 출고까지 한 사람이 책임 상담'
          ];

          // 3단 글래스 체크리스트 바
          items.forEach((it, idx) => {
            const ip = Easing.backOut((cutLocalT - 0.15 - idx * 0.12) / 0.36);
            if (ip <= 0) return;
            ctx.save();
            ctx.translate(W / 2, 500 + idx * 58);
            ctx.scale(1, ip);

            // 반투명 글래스 바
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            drawRoundedRect(ctx, -220, -22, 440, 44, 10);
            ctx.fill();
            ctx.stroke();

            // 녹색 체크마크 원
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(-195, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✓', -195, 4);

            // 텍스트
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            drawFittedText(it.replace(/^[✔\s]+/, ''), -172, 6, 370, 16);
            ctx.restore();
          });
        }

        // --------------------------------------------------------------------
        // 위젯 9: STOCK_COUNTDOWN ★ [사이버네틱 타코미터 & 네온 게이지 보드]
        // --------------------------------------------------------------------
        else if (widgetType === 'STOCK_COUNTDOWN') {
          const cntProg = Easing.clamp(cutLocalT / 0.9, 0, 1);
          const gaugeAngle = Math.PI * (0.8 + cntProg * 0.85);

          ctx.save();
          ctx.translate(W / 2, 460);
          ctx.scale(cutPop, cutPop);

          // 다크 보드
          ctx.fillStyle = 'rgba(9, 13, 22, 0.94)';
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 3;
          drawRoundedRect(ctx, -220, -110, 440, 220, 24);
          ctx.fill();
          ctx.stroke();

          // 반원형 타코미터 아크 게이지 트랙
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.arc(0, -10, 68, Math.PI * 0.8, Math.PI * 2.2);
          ctx.stroke();

          // 활성 게이지 아크
          ctx.strokeStyle = theme.accent;
          ctx.beginPath();
          ctx.arc(0, -10, 68, Math.PI * 0.8, gaugeAngle);
          ctx.stroke();

          // 중앙 긴급 재고 숫자
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ef4444';
          ctx.font = '900 24px sans-serif';
          ctx.fillText('잔여 3대', 0, -6);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('실시간 배정 마감', 0, 14);

          // 하단 텍스트
          ctx.fillStyle = theme.accent;
          drawFittedText(subLine, 0, 52, 400, 19);
          ctx.fillStyle = theme.sub;
          drawFittedText(`최대 -${campaign.discountNum.toLocaleString()}만원 특판  |  ${campaign.discount}`, 0, 84, 400, 15);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 10: SMARTKEY_DELIVERY ★ [하단 풀와이드 핸드오버 패스포트 배너]
        // --------------------------------------------------------------------
        else if (widgetType === 'SMARTKEY_DELIVERY') {
          ctx.save();
          ctx.translate(W / 2, 540);
          ctx.scale(cutPop, cutPop);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
          ctx.strokeStyle = theme.primary;
          ctx.lineWidth = 3;
          drawRoundedRect(ctx, -230, -80, 460, 160, 20);
          ctx.fill();
          ctx.stroke();

          // 금색 스마트키 인장
          ctx.fillStyle = '#f59e0b';
          drawRoundedRect(ctx, -200, -66, 92, 28, 6);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔑 출고완료', -154, -48);

          ctx.fillStyle = theme.primary;
          ctx.textAlign = 'left';
          drawFittedText(`${campaign.vehicle} 신차 인도`, -96, -46, 280, 17);

          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          drawFittedText(subLine, 0, 4, 410, 24);

          ctx.fillStyle = '#e11d48';
          drawFittedText(`전국 무료 캐리어 탁송 · ${campaign.discount}`, 0, 36, 410, 18);
          ctx.fillStyle = '#475569';
          if (d.promoTag) drawFittedText(`🎁 ${d.promoTag}`, 0, 62, 410, 14);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 11: MONTHLY_PAYMENT_HERO ★ [네이키드 초대형 네온 볼드 타이포그래피]
        // (네모 박스 완전 제거! 화면 중앙에 52px 초대형 숫자가 팡- 팡- 튀어오름!)
        // --------------------------------------------------------------------
        else if (widgetType === 'MONTHLY_PAYMENT_HERO') {
          ctx.save();
          ctx.translate(W / 2, 440);

          // 상단: 캡슐 배지
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          drawRoundedRect(ctx, -160, -86, 320, 34, 17);
          ctx.fill();
          ctx.fillStyle = theme.sub;
          ctx.textAlign = 'center';
          drawFittedText(`${campaign.vehicle} · 초기비용 0원 설계`, 0, -64, 300, 14);

          // 중앙: 화면을 뒤덮는 초대형 네온 타이포그래피 (키네틱 팝)
          drawKineticWords(campaign.discount, 0, 0, W - 60, 52, cutLocalT, 0.05, theme.accent);

          // 하단: 서브 헤드라인 (마스크 리빌)
          drawMaskedRiseText(subLine, 0, 64, W - 60, 24, cutLocalT, 30, '#ffffff');
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 12: COMMENT_DM_MAGNET ★ [인스타그램 네온 그라디언트 DM 콜아웃 버블]
        // --------------------------------------------------------------------
        else if (widgetType === 'COMMENT_DM_MAGNET') {
          ctx.save();
          const pulse = 1 + Math.sin(t * 7) * 0.03;
          ctx.translate(W / 2, 550);
          ctx.scale(cutPop * pulse, cutPop * pulse);

          ctx.fillStyle = '#FEE500';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3.5;
          drawRoundedRect(ctx, -230, -65, 460, 130, 24);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#0f172a';
          drawFittedText(subLine, 0, -18, 420, 23);
          ctx.fillStyle = '#e11d48';
          drawFittedText(
            v.ctaBanner || `💬 댓글에 [${v.ctaKeyword || '견적'}] 남기시면 1:1 비밀 조건표 DM 발송!`,
            0,
            24,
            420,
            18
          );
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 13: RACING_RIBBON ★ [사선 레이싱 스트라이프 & 카본 바]
        // --------------------------------------------------------------------
        else if (widgetType === 'RACING_RIBBON') {
          ctx.save();
          ctx.translate(W / 2, 450);
          ctx.rotate((-8 * Math.PI) / 180);
          ctx.globalAlpha = slideIn;

          ctx.fillStyle = 'rgba(10, 10, 14, 0.95)';
          ctx.fillRect(-W, -54, W * 2, 108);

          ctx.fillStyle = theme.accent;
          ctx.fillRect(-W, -54, W * 2, 5);
          ctx.fillRect(-W, 49, W * 2, 5);

          ctx.textAlign = 'center';
          drawKineticWords(subLine, 0, -8, W - 60, 25, cutLocalT, 0.05, '#ffffff');
          ctx.fillStyle = theme.accent;
          drawFittedText(`🏁 RACING DNA · ${campaign.vehicle} · ${campaign.discount}`, 0, 30, W - 80, 15);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 14: TECH_HUD ★ [3D 미래형 사이버 타겟 & 헥사곤 플레이트]
        // --------------------------------------------------------------------
        else if (widgetType === 'TECH_HUD') {
          ctx.save();
          ctx.translate(W / 2, 430);
          ctx.scale(cutPop, cutPop);

          ctx.fillStyle = 'rgba(6, 11, 25, 0.90)';
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, -210, -90, 420, 180, 16);
          ctx.fill();
          ctx.stroke();

          // 코너 L자 조준선
          const cs = 14;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          [[-210, -90], [210, -90], [-210, 90], [210, 90]].forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy + (cy < 0 ? cs : -cs));
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx + (cx < 0 ? cs : -cs), cy);
            ctx.stroke();
          });

          ctx.fillStyle = theme.sub;
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`TARGET LOCKED // ${campaign.vehicle.toUpperCase()}`, -190, -66);
          ctx.textAlign = 'right';
          ctx.fillStyle = theme.accent;
          ctx.fillText('RADAR 100% ONLINE', 190, -66);

          drawKineticWords(subLine, 0, -10, 390, 24, cutLocalT, 0.05, '#ffffff');

          const barProg = Easing.clamp(cutLocalT / 0.8, 0, 1);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          drawRoundedRect(ctx, -190, 38, 380, 10, 5);
          ctx.fill();
          ctx.fillStyle = theme.accent;
          drawRoundedRect(ctx, -190, 38, 380 * barProg, 10, 5);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          drawFittedText(`공식 특판 할인 · 최대 -${campaign.discountNum}만원 즉시적용`, 0, 68, 380, 14);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 15: LOWER_THIRD ★ [방송국 와이드 하단바 & EXCLUSIVE 뱃지]
        // --------------------------------------------------------------------
        else if (widgetType === 'LOWER_THIRD') {
          ctx.save();
          ctx.translate(24, 530);
          ctx.globalAlpha = slideIn;

          ctx.fillStyle = theme.badge;
          drawRoundedRect(ctx, 0, -26, 110, 26, 6);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('EXCLUSIVE', 55, -9);

          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, 0, 4, W - 48, 76, 12);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'left';
          drawKineticWords(subLine, 20, 34, W - 88, 22, cutLocalT, 0.05, '#ffffff');
          ctx.fillStyle = theme.sub;
          drawFittedText(`${campaign.vehicle} 당월 특판 · ${campaign.discount}`, 20, 62, W - 88, 15);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 16: NEON_TITLE ★ [초대형 46px 사이버 네온 발광 타이포]
        // --------------------------------------------------------------------
        else if (widgetType === 'NEON_TITLE') {
          ctx.save();
          ctx.translate(W / 2, 420);

          ctx.shadowColor = theme.accent;
          ctx.shadowBlur = 24;
          drawKineticWords(subLine, 0, -20, W - 60, 40, cutLocalT, 0.08, '#ffffff');
          ctx.shadowBlur = 0;

          const p = Easing.backOut(Easing.clamp(cutLocalT / 0.4, 0, 1));
          ctx.scale(p, p);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -180, 28, 360, 36, 18);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = theme.accent;
          ctx.textAlign = 'center';
          drawFittedText(`${campaign.vehicle}  |  ${campaign.discount}`, 0, 51, 340, 16);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 17: DYNAMIC_ISLAND ★ [iOS 다이내믹 아일랜드 팝업 & 승인 알림]
        // --------------------------------------------------------------------
        else if (widgetType === 'DYNAMIC_ISLAND') {
          ctx.save();
          const p = Easing.backOut(Easing.clamp(cutLocalT / 0.45, 0, 1));
          ctx.translate(W / 2, 80);
          ctx.scale(p, p);

          ctx.fillStyle = '#000000';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -190, -28, 380, 56, 28);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = theme.accent;
          ctx.beginPath();
          ctx.arc(-154, 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚡', -154, 4);

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          drawFittedText(subLine, -130, -3, 300, 15);
          ctx.fillStyle = theme.sub;
          drawFittedText(`${campaign.vehicle} 즉시배정 승인 알림`, -130, 17, 300, 12);
          ctx.restore();

          ctx.save();
          ctx.translate(W / 2, 530);
          ctx.globalAlpha = slideIn;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -190, -20, 380, 44, 12);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          drawFittedText(`🔑 ${campaign.discount}  |  당일 출고 승인`, 0, 8, 360, 16);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 18: SPEEDOMETER_RPM_DIAL ★ [RPM 계기판 & 속도계 다이얼]
        // --------------------------------------------------------------------
        else if (widgetType === 'SPEEDOMETER_RPM_DIAL') {
          ctx.save();
          ctx.translate(W / 2, 440);
          ctx.scale(cutPop, cutPop);

          ctx.fillStyle = 'rgba(9, 11, 19, 0.94)';
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 2.5;
          drawRoundedRect(ctx, -210, -100, 420, 200, 24);
          ctx.fill();
          ctx.stroke();

          const rpmT = Easing.clamp(cutLocalT / 0.85, 0, 1);
          const speed = Math.round(rpmT * 180);
          ctx.beginPath();
          ctx.arc(0, -15, 56, Math.PI * 0.75, Math.PI * 2.25);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 8;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, -15, 56, Math.PI * 0.75, Math.PI * (0.75 + rpmT * 1.5));
          ctx.strokeStyle = theme.accent;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 28px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${speed}`, 0, -10);
          ctx.fillStyle = theme.sub;
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('km/h SPEED', 0, 8);

          drawKineticWords(subLine, 0, 52, 380, 20, cutLocalT, 0.05, '#ffffff');
          ctx.fillStyle = theme.accent;
          drawFittedText(`🚀 제로백 퍼포먼스 패키지 · ${campaign.discount}`, 0, 80, 380, 14);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 19: VIP_BLACK_CARD ★ [메탈릭 VIP 블랙 멤버십 카드 플로팅]
        // --------------------------------------------------------------------
        else if (widgetType === 'VIP_BLACK_CARD') {
          ctx.save();
          ctx.translate(W / 2, 440);
          ctx.rotate((3 * Math.PI) / 180);
          ctx.scale(cutPop, cutPop);

          const grad = ctx.createLinearGradient(-190, -105, 190, 105);
          grad.addColorStop(0, '#1c1917');
          grad.addColorStop(0.5, '#09090b');
          grad.addColorStop(1, '#27272a');
          ctx.fillStyle = grad;
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, -190, -105, 380, 210, 18);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fbbf24';
          drawRoundedRect(ctx, -160, -75, 48, 36, 6);
          ctx.fill();

          ctx.fillStyle = theme.accent;
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('VIP CONCIERGE CARD', 160, -62);

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          drawFittedText(subLine, -160, 0, 320, 20);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px monospace';
          ctx.fillText(`MEMBER // ${d.name.toUpperCase()} CLIENT`, -160, 42);

          ctx.fillStyle = theme.accent;
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(campaign.discount, 160, 75);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 20: SCRATCH_COUPON ★ [스크래치 특가 쿠폰 & 당첨 바우처]
        // --------------------------------------------------------------------
        else if (widgetType === 'SCRATCH_COUPON') {
          ctx.save();
          ctx.translate(W / 2, 450);
          ctx.scale(cutPop, cutPop);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
          ctx.strokeStyle = '#e11d48';
          ctx.lineWidth = 2.5;
          drawRoundedRect(ctx, -210, -90, 420, 180, 16);
          ctx.fill();
          ctx.stroke();

          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-60, -90);
          ctx.lineTo(-60, 90);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#e11d48';
          ctx.font = '900 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SPECIAL', -135, -15);
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('COUPON', -135, 10);
          ctx.fillStyle = '#475569';
          ctx.font = '10px monospace';
          ctx.fillText('100% 당첨', -135, 34);

          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'left';
          drawFittedText(subLine, -40, -42, 230, 18);

          ctx.fillStyle = '#f59e0b';
          drawRoundedRect(ctx, -40, -18, 230, 44, 8);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`-${campaign.discountNum}만원 즉시할인`, 75, 12);
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`선착순 3명 한정 · ${campaign.discount}`, 75, 52);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 21: SMARTPHONE_NOTIF_STACK ★ [스마트폰 3단 푸시알림 스택]
        // --------------------------------------------------------------------
        else if (widgetType === 'SMARTPHONE_NOTIF_STACK') {
          ctx.save();
          ctx.translate(W / 2, 420);
          const notifs = [
            { icon: '💳', title: '금융 심사 완료', desc: '초기비용 0원 무보증 즉시 승인' },
            { icon: '🚗', title: `${campaign.vehicle} 차량 배정`, desc: '선점 재고 당일 배정 완료' },
            { icon: '🎁', title: '출고 사은품 8종 패키지', desc: `${campaign.discount} 적용 완료` }
          ];
          notifs.forEach((nt, idx) => {
            const p = Easing.backOut((cutLocalT - idx * 0.15) / 0.35);
            if (p <= 0) return;
            ctx.save();
            ctx.translate(0, (idx - 1) * 62);
            ctx.scale(p, p);
            ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
            ctx.strokeStyle = idx === 1 ? theme.accent : 'rgba(255, 255, 255, 0.18)';
            ctx.lineWidth = 1.5;
            drawRoundedRect(ctx, -200, -25, 400, 52, 14);
            ctx.fill();
            ctx.stroke();

            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(nt.icon, -170, 7);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(nt.title, -145, -4);
            ctx.fillStyle = theme.sub;
            ctx.font = '12px sans-serif';
            drawFittedText(nt.desc, -145, 15, 320, 12);
            ctx.restore();
          });
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 위젯 22: CONTRACT_STAMP_SIGN ★ [공식 계약서 날인 도장 & 무결점 인증]
        // --------------------------------------------------------------------
        else if (widgetType === 'CONTRACT_STAMP_SIGN') {
          ctx.save();
          ctx.translate(W / 2, 450);
          ctx.scale(cutPop, cutPop);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          drawRoundedRect(ctx, -200, -95, 400, 190, 14);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`공식 신차 출고 확인서 // ${campaign.vehicle}`, 0, -65);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-180, -50);
          ctx.lineTo(180, -50);
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#1e293b';
          drawFittedText(subLine, -175, -20, 270, 16);
          ctx.fillStyle = '#64748b';
          ctx.font = '13px sans-serif';
          ctx.fillText(`특판 혜택: ${campaign.discount}`, -175, 10);
          ctx.fillText(`출고 담당: ${d.name} (${d.branch})`, -175, 36);

          drawSlantedStamp('무결점인증', 115, 15, -12, 22, cutLocalT, '#dc2626', '#ffffff');
          ctx.restore();
        }

        // 기본 폴백
        else {
          ctx.save();
          const pulse = 1 + Math.sin(t * 7) * 0.03;
          ctx.translate(W / 2, 550);
          ctx.scale(cutPop * pulse, cutPop * pulse);

          ctx.fillStyle = '#FEE500';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3.5;
          drawRoundedRect(ctx, -230, -65, 460, 130, 24);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#0f172a';
          drawFittedText(subLine, 0, -18, 420, 23);
          ctx.fillStyle = '#e11d48';
          drawFittedText(
            v.ctaBanner || `💬 댓글에 [${v.ctaKeyword || '견적'}] 남기시면 1:1 비밀 조건표 DM 발송!`,
            0,
            24,
            420,
            18
          );
          ctx.restore();
        }
        } // end of if (showCenterWidget)

        // ====================================================================
        // ★ 화면 전체 레이아웃 6대 모드 (Screen Composition Engine)
        // 하단 152px 흰색 박스 강제성을 완전 탈피하여, 모드마다 화면 구성 자체가 완전히 뒤바뀜!
        // ====================================================================
        const narrationLine =
          (campaign.ttsLines && campaign.ttsLines[currentCutSlot]) ||
          subLine ||
          `${campaign.vehicle} · ${campaign.discount}`;

        // --------------------------------------------------------------------
        // 모드 1: EDITORIAL_VOGUE ★ [시네마틱 럭셔리 에디토리얼 풀스크린 모드]
        // 2.39:1 시네마 레터박스 + 수직 워터마크 + 22종 위젯 자유 배치 + 하단 카마스터 VIP 의전 바
        // --------------------------------------------------------------------
        if (lMode === 'EDITORIAL_VOGUE' || lMode === 'CANNES_FILM' || lMode === 'MONACO_MARINE' || lMode === 'BLACK_OBSIDIAN' || lMode === 'VVIP_CONCIERGE') {
          // 상단 럭셔리 2.39:1 시네마틱 레터박스 (Y: 0 ~ 68)
          ctx.save();
          ctx.fillStyle = lMode === 'MONACO_MARINE' ? '#071326' : '#07080c';
          ctx.fillRect(0, 0, W, 68);
          ctx.strokeStyle = theme.accent || '#d4af37';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(24, 68);
          ctx.lineTo(W - 24, 68);
          ctx.stroke();

          const cineBrand = lMode === 'CANNES_FILM' ? `🎞️ CANNES FILM · ${campaign.vehicle.toUpperCase()}`
                          : lMode === 'MONACO_MARINE' ? `⚓ MONACO YACHT · ${campaign.vehicle.toUpperCase()}`
                          : lMode === 'BLACK_OBSIDIAN' ? `🖤 OBSIDIAN ALL-BLACK · ${campaign.vehicle.toUpperCase()}`
                          : lMode === 'VVIP_CONCIERGE' ? `👑 VVIP PRESIDENTIAL · ${campaign.vehicle.toUpperCase()}`
                          : `AUTOREELSMAKER PRESTIGE · ${campaign.vehicle.toUpperCase()}`;

          const cineSub = lMode === 'CANNES_FILM' ? '황금종려상 시네마틱'
                        : lMode === 'MONACO_MARINE' ? '프라이빗 마린 요트'
                        : lMode === 'BLACK_OBSIDIAN' ? '스텔스 럭셔리'
                        : lMode === 'VVIP_CONCIERGE' ? '쇼퍼드리븐 VIP 의전'
                        : `${d.branch || '공식 전시장'} · VIP 의전`;

          ctx.fillStyle = '#ffffff';
          ctx.font = '700 12px serif';
          ctx.textAlign = 'left';
          ctx.fillText(cineBrand, 30, 42);
          ctx.textAlign = 'right';
          ctx.fillStyle = theme.accent || '#d4af37';
          ctx.fillText(cineSub, W - 30, 42);
          ctx.restore();

          // 좌측 수직 워터마크 브랜딩
          ctx.save();
          ctx.translate(28, 450);
          ctx.rotate(-Math.PI / 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.font = '700 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`AUTOREELSMAKER PRESTIGE // ${campaign.vehicle.toUpperCase()}`, 0, 0);
          ctx.restore();

          // 하단 플로팅 럭셔리 자막 바 (Y: 822 ~ 868)
          ctx.save();
          ctx.fillStyle = 'rgba(7, 10, 18, 0.88)';
          ctx.strokeStyle = theme.accent || '#d4af37';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, 24, 824, W - 48, 44, 22);
          ctx.fill();
          ctx.stroke();
          ctx.textAlign = 'center';
          drawKineticWords(narrationLine, W / 2, 852, W - 72, 19, cutLocalT, 0.08, '#ffffff');
          ctx.restore();

          // 하단 럭셔리 시네마틱 레터박스 (Y: 885 ~ 960)
          ctx.save();
          ctx.fillStyle = lMode === 'MONACO_MARINE' ? '#071326' : '#07080c';
          ctx.fillRect(0, 885, W, 75);
          ctx.strokeStyle = theme.accent || '#d4af37';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(24, 885);
          ctx.lineTo(W - 24, 885);
          ctx.stroke();

          // 카마스터 프로필 원형
          ctx.save();
          ctx.beginPath();
          ctx.arc(52, 922, 18, 0, Math.PI * 2);
          ctx.clip();
          if (d.avatarImg) ctx.drawImage(d.avatarImg, 34, 904, 36, 36);
          else {
            ctx.fillStyle = theme.accent || '#d4af37';
            ctx.fillRect(34, 904, 36, 36);
          }
          ctx.restore();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          drawFittedText(`${d.name} ${d.title}`, 80, 917, 240, 14);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '11px sans-serif';
          drawFittedText(`${d.branch} · VIP 컨시어지`, 80, 933, 240, 11);

          ctx.textAlign = 'right';
          ctx.fillStyle = theme.accent || '#d4af37';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('💬 1:1 VIP 상담', W - 30, 925);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 모드 2: BROADCAST_NEWS & 특판 계열 (DDAY_COUNTDOWN, CANCEL_STOCK, SECRET_DOSSIER, FLASH_DEAL)
        // --------------------------------------------------------------------
        else if (lMode === 'BROADCAST_NEWS' || lMode === 'DDAY_COUNTDOWN' || lMode === 'CANCEL_STOCK' || lMode === 'SECRET_DOSSIER' || lMode === 'FLASH_DEAL') {
          const newsHdrBg = lMode === 'FLASH_DEAL' ? '#7c3aed'
                           : lMode === 'SECRET_DOSSIER' ? '#1c1917'
                           : lMode === 'DDAY_COUNTDOWN' ? '#b91c1c'
                           : lMode === 'CANCEL_STOCK' ? '#991b1b'
                           : '#dc2626';

          const newsHdrTitle = lMode === 'FLASH_DEAL' ? '⚡ 24H 게릴라 번개특판'
                             : lMode === 'SECRET_DOSSIER' ? '🔒 1급 기밀 비공개 쿼터'
                             : lMode === 'DDAY_COUNTDOWN' ? '⏱ D-DAY 마감임박 타임어택'
                             : lMode === 'CANCEL_STOCK' ? '🔥 법인 취소차량 즉시배정'
                             : 'LIVE 뉴스특보';

          ctx.save();
          ctx.fillStyle = newsHdrBg;
          ctx.fillRect(0, 0, W, 48);
          const p = 1 + Math.sin(t * 9) * 0.15;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(36, 24, 7 * p, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '900 15px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(newsHdrTitle, 54, 30);
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('전국 잔여물량 긴급배정 현장 // 24시 단독', W - 24, 30);
          ctx.restore();

          // 하단: 방송국 2단 풀와이드 뉴스룸 로어서드
          ctx.save();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, H - 140, W, 52);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(0, H - 140, W, 4);

          // 좌측 기자/카마스터 배지
          ctx.fillStyle = newsHdrBg;
          drawRoundedRect(ctx, 16, H - 132, 130, 36, 6);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`🎤 ${d.name} 특파원`, 81, H - 109);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          drawFittedText(`[단독 현장보도] ${campaign.vehicle} 공식 당월 특판`, 158, H - 108, W - 176, 17);

          // 2단: 적색/골드 롤링 자막 바
          ctx.fillStyle = 'rgba(7, 11, 22, 0.96)';
          ctx.fillRect(0, H - 88, W, 88);
          ctx.fillStyle = newsHdrBg;
          drawRoundedRect(ctx, 16, H - 76, 70, 26, 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('속보', 51, H - 58);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          drawFittedText(narrationLine, 98, H - 58, W - 118, 18);
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`최대 -${campaign.discountNum}만원 특별할인 · 취등록세 0원 무보증 즉시출고`, 98, H - 24);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 모드 3: CYBER_HUD & EV 테크 계열 (AUTONOMOUS_LIDAR, BATTERY_TELEMETRY, TECH_ECO_V2L)
        // --------------------------------------------------------------------
        else if (lMode === 'CYBER_HUD' || lMode === 'AUTONOMOUS_LIDAR' || lMode === 'BATTERY_TELEMETRY' || lMode === 'TECH_ECO_V2L') {
          ctx.save();
          const cs = 26;
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2.5;
          [[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]].forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy + (cy < 100 ? cs : -cs));
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx + (cx < 100 ? cs : -cs), cy);
            ctx.stroke();
          });

          const cyberHdr = lMode === 'AUTONOMOUS_LIDAR' ? 'SYS // AI_AUTOPILOT_LIDAR [ACTIVE]'
                         : lMode === 'BATTERY_TELEMETRY' ? 'SYS // HIGH_VOLTAGE_800V_NCM [SOH 100%]'
                         : lMode === 'TECH_ECO_V2L' ? 'SYS // V2L_220V_OUTDOOR_POWER [ACTIVE]'
                         : 'SYS // CYBER_AI_RADAR [ACTIVE]';

          ctx.fillStyle = 'rgba(4, 9, 21, 0.88)';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, 32, 28, W - 64, 34, 6);
          ctx.fill();
          ctx.stroke();

          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#06b6d4';
          ctx.textAlign = 'left';
          ctx.fillText(cyberHdr, 44, 50);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`SUBSIDY: -${campaign.discountNum}0,000 KRW`, W - 44, 50);

          // 좌측 수직 고도/배터리 래더 미터 (Y: 180 ~ 520)
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 12; i++) {
            const ty = 200 + i * 26;
            const tw = i % 3 === 0 ? 22 : 12;
            const active = (t * 8 + i) % 12 > 4;
            ctx.fillStyle = active ? '#06b6d4' : 'rgba(6, 182, 212, 0.2)';
            ctx.fillRect(28, ty, tw, 3);
          }
          ctx.font = '9px monospace';
          ctx.fillStyle = '#06b6d4';
          ctx.textAlign = 'left';
          ctx.fillText('PWR 98%', 28, 535);

          // 우측 홀로그램 속도계 & RPM 원형 게이지
          const speed = Math.round(112 + Math.sin(t * 3) * 28);
          ctx.save();
          ctx.translate(W - 55, 340);
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 32, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + (speed / 180) * Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(speed, 0, 6);
          ctx.fillStyle = '#06b6d4';
          ctx.font = '8px monospace';
          ctx.fillText('KM/H', 0, 18);
          ctx.restore();

          // 중앙/하단 자막 터미널 (Y: 825 ~ 930)
          ctx.fillStyle = 'rgba(4, 9, 21, 0.92)';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, 24, 825, W - 48, 50, 8);
          ctx.fill();
          ctx.stroke();
          ctx.textAlign = 'center';
          drawKineticWords(narrationLine, W / 2, 856, W - 70, 19, cutLocalT, 0.08, '#38bdf8');

          ctx.fillStyle = 'rgba(4, 9, 21, 0.94)';
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, 24, 885, W - 48, 52, 6);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#06b6d4';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`OPERATOR: ${d.name.toUpperCase()} (${d.branch})`, 40, 908);
          ctx.fillStyle = '#64748b';
          ctx.font = '10px monospace';
          ctx.fillText('UPLINK_STATUS: CONNECTED // LATENCY 12ms', 40, 925);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 모드 4: TIKTOK_VIRAL_SPLIT & TAX_CALCULATOR (인스타 릴스 & 절세 계산기)
        // --------------------------------------------------------------------
        else if (lMode === 'TIKTOK_VIRAL_SPLIT' || lMode === 'TAX_CALCULATOR') {
          // 상단 50% (Y: 0 ~ 475): 1:1 카메라 뷰파인더 & REC 타임코드
          ctx.save();
          const recDot = Math.sin(t * 8) > 0 ? 1 : 0.2;
          ctx.fillStyle = `rgba(239, 68, 68, ${recDot})`;
          ctx.beginPath();
          ctx.arc(36, 42, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '900 13px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.fillText(`REC  [00:0${currentCutSlot + 1}:24]`, 50, 47);
          ctx.textAlign = 'right';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('4K 60FPS · 🔋 89%', W - 32, 47);

          // 뷰파인더 화이트 코너 브래킷
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          const bk = 18;
          [[24, 60, bk, bk], [W - 24, 60, -bk, bk], [24, 460, bk, -bk], [W - 24, 460, -bk, -bk]].forEach(([bx, by, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(bx, by + dy);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + dx, by);
            ctx.stroke();
          });

          // 상단 차량 배정 태그
          ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, 24, 420, W - 48, 38, 19);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          const splitTag = lMode === 'TAX_CALCULATOR' ? `💼 사업자 100% 절세 견적 // ${campaign.vehicle}` : `🚗 공식 신차배정 // ${campaign.vehicle}`;
          drawFittedText(splitTag, W / 2, 444, W - 70, 14);
          ctx.restore();

          // 중앙 분할선 (Y: 475)
          ctx.save();
          ctx.fillStyle = '#fee500';
          ctx.fillRect(0, 472, W, 4);
          ctx.restore();

          // 하단 50% (Y: 476 ~ 960): 숏폼 바이럴 인터랙티브 스테이지
          ctx.save();

          // 카카오톡/상담 상단 헤더 (Y: 476 ~ 534)
          ctx.fillStyle = '#171a23';
          ctx.fillRect(0, 476, W, 58);
          ctx.save();
          ctx.beginPath();
          ctx.arc(44, 505, 18, 0, Math.PI * 2);
          ctx.clip();
          if (d.avatarImg) ctx.drawImage(d.avatarImg, 26, 487, 36, 36);
          else {
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(26, 487, 36, 36);
          }
          ctx.restore();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          drawFittedText(`${d.name} 카마스터 (${d.branch})`, 72, 499, 280, 15);
          ctx.fillStyle = '#22c55e';
          ctx.font = '11px sans-serif';
          ctx.fillText('● 실시간 1:1 견적 상담 중', 72, 518);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#fee500';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('실시간 1:1 다이렉트', W - 20, 509);

          // 화면 하단 바이럴 펀치라인 자막 (키네틱 팝)
          ctx.save();
          ctx.translate(W / 2, 825);
          drawKineticWords(narrationLine, 0, 0, W - 60, 20, cutLocalT, 0.08, '#ffffff');
          ctx.restore();

          // 하단 카카오톡 메시지 입력창 (Y: 865 ~ 925)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, 20, 865, W - 40, 52, 26);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#94a3b8';
          drawFittedText('💬 댓글에 [견적] 남기시면 비밀조건표 즉시 발송...', 42, 896, W - 140, 14);

          // 전송 노란색 원형 버튼
          ctx.fillStyle = '#fee500';
          ctx.beginPath();
          ctx.arc(W - 48, 891, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('➤', W - 48, 896);

          // 스마트폰 홈바
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          drawRoundedRect(ctx, W / 2 - 60, 942, 120, 4, 2);
          ctx.fill();
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 모드 5: RACING_ACTION & 스포츠 계열 (LAUNCH_CONTROL, EXHAUST_POP)
        // --------------------------------------------------------------------
        else if (lMode === 'RACING_ACTION' || lMode === 'LAUNCH_CONTROL' || lMode === 'EXHAUST_POP') {
          // 좌우 적백 레이싱 연석(Kerb) 스트라이프
          ctx.save();
          const kerbW = 12;
          const kerbBlockH = 24;
          for (let y = 0; y < H; y += kerbBlockH) {
            const isRed = (Math.floor(y / kerbBlockH) + Math.floor(t * 12)) % 2 === 0;
            ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
            ctx.fillRect(0, y, kerbW, kerbBlockH);
            ctx.fillRect(W - kerbW, y, kerbW, kerbBlockH);
          }

          const raceRibbon = lMode === 'LAUNCH_CONTROL' ? '🚀 LAUNCH CONTROL // 0-100 3.4s READY'
                           : lMode === 'EXHAUST_POP' ? '🔥 VARIABLE EXHAUST // 112 dB POP & BANG'
                           : `🏁 MOTORSPORTS // LAP 0${currentCutSlot + 1}`;

          ctx.fillStyle = '#0a0a0d';
          ctx.fillRect(kerbW, 20, W - kerbW * 2, 40);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(kerbW, 20, W - kerbW * 2, 40);

          ctx.font = '900 13px sans-serif';
          ctx.fillStyle = '#ef4444';
          ctx.textAlign = 'left';
          ctx.fillText(raceRibbon, kerbW + 16, 45);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('01:23.84 · TOP SPEED', W - kerbW - 16, 45);
          ctx.restore();

          // 중앙/하단 -8도 사선 카본 스트라이프 배너 (Y: 700)
          ctx.save();
          ctx.translate(W / 2, 700);
          ctx.rotate((-8 * Math.PI) / 180);

          // 카본 블랙 사선 배너
          ctx.fillStyle = 'rgba(10, 10, 14, 0.96)';
          ctx.fillRect(-W, -45, W * 2, 90);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-W, -45, W * 2, 5);
          ctx.fillRect(-W, 40, W * 2, 5);

          // 사선 자막 (키네틱)
          drawKineticWords(narrationLine, 0, 8, W - 60, 24, cutLocalT, 0.05, '#ffffff');
          ctx.restore();

          // 우하단 아날로그 타코미터 RPM 게이지
          ctx.save();
          ctx.translate(W - 75, 830);
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, 0, 42, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // 눈금 및 레드존
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 35, Math.PI * 0.7, Math.PI * 2.1);
          ctx.stroke();
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 35, Math.PI * 1.8, Math.PI * 2.1);
          ctx.stroke();

          // 바운싱 바늘 (RPM 5,000 ~ 7,500)
          const revAngle = Math.PI * 0.7 + Math.PI * 1.3 * (0.65 + Math.sin(t * 12) * 0.28);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(revAngle) * 32, Math.sin(revAngle) * 32);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#ef4444';
          ctx.textAlign = 'center';
          ctx.fillText('RPM x1000', 0, 24);
          ctx.restore();

          // 하단 파일럿 라이선스 플레이트 (Y: 865 ~ 930)
          ctx.save();
          ctx.translate(24, 865);
          ctx.fillStyle = 'rgba(15, 15, 20, 0.95)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, 0, 0, W - 145, 65, 10);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ef4444';
          ctx.font = '900 13px sans-serif';
          drawFittedText(`🏁 TEAM HYUNDAI // PILOT ${d.name.toUpperCase()}`, 16, 26, W - 170, 13);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          drawFittedText(`${campaign.discount} · 최고출력 퍼포먼스 패키지`, 16, 48, W - 170, 11);
          ctx.restore();
        }

        // --------------------------------------------------------------------
        // 모드 6: CLASSIC_SHOWROOM & 신뢰 계열 (BLUEHANDS_INSPECT, FAMILY_SAFETY)
        // --------------------------------------------------------------------
        else {
          ctx.save();
          ctx.fillStyle = 'rgba(10, 14, 23, 0.90)';
          ctx.strokeStyle = theme.accent || HYUNDAI_NAVY;
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, 18, H - 214, W - 36, 52, 14);
          ctx.fill();
          ctx.stroke();

          const trustBadge = lMode === 'BLUEHANDS_INSPECT' ? '검수완료'
                           : lMode === 'FAMILY_SAFETY' ? '가족안심'
                           : `CUT ${currentCutSlot + 1}`;

          ctx.fillStyle = theme.badge || '#2563eb';
          drawRoundedRect(ctx, 28, H - 204, 78, 32, 8);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(trustBadge, 67, H - 183);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          drawFittedText(narrationLine, 118, H - 181, W - 148, 18, 12);
          ctx.restore();

          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, H - 152, W, 152);
          ctx.fillStyle = HYUNDAI_NAVY;
          ctx.fillRect(0, H - 152, W, 7);

          ctx.save();
          ctx.beginPath();
          ctx.arc(68, H - 74, 46, 0, Math.PI * 2);
          ctx.clip();
          if (d.avatarImg) ctx.drawImage(d.avatarImg, 22, H - 120, 92, 92);
          else {
            ctx.fillStyle = HYUNDAI_NAVY;
            ctx.fillRect(22, H - 120, 92, 92);
          }
          ctx.restore();

          ctx.strokeStyle = HYUNDAI_NAVY;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(68, H - 74, 46, 0, Math.PI * 2);
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.fillStyle = HYUNDAI_NAVY;
          ctx.font = 'bold 15px sans-serif';
          const showroomHeader = lMode === 'BLUEHANDS_INSPECT' ? '📋 블루핸즈 120개 검수'
                               : lMode === 'FAMILY_SAFETY' ? '🛡️ 패밀리 안심케어 5-STAR'
                               : `🏢 ${d.branch}`;
          ctx.fillText(showroomHeader, 126, H - 108, 194);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 23px sans-serif';
          ctx.fillText(`${d.name} ${d.title}`, 126, H - 72, 194);

          ctx.fillStyle = HYUNDAI_NAVY;
          drawRoundedRect(ctx, 328, H - 128, 194, 66, 12);
          ctx.fill();
          ctx.textAlign = 'center';
          ctx.fillStyle = '#93c5fd';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('1:1 견적상담', 425, H - 104);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('💬 댓글에 [견적]', 425, H - 76, 180);

          ctx.fillStyle = '#f1f5f9';
          drawRoundedRect(ctx, 126, H - 50, 396, 36, 8);
          ctx.fill();
          ctx.textAlign = 'left';
          ctx.fillStyle = '#1e293b';
          if (d.promoTag) drawFittedText(`🎁 ${d.promoTag}`, 138, H - 27, 372, 15, 10);
          ctx.restore();
        }
      } else {
        // ========================================================================
        // ========================================================================
        // Scene 3 (mainDuration ~ TOTAL_DURATION): 6대 장르별 완전히 독립된 독점 엔딩 아키텍처
        // ========================================================================
        const localT = Math.max(0, t - mainDuration);
        const enterP = Easing.backOut(localT / 0.5);
        syncCutVideos(-1, 0); // 명함/엔딩 화면에서는 모든 영상 정지

        // 배경: 마지막 차량 화보를 은은하게 깔고 모드별 맞춤형 오버레이
        if (campaign.uploadedPhotos.length > 0) {
          const lastImg = campaign.uploadedPhotos[campaign.uploadedPhotos.length - 1];
          if (!lastImg._isVideo || lastImg.readyState >= 2) {
            const lw = lastImg.videoWidth || lastImg.naturalWidth || lastImg.width || W;
            const lh = lastImg.videoHeight || lastImg.naturalHeight || lastImg.height || H;
            const lr = Math.max(W / lw, H / lh);
            ctx.drawImage(lastImg, (W - lw * lr) / 2, (H - lh * lr) / 2, lw * lr, lh * lr);
          }
        }

        // lMode hoisted to function root

        // 22대 전용 레이아웃 배경 톤앤매너 분기
        if (lMode === 'EDITORIAL_VOGUE' || lMode === 'BLACK_OBSIDIAN') {
          ctx.fillStyle = 'rgba(7, 8, 12, 0.94)';
        } else if (lMode === 'CANNES_FILM') {
          ctx.fillStyle = 'rgba(12, 10, 8, 0.95)';
        } else if (lMode === 'MONACO_MARINE') {
          ctx.fillStyle = 'rgba(7, 19, 38, 0.94)';
        } else if (lMode === 'VVIP_CONCIERGE') {
          ctx.fillStyle = 'rgba(8, 9, 14, 0.96)';
        } else if (lMode === 'BROADCAST_NEWS') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        } else if (lMode === 'DDAY_COUNTDOWN') {
          ctx.fillStyle = 'rgba(30, 10, 10, 0.94)';
        } else if (lMode === 'CANCEL_STOCK') {
          ctx.fillStyle = 'rgba(25, 8, 8, 0.94)';
        } else if (lMode === 'SECRET_DOSSIER') {
          ctx.fillStyle = 'rgba(18, 16, 15, 0.96)';
        } else if (lMode === 'FLASH_DEAL') {
          ctx.fillStyle = 'rgba(22, 12, 35, 0.95)';
        } else if (lMode === 'AUTONOMOUS_LIDAR') {
          ctx.fillStyle = 'rgba(2, 20, 24, 0.95)';
        } else if (lMode === 'BATTERY_TELEMETRY') {
          ctx.fillStyle = 'rgba(3, 15, 30, 0.95)';
        } else if (lMode === 'TECH_ECO_V2L') {
          ctx.fillStyle = 'rgba(4, 25, 20, 0.95)';
        } else if (lMode === 'CYBER_HUD') {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
        } else if (lMode === 'LAUNCH_CONTROL') {
          ctx.fillStyle = 'rgba(15, 8, 8, 0.95)';
        } else if (lMode === 'EXHAUST_POP') {
          ctx.fillStyle = 'rgba(18, 9, 5, 0.95)';
        } else if (lMode === 'RACING_ACTION') {
          ctx.fillStyle = 'rgba(10, 10, 15, 0.92)';
        } else if (lMode === 'TAX_CALCULATOR') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        } else if (lMode === 'TIKTOK_VIRAL_SPLIT') {
          ctx.fillStyle = 'rgba(15, 16, 24, 0.90)';
        } else if (lMode === 'BLUEHANDS_INSPECT') {
          ctx.fillStyle = 'rgba(0, 32, 70, 0.92)';
        } else if (lMode === 'FAMILY_SAFETY') {
          ctx.fillStyle = 'rgba(15, 30, 50, 0.92)';
        } else {
          ctx.fillStyle = 'rgba(0, 28, 62, 0.88)';
        }
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(enterP, enterP);

        // ====================================================================
        // ★ 엔딩 1: EDITORIAL_VOGUE [시네마틱 럭셔리 & 보그 VIP 프라이빗 살롱 인비테이션]
        // 오닉스 블랙 플라크 + 더블 골드 헤어라인 + 카메오 오벌 초상화 + 골드 인비테이션
        // ====================================================================
        if (lMode === 'EDITORIAL_VOGUE' || lMode === 'CANNES_FILM' || lMode === 'MONACO_MARINE' || lMode === 'BLACK_OBSIDIAN' || lMode === 'VVIP_CONCIERGE') {
          // 오닉스 블랙 바디 + 미세 골드 그라디언트
          const cardW = 500;
          const cardH = 880;
          const cardGrad = ctx.createLinearGradient(0, -cardH / 2, 0, cardH / 2);
          cardGrad.addColorStop(0, '#08090e');
          cardGrad.addColorStop(0.5, '#0d0f17');
          cardGrad.addColorStop(1, '#08090e');
          ctx.fillStyle = cardGrad;
          drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 24);
          ctx.fill();

          // 더블 골드 메탈릭 테두리
          ctx.strokeStyle = theme.accent || '#d4af37';
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 24);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -cardW / 2 + 8, -cardH / 2 + 8, cardW - 16, cardH - 16, 18);
          ctx.stroke();

          // 4모서리 로열 필리그리 악센트
          const fl = 16;
          ctx.strokeStyle = theme.accent || '#d4af37';
          ctx.lineWidth = 1.5;
          [[-cardW / 2 + 18, -cardH / 2 + 18], [cardW / 2 - 18, -cardH / 2 + 18], [-cardW / 2 + 18, cardH / 2 - 18], [cardW / 2 - 18, cardH / 2 - 18]].forEach(([fx, fy]) => {
            ctx.beginPath();
            ctx.arc(fx, fy, 4, 0, Math.PI * 2);
            ctx.stroke();
          });

          // 상단 로열 모노그램 헤더
          ctx.fillStyle = theme.accent || '#d4af37';
          ctx.font = '700 13px serif';
          ctx.textAlign = 'center';
          ctx.fillText('◆ VOGUE MOTORS COUTURE · PRIVATE CONCIERGE ◆', 0, -cardH / 2 + 42);

          ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-160, -cardH / 2 + 56);
          ctx.lineTo(160, -cardH / 2 + 56);
          ctx.stroke();

          // 카마스터 프로필: 우아한 오벌 카메오 포트레이트 (중심 y = -260, 반경 64)
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, -260, 64, 0, Math.PI * 2);
          ctx.clip();
          if (d.avatarImg) ctx.drawImage(d.avatarImg, -64, -324, 128, 128);
          else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-64, -324, 128, 128);
          }
          ctx.restore();

          // 골드 리프 프레임 링
          ctx.strokeStyle = theme.accent || '#d4af37';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, -260, 64, 0, Math.PI * 2);
          ctx.stroke();

          // VIP 프라이빗 마스터 골드 캡슐 (원형 아래 22px 여백 분리 -> 겹침 원천 차단!)
          // 원형 하단 y = -196 -> 캡슐 시작 y = -174
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#08090f';
          drawRoundedRect(ctx, -110, -174, 220, 28, 14);
          ctx.fill();
          ctx.restore();

          ctx.strokeStyle = theme.accent || '#d4af37';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -110, -174, 220, 28, 14);
          ctx.stroke();

          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fef3c7';
          ctx.font = 'bold 11px serif';
          const cineBadge = lMode === 'CANNES_FILM' ? '★ CANNES FILM HONORS PASS ★'
                          : lMode === 'MONACO_MARINE' ? '★ MONACO YACHT MASTER ★'
                          : lMode === 'BLACK_OBSIDIAN' ? '★ OBSIDIAN BESPOKE MASTER ★'
                          : lMode === 'VVIP_CONCIERGE' ? '★ VVIP PRESIDENTIAL CONCIERGE ★'
                          : '★ VIP PRIVATE CLIENT MASTER ★';
          drawFittedText(cineBadge, 0, -160, 200, 11, 9, 'serif');
          ctx.restore();

          // 소속 지점 & 카마스터 성함 (우아한 클래식 세리프)
          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px serif';
          ctx.fillText(`${d.branch} · VIP 컨시어지`, 0, -118);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px serif';
          ctx.fillText(`${d.name} ${d.title}`, 0, -78);

          // 프라이빗 살롱 인비테이션 플라크 (y: -45 ~ 175)
          ctx.fillStyle = 'rgba(212, 175, 55, 0.06)';
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -220, -45, 440, 220, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fef3c7';
          ctx.textAlign = 'center';
          ctx.font = 'italic 16px serif';
          const cineQuote = lMode === 'CANNES_FILM' ? '❝ 한 편의 영화처럼 완성되는 최상의 시네마틱 인도 ❞'
                          : lMode === 'MONACO_MARINE' ? '❝ 모나코 마린의 여유를 담은 프라이빗 요트 멤버십 ❞'
                          : lMode === 'BLACK_OBSIDIAN' ? '❝ 압도적인 올블랙 카리스마, 스텔스 럭셔리의 정점 ❞'
                          : lMode === 'VVIP_CONCIERGE' ? '❝ 최고를 위한 VVIP 쇼퍼드리븐 1:1 의전 케어 ❞'
                          : '❝ 단 한 분만을 위한 비공개 프라이빗 컨시어지 ❞';
          ctx.fillText(cineQuote, 0, -15);

          // 시크릿 조건 발송 액션 박스
          ctx.fillStyle = 'rgba(212, 175, 55, 0.16)';
          ctx.strokeStyle = theme.accent || '#d4af37';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -200, 12, 400, 76, 12);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 16px sans-serif';
          drawFittedText('💬 댓글에 [견적] 남겨주시면 시크릿 조건 발송!', 0, 38, 370, 16, 11);
          ctx.fillStyle = '#e2e8f0';
          drawFittedText('→ 1:1 비공개 특별 금융 프로모션을 DM으로 즉시 전송', 0, 66, 370, 13, 9);

          // VVIP 딜리버리 기프트
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -200, 102, 400, 56, 10);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = theme.accent || '#d4af37';
          if (d.promoTag) { drawFittedText('🎁 VVIP 딜리버리 기프트 패키지', 0, 124, 370, 13, 10);
          ctx.fillStyle = '#cbd5e1';
          drawFittedText(d.promoTag, 0, 144, 370, 12, 9); }

          // 하단 골드 QR & 모노그램 인증
          ctx.fillStyle = '#080a10';
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -220, 192, 440, 218, 16);
          ctx.fill();
          ctx.stroke();

          drawDeterministicQrCode(ctx, -200, 210, 106, d.token);
          ctx.textAlign = 'left';
          ctx.fillStyle = '#fef3c7';
          drawFittedText('VVIP 프라이빗 1:1 즉시 출고 배정', -80, 240, 280, 15, 11, 'serif');
          ctx.fillStyle = '#94a3b8';
          drawFittedText('• 럭셔리 금융 리스 · 장기렌트 맞춤 설계', -80, 268, 280, 13, 9, 'serif');
          ctx.fillStyle = '#94a3b8';
          drawFittedText('• 공식 VIP 전담 딜리버리 세레머니', -80, 296, 280, 13, 9, 'serif');
          ctx.fillStyle = theme.accent || '#d4af37';
          drawFittedText(`• 인스타그램 @${d.snsAccounts?.ig || d.igUsername}`, -80, 324, 280, 13, 9, 'serif');
          ctx.fillStyle = '#d4af37';
          ctx.font = 'italic 11px serif';
          ctx.fillText('NO. VIP-2026-EXCLUSIVE · AUTHENTICATED', -80, 368);
        }

        // ====================================================================
        // ★ 엔딩 2: BROADCAST_NEWS [24시 방송국 공식 프레스 기자증 & 현장 속보 팩트시트]
        // 화이트/네이비 프레스 보드 + 적색 LIVE 바 + 가로형 기자증 + 팩트체크 보증
        // ====================================================================
        else if (lMode === 'BROADCAST_NEWS') {
          const cardW = 504;
          const cardH = 880;

          // 프레스 보드 본체
          ctx.fillStyle = '#ffffff';
          drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 20);
          ctx.fill();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // 상단 강렬한 레드 속보 헤더 바 (Y: -cardH/2 ~ -cardH/2 + 82)
          ctx.save();
          drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, 82, 20);
          ctx.clip();
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-cardW / 2, -cardH / 2, cardW, 82);
          ctx.restore();

          const pulse = 1 + Math.sin(t * 8) * 0.15;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-170, -cardH / 2 + 40, 7 * pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '900 17px sans-serif';
          ctx.textAlign = 'left';
          const newsCardBar = lMode === 'DDAY_COUNTDOWN' ? '⏱ D-DAY 타임어택 // 선착순 긴급 배정'
                            : lMode === 'CANCEL_STOCK' ? '🔥 법인 취소차량 // 당일 긴급 배정 데스크'
                            : lMode === 'SECRET_DOSSIER' ? '🔒 [TOP SECRET] // 1급 기밀 비공개 쿼터'
                            : lMode === 'FLASH_DEAL' ? '⚡ 24H FLASH SALE // 게릴라 특판 바우처'
                            : 'LIVE 24시 보도국 // 긴급배정 현장취재 완료';
          ctx.fillText(newsCardBar, -152, -cardH / 2 + 46);
          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#fecaca';
          ctx.fillText('OFFICIAL PRESS IDENTIFICATION // 팩트체크 검증', -152, -cardH / 2 + 66);

          // 상단 가로형 기자증 패스 (Y: -330 ~ -150)
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -230, -335, 460, 180, 14);
          ctx.fill();
          ctx.stroke();

          // 좌측 사각 기자 사진 (랜야드 스트랩 그래픽 적용)
          ctx.save();
          drawRoundedRect(ctx, -210, -315, 120, 140, 10);
          ctx.clip();
          if (d.avatarImg) ctx.drawImage(d.avatarImg, -210, -315, 120, 140);
          else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-210, -315, 120, 140);
          }
          ctx.restore();

          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2.5;
          drawRoundedRect(ctx, -210, -315, 120, 140, 10);
          ctx.stroke();

          // 기자증 우측 정보
          ctx.fillStyle = '#dc2626';
          drawRoundedRect(ctx, -70, -315, 120, 26, 6);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('● 취재전문기자', -10, -298);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#475569';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`현장 보도국 · ${d.branch}`, -70, -262);

          ctx.fillStyle = '#0f172a';
          ctx.font = '900 32px sans-serif';
          ctx.fillText(`${d.name} 전문기자`, -70, -222);

          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`PRESS ID: #NEWS-2026 // FACT-CHECKED`, -70, -188);

          // 중앙 긴급 속보 팩트시트 (Y: -135 ~ 145)
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, -230, -135, 460, 75, 12);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          drawFittedText('🚨 [긴급속보] 현대·기아 2026 신차 취소분 긴급 확보', 0, -92, 430, 18, 12);

          // 댓글 제보 액션 박스
          ctx.fillStyle = '#fef08a';
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2.5;
          drawRoundedRect(ctx, -230, -45, 460, 100, 14);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#991b1b';
          ctx.font = '900 18px sans-serif';
          drawFittedText('💬 방송 댓글에 [견적] 제보 시 실시간 견적서 송출!', 0, -15, 430, 18, 12);
          ctx.fillStyle = '#0f172a';
          drawFittedText('→ 전산망 직통 비공개 최저금리 데이터셋을 1:1 즉시 전송', 0, 15, 430, 14, 10);
          ctx.fillStyle = '#7c2d12';
          drawFittedText('→ 선착순 취소차량 즉시배정 가동 · 당일 계약 연결', 0, 38, 430, 12, 9);

          // 취재 특별 패키지
          ctx.fillStyle = '#f1f5f9';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -230, 70, 460, 75, 10);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#dc2626';
          if (d.promoTag) { drawFittedText('🎁 취재팀 단독 보도 출고 패키지', 0, 98, 430, 14, 11);
          ctx.fillStyle = '#1e293b';
          drawFittedText(d.promoTag, 0, 124, 430, 13, 9); }

          // 하단 프레스 QR 코드 & 팩트체크 보증
          ctx.fillStyle = '#0f172a';
          drawRoundedRect(ctx, -230, 165, 460, 250, 14);
          ctx.fill();

          drawDeterministicQrCode(ctx, -210, 195, 115, d.token);
          ctx.textAlign = 'left';
          ctx.fillStyle = '#38bdf8';
          drawFittedText('[FACT-CHECKED 100% 무사고 즉시출고]', -70, 230, 280, 15, 11);
          ctx.fillStyle = '#cbd5e1';
          drawFittedText('• 허위견적 0% · 제조사 공식 전산망 직통', -70, 262, 280, 13, 9);
          ctx.fillStyle = '#cbd5e1';
          drawFittedText('• 타사 견적서 비교 검증 시 추가 혜택 지원', -70, 292, 280, 13, 9);
          ctx.fillStyle = '#f87171';
          drawFittedText(`• 현장 취재 채널 @${d.snsAccounts?.ig || d.igUsername}`, -70, 322, 280, 13, 9);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '11px monospace';
          ctx.fillText('KOREA AUTOMOTIVE PRESS DESK · VERIFIED', -70, 370);
        }

        // ====================================================================
        // ★ 엔딩 3: CYBER_HUD [초미래형 사이버펑크 콕핏 터미널 억세스 덱]
        // 딥 사이버 본체 + 4코너 네온 브래킷 + 바이오메트릭 스캔 + 터미널 커맨드라인
        // ====================================================================
        else if (lMode === 'CYBER_HUD') {
          const cardW = 504;
          const cardH = 880;

          // 초심해 다크 사이버 플레이트 본체
          ctx.fillStyle = '#020617';
          drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 16);
          ctx.fill();
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // 4모서리 네온 코너 브래킷
          const cs = 32;
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3.5;
          [[-cardW / 2 + 12, -cardH / 2 + 12, 1, 1], [cardW / 2 - 12, -cardH / 2 + 12, -1, 1], [-cardW / 2 + 12, cardH / 2 - 12, 1, -1], [cardW / 2 - 12, cardH / 2 - 12, -1, -1]].forEach(([bx, by, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(bx, by + dy * cs);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + dx * cs, by);
            ctx.stroke();
          });

          // 상단 디지털 HUD 바
          ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -cardW / 2 + 16, -cardH / 2 + 18, cardW - 32, 60, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#22d3ee';
          ctx.font = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`[ TERMINAL 07 // AUTOREELSMAKER SECURE UPLINK AUTHORIZED ]`, 0, -cardH / 2 + 42);
          ctx.fillStyle = '#67e8f9';
          ctx.font = '11px monospace';
          ctx.fillText('QUANTUM ENCRYPTION: ACTIVE // NODE: SEOUL-CENTRAL', 0, -cardH / 2 + 62);

          // 상단 스플릿 디스플레이 (Y: -350 ~ -160)
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -230, -350, 460, 190, 12);
          ctx.fill();
          ctx.stroke();

          // 좌측 바이오메트릭 스캔
          ctx.save();
          drawRoundedRect(ctx, -210, -335, 130, 155, 8);
          ctx.clip();
          if (d.avatarImg) ctx.drawImage(d.avatarImg, -210, -335, 130, 155);
          else {
            ctx.fillStyle = '#082f49';
            ctx.fillRect(-210, -335, 130, 155);
          }
          ctx.restore();

          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, -210, -335, 130, 155, 8);
          ctx.stroke();

          // 십자 조준선
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-215, -257); ctx.lineTo(-200, -257);
          ctx.moveTo(-90, -257); ctx.lineTo(-75, -257);
          ctx.stroke();

          ctx.fillStyle = '#020617';
          drawRoundedRect(ctx, -205, -200, 120, 20, 4);
          ctx.fill();
          ctx.fillStyle = '#4ade80';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('STATUS: 100% VERIFIED', -145, -186);

          // 우측 오퍼레이터 제원
          ctx.textAlign = 'left';
          ctx.fillStyle = '#38bdf8';
          ctx.font = '13px monospace';
          ctx.fillText(`OPERATOR ID: #AR-${d.token || '2026'}`, -60, -310);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px monospace';
          ctx.fillText(`${d.name} MASTER`, -60, -272);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '13px monospace';
          const cyberUnit = lMode === 'AUTONOMOUS_LIDAR' ? 'AUTOPILOT: AI LIDAR 360° [ACTIVE]'
                          : lMode === 'BATTERY_TELEMETRY' ? 'HIGH_VOLTAGE: 800V NCM [SOH 100%]'
                          : lMode === 'TECH_ECO_V2L' ? '220V_V2L_OUTDOOR: READY'
                          : `UNIT: ${d.branch}`;
          ctx.fillText(cyberUnit, -60, -240);

          ctx.fillStyle = '#22d3ee';
          ctx.font = '12px monospace';
          ctx.fillText(`BATTERY: 800V ULTRA-FAST (98%)`, -60, -212);

          ctx.fillStyle = '#4ade80';
          ctx.font = '12px monospace';
          ctx.fillText(`TELEMETRY STATUS: ONLINE (12ms)`, -60, -184);

          // 중앙 커맨드 콘솔 (Y: -140 ~ 140)
          ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -230, -140, 460, 280, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#67e8f9';
          ctx.font = 'bold 15px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('> DIRECT_ACCESS: 1:1 SECURE UPLINK', 0, -108);

          // 커맨드 입력 박스
          ctx.fillStyle = 'rgba(34, 211, 238, 0.18)';
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, -210, -84, 420, 100, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#a5f3fc';
          const cyberCmdText = lMode === 'AUTONOMOUS_LIDAR' ? '[ AUTOPILOT ] 댓글 [견적] 시 라이다 데이터 발송'
                             : lMode === 'BATTERY_TELEMETRY' ? '[ BATTERY ] 댓글 [견적] 시 배터리 SOH 원장 발송'
                             : lMode === 'TECH_ECO_V2L' ? '[ V2L ECO ] 댓글 [견적] 시 220V 캠핑팩 조건 발송'
                             : '[ TELEMETRY ] 댓글 [견적] 입력 시 자동 발송';
          drawFittedText(cyberCmdText, 0, -56, 350, 15, 10, 'monospace');
          ctx.fillStyle = '#cbd5e1';
          drawFittedText('→ 비공개 최저금리 데이터셋을 실시간 복호화하여 1:1 전송', 0, -28, 350, 12, 9, 'monospace');
          ctx.fillStyle = '#38bdf8';
          drawFittedText('→ 지능형 금융 알고리즘 0원 승인 프로토콜 즉시 가동', 0, -4, 350, 12, 9, 'monospace');

          // 시스템 기어 패키지
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -210, 36, 420, 84, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          if (d.promoTag) { drawFittedText('⚡ SPECIAL SYSTEM GEAR BUNDLE', 0, 64, 390, 13, 10, 'monospace');
          ctx.fillStyle = '#e2e8f0';
          drawFittedText(d.promoTag, 0, 92, 390, 12, 9, 'monospace'); }

          // 하단 사이버 매트릭스 QR & 업링크
          ctx.fillStyle = '#020617';
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -230, 160, 460, 255, 12);
          ctx.fill();
          ctx.stroke();

          drawDeterministicQrCode(ctx, -210, 190, 115, d.token);
          ctx.textAlign = 'left';
          ctx.fillStyle = '#38bdf8';
          drawFittedText('SECURE DIRECT UPLINK PORT', -70, 228, 280, 15, 11, 'monospace');
          ctx.fillStyle = '#94a3b8';
          drawFittedText('• 지능형 금융 알고리즘 0원 승인 최적화', -70, 260, 280, 13, 9, 'monospace');
          ctx.fillStyle = '#94a3b8';
          drawFittedText('• 전국 잔여 쿼터 즉시 락온 시스템 가동', -70, 290, 280, 13, 9, 'monospace');
          ctx.fillStyle = '#22d3ee';
          drawFittedText(`• UPLINK ID @${d.snsAccounts?.ig || d.igUsername}`, -70, 320, 280, 13, 9, 'monospace');
          ctx.fillStyle = '#475569';
          ctx.font = '10px monospace';
          ctx.fillText('SYSTEM CORE INTEGRATED // TERMINAL ONLINE', -70, 368);
        }

        // ====================================================================
        // ★ 엔딩 4: RACING_ACTION [모터스포츠 카본 패독 패스 & 피트레인 라이선스]
        // 레드 랜야드 스트랩 목걸이 + 카본 바디 + 드라이버 프로필 + 텔레메트리 3단 그리드
        // ====================================================================
        else if (lMode === 'RACING_ACTION') {
          const cardW = 504;
          const cardH = 860;

          // 상단 패독 패스 레드 랜야드 목걸이 그래픽
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-80, -cardH / 2 - 20, 160, 35);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-40, -cardH / 2 + 5, 80, 15);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('OFFICIAL FIA / PADDOCK PASS', 0, -cardH / 2);

          // 카본 블랙 레이싱 패스 본체
          ctx.fillStyle = '#0a0b12';
          drawRoundedRect(ctx, -cardW / 2, -cardH / 2 + 15, cardW, cardH - 15, 20);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // 상단 레이싱 헤더
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-cardW / 2 + 15, -cardH / 2 + 30, cardW - 30, 48);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🏁 2026 AUTOREELSMAKER RACING // PADDOCK PASS', 0, -cardH / 2 + 60);

          // 드라이버 프로필 영역 (Y: -330 ~ -160)
          ctx.fillStyle = 'rgba(20, 20, 28, 0.9)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -230, -330, 460, 165, 12);
          ctx.fill();
          ctx.stroke();

          // 좌측 파일럿 사진
          ctx.save();
          drawRoundedRect(ctx, -210, -315, 120, 135, 10);
          ctx.clip();
          if (d.avatarImg) ctx.drawImage(d.avatarImg, -210, -315, 120, 135);
          else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-210, -315, 120, 135);
          }
          ctx.restore();

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          drawRoundedRect(ctx, -210, -315, 120, 135, 10);
          ctx.stroke();

          // 우측 파일럿 제원
          ctx.fillStyle = '#ef4444';
          drawRoundedRect(ctx, -70, -315, 140, 24, 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🏎️ CHIEF TEST PILOT', 0, -299);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`TEAM HYUNDAI N · ${d.branch}`, -70, -264);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 32px sans-serif';
          ctx.fillText(`PILOT ${d.name.toUpperCase()}`, -70, -225);

          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`PERFORMANCE SPECIALIST // GT`, -70, -192);

          // 중앙 텔레메트리 3단 그리드 (Y: -145 ~ 140)
          // 3박스 데이터 대시보드
          const bW = 145;
          const bH = 75;
          const boxes = [
            { l: '0-100 KM/H', v: '3.4s', c: '#ef4444' },
            { l: 'MAX POWER', v: '650 PS', c: '#ffffff' },
            { l: 'MONTHLY', v: '초특가 배정', c: '#fbbf24' }
          ];
          boxes.forEach((b, bi) => {
            const bx = -230 + bi * (bW + 12);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, bx, -145, bW, bH, 8);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.fillText(b.l, bx + bW / 2, -125);
            ctx.fillStyle = b.c;
            ctx.font = '900 18px sans-serif';
            ctx.fillText(b.v, bx + bW / 2, -95);
          });

          // 피트레인 액션 배너
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, -230, -55, 460, 105, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fca5a5';
          ctx.textAlign = 'center';
          const raceCallout = lMode === 'LAUNCH_CONTROL' ? '🚀 댓글에 [견적] 남기면 제로백 런치컨트롤 특판 회신!'
                            : lMode === 'EXHAUST_POP' ? '🔥 댓글에 [견적] 남기면 가변배기 퍼포먼스 특판 회신!'
                            : '🏁 댓글에 [견적] 남기면 피트레인 특판 즉시 회신!';
          drawFittedText(raceCallout, 0, -24, 410, 16, 12);
          ctx.fillStyle = '#ffffff';
          drawFittedText('→ 비공개 최저금리 서킷 데이터셋을 DM으로 즉시 전송', 0, 4, 430, 13, 9);
          ctx.fillStyle = '#cbd5e1';
          drawFittedText('→ N/GT 고성능 전담 출고 검수 및 특별 금융 승인 연계', 0, 28, 430, 12, 9);

          // 레이싱 기어 패키지
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -230, 65, 460, 65, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          if (d.promoTag) { drawFittedText('🎁 SCUDERIA PERFORMANCE GEAR', 0, 88, 430, 13, 10);
          ctx.fillStyle = '#ffffff';
          drawFittedText(d.promoTag, 0, 112, 430, 12, 9); }

          // 하단 서킷 QR 패스
          ctx.fillStyle = '#08090f';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -230, 150, 460, 255, 12);
          ctx.fill();
          ctx.stroke();

          drawDeterministicQrCode(ctx, -210, 180, 115, d.token);
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ef4444';
          drawFittedText('PADDOCK TELEMETRY VERIFIED', -70, 218, 280, 15, 11);
          ctx.fillStyle = '#cbd5e1';
          drawFittedText('• 서킷 랩타임 기반 최고 퍼포먼스 세팅', -70, 250, 280, 13, 9);
          ctx.fillStyle = '#cbd5e1';
          drawFittedText('• N/GT 고성능 전담 출고 서비스 연계', -70, 280, 280, 13, 9);
          ctx.fillStyle = '#f87171';
          drawFittedText(`• PILOT SNS @${d.snsAccounts?.ig || d.igUsername}`, -70, 310, 280, 13, 9);
          ctx.fillStyle = '#64748b';
          ctx.font = '10px monospace';
          ctx.fillText('SCUDERIA AUTOREELSMAKER RACING DIVISION', -70, 358);
        }

        // ====================================================================
        // ★ 엔딩 5: TIKTOK_VIRAL_SPLIT [100% 리얼 인스타그램 프로필 & 1:1 DM 채팅 화면]
        // 스마트폰 다크모드 + 프로필 지표 + 인스타 그라데이션 스토리 링 + 실제 DM 말풍선 대화
        // ====================================================================
        else if (lMode === 'TIKTOK_VIRAL_SPLIT') {
          const cardW = 504;
          const cardH = 880;

          // 인스타 다크모드 본체
          ctx.fillStyle = '#0f1017';
          drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 28);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // 인스타 상단 바 (Y: -cardH/2 ~ -cardH/2 + 55)
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`<  @${d.snsAccounts?.ig || d.igUsername || 'dealer_autoreels'}`, -cardW / 2 + 25, -cardH / 2 + 38);

          // 블루 인증 마크
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(cardW / 2 - 140, -cardH / 2 + 33, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✓', cardW / 2 - 140, -cardH / 2 + 37);

          ctx.fillStyle = '#ffffff';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('🔔  ⋯', cardW / 2 - 25, -cardH / 2 + 38);

          // 상단 프로필 열 (Y: -370 ~ -290)
          // 좌측 아바타 + 무지개 스토리 링
          const avX = -165;
          const avY = -325;
          const avR = 44;

          const ringGrad = ctx.createLinearGradient(avX - avR, avY - avR, avX + avR, avY + avR);
          ringGrad.addColorStop(0, '#f59e0b');
          ringGrad.addColorStop(0.5, '#ec4899');
          ringGrad.addColorStop(1, '#8b5cf6');
          ctx.strokeStyle = ringGrad;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(avX, avY, avR + 4, 0, Math.PI * 2);
          ctx.stroke();

          ctx.save();
          ctx.beginPath();
          ctx.arc(avX, avY, avR, 0, Math.PI * 2);
          ctx.clip();
          if (d.avatarImg) ctx.drawImage(d.avatarImg, avX - avR, avY - avR, avR * 2, avR * 2);
          else {
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(avX - avR, avY - avR, avR * 2, avR * 2);
          }
          ctx.restore();

          // 우측 프로필 지표 (게시물, 팔로워, 팔로잉)
          const stats = [
            { num: '158', label: '게시물', x: -45 },
            { num: '2.4만', label: '팔로워', x: 45 },
            { num: '412', label: '팔로잉', x: 135 }
          ];
          stats.forEach(st => {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText(st.num, st.x, avY - 8);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px sans-serif';
            ctx.fillText(st.label, st.x, avY + 16);
          });

          // 프로필 바이오 소개글 (Y: -260 ~ -190)
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`🚘 현대·기아 1금융권 공식 제휴 카마스터 ${d.name} (${d.branch})`, -225, -250);
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '12px sans-serif';
          ctx.fillText('✨ 취등록세 0원 · 무보증 승인 전문 · 10만뷰 카마스터 크리에이터', -225, -230);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('⚡ 실시간 비공개 특판 조건표 1:1 다이렉트 전송 중', -225, -210);

          // 인스타 버튼 3개 (메시지 보내기, 프로필 공유, 연락처)
          ctx.fillStyle = '#2563eb';
          drawRoundedRect(ctx, -225, -185, 140, 38, 8);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('메시지 보내기', -155, -161);

          ctx.fillStyle = '#1e2230';
          drawRoundedRect(ctx, -75, -185, 140, 38, 8);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillText('프로필 공유', -5, -161);

          ctx.fillStyle = '#1e2230';
          drawRoundedRect(ctx, 75, -185, 150, 38, 8);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillText('📞 안심연락처', 150, -161);

          // 분할선
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-230, -135); ctx.lineTo(230, -135);
          ctx.stroke();

          // 하단 1:1 Direct Message (DM) 채팅창 영역 (Y: -125 ~ 415)
          ctx.fillStyle = '#94a3b8';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💬 1:1 DIRECT MESSAGE (실시간 상담)', 0, -115);

          // 고객 수신 말풍선 (좌측 그레이)
          ctx.fillStyle = '#1f2430';
          drawRoundedRect(ctx, -225, -95, 330, 56, 16);
          ctx.fill();
          ctx.fillStyle = '#f1f5f9';
          ctx.textAlign = 'left';
          ctx.font = '13px sans-serif';
          ctx.fillText('카마스터님! 릴스 영상 봤어요. 견적 얼마인가요?', -208, -63);
          ctx.fillStyle = '#64748b';
          ctx.font = '10px sans-serif';
          ctx.fillText('오후 2:15', 55, -50);

          // 카마스터 송신 말풍선 (우측 인스타 그라데이션)
          const dmGrad = ctx.createLinearGradient(-60, -25, 225, 55);
          dmGrad.addColorStop(0, '#ec4899');
          dmGrad.addColorStop(1, '#8b5cf6');
          ctx.fillStyle = dmGrad;
          drawRoundedRect(ctx, -65, -25, 290, 72, 16);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          const viralChatMsg = lMode === 'TAX_CALCULATOR' ? '안녕하세요 대표님! 댓글에 [견적] 남겨주시면'
                               : '안녕하세요! 댓글에 [견적] 남겨주시면';
          ctx.fillText(viralChatMsg, -48, 2);
          ctx.font = 'bold 13px sans-serif';
          const viralChatSub = lMode === 'TAX_CALCULATOR' ? '사업자 전액 비용처리 절세 리포트 바로 전송! 📑'
                               : '비공개 최저금리 조건표 바로 쏴드립니다! ⚡';
          ctx.fillText(viralChatSub, -48, 26);

          // 특별 혜택 안내 말풍선 (우측)
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -65, 58, 290, 52, 14);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f472b6';
          if (d.promoTag) drawFittedText(`🎁 특별혜택: ${d.promoTag}`, 80, 89, 260, 12, 9);

          // 하단 인스타 메시지 입력창
          ctx.fillStyle = '#1a1d28';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -225, 125, 450, 52, 26);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#64748b';
          ctx.font = '14px sans-serif';
          ctx.fillText('💬 메시지 보내기...', -200, 156);
          ctx.textAlign = 'right';
          ctx.fillText('❤️ 🎙️ 🖼️', 205, 156);

          // 스토리 하이라이트 QR 스티커 카드
          ctx.fillStyle = '#131622';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -225, 195, 450, 215, 14);
          ctx.fill();
          ctx.stroke();

          drawDeterministicQrCode(ctx, -205, 215, 105, d.token);
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ec4899';
          drawFittedText('⚡ DM 자동응답 시스템 가동 중', -80, 250, 285, 14, 11);
          ctx.fillStyle = '#e2e8f0';
          drawFittedText('• 댓글에 [견적] 작성 시 3초 만에 자동 전송', -80, 280, 285, 12, 9);
          ctx.fillStyle = '#94a3b8';
          drawFittedText('• 1:1 비밀 할인 조건표 실시간 즉시 매칭', -80, 310, 285, 12, 9);
          ctx.fillStyle = '#38bdf8';
          drawFittedText(`• 인스타그램 @${d.snsAccounts?.ig || d.igUsername}`, -80, 340, 285, 12, 9);
          ctx.fillStyle = '#64748b';
          ctx.font = '11px sans-serif';
          ctx.fillText('AUTOREELSMAKER CREATOR PARTNER NETWORK', -80, 385);
        }

        // ====================================================================
        // ★ 엔딩 6: CLASSIC_SHOWROOM [현대·기아 공식 인증 출고 마스터 보증서 & 명함]
        // 공식 딥네이비 헤더 + 대형 원형 프로필 + 우수 마스터 인증 캡슐 + 3대 품질 보증
        // ====================================================================
        else {
          const cardW = 504;
          const cardH = 880;

          // 공식 카마스터 화이트 명함 보증서 본체
          ctx.fillStyle = '#ffffff';
          drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 20);
          ctx.fill();
          ctx.strokeStyle = theme.primary || HYUNDAI_NAVY;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // 명함 상단 현대 딥네이비 헤더
          ctx.save();
          drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, 90, 20);
          ctx.clip();
          ctx.fillStyle = theme.primary || HYUNDAI_NAVY;
          ctx.fillRect(-cardW / 2, -cardH / 2, cardW, 90);
          ctx.restore();

          ctx.fillStyle = '#93c5fd';
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('HYUNDAI · KIA MOTORS OFFICIAL CAR MASTER', 0, -cardH / 2 + 42);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px sans-serif';
          const trustCertHeader = lMode === 'BLUEHANDS_INSPECT' ? '★ 블루핸즈 120가지 정밀 사전검수 보증서 ★'
                                : lMode === 'FAMILY_SAFETY' ? '★ 우리 가족 안심 패밀리카 5-STAR 세이프티 보증서 ★'
                                : '★ 공식 인증 카마스터 품질 보증서 ★';
          ctx.fillText(trustCertHeader, 0, -cardH / 2 + 66);

          // 카마스터 대형 실사 얼굴 프로필 사진 (중심 y = -260, 반경 64)
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, -260, 64, 0, Math.PI * 2);
          ctx.clip();
          if (d.avatarImg) ctx.drawImage(d.avatarImg, -64, -324, 128, 128);
          else {
            ctx.fillStyle = theme.primary || HYUNDAI_NAVY;
            ctx.fillRect(-64, -324, 128, 128);
          }
          ctx.restore();

          // 화이트 & 네이비 이중 링
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, -260, 64, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = theme.primary || HYUNDAI_NAVY;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, -260, 67, 0, Math.PI * 2);
          ctx.stroke();

          // 우수 카마스터 인증 캡슐 배지 (원형 아래 22px 분리 배치 -> 겹침 원천 차단!)
          // 원형 하단 y = -196 -> 캡슐 시작 y = -174
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = theme.primary || HYUNDAI_NAVY;
          drawRoundedRect(ctx, -120, -174, 240, 28, 14);
          ctx.fill();
          ctx.restore();

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -120, -174, 240, 28, 14);
          ctx.stroke();

          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fef3c7';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('★ 제조사 공식 인증 최우수 마스터 ★', 0, -160);
          ctx.restore();

          // 소속 지점 & 카마스터 성함
          ctx.fillStyle = theme.primary || HYUNDAI_NAVY;
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(`🏢 ${d.branch} · 공식 전시장`, 0, -118);

          ctx.fillStyle = '#0f172a';
          ctx.font = '900 38px sans-serif';
          ctx.fillText(`${d.name} ${d.title}`, 0, -78);

          // 3대 공식 신뢰 보증 카드 (Y: -50 ~ 145)
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -225, -50, 450, 195, 14);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#1e293b';
          drawFittedText('✓ 본사 직영 정식 출고 및 5년 10만km 보증 연계', -200, -20, 400, 13, 10);
          drawFittedText('✓ 제1금융권 최저금리 0원 승인 다이렉트 보증', -200, 12, 400, 13, 10);
          drawFittedText('✓ 계약부터 사후관리까지 1:1 평생 전담 케어', -200, 44, 400, 13, 10);

          // 출고 패키지 안내
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, -205, 74, 410, 54, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = theme.primary || HYUNDAI_NAVY;
          if (d.promoTag) { drawFittedText('🎁 공식 전시장 출고 고객 특별 패키지', 0, 96, 390, 13, 10);
          ctx.fillStyle = '#334155';
          drawFittedText(d.promoTag, 0, 116, 390, 12, 9); }

          // 하단 공식 QR 코드 + 상담 안내
          ctx.fillStyle = theme.primary || HYUNDAI_NAVY;
          drawRoundedRect(ctx, -225, 165, 450, 250, 14);
          ctx.fill();

          drawDeterministicQrCode(ctx, -205, 195, 115, d.token);
          ctx.textAlign = 'left';
          ctx.fillStyle = '#93c5fd';
          drawFittedText('전 차종 즉시출고 · 최저금리 비교', -70, 230, 280, 15, 11);
          ctx.fillStyle = '#ffffff';
          drawFittedText('• 할부 / 리스 / 장기렌트 맞춤 설계', -70, 262, 280, 13, 9);
          ctx.fillStyle = '#ffffff';
          drawFittedText('• 1:1 방문 상담 및 전국 안심 탁송 출고', -70, 292, 280, 13, 9);
          ctx.fillStyle = '#38bdf8';
          drawFittedText(`• 인스타그램 @${d.snsAccounts?.ig || d.igUsername}`, -70, 322, 280, 13, 9);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('💬 공식 상담: 댓글에 [견적]을 남겨주세요', -70, 370);
        }

        ctx.restore();
      }


      // ========================================================================
      // 🦀 Rust WebAssembly (Wasm) DRM & 전화번호 도용(계정 돌려쓰기) 방지 캔버스 워터마크
      // ========================================================================
      // 명함 화면(엔딩)에 로고: 위쪽 가운데에 살짝 떠오르듯 (모든 디자인 공통)
      if (t >= mainDuration && d && d.logoImg && d.logoImg.complete && d.logoImg.naturalWidth && !arCardEmpty()) {
        const lg = d.logoImg;
        const maxW = W * 0.24, maxH = W * 0.11;
        const k = Math.min(maxW / lg.naturalWidth, maxH / lg.naturalHeight);
        const lw = lg.naturalWidth * k, lh = lg.naturalHeight * k;
        const a = Math.min(1, Math.max(0, (t - mainDuration) / 0.5));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = 8;
        // 오른쪽 위 모서리 (가운데 사진·제목과 겹치지 않게)
        ctx.drawImage(lg, W - lw - W * 0.05, H * 0.035 + (1 - a) * 8, lw, lh);
        ctx.restore();
      }

      if (t < mainDuration && typeof arRenderMemeShortsOverlay === 'function') {
        arRenderMemeShortsOverlay(ctx, W, H, t, mainDuration);
      }

      // 정품 확인은 화면용 명함(항목을 끈 것)이 아니라 실제 계정 정보로
      const drmCode = evaluateDealerDrmStatus(getSelectedDealer());
      // ★ 2026-11-17: 미리보기가 첫 화면부터 보이므로, 미구독 띠는 완성 영상(내보내기)에만 크게 넣고
      //   미리보기에서는 작은 '체험판 미리보기' 표시만 (상단 제목 바와 겹치지 않게 오른쪽 아래 구석에 배치).
      if (drmCode !== 1 && drmCode !== 3 && !window.__exportingVideo) {
        {
          ctx.save();
          const fs = Math.round(W * 0.023);
          ctx.font = `700 ${fs}px "Pretendard Variable", sans-serif`;
          const label = '체험판 미리보기';
          const pw = ctx.measureText(label).width + fs * 1.5;
          const ph = fs * 1.9;
          const px = W - pw - W * 0.035;
          const py = H - ph - H * 0.03;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
          drawRoundedRect(ctx, px, py, pw, ph, ph / 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, px + fs * 0.75, py + ph / 2 + 1);
          ctx.restore();
        }
      }
      if (drmCode !== 1 && (drmCode === 3 || window.__exportingVideo)) {
        ctx.save();
        ctx.fillStyle = 'rgba(2, 6, 23, 0.52)';
        ctx.fillRect(0, 0, W, H);

        ctx.translate(W / 2, H / 2);
        ctx.rotate(-0.32);

        const isTamper = drmCode === 3;
        const bannerColor = isTamper ? 'rgba(225, 29, 72, 0.94)' : 'rgba(217, 119, 6, 0.94)';
        ctx.fillStyle = bannerColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, -310, -76, 620, 152, 20);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px "Pretendard Variable", sans-serif';
        ctx.fillText(
          isTamper ? '🚨 전화번호 무단 변경 · 계정 공유 차단됨' : '🔒 AUTOREELSMAKER 미구독 · 만료 제한 모드',
          0,
          -22
        );
        ctx.font = '700 18px "Pretendard Variable", sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(
          isTamper
            ? `정품 바인딩 번호(${d.licensedPhone})와 일치하지 않습니다`
            : '정품 구독 라이선스 인증 후 워터마크가 제거됩니다',
          0,
          16
        );
        ctx.font = '600 15px monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('AutoReelsMaker', 0, 50);
        ctx.restore();
      }

      // 모바일 미니 캔버스 실시간 미러 렌더링 & 도크 UI 동기화 (보일 때만 미러링)
      const miniCanvas = document.getElementById('mobileMiniCanvas');
      if (miniCanvas && miniCanvas.offsetParent !== null) {
        const mCtx = miniCanvas.getContext('2d');
        if (mCtx) {
          mCtx.drawImage(canvas, 0, 0, miniCanvas.width, miniCanvas.height);
        }
      }
      // 크게 보기 팝업이 열려 있으면 같은 화면을 크게 그림
      if (typeof arPreviewPopOpen === 'function' && arPreviewPopOpen()) {
        const pc = document.getElementById('arPreviewPopCanvas');
        const pctx = pc && pc.getContext('2d');
        if (pctx) pctx.drawImage(canvas, 0, 0, pc.width, pc.height);
      }
      syncMobileDockUI(t);
    }

    // 애니메이션 루프 (재생 중일 때만 window.__timelines.main.seek 호출)
    function tick(now) {
      const dt = (now - lastWallTime) / 1000;
      lastWallTime = now;

      if (isPlaying) {
        const tl = window.__timelines['main'];
        let nextT = (window.__exportingVideo && window.__exportStartedAt)
          ? Math.max(0, (now - window.__exportStartedAt) / 1000)
          : (tl.currentTime + dt);
        if (nextT >= tl.duration) {
          // 녹화 중에는 마지막 화면에서 멈춰, 첫 컷 음성이 영상 끝에 섞여 들어가지 않게 함
          nextT = window.__exportingVideo ? Math.max(0, tl.duration - 0.001) : 0;
        }
        tl.seek(nextT);
      }
      requestAnimationFrame(tick);
    }

    function seekToTime(sec) {
      const t = Number(sec);
      window.__timelines['main'].seek(t);
      if (AudioEngine.enabled && AudioEngine.masterBuffer) {
        if (isPlaying) {
          AudioEngine.playMasterAt(t);
        } else {
          AudioEngine.stopMasterSource();
        }
      }
    }

    function onSliderScrub(val) {
      const t = Number(val);
      window.__timelines['main'].seek(t);
      if (AudioEngine.enabled && AudioEngine.masterBuffer) {
        if (isPlaying) {
          AudioEngine.playMasterAt(t);
        } else {
          AudioEngine.stopMasterSource();
        }
      }
    }

    function togglePlayPause() {
      if (!isPlaying && arEditSheetOpen) return;
      if (!isPlaying && arWaitForEditedPreview()) return;
      isPlaying = !isPlaying;
      if (isPlaying && window.__arPinnedCut >= 0) {
        window.__arPinnedCut = -1;
        window.__arSelectedOverlayIdx = -1;
        if (typeof renderPreviewCutPinBar === 'function') renderPreviewCutPinBar();
      }
      document.getElementById('playPauseBtn').textContent = isPlaying ? '⏸ 일시정지' : '▶️ 재생';
      if (!isPlaying) pauseAllCutVideos();
      if (isPlaying && AudioEngine.enabled && AudioEngine.ttsVoice !== 'off' && (AudioEngine.ttsDirty || !AudioEngine.masterBuffer) && !AudioEngine.scriptPending) {
        AudioEngine.prefetchTtsBuffers(true);
      }
      AudioEngine.onPlayStateChange(isPlaying);
      arShowPlaybackFeedback();
    }

    let arPlaybackFeedbackTimer;
    function arShowPlaybackFeedback() {
      clearTimeout(arPlaybackFeedbackTimer);
      document.querySelectorAll('.ar-play-feedback').forEach((badge) => {
        badge.textContent = isPlaying ? '▶' : '❚❚';
        badge.classList.add('is-visible');
      });
      arPlaybackFeedbackTimer = setTimeout(() => {
        document.querySelectorAll('.ar-play-feedback').forEach((badge) => {
          if (isPlaying) badge.classList.remove('is-visible');
          else badge.textContent = '▶';
        });
      }, 650);
    }

    // 미리보기 화면 클릭은 재생을 전환하고, 컷 편집 중 터치는 편집에만 사용한다.
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!target || (target.id !== 'reelCanvas' && target.id !== 'arPreviewPopCanvas')) return;
      if (target.id === 'reelCanvas' && (window.__arPinnedCut >= 0 || document.body.classList.contains('ar-cut-editing'))) return;
      togglePlayPause();
      if (typeof arSyncPreviewPopBtn === 'function') arSyncPreviewPopBtn();
    });
    // 다중 차량 사진 업로드 핸들러 (자동 3D Ken Burns 슬라이드쇼 · 1~10장 지원)
    // 컷에 들어간 영상 클립을 모두 멈춤
    function pauseAllCutVideos() {
      campaign.uploadedPhotos.forEach((m) => {
        if (m && m._isVideo && !m.paused) {
          try { m.pause(); } catch (e) {}
        }
      });
    }

    // 현재 컷의 영상만 컷 시작에 맞춰 재생하고 나머지는 멈춤 (activeIdx가 -1이면 전부 멈춤)
    function syncCutVideos(activeIdx, localSec) {
      campaign.uploadedPhotos.forEach((m, i) => {
        if (!m || !m._isVideo) return;
        if (i !== activeIdx) {
          if (!m.paused) m.pause();
          return;
        }
        const dur = m.duration && isFinite(m.duration) ? m.duration : 0;
        let want = 0;
        if (m._continuousVideo && dur > 0.2) {
          const trimStart = Math.max(0, Math.min(dur - 0.5, Number(m._trimStart) || 0));
          const trimEnd = (m._trimEnd && m._trimEnd > trimStart + 0.5) ? Math.min(dur, m._trimEnd) : dur;
          const span = Math.max(0.5, trimEnd - trimStart);
          const rate = Math.max(0.5, Math.min(2.0, Number(m._playRate) || 1));
          if (Math.abs((m.playbackRate || 1) - rate) > 0.01) {
            try { m.playbackRate = rate; } catch (e) {}
          }
          const globalT = Math.max(0, Number(window.__realTimelineT) || 0);
          want = trimStart + ((globalT * rate) % span);
          m.muted = !m._keepAudio;
          if (m._keepAudio && typeof AudioEngine !== 'undefined' && AudioEngine.ctx && AudioEngine.streamDest && !m._arAudioNode) {
            try {
              m._arAudioNode = AudioEngine.ctx.createMediaElementSource(m);
              m._arAudioGain = AudioEngine.ctx.createGain();
              m._arAudioGain.gain.value = 0.85;
              m._arAudioNode.connect(m._arAudioGain);
              m._arAudioGain.connect(AudioEngine.ctx.destination);
              m._arAudioGain.connect(AudioEngine.streamDest);
            } catch (e) {}
          }
          if (m._arAudioGain) {
            m._arAudioGain.gain.value = m._keepAudio ? 0.85 : 0;
          }
        } else {
          want = dur > 0.2 ? localSec % dur : 0;
        }
        if (Math.abs(m.currentTime - want) > (m._continuousVideo ? 0.32 : 0.4)) {
          try { m.currentTime = want; } catch (e) {}
        }
        if (isPlaying) {
          if (m.paused) m.play().catch(() => {});
        } else if (!m.paused) {
          m.pause();
        }
      });
    }

    // ★ 짧은 내 영상 바로 편집하기 (구간 자르기 · 배속 · 원본 소리 · 전 컷 연속 재생)
    function arGetShortVideoMedia() {
      const m = campaign && Array.isArray(campaign.uploadedPhotos) ? campaign.uploadedPhotos[0] : null;
      return (m && m._isVideo && m._continuousVideo) ? m : null;
    }

    function arRenderShortVideoBar() {
      const bar = document.getElementById('arShortVideoBar');
      if (!bar) return;
      const vid = arGetShortVideoMedia();
      if (!vid) {
        bar.classList.add('hidden');
        return;
      }
      bar.classList.remove('hidden');
      const dur = Math.max(1, (vid.duration && isFinite(vid.duration)) ? vid.duration : 12);
      const trimStart = Math.max(0, Math.min(dur - 0.5, Number(vid._trimStart) || 0));
      const trimEnd = Math.max(trimStart + 0.5, Math.min(dur, Number(vid._trimEnd) || dur));
      const rate = Math.max(0.5, Math.min(2.0, Number(vid._playRate) || 1));
      const effectiveDur = Math.max(1, (trimEnd - trimStart) / rate);

      const sEl = document.getElementById('svTrimStart');
      const eEl = document.getElementById('svTrimEnd');
      if (sEl) { sEl.max = String(Math.max(0.5, +(dur - 0.5).toFixed(1))); sEl.value = String(+trimStart.toFixed(1)); }
      if (eEl) { eEl.min = String(+(trimStart + 0.5).toFixed(1)); eEl.max = String(+dur.toFixed(1)); eEl.value = String(+trimEnd.toFixed(1)); }
      const svEl = document.getElementById('svTrimStartVal');
      const evEl = document.getElementById('svTrimEndVal');
      if (svEl) svEl.textContent = `${trimStart.toFixed(1)}초`;
      if (evEl) evEl.textContent = `${trimEnd.toFixed(1)}초`;
      const badge = document.getElementById('svDurationBadge');
      if (badge) badge.textContent = `원본 ${dur.toFixed(1)}초 → ${effectiveDur.toFixed(1)}초 (${rate}x)`;
      const nameEl = document.getElementById('svFileName');
      if (nameEl) nameEl.textContent = `${vid._origName || '내 짧은 영상'} · 전 컷에 끊김 없이 이어서 재생됩니다.`;

      bar.querySelectorAll('[data-sv-rate]').forEach((btn) => {
        const active = Math.abs(Number(btn.dataset.svRate) - rate) < 0.01;
        btn.style.background = active ? '#2563eb' : '';
        btn.style.color = active ? '#ffffff' : '';
        btn.style.borderColor = active ? '#3b82f6' : '';
      });
      const audBtn = document.getElementById('svAudioToggleBtn');
      if (audBtn) {
        audBtn.textContent = vid._keepAudio ? '원본 소리 켬' : '원본 소리 끔';
      }
    }

    function arUpdateShortVideoEdit(patch) {
      const vid = arGetShortVideoMedia();
      if (!vid) return;
      const dur = Math.max(1, (vid.duration && isFinite(vid.duration)) ? vid.duration : 12);
      if (typeof patch.trimStart === 'number') {
        vid._trimStart = Math.max(0, Math.min(dur - 0.5, patch.trimStart));
        if ((vid._trimEnd || dur) < vid._trimStart + 0.5) vid._trimEnd = Math.min(dur, vid._trimStart + 0.5);
      }
      if (typeof patch.trimEnd === 'number') {
        vid._trimEnd = Math.max((vid._trimStart || 0) + 0.5, Math.min(dur, patch.trimEnd));
      }
      if (typeof patch.playRate === 'number') {
        vid._playRate = Math.max(0.5, Math.min(2.0, patch.playRate));
      }
      if (patch.toggleAudio) {
        vid._keepAudio = !vid._keepAudio;
        vid.muted = !vid._keepAudio;
      }
      const span = Math.max(1, ((vid._trimEnd || dur) - (vid._trimStart || 0)) / (vid._playRate || 1));
      const outroSec = (typeof arCardEmpty === 'function' && arCardEmpty()) ? 0 : 3;
      const targetTotal = Math.max(6, Math.min(60, Math.round(span + outroSec)));
      if (typeof setVideoTotalDuration === 'function') setVideoTotalDuration(targetTotal);
      arRenderShortVideoBar();
      if (typeof arSyncEditedVideoOptionUI === 'function') arSyncEditedVideoOptionUI();
      if (window.__timelines && window.__timelines.main) {
        try { vid.currentTime = vid._trimStart || 0; } catch (e) {}
        window.__timelines.main.seek(0);
      }
    }

    function arClearShortVideoMode() {
      pauseAllCutVideos();
      campaign.uploadedPhotos.forEach(arReleasePhoto);
      campaign.uploadedPhotos = [];
      campaign.isUserCustomPhotos = false;
      campaign.hideCardOnVideo = false;
      campaign.noDefaultCaptions = false;
      arRenderShortVideoBar();
      if (typeof arSyncEditedVideoOptionUI === 'function') arSyncEditedVideoOptionUI();
      if (typeof arApplyIndustryPhotos === 'function') arApplyIndustryPhotos();
      if (typeof renderUploadedPhotoThumbs === 'function') renderUploadedPhotoThumbs();
      if (typeof arToast === 'function') arToast('단일 영상 편집 모드를 해제했습니다.');
    }

    // 카메라 원본은 화면·HTML에 넣기 전에 축소한다. 여러 장도 한 장씩 디코딩한다.
    function arImportPhoto(file, options = {}) {
      const run = async () => {
        const maxEdge = options.maxEdge || 1600;
        let source, inputUrl, outputUrl, canvas;
        try {
          if (typeof createImageBitmap === 'function') {
            try { source = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) {}
          }
          if (!source) {
            // HTMLImageElement도 EXIF 방향을 적용하며, 원본 base64 복사를 만들지 않는다.
            inputUrl = URL.createObjectURL(file);
            source = new Image(); source.src = inputUrl;
            await source.decode();
          }
          const width = source.naturalWidth || source.width, height = source.naturalHeight || source.height;
          if (!width || !height) throw new Error('이미지 크기');
          const scale = Math.min(1, maxEdge / Math.max(width, height));
          canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          const ctx = canvas.getContext('2d');
          if (!options.transparent) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
          ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
          const mime = options.webp ? 'image/webp' : options.transparent ? 'image/png' : 'image/jpeg';
          const blob = await new Promise((resolve, reject) => canvas.toBlob(
            value => value ? resolve(value) : reject(new Error('이미지 변환')),
            mime, 0.85
          ));
          let src;
          if (options.dataUrl) {
            // 저장이 필요한 작은 로고만 data URL로 만든다.
            src = await new Promise((resolve, reject) => {
              const reader = new FileReader(); reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob);
            });
          } else { outputUrl = URL.createObjectURL(blob); src = outputUrl; }
          const img = new Image(); img.src = src; await img.decode();
          img._dataUrl = src; img._arObjectUrl = outputUrl; img._blobBytes = blob.size;
          outputUrl = null;
          return img;
        } catch (e) {
          const heic = /hei[cf]/i.test(file.type || '') || /\.hei[cf]$/i.test(file.name || '');
          throw new Error(heic ? '이 브라우저에서 HEIC 사진을 열 수 없어요. JPG나 PNG로 바꿔 다시 골라 주세요.' : '사진을 읽지 못했어요. JPG나 PNG 사진을 다시 골라 주세요.');
        } finally {
          if (source && typeof source.close === 'function') source.close();
          if (source instanceof HTMLImageElement) source.removeAttribute('src');
          if (inputUrl) URL.revokeObjectURL(inputUrl);
          if (outputUrl) URL.revokeObjectURL(outputUrl);
          if (canvas) { canvas.width = 1; canvas.height = 1; }
        }
      };
      const job = (arImportPhoto.pending || Promise.resolve()).then(run);
      arImportPhoto.pending = job.catch(() => {});
      return job;
    }

    function arReleasePhoto(img) {
      if (!img) return;
      if (img._isVideo) {
        try { img.pause(); img.removeAttribute('src'); img.load(); } catch (_) {}
      }
      if (img._arObjectUrl) { URL.revokeObjectURL(img._arObjectUrl); img._arObjectUrl = null; }
    }

    async function arWithPhotoImport(input, action) {
      const disabled = input && input.disabled;
      if (input) { input.disabled = true; input.setAttribute?.('aria-busy', 'true'); }
      arToast('사진을 불러오는 중…', true);
      try {
        // 로딩 안내가 먼저 그려진 뒤 디코딩을 시작한다.
        await new Promise(resolve => setTimeout(resolve, 20));
        await action();
        arToast('사진을 불러왔어요.', true);
      } catch (e) { arToast(e.message || '사진을 불러오지 못했어요. 다시 시도해 주세요.'); }
      finally {
        if (input) { input.value = ''; input.disabled = disabled; input.removeAttribute?.('aria-busy'); }
      }
    }

    async function loadCutPhoto(file, order, options) {
      const img = await arImportPhoto(file, options);
      img._label = `${order}. 내 사진`;
      return img;
    }

    // 영상 파일 하나를 불러오고 썸네일용 첫 장면을 뽑음 (실패하면 null)
    function loadCutVideo(file, order) {
      return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const vid = document.createElement('video');
        vid.muted = true; // 영상의 원래 소리는 쓰지 않음 (성우·배경음악만 사용)
        vid.playsInline = true;
        vid.loop = true;
        vid.preload = 'auto';
        vid._isVideo = true;
        vid._arObjectUrl = url;
        vid._label = `${order}. 내 영상`;
        let done = false;
        const finish = (ok) => {
          if (done) return;
          done = true;
          resolve(ok ? vid : null);
        };
        vid.addEventListener('loadeddata', () => {
          try {
            const c = document.createElement('canvas');
            c.width = 180;
            c.height = 280;
            const r = Math.max(c.width / (vid.videoWidth || 1), c.height / (vid.videoHeight || 1));
            const dw = vid.videoWidth * r;
            const dh = vid.videoHeight * r;
            c.getContext('2d').drawImage(vid, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
            vid._dataUrl = c.toDataURL('image/jpeg', 0.7);
          } catch (e) {}
          finish(true);
        }, { once: true });
        vid.addEventListener('error', () => finish(false), { once: true });
        setTimeout(() => finish(vid.readyState >= 2), 15000);
        vid.src = url;
        vid.load();
      });
    }

    // 사진·영상 여러 개 올리기: 올린 순서대로 한 컷씩 배치 (최대 10개)
    async function handleMultiPhotoUpload(event) {
      const finished = campaign.lookbookFinishedCards && arFindDesign(campaign.designStyle)?.mstyle === 'in_lookbook_still';
      const picked = Array.from(event.target.files || []).filter((f) => /^image\//.test(f.type) ||
        (!finished && /^video\//.test(f.type)) || /\.(jpe?g|png|webp|hei[cf])$/i.test(f.name));
      if (picked.length === 0) return;
      const files = picked.slice(0, 10);
      const statusEl = document.getElementById('photoUploadStatus');
      if (statusEl) statusEl.textContent = `${files.length}개 불러오는 중…`;

      let photoError = '';
      const loaded = [];
      await arWithPhotoImport(event.target, async () => {
        for (const [idx, file] of files.entries()) {
          try {
            loaded.push(await (file.type.startsWith('video/') ? loadCutVideo(file, idx + 1) :
              loadCutPhoto(file, idx + 1, finished ? { transparent: true, maxEdge: 1920 } : undefined)));
          }
          catch (e) { photoError = e.message; loaded.push(null); }
        }
        if (finished && loaded.some((photo) => !photo)) {
          loaded.forEach(arReleasePhoto);
          loaded.length = 0;
          throw new Error(photoError || '완성 카드 중 열리지 않는 이미지가 있어요.');
        }
        if (!loaded.some(Boolean)) throw new Error(photoError || '불러올 수 있는 사진·영상이 없습니다.');
      });
      const items = loaded.filter(Boolean);
      event.target.value = ''; // 같은 파일을 다시 골라도 반응하도록
      if (items.length === 0) {
        if (statusEl) statusEl.textContent = photoError || '불러올 수 있는 사진·영상이 없습니다. 다른 파일로 다시 시도해 주세요.';
        return;
      }

      pauseAllCutVideos();
      campaign.isUserCustomPhotos = true;
      campaign.hasCustomVideo = false;
      campaign.uploadedPhotos.forEach(arReleasePhoto);
      campaign.uploadedPhotos = items;
      if (typeof window.arVaultSaveImages === 'function') window.arVaultSaveImages(items, 'upload');
      if (Array.isArray(campaign.scenePlan)) campaign.scenePlan.forEach((p) => { if (p) { delete p.photoIdx; delete p.photoManual; } });
      if (finished && items.length > 1) {
        campaign.cutCountOverride = items.length;
        if (!Array.isArray(campaign.scenePlan)) campaign.scenePlan = [];
        for (let i = 0; i < items.length; i++) {
          const plan = campaign.scenePlan[i] ||= {};
          plan.photoIdx = i;
          plan.photoManual = true;
        }
      }

      applyVideoDurations(); // 장면이 바뀌었으므로 길이·썸네일을 다시 계산
      if (AudioEngine.enabled) AudioEngine.prefetchTtsBuffers();
      AudioEngine.lastSpokenCut = -1;
      window.__timelines['main'].seek(0);

      if (statusEl) {
        const failed = files.length - items.length;
        const skipped = picked.length - files.length;
        statusEl.textContent =
          `${items.length}개를 올렸습니다. 영상 길이에 맞춰 순서대로 나뉘어 들어갑니다.` +
          (failed > 0 ? ` ${failed}개는 열 수 없어 제외했습니다. ${photoError}` : '') +
          (skipped > 0 ? ` 10개까지만 쓸 수 있어 ${skipped}개는 제외했습니다.` : '');
      }
    }

    // ★ 편집 영상(내 영상) · 사진 콜라주에 대본 자막 / 명함·상호를 넣을지 말지 1탭 선택 토글
    function arSyncEditedVideoOptionUI() {
      const bar = document.getElementById('pdOverlayChoiceBar');
      const isShort = Boolean((typeof arGetShortVideoMedia === 'function' && arGetShortVideoMedia()) || campaign.isPhotoCollageMode);
      if (bar) bar.classList.toggle('hidden', !isShort);
      const clRow = document.getElementById('pdCollageQuickRow');
      if (clRow) clRow.classList.toggle('hidden', !campaign.isPhotoCollageMode);
      const scriptOn = !campaign.noDefaultCaptions;
      const cardOn = !campaign.hideCardOnVideo;
      const styleBtn = (id, on, label) => {
        const b = document.getElementById(id);
        if (!b) return;
        b.textContent = `${label}: ${on ? '켜짐' : '끄기'}`;
        b.setAttribute('aria-pressed', String(on));
        b.style.background = on ? '#1d4ed8' : '#1f2027';
        b.style.borderColor = on ? '#60a5fa' : 'rgba(255,255,255,0.14)';
        b.style.color = on ? '#ffffff' : '#a1a1aa';
      };
      styleBtn('pdToggleScriptBtn', scriptOn, '📝 대본 자막');
      styleBtn('pdToggleCardBtn', cardOn, '🪪 명함·상호');
      styleBtn('svToggleScriptBtn', scriptOn, '📝 대본');
      styleBtn('svToggleCardBtn', cardOn, '🪪 명함');
    }
    window.arSyncEditedVideoOptionUI = arSyncEditedVideoOptionUI;

    function arToggleEditedVideoOption(kind) {
      if (kind === 'script') {
        const turnOn = Boolean(campaign.noDefaultCaptions);
        campaign.noDefaultCaptions = !turnOn;
        if (turnOn) {
          campaign._userWroteScript = true;
          const hasAny = Array.isArray(campaign.cutCaptions) && campaign.cutCaptions.some((x) => String(x || '').trim());
          if (!hasAny && Array.isArray(campaign._stashedCaptions) && campaign._stashedCaptions.length) {
            campaign.cutCaptions = campaign._stashedCaptions.slice();
            campaign.hook = campaign._stashedHook || campaign.cutCaptions[0] || '';
          } else if (!hasAny) {
            if (typeof arToast === 'function') arToast('대본 자막을 켰어요. [대본] 탭에서 원하는 문구를 입력해 주세요.');
          }
          if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
        } else {
          if (Array.isArray(campaign.cutCaptions) && campaign.cutCaptions.some((x) => String(x || '').trim())) {
            campaign._stashedCaptions = campaign.cutCaptions.slice();
            campaign._stashedHook = campaign.hook || '';
          }
          const nCuts = Math.max(4, typeof getTargetCutCount === 'function' ? getTargetCutCount() : 4);
          campaign.hook = '';
          campaign.sub = '';
          campaign.priceTag = '';
          campaign.cutCaptions = Array.from({ length: nCuts }, () => '');
          campaign.ttsLines = Array.from({ length: nCuts }, () => '');
          if (typeof AudioEngine !== 'undefined') {
            AudioEngine.ttsVoice = 'off';
            AudioEngine.masterBuffer = null;
            AudioEngine.masterDuration = 0;
            AudioEngine.ttsDirty = false;
            const vSel = document.getElementById('ttsVoiceSelect');
            if (vSel) vSel.value = 'off';
          }
          if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
        }
      } else if (kind === 'card') {
        campaign.hideCardOnVideo = !campaign.hideCardOnVideo;
        if (campaign.isPhotoCollageMode) {
          const fitted = computeFittedDurations();
          const mainD = fitted.lengths.reduce((sum, length) => sum + length, 0);
          const outroD = fitted.outro;
          if (typeof OUTRO_DURATION !== 'undefined') OUTRO_DURATION = outroD;
          if (typeof BASE_DURATION !== 'undefined') BASE_DURATION = +(mainD + outroD).toFixed(2);
          if (typeof CUT_LENGTHS !== 'undefined') CUT_LENGTHS = fitted.lengths;
          if (typeof TOTAL_DURATION !== 'undefined') TOTAL_DURATION = +(mainD + outroD).toFixed(2);
          if (window.__timelines && window.__timelines.main) window.__timelines.main.duration = TOTAL_DURATION;
          if (typeof updateDurationIndicator === 'function') updateDurationIndicator();
        } else {
          arUpdateShortVideoEdit({});
        }
      }
      if (typeof designThumbCache !== 'undefined' && designThumbCache) designThumbCache.fresh = {};
      if (typeof scheduleDesignThumbs === 'function') scheduleDesignThumbs();
      arSyncEditedVideoOptionUI();
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(window.__timelines.main.currentTime);
    }
    window.arToggleEditedVideoOption = arToggleEditedVideoOption;

    // ★ 영상 편집기에서 다듬은 영상에 스튜디오 테마 입히기 (2026-11-22)
    // 편집기가 만든 MP4 하나를 사진 칸에 넣고, 모든 컷에 끊김 없이 이어서 재생한다(원본 소리 유지).
    async function arApplyThemeToEditedVideo(file) {
      const input = document.getElementById('multiPhotoInput');
      if (!input || !file) throw new Error('편집한 영상을 넘기지 못했어요.');
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      await handleMultiPhotoUpload({ target: input });
      const vid = campaign.uploadedPhotos[0];
      if (!vid || !vid._isVideo) throw new Error('편집한 영상을 불러오지 못했어요. 다시 시도해 주세요.');
      vid._continuousVideo = true;
      vid._keepAudio = true;
      vid._origName = '편집기에서 다듬은 영상';
      // 사용자가 스튜디오에서 대본을 직접 쓰거나 생성한 적이 없다면 대본·명함 모두 기본 OFF로 시작하고 상단에서 직접 선택하게 함
      const hasUserScript = Boolean(campaign._userWroteScript);
      campaign.hideCardOnVideo = true;
      if (!hasUserScript) {
        if (Array.isArray(campaign.cutCaptions) && campaign.cutCaptions.some((x) => String(x || '').trim())) {
          campaign._stashedCaptions = campaign.cutCaptions.slice();
          campaign._stashedHook = campaign.hook || '';
        }
        campaign.noDefaultCaptions = true;
        campaign.hook = '';
        campaign.sub = '';
        campaign.priceTag = '';
        campaign.cutCaptions = [];
        campaign.ttsLines = [];
        if (typeof AudioEngine !== 'undefined') {
          AudioEngine.ttsVoice = 'off';
          AudioEngine.masterBuffer = null;
          AudioEngine.masterDuration = 0;
          AudioEngine.ttsDirty = false;
          const vSel = document.getElementById('ttsVoiceSelect');
          if (vSel) vSel.value = 'off';
        }
      }
      document.querySelector('dialog.ar-video-editor[open]')?.close();
      arUpdateShortVideoEdit({});
      if (!hasUserScript) {
        const nCuts = Math.max(4, typeof getTargetCutCount === 'function' ? getTargetCutCount() : 4);
        campaign.hook = '';
        campaign.sub = '';
        campaign.priceTag = '';
        campaign.cutCaptions = Array.from({ length: nCuts }, () => '');
        campaign.ttsLines = Array.from({ length: nCuts }, () => '');
        if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
        if (typeof designThumbCache !== 'undefined' && designThumbCache) designThumbCache.fresh = {};
      }
      arSyncEditedVideoOptionUI();
      if (typeof renderUploadedPhotoThumbs === 'function') renderUploadedPhotoThumbs();
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(0);
      if (typeof openPresetDrawer === 'function') openPresetDrawer('right');
      if (typeof arToast === 'function') arToast('편집한 영상을 넣었어요. 대본·명함은 위 버튼에서 원할 때 켜고 끌 수 있어요.');
    }

    // =========================================================================
    // ★ 처음 시작할 때 "사진 콜라주로 만들기" → 6종 9:16 콜라주 생성 + 편집기 영상처럼 테마 바로 입히기
    // =========================================================================
    const AR_COLLAGE_MAX_PHOTOS = 9;
    const _arCollageGrid = (cols, rows) => {
      const out = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([c / cols, r / rows, 1 / cols, 1 / rows]);
      return out;
    };
    const _arCollageRowsSpec = (rowSpecs) => {
      // rowSpecs: [[cols, heightRatio], ...]
      const out = [];
      let y = 0;
      rowSpecs.forEach(([cols, h]) => {
        for (let c = 0; c < cols; c++) out.push([c / cols, y, 1 / cols, h]);
        y += h;
      });
      return out;
    };
    const AR_COLLAGE_TEMPLATES = [
      // 1장
      { id: '1_full', count: 1, label: '풀화면', special: 'full', boxes: [[0, 0, 1, 1]] },
      { id: '1_frame', count: 1, label: '감성 액자', boxes: [[0.06, 0.08, 0.88, 0.84]] },
      // 2장
      { id: '2_tb', count: 2, label: '상하 2분할', boxes: [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]] },
      { id: '2_lr', count: 2, label: '좌우 2분할', boxes: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]] },
      { id: '2_bigtop', count: 2, label: '상단 크게', boxes: [[0, 0, 1, 0.66], [0, 0.66, 1, 0.34]] },
      { id: '2_polaroid', count: 2, label: '폴라로이드', special: 'polaroid2', boxes: [[0.08, 0.12, 0.64, 0.36], [0.28, 0.52, 0.64, 0.36]] },
      // 3장 (다양한 모양 8종!)
      { id: '3_top1_bot2', count: 3, label: '상1 + 하2', boxes: [[0, 0, 1, 0.56], [0, 0.56, 0.5, 0.44], [0.5, 0.56, 0.5, 0.44]] },
      { id: '3_top2_bot1', count: 3, label: '상2 + 하1', boxes: [[0, 0, 0.5, 0.44], [0.5, 0, 0.5, 0.44], [0, 0.44, 1, 0.56]] },
      { id: '3_left1_right2', count: 3, label: '좌1 + 우2', boxes: [[0, 0, 0.56, 1], [0.56, 0, 0.44, 0.5], [0.56, 0.5, 0.44, 0.5]] },
      { id: '3_right1_left2', count: 3, label: '좌2 + 우1', boxes: [[0, 0, 0.44, 0.5], [0, 0.5, 0.44, 0.5], [0.44, 0, 0.56, 1]] },
      { id: '3_rows', count: 3, label: '가로 3단', boxes: _arCollageGrid(1, 3) },
      { id: '3_cols', count: 3, label: '세로 3단', boxes: _arCollageGrid(3, 1) },
      { id: '3_film', count: 3, label: '35mm 필름', special: 'filmstrip', boxes: [[0.1, 0.03, 0.8, 0.3], [0.1, 0.35, 0.8, 0.3], [0.1, 0.67, 0.8, 0.3]] },
      { id: '3_polaroid', count: 3, label: '폴라로이드', special: 'polaroid3', boxes: [[0.08, 0.07, 0.58, 0.28], [0.34, 0.36, 0.58, 0.28], [0.12, 0.65, 0.58, 0.28]] },
      // 4장
      { id: '4_grid', count: 4, label: '2×2 기본', boxes: _arCollageGrid(2, 2) },
      { id: '4_top1_bot3', count: 4, label: '상1 + 하3', boxes: _arCollageRowsSpec([[1, 0.58], [3, 0.42]]) },
      { id: '4_left1_right3', count: 4, label: '좌1 + 우3', boxes: [[0, 0, 0.58, 1], [0.58, 0, 0.42, 1 / 3], [0.58, 1 / 3, 0.42, 1 / 3], [0.58, 2 / 3, 0.42, 1 / 3]] },
      { id: '4_mosaic', count: 4, label: '화보 비대칭', boxes: [[0, 0, 0.62, 0.52], [0.62, 0, 0.38, 0.52], [0, 0.52, 0.38, 0.48], [0.38, 0.52, 0.62, 0.48]] },
      { id: '4_rows', count: 4, label: '가로 4단', boxes: _arCollageGrid(1, 4) },
      // 5장
      { id: '5_top2_bot3', count: 5, label: '상2 + 하3', boxes: _arCollageRowsSpec([[2, 0.52], [3, 0.48]]) },
      { id: '5_top3_bot2', count: 5, label: '상3 + 하2', boxes: _arCollageRowsSpec([[3, 0.48], [2, 0.52]]) },
      { id: '5_top1_bot4', count: 5, label: '상1 + 2×2', boxes: _arCollageRowsSpec([[1, 0.46], [2, 0.27], [2, 0.27]]) },
      { id: '5_2_1_2', count: 5, label: '2 + 중앙1 + 2', boxes: _arCollageRowsSpec([[2, 0.31], [1, 0.38], [2, 0.31]]) },
      // 6장
      { id: '6_2x3', count: 6, label: '2×3 그리드', boxes: _arCollageGrid(2, 3) },
      { id: '6_3x2', count: 6, label: '3×2 그리드', boxes: _arCollageGrid(3, 2) },
      { id: '6_mosaic', count: 6, label: '메인 + 5', boxes: [[0, 0, 2 / 3, 2 / 3], [2 / 3, 0, 1 / 3, 1 / 3], [2 / 3, 1 / 3, 1 / 3, 1 / 3], [0, 2 / 3, 1 / 3, 1 / 3], [1 / 3, 2 / 3, 1 / 3, 1 / 3], [2 / 3, 2 / 3, 1 / 3, 1 / 3]] },
      { id: '6_1_2_3', count: 6, label: '1 + 2 + 3', boxes: _arCollageRowsSpec([[1, 0.40], [2, 0.32], [3, 0.28]]) },
      // 7장
      { id: '7_2_3_2', count: 7, label: '2 + 3 + 2', boxes: _arCollageRowsSpec([[2, 0.34], [3, 0.32], [2, 0.34]]) },
      { id: '7_1_3_3', count: 7, label: '상1 + 3×2', boxes: _arCollageRowsSpec([[1, 0.42], [3, 0.29], [3, 0.29]]) },
      { id: '7_3_1_3', count: 7, label: '3 + 중앙1 + 3', boxes: _arCollageRowsSpec([[3, 0.30], [1, 0.40], [3, 0.30]]) },
      // 8장
      { id: '8_2x4', count: 8, label: '2×4 그리드', boxes: _arCollageGrid(2, 4) },
      { id: '8_3_2_3', count: 8, label: '3 + 2 + 3', boxes: _arCollageRowsSpec([[3, 0.31], [2, 0.38], [3, 0.31]]) },
      { id: '8_2_3_3', count: 8, label: '2 + 3 + 3', boxes: _arCollageRowsSpec([[2, 0.40], [3, 0.30], [3, 0.30]]) },
      // 9장
      { id: '9_3x3', count: 9, label: '3×3 그리드', boxes: _arCollageGrid(3, 3) },
      { id: '9_hero_top', count: 9, label: '상1 + 하8', boxes: _arCollageRowsSpec([[1, 0.44], [4, 0.28], [4, 0.28]]) },
      { id: '9_center', count: 9, label: '4 + 중앙1 + 4', boxes: _arCollageRowsSpec([[4, 0.29], [1, 0.42], [4, 0.29]]) },
      { id: '9_2_3_4', count: 9, label: '2 + 3 + 4', boxes: _arCollageRowsSpec([[2, 0.38], [3, 0.32], [4, 0.30]]) }
    ];
    function arCollageGetTemplate(id) {
      return AR_COLLAGE_TEMPLATES.find((t) => t.id === id) || AR_COLLAGE_TEMPLATES[2]; // fallback 2_tb
    }

    const _arCollageState = {
      photos: [],       // [{ id, img, src, fromVault }]
      countTab: 2,      // 1..9
      layout: '2_tb',   // template id from AR_COLLAGE_TEMPLATES
      userPickedLayout: false,
      bg: 'dark',       // dark | cream | white
      cutSec: 10,
      previewIdx: 0,
      activeSlot: -1,   // -1 = 전체 보기, 0..8 = 개별 사진 칸 편집 모드
      slotEdits: {}     // key: `${layout}:${slideIdx}:${slotIdx}` -> { scale, panX, panY, rot, flipX, imgOverride }
    };
    // 합성된 이미지와 원본 칸을 연결한다. 컷 순서와 복사본은 scenePlan의 사진 참조를 따른다.
    const arCollageSources = new WeakMap();
    let arCollageEditingCut = null;
    function arCollageCanEditSlots(cutIdx) {
      const photoIdx = campaign.scenePlan?.[cutIdx]?.photoIdx;
      return Boolean(campaign.isPhotoCollageMode && arCollageSources.has(campaign.uploadedPhotos?.[photoIdx]));
    }

    function arCollageRememberSource(image, slide, slideIdx) {
      const slotEdits = {};
      const photos = slide.imgs.map((img, index) => {
        const edit = _arCollageState.slotEdits[arCollageEditKey(slideIdx, index)];
        if (edit) slotEdits[slide.type + ':0:' + index] = {...edit};
        return {id: String(index), img, src: img.src};
      });
      arCollageSources.set(image, {
        layout: slide.type, countTab: photos.length, userPickedLayout: true,
        photos, slotEdits, bg: _arCollageState.bg, previewIdx: 0, activeSlot: -1
      });
    }

    function arCollageTemplateSvg(tpl) {
      const W = 26, H = 44, pad = 2, g = 1.4;
      const iw = W - pad * 2, ih = H - pad * 2;
      if (tpl.special === 'polaroid2') {
        return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none"><rect x="3" y="4" width="14" height="17" rx="1.5" transform="rotate(-6 10 12)" fill="currentColor" opacity="0.28" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="22" width="14" height="17" rx="1.5" transform="rotate(5 16 30)" fill="currentColor" opacity="0.28" stroke="currentColor" stroke-width="1.2"/></svg>`;
      }
      if (tpl.special === 'polaroid3') {
        return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none"><rect x="3" y="3" width="13" height="12" rx="1.3" transform="rotate(-6 9 9)" fill="currentColor" opacity="0.28" stroke="currentColor" stroke-width="1.1"/><rect x="10" y="16" width="13" height="12" rx="1.3" transform="rotate(5 16 22)" fill="currentColor" opacity="0.28" stroke="currentColor" stroke-width="1.1"/><rect x="4" y="29" width="13" height="12" rx="1.3" transform="rotate(-4 10 35)" fill="currentColor" opacity="0.28" stroke="currentColor" stroke-width="1.1"/></svg>`;
      }
      const rects = tpl.boxes.map(([bx, by, bw, bh]) => {
        const x = pad + bx * iw + (bx > 0.001 ? g / 2 : 0);
        const y = pad + by * ih + (by > 0.001 ? g / 2 : 0);
        const x2 = pad + (bx + bw) * iw - (bx + bw < 0.999 ? g / 2 : 0);
        const y2 = pad + (by + bh) * ih - (by + bh < 0.999 ? g / 2 : 0);
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(2, x2 - x).toFixed(1)}" height="${Math.max(2, y2 - y).toFixed(1)}" rx="1.2" fill="currentColor" opacity="0.26" stroke="currentColor" stroke-width="1.1"/>`;
      }).join('');
      return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">${rects}</svg>`;
    }

    function arCollageRenderLayoutPicker() {
      document.querySelectorAll('#arCollageCountTabs [data-cl-cnt]').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.clCnt) === _arCollageState.countTab);
      });
      const grid = document.getElementById('arCollageLayoutGrid');
      if (!grid) return;
      const list = AR_COLLAGE_TEMPLATES.filter((t) => t.count === _arCollageState.countTab);
      grid.innerHTML = list.map((t) => {
        const on = _arCollageState.layout === t.id;
        return `<button type="button" data-cl-layout="${t.id}" onclick="arCollageSetLayout('${t.id}')" class="ar-cl-tpl-btn${on ? ' active' : ''}">${arCollageTemplateSvg(t)}<span>${t.label}</span></button>`;
      }).join('');
    }

    function arCollageAutoMatchCount() {
      if (_arCollageState.userPickedLayout) return;
      const n = _arCollageState.photos.length;
      if (!n) return;
      const targetCnt = Math.max(1, Math.min(9, n));
      const first = AR_COLLAGE_TEMPLATES.find((t) => t.count === targetCnt);
      if (first) {
        _arCollageState.countTab = targetCnt;
        _arCollageState.layout = first.id;
        _arCollageState.previewIdx = 0;
        _arCollageState.activeSlot = -1;
      }
    }

    function arCollageEditKey(slideIdx, slotIdx) {
      return `${_arCollageState.layout}:${slideIdx}:${slotIdx}`;
    }
    function arCollageGetEdit(slideIdx, slotIdx) {
      return _arCollageState.slotEdits[arCollageEditKey(slideIdx, slotIdx)] || { scale: 1, panX: 0, panY: 0, rot: 0, flipX: false, imgOverride: null };
    }
    function arCollageSetEdit(slideIdx, slotIdx, patch) {
      const k = arCollageEditKey(slideIdx, slotIdx);
      const cur = arCollageGetEdit(slideIdx, slotIdx);
      _arCollageState.slotEdits[k] = { ...cur, ...patch };
      return _arCollageState.slotEdits[k];
    }

    function arCollageDrawCover(ctx, img, x, y, w, h, r = 0, edit = null) {
      const useImg = (edit && edit.imgOverride) || img;
      if (!useImg || !useImg.naturalWidth || !useImg.naturalHeight) return;
      const scale = Math.max(1, Math.min(2.8, Number(edit && edit.scale) || 1));
      const panX = Math.max(-0.65, Math.min(0.65, Number(edit && edit.panX) || 0));
      const panY = Math.max(-0.65, Math.min(0.65, Number(edit && edit.panY) || 0));
      const rotRad = ((Number(edit && edit.rot) || 0) * Math.PI) / 180;
      const flipX = Boolean(edit && edit.flipX);

      ctx.save();
      if (r > 0) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath(); ctx.clip();
      } else {
        ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      }
      const iw = useImg.naturalWidth, ih = useImg.naturalHeight;
      // 회전 시 모서리 빈틈 방지를 위해 미세 안전 배율 추가
      const rotPad = Math.abs(rotRad) > 0.001 ? (1 + Math.abs(Math.sin(rotRad)) * 0.45) : 1;
      const sc = Math.max(w / iw, h / ih) * scale * rotPad;
      const dw = iw * sc, dh = ih * sc;
      const cx = x + w / 2 + panX * w;
      const cy = y + h / 2 + panY * h;
      ctx.translate(cx, cy);
      if (rotRad) ctx.rotate(rotRad);
      if (flipX) ctx.scale(-1, 1);
      ctx.drawImage(useImg, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }

    // 슬라이드별 정확한 칸 좌표(렌더링 + 꾹 누르기/탭 히트테스트 공용, 1~9칸 모든 모양 지원)
    function arCollageGetSlotRects(slide, W, H) {
      if (!slide) return [];
      const tpl = arCollageGetTemplate(slide.type);
      if (tpl.special === 'full') {
        return [{ x: 0, y: 0, w: W, h: H, r: 0, rot: 0 }];
      }
      if (tpl.special === 'polaroid2') {
        const pw = Math.round(W * 0.64), ph = Math.round(H * 0.34);
        const flip = (slide.idx || 0) % 2 === 0 ? 1 : -1;
        return [
          { isPolaroid: true, cx: W * (0.45 - 0.04 * flip), cy: H * 0.30, w: pw, h: ph, x: W * (0.45 - 0.04 * flip) - pw / 2, y: H * 0.30 - ph / 2, r: 0, rot: -0.055 * flip },
          { isPolaroid: true, cx: W * (0.55 + 0.04 * flip), cy: H * 0.67, w: pw, h: ph, x: W * (0.55 + 0.04 * flip) - pw / 2, y: H * 0.67 - ph / 2, r: 0, rot: 0.048 * flip }
        ];
      }
      if (tpl.special === 'polaroid3') {
        const pw = Math.round(W * 0.56), ph = Math.round(H * 0.255);
        const flip = (slide.idx || 0) % 2 === 0 ? 1 : -1;
        return [
          { isPolaroid: true, cx: W * (0.41 - 0.03 * flip), cy: H * 0.21, w: pw, h: ph, x: W * (0.41 - 0.03 * flip) - pw / 2, y: H * 0.21 - ph / 2, r: 0, rot: -0.06 * flip },
          { isPolaroid: true, cx: W * (0.59 + 0.03 * flip), cy: H * 0.495, w: pw, h: ph, x: W * (0.59 + 0.03 * flip) - pw / 2, y: H * 0.495 - ph / 2, r: 0, rot: 0.055 * flip },
          { isPolaroid: true, cx: W * (0.42 - 0.02 * flip), cy: H * 0.78, w: pw, h: ph, x: W * (0.42 - 0.02 * flip) - pw / 2, y: H * 0.78 - ph / 2, r: 0, rot: -0.042 * flip }
        ];
      }
      if (tpl.special === 'filmstrip') {
        const pad = Math.round(W * 0.036);
        const gap = Math.round(W * 0.024);
        const rail = Math.round(W * 0.095);
        const fw = W - rail * 2;
        const fh = Math.round((H - pad * 2 - gap * 2) / 3);
        return [0, 1, 2].map((i) => ({ x: rail, y: pad + i * (fh + gap), w: fw, h: fh, r: Math.round(W * 0.012), rot: 0 }));
      }
      const dense = tpl.count >= 6;
      const pad = Math.round(W * (dense ? 0.024 : 0.034));
      const gap = Math.round(W * (dense ? 0.016 : 0.022));
      const halfGap = gap / 2;
      const rad = Math.round(W * (dense ? 0.014 : 0.024));
      const iw = W - pad * 2, ih = H - pad * 2;
      return tpl.boxes.map(([bx, by, bw, bh]) => {
        const x1 = pad + bx * iw + (bx > 0.001 ? halfGap : 0);
        const y1 = pad + by * ih + (by > 0.001 ? halfGap : 0);
        const x2 = pad + (bx + bw) * iw - (bx + bw < 0.999 ? halfGap : 0);
        const y2 = pad + (by + bh) * ih - (by + bh < 0.999 ? halfGap : 0);
        return {
          x: Math.round(x1),
          y: Math.round(y1),
          w: Math.max(10, Math.round(x2 - x1)),
          h: Math.max(10, Math.round(y2 - y1)),
          r: rad,
          rot: 0
        };
      });
    }

    function arCollageHitSlot(slide, W, H, px, py) {
      const rects = arCollageGetSlotRects(slide, W, H);
      for (let i = rects.length - 1; i >= 0; i--) {
        const rc = rects[i];
        if (rc.isPolaroid) {
          const dx = px - rc.cx, dy = py - rc.cy;
          const ca = Math.cos(-rc.rot), sa = Math.sin(-rc.rot);
          const lx = dx * ca - dy * sa, ly = dx * sa + dy * ca;
          if (Math.abs(lx) <= rc.w / 2 + 12 && Math.abs(ly) <= rc.h / 2 + 24) return i;
        } else {
          if (px >= rc.x && px <= rc.x + rc.w && py >= rc.y && py <= rc.y + rc.h) return i;
        }
      }
      return -1;
    }

    function arCollageBuildSlides(photos, layout) {
      const n = photos.length;
      if (!n) return [];
      const tpl = arCollageGetTemplate(layout);
      const perSlide = Math.max(1, tpl.count || 1);
      const at = (i) => photos[((i % n) + n) % n].img;
      const slides = [];
      const slideCount = Math.max(1, Math.ceil(n / perSlide));
      for (let s = 0; s < slideCount && slides.length < 10; s++) {
        const imgs = [];
        for (let k = 0; k < perSlide; k++) imgs.push(at(s * perSlide + k));
        slides.push({ type: tpl.id, imgs, idx: s });
      }
      return slides;
    }

    function arCollageRenderSlide(canvas, slide, bgTone, slideIdx = 0, showOverlayUI = false) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const tpl = arCollageGetTemplate(slide && slide.type);
      const bgMap = { dark: '#111114', cream: '#f3ece1', white: '#ffffff' };
      ctx.fillStyle = tpl.special === 'filmstrip' ? '#0c0b0a' : (bgMap[bgTone] || '#111114');
      ctx.fillRect(0, 0, W, H);
      if (!slide || !slide.imgs || !slide.imgs.length) return;
      const imgs = slide.imgs;
      const rects = arCollageGetSlotRects(slide, W, H);
      const activeSlot = showOverlayUI ? _arCollageState.activeSlot : -1;

      if (tpl.special === 'filmstrip') {
        const rail = Math.round(W * 0.095);
        ctx.fillStyle = 'rgba(244,238,225,0.22)';
        const holeW = Math.round(rail * 0.44), holeH = Math.round(H * 0.018);
        for (let y = Math.round(H * 0.025); y < H - holeH; y += Math.round(H * 0.045)) {
          ctx.fillRect(Math.round((rail - holeW) / 2), y, holeW, holeH);
          ctx.fillRect(W - rail + Math.round((rail - holeW) / 2), y, holeW, holeH);
        }
      }

      rects.forEach((rc, si) => {
        const im = imgs[si] || imgs[0];
        const ed = arCollageGetEdit(slideIdx, si);
        const isDim = activeSlot >= 0 && activeSlot !== si;
        const isOn = activeSlot === si;
        ctx.save();
        if (isDim) ctx.globalAlpha = 0.42;
        if (rc.isPolaroid) {
          ctx.translate(rc.cx, rc.cy);
          ctx.rotate(rc.rot);
          const b = Math.round(W * 0.022), bot = Math.round(W * 0.074);
          ctx.shadowColor = 'rgba(0,0,0,0.34)';
          ctx.shadowBlur = Math.round(W * 0.045);
          ctx.shadowOffsetY = Math.round(W * 0.02);
          ctx.fillStyle = '#fcfbf8';
          ctx.fillRect(-rc.w / 2 - b, -rc.h / 2 - b, rc.w + b * 2, rc.h + b + bot);
          ctx.shadowColor = 'transparent';
          arCollageDrawCover(ctx, im, -rc.w / 2, -rc.h / 2, rc.w, rc.h, 0, ed);
          if (isOn) {
            ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 4;
            ctx.strokeRect(-rc.w / 2 - 2, -rc.h / 2 - 2, rc.w + 4, rc.h + 4);
          }
        } else {
          arCollageDrawCover(ctx, im, rc.x, rc.y, rc.w, rc.h, rc.r, ed);
          if (isOn) {
            ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 4;
            ctx.strokeRect(rc.x + 2, rc.y + 2, rc.w - 4, rc.h - 4);
          }
        }
        ctx.restore();

        // 편집 모드 UI 배지(미리보기 캔버스 전용 — 완성 이미지에는 절대 안 그려짐)
        if (showOverlayUI) {
          ctx.save();
          const compact = rects.length >= 5 || rc.w < 135;
          const bx = rc.isPolaroid ? rc.cx - rc.w * 0.42 : rc.x + (compact ? 6 : 10);
          const by = rc.isPolaroid ? rc.cy - rc.h * 0.42 : rc.y + (compact ? 6 : 10);
          const label = isOn ? (compact ? `✏️ ${si + 1}` : `✏️ ${si + 1}번 칸 · 드래그`) : `${si + 1}`;
          ctx.font = compact ? '700 11px Pretendard, sans-serif' : '700 12px Pretendard, sans-serif';
          const bh = compact ? 18 : 22;
          const tw = ctx.measureText(label).width + (compact ? 11 : 14);
          ctx.fillStyle = isOn ? '#2563eb' : 'rgba(0,0,0,0.68)';
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(bx, by, tw, bh, bh / 2) : ctx.rect(bx, by, tw, bh);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(label, bx + (compact ? 5.5 : 7), by + bh / 2);
          ctx.restore();
        }
      });
    }

    function arCollageBindCanvasPointer() {
      const cv = document.getElementById('arCollagePreviewCanvas');
      if (!cv || cv.dataset.arCollageBound) return;
      cv.dataset.arCollageBound = '1';
      let lpTimer = 0;
      let dragging = false;
      let startX = 0, startY = 0, origPanX = 0, origPanY = 0;
      let activeRect = null;
      let pinchStartDist = 0, pinchStartScale = 1;
      const pointers = new Map();

      const getCanvasPt = (ev) => {
        const br = cv.getBoundingClientRect();
        return {
          x: ((ev.clientX - br.left) / Math.max(1, br.width)) * cv.width,
          y: ((ev.clientY - br.top) / Math.max(1, br.height)) * cv.height
        };
      };

      cv.addEventListener('pointerdown', (ev) => {
        const slides = arCollageBuildSlides(_arCollageState.photos, _arCollageState.layout);
        if (!slides.length) return;
        const slide = slides[_arCollageState.previewIdx];
        if (!slide) return;
        cv.setPointerCapture?.(ev.pointerId);
        const pt = getCanvasPt(ev);
        pointers.set(ev.pointerId, pt);

        // 2손가락 핀치 확대
        if (pointers.size === 2 && _arCollageState.activeSlot >= 0) {
          clearTimeout(lpTimer); lpTimer = 0; dragging = false;
          const [p1, p2] = Array.from(pointers.values());
          pinchStartDist = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
          pinchStartScale = arCollageGetEdit(_arCollageState.previewIdx, _arCollageState.activeSlot).scale || 1;
          return;
        }

        const hit = arCollageHitSlot(slide, cv.width, cv.height, pt.x, pt.y);
        if (hit < 0) return;

        // 이미 편집 중인 칸을 누르면 즉시 드래그 패닝 시작!
        if (_arCollageState.activeSlot === hit) {
          dragging = true;
          startX = pt.x; startY = pt.y;
          const ed = arCollageGetEdit(_arCollageState.previewIdx, hit);
          origPanX = ed.panX || 0; origPanY = ed.panY || 0;
          activeRect = arCollageGetSlotRects(slide, cv.width, cv.height)[hit];
          return;
        }

        // 다른 칸을 꾹 누르면(320ms) 그 칸의 개별 편집 모드로 진입!
        clearTimeout(lpTimer);
        startX = pt.x; startY = pt.y;
        lpTimer = setTimeout(() => {
          lpTimer = 0;
          if (navigator.vibrate) { try { navigator.vibrate(18); } catch (_) {} }
          arCollageEnterSlotEdit(hit);
          dragging = true;
          const ed = arCollageGetEdit(_arCollageState.previewIdx, hit);
          origPanX = ed.panX || 0; origPanY = ed.panY || 0;
          activeRect = arCollageGetSlotRects(slide, cv.width, cv.height)[hit];
        }, 320);
      });

      cv.addEventListener('pointermove', (ev) => {
        const pt = getCanvasPt(ev);
        if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, pt);
        if (pointers.size === 2 && _arCollageState.activeSlot >= 0 && pinchStartDist > 0) {
          const [p1, p2] = Array.from(pointers.values());
          const curDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const nextSc = Math.max(1, Math.min(2.6, +(pinchStartScale * (curDist / pinchStartDist)).toFixed(2)));
          arCollageUpdateActiveSlot('scale', nextSc);
          return;
        }
        if (lpTimer && Math.hypot(pt.x - startX, pt.y - startY) > 14) {
          clearTimeout(lpTimer); lpTimer = 0;
        }
        if (!dragging || _arCollageState.activeSlot < 0 || !activeRect) return;
        const dx = (pt.x - startX) / Math.max(40, activeRect.w);
        const dy = (pt.y - startY) / Math.max(40, activeRect.h);
        arCollageSetEdit(_arCollageState.previewIdx, _arCollageState.activeSlot, {
          panX: Math.max(-0.65, Math.min(0.65, origPanX + dx)),
          panY: Math.max(-0.65, Math.min(0.65, origPanY + dy))
        });
        arCollageRefreshUI();
      });

      const endPtr = (ev) => {
        pointers.delete(ev.pointerId);
        if (pointers.size < 2) pinchStartDist = 0;
        clearTimeout(lpTimer); lpTimer = 0;
        dragging = false;
      };
      cv.addEventListener('pointerup', endPtr);
      cv.addEventListener('pointercancel', endPtr);
      cv.addEventListener('contextmenu', (ev) => ev.preventDefault());
      cv.addEventListener('wheel', (ev) => {
        if (_arCollageState.activeSlot < 0) return;
        ev.preventDefault();
        const cur = arCollageGetEdit(_arCollageState.previewIdx, _arCollageState.activeSlot).scale || 1;
        const next = Math.max(1, Math.min(2.6, +(cur + (ev.deltaY < 0 ? 0.08 : -0.08)).toFixed(2)));
        arCollageUpdateActiveSlot('scale', next);
      }, { passive: false });
    }

    function arCollageEnterSlotEdit(slotIdx) {
      _arCollageState.activeSlot = slotIdx;
      arCollageRefreshUI();
    }
    function arCollageExitSlotEdit() {
      _arCollageState.activeSlot = -1;
      arCollageRefreshUI();
    }
    function arCollageUpdateActiveSlot(prop, val) {
      if (_arCollageState.activeSlot < 0) return;
      arCollageSetEdit(_arCollageState.previewIdx, _arCollageState.activeSlot, { [prop]: val });
      arCollageRefreshUI();
    }
    function arCollageNudgeSlotRot(delta) {
      if (_arCollageState.activeSlot < 0) return;
      const cur = arCollageGetEdit(_arCollageState.previewIdx, _arCollageState.activeSlot).rot || 0;
      const next = Math.max(-25, Math.min(25, cur + delta));
      arCollageUpdateActiveSlot('rot', next);
    }
    function arCollageToggleSlotFlip() {
      if (_arCollageState.activeSlot < 0) return;
      const cur = Boolean(arCollageGetEdit(_arCollageState.previewIdx, _arCollageState.activeSlot).flipX);
      arCollageUpdateActiveSlot('flipX', !cur);
    }
    function arCollageResetActiveSlot() {
      if (_arCollageState.activeSlot < 0) return;
      delete _arCollageState.slotEdits[arCollageEditKey(_arCollageState.previewIdx, _arCollageState.activeSlot)];
      arCollageRefreshUI();
    }
    async function arCollageReplaceActiveSlotFile(ev) {
      const f = ev?.target?.files?.[0];
      if (ev?.target) ev.target.value = '';
      if (!f || _arCollageState.activeSlot < 0) return;
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(f);
        });
        const im = new Image(); im.src = dataUrl; im._dataUrl = dataUrl;
        await im.decode();
        arCollageSetEdit(_arCollageState.previewIdx, _arCollageState.activeSlot, { imgOverride: im, scale: 1, panX: 0, panY: 0, rot: 0, flipX: false });
        if (typeof window.arVaultSaveImages === 'function') window.arVaultSaveImages([im], 'upload');
        arCollageRefreshUI();
      } catch (_) {}
    }

    function arCollageRefreshUI() {
      const listEl = document.getElementById('arCollageSelectedList');
      const cntEl = document.getElementById('arCollagePickCount');
      const hintEl = document.getElementById('arCollageEmptyHint');
      const metaEl = document.getElementById('arCollageSlideMeta');
      const pillsEl = document.getElementById('arCollageSlotPills');
      const editBar = document.getElementById('arCollageSlotEditBar');
      const editTitle = document.getElementById('arCollageSlotEditTitle');
      const scIn = document.getElementById('arCollageSlotScale');
      const scVal = document.getElementById('arCollageSlotScaleVal');
      const slotHint = document.getElementById('arCollageSlotHint');
      const cv = document.getElementById('arCollagePreviewCanvas');
      const n = _arCollageState.photos.length;
      if (cntEl) cntEl.textContent = `${n}/${AR_COLLAGE_MAX_PHOTOS}`;
      hintEl?.classList.toggle('hidden', n > 0);
      arCollageRenderLayoutPicker();
      if (listEl) {
        if (!n) {
          listEl.innerHTML = '<div class="text-[11.5px] text-[#71717a] px-2">아직 선택한 사진이 없습니다. [+ 사진 불러오기]나 아래 보관함에서 눌러 추가해 주세요.</div>';
        } else {
          listEl.replaceChildren();
          _arCollageState.photos.forEach((p, idx) => {
            const card = document.createElement('div');
            card.style.cssText = 'position:relative;flex:0 0 auto;width:58px;height:78px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.16);background:#18181b;';
            const im = document.createElement('img');
            im.src = p.src;
            im.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
            const num = document.createElement('span');
            num.textContent = String(idx + 1);
            num.style.cssText = 'position:absolute;left:3px;top:3px;background:rgba(0,0,0,0.75);color:#fff;font-size:10px;font-weight:700;padding:0 5px;border-radius:999px;';
            const del = document.createElement('button');
            del.type = 'button'; del.textContent = '×';
            del.style.cssText = 'position:absolute;right:2px;top:2px;width:18px;height:18px;border-radius:999px;background:rgba(0,0,0,0.75);color:#f87171;border:0;font-size:12px;line-height:1;cursor:pointer;';
            del.onclick = () => { _arCollageState.photos.splice(idx, 1); _arCollageState.activeSlot = -1; arCollageAutoMatchCount(); arCollageRefreshUI(); };
            card.append(im, num, del);
            listEl.appendChild(card);
          });
        }
      }
      const slides = arCollageBuildSlides(_arCollageState.photos, _arCollageState.layout);
      document.getElementById('arCollageSlideNav').hidden = slides.length < 2 || Boolean(arCollageEditingCut);
      if (!slides.length) {
        if (metaEl) metaEl.textContent = '0컷 · 0.0초';
        if (pillsEl) pillsEl.innerHTML = '';
        if (editBar) editBar.classList.add('hidden');
        if (cv) { const g = cv.getContext('2d'); g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, cv.width, cv.height); }
        return;
      }
      _arCollageState.previewIdx = ((_arCollageState.previewIdx % slides.length) + slides.length) % slides.length;
      const curSlide = slides[_arCollageState.previewIdx];
      const slotCount = arCollageGetSlotRects(curSlide, 360, 640).length;
      if (_arCollageState.activeSlot >= slotCount) _arCollageState.activeSlot = -1;
      if (metaEl) metaEl.textContent = `${_arCollageState.previewIdx + 1}/${slides.length}컷 · ${(slides.length * _arCollageState.cutSec).toFixed(1)}초`;
      if (pillsEl) {
        const compactPill = slotCount >= 6;
        pillsEl.innerHTML = Array.from({ length: slotCount }, (_, si) => {
          const on = _arCollageState.activeSlot === si;
          const lbl = compactPill ? `${si + 1}${on ? '✓' : '번'}` : `${si + 1}번 칸${on ? ' 편집중' : ''}`;
          return `<button type="button" onclick="${on ? 'arCollageExitSlotEdit()' : `arCollageEnterSlotEdit(${si})`}" class="px-2 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer ${on ? 'bg-[#2563eb] text-white border-[#60a5fa]' : 'bg-[#1c1c21] text-[#a1a1aa] border-white/10'}">${lbl}</button>`;
        }).join('');
      }
      if (editBar) {
        const editing = _arCollageState.activeSlot >= 0;
        editBar.classList.toggle('hidden', !editing);
        if (slotHint) {
          slotHint.innerHTML = editing
            ? `✏️ <strong>${_arCollageState.activeSlot + 1}번 칸</strong>을 드래그해서 위치를 맞추고 확대·회전하세요`
            : '💡 각 사진 칸을 <strong>꾹 누르면</strong> 그 칸만 확대·이동·교체할 수 있어요';
        }
        if (editing) {
          const ed = arCollageGetEdit(_arCollageState.previewIdx, _arCollageState.activeSlot);
          if (editTitle) editTitle.textContent = `✏️ ${_arCollageState.activeSlot + 1}번 칸 편집 모드${ed.rot ? ` (${ed.rot}°)` : ''}`;
          if (scIn) scIn.value = String(ed.scale || 1);
          if (scVal) scVal.textContent = `${Math.round((ed.scale || 1) * 100)}%`;
        }
      }
      if (cv) arCollageRenderSlide(cv, curSlide, _arCollageState.bg, _arCollageState.previewIdx, true);
    }

    async function arOpenPhotoCollageModal(jumpSlideIdx) {
      const modal = document.getElementById('arPhotoCollageModal');
      if (!modal) return;
      if (typeof arPauseForStudioEdit === 'function') arPauseForStudioEdit();
      if (Number.isInteger(jumpSlideIdx) && jumpSlideIdx >= 0) {
        if (!arCollageCanEditSlots(jumpSlideIdx)) {
          arToast('이 컷의 원본 콜라주 사진을 찾을 수 없어요.');
          return;
        }
        const photo = campaign.uploadedPhotos[campaign.scenePlan[jumpSlideIdx].photoIdx];
        const source = arCollageSources.get(photo);
        arCollageEditingCut = {index: jumpSlideIdx, builder: {..._arCollageState}};
        Object.assign(_arCollageState, source, {slotEdits: {...source.slotEdits}});
      }
      modal.querySelectorAll('[data-collage-batch]').forEach(el => el.classList.toggle('hidden', Boolean(arCollageEditingCut)));
      document.getElementById('arCollageApplyBtn').textContent = arCollageEditingCut ? '이 컷에 적용 →' : '콜라주 완성 · 컷 편집 →';
      _arCollageState.activeSlot = -1;
      modal.classList.remove('hidden');
      arCollageBindCanvasPointer();
      arCollageRefreshUI();
      const vWrap = document.getElementById('arCollageVaultWrap');
      const vStrip = document.getElementById('arCollageVaultStrip');
      if (vWrap && vStrip && typeof window.arVaultGetAll === 'function') {
        try {
          const all = await window.arVaultGetAll();
          if (all && all.length) {
            vWrap.classList.remove('hidden');
            vStrip.replaceChildren();
            all.slice(0, 24).forEach((item) => {
              const b = document.createElement('button');
              b.type = 'button';
              b.style.cssText = 'flex:0 0 auto;width:48px;height:64px;border-radius:7px;overflow:hidden;border:1px solid rgba(255,255,255,0.16);padding:0;background:#18181b;cursor:pointer;';
              const im = document.createElement('img');
              im.src = item.src;
              im.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
              b.appendChild(im);
              b.onclick = async () => {
                const loaded = new Image();
                loaded.src = item.src;
                try { await loaded.decode(); } catch (_) {}
                // 개별 칸 편집 모드 중 보관함 사진을 누르면 그 칸 사진만 바로 교체!
                if (_arCollageState.activeSlot >= 0) {
                  arCollageSetEdit(_arCollageState.previewIdx, _arCollageState.activeSlot, { imgOverride: loaded, scale: 1, panX: 0, panY: 0, rot: 0, flipX: false });
                  arCollageRefreshUI();
                  if (typeof arToast === 'function') arToast(`${_arCollageState.activeSlot + 1}번 칸 사진을 바꿨어요.`, true);
                  return;
                }
                if (_arCollageState.photos.length >= AR_COLLAGE_MAX_PHOTOS) { if (typeof arToast === 'function') arToast(`최대 ${AR_COLLAGE_MAX_PHOTOS}장까지 고를 수 있어요.`); return; }
                _arCollageState.photos.push({ id: item.id + '_' + Date.now(), img: loaded, src: item.src, fromVault: true });
                arCollageAutoMatchCount();
                arCollageRefreshUI();
              };
              vStrip.appendChild(b);
            });
          } else {
            vWrap.classList.add('hidden');
          }
        } catch (_) {}
      }
    }
    function arClosePhotoCollageModal() {
      _arCollageState.activeSlot = -1;
      if (arCollageEditingCut) {
        Object.assign(_arCollageState, arCollageEditingCut.builder);
        arCollageEditingCut = null;
      }
      document.getElementById('arPhotoCollageModal')?.classList.add('hidden');
    }
    async function arCollageHandleFiles(ev) {
      const files = Array.from(ev?.target?.files || []);
      if (ev?.target) ev.target.value = '';
      if (!files.length) return;
      const newUploaded = [];
      let reachedLimit = false;
      for (const f of files) {
        if (_arCollageState.photos.length >= AR_COLLAGE_MAX_PHOTOS) {
          reachedLimit = true;
          break;
        }
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(f);
          });
          const im = new Image();
          im.src = dataUrl;
          im._dataUrl = dataUrl;
          im._label = f.name || '내 사진';
          await im.decode();
          if (_arCollageState.photos.length >= AR_COLLAGE_MAX_PHOTOS) {
            reachedLimit = true;
            break;
          }
          _arCollageState.photos.push({ id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), img: im, src: dataUrl, fromVault: false });
          newUploaded.push(im);
        } catch (_) {}
      }
      if (newUploaded.length && typeof window.arVaultSaveImages === 'function') {
        window.arVaultSaveImages(newUploaded, 'upload');
      }
      arCollageAutoMatchCount();
      arCollageRefreshUI();
      if (reachedLimit && typeof arToast === 'function') arToast(`최대 ${AR_COLLAGE_MAX_PHOTOS}장까지 고를 수 있어요.`);
    }
    function arCollageClearPhotos() {
      _arCollageState.photos = [];
      _arCollageState.previewIdx = 0;
      _arCollageState.activeSlot = -1;
      _arCollageState.slotEdits = {};
      _arCollageState.userPickedLayout = false;
      arCollageRefreshUI();
    }
    function arCollageStepPreview(delta) { _arCollageState.previewIdx += delta; _arCollageState.activeSlot = -1; arCollageRefreshUI(); }
    function arCollageSetCountTab(cnt) {
      const n = Math.max(1, Math.min(9, Number(cnt) || 2));
      _arCollageState.countTab = n;
      _arCollageState.userPickedLayout = true;
      const curTpl = arCollageGetTemplate(_arCollageState.layout);
      if (curTpl.count !== n) {
        const first = AR_COLLAGE_TEMPLATES.find((t) => t.count === n);
        if (first) _arCollageState.layout = first.id;
      }
      _arCollageState.previewIdx = 0;
      _arCollageState.activeSlot = -1;
      arCollageRefreshUI();
    }
    function arCollageSetLayout(layout) {
      const tpl = arCollageGetTemplate(layout);
      _arCollageState.layout = tpl.id;
      _arCollageState.countTab = tpl.count;
      _arCollageState.userPickedLayout = true;
      _arCollageState.previewIdx = 0;
      _arCollageState.activeSlot = -1;
      arCollageRefreshUI();
    }
    function arCollageSetBg(bg) {
      _arCollageState.bg = bg;
      document.querySelectorAll('#arPhotoCollageModal [data-cl-bg]').forEach((b) => b.classList.toggle('active', b.dataset.clBg === bg));
      arCollageRefreshUI();
    }
    function arCollageSetDur(sec) {
      _arCollageState.cutSec = Number(sec) || 10;
      document.querySelectorAll('#arPhotoCollageModal [data-cl-dur]').forEach((b) => b.classList.toggle('active', Number(b.dataset.clDur) === _arCollageState.cutSec));
      arCollageRefreshUI();
    }

    async function arApplyPhotoCollageToStudio() {
      if (!_arCollageState.photos.length) {
        if (typeof arToast === 'function') arToast('먼저 콜라주에 넣을 사진을 1장 이상 골라 주세요.');
        return;
      }
      const btn = document.getElementById('arCollageApplyBtn');
      if (btn) { btn.disabled = true; btn.textContent = '콜라주 만드는 중...'; }
      try {
        const slides = arCollageBuildSlides(_arCollageState.photos, _arCollageState.layout);
        const includeScript = Boolean(document.getElementById('arCollageIncludeScript')?.checked);
        const includeCard = Boolean(document.getElementById('arCollageIncludeCard')?.checked);
        const outImgs = [];
        const off = document.createElement('canvas');
        off.width = 720; off.height = 1280;
        for (let i = 0; i < slides.length; i++) {
          arCollageRenderSlide(off, slides[i], _arCollageState.bg, i, false);
          const url = off.toDataURL('image/jpeg', 0.90);
          const im = new Image();
          im.src = url;
          im._dataUrl = url;
          im._skipVault = true;
          im._label = `콜라주 ${i + 1}컷`;
          await im.decode();
          arCollageRememberSource(im, slides[i], i);
          outImgs.push(im);
        }
        if (arCollageEditingCut) {
          const cut = arCollageEditingCut.index;
          const plan = campaign.scenePlan[cut];
          const photoIdx = plan.photoIdx;
          if (campaign.scenePlan.some((p, i) => i !== cut && p?.photoIdx === photoIdx)) {
            plan.photoIdx = campaign.uploadedPhotos.push(outImgs[0]) - 1;
          } else {
            arReleasePhoto(campaign.uploadedPhotos[photoIdx]);
            campaign.uploadedPhotos[photoIdx] = outImgs[0];
          }
          if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
          if (typeof renderUploadedPhotoThumbs === 'function') renderUploadedPhotoThumbs();
          if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
          arClosePhotoCollageModal();
          openCutEditor(cut, 'photo');
          return;
        }
        (campaign.uploadedPhotos || []).forEach(arReleasePhoto);
        campaign.uploadedPhotos = outImgs;
        campaign.isUserCustomPhotos = true;
        campaign.isPhotoCollageMode = true;
        campaign._collageCutSec = _arCollageState.cutSec;
        campaign.cutLenScale = [];
        campaign.cutCountOverride = outImgs.length;
        campaign.hasCustomVideo = false;
        campaign.scenePlan = outImgs.map((_, i) => ({ photoIdx: i }));
        if (typeof cutElementOverrides !== 'undefined' && cutElementOverrides) {
          Object.keys(cutElementOverrides).forEach((k) => { if (cutElementOverrides[k]) delete cutElementOverrides[k].photo; });
        }
        campaign.hideCardOnVideo = !includeCard;
        campaign.noDefaultCaptions = !includeScript;

        if (!includeScript) {
          if (Array.isArray(campaign.cutCaptions) && campaign.cutCaptions.some((x) => String(x || '').trim())) {
            campaign._stashedCaptions = campaign.cutCaptions.slice();
            campaign._stashedHook = campaign.hook || '';
          }
          campaign.hook = '';
          campaign.sub = '';
          campaign.priceTag = '';
          campaign.cutCaptions = Array.from({ length: outImgs.length }, () => '');
          campaign.ttsLines = Array.from({ length: outImgs.length }, () => '');
          if (typeof AudioEngine !== 'undefined') {
            AudioEngine.ttsVoice = 'off';
            AudioEngine.masterBuffer = null;
            AudioEngine.masterDuration = 0;
            AudioEngine.ttsDirty = false;
            const vSel = document.getElementById('ttsVoiceSelect');
            if (vSel) vSel.value = 'off';
          }
        }
        const mainD = Math.max(2, +(outImgs.length * _arCollageState.cutSec).toFixed(2));
        const outroD = includeCard ? 3.2 : 0;
        if (typeof OUTRO_DURATION !== 'undefined') OUTRO_DURATION = outroD;
        if (typeof BASE_DURATION !== 'undefined') BASE_DURATION = +(mainD + outroD).toFixed(2);
        if (typeof CUT_LENGTHS !== 'undefined') CUT_LENGTHS = Array.from({ length: outImgs.length }, () => _arCollageState.cutSec);
        if (typeof TOTAL_DURATION !== 'undefined') TOTAL_DURATION = +(mainD + outroD).toFixed(2);
        if (window.__timelines && window.__timelines.main) window.__timelines.main.duration = TOTAL_DURATION;
        if (typeof updateDurationIndicator === 'function') updateDurationIndicator();
        if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
        if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
        if (typeof renderUploadedPhotoThumbs === 'function') renderUploadedPhotoThumbs();
        if (typeof designThumbCache !== 'undefined' && designThumbCache) designThumbCache.fresh = {};
        if (typeof scheduleDesignThumbs === 'function') scheduleDesignThumbs();
        arSyncEditedVideoOptionUI();
        arClosePhotoCollageModal();
        if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(0);
        openCutEditor(0, 'caption');
      } catch (e) {
        if (typeof arToast === 'function') arToast('콜라주를 만들지 못했어요. 다른 사진으로 다시 시도해 주세요.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '콜라주 완성 · 컷 편집 →'; }
      }
    }

    if (typeof window !== 'undefined') {
      window.arOpenPhotoCollageModal = arOpenPhotoCollageModal;
      window.arClosePhotoCollageModal = arClosePhotoCollageModal;
      window.arCollageHandleFiles = arCollageHandleFiles;
      window.arCollageClearPhotos = arCollageClearPhotos;
      window.arCollageStepPreview = arCollageStepPreview;
      window.arCollageSetCountTab = arCollageSetCountTab;
      window.arCollageSetLayout = arCollageSetLayout;
      window.arCollageSetBg = arCollageSetBg;
      window.arCollageSetDur = arCollageSetDur;
      window.arCollageEnterSlotEdit = arCollageEnterSlotEdit;
      window.arCollageExitSlotEdit = arCollageExitSlotEdit;
      window.arCollageUpdateActiveSlot = arCollageUpdateActiveSlot;
      window.arCollageNudgeSlotRot = arCollageNudgeSlotRot;
      window.arCollageToggleSlotFlip = arCollageToggleSlotFlip;
      window.arCollageResetActiveSlot = arCollageResetActiveSlot;
      window.arCollageReplaceActiveSlotFile = arCollageReplaceActiveSlotFile;
      window.arApplyPhotoCollageToStudio = arApplyPhotoCollageToStudio;
    }

    // ★ 인스타 카드뉴스(캐러셀) 스튜디오 (사진 포함 시각 미리보기 템플릿 8종 · 디자인 MD · 레퍼런스 색감 추출 · 트윅 · 8가지 사진 배치 · 코멘트 수정)
    const AR_CN_BRAND_STORAGE_KEY = 'ar_cardnews_brand_v1';
    const AR_CN_IMG_CACHE = {};
    function arCnLoadImgUrl(url, onReady) {
      if (!url) return null;
      const hit = AR_CN_IMG_CACHE[url];
      if (hit) {
        if (hit.complete && hit.naturalWidth) return hit;
        if (onReady) hit._cbs && hit._cbs.push(onReady);
        return null;
      }
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im._cbs = onReady ? [onReady] : [];
      im.onload = () => {
        const cbs = im._cbs.slice(); im._cbs = [];
        cbs.forEach((fn) => { try { fn(im); } catch (_) {} });
      };
      im.src = url;
      AR_CN_IMG_CACHE[url] = im;
      return null;
    }

    const AR_CN_FONTS = [
      // 임팩트 · 포스터 · 바이럴 볼드 (상업용 무료)
      { key: 'pretM', label: '프리텐다드' },
      { key: 'freesentation', label: '프리젠테이션' },
      { key: 'paperlogy', label: '페이퍼로지' },
      { key: 'suite', label: '스위트 헤비' },
      { key: 'gmarket', label: '지마켓산스' },
      { key: 'aggro', label: '어그로 볼드' },
      { key: 'jalnan', label: '잘난체' },
      { key: 'blackhansans', label: '검은고딕' },
      { key: 'gasoekone', label: '가석원 울트라' },
      { key: 'gangwon', label: '강원파워' },
      { key: 'lineseed', label: '라인 시드' },
      { key: 'ibmplex', label: 'IBM 플렉스' },
      { key: 'tenada', label: '테나다 볼드' },
      { key: 'cafe24ohsquare', label: '카페24 아네모네' },
      { key: 'cafe24', label: '카페24 둥근' },
      { key: 'bagel', label: '베이글 팻' },
      { key: 'dohyeon', label: '배민 도현체' },
      { key: 'jua', label: '배민 주아체' },
      // 에디토리얼 · 신문 · 감성 명조 (상업용 무료)
      { key: 'hahmlet', label: '함렛 명조' },
      { key: 'serif7', label: '본명조 볼드' },
      { key: 'chosun', label: '조선일보명조' },
      { key: 'songmyung', label: '송명 세리프' },
      { key: 'maru', label: '마루부리' },
      { key: 'diphylleia', label: '디필레이아' },
      { key: 'grandiflora', label: '그란디플로라' },
      { key: 'gowun', label: '고운바탕' },
      { key: 'batang', label: '고운바탕 볼드' },
      { key: 'dodum', label: '고운돋움' },
      // 테크 · 레트로 · 개성 디스플레이 (상업용 무료)
      { key: 'orbit', label: '오르빗 테크' },
      { key: 'gugi', label: '구기체' },
      { key: 'sunflower', label: '해바라기' },
      { key: 'bwpicture', label: '흑백사진체' },
      { key: 'stylish', label: '스타일리시' },
      { key: 'moirai', label: '모이라이' },
      // 손글씨 · 붓글씨 · 캘리 (상업용 무료)
      { key: 'pen', label: '나눔펜 손글씨' },
      { key: 'brush', label: '나눔붓글씨' },
      { key: 'dokdo', label: '독도 캘리' },
      { key: 'kirang', label: '기랑해랑' },
      { key: 'yeonsung', label: '연성체' },
      { key: 'gaegu', label: '개구체' }
    ];
    function arCnFontSpec(key) {
      const k = String(key || 'pretM');
      if (typeof KIT_FONTS !== 'undefined' && KIT_FONTS[k]) {
        return { family: KIT_FONTS[k].f, weight: KIT_FONTS[k].w || 700, mul: Math.min(1.22, KIT_FONTS[k].k || 1) };
      }
      return { family: "'Pretendard', sans-serif", weight: 700, mul: 1 };
    }
    const _arCnFontTriggered = {};
    function arCnEnsureFont(key, cb) {
      if (!key || typeof kitEnsureFont !== 'function') return;
      if (_arCnFontTriggered[key]) return;
      _arCnFontTriggered[key] = true;
      Promise.resolve(kitEnsureFont(key)).then(() => {
        if (cb) cb();
      }).catch(() => {});
    }

    const AR_CN_GRADIENTS = [
      { id: 'sunset_peach', name: '선셋 피치', stops: ['#fff7ed', '#fed7aa', '#fda4af'], mesh: [{ x: 0.85, y: 0.15, r: 0.65, c: 'rgba(251,146,60,0.34)' }, { x: 0.15, y: 0.85, r: 0.6, c: 'rgba(244,114,182,0.28)' }], dark: false, fg: '#2b1815', accent: '#c2410c' },
      { id: 'apple_aura', name: '애플 오라', stops: ['#ffffff', '#eef6ff', '#ede9fe'], mesh: [{ x: 0.2, y: 0.18, r: 0.65, c: 'rgba(56,189,248,0.26)' }, { x: 0.84, y: 0.8, r: 0.62, c: 'rgba(167,139,250,0.26)' }], dark: false, fg: '#141824', accent: '#0071e3' },
      { id: 'midnight_cobalt', name: '미드나잇 코발트', stops: ['#060914', '#0f2254', '#163570'], mesh: [{ x: 0.82, y: 0.16, r: 0.68, c: 'rgba(56,189,248,0.30)' }, { x: 0.18, y: 0.84, r: 0.6, c: 'rgba(99,102,241,0.28)' }], dark: true, fg: '#f8fafc', accent: '#38bdf8' },
      { id: 'amber_cinema', name: '앰버 골드', stops: ['#120d0a', '#2c1810', '#4a2511'], mesh: [{ x: 0.78, y: 0.22, r: 0.68, c: 'rgba(245,158,11,0.34)' }, { x: 0.2, y: 0.86, r: 0.55, c: 'rgba(217,119,6,0.24)' }], dark: true, fg: '#faf3e6', accent: '#f59e0b' },
      { id: 'matcha_mist', name: '말차 민트', stops: ['#f6faf5', '#dcfce7', '#ccfbf1'], mesh: [{ x: 0.18, y: 0.2, r: 0.62, c: 'rgba(74,222,128,0.24)' }, { x: 0.82, y: 0.82, r: 0.6, c: 'rgba(45,212,191,0.26)' }], dark: false, fg: '#132a1e', accent: '#15803d' },
      { id: 'rose_silk', name: '로즈 실크', stops: ['#fff5f7', '#fce7f3', '#ffe4e6'], mesh: [{ x: 0.82, y: 0.22, r: 0.65, c: 'rgba(244,114,182,0.28)' }, { x: 0.16, y: 0.78, r: 0.58, c: 'rgba(251,191,36,0.18)' }], dark: false, fg: '#2c131a', accent: '#be185d' },
      { id: 'terracotta_sun', name: '테라코타 노을', stops: ['#fbf5ec', '#f3ddc1', '#e8bfa0'], mesh: [{ x: 0.8, y: 0.18, r: 0.65, c: 'rgba(194,96,63,0.30)' }, { x: 0.18, y: 0.85, r: 0.58, c: 'rgba(217,119,6,0.22)' }], dark: false, fg: '#2b1b13', accent: '#b45309' },
      { id: 'emerald_glass', name: '에메랄드 딥', stops: ['#051512', '#0a2e28', '#114b42'], mesh: [{ x: 0.8, y: 0.2, r: 0.66, c: 'rgba(52,211,153,0.28)' }, { x: 0.2, y: 0.84, r: 0.58, c: 'rgba(20,184,166,0.26)' }], dark: true, fg: '#ecfdf5', accent: '#34d399' },
      { id: 'butter_lemon', name: '버터 레몬', stops: ['#fefce8', '#fef08a', '#fed7aa'], mesh: [{ x: 0.22, y: 0.2, r: 0.6, c: 'rgba(250,204,21,0.34)' }, { x: 0.82, y: 0.8, r: 0.6, c: 'rgba(251,146,60,0.24)' }], dark: false, fg: '#291f0e', accent: '#b45309' },
      { id: 'obsidian_crimson', name: '옵시디언 와인', stops: ['#0b090c', '#240c16', '#3d1020'], mesh: [{ x: 0.82, y: 0.2, r: 0.66, c: 'rgba(225,29,72,0.34)' }, { x: 0.18, y: 0.82, r: 0.6, c: 'rgba(249,115,22,0.22)' }], dark: true, fg: '#fff1f2', accent: '#fb7185' },
      { id: 'ocean_breeze', name: '오션 브리즈', stops: ['#f0f9ff', '#bae6fd', '#c7d2fe'], mesh: [{ x: 0.2, y: 0.2, r: 0.65, c: 'rgba(14,165,233,0.28)' }, { x: 0.82, y: 0.8, r: 0.6, c: 'rgba(99,102,241,0.24)' }], dark: false, fg: '#0f172a', accent: '#0284c7' },
      { id: 'noir_silver', name: '느와르 실버', stops: ['#0a0a0c', '#1c1d24', '#2d303c'], mesh: [{ x: 0.8, y: 0.15, r: 0.65, c: 'rgba(226,232,240,0.18)' }, { x: 0.2, y: 0.85, r: 0.6, c: 'rgba(148,163,184,0.16)' }], dark: true, fg: '#f8fafc', accent: '#e2e8f0' }
    ];
    function arHexToRgba(hex, alpha) {
      const m = String(hex || '').replace('#', '');
      if (m.length !== 6) return `rgba(20,20,24,${alpha})`;
      const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    function arCnGetGradient(id) {
      return AR_CN_GRADIENTS.find((g) => g.id === id) || null;
    }
    function arCnDrawGradientBg(ctx, W, H, gSpec) {
      if (!gSpec || !Array.isArray(gSpec.stops) || gSpec.stops.length < 2) return false;
      const lg = ctx.createLinearGradient(0, 0, W * 0.85, H);
      const last = gSpec.stops.length - 1;
      gSpec.stops.forEach((col, i) => lg.addColorStop(i / Math.max(1, last), col));
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
      if (Array.isArray(gSpec.mesh)) {
        gSpec.mesh.forEach((m) => {
          const rg = ctx.createRadialGradient(W * m.x, H * m.y, 10, W * m.x, H * m.y, W * (m.r || 0.62));
          rg.addColorStop(0, m.c);
          rg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = rg;
          ctx.fillRect(0, 0, W, H);
        });
      }
      return true;
    }

    function arCnDrawCircularStamp(ctx, cx, cy, r, text, color, sc) {
      const str = String(text || 'BRAND · STUDIO · ARCHIVE · ');
      ctx.save();
      ctx.translate(cx, cy);
      ctx.font = `700 ${Math.round(16 * sc)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const step = (Math.PI * 2) / Math.max(12, str.length);
      for (let i = 0; i < str.length; i++) {
        ctx.save();
        ctx.rotate(i * step - Math.PI / 2);
        ctx.fillText(str[i], 0, -r);
        ctx.restore();
      }
      ctx.restore();
    }
    function arCnDrawDotMatrix(ctx, x, y, cols, rows, gap, color, sc) {
      ctx.save();
      ctx.fillStyle = color;
      const dr = Math.max(1.2, 3.2 * sc);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.beginPath();
          ctx.arc(x + c * gap, y + r * gap, dr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    const AR_CN_TEMPLATES = [
      // 바이럴 (26종 — 브랜드 앱/핀테크 팩 · 체커보드 · 45° 사선 슬래시 · 2×2 벤토 · 다이아 포스터 + 한국 바이럴!)
      { id: 'brand_yellow_chips', cat: '바이럴', name: '옐로우 라인칩 스플릿', bg: '#ffc800', card: '#0d0d0d', fg: '#0d0d0d', muted: '#1f1f22', accent: '#0d0d0d', pillBg: '#0d0d0d', pillFg: '#ffffff', fontKey: 'suite', style: 'swiss', coverLayout: 'photo_brand_chiptags', bodyLayout: 'photo_brand_chiptags', samplePhoto: '/assets/scenes/shop/6.jpg', scenePack: 'shop', sampleTitle: '부담은 절반으로\n혜택은 두 배로' },
      { id: 'brand_phone_banner', cat: '바이럴', name: '화이트 폰 플로팅 배너', bg: '#ffffff', card: '#f4f4f5', fg: '#0d0d0d', muted: '#3f3f46', accent: '#ffc800', pillBg: '#0d0d0d', pillFg: '#ffffff', fontKey: 'lineseed', style: 'minimal', coverLayout: 'photo_phone_banner', bodyLayout: 'photo_phone_banner', samplePhoto: '/assets/scenes/cafe/9.jpg', scenePack: 'cafe', sampleTitle: '지금 가장 주목받는\n스마트한 해결책' },
      { id: 'brand_diagonal_wedge', cat: '바이럴', name: '사선 옐로우 폰 목업', bg: '#ffffff', card: '#f4f4f5', fg: '#0d0d0d', muted: '#3f3f46', accent: '#ffc800', pillBg: '#0d0d0d', pillFg: '#ffffff', fontKey: 'suite', style: 'minimal', coverLayout: 'photo_diagonal_wedge', bodyLayout: 'photo_diagonal_wedge', samplePhoto: '/assets/scenes/auto/6.jpg', scenePack: 'auto', sampleTitle: '복잡한 과정 없이\n한 번에 끝내세요' },
      { id: 'brand_dual_compare', cat: '바이럴', name: '블랙×옐로우 듀얼카드', bg: '#ffffff', card: '#0d0d0d', fg: '#0d0d0d', muted: '#27272a', accent: '#ffc800', pillBg: '#0d0d0d', pillFg: '#ffffff', fontKey: 'paperlogy', style: 'minimal', coverLayout: 'photo_dual_compare', bodyLayout: 'photo_dual_compare', samplePhoto: '/assets/scenes/beauty/5.jpg', scenePack: 'beauty', sampleTitle: '고민하던 두 가지,\n한 번에 챙기세요' },
      { id: 'brand_cobalt_wedge', cat: '바이럴', name: '코발트 블루 사선 앱', bg: '#ffffff', card: '#eff6ff', fg: '#0f172a', muted: '#475569', accent: '#2563eb', pillBg: '#0f172a', pillFg: '#ffffff', fontKey: 'ibmplex', style: 'minimal', coverLayout: 'photo_diagonal_wedge', bodyLayout: 'photo_phone_banner', samplePhoto: '/assets/scenes/clinic/5.jpg', scenePack: 'clinic', sampleTitle: '데이터로 증명하는\n신뢰의 기준' },
      { id: 'brand_coral_chips', cat: '바이럴', name: '코랄 라인칩 스플릿', bg: '#ff5a36', card: '#111111', fg: '#111111', muted: '#271a16', accent: '#111111', pillBg: '#111111', pillFg: '#ffffff', fontKey: 'freesentation', style: 'swiss', coverLayout: 'photo_brand_chiptags', bodyLayout: 'photo_dual_compare', samplePhoto: '/assets/scenes/restaurant/5.jpg', scenePack: 'restaurant', sampleTitle: '한 번 보면 못 잊는\n압도적 시그니처' },
      { id: 'checker_lime_carbon', cat: '바이럴', name: '라임×카본 체커보드', bg: '#0f0f0f', card: '#1d1f1c', fg: '#ffffff', muted: '#d4d4d8', accent: '#a3e600', pillBg: '#a3e600', pillFg: '#0f0f0f', fontKey: 'freesentation', style: 'dark', coverLayout: 'photo_checker_split', bodyLayout: 'photo_checker_split', samplePhoto: '/assets/scenes/shop/10.jpg', scenePack: 'shop', sampleTitle: '단계별로 올리는\n스마트 활용법' },
      { id: 'gold_slash_kinetic', cat: '바이럴', name: '골드 45° 사선 슬래시', bg: '#0d0d0d', card: '#1c1c1e', fg: '#ffffff', muted: '#e5e5e5', accent: '#f5c400', pillBg: '#f5c400', pillFg: '#0d0d0d', fontKey: 'freesentation', style: 'dark', monoPhoto: true, coverLayout: 'photo_slash_kinetic', bodyLayout: 'photo_slash_kinetic', samplePhoto: '/assets/scenes/fitness/7.jpg', scenePack: 'fitness', sampleTitle: '결과가 달라지는\n결정적 한 끗' },
      { id: 'gold_bento_dark', cat: '바이럴', name: '골드×블랙 2×2 벤토', bg: '#0e0e10', card: '#1b1b1f', fg: '#ffffff', muted: '#d4d4d8', accent: '#f5c400', pillBg: '#f5c400', pillFg: '#0e0e10', fontKey: 'gangwon', style: 'dark', monoPhoto: true, coverLayout: 'photo_bento_dark', bodyLayout: 'photo_bento_dark', samplePhoto: '/assets/scenes/auto/8.jpg', scenePack: 'auto', sampleTitle: '프로들이 선택하는\n핵심 스펙 정리' },
      { id: 'gold_diamond_poster', cat: '바이럴', name: '골드 다이아 포스터', bg: '#f5c400', card: '#111111', fg: '#0d0d0d', muted: '#27272a', accent: '#0d0d0d', pillBg: '#0d0d0d', pillFg: '#f5c400', fontKey: 'jalnan', style: 'swiss', monoPhoto: true, coverLayout: 'photo_diamond_pop', bodyLayout: 'photo_slash_kinetic', samplePhoto: '/assets/scenes/fitness/8.jpg', scenePack: 'fitness', sampleTitle: '눈에 확 띄는\n시그니처 포스터' },
      { id: 'checker_orange_noir', cat: '바이럴', name: '오렌지×블랙 체커보드', bg: '#111113', card: '#1f1e22', fg: '#ffffff', muted: '#e4e4e7', accent: '#fb923c', pillBg: '#fb923c', pillFg: '#111113', fontKey: 'blackhansans', style: 'dark', coverLayout: 'photo_checker_split', bodyLayout: 'photo_checker_split', samplePhoto: '/assets/scenes/cafe/13.jpg', scenePack: 'cafe', sampleTitle: '저장하고 꺼내 보는\n브랜드 꿀팁 7' },
      { id: 'checker_cyan_navy', cat: '바이럴', name: '시안×네이비 체커보드', bg: '#071126', card: '#102042', fg: '#ffffff', muted: '#bae6fd', accent: '#38bdf8', pillBg: '#38bdf8', pillFg: '#071126', fontKey: 'suite', style: 'news', coverLayout: 'photo_checker_split', bodyLayout: 'photo_checker_split', samplePhoto: '/assets/scenes/academy/6.jpg', scenePack: 'academy', sampleTitle: '실무 속도를 2배로\n높이는 체크리스트' },
      { id: 'bold_verde_stamp', cat: '바이럴', name: '네온 라임 스탬프', bg: '#0c0d0c', card: 'rgba(200,255,46,0.14)', fg: '#ffffff', muted: '#d4d4d8', accent: '#c8ff2e', pillBg: '#c8ff2e', pillFg: '#0c0d0c', fontKey: 'aggro', style: 'dark', monoPhoto: true, coverLayout: 'photo_bold_stamp', bodyLayout: 'photo_bold_stamp', samplePhoto: '/assets/scenes/fitness/6.jpg', scenePack: 'fitness', sampleTitle: '지금 당장\n시작해야 할 이유' },
      { id: 'neon_studio_poster', cat: '바이럴', name: '애시드 라임 스튜디오', bg: '#d4ff2a', card: '#ffffff', fg: '#0e0f0c', muted: '#27272a', accent: '#0e0f0c', pillBg: '#0e0f0c', pillFg: '#d4ff2a', fontKey: 'aggro', style: 'swiss', monoPhoto: true, coverLayout: 'photo_neon_studio', bodyLayout: 'photo_neon_studio', samplePhoto: '/assets/scenes/shop/9.jpg', scenePack: 'shop', sampleTitle: '브랜드가\n기억되는 공식' },
      { id: 'bold_verde_card', cat: '바이럴', name: '흑백×라임 알림카드', bg: '#0b0c0b', card: '#c8ff2e', fg: '#0e0f0c', muted: '#27272a', accent: '#c8ff2e', pillBg: '#c8ff2e', pillFg: '#0b0c0b', fontKey: 'paperlogy', style: 'dark', monoPhoto: true, coverLayout: 'photo_neon_card', bodyLayout: 'photo_bold_stamp', samplePhoto: '/assets/scenes/cafe/12.jpg', scenePack: 'cafe', sampleTitle: '오늘 꼭 기억할\n핵심 체크 3가지' },
      { id: 'electric_yellow_zine', cat: '바이럴', name: '일렉트릭 옐로우 진', bg: '#f6e84b', card: '#ffffff', fg: '#111111', muted: '#3f3f46', accent: '#111111', pillBg: '#111111', pillFg: '#f6e84b', fontKey: 'gmarket', style: 'swiss', monoPhoto: true, coverLayout: 'photo_neon_studio', bodyLayout: 'photo_neon_card', samplePhoto: '/assets/scenes/auto/7.jpg', scenePack: 'auto', sampleTitle: '남다른 결과를 만드는\n실전 전략 노트' },
      { id: 'agency_terracotta', cat: '바이럴', name: '에이전시 테라코타', bg: '#7c2d12', card: '#f5efe6', fg: '#faf5ef', muted: '#fed7aa', accent: '#f5efe6', pillBg: '#f5efe6', pillFg: '#7c2d12', fontKey: 'hahmlet', style: 'editorial', coverLayout: 'photo_agency_brand', bodyLayout: 'photo_agency_brand', samplePhoto: '/assets/landing/ed-interior.jpg', scenePack: 'interior', sampleTitle: '좋은 아이디어가\n브랜드를 만든다' },
      { id: 'cyber_violet_stamp', cat: '바이럴', name: '사이버 라일락 스탬프', bg: '#0c0b12', card: 'rgba(192,132,252,0.16)', fg: '#ffffff', muted: '#e9d5ff', accent: '#c084fc', pillBg: '#c084fc', pillFg: '#0c0b12', fontKey: 'orbit', style: 'dark', monoPhoto: true, coverLayout: 'photo_bold_stamp', bodyLayout: 'photo_neon_card', samplePhoto: '/assets/scenes/beauty/6.jpg', scenePack: 'beauty', sampleTitle: '시선을 멈추게 하는\n비주얼 공식' },
      { id: 'viral_sidefade_beauty', cat: '바이럴', name: '좌측 페이드·태그칩', bg: '#0b0c0f', card: 'rgba(255,255,255,0.16)', fg: '#ffffff', muted: '#e4e4e7', accent: '#f4f4f5', pillBg: 'rgba(255,255,255,0.22)', pillFg: '#ffffff', fontKey: 'pretM', style: 'dark', coverLayout: 'photo_viral_sidefade', bodyLayout: 'photo_viral_sidefade', samplePhoto: '/assets/landing/ed-beauty.jpg', scenePack: 'beauty', sampleTitle: '어떤 디자인이\n나랑 잘 어울릴까?' },
      { id: 'viral_mono_insight', cat: '바이럴', name: '흑백 인사이트 페이드', bg: '#050507', card: 'rgba(255,255,255,0.10)', fg: '#ffffff', muted: '#d4d4d8', accent: '#facc15', pillBg: 'rgba(255,255,255,0.18)', pillFg: '#ffffff', fontKey: 'hahmlet', style: 'dark', monoPhoto: true, coverLayout: 'photo_viral_darkfade', bodyLayout: 'photo_viral_darkfade', samplePhoto: '/assets/scenes/academy/5.jpg', scenePack: 'academy', sampleTitle: '성공을 가로막는\n10가지 습관' },
      { id: 'viral_runner_hook', cat: '바이럴', name: '리얼 스냅 하단 후킹', bg: '#060608', card: 'rgba(255,255,255,0.12)', fg: '#ffffff', muted: '#d4d4d8', accent: '#ffffff', pillBg: 'rgba(255,255,255,0.20)', pillFg: '#ffffff', fontKey: 'aggro', style: 'dark', coverLayout: 'photo_viral_darkfade', bodyLayout: 'photo_viral_darkfade', samplePhoto: '/assets/scenes/fitness/4.jpg', scenePack: 'fitness', sampleTitle: '아직도 이걸\n모르고 있었다고?' },
      { id: 'viral_tomato_accent', cat: '바이럴', name: '컬러 강조 포인트', bg: '#160d0a', card: 'rgba(255,255,255,0.14)', fg: '#ffffff', muted: '#f5e6e0', accent: '#ef4444', pillBg: '#ef4444', pillFg: '#ffffff', fontKey: 'paperlogy', style: 'editorial', coverLayout: 'photo_viral_colorword', bodyLayout: 'photo_viral_colorword', samplePhoto: '/assets/landing/ed-dining.jpg', scenePack: 'restaurant', sampleTitle: '올 시즌은\n이 트렌드가\n점령한다' },
      { id: 'viral_lime_duotag', cat: '바이럴', name: '라임×블랙 투톤라벨', bg: '#111113', card: '#1c1c20', fg: '#ffffff', muted: '#e4e4e7', accent: '#bef264', pillBg: '#bef264', pillFg: '#111113', fontKey: 'gmarket', style: 'dark', coverLayout: 'photo_viral_duotag', bodyLayout: 'photo_viral_duotag', samplePhoto: '/assets/scenes/shop/3.jpg', scenePack: 'shop', sampleTitle: '알아두면 쓸데있는\n실전 꿀팁 잡학사전' },
      { id: 'viral_yellow_duotag', cat: '바이럴', name: '옐로우×블랙 라벨', bg: '#111113', card: '#1c1c20', fg: '#ffffff', muted: '#e4e4e7', accent: '#facc15', pillBg: '#facc15', pillFg: '#111113', fontKey: 'aggro', style: 'dark', coverLayout: 'photo_viral_duotag', bodyLayout: 'photo_viral_duotag', samplePhoto: '/assets/landing/ed-cafe.jpg', scenePack: 'cafe', sampleTitle: '초보자가 꼭 챙길\n체크리스트 총정리' },
      { id: 'viral_viewfinder_look', cat: '바이럴', name: '뷰파인더 룩북 프레임', bg: '#ececef', card: '#ffffff', fg: '#111113', muted: '#3f3f46', accent: '#f97316', pillBg: '#111113', pillFg: '#ffffff', fontKey: 'aggro', style: 'swiss', coverLayout: 'photo_viral_viewfinder', bodyLayout: 'photo_viral_viewfinder', samplePhoto: '/assets/landing/ed-interior.jpg', scenePack: 'interior', sampleTitle: 'SEASON\nKEYWORD' },
      { id: 'viral_lime_glowcard', cat: '바이럴', name: '라임 오라 노트카드', bg: '#f7fee7', card: '#ffffff', fg: '#111113', muted: '#3f3f46', accent: '#a3e635', pillBg: '#111113', pillFg: '#ecfccb', fontKey: 'paperlogy', style: 'soft', coverLayout: 'photo_viral_glowcard', bodyLayout: 'photo_viral_glowcard', samplePhoto: '/assets/scenes/cafe/10.jpg', scenePack: 'cafe', sampleTitle: '하루 10분 만에\n완전히 달라졌다.' },

      // 빅타이포 (10종 — 사진 풀배경 + 초대형 타이포그래피!)
      { id: 'big_vogue_center', cat: '빅타이포', name: '보그 중앙 빅타이포', bg: '#101012', card: '#1e1e22', fg: '#ffffff', muted: '#e4e4e7', accent: '#f59e0b', pillBg: '#ffffff', pillFg: '#101012', fontKey: 'songmyung', style: 'editorial', coverLayout: 'photo_big_center', bodyLayout: 'photo_big_center', samplePhoto: '/assets/landing/ed-cafe.jpg', scenePack: 'cafe', sampleTitle: '취향이 곧\n브랜드가 된다' },
      { id: 'big_hype_bottom', cat: '빅타이포', name: '하단 임팩트 빅타이포', bg: '#0c0c0e', card: '#1c1c20', fg: '#ffffff', muted: '#d4d4d8', accent: '#f97316', pillBg: '#f97316', pillFg: '#111111', fontKey: 'aggro', style: 'dark', coverLayout: 'photo_big_bottom', bodyLayout: 'photo_big_bottom', samplePhoto: '/assets/scenes/fitness/2.jpg', scenePack: 'fitness', sampleTitle: '지금 시작해야\n바뀌는 5가지' },
      { id: 'big_cover_top', cat: '빅타이포', name: '매거진 상단 빅타이포', bg: '#141210', card: '#24201c', fg: '#fffbeb', muted: '#e7e5e4', accent: '#eab308', pillBg: '#eab308', pillFg: '#141210', fontKey: 'hahmlet', style: 'editorial', coverLayout: 'photo_big_top', bodyLayout: 'photo_big_top', samplePhoto: '/assets/landing/ed-interior.jpg', scenePack: 'interior', sampleTitle: '공간을 바꾸는\n단 하나의 기준' },
      { id: 'big_outline_street', cat: '빅타이포', name: '스트릿 아웃라인 빅타이포', bg: '#0b0b0d', card: '#18181b', fg: '#ffffff', muted: '#d4d4d8', accent: '#a3e635', pillBg: '#a3e635', pillFg: '#111113', fontKey: 'aggro', style: 'dark', coverLayout: 'photo_big_outline', bodyLayout: 'photo_big_outline', samplePhoto: '/assets/scenes/auto/5.jpg', scenePack: 'auto', sampleTitle: '남들과 다른\n압도적 디테일' },
      { id: 'big_marker_viral', cat: '빅타이포', name: '형광펜 박스 빅타이포', bg: '#0f1014', card: '#1f2229', fg: '#111113', muted: '#f4f4f5', accent: '#facc15', pillBg: '#facc15', pillFg: '#111113', fontKey: 'gmarket', style: 'news', coverLayout: 'photo_big_box', bodyLayout: 'photo_big_box', samplePhoto: '/assets/scenes/shop/5.jpg', scenePack: 'shop', sampleTitle: '알고 쓰면\n무조건 이득인 팁' },
      { id: 'big_blackbox_news', cat: '빅타이포', name: '블랙라벨 박스 빅타이포', bg: '#09090b', card: '#18181b', fg: '#ffffff', muted: '#e4e4e7', accent: '#111113', pillBg: '#ffffff', pillFg: '#09090b', fontKey: 'paperlogy', style: 'swiss', coverLayout: 'photo_big_box', bodyLayout: 'photo_big_bottom', samplePhoto: '/assets/scenes/realestate/6.jpg', scenePack: 'realestate', sampleTitle: '실패 없는 선택\n핵심만 정리' },
      { id: 'big_serif_mood', cat: '빅타이포', name: '감성 세리프 빅타이포', bg: '#151210', card: '#241f1c', fg: '#faf6f0', muted: '#e5ddd3', accent: '#e09f3e', pillBg: '#e09f3e', pillFg: '#151210', fontKey: 'diphylleia', style: 'editorial', coverLayout: 'photo_big_editorial', bodyLayout: 'photo_big_editorial', samplePhoto: '/assets/landing/ed-dining.jpg', scenePack: 'restaurant', sampleTitle: '오래 기억되는\n한 장면의 힘' },
      { id: 'big_brush_poster', cat: '빅타이포', name: '붓글씨 풀포토 빅타이포', bg: '#14110f', card: '#26201c', fg: '#fff8ea', muted: '#e6d8c3', accent: '#ef4444', pillBg: '#ef4444', pillFg: '#ffffff', fontKey: 'brush', style: 'editorial', coverLayout: 'photo_big_center', bodyLayout: 'photo_big_bottom', samplePhoto: '/assets/scenes/cafe/7.jpg', scenePack: 'cafe', sampleTitle: '오늘 하루,\n온전히 나답게' },
      { id: 'big_pop_bubble', cat: '빅타이포', name: '팝 볼드 중앙 빅타이포', bg: '#121216', card: '#222229', fg: '#fef08a', muted: '#ffffff', accent: '#fb7185', pillBg: '#fb7185', pillFg: '#ffffff', fontKey: 'bagel', style: 'dark', coverLayout: 'photo_big_center', bodyLayout: 'photo_big_box', samplePhoto: '/assets/landing/ed-beauty.jpg', scenePack: 'beauty', sampleTitle: '진짜 꿀팁만\n쏙쏙 골랐어요' },
      { id: 'big_cyber_outline', cat: '빅타이포', name: '테크 아웃라인 빅타이포', bg: '#070b14', card: '#121a2d', fg: '#f0f9ff', muted: '#bae6fd', accent: '#22d3ee', pillBg: '#22d3ee', pillFg: '#070b14', fontKey: 'orbit', style: 'news', coverLayout: 'photo_big_outline', bodyLayout: 'photo_big_top', samplePhoto: '/assets/landing/hero-cinema-kv.jpg', scenePack: 'clinic', sampleTitle: '차이를 만드는\n결정적 디테일' },

      // 그라데이션 (10종 — 사진이 배경색·컬러 그라데이션으로 자연스럽게 녹아드는 페이드 화보!)
      { id: 'grad_fade_cream', cat: '그라데이션', name: '크림 사진 페이드', bg: '#f7f1e6', card: 'rgba(44,31,22,0.07)', fg: '#231912', muted: '#6b5849', accent: '#c2603f', pillBg: '#231912', pillFg: '#f7f1e6', fontKey: 'gowun', style: 'editorial', coverLayout: 'photo_fade_bottom', bodyLayout: 'photo_fade_bottom', samplePhoto: '/assets/landing/ed-cafe.jpg', scenePack: 'cafe', sampleTitle: '부드럽게 녹아드는\n감성 카페 기록' },
      { id: 'grad_fade_noir', cat: '그라데이션', name: '느와르 블랙 페이드', bg: '#0d0e11', card: 'rgba(255,255,255,0.09)', fg: '#ffffff', muted: '#d4d4d8', accent: '#f59e0b', pillBg: '#f59e0b', pillFg: '#0d0e11', fontKey: 'hahmlet', style: 'dark', coverLayout: 'photo_fade_bottom', bodyLayout: 'photo_fade_bottom', samplePhoto: '/assets/landing/ed-interior.jpg', scenePack: 'interior', sampleTitle: '공간에 깊이를 더하는\n조명과 여백의 힘' },
      { id: 'grad_fade_top_sage', cat: '그라데이션', name: '세이지 상단 페이드', bg: '#eaf1ea', card: 'rgba(20,45,30,0.07)', fg: '#14291d', muted: '#466151', accent: '#2f6f4e', pillBg: '#2f6f4e', pillFg: '#ffffff', fontKey: 'diphylleia', style: 'soft', coverLayout: 'photo_fade_top', bodyLayout: 'photo_fade_top', samplePhoto: '/assets/scenes/clinic/3.jpg', scenePack: 'clinic', sampleTitle: '몸과 마음이 가벼운\n데일리 웰니스 루틴' },
      { id: 'grad_fade_top_navy', cat: '그라데이션', name: '네이비 상단 페이드', bg: '#0b1633', card: 'rgba(255,255,255,0.10)', fg: '#f8fafc', muted: '#bfdbfe', accent: '#38bdf8', pillBg: '#38bdf8', pillFg: '#0b1633', fontKey: 'gmarket', style: 'news', coverLayout: 'photo_fade_top', bodyLayout: 'photo_fade_bottom', samplePhoto: '/assets/landing/ed-auto.jpg', scenePack: 'auto', sampleTitle: '놓치면 손해보는\n핵심 체크포인트 5' },
      { id: 'grad_duo_sunset', cat: '그라데이션', name: '선셋 틴트 사진', bg: '#2b1419', gradient: 'sunset_peach', card: 'rgba(255,255,255,0.16)', fg: '#ffffff', muted: '#ffedd5', accent: '#fb923c', pillBg: '#fb923c', pillFg: '#1c100d', fontKey: 'songmyung', style: 'editorial', coverLayout: 'photo_fade_duotone', bodyLayout: 'photo_fade_duotone', samplePhoto: '/assets/scenes/cafe/6.jpg', scenePack: 'cafe', sampleTitle: '노을빛 색감으로\n시선을 사로잡는 법' },
      { id: 'grad_duo_cobalt', cat: '그라데이션', name: '코발트 틴트 사진', bg: '#08122b', gradient: 'midnight_cobalt', card: 'rgba(255,255,255,0.14)', fg: '#ffffff', muted: '#bae6fd', accent: '#38bdf8', pillBg: '#38bdf8', pillFg: '#08122b', fontKey: 'paperlogy', style: 'news', coverLayout: 'photo_fade_duotone', bodyLayout: 'photo_fade_duotone', samplePhoto: '/assets/scenes/academy/3.jpg', scenePack: 'academy', sampleTitle: '저장 수 폭발하는\n실전 인사이트 정리' },
      { id: 'grad_duo_emerald', cat: '그라데이션', name: '에메랄드 틴트 사진', bg: '#061c18', gradient: 'emerald_glass', card: 'rgba(255,255,255,0.14)', fg: '#ffffff', muted: '#a7f3d0', accent: '#34d399', pillBg: '#34d399', pillFg: '#061c18', fontKey: 'pretM', style: 'clean', coverLayout: 'photo_fade_duotone', bodyLayout: 'photo_fade_bottom', samplePhoto: '/assets/scenes/interior/5.jpg', scenePack: 'interior', sampleTitle: '한눈에 신뢰를 주는\n프리미엄 브랜딩' },
      { id: 'grad_duo_wine', cat: '그라데이션', name: '와인 크림슨 틴트', bg: '#1e0912', gradient: 'obsidian_crimson', card: 'rgba(255,255,255,0.14)', fg: '#ffffff', muted: '#fecdd3', accent: '#fb7185', pillBg: '#fb7185', pillFg: '#1e0912', fontKey: 'aggro', style: 'dark', coverLayout: 'photo_fade_duotone', bodyLayout: 'photo_fade_duotone', samplePhoto: '/assets/scenes/fitness/5.jpg', scenePack: 'fitness', sampleTitle: '단 3초 만에 각인되는\n강렬한 비주얼 전략' },
      { id: 'grad_radial_rose', cat: '그라데이션', name: '로즈 미스트 페이드', bg: '#fdf2f5', card: 'rgba(190,24,93,0.08)', fg: '#2b131b', muted: '#7f4d5d', accent: '#be185d', pillBg: '#be185d', pillFg: '#ffffff', fontKey: 'grandiflora', style: 'soft', coverLayout: 'photo_fade_radial', bodyLayout: 'photo_fade_radial', samplePhoto: '/assets/landing/ed-beauty.jpg', scenePack: 'beauty', sampleTitle: '은은하게 번지는\n뷰티 무드 큐레이션' },
      { id: 'grad_radial_amber', cat: '그라데이션', name: '에스프레소 미스트', bg: '#18120e', card: 'rgba(255,255,255,0.09)', fg: '#faf3e8', muted: '#d2bfaa', accent: '#e09f3e', pillBg: '#e09f3e', pillFg: '#18120e', fontKey: 'songmyung', style: 'editorial', coverLayout: 'photo_fade_radial', bodyLayout: 'photo_fade_bottom', samplePhoto: '/assets/landing/ed-dining.jpg', scenePack: 'restaurant', sampleTitle: '깊은 여운을 남기는\n밤의 미식 가이드' },

      // 핀터레스트 (12종 — 영자신문·영수증·스크랩북·OS창·필름스트립·5:5분할·바이닐·무드보드·스위스포스터)
      { id: 'pin_newspaper', cat: '핀터레스트', name: '영자신문 브로드시트', bg: '#f4efe6', card: '#e8e0d2', fg: '#171512', muted: '#575046', accent: '#991b1b', pillBg: '#171512', pillFg: '#f4efe6', fontKey: 'songmyung', style: 'editorial', coverLayout: 'photo_newspaper', bodyLayout: 'photo_newspaper', samplePhoto: '/assets/landing/ed-cafe.jpg', scenePack: 'cafe', sampleTitle: '오늘 꼭 읽어둘\n핵심 트렌드 리포트' },
      { id: 'pin_receipt', cat: '핀터레스트', name: '성수 영수증 티켓', bg: '#ece7df', card: '#ffffff', fg: '#1c1917', muted: '#78716c', accent: '#c2410c', pillBg: '#1c1917', pillFg: '#ffffff', fontKey: 'orbit', style: 'clean', coverLayout: 'photo_receipt', bodyLayout: 'photo_receipt', samplePhoto: '/assets/scenes/cafe/5.jpg', scenePack: 'cafe', sampleTitle: '주문 번호 01\n실패 없는 체크리스트' },
      { id: 'pin_scrapbook', cat: '핀터레스트', name: '마스킹테이프 스크랩', bg: '#f7f3eb', card: '#ebe4d6', fg: '#2b221c', muted: '#6e5e52', accent: '#b45309', pillBg: '#2b221c', pillFg: '#f7f3eb', fontKey: 'pen', style: 'soft', coverLayout: 'photo_scrapbook', bodyLayout: 'photo_scrapbook', samplePhoto: '/assets/scenes/cafe/4.jpg', scenePack: 'cafe', sampleTitle: '취향이 묻어나는\n작은 일상 스크랩' },
      { id: 'pin_window', cat: '핀터레스트', name: '레트로 OS 윈도우', bg: '#e9edf5', card: '#ffffff', fg: '#111827', muted: '#4b5563', accent: '#2563eb', pillBg: '#111827', pillFg: '#ffffff', fontKey: 'paperlogy', style: 'clean', coverLayout: 'photo_window', bodyLayout: 'photo_window', samplePhoto: '/assets/scenes/shop/4.jpg', scenePack: 'shop', sampleTitle: '저장해 두고 쓰는\n실전 아카이브 모음' },
      { id: 'pin_filmstrip', cat: '핀터레스트', name: '코닥 35mm 필름롤', bg: '#141312', card: '#22201d', fg: '#f6efe4', muted: '#b5a898', accent: '#f59e0b', pillBg: '#f59e0b', pillFg: '#141312', fontKey: 'hahmlet', style: 'dark', coverLayout: 'photo_filmstrip', bodyLayout: 'photo_filmstrip', samplePhoto: '/assets/scenes/restaurant/5.jpg', scenePack: 'restaurant', sampleTitle: '필름 한 롤에 담은\n가장 선명한 순간' },
      { id: 'pin_kinfolk_left', cat: '핀터레스트', name: '킨포크 좌우 5:5', bg: '#f5f1ea', card: '#eae3d6', fg: '#1f1d1a', muted: '#6b655c', accent: '#8c5a3c', pillBg: '#1f1d1a', pillFg: '#f5f1ea', fontKey: 'diphylleia', style: 'editorial', coverLayout: 'photo_split_left', bodyLayout: 'photo_split_left', samplePhoto: '/assets/landing/ed-interior.jpg', scenePack: 'interior', sampleTitle: '여백이 살아있는\n공간 큐레이션' },
      { id: 'pin_cereal_right', cat: '핀터레스트', name: '시리얼 우측 5:5', bg: '#f2f3f0', card: '#e3e6df', fg: '#191d19', muted: '#5a635a', accent: '#3f6212', pillBg: '#3f6212', pillFg: '#ffffff', fontKey: 'grandiflora', style: 'editorial', coverLayout: 'photo_split_right', bodyLayout: 'photo_split_right', samplePhoto: '/assets/scenes/interior/6.jpg', scenePack: 'interior', sampleTitle: '오래 머물고 싶은\n미니멀 무드 가이드' },
      { id: 'pin_vinyl', cat: '핀터레스트', name: '바이닐 원형 커버', bg: '#f8f0ec', card: '#efe0d8', fg: '#231618', muted: '#7a5a5f', accent: '#be123c', pillBg: '#be123c', pillFg: '#ffffff', fontKey: 'songmyung', style: 'soft', coverLayout: 'photo_circle', bodyLayout: 'photo_circle', samplePhoto: '/assets/scenes/beauty/5.jpg', scenePack: 'beauty', sampleTitle: '매일 꺼내 듣고 싶은\n오늘의 취향 리스트' },
      { id: 'pin_moodboard', cat: '핀터레스트', name: '2컷 핀터 무드보드', bg: '#f6f3ee', card: '#eae4da', fg: '#1e1c1a', muted: '#6b655e', accent: '#1d4ed8', pillBg: '#1e1c1a', pillFg: '#ffffff', fontKey: 'pretM', style: 'editorial', coverLayout: 'photo_duo', bodyLayout: 'photo_duo', samplePhoto: '/assets/scenes/shop/6.jpg', scenePack: 'shop', sampleTitle: '한눈에 비교하는\n디테일 무드보드' },
      { id: 'pin_swiss_grid', cat: '핀터레스트', name: '코펜하겐 포스터', bg: '#f7f7f5', card: '#e7e7e2', fg: '#111111', muted: '#525252', accent: '#ea580c', pillBg: '#ea580c', pillFg: '#ffffff', fontKey: 'aggro', style: 'swiss', coverLayout: 'photo_poster', bodyLayout: 'photo_poster', samplePhoto: '/assets/scenes/realestate/4.jpg', scenePack: 'realestate', sampleTitle: '핵심만 굵게 짚는\n스위스 포스터 카드' },
      { id: 'pin_paris_paper', cat: '핀터레스트', name: '파리 모닝 페이퍼', bg: '#faf6ef', card: '#efe7d8', fg: '#1f2937', muted: '#6b7280', accent: '#1e3a8a', pillBg: '#1e3a8a', pillFg: '#ffffff', fontKey: 'gowun', style: 'editorial', coverLayout: 'photo_newspaper', bodyLayout: 'photo_split_left', samplePhoto: '/assets/scenes/cafe/8.jpg', scenePack: 'cafe', sampleTitle: '파리 아침처럼\n감도 높은 기록' },
      { id: 'pin_tokyo_zine', cat: '핀터레스트', name: '도쿄 인디 잡지', bg: '#161b22', card: '#21262d', fg: '#f0f6fc', muted: '#8b949e', accent: '#f97316', pillBg: '#f97316', pillFg: '#161b22', fontKey: 'kirang', style: 'dark', coverLayout: 'photo_poster', bodyLayout: 'photo_split_right', samplePhoto: '/assets/scenes/shop/8.jpg', scenePack: 'shop', sampleTitle: '남들과 다르게 보는\n로컬 인디 매거진' },

      // 감성·카페 (6)
      { id: 'bakery_curation', cat: '감성·카페', name: '베이커리 큐레이션', bg: '#f8f3eb', card: '#efe5d6', fg: '#2c1f16', muted: '#756254', accent: '#c2603f', pillBg: '#2c1f16', pillFg: '#f8f3eb', fontKey: 'gowun', style: 'editorial', coverLayout: 'photo_top', bodyLayout: 'photo_top', samplePhoto: '/assets/landing/ed-cafe.jpg', scenePack: 'cafe', sampleTitle: '성수동 카페\n추천 베스트 5' },
      { id: 'polaroid_diary', cat: '감성·카페', name: '폴라로이드 일기', bg: '#f4efe6', card: '#e9e0d2', fg: '#2b241e', muted: '#78685a', accent: '#b45309', pillBg: '#ffffff', pillFg: '#2b241e', fontKey: 'pen', style: 'soft', coverLayout: 'photo_polaroid', bodyLayout: 'photo_polaroid', samplePhoto: '/assets/landing/ed-dining.jpg', scenePack: 'restaurant', sampleTitle: '주말에 가기 좋은\n숨은 맛집 기록' },
      { id: 'seoul_film35', cat: '감성·카페', name: '성수 35mm 필름', bg: '#1b1815', card: '#28231e', fg: '#f6efe4', muted: '#b8aa96', accent: '#e09f3e', pillBg: '#e09f3e', pillFg: '#1b1815', fontKey: 'songmyung', style: 'editorial', coverLayout: 'photo_frame', bodyLayout: 'photo_frame', samplePhoto: '/assets/scenes/cafe/2.jpg', scenePack: 'cafe', sampleTitle: '오후 4시 햇살,\n필름에 담은 기록' },
      { id: 'cafe_handwrite', cat: '감성·카페', name: '손글씨 붓엽서', bg: '#f5ede0', card: '#eadcc7', fg: '#251d17', muted: '#6b5a4b', accent: '#a92c21', pillBg: '#a92c21', pillFg: '#fff8ea', fontKey: 'brush', style: 'editorial', coverLayout: 'photo_polaroid', bodyLayout: 'photo_top', samplePhoto: '/assets/scenes/cafe/3.jpg', scenePack: 'cafe', sampleTitle: '오늘 하루를 채운\n작은 순간들' },
      { id: 'butter_cream', cat: '감성·카페', name: '버터 크림 노트', bg: '#fdf8e6', card: '#f6ecc9', fg: '#322617', muted: '#7d694c', accent: '#ca8a04', pillBg: '#322617', pillFg: '#fdf8e6', fontKey: 'cafe24', style: 'soft', coverLayout: 'photo_scrapbook', bodyLayout: 'photo_duo', samplePhoto: '/assets/scenes/cafe/9.jpg', scenePack: 'cafe', sampleTitle: '달콤하게 정리한\n오늘의 카페 메모' },
      { id: 'oatmeal_ticket', cat: '감성·카페', name: '오트밀 티켓 엽서', bg: '#ede8df', card: '#fbf9f5', fg: '#27231e', muted: '#70685f', accent: '#92400e', pillBg: '#92400e', pillFg: '#ffffff', fontKey: 'diphylleia', style: 'editorial', coverLayout: 'photo_receipt', bodyLayout: 'photo_polaroid', samplePhoto: '/assets/scenes/restaurant/4.jpg', scenePack: 'restaurant', sampleTitle: '예약 전 꼭 확인하는\n다이닝 체크포인트' },

      // 매거진 (6)
      { id: 'magazine_hero', cat: '매거진', name: '매거진 풀포토', bg: '#161514', card: '#242220', fg: '#ffffff', muted: '#d6d3d1', accent: '#f59e0b', pillBg: '#f59e0b', pillFg: '#141210', fontKey: 'hahmlet', style: 'editorial', coverLayout: 'photo_full', bodyLayout: 'photo_full', samplePhoto: '/assets/landing/ed-interior.jpg', scenePack: 'interior', sampleTitle: '공간이 달라지는\n조명 배치 법칙' },
      { id: 'busan_magazine', cat: '매거진', name: '로컬 매거진', bg: '#f4f1ea', card: '#e8e2d5', fg: '#141414', muted: '#57534e', accent: '#1d4ed8', pillBg: '#1d4ed8', pillFg: '#ffffff', fontKey: 'paperlogy', style: 'editorial', coverLayout: 'photo_bottom', bodyLayout: 'photo_bottom', samplePhoto: '/assets/scenes/realestate/1.jpg', scenePack: 'realestate', sampleTitle: '지금 주목해야 할\n로컬 핫플레이스' },
      { id: 'vogue_monochrome', cat: '매거진', name: '보그 모노 화보', bg: '#121212', card: '#222222', fg: '#fafafa', muted: '#a3a3a3', accent: '#e5e5e5', pillBg: '#fafafa', pillFg: '#121212', fontKey: 'songmyung', style: 'editorial', coverLayout: 'photo_full', bodyLayout: 'photo_frame', samplePhoto: '/assets/scenes/interior/2.jpg', scenePack: 'interior', sampleTitle: '유행 타지 않는\n클래식 스타일링' },
      { id: 'arch_journal', cat: '매거진', name: '아키텍처 저널', bg: '#f0efeb', card: '#e2e0d9', fg: '#1c1b18', muted: '#605e56', accent: '#334155', pillBg: '#1c1b18', pillFg: '#f0efeb', fontKey: 'hahmlet', style: 'editorial', coverLayout: 'photo_split_left', bodyLayout: 'photo_poster', samplePhoto: '/assets/scenes/realestate/5.jpg', scenePack: 'realestate', sampleTitle: '집의 인상을 바꾸는\n구조와 채광의 비밀' },
      { id: 'harpers_duo', cat: '매거진', name: '하퍼스 에디토리얼', bg: '#181414', card: '#292121', fg: '#faf5f5', muted: '#c7b8b8', accent: '#e11d48', pillBg: '#e11d48', pillFg: '#ffffff', fontKey: 'grandiflora', style: 'editorial', coverLayout: 'photo_duo', bodyLayout: 'photo_split_right', samplePhoto: '/assets/scenes/beauty/7.jpg', scenePack: 'beauty', sampleTitle: '에디터가 직접 고른\n이번 달 시그니처' },
      { id: 'monocle_brief', cat: '매거진', name: '모노클 브리핑', bg: '#f7f5f0', card: '#eae6dc', fg: '#141414', muted: '#525252', accent: '#d97706', pillBg: '#141414', pillFg: '#f7f5f0', fontKey: 'pretM', style: 'swiss', coverLayout: 'photo_newspaper', bodyLayout: 'photo_bottom', samplePhoto: '/assets/scenes/auto/4.jpg', scenePack: 'auto', sampleTitle: '알아두면 격이 다른\n라이프스타일 브리핑' },

      // 뷰티·라이프 (5)
      { id: 'beauty_arch', cat: '뷰티·라이프', name: '뷰티 아치 화보', bg: '#fff6f4', card: '#ffe8e3', fg: '#24171a', muted: '#7a575c', accent: '#be185d', pillBg: '#fce7f3', pillFg: '#9d174d', fontKey: 'grandiflora', style: 'editorial', coverLayout: 'photo_arch', bodyLayout: 'photo_arch', samplePhoto: '/assets/landing/ed-beauty.jpg', scenePack: 'beauty', sampleTitle: '아침 5분 완성\n광채 스킨 루틴' },
      { id: 'matcha_wellness', cat: '뷰티·라이프', name: '말차 웰니스', bg: '#ecf2ec', card: '#dde8dd', fg: '#16291e', muted: '#4a6253', accent: '#2f6f4e', pillBg: '#2f6f4e', pillFg: '#ffffff', fontKey: 'diphylleia', style: 'soft', coverLayout: 'photo_top', bodyLayout: 'photo_arch', samplePhoto: '/assets/scenes/clinic/2.jpg', scenePack: 'clinic', sampleTitle: '몸이 가벼워지는\n아침 습관 5가지' },
      { id: 'peach_lookbook', cat: '뷰티·라이프', name: '피치 룩북', bg: '#fff3ee', card: '#ffe1d6', fg: '#2b1815', muted: '#855850', accent: '#ea580c', pillBg: '#ea580c', pillFg: '#ffffff', fontKey: 'cafe24', style: 'soft', coverLayout: 'photo_arch', bodyLayout: 'photo_top', samplePhoto: '/assets/scenes/beauty/3.jpg', scenePack: 'beauty', sampleTitle: '올 시즌 꼭 챙길\n데일리 룩북' },
      { id: 'rose_medallion', cat: '뷰티·라이프', name: '로즈 원형 화보', bg: '#fdf2f4', card: '#fce1e7', fg: '#2c131a', muted: '#885360', accent: '#db2777', pillBg: '#db2777', pillFg: '#ffffff', fontKey: 'songmyung', style: 'soft', coverLayout: 'photo_circle', bodyLayout: 'photo_arch', samplePhoto: '/assets/scenes/beauty/8.jpg', scenePack: 'beauty', sampleTitle: '피부과 원장이 추천한\n보습 레이어링 공식' },
      { id: 'lavender_daily', cat: '뷰티·라이프', name: '라벤더 데일리 창', bg: '#f4f2fc', card: '#e8e3fa', fg: '#1f1933', muted: '#5c527a', accent: '#7c3aed', pillBg: '#7c3aed', pillFg: '#ffffff', fontKey: 'sunflower', style: 'soft', coverLayout: 'photo_window', bodyLayout: 'photo_duo', samplePhoto: '/assets/scenes/clinic/5.jpg', scenePack: 'clinic', sampleTitle: '하루 10분 투자하는\n마음·건강 케어 루틴' },

      // 볼드·비즈 (5)
      { id: 'nike_editorial', cat: '볼드·비즈', name: '나이키 볼드 밴드', bg: '#111111', card: '#1c1c1e', fg: '#ffffff', muted: '#a1a1aa', accent: '#f97316', pillBg: '#f97316', pillFg: '#111111', fontKey: 'aggro', style: 'dark', coverLayout: 'photo_band', bodyLayout: 'photo_band', samplePhoto: '/assets/scenes/fitness/1.jpg', scenePack: 'fitness', sampleTitle: '체지방 태우는\n핵심 루틴 5가지' },
      { id: 'cobalt_news', cat: '볼드·비즈', name: '뉴스 카드브리핑', bg: '#0c1c42', card: '#142a60', fg: '#ffffff', muted: '#93c5fd', accent: '#facc15', pillBg: '#facc15', pillFg: '#0c1c42', fontKey: 'gmarket', style: 'news', coverLayout: 'photo_bottom', bodyLayout: 'photo_top', samplePhoto: '/assets/scenes/academy/1.jpg', scenePack: 'academy', sampleTitle: '놓치면 손해보는\n핵심 정보 총정리' },
      { id: 'pop_yellow', cat: '볼드·비즈', name: '팝 옐로우 팁', bg: '#fef08a', card: '#fde047', fg: '#111113', muted: '#3f3f46', accent: '#111113', pillBg: '#111113', pillFg: '#fef08a', fontKey: 'bagel', style: 'swiss', coverLayout: 'photo_top', bodyLayout: 'photo_frame', samplePhoto: '/assets/scenes/shop/1.jpg', scenePack: 'shop', sampleTitle: '초보자도 바로 쓰는\n실전 꿀팁 모음' },
      { id: 'street_calli', cat: '볼드·비즈', name: '스트릿 캘리 포스터', bg: '#18181b', card: '#27272a', fg: '#fafafa', muted: '#a1a1aa', accent: '#ef4444', pillBg: '#ef4444', pillFg: '#ffffff', fontKey: 'dokdo', style: 'dark', coverLayout: 'photo_band', bodyLayout: 'photo_full', samplePhoto: '/assets/scenes/fitness/3.jpg', scenePack: 'fitness', sampleTitle: '오늘부터 달라지는\n나만의 돌파구' },
      { id: 'bauhaus_red', cat: '볼드·비즈', name: '바우하우스 포스터', bg: '#f6f1e7', card: '#eae2d3', fg: '#111111', muted: '#44403c', accent: '#dc2626', pillBg: '#dc2626', pillFg: '#ffffff', fontKey: 'aggro', style: 'swiss', coverLayout: 'photo_poster', bodyLayout: 'photo_band', samplePhoto: '/assets/scenes/academy/4.jpg', scenePack: 'academy', sampleTitle: '성과가 바로 나오는\n실무 기획의 정석' },

      // 다크·시네마 (5)
      { id: 'dark_insight', cat: '다크·시네마', name: '다크 비즈니스', bg: '#0d0f14', card: '#181c26', fg: '#f8fafc', muted: '#94a3b8', accent: '#facc15', pillBg: '#facc15', pillFg: '#0f172a', fontKey: 'gmarket', style: 'news', coverLayout: 'photo_bottom', bodyLayout: 'photo_top', samplePhoto: '/assets/landing/hero-cinema-kv.jpg', scenePack: 'clinic', sampleTitle: '매출 2배 만드는\n핵심 전략 정리' },
      { id: 'neon_cyber', cat: '다크·시네마', name: '네온 테크 브리핑', bg: '#070b18', card: '#111830', fg: '#f0f9ff', muted: '#7dd3fc', accent: '#22d3ee', pillBg: '#22d3ee', pillFg: '#082f49', fontKey: 'orbit', style: 'news', coverLayout: 'photo_window', bodyLayout: 'photo_band', samplePhoto: '/assets/scenes/auto/2.jpg', scenePack: 'auto', sampleTitle: 'AI 시대에 알아둘\n업무 자동화 팁' },
      { id: 'espresso_mood', cat: '다크·시네마', name: '에스프레소 무드', bg: '#1e1612', card: '#2e221c', fg: '#f5ebe0', muted: '#cbb8a6', accent: '#d97706', pillBg: '#d97706', pillFg: '#ffffff', fontKey: 'diphylleia', style: 'editorial', coverLayout: 'photo_frame', bodyLayout: 'photo_polaroid', samplePhoto: '/assets/scenes/restaurant/2.jpg', scenePack: 'restaurant', sampleTitle: '깊은 여운이 남는\n밤의 취향 기록' },
      { id: 'midnight_film', cat: '다크·시네마', name: '미드나잇 필름', bg: '#0e1116', card: '#1a202c', fg: '#f1f5f9', muted: '#94a3b8', accent: '#fb923c', pillBg: '#fb923c', pillFg: '#0e1116', fontKey: 'songmyung', style: 'dark', coverLayout: 'photo_filmstrip', bodyLayout: 'photo_full', samplePhoto: '/assets/scenes/auto/6.jpg', scenePack: 'auto', sampleTitle: '밤 드라이브에서 찾은\n디테일의 차이' },
      { id: 'obsidian_gold', cat: '다크·시네마', name: '옵시디언 골드', bg: '#111110', card: '#1f1e1b', fg: '#faf7f0', muted: '#b8b0a0', accent: '#d4af37', pillBg: '#d4af37', pillFg: '#111110', fontKey: 'hahmlet', style: 'editorial', coverLayout: 'photo_circle', bodyLayout: 'photo_split_left', samplePhoto: '/assets/scenes/interior/7.jpg', scenePack: 'interior', sampleTitle: '프리미엄 브랜드가\n선택하는 디테일' },

      // 미니멀 (5)
      { id: 'apple_clean', cat: '미니멀', name: '애플 클린 액자', bg: '#fbfbfd', card: '#f0f1f5', fg: '#1d1d1f', muted: '#6e6e73', accent: '#0071e3', pillBg: '#e8f2ff', pillFg: '#005bb5', fontKey: 'pretM', style: 'clean', coverLayout: 'photo_frame', bodyLayout: 'photo_frame', samplePhoto: '/assets/landing/ed-auto.jpg', scenePack: 'auto', sampleTitle: '실패 없는 선택\n핵심 체크리스트' },
      { id: 'swiss_poster', cat: '미니멀', name: '스위스 포스터', bg: '#f3f3f5', card: '#e4e4e7', fg: '#09090b', muted: '#52525b', accent: '#dc2626', pillBg: '#dc2626', pillFg: '#ffffff', fontKey: 'sunflower', style: 'swiss', coverLayout: 'photo_band', bodyLayout: 'photo_bottom', samplePhoto: '/assets/scenes/shop/2.jpg', scenePack: 'shop', sampleTitle: '군더더기 없이\n핵심만 요약하기' },
      { id: 'atelier_linen', cat: '미니멀', name: '아틀리에 리넨', bg: '#f2efe9', card: '#e6e1d6', fg: '#23221f', muted: '#6b685f', accent: '#4d7c0f', pillBg: '#4d7c0f', pillFg: '#ffffff', fontKey: 'jua', style: 'editorial', coverLayout: 'photo_arch', bodyLayout: 'photo_top', samplePhoto: '/assets/scenes/interior/3.jpg', scenePack: 'interior', sampleTitle: '차분한 하루를 위한\n미니멀 라이프' },
      { id: 'nordic_white', cat: '미니멀', name: '노르딕 화이트 분할', bg: '#ffffff', card: '#f4f4f5', fg: '#18181b', muted: '#71717a', accent: '#0f172a', pillBg: '#0f172a', pillFg: '#ffffff', fontKey: 'paperlogy', style: 'clean', coverLayout: 'photo_split_right', bodyLayout: 'photo_split_left', samplePhoto: '/assets/scenes/clinic/7.jpg', scenePack: 'clinic', sampleTitle: '깨끗한 여백으로\n신뢰감을 높이는 법' },
      { id: 'muji_note', cat: '미니멀', name: '무인양품 노트', bg: '#f6f4ee', card: '#ebe7dc', fg: '#292524', muted: '#78716c', accent: '#7f1d1d', pillBg: '#7f1d1d', pillFg: '#ffffff', fontKey: 'gowun', style: 'editorial', coverLayout: 'photo_duo', bodyLayout: 'photo_top', samplePhoto: '/assets/scenes/cafe/11.jpg', scenePack: 'cafe', sampleTitle: '꼭 필요한 것만 남긴\n심플 정리 노트' }
    ];
    const AR_CN_SHUFFLE_PALETTES = [
      { name: '아이보리·테라코타', bg: '#f8f3eb', accent: '#c2603f', fg: '#2c1f16' },
      { name: '세이지·포레스트', bg: '#ecf2ec', accent: '#2f6f4e', fg: '#16291e' },
      { name: '버터·에스프레소', bg: '#fdf8e6', accent: '#b45309', fg: '#2e2214' },
      { name: '로즈·버건디', bg: '#fdf2f4', accent: '#be185d', fg: '#2c131a' },
      { name: '페이퍼·코발트', bg: '#f4f1ea', accent: '#1d4ed8', fg: '#141414' },
      { name: '오트밀·크림슨', bg: '#f5ede0', accent: '#991b1b', fg: '#231b15' },
      { name: '차콜·앰버', bg: '#161514', accent: '#f59e0b', fg: '#faf7f2' },
      { name: '딥네이비·레몬', bg: '#0c1c42', accent: '#facc15', fg: '#ffffff' },
      { name: '옵시디언·오렌지', bg: '#111113', accent: '#f97316', fg: '#ffffff' },
      { name: '미드나잇·시안', bg: '#070b18', accent: '#22d3ee', fg: '#f0f9ff' },
      { name: '에스프레소·골드', bg: '#1e1612', accent: '#d4af37', fg: '#f5ebe0' },
      { name: '스위스·레드', bg: '#f5f5f4', accent: '#dc2626', fg: '#09090b' },
      { name: '라벤더·바이올렛', bg: '#f4f2fc', accent: '#7c3aed', fg: '#1f1933' },
      { name: '민트·딥그린', bg: '#eef7f4', accent: '#0f766e', fg: '#112a26' },
      { name: '피치·코랄', bg: '#fff3ee', accent: '#ea580c', fg: '#2b1815' },
      { name: '팝·옐로우', bg: '#fef08a', accent: '#111113', fg: '#111113' },
      { name: '클라우드·블루', bg: '#f0f5fb', accent: '#0071e3', fg: '#141c2b' },
      { name: '모노·블랙', bg: '#121212', accent: '#e5e5e5', fg: '#fafafa' }
    ];
    const AR_CN_PHOTO_LAYOUT_KEYS = [
      'photo_brand_chiptags', 'photo_phone_banner', 'photo_diagonal_wedge', 'photo_dual_compare',
      'photo_checker_split', 'photo_slash_kinetic', 'photo_bento_dark', 'photo_diamond_pop',
      'photo_bold_stamp', 'photo_neon_studio', 'photo_neon_card', 'photo_agency_brand',
      'photo_viral_sidefade', 'photo_viral_darkfade', 'photo_viral_colorword', 'photo_viral_duotag', 'photo_viral_viewfinder', 'photo_viral_glowcard',
      'photo_fade_bottom', 'photo_fade_top', 'photo_fade_duotone', 'photo_fade_radial',
      'photo_big_center', 'photo_big_bottom', 'photo_big_top', 'photo_big_outline', 'photo_big_box', 'photo_big_editorial',
      'photo_top', 'photo_full', 'photo_polaroid', 'photo_arch', 'photo_band', 'photo_frame', 'photo_bottom',
      'photo_split_left', 'photo_split_right', 'photo_newspaper', 'photo_receipt', 'photo_scrapbook',
      'photo_circle', 'photo_window', 'photo_filmstrip', 'photo_poster', 'photo_duo'
    ];
    const _arCnState = {
      templateId: 'bakery_curation',
      catFilter: 'all',
      sheetOpen: true,
      sheetTab: 'ai',     // 'ai' | 'theme' | 'text' | 'photo' | 'export'
      customColors: { bg: '', accent: '', fg: '' },
      bgGradient: '',     // '' = 템플릿 기본, 'none' = 단색 강제, 또는 AR_CN_GRADIENTS id
      fontKey: '',        // '' = 템플릿 고유 폰트, 또는 AR_CN_FONTS key
      ratio: '4:5',       // '4:5' (1080x1350) | '1:1' (1080x1080)
      fontScale: 'md',    // 'sm' | 'md' | 'lg'
      targetCount: 7,     // 5..10
      handle: '',
      designGuide: '',    // 디자인 MD 가이드 텍스트
      tweaks: { showPageNum: true, showProgress: true, showDots: true, showHandle: true, showHighlight: true },
      activeIdx: 0,
      slides: [],         // [{ role, kicker, title, body, highlight, bgImg, isUserPhoto, photoLayout }]
      hasAiGenerated: false,
      brandLoaded: false
    };

    function arCnGetTemplate(id) {
      return AR_CN_TEMPLATES.find((t) => t.id === id) || AR_CN_TEMPLATES[0];
    }
    function arCnIsDarkHex(hex) {
      const m = String(hex || '').replace('#', '');
      if (m.length !== 6) return false;
      const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) < 135;
    }
    function arCnEffectiveTheme(overrideTpl) {
      const base = overrideTpl || arCnGetTemplate(_arCnState.templateId);
      const useCustom = !overrideTpl;
      const gradId = useCustom
        ? (_arCnState.bgGradient === 'none' ? '' : (_arCnState.bgGradient || base.gradient || ''))
        : (base.gradient || '');
      const gradSpec = gradId ? arCnGetGradient(gradId) : null;
      const bg = (useCustom && _arCnState.customColors.bg) || (gradSpec ? gradSpec.stops[1] : base.bg);
      const accent = (useCustom && _arCnState.customColors.accent) || (useCustom && _arCnState.bgGradient && gradSpec ? gradSpec.accent : base.accent);
      const fg = (useCustom && _arCnState.customColors.fg) || (useCustom && _arCnState.bgGradient && gradSpec ? gradSpec.fg : base.fg);
      const dark = gradSpec ? Boolean(gradSpec.dark) : arCnIsDarkHex(bg);
      const muted = (useCustom && _arCnState.customColors.fg) ? fg : (dark ? 'rgba(248,250,252,0.78)' : (gradSpec ? 'rgba(30,24,20,0.72)' : base.muted));
      const card = (useCustom && (_arCnState.customColors.bg || _arCnState.bgGradient))
        ? (dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.56)')
        : base.card;
      const pillBg = (useCustom && _arCnState.customColors.accent) ? accent : (useCustom && _arCnState.bgGradient && gradSpec ? gradSpec.accent : base.pillBg);
      const pillFg = (useCustom && (_arCnState.customColors.accent || _arCnState.bgGradient)) ? (arCnIsDarkHex(pillBg) ? '#ffffff' : '#111113') : base.pillFg;
      const fKey = (useCustom && _arCnState.fontKey) || base.fontKey || 'pretM';
      const fSpec = arCnFontSpec(fKey);
      return {
        ...base, bg, accent, fg, muted, card, pillBg, pillFg,
        gradientId: gradId,
        gradSpec,
        fontKey: fKey,
        fontTitle: fSpec.family,
        fontTitleWeight: fSpec.weight,
        fontTitleMul: fSpec.mul,
        fontBody: "'Pretendard Variable', 'Pretendard', sans-serif",
        dark
      };
    }
    function arCnSlideSampleUrl(tpl, slideIdx) {
      if (slideIdx === 0 && tpl.samplePhoto) return tpl.samplePhoto;
      const pack = tpl.scenePack || 'cafe';
      const num = ((slideIdx) % 15) + 1;
      return `/assets/scenes/${pack}/${num}.jpg`;
    }
    function arCnPopulateSamplePhotos(applyLayouts = true) {
      const tpl = arCnGetTemplate(_arCnState.templateId);
      let pending = false;
      _arCnState.slides.forEach((s, i) => {
        if (applyLayouts && !s.userLayoutLocked) {
          s.photoLayout = i === 0 ? (tpl.coverLayout || 'photo_top') : (tpl.bodyLayout || 'photo_top');
        }
        if (s.isUserPhoto || s.userClearedPhoto) return;
        const url = arCnSlideSampleUrl(tpl, i);
        const ready = arCnLoadImgUrl(url, (loaded) => {
          if (!s.isUserPhoto && !s.userClearedPhoto) {
            s.bgImg = loaded;
            arCnRefreshUI(true);
          }
        });
        if (ready) s.bgImg = ready;
        else pending = true;
      });
      return pending;
    }
    function arCnDefaultSlides(count = 7, topic = '알아두면 바로 쓰는 핵심 가이드') {
      const tpl = arCnGetTemplate(_arCnState.templateId);
      const n = Math.max(5, Math.min(10, Math.floor(Number(count) || 7)));
      const bodyN = n - 2;
      const samplePts = [
        { t: '먼저 기준부터 정리하세요', b: '막연하게 시작하면 중간에 흔들리기 쉽습니다.\n핵심 기준 1가지만 먼저 정해 두세요.', h: '체크 1 · 기준 한 줄로 적기' },
        { t: '많이 놓치는 디테일 확인', b: '결과 차이는 대부분 작은 부분에서 갈립니다.\n체크리스트로 빠진 항목을 짚어 보세요.', h: '체크 2 · 필수 항목 3가지 점검' },
        { t: '바로 써먹는 실전 공식', b: '복잡한 이론보다 지금 당장 적용할 수 있는\n가장 단순한 순서로 실행해 보세요.', h: '체크 3 · 오늘 10분 바로 적용' },
        { t: '시간·비용 줄이는 요령', b: '비교할 항목을 3가지만 남기면\n결정 속도가 훨씬 빨라집니다.', h: '체크 4 · 핵심 3가지만 비교' },
        { t: '반응을 끌어올리는 포인트', b: '첫 문장에서 독자의 고민을 바로 짚어 주면\n끝까지 읽는 비율이 크게 높아집니다.', h: '체크 5 · 첫 줄에 핵심 담기' },
        { t: '꾸준히 유지하는 루틴', b: '완벽한 한 번보다 매주 같은 요일에\n가볍게 점검하는 습관이 훨씬 오래갑니다.', h: '체크 6 · 주 1회 10분 점검' },
        { t: '실수를 막는 최종 체크', b: '올리기 전 글자 크기와 여백만 한 번 더 봐도\n가독성이 확 살아납니다.', h: '체크 7 · 저장 전 최종 확인' },
        { t: '다음 단계로 넓혀 보기', b: '반응이 좋았던 카드는 시리즈로 묶어\n다음 주 콘텐츠로 이어가 보세요.', h: '체크 8 · 시리즈로 확장하기' }
      ];
      const out = [
        { role: 'cover', kicker: '핵심 요약 가이드', title: topic, body: `꼭 알아야 할 ${bodyN}가지 핵심만\n한눈에 보기 쉽게 정리했어요.`, highlight: '밀어서 확인하기 →', bgImg: null, isUserPhoto: false, photoLayout: tpl.coverLayout || 'photo_top' }
      ];
      for (let i = 0; i < bodyN; i++) {
        const p = samplePts[i % samplePts.length];
        out.push({ role: 'point', kicker: `POINT ${String(i + 1).padStart(2, '0')}`, title: p.t, body: p.b, highlight: p.h, bgImg: null, isUserPhoto: false, photoLayout: tpl.bodyLayout || 'photo_top' });
      }
      out.push({ role: 'cta', kicker: '저장 · 공유', title: '필요할 때 바로 꺼내 보세요', body: '도움이 되셨다면 저장해 두고\n주변 분들에게도 가볍게 공유해 주세요.', highlight: '궁금한 점은 댓글로 남겨 주세요', bgImg: null, isUserPhoto: false, photoLayout: tpl.bodyLayout || 'photo_top' });
      return out;
    }

    function arCnWrapLines(ctx, text, maxW) {
      const paras = String(text || '').replace(/\r/g, '').split('\n');
      const lines = [];
      paras.forEach((para) => {
        if (!para.trim()) { lines.push(''); return; }
        const words = para.split(' ');
        let cur = '';
        words.forEach((w) => {
          const test = cur ? `${cur} ${w}` : w;
          if (ctx.measureText(test).width <= maxW) {
            cur = test;
          } else {
            if (cur) lines.push(cur);
            if (ctx.measureText(w).width <= maxW) {
              cur = w;
            } else {
              let chunk = '';
              for (const ch of w) {
                if (ctx.measureText(chunk + ch).width > maxW && chunk) {
                  lines.push(chunk);
                  chunk = ch;
                } else {
                  chunk += ch;
                }
              }
              cur = chunk;
            }
          }
        });
        if (cur) lines.push(cur);
      });
      return lines;
    }

    function arCnRenderSlide(canvas, slide, slideIdx, totalSlides, overrideTpl = null) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const sc = W / 1080;
      const tpl = arCnEffectiveTheme(overrideTpl);
      const tW = tpl.fontTitleWeight || 700;
      const tMul = tpl.fontTitleMul || 1;
      if (!overrideTpl) arCnEnsureFont(tpl.fontKey, () => arCnRefreshUI(true));
      const tw = overrideTpl ? { showPageNum: true, showProgress: true, showDots: true, showHandle: false, showHighlight: true } : (_arCnState.tweaks || {});
      const fsMul = overrideTpl ? 1.0 : (_arCnState.fontScale === 'sm' ? 0.88 : (_arCnState.fontScale === 'lg' ? 1.12 : 1.0));
      const hasPhoto = Boolean(slide && slide.bgImg && slide.bgImg.naturalWidth);
      const wantLayout = (slide && slide.photoLayout) || (slideIdx === 0 ? tpl.coverLayout : tpl.bodyLayout) || 'photo_top';
      const pLayout = (hasPhoto && wantLayout !== 'text_only') ? wantLayout : 'text_only';
      const isBigTypo = pLayout.startsWith('photo_big_');
      const isPhotoFade = pLayout.startsWith('photo_fade_');
      const isViralFull = pLayout === 'photo_viral_sidefade' || pLayout === 'photo_viral_darkfade' || pLayout === 'photo_viral_colorword' || pLayout === 'photo_viral_duotag' || pLayout === 'photo_viral_viewfinder' || pLayout === 'photo_bold_stamp' || pLayout === 'photo_neon_card' || pLayout === 'photo_slash_kinetic';
      const isFullPhoto = pLayout === 'photo_full' || isBigTypo || pLayout === 'photo_fade_duotone' || isViralFull;
      const topOnPhoto = (isFullPhoto && pLayout !== 'photo_viral_viewfinder') || pLayout === 'photo_fade_bottom';
      const fg = isFullPhoto ? (pLayout === 'photo_big_box' ? tpl.fg : (arCnIsDarkHex(tpl.fg) ? '#ffffff' : tpl.fg)) : tpl.fg;
      const muted = isFullPhoto ? 'rgba(255,255,255,0.88)' : tpl.muted;
      const accent = isFullPhoto ? (pLayout === 'photo_big_box' ? tpl.accent : (arCnIsDarkHex(tpl.accent) ? '#facc15' : tpl.accent)) : tpl.accent;
      const isCover = slideIdx === 0 || (slide && slide.role === 'cover');
      const isCta = slideIdx === totalSlides - 1 || (slide && slide.role === 'cta');
      const padX = Math.round(84 * sc);
      const padY = Math.round(78 * sc);

      ctx.save();
      // 1) 배경 (템플릿 단색 / 메쉬 그라데이션 / 사진 페이드 그라데이션 / 풀사진)
      if (!isFullPhoto && tpl.gradSpec) {
        arCnDrawGradientBg(ctx, W, H, tpl.gradSpec);
      } else {
        ctx.fillStyle = tpl.bg;
        ctx.fillRect(0, 0, W, H);
      }
      if (pLayout === 'photo_fade_bottom') {
        // 상단 풀사진 → 하단 배경색으로 경계선 없이 부드럽게 녹아드는 페이드 그라데이션!
        const photoH = Math.round(H * 0.66);
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, photoH, 0, null);
        // 상단 헤더 가독성용 미세 상단 그림자
        const topSc = ctx.createLinearGradient(0, 0, 0, Math.round(180 * sc));
        topSc.addColorStop(0, 'rgba(0,0,0,0.44)');
        topSc.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topSc;
        ctx.fillRect(0, 0, W, Math.round(180 * sc));
        // 핵심: 사진 하단이 배경색(tpl.bg)으로 5단계 실키 페이드 아웃!
        const fadeG = ctx.createLinearGradient(0, Math.round(H * 0.22), 0, photoH + 2);
        fadeG.addColorStop(0, arHexToRgba(tpl.bg, 0));
        fadeG.addColorStop(0.32, arHexToRgba(tpl.bg, 0.22));
        fadeG.addColorStop(0.60, arHexToRgba(tpl.bg, 0.68));
        fadeG.addColorStop(0.84, arHexToRgba(tpl.bg, 0.95));
        fadeG.addColorStop(1, arHexToRgba(tpl.bg, 1));
        ctx.fillStyle = fadeG;
        ctx.fillRect(0, Math.round(H * 0.22), W, photoH - Math.round(H * 0.22) + 4);
      } else if (pLayout === 'photo_fade_top') {
        // 상단 배경색 → 하단 풀사진으로 경계선 없이 부드럽게 녹아드는 페이드 그라데이션!
        const photoTop = Math.round(H * 0.34);
        arCollageDrawCover(ctx, slide.bgImg, 0, photoTop, W, H - photoTop, 0, null);
        const fadeG = ctx.createLinearGradient(0, photoTop - 2, 0, Math.round(H * 0.78));
        fadeG.addColorStop(0, arHexToRgba(tpl.bg, 1));
        fadeG.addColorStop(0.22, arHexToRgba(tpl.bg, 0.92));
        fadeG.addColorStop(0.50, arHexToRgba(tpl.bg, 0.54));
        fadeG.addColorStop(0.78, arHexToRgba(tpl.bg, 0.14));
        fadeG.addColorStop(1, arHexToRgba(tpl.bg, 0));
        ctx.fillStyle = fadeG;
        ctx.fillRect(0, photoTop - 2, W, Math.round(H * 0.78) - photoTop + 4);
        // 하단 푸터 가독성용 미세 하단 페이드
        const footG = ctx.createLinearGradient(0, H - Math.round(145 * sc), 0, H);
        footG.addColorStop(0, 'rgba(0,0,0,0)');
        footG.addColorStop(1, 'rgba(0,0,0,0.52)');
        ctx.fillStyle = footG;
        ctx.fillRect(0, H - Math.round(145 * sc), W, Math.round(145 * sc));
      } else if (pLayout === 'photo_fade_radial') {
        // 사진 사방이 배경색으로 몽환적으로 녹아드는 스포트라이트 미스트 페이드!
        const photoH = Math.round(H * 0.64);
        arCollageDrawCover(ctx, slide.bgImg, 0, Math.round(60 * sc), W, photoH, 0, null);
        // 사방 원형 비네트 페이드
        const cx = W / 2, cy = Math.round(60 * sc + photoH * 0.46);
        const rG = ctx.createRadialGradient(cx, cy, W * 0.16, cx, cy, W * 0.62);
        rG.addColorStop(0, arHexToRgba(tpl.bg, 0));
        rG.addColorStop(0.52, arHexToRgba(tpl.bg, 0.28));
        rG.addColorStop(0.82, arHexToRgba(tpl.bg, 0.86));
        rG.addColorStop(1, arHexToRgba(tpl.bg, 1));
        ctx.fillStyle = rG;
        ctx.fillRect(0, 0, W, photoH + Math.round(80 * sc));
        // 상단·하단 추가 클린 블렌드
        const tG = ctx.createLinearGradient(0, 0, 0, Math.round(170 * sc));
        tG.addColorStop(0, arHexToRgba(tpl.bg, 1));
        tG.addColorStop(0.45, arHexToRgba(tpl.bg, 0.72));
        tG.addColorStop(1, arHexToRgba(tpl.bg, 0));
        ctx.fillStyle = tG;
        ctx.fillRect(0, 0, W, Math.round(170 * sc));
        const bG = ctx.createLinearGradient(0, Math.round(H * 0.42), 0, Math.round(H * 0.66) + Math.round(60 * sc));
        bG.addColorStop(0, arHexToRgba(tpl.bg, 0));
        bG.addColorStop(0.65, arHexToRgba(tpl.bg, 0.82));
        bG.addColorStop(1, arHexToRgba(tpl.bg, 1));
        ctx.fillStyle = bG;
        ctx.fillRect(0, Math.round(H * 0.42), W, Math.round(H * 0.32));
      } else if (pLayout === 'photo_fade_duotone') {
        // 사진 전체를 감성 컬러 그라데이션 틴트로 녹여낸 풀포토 화보!
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, H, 0, null);
        const stops = (tpl.gradSpec && tpl.gradSpec.stops) ? tpl.gradSpec.stops : [tpl.bg, tpl.accent, '#0a0b10'];
        const dg = ctx.createLinearGradient(0, 0, W * 0.85, H);
        dg.addColorStop(0, arHexToRgba(stops[0], 0.56));
        dg.addColorStop(0.45, arHexToRgba(stops[1] || tpl.accent, 0.34));
        dg.addColorStop(0.82, arHexToRgba(stops[2] || stops[0], 0.78));
        dg.addColorStop(1, arHexToRgba(tpl.bg, 0.94));
        ctx.fillStyle = dg;
        ctx.fillRect(0, 0, W, H);
      } else if (pLayout === 'photo_slash_kinetic') {
        // Pin #1: 고대비 흑백 풀사진 + 45° 골드/포인트 사선 슬래시 리본 & 코너 대각선 빗금(////)
        ctx.save();
        if (tpl.monoPhoto !== false) ctx.filter = 'grayscale(100%) contrast(1.18) brightness(0.82)';
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, H, 0, null);
        ctx.restore();
        const ac = tpl.accent || '#f5c400';
        ctx.save();
        // 상단 우측 → 하단 좌측 45° 사선 슬래시 2줄
        ctx.fillStyle = ac; ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.moveTo(W * 0.64, 0); ctx.lineTo(W * 0.82, 0);
        ctx.lineTo(W * 0.16, H); ctx.lineTo(-W * 0.02, H);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.24;
        ctx.beginPath();
        ctx.moveTo(W * 0.88, 0); ctx.lineTo(W * 0.96, 0);
        ctx.lineTo(W * 0.30, H); ctx.lineTo(W * 0.22, H);
        ctx.closePath(); ctx.fill();
        // 중앙 가독성용 다크 밴드
        ctx.globalAlpha = 1;
        const midSc = ctx.createLinearGradient(0, H * 0.28, 0, H * 0.78);
        midSc.addColorStop(0, 'rgba(10,10,12,0)');
        midSc.addColorStop(0.35, 'rgba(10,10,12,0.72)');
        midSc.addColorStop(0.68, 'rgba(10,10,12,0.72)');
        midSc.addColorStop(1, 'rgba(10,10,12,0.12)');
        ctx.fillStyle = midSc;
        ctx.fillRect(0, H * 0.28, W, H * 0.50);
        // 코너 평행 대각선 빗금 장식 (////)
        ctx.strokeStyle = ac; ctx.lineWidth = Math.max(1.5, 3 * sc);
        for (let di = 0; di < 5; di++) {
          const off = di * Math.round(24 * sc);
          ctx.beginPath();
          ctx.moveTo(W - Math.round(160 * sc) + off, H - Math.round(60 * sc));
          ctx.lineTo(W - Math.round(50 * sc) + off, H - Math.round(170 * sc));
          ctx.stroke();
        }
        ctx.restore();
      } else if (pLayout === 'photo_bold_stamp' || pLayout === 'photo_neon_card') {
        // Feed Bold Verde 스타일: 고대비 흑백 풀사진 + 깊은 다크 비네트 + 원형 스탬프 & 네온 도트 매트릭스!
        ctx.save();
        if (tpl.monoPhoto !== false) ctx.filter = 'grayscale(100%) contrast(1.16) brightness(0.86)';
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, H, 0, null);
        ctx.restore();
        const scG = ctx.createLinearGradient(0, 0, 0, H);
        scG.addColorStop(0, 'rgba(8,10,8,0.46)');
        scG.addColorStop(0.5, 'rgba(8,10,8,0.34)');
        scG.addColorStop(1, 'rgba(8,10,8,0.82)');
        ctx.fillStyle = scG;
        ctx.fillRect(0, 0, W, H);
        // 코너 원형 스탬프 + 네온 도트 매트릭스 장식
        const stampCol = tpl.accent || '#c8ff2e';
        const stampPos = slideIdx % 2 === 0 ? { x: W - Math.round(148 * sc), y: Math.round(212 * sc) } : { x: Math.round(148 * sc), y: Math.round(212 * sc) };
        arCnDrawCircularStamp(ctx, stampPos.x, stampPos.y, Math.round(62 * sc), 'EDITION · ARCHIVE · DESIGN · ', stampCol, sc);
        arCnDrawDotMatrix(ctx, W - Math.round(178 * sc), H - Math.round(240 * sc), 5, 6, Math.round(18 * sc), arHexToRgba(stampCol, 0.72), sc);
      } else if (pLayout === 'photo_viral_sidefade') {
        // 좌측→우측 다크 그라데이션 페이드 (남자눈썹·뷰티·클리닉 바이럴 스타일!)
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, H, 0, null);
        const sideG = ctx.createLinearGradient(0, 0, W * 0.92, 0);
        sideG.addColorStop(0, 'rgba(6,8,12,0.84)');
        sideG.addColorStop(0.46, 'rgba(6,8,12,0.62)');
        sideG.addColorStop(0.78, 'rgba(6,8,12,0.20)');
        sideG.addColorStop(1, 'rgba(6,8,12,0.06)');
        ctx.fillStyle = sideG;
        ctx.fillRect(0, 0, W, H);
        const botG = ctx.createLinearGradient(0, H * 0.62, 0, H);
        botG.addColorStop(0, 'rgba(6,8,12,0)');
        botG.addColorStop(1, 'rgba(6,8,12,0.74)');
        ctx.fillStyle = botG;
        ctx.fillRect(0, H * 0.62, W, H * 0.38);
      } else if (pLayout === 'photo_viral_darkfade') {
        // 흑백/시네마 풀사진 → 하단 순수 블랙 페이드 (인사이트·자기계발·러너 후킹 스타일!)
        ctx.save();
        if (tpl.monoPhoto) ctx.filter = 'grayscale(100%) contrast(1.12)';
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, H, 0, null);
        ctx.restore();
        const darkG = ctx.createLinearGradient(0, 0, 0, H);
        darkG.addColorStop(0, 'rgba(5,5,7,0.34)');
        darkG.addColorStop(0.36, 'rgba(5,5,7,0.12)');
        darkG.addColorStop(0.62, 'rgba(5,5,7,0.72)');
        darkG.addColorStop(0.82, 'rgba(5,5,7,0.96)');
        darkG.addColorStop(1, 'rgba(5,5,7,1)');
        ctx.fillStyle = darkG;
        ctx.fillRect(0, 0, W, H);
      } else if (pLayout === 'photo_viral_colorword') {
        // 선명한 사진 위 은은한 비네트 (토마토 코어 스타일 — 가운데 줄만 강렬한 포인트 컬러!)
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, H, 0, null);
        const vig = ctx.createRadialGradient(W * 0.56, H * 0.42, W * 0.14, W * 0.5, H * 0.5, W * 0.88);
        vig.addColorStop(0, 'rgba(0,0,0,0.16)');
        vig.addColorStop(0.65, 'rgba(0,0,0,0.44)');
        vig.addColorStop(1, 'rgba(0,0,0,0.72)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);
      } else if (pLayout === 'photo_viral_duotag') {
        // 생생한 풀사진 + 하단 투톤 스티커 라벨 (윔블던 잡학사전 스타일!)
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, H, 0, null);
        const subtleG = ctx.createLinearGradient(0, H * 0.55, 0, H);
        subtleG.addColorStop(0, 'rgba(0,0,0,0)');
        subtleG.addColorStop(1, 'rgba(0,0,0,0.48)');
        ctx.fillStyle = subtleG;
        ctx.fillRect(0, H * 0.55, W, H * 0.45);
      } else if (pLayout === 'photo_viral_viewfinder') {
        // 룩북 뷰파인더 풀사진 (PANTS KEYWORD 스타일!)
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, H, 0, null);
        const topWash = ctx.createLinearGradient(0, 0, 0, H * 0.36);
        topWash.addColorStop(0, 'rgba(255,255,255,0.68)');
        topWash.addColorStop(0.65, 'rgba(255,255,255,0.22)');
        topWash.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = topWash;
        ctx.fillRect(0, 0, W, H * 0.36);
      } else if (pLayout === 'photo_viral_glowcard') {
        // 파스텔/라임 오라 글로우 + 우측 블렌드 사진 (로코 여주 스타일!)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        const glow1 = ctx.createRadialGradient(W * 0.5, H * 0.85, W * 0.08, W * 0.5, H * 0.78, W * 0.82);
        glow1.addColorStop(0, arHexToRgba(tpl.accent || '#a3e635', 0.72));
        glow1.addColorStop(0.55, arHexToRgba(tpl.accent || '#a3e635', 0.28));
        glow1.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, W, H);
        // 우측 상단 라운드 인물/주제 사진 + 하단 글로우와 자연 블렌드
        const px = Math.round(W * 0.40), py = Math.round(112 * sc);
        const pw = Math.round(W * 0.54), ph = Math.round(H * 0.46);
        arCollageDrawCover(ctx, slide.bgImg, px, py, pw, ph, Math.round(28 * sc), null);
      } else if (isFullPhoto) {
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, H, 0, null);
        const scrim = ctx.createLinearGradient(0, 0, 0, H);
        if (pLayout === 'photo_big_top') {
          scrim.addColorStop(0, 'rgba(6,8,12,0.78)');
          scrim.addColorStop(0.45, 'rgba(6,8,12,0.34)');
          scrim.addColorStop(0.75, 'rgba(6,8,12,0.18)');
          scrim.addColorStop(1, 'rgba(6,8,12,0.74)');
        } else if (pLayout === 'photo_big_bottom') {
          scrim.addColorStop(0, 'rgba(6,8,12,0.34)');
          scrim.addColorStop(0.42, 'rgba(6,8,12,0.12)');
          scrim.addColorStop(0.68, 'rgba(6,8,12,0.64)');
          scrim.addColorStop(1, 'rgba(6,8,12,0.90)');
        } else if (isBigTypo) {
          scrim.addColorStop(0, 'rgba(6,8,12,0.46)');
          scrim.addColorStop(0.5, 'rgba(6,8,12,0.42)');
          scrim.addColorStop(1, 'rgba(6,8,12,0.78)');
        } else {
          scrim.addColorStop(0, 'rgba(8,10,16,0.34)');
          scrim.addColorStop(0.42, 'rgba(8,10,16,0.28)');
          scrim.addColorStop(0.72, 'rgba(8,10,16,0.72)');
          scrim.addColorStop(1, 'rgba(8,10,16,0.88)');
        }
        ctx.fillStyle = scrim;
        ctx.fillRect(0, 0, W, H);
      } else {
        if (tpl.style === 'news' || tpl.style === 'dark') {
          const glow = ctx.createRadialGradient(W * 0.84, H * 0.14, 10, W * 0.84, H * 0.14, W * 0.68);
          glow.addColorStop(0, tpl.style === 'news' ? 'rgba(250,204,21,0.10)' : 'rgba(249,115,22,0.12)');
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, W, H);
        } else if (tpl.style === 'editorial' || tpl.style === 'swiss') {
          ctx.strokeStyle = tpl.dark ? 'rgba(255,255,255,0.14)' : 'rgba(20,18,16,0.14)';
          ctx.lineWidth = Math.max(1, 2 * sc);
          ctx.strokeRect(Math.round(34 * sc), Math.round(34 * sc), W - Math.round(68 * sc), H - Math.round(68 * sc));
        }
      }

      // 2) 상단 진행바 + 배지 + 페이지 번호
      if (tw.showProgress !== false) {
        const topBarH = Math.max(2, Math.round(6 * sc));
        ctx.fillStyle = topOnPhoto ? 'rgba(255,255,255,0.24)' : tpl.card;
        ctx.fillRect(padX, Math.round(48 * sc), W - padX * 2, topBarH);
        ctx.fillStyle = accent;
        ctx.fillRect(padX, Math.round(48 * sc), Math.round((W - padX * 2) * ((slideIdx + 1) / Math.max(1, totalSlides))), topBarH);
      }

      const headerY = padY + Math.round(24 * sc);
      const kickerTxt = String((slide && slide.kicker) || '').trim();
      if (kickerTxt) {
        const kFs = Math.round(26 * sc);
        ctx.font = `700 ${kFs}px ${tpl.fontBody}`;
        const kw = ctx.measureText(kickerTxt).width + Math.round(36 * sc);
        const kh = Math.round(46 * sc);
        ctx.fillStyle = topOnPhoto ? 'rgba(0,0,0,0.42)' : tpl.pillBg;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padX, headerY - kh / 2, kw, kh, kh / 2);
        else ctx.rect(padX, headerY - kh / 2, kw, kh);
        ctx.fill();
        ctx.fillStyle = topOnPhoto ? '#ffffff' : tpl.pillFg;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(kickerTxt, padX + Math.round(18 * sc), headerY + 1);
      }
      if (tw.showPageNum !== false) {
        const pageTxt = `${String(slideIdx + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
        ctx.font = `700 ${Math.round(25 * sc)}px 'Pretendard', monospace`;
        ctx.fillStyle = topOnPhoto ? 'rgba(255,255,255,0.9)' : muted;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(pageTxt, W - padX, headerY);
      }

      const maxTextW = W - padX * 2;
      const titleStr = !overrideTpl && slide.captionStyle ? '' : String((slide && slide.title) || '').trim();
      const bodyStr = String((slide && slide.body) || '').trim();
      const hlStr = tw.showHighlight !== false ? String((slide && slide.highlight) || '').trim() : '';

      // 3) 8종 시각 사진·텍스트 레이아웃 분기
      let curY = Math.round(170 * sc);
      let skipBottomHl = false;

      if (pLayout === 'photo_brand_chiptags') {
        // 핀터레스트 Equilibi R1C3/R3C1: 비비드 브랜드 바탕 + 우측 곡선 엣지 포토 + 좌측 줄별 블랙 하이라이트 칩 + 하단 CTA
        const baseBg = tpl.bg || '#ffc800';
        const inkCol = arCnIsDarkHex(baseBg) ? '#ffffff' : '#0d0d0d';
        const chipBg = '#0d0d0d';
        const chipFg = '#ffffff';
        ctx.fillStyle = baseBg;
        ctx.fillRect(0, 0, W, H);
        // 배경 은은한 곡선 호 라인
        ctx.save();
        ctx.strokeStyle = arCnIsDarkHex(baseBg) ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.34)';
        ctx.lineWidth = Math.max(2, 3 * sc);
        ctx.beginPath(); ctx.arc(W * 0.14, H * 0.18, W * 0.48, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(W * 0.14, H * 0.18, W * 0.68, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        // 우측 58% 유기적 곡선 엣지 포토 클립
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(W * 0.44, 0);
        ctx.bezierCurveTo(W * 0.34, H * 0.30, W * 0.48, H * 0.68, W * 0.36, H);
        ctx.lineTo(W, H);
        ctx.lineTo(W, 0);
        ctx.closePath();
        ctx.clip();
        arCollageDrawCover(ctx, slide.bgImg, Math.round(W * 0.30), 0, Math.round(W * 0.72), H, 0, null);
        // 왼쪽 경계 부드러운 리프트 그림자
        const seamG = ctx.createLinearGradient(W * 0.32, 0, W * 0.50, 0);
        seamG.addColorStop(0, arHexToRgba(baseBg, 0.32));
        seamG.addColorStop(1, arHexToRgba(baseBg, 0));
        ctx.fillStyle = seamG;
        ctx.fillRect(W * 0.32, 0, W * 0.20, H);
        ctx.restore();
        // 좌상단 미니 브랜드 리본 아이콘 + 라벨
        const markY = Math.round(86 * sc);
        ctx.save();
        ctx.fillStyle = inkCol;
        ctx.beginPath();
        ctx.moveTo(padX, markY + Math.round(14 * sc));
        ctx.lineTo(padX + Math.round(18 * sc), markY - Math.round(14 * sc));
        ctx.lineTo(padX + Math.round(32 * sc), markY - Math.round(4 * sc));
        ctx.lineTo(padX + Math.round(14 * sc), markY + Math.round(24 * sc));
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(padX + Math.round(30 * sc), markY + Math.round(14 * sc), Math.round(6 * sc), 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `800 ${Math.round(25 * sc)}px ${tpl.fontBody}`;
        ctx.fillStyle = inkCol; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(String(kickerTxt || 'BRAND STORY').slice(0, 18), padX + Math.round(46 * sc), markY + Math.round(4 * sc));
        ctx.restore();
        // 우상단 페이지 배지
        if (tw.showPageNum !== false) {
          const pgTxt = `${String(slideIdx + 1).padStart(2, '0')}/${String(totalSlides).padStart(2, '0')}`;
          ctx.font = `700 ${Math.round(22 * sc)}px 'JetBrains Mono', monospace`;
          const pgW = ctx.measureText(pgTxt).width + Math.round(28 * sc);
          const pgH = Math.round(38 * sc);
          ctx.fillStyle = 'rgba(13,13,13,0.52)';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(W - padX - pgW, markY - pgH / 2 + Math.round(4 * sc), pgW, pgH, pgH / 2);
          else ctx.rect(W - padX - pgW, markY - pgH / 2 + Math.round(4 * sc), pgW, pgH);
          ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(pgTxt, W - padX - pgW / 2, markY + Math.round(5 * sc));
        }
        // 좌측 줄별 블랙 하이라이트 칩 제목 (사진 경계를 살짝 넘나드는 시그니처 스택!)
        const chipTitleFs = Math.round((isCover ? 66 : 58) * sc * fsMul * tMul);
        ctx.font = `${tW} ${chipTitleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, Math.round(W * 0.56)).slice(0, 4);
        const chipPadX = Math.round(18 * sc);
        const chipPadY = Math.round(10 * sc);
        const chipH = Math.round(chipTitleFs * 1.06) + chipPadY * 2;
        const chipGap = Math.round(8 * sc);
        curY = Math.round(H * 0.25);
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        tLines.forEach((ln) => {
          const lw = Math.ceil(ctx.measureText(ln).width) + chipPadX * 2;
          ctx.fillStyle = chipBg;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(padX, curY, lw, chipH, Math.round(10 * sc));
          else ctx.rect(padX, curY, lw, chipH);
          ctx.fill();
          ctx.fillStyle = chipFg;
          ctx.fillText(ln, padX + chipPadX, curY + chipH / 2 + Math.round(2 * sc));
          curY += chipH + chipGap;
        });
        // 좌측 하단 짧은 본문
        if (bodyStr) {
          curY += Math.round(18 * sc);
          const bodyFs = Math.round(27 * sc * fsMul);
          ctx.font = `600 ${bodyFs}px ${tpl.fontBody}`;
          ctx.fillStyle = arCnIsDarkHex(baseBg) ? 'rgba(255,255,255,0.9)' : 'rgba(13,13,13,0.84)';
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          const bLines = arCnWrapLines(ctx, bodyStr, Math.round(W * 0.36)).slice(0, 4);
          const bLH = Math.round(bodyFs * 1.44);
          bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
        }
        // 좌하단 콤팩트 블랙 CTA 캡슐
        const ctaTxt = (hlStr || '자세히 보기').slice(0, 22);
        const ctaFs = Math.round(24 * sc);
        ctx.font = `800 ${ctaFs}px ${tpl.fontBody}`;
        const ctaW = Math.min(Math.round(W * 0.42), ctx.measureText(ctaTxt).width + Math.round(44 * sc));
        const ctaH = Math.round(58 * sc);
        const ctaY = H - Math.round(124 * sc);
        ctx.fillStyle = chipBg;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padX, ctaY, ctaW, ctaH, Math.round(12 * sc));
        else ctx.rect(padX, ctaY, ctaW, ctaH);
        ctx.fill();
        ctx.fillStyle = chipFg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ctaTxt, padX + ctaW / 2, ctaY + ctaH / 2 + 1);
        skipBottomHl = true;
      } else if (pLayout === 'photo_phone_banner') {
        // 핀터레스트 Equilibi R1C2: 화이트 캔버스 + 상단 중앙 헤드라인 + 하단 스마트폰 목업 + 가로 플로팅 컬러 배너
        const acCol = (tpl.accent && tpl.accent.toLowerCase() !== '#0d0d0d' && tpl.accent.toLowerCase() !== '#ffffff') ? tpl.accent : '#ffc800';
        const acInk = arCnIsDarkHex(acCol) ? '#ffffff' : '#0d0d0d';
        ctx.fillStyle = tpl.bg || '#ffffff';
        ctx.fillRect(0, 0, W, H);
        const topInk = arCnIsDarkHex(tpl.bg || '#ffffff') ? '#ffffff' : '#0d0d0d';
        // 상단 중앙 브랜드 마크
        const topY = Math.round(74 * sc);
        const lbl = String(kickerTxt || 'FEATURE').slice(0, 18);
        ctx.font = `800 ${Math.round(24 * sc)}px ${tpl.fontBody}`;
        const lw = ctx.measureText(lbl).width;
        const markX = W / 2 - (lw + Math.round(38 * sc)) / 2;
        ctx.fillStyle = acCol;
        ctx.beginPath();
        ctx.moveTo(markX, topY + Math.round(12 * sc));
        ctx.lineTo(markX + Math.round(15 * sc), topY - Math.round(12 * sc));
        ctx.lineTo(markX + Math.round(26 * sc), topY - Math.round(4 * sc));
        ctx.lineTo(markX + Math.round(11 * sc), topY + Math.round(20 * sc));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = topInk; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, markX + Math.round(34 * sc), topY + Math.round(3 * sc));
        // 상단 중앙 2줄 볼드 헤드라인
        const titleFs = Math.round((isCover ? 66 : 58) * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW * 0.92).slice(0, 2);
        const tLH = Math.round(titleFs * 1.18);
        curY = Math.round(134 * sc);
        ctx.fillStyle = topInk; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        // 하단 중앙 다크 스마트폰 목업 프레임
        const phW = Math.round(W * 0.62);
        const phX = Math.round((W - phW) / 2);
        const phY = Math.max(curY + Math.round(34 * sc), Math.round(H * 0.30));
        const phH = H - phY + Math.round(56 * sc);
        const bezel = Math.round(16 * sc);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = Math.round(40 * sc); ctx.shadowOffsetY = Math.round(16 * sc);
        ctx.fillStyle = '#121215';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(phX, phY, phW, phH, Math.round(62 * sc));
        else ctx.rect(phX, phY, phW, phH);
        ctx.fill();
        ctx.restore();
        // 폰 스크린 내부 사진
        arCollageDrawCover(ctx, slide.bgImg, phX + bezel, phY + bezel, phW - bezel * 2, phH - bezel * 2, Math.round(46 * sc), null);
        // 스크린 하단 어두운 비네팅 (하단 CTA 가독성)
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(phX + bezel, phY + bezel, phW - bezel * 2, phH - bezel * 2, Math.round(46 * sc));
        else ctx.rect(phX + bezel, phY + bezel, phW - bezel * 2, phH - bezel * 2);
        ctx.clip();
        const scFade = ctx.createLinearGradient(0, H * 0.68, 0, H);
        scFade.addColorStop(0, 'rgba(0,0,0,0)');
        scFade.addColorStop(1, 'rgba(0,0,0,0.72)');
        ctx.fillStyle = scFade;
        ctx.fillRect(phX + bezel, H * 0.68, phW - bezel * 2, H * 0.34);
        // 다이내믹 아일랜드 노치
        ctx.fillStyle = '#0d0d10';
        const islW = Math.round(138 * sc), islH = Math.round(32 * sc);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(W / 2 - islW / 2, phY + bezel + Math.round(18 * sc), islW, islH, islH / 2);
        else ctx.rect(W / 2 - islW / 2, phY + bezel + Math.round(18 * sc), islW, islH);
        ctx.fill();
        ctx.restore();
        // 스마트폰을 가로지르는 플로팅 라운드 컬러 배너 (본문)
        const banW = Math.round(W * 0.80);
        const banX = Math.round((W - banW) / 2);
        const bodyFs = Math.round(30 * sc * fsMul);
        ctx.font = `700 ${bodyFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr || '지금 시작하면 가장 먼저 혜택을 받아보실 수 있어요.', banW - Math.round(76 * sc)).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.46);
        const banH = Math.max(Math.round(146 * sc), bLines.length * bLH + Math.round(62 * sc));
        const banY = Math.round(H * 0.56);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.24)'; ctx.shadowBlur = Math.round(32 * sc); ctx.shadowOffsetY = Math.round(12 * sc);
        ctx.fillStyle = acCol;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(banX, banY, banW, banH, Math.round(24 * sc));
        else ctx.rect(banX, banY, banW, banH);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = acInk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const textStartY = banY + (banH - (bLines.length - 1) * bLH) / 2;
        bLines.forEach((ln, bi) => { ctx.fillText(ln, W / 2, textStartY + bi * bLH); });
        // 하단 중앙 콤팩트 CTA 버튼
        const ctaTxt = (hlStr || '지금 시작하기').slice(0, 22);
        ctx.font = `800 ${Math.round(24 * sc)}px ${tpl.fontBody}`;
        const ctaW = Math.min(phW - Math.round(80 * sc), ctx.measureText(ctaTxt).width + Math.round(52 * sc));
        const ctaH = Math.round(56 * sc);
        const ctaY = H - Math.round(108 * sc);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(W / 2 - ctaW / 2, ctaY, ctaW, ctaH, Math.round(12 * sc));
        else ctx.rect(W / 2 - ctaW / 2, ctaY, ctaW, ctaH);
        ctx.fill();
        ctx.fillStyle = '#0d0d0d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ctaTxt, W / 2, ctaY + ctaH / 2 + 1);
        skipBottomHl = true;
      } else if (pLayout === 'photo_diagonal_wedge') {
        // 핀터레스트 Equilibi R2C3/R4C1: 화이트 상단 + 20° 사선 브랜드 컬러 웨지 + 틸트(-20°) 스마트폰 목업
        const acCol = (tpl.accent && tpl.accent.toLowerCase() !== '#0d0d0d' && tpl.accent.toLowerCase() !== '#ffffff') ? tpl.accent : '#ffc800';
        const bgCol = tpl.bg || '#ffffff';
        const topInk = arCnIsDarkHex(bgCol) ? '#ffffff' : '#0d0d0d';
        const topMut = arCnIsDarkHex(bgCol) ? 'rgba(255,255,255,0.78)' : '#4b5563';
        ctx.fillStyle = bgCol;
        ctx.fillRect(0, 0, W, H);
        // 하단 20° 사선 웨지 (좌하 → 우중단 상승)
        ctx.save();
        ctx.fillStyle = acCol;
        ctx.beginPath();
        ctx.moveTo(0, H * 0.72);
        ctx.lineTo(W, H * 0.45);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        // 웨지 내부 은은한 원형 아크
        ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = Math.max(2, 3 * sc);
        ctx.beginPath(); ctx.arc(W * 0.88, H * 0.96, W * 0.46, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        // 우상단 브랜드 리본 + 페이지
        const topY = Math.round(84 * sc);
        const brandLbl = String(kickerTxt || 'APP GUIDE').slice(0, 16);
        ctx.font = `800 ${Math.round(23 * sc)}px ${tpl.fontBody}`;
        const blw = ctx.measureText(brandLbl).width;
        const bx = W - padX - blw - Math.round(32 * sc);
        ctx.fillStyle = acCol;
        ctx.beginPath();
        ctx.moveTo(bx, topY + Math.round(12 * sc));
        ctx.lineTo(bx + Math.round(14 * sc), topY - Math.round(12 * sc));
        ctx.lineTo(bx + Math.round(24 * sc), topY - Math.round(4 * sc));
        ctx.lineTo(bx + Math.round(10 * sc), topY + Math.round(20 * sc));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = topInk; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(brandLbl, bx + Math.round(30 * sc), topY + Math.round(3 * sc));
        // 좌상단 3줄 볼드 제목 + 간결한 본문 + 블랙 CTA 버튼
        const titleFs = Math.round((isCover ? 66 : 58) * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, Math.round(W * 0.60)).slice(0, 3);
        const tLH = Math.round(titleFs * 1.18);
        curY = Math.round(134 * sc);
        ctx.fillStyle = topInk; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        if (bodyStr) {
          curY += Math.round(14 * sc);
          const bodyFs = Math.round(27 * sc * fsMul);
          ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
          ctx.fillStyle = topMut;
          const bLines = arCnWrapLines(ctx, bodyStr, Math.round(W * 0.56)).slice(0, 2);
          bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += Math.round(bodyFs * 1.42); });
        }
        curY += Math.round(24 * sc);
        const ctaTxt = (hlStr || '지금 신청하기').slice(0, 20);
        ctx.font = `800 ${Math.round(24 * sc)}px ${tpl.fontBody}`;
        const ctaW = Math.min(Math.round(W * 0.44), ctx.measureText(ctaTxt).width + Math.round(46 * sc));
        const ctaH = Math.round(56 * sc);
        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padX, curY, ctaW, ctaH, Math.round(11 * sc));
        else ctx.rect(padX, curY, ctaW, ctaH);
        ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ctaTxt, padX + ctaW / 2, curY + ctaH / 2 + 1);
        // 우하단 틸트(-24°) 스마트폰 목업 + 내부 사진 & 미니 상태바
        ctx.save();
        ctx.translate(W * 0.62, H * 0.72);
        ctx.rotate(-0.42);
        const mw = Math.round(W * 0.54);
        const mh = Math.round(H * 0.52);
        const mx = -mw / 2, my = -mh / 2;
        const mb = Math.round(14 * sc);
        ctx.shadowColor = 'rgba(0,0,0,0.32)'; ctx.shadowBlur = Math.round(42 * sc); ctx.shadowOffsetY = Math.round(22 * sc);
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(mx, my, mw, mh, Math.round(52 * sc));
        else ctx.rect(mx, my, mw, mh);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = Math.max(1.5, 2.5 * sc);
        ctx.stroke();
        arCollageDrawCover(ctx, slide.bgImg, mx + mb, my + mb, mw - mb * 2, mh - mb * 2, Math.round(40 * sc), null);
        // 다이내믹 아일랜드 노치
        ctx.fillStyle = '#0d0d10';
        const nw = Math.round(118 * sc), nh = Math.round(26 * sc);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-nw / 2, my + mb + Math.round(14 * sc), nw, nh, nh / 2);
        else ctx.rect(-nw / 2, my + mb + Math.round(14 * sc), nw, nh);
        ctx.fill();
        ctx.restore();
        skipBottomHl = true;
      } else if (pLayout === 'photo_dual_compare') {
        // 핀터레스트 Equilibi R3C2: 화이트 캔버스 + 상단 라운드 블랙 카드(좌글·우사진) + 하단 라운드 컬러 카드(좌사진·우글+CTA)
        const acCol = (tpl.accent && tpl.accent.toLowerCase() !== '#0d0d0d' && tpl.accent.toLowerCase() !== '#ffffff') ? tpl.accent : '#ffc800';
        const acInk = arCnIsDarkHex(acCol) ? '#ffffff' : '#0d0d0d';
        const bgCol = tpl.bg || '#ffffff';
        const topInk = arCnIsDarkHex(bgCol) ? '#ffffff' : '#0d0d0d';
        ctx.fillStyle = bgCol;
        ctx.fillRect(0, 0, W, H);
        // 상단 중앙 브랜드 마크
        const topY = Math.round(72 * sc);
        const lbl = String(kickerTxt || 'BEFORE & AFTER').slice(0, 20);
        ctx.font = `800 ${Math.round(24 * sc)}px ${tpl.fontBody}`;
        const lw = ctx.measureText(lbl).width;
        const markX = W / 2 - (lw + Math.round(38 * sc)) / 2;
        ctx.fillStyle = acCol;
        ctx.beginPath();
        ctx.moveTo(markX, topY + Math.round(12 * sc));
        ctx.lineTo(markX + Math.round(15 * sc), topY - Math.round(12 * sc));
        ctx.lineTo(markX + Math.round(26 * sc), topY - Math.round(4 * sc));
        ctx.lineTo(markX + Math.round(11 * sc), topY + Math.round(20 * sc));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = topInk; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, markX + Math.round(34 * sc), topY + Math.round(3 * sc));
        const cardX = Math.round(64 * sc);
        const cardW = W - cardX * 2;
        const cardGap = Math.round(36 * sc);
        const cardTopY = Math.round(136 * sc);
        const cardH = Math.round((H - cardTopY - Math.round(102 * sc) - cardGap) / 2);
        const cardR = Math.round(34 * sc);
        // 카드 1: 상단 다크 라운드 카드 (좌측 화이트 헤드라인 + 우측 사진 프레임)
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.14)'; ctx.shadowBlur = Math.round(28 * sc); ctx.shadowOffsetY = Math.round(10 * sc);
        ctx.fillStyle = '#0d0d0f';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cardX, cardTopY, cardW, cardH, cardR);
        else ctx.rect(cardX, cardTopY, cardW, cardH);
        ctx.fill();
        ctx.restore();
        const padIn = Math.round(42 * sc);
        const photoW1 = Math.round(cardW * 0.40);
        const photoH1 = cardH - Math.round(40 * sc);
        arCollageDrawCover(ctx, slide.bgImg, cardX + cardW - photoW1 - Math.round(20 * sc), cardTopY + Math.round(20 * sc), photoW1, photoH1, Math.round(24 * sc), null);
        const tFs = Math.round((isCover ? 52 : 46) * sc * fsMul * tMul);
        ctx.font = `${tW} ${tFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, cardW - photoW1 - padIn * 2 - Math.round(12 * sc)).slice(0, 3);
        const tLH = Math.round(tFs * 1.24);
        const tStartY = cardTopY + (cardH - tLines.length * tLH) / 2 + Math.round(4 * sc);
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln, i) => { ctx.fillText(ln, cardX + padIn, tStartY + i * tLH); });
        // 카드 2: 하단 브랜드 컬러 라운드 카드 (좌측 사진 프레임 + 우측 본문 & CTA 버튼)
        const card2Y = cardTopY + cardH + cardGap;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.14)'; ctx.shadowBlur = Math.round(28 * sc); ctx.shadowOffsetY = Math.round(10 * sc);
        ctx.fillStyle = acCol;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cardX, card2Y, cardW, cardH, cardR);
        else ctx.rect(cardX, card2Y, cardW, cardH);
        ctx.fill();
        ctx.restore();
        arCollageDrawCover(ctx, slide.bgImg, cardX + Math.round(20 * sc), card2Y + Math.round(20 * sc), photoW1, photoH1, Math.round(24 * sc), null);
        const rightTextX = cardX + photoW1 + Math.round(48 * sc);
        const rightTextW = cardW - photoW1 - Math.round(80 * sc);
        const bFs = Math.round(32 * sc * fsMul);
        ctx.font = `700 ${bFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr || '두 가지 장점을 한 번에 누리세요.', rightTextW).slice(0, 3);
        const bLH = Math.round(bFs * 1.38);
        const ctaH = Math.round(56 * sc);
        const blockH = bLines.length * bLH + Math.round(24 * sc) + ctaH;
        let ry2 = card2Y + (cardH - blockH) / 2;
        ctx.fillStyle = acInk; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        bLines.forEach((ln) => { ctx.fillText(ln, rightTextX, ry2); ry2 += bLH; });
        ry2 += Math.round(20 * sc);
        const ctaTxt = (hlStr || '바로 시작하기').slice(0, 18);
        ctx.font = `800 ${Math.round(24 * sc)}px ${tpl.fontBody}`;
        const ctaW = Math.min(rightTextW, ctx.measureText(ctaTxt).width + Math.round(46 * sc));
        ctx.fillStyle = arCnIsDarkHex(acCol) ? '#ffffff' : '#0d0d0d';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rightTextX, ry2, ctaW, ctaH, Math.round(12 * sc));
        else ctx.rect(rightTextX, ry2, ctaW, ctaH);
        ctx.fill();
        ctx.fillStyle = arCnIsDarkHex(acCol) ? '#0d0d0d' : '#ffffff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ctaTxt, rightTextX + ctaW / 2, ry2 + ctaH / 2 + 1);
        skipBottomHl = true;
      } else if (pLayout === 'photo_checker_split') {
        // Pin #2: 짝수·홀수 카드마다 카본 블랙 ↔ 네온 라임(포인트색)이 교차 반전되는 체커보드 좌우 분할 캐러셀!
        const isAltBright = (slideIdx % 2 === 1);
        const bgCol = isAltBright ? (tpl.accent || '#a3e600') : (tpl.bg || '#0f0f0f');
        const mainFg = isAltBright ? '#0e0f0c' : '#ffffff';
        const hiFg = isAltBright ? '#1f4d0e' : (tpl.accent || '#a3e600');
        const bodyFg = isAltBright ? 'rgba(14,15,12,0.82)' : 'rgba(255,255,255,0.80)';
        // 전체 체커보드 바탕 채우기 (교차 반전)
        ctx.fillStyle = bgCol;
        ctx.fillRect(0, 0, W, H);
        // 다크 타일 은은한 동심원 HUD 링
        if (!isAltBright) {
          ctx.save();
          ctx.strokeStyle = arHexToRgba(hiFg, 0.10);
          ctx.lineWidth = Math.max(1, 2 * sc);
          [0.24, 0.38, 0.52].forEach((rr) => {
            ctx.beginPath(); ctx.arc(W * 0.78, H * 0.52, W * rr, 0, Math.PI * 2); ctx.stroke();
          });
          ctx.restore();
        }
        // 상단 헤더 (좌측 배지 + 우측 ••• 도트)
        ctx.font = `800 ${Math.round(24 * sc)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = mainFg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(String(kickerTxt || `STEP ${String(slideIdx + 1).padStart(2, '0')}`).toUpperCase().slice(0, 18), padX, Math.round(92 * sc));
        for (let di = 0; di < 3; di++) {
          ctx.fillStyle = di === (slideIdx % 3) ? hiFg : mainFg;
          ctx.globalAlpha = di === (slideIdx % 3) ? 1 : 0.35;
          ctx.beginPath();
          ctx.arc(W - padX - (2 - di) * Math.round(22 * sc), Math.round(92 * sc), Math.round(6 * sc), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        // 좌측 52% 텍스트 스택 (2톤 볼드 제목 + 짧은 가로선 + 본문 + 캡슐 아웃라인 CTA)
        const leftW = Math.round(W * 0.48);
        const titleFs = Math.round((isCover ? 74 : 66) * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, leftW).slice(0, 4);
        const tLH = Math.round(titleFs * 1.16);
        curY = Math.round(188 * sc);
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln, li) => {
          ctx.fillStyle = li === 1 ? hiFg : mainFg;
          ctx.fillText(ln, padX, curY);
          curY += tLH;
        });
        curY += Math.round(18 * sc);
        ctx.fillStyle = hiFg;
        ctx.fillRect(padX, curY, Math.round(52 * sc), Math.max(2, Math.round(5 * sc)));
        curY += Math.round(26 * sc);
        const bodyFs = Math.round(29 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = bodyFg;
        const bLines = arCnWrapLines(ctx, bodyStr, leftW).slice(0, 5);
        const bLH = Math.round(bodyFs * 1.5);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
        // 우측 44% 플로팅 쇼케이스 사진 카드
        const rx = padX + leftW + Math.round(26 * sc);
        const rw = W - padX - rx;
        const ry = Math.round(206 * sc);
        const rh = Math.round(H * 0.56);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = Math.round(32 * sc); ctx.shadowOffsetY = Math.round(14 * sc);
        arCollageDrawCover(ctx, slide.bgImg, rx, ry, rw, rh, Math.round(24 * sc), null);
        ctx.restore();
        ctx.strokeStyle = isAltBright ? 'rgba(14,15,12,0.28)' : arHexToRgba(hiFg, 0.45);
        ctx.lineWidth = Math.max(1.5, 2.5 * sc);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rx, ry, rw, rh, Math.round(24 * sc));
        else ctx.rect(rx, ry, rw, rh);
        ctx.stroke();
        // 좌측 하단 1px 아웃라인 캡슐 CTA 버튼
        const ctaTxt = (hlStr || 'SWIPE NEXT →').slice(0, 22);
        const ctaY = H - Math.round(154 * sc);
        const ctaH = Math.round(54 * sc);
        ctx.font = `700 ${Math.round(23 * sc)}px ${tpl.fontBody}`;
        const ctaW = Math.min(leftW + Math.round(40 * sc), ctx.measureText(ctaTxt).width + Math.round(48 * sc));
        ctx.strokeStyle = isAltBright ? '#0e0f0c' : hiFg;
        ctx.lineWidth = Math.max(1.5, 2.5 * sc);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padX, ctaY, ctaW, ctaH, ctaH / 2);
        else ctx.rect(padX, ctaY, ctaW, ctaH);
        ctx.stroke();
        ctx.fillStyle = isAltBright ? '#0e0f0c' : hiFg;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ctaTxt, padX + ctaW / 2, ctaY + ctaH / 2 + 1);
        skipBottomHl = true;
      } else if (pLayout === 'photo_slash_kinetic') {
        // Pin #1 R3C2: 45° 사선 슬래시 위 중앙 볼드 헤드라인 + 포인트 언더라인
        const titleFs = Math.round((isCover ? 92 : 80) * sc * fsMul * tMul);
        const bodyFs = Math.round(32 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 3);
        const tLH = Math.round(titleFs * 1.16);
        const blockH = tLines.length * tLH + Math.round(120 * sc);
        curY = Math.round((H - blockH) * 0.48);
        ctx.save();
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = Math.round(28 * sc); ctx.shadowOffsetY = Math.round(8 * sc);
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = tpl.accent || '#f5c400';
        ctx.fillRect(W / 2 - Math.round(64 * sc), curY + Math.round(12 * sc), Math.round(128 * sc), Math.max(3, Math.round(8 * sc)));
        curY += Math.round(44 * sc);
        ctx.font = `600 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.88).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.46);
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += bLH; });
        ctx.restore();
      } else if (pLayout === 'photo_bento_dark') {
        // Pin #1 R4C1: 비대칭 2×2 다크×골드 벤토 그리드!
        const ac = tpl.accent || '#f5c400';
        const topY = Math.round(142 * sc);
        const totalH = H - topY - Math.round(118 * sc);
        const gap = Math.round(18 * sc);
        const leftW = Math.round((maxTextW - gap) * 0.48);
        const rightW = maxTextW - gap - leftW;
        const leftTopH = Math.round(totalH * 0.36);
        const leftBotH = totalH - gap - leftTopH;
        const rightTopH = Math.round(totalH * 0.64);
        const rightBotH = totalH - gap - rightTopH;
        const nextSlide = (!overrideTpl && _arCnState.slides.length > 1) ? _arCnState.slides[(slideIdx + 1) % _arCnState.slides.length] : null;
        const img2 = (nextSlide && nextSlide.bgImg && nextSlide.bgImg.naturalWidth) ? nextSlide.bgImg : slide.bgImg;
        // 1) 좌상단: 골드 틴트 서브 포토
        arCollageDrawCover(ctx, img2, padX, topY, leftW, leftTopH, Math.round(14 * sc), null);
        ctx.fillStyle = arHexToRgba(ac, 0.36);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padX, topY, leftW, leftTopH, Math.round(14 * sc));
        else ctx.rect(padX, topY, leftW, leftTopH);
        ctx.fill();
        // 2) 우상단: 고대비 흑백 대형 세로 포토
        ctx.save();
        if (tpl.monoPhoto !== false) ctx.filter = 'grayscale(100%) contrast(1.16)';
        arCollageDrawCover(ctx, slide.bgImg, padX + leftW + gap, topY, rightW, rightTopH, Math.round(14 * sc), null);
        ctx.restore();
        // 3) 좌하단: 다크 카피 카드 (제목 + 본문)
        const lbY = topY + leftTopH + gap;
        ctx.fillStyle = '#18181c';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padX, lbY, leftW, leftBotH, Math.round(14 * sc));
        else ctx.rect(padX, lbY, leftW, leftBotH);
        ctx.fill();
        ctx.fillStyle = ac;
        ctx.fillRect(padX + Math.round(28 * sc), lbY + Math.round(30 * sc), Math.round(48 * sc), Math.max(2, Math.round(5 * sc)));
        let ly = lbY + Math.round(56 * sc);
        const titleFs = Math.round(42 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        const tLines = arCnWrapLines(ctx, titleStr, leftW - Math.round(56 * sc)).slice(0, 3);
        const tLH = Math.round(titleFs * 1.24);
        tLines.forEach((ln) => { ctx.fillText(ln, padX + Math.round(28 * sc), ly); ly += tLH; });
        ly += Math.round(18 * sc);
        const bodyFs = Math.round(26 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        const bLines = arCnWrapLines(ctx, bodyStr, leftW - Math.round(56 * sc)).slice(0, 5);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX + Math.round(28 * sc), ly); ly += bLH; });
        // 4) 우하단: 골드 포인트 CTA 블록
        const rbX = padX + leftW + gap, rbY = topY + rightTopH + gap;
        ctx.fillStyle = ac;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rbX, rbY, rightW, rightBotH, Math.round(14 * sc));
        else ctx.rect(rbX, rbY, rightW, rightBotH);
        ctx.fill();
        ctx.fillStyle = '#0e0e10';
        ctx.font = `800 ${Math.round(28 * sc)}px ${tpl.fontTitle}`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        const ctaLns = arCnWrapLines(ctx, hlStr || '밀어서 확인 →', rightW - Math.round(48 * sc)).slice(0, 2);
        let ry0 = rbY + Math.round(32 * sc);
        ctaLns.forEach((ln) => { ctx.fillText(ln, rbX + Math.round(24 * sc), ry0); ry0 += Math.round(38 * sc); });
        ctx.font = `700 ${Math.round(56 * sc)}px 'JetBrains Mono', monospace`;
        ctx.globalAlpha = 0.22; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText(String(slideIdx + 1).padStart(2, '0'), rbX + rightW - Math.round(20 * sc), rbY + rightBotH - Math.round(12 * sc));
        ctx.globalAlpha = 1;
        skipBottomHl = true;
      } else if (pLayout === 'photo_diamond_pop') {
        // Pin #1 R3C3/R4C3: 골드/포인트 포스터 + 회전 다이아몬드 흑백 포토 + 좌측 세로 사이드 텍스트 + 코너 빗금!
        ctx.save();
        // 우상단 평행 빗금(////)
        ctx.strokeStyle = 'rgba(14,14,14,0.22)'; ctx.lineWidth = Math.max(1.5, 3 * sc);
        for (let di = 0; di < 6; di++) {
          const off = di * Math.round(24 * sc);
          ctx.beginPath();
          ctx.moveTo(W - Math.round(200 * sc) + off, 0);
          ctx.lineTo(W, Math.round(200 * sc) - off);
          ctx.stroke();
        }
        // 좌측 세로 회전 사이드 라벨 (90° CCW)
        ctx.save();
        ctx.translate(Math.round(34 * sc), H * 0.62);
        ctx.rotate(-Math.PI / 2);
        ctx.font = `700 ${Math.round(18 * sc)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = 'rgba(14,14,14,0.58)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`ARCHIVE EDITION · NO.${String(slideIdx + 1).padStart(2, '0')} · SWIPE →`, 0, 0);
        ctx.restore();
        ctx.restore();
        // 상단 굵은 압축 헤드라인
        curY = Math.round(142 * sc);
        const titleFs = Math.round((isCover ? 72 : 62) * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.16);
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        // 중앙 회전 다이아몬드 다크 백플레이트 + 고대비 흑백 포토 클립
        const cx = W / 2, cy = Math.round(H * 0.54);
        const dSize = Math.round(W * 0.36);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#111113';
        ctx.fillRect(-dSize + Math.round(14 * sc), -dSize + Math.round(14 * sc), dSize * 2, dSize * 2);
        ctx.beginPath();
        ctx.rect(-dSize, -dSize, dSize * 2, dSize * 2);
        ctx.clip();
        ctx.rotate(-Math.PI / 4);
        if (tpl.monoPhoto !== false) ctx.filter = 'grayscale(100%) contrast(1.18)';
        arCollageDrawCover(ctx, slide.bgImg, -dSize * 1.45, -dSize * 1.45, dSize * 2.9, dSize * 2.9, 0, null);
        ctx.restore();
        // 하단 본문
        curY = cy + Math.round(dSize * 1.24);
        const bodyFs = Math.round(30 * sc * fsMul);
        ctx.font = `600 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.88).slice(0, 2);
        const bLH = Math.round(bodyFs * 1.46);
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += bLH; });
        skipBottomHl = true;
      } else if (pLayout === 'photo_bold_stamp') {
        // Feed Bold Verde 스타일: 고대비 흑백 풀사진 위 좌측 볼드 타이포 + 네온 라임 하이라이트 서브바
        const titleFs = Math.round((isCover ? 86 : 74) * sc * fsMul * tMul);
        const bodyFs = Math.round(31 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW * 0.86).slice(0, 3);
        const tLH = Math.round(titleFs * 1.18);
        curY = Math.round(H * 0.44);
        const acCol = tpl.accent || '#c8ff2e';
        ctx.save();
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.68)'; ctx.shadowBlur = Math.round(26 * sc);
        tLines.forEach((ln, li) => {
          ctx.fillStyle = li === 0 ? acCol : '#ffffff';
          ctx.fillText(ln, padX, curY);
          curY += tLH;
        });
        // 네온 라임 하이라이트 강조 바
        if (hlStr || bodyStr) {
          curY += Math.round(18 * sc);
          const barTxt = (hlStr || bodyStr.split('\n')[0] || '').slice(0, 30);
          ctx.font = `800 ${Math.round(28 * sc)}px ${tpl.fontBody}`;
          const bw = Math.min(maxTextW, ctx.measureText(barTxt).width + Math.round(36 * sc));
          const bh = Math.round(48 * sc);
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = acCol;
          ctx.fillRect(padX, curY, bw, bh);
          ctx.fillStyle = arCnIsDarkHex(acCol) ? '#ffffff' : '#0c0d0c';
          ctx.textBaseline = 'middle';
          ctx.fillText(barTxt, padX + Math.round(18 * sc), curY + bh / 2 + 1);
          curY += bh + Math.round(20 * sc);
        }
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.86)'; ctx.textBaseline = 'top';
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.82).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
        ctx.restore();
        skipBottomHl = true;
      } else if (pLayout === 'photo_neon_card') {
        // 흑백 풀사진 위 떠있는 라임/네온 라운드 알림·체크리스트 카드!
        const acCol = tpl.accent || '#c8ff2e';
        const cardFg = arCnIsDarkHex(acCol) ? '#ffffff' : '#0e0f0c';
        const cardMuted = arCnIsDarkHex(acCol) ? 'rgba(255,255,255,0.82)' : 'rgba(14,15,12,0.78)';
        const cw = maxTextW, ch = Math.round(H * 0.36);
        const cx = padX, cy = Math.round(H * 0.42);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.42)'; ctx.shadowBlur = Math.round(36 * sc); ctx.shadowOffsetY = Math.round(14 * sc);
        ctx.fillStyle = acCol;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx, cy, cw, ch, Math.round(28 * sc));
        else ctx.rect(cx, cy, cw, ch);
        ctx.fill();
        ctx.restore();
        const inPad = Math.round(44 * sc);
        let iy = cy + Math.round(38 * sc);
        ctx.font = `700 ${Math.round(22 * sc)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = cardMuted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(`✦  NOTE ${String(slideIdx + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`, cx + inPad, iy);
        iy += Math.round(44 * sc);
        const titleFs = Math.round(52 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        ctx.fillStyle = cardFg;
        const tLines = arCnWrapLines(ctx, titleStr, cw - inPad * 2).slice(0, 2);
        const tLH = Math.round(titleFs * 1.24);
        tLines.forEach((ln) => { ctx.fillText(ln, cx + inPad, iy); iy += tLH; });
        iy += Math.round(18 * sc);
        const bodyFs = Math.round(30 * sc * fsMul);
        ctx.font = `600 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = cardMuted;
        const bLines = arCnWrapLines(ctx, bodyStr, cw - inPad * 2).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, cx + inPad, iy); iy += bLH; });
        skipBottomHl = true;
      } else if (pLayout === 'photo_neon_studio') {
        // NOVA / ASTRA 네온 스튜디오 포스터: 애시드 라임/옐로우 솔리드 + 블랙 그리드 라인 + 고대비 흑백 사진 박스!
        ctx.save();
        ctx.strokeStyle = 'rgba(14,15,12,0.22)'; ctx.lineWidth = Math.max(1, 2 * sc);
        ctx.strokeRect(Math.round(42 * sc), Math.round(42 * sc), W - Math.round(84 * sc), H - Math.round(84 * sc));
        ctx.restore();
        curY = Math.round(146 * sc);
        const titleFs = Math.round((isCover ? 74 : 64) * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.18);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(24 * sc);
        // 고대비 흑백 사진 박스 + 검정 프레임 테두리
        const photoH = Math.round(H * 0.37);
        ctx.save();
        if (tpl.monoPhoto !== false) ctx.filter = 'grayscale(100%) contrast(1.18)';
        arCollageDrawCover(ctx, slide.bgImg, padX, curY, maxTextW, photoH, Math.round(8 * sc), null);
        ctx.restore();
        ctx.strokeStyle = fg; ctx.lineWidth = Math.max(2, 4 * sc);
        ctx.strokeRect(padX, curY, maxTextW, photoH);
        arCnDrawDotMatrix(ctx, W - padX - Math.round(86 * sc), curY + photoH + Math.round(24 * sc), 5, 3, Math.round(16 * sc), fg, sc);
        curY += photoH + Math.round(32 * sc);
        const bodyFs = Math.round(31 * sc * fsMul);
        ctx.font = `600 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.78).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
      } else if (pLayout === 'photo_agency_brand') {
        // 에이전시 브랜드 그리드 (테라코타·에스프레소·크림 타이포 중심 + 우측 하단 콤팩트 화보 사진!)
        curY = Math.round(164 * sc);
        const titleFs = Math.round((isCover ? 82 : 70) * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 3);
        const tLH = Math.round(titleFs * 1.18);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(26 * sc);
        // 얇은 에디토리얼 가로선
        ctx.fillStyle = accent; ctx.globalAlpha = 0.45;
        ctx.fillRect(padX, curY, maxTextW, Math.max(1.5, 2.5 * sc));
        ctx.globalAlpha = 1;
        curY += Math.round(32 * sc);
        // 하단 2단: 좌측 본문 + 우측 세로 에디토리얼 사진
        const colGap = Math.round(28 * sc);
        const leftW = Math.round(maxTextW * 0.46);
        const rightW = maxTextW - leftW - colGap;
        const photoH = Math.max(Math.round(H * 0.28), H - curY - Math.round(134 * sc));
        const bodyFs = Math.round(30 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, leftW).slice(0, 6);
        const bLH = Math.round(bodyFs * 1.52);
        let by = curY;
        bLines.forEach((ln) => { ctx.fillText(ln, padX, by); by += bLH; });
        arCollageDrawCover(ctx, slide.bgImg, padX + leftW + colGap, curY, rightW, photoH, Math.round(14 * sc), null);
        skipBottomHl = true;
      } else if (pLayout === 'photo_viral_sidefade') {
        // 좌측 다크 페이드 위 좌측 정렬 볼드 타이포 + 하단 프로스트드 #키워드 칩 3개
        const titleFs = Math.round((isCover ? 74 : 64) * sc * fsMul * tMul);
        const bodyFs = Math.round(30 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, W * 0.68).slice(0, 3);
        const tLH = Math.round(titleFs * 1.24);
        curY = Math.round(H * 0.34);
        ctx.save();
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = Math.round(22 * sc);
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(22 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.84)';
        const bLines = arCnWrapLines(ctx, bodyStr, W * 0.62).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
        ctx.restore();
        // 하단 3개 반투명 키워드 칩 (하이라이트나 본문에서 자동 추출)
        const rawTags = String(hlStr || kickerTxt || '핵심정리 · 실전가이드 · 추천').split(/[·,|/#]+/).map((s) => s.trim()).filter(Boolean);
        const tags = rawTags.length >= 2 ? rawTags.slice(0, 3) : [rawTags[0] || '핵심포인트', '맞춤추천', '저장필수'];
        const chipY = H - Math.round(168 * sc);
        const chipH = Math.round(52 * sc);
        const chipGap = Math.round(14 * sc);
        ctx.font = `600 ${Math.round(24 * sc)}px ${tpl.fontBody}`;
        let cx = padX;
        tags.forEach((tg) => {
          const txt = tg.startsWith('#') ? tg : `#${tg}`;
          const cw = Math.min(Math.round(280 * sc), ctx.measureText(txt).width + Math.round(36 * sc));
          if (cx + cw > W - padX + 10) return;
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.strokeStyle = 'rgba(255,255,255,0.34)';
          ctx.lineWidth = Math.max(1, 1.5 * sc);
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(cx, chipY, cw, chipH, chipH / 2);
          else ctx.rect(cx, chipY, cw, chipH);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(txt, cx + cw / 2, chipY + chipH / 2 + 1);
          cx += cw + chipGap;
        });
        skipBottomHl = true;
      } else if (pLayout === 'photo_viral_darkfade') {
        // 흑백/스냅 사진 → 하단 순수 블랙 페이드 + 중앙/좌측 볼드 후킹 헤드라인
        const titleFs = Math.round((isCover ? 78 : 68) * sc * fsMul * tMul);
        const bodyFs = Math.round(31 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 3);
        const tLH = Math.round(titleFs * 1.24);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.88).slice(0, 2);
        const bLH = Math.round(bodyFs * 1.48);
        const blockH = tLines.length * tLH + Math.round(22 * sc) + bLines.length * bLH;
        curY = H - Math.round(145 * sc) - blockH;
        const alignCenter = Boolean(tpl.monoPhoto);
        const ax = alignCenter ? W / 2 : padX;
        ctx.save();
        // 제목 위 작은 보조 아이브로우 한 줄
        if (hlStr) {
          ctx.font = `600 ${Math.round(24 * sc)}px ${tpl.fontBody}`;
          ctx.fillStyle = tpl.accent && !arCnIsDarkHex(tpl.accent) ? tpl.accent : 'rgba(255,255,255,0.72)';
          ctx.textAlign = alignCenter ? 'center' : 'left'; ctx.textBaseline = 'bottom';
          ctx.fillText(hlStr.slice(0, 34), ax, curY - Math.round(16 * sc));
        }
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        ctx.fillStyle = '#ffffff'; ctx.textAlign = alignCenter ? 'center' : 'left'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = Math.round(24 * sc);
        tLines.forEach((ln) => { ctx.fillText(ln, ax, curY); curY += tLH; });
        curY += Math.round(18 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.76)';
        bLines.forEach((ln) => { ctx.fillText(ln, ax, curY); curY += bLH; });
        ctx.restore();
        skipBottomHl = true;
      } else if (pLayout === 'photo_viral_colorword') {
        // 토마토 코어 스타일: 좌측 중단 3줄 스택 타이포, 가운데(핵심) 줄만 강렬한 포인트 컬러!
        const titleFs = Math.round((isCover ? 82 : 70) * sc * fsMul * tMul);
        const bodyFs = Math.round(31 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW * 0.86).slice(0, 3);
        const tLH = Math.round(titleFs * 1.24);
        curY = Math.round(H * 0.44);
        ctx.save();
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.68)'; ctx.shadowBlur = Math.round(28 * sc); ctx.shadowOffsetY = Math.round(6 * sc);
        tLines.forEach((ln, li) => {
          const isAccentLine = (tLines.length >= 2 && li === 1);
          ctx.fillStyle = isAccentLine ? (tpl.accent || '#ef4444') : '#ffffff';
          ctx.fillText(ln, padX, curY);
          curY += tLH;
        });
        curY += Math.round(24 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.86).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
        ctx.restore();
      } else if (pLayout === 'photo_viral_duotag') {
        // 윔블던 잡학사전 스타일: 좌측 하단 라임/옐로우 1줄 바 + 매트 블랙 2줄 바 투톤 스택!
        const titleFs = Math.round((isCover ? 64 : 56) * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW - Math.round(48 * sc)).slice(0, 3);
        const padBX = Math.round(24 * sc), padBY = Math.round(14 * sc);
        const barH = Math.round(titleFs * 1.16) + padBY * 2;
        const barGap = Math.round(10 * sc);
        curY = H - Math.round(180 * sc) - tLines.length * (barH + barGap);
        ctx.save();
        tLines.forEach((ln, li) => {
          ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
          const bw = Math.min(maxTextW, ctx.measureText(ln).width + padBX * 2);
          const isTop = li === 0;
          ctx.fillStyle = isTop ? (tpl.accent || '#bef264') : '#0b0b0e';
          ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = Math.round(18 * sc); ctx.shadowOffsetY = Math.round(6 * sc);
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(padX, curY, bw, barH, Math.round(10 * sc));
          else ctx.rect(padX, curY, bw, barH);
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = isTop ? (arCnIsDarkHex(tpl.accent || '#bef264') ? '#ffffff' : '#111113') : '#ffffff';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(ln, padX + padBX, curY + barH / 2 + Math.round(2 * sc));
          curY += barH + barGap;
        });
        if (bodyStr) {
          curY += Math.round(10 * sc);
          ctx.font = `600 ${Math.round(28 * sc)}px ${tpl.fontBody}`;
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = Math.round(14 * sc);
          const bOne = arCnWrapLines(ctx, bodyStr, maxTextW)[0] || '';
          ctx.fillText(bOne, padX, curY);
        }
        ctx.restore();
        skipBottomHl = true;
      } else if (pLayout === 'photo_viral_viewfinder') {
        // 룩북 뷰파인더: 상단 볼드 스택 제목 + 중앙 4코너 L-브래킷 + 하단 포인트 강조
        const titleFs = Math.round((isCover ? 96 : 82) * sc * fsMul * tMul);
        curY = Math.round(140 * sc);
        ctx.save();
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.12);
        ctx.fillStyle = '#111113'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        // 4코너 뷰파인더 L-브래킷 (┌ ┐ └ ┘)
        const bx = Math.round(132 * sc), by = Math.round(H * 0.42);
        const bw = W - bx * 2, bh = Math.round(H * 0.36);
        const arm = Math.round(78 * sc);
        ctx.strokeStyle = '#111113'; ctx.lineWidth = Math.max(2, Math.round(7 * sc)); ctx.lineCap = 'square';
        const drawCorner = (x0, y0, dx, dy) => {
          ctx.beginPath(); ctx.moveTo(x0, y0 + dy * arm); ctx.lineTo(x0, y0); ctx.lineTo(x0 + dx * arm, y0); ctx.stroke();
        };
        drawCorner(bx, by, 1, 1); drawCorner(bx + bw, by, -1, 1);
        drawCorner(bx, by + bh, 1, -1); drawCorner(bx + bw, by + bh, -1, -1);
        // 하단 포인트 워드마크
        const accentWord = hlStr || kickerTxt || 'MINIMAL';
        ctx.font = `700 ${Math.round(74 * sc)}px 'Nanum Brush Script', ${tpl.fontTitle}`;
        ctx.fillStyle = tpl.accent || '#f97316';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = Math.round(14 * sc);
        ctx.fillText(accentWord.slice(0, 18), W / 2, by + bh - Math.round(24 * sc));
        ctx.restore();
        skipBottomHl = true;
      } else if (pLayout === 'photo_viral_glowcard') {
        // 로코 여주 스타일: 좌상단 볼드 블랙 훅 + 하단 깔끔한 화이트 라운드 노트박스
        const titleFs = Math.round((isCover ? 64 : 56) * sc * fsMul * tMul);
        curY = Math.round(156 * sc);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, Math.round(W * 0.38)).slice(0, 4);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = '#111113'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        // 하단 화이트 노트 카드 (얇은 테두리 + 깔끔한 본문 설명)
        const cardY = Math.round(H * 0.62);
        const cardH = Math.round(H * 0.24);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.10)'; ctx.shadowBlur = Math.round(24 * sc); ctx.shadowOffsetY = Math.round(8 * sc);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(17,17,19,0.22)';
        ctx.lineWidth = Math.max(1.5, 2.5 * sc);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padX, cardY, maxTextW, cardH, Math.round(20 * sc));
        else ctx.rect(padX, cardY, maxTextW, cardH);
        ctx.fill(); ctx.stroke();
        ctx.shadowColor = 'transparent';
        const bodyFs = Math.round(31 * sc * fsMul);
        ctx.font = `600 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = '#18181b'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        const bLines = arCnWrapLines(ctx, bodyStr || hlStr, maxTextW - Math.round(64 * sc)).slice(0, 4);
        const bLH = Math.round(bodyFs * 1.52);
        let by = cardY + Math.round((cardH - bLines.length * bLH) / 2);
        bLines.forEach((ln) => { ctx.fillText(ln, padX + Math.round(32 * sc), by); by += bLH; });
        ctx.restore();
        skipBottomHl = true;
      } else if (pLayout === 'photo_fade_bottom') {
        // 상단 사진이 하단 배경색으로 녹아든 영역 위에 깔끔한 에디토리얼 타이포 배치
        const titleFs = Math.round((isCover ? 74 : 64) * sc * fsMul * tMul);
        const bodyFs = Math.round(33 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.24);
        curY = Math.round(H * 0.54);
        ctx.fillStyle = accent;
        ctx.fillRect(padX, curY - Math.round(24 * sc), Math.round(68 * sc), Math.max(3, Math.round(6 * sc)));
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(20 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
      } else if (pLayout === 'photo_fade_top') {
        // 상단 배경색이 하단 사진으로 자연 페이드 — 상단에 강렬한 헤드라인+본문
        const titleFs = Math.round((isCover ? 76 : 66) * sc * fsMul * tMul);
        const bodyFs = Math.round(33 * sc * fsMul);
        curY = Math.round(162 * sc);
        ctx.fillStyle = accent;
        ctx.fillRect(padX, curY - Math.round(22 * sc), Math.round(68 * sc), Math.max(3, Math.round(6 * sc)));
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.24);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(20 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
        skipBottomHl = true;
      } else if (pLayout === 'photo_fade_radial') {
        // 사방 미스트 페이드 사진 아래에 우아한 중앙 정렬 타이포
        const titleFs = Math.round((isCover ? 66 : 58) * sc * fsMul * tMul);
        const bodyFs = Math.round(32 * sc * fsMul);
        curY = Math.round(H * 0.56);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.26);
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        curY += Math.round(18 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.9).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += bLH; });
      } else if (pLayout === 'photo_fade_duotone') {
        // 컬러 그라데이션 틴트 풀포토 위 선명한 초대형 화이트 타이포
        const titleFs = Math.round((isCover ? 92 : 78) * sc * fsMul * tMul);
        const bodyFs = Math.round(34 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 3);
        const tLH = Math.round(titleFs * 1.2);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        const blockH = tLines.length * tLH + Math.round(32 * sc) + bLines.length * bLH;
        curY = Math.max(Math.round(H * 0.44), H - Math.round(235 * sc) - blockH);
        ctx.save();
        ctx.fillStyle = accent;
        ctx.fillRect(padX, curY - Math.round(28 * sc), Math.round(80 * sc), Math.max(3, Math.round(7 * sc)));
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.48)'; ctx.shadowBlur = Math.round(26 * sc); ctx.shadowOffsetY = Math.round(6 * sc);
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(24 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
        ctx.restore();
      } else if (pLayout === 'photo_top') {
        const photoY = Math.round(146 * sc);
        const photoH = Math.round(H * 0.43);
        arCollageDrawCover(ctx, slide.bgImg, padX, photoY, maxTextW, photoH, Math.round(22 * sc), null);
        curY = photoY + photoH + Math.round(42 * sc);
        const titleFs = Math.round(54 * sc * fsMul * tMul);
        const bodyFs = Math.round(33 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(18 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
      } else if (pLayout === 'photo_polaroid') {
        // 감성 폴라로이드 액자 (약간 기울어짐 + 그림자 + 흰 하단 여백)
        const pw = Math.round(W * 0.68), ph = Math.round(H * 0.39);
        const cx = W / 2, cy = Math.round(162 * sc + ph / 2);
        const tilt = slideIdx % 2 === 0 ? -0.042 : 0.038;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);
        const b = Math.round(24 * sc), bot = Math.round(72 * sc);
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = Math.round(36 * sc);
        ctx.shadowOffsetY = Math.round(14 * sc);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-pw / 2 - b, -ph / 2 - b, pw + b * 2, ph + b + bot);
        ctx.shadowColor = 'transparent';
        arCollageDrawCover(ctx, slide.bgImg, -pw / 2, -ph / 2, pw, ph, 0, null);
        ctx.restore();

        curY = Math.round(162 * sc + ph + 92 * sc);
        const titleFs = Math.round(52 * sc * fsMul * tMul);
        const bodyFs = Math.round(32 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        curY += Math.round(16 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.92).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += bLH; });
      } else if (pLayout === 'photo_arch') {
        // 아치형 사진 창 (뷰티·라이프 에디토리얼)
        const aw = Math.round(W * 0.66), ah = Math.round(H * 0.44);
        const ax = Math.round((W - aw) / 2), ay = Math.round(148 * sc);
        const rad = aw / 2;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ax, ay + ah);
        ctx.lineTo(ax, ay + rad);
        ctx.arc(ax + rad, ay + rad, rad, Math.PI, 0);
        ctx.lineTo(ax + aw, ay + ah);
        ctx.closePath();
        ctx.clip();
        arCollageDrawCover(ctx, slide.bgImg, ax, ay, aw, ah, 0, null);
        ctx.restore();
        // 아치 외곽 얇은 포인트 선
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = Math.max(1.5, 3 * sc);
        ctx.beginPath();
        ctx.moveTo(ax - Math.round(10 * sc), ay + ah + Math.round(8 * sc));
        ctx.lineTo(ax - Math.round(10 * sc), ay + rad);
        ctx.arc(ax + rad, ay + rad, rad + Math.round(10 * sc), Math.PI, 0);
        ctx.lineTo(ax + aw + Math.round(10 * sc), ay + ah + Math.round(8 * sc));
        ctx.stroke();
        ctx.restore();

        curY = ay + ah + Math.round(44 * sc);
        const titleFs = Math.round(52 * sc * fsMul * tMul);
        const bodyFs = Math.round(32 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        curY += Math.round(16 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.92).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += bLH; });
      } else if (pLayout === 'photo_band') {
        // 나이키 볼드 포스터: 상단 강렬한 대형 제목 + 풀폭 가로 사진 밴드 + 하단 본문
        const titleFs = Math.round(62 * sc * fsMul * tMul);
        curY = Math.round(156 * sc);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.24);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(24 * sc);
        const bandH = Math.round(H * 0.35);
        arCollageDrawCover(ctx, slide.bgImg, 0, curY, W, bandH, 0, null);
        // 사진 밴드 상하 포인트 헤어라인
        ctx.fillStyle = accent;
        ctx.fillRect(0, curY, W, Math.max(2, Math.round(6 * sc)));
        curY += bandH + Math.round(36 * sc);
        const bodyFs = Math.round(34 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
      } else if (pLayout === 'photo_frame') {
        // 애플 클린 카드: 상단 제목 + 떠있는 소프트 섀도우 라운드 사진 + 하단 본문
        const titleFs = Math.round(54 * sc * fsMul * tMul);
        const bodyFs = Math.round(33 * sc * fsMul);
        curY = Math.round(158 * sc);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(26 * sc);
        const photoH = Math.round(H * 0.37);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.16)';
        ctx.shadowBlur = Math.round(34 * sc);
        ctx.shadowOffsetY = Math.round(14 * sc);
        ctx.fillStyle = tpl.card;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padX, curY, maxTextW, photoH, Math.round(24 * sc));
        else ctx.rect(padX, curY, maxTextW, photoH);
        ctx.fill();
        ctx.restore();
        arCollageDrawCover(ctx, slide.bgImg, padX, curY, maxTextW, photoH, Math.round(24 * sc), null);
        curY += photoH + Math.round(36 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
      } else if (pLayout === 'photo_bottom') {
        // 로컬 매거진 / 다크 비즈니스: 상단 헤드라인 + 본문 + 하단 41% 대형 사진 쇼케이스
        const titleFs = Math.round(56 * sc * fsMul * tMul);
        const bodyFs = Math.round(33 * sc * fsMul);
        curY = Math.round(156 * sc);
        ctx.fillStyle = accent;
        ctx.fillRect(padX, curY - Math.round(16 * sc), Math.round(64 * sc), Math.max(2, Math.round(6 * sc)));
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(18 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.46);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
        const photoTop = Math.max(curY + Math.round(28 * sc), Math.round(H * 0.47));
        const photoH = Math.max(Math.round(H * 0.28), H - photoTop - Math.round(130 * sc));
        arCollageDrawCover(ctx, slide.bgImg, padX, photoTop, maxTextW, photoH, Math.round(20 * sc), null);
        // 사진 하단 위 오버레이 팁 배지 (공간 겹침 방지)
        if (hlStr) {
          const hlFs = Math.round(26 * sc);
          ctx.font = `700 ${hlFs}px ${tpl.fontBody}`;
          const hw = Math.min(maxTextW - Math.round(36 * sc), ctx.measureText(hlStr).width + Math.round(40 * sc));
          const hh = Math.round(50 * sc);
          ctx.fillStyle = 'rgba(12,14,20,0.78)';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(padX + Math.round(18 * sc), photoTop + photoH - hh - Math.round(18 * sc), hw, hh, hh / 2);
          else ctx.rect(padX + Math.round(18 * sc), photoTop + photoH - hh - Math.round(18 * sc), hw, hh);
          ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(hlStr, padX + Math.round(38 * sc), photoTop + photoH - hh / 2 - Math.round(18 * sc));
        }
        skipBottomHl = true;
      } else if (pLayout === 'photo_split_left' || pLayout === 'photo_split_right') {
        // 핀터레스트 킨포크·시리얼 5:5 좌우 분할 에디토리얼
        const leftPhoto = pLayout === 'photo_split_left';
        const splitX = Math.round(W * 0.48);
        const topY = Math.round(138 * sc);
        const areaH = H - topY - Math.round(118 * sc);
        const px = leftPhoto ? padX : splitX + Math.round(24 * sc);
        const pw = leftPhoto ? (splitX - padX - Math.round(20 * sc)) : (W - padX - (splitX + Math.round(24 * sc)));
        const tx = leftPhoto ? (splitX + Math.round(26 * sc)) : padX;
        const twW = leftPhoto ? (W - padX - tx) : (splitX - padX - Math.round(24 * sc));
        arCollageDrawCover(ctx, slide.bgImg, px, topY, pw, areaH, Math.round(16 * sc), null);
        // 중앙 세로 헤어라인 구분선
        ctx.strokeStyle = tpl.dark ? 'rgba(255,255,255,0.16)' : 'rgba(20,18,16,0.16)';
        ctx.lineWidth = Math.max(1, 2 * sc);
        ctx.beginPath(); ctx.moveTo(splitX, topY); ctx.lineTo(splitX, topY + areaH); ctx.stroke();
        // 대형 배경 숫자 워터마크
        ctx.save();
        ctx.font = `${tW} ${Math.round(150 * sc)}px ${tpl.fontTitle}`;
        ctx.fillStyle = accent; ctx.globalAlpha = 0.14;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(String(slideIdx + 1).padStart(2, '0'), tx, topY - Math.round(8 * sc));
        ctx.restore();
        curY = topY + Math.round(158 * sc);
        ctx.fillStyle = accent;
        ctx.fillRect(tx, curY - Math.round(22 * sc), Math.round(52 * sc), Math.max(2, Math.round(5 * sc)));
        const titleFs = Math.round(48 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, twW).slice(0, 4);
        const tLH = Math.round(titleFs * 1.3);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, tx, curY); curY += tLH; });
        curY += Math.round(22 * sc);
        const bodyFs = Math.round(30 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, twW).slice(0, 5);
        const bLH = Math.round(bodyFs * 1.52);
        bLines.forEach((ln) => { ctx.fillText(ln, tx, curY); curY += bLH; });
        if (hlStr) {
          const hlY = topY + areaH - Math.round(74 * sc);
          if (hlY > curY + Math.round(16 * sc)) {
            ctx.fillStyle = tpl.card;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(tx, hlY, twW, Math.round(62 * sc), Math.round(12 * sc));
            else ctx.rect(tx, hlY, twW, Math.round(62 * sc));
            ctx.fill();
            ctx.fillStyle = accent;
            ctx.fillRect(tx, hlY, Math.round(7 * sc), Math.round(62 * sc));
            ctx.font = `700 ${Math.round(24 * sc)}px ${tpl.fontBody}`;
            ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            const oneLine = arCnWrapLines(ctx, hlStr, twW - Math.round(32 * sc))[0] || hlStr;
            ctx.fillText(oneLine, tx + Math.round(20 * sc), hlY + Math.round(31 * sc));
          }
        }
        skipBottomHl = true;
      } else if (pLayout === 'photo_newspaper') {
        // 핀터레스트 영자신문 브로드시트 (더블 룰 + 매스트헤드 + 사진 + 2단 캡션)
        const ruleCol = tpl.dark ? 'rgba(255,255,255,0.34)' : 'rgba(20,18,16,0.42)';
        const mastY = Math.round(134 * sc);
        ctx.strokeStyle = ruleCol;
        ctx.lineWidth = Math.max(2, 4 * sc);
        ctx.beginPath(); ctx.moveTo(padX, mastY); ctx.lineTo(W - padX, mastY); ctx.stroke();
        ctx.lineWidth = Math.max(1, 1.5 * sc);
        ctx.beginPath(); ctx.moveTo(padX, mastY + Math.round(8 * sc)); ctx.lineTo(W - padX, mastY + Math.round(8 * sc)); ctx.stroke();
        ctx.font = `700 ${Math.round(20 * sc)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`THE DAILY EDITION  ·  ISSUE NO.${String(slideIdx + 1).padStart(2, '0')}  ·  ARCHIVE`, W / 2, mastY + Math.round(28 * sc));
        ctx.beginPath(); ctx.moveTo(padX, mastY + Math.round(46 * sc)); ctx.lineTo(W - padX, mastY + Math.round(46 * sc)); ctx.stroke();
        curY = mastY + Math.round(68 * sc);
        const titleFs = Math.round(56 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.24);
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        curY += Math.round(22 * sc);
        const photoH = Math.round(H * 0.36);
        arCollageDrawCover(ctx, slide.bgImg, padX, curY, maxTextW, photoH, 0, null);
        ctx.strokeStyle = ruleCol; ctx.lineWidth = Math.max(1, 2 * sc);
        ctx.strokeRect(padX, curY, maxTextW, photoH);
        curY += photoH + Math.round(28 * sc);
        // 본문 위 얇은 구분선 + 본문
        ctx.beginPath(); ctx.moveTo(padX, curY - Math.round(10 * sc)); ctx.lineTo(W - padX, curY - Math.round(10 * sc)); ctx.stroke();
        const bodyFs = Math.round(31 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
      } else if (pLayout === 'photo_receipt') {
        // 핀터레스트 영수증·티켓 카드 (양쪽 펀치 노치 + 점선 절취선 + 모노 메타 + 바코드)
        const tx = Math.round(92 * sc), ty = Math.round(134 * sc);
        const twW = W - tx * 2, th = H - ty - Math.round(118 * sc);
        const notchY = ty + Math.round(th * 0.56);
        const nr = Math.round(24 * sc);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = Math.round(32 * sc); ctx.shadowOffsetY = Math.round(12 * sc);
        ctx.fillStyle = tpl.dark ? '#1f1f24' : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(tx, ty); ctx.lineTo(tx + twW, ty);
        ctx.lineTo(tx + twW, notchY - nr); ctx.arc(tx + twW, notchY, nr, -Math.PI / 2, Math.PI / 2, true);
        ctx.lineTo(tx + twW, ty + th); ctx.lineTo(tx, ty + th);
        ctx.lineTo(tx, notchY + nr); ctx.arc(tx, notchY, nr, Math.PI / 2, -Math.PI / 2, true);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        // 점선 절취선
        ctx.save();
        ctx.strokeStyle = tpl.dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.2)';
        ctx.setLineDash([Math.round(10 * sc), Math.round(8 * sc)]);
        ctx.lineWidth = Math.max(1, 2 * sc);
        ctx.beginPath(); ctx.moveTo(tx + nr + Math.round(12 * sc), notchY); ctx.lineTo(tx + twW - nr - Math.round(12 * sc), notchY); ctx.stroke();
        ctx.restore();
        const innerPad = Math.round(44 * sc);
        const innerW = twW - innerPad * 2;
        // 상단 사진
        const photoY = ty + Math.round(36 * sc);
        const photoH = notchY - photoY - Math.round(32 * sc);
        arCollageDrawCover(ctx, slide.bgImg, tx + innerPad, photoY, innerW, photoH, Math.round(14 * sc), null);
        // 하단 티켓 텍스트
        curY = notchY + Math.round(34 * sc);
        const titleFs = Math.round(46 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, innerW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.26);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, tx + innerPad, curY); curY += tLH; });
        curY += Math.round(14 * sc);
        const bodyFs = Math.round(29 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, innerW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.45);
        bLines.forEach((ln) => { ctx.fillText(ln, tx + innerPad, curY); curY += bLH; });
        // 하단 미니 바코드 장식
        const barY = ty + th - Math.round(56 * sc);
        const barH = Math.round(28 * sc);
        ctx.fillStyle = fg; ctx.globalAlpha = 0.28;
        let bx = tx + innerPad;
        const widths = [4, 2, 6, 3, 2, 5, 3, 2, 7, 2, 4, 3, 5, 2, 3, 6, 2, 4, 2, 5, 3, 4];
        for (let bi = 0; bi < widths.length && bx < tx + innerPad + innerW * 0.56; bi++) {
          const bw = Math.max(1, Math.round(widths[bi] * sc));
          ctx.fillRect(bx, barY, bw, barH);
          bx += bw + Math.max(2, Math.round((widths[(bi + 3) % widths.length] + 1) * sc));
        }
        ctx.globalAlpha = 0.65;
        ctx.font = `700 ${Math.round(20 * sc)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(`NO.${String(slideIdx + 1).padStart(3, '0')}`, tx + twW - innerPad, barY + barH / 2);
        ctx.globalAlpha = 1;
        skipBottomHl = true;
      } else if (pLayout === 'photo_scrapbook') {
        // 핀터레스트 마스킹테이프 스크랩북 (도트 페이퍼 + 기울어진 사진 + 반투명 마스킹테이프 2개)
        ctx.save();
        ctx.fillStyle = tpl.dark ? 'rgba(255,255,255,0.08)' : 'rgba(40,30,20,0.09)';
        const step = Math.round(42 * sc);
        for (let gx = Math.round(54 * sc); gx < W - Math.round(40 * sc); gx += step) {
          for (let gy = Math.round(130 * sc); gy < H - Math.round(100 * sc); gy += step) {
            ctx.beginPath(); ctx.arc(gx, gy, Math.max(1, 2 * sc), 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.restore();
        const pw = Math.round(W * 0.72), ph = Math.round(H * 0.39);
        const cx = W / 2, cy = Math.round(176 * sc + ph / 2);
        const tilt = slideIdx % 2 === 0 ? -0.032 : 0.028;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(tilt);
        const bd = Math.round(18 * sc);
        ctx.shadowColor = 'rgba(0,0,0,0.20)'; ctx.shadowBlur = Math.round(28 * sc); ctx.shadowOffsetY = Math.round(10 * sc);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-pw / 2 - bd, -ph / 2 - bd, pw + bd * 2, ph + bd * 2);
        ctx.shadowColor = 'transparent';
        arCollageDrawCover(ctx, slide.bgImg, -pw / 2, -ph / 2, pw, ph, 0, null);
        // 반투명 와시 마스킹테이프 좌상/우상 2개
        const drawTape = (tx0, ty0, rot) => {
          ctx.save();
          ctx.translate(tx0, ty0); ctx.rotate(rot);
          ctx.fillStyle = accent; ctx.globalAlpha = 0.55;
          ctx.fillRect(-Math.round(68 * sc), -Math.round(19 * sc), Math.round(136 * sc), Math.round(38 * sc));
          ctx.restore();
        };
        drawTape(-pw / 2 + Math.round(24 * sc), -ph / 2 - Math.round(6 * sc), -0.45);
        drawTape(pw / 2 - Math.round(24 * sc), -ph / 2 - Math.round(6 * sc), 0.42);
        ctx.restore();
        curY = Math.round(176 * sc + ph + 66 * sc);
        const titleFs = Math.round(52 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        curY += Math.round(16 * sc);
        const bodyFs = Math.round(32 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.92).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += bLH; });
      } else if (pLayout === 'photo_circle') {
        // 핀터레스트 원형 메달리온 / 바이닐 커버
        const rad = Math.round(Math.min(W * 0.34, H * 0.23));
        const cx = W / 2, cy = Math.round(158 * sc + rad);
        ctx.save();
        ctx.strokeStyle = accent; ctx.globalAlpha = 0.5; ctx.lineWidth = Math.max(1.5, 3 * sc);
        ctx.beginPath(); ctx.arc(cx, cy, rad + Math.round(14 * sc), 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        arCollageDrawCover(ctx, slide.bgImg, cx - rad, cy - rad, rad * 2, rad * 2, 0, null);
        ctx.restore();
        curY = cy + rad + Math.round(52 * sc);
        const titleFs = Math.round(54 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        curY += Math.round(18 * sc);
        const bodyFs = Math.round(32 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.9).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += bLH; });
      } else if (pLayout === 'photo_window') {
        // 핀터레스트 레트로 OS / 브라우저 창 프레임
        const wx = padX, wy = Math.round(146 * sc), ww = maxTextW;
        const barH = Math.round(54 * sc), photoH = Math.round(H * 0.39);
        const totalH = barH + photoH;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = Math.round(30 * sc); ctx.shadowOffsetY = Math.round(12 * sc);
        ctx.fillStyle = tpl.dark ? '#1e2230' : '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(wx, wy, ww, totalH, Math.round(18 * sc));
        else ctx.rect(wx, wy, ww, totalH);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(wx, wy, ww, totalH, Math.round(18 * sc));
        else ctx.rect(wx, wy, ww, totalH);
        ctx.clip();
        // 상단 3개 신호등 도트 + 주소창
        const dotColors = ['#ff5f57', '#febc2e', '#28c840'];
        dotColors.forEach((dc, di) => {
          ctx.fillStyle = dc;
          ctx.beginPath(); ctx.arc(wx + Math.round((28 + di * 24) * sc), wy + barH / 2, Math.round(7 * sc), 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = tpl.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(wx + Math.round(108 * sc), wy + Math.round(13 * sc), ww - Math.round(136 * sc), barH - Math.round(26 * sc), Math.round(10 * sc));
        else ctx.rect(wx + Math.round(108 * sc), wy + Math.round(13 * sc), ww - Math.round(136 * sc), barH - Math.round(26 * sc));
        ctx.fill();
        ctx.font = `600 ${Math.round(18 * sc)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`archive / card-${String(slideIdx + 1).padStart(2, '0')}`, wx + Math.round(108 * sc) + (ww - Math.round(136 * sc)) / 2, wy + barH / 2);
        arCollageDrawCover(ctx, slide.bgImg, wx, wy + barH, ww, photoH, 0, null);
        ctx.restore();
        ctx.strokeStyle = tpl.dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)';
        ctx.lineWidth = Math.max(1, 2 * sc);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(wx, wy, ww, totalH, Math.round(18 * sc));
        else ctx.rect(wx, wy, ww, totalH);
        ctx.stroke();
        curY = wy + totalH + Math.round(40 * sc);
        const titleFs = Math.round(52 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(16 * sc);
        const bodyFs = Math.round(32 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
      } else if (pLayout === 'photo_filmstrip') {
        // 핀터레스트 35mm 코닥 필름 스트립 (좌우 스프로킷 구멍 + 오렌지 날짜 스탬프)
        const fy = Math.round(146 * sc), fh = Math.round(H * 0.43);
        const stripW = Math.round(56 * sc);
        ctx.fillStyle = '#09090a';
        ctx.fillRect(0, fy - Math.round(14 * sc), W, fh + Math.round(28 * sc));
        // 좌우 스프로킷 구멍
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        const holeW = Math.round(24 * sc), holeH = Math.round(32 * sc), holeGap = Math.round(54 * sc);
        for (let hy = fy + Math.round(8 * sc); hy + holeH < fy + fh; hy += holeGap) {
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(Math.round(16 * sc), hy, holeW, holeH, Math.round(5 * sc));
            ctx.roundRect(W - Math.round(16 * sc) - holeW, hy, holeW, holeH, Math.round(5 * sc));
          } else {
            ctx.rect(Math.round(16 * sc), hy, holeW, holeH);
            ctx.rect(W - Math.round(16 * sc) - holeW, hy, holeW, holeH);
          }
          ctx.fill();
        }
        arCollageDrawCover(ctx, slide.bgImg, stripW, fy, W - stripW * 2, fh, Math.round(6 * sc), null);
        // 아날로그 필름 날짜 스탬프
        ctx.font = `700 ${Math.round(22 * sc)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#ff922b'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText(`'26 11 ${String(10 + slideIdx).padStart(2, '0')}  ·  ${String(slideIdx + 1).padStart(2, '0')}A`, W - stripW - Math.round(18 * sc), fy + fh - Math.round(14 * sc));
        curY = fy + fh + Math.round(50 * sc);
        const titleFs = Math.round(52 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(16 * sc);
        const bodyFs = Math.round(32 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
      } else if (pLayout === 'photo_poster') {
        // 스위스 포스터 그리드 (초대형 상단 타이포 + 굵은 가로선 + 하단 풀폭 포토 블록)
        curY = Math.round(148 * sc);
        const titleFs = Math.round(68 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.18);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(18 * sc);
        ctx.fillStyle = fg;
        ctx.fillRect(padX, curY, maxTextW, Math.max(2, Math.round(5 * sc)));
        curY += Math.round(18 * sc);
        const bodyFs = Math.round(31 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 2);
        const bLH = Math.round(bodyFs * 1.44);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
        const photoY = Math.max(curY + Math.round(24 * sc), Math.round(H * 0.45));
        const photoH = Math.max(Math.round(H * 0.30), H - photoY - Math.round(124 * sc));
        arCollageDrawCover(ctx, slide.bgImg, padX, photoY, maxTextW, photoH, Math.round(6 * sc), null);
        // 포스터 좌상단 컬러 블록
        ctx.fillStyle = accent;
        ctx.fillRect(padX, photoY, Math.round(16 * sc), Math.round(92 * sc));
        skipBottomHl = true;
      } else if (pLayout === 'photo_duo') {
        // 핀터레스트 2컷 무드보드 (좌우 2프레임 큐레이션 + 하단 타이포)
        const photoY = Math.round(148 * sc);
        const photoH = Math.round(H * 0.42);
        const gap = Math.round(18 * sc);
        const leftW = Math.round((maxTextW - gap) * 0.58);
        const rightW = maxTextW - gap - leftW;
        const nextSlide = (!overrideTpl && _arCnState.slides.length > 1) ? _arCnState.slides[(slideIdx + 1) % _arCnState.slides.length] : null;
        const img2 = (nextSlide && nextSlide.bgImg && nextSlide.bgImg.naturalWidth) ? nextSlide.bgImg : slide.bgImg;
        arCollageDrawCover(ctx, slide.bgImg, padX, photoY, leftW, photoH, Math.round(18 * sc), null);
        arCollageDrawCover(ctx, img2, padX + leftW + gap, photoY + Math.round(26 * sc), rightW, photoH - Math.round(26 * sc), Math.round(18 * sc), null);
        // 우측 상단 작은 무드 라벨
        ctx.font = `700 ${Math.round(18 * sc)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = accent; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillText(`FIG.${String(slideIdx + 1).padStart(2, '0')}`, padX + maxTextW, photoY);
        curY = photoY + photoH + Math.round(40 * sc);
        const titleFs = Math.round(52 * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.28);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(16 * sc);
        const bodyFs = Math.round(32 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
      } else if (pLayout === 'photo_big_center') {
        // 풀배경 + 화면 정중앙 초대형 118px 빅타이포 (보그·핀터레스트·인스타 바이럴 표지)
        const titleFs = Math.round((isCover ? 118 : 104) * sc * fsMul * tMul);
        const bodyFs = Math.round(35 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 3);
        const tLH = Math.round(titleFs * 1.18);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.88).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.5);
        const totalBlock = tLines.length * tLH + Math.round(44 * sc) + bLines.length * bLH;
        curY = Math.max(Math.round(210 * sc), Math.round((H - totalBlock) * 0.46));
        ctx.save();
        ctx.fillStyle = accent;
        ctx.fillRect(W / 2 - Math.round(46 * sc), curY - Math.round(32 * sc), Math.round(92 * sc), Math.max(3, Math.round(7 * sc)));
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.62)'; ctx.shadowBlur = Math.round(34 * sc); ctx.shadowOffsetY = Math.round(10 * sc);
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        ctx.shadowBlur = Math.round(18 * sc); ctx.shadowOffsetY = Math.round(4 * sc);
        curY += Math.round(28 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += bLH; });
        ctx.restore();
      } else if (pLayout === 'photo_big_bottom') {
        // 풀배경 상단 55% 사진 오픈 + 하단 112px 초대형 헤드라인
        const titleFs = Math.round((isCover ? 112 : 98) * sc * fsMul * tMul);
        const bodyFs = Math.round(33 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 3);
        const tLH = Math.round(titleFs * 1.16);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.46);
        const blockH = tLines.length * tLH + Math.round(28 * sc) + bLines.length * bLH;
        const bottomMargin = hlStr ? Math.round(220 * sc) : Math.round(140 * sc);
        curY = Math.max(Math.round(H * 0.44), H - bottomMargin - blockH);
        ctx.save();
        ctx.fillStyle = accent;
        ctx.fillRect(padX, curY - Math.round(26 * sc), Math.round(88 * sc), Math.max(3, Math.round(8 * sc)));
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.68)'; ctx.shadowBlur = Math.round(32 * sc); ctx.shadowOffsetY = Math.round(8 * sc);
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        curY += Math.round(22 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
        ctx.restore();
      } else if (pLayout === 'photo_big_top') {
        // 매거진 커버형: 상단 120px 초대형 타이틀 + 중앙 사진 + 하단 본문
        const titleFs = Math.round((isCover ? 120 : 104) * sc * fsMul * tMul);
        curY = Math.round(154 * sc);
        ctx.save();
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 2);
        const tLH = Math.round(titleFs * 1.15);
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.62)'; ctx.shadowBlur = Math.round(30 * sc); ctx.shadowOffsetY = Math.round(8 * sc);
        tLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += tLH; });
        ctx.fillStyle = accent;
        ctx.shadowColor = 'transparent';
        ctx.fillRect(W / 2 - Math.round(42 * sc), curY + Math.round(12 * sc), Math.round(84 * sc), Math.max(2, Math.round(5 * sc)));
        // 하단 본문 스트립
        const bodyFs = Math.round(34 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.9).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        let by = H - Math.round(136 * sc) - bLines.length * bLH;
        ctx.fillStyle = 'rgba(255,255,255,0.94)'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.72)'; ctx.shadowBlur = Math.round(18 * sc);
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, by); by += bLH; });
        ctx.restore();
        skipBottomHl = true;
      } else if (pLayout === 'photo_big_outline') {
        // 스트릿·테크 풀배경: 1줄 초대형 아웃라인(외곽선) + 2줄 솔리드 122px 빅타이포
        const titleFs = Math.round((isCover ? 122 : 106) * sc * fsMul * tMul);
        const bodyFs = Math.round(34 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 3);
        const tLH = Math.round(titleFs * 1.15);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.9).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        const blockH = tLines.length * tLH + Math.round(36 * sc) + bLines.length * bLH;
        curY = Math.max(Math.round(205 * sc), Math.round((H - blockH) * 0.48));
        ctx.save();
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.lineJoin = 'round';
        tLines.forEach((ln, li) => {
          if (li === 0 && tLines.length > 1) {
            ctx.strokeStyle = accent;
            ctx.lineWidth = Math.max(2, Math.round(5.5 * sc));
            ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = Math.round(22 * sc);
            ctx.strokeText(ln, W / 2, curY);
          } else {
            ctx.fillStyle = li === tLines.length - 1 && tLines.length > 1 ? '#ffffff' : fg;
            ctx.shadowColor = 'rgba(0,0,0,0.68)'; ctx.shadowBlur = Math.round(30 * sc); ctx.shadowOffsetY = Math.round(8 * sc);
            ctx.fillText(ln, W / 2, curY);
          }
          curY += tLH;
        });
        curY += Math.round(26 * sc);
        ctx.font = `600 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.shadowBlur = Math.round(16 * sc);
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += bLH; });
        ctx.restore();
      } else if (pLayout === 'photo_big_box') {
        // 인스타 바이럴 1위: 풀배경 위 줄별 하이라이트 형광펜/블랙라벨 빅박스 타이포
        const titleFs = Math.round((isCover ? 94 : 84) * sc * fsMul * tMul);
        const bodyFs = Math.round(33 * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW - Math.round(56 * sc)).slice(0, 3);
        const boxPadX = Math.round(28 * sc), boxPadY = Math.round(16 * sc);
        const rowH = Math.round(titleFs * 1.12) + boxPadY * 2;
        const rowGap = Math.round(14 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW * 0.9).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        const blockH = tLines.length * (rowH + rowGap) + Math.round(24 * sc) + bLines.length * bLH;
        curY = Math.max(Math.round(205 * sc), Math.round((H - blockH) * 0.50));
        ctx.save();
        const boxBg = tpl.accent || '#facc15';
        const boxFg = arCnIsDarkHex(boxBg) ? '#ffffff' : '#111113';
        tLines.forEach((ln, li) => {
          ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
          const lw = Math.min(maxTextW, ctx.measureText(ln).width + boxPadX * 2);
          const bx = Math.round((W - lw) / 2);
          ctx.fillStyle = (li === 0 && arCnIsDarkHex(boxBg)) ? '#ffffff' : boxBg;
          ctx.shadowColor = 'rgba(0,0,0,0.42)'; ctx.shadowBlur = Math.round(24 * sc); ctx.shadowOffsetY = Math.round(8 * sc);
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, curY, lw, rowH, Math.round(14 * sc));
          else ctx.rect(bx, curY, lw, rowH);
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = (li === 0 && arCnIsDarkHex(boxBg)) ? '#111113' : boxFg;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(ln, W / 2, curY + rowH / 2 + Math.round(2 * sc));
          curY += rowH + rowGap;
        });
        curY += Math.round(20 * sc);
        ctx.font = `600 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = 'rgba(255,255,255,0.94)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.72)'; ctx.shadowBlur = Math.round(18 * sc);
        bLines.forEach((ln) => { ctx.fillText(ln, W / 2, curY); curY += bLH; });
        ctx.restore();
      } else if (pLayout === 'photo_big_editorial') {
        // 풀배경 + 거대 반투명 세리프 넘버 + 108px 빅 세리프 + 하단 글래스 카드
        ctx.save();
        ctx.font = `${tW} ${Math.round(260 * sc)}px ${tpl.fontTitle}`;
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.14;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(String(slideIdx + 1).padStart(2, '0'), padX - Math.round(12 * sc), Math.round(138 * sc));
        ctx.restore();
        const titleFs = Math.round((isCover ? 108 : 96) * sc * fsMul * tMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 3);
        const tLH = Math.round(titleFs * 1.2);
        curY = Math.round(H * 0.42);
        ctx.save();
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.62)'; ctx.shadowBlur = Math.round(30 * sc); ctx.shadowOffsetY = Math.round(8 * sc);
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });
        ctx.restore();
        // 하단 반투명 글래스 본문 바
        const bodyFs = Math.round(31 * sc * fsMul);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW - Math.round(56 * sc)).slice(0, 3);
        const bLH = Math.round(bodyFs * 1.48);
        const gH = Math.round(bLines.length * bLH + 44 * sc);
        const gY = Math.min(H - Math.round(126 * sc) - gH, Math.max(curY + Math.round(26 * sc), H - Math.round(136 * sc) - gH));
        ctx.save();
        ctx.fillStyle = 'rgba(14,16,22,0.58)';
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = Math.max(1, 2 * sc);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padX, gY, maxTextW, gH, Math.round(18 * sc));
        else ctx.rect(padX, gY, maxTextW, gH);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        let by = gY + Math.round(22 * sc);
        bLines.forEach((ln) => { ctx.fillText(ln, padX + Math.round(28 * sc), by); by += bLH; });
        ctx.restore();
        skipBottomHl = true;
      } else {
        // 풀배경 사진형 (photo_full) 또는 순수 타이포형 (text_only)
        if (!isCover && !isCta && !isFullPhoto) {
          ctx.save();
          ctx.font = `${tW} ${Math.round(200 * sc)}px ${tpl.fontTitle}`;
          ctx.fillStyle = tpl.fg;
          ctx.globalAlpha = 0.055;
          ctx.textAlign = 'right'; ctx.textBaseline = 'top';
          ctx.fillText(String(slideIdx).padStart(2, '0'), W - padX + Math.round(8 * sc), Math.round(145 * sc));
          ctx.restore();
        }
        const titleFs = Math.round((isCover ? 78 : (isCta ? 66 : 64)) * sc * fsMul * tMul);
        const bodyFs = Math.round((isCover ? 36 : 38) * sc * fsMul);
        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        const tLines = arCnWrapLines(ctx, titleStr, maxTextW).slice(0, 4);
        const tLH = Math.round(titleFs * 1.3);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        const bLines = arCnWrapLines(ctx, bodyStr, maxTextW).slice(0, 6);
        const bLH = Math.round(bodyFs * 1.54);
        const blockH = tLines.length * tLH + Math.round(40 * sc) + bLines.length * bLH;
        curY = isFullPhoto
          ? Math.max(Math.round(220 * sc), Math.round(H * 0.50 - blockH * 0.22))
          : Math.max(Math.round(205 * sc), Math.round((H - blockH) * 0.38));

        ctx.fillStyle = accent;
        ctx.fillRect(padX, curY - Math.round(28 * sc), Math.round((isCover ? 82 : 60) * sc), Math.max(3, Math.round(7 * sc)));

        ctx.font = `${tW} ${titleFs}px ${tpl.fontTitle}`;
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        tLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += tLH; });

        curY += Math.round(30 * sc);
        ctx.font = `500 ${bodyFs}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        bLines.forEach((ln) => { ctx.fillText(ln, padX, curY); curY += bLH; });
      }

      // 4) 하단 강조 팁 박스 (트윅 스위치 반영 & 공간 안전 체크)
      if (hlStr && !skipBottomHl) {
        const compactHl = pLayout !== 'text_only' && pLayout !== 'photo_full';
        const hlFs = Math.round((compactHl ? 27 : 31) * sc * Math.min(1.06, fsMul));
        ctx.font = `700 ${hlFs}px ${tpl.fontBody}`;
        const hlLines = arCnWrapLines(ctx, hlStr, maxTextW - Math.round(60 * sc)).slice(0, compactHl ? 1 : 2);
        const hlLH = Math.round(hlFs * 1.38);
        const boxH = Math.round(hlLines.length * hlLH + (compactHl ? 30 : 42) * sc);
        const minFootGap = Math.round(126 * sc);
        const boxY = Math.min(H - minFootGap - boxH, Math.max(curY + Math.round(20 * sc), H - Math.round((compactHl ? 225 : 275) * sc)));
        if (boxY + boxH < H - Math.round(108 * sc)) {
          ctx.fillStyle = isFullPhoto ? 'rgba(255,255,255,0.18)' : tpl.card;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(padX, boxY, maxTextW, boxH, Math.round(16 * sc));
          else ctx.rect(padX, boxY, maxTextW, boxH);
          ctx.fill();
          ctx.fillStyle = accent;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(padX, boxY, Math.round(10 * sc), boxH, Math.round(5 * sc));
          else ctx.rect(padX, boxY, Math.round(10 * sc), boxH);
          ctx.fill();
          ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          let hy = boxY + Math.round((compactHl ? 16 : 21) * sc);
          hlLines.forEach((ln) => { ctx.fillText(ln, padX + Math.round(30 * sc), hy); hy += hlLH; });
        }
      }

      // 5) 하단 푸터: 계정명(@handle) + 캐러셀 페이지 도트
      const bottomOnPhoto = isFullPhoto || pLayout === 'photo_fade_top';
      const footY = H - Math.round(70 * sc);
      const handleTxt = !slide.chipStyle && tw.showHandle !== false ? String(slide.handle ?? _arCnState.handle ?? '').trim() : '';
      if (handleTxt) {
        ctx.font = `600 ${Math.round(24 * sc)}px ${tpl.fontBody}`;
        ctx.fillStyle = bottomOnPhoto ? 'rgba(255,255,255,0.9)' : muted;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(handleTxt.startsWith('@') ? handleTxt : `@${handleTxt}`, padX, footY);
      }
      if (tw.showDots !== false) {
        const dotR = Math.max(2, Math.round(5.5 * sc));
        const dotGap = Math.round(20 * sc);
        const startDotX = W - padX - (totalSlides - 1) * dotGap;
        for (let i = 0; i < totalSlides; i++) {
          const active = i === slideIdx;
          ctx.fillStyle = active ? accent : (bottomOnPhoto ? 'rgba(255,255,255,0.45)' : muted);
          ctx.globalAlpha = active ? 1 : 0.35;
          ctx.beginPath();
          ctx.arc(startDotX + i * dotGap, footY, active ? dotR * 1.35 : dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      if (!overrideTpl) {
        if (slide.captionStyle) window.arCutPanel.paint(ctx, {color: fg, ...slide.captionStyle, text: slide.title}, .42);
        if (slide.chipStyle && tw.showHandle !== false) {
          const name = String(slide.handle ?? _arCnState.handle ?? '').trim();
          window.arCutPanel.paint(ctx, {color: bottomOnPhoto ? '#ffffff' : fg, ...slide.chipStyle, text: name}, .88);
        }
      }
    }

    // 순수 JS 무압축 ZIP 생성기 (외부 CDN 없이 전체 5~10장 PNG를 한 번에 .zip 저장)
    function arCnBuildZipBlob(files) {
      const crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        crcTable[i] = c >>> 0;
      }
      const crc32 = (u8) => {
        let c = 0xffffffff;
        for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
      };
      const enc = new TextEncoder();
      const localParts = [];
      const centralParts = [];
      let offset = 0;
      files.forEach((f) => {
        const nameBytes = enc.encode(f.name);
        const data = f.data;
        const crc = crc32(data);
        const lh = new ArrayBuffer(30 + nameBytes.length);
        const lv = new DataView(lh);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true);
        lv.setUint16(6, 0x0800, true); // UTF-8
        lv.setUint16(8, 0, true);      // Store
        lv.setUint32(14, crc, true);
        lv.setUint32(18, data.length, true);
        lv.setUint32(22, data.length, true);
        lv.setUint16(26, nameBytes.length, true);
        new Uint8Array(lh, 30).set(nameBytes);
        localParts.push(new Uint8Array(lh), data);

        const ch = new ArrayBuffer(46 + nameBytes.length);
        const cv = new DataView(ch);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0x0800, true);
        cv.setUint16(10, 0, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, data.length, true);
        cv.setUint32(24, data.length, true);
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint32(42, offset, true);
        new Uint8Array(ch, 46).set(nameBytes);
        centralParts.push(new Uint8Array(ch));
        offset += 30 + nameBytes.length + data.length;
      });
      const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
      const eocd = new ArrayBuffer(22);
      const ev = new DataView(eocd);
      ev.setUint32(0, 0x06054b50, true);
      ev.setUint16(8, files.length, true);
      ev.setUint16(10, files.length, true);
      ev.setUint32(12, centralSize, true);
      ev.setUint32(16, offset, true);
      return new Blob([...localParts, ...centralParts, new Uint8Array(eocd)], { type: 'application/zip' });
    }

    function arCnLoadBrandPreset() {
      if (_arCnState.brandLoaded) return;
      _arCnState.brandLoaded = true;
      try {
        const raw = localStorage.getItem(AR_CN_BRAND_STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved.templateId) _arCnState.templateId = saved.templateId;
        if (saved.customColors && typeof saved.customColors === 'object') {
          _arCnState.customColors = { bg: saved.customColors.bg || '', accent: saved.customColors.accent || '', fg: saved.customColors.fg || '' };
        }
        if (typeof saved.bgGradient === 'string') _arCnState.bgGradient = saved.bgGradient;
        if (typeof saved.fontKey === 'string') _arCnState.fontKey = saved.fontKey;
        if (saved.fontScale) _arCnState.fontScale = saved.fontScale;
        if (saved.ratio) _arCnState.ratio = saved.ratio;
        if (typeof saved.handle === 'string') _arCnState.handle = saved.handle;
        if (typeof saved.designGuide === 'string') _arCnState.designGuide = saved.designGuide;
        if (saved.tweaks && typeof saved.tweaks === 'object') {
          _arCnState.tweaks = { ..._arCnState.tweaks, ...saved.tweaks };
        }
      } catch (_) {}
    }

    function arCnSaveBrandPreset() {
      try {
        localStorage.setItem(AR_CN_BRAND_STORAGE_KEY, JSON.stringify({
          templateId: _arCnState.templateId,
          customColors: _arCnState.customColors,
          bgGradient: _arCnState.bgGradient,
          fontKey: _arCnState.fontKey,
          fontScale: _arCnState.fontScale,
          ratio: _arCnState.ratio,
          handle: _arCnState.handle,
          designGuide: _arCnState.designGuide,
          tweaks: _arCnState.tweaks
        }));
        if (typeof arToast === 'function') arToast('내 브랜드 톤을 저장했어요! 다음부터 이 디자인 그대로 주제만 넣어 양산할 수 있어요.', true);
      } catch (_) {}
    }

    const AR_CN_TPL_THUMB_CACHE = {};
    const AR_CN_SHEET_TITLES = {
      ai: '✨ 장수 확인 후 AI로 카드뉴스 만들기',
      theme: '🎨 사진 포함 테마 90종 · 레퍼런스 색감',
      text: '✏️ 폰트 미리보기 · 40종 상업용 무료',
      photo: '📷 이 장 사진 교체 · 46종 사진 배치',
      export: '💾 고화질 PNG · PDF · PPTX · ZIP 저장'
    };

    const AR_CN_TAB_ORDER = ['ai', 'theme', 'text', 'photo', 'export'];
    const AR_CN_TAB_LABELS = { ai: '주제', theme: '테마', text: '장 편집', photo: '사진', export: '저장' };

    function arCnSyncSheetUI() {
      const curTab = _arCnState.sheetTab || 'ai';
      AR_CN_TAB_ORDER.forEach((k) => {
        const pane = document.getElementById(`arCnTab_${k}`);
        if (pane) pane.classList.toggle('hidden', curTab !== k);
      });
      document.querySelectorAll('#viewCardNews [data-cn-dock]').forEach((b) => {
        const on = b.dataset.cnDock === curTab;
        b.setAttribute('aria-selected', String(on));
        b.classList.toggle('active', on);
      });
      const ratioLbl = document.getElementById('arCnQuickRatioLabel');
      if (ratioLbl) ratioLbl.textContent = _arCnState.ratio || '4:5';
      // 모바일 하단 단계 이동 바 (#arCnMobileStepBar) 동기화
      const idx = Math.max(0, AR_CN_TAB_ORDER.indexOf(curTab));
      const prevBtn = document.getElementById('arCnStepPrev');
      const cntEl = document.getElementById('arCnStepCount');
      const nameEl = document.getElementById('arCnStepName');
      const nextBtn = document.getElementById('arCnStepNext');
      if (prevBtn) prevBtn.textContent = idx === 0 ? '← 릴스' : `← ${AR_CN_TAB_LABELS[AR_CN_TAB_ORDER[idx - 1]]}`;
      if (cntEl) cntEl.textContent = `${idx + 1} / ${AR_CN_TAB_ORDER.length}`;
      if (nameEl) nameEl.textContent = AR_CN_TAB_LABELS[curTab] || '주제';
      if (nextBtn) {
        nextBtn.textContent = idx < AR_CN_TAB_ORDER.length - 1
          ? `다음: ${AR_CN_TAB_LABELS[AR_CN_TAB_ORDER[idx + 1]]} →`
          : '📦 ZIP 저장';
      }
      const bar = document.getElementById('arCnMobileStepBar');
      if (bar && bar.offsetHeight && window.innerWidth < 1024) {
        document.body.style.setProperty('--ar-msb', `${bar.offsetHeight}px`);
      }
    }
    let arCnInspector = null;
    function arCnOpenInspector() {
      if (!_arCnState.slides.length || arCnInspector) return;
      arCnInspector = window.arCutPanel.open({
        host: document.getElementById('arCnInspectorHost'),
        close: () => { arCnInspector = null; },
        identity: () => _arCnState.slides[_arCnState.activeIdx],
        unit: '장', minCount: 3, maxCount: 10, motion: false, defaultY: {caption: .42, chip: .88},
        count: () => _arCnState.slides.length,
        index: () => _arCnState.activeIdx,
        select: arCnSelectSlide,
        read(i) {
          const slide = _arCnState.slides[i];
          return {
            duration: slide.duration ?? 2.6, minDuration: .2, maxDuration: 60,
            caption: { ...slide.captionStyle, text: slide.title },
            chip: { ...slide.chipStyle, text: slide.handle ?? _arCnState.handle }
          };
        },
        write(i, patch) {
          const slide = _arCnState.slides[i];
          if (patch.duration != null) slide.duration = patch.duration;
          for (const [key, field] of [['caption','title'], ['chip','handle']]) {
            if (!patch[key]) continue;
            const {text, ...style} = patch[key];
            if (field === 'title' || slide.handle != null || text !== _arCnState.handle) slide[field] = text;
            const active = Object.entries(style).filter(([k, v]) => v != null && v !== '' && !(k === 'hidden' && !v));
            if (active.length) slide[key + 'Style'] = Object.fromEntries(active);
            else delete slide[key + 'Style'];
          }
        },
        order(action, i) {
          const slides = _arCnState.slides;
          if (action === 'copy' && slides.length < 10) {
            slides.splice(i + 1, 0, {...slides[i]});
            _arCnState.activeIdx = i + 1;
          } else if (action === 'delete' && slides.length > 3) {
            slides.splice(i, 1);
            _arCnState.activeIdx = Math.min(i, slides.length - 1);
          } else if (action === 'left' || action === 'right') {
            const j = i + (action === 'left' ? -1 : 1);
            if (j < 0 || j >= slides.length) return;
            [slides[i], slides[j]] = [slides[j], slides[i]];
            _arCnState.activeIdx = j;
          }
        },
        changed: () => arCnRefreshUI(false),
        tools(tab, i) {
          if (tab === 'photo') return [{label:'사진 교체 · 배치', run: () => arCnOpenSheet('photo')}];
          if (tab === 'transition') return [{label:'릴스로 변환하고 이 장의 전환 편집', run: () => arCnApplyToStudioReels(i)}];
          return [
            {label:'본문 · 상단 배지 · 강조 문구', run: () => arCnOpenSheet('text', true)},
            {label:'카드 테마 · 색상 · 장식', run: () => arCnOpenSheet('theme')}
          ];
        }
      });
    }

    function arCnOpenSheet(tab, nativeTextTools = false, fromHistory = false) {
      const next = tab || 'ai';
      const prev = _arCnState.sheetTab || 'ai';
      _arCnState.sheetOpen = true;
      _arCnState.sheetTab = next;
      arCnSyncSheetUI();
      const wf = document.getElementById('arCnWorkflowColumn');
      if (wf && window.innerWidth < 1024) wf.scrollTop = 0;
      if (!fromHistory && next !== prev && typeof window.arNavPush === 'function') {
        window.arNavPush({ mode: 'cardnews', cnTab: next });
      }
      if (next === 'theme') { arCnRenderTemplateGallery(); arCnRenderGradientSwatches(); }
      if (next === 'text' && !nativeTextTools) arCnOpenInspector();
      else {
        arCnInspector?.close();
        if (next === 'text') arCnRenderFontChips();
      }
      if (next === 'photo') arCnLoadVaultStrip();
      if (next === 'export') arRunCardNewsCritic();
    }
    function arCnStepTab(delta) {
      const curTab = _arCnState.sheetTab || 'ai';
      const idx = Math.max(0, AR_CN_TAB_ORDER.indexOf(curTab));
      if (delta < 0 && idx === 0) { arCloseCardNewsModal(); return; }
      if (delta > 0 && idx >= AR_CN_TAB_ORDER.length - 1) { arCnDownloadAllZip(); return; }
      arCnOpenSheet(AR_CN_TAB_ORDER[Math.max(0, Math.min(AR_CN_TAB_ORDER.length - 1, idx + delta))]);
    }
    function arCnSetCat(cat) {
      _arCnState.catFilter = cat || 'all';
      document.querySelectorAll('#arCnCatRow [data-cn-cat]').forEach((b) => {
        b.classList.toggle('active', b.dataset.cnCat === _arCnState.catFilter);
      });
      arCnRenderTemplateGallery();
    }

    const AR_CN_FONT_PREVIEW_SZ = { pen: 19, brush: 19, dokdo: 20, kirang: 17, gaegu: 17, yeonsung: 16, bwpicture: 17, stylish: 16, moirai: 16 };
    function arCnRenderFontChips() {
      const row = document.getElementById('arCnFontChipRow');
      if (!row) return;
      const eff = arCnEffectiveTheme();
      const activeKey = _arCnState.fontKey || eff.fontKey || 'pretM';
      const curSlide = _arCnState.slides[_arCnState.activeIdx] || {};
      const sampleTxt = String(curSlide.title || '').replace(/\s+/g, ' ').trim();
      const items = AR_CN_FONTS.map((f) => {
        const sp = arCnFontSpec(f.key);
        arCnEnsureFont(f.key, () => {
          const cv = document.getElementById('arCnPreviewCanvas');
          if (cv && _arCnState.slides[_arCnState.activeIdx]) arCnRenderSlide(cv, _arCnState.slides[_arCnState.activeIdx], _arCnState.activeIdx, _arCnState.slides.length);
        });
        return {
          id: f.key,
          label: f.label,
          css: String(sp.family || "'Pretendard Variable', sans-serif").replace(/"/g, "'"),
          weight: sp.weight || 700,
          sz: AR_CN_FONT_PREVIEW_SZ[f.key] || 0
        };
      });
      if (typeof arRenderUnifiedFontPickerHtml === 'function') {
        row.innerHTML = arRenderUnifiedFontPickerHtml({
          pickerId: 'cardnews-title',
          items,
          activeId: activeKey,
          sampleText: sampleTxt,
          fallbackText: '가나다 카드뉴스',
          title: `글꼴 미리보기 (${items.length}종)`,
          freeBadge: true,
          resetExpr: "arCnSetFontKey('')",
          resetLabel: '템플릿 기본 ↺',
          onSelectExpr: (fid) => `arCnSetFontKey('${fid}')`
        });
      }
    }

    function arCnRenderTemplateGallery() {
      const tplGrid = document.getElementById('arCnTplGrid');
      if (!tplGrid) return;
      if (!tplGrid.dataset.built) {
        tplGrid.dataset.built = '1';
        tplGrid.innerHTML = AR_CN_TEMPLATES.map((t) => `
          <button type="button" data-cn-tpl="${t.id}" data-cn-tpl-cat="${t.cat || ''}" onclick="arCnSetTemplate('${t.id}')" class="ar-cn-tpl-btn">
            <canvas data-cn-thumb="${t.id}" width="160" height="200" class="ar-cn-tpl-thumb"></canvas>
            <span class="truncate px-0.5">${t.name}</span>
          </button>
        `).join('');
      }
      const wantCat = _arCnState.catFilter || 'all';
      tplGrid.querySelectorAll('[data-cn-tpl]').forEach((b) => {
        const show = wantCat === 'all' || b.dataset.cnTplCat === wantCat;
        b.classList.toggle('hidden', !show);
        b.classList.toggle('active', b.dataset.cnTpl === _arCnState.templateId);
      });
      AR_CN_TEMPLATES.forEach((t) => {
        if (wantCat !== 'all' && t.cat !== wantCat) return;
        const cv = tplGrid.querySelector(`canvas[data-cn-thumb="${t.id}"]`);
        if (!cv) return;
        const drawThumb = (imgObj) => {
          const sampleSlide = {
            role: 'cover',
            kicker: 'GUIDE 01',
            title: t.sampleTitle || t.name,
            body: '사진과 글이 자연스럽게\n어우러지는 카드 템플릿',
            highlight: '밀어서 확인하기 →',
            bgImg: imgObj || null,
            photoLayout: t.coverLayout || 'photo_top'
          };
          arCnRenderSlide(cv, sampleSlide, 0, 7, t);
          if (imgObj) AR_CN_TPL_THUMB_CACHE[t.id] = true;
        };
        arCnEnsureFont(t.fontKey, () => {
          AR_CN_TPL_THUMB_CACHE[t.id] = false;
          const imgReady = arCnLoadImgUrl(t.samplePhoto, null);
          drawThumb(imgReady);
        });
        if (AR_CN_TPL_THUMB_CACHE[t.id]) return;
        const cachedImg = arCnLoadImgUrl(t.samplePhoto, (loaded) => { drawThumb(loaded); });
        drawThumb(cachedImg);
      });
    }

    function arCnRefreshUI(skipInputSync = false) {
      if (!_arCnState.slides.length) {
        _arCnState.slides = arCnDefaultSlides(_arCnState.targetCount);
        arCnPopulateSamplePhotos(true);
      }
      const total = _arCnState.slides.length;
      _arCnState.activeIdx = ((_arCnState.activeIdx % total) + total) % total;
      const idx = _arCnState.activeIdx;
      const cur = _arCnState.slides[idx];
      const eff = arCnEffectiveTheme();

      // 캔버스 비율 동기화
      const frame = document.getElementById('arCnCanvasFrame');
      const cv = document.getElementById('arCnPreviewCanvas');
      if (frame && cv) {
        const isSquare = _arCnState.ratio === '1:1';
        frame.dataset.ratio = isSquare ? '1:1' : '4:5';
        frame.style.aspectRatio = isSquare ? '1 / 1' : '4 / 5';
        const wantH = isSquare ? 540 : 675;
        if (cv.width !== 540 || cv.height !== wantH) { cv.width = 540; cv.height = wantH; }
        arCnRenderSlide(cv, cur, idx, total);
      }

      const meta = document.getElementById('arCnSlideMeta');
      if (meta) meta.textContent = `${idx + 1} / ${total}장`;
      const editLbl = document.getElementById('arCnEditCardLabel');
      if (editLbl) editLbl.textContent = `${idx + 1}번 카드 글자 수정`;
      const zipBtn = document.getElementById('arCnDownloadZipBtn');
      if (zipBtn) zipBtn.textContent = `📦 전체 ${total}장 한 번에 저장 (.zip)`;
      const genBtn = document.getElementById('arCnGenBtn');
      if (genBtn && !genBtn.disabled) genBtn.textContent = `✨ ${_arCnState.targetCount}장 만들기`;
      const bp = document.getElementById('arCnBlueprintNote');
      if (bp) bp.innerHTML = `📋 구성 확인: <strong>표지 1장 + 핵심 본문 ${_arCnState.targetCount - 2}장 + 마무리 1장 = 총 ${_arCnState.targetCount}장</strong> (위 <strong>장수</strong> 버튼에서 5~10장을 먼저 고르세요)`;

      const hasPhoto = Boolean(cur && cur.bgImg);
      const clrPhoto = document.getElementById('arCnClearBgPhotoBtn');
      if (clrPhoto) clrPhoto.classList.toggle('hidden', !hasPhoto);
      const pLayoutRow = document.getElementById('arCnPhotoLayoutRow');
      if (pLayoutRow) {
        const curPL = !hasPhoto ? 'text_only' : ((cur && cur.photoLayout) || (idx === 0 ? eff.coverLayout : eff.bodyLayout) || 'photo_top');
        pLayoutRow.querySelectorAll('[data-cn-playout]').forEach((b) => b.classList.toggle('active', b.dataset.cnPlayout === curPL));
      }

      // 장 번호 버튼 (1, 2, 3... 깔끔한 숫자 표기)
      const pills = document.getElementById('arCnSlidePills');
      if (pills) {
        pills.innerHTML = _arCnState.slides.map((s, i) => {
          const on = i === idx;
          return `<button type="button" onclick="arCnSelectSlide(${i})" aria-label="${i + 1}번 카드" class="w-7 h-7 rounded-[7px] text-[12px] font-mono font-bold border shrink-0 cursor-pointer flex items-center justify-center transition ${on ? 'bg-[#ededed] text-[#141415] border-[#ededed]' : 'bg-[#1c1c21] text-[#a1a1aa] border-white/10 hover:text-white'}">${i + 1}</button>`;
        }).join('');
      }

      // 장수 / 비율 / 글자크기 / 트윅 / 컬러 / 폰트칩 / 테마 갤러리 동기화
      document.querySelectorAll('#arCnCountRow [data-cn-cnt]').forEach((b) => b.classList.toggle('active', Number(b.dataset.cnCnt) === _arCnState.targetCount));
      document.querySelectorAll('#viewCardNews [data-cn-ratio]').forEach((b) => b.classList.toggle('active', b.dataset.cnRatio === _arCnState.ratio));
      document.querySelectorAll('#viewCardNews [data-cn-fsize]').forEach((b) => b.classList.toggle('active', b.dataset.cnFsize === _arCnState.fontScale));
      document.querySelectorAll('#viewCardNews [data-cn-tweak]').forEach((b) => {
        const k = b.dataset.cnTweak;
        b.classList.toggle('active', _arCnState.tweaks[k] !== false);
      });
      const cBg = document.getElementById('arCnColorBg');
      const cAc = document.getElementById('arCnColorAccent');
      const cFg = document.getElementById('arCnColorFg');
      if (cBg && /^#[0-9a-f]{6}$/i.test(eff.bg)) cBg.value = eff.bg;
      if (cAc && /^#[0-9a-f]{6}$/i.test(eff.accent)) cAc.value = eff.accent;
      if (cFg && /^#[0-9a-f]{6}$/i.test(eff.fg)) cFg.value = eff.fg;

      arCnSyncSheetUI();
      if (_arCnState.sheetTab === 'theme') {
        arCnRenderTemplateGallery();
        arCnRenderGradientSwatches();
      }
      if (arCnInspector) arCnInspector.sync();
      else if (_arCnState.sheetTab === 'text') arCnRenderFontChips();

      if (!skipInputSync && cur) {
        const kEl = document.getElementById('arCnKicker');
        const tEl = document.getElementById('arCnTitle');
        const bEl = document.getElementById('arCnBody');
        const hEl = document.getElementById('arCnHighlight');
        if (kEl) kEl.value = cur.kicker || '';
        if (tEl) tEl.value = cur.title || '';
        if (bEl) bEl.value = cur.body || '';
        if (hEl) hEl.value = cur.highlight || '';
      }
    }

    function arOpenCardNewsModal(fromHistory = false) {
      const view = document.getElementById('viewCardNews');
      if (!view) return;
      if (typeof arPauseForStudioEdit === 'function') arPauseForStudioEdit();
      arCnLoadBrandPreset();
      if (!_arCnState.handle) {
        const d = typeof getSelectedDealer === 'function' ? getSelectedDealer() : null;
        if (d && (d.branch || d.name)) _arCnState.handle = d.branch || d.name;
      }
      const hIn = document.getElementById('arCnHandleInput');
      if (hIn && _arCnState.handle) hIn.value = _arCnState.handle;
      const gIn = document.getElementById('arCnGuideInput');
      if (gIn && _arCnState.designGuide) gIn.value = _arCnState.designGuide;
      if (!_arCnState.slides.length) {
        _arCnState.slides = arCnDefaultSlides(_arCnState.targetCount);
      }
      // 오토릴스 스튜디오 본 화면·바텀시트를 카드뉴스 모드로 전환
      ['viewPreview', 'viewAdmin', 'viewTech', 'mobileLiveDock'].forEach((id) => {
        document.getElementById(id)?.classList.add('hidden');
      });
      document.body.classList.add('ar-cn-mode');
      document.body.classList.remove('ar-sheet-min', 'ar-sheet-full');
      _arCnState.sheetOpen = true;
      if (!fromHistory) _arCnState.sheetTab = 'ai';
      arCnPopulateSamplePhotos(false);
      view.classList.remove('hidden');
      arCnRefreshUI();
      document.getElementById('arCnWorkflowColumn').scrollTop = 0;
      if (!fromHistory && typeof window.arNavPush === 'function') {
        window.arNavPush({ mode: 'cardnews', cnTab: _arCnState.sheetTab });
      }
      if (window.innerWidth >= 1024) {
        try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
      }
    }
    function arCloseCardNewsModal(fromHistory = false) {
      arCnInspector?.close();
      try { document.querySelectorAll('dialog.arcp[open]').forEach((d) => d.close()); } catch (_) {}
      document.body.classList.remove('ar-cn-mode', 'ar-sheet-min', 'ar-sheet-full');
      document.getElementById('viewCardNews')?.classList.add('hidden');
      document.getElementById('viewPreview')?.classList.remove('hidden');
      document.getElementById('mobileLiveDock')?.classList.remove('hidden');
      if (!fromHistory) {
        if (typeof arShowStudioServices === 'function') arShowStudioServices(false);
        if (typeof window.arNavPush === 'function') window.arNavPush({ mode: 'reels' });
      }
      if (typeof arSetupSheetMode === 'function') arSetupSheetMode();
      if (window.innerWidth >= 1024) {
        try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
      }
    }
    function arCnSetTargetCount(n) {
      const next = Math.max(5, Math.min(10, Number(n) || 7));
      _arCnState.targetCount = next;
      // 아직 AI 생성 전이면 상단 미리보기 장수도 즉시 맞춰 확인시켜 줌
      if (!_arCnState.hasAiGenerated) {
        const curTopic = String(document.getElementById('arCnTopicInput')?.value || '').trim();
        _arCnState.slides = arCnDefaultSlides(next, curTopic || '알아두면 바로 쓰는 핵심 가이드');
        arCnPopulateSamplePhotos(true);
      }
      arCnRefreshUI(false);
    }
    function arCnRenderGradientSwatches() {
      const row = document.getElementById('arCnGradSwatchRow');
      if (!row) return;
      const curGrad = arCnEffectiveTheme().gradientId || '';
      const solidOn = !curGrad;
      row.innerHTML = `<button type="button" onclick="arCnSetGradient('none')" title="단색 배경" class="h-6 px-2 rounded-full text-[10.5px] font-semibold border shrink-0 cursor-pointer ${solidOn ? 'bg-[#ededed] text-[#141415] border-[#ededed]' : 'bg-[#1c1c21] text-[#a1a1aa] border-white/15'}">단색</button>` +
        AR_CN_GRADIENTS.map((g) => {
          const on = curGrad === g.id;
          const cssBg = `linear-gradient(135deg, ${g.stops.join(', ')})`;
          return `<button type="button" onclick="arCnSetGradient('${g.id}')" title="${g.name}" style="background:${cssBg};" class="w-6 h-6 rounded-full shrink-0 cursor-pointer transition ${on ? 'ring-2 ring-white ring-offset-2 ring-offset-[#141417] scale-105' : 'border border-white/25 hover:scale-105'}"></button>`;
        }).join('');
    }

    function arCnSetTemplate(id) {
      _arCnState.templateId = id;
      _arCnState.customColors = { bg: '', accent: '', fg: '' };
      _arCnState.bgGradient = '';
      _arCnState.fontKey = '';
      _arCnState.slides.forEach((s) => { s.userLayoutLocked = false; });
      const tpl = arCnGetTemplate(id);
      arCnEnsureFont(tpl.fontKey, () => arCnRefreshUI(true));
      arCnPopulateSamplePhotos(true);
      arCnRefreshUI(true);
    }
    function arCnSetGradient(gradId) {
      _arCnState.bgGradient = String(gradId || 'none');
      if (_arCnState.bgGradient !== 'none') {
        _arCnState.customColors = { bg: '', accent: '', fg: '' };
      }
      arCnRefreshUI(true);
      const g = arCnGetGradient(_arCnState.bgGradient);
      if (g && typeof arToast === 'function') arToast(`🌈 그라데이션 배경: ${g.name}`, true);
    }
    function arCnShuffleDesign(mode = 'all') {
      const m = String(mode || 'all');
      if (m === 'color') {
        if (Math.random() < 0.45) {
          const curG = arCnEffectiveTheme().gradientId || '';
          const gPool = AR_CN_GRADIENTS.filter((g) => g.id !== curG);
          const gPick = gPool[Math.floor(Math.random() * gPool.length)] || AR_CN_GRADIENTS[0];
          arCnSetGradient(gPick.id);
          return;
        }
        const curBg = (_arCnState.customColors.bg || arCnEffectiveTheme().bg || '').toLowerCase();
        const pool = AR_CN_SHUFFLE_PALETTES.filter((p) => p.bg.toLowerCase() !== curBg);
        const pick = pool[Math.floor(Math.random() * pool.length)] || AR_CN_SHUFFLE_PALETTES[0];
        _arCnState.bgGradient = 'none';
        _arCnState.customColors = { bg: pick.bg, accent: pick.accent, fg: pick.fg };
        arCnRefreshUI(true);
        if (typeof arToast === 'function') arToast(`🎨 색감 섞기: ${pick.name}`, true);
        return;
      }
      if (m === 'font') {
        const curKey = _arCnState.fontKey || arCnEffectiveTheme().fontKey || '';
        const pool = AR_CN_FONTS.filter((f) => f.key !== curKey);
        const pick = pool[Math.floor(Math.random() * pool.length)] || AR_CN_FONTS[0];
        arCnSetFontKey(pick.key);
        if (typeof arToast === 'function') arToast(`🔤 폰트 섞기: ${pick.label}`, true);
        return;
      }
      if (m === 'layout') {
        const cur = _arCnState.slides[_arCnState.activeIdx];
        const curL = (cur && cur.photoLayout) || '';
        const pool = AR_CN_PHOTO_LAYOUT_KEYS.filter((k) => k !== curL);
        const pick = pool[Math.floor(Math.random() * pool.length)] || 'photo_top';
        _arCnState.slides.forEach((s) => { s.photoLayout = pick; s.userLayoutLocked = true; });
        arCnRefreshUI(true);
        if (typeof arToast === 'function') arToast('📐 카드 사진 구도를 새로 섞었어요!', true);
        return;
      }
      // 기본 전체 테마 섞기: 44종 핀터레스트·매거진·감성 테마 + 색감·폰트 조합 랜덤 믹스
      const cat = _arCnState.catFilter || 'all';
      let pool = (cat !== 'all') ? AR_CN_TEMPLATES.filter((t) => t.cat === cat && t.id !== _arCnState.templateId) : [];
      if (pool.length < 2) pool = AR_CN_TEMPLATES.filter((t) => t.id !== _arCnState.templateId);
      const pick = pool[Math.floor(Math.random() * pool.length)] || AR_CN_TEMPLATES[0];
      _arCnState.templateId = pick.id;
      _arCnState.slides.forEach((s) => { s.userLayoutLocked = false; });
      // 45% 확률로 색감·폰트도 핀터레스트 조합으로 추가 믹스
      if (Math.random() < 0.45) {
        if (Math.random() < 0.5) {
          const gPick = AR_CN_GRADIENTS[Math.floor(Math.random() * AR_CN_GRADIENTS.length)];
          _arCnState.bgGradient = gPick.id;
          _arCnState.customColors = { bg: '', accent: '', fg: '' };
          const fPick = AR_CN_FONTS[Math.floor(Math.random() * AR_CN_FONTS.length)];
          _arCnState.fontKey = fPick.key;
          arCnEnsureFont(fPick.key, () => arCnRefreshUI(true));
          arCnPopulateSamplePhotos(true);
          arCnRefreshUI(true);
          if (typeof arToast === 'function') arToast(`🔀 믹스: ${pick.name} × ${gPick.name}`, true);
        } else {
          const pal = AR_CN_SHUFFLE_PALETTES[Math.floor(Math.random() * AR_CN_SHUFFLE_PALETTES.length)];
          _arCnState.bgGradient = 'none';
          _arCnState.customColors = { bg: pal.bg, accent: pal.accent, fg: pal.fg };
          const fPick = AR_CN_FONTS[Math.floor(Math.random() * AR_CN_FONTS.length)];
          _arCnState.fontKey = fPick.key;
          arCnEnsureFont(fPick.key, () => arCnRefreshUI(true));
          arCnPopulateSamplePhotos(true);
          arCnRefreshUI(true);
          if (typeof arToast === 'function') arToast(`🔀 믹스: ${pick.name} × ${pal.name}`, true);
        }
      } else {
        _arCnState.bgGradient = '';
        _arCnState.customColors = { bg: '', accent: '', fg: '' };
        _arCnState.fontKey = '';
        arCnEnsureFont(pick.fontKey, () => arCnRefreshUI(true));
        arCnPopulateSamplePhotos(true);
        arCnRefreshUI(true);
        if (typeof arToast === 'function') arToast(`🔀 테마 섞기: ${pick.name}`, true);
      }
    }
    function arCnSetCustomColor(key, hex) {
      if (!['bg', 'accent', 'fg'].includes(key)) return;
      if (key === 'bg') _arCnState.bgGradient = 'none';
      _arCnState.customColors[key] = hex;
      if (key === 'bg' && !_arCnState.customColors.fg) {
        _arCnState.customColors.fg = arCnIsDarkHex(hex) ? '#f8fafc' : '#18181b';
      }
      arCnRefreshUI(true);
    }
    function arCnResetCustomColors() {
      _arCnState.bgGradient = '';
      _arCnState.customColors = { bg: '', accent: '', fg: '' };
      arCnRefreshUI(true);
    }
    function arCnSetFontKey(key) {
      _arCnState.fontKey = String(key || '');
      if (key) arCnEnsureFont(key, () => arCnRefreshUI(true));
      arCnRefreshUI(true);
    }
    function arCnSetFontFamily(fam) {
      arCnSetFontKey(fam);
    }
    function arCnToggleTweak(key) {
      if (!(key in _arCnState.tweaks)) return;
      _arCnState.tweaks[key] = !_arCnState.tweaks[key];
      arCnRefreshUI(true);
    }
    function arCnSetRatio(r) {
      _arCnState.ratio = r === '1:1' ? '1:1' : '4:5';
      arCnRefreshUI(true);
    }
    function arCnSetFontScale(sz) {
      _arCnState.fontScale = ['sm', 'md', 'lg'].includes(sz) ? sz : 'md';
      arCnRefreshUI(true);
    }
    function arCnUpdateHandle(val) {
      _arCnState.handle = String(val || '').slice(0, 32);
      arCnRefreshUI(true);
    }
    function arCnUpdateDesignGuide(val) {
      _arCnState.designGuide = String(val || '').slice(0, 2000);
    }
    function arCnSetPhotoLayout(pl) {
      const cur = _arCnState.slides[_arCnState.activeIdx];
      if (!cur) return;
      cur.photoLayout = pl;
      cur.userLayoutLocked = true;
      if (pl !== 'text_only' && !cur.bgImg) {
        cur.userClearedPhoto = false;
        arCnPopulateSamplePhotos(false);
      }
      arCnRefreshUI(true);
    }
    function arCnSelectSlide(i) {
      _arCnState.activeIdx = Number(i) || 0;
      arCnRefreshUI(false);
    }
    function arCnStepSlide(delta) {
      _arCnState.activeIdx += delta;
      arCnRefreshUI(false);
    }
    function arCnEditField(field, val) {
      const cur = _arCnState.slides[_arCnState.activeIdx];
      if (!cur) return;
      cur[field] = val;
      if (field === 'title') {
        const clean = String(val || '').replace(/\s+/g, ' ').trim();
        const preview = clean ? clean.slice(0, 14) : '가나다 카드뉴스';
        document.querySelectorAll('#arCnFontChipRow .ar-font-sample').forEach((el) => { el.textContent = preview; });
      }
      arCnRefreshUI(true);
    }
    function arCnAddSlide() {
      if (_arCnState.slides.length >= 10) {
        if (typeof arToast === 'function') arToast('카드뉴스는 최대 10장까지 만들 수 있어요.');
        return;
      }
      const tpl = arCnGetTemplate(_arCnState.templateId);
      const insertAt = Math.max(1, _arCnState.slides.length - 1);
      _arCnState.slides.splice(insertAt, 0, {
        role: 'point',
        kicker: `POINT ${String(insertAt).padStart(2, '0')}`,
        title: '새 핵심 포인트 제목',
        body: '여기에 설명을 2~3줄로 적어 주세요.',
        highlight: '핵심 한 줄 요약',
        bgImg: null,
        isUserPhoto: false,
        photoLayout: tpl.bodyLayout || 'photo_top'
      });
      _arCnState.activeIdx = insertAt;
      arCnPopulateSamplePhotos(false);
      arCnRefreshUI(false);
    }
    function arCnRemoveSlide() {
      if (_arCnState.slides.length <= 3) {
        if (typeof arToast === 'function') arToast('최소 3장은 남겨 두어야 해요.');
        return;
      }
      _arCnState.slides.splice(_arCnState.activeIdx, 1);
      if (_arCnState.activeIdx >= _arCnState.slides.length) _arCnState.activeIdx = _arCnState.slides.length - 1;
      arCnRefreshUI(false);
    }
    async function arCnHandleBgPhoto(ev) {
      const f = ev?.target?.files?.[0];
      if (ev?.target) ev.target.value = '';
      const cur = _arCnState.slides[_arCnState.activeIdx];
      if (!f || !cur) return;
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(f);
        });
        const im = new Image(); im.src = dataUrl; im._dataUrl = dataUrl;
        await im.decode();
        cur.bgImg = im;
        cur.isUserPhoto = true;
        cur.userClearedPhoto = false;
        if (!cur.photoLayout || cur.photoLayout === 'text_only') {
          const tpl = arCnGetTemplate(_arCnState.templateId);
          cur.photoLayout = _arCnState.activeIdx === 0 ? (tpl.coverLayout || 'photo_full') : (tpl.bodyLayout || 'photo_top');
        }
        if (typeof window.arVaultSaveImages === 'function') window.arVaultSaveImages([im], 'upload');
        arCnRefreshUI(true);
      } catch (_) {}
    }
    function arCnClearBgPhoto() {
      const cur = _arCnState.slides[_arCnState.activeIdx];
      if (!cur) return;
      cur.bgImg = null;
      cur.isUserPhoto = false;
      cur.userClearedPhoto = true;
      cur.photoLayout = 'text_only';
      arCnRefreshUI(true);
    }
    async function arCnLoadVaultStrip() {
      const strip = document.getElementById('arCnVaultStrip');
      if (!strip) return;
      if (typeof window.arVaultGetAll !== 'function') {
        strip.innerHTML = '<span class="text-[11px] text-[#71717a]">보관함에 저장된 사진이 없어요.</span>';
        return;
      }
      try {
        const all = await window.arVaultGetAll();
        if (!all || !all.length) {
          strip.innerHTML = '<span class="text-[11px] text-[#71717a]">보관함에 저장된 사진이 없어요.</span>';
          return;
        }
        strip.replaceChildren();
        all.slice(0, 20).forEach((item) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.style.cssText = 'flex:0 0 auto;width:44px;height:56px;border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,0.16);padding:0;background:#18181b;cursor:pointer;';
          const im = document.createElement('img');
          im.src = item.src;
          im.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
          b.appendChild(im);
          b.onclick = async () => {
            const cur = _arCnState.slides[_arCnState.activeIdx];
            if (!cur) return;
            const loaded = new Image(); loaded.src = item.src;
            try { await loaded.decode(); } catch (_) {}
            cur.bgImg = loaded;
            cur.isUserPhoto = true;
            cur.userClearedPhoto = false;
            if (!cur.photoLayout || cur.photoLayout === 'text_only') {
              const tpl = arCnGetTemplate(_arCnState.templateId);
              cur.photoLayout = _arCnState.activeIdx === 0 ? (tpl.coverLayout || 'photo_full') : (tpl.bodyLayout || 'photo_top');
            }
            arCnRefreshUI(true);
          };
          strip.appendChild(b);
        });
      } catch (_) {}
    }
    async function arCnToggleVaultStrip() {
      return arCnLoadVaultStrip();
    }

    // 레퍼런스 카드뉴스 캡처 이미지에서 배경색·포인트색 자동 추출 (100% 로컬 즉시 적용)
    async function arCnExtractRefPalette(ev) {
      const f = ev?.target?.files?.[0];
      if (ev?.target) ev.target.value = '';
      if (!f) return;
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(f);
        });
        const im = new Image(); im.src = dataUrl;
        await im.decode();
        const s = 48;
        const cv = document.createElement('canvas'); cv.width = s; cv.height = s;
        const g = cv.getContext('2d');
        g.drawImage(im, 0, 0, s, s);
        const px = g.getImageData(0, 0, s, s).data;
        const toHex = (r, gr, b) => '#' + [r, gr, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
        // 테두리 픽셀 평균 -> 배경색
        let br = 0, bg = 0, bb = 0, bc = 0;
        for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
          if (x < 5 || x >= s - 5 || y < 5 || y >= s - 5) {
            const i = (y * s + x) * 4;
            br += px[i]; bg += px[i + 1]; bb += px[i + 2]; bc++;
          }
        }
        const bgR = br / Math.max(1, bc), bgG = bg / Math.max(1, bc), bgB = bb / Math.max(1, bc);
        const bgHex = toHex(bgR, bgG, bgB);
        // 내부 픽셀 중 배경과 대비되면서 채도가 높은 포인트 컬러 선택
        let bestSat = -1, acR = 37, acG = 99, acB = 235;
        for (let y = 5; y < s - 5; y++) for (let x = 5; x < s - 5; x++) {
          const i = (y * s + x) * 4;
          const r = px[i], gr = px[i + 1], b = px[i + 2];
          const dist = Math.hypot(r - bgR, gr - bgG, b - bgB);
          const mx = Math.max(r, gr, b), mn = Math.min(r, gr, b);
          const sat = mx ? (mx - mn) / mx : 0;
          const score = sat * 1.4 + (dist / 255) * 0.6;
          if (dist > 45 && score > bestSat) { bestSat = score; acR = r; acG = gr; acB = b; }
        }
        const acHex = toHex(acR, acG, acB);
        const dark = arCnIsDarkHex(bgHex);
        _arCnState.customColors = { bg: bgHex, accent: acHex, fg: dark ? '#f8fafc' : '#18181b' };
        arCnRefreshUI(true);
        if (typeof arToast === 'function') arToast(`레퍼런스 색감(${bgHex} · ${acHex})을 전 카드에 적용했어요!`, true);
      } catch (_) {
        if (typeof arToast === 'function') arToast('레퍼런스 이미지에서 색감을 읽지 못했어요.');
      }
    }

    // 디자인 MD 파일 불러오기 (.md 내 컬러 HEX·계정명·가이드 규칙 자동 반영) & 내보내기
    async function arCnImportDesignMd(ev) {
      const f = ev?.target?.files?.[0];
      if (ev?.target) ev.target.value = '';
      if (!f) return;
      try {
        const text = await f.text();
        _arCnState.designGuide = text.slice(0, 2000);
        const gIn = document.getElementById('arCnGuideInput');
        if (gIn) gIn.value = _arCnState.designGuide;
        const hexes = text.match(/#[0-9a-fA-F]{6}\b/g) || [];
        const bgMatch = text.match(/(?:background|bg|배경)[^\n#]*(#[0-9a-fA-F]{6})/i);
        const acMatch = text.match(/(?:accent|primary|point|강조|포인트)[^\n#]*(#[0-9a-fA-F]{6})/i);
        const fgMatch = text.match(/(?:foreground|text|ink|글자)[^\n#]*(#[0-9a-fA-F]{6})/i);
        const handleMatch = text.match(/@([a-zA-Z0-9._가-힣]{2,24})/);
        if (bgMatch) _arCnState.customColors.bg = bgMatch[1];
        else if (hexes[0]) _arCnState.customColors.bg = hexes[0];
        if (acMatch) _arCnState.customColors.accent = acMatch[1];
        else if (hexes[1]) _arCnState.customColors.accent = hexes[1];
        if (fgMatch) _arCnState.customColors.fg = fgMatch[1];
        else if (_arCnState.customColors.bg) _arCnState.customColors.fg = arCnIsDarkHex(_arCnState.customColors.bg) ? '#f8fafc' : '#18181b';
        if (handleMatch) {
          _arCnState.handle = `@${handleMatch[1]}`;
          const hIn = document.getElementById('arCnHandleInput');
          if (hIn) hIn.value = _arCnState.handle;
        }
        arCnRefreshUI(true);
        if (typeof arToast === 'function') arToast('디자인 MD 가이드를 불러와 색감과 말투 규칙에 반영했어요!', true);
      } catch (_) {}
    }
    function arCnExportDesignMd() {
      const eff = arCnEffectiveTheme();
      const md = [
        `# 브랜드 카드뉴스 디자인 가이드 (Design MD)`,
        ``,
        `- 템플릿 베이스: ${eff.name} (${eff.id})`,
        `- 배경색(Background): ${eff.bg}`,
        `- 포인트 컬러(Accent): ${eff.accent}`,
        `- 글자색(Text): ${eff.fg}`,
        `- 폰트(상업적 무료): ${_arCnState.fontFamily || eff.fontTitle}`,
        `- 비율: ${_arCnState.ratio}`,
        `- 계정명: ${_arCnState.handle || '@내계정'}`,
        ``,
        `## 카피 · 톤앤매너 규칙`,
        _arCnState.designGuide || `- 짧고 구체적인 사람 말투 사용 (AI 상투구 금지)\n- 한 문장 20자 이내로 줄바꿈\n- 이모지 남발 금지`
      ].join('\n');
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'brand-design-guide.md';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      if (typeof arToast === 'function') arToast('현재 브랜드 디자인 가이드(.md)를 저장했어요.', true);
    }

    function arCnPickSampleTopic(text) {
      const inp = document.getElementById('arCnTopicInput');
      if (inp) inp.value = text;
      arCnGenerateFromTopic();
    }
    async function arCnGenerateFromTopic() {
      const inp = document.getElementById('arCnTopicInput');
      const srcEl = document.getElementById('arCnSourceInput');
      const topic = String(inp?.value || '').trim();
      const sourceText = String(srcEl?.value || '').trim();
      if (!topic && !sourceText) {
        if (typeof arToast === 'function') arToast('먼저 카드뉴스 주제나 원고를 입력해 주세요.');
        inp?.focus();
        return;
      }
      const btn = document.getElementById('arCnGenBtn');
      if (btn) { btn.disabled = true; btn.textContent = '만드는 중...'; }
      try {
        const indName = (typeof IND !== 'undefined' && IND && IND.name) ? IND.name : '';
        const resp = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'cardnews',
            topic,
            sourceText,
            designGuide: _arCnState.designGuide || '',
            slideCount: _arCnState.targetCount,
            industry: indName,
            accountName: _arCnState.handle || ''
          })
        });
        let slides = null;
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.slides) && data.slides.length >= 3) {
            const tpl = arCnGetTemplate(_arCnState.templateId);
            slides = data.slides.map((s, idx) => {
              const prev = _arCnState.slides[idx];
              return {
                role: s.role || 'point',
                kicker: s.kicker || '',
                title: s.title || '',
                body: s.body || '',
                highlight: s.highlight || '',
                bgImg: (prev && prev.isUserPhoto) ? prev.bgImg : null,
                isUserPhoto: Boolean(prev && prev.isUserPhoto),
                photoLayout: (prev && prev.userLayoutLocked) ? prev.photoLayout : (idx === 0 ? (tpl.coverLayout || 'photo_top') : (tpl.bodyLayout || 'photo_top'))
              };
            });
          }
        }
        _arCnState.slides = slides || arCnDefaultSlides(_arCnState.targetCount, topic || sourceText.slice(0, 24));
        _arCnState.hasAiGenerated = true;
        _arCnState.activeIdx = 0;
        _arCnState.sheetTab = 'theme';
        arCnPopulateSamplePhotos(false);
        arCnRefreshUI(false);
        if (typeof arToast === 'function') arToast(`${_arCnState.slides.length}장 카드뉴스가 완성됐어요! 아래에서 테마 20종과 폰트를 골라 보세요.`, true);
      } catch (_) {
        _arCnState.slides = arCnDefaultSlides(_arCnState.targetCount, topic || sourceText.slice(0, 24));
        _arCnState.hasAiGenerated = true;
        _arCnState.activeIdx = 0;
        _arCnState.sheetTab = 'theme';
        arCnPopulateSamplePhotos(false);
        arCnRefreshUI(false);
        if (typeof arToast === 'function') arToast(`${_arCnState.slides.length}장 기본 템플릿을 채웠어요! 아래에서 테마·글자를 다듬어 보세요.`, true);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = `✨ ${_arCnState.targetCount}장 만들기`; }
      }
    }

    // 입력한 주제에 맞춰 AI 사진 생성 후 카드뉴스 각 장에 자동 채우기
    async function arCnFillAiPhotos() {
      const topic = String(document.getElementById('arCnTopicInput')?.value || (_arCnState.slides[0] && _arCnState.slides[0].title) || '').trim();
      if (!topic) {
        if (typeof arToast === 'function') arToast('먼저 카드뉴스 주제를 입력해 주세요.');
        return;
      }
      const btn = document.getElementById('arCnAiPhotoBtn');
      if (btn) { btn.disabled = true; btn.textContent = '사진 생성 중...'; }
      try {
        const indKey = (typeof IND !== 'undefined' && IND && IND.key) ? IND.key : '';
        const wantCnt = Math.min(6, _arCnState.slides.length);
        const resp = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'scene-images',
            prompt: topic,
            count: wantCnt,
            aspectRatio: _arCnState.ratio === '1:1' ? '1:1' : '4:5',
            industry: indKey
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          const imgs = (data && Array.isArray(data.images)) ? data.images : [];
          if (imgs.length) {
            const loaded = [];
            for (const item of imgs) {
              if (!item || !item.dataUrl) continue;
              const im = new Image(); im.src = item.dataUrl; im._dataUrl = item.dataUrl;
              try { await im.decode(); loaded.push(im); } catch (_) {}
            }
            if (loaded.length) {
              const tpl = arCnGetTemplate(_arCnState.templateId);
              _arCnState.slides.forEach((s, i) => {
                s.bgImg = loaded[i % loaded.length];
                s.isUserPhoto = true;
                s.userClearedPhoto = false;
                if (!s.photoLayout || s.photoLayout === 'text_only') {
                  s.photoLayout = i === 0 ? (tpl.coverLayout || 'photo_top') : (tpl.bodyLayout || 'photo_top');
                }
              });
              if (typeof window.arVaultSaveImages === 'function') window.arVaultSaveImages(loaded, 'ai');
              arCnRefreshUI(true);
              if (typeof arToast === 'function') arToast(`주제 맞춤 AI 사진 ${loaded.length}장을 카드뉴스에 채웠어요!`, true);
              return;
            }
          }
        }
        if (typeof arToast === 'function') arToast('AI 사진 생성에 실패했어요. [📷 사진 바꾸기]나 [🖼️ 보관함]을 이용해 보세요.');
      } catch (_) {
        if (typeof arToast === 'function') arToast('사진 생성 중 오류가 발생했어요.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✨ 주제 맞춤 AI 사진 채우기'; }
      }
    }

    // 이 장만 AI 코멘트로 부분 수정 (Claude Design 코멘트 수정 워크플로우)
    async function arCnApplyCommentEdit() {
      const inp = document.getElementById('arCnCommentInput');
      const instruction = String(inp?.value || '').trim();
      const cur = _arCnState.slides[_arCnState.activeIdx];
      if (!cur || !instruction) {
        if (typeof arToast === 'function') arToast('이 장을 어떻게 바꿀지 코멘트를 적어 주세요.');
        inp?.focus();
        return;
      }
      const btn = document.getElementById('arCnCommentBtn');
      if (btn) { btn.disabled = true; btn.textContent = '반영 중...'; }
      try {
        const resp = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'cardnews-edit',
            slide: { role: cur.role, kicker: cur.kicker, title: cur.title, body: cur.body, highlight: cur.highlight },
            instruction,
            designGuide: _arCnState.designGuide || ''
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.ok && data.slide) {
            cur.kicker = data.slide.kicker;
            cur.title = data.slide.title;
            cur.body = data.slide.body;
            cur.highlight = data.slide.highlight;
            if (inp) inp.value = '';
            arCnRefreshUI(false);
            if (typeof arToast === 'function') arToast(`${_arCnState.activeIdx + 1}번 카드에 수정 코멘트를 반영했어요!`, true);
            return;
          }
        }
        if (typeof arToast === 'function') arToast('수정 응답을 받지 못했어요. 위 입력칸에서 직접 수정해 주세요.');
      } catch (_) {
        if (typeof arToast === 'function') arToast('네트워크 오류로 반영하지 못했어요.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✨ 이 장 반영'; }
      }
    }
    function arCnExportSlideBlob(slide, i, total) {
      return new Promise((resolve) => {
        const off = document.createElement('canvas');
        off.width = 1080;
        off.height = _arCnState.ratio === '1:1' ? 1080 : 1350;
        arCnRenderSlide(off, slide, i, total);
        off.toBlob((blob) => resolve(blob), 'image/png');
      });
    }
    async function arCnDownloadCurrentPng() {
      const idx = _arCnState.activeIdx;
      const total = _arCnState.slides.length;
      const cur = _arCnState.slides[idx];
      if (!cur) return;
      const blob = await arCnExportSlideBlob(cur, idx, total);
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `카드뉴스_${String(idx + 1).padStart(2, '0')}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      if (typeof arToast === 'function') arToast(`${idx + 1}번 카드를 고화질 PNG로 저장했어요.`, true);
    }
    async function arCnDownloadAllZip() {
      const total = _arCnState.slides.length;
      if (!total) return;
      const btn = document.getElementById('arCnDownloadZipBtn');
      if (btn) { btn.disabled = true; btn.textContent = `PNG ${total}장 묶는 중...`; }
      try {
        const files = [];
        for (let i = 0; i < total; i++) {
          const blob = await arCnExportSlideBlob(_arCnState.slides[i], i, total);
          const buf = new Uint8Array(await blob.arrayBuffer());
          const tag = i === 0 ? '표지' : (i === total - 1 ? '마무리' : `본문${i}`);
          files.push({ name: `${String(i + 1).padStart(2, '0')}_${tag}.png`, data: buf });
        }
        const zipBlob = arCnBuildZipBlob(files);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = `인스타_카드뉴스_${total}장.zip`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        if (typeof arToast === 'function') arToast(`카드뉴스 ${total}장을 고화질 ZIP으로 한 번에 저장했어요!`, true);
      } catch (_) {
        if (typeof arToast === 'function') arToast('저장에 실패했어요. 이 장 PNG 저장을 이용해 주세요.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = `📦 전체 ${total}장 한 번에 저장 (.zip)`; }
      }
    }
    async function arCnExportSlideJpegBytes(slide, idx, total) {
      const off = document.createElement('canvas');
      off.width = 1080;
      off.height = _arCnState.ratio === '1:1' ? 1080 : 1350;
      arCnRenderSlide(off, slide, idx, total);
      const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/jpeg', 0.93));
      return { bytes: new Uint8Array(await blob.arrayBuffer()), w: off.width, h: off.height };
    }
    // 순수 JS 멀티페이지 PDF 생성기 (/DCTDecode JPEG 임베딩 · 외부 CDN 0개)
    function arCnBuildPdfBlob(jpegs) {
      const enc = new TextEncoder();
      const parts = [];
      let pos = 0;
      const pushStr = (s) => { const b = enc.encode(s); parts.push(b); pos += b.length; };
      const pushBytes = (u8) => { parts.push(u8); pos += u8.length; };
      const offsets = [0]; // 1-indexed object offsets
      pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
      const n = jpegs.length;
      // Obj 1: Catalog, Obj 2: Pages
      // Per slide i (0..n-1): Image = 3 + i*3, Content = 4 + i*3, Page = 5 + i*3
      const pageIds = [];
      for (let i = 0; i < n; i++) pageIds.push(5 + i * 3);
      offsets[1] = pos; pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
      offsets[2] = pos; pushStr(`2 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${n} >>\nendobj\n`);
      for (let i = 0; i < n; i++) {
        const { bytes, w, h } = jpegs[i];
        const ptW = 540, ptH = Math.round(540 * (h / w));
        const imgId = 3 + i * 3, cntId = 4 + i * 3, pgId = 5 + i * 3;
        offsets[imgId] = pos;
        pushStr(`${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);
        pushBytes(bytes);
        pushStr('\nendstream\nendobj\n');
        const contentStr = `q ${ptW} 0 0 ${ptH} 0 0 cm /Im${i} Do Q\n`;
        offsets[cntId] = pos;
        pushStr(`${cntId} 0 obj\n<< /Length ${contentStr.length} >>\nstream\n${contentStr}endstream\nendobj\n`);
        offsets[pgId] = pos;
        pushStr(`${pgId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptW} ${ptH}] /Resources << /XObject << /Im${i} ${imgId} 0 R >> >> /Contents ${cntId} 0 R >>\nendobj\n`);
      }
      const xrefPos = pos;
      const totalObjs = 2 + n * 3;
      pushStr(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
      for (let id = 1; id <= totalObjs; id++) {
        pushStr(String(offsets[id]).padStart(10, '0') + ' 00000 n \n');
      }
      pushStr(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);
      return new Blob(parts, { type: 'application/pdf' });
    }
    async function arCnDownloadPdf() {
      const total = _arCnState.slides.length;
      if (!total) return;
      const btn = document.getElementById('arCnDownloadPdfBtn');
      if (btn) { btn.disabled = true; btn.textContent = 'PDF 생성 중...'; }
      try {
        const jpegs = [];
        for (let i = 0; i < total; i++) jpegs.push(await arCnExportSlideJpegBytes(_arCnState.slides[i], i, total));
        const pdfBlob = arCnBuildPdfBlob(jpegs);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pdfBlob);
        a.download = `인스타_카드뉴스_${total}장.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        if (typeof arToast === 'function') arToast(`카드뉴스 ${total}장을 고화질 PDF로 저장했어요!`, true);
      } catch (_) {
        if (typeof arToast === 'function') arToast('PDF 저장 중 오류가 발생했어요.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📄 PDF 문서 저장'; }
      }
    }
    // 순수 JS OOXML PPTX(파워포인트/키노트/구글슬라이드) 생성기
    function arCnBuildPptxBlob(jpegs) {
      const enc = new TextEncoder();
      const n = jpegs.length;
      const isSquare = jpegs[0] && jpegs[0].w === jpegs[0].h;
      const cx = isSquare ? 9144000 : 7315200;
      const cy = 9144000;
      const files = [];
      const addXml = (name, xml) => files.push({ name, data: enc.encode(xml) });
      const slideOverrides = [];
      const sldIdLst = [];
      const presRels = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
      ];
      for (let i = 1; i <= n; i++) {
        slideOverrides.push(`<Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`);
        sldIdLst.push(`<p:sldId id="${255 + i}" r:id="rId${i + 1}"/>`);
        presRels.push(`<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i}.xml"/>`);
        files.push({ name: `ppt/media/image${i}.jpg`, data: jpegs[i - 1].bytes });
        addXml(`ppt/slides/_rels/slide${i}.xml.rels`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i}.jpg"/></Relationships>`);
        addXml(`ppt/slides/slide${i}.xml`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:pic><p:nvPicPr><p:cNvPr id="2" name="Card ${i}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`);
      }
      addXml('[Content_Types].xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slideOverrides.join('')}</Types>`);
      addXml('_rels/.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`);
      addXml('ppt/_rels/presentation.xml.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${presRels.join('')}</Relationships>`);
      addXml('ppt/presentation.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${sldIdLst.join('')}</p:sldIdLst><p:sldSz cx="${cx}" cy="${cy}" type="custom"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`);
      addXml('ppt/slideMasters/_rels/slideMaster1.xml.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`);
      addXml('ppt/slideMasters/slideMaster1.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`);
      addXml('ppt/slideLayouts/_rels/slideLayout1.xml.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`);
      addXml('ppt/slideLayouts/slideLayout1.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`);
      addXml('ppt/theme/theme1.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="AutoReels"><a:themeElements><a:clrScheme name="AutoReels"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F2937"/></a:dk2><a:lt2><a:srgbClr val="F3F4F6"/></a:lt2><a:accent1><a:srgbClr val="2563EB"/></a:accent1><a:accent2><a:srgbClr val="EA580C"/></a:accent2><a:accent3><a:srgbClr val="16A34A"/></a:accent3><a:accent4><a:srgbClr val="D97706"/></a:accent4><a:accent5><a:srgbClr val="7C3AED"/></a:accent5><a:accent6><a:srgbClr val="DB2777"/></a:accent6><a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink></a:clrScheme><a:fontScheme name="AutoReels"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface="Malgun Gothic"/><a:cs typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface="Malgun Gothic"/><a:cs typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="AutoReels"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`);
      const zipBlob = arCnBuildZipBlob(files);
      return new Blob([zipBlob], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    }
    async function arCnDownloadPptx() {
      const total = _arCnState.slides.length;
      if (!total) return;
      const btn = document.getElementById('arCnDownloadPptBtn');
      if (btn) { btn.disabled = true; btn.textContent = 'PPT 생성 중...'; }
      try {
        const jpegs = [];
        for (let i = 0; i < total; i++) jpegs.push(await arCnExportSlideJpegBytes(_arCnState.slides[i], i, total));
        const pptBlob = arCnBuildPptxBlob(jpegs);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pptBlob);
        a.download = `인스타_카드뉴스_${total}장.pptx`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        if (typeof arToast === 'function') arToast(`카드뉴스 ${total}장을 파워포인트(.pptx) 파일로 저장했어요!`, true);
      } catch (_) {
        if (typeof arToast === 'function') arToast('PPT 저장 중 오류가 발생했어요.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📊 PPT 파일 저장'; }
      }
    }
    async function arCnApplyToStudioReels(transitionSlide = null) {
      const total = _arCnState.slides.length;
      if (!total) return;
      const btn = document.getElementById('arCnToReelsBtn');
      if (btn) { btn.disabled = true; btn.textContent = '릴스로 변환 중...'; }
      try {
        const tpl = arCnEffectiveTheme();
        const outImgs = [];
        const off = document.createElement('canvas');
        off.width = 720; off.height = 1280;
        const g = off.getContext('2d');
        const cardCv = document.createElement('canvas');
        cardCv.width = 720; cardCv.height = _arCnState.ratio === '1:1' ? 720 : 900;
        for (let i = 0; i < total; i++) {
          arCnRenderSlide(cardCv, _arCnState.slides[i], i, total);
          g.fillStyle = tpl.bg;
          g.fillRect(0, 0, 720, 1280);
          g.drawImage(cardCv, 0, Math.round((1280 - cardCv.height) / 2));
          const url = off.toDataURL('image/jpeg', 0.92);
          const im = new Image(); im.src = url; im._dataUrl = url; im._skipVault = true; im._label = `카드뉴스 ${i + 1}장`;
          await im.decode();
          outImgs.push(im);
        }
        (campaign.uploadedPhotos || []).forEach(arReleasePhoto);
        campaign.uploadedPhotos = outImgs;
        campaign.isUserCustomPhotos = true;
        campaign.isPhotoCollageMode = true;
        campaign._collageCutSec = 2.6;
        campaign.cutLenScale = [];
        campaign.cutCountOverride = outImgs.length;
        campaign.hasCustomVideo = false;
        const lengths = _arCnState.slides.map(slide => slide.duration ?? 2.6);
        campaign.scenePlan = lengths.map((cardDuration, photoIdx) => ({ photoIdx, cardDuration }));
        campaign.hideCardOnVideo = true;
        campaign.noDefaultCaptions = true;
        campaign.hook = '';
        campaign.sub = '';
        campaign.priceTag = '';
        campaign.cutCaptions = Array.from({ length: outImgs.length }, () => '');
        campaign.ttsLines = Array.from({ length: outImgs.length }, () => '');
        if (typeof AudioEngine !== 'undefined') {
          AudioEngine.ttsVoice = 'off'; AudioEngine.masterBuffer = null; AudioEngine.masterDuration = 0; AudioEngine.ttsDirty = false;
        }
        const mainD = +lengths.reduce((sum, length) => sum + length, 0).toFixed(2);
        if (typeof OUTRO_DURATION !== 'undefined') OUTRO_DURATION = 0;
        if (typeof BASE_DURATION !== 'undefined') BASE_DURATION = mainD;
        if (typeof CUT_LENGTHS !== 'undefined') CUT_LENGTHS = lengths;
        if (typeof TOTAL_DURATION !== 'undefined') TOTAL_DURATION = mainD;
        if (window.__timelines && window.__timelines.main) window.__timelines.main.duration = TOTAL_DURATION;
        if (typeof updateDurationIndicator === 'function') updateDurationIndicator();
        if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
        if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
        if (typeof renderUploadedPhotoThumbs === 'function') renderUploadedPhotoThumbs();
        if (typeof designThumbCache !== 'undefined' && designThumbCache) designThumbCache.fresh = {};
        if (typeof scheduleDesignThumbs === 'function') scheduleDesignThumbs();
        arSyncEditedVideoOptionUI();
        arCloseCardNewsModal();
        if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(0);
        if (Number.isInteger(transitionSlide)) openCutEditor(transitionSlide, 'transition');
        else if (typeof isPlaying !== 'undefined') isPlaying = true;
        if (typeof arToast === 'function') arToast(`카드뉴스 ${total}장을 릴스 영상으로 불러왔어요! 노래를 입혀 바로 저장해 보세요.`, true);
      } catch (_) {
        if (typeof arToast === 'function') arToast('릴스로 변환하지 못했어요. 다시 시도해 주세요.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🎬 릴스 영상으로도 만들기 →'; }
      }
    }

    if (typeof window !== 'undefined') {
      window.arOpenCardNewsModal = arOpenCardNewsModal;
      window.arCloseCardNewsModal = arCloseCardNewsModal;
      window.arCnOpenSheet = arCnOpenSheet;
      window.arCnStepTab = arCnStepTab;
      window.arCnSetCat = arCnSetCat;
      window.arCnSetTargetCount = arCnSetTargetCount;
      window.arCnSetTemplate = arCnSetTemplate;
      window.arCnSetGradient = arCnSetGradient;
      window.arCnShuffleDesign = arCnShuffleDesign;
      window.arCnSetCustomColor = arCnSetCustomColor;
      window.arCnResetCustomColors = arCnResetCustomColors;
      window.arCnSetFontKey = arCnSetFontKey;
      window.arCnSetFontFamily = arCnSetFontFamily;
      window.arCnToggleTweak = arCnToggleTweak;
      window.arCnSetRatio = arCnSetRatio;
      window.arCnSetFontScale = arCnSetFontScale;
      window.arCnUpdateHandle = arCnUpdateHandle;
      window.arCnUpdateDesignGuide = arCnUpdateDesignGuide;
      window.arCnSetPhotoLayout = arCnSetPhotoLayout;
      window.arCnSelectSlide = arCnSelectSlide;
      window.arCnStepSlide = arCnStepSlide;
      window.arCnEditField = arCnEditField;
      window.arCnAddSlide = arCnAddSlide;
      window.arCnRemoveSlide = arCnRemoveSlide;
      window.arCnHandleBgPhoto = arCnHandleBgPhoto;
      window.arCnClearBgPhoto = arCnClearBgPhoto;
      window.arCnToggleVaultStrip = arCnToggleVaultStrip;
      window.arCnFillAiPhotos = arCnFillAiPhotos;
      window.arCnExtractRefPalette = arCnExtractRefPalette;
      window.arCnImportDesignMd = arCnImportDesignMd;
      window.arCnExportDesignMd = arCnExportDesignMd;
      window.arCnSaveBrandPreset = arCnSaveBrandPreset;
      window.arCnPickSampleTopic = arCnPickSampleTopic;
      window.arCnGenerateFromTopic = arCnGenerateFromTopic;
      window.arCnApplyCommentEdit = arCnApplyCommentEdit;
      window.arCnDownloadCurrentPng = arCnDownloadCurrentPng;
      window.arCnDownloadAllZip = arCnDownloadAllZip;
      window.arCnDownloadPdf = arCnDownloadPdf;
      window.arCnDownloadPptx = arCnDownloadPptx;
      window.arCnApplyToStudioReels = arCnApplyToStudioReels;
      window.arRunCardNewsCritic = arRunCardNewsCritic;
      window.arAutoFixCardNewsCritic = arAutoFixCardNewsCritic;
      window.arRunReelsCritic = arRunReelsCritic;
      window.arAutoFixReelsCritic = arAutoFixReelsCritic;
    }

    // ==========================================================================
    // ★ 저장·발행 전 자동 디자인 검수 + 원클릭 자동 보정 (릴스 & 카드뉴스 공용, 0원 실시간)
    // ==========================================================================
    function arHexLuminance(hex) {
      const m = String(hex || '').replace('#', '');
      if (m.length !== 6) return 0.5;
      const toLin = (c) => {
        const s = parseInt(c, 16) / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * toLin(m.slice(0, 2)) + 0.7152 * toLin(m.slice(2, 4)) + 0.0722 * toLin(m.slice(4, 6));
    }
    function arContrastRatio(hex1, hex2) {
      const l1 = arHexLuminance(hex1), l2 = arHexLuminance(hex2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    function arRenderCriticBox(containerId, score, issues, fixFnName) {
      const box = document.getElementById(containerId);
      if (!box) return;
      const tone = score >= 95 ? '#4ade80' : (score >= 75 ? '#facc15' : '#f87171');
      const label = score >= 95 ? '발행 준비 완료' : (score >= 75 ? '가벼운 보정 추천' : '보정 필요');
      const fixableCount = issues.filter((it) => it.fixable).length;
      const rowsHtml = issues.length
        ? issues.map((it) => `
            <div class="flex items-start gap-2 text-[11.5px] leading-snug ${it.ok ? 'text-[#86efac]' : 'text-[#fde68a]'}">
              <span class="shrink-0">${it.ok ? '✅' : '⚠️'}</span>
              <span>${it.msg}</span>
            </div>
          `).join('')
        : '<div class="text-[12px] text-[#86efac]">✅ 모든 항목이 깔끔하게 통과했어요! 바로 저장·발행하셔도 좋습니다.</div>';
      box.innerHTML = `
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="text-[12.5px] font-semibold text-[#ededed]">🔍 자동 디자인 검수</span>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono" style="background:rgba(255,255,255,0.07);color:${tone};">${score}점 · ${label}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button type="button" onclick="${fixFnName === 'arAutoFixCardNewsCritic' ? 'arRunCardNewsCritic()' : 'arRunReelsCritic()'}" class="btn-secondary h-7 px-2.5 text-[11px] cursor-pointer">다시 검수</button>
            ${fixableCount > 0 ? `<button type="button" onclick="${fixFnName}()" class="btn-primary h-7 px-2.5 text-[11px] font-bold cursor-pointer">✨ 한 번에 보정 (${fixableCount})</button>` : ''}
          </div>
        </div>
        <div class="space-y-1.5 pt-1">${rowsHtml}</div>
      `;
    }

    function arRunCardNewsCritic() {
      const eff = arCnEffectiveTheme();
      const slides = _arCnState.slides || [];
      const issues = [];
      let score = 100;

      // 1) 배경·글자 명도 대비 (WCAG 4.5 기준, 풀배경 사진형 제외)
      const nonFullCount = slides.filter((s) => {
        const pl = s.photoLayout || eff.coverLayout || '';
        return pl !== 'photo_full' && !pl.startsWith('photo_big_') && !pl.startsWith('photo_viral_') && pl !== 'photo_bold_stamp' && pl !== 'photo_neon_card' && pl !== 'photo_slash_kinetic' && pl !== 'photo_checker_split' && pl !== 'photo_brand_chiptags';
      }).length;
      if (nonFullCount > 0 && /^#[0-9a-f]{6}$/i.test(eff.bg) && /^#[0-9a-f]{6}$/i.test(eff.fg)) {
        const cr = arContrastRatio(eff.bg, eff.fg);
        if (cr < 4.5) {
          score -= 18;
          issues.push({ ok: false, fixable: true, key: 'contrast', msg: `배경과 글자 명도 대비가 낮아요 (${cr.toFixed(1)}:1). 가독성을 높일 수 있어요.` });
        } else {
          issues.push({ ok: true, msg: `배경·글자 가독성 대비 양호 (${cr.toFixed(1)}:1)` });
        }
      }

      // 2) 실제 캔버스 폭 기준 줄바꿈 오버플로우 체크
      const cv = document.getElementById('arCnPreviewCanvas');
      const mctx = cv ? cv.getContext('2d') : null;
      const overflowSlides = [];
      if (mctx) {
        const fsMul = _arCnState.fontScale === 'sm' ? 0.88 : (_arCnState.fontScale === 'lg' ? 1.12 : 1.0);
        const maxW = 1080 - 168;
        slides.forEach((s, i) => {
          mctx.font = `${eff.fontTitleWeight || 700} ${Math.round(54 * fsMul * (eff.fontTitleMul || 1))}px ${eff.fontTitle}`;
          const tLn = arCnWrapLines(mctx, s.title || '', maxW).length;
          mctx.font = `500 ${Math.round(33 * fsMul)}px ${eff.fontBody}`;
          const bLn = arCnWrapLines(mctx, s.body || '', maxW).length;
          if (tLn > 2 || bLn > 4) overflowSlides.push(i + 1);
        });
      }
      if (overflowSlides.length) {
        score -= Math.min(24, overflowSlides.length * 8);
        issues.push({ ok: false, fixable: true, key: 'overflow', msg: `${overflowSlides.join(', ')}번 카드 글자가 길어 잘릴 수 있어요 (글자 크기·줄 간격 자동 조절 가능).` });
      } else {
        issues.push({ ok: true, msg: `전체 ${slides.length}장 제목·본문 여백과 줄 수 안전` });
      }

      // 3) 기본 샘플 문구 / 빈 제목 체크
      const emptySlides = slides.map((s, i) => (!String(s.title || '').trim() ? i + 1 : 0)).filter(Boolean);
      const isDefaultSample = slides[0] && String(slides[0].title || '').trim() === '알아두면 바로 쓰는 핵심 가이드';
      if (emptySlides.length) {
        score -= 15;
        issues.push({ ok: false, fixable: false, msg: `${emptySlides.join(', ')}번 카드에 제목이 비어 있어요. [3 폰트] 탭에서 채워 주세요.` });
      } else if (isDefaultSample) {
        score -= 10;
        issues.push({ ok: false, fixable: false, msg: '1번 카드가 아직 예시 제목이에요. [1 주제]에서 내 주제로 생성해 보세요.' });
      }

      // 4) 사진 누락 체크
      const noPhotoSlides = slides.map((s, i) => ((s.photoLayout !== 'text_only' && !s.bgImg) ? i + 1 : 0)).filter(Boolean);
      if (noPhotoSlides.length) {
        score -= 12;
        issues.push({ ok: false, fixable: true, key: 'photos', msg: `${noPhotoSlides.join(', ')}번 카드에 사진이 비어 있어요.` });
      } else {
        issues.push({ ok: true, msg: '모든 카드 사진이 정상적으로 연결됨' });
      }

      // 5) 하단 계정명 체크
      if (_arCnState.tweaks && _arCnState.tweaks.showHandle !== false && !String(_arCnState.handle || '').trim()) {
        score -= 6;
        issues.push({ ok: false, fixable: true, key: 'handle', msg: '하단 @계정명이 비어 있어요. 보정 시 깔끔하게 숨길 수 있어요.' });
      }

      score = Math.max(40, Math.min(100, score));
      arRenderCriticBox('arCnCriticCard', score, issues, 'arAutoFixCardNewsCritic');
      return { score, issues };
    }

    function arAutoFixCardNewsCritic() {
      const eff = arCnEffectiveTheme();
      let fixed = 0;
      if (/^#[0-9a-f]{6}$/i.test(eff.bg) && /^#[0-9a-f]{6}$/i.test(eff.fg) && arContrastRatio(eff.bg, eff.fg) < 4.5) {
        _arCnState.customColors.fg = arCnIsDarkHex(eff.bg) ? '#fafafa' : '#141414';
        fixed++;
      }
      const cv = document.getElementById('arCnPreviewCanvas');
      const mctx = cv ? cv.getContext('2d') : null;
      if (mctx) {
        const maxW = 1080 - 168;
        let hadOverflow = false;
        _arCnState.slides.forEach((s) => {
          mctx.font = `${eff.fontTitleWeight || 700} 54px ${eff.fontTitle}`;
          if (arCnWrapLines(mctx, s.title || '', maxW).length > 2) hadOverflow = true;
          if (String(s.body || '').length > 88) {
            s.body = String(s.body).slice(0, 82).trim() + '…';
            hadOverflow = true;
          }
        });
        if (hadOverflow) { _arCnState.fontScale = 'sm'; fixed++; }
      }
      if (_arCnState.slides.some((s) => s.photoLayout !== 'text_only' && !s.bgImg)) {
        _arCnState.slides.forEach((s) => { s.userClearedPhoto = false; });
        arCnPopulateSamplePhotos(false);
        fixed++;
      }
      if (_arCnState.tweaks && _arCnState.tweaks.showHandle !== false && !String(_arCnState.handle || '').trim()) {
        _arCnState.tweaks.showHandle = false;
        fixed++;
      }
      arCnRefreshUI(false);
      arRunCardNewsCritic();
      if (typeof arToast === 'function') arToast(`✨ 카드뉴스 자동 보정 ${fixed || 1}건을 완료했어요!`, true);
    }

    function arRunReelsCritic() {
      if (typeof campaign === 'undefined' || !campaign) return { score: 100, issues: [] };
      const cuts = Math.max(1, typeof getTargetCutCount === 'function' ? getTargetCutCount() : 4);
      const issues = [];
      let score = 100;

      // 1) 자막 길이·줄바꿈 과밀 체크
      const caps = Array.isArray(campaign.cutCaptions) ? campaign.cutCaptions.slice(0, cuts) : [];
      const longCuts = [];
      caps.forEach((txt, i) => {
        const clean = String(txt || '').trim();
        if (clean.length > 36 || (clean.length > 24 && !clean.includes('\n'))) longCuts.push(i + 1);
      });
      if (longCuts.length) {
        score -= Math.min(20, longCuts.length * 7);
        issues.push({ ok: false, fixable: true, key: 'captions', msg: `${longCuts.join(', ')}컷 자막이 길어 한 줄에 넘칠 수 있어요 (자동 줄바꿈 보정 가능).` });
      } else {
        issues.push({ ok: true, msg: `전체 ${cuts}컷 자막 길이·가독성 양호` });
      }

      // 2) 사운드·박자 밸런스 체크
      const bgmStyle = (typeof AudioEngine !== 'undefined' && AudioEngine) ? String(AudioEngine.bgmStyle || 'showroom') : 'showroom';
      const ttsVoice = (typeof AudioEngine !== 'undefined' && AudioEngine) ? String(AudioEngine.ttsVoice || 'off') : 'off';
      if (bgmStyle === 'off' && ttsVoice === 'off') {
        score -= 15;
        issues.push({ ok: false, fixable: true, key: 'audio', msg: '배경음악과 성우가 모두 꺼져 있어 무음 영상이 됩니다.' });
      } else if (bgmStyle !== 'off' && !campaign.beatSyncMode && !campaign.isPhotoCollageMode) {
        score -= 8;
        issues.push({ ok: false, fixable: true, key: 'beat', msg: 'BGM 박자(BPM) 컷 싱크를 켜면 리듬감이 확 살아나요.' });
      } else {
        issues.push({ ok: true, msg: campaign.beatSyncMode ? `🎵 ${arGetActiveBgmBpm()} BPM 박자 컷 싱크 적용됨` : '사운드 구성 양호' });
      }

      // 3) 컷 전환 연속성 체크 (원테이크 모핑 추천)
      if (cuts >= 2 && !campaign.isPhotoCollageMode) {
        const trs = Array.isArray(campaign.cutTransitions) ? campaign.cutTransitions.slice(0, cuts) : [];
        const hasMorphOrTrans = trs.some((x) => x && x !== 'default' && x !== 'none');
        if (!hasMorphOrTrans) {
          score -= 7;
          issues.push({ ok: false, fixable: true, key: 'morph', msg: '컷 전환이 기본 상태예요. 원테이크 모핑 전환을 입히면 훨씬 부드러워져요.' });
        } else {
          issues.push({ ok: true, msg: '컷 전환 모션이 자연스럽게 설정됨' });
        }
      }

      // 4) 텍스트 오버레이 크기·가독성 체크
      const ovs = Array.isArray(campaign.cutOverlays) ? campaign.cutOverlays : [];
      let tinyOverlay = false;
      ovs.forEach((arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((it) => {
          if (it && it.type === 'text' && (Number(it.scale) || 1) < 0.72) tinyOverlay = true;
        });
      });
      if (tinyOverlay) {
        score -= 10;
        issues.push({ ok: false, fixable: true, key: 'overlay', msg: '직접 넣은 글자 스티커 중 크기가 너무 작은 항목이 있어요.' });
      }

      // 5) 엔딩 정보 기본값 점검
      if (!campaign.hideCardOnVideo && typeof getSelectedDealer === 'function') {
        const d = getSelectedDealer();
        if (d && (String(d.phone || '').includes('0000-0000') || String(d.name || '') === '홍길동')) {
          score -= 8;
          issues.push({ ok: false, fixable: false, msg: '엔딩 카드에 예시 정보(홍길동/0000)가 남아 있어요. [5 엔딩]에서 수정해 주세요.' });
        }
      }

      score = Math.max(45, Math.min(100, score));
      arRenderCriticBox('arReelsCriticCard', score, issues, 'arAutoFixReelsCritic');
      return { score, issues };
    }

    function arAutoFixReelsCritic() {
      if (typeof campaign === 'undefined' || !campaign) return;
      const cuts = Math.max(1, typeof getTargetCutCount === 'function' ? getTargetCutCount() : 4);
      let fixed = 0;
      // 1) 긴 자막 자연 줄바꿈 보정
      if (Array.isArray(campaign.cutCaptions)) {
        for (let i = 0; i < cuts; i++) {
          const clean = String(campaign.cutCaptions[i] || '').trim();
          if (clean.length > 24 && !clean.includes('\n')) {
            const mid = Math.floor(clean.length / 2);
            const sp = clean.indexOf(' ', Math.max(8, mid - 5));
            if (sp > 6 && sp < clean.length - 4) {
              campaign.cutCaptions[i] = clean.slice(0, sp) + '\n' + clean.slice(sp + 1);
              fixed++;
            }
          }
        }
      }
      // 2) 무음 방지 + BPM 박자 싱크 켜기
      if (typeof AudioEngine !== 'undefined' && AudioEngine && AudioEngine.bgmStyle === 'off' && AudioEngine.ttsVoice === 'off') {
        const sel = document.getElementById('bgmStyleSelect');
        if (sel) { sel.value = 'showroom'; if (typeof onAudioConfigChange === 'function') onAudioConfigChange(); }
        else AudioEngine.bgmStyle = 'showroom';
        fixed++;
      }
      if (!campaign.isPhotoCollageMode && !campaign.beatSyncMode && typeof arToggleBeatSync === 'function') {
        campaign.beatSyncMode = true;
        if (typeof syncDurationAndTimeline === 'function') syncDurationAndTimeline();
        if (typeof arSyncBeatSyncUI === 'function') arSyncBeatSyncUI();
        fixed++;
      }
      // 3) 원테이크 모핑 전환 적용
      if (cuts >= 2 && !campaign.isPhotoCollageMode) {
        const trs = Array.isArray(campaign.cutTransitions) ? campaign.cutTransitions.slice(0, cuts) : [];
        if (!trs.some((x) => x && x !== 'default' && x !== 'none') && typeof arApplyOneTakeMorphPack === 'function') {
          const seq = ['morphIris', 'morphRibbon', 'morphLiquid', 'morphDoor', 'morphOrbit'];
          campaign.cutTransitions = Array.from({ length: Math.max(10, cuts) }, (_, i) => i === 0 ? 'morphIris' : seq[i % seq.length]);
          fixed++;
        }
      }
      // 4) 작은 텍스트 오버레이 보정
      if (Array.isArray(campaign.cutOverlays)) {
        campaign.cutOverlays.forEach((arr) => {
          if (!Array.isArray(arr)) return;
          arr.forEach((it) => {
            if (it && it.type === 'text' && (Number(it.scale) || 1) < 0.72) {
              it.scale = 0.92;
              if (!it.style || it.style === 'plain') it.style = 'box';
              fixed++;
            }
          });
        });
      }
      if (window.__timelines && window.__timelines.main) {
        window.__timelines.main.seek(window.__timelines.main.currentTime || 0);
      }
      arRunReelsCritic();
      if (typeof arToast === 'function') arToast(`✨ 릴스 자동 디자인 보정 ${fixed || 1}건을 완료했어요!`, true);
    }

    // 쇼츠 화면에서 연 편집기가 맡겨 둔 영상을 받아 테마 입히기 (/studio?applyTheme=1)
    function arTakeStashedThemeVideo() {
      return new Promise((resolve) => {
        const open = indexedDB.open('ar-handoff', 1);
        open.onupgradeneeded = () => open.result.createObjectStore('files');
        open.onerror = () => resolve(null);
        open.onsuccess = () => {
          const tx = open.result.transaction('files', 'readwrite'), store = tx.objectStore('files');
          const get = store.get('themeVideo');
          get.onsuccess = () => { store.delete('themeVideo'); };
          tx.oncomplete = () => {
            open.result.close();
            const item = get.result;
            // 30분이 지난 영상은 쓰지 않음
            resolve(item && item.blob && Date.now() - item.at < 30 * 60 * 1000 ? item.blob : null);
          };
          tx.onerror = () => { open.result.close(); resolve(null); };
        };
      });
    }
    async function arResumeThemeHandoff() {
      const params = new URLSearchParams(location.search);
      if (params.get('applyTheme') !== '1') return;
      params.delete('applyTheme');
      history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
      const blob = await arTakeStashedThemeVideo();
      if (!blob) { if (typeof arToast === 'function') arToast('넘겨받은 영상이 없어요. 편집기에서 다시 눌러 주세요.'); return; }
      if (typeof dismissAutoReelsSplash === 'function') dismissAutoReelsSplash();
      try {
        await arApplyThemeToEditedVideo(new File([blob], '편집한 영상.mp4', { type: blob.type || 'video/mp4', lastModified: Date.now() }));
      } catch (e) {
        if (typeof arToast === 'function') arToast(e.message || '편집한 영상을 불러오지 못했어요.');
      }
    }
    window.addEventListener('load', () => setTimeout(arResumeThemeHandoff, 900));

    // 카마스터 프로필 사진 업로드 핸들러
    async function handleDealerAvatarUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const d = getSelectedDealer();
      if (event.target.id === 'dealerFaceQuickInput') arPauseForStudioEdit();
      await arWithPhotoImport(event.target, async () => {
        const img = await arImportPhoto(file, { maxEdge: 800 });
        if (d.avatarImg && d.avatarImg === d._customAvatar) arReleasePhoto(d.avatarImg);
        d.avatarImg = img;
        d._customAvatar = img;
        if (d.cardHide) delete d.cardHide.avatar;
        if (getSelectedDealer() === d) window.__timelines.main.seek(window.__timelines.main.currentTime);
      });
    }

    function handleCustomVideoUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const vid = document.getElementById('hiddenCustomVideo');
      if (vid._arObjectUrl) { URL.revokeObjectURL(vid._arObjectUrl); vid._arObjectUrl = null; }
      const url = URL.createObjectURL(file);
      vid._arObjectUrl = url;
      vid.src = url;
      vid.play();
      campaign.hasCustomVideo = true;
      campaign.uploadedPhotos.forEach(arReleasePhoto);
      campaign.uploadedPhotos = [];
    }

    // --- 카마스터별 스마트 자동 변주 & 랜덤 셔플 함수들 ---
    function shuffleArray(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function createShuffledVariation(excludeHook) {
      const pool = VARIATION_RECIPES.filter((r) => r.hook !== excludeHook);
      const base = pool[Math.floor(Math.random() * pool.length)] || VARIATION_RECIPES[0];
      const cutOrder = shuffleArray([0, 1, 2, 3]);
      const cameraOrder = shuffleArray(Array.from({ length: MOTION_COUNT }, (_, i) => i)).slice(0, 4);
      return {
        label: `${base.label} + 셔플 #${Math.floor(100 + Math.random() * 900)}`,
        cutOrder,
        cameraOrder,
        hook: base.hook,
        badgeTop: base.badgeTop,
        badgeBottom: base.badgeBottom,
        bullets: [...base.bullets],
        ctaKeyword: base.ctaKeyword,
        ctaBanner: base.ctaBanner
      };
    }

    function renderDealerVariationSummary() {
      const d = getSelectedDealer();
      const v = d.variation || VARIATION_RECIPES[0];
      const summaryEl = document.getElementById('dealerVariationSummary');
      if (!summaryEl) return;

      const cutSeq = (v.cutOrder || [0, 1, 2, 3]).map((idx) => CUT_NAMES[idx % 4]).join(' → ');
      const camSeq = (v.cameraOrder || [0, 1, 2, 3]).map((idx) => (CAMERA_NAMES[idx % CAMERA_NAMES.length] || '').split('(')[0]).join(' → ');

      summaryEl.innerHTML =
        `<div class="flex flex-wrap items-center justify-between gap-2 text-[#ededed] font-medium mb-1.5">` +
        `<span>${d.name} ${d.title} · <span class="text-[#a1a1a6] font-normal">${v.label}</span></span>` +
        `<span class="font-mono text-[11px] px-2 py-0.5 rounded-[6px] bg-[#232325] text-[#a1a1a6]">자동 DM 키워드: ${v.ctaKeyword || '견적'}</span>` +
        `</div>` +
        `<div class="text-[#85858b] space-y-0.5">` +
        `<div>4컷 순서: <span class="text-[#a1a1a6]">${cutSeq}</span></div>` +
        `<div>카메라 궤적: <span class="text-[#a1a1a6]">${camSeq}</span></div>` +
        `<div>오프닝 카피: <span class="text-[#a1a1a6]">"${v.hook}"</span></div>` +
        `</div>`;
    }

    function randomizeCurrentDealerVariation() {
      const d = getSelectedDealer();
      campaign.motionSeed = Math.floor(Math.random() * 9999);
      d.variation = createShuffledVariation(d.variation?.hook);
      syncPreviewPanel();
      syncTechPanel();
      window.__timelines['main'].seek(0.35);
    }

    function randomizeAllDealersVariation() {
      dealers.forEach((dlr, idx) => {
        const base = VARIATION_RECIPES[(idx + Math.floor(Math.random() * VARIATION_RECIPES.length)) % VARIATION_RECIPES.length];
        dlr.variation = {
          label: `${base.label} + 일괄셔플 #${Math.floor(100 + Math.random() * 900)}`,
          cutOrder: shuffleArray([0, 1, 2, 3]),
          cameraOrder: shuffleArray([0, 1, 2, 3]),
          hook: base.hook,
          badgeTop: base.badgeTop,
          badgeBottom: base.badgeBottom,
          bullets: [...base.bullets],
          ctaKeyword: base.ctaKeyword,
          ctaBanner: base.ctaBanner
        };
      });
      syncPreviewPanel();
      syncTechPanel();
      window.__timelines['main'].seek(0.35);
    }

    // --- UI 동기화 함수들 ---
    function buildCaption(dealer) {
      const v = dealer.variation || VARIATION_RECIPES[0];
      const activeHook = v.hook || campaign.hook;
      const activeBullets = (v.bullets && v.bullets.length > 0) ? v.bullets : campaign.bullets;
      const kw = v.ctaKeyword || '견적';
      if (IND.key !== 'auto') {
        return (
          `${campaign.vehicle} — ${activeHook}\n\n` +
          (campaign.priceLine ? `• ${campaign.priceLine}\n` : '') +
          (campaign.discount ? `• ${campaign.discount}\n` : '') +
          `${activeBullets.join('\n')}\n` +
          (dealer.promoTag && !arIsDemoPromo(dealer.promoTag) ? `• ${dealer.promoTag}\n` : '') +
          `\n──────────────────\n` +
          // 명함을 아직 안 채웠으면 빈 줄 대신 해당 줄을 뺌
          ([dealer.branch, dealer.name, dealer.title].filter(Boolean).join(' ') ? `${[dealer.branch, dealer.name, dealer.title].filter(Boolean).join(' ')}\n` : '') +
          (dealer.phone ? `문의: ${dealer.phone}\n` : '') +
          `댓글에 [${IND.cta}] 남겨주시면 바로 안내드릴게요.\n\n` +
          `${IND.hashtags.map((h) => '#' + h).join(' ')} #Shorts`
        );
      }
      return (
        `${campaign.vehicle} — ${activeHook}\n\n` +
        `• 최대 할인 혜택: -${campaign.discountNum.toLocaleString()}만 원\n` +
        `• 월 납입 조건: ${campaign.discount}\n` +
        `${activeBullets.join('\n')}\n` +
        (dealer.promoTag && !arIsDemoPromo(dealer.promoTag) ? `• 출고 고객 혜택: ${dealer.promoTag}\n\n` : '\n') +
        `──────────────────\n` +
        `담당: ${dealer.branch} ${dealer.name} ${dealer.title}\n` +
        `직통 상담: ${dealer.phone}\n` +
        `댓글에 [${kw}] 남겨주시거나 프로필 링크로 문의하시면 1:1 조건표를 DM으로 보내드립니다.\n\n` +
        `#신차견적 #즉시출고 #자동차프로모션 #장기렌트 #리스견적 #카마스터 #Shorts`
      );
    }

    // =========================================================================
    // ★ 밈 쇼츠 팩토리 · 컷별 1:1 상황 일치 모션 씬 · 노래방 싱크 자막 · 외국어 자막 덮어쓰기
    // =========================================================================
    window.__arKaraokeMode = false;
    window.__arSafeZoneGuide = false;
    window.__arMemeHookBanner = '';
    window.__arCaptionCoverMask = { enabled: false, maskY: 0.81, maskH: 0.13 };
    window.__arMemeRadarItems = [];
    window.__arMemeCat = 'all';

    // 밈 캐릭터·컷별 상황(대사·감정·포즈)을 1:1로 그리는 60fps 실시간 모션 스테이지
    function arDrawMemeCharacterStage(ctx, W, H, t, cutIdx, cutProg, memeItem, cutObj) {
      const sc = W / 540;
      const charType = String(memeItem?.characterType || 'chill_dog');
      const line = String(cutObj?.line || '').trim();
      const mood = String(cutObj?.mood || `CUT 0${cutIdx + 1}`);
      const hasAiImg = Boolean(cutObj && cutObj._aiSceneImg && cutObj._aiSceneImg.complete && cutObj._aiSceneImg.naturalWidth > 0);
      const hasCustomVid = Boolean(cutObj && cutObj._customCutVideo && cutObj._customCutVideo.readyState >= 2);
      const hasStoreImg = Boolean(cutObj && cutObj._storeImg && cutObj._storeImg.complete && cutObj._storeImg.naturalWidth > 0);

      // 1) 만약 이 컷에 AI 1:1 생성 이미지나 원본 업로드 비디오, 또는 우리 가게 실사가 있으면 그 비주얼을 줌/패닝 모션으로 먼저 풀스크린 렌더링
      if (hasCustomVid || hasAiImg || hasStoreImg) {
        const srcMedia = hasCustomVid ? cutObj._customCutVideo : (hasAiImg ? cutObj._aiSceneImg : cutObj._storeImg);
        const sw = srcMedia.videoWidth || srcMedia.naturalWidth || W;
        const sh = srcMedia.videoHeight || srcMedia.naturalHeight || H;
        const zoom = hasCustomVid ? 1.0 : (1.04 + cutProg * 0.08);
        const panX = hasCustomVid ? 0 : Math.sin(cutIdx * 1.7 + cutProg * Math.PI) * 14 * sc;
        const panY = hasCustomVid ? 0 : Math.cos(cutIdx * 1.3 + cutProg * Math.PI) * 10 * sc;
        const r = Math.max(W / sw, H / sh) * zoom;
        ctx.save();
        ctx.drawImage(srcMedia, (W - sw * r) / 2 + panX, (H - sh * r) / 2 + panY, sw * r, sh * r);
        // 상하단 가독성 시네마 비네팅
        const vig = ctx.createLinearGradient(0, 0, 0, H);
        vig.addColorStop(0, 'rgba(6, 8, 15, 0.58)');
        vig.addColorStop(0.25, 'rgba(6, 8, 15, 0.06)');
        vig.addColorStop(0.62, 'rgba(6, 8, 15, 0.14)');
        vig.addColorStop(1, 'rgba(6, 8, 15, 0.82)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        if (hasCustomVid || hasAiImg) return;
      } else {
        // 컷마다 분위기가 확 바뀌는 시네마틱 스튜디오 배경
        const palettes = [
          ['#0f172a', '#1e293b', '#38bdf8'],
          ['#1a1423', '#2d1e3e', '#f472b6'],
          ['#14211d', '#1c332c', '#4ade80'],
          ['#231815', '#3b231d', '#fb923c'],
          ['#111827', '#1f2937', '#facc15'],
          ['#17152b', '#28234a', '#a78bfa']
        ];
        const pal = palettes[cutIdx % palettes.length];
        const bg = ctx.createRadialGradient(W * 0.5, H * 0.40, 20 * sc, W * 0.5, H * 0.45, H * 0.72);
        bg.addColorStop(0, pal[1]);
        bg.addColorStop(1, pal[0]);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // 스포트라이트 링 & 리듬 파티클
        ctx.save();
        ctx.strokeStyle = pal[2];
        ctx.globalAlpha = 0.16;
        ctx.lineWidth = 2 * sc;
        for (let r = 1; r <= 3; r++) {
          ctx.beginPath();
          ctx.arc(W * 0.5, H * 0.41, (75 * r + Math.sin(t * 3 + r) * 8) * sc, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2) 컷별 대사·상황에 맞춘 60fps 애니메이션 밈 캐릭터 & 상황 소품 스테이지 (우리 가게 실사 위에는 우하단 리액션 캐릭터로 합성!)
      const isCornerReaction = hasStoreImg && !hasAiImg && !hasCustomVid;
      const cx = isCornerReaction ? W * 0.78 : W * 0.5;
      const cy = isCornerReaction ? H * 0.54 : H * 0.41;
      const scale = (isCornerReaction ? 0.58 : 1.0) * sc * (0.94 + Math.min(1, cutProg * 4) * 0.08);
      const bobY = Math.sin(t * 5.2) * 7 * sc;
      const tilt = Math.sin(t * 3.4 + cutIdx) * 0.05;

      ctx.save();
      ctx.translate(cx, cy + bobY);
      ctx.rotate(tilt);
      ctx.scale(scale, scale);

      // 캐릭터 바닥 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath();
      ctx.ellipse(0, 148, 86, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      const isCat = /cat|고양이|하\?|생선|도둑/.test(charType + ' ' + (memeItem?.title || '') + ' ' + line);
      const isGolden = /golden|리트리버|강아지|댕댕|인형|현관|guilty_puppy/.test(charType + ' ' + (memeItem?.title || '')) && !/칠 가이|chill/i.test(memeItem?.title || '');

      if (isCat) {
        // 🐱 통통 고양이("하? Huh?" / 생선 도둑 고양이) — 컷별 표정(황당 갸우뚱 / 동공지진 / 뻔뻔) 애니메이션
        const isOrange = /생선|도둑|thief/.test(charType + ' ' + (memeItem?.title || ''));
        const furCol = isOrange ? '#f59e0b' : '#f8fafc';
        const patchCol = isOrange ? '#d97706' : '#94a3b8';
        const headTilt = (cutIdx % 2 === 1 ? 0.22 : -0.14) * Math.sin(t * 4.5 + 1);

        // 통통한 몸통
        ctx.fillStyle = furCol;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 75, 78, 68, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 머리 (갸우뚱 모션)
        ctx.save();
        ctx.translate(0, -18);
        ctx.rotate(headTilt);

        // 귀 2개
        [[-52, -48, -22, -72, -8, -42], [52, -48, 22, -72, 8, -42]].forEach((pts) => {
          ctx.fillStyle = furCol;
          ctx.beginPath();
          ctx.moveTo(pts[0], pts[1]);
          ctx.lineTo(pts[2], pts[3]);
          ctx.lineTo(pts[4], pts[5]);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });

        // 얼굴 원
        ctx.fillStyle = furCol;
        ctx.beginPath();
        ctx.ellipse(0, 0, 68, 58, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 얼룩 무늬
        ctx.fillStyle = patchCol;
        ctx.beginPath();
        ctx.ellipse(-28, -32, 22, 14, -0.3, 0, Math.PI * 2);
        ctx.ellipse(30, -30, 18, 12, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 눈 (컷 감정에 따라 황당 반달눈 vs 동공지진 큰 눈)
        const wideEyes = /충격|현행범|동공|놀란|0\.1초/.test(mood + ' ' + line);
        [-24, 24].forEach((ex) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex, -4, wideEyes ? 16 : 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(ex + Math.sin(t * 8) * 2, -4, wideEyes ? 9 : 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex - 3, -8, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // 코 & "하?(Huh?)" 벌어진 입
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(0, 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#be123c';
        ctx.beginPath();
        ctx.ellipse(0, 25, 10, 7 + Math.abs(Math.sin(t * 6)) * 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 컷별 말풍선 이펙트 ("하??", "?!", "두근")
        ctx.fillStyle = '#facc15';
        ctx.font = '900 28px "Pretendard Variable", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cutIdx === 2 ? '하?? (Huh?)' : (wideEyes ? '?!' : '갸우뚱?'), 82, -75);
      } else if (isGolden) {
        // 🐶 골든리트리버 / 눈치 백단 강아지 (인형 물기 / 프로펠러 꼬리 / 물개 눈웃음)
        const wag = Math.sin(t * 22) * 28;
        // 헬리콥터 꼬리
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(55, 85);
        ctx.quadraticCurveTo(105, 40 + wag, 118, 10 + wag);
        ctx.stroke();
        ctx.restore();

        // 몸통
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 72, 70, 64, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 머리 & 접힌 귀
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(-56, -8, 18, 36, 0.35, 0, Math.PI * 2);
        ctx.ellipse(56, -8, 18, 36, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fcd34d';
        ctx.beginPath();
        ctx.ellipse(0, -16, 60, 52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 눈웃음 vs 초롱초롱 눈
        const isSmileEyes = /눈웃음|꼬리|안아|미소/.test(line + ' ' + mood);
        [-22, 22].forEach((ex) => {
          if (isSmileEyes) {
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(ex, -18, 11, Math.PI * 1.1, Math.PI * 1.9);
            ctx.stroke();
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(ex, -18, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex - 3, -21, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // 코 & 입에 문 애착 인형
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        if (/인형|기다|현관|도어락/.test(line + ' ' + (memeItem?.title || ''))) {
          ctx.fillStyle = '#a855f7';
          drawRoundedRect(ctx, -28, 12, 56, 26, 12);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🧸애착인형', 0, 29);
        }
      } else {
        // 🐕 칠 가이(Chill Guy) 스타일 — 회색 스웨터 + 롤업 청바지 + 빨간 운동화 + 주머니에 손 넣고 평온한 미소!
        // 빨간 운동화
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;
        drawRoundedRect(ctx, -50, 125, 38, 22, 10);
        ctx.fill(); ctx.stroke();
        drawRoundedRect(ctx, 12, 125, 38, 22, 10);
        ctx.fill(); ctx.stroke();

        // 청바지
        ctx.fillStyle = '#3b82f6';
        drawRoundedRect(ctx, -40, 74, 34, 56, 8);
        ctx.fill(); ctx.stroke();
        drawRoundedRect(ctx, 6, 74, 34, 56, 8);
        ctx.fill(); ctx.stroke();

        // 회색 스웨터 (주머니에 손 넣은 포즈)
        ctx.fillStyle = '#9ca3af';
        drawRoundedRect(ctx, -54, -4, 108, 86, 26);
        ctx.fill(); ctx.stroke();

        // 주머니에 꽂은 양팔
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-48, 16); ctx.quadraticCurveTo(-64, 48, -32, 68);
        ctx.moveTo(48, 16);  ctx.quadraticCurveTo(64, 48, 32, 68);
        ctx.stroke();

        // 갈색 강아지 머리 & 주둥이 (Chill Guy 시그니처)
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(0, -48, 48, 44, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // 옆으로 뻗은 주둥이(Snout)
        ctx.beginPath();
        ctx.ellipse(26, -42, 34, 24, 0.08, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // 처진 귀
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.ellipse(-34, -52, 14, 28, 0.25, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // 까만 코
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(54, -46, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // 반쯤 감긴 평온한 칠 가이 눈
        [-8, 14].forEach((ex) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(ex, -58, 9, 10, 0, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(ex + 2, -57, 4, 0, Math.PI * 2);
          ctx.fill();
          // 느긋한 눈꺼풀
          ctx.fillStyle = '#b45309';
          ctx.fillRect(ex - 9, -68, 18, 9);
          ctx.beginPath();
          ctx.moveTo(ex - 9, -59); ctx.lineTo(ex + 9, -59);
          ctx.stroke();
        });

        // 칠 가이 특유의 평온한 한쪽 입꼬리 미소
        ctx.beginPath();
        ctx.arc(24, -34, 14, 0.15, Math.PI * 0.75);
        ctx.stroke();

        // 컷별 대사 소품 (출근길 커피 / 텅 빈 잔고 0원 / 따봉)
        if (/출근|커피|아메리카노|카페/.test(line)) {
          ctx.fillStyle = '#ffffff';
          drawRoundedRect(ctx, 56, 12, 28, 38, 6);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#78350f';
          ctx.fillRect(59, 20, 22, 24);
        } else if (/통장|잔고|0원|비어도/.test(line)) {
          ctx.fillStyle = '#fef08a';
          ctx.font = '900 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('잔고 0원 (평온~)', 0, -108);
        }
      }
      ctx.restore();

      // 3) 현재 컷 상황·감정 뱃지 & 1:1 장면 설명 캡슐 (시청자가 지금 몇 컷째 어떤 장면인지 즉시 인지)
      ctx.save();
      const pillTxt = `CUT 0${cutIdx + 1} · ${mood}`;
      ctx.font = `800 ${Math.round(13 * sc)}px "Pretendard Variable", sans-serif`;
      const pw = ctx.measureText(pillTxt).width + 28 * sc;
      const px = (W - pw) / 2;
      const py = H * 0.165;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      drawRoundedRect(ctx, px, py, pw, 28 * sc, 14 * sc);
      ctx.fill();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.55)';
      ctx.lineWidth = 1.5 * sc;
      ctx.stroke();
      ctx.fillStyle = '#93c5fd';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pillTxt, W / 2, py + 14 * sc);
      ctx.restore();
    }

    function arRenderMemeShortsOverlay(ctx, W, H, t, mainDuration) {
      const sc = W / 540;
      const isMemeMode = document.body.classList.contains('ar-meme-mode') && Boolean(window.__arCurrentMemeItem);
      const nCuts = Math.max(1, (campaign.ttsLines && campaign.ttsLines.length) || 6);
      const cutDur = Math.max(0.2, mainDuration / nCuts);
      const cIdx = Math.min(nCuts - 1, Math.max(0, Math.floor(t / cutDur)));
      const cProg = Math.min(0.999, Math.max(0, (t - cIdx * cutDur) / cutDur));

      // ★ 밈 쇼츠 모드일 때는 무관한 배경이나 이중 자막 박스 대신, 해당 컷 대사와 1:1로 맞물리는 밈 스테이지가 화면 전체를 책임집니다!
      if (isMemeMode) {
        const memeItem = window.__arCurrentMemeItem;
        const cutObj = (memeItem.cuts && memeItem.cuts[cIdx]) || { line: campaign.ttsLines?.[cIdx] || '', mood: `컷 ${cIdx + 1}` };
        arDrawMemeCharacterStage(ctx, W, H, t, cIdx, cProg, memeItem, cutObj);
      }

      // 1) 상단 고정 후킹 제목 배너 (해외·밈 영상 리메이크용)
      const hookBanner = String(window.__arMemeHookBanner || '').trim();
      if (hookBanner) {
        ctx.save();
        const fs = Math.round(23 * sc);
        ctx.font = `900 ${fs}px "Pretendard Variable", sans-serif`;
        const maxW = W * 0.88;
        const words = hookBanner.split(/\s+/);
        const lines = [];
        let cur = '';
        for (const w of words) {
          const next = cur ? `${cur} ${w}` : w;
          if (cur && ctx.measureText(next).width > maxW - 36 * sc) { lines.push(cur); cur = w; }
          else cur = next;
        }
        if (cur) lines.push(cur);
        const showLines = lines.slice(0, 2);
        const lh = Math.round(fs * 1.28);
        const boxH = showLines.length * lh + Math.round(24 * sc);
        const boxW = Math.min(W * 0.92, Math.max(...showLines.map((l) => ctx.measureText(l).width)) + Math.round(44 * sc));
        const bx = (W - boxW) / 2;
        const by = Math.round(H * 0.055);
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = Math.round(16 * sc);
        ctx.fillStyle = 'rgba(13, 14, 18, 0.94)';
        drawRoundedRect(ctx, bx, by, boxW, boxH, Math.round(14 * sc));
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = Math.max(2, 2.5 * sc);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fef08a';
        showLines.forEach((ln, idx) => {
          ctx.fillText(ln, W / 2, by + Math.round(14 * sc) + idx * lh + lh / 2 - 2);
        });
        ctx.restore();
      }

      // 2) 외국어 자막 덮어쓰기 마스크 + 노래방식 단어별 싱크 자막
      const mask = window.__arCaptionCoverMask || {};
      const showMask = Boolean(mask.enabled);
      const showKaraoke = Boolean(window.__arKaraokeMode || showMask || isMemeMode);
      if (showMask || showKaraoke) {
        const rawLine = String((campaign.ttsLines && campaign.ttsLines[cIdx]) || (window.__arCurrentMemeItem?.cuts?.[cIdx]?.line) || '').replace(/\s+/g, ' ').trim();
        const centerY = H * (showMask ? (Number(mask.maskY) || 0.81) : 0.74);
        const maskH = H * (Number(mask.maskH) || 0.13);

        ctx.save();
        if (showMask) {
          const mw = W * 0.94;
          const mx = (W - mw) / 2;
          const my = centerY - maskH / 2;
          ctx.fillStyle = 'rgba(10, 11, 15, 0.95)';
          drawRoundedRect(ctx, mx, my, mw, maskH, Math.round(16 * sc));
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.16)';
          ctx.lineWidth = Math.max(1, 1.5 * sc);
          ctx.stroke();
        }

        if (rawLine) {
          const tokens = rawLine.split(' ').filter(Boolean);
          const activeWordIdx = Math.min(tokens.length - 1, Math.floor(cProg * tokens.length));
          const kFs = Math.round(25 * sc);
          ctx.font = `900 ${kFs}px "Pretendard Variable", sans-serif`;
          const maxLineW = W * 0.84;
          const rows = [];
          let curRow = [];
          let curW = 0;
          const spaceW = ctx.measureText(' ').width;
          tokens.forEach((tok, ti) => {
            const tw = ctx.measureText(tok).width;
            if (curRow.length && curW + spaceW + tw > maxLineW) {
              rows.push(curRow);
              curRow = [{ tok, ti, tw }];
              curW = tw;
            } else {
              curRow.push({ tok, ti, tw });
              curW += (curRow.length > 1 ? spaceW : 0) + tw;
            }
          });
          if (curRow.length) rows.push(curRow);
          const displayRows = rows.slice(0, 2);
          const rowLH = Math.round(kFs * 1.42);
          const startY = centerY - ((displayRows.length - 1) * rowLH) / 2;

          if (!showMask) {
            const widest = Math.max(...displayRows.map((r) => r.reduce((acc, it) => acc + it.tw, 0) + (r.length - 1) * spaceW));
            const bgW = Math.min(W * 0.92, widest + Math.round(38 * sc));
            const bgH = displayRows.length * rowLH + Math.round(20 * sc);
            ctx.fillStyle = 'rgba(10, 11, 15, 0.84)';
            drawRoundedRect(ctx, (W - bgW) / 2, centerY - bgH / 2, bgW, bgH, Math.round(14 * sc));
            ctx.fill();
          }

          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left';
          displayRows.forEach((r, ri) => {
            const totalW = r.reduce((acc, it) => acc + it.tw, 0) + (r.length - 1) * spaceW;
            let xCursor = (W - totalW) / 2;
            const yPos = startY + ri * rowLH;
            r.forEach((it) => {
              const isAct = it.ti === activeWordIdx;
              const isPast = it.ti < activeWordIdx;
              if (isAct) {
                const padX = Math.round(7 * sc);
                const padY = Math.round(4 * sc);
                ctx.fillStyle = '#facc15';
                drawRoundedRect(ctx, xCursor - padX, yPos - kFs / 2 - padY, it.tw + padX * 2, kFs + padY * 2, Math.round(7 * sc));
                ctx.fill();
                ctx.fillStyle = '#09090b';
                ctx.fillText(it.tok, xCursor, yPos + 1);
              } else {
                ctx.lineWidth = Math.max(3, Math.round(4 * sc));
                ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                ctx.strokeText(it.tok, xCursor, yPos + 1);
                ctx.fillStyle = isPast ? '#fef08a' : '#ffffff';
                ctx.fillText(it.tok, xCursor, yPos + 1);
              }
              xCursor += it.tw + spaceW;
            });
          });
        }
        ctx.restore();
      }

      // 3) 모바일 쇼츠·릴스 UI 가림 세이프존 가이드 (미리보기 전용, 내보내기 MP4에는 절대 안 찍힘)
      if (window.__arSafeZoneGuide && !window.__exportingVideo) {
        ctx.save();
        const rx = W * 0.84, ry = H * 0.43, rw = W * 0.14, rh = H * 0.39;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        drawRoundedRect(ctx, rx, ry, rw, rh, 12 * sc);
        ctx.fill();
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
        ctx.setLineDash([5 * sc, 4 * sc]);
        ctx.lineWidth = 1.5 * sc;
        ctx.stroke();
        ctx.font = `700 ${Math.round(11 * sc)}px "Pretendard Variable", sans-serif`;
        ctx.fillStyle = '#fecaca';
        ctx.textAlign = 'center';
        ['♥ 좋아요', '💬 댓글', '↗ 공유', '🎵 음원'].forEach((lbl, i) => {
          ctx.fillText(lbl, rx + rw / 2, ry + (i + 0.6) * (rh / 4));
        });
        const bx = W * 0.04, by = H * 0.83, bw = W * 0.78, bh = H * 0.13;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.20)';
        drawRoundedRect(ctx, bx, by, bw, bh, 10 * sc);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fecaca';
        ctx.textAlign = 'left';
        ctx.fillText('⚠️ 쇼츠·릴스 하단 채널명·제목 가림 구역 (자막 금지)', bx + 12 * sc, by + bh / 2);
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.75)';
        ctx.strokeRect(W * 0.05, H * 0.12, W * 0.77, H * 0.69);
        ctx.fillStyle = '#4ade80';
        ctx.fillText('✓ SAFE ZONE (자막 안전 영역)', W * 0.07, H * 0.145);
        ctx.restore();
      }
    }

    function arToggleKaraokeMode(forceVal) {
      window.__arKaraokeMode = typeof forceVal === 'boolean' ? forceVal : !window.__arKaraokeMode;
      const btn = document.getElementById('arKaraokeToggleBtn');
      if (btn) {
        btn.textContent = window.__arKaraokeMode ? '🎤 노래방 자막 ON' : '🎤 노래방 자막 OFF';
        btn.className = window.__arKaraokeMode
          ? 'px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2563eb] text-white border border-[#60a5fa] cursor-pointer'
          : 'px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1e2028] text-[#a1a1aa] border border-white/15 cursor-pointer';
      }
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(window.__timelines.main.currentTime || 0.35);
    }

    function arToggleSafeZoneGuide(forceVal) {
      window.__arSafeZoneGuide = typeof forceVal === 'boolean' ? forceVal : !window.__arSafeZoneGuide;
      const btn = document.getElementById('arSafeZoneToggleBtn');
      if (btn) {
        btn.textContent = window.__arSafeZoneGuide ? '📱 UI 가이드 ON' : '📱 UI 가림 가이드';
        btn.className = window.__arSafeZoneGuide
          ? 'px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#16a34a] text-white border border-[#4ade80] cursor-pointer'
          : 'px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1e2028] text-[#a1a1aa] border border-white/15 cursor-pointer';
      }
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(window.__timelines.main.currentTime || 0.35);
    }

    function arSwitchMemeTab(tab) {
      const isRemake = tab === 'remake';
      document.getElementById('arMemePane_radar')?.classList.toggle('hidden', isRemake);
      document.getElementById('arMemePane_remake')?.classList.toggle('hidden', !isRemake);
      const bRadar = document.getElementById('arMemeTabBtn_radar');
      const bRemake = document.getElementById('arMemeTabBtn_remake');
      if (bRadar) bRadar.className = !isRemake ? 'h-8 rounded-[7px] text-[12px] font-bold bg-[#2563eb] text-white cursor-pointer' : 'h-8 rounded-[7px] text-[12px] font-semibold text-[#a1a1aa] hover:text-white cursor-pointer';
      if (bRemake) bRemake.className = isRemake ? 'h-8 rounded-[7px] text-[12px] font-bold bg-[#2563eb] text-white cursor-pointer' : 'h-8 rounded-[7px] text-[12px] font-semibold text-[#a1a1aa] hover:text-white cursor-pointer';
    }

    window.__arMemeMashupMode = 'pure'; // 'pure' | 'keyword' | 'store'
    window.__arCurrentMemeItem = null;
    window.__arMemeAiGenToken = 0;

    function arSyncMemeKeywordAndStoreInputs() {
      const chipRow = document.getElementById('arMemeIssueChipRow');
      if (chipRow) {
        const domKeywords = Array.from(document.querySelectorAll('#dailyKeywords .daily-keyword-list button, #dailyKeywords .daily-keyword-chip'))
          .map((el) => String(el.textContent || '').replace(/^#/, '').trim())
          .filter(Boolean);
        const defaults = ['블랙프라이데이 특가', '첫눈·영하 한파', '연말 모임·회식', '월요병 출근길', '점심 메뉴 고민', '다이어트 작심삼일'];
        const merged = Array.from(new Set([...domKeywords, ...defaults])).slice(0, 8);
        const inp = document.getElementById('arMemeIssueCustomInput');
        if (inp && !inp.value && merged[0]) inp.value = merged[0];
        chipRow.innerHTML = merged.map((kw) => {
          const safe = kw.replace(/'/g, "\\'");
          return `<button type="button" onclick="document.getElementById('arMemeIssueCustomInput').value='${safe}';arHighlightMemeIssueChip(this);" class="px-2.5 py-1 rounded-full bg-[#2563eb]/20 hover:bg-[#2563eb] border border-[#60a5fa]/40 text-[11px] text-[#dbeafe] whitespace-nowrap shrink-0 cursor-pointer">#${kw}</button>`;
        }).join('');
      }
      const sNameEl = document.getElementById('arMemeStoreNameInput');
      const sPointEl = document.getElementById('arMemeStorePointInput');
      const d = typeof getSelectedDealer === 'function' ? getSelectedDealer() : null;
      const indName = (typeof IND !== 'undefined' && IND && IND.name) ? IND.name : '우리 매장';
      if (sNameEl && !sNameEl.value) {
        sNameEl.value = (d && (d.branch || d.name)) ? `${d.branch || d.name}` : `우리 ${indName}`;
      }
      if (sPointEl && !sPointEl.value) {
        sPointEl.value = (campaign && campaign.vehicle) ? `${campaign.vehicle}` : `${indName} 시그니처 메뉴·특가 혜택`;
      }
    }

    function arHighlightMemeIssueChip(btn) {
      if (!btn || !btn.parentElement) return;
      Array.from(btn.parentElement.children).forEach((c) => {
        c.className = c === btn
          ? 'px-2.5 py-1 rounded-full bg-[#2563eb] border border-[#60a5fa] text-[11px] text-white font-bold whitespace-nowrap shrink-0 cursor-pointer'
          : 'px-2.5 py-1 rounded-full bg-[#2563eb]/20 hover:bg-[#2563eb] border border-[#60a5fa]/40 text-[11px] text-[#dbeafe] whitespace-nowrap shrink-0 cursor-pointer';
      });
    }

    function arSetMemeMashupMode(mode) {
      window.__arMemeMashupMode = ['pure', 'keyword', 'store'].includes(mode) ? mode : 'pure';
      ['pure', 'keyword', 'store'].forEach((m) => {
        const b = document.getElementById(`arMemeModeBtn_${m}`);
        if (!b) return;
        const on = m === window.__arMemeMashupMode;
        b.className = on
          ? 'h-9 px-2 rounded-[8px] text-[11.5px] font-bold bg-[#2563eb] text-white border border-[#60a5fa] cursor-pointer'
          : 'h-9 px-2 rounded-[8px] text-[11.5px] font-semibold bg-[#181a24] text-[#d4d4d8] border border-white/10 hover:text-white cursor-pointer';
      });
      document.getElementById('arMemeKeywordMashupBox')?.classList.toggle('hidden', window.__arMemeMashupMode !== 'keyword');
      document.getElementById('arMemeStoreMashupBox')?.classList.toggle('hidden', window.__arMemeMashupMode !== 'store');
      const badge = document.getElementById('arMemeMashupModeBadge');
      if (badge) {
        badge.textContent = window.__arMemeMashupMode === 'store'
          ? '🏪 선택한 밈을 우리 가게 B급 홍보 쇼츠로 자동 패러디합니다'
          : window.__arMemeMashupMode === 'keyword'
            ? '⚡ 선택한 밈을 오늘의 실시간 키워드·이슈와 결합합니다'
            : '🔥 유행 밈 해설·유머 쇼츠를 각 컷 대사와 1:1 일치하는 장면으로 조립합니다';
      }
      arSyncMemeKeywordAndStoreInputs();
    }

    function arOpenMemeShortsStudio() {
      document.body.classList.add('ar-meme-mode');
      if (typeof arShowStudioServices === 'function') arShowStudioServices(false);
      if (typeof arSetupSheetMode === 'function') arSetupSheetMode();
      if (typeof switchStudioTab === 'function') switchStudioTab('topic', true);
      if (typeof window.arNavPush === 'function') window.arNavPush({ mode: 'reels', tab: 'topic' });
      else try { history.pushState({ ...history.state, arReelsWorkspace: true }, ''); } catch (_) {}
      if (typeof arToggleSheet === 'function') arToggleSheet(false);
      const hTitle = document.getElementById('previewDealerHeader');
      if (hTitle) hTitle.textContent = '⚡ 밈 쇼츠 스튜디오';
      const eTitle = document.getElementById('easyStepTitle');
      if (eTitle) eTitle.textContent = '오늘의 밈 Top 10 · 키워드 · 가게 패러디';
      const box = document.getElementById('arMemeShortsBox');
      if (box) box.classList.remove('hidden');
      const wf = document.getElementById('studioWorkflowColumn');
      if (wf) wf.scrollTop = 0;
      arSyncMemeKeywordAndStoreInputs();
      arToggleKaraokeMode(true);
      if (!window.__arMemeRadarItems || !window.__arMemeRadarItems.length) {
        arLoadMemeRadar('all', false);
      } else if (!window.__arCurrentMemeItem && window.__arMemeRadarItems[0]) {
        arApplyMemeItemToStudio(0, window.__arMemeMashupMode || 'pure');
      }
    }

    async function arLoadMemeRadar(cat = 'all', force = false, customQuery = '') {
      window.__arMemeCat = cat || 'all';
      document.querySelectorAll('#arMemePane_radar [data-meme-cat]').forEach((b) => {
        const on = b.dataset.memeCat === window.__arMemeCat;
        b.className = on
          ? 'px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white text-[#111113] shrink-0 cursor-pointer'
          : 'px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/8 text-[#d4d4d8] shrink-0 cursor-pointer';
      });
      const statusEl = document.getElementById('arMemeRadarStatus');
      const listEl = document.getElementById('arMemeRadarList');
      if (!listEl) return;
      if (statusEl) statusEl.textContent = customQuery ? `"${customQuery}" 맞춤 6컷 고속 밈 쇼츠 설계 중...` : 'YouTube · Google Trends 기반 오늘의 밈 Top 10 수집 중...';

      try {
        const res = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'meme-radar', category: window.__arMemeCat, query: customQuery, refresh: force })
        });
        const data = await res.json().catch(() => ({}));
        if (data && Array.isArray(data.items) && data.items.length) {
          window.__arMemeRadarItems = data.items;
        }
      } catch (_) {}

      const items = window.__arMemeRadarItems || [];
      if (statusEl) {
        statusEl.textContent = items.length
          ? `🔥 오늘의 밈·트렌드 Top ${items.length} (각 컷 대사와 1:1 일치하는 밈 캐릭터 모션 & AI 맞춤 씬 자동 조립)`
          : '밈 목록을 불러오지 못했습니다. 실시간 수집을 눌러 주세요.';
      }
      listEl.innerHTML = items.map((it, idx) => {
        const summaryHtml = Array.isArray(it.summary3) && it.summary3.length
          ? `<div class="rounded-[8px] bg-black/30 border border-white/5 p-2 space-y-0.5 text-[11px] text-[#d4d4d8]">${it.summary3.map((s) => `<div>${s}</div>`).join('')}</div>`
          : `<p class="text-[11.5px] text-[#a1a1aa] leading-relaxed">${it.why || ''}</p>`;
        const cutsHtml = (it.cuts || []).slice(0, 6).map((c, ci) =>
          `<div class="flex items-center justify-between gap-1 text-[10.5px] bg-white/[0.03] rounded px-2 py-0.5"><span class="text-[#e4e4e7] truncate"><b class="text-[#60a5fa]">${ci + 1}컷</b> ${c.line}</span><span class="text-[#9ca3af] shrink-0">[${c.mediaType || '1:1 씬'}]</span></div>`
        ).join('');
        const ytUrl = it.ytSearchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(it.title + ' 쇼츠')}`;
        return `
          <div class="rounded-[12px] bg-[#181b26] hover:bg-[#1d2130] border border-white/12 p-3 space-y-2 transition">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-md bg-[#2563eb] text-white text-[10.5px] font-extrabold">TOP ${it.rank || (idx + 1)}</span>
                <span class="px-2 py-0.5 rounded-md bg-[#2563eb]/20 border border-[#60a5fa]/40 text-[#93c5fd] text-[10.5px] font-bold">${it.badge || it.cat || '🔥 인기 밈'}</span>
                <span class="text-[10px] text-[#9ca3af]">${it.sourceTag || '트렌드 레이더'}</span>
              </div>
              <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" class="px-2 py-0.5 rounded-md bg-[#ef4444]/20 hover:bg-[#ef4444]/35 border border-[#f87171]/40 text-[#fca5a5] text-[10.5px] font-bold">▶️ 실제 밈 원본 영상 보기 ↗</a>
            </div>
            <div class="text-[13.5px] font-extrabold text-white leading-snug">${it.title}</div>
            ${summaryHtml}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-0.5">${cutsHtml}</div>
            <div class="text-[10.5px] text-[#9ca3af] truncate">${it.factNote || ''}</div>
            <div class="grid grid-cols-3 gap-1.5 pt-1">
              <button type="button" onclick="arApplyMemeItemToStudio(${idx}, 'pure')" class="h-8 px-2 rounded-[8px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-bold cursor-pointer">🔥 원본 밈 조립</button>
              <button type="button" onclick="arApplyMemeItemToStudio(${idx}, 'keyword')" class="h-8 px-2 rounded-[8px] bg-[#1e293b] hover:bg-[#334155] border border-[#60a5fa]/45 text-[#93c5fd] text-[11px] font-bold cursor-pointer">⚡ 오늘 키워드×밈</button>
              <button type="button" onclick="arApplyMemeItemToStudio(${idx}, 'store')" class="h-8 px-2 rounded-[8px] bg-[#14291e] hover:bg-[#1b3829] border border-[#4ade80]/45 text-[#4ade80] text-[11px] font-bold cursor-pointer">🏪 우리 가게×밈</button>
            </div>
          </div>
        `;
      }).join('');

      if (!window.__arCurrentMemeItem && items[0] && document.body.classList.contains('ar-meme-mode')) {
        arApplyMemeItemToStudio(0, window.__arMemeMashupMode || 'pure');
      }
    }

    function arSearchCustomMeme() {
      const inp = document.getElementById('arMemeSearchInput');
      const q = String(inp?.value || '').trim();
      arLoadMemeRadar('all', true, q);
    }

    // 각 컷의 1:1 캐릭터 모션 스테이지를 정적 스냅샷으로도 뽑아 컷 편집/썸네일 스트립에 동기화
    function arCreateMemeCutSnapshotImage(memeItem, cutObj, cutIdx) {
      const off = document.createElement('canvas');
      off.width = 270;
      off.height = 480;
      const octx = off.getContext('2d');
      arDrawMemeCharacterStage(octx, 270, 480, cutIdx * 2.0 + 0.5, cutIdx, 0.5, memeItem, cutObj);
      const dataUrl = off.toDataURL('image/jpeg', 0.84);
      const im = new Image();
      im.src = dataUrl;
      im._dataUrl = dataUrl;
      im._label = `${cutIdx + 1}컷 · ${cutObj?.mediaType || '1:1 밈 씬'}`;
      return im;
    }

    async function arApplyMemeItemToStudio(idx, forceMashupMode) {
      const baseItem = (window.__arMemeRadarItems || [])[idx];
      if (!baseItem) return;
      const mode = forceMashupMode || window.__arMemeMashupMode || 'pure';
      if (forceMashupMode && forceMashupMode !== window.__arMemeMashupMode) {
        arSetMemeMashupMode(forceMashupMode);
      }

      const statusEl = document.getElementById('arMemeRadarStatus');
      let it = JSON.parse(JSON.stringify(baseItem));

      if (mode === 'keyword' || mode === 'store') {
        const issueKw = String(document.getElementById('arMemeIssueCustomInput')?.value || '오늘의 실시간 이슈').trim();
        const indName = (typeof IND !== 'undefined' && IND && IND.name) ? IND.name : '우리 매장';
        const storeName = String(document.getElementById('arMemeStoreNameInput')?.value || indName).trim();
        const productPoint = String(document.getElementById('arMemeStorePointInput')?.value || '시그니처 혜택').trim();
        if (statusEl) {
          statusEl.textContent = mode === 'store'
            ? `🏪 "${baseItem.title.slice(0, 16)}..." 밈을 [${storeName} · ${productPoint}] 홍보 쇼츠로 패러디 조립 중...`
            : `⚡ "${baseItem.title.slice(0, 16)}..." 밈과 오늘의 키워드 [${issueKw}] 콜라보 쇼츠 조립 중...`;
        }
        try {
          const res = await fetch('/api/generate-script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'meme-mashup',
              meme: baseItem,
              mashupType: mode,
              issueKeyword: issueKw,
              industryLabel: indName,
              storeName,
              productPoint
            })
          });
          const data = await res.json().catch(() => ({}));
          if (data && data.ok && data.item) it = data.item;
        } catch (_) {}
      }

      window.__arCurrentMemeItem = it;
      const cuts = Array.isArray(it.cuts) && it.cuts.length ? it.cuts : [];
      const lines = cuts.map((c) => String(c.line || '').trim()).filter(Boolean);
      if (!lines.length) return;

      // 우리 가게×밈 모드일 때는 매장 실사 사진(2, 3, 5컷)에 밈 리액션 캐릭터가 함께 합성되도록 연결
      const indKey = (typeof IND !== 'undefined' && IND && IND.key) ? IND.key : 'cafe';
      if (mode === 'store') {
        await Promise.all(cuts.map((c, ci) => new Promise((resolve) => {
          if (!c.useStorePhoto && ci !== 1 && ci !== 2) { resolve(); return; }
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => { c._storeImg = im; resolve(); };
          im.onerror = () => resolve();
          im.src = `/assets/scenes/${indKey}/${(ci % 8) + 1}.jpg`;
        })));
      }

      if (typeof pauseAllCutVideos === 'function') pauseAllCutVideos();
      // 각 컷의 대사와 1:1로 일치하는 밈 모션 씬 스냅샷을 6컷 슬롯에 장착
      campaign.uploadedPhotos = cuts.slice(0, 6).map((c, i) => arCreateMemeCutSnapshotImage(it, c, i));
      campaign.vehicle = it.title.slice(0, 26);
      campaign.hook = it.title;
      campaign.cutCaptions = lines.slice();
      campaign.ttsLines = lines.slice();
      campaign.bullets = [it.why || '', it.factNote || ''].filter(Boolean);
      window.__arMemeHookBanner = (Array.isArray(it.hookTitles) && it.hookTitles[0]) ? it.hookTitles[0] : it.title.slice(0, 32);
      arToggleKaraokeMode(true);

      campaign.scenePlan = lines.map((ln, i) => ({
        cut: i + 1,
        duration: 2.0,
        photoIdx: i,
        sub: ln,
        badge: cuts[i]?.mediaType || it.badge || `CUT 0${i + 1}`,
        effect: 'none'
      }));
      if (typeof setVideoTotalDuration === 'function') setVideoTotalDuration(12);

      const capEl = document.getElementById('snsCaptionInput');
      if (capEl) {
        capEl.value = `${it.title}\n\n${it.why || ''}\n\n${it.factNote || ''}\n#쇼츠 #밈 #트렌드 #Shorts`;
      }

      arRenderMemeAssembledStrip(it);
      if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
      if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
      if (typeof syncPreviewPanel === 'function') syncPreviewPanel();

      isPlaying = true;
      const ppBtn = document.getElementById('playPauseBtn');
      if (ppBtn) ppBtn.textContent = '⏸ 일시정지';
      if (typeof updatePlayPauseUI === 'function') updatePlayPauseUI();
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(0.05);

      const modeLabel = mode === 'store' ? '🏪 우리 가게×밈 패러디' : mode === 'keyword' ? '⚡ 오늘 키워드×밈 콜라보' : '🔥 원본 밈';
      if (statusEl) statusEl.textContent = `✅ [${modeLabel}] "${it.title}" 6컷 1:1 상황 일치 모션 씬 조립 완료! (더 리얼한 실사/3D 씬이 필요하면 [✨ 6컷 AI 1:1 맞춤 씬 생성]을 눌러 주세요)`;
      if (typeof arToast === 'function') arToast(`🎬 ${modeLabel} 6컷 1:1 밈 쇼츠가 재생됩니다!`, true);
    }

    function arRenderMemeAssembledStrip(it) {
      const box = document.getElementById('arMemeAssembledBox');
      const strip = document.getElementById('arMemeCutVisualStrip');
      const titleEl = document.getElementById('arMemeAssembledTitle');
      if (!box || !strip || !it) return;
      box.classList.remove('hidden');
      const ytUrl = it.ytSearchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(it.title + ' 쇼츠')}`;
      if (titleEl) {
        titleEl.innerHTML = `🎬 컷별 대사 1:1 매칭 장면 (${it.title.slice(0, 18)}) <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" class="ml-1.5 underline text-[#fca5a5] text-[11px]">▶️ 유튜브 원본 밈 참고 ↗</a>`;
      }
      strip.innerHTML = (it.cuts || []).slice(0, 6).map((c, idx) => {
        const snap = campaign.uploadedPhotos[idx];
        const thumbSrc = (c._aiSceneImg && c._aiSceneImg.src) || (snap && (snap._dataUrl || snap.src)) || '';
        const statusBadge = c._generatingAi
          ? '⏳ AI 생성중'
          : (c._customCutVideo ? '🎬 원본 영상' : (c._aiSceneImg ? '✨ AI 1:1 씬' : '🎭 1:1 모션'));
        return `
          <div class="rounded-[9px] bg-[#161924] border border-white/12 p-2 flex items-center gap-2">
            <button type="button" onclick="if(window.__timelines&&window.__timelines.main)window.__timelines.main.seek(${idx * 2.0 + 0.2});" class="relative w-11 h-16 rounded-[6px] overflow-hidden shrink-0 border border-[#60a5fa]/40 bg-black cursor-pointer">
              ${thumbSrc ? `<img src="${thumbSrc}" class="w-full h-full object-cover block" alt="" />` : ''}
              <span class="absolute bottom-0 inset-x-0 bg-[#2563eb]/90 text-[8px] text-white font-bold text-center py-0.5">${statusBadge}</span>
            </button>
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center justify-between gap-1">
                <span class="text-[10.5px] font-bold text-[#60a5fa]">${idx + 1}컷 · ${c.mood || '1:1 씬'}</span>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="arSwapSingleMemeCutVideo(${idx})" class="px-1.5 py-0.5 rounded bg-[#2563eb]/25 hover:bg-[#2563eb] text-[9.5px] text-[#93c5fd] hover:text-white cursor-pointer" title="이 컷의 대사·상황을 그리는 AI 1:1 맞춤 씬 생성">✨ AI 씬</button>
                  <label class="px-1.5 py-0.5 rounded bg-white/8 hover:bg-white/15 text-[9.5px] text-[#d4d4d8] cursor-pointer" title="이 컷만 내 영상(MP4) 또는 짤 이미지로 교체">
                    📁
                    <input type="file" accept="video/*,image/*" class="hidden" onchange="arUploadSingleMemeCutMedia(${idx}, event)" />
                  </label>
                </div>
              </div>
              <div class="text-[11px] text-white font-medium truncate">${c.line || ''}</div>
              <div class="text-[9.5px] text-[#9ca3af] truncate">${c.mediaType || '대사 1:1 매칭'}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 개별 컷을 내 MP4 영상이나 짤 이미지로 직접 교체
    async function arUploadSingleMemeCutMedia(cutIdx, ev) {
      const file = ev?.target?.files?.[0];
      if (ev?.target) ev.target.value = '';
      const it = window.__arCurrentMemeItem;
      if (!file || !it || !Array.isArray(it.cuts) || !it.cuts[cutIdx]) return;
      const c = it.cuts[cutIdx];
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        const vid = document.createElement('video');
        vid.src = url;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid._isVideo = true;
        await new Promise((r) => { vid.onloadeddata = r; vid.onerror = r; setTimeout(r, 3000); });
        vid.play().catch(() => {});
        c._customCutVideo = vid;
        c.mediaType = '내 영상 클립';
        campaign.uploadedPhotos[cutIdx] = vid;
      } else {
        const dataUrl = await new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.readAsDataURL(file);
        });
        const im = new Image();
        im.src = dataUrl;
        im._dataUrl = dataUrl;
        await im.decode().catch(() => {});
        c._aiSceneImg = im;
        c.mediaType = '직접 올린 짤';
        campaign.uploadedPhotos[cutIdx] = im;
      }
      arRenderMemeAssembledStrip(it);
      if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(cutIdx * 2.0 + 0.15);
      if (typeof arToast === 'function') arToast(`✅ ${cutIdx + 1}번 컷 비주얼을 교체했어요!`, true);
    }

    // 개별 컷의 대사(c.line)와 scenePrompt에 1:1로 일치하는 AI 맞춤 이미지를 즉시 생성 (KIE z-image)
    async function arSwapSingleMemeCutVideo(cutIdx) {
      const it = window.__arCurrentMemeItem;
      if (!it || !Array.isArray(it.cuts) || !it.cuts[cutIdx]) return;
      const c = it.cuts[cutIdx];
      c._generatingAi = true;
      arRenderMemeAssembledStrip(it);
      const statusEl = document.getElementById('arMemeRadarStatus');
      if (statusEl) statusEl.textContent = `⏳ ${cutIdx + 1}번 컷 ("${c.line}") 1:1 맞춤 AI 씬을 생성하고 있습니다...`;

      try {
        const promptText = c.scenePrompt || `Vertical 9:16 expressive meme scene directly depicting: ${c.line} (${it.title}), clean wordless photography`;
        const res = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'scene-image',
            imagePrompt: promptText,
            index: cutIdx,
            aspectRatio: '9:16',
            industry: (typeof IND !== 'undefined' && IND && IND.key) ? IND.key : 'cafe'
          })
        });
        const data = await res.json().catch(() => ({}));
        c._generatingAi = false;
        if (data && data.ok && data.image && data.image.dataUrl) {
          const compactUrl = typeof arDownscaleSceneDataUrl === 'function'
            ? await arDownscaleSceneDataUrl(data.image.dataUrl)
            : data.image.dataUrl;
          const im = new Image();
          im.src = compactUrl;
          im._dataUrl = compactUrl;
          im._label = `${cutIdx + 1}컷 · AI 1:1 씬`;
          await im.decode().catch(() => {});
          c._aiSceneImg = im;
          c.mediaType = '✨ AI 1:1 씬';
          campaign.uploadedPhotos[cutIdx] = im;
          arRenderMemeAssembledStrip(it);
          if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
          if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(cutIdx * 2.0 + 0.15);
          if (statusEl) statusEl.textContent = `✅ ${cutIdx + 1}번 컷 ("${c.line}") AI 1:1 맞춤 씬 생성 완료!`;
          if (typeof arToast === 'function') arToast(`✨ ${cutIdx + 1}번 컷 AI 1:1 맞춤 씬이 적용되었어요!`, true);
          return true;
        }
      } catch (_) {}
      c._generatingAi = false;
      arRenderMemeAssembledStrip(it);
      if (statusEl) statusEl.textContent = `💡 현재 KIE 이미지 생성 한도 또는 로그인 상태를 확인해 주세요. (1:1 모션 캐릭터 스테이지가 유지됩니다)`;
      return false;
    }

    // 6컷 전체를 각 컷의 대사·밈 캐릭터(scenePrompt)에 맞춰 1:1 AI 씬으로 일괄 생성
    async function arFetchLiveVisualsForCurrentMeme() {
      const it = window.__arCurrentMemeItem;
      if (!it || !Array.isArray(it.cuts)) return;
      const statusEl = document.getElementById('arMemeRadarStatus');
      if (statusEl) statusEl.textContent = `⏳ "${it.title}" 6개 컷 각각의 대사에 1:1로 맞춘 AI 씬을 생성하고 있습니다...`;
      if (typeof arToast === 'function') arToast('✨ 6개 컷 대사에 1:1로 맞춘 AI 씬 생성을 시작합니다!', true);

      const cuts = it.cuts.slice(0, 6);
      let okCount = 0;
      // 서버 부하 방지를 위해 2개씩 병렬 생성
      for (let i = 0; i < cuts.length; i += 2) {
        const batch = [i, i + 1].filter((idx) => idx < cuts.length);
        const results = await Promise.all(batch.map((idx) => arSwapSingleMemeCutVideo(idx)));
        okCount += results.filter(Boolean).length;
      }
      if (okCount > 0) {
        if (statusEl) statusEl.textContent = `✅ 총 ${okCount}/6컷을 대사와 1:1로 일치하는 AI 맞춤 씬으로 생성 완료했습니다!`;
        if (typeof arToast === 'function') arToast(`✨ ${okCount}개 컷 AI 1:1 맞춤 씬 생성 완료!`, true);
      }
    }

    function arSetMemeHookBanner(txt) {
      window.__arMemeHookBanner = String(txt || '').trim();
      const inp = document.getElementById('arForeignCustomHookInput');
      if (inp && inp.value !== window.__arMemeHookBanner) inp.value = window.__arMemeHookBanner;
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(window.__timelines.main.currentTime || 0.35);
    }

    function arUpdateCaptionMaskSpec() {
      const en = Boolean(document.getElementById('arCaptionMaskToggle')?.checked);
      const y = Number(document.getElementById('arCaptionMaskY')?.value) || 0.81;
      const h = Number(document.getElementById('arCaptionMaskH')?.value) || 0.13;
      window.__arCaptionCoverMask = { enabled: en, maskY: y, maskH: h };
      const lbl = document.getElementById('arCaptionMaskPosLabel');
      if (lbl) lbl.textContent = en ? `위치 ${Math.round(y * 100)}% · 높이 ${Math.round(h * 100)}%` : '마스크 꺼짐';
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(window.__timelines.main.currentTime || 0.35);
    }

    async function arHandleForeignRemakeVideo(ev) {
      const file = ev?.target?.files?.[0];
      if (ev?.target) ev.target.value = '';
      if (!file) return;
      const statusEl = document.getElementById('arForeignRemakeStatus');
      if (statusEl) statusEl.textContent = '⏳ 원본 영상 6구간 프레임 추출 및 타임스탬프별 장면·외국어 자막 AI 분석 중 (약 3~5초)...';

      try {
        const blobUrl = URL.createObjectURL(file);
        const vid = document.createElement('video');
        vid.src = blobUrl;
        vid.muted = true;
        vid.playsInline = true;
        vid.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          vid.onloadedmetadata = resolve;
          vid.onerror = reject;
          setTimeout(resolve, 4000);
        });
        const dur = Math.max(6, Math.min(60, Math.round(Number(vid.duration) || 12)));

        // ★ 핵심: 단일 원본 영상을 6개 타임스탬프 구간으로 균등 분할해 각 구간의 실제 프레임을 캡처!
        const frames = [];
        const cv = document.createElement('canvas');
        cv.width = 270;
        cv.height = 480;
        const cctx = cv.getContext('2d');
        for (let i = 0; i < 6; i++) {
          const seekT = Math.min(dur - 0.1, (dur * (i + 0.5)) / 6);
          vid.currentTime = seekT;
          await new Promise((r) => { vid.onseeked = r; setTimeout(r, 450); });
          cctx.drawImage(vid, 0, 0, cv.width, cv.height);
          frames.push(cv.toDataURL('image/jpeg', 0.68));
        }

        // ★ 하나의 일관된 원본 영상이 1컷~6컷 전체에서 끊김 없이 타임라인과 1:1 동기화되어 재생되도록 _continuousVideo 활성화!
        vid._isVideo = true;
        vid._continuousVideo = true;
        vid._trimStart = 0;
        vid._trimEnd = dur;
        vid._playRate = 1;
        vid._keepAudio = false;
        vid.loop = true;
        vid.muted = true;
        try { await vid.play(); vid.pause(); } catch (_) {}

        const res = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'foreign-remake', frames, duration: dur })
        });
        const data = await res.json().catch(() => ({}));
        const cues = Array.isArray(data.cues) && data.cues.length ? data.cues : [];
        const koLines = cues.map((c) => String(c.ko || '').trim()).filter(Boolean);
        const hooks = Array.isArray(data.hookTitles) && data.hookTitles.length ? data.hookTitles : ['끝까지 보면 터지는 레전드 반전 😂'];

        const cutCount = Math.max(4, koLines.length || 6);
        const finalLines = koLines.length ? koLines : [
          '처음엔 평범한 상황인 줄 알았는데',
          '잠시 뒤 예상치 못한 일이 벌어집니다',
          '바로 이 순간 분위기가 완전히 반전되죠!',
          '이 표정 하나에 댓글창이 뒤집혔습니다',
          '다시 봐도 타이밍이 진짜 예술이네요',
          '여러분이라면 어떻게 하실 건가요?'
        ];

        // 밈 모드의 캐릭터 오버레이에서도 이 원본 비디오가 1~6컷 각 시간 구간에 그대로 보이도록 세팅
        window.__arCurrentMemeItem = {
          id: 'foreign_remake_' + Date.now(),
          title: hooks[0],
          badge: '🌏 원본 영상 6구간 리메이크',
          why: data.detectedLang || '원본 영상 6구간 타임스탬프 동기화',
          factNote: data.sourceNote || '',
          cuts: finalLines.map((ln, idx) => ({
            line: ln,
            mood: `${Math.round((idx * dur) / finalLines.length)}~${Math.round(((idx + 1) * dur) / finalLines.length)}초 구간`,
            mediaType: '원본 영상 구간',
            _customCutVideo: vid
          }))
        };

        campaign.uploadedPhotos = Array.from({ length: cutCount }, () => vid);
        campaign.cutCaptions = finalLines.slice();
        campaign.ttsLines = finalLines.slice();
        campaign.hook = hooks[0];
        campaign.vehicle = hooks[0].slice(0, 24);
        campaign.scenePlan = finalLines.map((ln, idx) => ({
          cut: idx + 1,
          duration: +(dur / finalLines.length).toFixed(1),
          photoIdx: idx,
          sub: ln,
          badge: `CUT 0${idx + 1}`,
          effect: 'none'
        }));
        if (typeof setVideoTotalDuration === 'function') setVideoTotalDuration(dur);

        const mSpec = data.maskSpec || { enabled: true, maskY: 0.81, maskH: 0.13 };
        const mToggle = document.getElementById('arCaptionMaskToggle');
        const mY = document.getElementById('arCaptionMaskY');
        const mH = document.getElementById('arCaptionMaskH');
        if (mToggle) mToggle.checked = mSpec.enabled !== false;
        if (mY) mY.value = String(mSpec.maskY || 0.81);
        if (mH) mH.value = String(mSpec.maskH || 0.13);
        arUpdateCaptionMaskSpec();
        arSetMemeHookBanner(hooks[0]);
        arToggleKaraokeMode(true);

        const chipBox = document.getElementById('arForeignHookChips');
        if (chipBox) {
          chipBox.innerHTML = hooks.map((h) => {
            const safeH = String(h).replace(/'/g, "\\'").replace(/"/g, '&quot;');
            return `<button type="button" onclick="arSetMemeHookBanner('${safeH}')" class="px-2.5 py-1 rounded-full bg-[#2563eb]/25 hover:bg-[#2563eb] border border-[#60a5fa]/40 text-[11px] text-[#dbeafe] whitespace-nowrap shrink-0 cursor-pointer">${h}</button>`;
          }).join('');
        }

        const capEl = document.getElementById('snsCaptionInput');
        if (capEl && data.sourceNote) capEl.value = `${hooks[0]}\n\n${data.sourceNote}`;

        if (statusEl) {
          statusEl.textContent = `✅ ${data.detectedLang || '원본 영상 6구간 분석'} 완료 · 하나의 원본 영상 타임스탬프(${finalLines.length}구간)와 한국어 자막이 1:1 동기화되었습니다!`;
        }
        arRenderMemeAssembledStrip(window.__arCurrentMemeItem);
        if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
        if (typeof syncPreviewPanel === 'function') syncPreviewPanel();
        isPlaying = true;
        if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(0.1);
        if (typeof arToast === 'function') arToast('🌏 원본 영상 6구간 타임스탬프 & 한국어 자막 덮어쓰기가 완료되었어요!', true);
      } catch (err) {
        if (statusEl) statusEl.textContent = '⚠️ 영상 분석 중 오류가 발생했습니다. 다른 MP4 파일로 다시 시도해 주세요.';
      }
    }

    window.arRenderMemeShortsOverlay = arRenderMemeShortsOverlay;
    window.arOpenMemeShortsStudio = arOpenMemeShortsStudio;
    window.arSetMemeMashupMode = arSetMemeMashupMode;
    window.arHighlightMemeIssueChip = arHighlightMemeIssueChip;
    window.arFetchLiveVisualsForCurrentMeme = arFetchLiveVisualsForCurrentMeme;
    window.arSwapSingleMemeCutVideo = arSwapSingleMemeCutVideo;
    window.arUploadSingleMemeCutMedia = arUploadSingleMemeCutMedia;
    window.arSwitchMemeTab = arSwitchMemeTab;
    window.arToggleKaraokeMode = arToggleKaraokeMode;
    window.arToggleSafeZoneGuide = arToggleSafeZoneGuide;
    window.arLoadMemeRadar = arLoadMemeRadar;
    window.arSearchCustomMeme = arSearchCustomMeme;
    window.arApplyMemeItemToStudio = arApplyMemeItemToStudio;
    window.arSetMemeHookBanner = arSetMemeHookBanner;
    window.arUpdateCaptionMaskSpec = arUpdateCaptionMaskSpec;
    window.arHandleForeignRemakeVideo = arHandleForeignRemakeVideo;
