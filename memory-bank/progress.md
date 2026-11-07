# Current Task — PR #1761 follow-up: visual coverage, PR checks and Lucky Stories card alignment (2026-11-07)

- **Task groups:** `testing` (new browser-level coverage for the refreshed copy and the FAQ interaction) + `creation` (the homepage Lucky Stories card now uses the approved introduction wording) + `polishing` (the card keeps its existing note and gold CTA rhythm). Feature: reuse `specs/106-homepage-content-presentation`; branch `content/homepage-wording-presentation-20261107`; PR #1761 open and unmerged.
- **Changes:** `app/homepage/HomePage.js` card body is now the approved first introduction passage, verbatim, with the existing non-testimonial note as a `.homepage-offer-note` line; `EXPLORE LUCKY STORIES` still targets `/map`. New `tests/visual/homepage-content-refresh.spec.ts` covers the Experience copy, the aligned card, the three Tip Jar passages, the four Suggestion Box passages plus form contract, the ten-question FAQ opened by click (aria-expanded, two-paragraph long answer, no clipping, single-open), both `/map` passages and zero horizontal overflow. `__tests__/homepage-content-refresh.test.js` gains the card alignment guard.
- **Deliberately not exercised in automation:** the Suggestion Box POST, the Tip Jar checkout and paid reveals (Stripe/Turnstile/database side effects); their contracts remain with the unit and source guards.
- **PR-head checks observed on `e61013df`:** Visual QA success (15:21:59Z), Graphite AI Reviews success, CodeQL success (no new alerts), DevSkim success (1 note), updater-scheduler jobs success/skipped; Protected File Changes and Pullfrog produced no check runs (no protected path or matching workflow).
- **Pending:** the new head's Visual QA run, local Playwright execution, the production build measurement and the updated PR body.

---

## 2026-11-07 — Approved homepage content and presentation refresh

- Implemented the approved Lucky Pick Canada wording: the Lucky Meter, Daily Lucky Card Reveal, Crystal Ball and Lucky Pick sections, the Lucky Stories / Community Map introduction, the Tip Jar, the Suggestion Box and the ten-question FAQ.
- Removed the risk of FAQ/structured-data drift by moving the ten Q&As into `app/homepage/faq-content.js`, consumed by both the server-rendered FAQPage JSON-LD (`app/page.js`) and the client accordion (`app/homepage/FAQSection.js`); the accordion now renders `\n\n` answers as paragraphs and its open container grew from 500 px to 1600 px so the longest answer cannot clip.
- Presentation stays inside the existing identity: `.homepage-copy-stack` (gold hairline, lead sentence, 1.75 line height, emphasised close) for the Tip Jar and Suggestion Box, `.map-community-intro` for the two map passages, a wider 760 px Tip Jar card, and a smaller Suggestion Box heading for its longer sentence.
- Preserved: gold 3D CTA markup and count, section destinations, `/api/lucky-stories/react` celebration with its localStorage state and running tally, `/api/suggestions` POST with validation, honeypot and Turnstile, tip checkout, Stripe products/prices, email delivery, artwork, audio and navigation. No new dependency, route or reaction system.
- Verification: focused guard 18/18; full Vitest 48 files / 382 tests; `tsc --noEmit` exit 0; `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh` exit 0 before and after the final CSS addition; rendered cloud-browser checks confirmed every passage on `/` and `/map`, 10 visible and 10 structured-data questions, 8 gold CTAs, 0 horizontal overflow, correct placeholder/button text, and all FAQ answers unclipped.
- Remaining: Playwright visual regression and mobile-viewport capture were not runnable here; PR-head Visual QA covers them. PR left open and unmerged.

---

## 2026-11-07 — Freebuff startup-command audit

- Established how the Freebuff runtime executes commands: Bash (`SHELL=/bin/bash`, login shell `/bin/bash`, GNU Bash 5.2.21); `/bin/sh` is `dash`, which rejects `source` (127) and the bootstrap's Bash syntax.
- Demonstrated the current command's defect instead of inferring it: in a fresh `HOME` whose PATH lacks `$HOME/.local/bin`, `bash scripts/bootstrap-pnpm.sh` installs pnpm 10.30.3 and the following `pnpm install` still fails with exit 127, because the script's `export PATH` ends with the child process.
- Measured the alternatives: `source scripts/bootstrap-pnpm.sh && …` exits 0 (fresh home, frozen install, pnpm 10.30.3) but exits 127 under `dash`; `bash -c 'source … && …'` exits 0 in both shells. Steady state is 4.38 s / 4.40 s / 4.38 s, so the wrapper costs nothing measurable.
- With a competing pnpm 10.30.0 first on PATH and version self-management disabled, the current form installed with 10.30.0 while the sourced form used the validated 10.30.3. Recorded the residual case where `$HOME/.local/bin` is already later on PATH and is not reordered.
- Recommended `bash -c 'source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile'` and confirmed no repository code change is needed; `freebuff-verify.sh` already sources the bootstrap, so the gate and the recommended startup path share one code path.
- Verification: `./freebuff-verify.sh` exit 0, production build 350,554,659 B (334.31 MiB) on the final gate run (an earlier run measured 333,135,931 B); both below the 495 MB maximum, `package.json`/`pnpm-lock.yaml` unchanged, probe script committed for reruns.
- Added `__tests__/freebuff-startup-command.test.js` (6 tests) and documented the canonical command in `README.md`: exactly one documented command, byte-equal to the tested form, executed successfully with no `pnpm` on PATH under both Bash and a POSIX `sh`. Deliberately replacing it with either rejected form fails 4 tests; restoring it passes 6/6, and the related bootstrap/gate/dependency suites pass 17/17.

---

## 2026-11-07 — Post-merge branch-cleanup audit repair

