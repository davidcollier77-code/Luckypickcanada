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

- [X] T005 Review original DevSkim run: Python compile validation, suppressor regression tests, suppression filter, and SARIF upload passed.
- [X] T006 Replace unsupported vi.runAllMicrotasksAsync() with vi.waitFor() in the Lucky Map refresh regression test.
- [X] T007 Upgrade Next.js from 16.4.1 to 16.4.3 and update the pnpm lockfile integrity metadata for Next.js and its @next environment/SWC packages.
- [X] T008 Preserve raw SARIF upload and the fallback warning when the hard-failing Python syntax guard fails; remove the unused source-line helper.
- [ ] T009 Run all PR checks including the full unit suite, Next.js build, .next + public size under the hard 495 MiB cap, OpenNext validation, ./jules-verify.sh, DevSkim, and a completed CodeQL scan.
- [ ] T010 Inspect the complete final diff and reconcile the canonical PR summary with actual CI outcomes.
