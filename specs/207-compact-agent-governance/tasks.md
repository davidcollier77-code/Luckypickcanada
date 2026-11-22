# Tasks: Compact Agent Governance Instructions

**Input**: [spec.md](spec.md) and [plan.md](plan.md)

**Prerequisites**: plan.md and spec.md

## Phase 1 — Compact governance and preserve safeguards

- [x] T001 Review the complete current `AGENTS.md`, `PR_SUBMISSION.md`, `.docs/manifest.json`, current Spec Kit constitution/workflow/templates and applicable QA/protected-file workflows.
- [x] T002 Produce the concise `AGENTS.md` while retaining shared, Freebuff-only and ChatGPT-only requirements and replacing duplicated procedures with authoritative references.
- [x] T003 Review the shortened document against the previous governance requirements; restore the explicit impact-assessment and checker-scope details needed for complete coverage.

## Phase 2 — Regression coverage and context

- [x] T004 Update `__tests__/agent-governance-single-source.test.js` for the compact section structure, key safeguards, role separation, dynamic task groups, Spec Kit discovery and protected-file boundary.
- [x] T005 Update the current-task header in `memory-bank/activeContext.md`; retain the other three Memory Bank core files unchanged after health review.
- [x] T006 Add this feature's specification, plan and task list under `specs/207-compact-agent-governance/`.

## Phase 3 — Verification and handoff

- [ ] T007 Obtain GitHub Actions results for the governance regression suite, PR Scope Verification and protected-file detection/authorization.
- [ ] T008 Inspect the consolidated PR Verification Report against the exact live PR HEAD and report all seven categories and pending owner approvals.
- [ ] T009 Obtain the owner's `/approve-governance <digest>` comment and the separate protected-file GitHub Environment authorization before merge.

## Verification Boundary

- The Library startup preflight reports Node.js 22.16.0 and no pnpm; the repository requires Node.js 26.x and pnpm 10.30.3.
- ChatGPT must not execute repository shell scripts, project tests, installs or builds under its startup restrictions. No local test or build result is claimed.
- GitHub Actions is the authorized environment for repository tests and protected-file checks.
- The PR must remain regular, non-draft, open and unmerged for owner review.