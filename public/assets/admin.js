'use strict';

const byId = id => document.getElementById(id);
const login = byId('adminLogin');
const keyInput = byId('adminKey');
const logout = byId('adminLogout');
const dashboard = byId('adminDashboard');
const filter = byId('industryFilter');
const refresh = byId('refreshAdmin');
const previous = byId('previousPage');
const next = byId('nextPage');
const output = byId('specialtyRows');
const industries = Object.fromEntries(Object.entries(window.AR_LP_INDUSTRIES || {}).filter(([code]) => code !== 'personal'));
const results = {
  started: '시도 기록됨',
  collected: '수집 완료',
  empty: '관련 결과 없음',
  failed: '수집 실패'
};
const params = new URLSearchParams(location.search);
let page = Math.min(10000, Math.max(1, Number.parseInt(params.get('page'), 10) || 1));
let pending = false;
let hasNext = false;
const kstDateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short'
});
const kstDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' });
let loadedCollections = false;

function dateTime(value) {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? kstDateTime.format(timestamp) : '시각 미기록';
}

function renderSpecialtyRun(run) {
  const status = byId('specialtyRunStatus');
  if (!run) {
    status.textContent = '아직 실행 기록이 없습니다.';
    return;
  }
  if (run.status === 'running') {
    const expired = Date.now() - Date.parse(run.started_at) > 120000;
    status.textContent = dateTime(run.started_at) + (expired ? ' 시작 · 완료 기록 없음' : ' 시작 · 수집 중');
    return;
  }
  if (run.status === 'failed') {
    status.textContent = dateTime(run.finished_at) + ' · 배치 오류';
    return;
  }
  if (!run.attempted) {
    status.textContent = dateTime(run.finished_at) + ' · 이 회차에 수집할 업종 없음';
    return;
  }
  const empty = Math.max(0, run.attempted - run.collected - run.failed);
  status.textContent = dateTime(run.finished_at) + ' · ' + run.attempted + '개 시도, '
    + run.collected + '개 수집, ' + empty + '개 결과 없음, ' + run.failed + '개 실패';
}

function renderSharedTrends(snapshot) {
  const entries = Object.entries(snapshot.industries || {});
  const active = entries.filter(([, row]) => !row.stale && row.keywords?.length).length;
  const dateLabel = snapshot.date === kstDate.format(new Date()) ? '오늘 결과' : '이전 날짜 결과';
  byId('sharedTrendStatus').textContent = snapshot.date
    ? snapshot.date + ' 기준 · ' + active + '/' + Object.keys(industries).length + '개 업종 갱신 · ' + dateLabel
      + (snapshot.updatedAt ? ' · 파일 갱신 ' + dateTime(snapshot.updatedAt) : '')
    : '배포된 공통 키워드 기록이 없습니다.';
  const list = byId('sharedTrendRows');
  list.replaceChildren();
  for (const [code, industry] of Object.entries(industries)) {
    const row = snapshot.industries?.[code];
    const item = document.createElement('div');
    const name = document.createElement('dt');
    const words = document.createElement('dd');
    name.textContent = industry.name + (row?.stale ? ' · 이전 결과 유지' : '');
    words.textContent = row?.keywords?.length ? row.keywords.join(' · ') : '키워드 기록 없음';
    item.append(name, words);
    list.append(item);
  }
}

function renderCollectedStyles(styles) {
  const dateRank = style => Date.parse(style.addedAt || '') || 0;
  const sorted = styles.slice().sort((a, b) => dateRank(b) - dateRank(a));
  const now = Date.now();
  const newCount = sorted.filter(style => dateRank(style) <= now && now - dateRank(style) < 7 * 86400000).length;
  byId('styleCollectionStatus').textContent = '참조 스타일 ' + sorted.length + '개 등록 · 신규 ' + newCount + '개'
    + (sorted.length && dateRank(sorted[0]) ? ' · 최근 등록 ' + dateTime(sorted[0].addedAt) : '');
  const list = byId('collectedStyleRows');
  list.replaceChildren();
  for (const style of sorted) {
    const row = document.createElement('li');
    row.textContent = style.name + ' · ' + style.category + ' · ' + dateTime(style.addedAt);
    list.append(row);
  }
}

