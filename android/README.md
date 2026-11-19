# 오토릴스메이커 Android 앱

Android 8 이상에서 운영 스튜디오의 참고 영상 화면을 엽니다. Android 시스템 WebView를 최신 상태로 사용합니다. 유튜브 링크는 앱 안에서 NewPipeExtractor로 열고 MP4 영상과 음성을 받아 임시 파일로 편집기에 전달합니다. 분리된 트랙은 MediaMuxer로 결합합니다. 지원 한도는 90초와 250MB입니다. 로그인이 필요한 영상과 다운로드를 허용하지 않는 영상은 결과 대신 오류를 표시합니다.

JDK 17 이상과 Android SDK 36을 설치하고 이 디렉터리에서 `gradlew assembleDebug`를 실행합니다. 설치 파일은 `app/build/outputs/apk/debug/app-debug.apk`에 생성됩니다. 이 파일은 테스트용 서명입니다. 앱 소스에는 운영 서명 키가 포함되지 않습니다.

스트림 추출기는 [NewPipeExtractor](https://github.com/TeamNewPipe/NewPipeExtractor/tree/v0.27.1) v0.27.1을 사용합니다. 해당 라이브러리의 GPL 라이선스는 앱 자산의 `licenses/NewPipeExtractor.txt`에 포함합니다.
