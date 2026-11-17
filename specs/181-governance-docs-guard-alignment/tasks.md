# Tasks: Governance and Refresh-Docs Guard Alignment

**Feature**: `specs/181-governance-docs-guard-alignment`

## Phase 1: Setup

- [X] T001 Read `AGENTS.md`, the Memory Bank and PR submission rules relevant to protected governance and docs checks.
- [X] T002 Reproduce the governance failure and trace it to the sentence removed by #1942.
- [X] T003 Reproduce the refresh-docs failure and trace it to the `legacyHtml > 0` fixture assumption.

## Phase 2: Foundational

- [X] T004 Create the task-scoped spec, plan and tasks artifacts and point `.specify/feature.json` at them.
- [X] T005 Create a dedicated branch from `main` at `ec4b5258`, separate from the adaptive-performance PR.

## Phase 3: User Story 1 — Governance exclusion

- [X] T006 Replace the historical sentence assertion with `'ChatGPT must not use or attempt to use:'` in `__tests__/agent-governance-single-source.test.js`.
- [X] T007 Retain the CLI entry and maintenance-restriction assertions and document why the intent is unchanged.

## Phase 4: User Story 2 — Refresh-docs validation

- [X] T008 Remove the required-legacy-snapshot assertions and the unused unconvertible counter in `scripts/test-refresh-docs.js`.
- [X] T009 Keep every per-snapshot validation, missing-file assertion and legacy conversion branch intact.

## Phase 5: Verification

- [X] T010 Run the focused governance suite and refresh-docs suite.
- [X] T011 Run the full Vitest suite.
- [X] T012 Run `SPEC_KIT_BASE_REF=ec4b5258 ./freebuff-verify.sh` and the production build-size check.
- [X] T013 Record evidence and commit/push the dedicated branch.
- [ ] T014 Open the dedicated PR and request owner authorization (owner action remains).

## Dependencies

- T006–T009 depend on T004–T005.
- T010–T012 depend on both fixes.
- T013 depends on all verification passing.
