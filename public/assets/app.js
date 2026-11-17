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
  return modes;
}

function np(stemId, vacId) {
  const s = stemById(stemId);
  if (PROPER.has(stemId)) return vacId === 'eka' ? s.gloss : `${s.gloss}s`;
  if (MASS.has(stemId)) return `the ${s.gloss}`;
  if (vacId === 'eka') return `the ${s.gloss}`;
  if (vacId === 'dvi') return `the two ${plural(s.gloss)}`;
  return `the ${plural(s.gloss)}`;
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

async function makeQuestion() {
  if (S.track === 'verb') return makeVerb();

  // retry items come first, but not every time
  if (S.retry.length && Math.random() < 0.55) {
    const r = S.retry.shift();
    const q = await nounFrom(r.stem, r.vib, r.vac, r.mode);
    if (q) return q;
  }

  const stem = pick(nounPool());
  const family = famOf(stem);
  const modes = nounModes();
  const mode = modes.includes(S.mode) ? S.mode : modes[0];

  if (mode === 'use') {
    const vibs = casesInScope();
    return makeSentence(pick(vibs).id);
  }

  if (mode === 'family') {
    return { track: 'noun', mode, stem, family, colour: family.colour,
             cue: `Which family is “${stem.iast}”?`, asks: 'name the declension class' };
  }
  const { vib, vac } = nextSlot();
  return nounFrom(stem.id, vib.id, vac.id, mode);
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
  return { track: 'noun', mode: 'build', stem, family, vib, vac, cell: c, doc,
           colour: family.colour, answer: c.iast,
           cue: nounCue({ stem, vib, vac }),
           asks: `${vib.en} ${vac.en}` };
}

async function makeVerb() {
  const v = await ensureVerbs();
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

const KIND = {
  // people and beings
  deva: 'person', rAma: 'person', nara: 'person', vIra: 'person', putra: 'person',
  sItA: 'person', kanyA: 'person', BAryA: 'person', devI: 'person', patnI: 'person',
  saKI: 'person', gOrI: 'person', vaDU: 'person', kavi: 'person', muni: 'person',
  fzi: 'person', pati: 'person', guru: 'person', pitf: 'person', BrAtf: 'person',
  rAjan: 'person', Bavant: 'person', Bagavant: 'person', kartf: 'person', dAtf: 'person',
  // animals
  aSva: 'animal', go: 'animal',
  // places
  vana: 'place', gfha: 'place', gaNgA: 'place', nadI: 'place', giri: 'place', BU: 'place',
  // things / abstract
  Pala: 'thing', jala: 'thing', rUpa: 'thing', cakra: 'thing', dAna: 'thing',
  mAlA: 'thing', kalA: 'thing', latA: 'thing', agni: 'thing', sUrya: 'thing',
  BAnu: 'thing', vAri: 'thing', daDi: 'thing', maDu: 'thing', vasu: 'thing',
  vAc: 'thing', manas: 'thing', Atman: 'thing', kula: 'thing', vfkza: 'thing',
  raTa: 'thing', Satru: 'person', ripu: 'person',
};
const kindOf = (id) => KIND[id] || 'thing';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const PROPER = new Set(['rAma', 'sItA', 'gaNgA', 'gOrI']);
const MASS = new Set(['jala', 'vAri', 'daDi', 'maDu', 'vasu', 'BU', 'agni', 'vAc']);
const IRREG = { man: 'men', wife: 'wives', hero: 'heroes', being: 'beings' };
function plural(gloss) {
  if (IRREG[gloss]) return IRREG[gloss];
  if (/(s|x|ch|sh)$/.test(gloss)) return gloss + 'es';
  if (/[^aeiou]y$/.test(gloss)) return gloss.slice(0, -1) + 'ies';
  if (/o$/.test(gloss)) return gloss + 'es';
  return gloss + 's';
}
function enNoun(id, gloss, vac) {
  const proper = PROPER.has(id);
  if (vac === 'bahu') return `the ${plural(gloss)}`;
  if (vac === 'dvi') return `the two ${plural(gloss)}`;
  return proper ? gloss : `the ${gloss}`;
}

const FRAMES = [
  { vib: 'prathama', verb: 'gacchati', verbEn: 'goes',
    roles: [{ vib: 'prathama', kinds: ['person', 'animal'] }],
    en: (r) => `${cap(r[0].en)} goes.`,
    order: (w) => `${w[0]} gacchati` },
  { vib: 'dvitiya', verb: 'paṭhati', verbEn: 'reads',
    roles: [{ vib: 'prathama', kinds: ['person'] }, { vib: 'dvitiya', kinds: ['thing'] }],
    en: (r) => `${cap(r[0].en)} reads ${r[1].en}.`,
    order: (w) => `${w[0]} ${w[1]} paṭhati` },
  { vib: 'tritiya', verb: 'gacchati', verbEn: 'goes',
    roles: [{ vib: 'prathama', kinds: ['person'] }, { vib: 'tritiya', kinds: ['person', 'animal'] }],
    en: (r) => `${cap(r[0].en)} goes with ${r[1].en}.`,
    order: (w) => `${w[0]} ${w[1]} saha gacchati` },
  { vib: 'caturthi', verb: 'dadāti', verbEn: 'gives',
    roles: [{ vib: 'prathama', kinds: ['person'] }, { vib: 'caturthi', kinds: ['person'] },
            { vib: 'dvitiya', kinds: ['thing'] }],
    en: (r) => `${cap(r[0].en)} gives ${r[2].en} to ${r[1].en}.`,
    order: (w) => `${w[0]} ${w[1]} ${w[2]} dadāti` },
  { vib: 'pancami', verb: 'gacchati', verbEn: 'goes',
    roles: [{ vib: 'prathama', kinds: ['person', 'animal'] }, { vib: 'pancami', kinds: ['place'] }],
    en: (r) => `${cap(r[0].en)} goes from ${r[1].en}.`,
    order: (w) => `${w[0]} ${w[1]} gacchati` },
  { vib: 'sasthi', verb: 'asti', verbEn: 'is',
    roles: [{ vib: 'sasthi', kinds: ['person'] }, { vib: 'prathama', kinds: ['thing'] }],
    en: (r) => `${cap(r[1].en)} belongs to ${r[0].en}.`,
    order: (w) => `${w[0]} ${w[1]} asti` },
  { vib: 'saptami', verb: 'asti', verbEn: 'is',
    roles: [{ vib: 'prathama', kinds: ['person', 'animal', 'thing'] }, { vib: 'saptami', kinds: ['place'] }],
    en: (r) => `${cap(r[0].en)} is in ${r[1].en}.`,
    order: (w) => `${w[0]} ${w[1]} asti` },
  { vib: 'sambodhana', verb: '', verbEn: '',
    roles: [{ vib: 'sambodhana', kinds: ['person'] }],
    en: (r) => `“O ${r[0].gloss}!” — calling out.`,
    order: (w) => `he ${w[0]}` },
];

async function formOf(stemId, vibId, vacId) {
  const stem = stemById(stemId);
  if (!stem) return null;
  const doc = await loadFamily(stem.family);
  const c = doc.stems[stem.id]?.paradigm?.[vibId]?.[vacId];
  if (!c || c.status !== 'DERIVED') return null;
  return { stem, family: famOf(stem), cell: c };
}

function pickByKind(kinds) {
  const pool = nounPool().filter((s) => kinds.includes(kindOf(s.id)));
  if (pool.length) return pick(pool);
  const any = S.index.stems.filter((s) => kinds.includes(kindOf(s.id)));
  return pick(any.length ? any : S.index.stems);
}

async function makeSentence(focusVibId) {
  const frames = FRAMES.filter((f) => !focusVibId || f.vib === focusVibId);
  const frame = pick(frames.length ? frames : FRAMES);
  const subjIdx = frame.roles.findIndex((r) => r.vib === 'prathama');

  const parts = [];
  for (let i = 0; i < frame.roles.length; i++) {
    const role = frame.roles[i];
    // The subject stays singular so the 3rd-singular verb agrees; other
    // slots carry the number practice.
    let stem = pickByKind(role.kinds);
    for (let t = 0; t < 8 && parts.some((x) => x.stem.id === stem.id); t++) {
      stem = pickByKind(role.kinds);
    }
    const mass = MASS.has(stem.id);
    const vac = (i === subjIdx || mass) ? 'eka' : (Math.random() < 0.65 ? 'eka' : 'bahu');
    const f = await formOf(stem.id, role.vib, vac);
    if (!f) return makeSentence(focusVibId);
    parts.push({ stem, family: f.family, cell: f.cell, vib: role.vib, vac,
                 en: enNoun(stem.id, stem.gloss, vac) });
  }

  let target = parts.findIndex((p) => p.vib === frame.vib);
  if (target < 0) target = 0;

  const vib = S.index.vibhakti.find((v) => v.id === parts[target].vib);
  const w = S.index.vacana.find((x) => x.id === parts[target].vac);
  return {
    track: 'noun', mode: 'use', frame,
    parts, target, vib, vac: w,
    stem: parts[target].stem, family: parts[target].family,
    colour: parts[target].family.colour,
    cell: parts[target].cell,
    doc: S.famCache[parts[target].family.id],
    answer: parts[target].cell.iast,
    cue: frame.en(parts),
    asks: `${parts[target].stem.gloss} — ${vib.en} ${w.en}`,
    sentenceEn: frame.en(parts),
  };
}

function renderSentence(q, revealed) {
  const words = q.frame.order(q.parts.map((p, i) => {
    if (i !== q.target) return `<span class="w" title="${esc(p.cell.iast)}">${esc(p.cell.deva)}</span>`;
    if (!revealed) return `<span class="blank">?</span>`;
    return `<span class="w filled" title="${esc(p.cell.iast)}">${esc(p.cell.deva)}</span>`;
  }));
  const iast = q.frame.order(q.parts.map((p, i) =>
    i === q.target ? (revealed ? p.cell.iast : '____') : p.cell.iast)).replace(/<[^>]+>/g, '');
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
    const ex = await makeSentence(st.cases && st.cases.length ? st.cases[0] : null);
    const words = ex.frame.order(ex.parts.map((p) =>
      `<span class="${p.vib === ex.vib.id ? 'hl' : ''}">${esc(p.cell.deva)}</span>`));
    $('#learngrid').innerHTML += `<div class="lg-sent">
      <div class="t">then use it in a sentence</div>
      <div class="d">${words}</div>
      <div class="i">${esc(ex.frame.order(ex.parts.map((p) => p.cell.iast)))}</div>
      <div class="e">${esc(ex.sentenceEn)}</div>
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
  const label = { family: 'Family', build: 'Form', reverse: 'Parse', read: 'Read', tense: 'Tense', use: 'In a sentence' };
  const sub = { family: 'name the class', build: 'meaning → form', reverse: 'form → meaning', read: 'match the meaning', tense: 'name the tense', use: 'fill the slot' };
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
  $('#cue').innerHTML = q.mode === 'reverse' || q.mode === 'tense'
    ? `<span class="cd dev">${esc(q.cue)}</span><span class="ci">${esc(q.cueIast || '')}</span>`
    : `<span class="cue-m">${esc(q.cue)}</span>`;

  $('#cue-sub').textContent = q.asks || '';
  const tags = [];
  if (q.track === 'noun') {
    if (q.mode === 'reverse') tags.push('<span class="tag">more than one answer may be right</span>');
    else tags.push(`<span class="tag fam">${esc(q.family.label)}</span>`);
    if (q.vib) tags.push(`<span class="tag case">${esc(q.vib.en)}</span><span class="tag num">${esc(q.vac.en)}</span>`);
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
  if (q.mode === 'family' || !q.cell) { host.innerHTML = ''; return; }

  if (q.track === 'noun') {
    const p = q.doc.stems[q.stem.id].paradigm;
    let html = '<div class="sg noun"><div class="h"></div>' +
      S.index.vacana.map((w) => `<div class="h">${w.en.slice(0, 3)}</div>`).join('');
    for (const v of S.index.vibhakti) {
      const inScope = casesInScope().some((x) => x.id === v.id);
      html += `<div class="rh ${inScope ? '' : 'out'}">${v.en.slice(0, 5)}</div>`;
      for (const w of S.index.vacana) {
        const c = p[v.id]?.[w.id];
        const isT = q.mode === 'build' ? (v.id === q.vib.id && w.id === q.vac.id)
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

function renderPath(host) {
  const stages = stagesForTrack();
  host.innerHTML = stages.map((st, i) => {
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
  host.querySelectorAll('[data-stage]').forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    startStage(S.curriculum.stages.find((x) => x.id === b.dataset.stage));
  }));
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
  S.mode = (st.modes && st.modes[0]) || 'build';
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
  $('#stagegrid').innerHTML = '';
  $('#input').value = '';
  $('#input').placeholder = (S.q.mode === 'reverse' || S.q.mode === 'read') ? 'genitive singular'
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
    st.stages[id] = st.stages[id] || { t: 0, r: 0 };
    st.stages[id].t++;
    if (verdict === 'ok') st.stages[id].r++;
  }
  const key = S.q.track === 'noun' ? S.q.family.id : S.q.lak.id;
  st.fam[key] = st.fam[key] || { t: 0, r: 0 };
  st.fam[key].t++;
  if (verdict === 'ok') { st.right++; st.streak++; st.fam[key].r++; } else st.streak = 0;

  // per-slot mastery (family × case × number, or tense × person × number)
  if (S.q.track === 'noun' && S.q.vib) {
    const k = `${S.q.family.id}|${S.q.vib.id}|${S.q.vac.id}`;
    st.slots[k] = st.slots[k] || { t: 0, r: 0 };
    st.slots[k].t++; if (verdict === 'ok') st.slots[k].r++;
  } else if (S.q.track === 'verb' && S.q.lak) {
    const k = `v|${S.q.lak.id}|${S.q.pu.id}|${S.q.va.id}`;
    st.slots[k] = st.slots[k] || { t: 0, r: 0 };
    st.slots[k].t++; if (verdict === 'ok') st.slots[k].r++;
  }

  // wrong → re-ask this exact item later in the session
  if (verdict === 'bad' && S.q.track === 'noun' && S.q.vib) {
    S.retry.push({ stem: S.q.stem.id, vib: S.q.vib.id, vac: S.q.vac.id, mode: S.q.mode });
  }

  saveStats();

  renderAfter(S.q, verdict, input);
  renderFeedback(S.q, verdict, input);
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
  window.__prakriya = S;
  wire();
  renderLegend();
  const first = stagesForTrack().find((s) => stageUnlocked(s));
  if (first) startStage(first);
  else { renderRail(); showView('learn'); }
})();
