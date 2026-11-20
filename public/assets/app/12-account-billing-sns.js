// AutoReels — 12-account-billing-sns.js  (public/index.html 에서 나눔. 일반 <script> 로 순서대로 불러오며 전역 이름을 공유함)
    // ============================================================================
    // 카마스터 전용 모드 ↔ 본사 관리자 모드 분리 및 보안 인증
    // ============================================================================
    let isAdminMode = false;

    function checkIsAdminRoute() {
      const p = (window.location.pathname || '').toLowerCase();
      const s = (window.location.search || '').toLowerCase();
      return p.startsWith('/admin') || s.includes('admin=1') || s.includes('role=admin');
    }

    function openAdminAuthModal() {
      const m = document.getElementById('adminAuthModal');
      const err = document.getElementById('adminAuthError');
      const inp = document.getElementById('adminAuthPasswordInput');
      if (err) { err.classList.add('hidden'); err.textContent = ''; }
      if (inp) { inp.value = ''; }
      if (m) {
        m.classList.remove('hidden');
        setTimeout(() => { if (inp) inp.focus(); }, 60);
      }
    }

    function closeAdminAuthModal() {
      const m = document.getElementById('adminAuthModal');
      if (m) m.classList.add('hidden');
    }

    async function submitAdminAuth(e) {
      if (e) e.preventDefault();
      const inp = document.getElementById('adminAuthPasswordInput');
      const err = document.getElementById('adminAuthError');
      const pwd = inp ? inp.value.trim() : '';
      if (!pwd) return;

      try {
        const res = await fetch('/api/account?action=admin-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: pwd })
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok && j.ok) {
          isAdminMode = true;
          try {
            localStorage.setItem('autoreels_admin_authenticated', '1');
            localStorage.setItem('autoreels_admin_mode', '1');
          } catch (ex) {}
          closeAdminAuthModal();
          applyRoleViewModeUI();
          showMsg('본사 관리자 모드로 인증되었습니다.');
          return;
        }
        if (err) {
          err.textContent = j.message || '관리자 키가 올바르지 않습니다.';
          err.classList.remove('hidden');
        }
      } catch (ex) {
        if (err) {
          err.textContent = '관리자 인증 서버에 연결하지 못했습니다.';
          err.classList.remove('hidden');
        }
      }
      if (inp) inp.focus();
    }

    function exitAdminMode() {
      isAdminMode = false;
      try {
        localStorage.removeItem('autoreels_admin_authenticated');
        localStorage.setItem('autoreels_admin_mode', '0');
      } catch (e) {}
      if (window.location.search.includes('admin=1') || window.location.search.includes('role=admin')) {
        const u = new URL(window.location.href);
        u.searchParams.delete('admin');
        u.searchParams.delete('role');
        window.history.pushState(null, '', u.pathname + (u.search ? u.search : ''));
      }
      if (window.location.pathname.startsWith('/admin')) {
        window.history.pushState(null, '', '/');
      }
      applyRoleViewModeUI();
      showMsg('카마스터 전용 스튜디오 모드로 전환되었습니다.');
    }

    function toggleRoleViewMode() {
      if (!isAdminMode) {
        openAdminAuthModal();
      } else {
        exitAdminMode();
      }
    }

    function applyRoleViewModeUI() {
      const banner = document.getElementById('adminTopBanner');
      const nav = document.getElementById('topAdminNav');
      const bar = document.getElementById('dealerQuickSelectorBar');
      const sim = document.getElementById('adminDrmSimRow');
      const btn = document.getElementById('roleSwitchBtn');
      const badge = document.getElementById('roleModeBadge');

      if (banner) banner.classList.toggle('hidden', !isAdminMode);
      if (nav) nav.classList.toggle('hidden', !isAdminMode);
      if (bar) bar.classList.toggle('hidden', !isAdminMode);
      if (sim) sim.classList.toggle('hidden', !isAdminMode);
      if (btn) {
        btn.classList.toggle('hidden', !isAdminMode);
        btn.textContent = isAdminMode ? '카마스터 모드로 나가기' : '대표님 관리자 모드';
      }
      if (badge) {
        badge.textContent = isAdminMode ? '본사 대표님 관리자 콘솔' : '카마스터 전용 스튜디오';
        badge.className = `tag-chip px-2 py-0.5 text-[11px] font-mono ${isAdminMode ? 'text-[#d97706] border-[#d97706]/40' : 'text-[#4cc38a]'}`;
      }
      if (!isAdminMode) switchMainTab('preview');
      // 관리자 모드로 들어왔을 때 이미 무료 성우 모델로 바뀌어 있었다면 알림
      if (isAdminMode && typeof AudioEngine !== 'undefined' && AudioEngine.ttsFreeModel && !AudioEngine.ttsFreeNotified && typeof arToast === 'function') {
        AudioEngine.ttsFreeNotified = true;
        arToast('Fish Audio 크레딧이 부족해 성우가 무료 모델(음질 낮음)로 바뀌었습니다. fish.audio에서 충전하면 바로 고품질로 돌아갑니다.');
      }
    }

    window.addEventListener('keydown', (e) => {
      // 단축키 Ctrl+Shift+A 또는 Cmd+Shift+A 로 관리자 모드 진입/종료
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAdminMode) {
          exitAdminMode();
        } else {
          openAdminAuthModal();
        }
      }
      if (e.key === 'Escape') {
        closeAdminAuthModal();
      }
    });

    // ============================================================================
    // 카마스터 로그인 · 1분 회원가입 (휴대폰 번호 = 로그인 ID = 정품 바인딩 번호)
    // ============================================================================
    let authModalTab = 'login';

    function arIsProductionHost() {
      return ['autoreelsmaker.kr', 'autoreels-studio.vercel.app', 'dealer-reels-platform.vercel.app'].includes(location.hostname);
    }

    function arSyncAuthMethods(resetDisclosure = false) {
      const production = arIsProductionHost();
      const available = AR_SERVER.cfg?.kakaoLogin ?? production;
      const kakao = document.getElementById('arKakaoLoginArea');
      const phone = document.getElementById('arPhoneLoginOptions');
      const wasHidden = kakao.classList.contains('hidden');
      kakao.classList.toggle('hidden', !available);
      if (resetDisclosure || !available || (wasHidden && !document.getElementById('authPhoneInput').value && authModalTab === 'login')) {
        phone.open = !available;
      }
      const link = document.getElementById('arKakaoLoginBtn');
      const curInd = (typeof IND !== 'undefined' && IND && IND.key) ? IND.key : 'auto';
      link.href = (production ? 'https://autoreelsmaker.kr' : '') + '/api/account?action=kakao-start&ind=' + encodeURIComponent(curInd);
      if (!link.dataset.indBound) {
        link.dataset.indBound = '1';
        link.addEventListener('click', async (ev) => {
          ev.preventDefault();
          const liveInd = (typeof IND !== 'undefined' && IND && IND.key) ? IND.key : 'auto';
          const dest = (arIsProductionHost() ? 'https://autoreelsmaker.kr' : '') + '/api/account?action=kakao-start&ind=' + encodeURIComponent(liveInd);
          if (typeof window.arSaveLocalSnapshot === 'function') {
            try { await Promise.race([window.arSaveLocalSnapshot(true), new Promise((r) => setTimeout(r, 900))]); } catch (_) {}
          }
          window.location.href = dest;
        });
      }
      document.getElementById('authDemoSection').classList.toggle('hidden', production || Boolean(AR_SERVER.cfg?.serverMode));
    }

    function openDealerAuthModal(reason = '') {
      arRenderIndustryChip();
      arFillSignupFieldsForIndustry();
      const m = document.getElementById('dealerAuthModal');
      const generationNotice = document.getElementById('authGenerationNotice');
      generationNotice.classList.toggle('hidden', reason === '');
      generationNotice.textContent = reason === 'welcome' ? '가입 후 7일 동안 무료로 AI를 체험할 수 있어요.' : 'AI 생성 기능을 쓰려면 로그인해 주세요.';
      document.getElementById('arBrowseAsGuest').classList.toggle('hidden', reason !== 'welcome');
      switchAuthModalTab('login');
      arSyncAuthMethods(true);
      if (m) m.classList.remove('hidden');
    }
    function closeDealerAuthModal() {
      const m = document.getElementById('dealerAuthModal');
      if (m) m.classList.add('hidden');
      document.getElementById('authPasswordInput').value = '';
      document.getElementById('arPhoneCode').value = '';
      arPhoneChallenge = null;
    }
    document.getElementById('arBrowseAsGuest').addEventListener('click', closeDealerAuthModal);

    function switchAuthModalTab(tab) {
      if (authModalTab !== tab) {
        arPhoneChallenge = null;
        document.getElementById('arPhoneCode').value = '';
        document.getElementById('authPasswordInput').value = '';
        arPanelNotice('arPhoneNotice', '');
      }
      authModalTab = tab;
      document.getElementById('authModalNotice').classList.add('hidden');
      arFillSignupFieldsForIndustry(document.getElementById('authIndustryInput').value || IND.key);
      const on = 'h-8 rounded-[6px] text-[12px] font-medium bg-[#232325] text-[#ededed] cursor-pointer';
      const off = 'h-8 rounded-[6px] text-[12px] font-normal text-[#85858b] hover:text-[#ededed] cursor-pointer';
      document.getElementById('authTabLogin').className = tab === 'login' ? on : off;
      document.getElementById('authTabSignup').className = tab === 'signup' ? on : off;
      document.getElementById('authSignupFields').classList.toggle('hidden', tab !== 'signup');
      arAuthVerificationUI();
    }

    function normalizePhone(raw) {
      const digits = String(raw || '').replace(/\D/g, '');
      if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
      if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      return String(raw || '').trim();
    }

    function loadDealerAccounts() {
      try { return JSON.parse(localStorage.getItem('autoreels_dealer_accounts') || '{}'); } catch (e) { return {}; }
    }
    function saveDealerAccounts(map) {
      try { localStorage.setItem('autoreels_dealer_accounts', JSON.stringify(map)); } catch (e) {}
    }

    // 로그인된 카마스터 계정을 스튜디오 카마스터 목록에 반영하고 선택
    function applyLoggedInDealer(acc) {
      const serverId = acc.accountId ? 'account_' + String(acc.accountId) : '';
      let d = serverId && !acc.phone ? dealers.find((x) => x.id === serverId) : dealers.find((x) => extractPhoneLast8(x.licensedPhone || x.phone) === extractPhoneLast8(acc.phone));
      if (!d) {
        d = {
          id: serverId && !acc.phone ? serverId : 'dlr_' + extractPhoneLast8(acc.phone),
          name: acc.name,
          title: acc.title,
          branch: acc.branch,
          phone: acc.phone,
          licensedPhone: acc.phone,
          igUsername: '@' + (acc.name || 'dealer') + '_official',
          igPwMasked: 'AES256 (암호화 보관)',
          accentColor: '#3b82f6',
          promoTag: acc.promoTag || '',
          token: 'tok_' + extractPhoneLast8(acc.phone),
          avatarImg: dealers[0]?.avatarImg || null,
          status: 'PENDING',
          variation: createShuffledVariation(),
          snsAccounts: { ig: '', yt: '', tt: '', fb: '' }
        };
        dealers.push(d);
      }
      d.name = acc.name || d.name;
      d.title = acc.title || d.title;
      d.branch = acc.branch || d.branch;
      d.phone = acc.phone;
      d.licensedPhone = acc.phone;
      if (acc.promoTag) d.promoTag = acc.promoTag;
      d.licenseKey = acc.licenseKey || 'AR-000000 (미결제 체험판)';
      d.expiryYmd = acc.expiryYmd == null ? 20261231 : acc.expiryYmd;
      loadSavedDealerProfile(d);
      try { localStorage.setItem('autoreels_logged_phone', acc.phone); } catch (e) {}
      selectDealer(d.id, true);
      // 가입할 때 고른 업종으로 고정 (예전 계정은 자동차)
      if (typeof arLockIndustry === 'function') arLockIndustry(acc.industry || 'auto', acc.specialty);
    }

    async function submitDealerAuthForm() {
      if (window.AR_SERVER && AR_SERVER.mode) return arServerAuthSubmit();
      if (arIsProductionHost()) {
        const notice = document.getElementById('authModalNotice');
        notice.textContent = '휴대폰 로그인 서버를 확인하는 중입니다. 잠시 후 다시 시도해 주세요.';
        notice.classList.remove('hidden');
        return;
      }
      const phone = normalizePhone(document.getElementById('authPhoneInput').value);
      const pw = document.getElementById('authPasswordInput').value || '';
      const notice = document.getElementById('authModalNotice');
      const showMsg = (msg, ok = true) => {
        if (!notice) return;
        notice.classList.remove('hidden');
        notice.className = `text-[12px] text-center ${ok ? 'text-[#4cc38a]' : 'text-[#e5484d]'}`;
        notice.textContent = msg;
      };
      if (phone.replace(/\D/g, '').length < 10) return showMsg('휴대폰 번호를 정확히 입력해주세요.', false);
      if (pw.length < 4) return showMsg('비밀번호는 4자리 이상 입력해주세요.', false);

      const accounts = loadDealerAccounts();
      let acc = accounts[phone];

      if (authModalTab === 'login') {
        const existing = dealers.find((x) => extractPhoneLast8(x.licensedPhone || x.phone) === extractPhoneLast8(phone));
        if (!acc && existing) {
          acc = { phone, pw, name: existing.name, title: existing.title, branch: existing.branch,
                  promoTag: existing.promoTag, licenseKey: existing.licenseKey, expiryYmd: existing.expiryYmd };
          accounts[phone] = acc;
          saveDealerAccounts(accounts);
        }
        if (!acc) {
          switchAuthModalTab('signup');
          return showMsg('등록되지 않은 번호입니다. 아래 정보를 입력해 1분 가입을 완료해주세요.', false);
        }
        if (acc.pw && acc.pw !== pw) return showMsg('비밀번호가 일치하지 않습니다.', false);
      } else {
        acc = {
          phone, pw,
          name: document.getElementById('authNameInput').value.trim(),
          title: document.getElementById('authTitleInput').value.trim(),
          branch: document.getElementById('authBranchInput').value.trim(),
          promoTag: document.getElementById('authPromoInput').value.trim(),
          industry: (document.getElementById('authIndustryInput') || {}).value || 'auto',
          specialty: document.getElementById('authSpecialtyInput').value.trim(),
          licenseKey: 'AR-000000 (미결제 체험판)',
          expiryYmd: 20261231
        };
        // 서버 등록 (실패해도 로컬 계정으로 진행)
        try {
          if (window.location.protocol.startsWith('http')) {
            await fetch('/api/auth-billing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'login_or_signup', phone, name: acc.name, title: acc.title,
                                     branch: acc.branch, promoTag: acc.promoTag, isTrial: true })
            });
          }
        } catch (e) {}
        accounts[phone] = acc;
        saveDealerAccounts(accounts);
      }

      applyLoggedInDealer(acc);
      showMsg(authModalTab === 'signup'
        ? `${acc.name}님 가입 완료! 무료 체험판으로 바로 제작해보세요. (워터마크 해제는 PRO 결제)`
        : `${acc.name}님 환영합니다!`);
      setTimeout(closeDealerAuthModal, 900);
    }

    function quickLoginDemoDealer(mode) {
      if (mode === 'PRO_MINJUN') {
        const d = dealers[0];
        d.phone = d.licensedPhone || d.phone;
        d.expiryYmd = 20261231;
        d.licenseKey = formatWasmLicenseKey(d.licensedPhone || d.phone, 20261231);
        selectDealer(d.id, true);
        arLockIndustry('auto');
      } else {
        applyLoggedInDealer({
          phone: '010-5582-3391', name: '정우성', title: '수석 카마스터', branch: '현대자동차 도산대로점',
          promoTag: '출고 고객 전원 프리미엄 썬팅 + 블랙박스 무상 지원',
          licenseKey: 'AR-000000 (미결제 체험판)', expiryYmd: 20261231
        });
      }
      closeDealerAuthModal();
    }

    // ============================================================================
    // PRO 정기구독 결제 (카카오페이 / 토스페이 / 카드) → 정품 라이선스 즉시 개통
    // ============================================================================
    const BILLING_PLANS = {
      standard_29900: { name: '스탠다드 (제작 무제한 · 다운/게시 20회)', amount: 29900, expiryYmd: 20261231 },
      pro_59000:      { name: '프로 무제한 (제작·다운·게시 무제한)', amount: 59000, expiryYmd: 20261231 }
    };
    const PAY_METHOD_LABELS = { kakaopay: '카카오페이', tosspay: '토스페이', card: '신용·법인카드' };
    let selectedPlanKey = 'pro_59000';
    let selectedPayMethodKey = 'kakaopay';
    let resumeExportAfterPay = false;

    function openBillingCheckoutModal(fromExport = false) {
      resumeExportAfterPay = fromExport === true;
      const d = getSelectedDealer();
      const t = document.getElementById('billingTargetDealerText');
      if (t) t.textContent = `${d.name} ${d.title} (${d.licensedPhone || d.phone})`;
      const box = document.getElementById('billingSuccessBox');
      if (box) box.classList.add('hidden');
      const btn = document.getElementById('executePayBtn');
      if (btn) btn.disabled = false;
      selectBillingPlan(selectedPlanKey);
      selectPayMethod(selectedPayMethodKey);
      if (window.AR_SERVER && AR_SERVER.mode) arServerPrepareBillingModal();
      document.getElementById('billingCheckoutModal').classList.remove('hidden');
    }
    function closeBillingCheckoutModal() {
      document.getElementById('billingCheckoutModal').classList.add('hidden');
      document.getElementById('arPasswordSecurity').open = false;
      document.getElementById('arSecurityCurrent').value = '';
      document.getElementById('arSecurityNext').value = '';
      arPanelNotice('arSecurityNotice', '');
    }

    function selectBillingPlan(planKey) {
      selectedPlanKey = BILLING_PLANS[planKey] ? planKey : 'pro_59000';
      Object.keys(BILLING_PLANS).forEach((k) => {
        const el = document.getElementById(`planCard_${k}`);
        if (!el) return;
        el.classList.toggle('border-[#ededed]', k === selectedPlanKey);
        el.classList.toggle('bg-[#19191b]', k === selectedPlanKey);
        el.classList.toggle('border-[var(--border)]', k !== selectedPlanKey);
        el.classList.toggle('bg-[#141415]', k !== selectedPlanKey);
      });
      const btn = document.getElementById('executePayBtn');
      if (btn) btn.textContent = `${BILLING_PLANS[selectedPlanKey].amount.toLocaleString()}원 결제하고 워터마크 즉시 해제하기`;
      if (window.AR_SERVER && AR_SERVER.mode) arServerPayButtonLabel();
    }

    function selectPayMethod(methodKey) {
      selectedPayMethodKey = PAY_METHOD_LABELS[methodKey] ? methodKey : 'kakaopay';
      Object.keys(PAY_METHOD_LABELS).forEach((k) => {
        const el = document.getElementById(`payMethod_${k}`);
        if (!el) return;
        const on = k === selectedPayMethodKey;
        el.className = `h-10 rounded-[8px] border text-[12px] cursor-pointer ${
          on ? 'border-[#ededed] bg-[#232325] font-medium text-[#ededed]' : 'border-[var(--border)] bg-[#141415] font-normal text-[#a1a1a6]'
        }`;
      });
    }

    async function executeSubscriptionPayment() {
      if (window.AR_SERVER && AR_SERVER.mode) return arServerPay();
      if (typeof arIsProductionHost === 'function' && arIsProductionHost()) {
        arToast('결제 서버 연결을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const d = getSelectedDealer();
      const plan = BILLING_PLANS[selectedPlanKey];
      const btn = document.getElementById('executePayBtn');
      const phone = d.licensedPhone || d.phone;
      if (btn) {
        btn.disabled = true;
        btn.textContent = `${PAY_METHOD_LABELS[selectedPayMethodKey]} 결제 승인 중...`;
      }

      let receiptId = `PAY-${Date.now().toString().slice(-8)}`;
      try {
        if (window.location.protocol.startsWith('http')) {
          const r = await fetch('/api/auth-billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'checkout', phone, plan: selectedPlanKey, payMethod: selectedPayMethodKey })
          });
          const j = await r.json();
          if (j && j.receiptId) receiptId = j.receiptId;
        }
      } catch (e) {}

      // 브라우저 내 Wasm DRM 검증기와 동일한 서명으로 라이선스 발급 (결제 직후 즉시 인증 통과)
      d.phone = phone;
      d.licensedPhone = phone;
      d.expiryYmd = plan.expiryYmd;
      d.licenseKey = formatWasmLicenseKey(phone, plan.expiryYmd);

      const accounts = loadDealerAccounts();
      if (accounts[phone]) {
        accounts[phone].licenseKey = d.licenseKey;
        accounts[phone].expiryYmd = d.expiryYmd;
        saveDealerAccounts(accounts);
      }

      syncPreviewPanel();
      window.__timelines['main'].seek(window.__timelines['main'].currentTime);

      const box = document.getElementById('billingSuccessBox');
      const detail = document.getElementById('billingReceiptDetail');
      if (detail) {
        detail.textContent = `${plan.name} · ${plan.amount.toLocaleString()}원 · ${PAY_METHOD_LABELS[selectedPayMethodKey]} · 영수증 ${receiptId} · 라이선스 ${d.licenseKey}`;
      }
      if (box) box.classList.remove('hidden');
      if (btn) btn.textContent = '결제 완료 · 워터마크 해제됨';

      setTimeout(() => {
        closeBillingCheckoutModal();
        if (resumeExportAfterPay) {
          resumeExportAfterPay = false;
          exportSynthesizedVideo();
        }
      }, 1400);
    }


    // ============================================================================
    // ★ 회원·구독 서버 모드 (DB + AUTH_SECRET이 설정되면 자동으로 켜짐)
    //   - 로그인/가입: 서버(/api/account) — 비밀번호는 서버에 해시로만 저장
    //   - 워터마크 해제: 서버가 알려 준 구독 상태로만 결정
    //   - 결제: 베이온 안전 카드 등록창 → 첫 결제 → 매달 자동결제
    //   서버 설정이 없으면 지금까지의 시연 화면이 그대로 동작합니다.
    // ============================================================================
    window.AR_SERVER = { mode: false, cfg: null, me: null };
    const AR_PLAN_MAP = { standard_29900: 'standard', pro_59000: 'pro' };

    async function arApi(action, body, method) {
      const opt = { method: method || (body ? 'POST' : 'GET'), headers: {}, credentials: 'same-origin' };
      if (body) {
        opt.headers['Content-Type'] = 'application/json';
        opt.body = JSON.stringify(body);
      }
      const r = await fetch(`/api/account?action=${encodeURIComponent(action)}`, opt);
      const j = await r.json().catch(() => ({}));
      return { status: r.status, ok: r.ok && j.ok !== false, body: j };
    }

    function arToast(msg, ok = false, anchorEl = null, onClick = null) {
      let el = document.getElementById('arToast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'arToast';
        el.className = 'fixed z-[80] pointer-events-none max-w-[90vw] text-center px-4 py-2 rounded-[10px] text-[13px] shadow-2xl border whitespace-nowrap';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.background = ok ? '#0f2a1d' : '#2a1414';
      el.style.borderColor = ok ? '#4cc38a' : '#e5484d';
      el.style.color = '#ededed';
      if (typeof onClick === 'function') {
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.onclick = () => {
          el.style.display = 'none';
          clearTimeout(el._t);
          onClick();
        };
      } else {
        el.style.pointerEvents = 'none';
        el.style.cursor = 'default';
        el.onclick = null;
      }
      const rect = anchorEl && anchorEl.getBoundingClientRect ? anchorEl.getBoundingClientRect() : null;
      if (rect && rect.width > 0 && rect.height > 0) {
        const cx = Math.max(120, Math.min(window.innerWidth - 120, rect.left + rect.width / 2));
        el.style.left = `${Math.round(cx)}px`;
        el.style.bottom = `${Math.max(16, Math.round(window.innerHeight - rect.top + 10))}px`;
        el.style.transform = 'translateX(-50%)';
      } else {
        el.style.left = '50%';
        el.style.bottom = '96px';
        el.style.transform = 'translateX(-50%)';
      }
      el.style.display = 'block';
      clearTimeout(el._t);
      el._t = setTimeout(() => { el.style.display = 'none'; }, 4200);
    }
    window.arNotifyQuota = (msg) => arToast(msg || '이번 사용량 한도에 도달했어요.');

    function arYmd(iso) {
      if (!iso) return 20000101;
      const d = new Date(new Date(iso).getTime() + 9 * 3600e3);
      return Number(d.toISOString().slice(0, 10).replace(/-/g, ''));
    }

    // 서버 회원 정보 → 스튜디오의 카마스터 프로필/라이선스에 반영
    function arApplyMe(me) {
      const newAccount = AR_SERVER.me?.user?.id !== me.user.id;
      AR_SERVER.me = me;
      const u = me.user;
      arLoadAccountCustomStyles(u.id);
      const pro = Boolean(me.entitlement && me.entitlement.pro);
      const comp = pro && me.subscription && me.subscription.comp === true;
      const until = comp ? 0 : (pro ? arYmd(me.entitlement.until) : 20000101);
      applyLoggedInDealer({
        accountId: u.id,
        phone: u.phone,
        name: u.name,
        title: u.title,
        branch: u.branch,
        promoTag: u.promo,
        licenseKey: comp ? '무상 PRO (서버 인증)' : (pro ? formatWasmLicenseKey(u.phone, until) : 'AR-000000 (무료 회원)'),
        expiryYmd: until
      });
      if (typeof arLockIndustry === 'function') arLockIndustry(u.industry || 'auto', u.specialty);
      if (newAccount && restoreAiScriptPrefs()) syncPreviewPanel();
      if (typeof arSnsRefresh === 'function') arSnsRefresh();
      if(typeof arRestoreLastProject==='function') arRestoreLastProject();
      const btn = document.getElementById('headerAuthBtn');
      if (btn) {
        btn.textContent = comp ? '무상 PRO · 내 계정' : '내 계정 · 로그아웃';
        btn.setAttribute('onclick', 'arOpenAccount()');
      }
      syncDrmAndSnsUI();
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(window.__timelines.main.currentTime);
    }

    // 로그인 안 한 방문자: 시연용 카마스터들도 모두 체험판(워터마크)으로
    function arLockDemoDealers() {
      dealers.forEach((d) => {
        d.licenseKey = 'AR-000000 (로그인 필요)';
        d.expiryYmd = 20000101;
      });
      syncDrmAndSnsUI();
      if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(window.__timelines.main.currentTime);
    }

    async function arInitServerMode() {
      if (!window.location.protocol.startsWith('http')) return;
      let cfg;
      try {
        const r = await fetch('/api/account?action=config', { credentials: 'same-origin' });
        if (!r.ok) return;
        cfg = await r.json();
      } catch (e) {
        return;
      }
      AR_SERVER.cfg = cfg;
      arSyncAuthMethods();
      arAuthVerificationUI();
      const schedule=document.getElementById('snsScheduleEnabled');if(schedule){schedule.disabled=!cfg.snsScheduling;document.getElementById('arScheduleLabel').textContent=cfg.snsScheduling?'예약 발행 · 지정 시각부터 순서대로 게시':'예약 실행 서비스 연결 준비 중';}
      if (!cfg || !cfg.serverMode) return; // 시연 모드 유지
      AR_SERVER.mode = true;
      const demo = document.getElementById('authDemoSection');
      if (demo) demo.classList.add('hidden');
      const me = await arApi('me');
      const callbackParams = new URLSearchParams(location.search);
      if (me.ok) arApplyMe(me.body);
      else {
        arLockDemoDealers();
        const authModal = document.getElementById('dealerAuthModal');
        if (!window.arToolReturn && me.body.guest && !callbackParams.has('plan') && authModal.classList.contains('hidden')) {
          openDealerAuthModal('welcome');
        }
      }
      const kakaoResult = callbackParams.get('kakao');
      if (kakaoResult) {
        callbackParams.delete('kakao');
        history.replaceState(null, '', location.pathname + (callbackParams.toString() ? '?' + callbackParams : '') + location.hash);
        const messages = { success: '카카오 계정으로 연결했습니다.', conflict: '이미 다른 회원 계정에 연결된 카카오 계정입니다.', cancel: '카카오 로그인을 취소했습니다.', invalid: '로그인 요청이 만료됐습니다. 다시 시도해 주세요.', canonical: '대표 주소에서 기존 계정으로 로그인한 후 카카오 계정을 연결해 주세요.', unavailable: '카카오 로그인 준비 중입니다.', failed: '카카오 로그인에 실패했습니다. 다시 시도해 주세요.' };
        arToast(messages[kakaoResult] || messages.failed, kakaoResult === 'success');
      }
      arSnsRender();
      arSnsHandleReturn();
    }

    async function arServerAuthSubmit() {
      const notice = document.getElementById('authModalNotice');
      const show = (msg, ok) => {
        notice.classList.remove('hidden');
        notice.className = `text-[12px] text-center ${ok ? 'text-[#4cc38a]' : 'text-[#e5484d]'}`;
        notice.textContent = msg;
      };
      const val = (id) => (document.getElementById(id) || {}).value || '';
      const btn = document.getElementById('authSubmitBtn');
      btn.dataset.submitting = 'true';
      btn.disabled = true;
      try {
        if(authModalTab==='reset'){
          const r=await arApi('password-reset',{phone:val('authPhoneInput'),password:val('authPasswordInput'),challengeId:arPhoneChallenge?.id,code:val('arPhoneCode')});
          if(!r.ok)return show(r.body.message||'재설정하지 못했습니다.',false);
          arPhoneChallenge=null;document.getElementById('authPasswordInput').value='';switchAuthModalTab('login');show('비밀번호가 변경되었습니다. 다시 로그인해 주세요.',true);return;
        }
        const r = authModalTab === 'signup'
          ? await arApi('signup', {
              phone: val('authPhoneInput'), password: val('authPasswordInput'), name: val('authNameInput'),
              title: val('authTitleInput'), branch: val('authBranchInput'), promo: val('authPromoInput'),
              email: val('authEmailInput'), industry: val('authIndustryInput') || 'auto', specialty: val('authSpecialtyInput'),
              challengeId: arPhoneChallenge?.id, code: val('arPhoneCode')
            })
          : await arApi('login', { phone: val('authPhoneInput'), password: val('authPasswordInput') });
        if (!r.ok) {
          if (r.body.error === 'phone_taken') switchAuthModalTab('login');
          return show(r.body.message || '처리하지 못했습니다.', false);
        }
        arPhoneChallenge=null;document.getElementById('authPasswordInput').value='';document.getElementById('arPhoneCode').value='';
        arApplyMe(r.body);
        show(authModalTab === 'signup' ? '가입 완료! 무료 회원으로 바로 만들어 보세요.' : `${r.body.user.name}님 환영합니다!`, true);
        setTimeout(closeDealerAuthModal, 800);
      } finally {
        delete btn.dataset.submitting;
        arAuthVerificationUI();
      }
    }

    async function arLogout() {
      await arApi('logout', {});
      AR_SERVER.me = null;
      try { localStorage.removeItem('autoreels_logged_phone'); } catch (e) {}
      location.reload();
    }

    function arOpenAccount() {
      openBillingCheckoutModal();
      const userId = AR_SERVER.me?.user?.id;
      if (!userId) return;
      arApi('me').then(r => {
        if (!r.ok || r.body.user?.id !== userId || AR_SERVER.me?.user?.id !== userId) return;
        AR_SERVER.me.usage = r.body.usage;
        if (!document.getElementById('billingCheckoutModal').classList.contains('hidden')) arServerPrepareBillingModal();
      }).catch(() => {});
    }

    function arServerPayButtonLabel() {
      const btn = document.getElementById('executePayBtn');
      if (!btn) return;
      const plan = BILLING_PLANS[selectedPlanKey];
      const sub = AR_SERVER.me && AR_SERVER.me.subscription;
      const activeNow = AR_SERVER.me && AR_SERVER.me.entitlement && AR_SERVER.me.entitlement.pro;
      if (!AR_SERVER.me) btn.textContent = '로그인하고 결제하기';
      else if (sub && sub.comp) btn.textContent = '무상 PRO 이용 중';
      else if (!AR_SERVER.cfg.billingReady) btn.textContent = '결제 오픈 준비 중입니다';
      else if (activeNow && sub) btn.textContent = sub.plan === (AR_PLAN_MAP[selectedPlanKey] || '') ? '카드 바꾸기' : '카드 등록하고 다음 결제일부터 요금제 바꾸기';
      else btn.textContent = `카드 등록하고 ${plan.amount.toLocaleString()}원 결제하기`;
      btn.disabled = Boolean(AR_SERVER.me) && (Boolean(sub && sub.comp) || !AR_SERVER.cfg.billingReady);
      btn.style.opacity = btn.disabled ? '0.55' : '';
    }

    function arStatusLabel(s) {
      return { active: '이용 중', past_due: '결제 재시도 중', review: '결제 확인 중', incomplete: '결제 미완료', expired: '만료', canceled: '해지됨' }[s] || s;
    }

    function arServerPrepareBillingModal() {
      document.getElementById('billingPayMethodSection').classList.add('hidden');
      document.getElementById('billingCardNote').classList.remove('hidden');
      document.getElementById('billingLicenseBox').classList.add('hidden');
      const err = document.getElementById('billingErrorBox');
      if (err) err.classList.add('hidden');
      const box = document.getElementById('billingAccountBox');
      const me = AR_SERVER.me;
      document.getElementById('arPasswordSecurity').classList.toggle('hidden', !me?.user?.phone);
      box.classList.remove('hidden');
      if (!me) {
        box.innerHTML = `<div class="text-[#a1a1a6]">결제하려면 먼저 로그인해 주세요.</div>
          <button type="button" onclick="closeBillingCheckoutModal();openDealerAuthModal();" class="btn-secondary h-8 px-3 text-[12px]">로그인 · 가입</button>`;
      } else {
        const s = me.subscription;
        const u = me.usage || {};
        const pct = u.ttsLimit ? Math.min(100, Math.round((u.ttsChars / u.ttsLimit) * 100)) : 0;
        const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('ko-KR') : '-');
        const trial = u.trial;
        const trialActive = trial && arTrialIsActive(trial);
        const trialEnds = trial?.endsAt ? new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short'
        }).format(new Date(trial.endsAt)) : '';
        const remainingAi = trialActive ? Math.max(0, u.aiLimit - u.aiScripts) : 0;
        const remainingTts = trialActive ? Math.max(0, u.ttsLimit - u.ttsChars) : 0;
        box.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <div><div class="text-[#85858b]">내 계정</div><div class="text-[13px] text-[#ededed] font-medium">${me.user.name} · ${me.user.phone || '카카오 계정'}</div></div>
            <button type="button" onclick="arLogout()" class="btn-secondary h-7 px-2.5 text-[11px]">로그아웃</button>
          </div>
          ${AR_SERVER.cfg && AR_SERVER.cfg.kakaoLogin ? '<form method="post" action="/api/account?action=kakao-link"><button type="submit" class="btn-secondary h-8 px-3 text-[12px]">카카오 계정 연결하기</button></form>' : ''}
          <div class="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
            <div>
              <div class="text-[#85858b]">구독</div>
              <div class="text-[13px] text-[#ededed]">${s ? `${s.planName} · ${arStatusLabel(s.status)}${s.cancelAtPeriodEnd ? ' (해지 예약)' : ''}` : '무료 회원'}</div>
              ${s && s.currentPeriodEnd ? `<div class="text-[11px] text-[#85858b]">${s.cancelAtPeriodEnd ? '이용 종료일' : '다음 결제일'} ${fmt(s.currentPeriodEnd)}${s.cardLast4 ? ` · 카드 끝자리 ${s.cardLast4}` : ''}</div>` : ''}
            </div>
            ${s && !s.comp && ['active', 'past_due'].includes(s.status)
              ? (s.cancelAtPeriodEnd
                  ? '<button type="button" onclick="arSetCancel(false)" class="btn-secondary h-7 px-2.5 text-[11px]">해지 취소</button>'
                  : '<button type="button" onclick="arSetCancel(true)" class="btn-secondary h-7 px-2.5 text-[11px]">해지 예약</button>')
              : ''}
          </div>
          <div class="pt-2 border-t border-[var(--border)]">
            ${trial ? `
              <div class="text-[13px] font-medium text-[#ededed]">7일 무료 AI 체험 · ${trialActive ? '이용 중' : '종료'}</div>
              ${trialEnds ? `<div class="text-[11px] text-[#85858b]">종료 시각 ${trialEnds} (한국 시간)</div>` : ''}
              <div class="flex justify-between text-[11px] text-[#85858b] mt-1.5"><span>남은 AI 생성 한도</span><span class="font-mono">${remainingAi.toLocaleString('ko-KR')}회</span></div>
              <div class="flex justify-between text-[11px] text-[#85858b] mt-1"><span>남은 성우 글자 수</span><span class="font-mono">${remainingTts.toLocaleString('ko-KR')}자</span></div>
            ` : `
              <div class="flex justify-between text-[11px] text-[#85858b]"><span>이번 달 AI 성우 사용량</span><span class="font-mono">${(u.ttsChars || 0).toLocaleString()} / ${(u.ttsLimit || 0).toLocaleString()}자</span></div>
              <div class="h-1.5 rounded bg-[#232325] mt-1 overflow-hidden"><div style="width:${pct}%" class="h-full bg-[#4cc38a]"></div></div>
              <div class="flex justify-between text-[11px] text-[#85858b] mt-1.5"><span>AI 대본·주제·이미지·음악 생성</span><span class="font-mono">${u.aiLimit === null ? '무제한' : `${u.aiScripts || 0} / ${u.aiLimit || 0}회`}</span></div>
            `}
            <div class="flex justify-between text-[11px] text-[#85858b] mt-1"><span>다운로드 · SNS 게시</span><span class="font-mono">${u.exports || 0} / ${u.exportLimit == null ? '무제한' : `${u.exportLimit}회`}</span></div>
          </div>`;
      }
      arServerPayButtonLabel();
    }

    async function arSetCancel(cancel) {
      if (cancel && !confirm('해지 예약할까요? 이번 결제 기간이 끝날 때까지는 계속 쓸 수 있고, 그 뒤로는 자동결제가 되지 않습니다.')) return;
      const r = await arApi(cancel ? 'cancel' : 'resume', {});
      if (!r.ok) return arToast(r.body.message || '처리하지 못했습니다.');
      const me = await arApi('me');
      if (me.ok) arApplyMe(me.body);
      arServerPrepareBillingModal();
      arToast(cancel ? '해지 예약했어요. 기간이 끝날 때까지는 계속 쓸 수 있어요.' : '자동결제를 다시 켰어요.', true);
    }

    function arLoadVeyonScript(src) {
      const allowed = ['https://api.veyon.co.kr/static/v1/public/veyon.v1.js', 'https://tapi.veyon.co.kr/static/v1/public/veyon.v1.js'];
      if (window.VEYON && window.VEYON.pay) return Promise.resolve();
      if (!allowed.includes(src)) return Promise.reject(new Error('결제창 주소를 확인할 수 없습니다.'));
      return new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = src;
        sc.async = true;
        sc.onload = () => (window.VEYON && window.VEYON.pay ? resolve() : reject(new Error('결제창을 불러오지 못했습니다.')));
        sc.onerror = () => reject(new Error('결제창을 불러오지 못했습니다.'));
        document.head.appendChild(sc);
      });
    }

    async function arServerPay() {
      const errBox = document.getElementById('billingErrorBox');
      const fail = (m) => {
        errBox.textContent = m;
        errBox.classList.remove('hidden');
      };
      errBox.classList.add('hidden');
      if (!AR_SERVER.me) {
        closeBillingCheckoutModal();
        return openDealerAuthModal();
      }
      if (!AR_SERVER.cfg.billingReady) return fail('결제 오픈 준비 중입니다. 조금만 기다려 주세요.');
      const btn = document.getElementById('executePayBtn');
      btn.disabled = true;
      btn.textContent = '안전 결제창 여는 중...';
      try {
        const ready = await arApi('card-ready', { plan: AR_PLAN_MAP[selectedPlanKey] || 'monthly' });
        if (!ready.ok) throw new Error(ready.body.message || '결제창을 준비하지 못했습니다.');
        const prep = ready.body;
        await arLoadVeyonScript(prep.scriptUrl);
        if (window.VEYON.welcome) window.VEYON.welcome();
        await new Promise((resolve) => {
          let done = false;
          window.VEYON.pay({
            payMethod: 'recurring',
            trxId: prep.trxId,
            openType: 'layer',
            openMode: 'layer',
            onApprove: async (providerResult) => {
              if (done) return;
              done = true;
              try {
                if (!providerResult) throw new Error('카드 등록을 취소했어요.');
                btn.textContent = '결제 확인 중...';
                const r = await arApi('card-complete', { state: prep.state, trackId: prep.trackId, providerResult });
                if (r.body && r.body.user) arApplyMe(r.body);
                if (!r.ok) {
                  const b = r.body.billing || {};
                  throw new Error((b.result && b.result.message) || r.body.message || '결제가 승인되지 않았습니다.');
                }
                const detail = document.getElementById('billingReceiptDetail');
                if (detail) detail.textContent = r.body.billing.cardUpdated
                  ? '카드를 바꿨어요. 다음 결제일부터 새 카드로 결제됩니다.'
                  : `${r.body.subscription.planName} · ${Number(r.body.subscription.amount).toLocaleString()}원 결제 완료 · 다음 결제일 ${new Date(r.body.subscription.currentPeriodEnd).toLocaleDateString('ko-KR')}`;
                document.getElementById('billingSuccessBox').classList.remove('hidden');
                arServerPrepareBillingModal();
                arToast('결제가 완료됐어요. 워터마크가 사라졌습니다.', true);
                if (resumeExportAfterPay) {
                  resumeExportAfterPay = false;
                  setTimeout(() => {
                    closeBillingCheckoutModal();
                    exportSynthesizedVideo();
                  }, 1200);
                }
              } catch (e) {
                fail(e.message);
              } finally {
                resolve();
              }
            }
          });
        });
      } catch (e) {
        fail(e.message);
      } finally {
        btn.disabled = false;
        arServerPayButtonLabel();
      }
    }

    arInitServerMode();

    // ==========================================================================
    // ★ SNS 계정 연결 · 실제 발행 (회원 서버가 켜졌을 때만)
    // ==========================================================================
    const AR_SNS_ROWS = { instagram: 'ig', youtube: 'yt', tiktok: 'tt', facebook: 'fb', threads: 'th' };
    const AR_SNS_NAMES = { instagram: '인스타그램', youtube: '유튜브', tiktok: '틱톡', facebook: '페이스북', threads: '스레드' };
    let AR_SNS_STATE = null;

    async function arSnsApi(action, body) {
      const opt = { method: body ? 'POST' : 'GET', headers: {}, credentials: 'same-origin' };
      if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
      const r = await fetch(`/api/sns?action=${encodeURIComponent(action)}`, opt);
      const j = await r.json().catch(() => ({}));
      return { status: r.status, ok: r.ok && j.ok !== false, body: j };
    }

    function arSnsRender() {
      const st = AR_SNS_STATE;
      Object.entries(AR_SNS_ROWS).forEach(([t, k]) => {
        const handle = document.getElementById(`snsHandle_${k}`);
        const btn = document.getElementById(`snsStatusBtn_${k}`);
        const chk = document.getElementById(`snsCheck${k[0].toUpperCase()}${k[1]}`);
        if (!handle || !btn) return;
        handle.setAttribute('data-noind', '');
        const info = st && st.targets ? st.targets[t] : null;
        if (!AR_SERVER.me) {
          handle.textContent = '로그인하면 연결할 수 있어요';
          btn.textContent = '로그인';
          btn.disabled = false;
        } else if (!info || !info.ready) {
          handle.textContent = '준비 중 (운영자 설정 필요)';
          btn.textContent = '준비 중';
          btn.disabled = true;
        } else if (info.connected) {
          handle.textContent = info.name || '연결됨';
          btn.textContent = '연결 해제';
          btn.disabled = false;
        } else {
          handle.textContent = t === 'instagram' && info.directLoginReady ? '릴스를 게시할 프로페셔널 계정 하나를 선택하세요' : info.note || '연결 안 됨';
          btn.textContent = t === 'instagram' && info.directLoginReady ? '내 인스타 연결' : '연결하기';
          btn.disabled = false;
        }
        if (chk) {
          const can = Boolean(info && info.connected);
          if (!can) chk.checked = false;
          chk.disabled = !can;
        }
      });
      const commentSwitch = document.getElementById('snsIgFirstComment');
      if (commentSwitch) {
        commentSwitch.disabled = Boolean(st?.targets?.instagram?.direct);
        if (commentSwitch.disabled) commentSwitch.checked = false;
        commentSwitch.closest('label')?.toggleAttribute('hidden', commentSwitch.disabled);
      }
      // 페이스북 페이지가 여러 개면 고르는 목록
      let pick = document.getElementById('snsPagePicker');
      const fbRow = document.getElementById('snsStatusBtn_fb');
      if (st && st.pages && st.pages.length > 1 && fbRow) {
        if (!pick) {
          pick = document.createElement('select');
          pick.id = 'snsPagePicker';
          pick.setAttribute('data-noind', '');
          pick.className = 'studio-input w-full h-9 px-2 text-[12px] mt-2 sm:col-span-2';
          pick.onchange = () => arSnsSelectPage(pick.value);
          fbRow.closest('.grid').appendChild(pick);
        }
        pick.innerHTML = st.pages.map((p) => `<option value="${escapeHtmlInd(p.id)}">${escapeHtmlInd(p.name)}${p.ig ? ` · 인스타그램 @${escapeHtmlInd(p.ig)}` : ' · 인스타그램 연결 없음'}</option>`).join('');
        pick.value = st.page;
      } else if (pick) {
        pick.remove();
      }
    }

    async function arSnsRefresh() {
      if (!AR_SERVER.mode) return;
      if (!AR_SERVER.me) { AR_SNS_STATE = null; arSnsRender(); return; }
      const r = await arSnsApi('status');
      if (r.ok) AR_SNS_STATE = r.body;
      arSnsRender();
    }

    async function arSnsSelectPage(pageId) {
      const r = await arSnsApi('select-page', { pageId });
      if (r.ok) { AR_SNS_STATE = r.body; arSnsRender(); arToast('페이지를 바꿨습니다.', true); }
      else arToast(r.body.message || '페이지를 바꾸지 못했습니다.');
    }

    async function arSnsConnectClick(code) {
      const target = Object.keys(AR_SNS_ROWS).find((t) => AR_SNS_ROWS[t] === code);
      if (!AR_SERVER.me) return openDealerAuthModal();
      const info = AR_SNS_STATE && AR_SNS_STATE.targets ? AR_SNS_STATE.targets[target] : null;
      if (info && info.connected) {
        const both = target === 'facebook' && AR_SNS_STATE?.targets?.instagram?.connected && !AR_SNS_STATE.targets.instagram.direct;
        if (!confirm(`${AR_SNS_NAMES[target]} 연결을 해제할까요?${both ? '\n(인스타그램과 페이스북은 메타 계정 하나로 연결되어 함께 해제됩니다)' : ''}`)) return;
        const r = await arSnsApi('disconnect', { target });
        if (r.ok) { AR_SNS_STATE = r.body; arSnsRender(); }
        return;
      }
      const r = await arSnsApi('connect', { target });
      if (r.ok && r.body.url) {
        if (typeof window.arSaveLocalSnapshot === 'function') {
          try { await window.arSaveLocalSnapshot(true); } catch (_) {}
        }
        window.location.href = r.body.url;
      }
      else arToast(r.body.message || '연결을 시작하지 못했습니다.');
    }

    // SNS 로그인 후 돌아왔을 때 결과 알림
    function arSnsHandleReturn() {
      const p = new URLSearchParams(window.location.search);
      const s = p.get('sns');
      if (!s) return;
      if (s === 'connected') arToast('SNS 계정을 연결했습니다.', true);
      else arToast(`SNS 연결 실패: ${p.get('msg') || p.get('reason') || '다시 시도해 주세요'}`);
      try { history.replaceState({ arTab: 'script' }, '', window.location.pathname); } catch (e) {}
      if (typeof switchStudioTab === 'function') { try { switchStudioTab('publish'); } catch (e) {} }
    }

    function arSnsLog(msg, kind) {
      const box = document.getElementById('publishLogBox');
      const lines = document.getElementById('publishLogLines');
      if (!box || !lines) return;
      box.classList.remove('hidden');
      const line = document.createElement('div');
      line.setAttribute('data-noind', '');
      line.className = kind === 'ok' ? 'text-emerald-400' : kind === 'err' ? 'text-[#f87171]' : '';
      line.textContent = msg;
      lines.appendChild(line);
      return line;
    }

    let arVercelBlob = null;
    async function arLoadBlobClient() {
      if (!arVercelBlob) arVercelBlob = await import('https://esm.sh/@vercel/blob@2.9.0/client');
      return arVercelBlob;
    }

    let arSnsPublishing = false;
    async function arSnsPublish() {
      if (arSnsPublishing) return;
      const stepStatus = document.getElementById('publishStepStatus');
      const lines = document.getElementById('publishLogLines');
      if (lines) lines.innerHTML = '';
      if (!AR_SERVER.me) { openDealerAuthModal(); return; }
      const targets = Object.entries(AR_SNS_ROWS)
        .filter(([, k]) => document.getElementById(`snsCheck${k[0].toUpperCase()}${k[1]}`)?.checked)
        .map(([t]) => t);
      if (!targets.length) { arSnsLog('발행할 SNS를 골라 주세요. 먼저 계정을 연결해야 고를 수 있습니다.', 'err'); return; }
      const blob = window.lastRecordedVideoBlob;
      if (!blob) { arSnsLog('먼저 [영상 만들기]로 영상을 만든 다음 발행해 주세요.', 'err'); return; }
      if ((targets.includes('instagram') || targets.includes('facebook')) && !/mp4/.test(blob.type || '')) {
        arSnsLog('이 브라우저는 mp4로 저장하지 못해 인스타그램·페이스북에는 올릴 수 없습니다. 최신 크롬에서 다시 만들어 주세요.', 'err');
        return;
      }
      const d = getSelectedDealer();
      const caption = document.getElementById('dlrCaptionTextarea')?.value || buildCaption(d);
      const title = campaign.hook || campaign.vehicle || '';
      if (document.getElementById('snsScheduleEnabled')?.checked && (!AR_SERVER.cfg?.snsScheduling || !document.getElementById('snsScheduleAt')?.value)) { arSnsLog('예약 실행 상태와 예약 시간을 확인해 주세요.', 'err'); return; }
      arSnsPublishing = true;
      const requestId = crypto.randomUUID();
      if (stepStatus) stepStatus.textContent = '영상 올리는 중...';
      try {
        const tk = await arSnsApi('upload-token', { size: blob.size, type: blob.type || 'video/mp4' });
        if (!tk.ok) throw new Error(tk.body.message || '업로드 권한을 받지 못했습니다');
        const prog = arSnsLog('영상 파일 올리는 중... 0%');
        const { put } = await arLoadBlobClient();
        const up = await put(tk.body.pathname, blob, {
          access: 'public', token: tk.body.clientToken, contentType: tk.body.contentType,
          onUploadProgress: (e) => { if (prog) prog.textContent = `영상 파일 올리는 중... ${Math.round(e.percentage || 0)}%`; }
        });
        if (prog) prog.textContent = '영상 파일 올리기 완료';
        if (stepStatus) stepStatus.textContent = `${targets.length}개 SNS에 발행 중...`;
        const schedOn = document.getElementById('snsScheduleEnabled')?.checked;
        const schedRaw = document.getElementById('snsScheduleAt')?.value;
        const scheduledAt = schedOn && schedRaw ? new Date(schedRaw).toISOString() : '';
        const igFirstComment = Boolean(document.getElementById('snsIgFirstComment')?.checked);
        const pub = await arSnsApi('publish', { targets, videoUrl: up.url, caption, title, scheduledAt, igFirstComment, requestId });
        if (!pub.ok) throw new Error(pub.body.message || '발행을 시작하지 못했습니다');
        await arSnsTrackJobs(pub.body.jobs || []);
        await arShowSnsHistory();
      } catch (e) {
        arSnsLog(`발행 실패: ${e.message || e}`, 'err');
        if (stepStatus) stepStatus.textContent = '발행 실패';
      } finally { arSnsPublishing = false; }
    }

    async function arSnsTrackJobs(jobs) {
      const stepStatus = document.getElementById('publishStepStatus');
      const rows = {};
      const show = (j) => {
        const name = AR_SNS_NAMES[j.target] || j.target;
        let msg;
        let kind;
        if (j.status === 'done') { msg = `✅ ${name}: 게시 완료${j.url ? ` → ${j.url}` : ''}${j.note ? ` (${j.note})` : ''}`; kind = 'ok'; }
        else if (j.status === 'scheduled') {
          const when = j.scheduledAt ? new Date(j.scheduledAt).toLocaleString('ko-KR') : '지정 시간';
          msg = `🗓️ ${name}: ${when} 예약 완료`; kind = 'ok';
        }
        else if (j.status === 'review') { msg = `⚠️ ${name}: 게시 결과 확인 필요 · 중복 방지를 위해 재게시하지 마세요.`; kind = 'err'; }
        else if (j.status === 'failed') { msg = `❌ ${name}: ${j.error || '실패'}`; kind = 'err'; }
        else { msg = `⏳ ${name}: 처리 중...`; }
        if (j.target === 'tiktok' && j.status === 'done' && !j.note) msg += ' (틱톡 앱 알림함에서 게시를 마무리해 주세요)';
        if (!rows[j.id]) rows[j.id] = arSnsLog(msg, kind);
        else { rows[j.id].textContent = msg; rows[j.id].className = kind === 'ok' ? 'text-emerald-400' : kind === 'err' ? 'text-[#f87171]' : ''; }
      };
      jobs.forEach(show);
      const started = Date.now();
      let pending = jobs.filter((j) => j.status === 'processing' || j.status === 'pending').map((j) => j.id);
      while (pending.length && Date.now() - started < 6 * 60 * 1000) {
        await new Promise((r) => setTimeout(r, 5000));
        const r = await arSnsApi('jobs', { ids: pending });
        if (!r.ok) break;
        (r.body.jobs || []).forEach(show);
        pending = (r.body.jobs || []).filter((j) => j.status === 'processing' || j.status === 'pending').map((j) => j.id);
      }
      const all = Object.values(rows).map((el) => el.className);
      const okCount = all.filter((c) => c.includes('emerald')).length;
      const reviewCount = Object.values(rows).filter(el => el.textContent.includes('게시 결과 확인 필요')).length;
      if (stepStatus) stepStatus.textContent = reviewCount ? `${reviewCount}개 SNS의 게시 결과 확인이 필요합니다.` : pending.length ? '아직 처리 중인 SNS가 있습니다. 잠시 후 각 앱에서 확인해 주세요.' : `${okCount}/${jobs.length}개 SNS 발행 완료`;
      if (okCount) {
        const d = getSelectedDealer();
        d.status = 'PUBLISHED';
        try { renderQuickSelector(); renderAdminDealerList(); syncPreviewPanel(); } catch (e) {}
      }
    }


    // ==========================================================================
    // ★ 휴대폰 [뒤로 가기]: 사이트를 벗어나지 않고 열린 창 → 이전 탭 순서로 돌아감
    // ==========================================================================
    (function arBackNav() {
      if (!window.history || !history.pushState) return;
      let depth = 0;      // 열린 창 때문에 쌓아 둔 기록 수
      let ignorePop = 0;  // 버튼으로 창을 닫아 기록을 되돌릴 때 생기는 popstate는 무시
      let curTab = 'topic';
      const openOverlays = () => {
        const list = [];
        const dr = document.getElementById('presetDrawer');
        if (dr && dr.classList.contains('open')) list.push(dr);
        document.querySelectorAll('.ar-modal').forEach((m) => { if (!m.classList.contains('hidden')) list.push(m); });
        return list;
      };
      const closeOverlay = (el) => {
        if (el.id === 'presetDrawer') return closePresetDrawer();
        if (el.id === 'industryPickerModal') return el.remove();
        const x = el.querySelector('.ar-modal-x');
        if (x) x.click(); else el.classList.add('hidden');
      };
      let pending = false;
      const sync = () => {
        pending = false;
        const n = openOverlays().length;
        if (n > depth) {
          while (depth < n) { depth++; history.pushState({ arTab: curTab, arOverlay: depth }, ''); }
        } else if (n < depth) {
          const k = depth - n;
          depth = n;
          ignorePop++;
          history.go(-k);
        }
      };
      const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(sync); } };
      new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

      // 탭을 옮길 때마다 기록을 남겨서, 뒤로 가기로 이전 탭으로 돌아감
      const baseSwitch = switchStudioTab;
      switchStudioTab = function (key, fromHistory, { replaceClosedOverlay = false } = {}) {
        const prev = curTab;
        baseSwitch(key);
        if (!STUDIO_TABS.includes(key)) return;
        curTab = key;
        if (fromHistory || key === prev) return;
        // 상품 창에서 바로 대본으로 넘어가면 창 기록을 대본 탭 기록으로 바꿉니다.
        if (replaceClosedOverlay && depth === 1 && history.state?.arOverlay === 1 && !openOverlays().length) {
          depth = 0;
          history.replaceState({ arTab: key }, '');
        } else {
          history.pushState({ arTab: key }, '');
        }
      };
      try { history.replaceState({ arTab: 'topic' }, ''); } catch (e) {}

      window.addEventListener('popstate', (e) => {
        if (ignorePop > 0) { ignorePop--; return; }
        const ov = openOverlays();
        if (ov.length) {
          depth = Math.max(0, depth - 1); // 이 기록은 방금 브라우저가 지움
          closeOverlay(ov[ov.length - 1]);
          return;
        }
        const tab = (e.state && e.state.arTab) || 'script';
        if (tab !== curTab) switchStudioTab(tab, true);
      });
    })();

    // 초기 구동
    loadSavedDealerProfiles();
    loadAdminAiKeys();
    resetToAiPhotos();
    initDealerAvatars();
    try {
      const hasAdminAuth = localStorage.getItem('autoreels_admin_authenticated') === '1';
      const onAdminRoute = checkIsAdminRoute();
      if (onAdminRoute && !hasAdminAuth) {
        isAdminMode = false;
        setTimeout(openAdminAuthModal, 300);
      } else if (hasAdminAuth) {
        isAdminMode = true;
      } else {
        isAdminMode = false;
      }
      const loggedPhone = localStorage.getItem('autoreels_logged_phone');
      const accs = loadDealerAccounts();
      if (loggedPhone && accs[loggedPhone]) applyLoggedInDealer(accs[loggedPhone]);
    } catch (e) {}
    renderQuickSelector();
    renderAdminDealerList();
    renderThemeSwatches();
    renderStoryArchetypesUI();
    setTimeout(() => {
      try { renderDesignStylePicker(); } catch (e) {}
    }, 800);
    renderVisualStoryboardTrack();
    renderKillerCopyChips();
    const initPinned = getPinnedArchetype();
    if (initPinned && STORY_ARCHETYPES[initPinned]) {
      applyStoryArchetype(initPinned);
    } else {
      applyStoryArchetype('clearance');
    }
    // 저장된 업종 반영 (자동차가 아니면 그 업종의 첫 프리셋·템플릿으로 시작)
    setIndustry(IND.key, { silent: true, force: IND.key !== 'auto' });
    (function revealStudioAfterIndustry(){
      const s = document.getElementById('arStudioShell');
      if (s) s.style.opacity = '1';
    })();
    if (typeof loadCutDecos === 'function') loadCutDecos();
    if (typeof restoreAiScriptPrefs === 'function') restoreAiScriptPrefs();
    syncPreviewPanel();
    if (typeof renderPreviewCutPinBar === 'function') renderPreviewCutPinBar();
    syncTechPanel();
    applyRoleViewModeUI();
    try {
      const curTab = STUDIO_TABS.find((k) => { const el = document.getElementById(`studioPanel_${k}`); return el && !el.classList.contains('hidden'); }) || 'topic';
      arUpdateMobileStepBar(curTab);
      setTimeout(() => { try { arSyncIgSelects(); arSyncProductRows(); } catch (e) {} }, 0);
      // 휴대폰: 미리보기 위 고정 + 아래 바텀시트, 미리보기 옆 바로 누르는 버튼
      setTimeout(() => { try { if (window.innerWidth < 1024) arUpdateMobileStepBar('topic'); arSetupSheetMode(); } catch (e) {} }, 0);
      // 디자인 섞기 끔 (사장님 요청)
      setTimeout(() => {
        try {
          // 디자인 섞기는 쓰지 않음 (한 스타일로 처음부터 끝까지)
          campaign.cutDesigns = null;
          arRenderCutMixRow();
        } catch (e) {}
      }, 0);
    } catch (e) {}
    arUpdateEasyGuide('topic');
    // 처음 열 때도 기본 대본 문구에 맞게 사진 순서를 맞춤 (업종 사진·대본이 모두 정해진 뒤)
    setTimeout(() => { try { arMatchPhotosToCaptions(); } catch (e) {} }, 0);
    setTimeout(() => { try { if (!window.__arTopics) arLoadTopics(false); } catch (e) {} }, 0);
    window.__timelines['main'].seek(0);
    requestAnimationFrame(tick);

    // ============================================================================
    // 랜딩 페이지(/) · 스튜디오(/studio) 전환 및 업종별 실시간 미리보기
    // ============================================================================
    window.__arLandingInd = 'auto';

    function selectLandingIndustry(key) {
      if (typeof AR_INDUSTRIES === 'undefined') return;
      const ind = AR_INDUSTRIES[key] || AR_INDUSTRIES.auto;
      window.__arLandingInd = ind.key;
      const grid = document.getElementById('landingIndustryGrid');
      if (grid) {
        grid.innerHTML = Object.values(AR_INDUSTRIES).map((item) => {
          const on = item.key === ind.key;
          return `<button type="button" onclick="selectLandingIndustry('${item.key}')" class="px-3 py-2.5 rounded-[10px] border text-left cursor-pointer transition ${on ? 'bg-[#ededed] text-[#09090b] border-[#ededed] font-semibold' : 'bg-[#141415] hover:bg-[#1b1b1e] text-[#d4d4d8] border-[var(--border)]'}">
            <div class="text-[13px] truncate">${item.icon} ${item.name}</div>
            <div class="text-[11px] opacity-70 truncate mt-0.5">${item.role} · ${item.product}</div>
          </button>`;
        }).join('');
      }
      const badge = document.getElementById('landingPhoneBadge');
      const hook = document.getElementById('landingPhoneHook');
      const sub = document.getElementById('landingPhoneSub');
      const tags = document.getElementById('landingPhoneTags');
      const place = document.getElementById('landingPhonePlace');
      const promo = document.getElementById('landingPhonePromo');
      const btn = document.getElementById('landingStartIndustryBtn');
      if (badge) badge.textContent = `${ind.icon} ${ind.name}`;
      if (hook) hook.textContent = ind.vlogDone || `${ind.name} 프로모션`;
      if (sub) sub.textContent = `${ind.branchPlaceholder || ind.place} · "${ind.chatAsk || ind.cta}" — ${ind.promise}`;
      if (tags && Array.isArray(ind.hashtags)) {
        tags.innerHTML = ind.hashtags.slice(0, 4).map((t) => `<span class="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/80">#${t}</span>`).join('');
      }
      if (place) place.textContent = `${ind.branchPlaceholder || ind.place} · ${ind.title}`;
      if (promo) promo.textContent = ind.promoPlaceholder || '';
      if (btn) btn.textContent = `${ind.icon} ${ind.name}으로 바로 만들기 →`;
    }

    function applyLandingRouteState(showLanding) {
      const lv = document.getElementById('arLandingView');
      const ss = document.getElementById('arStudioShell');
      if (!lv || !ss) return;
      if (showLanding) {
        lv.classList.remove('hidden');
        ss.classList.add('hidden');
        selectLandingIndustry(window.__arLandingInd || (typeof IND !== 'undefined' && IND.key) || 'auto');
      } else {
        lv.classList.add('hidden');
        ss.classList.remove('hidden');
      }
    }

    function shouldShowLandingOnBoot() {
      const path = (window.location.pathname || '/').toLowerCase();
      const sp = new URLSearchParams(window.location.search || '');
      if (sp.get('landing') === '1') return true;
      if (path.startsWith('/studio') || path.startsWith('/admin')) return false;
      if (sp.has('sns') || sp.has('admin') || sp.has('role') || sp.has('billing') || sp.has('plan') || sp.has('code') || sp.has('state') || sp.has('paymentId')) return false;
      if ((window.location.hash || '').toLowerCase() === '#publish') return false;
      try {
        if (localStorage.getItem('ar_visited_studio') === '1') return false;
      } catch (e) {}
      return path === '/' || path === '';
    }

    let __arSplashTimer = null;
    function dismissAutoReelsSplash() {
      const sp = document.getElementById('arSplashIntro');
      if (!sp) return;
      if (__arSplashTimer) { clearTimeout(__arSplashTimer); __arSplashTimer = null; }
      sp.style.opacity = '0';
      sp.style.pointerEvents = 'none';
      setTimeout(() => { sp.classList.add('hidden'); }, 450);
    }

    function runAutoReelsSplash() {
      const sp = document.getElementById('arSplashIntro');
      if (!sp) return;
      document.documentElement.classList.remove('ar-landing-boot'); // 랜딩에서 스튜디오로 들어갈 때는 보여 줌
      if (__arSplashTimer) clearTimeout(__arSplashTimer);
      sp.style.opacity = '1';
      sp.style.pointerEvents = 'auto';
      sp.classList.remove('hidden');
      // 이미 한 번 재생됐으면 처음부터 다시
      sp.classList.remove('ar-play');
      void sp.offsetWidth;
      sp.classList.add('ar-play');
      __arSplashTimer = setTimeout(() => {
        dismissAutoReelsSplash();
      }, 2800);
    }

    function enterStudioFromLanding(indKey, planKey) {
      try { localStorage.setItem('ar_visited_studio', '1'); } catch (e) {}
      applyLandingRouteState(false);
      runAutoReelsSplash();
      try {
        if (window.location.pathname !== '/studio') {
          history.pushState({ arView: 'studio' }, '', '/studio');
        }
      } catch (e) {}
      if (indKey && typeof AR_INDUSTRIES !== 'undefined' && AR_INDUSTRIES[indKey] && typeof setIndustry === 'function') {
        setIndustry(indKey);
      }
      if (typeof syncPreviewPanel === 'function') syncPreviewPanel();
      if (window.__timelines && window.__timelines['main']) window.__timelines['main'].seek(0);
      if (planKey && typeof BILLING_PLANS !== 'undefined' && BILLING_PLANS[planKey] && typeof openBillingCheckoutModal === 'function') {
        selectedPlanKey = planKey;
        openBillingCheckoutModal(false);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function openLandingView() {
      // 2026-11-14: 랜딩은 가벼운 별도 페이지(/)로 분리됨 — 그쪽으로 이동
      window.location.href = '/?landing=1';
    }

    window.addEventListener('popstate', () => {
      const p = (window.location.pathname || '/').toLowerCase();
      const sp = new URLSearchParams(window.location.search || '');
      const showLanding = sp.get('landing') === '1' || ((p === '/' || p === '') && localStorage.getItem('ar_visited_studio') !== '1');
      applyLandingRouteState(showLanding);
    });

    function openArLegalModal(kind) {
      const m = document.getElementById('arLegalModal');
      const t = document.getElementById('arLegalModalTitle');
      const b = document.getElementById('arLegalModalBody');
      if (!m || !t || !b) return;
      const docs = {
        terms: ['이용약관', '<p>1. 본 서비스(AutoReelsMaker)는 업종별 릴스·쇼츠 영상 제작 및 SNS 발행 도구를 제공합니다.</p><p>2. 회원이 업로드한 사진·영상·문구에 대한 권리와 책임은 회원 본인에게 있습니다.</p><p>3. 유료 요금제(스탠다드 월 29,900원 / 프로 무제한 월 59,000원)는 매월 자동 결제되며 언제든 해지 예약이 가능합니다.</p>'],
        privacy: ['개인정보처리방침', '<p>1. 수집 항목: 이름, 휴대폰 번호, 매장·지점 정보, 카카오 로그인 이용 시 카카오 회원 식별자, 결제 및 서비스 이용 기록(다운로드·SNS 게시 횟수).</p><p>2. 이용 목적: 회원 식별, 정기구독 결제 처리, SNS 연동 발행, 고객 문의 응대.</p><p>3. 보유 기간: 회원 탈퇴 시까지(관계 법령에 따른 결제 기록 5년 보관).</p>'],
        refund: ['환불·해지 규정', '<p>1. 정기구독 해지는 결제 관리창에서 언제든 예약할 수 있으며, 남은 기간까지 계속 이용 가능합니다.</p><p>2. 결제 후 7일 이내에 유료 내보내기(워터마크 제거 다운로드 및 SNS 게시)를 1회도 사용하지 않은 경우 전액 환불이 가능합니다.</p>'],
        support: ['고객센터 안내', '<p>이메일: ektjtthsrk@gmail.com</p><p>연락처: 010-5872-7179</p><p>운영시간: 평일 10:00 ~ 18:00 (주말·공휴일 휴무)</p>']
      };
      const d = docs[kind] || docs.terms;
      t.textContent = d[0];
      b.innerHTML = d[1];
      m.classList.remove('hidden');
    }
    function closeArLegalModal() {
      const m = document.getElementById('arLegalModal');
      if (m) m.classList.add('hidden');
    }

    (function initLandingOrStudioBoot() {
      const showLanding = !window.arToolReturn && shouldShowLandingOnBoot();
      if (window.arToolReturn) {
        const url = new URL(location.href);
        if (url.searchParams.get('from') === 'shorts') url.searchParams.delete('from');
        const saved = history.state?.studioTool;
        if (saved) {
          if (saved.industry && saved.industry !== IND.key && AR_INDUSTRIES[saved.industry]) setIndustry(saved.industry);
          if (saved.design && arFindDesign(saved.design)) campaign.designStyle = saved.design;
          document.getElementById('topicCustomInput').value = saved.topic || '';
        }
        const state = { ...history.state };
        delete state.studioTool;
        history.replaceState(state, '', url);
      }
      document.querySelectorAll('[data-studio-tool]').forEach(link => link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        history.replaceState({ ...history.state, studioTool: { topic: document.getElementById('topicCustomInput').value, industry: IND.key, design: campaign.designStyle } }, '');
      }));
      if (!showLanding && (window.location.pathname === '/' || window.location.pathname === '') && !window.location.search && !window.location.hash) {
        try { history.replaceState({ arView: 'studio' }, '', '/studio'); } catch (e) {}
      }
      applyLandingRouteState(showLanding);
      const sp = new URLSearchParams(window.location.search || '');
      // 스플래시는 페이지를 열 때부터 보이고 있음: 제작 화면이면 조금 더 보여 준 뒤 닫고, 랜딩·SNS 복귀면 바로 닫음
      if (!showLanding && !sp.has('sns') && !sp.has('code')) {
        const shown = Date.now() - (window.__arSplashT0 || Date.now());
        __arSplashTimer = setTimeout(() => dismissAutoReelsSplash(), Math.max(400, 2800 - shown));
      } else {
        dismissAutoReelsSplash();
      }
      // 랜딩(/)의 버튼에서 넘어온 경우: /studio?ind=업종 · /studio?plan=요금제
      const indKey = sp.get('ind');
      const rawPlanKey = sp.get('plan');
      const planAlias = { standard: 'standard_29900', pro: 'pro_59000' };
      const planKey = planAlias[rawPlanKey] || rawPlanKey;
      if (!showLanding && (indKey || planKey)) {
        if (indKey && typeof AR_INDUSTRIES !== 'undefined' && AR_INDUSTRIES[indKey] && typeof setIndustry === 'function') setIndustry(indKey);
        if (planKey && typeof BILLING_PLANS !== 'undefined' && BILLING_PLANS[planKey] && typeof openBillingCheckoutModal === 'function') {
          selectedPlanKey = planKey;
          setTimeout(() => openBillingCheckoutModal(false), 600);
        }
        try { history.replaceState({ arView: 'studio' }, '', '/studio' + (window.location.hash || '')); } catch (e) {}
      }

      // 카카오톡 · 인스타그램 · 네이버 인앱 브라우저 감지 시 외부 브라우저 안내 배너 표시 (MP4 저장 안정화)
      try {
        const ua = navigator.userAgent || '';
        const isInApp = /KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(|Line\//i.test(ua);
        if (isInApp && !sessionStorage.getItem('ar_inapp_dismissed')) {
          const bar = document.createElement('div');
          bar.id = 'arInAppBrowserBanner';
          bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#141311;color:#f4f0e8;border-bottom:1px solid rgba(244,240,232,0.18);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;line-height:1.4;';
          const isAndroid = /Android/i.test(ua);
          const openBtnHtml = isAndroid
            ? `<a href="intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end" style="background:#f4f0e8;color:#080808;padding:6px 10px;border-radius:999px;font-weight:600;white-space:nowrap;text-decoration:none;">Chrome 열기</a>`
            : `<button type="button" id="arInAppCopyBtn" style="background:#f4f0e8;color:#080808;padding:6px 10px;border-radius:999px;font-weight:600;white-space:nowrap;border:0;cursor:pointer;">링크 복사</button>`;
          bar.innerHTML = `<div style="min-width:0;">인앱 브라우저에서는 MP4 저장이 제한될 수 있어요. <b>Safari / Chrome</b>으로 열어 주세요.</div><div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">${openBtnHtml}<button type="button" id="arInAppCloseBtn" aria-label="닫기" style="background:transparent;color:#a8a299;border:0;font-size:16px;padding:2px 6px;cursor:pointer;">×</button></div>`;
          document.body.appendChild(bar);
          const copyBtn = document.getElementById('arInAppCopyBtn');
          if (copyBtn) {
            copyBtn.addEventListener('click', () => {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(location.href).then(() => { copyBtn.textContent = '복사됨'; }).catch(() => {});
              }
            });
          }
          const closeBtn = document.getElementById('arInAppCloseBtn');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              sessionStorage.setItem('ar_inapp_dismissed', '1');
              bar.remove();
            });
          }
        }
      } catch (e) {}
    })();

