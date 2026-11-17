/* ============================================================
   Prakriyā — study app logic.
   Family = colour. Type the answer, check it, see what's right.
   Every form comes from data/ (Vidyut). Nothing is invented here.
   ============================================================ */

const $ = (s) => document.querySelector(s);
const DEV = (s) => String(s ?? '');

/* ---------- state ---------- */
const S = {
  index: null,
  famCache: {},
  mode: 'family',
  filter: null,          // family id, or null for all
  q: null,               // current question
  answered: false,
  stats: null,
};

const SKEY = 'prakriya-v2';

function loadStats() {
  try {
    const s = JSON.parse(localStorage.getItem(SKEY) || '{}');
    return {
      streak: s.streak || 0,
      total: s.total || 0,
      right: s.right || 0,
      fam: s.fam || {},           // famId -> {t, r}
    };
  } catch { return { streak: 0, total: 0, right: 0, fam: {} }; }
}
function saveStats() { try { localStorage.setItem(SKEY, JSON.stringify(S.stats)); } catch {} }

/* ---------- text helpers ---------- */
const NFC = (s) => String(s || '').normalize('NFC').trim().replace(/\s+/g, ' ');
const low = (s) => NFC(s).toLowerCase();
const strip = (s) => low(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

/* LCS diff: mark which characters of `got` matched `want`. */
function diffMarks(got, want) {
  const a = [...low(got)], b = [...low(want)];
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const marks = new Array(m).fill(false);
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { marks[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { i++; }
    else { j++; }
  }
  return marks;
}

/* ---------- data ---------- */
async function loadIndex() {
  const r = await fetch('data/index.json');
  S.index = await r.json();
}
async function loadFamily(id, force) {
  if (S.famCache[id] && !force) return S.famCache[id];
  const f = S.index.families.find((x) => x.id === id);
  const r = await fetch(f.file);
  const doc = await r.json();
  S.famCache[id] = doc;
  return doc;
}
function stemById(id) { return S.index.stems.find((s) => s.id === id); }
function familyOf(stem) { return S.index.families.find((f) => f.id === stem.family); }

function cellOf(doc, stemId, vib, vac) {
  return doc?.stems?.[stemId]?.paradigm?.[vib]?.[vac] || null;
}

/* every real analysis of a form for a stem */
function analysesOf(doc, stemId, iast) {
  const out = [];
  const p = doc?.stems?.[stemId]?.paradigm;
  if (!p) return out;
  for (const [vib, row] of Object.entries(p)) {
    for (const [vac, c] of Object.entries(row)) {
      if (c.status === 'DERIVED' && low(c.iast) === low(iast)) out.push([vib, vac]);
    }
  }
  return out;
}

/* ---------- question generation ---------- */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function pool() {
  const stems = S.index.stems.filter((s) => !S.filter || s.family === S.filter);
  return stems.length ? stems : S.index.stems;
}

async function makeQuestion() {
  let type = S.mode;
  if (type === 'mix') type = pick(['family', 'build', 'reverse']);

  const stem = pick(pool());
  const doc = await loadFamily(stem.family);
  const vib = pick(S.index.vibhakti);
  const vac = pick(S.index.vacana);

  if (type === 'family') {
    return {
      type, stem, doc,
      answer: familyOf(stem).label,
      family: familyOf(stem),
    };
  }

  const c = cellOf(doc, stem.id, vib.id, vac.id);
  if (!c || c.status !== 'DERIVED') return makeQuestion();  // closed world: skip blocked

  if (type === 'build') {
    return {
      type, stem, doc, vib, vac,
      cell: c,
      answer: c.iast,
      family: familyOf(stem),
    };
  }

  // reverse
  const all = analysesOf(doc, stem.id, c.iast);
  return {
    type, stem, doc, vib, vac,
    cell: c,
    answer: c.iast,
    analyses: all.length ? all : [[vib.id, vac.id]],
    family: familyOf(stem),
  };
}

/* ---------- grading ---------- */
const VIB_ALIAS = {
  prathama: ['prathama', 'nominative', 'nom'], dvitiya: ['dvitiya', 'accusative', 'acc', 'obj'],
  tritiya: ['tritiya', 'instrumental', 'instr', 'inst'], caturthi: ['caturthi', 'dative', 'dat'],
  pancami: ['pancami', 'ablative', 'abl'], sasthi: ['sasthi', 'genitive', 'gen'],
  saptami: ['saptami', 'locative', 'loc'], sambodhana: ['sambodhana', 'vocative', 'voc'],
};
const VAC_ALIAS = {
  eka: ['eka', 'ekavacana', 'singular', 'sg'], dvi: ['dvi', 'dvivacana', 'dual', 'du'],
  bahu: ['bahu', 'bahuvacana', 'plural', 'pl'],
};

function classify(text) {
  const t = ' ' + strip(text) + ' ';
  let vib = null, vac = null;
  for (const [id, al] of Object.entries(VIB_ALIAS)) {
    if (al.some((a) => t.includes(' ' + a + ' '))) { vib = id; break; }
  }
  for (const [id, al] of Object.entries(VAC_ALIAS)) {
    if (al.some((a) => t.includes(' ' + a + ' '))) { vac = id; break; }
  }
  return { vib, vac };
}

function familyMatch(input) {
  const t = strip(input);
  if (!t) return false;
  const fams = S.index.families;
  const exact = fams.filter((f) => strip(f.label) === t || strip(f.id) === t);
  if (exact.length === 1) return true;
  // unique containment (min 5 chars) so "masculine" alone fails but "short a masc" passes
  if (t.length >= 5) {
    const hits = fams.filter((f) => strip(f.label).includes(t) || t.includes(strip(f.label)));
    if (hits.length === 1) return true;
  }
  // attribute-only input, accepted when exactly one family in the *pool* has it
  const poolFams = new Set(pool().map((s) => s.family));
  if (Object.keys(VIB_ALIAS).length && t.split(' ').length === 1) {
    const cand = fams.filter((f) => poolFams.has(f.id) && strip(f.label).includes(t));
    if (cand.length === 1) return true;
  }
  return false;
}

function grade(q, input) {
  if (q.type === 'family') return familyMatch(input) ? 'ok' : 'bad';
  if (q.type === 'build') {
    if (low(input) === low(q.answer)) return 'ok';
    if (strip(input) === strip(q.answer) && strip(input).length > 0) return 'loose';
    return 'bad';
  }
  // reverse: accept any true analysis
  const { vib, vac } = classify(input);
  if (!vib || !vac) return 'bad';
  return q.analyses.some(([v, w]) => v === vib && w === vac) ? 'ok' : 'bad';
}

/* ---------- render ---------- */
function setColour(hex) { document.documentElement.style.setProperty('--fc', hex); }

function renderRail() {
  const host = $('#famlist');
  host.innerHTML = '';
  const accOf = (id) => {
    const f = S.stats.fam[id];
    return f && f.t ? Math.round((f.r / f.t) * 100) : null;
  };
  for (const f of S.index.families) {
    const b = document.createElement('button');
    b.className = 'fam' + (S.filter === f.id ? ' on' : '');
    b.style.setProperty('--fc', f.colour);
    b.dataset.fam = f.id;
    const a = accOf(f.id);
    b.innerHTML = `<span class="dot"></span>
      <span class="fl"><b>${f.label}</b><small>${f.stems.length} stem${f.stems.length > 1 ? 's' : ''}</small></span>
      <span class="pct">${a === null ? '' : a + '%'}</span>
      <span class="bar"><i style="width:${a === null ? 0 : a}%"></i></span>`;
    b.onclick = async () => {
      if (S.q && S.q.type === 'family' && !S.answered) {
        $('#input').value = f.label;
        check();
        return;
      }
      S.filter = S.filter === f.id ? null : f.id;
      renderRail();
      newQuestion();
    };
    host.appendChild(b);
  }
}

function renderPrompt(q) {
  setColour(q.family.colour);
  const isRev = q.type === 'reverse';
  if (isRev) {
    $('#p-deva').textContent = q.cell.deva;
    $('#p-iast').textContent = q.cell.iast;
    $('#p-gloss').textContent = q.stem.gloss;
  } else {
    $('#p-deva').textContent = q.stem.deva;
    $('#p-iast').textContent = q.stem.iast;
    $('#p-gloss').textContent = q.stem.gloss;
  }
  const ask = {
    family: 'Which family does this stem belong to?',
    build: `Give the ${q.vib?.en} ${q.vac?.en}`,
    reverse: 'Which case and number is this form?',
  }[q.type];
  $('#p-ask').textContent = ask;

  const tags = [];
  if (q.type === 'family') {
    tags.push(`<span class="tag">type the family, or click its colour</span>`);
  }
  if (q.type === 'build') {
    tags.push(`<span class="tag case">${q.vib.en}</span>`);
    tags.push(`<span class="tag num">${q.vac.en}</span>`);
    tags.push(`<span class="tag">${q.vib.question}</span>`);
  }
  if (q.type === 'reverse') {
    tags.push(`<span class="tag">more than one answer may be right</span>`);
  }
  $('#p-tags').innerHTML = tags.join('');
}

function renderLegend() {
  $('#legend').innerHTML = S.index.families.map((f) =>
    `<li><i style="background:${f.colour}"></i><b>${f.label}</b>
     <span class="lw">${f.deva}</span></li>`).join('');
}

function renderGrid(q) {
  const host = $('#grid');
  if (!q.vib || !q.doc) { host.innerHTML = ''; return; }
  const p = q.doc.stems[q.stem.id].paradigm;
  let html = '<div class="gh"></div>' + S.index.vacana.map((w) => `<div class="gh">${w.en.slice(0, 3)}</div>`).join('');
  for (const v of S.index.vibhakti) {
    html += `<div class="gc">${v.en.slice(0, 5)}</div>`;
    for (const w of S.index.vacana) {
      const c = p[v.id]?.[w.id];
      const hit = q.type === 'build'
        ? (v.id === q.vib.id && w.id === q.vac.id)
        : (q.analyses || []).some(([a, b]) => a === v.id && b === w.id);
      const txt = c && c.status === 'DERIVED' ? c.iast : '—';
      html += `<div class="cell ${hit ? 'hit' : ''}" title="${txt}">${txt}</div>`;
    }
  }
  host.innerHTML = html;
}

function renderTrace(q) {
  const box = $('#trace');
  const c = q.cell || (q.doc && q.type === 'family' ? null : null);
  if (!c) {
    // family question: explain the family, not a derivation
    box.innerHTML = `<div class="tr" data-r="class"><span class="c">class</span>
      <span>${q.family.label}</span><span class="a">${q.family.deva} · ${q.family.note}</span></div>`;
    return;
  }
  let html = c.steps.map(([code, after, role]) => {
    const txt = (S.index.sutra_map || {})[code] || '';
    return `<div class="tr" data-r="${role}"><span class="c">${code}</span>
      <span>${txt}</span><span class="a">${after}</span></div>`;
  }).join('');
  box.innerHTML = html;
}

function renderFeedback(q, verdict, input) {
  $('#fb-empty').hidden = true;
  $('#fb-body').hidden = false;

  const v = $('#verdict');
  v.className = 'verdict ' + (verdict === 'bad' ? 'bad' : 'ok');
  v.textContent = verdict === 'ok' ? 'Correct'
    : verdict === 'loose' ? 'Close — diacritics'
    : 'Not quite';

  if (q.type === 'family') {
    $('#correct').innerHTML = `<span>${q.family.label}</span>`;
    $('#yours').innerHTML = `<span class="lbl">you wrote</span>${input ? escapeHtml(input) : '—'}`;
  } else if (q.type === 'build') {
    $('#correct').innerHTML = `<span class="dev">${q.cell.deva}</span><span class="ci">${q.cell.iast}</span>`;
    if (verdict === 'ok') {
      $('#yours').innerHTML = '';
    } else {
      const marks = diffMarks(input, q.answer);
      const chars = [...low(input)];
      const html = chars.map((ch, i) =>
        `<span class="${marks[i] ? 'g' : 'w'}">${escapeHtml(ch)}</span>`).join('');
      $('#yours').innerHTML = `<span class="lbl">you wrote — struck letters are wrong</span>${html || '—'}`;
    }
  } else {
    // reverse: show every valid analysis
    const list = q.analyses.map(([a, b]) => {
      const V = S.index.vibhakti.find((x) => x.id === a);
      const W = S.index.vacana.find((x) => x.id === b);
      return `${V.en} ${W.en}`;
    }).join(' · ');
    $('#correct').innerHTML = `<span class="dev">${q.cell.deva}</span><span class="ci">${q.cell.iast}</span>`;
    $('#yours').innerHTML = `<span class="lbl">${q.analyses.length > 1 ? 'all valid analyses' : 'valid analysis'}</span>${list}`;
  }

  renderGrid(q);
  renderTrace(q);
  $('#trace').hidden = true;
  $('#btn-why').textContent = 'why? show the derivation';
  $('#btn-why').hidden = false;
  $('#btn-next').hidden = false;
  $('#btn-check').hidden = true;
  $('#input').disabled = true;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function clearFeedback() {
  $('#fb-empty').hidden = false;
  $('#fb-body').hidden = true;
  $('#trace').hidden = true;
  $('#input').disabled = false;
  $('#btn-check').hidden = false;
  $('#btn-next').hidden = true;
  $('#btn-why').hidden = true;
}

/* ---------- flow ---------- */
async function newQuestion() {
  S.answered = false;
  S.q = await makeQuestion();
  clearFeedback();
  renderPrompt(S.q);
  $('#input').value = '';
  $('#input').placeholder = S.q.type === 'family' ? 'short -a masculine'
    : S.q.type === 'build' ? 'e.g. devena' : 'e.g. genitive singular';
  $('#hint').textContent = S.q.type === 'family'
    ? `${S.filter ? 'filtered: ' + S.filter : 'all 17 families'} · ${pool().length} stems in play`
    : `${S.q.stem.iast} · ${S.q.vib.en} · ${S.q.vac.en}`;
  renderRail();
  $('#input').focus();
}

function check() {
  if (!S.q || S.answered) return;
  const input = $('#input').value;
  if (!NFC(input)) { $('#hint').textContent = 'Type something first.'; return; }
  const verdict = grade(S.q, input);
  S.answered = true;

  const st = S.stats;
  st.total++;
  const fam = S.q.family.id;
  st.fam[fam] = st.fam[fam] || { t: 0, r: 0 };
  st.fam[fam].t++;
  if (verdict === 'ok') { st.right++; st.streak++; st.fam[fam].r++; }
  else st.streak = 0;
  saveStats();
  paintStats();
  renderRail();
  renderFeedback(S.q, verdict, input);
  $('#hint').textContent = verdict === 'ok' ? 'Correct — press Enter for the next one.'
    : 'Read the breakdown, then press Enter.';
}

function paintStats() {
  const st = S.stats;
  $('#s-streak').textContent = st.streak;
  $('#s-acc').textContent = st.total ? Math.round((st.right / st.total) * 100) + '%' : '—';
}

/* ---------- wiring ---------- */
function wire() {
  $('#modes').addEventListener('click', (e) => {
    const b = e.target.closest('.mode');
    if (!b) return;
    S.mode = b.dataset.mode;
    document.querySelectorAll('.mode').forEach((x) => x.classList.toggle('on', x === b));
    newQuestion();
  });

  $('#btn-check').onclick = check;
  $('#btn-next').onclick = newQuestion;

  $('#btn-why').onclick = () => {
    const t = $('#trace');
    t.hidden = !t.hidden;
    $('#btn-why').textContent = t.hidden ? 'why? show the derivation' : 'hide the derivation';
  };

  $('#btn-all').onclick = () => { S.filter = null; renderRail(); newQuestion(); };

  $('#btn-reset').onclick = () => {
    if (!confirm('Reset all progress on this device?')) return;
    S.stats = { streak: 0, total: 0, right: 0, fam: {} };
    saveStats(); paintStats(); renderRail();
  };

  $('#input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (S.answered) newQuestion(); else check();
    }
    if (e.key === 'Escape') { $('#input').value = ''; }
  });

  // diacritic helper keys
  const KEYS = ['ā', 'ī', 'ū', 'ṛ', 'ñ', 'ṅ', 'ṇ', 'ś', 'ṣ', 'ṃ', 'ḥ', 'ṭ', 'ḍ'];
  $('#keys').innerHTML = KEYS.map((k) => `<button type="button">${k}</button>`).join('');
  $('#keys').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const inp = $('#input');
    const s = inp.selectionStart ?? inp.value.length;
    const epos = inp.selectionEnd ?? s;
    inp.value = inp.value.slice(0, s) + b.textContent + inp.value.slice(epos);
    inp.focus();
    inp.setSelectionRange(s + 1, s + 1);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (document.activeElement === $('#input')) return;
    if (S.answered === false && S.q) { $('#input').focus(); }
  });
}

/* ---------- boot ---------- */
(async function boot() {
  S.stats = loadStats();
  paintStats();
  await loadIndex();
  renderLegend();
  wire();
  paintStats();
  await newQuestion();
})();
