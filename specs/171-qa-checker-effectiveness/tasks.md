# Tasks: QA Checker Effectiveness and Reliability

**Input**: Design documents in this directory.

## Phase 1: Inspect and Specify

- [x] T001 Inspect AGENTS.md, PR_SUBMISSION.md, every QA workflow, checker script, rule set, trigger and test under `.github/` and `__tests__/`.
- [x] T002 Gather evidence from PR #1924: 18 review comments (Amazon Q, Pullfrog), the Graphite and Pullfrog check-run outcomes, the Visual QA shard results, and the Verification Integrity and PR Scope check-run conclusions.
- [x] T003 Verify each review finding against head `6eb2ae7e` before acting; record confirmations, already-fixed findings and non-defects.
- [x] T004 Write spec.md and plan.md.

## Phase 2: Deterministic reviewer (Priority: P1)

- [x] T005 Add `classification` (`confirmed` / `potential`) to every changed-code finding.
- [x] T006 Collapse findings by path, line and rule; report `duplicates_collapsed` and `confirmed_count`.
- [x] T007 Add the `focused-test`, `await-in-for-each`, `empty-catch-block` and `unused-import` rules with practical corrections.
- [x] T008 Restrict `unused-import` to fully added, non-documentation files and exclude the `React` default import.
- [x] T009 Render classification and duplicate counts in the Markdown report.

## Phase 3: Browser reliability (Priority: P2)

- [x] T010 Add `.github/scripts/verify-playwright-cache.sh`, a read-only cache check that prints `ready=true` only for an executable Chromium.
- [x] T011 Gate the Chromium install on the validated cache and keep the system-dependency install for a usable cached browser.
- [x] T012 Keep the full two-shard Playwright run, all committed baselines and every Playwright project unchanged.

## Phase 4: Regression coverage (Priority: P1)

- [x] T013 Add Python fixtures for each new rule plus its harmless counterpart, the duplicate accounting and the classification split.
- [x] T014 Add executed coverage for the cache check (executable, non-executable, directory-only, missing).
- [x] T015 Add executed classifier coverage for performance paths and ambiguous application code.

## Phase 5: Verification

- [x] T016 Run the QA checker suites, the full unit suite, the standalone TypeScript check and `bash -n` on the new script.
- [x] T017 Run `./freebuff-verify.sh` and measure the production build against the 495 MiB cap.
- [x] T018 Validate the PR body's QA scope declaration against the actual diff with `check_qa_pr_scope.py` before creating the pull request.

## Dependencies and Execution Order

- T005–T009 and T013 are one unit: the rules and their fixtures ship together.
- T010–T012 and T014 are one unit: the workflow gate and its execution test ship together.
- T015 depends only on the existing classifier.
- T016–T018 are the release gates and must pass before submission.

## Implementation Strategy

Keep the change inside the QA infrastructure: the changed-code reviewer, the visual QA workflow and the scripts and tests that guard them. Do not change application code, dependencies, Playwright baselines, external reviewer configuration or any required check's blocking behaviour.
