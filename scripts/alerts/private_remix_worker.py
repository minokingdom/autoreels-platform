"""개인 참고 영상의 컷 시각·색상·문구 위치만 돌려줍니다."""
import json
import os
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import re

import cv2
import numpy as np
from rea_video.media import video_info
from rea_video.shots import build_track, detect_shots
from private_remix_content import extract_content, rewrite
from style_worker import CAPCUT_HOSTS, capcut_media_url, download, download_capcut_preview

API = 'https://autoreelsmaker.kr/api/account?action=remix-worker'
WORKER_TOKEN = os.environ.pop('AR_PRIVATE_REMIX_TOKEN','')


def download_private(url, directory):
    if urlsplit(url).hostname not in CAPCUT_HOSTS:
        return download(url, directory, private=True)

    class PageRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            parsed = urlsplit(newurl)
            if (parsed.scheme != 'https' or parsed.hostname not in CAPCUT_HOSTS or parsed.username
                    or parsed.password or parsed.port not in (None, 443)):
                raise ValueError('CapCut 템플릿 이동 주소가 올바르지 않습니다.')
            return super().redirect_request(req, fp, code, msg, headers, newurl)

    class Preview(HTMLParser):
        media = None
        title = ""

        def handle_starttag(self, tag, attrs):
            a = dict(attrs)
            if tag == 'meta' and a.get('property') == 'og:title':
                self.title = a.get('content') or ''
            if tag == 'meta' and a.get('property') in ('og:video:url', 'og:video:secure_url'):
                self.media = capcut_media_url(a.get('content') or '')

    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.build_opener(PageRedirect()).open(request, timeout=20) as response:
        match = re.search(r'/template-detail/(?:[^/]+/)?(\d{10,24})/?$', urlsplit(response.url).path)
        if not match:
            raise ValueError('CapCut 템플릿을 확인하지 못했습니다.')
        parser = Preview()
        parser.feed(response.read(4_000_000).decode('utf-8', errors='replace'))
    meta = {'webpage_url': 'https://www.capcut.com/template-detail/'+match[1],
            'formats': [{'protocol': 'https', 'url': parser.media}]}
    return download_capcut_preview(meta, directory)[0], parser.title


def analyse_private(video):
    container = 'mov' if video.suffix.lower() in ('.mp4', '.mov') else 'matroska'
    source = ['-protocol_whitelist', 'file', '-f', container, '-i', str(video)]
    info = subprocess.run(['ffprobe', '-v', 'error', *source, '-show_entries', 'format=duration',
                           '-of', 'json'], capture_output=True, check=True, timeout=20)
    seconds = float(json.loads(info.stdout)['format']['duration'])
    if not 1 <= seconds <= 90.05:
        raise ValueError('1초 이상 90초 이하의 영상이 필요합니다.')
    raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', *source, '-map', '0:v:0',
                          '-an', '-t', '90', '-vf', 'fps=4,scale=48:64', '-pix_fmt', 'rgb24',
                          '-f', 'rawvideo', 'pipe:1'], capture_output=True, check=True, timeout=90)
    frames = np.frombuffer(raw.stdout, np.uint8).reshape(-1, 64, 48, 3)
    if not len(frames):
        raise ValueError('영상 프레임이 없습니다.')
    end = min(2700, round(seconds * 30))
    # 외부 입력은 길이·화면 크기·프레임률을 제한한 로컬 영상으로 만든 뒤 기존 rea-video 컷 분석기에 넘깁니다.
    proxy = video.with_name('analysis-proxy.mp4')
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *source, '-map', '0:v:0',
                    '-an', '-t', '90', '-vf', 'fps=30,scale=240:320:force_original_aspect_ratio=decrease:force_divisible_by=2',
                    '-c:v', 'libx264', '-preset', 'ultrafast', str(proxy)], check=True, capture_output=True, timeout=90)
    shots = detect_shots(build_track(str(proxy), video_info(proxy)))
    candidates = sorted(shots[1:], key=lambda shot: shot.boundary_score, reverse=True)
    boundaries = [0, end]
    for shot in candidates:
        at = round(shot.start * 30)
        if 0 < at < end and at not in boundaries:
            boundaries.append(at)
        if len(boundaries) >= 11:
            break
    boundaries.sort()
    scenes = []
    for start, stop in zip(boundaries, boundaries[1:]):
        frame = frames[min(len(frames)-1, int((start+stop)/2*4/30))]
        # 채도가 있는 픽셀 중 가장 많이 쓰인 색을 포인트로 쓰고 복잡도가 낮은 쪽에 문구를 둡니다.
        hsv = cv2.cvtColor(frame, cv2.COLOR_RGB2HSV)
        colors = frame[(hsv[:, :, 1] > 50) & (hsv[:, :, 2] > 48)]
        if not len(colors):
            colors = frame.reshape(-1, 3)
        quantized = (colors.astype(np.uint16) // 32) @ np.array([64, 8, 1])
        bucket = int(np.bincount(quantized.astype(int)).argmax())
        rgb = np.median(colors[quantized == bucket], axis=0).astype(int)
        edge = cv2.Canny(cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY), 60, 140)
        position = 'top' if edge[:22].mean()+4 < edge[-22:].mean() else 'bottom'
        scenes.append({'start': start, 'end': stop, 'accent': '#%02x%02x%02x' % tuple(rgb),
                       'position': position})
    return scenes


def rpc(payload):
    req = urllib.request.Request(API, data=json.dumps(payload).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer '+WORKER_TOKEN})
    # 인증 헤더를 다른 주소로 전달하지 않습니다.
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args):
            return None
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=20) as response:
        return json.load(response)


def run_job(job):
    result = {'op': 'complete', 'id': job['id'], 'lease': job['lease']}
    try:
        with tempfile.TemporaryDirectory(prefix='ar-private-remix-') as directory:
            work = Path(directory)
            if job.get('source_id'):
                result['draft'] = rewrite(job['context'], job['scenes'], job['requested_change'], work)
            else:
                video,title = download_private(job['url'],work)
                result['scenes'] = analyse_private(video)
                result['context'] = extract_content(video,result['scenes'],title)
    except Exception as exc:
        print('analysis failed:', type(exc).__name__, flush=True)
        result['failed'] = True
    return result


def main():
    import ctypes
    import msvcrt
    supervisor = int(os.environ.get('AR_PRIVATE_REMIX_SUPERVISOR','0'))
    kernel = ctypes.windll.kernel32
    kernel.OpenProcess.restype = ctypes.c_void_p
    kernel.WaitForSingleObject.argtypes = [ctypes.c_void_p, ctypes.c_uint32]
    parent = kernel.OpenProcess(0x00100000,False,supervisor) if supervisor else None
    def active():
        return not supervisor or (parent and kernel.WaitForSingleObject(parent,0)==258)
    lock = open(Path(__file__).with_name('private-remix.lock'),'a+b')
    lock.seek(0)
    if not lock.read(1):
        lock.write(b'1');lock.flush()
    while active():
        try:
            lock.seek(0);msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
            break
        except OSError:
            time.sleep(2)
    else:
        return
    pending = None
    while active() or pending:
        try:
            if pending:
                rpc(pending)
                pending = None
            if not active():
                break
            job = rpc({'op': 'claim'}).get('job')
            if job:
                pending = run_job(job)
                continue
        except Exception as exc:
            print('private remix:', type(exc).__name__, flush=True)
        time.sleep(30)


if __name__ == '__main__':
    main()
