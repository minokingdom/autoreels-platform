import json,tempfile,time,unittest
from autoreels_style_commands import Queue,Commands,extract_url,ROOM,OWNER

class Tests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.q=Queue(self.tmp.name)
    def test_share_text(self):
        self.assertEqual(extract_url('!분석 이런 느낌으로\nhttps://youtu.be/abcdefghijk?si=tracking\n카페'), 'https://www.youtube.com/watch?v=abcdefghijk')
        self.assertEqual(extract_url('!분석 https://www.youtube.com/shorts/abcdefghijk'),extract_url('!분석 https://youtu.be/abcdefghijk'))
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

if __name__=='__main__':unittest.main()
