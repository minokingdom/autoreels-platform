#!/usr/bin/env python3
"""
AutoReels Local ComfyUI Scene Generator (RTX 3060 Ti / DreamShaperXL Turbo).
Scans public/assets/scenes/<industry>/1..15.jpg for missing or duplicate images,
generates crisp 9:16 editorial photos via ComfyUI (127.0.0.1:8188), and saves
them as 1080x1920 JPEGs.
"""
import argparse
import hashlib
import io
import json
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from PIL import Image

COMFY_DIR = Path(r"D:\ComfyUi Portable\ComfyUI-Easy-Install\ComfyUI")
PYTHON_EXE = Path(r"D:\ComfyUi Portable\ComfyUI-Easy-Install\python_embeded\python.exe")
REPO_ROOT = Path(__file__).resolve().parent.parent
SCENES_DIR = REPO_ROOT / "public" / "assets" / "scenes"
HOST = "http://127.0.0.1:8188"
CKPT = "DreamShaperXL_Turbo_v2_1.safetensors"

NEG_PROMPT = (
    "text, typography, letters, words, numbers, watermark, logo, signature, korean characters, "
    "deformed fingers, extra fingers, distorted face, creepy eyes, blurry, low quality, collage, split frame"
)

# Exact slot prompts keyed by (industry, slot) matching AR_INDUSTRY_SCENE_DECKS in 01-industries.js
SLOT_PROMPTS = {
    ("beauty", 5): "vertical 9:16 photography of a calm private single-chair luxury Korean hair salon suite, beige linen curtain, minimalist round mirror, warm soft studio light, photorealistic, no people",
    ("beauty", 6): "vertical 9:16 editorial photography of warm honey-caramel dyed glossy wavy hair texture from behind in softly lit modern salon, creamy wall background, photorealistic, no distorted hands",
    ("beauty", 7): "vertical 9:16 tabletop product photography of clean amber glass botanical scalp essence bottles and white ceramic dish with chamomile flowers on travertine stone, bright natural salon light",
    ("beauty", 8): "vertical 9:16 luxury beauty studio editorial photography of warm wooden vanity console table with ceramic sculptural vase, brass tray, rolled plush cream towels and styling brush in soft morning window sunlight, photorealistic, no mirror reflection, no people",
    ("beauty", 9): "vertical 9:16 interior architecture photography of a sleek cream-toned Korean beauty boutique reception desk with sculptural ceramic flower vase and warm indirect lighting, no text",
    ("beauty", 10): "vertical 9:16 architectural exterior photography of a chic modern boutique beauty salon storefront with tall arched glass door, stone facade and indoor greenery in soft daylight, no text",

    ("clinic", 5): "vertical 9:16 photography of a serene bright doctor consultation room desk with wooden tabletop, green botanical plant and soft linen chairs in warm daylight, trustworthy clean medical vibe",
    ("clinic", 6): "vertical 9:16 interior architectural photography of an upscale quiet medical wellness corridor at evening with warm concealed oak wall cove lighting and travertine floor",
    ("clinic", 7): "vertical 9:16 architectural photography of a clean modern bright medical center ground-floor glass lobby entrance beside crisp city tree-lined sidewalk in morning sun, no text",
    ("clinic", 8): "vertical 9:16 clean wellness tabletop still life of soothing chamomile herbal tea cup, sealed clean skincare soothing balm jar and folded white cotton towel on matte stone tray",
    ("clinic", 9): "vertical 9:16 interior photography of a calm bright modern hospital concierge reception lounge with warm limestone counter, curved cream chairs and soft indirect lighting, no text",
    ("clinic", 10): "vertical 9:16 exterior photography of a peaceful contemporary medical clinic facade with warm timber trim, tall clear glass windows and neat entrance steps, crisp daylight, no text",

    ("interior", 6): "vertical 9:16 interior architect flatlay on light oak workbench showing natural wood flooring planks, limestone tile samples, brushed brass hardware and linen fabric swatches in warm daylight",
    ("interior", 7): "vertical 9:16 neatly curated modern interior design studio sample shelf holding matte porcelain slabs, natural white oak timber boards and clean eco paint chips",
    ("interior", 8): "vertical 9:16 architectural detail photography of seamless flush custom oak cabinet joinery with brushed satin brass pull handle and crisp matte plaster wall edge",
    ("interior", 9): "vertical 9:16 interior architecture photography of a newly renovated bright Seoul apartment living-dining room with pale oak wide-plank floor, recessed ceiling lights and clean plaster walls",
    ("interior", 10): "vertical 9:16 bright Scandinavian interior design office consultation corner with round oak table, bouclé chairs, warm pendant lamp and stone material library",

    ("realestate", 6): "vertical 9:16 outdoor lifestyle architecture photography of a serene lush green apartment park promenade with sunlit maple trees, clean stone path and cozy neighborhood cafe in morning sunlight",
    ("realestate", 7): "vertical 9:16 editorial tabletop photography on sunlit walnut consultation desk with neat linen folder, brass pen and modern apartment brass keys beside ceramic cup, trustworthy bright lighting",
    ("realestate", 8): "vertical 9:16 empty bright brand-new modern apartment interior bedroom with tall panoramic windows, sheer white curtains and fresh pale oak herringbone floor in morning sun",
    ("realestate", 9): "vertical 9:16 sleek bright real estate consulting boutique interior with warm oak table, large sunlit window overlooking Seoul skyline and minimalist chairs, no text",
    ("realestate", 10): "vertical 9:16 modern street-level boutique real estate studio glass storefront with warm oak interior visible through clear windows on tidy urban street, no text",

    ("shop", 5): "vertical 9:16 bright clean boutique order packing studio table with neatly folded cream knit sweaters inside crisp eco kraft shipping box and tissue paper, warm sunlight",
    ("shop", 6): "vertical 9:16 luxury aesthetic gift box packaging wrapped with matte satin taupe ribbon and dried eucalyptus sprig resting on warm limestone table, soft editorial lighting",
    ("shop", 7): "vertical 9:16 cozy lifestyle photography of plush oatmeal cashmere knitwear stack and woven leather tote resting on warm natural oak console table in soft daylight",
    ("shop", 8): "vertical 9:16 editorial boutique outfit styling flatlay of tailored cream linen blazer, striped cotton shirt, tan leather belt and tortoiseshell sunglasses on textured linen cloth",
    ("shop", 9): "vertical 9:16 sunlit minimalist Korean fashion showroom interior with slim brushed-steel garment rack, neutral garments, travertine bench and tall arched mirror",
    ("shop", 10): "vertical 9:16 chic urban boutique shopfront window display showcasing neutral minimalist coats on wooden hanger in warm golden afternoon light, no text",
}


