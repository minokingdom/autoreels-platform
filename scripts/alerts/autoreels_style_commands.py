"""카카오 !분석 전용 큐. 기존 Iris 원문/본인 검증을 재사용, SSH stdin으로만 작업기를 연결."""
import hashlib, json, os, re, secrets, sqlite3, sys, time
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qs, urlencode

ROOT=Path(__file__).resolve().parent/'autoreels-style'
ROOM='380705904900190'
OWNER='88899591'
HOSTS={'youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.instagram.com','instagram.com','www.tiktok.com','tiktok.com','vm.tiktok.com','vt.tiktok.com','vimeo.com','www.vimeo.com','www.pinterest.com','pinterest.com','pin.it'}

def extract_url(text):
    if not isinstance(text,str) or len(text)>5000 or not re.match(r'^!분석(?:\s|$)',text.strip()):
        raise ValueError('사용법: !분석 영상 URL')
    urls=re.findall(r'https?://[^\s<>"\u200b]+',text)
    if len(urls)!=1: raise ValueError('분석할 영상 URL 하나만 붙여 주세요.')
    u=urlsplit(urls[0].rstrip('.,!?)]}〉》”’'))
    if u.scheme!='https' or u.hostname not in HOSTS or u.username or u.password or u.port not in (None,443):
        raise ValueError('YouTube·Instagram·TikTok·Vimeo·Pinterest의 공개 영상 HTTPS 주소를 보내 주세요.')
    if u.hostname in {'youtube.com','www.youtube.com','m.youtube.com','youtu.be'}:
        vid=u.path.strip('/') if u.hostname=='youtu.be' else (u.path.split('/')[2] if u.path.startswith(('/shorts/','/embed/')) else parse_qs(u.query).get('v',[''])[0])
        if not re.fullmatch(r'[A-Za-z0-9_-]{11}',vid): raise ValueError('채널·목록 주소 대신 영상 하나의 주소를 보내 주세요.')
        return 'https://www.youtube.com/watch?'+urlencode({'v':vid})
    if u.hostname.endswith('instagram.com') and not re.match(r'^/(reel|reels|p)/[A-Za-z0-9_-]+/?$',u.path):
        raise ValueError('Instagram 게시물 또는 릴스 주소를 보내 주세요.')
    return urlunsplit(('https',u.hostname,u.path,u.query if u.hostname.endswith('tiktok.com') else '', ''))

