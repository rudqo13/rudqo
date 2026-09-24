/* 차트의 이유 · 머피 학습관 — 프레임워크 무관 바닐라 JS. data/*.json 만 읽음 */
const FILES = ['concepts_ch4', 'patterns', 'candles', 'volume_oi', 'indicators', 'rules'];
const D = {};
const LS = 'murphy_learn_v1';
const st = JSON.parse(localStorage.getItem(LS) || '{"done":{},"wrong":{}}');
const save = () => localStorage.setItem(LS, JSON.stringify(st));
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pg = p => p == null ? '' : `p.${Array.isArray(p) ? p.join('–') : p}`;
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

/* ---------- 데이터 → 공통 학습 아이템 ---------- */
let ITEMS = [];
function build() {
  const it = [];
  D.concepts_ch4.concepts.forEach(c => it.push({ key: 'c:' + c.id, mod: 'trend', ch: 4, title: c.term, sub: c.definition, tags: [c.type], raw: c }));
  D.patterns.patterns.forEach(p => it.push({ key: 'p:' + p.id, mod: 'pattern', ch: p.chapter, title: p.name_ko, sub: p.name_en, tags: [p.category === 'reversal' ? '반전형' : '지속형', p.direction], dir: p.direction, raw: p }));
  D.candles.patterns.forEach(k => it.push({ key: 'k:' + k.id, mod: 'candle', ch: 12, title: k.name_ko, sub: k.rule, tags: [`${k.candles}봉`, k.direction], dir: k.direction, raw: k }));
  (D.volume_oi.concepts || []).concat(D.volume_oi.indicators || []).forEach(v => it.push({ key: 'v:' + v.id, mod: 'volume', ch: 7, title: v.term || v.name_ko || v.id, sub: v.definition || v.rule || '', tags: [], raw: v }));
  D.indicators.indicators.forEach(i => it.push({ key: 'i:' + i.id, mod: 'indicator', ch: i.chapter, title: i.name_ko || i.id, sub: i.name_en || '', tags: [`${i.chapter}장`], raw: i }));
  ITEMS = it;
}
const MODS = [
  ['home', '로드맵'], ['trend', '4장 추세'], ['pattern', '5·6장 차트패턴'], ['volume', '7장 거래량'],
  ['indicator', '9·10장 지표'], ['candle', '12장 캔들'], ['rules', '16장 매매원칙'], ['quiz', '퀴즈'], ['wrong', '오답노트']
];
let cur = 'home';

/* ---------- 범용 필드 렌더러 (JSON 구조가 조금 달라도 동작) ---------- */
const LABEL = {
  definition: '정의', rules: '규칙', code_hint: '구현 힌트', reliability: '신뢰도', prerequisite: '선행 조건', structure: '구조',
  detection_rules: '탐지 규칙', volume_rule: '거래량', confirmation: '확인', target: '목표가', pullback: '되돌림', invalidation: '무효화',
  trading_note: '매매 노트', summary_checklist: '체크리스트', related: '관련', formula: '공식', params: '기본 파라미터',
  source_price_options: '가격 선택', criticism: '한계', code_js: 'JS 코드', rule: '규칙', chart: '차트 표시', signals: '신호',
  interpretation: '해석', usage: '활용', kr_note: '국내 적용 메모', human: '사람이 판단', code: '코드로 판정'
};
const SKIP = new Set(['id', 'term', 'name_ko', 'name_en', 'page', 'chapter', 'quiz', 'type', 'category', 'direction', 'candles', 'def_source']);
function val(v) {
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? '예' : '아니오';
  if (typeof v !== 'object') return esc(v);
  if (Array.isArray(v)) return '<ul>' + v.map(x => '<li>' + (typeof x === 'object' && x ? Object.values(x).map(esc).join(' · ') : esc(x)) + '</li>').join('') + '</ul>';
  return '<ul>' + Object.entries(v).map(([k, x]) => `<li><span class="muted">${esc(LABEL[k] || k)}</span> ${typeof x === 'object' ? val(x) : esc(x)}</li>`).join('') + '</ul>';
}
function fields(o) {
  return Object.entries(o).filter(([k]) => !SKIP.has(k)).map(([k, v]) =>
    k.startsWith('code') && typeof v === 'string' ? `<div class="sec"><b>${LABEL[k] || k}</b><pre>${esc(v)}</pre></div>`
      : `<div class="sec"><b>${esc(LABEL[k] || k)}</b>${val(v)}</div>`).join('');
}
const dirTag = t => t === 'bull' || t === 'bullish' ? '<span class="tag bull">상승</span>' : t === 'bear' || t === 'bearish' ? '<span class="tag bear">하락</span>' : t ? `<span class="tag">${esc(t)}</span>` : '';

