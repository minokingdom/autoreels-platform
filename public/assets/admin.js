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
const industries = window.AR_LP_INDUSTRIES || {};
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
}

async function loadDashboard() {
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
refresh.addEventListener('click', () => void run(loadDashboard));
previous.addEventListener('click', () => void run(async () => {
  page--;
  await loadDashboard();
}));
next.addEventListener('click', () => void run(async () => {
  page++;
  await loadDashboard();
}));
void run(loadDashboard);
