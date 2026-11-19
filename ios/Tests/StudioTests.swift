import XCTest

final class StudioTests: XCTestCase {
    private func analyze(_ url: String, name: String) throws {
        let app = XCUIApplication()
        app.launch()
        let input = app.webViews.textFields.firstMatch
        XCTAssertTrue(input.waitForExistence(timeout: 60))
        input.tap()
        input.typeText(url)
        XCTAssertEqual(input.value as? String, url)
        app.buttons["링크 분석"].tap()

        let complete = app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "휴대폰 분석 완료")).firstMatch
        let failure = app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@ OR label CONTAINS %@ OR label CONTAINS %@ OR label CONTAINS %@ OR label CONTAINS %@", "못했어요", "찾지 못했어요", "길어졌어요", "취소됐어요", "갤러리에서 참고 영상을 선택해 주세요")).firstMatch
        let finished = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in complete.exists || failure.exists }, object: nil)
        let outcome = XCTWaiter.wait(for: [finished], timeout: 240)
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = name
        capture.lifetime = .keepAlways
        add(capture)
        XCTAssertEqual(outcome, .completed, app.webViews.firstMatch.debugDescription)
        if !complete.exists, url.contains("youtube.com/shorts"), failure.exists,
           failure.label.contains("영상 파일을 받지 못했어요"),
           let probe = Bundle(for: StudioTests.self).url(forResource: "PublicPlayback", withExtension: "json"),
           let status = try JSONSerialization.jsonObject(with: Data(contentsOf: probe)) as? [String: String],
           status["status"] == "LOGIN_REQUIRED" {
            throw XCTSkip("유튜브가 이 Mac에서 공개 재생에 로그인을 요구했습니다.")
        }
        XCTAssertTrue(complete.exists, failure.exists ? failure.label : app.webViews.firstMatch.debugDescription)
        if url.contains("remix-spoken-ko"), complete.exists {
            XCTAssertFalse(complete.label.contains("미완료"), complete.label)
            let details = app.webViews.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "장면별 원본 문구·대사 보기")).firstMatch
            XCTAssertTrue(details.exists)
            details.tap()
            for prefix in ["화면 문구", "대사"] {
                let label = NSPredicate(format: "label BEGINSWITH %@ AND label CONTAINS %@", prefix, "김치")
                XCTAssertTrue(app.staticTexts.containing(label).firstMatch.exists, prefix)
            }
        }
    }

    func testPublicShort() throws {
        try analyze("https://www.youtube.com/shorts/Iit7ZaSLRTw", name: "유튜브 쇼츠 링크 분석")
    }

    func testReferenceVideoWithKoreanCaption() throws {
        try analyze("https://autoreelsmaker.kr/assets/remix/fixtures/remix-spoken-ko.mp4", name: "한국어 참고 영상 분석")
    }

    func testStudioOpensOnPhone() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["링크 분석"].waitForExistence(timeout: 60))
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "유튜브 쇼츠·CapCut")).firstMatch.exists)
    }
}
