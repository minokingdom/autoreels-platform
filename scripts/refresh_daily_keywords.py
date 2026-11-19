"""Google 트렌드 한국 급상승 RSS에서 한국 시간 당일에 시작한 검색어만 저장합니다."""
import json
import re
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.request import urlopen
from xml.etree import ElementTree


FEED = "https://trends.google.com/trending/rss?geo=KR"
KST = timezone(timedelta(hours=9))
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "daily-keywords.json"


def daily_keywords(xml, collected):
    channel = ElementTree.fromstring(xml).find("channel")
    if channel is None or channel.findtext("link") != FEED:
        raise ValueError("한국 급상승 RSS를 확인할 수 없습니다.")
    items = []
    seen = set()
    for item in channel.findall("item"):
        term = (item.findtext("title") or "").strip()
        try:
            start = parsedate_to_datetime(item.findtext("pubDate") or "")
        except (ValueError, TypeError, OverflowError):
            continue
        if not term or term in seen or not start.tzinfo or start > collected:
            continue
        if start.astimezone(KST).date() != collected.astimezone(KST).date():
            continue
        seen.add(term)
        volume = (item.findtext("{*}approx_traffic") or "").strip()
        items.append({"term": term, "startedAt": start.isoformat(),
                      "traffic": volume if re.fullmatch(r"[\d,.]+[KMB]?\+?", volume, re.I) else ""})
    return {"source": FEED, "collectedAt": collected.isoformat(), "items": items}


if __name__ == "__main__":
    with urlopen(FEED, timeout=20) as response:
        data = daily_keywords(response.read(), datetime.now(KST))
    temp = OUTPUT.with_suffix(".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(OUTPUT)
    print(f"한국 급상승 검색어 {len(data['items'])}개 저장")