def api_json(path: str, data=None):
    req = urllib.request.Request(
        HOST + path,
        data=json.dumps(data).encode("utf-8") if data is not None else None,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def ensure_comfyui(auto_start: bool):
    try:
        api_json("/system_stats")
        return None
    except Exception:
        if not auto_start:
            raise RuntimeError("ComfyUI is not running on 127.0.0.1:8188 (pass --auto-start)")
    log_path = COMFY_DIR / "user" / "autoreels_scene_headless.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_f = open(log_path, "w", encoding="utf-8", errors="replace")
    proc = subprocess.Popen(
        [str(PYTHON_EXE), "main.py", "--listen", "127.0.0.1", "--port", "8188"],
        cwd=str(COMFY_DIR),
        stdout=log_f,
        stderr=subprocess.STDOUT,
    )
    for _ in range(200):
        try:
            api_json("/system_stats")
            return proc
        except Exception:
            if proc.poll() is not None:
                raise RuntimeError(f"ComfyUI exited early: {proc.returncode}")
            time.sleep(1)
    proc.terminate()
    raise TimeoutError("Timed out starting ComfyUI")


def find_targets() -> list[tuple[str, int, str]]:
    targets = []
    for ind_dir in sorted(SCENES_DIR.iterdir()):
        if not ind_dir.is_dir():
            continue
        seen = {}
        for slot in range(1, 16):
            p = ind_dir / f"{slot}.jpg"
            if not p.exists():
                targets.append((ind_dir.name, slot, "missing"))
                continue
            h = hashlib.sha256(p.read_bytes()).hexdigest()[:12]
            if h in seen:
                targets.append((ind_dir.name, slot, f"dup_of_{seen[h]}"))
            else:
                seen[h] = slot
    return targets


def build_graph(prompt: str, seed: int, prefix: str) -> dict:
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG_PROMPT, "clip": ["1", 1]}},
        "4": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1344, "batch_size": 1}},
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": 8,
                "cfg": 2.0,
                "sampler_name": "dpmpp_sde",
                "scheduler": "karras",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0],
            },
        },
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["6", 0]}},
    }


