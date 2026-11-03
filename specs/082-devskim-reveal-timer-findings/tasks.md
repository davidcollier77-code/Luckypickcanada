# Tasks: DevSkim Reveal Timer False-Positive Filtering

**Input**: Design documents from `specs/082-devskim-reveal-timer-findings/`

**Prerequisites**: `spec.md` and `plan.md`

## Phase 1: Setup and Baseline

- [X] T001 Read repository governance, selected task-group guidance, project context, and Spec Kit command definitions in `AGENTS.md`, `.freebuff/`, and `memory-bank/`.
- [X] T002 Inspect the four current source lines, existing DS172411 filter, regression suite, replay gate, report workflow, and prior false-positive work in `specs/037`, `specs/042`, `specs/047`, and `specs/066`.

## Phase 2: Specification and Design

- [X] T003 Define exact path, rule, source-span, test-literal, and negative-control requirements in `specs/082-devskim-reveal-timer-findings/spec.md`.
- [X] T004 Record the narrowly scoped filter design and verification plan in `specs/082-devskim-reveal-timer-findings/plan.md`.
- [X] T005 Create the implementation checklist in `specs/082-devskim-reveal-timer-findings/checklists/requirements.md` and point `.specify/feature.json` at this feature.

## Phase 3: User Story 1 — Filter only the four reviewed false positives (Priority: P1)

**Goal**: Remove the four reviewed false-positive results from uploaded SARIF without hiding unsafe or unreviewed timer findings.

**Independent Test**: Run the full DevSkim suppression unittest suite and the production SARIF replay gate.

- [X] T006 Add separate exact allowlists for the two reveal application files and the single test assertion file in `.github/scripts/suppress_devskim_false_positives.py`.
- [X] T007 Apply the new path allowlist only to DS172411 and add the exact full-line test assertion check while preserving existing source-span validation in `.github/scripts/suppress_devskim_false_positives.py`.
- [X] T008 Add positive SARIF coverage for the four reviewed findings and negative controls for opaque callbacks, altered test strings, and unreviewed paths in `.github/scripts/test_suppress_devskim_false_positives.py`.
- [X] T009 Add exact real-SARIF replay patterns for all four findings in `.github/scripts/verify_devskim_sarif_replay.py`.

## Phase 4: Validation and Handoff

- [X] T010 Python syntax validation passed; the complete suppression unittest suite passed (70 tests, 0 failures) on current head.
- [X] T011 Current-head DevSkim workflow passed; real-SARIF replay reported 151 results, 151 verified suppressions, 0 remaining, and confirmed the raw SARIF was unchanged; filtered SARIF upload succeeded.
- [ ] T012 Run `./freebuff-verify.sh` and review all mandatory PR CI/governance checks; report unavailable checks honestly.
- [X] T013 Reviewed the final nine-file PR diff; only the DevSkim filter/test/replay helpers, Spec Kit records, and active context changed. PR #1689 remains open and unmerged.

## Acceptance Checklist

- [X] Only the four exact source contexts receive the new DS172411 treatment.
- [X] The two application paths do not widen any other DevSkim rule's allowlist.
- [X] String callbacks, opaque callback references, altered test literals, and unreviewed files remain unsuppressed.
- [X] The existing suppression justification, source-span validation, and real-SARIF replay mechanism are reused.
- [ ] All mandatory current-head verification gates are passed or recorded with their exact outstanding status.
