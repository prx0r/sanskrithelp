/* ============================================================
   Prakriyā — learn → produce → retry → apply.
   The rule is TAUGHT first, then asked for with no help on screen.
   Colour = family (nouns) or tense (verbs). Data: Vidyut 0.4.0.
   ============================================================ */

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const S = {
  index: null, verbs: null, curriculum: null,
  famCache: {},
  track: 'noun',
  railTab: 'path',
  stage: null,
  mode: 'build',
  q: null, answered: false,
  view: 'learn',
  refStem: null, refDoc: null, refCell: null,
  block: null,          // blocked practice: same slot, several stems
  retry: [],            // items answered wrong — asked again before moving on
  stats: null,
};

const SKEY = 'prakriya-v5';

/* ---------------- stats ---------------- */
function loadStats() {
  try {
    const s = JSON.parse(localStorage.getItem(SKEY) || '{}');
    return { streak: s.streak | 0, total: s.total | 0, right: s.right | 0,
             stages: s.stages || {}, slots: s.slots || {}, fam: s.fam || {},
             seen: s.seen || {} };
  } catch { return { streak: 0, total: 0, right: 0, stages: {}, slots: {}, fam: {}, seen: {} }; }
}
function saveStats() { try { localStorage.setItem(SKEY, JSON.stringify(S.stats)); } catch {} }

