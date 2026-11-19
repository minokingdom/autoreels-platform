# 오토릴스메이커 iPhone 앱

iOS 18.4 이상에서 운영 스튜디오의 참고 영상 화면을 WKWebView로 엽니다. URL 입력과 로딩바는 Android와 공유합니다. iOS 파일 선택기 연결에는 iOS 18.4에서 제공하는 WKUIDelegate API를 사용합니다.

Mac에 Xcode와 XcodeGen을 설치하고 이 디렉터리에서 `xcodegen generate`를 실행한 다음 `AutoReelsMaker.xcodeproj`를 엽니다. AutoReelsMaker 스킴에서 아이폰 시뮬레이터를 선택해 실행합니다. 시뮬레이터 실행에는 Apple Developer 팀 서명이 필요하지 않습니다.

스트림은 [YouTubeKit](https://github.com/alexeichhorn/YouTubeKit/tree/0.4.10)의 로컬 모드로 조회합니다. 원격 추출 서버는 사용하지 않습니다. Apple 도구로 기기 대상 컴파일과 시뮬레이터 UI 검사를 실행하는 절차는 `.github/workflows/ios-reference.yml`에 있습니다.
