# PR Summary — Bounded Robin Review Failover

## Task group
- SELECTED TASK GROUP: troubleshooting
- GROUP REASON: Robin's repeated OpenRouter failures, long review duration, failure latency and inability to bound reusable workflow execution are CI troubleshooting issues.

## Spec Kit stages and artifacts
- /speckit.specify — definition: .jules/cmds/speckit.specify.md; method: FILE-DRIVEN PROCEDURAL EXECUTION through repository artifacts because the local clone/network is unavailable; artifacts: specs/024-robin-review-hardening/spec.md and checklists/requirements.md. Native dispatch/local CLI were not available.
- /speckit.plan — definition: .jules/cmds/speckit.plan.md; method: FILE-DRIVEN PROCEDURAL EXECUTION; artifacts: plan.md and research.md. Plan was authored from observed source and run logs; local setup script was not executed.
- /speckit.tasks — definition: .jules/cmds/speckit.tasks.md; method: FILE-DRIVEN PROCEDURAL EXECUTION; artifact: tasks.md. Implemented tasks are checked; runtime verification tasks remain unchecked.
- /speckit.implement — definition: .jules/cmds/speckit.implement.md; method: FILE-DRIVEN PROCEDURAL EXECUTION; implementation: .github/workflows/robin.yml. Local prerequisite scripts and ./jules-verify.sh have not run in this session.

## Verified findings
- Run #38916846992 (PR #1500, Dependabot): five first-response stalls. The log reports Secret source: Dependabot, but does not prove the key was empty because Robin converts most pre-first-chunk OpenRouter errors into a generic stall.
- Run #38937780684 (PR #1501): free-router calls went to Liquid and Cohere; the final review was posted after about 18 minutes and reported zero findings.
- Run #38970725890, attempt 2 (PR #1503): model routing went to NVIDIA free endpoints and failed with an upstream internal-server error after roughly 10 minutes of job execution. The created/start gap reflects run-attempt timing, not a measured 35-minute model request.
- The caller used a reusable workflow with a 45-minute internal job timeout. GitHub does not allow a reusable-workflow caller to set an arbitrary job timeout. The caller's custom 300-second timeout also bypassed Robin's router-specific two-minute default; Robin's router first-chunk timer is cleared after the initial chunk and does not cap the remainder of a streamed response.

## Implementation and boundaries

- The first three fixed-model options were rejected based on real Actions evidence rather than guesswork. The successful final configuration restores openrouter/free but wraps the entire action in a hard two-minute GitHub Actions step timeout; the job has a four-minute cap.
- Run #38988422706 (Robin #248) successfully posted review #5555193756 and completed in about 1m52s, reporting zero findings. It proves the bounded setup can complete, not that every run will identify issues.
- Amazon Q finished before Robin started on PR #1500. CodeRabbit posted later on PR #1501, but there is no explicit automatic handoff in this repository to prove that Robin failure triggered CodeRabbit.
- Replaced the moving reusable-workflow call with Robin action pinned at commit fc0bf915b634bf2f8b88ff1392acefdfb54e28d9.
- Final default: openrouter/free. Several fixed free endpoints tested during implementation returned HTTP 429, 404, 502 or empty output. The router was restored after a live run completed successfully, posted review #5555193756, and finished in about 1m52s.
- Added a 90-second client timeout, two-minute action-step limit, four-minute job limit, missing-key preflight, cancellation-aware duplicate-review guard keyed to current head and run start, and final recheck after timeout.
- Preserved events, authorized slash commands, job-level concurrency, permissions, review limit and non-blocking advisor mode. No website, payments, database, deployment settings, secrets or secret values changed.
- The preflight can detect a missing OPENROUTER_API_KEY quickly but cannot create secrets. If missing in a Dependabot run, the owner must add it under Settings → Secrets and variables → Dependabot.

## Required resources and libraries
- LIBRARY: Robin Action v2.12.0 at pinned commit fc0bf915b634bf2f8b88ff1392acefdfb54e28d9 — USED: YES; USEFUL: YES; inspection verified retry, routing and streaming behavior.
- LIBRARY: OpenRouter model catalog — USED: YES; USEFUL: YES; checked IDs, free pricing and reported availability.
- LIBRARY: GitHub Actions documentation — USED: YES; USEFUL: YES; confirmed reusable workflow limitations and timeout controls.
- LIBRARY: Next.js, React, TypeScript, Cloudflare/Workers, Neon, Upstash, Stripe, Resend, Sentry and other application libraries — USED: NO; USEFUL: NO; this is a workflow-only change.
- DOCUMENT: AGENTS.md, .jules/jules.md, .jules/troubleshooting.md, .docs/manifest.json, .docs/troubleshooting/jules_google_docs.md, .docs/troubleshooting/_google-gemini_gemini-cli.md, .docs/troubleshooting/_websites_ai_google_dev_gemini-api.md — USED: YES; USEFUL: YES for governance and task routing.
- DOCUMENT: GitHub Actions official reuse and syntax docs — USED: YES; USEFUL: YES; grounded the direct-action/step-timeout approach.
- DOCUMENT: Other application-specific .docs/troubleshooting snapshots — USED: NO; USEFUL: NO; none of their UI, database, payment or deployment domains are changed by this task.

## Changed files
- .github/workflows/robin.yml
- .specify/feature.json
- specs/024-robin-review-hardening/spec.md
- specs/024-robin-review-hardening/plan.md
- specs/024-robin-review-hardening/research.md
- specs/024-robin-review-hardening/tasks.md
- specs/024-robin-review-hardening/quickstart.md
- specs/024-robin-review-hardening/checklists/requirements.md
- specs/024-robin-review-hardening/pr_summary.md
- memory-bank/activeContext.md
- memory-bank/progress.md

## Verification
- COMMAND: local git clone of the repository — RESULT: FAIL; environment could not resolve github.com.
- COMMAND: ./jules-verify.sh — RESULT: NOT RUN; local shell verification unavailable in this connected API-only workspace.
- COMMAND: GitHub pull-request workflow checks — RESULT: PENDING until checks complete after PR creation.
- COMMAND: controlled forced-primary-failure test — RESULT: NOT RUN; no live secret or repository variable was modified to simulate provider failure.
- Evidence is limited to source/log inspection until remote checks complete.

## Completion status
- USEFUL RESULT: PARTIAL — the latest run posted a review within the hard cap, and the provider-failure path was observed to fail closed. The local jules-verify script remains unrun.
- Pre-submission double-check: pending final tree/diff inspection and remote check review.
- Remaining risks: free providers can be rate-limited. This change bounds duration and uses explicit model IDs but cannot guarantee provider availability. If ROBIN_LLM_BASE_URL is changed from OpenRouter, ROBIN_LLM_FALLBACK_MODEL must be compatible with the replacement endpoint.