/* ---------- 화면 ---------- */
function progress() {
  const n = ITEMS.length, d = ITEMS.filter(i => st.done[i.key]).length;
  $('#prog').innerHTML = `<i style="width:${n ? d / n * 100 : 0}%"></i>`;
  return [d, n];
}
function tabs() {
  $('#tabs').innerHTML = MODS.map(([k, n]) => `<button class="${k === cur ? 'on' : ''}" data-m="${k}">${n}</button>`).join('');
  $('#tabs').onclick = e => { const m = e.target.dataset.m; if (m) go(m); };
}
function go(m) { cur = m; $('#q').value = ''; tabs(); render(); scrollTo(0, 0); }
function cards(list) {
  return '<div class="grid">' + list.map(i => `<div class="card" data-k="${i.key}">
    <h3>${esc(i.title)}</h3><p>${esc(String(i.sub).slice(0, 70))}</p>
    <div style="margin-top:6px">${i.tags.map(t => t === 'bull' || t === 'bear' || t === 'bullish' || t === 'bearish' ? dirTag(t) : `<span class="tag">${esc(t)}</span>`).join('')}
    ${st.done[i.key] ? '<span class="tag done">완료</span>' : ''}</div></div>`).join('') + '</div>';
}
function bindCards() { document.querySelectorAll('.card[data-k]').forEach(c => c.onclick = () => detail(c.dataset.k)); }

function render() {
  const app = $('#app'); const [d, n] = progress();
  if (cur === 'home') {
    const steps = MODS.slice(1, 7).map(([k, nm]) => {
      const L = ITEMS.filter(i => i.mod === k), dd = L.filter(i => st.done[i.key]).length;
      return `<div class="card" data-m="${k}"><h3>${nm}</h3><p>${L.length ? `${dd}/${L.length} 학습` : '원칙·자금관리'}</p></div>`;
    }).join('');
    app.innerHTML = `<h1>학습 로드맵 <span class="muted" style="font-size:14px">${d}/${n} 완료</span></h1>
      <p class="muted">머피가 권하는 순서: 추세 → 차트패턴 → 거래량 확인 → 지표 → 캔들 → 매매원칙. 개념을 읽고 “학습 완료”를 누른 뒤 퀴즈로 확인하세요.</p>
      <div class="grid">${steps}</div>`;
    app.querySelectorAll('.card[data-m]').forEach(c => c.onclick = () => go(c.dataset.m));
    return;
  }
  if (cur === 'rules') return rulesView();
  if (cur === 'quiz') return quiz(ITEMS.filter(i => st.done[i.key]).length >= 4 ? ITEMS.filter(i => st.done[i.key]) : ITEMS);
  if (cur === 'wrong') {
    const L = ITEMS.filter(i => st.wrong[i.key]);
    app.innerHTML = `<h1>오답노트 (${L.length})</h1>` + (L.length ? cards(L) + '<div class="row"><button id="rq">오답만 다시 풀기</button></div>' : '<p class="muted">아직 틀린 문제가 없어요.</p>');
    bindCards(); const b = $('#rq'); if (b) b.onclick = () => quiz(L); return;
  }
  const L = ITEMS.filter(i => i.mod === cur);
  let extra = '';
  if (cur === 'pattern') extra = sec('공통 원칙', D.patterns.common_rules) + sec('돌파 필터', D.patterns.breakout_filters);
  if (cur === 'candle') extra = sec('캔들 기초', D.candles.basics) + sec('필터 캔들', D.candles.filtered_candles);
  if (cur === 'volume') extra = sec('요약 원칙', D.volume_oi.summary_rules) + sec('가격·거래량 매트릭스', D.volume_oi.rules_tables);
  if (cur === 'indicator') extra = sec('지표 사용 원칙', D.indicators.principles) + sec('역발상', D.indicators.contrary_opinion);
  app.innerHTML = `<h1>${MODS.find(m => m[0] === cur)[1]} <span class="muted" style="font-size:14px">${L.length}개</span></h1>${cards(L)}${extra}`;
  bindCards();
}
const sec = (t, v) => v ? `<details class="detail sec" style="margin-top:12px"><summary><b style="display:inline">${t}</b></summary>${val(v)}</details>` : '';

