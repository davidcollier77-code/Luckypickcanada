# Active Context — Unused Documentation Reference Retirement (2026-11-06)

- **Task groups:** `deep-dive` (evidence-based audit of the four source references) + `testing` (manifest, specialist routing, snapshot, and preservation regression checks).
- **Feature:** `specs/102-unused-reference-retirement`; branch `docs/retire-unused-library-references-20261106`.
- **Task:** retire PostHog JS, Magic UI, React Three Fiber, and Upstash Ratelimit from the documentation library. Current source searches found no project integration; matches were limited to the documentation snapshots, manifest, and specialist routing.
- **Preserved:** PR #1740's earlier removals (Pillow, Android Developers, Gemini CLI), general Chrome web-platform source, and NumPy routed only to Audio.
- **Scope:** no application code, dependencies, updater script/tests, refresh workflow, schedule, Cloudflare configuration, or deployment settings changed.
- **Status:** implementation edits committed to the task branch. Focused tests, full repository verification, final diff review, and PR-head CI remain pending.
- **PR:** to be opened against current `main`; leave open and unmerged.

---

# Active Context — Independent Review of PR #1743 Feedback (2026-11-06)

- **Task groups:** `deep-dive` (evidence-driven audit of review feedback) + `testing` (verification
  claims, coverage gaps, CI evidence). Audit only: no code, test, dependency, workflow or baseline
  change; PR #1743 stays open and unmerged.
- **Reviewed head:** `18731264126a0af4c5b91962392582040c2cc839`.
- **Feedback set:** 3 conversation comments (Pullfrog quota failure, 2 PR-Tagger analyses), 4 Graphite
  inline threads on one `COMMENTED` review, 13 check runs (7 identified individually).
- **Verdicts:** ember index keys — partially valid, no current defect (fixed module literal, stable
  keys); glint one-pass — invalid (re-renders preserve the finished pass; a key would risk a second);
  reduced-motion test slice — partially valid (fragile range containment, fails loudly, does not prove
  gating); reduced-motion unverified — **valid and the only merge blocker**, because `tests/visual/`
  has no `/reveal` spec at all and green Visual QA cannot cover it.
- **Bot/CI:** Pullfrog FAIL is an external Gemini free-tier quota error, not a code defect; Visual QA
  and DevSkim pass; updater-scheduler checks pass/skip; ~6 check runs not individually enumerated.
- **Evidence:** `artifacts/reveal-card-cinematics/out/pr1743-review-findings.md`; raw comment/review
  JSON walkthrough summarised there.
- **Outcome:** review recorded in the PR report; implementation status unchanged (COMPLETE), PR
  verification still PARTIAL with `USEFUL RESULT: NO` until reduced motion is proven in a browser.

---

# Active Context — Lucky Card Reveal Cinematic Enhancement (2026-11-06)

- **Task groups:** `polishing` (a protected visual surface was enhanced without changing its
  behaviour) + `testing` (executed tier contract, structural guard, full suite and rendered browser
  evidence). Branch `freebuff/4818369485c7528fe69e661a`; feature
  `specs/101-lucky-card-reveal-cinematics`.
- **Verified baseline:** the previous attempt, `specs/094-lucky-card-reveal-polish`, shipped a static
  tier halo/rim and one flat 118° sheen, excluded `coast-to-coast-tale` from the finish
  (`preserveCoastToCoastPolish`), never finished the card back, and had no light event or staged
  arrival at the flip.
- **Implementation:** `app/lucky-card-presentation.js` gains six tier stage values (spotlight,
  shockwave opacity/scale, gloss, sweep duration, ember opacity), all escalating Standard < Premium <
  Flagship. `app/lucky-card-reveal.js` gains one module-scope `CardFinish` component applied to both
  card faces (gloss, specular, bevel; tier bloom and one glint on the revealed front only), a
  tier-tinted charging aura during the draw, and a reveal stage of light shaft, spotlight, halo, rim,
  two shockwave rings, six one-shot embers and a floor shadow — all `aria-hidden` and
  `pointer-events-none`. Coast-to-Coast Tale now takes the shared finish and tier ring while keeping
  its authored frame. The tier block, quote panel and share control settle in with 0.12 / 0.24 /
  0.34 s delays. One-shot layers are mounted only when motion is allowed.
- **Preserved:** card data, weighting/anti-repeat, quote selection, daily lock, collection write,
  audio cues, all timing constants, canvas choreography, flip timings, artwork delivery, share,
  binder, countdown and Return to Home. No dependency, asset or route added.
- **Verification PASS:** focused 2 files / 12 tests; full `pnpm exec vitest run` 44 files / 351
  tests; `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0; production build
  349,904,547 B (333.7 MiB) < 495 MB.
- **Verification PARTIAL:** rendered checks ran in the managed cloud browser (local Chromium is
  unusable here — missing system libraries and no root; managed Playwright bridge returned an
  internal error). Three tiers, both card faces, all stage layers, staged arrival and
  Coast-to-Coast Tale passed. Reduced motion was NOT RUN in a browser and remains covered only by
  the structural guard. Recorded in
  `artifacts/reveal-card-cinematics/out/cloud-browser-report.json`.
- **Delivery:** pull request #1743 is open against `main` and unmerged; the final diff audit covered the
  fourteen changed files and no protected path.

---

# Active Context — Playwright Version Alignment (2026-11-06)

- **Task groups:** `troubleshooting` (the reported Visual QA discovery failure) + `testing` (Playwright
  discovery, the preserved visual suite, and the new executed alignment guard). Branch
  `fix/playwright-version-alignment-20261106`; feature `specs/100-playwright-version-alignment`.
- **Verified baseline:** `pnpm exec playwright --version` reported **1.63.0** while installed
  `@playwright/test` and `playwright-chromium` reported **1.64.1**; `pnpm exec playwright test --list`
  aborted with "Playwright Test did not expect test() to be called here." The stale direct range was
  `playwright: ^1.63.0` in `package.json`.
- **Implementation:** the `playwright` devDependency is now `^1.64.1`; `pnpm-lock.yaml` rewrites only the
  root importer entry and removes the orphaned `playwright@1.63.0` / `playwright-core@1.63.0` package and
  snapshot entries. New `__tests__/playwright-version-alignment.test.js` guards one shared declared range,
  one shared lockfile resolution for `playwright`, `@playwright/test` and `playwright-chromium`, and no
  second Playwright version in the lockfile snapshots.
- **Preserved:** `playwright.config.ts`, `tests/visual/**`, every committed baseline, diff thresholds, the
  three Chromium projects, `.github/workflows/visual-qa.yml`, application code, artwork, and every other
  dependency.
- **Isolation:** the failing pull request is untouched; this correction ships on a separate branch and PR.

---

# Active Context — Documentation Library and Routing Cleanup (2026-11-06)

- **Task groups:** `deep-dive` (evidence-driven audit of the reference library and group assignments)
  + `testing` (the affected regression assertion and executed verification).
  Branch `freebuff/cf8f9386a7381a2d31381dd8`; feature `specs/099-docs-library-routing-cleanup`.
- **Verified baseline:** 71 routed identifiers in 8 groups, no orphans, missing snapshots or broken
  symlinks. Pillow is unused (no `PIL`/`Image.open`/`import PIL`; `setup-media-tools.sh` installs only
  vosk/soundfile/numpy). NumPy is imported by `scripts/inspect-media.py` and installed by
  `scripts/setup-media-tools.sh` for audio. The Chrome Developer snapshot was the Chrome Extensions
  **Offscreen API** page. PR #1738 (scheduled docs refresh) is **merged** at `743a1ce8` (`476e4f43`),
  so it is the task baseline, not an open conflict.
- **Implementation:** removed `/python-pillow/Pillow`, `/android/developers` and
  `/google-gemini/gemini-cli` from every manifest section and deleted their snapshots/symlinks; moved
  `/numpy/numpy` from `polishing` to `audio` (manifest, `.freebuff` routing, snapshot); repointed
  `/websites/developer_chrome` off the Offscreen page to `https://developer.chrome.com/docs/web-platform`
  and replaced its snapshot; deleted the three specialist Gemini CLI sections; updated
  `__tests__/reviewer-retirement.test.ts` to assert the retained Gemini API snapshot instead.
- **Preserved:** Gemini API docs and all Gemini/Oracle/reviewer code, Debian Reference, PostHog JS,
  Magic UI, `scripts/refresh-docs.js`, `scripts/test-refresh-docs.js` and the refresh workflow,
  application code, assets, dependencies, payments/email/database/security and deployment.
- **Verification PASS:** manifest audit 68/68/68 with 0 orphans/missing/broken symlinks; focused 4 tests;
  full `pnpm exec vitest run` 43 files / 343 tests; `tsc --noEmit` exit 0; refresh-docs 19/19;
  `SPEC_KIT_BASE_REF=743a1ce8 ./freebuff-verify.sh` exit 0; build `.next` 299,056,298 B + `public`
  32,840,043 B = 331,896,341 B (316.52 MiB) < 495 MB; no protected path in the diff.
- **PR:** **#1740** open and unmerged, with `PR_SUMMARY.md` published as its body.
- **Verification PENDING:** PR-head CI. Browser/visual checks NOT RUN (no UI change). `lastUpdated`
  intentionally left to the updater.

---

# Active Context — Conditional Visual QA with Cached Chromium (2026-11-06)

- **Task groups:** `troubleshooting` (CI workflow behaviour that wasted runner time on every pull request)
  + `testing` (the visual QA workflow, its preserved checks, and the new executed classifier guard).
  Branch `freebuff/474320d3cde04a21a6a32a0f`; feature `specs/098-visual-qa-chromium-cache`.
- **Verified baseline:** `.github/workflows/visual-qa.yml` installed Chromium unconditionally
  (`pnpm exec playwright install --with-deps chromium`) on every pull request, including documentation-only
  ones, and had no browser cache. Installed Playwright is 1.63.0 (`playwright` and `@playwright/test`), and
  all three Playwright projects use Chromium.
- **Implementation:** new `.github/scripts/classify-visual-changes.sh` turns a changed-path list into
  `visual_required=true|false` and fails closed (empty input, unknown file types and mixed sets all request
  visual QA). The workflow gains a `changes` job that lists pull request files with `gh api` and writes
  `visual_required=true` on any listing, classification or value error, plus a cache keyed
  `playwright-chromium-${runner.os}-${playwright version}` over `~/.cache/ms-playwright` with no
  `restore-keys`. A cache miss installs `--with-deps chromium`; a cache hit installs only
  `install-deps chromium`. Baseline verification and the visual regression run are gated on the classifier.
  Unit tests, TypeScript, the Spec Kit gate and the report upload remain ungated.
- **Preserved:** `playwright.config.ts`, `tests/visual/**`, committed baselines, diff thresholds, the three
  Chromium projects, concurrency, `fetch-depth: 0`, and the forwarded `SPEC_KIT_PR_AUTHOR`.
- **Verification PASS:** focused classifier/wiring guard 1 file / 11 tests; full `pnpm exec vitest run`
  43 files / 343 tests; `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0; production build
  `.next` 298,726,713 B + `public` 32,840,043 B = 331,566,756 B (316.2 MiB) < 495 MB.
- **Verification NOT RUN:** GitHub Actions runtime behaviour for the skip, cache-hit, cache-miss and
  Playwright version-change paths. No runner or pull request context exists in this workspace, so the
  workflow cannot be executed here; those paths are static-wiring plus executed-classifier evidence only.

---
# Active Context — Custom Gemini PR Reviewer Retirement (2026-11-06)

- **Task groups:** `troubleshooting` + `testing`; branch `chore/retire-custom-gemini-reviewer-20261106`; feature `specs/097-gemini-reviewer-retirement`.
- **Scope:** Remove only the separate custom Gemini PR-review workflow, its two Node.js scripts, root instruction file, and four exclusive test suites. Add a retirement regression test.
- **Preserved:** Pullfrog workflow and its `GEMINI_API_KEY` reference; site Oracle source and its `env.GEMINI_API_KEY` runtime reference; all other reviewer files; shared secrets and environment configuration; application code, dependencies, deployment settings, `.docs/`, and historical Gemini / PR-Agent Spec Kit records.
- **Implementation:** The active reviewer entrypoints and all four exclusive suites are removed. PR #1736 is open, mergeable, and unmerged.
- **Verification PASS:** Full unit test suite (including the retirement regression guard), standalone TypeScript check, Spec Kit verification, `./freebuff-verify.sh`, DevSkim, updater scheduler verification, and OpenNext Cloudflare build / Wrangler validation. Build size measured at 333,794,959 bytes (318.33 MiB), below 495 MiB.
- **Verification PENDING:** The final Playwright visual-regression step in Visual QA is still running. No deployment was performed.

---

---

# Active Context — Freebuff Agent Reference Library Expansion (2026-11-06)

- **Task groups:** `creation`, `polishing`, `security`, `deep-dive`, and `testing`; branch `docs/agent-reference-expansion-20261106`; feature `specs/096-agent-reference-library-expansion`.
- **Scope:** Add agent-oriented marketing copywriting/copy-editing, React/Next.js best-practices, security finding validation, SARIF processing, and post-patch validation references to existing Freebuff groups. No new task group or application behavior change.
- **Updater routing:** `.docs/manifest.json` contains 20 source IDs with raw upstream URLs, group mappings, inventory entries, and upstream repository commit SHA pins. The existing `refresh-docs.yml` workflow materializes `.docs` snapshots on its next scheduled/manual run after the manifest change reaches `main`.
- **Licensing:** Corey Haines Marketing Skills is MIT; the Vercel skill declares MIT; Trail of Bits references are CC BY-SA 4.0 and are attributed in `.docs/AGENT_SKILL_ATTRIBUTION.md`.
- **Verification:** Manifest routing assertions passed 20/20 during commit preparation. Repository test suite and `./freebuff-verify.sh` have not been run in this connected session; PR-head CI remains pending. This is a documentation-only change, so no application build was run.
- **Preserved:** Live site copy, application code, visuals, UX, functionality, dependencies, payment/email/database systems, updater script and workflow are unchanged. The unrelated Strapi snapshot was removed from the SEO route.

---

# Active Context — DevSkim Alerts Report Resolution (2026-11-06)

- **Task groups:** `security` + `testing`; branch `freebuff/c9e5ec63a91aa6449065899b`; feature
  `specs/095-devskim-alerts-resolution` (broader than 037/082, which covered one alert batch and one
  DS172411 family).
- **Verified baseline:** `devskim-alerts.md` held 164 entries: 37 DS173237 `.docs/manifest.json`
  `githubShas`, 107 DS162092 loopback URLs in `artifacts/` probe JSON, 1 DS162092
  `playwright.config.ts:31`, 17 DS172411 timer notices, and 2 DS137138 test URLs whose files no longer
  exist. A local DevSkim CLI 1.0.100 scan of the current tree (dependency/build dirs excluded because CI
  has no `node_modules`) left 109 results after the existing production filter: the 108 loopback notices
  plus `app/share-lucky-pick-button.js:280`.
- **Implementation:** the audited SARIF filter gains one DS162092 predicate for reviewed local origins
  (exact Playwright `webServer.command`/`url` lines; `artifacts/**/*.json` only when the file parses as
  JSON and the reported span sits inside a JSON string URL whose host is loopback) and one exact
  DS172411 statement (`window.setTimeout(() => URL.revokeObjectURL(url), 1000)`). Positive and negative
  tests were added, the replay gate lists the new reviewed families, and `devskim-alerts.md` is now
  header plus append marker with no entries.
- **Verification:** 78 suppression unit tests PASS; the real-SARIF replay removes all eight audited
  families and leaves no suppressible result; the filtered local scan leaves **0** results; the append
  script adds `new_count=0` to the cleared report; `pnpm exec vitest run` 439 tests PASS;
  `./freebuff-verify.sh` exit 0; production build `.next` 298,718,394 B + `public` 32,840,043 B =
  331,558,437 B (316.20 MiB) < 495 MB. PR #1726 is open and unmerged; PR-head CI is PENDING. No
  application source, `.docs/`, workflow, dependency, secret, or scan-glob change.

---

# Active Context — Daily Lucky Card Reveal Tier Presentation (2026-11-05)

- **Task groups:** `polishing` + `testing`; branch `polish/reveal-card-tier-experience-20261105`; feature
  `specs/094-lucky-card-reveal-polish` (no earlier feature covers the daily card reveal page: 075/078/081
  are the paid reveal popup, 064/069 are sitewide CTA and page polish).
- **Verified baseline:** `/reveal` renders `app/lucky-card-reveal.js`, whose single entry button had no
  explicit touch height, no `cursor-pointer`, no instruction, and whose revealed result never named the
  tier or the card. `themes/default/default.css` sets `html { font-size: 15px }` on mobile, so rem-based
  minimum heights resolve to 52.5 px.
- **Implementation:** new `app/lucky-card-presentation.js` holds the three tier palettes (bronze
  `#e09440`, pewter `#c8ccd0`, gold `#daa520` — the colours the reveal canvas already paints) with
  escalating halo/rim/frame values and a Standard fallback. The component gains a 56 px
  (`style={{ minHeight: 56 }}`) full-width/phone and content-width/desktop entry button with
  `cursor-pointer`, `touch-manipulation` and an `aria-describedby` tap instruction; after the reveal it
  shows a tier chip, the card title and a collection caption, adds an `aria-hidden`
  `pointer-events-none` tier halo/rim, and a tier-tinted inner ring outside the `coast-to-coast-tale`
  frame exception. Artwork, data, weighting, localStorage, `TIER_HITS`, flip timings, audio cues, share,
  collection binder and Return to Home are unchanged.
