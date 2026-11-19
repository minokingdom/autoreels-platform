# AGENTS.md — AutoReels 작업 지침

이 저장소를 고치는 모든 AI 에이전트(Claude, Codex, Gemini/Antigravity)와 사람이 따르는 규칙입니다.
같은 실수가 반복되지 않도록 실제로 겪은 문제를 기준으로 적었습니다. 사용자 답변과 코드 주석은 한국어로 씁니다.

## 1. 코드 위치 (2026-11-14 구조 변경)
- **주소와 파일:** `/`는 랜딩 `public/index.html`(가벼운 별도 페이지), `/studio`와 그 밖의 주소는 제작 화면 `public/studio.html`(HTML 뼈대만) + `public/assets/app/` 스크립트 13개·CSS입니다. 파일별 내용은 `docs/code-structure.md`.
- **고칠 곳은 `public/` 아래뿐입니다.** Vercel은 `public/`만 배포합니다. 루트 `index.html`은 없앴으니 다시 만들거나 복사하지 마세요.
- 원본 13개 파일을 `scripts/build-app.mjs`가 번호 순서대로 합쳐 `public/assets/app/app.js`를 만들고, `studio.html`은 그 하나만 불러옵니다(Vercel 배포·`npm start`·스모크 테스트가 자동으로 합침). **`app.js`는 자동 생성 파일 — 직접 고치거나 커밋하지 마세요.** 모든 파일이 전역 이름을 공유합니다.
  - 파일을 따로 불러오게 되돌리지 마세요. 파일 사이에 타이머가 끼어들어 썸네일이 멈추는 문제가 있었습니다.
  - `type="module"`, `defer`, `async`로 바꾸지 마세요.
  - 파일을 **불러오는 순간** 실행되는 코드(최상위 호출·변수 초기값)에서 뒤 번호 파일의 함수·변수를 쓰면 안 됩니다. 버튼 클릭이나 화면이 다 뜬 뒤 실행되는 코드는 괜찮습니다.
  - 새 기능은 맞는 번호 파일에 넣습니다. 새 파일이 필요하면 `studio.html`의 순서 목록과 `docs/code-structure.md`를 같이 고칩니다.
- **랜딩(`public/index.html`)은 제작 화면 코드를 받지 않습니다.** 제작 화면의 1.7MB 스크립트·글꼴을 받으면 랜딩이 늦게 뜹니다(예전 4.5MB → 지금 약 0.4MB).
  - 스타일은 tailwind 로 미리 만든 `public/assets/landing/landing.css`. 랜딩 마크업·`landing.js`의 클래스를 바꾸면 `npm run build:landing-css`로 다시 만들어 커밋합니다.
  - 업종 미리보기 데이터는 배포 때 `scripts/build-app.mjs`가 `01-industries.js`에서 뽑아 `assets/landing/industries.js`(자동 생성, 커밋 안 함)를 만듭니다.
  - 랜딩 버튼은 `/studio`, `/studio?ind=업종`, `/studio?plan=요금제`로 이동합니다. 제작 화면을 한 번 연 사람은 `/`에서 바로 `/studio`로 갑니다(`/?landing=1`·`/intro`는 항상 랜딩).
- 서버 함수는 `api/*.js`입니다. Vercel 무료 한도(함수 12개) 때문에 **새 API 파일을 만들지 말고** 기존 파일에 `mode`를 추가합니다(예: `generate-script.js`의 `mode:'topics'`).

## 2. 작업 순서
1. 시작 전 `git pull --ff-only`. 다른 에이전트가 같은 파일을 자주 고칩니다.
2. 필요한 곳만 고칩니다. 파일 전체 재정렬·포맷 변경·관련 없는 수정 금지.
3. 검사 (둘 다 통과해야 올림)
   - 문법: `node scripts/build-app.mjs && node --check public/assets/app/app.js`
   - 화면: `npm i --no-save playwright@1.48.2 && npx playwright install chromium && node tests/smoke-render.mjs`
     (모든 디자인을 5개 업종 × 5개 시점으로 그리고, 버튼 함수·단계 탭까지 확인. 오류 0이어야 함)
4. 관련 파일만 `git add`(`git add .` 금지 — 루트의 임시 `.ps1` 스크립트가 섞입니다). 커밋 후 `main`에 push하면 Vercel이 바로 운영에 배포합니다.
5. 배포 확인: `gh api repos/minokingdom/autoreels-platform/commits/<sha>/status` 가 `success`, GitHub Actions `smoke`가 통과. 운영 주소 https://autoreels-studio.vercel.app 에서 직접 확인한 뒤에 완료라고 보고합니다.
6. 확인 못 한 것은 못 했다고 말합니다. "될 것 같다"를 완료처럼 보고하지 않습니다.

