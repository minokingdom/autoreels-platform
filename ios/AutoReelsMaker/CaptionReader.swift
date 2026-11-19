import Foundation
import ImageIO
import Vision
import WebKit

@MainActor
final class CaptionReader: NSObject, WKScriptMessageHandlerWithReply {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        let frame = message.frameInfo
        guard frame.isMainFrame, frame.securityOrigin.protocol == "https",
              frame.securityOrigin.host == "autoreelsmaker.kr",
              frame.securityOrigin.port == 443 || frame.securityOrigin.port == 0,
              frame.request.url?.path == "/assets/remix/index.html",
              let base64 = message.body as? String, base64.utf8.count <= 2_000_000,
              let image = Data(base64Encoded: base64) else {
            replyHandler(nil, "참고 영상 프레임을 읽지 못했어요.")
            return
        }

        Task {
            do {
                let text = try await Task.detached(priority: .userInitiated) {
                    guard let source = CGImageSourceCreateWithData(image as CFData, nil),
                          let props = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
                          let width = props[kCGImagePropertyPixelWidth] as? Int,
                          let height = props[kCGImagePropertyPixelHeight] as? Int,
                          (1...960).contains(width), (1...960).contains(height) else { throw CocoaError(.fileReadCorruptFile) }
                    let request = VNRecognizeTextRequest()
                    request.recognitionLevel = .accurate
                    request.recognitionLanguages = ["ko-KR", "en-US"]
                    request.usesLanguageCorrection = true
                    #if targetEnvironment(simulator)
                    request.usesCPUOnly = true
                    #endif
                    try VNImageRequestHandler(data: image).perform([request])
                    return (request.results ?? []).compactMap { observation -> String? in
                        guard let candidate = observation.topCandidates(1).first, candidate.confidence >= 0.48 else { return nil }
                        return candidate.string
                    }.joined(separator: " ")
                }.value
                replyHandler(text, nil)
            } catch {
                replyHandler(nil, "화면 문구를 읽지 못했어요.")
            }
        }
    }
}
