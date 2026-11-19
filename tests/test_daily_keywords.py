import unittest
from datetime import datetime
from scripts.refresh_daily_keywords import FEED, daily_keywords, public_issues


class DailyKeywordsTest(unittest.TestCase):
    def test_public_agenda_and_independent_news(self):
        collected = datetime.fromisoformat("2026-11-19T18:00:00+09:00")
        date = "Thu, 19 Nov 2026 08:00:00 GMT"
        def feed(host, titles):
            rows = "".join(f"<item><title>{title}</title><link>https://{host}/{n}</link><pubDate>{date}</pubDate></item>" for n, title in enumerate(titles))
            return f"<rss><channel>{rows}</channel></rss>"
        headline = "광역 환승 정기권 도입 확정"
        yna = feed("www.yna.co.kr", ["수능 AI 부정행위 방지 대책", headline, "변상일"])
        sbs = feed("news.sbs.co.kr", [headline + " 발표"])
        issues = public_issues({"연합뉴스": yna, "SBS": sbs}, collected)
        self.assertEqual(issues[0]["term"], "수능")
        self.assertEqual(issues[0]["publisher"], "교육부")
        self.assertEqual([i["term"] for i in issues[1:]], ["시험과 AI 부정행위 논란", headline])
        tomorrow = datetime.fromisoformat("2026-11-20T00:01:00+09:00")
        self.assertEqual(public_issues({"연합뉴스": yna, "SBS": sbs}, tomorrow), [])

    def test_kst_midnight_future_and_missing_dates(self):
        collected = datetime.fromisoformat("2026-11-19T00:02:00+09:00")
        rows = [
            ("어제", "Wed, 18 Nov 2026 14:59:00 GMT"),
            ("오늘", "Wed, 18 Nov 2026 15:00:00 GMT"),
            ("오늘", "Wed, 18 Nov 2026 15:01:00 GMT"),
            ("미래", "Wed, 18 Nov 2026 15:03:00 GMT"),
            ("날짜 없음", ""),
        ]
        items = "".join(f"<item><title>{name}</title><pubDate>{date}</pubDate><ht:approx_traffic>200+</ht:approx_traffic></item>" for name, date in rows)
        rss = f'<rss xmlns:ht="urn:trends"><channel><link>{FEED}</link>{items}</channel></rss>'
        data = daily_keywords(rss, collected)
        self.assertEqual([(v["term"], v["traffic"]) for v in data["items"]], [("오늘", "200+")])
        with self.assertRaises(ValueError):
            daily_keywords(rss.replace("geo=KR", "geo=US"), collected)
        self.assertEqual(daily_keywords(rss.replace(items, ""), collected)["items"], [])
