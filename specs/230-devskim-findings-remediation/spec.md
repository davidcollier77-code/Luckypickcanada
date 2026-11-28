# Feature Specification: DevSkim Findings Remediation and Stable Ledger Identity

**Feature Branch**: `freebuff/d05e4582a2636e1701cac123`
**Created**: 2026-11-28
**Status**: Implemented — local suites passing; two review rounds addressed; owner review pending
**Input**: Owner request for a combined DevSkim and Dependabot health check that repairs confirmed defects without weakening detection, plus Pullfrog reviews on PR #2065 that found two further defects in the ledger identity.

This single feature directory records the whole DevSkim remediation performed by this
task: removing the DS173237 fixture literals, restoring one ledger entry per distinct
finding, and making a fingerprint-less finding's identity independent of the reported
line, a per-scan rank and the report job's checkout. The repository's Spec Kit
governance gate allows exactly one feature directory per task/PR, so the two repairs
are specified together rather than as separate features.

## Problem Statement

`devskim-alerts.md` is an append-only ledger. `append_devskim_findings.py` appends a
finding only when its identity is not already recorded, so an identity must name one
finding and only that finding for the life of the ledger.

Four defects were confirmed and repaired.

### 1. Secret-shaped fixture literals re-raised on every scan

The GitHub Security tab held four open error-level DevSkim alerts, all rule
**DS173237** (`DoNotStoreTokensOrKeysInSourceCode`), at `scripts/test-refresh-docs.js`
lines 194, 195, 749 and 768. They arrived with the scan of PR #2063 and were
re-detected on `main` (commit `4ac05274`).

The four spans are the two Cloudflare email-protection fixture tokens used to prove
that the documentation updater ignores rotated opaque href fragments:

- `2d5e48414b0b0e1e1a160b0e181f160b0e1915165b4c415848`
- `dcafb9b0bafaffefebe7faffe9eee7faffe8e4e7aabdb0a9b9`

They are synthetic test data, not credentials: the converter under test accepts any
`#<hex>` fragment on a same-origin `/cdn-cgi/l/email-protection` link, and nothing
reads or transmits these values. The alert is a false positive in substance, but it is
a **correct** match of the rule's published pattern `[\"'][a-f0-9]{30,}[\"']` (a quoted
run of 30 or more lowercase hex characters, from
`rules/default/security/privacy/secrets.json`). Because the literals remained, every
scan re-raised them and the consolidated report's DevSkim category stayed at WARNING.

### 2. Eight ledger entries for four findings

`devskim-alerts.md` listed the four findings twice. The append-only identity included
the reported line, and PR #2063 shifted each token one line down (193→194, 194→195,
748→749, 767→768). Each shifted finding therefore received a new identity and was
appended again, even though the ledger's contract is one entry per distinct finding.

### 3. The first identity repair used a per-scan rank

The first repair (commit `19fe6ee`) removed the line but added an **occurrence rank**:
the index of a result among the results sharing its shape, ordered by reported
position. A rank describes the scan's current set, not the finding, and ledger ids are
permanent. Pullfrog reproduced both consequences by executing the changed script:

- `194/749` then `194/300/749` (a new same-shape finding inserted between two known
  ones) appended a **second entry for 749** and **never recorded 300** — the new
  result inherited a known rank and was skipped, while the known result got a new rank
  and was recorded again.
- `194/749` then `194` (the 749 finding remediated) then `194/300` appended **nothing
  at all**: the new finding inherited the removed finding's rank.

Both suites passed, because the insertion test asserted only `newCount` and the marker
total, and both coincidentally stayed correct.

### 4. The second identity repair read the checked-out source

The second repair (commit `aed9b241`) removed the rank and keyed a fingerprint-less
finding on its source content, but read part of that content from the working tree.
Pullfrog's next review found that the `update-report` job prepares its branch by
checking out an existing `chore/devskim-report-update-*` branch *after* downloading
the current run's SARIF, so the checkout need not match the scanned revision. The same
unchanged SARIF then produced two different ids and two ledger rows when only the
workspace source differed. A finding's identity must not depend on which tree happens
to be checked out.

## User Scenarios & Testing

### User Story 1 — No secret-shaped literals in the test fixture (Priority: P1)

As the security maintainer, I need the documentation-updater tests to exercise
rotating Cloudflare tokens without storing a quoted 30+ character hex literal, so
DevSkim reports nothing for the file and the four existing alerts can close as fixed.

**Independent Test**: apply the rule's published pattern to
`scripts/test-refresh-docs.js`; before the change it matches four literals, after it
matches none, while `node scripts/test-refresh-docs.js` still passes all 61 tests.

### User Story 2 — Identical fixture semantics (Priority: P1)

As a maintainer, I need the fixture to remain two distinct, 56-character, hex-only
tokens so the converter test still proves rotation handling rather than a trivially
empty input.

