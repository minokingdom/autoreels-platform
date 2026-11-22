import json,tempfile,unittest
from pathlib import Path
from style_development import approved_candidate,digest,revision

class ApprovalTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
        (self.root/'proposal').mkdir()
        for name,body in [('source.mp4',b'source'),('proposal/original-vs-revised.mp4',b'comparison'),('proposal/checks.json',b'{"passed":true}'),('proposal/candidate.json',b'{"style":{"name":"test"}}')]:
            (self.root/name).write_bytes(body)
        self.manifest={'candidateSha256':digest(self.root/'proposal/candidate.json'),'videoSha256':digest(self.root/'proposal/original-vs-revised.mp4'),'sourceSha256':digest(self.root/'source.mp4'),'checksSha256':digest(self.root/'proposal/checks.json')}
        self.job={'proposal':{'approved_by':'88899591','approved_message':'123','manifest':json.dumps(self.manifest),'revision':revision(self.manifest)}}
    def test_exact_approved_bundle(self):self.assertEqual(approved_candidate(self.job,self.root)['style']['name'],'test')
    def test_no_approval(self):
        self.job['proposal']['approved_message']=None
        with self.assertRaises(ValueError):approved_candidate(self.job,self.root)
    def test_changed_code(self):
        (self.root/'proposal/candidate.json').write_text('{}')
        with self.assertRaises(ValueError):approved_candidate(self.job,self.root)
    def test_changed_video(self):
        (self.root/'proposal/original-vs-revised.mp4').write_bytes(b'new video')
        with self.assertRaises(ValueError):approved_candidate(self.job,self.root)
    def test_changed_checks(self):
        (self.root/'proposal/checks.json').write_text('{}')
        with self.assertRaises(ValueError):approved_candidate(self.job,self.root)
if __name__=='__main__':unittest.main()