// 계정별 프로젝트: 사진은 DB에 비공개 저장하고 라이선스·토큰은 저장하지 않습니다.
const AR_PROJECT_FIELDS = 'atmosphereFx bgGradient bullets carTitle colorKey cutCaptions cutCountOverride cutDecos cutDesigns cutElementOverrides cutFilters cutFrames cutLenScale cutOverlays cutSceneIndices cutScripts cutStrokes cutTransitions designCat designStyle discount discountNum hook industry isUserCustomPhotos kakaoChat layoutMode lookbookFinishedCards motionSeed neonColor presetKey priceLine priceTag scenePlan themeId topic ttsLines vehicle vehicleEntered'.split(' ');
let arProjectCurrent=null, arProjectBusy=false;
let arPhoneChallenge=null;
function arPanelNotice(id,text) { const e=document.getElementById(id); if(e) e.textContent=text; }
function arProjectUser() { return AR_SERVER.me?.user?.id; }
async function arProjectCall(action,body={}) {
  const r=await arApi(action,body);
  if(!r.ok) throw new Error(r.body.message||'처리하지 못했습니다. 다시 시도해 주세요.');
  return r.body;
}
async function arProjectImage(src,edge=1080) {
  if(/^\/assets\/[a-zA-Z0-9_./-]+$/.test(src)) return src;
  const img=new Image();img.crossOrigin='anonymous';img.src=src;
  await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('사진을 읽지 못했습니다.')),10000))]);
  const c=document.createElement('canvas'),scale=Math.min(1,edge/Math.max(img.naturalWidth,img.naturalHeight));
  c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  return c.toDataURL(edge===480?'image/png':'image/jpeg',0.8);
}
async function arCaptureProject() {
  let packPath='';
  if(AudioEngine.bgmStyle==='custom_mp3' && AudioEngine.customBgmAudioEl?.src){const u=new URL(AudioEngine.customBgmAudioEl.src,location.href);if(u.origin===location.origin && /^\/assets\/bgm\/pack\/[a-zA-Z0-9_-]+\.mp3$/.test(u.pathname))packPath=u.pathname;}
  if(campaign.hasCustomVideo || campaign.cutVideos?.some(Boolean) || (AudioEngine.bgmStyle==='custom_mp3'&&!packPath)) throw new Error('직접 올린 동영상·MP3는 아직 프로젝트 저장을 지원하지 않습니다. 사진과 기본 음악으로 저장해 주세요.');
  const data={};for(const k of AR_PROJECT_FIELDS) if(campaign[k]!==undefined) data[k]=JSON.parse(JSON.stringify(campaign[k]));
  const designIds = new Set([data.designStyle, ...[].concat(data.cutDesigns || [])]);
  const customStyles = [...designIds].map(id => arFindDesign(id)?.custom).filter(Boolean);
  const photos=[];
  for(const img of campaign.uploadedPhotos) photos.push({src:await arProjectImage(img._dataUrl||img.src),label:img._label||'',title:img._sceneTitle||''});
  for(const row of data.cutOverlays||[]) for(const overlay of row||[]) if(overlay.photoSrc) overlay.photoSrc=await arProjectImage(overlay.photoSrc,480);
  const d=getSelectedDealer(),card={};
  for(const k of ['name','title','branch','promoTag','cardHide','accentColor']) if(d[k]!==undefined) card[k]=JSON.parse(JSON.stringify(d[k]));
  if(d.logoImg) card.logo=await arProjectImage(d.logoImg.src,480);
  return {version:1,industry:IND.key,campaign:data,photos,card,customStyles,duration:BASE_DURATION,prompt:document.getElementById('aiPromptInput')?.value||'',audio:{voice:AudioEngine.ttsVoice,speed:AudioEngine.ttsSpeed,bgm:document.getElementById('bgmStyleSelect')?.value||AudioEngine.bgmStyle,packPath}};
}
async function arRestoreProject(p) {
  const s=p.snapshot;
  if(!s||s.version!==1) throw new Error('지원하지 않는 프로젝트 버전입니다.');
  if(s.industry!==IND.key) throw new Error('현재 계정 업종과 다른 프로젝트입니다.');
  const photos=await Promise.all(s.photos.map(async ph=>{
    const img=new Image();img.src=ph.src;img._dataUrl=ph.src;img._label=ph.label;img._sceneTitle=ph.title;
    await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('저장된 사진을 읽지 못했습니다.')),10000))]);return img;
  }));
  const lookbookItems=(s.campaign.scenePlan || []).flatMap(arLookbookItemImages);
  await Promise.allSettled(lookbookItems.map(img=>img.decode()));
  let logo=null;if(s.card?.logo){logo=new Image();logo.src=s.card.logo;await logo.decode();}
  if (arCustomLoadRequest) await arCustomLoadRequest;
  const designIds = new Set([s.campaign.designStyle, ...[].concat(s.campaign.cutDesigns || [])]);
  const projectStyles = Array.isArray(s.customStyles) ? s.customStyles : arReadBrowserStyles();
  await arSetProjectCustomStyles(projectStyles.filter(style => designIds.has(style?.id)));
  isPlaying=false;pauseAllCutVideos();AudioEngine.stopBgmLoop();AudioEngine.stopTts();
  for(const k of AR_PROJECT_FIELDS) { if(s.campaign[k]!==undefined) campaign[k]=s.campaign[k];else delete campaign[k]; }
  if (s.campaign.vehicleEntered === undefined) campaign.vehicleEntered = IND.key === 'auto' && Boolean(campaign.vehicle);
  cutElementOverrides = Array.isArray(campaign.cutElementOverrides) ? campaign.cutElementOverrides : [];
  window.cutElementOverrides = campaign.cutElementOverrides = cutElementOverrides;
  campaign.uploadedPhotos.forEach(arReleasePhoto);campaign.uploadedPhotos=photos;campaign.hasCustomVideo=false;campaign.cutVideos=[];campaign.cutVideoUrls=[];
  const d=getSelectedDealer();for(const k of ['name','title','branch','promoTag','cardHide','accentColor']) if(s.card?.[k]!==undefined)d[k]=s.card[k];d.logoImg=logo;
  arSyncEndingContactCopy();
  AudioEngine.masterBuffer=null;AudioEngine.masterCutBounds=[];AudioEngine.masterWantKey='';AudioEngine.masterDuration=0;AudioEngine.ttsCache.clear();
  for(const [id,value] of [['bgmStyleSelect',s.audio?.bgm],['ttsSpeedSelect',s.audio?.speed],['inputVehicle',campaign.vehicle],['inputDiscount',campaign.discount],['inputDiscountNum',campaign.discountNum],['aiPromptInput',s.prompt]]){
    const e=document.getElementById(id);if(e && value!=null)e.value=String(value);
  }
  AudioEngine.restoreVoice(s.audio?.voice||'off');AudioEngine.ttsSpeed=Number(s.audio?.speed)||1.1;
  AudioEngine.bgmStyle=s.audio?.bgm||'off';
  if(/^\/assets\/bgm\/pack\/[a-zA-Z0-9_-]+\.mp3$/.test(s.audio?.packPath||''))AudioEngine.loadRemoteBgmUrl(s.audio.packPath,'저장한 배경음악',false);
  BASE_DURATION=Math.max(6,Math.min(90,Number(s.duration)||12));
  applyVideoDurations();renderDynamicCutCardsUI();renderPhotoThumbnailsGrid();syncPreviewPanel();arSyncProductRows();
  if(window.__timelines?.main) window.__timelines.main.seek(0);
  if(AudioEngine.enabled && AudioEngine.ttsVoice!=='off')AudioEngine.schedulePrefetch(900);
  arProjectCurrent={id:p.id,revision:p.revision};
  document.getElementById('arProjectName').value=p.name;
  localStorage.setItem('ar_project_last_'+arProjectUser(),p.id);
}
async function arProjectRefresh() {
  const data=await arProjectCall('project-list'),box=document.getElementById('arProjectList');box.replaceChildren();
  for(const p of data.projects){
    const row=document.createElement('div');row.className='studio-sub p-3 space-y-2';
    const label=document.createElement('p');label.textContent=p.name+' · '+new Date(p.updated_at).toLocaleString('ko-KR');row.append(label);
    const load=document.createElement('button');load.type='button';load.className='btn-secondary h-8 px-3';load.textContent='불러오기';
    load.addEventListener('click',()=>arProjectWork(async()=>{
      if(!confirm('현재 편집을 저장하지 않았다면 사라집니다. 이 프로젝트를 불러올까요?'))return;
      const r=await arProjectCall('project-load',{id:p.id});await arRestoreProject(r.project);arPanelNotice('arProjectNotice','사진·대본·컷 편집을 불러왔습니다.');
    }));
    const del=document.createElement('button');del.type='button';del.className='btn-secondary h-8 px-3';del.textContent='삭제';
    del.addEventListener('click',()=>arProjectWork(async()=>{
      if(!confirm('이 저장 프로젝트를 삭제할까요?'))return;
      await arProjectCall('project-delete',{id:p.id,revision:p.revision});if(arProjectCurrent?.id===p.id)arProjectCurrent=null;
      await arProjectRefresh();arPanelNotice('arProjectNotice','저장 프로젝트를 삭제했습니다.');
    }));row.append(load,del);box.append(row);
  }
  if(!data.projects.length)box.textContent='저장된 프로젝트가 없습니다.';
}
async function arProjectWork(fn) {
  if(arProjectBusy)return;arProjectBusy=true;
  document.querySelectorAll('#arProjectsModal button').forEach(b=>b.disabled=true);
  try{await fn();}catch(e){arPanelNotice('arProjectNotice',e.message);}finally{arProjectBusy=false;document.querySelectorAll('#arProjectsModal button').forEach(b=>b.disabled=false);}
}
async function arOpenProjects() {
  if(!arProjectUser()){openDealerAuthModal();return;}
  document.getElementById('arProjectsModal').classList.remove('hidden');await arProjectWork(arProjectRefresh);
}
async function arSaveProject(asNew) {
  await arProjectWork(async()=>{
    arPanelNotice('arProjectNotice','사진과 편집 정보를 저장하는 중입니다…');
    const snapshot=await arCaptureProject();
    const name=document.getElementById('arProjectName').value||campaign.vehicle||'새 프로젝트';
    const id=asNew||!arProjectCurrent?crypto.randomUUID():arProjectCurrent.id;
    const r=await arProjectCall('project-save',{id,name,snapshot,revision:asNew?0:arProjectCurrent?.revision||0});
    arProjectCurrent={id:r.project.id,revision:r.project.revision};localStorage.setItem('ar_project_last_'+arProjectUser(),r.project.id);
    await arProjectRefresh();arPanelNotice('arProjectNotice','저장했습니다. 다른 기기에서도 내 프로젝트에서 불러올 수 있습니다.');
  });
}
async function arSendPhoneCode() {
  const btn = document.getElementById('arSendCode');
  const input = document.getElementById('authPhoneInput');
  const phone = input.value;
  const tab = authModalTab;
  if (!['signup', 'reset'].includes(tab) || btn.disabled) return;
  btn.dataset.sending = 'true';
  btn.disabled = true;
  try{
    const r = await arProjectCall('phone-code', { phone, purpose: tab });
    if (authModalTab !== tab || input.value !== phone) return;
    arPhoneChallenge = { id: r.challengeId, phone, purpose: tab };
    arPanelNotice('arPhoneNotice', '인증번호를 보냈습니다. 5분 안에 입력해 주세요.');
  } catch (error) {
    if (authModalTab === tab && input.value === phone) arPanelNotice('arPhoneNotice', error.message);
  } finally {
    delete btn.dataset.sending;
    arAuthVerificationUI();
  }
}
function arAuthVerificationUI() {
  const reset = authModalTab === 'reset';
  const login = authModalTab === 'login';
  const unavailable = AR_SERVER.cfg?.serverMode === true && AR_SERVER.cfg.phoneVerification === false;
  const send = document.getElementById('arSendCode');
  const submit = document.getElementById('authSubmitBtn');
  document.getElementById('arPhoneVerification').classList.toggle('hidden', login);
  document.getElementById('arPhoneCodeFields').classList.toggle('hidden', login || !arPhoneChallenge);
  document.getElementById('arForgotPassword').classList.toggle('hidden', !login);
  document.getElementById('authPasswordInput').autocomplete = login ? 'current-password' : 'new-password';
  document.getElementById('authPwLabel').textContent = reset ? '새 비밀번호 (8자 이상)' : login ? '비밀번호' : '비밀번호 (8자 이상)';
  send.disabled = unavailable || send.dataset.sending === 'true';
  submit.disabled = submit.dataset.submitting === 'true' || (!login && unavailable);
  submit.textContent = reset ? '인증하고 비밀번호 재설정' : login ? '로그인' : '회원가입';
  if (!login && unavailable) arPanelNotice('arPhoneNotice', '지금은 문자 인증을 사용할 수 없습니다. 카카오 로그인 또는 기존 휴대폰 로그인을 이용해 주세요.');
}
async function arSecurityAction(action) {
  try{
    const password=document.getElementById('arSecurityCurrent').value;
    await arProjectCall(action,action==='password'?{current:password,next:document.getElementById('arSecurityNext').value}:{password});
    document.getElementById('arSecurityCurrent').value='';document.getElementById('arSecurityNext').value='';
    arPanelNotice('arSecurityNotice',action==='password'?'비밀번호를 변경하고 다른 기기의 로그인을 해제했습니다.':'다른 기기의 로그인을 해제했습니다.');
  }catch(e){arPanelNotice('arSecurityNotice',e.message);}
}
async function arShowSnsHistory() {
  const box=document.getElementById('arSnsHistory');box.textContent='조회 중…';
  try{
    const r=await arSnsApi('history',{});if(!r.ok)throw new Error(r.body.message||'로그인 후 확인할 수 있습니다.');box.replaceChildren();
    const labels={scheduled:'예약 대기',cancelled:'취소됨',done:'게시 완료',failed:'실패',review:'게시 결과 확인 필요',starting:'게시 시작',processing:'처리 중',checking:'결과 확인 중',pending:'처리 중'};
    for(const j of r.body.jobs){
      const row=document.createElement('div');row.className='studio-sub p-3 space-y-2';
      const text=document.createElement('p');text.textContent=`${AR_SNS_NAMES[j.target]||j.target} · ${labels[j.status]||j.status} · ${new Date(j.scheduledAt||j.createdAt).toLocaleString('ko-KR')}${j.error?' · '+j.error:''}`;row.append(text);
      if(j.status==='scheduled'){
        const b=document.createElement('button');b.type='button';b.className='btn-secondary h-8 px-3';b.textContent='예약 취소';
        b.addEventListener('click',async()=>{b.disabled=true;try{const out=await arSnsApi('cancel-job',{id:j.id});if(!out.ok)throw new Error(out.body.message);await arShowSnsHistory();}catch(e){text.textContent=e.message;b.disabled=false;}});row.append(b);
      }box.append(row);
    }
    if(!r.body.jobs.length)box.textContent='발행 내역이 없습니다.';
  }catch(e){box.textContent=e.message;}
}
document.getElementById('arProjectsOpen').addEventListener('click',arOpenProjects);
document.getElementById('arProjectsClose').addEventListener('click',()=>document.getElementById('arProjectsModal').classList.add('hidden'));
document.getElementById('arProjectSave').addEventListener('click',()=>arSaveProject(false));
document.getElementById('arProjectSaveNew').addEventListener('click',()=>arSaveProject(true));
document.getElementById('arSendCode').addEventListener('click',arSendPhoneCode);
document.getElementById('arPhoneAuthForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!document.getElementById('authSubmitBtn').disabled) submitDealerAuthForm();
});
document.getElementById('arForgotPassword').addEventListener('click', () => switchAuthModalTab('reset'));
document.getElementById('arKakaoTerms').addEventListener('click', () => openArLegalModal('terms'));
document.getElementById('arKakaoPrivacy').addEventListener('click', () => openArLegalModal('privacy'));
document.getElementById('arPasswordChange').addEventListener('click',()=>arSecurityAction('password'));
document.getElementById('arSessionsRevoke').addEventListener('click',()=>arSecurityAction('sessions-revoke'));
document.getElementById('arHistoryRefresh').addEventListener('click',arShowSnsHistory);
document.getElementById('authPhoneInput').addEventListener('input', () => {
  arPhoneChallenge = null;
  document.getElementById('arPhoneCode').value = '';
  arPanelNotice('arPhoneNotice', '');
  arAuthVerificationUI();
});

