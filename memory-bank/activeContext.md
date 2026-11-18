# Active Context — Site-Wide Resource-Readiness Hub

- **Updated:** 2026-11-18
- **Branch:** freebuff/df6965c97260bd2bd71121ef
- **Base:** main at fad3adff
- **Spec Kit feature:** specs/186-resource-readiness-hub

## Current Task

Extend Feature 180 with one lightweight, site-wide resource-readiness hub for intelligent preloading, cache
reuse and active-experience protection, compatible with current and future optional renderers.

## Implemented State

- `app/lib/resource-readiness.js` owns the registration contract (`id`, `version`, routes, dependencies,
  ordered resources), idempotent registration with version invalidation, image/code/audio adapters, a future
  adapter kind registry, plan-bounded scheduling, deduplication, truthful readiness, retry, release and
  server-safe guards. It adds no capability probe or subscription of its own.
- `app/lib/resource-readiness-manifest.js` registers Lucky Card Reveal (shared by personal and gift routes),
  Lucky Meter/Daily Resonance, Lucky Number Generator, Crystal Ball, Lucky Map and Lucky Stories. The map sky
  and Crystal Ball audio are deferred to route/intent; no API is ever warmed.
- `components/ResourceReadiness.jsx` is mounted once in `app/layout.js`, renders nothing, supplies the Next
  router prefetcher, prepares the current route in an idle period, and schedules the homepage's plan-bounded
  likely-next order. Both paths wait for `whenPageSettled`: `load`, a 600 ms quiet window after the last LCP
  entry and completed resource, and a 250 ms floor, bounded at 20 s. One delegated hover/focus/press listener
  set replaces per-link subscriptions.
- `components/DailyResonance.tsx` and `app/lucky-card-reveal.js` hold the hub's active-experience marker
  while their animations run, so queued background work pauses and resumes without touching timing or sound.
- Review hardening: retry wake-ups are deadline-driven so staggered failures cannot be stranded; policy
  skips (`current-route`, `speculative-audio-deferred`) are re-evaluated instead of cached forever; a
  higher-priority caller upgrades an in-flight background run; failed resources back off for 5 s; and the
  reveal backdrop's declared byte size now matches the 47,665-byte file.
- Focused suites: `__tests__/resource-readiness.test.js` (27 tests),
  `__tests__/resource-readiness-manifest.test.js` (9 tests) and
  `__tests__/resource-readiness-mount.test.jsx` (5 tests) pass, 41 focused tests total; `tsc --noEmit` exits 0.

## Verification

- Focused suites 41 tests across 3 files, full Vitest 95 files / 988 tests, `tsc --noEmit` exit 0 and
  `SPEC_KIT_BASE_REF=fad3adfff0bfa115c99eb19120973591ab30036d ./freebuff-verify.sh` exit 0.
- Production build: 312,552,759 bytes = 298.07 MiB, below 495 MiB.
- Homepage: 15 paired production-server runs; `loadEventEnd` median 302 ms base and 302 ms branch, LCP 348 ms
  base and 340 ms branch. Bootstrap 95% CI of the median load difference is −43…+28 ms, so no regression beyond
  variance. All 15 branch runs started hub requests at 1.22–1.35 s with zero before load or LCP.
- Capable mobile (390×844, 2× CPU): LCP 416 ms, hub first request 1.38 s, every registered image once. Save-Data
  profile: 26 requests, no hub work, no console errors, no overflow. `/reveal`: one card back, one backdrop, same
  15 audio cue files as base. Details and limitations are in `specs/186-resource-readiness-hub/evidence.md`.

## Limitations

- The owner brief named $1.99/$2.99 paid reveals; the repository prices are CAD $1.00 and CAD $1.99 and were
  preserved unchanged.
- The browser may evict cached bytes; the hub never promises permanent retention and adds no service worker or
  storage layer.
- This workspace has no hardware GPU, so any browser capture is software-rendered.

---

# Active Context — Lucky Meter Cinematic Flow

- **Updated:** 2026-11-18
- **Branch:** freebuff/48421c42b397224a7be733cc
- **Base:** main at affe7857
- **Spec Kit feature:** specs/185-lucky-meter-cinematic-flow

## Current Task