/* ---------------- text ---------------- */
const NFC = (s) => String(s || '').normalize('NFC').trim().replace(/\s+/g, ' ');
const low = (s) => NFC(s).toLowerCase();
const strip = (s) => low(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function diffMarks(got, want) {
  const a = [...low(got)], b = [...low(want)];
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const marks = new Array(m).fill(false);
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { marks[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  return marks;
}

/* ---------------- data ---------------- */
async function getJSON(path) { return (await fetch(path)).json(); }
async function loadAttested() {
  if (!S.attested) S.attested = await getJSON('data/attested.json');
  return S.attested;
}
async function loadCases() {
  if (!S.casesDoc) S.casesDoc = await getJSON('data/cases.json');
  return S.casesDoc;
}
async function loadFamily(id) {
  if (S.famCache[id]) return S.famCache[id];
  const f = S.index.families.find((x) => x.id === id);
  S.famCache[id] = await getJSON(f.file);
  return S.famCache[id];
}
async function ensureVerbs() { if (!S.verbs) S.verbs = await getJSON('data/verbs.json'); return S.verbs; }
const famOf = (stem) => S.index.families.find((f) => f.id === stem.family);
const stemById = (id) => S.index.stems.find((s) => s.id === id);

/* ---------------- curriculum ---------------- */
function stageProgress(id) {
  const s = S.stats.stages[id];
  if (!s || !s.t) return { acc: 0, tries: 0, passed: false };
  return { acc: s.r / s.t, tries: s.t,
           passed: s.t >= S.curriculum.pass.min_attempts && s.r / s.t >= S.curriculum.pass.accuracy };
}
const stageUnlocked = (st) => !st.needs || !st.needs.length || st.needs.every((n) => stageProgress(n).passed);
const stagesForTrack = () => S.curriculum.stages.filter((s) => s.track === S.track);

/* ---------------- pools ---------------- */
function nounPool() {
  const st = S.stage;
  let stems = S.index.stems;
  if (st && st.families && st.families.length) stems = stems.filter((s) => st.families.includes(s.family));
  return stems.length ? stems : S.index.stems;
}
function casesInScope() {
  const st = S.stage;
  if (st && st.cases && st.cases.length) {
    const c = S.index.vibhakti.filter((v) => st.cases.includes(v.id));
    return c.length ? c : S.index.vibhakti;
  }
  return S.index.vibhakti;
}
function verbScope() {
  const st = S.stage;
  let roots = S.verbs.roots, tens = S.verbs.lakara;
  if (st && st.roots && st.roots.length) roots = roots.filter((r) => st.roots.includes(r.id));
  if (st && st.lakara && st.lakara.length) tens = tens.filter((l) => st.lakara.includes(l.id));
  return { roots: roots.length ? roots : S.verbs.roots, tens: tens.length ? tens : S.verbs.lakara };
}

/* ---------------- meaning-first cues ---------------- */
const CASE_CUE = {
  prathama: (g) => `the ${g}`,
  dvitiya: (g) => `the ${g} — as the object`,
  tritiya: (g) => `with / by the ${g}`,
  caturthi: (g) => `to / for the ${g}`,
  pancami: (g) => `from the ${g}`,
  sasthi: (g) => `of the ${g}`,
  saptami: (g) => `in / at the ${g}`,
  sambodhana: (g) => `O ${g}!`,
};

function nounCue(q) {
  const g = q.stem.gloss;
  const base = (CASE_CUE[q.vib.id] || ((x) => x))(g);
  const num = q.vac.id === 'eka' ? '' : ` · ${q.vac.en}`;
  return base + num;
}

function verbCue(q) {
  const who = { Prathama: 'he/she/it', Madhyama: 'you', Uttama: 'I' }[q.pu.id] || '';
  const whoPl = q.va.id === 'bahu' ? (q.pu.id === 'Uttama' ? 'we' : q.pu.id === 'Madhyama' ? 'you all' : 'they')
    : q.va.id === 'dvi' ? (q.pu.id === 'Uttama' ? 'we two' : q.pu.id === 'Madhyama' ? 'you two' : 'those two')
    : who;
  return `${whoPl} ${q.root.gloss} — ${q.lak.en}`;
}

/* ---------------- questions ---------------- */
function nextSlot() {
  // blocked practice: ask the same slot for three stems before moving on
  if (S.block) {
    if (S.block.n > 0) { S.block.n--; return { vib: S.block.vib, vac: S.block.vac }; }
    S.block = null;
  }
  const vib = pick(casesInScope()), vac = pick(S.index.vacana);
  S.block = { vib, vac, n: 2 };
  return { vib, vac };
}

function nounModes() {
  const st = S.stage;
  let modes = (st && st.modes && st.modes.length) ? st.modes.slice()
    : ['build', 'reverse'];
  if (!modes.includes('read')) {
    const at = modes.indexOf('reverse');
    modes.splice(at >= 0 ? at + 1 : modes.length, 0, 'read');
  }
  if (!modes.includes('use')) modes.push('use');
  if (!modes.includes('spot')) modes.push('spot');
  return modes;
}

function meaningOf(vibId, stemId, vacId) {
  if (vibId === 'sambodhana') return `O ${stemById(stemId).gloss}!`;
  const n = np(stemId, vacId);
  return {
    prathama: n, dvitiya: `${n} (as object)`,
    tritiya: `with ${n}`, caturthi: `to ${n}`,
    pancami: `from ${n}`, sasthi: `of ${n}`,
    saptami: `in/at ${n}`,
  }[vibId] || n;
}

function readOptions(q) {
  const seen = new Set([`${q.vib.id}|${q.vac.id}`]);
  const opts = [[q.vib.id, q.vac.id, true]];
  const pool = [];
  for (const v of S.index.vibhakti) for (const w of S.index.vacana) {
    if (seen.has(`${v.id}|${w.id}`)) continue;
    const c = q.doc.stems[q.stem.id].paradigm[v.id]?.[w.id];
    if (c && c.status === 'DERIVED') pool.push([v.id, w.id]);
  }
  for (let i = 0; i < 3 && pool.length; i++) {
    const k = Math.floor(Math.random() * pool.length);
    opts.push([...pool.splice(k, 1)[0], false]);
  }
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

function srsDue() {
  const now = Date.now(), out = [];
  for (const [k, r] of Object.entries(S.stats.slots || {})) {
    if (r && r.t > 0 && (r.due || 0) <= now) out.push(k);
  }
  return out;
}
function srsWeak() {
  const out = [];
  for (const [k, r] of Object.entries(S.stats.slots || {})) {
    if (r && r.t >= 3 && r.r / r.t < 0.7) out.push(k);
  }
  return out;
}
function slotLabel(key) {
  const parts = key.split('|');
  if (parts[0] === 'v') {
    const L = (S.verbs?.lakara || []).find((l) => l.id === parts[1]);
    const PU = (S.verbs?.purusha || []).find((p) => p.id === parts[2]);
    const VA = (S.verbs?.vacana || []).find((w) => w.id === parts[3]);
    return `${L ? L.en : parts[1]} · ${PU ? PU.en : parts[2]} · ${VA ? VA.en : parts[3]}`;
  }
  const [fam, vib, vac] = parts;
  const F = S.index.families.find((f) => f.id === fam);
  const V = S.index.vibhakti.find((v) => v.id === vib);
  const W = S.index.vacana.find((w) => w.id === vac);
  return `${F ? F.label : fam} · ${V ? V.en : vib} ${W ? W.en : vac}`;
}
function confusionHit(typedLow) {
  // returns a slot key whose right answer is what the learner typed, if any
  if (!typedLow) return null;
  for (const [k, r] of Object.entries(S.stats.slots || {})) {
    if (r && r.exp && r.exp === typedLow) return k;
  }
  return null;
}
function inScope(key) {
  const st = S.stage;
  if (!st || st.id.startsWith('review')) return true;
  const parts = key.split('|');
  if (parts[0] === 'v') {
    if (S.track !== 'verb') return false;
    const lak = parts[1];
    if (st.lakara && st.lakara.length && !st.lakara.includes(lak)) return false;
    return true;
  }
  if (S.track !== 'noun') return false;
  const [fam, vib] = parts;
  if (st.families && st.families.length && !st.families.includes(fam)) return false;
  if (st.cases && st.cases.length && !st.cases.includes(vib)) return false;
  return true;
}
async function slotNoun(key) {
  const [fam, vib, vac] = key.split('|');
  const stems = S.index.stems.filter((x) => x.family === fam);
  if (!stems.length) return null;
  return nounFrom(pick(stems).id, vib, vac, 'build');
}
async function slotVerb(key) {
  const v = await ensureVerbs();
  const [, lak, pu, va] = key.split('|');
  const root = pick(v.roots);
  const slot = v.paradigms[root.id]?.[lak]?.[`${pu}.${va}`];
  if (!slot || slot.status !== 'DERIVED') return null;
  const L = v.lakara.find((l) => l.id === lak);
  const PU = v.purusha.find((x) => x.id === pu), VA = v.vacana.find((x) => x.id === va);
  return { track: 'verb', mode: 'build', root, lak: L, pu: PU, va: VA, cell: slot,
           colour: L.colour, answer: slot.iast,
           cue: verbCue({ root, pu: PU, va: VA, lak: L }),
           asks: `${L.en} · ${PU.en} person · ${VA.en} · root ${root.iast}` };
}

async function makeQuestion() {
  if (S.track === 'verb') return makeVerb();

  // retry items come first, but not every time (a failed sentence comes
  // back as a sentence on the same case)
  if (S.retry.length && Math.random() < 0.55) {
    const r = S.retry.shift();
    const q = r.mode === 'use' ? await makeSentence(r.vib) : await nounFrom(r.stem, r.vib, r.vac, r.mode);
    if (q) return q;
  }

  if (S.stage && S.stage.id.startsWith('review')) {
    // confusion pairs first: slots whose wrong answer was another slot's
    // right answer (or vice versa) are the highest-value items
    const rank = (pool) => pool.slice().sort((a, b) => {
      const ra = S.stats.slots[a] || {}, rb = S.stats.slots[b] || {};
      const ca = (ra.got && Object.values(S.stats.slots).some((r) => r && r.exp === ra.got)) ? 0 : 1;
      const cb = (rb.got && Object.values(S.stats.slots).some((r) => r && r.exp === rb.got)) ? 0 : 1;
      return ca - cb;
    });
    const pool = rank([...srsDue(), ...srsWeak()]);
    if (pool.length) {
      const q = await slotNoun(pick(pool.slice(0, Math.max(1, Math.ceil(pool.length / 2)))));
      if (q) return q;
    }
  } else {
    const due = srsDue().filter(inScope);
    if (due.length && Math.random() < 0.6) {
      const q = await slotNoun(pick(due));
      if (q) return q;
    }
  }

  if (S.stage && S.stage.verbs && Math.random() < 0.35) {
    const qv = await makeVerb();
    if (qv) return qv;
  }

  const stem = pick(nounPool());
  const family = famOf(stem);
  const modes = nounModes();
  const mode = modes.includes(S.mode) ? S.mode : modes[0];

  if (mode === 'use') {
    const vibs = casesInScope();
    return makeSentence(pick(vibs).id);
  }

  if (mode === 'spot') {
    const at = await loadAttested();
    const st = S.stage;
    let pool = at.entries.filter((e) => {
      if (st && st.families && st.families.length) {
        const fam = (S.index.stems.find((x) => x.id === e.stem) || {}).family;
        if (!st.families.includes(fam)) return false;
      }
      if (st && st.cases && st.cases.length && !st.cases.includes(e.vibhakti)) return false;
      return true;
    });
    if (!pool.length) pool = at.entries;
    const e = pick(pool);
    const stem = stemById(e.stem);
    const family = famOf(stem);
    const doc = await loadFamily(stem.family);
    const vib = S.index.vibhakti.find((v) => v.id === e.vibhakti);
    const vac = S.index.vacana.find((w) => w.id === e.vacana);
    const cell = doc.stems[stem.id].paradigm[e.vibhakti][e.vacana];
    return { track: 'noun', mode: 'spot', entry: e, stem, family, vib, vac, cell, doc,
             colour: family.colour, answer: e.form,
             cue: e.sanskrit, asks: 'complete the real verse' };
  }

  if (mode === 'family') {
    return { track: 'noun', mode, stem, family, colour: family.colour,
             cue: `Which family is “${stem.iast}”?`, asks: 'name the declension class' };
  }
  // surgery/hunt need cells with real operation steps (a quarter of slots
  // have none — affix-only derivations); try several slots before falling back
  if (mode === 'surgery' || mode === 'hunt') {
    for (let t = 0; t < 12; t++) {
      const { vib, vac } = nextSlot();
      const q = await nounFrom(stem.id, vib.id, vac.id, mode);
      if (q) return q;
    }
  }
  const { vib, vac } = nextSlot();
  return (await nounFrom(stem.id, vib.id, vac.id, mode))
      || nounFrom(stem.id, vib.id, vac.id, 'build');
}

async function nounFrom(stemId, vibId, vacId, mode) {
  const stem = stemById(stemId);
  if (!stem) return null;
  const family = famOf(stem);
  const doc = await loadFamily(stem.family);
  const c = doc.stems[stem.id]?.paradigm?.[vibId]?.[vacId];
  if (!c || c.status !== 'DERIVED') return null;
  const vib = S.index.vibhakti.find((x) => x.id === vibId);
  const vac = S.index.vacana.find((x) => x.id === vacId);

  if (mode === 'read') {
    const analyses = [];
    for (const [v, row] of Object.entries(doc.stems[stem.id].paradigm))
      for (const [w, cc] of Object.entries(row))
        if (cc.status === 'DERIVED' && low(cc.iast) === low(c.iast)) analyses.push([v, w]);
    return { track: 'noun', mode: 'read', stem, family, vib, vac, cell: c, doc,
             colour: family.colour, answer: c.iast, analyses,
             cue: 'read this form', asks: 'tap the matching meaning' };
  }

  if (mode === 'reverse') {
    const analyses = [];
    for (const [v, row] of Object.entries(doc.stems[stem.id].paradigm))
      for (const [w, cc] of Object.entries(row))
        if (cc.status === 'DERIVED' && low(cc.iast) === low(c.iast)) analyses.push([v, w]);
    return { track: 'noun', mode: 'reverse', stem, family, vib, vac, cell: c, doc,
             colour: family.colour, answer: c.iast, analyses,
             cue: `${c.deva}` , cueIast: c.iast,
             asks: 'what case and number is this?' };
  }
  if (mode === 'surgery') return surgeryFrom(doc, stem, family, vib, vac, c);
  if (mode === 'hunt') return huntFrom(doc, stem, family, vib, vac, c);
  return { track: 'noun', mode: 'build', stem, family, vib, vac, cell: c, doc,
           colour: family.colour, answer: c.iast,
           cue: nounCue({ stem, vib, vac }),
           asks: `${vib.en} ${vac.en}` };
}

async function surgeryFrom(doc, stem, family, vib, vac, c) {
  const op = (c.steps || []).find(([, , r]) => r === 'operation');
  if (!op) return null;
  const seen = new Set([op[0]]), pool = [];
  for (const [v, row] of Object.entries(doc.stems[stem.id].paradigm))
    for (const [w, cc] of Object.entries(row)) {
      if (v === vib.id && w === vac.id) continue;
      const o2 = (cc.steps || []).find(([, , r]) => r === 'operation');
      if (o2 && !seen.has(o2[0])) { seen.add(o2[0]); pool.push(o2[0]); }
    }
  for (const code of GLOBAL_OPS) {
    if (pool.length >= 6) break;
    if (!seen.has(code)) { seen.add(code); pool.push(code); }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const opts = [op[0], ...pool.slice(0, 2)].sort(() => Math.random() - 0.5);
  return { track: 'noun', mode: 'surgery', stem, family, vib, vac, cell: c, doc,
           colour: family.colour, answer: op[0], opWhy: op[1], sup: c.sup || '',
           asks: 'which operation fires here?', opts };
}

async function huntFrom(doc, stem, family, vib, vac, c) {
  const genuine = (c.steps || []).filter(([, , r]) => ['operation', 'sound', 'affix'].includes(r));
  if (genuine.length < 2) return null;
  const codes = new Set(c.steps.map((x) => x[0]));
  let fake = null;
  outer:
  for (const [v, row] of Object.entries(doc.stems[stem.id].paradigm))
    for (const [w, cc] of Object.entries(row)) {
      if (v === vib.id && w === vac.id) continue;
      for (const st of (cc.steps || [])) {
        if (['operation', 'sound', 'affix'].includes(st[2]) && !codes.has(st[0])) {
          fake = st; break outer;
        }
      }
    }
  if (!fake) return null;
  const shown = [genuine[0], genuine[1], fake].sort(() => Math.random() - 0.5);
  return { track: 'noun', mode: 'hunt', stem, family, vib, vac, cell: c, doc,
           colour: family.colour, answer: fake[0], fake,
           asks: 'one of these steps is smuggled in — which?', shown };
}

async function makeVerb() {
  const v = await ensureVerbs();
  if (S.stage && S.stage.id.startsWith('review')) {
    const pool = [...srsDue(), ...srsWeak()];
    if (pool.length) {
      const q = await slotVerb(pick(pool));
      if (q) return q;
    }
  } else {
    const due = srsDue().filter(inScope);
    if (due.length && Math.random() < 0.6) {
      const q = await slotVerb(pick(due));
      if (q) return q;
    }
  }
  const { roots, tens } = verbScope();
  const root = pick(roots), lak = pick(tens);
  const pu = pick(v.purusha), va = pick(v.vacana);
  const slot = v.paradigms[root.id]?.[lak.id]?.[`${pu.id}.${va.id}`];
  if (!slot || slot.status !== 'DERIVED') return makeVerb();
  const modes = (S.stage && S.stage.modes) || ['build', 'tense'];
  const mode = modes.includes(S.mode) ? S.mode : modes[0];

  if (mode === 'tense') {
    return { track: 'verb', mode, root, lak, pu, va, cell: slot,
             colour: lak.colour, answer: lak.en,
             cue: slot.deva, cueIast: slot.iast,
             asks: 'which tense is this?' };
  }
  if (mode === 'who') {
    return { track: 'verb', mode, root, lak, pu, va, cell: slot,
             colour: lak.colour, answer: `${pu.en} ${va.en}`,
             cue: slot.deva, cueIast: slot.iast,
             asks: 'who is acting?' };
  }
  return { track: 'verb', mode: 'build', root, lak, pu, va, cell: slot,
           colour: lak.colour, answer: slot.iast,
           cue: verbCue({ root, pu, va, lak }),
           asks: `${lak.en} · ${pu.en} person · ${va.en} · root ${root.iast}` };
}

/* ---------------- grading ---------------- */
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
const PERSON_ALIAS = {
  Uttama: ['uttama', '1st', 'first', 'i', 'we', '1'],
  Madhyama: ['madhyama', '2nd', 'second', 'you', '2'],
  Prathama: ['prathama', '3rd', 'third', 'he', 'she', 'it', 'they', '3'],
};
const GLOBAL_OPS = ['7.1.12', '7.3.111', '7.3.113', '6.1.101', '6.1.88',
  '8.2.66', '7.2.102', '8.3.15', '6.1.78', '7.1.102'];
const LAK_ALIAS = {
  lat: ['lat', 'present', 'pres'], lan: ['lan', 'past', 'imperfect', 'imperf'],
  lrt: ['lrt', 'future', 'fut'], lot: ['lot', 'imperative', 'imper'],
  vidhilin: ['vidhilin', 'optative', 'opt'],
};
const classify = (text, table) => {
  const t = ' ' + strip(text) + ' ';
  for (const [id, al] of Object.entries(table)) if (al.some((a) => t.includes(' ' + a + ' '))) return id;
  return null;
};

function familyMatch(input) {
  const t = strip(input);
  if (!t) return false;
  const fams = S.index.families;
  if (fams.some((f) => strip(f.label) === t || strip(f.id) === t)) return true;
  if (t.length >= 5) {
    const hits = fams.filter((f) => strip(f.label).includes(t) || t.includes(strip(f.label)));
    if (hits.length === 1) return true;
  }
  return false;
}

function grade(q, input) {
  if (!NFC(input)) return 'bad';
  if (q.mode === 'family') return familyMatch(input) ? 'ok' : 'bad';
  if (q.track === 'verb' && q.mode === 'tense') return classify(input, LAK_ALIAS) === q.lak.id ? 'ok' : 'bad';
  if (q.mode === 'who') {
    const pu = classify(input, PERSON_ALIAS), va = classify(input, VAC_ALIAS);
    if (!pu || !va) return 'bad';
    // verb ids are capitalised (Dvi), alias keys are not — compare loosely
    return (pu.toLowerCase() === String(q.pu.id).toLowerCase()
         && va.toLowerCase() === String(q.va.id).toLowerCase()) ? 'ok' : 'bad';
  }
  if (q.mode === 'surgery' || q.mode === 'hunt') {
    return low(input) === low(q.answer) ? 'ok' : 'bad';
  }
  if (q.mode === 'reverse' || q.mode === 'read') {
    const vib = classify(input, VIB_ALIAS), vac = classify(input, VAC_ALIAS);
    if (!vib || !vac) return 'bad';
    return q.analyses.some(([v, w]) => v === vib && w === vac) ? 'ok' : 'bad';
  }
  if (low(input) === low(q.answer)) return 'ok';
  if (strip(input) && strip(input) === strip(q.answer)) return 'loose';
  return 'bad';
}


/* ============================================================
   SENTENCE PRACTICE
   One frame, one changing slot. The grammatical role forces the
   case; the learner supplies the form. Words are written unjoined
   (no external sandhi) so each ending stays visible.
   ============================================================ */

/* ============================================================
   SENTENCE PRACTICE — from the precomputed bank (single source:
   tools/build_sentences.py). The app never invents sentences.
   ============================================================ */
const PROPER_FALLBACK = ['rAma', 'sItA', 'gOrI'];
const MASS_FALLBACK = ['jala', 'vAri', 'daDi', 'maDu', 'vasu', 'BU', 'agni', 'vAc', 'gaNgA'];
// kinds come from frames.json once loaded (single source); fallbacks cover boot
const PROPER = new Set(PROPER_FALLBACK);
const MASS = new Set(MASS_FALLBACK);
async function loadFrames() {
  if (!S.frames) {
    S.frames = await getJSON('data/frames.json');
    for (const x of (S.frames.proper || [])) PROPER.add(x);
    for (const x of (S.frames.proper_fallback_remove || [])) PROPER.delete(x);
    for (const x of (S.frames.mass || [])) MASS.add(x);
  }
  return S.frames;
}
const IRREG = { man: 'men', wife: 'wives', hero: 'heroes', being: 'beings' };
function plural(gloss) {
  const m = gloss.match(/^(.*?)(\s*\(.*\))$/);
  const tail = m ? m[2] : '', core = m ? m[1] : gloss;
  if (IRREG[core]) return IRREG[core] + tail;
  if (/(s|x|ch|sh)$/.test(core)) return core + 'es' + tail;
  if (/[^aeiou]y$/.test(core)) return core.slice(0, -1) + 'ies' + tail;
  if (/o$/.test(core)) return core + 'es' + tail;
  return core + 's' + tail;
}
function np(stemId, vacId) {
  const g = stemById(stemId).gloss;
  if (PROPER.has(stemId)) return vacId === 'eka' ? g : `${g}s`;
  if (MASS.has(stemId)) return `the ${g}`;
  if (vacId === 'eka') return `the ${g}`;
  if (vacId === 'dvi') return `the two ${plural(g)}`;
  return `the ${plural(g)}`;
}

async function sentenceBank() {
  if (!S.sentences) S.sentences = await getJSON('data/sentences.json');
  return S.sentences;
}

async function makeSentence(focusVibId) {
  const bank = await sentenceBank();
  const st = S.stage;
  let pool = bank.entries.filter((e) => !focusVibId || e.target.vib === focusVibId);
  if (st && st.families && st.families.length)
    pool = pool.filter((e) => st.families.includes(e.target.family));
  if (!pool.length) pool = bank.entries;
  const e = pick(pool);
  const stem = stemById(e.target.stem);
  const family = famOf(stem);
  const doc = await loadFamily(stem.family);
  const vib = S.index.vibhakti.find((v) => v.id === e.target.vib);
  const vac = S.index.vacana.find((w) => w.id === e.target.vac);
  const cell = doc.stems[stem.id].paradigm[e.target.vib][e.target.vac];
  return { track: 'noun', mode: 'use', entry: e, stem, family, vib, vac, cell, doc,
    colour: family.colour, answer: e.target.iast,
    cue: e.en, asks: `${stem.gloss} — ${vib.en} ${vac.en}`, sentenceEn: e.en };
}

function renderSentence(q, revealed) {
  const e = q.entry, t = e.target;
  const isT = (w) => !!w.stem && w.stem === t.stem && w.vib === t.vib && w.vac === t.vac;
  const words = e.words.map((w) => {
    if (w.lit) return `<span class="w">${esc(w.lit)}</span>`;
    if (w.verb) return `<span class="w" title="${esc(w.iast)}">${esc(w.deva)}</span>`;
    if (isT(w) && !revealed) return `<span class="blank">?</span>`;
    if (isT(w)) return `<span class="w filled">${esc(w.deva)}</span>`;
    return `<span class="w" title="${esc(w.iast)}">${esc(w.deva)}</span>`;
  }).join(' ');
  const iast = e.words.map((w) => {
    if (w.lit) return w.lit;
    if (isT(w) && !revealed) return '____';
    return w.iast;
  }).join(' ');
  return `<div class="sent-sa">${words}</div>
    <div class="sent-iast">${esc(iast)}</div>
    <div class="sent-cue">fill in: <b>${esc(q.stem.iast)}</b> — ${esc(q.vib.en)} ${esc(q.vac.en)}</div>
    <div class="sent-note">constructed example · words written unjoined</div>`;
}

/* ============================================================
   LEARN VIEW — the rule, before any question
   ============================================================ */
function setColour(hex) { document.documentElement.style.setProperty('--fc', hex); }

async function showLearn(st) {
  S.view = 'learn';
  $('#learnview').hidden = false;
  $('#drillview').hidden = true;
  $('#refview').hidden = true;
  $$('#modes').forEach((m) => (m.style.visibility = st && st.modes && st.modes.length > 1 ? 'visible' : 'hidden'));

  $('#l-eyebrow').textContent = `Stage ${stagesForTrack().findIndex((x) => x.id === st.id) + 1} · learn before you drill`;
  $('#l-title').textContent = st.title;
  $('#l-why').textContent = st.why;

  if (st.track === 'noun') {
    const famId = (st.families && st.families[0]) || 'a-masc';
    const fam = S.index.families.find((f) => f.id === famId);
    const doc = await loadFamily(famId);
    const stemId = fam.stems[0];
    const stem = stemById(stemId);
    const p = doc.stems[stemId].paradigm;
    setColour(fam.colour);

    const cases = st.cases && st.cases.length
      ? S.index.vibhakti.filter((v) => st.cases.includes(v.id)) : S.index.vibhakti;

    let html = '<div class="lg"><div class="lg-h"></div>' +
      S.index.vacana.map((w) => `<div class="lg-h">${w.en}</div>`).join('');
    for (const v of cases) {
      html += `<div class="lg-case"><b>${v.en}</b><small>${v.question}</small></div>`;
      for (const w of S.index.vacana) {
        const c = p[v.id][w.id];
        const op = (c.steps || []).find(([, , r]) => r === 'operation');
        html += `<div class="lg-c">
          <span class="d dev">${esc(c.deva)}</span>
          <span class="i">${esc(c.iast)}</span>
          <span class="sup">${esc(c.sup || '')}${op ? ' → ' + esc(op[0]) : ''}</span>
        </div>`;
      }
    }
    html += '</div>';
    html += '</div><div class="lg-cap">each cell: the form · <b>sup</b> = the ending the grammar selects · <b>→ code</b> = the rule that changes it</div>';
    $('#learngrid').innerHTML = html;
    try {
      const kar = await loadCases();
      const kOf = (v) => (kar.karaka || []).find((k) =>
        String(k.vibhakti || '').toLowerCase().startsWith(String(v.sanskrit || '').toLowerCase()));
      const spot = cases.map((v) => {
        const kq = kOf(v);
        const cell = p[v.id]?.[S.index.vacana[0].id];
        return `<div class="spot"><div class="spot-h"><b>${esc(v.en)}</b>
          <span class="dim">${esc(v.question)}</span></div>
          <div class="spot-f"><span class="d dev">${esc(cell ? cell.deva : '—')}</span>
          <span class="i">${esc(cell ? cell.iast : '')}</span></div>
          <div class="spot-w">${kq ? `kāraka ${esc(kq.label)} · <code>${esc(kq.sutra)}</code>` : `sūtra ${esc(v.sutra)}`}</div>
        </div>`;
      }).join('');
      $('#learngrid').innerHTML += `<div class="lg-case-title">the cases in this stage, one line each</div><div class="spotrow">${spot}</div>`;
    } catch (e) { /* spotlight is garnish; the table is the lesson */ }
    $('#l-note').innerHTML = `<b>${esc(fam.label)}</b> — ${esc(fam.note)}
      Every stem in this family takes exactly these endings: <b>${fam.stems.map((x) => esc(stemById(x).iast)).join(', ')}</b>.
      The example above is <b>${esc(stem.iast)}</b> (${esc(stem.gloss)}).`;
  } else {
    const v = await ensureVerbs();
    const lak = (st.lakara && st.lakara.length)
      ? v.lakara.filter((l) => st.lakara.includes(l.id)) : v.lakara;
    const roots = (st.roots && st.roots.length)
      ? v.roots.filter((r) => st.roots.includes(r.id)) : v.roots;
    const root = roots[0], L = lak[0];
    setColour(L.colour);
    const slot = v.paradigms[root.id][L.id];

    let html = '<div class="lg"><div class="lg-h"></div>' +
      v.vacana.map((w) => `<div class="lg-h">${w.en}</div>`).join('');
    for (const pu of v.purusha) {
      html += `<div class="lg-case"><b>${pu.en}</b><small>${pu.pronoun}</small></div>`;
      for (const va of v.vacana) {
        const c = slot[`${pu.id}.${va.id}`];
        html += `<div class="lg-c"><span class="d dev">${esc(c.deva)}</span>
          <span class="i">${esc(c.iast)}</span></div>`;
      }
    }
    $('#learngrid').innerHTML = html + '</div>';
    $('#l-note').innerHTML = `<b>${esc(L.en)}</b> <span class="dim">${esc(L.deva)}</span> — ${esc(L.note)}
      Example root <b>${esc(root.iast)}</b> (${esc(root.gloss)}).
      ${lak.length > 1 ? 'Tenses in this stage: ' + lak.map((l) => `<b>${esc(l.en)}</b>`).join(', ') + '.' : ''}`;
  }

  // one fully glossed example sentence using this family (nouns only)
  try {
    if (st.track !== 'noun') throw new Error('verbs have no sentence frame yet');
    const bank = await sentenceBank();
    const fams = st.families && st.families.length ? st.families : null;
    const pool = bank.entries.filter((e) => !fams || fams.includes(e.target.family));
    const ex = pick(pool.length ? pool : bank.entries);
    const t = ex.target;
    const words = ex.words.map((w) => {
      if (w.lit) return `<span>${esc(w.lit)}</span>`;
      const hl = w.stem === t.stem && w.vib === t.vib && w.vac === t.vac;
      return `<span class="${hl ? 'hl' : ''}">${esc(w.deva)}</span>`;
    }).join(' ');
    const iast = ex.words.map((w) => w.lit || w.iast).join(' ');
    $('#learngrid').innerHTML += `<div class="lg-sent">
      <div class="t">then use it in a sentence</div>
      <div class="d">${words}</div>
      <div class="i">${esc(iast)}</div>
      <div class="e">${esc(ex.en)}</div>
    </div>`;
  } catch (e) { /* no sentence for this stage */ }

  // in real text: citations whose form is in this stage's scope
  try {
    const at = await loadAttested();
    const scope = new Set();
    for (const st2 of [st]) {
      for (const f of (st2.families || [])) scope.add(f);
    }
    const rel = at.entries.filter((e) => scope.has(
      (S.index.stems.find((x) => x.id === e.stem) || {}).family) &&
      (!st.cases || !st.cases.length || st.cases.includes(e.vibhakti)));
    if (rel.length) {
      const e = rel[0];
      const hi = esc(e.sanskrit).split(esc(e.form)).join(`<b class="hl">${esc(e.form)}</b>`);
      $('#learngrid').innerHTML += `<div class="lg-sent real">
        <div class="t">and in real text — find the form you know</div>
        <div class="d">${hi}</div>
        <div class="i">${esc(e.work)} · ${esc(e.target)}</div>
        <div class="e">${esc(e.translation)}</div>
      </div>`;
    }
  } catch (err) { /* citations are garnish for stages without them */ }

  paintStats();
  renderRail();
}

/* ============================================================
   DRILL VIEW — no pattern on screen
   ============================================================ */
function renderModes() {
  const st = S.stage;
  let modes = S.track === 'noun' ? nounModes()
    : ((st && st.modes && st.modes.length) ? st.modes.slice() : ['build', 'tense']);
  const label = { family: 'Family', build: 'Form', reverse: 'Parse', read: 'Read', tense: 'Tense', who: 'Who', use: 'In a sentence', surgery: 'Surgery', hunt: 'Hunt', spot: 'Real text' };
  const sub = { family: 'name the class', build: 'meaning → form', reverse: 'form → meaning', read: 'match the meaning', tense: 'name the tense', who: 'who acts', use: 'fill the slot', surgery: 'name the rule', hunt: 'spot the fake step', spot: 'fill the verse' };
  if (!modes.includes(S.mode)) S.mode = modes[0];
  $('#modes').innerHTML = modes.map((m) =>
    `<button class="mode ${m === S.mode ? 'on' : ''}" data-mode="${m}"><b>${label[m]}</b><small>${sub[m]}</small></button>`).join('');
  $('#modes').style.visibility = S.view === 'drill' && modes.length > 1 ? 'visible' : 'hidden';
  $('#btn-pattern').hidden = S.view !== 'drill';
}

function renderCue(q) {
  // family identity IS the question here: stay neutral until answered
  setColour(q.mode === 'family' && !S.answered ? '#8fb4dc' : q.colour);
  if (q.mode === 'use') {
    $('#cue').innerHTML = '<div class="sent-en">' + esc(q.sentenceEn) + '</div>' + renderSentence(q, false);
    $('#cue-sub').textContent = '';
    $('#cue-tags').innerHTML = `<span class="tag fam">${esc(q.family.label)}</span>
      <span class="tag case">${esc(q.vib.en)}</span><span class="tag num">${esc(q.vac.en)}</span>`;
    return;
  }
  if (q.mode === 'read') {
    const opts = readOptions(q);
    S.readOpts = opts;
    $('#cue').innerHTML = `<div class="cd dev">${esc(q.cell.deva)}</div>
      <div class="ci">${esc(q.cell.iast)}</div>
      <div class="optrow">` + opts.map(([v, w], i) => {
        const label = meaningOf(v, q.stem.id, w);
        return `<button class="opt" data-oi="${i}">${esc(label)}</button>`;
      }).join('') + `</div>`;
    $('#cue-tags').innerHTML = '';
    $('#cue-sub').textContent = q.asks;
    $$('#cue .opt').forEach((b) => b.addEventListener('click', () => {
      if (S.answered) return;
      const [v, w] = S.readOpts[+b.dataset.oi];
      const V = S.index.vibhakti.find((x) => x.id === v);
      const W = S.index.vacana.find((x) => x.id === w);
      S.readPick = b.textContent.trim();
      $('#input').value = `${V.en} ${W.en}`;
      check();
    }));
    return;
  }
  if (q.mode === 'spot') {
    const parts = q.entry.sanskrit.split(q.entry.form);
    const verse = parts.map((x, i) => esc(x) + (i < parts.length - 1 ? '<span class="blank">?</span>' : '')).join('');
    $('#cue').innerHTML = `<div class="sent-sa">${verse}</div>
      <div class="sent-iast">${esc(q.entry.work)} · ${esc(q.entry.target)}</div>
      <div class="cue-sub">${esc(q.entry.translation)}</div>`;
    $('#cue-tags').innerHTML = `<span class="tag">real text — hard on purpose</span>
      <span class="tag fam">${esc(q.family.label)}</span>`;
    return;
  }
  if (q.mode === 'who') {
    $('#cue').innerHTML = `<div class="cd dev">${esc(q.cell.deva)}</div>
      <div class="ci">${esc(q.cell.iast)}</div>
      <div class="cue-sub">${esc(q.root.iast)} · ${esc(q.lak.en)} — who is acting?</div>`;
    $('#cue-tags').innerHTML = `<span class="tag case">${esc(q.lak.en)}</span>`;
    return;
  }
  if (q.mode === 'surgery') {
    const t = (S.index.sutra_map || {})[q.answer] || '';
    $('#cue').innerHTML = `<div class="cd dev">${esc(q.stem.deva)}</div>
      <div class="ci">${esc(q.stem.iast)} + sup ${esc(q.sup)}</div>
      <div class="cue-sub">which operation fires for ${esc(q.vib.en)} ${esc(q.vac.en)}?</div>
      <div class="optrow">` + q.opts.map((code) =>
        `<button class="opt" data-op="${esc(code)}"><b>${esc(code)}</b><br><small>${esc((S.index.sutra_map || {})[code] || '')}</small></button>`
      ).join('') + `</div>`;
    $('#cue-tags').innerHTML = `<span class="tag fam">${esc(q.family.label)}</span>
      <span class="tag case">${esc(q.vib.en)}</span><span class="tag num">${esc(q.vac.en)}</span>`;
    $$('#cue .opt').forEach((b) => b.addEventListener('click', () => {
      if (S.answered) return;
      $('#input').value = b.dataset.op;
      check();
    }));
    return;
  }
  if (q.mode === 'hunt') {
    $('#cue').innerHTML = `<div class="cd dev">${esc(q.stem.deva)}</div>
      <div class="ci">${esc(q.stem.iast)} · ${esc(q.vib.en)} ${esc(q.vac.en)}</div>
      <div class="cue-sub">one of these steps is smuggled in from another derivation — which?</div>
      <div class="optrow">` + q.shown.map(([code, after]) =>
        `<button class="opt" data-op="${esc(code)}"><b>${esc(code)}</b><br><small>${esc(after)}</small></button>`
      ).join('') + `</div>`;
    $('#cue-tags').innerHTML = `<span class="tag fam">${esc(q.family.label)}</span>`;
    $$('#cue .opt').forEach((b) => b.addEventListener('click', () => {
      if (S.answered) return;
      $('#input').value = b.dataset.op;
      check();
    }));
    return;
  }
  $('#cue').innerHTML = q.mode === 'reverse' || q.mode === 'tense'
    ? `<span class="cd dev">${esc(q.cue)}</span><span class="ci">${esc(q.cueIast || '')}</span>`
    : `<span class="cue-m">${esc(q.cue)}</span>`;

  $('#cue-sub').textContent = q.asks || '';
  const tags = [];
  if (q.track === 'noun') {
    if (q.mode === 'reverse') tags.push('<span class="tag">more than one answer may be right</span>');
    else tags.push(`<span class="tag fam">${esc(q.family.label)}</span>`);
    if (q.vib) tags.push(`<span class="tag case">${esc(q.vib.en)}</span><span class="tag num">${esc(q.vac.en)}</span>`);
  } else if (q.mode === 'who') {
    tags.push(`<span class="tag case">${esc(q.lak.en)}</span>`);
    tags.push(`<span class="tag">root ${esc(q.root.iast)}</span>`);
  } else {
    tags.push(`<span class="tag case">${esc(q.lak.en)}</span>`);
    tags.push(`<span class="tag num">${esc(q.pu.en)} · ${esc(q.va.en)}</span>`);
  }
  $('#cue-tags').innerHTML = tags.join('');
}

function renderAfter(q, verdict, input) {
  setColour(q.colour);
  const box = $('#after');
  box.hidden = false;
  if (q.mode === 'use') {
    $('#after-form').innerHTML = '';
    $('#after-rule').innerHTML = renderSentence(q, true);
    $('#stagegrid').innerHTML = '';
    return;
  }
  const cell = q.cell;
  $('#after-form').innerHTML = cell
    ? `<span class="dev">${esc(cell.deva)}</span><span class="ci">${esc(cell.iast)}</span>`
    : `<span>${esc(q.family ? q.family.label : '')}</span>`;

  if (q.mode === 'family') {
    $('#after-rule').innerHTML = `<b>${esc(q.family.label)}</b> · ${esc(q.family.deva)} — ${esc(q.family.note)}`;
    $('#stagegrid').innerHTML = '';
    return;
  }
  const sup = cell.sup ? `<code>${esc(cell.sup)}</code>` : '';
  const op = (cell.steps || []).find(([, , r]) => r === 'operation');
  const opTxt = op ? `<code>${esc(op[0])}</code> ${esc((S.index.sutra_map || {})[op[0]] || '')}` : '';
  $('#after-rule').innerHTML = (sup ? `sup ${sup}` : '') + (opTxt ? ` · ${opTxt}` : '');
  renderStageGrid(q, verdict === 'ok');
}

function cellMarkup(c, isTarget, revealed) {
  if (!c || c.status !== 'DERIVED') return `<div class="c miss">—</div>`;
  if (isTarget && !revealed) return `<div class="c target hidden"><span class="d">?</span></div>`;
  if (isTarget && revealed) return `<div class="c solved"><span class="d">${esc(c.deva)}</span><span class="i">${esc(c.iast)}</span></div>`;
  return `<div class="c"><span class="d">${esc(c.deva)}</span><span class="i">${esc(c.iast)}</span></div>`;
}

function renderStageGrid(q, revealed) {
  const host = $('#stagegrid');
  if (q.mode === 'family') {
    host.innerHTML = `<div class="fampad">` + S.index.families.map((f) =>
      `<button data-fam="${f.id}" style="--fc:${f.colour}">
        <span class="sw" style="background:${f.colour}"></span>${esc(f.label)}</button>`).join('') + `</div>`;
    host.querySelectorAll('[data-fam]').forEach((b) => b.addEventListener('click', () => {
      if (S.answered) return;
      $('#input').value = S.index.families.find((f) => f.id === b.dataset.fam).label;
      check();
    }));
    return;
  }
  if (!q.cell) { host.innerHTML = ''; return; }
  if (q.mode === 'who' || q.mode === 'surgery' || q.mode === 'hunt') { host.innerHTML = ''; return; }

  if (q.track === 'noun') {
    const p = q.doc.stems[q.stem.id].paradigm;
    let html = '<div class="sg noun"><div class="h"></div>' +
      S.index.vacana.map((w) => `<div class="h">${w.en.slice(0, 3)}</div>`).join('');
    for (const v of S.index.vibhakti) {
      const inScope = casesInScope().some((x) => x.id === v.id);
      html += `<div class="rh ${inScope ? '' : 'out'}">${v.en.slice(0, 5)}</div>`;
      for (const w of S.index.vacana) {
        const c = p[v.id]?.[w.id];
        const isT = (q.mode === 'build' || q.mode === 'use')
          ? (v.id === q.vib.id && w.id === q.vac.id)
          : (q.analyses || []).some(([a, b]) => a === v.id && b === w.id);
        html += cellMarkup(c, isT, revealed);
      }
    }
    host.innerHTML = html + '</div>' +
      `<div class="sg-hint">the whole family, for reference — you answered without it</div>`;
    return;
  }
  const slot = S.verbs.paradigms[q.root.id][q.lak.id];
  let html = '<div class="sg verb"><div class="h"></div>' +
    S.verbs.vacana.map((w) => `<div class="h">${w.en.slice(0, 3)}</div>`).join('');
  for (const pu of S.verbs.purusha) {
    html += `<div class="rh">${pu.en} per</div>`;
    for (const va of S.verbs.vacana) {
      const c = slot[`${pu.id}.${va.id}`];
      const isT = pu.id === q.pu.id && va.id === q.va.id;
      html += cellMarkup(c, isT, revealed);
    }
  }
  host.innerHTML = html + '</div>' +
    `<div class="sg-hint">${esc(q.root.iast)} · ${esc(q.lak.en)} — you answered without it</div>`;
}

/* ---------------- feedback ---------------- */
function renderLegend() {
  const host = $('#legend');
  if (S.track === 'noun') {
    host.innerHTML = S.index.families.map((f) =>
      `<li><i style="background:${f.colour}"></i><b>${esc(f.label)}</b><span class="lw">${esc(f.deva)}</span></li>`).join('');
  } else if (S.verbs) {
    host.innerHTML = S.verbs.lakara.map((l) =>
      `<li><i style="background:${l.colour}"></i><b>${esc(l.en)}</b><span class="lw">${esc(l.deva)}</span></li>`).join('');
  }
}

function renderFeedback(q, verdict, input) {
  document.body.classList.add('answered');
  $('#fb-empty').hidden = true; $('#fb-ref').hidden = true; $('#fb-body').hidden = false;

  const v = $('#verdict');
  v.className = 'verdict ' + (verdict === 'bad' ? 'bad' : 'ok');
  v.textContent = verdict === 'ok' ? 'Correct' : verdict === 'loose' ? 'Close — diacritics' : 'Not quite';

  if (q.mode === 'family') {
    $('#correct').innerHTML = `<span>${esc(q.family.label)}</span>`;
    $('#yours').innerHTML = `<span class="lbl">you wrote</span>${esc(input)}`;
  } else if (q.mode === 'tense') {
    $('#correct').innerHTML = `<span>${esc(q.lak.en)}</span><span class="ci">${esc(q.lak.deva)}</span>`;
    $('#yours').innerHTML = `<span class="lbl">the form</span><span class="dev">${esc(q.cell.deva)}</span> ${esc(q.cell.iast)}`;
  } else if (q.mode === 'who') {
    $('#correct').innerHTML = `<span>${esc(q.pu.en)} person · ${esc(q.va.en)}</span>`;
    $('#yours').innerHTML = `<span class="lbl">the form</span><span class="dev">${esc(q.cell.deva)}</span> ${esc(q.cell.iast)}` +
      (verdict === 'ok' ? '' : `<span class="lbl">you wrote</span>${esc(input)}`);
  } else if (q.mode === 'surgery') {
    const t = (S.index.sutra_map || {})[q.answer] || '';
    $('#correct').innerHTML = `<span><code>${esc(q.answer)}</code> ${esc(t)}</span><span class="ci">${esc(q.opWhy)}</span>`;
    $('#yours').innerHTML = verdict === 'ok' ? '' : `<span class="lbl">you wrote</span>${esc(input)}`;
  } else if (q.mode === 'hunt') {
    $('#correct').innerHTML = `<span><code>${esc(q.answer)}</code> does not belong here</span>`;
    $('#yours').innerHTML = verdict === 'ok' ? '' : `<span class="lbl">you wrote</span>${esc(input)}`;
  } else if (q.mode === 'spot') {
    $('#correct').innerHTML = `<span class="dev">${esc(q.cell.deva)}</span><span class="ci">${esc(q.cell.iast)}</span>`;
    $('#yours').innerHTML = `<span class="lbl">the verse</span>${esc(q.entry.work)} · ${esc(q.entry.target)}` +
      (verdict === 'ok' ? '' : `<span class="lbl">you wrote</span>${esc(input)}`);
  } else if (q.mode === 'read') {
    const V = S.index.vibhakti.find((x) => x.id === q.vib.id);
    const W = S.index.vacana.find((x) => x.id === q.vac.id);
    $('#correct').innerHTML = `<span class="dev">${esc(q.cell.deva)}</span><span class="ci">${esc(q.cell.iast)}</span>`;
    $('#yours').innerHTML = `<span class="lbl">means</span>${esc(meaningOf(q.vib.id, q.stem.id, q.vac.id))}` +
      (verdict === 'ok' ? '' : `<span class="lbl">you picked</span>${esc(S.readPick || input)}`);
  } else if (q.mode === 'reverse') {
    const list = q.analyses.map(([a, b]) => {
      const V = S.index.vibhakti.find((x) => x.id === a);
      const W = S.index.vacana.find((x) => x.id === b);
      return `${V.en} ${W.en}`;
    }).join(' · ');
    $('#correct').innerHTML = `<span class="dev">${esc(q.cell.deva)}</span><span class="ci">${esc(q.cell.iast)}</span>`;
    $('#yours').innerHTML = `<span class="lbl">${q.analyses.length > 1 ? 'all valid analyses' : 'valid analysis'}</span>${esc(list)}`;
  } else {
    $('#correct').innerHTML = `<span class="dev">${esc(q.cell.deva)}</span><span class="ci">${esc(q.cell.iast)}</span>`;
    if (verdict === 'ok') $('#yours').innerHTML = '';
    else {
      const marks = diffMarks(input, q.answer);
      const chars = [...low(input)];
      const html = chars.map((ch, i) => `<span class="${marks[i] ? 'g' : 'w'}">${esc(ch)}</span>`).join('');
      $('#yours').innerHTML = `<span class="lbl">you wrote — struck letters are wrong</span>${html || '—'}`;
    }
  }

  $('#trace').innerHTML = (q.cell?.steps || []).map(([code, after, role]) => {
    const t = (S.index.sutra_map || {})[code] || '';
    return `<div class="tr" data-r="${role}"><span class="c">${esc(code)}</span>
      <span>${esc(t)}</span><span class="a">${esc(after)}</span></div>`;
  }).join('');
  $('#trace').hidden = true;
  $('#btn-why').textContent = 'show the derivation';
  $('#btn-why').hidden = q.mode === 'family';
  if (q.mode === 'hunt') {
    $('#trace').innerHTML += `<div class="tr fake"><span class="c">${esc(q.answer)}</span>`
      + `<span>smuggled in from another derivation</span>`
      + `<span class="a">${esc((q.fake || [])[1] || '')}</span></div>`;
  }
  if (q.mode === 'surgery' || q.mode === 'hunt') {
    $('#trace').hidden = false;
    $('#btn-why').textContent = 'hide the derivation';
  }
  $('#btn-next').hidden = false;
  $('#btn-check').hidden = true;
  $('#input').disabled = true;
}

function clearFeedback() {
  document.body.classList.remove('answered');
  $('#fb-empty').hidden = false; $('#fb-body').hidden = true; $('#fb-ref').hidden = true;
  $('#after').hidden = true;
  $('#trace').hidden = true;
  $('#input').disabled = false;
  $('#btn-check').hidden = false;
  $('#btn-next').hidden = true;
}

/* ============================================================
   RAIL
   ============================================================ */
function renderRail() {
  const host = $('#raillist');
  if (S.railTab === 'path') renderPath(host); else renderBrowse(host);
}

function reviewCount() {
  return [...srsDue(), ...srsWeak()].filter(inScope).length;
}
function reviewStage() {
  return { id: 'review:' + S.track, track: S.track, title: 'Review due items',
           sub: 'spaced repetition + your weak slots', modes: ['build'],
           why: 'Items you missed come back first; items you have not seen for a while come back next.',
           review: true };
}
function suggestMode(st) {
  if (!st || !st.modes) return null;
  for (const m of st.modes) {
    const r = (S.stats.stages[st.id]?.modes || {})[m];
    if (!r || r.t < 6 || r.r / r.t < 0.8) return m;
  }
  return st.modes[st.modes.length - 1];
}
function caseMastery() {
  // per-case accuracy across all noun slots seen so far
  const out = [];
  for (const v of S.index.vibhakti) {
    let t = 0, r = 0;
    for (const [k, s] of Object.entries(S.stats.slots || {})) {
      const parts = k.split('|');
      if (parts[0] === 'v' || parts[1] !== v.id) continue;
      t += s.t || 0; r += s.r || 0;
    }
    out.push({ id: v.id, en: v.en, t, acc: t ? r / t : null });
  }
  return out;
}
function renderPath(host) {
  const stages = stagesForTrack();
  const rc = reviewCount();
  host.innerHTML = `<button class="pstage review ${S.stage && S.stage.review ? 'on' : ''}"
      data-review="1" ${rc ? '' : 'disabled'}>
      <span class="st-n">↻</span>
      <span class="st-b"><b>Review</b><small>${rc ? rc + ' due or weak' : 'nothing due — you are clear'}</small>
      <span class="st-bar"><i style="width:${rc ? 100 : 0}%"></i></span></span>
      <span class="st-p">${rc || ''}</span>
    </button>` + stages.map((st, i) => {
    const p = stageProgress(st.id);
    const open = stageUnlocked(st);
    const active = S.stage && S.stage.id === st.id;
    const pct = Math.round(p.acc * 100);
    return `<button class="pstage ${active ? 'on' : ''} ${open ? '' : 'locked'}"
        data-stage="${st.id}" ${open ? '' : 'disabled'}>
      <span class="st-n">${open ? (p.passed ? '✓' : i + 1) : '🔒'}</span>
      <span class="st-b"><b>${esc(st.title)}</b><small>${esc(st.sub)}</small>
        <span class="st-bar"><i style="width:${pct}%"></i></span></span>
      <span class="st-p">${p.tries ? pct + '%' : ''}</span>
    </button>`;
  }).join('');
  const cm = S.track === 'noun' ? caseMastery().filter((c) => c.t > 0) : [];
  if (cm.length) {
    const dots = cm.map((c) =>
      `<span class="cdot" title="${esc(c.en)}: ${Math.round(c.acc * 100)}% over ${c.t}" data-case="${c.id}">
        <i style="height:${Math.round(c.acc * 100)}%"></i></span>`).join('');
    host.innerHTML = `<div class="cmaster"><div class="cm-t">cases</div><div class="cdots">${dots}</div></div>` + host.innerHTML;
    host.querySelectorAll('[data-case]').forEach((b) => b.addEventListener('click', () => {
      startStage({ id: 'adhoc-case-' + b.dataset.case, track: 'noun',
                   title: 'drill: ' + b.dataset.case, why: 'You chose this case.',
                   families: [], cases: [b.dataset.case],
                   modes: ['build', 'reverse', 'use', 'read'], adhoc: true });
      beginDrill();
    }));
  }
  host.querySelectorAll('[data-stage]').forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    startStage(S.curriculum.stages.find((x) => x.id === b.dataset.stage));
  }));
  const rb = host.querySelector('[data-review]');
  if (rb && !rb.disabled) rb.addEventListener('click', () => {
    const st = reviewStage();
    S.stats.seen[st.id] = 1;
    startStage(st);
  });
}

function renderBrowse(host) {
  const familyPending = S.q && S.q.mode === 'family' && !S.answered;
  if (familyPending) {
    host.innerHTML = `<div class="railnote">Browse is hidden while a family question is open — the list would give the answer away.</div>`;
    return;
  }
  if (S.track === 'noun') {
    host.innerHTML = S.index.families.map((f) => {
      const open = S.browseOpen === f.id;
      const stems = f.stems.map((id) => {
        const s = stemById(id);
        return `<button class="bstem" data-stem="${id}">
          <span class="bs-deva dev">${esc(s.deva)}</span>
          <span class="bs-iast">${esc(s.iast)}</span>
          <span class="bs-gloss">${esc(s.gloss)}</span></button>`;
      }).join('');
      return `<div class="bfam ${open ? 'open' : ''}" style="--fc:${f.colour}">
        <button class="bfam-h" data-fam="${f.id}"><span class="dot"></span><b>${esc(f.label)}</b>
          <span class="bfam-n">${f.stems.length}</span></button>
        <div class="bstems">${stems}</div></div>`;
    }).join('');
    host.querySelectorAll('[data-fam]').forEach((b) => b.addEventListener('click', () => {
      S.browseOpen = S.browseOpen === b.dataset.fam ? null : b.dataset.fam;
      renderRail();
    }));
    host.querySelectorAll('[data-stem]').forEach((b) => b.addEventListener('click', () => openReference(b.dataset.stem)));
    return;
  }
  const v = S.verbs;
  host.innerHTML = `<div class="railnote">Pick a tense, then a root.</div>` +
    v.lakara.map((l) => `<div class="bfam ${S.browseOpen === l.id ? 'open' : ''}" style="--fc:${l.colour}">
      <button class="bfam-h" data-lak="${l.id}"><span class="dot"></span><b>${esc(l.en)}</b>
        <span class="bfam-n">${v.roots.length}</span></button>
      <div class="bstems">${v.roots.map((r) =>
        `<button class="bstem" data-vroot="${r.id}" data-vlak="${l.id}">
           <span class="bs-deva dev">${esc(r.deva)}</span><span class="bs-iast">${esc(r.iast)}</span>
           <span class="bs-gloss">${esc(r.gloss)}</span></button>`).join('')}</div></div>`).join('');
  host.querySelectorAll('[data-lak]').forEach((b) => b.addEventListener('click', () => {
    S.browseOpen = S.browseOpen === b.dataset.lak ? null : b.dataset.lak;
    renderRail();
  }));
  host.querySelectorAll('[data-vroot]').forEach((b) => b.addEventListener('click', () =>
    openVerbRef(b.dataset.vroot, b.dataset.vlak)));
}

/* ============================================================
   REFERENCE
   ============================================================ */
async function openReference(stemId) {
  const stem = stemById(stemId);
  const doc = await loadFamily(stem.family);
  S.view = 'ref'; S.refStem = stem; S.refDoc = doc; S.refCell = null;
  const fam = famOf(stem);
  setColour(fam.colour);
  showView('ref');
  $('#modes').style.visibility = 'hidden'; $('#btn-pattern').hidden = true;
  $('#fb-empty').hidden = true; $('#fb-body').hidden = true; $('#fb-ref').hidden = false;
  $('#r-hint').textContent = 'Tap any form to see its derivation.';

  $('#r-deva').textContent = stem.deva;
  $('#r-iast').textContent = stem.iast;
  $('#r-gloss').textContent = stem.gloss;
  $('#r-fam').textContent = fam.label;
  $('#r-gender').textContent = stem.gender;
  const sibs = fam.stems.filter((x) => x !== stemId).map((x) => stemById(x).iast);
  $('#r-siblings').innerHTML = sibs.length
    ? 'same pattern: ' + sibs.slice(0, 8).map((x) => `<b>${esc(x)}</b>`).join(', ')
    : 'unique stem in this family';

  renderRefTable(); renderRefPanel(); renderRail();
}

function renderRefTable() {
  const p = S.refDoc.stems[S.refStem.id].paradigm;
  let html = '<div class="rt-grid"><div class="rt-h"></div>' +
    S.index.vacana.map((w) => `<div class="rt-h">${w.en}</div>`).join('');
  for (const v of S.index.vibhakti) {
    const drilled = S.q && S.q.vib && S.q.vib.id === v.id;
    html += `<div class="rt-case ${drilled ? 'drilled' : ''}"><b>${v.en}</b><small>${v.question}</small></div>`;
    for (const w of S.index.vacana) {
      const c = p[v.id]?.[w.id];
      if (!c || c.status !== 'DERIVED') { html += `<div class="rt-c miss">—</div>`; continue; }
      const sel = S.refCell && S.refCell.vib === v.id && S.refCell.vac === w.id;
      html += `<button class="rt-c ${sel ? 'sel' : ''}" data-vib="${v.id}" data-vac="${w.id}">
        <span class="d">${esc(c.deva)}</span><span class="i">${esc(c.iast)}</span></button>`;
    }
  }
  $('#reftable').innerHTML = html + '</div>';
  $$('#reftable .rt-c[data-vib]').forEach((b) => b.addEventListener('click', () => {
    S.refCell = { vib: b.dataset.vib, vac: b.dataset.vac };
    renderRefTable(); renderRefPanel();
  }));
}

function renderRefPanel() {
  const p = S.refDoc.stems[S.refStem.id].paradigm;
  const cell = S.refCell ? p[S.refCell.vib][S.refCell.vac] : null;
  const v = S.refCell ? S.index.vibhakti.find((x) => x.id === S.refCell.vib) : null;
  const w = S.refCell ? S.index.vacana.find((x) => x.id === S.refCell.vac) : null;
  $('#ref-case').innerHTML = cell
    ? `<div class="rc-case"><b>${esc(v.en)}</b> <span class="dim">${esc(v.question)}</span></div>
       <div class="rc-form"><span class="dev">${esc(cell.deva)}</span><span class="iast">${esc(cell.iast)}</span></div>
       <div class="dim">${esc(w.en)} · ${esc(S.refStem.iast)} · sūtra ${esc(v.sutra)}</div>`
    : `<div class="rc-case"><b>${esc(S.refStem.iast)}</b> — ${esc(famOf(S.refStem).label)}</div>
       <div class="dim">${esc(famOf(S.refStem).note)}</div>
       <div class="rc-legend">${S.index.vibhakti.map((x) =>
         `<div class="rc-l"><b>${esc(x.en)}</b><span>${esc(x.question)}</span><code>${esc(x.sutra)}</code></div>`).join('')}</div>`;
  $('#trace-ref').innerHTML = cell ? cell.steps.map(([code, after, role]) => {
    const t = (S.index.sutra_map || {})[code] || '';
    return `<div class="tr" data-r="${role}"><span class="c">${esc(code)}</span>
      <span>${esc(t)}</span><span class="a">${esc(after)}</span></div>`;
  }).join('') : '';
}

async function openVerbRef(rootId, lakId) {
  const v = await ensureVerbs();
  const root = v.roots.find((r) => r.id === rootId);
  const lak = v.lakara.find((l) => l.id === lakId);
  S.view = 'ref'; S.refRoot = root; S.refLak = lak; S.refCell = null;
  setColour(lak.colour);
  showView('ref');
  $('#modes').style.visibility = 'hidden'; $('#btn-pattern').hidden = true;
  $('#fb-empty').hidden = true; $('#fb-body').hidden = true; $('#fb-ref').hidden = false;
  $('#r-hint').textContent = 'Tap any form to see its derivation.';
  $('#r-deva').textContent = root.deva;
  $('#r-iast').textContent = root.iast;
  $('#r-gloss').textContent = root.gloss;
  $('#r-fam').textContent = lak.en;
  $('#r-gender').textContent = root.gana;
  $('#r-siblings').innerHTML = esc(lak.note);
  renderVerbRefTable(); renderVerbRefPanel();
}

function renderVerbRefTable() {
  const v = S.verbs, slot = v.paradigms[S.refRoot.id][S.refLak.id];
  let html = '<div class="rt-grid"><div class="rt-h"></div>' +
    v.vacana.map((w) => `<div class="rt-h">${w.en}</div>`).join('');
  for (const pu of v.purusha) {
    html += `<div class="rt-case"><b>${pu.en}</b><small>${pu.pronoun}</small></div>`;
    for (const va of v.vacana) {
      const c = slot[`${pu.id}.${va.id}`];
      if (!c || c.status !== 'DERIVED') { html += `<div class="rt-c miss">—</div>`; continue; }
      const sel = S.refCell && S.refCell.pu === pu.id && S.refCell.va === va.id;
      html += `<button class="rt-c ${sel ? 'sel' : ''}" data-pu="${pu.id}" data-va="${va.id}">
        <span class="d">${esc(c.deva)}</span><span class="i">${esc(c.iast)}</span></button>`;
    }
  }
  $('#reftable').innerHTML = html + '</div>';
  $$('#reftable .rt-c[data-pu]').forEach((b) => b.addEventListener('click', () => {
    S.refCell = { pu: b.dataset.pu, va: b.dataset.va };
    renderVerbRefTable(); renderVerbRefPanel();
  }));
}

function renderVerbRefPanel() {
  const v = S.verbs, slot = v.paradigms[S.refRoot.id][S.refLak.id];
  const cell = S.refCell ? slot[`${S.refCell.pu}.${S.refCell.va}`] : null;
  const pu = S.refCell ? v.purusha.find((x) => x.id === S.refCell.pu) : null;
  const va = S.refCell ? v.vacana.find((x) => x.id === S.refCell.va) : null;
  $('#ref-case').innerHTML = cell
    ? `<div class="rc-case"><b>${esc(pu.en)} person</b> <span class="dim">${esc(va.en)}</span></div>
       <div class="rc-form"><span class="dev">${esc(cell.deva)}</span><span class="iast">${esc(cell.iast)}</span></div>
       <div class="dim">${esc(S.refRoot.iast)} · ${esc(S.refLak.en)}</div>`
    : `<div class="rc-case"><b>${esc(S.refRoot.iast)}</b> — ${esc(S.refLak.en)}</div>
       <div class="dim">${esc(S.refLak.note)}</div>`;
  $('#trace-ref').innerHTML = cell ? cell.steps.map(([code, after, role]) => {
    const t = (S.index.sutra_map || {})[code] || '';
    return `<div class="tr" data-r="${role}"><span class="c">${esc(code)}</span>
      <span>${esc(t)}</span><span class="a">${esc(after)}</span></div>`;
  }).join('') : '';
}

/* ============================================================
   FLOW
   ============================================================ */
function showView(name) {
  $('#learnview').hidden = name !== 'learn';
  $('#drillview').hidden = name !== 'drill';
  $('#refview').hidden = name !== 'ref';
}

function startStage(st) {
  S.stage = st; S.track = st.track;
  S.block = null; S.retry = [];
  syncTrackButtons();
  S.railTab = 'path';
  $$('.rt').forEach((x) => x.classList.toggle('on', x.dataset.tab === 'path'));
  // auto-progression: practise the first mode you have not passed yet
  S.mode = (!st.review && suggestMode(st)) || (st.modes && st.modes[0]) || 'build';
  if (st.review) { S.stats.seen[st.id] = 1; saveStats(); beginDrill(); return; }
  if (!S.stats.seen[st.id]) { S.stats.seen[st.id] = 1; saveStats(); showLearn(st); return; }
  showLearn(st);
}

function beginDrill() {
  S.view = 'drill';
  showView('drill');
  renderModes();
  newQuestion();
}

async function newQuestion() {
  if (S.track === 'verb') await ensureVerbs();
  if (S.view !== 'drill') return;
  S.answered = false;
  S.q = await makeQuestion();
  clearFeedback();
  renderModes();
  renderRail();
  renderCue(S.q);
  // family pad renders before answering (it IS the answer control);
  // paradigm grids render only after (see renderAfter)
  if (S.q.mode === 'family') renderStageGrid(S.q, false);
  else $('#stagegrid').innerHTML = '';
  $('#input').value = '';
  $('#input').placeholder = ['reverse', 'read', 'spot'].includes(S.q.mode) ? 'genitive singular'
    : S.q.mode === 'who' ? '1st singular'
    : (S.q.mode === 'surgery' || S.q.mode === 'hunt') ? 'sūtra number, e.g. 7.1.12'
    : S.q.mode === 'tense' ? 'present / past / future…'
    : S.q.mode === 'family' ? 'short -a masculine' : 'type the form in roman';
  $('#hint').textContent = S.stage ? `${S.stage.title}` : '';
  if (S.retry.length) $('#srs').textContent = `${S.retry.length} to redo`;
  else $('#srs').textContent = '';
  $('#input').focus();
  paintStats();
}

function check() {
  if (!S.q || S.answered) return;
  const input = $('#input').value;
  if (!NFC(input)) { $('#hint').textContent = 'Type something first.'; return; }
  const verdict = grade(S.q, input);
  S.answered = true;

  const st = S.stats;
  st.total++;
  if (S.stage) {
    const id = S.stage.id;
    st.stages[id] = st.stages[id] || { t: 0, r: 0, modes: {} };
    st.stages[id].t++;
    if (verdict === 'ok') st.stages[id].r++;
    const mm = st.stages[id].modes[S.q.mode] || (st.stages[id].modes[S.q.mode] = { t: 0, r: 0 });
    mm.t++; if (verdict === 'ok') mm.r++;
  }
  const key = S.q.track === 'noun' ? S.q.family.id : S.q.lak.id;
  st.fam[key] = st.fam[key] || { t: 0, r: 0 };
  st.fam[key].t++;
  if (verdict === 'ok') { st.right++; st.streak++; st.fam[key].r++; } else st.streak = 0;

  // per-slot mastery + SRS (SM-2-lite). Old {t,r} records migrate lazily.
  // exp = the right answer seen here; got = what was last typed wrong here.
  // When got matches another slot's exp, the learner confuses the two.
  const DAY = 86400000, now = Date.now();
  const srs = (k) => {
    const r = st.slots[k] || (st.slots[k] = { t: 0, r: 0, e: 2.5, i: 0, due: 0 });
    if (r.e === undefined) { r.e = 2.5; r.i = 0; r.due = 0; }
    r.t++;
    if (verdict === 'ok') {
      r.r++;
      r.e = Math.min(2.5, r.e + 0.1);
      r.i = r.i === 0 ? 1 : r.i === 1 ? 3 : Math.round(r.i * r.e);
      r.due = now + r.i * DAY;
    } else {
      r.e = Math.max(1.3, r.e - 0.2);
      r.i = 0; r.due = now;
    }
    return r;
  };
  let slotKey = null;
  if (S.q.track === 'noun' && S.q.vib) slotKey = `${S.q.family.id}|${S.q.vib.id}|${S.q.vac.id}`;
  else if (S.q.track === 'verb' && S.q.lak) slotKey = `v|${S.q.lak.id}|${S.q.pu.id}|${S.q.va.id}`;
  if (slotKey) {
    srs(slotKey);
    const rec = st.slots[slotKey];
    if (S.q.answer) rec.exp = low(S.q.answer);
    if (verdict === 'bad') rec.got = low(input);
    else if (rec.got && rec.got !== low(S.q.answer || '')) { /* keep history */ }
  }

  // wrong → re-ask this exact item later in the session
  if (verdict === 'bad' && S.q.track === 'noun' && S.q.vib) {
    S.retry.push({ stem: S.q.stem.id, vib: S.q.vib.id, vac: S.q.vac.id, mode: S.q.mode });
  }

  saveStats();

  if (verdict === 'bad') {
    const hit = confusionHit(low(input));
    if (hit) S.confusionNote = `“${input.trim()}” is actually ${slotLabel(hit)} — compare the two jobs.`;
    else S.confusionNote = null;
  } else S.confusionNote = null;
  renderAfter(S.q, verdict, input);
  renderFeedback(S.q, verdict, input);
  if (S.confusionNote) {
    const y = $('#yours');
    if (y) y.innerHTML += `<div class="lbl">look closer</div><span class="g">${esc(S.confusionNote)}</span>`;
  }
  renderRail();
  paintStats();
  $('#hint').textContent = verdict === 'ok' ? 'Correct — Enter for the next one.' : 'Not quite. Read the rule, then Enter to redo it later.';
  document.body.focus();

  if (S.stage) {
    const p = stageProgress(S.stage.id);
    if (p.passed) $('#hint').innerHTML = `<b class="up">Stage complete.</b> The next stage is unlocked on the left.`;
  }
}

function paintStats() {
  const st = S.stats;
  $('#s-streak').textContent = st.streak;
  $('#s-acc').textContent = st.total ? Math.round((st.right / st.total) * 100) + '%' : '—';
  const list = stagesForTrack();
  const idx = S.stage ? list.findIndex((x) => x.id === S.stage.id) : -1;
  $('#s-stage').textContent = idx >= 0 ? `${idx + 1}/${list.length}` : '—';
}

function syncTrackButtons() { $$('.tk').forEach((b) => b.classList.toggle('on', b.dataset.track === S.track)); }

/* ---------------- wiring ---------------- */
function wire() {
  $('#track').addEventListener('click', (e) => {
    const b = e.target.closest('.tk');
    if (!b || b.dataset.track === S.track) return;
    S.track = b.dataset.track;
    S.stage = null; S.browseOpen = null; S.block = null; S.retry = [];
    syncTrackButtons();
    const boot = S.track === 'verb' ? ensureVerbs() : Promise.resolve();
    boot.then(() => {
      renderLegend();
      const first = stagesForTrack().find((s) => stageUnlocked(s));
      if (first) startStage(first); else { renderRail(); }
    });
  });

  $('#modes').addEventListener('click', (e) => {
    const b = e.target.closest('.mode');
    if (!b) return;
    S.mode = b.dataset.mode; S.block = null;
    renderModes();
    if (S.view === 'drill') newQuestion(); else beginDrill();
  });

  $('#railtabs').addEventListener('click', (e) => {
    const b = e.target.closest('.rt');
    if (!b) return;
    S.railTab = b.dataset.tab;
    $$('.rt').forEach((x) => x.classList.toggle('on', x === b));
    renderRail();
  });

  $('#btn-startdrill').onclick = beginDrill;
  $('#btn-check').onclick = check;
  $('#btn-next').onclick = () => { if (S.view === 'drill') newQuestion(); };
  $('#btn-pattern').onclick = () => { if (S.stage) showLearn(S.stage); };

  $('#btn-why').onclick = () => {
    const t = $('#trace');
    t.hidden = !t.hidden;
    $('#btn-why').textContent = t.hidden ? 'show the derivation' : 'hide the derivation';
  };

  $('#btn-practise').onclick = () => {
    if (!S.refStem) return;
    const famId = S.refStem.family;
    startStage({ id: 'adhoc-' + famId, track: 'noun', title: famOf(S.refStem).label,
                 why: 'You chose to drill this family.', families: [famId], cases: [],
                 modes: ['build', 'reverse'], adhoc: true });
    beginDrill();
  };

  $('#btn-reset').onclick = () => {
    if (!confirm('Reset all progress on this device?')) return;
    S.stats = { streak: 0, total: 0, right: 0, stages: {}, slots: {}, fam: {}, seen: {} };
    saveStats(); paintStats(); renderRail();
  };

  $('#input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); S.answered ? newQuestion() : check(); }
    if (e.key === 'Escape') $('#input').value = '';
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (document.activeElement === $('#input')) return;
    if (S.view !== 'drill') return;
    e.preventDefault();
    if (S.answered) newQuestion(); else $('#input').focus();
  });

  const KEYS = ['ā', 'ī', 'ū', 'ṛ', 'ñ', 'ṅ', 'ṇ', 'ś', 'ṣ', 'ṃ', 'ḥ', 'ṭ', 'ḍ'];
  $('#keys').innerHTML = KEYS.map((k) => `<button type="button">${k}</button>`).join('');
  $('#keys').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const inp = $('#input');
    const s = inp.selectionStart ?? inp.value.length;
    const ep = inp.selectionEnd ?? s;
    inp.value = inp.value.slice(0, s) + b.textContent + inp.value.slice(ep);
    inp.focus(); inp.setSelectionRange(s + 1, s + 1);
  });
}

/* ---------------- boot ---------------- */
(async function boot() {
  S.stats = loadStats();
  [S.index, S.curriculum] = await Promise.all([getJSON('data/index.json'), getJSON('data/curriculum.json')]);
  try { await loadFrames(); } catch (e) { /* fallbacks stand in */ }
  window.__prakriya = S;
  wire();
  renderLegend();
  const first = stagesForTrack().find((s) => stageUnlocked(s));
  if (first) startStage(first);
  else { renderRail(); showView('learn'); }
})();
