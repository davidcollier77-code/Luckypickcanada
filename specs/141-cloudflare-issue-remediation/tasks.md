# Tasks: Cloudflare Issue Remediation

**Input**: Design documents from `specs/141-cloudflare-issue-remediation/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Specify

- [x] T001 Read `AGENTS.md`, the four Memory Bank files, `.docs/manifest.json`, the selected task groups and `PR_SUBMISSION.md`.
- [x] T002 Read each of the six GitHub issues and its Cloudflare issue ID.
- [x] T003 Fetch the Cloudflare issue record and retained occurrences for all six issue IDs.
- [x] T004 Compare every retained scanner path with live production responses and the tracked repository assets.
- [x] T005 Identify the Oracle root cause from the occurrence payload and the provider's reasoning-token behaviour.
- [x] T006 Write `spec.md`, `plan.md` and this task list; point `.specify/feature.json` at this feature.

## Phase 2: Implement

- [x] T007 Replace the deprecated 250-token `max_tokens` budget with `max_completion_tokens: 1024` and `reasoning_effort: "low"`.
- [x] T008 Log the finish reason and reasoning-token usage when the provider returns no content, without secrets.
- [x] T009 Send and validate the visitor's local time and include it in the calendar facts.
- [x] T010 Add Labour Day and the National Day for Truth and Reconciliation with holiday fallback readings.
- [x] T011 Extend the Oracle route tests for the provider budget, local time, holidays and empty-reasoning response.
- [x] T012 Record the evidence and update Memory Bank context.

## Phase 3: Verify

- [x] T013 Run the targeted Oracle and Crystal Ball Vitest suites — PASS, 38/38.
- [x] T014 Run `./freebuff-verify.sh`, type check and production build; confirm the build is below 495 MiB — PASS, exit 0, 355.73 MiB.
- [x] T015 Run browser QA on `/crystal-ball` for the daily fortune and follow-up — PASS, Playwright desktop flow.
