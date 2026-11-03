# Feature Specification: Updater Scheduler GitHub `User-Agent` and Dispatch Diagnostics

**Feature Branch**: `freebuff/78319e5dc4e17636cb62dc2a`
**Created**: 2026-11-03
**Status**: Implemented on branch; deployment and live dispatch verification pending owner review

**Input**: Owner authorized updating the Cloudflare updater scheduler repository source so its GitHub
workflow-dispatch requests send the required `User-Agent: luckypickcanada-updater-scheduler` header,
while preserving the failure diagnostics currently deployed out-of-band, adding a regression test, and
documenting the requirement — without changing tokens, secrets, schedules, workflows, or deploying.

## Context

The Worker dispatches `update-spec-kit.yml` and `refresh-docs.yml` at five approved Atlantic slots. No
Cloudflare-originated run has ever appeared in either workflow's history, and the Worker reports HTTP
403 for every attempt. GitHub rejects REST requests with no `User-Agent` header with
`403 Request forbidden by administrative rules`; the same rejection was reproduced against the live
`/dispatches` endpoint in this workspace. Cloudflare Workers `fetch` supplies no default
`User-Agent`, and the checked-in Worker sent none.

## User Scenarios & Testing

### User Story 1 — A scheduled dispatch is accepted by GitHub (Priority: P1)

The maintainer needs each approved slot to reach GitHub instead of failing with HTTP 403.

**Independent Test**: A unit test asserts the dispatch request carries the exact
`User-Agent: luckypickcanada-updater-scheduler` header alongside the existing auth and API-version
headers.

**Acceptance Scenarios**:

1. Given an approved slot and a working token, when the Worker dispatches, then the request includes
   the required `User-Agent` and a 2xx response is treated as accepted.
2. Given any dispatch request, when it is built, then no other header, body field, ref, workflow path
   or input value changes.

### User Story 2 — A rejected dispatch explains itself (Priority: P1)

The maintainer needs the next failure, if any, to identify its own cause from the log.

**Independent Test**: Unit tests drive a 403 and a 502 response and assert the logged entry contains
`githubStatus`, `githubBody` and `githubHeaders` with the token, credential-shaped strings, cookies and
oversized bodies removed.

**Acceptance Scenarios**:

1. Given a rejected dispatch whose body echoes the Worker token, when the failure is logged, then the
   token and any `ghp_`/`github_pat_`/`Bearer` value appear redacted.
2. Given a long or multi-line error body, when it is logged, then it is a single line capped at 500
   characters.
3. Given response headers, when they are recorded, then only `content-type`, `retry-after`,
   `x-github-request-id` and `x-ratelimit-*` are kept.
4. Given a successful dispatch, when it completes, then no response body is read or logged.

### User Story 3 — Repository source matches what is deployed (Priority: P2)

The maintainer needs the reviewed source, not only an out-of-band deployment, to carry both the header
and the diagnostics.

**Independent Test**: The checked-in Worker and README document both behaviours, and the existing
deploy workflow is unchanged and still ships code and secret together after its canary.

## Requirements

- **FR-001**: `dispatchWorkflow` MUST send `User-Agent: luckypickcanada-updater-scheduler` on every
  request.
- **FR-002**: A non-2xx response MUST produce an error carrying `githubStatus`, `githubBody` and
  `githubHeaders`, and the scheduled handler MUST log them under those exact names.
- **FR-003**: The diagnostic body MUST be redacted of the configured token, `Bearer` values,
  `gh[pousr]_…` and `github_pat_…` strings, collapsed to one line, and capped at 500 characters.
- **FR-004**: Response headers MUST be limited to the allowlist in FR-002's selection; no request
  header and no successful-response body may be logged.
- **FR-005**: Existing behaviour MUST be preserved: slot mapping, `noRetry()`, disabled mode, request
  body (`ref`, `dispatch_source`, `scheduler_slot`), 200/204 handling, error message text, native
  GitHub schedules, and the deployment workflow.
- **FR-006**: The README MUST document the header requirement and the diagnostic fields.

## Out of Scope

Token, secret, environment variable, schedule, workflow-name, dispatch-setting and native-schedule
changes; deployment to Cloudflare; manually triggering an updater; editing `.docs/`.

## Success Criteria

- Focused Worker tests pass with the new header and diagnostics assertions (17/17 locally).
- `./freebuff-verify.sh`, the Spec Kit gate, typecheck and production build pass; build stays under
  495 MB.
- After a future deployment, the next approved slot produces a GitHub run titled
  `Update Spec Kit — cloudflare` / `Refresh Documentation — cloudflare`.
