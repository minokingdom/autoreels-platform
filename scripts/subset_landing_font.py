#!/usr/bin/env python3
"""랜딩 제목용 마루부리를 랜딩에 실제로 쓰는 글자만 남겨 가볍게 만듭니다.

랜딩 문구(public/index.html, public/assets/landing/landing.js)를 바꾼 뒤 다시 실행하세요.
원본 글꼴은 네이버 한글한글 아름답게(무료, 상업적 사용 가능)에서 받습니다.
  python3 scripts/subset_landing_font.py
필요: pip install fonttools brotli
"""
import pathlib, subprocess, sys, urllib.request, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = 'https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-{w}.woff2'
OUT = {'SemiBold': 'maruburi-sb.woff2', 'Regular': 'maruburi-r.woff2'}

text = ''
for f in ['public/index.html', 'public/assets/landing/landing.js']:
    text += (ROOT / f).read_text(encoding='utf-8')
chars = sorted(set(c for c in text if ord(c) >= 32))
# 기본 영문·숫자·문장부호는 항상 넣음
chars = ''.join(sorted(set(chars) | set(chr(i) for i in range(32, 127)) | set('·‘’“”…—–')))

outdir = ROOT / 'public/assets/landing/fonts'
outdir.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    for weight, name in OUT.items():
        src = pathlib.Path(tmp) / f'{weight}.woff2'
        urllib.request.urlretrieve(SRC.format(w=weight), src)
        txt = pathlib.Path(tmp) / 'chars.txt'
        txt.write_text(chars, encoding='utf-8')
        subprocess.run([sys.executable, '-m', 'fontTools.subset', str(src), f'--text-file={txt}',
                        '--flavor=woff2', '--layout-features=*', f'--output-file={outdir / name}'], check=True)
        print(name, (outdir / name).stat().st_size, 'bytes')
