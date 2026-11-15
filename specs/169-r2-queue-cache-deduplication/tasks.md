# Tasks: R2 Revalidation Queue Deduplication

**Input**: Design documents in this directory.

## Phase 1: Inspect and Specify

- [x] T001 Inspect AGENTS.md, PR_SUBMISSION.md, the current OpenNext configuration, adapter lockfile version, upstream queue implementation, and applicable QA checker/workflow definitions.
- [x] T002 Verify queueCache API and acknowledgement semantics against the exact 1.20.15 adapter and its @opennextjs/aws 4.1.14 dependency.
- [x] T003 Write and quality-check spec.md and checklists/requirements.md.

## Phase 2: Plan

- [x] T004 Record the supported design, no-new-infrastructure constraint, test strategy, and known R2 causality limitation in plan.md and research.md.
- [x] T005 Define the exact changed-file scope and the non-rendering QA classification requirement.

## Phase 3: Implementation (Priority: P1)

- [x] T006 Wrap the existing doQueue with queueCache in open-next.config.ts using a five-second regional TTL and acknowledgement-before-cache behavior.
- [x] T007 Add only the exact open-next.config.ts non-rendering exception to the fail-closed visual QA classifier.
- [x] T008 Add a regression assertion confirming queue-only OpenNext configuration changes do not launch browser visual QA.
- [x] T009 Update the Spec Kit feature pointer and task/technical context records.

## Phase 4: Verification (Priority: P1)

- [x] T010 Run the classifier regression through the full pnpm test suite: 80/80 test files and 789/789 tests passed in Visual QA run 43760858112; QA infrastructure checker tests also passed (142 tests).
- [x] T011 Run the standalone TypeScript check (passed in Visual QA run 43760858112) and the OpenNext Cloudflare production build (passed in Validate OpenNext Repair run 43760857988).
- [x] T012 Wrangler build validation passed in run 43760857988; .next plus public measured 326.43 MiB against the 495 MiB cap. The updater-scheduler workflow independently measured 326.44 MiB and its Wrangler dry-run passed in run 43760858000.
- [x] T013 The repository governance verification gate passed in the PR-triggered GitHub Actions environment (run 43760858000). ChatGPT did not execute repository shell scripts.

## Dependencies and Execution Order

- Phase 1 and Phase 2 are prerequisites for implementation and are complete.
- T006–T008 are the configuration and QA regression changes; they are complete.
- T010–T013 are complete based on the recorded current-head GitHub Actions results above.
- No visual/browser regression run is required for this non-rendering change; the full unit, type, OpenNext, Wrangler, security, scope, and integrity checks remain applicable.

## Implementation Strategy

Keep the change limited to the existing adapter configuration, the exact non-rendering classifier case, and its classifier regression assertion. Do not adjust queue concurrency, R2 settings, D1, bindings, dependencies, or application code.
