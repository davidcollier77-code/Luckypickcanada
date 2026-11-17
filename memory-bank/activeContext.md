# Active Context — Exact-span DevSkim suppression for CI loopback tokens

- **Updated:** 2026-11-17
- **Branch:** freebuff/c3e3aea4b5256eb42e63e937-devskim-loopback
- **Base:** main at 44b2b3b7
- **Spec Kit feature:** specs/183-devskim-tooling-loopback-suppression

## Current Task

Suppress only the three verified DS162092 false positives in the changed-line
reviewer and its test, with exact-span predicates, positive/negative tests and
real-SARIF replay coverage. The owner narrowed the original five-finding
proposal to this rule and these two files. This follows the separate report
cleanup in PR #1948 but does not depend on that unmerged branch.

## Implemented State

- `SAFE_SECURITY_TOOLING_LOOPBACK_FILES` admits exactly
  `.github/scripts/review_pr_changes.py` and
  `.github/scripts/test_review_pr_changes.py`, and `process_sarif` unions it
  only for DS162092.
- The reviewer predicate requires the exact 16-space exclusion-set member line,
  the exact reported token, and `if host.casefold() not in {` in the preceding
  three lines. The fixture predicate requires the exact 8-space local
  health-check statement.
- `SECURITY_TOOLING_LOOPBACK_JUSTIFICATION` is in
  `VERIFIED_FALSE_POSITIVE_JUSTIFICATIONS`, so the results are removed from the
  uploaded SARIF rather than merely marked suppressed.
- Two `AuditedFinding` replay families cover both files. DS176209 was not
  touched: its two placeholder fixtures remain visible by design.

## Verification

- `py_compile` clean, including warnings-as-errors for syntax warnings.
- Focused suite: 110 tests passed.
- Real-SARIF replay: 5 results, 3 suppressed, 3 removed, 2 out-of-scope
  placeholder results remaining; second pass found zero suppressions.
- Repository gate and build measurement are recorded in `evidence.md`.

## Limitations

- The two DS176209 placeholder fixtures remain unsuppressed and will still be
  reported by scheduled scans until a separate decision.
- The real replay used the existing DevSkim 1.0.103 SARIF for the three files;
  the scanner binary itself is not installed on this runner.

---

# Active Context — DevSkim alert report review and cleanup

- **Updated:** 2026-11-17
- **Branch:** freebuff/c3e3aea4b5256eb42e63e937
- **Base:** main at 44b2b3b7
- **Spec Kit feature:** specs/182-devskim-alert-report-review

## Current Task

Audit every entry in `devskim-alerts.md`, remove only verified false
positives and stale entries, and report any genuine issue for owner approval
without implementing security changes.

## Reviewed State

- The file held ten bullets, not the nine counted in the request; all ten were
audited individually.
- A DevSkim 1.0.103 scan at HEAD reports five live findings: two DS176209
  `TODO` test fixtures in `test_check_qa_pr_scope.py` and three DS162092
  loopback tokens in `review_pr_changes.py` and `test_review_pr_changes.py`.
- Four entries are stale positional duplicates created when `bc6f2016` moved
  the tokens (313/314 to 569/570 and 133 to 140); the older identities came
  from an earlier scan at `e5b86a99`.
- One entry is the DS173237 error at the pre-fix `0b12cd86` timing test; PR
  #1920 replaced the 40-hex fixture and the current scan reports zero findings.
- All five live findings are verified false positives in CI-only tooling: the
  DS162092 tokens are members of a loopback-host exclusion set or a test
  fixture, and the DS176209 tokens are test inputs asserting placeholder
  rejection. No production path, attacker control, or security impact exists.
- No genuine or unresolved finding remains. No suppression, scanner, workflow,
  application, dependency, or deployment change was made.

## Limitations

- The five live false positives were removed from the report without an
  audited suppression, because suppression changes require owner approval.
  The next scheduled scan will append them again until a separate exact-span
  suppression is approved.

## Verification

See `specs/182-devskim-alert-report-review/evidence.md`.

---

# Active Context — Shared adaptive performance and rendering system

