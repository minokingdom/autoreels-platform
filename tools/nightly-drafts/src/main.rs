use chrono::{DateTime, Duration, FixedOffset, Utc};
use serde_json::{json, Value};
use std::{collections::HashSet, error::Error, fs, path::Path};

fn field<'a>(row: &'a Value, name: &str) -> &'a str {
    row[name].as_str().unwrap_or("").trim()
}

fn date_kst(time: DateTime<Utc>) -> String {
    time.with_timezone(&FixedOffset::east_opt(9 * 3600).unwrap())
        .format("%F")
        .to_string()
}

fn time(row: &Value, key: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(field(row, key))
        .ok()
        .map(|t| t.to_utc())
}

fn cut(role: &str, line: &str, source: &str) -> Value {
    json!({"role":role,"line":line,"sourceTag":source,"mediaType":"타이포그래피"})
}

fn xml(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

fn preview(cuts: &[Value], color: &str) -> String {
    let cols = cuts.len().div_ceil(2);
    let mut svg = format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {} 360" font-family="sans-serif">"#,
        cols * 104
    );
    for (i, c) in cuts.iter().enumerate() {
        let x = (i % cols) * 104;
        let y = (i / cols) * 180;
        svg.push_str(&format!(r##"<g transform="translate({x} {y})"><rect width="100" height="176" rx="5" fill="{color}"/><g fill="#fff"><text x="7" y="20" font-size="8">{}</text>"##,xml(field(c,"role"))));
        let mut lines: Vec<String> = Vec::new();
        let mut current = String::new();
        for word in field(c, "line").split_whitespace() {
            if !current.is_empty() && current.chars().count() + 1 + word.chars().count() > 9 {
                lines.push(std::mem::take(&mut current));
            }
            if !current.is_empty() {
                current.push(' ');
            }
            for ch in word.chars() {
                if current.chars().count() == 9 {
                    lines.push(std::mem::take(&mut current));
                }
                current.push(ch);
            }
        }
        if !current.is_empty() {
            lines.push(current);
        }
        let step = (104 / lines.len().max(1)).min(14);
        for (n, line) in lines.iter().enumerate() {
            svg.push_str(&format!(
                r#"<text x="7" y="{}" font-size="{}" font-weight="700">{}</text>"#,
                92 + step * n - step * lines.len() / 2,
                step.min(10),
                xml(line)
            ));
        }
        svg.push_str(&format!(
            r#"<text x="7" y="160" font-size="7">{}</text></g></g>"#,
            xml(field(c, "sourceTag"))
        ));
    }
    svg.push_str("</svg>");
    svg
}

fn quotes(rows: &[Value], now: DateTime<Utc>) -> Vec<Value> {
    let mut seen = HashSet::new();
    let mut works = std::collections::HashMap::new();
    let mut drafts = Vec::new();
    for q in rows {
        let Some(published) = time(q, "publishedAt") else {
            continue;
        };
        let id = field(q, "id");
        let work = field(q, "work");
        let publisher = field(q, "publisher");
        let quote = field(q, "quote");
        if published > now
            || now - published > Duration::days(7)
            || id.len() != 11
            || !id
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
            || [work, publisher, quote].contains(&"")
            || !seen.insert((work, quote))
        {
            continue;
        }
        let count = works.entry(work).or_insert(0);
        if *count >= 2 {
            continue;
        }
        *count += 1;
        let context = field(q, "context");
        let cuts = vec![
            cut("작품", work, publisher),
            cut(
                "장면",
                if context.is_empty() {
                    field(q, "genre")
                } else {
                    context
                },
                publisher,
            ),
            cut("대사", quote, publisher),
            cut("여운", "이 장면에서 기억에 남은 말은?", publisher),
        ];
        let url = format!("https://www.youtube.com/watch?v={id}");
        drafts.push(json!({"id":format!("quote_{id}"),"factoryType":"quote","cat":"명대사","badge":"최근 게시","genre":field(q,"genre"),"title":work,"quote":quote,"publishedAt":field(q,"publishedAt"),"why":context,"color":"#433954","sourceTag":publisher,"sourceUrl":url,"factNote":format!("{publisher} · {url}"),"previewSheet":preview(&cuts,"#433954"),"cuts":cuts}));
        if drafts.len() == 8 {
            break;
        }
    }
    drafts
}

fn briefing(rows: &[Value], now: DateTime<Utc>) -> Option<Value> {
    let date = date_kst(now);
    let mut sources = Vec::new();
    let mut seen = HashSet::new();
    let mut cuts = Vec::new();
    let title = format!(
        "{}월 {}일 주요 뉴스",
        date[5..7].trim_start_matches('0'),
        date[8..].trim_start_matches('0')
    );
    cuts.push(cut("도입", &title, "오늘의 브리핑"));
    for row in rows {
        let publisher = field(row, "publisher");
        let url = field(row, "url");
        let headline = field(row, "headline");
        let Some(published) = time(row, "publishedAt") else {
            continue;
        };
        let host = match publisher {
            "SBS" => "https://news.sbs.co.kr/",
            "연합뉴스" => "https://www.yna.co.kr/",
            _ => continue,
        };
        if field(row, "day") != date
            || published > now
            || date_kst(published) != date
            || headline.is_empty()
            || !url.starts_with(host)
            || !seen.insert(url)
        {
            continue;
        }
        cuts.push(cut(
            &format!("소식 {}", sources.len() + 1),
            headline,
            publisher,
        ));
        sources.push(json!({"name":publisher,"url":url,"headline":headline}));
        if sources.len() == 4 {
            break;
        }
    }
    if sources.is_empty() {
        return None;
    }
    cuts.push(cut(
        "마무리",
        "기사별 출처는 설명에서 확인하세요.",
        "오늘의 브리핑",
    ));
    let notes = sources
        .iter()
        .map(|s| format!("{} · {}", field(s, "name"), field(s, "url")))
        .collect::<Vec<_>>()
        .join("\n");
    Some(
        json!({"id":format!("briefing_{date}"),"factoryType":"briefing","cat":"쇼츠 포맷","genre":"뉴스 브리핑","title":title,"badge":"오늘의 브리핑","year":date,"color":"#203750","sourceTag":field(&sources[0],"name"),"sourceUrl":field(&sources[0],"url"),"sources":sources,"why":"오늘 보도된 기사 제목을 한눈에 살펴보세요.","factNote":notes,"previewSheet":preview(&cuts,"#203750"),"cuts":cuts}),
    )
}

fn read(path: &str) -> Result<Value, Box<dyn Error>> {
    Ok(serde_json::from_slice(&fs::read(path)?)?)
}

fn main() -> Result<(), Box<dyn Error>> {
    let keywords = read("public/daily-keywords.json")?;
    let recent = read("public/meme-recent.json")?;
    let now: DateTime<Utc> = std::time::SystemTime::now().into();
    let day = date_kst(now);
    let recent_rows = recent["quotes"].as_array().ok_or("명대사 입력 형식 오류")?;
    let issues = keywords["issues"]
        .as_array()
        .ok_or("브리핑 입력 형식 오류")?;
    let draft = briefing(issues, now);
    let quotes = quotes(recent_rows, now);
    let out = Path::new("lib/nightly-drafts.json");
    let mut output = json!({"date":day,"quotes":quotes,"briefing":draft});
    // 같은 날 재수집 결과가 비면 직전의 검증된 초안을 유지한다.
    if let Ok(prior) = read("lib/nightly-drafts.json") {
        if prior["date"] == output["date"] {
            if output["briefing"].is_null() {
                output["briefing"] = prior["briefing"].clone();
            }
            if quotes.is_empty() {
                output["quotes"] = prior["quotes"].clone();
            }
        }
    }
    let temp = out.with_extension("json.tmp");
    fs::write(
        &temp,
        format!("{}\n", serde_json::to_string_pretty(&output)?),
    )?;
    fs::rename(temp, out)?;
    println!(
        "{} 명대사 {}편 · 브리핑 {}편",
        day,
        output["quotes"].as_array().map_or(0, Vec::len),
        usize::from(!output["briefing"].is_null())
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn korea_midnight_and_sources() {
        let t = "2026-11-23T15:05:00Z".parse().unwrap();
        let good = json!({"term":"경제","headline":"오늘 소식 <핵심>","url":"https://news.sbs.co.kr/news/1","publisher":"SBS","publishedAt":"2026-11-24T00:01:00+09:00","day":"2026-11-24"});
        let mut yesterday = good.clone();
        yesterday["publishedAt"] = json!("2026-11-23T23:59:00+09:00");
        let mut foreign = good.clone();
        foreign["url"] = json!("https://news.sbs.co.kr.example.org/1");
        assert!(briefing(&[yesterday.clone(), foreign.clone()], t).is_none());
        let out = briefing(&[yesterday, foreign, good.clone(), good], t).unwrap();
        assert_eq!(out["sources"].as_array().unwrap().len(), 1);
        assert_eq!(out["cuts"][1]["line"], "오늘 소식 <핵심>");
        assert!(out["previewSheet"]
            .as_str()
            .unwrap()
            .contains("&lt;핵심&gt;"));
    }
    #[test]
    fn quote_repeats_and_expired_sources() {
        let t = "2026-11-24T01:00:00Z".parse().unwrap();
        let good = json!({"id":"abcdefghijk","publishedAt":"2026-11-22T01:00:00Z","work":"작품","quote":"첫 대사","genre":"영화","publisher":"제작사"});
        let mut old = good.clone();
        old["publishedAt"] = json!("2026-11-06T01:00:00Z");
        let out = quotes(&[old, good.clone(), good], t);
        assert_eq!(out.len(), 1);
        assert_eq!(out[0]["cuts"][2]["line"], "첫 대사");
        assert_eq!(out[0]["cuts"].as_array().unwrap().len(), 4);
    }
}
