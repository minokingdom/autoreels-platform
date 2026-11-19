import json
import pathlib
import re
import urllib.request

url = 'https://www.youtube.com/watch?v=Iit7ZaSLRTw'
status = 'UNKNOWN'
try:
    with urllib.request.urlopen(url, timeout=12) as response:
        html = response.read(6_000_000).decode('utf-8', errors='replace')
    player = re.search(r'(?:var )?ytInitialPlayerResponse\s*=\s*', html)
    if player:
        response, _ = json.JSONDecoder().raw_decode(html[player.end():])
        status = response.get('playabilityStatus', {}).get('status', 'UNKNOWN')
except (OSError, ValueError):
    pass
print('YouTube public playback:', status)
pathlib.Path('Tests/PublicPlayback.json').write_text(json.dumps({'status': status}))
