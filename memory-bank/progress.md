## 2026-11-26 — Playwright alignment and authorized QA skips (Spec 221)

- Made the installed lockfile the only Playwright version source: deleted the custom cache validator, replaced the conditional browser installs with one unconditional `pnpm exec playwright install --with-deps chromium`, and added lockfile-sync guards to the CLI wrapper and agent setup (the setup also rejects split installed versions of the three packages). No version or Chromium revision is hardcoded in operational files.
- Added the shared `qa_skip.py` contract: exact per-item label `SKIPPED — NOT APPLICABLE`, three trusted authorities, a required specific reason, and a narrow verified-Dependabot verifier. The audit, consolidated report and scope checker now label an authorized skip without turning it into a pass; the category and PR check stay green only when every other applicable requirement passes, an observed failure wins, and an unauthorized or unexplained skip fails.
- Split the scope checker's missing-declaration case from a malformed one, and passed pull request commit evidence to it and to the report with `--commits`.
- Verified the Python checker suites and the focused Vitest contracts; full results are in the PR handoff. No dependency version, protected file, scanner configuration, deployment or secret changed.

## 2026-11-26 — DevSkim backlog investigation and remediation (Spec 219)

- Established that the repository never held "about 100" open alerts: the consolidated report fetched one `per_page=100` page and never followed pagination, so any backlog of 100 or more rendered as exactly 100. The true count is **422**, all severity `note`: 421 DS162092 and 1 DS172411.
- Established the cause: all 422 alerts were created by the Spec 217 pull-request scan at `2026-11-24T23:48:05Z` from 13 newly added evidence JSON files (421 loopback findings) plus the meter readiness watchdog (1). The November 24 npm Dependabot updates touched no DevSkim file; the November 25 Actions update changed only the `upload-sarif` uploader pin. The DevSkim action has been pinned at v1.0.16 since 2026-10-24 and there is no scan-glob or DevSkim configuration to expand coverage.
- Remediated with the existing exact-span filter rather than a directory-wide exclusion: `specs/<NNN-feature>/evidence/**/*.json` is admitted for DS162092 only, and the meter watchdog is matched by its exact statement for DS172411 only. The report now paginates code-scanning alerts. No scanner rule, scan glob, trigger, dependency or application source changed.
- Verified against the real default-branch SARIF from `da8f104c`: 3,545 raw → 422 remaining before the change (exactly the live count), → **0 remaining** with matching source; replay gate exit 0; 115 suppression tests, 102 report contract tests and 14 workflow Vitest tests pass. The 422 alerts remain open until the next default-branch scan after merge.
- `main` advanced to `da8f104c` when the owner merged PR #2035 (Spec 218); the end-to-end count was re-run against that head's fresh SARIF (still 3,545 raw / 422 open, watchdog now line 1575, **0 remaining**). An accidental push then auto-merged the first submission (PR #2036); PR #2037 reverted it and merged as `0c9e1596`, restoring `main`'s tree byte-for-byte to `da8f104c`. The reviewed remediation is PR #2038, now based on `main` and left open for the owner; its fresh-eyes review simplified the shared local-origin path predicate and replaced the workflow test's hard-coded slice offsets with an anchored regex.

## 2026-11-25 — Spec 218 production Lucky Meter experience

