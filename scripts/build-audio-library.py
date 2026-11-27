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
    ("house", "하우스", "신나는", "플로어 오픈·유리 블록·스텝 온·레몬 스트로브·풀사이드 킥·프리즘 룸·밤의 체크인·미러 타일·돌아가는 조명·애프터 아워", 123, (91, 120, 228)),
    ("twostep", "투스텝", "신나는", "엇박 산책·주머니 속 차표·두 칸 점프·빗길 셔플·코너 스텝·마지막 환승·사이드 도어·물웅덩이 점프·한 박자 뒤·다음 승강장", 132, (67, 174, 157)),
    ("breakbeat", "브레이크비트", "신나는", "오프로드·급커브·커브의 안쪽·체커 플래그·바퀴 자국·킥플립·콘크리트 파크·터널 출구·더블 테이크·언더패스", 137, (220, 102, 65)),
    ("afrogroove", "아프로 그루브", "신나는", "라임 마켓·그늘 아래·모래 위 스텝·야자수 골목·망고 바스켓·붉은 흙길·노을의 안뜰·바람 부는 항구·열대 정류장·햇빛 조각", 105, (218, 166, 63)),
    ("boombap", "붐뱁", "신나는", "바늘을 내려·벽돌 골목·백 포켓·레코드 가게·낮은 천장·농구장 입구·지하 연습실·그루브 노트·낡은 헤드폰·마지막 크레이트", 91, (159, 104, 173)),
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
    if key in BEAT_GRIDS:
        return make_beat_music(task)
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
    write_music(path, target)


def write_music(path, target):
    subprocess.run(
        ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(RATE), "-ac", "2", "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", "96k", str(path)],
        input=(target * 32767).astype("<i2").tobytes(), check=True,
    )

# 한 마디를 16칸으로 나눈 킥·스네어·베이스·코드·퍼커션 패턴과 스윙 비율
BEAT_GRIDS = {
    "house": ((0, 4, 8, 12), (4, 12), (2, 6, 10, 14), (2, 6, 10, 14), (2, 6, 10, 14), .02),
    "twostep": ((0, 7, 10), (4, 12), (0, 3, 7, 10, 14), (1, 7, 13), (2, 5, 9, 14), .19),
    "breakbeat": ((0, 6, 9, 14), (4, 10, 12), (0, 6, 9, 15), (0, 6, 11), (2, 5, 7, 13), .04),
    "afrogroove": ((0, 7, 12), (6, 14), (0, 3, 8, 12), (3, 6, 10), (0, 3, 6, 10, 12), .07),
    "boombap": ((0, 3, 10), (4, 12), (0, 7, 10), (0, 7, 14), (2, 6, 10, 15), .24),
}


def beat_bpm(tempo, variant):
    return tempo + (-6, 1, -2, 4, -4, 6, 2, -1, 5, 0)[variant]


