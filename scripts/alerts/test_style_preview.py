import hashlib,json,tempfile,threading,time,unittest,urllib.request,urllib.error
from pathlib import Path
import style_preview_server as preview
from autoreels_style_commands import Queue

class PreviewTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);preview.ROOT=self.root
        self.queue=Queue(self.root);self.token='a'*48;self.revision='b'*64;self.video=b'video'*400
        (self.root/'previews').mkdir();self.file=self.root/'previews'/('10-'+self.revision+'.mp4');self.file.write_bytes(self.video)
        with self.queue.db() as db:
            db.execute('INSERT INTO proposals(id,revision,code,manifest) VALUES(?,?,?,?)',('10',self.revision,self.revision[:10],json.dumps({'videoSha256':hashlib.sha256(self.video).hexdigest(),'name':'<test>'})))
            db.execute('INSERT INTO preview_links VALUES(?,?,?,?)',('10',self.revision,self.token,time.time()+100))
        self.server=preview.Server(('127.0.0.1',0),preview.PreviewHandler);self.base='http://127.0.0.1:'+str(self.server.server_address[1]);threading.Thread(target=self.server.serve_forever,daemon=True).start()
        self.addCleanup(self.server.server_close);self.addCleanup(self.server.shutdown)
    def test_page_and_range(self):
        with urllib.request.urlopen(self.base+'/styles/review/'+self.token) as r:
            body=r.read().decode();self.assertIn('&lt;test&gt;',body);self.assertIn('<video controls',body);self.assertEqual(r.headers['Referrer-Policy'],'no-referrer')
        self.assertIn('?v='+self.revision,body)
        request=urllib.request.Request(self.base+'/styles/media/'+self.token+'?v='+self.revision,headers={'Range':'bytes=10-99'})
        with urllib.request.urlopen(request) as r:self.assertEqual(r.status,206);self.assertEqual(r.read(),self.video[10:100])
    def test_invalid_token(self):
        with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(self.base+'/review/../../secret')
        self.assertEqual(e.exception.code,404)
    def test_expired(self):
        with self.queue.db() as db:db.execute('UPDATE preview_links SET expires=0')
        with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(self.base+'/review/'+self.token)
        self.assertEqual(e.exception.code,410)
    def test_modified_video(self):
        self.file.write_bytes(b'x'*2000)
        with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(self.base+'/media/'+self.token)
        self.assertEqual(e.exception.code,409)
    def test_old_link_latest_page_but_open_media_version_is_pinned(self):
        new='c'*64;video=b'new-video'*400
        (self.root/'previews'/('10-'+new+'.mp4')).write_bytes(video)
        with self.queue.db() as db:
            db.execute('UPDATE proposals SET revision=?,code=?,manifest=?',(new,new[:10],json.dumps({'videoSha256':hashlib.sha256(video).hexdigest()})))
        with urllib.request.urlopen(self.base+'/review/'+self.token) as r:
            body=r.read().decode();self.assertIn('!스타일승인 '+new[:10],body);self.assertIn('?v='+new,body)
        for suffix in ('','?v='+self.revision,'?v='+new+'&v='+new):
            with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(self.base+'/media/'+self.token+suffix)
            self.assertEqual(e.exception.code,409)
        with urllib.request.urlopen(self.base+'/media/'+self.token+'?v='+new) as r:self.assertEqual(r.read(),video)
if __name__=='__main__':unittest.main()