- Implemented the complete visitor route: corrected message timing (starts at lock, removed before the celebration), physical medallion flip, crystal bowl, selected-chamber drain, in-chamber number, golden transfer to the separate **Your Lucky Number** panel, Spark/celebration sequence and corner countdown/Home/Share controls.
- Added the production responsive composition: phone stack 320–430 px, tablet portrait column, desktop Spark/instrument/results row and compact landscape row. Added a bottom safe area for the site compass and preserved the legal disclaimer. No new dependency; storage/palette/audio behavior unchanged.
- Verified full Vitest **1,268 / 1,268** across 113 files, `tsc --noEmit` exit 0, production responsive Playwright **8 / 8** plus finished-resume, READY/FINISHED captures at five viewports, and a clean production build of **423,959,610 bytes (404.32 MiB exact; 419.54 MiB by `du -sk`)**, below the 495 MiB cap.
- Submitted as PR [#2035](https://github.com/davidcollier77-code/Luckypickcanada/pull/2035) (regular, non-draft, open, unmerged). Outstanding: `pnpm lint` (no ESLint config), `./freebuff-verify.sh`, and physical-device/high-DPR/touch/cross-browser/hardware-GPU evidence.

## 2026-11-25 — Spec 218 post-submission review repair

- Repaired the Amazon Q finding in `tests/visual/lucky-meter-daily-resonance.spec.ts`: the reduced-motion case asserted the tier message was absent and then queried it; it now asserts `data-state="holding"`, matching `completeCalmly()` and the separate reduced-motion test.
- Found and repaired two further stale assertions: the celebration and resumed-cinematic cases still expected the temporary sentence during the celebration, while Spec 218 acceptance scenario 1 and the unit tests require it to unmount before the celebration's first frame. Both now assert absence.
- Confirmed the Playwright dependency needs no change: `1.65.1` is the current stable release and the locked version; `1.66` is alpha-only. The earlier failures were stale assertions and software-WebGL commit timing under concurrent workers, not a Playwright defect.
- Also repaired the percentage's first visible frame: the sampler could run before the generating stage committed, so the reading could appear part-way up its curve. Sampling now waits for that stage to paint.
- Verified after the repair: full Vitest **1,268 / 1,268**, `tsc --noEmit` exit 0, targeted Playwright **9 / 9**, full Lucky Meter spec **78 passed / 6 opt-in captures skipped / 0 failed** across desktop, mobile-390 and mobile-412 at two workers, and a clean build at **423,980,206 bytes (404.34 MiB)**, below the 495 MiB cap. The PR head and consolidated report were refreshed for the new commit.
- Follow-up on the first Visual QA run for the pushed head, which failed both shards: shard 1's failing seasonal-palette case was reproduced in CI mode. The hydration poll used Playwright's default 5 s while the stage still showed a single placeholder chamber; it now allows 25 s, matching the spec's other stored-state waits, and still requires twelve ids. The four palette cases pass and `tsc --noEmit` exits 0. Two shard 1 failures were recovered from the uploaded Playwright report artifact: the storyboard case required the short `landed` DOM commit (React can batch it with the pour under load), and the desktop finished case compared the results column with the stage's whole 3D canvas box (wider than the visible wheel, so a false overlap). The assertions now check the storyboard order and the instrument's central column, and pass 6/6 locally. Shard 2's failure was real and PR-caused: the Start emblem had been changed from `✨` to `✦`, breaking the sitewide gold-CTA contract in `sitewide-gold-cta.spec.ts`. The emblem is restored to `✨`, preserving the sitewide identity, and the case passes on all three projects. This VM has no emoji font, so the local evidence capture shows a placeholder box; CI installs Noto Color Emoji.

## 2026-11-25 (UTC) — Spec 218 responsive prototype gate

- Added the development-only `lucky-meter-instrument` Creative Workbench scene: gold 12-chamber wheel, upright percentage well, physical medallion flip, fixed 7:30 maple pointer/spout, faceted crystal bowl and seasonal fill. After owner review, refined the empty bowl to a clear Fresnel crystal shader with flat facet normals and white edge/rim highlights, replaced the pointer with a broad five-lobed veined maple blade outside the rim, and added a two-lobe specular/Fresnel sheen to the chamber enamel while preserving the palette.
- Made the prototype responsive without duplicating it: `WORKBENCH_STAGES` and `resolveWorkbenchStage()` expose mobile 390×844, tablet 820×1180 and desktop 1440×900; the workbench has a stage selector and `setStage()` capture API; pure `instrumentFraming()` keeps one perspective and changes only camera distance/look-at (phone 6.6, tablet portrait 4.5, desktop 4.2). The wheel stays circular and all result elements stay clear of stage edges.
- Captured READY and FINISHED at all three sizes (six exact-size images in `specs/218-lucky-meter-complete-experience/evidence/`). The first tablet capture exposed a bowl edge crop; the tablet extent was widened and the set recaptured. Responsive observations and limitations are in `research.md` §12; visual comparison is in §11.
- Verified: focused workbench 18/18; responsive framing 4/4; full Vitest 1,265/1,265 across 113 files; `tsc --noEmit` exit 0; clean production build 394,624 KB (385.38 MiB), below 495 MiB; all capture states `surface: ready`, `error: null`, `errors: []`; `git diff --check` clean. No visitor route, `meter-scene.js`, `storyboard.js` or `DailyResonance.tsx` change.
- Gate: awaiting owner comparison of the refined READY/FINISHED captures at all three sizes before Phase 3. Production responsive layout, physical-device/high-DPR/cross-browser verification and production implementation remain outstanding.

## 2026-11-25 (UTC) — Spec 217 merged after review repairs

- Repaired Pullfrog P2: a surface stopped by the no-frame watchdog is restarted when the WebGL context is restored, so the one-frame restore cannot announce ready behind a stopped animation loop. An explicit stop still prevents restart, and both paths have regression tests.
- Repaired Pullfrog P3: celebration-cue loading is idempotent across repeated activations on the shared Howl set and resets when the set is released; tests cover double activation and release-then-reactivate.
- Repaired Visual QA shard 1's hard timeout by giving the sequential 15 s + 20 s Start test its required budget with `test.slow()`; assertions are unchanged. The PR description now carries the exact protected-file authorization declaration for the owner-approved `app/globals.css` fade.
- Verified: 24 focused unit tests, full suite **1,259/1,259** across 112 files, **9/9** affected Playwright cases on desktop/mobile-390/mobile-412, `tsc --noEmit` exit 0, 490 Python and 51 docs tests, clean production build **437,895,168 bytes (417.61 MiB)**, and `SPEC_KIT_BASE_REF=a05be05540f794be1598fa66a96a37e1a5193ed8 ./freebuff-verify.sh` exit 0. PR #2033 merged into `main` at `2026-11-25T00:38:11Z` (2026-11-24 20:38:11 Atlantic), merge commit `ae844b4902a387cde508a4d1a312c9a535ad29ff`. The current `main` ref was verified at the same SHA. SC-006 physical-device GPU verification remains outstanding.

## 2026-11-24 — Lucky Meter reveal hand-off and mobile delivery (spec 217)

- Replaced the fixed 90 ms readiness timer with a produced-frame gate: the first `onFrame` is followed by two animation frames before `meter-ready`, and a 3,000 ms watchdog stops the surface and keeps the CSS fallback when no frame is produced. Context loss and disposal cancel the pending announcement.
- Adopted the measured 300 ms fade (4 → 2 median transition frames, 0 ms blocking) and retained the complete CSS fallback until the canvas host's computed opacity leaves 0 or `transitionend` fires; a 6 s guard stops polling but never removes it while the canvas is transparent. This removes the measured 1,976–2,304 ms empty stage without touching the scene.
- Kept celebration audio activation-gated: the four opening cues stay eager, the eight celebration cues use `preload: false`, and activation explicitly loads them through the same shared set (Howler queues an unloaded cue but does not fetch it on `play()`).
- Verified: 219 focused Vitest, full suite 1,255/1,255 across 112 files, `tsc --noEmit` exit 0, full Lucky Meter Playwright 54 passed / 6 opt-in captures skipped on desktop and both mobile projects, final transfer 1,473 KiB total / 590 KiB audio, final build 456,519,680 bytes (435.37 MiB), and `SPEC_KIT_BASE_REF=a05be05540f794be1598fa66a96a37e1a5193ed8 ./freebuff-verify.sh` exit 0 with 490 Python and 51 docs tests. SC-006 and physical-device smoothness remain outstanding.

## 2026-11-24 — ChatGPT browser-access priority (spec 216)

- Updated the ChatGPT-only browser rule to prioritize the Python Playwright setup configured through the ChatGPT Library startup script, using the existing async API and installed Chromium first; Browserless is the fallback, and Firecrawl is used only when Browserless is unavailable or not working. Retrieval is not described as interactive browser testing.
- Updated the governance regression assertions and active Spec Kit feature pointer. The separate shared requirement for automatic PR-checker Playwright workflows remains unchanged; no application code, browser workflow, dependencies, visuals or deployment settings changed.
- Local project verification was not run: the ChatGPT startup preflight reported Node.js 22.16.0 (the repository requires 26.x) and pnpm unavailable. ChatGPT-only repository rules prohibit running project tests or scripts in this environment; current-head GitHub checks remain pending.

## 2026-11-24 — Plan-aware monitoring and PR performance health (spec 215 follow-up)

- Corrected the observational monitor to scale its existing 60 fps policy to the active plan: a 30 fps plan is healthy at 25 fps or better and critical below 14 fps, with 56/140 ms p95 and 100 ms long-frame budgets. Added `paused` (hidden, reduced motion or a zero frame rate) and `idle` (a source stopped while frames are expected), plus `measured`/`insufficient`/`unavailable`/`paused`/`stale` evidence, so absent evidence is never reported as degradation.
- Kept one monitor and one sample window per existing source (`adaptive-frame-loop`, `cosmic-engine`); the aggregate reports the weakest measured source, so a fast renderer cannot mask a slow one. Preserved the 1.5 s window, 2 s warm-up, 250 ms evaluation, 1 s hysteresis, gap/hidden/target resets and the engine's local 42/18 fps step; no loop, timer or listener was added.
- Exposed `getPerformanceDiagnostics()` as `window.__creativeWorkbench.getState().diagnostics` (state version 2) and added a compact Performance health panel showing status, measured fps, plan target and tier, evidence, source and warnings.
- Added one informational performance-health block outside the seven PR checker categories. `GOOD` requires measured evidence and a healthy plan-aware classification; `strained` is `NEEDS ATTENTION` and `critical` is `BAD`; pauses, idle sources, insufficient/unavailable/inconsistent evidence and snapshots pinned to another commit are `NOT ENOUGH DATA`. It never changes category statuses or the overall PR status, and CI adds no measurement.
- Added an optional `--performance <json>` report input and documented that CI supplies no runtime sample, so the live block reports `NOT ENOUGH DATA`.
- Verified 37 Workbench/monitor tests, all 485 Python checker tests, `tsc --noEmit`, the production build at 500,695,040 bytes (477.50 MiB) and 51 docs tests. The full Vitest suite is 1,244/1,244: the pre-existing `lucky-meter-stage` failure on `main` at 28f74865 (jsdom 31.0.1 drops a default `from 0deg` from serialized gradients) was repaired on the owner's merge-readiness instruction by reading the gradient's start angle and treating a missing `from` as 0deg, which keeps the assertion's strength. The automated review's Workbench `performance` shadowing and report text-injection findings were corrected. Exact results are in `specs/215-device-capability-observability/tasks.md`.
- Applied the second-round reviewer repairs: `_finite_number` is now range-safe instead of raising on oversized ints, `warnings` is type-checked before slicing, the CLI boundary degrades a malformed snapshot instead of aborting the report, `_performance_not_enough` can no longer be turned into a measured outcome, and a strained/critical explanation names the p95 and long-frame limits unless the measured rate really is below the floor. Added a source guard that the Workbench diagnostics state never shadows the global frame clock.
- Applied the owner-directed merge-readiness repairs: the drain assertion reads the conic-gradient start angle so jsdom 31 dropping a default `from 0deg` no longer fails the suite; a paused plan's `targetFps: 0` renders as `0 fps` in the Workbench panel instead of `—`; and a warm-up source that already holds samples warns `insufficient-samples` rather than `no-samples`. The monitor suite is 23 tests and the full suite is 1,246.

## 2026-11-24 — Device capability and observational frame monitoring (spec 215)

- Kept the 3 MP backing-store gate and the coarse-pointer DPR-3 gate deferred and active. Recorded the exact matrix and the visual/GPU delta of removing only the surface gate (particle scale 0.85 → 1.2, spark budget 560 → 900, point budget 24,000 → 44,000, mesh 160 → 192, lights 2 → 4, plus a MacBook DPR cap 1.6 → 2 and +56.25% backing pixels) and of removing both gates (S23/iPhone DPR cap 1.6 → 2, meter dust 32 → 46, geometry +28.6%–71.4%).
- Centralized the hardware read in one cached `getDeviceAssessment()` used by the graphics profile, render quality, adaptive device state and capability report; missing hints report `balanced` with `confidence: none`, not weakness. `refreshDeviceAssessment()` runs only at the adaptive plan's existing reassessment boundary.
- Added live `getDisplayDemand()` and `describeRenderBudget()`, naming `surface`, `legacy-pointer-density`, `capability` or `policy` without changing any render profile. Added one lazy WebGL2-first feature report with scalar limits and context release.
- Added an observational frame monitor fed by the existing shared loop and cosmic frame function: 1.5 s window, 2 s warm-up, 250 ms evaluation, 1 s hysteresis, hidden/gap/target resets and same-frame dedupe. It adds no loop, timer or listener and never changes quality, cadence or the 12-second celebration.
- Verified the focused 88 graphics/adaptive/monitor tests, 45 resource-readiness tests, 111 files / 1,233 Vitest tests, `tsc --noEmit`, 471 Python checker tests, 51 docs tests and the production build at 434,126,848 bytes (414.02 MiB), below 495 MiB; `SPEC_KIT_BASE_REF=6afebdfa ./freebuff-verify.sh` exited 0.

## 2026-11-23 — Repository security audit and monitoring (spec 213)

- Audited the live GitHub Security tab: 11 open DevSkim code-scanning alerts, no open secret-scanning alerts and one open Dependabot advisory for `minimatch` 9.0.9.
- Added reviewed inline DS172411 suppressions for every callable timer, including the identifier-callback timers, removed synthetic 40-hex fixture tokens and literal placeholder markers from checker tests, and overrode `glob@10` to 14.0.4 so patched minimatch 11.0.5 resolves without breaking glob matching.
- Re-verified the review findings: forcing minimatch 11 into glob 10 returned an empty `globSync` result, and the cleared ledger would have re-appended the surviving timer findings. `@node-minify/core` now resolves glob 14.0.4 and matches real files.
- Verified Dependabot alerts are enabled, weekly Dependabot scheduling is unchanged, security and minor/patch updates are grouped per ecosystem, DevSkim runs on pull requests plus a weekly schedule, and CodeQL default setup remains configured.
- Cleared verified historical entries from `devskim-alerts.md` after dismissing every open code-scanning alert; the append workflow and marker remain.
- Final GitHub Security: 0 open code-scanning alerts, 0 open secret-scanning alerts and 1 Dependabot alert pending the corrected lockfile reaching `main`.
- The dependency-policy and focused checker suites pass; `SPEC_KIT_BASE_REF=4c6087cf ./freebuff-verify.sh` exits 0 with 471 Python tests, 110 Vitest files, 51 docs tests and the Next.js build below the 495 MiB cap.

## 2026-11-21 — Lucky Meter approved Build (spec 205)

- Implemented the approved presentation on `freebuff/lucky-meter-build`: the
  five-beat 0 → 100 → fall → rise → erratic → settle generation, the cylindrical
  vessel opening over 1.4 s, filling over 5 s, holding 0.7 s, draining over 4 s
  and highlighting empty for 1.6 s, the progressive top-down number reveal on the
  drain clock, a single 12,000 ms celebration for every tier, the 3.8–5.2 s Spark
  window and Home plus the countdown in the last row of the results panel.
- Made `storyboard.js` the single timing source, including the derived stage
  boundaries, the Spark character schedule and the emergent 54–57 s total.
- Implemented D12: a celebration restarted after a refresh runs the full
  12,000 ms from its beginning; a stored legacy duration is ignored and the saved
  reading is never rerolled.
- The CSS vessel remains the first paint and the functional fallback without
  WebGL and after context loss, with the same open, fill, drain and empty states.
- Verified: full Vitest suite 107 files / 1,142 tests passed; `tsc --noEmit`
  exit 0; Playwright `lucky-meter-daily-resonance` 16 passed per project on
  desktop, mobile-390 and mobile-412 (one opt-in evidence test skipped); clean
  production build 417,921,229 bytes (398.56 MiB), below 495 MiB;
  `SPEC_KIT_BASE_REF=8741c655 ./freebuff-verify.sh` exit 0.
- Captured arrival, fill, mid-drain and dock screenshots for desktop and
  mobile-390 under `artifacts/lucky-meter-approved-build-20261121/`.

## 2026-11-21 — Lucky Meter approved requirements and documentation reconciliation

- Recorded the owner-approved Living Requirements Outline and Approval Sheet:
  all OD-1–OD-13 resolved, the cylindrical vessel, functional CSS fallback,
  five-beat generation, progressive number reveal, equal 12,000 ms celebration,
  last-row Home/countdown, path-traced Spark, full-width Event strip and compact
  widget pair.
- Reconciled Specs 199 and 200 with the approved decisions. Spec 199 remains the
  historical twelve-stage implementation record and is marked partly superseded;
  Spec 200 remains the Three.js vessel implementation record with its current
  clauses amended.
- Recorded D12: every celebration runs for 12,000 ms, including a celebration
  restarted after a page refresh. The saved percentage, Lucky Number, colour and
  tier are unchanged.
- Preserved the historical Spec 199 verification record and the Spec 200
  T035–T037 pass records. T038–T041 and T052 remain unchecked and are not
  claimed as passed.
- Documentation only: no production code, tests, type check, build, browser run
  or deployment. Build remains unauthorised.

## 2026-11-20 — Lucky Meter three-dimensional vessel and pour (spec 200)

- Replaced the CSS colour card with a lathed Three.js glass tumbler on the shared
  creative surface, including the liquid surface, curved stream, leading
  droplet, splash ring, gold dust and context-loss fallback.
- Raised the medallion face by pulling the wheel band inward, then added the
  gold sky-writing treatment and the Home/countdown derivation.
- Recorded T035–T037 passing: `tsc --noEmit`, 23 focused tests and 105 files /
  1,133 Vitest tests. T038–T041 and T052 remain unchecked and are not claimed
  as passed.

## 2026-11-20 — Lucky Meter twelve-stage cinematic polish (spec 199)

- Reworked the Lucky Meter presentation into one continuous twelve-stage
  cinematic: a layered foreground leaf pile carried away by one gust, a
  plaque-free 5–100 percentage generation, a seasonal colour settle, a
  three-dimensional transparent vessel that opens before it is filled, a Lucky
  Number held until the drain completes and flashed twice, the existing tier
  celebrations at their full stored lengths, a maple-leaf Spark cursor, a real
  final hold and the paired Home/countdown dock.
- Retimed `app/lib/lucky-meter/storyboard.js` to roughly forty seconds without
  shortening any tier's celebration, and exposed the twelve ordered stages plus
  the new landing, number-flash and final-hold values.
- Changed generation sampling to the meter's real 5–100 scale, removed the
  continuous drifting-leaf ornament overlay from the route and replaced the
  flat colour card with a DOM + CSS 3D vessel, adding no renderer, dependency,
  preloader or WebGPU path.
- Timed the pour cue to the first drop and added a `number-reveal` cue on the
  existing recording; the deeper layered finale boom is unchanged.
- Verified the focused and full Vitest suites (1,133 tests), `tsc --noEmit`, the
  production build and a measured 416,229,183-byte (396.95 MiB) build under the
  495 MiB cap, and the Playwright `lucky-meter-daily-resonance` spec on desktop,
  mobile-390 and mobile-412 including reduced motion and the WebGL fallback.

## 2026-11-20 — PR #1983 review repairs and Dependency Health checker (spec 198)

- Added Dependency Health & Vulnerability Review as the seventh universal category, replacing the former top-level Dependabot row while keeping exactly seven categories and preserving governance. It checks changed manifests/lockfiles against open dependency advisories, never fails a PR for unchanged outdated dependencies, reports NOT RUN when the advisory source is unreadable, and does not require Dependabot to have run; `.github/dependabot.yml` is unchanged.
- Repaired the review findings: owner `/approve-` comments refresh the report from `github.event.issue.number`; empty or malformed verification audits fail closed and an audit for another head fails; check runs without `head_sha` are rejected; a render failure publishes a marker-first NOT RUN placeholder and the gate distinguishes exit 2 from a failed category; changed-code findings render `excerpt`/`recommendation`; bot-authored PRs report the human attestation as NOT RUN; check runs and dependency advisories are paginated; the final size fallback slices UTF-8 bytes.
- Updated `PR_SUBMISSION.md`, `.github/pull_request_template.md`, the Spec 198 spec/plan/tasks and the Memory Bank so all seven standards are consistent.
- Local checks: Python checker suites 116 tests, focused Vitest 16 tests; full-suite, type-check, build and size results are recorded in the PR body.

## 2026-11-20 — Seven-category PR verification report (spec 198)

- Added `.github/scripts/pr_verification_report.py` and `.github/workflows/pr-verification-report.yml`: one sticky report with exactly seven categories and the statuses `PASSED`, `FAILED`, `WARNING` and `NOT RUN`, always evaluated against the current head SHA.
- Folded the changed-code review, test-quality, performance, security-alert and Visual QA summary reporting into the owning categories and removed the duplicate standalone comment workflows. DevSkim scanning/suppression/SARIF/upload, the full unit suite, the TypeScript check, the OpenNext build and 495 MiB gate, both Playwright shards and all baselines remain intact; no `pull_request` code is checked out by the reporting workflow.
- Added the exact pre-submission code quality review and protected-file human authorization declarations, required the exact words `Scope changed` plus an explanation for expansions while retaining owner digest approvals, and removed the submitter browser-evidence requirement from the scope checker. `Dependabot` is reported `NOT RUN` with an explanation when no applicable update exists.
- Rewrote `PR_SUBMISSION.md` and `.github/pull_request_template.md` so both require the same declarations, QA scope fields, Spec Kit/library/Memory Bank reporting and handoff.
- Added `test_pr_verification_report.py`, updated the scope checker tests, rewrote the workflow-hygiene test and retargeted the sticky-comment test to the consolidated report.
- Verification is recorded in the PR body after the local checker, Vitest, type-check, build and build-size results are measured.

## 2026-11-20 — Shared Graphics Toolkit Guidance (spec 197)

- Added a permanent 🟢 shared `AGENTS.md` section for ChatGPT and Freebuff, routing visual creation and polishing to the existing graphics README, rendering architecture, `useCreativeExperience` integration hook, visual registry/runtime and centralized Resource-Readiness Hub.
- Named the existing development-only Creative Workbench and routed task-relevant references through `.docs/creation/`, `.docs/polishing/` and `.docs/manifest.json`; Three.js references apply only to Three.js work.
- Added a focused governance regression assertion. No production application code, artwork, animation, audio, layout, dependencies or deployment configuration changed.
- The startup preflight reports Node.js 22.16.0 (repository requires 26.x) and missing pnpm 10.30.3. ChatGPT did not run repository scripts, tests or builds; those results remain unverified and PR-triggered governance checks/owner approvals remain pending.

## 2026-11-19 — HTML5 audio reactivity and Gemini retirement QA (spec 195)

- Extended the existing sound-reactivity bridge so Howler `html5: true` cues feed the shared
  analyser through a `MediaElementAudioSourceNode` on Howler's existing context. The element keeps a
  unity path to the destination for unchanged playback; only the analysis edge is released. Unsupported
  capture, a non-running context, cross-origin media and already-owned elements fall back to neutral
  analysis without throwing.
- Added a development-only `playHtml5Cue` workbench hook and capture diagnostics for browser evidence.
- Corrected the retirement suites that still required an intentionally removed Gemini API snapshot and
  removed the two orphaned canonical snapshots. Both documents stay retired; no routing, reviewer
  wiring or Oracle integration changed.
- Verified 42 focused tests, refresh-docs 48/48, `tsc` exit 0, a Chromium HTML5-only envelope peak of
  0.065 (`html5Sources: 1`) and a media-capture-disabled fallback with playback intact and peak 0.
- Owner-directed review repairs on PR #1975: a failed analysis edge is retried instead of being
  recorded as analysed, Howler's automatic suspension is disabled once a cue is captured and a
  suspended context is resumed while a captured cue plays, the HTML5 capture registry resets between
  tests, and the retired Gemini mandate left `.freebuff/sentinel.md` while the retirement assertion
  now covers every `.freebuff/*.md` file. Focused suites then passed 44 tests.

## 2026-11-19 — PR #1972 review repairs

- Repaired the genuine findings from two review services: analyser attachment is re-armed instead of
  permanently locked out after its retry budget, a beat frame publishes its full transient, a dead
  audio context releases the shared tap and reconnects, the tap is reference-counted across
  consumers, capture pauses through the shared state path and clears stale data URLs, only a playing
  loop advances the scene clock, reduced motion never starts a loop, capture names validate their
  tier and cue names are restricted to the catalogue.
- Verified 29 focused tests, 105 files / 1,116 tests, `tsc` exit 0,
  `SPEC_KIT_BASE_REF=b92959fa ./freebuff-verify.sh` exit 0, a clean 416,323,017-byte build
  (397.04 MiB) and a Chromium re-run with a live envelope of 0.438 and a reduced-motion frame that
  reports no reactivity.

## 2026-11-19 — Creative Workbench and sound-reactive cinematics (spec 193 continuation)
- Added an opt-in sound-reactivity bridge on the existing audio system: one shared `AnalyserNode`
  taps Howler's Web Audio mix through a silent zero-gain branch, and a smoothed envelope (fast
  attack/slow release, transient detection) drives the existing light rig, particle field and any
  numeric property. No audio context, player or second audio system is created; `html5: true` cues
  are documented as bypassing Web Audio.
