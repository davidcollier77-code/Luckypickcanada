# Feature Specification: Stable DevSkim Ledger Identity

**Feature Branch**: `freebuff/d05e4582a2636e1701cac123`
**Created**: 2026-11-28
**Status**: Implemented — local suites passing; owner review pending
**Input**: Pullfrog review on PR #2065, finding "Occurrence rank misattributes ledger entries when findings are added or removed": the first repair replaced the reported line with a per-scan occurrence rank, which is not a property of a finding.

## Problem Statement

`devskim-alerts.md` is an append-only ledger. `append_devskim_findings.py` appends
a finding only when its identity is not already recorded, so an identity must
name one finding and only that finding for the life of the ledger.

Spec 110 first keyed a fingerprint-less finding on `(rule, uri, line, message,
columns, endLine)`. PR #2063 shifted four DS173237 fixtures by one line, every id
changed, and all four were appended a second time.

The first repair (commit `19fe6ee`) removed the line but added a **per-scan
occurrence rank**: the index of a result among the results sharing its shape,
ordered by reported position. A rank describes the scan's current set, not the
finding, and the ledger's ids are permanent. Pullfrog reproduced both consequences
by executing the changed script:

- `194/749` then `194/300/749` (a new same-shape finding inserted between two known
  ones) appended a **second entry for 749** and **never recorded 300** — the new
  result inherited a known rank and was skipped, while the known result got a new
  rank and was recorded again.
- `194/749` then `194` (the 749 finding remediated) then `194/300` appended
  **nothing at all**: the new finding inherited the removed finding's rank.

Both suites passed, because the new insertion test asserted only `newCount` and the
marker total, and both coincidentally stayed correct.

## User Scenarios & Testing

### User Story 1 — A new same-shape finding inserted between known ones (Priority: P1)

As the owner, I need a finding inserted between two recorded findings to be appended
at its own location, without touching or re-appending the known entries.

**Independent Test**: scan tokens at lines 1 and 2; then insert a different token at
line 2 (moving the second to line 3). Exactly one row is appended and it names
`src/example.ts:2`; the two existing rows and ids are unchanged.

### User Story 2 — A finding remediated, then a different new finding (Priority: P1)

As the owner, I need a new finding that appears after another one was remediated to
be recorded, even though it occupies the remediated finding's old line.

**Independent Test**: scan lines 1 and 2; scan line 1 only; scan line 1 plus a
different token at line 2. The middle scan appends nothing and removes nothing, and
the last scan appends one row naming `src/example.ts:2` with a new id.

### User Story 3 — Renumbering and rescanning (Priority: P1)

As the owner, I need unrelated line insertions to append nothing, whichever line the
finding now occupies.

**Independent Test**: record a finding, shift it one line, then move it forty lines
down. Both later scans append nothing and the recorded rows are byte-identical.

### User Story 4 — Duplicates and distinct same-line findings (Priority: P2)

As a reviewer, I need an exactly duplicated SARIF result recorded once and two
different findings sharing one line recorded separately.

**Independent Test**: a result repeated twice in one file appends once; two different
tokens on one line append two rows with different ids.

### User Story 5 — Upgrading an existing ledger (Priority: P2)

As the owner, I need ids written by earlier versions of the script still recognised,
so the upgrade appends nothing for findings the ledger already holds.

**Independent Test**: the benchmark writes an entry with the superseded script, then
  the current script scans the same finding: zero appends, one entry, report unchanged.
  With one earlier-version entry and two different findings on its line, the entry
  covers one and the other is still appended.

### Edge Cases

- A finding whose `charOffset`/`charLength` disagrees with the checked-out source or
  with the scanner's own snippet is identified from the snippet, then from the
  reported columns; an invalid span is never trusted.
- A finding with no readable source (no location, an unreadable file, a path outside
  the workspace, a file over 2 MiB) falls back to snippet and reported coordinates.
- Two findings that are byte-identical in every observable field (rule, message,
  span text, column, length, line text) and have no fingerprint cannot be told
  apart across scans; see Limitation.
- A scanner change to the message, snippet or span of the same finding changes its
  identity and appends once more, as the message did before this change.

## Requirements

### Functional Requirements

- **FR-001**: A result with a scanner fingerprint MUST use the fingerprint identity,
  which MUST NOT include the reported line.
