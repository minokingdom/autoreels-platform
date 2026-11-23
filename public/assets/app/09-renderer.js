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
          const cutN = Math.max(1, (campaign.uploadedPhotos || []).length);
          const perCut = Number(campaign._collageCutSec) || 10;
          const mainD = Math.max(2, +(cutN * perCut).toFixed(2));
          const outroD = campaign.hideCardOnVideo ? 0 : 3.2;
          if (typeof OUTRO_DURATION !== 'undefined') OUTRO_DURATION = outroD;
          if (typeof BASE_DURATION !== 'undefined') BASE_DURATION = +(mainD + outroD).toFixed(2);
          if (typeof CUT_LENGTHS !== 'undefined') CUT_LENGTHS = Array.from({ length: cutN }, () => perCut);
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
    const AR_COLLAGE_MAX_PHOTOS = 18;
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
      if (hintEl) hintEl.classList.toggle('hidden', n > 0);
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
      if (typeof jumpSlideIdx === 'number' && jumpSlideIdx >= 0) _arCollageState.previewIdx = jumpSlideIdx;
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
      document.getElementById('arPhotoCollageModal')?.classList.add('hidden');
    }
    async function arCollageHandleFiles(ev) {
      const files = Array.from(ev?.target?.files || []);
      if (ev?.target) ev.target.value = '';
      if (!files.length) return;
      const newUploaded = [];
      for (const f of files) {
        if (_arCollageState.photos.length >= AR_COLLAGE_MAX_PHOTOS) break;
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
          _arCollageState.photos.push({ id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), img: im, src: dataUrl, fromVault: false });
          newUploaded.push(im);
        } catch (_) {}
      }
      if (newUploaded.length && typeof window.arVaultSaveImages === 'function') {
        window.arVaultSaveImages(newUploaded, 'upload');
      }
      arCollageAutoMatchCount();
      arCollageRefreshUI();
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
          outImgs.push(im);
        }
        (campaign.uploadedPhotos || []).forEach(arReleasePhoto);
        campaign.uploadedPhotos = outImgs;
        campaign.isUserCustomPhotos = true;
        campaign.isPhotoCollageMode = true;
        campaign._collageCutSec = _arCollageState.cutSec;
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
        if (typeof isPlaying !== 'undefined') isPlaying = true;
        if (typeof openPresetDrawer === 'function') openPresetDrawer('right');
        if (typeof arToast === 'function') arToast('콜라주 완성! 테마·노래를 고르고 [✏️ 텍스트·스티커 넣기]로 꾸며 보세요.', true);
      } catch (e) {
        if (typeof arToast === 'function') arToast('콜라주를 만들지 못했어요. 다른 사진으로 다시 시도해 주세요.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✨ 콜라주 완성 · 테마 입히기 →'; }
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

    const AR_CN_TEMPLATES = [
      { id: 'bakery_curation', name: '베이커리 큐레이션', bg: '#f8f3eb', card: '#efe5d6', fg: '#2c1f16', muted: '#756254', accent: '#c2603f', pillBg: '#2c1f16', pillFg: '#f8f3eb', fontTitle: "'Gowun Batang', 'Hahmlet', serif", fontBody: "'Pretendard', sans-serif", style: 'editorial', coverLayout: 'photo_top', bodyLayout: 'photo_top', samplePhoto: '/assets/landing/ed-cafe.jpg', scenePack: 'cafe', sampleTitle: '성수동 카페\n추천 베스트 5' },
      { id: 'magazine_hero', name: '매거진 풀포토', bg: '#161514', card: '#242220', fg: '#ffffff', muted: '#d6d3d1', accent: '#f59e0b', pillBg: '#f59e0b', pillFg: '#141210', fontTitle: "'Hahmlet', 'Gowun Batang', serif", fontBody: "'Pretendard', sans-serif", style: 'editorial', coverLayout: 'photo_full', bodyLayout: 'photo_full', samplePhoto: '/assets/landing/ed-interior.jpg', scenePack: 'interior', sampleTitle: '공간이 달라지는\n조명 배치 법칙' },
      { id: 'polaroid_diary', name: '폴라로이드 기록', bg: '#f4efe6', card: '#e9e0d2', fg: '#2b241e', muted: '#78685a', accent: '#b45309', pillBg: '#ffffff', pillFg: '#2b241e', fontTitle: "'Gowun Batang', serif", fontBody: "'Pretendard', sans-serif", style: 'soft', coverLayout: 'photo_polaroid', bodyLayout: 'photo_polaroid', samplePhoto: '/assets/landing/ed-dining.jpg', scenePack: 'restaurant', sampleTitle: '주말에 가기 좋은\n숨은 맛집 기록' },
      { id: 'beauty_arch', name: '뷰티 아치 화보', bg: '#fff6f4', card: '#ffe8e3', fg: '#24171a', muted: '#7a575c', accent: '#be185d', pillBg: '#fce7f3', pillFg: '#9d174d', fontTitle: "'Hahmlet', 'Cafe24Ssurround', serif", fontBody: "'Pretendard', sans-serif", style: 'editorial', coverLayout: 'photo_arch', bodyLayout: 'photo_arch', samplePhoto: '/assets/landing/ed-beauty.jpg', scenePack: 'beauty', sampleTitle: '아침 5분 완성\n광채 스킨 루틴' },
      { id: 'nike_editorial', name: '나이키 볼드 밴드', bg: '#111111', card: '#1c1c1e', fg: '#ffffff', muted: '#a1a1aa', accent: '#f97316', pillBg: '#f97316', pillFg: '#111111', fontTitle: "'GmarketSans', 'Paperlogy', sans-serif", fontBody: "'Pretendard', sans-serif", style: 'dark', coverLayout: 'photo_band', bodyLayout: 'photo_band', samplePhoto: '/assets/scenes/fitness/1.jpg', scenePack: 'fitness', sampleTitle: '체지방 태우는\n핵심 루틴 5가지' },
      { id: 'apple_clean', name: '애플 클린 액자', bg: '#fbfbfd', card: '#f0f1f5', fg: '#1d1d1f', muted: '#6e6e73', accent: '#0071e3', pillBg: '#e8f2ff', pillFg: '#005bb5', fontTitle: "'Pretendard', sans-serif", fontBody: "'Pretendard', sans-serif", style: 'clean', coverLayout: 'photo_frame', bodyLayout: 'photo_frame', samplePhoto: '/assets/landing/ed-auto.jpg', scenePack: 'auto', sampleTitle: '실패 없는 선택\n핵심 체크리스트' },
      { id: 'busan_magazine', name: '로컬 매거진', bg: '#f4f1ea', card: '#e8e2d5', fg: '#141414', muted: '#57534e', accent: '#1d4ed8', pillBg: '#1d4ed8', pillFg: '#ffffff', fontTitle: "'Paperlogy', 'GmarketSans', sans-serif", fontBody: "'Pretendard', sans-serif", style: 'editorial', coverLayout: 'photo_bottom', bodyLayout: 'photo_bottom', samplePhoto: '/assets/scenes/realestate/1.jpg', scenePack: 'realestate', sampleTitle: '지금 주목해야 할\n로컬 핫플레이스' },
      { id: 'dark_insight', name: '다크 비즈니스', bg: '#0d0f14', card: '#181c26', fg: '#f8fafc', muted: '#94a3b8', accent: '#facc15', pillBg: '#facc15', pillFg: '#0f172a', fontTitle: "'Paperlogy', 'GmarketSans', sans-serif", fontBody: "'Pretendard', sans-serif", style: 'news', coverLayout: 'photo_bottom', bodyLayout: 'photo_top', samplePhoto: '/assets/landing/hero-cinema-kv.jpg', scenePack: 'clinic', sampleTitle: '매출 2배 만드는\n핵심 전략 정리' }
    ];
    const _arCnState = {
      templateId: 'bakery_curation',
      customColors: { bg: '', accent: '', fg: '' },
      fontFamily: '',     // '' = 템플릿 기본, 또는 상업적 무료 폰트
      ratio: '4:5',       // '4:5' (1080x1350) | '1:1' (1080x1080)
      fontScale: 'md',    // 'sm' | 'md' | 'lg'
      targetCount: 7,     // 5..10
      handle: '',
      designGuide: '',    // 디자인 MD 가이드 텍스트
      tweaks: { showPageNum: true, showProgress: true, showDots: true, showHandle: true, showHighlight: true },
      activeIdx: 0,
      slides: [],         // [{ role, kicker, title, body, highlight, bgImg, isUserPhoto, photoLayout }]
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
      const bg = (useCustom && _arCnState.customColors.bg) || base.bg;
      const accent = (useCustom && _arCnState.customColors.accent) || base.accent;
      const fg = (useCustom && _arCnState.customColors.fg) || base.fg;
      const dark = arCnIsDarkHex(bg);
      const muted = (useCustom && _arCnState.customColors.fg) ? fg : (dark ? 'rgba(248,250,252,0.74)' : base.muted);
      const card = (useCustom && _arCnState.customColors.bg) ? (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.055)') : base.card;
      const pillBg = (useCustom && _arCnState.customColors.accent) ? accent : base.pillBg;
      const pillFg = (useCustom && _arCnState.customColors.accent) ? (arCnIsDarkHex(accent) ? '#ffffff' : '#111113') : base.pillFg;
      const fontTitle = (useCustom && _arCnState.fontFamily) || base.fontTitle;
      const fontBody = base.fontBody;
      return { ...base, bg, accent, fg, muted, card, pillBg, pillFg, fontTitle, fontBody, dark };
    }
    function arCnSlideSampleUrl(tpl, slideIdx) {
      if (slideIdx === 0 && tpl.samplePhoto) return tpl.samplePhoto;
      const pack = tpl.scenePack || 'cafe';
      const num = ((slideIdx) % 9) + 1;
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
      const tw = overrideTpl ? { showPageNum: true, showProgress: true, showDots: true, showHandle: false, showHighlight: true } : (_arCnState.tweaks || {});
      const fsMul = overrideTpl ? 1.0 : (_arCnState.fontScale === 'sm' ? 0.88 : (_arCnState.fontScale === 'lg' ? 1.12 : 1.0));
      const hasPhoto = Boolean(slide && slide.bgImg && slide.bgImg.naturalWidth);
      const wantLayout = (slide && slide.photoLayout) || (slideIdx === 0 ? tpl.coverLayout : tpl.bodyLayout) || 'photo_top';
      const pLayout = (hasPhoto && wantLayout !== 'text_only') ? wantLayout : 'text_only';
      const isFullPhoto = pLayout === 'photo_full';
      const fg = isFullPhoto ? '#ffffff' : tpl.fg;
      const muted = isFullPhoto ? 'rgba(255,255,255,0.86)' : tpl.muted;
      const accent = isFullPhoto ? (arCnIsDarkHex(tpl.accent) ? '#facc15' : tpl.accent) : tpl.accent;
      const isCover = slideIdx === 0 || (slide && slide.role === 'cover');
      const isCta = slideIdx === totalSlides - 1 || (slide && slide.role === 'cta');
      const padX = Math.round(84 * sc);
      const padY = Math.round(78 * sc);

      ctx.save();
      // 1) 배경 (템플릿 컬러 + 풀사진 또는 에디토리얼 프레임)
      ctx.fillStyle = tpl.bg;
      ctx.fillRect(0, 0, W, H);
      if (isFullPhoto) {
        arCollageDrawCover(ctx, slide.bgImg, 0, 0, W, H, 0, null);
        const scrim = ctx.createLinearGradient(0, 0, 0, H);
        scrim.addColorStop(0, 'rgba(8,10,16,0.34)');
        scrim.addColorStop(0.42, 'rgba(8,10,16,0.28)');
        scrim.addColorStop(0.72, 'rgba(8,10,16,0.72)');
        scrim.addColorStop(1, 'rgba(8,10,16,0.88)');
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
        ctx.fillStyle = isFullPhoto ? 'rgba(255,255,255,0.24)' : tpl.card;
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
        ctx.fillStyle = isFullPhoto ? 'rgba(255,255,255,0.22)' : tpl.pillBg;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padX, headerY - kh / 2, kw, kh, kh / 2);
        else ctx.rect(padX, headerY - kh / 2, kw, kh);
        ctx.fill();
        ctx.fillStyle = isFullPhoto ? '#ffffff' : tpl.pillFg;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(kickerTxt, padX + Math.round(18 * sc), headerY + 1);
      }
      if (tw.showPageNum !== false) {
        const pageTxt = `${String(slideIdx + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
        ctx.font = `700 ${Math.round(25 * sc)}px 'Pretendard', monospace`;
        ctx.fillStyle = muted;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(pageTxt, W - padX, headerY);
      }

      const maxTextW = W - padX * 2;
      const titleStr = String((slide && slide.title) || '').trim();
      const bodyStr = String((slide && slide.body) || '').trim();
      const hlStr = tw.showHighlight !== false ? String((slide && slide.highlight) || '').trim() : '';

      // 3) 8종 시각 사진·텍스트 레이아웃 분기
      let curY = Math.round(170 * sc);
      let skipBottomHl = false;

      if (pLayout === 'photo_top') {
        const photoY = Math.round(146 * sc);
        const photoH = Math.round(H * 0.43);
        arCollageDrawCover(ctx, slide.bgImg, padX, photoY, maxTextW, photoH, Math.round(22 * sc), null);
        curY = photoY + photoH + Math.round(42 * sc);
        const titleFs = Math.round(54 * sc * fsMul);
        const bodyFs = Math.round(33 * sc * fsMul);
        ctx.font = `800 ${titleFs}px ${tpl.fontTitle}`;
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
        const titleFs = Math.round(52 * sc * fsMul);
        const bodyFs = Math.round(32 * sc * fsMul);
        ctx.font = `800 ${titleFs}px ${tpl.fontTitle}`;
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
        const titleFs = Math.round(52 * sc * fsMul);
        const bodyFs = Math.round(32 * sc * fsMul);
        ctx.font = `800 ${titleFs}px ${tpl.fontTitle}`;
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
        const titleFs = Math.round(62 * sc * fsMul);
        curY = Math.round(156 * sc);
        ctx.font = `800 ${titleFs}px ${tpl.fontTitle}`;
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
        const titleFs = Math.round(54 * sc * fsMul);
        const bodyFs = Math.round(33 * sc * fsMul);
        curY = Math.round(158 * sc);
        ctx.font = `800 ${titleFs}px ${tpl.fontTitle}`;
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
        const titleFs = Math.round(56 * sc * fsMul);
        const bodyFs = Math.round(33 * sc * fsMul);
        curY = Math.round(156 * sc);
        ctx.fillStyle = accent;
        ctx.fillRect(padX, curY - Math.round(16 * sc), Math.round(64 * sc), Math.max(2, Math.round(6 * sc)));
        ctx.font = `800 ${titleFs}px ${tpl.fontTitle}`;
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
      } else {
        // 풀배경 사진형 (photo_full) 또는 순수 타이포형 (text_only)
        if (!isCover && !isCta && !isFullPhoto) {
          ctx.save();
          ctx.font = `900 ${Math.round(200 * sc)}px ${tpl.fontTitle}`;
          ctx.fillStyle = tpl.fg;
          ctx.globalAlpha = 0.055;
          ctx.textAlign = 'right'; ctx.textBaseline = 'top';
          ctx.fillText(String(slideIdx).padStart(2, '0'), W - padX + Math.round(8 * sc), Math.round(145 * sc));
          ctx.restore();
        }
        const titleFs = Math.round((isCover ? 78 : (isCta ? 66 : 64)) * sc * fsMul);
        const bodyFs = Math.round((isCover ? 36 : 38) * sc * fsMul);
        ctx.font = `800 ${titleFs}px ${tpl.fontTitle}`;
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

        ctx.font = `800 ${titleFs}px ${tpl.fontTitle}`;
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
      const footY = H - Math.round(70 * sc);
      const handleTxt = tw.showHandle !== false ? String(_arCnState.handle || '').trim() : '';
      if (handleTxt) {
        ctx.font = `600 ${Math.round(24 * sc)}px ${tpl.fontBody}`;
        ctx.fillStyle = muted;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(handleTxt.startsWith('@') ? handleTxt : `@${handleTxt}`, padX, footY);
      }
      if (tw.showDots !== false) {
        const dotR = Math.max(2, Math.round(5.5 * sc));
        const dotGap = Math.round(20 * sc);
        const startDotX = W - padX - (totalSlides - 1) * dotGap;
        for (let i = 0; i < totalSlides; i++) {
          const active = i === slideIdx;
          ctx.fillStyle = active ? accent : (isFullPhoto ? 'rgba(255,255,255,0.38)' : muted);
          ctx.globalAlpha = active ? 1 : 0.35;
          ctx.beginPath();
          ctx.arc(startDotX + i * dotGap, footY, active ? dotR * 1.35 : dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
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
        if (typeof saved.fontFamily === 'string') _arCnState.fontFamily = saved.fontFamily;
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
          fontFamily: _arCnState.fontFamily,
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
    function arCnRenderTemplateGallery() {
      const tplGrid = document.getElementById('arCnTplGrid');
      if (!tplGrid) return;
      // DOM 한 번 생성 후 active 상태와 썸네일만 갱신 (깜박임 0%)
      if (!tplGrid.dataset.built) {
        tplGrid.dataset.built = '1';
        tplGrid.innerHTML = AR_CN_TEMPLATES.map((t) => `
          <button type="button" data-cn-tpl="${t.id}" onclick="arCnSetTemplate('${t.id}')" class="ar-cn-tpl-btn">
            <canvas data-cn-thumb="${t.id}" width="180" height="225" class="ar-cn-tpl-thumb"></canvas>
            <span class="truncate px-0.5">${t.name}</span>
          </button>
        `).join('');
      }
      tplGrid.querySelectorAll('[data-cn-tpl]').forEach((b) => {
        b.classList.toggle('active', b.dataset.cnTpl === _arCnState.templateId);
      });
      AR_CN_TEMPLATES.forEach((t) => {
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
        frame.style.aspectRatio = isSquare ? '1 / 1' : '4 / 5';
        const wantH = isSquare ? 540 : 675;
        if (cv.width !== 540 || cv.height !== wantH) { cv.width = 540; cv.height = wantH; }
        arCnRenderSlide(cv, cur, idx, total);
      }

      const roleLabel = idx === 0 ? '표지' : (idx === total - 1 ? '마무리' : `본문 ${idx}`);
      const meta = document.getElementById('arCnSlideMeta');
      if (meta) meta.textContent = `${idx + 1} / ${total}장 · ${roleLabel}`;
      const editLbl = document.getElementById('arCnEditCardLabel');
      if (editLbl) editLbl.textContent = `3. ${idx + 1}번 카드(${roleLabel}) 글자 수정`;
      const zipBtn = document.getElementById('arCnDownloadZipBtn');
      if (zipBtn) zipBtn.textContent = `📦 전체 ${total}장 한 번에 저장 (.zip)`;
      const hasPhoto = Boolean(cur && cur.bgImg);
      const clrPhoto = document.getElementById('arCnClearBgPhotoBtn');
      if (clrPhoto) clrPhoto.classList.toggle('hidden', !hasPhoto);
      const pLayoutRow = document.getElementById('arCnPhotoLayoutRow');
      if (pLayoutRow) {
        const curPL = !hasPhoto ? 'text_only' : ((cur && cur.photoLayout) || (idx === 0 ? eff.coverLayout : eff.bodyLayout) || 'photo_top');
        pLayoutRow.querySelectorAll('[data-cn-playout]').forEach((b) => b.classList.toggle('active', b.dataset.cnPlayout === curPL));
      }

      // 장 번호 칩
      const pills = document.getElementById('arCnSlidePills');
      if (pills) {
        pills.innerHTML = _arCnState.slides.map((s, i) => {
          const on = i === idx;
          const lbl = i === 0 ? '1 표지' : (i === total - 1 ? `${i + 1} 끝` : String(i + 1));
          const dot = s.bgImg && s.photoLayout !== 'text_only' ? '📷' : '';
          return `<button type="button" onclick="arCnSelectSlide(${i})" class="px-2 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer ${on ? 'bg-[#2563eb] text-white border-[#60a5fa]' : 'bg-[#1c1c21] text-[#a1a1aa] border-white/10'}">${lbl}${dot}</button>`;
        }).join('');
      }

      // 장수 / 비율 / 글자크기 / 트윅 / 컬러 / 폰트 / 시각 미리보기 템플릿 갤러리 동기화
      document.querySelectorAll('#arCnCountRow [data-cn-cnt]').forEach((b) => b.classList.toggle('active', Number(b.dataset.cnCnt) === _arCnState.targetCount));
      document.querySelectorAll('#arCardNewsModal [data-cn-ratio]').forEach((b) => b.classList.toggle('active', b.dataset.cnRatio === _arCnState.ratio));
      document.querySelectorAll('#arCardNewsModal [data-cn-fsize]').forEach((b) => b.classList.toggle('active', b.dataset.cnFsize === _arCnState.fontScale));
      document.querySelectorAll('#arCardNewsModal [data-cn-tweak]').forEach((b) => {
        const k = b.dataset.cnTweak;
        b.classList.toggle('active', _arCnState.tweaks[k] !== false);
      });
      const cBg = document.getElementById('arCnColorBg');
      const cAc = document.getElementById('arCnColorAccent');
      const cFg = document.getElementById('arCnColorFg');
      if (cBg && /^#[0-9a-f]{6}$/i.test(eff.bg)) cBg.value = eff.bg;
      if (cAc && /^#[0-9a-f]{6}$/i.test(eff.accent)) cAc.value = eff.accent;
      if (cFg && /^#[0-9a-f]{6}$/i.test(eff.fg)) cFg.value = eff.fg;
      const fSel = document.getElementById('arCnFontSelect');
      if (fSel) fSel.value = _arCnState.fontFamily || '';

      arCnRenderTemplateGallery();

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

    function arOpenCardNewsModal() {
      const modal = document.getElementById('arCardNewsModal');
      if (!modal) return;
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
      arCnPopulateSamplePhotos(false);
      modal.classList.remove('hidden');
      arCnRefreshUI();
    }
    function arCloseCardNewsModal() {
      document.getElementById('arCardNewsModal')?.classList.add('hidden');
    }
    function arCnSetTargetCount(n) {
      _arCnState.targetCount = Math.max(5, Math.min(10, Number(n) || 7));
      arCnRefreshUI(true);
    }
    function arCnSetTemplate(id) {
      _arCnState.templateId = id;
      _arCnState.customColors = { bg: '', accent: '', fg: '' };
      _arCnState.slides.forEach((s) => { s.userLayoutLocked = false; });
      arCnPopulateSamplePhotos(true);
      arCnRefreshUI(true);
    }
    function arCnSetCustomColor(key, hex) {
      if (!['bg', 'accent', 'fg'].includes(key)) return;
      _arCnState.customColors[key] = hex;
      if (key === 'bg' && !_arCnState.customColors.fg) {
        _arCnState.customColors.fg = arCnIsDarkHex(hex) ? '#f8fafc' : '#18181b';
      }
      arCnRefreshUI(true);
    }
    function arCnResetCustomColors() {
      _arCnState.customColors = { bg: '', accent: '', fg: '' };
      arCnRefreshUI(true);
    }
    function arCnSetFontFamily(fam) {
      _arCnState.fontFamily = String(fam || '');
      arCnRefreshUI(true);
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
    async function arCnToggleVaultStrip() {
      const wrap = document.getElementById('arCnVaultWrap');
      const strip = document.getElementById('arCnVaultStrip');
      if (!wrap || !strip) return;
      const willShow = wrap.classList.contains('hidden');
      wrap.classList.toggle('hidden', !willShow);
      if (!willShow) return;
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
        _arCnState.activeIdx = 0;
        arCnPopulateSamplePhotos(false);
        arCnRefreshUI(false);
        if (typeof arToast === 'function') arToast(`${_arCnState.slides.length}장 카드뉴스 초안을 만들었어요! 각 장을 눌러 글자·사진만 다듬어 보세요.`, true);
      } catch (_) {
        _arCnState.slides = arCnDefaultSlides(_arCnState.targetCount, topic || sourceText.slice(0, 24));
        _arCnState.activeIdx = 0;
        arCnPopulateSamplePhotos(false);
        arCnRefreshUI(false);
        if (typeof arToast === 'function') arToast(`${_arCnState.slides.length}장 기본 템플릿을 채웠어요! 글자를 자유롭게 수정해 보세요.`, true);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✨ AI 만들기'; }
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
        if (btn) { btn.disabled = false; btn.textContent = '✨ AI 사진'; }
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
    async function arCnApplyToStudioReels() {
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
        campaign.cutCountOverride = outImgs.length;
        campaign.hasCustomVideo = false;
        campaign.scenePlan = outImgs.map((_, i) => ({ photoIdx: i }));
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
        const mainD = +(outImgs.length * 2.6).toFixed(2);
        if (typeof OUTRO_DURATION !== 'undefined') OUTRO_DURATION = 0;
        if (typeof BASE_DURATION !== 'undefined') BASE_DURATION = mainD;
        if (typeof CUT_LENGTHS !== 'undefined') CUT_LENGTHS = Array.from({ length: outImgs.length }, () => 2.6);
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
        if (typeof isPlaying !== 'undefined') isPlaying = true;
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
      window.arCnSetTargetCount = arCnSetTargetCount;
      window.arCnSetTemplate = arCnSetTemplate;
      window.arCnSetCustomColor = arCnSetCustomColor;
      window.arCnResetCustomColors = arCnResetCustomColors;
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
      window.arCnApplyToStudioReels = arCnApplyToStudioReels;
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