- **Updated:** 2026-11-17
- **Branch:** freebuff/1716deb7870376472b3b3bb7
- **Base:** main at ec4b5258
- **Spec Kit feature:** specs/180-adaptive-performance-rendering

## Current Task

Build a shared adaptive capability layer that evaluates network, device,
accessibility and memory conditions, governs ambient animation cadence and
speculative loading, reassesses on change and preserves the complete existing
experience for capable devices.

## Implemented State

- `app/lib/adaptive-performance.js` resolves one plan from measured downlink/RTT
  (labels are fallback only; no 5G inference), Save-Data, device memory/cores,
  reduced motion, visibility and optional `performance.memory` pressure.
- One shared subscription serves every consumer with a 120 ms debounce, an
  optional 20 s heap poll, connection/resize/visibility/motion/online listeners
  and complete teardown on the last unsubscribe.
- `createAdaptiveFrameLoop` keeps 60 fps on capable devices, 30 fps on
  constrained ones, pauses on hidden/reduced-motion and recovers on improvement;
  the homepage star canvas, Starfield, TwinklingStars, ShootingStars and Aurora
  all use it.
- `IntentPrefetchLink` requires a press/tap/focus instead of hover on a moderate
  connection and skips prefetch entirely on slow/Save-Data, recovering when the
  connection improves.
- Audio preloads defer under constraint while every playback path loads on
  demand; `releaseIdleAudio` unloads decoded sounds on memory pressure without
  interrupting playback.
- Image delivery stays on the approved native `srcset`/`sizes` ladders; the plan
  exposes `imageQuality` for future derivative selection rather than rewriting
  asserted markup.

## Verification

See `specs/180-adaptive-performance-rendering/evidence.md`.

---

# Active Context — Homepage mobile LCP delivery

- **Updated:** 2026-11-17
- **Branch:** freebuff/11aafabede64e67ce700edda
- **Base:** main at c9b346da (merged PR #1933)
- **Spec Kit feature:** specs/179-homepage-mobile-lcp-delivery

## Current Task

Improve the homepage's mobile first load on top of PR #1933 without touching the
Milky Way, any animation, homepage functionality or desktop performance.

## Implemented State

- PSI baselines on the live site: mobile 76 (LCP 4.1 s, TBT 350 ms), desktop 98;
  no CrUX field data for this origin. Local production baselines: mobile median
  68 (LCP 4.1 s), desktop 98.
- The mobile LCP is the hero AVIF and is byte-bound: 3.28 s of the 4.1 s LCP is
  the image's own transfer on a 1.6 Mbps pipe.
- Added 768 w AVIF/WebP derivatives of the existing painting and inserted them
  into the ascending candidate ladder (669/768/1024) used by both `<picture>`
  sources, the `<img>` fallback and the preload hint. No artwork, layer, colour,
  animation or layout changed; no device is served fewer device pixels than it
  requests.
- Measured: local PSI-profile mobile median 68 → 77, LCP 4.1 → 3.1 s, hero
  transfer 199 → 143 KiB; desktop unchanged at 98.
- Investigated and rejected with measurements: `Link` response-header preload
  (no LCP change), `experimental.cssChunking: 'strict'` (1.9 KiB), any night-sky
  renderer change (CPU profile: canvas < 0.3 % of samples), and any 669 w
  phone asset (1.7× DPR, a fidelity trade).

## Limitations

- PSI reports the deployed site; this branch cannot change that number until it
  is merged and deployed.
- Mobile 90+ was not reached and cannot be without a fidelity trade or feature
  removal: the LCP painting plus non-deferrable framework JS saturate the pipe.
- This workspace has no GPU, so local TBT is harsher than PSI's.
- One Vitest governance test and one docs-refresh test fail identically on
  pristine `main`; neither reads a file this change touches.

---

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

### Follow-up after merge — live-site verification

- The merged deployment was driven at 5/30/31/65/66/100 with the random source
  pinned: every tier, event, number set and dial angle matched, and saved-result
  normalization, the three-day guard and reduced motion held on production.
- The live stylesheet did not contain the `.resonance-dial*` rules, so the brass
  index was invisible on production. The arm and head now carry inline styles
  with test ids; the dead CSS was removed and the fixed production build was
  re-verified at 1440, 390 and 412 px.