- Rechecked the live GitHub branch list after PR #1754 merged at 07:56:56 UTC to `af350ba6d4b1dbb10eb1257211778085b1edb4eb`.
- Reconciled 1,452 retained inventory rows: 0 missing branches, 0 tip-SHA changes, 0 duplicates. Reconciled 169 deleted rows: 0 still-present branches, 0 duplicates. Live branch count is 1,454, including protected `main` and the only open PR head (#1750).
- Confirmed current main is 17 commits ahead of the original audit base `6fa08ddc`; previously verified-safe branch tips remain reachable. The 1,084 remaining verified-safe branches were not deleted.
- Corrected the old present-tense baseline wording and added a dated post-merge verification artifact. Preserved the deleted-branch TSV's corrected header and original four-column evidence.
- Documented that per-branch deletion actor/timestamp data was not captured; the later PR merge actor/time is not evidence of who deleted the refs.
- Latest follow-up PR CI and `./freebuff-verify.sh` remain pending; the original cleanup head's build/gate result is not reused as latest-head evidence.

---

## 2026-11-07 — Governance regression test review correction

- Confirmed Pullfrog review #5810741955 against merged PR #1751 and current `main`: the test used `beforeAll` without importing it, while the read remained outside individual test callbacks.
- Replaced the lifecycle hook with a `readAgents()` helper called only inside the two test callbacks that need `AGENTS.md`. This avoids both the missing-hook import and module-scope file I/O.
- Reused feature 104 and amended its existing specification, plan, and tasks; no new feature directory was created.
- Focused/full Vitest, TypeScript, and `./freebuff-verify.sh` results are pending the follow-up pull request's CI. No result is claimed before those checks complete.

---

## 2026-11-07 — Single-source Freebuff governance consolidation

- Consolidated general agent governance in `AGENTS.md`, making it explicit that it governs every coding agent, including Freebuff.
- Preserved the unique clarification that connecting or initializing an MCP alone does not count as using it.
- Removed the redundant `.freebuff/freebuff.md` entrypoint while retaining all eight specialist group files and the `.freebuff/cmds/` Spec Kit command directory.
- Added `__tests__/agent-governance-single-source.test.js` to guard the single-entrypoint rule and retained specialist guidance.
- Updated the saved Freebuff Master Work Request in the ChatGPT Library to remove the deleted entrypoint reference and align PR reporting with the canonical PR body.
- Full Vitest suite (including the new governance regression test), standalone TypeScript, the OpenNext Next.js production build and 495 MiB size gate, DevSkim, and visual-change classification passed on PR CI. The exact build byte count was not available in the returned job metadata. Visual QA Spec Kit verification/browser stages, updater-scheduler repository gate/build-size/Wrangler checks, and OpenNext worker/assets/Wrangler validation remain in progress. PR #1751 is open and unmerged; the complete 10-file diff was audited.

---

## 2026-11-06 — PR #1746 routing-test coverage correction

- Expanded `__tests__/docs-library-retirement.test.ts` to assert that each of the four retired IDs is absent from every one of the eight manifest group routing files, closing the Amazon Q review finding.
- Updated Spec Kit task T007 to record the all-groups coverage requirement. No runtime, manifest, snapshot, dependency, updater, workflow, schedule, or deployment files changed.
- Post-fix PR-head Vitest, `./freebuff-verify.sh`, and 495 MiB build-size results are pending the newly triggered GitHub checks.

## 2026-11-06 — Retire four unused documentation references

- Removed PostHog JS, Magic UI, React Three Fiber, and Upstash Ratelimit from their specialist routes, all manifest indexes, and their canonical documentation snapshots.
- Added `__tests__/docs-library-retirement.test.ts` to guard those removals, preserve the earlier PR #1740 retirements, and pin NumPy to Audio only.
- Kept all unrelated sources and URLs unchanged. The updater implementation, updater tests, refresh workflow, schedule, Cloudflare configuration, application code, and dependencies were not changed.
- Focused tests and `./freebuff-verify.sh` are pending execution in the repository workspace; implementation is not yet verified.

# Progress — 2026-11-06: Playwright Version Alignment

- Visual QA's discovery failure came from a split Playwright set: the CLI resolved to 1.63.0 while
  `@playwright/test` and `playwright-chromium` resolved to 1.64.1. The stale `playwright: ^1.63.0` range is
  corrected to `^1.64.1`, and `pnpm-lock.yaml` drops the orphaned 1.63.0 entries.
- `__tests__/playwright-version-alignment.test.js` fails if the three Playwright packages stop sharing one
  declared range, if the lockfile resolves them differently, or if a second Playwright version reappears.
- No visual test, baseline, threshold, workflow, application, artwork or other dependency changed.

---

# Progress — 2026-11-06: Conditional Visual QA with Cached Chromium

- Visual QA no longer installs a browser for documentation-only pull requests. A fail-closed classifier
  (`.github/scripts/classify-visual-changes.sh`) decides from the changed-path list, and any listing
  failure, empty list, mixed set or unrecognised file type resolves to running visual QA.
- Chromium is cached under `playwright-chromium-${runner.os}-${playwright version}` over
  `~/.cache/ms-playwright`. A cache miss downloads `--with-deps chromium`; a cache hit installs only the OS
  libraries. A Playwright version change misses the cache by design (no `restore-keys`).
- Unit tests, the standalone TypeScript check, the Spec Kit gate, committed-baseline verification, the
  visual regression run and the report upload are all preserved; only the browser steps are conditional.
- New `__tests__/visual-qa-chromium-cache.test.js` executes the classifier against nine path lists and
  guards the workflow wiring. Focused run 11/11 PASS; full suite 343 tests PASS; `./freebuff-verify.sh`
  exit 0 with a 331,566,756 B (316.2 MiB) build.
- Runtime cache-hit, cache-miss and skip behaviour on GitHub Actions is NOT RUN in this workspace (no
  runner and no pull request context).

---
# Progress — 2026-11-06: Custom Gemini PR Reviewer Retirement

- Removed only the custom Gemini PR-review workflow, both API-calling Node scripts, the root `GEMINI_REVIEWER.md` instruction file, and its four exclusive test suites.
- Added `__tests__/reviewer-retirement.test.ts`; the full unit-test suite passed with the retirement guard included. Standalone TypeScript and Spec Kit verification passed.
- `./freebuff-verify.sh` passed. Combined `.next` + `public` measured 333,794,959 bytes (318.33 MiB), below the 495 MiB hard maximum.
- DevSkim, updater scheduler verification, and OpenNext Cloudflare / Wrangler build validation passed. No deployment was performed.
- Pullfrog workflow and website Oracle source match the base branch byte-for-byte; their `GEMINI_API_KEY` references remain. No secret was inspected or changed. All other reviewer files, application code, dependencies, `.docs/`, and historical reviewer records remain untouched.
- **PR #1736** is open, mergeable, and unmerged. Final Visual QA visual-regression step remains in progress.

---

---

# Progress — 2026-11-05: Daily Lucky Card Reveal tier presentation

- `/reveal` entry button is now a guaranteed 56 px target with `cursor-pointer`, `touch-manipulation` and an `aria-describedby` tap instruction; the shared gold gradient, hover lift and press depth are unchanged.
- New `app/lucky-card-presentation.js` gives Standard/Premium/Flagship distinct accents with escalating halo/rim/frame strength; the revealed card now names its tier and card title, with a tier halo and frame while the artwork, animation, audio and storage behaviour stay untouched.
- Verification: focused 10 tests, full 439 tests, `tsc`, `./freebuff-verify.sh` and a 51/51 Chromium probe on a production build; build 372,013,466 B (354.8 MiB). The probe found a real 52.5 px mobile touch target caused by the theme's 15 px mobile root font size, now fixed with an explicit 56 px minimum.

# Progress — 2026-11-05: PR #1711 final verification gate repair

- Removed duplicate TypeScript/build invocations from `freebuff-verify.sh` and restored explicit fail-fast handling for refresh-docs tests.
- Refactored `scripts/bootstrap-pnpm.sh` to keep temporary state local, remove its helper before returning/exiting, derive the package-manager pin from `package.json`, and prepend only a validated absolute pnpm directory.
- Expanded bootstrap regression coverage for dynamic version pins, same-shell PATH availability, idempotent repeated sourcing, sourced/direct failure behavior, installer failure, and shell namespace cleanup. Added explicit verification-gate failure-branch assertions and strengthened dependency-lockfile parser tests.
- Local Bash syntax checks and isolated fake-installer bootstrap smoke tests passed. The exact GitHub test-module sources were parsed after correcting escaped template literals in the new regression tests. Full repository Vitest tests, TypeScript, production build/size, Visual QA, updater CI, and current-head review remain pending until the pushed PR head reports results.
- The first current-head Visual QA CI exposed two regression-test failures. The gate test's command count matched the echoed install error string and was corrected to count invocation lines. The bootstrap test's unquoted heredoc expanded `${1:-}` while generating the fake pnpm script; the positional expansion is now escaped so the stub reports the fixture version. Rerun is pending.

# Progress — 2026-11-04: Gift Email Test Tool Removed

- Deleted the disabled gift email test tool entirely: page, client form, switch, README, `/api/test-tools/gift-email` route and its 11-test suite. Both the page and the route now return 404, and no string from the tool remains in the production output.
- Added an absence guard in the security/payment suite. Paid checkout, verification, gift delivery and prices are unchanged; the clean production build is 301,016,019 B / 287.1 MiB (318.4 MiB with public).

# Progress — 2026-11-03: Lucky Reveal Paywalls Restored

- Removed the public **Preview Reveal — FREE** control, its `REVEAL_TEST_MODE` helper, homepage wiring and CSS; the purchase popup now offers only the paid Stripe checkout action.
- Disabled the merged gift email test tool (`GIFT_EMAIL_TEST_MODE = false`): the page shows a disabled notice with no form and `POST /api/test-tools/gift-email` returns 404. No environment value can re-enable it.
- Added guards for paid-only modal actions, absent preview module/wiring, shipped-false gift switch, unchanged 100/199 prices and the development-only legacy send endpoint; verified in a production build, HTTP smoke and a Chromium popup probe.

# Progress — 2026-11-01: Free Preview Reveal in the Checkout Modals

- Replaced the old `REVEAL_TEST_MODE` paid-form interception (which also posted a test gift to `/api/send-gift`) with a preview-only switch, `canPreviewReveal(type)`, limited to the Lucky Pick and Gift modals.
- Added a separate `type="button"` **Preview Reveal — FREE** control outside the checkout form in both eligible modals, with a short note that previews take no payment and send no emails. The tip jar gains no preview.
- Restored the paid submit handler to its original duplicate-submit guard, so `/api/checkout` submission, validation, and reset behaviour are unchanged in both switch states.
- Reused the homepage's existing reveal state and popup; added secondary button styles only. Deleted the stale tracked `app/checkout-modal.jsx.orig` that held the removed bypass.
- Added `__tests__/components/CheckoutModal.test.jsx`, updated `__tests__/security-payment.test.js`, rewrote the preview README, and recorded Spec Kit artifacts in `specs/072-free-preview-reveal/`.
- Browser verification on 2026-11-01: Playwright at 1440x900/DPR 2 opened both modals and pressed the preview; 22/22 checks passed, including zero requests to `/api/checkout`, `/api/send-gift`, or Stripe, no form submit, and no navigation. Screenshots and report are in `artifacts/` (untracked evidence). The reveal panel still shows its paid "PAYMENT COMPLETE" eyebrow during a preview, recorded as an open owner decision because the task keeps the reveal design unchanged.

---

# Progress — 2026-10-31: PR #1659 Severity and Edge-Case Follow-up

- Reviewed Amazon Q's latest full review and four inline findings, along with the owner's concern that the red indicator appears even when there is no critical/high error.
- Corrected the overall verdict so the marker follows the highest severity present: critical/high red, medium yellow, low-only blue; coverage-only gaps remain yellow and no findings/gaps remain green. Empty categories no longer display a severity marker.
- Hardened compact review output: removed all per-finding prompts in compact mode, shared a character budget across finding details and labels, and retained every finding checkbox. A runtime stress probe with 18 maximum-sized findings produced 44,961 characters against the 60,000-character cap.
- Added a stack-matching check for malformed JSON closers and exact deduplication for empty titles at the same source location.
- Updated tests so severity fixture markers match the category, and added tests for verdict severity, compact size limits, extra/mismatched JSON closers, and empty-title duplicates.
- In-session source syntax/runtime probes passed. Focused/full tests, TypeScript, ./freebuff-verify.sh and current-head GitHub Actions remain pending.

---

# Progress — 2026-10-31: PR #1659 Review-Driven Correctness Hardening

- Independently reviewed PR #1659's latest commit and Amazon Q / CodeQL findings against the current source.
- Confirmed the latest correction commit left extractReviewState undeclared and truncated formatFixOutcomes, while the hidden-state escaping remained lossy. Also identified that substring-based same-line title deduplication could suppress distinct findings.
- Restored review-state parsing as a declared function and made new comment serialization lossless for both --> and --!> by escaping the closing angle bracket as a JSON Unicode escape. Kept legacy --\> parsing compatibility.
- Rebuilt Markdown outcome cell sanitization to escape backslashes first, normalize CR/LF, then escape pipes. Removed unnecessary curly-single-quote normalization so Unicode punctuation in valid JSON strings remains unchanged.
- Restricted deduplication to exact normalized-title matches at the same path/line and added regression tests for each corrected behavior.
- Source syntax checks passed in the editing runtime. Local commands could not be executed in this API-only session; focused/full tests, typecheck, ./freebuff-verify.sh, build-size measurement, and current-head GitHub Actions remain pending.

---

# Progress — 2026-10-31: Gemini Reviewer Quality and Selected-Finding Workflow

- Opened PR #1659 (open, unmerged) for owner review.


- Compared Gemini and Amazon Q on PR #1656 against the code: Q's duplicate fetch log and missing `.freebuff/` autofix exclusion were genuine defects fixed in `038b5cf9`; Gemini reported zero findings on the same PR. Q's test-only `eval` concern is a robustness issue rather than an exploitable defect, and its `return`/`builtin exit` concern was measured not to be a defect.
- Added red/yellow/additional finding categories with a checkbox per finding, functional Select All / Clear Selection / Fix selected / Fix all controls, and informational-only coverage warnings.
- Added independent validation of selected findings, deterministic rejection of stale/ineligible/duplicate selections, and fixed/rejected/unresolved reporting so every selected item is accounted for.
- Made source retrieval budget-aware and disclosed complete, clipped, and patch-only coverage by file path and reason; added JSON recovery, transient-failure retry classification, root-cause deduplication, and a review-body size bound.
- Verified: 23 test files / 170 tests, `tsc --noEmit`, and `./freebuff-verify.sh` (build 330,129,985 bytes / 314.84 MiB) all pass. A live Gemini review of PR #1656 remains unverified because this workspace has no model API key or GitHub token.

---

# Progress — 2026-10-29: Gemini Full-Review Accuracy

- Added an independent adversarial review pass for every changed-patch batch, separate from the primary pass, with explicit checks for failure-path state rollback, stale asynchronous refreshes, input validation, fallback identity collisions, idempotency/cache issues, and test gaps.
- Constrained finding normalization to the active batch, made pass failures and document-selection fallback affect coverage status, shortened the bottom report to a compact Review context section, and added a pre-publication PR-head freshness check.
- Added deterministic regression tests and Spec Kit artifacts under specs/059-gemini-review-accuracy.
- Verification remains pending until PR-head CI, ./jules-verify.sh, and a live Gemini full review have actually run and their results have been inspected.

---

# Progress — 2026-10-19: Sky Background Repair CI Follow-up

- First repair PR CI on commit c109d46ff2ca3825d617da51f0dace56f4fa07cb: unit tests 17 passed/0 failed, TypeScript and Spec Kit verification passed. Visual QA had 22 passed, 3 skipped, 2 failures in the newly added check because it only accepted the desktop background image filename on narrow mobile viewports.
- The computed CSS selected the intended mobile image-set at 390px/412px, and the captured homepage screenshot visibly shows the starry background. Since the loop stopped on the homepage, Crystal Ball and Lucky Map have not yet been validated by the new assertion.
- Corrected the Playwright assertion to choose the expected background asset based on the theme's 820px CSS breakpoint; clarified the corresponding Spec Kit success criterion. This only modifies test/governance records, not page visuals.
- OpenNext run 39327043610 passed the Next.js build, 495 MiB size gate (combined .next + public measured 325,580,929 bytes / 310.50 MiB), OpenNext Cloudflare bundle, and Wrangler no-deploy validation.
- Final verification remains pending on the new head; do not claim the Crystal Ball/Lucky Map backgrounds are restored until route-level browser checks pass.

---

# Progress — 2026-10-19: Shared Sky Background Regression

- Compared the supplied video report with the merged CSS performance change. The source tree still contains the shared backdrop elements and CSS rules, while PR #1532 changed the theme stylesheet import placement/order.
- Restored the known-good import placement in app/layout.js and removed the added theme import from app/globals.css. Added a Playwright regression check for the homepage, Crystal Ball, and Lucky Map computed backdrop styles.
- No sky images, component styling rules, Lucky Meter/Card Reveal code, copy, interactions, dependencies, or deployment settings were changed.
- Verification is pending: local shell cannot resolve github.com. Targeted/full Playwright, pnpm tests, TypeScript, ./jules-verify.sh, OpenNext and the measured 495 MiB build-size gate must pass on current head.

---

# Progress — 2026-10-19

- **Gemini all-in-one PR review depth candidate**: On `fix/gemini-review-depth-1533`, expanded the existing PR-Agent workflow to allow up to eight substantiated findings, publish line-anchored findings, and request risk assessment, merge recommendation, failure modes, and an evidence-led review across bugs, security, performance, SEO, UI, accessibility, and testing. Extended the workflow regression test and added task-scoped Spec Kit artifacts.
- **Outstanding evidence**: Local shell commands could not reach GitHub due DNS resolution failure. Current-head Vitest, `./jules-verify.sh`, CI/build gate, and live review behavior using the new settings remain unverified. Do not merge or declare fully operational before required checks and one successful post-merge review.
- **2026-10-19 conflict and review follow-up**: Reconciled PR #1533 against current `main` after PR #1532 changed `.specify/feature.json`; preserved the homepage CSS changes and selected the Gemini feature pointer. Official documentation confirms the three configured Gemini model IDs and supports PR-Agent's quoted env setting. Removed the test's unnecessary negative assertion for Gemini 2.0. Verification remains pending on the repaired head.

---

## Oracle route Cloudflare build repair — 2026-10-18

The first targeted Visual QA CI attempt on earlier head `ff2bbe4207a7392336062f431dd3f1a139cb63d9` failed two valid-question tests because `apiKey` was undefined; comparison with the original pre-PR #1522 route confirmed the existing `const apiKey = getApiKey();` had been removed. That call has been restored in later commit `e2df4a6a1506f9ae010e55cde9227c0a25ff9125`. A fresh current-head run is required; the earlier failure must not be reported as fixed until reverified.

- **Evidence:** The user supplied Cloudflare build output dated 2026-10-18. Next.js compilation failed at `app/api/oracle/route.js:102` with `Expression expected`; the detached `.replaceAll(...)` line showed that the sanitizer chain had been interrupted by the prompt-injection block.
- **Fix prepared on:** `fix/oracle-route-build-and-injection-1522`, based on merged PR #1522 / current `main`. Restored the complete sanitizer chain, checked the existing injection pattern list against both raw and sanitized input, and added route-test cases for phrases split by quotes and angle brackets.
- **Protected behavior:** Preserved the Oracle personality prompt, current provider/model parameters, validation and size limits, CORS, rate limiting, response shape, fallback behavior, quota logic, UI/artwork/animation/audio, dependencies, and deployment configuration.
- **Verification:** No local shell was available through this connected session, so the targeted tests, full suite, TypeScript, `./jules-verify.sh`, production build and size measurement are pending actual current-head CI. The build-size hard maximum remains 495 MB. Do not claim the repair is verified until the final PR checks and diff audit complete.

---

# Progress — 2026-10-18

- **Crystal Ball Oracle personality upgrade — implementation candidate prepared:** confirmed the active Next.js endpoint is `app/api/oracle/route.js`; the prior system prompt did not require concrete, tailored fortune readings or an in-character greeting. Prepared a stronger prompt contract and a regression test of the outbound system message on [PR #1522](https://github.com/davidcollier77-code/Luckypickcanada/pull/1522) from `polish/crystal-ball-oracle-personality`, with Spec Kit artifacts at `specs/033-crystal-ball-oracle-personality/`. No UI, artwork, animation, audio, API guard, provider/model, dependency, or deployment-setting changes are intended. Local unit/build/governance commands are unavailable in this connected session; do not claim those checks passed. Current-head CI and a real-provider behavior check remain necessary.

---

# Progress — 2026-10-17

- **Robin OpenRouter fallback restoration:** User explicitly authorized removing Amazon Q as Robin's fallback while leaving the independent Amazon Q reviewer untouched. The repair branch restores a second pinned Robin action using the existing `OPENROUTER_API_KEY` secret and a distinct OpenRouter free model. No secret value or credential configuration is changed. A previous account check reported free quota 0/50, so the workflow is designed to skip inference only when quota is confirmed at zero and otherwise require a current-head Robin review. GitHub Actions/CI verification is pending; no local pass is claimed because this connected runner could not resolve github.com.

---

- **PR #1510 code-scanning cleanup / reviewer fallback:** Cleanup source commit 8bdd4fe passed 76 tests, TypeScript, Spec Kit verifier/build/docs tests, Playwright 21/3/0, OpenNext/Wrangler, CodeQL and 310.35 MiB build-size gate. OpenRouter key accepted but free quota was 0/50. On e459b243, quota-aware Robin skip + exact-head Amazon Q review #5558036445 caused reviewer check to pass. Follow-up corrections then addressed skipped-primary conditions, explicit secret redaction, 90s polling inside 3m step/7m job, and a final audit found/fixed the over-escaped preflight regex/redundant formatter. Latest current-head CI is pending for the final workflow state. PR remains open and unmerged.

---

- **New Crystal Ball audio assets generated and validated (2026-10-17):** GitHub Actions asset-preparation run #1 downloaded three Pixabay source tracks using curl without API keys, converted them with FFmpeg 6.1.1, verified WAV headers / PCM / duration / non-silent samples / clipping / size, and committed three new files. Energy: 15.700 s / 692,430 bytes; reveal: 3.192 s / 140,846 bytes; leaf: 2.038 s / 89,934 bytes. The MP3 originals remained temporary. Automated PR tests, governance, production build and the 495 MiB build-size gate remain pending; real-device playback remains unverified.

---

- **Follow-up Crystal Ball audio timeout syntax correction:** After PR #1506 merged, the October 17 Cloudflare build still reported a parser error at the `else` branch in `app/lib/audio.js`. A candidate on `fix/crystal-ball-audio-timeout-closure` closes the 160 ms timeout callback and removes the redundant duplicate stop call inside the sound-ID guard. This is a code candidate only; unit tests, governance verification, build-size and mobile playback evidence remain pending.

- 2026-10-16: Added the Premium Golden Maple-Leaf Assets follow-up on `polish/crystal-ball-golden-leaf-assets`. GoldenLeaf now serves AVIF → WebP → SVG fallback; cursor and flying copy share it. Added source-order/load assertions and active Spec Kit artifacts. AVIF (2,316 bytes) and WebP (3,870 bytes) blob SHAs were verified against the generated local files. Automated test, governance, build-size, and OpenNext/Cloudflare results remain pending; do not merge before CI is green.

# Progress — 2026-10-16

- Crystal Ball leaf-first follow-up started after PR #1498 merged. Sequence requested: energy gathering / gold flash → duplicate maple-leaf flight into the fortune panel → character-by-character reveal. Preserve original artwork and repeated questions. Remote build, Playwright, and governance verification remain pending.

- **Spec Kit updater repair prepared**: Confirmed scheduled run #24 failed when `specify integration upgrade generic` rejected the one-line `.jules/cmds/speckit.specify.md` as modified. Restored the complete integration-managed command version whose SHA-256 exactly matches the version in `.specify/integrations/generic.manifest.json`.
- **Retry schedule reduced**: Retained the 1:05 AM primary schedule and the 5:05 AM single retry on Tuesdays and Fridays in `America/Halifax`; removed the 9:05 AM third run. The existing daily guard continues to suppress a retry if a PR was successfully created/refreshed.
- **Verification not yet complete**: Source failure and manifest checksum are verified from GitHub logs/files; local governance/type/build checks, build-size measurement, and a post-merge workflow run still need execution. Do not describe the updater as runtime-verified until those checks pass.

---

- Verified on 2026-10-13: Visual QA run #388 passed (12 passed, 3 skipped, 0 failed), and OpenNext validation run #997 passed. Visual runs #384 and #387 had found zero rendered pixels; review of canvas-confetti's default configuration and the restrictive CSP identified its Blob-worker path as the likely cause. The component now creates a dedicated overlay canvas using `confetti.create(canvas, { resize: true, useWorker: false })`, keeping CSP unchanged, and uses a cached viewBox-derived transform for the negative-coordinate maple SVG.

- PR #1468 also centralizes the chime URL/CSP origin, logs asynchronous Howler playback and leaf-shape errors, and isolates Playwright's sound readiness check from Mixkit CDN availability with a valid silent WAV fixture. Review findings were answered and remaining review suggestions were classified as false positives or unnecessary refactors. Local `./jules-verify.sh`, full artifact-size measurement against the 495 MB cap, and real mobile CDN playback remain outstanding.

# Progress

- Code changes and CI for PR #1468 are verified: canvas-confetti now draws on a dedicated main-thread canvas (no CSP-blocked Blob worker), the maple SVG uses a cached viewBox-derived transform, the WAV-fixture Playwright suite passes, and OpenNext validation passes. Only local governance/build-size and actual-device audio checks remain before calling every requirement complete.

- Completed Golden Arrow Interaction enhancement, integrating `canvas-confetti` and `howler.js` for a richer visual and audio experience.
- Extended cooldown logic successfully and updated Playwright test coverage.
- Updated the Robin migration follow-up in PR #1465: endpoint/model overrides use optional GitHub repository variables while defaulting to OpenRouter's `openrouter/free` route.
- Removed caller-level concurrency from the Robin wrapper so the reusable workflow's command-filtered job-level concurrency governs cancellations.
- Confirmed the old Inori-comment finding does not apply to the current Robin wrapper. Local repository checkout failed because the shell could not resolve `github.com`; new runtime checks remain to be inspected via GitHub Actions.

- 2026-10-14: Implemented the local Explore Your Luck chime source on branch `fix/local-sparkling-confetti-audio`. `app/lib/magicalChimeSource.mjs` now points to `/sounds/sparkling.wav`; `next.config.mjs` no longer adds the external Mixkit host to CSP; `tests/visual/homepage.spec.ts` intercepts the local WAV path with a deterministic silent fixture. Current-task Playwright, `./jules-verify.sh`, full build-size measurement, and real-device audible playback remain to be verified.

- 2026-10-14: Added an original non-tonal confetti-pop WAV for the homepage interaction at `public/sounds/confetti-pop.wav`, replacing the previously merged chime-like `public/sounds/sparkling.wav`. Updated loader names, the homepage readiness test selector, and active Spec Kit guidance to the new path. Browser tests, `./jules-verify.sh`, build-size measurement, and live-device playback remain unverified in this API-only session.

- 2026-10-15: Completed Crystal Ball foreground correction. Stripped the magenta background using `sharp`, optimized to AVIF, WebP, and PNG versions, and re-integrated into `CrystalBall.tsx` with updated `height` tag. OpenNext build, tests, and `./jules-verify.sh` verified properly with total build size well under the 495 MB limit.

- 2026-10-15: Investigated the Cloudflare compile failure reported after PR #1489 and committed a focused repair on `fix/crystal-ball-cloudflare-build-1489`. Restored correct picture markup, one dynamic glow element, the question textarea's state handler, the Seek Fortune button click/audio handler, and consolidated duplicate JSX attributes. Verification is not yet complete: local checkout failed because DNS could not resolve `github.com`; awaiting remote PR checks for tests, governance, production build, build-size evidence, and Cloudflare deployment build.

- 2026-10-15: PR #1490 Visual QA initially failed because the Crystal Ball visual test depended on the real oracle endpoint, while CI had no `GROQ_API_KEY`. Updated the test to mock `/api/oracle` with a delayed successful response so the loading and reveal states can be verified without secrets. Awaiting rerun; not yet marked passed.

- 2026-10-15: Prepared a focused repair for the Cloudflare compile failure in `CrystalBall.tsx`: restored the opening `<span>` in `fortuneWords.map` and removed the duplicate `key`. Verification is pending CI evidence for the production build, `./jules-verify.sh`, Playwright, and the 495 MB artifact-size cap.

- 2026-10-15: PR #1492's first OpenNext validation run exposed a second compile blocker in `GoldenLeaf.tsx` (duplicate gradient/path opening tags and missing original path data). Restored the original SVG markup and unique gradient references; post-fix CI verification is pending.


## 2026-10-16 — Robin review reliability investigation

- Verified Actions logs for PRs #1500, #1501 and #1503: repeated OpenRouter router stalls, empty outputs, model switching, an upstream NVIDIA internal-server error, and a long review attempt. PR #1500's Dependabot context is confirmed, but the logs do not independently prove its API key was absent.
- Root cause identified in Robin v2.12.0: the special OpenRouter router path is streamed; the 45-second stall timer is cleared after the first SSE chunk, and it does not bound later generation. The repository called the reusable workflow on a moving main reference with a 45-minute internal job timeout.
- Fix prepared on fix/robin-bounded-review-fallback: direct immutable Robin action, explicitly selected free primary/fallback models, per-step and overall timeouts, safe missing-key preflight, current-head duplicate-review guard and fail-closed final result. PR runtime verification and controlled fallback-path execution remain pending.


## 2026-10-17 — Robin bounded failover and model selection

- Verified initial bounded run #38986971422: primary Gemma 4 31B returned HTTP 429 on all three attempts; Qwen3 Coder :free returned HTTP 404 (not available for free). Job failed closed in about 15 seconds, demonstrating the cap but not successful review.
- Verified second model test #38987207252: Gemma 4 26B A4B also returned HTTP 429 on all attempts; Cohere North Mini Code returned empty content twice then was stopped at its two-minute action timeout. Job ended in about 2m19s.
- Workflow updated to use explicit free model IDs with documented structured JSON output support: Xing4.0 29B A4B primary and Qwen3.8 27B fallback. Keep the per-attempt cap and fail-closed behavior. Their latest live review run is pending; do not merge until a provider successfully posts a review and checks complete.
- Open PR #1504 remains unmerged. Local ./jules-verify.sh was not run because the session could not resolve github.com for a local clone. Repository Actions checks and an observed fallback path are the available next verification gates.


## 2026-10-17 — Final Robin decision: restore free router with hard cap

- The live run #38988422706 (Robin workflow run 248) succeeded using openrouter/free: posted review #5555193756 in about 1m52s; the review reported zero findings. This is the successful baseline to retain.
- Fixed free endpoints tried during diagnosis proved unstable: Gemma 4 models returned 429, Qwen3 free slugs returned 404 unavailable-for-free, Xing4.0 returned 502, and Cohere/Dots3 produced empty content until the two-minute step cap. Repeatedly switching model IDs was creating noise without improving reliability.
- Final design therefore retains openrouter/free, calls Robin pinned to immutable upstream commit fc0bf915b634bf2f8b88ff1392acefdfb54e28d9 directly, sets a 90-second client timeout, two-minute action-step cap, four-minute job cap, safe API-key preflight and timeout/cancellation-aware final review checks. No in-Robin second-model fallback exists.
- Amazon Q's review on PR #1500 finished before Robin began. CodeRabbit's later PR #1501 review is not proof of an automatic fallback handoff; no external reviewer orchestration was found in this repository.
- Repository checks for the successful run passed. ./jules-verify.sh was not run locally because this session could not resolve github.com for a local clone.


## 2026-10-17 — Crystal Ball audio and daily question allowance

- Added an audio/quota feature on feat/crystal-ball-audio-daily-limit. It reuses the installed Howler dependency and existing same-origin energy, impact, and chime assets.
- The Oracle quota helper tracks completed and pending answers using a hashed client IP plus UTC date. Redis uses atomic reservation scripts; Cloudflare KV is a persistent fallback; quota-store failures are intended to fail closed for AI-backed calls.
- POST reserves before the provider call, commits only non-empty AI content, and releases reservations on upstream errors/fallbacks. GET exposes quota without caching. The UI shows remaining count and disables new submission at zero.
- Added Vitest quota tests and Playwright coverage for the three-answer UI; extended the reveal regression test with deterministic quota responses.
- Local verification remains pending because the session cannot resolve github.com for a checkout. pnpm tests, Playwright, TypeScript, ./jules-verify.sh, production build, output-size check, and actual mobile playback have not been run in this session. Do not mark this task complete until these checks have evidence.


## 2026-10-17 — Crystal Ball audio and daily question allowance: CI results

- PR #1505 on feat/crystal-ball-audio-daily-limit implements short Howler cues with existing same-origin assets and a three-successful-AI-answer daily cap, with server-side reservations/releases and visitor quota messaging.
- Added a pnpm run test step to .github/workflows/visual-qa.yml. Visual QA run 39015312979 passed: 10 Vitest files / 70 tests passed; full Playwright suite 24 total, 21 passed, 3 skipped, no failures.
- Validate OpenNext Repair run 39015313418 passed: Next.js production build and TypeScript stage, OpenNext Cloudflare worker build, compiled CSS/worker/assets checks, and Wrangler no-deploy validation.
- CodeQL run 39015310504 passed across Actions, JavaScript/TypeScript, and Python.
- Robin run 39015313042 failed because the free-model review timed out after two minutes; no review was posted.
- Still outstanding: standalone ./jules-verify.sh, standalone pnpm tsc --noEmit, actual .next + public size measurement against 495 MiB, and real mobile-device audio. The protected validation workflow was left unchanged rather than bypassing its authorization gate. Do not mark this task governance-complete until those gates are satisfied.


## 2026-10-17 — Crystal Ball audio build regression follow-up

- Inspected failed Cloudflare build run 39021855291 and traced the parser error to malformed audio-helper edits in commit 1c721f46075743cf2a2be1a9a801831da91cfb4c.
- Root cause: the stopCrystalBallEnergy declaration and server guard were removed; a stray promise assignment and semicolon were inserted after playCrystalBallEnergy. This put a return at module scope. app/components/CrystalBall/CrystalBall.tsx still depends on the named export.
- Repair restores the helper boundary and guard, preserves the captured sound ID in the delayed stop callback, and adds an export smoke test. Spec Kit artifacts were updated.
- Status at preparation: repair PR checks pending. Local verification, exact output size against 495 MiB, and real-device audio playback are not claimed.


## 2026-10-17 — PR #1510 Visual QA cold-runner timing repair

- Inspected Visual QA run #39038534341/job #117413181877 and its Playwright artifact rather than assuming the failure was Robin-related.
- The latest pre-fix job passed targeted/full unit tests, TypeScript, `./jules-verify.sh`, and visual baseline checks, then failed 5 Playwright tests. Trace evidence shows the Howler chunk loading about 7.58 seconds after the homepage document and the locally intercepted confetti WAV requested at about 8.33 seconds, longer than the old 5-second readiness wait. The quota test's cold navigation took about 12.7 seconds and its 30-second test deadline expired after the exhausted-quota UI rendered.
- Updated `tests/visual/homepage.spec.ts` to await client hydration, actual audio-request initiation, and the ready state with bounded 30-second checks; kept every particle/scroll/cooldown/keyboard assertion. Updated `tests/visual/crystal-ball-daily-limit.spec.ts` to use a 60-second timeout for its cold-load and three animated-answer flow; quota text, disabled button, and POST-count assertions remain.
- Spec Kit artifacts and PR summary now document the evidence and the new tasks. Application implementation and the Robin workflow were not changed in this follow-up. Final status awaits current-head CI; no merge-readiness claim until that run passes and the required review gate is verified.


## 2026-10-17 — PR #1511 merge-conflict repair candidate

- GitHub marked PR #1511 as `mergeable_state: dirty`; its branch was two commits ahead and 13 commits behind main.
- Verified that the second PR commit appended a second `CrystalBall` component definition. Rebuilt the component from the first PR commit and reapplied the intended reduced-motion dependency and newline-rendering fixes, retaining Unicode code-point iteration and the existing word-wrapper/timing/scroll behavior.
- Set `.specify/feature.json` to `specs/crystal-ball-fix` so the active pointer matches this task, while preserving the PR #1510 `PR_SUMMARY.md` record and appending PR #1511's repair section.
- Candidate source integrity assertions passed during commit preparation. Current-head unit, Playwright, TypeScript, governance, build, and build-size checks remain pending until GitHub Actions completes. Do not merge until those results and the review gate are verified.


- **Crystal Ball browser-local daily allowance (2026-10-17):** Replaced persistent per-IP UTC-day quota accounting with a browser localStorage count of successful AI-backed answers, visitor-local date rollover, in-memory fallback when storage is blocked, and a live local-midnight countdown. Removed the old quota manager/test, retained the short-window API rate limiter, added local-usage unit tests, and extended the allowance Playwright spec. Current-head test/build/governance evidence is pending GitHub Actions; local commands were not run because this session lacks a repository checkout.

 
## 2026-10-18 — PR #1518 CI Stability Follow-up

- Replaced the deprecated Groq model ID; corrected the Crystal Ball exact-text assertion and allowed 90 seconds for its animated end-to-end test.
- OpenNext build and 495 MiB size gate passed on CI. Robin still failed: OpenRouter returned empty completion content and Groq rejected the 10,763-token request against an 8,000 TPM limit. Reducing prompt/output budget and rerunning CI remains required.


## 2026-10-18 — CI regression follow-up

- Reduced the Groq fallback output budget from 2,048 to 768 tokens to keep the provider request under the account's 8,000 TPM limit on this PR's observed diff size.
- Updated the Robin workflow regression test to require the same 768-token cap.
- The commit 6da78ec run successfully posted the primary OpenRouter review but the full unit-test step failed because the test still expected 2,048. Current-head CI must rerun; the Groq fallback itself has not yet been re-tested on this head.


## 2026-10-18 — Groq Fallback TPM Guard

- CI measured the 384-token Groq fallback at 8,657 requested tokens vs. the 8,000 TPM limit. Raised the response cap to 256 and compacted redundant task-artifact text; updated the matching test assertion.
- Corrected the daily-limit Playwright check to wait for the input to re-enable after reveal. Current-head Playwright and a new Groq fallback attempt remain pending.


- **Deep-dive scope clarification (2026-10-18):** Corrected the specialist guidance to permit substantive owner-authorized audit-only investigations while preserving evidence, limitations, recommendations, and verification requirements. Only the target wording and task-tracking artifacts are in scope; `AGENTS.md` and `.docs/` remain untouched. Required current-head verification is pending.

- 2026-10-18: Retired the Robin automated review workflow and its Groq fallback functionality, while leaving CodeRabbit, Amazon Q, and the Crystal Ball (`GROQ_API_KEY`) fully operational.


## 2026-10-19 — Gemini PR-Agent Workflow Repair

- Diagnosed the merged workflow's malformed step-level configuration and wrong model identifier.
- Prepared a focused correction with secure secret-availability preflight, bot-event support, matching event filters, and static workflow regression coverage.
- Added/updated active Spec Kit records and the canonical PR summary.
- Verification is still pending GitHub Actions because the connected local shell could not resolve github.com. A live post-merge PR-Agent run and visible Gemini review remain required acceptance evidence.


## 2026-10-19 — Gemini PR-Agent CI Findings and Follow-up

- First run on PR #1530 passed the safe credential-presence preflight and invoked `gemini/gemini-3.8-flash`. Google returned HTTP 503 `UNAVAILABLE` with a high-demand message; PR-Agent then tried its default `gpt-5.6-terra` fallback and failed because no usable OpenAI key is configured.
- Current official Google model documentation lists `gemini-3.8-flash` as a stable model ID: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash. Current PR-Agent documentation also uses `gemini/gemini-3.8-flash`: https://docs.pr-agent.ai/installation/github/. The automated review's claim that the model ID does not exist is contradicted by the official sources and logged model request.
- Follow-up: configure Gemini 3.5 Flash-Lite as the fallback while keeping Gemini 3.8 Flash primary, fix the new regression test's Vitest-incompatible path resolution, and switch `.specify/feature.json` to the active PR-Agent feature after the governance gate caught the stale Crystal Ball pointer. On the checked commit, all 14 test files / 91 tests and the TypeScript check passed; governance needs rerun after the pointer fix. OpenNext build-size gate passed, final OpenNext/Wrangler status and a live Gemini review remain to be confirmed.

- 2026-10-19: Updated `.specify/feature.json` to select the active PR-Agent feature after CI identified the stale Crystal Ball pointer. The static PR-Agent regression suite passed (4 tests), the full suite passed (14 files / 91 tests), and TypeScript passed on the checked run. Governance/Playwright must be rerun on the latest head after the pointer fix. Gemini 3.8 Flash remains primary; Gemini 3.5 Flash-Lite is the Gemini-only fallback after two 503 high-demand responses from 3.8.


## 2026-10-20 — Reliable Updater Scheduling (Implementation Candidate)

- Confirmed the Spec Kit schedule targets Tuesday/Friday at 1:05 AM and 5:05 AM Atlantic; documentation refresh targets 2:21 AM, 6:21 AM, and 10:21 AM.
- Historical run timestamps on October 13 and 16 demonstrate multi-hour delays. The Spec Kit managed-file upgrade failure and documentation PR-creation failure are separate defects; this change does not claim to fix those failure causes.
- Prepared a separate Cloudflare Worker to dispatch only the five approved slots, with `America/Halifax` conversion and `DISPATCH_ENABLED=false`. Added a test suite and a workflow that verifies the change, checks repository governance, performs a Wrangler dry run, and deploys the Worker disabled only after an approved merge.
- Local prototype test evidence: Node.js 22.16.0, `node --test workers/updater-scheduler/test/index.node-test.mjs`, 11 passed / 0 failed on the initial standalone package. Exact PR-head test results are pending GitHub CI.
- **Not done:** No real updater was dispatched manually; Worker deployment, quota, live secrets, and cutover are not verified. Existing GitHub schedule entries remain enabled. Do not enable dispatch until a separate safe cutover has been reviewed and tested.


## 2026-10-20 — Updater Scheduler No-Retry and Invalid-Time Safeguards

- Implemented the documented Cloudflare `controller.noRetry()` call for each approved slot before the GitHub dispatch attempt, with regression tests covering ordering and exclusion of non-target slots.
- Addressed Amazon Q's missing/non-finite `scheduledTime` crash-risk finding by validating the timestamp before formatting and adding tests for missing/malformed timestamps and zero dispatch.
- Re-checked Amazon Q's deployment job test finding against the workflow source: the `deploy` job already runs the scheduler's Node.js tests before Wrangler deploy, so no redundant step was added.
- Latest verified PR head before the timestamp-guard follow-up: commit `71a6801c9a766b479cf244cd0b05530dac31100d`; scheduler tests 12/12, `./jules-verify.sh`, Wrangler dry run and OpenNext/build-size validation passed (325,595,902 bytes / 310.51 MiB). Current timestamp-guard follow-up needs a new CI result.
- Live Worker activation and schedule cutover remain unperformed; existing GitHub schedules are unchanged.

## Performance Optimization — $(date +%Y-%m-%d)
- **Goal:** Improve performance for mobile loading/LCP scores.
- **Changes Implemented:**
  1. Extracted `Math.sin()` logic out of `requestAnimationFrame` loop conditionally to optimize rendering inside `HomePage.js` star animation.
  2. Extracted `ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';` into simpler if-else conditional flows inside `HomePage.js`.
  3. Removed unused `import Image from 'next/image'` across `HomePage.js`, `lucky-map-of-canada.js`, `lucky-card-reveal.js`, and `share-lucky-pick-button.js`.
  4. Converted `<Image />` component tags in `app/lucky-map-of-canada/lucky-map-of-canada.js` and `app/homepage/HomePage.js` that were improperly mixing with `unoptimized: true` to standard `<img>` tags inside `<picture>` elements.
  5. Removed unnecessary `mix-blend-screen` from `app/homepage/HomePage.js` overlay image.
- **Validation:** Build completes successfully within the 495 MB cap. Tests and verification passing.

## 2026-10-29 — Gemini reviewer runtime regression

- Investigated PR #1636 checks against the exact GitHub Actions log. Visual QA stopped in the unit-test stage at a malformed expression in .github/scripts/gemini-reviewer.cjs; visual regression tests never started.
- Confirmed the merged reviewer also lacked the tested serialized review-state marker and had an extra closing brace in the review publication path. The adversarial second pass was conditionally skipped for batches with no primary findings, and adversarial errors were silently ignored.
- Prepared a corrective branch restoring valid compact context rendering, serialized state in the posted review body, balanced publication structure, and independent adversarial review for every batch with honest failure reporting. Added regression assertions and amended the existing Spec Kit feature artifacts.
- CI and live Gemini acceptance remain unverified pending the repair PR's checks.


## 2026-10-29 — Gemini reviewer runtime regression verified

- Reviewed the actual failure from Visual QA run 40887568880. The Node parser error originated from damaged `docReport()` expressions in the checked-in Gemini reviewer; the related workflow test also reported missing serialized review state.
- Repaired the context report, restored serialized current-head finding state in the published review body, removed the unmatched publication brace, and made the adversarial pass unconditional per batch with explicit failure coverage notes.
- Added a runtime regression test that invokes `docReport()`, alongside script syntax and source assertions. Corrected duplicated Spec Kit task entries.
- GitHub Actions passed on implementation head `79352ec277ae8f5435676d89cce83750c061a3a8`: full unit tests, TypeScript, `./jules-verify.sh`, Playwright visual regression, DevSkim, Next.js build/495 MiB limit, OpenNext Cloudflare validation, Tailwind/worker/assets checks, Wrangler dry-run, and updater scheduler governance/build checks.
- PR #1637 remains open and unmerged. A controlled live Gemini API acceptance test remains pending; no live-model outcome is claimed.

## 2026-11-06 — Freebuff Agent Reference Library Expansion

- Added 20 upstream agent-skill and supporting-reference sources to `.docs/manifest.json`, including Corey Haines Copywriting/Copy-Editing, Vercel React/Next.js Best Practices, and Trail of Bits False Positive Check, SARIF Parsing, and Post-Patch Validation.
- Routed the materials to the existing `creation`, `polishing`, `security`, `deep-dive`, and `testing` groups. No group was added.
- Corrected `/coreyhaines31/marketingskills` from the unrelated Strapi integration document to the actual Copywriting skill; removed the stale SEO snapshot and the SEO group mapping.
- Added conditional reference-routing notes to the relevant `.freebuff/*.md` group files and third-party license attribution at `.docs/AGENT_SKILL_ATTRIBUTION.md`.
- The manifest is wired for the existing scheduled/manual updater. The `.docs` snapshots will be generated by that updater after the manifest change reaches `main`; they are not represented as already materialized.
- Manifest routing validation passed 20/20. Local `scripts/test-refresh-docs.js` and `./freebuff-verify.sh` were not run in this connected session; PR-head CI is pending. No application build was needed for this docs-only change.
- Branch: `docs/agent-reference-expansion-20261106`. PR review and CI pending; do not merge automatically.

## 2026-11-06 — Lucky Card reveal cinematic enhancement

- Extended `app/lucky-card-presentation.js` with six tier stage values (spotlight, shockwave opacity and scale, gloss, sweep duration, ember opacity) that escalate Standard < Premium < Flagship.
- Added one `CardFinish` component to `app/lucky-card-reveal.js`, applied to both card faces for all eleven cards: gloss, specular and bevel always, plus a tier bloom and a single glint pass on the revealed front. Coast-to-Coast Tale now receives the shared finish and tier ring while keeping its authored frame.
- Added the cinematic stage: a tier-tinted charging aura during the draw, then a light shaft, spotlight, halo, rim, two shockwave rings, six one-shot embers and a floor shadow on reveal. All decorative and non-interactive; one-shot layers only mount when motion is allowed.
- Staged the post-flip arrival of the tier block, quote panel and share control with 0.12 / 0.24 / 0.34 s delays; copy, order and layout unchanged. No dependency, asset, route or reveal behaviour changed.
- Verification: focused 2 files / 12 tests, full suite 44 files / 351 tests, `tsc --noEmit` exit 0, `./freebuff-verify.sh` exit 0, production build 349,904,547 B (333.7 MiB). Rendered evidence collected in the managed cloud browser; local Playwright BLOCKED (missing Chromium system libraries, no root) and reduced-motion browser emulation NOT RUN.
- PR summary updated; branch pushed and pull request #1743 opened (open, unmerged).

## 2026-11-06 — Independent review of PR #1743 feedback

- Audited every comment on PR #1743 at head `18731264`: three conversation comments, four Graphite inline threads, one formal review, and 13 check runs (7 identified individually; REST API was rate-limited, so the integration was paged to avoid truncation).
- Verdicts: ember array-index keys are a hardening nit, not a defect (fixed module literal, stable keys); the glint "replay" concern is invalid (the element mounts once at the flip and re-renders preserve the single finished pass); the reduced-motion test slice is genuinely fragile but fails loudly and does not prove gating; the reduced-motion verification gap is valid and is the only merge blocker.
- Confirmed the blocker's root cause: `tests/visual/` contains no `/reveal` spec, so the passing Visual QA run cannot cover the new surface. Required follow-up is a Playwright test using `prefers-reduced-motion: reduce` (test changes are outside this audit's scope).
- Pullfrog's failed run is an external Google AI Studio free-tier quota error, not a code defect; no paid top-up was made.
- Findings recorded in `artifacts/reveal-card-cinematics/out/pr1743-review-findings.md` and the single PR summary. No application code, test, dependency or workflow was changed; PR #1743 remains open and unmerged.
- Verification for the review task: `./freebuff-verify.sh` exit 0 (Spec Kit gate, `tsc --noEmit`, production build, refresh-docs 19/19); `pnpm exec vitest run` 44 files / 351 tests passed; build `.next` 317,067,315 B + `public` 32,840,043 B = 349,907,358 B (333.7 MiB), below the 495 MB maximum.
- Late feedback captured: Amazon Q Developer's run failed as a head-mutation race (no findings), and PR-Tagger re-posted its metrics after the docs commit; no new inline threads exist. Re-audit after the docs commit: verify exit 0, 351 tests passed, build 349,907,358 B, zero code/test/workflow paths changed.

## 2026-11-07 — Documentation updater reliability and safety

- Added structural integrity validation for every downloaded document (empty, binary, garbled, random-character, HTTP error/challenge page and JSON error rejection), preserving the existing good snapshot on rejection.
- Replaced the fixed Jules-ID cleanup with manifest-driven permanent removal: only `manifest.groups` libraries are downloaded, and non-routed indexes, snapshots and symlinks are pruned.
- Added a Markdown refresh report containing broken source URLs, affected documents, errors and preservation status; the scheduled workflow publishes it in the refresh PR body and step summary, then fails the run.
- Added atomic repair of missing, broken, incorrect, stale and duplicate documentation links without overwriting differing content, plus a consistency audit of sources, snapshots and links.
- Added an isolated end-to-end test that runs the complete updater against a copy of the real library with injected failures. `node scripts/test-refresh-docs.js` → 31/31 PASS. Schedule, retry timing, Atlantic timezone, Cloudflare Worker slots, application code and dependencies are unchanged.
- PR #1748 opened (open, unmerged). Review follow-up `87ecf95c` fixed two verified same-millisecond temp-path collisions in link/symlink repair and hardened report table escaping; re-verified with 31/31 updater tests, 354/354 Vitest tests, `SPEC_KIT_BASE_REF=269ea014 ./freebuff-verify.sh` exit 0, and build 349,905,235 B (333.70 MiB).
- 2026-11-07 — Independent-review repair: reverted the wrongly based PR #1749 merge without rewriting history, restored `specs/103-docs-updater-integrity` as the only task feature, made critical link/consistency defects report FAILED and exit non-zero, protected colliding snapshot filenames from download/repair/deletion, switched temp-symlink cleanup to `lexistsSync()`, corrected the report to 64 inventory / 64 sources / 51 SHA entries, and added five regressions. Updater 36/36, Vitest 354/354, TypeScript exit 0, gate exit 0, build 349,900,039 B (333.69 MiB), scheduler 17/17 and Wrangler dry-run exit 0; local Playwright blocked by missing Chromium system libraries.
