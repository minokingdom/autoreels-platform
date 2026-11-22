"""로컬만 쓰는 실제 개발 연결 검사. 큐/카카오/운영 등록은 호출하지 않습니다."""
import argparse,json,shutil
from pathlib import Path
from style_worker import run,write,REPO
from style_development import draft

def main():
    p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');a=p.parse_args()
    source=Path(a.source);out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
    (out/'analysis').mkdir(exist_ok=True)
    for file in ('source.mp4','measurements.json'):shutil.copy2(source/file,out/file)
    for file in ('storyboard.jpg','VIDEO.md'):shutil.copy2(source/'analysis'/file,out/'analysis'/file)
    feedback=''
    for attempt in range(3):
        try:
            result=draft(out,REPO,'https://www.capcut.com/tv2/ZSsdWtBxJ/','local-probe',run,write,feedback)
            run(['node',REPO/'scripts/style-proposal-preview.mjs',out],cwd=REPO,timeout=1200)
            print(json.dumps({'name':result['style']['name'],'attempts':attempt+1,'localOnly':True,'tests':'passed'},ensure_ascii=False));return
        except RuntimeError as exc:
            feedback=str(exc)
            if attempt==2:raise
if __name__=='__main__':main()