let arProjectInteracted=false,arProjectRestoredUser=null;
document.addEventListener('pointerdown',()=>{arProjectInteracted=true;},{once:true,capture:true});
document.addEventListener('keydown',()=>{arProjectInteracted=true;},{once:true,capture:true});
async function arRestoreLastProject(){
  if(window.__arRestoredLocalSnapshot || sessionStorage.getItem('ar_return_restore')==='1') return;
  const uid=arProjectUser();if(!uid||arProjectRestoredUser===uid)return;arProjectRestoredUser=uid;
  let id;try{id=localStorage.getItem('ar_project_last_'+uid);}catch(_){}
  if(!id||arProjectInteracted)return;
  try{const r=await arProjectCall('project-load',{id});if(arProjectInteracted||window.__arRestoredLocalSnapshot)return;await arRestoreProject(r.project);arToast('저장한 프로젝트를 복구했습니다.',true);}
  catch(e){arToast('저장 프로젝트를 자동 복구하지 못했습니다. 내 프로젝트에서 다시 불러와 주세요.');}
}

// =========================================================================
// IndexedDB 자동 스냅샷 저장 & 복구 (사진·대본·자막·스타일·성우·BGM 전체 보존)
// 카카오 로그인 / SNS OAuth / 참고 영상·쇼츠 도구 이동 시 유실 ZERO
// =========================================================================
(function initFullAutoSnapshot() {
  const DB_NAME = 'ar_local_autosave_v1';
  const STORE = 'snapshots';
  const KEY = 'latest';
  let saveTimer = null;
  let userDirty = false;
  let savingPromise = null;

  function openIdb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('no_idb'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('idb_open_failed'));
    });
  }

  async function idbPut(val) {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(val, KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async function idbGet() {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => { db.close(); resolve(req.result || null); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  }

  async function idbDel() {
    try {
      const db = await openIdb();
      await new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(KEY);
        tx.oncomplete = tx.onerror = () => { db.close(); resolve(); };
      });
    } catch (_) {}
  }

  async function captureLocalSafe() {
    if (typeof campaign === 'undefined' || !campaign || typeof IND === 'undefined') return null;
    let packPath = '';
    if (AudioEngine.bgmStyle === 'custom_mp3' && AudioEngine.customBgmAudioEl?.src) {
      try {
        const u = new URL(AudioEngine.customBgmAudioEl.src, location.href);
        if (u.origin === location.origin && /^\/assets\/bgm\/pack\/[a-zA-Z0-9_-]+\.mp3$/.test(u.pathname)) packPath = u.pathname;
      } catch (_) {}
    }
    const data = {};
    for (const k of AR_PROJECT_FIELDS) {
      if (campaign[k] !== undefined) data[k] = JSON.parse(JSON.stringify(campaign[k]));
    }
    const designIds = new Set([data.designStyle, ...[].concat(data.cutDesigns || [])]);
    const customStyles = [...designIds].map((id) => (typeof arFindDesign === 'function' ? arFindDesign(id)?.custom : null)).filter(Boolean);
    const photos = [];
    for (const img of (campaign.uploadedPhotos || [])) {
      try {
        photos.push({ src: await arProjectImage(img._dataUrl || img.src, 1080), label: img._label || '', title: img._sceneTitle || '' });
      } catch (_) {}
    }
    for (const row of (data.cutOverlays || [])) {
      for (const overlay of (row || [])) {
        if (overlay && overlay.photoSrc) {
          try { overlay.photoSrc = await arProjectImage(overlay.photoSrc, 480); } catch (_) {}
        }
      }
    }
    const d = typeof getSelectedDealer === 'function' ? getSelectedDealer() : {};
    const card = {};
    for (const k of ['name', 'title', 'branch', 'promoTag', 'cardHide', 'accentColor']) {
      if (d[k] !== undefined) card[k] = JSON.parse(JSON.stringify(d[k]));
    }
    if (d.logoImg && d.logoImg.src) {
      try { card.logo = await arProjectImage(d.logoImg.src, 480); } catch (_) {}
    }
    return {
      version: 1,
      industry: IND.key,
      campaign: data,
      photos,
      card,
      customStyles,
      duration: typeof BASE_DURATION !== 'undefined' ? BASE_DURATION : 12,
      prompt: document.getElementById('aiPromptInput')?.value || '',
      audio: {
        voice: AudioEngine.ttsVoice,
        speed: AudioEngine.ttsSpeed,
        bgm: document.getElementById('bgmStyleSelect')?.value || AudioEngine.bgmStyle,
        packPath
      }
    };
  }

  async function restoreLocalSafe(s) {
    if (!s || s.version !== 1) return false;
    if (s.industry && s.industry !== IND.key && typeof setIndustry === 'function' && typeof AR_INDUSTRIES !== 'undefined' && AR_INDUSTRIES[s.industry]) {
      try { setIndustry(s.industry); } catch (_) {}
    }
    const photos = [];
    for (const ph of (s.photos || [])) {
      try {
        const img = new Image();
        img.src = ph.src;
        img._dataUrl = ph.src;
        img._label = ph.label || '';
        img._sceneTitle = ph.title || '';
        await Promise.race([img.decode(), new Promise((_, rej) => setTimeout(() => rej(new Error('decode_timeout')), 8000))]);
        photos.push(img);
      } catch (_) {}
    }
    let logo = null;
    if (s.card?.logo) {
      try { logo = new Image(); logo.src = s.card.logo; await logo.decode(); } catch (_) { logo = null; }
    }
    if (typeof arCustomLoadRequest !== 'undefined' && arCustomLoadRequest) {
      try { await arCustomLoadRequest; } catch (_) {}
    }
    const designIds = new Set([s.campaign.designStyle, ...[].concat(s.campaign.cutDesigns || [])]);
    const projectStyles = Array.isArray(s.customStyles) ? s.customStyles : (typeof arReadBrowserStyles === 'function' ? arReadBrowserStyles() : []);
    if (typeof arSetProjectCustomStyles === 'function') {
      try { await arSetProjectCustomStyles(projectStyles.filter((st) => designIds.has(st?.id))); } catch (_) {}
    }
    isPlaying = false;
    if (typeof pauseAllCutVideos === 'function') pauseAllCutVideos();
    AudioEngine.stopBgmLoop();
    AudioEngine.stopTts();
    for (const k of AR_PROJECT_FIELDS) {
      if (s.campaign[k] !== undefined) campaign[k] = s.campaign[k];
      else delete campaign[k];
    }
    if (s.campaign.vehicleEntered === undefined) campaign.vehicleEntered = IND.key === 'auto' && Boolean(campaign.vehicle);
    cutElementOverrides = Array.isArray(campaign.cutElementOverrides) ? campaign.cutElementOverrides : [];
    window.cutElementOverrides = campaign.cutElementOverrides = cutElementOverrides;
    if (photos.length) {
      (campaign.uploadedPhotos || []).forEach(arReleasePhoto);
      campaign.uploadedPhotos = photos;
      campaign.hasCustomVideo = false;
      campaign.cutVideos = [];
      campaign.cutVideoUrls = [];
    }
    const d = typeof getSelectedDealer === 'function' ? getSelectedDealer() : null;
    if (d) {
      for (const k of ['name', 'title', 'branch', 'promoTag', 'cardHide', 'accentColor']) {
        if (s.card?.[k] !== undefined) d[k] = s.card[k];
      }
      if (logo) d.logoImg = logo;
      if (typeof arSyncEndingContactCopy === 'function') arSyncEndingContactCopy();
    }
    AudioEngine.masterBuffer = null;
    AudioEngine.masterCutBounds = [];
    AudioEngine.masterWantKey = '';
    AudioEngine.masterDuration = 0;
    AudioEngine.ttsCache.clear();
    for (const [id, value] of [['bgmStyleSelect', s.audio?.bgm], ['ttsSpeedSelect', s.audio?.speed], ['inputVehicle', campaign.vehicle], ['inputDiscount', campaign.discount], ['inputDiscountNum', campaign.discountNum], ['aiPromptInput', s.prompt]]) {
      const e = document.getElementById(id);
      if (e && value != null) e.value = String(value);
    }
    AudioEngine.restoreVoice(s.audio?.voice || 'off');
    AudioEngine.ttsSpeed = Number(s.audio?.speed) || 1.1;
    AudioEngine.bgmStyle = s.audio?.bgm || 'off';
    if (/^\/assets\/bgm\/pack\/[a-zA-Z0-9_-]+\.mp3$/.test(s.audio?.packPath || '')) {
      AudioEngine.loadRemoteBgmUrl(s.audio.packPath, '저장한 배경음악', false);
    }
    BASE_DURATION = Math.max(6, Math.min(90, Number(s.duration) || 12));
    if (typeof applyVideoDurations === 'function') applyVideoDurations();
    if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
    if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
    if (typeof syncPreviewPanel === 'function') syncPreviewPanel();
    if (typeof arSyncProductRows === 'function') arSyncProductRows();
    if (window.__timelines?.main) window.__timelines.main.seek(0);
    if (AudioEngine.enabled && AudioEngine.ttsVoice !== 'off') AudioEngine.schedulePrefetch(900);
    return true;
  }

  window.arSaveLocalSnapshot = async function (markReturnJump = false) {
    if (markReturnJump) {
      try { sessionStorage.setItem('ar_return_restore', '1'); } catch (_) {}
    }
    if (savingPromise) return savingPromise;
    savingPromise = (async () => {
      try {
        const snapshot = await captureLocalSafe();
        if (!snapshot) return;
        await idbPut({ savedAt: Date.now(), snapshot });
      } catch (_) {}
      finally { savingPromise = null; }
    })();
    return savingPromise;
  };

  function scheduleSnapshot() {
    userDirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { window.arSaveLocalSnapshot(false); }, 1800);
  }

  // 편집 입력·파일 선택·스타일/BGM 변경 감지
  document.addEventListener('input', (e) => {
    if (e.target && e.target.closest && e.target.closest('#dealerAuthModal, #billingCheckoutModal, #adminAuthModal')) return;
    scheduleSnapshot();
  }, true);
  document.addEventListener('change', (e) => {
    if (e.target && e.target.closest && e.target.closest('#dealerAuthModal, #billingCheckoutModal, #adminAuthModal')) return;
    scheduleSnapshot();
  }, true);

  // 참고 영상 재구성(/assets/remix) · 쇼츠 추출(/assets/shorts) 도구 이동 직전 자동 스냅샷 저장
  document.addEventListener('click', async (e) => {
    const toolLink = e.target && e.target.closest ? e.target.closest('a[data-studio-tool]') : null;
    if (!toolLink) return;
    const href = toolLink.getAttribute('href');
    if (!href) return;
    e.preventDefault();
    try { await Promise.race([window.arSaveLocalSnapshot(true), new Promise((r) => setTimeout(r, 900))]); } catch (_) {}
    window.location.href = href;
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && userDirty) window.arSaveLocalSnapshot(false);
  });
  window.addEventListener('pagehide', () => {
    if (userDirty) window.arSaveLocalSnapshot(false);
  });

  // 복귀 자동 복원 (카카오 로그인 / SNS OAuth / 쇼츠·리믹스 도구 복귀) 또는 새로고침 시 이어하기 안내
  const spBoot = new URLSearchParams(window.location.search || '');
  const isReturningFromJump =
    sessionStorage.getItem('ar_return_restore') === '1' ||
    spBoot.get('kakao') === 'success' ||
    spBoot.get('sns') === 'connected' ||
    spBoot.get('from') === 'shorts';

  setTimeout(async () => {
    try {
      const rec = await idbGet();
      if (!rec || !rec.snapshot || !rec.savedAt || Date.now() - rec.savedAt > 24 * 3600 * 1000) return;

      if (isReturningFromJump) {
        try { sessionStorage.removeItem('ar_return_restore'); } catch (_) {}
        window.__arRestoredLocalSnapshot = true;
        const ok = await restoreLocalSafe(rec.snapshot);
        if (ok && typeof arToast === 'function') {
          arToast('방금 편집하던 사진·대본·설정을 그대로 복구했습니다.', true);
        }
        return;
      }

      // 일반 새로고침: 이미 사용자가 조작을 시작했으면 방해하지 않음
      if (arProjectInteracted || window.__arRestoredLocalSnapshot) return;
      const bar = document.createElement('div');
      bar.id = 'arDraftRestoreBar';
      bar.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9000;background:#141311;color:#f4f0e8;border:1px solid rgba(244,240,232,0.22);border-radius:999px;padding:8px 14px;display:flex;align-items:center;gap:10px;font-size:12.5px;box-shadow:0 12px 32px rgba(0,0,0,0.6);max-width:calc(100vw - 24px);';
      bar.innerHTML = '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">이전 작업(사진·대본·설정)이 남아 있어요</span>' +
        '<button type="button" id="arDraftRestoreBtn" style="background:#f4f0e8;color:#080808;border:0;border-radius:999px;padding:4px 12px;font-weight:600;cursor:pointer;white-space:nowrap;">이어하기</button>' +
        '<button type="button" id="arDraftDismissBtn" aria-label="닫기" style="background:transparent;color:#a8a299;border:0;font-size:15px;cursor:pointer;padding:0 4px;">×</button>';
      document.body.appendChild(bar);
      document.getElementById('arDraftRestoreBtn').addEventListener('click', async () => {
        bar.remove();
        window.__arRestoredLocalSnapshot = true;
        const ok = await restoreLocalSafe(rec.snapshot);
        if (ok && typeof arToast === 'function') arToast('이전 작업(사진·대본·설정)을 불러왔습니다.', true);
      });
      document.getElementById('arDraftDismissBtn').addEventListener('click', () => {
        idbDel();
        bar.remove();
      });
    } catch (_) {}
  }, isReturningFromJump ? 900 : 2200);
})();

