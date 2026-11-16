// 매일 새벽 업종별 인기 키워드를 미리 받아 public/trends-today.json 에 저장
// - GitHub Actions(.github/workflows/refresh-trends.yml)가 한국 시간 새벽 4시에 실행
// - 기본 모드: 운영 서버 /api/trends 를 refresh=1 로 불러 최신 인기 릴스 제목·해시태그를 받음
// - --treg 모드: 로컬 treg CLI (tikhub.x.youtube-web-v2-get-shorts-search, 10업종 합계 $0.01)로 실시간 쇼츠 트렌드 수집
// 사용: node scripts/refresh-trends.mjs [사이트 주소] [--treg]
import { writeFile, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { homedir } from 'node:os';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);
const args = process.argv.slice(2);
const USE_TREG = args.includes('--treg');
const BASE = args.find((a) => !a.startsWith('--')) || process.env.SITE_URL || 'https://dealer-reels-platform.vercel.app';
const INDUSTRIES = ['auto', 'restaurant', 'cafe', 'beauty', 'realestate', 'academy', 'clinic', 'fitness', 'shop', 'interior'];
const TREG_QUERIES = {
  auto: '신차 출고 자동차 릴스',
  restaurant: '맛집 웨이팅 식당 추천',
  cafe: '신상 카페 디저트 투어',
  beauty: '헤어 네일 뷰티샵 추천',
  realestate: '신혼집 아파트 전세 부동산',
  academy: '학원 공부법 입시 릴스',
  clinic: '피부과 치과 건강 관리',
  fitness: '헬스 필라테스 다이어트 루틴',
  shop: '쇼핑몰 데일리룩 추천템',
  interior: '아파트 인테리어 룸투어 리모델링'
};
const OUT = new URL('../public/trends-today.json', import.meta.url);

function extractTregTitles(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) extractTregTitles(item, out);
    return out;
  }
  const om = node.overlayMetadata;
  if (om && typeof om === 'object' && om.primaryText && om.primaryText.content) {
    out.push(String(om.primaryText.content).trim());
  }
  for (const key of ['headline', 'title']) {
    const obj = node[key];
    if (obj && typeof obj === 'object') {
      const txt = obj.simpleText || (Array.isArray(obj.runs) && obj.runs[0] && obj.runs[0].text) || '';
      if (txt) out.push(String(txt).trim());
    }
  }
  for (const val of Object.values(node)) {
    if (val && typeof val === 'object') extractTregTitles(val, out);
  }
  return out;
}

async function fetchViaTreg(ind) {
  const tregBin = process.env.TREG_BIN || (process.platform === 'win32' ? join(homedir(), '.local', 'bin', 'treg.exe') : 'treg');
  const query = TREG_QUERIES[ind] || ind;
  const { stdout } = await execFileAsync(tregBin, [
    '--json', 'call', 'tikhub.x.youtube-web-v2-get-shorts-search',
    '--query', `search_query=${query}`,
    '--query', 'language_code=ko',
    '--query', 'country_code=KR',
    '--query', 'filter_mixed_content=true'
  ], { maxBuffer: 10 * 1024 * 1024, timeout: 45000 });
  const parsed = JSON.parse(stdout);
  const rawTitles = extractTregTitles(parsed.result || parsed);
  const seen = new Set();
  const clean = [];
  for (const raw of rawTitles) {
    const title = raw.replace(/#[^\s#]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 50);
    const tags = (raw.match(/#[가-힣a-zA-Z0-9_]+/g) || []).slice(0, 4).join(' ');
    const line = [title, tags].join(' ').trim();
    if (!title || title.length < 4 || seen.has(title)) continue;
    seen.add(title);
    clean.push(line);
    if (clean.length >= 8) break;
  }
  return { source: 'treg_youtube_shorts', keywords: clean };
}

let prev = { industries: {} };
try { prev = JSON.parse(await readFile(OUT, 'utf8')); } catch (e) { /* 처음 실행 */ }

async function notifyKakaoProblem(text) {
  const restKey = String(process.env.KAKAO_REST_API_KEY || '').trim();
  const refreshToken = String(process.env.KAKAO_REFRESH_TOKEN || '').trim();
  const webhookUrl = String(process.env.KAKAO_ALERT_WEBHOOK || '').trim();

  if (restKey && refreshToken) {
    try {
      const form = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: restKey,
        refresh_token: refreshToken
      });
      if (process.env.KAKAO_CLIENT_SECRET) form.set('client_secret', String(process.env.KAKAO_CLIENT_SECRET).trim());
      const tkRes = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: form,
        signal: AbortSignal.timeout(10000)
      });
      const tk = await tkRes.json();
      if (tk.access_token) {
        const template = {
          object_type: 'text',
          text: `[AutoReels 알림]\n${String(text).slice(0, 900)}`,
          link: { web_url: 'https://autoreels-studio.vercel.app', mobile_web_url: 'https://autoreels-studio.vercel.app' },
          button_title: '스튜디오 확인'
        };
        const msgRes = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tk.access_token}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
          },
          body: new URLSearchParams({ template_object: JSON.stringify(template) }),
          signal: AbortSignal.timeout(10000)
        });
        console.log('kakao notify status:', msgRes.status);
      } else {
        console.log('kakao token error:', tk.error_description || tk.error || tkRes.status);
      }
    } catch (e) {
      console.log('kakao notify failed:', e.message);
    }
  }

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `[AutoReels 알림]\n${text}` }),
        signal: AbortSignal.timeout(10000)
      });
    } catch (e) {
      console.log('kakao webhook failed:', e.message);
    }
  }
}

