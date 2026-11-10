# Tasks: Freebuff Startup Command and Memory Bank Availability

**Input**: Design documents from `specs/129-startup-command-verification/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Specify

- [x] T001 Inspect the live startup command segments, `scripts/bootstrap-pnpm.sh`, `scripts/verify-startup.sh`,
  `README.md`, `__tests__/freebuff-startup-command.test.js`, `specs/128-startup-readiness-verification/` and the
  startup-command audit in `specs/091-freebuff-startup-command/`.
- [x] T002 Record the verified baseline: the live command differs from the documented and guarded form; the context
  check runs last; `CI=true` is missing; the four Memory Bank files are checked, never preloaded.
- [x] T003 Write `specs/129-startup-command-verification/spec.md`.

## Phase 2: Plan

- [x] T004 Write `specs/129-startup-command-verification/plan.md` and this task list.
- [x] T005 Point `.specify/feature.json` at `specs/129-startup-command-verification`.

## Phase 3: Implement

- [x] T006 `scripts/verify-startup.sh`: add the measured `AGENTS.md` 64 KiB budget guard and report the size in the
  success output.
- [x] T007 `README.md`: document the corrected command as the exact Freebuff settings value, with ordered steps and
  the checked-versus-preloaded statement.
- [x] T008 `__tests__/freebuff-startup-command.test.js`: pin the corrected command, stub the startup check, assert
  ordering and the `CI=true` frozen install plus Playwright CLI invocation, keep both rejected-form proofs.
- [x] T009 `memory-bank/activeContext.md`, `memory-bank/progress.md`: record this task.

## Phase 4: Verify

- [ ] T010 Run `bash -n scripts/verify-startup.sh`; positive runs from the repository root and another directory.
- [ ] T011 Run the negative startup-check cases: missing file, empty file, oversized `AGENTS.md` (restore after).
- [ ] T012 Run `pnpm exec vitest run __tests__/freebuff-startup-command.test.js`.
- [ ] T013 Run the corrected startup command verbatim and record the exit status and elapsed time.
- [ ] T014 Run `./freebuff-verify.sh`, measure `.next` + `public` against 495 MiB, run `git diff --check`.
- [ ] T015 Audit the complete final diff; confirm `AGENTS.md`, application code, dependencies, workflows,
  integrations, deployment configuration and `.docs/` are untouched.
- [ ] T016 Publish the PR with the exact replacement command, PR link and full HEAD SHA; confirm OPEN and UNMERGED.

## Phase 5: Owner action

- [ ] T017 Paste the reported command into Freebuff project settings; the repository cannot read or write that
  setting.

## Dependencies

- T006–T009 depend on T001–T005.
- T010–T015 depend on T006–T009.
- T016 depends on T015.
- T017 follows merge and is owner-operated.

## Implementation Strategy

One small startup-tooling pull request. The behaviour change is confined to ordering, one restored `CI=true` flag
and one size guard; everything else is documentation and guard coverage. Nothing is merged by the agent.