- Added a development-only Creative Workbench at `/workbench/creative`: a pure scene catalogue with
  forced tier/seed and a bounded clock, deterministic Three.js and Canvas 2D scenes built through
  the production runtime, PNG capture and `window.__creativeWorkbench` (`getState`, `setTime`,
  `playCue`, `capture`, …) so agents can inspect and photograph visuals before PR approval. The
  route 404s in production unless `CREATIVE_WORKBENCH=1`.
- Verified 26 focused tests, 62 existing graphics tests, 105 files / 1,113 unit tests, `tsc` exit 0,
  `./freebuff-verify.sh` exit 0, a clean 416,012,104-byte build (396.74 MiB), a real Chromium run
  that measured a live envelope (level 0.437) from an existing Lucky Meter cue and captured a Canvas
  2D PNG, and a production 404 for the sandbox route.

## 2026-11-19 — Three.js concise LLM documentation source
- Added `/websites/threejs_llms_txt` as a distinct URL source for `https://threejs.org/docs/llms.txt`, routed to Creation and Polishing with a canonical Creation snapshot and Polishing symlink.
- Preserved the existing `/websites/threejs` full-documentation source (`llms-full.txt`) unchanged. No application code, dependencies or updater workflow changed.
- Local updater/repository checks were not run in ChatGPT: Node.js 26 and pnpm 10.30.3 are unavailable in this environment. The owner explicitly authorized documenting this capability limitation; checks remain unverified.

