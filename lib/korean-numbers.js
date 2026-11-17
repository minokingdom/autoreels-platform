/**
 * 성우(TTS)용 한국어 숫자 읽기 보정
 * "4대"를 "사대"가 아니라 "네 대"로 읽도록, 고유어로 세는 단위 앞의 숫자(1~99)를 한글로 바꿉니다.
 * 화면 자막은 그대로 두고 성우에게 보내는 문장에만 적용합니다.
 */

const ONES = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
const TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];

// 고유어 수사로 세는 단위 (긴 것부터 검사)
const COUNTERS = ['번째', '시간', '군데', '가지', '마리', '켤레', '대', '개', '명', '살', '장', '잔', '병', '곳', '컷', '분'];

function toNativeKorean(n) {
  if (n < 1 || n > 99) return null;
  if (n === 20) return '스무';
  return TENS[Math.floor(n / 10)] + ONES[n % 10];
}

// "30대 여성"처럼 나이대를 뜻하는 경우 뒤에 오는 말
const AGE_FOLLOWERS = /^\s?(여성|남성|여자|남자|직장인|고객|부부|주부|아빠|엄마|가장|초반|중반|후반|분들|사회초년생|이상|이하|부터|까지|에게|들이|들에게|인데|라면|도|가 |이 |의 )/;

// "-20%" -> "20프로 할인", "+" -> 쉼표, "%" -> "프로" 등 성우가 어색하게 읽는 기호를 자연스러운 한국어로 보정
function softenSymbols(text) {
  let out = String(text);
  // "-20%", "-20% 할인", "-30프로" → "20프로 할인" (숫자 범위 10-20%나 전화번호는 건드리지 않음)
  out = out.replace(/(^|[\s(,.:!?"'\[])-\s*([0-9]+(?:\.[0-9]+)?)\s*(%|프로|퍼센트)(\s*(?:즉시\s*|추가\s*|특별\s*)?할인)?/g, (_, before, num, _u, disc) => {
    return `${before}${num}프로${disc ? disc : ' 할인'}`;
  });
  // "-480만원", "-50,000원" → "480만원 할인"
  out = out.replace(/(^|[\s(,.:!?"'\[])-\s*([0-9,]+(?:\.[0-9]+)?)\s*(만\s*원|원)(\s*(?:즉시\s*|추가\s*|특별\s*)?할인)?/g, (_, before, num, unit, disc) => {
    return `${before}${num}${unit}${disc ? disc : ' 할인'}`;
  });
  // 남은 "%" 기호 (예: "20%") → "20프로" ("이스퍼선트" 발음 방지)
  out = out.replace(/([0-9])\s*%/g, '$1프로');
  return out.replace(/\s*\+\s*/g, (m, offset, whole) => {
    const prev = whole.slice(0, offset).trim().slice(-1);
    const next = whole.slice(offset + m.length).trim().charAt(0);
    if (/[0-9]/.test(prev) && /[0-9]/.test(next)) return m;
    return prev ? ', ' : '';
  });
}

function normalizeKoreanNumbers(text) {
  text = softenSymbols(text);
  const pattern = new RegExp(`(^|[^0-9.,])([0-9]{1,2})\\s?(${COUNTERS.join('|')})`, 'g');
  return String(text).replace(pattern, (match, before, digits, counter, offset, whole) => {
    const n = Number(digits);
    const after = whole.slice(offset + match.length);

    if (counter === '개' && /^(월|년)/.test(after)) return match; // 3개월, 2개년은 "삼 개월"
    if (counter === '분' && !/^(께|들|이서|을 모시|의 고객)/.test(after)) return match; // 5분(시간)은 "오 분"
    if (counter === '대' && n % 10 === 0 && AGE_FOLLOWERS.test(after)) return match; // 30대 여성은 "삼십대"
    if (counter === '대' && /^(리점|표|한민국|형|박|출|기업|수)/.test(after)) return match; // 대리점, 대표 등 다른 낱말
    if (counter === '장' && /^(기|점|착|거리)/.test(after)) return match; // 장기렌트 등
    if (counter === '명' && /^(함|의|품|절)/.test(after)) return match; // 명함 등
    if (counter === '병' && /^(원)/.test(after)) return match;

    let word = toNativeKorean(n);
    if (!word) return match;
    if (counter === '번째' && n === 1) word = '첫';
    return `${before}${word} ${counter}`;
  });
}

module.exports = { normalizeKoreanNumbers, softenSymbols };
