# Tasks: DevSkim Self-Test False-Positive Filtering

**Input**: Design documents from `specs/045-devskim-self-suppression/`

**Prerequisites**: `spec.md` and `plan.md`

## Phase 1: Setup

- [X] T001 Confirm the 12 ledger rows and their exact source paths in `devskim-alerts.md`

## Phase 2: Foundational Regression Coverage

- [X] T002 Add an integration regression through `suppress_sarif` in `.github/scripts/test_suppress_devskim_false_positives.py` proving the four exact rule/path cases are removed and unrelated controls remain

## Phase 3: User Story 1 — Keep scanner self-tests out of security findings (Priority: P1)

**Goal**: Suppress only the verified test-fixture results without hiding real findings elsewhere.

**Independent Test**: Run `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'` and inspect the current-head DevSkim PR check.

- [X] T003 [US1] Define the two exact DevSkim helper/test paths in `.github/scripts/suppress_devskim_false_positives.py`
- [X] T004 [US1] Extend safe source resolution and allow DS137138/DS162092 on those paths only in `.github/scripts/suppress_devskim_false_positives.py`
- [ ] T005 [US1] Remove the 12 verified false-positive rows while preserving the report header and append marker in `devskim-alerts.md` after current-head filtering is verified
- [ ] T006 [US1] Record the task, exact changed files, observed CI evidence, limitations, and final diff review in `pr_summary.md` and `memory-bank/activeContext.md`

## Final Verification

- [ ] T007 Run the required syntax checks, focused Python tests, `./jules-verify.sh`, and required current-head CI gates; record actual outcomes in `pr_summary.md`
- [ ] T008 Double-check the full diff and report count, verify unrelated files/rules remain unsuppressed, and record whether the useful result is verified in `pr_summary.md`
