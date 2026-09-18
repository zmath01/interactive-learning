# AGENTS.md

Project harness for **interactive-learning** — a bilingual (EN/中文) static web app that
reproduces Google Research's "Learning Interactives / Generative UI" concept. It must run on
GitHub Pages with no backend and no build step.

## Startup Workflow

Before writing code:

1. **Confirm working directory** with `pwd` (should be this project root)
2. **Read this file** completely
3. **Read `README.md`** for product/architecture context
4. **Run `./init.sh`** to verify the environment and data are healthy
5. **Read `feature_list.json`** to see current feature state
6. **Review recent commits** with `git log --oneline -5`

If `./init.sh` is failing, repair that first before adding new scope.

## Working Rules

- **One feature at a time**: pick exactly one unfinished feature from `feature_list.json`
- **Verification required**: don't claim done without running `./init.sh`
- **Bilingual invariant**: every user-facing string must exist in **both** `en` and `zh`
  (UI strings in `data/i18n.json`; content as `{ en, zh }` objects in `data/interactives.json`)
- **Stay static**: no backend, no build step, no runtime dependencies; keep asset paths relative
  so the GitHub Pages project subpath works
- **Stay in scope**: don't modify files unrelated to the current feature
- **Leave clean state**: the next session must be able to run `./init.sh` immediately

## Required Artifacts

- `feature_list.json` — feature state tracker (source of truth)
- `progress.md` — session continuity log
- `init.sh` — standard startup and verification path
- `session-handoff.md` — optional, for larger sessions

## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] `./init.sh` passes (structural verification)
- [ ] Both language versions are present for any new user-facing text
- [ ] Evidence recorded in `feature_list.json` or `progress.md`
- [ ] Repository remains restartable from the standard startup path

## End of Session

1. Update `progress.md` with current state
2. Update `feature_list.json` with new feature status
3. Record any unresolved risks or blockers
4. Commit with a descriptive message once work is in a safe state
5. Leave the repo clean enough for the next session to run `./init.sh` immediately

## Verification Commands

```bash
# Full verification (recommended)
./init.sh
```

Required checks:
- `node scripts/verify.js` — structural tests for JSON parsing, bilingual field coverage, i18n key parity, and Pages readiness

Test command (this project has no package manifest; this is its test/verification command):
- `node scripts/verify.js`

Android note: on `/storage/emulated/0` the exec bit is not honored, so run `bash init.sh`
instead of `./init.sh` when developing on-device.

Optional (if the harness-creator skill is installed):
```bash
node ~/.agents/skills/harness-creator/scripts/validate-harness.mjs --target .
```

## Escalation

- **Design/scope questions**: consult `README.md`, otherwise ask the user
- **New interactive type**: add it to `assets/js/engine.js` + `data/interactives.json`, keep it bilingual
- **Repeated verification failures**: update `progress.md`, flag for human review
- **Deploy**: pushing to GitHub and enabling Pages is a human action; do not push unprompted
