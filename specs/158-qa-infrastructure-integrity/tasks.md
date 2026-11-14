# Tasks: QA Infrastructure Integrity

**Input**: Design documents from `specs/158-qa-infrastructure-integrity/`

**Prerequisites**: `plan.md` and `spec.md`; research and checklist are included for this task.

## Phase 1: Specification and design

- [X] T001 Create the QA infrastructure specification and acceptance criteria in `specs/158-qa-infrastructure-integrity/spec.md`.
- [X] T002 Record reviewed QA workflows, DevSkim evidence, and ChatGPT browser-tool limits in `specs/158-qa-infrastructure-integrity/research.md`.
- [X] T003 Create implementation design and governance decisions in `specs/158-qa-infrastructure-integrity/plan.md`.

## Phase 2: Scope enforcement

- [X] T004 Implement a trusted-input, fail-closed PR scope checker in `.github/scripts/check_qa_pr_scope.py`.
- [X] T005 Add exact-path, rename, placeholder, scope-expansion, owner-digest, browser-evidence, baseline and governance tests in `.github/scripts/test_check_qa_pr_scope.py`.
- [X] T006 Add a read-only trusted-base PR scope workflow with owner-comment approval reruns in `.github/workflows/pr-scope-verification.yml`.
- [X] T007 Add a PR template with the machine-readable scope declaration and evidence/approval guidance in `.github/pull_request_template.md`.

## Phase 3: DevSkim evidence

- [X] T008 Add a dependency-free raw/filtered SARIF summary utility in `.github/scripts/summarize_devskim_findings.py`.
- [X] T009 Add summary tests for counts, remaining findings, locations, malformed SARIF and count consistency in `.github/scripts/test_summarize_devskim_findings.py`.
- [X] T010 Preserve raw DevSkim SARIF, upload a separate raw artifact and summarize remaining findings in `.github/workflows/devskim.yml`, retaining the existing filtered artifact and suppression flow.

## Phase 4: QA integration and governance preservation

- [X] T011 Run the new Python checker suites in addition to existing tests in `.github/workflows/visual-qa.yml`.
- [X] T012 Keep the existing Playwright classifier/configuration, visual shards, Crystal Ball specs, DevSkim suppression/replay, verification-integrity and protected-file governance logic unchanged in their existing files/workflows.
- [X] T013 Inspect Agent MD and protected governance requirements; record why no Agent MD modification is needed and why it cannot be mixed into this infrastructure PR in `specs/158-qa-infrastructure-integrity/research.md`.

## Phase 5: Memory Bank and delivery

- [ ] T014 Set the active Spec Kit feature pointer in `.specify/feature.json`.
- [ ] T015 Update current task context in `memory-bank/activeContext.md`.
- [ ] T016 Append the completed milestone and verification limitations in `memory-bank/progress.md`.
- [ ] T017 Run available focused checker tests and syntax checks; inspect the full branch diff and exact changed-file manifest.
- [ ] T018 Prepare the complete PR description and submit one regular, non-draft, unmerged PR using the full intended branch HEAD SHA.