function detail(key) {
  const i = ITEMS.find(x => x.key === key), r = i.raw;
  $('#app').innerHTML = `<div class="detail">
    <button id="back">← 목록</button>
    <h2 style="margin-top:12px">${esc(i.title)}</h2>
    <div class="muted">${esc(r.name_en || '')} ${i.ch ? `· ${i.ch}장` : ''} ${pg(r.page)} ${dirTag(i.dir)}</div>
    ${fields(r)}
    <div class="row"><button id="dn" class="${st.done[key] ? 'on' : ''}">${st.done[key] ? '✓ 학습 완료' : '학습 완료 표시'}</button>
    <button id="qz">이 개념 퀴즈</button></div></div>`;
  $('#back').onclick = () => render();
  $('#dn').onclick = () => { st.done[key] ? delete st.done[key] : st.done[key] = 1; save(); detail(key); progress(); };
  $('#qz').onclick = () => quiz([i], 1);
  scrollTo(0, 0);
}

function rulesView() {
  const R = D.rules;
  const g = (R.trading_guidelines || []).find(x => x.items) || {};
  const sim = R.sim_engine_rules || {};
  $('#app').innerHTML = `<h1>16장 매매원칙 · 자금관리</h1>
    <div class="detail"><b style="color:var(--gold)">머피의 매매 20원칙 ${pg(g.page)}</b>
    <ol>${(g.items || []).map(x => `<li>${esc(x.rule)}</li>`).join('')}</ol></div>
    <div class="detail" style="margin-top:12px"><b style="color:var(--gold)">모의매매 자가점검 (R01~)</b>
    <p class="muted">${esc(sim.note || '')}</p>
    ${['pre_trade', 'in_trade', 'post_trade'].filter(k => sim[k]).map(k => `<div class="sec"><b>${k}</b><ul>${sim[k].map(x => `<li><code>${esc(x.id)}</code> ${esc(x.msg)} <span class="tag ${x.severity === 'block' ? 'bull' : ''}">${esc(x.severity || '')}</span></li>`).join('')}</ul></div>`).join('')}</div>
    ${sec('매매의 3요소', R.three_elements)}${sec('자금관리', R.money_management)}${sec('매매 전술', R.trading_tactics)}${sec('주문 종류', R.order_types)}${sec('당일매매', R.intraday)}`;
}