- **Verification:** focused 3 files / 10 tests PASS; full `pnpm exec vitest run` 45 files / 439 tests PASS;
  `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0; production build 372,013,466 B
  (354.8 MiB, earlier build 331,568,750 B / 316.2 MiB) < 495 MB; Chromium probe
  `artifacts/reveal-card-polish/probe.cjs` against `next start` 51/51 PASS (56 px entry target, hover
  −2 px / press +2 px, exact accessible name, three tier chips/accents/halos, unchanged WebP fallback,
  0 px overflow, 0 console errors, reduced-motion halo static).
- **Not verified:** PR-head CI, physical iOS/Android, audible playback, and a full re-audit of the
  cinematic sequence. A component render test is impossible in Vitest because the component is JSX in a
  `.js` file; the tier values are executed in a unit test, the markup contract is a structural guard plus
  the browser probe.

---

# Active Context — About Page Return to Home Gold CTA (2026-11-05)

- **Task groups:** `polishing` + `testing`; branch `polish/about-home-gold-cta-20261105`; feature `specs/093-about-home-gold-cta`.
- **Scope:** Update only the existing Return to Home link on `/about` to reuse the global `.gold-3d-btn` and `.gold-cta-emoji` treatment. Preserve its `href="/"`, visible label, wrapper, width, and placement. Update the existing sitewide gold CTA browser assertion to verify the gold gradient/raised edge and unchanged accessible navigation.
- **Spec Kit:** Specify → Plan → Tasks → Implement; artifacts are in `specs/093-about-home-gold-cta/`, with `.specify/feature.json` pointing to the feature.
- **Verification:** Code and test changes are prepared on this branch. Local Playwright and `./freebuff-verify.sh` execution are pending; this connected session could not clone the repository because its shell environment could not resolve `github.com`. No local test, build, or build-size pass is claimed. PR CI is the remaining verification path.
- **Preserved:** No global styles, other buttons, page copy, routes, application behavior, dependencies, payments, data, authentication, deployment settings, or secrets were changed.

---

# Active Context — Dependabot CI fixture isolation follow-up (2026-11-05)

- **Trigger:** PR #1716 Visual QA run 42016557516 passed install, unit tests and TypeScript, then failed the Spec Kit verifier regression suite. The workflow correctly exported `SPEC_KIT_PR_AUTHOR=dependabot[bot]`; the test helper did not clear that inherited trusted value, so the synthetic no-author fixture accidentally qualified for the exemption.
- **Repair branch:** `fix/spec-kit-dependabot-test-isolation-20261105`; feature reused: `specs/092-dependabot-speckit-exemption`.
- **Planned scope:** isolate `SPEC_KIT_PR_AUTHOR` in `scripts/test-verify-speckit-task.sh`, and simulate the Dependabot workflow environment in that suite. Keep the production verifier, workflow author forwarding, allowed dependency paths, commit provenance rules, package versions, lockfile, and app unchanged.
- **Verification:** target the exact failure with `SPEC_KIT_PR_AUTHOR=dependabot[bot] bash scripts/test-verify-speckit-task.sh`; then run the repository gate and current-head CI where available. PR #1716 stays on its original Dependabot-only branch so its provenance remains valid. No PR is merged by this workflow.
- **Status:** Spec, plan and tasks follow-up recorded; implementation and verification pending.

---

# Active Context — Dependabot Spec Kit governance exemption (2026-11-05)

- **Task groups:** `troubleshooting` + `testing` + `security`; branch
  `fix/dependabot-speckit-governance-exemption`; feature `specs/092-dependabot-speckit-exemption`.
- **Verified failure:** six Dependabot PRs (#1712–#1717) stopped in `scripts/verify-speckit-task.sh` with
  "no changed task feature artifacts were found", so `freebuff-verify.sh` ended the job before Playwright
  installation, committed-baseline verification, visual regression, the build-size ceiling and the Wrangler
  dry run. Visual regression is **not** passing on those PRs; it never ran.
- **Verified change sets:** #1712 (github_actions) changes only `.github/workflows/deploy-updater-scheduler.yml`
  and `.github/workflows/update-spec-kit.yml`; #1713–#1717 (npm) change only `package.json` and
  `pnpm-lock.yaml`. Each is one commit authored by
  `dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>` and committed by
  `GitHub <noreply@github.com>`.
- **Root cause:** the gate treats "no `specs/<feature>/` artifact directory changed" as a task-governance
  failure, with no concept of dependency-maintenance scope.
- **Implementation:** one predicate (`dependabot_maintenance_exemption`) inside the existing verifier, consulted
  only where the artifact requirement would fail. It requires all of: the workflow-supplied
  `SPEC_KIT_PR_AUTHOR` equals `dependabot[bot]`; a comparison base resolves; the committed `BASE...HEAD` change
  set is non-empty and every path is `package.json`, `pnpm-lock.yaml` or a one-level
  `.github/workflows/*.yml|yaml`; and every commit is Dependabot-authored and GitHub-committed. Scope uses the
  committed diff, not worktree state, because the updater workflow dirties the checkout before the gate.
  `visual-qa.yml` and the updater-scheduler `verify` job now forward
  `github.event.pull_request.user.login` as `SPEC_KIT_PR_AUTHOR`. No check was removed, skipped or weakened.
- **Tests:** `bash scripts/test-verify-speckit-task.sh` → 23/23 PASS, including npm and Actions maintenance
  fixtures plus rejections for a human author, missing author signal, application/script/documentation mixes,
  nested workflow path, incomplete artifacts, a hand-authored commit and a missing base; it also asserts both
  workflows forward the author.
- **Preserved:** no dependency version, lockfile, application, visual, payment, email, database, secret,
  scheduler or deployment change. `AGENTS.md`, `.docs/` and PRs #1712–#1717 are untouched.
- **Pending:** `./freebuff-verify.sh`, full Vitest, the measured build size against the 495 MiB cap, and
  PR-head CI evidence that the six PRs now pass governance and execute their remaining steps.

---

# Active Context — PR #1711 final review-driven verification repair (2026-11-05)

- **PR / branch:** #1711 remains open and unmerged on `freebuff/e1fafb4e1fc110d0b8a4c277`. The pre-repair head was `02ccb20c19b437645de8d4a04400799f49e9cceb`.
- **Confirmed defects:** duplicate TypeScript and build invocations in `freebuff-verify.sh`; an empty refresh-docs failure handler; an unsafe duplicate PATH export; and bootstrap helper/status namespace leakage. Review comments also identified inadequate tests for dynamic manifest pins and PATH availability, plus idempotent repeated sourcing and a missing assertion that failure branches contain explicit exits.
- **Repair scope:** `freebuff-verify.sh`, `scripts/bootstrap-pnpm.sh`, `__tests__/bootstrap-pnpm.test.js`, `__tests__/dependency-management.test.js`, a new `__tests__/freebuff-verify.test.js`, and the existing `specs/091-freebuff-startup-command/` plus memory records.
- **Implementation choices:** execute each required gate step once and stop on failure; use one local-state bootstrap function that is removed before returning/exiting; reject relative pnpm paths; make PATH insertion idempotent; derive test installer expectations from each fixture manifest; prove same-shell PATH availability and cleanup; give lockfile parse failures explicit errors.
- **Local checks performed in this connected session:** `bash -n` on both modified shell scripts; isolated fake-npm shell smoke tests for a non-default version pin, same-shell pnpm invocation, invalid-pin rejection, direct failure, sourced caller survival, and installer failure. The exact test-module sources were subsequently parsed successfully after correcting escaped template literals in the bootstrap/dependency guard test files. The actual Vitest suites remain pending.
- **First full current-head CI run:** the full unit suite completed with 430 passed / 2 failed / 432 total. One failure was the bootstrap fixture's unquoted heredoc expanding `${1:-}` while it generated the fake pnpm executable, so `pnpm --version` returned empty; the other was a broad invocation count that also matched the echoed install error text. The invocation-count assertion is corrected; the bootstrap test now escapes the positional parameter through the heredoc. Current-head rerun is pending.
- **Not yet verified after latest correction:** repository Vitest suites, TypeScript, `./freebuff-verify.sh`, measured production build size, full Playwright Visual QA, updater-scheduler CI, and current-head review status. A local clone could not be obtained because this runtime could not resolve `github.com`; push-triggered PR CI is the authoritative next verification.
- **Preserved:** no package or lockfile changes, app/runtime behavior, homepage artwork, AVIF/WebP delivery, payments, email, database, secrets, deployment, or scheduler configuration were changed. The 495 MiB build-size cap remains mandatory.

---

# Active Context — PR #1711 desktop Visual QA diagnosis (2026-11-04)

- **PR head:** `1db23df4a13a2eda43c84f053a5173e73c60e4db`; PR #1711 remains open and unmerged.
- **Visual QA run:** GitHub Actions run 41929634018 failed only at `tests/visual/homepage.spec.ts:88` desktop homepage screenshot. 89 visual tests passed and 3 were skipped; targeted tests, full Vitest, TypeScript, Spec Kit governance and committed baseline presence all passed.
- **Root cause:** the checked-in desktop baseline `tests/visual/__screenshots__/desktop/homepage-viewport.png` was last updated 2026-10-23, before the already-merged 2026-11-04 PR #1709 navigation consolidation. The new approved navigation uses one row instead of the old two-row link list, changing vertical hero placement. CI's actual desktop screenshot is stable and mobile-390/mobile-412 baseline comparisons both pass.
- **Required repair:** update only the desktop screenshot baseline from the deterministic current-page capture; preserve `maxDiffPixelRatio: 0.007`; do not mask the navigation/artwork or widen the threshold.
- **Separate warning:** `app/lucky-map-of-canada/lucky-map-of-canada.js` placed a bare `priority` prop on a native HTML `<img>`. Remove only that prop; preserve `loading="eager"`, `fetchPriority="high"`, and AVIF/WebP/PNG source order. Add a source guard.
- **Other current checks:** updater verification (run 41929633866) passed, including repository gate, 495 MiB cap (320.59 MiB), and Wrangler dry-run. OpenNext validation (41929633617) and DevSkim (41929633665) passed. No production Worker deployment ran.
- **Status:** implementation follow-up is underway; desktop screenshot baseline refresh and Visual QA rerun remain pending. No passing full Visual QA claim is made.

---

# Active Context — PR #1711 QA and updater-scheduler repair (2026-11-04)

- **Head inspected:** `490ea28bd2912c8042af5e3e09cbdd026b06575a`; PR #1711 was open and unmerged.
- **Live CI evidence:** Visual QA failed because `__tests__/dependency-management.test.js` could not parse (unterminated string at line 72); 39 other test files and 414 tests passed before suite termination. Updater-scheduler verification passed its 17 scheduler tests and Spec Kit customization rebase tests, then failed because `./freebuff-verify.sh` was not executable (exit 126). The scheduler deploy job was skipped on the PR event as intended.
- **Dependabot configuration:** `.github/dependabot.yml` already contains weekly `npm` and `github-actions` entries at `/`; it is intentionally unchanged by this repair. Future Dependabot PR creation is not proven by static configuration alone.
- **Repair scope:** fix the malformed dependency guard, match lockfile importer keys exactly, parse Dependabot blocks using the existing text source, return bootstrap failures safely when sourced (exit when executed), add isolated shell regression tests, and set both directly-run shell scripts executable in Git.
- **Preserve:** pnpm 10.30.3 and `pnpm-lock.yaml` as the sole package-manager/lockfile policy. Do not add `bun.lock`, alter the Freebuff platform startup command, change dependency versions, update scheduler activation/secrets, deploy the Worker, or touch application visuals/functionality.
- **Verification before repair:** the focused tests, full suite, typecheck, repository gate, Visual QA, and updater-scheduler workflow were not all passing on the inspected head. Previous reported passes predate this broken head and are not evidence for this repair.

---
# Active Context — Freebuff Startup Command and pnpm Dependency Management (2026-11-04)

- **Task groups:** `troubleshooting` + `testing` + `security`; branch `freebuff/e1fafb4e1fc110d0b8a4c277`;
  new feature `specs/091-freebuff-startup-command`. The worktree was clean at `037395d8`, so the request's
  "pre-existing" `bun.lock`, `package.json` change and `specs/091-*` were absent here; nothing unrelated was
  overwritten.
- **Verified baseline:** pnpm 10.30.3 with `pnpm install --frozen-lockfile` exit 0 (a global pnpm in this image
  needs `--prefix "$HOME/.local"`); `react`/`react-dom` were `latest` while the lockfile resolved 19.3.1; the
  lockfile `overrides:` block listed only the 13 `pnpm.overrides` entries and no `postcss`, proving the
  top-level `overrides.postcss ^8.5.10` was ignored; `.github/dependabot.yml` had only weekly
  `github-actions`; the gate ran `pnpm tsc` (binary fallback) and assumed pnpm plus node_modules existed.
- **Implementation:** `scripts/bootstrap-pnpm.sh` provisions the `packageManager` pin (PATH, `$HOME/.local/bin`,
  then `npm i -g pnpm@10.30.3 --prefix "$HOME/.local"`) and fails closed on a missing or non-exact pin;
  `freebuff-verify.sh` sources it, runs `pnpm install --frozen-lockfile`, `cd`s to the repo root and calls
  `pnpm exec tsc --noEmit`. React/React DOM are pinned to the installed 19.3.1, `postcss ^8.5.10` moved into
  `pnpm.overrides` (no top-level list remains), Dependabot gained a weekly `npm` entry beside `github-actions`,
  and `__tests__/dependency-management.test.js` guards all four properties. A fail-closed bug found by test:
  `return 1` in the helper only ended the function and let an unpinned `npm install -g "pnpm@"` run; it now
  `exit`s and a strict `x.y.z` pin check precedes any install.
- **Lockfile:** a full `pnpm install` regeneration rewrote ~30 curated peer ranges (`postcss ^8.5.26`→
  `^8.5.10`, `next >=16.4.3`→`>=16.4.1`, from `a3f42c86`), so only the intended entries were kept: the
  `overrides:` block gains `postcss: ^8.5.10` and the react/react-dom importer specifiers become `19.3.1`
  (5-line diff). `pnpm install --frozen-lockfile` passes and the file stays byte-identical afterwards.
- **Verification:** guard 8/8 PASS and 3/8 fail on a deliberately broken manifest; full `pnpm exec vitest run`
  422/422 PASS; `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0 (bootstrap, frozen install, Spec
  Kit gate, typecheck, production build, refresh-docs 19/19); build `.next` 301,050,895 B + `public`
  32,840,043 B = 333,890,938 B (318.4 MiB) < 495 MB; `pnpm list react react-dom --depth 0` → 19.3.1;
  bootstrap verified on a fresh `$HOME` with no pnpm on PATH and exits 1 for a missing manifest, a missing pin
  and a non-exact pin.
- **Not verified:** PR-head CI (pending). `package.json` and `pnpm-lock.yaml` are protected files, so the PR
  needs the owner's authorization gate at merge.

---

# Active Context — Homepage Navigation Consolidation and Golden Shimmer (2026-11-04)

- **Task groups:** `polishing` + `testing`; branch `freebuff/d1d198f83bbd7f8a37f69b23`; new feature
  `specs/089-homepage-nav-gold-shimmer` (no earlier feature covered hero navigation or hero shimmer).
- **Verified baseline:** the hero primary navigation held five entries including both
  `Community Stories` (#community-stories) and `Lucky Map` (/map); the gold wordmark, the
  `EXPLORE YOUR LUCK` line/arrow and the emblem's gold ring are painted inside one
  `homepage-hero-lucky-pick-canada*.{avif,webp}` artwork, so the shimmer could only be a layer above it.
- **Implementation:** `app/homepage/Hero.js` drops the `Lucky Map` nav entry and its separator, relabels
  the stories link to `Lucky Stories` (still `#community-stories`), and adds one `aria-hidden` shimmer
  frame with ring/wordmark/explore layers between the artwork and `ExploreLuckButton`.
  `themes/default/hero.css` makes `.hero-image-container` a size container and sizes the frame with
  `height: min(100cqh, 150cqw)` + `aspect-ratio: 1024/1536`, which reproduces the `object-contain`
  artwork box (desktop 432x648, mobile 360x540) instead of the container box, then paints three masked
  screen-blended bands with one shared sweep keyframe (10.5 s / 8.6 s / 7.4 s) and hides them under
  `prefers-reduced-motion: reduce`. Region percentages are measured from the artwork's gold pixels
  (ring bbox x 177-842 / y 25-690, wordmark rows 755-1075, explore rows 1310-1480).
- **Verification:** guard `__tests__/homepage-nav-gold-shimmer.test.js` 12/12 PASS; focused with
  `homepage-hero-preload` 16/16; full `pnpm exec vitest run` 39 files / 413 tests PASS; `tsc --noEmit`
  exit 0; `./freebuff-verify.sh` exit 0 on the final code; build `.next` 285,913,411 B + `public`
  32,840,043 B = 318,753,454 B (304.0 MiB) < 495 MB. Served: `/`, `/map` and
  `/where-luck-has-been-found-in-canada` 200; four hero nav links with one `#community-stories` and no
  hero `/map` link; one `EXPLORE LUCKY STORIES` link to `/map`; one footer map link; one AVIF preload,
  AVIF source before WebP, WebP `<img>` fallback. Chromium (`artifacts/hero-shimmer/probe.cjs`, 26 frames
  @400 ms): max consecutive-frame mean pixel change desktop ring 7.254 / wordmark 9.620 / explore 11.447,
  mobile ring 6.291 / wordmark 12.596 / explore 14.677; reduced motion all `display: none` with 0 frame
  difference; Explore click scrolled 0-996 px (desktop) / 0-867 px (mobile) and added the confetti
  canvas; 0 px overflow, 0 console/page errors.
- **Tooling note:** this fresh workspace needed `npm i -g pnpm@10.30.3 --prefix "$HOME/.local"` and
  `scripts/setup-chromium-libs.sh` (Chromium 1243 was present but failed on `libnspr4.so`) before any
  browser evidence was possible.
- **Not verified:** PR-head CI (pending), audible confetti sound (no audio device here), physical
  iOS/Android devices, OS-level reduced motion (emulated only). The unused duplicate
  `public/themes/default/hero.css` was left untouched.

---

# Active Context — Live-Traffic Performance Readiness: Homepage Hero Image Delivery (2026-11-04)

- **Task groups:** `polishing` + `testing`; branch `freebuff/c1e1aaa103045da1dc1fde0f`; new feature
  `specs/088-live-performance-readiness` (no earlier feature covered this; 009/011/017 are AVIF conversions
  and `specs/perf-fixes` / `specs/homepage-perf` are different passes).
- **Measured baseline:** the homepage downloaded the hero artwork twice in every AVIF-capable browser —
  `homepage-hero-lucky-pick-canada.avif` 198.6 KiB **and** `homepage-hero-lucky-pick-canada.webp`
  293.1 KiB (491.7 KiB for one painted image). Cause: `app/homepage/Hero.js` emitted two React `preload()`
  image hints; a hint's `type` only filters undecodable formats, so both matched and both were fetched.
- **Implementation:** removed the WebP preload hint, kept the AVIF hint (high priority, responsive
  `imageSrcSet`), kept the AVIF → WebP `<source>` order and the WebP `<img>` fallback. New guard
  `__tests__/homepage-hero-preload.test.js`; harness `artifacts/perf-audit/{probe,screenshots}.cjs`.
- **Verification:** guard 4/4 PASS; full `pnpm exec vitest run` 38 files / 401 tests PASS; `tsc --noEmit`
  and `./freebuff-verify.sh` exit 0; clean build `.next` 301,017,190 B + public 32,840,043 B = 333,857,233 B
  (318.4 MiB), and 351,263,909 B (335.0 MiB) measured after the full verify run — both < 495 MB. Chromium
  probe, mobile 390x844 @3x: hero 491.7 → 198.6 KiB, total 1,982.6 → 1,688.7 KiB (-14.8%), FCP/LCP
  492 → 416 ms, CLS 0, TBT 24 → 0 ms. Desktop 1440x900: hero 491.7 → 198.6 KiB, total 2,142.3 → 1,848.4 KiB
  (-13.7%), LCP 308 → 304 ms, CLS 0. LCP element is still the AVIF hero, `currentSrc` identical to the live
  site, rendered box 1052x648 desktop / 360x608 mobile, 0 px overflow, 0 console errors locally.
- **Not verified:** field Core Web Vitals on real devices/live edge, and PR-head CI. Browsers without AVIF
  (Safari < 16.4, Firefox < 93) lose the early hint for the WebP fallback but still receive it from the
  unchanged `<picture>` source. Untouched by design: artwork/encoding, CSS, fonts, routes, payments, email,
  database, dependencies, deployment configuration.

---

# Active Context — Skill Library and MCP Connection Audit (2026-11-04)

- **Task groups:** `deep-dive` + `troubleshooting` + `security`; branch
  `freebuff/d39d4997e3eae68c62117cc1`; new feature `specs/087-skill-mcp-audit`. **Audit-only:** no
  application, dependency, workflow, environment, `.docs/` or `AGENTS.md` file changed.
- **Skills:** all 14 declared skills loaded (14/14), and a declared skill resource was fetched by path to
  confirm the resource mechanism. Unusable as installed: `image-to-code` (relocation stub,
  `disable-model-invocation: true`), `executing-plans` (missing `superpowers:*` sub-skills and scripts),
  and partly `systematic-debugging` / `neon-postgres` (missing `superpowers:test-driven-development`
  hand-off, missing parent `neon` skill, no `neon` CLI). `shadcn-ui` depends on an unconnected shadcn MCP
  and the repo has no `components.json`. `wrangler`, `workers-best-practices` and `github-actions-docs`
  have satisfied preconditions here.
- **MCPs:** GitHub and Neon **verified working** by read-only calls. **Cloudflare still failing after reconnection** — the connection was replaced with
  `cloudflare_api_key_gange-suzy` and re-tested read-only on 2026-11-04 at 09:28Z; `6003 Invalid request
  headers` / `6111 Invalid format for Authorization header` persists across two calls, so no account,
  `luckypickcanada.ca` zone or DNS record is reachable.
- **Cloudflare root cause (corrected 2026-11-04, round 2):** the connector's bearer value, not the
  credential. The full payload shows `6111 Invalid format for Authorization header` as an `error_chain` child
  of `6003`; a token placed in `X-Auth-Key` yields chain `6103` instead, and a genuine 37-hex Global API Key
  yields `9103` (with an email) or `9106` (without), so the earlier "37-character Global API Key" explanation
  is **withdrawn**. `Bearer undefined`, empty, internal-space and scheme-only values all reproduce
  `6003/6111`, while a clean 40-character value returns `9109`; a valid token therefore cannot produce the
  observed error, so the connector transmits a placeholder or mutated value instead of the token. The
  correction belongs to the connector's secret resolution and header construction (outside the repository —
  no Cloudflare client, `Authorization` construction or MCP configuration exists here); the owner's
  no-new-token check is the connection type plus a clean re-save. Repair remains **BLOCKED**; no credential
  was read, created, revoked or changed, and no DNS record or permission was touched.
- **Round 3 (2026-11-04):** the supplied zone ID `0af2a3985db329cdb671829cb59a41f1` allowed the DNS endpoint to
  be called directly: `LIST_DNS_RECORDS` → `9106 Authentication failed (status: 400)`, while `LIST_ZONES`
  (name filter) → `6003`+`6111`. HTTP **400** accompanies malformed-header cases while **403** accompanies
  invalid credentials, so the connector's header is structurally invalid before the credential's identity is
  checked. No accessible connector code, configuration or secret store exists, so a complete engineering
  escalation was written instead of an invented repository fix. Time used this round ≈15 minutes (cap 30);
  the repair is **BLOCKED**, not achieved.
- **Google Stitch failing** — connected API key rejected. No write or deploy tool was called and no
  credential value was read or printed. **Context7 is not connected**, so the Context7 approval rule in
  `AGENTS.md` line 57 and every group file currently gates nothing; no repository-level MCP configuration
  exists at all.
- **Activation:** discovery is automatic (name + description), loading and selection are not.
  `grep -ci skill AGENTS.md` returns `0`, so no repository rule triggers a skill; every skill load and MCP
  call in this session traced to the task text naming the subject. Recommendations (reconnect Cloudflare
  and Stitch, resolve the Context7 gap, optional capabilities clause in `AGENTS.md`) are recorded for
  owner approval only and were not applied.
- **Verification:** pnpm 10.30.3 installed to `$HOME/.local` and `pnpm install --frozen-lockfile` exit 0;
  `./freebuff-verify.sh` exit 0 (Spec Kit gate, typecheck, production build, refresh-docs 19/19); build
  `.next` 301,017,232 B (287.1 MiB) plus `public` 32,840,043 B = 333,857,275 B (318.4 MiB) < 495 MB.
- **Not verified:** Freebuff client internals, whether an unstated task would trigger a skill,
  `web-design-guidelines` / `canvas-design` / `extract-design-system` runtime dependencies, and PR-head CI.

---

# Active Context — Restore the Reveal Paywalls (2026-11-03; follow-up 2026-11-04)

- **Task groups:** `security` + `testing`; branch `freebuff/restore-reveal-paywalls`; feature
  `specs/086-restore-reveal-paywalls`. Reverses feature 072's public preview and removes the gift-email
  test tool that was merged from PR #1703.
- **Verified baseline:** base `a635bdcc` shipped `REVEAL_TEST_MODE = true` (a public **Preview Reveal —
  FREE** button) and `GIFT_EMAIL_TEST_MODE = true` (a public payment-free gift email page/route). Prices
  were already 100/199, and `/api/verify-session` / `/api/gift-delivery` already required a paid session.
- **Implementation:** deleted `app/test-tools/reveal-testing/` and removed the preview import, prop,
  handler, markup, homepage wiring and CSS. Then, per the 2026-11-04 follow-up, deleted
  `app/test-tools/gift-email/` (page, client form, switch, README),
  `app/api/test-tools/gift-email/route.js` and `__tests__/gift-email-test-tool.test.js`, so the bypass
  cannot be re-enabled by editing a constant. `__tests__/security-payment.test.js` guards the absent page
  and route. Paid checkout, verification, delivery and `app/gift-email.js` are untouched.
- **Verification:** focused 3 files / 32 tests PASS; full `pnpm exec vitest run` 37 files / 397 tests PASS;
  `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0 on a clean `.next` build (stale generated
  route types referenced the deleted files until the build directory was cleared). Build `.next`
  301,016,019 B / 287.1 MiB plus public 32,840,043 B = 333,856,062 B / 318.4 MiB (< 495 MB). Served output
  contains no removed tool strings or routes; homepage 200; `/test-tools/gift-email` 404;
  `POST /api/test-tools/gift-email` 404; `/api/send-gift` 403; Chromium popup 0 preview / 1 paid button /
  4 game+delivery radios.
- **Not verified:** live Stripe payment, real Resend gift delivery, PR-head CI. The legacy `/api/send-gift`
  endpoint and `/reveal/[id]` fallback remain development-only and are not publicly reachable.

---

# Active Context — Gift Email Test Tool (2026-11-03)

- **Task groups:** `creation` + `testing` + `security`; branch `freebuff/e6b5a381045c337886e3bec8`.
  New feature `specs/085-gift-email-test-tool`; no earlier feature covered gift-email testing, so the
  existing 072 preview and 084 counter artifacts were not reused for this task.
- **Implementation:** `/test-tools/gift-email` is a server-rendered page with a client form (recipient
  email, recipient name, sender name, optional message, 6 Pick / 7 Pick). It posts JSON to
  `POST /api/test-tools/gift-email`, which bypasses only the Stripe payment step: it reuses
  `createGiftReveal()` and `sendGiftEmail()` from `app/gift-email.js`, so the generated reveal and the
  Resend request are the paid Gift Edition's own. `GIFT_EMAIL_TEST_MODE` is the on/off switch; the route
  rejects cross-site Origins (checking Host, `x-forwarded-host` and the internal URL), is rate-limited
  to five sends per hour per address, returns no-store JSON, and reads `RESEND_API_KEY` /
  `GIFT_FROM_EMAIL` only on the server. No secret or provider response body reaches the browser. The
  existing `/api/admin/test-gift-email` endpoint and its `GIFT_TEST_SECRET` are untouched. No checkout,
  Stripe, price, webhook, gift-delivery, reveal-paywall or dependency file was changed.
- **Verification:** focused 10 tests PASS; full `pnpm exec vitest run` 38 files / 409 tests PASS;
  `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0 (Spec Kit gate, typecheck, production
  build, refresh-docs 19/19); production build 343,097,481 B / 327.2 MiB (< 495 MB); production smoke
  on port 3100: page HTTP 200 with the form and `robots: noindex, nofollow`, same-origin POST 503 with
  the expected missing-configuration message, foreign-Origin POST 403. The smoke test caught and fixed
  an Origin check that compared only the handler's internal URL.
- **Not verified:** a real Resend delivery — this workspace has no `RESEND_API_KEY` or `GIFT_FROM_EMAIL`
  and the task forbids entering keys. No test email was sent; PR-head CI is pending.

---

# Active Context — Paid Lucky Reveal Counter and Popup Map CTA Removal (2026-11-03)

- **Task groups:** `creation` + `polishing` + `testing`; branch `freebuff/7b6750b84aced857e5b48588`.
  New feature `specs/084-lucky-reveal-counter`; feature 073's empty map slot was replaced, not reused.
- **Implementation:** new `lucky_reveal_tally` table (`session_id` unique, `reveal_type` limited to
  `lucky_pick`/`gift_package`) gives one row per paid reveal, so the public total starts at zero;
  `app/lucky-reveal-tally.js` records atomically (`ON CONFLICT DO NOTHING`) and never throws; recording
  happens in `/api/verify-session`, `/api/gift-delivery` and the paid `checkout.session.completed`
  webhook, and tips/previews/unpaid sessions never count. `GET /api/lucky-reveals-count` returns
  `{ total }` with `no-store`. `app/homepage/LuckyRevealsCounter.js` shows "LUCKY REVEALS CREATED TO DATE"
  starting at 0 between the reveal and Tip Jar, with neon-gold CSS in `themes/default/homepage.css`;
  `app/lucky-reveal-popup.js` no longer renders the Little Luck Map button or its styles.
- **Verification:** focused 82 tests PASS; full 399 tests PASS; `tsc --noEmit` 0; `./freebuff-verify.sh`
  0; clean production build 334,074,324 B / 318.6 MiB (< 495 MB); Playwright reveal spec 24/24 (desktop, 390,
  412) including the popup with no map invitation; counter probe 620x197/368x125, 0 overflow, 0 console
  errors; live endpoint `{"total":0}` with `no-store`.
- **Not verified:** tally SQL against live Neon, a real Stripe charge, a real Resend gift email, PR-head
  CI. Historical purchases are not backfilled; a purchase paid while the DB is unreachable is not
  retried into the tally.

---

# Active Context — Reveal Roadmap Phase 3 Audit: Reliability and Performance (2026-11-03)

- **Task groups:** `testing` + `audio` + `polishing`; branch `freebuff/381c2d3e3c25cd7328d9869f`; PR #1700
  open and unmerged. Reused `specs/081-lucky-reveal-finish-and-media-capability` (Phase 5 spec and plan,
  Phase 12 tasks); no duplicate feature directory. Phase 4 was not started and the FREE Preview switch is
  untouched.
- **Owner decision:** the reveal keeps its automatic sound and ships **no in-app mute button**. A mute
  toggle added earlier in this task was removed, and `app/lib/audio.js`, `app/lucky-reveal-popup.js` and
  `app/lucky-reveal-celebration.jsx` are now identical to the task base (`9b43b1da`): no mute flag,
  toggle, icon or gate. Assets, volumes (0.28 / 0.45 / 0.55), order (sparkle → pop → applause) and the
  session-based applause lifecycle are unchanged.
- **Audit result:** all eight Phase 3 requirements verified against the shipped behaviour —
  Android-emulated 6 and 7 pick runs (0 px overflow, panel 15..397 of 412 and 15..375 of 390), the
  automatic cue sequence, blocked playback logged and never thrown, reduced motion with no canvas and no
  reveal cue, a clean close, Howler the only lazy audio dependency, and 0 pressed-state or
  mute/sound-labelled controls in the panel.
- **Tests:** `__tests__/reveal-audio-mute.test.js` deleted; `__tests__/lucky-reveal-phase3.test.js` now
  asserts no toggle/state/icon, no mute exports, unconditional cue calls and unchanged assets and volumes;
  `__tests__/components/LuckyRevealCelebration.test.jsx` no longer supplies a mute export in its mock.
- **Verification:** focused 6 files / 76 tests PASS; full `pnpm exec vitest run` 36 files / 380 tests PASS;
  `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` PASS; production build (`pnpm build`)
  317,148,866 B / 302.5 MiB plus public 32,840,043 B — combined 349,988,909 B / 333.8 MiB, below 495 MB
  (clean build 299,738,399 B);
  audit probe 144/144 checks over eight scenarios (sparkle 1, pop 1, applause 1 in every normal-motion run;
  4 blocked `play()` with 0 uncaught errors; reduced motion 0 cues; clean close).
- **Gate note:** `./freebuff-verify.sh` needs `SPEC_KIT_BASE_REF=9b43b1dae85e3d92e964d74d65bdf43b0e554ef0`
  in this workspace because `origin/main` is stale at `a2c1222a` (PR #1676) while the branch starts at
  `9b43b1da` (PR #1699 merge).
- **Not verified:** physical Samsung/Android hardware, the device mute/volume path, and audible
  playback/loudness (no audio output device). Reported as unverified, never as passed.

# Active Context — Updater Scheduler GitHub User-Agent and Dispatch Diagnostics (2026-11-03)

- **Task groups:** `troubleshooting` + `testing`; branch `freebuff/78319e5dc4e17636cb62dc2a`; PR #1696 open and unmerged; new feature `specs/083-updater-scheduler-dispatch-user-agent` (features 035/036 cover reliability and cutover, so nothing was duplicated).
- **Cause:** the Worker's dispatch request set every header except `User-Agent`, and Cloudflare Workers `fetch` sends none; GitHub answers that with `403 Request forbidden by administrative rules` (reproduced against the live dispatches endpoint, plain-text body without `x-ratelimit-*`). Across 6 Oct–3 Nov every run of both updaters is `— schedule` or `— manual`; zero are `— cloudflare`, while the same repository credential succeeded in five canary runs (latest 31 Oct 18:23Z).
- **Implementation:** `GITHUB_USER_AGENT = "luckypickcanada-updater-scheduler"` is now sent; `GitHubDispatchError` plus `sanitizeDiagnosticBody`/`selectDiagnosticHeaders` reproduce the deployed diagnostics as `githubStatus`, `githubBody`, `githubHeaders` with token, `Bearer`, `gh[pousr]_…`/`github_pat_…` redaction, a one-line 500-character cap and a `content-type`/`retry-after`/`x-github-request-id`/`x-ratelimit-*` allowlist. Agent Lee's revised code is absent from the repository and every local branch, so the reviewed source is now the single version.
- **Verification:** focused Worker suite 17/17 PASS; `./freebuff-verify.sh` exit 0 (Spec Kit artifacts, typecheck, production build, refresh-docs 19/19); Wrangler dry run exit 0; build 332,572,886 B / 317.17 MiB (< 495 MiB); diff limited to the Worker source, its test, its README, the new spec files, `.specify/feature.json`, this note and `PR_SUMMARY.md`.
- **Pending:** PR-head `Verify updater scheduler` job, owner-approved deployment, and the first real `— cloudflare` run for each workflow. No deployment, token, secret, schedule, workflow or Cloudflare setting was changed.
- **Known inconsistency (untouched):** an older section of this file still says `UPDATER_SCHEDULER_ACTIVE=true`, but the repository variables API returns only `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

# Active Context — Lucky Reveal PR #1692 Review Repair (2026-11-03)

- **Task groups:** `troubleshooting` + `security` + `audio` + `testing`; same branch
  `fix/reveal-applause-share-20261103` and same PR #1692, left open and unmerged. Reused `specs/081`
  (Phase 4 sections); no duplicate feature directory.
- **Amazon Q finding — real and now tested.** `playRevealApplause` set `applauseRequestedSessionId`
  before the decode completed, so a rejected preload left the guard set and every later cue for that
  open reveal was dropped. Commit `f29a544b` (owner `/q` request) clears the guard in the catch. New
  `__tests__/reveal-applause-retry.test.js` drives the real module with a controllable Howl: first
  decode fails, retry creates a second Howl, `load` then plays once, a third call stays ignored; a
  second case ends the session before `load` and asserts no playback.
- **DevSkim — all 38 annotations classified.** 1 DS137138 warning was the intentional `http://`
  negative fixture in the share-link test (never fetched); 1 DS172411 notice was the warmup timer's
  callable arrow with a fixed delay; 36 DS162092 notices were loopback addresses inside the committed
  generated `artifacts/reveal-phase3/report.json`. The report is no longer committed (the probe still
  writes it locally), and each genuine false positive now has a one-line `DevSkim: ignore` with a
  reason. No scanner allowlist, rule, or workflow was widened.
- **Verification:** focused 2 files / 30 tests PASS; full 36 files / 376 tests PASS; `tsc --noEmit`
  exit 0; DevSkim suppression unit tests 70 PASS; `./freebuff-verify.sh` PASS; `.next` 342,207,481 B /
  326.35 MiB (combined with public 375,047,524 B). DevSkim real-SARIF replay is CI-only.
- **Pending:** DevSkim annotations on the new pushed head, independent re-review, physical
  Samsung/Android share sheet, and audible playback.

# Active Context — Lucky Reveal Phase 3 (2026-11-03)

- **Task groups:** `audio` + `polishing` + `testing`; branch `fix/reveal-applause-share-20261103`; one PR, open and unmerged. Reused `specs/081-lucky-reveal-finish-and-media-capability` (Phase 3 sections); no duplicate feature directory.
- **Sound:** removed the generated `reveal-glow-pulse.wav`, its provenance and generator, and the finishing chime, to avoid a continuous bed and a clashing cue. New `public/sounds/reveal-applause.wav` is Mixkit 478 "Small group cheer and applause" (real recording, Mixkit Sound Effects Free License, commercial web use, no attribution required), trimmed to 5.6 s mono 44.1 kHz with fades; provenance in `public/sounds/reveal-applause-sources.md`.
- **Lifecycle:** `beginRevealAudioSession` / `endRevealAudioSession` own each reveal; `playRevealApplause(sessionId)` plays once per session, ignores stale sessions, and only starts a delayed decode if that session is still current. No fade or stop timers.
- **Timing:** applause fires on the celebration's 8 % leaf cue (2.5 s lead before the 12 s fallback), after every number; the four golden pulses still wait for an empty canvas.
- **Sharing:** image is prewarmed 1.2 s after mount, `navigator.share` is called synchronously from the tap with one attempt only; cancel/failure/unsupported each get truthful messages; copy-link no longer claims success on failure; `getShareLink` rejects query/fragment/payment identifiers.
- **Verification:** focused 5 files / 85 tests PASS; full 35 files / 373 tests PASS; `tsc --noEmit` exit 0; `./freebuff-verify.sh` PASS; build 340,354,762 B / 343 MB; Phase 3 Chromium probe 61/61 (applause once after all numbers with leaves still painted, paused on close, no late play after a delayed decode, tap-to-share 1–3 ms, image 1.76–1.77 MB, cancel/failure/unsupported all truthful).
- **Pending:** physical Samsung/Android share sheet and audible playback; both unverified here.
# Active Context — Lucky Reveal Phase 2 (2026-11-03)

- **Task groups:** `polishing` + `audio` + `testing`; branch `freebuff/6dc0e7308e1062abbe03974a`; PR open and unmerged (Master Work Request #1, Phase 2). Reused `specs/081-lucky-reveal-finish-and-media-capability` for the new Spec Kit cycle; no duplicate feature directory.
- **Atmosphere:** `app/lib/audio.js` exports `REVEAL_GLOW_PULSE_MS = 3000` and preload/start/stop helpers; new `public/sounds/reveal-glow-pulse.wav` (generated by `scripts/generate-reveal-glow-pulse.mjs`, mono 22,050 Hz, exactly 3.000 s, 132,344 B) has silent loop edges and its swell peaks at 1.5 s. The popup starts it at `GLOW_START_MS = 2900`, stops it on close, skips it for reduced motion, and the ball glow's `animationDuration` reads the same constant. Provenance: `public/sounds/reveal-glow-pulse-sources.md`.
- **Chime timing:** the celebration counts painted pixels and fires `onConfettiFinishing` once at `FINISHING_LEAF_RATIO = 0.08` of the peak, plus a `FINISHING_CUE_LEAD_MS = 2500` guarantee before the 12 s safety timeout. The popup plays the chime there; the four pulses stay on `onConfettiSettled` (after the confetti is gone).
- **Sharing:** four always-visible actions — **Share to Apps** (share icon, 55–58 px) plus the preserved **Copy the website link**, **Copy the image**, **Download the image** (70–75 px). Native ladder unchanged in order; absent Web Share shows an explicit fallback and the three actions stay usable. New `getShareLink(reveal)` prefers a same-site HTTPS `resultUrl`, else the site URL.
- **Verification:** focused 52 tests PASS; full 366 tests PASS; `tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0; build 339,682,181 B / 323.9 MiB; Chromium probe 41/41 (6/7 numbers, both games, desktop + mobile, audio loop start/stop, chime 782–2543 ms before the canvas clear with leaves still painted, four options, native payload, no-Web-Share fallback).
- **Pending:** physical Android share sheet (stubbed), audible playback/loudness, CI on the PR head.

---

# Active Context — DevSkim Reveal Timer False-Positive Filtering (2026-11-03)

- **Task groups:** `security` + `deep-dive` + `testing`; branch `freebuff/082-devskim-reveal-timer-findings`; PR #1689 open and unmerged.
- **Finding review:** GitHub Code Scanning alerts #403–#406 were reviewed against their exact source. Three are inline JavaScript arrow callbacks using internal state or fixed delays; the fourth is a quoted test assertion string and does not execute a timer. These four are false positives for string-based `setTimeout` code execution.
- **Implementation:** `.github/scripts/suppress_devskim_false_positives.py` now admits only three exact application statements and one exact test assertion for DS172411, retaining absolute source-span and snippet validation. New paths do not widen other rules. Negative tests keep opaque callbacks, other callback statements, altered literals, unreviewed paths, and different rules visible. `.github/scripts/verify_devskim_sarif_replay.py` audits the four exact source patterns.
- **Verification:** current-head DevSkim workflow run 41608061872 passed Python syntax validation and all 70 suppression unit tests. Real-SARIF replay passed: 151 raw results, 151 reviewed suppressions, 0 remaining, with raw SARIF unchanged; filtered SARIF upload succeeded. PR verification/code-analysis run 41608056892 passed. The dedicated OpenNext and Visual QA checks were still running when this note was written.
- **Remaining verification:** `./freebuff-verify.sh` has not been run locally because this connected shell could not resolve GitHub for a repository clone. Report this as NOT RUN; do not infer a pass. Review the remaining PR checks before handoff. No app runtime file, workflow, dependency, scan coverage, payment/email behavior, or `.docs/` file was changed.

---

# Active Context — Lucky Reveal Finish Polish + Reusable Media Inspection (2026-11-03)

- **Task groups:** `polishing` + `audio` + `troubleshooting`; branch `freebuff/f42744a86b35d603e40013fd`; PR #1687 open and unmerged (Master Work Request #1).
- **Verified baseline:** `canvas-confetti` deletes a particle when `fetti.tick >= fetti.totalTicks`, and feature 080 set `ticks: 150` with a fixed `CONFETTI_WINDOW_MS` teardown, so leaves could be deleted while painted and the layer left on a timer. `ShareLuckyPickButton` only tried a file share and dropped straight to the custom window. Numbers kept an infinite alternating glow and had no finish. No `ffmpeg`, `ffprobe` or audio model existed in the workspace.
- **Confetti:** lifetime is now 300 ticks (past the fall) and the layer is removed by sampling the canvas (`getImageData`, every 200 ms from 1400 ms after launch) — never before the canvas paints nothing — with a 12 s fallback. Waves (86 <= 96), leaf artwork, palette and above-panel layering unchanged. Measured in Chromium: painted until 16.2 s (desktop) / 12.8 s (mobile) of probe time, then empty in the same sample the layer left.
- **Sharing:** image + message + link, then native text/link, then the custom window; both `AbortError`s report cancellation and open nothing. Device share sheet untested.
- **Finish:** the celebration reports completion once; `app/lucky-reveal-popup.js` then applies `lucky-reveal-numbers--finishing`, which runs four 1.05 s golden ring pulses with a 120 ms per-ball stagger from a `::after` pseudo-element (the ball's own animation untouched) and clears after about 5.1 s. Reduced motion runs none.
- **Sound:** new `public/sounds/reveal-finish-chime.mp3` (2.77 s, 44,764 B) from "Healing Spell Chime (Fantasy RPG)" by Assetsmith on Freesound, CC0 1.0 (commercial use permitted); provenance in `public/sounds/reveal-finish-chime-sources.md`, page/deed evidence in `artifacts/sound-licence/`. Played once with the first pulse; opening sparkle and confetti pop unchanged.
- **Media capability:** `scripts/setup-media-tools.sh` provisions FFmpeg/FFprobe 7.0.2 static, a private venv (vosk, torch 2.15.0+cpu, transformers 5.22.1), the Vosk small-en-us model and the AudioSet AST model under `~/.local/media-tools` (1.5 G, durable, no root, no sandbox change); `scripts/inspect-media.py` reports frames, a Vosk transcript with word timings and AudioSet sound labels. Demonstrated on `artifacts/media-inspection/` (speech transcript plus a 4.83 s reveal demo recording: frames, `Ding`/`Clang`/`Burst, pop`).
- **Artifacts:** `specs/081-lucky-reveal-finish-and-media-capability/{spec,plan,tasks}.md` plus `checklists/requirements.md`; `.specify/feature.json` points there.
- **Verification:** focused 52 tests PASS; full `pnpm exec vitest run` 347 PASS; `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0; production build 299,540,437 B / 285.6 MiB; Chromium probe (launched with no `--no-sandbox`) recorded the pulses only after the canvas emptied, the chime requested at that moment, and a clean reduced-motion path.
- **Pending:** real Android share sheet, audible playback, and the "supplied recording" (absent from this workspace).

---

# Active Context — Lucky Reveal Confetti Phase 1 (2026-11-02)

- **Task groups:** `polishing` + `audio`; branch `freebuff/d4bf506e672ecbddc0a33655`; PR left open and unmerged.
- **Verified baseline:** the shipped celebration fired 112 particles in one tick (34+34+16+16+12) from a canvas created imperatively and appended to `document.body` as a fixed `z-index: 100` layer with `ticks: 160` (about 2.67 s); the 18-leaf settled pile stayed mounted behind the panel for the whole reveal; the reveal opened in silence (only `playConfettiPop()` at the final number).
- **Confetti:** `app/lucky-reveal-celebration.jsx` now renders the canvas inside the reveal overlay in its own `.lucky-celebration-particles` layer (`z-index: 3`, above the panel, clipped), caps particles with `MAX_ACTIVE_PARTICLES = 96` enforced against a shared budget, schedules five waves (24+24+14+14+10 = 86) at 0/500/1000 ms with `ticks: 150` per leaf so the confetti runs about 3.5 s, fades and unmounts the layer at 4.2 s, and releases every timer and the instance on finish and unmount. The settled-leaf pile, gold glow, flash, palette and layer order behind the panel are unchanged.
- **Sounds:** the finishing pop is unchanged (`/sounds/confetti-pop.wav`, 0.90 s). The missing opening sparkle was added in `app/lib/audio.js` (`preloadRevealSparkle`/`playRevealSparkle`, committed `/sounds/chime-sound.mp3`, 1.25 s, volume 0.28) and played once from `app/lucky-reveal-popup.js`; skipped for reduced motion, matching the celebration's sound policy.
- **Number modes:** generation is untouched (`6 -> 1-49`, `7 -> 1-50`); numbers keep the 2.0 s start and 0.35 s stagger, and the celebration delay stays `(2.0 + (n-1)*0.35 + 0.95) s`.
- **Artifacts:** `specs/080-lucky-reveal-confetti-phase1/{spec,plan,tasks}.md`; `.specify/feature.json` points there. Guards: new `__tests__/lucky-reveal-confetti-phase1.test.js`, updated `__tests__/components/LuckyRevealCelebration.test.jsx` and `__tests__/lucky-reveal-celebration.test.js`.
- **Verification:** `pnpm exec vitest run` 33 files / 332 tests PASS; `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0; production build 299,133,609 B / 285.3 MiB (< 495 MB). Chromium probe (`scripts/setup-chromium-libs.sh`, `artifacts/reveal-confetti-phase1-probe.cjs`): 1440x900 and 390x844 with 6 and 7 picks show the canvas inside the reveal, `body > canvas` 0, painted leaves, celebration after the final number, layer and canvas gone afterwards, both sound files requested, no page errors, reduced motion unchanged. Audible playback is unverified (no audio output device here).
- **Setup note:** pnpm was absent; installed with `npm i -g pnpm@10.30.3 --prefix "$HOME/.local"` (a global install without a prefix fails in this image) and dependencies with `pnpm install --frozen-lockfile`.

---

# Active Context — Lucky Reveal Follow-up Polish (2026-11-02)

- **Task groups:** `polishing` + `troubleshooting`; branch `freebuff/reveal-polish-followups`; PR left open and unmerged.
- **Merged baseline:** PR #1680 (feature 076 celebration and share-logo AVIF/WebP) is merged; this work is a new branch from that merge (`4600ced8`).
- **Close button:** measured in Chromium before the fix: the panel's content wrapper (`position: relative; z-index: 2`) covered the lower 32 px of the 38 px X on mobile (every probe point hit `P`/`H2`) and the lower 16 px on desktop, and scrolling the panel moved the X to `top: -129` (desktop) / `-240` (mobile). Fix: the button is now `z-index: 3`, 44x44 with `touch-action: manipulation`, and the panel no longer scrolls — the `.lucky-reveal-scroll` body does, so the X stays pinned. After: every probe point hit-tests the button, one click closes the reveal before and after scrolling, and Escape still closes, on desktop 1440x900 and mobile 390x844, for 6 and 7 picks.
- **Leaf pile:** `SETTLED_LEAVES` is now 18 overlapping leaves in three explicit layers (`zIndex: leaf.layer`) with varied size, rotation and opacity, over the existing gold glow; the celebration layer is `z-index: 1`, behind the panel (`z-index: 2`), so the finish cannot cover numbers, copy, the share control or the map CTA (probe: `paintedAbovePanel: false`, zero reportable overlaps).
- **Container:** the panel now uses the homepage card gradient `linear-gradient(145deg, rgba(5,11,18,.7), rgba(7,19,27,.52) 52%, rgba(8,7,18,.62))` with `blur(16px)`, keeping the lucky-colour border/glow and radius 28.
- **Images:** audit with measured bytes. Reveal background stays AVIF 474,841 / WebP 427,992 / JPEG 535,956. The share logo is now `public/assets/lucky-reveal-logo-232.{avif,webp,png}` (12,141 / 22,500 / 24,039 B, 232x502, alpha) generated from the 1920x4152 PNG, replacing a 195,149 B AVIF download for a 116 px draw; the PNG share output is unchanged. Inline SVG artwork stays vector (0 requests); `golden-maple-leaf` already ships AVIF -> WebP -> SVG.
- **Artifacts:** `specs/078-lucky-reveal-followup-polish/{spec,plan,tasks}.md`; `.specify/feature.json` points there. Guards: `__tests__/lucky-reveal-followup.test.js` plus the updated 076 suites. Browser evidence: `artifacts/reveal-followup-probe.cjs` and `artifacts/reveal-followup/`.
- **Verification:** full `pnpm exec vitest run` (320 tests), `pnpm exec tsc --noEmit`, and `./freebuff-verify.sh` passed; production build 409,750,967 B / 390.77 MiB. Chromium works in this workspace via `scripts/setup-chromium-libs.sh`; the dev runtime does not hydrate here, so browser checks run against `next start` on port 3001.

---

# Active Context — Chromium Visual Inspection Enabled Without Root (2026-11-02)

- **Task groups:** `troubleshooting` + `deep-dive`; branch `freebuff/f9451dce1ff9eb4af88ea1f8`; PR #1681 open and unmerged. Follow-up to the #1681 audit, at the owner's direction: no root, no `no-new-privileges` change, no sandbox weakening.
- **Implemented:** `scripts/setup-chromium-libs.sh` provisions Chromium's runtime libraries at user level — `apt-get` with `Dir::State::lists`/`Dir::Cache` pointed at `~/.apt-user` (works unprivileged, exit 0), `--download-only --reinstall install` for the dependency closure, `dpkg-deb -x` into `~/.local/chromium-libs` (27 MB), plus a private fontconfig file because the image has no `/etc/fonts`. `artifacts/capture-site-screenshots.cjs` drives the repository's pinned `playwright-chromium` and writes PNGs + `report.json` into `artifacts/browser-proof/`.
- **Verified:** `ldd` on `chromium-1243/chrome-linux64/chrome` reports **0** missing shared objects (was 16); Chromium **153.0.8010.12** launched through Playwright and captured `https://luckypickcanada.ca/` at 1440x900, 390x844 and 412x915 — all HTTP 200, `scrollWidth === clientWidth` (0 px overflow), no broken images, real text (4106 chars). Screenshots inspected: Milky Way backdrop, gold maple-leaf mark, Cinzel headings, nav and "Explore Your Luck" CTA all paint on desktop and mobile.
- **Not changed:** no root, no sandbox flags, no repository dependency, no `package.json`/lockfile edit, no website code or configuration. The prefix is outside the repo under `$HOME`, which is durable in `/workspace`, so it survives archive/restore for this workspace only; a fresh workspace reruns the script once.
- **Remaining:** image-level inclusion (so a fresh workspace needs nothing) is a platform change I cannot make — the exact package list and Dockerfile line are in the PR for the owner to request. Node is 26 in the sandbox vs the 22 pin, so local results remain weaker evidence than CI.
- **Artifacts:** `specs/077-browser-visual-inspection-enablement/{spec,plan,tasks}.md` extended (no new feature directory).

---

# Active Context — Browser Visual Inspection Enablement Audit (2026-11-02)

- **Task groups:** `troubleshooting` + `deep-dive`; branch `freebuff/f9451dce1ff9eb4af88ea1f8`; PR open and unmerged. **Audit-only:** no package, permission, configuration, website or application change was made.
- **Measured sandbox state:** Ubuntu 24.04.5 x86_64, unprivileged `uid=261478524`; `sudo` refused (`The "no new privileges" flag is set`); `apt-get -s install libnspr4` -> `E: Unable to locate package libnspr4`; Node `v26.13.0` against `engines.node: 22.x`; `npm 11.20.0` present, `pnpm`/`corepack` absent; `node_modules` absent; `~/.cache/ms-playwright` absent; no Chromium binary on `PATH` or under `/opt`.
- **Chromium runtime libraries absent:** `dpkg -l` and `ldconfig -p` both show `libnspr4`, `libnss3`, `libatk-1.0`, `libatk-bridge-2.0`, `libcups`, `libxkbcommon`, `libpango-1.0`, `libcairo`, `libasound`, `libatspi`, `libXcomposite`, `libXdamage`, `libXrandr` missing. Present: `libgbm1`, `libx11-6`, `libdrm`.
- **Not the constraint:** 8 vCPU, 15 GiB RAM, 2.0 GiB `/dev/shm`; npm registry 200, `cdn.playwright.dev` reachable, `https://luckypickcanada.ca/` 200.
- **Repository needs no change:** `playwright.config.ts` (three Chromium projects, `tests/visual`, `pnpm dev` webServer) and `.github/workflows/visual-qa.yml` (`playwright install --with-deps chromium`) already provide the browser path; Playwright packages are already pinned.
- **Conclusion:** blocked by the environment, not the repository — no browser engine, no Chromium library set, no root to install it. Minimum ask: library set or root, Playwright Chromium download, lockfile dependency restore, and permission to run the dev server and Playwright locally. Node 22 pinning is optional fidelity; hosted rendering is a recorded alternative, not adopted.
- **Artifacts:** `specs/077-browser-visual-inspection-enablement/{spec,plan,tasks}.md`; `.specify/feature.json` points there. History corroboration: `specs/041-turnstile-early-preload/research.md`, specs 061/064/066.

---

# Active Context — Lucky Reveal Celebration and Reveal Image-Format Completion (2026-11-02)

- **Task groups:** `polishing` + `audio`; branch `freebuff/e948d67e670ae5e5d50291d1`; PR left open and unmerged.
- **Verified baseline:** both paid experiences still render the one `LuckyRevealPopup`, and features 074/075 are merged (Milky Way AVIF/WebP/JPEG backdrop, 6 to 3+3 and 7 to 4+3 rows, colour swatch, shimmer, maple sparkle, single share control). The homepage confetti path and `public/images/maple-leaf.svg` encode the same 37-point leaf outline; one segment is absolute (`L546-458`) in the SVG and relative (`-204 1052`) in the particle path, and a JS endpoint parser confirmed the geometry is identical. The only raster asset the share renderer loaded was `/BackgroundEraser_20260724_163638777.png`; an AVIF existed but no WebP did.
- **Change:** new `app/lib/mapleLeafConfetti.mjs` owns the exact homepage `MAPLE_LEAF_PATH`/`MAPLE_LEAF_MATRIX`, the cached lazy `canvas-confetti` loader and the cached leaf shape; `app/homepage/ExploreLuckButton.js` imports it with no second copy. New `app/lucky-reveal-celebration.jsx` preloads `preloadConfettiPop()` and the particle library on mount, fires at `startNumbersDelay + (numItems - 1) * 0.35 + 0.95` seconds, plays `playConfettiPop()` in the same tick as inward bursts from x 0 and x 1 (angle 62/118, `ticks: 160`, about 2.7 seconds), draws on a main-thread canvas because the CSP blocks the Blob worker, adds a 1-second opening gold flash plus a bottom settled-leaf pile built from the same SVG outline over a radial gold glow, and cleans up timer, canvas and instance on unmount. `app/lucky-reveal-popup.js` renders it and raises the panel to `zIndex: 2`. `app/lucky-reveal-share-image.js` loads the logo AVIF then WebP then PNG, and `public/BackgroundEraser_20260724_163638777.webp` (273,324 bytes, from a 2,609,980-byte PNG) was generated with `sharp`. The generated share image stays PNG.
- **Preserved:** numbers, row layout, swatch, shimmer/sparkle, copy, close/Escape/autofocus, share control, map CTA, Milky Way `image-set()` order, six-number 1-49 and seven-number 1-50 generation, stored gift results, Stripe/checkout/prices, gift email, Resend, database, and the Little Luck Map. No dependency, route, API, environment or deployment change.
- **Artifacts:** `specs/076-lucky-reveal-celebration-image-optimization/{spec,plan,tasks}.md`; `.specify/feature.json` points there. Guards: `__tests__/lucky-reveal-celebration.test.js` and `__tests__/components/LuckyRevealCelebration.test.jsx`, plus the existing 074/075 guards.
- **Verification:** recorded in the single PR summary. PASS: full `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, and `./freebuff-verify.sh` including the production build. BLOCKED (environment): browser check, because Chromium cannot start here (`libnspr4.so: cannot open shared object file`); CI Playwright is the confirmation path, so phone/desktop visuals, the audible pop and the actual leaf motion remain unconfirmed by this session.

---

# Active Context — Lucky Reveal Polish and Device-Native Sharing (2026-11-02)

- **Task group:** `polishing`; branch `freebuff/734cbf62690b478727fca4a5`; PR left open and unmerged.
- **Verified baseline:** feature 074 had already replaced the reveal background with the homepage Milky Way artwork. The popup rendered all six or seven numbers in one wrapping flex row, showed the lucky colour as text only, and `app/share-lucky-pick-button.js` expanded a nine-action card (Share directly, Copy share link, Copy card message, Facebook, X, Friends and family, Email, Text) without sharing an image.
- **Change:** new `app/lucky-reveal-presentation.js` owns the row layout (6 → 3 + 3, 7 → 4 + 3, order preserved) and one swatch per lucky colour; new `app/lucky-reveal-share-image.js` draws a 1200x1500 PNG from the reveal data (rows, swatch, colour name, day, logo, site link, disclaimer); `app/lucky-reveal-popup.js` renders centred rows, the swatch beside the colour name, a golden shimmer, a small maple-leaf sparkle, Milky Way wording, and a `prefers-reduced-motion` block; `app/share-lucky-pick-button.js` is now one **Share My Reveal** control using `navigator.share({ files })` with a compact download / copy image / copy link fallback window and `AbortError` cancellation handling.
- **Preserved:** `LuckyRevealPopup` remains the single reveal for the homepage, the free preview, and the gift route; Personal and Gift still present through `buildLuckyReveal`, and the gift route still reads the stored `giftNumbers` / `giftLuckyColor` / `giftLuckyDay`. No Stripe, checkout, webhook, gift-email, Resend, database, environment, deployment, or Little Luck Map file changed.
- **Artifacts:** `specs/075-lucky-reveal-polish/{spec,plan,tasks}.md` plus `checklists/requirements.md`; `.specify/feature.json` points there. Guard test: `__tests__/lucky-reveal-polish.test.js`.
- **Verification:** recorded in the single PR summary; browser-level share-panel testing is not possible in this container.

---

# Active Context — Milky Way Background for the Lucky Reveal (2026-11-02)

- **Task group:** `polishing`; branch `freebuff/22482c484ffb5108687ad98e`; PR left open and unmerged.
- **Verified baseline:** the Lucky Reveal experience is `LuckyRevealPopup` (`app/lucky-reveal-popup.js`), rendered by `app/homepage/HomePage.js`, the free preview switch, and `app/reveal/[revealId]/page.tsx`. Its own background was a `rgba(2, 4, 8, 0.90)` scrim with `blur(12px)`, a dialog gradient carrying a lucky-colour `radialGlow`, three animated aurora blobs, and nine `lucky-twinkle` star points. The homepage artwork is the fixed `.homepage-sky-backdrop` layer, which paints `/assets/crystal-ball-bg-desktop.{webp,avif,jpeg}` through `image-set()` at `center 45% / cover`.
- **Change:** `app/lucky-reveal-popup.js` now paints that same artwork (same three variants, same format order, same focal point, same `#02050a` base colour) on its full-viewport overlay, and the reveal-only background is gone: no aurora blobs, no twinkle stars, no `starPositions`, no `radialGlow`, and the three keyframes plus their `mixBlendMode` layers were deleted. The panel keeps a dark scrim for legibility and retains the lucky-colour border and shadow.
- **Not added:** meteorites and shooting-star effects were explicitly not required and were not added.
- **Preserved:** reveal copy, numbers, lucky colour/day cards, `ShareLuckyPickButton`, the gold map CTA, the close control, Escape handling, autofocus, animation timings, and every unrelated route. No payment, email, database, API route, dependency, or deployment file changed.
- **Artifacts:** `specs/074-lucky-reveal-milky-way-background/{spec,plan,tasks}.md` plus `checklists/requirements.md`; `.specify/feature.json` points there. New guard: `__tests__/lucky-reveal-background.test.js`.
- **Verification:** PASS — focused `__tests__/lucky-reveal-background.test.js` 5/5; full `pnpm exec vitest run` 28 files / 273 tests; `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0 (Spec Kit gate, typecheck, production build, refresh-docs 19/19); production build `.next` 297,335,723 bytes / 283.56 MiB (< 495 MB). FAIL (environment): the Playwright reveal check cannot run here — Chromium needed locally extracted NSS/NSPR plus the ATK/cairo/pango stack, then its renderer closed on the first navigation (`page.goto: Target page, context or browser has been closed`), the same container limitation recorded in earlier sessions. No browser screenshot; CI Playwright remains the confirmation path.

---

# Active Context — DevSkim SARIF Replay Gate and Fixture Repair (2026-11-02)

- **Task group:** `security`; branch `freebuff/devskim-sarif-gate`; PR #1675, left open and unmerged.
- **Fixture repair:** The original DevSkim run `41419872774` failed the suppression-filter test with 6 failures and 9 errors because the UTF-16 fixture pinned absolute source line numbers for audited `test.setTimeout(180_000)` calls. The CTA wording change in PR #1674 shifted those lines. The filter itself was not the cause.
- **Correction:** The fixture now locates the audited calls from source content and derives their current line/token positions. It retains the original validations, checks that audited calls and astral-character coverage remain present, and tests unrelated line insertions and deletions.
- **Real-SARIF replay gate:** `.github/scripts/verify_devskim_sarif_replay.py` runs the production `suppress_sarif()` against a temporary copy of the scanner's actual SARIF. It fails when an audited false positive survives, a finding outside the reviewed allowlist is removed, an approved suppression remains, a second processing pass can still suppress findings, or the SARIF/source is missing or malformed. The original SARIF is checked byte-for-byte and is never modified.
- **Workflow:** The replay gate runs in the existing DevSkim lint job between fixture tests and suppression, without `continue-on-error`. Existing triggers, permissions, concurrency, Monday schedule, and append-only report behavior are unchanged.
- **Verification on prior implementation head `95dee891`:** DevSkim scan, real-SARIF replay, suppression and uploads passed; Visual QA including the full Playwright run passed; OpenNext validation passed. The focused Python suite reported 68 tests OK, `py_compile` passed, and `./freebuff-verify.sh` exited 0.
- **Follow-up on current pre-merge head `36b54e25`:** the replay counter is reset for each audited finding, and the warning condition now also reports a replay-step failure. Four checks on that head passed: CodeQL, the PR review workflow, JavaScript/TypeScript analysis, and Actions analysis. Full DevSkim/Visual QA/OpenNext checks must be confirmed again after this merge-resolution commit.
- **Payments/email baseline:** This PR does not change checkout, verification, Stripe webhook, gift-email, delivery, database, or environment files. The previously audited prices, CAD one-time payment mode, gift amount guard, recipient validation, webhook signature verification, Redis idempotency and personal-reveal email block remain outside this PR's diff. Live Stripe test-mode checkout, live Resend delivery and deployed Cloudflare secret inspection remain unverified; no live charge or email was sent.

---

# Active Context — Customer-Facing Lucky Reveal Consolidation (2026-11-02)

- **Task group:** `creation`; branch `freebuff/a4e5adf82c1dee56b92ed6ee`; same PR #1673, left open and unmerged.
- **Homepage:** the two purchase cards are now one `homepage-offer-featured` **Lucky Reveal** card with a single **Choose a Lucky Pick** button and one handler (`openLuckyRevealCheckout`). The gift artwork is retained, not deleted; merge, gift, and price copy live on the one card.
- **Selection popup:** `app/checkout-modal.jsx` gained a `lucky_reveal` mode. The existing 6 Pick / 7 Pick fieldset is joined by a delivery fieldset (`Personal Reveal — CAD $1.00`, `Gift Reveal — CAD $1.99`) that resolves into the hidden `checkoutType`, so the paid form still posts `lucky_pick` or `gift_package`. Recipient fields render only for the resolved gift type, and the modal shows the selected amount. Direct `lucky_pick`/`gift_package`/`tip` modes are unchanged.
- **Preserved:** Stripe labels (Lucky Pick / Lucky Pick Gift / Tip Jar), amounts 100/199, `mode: 'payment'`, `cad`, metadata, callbacks, gift recipient validation and delivery safeguards, the Tip Jar, the free preview switch (now including the unified popup), and every unrelated homepage section.
- **Future map:** an empty zero-height `<div id="lucky-map" className="homepage-map-slot" aria-hidden="true" />` sits directly below the reveal section and above the Tip Jar. No map, geolocation, IP lookup, province detection, schema, or location collection was added.
- **Tests:** `tests/visual/lucky-reveal-selection.spec.ts` (single card, map slot, four posted combinations, keyboard, reduced motion), updated `__tests__/components/CheckoutModal.test.jsx`, `__tests__/security-payment.test.js`, `__tests__/stripe-product-alignment.test.js`, and `gold-cta.spec.ts` (nine to eight homepage CTAs).
- **Not verified:** no live Stripe test-mode purchase and no real gift email; browser results are recorded in the PR report.

---

---

# Active Context - Official Checkout Labels and Dead Route Cleanup (2026-11-02)

- **Task group:** `creation`; same branch and PR as the Stripe alignment work (PR #1673), left open and unmerged.
- **Checkout labels:** `product_data.name` in `app/api/checkout/route.js` is now "Lucky Pick", "Lucky Pick Gift" and "Tip Jar". Amounts (100/199), `cad`, `mode: 'payment'`, metadata, callbacks, the gift `amount_total` guard and the customer-entered tip are unchanged. The website keeps "Lucky Reveal" / "Lucky Reveal Gift Edition"; no website heading, modal title or reveal component was renamed.
- **Dead route file:** `app/api/verify-session/route.js` was a 0-byte tracked file (blob e69de29b) beside `route.ts`. Its history shows `04dfc68d` and `6f25e8c5` both intended to remove the duplicate placeholder, but `6f25e8c5` only deleted its one-line comment and left an empty blob. The compiled route `.next/server/app/api/verify-session/route.js` was 24,011 bytes with sha256 7aaf4f9b... before the removal and byte-identical after it, and contains `route.ts` strings, so `route.ts` is the implementation that ships. Only the empty file was deleted; `route.ts` is untouched.
- **Regression guards:** the official Checkout labels are pinned in `__tests__/stripe-product-alignment.test.js` and `__tests__/security-payment.test.js`, alongside an assertion that `route.ts` exists and no `route.js` sits beside it.
- **Verified:** focused 4 files / 44 tests PASS; full suite `27 files / 261 tests` PASS; `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0 (Spec Kit gate, typecheck, build, refresh-docs 19/19); production build 337,254,590 bytes / 321.6 MiB (< 495 MB); after removal the build still emits `/api/verify-session` with a byte-identical compiled chunk.
- **Not verified:** live Stripe test-mode checkout for any of the three products, Stripe Dashboard product records, a real Resend delivery, and browser click-through.

---

# Active Context - Stripe Product Alignment (2026-11-02)

- **Task group:** `creation`; same branch and PR as the unified reveal work (PR #1673), left open and unmerged.
- **Verified baseline:** `app/api/checkout/route.js` defines every product inline with `price_data`; the application references no stored Stripe product or price ID, so Stripe Dashboard product/price records could not be inspected and are not claimed as verified.
- **Authorized correction:** Gift Edition `unitAmount` 299 -> 199, with the single matching `amount_total` guard in `validateGiftSession`, the homepage and modal gift price copy, and three test expectations moved together. Standard Lucky Pick was already CAD $1.00 and is unchanged; `app/luck-map.js` independently requires `amount_total === 100` for the Lucky Pick purchase, which confirms $1.00.
- **Tip Jar:** the Stripe product name is now "Tip Jar"; the amount stays customer-entered (`tipAmount` converted to cents) with its $0.50 minimum, and the modal states the suggested CAD $5.00.
- **One-time only:** the single `stripe.checkout.sessions.create` call uses `mode: 'payment'` and `currency: 'cad'`; no subscription mode, `subscription_data`, recurring price, or stored price ID exists in the application.
- **Naming difference reported, not silently changed:** the Stripe and website labels remain "Lucky Reveal" / "Lucky Reveal Gift Edition" per the concurrent consolidation request, so the legacy names "Lucky Pick" / "Lucky Pick Gift" were not applied to customer copy. The owner can decide whether to rename.
- **Verified:** focused suites 5 files / 47 tests PASS; full `pnpm exec vitest run` 27 files / 259 tests PASS; `pnpm exec tsc --noEmit` exit 0; `./freebuff-verify.sh` exit 0 (Spec Kit gate, typecheck, build, refresh-docs 19/19); production build 337,238,784 bytes / 321.6 MiB (< 495 MB).
- **Not verified:** a live Stripe test-mode checkout for any of the three products, the Dashboard product/price records, and browser click-through - no Stripe keys, no browser session, and real charges are forbidden.

---

# Active Context — Unified Lucky Reveal Experience (2026-11-02)

- **Task group:** `creation`; branch `freebuff/a4e5adf82c1dee56b92ed6ee`; target `main`; PR left open and unmerged.
- **Task:** consolidate the two paid reveal products into one shared Lucky Reveal system with two purchase options — **Lucky Reveal** (website results only) and **Lucky Reveal Gift Edition** (same results, also emailed).
- **Verified price discrepancy:** the work request described the standard option as $1.99, but `app/api/checkout/route.js` charges `unitAmount: 100` (CAD $1.00) and the homepage advertised "CAD $1". The request and `AGENTS.md` §5 forbid altering live prices, so $1.00 was preserved and the discrepancy is reported in the PR instead of being silently changed.
- **Consolidation:** `app/lucky-reveal.js` is now the single source for reveal generation, the lucky colour/day vocabulary, game rules, number validation, and the popup data mapping (`buildLuckyReveal`, which returns `null` rather than inventing results). `app/gift-email.js` lost its duplicate `generateNumbers`, `pickOne`, colour/day arrays, and reveal generator; `createGiftReveal` now derives from `createLuckyReveal`. `app/homepage/HomePage.js` and `app/reveal/[revealId]/page.tsx` both present through `buildLuckyReveal`, and the reveal page's fabricated fallback reveal was removed. The gift banner now depends on the server-reported `giftDeliveredAt` instead of a URL parameter.
- **Purchase options:** metadata and success callbacks are unchanged. Under the follow-on Stripe alignment request (2026-11-02; official setup: Lucky Pick CAD $1.00, Lucky Pick Gift CAD $1.99, Tip Jar suggested CAD $5.00 with a customer-entered amount) the Gift Edition `unitAmount` was realigned 299 -> 199 together with the single matching `amount_total` guard in `validateGiftSession` so paid gifts are still accepted, the tip jar's Stripe product name became "Tip Jar" (amount still customer-entered, $0.50 minimum), and the tip modal states the suggested CAD $5.00. All three remain one-time `mode: 'payment'` in CAD and reference no stored Stripe price or product IDs.
- **Preserved safeguards:** webhook gating on `gift_package`, `validateGiftSession` (paid, type, 199, cad), Redis `SET NX` delivery lock with ownership-token release, `giftDeliveredAt` idempotency, persisted pending payload, stable `Idempotency-Key: gift-<sessionId>`, 23-hour retry window, and the separate review-required state.
- **Verified:** `pnpm exec tsc --noEmit` exit 0; `pnpm exec vitest run` 26 files / 252 tests PASS; focused reveal/payment suites 53 tests PASS; `./freebuff-verify.sh` exit 0 (Spec Kit gate, typecheck, production build, refresh-docs 19/19); production build 297,486,461 bytes / 283.71 MiB (< 495 MB); final diff audited (14 files: 10 modified, 4 added).
- **Not verified:** no live Stripe test-mode purchase, no real Resend send (no keys in this environment), and no browser-level click-through. Payment and email behaviour is covered by the existing mocked delivery suite plus the new regression tests.
- **Artifacts:** `specs/073-unified-lucky-reveal/{spec,plan,tasks}.md`; `.specify/feature.json` updated.

---

# Active Context — Enable the Public Preview in Production (2026-11-01)

- **Task group:** `troubleshooting`; branch `freebuff/enable-production-preview-switch`; target `main`.
- **Follow-up to PR #1671:** PR #1671 is already merged. A live production check found the preview button absent because the merged `revealTestConfig.js` set `REVEAL_TEST_MODE = process.env.NODE_ENV !== 'production'`, which evaluates to false in production.
- **Owner authorization:** enable the public preview temporarily in production; the owner intends to switch it off again after the preview/recording period.
- **Correction:** change only the existing switch to the literal `true`; preserve the allowlist for `lucky_pick` and `gift_package`. The tip jar remains excluded. The preview remains a separate button outside the paid checkout form.
- **Regression protection:** update `__tests__/security-payment.test.js` to assert the switch is explicitly true and not gated by `NODE_ENV`.
- **Spec Kit:** reuse `specs/072-free-preview-reveal/{spec,plan,tasks}.md`; add a follow-up production visibility note and task entries. No duplicate feature directory.
- **Verification status:** implementation changes are committed on this branch. Focused tests, `./freebuff-verify.sh`, production build measurement, final diff audit, and PR-head CI remain pending until a runnable repository workspace/CI is available.
- **Scope:** no payment/API routes, Stripe, gift delivery/email, database, secrets, deployment configuration, styling, or reveal artwork/animation changes.

---

# Active Context — Free Preview Reveal in the Checkout Modals (2026-11-01)

- **Task group:** `creation`; branch `freebuff/a593ca30d6b549f6e9249fcc`; target `main`; PR left open and unmerged.
- **Verified baseline defect:** `app/test-tools/reveal-testing/revealTestConfig.js` exported `REVEAL_TEST_MODE = false` and `canBypassRevealPayment()`, which `app/checkout-modal.jsx` used to intercept the paid `action="/api/checkout"` submit and, for gifts, to `POST /api/send-gift` before revealing. That is exactly the coupling a free preview must not have.
- **Implementation:** `REVEAL_TEST_MODE` is now the single public preview switch (enabled) read by `canPreviewReveal(type)`, limited to `lucky_pick` and `gift_package` so the tip jar can never expose a preview. The Lucky Pick and Gift modals render a separate `type="button"` **Preview Reveal — FREE** control outside the checkout `<form>`, plus a note that previews take no payment and send no emails. `HomePage.js` receives `onPreviewReveal` and reuses the existing `createLuckyReveal()` / `LuckyRevealPopup` presentation, so artwork, animation, and copy are unchanged.
- **Paid flow preserved:** `requestRevealAccess` is back to the original duplicate-submit guard only; the form still posts to `/api/checkout` with no `noValidate` override and no JS interception. No Stripe, verification, gift-delivery, database, secret, or deployment file was touched.
- **Also removed:** the tracked stale `app/checkout-modal.jsx.orig`, which duplicated the removed `/api/send-gift` preview bypass.
- **Artifacts:** `specs/072-free-preview-reveal/{spec,plan,tasks}.md`; `.specify/feature.json` updated. New `__tests__/components/CheckoutModal.test.jsx`; `__tests__/security-payment.test.js` updated with the switch semantics and a source guard.
- **Browser verification (2026-11-01):** Playwright against the local dev server (1440x900, DPR 2) passed 22/22 checks: the control is visible and labelled in both eligible modals, is `type="button"` outside the checkout form, is absent on the tip jar, keeps the paid submit button, and opens `LuckyRevealPopup` with no request to `/api/checkout`, `/api/send-gift`, or Stripe, no `submit` event, and no navigation (only the popup JS chunk loads). Evidence: `artifacts/preview-reveal-check.cjs`, `artifacts/preview-reveal-report.json`, `artifacts/preview-reveal-*.png`. Chromium here needed locally extracted NSS/NSPR plus a fontconfig/DejaVu-Liberation stack in `.local-browser-libs/` (environment only, not product code).
- **Open product decision:** the reused reveal panel still shows its paid "PAYMENT COMPLETE" eyebrow during a free preview. Left unchanged because the task preserves the reveal design (FR-008); it needs an owner decision.

---

# Active Context — Turnstile Suggestion Box Loading Delay (2026-11-01)

- **Task group:** `troubleshooting`; branch `freebuff/1a7d57e47625ce6441d412f1`; target `main`; PR left open and unmerged.
- **Verified cause (not assumed):** the pinned `@marsidev/react-turnstile@1.6.1` loader appends `.../turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit` from a **mount effect**, and `TurnstileField` is statically imported by the `'use client'` homepage, so the fetch cannot start until React hydrates. The built homepage document contained **zero** matching preload hints (only the layout `preconnect`). Chain: `hydration -> mount -> script fetch (2 hops) -> Cloudflare challenge`.
- **Verified history:** PR #1568's preload URL matches the pinned loader byte-for-byte, so it was not a URL-mismatch bug. `7ab4b305` deleted it for render-path competition ("free up the critical render path"); its PageSpeed plan optimised only the PageSpeed side, so the reported latency was never addressed. `1e2fe117` inverted the Playwright spec to assert absence.
- **Measured endpoint:** configured URL -> `302` (`max-age=300, public`) -> `/turnstile/v0/g/<build>/api.js` -> `200`, `86,732` bytes, `cache-control: max-age=31536000, public`. The one-year cache lifetime is why an early hint survives a slow hydration instead of being a wasted download.
- **Implementation:** `app/page.js` emits `preload(TURNSTILE_SCRIPT_URL, { as: 'script', fetchPriority: 'low' })`. Low priority is the correction over PR #1568: the hint must not displace the LCP image or the route's own CSS/JS, which is the objection that removed it. `preload()` fetches without executing, so `onloadTurnstileCallback` still exists before the wrapper injects the executing tag.
- **Preserved:** `TurnstileField` callbacks/state machine, site-key lookup, hidden token field, server-side Siteverify, hostname/action validation, rate limiting, spam protection, form behaviour, styling. No dependency, environment, Cloudflare or API-route change.
- **Artifacts:** `specs/041-turnstile-early-preload/{spec,plan,research,tasks}.md` reused and rewritten; `.specify/feature.json` points there. No duplicate feature directory created.
- **PR / review:** [#1670](https://github.com/davidcollier77-code/Luckypickcanada/pull/1670), head `1fdf0fcd`, open and unmerged. Gemini actually reviewed that exact head (model `gemini-3.5-flash-lite`, submitted 18:20:54Z) with **0 red / 0 yellow findings**; its status line is `REVIEW INCOMPLETE — NOT VERIFIED` solely because its own context budget shortened retrieved source for `app/page.js`, `HomePage.js` and `Hero.js` — a coverage disclosure, not a defect. Amazon Q reported no blocking defects. CI: DevSkim PASS, Validate OpenNext build artifacts PASS, Visual QA and Amazon Q still running at the time of writing.
- **Not verified:** Playwright spec execution — Chromium cannot start here (`libnspr4.so` missing, no root, package install refused); CI Visual QA owns it. Real-device script-fetch and challenge-completion timing remain PENDING.

---

# Active Context — Gemini Reviewer Instruction Consolidation (2026-11-01)

- **Task group:** `deep-dive`; branch `freebuff/d83726e9f4ebf83f38ce1768`; target `main`; PR open and unmerged.
- **Change:** new root-level `GEMINI_REVIEWER.md` (Amazon Q A/B/C structure) is Gemini's single authoritative PR-review instruction file. `.gemini/rules/luckypickcanada.md` was deleted after a repository search confirmed the workflow and reviewer tests were its only consumers; the workflow trusted-file guard now covers `GEMINI_REVIEWER.md`.
- **Context reduction:** manifest parsing, task-group classification, reference/skill selection, snapshot loading, document assessments and the document report were removed from `gemini-reviewer.cjs` and `gemini-autofix.cjs`. Review context is now the instruction file, the PR description, changed patches and bounded retrieved source.
- **Preserved:** changed-code/source retrieval and coverage disclosure, batching, adversarial pass, schema validation and JSON recovery, three-model fallback, statuses and formatting, opt-in suggestions, permissions and trusted-base execution.
- **Verified:** `node --check` PASS on both scripts; focused reviewer suites PASS; full `pnpm exec vitest run` PASS (24 files / 224 tests); `./freebuff-verify.sh` exit 0 (Spec Kit gate, `tsc --noEmit`, build, refresh-docs 19/19); production build 315,495,656 bytes / 300.88 MiB (< 495 MB); final diff audited.
- **Not verified:** PR-head GitHub Actions PENDING; live Gemini review BLOCKED — no `GEMINI_API_KEY` in this environment.
- **Artifacts:** `.specify/features/gemini-review-context/{spec,plan,tasks}.md` reused and updated; `.specify/feature.json` points there.

---

# Active Context — Gemini Reviewer Reliability and Interface Simplification (2026-11-01)

- **Task group:** `deep-dive`; branch `freebuff/f5a6b00e39d1cb2bea65c13b`, target `main`, PR #1665 open and unmerged.
- **Verified root cause of the #1661 manual-trigger failure:** the owner posted `@gemini full review` at 09:53:26Z; `main` was `7dcdf469`, whose `.docs/manifest.json` did not parse (line 408 col 5); the reviewer parsed that file at module scope (`gemini-reviewer.cjs:67`), so the throw preceded `main()` and its `.catch` reporter (`:1585`); the run failed with no PR output. PR #1664 repaired exactly those characters 32 minutes later.
- **Implementation:** `loadDocumentManifest()` degrades to a disclosed coverage gap; `if: failure() && steps.review.outcome == 'failure'` reports failures on the PR; `parseFullReviewCommand()` reads the command from a real comment and answers unsupported `@gemini` commands visibly; verdicts are red (critical/high), yellow (medium/low), green only when complete with coverage, neutral when incomplete; `sanitizeOverview()` drops a stray leading severity marker when no finding exists; two categories with one checkbox each and exactly two fix controls (Fix Selected, Fix All); `applyAutoFix` re-checks the PR head immediately before posting.
- **Live evidence:** the manual command on PR #1665 started run 41303732542 and published review 5727909966 at commit `7725d9ec…`, equal to the PR head. The workflow runs trusted base-branch code, so that review still shows the old interface; the changed code is exercised live only after merge.
- **Historical reliability (#1639–#1642):** Amazon Q reported 6 confirmed findings (all three on #1639 repaired in `95e86bc6`; the #1642 conversion gap and committed dev artifacts are real). Gemini reported 0 findings at the same heads, missed real defects on #1639 and #1642, and had two failed passes. Gemini is not yet demonstrated as a dependability-equal replacement.
- **Detection measurement (specs/071-gemini-reviewer-reliability/detection-parity.md):** rules pre-registered, baseline measured from published reviews plus repair commits. Amazon Q 7 findings (6 substantiated, 1 false positive; 5/5 defects in its reviewed heads). Gemini 3 published findings covering 2 confirmed defects, 0 false positives, 2 of 6 defects and 2 failed passes, one root cause published three times on #1661. Gemini's catches are syntactic (stray CSS selector, missing JSON comma); its misses are cross-function logic (#1639 unapplied fix, #1656 stale log). The prospective ten-PR cohort is PENDING and cannot start until the reviewer change is live on main.
- **Pre-publication evidence gate:** `normalizeFindings()` publishes a finding only when its cited path is in the reviewed batch and its cited line is a changed line; every other citation is discarded, recorded, and disclosed by path and line in the coverage notes, which forces the review to the neutral status instead of letting unverifiable evidence read as a clean review. Consequence: a finding about a deleted file that cites a line number is discarded and disclosed, because deleted lines are not changed lines.
- **Verified:** focused reviewer suites PASS (4 files); full `pnpm vitest run` PASS; `pnpm exec tsc --noEmit` PASS; `./freebuff-verify.sh` PASS; production build 330,154,044 bytes / 314.86 MiB (< 495 MB).
- **Not verified:** live GitHub checkbox interaction for Fix Selected / Fix All; detection parity with Amazon Q.
- **Post-merge (2026-11-01):** PR #1665 merged as `121913171a093b81e74e845719378d1a15fcbb41` at `12:54:22Z`; the reviewer on `main` now carries `clipSourceWithAnchors` and `SCOPE_AND_CLAIM_GUIDANCE`. Added `REVIEW_RESPONSE_SCHEMA` enforcement plus `validateReviewPayload()`, because a payload that parsed without a `findings` array previously became a zero-finding review. Live model replay stays BLOCKED: `GEMINI_API_KEY` is unset in the development environment. Cohort window opens after `1219131`; 0 of 10 rows, nothing merged since.
- **Cross-function/scope gap (2026-11-01):** verified causes — `clipSource()` kept head 70% + tail 30% and dropped the middle band holding the changed hunks (#1642 lines 754-881, #1656's long script); PR-description claims were restated as fact (#1639 overview); no goal-completeness, artifact, or benchmark-fairness instruction existed. Fixed with `clipSourceWithAnchors()` (anchored on `addedLines(file.patch)`, ±40-line windows, bounded head/tail, `clipSource` fallback) and `SCOPE_AND_CLAIM_GUIDANCE` (claims are not evidence; unanchorable defects use line null so the evidence gate discloses them; survivors, scratch artifacts, unfair benchmarks are findings). Reverse-dependency discovery deliberately not added — no investigated miss required it. Counter-evidence: at `d2603e29` the reviewer found 2 real HIGH defects on #1642 that Amazon Q never reported.
- **Artifacts:** `specs/071-gemini-reviewer-reliability/{spec,plan,tasks}.md`; `.specify/feature.json` updated.

---

# Active Context — Site-Wide Visual Polish (2026-11-01)

- **Task group:** `polishing`; branch `freebuff/016113030bd542c07a547bd2`; target `main`; PR left open and unmerged.
- **Verified defects:** `var(--font-header, serif)` in `themes/default/homepage.css:23` resolved to generic serif (token declared only inside `CrystalBall.module.css`), so homepage card headings rendered in Times while sibling headings used Cinzel; `/privacy` and `/terms` were the only routes on the stock Tailwind palette (`text-blue-600` links 3.91:1, `text-gray-500` meta 4.18:1 on `#02070c`); the 569x464 Lucky Map artwork is shown at up to 704px with `image-rendering: crisp-edges` (nearest-neighbour upscaling).
- **Implementation:** card headings use `var(--lpc-display)`; legal routes use new `legal-*` classes styled from existing brand tokens in `themes/default/default.css` (copy, structure, hrefs, robots unchanged); `.official-map-image` uses `image-rendering: auto`.
- **Verified:** `tsc --noEmit` exit 0; `pnpm test` 23 files / 177 tests; `./freebuff-verify.sh` exit 0; rendered computed styles confirm Cinzel headings, gold legal links (15.99:1), and `image-rendering: auto` at 569x464 -> 702x572; no horizontal overflow; final build 470,088,738 bytes / 448.31 MiB (< 495 MB).
- **Playwright:** full suite 52 passed / 5 failed; the same specs re-run with the diff -> 12/12 passed; stashed baseline -> 10 passed / 2 failed with a different set. Container flakiness, not a deterministic regression.
- **Preserved:** starfield/Milky Way, Lucky Meter, card reveal, Crystal Ball, paid reveals, Lucky Map/Stories artwork and behaviour, AVIF-first + WebP fallback, copy, navigation, animations, dependencies.
- **Artifacts:** `specs/069-sitewide-visual-polish/`; `.specify/feature.json` updated.
- **Not verified:** axe-core scan (no runner configured); owner PR review.


---

# Active Context — Shared Engineering Practices Routing (2026-11-01)

- **Selected task group:** `deep-dive` — cross-group documentation and updater routing.
- **Branch / PR:** `freebuff/gemini-api-skill-conditional-routing-20261101`, PR #1662; retain the existing open PR and leave it unmerged.
- **Owner authorization:** explicitly authorized adding the shared Engineering Practices reference to all task groups and configuring the documentation updater to include it.
- **Reference:** Google Engineering Practices, “What to Look For in a Code Review,” sourced from `https://raw.githubusercontent.com/google/eng-practices/master/review/reviewer/looking-for.md` under CC BY 3.0. The upstream repository was archived on 2025-11-21; its published reference remains available but is no longer actively maintained.
- **Routing:** manifest source ID `/google/eng-practices` is included in all eight task groups. The updater should create the canonical snapshot in Creation and symlink it into the other seven group directories. Each group instruction points to its matching `.docs/<group>/_google_eng-practices.md` path.
- **Use policy:** cross-cutting, optional guidance; consult when materially useful, not mandatory reading for every task. `AGENTS.md`, project conventions, and selected group instructions remain authoritative.
- **Spec Kit artifacts:** `specs/068-shared-engineering-practices-routing/{spec,plan,tasks}.md`; `.specify/feature.json` points to this feature.
- **Verification:** manifest structure and updater naming/symlink behavior inspected. The documentation refresh itself has not been run in this session; owner plans to trigger it after this PR update. Do not claim snapshot generation or successful updater execution until that run is observed.

---

# Active Context — Conditional Gemini API Developer Skill Routing (2026-11-01)

- **Selected task group:** `deep-dive` — repository-wide governance, documentation routing, and Gemini reviewer conditional-loading correction.
- **Branch:** `freebuff/gemini-api-skill-conditional-routing-20261101`; target `main`; leave the PR open and unmerged.
- **Owner authorization:** explicitly authorized updates to repository governance, existing group instructions, reference routing, reviewer automation, tests, Spec Kit artifacts, and Memory Bank context.
- **Requested policy:** the Gemini API Developer Skill is not a requirement for every coding task or every PR review. It remains a conditional specialist reference for work that directly calls, configures, or integrates with the Gemini API/SDK.
- **Group routing:** Creation, Troubleshooting, and Deep-dive only. Other task groups use their normal instructions and do not load the skill. Gemini CLI and the general Gemini API overview remain separate conditional references.
- **Reviewer behavior:** select the skill from changed-code evidence, not title/body wording, documentation mentions, test fixtures, or routine Gemini reviewer/autofix prompt changes. Ordinary PRs continue without it; genuinely API-specific reviews receive it or disclose a coverage gap and stop.
- **Spec Kit artifacts:** `specs/067-gemini-api-skill-conditional-routing/{spec,plan,tasks}.md`; `.specify/feature.json` points to this feature.
- **Verification:** source and routing review completed. Focused tests, `./freebuff-verify.sh`, production build measurement, and current-head GitHub Actions are pending; this connector session does not provide a checked-out shell workspace. No test or build success is claimed.

---

# Active Context — DevSkim Playwright Offset Remediation (2026-11-01)

- **Task group:** `security` — finish the interrupted DevSkim Code Scanning remediation for the two gold CTA Playwright specs.
- **Branch:** `freebuff/2ace85ab2dc71e6e9586f8de`; target `main`; leave the PR open and unmerged.
- **Recovery:** no local branch, stash, dangling commit, remote branch, or working-tree change carried an unfinished diff for this task. The recoverable state was the committed filter, the 14 ledger rows, and the two specs; nothing was discarded or restarted.
- **Verified root cause (real scanner):** DevSkim 1.0.100 reports `charOffset`/`charLength` in **UTF-16 code units**. For `tests/visual/sitewide-gold-cta.spec.ts` (7 astral characters) the reported offset is 5–7 units ahead of the Python code-point index, so `_absolute_source_span()` rejected all six results. Both spec paths were also absent from `KNOWN_CONTEXTUAL_SUPPRESSION_FILES`, so even the four ASCII-only `gold-cta.spec.ts` results were never evaluated by `process_sarif()`.
- **Implementation:** added `_code_point_offset_from_utf16_offset()` and converted offsets once inside `_absolute_source_span()`; added the two exact audited spec paths to the existing contextual allowlist. No rule disabled, no glob added, no workflow/permission/application change.
- **Verified:** 60 focused Python tests PASS; real-scanner replay suppresses 6/6 sitewide and 4/4 gold results with 0 remaining; full-repository scan 148 results, 147 removed, 1 genuine finding remains (`playwright.config.ts:31`); `./freebuff-verify.sh` PASS; build 420,504,416 bytes / 401.02 MiB.
- **FAIL (environment) — Playwright:** both specs executed. Default config 3 passed / 27 failed; desktop-only sitewide 2 passed (Lucky Map, About) / 4 failed. All failures are `page.goto: Target page, context or browser has been closed` on `/` and `/crystal-ball` (local Chromium renderer crash). The full-Chromium channel cannot launch here. CI Playwright remains the confirmation path.
- **Ledger:** all 14 rows for the two specs removed only after the corresponding results were proven suppressed; title and append marker preserved.
- **Artifacts:** `specs/066-devskim-playwright-offset-remediation/{spec,plan,tasks}.md`; `.specify/feature.json` updated.
- **Not verified:** GitHub Code Scanning alert objects (no token in this environment); browser-level PASS.

---

# Active Context — PR #1659 Severity Indicator and Review Edge-Case Fixes (2026-10-31)

- Task group: deep-dive — respond to the latest Amazon Q review and owner feedback on the Gemini PR review indicators.
- Branch / PR: freebuff/c41502670faee62cc33e0e0a, https://github.com/davidcollier77-code/Luckypickcanada/pull/1659; keep open and unmerged.
- Owner feedback: the severity key is correct, but the red dot appears even when the only findings are medium/low or when the red category is empty. The overall verdict is now severity-aware: red for critical/high, yellow for medium, blue for low-only, yellow for coverage-only gaps, and green when no findings/gaps exist. Empty categories no longer show their severity marker.
- Amazon Q fixes: deduplicate empty-title findings at the same path/line; reject unmatched JSON closing brackets during truncated-tail recovery; map the test fixture's icon to its severity; and assert compact review length does not exceed MAX_REVIEW_BODY_CHARS.
- Compact-output hardening: prompts are omitted in compact mode; title/path/problem/impact text is clipped using a shared per-finding budget; every finding checkbox is retained. Runtime stress probe with 18 maximum-sized findings measured 44,961 characters against the 60,000-character limit.
- Verification before this follow-up: previous head 257b28b passed unit tests, TypeScript, Spec Kit verification, CodeQL, DevSkim, Next.js build, 495 MiB size gate, OpenNext, and Wrangler. New follow-up code has passed in-session syntax and runtime probes; current-head CI remains pending.
- Spec Kit artifacts: specs/065-gemini-reviewer-quality/{spec,plan,tasks}.md updated. 

---

# Active Context — PR #1659 Review-Driven Correctness Hardening (2026-10-31)

- Task group: deep-dive — independently verify Amazon Q and CodeQL findings against the latest PR head, then repair confirmed reviewer/autofix regressions.
- Branch / PR: freebuff/c41502670faee62cc33e0e0a, https://github.com/davidcollier77-code/Luckypickcanada/pull/1659, target main; leave open and unmerged.
- Current review corrections: restore the missing extractReviewState function declaration; repair the truncated formatFixOutcomes helper; escape backslashes before pipes and normalize CR/LF; encode --> / --!> in hidden review-state JSON with the JSON Unicode escape sequence so parsing restores exact text; remove lossy curly-single-quote normalization; and restrict same-line deduplication to exact normalized-title duplicates.
- Regression coverage added: review-state round trips and legacy comment parsing, outcome-table escaping, Unicode apostrophe preservation, undici timeout retry classification, and preservation of similar-but-distinct same-line findings.
- Preserved: Gemini model chain/provider/key handling, workflow permissions and triggers, Amazon Q configuration, opt-in-only suggestions, no branch edits/commits from autofix, user-facing product behavior, and all site visuals/assets.
- Verification: source syntax was checked in the editing runtime; focused/full Vitest, typecheck, ./freebuff-verify.sh, build-size measurement, and current-head GitHub Actions remain pending until actually executed.
- Spec Kit artifacts: existing specs/065-gemini-reviewer-quality/{spec,plan,tasks}.md extended; .specify/feature.json unchanged.
- Not verified: live Gemini replay against PR #1656 remains pending.

---

# Active Context — Gemini Reviewer Quality, Coverage, and Selected-Finding Workflow (2026-10-31)

- **Selected task group:** `deep-dive` — cross-file investigation of the Gemini reviewer pipeline, its skill, and its comparison against Amazon Q on real merged PRs.
- **Branch:** `freebuff/c41502670faee62cc33e0e0a`; target `main`; leave the PR open and unmerged.
- **PR:** [#1659](https://github.com/davidcollier77-code/Luckypickcanada/pull/1659) — open and unmerged for owner review.
- **Verified comparison (PR #1656, 84 files):** Amazon Q's duplicate-fetch-log and missing-`.freebuff/`-denylist findings were real and were fixed in the PR's final commit `038b5cf9`. Gemini reviewed the same PR with zero findings. Q's `eval()` concern is real but is test-only `eval` of the repository's own extracted source (robustness, not an exploitable defect). Q's `return`/`builtin exit` concern is not a defect: measured behaviour exits non-zero when executed and when sourced.
- **Implementation:** three finding categories (red/yellow/additional) with a checkbox per finding; functional Select All / Clear Selection / Fix selected / Fix all including `@gemini select all`, `@gemini select none`, and `@gemini fix selected`; independent validation of selected findings with fixed/rejected/unresolved tracking; budget-aware source retrieval with named complete/clipped/patch-only coverage disclosure; JSON recovery and transient-failure retry classification; root-cause deduplication; bounded review-body size.
- **Preserved:** `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.5-flash-lite`, provider endpoint, key handling, retry/fallback order, workflow triggers, permissions, trusted-base checkout, and Amazon Q in full.
- **Verified:** focused reviewer tests PASS; full suite PASS (23 files / 170 tests); `tsc --noEmit` PASS; `./freebuff-verify.sh` PASS with build artefacts 330,129,985 bytes / 314.84 MiB (< 495 MB); `node --check` PASS on both scripts.
- **Not verified:** a live Gemini review or GitHub replay of PR #1656 — this workspace has no `GEMINI_API_KEY` and no GitHub token.
- **Spec Kit artifacts:** `specs/065-gemini-reviewer-quality/{spec,plan,tasks}.md`; `.specify/feature.json` points to it.
- **Outstanding:** owner review of the open, unmerged PR; live-model acceptance remains pending.

---

# Active Context — Freebuff Agent Governance Migration (2026-10-31)

- **Selected task group:** `deep-dive` — audit and migrate the repository's coding-agent instructions, documentation refresh protection, Spec Kit paths, and verification tooling.
- **Branch / PR:** `chore/library-document-routing`, [PR #1656](https://github.com/davidcollier77-code/Luckypickcanada/pull/1656) against `main`; leave open and unmerged.
- **Change:** Retired `jules.google/docs` and `developers.google.com/jules/api` from the manifest and removed both snapshots from all eight task groups. `scripts/refresh-docs.js` now strips restored IDs and removes stale snapshots/dangling symlinks, with regression coverage in `scripts/test-refresh-docs.js`.
- **Freebuff migration:** moved the active `.jules/` instruction and Spec Kit command directory to `.freebuff/`; updated `AGENTS.md`, Spec Kit integration settings/manifest, scheduled updater/rebase scripts, Constitution, pre-commit hook, updater documentation, and verification script/callers.
- **Reference rules:** The Google `gemini-api-dev` Developer Skill is fetched from the upstream GitHub source and routed through all eight task groups; Freebuff must read it for every coding task and apply API-specific procedures when relevant. Gemini's API overview is kept as an optional Creation reference, and Gemini CLI remains conditional.
- **Gemini reviewer:** The same skill is injected into automatic reviews, full/adversarial review prompts, and targeted fix suggestion prompts. Missing skill snapshots fail closed instead of silently reviewing without the required guidance.
- **Deliberate exclusion:** `workers/jules-bridge` and its deployment workflow remain unchanged because they are a separate production integration that calls the Jules API directly and need a confirmed replacement.
- **Verification:** PASS — Git tree contains no `.jules/` paths or retired snapshots. PASS — manifest inspection confirms Gemini API remains routed to all eight task groups and Gemini CLI routing remains. PENDING — focused updater/Spec Kit tests, `./freebuff-verify.sh`, and current-head CI; no local shell execution has been claimed.
- **Spec Kit artifacts:** `specs/064-freebuff-agent-migration/{spec,plan,tasks}.md`.
- **Outstanding:** complete final-head test and CI review, inspect final diff, update PR body with verified outcomes. Do not merge.

---

# Active Context — Site-wide Emblem-Matched Gold CTA (2026-10-31)

- **Task group:** `polishing`; branch `freebuff/619772a1044e46bd6dabae55`; PR left open and unmerged.
- **Change:** `app/globals.css` owns one global `.gold-3d-btn` treatment (measured ramp `#fff2a8`/`#fbe59a`/`#e8c970`/`#dcae4e`/`#c8942c`/`#b8801f`, `0 3px 0 #8a550c` raised edge, hover lift, press-down, shared sheen and pulse, reduced-motion fallback, `.gold-cta-emoji`). The duplicated homepage-scoped block was removed and legacy gold gradients recoloured. All site-wide primary gold CTAs adopt it with their assigned emoji (homepage ×9, Lucky Map ×5, card reveal, Daily Resonance, Crystal Ball ×2, checkout submit, reveal-popup map CTA, share CTA).
- **Colour derivation (measured, not assumed):** `public/assets/golden-maple-leaf.webp` saturated gold pixels gave specular `#fff2a8` (p99), highlight `#fbe59a` (p95), light `#e8c970` (p65), dominant `#e0b860`/`#d8b058`, dark `#c08f27` (p05); the emblem SVG supplies `#b86f12`/`#89500a`/`#714006`. The supplied reference image was absent from the worktree, so the emblem ring named as the primary reference was sampled directly.
- **Verified:** typecheck exit 0; 22 files / 152 tests; `./jules-verify.sh` exit 0; build 330,131,271 bytes / 314.84 MiB; served homepage has 9 gold CTAs with the 9 assigned `aria-hidden` emoji, 2 shimmer overlays and 2 glow pulses; compiled CSS has the ramp/edge/hover/press/reduced-motion rules; rendered Chromium computed styles confirm the measured gradient and `rgb(138, 85, 12) 0px 3px 0px` edge on `/map` (desktop) and `/lucky-meter` (desktop, mobile-390, mobile-412); the `/about` secondary CTA stays non-gold.
- **BLOCKED (environment):** the container Chromium renderer crashes on `/` and `/crystal-ball`, reproduced with this branch stashed, so homepage hover/press screenshots and Crystal Ball rendering are unverified here. CI Playwright is the confirmation path.
- **Artifacts:** `specs/064-sitewide-gold-cta/{spec,plan,tasks}.md`; `.specify/feature.json` updated.

---

# Active Context — Tip Jar Glow Pulse Match (2026-10-30)

- **Selected task group:** `polishing` — match the existing warm glow pulse between two adjacent homepage gold calls to action; no new functionality, route, asset, dependency, or configuration.
- **Branch / PR:** `polish/tip-jar-glow-pulse-20261030`, [PR #1651](https://github.com/davidcollier77-code/Luckypickcanada/pull/1651) against `main`. PR is open and unmerged for owner review.
- **Change:** `app/homepage/HomePage.js` applies the reusable `gold-btn-glow` class to both Tip Jar and Suggestion buttons. `app/globals.css` renames the suggestion-only keyframes to `goldBtnGlow` while keeping the exact three-second timing and shadow values, and updates reduced-motion handling. `themes/default/homepage.css` pauses the shared pulse on press for both buttons, leaving the flattened active shadow visible.
- **Preserved:** both existing shimmer sweeps; button copy, gradients, layout, focus styling, click/form handlers, destinations, Tip Jar flow, Suggestion submitting/disabled behavior, and all non-targeted site behavior. No artwork, image delivery, dependencies, checkout logic, or backend code changed.
- **Spec Kit artifacts:** `specs/063-tip-jar-glow-pulse/{spec,plan,tasks}.md`; `.specify/feature.json` points to the active feature.
- **Source/diff verification:** PASS — branch compared directly with `main`; final diff contains 8 scoped files (3 implementation files, 3 Spec Kit artifacts, `.specify/feature.json`, and this Memory Bank update). Source checks confirmed both buttons share `gold-btn-glow`, `goldBtnGlow 3s ease-in-out infinite`, reduced-motion handling, and active-state pause; previous suggestion-only identifiers are absent from the implementation files.
- **CI status:** DevSkim run 41136958575 completed successfully (PASS). OpenNext validation run 41136958573 is still in progress at the OpenNext Cloudflare build. Visual QA run 41136958878 is still in progress at the Spec Kit verification step. Browser-level rendering and current-head CI outcomes remain pending; no final result is claimed for the in-progress workflows.
- **Not run locally:** `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm run build`, and `./jules-verify.sh`; this session has repository API access but no local checkout/worktree or shell for running those commands. Build size and browser-level rendering remain unverified until CI reports.
- **Outstanding:** complete CI/visual checks and owner review; leave PR open and unmerged.

---

# Active Context — Homepage Gold Button Raised Depth and Shimmer (2026-10-30)

- **Selected task group:** `polishing` — visual/tactile polish of the existing homepage gold buttons; no new functionality, routes, or assets.
- **Branch:** `polish/homepage-gold-buttons`, pushed from commit `990c0a24`, opened as PR #1650 against `main` (<https://github.com/davidcollier77-code/Luckypickcanada/pull/1650>). Left open and unmerged for the owner.
- **Change:** `themes/default/homepage.css` gains one shared `.homepage-experience .gold-3d-btn` treatment (solid `0 3px 0 #a16207` bottom edge plus layered shadow, 2px hover lift, 2px press-down with a flattened edge and 60ms press transition, 120ms release) and a `prefers-reduced-motion` block. `app/homepage/HomePage.js` adds that class to the nine gold buttons and gives the Suggestion button the Tip Jar's existing moving shimmer overlay (`animate-shimmer`, `via-white/30`), clipped with `overflow-hidden`; both overlays are tagged `gold-shimmer`. `app/globals.css` extends `@keyframes suggestionBtnGlow` with the same edge/inset layers and pauses the glow while pressed so the Suggestion button shares the depth and press behaviour.
- **Verified evidence:** `pnpm exec tsc --noEmit` exit 0; `pnpm test` 22 files / 152 tests; `./jules-verify.sh` exit 0 (Spec Kit gate, typecheck, build, refresh-docs 17/17); production build 330,031,986 bytes / 314.74 MiB (< 495 MiB). Served homepage HTML contains 9 `gold-3d-btn` buttons, 2 `gold-shimmer` overlays, and unchanged labels. Built CSS contains the 3D rules and reduced-motion block, with `.homepage-experience .gold-3d-btn:hover` (byte 41237) and `:active` (41510) emitted after `.suggestion-box-submit:hover` (23084) and `:active` (40795), confirming the new rules win the cascade.
- **Preserved:** wording, gold gradient/colour values, padding and `rounded-full` geometry, focus-visible outlines, click handlers, checkout/tip-jar/suggestion destinations, disabled suggestion state, AVIF-first/WebP image delivery (no image assets created or changed), and all non-homepage buttons.
- **Artifacts:** `specs/062-homepage-gold-button-polish/{spec,plan,tasks}.md`; `.specify/feature.json` points to that feature.
- **BLOCKED:** Playwright browser interaction/visual check — bundled Chromium cannot start (`libnspr4.so` missing) and `playwright install-deps` cannot gain root in this container, so no browser-level hover/press/screenshot result is claimed. CI Playwright remains the confirmation path.
- **Pre-existing, not modified:** `public/themes/default/homepage.css` is an older unused copy of the homepage theme (the app imports `themes/default/homepage.css`); it already diverged before this task and was left untouched.
- **Outstanding:** CI Playwright confirmation and owner authorization to push/open the PR.

---

# Active Context — Homepage Confetti Deferred Loading (2026-10-30)

- **Selected task group:** `polishing` — one low-risk homepage critical-path performance improvement (client-bundle/asset optimization).
- **Branch:** `freebuff/dfa64ff78675029edc0690e0` (cloud worktree); not pushed, no PR opened by this session.
- **Change:** `app/homepage/ExploreLuckButton.js` no longer statically imports `canvas-confetti`; it uses a cached `import()` that is prefetched after hydration and awaited by the activation path, while the eased scroll still starts synchronously. Reduced-motion visitors never fetch it.
- **Verified evidence (production server document for `/`):** initial JS went from 9 chunks / 631,196 bytes raw / 197,142 bytes gzip to 9 chunks / 621,131 bytes raw / 193,213 bytes gzip; `canvas-confetti` left the initial chunk `373-*.js` (20,631 raw / 7,752 gzip) and now ships as `chunks/2992.*.js` (10,429 raw / 4,250 gzip) after hydration. Delta: −10,065 raw / −3,929 gzip.
- **Verification:** PASS — `pnpm exec tsc --noEmit`, `pnpm test` (22 files / 152 tests), `./jules-verify.sh` (exit 0), clean production build 329,989,305 bytes / 314.70 MiB (< 495 MiB cap). BLOCKED — Playwright visual regression: Chromium in this container crashes on the homepage on the unmodified baseline too, so no browser-level interaction result is claimed.
- **Preserved:** identical confetti options/shape/canvas/cooldown/interrupt/cleanup/scroll/reduced-motion behavior; AVIF-first + WebP fallback delivery, preload hints, CSS, layout, copy, audio, dependencies, and configuration unchanged.
- **Artifacts:** `specs/061-homepage-confetti-lazy-load/{spec,plan,tasks}.md`; `.specify/feature.json` points to that feature.
- **Outstanding:** CI Playwright confirmation for the first-activation timing, and owner authorization to push/open the PR.

---

# Active Context — Gemini Reviewer Runtime Recovery (2026-10-29)

- **Selected task group:** troubleshooting — PR #1636's Visual QA exposed a post-merge Gemini reviewer startup failure in trusted `main`.
- **Branch:** `fix/gemini-reviewer-runtime-1636-20261029`; target `main`; keep PR #1637 open and unmerged.
- **Verified baseline failure:** Visual QA run [40887568880](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40887568880) failed during the full unit-test step because `.github/scripts/gemini-reviewer.cjs` had malformed duplicated expressions in `docReport()`; earlier run 40853009084 showed the same failure. The workflow test also detected missing serialized finding state in the published review body.
- **Implementation:** repaired `docReport()`; restored review-state serialization and balanced the publication block; run the independent adversarial pass on every patch batch and report both primary/adversarial failures as coverage gaps; added safe failure reporting for `pull_request_review`; added a runtime regression test that invokes the actual `docReport()` function. Consolidated duplicate Spec Kit checklist entries.
- **Verified automated checks on implementation head `79352ec277ae8f5435676d89cce83750c061a3a8`:** PASS — targeted unit tests, full `pnpm run test`, `pnpm tsc --noEmit`, `./jules-verify.sh`, Playwright visual regression, DevSkim, Next.js production build under the 495 MiB hard cap, OpenNext Cloudflare artifacts/build, Tailwind CSS, Wrangler dry-run, and updater-scheduler governance/build checks.
- **Remaining limitation:** a controlled live Gemini full-review acceptance case has not been run; no live-model result is claimed. The repair PR stays open and unmerged for owner review.
---

# Active Context — Gemini Full-Review Accuracy (2026-10-29)

- **Selected task group:** troubleshooting — address confirmed review-coverage gaps involving failure paths, state consistency, input validation, and context reporting.
- **Branch:** fix/gemini-adversarial-review-accuracy-20261029; target main; leave the PR open and unmerged.
- **Objective:** Add an independent adversarial review pass per patch batch, scope each pass's findings to that batch, report review-pass failures as coverage gaps, shorten the review-context footer, and prevent publication when the PR head changes during analysis.
- **Regression basis:** Amazon Q's four findings on PR #1634 are used as patterns; current code must independently substantiate any finding.
- **Verification:** GitHub API is used to prepare the change because the local shell cannot resolve github.com. Test/build/governance CI and an actual Gemini API review remain pending until their results are observed.

---

# Active Context — Gemini Reviewer Targeted-Fix Guard Repair (2026-10-28)

- **Selected task group:** `troubleshooting` — a verified GitHub Actions reviewer startup crash.
- **Branch:** `fix/gemini-reviewer-targeted-fix-guard-20261028`; target `main`; keep the repair PR open and unmerged.
- **Verified failure:** Actions run [#40793451382](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40793451382), job [#123184035314](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40793451382/job/123184035314), fails in `.github/scripts/gemini-reviewer.cjs:952` with `SyntaxError: await is only valid in async functions and the top level bodies of modules`.
- **Root cause:** The targeted-fix no-match comment/return lost its opening `if (!requestedFindings.length) {` guard, leaving an unmatched closing brace before source-context retrieval.
- **Implementation:** Restore that guard and add a test asserting that the guard precedes the no-match message, which precedes the autofix-module load. Workflow YAML, permissions, API-key handling, model fallback, application UI, protected visuals, and dependencies are unchanged.
- **Verification:** Source and regression assertion edited through GitHub APIs. Local repository shell commands were unavailable in this session; focused/full tests, `./jules-verify.sh`, PR-head CI, and a post-merge trusted-base run remain pending until verified.

---

# Active Context — Gemini Finding-Level Fix UX (2026-10-26)

- **Selected task group:** `deep-dive` — extends the existing reviewer pipeline with finding-specific implementation prompts and user-selected repair scope.
- **Branch / PR:** `improve/gemini-default-review-coverage-20261026`, [PR #1617](https://github.com/davidcollier77-code/Luckypickcanada/pull/1617); keep open and unmerged.
- **User goal:** Every finding has a collapsed, ready-to-copy implementation prompt. Owners can request a targeted suggestion for one eligible issue or ask Gemini for suggestions across all eligible findings.
- **Design:** `@gemini repair one <path>:<line> -- <finding title>` reruns the review and targets only the same finding at that exact path/line, including its title. `@gemini repair all` requests suggestions across eligible findings. Both remain opt-in native GitHub suggestions on safe one-line changes only; no direct repository edits, pushes, commits or merges.
- **GitHub UI limitation:** Review Markdown cannot host a custom live action button. The report therefore displays exact comment commands; the native GitHub Commit suggestion action remains the apply step.
- **Verification:** New reviewer and regression-test changes are on this branch. Final-head tests, `./jules-verify.sh`, PR-head CI and live-model output review remain pending; previously passing CI pertains to an earlier code-reviewed SHA.

---
# Active Context — Gemini Default Review Coverage and Relevant Documentation (2026-10-26)

- **Selected task group:** `deep-dive` — this task extends the already-merged Gemini reviewer context work across source retrieval, review prompts, document selection, and regression tests.
- **Branch:** `improve/gemini-default-review-coverage-20261026`; prepare a PR against `main` and leave it open/unmerged.
- **User-approved objective:** Make automatic Gemini reviews inspect bounded changed-source/import context by default and load Gemini CLI / Gemini Deep Research documentation only for directly relevant tasks.
- **Implementation:** `.github/scripts/gemini-reviewer.cjs` now calls source collection for automatic reviews, uses explicit 22-file / 3,600-character-per-file / 100,000-character-total limits, reports context gaps, keeps all text patches in review batches, and loads deleted-file source from the base SHA. CLI and Deep Research reference snapshots are optional, selected-group-constrained, and relevance-guarded.
- **Tests/specification:** Reused and updated `.specify/features/gemini-review-context/spec.md`, `plan.md`, `tasks.md`, and `checklists/requirements.md`; added test assertions in `__tests__/gemini-reviewer-context.test.ts` and updated `__tests__/gemini-reviewer-workflow.test.ts`. Updated `.gemini/rules/luckypickcanada.md` and `PR_SUMMARY.md`.
- **Relevant document conclusion:** `.docs/deep-dive/_google-gemini_gemini-cli.md` is a CLI tips/commands snapshot. `.docs/deep-dive/_websites_ai_google_dev_gemini-api.md` is specifically a Gemini Deep Research/Interactions API page. Neither belongs in an ordinary code review just because the task group contains them; `.docs/` remains read-only.
- **Verification:** On the code-reviewed head `486a071dd132b24dea309bafe404a65b0796798f`, DevSkim, focused/full Vitest, TypeScript, Spec Kit verification, production build, the 495 MiB size gate (315.74 MiB), OpenNext/Cloudflare, Wrangler dry-run, updater governance/`./jules-verify.sh`, and visual regression tests passed. No local shell execution is claimed; checks ran in GitHub Actions. Live-model acceptance remains pending because the trusted-base workflow does not execute unmerged PR-head reviewer code. Four related Amazon Q review threads were resolved after applying/validating their feedback.

---

# Active Context — Gemini Reviewer MARKER Initialization Fix (2026-10-26)

- **Selected task group:** `troubleshooting` — repairs the verified full-review runtime crash in the Gemini reviewer source-clipping helper.
- **Branch:** `fix/gemini-marker-tdz-20261026`; PR number will be recorded after creation. Keep this PR open and unmerged for owner review.
- **Root cause (VERIFIED):** `.github/scripts/gemini-reviewer.cjs` read `MARKER.length` in a boundary check before initializing the block-scoped `MARKER` constant. The existing test `__tests__/gemini-reviewer-context.test.ts` already exercises a zero limit, a small limit below marker length, and ordinary truncation.
- **Implementation:** moved the existing `MARKER` declaration above its first reference; clipping algorithm and reviewer behavior are otherwise unchanged.
- **Verification:** the source ordering was checked statically. Focused Vitest, `./jules-verify.sh`, and PR-head CI are pending; this connected session cannot run repository shell commands locally.

---

# Active Context — DevSkim Checksum SARIF Span Fix (2026-10-26)

- **Selected task group:** `security`; exact-span false-positive suppression regression verified against the actual scheduled scan artifact.
- **Branch / PR:** `fix/devskim-checksum-sarif-span-20261026`, [PR #1614](https://github.com/davidcollier77-code/Luckypickcanada/pull/1614); open and unmerged for owner review.
- **Root cause (VERIFIED):** Scheduled run [#40282205671](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40282205671) left one DS173237 result for the quoted 64-character SHA-256 checksum in `.specify/memory/.constitution-template.json`. Actual SARIF metadata included `startColumn: 12`, `endColumn: 78`, `charOffset: 14`, `charLength: 66` and a matching quoted checksum snippet. The reported columns were one character early, but the existing absolute-span helper validates the true source span/snippet.
- **Implementation:** `should_suppress_constitution_template_checksum()` now uses `_source_region_span_on_line()` and constrains the validated region to the exact quoted checksum. A production-shaped SARIF regression test exercises the filtering pipeline and ensures the columns-only mismatch fails closed.
- **Report:** Removed only row `devskim-id:81298a9d79b888769be1`; heading/append marker remain. The template checksum, other report rows, unrelated suppression predicates, and workflow are unchanged.
- **Verified CI on code commit `c0302455026f96f48fe4e297b6b3fb1a0e5552ea`:** DevSkim suppression suite 52/52 passed; filter reported 134 verified false positives suppressed; downloaded post-filter SARIF artifact #12647450099 contained zero results. OpenNext Cloudflare build and 495 MiB gate passed (330,947,295 bytes / 315.62 MiB); Wrangler build validation used no deployment. Updater scheduler verification ran `./jules-verify.sh` with 17 passed / 0 failed. CodeQL Python/JavaScript-TypeScript/Actions, Amazon Q, and Gemini reviewer checks passed.
- **Unrelated full-suite failure (NOT MODIFIED):** Visual QA reports 121/122 tests passing. The failing test is `__tests__/gemini-reviewer-context.test.ts > clips source while preserving the beginning and end`, caused by `ReferenceError: Cannot access 'MARKER' before initialization` at `.github/scripts/gemini-reviewer.cjs:129`. That source is outside this DevSkim task's authorized scope. The TypeScript and embedded Spec Kit step in Visual QA were skipped after this failure.
- **Execution limitation:** The API-connected session could not resolve `github.com` for a local clone; verification above comes from actual GitHub Actions logs and the downloaded SARIF artifact. No local test run is claimed.


---

# Active Context — Cloudflare Build Syntax Repair (2026-10-26)

- **Trigger:** The Cloudflare/OpenNext build for merged PR #1611 failed after Next.js compilation while TypeScript checked `__tests__/gemini-reviewer-context.test.ts`, reporting TS1128 at line 11.
- **Root cause:** The first `extractLocalImports` assertion's `.toEqual([...])` was separated from the assertion by a comment and another `expect`, leaving a dangling member-access line.
- **Repair branch:** `fix/gemini-reviewer-test-syntax-20261026`; the expected-array assertion is reattached and the template-literal/dynamic-import assertion remains separate.
- **Scope:** No application logic, dependencies, Cloudflare configuration, secrets, workflows, or reviewer behavior changed.
- **Verification:** Fix is present in the branch; focused Vitest, `pnpm build`, `./jules-verify.sh`, and the new Cloudflare/OpenNext result remain pending until actually run.

---

# Active Context — Gemini Traffic-Light Review and Copyable Fixes (2026-10-26)

- **Current PR:** `#1611`, branch `improve/gemini-review-context`; review-summary presentation is added to the existing reviewer improvement.
- **Output format:** red 🔴 issues with location/problem/impact; each suggested fix is hidden in a clickable details dropdown with copy-friendly text and safe replacement code when available; green 🟢 observations are evidence-backed; yellow 🟡 marks unresolved coverage.
- **Merge signal:** a green Gemini verdict means no actionable finding and no known coverage gap in the reviewed scope; it is not merge approval. Required GitHub checks, reviews, and branch protection remain separate.
- **Verification:** syntax parsing and source-level assertions are performed during editing; Vitest, `./jules-verify.sh`, and PR-head workflow results must be independently checked before completion.

---

# Active Context — Amazon Q-Derived Gemini Reviewer Improvements (2026-10-26)

- **Current reviewer PR:** `#1611`, branch `improve/gemini-review-context`; the existing reviewer source-context task is being updated in place.
- **Verified case study:** Amazon Q's review of merged PR #1610 found that a WebP-only preload mismatched the AVIF-first `picture` selection. The reviewed code now contains AVIF and WebP preload hints, but MDN confirms that browsers supporting both formats may preload both files, even though the picture uses only one. This is a potential duplicate-transfer cost to evaluate; this reviewer task changes guidance only and does not modify application code.
- **Additional lesson:** Q's nested `requestAnimationFrame` comment demonstrates why ordering concerns must be traced through callback registration, execution, state reads/writes, and every reachable direct/synchronous call path before being called a defect.
- **Verified regression in candidate branch:** commit `85746cc3` introduced a malformed `clipSource` marker string. This follow-up repairs that parser-breaking string and retains the clip-length regression test.
- **Reviewer change:** `.github/scripts/gemini-reviewer.cjs` and `.gemini/rules/luckypickcanada.md` now explicitly reason about both patterns; dedicated assertions were added to `__tests__/gemini-reviewer-context.test.ts`.
- **Verification:** JavaScript syntax compilation passed in the connected analysis runtime. Vitest, `./jules-verify.sh`, CI, and live-model acceptance remain pending until actually verified. No app code, dependencies, workflow permissions, secrets, or protected visuals were changed.

---

# Historical Context — DevSkim Checksum Alert Cleanup (2026-10-25; superseded)

- **Earlier cleanup:** PR #1608 removed the exact row with marker `81298a9d79b888769be1` from `devskim-alerts.md`.
- **Reintroduction:** Automated report PR #1609 was merged four minutes later and re-added that row after a subsequent scan. The earlier cleanup did not correct why the scanner result survived filtering.
- **Corrected diagnosis (VERIFIED from artifact):** Scheduled DevSkim run [#40282205671](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40282205671) completed successfully on 2026-10-26. Its post-filter SARIF still contained one DS173237 result for `.specify/memory/.constitution-template.json:2`. The snippet is the quoted 64-character SHA-256 checksum; the SARIF region has `startColumn: 12`, `endColumn: 78`, `charOffset: 14`, and `charLength: 66`.
- **Root cause (VERIFIED):** `should_suppress_constitution_template_checksum()` checked only the reported columns, which are one character early, although `_source_region_span_on_line()` already validates the absolute offset, length, snippet, and source-line match. The filter therefore missed this exact false positive.
- **Follow-up:** The current task fixes the exact-span validation, adds a regression test using the production-shaped SARIF, and removes only the corresponding report row. No source checksum, broad suppression, scan rule, or workflow trigger is changed.
- **Verification boundary:** The scheduled scan and both jobs succeeded, but their success did not prove this finding was suppressed. Current follow-up PR checks and `./jules-verify.sh` must pass before cleanup is considered verified or merged.
---

# Current Task — Gemini PR-Agent Review Retirement (2026-10-25)

- **Owner decision:** Retire the separate Gemini PR-Agent code-review workflow; use PR Insights Tagger for PR triage and Amazon Q for code review while evaluating a stronger reviewer.
- **Evidence:** Smoke-test PR #1598 received an automated PR Insights Tagger summary and an Amazon Q formal review. The Gemini PR-Agent run attempted Gemini 3.8 Flash, encountered a 503/high-demand response and timeout, then completed through the configured Gemini 3.6 Flash fallback with no findings on the intentionally trivial one-line test.
- **Implementation branch:** `chore/retire-gemini-pr-agent-20261025`. The active `.github/workflows/pr-agent.yml` workflow and its dedicated `__tests__/pr-agent-workflow.test.js` were removed on this branch; historical Spec Kit records remain unchanged.
- **Preserved:** PR Insights, Amazon Q, DevSkim, all other workflows and tests, app source, Oracle/Crystal Ball runtime usage, packages/lockfile, Cloudflare configuration, and secrets.
- **Secret distinction:** After the retirement PR is merged, the owner can remove the now-unused GitHub Actions `GEMINI_API_KEY` secret only after confirming no other workflow references it. Do not remove the separate Cloudflare runtime secret used by the site Oracle.
- **Verification:** PR-head CI and final diff review are pending. This API-connected session cannot run local `pnpm test` or `./jules-verify.sh`; do not treat them as passed.

---

# Current Task — DevSkim Regression and Checksum Span Repair (2026-10-25)

- **Root cause verified:** DevSkim runs #246–#249 passed the scanner/SARIF upload but failed at the suppression unit-test step because two test-fixture string literals were unterminated. After those literals were fixed, first PR CI ran 51 tests and exposed one remaining checksum-offset regression (50 passed, 1 failed).
- **Follow-up fix:** the checksum exception now prefers DevSkim's validated absolute source span/snippet when present, while keeping the span wholly within the exact quoted checksum. The one-column-early SARIF coordinate alone is not trusted.
- **Verification:** current-head CI is pending. Keep the PR open until the full suite and fresh DevSkim workflow are verified.

# Current Task — DevSkim Regression Test Syntax Repair (2026-10-25)

- **Verified failure:** DevSkim runs #246–#249 passed the scanner and SARIF upload but failed while importing `.github/scripts/test_suppress_devskim_false_positives.py` due to two unterminated string literals. The suppressor was skipped, so the dependent append/report-update job did not run.
- **Fix in progress:** Corrected the two fixture-write string literals on branch `fix/devskim-test-syntax`. No scanner suppressions, workflow permissions/triggers, app behavior, dependencies, secrets, or deployment settings were changed.
- **Verification status:** Waiting for a fresh PR CI run and the required repository verification; do not consider the repair complete until these results are confirmed.

# Active Context — Mobile Performance Improvements (2026-10-25)

- **Task:** Safely improve LuckyPickCanada's mobile website performance by optimizing the 675KB Gift Experience PNG.
- **Change:** Implemented a responsive <picture> element in app/homepage/HomePage.js serving AVIF and WebP formats using srcSet. Added suppressHydrationWarning to prevent Playwright test failures due to React hydration mismatch on the new <picture> structure.
- **Additional Fix:** Removed an invalid quality={85} prop from the map logo Image component to resolve Next.js build warnings.
- **Verification:** All 106 unit tests passed, all 18 visual regression tests (Playwright) passed, and the production build size is well under the 495MB limit (428MB).
- **Scope:** Kept strictly to replacing the static image with an optimized picture tag and removing one invalid prop. No redesign, layout changes, or functionality adjustments.

# Current Task — CodeRabbit CLI Integration Retirement (2026-10-24)

- **Decision:** At the repository owner's direction, retire the active CodeRabbit CLI review integration after the GitHub Actions run reported `Invalid or expired API key` (run [40117926386](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40117926386)). The CLI route could not be made to authenticate using the available credential.
- **Branch / PR:** `fix/coderabbit-cli-workflow-reliability-20261024`, PR [#1594](https://github.com/davidcollier77-code/Luckypickcanada/pull/1594).
- **Retirement scope:** Remove the CLI Actions workflow and its workflow-specific test, local CLI wrapper, CLI instructions file, CLI setup guide, and README advertisement. Keep the CodeRabbit GitHub App and all unrelated workflows, scanners, tests, application code, dependencies, deployment settings, and governance unchanged.
- **Historical record:** Preserve `specs/048-coderabbit-cli-review-layer/` as the record of the previously implemented experiment. The current retirement task is documented in `specs/049-coderabbit-cli-retirement/`.
- **Manual secret cleanup:** The repository owner removes the `CODERABBIT_API_KEY` repository Actions secret in GitHub settings. This connected repository tool cannot inspect or delete that secret; no secret value was read or changed here.
- **Verification:** Repository shell commands (`pnpm test` and `./jules-verify.sh`) cannot be executed through this GitHub API interface. Reconcile the final PR diff and inspect remote checks before merging.

---

# Active Context — DevSkim Source-Span Precision (2026-10-24)

- **Task:** Make DevSkim false-positive filtering more source-aware without hiding valid findings.
- **Verified baseline:** Historical raw DevSkim SARIF from run [40024403456](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40024403456) had 106 results across DS173237, DS172411, DS162092, DS126858, DS137138, and DS610000. This is historical artifact evidence, not today's live Code Scanning alert count.
- **Change branch:** `fix/devskim-source-span-precision-20261024`. Contextual suppressions now require precise reported columns/token agreement; lockfile package exceptions require the reported hash-name token to lie inside the reviewed package identifier. Missing, malformed, truncated, or mismatched spans remain visible. Added regression coverage for these negative controls.
- **Scope:** Python DevSkim helper and tests plus feature Spec Kit records. No rule disablement, path exclusion, dependency, workflow, application, API, secret, deployment, or `.docs/` change.
- **Verification:** Remote CI pending; local Python tests and `./jules-verify.sh` were not run in this interface. Do not report success until CI and the final PR diff are reviewed.
- **PR status:** New scanner-improvement PR not yet opened at the time this context was written. PR #1589 was confirmed merged on `main`; its report-failure guard remains separate.

---

# Active Context — DevSkim Report Failure Guard (2026-10-24)

- **Task:** Add a regression guard for the append-only DevSkim report when suppression checks fail.
- **Verified failure path:** Workflow run [40024403456](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40024403456) had an `IndentationError` in the suppression helper; the suppression step was skipped, `continue-on-error: true` let the lint job continue, and the notification inbox recorded three findings from that run.
- **Current baseline:** The main report contains zero finding rows. Latest main run [40092171712](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40092171712) completed successfully; the report updater added zero rows.
- **Change on branch:** `fix/devskim-report-failure-guard-20261024` removes `continue-on-error` from the suppression test/filter steps and adds workflow regression coverage. A failure will fail the lint job, causing the dependent report updater to skip; raw SARIF and its artifact are still uploaded with `if: always()` to preserve security evidence.
- **Scope:** No broad suppressions, rule changes, report edits, application/dependency/configuration changes, or deployment changes.
- **Status:** PR #1589 was merged by the repository owner. Its failure guard remains separate from the source-span precision task.

---

# Active Context — DevSkim Self-Test False Positives (2026-10-24)

- **Task:** Completed remediation of the 12 historical DevSkim ledger rows from the scanner helper and its regression test.
- **Verified cause:** Safe source resolution and contextual-rule eligibility excluded `.github/scripts/suppress_devskim_false_positives.py` and `.github/scripts/test_suppress_devskim_false_positives.py`, so existing narrow DS137138/DS162092 fixture logic was unreachable for their results.
- **Branch / PR:** `fix/devskim-self-suppression-20261024` / [PR #1588](https://github.com/davidcollier77-code/Luckypickcanada/pull/1588).
- **Implementation:** Exact two-file allowlist for source inspection; contextual exception limited to DS137138/DS162092 on those paths; regression processes synthetic SARIF and checks four expected removals plus two negative controls.
- **Current-head verification passed:** DevSkim syntax/suppression/SARIF upload, DevSkim PR check with no new alerts, CodeQL (Python, JavaScript/TypeScript, Actions) with no new alerts, unit suite (106/106), targeted unit tests (14/14), TypeScript, `./jules-verify.sh`, Playwright (27 passed, 3 skipped, 0 failed), production build, OpenNext/Cloudflare and Wrangler no-deploy validation, and updater scheduler tests. PR Agent and Amazon Q reviews reported no blocking concerns.
- **Build size:** `.next + public` = 330,821,072 bytes / 315.50 MiB, under the hard 495 MiB ceiling.
- **Ledger:** Exactly 12 finding rows removed; `devskim-alerts.md` keeps its title/explanation/append marker and has 0 finding rows on the PR branch.
- **Scope/security:** No application runtime, API, secret, dependency, authentication/payment, database, or deployment changes. No broad rule suppression and no direct edits to `main`. Deployment workflow was not run.
- **Governance:** Task group Security; all four Spec Kit stages are recorded in `specs/045-devskim-self-suppression/{spec.md,plan.md,tasks.md}` and the canonical PR summary. `.docs/` remained read-only. Local execution was unavailable due to this session's DNS limitation; remote current-head CI is the evidence source.
- **Status:** Verified and ready for merge. No known in-scope outstanding issues. Zero ledger rows and a PR “no new alerts” result do not by themselves dismiss older Code Scanning alert objects.

---

# Active Context — Undici CVE-2026-109869 Dependency Remediation (2026-10-24)

- **Verified finding:** Dependabot alert #66 reports transitive `undici@8.10.2` and GHSA-xjj6-f33q-929c / CVE-2026-109869 (high severity). The root pnpm override `>=7.29.1` allowed 8.10.2 to remain selected.
- **Change on branch:** `fix/security-undici-cve-2026-109869`. Root pnpm override and lockfile are being updated to exact patched release `undici@8.12.2` with the verified npm integrity metadata. A focused lockfile/config regression test is included.
- **Scope protection:** No application source, UI, assets, runtime APIs, deployment configuration, or visual behavior is intentionally changed.
- **Verification status:** Remote PR CI must confirm the frozen pnpm lockfile installs, regression test passes, `./jules-verify.sh`, production build, and OpenNext/Cloudflare validation all pass. This session cannot run pnpm locally; do not claim CI checks passed until observed. If a build runs, confirm combined `.next + public` output remains below 495 MiB.
- **Separate advisory note:** Node.js 22.23.4 is a security release for CVE-2026-111497 in Node's bundled Brotli decoder; this is distinct from the Undici package alert. The repo's `.nvmrc` and `engines.node` specify the 22.x line rather than a vulnerable fixed patch. Do not broaden this PR into a separate runtime/deployment change without verifying the actual CI and deployment runtime.

---

# Active Context — Spec Kit Updater Reliability (2026-10-23)

- **Verified cause:** Generic integration v1.2.2 was installed on 2026-10-20. The pre-customization command files match the manifest hashes; commit `435c4a3a54742487f07df73090bb2d3c596740bf` later added intentional Jules instructions to the two tracked command files.
- **Repair PR:** #1571, branch `fix/speckit-updater-preserve-jules-customizations`.
- **Verified CI on commit `0df9f6aac428c8b2cb032ab268e7537bf51906a9`:** safe real `specify-cli` integration/extension update and three-way overlay rebase passed; Worker scheduler tests passed; `./jules-verify.sh` passed; Wrangler no-deploy dry-run passed. OpenNext `.next + public` measured 329,595,402 bytes / 314.33 MiB (<495 MiB).
- **Design:** Store the known upstream base and Jules overlays. Check overlay integrity, temporarily restore upstream files for the ordinary non-forced update, then three-way merge Jules rules onto new templates. Unknown edits and true conflicts stop safely.
- **Trigger/notification:** Worker dispatch sends `dispatch_source=cloudflare` and the approved slot; manual Spec Kit dispatch bypasses the daily-success guard, while Cloudflare retry slots still honor it. Both updater workflows post idempotent owner mentions with source, slot, and Actions run URL when a PR is created/refreshed.
- **Schedules:** Existing Cloudflare cron triggers and Atlantic target slots remain unchanged. PR CI does not deploy; the Worker deploy job is skipped on the PR and Wrangler validation is dry-run only.
- **Remaining proof:** Current-head rerun after the added 495 MiB measurement step; then the first real post-deployment Cloudflare production dispatch and resulting notification.


---

- **User-reported symptom:** The homepage Suggestion Box Turnstile check sometimes takes about 45 seconds or longer. This timing was not independently measured by this session.
- **Verified current setup:** `@marsidev/react-turnstile` is pinned at 1.6.1. The shared layout already preconnects to Cloudflare; the widget's API script is injected only when the client widget initializes. Its configured URL is `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit`.
- **Historical clue:** PR #1398 removed an earlier preload that omitted the wrapper's `onload` callback parameter. This task adds the exact URL instead, and only in the homepage document.
- **Live inspection:** An HTTP 200 live scrape showed the Turnstile iframe in “Checking your Browser…” after the scrape wait. This confirms the widget exists but does not measure the owner's phone/browser timing or prove the reported delay's full root cause.
- **Repair branch / PR:** `fix/turnstile-early-script-preload-20261022` / [PR #1568](https://github.com/davidcollier77-code/Luckypickcanada/pull/1568); the feature is `specs/041-turnstile-early-preload/`. The initial literal JSX link drew an Amazon Q concern about body placement and was replaced with React DOM's `preload()` API during page render to explicitly emit the head hint. The widget lifecycle/callbacks, site-key lookup, server-side Siteverify validation, rate limiting, and spam protections remain unchanged.
- **Verification status (PR head `511d5a69c5e60b9c48fa864ab85ce314bdb5ed0b`):** GitHub Visual QA passed, including targeted tests, full unit tests, `pnpm tsc --noEmit`, `./jules-verify.sh`, committed visual-baseline verification, and all Playwright visual tests (the new Turnstile preload regression is included by the `tests/visual/**/*.spec.ts` configuration). OpenNext validation passed: Next.js build, the 495 MiB `.next + public` cap, Cloudflare OpenNext build, CSS/worker/assets checks, and Wrangler build validation. DevSkim and PR Agent also completed successfully. The updater scheduler's deploy job was skipped; no site deployment or merge was performed. The ~45-second real-browser timing remains unverified. A preload can reduce script-fetch delay but cannot guarantee challenge completion speed under browser/network conditions.

---

# Active Context — Cloudflare preview manifest runtime outage (2026-10-22)

- **User-reported production failure:** luckypickcanada.ca returned Cloudflare Error 1101 after the successful OpenNext deployment following PR #1563.
- **Verified exception:** Worker log for GET `/crystal-ball` reports `Unexpected loadManifest(/.next/server/preview-props.json) call!` in `NextNodeServer.getPreviewProps`, during server initialization. Fresh checks also observed Error 1101 for the homepage and `/about`.
- **Verified starting dependency state:** Next.js `16.4.1`, `@opennextjs/cloudflare@1.20.6`, and Wrangler `4.141.0`. Upstream OpenNext PR #1356 fixes build-time inlining of `preview-props.json`; adapter 1.20.13 contains the fix and requires Wrangler `^4.148.0`.
- **Additional verified build issue and correction:** The first OpenNext build attempt failed because `minimatch@9.0.9` resolved `brace-expansion@5.0.12`, which lacks the default export that minimatch 9 imports. Added the scoped override `minimatch@9.0.9>brace-expansion: 2.1.7`.
- **Repair branch / PR:** `fix/cloudflare-preview-props-runtime-1101` / [PR #1564](https://github.com/davidcollier77-code/Luckypickcanada/pull/1564), still draft and unmerged.
- **Verified CI:** Frozen pnpm install, Next.js production build, OpenNext Cloudflare build, compiled CSS, Worker/assets existence checks, Wrangler dry-run validation, unit tests, TypeScript, and repository Spec Kit verification passed. The combined `.next + public` size was 329,569,355 bytes (314.30 MiB), below the 495 MiB hard cap. Visual regression testing remains pending while CI installs Playwright Chromium.
- **Safety / production status:** No production Worker was modified directly and no merge occurred. A successful build alone does not prove runtime recovery. After owner-approved deployment, smoke-test `/` and `/crystal-ball` and inspect Worker logs before marking the incident resolved.

---

---

## Current Focus — Updater Scheduler First-Deploy Secret Bundle (2026-10-22)

- **Current fix branch:** fix/updater-scheduler-secret-bundling-20261022; PR creation and current-head checks pending at the time this context was updated.
- **Previously merged activation:** PR #1560 was merged to main as commit 74ac0288e64cfaf717bbb5583a01c214d1436031; checked-in workers/updater-scheduler/wrangler.toml sets DISPATCH_ENABLED = "true".
- **Owner-confirmed operational state:** Repository variable UPDATER_SCHEDULER_ACTIVE=true is already set. Do not modify it as part of this repair.
- **Verified new-token evidence:** The rerun dispatched no-op canary run [#39804841516](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39804841516), which completed successfully.
- **Verified remaining failure:** Wrangler step "Sync GitHub dispatch token before deployment" failed because the latest Worker version was not deployed. The actual scheduler deployment step was skipped.
- **Repair in progress:** Replace the separate Wrangler secret-only command with a mode-0600 temporary JSON secrets file passed to wrangler deploy --secrets-file, deploying code and secret together after the canary. Add a static workflow regression test and update scheduler instructions.
- **Verification status:** Canary passed, but branch tests/governance/dry-run and a later main-branch deployment have not yet passed. The first natural dispatch and matching GitHub Actions run remain unverified.
- **Safety:** No production updater was manually dispatched; no token value is recorded; no repository variable or main branch was modified directly by this repair.

---

---

## Current Focus — Restore Shared Sky Backgrounds — CI Follow-up (2026-10-19)

- **PR**: [#1534](https://github.com/davidcollier77-code/Luckypickcanada/pull/1534), branch fix/restore-shared-sky-backgrounds-1534.
- **First CI result**: Visual QA run 39327043606 passed the targeted tests, full unit suite (17/17), TypeScript, Spec Kit verification, and baseline verification. Playwright reported 22 passed, 3 skipped, and 2 failures.
- **Verified test defect**: The new check required crystal-ball-bg-desktop at all viewport widths; the computed style correctly uses crystal-ball-bg-mobile below or at 820px. The captured homepage screenshot shows the star-field background. The test loop stopped at the homepage, so this run has not tested the Crystal Ball and Lucky Map route assertions.
- **Correction committed next**: The regression check derives the expected asset family from the 820px responsive breakpoint. Spec SC-001 now states the responsive behavior. No CSS rules, background images, components, or styling have been changed by this test correction.
- **Build evidence**: OpenNext run 39327043610 passed. Combined .next + public = 325,580,929 bytes (310.50 MiB), below 495 MiB. Latest-head build/governance/browser verification remains required after the test correction.
- **Do not mark resolved** until fresh current-head Playwright checks visit /, /crystal-ball, and /map at the configured viewports and pass, and OpenNext/size/gov checks are current-head passes.

---

## Current Focus — Restore Shared Sky Backgrounds (2026-10-19)

- **User-reported regression**: After the homepage CSS performance update, the Crystal Ball and Lucky Map lost their expected sky/background treatment; the Lucky Meter and Card Reveal appeared mostly unaffected in the supplied video.
- **Evidence**: PR #1532 moved the theme stylesheet import from app/layout.js into app/globals.css after Tailwind's import. Shared backdrop CSS and markup remain in the repository.
- **Repair branch**: fix/restore-shared-sky-backgrounds-1534.
- **Implementation**: Restored the previous theme-first import order in app/layout.js, removed the duplicate import from app/globals.css, and added a Playwright computed-style regression check across /, /crystal-ball, and /map. No artwork or section styling declarations were changed.
- **Verification**: Local test/build/governance commands could not run because the connected shell cannot resolve github.com. Current-head Playwright, ./jules-verify.sh, OpenNext build and the 495 MiB gate remain pending CI. Do not call the repair verified until those results pass.

---

## Historical Task — Gemini All-in-One PR Review Depth (2026-10-19; superseded by retirement on 2026-10-25)

- **User authorization**: Directly improve the existing Gemini PR-Agent workflow with a more detailed all-in-one review covering bugs, security, performance, SEO, visual/UI regressions, accessibility, and missing tests.
- **Branch**: `fix/gemini-review-depth-1533`; current `main` now includes PR #1532, and its homepage CSS changes are preserved by the conflict repair.
- **Changes prepared**: Workflow permits up to eight substantiated findings, enables inline key issues and risk/merge/failure-mode summaries, and supplies evidence-led multi-area review instructions. Existing Gemini 3.8 Flash primary, fallback order, pinned action, triggers, credentials, permissions, and review-only settings are preserved.
- **Regression test**: Extended `__tests__/pr-agent-workflow.test.js` to assert the new reviewer settings and required instruction categories.
- **Spec Kit**: New task artifacts live under `.specify/features/gemini-review-depth/`; `.specify/feature.json` points to this task. Required setup scripts and `./jules-verify.sh` were not run locally because shell access could not resolve `github.com`; current-head CI must verify the gate before merge.
- **Merge conflict and Amazon Q follow-up (2026-10-19)**: The conflict was caused by competing `.specify/feature.json` pointers. The merged tree preserves current `main` content and selects the Gemini review-depth feature for this task. Google's model catalogue validates all three configured model IDs; PR-Agent/GitHub env docs support the quoted finding-limit setting. The unsupported negative model assertion was removed. Current-head CI/governance and successful live review evidence remain pending; no local pass is claimed.

---

## Current Focus — Gemini PR-Agent Workflow Repair (2026-10-19)

- **User-authorized task**: Directly repair the Gemini reviewer workflow and open PR #1530; no Jules or Amazon Q implementation handoff.
- **Verified root cause**: The original merged workflow lacked a step-level `env:` block and left PR-Agent's event filter and model configuration stale. Current official Google and PR-Agent docs confirm `gemini/gemini-3.8-flash` is supported, and live logs show it was invoked.
- **Runtime evidence**: The credential preflight passed. Gemini 3.8 Flash returned HTTP 503 `UNAVAILABLE` twice due to high demand. The unrelated default OpenAI fallback was removed; Gemini 3.5 Flash-Lite is now the fallback while 3.8 remains primary.
- **CI evidence**: Current completed Visual QA run reports 14 test files and 91 tests passing; the new workflow regression suite has 4 passing tests and TypeScript passed. The governance gate failed because `.specify/feature.json` still pointed to the previous Crystal Ball feature; this commit switches it to the current PR-Agent feature. Fresh CI is required.
- **Scope**: PR #1530 changes the PR-Agent workflow, one static regression test, active Spec Kit artifacts and pointer, PR summary, and Memory Bank. No secret value was printed or modified. CodeRabbit, Amazon Q, Robin-retirement state, app runtime, dependencies, and deployment workflows are unchanged.
- **Outstanding verification**: Current-head governance, Playwright, complete OpenNext/Wrangler result, and the 495 MiB hard cap must be confirmed. A successful live Gemini review remains required.
- **Candidate branch**: `fix/gemini-pr-agent-workflow-1530`.

---

# Active Context

## Current Focus — Oracle route Cloudflare build repair (2026-10-18)

- **Verified failure:** The Cloudflare log from 2026-10-18 reports a Next.js compile error, `Expression expected`, at `app/api/oracle/route.js:102`. The route's input-sanitization chain was interrupted by the prompt-injection check, leaving later `.replaceAll(...)` calls detached from the expression.
- **Repository state:** PR #1522 (Oracle personality) was merged at 2026-10-18T17:13:14Z. The supplied Cloudflare build failed shortly after. This follow-up is on `fix/oracle-route-build-and-injection-1522`; do not push a repair straight to production.
- **User authorization:** Explicit authorization to fully repair the build failure and related route issue was given on 2026-10-18.
- **Repair prepared:** Restored the complete sanitization chain, retained the existing injection-pattern list, and checks it against both original `rawQuestion` and the normalized sanitized `question`. Added regression cases where quote or angle-bracket characters split a blocked phrase; the existing ordinary-question provider-path test remains. A first targeted CI run also exposed a missing `const apiKey = getApiKey();` call left out by the malformed prior edit; that call has now been restored before the existing missing-key fallback.
- **Scope preserved:** No change to the Oracle personality prompt, provider/model or parameters, CORS, rate-limit configuration, error/fallback payloads, response aliases, daily quota, UI, artwork, animations, audio, dependencies, or deployment configuration.
- **Verification status:** Edits were made through the GitHub repository API. A local shell/checkout is unavailable in this connected session, so local test/build/`./jules-verify.sh` results are not claimed. Follow-up PR CI must show targeted/full tests, TypeScript, governance verification, OpenNext/Cloudflare build, and measured build output strictly below 495 MB before the repair is treated as verified.
- **Next step:** Review fresh current-head CI results and the complete final diff for [PR #1523](https://github.com/davidcollier77-code/Luckypickcanada/pull/1523). Earlier targeted CI failed because the API-key lookup call was missing; the call is restored in the later commit, and that fix remains unverified until the rerun passes. No merge or deployment was performed.

---

## Previous Focus — Crystal Ball Oracle personality upgrade (2026-10-18)

- User-authorized implementation: improve AI-generated Crystal Ball readings so they sound like a distinctive, question-specific fortune teller rather than a generic chatbot.
- Original branch/PR: `polish/crystal-ball-oracle-personality` / [PR #1522](https://github.com/davidcollier77-code/Luckypickcanada/pull/1522), merged 2026-10-18; feature artifacts: `specs/033-crystal-ball-oracle-personality/`.
- Intended behavior: focused system prompt plus regression tests for the outbound prompt. The subsequent build failure was caused by the malformed sanitization/filter edit described in the current-focus entry above.
- Preserve the existing Groq-compatible endpoint/model, temperature, token limit, API validation, prompt-injection protections, CORS, request rate limit, fallback fortunes, response shape, client-side daily allowance, visual design, animations, audio, dependencies, and deployment setup.
- Real-provider answer quality remains unverified without an authorized credentialed live-provider test. Lottery readings must remain entertainment and must not promise outcomes.


- User-authorized change: replace the persistent per-IP UTC-day quota with a three-successful-AI-answer allowance held in browser localStorage, reset at the visitor's local midnight, with a visible HH:MM:SS countdown.
- Branch / PR: `fix/crystal-ball-browser-daily-limit` / [PR #1516](https://github.com/davidcollier77-code/Luckypickcanada/pull/1516).
- Implementation: local-date storage helper with in-memory fallback, countdown in the existing allowance UI, removal of the server-side daily quota/GET status handler, and preserved ten-requests-per-minute request limiter, validation, provider behavior, and generic fallback responses.
- Accepted limitation: visitors can clear/edit localStorage to bypass the daily allowance; this is a lightweight UX limit, not tamper-resistant server enforcement. Fallback fortunes do not consume an AI-answer slot.
- Regression coverage: added local-date/storage unit tests and extended the daily-limit Playwright test to assert the countdown.
- Verification status: changes are committed via the GitHub repository API. No local shell execution has been possible in this session; current-head GitHub Actions and the 495 MiB build-size check remain pending. Do not claim verified or merge-ready until those runs complete.

## Parallel Work — Restore Robin's OpenRouter fallback (2026-10-17)

- User-authorized task: keep Robin as the repository's automated code reviewer and restore a second, bounded Robin attempt through a distinct OpenRouter free model. Remove Amazon Q fallback dispatch and acceptance from `.github/workflows/robin.yml`; leave Amazon Q's independent reviewer workflow untouched.
- Working branch: `fix/robin-openrouter-fallback`. Active Spec Kit feature: `specs/027-robin-openrouter-fallback`.
- The workflow continues using the existing `secrets.OPENROUTER_API_KEY`; no secret rotation or replacement is part of this repair. Earlier run evidence reported the key accepted but free-model quota at 0/50, so a verified zero quota will correctly keep the Robin check failed until quota is available.
- Scope is CI/workflow only: preserve the pinned Robin action, slash commands, review policy, and concurrency behavior; no application code, dependencies, Amazon Q workflow, credentials, or deployment configuration are being changed.
- Verification: static workflow regression tests and GitHub Actions checks are expected on the PR. Local checkout/build/test commands are unavailable in this connected session because the runner cannot resolve github.com; do not claim local checks passed.


## Completed — PR #1511 conflict resolution (merged 2026-10-17)

- User-authorized repair for [PR #1511](https://github.com/davidcollier77-code/Luckypickcanada/pull/1511): reconcile the branch with current `main`, remove the accidentally duplicated `CrystalBall` component, correctly render newline tokens, align Unicode reveal counts, and fix reduced-motion dependency arrays.
- The repair commit is built on current main while retaining the PR head as its second parent. The branch's `.specify/feature.json` pointer is set to `specs/crystal-ball-fix` to match the PR-specific Spec Kit artifacts; this is an intentional part of the PR diff.
- Source integrity assertions confirmed one default component export. PR #1511 was subsequently merged; the former pre-merge verification reminder is historical.


## Current Focus — PR #1510 Visual QA timing repair (2026-10-17)

- User-authorized task: fix Visual QA run [#39038534341, job #117413181877](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39038534341/job/117413181877) so PR #1510 can proceed toward merge; Robin itself is not the current repair target.
- Verified: targeted and full unit tests, standalone TypeScript, `./jules-verify.sh` Spec Kit verification, and committed visual baseline validation passed in that run. Playwright failed 5 tests (16 passed, 3 skipped).
- Verified homepage cause: trace timing puts the Howler client chunk at about 7.58 seconds after the page document and the local `/sounds/confetti-pop.wav` request at about 8.33 seconds. The old 5-second test wait expired while the Explore button still had `data-hydrated="false"` / `data-confetti-pop-ready="false"`.
- Verified daily-quota cause: page navigation alone took about 12.7 seconds and the 30-second test budget expired after the flow reached the exhausted-quota state with the three session readings visible.
- Implemented test-only repair: `tests/visual/homepage.spec.ts` waits up to 30 seconds for hydration/audio readiness before continuing with the same request, particle, scroll, cooldown, and keyboard assertions; `tests/visual/crystal-ball-daily-limit.spec.ts` gives the three-answer animated flow 60 seconds. No application runtime code was edited.
- Test commits: `5448e775cc3aff078710ff1d360c886b497e4683` and `d9fe5c6bb0522e5ce0ad051c26213f5c1c0a08d9`; documentation reconciliation is being committed separately. Current-head Visual QA rerun is still required. Keep PR #1510 unmerged until current checks and the separate review gate are resolved.

---

## Current Focus — PR #1510 code-scanning cleanup and Robin quota fallback (2026-10-17)

- Authorized task: fully repair PR #1510, generated by Copilot Autofix for code-scanning alert #16, including its failing reviewer workflow.
- Source cleanup committed at 8bdd4fef8a7515e837da5138c6140b49cdb4e5fe: removed inert root-level `test_fix.js`; added dedicated Spec Kit artifacts; pointed `.specify/feature.json` at the current task. The task-artifact gate is verified passing.
- Visual QA on source commit passed: quota test 3/3, full unit suite 12 files / 76 tests, TypeScript, `./jules-verify.sh` (including production build and 17 docs-refresh tests), and Playwright (21 passed / 3 skipped / 0 failed). OpenNext validation measured `.next + public` at 325,423,721 bytes / 310.35 MiB, below 495 MiB; OpenNext/Cloudflare/Wrangler checks passed. CodeQL Actions, JS/TS, and Python analyses passed.
- Verified Robin failure cause on run #39037480205: OpenRouter account endpoint HTTP 200, API key accepted, free-model daily quota 0 remaining of 50. Pinned Robin v2.12.0 masks many fast HTTP/provider errors as a generic 45-second stall; the quota diagnostic exposed the actual account limit.
- Workflow changes now add quota preflight (skip Robin's five-attempt retry if fewer than five free requests remain), secret-safe bounded error diagnostics, and an Amazon Q fallback review request on primary failure/low quota. The only accepted fallback is a substantive Q review tied to exact current-head SHA; the final check remains failed if neither reviewer posts.
- Amazon Q reviewed prior commits and responded to a manually issued `/q review` on head 0ad300edbde904e5ea89fb25cdbddc1812e04fa3. Current workflow changes require new-head verification before merge-readiness is established.
- No application source, dependencies, secrets, API routes, UI, or deployment configuration changed. No deployment or merge was performed. Local git clone/shell execution is unavailable because github.com DNS resolution failed; remote Actions runs provide verification.

---

## Current Focus — Newly sourced Crystal Ball audio (2026-10-17)

- Authorized request: replace the three borrowed Crystal Ball cues with new, licensed online assets; preserve the reveal order and existing Howler controls.
- Selected candidates from Pixabay: a 16-second magical aura/energy loop by Coghezzi, a 3-second spell impact by RescopicSound, and a 2-second twinkle/sparkle by ShidenBeatsMusic. The listing pages show free use under Pixabay's Content License; direct media URLs and artists are recorded in the provenance file.
- The no-key CLI workflow succeeded on GitHub Actions run #1: curl fetched all three licensed Pixabay source files, FFmpeg 6.1.1 converted them to same-origin WAVs, and Python verified PCM settings, expected durations, non-silent samples, no full-scale clipping, and <2 MiB per file. Measured assets: energy 15.700 s / 692,430 bytes; reveal 3.192 s / 140,846 bytes; leaf 2.038 s / 89,934 bytes.
- New WAVs are committed under `public/sounds/`; MP3 originals stayed in the runner temp directory. The temporary asset-preparation workflow has been removed from the final diff to avoid a permanent self-committing workflow.
- Branch / PR: feat/crystal-ball-new-sourced-audio / PR #1509. Code path changes are in `app/lib/audio.js`; Spec Kit active feature remains `specs/025-crystal-ball-audio-daily-limit`.
- Final tests, governance verification, build-size measurement and OpenNext/Cloudflare build checks still need candidate-PR evidence. Real-device audio playback remains unverified.

---

## Current Focus — Follow-up Crystal Ball audio syntax correction (2026-10-17)

- The Cloudflare build started after PR #1506 merged still failed at `app/lib/audio.js:208` with `Expected ',', got 'else'`.
- The current source confirms that `stopCrystalBallEnergy` and its server-side guard exist, but the delayed `setTimeout` callback was not closed before the fallback `else`. The function therefore remains syntactically invalid despite the previous repair.
- Follow-up branch: `fix/crystal-ball-audio-timeout-closure`.
- Candidate change: close the callback with `}, 160);`; remove a duplicate `sound.stop(stoppedId)` from inside the same-ID guard. Preserve the 160 ms fade, captured sound ID, cache reset guard, and immediate-stop fallback.
- Existing `__tests__/audio-exports.test.js` imports this module and should catch parser/import errors, but it has not been run on this candidate from this session.
- Verification status: no local checkout is available because `git clone` failed on GitHub DNS resolution. Await candidate PR CI for unit tests and OpenNext/Cloudflare build; do not claim production recovery until the relevant build passes.
- Remaining repository gates: `pnpm tsc --noEmit`, `./jules-verify.sh`, exact `.next + public` size below 495 MiB, and real mobile playback remain unverified unless a CI run supplies evidence.

## Current Focus — Crystal Ball Audio and Daily Question Limit (2026-10-17)

- Goal: Add understated audio to the Crystal Ball's energy/reveal/leaf phases and cap successful AI-backed answers at three per client IP per UTC day.
- Branch / PR: feat/crystal-ball-audio-daily-limit / PR #1505.
- Implementation: Existing Howler and local sound assets reused. Oracle route uses reservation/commit/release usage accounting and an uncached status endpoint. UI displays questions remaining and blocks another submission at zero.
- Feature artifacts: specs/025-crystal-ball-audio-daily-limit; .specify/feature.json points to this active feature. PR_SUMMARY.md and tasks.md record the workflow and verification state.
- Verified on code revision 340cc8d7ee784827a4a9faadb142ef61239a60ee: pnpm run test PASS (10 files / 70 tests); Playwright PASS (21 passed / 3 skipped); Next.js build/TypeScript stage PASS; OpenNext Cloudflare build PASS; Wrangler build validation PASS; CodeQL PASS.
- Reviewer status: Robin Code Review timed out at two minutes and posted no review. This is not a code-review finding.
- Outstanding: ./jules-verify.sh and standalone pnpm tsc --noEmit were not run because no repository shell is available. Exact .next + public size vs. 495 MiB and real mobile audio remain unverified. The OpenNext validation workflow is protected and was left unchanged; do not bypass the repository's authorization gate.
- Storage caveat: Redis Lua scripts are atomic across Worker isolates when configured. Cloudflare KV is persistent but does not guarantee cross-isolate atomic reservations. Confirm production Upstash Redis configuration.
- CI workflow change: .github/workflows/visual-qa.yml now runs pnpm run test before its full Playwright suite, so unit tests are exercised on future PRs.


## Current Focus — Robin Review Reliability (2026-10-16)

- Goal: Bound Robin review runtime while keeping the free router that actually completed a live review; do not add a second in-Robin model attempt.
- Verified root cause: .github/workflows/robin.yml called a moving reusable workflow whose internal job has a 45-minute timeout. It passed a custom 300-second timeout to Robin's openrouter/free router, overriding the two-minute router default. Robin clears the router stall timer after the first SSE chunk, so later generation was not bounded by that timer; logs show long calls, empty output and provider internal errors.
- Fix under review on fix/robin-bounded-review-fallback: pinned Robin action, default openrouter/free, 90-second client timeout, two-minute action-step cap, five-minute job cap, safe missing-key preflight, cancellation-aware review guard and final recheck. Live run #38988422706 posted review #5555193756 and completed in about 1m52s; the review had zero findings. The failure path was also observed to exit within the cap.
- Verification: source and historical logs inspected; live success and fail-closed timeout runs observed. Local clone failed because this session could not resolve github.com; ./jules-verify.sh remains unrun locally.


## Previous Focus — Premium Golden Maple-Leaf Assets (2026-10-16)

- Goal: Replace inline SVG leaf rendering with a shared polished asset served AVIF → WebP → SVG fallback.
- Shared usage: The text cursor and separate flying copy both reuse GoldenLeaf; original Crystal Ball artwork, reveal order, repeat questions, and reduced-motion behavior remain protected.
- Branch: `polish/crystal-ball-golden-leaf-assets`.
- Asset sizes verified: AVIF 2,316 bytes; WebP 3,870 bytes at 112 × 122 pixels. Git object IDs match the local outputs.
- Verification status: source and Playwright regression assertions prepared; test suite, `./jules-verify.sh`, production build, OpenNext/Cloudflare validation, and total build size are awaiting CI. Do not call deployment verified until those checks pass.


## Previous Focus — Crystal Ball Leaf-First Fortune Reveal (2026-10-16)

- Goal: Orb gathers energy and flashes first, then a duplicate maple leaf falls into the answer panel; character-by-character typing begins only after the leaf flight.
- Scope: UI animation and Playwright coverage only. Keep source artwork unchanged, reuse GoldenLeaf as a separate SVG clone, preserve reduced-motion support, and allow multiple questions in one visit.
- Branch: feat/crystal-ball-leaf-first-reveal.
- Verification: remote PR checks are pending. Local shell commands and build-size measurements are unavailable through the GitHub API connection.


## Current Focus — Spec Kit Updater Recovery (2026-10-16)

- **Goal**: Restore the managed Spec Kit command file that was accidentally reduced to one line and make the scheduled updater perform at most one retry.
- **Verified failure**: Scheduled workflow run #24 failed at `specify integration upgrade generic` because `.jules/cmds/speckit.specify.md` differed from the hash recorded by `.specify/integrations/generic.manifest.json`.
- **Command restoration**: The restored command is byte-for-byte the last known-good integration-managed copy; its computed SHA-256 matches the manifest entry `21634a45dfcf642fddb1645f4ad2980f98c89778442e47663df8a6c3a1eaf8bc`.
- **Schedule**: Tuesday/Friday at 1:05 AM Halifax time with one retry at 5:05 AM; the 9:05 AM third run is removed. The daily guard still skips the retry after a PR was created or refreshed successfully.
- **Safety**: The updater continues to run without `--force`, preserving Spec Kit's protection against overwriting genuinely modified managed files.
- **Verification status**: Source-level failure and manifest-hash match verified. The repository build, `./jules-verify.sh`, post-merge updater run, and actual build-size measurement remain pending because this connection cannot execute repository shell commands.
- **Next step**: Review and merge the proposed PR, then manually dispatch the workflow once to verify the full upgrade → status → governance → PR sequence before relying on the next scheduled run.

## Previous Focus — AVIF Optimization (Historical)

- **Current Goal**: Improve image-loading performance across the application by making AVIF the preferred delivery format for eligible raster images.
- **Latest Verified Issue**: Large raster image assets (like the 3.1 MB card poster, 2.5 MB background, and 2.4 MB Milky Way) were being served as JPEGs, PNGs, or WebP. Given Cloudflare configuration and `images.unoptimized: true`, these were not auto-optimizing to next-gen formats beyond the original format.
- **Verified Findings**:
  - `sharp` v0.35.5 successfully achieved 30% to 94% compression ratios on these static assets by generating AVIF outputs.
  - The implementation uses `<picture>` tags to conditionally serve `image/avif` with WebP and original format fallbacks across `Hero.js`, `lucky-meter/page.js`, `lucky-map-of-canada.js`, `share-lucky-pick-button.js`, `crystal-ball/page.js`, and `lucky-card-reveal.js`.
  - Next.js preload hints were properly updated for `Hero.js` to target the `.avif` type.
- **Current Branch**: `avif-optimization`.
- **Additional Fixes**: None, scoped entirely to image optimization.
- **Implementation Status**: Completed AVIF implementation part 2 (Lucky Map, Lucky Meter, Crystal Ball). Verification tests (`pnpm run build`, `./jules-verify.sh`, and `playwright test`) are green. The build size remains well below the 495MB limit (`.next` is 353MB, `public` is 24MB).
- **Next Steps**: Await further requirements or enhancements.

## Crystal Ball Reference-Artwork Correction — 2026-10-15

- **Goal:** Replace the incorrect console-like illustration introduced by merged PR #1484 with a crystal ball matching the supplied target.
- **Verified root cause:** The old component loaded `/assets/crystal-ball-pedestal.avif` (with WebP/PNG fallbacks) as the main artwork. The previous visual test verified asset loading and geometry, not the depicted subject.
- **Current branch:** `fix/crystal-ball-reference-artwork`.
- **Current implementation:** Use a transparent foreground SVG illustration with a reflective blue-violet orb, ruby maple leaf, emerald clover, sapphire drop and ornate gold-and-obsidian pedestal. Preserve the existing page background and interactions.
- **Verification:** Implemented a new transparent version derived directly from the provided source artwork using `sharp`. Cropped the image to its natural dimensions (716x875), converting the magenta background and fringing to true transparency while preserving shadows. Updated `app/components/CrystalBall/CrystalBall.tsx` dimensions to match. Re-generated highly optimized AVIF, WebP, and PNG assets. Tests (`pnpm run test`, `pnpm run build`, and `./jules-verify.sh`) passed completely. Verified build size continues to stay well below 495MB limit (318MB .next and 29MB public). A PR summary was completed.

## Crystal Ball Fortune Reveal & Animations — 2026-10-15

- **Goal:** Enhance the Crystal Ball experience with subtle lighting, a fortune-reveal animation, and move the generated fortune directly beneath the crystal ball.
- **Verified root cause:** The fortune was previously rendered inside the question input card, causing visual disconnect and requiring scrolling. Visual states for processing were limited to the button itself.
- **Current branch:** `task-branch` (feat: crystal ball animation).
- **Current implementation:** Added a `revealing` state to `CrystalBall.tsx` to handle the transition. Extracted the fortune result into a new `.fortunePanel` placed directly below the crystal ball scene. Added CSS animations (`.ballInnerGlowLoading` and `.ballInnerGlowRevealing`) for the gathering energy shimmer and warm pulse.
- **Verification:** Implemented a new Playwright visual interaction test (`tests/visual/crystal-ball-interactions.spec.ts`) that verifies the end-to-end flow. Tests (`pnpm run test`, `pnpm run build`, `./jules-verify.sh`, and `pnpm exec playwright test`) passed completely. Verified build size continues to stay well below 495MB limit (369MB .next and 29MB public). A PR summary was completed in `pr_summary.md`.

## Crystal Ball Cloudflare Build Repair — 2026-10-15

- **Goal:** Repair the post-PR #1489 Cloudflare production build failure in `app/components/CrystalBall/CrystalBall.tsx`.
- **Verified failure:** The supplied OpenNext/Cloudflare log failed during Next.js compilation because the opening `<picture>` tag was missing before a remaining `</picture>`. Inspection also found duplicate glow markup, duplicate JSX attributes, a missing textarea `onChange`, and a missing fortune-button `onClick`.
- **Repair branch:** `fix/crystal-ball-cloudflare-build-1489`.
- **Changes made:** Restored a single dynamic glow, valid AVIF/WebP/PNG `<picture>` structure, a controlled textarea, the Seek Fortune click handler with existing audio feedback, and consolidated disabled/accessibility attributes. Updated the active feature's repair spec, plan, and task checklist.
- **Verification status:** Source and documentation changes are committed remotely. Local verification could not run because the environment could not resolve `github.com` during a clone attempt. Playwright, `./jules-verify.sh`, production build-size measurement, and post-fix Cloudflare build remain pending remote CI evidence.


- **Visual QA follow-up:** PR #1490's first Visual QA run failed because the test called the real `/api/oracle`, and CI logs confirmed `GROQ_API_KEY environment variable is missing`. The API returned an error before the test could observe the loading label. Updated `tests/visual/crystal-ball-interactions.spec.ts` to mock `/api/oracle` with a deterministic delayed success response. This addresses the test's missing-credential dependency; the rerun is still required before claiming a pass.

## Crystal Ball Fortune Reveal Enhancement — 2026-10-15

- **Goal:** Polish the Crystal Ball UI by adding smooth scrolling, progressive word reveal for fortunes, a golden leaf animation, and a completion pulse.
- **Current branch:** `task-branch`.
- **Current implementation:** Created a lightweight inline SVG `GoldenLeaf.tsx`. Refactored `CrystalBall.tsx` to include `revealing` and `completionPulse` states. Extracted words into span tags that fade in sequentially. Hidden the visual text from screen readers using `aria-hidden` and provided the full text inside an `.sr-only` wrapper. Added a `getBoundingClientRect()` check to scroll the component into view on submit. Respects `prefers-reduced-motion`.
- **Verification:** Updated `crystal-ball-interactions.spec.ts` to assert the correct states. Tests (`pnpm run test`, `pnpm run build`, `./jules-verify.sh`, and `pnpm exec playwright test`) passed completely. Build size is safely below 495MB (~415MB). PR Summary has been generated.


## Crystal Ball JSX Build Repair — 2026-10-15

- **Goal:** Synchronize the Crystal Ball fortune reveal interactions (scroll, lighting, and text animation).
- **Verified root cause:** The `scrollIntoView` fired synchronously but wasn't padded with any delay for the UI to actually settle before the text started streaming. The text animation rendered entire words at a time via a fixed speed index that raced past readers. The "loading glow" explicitly decoupled from the text rendering portion, ending early. The golden leaf position was hardcoded through a timed CSS animation track rather than following the text dynamically.
- **Current branch:** `task-branch`
- **Current implementation:** Updated the `CrystalBall.tsx` component to initialize smooth scroll immediately. Bound the loading glow to span BOTH the loading API state and the text revealing state, falling back to a pulse only after typing completes. Converted the words index arrays to a character map queue, calculating natural punctuation/space breaks and writing speed organically. Removed absolute positioned CSS for the golden leaf and instead mounted it inline as part of the React node iteration for the most recent un-typed character span.
- **Verification:** Ran E2E Playwright `tests/visual/crystal-ball-interactions.spec.ts` with updated timeouts for the slower character typing speed. Size output tests under 495MB via `.next/`. `jules-verify.sh` verified Spec Kit files are populated.
- **Verified root cause:** The mapped JSX had no opening `<span>` element, contained two `key` attributes, and still ended with `</span>`, causing Next.js compilation to fail.
- **Repair branch:** `fix/crystal-ball-fortune-jsx-1491`.
- **Change:** Restore the opening `<span>`, keep the content-derived key, and preserve the existing reveal class and word spacing.
- **Verification status:** Source correction committed on a repair branch; CI build, `./jules-verify.sh`, Playwright, and the 495 MB build-size check must pass before the fix is considered verified.


## Follow-on GoldenLeaf JSX Build Repair — 2026-10-15
- **Evidence:** OpenNext validation for PR #1492 failed at `app/components/CrystalBall/GoldenLeaf.tsx:26` during `pnpm run build`; the Cloudflare-specific steps were skipped.
- **Root cause:** A prior edit duplicated opening gradient/path JSX tags and removed the original path attributes/data.
- **Repair:** Restored the complete original SVG gradient and maple-leaf path markup, with per-instance gradient IDs from `useId()` referenced by JSX expressions. Existing artwork and gradient stops are preserved.
- **Status:** Fix committed on `fix/crystal-ball-fortune-jsx-1491`; a fresh CI run must prove the build and subsequent checks pass.## Current Focus — PR #1510 code-scanning cleanup and quota-aware Amazon Q reviewer fallback (2026-10-17)

- User explicitly authorized full repair of PR #1510 (code-scanning alert #16).
- Cleanup commit 8bdd4fe removed inert `test_fix.js` and added dedicated Spec Kit artifacts. Its verification passed 76 unit tests, TypeScript, `./jules-verify.sh`, Playwright (21 passed / 3 skipped / 0 failed), OpenNext/Wrangler, CodeQL, and 495 MiB size gate at 310.35 MiB.
- OpenRouter quota diagnostic showed HTTP 200, key accepted, free-model quota 0/50.
- Quota-aware fallback passed on e459b24309a8b5382ea803313d2474547b713898: Robin skipped; Amazon Q review #5558036445 matched exact SHA; reviewer check passed.
- Amazon Q identified skipped-primary handling, explicit nonempty secret redaction, and timeout alignment. These are fixed in later candidate commits. A final read-back additionally found and fixed an over-escaped bearer redaction regex and removed the redundant formatter; new current-head CI must validate these final workflow changes.
- Final reviewer policy still fails unless a substantive Robin or Amazon Q review is found for the exact current SHA. No bypass, deployment, or merge was performed.
- No application source, dependencies, secrets, UI, API routes, or deployment configuration changed. Local shell clone is unavailable due github.com DNS resolution; remote Actions provide actual execution evidence.

---

## Current Focus — Newly sourced Crystal Ball audio (2026-10-17)

- Authorized request: replace the three borrowed Crystal Ball cues with new, licensed online assets; preserve the reveal order and existing Howler controls.
- Selected candidates from Pixabay: a 16-second magical aura/energy loop by Coghezzi, a 3-second spell impact by RescopicSound, and a 2-second twinkle/sparkle by ShidenBeatsMusic. The listing pages show free use under Pixabay's Content License; direct media URLs and artists are recorded in the provenance file.
- The no-key CLI workflow succeeded on GitHub Actions run #1: curl fetched all three licensed Pixabay source files, FFmpeg 6.1.1 converted them to same-origin WAVs, and Python verified PCM settings, expected durations, non-silent samples, no full-scale clipping, and <2 MiB per file. Measured assets: energy 15.700 s / 692,430 bytes; reveal 3.192 s / 140,846 bytes; leaf 2.038 s / 89,934 bytes.
- New WAVs are committed under `public/sounds/`; MP3 originals stayed in the runner temp directory. The temporary asset-preparation workflow has been removed from the final diff to avoid a permanent self-committing workflow.
- Branch / PR: feat/crystal-ball-new-sourced-audio / PR #1509. Code path changes are in `app/lib/audio.js`; Spec Kit active feature remains `specs/025-crystal-ball-audio-daily-limit`.
- Final tests, governance verification, build-size measurement and OpenNext/Cloudflare build checks still need candidate-PR evidence. Real-device audio playback remains unverified.

---

## Current Focus — Follow-up Crystal Ball audio syntax correction (2026-10-17)

- The Cloudflare build started after PR #1506 merged still failed at `app/lib/audio.js:208` with `Expected ',', got 'else'`.
- The current source confirms that `stopCrystalBallEnergy` and its server-side guard exist, but the delayed `setTimeout` callback was not closed before the fallback `else`. The function therefore remains syntactically invalid despite the previous repair.
- Follow-up branch: `fix/crystal-ball-audio-timeout-closure`.
- Candidate change: close the callback with `}, 160);`; remove a duplicate `sound.stop(stoppedId)` from inside the same-ID guard. Preserve the 160 ms fade, captured sound ID, cache reset guard, and immediate-stop fallback.
- Existing `__tests__/audio-exports.test.js` imports this module and should catch parser/import errors, but it has not been run on this candidate from this session.
- Verification status: no local checkout is available because `git clone` failed on GitHub DNS resolution. Await candidate PR CI for unit tests and OpenNext/Cloudflare build; do not claim production recovery until the relevant build passes.
- Remaining repository gates: `pnpm tsc --noEmit`, `./jules-verify.sh`, exact `.next + public` size below 495 MiB, and real mobile playback remain unverified unless a CI run supplies evidence.

## Current Focus — Crystal Ball Audio and Daily Question Limit (2026-10-17)

- Goal: Add understated audio to the Crystal Ball's energy/reveal/leaf phases and cap successful AI-backed answers at three per client IP per UTC day.
- Branch / PR: feat/crystal-ball-audio-daily-limit / PR #1505.
- Implementation: Existing Howler and local sound assets reused. Oracle route uses reservation/commit/release usage accounting and an uncached status endpoint. UI displays questions remaining and blocks another submission at zero.
- Feature artifacts: specs/025-crystal-ball-audio-daily-limit; .specify/feature.json points to this active feature. PR_SUMMARY.md and tasks.md record the workflow and verification state.
- Verified on code revision 340cc8d7ee784827a4a9faadb142ef61239a60ee: pnpm run test PASS (10 files / 70 tests); Playwright PASS (21 passed / 3 skipped); Next.js build/TypeScript stage PASS; OpenNext Cloudflare build PASS; Wrangler build validation PASS; CodeQL PASS.
- Reviewer status: Robin Code Review timed out at two minutes and posted no review. This is not a code-review finding.
- Outstanding: ./jules-verify.sh and standalone pnpm tsc --noEmit were not run because no repository shell is available. Exact .next + public size vs. 495 MiB and real mobile audio remain unverified. The OpenNext validation workflow is protected and was left unchanged; do not bypass the repository's authorization gate.
- Storage caveat: Redis Lua scripts are atomic across Worker isolates when configured. Cloudflare KV is persistent but does not guarantee cross-isolate atomic reservations. Confirm production Upstash Redis configuration.
- CI workflow change: .github/workflows/visual-qa.yml now runs pnpm run test before its full Playwright suite, so unit tests are exercised on future PRs.


## Current Focus — Robin Review Reliability (2026-10-16)

- Goal: Bound Robin review runtime while keeping the free router that actually completed a live review; do not add a second in-Robin model attempt.
- Verified root cause: .github/workflows/robin.yml called a moving reusable workflow whose internal job has a 45-minute timeout. It passed a custom 300-second timeout to Robin's openrouter/free router, overriding the two-minute router default. Robin clears the router stall timer after the first SSE chunk, so later generation was not bounded by that timer; logs show long calls, empty output and provider internal errors.
- Fix under review on fix/robin-bounded-review-fallback: pinned Robin action, default openrouter/free, 90-second client timeout, two-minute action-step cap, five-minute job cap, safe missing-key preflight, cancellation-aware review guard and final recheck. Live run #38988422706 posted review #5555193756 and completed in about 1m52s; the review had zero findings. The failure path was also observed to exit within the cap.
- Verification: source and historical logs inspected; live success and fail-closed timeout runs observed. Local clone failed because this session could not resolve github.com; ./jules-verify.sh remains unrun locally.


## Previous Focus — Premium Golden Maple-Leaf Assets (2026-10-16)

- Goal: Replace inline SVG leaf rendering with a shared polished asset served AVIF → WebP → SVG fallback.
- Shared usage: The text cursor and separate flying copy both reuse GoldenLeaf; original Crystal Ball artwork, reveal order, repeat questions, and reduced-motion behavior remain protected.
- Branch: `polish/crystal-ball-golden-leaf-assets`.
- Asset sizes verified: AVIF 2,316 bytes; WebP 3,870 bytes at 112 × 122 pixels. Git object IDs match the local outputs.
- Verification status: source and Playwright regression assertions prepared; test suite, `./jules-verify.sh`, production build, OpenNext/Cloudflare validation, and total build size are awaiting CI. Do not call deployment verified until those checks pass.


## Previous Focus — Crystal Ball Leaf-First Fortune Reveal (2026-10-16)

- Goal: Orb gathers energy and flashes first, then a duplicate maple leaf falls into the answer panel; character-by-character typing begins only after the leaf flight.
- Scope: UI animation and Playwright coverage only. Keep source artwork unchanged, reuse GoldenLeaf as a separate SVG clone, preserve reduced-motion support, and allow multiple questions in one visit.
- Branch: feat/crystal-ball-leaf-first-reveal.
- Verification: remote PR checks are pending. Local shell commands and build-size measurements are unavailable through the GitHub API connection.


## Current Focus — Spec Kit Updater Recovery (2026-10-16)

- **Goal**: Restore the managed Spec Kit command file that was accidentally reduced to one line and make the scheduled updater perform at most one retry.
- **Verified failure**: Scheduled workflow run #24 failed at `specify integration upgrade generic` because `.jules/cmds/speckit.specify.md` differed from the hash recorded by `.specify/integrations/generic.manifest.json`.
- **Command restoration**: The restored command is byte-for-byte the last known-good integration-managed copy; its computed SHA-256 matches the manifest entry `21634a45dfcf642fddb1645f4ad2980f98c89778442e47663df8a6c3a1eaf8bc`.
- **Schedule**: Tuesday/Friday at 1:05 AM Halifax time with one retry at 5:05 AM; the 9:05 AM third run is removed. The daily guard still skips the retry after a PR was created or refreshed successfully.
- **Safety**: The updater continues to run without `--force`, preserving Spec Kit's protection against overwriting genuinely modified managed files.
- **Verification status**: Source-level failure and manifest-hash match verified. The repository build, `./jules-verify.sh`, post-merge updater run, and actual build-size measurement remain pending because this connection cannot execute repository shell commands.
- **Next step**: Review and merge the proposed PR, then manually dispatch the workflow once to verify the full upgrade → status → governance → PR sequence before relying on the next scheduled run.

## Previous Focus — AVIF Optimization (Historical)

- **Current Goal**: Improve image-loading performance across the application by making AVIF the preferred delivery format for eligible raster images.
- **Latest Verified Issue**: Large raster image assets (like the 3.1 MB card poster, 2.5 MB background, and 2.4 MB Milky Way) were being served as JPEGs, PNGs, or WebP. Given Cloudflare configuration and `images.unoptimized: true`, these were not auto-optimizing to next-gen formats beyond the original format.
- **Verified Findings**:
  - `sharp` v0.35.5 successfully achieved 30% to 94% compression ratios on these static assets by generating AVIF outputs.
  - The implementation uses `<picture>` tags to conditionally serve `image/avif` with WebP and original format fallbacks across `Hero.js`, `lucky-meter/page.js`, `lucky-map-of-canada.js`, `share-lucky-pick-button.js`, `crystal-ball/page.js`, and `lucky-card-reveal.js`.
  - Next.js preload hints were properly updated for `Hero.js` to target the `.avif` type.
- **Current Branch**: `avif-optimization`.
- **Additional Fixes**: None, scoped entirely to image optimization.
- **Implementation Status**: Completed AVIF implementation part 2 (Lucky Map, Lucky Meter, Crystal Ball). Verification tests (`pnpm run build`, `./jules-verify.sh`, and `playwright test`) are green. The build size remains well below the 495MB limit (`.next` is 353MB, `public` is 24MB).
- **Next Steps**: Await further requirements or enhancements.

## Crystal Ball Reference-Artwork Correction — 2026-10-15

- **Goal:** Replace the incorrect console-like illustration introduced by merged PR #1484 with a crystal ball matching the supplied target.
- **Verified root cause:** The old component loaded `/assets/crystal-ball-pedestal.avif` (with WebP/PNG fallbacks) as the main artwork. The previous visual test verified asset loading and geometry, not the depicted subject.
- **Current branch:** `fix/crystal-ball-reference-artwork`.
- **Current implementation:** Use a transparent foreground SVG illustration with a reflective blue-violet orb, ruby maple leaf, emerald clover, sapphire drop and ornate gold-and-obsidian pedestal. Preserve the existing page background and interactions.
- **Verification:** Implemented a new transparent version derived directly from the provided source artwork using `sharp`. Cropped the image to its natural dimensions (716x875), converting the magenta background and fringing to true transparency while preserving shadows. Updated `app/components/CrystalBall/CrystalBall.tsx` dimensions to match. Re-generated highly optimized AVIF, WebP, and PNG assets. Tests (`pnpm run test`, `pnpm run build`, and `./jules-verify.sh`) passed completely. Verified build size continues to stay well below 495MB limit (318MB .next and 29MB public). A PR summary was completed.

## Crystal Ball Fortune Reveal & Animations — 2026-10-15

- **Goal:** Enhance the Crystal Ball experience with subtle lighting, a fortune-reveal animation, and move the generated fortune directly beneath the crystal ball.
- **Verified root cause:** The fortune was previously rendered inside the question input card, causing visual disconnect and requiring scrolling. Visual states for processing were limited to the button itself.
- **Current branch:** `task-branch` (feat: crystal ball animation).
- **Current implementation:** Added a `revealing` state to `CrystalBall.tsx` to handle the transition. Extracted the fortune result into a new `.fortunePanel` placed directly below the crystal ball scene. Added CSS animations (`.ballInnerGlowLoading` and `.ballInnerGlowRevealing`) for the gathering energy shimmer and warm pulse.
- **Verification:** Implemented a new Playwright visual interaction test (`tests/visual/crystal-ball-interactions.spec.ts`) that verifies the end-to-end flow. Tests (`pnpm run test`, `pnpm run build`, `./jules-verify.sh`, and `pnpm exec playwright test`) passed completely. Verified build size continues to stay well below 495MB limit (369MB .next and 29MB public). A PR summary was completed in `pr_summary.md`.

## Crystal Ball Cloudflare Build Repair — 2026-10-15

- **Goal:** Repair the post-PR #1489 Cloudflare production build failure in `app/components/CrystalBall/CrystalBall.tsx`.
- **Verified failure:** The supplied OpenNext/Cloudflare log failed during Next.js compilation because the opening `<picture>` tag was missing before a remaining `</picture>`. Inspection also found duplicate glow markup, duplicate JSX attributes, a missing textarea `onChange`, and a missing fortune-button `onClick`.
- **Repair branch:** `fix/crystal-ball-cloudflare-build-1489`.
- **Changes made:** Restored a single dynamic glow, valid AVIF/WebP/PNG `<picture>` structure, a controlled textarea, the Seek Fortune click handler with existing audio feedback, and consolidated disabled/accessibility attributes. Updated the active feature's repair spec, plan, and task checklist.
- **Verification status:** Source and documentation changes are committed remotely. Local verification could not run because the environment could not resolve `github.com` during a clone attempt. Playwright, `./jules-verify.sh`, production build-size measurement, and post-fix Cloudflare build remain pending remote CI evidence.


- **Visual QA follow-up:** PR #1490's first Visual QA run failed because the test called the real `/api/oracle`, and CI logs confirmed `GROQ_API_KEY environment variable is missing`. The API returned an error before the test could observe the loading label. Updated `tests/visual/crystal-ball-interactions.spec.ts` to mock `/api/oracle` with a deterministic delayed success response. This addresses the test's missing-credential dependency; the rerun is still required before claiming a pass.

## Crystal Ball Fortune Reveal Enhancement — 2026-10-15

- **Goal:** Polish the Crystal Ball UI by adding smooth scrolling, progressive word reveal for fortunes, a golden leaf animation, and a completion pulse.
- **Current branch:** `task-branch`.
- **Current implementation:** Created a lightweight inline SVG `GoldenLeaf.tsx`. Refactored `CrystalBall.tsx` to include `revealing` and `completionPulse` states. Extracted words into span tags that fade in sequentially. Hidden the visual text from screen readers using `aria-hidden` and provided the full text inside an `.sr-only` wrapper. Added a `getBoundingClientRect()` check to scroll the component into view on submit. Respects `prefers-reduced-motion`.
- **Verification:** Updated `crystal-ball-interactions.spec.ts` to assert the correct states. Tests (`pnpm run test`, `pnpm run build`, `./jules-verify.sh`, and `pnpm exec playwright test`) passed completely. Build size is safely below 495MB (~415MB). PR Summary has been generated.


## Crystal Ball JSX Build Repair — 2026-10-15

- **Goal:** Synchronize the Crystal Ball fortune reveal interactions (scroll, lighting, and text animation).
- **Verified root cause:** The `scrollIntoView` fired synchronously but wasn't padded with any delay for the UI to actually settle before the text started streaming. The text animation rendered entire words at a time via a fixed speed index that raced past readers. The "loading glow" explicitly decoupled from the text rendering portion, ending early. The golden leaf position was hardcoded through a timed CSS animation track rather than following the text dynamically.
- **Current branch:** `task-branch`
- **Current implementation:** Updated the `CrystalBall.tsx` component to initialize smooth scroll immediately. Bound the loading glow to span BOTH the loading API state and the text revealing state, falling back to a pulse only after typing completes. Converted the words index arrays to a character map queue, calculating natural punctuation/space breaks and writing speed organically. Removed absolute positioned CSS for the golden leaf and instead mounted it inline as part of the React node iteration for the most recent un-typed character span.
- **Verification:** Ran E2E Playwright `tests/visual/crystal-ball-interactions.spec.ts` with updated timeouts for the slower character typing speed. Size output tests under 495MB via `.next/`. `jules-verify.sh` verified Spec Kit files are populated.
- **Verified root cause:** The mapped JSX had no opening `<span>` element, contained two `key` attributes, and still ended with `</span>`, causing Next.js compilation to fail.
- **Repair branch:** `fix/crystal-ball-fortune-jsx-1491`.
- **Change:** Restore the opening `<span>`, keep the content-derived key, and preserve the existing reveal class and word spacing.
- **Verification status:** Source correction committed on a repair branch; CI build, `./jules-verify.sh`, Playwright, and the 495 MB build-size check must pass before the fix is considered verified.


## Follow-on GoldenLeaf JSX Build Repair — 2026-10-15
- **Evidence:** OpenNext validation for PR #1492 failed at `app/components/CrystalBall/GoldenLeaf.tsx:26` during `pnpm run build`; the Cloudflare-specific steps were skipped.
- **Root cause:** A prior edit duplicated opening gradient/path JSX tags and removed the original path attributes/data.
- **Repair:** Restored the complete original SVG gradient and maple-leaf path markup, with per-instance gradient IDs from `useId()` referenced by JSX expressions. Existing artwork and gradient stops are preserved.
- **Status:** Fix committed on `fix/crystal-ball-fortune-jsx-1491`; a fresh CI run must prove the build and subsequent checks pass.

 
## CI Stability Repair — PR #1518 Follow-up (2026-10-18)

- Updated the Robin Groq model, workflow assertion, and Crystal Ball daily-limit Playwright timing/text checks.
- Verification is pending: CI showed OpenNext build/495 MiB gate passed, but Robin failed because the 8,000 TPM limit rejected a 10,763-token request. See PR Summary for evidence and remaining checks.


## Deep-Dive Investigation Scope Clarification — 2026-10-18

- Owner-authorized clarification task: correct `.jules/deep-dive.md` so substantive, evidence-driven audit-only investigations are permitted when explicitly authorized.
- The default remains to inform implementation when implementation is within authorized scope; Jules must not force code changes, delete files, or expand scope merely to produce a code change.
- `AGENTS.md` and `.docs/` are unchanged. Spec Kit artifacts are in `specs/032-deep-dive-scope-clarification/`.
- Verification status: wording and scoped diff inspected through GitHub; `./jules-verify.sh` and current-head PR checks remain pending.

## Homepage SEO Section Background Fix — $(date +%Y-%m-%d)
- **Goal**: Fix the visual background of the SEO section on the homepage to match the "About the Creator" teaser styling.
- **Verified root cause**: The section `.homepage-seo-section` sits outside the `.homepage-experience` shell in `app/page.js`, so the scoped rules applying its glass styling didn't trigger, rendering a mismatched background.
- **Current branch**: `jules-fix-seo-bg`
- **Current implementation**: Updated `themes/default/homepage.css` (and its public counterpart) to add `.homepage-seo-section` to the existing glass-surface teaser declarations and stripped its obsolete scoped declaration. The visual rhythm, content, and original UI layouts were untouched.
- **Verification status**: Playwright visual verifications passed. `./jules-verify.sh`, tests, and the build limit (<495MB) passed successfully. PR Summary drafted.

## Robin Code Review CI Repair — $(date +%Y-%m-%d)
- **Goal**: Fix the broken GitHub Actions `Robin Code Review` job due to a deprecated/missing fallback model throwing 400 and 404 validation errors.
- **Verified root cause**: The `model` parameter inside the `.github/workflows/robin.yml` Groq fallback job was pointing to `openai/gpt-oss-20b` and later `llama-3.1-8b-instant` which were either deprecated or nonexistent at `api.groq.com`.
- **Current branch**: `task-ci-repair`
- **Current implementation**: Adjusted the fallback model parameter to the verified model identifier `llama3-8b-8192` in both the GitHub Actions `.yml` workflow file and the workflow test assertions script `tests/workflows/robin-groq-fallback.test.ts`.
- **Verification status**: Unit tests passed completely locally with `pnpm test`. Waiting for live CI verification.

## Robin Code Review CI Repair — $(date +%Y-%m-%d)
- **Goal**: Fix the broken GitHub Actions `Robin Code Review` job due to a deprecated/missing fallback model throwing 400 and 404 validation errors.
- **Verified root cause**: The `model` parameter inside the `.github/workflows/robin.yml` Groq fallback job was pointing to `openai/gpt-oss-20b`, `llama-3.1-8b-instant`, and `llama3-8b-8192` which were either deprecated or nonexistent at `api.groq.com`.
- **Current branch**: `task-ci-repair`
- **Current implementation**: Adjusted the fallback model parameter to the verified model identifier `mixtral-8x7b-32768` in both the GitHub Actions `.yml` workflow file and the workflow test assertions script `tests/workflows/robin-groq-fallback.test.ts`.
- **Verification status**: Unit tests passed completely locally with `pnpm test`. Waiting for live CI verification.

- **Robin Retirement**: Robin automated review workflows and its Groq fallback have been fully retired and removed per owner request. CodeRabbit and Amazon Q remain active. The Crystal Ball Oracle functionality remains untouched and retains its required `GROQ_API_KEY`. Obsolete secrets/variables tied to Robin (`OPENROUTER_API_KEY`, `ROBIN_LLM_MODEL`, `ROBIN_LLM_BASE_URL`) have been documented for manual removal.


## Reliable Updater Scheduling — 2026-10-20

- **Goal:** Reduce dependency on GitHub's repeatedly delayed scheduled events for the Spec Kit updater and documentation refresher.
- **Evidence inspected:** The current schedule definitions remain in `.github/workflows/update-spec-kit.yml` and `.github/workflows/refresh-docs.yml`. Historical runs on October 13 and October 16 show multi-hour start delays. Independent workflow failures were also recorded and are not assumed to be solved by a scheduler.
- **Implementation candidate:** Isolated Cloudflare Worker under `workers/updater-scheduler/`, with an explicit five-slot allowlist, `America/Halifax` mapping, a GitHub workflow-dispatch request, and dispatch disabled by default.
- **Safety:** Existing GitHub schedules are unchanged. The Worker is not enabled, has not been deployed from this branch, and has not dispatched a live updater. No token or other secret was added to source.
- **Local verification:** The first standalone prototype's Node.js test suite reported 11 passed / 0 failed. The branch's exact current-head tests, Wrangler dry run, `./jules-verify.sh`, and repository build-size gate still require current-head CI confirmation.
- **Branch:** `fix/updater-scheduler-reliability-1540`. This remains a review candidate until the draft PR's checks are observed.
- **Remaining gates:** Confirm Cloudflare trigger quota and deployment/secret configuration, then review a separate cutover before enabling Worker dispatch or removing existing schedule entries. Verify a natural scheduled run before claiming the scheduling issue is resolved.


## Updater Scheduler — No-Retry and Invalid-Time Safeguards — 2026-10-20

- Official Cloudflare Scheduled Handler/Cron Trigger documentation supports `controller.noRetry()`. Approved target slots invoke it before the GitHub request, avoiding platform replay if an ambiguous network failure happens after GitHub accepts the dispatch. Existing backup/recovery slots remain the retry path.
- Amazon Q's missing-time edge case was accepted: `resolveTarget` now rejects missing, nonnumeric, or non-finite scheduled timestamps before date conversion; tests assert ignored outcome and zero dispatch/noRetry calls.
- Amazon Q's separate claim that the deployment job lacks tests was checked against the actual workflow: the deploy job already runs the scheduler test command before Wrangler deployment, so no redundant step was added.
- Latest verified PR head before the timestamp-guard follow-up: commit `71a6801c9a766b479cf244cd0b05530dac31100d`; 12 scheduler tests, `./jules-verify.sh`, Wrangler dry run and OpenNext/build-size gate passed. Actual combined build size was 325,595,902 bytes (310.51 MiB). Current timestamp-guard follow-up requires a new CI run.
- Existing GitHub updater schedules remain enabled. Worker deployment, token setup, quota and live dispatch are not verified.

## Jules Governance Flow — 2026-10-20

- **User-authorized change:** Simplify the Jules governance lifecycle while preserving the four mandatory Spec Kit stages, required verification, protected-system authorization, and the 495 MB build maximum.
- **Root causes addressed:** Universal loading of every specialist/command file created excessive repeated context; unchecked non-blocking checklists could halt implementation for routine user confirmation; and the tracked `.specify/feature.json` pointer contradicted its machine-local/ignored design and contributed to cross-PR feature conflicts.
- **Changes on branch `fix/jules-governance-flow`:** Rewrote `AGENTS.md` context-loading and task-sequencing rules; aligned `.jules/jules.md` and Spec Kit plan/implement instructions; aligned the Spec Kit constitution; made planning artifacts task-relevant; retired `fix_feature_json.sh`; removed the tracked `.specify/feature.json`; and changed the Spec Kit verifier to discover exactly one changed feature directory containing current, non-empty `spec.md`, `plan.md`, and `tasks.md`.
- **Regression coverage added:** valid changed artifacts without a pointer, committed feature-branch artifacts, missing artifacts, stale base artifacts, empty required artifacts, and multiple feature directories.
- **Verification status:** No repository shell is available in this session, so these regression tests and `./jules-verify.sh` have not been run locally. CI results are required before claiming the governance change verified or merging it.
- **Protected scope:** No app runtime, dependencies, deployment settings, secrets, visual/audio behavior, or production configuration were intentionally changed.


## Image Delivery Optimization - 2026-10-23
- **Goal:** Improve image delivery for the homepage hero emblem and Facebook community cover.
- **Change:** Implemented responsive `<picture>` structures and preloads using dynamically generated `669w`, `551w`, and `800w` AVIF and WebP variants using sharp.
- **Verification:** Verified via Playwright visual checks, build passing within limits, and manual check of layout and formats.


---

# Current Focus — Lucky Stories Visibility Restoration (2026-10-23)

- **User-reported symptom:** Existing Lucky Stories disappeared from the Lucky Map after recent visual polish.
- **Verified storage state:** A read-only Neon query found eight `lucky_stories` rows; all eight were approved and had non-empty locations. No database writes were performed.
- **Verified code risks:** `app/api/lucky-stories/route.js` advertised public one-hour caching and stale-while-revalidate for up to 24 hours. The map client started polling only after the first 60-second interval.
- **Implementation verification passed:** Commit `dd5fec9dcd61529c7c2c2e6963ec091d9ee6f205` removes the unnecessary `_refresh=Date.now()` URL parameter, keeps the API URL stable with `cache: 'no-store'`, and prevents overlapping 60-second polls with a single-in-flight guard in `app/lucky-map-of-canada/lucky-stories-refresh.js`. The component delegates its effect to this helper. A client regression test checks stable URLs and confirms that pending requests suppress additional polls.
- **Verified CI:** Full unit suite 18 test files / 105 tests; `pnpm tsc --noEmit`; `./jules-verify.sh` (17 passed, 0 failed); Playwright (27 passed across desktop/mobile); Next.js production build; OpenNext Cloudflare build; compiled CSS/worker/assets and Wrangler no-deploy validation all passed. Combined `.next + public` size: 332,473,620 bytes / 317.07 MiB (<495 MiB). CodeQL, DevSkim, PR Agent, and updater-scheduler verification passed. No dependency additions, DB writes, merge, or deployment occurred.
- **Remaining proof:** The read-only database check found eight approved saved stories; do not claim they are visible in production until the PR is deployed and the user-facing map is checked. If rendering still fails after deployment, inspect the live API response/configuration before considering a data repair.


---

# Active Context — CodeQL Python syntax repair (2026-10-23)

- **Verified original CI on commit a9a19762e028cd76cb36ce0147d9ee1d18bed9f4:** DevSkim passed Python syntax validation, suppressor tests, filtering, and SARIF upload. Visual QA passed 104/105 tests; the single failure was `vi.runAllMicrotasksAsync()` missing in the installed Vitest version. OpenNext validation failed in the Next.js Google font loader while parsing an extensionless Google Fonts URL from unchanged `app/fonts.js`.
- **Verified fix path:** Next.js v16.4.3 release notes explicitly include a fix for extensionless Google font URLs in both bundlers. The follow-up pins Next.js 16.4.3 and updates Next/@next entries and integrity values in pnpm-lock.yaml, without changing font definitions or weights.
- **Test repair:** The Lucky Map refresh test now uses Vitest's supported `vi.waitFor()` API to await the async data update.
- **Amazon Q safety finding:** A hard-failing Python syntax check could skip SARIF upload. The updated workflow keeps syntax validation fatal but runs the SARIF upload and fallback warning with `always()` so raw DevSkim findings remain available on failure. Removed unused `_source_line_for_region` helper.
- **Follow-up verification:** Full CI, `./jules-verify.sh`, size-cap measurement, and a completed CodeQL analysis remain pending. Do not consider the original Python syntax warning cleared until the completed analysis confirms it.

## Performance Optimization — $(date +%Y-%m-%d)
- **Goal:** Improve performance for mobile loading/LCP scores.
- **Changes Implemented:**
  1. Extracted `Math.sin()` logic out of `requestAnimationFrame` loop conditionally to optimize rendering inside `HomePage.js` star animation.
  2. Extracted `ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';` into simpler if-else conditional flows inside `HomePage.js`.
  3. Removed unused `import Image from 'next/image'` across `HomePage.js`, `lucky-map-of-canada.js`, `lucky-card-reveal.js`, and `share-lucky-pick-button.js`.
  4. Converted `<Image />` component tags in `app/lucky-map-of-canada/lucky-map-of-canada.js` and `app/homepage/HomePage.js` that were improperly mixing with `unoptimized: true` to standard `<img>` tags inside `<picture>` elements.
  5. Removed unnecessary `mix-blend-screen` from `app/homepage/HomePage.js` overlay image.
