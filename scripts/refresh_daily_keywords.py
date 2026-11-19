"""Google 트렌드 한국 급상승 RSS에서 한국 시간 당일에 시작한 검색어만 저장합니다."""
import json
import re
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import urlopen
from urllib.error import URLError
from xml.etree import ElementTree


FEED = "https://trends.google.com/trending/rss?geo=KR"
KST = timezone(timedelta(hours=9))
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "daily-keywords.json"
NEWS = {
    "연합뉴스": ("https://www.yna.co.kr/rss/society.xml", "www.yna.co.kr"),
    "SBS": ("https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=03", "news.sbs.co.kr"),
}
EXAMS = {"2026-11-19": 100526, "2027-11-18": 103512, "2028-11-16": 106921}
# Neutral topic labels. A headline must support the label even when the report
# describes prevention or an allegation rather than a confirmed incident.
ISSUES = {
    "시험과 AI 부정행위 논란": r"(?=.*(?:시험|수능|수험|세무사|입시))(?=.*(?:\bAI|인공지능))(?=.*(?:부정행위|부정시험|커닝|컨닝))",
    "수능": r"수능|대학수학능력시험",
    "첫눈": r"첫눈(?:이|은|을|에|·|…|\s|$)",
    "한파특보": r"한파\s*(?:특보|주의보|경보)",
    "폭염특보": r"폭염\s*(?:특보|주의보|경보)",
    "대설특보": r"대설\s*(?:특보|주의보|경보)",
    "미세먼지 주의보": r"미세먼지\s*주의보",
    "대중교통 파업": r"(?:지하철|철도|시내버스|서울교통공사).{0,18}파업",
    "독감 유행": r"(?:독감|인플루엔자).{0,10}유행",
    "블랙프라이데이": r"블랙\s*프라이데이",
    "김장철": r"김장철|김장\s*물가",
    "명절 귀성길": r"귀성길|귀경길",
    "사전투표": r"사전\s*투표",
    "장마": r"장마전선|장마철|장마\s*(?:시작|종료)",
}


def public_issues(feeds, collected):
    day = collected.astimezone(KST).date().isoformat()
    issues = []
    if day in EXAMS:
        url = f"https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq={EXAMS[day]}&s=moe"
        issues.append({"term": "수능", "day": day, "kind": "일정", "publisher": "교육부", "url": url})
    matches = {}
    other_stories = []
    for publisher, xml in feeds.items():
        for item in ElementTree.fromstring(xml).findall("./channel/item"):
            title = item.findtext("title") or ""
            url = (item.findtext("link") or "").strip()
            parts = urlsplit(url)
            if parts.scheme != "https" or parts.hostname != NEWS[publisher][1]:
                continue
            try:
                published = parsedate_to_datetime(item.findtext("pubDate") or "")
            except (ValueError, TypeError, OverflowError):
                continue
            if not published.tzinfo or published > collected or published.astimezone(KST).date().isoformat() != day:
                continue
            labels = [term for term, pattern in ISSUES.items() if re.search(pattern, title, re.I)]
            for term in labels:
                matches.setdefault(term, {}).setdefault(publisher, []).append((published, url))
            if not labels:
                # Compare complete same-day society headlines across independent
                # outlets so that new stories can surface without a preset label.
                words = set(re.findall(r"[가-힣A-Za-z0-9]{2,}", re.sub(r"\[[^\]]*\]|\([^)]*\)", " ", title).lower()))
                words.difference_update({"오늘", "관련", "대한", "전국", "경찰", "정부", "기자", "사건", "현장", "종합", "발표", "이후", "오후", "오전"})
                other_stories.append((published, publisher, title, url, words))
    for term, outlets in sorted(matches.items(), key=lambda entry: -sum(map(len, entry[1].values()))):
        if any(issue["term"] == term for issue in issues):
            continue
        # A specific headline can establish a narrowly defined issue. Require
        # coverage by two outlets for broader seasonal and social topics.
        if len(outlets) < 2 and term != "시험과 AI 부정행위 논란":
            continue
        published, url, publisher = max((date, link, name) for name, rows in outlets.items() for date, link in rows)
        issues.append({"term": term, "day": day, "kind": "보도", "publisher": publisher,
                       "url": url, "publishedAt": published.isoformat()})
    used = set()
    for published, publisher, title, url, words in sorted(other_stories, key=lambda row: row[0], reverse=True):
        if url in used or len(issues) >= 8:
            continue
        related = []
        for _, outlet, _, link, other_words in other_stories:
            common = words & other_words
            if len(common) >= 3 and len(common) / len(words | other_words) >= 0.35:
                related.append((outlet, link))
        if not any(outlet != publisher for outlet, _ in related) or any(link in used for _, link in related):
            continue
        issues.append({"term": title, "day": day, "kind": "보도", "publisher": publisher,
                       "url": url, "publishedAt": published.isoformat()})
        used.update(link for _, link in related)
    return issues


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
    feeds = {}
    for publisher, (url, _) in NEWS.items():
        try:
            with urlopen(url, timeout=15) as response:
                xml = response.read()
            ElementTree.fromstring(xml)
            feeds[publisher] = xml
        except (OSError, URLError, ElementTree.ParseError) as exc:
            print(f"{publisher}: {exc}")
    collected = datetime.now(KST)
    try:
        with urlopen(FEED, timeout=20) as response:
            data = daily_keywords(response.read(), collected)
    except (OSError, URLError, ValueError, ElementTree.ParseError):
        data = {"source": FEED, "collectedAt": collected.isoformat(), "items": []}
    data["issues"] = public_issues(feeds, collected)
    if OUTPUT.exists():
        prior = json.loads(OUTPUT.read_text(encoding="utf-8"))
        yesterday = (collected - timedelta(days=1)).date().isoformat()
        data["previousIssues"] = [issue for issue in prior.get("issues", []) + prior.get("previousIssues", [])
                                  if issue.get("day") == yesterday]
    if not feeds and not data["items"] and not data["issues"]:
        raise SystemExit("No verified items or issues for this date")
    temp = OUTPUT.with_suffix(".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(OUTPUT)
    print(f"오늘의 이슈 {len(data['issues'])}개, 국내 급상승 검색어 {len(data['items'])}개 저장")
