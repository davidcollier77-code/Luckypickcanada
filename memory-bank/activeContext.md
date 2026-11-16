# Active Context — QA checker effectiveness and reliability

- **Updated:** 2026-11-16
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** freebuff/qa-checker-effectiveness
- **Base:** main at 4bfec5969d9872e01257f8591ff30292ce3c280a
- **Spec Kit feature:** specs/171-qa-checker-effectiveness
- **Pull request:** #1925 (open, unmerged)
- **Evaluation vehicle:** Lucky Meter PR #1924, head 6eb2ae7e, application fix push 2d487227

## Current Task

Improve the accuracy, usefulness, reliability and efficiency of the repository's
QA checkers, using the PR #1924 review and fix cycle as the evaluation.

## Implemented State

- Changed-code reviewer findings now carry a `confirmed`/`potential`
  classification beside severity and confidence, collapse by path, line and rule,
  and report how many duplicates were collapsed.
- Five advisory code-defect rules: `focused-test`, `await-in-for-each`,
  `empty-catch-block`, `unused-import` (fully added, non-documentation files
  only; the `React` default import is excluded) and `assignment-in-condition`
  (balanced-parenthesis condition parsing; comparisons and deliberate
  assign-and-test forms are excluded).
- Checker responsibility separation is designed, not implemented: the inventory,
  category ownership, covered-versus-gap analysis, manual-only list and the
  P0–P5 sequence live in `specs/171-qa-checker-effectiveness/plan.md`. Only the
  general code-defect reviewer changed here; no new workflow or dependency.
- The Markdown report shows classification, confirmed count and duplicate count.
- Every finding carries a concrete suggested fix, rendered as "Suggested fix",
  and the report is published as one sticky pull request comment that is
  updated in place instead of posted once per run.
- The report suggests Playwright visual verification only when rendering paths
  changed and performance measurement only for performance-sensitive paths; it
  states plainly that no browser verification is suggested for documentation,
  tooling, CI or unit-test-only changes, mirroring the Visual QA classifier.
- `.github/scripts/verify-playwright-cache.sh` validates a restored Playwright
  cache; the Visual QA job installs Chromium when the cache has no executable and
  keeps the system-dependency install and both shards when it does.
- Classifier regression coverage now executes performance paths and ambiguous
  application code; no classifier rule was loosened.
- PR #1924 carries the one confirmed application fix from the review cycle: the
  medallion and ornament renderers rebuild their WebGL resources and re-announce
  readiness after a context restore.

## Verification

- QA checker suites: 183 tests passed.
- `pnpm exec vitest run`: 81 files / 801 tests passed.
- `pnpm exec tsc --noEmit`: exit 0.
- `./freebuff-verify.sh`: exit 0 (Spec Kit gate, governance suites, type check,
  production build, docs tests).
- Production build (`.next` + `public`): 340,039,798 bytes = 324.29 MiB, below the
  495 MiB cap.
- PR #1924: 82 files / 805 tests and a clean type check on the fix commit.

## Limitations

- Playwright visual regression was not executed locally (no GPU or browser on this
  runner); committed baselines, both shards and all three projects are unchanged.
- The new rules are line-oriented, so a multi-line empty catch or multi-line
  import can be missed and is never guessed.
- External reviewers remain advisory and unchanged; Graphite skipped PR #1924 for
  size and Pullfrog failed on provider quota.
- The six Visual QA annotations on PR #1924 shard 2/2 were not retrievable through
  the connected tools.

## 2026-11-16 — Lucky Meter percentage-owned reveal and natural leaves

- The percentage is now the single source of truth: `config.js` holds the
  inclusive bands 5–30 / 31–65 / 66–100, each tier owns its `eventId`, and the
  event weights and independent event draw are gone. `selection.js` derives
  tier, event and numbers from the sampled percentage and normalizes stale saved
  records in place without rerolling or clearing storage.
- `reveal.js` defines the 3.6°-per-percent contract with the 0°/100 % wrap; the
  dial spins 3–5 turns from a random start with a quintic ease-out and lands on
  `percentage × 3.6°`. `DailyResonance` reads the displayed number from the dial
  angle, hides the true value until landing, and the ring exposes
  `data-dial-angle`.
- Leaves are thinner (0.02 blade, 0.012 bevel) with a 0.052 dome and 0.044 cup,
  dry-pigment metal values and per-leaf flutter/pitch/roll/bank from the shared
  wind field. The near layer stays outside the padded copy lane.
- A brass index sweeps the milled rim; the medallion fallback and gold CTAs got
  tighter highlights without dimension, label or focus changes. The golden
  finale alone was amplified (bigger gold/willow shells, longer trails, more
  embers, two shockwaves, warmer light); the red/silver opening is untouched.

### Verification

- Focused Lucky Meter unit suites: 9 files / 90 tests passed.
- `pnpm exec tsc --noEmit`: exit 0.
- Playwright `tests/visual/lucky-meter-daily-resonance.spec.ts` on desktop,
  mobile-390 and mobile-412: 45 passed, 6 skipped (capture-only block).
- Production build: `.next` 389 MiB + `public` 34 MiB = 423 MiB, below 495 MiB.
- Evidence: `artifacts/lucky-meter-visual-realism-20261116/` (`before/`,
  `after/`, `playwright.log`, `build.log`, `freebuff-verify.log`).

### Limitations

- Audio cues were not listened to; their scheduling is unchanged and the audio
  suites pass.
- The dev server's CSS bundle went stale in `.next/dev` during this task; a CSS
  edit only appeared after removing `.next`. If a visual change seems to have no
  effect in dev, clear `.next` before re-capturing.
