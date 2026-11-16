#!/usr/bin/env python3
"""
AutoReels Nightly Automation -> Iris KakaoTalk Alert Worker.
Runs on the always-on Ubuntu Iris host (100.92.237.65) and forwards failures
or partial issues from GitHub Actions / trends-today.json to Iris (/reply).
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

KST = timezone(timedelta(hours=9))
IRIS_URL = os.environ.get("IRIS_URL", "http://127.0.0.1:3000").rstrip("/")
ALERT_ROOM = os.environ.get("AUTOREELS_ALERT_ROOM", "380705904900190").strip()
GITHUB_REPO = os.environ.get("GITHUB_REPO", "minokingdom/autoreels-platform").strip()
TRENDS_URL = os.environ.get("TRENDS_URL", "https://autoreels-studio.vercel.app/trends-today.json").strip()
POLL_SECONDS = max(60, int(os.environ.get("AUTOREELS_POLL_SECONDS", "60")))
STATE_FILE = Path(os.environ.get("AUTOREELS_STATE_FILE", "/home/mino/autoreels_alert_state.json"))


def load_state() -> dict:
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, STATE_FILE)


def send_iris_text(room: str, message: str) -> int:
    payload = json.dumps(
        {"type": "text", "room": str(room), "data": message},
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{IRIS_URL}/reply",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        resp.read()
        return resp.status


def fetch_json_with_etag(url: str, etag: str = ""):
    headers = {"User-Agent": "autoreels-kakao-alerts/1.0", "Accept": "application/json"}
    if etag:
        headers["If-None-Match"] = etag
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            new_etag = resp.headers.get("ETag", "")
            return json.loads(resp.read().decode("utf-8")), new_etag, False
    except urllib.error.HTTPError as exc:
        if exc.code == 304:
            return None, etag, True
        raise


def poll_once(state: dict) -> bool:
    changed = False
    runs_url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/refresh-trends.yml/runs?per_page=5"
    runs_data, new_etag, not_modified = fetch_json_with_etag(runs_url, state.get("runs_etag", ""))
    if new_etag and new_etag != state.get("runs_etag"):
        state["runs_etag"] = new_etag
        changed = True

    seen_runs = set(str(x) for x in state.get("seen_run_ids", []))
    first_init = not bool(state.get("initialized"))

    if not not_modified and runs_data and isinstance(runs_data.get("workflow_runs"), list):
        completed = [r for r in runs_data["workflow_runs"] if r.get("status") == "completed"]
        if first_init:
            for r in completed:
                seen_runs.add(str(r.get("id")))
        else:
            for r in reversed(completed):
                rid = str(r.get("id"))
                if rid in seen_runs:
                    continue
                seen_runs.add(rid)
                conclusion = r.get("conclusion") or "unknown"
                if conclusion != "success":
                    num = r.get("run_number", rid)
                    msg = (
                        f"[AutoReels 새벽 자동화 실패]\n"
                        f"실행: #{num} ({conclusion})\n"
                        f"확인: {r.get('html_url', '')}"
                    )
                    status = send_iris_text(ALERT_ROOM, msg)
                    print(f"[alert] sent workflow failure #{num} -> HTTP {status}", flush=True)
        state["seen_run_ids"] = sorted(seen_runs, key=lambda x: int(x) if str(x).isdigit() else 0)[-50:]
        changed = True

    trends_data, t_etag, t_not_modified = fetch_json_with_etag(TRENDS_URL, state.get("trends_etag", ""))
    if t_etag and t_etag != state.get("trends_etag"):
        state["trends_etag"] = t_etag
        changed = True

    if not t_not_modified and isinstance(trends_data, dict):
        updated_at = str(trends_data.get("updatedAt") or trends_data.get("date") or "")
        problems = trends_data.get("problems") if isinstance(trends_data.get("problems"), list) else []
        if not first_init and problems and updated_at and updated_at != state.get("last_problem_at"):
            msg = "[AutoReels 트렌드 점검 필요]\n- " + "\n- ".join(str(x) for x in problems[:8])
            status = send_iris_text(ALERT_ROOM, msg)
            print(f"[alert] sent trends problems -> HTTP {status}", flush=True)
            state["last_problem_at"] = updated_at
            changed = True
        elif first_init and updated_at:
            state["last_problem_at"] = updated_at
            changed = True

    if first_init:
        state["initialized"] = True
        changed = True

    return changed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="Send one test message to Iris alert room and exit")
    args = parser.parse_args()

    if args.test:
        now = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S KST")
        msg = (
            f"[AutoReels 카카오톡 알림 테스트]\n"
            f"기존 Iris 카톡봇 연동 완료 ({now})\n"
            f"앞으로 매일 새벽 4시 GitHub Actions · Kaggle GPU 작업에 문제가 생기면 이 방으로 즉시 알림이 옵니다."
        )
        status = send_iris_text(ALERT_ROOM, msg)
        print(f"TEST_SENT_HTTP={status} room={ALERT_ROOM}")
        return 0

    state = load_state()
    while True:
        try:
            if poll_once(state):
                save_state(state)
        except Exception as exc:
            print(f"[poll error] {exc}", file=sys.stderr, flush=True)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    raise SystemExit(main())