**Independent Test**: the generated tokens are 56 lowercase hex characters, differ
from each other and keep their existing prefixes, so the negative assertions
(`/2d5e4841|dcafb9b0/`) remain meaningful and the converter still strips the
same-origin fragment while preserving the visible label.

### User Story 3 — One ledger entry per distinct finding (Priority: P1)

As a reviewer of `devskim-alerts.md`, I need the ledger to list each distinct finding
once, so its count can be compared with the GitHub Security alerts and the
consolidated report.

**Independent Test**: the ledger contains exactly the four current-line entries for
the four open alerts, and the superseded line-shift entries for the same four findings
are gone. No finding disappears from the ledger: each remains listed at its current
line.

### User Story 4 — A new same-shape finding inserted between known ones (Priority: P1)

As the owner, I need a finding inserted between two recorded findings to be appended
at its own location, without touching or re-appending the known entries.

**Independent Test**: scan tokens at lines 1 and 2; then insert a different token at
line 2 (moving the second to line 3). Exactly one row is appended and it names
`src/example.ts:2`; the two existing rows and ids are unchanged.

### User Story 5 — A finding remediated, then a different new finding (Priority: P1)

As the owner, I need a new finding that appears after another one was remediated to be
recorded, even though it occupies the remediated finding's old line.

**Independent Test**: scan lines 1 and 2; scan line 1 only; scan line 1 plus a
different token at line 2. The middle scan appends nothing and removes nothing, and
the last appends one row naming `src/example.ts:2` with a new id.

### User Story 6 — Renumbering, rescanning and a reused report branch (Priority: P1)

As the owner, I need a rescan to append nothing whatever line the finding now occupies
and whichever tree the report job has checked out.

**Independent Test**: record a finding, shift it one line, move it forty lines down,
then append the identical SARIF from a workspace whose source changed and from one
where the source is absent. No later scan appends anything and the recorded rows stay
byte-identical.

### User Story 7 — Duplicates and distinct same-line findings (Priority: P2)

As a reviewer, I need an exactly duplicated SARIF result recorded once and two
different findings sharing one line recorded separately.

**Independent Test**: a result repeated twice in one file appends once; two different
tokens on one line append two rows with different ids.

### User Story 8 — Upgrading an existing ledger (Priority: P2)

As the owner, I need ids written by earlier script versions still recognised, so the
upgrade appends nothing for findings the ledger already holds.

**Independent Test**: the benchmark writes an entry with the superseded script, then
the current script scans the same finding: zero appends, one entry, report unchanged.
With one earlier-version entry and two different findings on its line, the entry covers
one and the other is still appended.

### Edge Cases

- The rule matches only quoted runs of 30+ lowercase hex characters; 8-character seeds
  and runtime-built strings are not matched.
- The visible label assertion (`Return self@value.`) and the ordinary-link assertions
  must be unaffected by the token's internal shape.
- The second inline occurrence (the two-pass `runRefresh` test) must use the same
  generated tokens so both scan sites clear together.
- A future edit that reintroduces a long hex literal will be reported again — detection
  is not weakened in any way.
- A finding whose reported `charOffset`/`charLength` is stale or absent is identified
  from the SARIF snippet and reported column/length; a usable and an unusable offset
  produce the same identity.
- The appending job may reuse an older report branch, so the same SARIF appended from
  two different working trees must append nothing the second time.
- Two findings identical in every SARIF field (rule, file, message, snippet text,
  column, length) with no fingerprint cannot be told apart across scans; see
  Limitation.
- A scanner change to the message, snippet or span of the same finding changes its
  identity and appends once more, as the message did before this change.

## Requirements

### Functional Requirements

- **FR-001**: `scripts/test-refresh-docs.js` MUST NOT contain a quoted run of 30 or
  more lowercase hex characters.
- **FR-002**: The fixture MUST still produce two distinct 56-character lowercase hex
  tokens with the existing `2d5e4841` and `dcafb9b0` prefixes.
- **FR-003**: Both converter test sites (the direct converter test and the two-pass
  `runRefresh` test) MUST use the generated tokens.
- **FR-004**: All existing fixture assertions and test counts MUST remain, with no
  assertion weakened, skipped or deleted.
- **FR-005**: `devskim-alerts.md` MUST contain one entry per distinct currently open
  finding (four), removing only the superseded line-shift duplicates for those
  findings.
- **FR-006**: The DevSkim scanner rules, scan globs, workflow triggers, permissions,
  concurrency, suppression filter, SARIF upload and reporting behaviour MUST remain
  unchanged.
- **FR-007**: No suppression may be added, broadened or disabled to achieve either
  result.
- **FR-008**: A result with a scanner fingerprint MUST use the fingerprint identity,
  which MUST NOT include the reported line.
- **FR-009**: A result without a fingerprint MUST be identified from finding-specific
  data only. A per-scan rank among other results MUST NOT be part of its identity.
