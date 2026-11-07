# Progress

_Compact milestone history, not a task diary. Keep roughly the last 30 days of meaningful completed work; retain older milestones only when they still explain important project decisions or behavior. Detailed implementation and verification evidence belongs in the relevant PR or Spec Kit artifacts._

## 2026-11-06 — Documentation library and source cleanup
- Expanded the reference library with agent-oriented copywriting, React/Next.js, and Trail of Bits security/testing references, routed through existing specialist groups.
- Removed unused documentation sources in stages, corrected the Chrome web-platform source, moved NumPy to Audio, and added regression coverage for retired references across all specialist groups.
- Audited and corrected the documentation source URLs in PRs #1744 and #1745; PR #1746 completed the follow-up source-retirement and routing coverage work. No application behavior or dependencies were changed by these documentation-library updates.

## 2026-11-06 — Playwright and Visual QA reliability
- Aligned the Playwright CLI and test packages on version 1.64.1 and added a regression guard against split versions.
- Made Visual QA browser installation conditional on changed paths using a fail-closed classifier, and added a version-keyed Chromium cache. Unit tests, type checks, Spec Kit checks, and reporting remain in the workflow; only unnecessary browser setup is skipped for documentation-only changes.

## 2026-11-06 — Lucky Card reveal presentation
- Improved the daily entry control and Standard/Premium/Flagship tier presentation, then added a shared finish for both card faces and a staged cinematic reveal with tier lighting, gloss, shockwaves, and finishing effects.
- Preserved the card artwork, card data, selection/weighting logic, daily lock, storage, audio cues, sharing, and existing reveal timings. The cinematic work was merged in PR #1743; its original verification record noted that reduced-motion browser emulation had not been run.

## 2026-11-06 — Retire the custom Gemini PR reviewer
- Removed the separate custom Gemini PR-review workflow, scripts, root instruction file, and exclusive test suites.
- Preserved the Pullfrog workflow and the website's Oracle/Gemini API integration. PR #1736 merged; no API key, shared secret, or application behavior was changed.

## 2026-11-05 — Dependabot and verification-gate hardening
- Corrected the Dependabot Spec Kit exemption and isolated its test fixture so inherited workflow-author context could not leak into unrelated cases.
- Simplified pnpm bootstrap and repository verification behavior, removed duplicate gate steps, and expanded failure-path regression coverage. Package/lockfile policy and application behavior were preserved.

## 2026-11-04 — Homepage presentation and asset delivery
- Consolidated hero navigation around one Lucky Stories destination and added a restrained gold shimmer aligned to the existing hero artwork.
- Corrected hero-image delivery so AVIF-capable browsers do not download both AVIF and WebP copies; the WebP fallback and original artwork remain.
- Restored and regression-tested the shared night-sky background after a stylesheet-order regression across the homepage, Crystal Ball, and Lucky Map.

## 2026-11-03–04 — Lucky Reveal and paid gift-flow safeguards
- Restored paid-only reveal access and removed public preview/test bypasses and the disabled gift-email test tool from production paths.
- Continued reveal reliability work for audio lifecycle, applause, sharing, daily counters, and presentation phases. Paid checkout, one-time product setup, and gift delivery were kept separate from test-only tooling.

## 2026-10-29–31 — PR reviewer quality work
- Improved reviewer source coverage, structured finding parsing, severity handling, duplicate detection, and selected-finding/fix reporting through focused regression tests.
- These changes are historical context only: the separate custom Gemini reviewer was later retired on 2026-11-06. Consult current reviewer workflows before extending or reviving any prior implementation.

## 2026-10-19–20 — Night-sky regression and scheduled updater safeguards
- Repaired a shared background stylesheet-order regression and added route-level browser checks for the homepage, Crystal Ball, and Lucky Map.
- Added timezone-aware updater scheduling safeguards and invalid-time/no-retry handling. Existing schedule entries and live dispatch state must be checked from current workflow/Worker configuration, not inferred from this history.

## 2026-10-17–18 — Crystal Ball and Oracle reliability
- Added Crystal Ball audio and daily-question allowance improvements, and repaired an Oracle route Cloudflare build regression by restoring the existing API-key retrieval path.
- No credential values are recorded here; use current environment configuration and repository code as the source of truth.
