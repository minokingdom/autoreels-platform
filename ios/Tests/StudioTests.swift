import XCTest

final class StudioTests: XCTestCase {
    private func analyze(_ url: String, name: String) throws {
        let app = XCUIApplication()
        app.launch()
        let input = app.webViews.textFields.firstMatch
        XCTAssertTrue(input.waitForExistence(timeout: 60))
        input.tap()
        input.typeText(url)
        app.buttons["링크 분석"].tap()

        let complete = app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "휴대폰 분석 완료")).firstMatch
        let failure = app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@ OR label CONTAINS %@ OR label CONTAINS %@ OR label CONTAINS %@", "못했어요", "찾지 못했어요", "길어졌어요", "취소됐어요")).firstMatch
        let finished = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in complete.exists || failure.exists }, object: nil)
        let outcome = XCTWaiter.wait(for: [finished], timeout: 600)
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = name
        capture.lifetime = .keepAlways
        add(capture)
        XCTAssertEqual(outcome, .completed, app.webViews.firstMatch.debugDescription)
        XCTAssertTrue(complete.exists, failure.exists ? failure.label : app.webViews.firstMatch.debugDescription)
    }

    func testPublicShort() throws {
        try analyze("https://www.youtube.com/shorts/Iit7ZaSLRTw", name: "유튜브 쇼츠 링크 분석")
    }

    func testReferenceVideoWithKoreanCaption() throws {
        try analyze("https://raw.githubusercontent.com/minokingdom/autoreels-platform/main/tests/fixtures/remix-spoken-ko.mp4", name: "한국어 참고 영상 분석")
    }

    func testStudioOpensOnPhone() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["링크 분석"].waitForExistence(timeout: 60))
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "유튜브 쇼츠·CapCut")).firstMatch.exists)
    }
}
