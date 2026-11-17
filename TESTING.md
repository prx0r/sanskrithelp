# TESTING — every gate and its exact command

Nothing here is optional-by-vibes. A skip must carry a reason; a BLOCKED must
say BLOCKED. House law: DERIVED ≠ truth, BLOCKED ≠ PASS, disagreements are
recorded, nothing invented.

## 1. Fast gates (what CI runs, ~1 min, no network, no Vidyut)

```sh
python3 tools/build_sentences.py --check   # bank is deterministic
python3 tools/verify_data.py               # cross-file integrity
node --test tests/*.cjs                    # 10 committed-data tests
```

CI (`.github/workflows/check.yml`) runs exactly these three on every push
and PR. Keep them green.

## 2. Full regeneration (needs the toolchain, runs on this box)

```sh
pip install vidyut==0.4.0
python3 -c "from vidyut import download_data; download_data('/root/vidyut-0.4.0')"

python3 tools/build_paradigms.py --check   # needs vidyut + kosha
python3 tools/build_verbs.py --check       # needs vidyut + kosha
python3 tools/check_curated.py             # (svread) needs vidyut + node
python3 tools/build_attested.py --check    # needs SVREAD_DATA=/root/svread/data
python3 tools/fetch_sutras.py --check      # needs tools/.cache or network
python3 tools/build_sentences.py --check   # offline-safe (also in CI)
python3 tools/verify_data.py               # offline-safe (also in CI)
```

`build_attested.py --check` exits 1 when the svread corpus is absent. That is
neither pass nor defect on a box without it; the committed JSON stays
authoritative and `verify_data.py` still checks its shape.

## 3. Browser (Playwright, local Chrome)

```sh
python3 -m http.server 8799 --directory public   # serve the build
python3 /tmp/<script>.py                          # scenario scripts
```

Scenarios live ad hoc in /tmp during development; the contract they check:
no page scroll at 360/390/1024/1340, no console errors, every mode answers
and grades, family prompt neutral until answered.

## 4. MCP (live)

```sh
# Streamable HTTP, no auth; note Cloudflare rejects the literal
# Python-urllib/* user agent, so probe with a normal one.
```

Probe `initialize → tools/list → form/check/parse/drill/attested/sentence`
and expect: 15 tools, withheld answers by default, `reveal:true` to include.

## 5. Release hygiene (every content change)

1. Regenerate the affected emitter(s) in write mode.
2. `node --test tests/*.cjs` → must pass.
3. Commit the data and the code together; never commit data without the
   matching tree (and vice versa).
4. Push → deploy workflow runs `verify_data.py`, then `wrangler deploy`.

## 6. What the suites do NOT prove

- A green suite is consistency of checked-in bytes, not scholarly review.
- `AGREE` (72/72) means the machine reproduces the hand table; it is not truth.
- Derivation traces are computations, not readings.
- Attested citations are verified to exist with translations; the verses
  themselves remain hard text, labelled as such.
