# Feature Specification: Line-Insensitive DevSkim Ledger Identity

**Feature Branch**: `freebuff/d05e4582a2636e1701cac123`
**Created**: 2026-11-28
**Status**: Implemented — local suites passing
**Input**: Owner follow-up on PR #2065: the append-only DevSkim ledger still keys a finding on its reported line when the scanner supplies no fingerprint, so renumbering a file re-appends a known finding.

## Problem Statement

`devskim-alerts.md` is the append-only "running list of distinct findings". Each entry carries a `<!-- devskim-id:… -->` marker, and `append_devskim_findings.py` appends a finding only when its identity is not already recorded.

Spec 110 gave the identity two forms:

- **fingerprint present** — `(rule, uri, scanner fingerprint)`, already independent of the reported line;
- **no fingerprint** — `(rule, uri, reported line, message, columns, end line)`.

DevSkim emits `partialFingerprints` for only some results, so most findings take the second form. That identity contains the reported line. When PR #2063 inserted a line above `scripts/test-refresh-docs.js`'s fixture tokens, the same four DS173237 findings moved from 193/194/748/767 to 194/195/749/768, every identity changed, and all four were appended a second time. The ledger then held eight entries for four findings, and PR #2065 had to prune the four superseded rows by hand. Any future renumbering of a file with an open fingerprint-less finding reproduces the same defect, and an unattended `main` scan can silently double the ledger.

The line is not part of a finding's identity; it is a property of the file's current text. The ledger must recognise the same finding after a renumber, keep genuinely distinct findings separate (Spec 110's "two distinct findings on one line" requirement), keep exact duplicate results collapsed, and remain append-only — no existing entry is rewritten, moved or removed.

## User Scenarios & Testing

### User Story 1 — A renumbering must not re-append a known finding (Priority: P1)

As the maintainer of the DevSkim ledger, I need an already-recorded finding to keep its identity when the file is renumbered, so the ledger stays one entry per distinct finding without manual dedupe.

**Independent Test**: Record a fingerprint-less finding at line 194, re-scan the same finding at line 195, and then at line 300. `new_count` is `0` for both later scans and the ledger still holds one entry.

### User Story 2 — Distinct findings must stay distinct (Priority: P1)

As a reviewer, I need two identical findings on different lines, and two different findings on one line, to remain separate entries so no defect is hidden by deduplication.

**Independent Test**: Two identical findings at lines 194/195 both append; shifting both to 195/196 appends nothing and keeps two entries. Two findings on one line with different columns still produce two entries.

### User Story 3 — Duplicate results and prior ledger entries (Priority: P2)

As a maintainer, I need an exact duplicate result in one SARIF file recorded once, and a ledger written by the previous script still recognised, so upgrading the script never rewrites or duplicates history.

**Independent Test**: A scan containing the same result twice appends one entry; a report holding a previous-version entry is not appended to again.

### Edge Cases

- A finding with no source location (no file, no line) has no region; its shape uses empty columns and a zero span, and it remains distinct from other messages.
- A scanner that starts or stops emitting a fingerprint for the same finding changes the identity form; unchanged ids from either form are recognised through the previous-identity aliases.
- An identical finding added next to one that was just renumbered appends exactly one entry: the occurrence index is count-preserving, not a blanket "one entry per shape".
- An entry superseded by remediation stays in the ledger until a maintainer removes it after verified remediation; the script never removes entries.

## Requirements

### Functional Requirements

- **FR-001**: The identity used for a result with a stable scanner fingerprint MUST NOT include the reported line.
- **FR-002**: The identity used for a result without a fingerprint MUST NOT include the reported line.
- **FR-003**: Two findings that differ in rule, file, message, columns or span MUST remain separate entries.
- **FR-004**: Two identical findings on different lines MUST remain separate entries, and renumbering them together MUST NOT append anything.
- **FR-005**: Two results identical in every reported field MUST be recorded once.
- **FR-006**: Identities written by earlier versions of the script MUST still be recognised, so no existing ledger entry is duplicated or rewritten.
- **FR-007**: The ledger MUST remain append-only: the script adds entries and never edits, reorders or deletes existing ones.
- **FR-008**: The SARIF input, report format, `new_count` output and workflow invocation MUST remain unchanged.

### Non-Functional Requirements

- The change is confined to one reporting script and its regression test; no scanner rule, scan glob, workflow, suppression filter, permission, dependency or application code changes.
- Identity computation stays linear in the number of results plus one sort per distinct shape.

## Out of Scope

- Removing the four existing `devskim-alerts.md` entries; they are removed only after remediation is verified on `main`.
- Changing `.github/workflows/devskim.yml`, `suppress_devskim_false_positives.py` or any scanner rule.
- Recovering a ledger entry written by an earlier version of the script that is later renumbered; the aliases cover unchanged ids only, and no such entry exists in the current ledger.

## Success Criteria

- **SC-001**: A fingerprint-less finding renumbered across three scans appends once.
- **SC-002**: Two identical findings on separate lines append twice and survive a joint renumbering with zero new entries.
- **SC-003**: An exact duplicate result in one scan appends once; distinct same-line columns append twice.
- **SC-004**: `vitest run __tests__/devskim-dedup.test.js` passes every existing and new case.
- **SC-005**: The DevSkim Python reporting, suppression and replay suites still pass, and the previous script's identity benchmark still reports one entry for duplicate and legacy cases.

## Assumptions

- DevSkim continues to omit fingerprints for rules such as DS173237; the fingerprint path remains the precise identity when one is available.
- The reported columns and span of an unchanged finding are stable across scans, which the DS173237 records confirm (all four tokens are 56 characters in the same columns).
