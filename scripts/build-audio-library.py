"""오토릴스의 자체 제작 반주와 효과음을 로컬에서 생성합니다."""
import argparse
import json
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
import subprocess
import wave

import numpy as np


ROOT = Path(__file__).resolve().parents[1] / "public/assets"
RATE = 32000
GENRES = (
    ("city", "시티팝", "신나는", "네온 골목·야간 버스·청록 불빛·바닷가 도로·보랏빛 저녁·새벽 상점·라디오 산책·창가의 불빛·주말 드라이브·도시의 물결", 111, (220, 75, 135)),
    ("groove", "펑크", "신나는", "노란 신호·새 운동화·골목의 리듬·한낮의 스텝·청바지 주머니·두 번째 신호·구름 한 스푼·출근길 베이스·오렌지 소다·작은 축제", 113, (234, 139, 53)),
    ("drive", "신스웨이브", "신나는", "자정의 하이웨이·앞 유리 너머·청록 회로·붉은 수평선·형광 터널·멀리서 온 신호·푸른 가속·열린 도로·한밤중 전파·은빛 도심", 124, (100, 60, 229)),
    ("power", "트랩", "신나는", "검은 스텝·철제 계단·낮은 진동·블루 코너·빠른 결정·회색 거리·수직 상승·빛의 교차로·도시의 압력·검정과 주황", 89, (223, 77, 67)),
    ("lofi", "로파이", "잔잔", "저녁 메모·비 온 뒤 창틀·접어 둔 편지·첫 페이지·낡은 스피커·오늘의 여백·네모난 구름·빈 정류장·커튼의 무늬·책장 사이", 77, (101, 147, 134)),
    ("acoustic", "어쿠스틱", "감성", "햇살에 말린 셔츠·흰 찻잔·봄 골목·작은 화분·나무 의자·느린 자전거·창가 식탁·일요일 아침·푸른 벤치·돌아오는 길", 98, (206, 146, 92)),
    ("piano", "피아노", "감성", "늦은 오후·비의 뒷모습·노란 우산·오래된 앨범·마지막 손편지·새벽 첫차·천천히 봄·강가의 약속·조용한 발자국·구름 뒤 달빛", 83, (132, 111, 172)),
    ("ambient", "앰비언트", "잔잔", "흰 안개·푸른 숨·창으로 드는 바람·작은 파도·묽은 새벽·먼 섬·수면 아래·맑은 공기·은은한 정원·고요한 빛", 68, (65, 148, 162)),
    ("jazz", "재즈·보사노바", "고급", "커피 한 모금·플랫 화이트·잔잔한 테라스·브라운 가죽·창가 자리·찬 유리잔·바닐라 오후·골목의 테이블·한낮의 보사·밤의 카운터", 102, (160, 107, 66)),
    ("cinema", "시네마틱", "고급", "비행 전야·해가 뜨는 방향·먼 불빛·새로운 길·커다란 문·황금 시간·하늘의 끝·낮은 현·마지막 프레임·제자리의 별", 90, (102, 122, 188)),
)
EFFECTS = (
    ("transition", "전환", "공기 스윕·가벼운 휙·유리 슬라이드·빠른 리버스·섬세한 웨이브"),
    ("impact", "강조", "딥 펀치·빠른 팝·소프트 임팩트·낮은 스탬프·스냅 히트"),
    ("click", "클릭", "소프트 탭·마른 틱·버튼 팝·나무 톡·더블 클릭"),
    ("sparkle", "반짝임", "작은 벨·유리 반짝임·실버 차임·일렁이는 별·골드 차임"),
    ("camera", "카메라", "클래식 셔터·포커스 틱·스냅 셔터·필름 넘김·폴라로이드 셔터"),
    ("deal", "혜택", "코인 한 닢·가격 팝·두 음 알림·카운터 코인·할인 벨"),
    ("outro", "엔딩", "마무리 차임·부드러운 종지·아웃트로 스윕·여운 벨·따뜻한 종지"),
    ("texture", "질감", "종이 스침·천 스윕·연필 탭·브러시·작은 물방울"),
)
CHORDS = ((0, 4, 7, 11), (2, 5, 9, 12), (4, 7, 11, 14), (5, 9, 12, 16), (7, 11, 14, 17), (9, 12, 16, 19))
PROGRESSIONS = ((0, 4, 5, 3), (5, 3, 0, 4), (0, 2, 1, 4), (3, 4, 2, 5), (1, 4, 0, 5), (5, 2, 3, 1), (0, 5, 1, 4), (3, 1, 0, 4))


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def shape(t, attack, release):
    return np.clip(t / attack, 0, 1) * np.clip((len(t) / RATE - t) / release, 0, 1)


def note(t, midi, instrument):
    phase = 2 * np.pi * frequency(midi) * t
    tone = np.sin(phase)
    if instrument == "pad":
        return (tone * .6 + np.sin(phase * 1.003) * .3 + np.sin(phase * 2) * .1) * shape(t, .19, .27)
    if instrument == "bass":
        return (tone + .25 * np.sin(phase * 2)) * np.exp(-3 * t) * shape(t, .01, .06)
    overtone = np.sin(phase * 2) * .29 * np.exp(-5 * t) + np.sin(phase * 3) * .13 * np.exp(-9 * t)
    if instrument == "pluck":
        overtone += np.sin(phase * 4.003) * .18 * np.exp(-11 * t)
    return (tone + overtone) * np.exp(-2.9 * t) * shape(t, .008, .09)