- **Validation:** Build completes successfully within the 495 MB cap. Tests and verification passing.


---

# Current Task — Gemini Reviewer Source Context (2026-10-26)

- **Objective:** Improve the custom Gemini PR reviewer after Amazon Q identified the AVIF/WebP LCP preload mismatch on merged PR #1610 and Gemini missed it.
- **Implementation candidate:** PR #1611 adds bounded, read-only retrieval of changed-file source at immutable PR head SHAs, selected base versions, and relevant relative imports. Review prompts now require end-to-end before/after reasoning and explicit image preload/type/srcSet/sizes matching; deterministic task-group fallback relies on changed paths and defect domain.
- **Safety and preservation:** PR content is passed only as untrusted text and is never executed. Existing trusted base-branch workflow, Gemini rules, opt-in suggestions, fallback order (3.8 → 3.6 → 3.5), application behavior, and Amazon Q rules are preserved.
- **Verification:** JavaScript syntax compilation passed in the connected analysis runtime. PR-head CI and Vitest are pending; no live-model accuracy claim is made until a real review demonstrates the regression catch.



# Current Task — Gemini Reviewer Select-Findings Workflow (2026-10-28)

- **Objective:** Improve the Gemini PR Reviewer to support a select-findings-then-fix-selected workflow, allowing users to explicitly choose which findings they want fix suggestions for.
- **Implementation:**
  - Modified `.github/scripts/gemini-reviewer.cjs` to emit findings as markdown checklists instead of a bulleted list.
  - Added a `- [ ] 🛠️ **Fix selected findings**` action item.
  - Added robust validation in the `main` script block to handle an empty selection gracefully when parsing checkboxes.
  - Updated the summary instructions to detail the checkbox usage.
  - `parseSelectedIds` was reused to securely pull up to the maximum number of allowed finding IDs from the submitted markdown comment body.
  - Spec Kit task artifacts initialized to `specs/057-gemini-reviewer-selected-findings`.
