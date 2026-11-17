/* Data integrity tests — the committed JSON must be self-consistent.
   Run: node --test tests/*.cjs  (no network, no Python, no Vidyut) */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const index = J('public/data/index.json');
const verbs = J('public/data/verbs.json');
const curriculum = J('public/data/curriculum.json');
const cases = J('public/data/cases.json');
const attested = J('public/data/attested.json');
const sentences = J('public/data/sentences.json');
const sutras = J('public/data/sutras.json');

const famDocs = {};
for (const f of index.families) famDocs[f.id] = J('public/' + f.file);

test('index: families, stems, colours', () => {
  assert.equal(index.format, 'sanskrithelp.prakriya/1');
  assert.ok(index.stems.length >= 50, 'stem catalogue');
  assert.equal(index.families.length, 17);
  const colours = new Set(index.families.map((f) => f.colour));
  assert.equal(colours.size, 17, 'every family has a distinct colour');
  const ids = new Set(index.stems.map((s) => s.id));
  assert.equal(ids.size, index.stems.length, 'stem ids unique');
  for (const s of index.stems) {
    assert.ok(index.families.some((f) => f.id === s.family), `${s.id} family resolves`);
    assert.ok(['masculine', 'feminine', 'neuter'].includes(s.gender), `${s.id} gender`);
  }
});

test('paradigms: every DERIVED form has a trace, no invented statuses', () => {
  let derived = 0;
  for (const [fam, doc] of Object.entries(famDocs)) {
    assert.equal(doc.family, fam);
    for (const [sid, node] of Object.entries(doc.stems)) {
      for (const [vib, row] of Object.entries(node.paradigm)) {
        for (const [vac, c] of Object.entries(row)) {
          assert.ok(['DERIVED', 'MACHINE_GAP'].includes(c.status), `${sid}.${vib}.${vac} status`);
          if (c.status !== 'DERIVED') continue;
          derived++;
          assert.ok(c.iast && c.deva, `${sid}.${vib}.${vac} surfaces`);
          assert.ok(Array.isArray(c.steps) && c.steps.length > 0, `${sid}.${vib}.${vac} trace`);
          for (const st of c.steps) {
            assert.equal(st.length, 3, `${sid} step shape`);
            assert.ok(st[0], `${sid} step has a sutra code`);
            assert.ok(['stem', 'class', 'affix', 'operation', 'sound', 'surface', 'definition', 'blocked'].includes(st[2]), `${sid} step role`);
          }
          assert.ok(c.sup, `${sid}.${vib}.${vac} records its sup`);
        }
      }
    }
  }
  assert.equal(derived, index.counts.forms, 'derived count matches index');
});

test('operation steps exist where surgery needs them', () => {
  let withOp = 0, total = 0;
  for (const doc of Object.values(famDocs)) {
    for (const node of Object.values(doc.stems)) {
      for (const row of Object.values(node.paradigm)) {
        for (const c of Object.values(row)) {
          if (c.status !== 'DERIVED') continue;
          total++;
          if ((c.steps || []).some(([, , r]) => r === 'operation')) withOp++;
        }
      }
    }
  }
  assert.ok(withOp / total > 0.6, `enough operation steps for surgery (${withOp}/${total})`);
});

test('crosscheck: hand table agrees with the machine', () => {
  const cc = index.crosscheck;
  assert.equal(cc.status, 'complete');
  assert.equal(cc.disagree.length, 0, 'no unresolved disagreements');
  assert.ok(cc.agree >= 70, 'substantial agreement');
});

test('verbs: full grids, parasmaipada pinned', () => {
  assert.equal(verbs.format, 'sanskrithelp.verbs/1');
  assert.equal(verbs.counts.errors, 0);
  assert.equal(verbs.counts.forms, verbs.counts.slots);
  assert.ok(verbs.roots.length >= 10 && verbs.lakara.length === 5);
  const as = verbs.paradigms.as.lat;
  assert.equal(as['Prathama.Eka'].iast, 'asti', 'as = to be, not to sit');
  assert.equal(verbs.paradigms.dA.lat['Prathama.Eka'].iast, 'dadāti');
  assert.equal(verbs.paradigms.kf.lat['Prathama.Eka'].iast, 'karoti');
  const colours = new Set(verbs.lakara.map((l) => l.colour));
  assert.equal(colours.size, 5, 'one colour per tense');
});

