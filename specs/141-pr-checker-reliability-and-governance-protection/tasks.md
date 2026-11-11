# Tasks: Faster, More Reliable PR Checkers and Dedicated AGENTS.md Governance

**Input**: `spec.md`, `plan.md`

## Phase 1: Audit and baseline

- [x] T001 Inventory every pull-request workflow and exclude Pullfrog as an AI review bot.
- [x] T002 Record GitHub run durations and conclusions for Visual QA, Validate OpenNext Repair, DevSkim, Verification Integrity and Protected File Changes.
- [x] T003 Reproduce the fast Visual QA failure locally and identify the governance-test parse error at `__tests__/agent-governance-single-source.test.js:108`.
- [x] T004 Measure local unit-test, TypeScript, install and targeted-suite costs; record that Playwright cannot launch in the sandbox because `libnspr4.so` is missing.

## Phase 2: AGENTS.md protection

- [x] T005 Add `.github/scripts/agents_md_protection.py` with path-based dedicated/unrelated/removed/unchanged classification and fail-closed handling.
- [x] T006 Add `.github/scripts/test_agents_md_protection.py` covering dedicated files, Spec Kit/Memory Bank records, unrelated code and dependencies, deletion, rename, baseline identity, unsafe paths and bypass attempts.
- [x] T007 Wire the classifier into `.github/workflows/protected-files.yml` on a trusted base checkout, keeping the environment authorization gate and fail-closed API handling.
- [x] T008 Add the protection files to the workflow path filter/ protected list and CODEOWNERS.
- [x] T009 Replace the governance workflow assertions with an end-to-end classifier test; repair the parse error; keep the existing AGENTS.md requirement assertions.

## Phase 3: Reliability and performance

- [x] T010 Make Verification Integrity audit every Visual QA shard, reporting any failed or pending shard as FAIL/PENDING.
- [x] T011 Remove the duplicated targeted Vitest subset and standalone TypeScript check from Visual QA, keeping the full suite and `freebuff-verify.sh`.
- [x] T012 Split Visual QA into a stable verification job and two Playwright `--shard` jobs with `fail-fast: false` and per-shard reports.
- [x] T013 Add pnpm-store caching, a 20-minute timeout and superseded-run cancellation to Validate OpenNext Repair without changing any validation step.
- [x] T014 Add pnpm-store caching to the Deploy Updater Scheduler verifier and bounded timeouts to DevSkim.
- [x] T015 Add the protection regression suite to `freebuff-verify.sh`.

## Phase 4: Verification and handoff

- [x] T016 Run `py_compile` and both Python unit suites. PASS: 25 protection tests, 28 verification-integrity tests.
- [x] T017 Run the governance Vitest suite and the full Vitest suite. PASS: 8/8 governance tests; 57 files, 503 tests.
- [x] T018 Run `./freebuff-verify.sh` and measure the production build against 495 MiB. PASS: exit 0; documentation tests 36/36; build 405,503,226 B = 386.72 MiB.
- [x] T019 Review the final diff, confirm no gate or coverage was removed, and record the results in the PR body. PASS: reviewed; the only removed Visual QA steps are duplicated by the retained full suite and `freebuff-verify.sh`.
- [ ] T020 Open the PR and stop after handoff.
