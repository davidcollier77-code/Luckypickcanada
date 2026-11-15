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
