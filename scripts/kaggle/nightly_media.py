#!/usr/bin/env python3
"""
AutoReels Nightly Kaggle GPU Worker (runs headless in Kaggle T4/P100 while PC is off).
1. Clones minokingdom/autoreels-platform (public read or authenticated via optional GITHUB_TOKEN).
2. Reads public/trends-today.json; fetches 10 fresh Korean topics + English 1:1 icon prompts per industry if missing/stale.
3. Generates 1:1 topic icons on Kaggle GPU via Lykon/dreamshaper-xl-v2-turbo ($0 compute cost).
4. Packages /kaggle/working/autoreels_nightly_bundle.zip for GitHub Actions pickup (and pushes directly if GITHUB_TOKEN is set).
5. Sends KakaoTalk Memo / webhook alert if any step fails.
"""
import datetime
import json
import os
import re
import subprocess
import sys
import traceback
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path


def strip_surrogates(text: str) -> str:
    return re.sub(r"[\ud800-\udfff]", "", text)


def get_secret(name: str, default: str = "") -> str:
    val = os.environ.get(name, "").strip()
    if val:
        return val
    try:
        from kaggle_secrets import UserSecretsClient  # type: ignore
        return (UserSecretsClient().get_secret(name) or "").strip()
    except Exception:
        return default


