# Tasks: Resource-readiness safety limits

**Input**: Design documents from `/specs/210-resource-safety-limits/`

**Prerequisites**: plan.md, spec.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup and inspection

- [X] T001 Read `app/lib/resource-readiness.js` end to end and record the existing scheduling, retry, release, version and reset paths in `specs/210-resource-safety-limits/plan.md`.
- [X] T002 Confirm `bytes` is declared by the manifest but unused by the hub, that the texture adapter returns `dispose()`, and that audio is owned by the existing audio layer rather than the hub.
- [X] T003 Confirm the adaptive tiers are `high`, `balanced` and `constrained`, and that `getAdaptivePlan()` remains the only tier source.

## Phase 2: Implementation (US1 — bounded capacity and queue)

- [X] T004 Add per-tier capacity budgets, per-kind weight estimates and the retained-weight, queue-depth and speculative-pending accounting to `app/lib/resource-readiness.js`.
- [X] T005 Add admission control that de-duplicates and skips before capacity, defers background and intent work with a reason, sheds queued speculative work for committed work, and evicts settled unleased records least valuable and least recently used first.
- [X] T006 Add the bounded rejection ledger so a deferred resource reports `skipped` in readiness snapshots and is re-evaluated on a later committed request.
- [X] T007 Add `getResourcePoolStats()` with counts, weights, leases, pins, retirements and the current limits, containing no payloads.

## Phase 3: Implementation (US2 — leases and ownership)

- [X] T008 Add `leaseExperienceResources(id)` with counted per-key pins, an idempotent release, and a sweep of retired records when the last lease ends.
- [X] T009 Route explicit release, pressure release and version replacement through a pin-aware delete that retires instead of disposing a leased record.
- [X] T010 Lease a registered experience automatically for the duration of `beginActiveExperience(label)` and release it when the active period ends.

## Phase 4: Implementation (US3 — real disposal)

- [X] T011 Add best-effort disposal for adapter results with `dispose()` and for hub-created image elements, excluding delegated `audio`, `code` and `module` payloads.
- [X] T012 Call disposal from explicit release, pressure release, capacity eviction, version replacement, retirement sweep, retry replacement and reset.

## Phase 5: Tests and verification

- [X] T013 [US1] Add tests for declared and estimated weight accounting, constrained queue bounding, committed shedding, honest capacity refusal and statistics in `__tests__/resource-readiness.test.js`.
- [X] T014 [US2] Add tests for lease protection across explicit release, pressure release, version replacement, automatic active leasing and idempotent lease release.
- [X] T015 [US3] Add tests for texture disposal, hub-owned image clearing, delegated audio non-disposal and reset disposal.
- [X] T016 Run `pnpm exec vitest run __tests__/resource-readiness.test.js __tests__/resource-readiness-manifest.test.js __tests__/resource-readiness-image-identity.test.js __tests__/resource-readiness-mount.test.jsx __tests__/adaptive-performance.test.js` and confirm every assertion passes.
- [X] T017 Run `pnpm exec tsc --noEmit`.
- [X] T018 Run the full Vitest suite.
- [X] T019 Run `./freebuff-verify.sh` and measure the production build against the 495 MiB limit.
- [X] T020 Review the complete diff for unrelated changes, secrets, protected files and scope.
- [ ] T021 Prepare the regular, non-draft pull request and hand it off unmerged.

---

## Dependencies & Execution Order

- Phase 1 must finish before Phase 2: the budgets depend on the existing scheduler and plan contract.
- T004 → T005 → T006 → T007: accounting precedes admission, admission precedes the rejection ledger and diagnostics.
- T008 → T009 → T010: counted pins precede pin-aware deletion, which precedes automatic active leasing.
- T011 → T012: the disposal contract precedes every caller.
- T013–T015 follow their implementation phase; T016–T019 follow all tests.
- T020 → T021: the diff review precedes PR handoff.

## Notes

- No new module, dependency, route, component or payload accessor is added.
- The two-container alternating handover, reserve gates, overflow classes, replenishment and demand scaling remain deferred until a current experience consumes a prepared payload.
