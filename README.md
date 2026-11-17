# AutoReels — 업종별 프로모션 숏폼/릴스 자동 제작 & 멀티 SNS 발행 플랫폼

자동차 딜러(카마스터)용으로 시작해, 지금은 **자영업·전문직 10개 업종**의 9:16 프로모션 릴스를 만들고 검수한 뒤 여러 SNS에 한 번에 올리는 구독형 플랫폼입니다.
공통 본편 위에 사용자별 정보(이름·매장·연락처·혜택)를 합성하는 **원소스 멀티유즈** 구조를 유지합니다.

## 지원 업종

| 키 | 업종 | 호칭 | 엔딩 카드 |
| --- | --- | --- | --- |
| `auto` | 자동차 영업 | 카마스터 | 개인 명함 |
| `restaurant` | 음식점 | 사장님 | 매장 안내 |
| `cafe` | 카페·디저트 | 사장님 | 매장 안내 |
| `beauty` | 미용·네일·뷰티 | 원장님 | 매장 안내 |
| `realestate` | 부동산 중개 | 공인중개사 | 매장 안내 |
| `academy` | 학원·교육 | 원장님 | 매장 안내 |
| `clinic` | 병원·의원 | 원장님 | 매장 안내 |
| `fitness` | 헬스·필라테스 | 트레이너 | 매장 안내 |
| `shop` | 쇼핑몰·소매 | 스토어 | 매장 안내 |
| `interior` | 인테리어·시공 | 실장님 | 매장 안내 |

업종마다 입력 항목 이름, 기본 문구, 해시태그, AI 카피 역할, 장면 사진(`public/assets/scenes/<업종>/1~10.jpg`)이 따로 정의되어 있습니다. 업종 정의는 `public/assets/app/01-industries.js`, 서버 쪽 허용 목록은 `api/account.js`의 `INDUSTRY_KEYS`에 있습니다.

## 주요 기능

1. **업종별 릴스 자동 합성**
   - 공통 프로모션 본편 하단에 사용자 정보 바를 띄우고, 마지막에 엔딩 카드를 붙입니다. 자동차는 개인 명함, 나머지 업종은 매장 안내 카드(매장명·위치·혜택)입니다.
   - 컷별 레이아웃, 자막, 장식, 키네틱 타이포, 화면 전환 테마를 고를 수 있는 디자인 키트가 있습니다.
   - 브라우저(Canvas + `mp4-muxer`)에서 미리보기와 영상 추출을 하고, 서버용으로 `ffmpeg-compositor.js`, `hyperframes-renderer.js`가 있습니다.
2. **AI 대본 · 성우 내레이션**
   - `api/generate-script.js`: 한 줄 상황 입력으로 컷 자막, 내레이션 대본, 카톡 상담 대화, 컬러 테마, 컷 구성을 만듭니다.
   - `api/tts*.js`: Fish Audio 한국어 AI 성우. 대본 전체를 한 번에 녹음한 뒤 문장별로 잘라 씁니다.
3. **업종별 트렌드 릴스 참고**
   - `api/trends.js`: 업종 키워드로 인스타그램 인기 릴스를 가져오고(Apify 또는 Instagram Graph API), 없으면 YouTube Shorts로 대신합니다. 결과는 Postgres(`ar_trend_cache`)에 캐시합니다.
4. **검수 · 승인 후 멀티 SNS 발행**
   - 인스타그램, 페이스북, 유튜브, 틱톡, 스레드 계정을 연결하고 한 번에 발행합니다(`api/sns.js`, `lib/server/sns.js`).
   - 예약 발행을 지원하며, `api/cron-sns.js`가 매일 예약분을 처리합니다.
5. **회원 · 구독 결제**
   - 회원가입, 로그인, 구독, 해지, 결제 내역은 `api/account.js`에서 처리합니다. 카드 정기결제는 베이온을 씁니다(`lib/server/billing.js`, `api/veyon-webhook.js`).
   - 자동 갱신 결제는 `api/cron-billing.js`가 매일 실행합니다.

## 요금제 (`lib/server/plans.js`)

| 요금제 | 금액 | 주기 | 성우 글자 수 / AI 대본 (월) |
| --- | --- | --- | --- |
| 주간 스타터 | 50,000원 | 7일 | 30,000자 / 150회 |
| 월간 PRO | 150,000원 | 1개월 | 120,000자 / 600회 |
| 연간 VIP | 1,200,000원 | 12개월 | 120,000자 / 600회 |

무료 회원은 월 2,000자 / 10회, 비로그인 방문자는 하루 400자 / 3회입니다. 한도는 환경변수 `PLAN_LIMITS_JSON`으로 바꿀 수 있습니다.

## 프로젝트 구조

