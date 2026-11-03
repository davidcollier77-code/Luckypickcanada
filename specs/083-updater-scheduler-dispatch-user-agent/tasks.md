# Tasks: Updater Scheduler GitHub `User-Agent` and Dispatch Diagnostics

**Feature**: `specs/083-updater-scheduler-dispatch-user-agent`

- [x] **T001** Confirm the 403 cause and reproduce GitHub's `User-Agent` rejection.
  `curl -H 'User-Agent:' -X POST .../refresh-docs.yml/dispatches` returned `403 Request forbidden by
  administrative rules…`; the Worker's dispatch request set every header except `User-Agent`.
- [x] **T002** Add `GITHUB_USER_AGENT = "luckypickcanada-updater-scheduler"` and send it on the
  dispatch request (`workers/updater-scheduler/src/index.mjs`).
- [x] **T003** Add `GitHubDispatchError` with `githubStatus`, `githubBody`, `githubHeaders` and log
  those fields on the existing `workflow-dispatch` / `outcome: "failed"` entry.
- [x] **T004** Add `sanitizeDiagnosticBody` (token, `Bearer`, `gh[pousr]_…`, `github_pat_…` redaction;
  one line; 500-character cap) and the response-header allowlist.
- [x] **T005** Extend `workers/updater-scheduler/test/index.node-test.mjs`: exact `User-Agent`,
  sanitized body/header diagnostics, redaction, single-line truncation, no cookies, success path
  unchanged.
- [x] **T006** Document the header requirement and diagnostic fields in
  `workers/updater-scheduler/README.md`.
- [x] **T007** Write `spec.md`, `plan.md`, `tasks.md` and point `.specify/feature.json` at this feature.
- [x] **T008** Run the focused Worker suite — 17/17 PASS.
- [ ] **T009** Run `./freebuff-verify.sh`, the Wrangler dry run, and measure the production build size.
- [ ] **T010** Publish the PR (open, unmerged) with the canonical summary and record the PR-head checks.
- [ ] **T011** After owner-approved deployment: verify the next approved slot produces a
  `… — cloudflare` run for each updater and a 2xx `outcome: "accepted"` log entry.

T009–T011 are environment/owner-gated and are recorded as PENDING, never as passed.
