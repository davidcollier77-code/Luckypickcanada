# Tasks: Static GSAP AI Reference Exclusion

**Input**: `specs/227-gsap-static-reference-exemption/spec.md` and `plan.md`  
**Tests**: Existing updater unit/report tests and isolated end-to-end workflow.

## Phase 1 — Specification and baseline

- [X] T001 Read current AGENTS.md, ChatGPT startup README/script, manifest and GSAP route/snapshot.
- [X] T002 Inspect updater queue, reconciliation, snapshot integrity audit, report renderer, unit/e2e tests and applicable PR/QA/protected-file workflows.
- [X] T003 Create the Spec 227 specification, plan, research and task artifacts.

## Phase 2 — Implementation

- [X] T004 Add the explicit static GSAP ID allowlist and exclude it from the refresh queue before any upstream request in `scripts/refresh-docs.js`.
- [X] T005 Keep the static entry in routing and integrity reconciliation; report the ID and reason in the refresh report and console summary.
- [X] T006 Add a report-rendering regression assertion in `scripts/test-refresh-docs.js`.
- [X] T007 Extend `scripts/test-refresh-docs-e2e.js` to prove zero source requests, byte-identical snapshot retention and unchanged group/inventory/source entries.

## Phase 3 — Records and review

- [X] T008 Point `.specify/feature.json` at Spec 227.
- [X] T009 Update activeContext, techContext and progress with the permanent updater policy and current snapshot-state finding; leave stable projectBrief unchanged.
- [X] T010 Review the complete intended diff and confirm no manifest, snapshot, AGENTS.md, workflow, dependency or application changes.

## Phase 4 — Verification and delivery

- [ ] T011 Run `node scripts/test-refresh-docs.js` in Node.js 26.x. ChatGPT local runtime is Node.js 22.x; do not execute the Node 26-dependent test suite under Node 22. GitHub verification remains pending.
- [ ] T012 Confirm current-head Application Verification/build size and both Visual QA shards from GitHub after PR creation; no local result is claimed.
- [ ] T013 Open one regular, non-draft PR against `main`, keep it open/unmerged and hand off the current-head report plus the protected-file environment approval requirement.

## Verification boundary

The regression coverage is authored but has not been executed locally. No test/build pass is claimed. The existing GitHub workflows are left unchanged and are responsible for the Node 26 build/test gate and automatic Visual QA after PR creation.
