# Vitest Mocker Security Remediation Tasks

## Phase 1 — Setup
- [x] T001 Read AGENTS.md, required Memory Bank context, security specialist guidance, routed security documents, and Spec Kit definitions.

## Phase 2 — Foundational
- [x] T002 Add the @vitest/mocker 5.0.5 override in package.json.
- [x] T003 Reconcile the patched mocker, spy, magic-string and snapshots in pnpm-lock.yaml.

## Phase 3 — User Story 1: Remove the vulnerable transitive resolution
- [x] T004 Check package.json and pnpm-lock.yaml for the 5.0.5 override and remove old 5.0.0 mocker/spy references.
- [x] T005 Create spec.md and plan.md for this task in .specify/features/vitest-mocker-security-remediation/.
- [x] T006 Verify pnpm install --frozen-lockfile succeeds in CI.
- [x] T007 Verify pnpm test (targeted and full suite) succeeds in CI.
- [x] T008 Verify ./jules-verify.sh succeeds in CI.
- [x] T009 Verify pnpm run build, the 495 MiB size gate, OpenNext build artifacts, and Wrangler dry-run validation succeed in CI.
- [ ] T010 Run pnpm audit and record whether these two advisories remain in the resolved dependency graph; the existing CI workflows do not include a dedicated pnpm audit step.
- [ ] T011 Confirm the visual regression test job completes and inspect its final result.
- [x] T012 Inspect the full PR patch: exactly seven expected files changed; no app source, visuals, routes, production config, secrets, or environment files changed.
- [ ] T013 Complete verification evidence and final status in pr_summary.md; keep USEFUL RESULT NO until alert closure is confirmed after merge.
