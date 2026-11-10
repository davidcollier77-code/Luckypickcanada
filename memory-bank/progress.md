# Project Progress — Significant Milestones

This file is a concise record of meaningful completed work, not a chronological transcript of every PR, CI retry, review comment or implementation task. Current repository state belongs in activeContext.md; technical facts belong in techContext.md.

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
