---
name: autoreels-reference-style
description: 카카오톡 !분석 영상 URL의 접수·분석·오토릴스 스타일 등록 흐름을 운영하거나, URL에서 새 영상 스타일를 추가하고 검증할 때 사용한다.
---

# AutoReels URL 스타일 분석

실제 저장소는 `C:/Users/ektjt/.gemini/antigravity/scratch/dealer-reels-platform`이다. 저장소의 `AGENTS.md`, `docs/reference-style-kakao.md`, `docs/design-system.md`를 먼저 확인한다.

사용자 입력은 기존 모비스 1:1 카카오방의 `!분석 URL`이다. CLI 독립 실행이나 일반 사용자용 공개 입력창으로 바꾸지 않는다. `scripts/alerts/autoreels_style_commands.py`는 기존 Iris 원문/발신자 검증을 사용한다. 기존 이츠페이 알림/명령 큐와 스타일 큐는 별개다.

rea-video는 `D:/AutoReelsLocal/StyleLab/.venv`에 설치되어 있다. 분석 결과 `VIDEO.md`, 타임라인, 프레임을 실제로 확인하고 추측과 측정을 구분한다. 자동 처리의 지원 범위는 `lib/reference-style.cjs`의 선언형 설정이다. 지원하지 않는 동작을 비슷한 스타일로 몰래 대체하지 않는다.

사용자가 별도 렌더 구현을 요청하면 원본 영상의 구도와 움직임을 근거로 기존 모션 엔진에 구현한다. 원본 소재·대사는 복사하지 않는다. 컷 수만큼 사진을 사용하고 실제 음성에 맞춰 길이를 계산하며 명함 엔딩 유무를 유지한다.

스타일 등록 완료는 카탈로그 commit만으로 판단하지 않는다. 빌드, 브라우저 렌더, 음성 회귀, Vercel 상태, 해당 commit의 smoke와 라이브 스타일 ID를 확인한다. 분석 모델/API 실패·다운로드 차단·미배포 상태를 숨기지 않는다.
