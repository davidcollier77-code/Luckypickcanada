# Tasks: Independent CodeRabbit CLI Review Layer

**Input**: Design documents from `specs/048-coderabbit-cli-review-layer/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Setup and Baseline

- [X] T001 Read `AGENTS.md` first, then required Jules/Memory Bank context, the Creation task group and its routed docs, the Spec Kit templates/commands, and official CodeRabbit CLI/configuration documentation.
- [X] T002 Inspect `main`, check for an existing branch/PR for this task, confirm no conventional CodeRabbit repository config is present, and establish that existing automation must remain untouched.
- [X] T003 Define the explicit CLI-only instructions-file approach and verify official documentation for `--config`, review scopes, authentication, doctor, and usage commands.

## Phase 2: Local CLI Wrapper and Instructions (US1)

- [ ] T004 Add `.coderabbit-cli-instructions.md` with focused, high-confidence, read-only review rules independent of `AGENTS.md`.
- [ ] T005 Add `scripts/coderabbit-cli-review.sh` with clear worktree/config/CLI prerequisite failures and safely quoted argument forwarding.
- [ ] T006 Review shell syntax and wrapper behavior when a local shell is available; otherwise mark as not run and rely only on source inspection until local/CI validation.

## Phase 3: Developer Setup Guide (US1)

- [ ] T007 Add `docs/coderabbit-cli.md` with install, auth, doctor/usage, pre-commit, branch-comparison, and agent-output commands.
- [ ] T008 Document that the layer is optional, uses account-reported quota, and does not alter existing GitHub App checks or CI.

## Phase 4: Verification and Handoff

- [ ] T009 Inspect the final diff twice and ensure no application, AGENTS.md, conventional CodeRabbit configuration, dependency, workflow, deployment, or secret files changed.
- [ ] T010 Run `./jules-verify.sh` and applicable local checks if a repository shell exists; otherwise record the exact unavailable commands and require remote CI evidence before merge.
- [ ] T011 Complete `pr_summary.md` with the actual stage method, files, verification performed/not performed, remaining prerequisites, and honest usefulness status.
- [ ] T012 After merge, verify local installation/authentication with `cr doctor` and `cr usage`, then run the first live local review; this step requires the maintainer's computer/account.

## Dependency Order

T004-T006 depend on T001-T003. T007-T008 can follow the implementation design. T009-T011 depend on all repository files being present. T012 requires the user-side setup and merge.

## Acceptance Checklist

- [ ] The wrapper passes the dedicated CLI instructions explicitly and safely.
- [ ] The CLI setup does not add or modify `.coderabbit.yaml`, `.coderabbit.yml`, `.coderabbit.config.ts`, `AGENTS.md`, GitHub workflows, dependencies, application code, deployment settings, or secrets.
- [ ] Missing prerequisites produce actionable errors.
- [ ] Actual local CLI installation, quota, and first review are not misrepresented as verified by repository CI.