/* ---------- 퀴즈: 원본 OX + 데이터 기반 자동 생성 ---------- */
function makeQs(pool) {
  const Q = [];
  pool.forEach(i => {
    (i.raw.quiz || []).forEach(q => q.type === 'OX' && Q.push({ key: i.key, q: q.q, opts: ['O', 'X'], a: q.a ? 'O' : 'X', ex: i.title }));
    const same = ITEMS.filter(x => x.mod === i.mod && x.key !== i.key);
    if (i.sub && same.length >= 3) // 설명 → 이름 맞히기
      Q.push({ key: i.key, q: `다음 설명에 해당하는 것은?\n“${String(i.sub).slice(0, 120)}”`, opts: shuffle([i.title, ...shuffle(same).slice(0, 3).map(x => x.title)]), a: i.title, ex: `${i.title} ${pg(i.raw.page)}` });
    if (i.dir && /bull|bear/.test(i.dir)) // 방향 맞히기
      Q.push({ key: i.key, q: `“${i.title}”은(는) 어떤 신호인가?`, opts: ['상승 신호', '하락 신호'], a: /bull/.test(i.dir) ? '상승 신호' : '하락 신호', ex: i.sub });
    if (i.mod === 'pattern' && i.raw.category) // 반전/지속
      Q.push({ key: i.key, q: `“${i.title}”은(는) 반전형인가 지속형인가?`, opts: ['반전형', '지속형'], a: i.raw.category === 'reversal' ? '반전형' : '지속형', ex: `${i.raw.chapter}장 ${pg(i.raw.page)}` });
  });
  return shuffle(Q);
}
function quiz(pool, single) {
  const Q = makeQs(pool).slice(0, single ? 5 : 10); let n = 0, score = 0;
  const app = $('#app');
  if (!Q.length) { app.innerHTML = '<p class="muted">출제할 문제가 없어요.</p>'; return; }
  const show = () => {
    if (n >= Q.length) {
      app.innerHTML = `<div class="detail"><h2>결과 ${score}/${Q.length}</h2><div class="row"><button id="again">다시</button><button id="w">오답노트</button></div></div>`;
      $('#again').onclick = () => quiz(pool, single); $('#w').onclick = () => go('wrong'); return;
    }
    const q = Q[n];
    app.innerHTML = `<div class="detail quiz"><div class="muted">${n + 1} / ${Q.length}</div>
      <h3 style="white-space:pre-line">${esc(q.q)}</h3>${q.opts.map(o => `<button class="opt">${esc(o)}</button>`).join('')}<div id="fb"></div></div>`;
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = b.textContent === q.a;
      app.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.textContent === q.a) x.classList.add('ok'); });
      if (!ok) b.classList.add('no');
      ok ? (score++, delete st.wrong[q.key]) : st.wrong[q.key] = 1; save();
      $('#fb').innerHTML = `<p class="muted">${ok ? '정답!' : '오답'} — ${esc(q.ex)}</p><div class="row"><button id="nx">다음 →</button><button id="see">개념 보기</button></div>`;
      $('#nx').onclick = () => { n++; show(); }; $('#see').onclick = () => detail(q.key);
    });
  };
  show();
}

/* ---------- 검색 ---------- */
$('#q').oninput = e => {
  const s = e.target.value.trim().toLowerCase(); if (!s) return render();
  const L = ITEMS.filter(i => (i.title + ' ' + i.sub + ' ' + JSON.stringify(i.raw)).toLowerCase().includes(s));
  $('#app').innerHTML = `<h1>“${esc(s)}” 검색 결과 ${L.length}</h1>` + cards(L); bindCards();
};

/* ---------- 외부 연동: 기존 차트 화면에서 호출 ---------- */
// 예) 차트에서 패턴 감지 시: window.MurphyLearn.open('p:head_and_shoulders_top')
window.MurphyLearn = { open: k => (ITEMS.length ? detail(k) : (location.hash = k)), items: () => ITEMS, data: D };

const BASE = document.currentScript?.src.replace(/learn\.js.*$/, '') || './';
Promise.all(FILES.map(f => fetch(`${BASE}data/${f}.json`).then(r => r.json()).then(j => D[f] = j)))
  .then(() => { build(); tabs(); const h = decodeURIComponent(location.hash.slice(1)); h && ITEMS.some(i => i.key === h) ? detail(h) : render(); })
  .catch(e => $('#app').innerHTML = `<p>데이터 로드 실패: ${esc(e.message)}<br>로컬에서는 파일 직접 열기 대신 <code>npx serve</code> 등으로 실행하세요.</p>`);
