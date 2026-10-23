# Tasks: Restore CodeQL Python Analysis

**Input**: Design documents in `specs/043-codeql-python-syntax-repair/`

**Prerequisites**: `spec.md` and `plan.md`

## Phase 1: Inspect and Baseline

- [X] T001 Read repository governance first; inspect the current CodeQL Python warning, suppression helper, existing unit tests, and DevSkim workflow.
- [X] T002 Identify the malformed checksum-metadata branch and verify that the intended source-line helper and justification already exist elsewhere in the current implementation.

## Phase 2: Repair Analysis (US1)

- [X] T003 Correct the snippet assignment and restore the checksum branch's existing `justification` assignment in `.github/scripts/suppress_devskim_false_positives.py`.
- [X] T004 Add `python3 -m py_compile .github/scripts/suppress_devskim_false_positives.py` as a dedicated non-tolerated step in `.github/workflows/devskim.yml`.

## Phase 3: Verify and Double-Check

- [ ] T005 Run the Python compile check and `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`; review the results from the PR's DevSkim workflow.
- [ ] T006 Run `./jules-verify.sh` and inspect the final diff; confirm a completed CodeQL scan clears the Python syntax-error warning.
