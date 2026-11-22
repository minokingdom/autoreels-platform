"""카카오 !분석 전용 큐. 기존 Iris 원문/본인 검증을 재사용, SSH stdin으로만 작업기를 연결."""
import base64, hashlib, json, os, re, secrets, sqlite3, sys, time
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qs, urlencode

ROOT=Path(__file__).resolve().parent/'autoreels-style'
ROOM='380705904900190'
OWNER='88899591'
CAPCUT_HOSTS={'capcut.com','www.capcut.com'}
CAPCUT_DETAIL=r'/template-detail/(?:[A-Za-z0-9%_~-]+/)?([0-9]{10,24})/?'
FACEBOOK_HOSTS={'www.facebook.com','facebook.com','m.facebook.com','web.facebook.com','fb.watch'}
HOSTS=CAPCUT_HOSTS | FACEBOOK_HOSTS | {'youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.instagram.com','instagram.com','www.tiktok.com','tiktok.com','vm.tiktok.com','vt.tiktok.com','vimeo.com','www.vimeo.com','www.pinterest.com','pinterest.com','pin.it'}

def facebook_url(value):
    u=urlsplit(value)
    if u.scheme!='https' or u.hostname not in FACEBOOK_HOSTS or u.username is not None or u.password is not None or u.port not in (None,443):
        raise ValueError('Facebook 공식 영상 링크를 확인해 주세요.')
    if u.hostname=='fb.watch':
        if re.fullmatch(r'/[A-Za-z0-9_-]{3,80}/?',u.path):
            return 'https://fb.watch/'+u.path.strip('/')+'/'
    else:
        share=re.fullmatch(r'/share/([rv])/([A-Za-z0-9_-]{3,80})/?',u.path)
        if share:
            return f'https://www.facebook.com/share/{share[1]}/{share[2]}/'
        video=re.fullmatch(r'/(?:reels?|(?:[\w.-]+/)?videos(?:/[^/]+)?)/([0-9]{1,24})/?',u.path)
        vid=video[1] if video else ''
        if u.path.rstrip('/') in ('/watch','/video.php','/video/video.php'):
            vid=parse_qs(u.query).get('v',[''])[0]
        if re.fullmatch(r'[0-9]{1,24}',vid):
            return 'https://www.facebook.com/watch/?v='+vid
    raise ValueError('Facebook 릴스 또는 동영상 하나의 공유 링크를 보내 주세요.')

