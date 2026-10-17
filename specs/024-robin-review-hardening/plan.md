# Implementation Plan: Bounded Robin Review Failover

Branch: fix/robin-bounded-review-fallback
Date: 2026-10-16
Spec: spec.md

## Summary

Replace the moving reusable-workflow reference and unconstrained free-model router with a pinned Robin action, two explicit free models, hard per-attempt time limits, an eight-minute job budget, missing-key preflight, and a current-head duplicate-review guard.

## Technical Context

- Language/Version: GitHub Actions YAML and Bash on ubuntu-latest.
- Primary Dependencies: antongulin/robin pinned at commit fc0bf915b634bf2f8b88ff1392acefdfb54e28d9; OpenRouter.
- Storage: GitHub pull-request review objects; no new persistent data store.
- Testing: GitHub Actions workflow validation and pull-request checks; static inspection of workflow conditions and API calls.
- Target Platform: GitHub Actions.
- Project Type: CI workflow configuration.
- Performance Goals: Primary attempt capped at 2 minutes; at most one alternate attempt capped at 2 minutes; job capped at 8 minutes after it starts.
- Constraints: No paid models, no application or deployment changes, no credential values in logs, preserve existing review permissions and concurrency.

## Evidence and Root Cause

- The current workflow calls antongulin/robin/.github/workflows/review.yml@main, whose internal job has a 45-minute timeout. The caller cannot set a job timeout on a reusable-workflow call; GitHub documents a restricted set of caller job keys.
- The caller passed llm-timeout-ms = 300000. In Robin v2.12.0, a custom timeout bypasses its two-minute router default. The router-specific stream path aborts only until the first SSE chunk and then clears that timer; later streaming can run much longer than intended.
- Recorded runs repeatedly routed to different models through openrouter/free, including empty output and an upstream NVIDIA internal-server error. PR #1501's second review process took around 18 minutes; PR #1503's latest attempt ran around 10 minutes before failing.
- openrouter/free selects model/provider routes dynamically, so results and latency depend on the free endpoint chosen. Explicit model IDs use Robin's normal non-router request path, which is bounded by the configured request timeout; the action step timeout provides a final hard limit.
- PR #1500's log shows Secret source: Dependabot and repeated pre-first-chunk stalls, but does not conclusively prove a missing credential. Robin converts most pre-first-chunk OpenRouter errors into a generic stall. A safe preflight distinguishes a missing secret immediately without exposing its value.

## Design

1. Call the pinned Robin action directly rather than the reusable workflow so each action step has a hard timeout.
2. Use xingchen-agi/xing4.0-29b-a4b:free as the primary default and qwen/qwen3.8-27b:free as the one alternate default. Keep primary model/base URL overrides and add ROBIN_LLM_FALLBACK_MODEL as an override.
3. Set each model request timeout to 90,000 ms; cap each action step at 2 minutes and the job at 8 minutes.
4. Fail in preflight if OPENROUTER_API_KEY is missing and give a Dependabot-specific configuration hint without printing the secret.
5. Keep the reusable workflow's PR-event filter and job-level concurrency behavior. Do not add workflow-level concurrency.
6. Before fallback, query submitted review objects and match the current head SHA, Robin signature, and timestamp since this run began. Recheck after attempts so timeout-after-post does not cause duplicate reviews or a false failure.
7. Preserve fail-closed behavior if both attempts fail.

## Constitution Check

- Single source of truth: PASS — repository governance remains authoritative.
- Verify before acting: PASS — inspected source workflows, upstream Robin implementation and the failed/successful run logs.
- Scope: PASS — changes limited to the Robin CI workflow, Spec Kit task artifacts and Memory Bank status.
- Secrets and protected systems: PASS — authorized workflow/CI configuration only; no secret values modified or logged.
- Verification limitation: local shell commands cannot run in this API-only environment. Pull-request Actions checks must be inspected before the runtime change is considered verified.

## Project Structure

.github/workflows/robin.yml
.specify/feature.json
specs/024-robin-review-hardening/spec.md
specs/024-robin-review-hardening/plan.md
specs/024-robin-review-hardening/research.md
specs/024-robin-review-hardening/quickstart.md
specs/024-robin-review-hardening/tasks.md
specs/024-robin-review-hardening/checklists/requirements.md
specs/024-robin-review-hardening/pr_summary.md
memory-bank/activeContext.md
memory-bank/progress.md
