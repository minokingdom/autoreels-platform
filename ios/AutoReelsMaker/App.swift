import UIKit
import WebKit
import PhotosUI
import UniformTypeIdentifiers

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey:Any]? = nil) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = StudioViewController()
        window.makeKeyAndVisible(); self.window = window
        return true
    }
}

@MainActor
final class StudioViewController: UIViewController, WKUIDelegate, WKNavigationDelegate, WKDownloadDelegate, PHPickerViewControllerDelegate {
    private var web: WKWebView!
    private var importing: Task<Void,Never>?
    private var chooser: (([URL]?) -> Void)?
    private var requestID = UUID()
    private var files: [URL] = []
    private var downloads: [ObjectIdentifier:URL] = [:]
    private let start = URL(string:"https://autoreelsmaker.kr/assets/remix/index.html")!
    private func allowed(_ url: URL?) -> Bool {
        url?.scheme == "https" && url?.host == start.host && url?.user == nil && url?.password == nil && (url?.port == nil || url?.port == 443)
    }
    override func viewDidLoad() {
        super.viewDidLoad()
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.userContentController.addScriptMessageHandler(CaptionReader(), contentWorld: .page, name: "readCaption")
        config.applicationNameForUserAgent = "AutoReelsMakeriOS/1"
        web = WKWebView(frame:.zero,configuration:config)
        web.translatesAutoresizingMaskIntoConstraints = false
        web.navigationDelegate = self; web.uiDelegate = self
        web.allowsBackForwardNavigationGestures = true
        view.backgroundColor = UIColor(white:0.06,alpha:1)
        view.addSubview(web)
        let safe = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([web.topAnchor.constraint(equalTo:safe.topAnchor),web.bottomAnchor.constraint(equalTo:safe.bottomAnchor),web.leadingAnchor.constraint(equalTo:safe.leadingAnchor),web.trailingAnchor.constraint(equalTo:safe.trailingAnchor)])
        web.load(URLRequest(url:start))
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy)->Void) {
        if action.shouldPerformDownload { decisionHandler(.download); return }
        if action.targetFrame?.isMainFrame == false || allowed(action.request.url) { decisionHandler(.allow); return }
        if action.navigationType == .linkActivated, let url=action.request.url,url.scheme=="https"{UIApplication.shared.open(url)}
        decisionHandler(.cancel)
    }
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        importing?.cancel();requestID=UUID();finish(nil)
    }
    private func finish(_ urls:[URL]?){let cb=chooser;chooser=nil;cb?(urls)}
    private func report(_ kind:String,_ message:String,key:String) async {
        guard allowed(web.url), web.url?.path == start.path else {return}
        _ = try? await web.callAsyncJavaScript("dispatchEvent(new CustomEvent('ar-native-reference',{detail:{id:key,kind,message}}))",arguments:["key":key,"kind":kind,"message":message],in:nil,contentWorld:.page)
    }
    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?)->Void) {
        guard frame.isMainFrame, allowed(frame.request.url), allowed(web.url) else { completionHandler(nil);return }
        importing?.cancel(); finish(nil); chooser=completionHandler
        let token=UUID();requestID=token
        importing=Task {
            let data = try? await web.evaluateJavaScript("(()=>{const e=document.getElementById('androidReference');return e?[e.dataset.videoId,e.dataset.requestId]:null})()")
            guard requestID==token else{return}
            if let args=data as? [String],args.count==2,web.url?.path==start.path {
                do{
                    let file=try await YouTubeReference.load(id:args[0],title:{ [weak self] name in await self?.report("title",name,key:args[1]) }) { [weak self] msg in
                        Task { @MainActor in await self?.report("progress",msg,key:args[1]) }
                    }
                    guard requestID==token else {try? FileManager.default.removeItem(at:file);return}
                    files.append(file);finish([file])
                }catch{
                    guard requestID==token else{return}
                    await report("error",(error as? ImportProblem)?.errorDescription ?? "유튜브에서 영상 파일을 받지 못했어요. 갤러리에 저장한 참고 영상을 선택해 주세요.",key:args[1])
                    if requestID==token {finish(nil)}
                }
            }else{
                var c=PHPickerConfiguration()
                c.filter = parameters.allowsMultipleSelection ? .any(of:[.images,.videos]) : .videos
                c.selectionLimit = parameters.allowsMultipleSelection ? 10 : 1
                c.selection = .ordered
                let picker=PHPickerViewController(configuration:c);picker.delegate=self;present(picker,animated:true)
            }
        }
    }
    func picker(_ picker: PHPickerViewController,didFinishPicking results:[PHPickerResult]) {
        picker.dismiss(animated:true)
        let token=requestID
        Task {
            var selected:[URL]=[]
            for result in results {
                let provider=result.itemProvider
                let type=provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) ? UTType.movie : .image
                let copied: URL? = await withCheckedContinuation { c in
                    provider.loadFileRepresentation(forTypeIdentifier:type.identifier){url,_ in
                        guard let url else { c.resume(returning:nil);return }
                        let tmp=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString).appendingPathExtension(url.pathExtension)
                        do{try FileManager.default.copyItem(at:url,to:tmp);c.resume(returning:tmp)}catch{c.resume(returning:nil)}
                    }
                }
                if let copied { selected.append(copied) }
            }
            guard requestID==token else {for file in selected {try? FileManager.default.removeItem(at:file)};return}
            files.append(contentsOf:selected);finish(selected.isEmpty ? nil:selected)
        }
    }
    func webView(_ webView:WKWebView,navigationAction:WKNavigationAction,didBecome download:WKDownload){download.delegate=self}
    func download(_ download:WKDownload,decideDestinationUsing response:URLResponse,suggestedFilename:String,completionHandler:@escaping(URL?)->Void){
        let url=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString,isDirectory:true)
        do{try FileManager.default.createDirectory(at:url,withIntermediateDirectories:true)
            let target=url.appendingPathComponent((suggestedFilename as NSString).lastPathComponent)
            downloads[ObjectIdentifier(download)]=target;completionHandler(target)
        }catch{completionHandler(nil)}
    }
    func downloadDidFinish(_ download:WKDownload){
        guard let url=downloads.removeValue(forKey:ObjectIdentifier(download)) else{return}
        let sheet=UIActivityViewController(activityItems:[url],applicationActivities:nil)
        sheet.popoverPresentationController?.sourceView=view
        sheet.completionWithItemsHandler={_,_,_,_ in try? FileManager.default.removeItem(at:url.deletingLastPathComponent())}
        present(sheet,animated:true)
    }
    func download(_ download:WKDownload,didFailWithError error:Error,resumeData:Data?){
        if let url=downloads.removeValue(forKey:ObjectIdentifier(download)){try? FileManager.default.removeItem(at:url.deletingLastPathComponent())}
    }
    deinit { importing?.cancel();for file in files {try? FileManager.default.removeItem(at:file)} }
}
