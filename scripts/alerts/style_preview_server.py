"""승인 비교 영상만 읽는 루프백 서비스. 업로드/승인/실행 API 없음."""
import hashlib,html,json,re,sqlite3,threading,time
from contextlib import closing
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit,parse_qs

ROOT=Path(__file__).resolve().parent/'autoreels-style'
class PreviewHandler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass  # capability URL을 로그에 남기지 않음
    def send_error(self,code,message=None,explain=None):
        # 410은 기본적으로 캐시될 수 있으므로 오류에도 성공 응답과 같은 no-store 적용.
        title={404:'비교 링크를 확인해 주세요.',409:'비교 영상이 갱신되었습니다. 링크를 다시 열어 주세요.',410:'비교 링크의 유효기간이 끝났습니다. 새 안내를 요청해 주세요.',416:'영상 재생 위치를 다시 선택해 주세요.',503:'잠시 후 다시 열어 주세요.'}.get(code,'비교 영상을 열지 못했습니다.')
        body=f'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>비교 영상 안내</title><h1>{title}</h1><p>오류 {code}</p></html>'.encode()
        self.respond_headers(code,'text/html; charset=utf-8',len(body))
        if self.command!='HEAD':self.wfile.write(body)
    def do_HEAD(self):self.serve(head=True)
    def do_GET(self):self.serve()
    def serve(self,head=False):
        self.connection.settimeout(15)
        route=urlsplit(self.path).path
        if route.startswith('/styles/'):route=route[len('/styles'):]
        if route=='/health':
            self.send_response(200);self.send_header('Content-Length','2');self.end_headers()
            if not head:self.wfile.write(b'ok')
            return
        match=re.fullmatch(r'/(review|media)/([a-f0-9]{48})',route)
        if not match:self.send_error(404);return
        try:
            with closing(sqlite3.connect('file:'+str(ROOT/'queue.sqlite')+'?mode=ro',uri=True,timeout=2)) as db:
                db.row_factory=sqlite3.Row
                # 입구 링크는 작업에 고정하고 페이지를 열 때 최신 비교본을 선택합니다.
                row=db.execute('SELECT l.id,p.revision,l.expires,p.manifest FROM preview_links l JOIN proposals p ON l.id=p.id WHERE l.token=?',(match[2],)).fetchone()
            if not row or row['expires']<=time.time():self.send_error(410);return
            if match[1]=='media':
                # 열린 화면의 승인 코드와 영상이 도중에 서로 다른 버전이 되면 안 됩니다.
                version=parse_qs(urlsplit(self.path).query).get('v',[])
                if version!=[row['revision']]:self.send_error(409,'Comparison changed; reopen the review link');return
            file=ROOT/'previews'/f"{row['id']}-{row['revision']}.mp4"
            manifest=json.loads(row['manifest'])
            if not file.is_file() or not 1000<=file.stat().st_size<=20_000_000 or hashlib.sha256(file.read_bytes()).hexdigest()!=manifest['videoSha256']:self.send_error(409);return
            if match[1]=='review':
                name=html.escape(str(manifest.get('name') or '스타일 비교'))
                body=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{name} · AutoReels 비교</title><style>body{{margin:0;background:#111820;color:#f5f7fb;font:16px system-ui,sans-serif}}main{{max-width:960px;margin:auto;padding:20px}}h1{{font-size:23px;margin:8px 0}}p{{color:#b9c3d0;line-height:1.6}}video{{display:block;width:100%;max-height:76vh;background:#000;border-radius:12px}}code{{display:inline-block;padding:12px;background:#233042;border-radius:8px;color:#fff}}small{{display:block;margin-top:20px;color:#b9c3d0}}</style><main><h1>{name}</h1><p>왼쪽 원본 · 오른쪽 구현본<br>비교 버전: {row['revision'][:10]} · 아직 등록하지 않았습니다.</p><video controls playsinline preload="metadata" src="../media/{match[2]}?v={row['revision']}"></video><p>영상을 확인한 뒤 모비스테스트방에서 아래 명령을 보내 주세요.<br>이 코드는 지금 표시된 영상만 승인합니다. 새 비교본이 나오면 다시 열어 확인해 주세요.</p><code>!스타일승인 {row['revision'][:10]}</code><small>기존 링크도 다시 열면 최신 비교본이 표시됩니다. 마지막 비교본 안내부터 7일간 유효합니다. 승인 권한은 본인 카카오 계정에만 있습니다.</small></main></html>'''.encode()
                self.respond_headers(200,'text/html; charset=utf-8',len(body))
                if not head:self.wfile.write(body)
                return
            size=file.stat().st_size;start=0;end=size-1;status=200
            value=self.headers.get('Range')
            if value:
                m=re.fullmatch(r'bytes=(\d+)-(\d*)',value)
                if not m:self.send_error(416);return
                start=int(m[1]);end=min(size-1,int(m[2]) if m[2] else size-1)
                if start>end or start>=size:self.send_error(416);return
                status=206
            extra={'Accept-Ranges':'bytes','Content-Disposition':'inline; filename="style-comparison.mp4"'}
            if status==206:extra['Content-Range']=f'bytes {start}-{end}/{size}'
            self.respond_headers(status,'video/mp4',end-start+1,extra)
            if not head:
                with file.open('rb') as source:
                    source.seek(start);remaining=end-start+1
                    while remaining:
                        chunk=source.read(min(65536,remaining));self.wfile.write(chunk);remaining-=len(chunk)
        except (BrokenPipeError,ConnectionResetError,TimeoutError):return
        except Exception:self.send_error(503)
    def respond_headers(self,status,kind,size,extra=None):
        self.send_response(status);self.send_header('Content-Type',kind);self.send_header('Content-Length',str(size))
        for k,v in {'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; media-src 'self'; base-uri 'none'; frame-ancestors 'none'",**(extra or {})}.items():self.send_header(k,v)
        self.end_headers()

class Server(ThreadingHTTPServer):
    daemon_threads=True
    slots=threading.BoundedSemaphore(8)
    def process_request(self,request,address):
        if not self.slots.acquire(blocking=False):self.shutdown_request(request);return
        try:super().process_request(request,address)
        except Exception:self.slots.release();raise
    def process_request_thread(self,request,address):
        try:super().process_request_thread(request,address)
        finally:self.slots.release()

if __name__=='__main__':Server(('127.0.0.1',8791),PreviewHandler).serve_forever()
