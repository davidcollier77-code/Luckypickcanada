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
- [X] T010 Review the complete intended diff and confirm no manifest, AGENTS.md, workflow, dependency or application changes; the snapshot restoration is now an explicitly authorized scope extension.

## Phase 4 — Verification and delivery

- [ ] T011 Run `node scripts/test-refresh-docs.js` in Node.js 26.x. ChatGPT local runtime is Node.js 22.x; do not execute the Node 26-dependent test suite under Node 22. GitHub verification remains pending.
- [ ] T012 Confirm current-head Application Verification/build size and both Visual QA shards from GitHub after PR creation; no local result is claimed.
- [X] T013 Open one regular, non-draft PR against `main`, keep it open/unmerged and hand off the current-head report plus the protected-file environment approval requirement.

## Phase 5 — Restore the official GSAP reference (owner-authorized follow-up)

- [X] T014 Retrieve the exact official GSAP Timeline page already configured in `.docs/manifest.json` through Browserless; confirm the response is the actual documentation page, not a challenge response.
- [X] T015 Restore `.docs/polishing/_llmstxt_gsap_llms_txt.md` as Markdown with the official Timeline overview, position parameter guidance, special properties, defaults, nesting, mechanics, properties and methods.
- [X] T016 Update the Spec Kit records and Memory Bank to document the recovered snapshot, exact upstream source, static policy and remaining verification boundaries.
- [ ] T017 Extend the existing PR scope declaration for the one restored `.docs` file, obtain the owner `/approve-scope <digest>` command emitted by the scope checker, and confirm all required current-head checks/report for the updated PR.

## Recovery verification boundary

The restored snapshot was retrieved from the exact URL already recorded in the live manifest using Browserless. It is a 27 KB Markdown document with the expected Timeline sections and method/property reference tables; it is not a challenge page or raw HTML. Node.js project tests are not run locally under the unsupported ChatGPT runtime. The new PR head must receive current-head CI verification and the explicit scope digest approval before merge.

## Verification boundary

The regression coverage is authored but has not been executed locally. No test/build pass is claimed. The existing GitHub workflows are left unchanged and are responsible for the Node 26 build/test gate and automatic Visual QA after PR creation.