- **FR-002**: A result without a fingerprint MUST be identified from finding-specific
  data only. A per-scan rank among other results MUST NOT be part of its identity.
- **FR-003**: The identity MUST NOT include the absolute reported line.
- **FR-004**: The identity MUST use DevSkim's matched source span when it can be
  validated against the checked-out source and the scanner's snippet, converting
  UTF-16 offsets to code points; otherwise the snippet; otherwise the reported
  columns. The script MUST NOT invent content.
- **FR-005**: Findings that differ in rule, file, message, span text, column, length
  or source-line text MUST be separate entries.
- **FR-006**: Two results identical in identity and reported position MUST be
  recorded once.
- **FR-007**: Occurrences of one identity MUST be matched against the ledger's
  existing entries: a scan holding no more occurrences than the ledger records MUST
  append nothing, and a scan holding more MUST append only the surplus, preferring
  occurrences at locations not yet recorded.
- **FR-008**: Ids written by earlier versions MUST still be recognised as aliases:
  `(rule, uri, line)`, `(rule, uri, fingerprint)`,   `(rule, uri, line, detail)` and
  the superseded v2 shape id. The current primary id MUST be checked separately and
  MUST NOT be presented as a "previous" id.
- **FR-008a**: Each earlier id MUST cover at most one occurrence, so an earlier
  line-based entry cannot hide a second, different finding recorded at that line.
- **FR-009**: The ledger MUST remain append-only: add entries, never edit, reorder
  or delete them. No existing entry may be removed or rewritten to satisfy the new
  identity.
- **FR-010**: The SARIF input, row format, marker syntax, `new_count` output and
  workflow invocation MUST remain unchanged.
- **FR-011**: Only files inside the checked-out workspace may be read, each at most
  once per run, with a size cap.
- **FR-012**: No scanner rule, scan glob, suppression filter, permission, SARIF
  upload, trigger or reporting behaviour may change.

### Non-Functional Requirements

- The change is confined to one reporting script, its test and the benchmark.
- Identity computation is linear per result plus one report scan; each source file
  is read and split once per run.

## Limitation (explicit)

Two findings that share rule, message, span text, column, length and line text and
have no scanner fingerprint are **indistinguishable across scans**. They share one
identity. The ledger therefore tracks *occurrences*, not physical copies:

- an unchanged scan of them appends nothing;
- an additional copy appends one entry, but that entry cannot be guaranteed to name
  the inserted copy when the copies also shift;
- removing one copy and later adding an identical one appends nothing, because an
  append-only ledger cannot observe the removal and must not rewrite an entry.

DevSkim supplies no other finding-specific signal for such results. The design does
not claim a stable identity for them, and `__tests__/devskim-dedup.test.js` pins the
observable behaviour under a test named for the limitation.

## Out of Scope

- Removing the four existing `devskim-alerts.md` entries; that happens after their
  remediation is verified on `main`.
- Changing `.github/workflows/devskim.yml`, the suppression filter or any scanner
  rule (including adding a fingerprint to DevSkim's output).
- CodeQL, Dependabot, scheduler or workflow-trigger changes.
- Rewriting or migrating existing ledger entries.

## Success Criteria

- **SC-001**: An inserted same-shape finding is recorded at its own line and no known
  finding is appended twice.
- **SC-002**: A new finding after a remediation is recorded and the remediated
  finding is not re-added.
- **SC-003**: A renumber, a repeated scan and a reordered scan append nothing.
- **SC-004**: An exact duplicate appends once; two different same-line findings append
  twice.
- **SC-005**: `vitest run __tests__/devskim-dedup.test.js` passes, asserting the
  recorded `uri:line` and id for every appended entry.
- **SC-006**: `identity_benchmark.py` records the expected line for the new finding
  in both sequences against this script, and records the wrong line for both against
  the superseded `19fe6ee` script.
- **SC-007**: The DevSkim Python reporting and suppression suites and `py_compile`
  pass.

## Assumptions

- DevSkim continues to omit fingerprints for rules such as DS173237, and continues to
  emit `charOffset`/`charLength` and `snippet` for located findings.
- The report job checks out the same commit the scan ran on, as `.github/workflows/devskim.yml`
  currently does.