class Queue:
    def __init__(self,root=ROOT):
        self.root=Path(root);self.root.mkdir(parents=True,exist_ok=True)
        self.file=self.root/'queue.sqlite'
        with self.db() as db:
            db.executescript('''CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,url TEXT,created REAL,status TEXT,token TEXT,claimed REAL,result TEXT);
            CREATE TABLE IF NOT EXISTS deliveries(id TEXT,kind TEXT,text TEXT,state TEXT DEFAULT 'pending',PRIMARY KEY(id,kind));
            CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT);''')
    @contextmanager
    def db(self):
        db=sqlite3.connect(self.file,timeout=10);db.row_factory=sqlite3.Row
        try:
            with db:yield db
        finally:db.close()
    def enqueue(self,eid,url,error=''):
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            if db.execute('SELECT 1 FROM jobs WHERE id=?',(eid,)).fetchone():return
            existing=db.execute("SELECT id,status FROM jobs WHERE url=? AND status IN ('queued','running','done') ORDER BY created DESC LIMIT 1",(url,)).fetchone() if url else None
            if existing:error=f"이미 접수한 영상입니다. 작업 {existing['id']} · {existing['status']}"
            if not error and db.execute("SELECT count(*) FROM jobs WHERE status IN ('queued','running')").fetchone()[0]>=3:error='분석 대기 3건이 있습니다. 완료 후 다시 보내 주세요.'
            db.execute('INSERT INTO jobs VALUES(?,?,?,?,NULL,NULL,?)',(eid,url,time.time(),'rejected' if error else 'queued',error))
            message=error or '영상 스타일 분석을 접수했습니다.\n분석 → 지원 효과 확인 → 스타일 등록 → 배포 확인 후 알려드립니다.\n분석 PC가 꺼져 있으면 연결될 때까지 대기합니다.'
            db.execute('INSERT INTO deliveries(id,kind,text) VALUES(?,?,?)',(eid,'ack',message))
    def rpc(self,data):
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE');op=data.get('op');now=time.time()
            if op=='claim':
                for row in db.execute("SELECT id FROM jobs WHERE status='running' AND claimed<?",(now-3600,)).fetchall():
                    message='분석 작업이 중단되어 확인이 필요합니다. 중복 등록 방지를 위해 자동 재실행하지 않습니다.'
                    db.execute("UPDATE jobs SET status='failed',result=? WHERE id=?",(message,row['id']))
                    db.execute("INSERT OR IGNORE INTO deliveries(id,kind,text) VALUES(?,'result',?)",(row['id'],message))
                if db.execute("SELECT 1 FROM jobs WHERE status='running'").fetchone():return None
                row=db.execute("SELECT * FROM jobs WHERE status='queued' ORDER BY created LIMIT 1").fetchone()
                if not row:return None
                token=secrets.token_hex(24)
                db.execute("UPDATE jobs SET status='running',token=?,claimed=? WHERE id=?",(token,now,row['id']))
                return {'id':row['id'],'url':row['url'],'token':token}
            if op=='complete':
                row=db.execute('SELECT * FROM jobs WHERE id=?',(str(data.get('id')),)).fetchone()
                if not row or not secrets.compare_digest(row['token'] or '',str(data.get('token',''))):raise ValueError('invalid_claim')
                if row['status']!='running':return {'accepted':False,'status':row['status']}
                message=data.get('message');status=data.get('status')
                if not isinstance(message,str) or not 1<=len(message)<=1800 or status not in ('done','failed'):raise ValueError('invalid_result')
                db.execute('UPDATE jobs SET status=?,result=? WHERE id=?',(status,message,row['id']))
                db.execute("INSERT OR IGNORE INTO deliveries(id,kind,text) VALUES(?,'result',?)",(row['id'],message))
                return {'accepted':True}
            if op=='status':return [dict(r) for r in db.execute('SELECT id,status,created,result FROM jobs ORDER BY created DESC LIMIT 5')]
            raise ValueError('invalid_operation')
    def deliver(self,verify,send):
        if not verify():return
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            row=db.execute("SELECT * FROM deliveries WHERE state='pending' ORDER BY rowid LIMIT 1").fetchone()
            if not row:return
            db.execute("UPDATE deliveries SET state='sending' WHERE id=? AND kind=?",(row['id'],row['kind']))
        try:
            send(ROOM,row['text']);state='sent'
        except Exception:state='unknown'
        with self.db() as db:db.execute('UPDATE deliveries SET state=? WHERE id=? AND kind=?',(state,row['id'],row['kind']))

class Commands:
    def __init__(self,queue,verifier,send,clock=time.time):self.queue,self.verifier,self.send,self.clock=queue,verifier,send,clock
    def handle(self,payload):
        msg=payload.get('msg')
        if not isinstance(msg,str) or not re.match(r'^!분석(?:\s|$)',msg.strip()):return False
        item=payload.get('json') or {}
        if not isinstance(item,dict) or str(item.get('chat_id'))!=ROOM or str(item.get('user_id'))!=OWNER:return True
        eid=next((str(item[k]) for k in ('log_id','chat_log_id','chatLogId','message_id','id') if re.fullmatch(r'[1-9][0-9]{0,18}',str(item.get(k,'')))),'')
        try:
            row=self.verifier.message(eid)
            if not row or str(row.get('user_id'))!=OWNER or row.get('message')!=msg or str(row.get('type')) not in ('1','26') or row.get('deleted_at') not in (None,'',0,'0') or not -5<=self.clock()-float(row['created_at'])<=120 or not self.verifier.private_room():return True
            try:url=extract_url(msg);error=''
            except (ValueError,IndexError):url='';error='영상 URL 하나를 !분석 뒤에 붙여 주세요. 공개 YouTube·Instagram·TikTok·Vimeo·Pinterest 영상을 지원합니다.'
            self.queue.enqueue(eid,url,error)
        except Exception as exc:print('[autoreels-style] receive:',type(exc).__name__,flush=True)
        return True
    def run(self):
        while True:
            try:self.queue.deliver(self.verifier.private_room,self.send)
            except Exception as exc:print('[autoreels-style] delivery:',type(exc).__name__,flush=True)
            time.sleep(2)

def from_env():
    from mobis_agent import AgentCommands,post
    def send(room,text):
        result=post('reply',{'type':'text','room':room,'data':text})
        if not isinstance(result,dict) or result.get('success') is False or result.get('status') is False:raise ValueError('send_rejected')
    return Commands(Queue(),AgentCommands(None),send)

if __name__=='__main__':
    raw=sys.stdin.read(8001)
    if len(raw)>8000:raise ValueError('request_too_large')
    print(json.dumps(Queue().rpc(json.loads(raw)),ensure_ascii=False))
