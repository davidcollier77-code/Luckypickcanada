# Vitest Mocker Security Remediation Tasks

## Phase 1 — Setup
- [x] T001 Read AGENTS.md, required Memory Bank context, security specialist guidance, routed security documents, and Spec Kit definitions.

## Phase 2 — Foundational
- [x] T002 Add the @vitest/mocker 5.0.5 override in package.json.
- [x] T003 Reconcile the patched mocker, spy, magic-string and snapshots in pnpm-lock.yaml.

## Phase 3 — User Story 1: Remove the vulnerable transitive resolution
- [x] T004 Check package.json and pnpm-lock.yaml for the 5.0.5 override and remove old 5.0.0 mocker/spy references.
- [x] T005 Create spec.md and plan.md for this task in .specify/features/vitest-mocker-security-remediation/.
- [ ] T006 Run pnpm install --frozen-lockfile in CI.
- [ ] T007 Run pnpm test, pnpm audit, and ./jules-verify.sh in CI.
- [ ] T008 Run pnpm run build in CI and verify .next + public stays below 495 MiB.
- [ ] T009 Inspect the full PR diff and report verification outcomes in pr_summary.md.
