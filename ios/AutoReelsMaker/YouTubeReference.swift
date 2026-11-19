import AVFoundation
import Foundation
import YouTubeKit

enum ImportProblem: LocalizedError {
    case unsupported, size, duration
    var errorDescription: String? {
        switch self {
        case .unsupported: return "이 쇼츠에서 재생 가능한 영상과 소리를 찾지 못했어요."
        case .size: return "250MB 이내의 영상을 골라 주세요."
        case .duration: return "90초 이내의 공개 쇼츠를 선택해 주세요."
        }
    }
}

final class ClipDownloader: NSObject, URLSessionDownloadDelegate, @unchecked Sendable {
    static let limit: Int64 = 250 * 1024 * 1024
    private var result: URL?
    private var failure: Error?
    private var continuation: CheckedContinuation<URL, Error>?
    private var session: URLSession?
    private var task: URLSessionDownloadTask?
    private let queue = OperationQueue()
    private let progress: @Sendable (String) -> Void
    private let limit: Int64
    init(limit: Int64, progress: @escaping @Sendable (String) -> Void) {
        self.limit = limit; self.progress = progress
        super.init()
        queue.maxConcurrentOperationCount = 1
    }
    private var reportAt = Date.distantPast
    func download(_ url: URL) async throws -> URL {
        guard url.scheme == "https", url.host?.hasSuffix(".googlevideo.com") == true else { throw ImportProblem.unsupported }
        try Task.checkCancellation()
        return try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { waiter in
                let cancelled = Task.isCancelled
                queue.addOperation {
                    if cancelled { waiter.resume(throwing: CancellationError()); return }
                    self.continuation = waiter
                    let config = URLSessionConfiguration.ephemeral
                    config.timeoutIntervalForRequest = 25
                    config.timeoutIntervalForResource = 150
                    let session = URLSession(configuration: config, delegate: self, delegateQueue: self.queue)
                    self.session = session
                    let task = session.downloadTask(with: url); self.task = task; task.resume()
                }
            }
        } onCancel: { self.queue.addOperation { self.task?.cancel() } }
    }
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        if max(totalBytesWritten,totalBytesExpectedToWrite) > limit { failure = ImportProblem.size; downloadTask.cancel(); return }
        if Date().timeIntervalSince(reportAt) > 2.5 {
            reportAt = Date()
            progress("아이폰으로 영상을 받고 있어요 · \(totalBytesWritten / 1048576)MB")
        }
    }
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        do {
            guard let response = downloadTask.response as? HTTPURLResponse, (200...299).contains(response.statusCode) else { throw ImportProblem.unsupported }
            let bytes = (try FileManager.default.attributesOfItem(atPath: location.path)[.size] as? NSNumber)?.int64Value ?? 0
            guard bytes > 0, bytes <= limit else { throw ImportProblem.size }
            let target = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString).appendingPathExtension("mp4")
            try FileManager.default.moveItem(at: location, to: target); result = target
        } catch { failure = error }
    }
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        defer { continuation = nil; self.task = nil; self.session = nil; session.finishTasksAndInvalidate() }
        if let error = failure ?? error { if let result { try? FileManager.default.removeItem(at: result) }; continuation?.resume(throwing: error) }
        else if let result { continuation?.resume(returning: result) }
        else { continuation?.resume(throwing: ImportProblem.unsupported) }
    }
}

struct YouTubeReference {
    static func load(id: String, progress: @escaping @Sendable (String) -> Void) async throws -> URL {
        guard id.range(of: "^[a-zA-Z0-9_-]{11}$", options: .regularExpression) != nil else { throw ImportProblem.unsupported }
        let streams = try await YouTube(videoID: id, methods: [.local]).streams
        try Task.checkCancellation()
        let pictures = streams.filter { $0.includesVideoTrack && $0.fileExtension == .mp4 && $0.isNativelyPlayable }
            .sorted { abs(($0.videoResolution ?? 0)-720) < abs(($1.videoResolution ?? 0)-720) }
        guard let picture = pictures.first(where: { $0.includesAudioTrack }) ?? pictures.first else { throw ImportProblem.unsupported }
        let file = try await ClipDownloader(limit: ClipDownloader.limit, progress: progress).download(picture.url)
        do {
            try Task.checkCancellation()
            let asset = AVURLAsset(url: file)
            let duration = try await asset.load(.duration)
            guard duration.seconds > 0 && duration.seconds <= 90.1 else { throw ImportProblem.duration }
            if !(try await asset.loadTracks(withMediaType: .audio)).isEmpty { return file }
            guard let sound = streams.first(where: { $0.includesAudioTrack && !$0.includesVideoTrack && $0.isNativelyPlayable }) else { throw ImportProblem.unsupported }
            let fileBytes = try FileManager.default.attributesOfItem(atPath:file.path)[.size] as? NSNumber
            let audio = try await ClipDownloader(limit:ClipDownloader.limit - (fileBytes?.int64Value ?? 0),progress:progress).download(sound.url)
            defer { try? FileManager.default.removeItem(at: audio) }
            progress("영상과 소리를 맞추고 있어요.")
            let composition = AVMutableComposition()
            for (source,kind) in [(asset,AVMediaType.video),(AVURLAsset(url:audio),AVMediaType.audio)] {
                guard let track = try await source.loadTracks(withMediaType:kind).first,
                      let dest = composition.addMutableTrack(withMediaType:kind,preferredTrackID:kCMPersistentTrackID_Invalid) else { throw ImportProblem.unsupported }
                let range = try await track.load(.timeRange)
                try dest.insertTimeRange(CMTimeRange(start:range.start,duration:CMTimeMinimum(range.duration,duration)),of:track,at:.zero)
                if kind == .video { dest.preferredTransform = try await track.load(.preferredTransform) }
            }
            guard let export = AVAssetExportSession(asset:composition,presetName:AVAssetExportPresetPassthrough) else { throw ImportProblem.unsupported }
            let output = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString).appendingPathExtension("mp4")
            do { try await export.export(to:output,as:.mp4); try Task.checkCancellation() }
            catch { try? FileManager.default.removeItem(at:output); throw error }
            try? FileManager.default.removeItem(at:file); return output
        } catch { try? FileManager.default.removeItem(at:file); throw error }
    }
}