- **FR-010**: The identity MUST NOT include the absolute reported line.
- **FR-011**: A result without a fingerprint MUST be identified from the SARIF result
  alone: rule, file, message, the matched `snippet` text, the reported column and the
  span length. The identity MUST NOT read the working tree, so a reused report branch
  cannot change it, and the script MUST NOT invent content.
- **FR-012**: Findings that differ in rule, file, message, snippet text, column or
  length MUST be separate entries.
- **FR-013**: Two results identical in identity and reported position MUST be recorded
  once.
- **FR-014**: Occurrences of one identity MUST be matched against the ledger's existing
  entries: a scan holding no more occurrences than the ledger records MUST append
  nothing, and a scan holding more MUST append only the surplus, preferring occurrences
  at locations not yet recorded.
- **FR-015**: Ids written by earlier versions MUST still be recognised as aliases:
  `(rule, uri, line)`, `(rule, uri, fingerprint)`, `(rule, uri, line, detail)` and the
  superseded v2 shape id. The current primary id MUST be checked separately and MUST
  NOT be presented as a "previous" id.
- **FR-015a**: Each earlier id MUST cover at most one occurrence, so an earlier
  line-based entry cannot hide a second, different finding recorded at that line.
- **FR-016**: The ledger MUST remain append-only: add entries, never edit, reorder or
  delete them. No existing entry may be removed or rewritten to satisfy the new
  identity.
- **FR-017**: The SARIF input, row format, marker syntax, `new_count` output and
  workflow invocation MUST remain unchanged.
- **FR-018**: The script MUST NOT read source files to build an identity. Its SARIF
  input, the ledger and `GITHUB_OUTPUT` are its only inputs.
- **FR-019**: No scanner rule, scan glob, suppression filter, permission, SARIF upload,
  trigger or reporting behaviour may change.

### Non-Functional Requirements

- The fixture helper is a two-line pure function using only built-in string operations.
- Identity computation is linear per result plus one report scan; no source file is
  opened.

## Limitation (explicit)

Two findings that share rule, file, message, snippet text, column and length and have
no scanner fingerprint are **indistinguishable across scans**. They share one identity.
The ledger therefore tracks *occurrences*, not physical copies:

- an unchanged scan of them appends nothing;
- an additional copy appends one entry, but that entry cannot be guaranteed to name the
  inserted copy when the copies also shift;
- removing one copy and later adding an identical one appends nothing, because an
  append-only ledger cannot observe the removal and must not rewrite an entry.

DevSkim supplies no other finding-specific signal for such results. Dropping the source
line from the identity broadens this to identical findings that sit on different lines
of the same file; that is the price of an identity no checkout can change.
`__tests__/devskim-dedup.test.js` pins the observable behaviour under a test named for
the limitation.

## Out of Scope

- Editing `.github/workflows/devskim.yml`, `suppress_devskim_false_positives.py`, the
  replay gate or any scanner rule or glob.
- Closing or dismissing the GitHub alerts manually; alert closure is observable only
  after the next `main` scan uploads the changed source.
- Rewriting or migrating existing ledger entries.
- CodeQL, Dependabot, scheduler or workflow-trigger changes; dependency upgrades,
  application changes or deployment.

## Success Criteria

- **SC-001**: The published DS173237 pattern matches zero locations in
  `scripts/test-refresh-docs.js`.
- **SC-002**: `node scripts/test-refresh-docs.js` passes 61/61 with the generated
  tokens.
- **SC-003**: The generated tokens are 56 hex characters, distinct, and preserve both
  prefixes.
- **SC-004**: `devskim-alerts.md` lists exactly four entries, matching the four open
  alerts.
- **SC-005**: An inserted same-shape finding is recorded at its own line and no known
  finding is appended twice.
- **SC-006**: A new finding after a remediation is recorded and the remediated finding
  is not re-added.
- **SC-007**: A renumber, a repeated scan, a reordered scan and a rescan from a changed
  or absent workspace append nothing.
- **SC-008**: An exact duplicate appends once; two different same-line findings append
  twice.
- **SC-009**: `vitest run __tests__/devskim-dedup.test.js` passes, asserting the
  recorded `uri:line` and id for every appended entry.
- **SC-010**: `identity_benchmark.py` records the expected line for the new finding in
  both sequences against this script, records the wrong line for both against the
  superseded `19fe6ee` script, and records zero appends from a changed workspace.
- **SC-011**: The DevSkim Python reporting and suppression suites and `py_compile`
  pass.
- **SC-012**: The fixture and dependency-management guard suites still pass.

## Assumptions

- The four open alerts were the only open code-scanning alerts (confirmed live on
  2026-11-28), so the ledger count can be compared directly.
- DevSkim continues to emit `snippet` for located findings, together with the reported
  columns and, when present, `charOffset`/`charLength`.
- `.github/workflows/devskim.yml` may run the appender on a reused report branch whose
  checkout differs from the scanned revision; the identity does not read it.
