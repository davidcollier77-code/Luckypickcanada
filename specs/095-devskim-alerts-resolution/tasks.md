# Tasks: DevSkim Alerts Report Resolution

**Input**: Design documents from `specs/095-devskim-alerts-resolution/`

**Prerequisites**: `spec.md`, `plan.md`, `triage.md`

## Phase 1: Setup

- [X] T001 Read `AGENTS.md`, `.freebuff/freebuff.md`, the Memory Bank, and the `security` and `testing` group guidance in `.freebuff/`.
- [X] T002 Inspect the existing DevSkim workflow, append script, suppression helper, its unit suite, the replay gate, and prior devskim features (`specs/037`, `042`, `046`, `047`, `082`).
- [X] T003 Install DevSkim CLI 1.0.100 locally and capture a raw scan of this checkout in `devskim-alerts.sarif`.

## Phase 2: Foundational

- [X] T004 Classify all 164 recorded entries in `specs/095-devskim-alerts-resolution/triage.md` with current-source evidence.
- [X] T005 Measure which classes survive the production filter (259 raw, 150 filtered, 109 remaining).
- [X] T006 Record the classification and audit decisions in `spec.md` and `plan.md`, and point `.specify/feature.json` at this feature.

## Phase 3: User Story 1 — Audit every recorded finding (Priority: P1)

- [X] T007 [US1] Verify the 37 `.docs/manifest.json` DS173237 entries are public pinned commit SHAs already covered by the checksum-metadata predicate; leave `.docs/` untouched.
- [X] T008 [US1] Confirm both DS137138 entries and five DS172411 entries point at deleted files or stale line numbers rather than live findings.
- [X] T009 [US1] Confirm the loopback DS162092 entries and the share-timer DS172411 entry are current and reviewed as false positives.

## Phase 4: User Story 2 — Filter only reviewed false positives (Priority: P1)

- [X] T010 [US2] Add the exact Playwright local-server and `artifacts/**/*.json` loopback predicates to `.github/scripts/suppress_devskim_false_positives.py`.
- [X] T011 [US2] Add the exact share-image revoke-timer statement to `.github/scripts/suppress_devskim_false_positives.py` for DS172411 only.
- [X] T012 [US2] Add positive and negative regression tests in `.github/scripts/test_suppress_devskim_false_positives.py`.
- [X] T013 [US2] Add real-SARIF replay coverage in `.github/scripts/verify_devskim_sarif_replay.py`.

## Phase 5: User Story 3 — Keep the report accurate (Priority: P1)

- [X] T014 [US3] Clear the resolved entries in `devskim-alerts.md`, leaving the header and append marker.
- [X] T015 [US3] Re-run the scan through the production filter and confirm zero results remain at any recorded location.
- [X] T016 [US3] Confirm the append script adds zero findings for the filtered scan, so the report stays empty until a genuinely new finding appears.

## Phase 6: Polish and Verification

- [X] T017 Measure the production build size and confirm it stays below the 495 MB hard maximum.
- [X] T018 Run `./freebuff-verify.sh` (exit 0) and measure the production build at 331,558,437 B (316.20 MiB), below the 495 MB maximum.
- [X] T019 Review the complete final diff, publish one PR report (PR #1726), and leave the PR open and unmerged.
