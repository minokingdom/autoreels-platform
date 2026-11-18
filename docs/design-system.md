# AutoReels 디자인 시스템 & 스타일 추가 가이드

새 디자인·모션 스타일이나 UI를 추가할 때 반드시 따르는 기준입니다. (`AGENTS.md` 3장 및 `hyperframes-dealer-reels` 스킬과 동기화됨)

---

## 1. 제품 UI 디자인 토큰

랜딩, 스튜디오, 운영 관리 화면은 `public/assets/design-system.css`의 공통 테마를 사용합니다. Astryx Core/Neutral에서 가져온 색상·글자 크기·여백·모서리 값을 `public/assets/app/astryx-tokens.css`로 제공하고, AutoReels의 배경과 한국어 UI 글꼴은 공통 테마에서 정합니다.

- 기본 배경은 `--background`, 카드와 시트는 `--card`, 입력·보조 조작은 `--raised`를 사용합니다. 일반 텍스트와 보조 텍스트는 각각 `--foreground`, `--secondary-foreground`입니다.
- 파란색 `--primary`는 주요 조작, `--focus-ring`은 키보드 초점에 사용합니다. 상태 문구에는 `--semantic-positive`, `--semantic-warning`, `--semantic-negative`를 사용합니다.
- 스튜디오 공통 컴포넌트는 `.studio-card`, `.studio-input`, `.btn-primary`, `.btn-secondary`, `.ar-modal`을 재사용합니다. 단계 탭은 `aria-selected`를 기준으로 표시합니다.
- Astryx 값을 갱신할 때는 `npm run design:tokens`를 실행하고 `npm run design:tokens -- --check`로 확인합니다. 구성요소 사양은 Node.js 22.13 이상에서 `npm run astryx -- component Button`처럼 조회할 수 있습니다. 페이지는 생성된 CSS를 HTML에서 읽습니다.
- **경로 규칙**: `/` 첫 방문은 랜딩페이지(`#arLandingView`), 재방문·`/studio`는 제작 화면(`#arStudioShell`).

---

## 2. 9:16 캔버스(1080×1920) 타이포·레이아웃 규칙
- **폭 비례 크기 필수** (`12~32px` 고정 픽셀 금지):
  - 메인 자막/카피: 약 `W * 0.06`
  - 작은 라벨/태그: 약 `W * 0.026`
  - 하단 서명/브랜드: 약 `W * 0.03`
- **하단 안전 영역**: 화면 아래 약 **9%**는 이름/매장 칩 자리로 비워 둡니다.
- **가독성 규칙**:
  - `strokeText`, 글자 둘레 굵은 테두리, 겹겹이 쌓은 긴 그림자 **금지**
  - 사진 위 밝은 글자에만 옅은 그림자(`shadowBlur <= 10`, 투명도 `<= 0.25`) 허용

---

## 3. 업종·감성 스타일 규칙
- **분류 (`DESIGN_CATS`)**: 새 분류를 만들지 않고 기존 **12개 분류**에만 넣습니다. (인스타 감성 스타일은 `'감성'` 또는 `'브이로그'`)
- **구성 금지 사항**: 자동차(`auto`) 외 업종에서 **위 사진·아래 단색 글자 분할 구성 금지** (`AR_SPLIT_MOTION_IDS`로 자동차 외 업종 숨김 처리). 사진은 화면을 꽉 채우거나 종이 위 인화지·폴라로이드처럼 '물건'처럼 배치합니다.
- **인스타 감성 톤**: 차분한 크림·베이지(`#f6f1e7`, `#efe7da`), 필름 그레인, 손글씨·에디토리얼 톤. **네온·글리치·이모지·영어 장식 문구 금지.**
- **숨김 목록**: 퇴역 스타일은 `AR_RETIRED_DESIGNS`에 등록.

---

## 4. 새 모션 스타일 추가 체크리스트 (`public/assets/app/07-motion-styles.js`)
새 스타일 ID(`<id>`)를 추가할 때는 반드시 아래 세 곳을 함께 수정합니다:
1. `MOTION_ROWS`에 스타일 행 추가
2. `MOTION_CAT`에 기존 12개 분류 중 하나 매핑
3. `renderMotionFrame`에 `M === '<id>'` 분기 추가
   - 기존 도우미 재사용: `inGrain`, `inWarm`, `inPhotoFade`, `inLabel`, `inSign`, `mCaption`
   - 엔딩 아웃트로는 `renderInstaOutro` 자동 처리

---

## 5. 컷 편집기 (`public/assets/app/08-cut-editor.js`)
- 컷별 편집 상태(`cutDecos`, `cutOverlays`, `cutFilters`, `cutFrames`, `cutStrokes`)는 공용 `localStorage`에 남기지 않습니다. 내 프로젝트에서 계정별 DB에 명시적으로 저장하며, 저장한 프로젝트만 새로고침 후 복원합니다.
- 지원 폰트 14종(`CUT_TEXT_FONTS`), 드로우 3브러시(`펜`·`형광`·`네온`), 사진 스티커(`round`·`circle`·`polaroid`·`rect`)를 유지합니다.
