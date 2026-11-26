# Tasks: Playwright Alignment and Authorized QA Skips

**Input**: Design documents from `specs/220-playwright-skip-alignment/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Shared skip contract

- [x] T001 Add `.github/scripts/qa_skip.py` with the exact label `SKIPPED — NOT APPLICABLE`, the three documented authorities, reason validation, record helpers and render helper.
- [x] T002 Add `dependabot_maintenance(pr, commits, files)` with the bot author, commit author/committer, and changed-path allowlist checks; fail closed on missing or malformed evidence.
- [x] T003 Add `.github/scripts/test_qa_skip.py` covering the label, every authority, rejected/placeholder reasons, the render helper, and positive and negative Dependabot verification.
- [x] T004 Wire `qa_skip.py` into the Visual QA explicit `py_compile` and unittest lists, and rely on `freebuff-verify.sh` auto-discovery for the local gate.

## Phase 2: Current-head audit

- [x] T005 Record a trusted skip on the inapplicable build and browser records, with the reason in `detail` and no duplicated `not applicable:` prefix.
- [x] T006 Make an actually skipped/cancelled conditional run blocking when no trusted inapplicability exists.
- [x] T007 Render the per-item skip label in the audit table and explain it in the footer.
- [x] T008 Prove with tests that a trusted inapplicability is `VERIFIED`, and a skipped conditional run is `NOT VERIFIED`.

## Phase 3: Consolidated report

- [x] T009 Render supporting rows with the skip label, keep them excluded from incomplete-coverage warnings, and let an observed failed run override the skip.
- [x] T010 Make the bot-authored human attestation an `actor-inapplicable` skip that keeps the category green when the supporting results pass.
- [x] T011 Add `--commits` and pass commit evidence to the scope checker.
- [x] T012 Skip the submitter protected-file declaration for a verified Dependabot update while keeping the human authorization gate mandatory.
- [x] T013 Skip Spec Kit/Library/Memory Bank reporting for a verified Dependabot update, and only for it.
- [x] T014 Fail Verification Integrity for an unauthorized `applicable: false` record, and warn for an unknown conditional non-run.
- [x] T015 Render the skipped entries per category and update the legend to separate the per-item label from the four category statuses.

## Phase 4: Scope checker

- [x] T016 Add `MissingDeclaration`; exempt only a totally absent declaration for a verified Dependabot update.
- [x] T017 Keep duplicated markers, malformed JSON and invalid shapes as failures.
- [x] T018 Add `--commits` and return a `PASS` skip report with the exact label.
- [x] T019 Render the skipped declaration in the markdown summary and keep exit 0 for `PASS`.

## Phase 5: Workflow evidence

- [x] T020 Fetch pull request commits in `pr-scope-verification.yml` and pass `--commits`.
- [x] T021 Fetch pull request commits in `pr-verification-report.yml` and pass `--commits`.

## Phase 6: Playwright alignment

- [x] T022 Reinstall in `scripts/playwright-cli.sh` when the tree is missing or `node_modules/.pnpm/lock.yaml` differs from `pnpm-lock.yaml`.
- [x] T023 Fail closed in `scripts/setup-playwright-agent.sh` on the same mismatch, require one installed version across the three packages, and remove the “Playwright 1.x” wording.
- [x] T024 Replace the cache validator and both conditional installs in `visual-qa.yml` with one unconditional `pnpm exec playwright install --with-deps chromium`.
- [x] T025 Delete `.github/scripts/verify-playwright-cache.sh`.
- [x] T026 Remove the step-conclusion Chromium inference from the timing reporter; read the hit/miss state from the restore log lines and keep `n/a` for a job without a restore step.

## Phase 7: Tests and documentation

- [x] T027 Update `test_pr_verification_report.py` for the skip label, the unknown-applicability warning and the bot-attestation pass.
- [x] T028 Add report tests for an authorized skip, a failure outranking it and an unauthorized inapplicability.
- [x] T029 Add report tests for the verified Dependabot scope, governance and protected-declaration skips, a mixed update and a human PR.
- [x] T030 Update `test_verify_pr_verification_status.py` for unexplained-skip blocking and the labelled trusted skip.
- [x] T031 Add scope-checker tests for the maintenance exemption, missing vs malformed markers and missing commit evidence.
- [x] T032 Update `test_report_visual_qa_install_timings.py` for log-derived cache state.
- [x] T033 Update `visual-qa-chromium-cache.test.js`, `playwright-smart-scheduling.test.js`, `verification-applicability.test.js`, `checker-suite-workflows.test.js` and `playwright-cli-wrapper.test.js`.
- [x] T034 Add the operational no-hardcoded-version/revision guard to `playwright-version-alignment.test.js`.
- [x] T035 Update `PR_SUBMISSION.md`, `.github/pull_request_template.md`, `README.md` and the Playwright skill reference.
- [x] T036 Update the Memory Bank and `.specify/feature.json`.

## Phase 8: Verification

- [x] T037 Run `python3 -m py_compile` and `bash -n` on every changed checker and script.
- [x] T038 Run every Python checker suite and the focused Vitest contracts.
- [x] T039 Run `pnpm exec tsc --noEmit` and `./freebuff-verify.sh`.
- [x] T040 Run the real Playwright setup probe and prove the stale-tree guard with a temporary lockfile mismatch.
- [ ] T041 Post-submission: the PR-triggered seven-category report and both Playwright shards run on the PR head. Not verifiable before PR creation.