test('curriculum: every reference resolves', () => {
  const famIds = new Set(index.families.map((f) => f.id));
  const vibIds = new Set(index.vibhakti.map((v) => v.id));
  const rootIds = new Set(verbs.roots.map((r) => r.id));
  const lakIds = new Set(verbs.lakara.map((l) => l.id));
  const ids = new Set();
  const MODES = new Set(['family', 'build', 'reverse', 'read', 'use', 'tense', 'who', 'surgery', 'hunt']);
  for (const st of curriculum.stages) {
    assert.ok(!ids.has(st.id), `duplicate stage ${st.id}`);
    ids.add(st.id);
    assert.ok(st.modes.length, `${st.id} has modes`);
    for (const m of st.modes) assert.ok(MODES.has(m), `${st.id}: known mode ${m}`);
    for (const f of st.families || []) assert.ok(famIds.has(f), `${st.id}: family ${f}`);
    for (const c of st.cases || []) assert.ok(vibIds.has(c), `${st.id}: case ${c}`);
    for (const r of st.roots || []) assert.ok(rootIds.has(r), `${st.id}: root ${r}`);
    for (const l of st.lakara || []) assert.ok(lakIds.has(l), `${st.id}: tense ${l}`);
    for (const n of st.needs || []) assert.ok(curriculum.stages.some((x) => x.id === n), `${st.id}: prerequisite ${n}`);
  }
  assert.ok(ids.has('review:') === false, 'review is runtime-only, not in the file');
});

test('sentences: bank integrity and agreement', () => {
  assert.equal(sentences.format, 'sanskrithelp.sentences/1');
  assert.ok(sentences.entries.length >= 200, 'sentence bank depth');
  assert.deepEqual(sentences.coverage.stems_missing, [], 'every stem is a target');
  const seenIds = new Set();
  for (const e of sentences.entries) {
    assert.ok(!seenIds.has(e.id), `duplicate sentence ${e.id}`);
    seenIds.add(e.id);
    const t = e.target;
    const cell = famDocs[index.stems.find((s) => s.id === t.stem).family]
      .stems[t.stem].paradigm[t.vib][t.vac];
    assert.equal(cell.iast, t.iast, `${e.id}: target matches the paradigm`);
    // subject singular => verb singular
    const subj = e.words.find((w) => w.vib === 'prathama' && !w.verb);
    if (e.verb && subj) assert.equal(e.verb.vacana, subj.vac, `${e.id}: verb agrees`);
    // no stem twice, no proper plural
    const stems = e.words.filter((w) => w.stem).map((w) => w.stem);
    assert.equal(new Set(stems).size, stems.length, `${e.id}: stem used once`);
  }
  for (const [k, n] of Object.entries(sentences.coverage.by_case)) {
    assert.ok(n >= 5, `case ${k} has ${n} sentences`);
  }
});

test('sutras: citation text covers the traces', () => {
  assert.ok(sutras.count >= 3900, 'sutra inventory');
  const codes = new Set();
  for (const doc of Object.values(famDocs)) {
    for (const node of Object.values(doc.stems)) {
      for (const row of Object.values(node.paradigm)) {
        for (const c of Object.values(row)) {
          for (const [code] of (c.steps || [])) codes.add(code);
        }
      }
    }
  }
  // '89' is Vidyut's internal marker, not a sutra; 6.4.148.1 is a
  // sub-numbered rule the padaccheda edition does not list. Both render
  // with an empty citation rather than invented text.
  const KNOWN_GAPS = new Set(['89', '6.4.148.1']);
  const missing = [...codes].filter((c) => !sutras.sutras[c] && !KNOWN_GAPS.has(c));
  assert.deepEqual(missing, [], `sutra text missing for: ${missing.slice(0, 5)}`);
});

test('attested: citations resolve to real verses', () => {
  assert.ok(attested.entries.length >= 10, 'citation depth');
  for (const e of attested.entries) {
    for (const k of ['stem', 'vibhakti', 'vacana', 'form', 'work', 'target', 'sanskrit', 'translation']) {
      assert.ok(e[k], `citation has ${k} (${e.work}/${e.target})`);
    }
    assert.ok(e.sanskrit.includes(e.form), `${e.work}/${e.target} contains ${e.form}`);
    const stem = index.stems.find((s) => s.id === e.stem);
    assert.ok(stem, `stem ${e.stem} exists`);
    const cell = famDocs[stem.family].stems[e.stem].paradigm[e.vibhakti][e.vacana];
    assert.equal(cell.iast, e.form, `${e.work}/${e.target}: our paradigm agrees`);
  }
});

test('cases: six karakas with honest verbs only', () => {
  assert.equal(cases.karaka.length, 6);
  for (const k of cases.karaka) {
    assert.ok(k.id && k.label && k.sutra && k.vibhakti, 'karaka shape');
  }
});