## 3. 디자인 규칙 (사장님이 직접 지적한 것들 · 상세: `docs/design-system.md`)
- 줄바꿈은 어절·구 단위로 균형 있게(낱말 중간·한 단어만 남는 마지막 줄 금지), 사진 위 글상자는 꼭 필요할 때만. 필요한 글상자는 불투명 크림색 대신 반투명 유리 질감으로 표현합니다.
- **분류를 새로 만들지 않습니다.** `DESIGN_CATS`의 기존 12개 분류에만 넣습니다. 인스타 감성 스타일은 '감성' 또는 '브이로그'.
- **글자 테두리 금지:** `strokeText`, 글자 둘레 굵은 선, 겹겹이 쌓은 긴 그림자 금지. 사진 위 밝은 글자에만 옅은 그림자(blur ≤ 10, 투명도 ≤ 0.25).
- **위 사진·아래 단색 글자로 나누는 구성 금지**(자동차 외 업종). 사진은 화면을 꽉 채우거나, 종이 위 인화지·폴라로이드처럼 '물건'으로 놓습니다.
- 인스타 감성: 차분한 크림·베이지·필름 그레인·손글씨·에디토리얼. 네온·글리치·이모지·영어 장식 문구 금지.
- 캔버스는 1080×1920입니다. 글자 크기는 폭 비례로: 자막 약 `W * 0.06`, 작은 라벨 `W * 0.026`, 서명 `W * 0.03`. 12~32px 같은 고정 크기 금지. 아래 약 9%는 이름 칩 자리.
- 새 모션 스타일은 `07-motion-styles.js`의 `MOTION_ROWS` 행 + `MOTION_CAT` 분류 + `renderMotionFrame`의 `M === '<id>'` 분기, 세 곳을 모두 추가합니다. 기존 `in_*` 스타일의 도우미(`inGrain`, `inWarm`, `inPhotoFade`, `inLabel`, `inSign`, `mCaption`)를 재사용하고, 엔딩은 자동(`renderInstaOutro`).
- 숨길 스타일은 `AR_RETIRED_DESIGNS`, 자동차 외 업종에서만 숨길 것은 `AR_SPLIT_MOTION_IDS`.
- 여러 에이전트에게 스타일을 나눠 맡길 때는 기존 스타일 목록을 주고, 아이디어 예시는 적지 않습니다(예시를 주면 서로 같은 걸 만듭니다).

## 4. 기능 규칙
- 생성 API는 이미지·주제도 비용 한도에 포함하며 DB 조회 실패 시 공급자를 호출하지 않습니다. 전체 예산과 사용자 사용량은 같은 트랜잭션에서 예약합니다.
- 영상은 1080×1920에 직접 렌더링합니다. 논리 좌표는 540×960을 유지하고 출력 컨텍스트를 확대합니다. WebM을 MP4 확장자로 저장하지 않습니다. 완성 파일 검증 후 요청 ID 기준으로 한 번만 이용 횟수를 차감합니다.
- SNS 예약은 `SNS_SCHEDULING_ENABLED=true`와 최근 연속 3회 워커 성공(20~150초 간격)이 확인될 때만 접수합니다. 1분 외부 실행 설정은 `docs/service-setup.md`를 따릅니다. 기존 작업은 상태 선점 후 처리하고 응답이 불명확한 게시를 자동 재시도하지 않습니다.
- 긴급 운영 회귀: node tests/production-safety.cjs 및 node tests/export-safety.mjs.
- 전체 녹음이 있으면 컷 전환은 실제 음성 경계를 따릅니다. 선택한 영상 길이나 수동 컷 배율로 문장 사이를 벌리지 않으며, 긴 음성은 영상을 늘려 끝까지 재생합니다. 전체 녹음이 있으면 영상 종료는 음성 종료와 일치하며 선택한 영상 길이만큼 꼬리를 남기지 않습니다. 엔딩 없음은 본문 종료, 엔딩 있음은 명함 마무리 멘트 종료가 기준입니다. 회귀 검사: `node tests/narration-continuity.mjs` 및 `node tests/narration-browser.mjs`.
- **성우는 대본 전체를 하나의 오디오로 재생·내보냅니다.** Fish Audio는 대본 전체를 한 번에 합성합니다. Airy는 합성 시각을 반환하지 않아 컷별로 같은 목소리의 오디오를 받아 실제 음성 길이로 이어 붙입니다. Google WaveNet은 SSML 표시가 반환한 실제 시각으로 컷을 맞추고, Chirp 3 HD는 컷별 실음성 길이로 싱크를 맞춥니다. 컷 사이에 별도 대기 시간을 넣지 않습니다.
- 성우 목소리는 **첫 화면부터 바로** 들려줍니다(2026-11-17 사장님 요청, `arVoiceAllowed()`는 항상 true). 대신 소리를 켠 사람에게만 녹음하고(`prefetchTtsBuffers`, 내보내기는 `force`), 대본이 바뀌면 이전 대본 녹음은 버립니다(`masterWantKey`).
- 명함을 비우면 엔딩(명함·마무리 멘트) 없이 출력합니다(`arCardEmpty()`).
- 명함의 **견본 값**(예시 혜택·예시 지점명)은 대본·화면 장식에 절대 섞이지 않게 합니다(`arDealerForCopy`, `arDisplayDealer`).
- 대본 탭은 대본만, 사진·구도 변경은 사진 탭에서.
- **휴대폰 제작 화면은 '미리보기 위 고정 + 아래 바텀시트'** 입니다(`body.ar-sheet`, `arSetupSheetMode`). 미리보기는 첫 단계부터 항상 보이고, 단계 내용은 아래 시트(화면 약 절반)에서 고릅니다. 다른 화면으로 넘기지 말고 미리보기를 보면서 끝나게 합니다. 미리보기 옆 바로 누르는 버튼(소리·섞기·성우·처음부터)은 `#arQuickBar`.
- 한 디자인은 처음부터 끝까지 한 스타일로 갑니다. 컷마다 다른 디자인을 섞거나 구성을 바꾸지 않습니다(사장님: 인위적).
- 오늘의 주제 → AI 대본은 "계기 → 마음 → 상품 → 가게" 한 이야기로 이어져야 합니다(예: 수능 → 지친 몸과 마음 → 따뜻한 국물 → OO식당). 흔한 AI 말투 금지 규칙은 `api/generate-script.js`의 `HUMAN_TONE_RULES`.
- 스타일 섞기는 보이는 전체 스타일에서 무작위(연속 같은 분류 금지)로 고르고, 영상을 0초부터 다시 재생합니다.
- ‘오늘의 키워드’는 `refresh-trends`가 매일 04:13(KST)에 한국 Google 트렌드 RSS에서 수집해 `public/daily-keywords.json`에 저장합니다. 한국 날짜 기준으로 수집일과 급상승 시작일을 모두 확인하고, 출처나 당일 항목이 없으면 표시하지 않습니다. 매장용 릴스 아이디어와 참고 영상은 기존 `public/trends-today.json`을 사용합니다.

