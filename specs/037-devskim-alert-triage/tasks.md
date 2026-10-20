# Tasks: DevSkim Alert Triage and Minimal Remediation

**Input**: Design documents from `specs/037-devskim-alert-triage/`

**Prerequisites**: `spec.md`, `plan.md`; no data model or API contract change is required.

## Phase 1: Setup

**Purpose**: Establish one focused task branch and its Spec Kit evidence.

- [x] T001 Create the task specification in `specs/037-devskim-alert-triage/spec.md`.
- [x] T002 Create the evidence-based implementation plan in `specs/037-devskim-alert-triage/plan.md`.
- [x] T003 Add the requirements-quality checklist in `specs/037-devskim-alert-triage/checklists/requirements.md`.

## Phase 2: Foundational

**Purpose**: Record what can and cannot be verified before making alert dispositions.

- [ ] T004 [US1] Create `specs/037-devskim-alert-triage/triage.md` with each alert identifier visible in the supplied recording that can be mapped to a source finding, plus the rule, file/location, evidence, classification, and limitation for items that cannot be individually retrieved.
- [ ] T005 Confirm in `specs/037-devskim-alert-triage/triage.md` that no external secret store, credential, or secret literal is modified or reproduced and that no broad scanner suppression is introduced.

## Phase 3: User Story 1 - Trustworthy security findings (Priority: P1) 🎯 MVP

**Goal**: Distinguish substantiated vulnerabilities from heuristic matches without manufacturing an all-clear result.

**Independent Test**: Every claimed classification has specific source evidence; findings without enough evidence remain unknown or are explicitly blocked from individual status changes.

- [ ] T006 [US1] Document in `specs/037-devskim-alert-triage/triage.md` why the visible SHA-1/MD5 package-name matches are false positives when the corresponding lockfile integrity fields are SHA-512; leave `pnpm-lock.yaml` unchanged.
- [ ] T007 [US1] Document in `specs/037-devskim-alert-triage/triage.md` why manifest SHA/checksum values are metadata rather than credentials; keep `.docs/manifest.json`, `.specify/integrations/generic.manifest.json`, and all other `.docs/` files unchanged.
- [ ] T008 [US1] Record callback-based `setTimeout` findings as unsupported by the untrusted-string-code rule after checking the actual callback arguments; leave those timer call sites unchanged unless new evidence demonstrates a vulnerability.
- [ ] T009 [US1] Record the localhost matches separately, distinguishing dev/test origins from production exposure; do not remove localhost entries solely to silence a heuristic.
- [ ] T010 [US1] Record the Code Scanning inventory/API access blocker and identify the alert IDs whose individual source or current status could not be retrieved; do not claim the entire 113-alert snapshot was fully inventoried or cleared.

## Phase 4: User Story 2 - Correct genuine issues minimally (Priority: P1)

**Goal**: Correct the confirmed new-window link weakness with no unrelated behavior change.

**Independent Test**: The gift email anchor preserves its URL, text, and inline styles and includes `rel="noopener noreferrer"`; the targeted regression test passes.

- [ ] T011 [US2] Add `rel="noopener noreferrer"` to the gift reveal anchor in `app/api/send-gift/route.ts`, preserving its destination, wording, and styling.
- [ ] T012 [P] [US2] Add a targeted regression assertion for the opener-protection attribute in the relevant test file, preferably `__tests__/security-payment.test.js`, without making an external mail request.
- [ ] T013 [US2] Run the targeted test `pnpm exec vitest run __tests__/security-payment.test.js` and record its actual output in `specs/037-devskim-alert-triage/pr_summary.md`.

## Phase 5: User Story 3 - Preserve credentials and safeguards (Priority: P1)

**Goal**: Show that the patch itself does not disclose or alter secrets and does not weaken security scanning.

**Independent Test**: The final diff contains no credential values, secret-store/configuration changes, lockfile edits, broad suppressions, unrelated application changes, or scanner weakening.

- [ ] T014 [US3] Perform a second secret/scope audit of every changed file and record the outcome in `specs/037-devskim-alert-triage/pr_summary.md` without copying any secret values.
- [ ] T015 [US3] Create a separate owner follow-up section in `specs/037-devskim-alert-triage/triage.md` only for genuinely plausible credential exposure; do not repeat the already owner-confirmed Neon rotation as a new action, and do not classify public hashes/placeholders as credentials.
- [ ] T016 [US3] Verify through available GitHub/CI evidence whether the updated-head DevSkim scan ran and which alerts actually changed status; record any access/tool blocker in `specs/037-devskim-alert-triage/pr_summary.md`.

## Final Phase: Polish and Cross-Cutting Concerns

- [ ] T017 Inspect the complete final diff and confirm that only the intended source/test/spec evidence is changed; report every unrun or blocked mandatory check in `specs/037-devskim-alert-triage/pr_summary.md`.
- [ ] T018 Run `./jules-verify.sh` and available repository tests/build checks through the supported environment; report exact actual results and the actual combined build size if a build runs. Never claim success for a skipped or unavailable command.
- [ ] T019 Create one pull request from `security/devskim-alert-remediation-037` to `main` and leave it unmerged for owner review.
- [ ] T020 Complete `specs/037-devskim-alert-triage/pr_summary.md` with the observed baseline, accessible-alert classification coverage, changes, verification evidence, current limitations, the explicit answer to whether actions remain, and `USEFUL RESULT: YES/NO`.

## Dependencies & Execution Order

- Setup tasks T001–T003 are complete.
- Foundational evidence task T004 precedes the alert-specific classifications in T006–T010.
- T011 and T012 are the minimal source fix and its regression check; they can be implemented together sequentially because the test target may depend on the source markup.
- T014 and T017 require the final diff.
- T016 depends on CI or scanner results being available. If the connector does not expose the alert inventory/status, document that limitation instead of inferring a result.
- T019 depends on the code and evidence artifacts being ready. It does not authorize merging.

## Parallel Opportunities

- T006–T009 are independent source-evidence notes within `triage.md`, but should be reconciled into one file edit to avoid same-file write conflicts.
- T011 and T012 touch different files but should be completed in the same sequential task session so the test matches the exact fix.
- Do not run parallel edits against the same file.

## Implementation Strategy

1. **MVP**: Correct the confirmed `target="_blank"` finding with opener protection and a focused regression assertion.
2. Record evidence-based false-positive analysis without source edits to those files.
3. Verify tests and CI, perform a second diff/secret check, open one review PR, and explicitly disclose any alert-level operations unavailable through the connected interface.

## Notes

- Each task ID is unique and follows the required checkbox/ID/story-label format.
- A task checked `[x]` is considered complete only when the specified artifact or verification actually exists.
- No PR merge, auto-merge, external credential operation, or bulk alert dismissal is in scope.