async function readPublishedFile(path) {
  const response = await fetch(path, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error('파일을 읽지 못했습니다.');
  return response.json();
}

async function loadCollections() {
  const [trends, styles] = await Promise.allSettled([
    readPublishedFile('/trends-today.json').then(renderSharedTrends),
    readPublishedFile('/assets/reference-styles.json').then(renderCollectedStyles)
  ]);
  if (trends.status === 'rejected') {
    byId('sharedTrendStatus').textContent = '공통 키워드 파일을 불러오지 못했습니다.';
    byId('sharedTrendRows').replaceChildren();
  }
  if (styles.status === 'rejected') {
    byId('styleCollectionStatus').textContent = '스타일 목록을 불러오지 못했습니다.';
    byId('collectedStyleRows').replaceChildren();
  }
  loadedCollections = trends.status === 'fulfilled' && styles.status === 'fulfilled';
}

for (const [code, item] of Object.entries(industries)) filter.add(new Option(item.name, code));
filter.value = Object.hasOwn(industries, params.get('industry')) ? params.get('industry') : '';

function message(text, error = false) {
  const node = byId('adminMessage');
  node.textContent = text;
  node.toggleAttribute('data-error', error);
}

function showLogin() {
  login.hidden = false;
  dashboard.hidden = true;
  logout.hidden = true;
  refresh.hidden = true;
  loadedCollections = false;
  output.replaceChildren();
  for (const id of ['accountsCount', 'configuredCount', 'specialtiesCount']) byId(id).textContent = '–';
  hasNext = false;
}

function setPending(value) {
  pending = value;
  const controls = [keyInput, login.querySelector('button'), logout, filter, refresh];
  for (const control of controls) control.disabled = value;
  previous.disabled = value || page <= 1;
  next.disabled = value || !hasNext;
}

function updateUrl() {
  const url = new URL(location.href);
  if (filter.value) url.searchParams.set('industry', filter.value);
  else url.searchParams.delete('industry');
  if (page > 1) url.searchParams.set('page', String(page));
  else url.searchParams.delete('page');
  history.replaceState(null, '', url);
}

async function request(action, body, query) {
  const url = new URL('/api/account', location.origin);
  url.searchParams.set('action', action);
  for (const [key, value] of Object.entries(query || {})) url.searchParams.set(key, value);
  const options = { cache:'no-store' };
  if (body !== undefined) {
    options.method = 'POST';
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  return { status:response.status, body:await response.json() };
}

function renderRows(data) {
  byId('accountsCount').textContent = data.summary.accounts.toLocaleString('ko-KR');
  byId('configuredCount').textContent = data.summary.configured.toLocaleString('ko-KR');
  byId('specialtiesCount').textContent = data.summary.specialties.toLocaleString('ko-KR');
  output.replaceChildren();
  for (const row of data.rows) {
    const tr = output.insertRow();
    const status = Object.hasOwn(results, row.last_result) ? results[row.last_result]
      : row.attempted_day ? '이전 수집 기록' : '수집 대기';
    const values = [industries[row.industry]?.name || row.industry, row.specialty, row.accounts,
      row.attempted_day || '–', status, row.fresh ? (row.keywords || []).join(' · ') : '–'];
    for (const value of values) tr.insertCell().textContent = value;
    tr.cells[4].dataset.result = row.last_result || '';
  }
  if (data.rows.length === 0) {
    const cell = output.insertRow().insertCell();
    cell.colSpan = 6;
    cell.textContent = '이 페이지에 표시할 세부 업종이 없습니다.';
  }
  byId('pageLabel').textContent = page + '페이지';
  hasNext = data.hasNext;
  login.hidden = true;
  dashboard.hidden = false;
  logout.hidden = false;
  refresh.hidden = false;
  renderSpecialtyRun(data.lastRun);
}

async function loadDashboard(reloadCollections = false) {
  const result = await request('admin-specialties', undefined, {industry:filter.value, page});
  if (result.status === 401) {
    showLogin();
    message('관리자 키로 로그인해 주세요.');
    return;
  }
  if (!result.body.ok) throw new Error(result.body.message || '운영 현황을 불러오지 못했습니다.');
  renderRows(result.body);
  updateUrl();
  message('');
  if (!loadedCollections || reloadCollections) await loadCollections();
}

async function run(task) {
  if (pending) return;
  setPending(true);
  try {
    await task();
  } catch (error) {
    if (login.hidden && dashboard.hidden) showLogin();
    message(error instanceof TypeError || error instanceof SyntaxError ? '서버에 연결하지 못했습니다. 다시 시도해 주세요.' : error.message, true);
  } finally {
    setPending(false);
  }
}

login.addEventListener('submit', event => {
  event.preventDefault();
  void run(async () => {
    const token = keyInput.value;
    keyInput.value = '';
    const result = await request('admin-console-login', { token });
    if (!result.body.ok) throw new Error(result.body.message || '관리자 로그인에 실패했습니다.');
    await loadDashboard();
  });
});

logout.addEventListener('click', () => void run(async () => {
  const result = await request('admin-console-logout', {});
  if (!result.body.ok) throw new Error('로그아웃하지 못했습니다. 다시 시도해 주세요.');
  showLogin();
  message('로그아웃했습니다.');
}));

filter.addEventListener('change', () => void run(async () => {
  page = 1;
  await loadDashboard();
}));
refresh.addEventListener('click', () => void run(() => loadDashboard(true)));
previous.addEventListener('click', () => void run(async () => {
  page--;
  await loadDashboard();
}));
next.addEventListener('click', () => void run(async () => {
  page++;
  await loadDashboard();
}));
void run(loadDashboard);
