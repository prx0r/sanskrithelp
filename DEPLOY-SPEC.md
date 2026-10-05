# DEPLOY SPEC — get sanskrit.help live on current main

## Goal
`https://sanskrit.help/memory/nyasa` shows: Night 5 present, ga/gha = right
hand / right fingers, provenance caption. Nothing else counts as done.

## Blocker (one human step)
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