def mix(target, start, signal, gain, pan=0):
    offset = round(start * RATE)
    size = min(len(signal), len(target) - offset)
    if size > 0:
        target[offset:offset + size, 0] += signal[:size] * gain * (1 - pan)
        target[offset:offset + size, 1] += signal[:size] * gain * (1 + pan)


def drum(rng, kind):
    t = np.arange(round(RATE * (.25 if kind == "kick" else .18))) / RATE
    if kind == "kick":
        return np.sin(2 * np.pi * (49 * t + 2.4 * (1 - np.exp(-31 * t)))) * np.exp(-17 * t) * shape(t, .003, .03)
    noise = np.diff(rng.normal(size=len(t) + 1)) / 3
    if kind == "clap":
        noise = noise * .55 + np.sin(2 * np.pi * 168 * t) * .35
    return noise * np.exp(-(48 if kind == "hat" else 23) * t) * shape(t, .003, .04)


def make_music(task):
    genre_index, variant = task
    key, _, _, _, tempo, _ = GENRES[genre_index]
    rng = np.random.default_rng(104729 + genre_index * 1217 + variant * 73)
    beat = 60 / (tempo + int(rng.integers(-8, 9)))
    bars = 16 if tempo > 104 else 12
    duration = bars * 4 * beat
    target = np.zeros((round(duration * RATE), 2), np.float32)
    root = int(rng.choice((45, 46, 47, 48, 50, 52)))
    progression = PROGRESSIONS[(genre_index + variant * 3) % len(PROGRESSIONS)]
    kick, clap, hat = [drum(rng, kind) for kind in ("kick", "clap", "hat")]
    quiet = key in ("piano", "ambient", "cinema")
    motif = rng.choice((0, 1, 2, 3, 4, 5, 6), size=8)
    scale = (0, 2, 4, 5, 7, 9, 11)
    rhythm = ((0, .75, 1.5, 2.5, 3.25), (.5, 1, 1.75, 2.75, 3.5), (0, 1.5, 2, 3, 3.5))
    if key == "jazz":
        rhythm = ((0, .66, 1.66, 2.66, 3.33),)
    melody_steps = rhythm[variant % len(rhythm)]
    for bar in range(bars):
        start = bar * 4 * beat
        chord = CHORDS[progression[bar % 4]]
        full = 2 <= bar < bars - 2
        for voice, pitch in enumerate(chord):
            use_pad = key in ("ambient", "cinema", "drive")
            part = "pad" if use_pad else "pluck" if key in ("acoustic", "groove") else "keys"
            steps = (0,) if use_pad else (0, 1.5, 2.5) if key in ("groove", "jazz", "lofi") else (voice * .21, 2 + voice * .19)
            for step in steps:
                length = (3.95 if use_pad else 1.36) * beat
                t = np.arange(round(length * RATE)) / RATE
                layer_gain = .045 if use_pad else .066
                mix(target, start + step * beat, note(t, root + 12 + pitch, part), layer_gain, (voice - 1.5) * .18)
        if key != "ambient":
            bass_steps = (0, 1.5, 2.5, 3.25) if key in ("groove", "drive", "city") and full else (0, 2.5) if key != "piano" else (0,)
            for step in bass_steps:
                t = np.arange(round(.9 * beat * RATE)) / RATE
                bass_pitch = chord[2] if step == 3.25 else chord[0]
                gain = .12 if key != "power" else .23
                mix(target, start + step * beat, note(t, root - 12 + bass_pitch, "bass"), gain)
        steps = melody_steps if full and key not in ("ambient", "piano") else (0, 1.75, 3)
        for index, step in enumerate(steps):
            if bar == 0 and index == len(steps) - 1 or key == "ambient" and (bar + index) % 3:
                continue
            length = ((1.25 if quiet else .62) + rng.uniform(0, .17)) * beat
            t = np.arange(round(length * RATE)) / RATE
            pitch = root + 24 + scale[motif[(index + bar % 4) % len(motif)]]
            if index == 0 or index == len(steps) - 1:
                pitch = root + 24 + chord[(bar + index) % 3]
            melody = note(t, pitch, "pad" if key == "ambient" else "pluck" if key in ("acoustic", "groove") else "keys")
            mix(target, start + step * beat, melody, .10 if quiet else .13, -.12)
            mix(target, start + (step + .48) * beat, melody, .018, .45)
        if not quiet:
            kick_steps = (0, 1, 2, 3) if key == "drive" else (0, 1.75, 2.5) if key in ("power", "groove") else (0, 2)
            for step in kick_steps:
                mix(target, start + step * beat, kick, .10 if key in ("acoustic", "jazz", "lofi") else .20)
            if full or key in ("lofi", "jazz"):
                for step in (1, 3):
                    mix(target, start + step * beat, clap, .085 if key != "power" else .16, .14)
                for step in np.arange(.5, 4, .5 if key in ("power", "drive") else 1):
                    mix(target, start + (step + (.10 if key == "jazz" else 0)) * beat, hat, .047, -.24)
        elif key == "cinema" and bar >= 4 and bar % 2 == 0:
            mix(target, start, kick, .20)
    t = np.arange(len(target)) / RATE
    target *= shape(t, .095, min(1.35, beat * 1.7))[:, None]
    rms = np.sqrt(np.mean(target ** 2))
    target *= min(.81 / np.max(np.abs(target)), .13 / rms)
    path = ROOT / "bgm/pack" / f"original-{key}-{variant + 1:02}.mp3"
    subprocess.run(
        ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(RATE), "-ac", "2", "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", "96k", str(path)],
        input=(target * 32767).astype("<i2").tobytes(), check=True,
    )