## 5. 비밀값
- `COMP_PRO_PHONES`: 운영자·테스트 계정에 무상 PRO를 부여하는 서버 전용 환경변수입니다. 번호는 쉼표 또는 공백으로 구분하며, 각 번호의 하이픈 등 숫자 외 문자는 제거해 회원 전화번호와 비교합니다. DB와 `AUTH_SECRET`이 준비된 서버 모드에서만 적용되며, 로그인한 해당 계정은 만료 없이 PRO 한도를 사용합니다. 결제·구독 행은 만들지 않고 조회 시 판정합니다. 목록은 클라이언트·코드·커밋·로그에 공개하지 않습니다. 변경 후 재배포하고 계정 화면을 새로 고쳐 확인합니다. 목록에서 제거하면 실제 구독 상태로 돌아갑니다.
- `COMP_PRO_USER_IDS`: 전화번호가 없는 카카오 테스트 계정은 서버에 로그인한 계정 ID를 이 환경변수에 등록해 무상 PRO로 지정할 수 있습니다. 쉼표 또는 공백으로 구분한 정확한 계정 ID만 적용되며, 전화번호 목록과 함께 사용할 수 있습니다. ID와 목록은 클라이언트·코드·커밋·로그에 공개하지 않습니다.
- `COMP_PRO_UNLIMITED_AI_USER_IDS`: 무상 PRO 계정 중 별도로 승인된 계정의 개인 AI 생성 횟수 한도를 없앱니다. 서비스 전체 예산, 성우 글자 수, 다른 계정의 이용 한도는 적용합니다.
- Airy 성우는 Vercel 환경변수 `AIRY_API_KEY`와 `TTS_PROVIDER=airy`를 설정하면 구글 성우를 지정하지 않은 서버 요청은 Airy로 처리합니다. 구글 성우가 연결된 스튜디오는 목록에서 Airy를 숨기고 기존 프로젝트에 저장된 성우 선택을 복원합니다. 기존 성우 글자 수 한도와 영상 내보내기 흐름을 공유합니다.
- Google WaveNet과 Chirp 3 HD는 Cloud Text-to-Speech API에 제한한 서버 키를 `GOOGLE_TTS_API_KEY`에 넣으면 성우 선택에 표시됩니다. 기존 성우 글자 수 한도에 SSML 요금 산정 글자 수를 포함합니다.
- kie.ai, Fish Audio, Airy, Google TTS, Apify, 결제·DB 키는 Vercel 환경변수에만 둡니다. 코드·커밋·로그에 넣지 않습니다.
- 사용자 개인정보(이메일·전화)를 외부 요청이나 커밋 메시지에 넣지 않습니다.

- 계정·프로젝트 변경 검증: `node tests/account-projects.cjs` (PGlite 0.3.14)와 `node tests/projects-browser.mjs`. 사진·대본은 계정별 DB 저장이며 프로젝트는 각 2MB·5개로 제한합니다. 생성 음성 파일·사용자 동영상·MP3는 프로젝트에 저장하지 않습니다. SMS 연결 전 신규 가입·비밀번호 복구를 인증 없이 우회시키지 않습니다.
