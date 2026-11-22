// AutoReels — 04-audio-engine.js  (public/index.html 에서 나눔. 일반 <script> 로 순서대로 불러오며 전역 이름을 공유함)
    // ============================================================================
    // 릴스·숏츠 음원(MP3 불러오기 + 내장 비트) & 한국어 AI 성우(TTS) 엔진
    // ============================================================================
    const AR_LIBRARY_MUSIC = new Map(AR_AUDIO_LIBRARY.music.map(track => [track.id, track]));
    const AR_LIBRARY_EFFECTS = new Map(AR_AUDIO_LIBRARY.effects.map(effect => [effect.id, effect]));
    const AR_EFFECT_FAMILIES = new Map();
    for (const effect of AR_LIBRARY_EFFECTS.values()) {
      if (!AR_EFFECT_FAMILIES.has(effect.family)) AR_EFFECT_FAMILIES.set(effect.family, []);
      AR_EFFECT_FAMILIES.get(effect.family).push(effect.id);
    }

    function arAutomaticSfx(slot, total, category, caption, mood) {
      let families;
      if (slot >= total) families = ['outro'];
      else if (/만\s?원|\d+\s?%|할인|특가|혜택|\d+원|1\+1|무료|증정/.test(caption)) families = ['deal'];
      else if (/긴급|필독|주의|놓치면|마감|단\s?\d+일|충격|비교/.test(caption)) families = ['impact'];
      else if (['타이포', '스포츠', '특가', '테크'].includes(category)) families = ['impact', 'transition', 'click'];
      else if (['브이로그', '감성', '손글씨', '고급', '매거진'].includes(category)) families = ['texture', 'sparkle', 'camera', 'click'];
      else if (mood === '신나는') families = ['transition', 'impact', 'click'];
      else if (['잔잔', '감성', '고급'].includes(mood)) families = ['texture', 'sparkle', 'click'];
      else families = ['transition', 'click', 'camera', 'sparkle'];
      const variants = AR_EFFECT_FAMILIES.get(families[slot % families.length]);
      return variants[Math.floor(slot / families.length) % variants.length];
    }

    const AudioEngine = {
      ctx: null,
      masterGain: null,
      bgmGain: null,
      ttsGain: null,
      streamDest: null,
      enabled: false,
      bgmStyle: 'showroom',
      ttsVoice: 'ko-KR-Chirp3-HD-Puck',
      ttsSpeed: 1.1,
      voiceListLoaded: false,
      voiceListRequest: null,
      voiceListRevision: 0,
      defaultVoicePending: true,
      bgmTimer: null,
      stepIndex: 0,
      lastSpokenCut: -1,
      customBgmAudioEl: null,
      customBgmSourceNode: null,
      customBgmUrl: null,

      ensureContext() {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return null;
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 0.95;
          this.bgmGain = this.ctx.createGain();
          this.bgmGain.gain.value = 0.42; // 성우 음성이 또렷하게 들리도록 BGM은 한 단계 낮게
          this.ttsGain = this.ctx.createGain();
          this.ttsGain.gain.value = 1.0;

          this.bgmGain.connect(this.masterGain);
          this.ttsGain.connect(this.masterGain);
          // BGM과 성우가 겹칠 때 소리가 깨지지 않도록 출력 직전에 리미터를 둠
          this.limiter = this.ctx.createDynamicsCompressor();
          this.limiter.threshold.value = -8;
          this.limiter.knee.value = 6;
          this.limiter.ratio.value = 12;
          this.limiter.attack.value = 0.003;
          this.limiter.release.value = 0.15;
          this.masterGain.connect(this.limiter);
          this.limiter.connect(this.ctx.destination);

          if (typeof this.ctx.createMediaStreamDestination === 'function') {
            this.streamDest = this.ctx.createMediaStreamDestination();
            this.limiter.connect(this.streamDest);
          }

          // 하이햇·클랩용 화이트노이즈 버퍼
          const len = Math.floor(this.ctx.sampleRate * 0.5);
          this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
          const ch = this.noiseBuf.getChannelData(0);
          for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
        }
        if (this.ctx && this.ctx.state !== 'running') {
          this.ctx.resume().catch(() => {});
        }
        try { this.loadPlinkfx(); } catch (e) {}
        return this.ctx;
      },

      // 사용자가 직접 불러온 릴스·숏츠 MP3/오디오 파일 세팅
      loadCustomBgmFile(file) {
        const ctx = this.ensureContext();
        if (this.customBgmUrl) {
          URL.revokeObjectURL(this.customBgmUrl);
        }
        this.customBgmUrl = URL.createObjectURL(file);
        if (!this.customBgmAudioEl) {
          this.customBgmAudioEl = new Audio();
          this.customBgmAudioEl.loop = true;
          this.customBgmAudioEl.crossOrigin = 'anonymous';
          if (ctx) {
            try {
              this.customBgmSourceNode = ctx.createMediaElementSource(this.customBgmAudioEl);
              this.customBgmSourceNode.connect(this.bgmGain);
            } catch (e) {}
          }
        }
        this.customBgmAudioEl.src = this.customBgmUrl;
        this.customBgmAudioEl.volume = 0.65;
        this.bgmStyle = 'custom_mp3';

        const opt = document.getElementById('customBgmOption');
        const sel = document.getElementById('bgmStyleSelect');
        if (opt) {
          opt.classList.remove('hidden');
          opt.textContent = `🎵 내 음원: ${file.name.slice(0, 22)}`;
        }
        if (sel) sel.value = 'custom_mp3';
        if (typeof renderBgmRecommendations === 'function') setTimeout(renderBgmRecommendations, 0);

        const statusText = document.getElementById('customBgmStatusText');
        if (statusText) {
          statusText.classList.remove('hidden');
          statusText.textContent = `✅ 릴스·숏츠 음원 [${file.name}] 로드 완료! 영상 재생 및 추출 시 이 음악이 그대로 합성됩니다.`;
        }

        if (!this.enabled) {
          toggleAudioMaster(true);
        } else {
          this.startBgmLoop();
        }
      },

      // 구글 Lyria AI BGM 등 외부/Blob 음원 URL 로드
      loadRemoteBgmUrl(url, label, autoPlay = true) {
        const ctx = this.ensureContext();
        if (this.customBgmUrl) {
          URL.revokeObjectURL(this.customBgmUrl);
          this.customBgmUrl = null;
        }
        if (!this.customBgmAudioEl) {
          this.customBgmAudioEl = new Audio();
          this.customBgmAudioEl.loop = true;
          this.customBgmAudioEl.crossOrigin = 'anonymous';
          if (ctx) {
            try {
              this.customBgmSourceNode = ctx.createMediaElementSource(this.customBgmAudioEl);
              this.customBgmSourceNode.connect(this.bgmGain);
            } catch (e) {}
          }
        }
        this.customBgmAudioEl.src = url;
        this.customBgmAudioEl.volume = 0.65;
        this.bgmStyle = 'custom_mp3';

        const statusText = document.getElementById('lyriaBgmStatusText');
        if (statusText) {
          statusText.classList.remove('hidden');
          statusText.textContent = `✨ ${label || 'AI 배경음악'} 적용됨`;
        }
        if (autoPlay !== false) {
          if (!this.enabled) {
            toggleAudioMaster(true);
          } else {
            this.startBgmLoop();
          }
        }
      },

      // ★ 내장 릴스·숏츠 스타일 BGM 엔진 (코드 패드 + 베이스라인 + 아르페지오 리프 + 킥/클랩/하이햇)
      //   - AudioContext 시간 기준 룩어헤드 스케줄링으로 끊김 없이 재생
      BGM_STYLES: {
        // 4마디 코드 진행 (각 코드: [베이스 루트, 코드톤...] Hz)
        showroom: { bpm: 118, wave: 'sawtooth', cutoff: 1400, kick: [0, 4, 8, 12], clap: [4, 12], hat: 'offbeat',
          chords: [[110.0, 220.0, 261.63, 329.63, 392.0], [87.31, 174.61, 220.0, 261.63, 329.63],
                   [130.81, 261.63, 329.63, 392.0, 493.88], [98.0, 196.0, 246.94, 293.66, 392.0]] },
        urban: { bpm: 140, wave: 'square', cutoff: 900, kick: [0, 3, 6, 10, 11], clap: [8], hat: 'trap',
          chords: [[73.42, 146.83, 174.61, 220.0, 293.66], [77.78, 155.56, 196.0, 233.08, 311.13],
                   [65.41, 130.81, 155.56, 196.0, 261.63], [69.3, 138.59, 174.61, 207.65, 277.18]] },
        bright: { bpm: 112, wave: 'triangle', cutoff: 2600, kick: [0, 8, 10], clap: [4, 12], hat: 'eighth',
          chords: [[87.31, 174.61, 220.0, 261.63, 329.63], [98.0, 196.0, 246.94, 293.66, 349.23],
                   [82.41, 164.81, 207.65, 246.94, 329.63], [110.0, 220.0, 261.63, 329.63, 392.0]] },
        luxury: { bpm: 90, wave: 'sine', cutoff: 1800, kick: [0, 10], clap: [8], hat: 'sparse',
          chords: [[73.42, 220.0, 277.18, 329.63, 440.0], [61.74, 185.0, 246.94, 293.66, 369.99],
                   [82.41, 196.0, 246.94, 329.63, 392.0], [55.0, 164.81, 220.0, 277.18, 329.63]] },
        // ---- 추가 음악 9종 ----
        lofi: { bpm: 80, wave: 'triangle', cutoff: 900, kick: [0, 7, 10], clap: [4, 12], hat: 'eighth', swing: 0.22, bass: 'sub',
          arpWave: 'sine', arpEvery: 4, arpGain: 0.06, padGain: 0.12,
          chords: [[87.31, 174.61, 220.0, 261.63, 329.63], [82.41, 164.81, 196.0, 246.94, 293.66],
                   [73.42, 146.83, 174.61, 220.0, 261.63], [65.41, 130.81, 164.81, 196.0, 246.94]] },
        vlog: { bpm: 104, wave: 'triangle', cutoff: 2200, kick: [0, 8], clap: [4, 12], hat: 'eighth', bass: 'saw',
          arpWave: 'triangle', arpEvery: 1, arpGain: 0.045, arp: [1, 3, 2, 4, 3, 2, 4, 3],
          chords: [[65.41, 261.63, 329.63, 392.0, 523.25], [98.0, 246.94, 293.66, 392.0, 493.88],
                   [110.0, 261.63, 329.63, 440.0, 523.25], [87.31, 261.63, 349.23, 440.0, 523.25]] },
        cinema: { bpm: 70, wave: 'sawtooth', cutoff: 700, kick: [0], kickGain: 1.0, clap: [], hat: 'none', bass: 'sub', padGain: 0.16,
          arpWave: 'sine', arpEvery: 4, arpGain: 0.07, arp: [3, 4, 3, 2],
          chords: [[73.42, 146.83, 174.61, 220.0, 293.66], [58.27, 116.54, 146.83, 174.61, 233.08],
                   [87.31, 174.61, 220.0, 261.63, 349.23], [65.41, 130.81, 164.81, 196.0, 261.63]] },
        drive: { bpm: 100, wave: 'sawtooth', cutoff: 1900, kick: [0, 4, 8, 12], clap: [4, 12], hat: 'offbeat', bass: 'eighth',
          arpWave: 'square', arpEvery: 1, arpGain: 0.03, arp: [1, 2, 3, 4, 3, 2, 1, 2],
          chords: [[110.0, 220.0, 261.63, 329.63, 440.0], [87.31, 174.61, 220.0, 261.63, 349.23],
                   [65.41, 130.81, 164.81, 196.0, 261.63], [98.0, 196.0, 246.94, 293.66, 392.0]] },
        edm: { bpm: 128, wave: 'sawtooth', cutoff: 3000, kick: [0, 4, 8, 12], clap: [4, 12], hat: 'offbeat', bass: 'offbeat', padGain: 0.1,
          arpWave: 'sawtooth', arpEvery: 1, arpGain: 0.035, arp: [1, 4, 2, 4, 3, 4, 2, 4],
          chords: [[92.5, 185.0, 220.0, 277.18, 369.99], [73.42, 146.83, 185.0, 220.0, 293.66],
                   [110.0, 220.0, 277.18, 329.63, 440.0], [82.41, 164.81, 207.65, 246.94, 329.63]] },
        funk: { bpm: 108, wave: 'square', cutoff: 1500, kick: [0, 3, 8, 10], clap: [4, 12], hat: 'sixteenth', swing: 0.1, bass: 'funk',
          arpWave: 'square', arpEvery: 4, arpGain: 0.04, arp: [2, 3, 2, 4],
          chords: [[82.41, 164.81, 196.0, 246.94, 293.66], [110.0, 220.0, 261.63, 329.63, 392.0],
                   [82.41, 164.81, 196.0, 246.94, 293.66], [123.47, 246.94, 293.66, 369.99, 440.0]] },
        ballad: { bpm: 72, wave: 'sine', cutoff: 1500, kick: [0, 10], kickGain: 0.6, clap: [8], hat: 'sparse', bass: 'sub', padGain: 0.12,
          arpWave: 'sine', arpEvery: 2, arpGain: 0.09, arp: [1, 2, 3, 4, 3, 2, 1, 2],
          chords: [[65.41, 261.63, 329.63, 392.0, 523.25], [61.74, 246.94, 293.66, 392.0, 493.88],
                   [55.0, 220.0, 261.63, 329.63, 440.0], [87.31, 220.0, 261.63, 349.23, 440.0]] },
        news: { bpm: 120, wave: 'square', cutoff: 1200, kick: [0, 6, 8, 14], clap: [4, 12], hat: 'sixteenth', bass: 'saw',
          arpWave: 'square', arpEvery: 2, arpGain: 0.04, arp: [1, 1, 3, 1, 4, 1, 3, 2],
          chords: [[65.41, 130.81, 155.56, 196.0, 261.63], [103.83, 207.65, 261.63, 311.13, 415.3],
                   [77.78, 155.56, 196.0, 233.08, 311.13], [116.54, 233.08, 293.66, 349.23, 466.16]] },
        jazz: { bpm: 92, wave: 'sine', cutoff: 1600, kick: [0, 10], kickGain: 0.55, clap: [], hat: 'eighth', swing: 0.28, bass: 'walk',
          arpWave: 'sine', arpEvery: 4, arpGain: 0.06, arp: [2, 4, 3, 1],
          chords: [[73.42, 146.83, 174.61, 220.0, 261.63], [98.0, 196.0, 246.94, 293.66, 349.23],
                   [65.41, 130.81, 164.81, 196.0, 246.94], [110.0, 220.0, 277.18, 329.63, 392.0]] }
      },
      // 디자인 묶음별로 어울리는 기본 음악 (직접 불러온 음원·BGM 끄기는 바꾸지 않음)
      BGM_LABELS: {
        showroom: 'Chill House 쇼룸', urban: 'Phonk / Trap', bright: 'Upbeat City Pop', luxury: 'Luxury Lounge',
        lofi: 'Lo-fi 감성', vlog: 'Acoustic Pop 브이로그', cinema: 'Cinematic 트레일러', drive: 'Synthwave 드라이브',
        edm: 'EDM 페스티벌', funk: 'Funk 그루브', ballad: 'Piano 발라드', news: 'Breaking News', jazz: 'Jazz 라운지'
      },
      nextStepTime: 0,

      scheduleStep(step, when) {
        const ctx = this.ctx;
        const S = this.BGM_STYLES[this.bgmStyle] || this.BGM_STYLES.showroom;
        const stepDur = 60 / S.bpm / 4;
        const s16 = step % 16;
        const bar = Math.floor(step / 16) % 4;
        const chord = S.chords[bar];
        const out = this.bgmGain;
        if (S.swing && s16 % 4 === 2) when += S.swing * stepDur;

        // 1) 킥
        if (S.kick.includes(s16)) {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(150, when);
          o.frequency.exponentialRampToValueAtTime(42, when + 0.14);
          g.gain.setValueAtTime(S.kickGain || 0.9, when);
          g.gain.exponentialRampToValueAtTime(0.001, when + 0.28);
          o.connect(g); g.connect(out);
          o.start(when); o.stop(when + 0.3);
        }

        // 2) 클랩/스네어 (노이즈)
        if (S.clap.includes(s16) && this.noiseBuf) {
          const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
          n.buffer = this.noiseBuf;
          f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 1.4;
          g.gain.setValueAtTime(0.13, when);
          g.gain.exponentialRampToValueAtTime(0.001, when + 0.09);
          n.connect(f); f.connect(g); g.connect(out);
          n.start(when); n.stop(when + 0.1);
        }

        // 3) 하이햇 (노이즈 하이패스)
        const hatOn =
          S.hat === 'offbeat' ? s16 % 4 === 2 :
          S.hat === 'eighth' ? s16 % 2 === 0 :
          S.hat === 'trap' || S.hat === 'sixteenth' ? true :
          S.hat === 'none' ? false :
          s16 % 8 === 4;
        if (hatOn && this.noiseBuf) {
          const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
          n.buffer = this.noiseBuf;
          f.type = 'highpass'; f.frequency.value = 7000;
          const v = S.hat === 'trap' ? (s16 % 2 === 0 ? 0.045 : 0.025) : 0.05;
          g.gain.setValueAtTime(v, when);
          g.gain.exponentialRampToValueAtTime(0.001, when + 0.035);
          n.connect(f); f.connect(g); g.connect(out);
          n.start(when); n.stop(when + 0.06);
        }

        // 4) 코드 패드 (마디 시작마다 1마디 길이로 지속)
        if (s16 === 0) {
          const barDur = stepDur * 16;
          const f = ctx.createBiquadFilter(), g = ctx.createGain();
          f.type = 'lowpass'; f.frequency.value = S.cutoff; f.Q.value = 0.6;
          g.gain.setValueAtTime(0.0001, when);
          g.gain.linearRampToValueAtTime(S.padGain || 0.11, when + 0.25);
          g.gain.setValueAtTime(S.padGain || 0.11, when + barDur - 0.3);
          g.gain.linearRampToValueAtTime(0.0001, when + barDur);
          f.connect(g); g.connect(out);
          chord.slice(1, 4).forEach((hz, i) => {
            [-6, 6].forEach((detune) => {
              const o = ctx.createOscillator();
              o.type = S.wave === 'square' ? 'sawtooth' : S.wave;
              o.frequency.value = hz;
              o.detune.value = detune + i;
              o.connect(f);
              o.start(when); o.stop(when + barDur + 0.05);
            });
          });
        }

        // 5) 베이스라인
        const bassMode = S.bass || (this.bgmStyle === 'urban' ? 'sub' : 'saw');
        const funkHits = [0, 3, 6, 8, 10, 14];
        const bassHit =
          bassMode === 'sub' ? S.kick.includes(s16) || (S.kick.length < 2 && s16 === 8) :
          bassMode === 'offbeat' ? s16 % 4 === 2 :
          bassMode === 'eighth' ? s16 % 2 === 0 :
          bassMode === 'funk' ? funkHits.includes(s16) :
          bassMode === 'walk' ? s16 % 4 === 0 :
          (s16 % 4 === 0 || s16 % 4 === 3);
        if (bassHit) {
          const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
          o.type = bassMode === 'sub' || bassMode === 'walk' ? 'sine' : bassMode === 'funk' ? 'square' : 'sawtooth';
          o.frequency.value = bassMode === 'walk' ? chord[(s16 / 4) % 4] / (s16 === 0 ? 1 : 2) : chord[0];
          f.type = 'lowpass'; f.frequency.value = bassMode === 'funk' ? 700 : 420;
          const len = bassMode === 'sub' ? stepDur * 3.5 : bassMode === 'walk' ? stepDur * 3.2 : bassMode === 'eighth' || bassMode === 'offbeat' ? stepDur * 1.2 : stepDur * 1.6;
          g.gain.setValueAtTime(bassMode === 'funk' ? 0.3 : 0.38, when);
          g.gain.exponentialRampToValueAtTime(0.001, when + len);
          o.connect(f); f.connect(g); g.connect(out);
          o.start(when); o.stop(when + len + 0.02);
        }

        // 6) 멜로디 리프 (음악마다 박자·음색이 다름)
        const every = S.arpEvery === undefined ? 2 : S.arpEvery;
        if (every && s16 % every === 0) {
          const pattern = S.arp || [1, 2, 3, 4, 3, 2, 4, 2];
          const hz = chord[pattern[(s16 / every) % pattern.length]] * 2;
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = S.arpWave || (this.bgmStyle === 'luxury' ? 'sine' : 'triangle');
          o.frequency.value = hz;
          const ag = S.arpGain || (this.bgmStyle === 'urban' ? 0.05 : 0.075);
          const al = stepDur * Math.max(1.8, every * 0.9);
          g.gain.setValueAtTime(0.0001, when);
          g.gain.linearRampToValueAtTime(ag, when + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, when + al);
          o.connect(g); g.connect(out);
          o.start(when); o.stop(when + al + 0.05);
        }
      },

      // 하위 호환: 단일 스텝 즉시 재생
      playBgmStep() {
        if (!this.enabled || this.bgmStyle === 'off' || this.bgmStyle === 'custom_mp3') return;
        const ctx = this.ensureContext();
        if (!ctx) return;
        this.scheduleStep(this.stepIndex++, ctx.currentTime + 0.02);
      },

      startBgmLoop() {
        this.stopBgmLoop();
        if (!this.enabled || this.bgmStyle === 'off') return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        const resumed = ctx.state === 'running' ? Promise.resolve() : ctx.resume().catch(() => {});

        // 내장 BGM도 브라우저 하드웨어 디코더(/assets/bgm/pack/*.mp3)로 우선 재생해
        // 25ms JS 타이머 신스가 메인 스레드 부하로 뚝뚝 끊기는 현상을 근본적으로 방지
        const packId = typeof arBgmPackId === 'function' ? arBgmPackId(this.bgmStyle) : '';
        if (this.bgmStyle !== 'custom_mp3' && packId) {
          const mp3Url = `/assets/bgm/pack/${packId}.mp3`;
          const label = (this.BGM_LABELS && this.BGM_LABELS[this.bgmStyle]) || packId;
          this.loadRemoteBgmUrl(mp3Url, label, !!isPlaying);
          return;
        }

        // 내가 불러온 릴스·숏츠 MP3: 사용자 클릭 제스처 안에서 동기 play() 먼저 시도 후 컨텍스트 재개 폴백
        if (this.bgmStyle === 'custom_mp3' && this.customBgmAudioEl) {
          if (!isPlaying) return;
          const audio = this.customBgmAudioEl;
          const retry = () => resumed.then(() => {
            if (isPlaying && this.enabled && this.customBgmAudioEl === audio) return audio.play().catch(() => {});
          });
          try {
            audio.play()?.catch(retry);
          } catch (e) {
            retry();
          }
          return;
        }

        this.stepIndex = 0;
        resumed.then(() => {
          if (!this.enabled || this.bgmStyle === 'off' || this.bgmStyle === 'custom_mp3') return;
          this.nextStepTime = ctx.currentTime + 0.06;
          this.bgmTimer = setInterval(() => {
            if (!this.enabled) return;
            const S = this.BGM_STYLES[this.bgmStyle] || this.BGM_STYLES.showroom;
            const stepDur = 60 / S.bpm / 4;
            if (!isPlaying) {
              this.nextStepTime = ctx.currentTime + 0.06;
              return;
            }
            // 탭이 백그라운드였다가 돌아온 경우 밀린 스텝 건너뛰기
            if (this.nextStepTime < ctx.currentTime - 0.2) this.nextStepTime = ctx.currentTime + 0.05;
            while (this.nextStepTime < ctx.currentTime + 0.14) {
              this.scheduleStep(this.stepIndex++, this.nextStepTime);
              this.nextStepTime += stepDur;
            }
          }, 25);
        });
      },

      stopBgmLoop() {
        if (this.bgmTimer) {
          clearInterval(this.bgmTimer);
          this.bgmTimer = null;
        }
        if (this.customBgmAudioEl) {
          try {
            this.customBgmAudioEl.pause();
          } catch (e) {}
        }
      },

      // ------------------------------------------------------------------------
      // ★ 한국어 AI 성우(TTS)는 서버 프록시를 통해 가져옵니다.
      //   - MP3를 받아 AudioBuffer로 디코딩한 뒤 ttsGain에 연결하므로
      //     스피커 재생과 영상 추출 오디오 트랙에 같은 음성이 들어갑니다.
      //   - Fish Audio를 쓸 수 없을 때(키 미설정, 오프라인)만 브라우저 음성으로 대체합니다.
      //     브라우저 음성은 추출 영상에 녹음되지 않습니다.
      // ------------------------------------------------------------------------
      ttsCache: new Map(),
      ttsSeconds: new Map(), // 성우·문장별 실제 음성 길이(초)
      ttsPrefetchTimer: null,
      masterBuffer: null,
      masterSource: null,
      masterSourceGain: null,
      masterPeak: 1.0,
      masterDuration: 0,
      lastTimelineT: 0,
      ttsSource: null,
      ttsSourceGain: null,
      ttsSpeakToken: 0,
      ttsProvider: 'unknown', // 'airy' | 'google' | 'fish' | 'browser' | 'unknown'
      ttsLastError: '',
      ttsBlockedUntil: 0,

      getCutNarration(cutIdx) {
        const d = getSelectedDealer();
        const totalCuts = getTargetCutCount();
        let text = '';
        if (cutIdx < totalCuts) {
          text =
            (campaign.ttsLines && campaign.ttsLines[cutIdx]) ||
            (campaign.cutCaptions && campaign.cutCaptions[cutIdx]) ||
            campaign.hook;
        } else {
          // 마지막 엔딩 카드(명함/매장) 클로징 멘트: 매장 중심 업종은 매장명으로, 인물 중심 업종은 호칭으로 안내
          // 명함을 아직 안 채웠으면 이름 없이 안내만
          if (arCardEmpty()) return ''; // 명함 화면이 없으면 마지막 멘트도 없음
          const card = arDisplayDealer(d);
          const name = card.name === '사용자' ? '' : card.name;
          const who = name ? (IND.outroMode === 'store' ? name : [name, card.title].filter(Boolean).join(' ')) : arDealerForCopy(card).branch;
          const ask = `댓글에 ${IND.cta || (IND.outroMode === 'store' ? '예약' : '문의')} 남겨주세요!`;
          text = who ? `${who}입니다. ${ask}` : ask;
        }
        return indWord(String(text || ''))
          .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
          .replace(/[✔🚨✨💰🔑🏢📞🎁💬★]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 200);
      },

      setTtsProvider(provider, errorCode) {
        this.ttsProvider = provider;
        this.ttsLastError = errorCode || '';
      },

      // 서버가 알려 준 Fish Audio 모델 이름 확인 (/api/tts 의 X-TTS-Model, /api/tts-script 의 model)
      // 유료 크레딧이 떨어지면 서버가 무료 모델로 바꿔 음질이 기계음처럼 떨어지므로,
      // 관리자 모드에서는 한 번 알림을 띄웁니다.
      ttsFreeModel: false,
      ttsFreeNotified: false,
      noteTtsModel(model) {
        if (!model) return;
        const free = /free/i.test(String(model));
        if (free === this.ttsFreeModel) return;
        this.ttsFreeModel = free;
        if (this.ttsProvider === 'fish') this.setTtsProvider('fish');
        if (free) {
          console.warn('[AutoReelsMaker] Fish Audio 유료 크레딧 부족: 무료 모델로 음성을 만들고 있습니다 (' + model + ')');
          if (!this.ttsFreeNotified && typeof isAdminMode !== 'undefined' && isAdminMode && typeof arToast === 'function') {
            this.ttsFreeNotified = true;
            arToast('Fish Audio 크레딧이 부족해 성우가 무료 모델(음질 낮음)로 바뀌었습니다. fish.audio에서 충전하면 바로 고품질로 돌아갑니다.');
          }
        }
      },

      ttsKey(text) {
        return `${this.ttsVoice}@${this.ttsSpeed}|${text}`;
      },

      isGoogleVoice(voice) {
        return /^ko-KR-(?:Wavenet-[A-D]|Chirp3-HD-[A-Za-z]+)$/.test(voice);
      },
      isFishVoice(voice) {
        return /^[a-f0-9]{16,64}$/i.test(voice);
      },
      isTtsServiceError(code) {
        return /^(airy|google)_/.test(code);
      },
      restoreVoice(voice) {
        if (arIsLegacyDeviceVoice(voice)) voice = 'off';
        this.defaultVoicePending = false;
        this.ttsVoice = voice;
        const sel = document.getElementById('ttsVoiceSelect');
        if (!sel) return;
        if (!Array.from(sel.options).some((option) => option.value === voice)) {
          if (this.isGoogleVoice(voice)) {
            sel.add(new Option('저장된 성우', voice), sel.querySelector('[value="off"]'));
          } else if (/^[a-f0-9]{16,64}$/i.test(voice)) {
            // 목록에서 숨긴 성우라도 기존 프로젝트의 선택값은 복원합니다.
            const saved = new Option('저장된 성우', voice);
            saved.hidden = true;
            saved.disabled = true;
            sel.add(saved, sel.querySelector('[value="off"]'));
          }
        }
        sel.value = voice;
      },
      // 한국어 성우 목록을 받아 선택 상자에 채움 (한 번만)
      loadVoiceList() {
        if (this.voiceListLoaded) return Promise.resolve();
        if (this.voiceListRequest) return this.voiceListRequest;
        const revision = this.voiceListRevision;
        this.voiceListRequest = (async () => {
          try {
            const response = await fetch('/api/tts-voices?v=4', { signal: AbortSignal.timeout(5000), cache: 'no-store' });
            if (!response.ok) return;
            const { voices } = await response.json();
            if (revision !== this.voiceListRevision) return;
            const select = document.getElementById('ttsVoiceSelect');
            if (!select || !Array.isArray(voices) || voices.length === 0) return;
            const options = document.createDocumentFragment();
            const groups = new Map();
            for (const { id, title, group, tier, locked } of voices) {
              if (group && !groups.has(group)) {
                const parent = document.createElement('optgroup');
                parent.label = group;
                groups.set(group, parent);
                options.append(parent);
              }
              const option = new Option(title, id);
              if (tier === 'pro') option.dataset.voiceTier = tier;
              if (locked) {
                option.disabled = true;
                option.dataset.proLocked = '1';
              }
              (groups.get(group) || options).append(option);
            }
            const off = select.querySelector('option[value="off"]');
            select.replaceChildren(options, off);
            const selectable = voices.filter(v => !v.locked);
            const hasChirp = selectable.some((v) => v.id && v.id.startsWith('ko-KR-Chirp3-HD-'));
            const indKey = (typeof IND !== 'undefined' && IND && IND.key) ? IND.key : 'auto';
            const indChirpMap = {
              auto: 'ko-KR-Chirp3-HD-Puck',
              dining: 'ko-KR-Chirp3-HD-Laomedeia',
              cafe: 'ko-KR-Chirp3-HD-Aoede',
              beauty: 'ko-KR-Chirp3-HD-Leda',
              realestate: 'ko-KR-Chirp3-HD-Charon',
              academy: 'ko-KR-Chirp3-HD-Kore',
              clinic: 'ko-KR-Chirp3-HD-Sulafat',
              fitness: 'ko-KR-Chirp3-HD-Fenrir',
              shop: 'ko-KR-Chirp3-HD-Zephyr',
              interior: 'ko-KR-Chirp3-HD-Algieba'
            };
            const indPreferredId = hasChirp ? (indChirpMap[indKey] || 'ko-KR-Chirp3-HD-Puck') : '';
            const curInList = selectable.some((v) => v.id === this.ttsVoice);
            const shouldUsePreferred = this.ttsVoice !== 'off' && (this.defaultVoicePending || !curInList);
            const premium = selectable.find(v => v.preferred && this.isFishVoice(v.id));
            const preferred = shouldUsePreferred
              ? (premium || selectable.find((v) => v.id === indPreferredId) || selectable.find((voice) => voice.preferred) || selectable[0])
              : null;
            this.restoreVoice(preferred?.id || (curInList ? this.ttsVoice : 'off'));
            this.voiceListLoaded = true;
            if (select.__igRow) arSyncIgSelects(select.parentElement);
          } catch (error) {
            // 목록을 받지 못했으면 현재 성우를 사용하고, 다음에 목록을 다시 조회합니다.
          } finally {
            if (revision === this.voiceListRevision) {
              this.defaultVoicePending = false;
              this.voiceListRequest = null;
            }
          }
        })();
        return this.voiceListRequest;
      },

      // Fish Audio 요청은 한 번에 2개까지만 보냄 (한꺼번에 몰리면 일부가 거절되어 음성이 빠짐)
      ttsActive: 0,
      ttsWaiters: [],
      async runTtsRequest(fn) {
        if (this.ttsActive >= 2) await new Promise((resolve) => this.ttsWaiters.push(resolve));
        this.ttsActive++;
        try {
          return await fn();
        } finally {
          this.ttsActive--;
          const next = this.ttsWaiters.shift();
          if (next) next();
        }
      },

      // 문장 하나의 Fish Audio 음성을 받아 AudioBuffer로 디코딩 (성우·문장별 캐시)
      async fetchTtsBuffer(text) {
        if (!arVoiceAllowed()) throw new Error('voice_locked');
        if (this.defaultVoicePending || this.voiceListRequest) await this.loadVoiceList();
        const key = this.ttsKey(text);
        if (this.ttsCache.has(key)) return this.ttsCache.get(key);
        // 대본 전체 녹음이 아직 시작 전이면(대본을 고친 직후 등) 문장별로 따로 녹음하지 않고 전체 녹음을 먼저 시작함
        //   (문장마다 따로 녹음하면 톤·속도가 달라 끊어 읽은 티가 남. 문장별 녹음은 전체 녹음이 실패했을 때만)
        if (!this.scriptPending && Date.now() >= this.ttsBlockedUntil && this.enabled) this.prefetchTtsBuffers();
        // 대본 전체 녹음이 진행 중이면 그 결과를 기다려 같은 녹음에서 잘라낸 음성을 씀
        if (this.scriptPending) {
          return this.scriptPending.then(() => this.ttsCache.get(key) || this.fetchLineBuffer(text));
        }
        return this.fetchLineBuffer(text);
      },

      // ★ 대본 전체를 한 번에 녹음해 문장별로 잘라 둠 (/api/tts-script)
      //   문장마다 따로 녹음하면 톤·속도·크기가 서로 달라 이어 붙인 티가 나므로,
      //   한 호흡으로 녹음한 하나의 음성에서 컷별 구간만 잘라 씁니다.
      scriptCache: new Map(),
      scriptMasters: new Map(),
      masterKey: '',
      masterWantKey: '',
      scriptPending: null,
      scriptKeyFor(lines) { return `${this.ttsVoice}@${this.ttsSpeed}|${lines.join('\n')}`; },
      useScriptMaster(key) {
        const m = this.scriptMasters.get(key);
        if (!m) return false;
        this.masterBuffer = m.full;
        this.masterPeak = m.peak;
        this.masterDuration = m.full.duration;
        this.masterCutBounds = m.bounds;
        this.masterKey = key;
        return true;
      },
      decodeNarration(ctx, encoded) {
        return ctx.decodeAudioData(Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0)).buffer);
      },
      chirpClipRange(clip) {
        const channels = Array.from({ length: clip.numberOfChannels }, (_, i) => clip.getChannelData(i));
        const block = Math.max(1, Math.round(clip.sampleRate * 0.01));
        const quiet = (start, end) => channels.every((samples) => {
          for (let i = start; i < end; i++) {
            if (Math.abs(samples[i]) > 0.001) return false;
          }
          return true;
        });
        let start = 0;
        let end = clip.length;
        while (end - start >= block && quiet(start, start + block)) start += block;
        while (end - start >= block && quiet(end - block, end)) end -= block;
        if (end - start < block) return { start: 0, end: clip.length };
        // 말머리와 말끝을 보호하면서 컷 경계의 긴 무음만 줄입니다.
        return {
          start: Math.max(0, start - Math.round(clip.sampleRate * 0.05)),
          end: Math.min(clip.length, end + Math.round(clip.sampleRate * 0.10))
        };
      },
      async renderNarrationClips(ctx, clips, speed, trimChirp = false) {
        const sampleRate = ctx.sampleRate;
        const rate = speed >= 0.8 && speed <= 1.5 ? Number(speed) : 1.1;
        const offsets = [0];
        const ranges = clips.map((clip) => trimChirp ? this.chirpClipRange(clip) : { start: 0, end: clip.length });
        for (const { start, end } of ranges) {
          offsets.push(offsets[offsets.length - 1] + Math.max(1, Math.round((end - start) / rate)));
        }
        const channels = Math.max(...clips.map((clip) => clip.numberOfChannels));
        const output = new OfflineAudioContext(channels, offsets[offsets.length - 1], sampleRate);
        clips.forEach((clip, i) => {
          const source = output.createBufferSource();
          source.buffer = clip;
          source.playbackRate.value = rate;
          source.connect(output.destination);
          const duration = (offsets[i + 1] - offsets[i]) / sampleRate;
          source.start(offsets[i] / sampleRate, ranges[i].start / clip.sampleRate, duration * rate);
        });
        return { full: await output.startRendering(), bounds: offsets.map((frame) => frame / sampleRate) };
      },
      async decodeGoogleNarration(ctx, parts, lineCount) {
        if (!Array.isArray(parts) || parts.length === 0) throw new Error('google_tts_invalid_timing');
        const clips = await Promise.all(parts.map((part) => this.decodeNarration(ctx, part.audio_base64)));
        const bounds = [];
        let elapsed = 0;
        for (let i = 0; i < parts.length; i++) {
          const starts = parts[i].starts;
          if (!Array.isArray(starts) || starts[0] !== 0 || starts.some((start, j) =>
            !Number.isFinite(start) || start >= clips[i].duration || (j > 0 && start <= starts[j - 1]))) {
            throw new Error('google_tts_invalid_timing');
          }
          bounds.push(...starts.map((start) => elapsed + start));
          elapsed += clips[i].duration;
        }
        if (bounds.length !== lineCount) throw new Error('google_tts_invalid_timing');
        const full = clips.length === 1 ? clips[0] : (await this.renderNarrationClips(ctx, clips, 1)).full;
        bounds.push(full.duration);
        return { full, bounds };
      },
      fetchScriptNarration(lines) {
        const voice = this.ttsVoice;
        if (!arCanUseAi()) return Promise.reject(new Error('ai_access_required'));
        const speed = this.ttsSpeed;
        const scriptKey = `${voice}@${speed}|${lines.join('\n')}`;
        if (this.scriptCache.has(scriptKey)) return this.scriptCache.get(scriptKey);

        const ctx = this.ensureContext();
        let provider = 'fish';
        const activity = arBeginGeneration('voice', '음성 만드는 중…');
        const job = (async () => {
          if (!ctx) throw new Error('no_audio_context');
          if (!window.location.protocol.startsWith('http')) throw new Error('offline');
          let body, full, exactBounds;
          const url = `/api/tts-script?v=13&provider=fish&speed=${speed}&ref=${encodeURIComponent(voice)}&lines=${encodeURIComponent(JSON.stringify(lines))}`;
          const res = await this.runTtsRequest(() => this.isGoogleVoice(voice) ? fetch('/api/tts-script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ref: voice, speed, lines })
          }) : fetch(url));
          if (!res.ok) {
            let code = `http_${res.status}`;
            try {
              const errBody = await res.json();
              if (errBody && (errBody.error === 'fish_api_key_missing' || this.isTtsServiceError(errBody.error))) code = errBody.error;
              if (errBody && (errBody.error === 'quota_exceeded' || errBody.error === 'service_tts_cap')) {
                code = 'quota';
                if (window.arNotifyQuota) window.arNotifyQuota(errBody.message);
              }
            } catch (e) {}
            throw new Error(code);
          }
          body = await res.json();
          if (body?.model === 'google-wavenet') {
            provider = 'google';
            try {
              ({ full, bounds: exactBounds } = await this.decodeGoogleNarration(ctx, body.parts, lines.length));
            } catch (error) {
              throw new Error(this.isTtsServiceError(error.message) ? error.message : 'google_tts_invalid_audio');
            }
          } else if (body?.model === 'airy-tts-v1' || body?.model === 'google-chirp3-hd') {
            const chirp = body.model === 'google-chirp3-hd';
            provider = chirp ? 'chirp' : 'airy';
            const audioError = chirp ? 'google_tts_invalid_audio' : 'airy_invalid_audio';
            if (!Array.isArray(body.clips_base64) || body.clips_base64.length !== lines.length) {
              throw new Error(audioError);
            }
            try {
              const clips = await Promise.all(body.clips_base64.map((clip) => this.decodeNarration(ctx, clip)));
              // Chirp는 서버에서 말하기 속도를 적용해 오디오를 반환합니다.
              ({ full, bounds: exactBounds } = await this.renderNarrationClips(ctx, clips, chirp ? 1 : speed, chirp));
            } catch (error) { throw new Error(audioError); }
          } else {
            this.noteTtsModel(body && body.model);
            if (!body || !body.audio_base64 || !Array.isArray(body.lines) || body.lines.length !== lines.length) {
              throw new Error('bad_script_response');
            }
            full = await this.decodeNarration(ctx, body.audio_base64);
          }

          // 전체 녹음의 최대 음량 (모든 문장을 같은 배율로 키워 문장 사이 크기를 일정하게 유지)
          const mono = full.getChannelData(0);
          let peak = 0;
          for (let i = 0; i < mono.length; i += 4) {
            const v = Math.abs(mono[i]);
            if (v > peak) peak = v;
          }


          // 문장 경계: 글자 위치로 추정한 경계 근처(±0.4초)에서 실제로 가장 조용한 지점을 찾아 자름
          //   (추정 경계가 말끝·말머리에 걸리면 문장 끝 발음이 잘리거나 다음 문장 첫 소리가 섞임)
          const sr = full.sampleRate;
          const win = Math.max(1, Math.floor(sr * 0.06));
          const rmsAt = (t) => {
            const a = Math.max(0, Math.floor(t * sr) - (win >> 1));
            const b = Math.min(mono.length, a + win);
            let s = 0;
            for (let k = a; k < b; k++) s += mono[k] * mono[k];
            return Math.sqrt(s / Math.max(1, b - a));
          };
          const quietest = (center, lo, hi) => {
            let best = center;
            let bestV = Infinity;
            for (let t = Math.max(lo, 0); t <= Math.min(hi, full.duration); t += 0.01) {
              const v = rmsAt(t) + Math.abs(t - center) * 0.002;
              if (v < bestV) {
                bestV = v;
                best = t;
              }
            }
            return best;
          };
          const bounds = exactBounds || [Math.max(0, body.lines[0].start - 0.08)];
          for (let i = 0; !exactBounds && i < lines.length - 1; i++) {
            // Fish 시각 정보는 문장 마지막 낱말을 짧게 잡는 경향이 있어 (예: 실제보다 0.5초 일찍 끝남)
            // 추정 경계보다 뒤쪽을 더 넓게(최대 1초) 살펴 실제 숨 쉬는 자리를 찾음
            const mid = (body.lines[i].end + body.lines[i + 1].start) / 2;
            const lo = Math.max(bounds[i] + 0.3, mid - 0.25);
            const hi = Math.min(full.duration - 0.1, mid + 1.0, body.lines[i + 1].end - 0.4);
            bounds.push(lo < hi ? quietest(mid, lo, hi) : mid);
          }
          // 마지막 문장은 녹음 끝까지 (말끝 여운이 잘리지 않게)
          if (!exactBounds) bounds.push(full.duration);
          // ★ 원테이크 마스터 오디오: 대본별로 보관하고, 지금 대본의 녹음일 때만 재생용으로 씀
          //   (예전에는 나중에 끝난 녹음이 무조건 재생용이 되어, 업종이 정해지기 전 자동차 대본 녹음이
          //    늦게 도착하면 미용실 영상 첫머리에 "쏘렌토…"가 나왔음)
          this.scriptMasters.set(scriptKey, { full, peak, bounds });
          if (this.masterWantKey === scriptKey) this.useScriptMaster(scriptKey);

          lines.forEach((line, i) => {
            const from = Math.max(0, Math.floor(bounds[i] * sr));
            const to = Math.min(full.length, Math.ceil(bounds[i + 1] * sr));
            const len = Math.max(1, to - from);
            const piece = ctx.createBuffer(full.numberOfChannels, len, sr);
            const fadeIn = Math.min(Math.floor(sr * 0.01), Math.floor(len / 4));
            const fadeOut = Math.min(Math.floor(sr * 0.04), Math.floor(len / 4));
            for (let c = 0; c < full.numberOfChannels; c++) {
              const data = full.getChannelData(c).slice(from, to);
              for (let k = 0; k < fadeIn; k++) data[k] *= k / fadeIn;
              for (let k = 0; k < fadeOut; k++) data[len - 1 - k] *= k / fadeOut;
              piece.copyToChannel(data, c);
            }
            piece.__peak = peak;
            piece.__start = 0;
            piece.__len = piece.duration;
            const key = `${voice}@${speed}|${line}`;
            this.ttsCache.set(key, Promise.resolve(piece));
            this.ttsSeconds.set(key, piece.duration);
          });
          return true;
        })();

        this.scriptCache.set(scriptKey, job);
        job.then(
          () => { activity.end(); this.setTtsProvider(provider); },
          (err) => {
            if (this.masterWantKey !== scriptKey) activity.end();
            else activity.fail('성우 연결 실패 · 사운드 설정을 확인해 주세요.');
            this.scriptCache.delete(scriptKey);
            const code = String(err && err.message);
            if (this.isTtsServiceError(code)) {
              this.ttsBlockedUntil = Date.now() + (code === 'airy_credit_exhausted' ? 60000 : 2000);
              this.setTtsProvider('browser', code);
              return;
            }
            if (['fish_api_key_missing', 'http_401', 'http_402', 'offline', 'quota'].includes(code)) {
              this.ttsBlockedUntil = Date.now() + (code === 'quota' ? 600000 : 60000);
              this.setTtsProvider('browser', code);
            }
          }
        );
        return job;
      },

      // 문장 하나만 따로 녹음 (전체 녹음을 쓸 수 없을 때의 대체 경로)
      fetchLineBuffer(text) {
        if (!arCanUseAi()) return Promise.reject(new Error('ai_access_required'));
        const voice = this.ttsVoice;
        const speed = this.ttsSpeed;
        const key = this.ttsKey(text);
        if (this.ttsCache.has(key)) return this.ttsCache.get(key);
        // 키 미설정·크레딧 부족처럼 바로 풀리지 않는 오류는 1분간 재요청하지 않음
        if (Date.now() < this.ttsBlockedUntil) return Promise.reject(new Error(this.ttsLastError || 'blocked'));

        const ctx = this.ensureContext();
        let provider = 'fish';
        const job = (async () => {
          if (!ctx) throw new Error('no_audio_context');
          if (!window.location.protocol.startsWith('http')) throw new Error('offline');
          // v: 서버의 읽기 규칙이 바뀌면 올려서, 예전에 저장된 음성 대신 새 음성을 받게 함
          const version = voice.includes('-Chirp3-HD-') ? 12 : 11;
          const providerParam = this.isFishVoice(voice) ? '&provider=fish' : '';
          const url = `/api/tts?v=${version}&speed=${speed}` + providerParam + (voice !== 'auto' ? `&ref=${encodeURIComponent(voice)}` : '') + `&text=${encodeURIComponent(text)}`;
          let res = await this.runTtsRequest(() => fetch(url));
          if (!res.ok && (res.status === 429 || res.status >= 500) && res.status !== 503) {
            await new Promise((r) => setTimeout(r, 900));
            res = await this.runTtsRequest(() => fetch(url));
          }
          if (!res.ok) {
            let code = `http_${res.status}`;
            try {
              const body = await res.json();
              if (body && (body.error === 'fish_api_key_missing' || this.isTtsServiceError(body.error))) code = body.error;
              if (body && (body.error === 'quota_exceeded' || body.error === 'service_tts_cap')) {
                code = 'quota';
                if (window.arNotifyQuota) window.arNotifyQuota(body.message);
              }
            } catch (e) {}
            throw new Error(code);
          }
          const model = res.headers.get('X-TTS-Model');
          const bytes = await res.arrayBuffer();
          let buffer = await ctx.decodeAudioData(bytes);
          if (model === 'google-wavenet') provider = 'google';
          else if (model === 'google-chirp3-hd') provider = 'chirp';
          else if (model === 'airy-tts-v1') {
            provider = 'airy';
            buffer = (await this.renderNarrationClips(ctx, [buffer], speed)).full;
          } else this.noteTtsModel(model);
          // 앞뒤 무음 구간을 잘라 실제 말하는 구간만 사용 (컷 길이를 불필요하게 늘리지 않도록)
          const data = buffer.getChannelData(0);
          let peak = 0;
          for (let i = 0; i < data.length; i += 4) {
            const v = Math.abs(data[i]);
            if (v > peak) peak = v;
          }
          const threshold = peak * 0.012;
          let first = 0;
          let last = data.length - 1;
          while (first < last && Math.abs(data[first]) < threshold) first++;
          while (last > first && Math.abs(data[last]) < threshold) last--;
          const padHead = Math.floor(buffer.sampleRate * 0.05);
          const padTail = Math.floor(buffer.sampleRate * 0.18);
          first = Math.max(0, first - padHead);
          last = Math.min(data.length - 1, last + padTail);
          buffer.__peak = peak;
          buffer.__start = first / buffer.sampleRate;
          buffer.__len = Math.max(0.2, (last - first) / buffer.sampleRate);
          this.ttsSeconds.set(key, buffer.__len);
          return buffer;
        })();

        this.ttsCache.set(key, job);
        job.then(
          () => this.setTtsProvider(provider),
          (err) => {
            this.ttsCache.delete(key); // 실패는 캐시하지 않아 다음 재생 때 다시 시도
            const code = String(err && err.message);
            if (['fish_api_key_missing', 'http_401', 'http_402', 'offline', 'quota'].includes(code)) {
              this.ttsBlockedUntil = Date.now() + (code === 'quota' ? 600000 : 60000);
            }
            if (this.isTtsServiceError(code) || Date.now() < this.ttsBlockedUntil || !['fish', 'airy', 'google', 'chirp'].includes(this.ttsProvider)) {
              this.setTtsProvider('browser', code);
            }
          }
        );
        return job;
      },

      // 각 컷(0..컷수-1)과 마지막 명함 멘트(컷수)의 성우 음성 길이(초). 아직 모르면 0
      //  - 브라우저 음성으로 대체된 경우에는 글자 수로 어림
      getNarrationSeconds() {
        const totalCuts = getTargetCutCount();
        const out = [];
        for (let i = 0; i <= totalCuts; i++) {
          const text = this.getCutNarration(i);
          let sec = text ? (this.ttsSeconds.get(this.ttsKey(text)) || 0) : 0;
          if (!sec && text && this.ttsProvider === 'browser') {
            sec = text.replace(/[^0-9A-Za-z가-힣]/g, '').length * 0.17 + 0.3;
          }
          out.push(sec);
        }
        return out;
      },

      // 모든 컷 + 마지막 명함 멘트 음성을 미리 받아 두고, 받은 길이에 맞춰 영상 길이를 조정
      // 편집 중(재생 일시정지 상태)에는 크레딧/속도 낭비를 막기 위해 자동 호출하지 않고 재생·발행·내보내기(force) 시 1회만 생성
      prefetchTtsBuffers(force) {
        if (!arCanUseAi()) {
          this.setTtsProvider('browser');
          refitDurationToNarration();
          return Promise.resolve([]);
        }
        // 소리를 켠 사람에게만 성우 녹음을 받음 (소리 꺼 둔 방문자마다 녹음하면 크레딧 낭비). 영상 내보내기·재생 시작은 force
        if (this.ttsVoice === 'off' || !arVoiceAllowed() || (!this.enabled && !force)) {
          refitDurationToNarration();
          return Promise.resolve([]);
        }
        if (!force && (typeof isPlaying === 'undefined' || !isPlaying || (typeof arPreviewPausedForEdit !== 'undefined' && arPreviewPausedForEdit))) {
          this.ttsDirty = true;
          refitDurationToNarration();
          return Promise.resolve([]);
        }
        this.ttsDirty = false;
        if (this.defaultVoicePending || this.voiceListRequest) return this.loadVoiceList().then(() => this.prefetchTtsBuffers(force));
        const totalCuts = getTargetCutCount();
        const lines = [];
        // 본편 컷들(0..totalCuts-1) + 마지막 엔딩 명함 멘트(totalCuts)
        for (let i = 0; i <= totalCuts; i++) {
          const text = this.getCutNarration(i);
          if (text) lines.push(text);
        }
        if (lines.length === 0) return Promise.resolve([]);
        // 지금 대본과 다른 녹음은 바로 내려놓음 (이전 대본 목소리가 새 영상에 섞이지 않게)
        const wantKey = this.scriptKeyFor(lines);
        if (this.scriptPending && this.masterWantKey === wantKey) return this.scriptPending;
        this.masterWantKey = wantKey;
        if ((this.masterKey !== wantKey || !this.masterBuffer) && !this.useScriptMaster(wantKey)) {
          if (this.masterBuffer) this.stopTts && this.stopTts();
          this.masterBuffer = null;
          this.masterCutBounds = null;
          this.masterDuration = 0;
          this.masterKey = '';
        }
        // 예약된 (타이핑 후) 녹음이 있으면 지금 바로 받으므로 취소
        if (this.ttsPrefetchTimer) { clearTimeout(this.ttsPrefetchTimer); this.ttsPrefetchTimer = null; }

        // 1순위: 대본 전체를 한 번에 녹음. 실패하면 문장별 녹음으로 대체
        const perLine = (error) => (this.isTtsServiceError(error?.message || this.ttsLastError) || !arVoiceAllowed() || this.masterWantKey !== wantKey)
          ? Promise.resolve([])
          : Promise.all(lines.map((t) => this.fetchLineBuffer(t).catch(() => null)));
        const job = (Date.now() < this.ttsBlockedUntil ? perLine() : this.fetchScriptNarration(lines).catch(perLine)).then(
          (result) => {
            if (this.scriptPending === job) this.scriptPending = null;
            if (!arVoiceAllowed() || this.masterWantKey !== wantKey) return result;
            refitDurationToNarration();
            // 재생 중에 마스터 음성이 도착하면 즉시 타임라인 현재 시간에 맞춰 재생
            if (isPlaying && this.enabled && this.masterBuffer) {
              const curT = (window.__timelines && window.__timelines['main']) ? (window.__timelines['main'].currentTime || 0) : 0;
              this.playMasterAt(curT);
            }
            return result;
          }
        );
        this.scriptPending = job;
        return job;
      },

      // 대본을 편집하는 동안에는 음성을 자동 생성하지 않고 dirty 표시만 해 둠 (재생·발행·내보내기 시 1회 생성)
      schedulePrefetch() {
        if (this.ttsPrefetchTimer) { clearTimeout(this.ttsPrefetchTimer); this.ttsPrefetchTimer = null; }
        this.ttsDirty = true;
        refitDurationToNarration();
      },

      shouldUseCutSyncedPlayback() {
        // 전체 녹음은 영상 길이와 무관하게 연속 재생. 컷 사이에 대기 시간을 넣지 않음.
        return false;
      },

      playMasterAt(startT = 0) {
        const ctx = this.ensureContext();
        if (!ctx || !this.enabled || !this.masterBuffer || this.ttsVoice === 'off' || !arVoiceAllowed()) return;
        if (this.shouldUseCutSyncedPlayback()) {
          this.stopTts();
          this.lastSpokenCut = -1;
          this.syncWithTimeline(Math.max(0, startT));
          return;
        }
        this.stopTts();
        const dur = this.masterBuffer.duration;
        if (startT >= dur - 0.05) return;
        const src = ctx.createBufferSource();
        src.buffer = this.masterBuffer;
        const g = ctx.createGain();
        g.gain.value = this.masterPeak > 0.01 ? Math.min(4, 0.9 / this.masterPeak) : 1.0;
        src.connect(g);
        g.connect(this.ttsGain);
        src.onended = () => {
          if (this.masterSource === src) {
            this.masterSource = null;
            this.masterSourceGain = null;
          }
        };
        src.start(0, Math.max(0, startT));
        this.masterSource = src;
        this.masterSourceGain = g;
      },

      stopMasterSource() {
        if (this.masterSource) {
          const src = this.masterSource;
          const g = this.masterSourceGain;
          this.masterSource = null;
          this.masterSourceGain = null;
          try {
            if (g && this.ctx) {
              const now = this.ctx.currentTime;
              g.gain.cancelScheduledValues(now);
              g.gain.setValueAtTime(g.gain.value, now);
              g.gain.linearRampToValueAtTime(0.0001, now + 0.05);
              src.stop(now + 0.06);
            } else {
              src.stop();
            }
          } catch (e) {}
        }
      },

      stopTts() {
        this.ttsSpeakToken++;
        this.stopMasterSource();
        if (this.ttsSource) {
          const src = this.ttsSource;
          const g = this.ttsSourceGain;
          this.ttsSource = null;
          this.ttsSourceGain = null;
          try {
            if (g && this.ctx) {
              const now = this.ctx.currentTime;
              g.gain.cancelScheduledValues(now);
              g.gain.setValueAtTime(g.gain.value, now);
              g.gain.linearRampToValueAtTime(0.0001, now + 0.06);
              src.stop(now + 0.07);
            } else {
              src.stop();
            }
          } catch (e) {}
        }
        if ('speechSynthesis' in window) {
          try { window.speechSynthesis.cancel(); } catch (e) {}
        }
      },

      playTtsBuffer(buffer, cutIdx) {
        const ctx = this.ctx;
        if (!ctx || !buffer) return;
        this.stopMasterSource();
        if (this.ttsSource) {
          const prevSrc = this.ttsSource;
          const prevG = this.ttsSourceGain;
          this.ttsSource = null;
          this.ttsSourceGain = null;
          try {
            if (prevG) {
              const now0 = ctx.currentTime;
              prevG.gain.cancelScheduledValues(now0);
              prevG.gain.setValueAtTime(prevG.gain.value, now0);
              prevG.gain.linearRampToValueAtTime(0.0001, now0 + 0.04);
              prevSrc.stop(now0 + 0.05);
            } else {
              prevSrc.stop();
            }
          } catch (e) {}
        }
        const src = ctx.createBufferSource();
        const g = ctx.createGain();
        src.buffer = buffer;

        // 문장이 컷 길이보다 조금 길면 살짝 빠르게 읽어 컷 안에 맞춤 (최대 1.12배)
        const totalCuts = getTargetCutCount();
        const mainDur = getMainDuration();
        const slotDur = cutIdx < totalCuts ? getCutLengths()[cutIdx] : OUTRO_DURATION;
        const speechLen = typeof buffer.__len === 'number' ? buffer.__len : buffer.duration;
        const fit = speechLen / Math.max(0.5, slotDur - 0.1);
        const rate = Math.min(1.12, Math.max(1.0, fit));
        src.playbackRate.value = rate;

        // 성우 음량 자동 보정: 음성마다 녹음 크기가 달라 BGM에 묻히지 않게 최대 음량 기준으로 맞춤 (최대 4배)
        if (typeof buffer.__peak !== 'number') {
          let peak = 0;
          for (let c = 0; c < buffer.numberOfChannels; c++) {
            const data = buffer.getChannelData(c);
            for (let i = 0; i < data.length; i += 8) {
              const v = Math.abs(data[i]);
              if (v > peak) peak = v;
            }
          }
          buffer.__peak = peak;
        }
        const targetGain = buffer.__peak > 0.01 ? Math.min(4, 0.9 / buffer.__peak) : 1.0;
        const startOffset = buffer.__start || 0;
        const playDur = Math.min(Math.max(0.2, buffer.duration - startOffset), speechLen + 0.12);
        const realDur = playDur / rate;
        const now = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(targetGain, now + 0.015);
        if (realDur > 0.08) {
          g.gain.setValueAtTime(targetGain, now + realDur - 0.035);
          g.gain.linearRampToValueAtTime(0.0001, now + realDur);
        }
        src.connect(g);
        g.connect(this.ttsGain);
        src.onended = () => {
          if (this.ttsSource === src) {
            this.ttsSource = null;
            this.ttsSourceGain = null;
          }
        };
        src.start(now, startOffset, playDur);
        this.ttsSource = src;
        this.ttsSourceGain = g;
      },

      speakWithBrowserVoice(text) {
        if (!('speechSynthesis' in window) || !arVoiceAllowed()) return;
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(window.__koSpeech ? window.__koSpeech(text) : text);
          utter.lang = 'ko-KR';
          const voices = window.speechSynthesis.getVoices() || [];
          const koVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().includes('ko'));
          if (koVoices.length > 0) {
            utter.voice = (this.ttsVoice === 'male' && koVoices.length > 1) ? koVoices[koVoices.length - 1] : koVoices[0];
          }
          utter.pitch = this.ttsVoice === 'male' ? 0.86 : this.ttsVoice === 'energetic' ? 1.12 : 1.04;
          utter.rate = this.ttsVoice === 'energetic' ? 1.25 : 1.15;
          utter.volume = 1.0;
          window.speechSynthesis.speak(utter);
        } catch (e) {}
      },

      speakCutLine(cutIdx, forceSpeak = false) {
        if ((!this.enabled && !forceSpeak) || this.ttsVoice === 'off' || !arVoiceAllowed()) return;
        if (!forceSpeak && this.lastSpokenCut === cutIdx) return;
        this.lastSpokenCut = cutIdx;

        const text = this.getCutNarration(cutIdx);
        this.stopTts();
        if (!text) return;

        const ctx = this.ensureContext();
        const token = this.ttsSpeakToken;

        // 다음 컷 음성도 미리 받아 두어 컷이 넘어갈 때 지연 없이 재생
        const nextIdx = cutIdx < getTargetCutCount() ? cutIdx + 1 : 0;
        const nextText = this.getCutNarration(nextIdx);
        if (nextText && nextText !== text) this.fetchTtsBuffer(nextText).catch(() => {});
        const ctxReady = (ctx && ctx.state !== 'running') ? ctx.resume().catch(() => {}) : Promise.resolve();

        Promise.all([this.fetchTtsBuffer(text), ctxReady]).then(
          ([buffer]) => {
            // 음성을 받는 사이 다른 컷으로 넘어갔거나 사운드를 껐으면 재생하지 않음
            if (token !== this.ttsSpeakToken) return;
            if (!this.enabled && !forceSpeak) return;
            // 기다리는 사이 한 호흡 녹음이 도착해 연속 재생 중이면 컷 조각은 겹쳐 틀지 않음
            if (this.masterBuffer && !this.shouldUseCutSyncedPlayback() && isPlaying && !forceSpeak) return;
            this.playTtsBuffer(buffer, cutIdx);
          },
          () => {
            if (token !== this.ttsSpeakToken) return;
            // 키 미설정·크레딧 부족 등 Fish Audio를 아예 못 쓸 때만 브라우저 음성으로 대체.
            // 한 문장만 일시적으로 실패한 경우에는 다른 목소리가 섞이지 않게 그 컷은 건너뜀
            if (Date.now() < this.ttsBlockedUntil) this.speakWithBrowserVoice(text);
          }
        );
      },

      // 재생/일시정지 전환 시 불러온 음원과 성우 음성도 함께 멈추고 이어 재생
      onPlayStateChange(playing) {
        if (!this.enabled || (playing && arEditSheetOpen)) return;
        if (playing) {
          if (this.bgmStyle === 'custom_mp3' && this.customBgmAudioEl) {
            this.customBgmAudioEl.play().catch(() => {});
          }
          const curT = (window.__timelines && window.__timelines['main']) ? (window.__timelines['main'].currentTime || 0) : 0;
          if (this.masterBuffer) {
            this.playMasterAt(curT);
          } else {
            this.lastSpokenCut = -1;
            const mainDur = getMainDuration();
            const totalCuts = getTargetCutCount();
            const slot = curT < mainDur ? getCutIndexAt(curT) : totalCuts;
            this.speakCutLine(slot, false);
          }
        } else {
          if (this.customBgmAudioEl) {
            try { this.customBgmAudioEl.pause(); } catch (e) {}
          }
          this.stopTts();
        }
      },

      // ---------- 장면 효과음: plinkfx (CC0 274종) + 내장 WebAudio 폴백 ----------
      sfxMode: (() => { try { return localStorage.getItem('autoreels_sfx') || 'scene'; } catch (e) { return 'scene'; } })(),
      lastSfxSlot: -2,
      lastSfxTime: -1,
      librarySfx: new Map(),
      librarySfxLoads: new Map(),

      loadLibrarySfx(id) {
        if (!this.ctx) return Promise.resolve(null);
        if (this.librarySfx.has(id)) return Promise.resolve(this.librarySfx.get(id));
        if (this.librarySfxLoads.has(id)) return this.librarySfxLoads.get(id);
        const abort = new AbortController();
        const timeout = setTimeout(() => abort.abort(), 5000);
        const request = fetch('/assets/sfx/' + id + '.wav', { signal: abort.signal })
          .then(response => {
            if (!response.ok) throw new Error('Effect unavailable');
            return response.arrayBuffer();
          })
          .then(data => this.ctx.decodeAudioData(data))
          .then(buffer => {
            this.librarySfx.set(id, buffer);
            return buffer;
          })
          .catch(() => null)
          .finally(() => {
            clearTimeout(timeout);
            this.librarySfxLoads.delete(id);
          });
        this.librarySfxLoads.set(id, request);
        return request;
      },

      selectedSceneSfx(slot, total) {
        if (AR_LIBRARY_EFFECTS.has(this.sfxMode)) return this.sfxMode;
        if (this.sfxMode !== 'scene') return null;
        const caption = (campaign.cutCaptions || [])[slot] || '';
        const bgm = document.getElementById('bgmStyleSelect')?.value;
        return arAutomaticSfx(slot, total, getActiveDesign()?.cat, caption, AR_BGM_META[bgm]?.[0]);
      },

      prepareSceneSfx() {
        const total = getTargetCutCount();
        const count = total + (OUTRO_DURATION > 0 ? 1 : 0);
        const ids = new Set(Array.from({ length: count }, (_, slot) => this.selectedSceneSfx(slot, total)).filter(Boolean));
        return Promise.all([...ids].map(id => this.loadLibrarySfx(id)));
      },

      playLibrarySfx(id, when) {
        const buffer = this.librarySfx.get(id);
        if (!buffer) return false;
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = 0.38;
        source.connect(gain);
        gain.connect(this.sfxOut());
        source.start(when);
        return true;
      },
      plinkfx: null,
      _plinkPromise: null,
      _plinkCache: {},
      _plinkVariant: {},
      loadPlinkfx() {
        if (this.plinkfx) return Promise.resolve(this.plinkfx);
        if (this._plinkPromise) return this._plinkPromise;
        this._plinkPromise = import('https://cdn.jsdelivr.net/npm/plinkfx@0.3.0/dist/index.js')
          .then((mod) => {
            this.plinkfx = mod;
            return mod;
          })
          .catch(() => null);
        return this._plinkPromise;
      },
      playPlink(name, opts = {}) {
        const ctx = this.ctx;
        if (!ctx || !this.plinkfx || typeof this.plinkfx.render !== 'function') return false;
        try {
          const prevVar = this._plinkVariant[name];
          const variant = opts.variant !== undefined
            ? opts.variant
            : (prevVar === undefined ? 0 : (prevVar + 1) % 4);
          this._plinkVariant[name] = variant;
          const cacheKey = `${name}:${variant}:${ctx.sampleRate}`;
          let buf = this._plinkCache[cacheKey];
          if (!buf) {
            const samples = this.plinkfx.render(name, { sampleRate: ctx.sampleRate, variant });
            if (!samples || !samples.length) return false;
            buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
            buf.getChannelData(0).set(samples);
            this._plinkCache[cacheKey] = buf;
          }
          const src = ctx.createBufferSource();
          src.buffer = buf;
          if (opts.rate && Number.isFinite(opts.rate)) src.playbackRate.value = opts.rate;
          const g = ctx.createGain();
          g.gain.value = typeof opts.gain === 'number' ? opts.gain : 0.36;
          src.connect(g);
          g.connect(this.sfxOut());
          const when = typeof opts.when === 'number' ? opts.when : ctx.currentTime + 0.01;
          src.start(when);
          return true;
        } catch (e) {
          return false;
        }
      },
      previewSfxMode(mode) {
        if (!mode || mode === 'off') return;
        const ctx = this.ensureContext();
        if (!ctx) return;
        const total = getTargetCutCount();
        const time = window.__timelines.main.currentTime;
        const slot = time < getMainDuration() ? getCutIndexAt(time) : OUTRO_DURATION > 0 ? total : total - 1;
        const id = this.selectedSceneSfx(slot, total);
        if (id) {
          this.prepareSceneSfx();
          this.loadLibrarySfx(id).then(() => {
            if (this.sfxMode === mode) this.playSceneSfx(slot, total);
          });
          return;
        }
        const run = () => {
          if (this.sfxMode !== mode) return;
          const map = {
            'scene': 'pop',
            'whoosh': 'whoosh',
            'ka-ching': 'ka-ching',
            'impact': 'hit-heavy',
            'sparkle': 'sparkle',
            'pop': 'pop',
            'shutter': 'card-flip',
            'boost': 'boost',
            'tick': 'tick',
            'drop': 'water-drop'
          };
          const plinkName = map[mode] || 'pop';
          if (this.playPlink(plinkName, { gain: 0.38 })) return;
          const when = ctx.currentTime + 0.02;
          if (mode === 'whoosh') return this.sfxWhoosh(when);
          if (mode === 'shutter') return this.sfxShutter(when);
          if (mode === 'impact') return this.sfxImpact(when);
          if (mode === 'tick') return this.sfxTick(when);
          if (mode === 'drop') return this.sfxDrop(when);
          if (mode === 'ka-ching' || mode === 'sparkle') return this.sfxChime(when);
          return this.sfxPop(when);
        };
        if (this.plinkfx) run();
        else this.loadPlinkfx().then(run);
      },
      sfxOut() {
        if (!this.sfxGain) {
          this.sfxGain = this.ctx.createGain();
          this.sfxGain.connect(this.masterGain);
        }
        // 나레이션이 없을 때(배경음악만 재생 시) 효과음이 튀지 않도록 게인을 자동 낮춤
        const hasNarration = this.ttsVoice && this.ttsVoice !== 'off';
        this.sfxGain.gain.value = hasNarration ? 0.55 : 0.26;
        return this.sfxGain;
      },
      sfxNoiseBuf(dur = 0.25) {
        const ctx = this.ctx;
        const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
        return buf;
      },
      sfxTone(when, f0, f1, dur, gain, type = 'sine', glide = 0.04) {
        const ctx = this.ctx;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f0, when);
        o.frequency.exponentialRampToValueAtTime(f1, when + glide);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(gain, when + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        o.connect(g); g.connect(this.sfxOut());
        o.start(when); o.stop(when + dur + 0.02);
      },
      // 바람 스윕 (Whoosh)
      sfxWhoosh(when, gain = 0.2) {
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = this.sfxNoiseBuf(0.24);
        const flt = ctx.createBiquadFilter();
        flt.type = 'bandpass';
        flt.Q.value = 1.6;
        flt.frequency.setValueAtTime(320, when);
        flt.frequency.exponentialRampToValueAtTime(2400, when + 0.09);
        flt.frequency.exponentialRampToValueAtTime(480, when + 0.22);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(gain, when + 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
        src.connect(flt); flt.connect(g); g.connect(this.sfxOut());
        src.start(when); src.stop(when + 0.24);
      },
      // 카메라 셔터 (Shutter)
      sfxShutter(when, gain = 0.18) {
        const ctx = this.ctx;
        [0, 0.045].forEach((off, idx) => {
          const t0 = when + off;
          const src = ctx.createBufferSource();
          src.buffer = this.sfxNoiseBuf(0.035);
          const flt = ctx.createBiquadFilter();
          flt.type = 'highpass';
          flt.frequency.setValueAtTime(idx === 0 ? 1800 : 1200, t0);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(gain * (idx === 0 ? 1 : 0.75), t0 + 0.003);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
          src.connect(flt); flt.connect(g); g.connect(this.sfxOut());
          src.start(t0); src.stop(t0 + 0.035);
        });
      },
      // 펀치 임팩트 (Impact)
      sfxImpact(when, gain = 0.26) {
        this.sfxTone(when, 150, 38, 0.18, gain, 'sine', 0.14);
        this.sfxTone(when, 420, 95, 0.045, gain * 0.45, 'triangle', 0.03);
      },
      // 깔끔한 UI 틱 (Tick)
      sfxTick(when, gain = 0.16) {
        this.sfxTone(when, 1900, 620, 0.032, gain, 'triangle', 0.022);
      },
      // 부드러운 카드 스와이프 (Swipe)
      sfxSwipe(when, gain = 0.14) {
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = this.sfxNoiseBuf(0.14);
        const flt = ctx.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(900, when);
        flt.frequency.exponentialRampToValueAtTime(2800, when + 0.12);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(gain, when + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.13);
        src.connect(flt); flt.connect(g); g.connect(this.sfxOut());
        src.start(when); src.stop(when + 0.15);
      },
      // 톡 튀는 팝
      sfxPop(when, gain = 0.18) {
        this.sfxTone(when, 320, 880, 0.07, gain, 'triangle', 0.025);
      },
      // 똑 떨어지는 물방울
      sfxDrop(when, gain = 0.18) {
        this.sfxTone(when, 620, 1650, 0.14, gain, 'sine', 0.06);
      },
      // 가격·혜택 장면: 맑은 두 음
      sfxChime(when, gain = 0.12) {
        this.sfxTone(when, 1318.5, 1318.5, 0.5, gain, 'sine', 0.01);
        this.sfxTone(when + 0.08, 1975.5, 1975.5, 0.55, gain * 0.8, 'sine', 0.01);
      },
      // 마지막 명함 장면: 올라가는 반짝임
      sfxSparkle(when, gain = 0.08) {
        [1046.5, 1318.5, 1568, 2093].forEach((hz, i) => this.sfxTone(when + i * 0.055, hz, hz, 0.3, gain, 'sine', 0.01));
      },
      playSceneSfx(slot, totalCuts) {
        const when = this.ctx.currentTime + 0.01;
        const id = this.selectedSceneSfx(slot, totalCuts);
        if (id) {
          if (this.playLibrarySfx(id, when)) return;
          this.loadLibrarySfx(id);
          const fallbacks = {
            transition: 'sfxWhoosh', impact: 'sfxImpact', click: 'sfxTick', sparkle: 'sfxSparkle',
            camera: 'sfxShutter', deal: 'sfxChime', outro: 'sfxSparkle', texture: 'sfxSwipe'
          };
          return this[fallbacks[AR_LIBRARY_EFFECTS.get(id).family]](when);
        }
        if (this.sfxMode === 'whoosh') return this.playPlink('whoosh', { when, gain: 0.36 }) || this.sfxWhoosh(when);
        if (this.sfxMode === 'ka-ching') return this.playPlink('ka-ching', { when, gain: 0.36 }) || this.sfxChime(when);
        if (this.sfxMode === 'shutter') return this.playPlink('card-flip', { when, gain: 0.36 }) || this.sfxShutter(when);
        if (this.sfxMode === 'impact') return this.playPlink('hit-heavy', { when, gain: 0.34 }) || this.sfxImpact(when);
        if (this.sfxMode === 'sparkle') return this.playPlink('sparkle', { when, gain: 0.34 }) || this.sfxSparkle(when);
        if (this.sfxMode === 'pop') return this.playPlink('pop', { when, gain: 0.38 }) || this.sfxPop(when);
        if (this.sfxMode === 'boost') return this.playPlink('boost', { when, gain: 0.32 }) || this.sfxWhoosh(when);
        if (this.sfxMode === 'tick') return this.playPlink('tick', { when, gain: 0.38 }) || this.sfxTick(when);
        if (this.sfxMode === 'drop') return this.playPlink('water-drop', { when, gain: 0.38 }) || this.sfxDrop(when);

      },
      handleSceneSfx(t) {
        if (this.sfxMode === 'off' || !this.ctx) return;
        const mainDur = getMainDuration();
        const totalCuts = getTargetCutCount();
        const slot = t < mainDur ? getCutIndexAt(t) : OUTRO_DURATION > 0 ? totalCuts : totalCuts - 1;
        const dt = t - this.lastSfxTime;
        this.lastSfxTime = t;
        const moving = dt > 0 && dt < 0.6;
        if (slot === this.lastSfxSlot) return;
        this.lastSfxSlot = slot;
        if (!moving && !(t < 0.2 && slot === 0)) return; // 이리저리 넘겨 볼 때는 소리 없이
        this.playSceneSfx(slot, totalCuts);
        if (slot + 1 < totalCuts || (slot < totalCuts && OUTRO_DURATION > 0)) {
          const nextId = this.selectedSceneSfx(slot + 1, totalCuts);
          if (nextId) this.loadLibrarySfx(nextId);
        }
      },

      syncWithTimeline(t) {
        if (!this.enabled || !isPlaying || arEditSheetOpen) return;
        try { this.handleSceneSfx(t); } catch (e) {}
        if (!arVoiceAllowed()) return;
        // 1. 본편 길이가 음성과 딱 맞을 때는 원테이크 마스터 음성을 끊김 없이 연속 재생
        if (this.masterBuffer && !this.shouldUseCutSyncedPlayback()) {
          // 타임라인이 끝에 도달하여 0초로 루프되거나 처음으로 감긴 경우 마스터 트랙 재시작
          if (t < 0.15 && this.lastTimelineT > 1.0) {
            this.playMasterAt(0);
          }
          this.lastTimelineT = t;
          return;
        }
        this.lastTimelineT = t;
        // 전체 대본 원테이크 녹음이 진행 중이면 컷별 중복 /api/tts 호출 및 음성 겹침 방지
        if (this.scriptPending) return;

        // 2. 개별 문장 또는 컷별 여유 배치(예: 20초/30초에서 각 컷 시작 시 해당 컷 음성을 정확히 재생)
        const mainDur = getMainDuration();
        const totalCuts = getTargetCutCount();
        const slot = t < mainDur ? getCutIndexAt(t) : totalCuts;
        if (slot !== this.lastSpokenCut) {
          this.speakCutLine(slot, false);
        }
      }
    };

    const arGenerationTasks = new Map();
    function arBeginGeneration(kind, label) {
      const task = { label, error: false };
      const render = () => {
        const items = Array.from(arGenerationTasks.values());
        const shown = items.filter(t => !t.error).at(-1) || items.at(-1);
        document.querySelectorAll('[data-generation-status]').forEach(el => {
          el.hidden = !shown;
          el.toggleAttribute('data-error', Boolean(shown?.error));
          const text = el.querySelector('span');
          if (text.textContent !== (shown?.label || '')) text.textContent = shown?.label || '';
        });
      };
      arGenerationTasks.delete(kind);
      arGenerationTasks.set(kind, task);
      render();
      const end = () => {
        if (arGenerationTasks.get(kind) !== task) return;
        arGenerationTasks.delete(kind);
        render();
      };
      return {
        update(message) { task.label = message; render(); },
        end,
        fail(message) { task.label = message; task.error = true; render(); setTimeout(end, 6000); }
      };
    }

    function arIsLegacyDeviceVoice(voice) {
      return /^device-(?:[FM][1-5]|voxcpm2)$/.test(voice);
    }

    // 지난번에 고른 성우를 다시 선택
    try {
      const savedVoice = localStorage.getItem('autoreels_tts_voice');
      const voiceSel = document.getElementById('ttsVoiceSelect');
      if (savedVoice && (arIsLegacyDeviceVoice(savedVoice) || AudioEngine.isGoogleVoice(savedVoice) || AudioEngine.isFishVoice(savedVoice) || Array.from(voiceSel?.options || []).some((o) => o.value === savedVoice))) {
        AudioEngine.restoreVoice(savedVoice);
      }
    } catch (e) {}

    // 브라우저 자동재생 정책 대응: 화면을 처음 터치/클릭하는 순간 오디오 엔진 잠금 해제
    ['pointerdown', 'touchend', 'keydown'].forEach((evt) => {
      document.addEventListener(evt, () => {
        if (AudioEngine.ctx && AudioEngine.ctx.state !== 'running') {
          AudioEngine.ctx.resume().catch(() => {});
        }
      }, { passive: true });
    });

    // 사용자가 릴스·숏츠 MP3/오디오 파일 업로드 시 호출
    function handleCustomBgmUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      AudioEngine.loadCustomBgmFile(file);
    }

    // 특정 컷의 성우 음성을 즉시 테스트 발화
    function testCutTts(cutIdx) {
      if (!AudioEngine.enabled) {
        toggleAudioMaster(true);
      }
      const mainDur = getMainDuration();
      const totalCuts = getTargetCutCount();
      const seekT = cutIdx < totalCuts ? (getCutStart(cutIdx) + 0.1) : (mainDur + 0.1);
      window.__timelines['main'].seek(seekT);
      AudioEngine.speakCutLine(cutIdx, true);
    }

    function testCurrentCutTtsNow() {
      const t = window.__timelines['main'].currentTime || 0;
      const mainDur = getMainDuration();
      const totalCuts = getTargetCutCount();
      const slot = t < mainDur ? getCutIndexAt(t) : totalCuts;
      testCutTts(slot);
    }

    function arResetAndRebuildNarration(immediate = false) {
      if (typeof AudioEngine === 'undefined') return;
      arPauseForStudioEdit();
      AudioEngine.stopTts();
      AudioEngine.masterWantKey = '';
      AudioEngine.masterKey = '';
      AudioEngine.masterBuffer = null;
      AudioEngine.masterCutBounds = null;
      AudioEngine.masterDuration = 0;
      AudioEngine.lastSpokenCut = -1;
      AudioEngine.scriptPending = null;
      AudioEngine.ttsDirty = true;
      if (AudioEngine.ttsPrefetchTimer) { clearTimeout(AudioEngine.ttsPrefetchTimer); AudioEngine.ttsPrefetchTimer = null; }
      refitDurationToNarration();
      // 편집 중에는 음성을 자동 호출하지 않음 (명시적 'play' 요청 시에만 1회 생성)
      if (immediate === 'play') {
        return AudioEngine.prefetchTtsBuffers(true);
      }
    }

    // 첫 클릭·타이핑만으로 갑자기 배경음악/음성이 켜지지 않도록, 재생·사운드 버튼이나 프리뷰 캔버스 클릭 시에만 오디오를 켬
    (function setupAutoUnlockNarration() {
      const unlock = (ev) => {
        if (window.__arUserMuted || AudioEngine.enabled) return;
        const t = ev && ev.target;
        if (!t || typeof t.closest !== 'function') return;
        if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
        if (!t.closest('#reelCanvas, #arPreviewPopCanvas, #playPauseBtn, #arPreviewPopPlayBtn')) return;
        toggleAudioMaster(true);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
    })();

    function toggleAudioMaster(forceState) {
      AudioEngine.enabled = typeof forceState === 'boolean' ? forceState : !AudioEngine.enabled;
      if (AudioEngine.enabled) window.__arUserMuted = false;
      else if (typeof forceState !== 'boolean' || forceState === false) window.__arUserMuted = true;
      const btn = document.getElementById('soundToggleBtn');
      const dot = document.getElementById('soundDot');
      const lbl = document.getElementById('soundToggleLabel');

      if (AudioEngine.enabled) {
        const ctx = AudioEngine.ensureContext();
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
        AudioEngine.prepareSceneSfx();
        AudioEngine.lastSpokenCut = -1;
        AudioEngine.loadVoiceList();
        const activePlay = typeof isPlaying !== 'undefined' && isPlaying &&
          (typeof arPreviewPausedForEdit === 'undefined' || !arPreviewPausedForEdit) &&
          (typeof arEditSheetOpen === 'undefined' || !arEditSheetOpen);
        if (activePlay) {
          AudioEngine.startBgmLoop();
          AudioEngine.prefetchTtsBuffers(true);
          AudioEngine.syncWithTimeline(window.__timelines['main'].currentTime);
        }
        if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-[#4cc38a]';
        if (lbl) lbl.textContent = '사운드 켜짐';
        if (btn) {
          btn.className = 'btn-secondary h-9 px-2.5 text-[12px] cursor-pointer flex items-center justify-center gap-1.5 border-[#4cc38a] text-[#ededed]';
        }
      } else {
        AudioEngine.stopBgmLoop();
        AudioEngine.stopTts();
        refitDurationToNarration();
        if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-[#85858b]';
        if (lbl) lbl.textContent = '사운드 켜기';
        if (btn) {
          btn.className = 'btn-secondary h-9 px-2.5 text-[12px] cursor-pointer flex items-center justify-center gap-1.5';
        }
      }
    }

    // 서버의 영어 오류 문구(요금 한도 등)를 손님에게 그대로 보여 주지 않음
    function arFriendlyBgmError(err, fellBack) {
      const m = String((err && err.message) || '');
      if (m === '가입 후 7일 무료 AI 체험이 끝났어요.') return m;
      const why = /rate|quota|limit|429|exceeded/i.test(m) ? '지금 AI 음악을 만드는 사람이 많아요. 잠시 뒤 다시 눌러 주세요.'
        : /key|auth|403|401/i.test(m) ? 'AI 음악 만들기를 지금 쓸 수 없어요.'
        : 'AI 음악을 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.';
      return `⚠️ ${why}${fellBack ? ' 지금은 기본 배경음악으로 들려드려요.' : ''}`;
    }

    async function arSelectLyriaBgm(presetId, autoPlay = true) {
      const selected = () => document.getElementById('bgmStyleSelect')?.value === presetId;
      const applyTrack = (url, label) => {
        if (selected()) AudioEngine.loadRemoteBgmUrl(url, label, autoPlay || (isPlaying && AudioEngine.enabled));
      };
      const st = document.getElementById('lyriaBgmStatusText');
      if (st) {
        st.classList.remove('hidden');
        st.textContent = '✨ AI 배경음악 준비 중… (처음 한 번만 10~15초)';
      }
      try {
        if (!window.__arLyriaMap) {
          const lr = await fetch('/api/tts-voices?action=bgm-list').then((r) => r.json()).catch(() => null);
          window.__arLyriaMap = {};
          if (lr && Array.isArray(lr.tracks)) lr.tracks.forEach((t) => { window.__arLyriaMap[t.id] = t; });
        }
        const cached = window.__arLyriaMap[presetId];
        if (cached && cached.url) {
          applyTrack(cached.url, cached.label);
          return;
        }
        if (!arCanUseAi()) throw new Error('ai_access_required');
        if (!window.__arLyriaInflight) window.__arLyriaInflight = new Map();
        let req = window.__arLyriaInflight.get(presetId);
        if (!req) {
          req = fetch('/api/tts-voices?action=generate-bgm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ presetId })
          }).then(async (res) => {
            const data = await res.json();
            if (!res.ok || !data.ok || !data.url) throw new Error(data.message || 'Lyria 생성 실패');
            return data;
          }).finally(() => {
            window.__arLyriaInflight.delete(presetId);
          });
          window.__arLyriaInflight.set(presetId, req);
        }
        const data = await req;
        window.__arLyriaMap[presetId] = { id: presetId, label: data.label, url: data.url };
        applyTrack(data.url, data.label);
      } catch (err) {
        if (!selected()) return;
        if (String(presetId || '').startsWith('lyria_')) {
          const shortId = String(presetId).slice(6).replace(/[^a-z0-9_-]/gi, '');
          const meta = AR_BGM_META[presetId] || [];
          applyTrack(`/assets/bgm/pack/${shortId}.mp3`, meta[1] || shortId);
          return;
        }
        if (st) {
          st.classList.remove('hidden');
          st.textContent = arFriendlyBgmError(err, true);
        }
        AudioEngine.bgmStyle = 'showroom';
        const sel = document.getElementById('bgmStyleSelect');
        if (sel) sel.value = 'showroom';
        if (typeof renderBgmRecommendations === 'function') renderBgmRecommendations();
        if (AudioEngine.enabled) AudioEngine.startBgmLoop();
      }
    }

    function onAudioConfigChange({ autoPlay = true } = {}) {
      const prevVoice = AudioEngine.ttsVoice;
      const prevSpeed = AudioEngine.ttsSpeed;
      const bgmEl = document.getElementById('bgmStyleSelect');
      const ttsEl = document.getElementById('ttsVoiceSelect');
      const pickedBgm = bgmEl ? bgmEl.value : AudioEngine.bgmStyle;
      if (ttsEl && ttsEl.value !== prevVoice) {
        AudioEngine.defaultVoicePending = false;
        AudioEngine.ttsVoice = ttsEl.value;
      }
      const speedEl = document.getElementById('ttsSpeedSelect');
      if (speedEl) AudioEngine.ttsSpeed = Number(speedEl.value) || 1.1;
      try {
        if (ttsEl && ttsEl.value !== 'off' && !AudioEngine.defaultVoicePending) localStorage.setItem('autoreels_tts_voice', ttsEl.value);
      } catch (e) {}

      const voiceChanged = (AudioEngine.ttsVoice !== prevVoice) || (AudioEngine.ttsSpeed !== prevSpeed);
      if (pickedBgm) {
        AudioEngine.userPickedBgm = true;
        try { localStorage.setItem('autoreels_bgm_style', pickedBgm); } catch (e) {}
      }
      if (typeof renderBgmRecommendations === 'function') renderBgmRecommendations(autoPlay);
      const trackId = arBgmPackId(pickedBgm);
      if (trackId) {
        const optLabel = bgmEl && bgmEl.selectedOptions && bgmEl.selectedOptions[0] ? bgmEl.selectedOptions[0].textContent : trackId;
        AudioEngine.loadRemoteBgmUrl(`/assets/bgm/pack/${trackId}.mp3`, optLabel, autoPlay);
        if (voiceChanged && AudioEngine.enabled) arResetAndRebuildNarration();
        return;
      }
      if (String(pickedBgm).startsWith('lyria_')) {
        if (voiceChanged && AudioEngine.enabled) arResetAndRebuildNarration();
        return arSelectLyriaBgm(pickedBgm, autoPlay);
      }
      AudioEngine.bgmStyle = pickedBgm;
      if (!autoPlay) {
        AudioEngine.stopBgmLoop();
        return;
      }
      if (!AudioEngine.enabled) {
        if (voiceChanged) {
          AudioEngine.masterBuffer = null;
          AudioEngine.masterCutBounds = null;
          AudioEngine.masterDuration = 0;
        }
        toggleAudioMaster(true);
        return;
      }

      // 배경음악만 바꿨을 때는 성우 나레이션(masterBuffer)을 건드리지 않고 배경음악만 즉시 교체
      AudioEngine.startBgmLoop();
      if (voiceChanged) {
        arResetAndRebuildNarration();
      }
    }

    // 선택한 성우(Chirp 3 HD 등) 1문장 즉시 미리 듣기 (캐시 재사용)
    const arVoicePreviewCache = new Map();
    let arVoicePreviewAudio = null;
    async function arPreviewSelectedTtsVoice() {
      const btn = document.getElementById('ttsVoicePreviewBtn');
      const sel = document.getElementById('ttsVoiceSelect');
      const voice = (sel && sel.value) || AudioEngine.ttsVoice;
      if (!voice || voice === 'off') {
        if (typeof arToast === 'function') arToast('성우를 먼저 선택해 주세요.');
        return;
      }
      const speed = Number(AudioEngine.ttsSpeed) || 1.1;
      const sampleLine = (typeof campaign !== 'undefined' && Array.isArray(campaign.cutCaptions) && campaign.cutCaptions[0] && String(campaign.cutCaptions[0]).trim().length >= 6)
        ? String(campaign.cutCaptions[0]).trim().slice(0, 60)
        : '안녕하세요, 오늘 준비한 특별한 소식을 가장 깔끔하게 전해드릴게요.';
      const cacheKey = `${voice}@${speed}|${sampleLine}`;
      if (arVoicePreviewAudio) {
        try { arVoicePreviewAudio.pause(); } catch (_) {}
        arVoicePreviewAudio = null;
      }
      if (btn) { btn.disabled = true; btn.textContent = '⏳ 불러오는 중…'; }
      try {
        let blobUrl = arVoicePreviewCache.get(cacheKey);
        if (!blobUrl) {
          const qs = new URLSearchParams({ text: sampleLine, ref: voice, speed: String(speed) });
          if (AudioEngine.isFishVoice(voice)) qs.set('provider', 'fish');
          const res = await fetch('/api/tts?' + qs.toString(), { signal: AbortSignal.timeout(15000) });
          if (!res.ok) throw new Error('미리 듣기를 불러오지 못했습니다.');
          const blob = await res.blob();
          blobUrl = URL.createObjectURL(blob);
          arVoicePreviewCache.set(cacheKey, blobUrl);
        }
        const audio = new Audio(blobUrl);
        arVoicePreviewAudio = audio;
        if (btn) btn.textContent = '🔊 재생 중…';
        audio.onended = () => { if (btn) { btn.disabled = false; btn.textContent = '🎧 미리 듣기'; } };
        audio.onerror = () => { if (btn) { btn.disabled = false; btn.textContent = '🎧 미리 듣기'; } };
        await audio.play();
      } catch (e) {
        if (typeof arToast === 'function') arToast(e.message || '미리 듣기에 실패했습니다.');
        if (btn) { btn.disabled = false; btn.textContent = '🎧 미리 듣기'; }
      }
    }

    function triggerFullAudioPreview() {
      if (arEditSheetOpen) return;
      toggleAudioMaster(true);
      isPlaying = true;
      const ppBtn = document.getElementById('playPauseBtn');
      if (ppBtn) ppBtn.textContent = '⏸ 일시정지';
      window.__timelines['main'].seek(0);
      if (AudioEngine.masterBuffer) {
        AudioEngine.playMasterAt(0);
      } else if (AudioEngine.enabled && !AudioEngine.scriptPending) {
        AudioEngine.prefetchTtsBuffers();
      }
    }

    // 인스타 릴스처럼 현재 대본·주제·업종·디자인 분위기에 맞는 BGM Top 3 추천
    function getRecommendedBgms(limit = 3) {
      const tp = typeof window !== 'undefined' ? window.arTodayTopic : null;
      const text = [
        tp ? [tp.title, tp.why, tp.prompt].filter(Boolean).join(' ') : '',
        typeof campaign !== 'undefined' ? (campaign.topic || '') : '',
        typeof campaign !== 'undefined' ? (campaign.carTitle || '') : '',
        typeof campaign !== 'undefined' && Array.isArray(campaign.cutCaptions) ? campaign.cutCaptions.join(' ') : '',
        typeof campaign !== 'undefined' && Array.isArray(campaign.cutScripts) ? campaign.cutScripts.join(' ') : '',
        (document.getElementById('topicInput') && document.getElementById('topicInput').value) || ''
      ].join(' ');
      const ind = typeof getIndustryId === 'function' ? getIndustryId()
        : (typeof IND !== 'undefined' && IND.key ? (IND.key === 'auto' ? 'car' : IND.key) : 'car');
      const ds = typeof getActiveDesign === 'function' ? getActiveDesign() : null;
      const cat = ds ? (ds.cat || '') : '';

      const scores = new Map();
      const bump = (id, pts, reason) => {
        const cur = scores.get(id) || { id, pts: 0, reason };
        cur.pts += pts;
        if (reason && cur.pts === pts) cur.reason = reason;
        scores.set(id, cur);
      };

      // 1) 내용·분위기 키워드 매칭
      if (/특가|할인|마감|긴급|최저가|선착순|파격|단\s?\d+일|이벤트|폭탄/.test(text)) {
        bump('news', 8, '긴급·특가'); bump('urban', 7, '강렬한 비트'); bump('edm', 6, '텐션 업');
      }
      if (/비|감성|힐링|브이로그|일상|따뜻|소소|산책|주말|오후|여유/.test(text)) {
        bump('lofi', 9, '감성 무드'); bump('vlog', 8, '일상 브이로그'); bump('ballad', 6, '잔잔한 피아노');
      }
      if (/프리미엄|럭셔리|고급|하이엔드|신축|수입|VIP|호텔|라운지/.test(text)) {
        bump('ace_realestate', 9, '고급 라운지'); bump('luxury', 7, '라운지'); bump('jazz', 6, '세련된 재즈');
      }
      if (/카페|커피|디저트|베이커리|브런치|케이크|라떼/.test(text)) {
        bump('ace_cafe', 10, '카페 맞춤'); bump('lofi', 7, '감성'); bump('jazz', 6, '재즈');
      }
      if (/맛집|고기|식당|파스타|초밥|배달|안주|술집/.test(text)) {
        bump('ace_restaurant', 10, '맛집 맞춤'); bump('funk', 7, '경쾌한 그루브'); bump('vlog', 6, '브이로그');
      }
      if (/뷰티|헤어|네일|피부|메이크업|에스테틱|염색|펌/.test(text)) {
        bump('ace_beauty', 10, '뷰티 맞춤'); bump('bright', 8, '트렌디 시티팝'); bump('luxury', 5, '세련됨');
      }
      if (/헬스|PT|다이어트|운동|필라테스|근력|체지방|챌린지/.test(text)) {
        bump('ace_fitness', 10, '운동 에너지'); bump('edm', 8, '업템포'); bump('urban', 7, '파워 비트');
      }
      if (/학원|수업|공부|합격|성적|수능|영어|코딩|강의/.test(text)) {
        bump('ace_academy', 10, '집중·신뢰'); bump('lofi', 7, '로파이'); bump('ballad', 5, '차분함');
      }
      if (/병원|클리닉|치과|시술|진료|교정|임플란트|피부과/.test(text)) {
        bump('ace_clinic', 10, '신뢰감'); bump('luxury', 6, '차분한 라운지'); bump('lofi', 5, '편안함');
      }
      if (/인테리어|시공|리모델링|가구|공간|아파트|분양|매물/.test(text)) {
        bump('ace_interior', 9, '공간 감성'); bump('ace_realestate', 8, '하우스 라운지'); bump('cinema', 6, '웅장함');
      }
      if (/신차|출고|중고차|리스|렌트|드라이브|시승|엔진/.test(text)) {
        bump('ace_showroom', 10, '쇼룸 맞춤'); bump('showroom', 8, '칠 하우스'); bump('drive', 7, '드라이브');
      }
      if (/신상|코디|쇼핑|패션|룩북|세일|오픈/.test(text)) {
        bump('ace_shop', 10, '쇼핑몰 맞춤'); bump('bright', 8, '시티팝'); bump('funk', 6, '그루브');
      }

      // 2) 업종 기본 매칭
      const indDefault = {
        car: ['ace_showroom', 'showroom', 'drive'],
        cafe: ['ace_cafe', 'lofi', 'jazz'],
        restaurant: ['ace_restaurant', 'funk', 'vlog'],
        beauty: ['ace_beauty', 'bright', 'luxury'],
        fitness: ['ace_fitness', 'edm', 'urban'],
        realestate: ['ace_realestate', 'luxury', 'cinema'],
        academy: ['ace_academy', 'lofi', 'ballad'],
        clinic: ['ace_clinic', 'luxury', 'lofi'],
        shop: ['ace_shop', 'bright', 'funk'],
        interior: ['ace_interior', 'luxury', 'lofi']
      }[ind] || ['ace_showroom', 'bright', 'lofi'];
      indDefault.forEach((id, i) => bump(id, 5 - i, '업종 추천'));

      // 3) 디자인 카테고리 매칭
      if (['브이로그', '감성', '손글씨'].includes(cat)) bump('lofi', 4, '디자인 어울림');
      if (['타이포', '특가', '스포츠'].includes(cat)) bump('urban', 4, '디자인 어울림');
      if (['고급', '매거진'].includes(cat)) bump('luxury', 4, '디자인 어울림');

      const LABELS = {
        showroom: 'Chill House 쇼룸', urban: 'Phonk / Trap', bright: 'Upbeat City Pop',
        luxury: 'Luxury Lounge', lofi: 'Lo-fi 감성', vlog: 'Acoustic Pop 브이로그',
        cinema: 'Cinematic 트레일러', drive: 'Synthwave 드라이브', edm: 'EDM 페스티벌',
        funk: 'Funk 그루브', ballad: 'Piano 발라드', news: 'Breaking News', jazz: 'Jazz 라운지',
        ace_showroom: '쇼룸 하우스 (고품질)', ace_cafe: '감성 카페 (고품질)', ace_restaurant: '맛집 그루브 (고품질)',
        ace_beauty: '뷰티 R&B (고품질)', ace_fitness: '피트니스 트랩 (고품질)', ace_realestate: '하우스 라운지 (고품질)',
        ace_academy: '학원 로파이 (고품질)', ace_clinic: '클리닉 앰비언트 (고품질)', ace_shop: '쇼핑몰 시티팝 (고품질)',
        ace_interior: '인테리어 미니멀 (고품질)',
        lyria_showroom: '쇼룸 하우스', lyria_cafe: '카페 보사노바', lyria_restaurant: '맛집 그루브',
        lyria_beauty: '뷰티 R&B', lyria_fitness: '피트니스 트랩', lyria_realestate: '하우스 라운지',
        lyria_academy: '학원 로파이', lyria_clinic: '클리닉 앰비언트', lyria_shop: '쇼핑몰 시티팝',
        lyria_interior: '인테리어 미니멀'
      };
      return Array.from(scores.values())
        .sort((a, b) => b.pts - a.pts)
        .slice(0, limit)
        .flatMap((item, i) => {
          const result = { ...item, label: LABELS[item.id] || item.id };
          const variants = AR_BGM_GENRE_TRACKS.get(AR_BGM_RECOMMEND_GENRES[item.id]);
          if (!variants) return [result];
          const track = variants[(arBgmRecommendationIndex(text + ind + cat) + i) % variants.length];
          return [result, { ...item, id: track.id, label: track.name }];
        })
        .slice(0, limit);
    }

    function applyRecommendedBgm(id) {
      const sel = document.getElementById('bgmStyleSelect');
      if (sel) sel.value = id;
      onAudioConfigChange();
      renderBgmRecommendations();
    }

    // ★ 인스타 음악 고르기처럼: 지금 음악 한 줄 → 누르면 음악 목록(추천이 목록 맨 위에 '추천' 표시와 함께)
    const AR_BGM_META = {
      showroom: ['잔잔', '칠 하우스', '#0ea5e9', '#1e3a8a'], urban: ['신나는', '폰크 · 트랩', '#ef4444', '#111827'],
      bright: ['신나는', '시티팝', '#f59e0b', '#ec4899'], luxury: ['고급', '라운지', '#a16207', '#1c1917'],
      lofi: ['감성', '로파이', '#a78bfa', '#312e81'], vlog: ['감성', '어쿠스틱 팝', '#84cc16', '#14532d'],
      cinema: ['고급', '시네마틱', '#64748b', '#0f172a'], drive: ['신나는', '신스웨이브', '#d946ef', '#1e1b4b'],
      edm: ['신나는', 'EDM', '#22d3ee', '#7c3aed'], funk: ['신나는', '펑크 그루브', '#fb923c', '#7c2d12'],
      ballad: ['감성', '피아노', '#f9a8d4', '#831843'], news: ['잔잔', '뉴스', '#94a3b8', '#1e293b'],
      jazz: ['고급', '재즈', '#d97706', '#422006'],
      lyria_showroom: ['AI 맞춤', '쇼룸 하우스', '#38bdf8', '#0f172a'], lyria_cafe: ['AI 맞춤', '카페 보사노바', '#d6a77a', '#3f2a1d'],
      lyria_restaurant: ['AI 맞춤', '맛집 그루브', '#f97316', '#451a03'], lyria_beauty: ['AI 맞춤', '뷰티 R&B', '#f472b6', '#4a044e'],
      lyria_fitness: ['AI 맞춤', '파워 트랩', '#ef4444', '#0c0a09'], lyria_realestate: ['AI 맞춤', '하우스 라운지', '#cbd5e1', '#1e293b'],
      lyria_academy: ['AI 맞춤', '공부 로파이', '#60a5fa', '#1e1b4b'], lyria_clinic: ['AI 맞춤', '앰비언트', '#5eead4', '#134e4a'],
      lyria_shop: ['AI 맞춤', '쇼핑 시티팝', '#fb7185', '#4c0519'], lyria_interior: ['AI 맞춤', '북유럽 미니멀', '#e7e5e4', '#44403c'],
      ace_showroom: ['신나는', '일렉트로닉 하우스', '#0284c7', '#020617'], ace_cafe: ['감성', '보사노바 · 재즈', '#b45309', '#1c1917'],
      ace_restaurant: ['신나는', '어쿠스틱 그루브', '#ea580c', '#1c0a00'], ace_beauty: ['감성', '트렌디 R&B', '#db2777', '#2e1065'],
      ace_fitness: ['신나는', '파워 트랩', '#dc2626', '#09090b'], ace_realestate: ['고급', '하우스 라운지', '#94a3b8', '#0f172a'],
      ace_academy: ['잔잔', '로파이 비트', '#3b82f6', '#172554'], ace_clinic: ['잔잔', '앰비언트', '#14b8a6', '#042f2e'],
      ace_shop: ['신나는', '시티팝', '#e11d48', '#3f0013'], ace_interior: ['잔잔', '북유럽 미니멀', '#d6d3d1', '#292524'],
      custom_mp3: ['내 음원', '불러온 파일', '#4cc38a', '#064e3b'], off: ['', '음악 없이', '#3f3f46', '#18181b']
    };
    const AR_BGM_MOODS = ['추천', '전체', '신나는', '잔잔', '감성', '고급', 'AI 맞춤'];
    let arBgmMood = '추천';
    function arBgmOptions() {
      const sel = document.getElementById('bgmStyleSelect');
      if (!sel) return [];
      return [...sel.options].filter((o) => !o.classList.contains('hidden')).map((o) => ({ id: o.value, name: o.textContent.trim() }));
    }
    const AR_BGM_COVER_IDS = new Set([
      'showroom', 'cafe', 'restaurant', 'beauty', 'fitness',
      'realestate', 'academy', 'clinic', 'shop', 'interior',
      'urban', 'bright', 'luxury', 'lofi', 'vlog',
      'cinema', 'drive', 'edm', 'funk', 'ballad', 'news', 'jazz',
      ...AR_LIBRARY_MUSIC.keys()
    ]);
    const AR_BGM_RECOMMEND_GENRES = {
      ace_showroom: '신스웨이브', showroom: '시티팝', urban: '트랩', bright: '시티팝', luxury: '재즈·보사노바',
      lofi: '로파이', vlog: '어쿠스틱', cinema: '시네마틱', drive: '신스웨이브', edm: '신스웨이브',
      funk: '펑크', ballad: '피아노', news: '트랩', jazz: '재즈·보사노바',
      ace_cafe: '재즈·보사노바', ace_restaurant: '어쿠스틱', ace_beauty: '시티팝',
      ace_fitness: '트랩', ace_realestate: '시네마틱', ace_academy: '로파이',
      ace_clinic: '앰비언트', ace_shop: '시티팝', ace_interior: '앰비언트'
    };
    const AR_BGM_GENRE_TRACKS = new Map();
    for (const track of AR_LIBRARY_MUSIC.values()) {
      AR_BGM_META[track.id] = [track.mood, track.genre, ...track.colors];
      if (!AR_BGM_GENRE_TRACKS.has(track.genre)) AR_BGM_GENRE_TRACKS.set(track.genre, []);
      AR_BGM_GENRE_TRACKS.get(track.genre).push(track);
    }

    function arBgmRecommendationIndex(text) {
      let hash = 0;
      for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) >>> 0;
      return hash;
    }

    function arBgmPackId(id) {
      const packId = String(id || '').replace(/^ace_/, '');
      return AR_BGM_COVER_IDS.has(packId) ? packId : '';
    }

    function arAppendAudioOptions(select, entries, groupKey) {
      if (!select) return;
      const groups = new Map();
      for (const entry of entries) {
        const label = entry[groupKey];
        if (!groups.has(label)) {
          const group = document.createElement('optgroup');
          group.label = label;
          select.append(group);
          groups.set(label, group);
        }
        groups.get(label).append(new Option(entry.name, entry.id));
      }
    }

    function arBgmCover(id, size) {
      const m = AR_BGM_META[id] || ['', '', '#3f3f46', '#18181b'];
      const packId = String(id || '').replace(/^(ace|lyria)_/, '');
      if (AR_BGM_COVER_IDS.has(packId)) {
        return `<span class="bgm-cover overflow-hidden" style="width:${size}px;height:${size}px;background:linear-gradient(135deg, ${m[2]}, ${m[3]})"><img src="/assets/bgm/pack/${packId}.jpg" alt="" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit" onerror="this.remove()" /></span>`;
      }
      return `<span class="bgm-cover" style="width:${size}px;height:${size}px;background:linear-gradient(135deg, ${m[2]}, ${m[3]})">${id === 'off' ? '✕' : '♪'}</span>`;
    }
    function renderBgmRecommendations(refreshSheet = true) {
      // 예전 '추천:' 칩 줄은 쓰지 않음 → 지금 음악 한 줄만
      const row = document.getElementById('bgmRecommendRow');
      const sel = document.getElementById('bgmStyleSelect');
      if (!row || !sel) return;
      sel.classList.add('hidden');
      const cur = sel.value;
      const opt = arBgmOptions().find((o) => o.id === cur) || { id: cur, name: cur };
      row.className = 'mb-1.5';
      row.innerHTML = `<button type="button" class="bgm-now" onclick="arOpenBgmSheet()">
          ${arBgmCover(cur, 44)}
          <span class="bgm-now-txt"><strong>${opt.name}</strong></span>
          <span class="bgm-now-go">바꾸기 ›</span>
        </button>`;
      const sheet = document.getElementById('arBgmSheet');
      if (refreshSheet && sheet && sheet.style.display === 'flex') arRenderBgmSheet();
    }
    function arOpenBgmSheet() {
      let el = document.getElementById('arBgmSheet');
      if (!el) {
        el = document.createElement('div');
        el.id = 'arBgmSheet';
        el.className = 'ar-modal hidden fixed inset-0 z-[95]';
        el.addEventListener('click', (e) => { if (e.target === el) arCloseBgmSheet(); });
        document.body.appendChild(el);
      }
      arWatchEditSheet(el);
      arBgmMood = '추천';
      arRenderBgmSheet(false);
      el.classList.remove('hidden');
      el.style.display = 'flex';
      arSyncEditSheetPlayback();
    }
    let arBgmListenRequest = 0;
    let arBgmListeningId = '';
    let arBgmListeningAudio = null;
    let arBgmPendingLoad = null;

    function arStopBgmListening() {
      arBgmListenRequest++;
      arBgmListeningAudio?.pause();
      arBgmListeningAudio = null;
      arBgmListeningId = '';
    }

    function arCloseBgmSheet() {
      const el = document.getElementById('arBgmSheet');
      if (el) {
        arStopBgmListening();
        el.classList.add('hidden');
        el.style.display = 'none';
      }
    }
    function arBgmRowState(id, selected) {
      if (!selected) return '▶';
      return id === arBgmListeningId && !arBgmListeningAudio?.paused
        ? '<i class="bgm-eq"><i></i><i></i><i></i></i>'
        : '✓';
    }

    function arSyncBgmSheetSelection() {
      const selected = document.getElementById('bgmStyleSelect')?.value;
      document.querySelectorAll('#arBgmSheet [data-bgm-id]').forEach(row => {
        const id = row.dataset.bgmId;
        const on = id === selected;
        row.classList.toggle('on', on);
        row.setAttribute('aria-pressed', String(on));
        const state = row.querySelector('.bgm-row-state');
        const markup = arBgmRowState(id, on);
        if (state.innerHTML !== markup) state.innerHTML = markup;
      });
    }

    function arRenderBgmSheet(keepScroll = true) {
      const el = document.getElementById('arBgmSheet');
      if (!el) return;
      const scrollTop = keepScroll ? el.querySelector('.bgm-list')?.scrollTop || 0 : 0;
      const sel = document.getElementById('bgmStyleSelect');
      const cur = sel ? sel.value : '';
      const q = (el.querySelector('#arBgmSearch') || {}).value || '';
      const recos = getRecommendedBgms(6);
      const recoMap = new Map(recos.map((r) => [r.id, r.reason]));
      let list = arBgmOptions();
      if (q.trim()) {
        const k = q.trim().toLowerCase();
        list = list.filter((o) => (o.name + ' ' + ((AR_BGM_META[o.id] || [])[1] || '') + ' ' + ((AR_BGM_META[o.id] || [])[0] || '')).toLowerCase().includes(k));
      } else if (arBgmMood === '추천') {
        // 추천은 목록 맨 위에, 나머지는 그 아래 그대로 이어서
        const ids = recos.map((r) => r.id);
        list = ids.map((id) => list.find((o) => o.id === id)).filter(Boolean).concat(list.filter((o) => !recoMap.has(o.id)));
      } else if (arBgmMood !== '전체') {
        list = list.filter((o) => (AR_BGM_META[o.id] || [])[0] === arBgmMood);
      }
      const esc = (v) => String(v || '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      const rows = list.map((o) => {
        const on = o.id === cur;
        return `<button type="button" class="bgm-row ${on ? 'on' : ''}" data-bgm-id="${o.id}" aria-pressed="${on}" onclick="arPickBgm('${o.id}')">
            ${arBgmCover(o.id, 48)}
            <span class="bgm-row-txt"><strong>${esc(o.name)}</strong></span>
            <span class="bgm-row-state">${arBgmRowState(o.id, on)}</span>
          </button>`;
      }).join('');
      let panel = el.querySelector('.bgm-sheet');
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'bgm-sheet';
        panel.innerHTML = `<div class="bgm-head"><strong>음악</strong><button type="button" class="bgm-done" onclick="arCloseBgmSheet()">완료</button></div>
          <input id="arBgmSearch" class="bgm-search" type="search" aria-label="음악 검색" placeholder="음악 검색" value="" oninput="arRenderBgmSheet(false)" />
          <div class="bgm-moods no-scrollbar"></div>
          <div class="bgm-list"></div>`;
        el.appendChild(panel);
      }
      const moodsEl = panel.querySelector('.bgm-moods');
      if (moodsEl) {
        moodsEl.innerHTML = AR_BGM_MOODS.map((md) => `<button type="button" class="${md === arBgmMood && !q ? 'on' : ''}" onclick="arBgmMood='${md}';const s=document.getElementById('arBgmSearch');if(s)s.value='';arRenderBgmSheet(false)">${md}</button>`).join('');
      }
      const listEl = panel.querySelector('.bgm-list');
      if (listEl) {
        listEl.innerHTML = `${rows || '<p class="bgm-empty">맞는 음악이 없어요</p>'}
            <label for="customBgmFileInput" class="bgm-row bgm-make"><span class="bgm-cover bgm-cover-make">⤒</span><span class="bgm-row-txt"><strong>내 음원 불러오기</strong></span><span class="bgm-row-state">＋</span></label>`;
        listEl.scrollTop = scrollTop;
      }
    }
    // 음악 목록은 영상 타임라인을 멈추고 선택한 음원만 미리 듣습니다.
    function arPickBgm(id) {
      const sel = document.getElementById('bgmStyleSelect');
      if (!sel) return;
      arStopBgmListening();
      AudioEngine.stopTts();
      const request = arBgmListenRequest;
      const same = sel.value === id;
      sel.value = id;
      const needsLoad = !same || (id !== 'off' && AudioEngine.bgmStyle !== 'custom_mp3' && arBgmPackId(id));
      if (needsLoad) arBgmPendingLoad = onAudioConfigChange({ autoPlay: false }) || null;
      const pending = arBgmPendingLoad;
      arSyncBgmSheetSelection();

      const listen = () => {
        if (request !== arBgmListenRequest || id === 'off' || sel.value !== id) return;
        const audio = AudioEngine.bgmStyle === 'custom_mp3' && AudioEngine.customBgmAudioEl;
        if (!audio) return;
        AudioEngine.ensureContext();
        arBgmListeningAudio = audio;
        audio.currentTime = 0;
        audio.play().then(() => {
          if (request !== arBgmListenRequest) return;
          arBgmListeningId = id;
          arSyncBgmSheetSelection();
        }).catch(() => {
          if (request !== arBgmListenRequest) return;
          arStopBgmListening();
          arToast('음악을 재생하지 못했어요. 잠시 뒤 다시 눌러 주세요.');
          arSyncBgmSheetSelection();
        });
      };
      if (pending) {
        pending.then(() => {
          if (arBgmPendingLoad === pending) arBgmPendingLoad = null;
          listen();
        });
      } else {
        listen();
      }
    }

    if (typeof window !== 'undefined') {
      window.renderBgmRecommendations = renderBgmRecommendations;
      window.applyRecommendedBgm = applyRecommendedBgm;
      window.addEventListener('DOMContentLoaded', () => {
        arAppendAudioOptions(document.getElementById('bgmStyleSelect'), AR_LIBRARY_MUSIC.values(), 'genre');
        const sfx = document.getElementById('sfxModeSelect');
        arAppendAudioOptions(sfx, AR_LIBRARY_EFFECTS.values(), 'group');
        if (sfx) {
          if (![...sfx.options].some(option => option.value === AudioEngine.sfxMode)) AudioEngine.sfxMode = 'scene';
          sfx.value = AudioEngine.sfxMode;
        }
        try {
          const savedBgm = localStorage.getItem('autoreels_bgm_style');
          const sel = document.getElementById('bgmStyleSelect');
          if (savedBgm && sel && [...sel.options].some((o) => o.value === savedBgm)) {
            sel.value = savedBgm;
            AudioEngine.bgmStyle = savedBgm;
            AudioEngine.userPickedBgm = true;
            const trackId = arBgmPackId(savedBgm);
            if (trackId) {
              const optLabel = sel.selectedOptions && sel.selectedOptions[0] ? sel.selectedOptions[0].textContent : trackId;
              AudioEngine.loadRemoteBgmUrl(`/assets/bgm/pack/${trackId}.mp3`, optLabel, false);
            }
          }
        } catch (e) {}
        setTimeout(renderBgmRecommendations, 400);
        const ti = document.getElementById('topicInput');
        if (ti) ti.addEventListener('input', () => { clearTimeout(window.__bgmRecT); window.__bgmRecT = setTimeout(renderBgmRecommendations, 300); });
      });
    }

    // ── 실시간 오픈 스트리밍 노래 검색(Audius) + 인스타 인기 가요용 모드 (2026-11) ──
    (function initStudioStreamingMusic() {
      let auditionEl = null;
      let auditionId = '';
      let streamCache = new Map();

      function stopAudition() {
        if (auditionEl) {
          try { auditionEl.pause(); auditionEl.src = ''; } catch (_) {}
          auditionEl = null;
        }
        auditionId = '';
        document.querySelectorAll('[data-stream-play]').forEach((btn) => { btn.textContent = '▶'; });
      }

      function escHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
      }

      function fmtSec(sec) {
        const s = Math.max(0, Math.round(Number(sec) || 0));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }

      window.arToggleStreamMusicBox = function arToggleStreamMusicBox() {
        const box = document.getElementById('arStreamMusicBox');
        if (!box) return;
        const willOpen = box.classList.contains('hidden');
        box.classList.toggle('hidden', !willOpen);
        if (willOpen) {
          const list = document.getElementById('arStreamTrackList');
          if (list && !list.dataset.loaded) {
            list.dataset.loaded = '1';
            window.arLoadStreamTracks('', '');
          }
        } else {
          stopAudition();
        }
      };

      const koSearchMap = {
        '한국': 'seoul kpop', '한국곡': 'seoul kpop', '가요': 'kpop vocal', '케이팝': 'kpop', '서울': 'seoul',
        '발라드': 'korean ballad', '카페': 'cafe lofi', '감성': 'emotional chill', '신나는': 'upbeat pop',
        '힙합': 'krnb hiphop', '재즈': 'jazz', '운동': 'workout trap', '피아노': 'piano', '어쿠스틱': 'acoustic',
        '로파이': 'lofi', '팝': 'pop vocal', '보컬': 'vocal pop', '브이로그': 'vlog chill'
      };
      function mapKoSearch(raw) {
        const s = String(raw || '').trim();
        if (!s) return '';
        if (koSearchMap[s]) return koSearchMap[s];
        for (const [k, v] of Object.entries(koSearchMap)) { if (s.includes(k)) return v; }
        return s;
      }

      window.arLoadStreamTracks = async function arLoadStreamTracks(query, genre) {
        const list = document.getElementById('arStreamTrackList');
        if (!list) return;
        const q = mapKoSearch(query);
        const g = String(genre || '').trim();
        list.style.minHeight = '168px';
        list.innerHTML = '<div class="py-10 flex flex-col items-center justify-center gap-2 text-[#93c5fd]"><span style="width:20px;height:20px;border-radius:999px;border:2.5px solid rgba(147,197,253,0.22);border-top-color:#60a5fa;display:inline-block;animation:spin .75s linear infinite;"></span><span>실시간 스트리밍 곡을 불러오는 중…</span></div>';
        const cacheKey = q ? `q:${q}` : `g:${g}`;
        try {
          let tracks = streamCache.get(cacheKey);
          if (!tracks) {
            const url = q
              ? `https://api.audius.co/v1/tracks/search?app_name=AutoReelsMaker&query=${encodeURIComponent(q)}&limit=18`
              : `https://api.audius.co/v1/tracks/trending?app_name=AutoReelsMaker&limit=18${g ? '&genre=' + encodeURIComponent(g) : ''}`;
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            tracks = (json && Array.isArray(json.data) ? json.data : []).filter((t) => t && t.id && t.is_streamable !== false);
            streamCache.set(cacheKey, tracks);
          }
          if (!tracks.length) {
            list.innerHTML = '<div class="py-4 text-center text-[#71717a]">검색 결과가 없습니다. 영문 키워드(예: pop, vocal, chill, jazz)로 검색해 보세요.</div>';
            return;
          }
          list.innerHTML = tracks.map((t) => {
            const art = (t.artwork && (t.artwork['150x150'] || t.artwork['480x480'])) || '';
            const title = escHtml(t.title || 'Untitled');
            const artist = escHtml((t.user && t.user.name) || 'Artist');
            const genreTag = escHtml(t.genre || '');
            const dur = fmtSec(t.duration);
            const idSafe = escHtml(t.id);
            const titleArg = JSON.stringify(`${t.title || 'Untitled'} — ${(t.user && t.user.name) || ''}`).replace(/"/g, '&quot;');
            return `
              <div class="flex items-center gap-2 p-1.5 rounded-[9px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]">
                ${art ? `<img src="${escHtml(art)}" alt="" class="w-9 h-9 rounded-[6px] object-cover shrink-0 bg-[#1e1f26]" loading="lazy" />` : '<div class="w-9 h-9 rounded-[6px] bg-[#1e293b] flex items-center justify-center shrink-0 text-[14px]">🎵</div>'}
                <div class="min-w-0 flex-1">
                  <div class="text-[12px] font-semibold text-[#ededed] truncate">${title}</div>
                  <div class="text-[10.5px] text-[#85858b] truncate">${artist}${genreTag ? ' · ' + genreTag : ''} · ${dur}</div>
                </div>
                <button type="button" data-stream-play="${idSafe}" onclick="arPreviewStreamTrack('${idSafe}', this)" class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] flex items-center justify-center cursor-pointer shrink-0" title="미리듣기">▶</button>
                <button type="button" onclick="arApplyStreamTrack('${idSafe}', ${titleArg})" class="h-7 px-2.5 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[11px] font-semibold cursor-pointer shrink-0">적용</button>
              </div>
            `;
          }).join('');
        } catch (err) {
          list.innerHTML = '<div class="py-4 text-center text-[#fca5a5]">스트리밍 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>';
        }
      };

      window.arPreviewStreamTrack = function arPreviewStreamTrack(trackId, btn) {
        if (!trackId) return;
        if (auditionId === trackId && auditionEl) {
          stopAudition();
          return;
        }
        stopAudition();
        auditionId = trackId;
        if (btn) btn.textContent = '⏹';
        const url = `https://api.audius.co/v1/tracks/${encodeURIComponent(trackId)}/stream?app_name=AutoReelsMaker`;
        const a = new Audio(url);
        a.crossOrigin = 'anonymous';
        a.volume = 0.72;
        auditionEl = a;
        a.onended = stopAudition;
        a.onerror = () => {
          stopAudition();
          if (typeof arToast === 'function') arToast('이 트랙은 미리듣기가 제한되어 있습니다. 다른 곡을 선택해 보세요.', false);
        };
        a.play().catch(() => {});
      };

      window.arApplyStreamTrack = function arApplyStreamTrack(trackId, label) {
        if (!trackId) return;
        stopAudition();
        const url = `https://api.audius.co/v1/tracks/${encodeURIComponent(trackId)}/stream?app_name=AutoReelsMaker`;
        const notice = document.getElementById('arInstaAudioModeNotice');
        if (notice) notice.classList.add('hidden');
        const opt = document.getElementById('customBgmOption');
        const sel = document.getElementById('bgmStyleSelect');
        if (opt) {
          opt.classList.remove('hidden');
          opt.textContent = `🌐 ${String(label || '실시간 스트리밍 곡').slice(0, 34)}`;
        }
        if (sel) sel.value = 'custom_mp3';
        AudioEngine.userPickedBgm = true;
        AudioEngine.loadRemoteBgmUrl(url, `스트리밍: ${label || '음악'}`, true);
        if (typeof arToast === 'function') arToast(`🌐 ${String(label || '스트리밍 노래').slice(0, 28)} 적용됨`, true);
      };

      window.arEnableInstaAudioMode = function arEnableInstaAudioMode() {
        stopAudition();
        const sel = document.getElementById('bgmStyleSelect');
        if (sel) {
          sel.value = 'off';
          if (typeof onAudioConfigChange === 'function') onAudioConfigChange();
        } else {
          AudioEngine.bgmStyle = 'off';
          if (typeof AudioEngine.stopBgmLoop === 'function') AudioEngine.stopBgmLoop();
        }
        const notice = document.getElementById('arInstaAudioModeNotice');
        if (notice) notice.classList.remove('hidden');
        const statusText = document.getElementById('lyriaBgmStatusText');
        if (statusText) statusText.classList.add('hidden');
        if (typeof arToast === 'function') arToast('🎵 인스타 인기 가요용 모드 켜짐 (BGM 끔 · 나레이션/효과음 유지)', true);
      };
    })();