- **Verification:**
  - `__tests__/gemini-reviewer-context.test.ts` was expanded to cover the empty, single, and multiple selected findings cases.
  - `./jules-verify.sh` tests passed locally.
  - The Next.js build runs cleanly under the repository's 495MB size cap constraint.
  - A PR was created on branch `fix-gemini-selected-findings` for review.

- 2026-11-01 — Gemini reviewer changed-source coverage fix (T010, task group `deep-dive`). Root cause of the "0 of 7 files reviewed" reports: `MAX_CHANGED_SOURCE_CHARS = 6000` was applied inside `Math.min(..., floor(budget / remainingFiles))`, so the 160,000-character budget could never be used (7 files allowed 22,857 each). Replaced it with `perFileSourceLimit()` (remaining budget / remaining files in the same class, 1,500 minimum, 24,000 maximum, 4,000 for documentation); `clipSourceWithAnchors()` now reports changed-region completeness separately from whole-file delivery and keeps the changed line when a window is truncated; `collectSourceContext()` reports documentation coverage in its own bucket outside the code denominator; `coverageGapNotes()` keeps a review neutral only for an unsupplied changed region or a patch-only code file. Documentation windows are 20 lines / 4,000 characters and never gate the code verdict. Measured replay of this branch's own 9-file diff: code changed-region coverage 3 of 4 files, documentation 0 of 5 (informational), 103,627 of 160,000 characters used; `.github/scripts/gemini-reviewer.cjs` itself needs 73,716 characters across 6 windows, so its review remains honestly incomplete rather than falsely green. Defect-detection parity is unchanged: Gemini still reported 0 of Amazon Q's 4 findings on the same heads. Live `@gemini full review` on #1666 remains PENDING owner interaction.