## 2026-11-19 — PR #1966 round 2 review repairs
- Repaired the review findings that were genuine in the automatic creative layer: `CreativeSurface` now compares its `requirements` descriptor by value (an inline literal no longer rebuilds the surface and its WebGL context), an explicit `aria-hidden={false}` is honoured, `audio-sync.attach` forwards the position correctly to either a `createMotionTimeline` wrapper or a raw GSAP timeline, `disposeSceneResources` releases each shared geometry/material/texture once per teardown, and `loadGLTF` resolves `null` after a 30 s stall window instead of leaving the caller waiting.
- Verified 41 focused creative-layer tests, 103 files / 1087 unit tests, `tsc --noEmit`, `SPEC_KIT_BASE_REF=722e17b7 ./freebuff-verify.sh` exit 0, and a clean production build of 413,698,875 bytes (394.53 MiB by the repository's `du -sb .next public` gate) with no Three.js in initial page chunks. Context-restore and camera-aspect claims were re-checked against the code and are not defects.

## 2026-11-19 — Graphics and audio development layer completed (PR #1966)
- Turned the installed Three.js toolkit into an automatic creative layer: a deterministic technology
  selector (Three.js only for 3D/post-processing, Canvas 2D for 2D, existing WebGL engines preserved),
  a single visual registry that derives `module`/`texture`/`model`/`audio` resources and registers new
  experiences automatically, and `module`/`texture`/`model` adapters on the existing readiness hub.
- Added managed Canvas 2D, lazy GSAP timelines, PBR material presets, a tiered light rig with event
  pulses, bounded GPU particles, synchronised audio cues, a unified runtime, a reusable React surface
  and a runnable example. Integrated the Lucky Meter and Card Reveal through `useCreativeExperience`
  with no change to their artwork, timing, sound or fallbacks.
- Repaired the PR review findings (Clock reset, context-loss ordering, SMAA before `OutputPass`, bloom
  handle, guard assertion, README double render); the context-restore finding was verified as not a
  defect against Three.js source.
- Verified 103 files / 1083 tests, `tsc --noEmit`, `./freebuff-verify.sh` exit 0 and a 361.1 MiB build
  (376 MiB by `du -sm`) with no initial page JavaScript containing Three.js.

## 2026-11-19 — Graphics development toolkit (Three.js)
- Installed `three` 0.187.0 and `@types/three` 0.187.0 (MIT) and added an additive, unused-by-default
  toolkit under `app/lib/graphics/`: a lazy stage (dynamic `import('three')`, tiered renderer/scene/
  perspective camera, adaptive frame loop, reduced-motion static frame, context loss/restore,
  idempotent disposal), a tiered cinematic composer (bloom, ACES/sRGB output, SMAA from
  `three/addons`), lazy uncompressed glTF loading and best-effort resource disposal.
- Reused the existing capability layer, adaptive plan, context-loss watcher and resource-readiness
  rules; rejected PixiJS, `@react-three/fiber`, the `postprocessing` library, Babylon.js and Three's
  experimental WebGPU renderer with recorded reasons. WebGPU stays probe-only.
- Verified 16 focused toolkit tests plus the 10 dependency-policy tests, `tsc --noEmit`, and
  `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh` exit 0. Production build 370.55 MiB (386 MiB by
  `du -sm`) with zero Three.js chunks. A software-rendered harness (SwiftShader WebGL2) created a
  stage and bloom composer, rendered 34 frames, read back a lit frame and reported `glError 0`; the
  desktop and mobile homepage captures are unchanged.

## 2026-11-19 — Lucky Meter PR #1964 review repairs
- Fixed the confirmed review/Visual QA findings on the seasonal cinematic branch: the welcome pointer's
  gradient now lives in the always-mounted pointer SVG; the arrival fallback derives 3,750 ms from the
  storyboard; the duplicated wheel-angle helper and unused `handleReveal` dependency are gone; and the
  tier message has its own punctuation constant.
- Raised every Lucky Meter reading label and the homepage visits pill to the 12 px mobile floor, verified
  with the full 12-test mobile accessibility suite. The transient `landed` assertion now records phase
  transitions instead of polling a 450 ms state.
- Verified 101 files / 1,046 unit tests, type check, 13 Playwright passes on each of desktop, 390 and 412,
  two evidence captures, the Crystal Ball desktop control, both advisory checkers with no findings,
  `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh` exit 0, and a clean 334.28 MiB build (350 MiB by
  `du -sm`), below the 495 MiB cap.

## 2026-11-18 — Site-wide resource-readiness hub
- Added one preparation hub over the existing adaptive plan: experience registrations with version, routes,
  dependencies and ordered resources; image (load + decode), code (Next router prefetch) and audio (existing
  Howler/Web Audio prepare, never playback) adapters; and a registered adapter kind for future Canvas/WebGL/
  WebGPU resources. It adds no capability detector, subscription, frame governor or competing preloader.
- Preparation is deduplicated by kind + target + version, bounded to `min(plan.maxParallelRequests, 3)`,
  paused for background work during an active reveal/cinematic, a hidden page or Save-Data, and resumed through
  the existing shared plan subscription. Readiness reports fetched, initialized, ready, failed and skipped;
  failures retry once automatically and can be retried explicitly without repeating ready work.
- Registered all seven requested experiences: reveal (personal and gift share one registration), Lucky Meter,
  Lucky Number Generator, Crystal Ball, Lucky Map and Lucky Stories. The map sky and Crystal Ball audio are
  deferred to route/intent, and no API or data endpoint is prewarmed.
- Current-route and homepage preparation are gated by `whenPageSettled`: `load`, a 600 ms quiet window after
  the last LCP entry and completed resource, a 250 ms floor and a 20 s bound. Homepage order follows the
  manifest, capped at three on capable, two on moderate and one on constrained, with none on Save-Data/slow.
- Review hardening (Amazon Q / Pullfrog): deadline-driven retry wake-ups, re-evaluated policy skips,
  priority upgrade for an in-flight background run, a 5 s failure cooldown, a mount test suite, and
  manifest byte sizes asserted against the real files.
- Focused suites 41 tests across 3 files, full suite 95 files / 988 tests and `tsc --noEmit` pass. Fifteen
  paired production runs show median load 302 vs 302 ms and LCP 348 vs 340 ms; zero hub requests before
  load or LCP. Build 298.07 MiB.

## 2026-11-18 — Daily Resonance invariant audit and reveal-resume repair
- Treated the merged mission as a set of claims to falsify and mapped each one to a named test: percentage
  range/weighting and only-newest exclusion, uniform 1–50 number and 12-colour palette with older values
  eligible, unchanged thirty Sparks, start-together/staggered settles, Spark after the cinematic, countdown
  only after the writing, one-shot Lucky Number migration, reduced motion, WebGL fallback, and the untouched
  Milky Way, midnight, audio and sharing paths.
- Found one real violation: a refresh during the ~1.5 s reveal skipped the three motions and jumped to the
  cinematic, because the payload recorded no reveal stage. Added `revealCompleted` to the same version 1
  payload, inferred it for legacy payloads from the cinematic, and extracted `animateReveal` so Start and the
  load path share one motion runner that draws nothing.
- Strengthened the browser coverage with a `MutationObserver` reveal timeline (all three motions moving in the
  same window, strict settle order, total inside ~1.5 s, cinematic after the colour ring), a deterministic
  pointer/ring value check read modulo a whole turn, and a stored mid-reveal resume test that compares the
  stored result and history before and after.
- Final state: 90 vitest files / 935 tests, 69 Playwright passes across desktop plus 390/412 px, 345 MiB build,
  and `./freebuff-verify.sh` green.

## 2026-11-18 — Premium Daily Resonance: medallion, independent reveals, Spark finale
- Split the reading into four independent draws: percentage (range, weighting and tiers frozen), a uniform 1–50
  Lucky Number, a uniform colour from the twelve approved HEX values, and a Spark from the unchanged thirty.
  Each remembers exactly one previous value, so older choices return the next day and only the newest saved
  result is excluded. Number triplets and their tier coupling are gone, including from sharing.
- One requestAnimationFrame clock now runs all three spins from the same start and settles percentage at
  620 ms, number at 940 ms and colour at 1240 ms before the percentage-selected cinematic at 1540 ms. After
  the cinematic the Crystal Ball GoldenLeaf rises into a reserved panel above the medallion and types the Spark
  like a quill; the message stays visible and the Home countdown appears only once it finishes.
- Migration is one-shot and non-destructive: a stored result keeps its percentage, colour and Spark, gains a
  single persisted Lucky Number, and reloads unchanged. A completed cinematic never replays, and an interrupted
  Spark resumes its writing without it. `sparkCompleted` lives in the same version 1 localStorage payload.
- Rebuilt the responsive layout around the finale: Spark panel first, medallion below it, then three result
  cards, disclaimer and sharing, with the mobile view top-aligned so Home and its countdown never overlap.
- Deepened the medallion profile and lighting (17 rings, 0.26 z range, shadow groove, raised bezel, enamel dome,
  finer milling, raking key light, grounded contact shadow) and gave the number its own outer bezel dial and the
  colour a thin segmented ring. Both are display-only and never feed selection.

## 2026-11-17 — Exact-span DevSkim suppression for CI loopback tokens
- Added a DS162092-only suppression family for the changed-line reviewer and its test: a two-file allowlist,
  exact 16-space/8-space line patterns, the preceding `if host.casefold() not in {` requirement, and a
  verified justification that removes the results from the uploaded SARIF.
- Covered both reviewer exclusion-set tokens and the reviewer-test fixture with three positive tests, plus
  negative controls for a different set member, missing context, unreviewed path, external host and partial
  span. The focused suite passes 110 tests.
- Replayed the real scanner SARIF: 5 results, 3 suppressed, 3 removed, 2 DS176209 placeholder results
  remaining; the second pass found nothing left to suppress.
- Left the two DS176209 placeholder fixtures untouched by design; the owner narrowed the original five-finding
  proposal to DS162092 and these two files.

## 2026-11-17 — DevSkim alert report review and cleanup
- Audited all ten bullets in `devskim-alerts.md` (the request counted nine) against current source, the Git
  revision that produced each identity, and a DevSkim 1.0.103 scan of every affected file.
- Current scan: five live findings (two DS176209 `TODO` fixtures, three DS162092 loopback tokens), four stale
  positional duplicates from the pre-`bc6f2016` layout, and one remediated DS173237 error (40-hex fixture
  replaced in PR #1920; pre-fix scan reproduced the error, current scan reports zero).
- All five live findings are false positives in CI-only tooling: loopback-host exclusion-set members and
  placeholder-rejection test inputs, with no production path, attacker control, or security impact.
- Cleared the report to its header and append marker. No suppression, rule, workflow, scanner, application,
  dependency, or deployment change; durable suppression of the live false positives is left for owner approval.

## 2026-11-17 — Shared adaptive performance and rendering system
- Added one shared, dependency-free layer (`app/lib/adaptive-performance.js` plus a React binding) that
  resolves a single adaptation plan from measured network throughput/latency, Save-Data, device
  memory/cores, reduced motion, visibility and optional heap pressure. Network labels are fallback only and
  no label is read as 5G; missing hints always keep the full experience.
- One shared subscription (120 ms debounce, complete teardown) replaced per-consumer listeners, and a frame
  governor now drives the homepage star canvas, Starfield, TwinklingStars, ShootingStars and Aurora at
  60 fps on capable devices, 30 fps on constrained ones, and paused when hidden or reduced-motion is set.
- Intent prefetching waits for a press/tap/focus on a moderate connection and skips on slow/Save-Data;
  audio preloads defer under constraint while playback still loads on demand; idle decoded audio is
  released on memory pressure without interrupting a playing sound.
- Added profile, fallback, condition-change, cleanup, accessibility and preservation tests.

## 2026-11-17 — Homepage mobile LCP delivery after PR #1933
- Filled the hero artwork's candidate-ladder gap with 768 w AVIF/WebP derivatives, so Lighthouse's
  mobile profile (412 px at DPR 1.75 = 721 device pixels) no longer downloads the 1024 w file while
  high-density phones keep it unchanged.
- Local PSI-profile mobile: median 68 → 77, LCP 4.1 → 3.1 s, hero transfer 199 → 143 KiB; desktop
  unchanged at 98. PSI live baselines recorded first: mobile 76, desktop 98, no field data.
- Measured and rejected an early `Link` preload header and `experimental.cssChunking: 'strict'`, and
  kept the Milky Way and star canvas untouched after profiling showed the canvas is under 0.3 % of
  first-load script samples.
- PSI 90+ mobile is not reachable without a fidelity trade or feature removal; recorded in the
  feature evidence rather than pursued.

## 2026-11-16 — Independent checker suite (P1–P5)
- Split the checking system by responsibility in a new PR: test quality, performance
  (resource leaks), security alerts and a Visual QA summary each publish their own
  sticky comment, while the general defect reviewer stays in PR #1925.
- `checker_suite.py` holds four advisory modes with block-safe rendering and a
  suggested fix per finding; `upsert_pr_comment.sh` updates a comment in place and
  refuses an unmarked or over-60,000-byte body instead of truncating a fix.
- Visual QA keeps running PR code read-only; a `workflow_run` job publishes the
  result afterwards, and a skipped shard is labelled NOT RUN, never a pass.
- Security alerts reuse the existing DevSkim/CodeQL code scanning through the
  alerts API: no new scanner, dependency, service or paid reviewer.
- Verified: 28 controlled fixtures, workflow hygiene suite, full unit suite, type
  check, repository gate and build below the 495 MiB cap. A measured runtime
  performance budget is deliberately deferred (no browser baseline here).

## 2026-11-16 — QA checker effectiveness from the PR #1924 review cycle
- Responsibility separation recorded, not implemented: the general code-defect reviewer gained `assignment-in-condition` only, while the inventory, category ownership, gaps and the P0–P5 sequence for separate test-quality, security, performance and browser-reporting checkers are in `specs/171-qa-checker-effectiveness/plan.md`. No new workflow, dependency, paid service or external reviewer configuration.

- Verified after the rule: 183 QA infrastructure tests, 81 files / 801 Vitest tests, `tsc --noEmit` exit 0, `./freebuff-verify.sh` exit 0, production build below the 495 MiB cap.

- Evaluated the repository checkers against the Lucky Meter review cycle: 18 inline comments (Amazon Q, Pullfrog), Graphite skipped for PR size, Pullfrog failing twice on provider quota, Verification Integrity cancelled, PR Scope Verification failing for a missing scope declaration, and Visual QA shard 2 failing.
- Verified 18 findings against head `6eb2ae7e`: 1 confirmed defect (no WebGL context-restore path) fixed in PR #1924, 3 already fixed, 4 not defects, 12 byte-identical duplicates.
- Changed-code reviewer now records `confirmed`/`potential` classification, collapses duplicates by path and line with a count, and detects focused tests, `forEach(async ...)`, empty catch blocks and unused imports in fully added files.
- Visual QA validates the restored Chromium cache and installs a matching browser when the cache has no executable, instead of failing every test at launch on a corrupt archive.
- Classifier regression coverage extended to performance paths and ambiguous application code.


## 2026-11-15 — Visual QA install timing reporter corrections
- Fixed six confirmed defects in the PR #1917 reporter without reverting or re-implementing it: a
  Chromium hit now requires a successfully completed restore step; pagination no longer stops after
  a full page when `total_count` is missing or zero; corrupt zip logs raise a visible error while an
  unavailable log still degrades to `unknown`; the first recorded cache state is preserved;
  `api_json()` keeps the decoder message and position; and the hexadecimal `head_sha` fixture became
  a harmless dummy, clearing DevSkim DS173237.
- Extended the offline suite from 21 to 34 tests, including failed/cancelled/skipped/incomplete
  restore steps, the missing-miss-step log fallback, duplicate-hit protection, missing/zero/positive
  totals with multiple full pages, unavailable versus corrupt logs, and invalid JSON diagnostics.
- Verified: 34 focused tests, 142 QA infrastructure tests, the DevSkim suppression suite, a local
  DevSkim 1.0.103 scan (baseline 1 finding, corrected file 0), 80 files / 788 Vitest tests,
  `freebuff-verify.sh` exit 0 and a 304,970,368-byte (290.84 MiB) build below the 495 MiB cap.
  No workflow, cache key, install, Chromium-provisioning or classifier change.

## 2026-11-15 — Visual QA install timing report
- Added `.github/scripts/report_visual_qa_install_timings.py`, a read-only, dependency-free reporter that takes a Visual QA run ID and prints each job's `Install dependencies` duration beside the PR #1914 baseline (8 s verification, 7 s per shard), plus pnpm and Chromium cache states.
- Cache states come from `@actions/cache` log lines, with the Chromium cache-miss step conclusion as the offline fallback; missing logs degrade to `unknown`, and a cold pnpm store is called out as the only case where the skipped postinstall download mattered.
- Added 21 offline tests and wired them into the QA checker step; no install, cache, Playwright, classifier or baseline behaviour changed.
- Verified: 21 reporter tests, full suite 80 files / 788 tests, `tsc --noEmit`, `./freebuff-verify.sh` exit 0, workflow YAML/`bash -n` checks, existing classifier suite 30/30, and a 290.84 MiB build below the 495 MiB cap. GitHub Actions and the live authenticated report run remain pending the PR/owner token.

## 2026-11-15 — Visual QA classifier precision and QA Playwright initialization
- Extended the fail-closed visual change classifier with positively non-rendering classes that cannot affect production rendering: agent/Playwright skill documentation (`.agents/skills/*`) and standalone Playwright configurations (`playwright.*.config.ts`, `playwright-*.config.ts`). `playwright.config.ts`, app code, components, styles, images, fonts, rendering configuration, visual/e2e tests and unknown paths still require visual QA.
- Removed the blanket `package.json` trigger. A new fail-closed manifest comparator reports scripts-only only for changed test/tooling script names (`test`, `lint`, `format`, `typecheck`, `type-check`, `check`, `verify` and `:<name>` variants). Dependencies, engines, exports, package-manager/PNPM overrides, lifecycle scripts, unknown scripts and failed comparisons keep visual QA.
- The `changes` job compares base/head `package.json` through the read-only contents API and warns plus keeps visual QA on any failure. The always-on verification job, gated browser job, Playwright projects, shards, retries and committed baselines are unchanged.
- Removed Playwright's npm postinstall browser download from both QA dependency installs (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`). The visual job previously downloaded Chromium before restoring its version-keyed cache; the exit verification job never launched a browser at all. Explicit Chromium provisioning and system dependencies remain mandatory.
- Added executed regression coverage for every requested case, including the exact merged PR #1914 changed-file set. Focused suite 30/30; full suite, TypeScript, repository gate and build size recorded in `specs/166-visual-qa-classifier-precision/evidence.md`.
- GitHub Actions results remain pending PR submission.

## 2026-11-15 — Governance guard aligned with the revised AGENTS.md
- Retargeted `__tests__/agent-governance-single-source.test.js` to the current unified ChatGPT/Freebuff `AGENTS.md` without changing `AGENTS.md` or `PR_SUBMISSION.md`.
- Replaced stale entry-point, handoff, browser-fallback, Playwright-option and Spec Kit-count expectations with the equivalent current requirements; Playwright mode coverage now verifies the skill documents that `AGENTS.md` designates as authoritative.
- Verified the focused governance suite 10/10, full Vitest 80/80 files and 774/774 tests, `tsc --noEmit` exit 0, `./freebuff-verify.sh` exit 0, and a 387.04 MiB production build.

## 2026-11-15 — SwiftShader configuration verified and graphics architecture documented
- Measured the SwiftShader flag set instead of assuming it: WebGL 1/2, shader link and pixel readback pass under the committed three arguments; WebGPU reports `unavailable_software` and `navigator.gpu` stays undefined with every tested WebGPU/Vulkan flag, and `--enable-webgpu-developer-features` degrades compositing and WebGL without exposing WebGPU.
- Kept the three proven arguments, rejected the unsafe/experimental flags, exposed the documented `test:visual` and `test:visual:swiftshader` scripts, and extended the mode guard to pin the arguments and reject unjustified additions.
- Added `docs/graphics-rendering-architecture.md` covering CSS/Canvas 2D/WebGL/optional WebGPU layers, capability selection, renderer inventory, fallbacks, AVIF/WebP independence and future 3D requirements, without adding effects or production WebGPU.
- Corrected the 13-area Playwright skill guidance to the measured capability and compatibility results.
- Verified: both Playwright configurations pass, WebGL-disabled fallback renders and completes with zero console errors, `./freebuff-verify.sh` exit 0, build 370.26 MiB, full suite 773/774 with one pre-existing `AGENTS.md` heading/governance-guard failure from #1912.

## 2026-11-15 — Playwright visual QA classification correction
- Narrowed the visual-browser trigger so CI-only changes under `.github/` and Next.js API route handlers under `app/api/` and `pages/api/` do not require screenshot/browser inspection.
- Kept frontend routes/components, styles, visual assets, browser/e2e tests, visual tooling configuration and unknown paths on the Playwright-required path. Mixed changes still require browser coverage.
- Aligned the PR scope checker's browser-evidence classification with the same API/CI exclusions; explicit `visual_impact.required: true` still forces browser evidence.
- The always-on full unit suite, TypeScript, security, scope, build and other CI checks remain unchanged. Regression tests were added; execution was pending the updated PR workflow.

## 2026-11-15 — QA checker governance consolidation and owner-directed PR exception
- Consolidated the QA checker planning requirement into one dedicated AGENTS.md section and removed duplicated QA instructions and the generic summary section.
- Required an independent pre-submission review of the completed implementation and full diff against every applicable checker requirement; clarified that CI results do not replace this review.
- Added a narrowly scoped exception to PR_SUBMISSION.md: only a direct instruction from the repository owner permits specified work on an already-submitted PR. Open status, comments, CI results and review findings do not imply permission. All scope, approval and protected-file gates remain mandatory.
- Extended the existing governance regression test and updated Spec Kit requirements, plan, tasks, checklist and evidence.
- PR #1908 continuation was directly authorized by the repository owner. Focused test execution remains NOT RUN in this GitHub-only session; current-head owner governance approval and protected-file environment authorization remain pending.

## 2026-11-15 — Freebuff Playwright governance guidance
- Added a concise Freebuff-only AGENTS.md section documenting the interactive CLI launcher, standard Option A and SwiftShader Option B.
- Explicitly excluded ChatGPT from using, loading, modifying or maintaining the repository Playwright CLI and its setup scripts.
- Authorized Freebuff to verify and maintain relevant setup scripts when environment, dependency or browser-runtime changes affect them.
- Added a focused governance regression assertion. Local test execution was unavailable in the GitHub-only editing session; no test pass is claimed.

# Project Progress — Significant Milestones

## 2026-11-15 — Lucky Meter cinematic redesign
- Rebuilt the Lucky Meter presentation around a bottom-anchored, always-mounted
  circular meter with Home in the top-right corner, a persisted completion flag
  so Home only returns after the whole cinematic has finished (including refresh
  mid-event), and the existing Milky Way artwork left completely untouched.
- Extended the retained additive WebGL stage into far/near surfaces so meteors,
  lightning and the golden finale pass both behind and in front of the meter;
  added continuous plasma meteor trails, bounded branching lightning with real
  atmospheric illumination, distinct dense-red and fine-silver firework
  identities, and a golden chrysanthemum plus willow finale whose foreground
  sparks fall across the interface.
- Fixed inherited defects that starved the finale: silver crackle children could
  branch without end, and the point budget saturated before the finale was
  drawn. Particle sizes now scale with viewport area, budgets are bounded, and
  the governor steps quality down before dropping the near layer.
- Added two recorded cues (deep finale boom, subtle throttled thunder) with a
  committed source/licence record; the existing cues are unchanged and the audio
  files were verified against their original masters.
- Verified: 769 unit tests, `tsc --noEmit`, `./freebuff-verify.sh`, production
  build below the cap, and 27/27 Chromium checks across lifecycle, persistence,
  reduced motion, WebGL fallback and mobile.

## 2026-11-15 — QA checker hardening and inherited crash repair
- Fixed the unconditional `previous_filename` read that crashed the PR scope
  checker on every ordinary modified or added GitHub record, including the
  records in PR #1904; renames still contribute both paths and incomplete
  rename evidence fails closed.
- Added a dependency-free changed-line reviewer with high-confidence secret,
  provider-token and merge-marker hard findings, evidence-backed advisory
  quality warnings, redaction, placeholder suppression and deduplication.
- Added optional `visual_impact` declarations, a declared-impact override for
  the Visual QA classifier, and reviewer warnings when a non-visual declaration
  conflicts with path-based detection.
- Removed Visual QA's dependency on `freebuff-verify.sh` while retaining the
  full unit suite and a standalone TypeScript check; kept the script and its
  own test intact.
- Pinned the Daily Resonance test clock to its fixture date so a later real
  calendar day cannot produce a false persisted-result failure.
- Verified: 99 QA checker tests, 14 workflow guard tests, 77 files / 734 unit
  tests, 11 files / 146 Crystal Ball tests, `tsc --noEmit`, the full
  `./freebuff-verify.sh` gate (36/36 docs tests), and a 348 MiB build below the
  495 MiB cap. GitHub Actions results remain pending PR submission.

## 2026-11-15 — QA branch reconciled with the graphics foundation merge
- Reconciled the QA hardening branch with current `main`, retaining the
  adaptive graphics capability foundation merged in PR #1904.
- Kept `specs/163-qa-checker-hardening` as the active Spec Kit feature while
  preserving the graphics capability architecture in `techContext.md` and
  the graphics foundation milestone in this progress history.
- The four overlapping files were combined without dropping either task's
  documentation or changing the PR's declared 20-file scope.

# Project Progress — Significant Milestones

## 2026-11-14 — Adaptive graphics capability foundation
- Added one dependency-free capability layer for safe Canvas 2D/WebGL acquisition, lazy cached
  feature checks, a conservative device profile, pixel-ratio and particle-scale caps,
  reduced-motion/visibility lifecycle, and context-loss handling.
- Adopted it across the homepage stars, Aurora, Lucky Meter cinematic stage, Lucky Card reveal,
  share images, confetti and the retained legacy starfields while preserving every existing
  static fallback and the approved artwork, sounds and interactions.
- Removed the engine's forced high-performance power hint so Chrome, Edge, Firefox, Samsung
  Internet and Safari can each choose their available graphics path; no browser or SwiftShader
  path is forced.
- Verified: 14 focused graphics tests, 3 stage-fallback tests, 43 affected component tests,
  751/751 full tests, type check exit 0, repository gate exit 0, a clean 302,780,210-byte build
  (≈288.75 MiB), production-build Chromium checks for normal/reduced-motion/no-2D rendering, and
  the committed homepage visual baselines across desktop and both mobile projects. Firefox/WebKit
  and Samsung Internet remain untested because their native libraries or binaries are unavailable
  in this environment.

## 2026-11-14 — QA checker requirements moved into task planning
- Added a dedicated AGENTS.md planning-stage section requiring agents to inspect applicable QA checker definitions and understand their actual checks before drafting task specifications.
- Requires checker scope, triggers, inputs, evidence, thresholds, approvals and pass/fail behaviour to inform task scope, constraints, acceptance criteria and verification planning.
- Extended the governance regression test to guard the new requirement. Local execution remains unavailable in the connected GitHub-only workspace; no test pass is claimed.


## 2026-11-14 — QA infrastructure integrity

- Added a trusted, read-only PR scope workflow and exact file-path scope manifest with rename handling and repository-owner digest approvals tied to the current head and full declared scope for scope expansions, screenshot baseline changes and governance edits.
- Added distinct Playwright, Firecrawl and Browserless evidence labels without changing the existing automatic Playwright workflow.
- Added raw DevSkim SARIF preservation, a separate raw artifact, and a summary of remaining findings. Kept the existing suppression filter, SARIF replay, filtered artifact and append-only report logic.
- The scope checker also verifies GitHub's reported changed-file count against all paginated file records, rejects duplicate names, and binds owner approvals to the complete PR body plus current head SHA; PR prose edits invalidate earlier approval digests.
- DevSkim reporting now includes per-stage outcomes for scanner execution, SARIF-summary syntax/tests, suppression-script syntax/tests, real SARIF replay, suppression filter, and Security upload.
- Added focused Python checker tests, including incomplete changed-file inventory and approval invalidation cases, to the PR QA workflow while retaining the existing full unit suite, Crystal Ball checks, Playwright visual coverage, Agent MD/protected-file gates and verification-integrity checks.
- Reviewed Agent MD and left it unchanged: existing protected-file policy does not permit mixing an Agent MD change into this infrastructure PR, and current browser-tool instructions remain compatible with accurate evidence labels.
- Recorded that PR #1899's DevSkim scan passed with one unsuppressed ManualReview finding (DS172411 at `components/DailyResonance.tsx:386`); unrelated unit and Playwright failures were not modified.
- Local Python suites and repository verification have not yet been executed in this environment. Firecrawl's browser runtime lacked the Playwright module; no browser pass is claimed. GitHub Actions results remain pending PR submission.


This file is a concise record of meaningful completed work, not a chronological transcript of every PR, CI retry, review comment or implementation task. Current repository state belongs in activeContext.md; technical facts belong in techContext.md.

## 2026-11-14 — Selectable Playwright modes
- Kept the standard Playwright configuration and every QA checker unchanged for normal QA and CI.
- Added an opt-in SwiftShader configuration that explicitly requests ANGLE's software backend and
  enables the GPU process for graphics investigations; it uses one worker and no retries and
  inherits the standard projects and web server.
- Added distinct documented commands, project guidance and a source guard that prevents either
  mode from drifting into the other.
- Verified: 3/3 mode guards, standard and SwiftShader smoke runs 3/3 each, full suite 686/686,
  type check exit 0, repository gate exit 0, and a 438,155,074-byte build (≈417.9 MiB).

## 2026-11-14 — Lucky Meter daily experience
- Replaced the meter's ad-hoc lockout with one validated daily result (5–100%,
  tier, weighted event, colour and Little Spark), versioned Local Storage and
  local-midnight rollover through the shared countdown.
- Rebuilt the reveal as a 4.5-second hidden climb/drop/jump, landing flash and
  staged detail beats, then added additive WebGL meteor, lightning and fireworks
  events over the untouched Milky Way artwork.
- Added native-first sharing with cancellation safety, reduced-motion and WebGL
  fallbacks, and a 30-message editable Spark data file; no new dependencies or audio.
- Merged current `main` and renumbered the feature to 160 after main introduced
  features 158 and 159; resolved reviewer findings across the engine, selection,
  reveal and share paths and added focused coverage for the failure and light-colour
  cases.
- Verified: 51 focused tests, type check, `SPEC_KIT_BASE_REF=origin/main
  ./freebuff-verify.sh` exit 0, a 302,488,849-byte build (≈288.5 MiB), and six
  passing browser QA scenarios with zero console errors. Full-motion GPU visual
  review remains for the owner.

## 2026-11-14 — Security header hardening
- Tightened the response CSP: kept `script-src 'unsafe-inline'` for Next.js, added
  `script-src-attr 'none'`, and removed the unused Google Fonts and Pexels origins while preserving
  Turnstile, Google Analytics, Cloudflare Web Analytics and the Stripe form destination.
- Switched `Referrer-Policy` to `strict-origin-when-cross-origin` and removed obsolete
  `X-XSS-Protection`; HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` and
  `Cross-Origin-Opener-Policy` are unchanged.
- Verified: 679 unit tests, type check, `./freebuff-verify.sh` exit 0, a 358,302,351-byte build
  (≈341.7 MiB), 3/3 Playwright header checks on both production and dev servers, eight public
  routes with zero CSP violations, and successful Turnstile plus Google Analytics script loads.
- Recorded that the Cloudflare edge replaces origin HSTS with a one-year includeSubDomains value;
  the owner must align the edge HSTS setting if the repository's two-year preload intent is wanted.

## 2026-11-13 — Crystal Ball token budgets and fallback resilience
- Split the Groq completion budget into 900 tokens for daily fortunes and 700 for follow-ups,
  keeping `openai/gpt-oss-20b`, low reasoning effort and every other request setting unchanged.
- Tagged all 197 daily fallback fortunes with stable IDs, excluded only yesterday's fallback from the
  next local day's selection, and kept seasonal/occasion weighting intact. Browser storage holds
  only the last fallback ID and date.
- Removed the 14 follow-up fallback answers. A follow-up provider failure now returns the exact
  supplied outage notice with no substitute fortune, and only the daily used flag is persisted — no
  question, answer or Q&A history.
- Verified: 78 focused tests, 69 files / 649 unit tests, `tsc --noEmit`, `./freebuff-verify.sh` exit
  0, a 306,445,265-byte build, and six desktop Playwright Crystal Ball checks including the new
  outage flow.

## 2026-11-13 — Homepage search listing
- Replaced the homepage search/share image with a 1200 × 630 progressive JPEG (160 KB) cropped from a live Playwright
  capture of the deployed homepage, preserving the Milky Way backdrop, maple-leaf emblem, tagline and headline.
- Published the owner-approved community description verbatim across the standard, Open Graph, Twitter and WebSite
  JSON-LD metadata through one shared constant; feature routes and their shared artwork are unchanged.
- Verified: 10 focused guards, 67 files / 635 tests, `tsc --noEmit`, `./freebuff-verify.sh` exit 0, a 309 MB build,
  built-head metadata on all four surfaces, and local image delivery as `200 image/jpeg` with no `X-Robots-Tag`.
- Live re-verification of the production head and new image URL requires the owner's deployment.

## 2026-11-12 — Chromium environment emitter hardening
- Closed a code-injection sink in `scripts/setup-chromium-libs.sh --env`: `HOME`, `CHROMIUM_LIBS_PREFIX`,
  `PLAYWRIGHT_BROWSERS_PATH` and `CHROMIUM_BROWSER_DIRS` were interpolated into shell text that the wrapper and the
  startup command `eval` and that `--persist` writes into `~/.profile`. Command substitution in any of them ran
  (reproduced with `$(touch …)` and backticks, and through the wrapper itself); every emitted value is now a
  single-quoted POSIX word, so spaces, apostrophes and glob characters round-trip unchanged and nothing executes.
  `--persist` quotes its profile source line for the same reason.
- Added `__tests__/setup-chromium-env-shell-safety.test.js` (22 tests): four hostile payloads across all four inputs,
  spaces, an apostrophe, `sh`/`bash` parsing, idempotency, literal glob matching and both `--persist` paths, with a
  canary file as the oracle.
- Verified: `bash -n` on every script, `sh -n` on generated and persisted output, 38 focused tests, 633 unit tests in
  67 files, Spec Kit gate + governance tests, `tsc --noEmit`, docs tests, `./freebuff-verify.sh` steps, and a
  291.91 MiB production build.

## 2026-11-12 — Playwright workspace hardening
- Closed the three failure points found while verifying that browser work survives a reopened workspace: the wrapper
  now resolves the pinned pnpm even when dependencies are already installed and `$HOME/.local/bin` is missing from
  `PATH` (previously `exec: pnpm: not found`, exit 127), and it decides whether to download Chromium through
  `setup-chromium-libs.sh --browser-root` instead of a `chromium-*` glob that matched any revision.
- `playwright.config.ts` now trusts an inherited `FONTCONFIG_FILE`/`FONTCONFIG_PATH` only when the path exists, so a
  workspace shell carrying another chat's stale font path no longer drops the provisioned fonts from test runs.
- Verified: scrubbed-`PATH` wrapper exit 0, foreign-revision cache repaired (191 MiB download, launch 11 s), warm launch
  4 s with no download, 9 focused tests, 66 unit-test files, `./freebuff-verify.sh` exit 0, production build 291.90 MiB,
  and a live 1280 × 9366 full-page capture. Evidence is in `artifacts/playwright-verification/`.

## 2026-11-12 — Reliable Playwright browser work in a cold Cloud workspace
- Found `scripts/setup-chromium-libs.sh` did not parse at HEAD (a mangled `printf` in the reuse branch), so no
  provisioning, check, export or persist path could ever run; repaired the line and added a `bash -n` guard test over
  every script so that class of corruption cannot ship again.
- Added `scripts/playwright-cli.sh`: one command that installs missing dependencies, provisions the libraries, installs
  the pinned browser when absent, applies the runtime environment and selects the Chromium channel, so browser work no
  longer depends on the platform startup command (which did not run for this chat) or on remembered manual steps.
- Verified cold self-heal (prefix removed, 6.3 s to load the live site), a launch with `LD_LIBRARY_PATH` unset, desktop
  and mobile screenshots, 5 focused tests, and `./freebuff-verify.sh` exit 0 with a 324.33 MiB build.

## 2026-11-12 — Playwright Chromium runtime environment
- Diagnosed why Playwright still failed on `libnspr4.so` with the libraries installed: the startup command's
  `eval "$(… --env)"` died with that process, and Freebuff tool shells are `bash -c` with no profile.
- Made the existing provisioning script check both Playwright Chromium binaries, reuse a complete prefix, and persist
  its environment into `~/.local/chromium-libs/env.sh` plus one idempotent block in `~/.profile`/`~/.bashrc`;
  `setup-playwright-agent.sh` now applies that environment itself and `playwright.config.ts` injects it for tests.
- Verified a real launch with no library environment, `gold-cta` 4/4 in a bare shell, live `playwright cli`
  interaction, cold provisioning, and the documented startup command twice.

## 2026-11-12 — Development-only Crystal Ball date preview
- Added a separate `/crystal-ball/preview` route that is 404 in production and lets a reviewer pick
  any local date/time, with occasion presets for every Canada Day, Christmas, New Year, Remembrance
  and other seasonal window.
- Preview readings stay in page state, so reviewing a date never consumes the visitor's daily
  fortune or follow-up; `/crystal-ball` itself is unchanged.
- Verified 591 unit/component tests, the repository gate with the `main` base, a 433.08 MiB build,
  and production/dev route status over HTTP; repaired the retarget conflict after #1842 was
  squash-merged.

## 2026-11-12 — Crystal Ball personality, local time and Canadian seasons
- Added one shared browser-local time system, a Canadian calendar/occasion model with escalating
  Canada Day, Christmas and New Year windows, and large curated general/seasonal/occasion fallback
  pools while preserving the existing artwork, CSS, animations and fortune/follow-up flow.
- Solemn days (Remembrance Day, National Day for Truth and Reconciliation) use quiet greetings and
  remove every humour instruction from both fortune and follow-up prompts and fallbacks.
- Verified 103 focused tests, the full 577-test suite, type check, `./freebuff-verify.sh` exit 0,
  and a live production-build flow including a real afternoon-to-evening greeting change.

## 2026-11-11 — Six Cloudflare issues: scan evidence and Oracle fix
- Verified the five vulnerability-scan issues against all retained Cloudflare occurrences (every response 404, no outbound fetch) and against 22 live production probes.
- Fixed the genuine Oracle empty-content error by moving gpt-oss-20b to `max_completion_tokens: 1024` with low reasoning effort and a structured missing-content diagnostic; the safe fallback was preserved.
- Added the visitor's local time and the missing Labour Day and National Day for Truth and Reconciliation to the Crystal Ball calendar facts.
- Evidence: `specs/141-cloudflare-issue-remediation/evidence.md`; 38 targeted tests, the Playwright Crystal Ball flow, `./freebuff-verify.sh` exit 0 and a 355.73 MiB build.

## 2026-11-11 — PR checker reliability, performance and AGENTS.md protection
- Repaired the governance suite's parse error and stale AGENTS.md assertions that made every
  recent Visual QA run fail in about a minute, then verified all 503 unit tests and the full
  `./freebuff-verify.sh` gate.
- Added a path-based AGENTS.md classifier: a dedicated governance PR may change AGENTS.md with
  its protection code, tests and task records; an AGENTS.md edit in an unrelated PR is refused;
  the base-branch AGENTS.md is the approved baseline; titles and descriptions cannot bypass it.
- Removed duplicated Visual QA steps, sharded Playwright into two required jobs, made the
  integrity audit aggregate shards, and added pnpm caching, timeouts and superseded-run
  cancellation to the build validators. Production build measured 386.72 MiB.

## 2026-11-11 — Cloudflare Issues → GitHub automatic forwarding
- Verified the live automation was an occurrence-threshold trigger that runs once per issue; the five active security
  issues pre-dated it, so only manual runs ever forwarded them. A new log issue fired automatically and created #1810.
- Added a recurrence-after-inactivity automation (3600 s, same service and policy) and left the original automation,
  webhook, policy and every credential unchanged.
- Repaired the setup script's idempotent identity checks for webhooks, policies and automations and normalized 14
  doubled continuation lines that made its `jq` payloads fail at runtime.
- Verified live deliveries (#1821, #1822), the recorded automatic run (#1810), the 401 rejection contract,
  `./freebuff-verify.sh` and a 320.38 MiB build. Evidence is in `specs/139-cloudflare-issues-auto-forwarding/`.

## 2026-11-11 — Node.js 26 migration
- Moved the declared local/CI runtime from Node.js 22 to 26 across `package.json`, `.nvmrc`, six GitHub Actions workflows,
  the Playwright agent setup guard, and the updater-scheduler package and README.
- Updated the Visual QA workflow assertion and Memory Bank technical context; left historical Spec Kit and artifact records intact.
- Verified on Node.js 26.13.0: 497 unit tests, type check, `./freebuff-verify.sh`, production build, Cloudflare/OpenNext build,
  and a Wrangler dry-run. Production measured 358.16 MiB after the Next build and OpenNext 97.57 MiB, both below the 495 MiB cap.
- No dependency, lockfile, application, visual, integration, secret, binding, or deployment-trigger change. Evidence is in
  `specs/135-nodejs-26-migration/` and `artifacts/node26-migration/verification.md`.

## 2026-11-10 — Crystal Ball experience and loading performance
- Added a fourth greeting and a dedicated daily greeting selector that keeps the day stable and never repeats the previous
  day's greeting, typed above the title with the existing golden maple-leaf cursor.
- Replaced the always-visible follow-up form with a designed gold/glass panel opened from a button after the reveal; the
  answer types with the same leaf treatment and the fortune, question and answer stay visible together.
- Confirmed the Crystal Ball shows no separate Canadian quote and left the Lucky Generator quote collections and daily
  behaviour untouched.
- Compressed the three Crystal Ball WAVs to MP3 (923,210 → 169,610 bytes) with WAV fallback, deferred audio until
  interaction intent, added immutable audio caching and high artwork fetch priority, and memoized reading words.
- Measured `/crystal-ball` on a production build: desktop transfer 2,012,776 → 852,723 bytes and load 8,732 → 4,698 ms;
  mobile 995,069 → 758,301 bytes and load 4,554 → 4,008 ms; artwork sources and dimensions unchanged.
- Evidence is recorded in `specs/134-crystal-ball-experience-improvements/`.

## 2026-11-10 — Security alert ledger remediated
- Verified all 29 `devskim-alerts.md` entries and every open code-scanning and Dependabot alert against current source.
- Extended the audited DevSkim SARIF filter for five reviewed false-positive families, with positive/negative regression tests and replay coverage; emptied the ledger only after each family was covered.
- Fixed the genuine CodeQL workflow-permission finding and pinned the vulnerable transitive `minimatch` range to its patched release.
- Evidence is recorded in `specs/133-security-alert-remediation/evidence.md`.

## 2026-11-10 — Cloudflare scan alerts triaged and resolved
- Verified all five open Cloudflare Workers Issues (#1789–#1793) against their retained occurrences and live production
  responses: every request was a 404 to a path the site does not serve, with no outbound fetch.
- Classified the wordpress, secret-files, source-control, debug-endpoints and known-scanner-path alerts as inbound scan
  noise, resolved the five issues with evidence, and made no application or deployment change.
- Evidence is recorded in `specs/132-cloudflare-scan-issue-triage/evidence.md`.

## 2026-11-10 — Freebuff startup command and context availability
- Corrected the startup command order so the context check reports before the pnpm bootstrap, frozen install and
  Playwright CLI check, and restored `CI=true` on the install.
- Documented the exact command as the Freebuff project-settings value and extended the guard test to execute the
  documented command, including ordering, the frozen install and the Playwright CLI invocation.
- Recorded that Freebuff injects only `AGENTS.md`, so the four Memory Bank files are checked by the startup script
  but not preloaded; `AGENTS.md` §1 step 4 remains the supported loading path. Added a 64 KiB `AGENTS.md` budget
  guard to the startup verifier.

## 2026-11-09 — Specialist skill routing and agent governance
- Added concise routing guidance for 14 specialist skills to the existing authoritative AGENTS.md, including instruction precedence, conflict investigation and tool-availability safeguards.
- Preserved the existing Spec Kit sequence, Playwright/Browserless boundaries, Cloudflare and Neon rules, PR gatekeepers and updater requirements.
- PR #1795 is merged to main. Follow-up Visual QA and governance-test corrections were included before merge.

## 2026-11-09 — Daily Crystal Ball fortune experience
- Replaced the question-first Crystal Ball flow with a daily fortune, approved greetings, one optional follow-up and a local-calendar-day allowance.
- Added shared local-midnight countdown behavior across Crystal Ball, Daily Card Reveal and Lucky Meter.
- Preserved validation, rate limiting, sanitization, injection protections and existing visitor-facing visual direction.
- PR #1785 is merged.

## 2026-11-09 — Lucky Stories and community map improvements
- Improved the province-based story feed, per-province activity limits, map loading and browser coverage.
- Consolidated duplicate map URLs onto the canonical /map route and retained the existing story count/data boundaries.
- PR #1783 is merged. Production data corrections should be treated as owner-reported unless independently queried.

## 2026-11-09 — Playwright CLI agent tooling and QA guidance
- Added the vendored Microsoft Playwright CLI skill and project guidance for eight capability areas, reusing the existing Playwright packages.
- Clarified direct-agent Playwright use, Browserless fallback, and separation from Playwright Test and CI visual baselines.
- PRs #1786 and #1788 are merged. Browserbase is not a connected browser integration.

## 2026-11-08 — Homepage responsive QA and presentation
- Refreshed approved homepage viewport baselines and added responsive geometry coverage from 320 px through 1440 px.
- Verified desktop, mobile-390 and mobile-412 Playwright projects on the recorded successful run.
- Preserved the approved hero composition and existing visual identity; no redesign was implied by stale screenshot comparisons.
- PR #1783's responsive QA follow-up is merged.

## 2026-11-07 — Documentation updater reliability
- Added stronger downloaded-document integrity checks, preservation of good snapshots on rejected content, manifest-driven cleanup, link repair and a refresh report.
- Added isolated end-to-end updater coverage. The recorded updater test suite reached 36/36 passing after follow-up repairs.
- Scheduled times, retry windows, Atlantic timezone and Cloudflare Worker slots were preserved.

## 2026-11-07 — Verification integrity and PR review tooling
- Improved current-HEAD verification evidence handling so skipped or unrun checks are not represented as passes.
- Improved PR review checker efficiency and reliability, with findings tied to changed diff hunks and structured output.
- Kept external reviewer feedback distinct from authoritative CI/test results.

## 2026-11-06 — Reveal experience and image delivery
- Enhanced the Lucky Card reveal presentation with tier-aware cinematic effects while preserving card content and interaction.
- Completed responsive AVIF-first/WebP fallback image delivery for selected feature artwork and added a correctly sized social-sharing image.
- Recorded production builds remained below the 495 MiB hard cap at the time of those changes.

## 2026-11-06 — Agent reference library and security reporting
- Expanded the .docs/manifest.json reference inventory and routed sources to existing task groups; the scheduled updater materializes snapshots.
- Improved DevSkim alert handling and documented verified findings without treating suppressed false positives as zero alerts.

## 2026-11-05 — Lucky Card and reveal roadmap
- Completed tier presentation and reveal-flow polish, restored the intended reveal paywalls and retained the established CAD pricing and digital-gift behavior.
- No lottery-ticket sales or real-money wagering were introduced.

## 2026-10-31 — Freebuff governance and reviewer reliability
- Consolidated agent governance into the repository's authoritative AGENTS.md and migrated operating references to Freebuff.
- Improved the Gemini-based PR reviewer workflow, selected-finding handling and CI reliability. Reviewer output remains advisory; required checks remain authoritative.

## 2026-10-25 to 2026-10-29 — Security scanning and mobile performance
- Improved DevSkim source-span accuracy, SARIF handling, false-positive filtering and regression coverage.
- Recorded homepage mobile performance work and dependency/security remediation. Historical numeric scores are intentionally omitted because they are not a current baseline.

## 2026-10-19 to 2026-10-23 — Shared visual systems and automation
- Restored shared night-sky backgrounds and repaired related CI coverage.
- Implemented the GitHub updater scheduler with safe dispatch, retry and invalid-time safeguards. Deployment and schedule changes remain governed by AGENTS.md.

## 2026-10-15 to 2026-10-18 — Crystal Ball / Oracle foundation
- Built and repaired the Crystal Ball fortune experience, including its route, reveal presentation, audio and daily question/usage foundations.
- Kept Cloudflare build compatibility and existing visual assets in scope for those feature tasks.

## Historical record policy
- Detailed PR-by-PR logs, old task checklists, reviewer debates and transient CI failures were removed from this working summary. The authoritative evidence remains in GitHub commits, pull requests, workflow runs and the relevant Spec Kit feature directories.
- Do not restore routine PR transcripts here. Add a new entry only for a durable project milestone or decision that materially helps future work.

- 2026-11-15 follow-up: fixed protected-files workflow parsing by switching the GitHub changed-file stream to NUL-delimited fields, preserving empty previous filenames and preventing status values from being misread as paths. Added parser/workflow regression coverage and moved the Spec Kit evidence record under the classifier's existing allowed `evidence/` directory. The first CI run's changed-code review passed with zero findings; the protected-file check failed before this correction and must be rerun on the new head.
- 2026-11-16 milestone: the changed-code reviewer now publishes one sticky pull request comment whose findings each carry a concrete suggested fix, and it suggests Playwright visual or performance work only for rendering or performance-sensitive paths. The advisory classifier mirrors `classify-visual-changes.sh` under a twelve-case parity test, so browser verification is never proposed as a blanket requirement.
- 2026-11-16 proof pass: the publish step was executed against a stub `gh`, which caught a mangled POST URL that would have blocked the first comment; the URL is fixed and the whole chain (fixture diff → renderer → step shell) is now a test. Comment truncation moved into the renderer and cuts only between findings, so a suggested fix is never split.
- 2026-11-16 correction from AI review: deduplicating by location and rule hid the second unused binding on one import line, so the key now includes the finding detail, and every import statement is excluded from the unused-reference search. The reviewer workflow runs under `pull_request_target` with a base-branch checkout, so the comment step takes effect only once these changes reach `main`.
- 2026-11-16 milestone: the Lucky Meter's dial percentage now owns the reveal — inclusive tiers 5–30 / 31–65 / 66–100, tier-derived events and numbers, a dial that lands exactly on the displayed value, and saved readings normalized from their percentage. Leaves became thin, curled and wind-driven, the meter gained a brass index, and the golden fireworks finale was made the dominant moment without changing the red/silver opening or any audio asset.

## 2026-11-19 — Lucky Meter seasonal cinematic
- Rebuilt the Lucky Meter as a nine-stage experience: resting gold maple-leaf pointer, breeze-cleared
  arrival, 0% anticipation, one wheel/percentage clock, opening segment and colour pour, progressive Lucky
  Number, written tier message, tier celebration, maple-leaf-written Spark, and Home + countdown docked
  together only after the writing.
- Added the single `sparks-and-seasonal-colours.js` config: 30 Sparks, four 12-colour Canadian palettes with
  exact HEX values and painted finishes, inclusive local date ranges (Winter wraps the year and owns Feb 29)
  and pure helpers. The wheel, pour and result share the stored reading's palette; legacy colours keep their
  stored ids and HEX values.
- Added `storyboard.js` as the one source of stage timing and moved persistence to additive
  `revealCompleted`/`messageCompleted`/`eventCompleted`/`sparkCompleted` resume points. The existing Resource
  Readiness Hub prepares the new audio resource; the existing recordings supply every new cue.
- Preserved the approved Milky Way artwork, distributions, history, daily limit, local-midnight reset,
  sharing, reduced motion, static WebGL fallback and compact mode. Build remains below the 495 MiB limit.

## 2026-11-22 — PR verification streamlining (Spec 211)

- Added a fail-closed build applicability classifier and gated the protected OpenNext validation on it; merge groups and manual dispatches always build.
- Verification Integrity and the consolidated report now recompute build/visual applicability from the trusted base. A required-but-skipped check blocks; a proven-inapplicable check is `NOT RUN — not applicable` with its reason, never a pass.
- Renamed the always-required job to Application Verification. Added Playwright per-spec timing capture, whole-file duration-weighted shard planning seeded from Visual QA run 45076917637, exact-coverage guards, anchored file filters to prevent sibling-spec matches, shadow-mode affected-spec reporting, and flake/imbalance warnings.
- `./freebuff-verify.sh` now runs every Python checker suite, the full Vitest suite, the type check, the Next.js build and a 495 MiB size check.
- Preserved all 16 Playwright specs, three projects, the configuration and every committed baseline, plus Crystal Ball/Oracle, adaptive-performance, resource-readiness, DevSkim, CodeQL, Dependabot and the performance checker. Dead checker modes and obsolete root scripts remain pending separate owner approval.


## 2026-11-23 — Lucky Meter dimensional redesign (Spec 212)

- Replaced the Lucky Meter's SVG wheel, 6 o'clock pointer, separate vessel surface and medallion engine with one Three.js scene on the shared creative surface: struck medallion, twelve seasonal chambers, central decorative leaf, fixed 7:30 golden maple-leaf pointer with curved arm and spout, receiving vessel, pour and golden transfer beam.
- Corrected the reveal authority: wheel 4,400 ms with five turns stopping at 6,300 ms; independent percentage 9,400 ms from 1,900 ms reaching the stored result only at 11,300 ms; pour 2,000 ms; number pause 1,500 ms; beam transfer 1,500 ms; reveal complete at 16,300 ms. Preserved the five percentage beats, 800 ms message lead-in, 3,000 ms hold, 900 ms event delay, 12,000 ms celebration, 1,300 ms Spark delay, 3,800–5,200 ms Spark writing, 2,800 ms hold and 3,600 ms dock.
- Replaced the message fade with an 800 ms visible settle and kept the exact tier sentence visible through the celebration and FINISHED. Only the selected chamber drains; the other eleven stay full and the receiving vessel remains full after the pour.
- Added the complete no-SVG CSS meter as first paint and context-loss fallback; retired `lucky-meter-vessel`; updated the storyboard, reveal, layout, lifecycle, stage, experience, graphics, deploy-CSS and Playwright suites; updated Spec 212 artifacts, `.specify/feature.json`, this Memory Bank and the graphics documentation.
- Repaired four rendering defects found by visual QA: the maple-leaf index was uploaded as a raw typed array instead of a BufferAttribute, chamber drain used a custom shader that collided with Three's transmission uniforms (replaced by a centred fill-mesh scale), the glass transmission pass was removed for transparent clear-coated glass, and the stage accepted `leafExit` instead of the scene's `leaf` state. Also fixed the colour-caption/stage aspect-ratio overflow, circular-well label clipping, the transfer beam endpoint (now the centre readout) and the misleading 30 ms landed label (now a visible 450 ms beat while the pour starts on time).
- Verification: `tsc --noEmit` exit 0; 110 files / 1,204 Vitest tests pass; 16 desktop and 32 mobile Playwright meter tests pass plus four evidence captures; clean build 417,476,761 bytes (398.14 MiB) and the verify gate 431.15 MiB, both below 495 MiB; `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh` exit 0. Local WebGL used SwiftShader; no hardware-GPU device was available.
- Visual QA caught the idle readout labels shrinking to 10px at phone widths. The stage label is now a fixed 12px with balanced wrapping, so `Daily Resonance` and `Awaiting the reading` remain at the accessibility floor; the mobile-accessibility audit passes at 390 and 412px.