Refine the Lucky Meter into one cinematic flow: a brief arrival of realistic
resting leaves, a 500 ms anticipation followed by a coordinated 7.4 s reveal, an
audibly synchronized buildup and a Spark written in the sky by a tiny golden
point of light. Selection, tiers, storage and the Milky Way stay frozen.

## Implemented State

- `app/lib/lucky-meter/arrival-leaves.js` owns five edge-bound leaves, phone
  bands below the headline, a 1,000 ms rest, a staggered lift on the shared wind
  field, a 2,350 ms crossing and a fade to zero. `getArrivalDurationMs` bounds
  the whole introduction.
- `components/LuckyMeterArrivalLeaves.jsx` is one DPR-capped Canvas 2D layer
  with a procedural maple path, pigment gradient, veins, stem and grounded
  shadow. It pauses on a hidden tab, resumes from the same moment, removes
  itself when done and draws once without animation under reduced motion.
- `REVEAL_TIMING` now holds for 500 ms and settles at 3,200 / 5,400 / 7,400 ms;
  `EVENT_START_MS` includes the anticipation and is 8,320 ms. `DailyResonance`
  shows a gathering point during the hold and shares `animateReveal` with the
  refresh path.
- The buildup starts with the held breath, is skipped if it loads after the
  dial's window, fades at the percentage settle and never plays under reduced
  motion. The event cue map is unchanged.
- `components/LuckyMeterSkyWriting.tsx` replaces the panel and GoldenLeaf with
  glowing sky text and a tiny golden cursor; it owns the character clock so the
  page does not re-render per character. `handleStageComplete` holds for 1,000 ms
  before writing. Reduced motion shows the complete message at once.

## Verification

- `pnpm exec vitest run`: 92 files / 947 tests passed.
- `pnpm exec tsc --noEmit`: exit 0.
- Playwright full Daily Resonance spec on desktop: 25 passed, 1 skipped.
- Focused arrival, Spark and reduced-motion checks on mobile-390 and mobile-412:
  12 passed; the reveal trace also passed on mobile-390.
- Production build: 470,665,215 bytes (448.86 MiB), below 495 MiB; production
  build, `./freebuff-verify.sh` and the docs suite passed.
- Evidence and before/after captures:
  `artifacts/lucky-meter-cinematic-flow-20261118/` and
  `specs/185-lucky-meter-cinematic-flow/evidence.md`.

## Post-Submission Automation Review

- Four automation commits landed after the PR opened. Two carried a CI-skip
  directive, so DevSkim, OpenNext artifact validation and Visual QA never ran on
  the head, and Verification Integrity reported them as NOT RUN.