const kst = new Date(Date.now() + 9 * 3600000);
const out = { date: kst.toISOString().slice(0, 10), updatedAt: new Date().toISOString(), industries: {} };
let okCount = 0;
const problems = [];
for (const ind of INDUSTRIES) {
  try {
    let source = '';
    let items = [];
    if (USE_TREG) {
      const r = await fetchViaTreg(ind);
      source = r.source;
      items = r.keywords;
    } else {
      const res = await fetch(`${BASE}/api/trends?industry=${ind}&refresh=1`, { signal: AbortSignal.timeout(70000) });
      const j = await res.json();
      source = j.source || '';
      items = (Array.isArray(j.items) ? j.items : [])
        .map((it) => {
          const title = String(it.title || (it.theme && it.theme.hookCaption) || '').replace(/#[^\s#]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 50);
          const tags = (String(it.fullCaption || it.title || '').match(/#[가-힣a-zA-Z0-9_]+/g) || []).slice(0, 4).join(' ');
          return [title, tags].join(' ').trim();
        })
        .filter(Boolean)
        .slice(0, 8);
    }
    if (items.length) {
      const prevInd = (prev.industries && prev.industries[ind] && typeof prev.industries[ind] === 'object')
        ? { ...prev.industries[ind] }
        : {};
      delete prevInd.stale;
      out.industries[ind] = { ...prevInd, source, keywords: items };
      okCount++;
    } else {
      problems.push(`${ind}: 키워드 0건`);
      if (prev.industries && prev.industries[ind]) out.industries[ind] = { ...prev.industries[ind], stale: true };
    }
    console.log(ind, source, items.length);
  } catch (e) {
    console.log(ind, 'error', e.message);
    problems.push(`${ind}: ${e.message}`);
    if (prev.industries && prev.industries[ind]) out.industries[ind] = { ...prev.industries[ind], stale: true };
  }
}

if (USE_TREG) {
  try {
    const tregBin = process.env.TREG_BIN || (process.platform === 'win32' ? join(homedir(), '.local', 'bin', 'treg.exe') : 'treg');
    const { stdout } = await execFileAsync(tregBin, ['--json', 'balance'], { timeout: 15000 });
    const bal = JSON.parse(stdout);
    const usd = Number(bal.balance_usd ?? (Number(bal.balance_micro || 0) / 1e6));
    if (Number.isFinite(usd) && usd < 0.1) {
      problems.push(`treg 잔액 부족: $${usd.toFixed(4)} 남음`);
    }
  } catch (e) {}
}

if (problems.length > 0) {
  await notifyKakaoProblem(`트렌드 갱신 점검 필요 (${okCount}/${INDUSTRIES.length} 성공)\n- ${problems.join('\n- ')}`);
}
if (!okCount) {
  console.log('받은 업종이 없어 파일을 바꾸지 않습니다');
  process.exit(0);
}
await writeFile(OUT, JSON.stringify(out, null, 1) + '\n');
console.log('saved', okCount, 'industries');
