"""Measure brief full-frame flashes. Sample time is relative to the source video."""
import statistics
import subprocess

FPS = 30
SIZE = 16 * 16


def flash_events(data):
    frames = [data[i:i + SIZE] for i in range(0, len(data) - SIZE + 1, SIZE)]
    levels = [statistics.mean(frame) for frame in frames]
    events = []
    i = 2
    while i < len(frames) - 2:
        base = frames[i - 1]
        level = levels[i - 1]
        if levels[i] - level < 28:
            i += 1
            continue
        end = i + 1
        while end < min(i + 14, len(frames)) and levels[end] > level + 18:
            end += 1
        if end < len(frames) and 2 <= end - i <= 12:
            peak = max(range(i, end), key=levels.__getitem__)
            recovery = statistics.mean(abs(a-b) for a,b in zip(base, frames[end]))
            coverage = sum(b-a > 30 for a,b in zip(base, frames[peak])) / SIZE
            if recovery < 18 and coverage > .72:
                strength = min(1, (levels[peak] - level) / max(1, 255 - level))
                events.append({'kind':'flash','start':round(i/FPS,3),
                               'duration':round((end-i)/FPS,3),'strength':round(strength,2)})
                i = end
                continue
        i += 1
    return events


def measure_flashes(video):
    raw = subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(video),'-t','180',
                          '-an','-vf','fps=30,scale=16:16:flags=area,format=gray',
                          '-pix_fmt','gray','-f','rawvideo','pipe:1'],
                         capture_output=True, check=True, timeout=120).stdout
    return flash_events(raw)


def flash_recipe(events):
    if not events:
        return []
    typical = sorted(events,key=lambda event:event['duration'])[len(events)//2]
    return [{key:typical[key] for key in ('kind','duration','strength')}]