- The reduced-motion arrival change was a regression: it removed the canvas after
  1,500 ms, contradicting spec scenario 4 ("drawn once at rest and never animate
  or remove themselves"), and the passing browser assertion was rewritten to
  expect the removal. Both were reverted.
- A follow-up automation commit then added a DevSkim suppression for that timer
  inside `.github/scripts`, with a replay-gate entry and regression tests. The
  timer no longer exists, and CI security tooling is a protected area outside
  this task, so those script changes were removed and the PR diff no longer
  touches them.
- Speculative sky-writing timing edits and no-op churn were reverted. The accurate
  `reveal.js` timing comment and the missing `persistLifecycle` dependency stayed.
- Re-verified after the correction: 47 focused tests passed and `tsc --noEmit`
  exited 0. The corrective commit carries no CI-skip directive, so every required
  workflow runs on the new head.
- Visual QA shard 2 exposed a timing-only flake in the PR's own resume test:
  the upper bound included document load and hydration, so a throttled
  `mobile-412` shard reached the cinematic at 12.5-13.0 s against a 12 s cap.
  The cap is now 16 s; a replayed 8.32 s reveal would still land near 21 s, and
  the 6.8 s lower bound is unchanged.
- Two review items were then resolved in code: the DevSkim DS172411 alert was
  removed at its source by passing a named callback to the lift timer (no
  suppression and no CI tooling change), and stale "quill" wording left by the
  removed component was updated in files this PR already touches.

## Limitations

- Audio was not listened to; the cue map is unchanged and the audio suites pass.
- This workspace has no hardware GPU, so browser captures and frame behaviour
  are software-rendered.
- The full mobile spec file was not run end-to-end; focused mobile suites cover
  the changed flow.

---

# Active Context — Premium Daily Resonance

- **Updated:** 2026-11-18
- **Branch:** freebuff/ec0b9abbbe0e2dabc982edca
- **Base:** main
- **Spec Kit feature:** specs/184-daily-resonance-premium

## Current Task

Make Daily Resonance a premium daily experience: a realistic 3D medallion, an
independent Lucky Number and Lucky Colour reveal, and a Little Spark finale
written by the Crystal Ball GoldenLeaf after the cinematic. The percentage
system is frozen; the layout is owned by this task.

## Implemented State

- `app/lib/lucky-meter/config.js` keeps the 5–100 range, the 5–30 / 31–65 /
  66–100 tiers and their events, drops the number triplets, and adds
  `LUCKY_NUMBER_MIN/MAX`, singular labels and `HISTORY_LIMITS` of one previous
  value per choice.
- `selection.js` draws four independent values — percentage, uniform 1–50
  number, uniform colour over the twelve approved HEX values, Spark from the
  unchanged thirty — each excluding only the newest saved value.
  `validateDailyResult` migrates a missing number exactly once.
- `storage.js` normalises per choice, appends to four single-value lists, owns
  the `sparkCompleted` lifecycle and writes a migrated number back immediately.
- `reveal.js` runs percentage at 620 ms, number at 940 ms and colour at 1240 ms
  from one start time, then `EVENT_START_MS = 1540`; its samplers return the
  exact final value at landing.
- `components/DailyResonance.tsx` drives the three spins from one
  requestAnimationFrame clock, plays the percentage-selected cinematic, then
  moves GoldenLeaf into a reserved panel above the medallion and types the
  Spark at 24 ms/character. The countdown dock appears only after that. A
  completed cinematic never replays; an interrupted Spark resumes without it.
- A third persisted stage, `revealCompleted`, was added in the follow-up audit:
  a refresh during the three motions resumes them (`animateReveal` is shared by
  Start and the load path) instead of jumping to the cinematic. Legacy payloads
  infer the flag from the cinematic.
- `components/LuckyMeterRing.jsx` keeps the inline percentage pointer and adds
  an outer number bezel band (50 ticks, pointer, upright numeral badge), a thin
  segmented colour ring at r 38.7 with a fixed marker, and a DOM contact shadow.
- `app/lib/gpu-geometry.js` and `components/lucky-meter-medallion-engine.js`
  deepen the profile (17 rings, 0.26 z, shadow groove, raised bezel, enamel
  dome, finer milling) and retune key light, exposure and tilt.
- Layout: Spark panel near the top, medallion, three result cards, disclaimer,
  share. Mobile is top-aligned with reserved dock space so Home and its
  countdown never overlap the ritual counter.

## Verification

- `pnpm exec vitest run`: 90 files / 935 tests passed.
- `pnpm exec tsc --noEmit`: exit 0.
- Playwright `tests/visual/lucky-meter-daily-resonance.spec.ts` on desktop,
  mobile-390 and mobile-412: 69 passed, 3 skipped (opt-in capture block);
  `crystal-ball-daily-limit.spec.ts`: 4 passed.
- Delivered-invariant audit: every mission invariant is mapped to a named
  passing test in `specs/184-daily-resonance-premium/evidence.md`, including a
  measured `MutationObserver` reveal timeline and a mid-reveal resume test.
- Production build: `.next` 311 MiB + `public` 34 MiB = 345 MiB, below 495 MiB.
- Captures: `artifacts/lucky-meter-premium-resonance-20261118/after/`.

## Limitations

- Audio cues were not listened to; their scheduling is unchanged and the audio
  suites pass.
- The dev server's Tailwind bundle can go stale in `.next`; new utility classes
  only appeared after removing `.next` and restarting. Clear `.next` before
  judging a visual change in dev.
- `page.addInitScript` re-runs on reload, so a migration test must write the
  legacy payload directly instead of re-seeding on every navigation.

## Follow-up

- Confirm the medallion reads as intended on a physical GPU; the captures come
  from Chromium's renderer in this workspace.
- The first reveal frame absorbs roughly 250–400 ms of medallion first paint in
  this workspace, so the browser timeline bounds the stagger and the ≤ ~1.5 s
  total rather than the nominal 620/940/1240 ms schedule, which the fake-timer
  DOM suite proves exactly.

---

## 2026-11-17 — Exact-span DevSkim suppression for CI loopback tokens

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