- `public/index.html` — 랜딩(`/`, 가벼운 별도 페이지)
- `public/studio.html` + `public/assets/app/*.js` — 올인원 스튜디오(`/studio`) (업종 선택, 디자인 키트, 9:16 실시간 미리보기, 영상 추출, 발행). 파일 구성과 규칙은 `docs/code-structure.md`, 작업 지침은 `AGENTS.md`
- `public/assets/scenes/` — 업종별 장면 사진
- `api/` — Vercel 서버리스 함수 (계정·결제, AI 대본, TTS, 트렌드, SNS 발행, 크론)
- `lib/server/` — DB, 세션, 요금제·사용량, 결제, SNS 공통 모듈
- `lib/fish-voices.js`, `lib/korean-numbers.js` — 성우 목록, 숫자의 한국어 읽기 변환
- `rust-engine/` → `public/autoreels_core.wasm` — 라이선스 검증 Wasm 코어
- `server.js` — 로컬 실행용 Node.js 서버
- `ffmpeg-compositor.js`, `hyperframes-renderer.js` — 서버 쪽 영상 합성·렌더링 모듈
- `instagram-api.js`, `multi-sns-publisher.js` — 초기 인스타그램 / 멀티 SNS 발행 모듈

## 배포

### 서버 환경변수

- `DATABASE_URL` 또는 `POSTGRES_URL`: 회원·구독 정보를 저장하는 Postgres 연결 주소.
- `AUTH_SECRET`: 로그인 세션 서명용 비밀값(32바이트 이상). DB와 함께 설정하면 서버 모드가 켜집니다.
- `COMP_PRO_PHONES` (선택): 운영자·테스트 계정의 무상 PRO 허용 번호 목록. 쉼표 또는 공백으로 번호를 구분하고, 번호 안의 하이픈 등은 숫자만 남겨 비교합니다. 서버 모드에서 로그인한 해당 회원에게 `pro`·`active`·만료 없음으로 적용하며, 결제·구독 기록을 생성하지 않습니다. 서버 응답에 `subscription.comp: true`와 “무상 PRO”를 표시하고 PRO 사용량 한도를 적용합니다. 목록은 서버에만 보관합니다. Vercel 환경변수 설정 후 재배포하고 로그인하거나 화면을 새로 고치면 적용됩니다. 번호를 제거하고 재배포하면 실제 구독 상태로 돌아갑니다.

Vercel에 배포합니다(`vercel.json`). `/`는 랜딩(`index.html`), `/api/`·`/assets/`가 아닌 나머지 경로는 제작 화면(`studio.html`)으로 보냅니다.
크론은 매일 01:00(UTC) `cron-billing`, 02:00(UTC) `cron-sns`가 실행됩니다.

## 운영 안전장치 (2026-11-17)

- 결제 연동은 별도 작업이며 이번 변경에는 포함하지 않습니다.
- AI 대본·주제·이미지 프롬프트·단일 이미지 요청은 각 1단위, 여러 이미지 요청은 프롬프트 1 + 이미지 수(최대 10) 단위입니다. 익명 일일 기본 한도는 30단위로 야간 10업종의 주제/프롬프트 20회도 계측합니다.
- 전체 AI 예산: AI_DAILY_UNIT_CAP 기본 2,000단위/일, AI_MONTHLY_UNIT_CAP 기본 20,000단위/월. 성우: FISH_MONTHLY_CHAR_CAP 기본 2,000,000자/월. 양의 정수만 허용하며 실제 금액 대신 생성량 상한입니다. 키를 노출하지 말고 공급자 비용 화면도 함께 확인합니다.
- DB 장애 시 생성은 503으로 차단됩니다. 실패한 응답은 사용자 사용량을 환원하며 실패 로그는 서버에서 확인합니다.
- ar_usage_requests 테이블과 SNS request_key/unique index는 기존 자동 스키마 초기화에서 추가됩니다. 기존 결제·사용자 데이터를 삭제하지 않습니다. 같은 저장/발행 요청 ID의 재시도는 한 번만 차감합니다.
- 새 예약 접수는 API와 화면에서 차단했습니다. 하루 1회 크론을 정시 예약 기반으로 광고하지 않습니다. 기존 scheduled 작업은 먼저 starting으로 선점하며 오래 멈춘 pending/starting/checking은 review로 남깁니다. review는 해당 SNS에서 실제 게시 여부를 확인한 뒤 운영자가 처리해야 합니다.
- 브라우저 출력은 1080×1920이며 H.264/AAC MP4 지원 시 MP4, 그 외에는 WebM으로 정확히 표시·저장합니다. 화면을 떠나면 녹화를 중단하며 성공 차감하지 않습니다.
- 되돌리기: 직전 Vercel 배포로 전환하거나 이 변경 커밋을 revert해 배포합니다. 추가 테이블/인덱스는 이전 코드와 호환되므로 장애 대응 중 삭제하지 않습니다.