def notify_kakao(text: str) -> None:
    rest_key = get_secret("KAKAO_REST_API_KEY")
    refresh_token = get_secret("KAKAO_REFRESH_TOKEN")
    webhook = get_secret("KAKAO_ALERT_WEBHOOK")
    if rest_key and refresh_token:
        try:
            data = urllib.parse.urlencode({
                "grant_type": "refresh_token",
                "client_id": rest_key,
                "refresh_token": refresh_token,
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://kauth.kakao.com/oauth/token",
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
            )
            with urllib.request.urlopen(req, timeout=12) as r:
                tk = json.loads(r.read().decode("utf-8"))
            token = tk.get("access_token")
            if token:
                tpl = json.dumps({
                    "object_type": "text",
                    "text": f"[AutoReels Kaggle 알림]\n{text[:900]}",
                    "link": {"web_url": "https://autoreels-studio.vercel.app", "mobile_web_url": "https://autoreels-studio.vercel.app"},
                    "button_title": "스튜디오 확인",
                }, ensure_ascii=False)
                body = urllib.parse.urlencode({"template_object": tpl}).encode("utf-8")
                mreq = urllib.request.Request(
                    "https://kapi.kakao.com/v2/api/talk/memo/default/send",
                    data=body,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
                )
                urllib.request.urlopen(mreq, timeout=12).read()
        except Exception as e:
            print("kakao notify failed:", e)
    if webhook:
        try:
            wreq = urllib.request.Request(
                webhook,
                data=json.dumps({"text": f"[AutoReels Kaggle 알림]\n{text}"}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            urllib.request.urlopen(wreq, timeout=12).read()
        except Exception as e:
            print("webhook notify failed:", e)


def post_json(url: str, payload: dict) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Origin": "https://autoreels-studio.vercel.app"},
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode("utf-8"))


def get_kst_date_context(date_str: str) -> dict:
    kst = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
    weekdays = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"]
    m = kst.month
    season = "봄" if m in (3, 4, 5) else ("여름" if m in (6, 7, 8) else ("가을" if m in (9, 10, 11) else "겨울"))
    return {"dateStr": date_str or kst.strftime("%Y-%m-%d"), "weekday": weekdays[kst.weekday()], "season": season}


INDUSTRY_INFO = {
    "auto": {"name": "자동차 영업", "role": "카마스터", "product": "차량", "aiRole": "자동차 영업 전문가"},
    "restaurant": {"name": "음식점", "role": "사장님", "product": "시그니처 메뉴", "aiRole": "맛집 사장님"},
    "cafe": {"name": "카페·디저트", "role": "사장님", "product": "음료·디저트", "aiRole": "카페 사장님"},
    "beauty": {"name": "미용·네일·뷰티", "role": "원장님", "product": "네일·뷰티 시술", "aiRole": "네일·뷰티 샵 원장님"},
    "realestate": {"name": "부동산 중개", "role": "공인중개사", "product": "추천 매물", "aiRole": "공인중개사"},
    "academy": {"name": "학원·교육", "role": "원장님", "product": "수업·커리큘럼", "aiRole": "학원 원장님"},
    "clinic": {"name": "병원·의원", "role": "원장님", "product": "진료·케어", "aiRole": "클리닉 원장님"},
    "fitness": {"name": "헬스·필라테스", "role": "트레이너", "product": "PT·클래스", "aiRole": "피트니스 코치"},
    "shop": {"name": "쇼핑몰·소매", "role": "대표", "product": "인기 상품", "aiRole": "쇼핑몰 디렉터"},
    "interior": {"name": "인테리어·시공", "role": "실장님", "product": "리모델링 시공", "aiRole": "인테리어 실장님"},
}

IND_VISUAL_HINT = {
    "auto": "modern sleek car showroom photography",
    "restaurant": "appetizing Korean gourmet food tabletop photography",
    "cafe": "artisanal latte and dessert cozy cafe photography",
    "beauty": "macro photography of glossy gel manicured nails and salon tools on stone, no portrait, no face",
    "realestate": "bright modern apartment interior living room photography",
    "academy": "clean focused study desk and warm notebook lighting photography",
    "clinic": "serene minimalist modern wellness clinic lounge photography",
    "fitness": "modern boutique pilates and gym studio photography",
    "shop": "clean minimalist boutique fashion product flatlay",
    "interior": "warm architectural Scandinavian apartment interior design",
}


def load_diffusers():
    try:
        import torch  # type: ignore
        from diffusers import AutoencoderKL, AutoPipelineForText2Image, DPMSolverMultistepScheduler  # type: ignore
        return torch, AutoencoderKL, AutoPipelineForText2Image, DPMSolverMultistepScheduler
    except Exception:
        subprocess.run([sys.executable, "-m", "pip", "-q", "install", "diffusers", "accelerate", "safetensors", "pillow"], check=True)
        import torch  # type: ignore
        from diffusers import AutoencoderKL, AutoPipelineForText2Image, DPMSolverMultistepScheduler  # type: ignore
        return torch, AutoencoderKL, AutoPipelineForText2Image, DPMSolverMultistepScheduler


def run_worker() -> None:
    gh_token = get_secret("GITHUB_TOKEN")
    gh_repo = get_secret("GITHUB_REPO", "minokingdom/autoreels-platform")

    work_dir = Path("/tmp/autoreels_repo")
    if work_dir.exists():
        subprocess.run(["rm", "-rf", str(work_dir)], check=True)
    remote = f"https://x-access-token:{gh_token}@github.com/{gh_repo}.git" if gh_token else f"https://github.com/{gh_repo}.git"
    subprocess.run(["git", "clone", "--depth", "1", remote, str(work_dir)], check=True)

    trends_path = work_dir / "public" / "trends-today.json"
    data = json.loads(trends_path.read_text(encoding="utf-8"))
    date_ctx = get_kst_date_context(data.get("date", ""))
    date_str = date_ctx["dateStr"]
    topics_dir = work_dir / "public" / "assets" / "topics"

    torch, AutoencoderKL, AutoPipelineForText2Image, DPMSolverMultistepScheduler = load_diffusers()
    vae = AutoencoderKL.from_pretrained("madebyollin/sdxl-vae-fp16-fix", torch_dtype=torch.float16)
    pipe = AutoPipelineForText2Image.from_pretrained(
        "Lykon/dreamshaper-xl-v2-turbo", vae=vae, torch_dtype=torch.float16, variant="fp16"
    ).to("cuda")
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        pipe.scheduler.config, use_karras_sigmas=True, algorithm_type="sde-dpmsolver++"
    )
    neg = "human face, portrait, headshot, passport photo, person standing, text, typography, letters, words, watermark, logo, signature, blurry, ugly, low quality, collage"

    for ind, info in INDUSTRY_INFO.items():
        row = data.setdefault("industries", {}).setdefault(ind, {})
        keywords = row.get("keywords", [])[:8]
        if row.get("topicsDate") != date_str or not isinstance(row.get("topics"), list) or len(row["topics"]) < 10:
            try:
                res = post_json("https://autoreels-studio.vercel.app/api/generate-script", {
                    "mode": "topics",
                    "industry": ind,
                    "industryInfo": info,
                    "dateContext": date_ctx,
                    "trends": keywords,
                })
                if res.get("ok") and isinstance(res.get("topics"), list) and len(res["topics"]) >= 5:
                    row["topics"] = res["topics"][:10]
                    row["topicsDate"] = date_str
            except Exception as e:
                print(f"[topics] {ind} err:", e)

        topics = row.get("topics") or []
        if not topics:
            continue

        prompts = []
        try:
            pres = post_json("https://autoreels-studio.vercel.app/api/generate-script", {
                "mode": "scene-prompts",
                "isIcon": True,
                "industry": ind,
                "industryInfo": info,
                "topicsList": [{"title": t.get("title", ""), "why": t.get("why", "")} for t in topics],
                "count": len(topics),
            })
            if pres.get("ok") and isinstance(pres.get("prompts"), list):
                prompts = pres["prompts"]
        except Exception as e:
            print(f"[prompts] {ind} err:", e)

        out_ind = topics_dir / ind
        out_ind.mkdir(parents=True, exist_ok=True)
        hint = IND_VISUAL_HINT.get(ind, ind)
        for idx, t in enumerate(topics):
            p_raw = prompts[idx] if idx < len(prompts) else ""
            has_ko = any("\uac00" <= ch <= "\ud7a3" for ch in p_raw)
            prompt = p_raw if (p_raw and not has_ko) else f"clean square 1:1 editorial object photography, {hint}, variation {idx + 1}, centered crisp subject, soft studio lighting"
            gen = torch.Generator("cuda").manual_seed(1100 + idx * 17 + sum(ord(c) for c in ind))
            img = pipe(prompt=prompt, negative_prompt=neg, width=768, height=768, num_inference_steps=6, guidance_scale=2.0, generator=gen).images[0]
            img = img.resize((256, 256))
            dst = out_ind / f"{idx + 1}.jpg"
            img.save(dst, format="JPEG", quality=88)
            t["iconUrl"] = f"/assets/topics/{ind}/{idx + 1}.jpg"
            print(f"[ok] {ind}/{idx + 1}.jpg")

    trends_payload = strip_surrogates(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    trends_path.write_text(trends_payload, encoding="utf-8")

    bundle_path = Path("/kaggle/working/autoreels_nightly_bundle.zip")
    with zipfile.ZipFile(bundle_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(trends_path, "public/trends-today.json")
        for jpg in sorted(topics_dir.glob("*/*.jpg")):
            zf.write(jpg, str(jpg.relative_to(work_dir)).replace("\\", "/"))
    print(f"Created {bundle_path} ({bundle_path.stat().st_size} bytes)")

    if gh_token:
        subprocess.run(["git", "-C", str(work_dir), "config", "user.name", "autoreels-kaggle-bot"], check=True)
        subprocess.run(["git", "-C", str(work_dir), "config", "user.email", "actions@users.noreply.github.com"], check=True)
        subprocess.run(["git", "-C", str(work_dir), "add", "public/trends-today.json", "public/assets/topics/"], check=True)
        diff = subprocess.run(["git", "-C", str(work_dir), "diff", "--cached", "--quiet"])
        if diff.returncode != 0:
            subprocess.run(["git", "-C", str(work_dir), "commit", "-m", f"chore(kaggle): nightly topics & 100 topic icons ({date_str})"], check=True)
            subprocess.run(["git", "-C", str(work_dir), "pull", "--rebase", "origin", "main"], check=True)
            subprocess.run(["git", "-C", str(work_dir), "push", "origin", "main"], check=True)
            print("Pushed updated topics and icons directly to GitHub!")
    else:
        print("No GITHUB_TOKEN in Kaggle Secrets; bundle saved for GitHub Actions download.")


if __name__ == "__main__":
    try:
        run_worker()
    except Exception:
        err = traceback.format_exc()
        print(err, file=sys.stderr)
        notify_kakao(f"새벽 캐글 자동 생성 실패:\n{err[-500:]}")
        raise
