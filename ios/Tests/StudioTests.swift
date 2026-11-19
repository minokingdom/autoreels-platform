import XCTest

final class StudioTests: XCTestCase {
    func testPublicShort() throws {
        let app = XCUIApplication(); app.launch()
        let input = app.textFields.firstMatch
        XCTAssertTrue(input.waitForExistence(timeout:60))
        input.tap(); input.typeText("https://www.youtube.com/shorts/Iit7ZaSLRTw")
        app.buttons["링크 분석"].tap()
        let state = app.staticTexts.containing(NSPredicate(format:"label CONTAINS %@ OR label CONTAINS %@ OR label CONTAINS %@", "휴대폰 분석 완료","이 유튜브 영상을 읽지 못했어요","재생 가능한 영상과 소리")).firstMatch
        XCTAssertTrue(state.waitForExistence(timeout:600), "최종 화면: "+app.webViews.firstMatch.debugDescription)
        let capture=XCTAttachment(screenshot:app.screenshot());capture.name="참고 쇼츠 결과";capture.lifetime = .keepAlways;add(capture)
        XCTAssertTrue(state.label.contains("휴대폰 분석 완료"),state.label)
    }

    func testStudioOpensOnPhone() {
        let app = XCUIApplication(); app.launch()
        XCTAssertTrue(app.buttons["링크 분석"].waitForExistence(timeout:60))
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format:"label CONTAINS %@", "유튜브 쇼츠·CapCut")).firstMatch.exists)
    }
}
