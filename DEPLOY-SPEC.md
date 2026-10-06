# DEPLOY SPEC — sanskrit.help is LIVE (2026-10-06)

> Status: GREEN since `817f47c`. Site tracks `main` on every push.

## What was actually wrong (4 stacked build bugs, not the token)
1. ESLint `react/no-unescaped-entities` errors (apostrophes) — failed `npm run build`.
2. `vitest.config.ts` committed without tsconfig exclusion — `Cannot find module 'vitest/config'`.
3. Missing `esbuild` dep (corrupt lockfile) — opennext bundle crash.
4. Uncommitted `lib/learning/skills.ts` — webpack `Module not found: ./skills`.
Each masked the next. The R2 token was NEVER the problem — it deploys fine
with explicit `CLOUDFLARE_ACCOUNT_ID` in workflow env (kept as safety).

## If deploy goes red again
Read the failed log for the FIRST error (later errors are usually masks):
`gh run view <ID> --repo prx0r/sanskrithelp --log` (full log — `--log-failed`
hides webpack details).

## Goal — MET 2026-10-06
`https://sanskrit.help/memory/nyasa` shows Night 5 + hand/fingers;
`/memory/practice-chart` + Track 1 + `/memory/hindi` (Talk, Constructicon) live.

## Blocker (RESOLVED — was never the token)
`CLOUDFLARE_API_TOKEN` repo secret is an R2-scoped token. Wrangler deploy
fails at `/memberships` (HTTP 400) — it cannot resolve the account.

**Required:** new token via dash.cloudflare.com → My Profile → API Tokens →
Create Token → **Edit Cloudflare Workers** template, plus add:
- Workers R2 Storage: Edit (opennext cache bucket `sanskrit-learning-app-opennext-cache`)
- (template already includes Account: Read + Workers Scripts: Edit)

Then:
```bash
printf '%s' '<NEW-cfat-VALUE>' | gh secret set CLOUDFLARE_API_TOKEN --repo prx0r/sanskrithelp
gh run rerun <LATEST-RUN-ID> --repo prx0r/sanskrithelp --failed
# or: git commit --allow-empty -m 'trigger deploy' && git push origin main
```

## Acceptance
1. `gh run list --repo prx0r/sanskrithelp --limit 1` → completed success.
2. Live fetch of `/memory/nyasa` contains "5" night row + "right hand" and no
   "right elbow". (Confirmed stale 2026-10-05: old caption, 4→6 skip, elbow/wrist.)

## Already hardened (do not regress)
- `npx next lint` clean (two `react/no-unescaped-entities` errors fixed).
- `tsconfig.json` excludes `vitest.config.ts`, `tests/`, `**/*.test.*`
  (CI type-check failed on `vitest/config` otherwise).
- `npm run build` passes locally, all `/memory/*` routes prerendered.
- `npm test`: 6 files / 23 green, incl. `tests/matrika-canonical.test.ts`.

## Rollback
Deploys are worker-versioned; previous green run unknown (all recent runs
red). If new deploy misbehaves: Cloudflare dashboard → Workers → Rollback.