def make_beat_music(task):
    from PIL import Image, ImageDraw

    genre_index, variant = task
    key, _, _, _, tempo, rgb = GENRES[genre_index]
    kicks, snares, bass, stabs, percussion, swing = BEAT_GRIDS[key]
    bpm = beat_bpm(tempo, variant)
    beat = 60 / bpm
    rng = np.random.default_rng(81319 + 379 * genre_index + variant)
    target = np.zeros((round(64 * beat * RATE), 2), np.float32)
    root = int(rng.choice((43, 45, 47, 48, 50, 52)))
    progression = PROGRESSIONS[(genre_index + 3 * variant) % len(PROGRESSIONS)]
    kick, clap, hat = [drum(rng, kind) for kind in ("kick", "clap", "hat")]
    motif = rng.integers(0, 4, size=6)
    time = np.arange(round(.19 * RATE)) / RATE
    rim = np.sin(2 * np.pi * (rng.uniform(270, 420) * time + .8 * (1 - np.exp(-50 * time)))) * np.exp(-31 * time) * shape(time, .002, .02)
    hat_grid = tuple(range(0, 16, 2))
    for bar in range(16):
        chord = CHORDS[progression[bar % 4]]
        def at(step):
            return (bar * 4 + (step + (swing if step % 2 else 0)) / 4) * beat

        # 여덟째 마디 끝을 비운 뒤 후반 첫 박에 베이스와 킥이 함께 돌아온다.
        limit = 12 if bar == 7 else 16
        kick_steps = kicks + ((15,) if bar % 4 == 3 and 15 not in kicks else ())
        for step in kick_steps:
            if step < limit:
                mix(target, at(step), kick, .45 if step % 4 == 0 else .36)
        for step in snares:
            if step < limit:
                mix(target, at(step), clap, .23, .07)
        if bar % 4 == 3:
            for step in (13, 15):
                mix(target, at(step), clap, .08 + .025 * (step - 13), -.13)
        for step in hat_grid:
            if step < limit:
                mix(target, at(step), hat, .102 if step % 4 == 2 else .052, -.28)
        for i, step in enumerate(percussion):
            if step < limit:
                mix(target, at(step), rim, .10 if i % 2 else .075, .37)
        for i, step in enumerate(bass):
            if step >= limit:
                continue
            length = min(.85, ((bass[i+1] if i+1 < len(bass) else 16) - step) / 4) * beat
            t = np.arange(round(length * RATE)) / RATE
            pitch = chord[2] if i == len(bass)-1 and bar % 2 else chord[0]
            mix(target, at(step), note(t, root - 12 + pitch, "bass"), .27)
        for i, step in enumerate(stabs):
            if step >= limit:
                continue
            t = np.arange(round((.62 if key == "boombap" else .34) * beat * RATE)) / RATE
            for voice, pitch in enumerate(chord):
                mix(target, at(step), note(t, root + 12 + pitch, "keys"), .055, (voice - 1.5) * .24)
        for i, step in enumerate(((1, 6, 11, 14), (2, 7, 10), (0, 5, 9, 15))[variant % 3]):
            if step >= limit or (bar % 4 == 0 and i % 2):
                continue
            phrase = (i + bar % 4 + (2 if bar >= 8 else 0)) % len(motif)
            t = np.arange(round(.58 * beat * RATE)) / RATE
            lead = note(t, root + 24 + chord[motif[phrase]], "pluck")
            mix(target, at(step), lead, .122, -.12)
            mix(target, at(step) + beat * .375, lead, .024, .46)

    target *= shape(np.arange(len(target)) / RATE, .004, .045)[:, None]
    target *= min(.87 / np.max(np.abs(target)), .135 / np.sqrt(np.mean(target ** 2)))
    stem = ROOT / "bgm/pack" / f"original-{key}-{variant+1:02}"
    write_music(stem.with_suffix(".mp3"), target)

    # 표지에는 각 곡의 실제 드럼 패턴과 멜로디를 찍는다.
    cover = Image.new("RGB", (240, 240), color(rgb, .22))
    draw = ImageDraw.Draw(cover)
    for row, steps in enumerate((kicks, snares, bass, stabs, percussion)):
        for step in range(16):
            x, y = 17 + step * 13, 45 + row * 29
            draw.rounded_rectangle((x, y, x+9, y+17), radius=3,
                                   fill=color(rgb, 1 if step in steps else .32))
    for i, degree in enumerate(motif):
        x, y = 18 + i * 34, 211 - int(degree) * 4
        draw.line((x, y, x+24, y), fill=(240, 234, 220), width=3)
    cover.save(stem.with_suffix(".jpg"), quality=88)



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
    parser.add_argument("--beats-only", action="store_true", help="새 비트 음원과 표지만 생성")
    args = parser.parse_args()
    (ROOT / "bgm/pack").mkdir(parents=True, exist_ok=True)
    (ROOT / "sfx").mkdir(parents=True, exist_ok=True)
    music = []
    effects = []
    for key, genre, mood, titles, tempo, rgb in GENRES:
        for variant, name in enumerate(titles.split("·"), 1):
            music.append({
                "id": f"original-{key}-{variant:02}", "name": name, "genre": genre,
                "mood": mood, "colors": [color(rgb, .68 + variant * .032), color(rgb, .24 + variant * .019)],
            })
            if key in BEAT_GRIDS:
                music[-1]["bpm"] = beat_bpm(tempo, variant - 1)
    for index, (family, group, labels) in enumerate(EFFECTS):
        for variant, name in enumerate(labels.split("·")):
            if not args.beats_only:
                make_effect(index, variant)
            effects.append({"id": f"sfx-{family}-{variant + 1:02}", "name": name, "family": family, "group": group})
    tasks = [(g, v) for g, genre in enumerate(GENRES) if not args.beats_only or genre[0] in BEAT_GRIDS
             for v in range(len(genre[3].split("·")))]
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        for count, _ in enumerate(pool.map(make_music, tasks), 1):
            if count % 10 == 0:
                print(f"Music {count}/{len(tasks)}", flush=True)
    (ROOT / "audio-library.json").write_text(json.dumps({"music": music, "effects": effects}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(music)} music tracks and {len(effects)} effects", flush=True)


if __name__ == "__main__":
    main()
