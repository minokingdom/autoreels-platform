"""야간 생성 자료에 비밀값이 없고 날짜와 필수 이미지가 맞는지 확인합니다."""

import base64
import datetime
import importlib.util
import json
import os
import runpy
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "kaggle" / "nightly_media.py"
SPEC = importlib.util.spec_from_file_location("nightly_media", SCRIPT)
worker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(worker)


class NightlyMediaTest(unittest.TestCase):
    def test_prepare_then_unpack(self):
        date = worker.get_kst_date_context()["dateStr"]
        token = "a" * 64
        trends = {"date": date, "industries": {key: {"keywords": []} for key in worker.INDUSTRY_INFO}}
        topics = [{"title": f"주제 {i}", "why": "오늘", "prompt": "대본 방향"} for i in range(10)]

        def prepare_response(body, supplied_token):
            self.assertEqual(supplied_token, token)
            if body["mode"] == "nightly-topics":
                return {"ok": True, "topics": topics}
            self.assertEqual(len(body["topicsList"]), 10)
            return {"ok": True, "prompts": ["Square editorial photograph"] * 10}

        original_dir = Path.cwd()
        with tempfile.TemporaryDirectory() as tmp:
            os.chdir(tmp)
            try:
                manifest = Path("public/trends-today.json")
                manifest.parent.mkdir()
                manifest.write_text(json.dumps(trends), encoding="utf-8")
                kernel = Path("upload/nightly_media.py")
                with patch.dict(os.environ, {"NIGHTLY_MEDIA_TOKEN": token}), patch.object(
                    worker, "post_nightly", side_effect=prepare_response
                ) as api:
                    worker.prepare_kernel(kernel)
                self.assertEqual(api.call_count, 20)
                self.assertNotIn(token, kernel.read_text(encoding="utf-8"))
                generated = runpy.run_path(str(kernel))
                batch = json.loads(base64.b64decode(generated["NIGHTLY_BATCH"]))
                self.assertEqual(batch["trends"]["date"], date)
                self.assertEqual(len(batch["prompts"]), 10)
                bundle = Path("bundle.zip")
                images = []
                rotate_slot = 11 + datetime.date.fromisoformat(date).timetuple().tm_yday % 5
                for industry, row in batch["trends"]["industries"].items():
                    for i, topic in enumerate(row["topics"], start=1):
                        topic["iconUrl"] = f"/assets/topics/{industry}/{i}.jpg"
                        images.append("public" + topic["iconUrl"])
                    images.append(f"public/assets/scenes/{industry}/{rotate_slot}.jpg")
                with zipfile.ZipFile(bundle, "w") as archive:
                    archive.writestr(str(manifest.as_posix()), json.dumps(batch["trends"]))
                    for image in images[:-1]:
                        archive.writestr(image, b"\xff\xd8")
                with self.assertRaises(KeyError):
                    worker.unpack_bundle(bundle)
                self.assertEqual(json.loads(manifest.read_text(encoding="utf-8")), trends)
                with zipfile.ZipFile(bundle, "a") as archive:
                    archive.writestr(images[-1], b"\xff\xd8")
                worker.unpack_bundle(bundle)
                self.assertEqual(json.loads(manifest.read_text(encoding="utf-8")), batch["trends"])
                self.assertTrue(all(Path(image).is_file() for image in images))
            finally:
                os.chdir(original_dir)


if __name__ == "__main__":
    unittest.main()
