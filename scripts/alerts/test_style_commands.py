import hashlib,json,tempfile,time,unittest
from pathlib import Path
from autoreels_style_commands import Queue,Commands,extract_url,ROOM,OWNER

class Tests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.q=Queue(self.tmp.name)
    def test_share_text(self):
        self.assertEqual(extract_url('!분석 이런 느낌으로\nhttps://youtu.be/abcdefghijk?si=tracking\n카페'), 'https://www.youtube.com/watch?v=abcdefghijk')
        self.assertEqual(extract_url('!분석 https://www.youtube.com/shorts/abcdefghijk'),extract_url('!분석 https://youtu.be/abcdefghijk'))
    def test_capcut_share_text(self):
        share='https://www.capcut.com/tv2/ZSp7Ve5qA/'
        self.assertEqual(extract_url('!분석 CapCut에서 이 놀라운 템플릿을 발견했습니다. 링크를 탭하여 시도해 보세요! '+share+' mukbang time'),share)
        self.assertEqual(extract_url('!분석 https://capcut.com/template-detail/mukbang-time/7709369971637357831?region=KR'), 'https://www.capcut.com/template-detail/7709369971637357831')
        for url in ('https://www.capcut.com/','https://capcut.com.example/tv2/ZSp7Ve5qA/','https://www.capcut.com/tv2/ZSp7Ve5qA/a'):
            with self.subTest(url=url),self.assertRaises(ValueError):extract_url('!분석 '+url)
    def test_facebook_video_and_share(self):
        canonical='https://www.facebook.com/watch/?v=123456789'
        for url in ('https://m.facebook.com/reel/123456789/?mibextid=test',
                    'https://facebook.com/watch?v=123456789&ref=share',
                    'https://www.facebook.com/shop/videos/a-caption/123456789/'):
            self.assertEqual(extract_url('!분석 공유한 릴스\n'+url),canonical)
        for link in ('https://www.facebook.com/share/r/abc123/', 'https://www.facebook.com/share/v/abc123/', 'https://fb.watch/abc-123/'):
            self.assertEqual(extract_url('!분석 '+link+'?tracking=1'),link)
        for url in ('https://facebook.com/shop','https://www.facebook.com/login/?next=/reel/123',
                    'https://facebook.com.example/reel/123','https://fb.watch/a/b','https://www.facebook.com/watch/?v=x'):
            with self.assertRaises(ValueError):extract_url('!분석 '+url)
    def test_reject_bad_urls(self):
        for s in ['http://youtu.be/abcdefghijk','https://youtube.com.evil.test/watch?v=abcdefghijk','https://127.0.0.1/a.mp4','file:///tmp/a','https://user:pw@youtu.be/abcdefghijk','https://www.youtube.com/@channel','https://youtu.be/abcdefghijk https://youtu.be/lmnopqrstuv']:
            with self.subTest(s=s),self.assertRaises(ValueError):extract_url('!분석 '+s)
    def test_idempotency(self):
        self.q.enqueue('1','url');self.q.enqueue('1','url');self.q.enqueue('2','url')
        self.assertEqual([x['status'] for x in self.q.rpc({'op':'status'})],['rejected','queued'])
        a=self.q.rpc({'op':'claim'});self.assertIsNone(self.q.rpc({'op':'claim'}))
        with self.assertRaises(ValueError):self.q.rpc({'op':'complete','id':'1','token':'fake','message':'x','status':'done'})
        result={'op':'complete',**a,'message':'완료','status':'done'}
        self.assertTrue(self.q.rpc(result)['accepted']);self.assertFalse(self.q.rpc(result)['accepted'])
    def test_authentication(self):
        q=self.q
        class Verifier:
            def private_room(self):return True
            def message(self,eid):return {'user_id':OWNER,'message':'!분석 https://youtu.be/abcdefghijk','type':1,'created_at':time.time(),'deleted_at':0}
        commands=Commands(q,Verifier(),lambda *a:None)
        payload={'msg':'!분석 https://youtu.be/abcdefghijk','json':{'chat_id':ROOM,'user_id':'other','id':'3'}}
        self.assertTrue(commands.handle(payload));self.assertEqual(q.rpc({'op':'status'}),[])
        payload['json']['user_id']=OWNER;commands.handle(payload);self.assertEqual(len(q.rpc({'op':'status'})),1)
        payload['msg']='!분석 https://youtu.be/lmnopqrstuv';payload['json']['id']='4';commands.handle(payload)
        self.assertEqual(len(q.rpc({'op':'status'})),1)
    def test_delivery_once(self):
        self.q.enqueue('5','url');sent=[]
        self.q.deliver(lambda:False,lambda *a:sent.append(a));self.assertFalse(sent)
        self.q.deliver(lambda:True,lambda *a:sent.append(a));self.q.deliver(lambda:True,lambda *a:sent.append(a));self.assertEqual(len(sent),1)
    def test_send_unknown_not_retried(self):
        self.q.enqueue('6','url')
        def fail(*args):raise TimeoutError()
        self.q.deliver(lambda:True,fail);sent=[];self.q.deliver(lambda:True,lambda *a:sent.append(a));self.assertFalse(sent)
    def proposal(self):
        self.q.enqueue('10','url');job=self.q.rpc({'op':'claim'})
        video=b'video-test'*200
        manifest={'tested':True,'videoSha256':hashlib.sha256(video).hexdigest(),'candidateSha256':'a'*64}
        revision=hashlib.sha256(json.dumps(manifest,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        folder=Path(self.tmp.name)/'previews';folder.mkdir();(folder/f'10-{revision}.mp4').write_bytes(video)
        data={'op':'propose',**job,'revision':revision,'manifest':manifest}
        self.q.rpc(data);return data
    def test_proposal_requires_video_and_exact_hash(self):
        data=self.proposal();self.assertEqual(self.q.rpc({'op':'status'})[0]['status'],'awaiting_approval')
        self.assertTrue(self.q.rpc(data)['accepted'])
        data['manifest']['tested']=False
        with self.assertRaises(ValueError):self.q.rpc(data)
    def test_approval_cannot_precede_video_delivery(self):
        data=self.proposal();self.q.decision('11',data['revision'][:10],True)
        self.assertEqual(self.q.rpc({'op':'status'})[0]['status'],'awaiting_approval')
    def test_approved_revision_claim_and_duplicate_approval(self):
        data=self.proposal()
        for _ in range(3):self.q.deliver(lambda:True,lambda *a:None,lambda *a:None)
        self.q.decision('11',data['revision'][:10],True);self.q.decision('11',data['revision'][:10],True)
        job=self.q.rpc({'op':'claim'});self.assertEqual(job['phase'],'publish');self.assertEqual(job['proposal']['revision'],data['revision'])
        self.q.decision('12',data['revision'][:10],True);self.assertIsNone(self.q.rpc({'op':'claim'}))
    def test_non_owner_cannot_approve(self):
        data=self.proposal();msg='!스타일승인 '+data['revision'][:10]
        class Verifier:
            def private_room(self):return True
            def message(self,eid):return {'user_id':'other','message':msg,'type':1,'created_at':time.time(),'deleted_at':0}
        Commands(self.q,Verifier(),lambda *a:None).handle({'msg':msg,'json':{'chat_id':ROOM,'user_id':OWNER,'id':'12'}})
        self.assertEqual(self.q.rpc({'op':'status'})[0]['status'],'awaiting_approval')
    def test_development_is_a_new_stage_not_registration(self):
        self.q.enqueue('1','url');job=self.q.rpc({'op':'claim'})
        self.q.rpc({'op':'complete',**job,'status':'development','message':'구현 시작'})
        self.assertEqual(self.q.rpc({'op':'claim'})['phase'],'develop')

if __name__=='__main__':unittest.main()