def extract_url(text):
    if not isinstance(text,str) or len(text)>5000 or not re.match(r'^!분석(?:\s|$)',text.strip()):
        raise ValueError('사용법: !분석 영상 URL')
    urls=re.findall(r'https?://[^\s<>"\u200b]+',text)
    if len(urls)!=1: raise ValueError('분석할 영상 URL 하나만 붙여 주세요.')
    u=urlsplit(urls[0].rstrip('.,!?)]}〉》”’'))
    if u.scheme!='https' or u.hostname not in HOSTS or u.username or u.password or u.port not in (None,443):
        raise ValueError('공개 Facebook·YouTube·Instagram·TikTok·Vimeo·Pinterest 영상 또는 CapCut 템플릿 URL을 보내 주세요.')
    if u.hostname in FACEBOOK_HOSTS:
        return facebook_url(u.geturl())
    if u.hostname in CAPCUT_HOSTS:
        detail=re.fullmatch(CAPCUT_DETAIL,u.path)
        if detail:
            return 'https://www.capcut.com/template-detail/'+detail[1]
        share=re.fullmatch(r'/tv2/([A-Za-z0-9]{5,40})/?',u.path)
        if share:
            return 'https://www.capcut.com/tv2/'+share[1]+'/'
        raise ValueError('CapCut 템플릿의 공유 또는 상세 링크를 보내 주세요.')
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
            CREATE TABLE IF NOT EXISTS deliveries_v2(id TEXT,kind TEXT,text TEXT,state TEXT DEFAULT 'pending',PRIMARY KEY(id,kind));
            CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT);''')
            db.execute('CREATE TABLE IF NOT EXISTS proposals(id TEXT PRIMARY KEY,revision TEXT NOT NULL,code TEXT UNIQUE NOT NULL,manifest TEXT NOT NULL,approved_by TEXT,approved_message TEXT,approved_at REAL)')
            db.execute('CREATE TABLE IF NOT EXISTS commands(id TEXT PRIMARY KEY,created REAL)')
            db.execute('CREATE TABLE IF NOT EXISTS preview_links(id TEXT,revision TEXT,token TEXT UNIQUE,expires REAL,PRIMARY KEY(id,revision))')
            if 'phase' not in [r['name'] for r in db.execute('PRAGMA table_info(jobs)')]:
                db.execute("ALTER TABLE jobs ADD COLUMN phase TEXT DEFAULT 'analyse'")
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
            existing=db.execute("SELECT id,status FROM jobs WHERE url=? AND status NOT IN ('rejected','failed','held') ORDER BY created DESC LIMIT 1",(url,)).fetchone() if url else None
            if existing:error=f"이미 접수한 영상입니다. 작업 {existing['id']} · {existing['status']}"
            if not error and db.execute("SELECT count(*) FROM jobs WHERE status IN ('queued','running','development','awaiting_approval','approved')").fetchone()[0]>=3:error='진행·승인 대기 3건이 있습니다. 기존 작업 승인 또는 보류 후 다시 보내 주세요.'
            db.execute('INSERT INTO jobs(id,url,created,status,token,claimed,result) VALUES(?,?,?,?,NULL,NULL,?)',(eid,url,time.time(),'rejected' if error else 'queued',error))
            message=error or '영상 스타일 작업을 접수했습니다.\n분석 → 필요한 효과 구현·테스트 → 원본 비교 영상 → 승인 후 등록\n승인 전에는 운영 스타일을 바꾸지 않습니다.'
            db.execute('INSERT INTO deliveries_v2(id,kind,text) VALUES(?,?,?)',(eid,'ack',message))
    def rpc(self,data):
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE');op=data.get('op');now=time.time()
            if op=='review_delivery':
                row=db.execute("SELECT j.id,p.revision,j.result FROM jobs j JOIN proposals p ON j.id=p.id WHERE j.id=? AND j.status='awaiting_approval'",(str(data.get('id')),)).fetchone()
                if not row:raise ValueError('review_not_waiting')
                # 구버전 보조 작업기는 deliveries만 읽습니다. 새 형식은 별도 발송함에만 기록.
                self.queue_preview(db,row['id'],row['revision'])
                return {'accepted':True}
            if op=='resume_development':
                # SSH 운영 채널 전용. 과거 결과는 보존하고 사용자가 지정한 실패 건만 개발 단계로 전환.
                eid=str(data.get('id',''))
                row=db.execute('SELECT * FROM jobs WHERE id=?',(eid,)).fetchone()
                if not row or row['status'] not in ('failed','held','awaiting_approval') or data.get('reason')!='owner_requested_development':raise ValueError('resume_not_allowed')
                db.execute('INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)',('resume:'+eid+':'+str(now),json.dumps({'previousStatus':row['status'],'previousResult':row['result'],'at':now})))
                db.execute("UPDATE jobs SET status='development' WHERE id=?",(eid,))
                return {'accepted':True,'id':eid}
            if op=='claim':
                for row in db.execute("SELECT id FROM jobs WHERE status='running' AND claimed<?",(now-3600,)).fetchall():
                    message='분석 작업이 중단되어 확인이 필요합니다. 중복 등록 방지를 위해 자동 재실행하지 않습니다.'
                    db.execute("UPDATE jobs SET status='failed',result=? WHERE id=?",(message,row['id']))
                    db.execute("INSERT OR IGNORE INTO deliveries_v2(id,kind,text) VALUES(?,'result',?)",(row['id'],message))
                if db.execute("SELECT 1 FROM jobs WHERE status='running'").fetchone():return None
                row=db.execute("SELECT * FROM jobs WHERE status IN ('queued','development','approved') ORDER BY created LIMIT 1").fetchone()
                if not row:return None
                token=secrets.token_hex(24)
                phase='publish' if row['status']=='approved' else 'develop' if row['status']=='development' else 'analyse'
                db.execute("UPDATE jobs SET status='running',phase=?,token=?,claimed=? WHERE id=?",(phase,token,now,row['id']))
                result={'id':row['id'],'url':row['url'],'token':token,'phase':phase}
                if phase=='publish':
                    proposal=db.execute('SELECT * FROM proposals WHERE id=?',(row['id'],)).fetchone()
                    if not proposal or not proposal['approved_message']:raise ValueError('approval_missing')
                    result['proposal']=dict(proposal)
                return result
            if op=='propose':
                row=db.execute('SELECT * FROM jobs WHERE id=?',(str(data.get('id')),)).fetchone()
                if not row or not secrets.compare_digest(row['token'] or '',str(data.get('token',''))):raise ValueError('invalid_claim')
                manifest=data.get('manifest');revision=data.get('revision','')
                encoded=json.dumps(manifest,ensure_ascii=False,sort_keys=True,separators=(',',':'))
                if len(encoded)>5000 or not re.fullmatch(r'[a-f0-9]{64}',revision) or hashlib.sha256(encoded.encode()).hexdigest()!=revision:raise ValueError('invalid_proposal')
                if not isinstance(manifest,dict) or manifest.get('tested') is not True or not re.fullmatch(r'[a-f0-9]{64}',str(manifest.get('videoSha256',''))):raise ValueError('untested_proposal')
                preview=self.root/'previews'/f"{row['id']}-{revision}.mp4"
                if not preview.is_file() or not 1000<=preview.stat().st_size<=20_000_000 or hashlib.sha256(preview.read_bytes()).hexdigest()!=manifest['videoSha256']:raise ValueError('preview_missing_or_changed')
                old=db.execute('SELECT revision FROM proposals WHERE id=?',(row['id'],)).fetchone()
                if row['status']=='awaiting_approval' and old and old['revision']==revision:return {'accepted':True,'code':revision[:10]}
                if row['status']!='running':raise ValueError('invalid_stage')
                code=revision[:10]
                db.execute('INSERT OR REPLACE INTO proposals(id,revision,code,manifest) VALUES(?,?,?,?)',(row['id'],revision,code,encoded))
                message=f"비교 영상이 준비됐습니다. 아직 등록하지 않았습니다.\n승인: !스타일승인 {code}\n보류: !스타일보류 {code}\n작업: {row['id']}"
                db.execute("UPDATE jobs SET status='awaiting_approval',result=? WHERE id=?",(message,row['id']))
                self.queue_preview(db,row['id'],revision)
                return {'accepted':True,'code':code}
            if op=='complete':
                row=db.execute('SELECT * FROM jobs WHERE id=?',(str(data.get('id')),)).fetchone()
                if not row or not secrets.compare_digest(row['token'] or '',str(data.get('token',''))):raise ValueError('invalid_claim')
                if row['status']!='running':return {'accepted':False,'status':row['status']}
                message=data.get('message');status=data.get('status')
                if not isinstance(message,str) or not 1<=len(message)<=1800 or status not in ('done','failed','development'):raise ValueError('invalid_result')
                db.execute('UPDATE jobs SET status=?,result=? WHERE id=?',(status,message,row['id']))
                db.execute("INSERT OR IGNORE INTO deliveries_v2(id,kind,text) VALUES(?,?,?)",(row['id'],'result:'+row['phase'],message))
                return {'accepted':True}
            if op=='status':return [dict(r) for r in db.execute('SELECT id,status,created,result FROM jobs ORDER BY created DESC LIMIT 5')]
            raise ValueError('invalid_operation')
    def queue_preview(self,db,eid,revision):
        db.execute('INSERT OR IGNORE INTO preview_links VALUES(?,?,?,?)',(eid,revision,secrets.token_hex(24),time.time()+7*86400))
        link=db.execute('SELECT token FROM preview_links WHERE id=? AND revision=?',(eid,revision)).fetchone()
        url='https://wiki.tail752fa1.ts.net:10000/styles/review/'+link['token']
        message=f"원본 비교 영상\n{url}\n\n아직 등록하지 않았습니다.\n승인: !스타일승인 {revision[:10]}\n보류: !스타일보류 {revision[:10]}"
        db.execute('INSERT OR IGNORE INTO deliveries_v2(id,kind,text) VALUES(?,?,?)',(eid,'preview:'+revision,message))
    def decision(self,eid,code,approve):
        # 이 메서드는 Iris 원문/방/발신자/신선도 검증을 통과한 Commands만 호출합니다.
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            if db.execute('SELECT 1 FROM commands WHERE id=?',(eid,)).fetchone():return
            db.execute('INSERT INTO commands VALUES(?,?)',(eid,time.time()))
            row=db.execute('SELECT p.*,j.status FROM proposals p JOIN jobs j ON j.id=p.id WHERE code=?',(code,)).fetchone()
            if not row or row['status']!='awaiting_approval':message='승인 대기 중인 비교 영상을 찾지 못했습니다. 최신 안내의 승인 명령을 사용해 주세요.'
            elif approve and db.execute('SELECT 1 FROM preview_links WHERE id=? AND revision=? AND expires>?',(row['id'],row['revision'],time.time())).fetchone() is None:
                message='비교 링크가 만료되어 등록하지 않았습니다. 새 비교 링크를 확인한 뒤 승인해야 합니다.'
            elif approve and db.execute("SELECT 1 FROM deliveries_v2 WHERE id=? AND kind=? AND state='sent'",(row['id'],'preview:'+row['revision'])).fetchone() is None:
                message='비교 영상 전달이 확인되지 않아 등록하지 않았습니다. 영상 전달부터 확인하겠습니다.'
            else:
                db.execute('UPDATE jobs SET status=? WHERE id=?',('approved' if approve else 'held',row['id']))
                if approve:db.execute('UPDATE proposals SET approved_by=?,approved_message=?,approved_at=? WHERE id=?',(OWNER,eid,time.time(),row['id']))
                message='확인하신 버전으로 등록·배포 검증을 시작합니다.' if approve else '보류했습니다. 운영 스타일은 변경하지 않습니다.'
            db.execute('INSERT INTO deliveries_v2(id,kind,text) VALUES(?,?,?)',(eid,'decision',message))
    def deliver(self,verify,send,send_video=None):
        if not verify():return
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            row=db.execute("SELECT * FROM deliveries_v2 WHERE state='pending' ORDER BY rowid LIMIT 1").fetchone()
            if not row:return
            db.execute("UPDATE deliveries_v2 SET state='sending' WHERE id=? AND kind=?",(row['id'],row['kind']))
        try:
            if row['kind'].startswith('video:'):
                if not send_video:raise ValueError('video_transport_missing')
                file=self.root/'previews'/f"{row['id']}-{row['text']}.mp4"
                with self.db() as db:proposal=db.execute('SELECT manifest,revision FROM proposals WHERE id=?',(row['id'],)).fetchone()
                if not proposal or proposal['revision']!=row['text'] or hashlib.sha256(file.read_bytes()).hexdigest()!=json.loads(proposal['manifest'])['videoSha256']:raise ValueError('preview_changed')
                send_video(ROOM,file)
            else:send(ROOM,row['text'])
            state='sent'
        except Exception:state='unknown'
        with self.db() as db:db.execute('UPDATE deliveries_v2 SET state=? WHERE id=? AND kind=?',(state,row['id'],row['kind']))

class Commands:
    def __init__(self,queue,verifier,send,clock=time.time,send_video=None):self.queue,self.verifier,self.send,self.clock,self.send_video=queue,verifier,send,clock,send_video
    def handle(self,payload):
        msg=payload.get('msg')
        if not isinstance(msg,str) or not re.match(r'^!(?:분석|스타일승인|스타일보류)(?:\s|$)',msg.strip()):return False
        item=payload.get('json') or {}
        if not isinstance(item,dict) or str(item.get('chat_id'))!=ROOM or str(item.get('user_id'))!=OWNER:return True
        eid=next((str(item[k]) for k in ('log_id','chat_log_id','chatLogId','message_id','id') if re.fullmatch(r'[1-9][0-9]{0,18}',str(item.get(k,'')))),'')
        try:
            row=self.verifier.message(eid)
            if not row or str(row.get('user_id'))!=OWNER or row.get('message')!=msg or str(row.get('type')) not in ('1','26') or row.get('deleted_at') not in (None,'',0,'0') or not -5<=self.clock()-float(row['created_at'])<=120 or not self.verifier.private_room():return True
            decision=re.fullmatch(r'!스타일(승인|보류)\s+([a-f0-9]{10})',msg.strip())
            if decision:
                self.queue.decision(eid,decision[2],decision[1]=='승인');return True
            if not msg.strip().startswith('!분석'):return True
            try:url=extract_url(msg);error=''
            except ValueError as exc:
                url='';error=str(exc)
            self.queue.enqueue(eid,url,error)
        except Exception as exc:print('[autoreels-style] receive:',type(exc).__name__,flush=True)
        return True
    def run(self):
        # 계좌/오류/지연 보조 작업기가 bot 모듈을 import해도 별도 발송 스레드는 돌리지 않습니다.
        if Path(sys.argv[0]).name!='eatspay_kakao_bot.py':return
        while True:
            try:self.queue.deliver(self.verifier.private_room,self.send,self.send_video)
            except Exception as exc:print('[autoreels-style] delivery:',type(exc).__name__,flush=True)
            time.sleep(2)

def from_env():
    from mobis_agent import AgentCommands,post
    def send(room,text):
        result=post('reply',{'type':'text','room':room,'data':text})
        if not isinstance(result,dict) or result.get('success') is False or result.get('status') is False:raise ValueError('send_rejected')
    def send_video(room,file):
        result=post('reply',{'type':'video','room':str(room),'name':'style-comparison.mp4','mime':'video/mp4','data':base64.b64encode(file.read_bytes()).decode()})
        if not isinstance(result,dict) or result.get('success') is False or result.get('status') is False:raise ValueError('video_send_rejected')
    return Commands(Queue(),AgentCommands(None),send,send_video=send_video)

if __name__=='__main__':
    raw=sys.stdin.read(8001)
    if len(raw)>8000:raise ValueError('request_too_large')
    print(json.dumps(Queue().rpc(json.loads(raw)),ensure_ascii=False))
