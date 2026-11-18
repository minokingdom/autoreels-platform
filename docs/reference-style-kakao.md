# 카카오톡 URL → 오토릴스 스타일

모비스 1:1 테스트방에서 운영자가 `!분석 https://...`를 보낸다. 공유 문구와 줄바꿈이 있어도 URL 하나만 추출한다. YouTube/Shorts, Instagram 게시물·릴스, TikTok, Vimeo, Pinterest의 공개 영상 또는 CapCut 템플릿 공개 미리보기 1개, 최대 180초/200MB를 받는다. 로그인·다운로드 차단은 우회하지 않는다.

## 실행 구성

- 수신: 기존 Iris → `/home/mino/eatspay-kakao/eatspay_kakao_bot.py` → `autoreels_style_commands.py`.
- 기존 `mobis_agent.AgentCommands`의 Iris 원문·메시지 ID·발신자·120초 신선도·현재 1:1방 검증을 재사용한다.
- 별도 SQLite 큐는 `/home/mino/eatspay-kakao/autoreels-style/queue.sqlite`. 동일 메시지/진행·완료된 동일 URL을 중복 실행하지 않는다.
- Windows 작업기: `D:\AutoReelsLocal\StyleLab\style_worker.py`, 독립 `.venv`와 rea-video. Windows 로그인 작업 `AutoReels-StyleLab`.
- 작업기는 기존 Tailscale SSH로 큐를 조회한다. PC에 외부 수신 포트를 열지 않는다. PC가 꺼져 있으면 분석만 대기하며 기존 고객 영상 생성은 영향 없다.
- 실행 Python은 UTF-8 모드. 출력·분석 자료·오류·등록 체크포인트는 D:의 `jobs/<메시지ID>`에 보관한다.

## 처리와 비용

1. yt-dlp로 URL을 검증하고 공개 영상 하나를 다운로드한다. CapCut 공유 링크는 상세 주소로 정규화하고 공개 미리보기의 파일 크기와 영상 길이를 확인한다. 사용자 쿠키와 브라우저 세션을 가져오지 않는다.
2. rea-video로 컷·움직임을 분석한다. 현재는 OCR/ASR/분리 모델을 사용하지 않으므로 정확한 글꼴 이름·자막 시간·음성 출처는 미측정이다.
3. 시간순 JPEG 12장과 제한된 측정 타임라인을 기존 `/api/generate-script`의 `mode:reference-style`에 보낸다. 서버의 Gemini 시각 분석을 사용하며 기존 ai 사용량·전체 예산 한도를 적용한다. 공급자 키는 PC에 복사하지 않는다. 분석용 텍스트/이미지 입력 비용이 발생하며 새 이미지·AI 동영상 생성은 하지 않는다.
4. `lib/reference-style.cjs`가 이름·분류·색상·구도·글꼴 후보·자막 위치·등장 효과·사진 움직임의 범위를 검증한다. 임의 JavaScript/HTML을 받지 않는다. 원본 등장인물/대사/로고/음악은 스타일에 넣지 않는다.
5. 고정된 GitHub 저장소의 `public/assets/reference-styles.json` 한 파일만 최신 SHA를 기준으로 갱신한다. 다른 작업 중인 소스를 커밋하지 않는다. 원본 URL과 영상은 공개 카탈로그에 포함하지 않는다.
6. Vercel 성공, 해당 커밋의 GitHub smoke 성공, 라이브 app.js의 스타일 ID 존재까지 확인한 뒤 같은 방에 완료 안내한다. 실패·지원 불가·배포 미확인은 완료로 보고하지 않는다.

## 지원 범위

전체 사진/여백/폴라로이드 구도, 팔레트, 글꼴 후보, 자막 상·중·하 배치, 페이드·상승·마스크·단어 강조, 사진 줌·좌우 이동, 컷·디졸브를 조합한다. 원본 효과를 똑같이 재현하는 범용 코드 생성기가 아니다. 핵심 효과가 3D·인물 애니메이션·오브젝트 추적이면 별도 렌더 구현 필요로 종료한다.

`07-reference-styles.js`는 빌드 시 검증된 데이터만 읽어 기존 디자인 목록에 추가한다. 음성 기반 리타이밍, 컷별 사진, 기존 명함 엔딩을 사용한다. 원본 영상 길이·컷 수로 고객 대본을 바꾸지 않는다.

## 점검·복구

`python autoreels_style_commands.py`에 SSH stdin JSON `{"op":"status"}`를 보내 최근 상태를 확인한다. 실제 메시지를 위조해 웹훅을 시험하지 않는다. 큐의 claim token은 로그·보고에 쓰지 않는다. 전송 결과가 불명확한 카카오 알림과 실행 중단 작업은 자동으로 재실행하지 않는다.

작업기 시작 흔적 `started`와 `published.json`을 임의 삭제하지 않는다. 카탈로그가 등록됐지만 배포 확인이 실패했다면 해당 커밋·Vercel·smoke를 먼저 확인한다. 자동 등록은 쉘 코드가 아니라 검증된 스타일 JSON 한 건으로 한정된다.

검증: `python scripts/alerts/test_style_commands.py`, `node --test tests/reference-styles.cjs`, `node tests/reference-styles-browser.mjs`, `node tests/smoke-render.mjs`, `node tests/narration-continuity.mjs`, `node tests/narration-browser.mjs`.
