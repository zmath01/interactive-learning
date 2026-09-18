# Session Handoff

**Last Updated:** 2026-09-18

## State at handoff
- Active feature: (none — v1 complete; feat-006 finishing)
- All features in `feature_list.json` status: completed (see file)

## What the next session should know
- Static site, no build step. Verify with `./init.sh` (runs `node scripts/verify.js`).
- Preview locally with `python3 -m http.server 8000` (fetch() needs HTTP, not file://).
- Bilingual invariant: any new user-facing string needs both `en` and `zh`.
- `harnessz/` (parent dir) was the initial harness scaffold; this project carries its own harness.

## Blockers
- None.

## Current Objective
- v1 complete. Keep the harness green and extend the library.

## Recommended Next Step
- Add simulation authoring to the Builder, **or** add more built-in interactives
  (e.g. Kepler's Laws, Data Visualization, Word problems) to `data/interactives.json`.

## Files touched this session
- `index.html`, `assets/css/styles.css`
- `assets/js/{i18n,data,engine,builder,app}.js`
- `data/{i18n,interactives}.json`
- `scripts/verify.js`, `init.sh`, `.nojekyll`, `README.md`
- `AGENTS.md`, `feature_list.json`, `progress.md`, `session-handoff.md`