# Active Context — Reveal timeout duplicate build repair (2026-11-03)

- **Task:** Repair the Cloudflare/OpenNext production build failure introduced by the merged Lucky Reveal finish changes in PR #1687.
- **Evidence:** Main commit `66137dfacd0e3a7ed1cd2bc73b70b702f3ca0184` failed during Next.js/Webpack compilation at `app/lucky-reveal-celebration.jsx:32`. The module declared `CONFETTI_WATCH_TIMEOUT_MS` twice: 12,000 ms and 30,000 ms.
- **Root cause:** An unintended 30,000 ms duplicate was added alongside the established 12,000 ms safety fallback. The Phase 1/Phase 2 guards and the feature plan specify 12,000 ms. The Phase 2 test also contained a stray module-level assertion for the erroneous 30,000 ms value.
- **Repair branch:** `fix/reveal-timeout-duplicate-20261103`, based on current `main`.
- **Implementation:** Retain the single 12,000 ms declaration; remove the duplicate 30,000 ms declaration; move the single-declaration check into the existing lifecycle test. No reveal runtime behaviour is changed.
- **Spec Kit:** Reused `specs/081-lucky-reveal-finish-and-media-capability/{spec,plan,tasks}.md`; specify, plan, and tasks updated before implementation.
- **Verification:** The supplied main-branch Cloudflare build is the pre-fix failure. Focused tests, full Vitest, TypeScript, `./freebuff-verify.sh`, the OpenNext Cloudflare build, build-size measurement and final PR diff audit remain pending.