// =========================================================================
// 내 사진 · AI 생성 이미지 자동 보관함 (IndexedDB: ar_media_vault_v1)
// 다시 로그인/재방문 시 기본 BMW 예시 대신 내 이미지 자동 재사용 + 원클릭 적용
// =========================================================================
(function initMediaVault() {
  const VAULT_DB = 'ar_media_vault_v1';
  const VAULT_STORE = 'items';
  const MAX_ITEMS = 36;

  function openVault() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('no_idb'));
      const req = indexedDB.open(VAULT_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(VAULT_STORE)) db.createObjectStore(VAULT_STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('vault_open_failed'));
    });
  }

  async function vaultAll() {
    const db = await openVault();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VAULT_STORE, 'readonly');
      const req = tx.objectStore(VAULT_STORE).getAll();
      req.onsuccess = () => {
        db.close();
        const rows = Array.isArray(req.result) ? req.result : [];
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(rows);
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  }

  async function vaultPutMany(entries) {
    const db = await openVault();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(VAULT_STORE, 'readwrite');
      const st = tx.objectStore(VAULT_STORE);
      entries.forEach((it) => st.put(it));
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
    // 최대 개수 초과 시 오래된 항목 정리
    const all = await vaultAll();
    if (all.length > MAX_ITEMS) {
      const drop = all.slice(MAX_ITEMS);
      const db2 = await openVault();
      await new Promise((resolve) => {
        const tx = db2.transaction(VAULT_STORE, 'readwrite');
        const st = tx.objectStore(VAULT_STORE);
        drop.forEach((it) => st.delete(it.id));
        tx.oncomplete = tx.onerror = () => { db2.close(); resolve(); };
      });
    }
  }

  async function vaultDelete(id) {
    try {
      const db = await openVault();
      await new Promise((resolve) => {
        const tx = db.transaction(VAULT_STORE, 'readwrite');
        tx.objectStore(VAULT_STORE).delete(id);
        tx.oncomplete = tx.onerror = () => { db.close(); resolve(); };
      });
    } catch (_) {}
  }

  function fpOf(src) {
    const s = String(src || '');
    return s.length + ':' + s.slice(0, 64) + ':' + s.slice(-48);
  }

  function isStockSceneUrl(src) {
    const s = String(src || '');
    return /^\/assets\/(scenes|topics|landing)\//.test(s) || /\/assets\/(scenes|topics|landing)\//.test(s);
  }

  async function decodeVaultImg(item) {
    const img = new Image();
    img.src = item.src;
    img._dataUrl = item.src;
    img._label = item.source === 'ai' ? 'AI 보관함' : '내 사진 보관함';
    img._sceneTitle = item.label || '';
    await Promise.race([img.decode(), new Promise((_, rej) => setTimeout(() => rej(new Error('decode_timeout')), 8000))]);
    return img;
  }

  window.arVaultSaveImages = async function (imgList, source = 'upload') {
    try {
      if (!Array.isArray(imgList) || !imgList.length) return;
      const ind = (typeof IND !== 'undefined' && IND?.key) ? IND.key : 'auto';
      const existing = await vaultAll();
      const seen = new Set(existing.map((x) => x.fp));
      const toAdd = [];
      for (const img of imgList) {
        if (!img || img._isVideo) continue;
        const rawSrc = img._dataUrl || img.src || '';
        if (!rawSrc || isStockSceneUrl(rawSrc)) continue;
        let dataUrl = rawSrc;
        if (!rawSrc.startsWith('data:image/')) {
          try { dataUrl = await arProjectImage(rawSrc, 1080); } catch (_) { continue; }
        }
        const fp = fpOf(dataUrl);
        if (seen.has(fp)) continue;
        seen.add(fp);
        toAdd.push({
          id: 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          fp,
          industry: ind,
          source: source === 'ai' ? 'ai' : 'upload',
          label: String(img._sceneTitle || img._label || (source === 'ai' ? 'AI 이미지' : '내 사진')).slice(0, 32),
          src: dataUrl,
          createdAt: Date.now()
        });
      }
      if (toAdd.length) {
        await vaultPutMany(toAdd);
        window.arRenderMediaVault();
      }
    } catch (_) {}
  };

  async function applyVaultListToReel(items, silent = false) {
    if (!Array.isArray(items) || !items.length || typeof campaign === 'undefined') return false;
    const total = Math.max(4, typeof getTargetCutCount === 'function' ? getTargetCutCount() : 4);
    const chosen = items.slice(0, total);
    const imgs = [];
    for (const it of chosen) {
      try { imgs.push(await decodeVaultImg(it)); } catch (_) {}
    }
    if (!imgs.length) return false;
    (campaign.uploadedPhotos || []).forEach(arReleasePhoto);
    campaign.uploadedPhotos = imgs;
    campaign.isUserCustomPhotos = true;
    campaign.hasCustomVideo = false;
    if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
    if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
    if (typeof syncPreviewPanel === 'function') syncPreviewPanel();
    if (window.__timelines?.main) window.__timelines.main.seek(window.__timelines.main.currentTime || 0);
    if (!silent && typeof arToast === 'function') {
      arToast(`보관함의 내 이미지 ${imgs.length}장을 바로 적용했습니다.`, true);
    }
    return true;
  }

  window.arRenderMediaVault = async function () {
    const box = document.getElementById('arMediaVaultBox');
    const listEl = document.getElementById('arMediaVaultList');
    const cntEl = document.getElementById('arMediaVaultCount');
    if (!box || !listEl) return;
    try {
      const all = await vaultAll();
      const curInd = (typeof IND !== 'undefined' && IND?.key) ? IND.key : 'auto';
      // 현재 업종 이미지를 맨 앞으로 정렬
      const sorted = all.slice().sort((a, b) => {
        const am = a.industry === curInd ? 1 : 0;
        const bm = b.industry === curInd ? 1 : 0;
        if (am !== bm) return bm - am;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      if (!sorted.length) {
        box.classList.add('hidden');
        return;
      }
      box.classList.remove('hidden');
      if (cntEl) cntEl.textContent = `${sorted.length}장`;
      listEl.replaceChildren();
      sorted.forEach((item) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:relative;flex:0 0 auto;width:62px;height:86px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.14);background:#141415;cursor:pointer;';
        wrap.title = `${item.source === 'ai' ? 'AI 생성' : '내 사진'} — 눌러서 현재 컷에 적용`;
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.label || '';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        const tag = document.createElement('span');
        tag.textContent = item.source === 'ai' ? 'AI' : '내 사진';
        tag.style.cssText = 'position:absolute;left:4px;bottom:4px;background:rgba(0,0,0,0.72);color:#f4f0e8;font-size:9px;padding:1px 5px;border-radius:4px;pointer-events:none;';
        const del = document.createElement('button');
        del.type = 'button';
        del.textContent = '×';
        del.setAttribute('aria-label', '보관함에서 삭제');
        del.style.cssText = 'position:absolute;right:2px;top:2px;width:18px;height:18px;border-radius:999px;background:rgba(0,0,0,0.72);color:#d4d4d8;border:0;font-size:12px;line-height:1;cursor:pointer;';
        del.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          await vaultDelete(item.id);
          window.arRenderMediaVault();
        });
        wrap.addEventListener('click', async () => {
          try {
            const loaded = await decodeVaultImg(item);
            const curT = window.__timelines?.main?.currentTime || 0;
            const cutIdx = typeof getCutIndexAt === 'function' ? Math.max(0, getCutIndexAt(curT)) : 0;
            if (!Array.isArray(campaign.uploadedPhotos)) campaign.uploadedPhotos = [];
            while (campaign.uploadedPhotos.length <= cutIdx) campaign.uploadedPhotos.push(loaded);
            campaign.uploadedPhotos[cutIdx] = loaded;
            campaign.isUserCustomPhotos = true;
            if (typeof renderPhotoThumbnailsGrid === 'function') renderPhotoThumbnailsGrid();
            if (typeof renderDynamicCutCardsUI === 'function') renderDynamicCutCardsUI();
            if (window.__timelines?.main) window.__timelines.main.seek(curT);
            if (typeof arToast === 'function') arToast(`${cutIdx + 1}컷에 보관함 이미지를 적용했습니다.`, true);
          } catch (_) {}
        });
        wrap.append(img, tag, del);
        listEl.appendChild(wrap);
      });

      const applyAllBtn = document.getElementById('arMediaVaultApplyAll');
      if (applyAllBtn && !applyAllBtn.dataset.bound) {
        applyAllBtn.dataset.bound = '1';
        applyAllBtn.addEventListener('click', async () => {
          const latest = await vaultAll();
          const indNow = (typeof IND !== 'undefined' && IND?.key) ? IND.key : 'auto';
          const indFirst = latest.filter((x) => x.industry === indNow);
          await applyVaultListToReel(indFirst.length ? indFirst : latest, false);
        });
      }
    } catch (_) {}
  };

  // 초기 진입/재로그인 시: 기본 예시(BMW 등) 대신 이전에 올리거나 생성한 내 업종 이미지가 있으면 자동 재사용
  setTimeout(async () => {
    try {
      await window.arRenderMediaVault();
      if (window.__arRestoredLocalSnapshot || arProjectInteracted) return;
      if (typeof campaign === 'undefined' || campaign.isUserCustomPhotos) return;
      const all = await vaultAll();
      const curInd = (typeof IND !== 'undefined' && IND?.key) ? IND.key : 'auto';
      const mine = all.filter((x) => x.industry === curInd);
      if (!mine.length) return;
      const ok = await applyVaultListToReel(mine, true);
      if (ok && typeof arToast === 'function') {
        arToast(`이전에 사용한 내 이미지 ${Math.min(mine.length, getTargetCutCount())}장을 자동으로 불러왔습니다.`, true);
      }
    } catch (_) {}
  }, 1700);
})();
