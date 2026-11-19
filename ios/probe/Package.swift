// swift-tools-version: 6.0
import PackageDescription
let package = Package(name: "Probe", platforms: [.macOS(.v15)], dependencies: [.package(url: "https://github.com/alexeichhorn/YouTubeKit.git", exact: "0.4.10")], targets: [.executableTarget(name: "Probe", dependencies: ["YouTubeKit"],swiftSettings:[.swiftLanguageMode(.v5)])])