def make_effect(family_index, variant):
    family, _, _ = EFFECTS[family_index]
    durations = (.55, .34, .18, .73, .27, .58, .90, .42)
    rng = np.random.default_rng(8881 + family_index * 97 + variant)
    duration = durations[family_index] * (.8 + variant * .10)
    t = np.arange(round(RATE * duration)) / RATE
    x = t / duration
    noise = rng.normal(0, 1, size=len(t))
    high = np.diff(np.r_[noise[0], noise]) * .46
    decay = np.exp(-5.8 * x)
    pitch = (180 + 46 * variant)
    if family == "transition":
        rise = 1 if variant != 3 else -1
        phase = 2 * np.pi * (pitch * t + rise * 420 * t ** 2)
        signal = (.4 * noise + .36 * np.sin(phase)) * np.sin(np.pi * x) ** (1 + variant * .3)
    elif family == "impact":
        phase = 2 * np.pi * (43 * t + (1.5 + variant * .4) * (1 - np.exp(-38 * t)))
        signal = (np.sin(phase) + noise * .22 * np.exp(-35 * x)) * decay
    elif family in ("click", "camera"):
        signal = np.zeros_like(t)
        for offset in ((0, .37) if family == "camera" or variant == 4 else (0,)):
            age = x - offset
            tap = np.where(age >= 0, np.exp(-np.maximum(age, 0) * (29 if family == "click" else 24)), 0)
            signal += (high * (.44 if family == "camera" else .23) + np.sin(2 * np.pi * pitch * t) * .65) * tap
    elif family in ("sparkle", "deal", "outro"):
        intervals = ((0, 4, 7), (0, 7, 12), (0, 3, 10), (0, 7, 16), (0, 5, 9))[variant]
        signal = np.zeros_like(t)
        for index, semitones in enumerate(intervals):
            time = t - index * duration * (.19 if family == "outro" else .11)
            age = np.maximum(time, 0)
            tone = frequency((75 if family == "sparkle" else 64) + variant + semitones)
            phase = 2 * np.pi * tone * age
            signal += (np.sin(phase) + .32 * np.sin(phase * (2.73 if family == "deal" else 2.01))) * np.clip(age / .008, 0, 1) * np.exp(-age * (10 if family == "outro" else 16))
    else:
        brushed = np.convolve(noise, np.ones(15) / 15, mode="same")
        phase = 2 * np.pi * (pitch * t + (560 + variant * 100) * t ** 2)
        signal = (brushed * .8 + high * .25 + np.sin(phase) * (.23 if variant == 4 else .07)) * np.sin(np.pi * x) ** (variant * .24 + .7)
    signal *= shape(t, .003, .048)
    signal *= .62 / np.max(np.abs(signal))
    with wave.open(str(ROOT / "sfx" / f"sfx-{family}-{variant + 1:02}.wav"), "wb") as output:
        output.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        output.writeframes((signal * 32767).astype("<i2").tobytes())


def color(rgb, factor):
    return "#" + "".join(f"{round(value * factor):02x}" for value in rgb)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()
    (ROOT / "bgm/pack").mkdir(parents=True, exist_ok=True)
    (ROOT / "sfx").mkdir(parents=True, exist_ok=True)
    music = []
    effects = []
    for key, genre, mood, titles, _, rgb in GENRES:
        for variant, name in enumerate(titles.split("·"), 1):
            music.append({
                "id": f"original-{key}-{variant:02}", "name": name, "genre": genre,
                "mood": mood, "colors": [color(rgb, .68 + variant * .032), color(rgb, .24 + variant * .019)],
            })
    for index, (family, group, labels) in enumerate(EFFECTS):
        for variant, name in enumerate(labels.split("·")):
            make_effect(index, variant)
            effects.append({"id": f"sfx-{family}-{variant + 1:02}", "name": name, "family": family, "group": group})
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        for count, _ in enumerate(pool.map(make_music, ((g, v) for g in range(len(GENRES)) for v in range(10))), 1):
            if count % 10 == 0:
                print(f"Music {count}/{len(music)}", flush=True)
    (ROOT / "audio-library.json").write_text(json.dumps({"music": music, "effects": effects}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(music)} music tracks and {len(effects)} effects", flush=True)


if __name__ == "__main__":
    main()
