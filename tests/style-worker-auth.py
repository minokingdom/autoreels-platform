"""영상 분석 전용 인증과 사용자 안내 회귀 검사. 외부 요청은 보내지 않습니다."""
import importlib.util
import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts' / 'alerts'))
import style_worker as worker


class WorkerAuthTests(unittest.TestCase):
    def test_missing_key_stops_before_request(self):
        with patch.dict(worker.os.environ, {}, clear=True), patch.object(worker.os, 'name', 'posix'):
            with self.assertRaisesRegex(ValueError, '사용자 로그인 문제가 아닙니다'):
                worker.style_worker_token()

    def test_request_scope(self):
        class Opener:
            def open(self, request, timeout):
                self.request = request
                return io.StringIO(json.dumps({'ok': True, 'style': {'name': '시험'}}))
        opener = Opener()
        with patch.object(worker, 'style_worker_token', return_value='c' * 64), patch.object(worker.urllib.request, 'build_opener', return_value=opener):
            self.assertEqual(worker.request_style(['frame'], '{}', '123456789')['name'], '시험')
        self.assertEqual(opener.request.get_header('X-autoreels-style-token'), 'c' * 64)
        self.assertEqual(json.loads(opener.request.data)['mode'], 'reference-style-worker')

    def test_auth_error_is_operator_issue(self):
        for status in (401, 403):
            with patch.object(worker, 'style_worker_token', return_value='c' * 64), patch.object(worker.urllib.request, 'build_opener') as factory:
                factory.return_value.open.side_effect = HTTPError(worker.SITE, status, 'denied', {}, io.BytesIO(b'{}'))
                with self.assertRaisesRegex(ValueError, '사용자 로그인 문제가 아닙니다'):
                    worker.request_style([], '', '123456789')

    def test_redirect_does_not_forward_secret(self):
        with self.assertRaisesRegex(ValueError, 'API 주소'):
            worker.StyleApiRedirect().redirect_request(None, None, 302, '', {}, 'https://other.test')


if __name__ == '__main__':
    unittest.main()
