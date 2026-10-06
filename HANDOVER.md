# HANDOVER — sanskrithelp (2026-10-06 cleanup)

> Threads: A doctrine · B Hindi engine · C voice/conversation · D corpus ·
> E music/geometry · F ops. Map: docs/visions/VISION-INDEX.md (canonical:
> docs/visions/awesomevision.md).

## State
- 57/57 tests green · tsc clean · build prerenders (incl. /memory/hindi, /api/tts, /api/voice-tutor).
- Open threads: simulator/coach in-progress files (NOT committed, not mine);
  deploy red (Workers token scope — DEPLOY-SPEC.md); Stanza blocked (torch);
  corpus = spec only (disk rule); live voice needs QWEN/GEMINI keys + relay.

## Prior sessions (2026-10-05)

## Repos & commits
- `sanskrithelp` (branch `main`, HEAD `62f17c6`):
  - `891383a` provenance pass, wheel import, grace/syllabus guides
  - `b385536`→`e189415` canonical v1 + regression tests (+ vitest.config include)
  - `11412c8` ESLint apostrophe fixes; `62f17c6` tsconfig test-excludes
- `bruno` (branch `master`, HEAD `81be025`): texts-status review + seal-inventory fix
- Left uncommitted (pre-existing, not ours): simulator/coach files,
  package.json/lock churn, bruno packs/downloads. Don't sweep in blindly.

## Doctrine (locked this session)
- **Verse-literal TĀ 15.117–120 is canonical**: arms shoulder/arm/hand/fingers/nails
  (`skandha-bāhu-kara-aṅguli-nakhe`), legs hip/thigh/knee/shank/toes (`kaṭyām
  ūrvādiṣu`), `sa` = śukra, `a` = forehead. Truth source:
  `public/memory/data/matrika_body_map.json` (id `matrika-body-map-v1`, 50 entries,
  per-entry `{text, sanskrit}` tags + `apparatus_variant`).
- Apparatus (Dyczkowski vol 8 App. A+C: elbow/wrist/fingers, buttock) recorded
  only. Never mixed in one sitting. Full record: `canonical/TA15_NYASA.md`.
- Pacing (2/night), study sets, DHVANI/articulation rings, colors: OURS, labeled.
- ARTICULATION ring ≠ his *karaṇa*. No Hz doctrine. TĀ-5 ladder unverified on disk.

## New files
- `public/memory/matrka-wheel/` — R2 `stallshark/matrka_bruno_wheel.zip` import
  (`index.html` untouched) + `integrated.html` (wheel→body marker→clip loop).
- `public/memory/canonical/GRACE-AND-THE-NEOPHYTE.md`, `MATRIKA-SYLLABUS.md`
  (latter: text-only, `[REC]`-tagged, §7 lists what texts don't say).
- `tests/matrika-canonical.test.ts` (checklist + wheel agreement + nyasa guards).
- `bruno/sanskrit/BRUNO-TEXTS-STATUS.md` (holdings vs gaps; seal ops = interpreted).

## Volume paths (mounted)
- TĀ translation: `/mnt/HC_Volume_106959365/root/projects/source-library/tantra/abhinavagupta/`
  (`ahnika-*.txt`, `tantraloka-complete.txt`, `tantraloka-vol*-dyczkowski.txt`)
- Sanskrit: same dir, `gretil_tantraloka.txt` (`AbhT_15.117-120`, `AbhT_1.168-170`, `AbhT_4.207-209`, `AbhT_13.129-132` verified).
- NOT on volume: MV Sanskrit, Jayaratha, Explicatio full text, Greer/Gosnell/Sturlese.

## Pending (ordered)
1. **Deploy**: swap `CLOUDFLARE_API_TOKEN` for Workers-scoped token → rerun →
   verify live nyasa (DEPLOY-SPEC.md). R2 S3 creds for bucket work are with owner.
2. Missing 24/50 phoneme clips (`ma`, labials, retroflex, semivowels…).
3. Build-time single-sourcing (views hardcoded-but-tested today).
4. Acquire MV 8 / Jayaratha / Explicatio to close verse-vs-apparatus + seal gaps.

## Secrets hygiene
Tokens were passed via env/stdin only, never written to repo (verified by grep
before each commit). `CLOUDFLARE_API_TOKEN` secret currently = under-scoped R2
token (set 2026-10-05T21:30Z) — replace, don't append.
