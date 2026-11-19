import unittest
from datetime import datetime
from scripts.refresh_daily_keywords import FEED, daily_keywords


class DailyKeywordsTest(unittest.TestCase):
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
