import Foundation
import YouTubeKit
do {
    let file = try await YouTubeReference.load(id: "Iit7ZaSLRTw", title: { _ in print("title obtained") }, progress: { print($0) })
    print("MP4", (try FileManager.default.attributesOfItem(atPath: file.path)[.size]) ?? 0)
} catch {
    print("Failed", String(reflecting: type(of: error)), (error as NSError).domain, (error as NSError).code)
    if let yt = error as? YouTubeKitError { print("YouTubeKit", yt.rawValue) }
    else if error.localizedDescription.contains("solver") { print("Player solver error") }
}
