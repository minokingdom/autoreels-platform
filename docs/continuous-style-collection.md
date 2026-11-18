# 오토릴스 지속 스타일 수집

2026-11-18 사용자 지시: 5개로 멈추지 말고 계속 수집한다. 캡컷과 핀터레스트를 우선 조사하고 공개 유튜브 모션 데모도 보완적으로 사용한다. 기존 카테고리를 늘리지 않는다. 서비스 화면에 출처 표시를 붙이지 않는다. 신규는 등록 시각부터 7일(168시간)만 노출하고 이후 기존 분류만 유지한다.

## 실행

- 실제 저장소: C:/Users/ektjt/.gemini/antigravity/scratch/dealer-reels-platform
- 로컬 분석: D:/AutoReelsLocal/StyleLab/.venv/Scripts/python.exe
- rea-video 원본 스킬: D:/AutoReelsLocal/StyleLab/rea-video/skills/rea-video/SKILL.md
- 자료: D:/AutoReelsLocal/StyleLab/collections/
- 이 문서와 AGENTS.md, .agents/skills/autoreels-reference-style/SKILL.md를 읽고 시작한다.
- 사용자는 상시 예약을 거절하고 지금 대화에서만 계속 수집하도록 지정했다. 2시간 자동 예약은 생성되지 않았으며 새 예약을 만들지 않는다. 한 대화 안에서 5개로 종료하는 총량 제한 없이 중간 배포를 누적한다.
- API 기반 자동 분석·생성은 사용하지 않는다. Gemini request_style, 영상 생성, 유료 이미지 생성 호출은 금지한다. 로컬 rea-video 분해 + 에이전트 시각 검토 + 코드 렌더만 사용한다. 이 제한은 에이전트 자체 사용량이나 PC 전력까지 무료라고 보장하는 뜻이 아니다.

## 중복 및 품질

1. 실행 전 기존 실행 상태/잠금과 git status를 확인한다. 실제 진행 중인 수집 실행이 있으면 중복 실행하지 않는다. 사용자 미커밋 변경은 덮어쓰지 않고 독립된 새 후보 검토를 진행한다. 전체 파일 일괄 stage 금지.
2. 기존 collection.json과 reference-styles.json을 읽고 URL/구도/효과가 같은 후보를 중복 등록하지 않는다. 이름·색만 바꾼 스타일로 개수를 부풀리지 않는다.
3. 공식 공개 미리보기 또는 공개 이미지/영상만 사용한다. 로그인·접근 제한을 우회하지 않는다. 핀터레스트 이미지에서 확인하지 못한 움직임을 본 것처럼 서술하지 않는다. 페이지 제목만으로 스타일을 만들지 않는다.
4. VIDEO.md → 타임라인 → 스토리보드와 모든 우선 검토 구간 연락판 → review_answers → apply-review 순서를 따른다. 자동 live/AI/3D 추정은 근거가 부족하면 보수적으로 수정한다. 오디오를 듣지 않았다면 출처·음성 유형을 단정하지 않는다.
5. 렌더 가능한 구도와 움직임을 우리 사진·한국어 대본에 적용한다. 필요하면 기존 캔버스 렌더러를 확장하고 선언형 허용값·분석 프롬프트·검사를 맞춘다. 원본 사진/로고/문구/음악은 배포하지 않는다. 사진은 현재 컷의 같은 사진을 사용하며 타이포 전용이면 사진 없는 스타일임을 설명한다.
6. addedAt은 최초 등록 UTC ISO 시각으로 고정하고 다음 실행에서 갱신하지 않는다. 대표 category는 기존 목록 중에서 선택한다. 신규 여부는 arDesignIsNew로 계산한다.
7. 빌드, reference schema/browser 검사, 전체 smoke, 변경에 필요한 음성/엔딩 회귀, 실제 사진 미리보기를 검증한 뒤 관련 파일만 commit/push한다. 현재 main 커밋의 Vercel 성공, smoke 성공, 라이브 신규·기존 분류의 실제 클릭/렌더까지 확인한다.
8. 후보/검토/등록/배포 수를 구분해 저장한다. 작업 결과는 실제 등록 수와 누적 수, 운영 검증 결과만 보고한다. 카카오 메시지나 큐 항목을 위조하지 않는다. 이 예약은 다른 사람에게 알림을 보내도록 허가하지 않는다.

## 현재 이어갈 자료

- 배포 완료 3차: c87910a, 참조 스타일 누적 10개, ?v=20261118-stylepack3.
- 4차 캡컷 자료: collections/20261118-batch4/. 3개 등록으로 누적 13개.
- 7512956258341653813: 전체 사진 위 좌측 정렬 세리프 문구 + 손글씨 포인트. 로컬 분석 완료, 스토리보드/모든 연락판 확인. apply-review 및 세리프 에디토리얼 레터 등록 완료.
- 7629059250773347585: 여러 사진·이모지·오디오 플레이어가 겹친 구성. 과도한 장식과 다중 사진이라 서비스 스타일과 맞지 않아 등록 보류. 후보 수와 등록 수를 혼동하지 않는다.
- 다음 공개 후보: https://www.capcut.com/template-detail/newspaper-edit/7508389402293357877 및 https://www.capcut.com/template-detail/OPENING-TEXT-MOTION/7533956155312229685 . 실제 미리보기 확인 전 적용 금지.
- 이전 보류 후보: collections/20261118-batch3/ref_110b9ef76743a339 (폴라로이드 스톱모션, 연락판 다수, 전체 시각 검토 미완료).

공개 캡컷 상세 페이지의 video src를 로컬로 확인할 수 있었으며 D:/Avicx/eatspay/.local/autoreels-style-dev/discover_capcut.py 와 collect_capcut_batch4.py가 이번 배치의 예다. 과거 고정 후보를 그대로 무한 반복하지 말고 새로운 후보를 발견한다.

사용자는 핀터레스트를 반드시 참조하라고 추가 지시했다. 2026-11-18 Chrome DevTools 브라우저의 Pinterest 검색 페이지(https://kr.pinterest.com/search/pins/?q=editorial%20typography%20motion%20design)를 열었으나 로그인 모달로 상세 접근이 막혀 사용자 로그인 대기 중이다. 핀을 확인한 것처럼 기록하지 않는다.
