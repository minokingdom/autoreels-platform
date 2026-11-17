# 로컬 주제·테마 맞춤 이미지

사진 탭의 기존 `주제·테마 맞춤 이미지` 버튼을 그대로 사용합니다. 브라우저에서 `?localImages=1`로 한 번 열면 해당 브라우저의 생성 공급자를 로컬로 기억합니다. `?localImages=0`은 기존 Gemini 경로를 선택합니다. 다른 브라우저의 기본 공급자는 변경하지 않습니다.

운영 연결 주소: https://autoreels-studio.vercel.app/studio?localImages=1

## 이 PC에서 시작

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\AutoReelsLocal\RustImageWorker\start-studio-local.ps1
```

PC를 다시 켠 뒤에는 시작 파일을 실행해야 합니다. 브라우저가 로컬 네트워크 접근 권한을 요청하면 허용해야 합니다. 서비스는 모두 127.0.0.1에만 바인딩합니다.

- 8193: Rust `studio-bridge.exe`, 스튜디오 Origin 허용 목록 및 JSON 요청 검증, 동시 생성 거절.
- 8194: llama.cpp CPU 서버, 기존 Qwen3-4B-Instruct GGUF를 재사용하여 한국어 주제·대본을 영어 장면 설명으로 변환.
- 8192: stable-diffusion.cpp CUDA 서버, Z-Image Turbo Q4_K, 576×1024, 8단계.
- 모델·네이티브 엔진: `E:\AutoReelsLocal\NativeImage`, `E:\AutoReelsLocal\PromptEngine`.
- Rust 소스·실행 파일·시작 스크립트: `D:\AutoReelsLocal\RustImageWorker`.
- 원본 PNG 및 장면 설명: `D:\AutoReelsLocal\RustImageWorker\generated`.

로컬 모드의 버튼은 Gemini 프롬프트 API와 이미지 API를 모두 호출하지 않습니다. Gemini 키도 로컬 서버에 전달하지 않습니다. 다른 기능(대본 생성·성우 등)의 공급자는 변경하지 않습니다.

최대 4개의 서로 다른 이미지를 한 장씩 생성하고, 기존 방식과 같이 더 많은 컷에는 순환 배치합니다. 완성된 이미지부터 미리보기와 컷 편집기에 반영합니다. 기존 계정 프로젝트 저장 기능에서 저장할 수 있도록 JPEG data URL로 변환합니다. 버튼만 누른 것으로 계정 프로젝트가 자동 저장되는 것은 아닙니다.

주제·대본·업종·스타일·컷 수 변경 또는 직접 사진 업로드 후에는 이전 생성 결과를 적용하지 않습니다. 이미 GPU에서 시작한 한 장은 완료될 수 있지만 이후 컷 생성은 중단됩니다. 연결 실패 또는 부분 실패 시 유료 Gemini로 자동 전환하지 않습니다.

## 검증

```powershell
node tests/local-images-browser.mjs
node tests/local-images-browser.mjs --live
node tests/smoke-render.mjs
```

첫 검사는 외부 모델 없이 순차 적용, 연결 실패, 유료 호출 차단, 이전 결과 차단을 검증합니다. `--live`는 로컬 서버가 실행된 상태에서 실제 4장을 생성합니다. 생성 시간에는 로컬 CPU 프롬프트 작성 시간이 별도로 포함되므로 GPU 단일 이미지 벤치마크(약 9초)와 버튼 전체 대기 시간을 혼동하지 않습니다.
