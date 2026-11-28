# Feature Specification: DevSkim DS173237 Test-Fixture Remediation

**Feature Branch**: `freebuff/d05e4582a2636e1701cac123`
**Created**: 2026-11-28
**Status**: Implemented — local updater and guard suites passing
**Input**: Owner request for a combined DevSkim and Dependabot health check that repairs confirmed defects and keeps all findings accurately accounted for without weakening detection.

## Problem Statement

The repository's GitHub Security tab holds four open error-level DevSkim alerts, all rule **DS173237** (`DoNotStoreTokensOrKeysInSourceCode`), at `scripts/test-refresh-docs.js` lines 194, 195, 749 and 768. They arrived with the scan of PR #2063 and were re-detected on `main` (commit `4ac05274`).

The four spans are the two Cloudflare email-protection fixture tokens used to prove that the documentation updater ignores rotated opaque href fragments:

- `2d5e48414b0b0e1e1a160b0e181f160b0e1915165b4c415848`
- `dcafb9b0bafaffefebe7faffe9eee7faffe8e4e7aabdb0a9b9`

They are synthetic test data, not credentials: the converter under test accepts any `#<hex>` fragment on a same-origin `/cdn-cgi/l/email-protection` link, and nothing reads or transmits these values. The alert is therefore a false positive in substance, but it is a **correct** match of the rule's published pattern, which is `["'][a-f0-9]{30,}["']` (a quoted run of 30 or more lowercase hex characters, from `rules/default/security/privacy/secrets.json`). Because the literals are still present, every scan re-raises them and the consolidated report's DevSkim category stays at WARNING on every pull request.

A second, separate reporting defect appeared with the same scan: `devskim-alerts.md` now lists **eight** entries for these **four** findings. `append_devskim_findings.py` builds a finding identity that includes the reported line number, and PR #2063 shifted each token one line down (193→194, 194→195, 748→749, 767→768). Each shifted finding therefore received a new identity and was appended again, even though the file's contract says new findings are appended once and the ledger is the "running list of distinct findings".

## User Scenarios & Testing

### User Story 1 — No secret-shaped literals in the test fixture (Priority: P1)

As the security maintainer, I need the documentation-updater tests to exercise rotating Cloudflare tokens without storing a quoted 30+ character hex literal, so DevSkim reports nothing for the file and the four existing alerts can close as fixed.

**Independent Test**: Apply the rule's published pattern to `scripts/test-refresh-docs.js`. Before the change it matches four literals; after it matches none, while `node scripts/test-refresh-docs.js` still passes all 61 tests.

### User Story 2 — Identical test semantics (Priority: P1)

As a maintainer, I need the fixture to remain two distinct, 56-character, hex-only tokens so the converter test still proves rotation handling rather than a trivially empty input.

**Independent Test**: The generated tokens are 56 lowercase hex characters, differ from each other, and keep their existing prefixes, so the existing negative assertions (`/2d5e4841|dcafb9b0/`) remain meaningful and the converter still strips the same-origin fragment while preserving the visible label.

### User Story 3 — One ledger entry per distinct finding (Priority: P2)

As a reviewer of `devskim-alerts.md`, I need the ledger to list each distinct finding once, so its count can be compared with the GitHub Security alerts and the consolidated report.

**Independent Test**: The ledger contains exactly the four current-line entries for the four open alerts, and the superseded line-shift entries for the same four findings are gone. No finding disappears from the ledger: each of the four remains listed at its current line.

### Edge Cases

- The rule matches only quoted runs of 30+ lowercase hex characters; shorter seeds (8 characters) and runtime-built strings are not matched.
- The visible label assertion (`Return self@value.`) and the ordinary-link assertions must be unaffected by the token's internal shape.
- The second inline occurrence (the two-pass `runRefresh` test) must use the same generated tokens so both scan sites clear together.
- A future edit that reintroduces a long hex literal will be reported again — detection is not weakened in any way.

## Requirements

### Functional Requirements

- **FR-001**: `scripts/test-refresh-docs.js` MUST NOT contain a quoted run of 30 or more lowercase hex characters.
- **FR-002**: The fixture MUST still produce two distinct 56-character lowercase hex tokens with the existing `2d5e4841` and `dcafb9b0` prefixes.
- **FR-003**: Both converter test sites (the direct converter test and the two-pass `runRefresh` test) MUST use the generated tokens.
- **FR-004**: All existing assertions and test counts MUST remain, with no assertion weakened, skipped or deleted.
- **FR-005**: `devskim-alerts.md` MUST contain one entry per distinct currently open finding (four), removing only the superseded line-shift duplicates for the same four findings.
- **FR-006**: The DevSkim scanner rules, scan globs, workflow triggers, permissions, concurrency, suppression filter, SARIF upload and reporting behaviour MUST remain unchanged.
- **FR-007**: No suppression may be added, broadened or disabled to achieve the result.

### Non-Functional Requirements

- The change is confined to one test file's fixture construction and the append-only ledger; no production code, dependency, workflow or configuration changes.
- The fixture helper is a two-line pure function using only built-in string operations.

## Out of Scope

- Editing `.github/workflows/devskim.yml`, `suppress_devskim_false_positives.py`, the replay gate or any scanner rule or glob.
- Redesigning the ledger identity algorithm; the line-number sensitivity is recorded as a follow-up.
- Closing or dismissing the GitHub alerts manually.
- Any dependency upgrade, application change or deployment.

## Success Criteria

- **SC-001**: The published DS173237 pattern matches zero locations in `scripts/test-refresh-docs.js`.
- **SC-002**: `node scripts/test-refresh-docs.js` passes 61/61 with the generated tokens.
- **SC-003**: The generated tokens are 56 hex characters, distinct, and preserve both prefixes.
- **SC-004**: `devskim-alerts.md` lists exactly four entries, matching the four open alerts.
- **SC-005**: The focused DevSkim guard suites and the dependency-management guard still pass.

## Assumptions

- The four open alerts are the only open code-scanning alerts (confirmed live on 2026-11-28), so the ledger count can be compared directly.
- Alert closure is observable only after the next `main` scan uploads the changed source; that post-merge step is recorded as the verification boundary.