def generate_slot(ind: str, slot: int, prompt: str, seed: int) -> Path:
    prefix = f"autoreels_scenes/{ind}_{slot}"
    res = api_json("/prompt", {"prompt": build_graph(prompt, seed, prefix)})
    pid = res["prompt_id"]
    for _ in range(180):
        time.sleep(1)
        hist = api_json(f"/history/{pid}")
        if pid not in hist:
            continue
        entry = hist[pid]
        if entry.get("status", {}).get("status_str") == "error":
            raise RuntimeError(f"ComfyUI error for {ind}/{slot}: {entry['status']}")
        imgs = entry.get("outputs", {}).get("7", {}).get("images", [])
        if imgs:
            info = imgs[0]
            q = urllib.parse.urlencode({"filename": info["filename"], "subfolder": info.get("subfolder", ""), "type": info.get("type", "output")})
            raw_bytes = urllib.request.urlopen(f"{HOST}/view?{q}", timeout=60).read()
            im = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
            im = im.resize((1080, 1920), Image.Resampling.LANCZOS)
            dst = SCENES_DIR / ind / f"{slot}.jpg"
            dst.parent.mkdir(parents=True, exist_ok=True)
            im.save(dst, format="JPEG", quality=86, optimize=True)
            return dst
    raise TimeoutError(f"Timed out generating {ind}/{slot}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Only print missing/duplicate targets")
    ap.add_argument("--only", default="", help="Comma-separated ind:slot overrides (e.g. beauty:6,shop:5)")
    ap.add_argument("--seed-offset", type=int, default=0)
    ap.add_argument("--auto-start", action="store_true")
    args = ap.parse_args()

    if args.only.strip():
        targets = []
        for item in args.only.split(","):
            ind, sl = item.strip().split(":", 1)
            targets.append((ind.strip(), int(sl.strip()), "manual"))
    else:
        targets = find_targets()

    print(f"Targets ({len(targets)}):")
    for ind, slot, reason in targets:
        print(f"  - {ind}/{slot}.jpg ({reason})")
    if args.dry_run or not targets:
        return 0

    proc = ensure_comfyui(args.auto_start)
    try:
        for idx, (ind, slot, _) in enumerate(targets):
            prompt = SLOT_PROMPTS.get(
                (ind, slot),
                f"vertical 9:16 editorial photography for Korean {ind} business scene {slot}, warm natural light, photorealistic, no text",
            )
            seed = 7700 + args.seed_offset + idx * 19 + slot * 7 + sum(ord(c) for c in ind)
            t0 = time.time()
            dst = generate_slot(ind, slot, prompt, seed)
            print(f"[ok] {ind}/{slot}.jpg -> {dst.stat().st_size} bytes ({time.time()-t0:.1f}s)", flush=True)
    finally:
        if proc is not None:
            proc.terminate()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
