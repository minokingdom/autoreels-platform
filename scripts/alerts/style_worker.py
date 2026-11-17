"""카카오 분석 큐 → rea-video → 프레임 분석 → 검증된 스타일 카탈로그 등록."""
import argparse, base64, hashlib, json, os, shutil, subprocess, sys, time, urllib.request
from pathlib import Path
from autoreels_style_commands import extract_url

ROOT=Path(os.environ.get('AUTOREELS_STYLE_ROOT',r'D:\AutoReelsLocal\StyleLab'))
REPO=Path(os.environ.get('AUTOREELS_REPO',r'C:\Users\ektjt\.gemini\antigravity\scratch\dealer-reels-platform'))
REMOTE='minokingdom/autoreels-platform'
CATALOG='public/assets/reference-styles.json'
SITE='https://autoreels-studio.vercel.app'
KEY=Path.home()/'.ssh/eatspay-kakaobot-restored-20261023'
KNOWN=Path.home()/'.ssh/known_hosts-eatspay-restored-20261023'
os.environ.update(PYTHONUTF8='1',REA_VIDEO_HOME=str(ROOT/'memory'),REA_VIDEO_MODELS=str(ROOT/'models'))

def run(args,cwd=None,timeout=180,input=None):
    p=subprocess.run([str(x) for x in args],cwd=cwd,input=input,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=timeout,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
    if p.returncode:
        # 로그에 토큰/원본 메시지는 남기지 않습니다. 도구 오류 상세는 작업 폴더에만 저장합니다.
        raise RuntimeError(Path(str(args[0])).name+' 실행 실패: '+p.stderr[-500:].replace(str(KEY),'[key-path]'))
    return p.stdout

def rpc(data):
    return json.loads(run(['ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10',
        '-o','UserKnownHostsFile='+str(KNOWN),'-i',KEY,'mino@100.92.237.65',
        'python3 /home/mino/eatspay-kakao/autoreels_style_commands.py'],input=json.dumps(data),timeout=25))

def write(file,data):
    file.parent.mkdir(parents=True,exist_ok=True);tmp=file.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');os.replace(tmp,file)

def download(url,directory):
    url=extract_url('!분석 '+url)
    common=[sys.executable,'-m','yt_dlp','--ignore-config','--no-playlist','--no-warnings','--socket-timeout','20','--retries','1','--no-progress']
    meta=json.loads(run(common+['--skip-download','--dump-single-json','--',url],timeout=90))
    if meta.get('_type') in ('playlist','multi_video') or meta.get('is_live') or not isinstance(meta.get('duration'),(int,float)) or not 1<=meta['duration']<=180:
        raise ValueError('3분 이하의 공개 영상 하나만 분석할 수 있습니다. 라이브·목록·길이 미확인 영상은 제외합니다.')
    run(common+['--max-filesize','200M','-f','bv*[height<=720]+ba/b[height<=720]','--merge-output-format','mp4','-o',directory/'source.%(ext)s','--',url],timeout=240)
    files=[p for p in directory.glob('source.*') if p.suffix.lower() in ('.mp4','.webm','.mkv','.mov')]
    if len(files)!=1 or files[0].stat().st_size>210_000_000:raise ValueError('영상 다운로드가 완료되지 않았습니다.')
    return files[0]

def analyse(video,directory):
    output=directory/'analysis'
    run([sys.executable,'-m','rea_video.cli','decompose',video,'-o',output,'--no-vlm','--no-stems','--no-asr','--no-speakers','--no-ocr','--no-packaging','--workers','1','--lang','en'],timeout=1200)
    bfile=output/'breakdown.json'
    if not bfile.exists():raise RuntimeError('rea-video 분석 결과가 없습니다.')
    b=json.loads(bfile.read_text(encoding='utf-8'))
    shots=b.get('shots',[])
    compact={'duration':b.get('source',{}).get('duration'),'shots':[{k:s.get(k) for k in ('index','start','end','duration','motion','camera')} for s in shots[:40]],'limitations':'OCR/음성인식 미사용. 글꼴 이름·정확한 자막 시간은 미측정.'}
    duration=float(compact['duration'] or 0)
    if not 1<=duration<=180:raise ValueError('분석 가능한 영상 길이가 아닙니다.')
    frames=[]
    for i in range(12):
        second=min(duration-.05,(i+.2)*duration/12)
        target=directory/f'frame-{i:02d}.jpg'
        run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-ss',str(second),'-i',video,'-frames:v','1','-vf','scale=384:384:force_original_aspect_ratio=decrease','-q:v','5',target],timeout=30)
        frames.append(base64.b64encode(target.read_bytes()).decode())
    timeline=json.dumps(compact,ensure_ascii=False)[:10000]
    write(directory/'measurements.json',compact)
    return frames,timeline

def request_style(frames,timeline,eid):
    body=json.dumps({'mode':'reference-style','frames':frames,'timeline':timeline,'requestId':'reference-'+eid}).encode()
    request=urllib.request.Request(SITE+'/api/generate-script',data=body,headers={'Content-Type':'application/json'},method='POST')
    try:
        with urllib.request.urlopen(request,timeout=65) as response:result=json.load(response)
    except urllib.error.HTTPError as exc:
        try:result=json.load(exc)
        except Exception:result={}
        raise ValueError(result.get('message') or result.get('error') or f'분석 API 오류 {exc.code}') from None
    if not result.get('ok'):raise ValueError(result.get('error','분석 실패'))
    return result['style']

def validate_catalog(catalog,directory):
    file=directory/'catalog-candidate.json';write(file,catalog)
    script="const fs=require('fs');const {validateCatalog}=require(process.argv[1]);const c=validateCatalog(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));process.stdout.write(JSON.stringify(c));"
    return json.loads(run(['node','-e',script,REPO/'lib/reference-style.cjs',file]))

def publish(style,url,directory):
    sid='ref_'+hashlib.sha256(url.encode()).hexdigest()[:16]
    checkpoint=directory/'published.json'
    if checkpoint.exists():return json.loads(checkpoint.read_text(encoding='utf-8'))
    entry={'id':sid,**style}
    # 매번 최신 원격 카탈로그를 읽고 해당 파일 하나만 CAS 갱신합니다. 작업 중인 소스는 건드리지 않습니다.
    current=json.loads(run(['gh','api',f'repos/{REMOTE}/contents/{CATALOG}?ref=main']))
    catalog=json.loads(base64.b64decode(current['content']))
    if any(row['id']==sid for row in catalog):raise ValueError('이 영상에서 만든 스타일이 이미 등록되어 있습니다.')
    result=validate_catalog(catalog+[entry],directory)
    payload={'message':'feat: add analysed reference style '+sid,'sha':current['sha'],'branch':'main','content':base64.b64encode((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode()).decode()}
    file=directory/'publish-request.json';write(file,payload)
    committed=json.loads(run(['gh','api','--method','PUT',f'repos/{REMOTE}/contents/{CATALOG}','--input',file]))
    saved={'id':sid,'name':style['name'],'sha':committed['commit']['sha']};write(checkpoint,saved)
    return saved

def deployed(commit):
    for _ in range(90):
        status=json.loads(run(['gh','api',f'repos/{REMOTE}/commits/{commit}/status']))
        runs=json.loads(run(['gh','api',f'repos/{REMOTE}/actions/runs?head_sha={commit}&per_page=20']))['workflow_runs']
        smoke=[r for r in runs if r['name']=='smoke']
        if status.get('state') in ('failure','error') or any(r['conclusion'] in ('failure','cancelled','timed_out') for r in smoke):raise RuntimeError('배포 또는 스모크 검사 실패. 등록 상태 확인이 필요합니다.')
        if status.get('state')=='success' and any(r['conclusion']=='success' for r in smoke):return
        time.sleep(10)
    raise RuntimeError('스타일은 등록했지만 배포 검사가 아직 끝나지 않았습니다.')

def process(job):
    directory=ROOT/'jobs'/job['id'];directory.mkdir(parents=True,exist_ok=True)
    receipt=directory/'result.json'
    if receipt.exists():return json.loads(receipt.read_text(encoding='utf-8'))
    # 재시작 뒤 중단된 모델/등록 작업은 자동으로 다시 돌리지 않습니다.
    mark=directory/'started'
    if mark.exists():return {'status':'failed','message':'중단된 분석 작업입니다. 원본 결과 확인 전 자동 재실행하지 않습니다. 작업: '+job['id']}
    mark.write_text(str(time.time()))
    try:
        video=download(job['url'],directory)
        frames,timeline=analyse(video,directory)
        style=request_style(frames,timeline,job['id']);write(directory/'style.json',style)
        pub=publish(style,job['url'],directory)
        deployed(pub['sha'])
        with urllib.request.urlopen(SITE+'/assets/app/app.js?v='+pub['sha'][:10],timeout=30) as response:
            if pub['id'].encode() not in response.read(8_000_000):raise RuntimeError('라이브 스타일 반영을 확인하지 못했습니다.')
        result={'status':'done','message':f"오토릴스 스타일 추가 완료\n{pub['name']}\n{style['summary']}\n스타일 목록에서 이름으로 선택하세요.\n{SITE}/studio?v={pub['sha'][:10]}\n음성 기준 길이·컷별 사진·엔딩 설정은 그대로 적용됩니다."}
    except Exception as exc:
        write(directory/'error.json',{'type':type(exc).__name__,'detail':str(exc)[:1500]})
        message=str(exc) if isinstance(exc,ValueError) else '다운로드·분석·배포 중 완료하지 못했습니다. 작업 기록을 확인해야 합니다.'
        result={'status':'failed','message':'스타일 분석 미완료\n'+message[:500]+'\n작업: '+job['id']}
    write(receipt,result);return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--once',action='store_true');parser.add_argument('--file');parser.add_argument('--status',action='store_true');parser.add_argument('--test-api',action='store_true');args=parser.parse_args()
    if args.status:print(json.dumps(rpc({'op':'status'}),ensure_ascii=False));return
    if args.file:
        directory=ROOT/'self-test';directory.mkdir(parents=True,exist_ok=True)
        frames,timeline=analyse(Path(args.file),directory)
        if args.test_api:
            style=request_style(frames,timeline,'selftest-'+str(int(time.time())));write(directory/'api-style.json',style)
            print(json.dumps({'api':'ok','style':style},ensure_ascii=False))
        else:print(json.dumps({'frames':len(frames),'timeline':json.loads(timeline)},ensure_ascii=False))
        return
    ROOT.mkdir(parents=True,exist_ok=True)
    # 한 PC 작업기만 실행. 외부 수신 포트 없음.
    import msvcrt
    lock=open(ROOT/'worker.lock','a+b');lock.seek(0);lock.write(b'1');lock.flush();lock.seek(0)
    msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
    pending=ROOT/'outbox.json'
    while True:
        try:
            if pending.exists():
                data=json.loads(pending.read_text(encoding='utf-8'));rpc(data);pending.unlink()
            job=rpc({'op':'claim'})
            if job:
                result=process(job)
                write(pending,{'op':'complete','id':job['id'],'token':job['token'],**result})
                rpc(json.loads(pending.read_text(encoding='utf-8')));pending.unlink()
        except Exception as exc:print(time.strftime('%Y-%m-%d %H:%M:%S'),type(exc).__name__,flush=True)
        if args.once:break
        time.sleep(10)

if __name__=='__main__':main()
