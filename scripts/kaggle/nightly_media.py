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
    "beauty": "luxury nail polish bottles, crystal nail art display stand and warm stone salon decor, no hands, no people, no portrait",
    "realestate": "bright modern apartment interior living room photography",
    "academy": "clean focused study desk and warm notebook lighting photography",
    "clinic": "serene minimalist modern wellness clinic lounge photography",
    "fitness": "modern boutique pilates and gym studio photography",
    "shop": "clean minimalist boutique fashion product flatlay",
    "interior": "warm architectural Scandinavian apartment interior design",
}

EXTRA_SCENE_PROMPTS = {
    "auto": [
        "vertical 9:16 automotive editorial photography of a sleek modern sedan driving on a wet Seoul neon avenue at night, dramatic headlights, photorealistic",
        "vertical 9:16 photography of an open SUV tailgate ready for camping with neat outdoor gear by a calm pine forest, warm daylight",
        "vertical 9:16 interior cabin photography of a digital hybrid dashboard cluster and glowing ambient console in evening dusk",
        "vertical 9:16 close-up automotive photography of forged multi-spoke alloy wheels and gleaming brake calipers on clean showroom epoxy floor",
        "vertical 9:16 upward view through a wide panoramic glass car sunroof looking at crisp blue sky and sunlit city architecture",
    ],
    "restaurant": [
        "vertical 9:16 gourmet Korean food editorial photo of steaming rich signature broth noodle bowl with garnish on dark wooden table",
        "vertical 9:16 lifestyle dining photography of chilled crisp draft craft beer beside golden grilled platter in warm evening bar light",
        "vertical 9:16 appetizing close-up of sizzling Korean iron pan fried rice with golden egg yolk and seaweed flakes, moody dining lighting",
        "vertical 9:16 charcoal grill photography of tender marbled steak cuts searing over glowing embers with subtle aromatic smoke",
        "vertical 9:16 warm cozy Korean bistro dining table full of shared plates and happy ambiance, shallow depth of field",
    ],
    "cafe": [
        "vertical 9:16 dessert photography of glossy seasonal fresh strawberry tart topped with whipped cream on ceramic plate by sunlit window",
        "vertical 9:16 artisan pour-over hand-drip coffee brewing in glass server with steam rising, warm specialty coffee bar",
        "vertical 9:16 sunlit minimalist cafe corner with green indoor olive tree, oak chair and warm shadows on plaster wall",
        "vertical 9:16 morning brunch flatlay of toasted sesame bagel sandwich and iced americano on travertine stone table",
        "vertical 9:16 moody evening cafe interior illuminated by warm amber pendant lamps and wooden counter glow",
    ],
    "beauty": [
        "vertical 9:16 macro beauty photography of luxury gel nail polish bottles and translucent pastel color chart stand on travertine stone, no hands",
        "vertical 9:16 clean luxury nail salon tabletop with manicure bottles, cuticle oil dropper and soft linen towel, no hands",
        "vertical 9:16 serene luxury head-spa treatment room with warm botanical steam mist and ceramic wash basin, no portrait",
        "vertical 9:16 editorial salon vanity mirror setup with sleek styling brush, ceramic hair iron and warm studio backlighting, no hands",
        "vertical 9:16 pearl velvet gift tray with glossy nude gel nail tip display palette, pearl beads and white silk ribbon fabric, no hands",
    ],
    "realestate": [
        "vertical 9:16 high-rise modern Seoul apartment balcony view overlooking sunlit river and green parklands at golden hour",
        "vertical 9:16 bright clean underground apartment parking garage with wide EV charging bays and modern architectural lighting",
        "vertical 9:16 landscaped serene apartment courtyard walking path lined with maple trees and morning sunlight",
        "vertical 9:16 minimalist custom built-in pantry and walk-in dressing closet with warm LED strip shelving",
        "vertical 9:16 sunlit Scandinavian newlywed living room interior with cream sofa, sheer curtains and warm oak flooring",
    ],
    "academy": [
        "vertical 9:16 inspiring stack of crisp study awards, notebooks and fountain pen on warm oak desk under brass lamp",
        "vertical 9:16 neat clean exam workbook with crisp handwritten notes and timer on minimalist study desk",
        "vertical 9:16 bright calm private mentoring classroom table with clean whiteboard and neatly arranged study tablet",
        "vertical 9:16 organized colorful study planner calendar with highlighters and wooden ruler in sunny study room",
        "vertical 9:16 safe clean modern academy lobby entrance with warm timber panels and bright welcoming lighting",
    ],
    "clinic": [
        "vertical 9:16 sterile modern medical dental treatment room with stainless sterilized instrument tray and clean bright lighting",
        "vertical 9:16 calm private dermatology wellness skincare suite with clean white medical bed and soft warm indirec lighting",
        "vertical 9:16 peaceful integrative medical consultation desk with botanical plant and warm natural sunlight",
        "vertical 9:16 clean minimalist dental hygiene x-ray monitor and digital scanner workstation in bright clinic",
        "vertical 9:16 serene sunlit modern hospital waiting lounge with curved bouclé armchairs and travertine reception desk",
    ],
    "fitness": [
        "vertical 9:16 sleek modern cardio treadmill zone with panoramic city window view and morning sunlight",
        "vertical 9:16 minimalist sunlit pilates studio rack with foam rollers, kettlebells and wooden stretching equipment",
        "vertical 9:16 healthy clean wellness protein shake bar with matte shaker bottle and chilled mineral water on stone counter",
        "vertical 9:16 moody boutique gym functional training corner with kettlebells, battle rope and dumbbell rack",
        "vertical 9:16 sleek 24-hour luxury fitness studio at night with warm accent LED mirror strips and clean rubber floor",
    ],
    "shop": [
        "vertical 9:16 clean boutique clothing rack displaying neutral wool coats and cashmere knitwear in warm studio light",
        "vertical 9:16 editorial accessory flatlay of structured leather handbag, silk scarf and sunglasses on limestone plinth",
        "vertical 9:16 natural daylight linen garment texture close-up hanging beside sunlit sheer curtain",
        "vertical 9:16 curated matching outfit flatlay folded neatly with linen trousers, cardigan and minimalist box",
        "vertical 9:16 luxury kraft gift boutique packaging tied with satin ribbon and dried botanical stem on stone table",
    ],
    "interior": [
        "vertical 9:16 architectural photography of sleek slim anodized aluminum glass apartment foyer partition and terrazzo tile entrance",
        "vertical 9:16 custom ceiling-height matte cream built-in wardrobe closets with concealed recessed handle profile",
        "vertical 9:16 sunlit apartment balcony transformed into serene wood-deck home cafe nook with lounge chair and potted olive tree",
        "vertical 9:16 minimal triple-glazed thermal window frame bathed in crisp morning light overlooking clean apartment view",
        "vertical 9:16 warm Korean minimalist living space blending white oak paneling and limewash plaster wall textures",
    ],
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
    neg = "human face, portrait, headshot, passport photo, person standing, hands, fingers, extra fingers, deformed fingers, mutated hands, text, typography, letters, words, watermark, logo, signature, blurry, ugly, low quality, collage"

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

    # Generate missing 9:16 vertical scene slots (11..15) + 1 rotating scene slot per night per industry
    scenes_dir = work_dir / "public" / "assets" / "scenes"
    kst_now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
    rot_slot = 11 + (kst_now.timetuple().tm_yday % 5)
    for ind, scene_prompts in EXTRA_SCENE_PROMPTS.items():
        scene_ind = scenes_dir / ind
        scene_ind.mkdir(parents=True, exist_ok=True)
        for offset, sp in enumerate(scene_prompts):
            slot = 11 + offset
            dst = scene_ind / f"{slot}.jpg"
            if dst.exists() and slot != rot_slot:
                continue
            seed = 4200 + slot * 31 + kst_now.timetuple().tm_yday + sum(ord(c) for c in ind)
            gen = torch.Generator("cuda").manual_seed(seed)
            img = pipe(prompt=sp, negative_prompt=neg, width=576, height=1024, num_inference_steps=6, guidance_scale=2.0, generator=gen).images[0]
            img.save(dst, format="JPEG", quality=88)
            print(f"[scene] {ind}/{slot}.jpg")

    bundle_path = Path("/kaggle/working/autoreels_nightly_bundle.zip")
    with zipfile.ZipFile(bundle_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(trends_path, "public/trends-today.json")
        for jpg in sorted(topics_dir.glob("*/*.jpg")):
            zf.write(jpg, str(jpg.relative_to(work_dir)).replace("\\", "/"))
        for jpg in sorted(scenes_dir.glob("*/*.jpg")):
            zf.write(jpg, str(jpg.relative_to(work_dir)).replace("\\", "/"))
    print(f"Created {bundle_path} ({bundle_path.stat().st_size} bytes)")

    if gh_token:
        subprocess.run(["git", "-C", str(work_dir), "config", "user.name", "autoreels-kaggle-bot"], check=True)
        subprocess.run(["git", "-C", str(work_dir), "config", "user.email", "actions@users.noreply.github.com"], check=True)
        subprocess.run(["git", "-C", str(work_dir), "add", "public/trends-today.json", "public/assets/topics/", "public/assets/scenes/"], check=True)
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
