# Active Context — Spec 224 undici major-scoped security fix (2026-11-26)

## Current Task — Remove the vulnerable global Undici pin

- **Branch:** `freebuff/b7618803c1c98fa008653cb9-undici`, originally based on `main` at `8a18c44583192e2f32e801c81c44c6f1311e71d7` and merged forward to `71b9e1a1a59a32708ca3c5f6a373a9cf015ce8cb` after PR #2047 merged the OpenNext 1.20.19 update.
- **Scope:** `specs/224-undici-major-scoped-security-fix/`; 12 exact paths covering `package.json`, `pnpm-lock.yaml`, two dependency guards, four Spec 224 artifacts, `.specify/feature.json` and three Memory Bank files.
- **Change:** replaced `undici: 8.12.2` with `undici@6: 6.29.1`, `undici@7: 7.30.2` and `undici@8: 8.13.1`.
- **Resolved graph:** `@dotenvx/dotenvx` 6.29.1; Wrangler, Miniflare and `@cloudflare/workers-utils` 7.30.2; jsdom 8.13.1. No 8.12.2 remains.
- **Verification:** focused guards 50/50 before the merge and 51/51 after it; full `./freebuff-verify.sh` passed with 520 Python tests, 113 Vitest files / 1,270 tests, TypeScript and the Next.js build; production build 485,572,608 bytes (463.08 MiB), below 495 MiB; OpenNext build passed on `@opennextjs/cloudflare` 1.20.18 before the merge and on 1.20.19 after it; Wrangler 4.166.0 build and updater-scheduler dry-run passed; updater Node tests 17/17.
- **OpenNext boundary:** PR #2047 merged into `main` as `71b9e1a1`, so this branch now carries `@opennextjs/cloudflare` 1.20.19 and `@opennextjs/aws` 4.2.1 on a `glob 14.0.6` edge. The merged graph was re-verified with `pnpm install --frozen-lockfile`, `pnpm why undici` (6.29.1 / 7.30.2 / 8.13.1 only) and a passing OpenNext build that produced `.open-next/worker.js`.
- **Delivery:** [PR #2048](https://github.com/davidcollier77-code/Luckypickcanada/pull/2048) is regular, non-draft, open and unmerged against `main`; no merge or deployment. An owner-directed post-submission repair addressed the Graphite and Pullfrog findings across the review rounds in `__tests__/undici-security-override.test.js` and `memory-bank/techContext.md`: the direct regression guard now rejects every `8.12.x` (not only `8.12.0`–`8.12.3`), `uniqueSorted` uses the existing `compareVersions` instead of a lexicographic sort, the exact lockfile equality is retained with its intent documented, and a `parseVersion` guard rejects non-numeric version segments. Focused guards pass `3 files / 51 tests` on the merged graph; the manifest, lockfile and all 12 declared paths are unchanged, and the consolidated report must refresh for each new head.

---

# Previous Active Context — Spec 223 documentation reconciliation closeout (2026-11-26)

## Current Repository State — Runtime documentation correction merged

- **Spec 223:** The 16-path runtime/script-permission documentation reconciliation is merged through [PR #2043](https://github.com/davidcollier77-code/Luckypickcanada/pull/2043), merge commit `17135708adc7b3e96e71e2bab7397723553a5852`. The current `AGENTS.md` §6 boundary is reflected in the Memory Bank and affected Spec Kit records.
- **PR #2044:** Closed unmerged; its proposed correction overlaps the merged work and adds a competing Spec 223 directory/feature pointer. It is not needed and should remain closed.
- **Final PR report:** The last published seven-category report for #2043 matched PR head `7ce7c3678d157dabce99bfe5cec609474787e22e`. Six categories passed; Governance and Workflow Verification failed because the PR body did not use all required exact declaration labels. The failure and its cause are recorded in Spec 223; the PR was merged before a corrected report could be published.
- **Runtime boundary:** Compatible repository scripts remain permitted under their own prerequisites and safety conditions. Node-26-dependent project operations and the repository Playwright CLI/setup retain the limits in current `AGENTS.md` §6.
- **Next separately authorized work:** Spec 220's Wrangler/OpenNext dependency implementation remains authorized but unstarted. Its implementation and verification tasks remain unchecked pending a compliant Node.js 26.x / pnpm 10.30.3 environment. No dependency or production change was part of Spec 223.

---

# Previous Active Context — ChatGPT runtime governance clarification (Spec 222, 2026-11-26)

- **Scope:** Clarify only ChatGPT Operating Instructions §6 in `AGENTS.md`; preserve the ChatGPT Library startup procedure and all shared governance.
- **Mandatory runtime distinction:** `AGENTS.md` §6 separates script exclusions from the Node.js runtime boundary: do not run Freebuff's startup script/sequence or the repository Playwright CLI/setup scripts. Node.js 26.x-dependent project operations are separately unavailable in this ChatGPT environment. All other relevant repository scripts—including Freebuff QA and PR-support utilities—remain permitted when their own runtime, prerequisites, permissions, side effects, network access and costs are acceptable.
- **Playwright boundary:** the repository Playwright CLI and its setup/installation are unavailable to ChatGPT. The ChatGPT Python Playwright setup remains the documented browser path.
- **Script permission:** `AGENTS.md` §6 separates script exclusions from the Node.js runtime boundary: do not run Freebuff's startup script/sequence or the repository Playwright CLI/setup scripts. Node.js 26.x-dependent project operations are separately unavailable in this ChatGPT environment. All other relevant repository scripts—including Freebuff QA and PR-support utilities—remain permitted when their own runtime, prerequisites, permissions, side effects, network access and costs are acceptable. Use only the ChatGPT Library startup script for ChatGPT startup.
- **Status:** Section 6 wording and its governance regression test are updated. No application code, dependency, deployment configuration, Cloudflare setting or production resource is changed.

---

# Active Context — Playwright alignment and authorized QA skips (Spec 221, 2026-11-26)

## Current Task — One installed Playwright, and honest inapplicable skips

- **Scope:** `specs/221-playwright-skip-alignment/`. Remove the custom Playwright cache validator and conditional browser installs so the lockfile is the only version source; add one shared authorized-skip contract so a proven-inapplicable item is labelled `SKIPPED — NOT APPLICABLE` while its category and the PR check stay green when every other applicable requirement passes.
- **Playwright:** `scripts/playwright-cli.sh` reinstalls when `node_modules/.pnpm/lock.yaml` is missing or differs from `pnpm-lock.yaml`; `scripts/setup-playwright-agent.sh` fails closed on the same mismatch and on split installed versions of `playwright`, `@playwright/test` and `playwright-chromium`. Visual QA runs one unconditional `pnpm exec playwright install --with-deps chromium` under the installed-version cache key; `.github/scripts/verify-playwright-cache.sh` is deleted. No version or Chromium revision is hardcoded in operational files.
- **Skip contract:** `.github/scripts/qa_skip.py` defines the exact label, the three authorities (`trusted-applicability-classifier`, `actor-inapplicable`, `verified-dependabot-maintenance`), a required specific reason and the Dependabot verifier. The audit, report and scope checker consume it. A failed run outranks a skip; an unauthorized or unexplained skip fails; an unknown conditional non-run warns.
- **Dependabot:** the exemption covers only the QA scope declaration, Spec Kit/Library/Memory Bank reporting and the submitter protected-file declaration. It requires the bot author, every commit authored by Dependabot and committed by `noreply@github.com`, and a path allowlist. The environment-protected human authorization gate is never skipped.
- **Status:** implementation is on `freebuff/d0375600d411086135405b5e`; local verification is recorded in the tasks and PR handoff. No protected file, dependency version, deployment or secret changed.

# Active Context — Cloudflare toolchain maintenance implemented (Spec 220, 2026-11-26)

## Current State — OpenNext 1.20.19, Wrangler 4.166.0 retained

- **Independent re-audit:** the earlier planning conclusion (bump both OpenNext and Wrangler) was re-derived from live registry manifests, release pages and advisories. The only justified change is `@opennextjs/cloudflare` **1.20.19**; `wrangler` **4.166.0** is retained because 4.167.0/4.168.0 contain no applicable security or compatibility fix for this deployment.
- **Why the adapter moved:** 1.20.18 declares `glob ^13` → `minimatch ^10`, affected by GHSA-g3hv-75wg-m249 with no patched 10.x; the repository avoided it only through the cross-major `minimatch@10 → 11.0.1` override. 1.20.19 moves to `glob ^14.0.6` (glob 14.0.6 was already installed) and `@opennextjs/aws 4.2.1`, and fixes the cookie/middleware 500 regression introduced in 1.20.18.
- **Why Wrangler stayed:** 4.167.0's fixes are first-deploy-only; 4.168.0 adds `images.url_transformations` (unconfigured), OAuth billing scopes (CI uses API tokens), a `WRANGLER_LOG_PATH` fix and a new Miniflare beta/workerd pair. 4.166.0 already carries the Undici 7.30.2 security update.
- **Graph after regeneration (pnpm 10.30.3, Node 26.13.0):** one `glob@14.0.6`; minimatch 3.1.5/11.0.1/11.0.9 only; one `undici@8.12.2`; `glob@13.0.7` and `path-scurry@2.0.2` removed. All overrides, including `undici: 8.12.2`, are unchanged.
- **Verification:** frozen install passed; focused dependency tests 12/12; `./freebuff-verify.sh` exit 0 with 520 Python tests, 113 Vitest files / 1,269 tests, TypeScript and 51 docs tests; OpenNext build produced the Worker/assets/compiled CSS with a matching `BUILD_ID`; `wrangler build` and the updater-scheduler dry-run both exited 0; combined `.next` + `public` **439,922,688 bytes (419.54 MiB)**, below the 495 MiB cap.
- **Limitations:** the Playwright shards, DevSkim, the OpenNext CI job, the seven-category report and deployment are CI-only and reported PENDING. The global undici override still forces Wrangler/Miniflare/`@cloudflare/workers-utils` (declared `7.30.2`) onto v8 and jsdom's `^8.12.3` down to 8.12.2; this pre-existing residual risk is unchanged and proposed as a separate task.
- **Boundary:** no application code, `open-next.config.ts`, `wrangler.jsonc`, compatibility date/flags, bindings, workflows, secrets or production resources changed. One regular, non-draft PR is opened for owner review; nothing is merged or deployed.

---

# Previous Context — DevSkim backlog remediation (Spec 219, 2026-11-26)

## Current Task — Resolve the 422 open DevSkim alerts without weakening detection

- **Current state:** PR #2038 merged into main as bbc04ad1b0c2ced26f18fa367ce2c7488ad6df1f at 2026-11-26T07:14:56Z. PR #2037 is the preceding revert that restored main before the reviewed remediation; the final remediation PR is complete.
- **Investigation:** all 422 open DevSkim alerts were created by the Spec 217 pull-request scan at `2026-11-24T23:48:05Z`; 421 are DS162092 loopback findings in 13 Spec 217 evidence JSON files and one is DS172411 in `app/lib/lucky-meter/meter-scene.js` (line 1575 after Spec 218). Dependabot is not the cause: its only DevSkim-file change was the `upload-sarif` uploader pin (v4.39.3 → v4.39.4). The report's "100" was a single-page `per_page=100` cap, not a measured backlog.
- **Remediation:** the existing exact-span filter now admits `specs/<NNN-feature>/evidence/**/*.json` for DS162092 with the same valid-JSON/loopback-value validation, and suppresses only the exact meter watchdog statement for DS172411. The report now paginates code-scanning alerts with `gh api --paginate --slurp` and `jq 'add // []'`.
- **Fresh-eyes review:** the diff was re-read for unnecessary complexity; `should_suppress_local_probe_origin` now reuses `is_local_probe_origin_path()` and the workflow Vitest assertion binds `--paginate --slurp` to the alert command with an anchored regex instead of hard-coded slice offsets. A negative control proved the assertion fails when pagination is removed.
- **Verification:** the fresh default-branch SARIF from `da8f104c` is **3,545 raw → 3,123 existing suppressions → 422 remaining**, reproducing the live count; the updated filter with matching source leaves **0**; the real-SARIF replay gate exits 0; the suppression suite passes **115 tests**, the report contract suite **102 tests**, and the workflow Vitest file **14 tests**. Exact evidence is in `specs/219-devskim-backlog-remediation/evidence.md`.
- **Limitations:** the 422 existing alerts remain open until this branch merges and the next default-branch scan uploads the filtered SARIF; post-merge closure cannot be verified from the branch. No application code, dependency, scanner rule, scan glob or trigger changed. The change set is build-exempt, so the production build is expected to be `SKIPPED — NOT APPLICABLE` (earlier recorded as `NOT RUN — not applicable`).
- **PR #2035:** merged by the owner as `da8f104c` at `2026-11-25T21:47:06 -0400`; this task did not merge it, reuse its branch or change its scope.

# Active Context — Spec 218 production Lucky Meter implementation (2026-11-25)

- **Current state:** the production implementation is committed on `freebuff/a6f41f9dba4b0caa2d6a69b8`; PR [#2035](https://github.com/davidcollier77-code/Luckypickcanada/pull/2035) is regular, non-draft, open and unmerged for owner review. An owner-directed post-submission review repair is applied on the same branch and the consolidated report must refresh for the new head.
- **Visitor route:** `components/DailyResonance.tsx` now runs the corrected message lifecycle and the corner countdown/Home/Share overlay; `components/LuckyMeterStage.jsx`, `app/lib/lucky-meter/meter-scene.js`, `meter-layout.js` and `storyboard.js` carry the approved instrument, timing, bowl, transfer and responsive framing.
- **Responsive composition:** phone 320–430 px stacks the meter/results; tablet 820×1180 stays one column; desktop ≥1024 px uses a Spark/instrument/results row; landscape ≤560 px height uses a compact row with the season label dropped, the colour name preserved and the disclaimer in the results column. `data-finished` and `.lucky-meter-content` drive the two row compositions.
- **Number label:** `LUCKY_NUMBER_LABEL` is now **Your Lucky Number**; the dock Share control shows **Share** with the full accessible name.
- **Verification:** full Vitest **1,268 / 1,268**; `tsc --noEmit` exit 0; full `lucky-meter-daily-resonance` Playwright spec **78 passed / 6 opt-in captures skipped / 0 failed** across desktop, mobile-390 and mobile-412 at CI concurrency; clean production build after the review repair **423,980,206 bytes (404.34 MiB exact; 419.56 MiB by `du -sk`)**, below 495 MiB; no new dependency. Production captures are in `specs/218-lucky-meter-complete-experience/evidence/production/`.
- **Limitations:** software Chromium at DSF 1; no physical devices, high-DPR, touch, cross-browser or hardware-GPU evidence. 320×568 scrolls vertically to the result panels; the fixed site compass is a sitewide overlay. `pnpm lint` (no ESLint config) and `./freebuff-verify.sh` remain unavailable in this environment.
- **Deferred:** T046 prototype removal (development-only reference retained).

## Review repair (owner-directed, post-submission)

- **Amazon Q inline finding — valid.** `tests/visual/lucky-meter-daily-resonance.spec.ts` asserted `toHaveCount(0)` on the tier message and then immediately queried that same absent element. The reduced-motion case was restored to `data-state="holding"`, which is what `completeCalmly()` sets and what the separate reduced-motion test already asserted.
- **Two further stale assertions found while verifying the finding — valid and PR-caused.** The celebration case and the resumed-cinematic case still expected the temporary sentence to remain visible through the celebration. Spec 218 acceptance scenario 1 requires it to unmount before the celebration's first frame, and the updated unit tests already assert that; both browser cases now assert absence.
- **Playwright version — no upgrade.** The repository declares, locks and installs `1.65.1`, which is the current stable release; `1.66` exists only as `next`/alpha prereleases. The earlier browser failures were stale assertions plus software-WebGL commit timing under concurrent workers, not a Playwright defect.
- **Additional implementation repair.** The percentage sampler could tick before the generating stage committed, so the first visible value could skip the curve's zero (reproduced as 8 under software WebGL). `DailyResonance` now gates sampling until that stage has painted; the first visible percentage is always the curve's start.
- **Verification after repair:** full Vitest **1,268 / 1,268**, `tsc --noEmit` exit 0, targeted Playwright **9 / 9**, full Lucky Meter spec **78 passed / 6 skipped / 0 failed** across the three projects at CI concurrency, and a clean build at **423,980,206 bytes (404.34 MiB)**, below 495 MiB.
- **First pushed-head Visual QA run — both shards failed.** Shard 1's failing case was reproduced under `CI=1`: the seasonal-palette poll waited only Playwright's default 5 s for storage hydration, while the stage shows a single placeholder chamber until then. The poll now allows 25 s like the spec's other stored-state waits and still requires all twelve ids; the four palette cases pass. Two shard 1 failures were recovered from the uploaded Playwright report artifact: the storyboard case required a short `landed` DOM commit that React can batch away under load, and the desktop finished case compared the results column against the stage's whole 3D canvas box (wider than the visible wheel, so a false overlap). Both assertions now check the storyboard order and the instrument's central column respectively, and pass locally. Shard 2's failure was real: the Spec 218 commit changed the Start emblem from `✨` to `✦`, breaking the sitewide gold-CTA contract in `sitewide-gold-cta.spec.ts`. The emblem is restored to `✨`, which keeps the sitewide identity and passes the case on all three projects. This VM has no emoji font, so the local evidence capture shows a placeholder box; CI installs Noto Color Emoji.

# Historical — Spec 218 focused prototype gate (owner-approved)


## Current Task — Focused responsive 3D prototype, awaiting owner comparison

- **Scope:** Spec 218 artifacts are in `specs/218-lucky-meter-complete-experience/`. The development-only prototype mounts as the `lucky-meter-instrument` scene in the Creative Workbench with selectable 390 × 844 mobile, 820 × 1180 tablet portrait and 1440 × 900 desktop stages. It validates the gold 12-chamber instrument, fixed 7:30 maple pointer/spout, upright percentage well, physical medallion flip, clear faceted crystal bowl and teal fill across all three sizes.
- **Responsive implementation:** `WORKBENCH_STAGES`/`resolveWorkbenchStage()` and the workbench stage selector/`setStage()` API drive exact stage sizes. Pure `instrumentFraming(width, height)` keeps one perspective and changes only camera distance/look-at: phone extent 6.6, tablet portrait 4.5 (safe bowl/pointer margins), desktop 4.2. The wheel remains circular and no non-uniform scaling is used.
- **State:** READY has the medallion closed, all chambers full and the clear bowl empty. FINISHED has the medallion flipped, `78% / HIGH RESONANCE` upright, only the 7:30 chamber empty on its gold floor with `27` fully visible, and the bowl full of autumn Deep Teal. The illustrative reading is not generated or stored.
- **Refinement (owner review):** the empty bowl now uses a custom Fresnel crystal shader with per-triangle facet normals and white edge/rim highlights; the pointer uses a broad five-lobed veined maple blade outside the rim; the chamber enamel has a two-lobe specular/Fresnel sheen while keeping the seasonal palette saturated. The three fixes hold at all three stages.
- **Evidence:** six exact-size captures in `specs/218-lucky-meter-complete-experience/evidence/`: READY/FINISHED at mobile 390×844, tablet 820×1180 and desktop 1440×900. Responsive observations and limitations are in `research.md` §12; the visual comparison is in §11.
- **Verification:** focused workbench **18/18**; responsive framing **4/4**; full Vitest **1,265/1,265 across 113 files**; `tsc --noEmit` exit 0; clean production build **394,624 KB (385.38 MiB)**, below the 495 MiB cap; all captures report `surface: ready`, `error: null`, `errors: []`, with only the expected stage-remount WebGL context-loss and font-preload warnings. No visitor route, `meter-scene.js`, `storyboard.js` or `DailyResonance.tsx` change has been made.
- **Boundary:** stop for the owner's READY/FINISHED comparison at all three sizes. Phase 3+ (the full visitor experience and production responsive layout) must not start until the owner approves the prototype.
- **Limitations:** software-rendered Chromium at device scale factor 1 (no physical GPU or devices); high-DPR, touch, cross-browser and physical-device performance remain unverified; the prototype deliberately omits the ribbon, plaques, controls, Spark and route chrome; the medallion still uses the shared stamped silhouette; the enamel sheen is satin rather than a full clearcoat reflection.

---

# Active Context — Lucky Meter delivery and adaptive performance

## Current Project State — Spec 217 merged

- **Scope delivered:** the owner-approved 300 ms canvas fade, produced-frame readiness gate with a 3,000 ms watchdog, retained CSS fallback until the incoming canvas is visible, and activation-gated celebration audio. Scene composition, palette, storyboard, cue map, render tiers and dependencies were preserved.
- **Readiness gate:** the first produced frame is followed by two animation frames before the meter is announced ready. If no frame arrives within 3,000 ms, the surface stops and the complete CSS meter remains visible. Context loss and disposal cancel pending readiness work.
- **Fallback hand-off:** the CSS meter remains beneath the canvas until its computed opacity leaves 0 or `transitionend` fires. The 6 s guard stops polling but never removes the fallback while the canvas remains transparent.
- **Review repairs:** a watchdog-stopped surface restarts after WebGL context restoration, while an explicit stop still suppresses restart; deferred celebration-cue loading is idempotent and resets when the shared audio set is released; the sequential-wait Playwright case uses `test.slow()` without changing assertions.
- **Verification:** focused unit files **24/24**; full Vitest **1,259/1,259** across 112 files; `tsc --noEmit` exit 0; affected Playwright cases **9/9** across desktop and both mobile projects; full Lucky Meter Playwright **54 passed / 6 opt-in captures skipped** before the review repairs; final cold transfer **1,473 KiB total / 590 KiB audio**; production build **437,895,168 bytes (417.61 MiB)**, below 495 MiB; repository gate passed with 490 Python checker tests and 51 documentation tests.
- **Remaining validation:** SC-006 physical-device GPU verification remains outstanding; software rendering is not evidence of physical GPU performance. The 2.4 s first-composite task remains separate from fade blocking.
- **Merge:** PR [#2033](https://github.com/davidcollier77-code/Luckypickcanada/pull/2033) merged into `main` at `2026-11-25T00:38:11Z` (2026-11-24 20:38:11 Atlantic). Merge commit: `ae844b4902a387cde508a4d1a312c9a535ad29ff`. The current `main` ref was verified at the same SHA.
- **Deployment boundary:** pushes to `main` trigger the existing Cloudflare deployment workflow. This merge record does not substitute for the deployment workflow's own result.

# Previous Context — Device capability and observability (Spec 215)

## Current Task — Complete device capability and observability (Spec 215)

- **Scope:** centralize the existing hardware-hint readers behind one cached `getDeviceAssessment()`, report display demand separately from capability, expose a lazy WebGL1/WebGL2/limits feature report, and add an observational frame monitor fed by the existing shared and cosmic frame loops. No visual, timing, loading or cadence change.
- **Boundary:** the 3 MP backing-store gate and the coarse-pointer DPR-3 gate remain in `resolveRenderQuality`. `describeRenderBudget()` names `surface`, `legacy-pointer-density`, `capability` or `policy`; removing the gates is deferred to adaptive-rendering work. The exact option impacts are in `specs/215-device-capability-observability/research.md`.
- **Monitor:** `warming`/`healthy`/`strained`/`critical` from a 1.5 s window after a 2 s warm-up and 1 s hysteresis, with hidden/gap/target resets. It never adapts quality or cadence. The cosmic engine's local 42/18 fps step is unchanged.
- **Monitor follow-up:** thresholds now scale from the active plan's frame rate (60 fps keeps 50/28 fps and 28/70 ms; 30 fps uses 25/14 fps, 56/140 ms and a 100 ms long frame). Statuses add `paused` (the plan expects no frames) and `idle` (the plan expects frames but the source stopped); evidence is `measured`, `insufficient`, `unavailable`, `paused` or `stale`. One monitor keeps a window per existing source (`adaptive-frame-loop`, `cosmic-engine`) and reports the weakest measured source, so a fast loop cannot mask a slow one. No loop, timer or listener is added.
- **Diagnostics and report:** `getPerformanceDiagnostics()` returns `{ plan, monitor, device }`; the Creative Workbench exposes it as `getState().diagnostics` (version 2) and shows a Performance health panel. The consolidated PR report carries one informational block outside the seven categories with `GOOD`, `NEEDS ATTENTION`, `BAD` or `NOT ENOUGH DATA`; CI has no runtime frame sample, so it truthfully reports `NOT ENOUGH DATA`, and an optional `--performance` JSON can supply a pinned snapshot without adding a workflow step.
- **Site-wide priming:** still the root `ResourceReadiness` → `useAdaptivePlan` → `getAdaptivePlan` → `readDeviceState` chain; `readDeviceState` now delegates to the assessment and display demand. No new provider or preloader.
- **Verification:** the Workbench and monitor suites (39 tests), the report suite (102 tests), all 490 Python checker tests, `tsc --noEmit`, the Next.js build at 500,695,040 bytes (477.50 MiB, below 495 MiB) and 51 docs tests pass on the rebased tree. The automated review's Workbench `performance` shadowing, report text-injection and malformed-snapshot crash findings were corrected, the report now names an fps floor only when the measured rate actually missed it, and a source guard keeps the Workbench diagnostics state from shadowing the global frame clock. The full Vitest suite passes 1,246/1,246 after the owner-directed merge-readiness follow-up made the `__tests__/lucky-meter-stage.test.jsx` drain assertion read the conic-gradient start angle directly (a missing `from` means 0deg), because jsdom 31.0.1 drops a default `from 0deg` during serialization. The same follow-up repaired two review findings: a paused plan's zero target now renders as `0 fps` in the Workbench panel instead of an unknown placeholder, and a warm-up window that already holds samples now warns `insufficient-samples` instead of `no-samples`. That test-only repair is declared as a scope expansion in the PR description and needs the owner's `/approve-scope` comment. The earlier Spec 215 results remain in `specs/215-device-capability-observability/tasks.md`. Hardware GPU, Samsung Internet and Safari/Firefox mobile evidence remain unavailable in this VM; thresholds are provisional.
- **PR status:** the predecessor PR #2023 was already merged, so the follow-up is prepared as a new regular, non-draft, unmerged PR against current `main`; no deployment.

# Previous Context — Repository security audit and monitoring (Spec 213)

## Previous Task — Complete GitHub security audit and monitoring (Spec 213)

- **Initial GitHub Security:** 11 open code-scanning alerts (all DevSkim), 0 open secret-scanning alerts and 1 open Dependabot alert (`minimatch` 9.0.9, medium, development scope).
- **Code-scanning disposition:** every callable timer finding, including the identifier-callback timers, received a reviewed inline `DevSkim: ignore DS172411` suppression; nine alerts are synthetic test fixtures whose source no longer contains a 40-hex token or a literal placeholder marker.
- **Dependency:** `glob@10` is overridden to `14.0.4`, which resolves patched `minimatch@11.0.5` for the only 9.x consumer, `@node-minify/core` in the OpenNext build toolchain. Forcing minimatch 11 into glob 10 was verified to break `globSync` matching, so the consumer is upgraded instead. `pnpm-lock.yaml` has no 9.x or 10.x resolution.
- **Monitoring:** Dependabot alerts are enabled; `.github/dependabot.yml` keeps the weekly schedule and now groups security updates plus routine minor/patch updates per ecosystem. DevSkim runs on pull requests, `main` pushes and weekly; CodeQL default setup is configured for JavaScript/TypeScript, Python and Actions with a weekly schedule.
- **Ledger:** historical entries are removed only after the corresponding alerts are closed and every surviving finding is suppressed at the source; the heading, explanation, marker and append workflow stay.
- **Final GitHub Security:** 0 open code-scanning alerts, 0 open secret-scanning alerts and 1 Dependabot alert whose corrected lockfile is pending merge to `main`.
- **Verification:** the focused checker, dependency-policy and QA review-comment suites pass; `SPEC_KIT_BASE_REF=4c6087cf ./freebuff-verify.sh` exits 0 with 471 Python tests, 110 Vitest files, 51 docs tests and the Next.js build below the 495 MiB cap. The PR body records the exact measured size for the final head.
- **PR status:** one regular, non-draft, unmerged PR (#2014) for owner review; the review-driven dependency and ledger repairs are verified and pushed.

# Active Context — Lucky Meter dimensional redesign (Spec 212)

## Current Task — Complete Lucky Meter dimensional redesign (Spec 212)

- **Scope:** one Three.js scene replaces the SVG wheel, 6 o'clock pointer, separate vessel surface and medallion engine: `app/lib/lucky-meter/meter-scene.js`, `meter-layout.js`, `components/LuckyMeterStage.jsx`, a permanent `LuckyMeterMessage`, and the corrected `storyboard.js`/`reveal.js` clocks. The retired `LuckyMeterRing`, `LuckyMeterVessel`, medallion engine and vessel scene are deleted; `experiences.js` registers the meter once as `lucky-meter` (three/3d, `three` chunk).
- **Corrected timing:** wheel 4,400 ms / five turns / stops 6,300 ms; percentage 9,400 ms from 1,900 ms, stored result only at 11,300 ms; pour 2,000 ms; pause 1,500 ms; beam 1,500 ms; message 800 ms lead-in + typing + 3,000 ms hold + 800 ms visible settle (no fade); 12,000 ms celebration, 1,300 ms Spark delay, 3,800–5,200 ms writing, 2,800 ms hold, 3,600 ms dock. Reveal completes at 16,300 ms; total is emergent, with no later stage shortened.
- **Vessel rule:** only the selected chamber drains; the other eleven stay full; the receiving vessel fills by 13,300 ms and stays full through FINISHED. The tier sentence remains visible at full opacity through the celebration and FINISHED.
- **Fallback:** complete CSS meter (conic chambers, gold leaf pointer/arm, leaf, glass vessel, stream, beam), no SVG; context loss returns to it and restore returns to the scene.
- **Verification:** `tsc --noEmit` and 244 focused Vitest tests pass. Build size, browser suite and `./freebuff-verify.sh` are recorded in `specs/212-lucky-meter-dimensional-redesign/tasks.md` and the PR.
- **PR status:** one regular, non-draft, unmerged PR for owner review.

# Active Context — PR verification streamlining

## Current Task — PR verification streamlining (Spec 211)

- **Goal:** make every PR check earn its runtime through trusted applicability, honest `NOT RUN` reasons, smarter Playwright execution and a local gate that predicts CI, without removing coverage.
- **Implemented:** fail-closed build classifier (`pr_applicability.py`) gating the protected OpenNext workflow; trusted-base recomputation in Verification Integrity and the consolidated report; the always-required job renamed `Application Verification`; a required-but-skipped check now blocks while a proven-inapplicable check is `NOT RUN — not applicable`; Playwright timing capture, whole-file duration-weighted shard planning seeded from a real run with exact-coverage guards and anchored file filters, shadow-mode affected-spec reporting that lists the affected specs, and flake/imbalance warnings; `./freebuff-verify.sh` now runs all Python checker suites, the full Vitest suite, the type check, the Next.js build and the 495 MiB cap.
- **Preserved:** all 16 Playwright specs, three projects, every committed baseline, Crystal Ball/Oracle and adaptive-performance/resource-readiness coverage, DevSkim, CodeQL default setup, Dependabot and the `performance` checker mode.
- **Excluded pending separate approval:** dead checker modes, obsolete root scripts, deployment-workflow narrowing, subset spec selection and a third shard.
- **PR status:** open and unmerged for owner review.
- **Owner-directed follow-up:** the verification audit's bounded wait now
  requires an applicable browser group to be created and to settle, and is
  sized above a shard's own timeout (1800 s wait, 40-minute job). Three CI
  Playwright workers measured faster on the long Lucky Meter spec (587 s at two
  workers, 409 s at three), but on the four-CPU CI runner the third worker
  starved that spec (three hard mobile failures, seven retry-only passes), so
  CI keeps two; splitting the spec further did not beat the shard floor either,
  and every spec and baseline is unchanged.

## Previous Task — Resource-readiness safety limits (Spec 210)

- **Goal:** bound the existing readiness hub before any two-container handover: capacity accounting, queue caps, counted leases and real disposal, with tests.
- **Scope:** `app/lib/resource-readiness.js` and `__tests__/resource-readiness.test.js`, plus Spec 210 artifacts and this Memory Bank header. No new preloader, payload accessor, visual, audio, timing or layout change.
- **Implemented:** per-tier entry/weight/queue/speculative budgets; declared-or-estimated weights; priority admission that defers speculative work, sheds queued speculative jobs for committed work and evicts settled unleased records; counted leases that retire rather than dispose on release, pressure, version change and eviction; best-effort disposal for hub-owned payloads only; `getResourcePoolStats()` diagnostics.
- **Deferred:** the alternating two-container handover, reserve gates, overflow classes, replenishment and demand scaling remain future work until a current experience consumes a prepared payload.
- **Verification:** readiness suite 45 tests; focused readiness/adaptive suites 116 tests; full suite 108 files / 1,172 tests; `tsc --noEmit` exit 0; `SPEC_KIT_BASE_REF=dda472cd620ed60e8841cb73582fdfdd00168013 ./freebuff-verify.sh` exit 0; production build 461,424,444 bytes (440.05 MiB), below the 495 MiB cap.
- **Review repairs (owner-directed, post-submission):** removed shed and refused stale records from retained capacity while keeping them in the bounded rejection ledger; refreshed ledger insertion order on re-rejection; stopped background eviction and refused impossible requests without emptying the pool; revived release-retired records for a new consumer instead of sweeping them underneath it; deferred a same-key version replacement until the old record is disposed; made readiness snapshots report the most recent decision; added four regression tests. The remaining advisory findings were checked: the `allowIntent` claim is not a defect (intent still sheds background work first), the `disposeEntry` retired-flag note is harmless on detached entries, and explicit release intentionally leaves in-flight work alone under the documented policy.
- **PR status:** regular, non-draft PR, open and unmerged for the owner; the consolidated seven-category report must refresh for the new review-repair head after push.

## Previous Task — Compact Agent Governance (Spec 207)

- **Goal:** Reduce `AGENTS.md` from 478 lines to a concise entry point while retaining every distinct requirement and all three agent-applicability classes.
- **Approach:** Keep direct rules in `AGENTS.md`; refer detailed PR, startup, manifest and specialist procedures to their authoritative documents. Keep Freebuff-only and ChatGPT-only instructions separate.
- **Scope:** `AGENTS.md`, its governance regression test, Spec 207 artifacts and this active-context header. No startup, manifest, PR procedure, QA workflow, protected script, application or dependency changes.
- **Verification boundary:** The historical startup preflight reported Node.js 22.16.0 and missing pnpm 10.30.3; the repository requires Node.js 26.x and pnpm 10.30.3. Node-26-dependent project tests, builds and pnpm operations were not run in that task. Current `AGENTS.md` §6 permits compatible repository scripts and QA/PR-support utilities when their prerequisites, runtime, permissions and side effects are acceptable. GitHub Actions must provide current-head CI evidence.
- **PR status:** Prepare a dedicated, regular, non-draft PR; leave it open and unmerged. The owner must provide the governance digest comment and separate protected-file Environment authorization before merge.

## Previous Task — Agent governance and PR handoff (Spec 206)

- PR #2006 was merged into `main`. Its current-head report and protected-file authorizations belong to that completed PR.
- The current task only condenses the governance entry point; it does not revise the seven-category report, `PR_SUBMISSION.md`, startup documentation or browser tooling.

## Current Project State — Lucky Meter approved Build (Spec 205)

- The approved Lucky Meter Build was implemented on `freebuff/lucky-meter-build` and merged through PR #2005.
- Durable implementation and verification details remain in `memory-bank/progress.md` and `specs/205-lucky-meter-approved-build/`; old pre-Build gate notes below are historical, not current status.
- The approved presentation and preserved CSS fallback, five-beat generation, progressive drain reveal, uniform 12,000 ms celebration, Spark window and results-panel dock are recorded in Spec 205 and the milestone history.

## Previous Task — Pre-Build documentation reconciliation

The earlier documentation-only reconciliation for Specs 199/200 is complete and was followed by the authorized Build. Its original planning and intermediate verification notes are retained below as historical context, not as current task status.

## Recent Implementation — Three-dimensional vessel and pour (Spec 200)

- **Spec Kit feature:** `specs/200-lucky-meter-dimensional-vessel`
- **Scope:** replaced the CSS vessel with a lathed Three.js tumbler on the
  shared creative surface, added the curved stream and splash, raised the
  medallion face, added gold sky writing and corrected the Home/countdown
  contract.
- **Verification record:** T035–T037 record `tsc --noEmit`, 23 focused tests and
  105 files / 1,133 Vitest tests. T038–T041 (Playwright, production build,
  `./freebuff-verify.sh`, final evidence/diff review) and T052 (PR handoff)
  remain unchecked.
- **Superseded by the approved outline:** top-right Home dock, glyph-by-glyph
  Spark, fill-only vessel/full-vessel number timing and per-tier celebration
  durations. The current contract is in the approved outline and Spec 200's
  reconciliation note.

## Previous Task — Twelve-stage Lucky Meter presentation polish (Spec 199)

- **Spec Kit feature:** `specs/199-lucky-meter-twelve-stage-polish`
- **Status:** implemented on 20 November 2026; partly superseded on 21 November
  2026.
- **Historical scope:** presentation, animation, timing and audio polish only.
  Selection, storage, tiers, messages, palettes, celebrations, the Milky Way
  backdrop and the Medallion Gold identity were unchanged.
- **Historical result:** one clock with twelve ordered stages, a four-layer
  arrival pile (34 leaves), 5–100 generation, a DOM + CSS 3D vessel, a number
  held until the drain and flashed twice, per-tier celebration lengths, a
  maple-leaf Spark cursor, a 2.6 s hold and a paired Home/countdown dock.
- **Historical verification:** focused and full Vitest suites, `tsc --noEmit`,
  a 416,229,183-byte (396.95 MiB) production build and the Playwright
  `lucky-meter-daily-resonance` spec on desktop and both mobile projects.
  These are historical records, not re-run for this documentation task.
- **Superseded:** square/CSS vessel, 5–100 monotonic generation, number only
  after the drain, fixed two-flash requirement, per-tier celebration lengths,
  top-right Home/countdown and approximately 40 s total timing.

## Previous Task — Seven-category PR verification (spec 198, PR #1983)

- **Spec Kit feature:** `specs/198-seven-checker-categories`
- **Branch:** `freebuff/25590a89225c606a9ca3e3ec` (PR #1983, open and unmerged)
- **Scope:** One consolidated PR verification report with exactly seven categories: QA Checker, DevSkim, PR Scope Verification, Protected File Changes, Verification Integrity, Governance and Workflow Verification and Dependency Health & Vulnerability Review. Statuses are `PASSED`, `FAILED`, `WARNING` and `NOT RUN`.
- **Checker 7 — Dependency Health & Vulnerability Review:** runs on every pull request from changed `package.json`/lockfiles plus GitHub's open dependency advisories. Unchanged or unrelated outdated dependencies are context only and never fail a PR; a changed dependency with an open high/critical advisory fails; a manifest without its lockfile or a moderate advisory warns; an unreadable advisory source is `NOT RUN`. Dependabot remains the unchanged weekly updater and is not a prerequisite.
- **Review repairs on PR #1983:** owner `/approve-` comments refresh the report; empty or malformed verification audits are `NOT RUN` and an audit for another head fails; a check run without `head_sha` is not current-head evidence; a render failure replaces the previous comment with a marker-first `NOT RUN` placeholder; changed-code findings render `excerpt`/`recommendation`; bot-authored PRs report the human attestation as `NOT RUN` instead of failing; check runs and dependency advisories are paginated; the final size fallback slices UTF-8 bytes.
- **Preserved:** DevSkim scanning/suppression/SARIF/upload, the full unit suite, the TypeScript check, the OpenNext build and 495 MiB gate, both Playwright shards and all committed baselines. They are supporting evidence inside QA Checker, never extra top-level categories.
- **Declarations:** the exact pre-submission code quality review line is required for QA Checker; the exact human authorization line is required for protected-file changes in addition to the existing environment-protected gate. Scope expansion requires the exact words `Scope changed` plus an explanation and the existing owner digest approval.
- **Removed requirement:** submitters no longer supply personal browser runs, screenshots or manual browser evidence; automated Playwright owns browser verification against the current head.
- **Documentation:** `PR_SUBMISSION.md` and `.github/pull_request_template.md` agree on the complete PR description, declarations and all seven categories.

## Previous Task — Shared Graphics Toolkit Guidance (spec 197)

- **Spec Kit feature:** `specs/197-shared-graphics-toolkit-guidance`
- **Branch:** `chatgpt/197-shared-graphics-toolkit-guidance`
- **Scope:** Add a 🟢 [BOTH — CHATGPT AND FREEBUFF] rule to `AGENTS.md` for future visual creation and polishing.
- **Required integration:** Use `app/lib/use-creative-experience.js`, `app/lib/graphics/experiences.js` and `app/lib/graphics/runtime.js` with the existing `app/lib/resource-readiness.js` hub wherever applicable. Do not create a competing preloader.
- **Development sandbox:** Existing Workbench at `/workbench/creative`; this does not replace Playwright or repository QA.
- **Verification limitation:** The historical startup preflight reported Node.js 22.16.0 (repository requires 26.x) and missing pnpm 10.30.3. The Node-26-dependent tests, builds and pnpm verification were not executed in that task. The earlier statement that repository instructions prohibited all repository scripts was an incorrect blanket interpretation; current `AGENTS.md` §6 permits compatible scripts after their prerequisites and safety conditions are checked. GitHub workflow checks and protected-file approvals remained outstanding for that historical PR.

## HTML5 audio reactivity and Gemini retirement QA (spec 195, current)

- **Spec Kit feature:** `specs/195-html5-audio-reactivity-gemini-retirement`
- **Base:** main at `e8bbd0a9` (after PR #1972)

### Added

- `app/lib/graphics/audio-reactivity.js` now captures playing Howler `html5: true` cues with a
  `MediaElementAudioSourceNode` on Howler's existing `AudioContext`. The source reaches the context
  destination at unity first (audible playback unchanged) and the shared analyser second. Capture is
  refused for an unsupported API, a suspended/closed context, a cross-origin element or an element
  another owner already captured; the envelope stays neutral. Scans are throttled to 500 ms, forced by
  `refresh()`, and captured sources reconnect if the analyser is rebuilt. Releasing the analyser
  removes only the analysis edge, so a cue that is still playing is never silenced.
- The development workbench gained `playHtml5Cue`, a small same-origin HTML5 cue catalogue and
  `audio.html5Sources`/`audio.html5Playing` diagnostics. It remains development-only.
- `__tests__/graphics-sound-reactivity.test.js` covers capture, audible-path ordering, de-duplication,
  fallbacks and Howler HTML5 discovery.

### Corrected

- `__tests__/reviewer-retirement.test.ts` no longer requires the retired
  `.docs/deep-dive/_google-gemini_gemini-skills_gemini-api-dev.md`.
- `__tests__/docs-library-retirement.test.ts` asserts both retired Gemini API identifiers absent from
  every manifest index, routing file and snapshot path.
- The two orphaned `.docs/creation` Gemini API snapshots were removed. Nothing was restored,
  recreated, regenerated or replaced.

### Review repairs (owner-directed PR #1975)

- A failed analysis connect no longer marks the element as analysed: the captured source is tracked
  with a pending edge and retried on each scan or graph rebuild without re-capturing the element.
- Howler's `autoSuspend` is switched off once a cue is captured (its scheduled timeout re-checks the
  flag) and `ensureCapturedCuePlayback` resumes a suspended or interrupted context while a captured
  cue is playing, so inactivity can never silence a rerouted cue.
- `resetHtml5AnalyserCapture()` gives each HTML5 test a clean registry, removing order dependence.
- `.freebuff/sentinel.md` no longer mandates the retired Gemini API source, and the retirement test
  now checks every `.freebuff/*.md` file.

### Verified

- Focused 44 tests after the review repairs (42 before), refresh-docs 48/48, Chromium Web Audio
  baseline 0.064 and HTML5-only peak 0.065 (`html5Sources: 1`), fallback playback with
  `html5Sources: 0` and peak 0, no page errors.


## Creative Workbench and sound reactivity (spec 193 continuation, current)

- **Spec Kit feature:** `specs/193-graphics-development-toolkit` (continuation section)
- **Branch:** `freebuff/4710ddd25ee135d8c2e93310` (continues PR #1966's layer from `c5a3bd74`)

### Added

- `app/lib/graphics/audio-reactivity.js`: one shared `AnalyserNode` on the graph Howler already
  built (`masterGain → analyser → 0-gain → destination`, so the audible mix is untouched), a
  smoothed envelope (fast attack, slow release, band splits, peak, transient with a 140 ms cooldown)
  and bindings for a light rig, a particle field, any numeric property and beat callbacks. No
  `AudioContext` is created; `html5: true` Howler cues bypass Web Audio and are documented as
  unanalysable.
- `reactiveAudio` in `technologies.js` resolves to `audioReactive` only when the browser can analyse
  audio and motion is allowed, with `selectGraphicsTechnologies(requirements, quality, overrides)`
  gaining a deterministic `reducedMotion` override for harnesses.
- `runtime.js` creates the envelope when the plan enables it, updates it before the caller's frame,
  passes it as `frame.envelope`, exposes it as `surface.reactive` and disposes it with the surface.
- `app/lib/graphics/workbench.js` (pure catalogue, state, plan, capture names, production gate),
  `workbench-runtime.js` (deterministic Three.js/Canvas 2D scenes) and
  `components/graphics/CreativeWorkbench.jsx` with `window.__creativeWorkbench` (getState,
  selectScene, setTier, setSeed, setReducedMotion, setTime, play, pause, playCue, capture,
  readCapture). The route `/workbench/creative` is dynamic and 404s in production unless
  `CREATIVE_WORKBENCH=1`.
- `CreativeSurface.jsx` accepts an optional value-compared `quality` prop.

### Preserved

No visitor route, artwork, animation, timing, sound, layout, dependency or service changed. Existing
surfaces never request `reactiveAudio`, so they create no analyser. The documentation-library,
manifest, updater workflows and Cloudflare scheduler work remain untouched.

- **Updated:** 2026-11-19
- **Branch:** freebuff/5675fb1c2b649136e34a4b21
- **Base:** main at 722e17b7
- **Spec Kit feature:** specs/193-graphics-development-toolkit

## Current Task

Equip the repository with premium graphics-development capabilities for future cinematic, realistic
and gaming-quality visuals. Audit existing dependencies, install only what adds genuine value, and
integrate it so future work can use it — without changing any existing visual, artwork, animation,
layout or behaviour. Free/MIT only, mobile and performance preserved, build strictly below 495 MiB.

## Implemented State

- `three` 0.187.0 (runtime) and `@types/three` 0.187.0 (dev) are installed. No other package was
  added; `gsap`, `framer-motion`, `canvas-confetti` and `html2canvas` were already present and are
  reused.
- `app/lib/graphics/stage.js` creates a renderer, scene and perspective camera from
  `resolveRenderQuality` tiers, loads Three.js through a dynamic import, renders through
  `createAdaptiveFrameLoop`, paints one static frame under reduced motion, watches context loss and
  restoration, caps the pixel ratio without touching CSS size, and disposes the loop, observers,
  listeners, scene resources and WebGL context.
- `app/lib/graphics/effects.js` composes `EffectComposer` + `RenderPass` + `UnrealBloomPass` +
  `OutputPass` + `SMAAPass` from `three/addons`, with per-tier bloom strength, resolution scale and
  no bloom/SMAA on the constrained tier.
- `app/lib/graphics/assets.js` lazily loads uncompressed glTF/GLB and returns a disposable scene or
  `null`; `app/lib/graphics/resources.js` disposes geometries, materials and textures.
- `app/lib/graphics/README.md` documents usage, budgets, fallbacks, rejected alternatives and
  limitations; `docs/graphics-rendering-architecture.md` gained the toolkit section.
- Nothing in `app/`, `components/` or any page imports the toolkit. No Three.js chunk is emitted and
  no existing page, component, style or asset changed.

## Verification

- Focused toolkit tests 16/16 and dependency-policy tests 10/10 pass.
- `pnpm exec tsc --noEmit`: exit 0.
- `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh`: exit 0 (includes install, Spec Kit gate, QA
  script suites, type check, production build and refresh-docs tests).
- Production build 370.55 MiB (386 MiB by `du -sm`), below the 495 MiB cap, with
  `grep -rl WebGLRenderer .next/static` returning zero files.
- Software-rendered harness (SwiftShader WebGL2): stage and bloom composer created, 34 frames, lit
  pixel readback, `glError 0`, no page error.
- Desktop 1440×900 and mobile 390×844 homepage captures show unchanged visuals and no application
  console error; only the wrapper session's dev HMR WebSocket handshake failures appeared.
- Evidence: `specs/193-graphics-development-toolkit/evidence.md`; captures in
  `artifacts/graphics-development-toolkit/`.

## Limitations

- No hardware GPU in this VM, so no GPU performance measurement exists.
- Draco/KTX2 compressed models are deferred until an effect needs them.
- The first production consumer is the Lucky Meter vessel (`lucky-meter-vessel`, Spec 200); the
  Three.js chunk remains lazy and is requested only by that experience. A future effect still needs
  its own browser, mobile, accessibility, performance and baseline verification.
- The CI visual regression suite runs after PR creation; it was not run locally.

## Continuation — completed automatic integration (PR #1966, 2026-11-19)

The owner directed that the toolkit become automatically available and usable, not merely installed.

- `app/lib/graphics/technologies.js` selects the render technology (Three.js, Canvas 2D, an existing
  WebGL engine, or DOM) plus motion and audio technology from the declared requirements, the shared
  capability probes and the adaptive tier. Existing `webgl` experiences are never moved to Three.js.
- `app/lib/graphics/experiences.js` is the single visual registry. `creativeResourcesFor` derives the
  hub resources (`module`, `texture`, `model`, `audio`) from one descriptor; the readiness manifest
  spreads them into its experience definitions, and `installCreativeExperiences()` installs the
  adapters and registers any future visual experience automatically. No second preloader exists.
- Building blocks: `canvas-surface.js` (managed Canvas 2D), `timeline.js` (lazy GSAP),
  `materials.js`, `lighting.js`, `particles.js`, `audio-sync.js`, `runtime.js` (one lifecycle for
  every renderer), `components/graphics/CreativeSurface.jsx`, `use-creative-experience.js` and the
  unmounted example `examples/golden-motes.js`.
- The Lucky Meter and the Lucky Card Reveal call `useCreativeExperience`; their derived resources
  (Lucky Meter sound set, reveal sparkle/applause/pop, confetti chunk) are prepared by the hub after
  the page settles. At the time of PR #1966 those visuals, timing, sounds, responsive behaviour and
  fallbacks were unchanged; Specs 199 and 200 later changed the Lucky Meter presentation, while the
  Card Reveal remained unchanged.
- PR review findings were repaired: `Clock.start()` reset, context loss before `renderer.dispose()`,
  SMAA before `OutputPass`, exposed bloom handle with `setBloom`, real shared-layer guard assertion,
  README double render. Graphite's context-restore claim was checked against Three.js's
  `WebGLRenderer.onContextRestore` and is not a defect.
- Verification: 103 files / 1083 Vitest tests, `tsc --noEmit` exit 0,
  `SPEC_KIT_BASE_REF=722e17b7 ./freebuff-verify.sh` exit 0, production build 378,582,202 bytes
  (361.1 MiB; 376 MiB by `du -sm`), zero page chunks containing Three.js (engine code is async-only).
  Playwright visual runs and the CI checkers remain pending after the push; no ESLint config exists.

### Round 2 (current head)

Five genuine review findings were repaired: `CreativeSurface` requirement identity, explicit
`aria-hidden`, the `audio-sync.attach` timeline contract, once-per-teardown disposal of shared
resources, and a stall timeout for `loadGLTF`. Clock reset, context-loss ordering, SMAA order and the
bloom handle remain fixed from round 1; the context-restore and camera-aspect claims were re-checked
and are not defects. Focused tests 41, full suite 103 files / 1087 tests, `tsc` exit 0,
`freebuff-verify.sh` exit 0, clean build 394.53 MiB by `du -sb .next public`.


## Documentation Library Addition — Three.js concise LLM reference (2026-11-19)

A separate `/websites/threejs_llms_txt` source now points to `https://threejs.org/docs/llms.txt` and is routed to Creation and Polishing. The existing `/websites/threejs` source remains the full `llms-full.txt` reference. The concise snapshot is canonical in Creation; Polishing uses the established relative symlink pattern. No application code or updater workflow was changed.

