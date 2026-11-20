# Feature Specification: Seven Checker Categories

**Feature Branch**: `freebuff/25590a89225c606a9ca3e3ec`

**Created**: 2026-11-20

**Status**: Implemented — PR prepared for owner review

**Input**: Bring the Luckypickcanada pull-request verification system into alignment with exactly seven checker categories, with accurate current-head results, complete reporting on every PR, and submitter documentation that states exactly what must be provided.

## User Scenarios & Testing

### User Story 1 — One trustworthy verification report (Priority: P1)

A repository owner opening any pull request can read one report that lists exactly seven checker categories and their real status, instead of several partially overlapping comments in different vocabularies.

**Why this priority**: Duplicate or stale reports obscure which results actually belong to the latest commit and which checks are advisory.

**Independent Test**: Build the report from a fixture evidence bundle and verify that it contains exactly the seven categories, the four allowed statuses, one sticky marker and the current-head SHA.

**Acceptance Scenarios**:

1. **Given** a pull request with current-head results, **When** the report is rendered, **Then** exactly the seven categories appear once each with `PASSED`, `FAILED`, `WARNING` or `NOT RUN`.
2. **Given** a second run for an updated description or a new commit, **When** the report is published, **Then** the same sticky comment is updated instead of creating a duplicate.
3. **Given** a successful result attached to an earlier commit, **When** the current head has no result, **Then** the category is not reported as passed and the earlier-commit evidence is explicitly excluded.

### User Story 2 — Clear submitter obligations (Priority: P1)

A submitter knows exactly what the PR description must contain, including the exact declarations, the structured QA scope declaration, scope-change wording, protected-file authorization and the Spec Kit, task-group, Library and Memory Bank reporting.

**Independent Test**: Compare `PR_SUBMISSION.md` and `.github/pull_request_template.md` and assert that both contain the exact declarations, markers, category names and required sections, and that neither requires manual browser evidence.

### User Story 3 — Preserved automated QA (Priority: P1)

The existing automated checks keep running and keep their detailed findings: DevSkim scanning and suppression, the full unit suite, the TypeScript check, the production build and build-size gate, and both Playwright shards.

**Independent Test**: Assert the existing workflow steps remain present and that their results are rendered as supporting evidence inside the QA Checker category.

## Requirements

### Functional Requirements

- **FR-001**: The verification system MUST expose exactly seven top-level checker categories: QA Checker, DevSkim, Dependabot, PR Scope Verification, Protected File Changes, Verification Integrity and Governance and Workflow Verification.
- **FR-002**: Every category MUST use exactly one of `PASSED`, `FAILED`, `WARNING` or `NOT RUN`; the consolidated report MUST NOT use the earlier `PASS`/`WARN`/`FAIL`/`BLOCKED` vocabulary.
- **FR-003**: The QA Checker MUST verify the exact declaration `Pre-Submission Code Quality Review: VERIFIED — Pre-check completed before PR submission.` and MUST keep the automated changed-code review, test quality, performance, full test suite, type check, build and automated visual results.
- **FR-004**: The report MUST NOT require the submitter to run Playwright, take screenshots or supply manual browser evidence; Playwright MUST continue to run automatically when required.
- **FR-005**: DevSkim scanning, suppression, SARIF handling, Security-tab upload and alert reporting MUST be preserved without configuration changes.
- **FR-006**: Dependabot MUST be reported honestly as `NOT RUN` with an explanation when no applicable update exists; `.github/dependabot.yml` MUST NOT change.
- **FR-007**: PR Scope Verification MUST keep the exact-path declaration, exact file-purpose matching and owner approval digests, and MUST require the exact words `Scope changed` plus a specific explanation when scope expands.
- **FR-008**: Protected File Changes MUST keep fail-closed detection and the human authorization gate, and MUST require the exact human authorization declaration when the task explicitly authorizes protected-file changes.
- **FR-009**: Verification Integrity MUST only accept results attached to the exact current HEAD SHA and MUST detect missing, skipped, cancelled, incomplete, stale and outdated results.
- **FR-010**: Governance and Workflow Verification MUST check Spec Kit stage/artifact reporting, the selected task group, Library documents consulted and Memory Bank reporting, without claiming independent verification of submitter declarations.
- **FR-011**: Visual QA and Visual QA Summary MUST NOT appear as extra top-level categories; their aggregation belongs to QA Checker and both shards remain visible.
- **FR-012**: `PR_SUBMISSION.md` and `.github/pull_request_template.md` MUST agree on all required description content and declarations.
- **FR-013**: Regression tests MUST cover the exact declarations, seven categories, status classification, current-head verification, scope expansion, protected-file authorization, the removed browser-evidence requirement and workflow hygiene.

### Key Entities

- **Verification report**: one Markdown body with a sticky marker, a current-head SHA, seven category records and supporting check evidence.
- **Evidence bundle**: pull request metadata, changed files, owner comments, current-head check runs, the verification audit and code-scanning alerts.
- **Declaration**: an exact submitter attestation string that the report detects but never treats as independent proof.

## Success Criteria

- **SC-001**: A single run renders all seven categories with only the four allowed statuses.
- **SC-002**: A missing or near-miss declaration fails the QA Checker; an exact declaration passes the declaration check.
- **SC-003**: A success from an earlier commit never produces `PASSED` for the current head.
- **SC-004**: Scope expansions require both the exact wording and the owner digest approval.
- **SC-005**: Protected-file changes fail closed without the declaration and never treat the declaration as the human gate.
- **SC-006**: Both documentation files state the same obligations, and neither asks the submitter for manual browser evidence.
- **SC-007**: The full unit suite, type check, production build and build size are measured locally before submission.

## Assumptions

- The existing GitHub workflows remain the execution environment for DevSkim, Visual QA, the build validation and the verification audit.
- The consolidated report runs from a trusted base-branch checkout and never executes pull request code.
- The 495 MiB production build cap and protected-file gates remain binding.
