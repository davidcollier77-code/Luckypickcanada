# Project Progress — Significant Milestones

This file is a concise record of meaningful completed work, not a chronological transcript of every PR, CI retry, review comment or implementation task. Current repository state belongs in activeContext.md; technical facts belong in techContext.md.

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
