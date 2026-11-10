# Tasks: Triage and Resolve Cloudflare Vulnerability-Scan Issues

**Input**: Design documents from `specs/132-cloudflare-scan-issue-triage/`

**Prerequisites**: plan.md, spec.md

**Tests**: No application test task is required because no application code changes. Verification consists of the Cloudflare occurrence review, live production checks, repository inspection, `./freebuff-verify.sh` and the build-size measurement.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Web application plus GitHub/Cloudflare automation at the repository root.

## Phase 1: Setup

- [X] T001 Confirm the five open Cloudflare-labelled GitHub issues in `davidcollier77-code/Luckypickcanada` are #1789–#1793 and extract each Cloudflare issue ID from its notification payload
- [X] T002 Inspect the existing Cloudflare issue-resolution automation under `app/lib/cloudflare-observability-issues.ts`, `app/api/cloudflare-issues/resolve/route.ts` and `.github/workflows/deploy-open-next.yml` to reuse the documented API contract

---

## Phase 2: Foundational

- [X] T003 Retrieve the authoritative Cloudflare observability issue records and retained occurrences for all five issue IDs
- [X] T004 Inspect the repository route tree, `public/` assets, tracked files and `next.config.mjs` source-map/security settings for any path matching a reported scanner target

**Checkpoint**: The per-issue occurrence data and the repository's actual surface are known before any resolution decision.

---

## Phase 3: User Story 1 - Each alert is verified before any change is made (Priority: P1)

**Goal**: Produce a per-issue determination grounded in Cloudflare occurrence data, repository inspection and live production responses.

**Independent Test**: Each issue's Cloudflare issue ID maps to recorded occurrences, recorded production responses and a recorded determination.

### Implementation for User Story 1

- [X] T005 [P] [US1] Record occurrence path, method, status, user agent, source country and outbound-fetch result for #1789 (wordpress), #1790 (secret-files), #1791 (source-control), #1792 (debug-endpoints) and #1793 (known-scanner-path)
- [X] T006 [P] [US1] Request representative reported paths from `https://luckypickcanada.ca` and record status, content type and absence of secret/source content
- [X] T007 [US1] Compare each reported path with the application route tree and public assets to confirm none is implemented
- [X] T008 [US1] Record the evidence and determination for all five issues in `specs/132-cloudflare-scan-issue-triage/evidence.md`

**Checkpoint**: All five issues have a complete, individually verifiable determination.

---

## Phase 4: User Story 2 - Only genuine problems change code; false positives are resolved with evidence (Priority: P1)

**Goal**: Avoid product changes when no defect exists, then resolve each issue with its own evidence.

**Independent Test**: The final diff contains no application source changes, and every issue carries a resolution comment citing its evidence.

### Implementation for User Story 2

- [X] T009 [US2] Confirm no occurrence returned a successful response, secret content or an outbound fetch, so no application fix is warranted
- [X] T010 [US2] Post an evidence-based resolution comment on each of #1789–#1793 and close each issue
- [X] T011 [US2] Mark the matching five Cloudflare observability issues resolved so the dashboard matches the GitHub resolution

**Checkpoint**: The inbox is clear with evidence, not by assumption.

---

## Phase 5: User Story 3 - Existing behaviour and safeguards are preserved (Priority: P2)

**Goal**: Prove the change set is documentation/records only and that production remains healthy.

**Independent Test**: The diff lists only Spec Kit and Memory Bank files; the homepage still returns 200 and unknown paths still return 404.

- [X] T012 [US3] Confirm the final diff contains no application code, configuration, dependency, credential or Cloudflare deployment change
- [X] T013 [US3] Re-check the production homepage and a sample of scanner paths after triage

---

## Final Phase: Polish & Verification

- [X] T014 Update `memory-bank/activeContext.md` and add a concise durable entry to `memory-bank/progress.md`
- [X] T015 Run `./freebuff-verify.sh` and record each check's actual result
- [X] T016 Measure the production build size and confirm it remains strictly below 495 MiB
- [X] T017 Inspect the complete final diff and perform the final error check
- [X] T018 Commit, push the task branch, open PR #1806, and record the full HEAD SHA in the PR summary while keeping the PR open and unmerged

## Dependencies & Execution Order

- T001–T004 establish the issue set and the evidence base.
- T005–T008 produce the determinations (US1).
- T009–T011 resolve the issues (US2); they depend on US1 evidence.
- T012–T013 prove preservation (US3).
- T014–T018 finish records, verification, diff audit and handoff.

## Parallel Opportunities

Occurrence collection (T005) and live production probing (T006) can run together; they touch different evidence sources.

## Implementation Strategy

Gather authoritative evidence first, then decide. Because all occurrences are 404 scanner noise, no application fix is made: the implementation is the evidence record, the five issue resolutions and the repository records, followed by the verification gate and PR handoff.

## Notes

- No application tests are added or changed because no application behaviour changes.
- The Cloudflare observability status update is limited to the five issue IDs named by the request.
- Pending tasks are deliberately left unchecked until fresh verification evidence exists.
