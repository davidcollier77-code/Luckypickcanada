# Feature Specification: Security Alert Ledger Remediation

**Feature Branch**: `freebuff/6b10109631c978f16411d5d3`

**Created**: 2026-11-10

**Status**: Implemented; evidence recorded in `evidence.md`

**Input**: Resolve the outstanding findings recorded in `devskim-alerts.md`, inspect GitHub code-scanning and Dependabot alerts for additional unresolved findings, fix genuine issues with the smallest safe change, and leave every unresolved item documented with its reason.

## User Scenarios & Testing

### User Story 1 — Each recorded finding is verified against current source (Priority: P1)

As the repository owner, I need every ledger entry checked against the file and line that exist today so a stale entry is not mistaken for a fixed one.

**Why this priority**: The ledger is append-only, so line numbers drift as source changes. Removing an entry without proof would hide a real finding.

**Independent Test**: For each ledger entry, open the current source at the recorded path and locate the recorded rule's token; compare it with the open code-scanning alert list.

**Acceptance Scenarios**:

1. **Given** an entry whose recorded line no longer contains the rule's token, **When** the current file and the open alert list are checked, **Then** the entry is classified as stale or superseded and removed only after the live finding is covered.
2. **Given** an entry that matches an open alert, **When** the source is inspected, **Then** it is classified as a reviewed false positive, a genuine defect, or unknown with evidence.

### User Story 2 — Genuine findings are fixed and reviewed false positives stay filtered (Priority: P1)

As the repository owner, I need real defects fixed and audited false positives suppressed narrowly so the next scan does not re-add the same entries.

**Why this priority**: Clearing the ledger without changing scanner output would be undone by the next scheduled run.

**Independent Test**: Run the DevSkim suppression unit tests and replay the filter against SARIF built from the stored alert coordinates; confirm exactly the reviewed results are removed and every other finding remains.

**Acceptance Scenarios**:

1. **Given** a Playwright `test.setTimeout(<number>)` finding in a reviewed spec, **When** the filter runs, **Then** only that timeout configuration is removed.
2. **Given** the test-only documentation-refresh mock transport timer, **When** the filter runs, **Then** its callable zero-delay callback is removed while a string timer on the same file stays visible.
3. **Given** loopback text inside a committed probe-report JSON string, **When** the filter runs, **Then** only the reported loopback token inside a JSON value containing a loopback URL is removed.
4. **Given** the published Cloudflare account identifier or a pinned upstream revision, **When** the filter runs, **Then** only the exact reviewed line and token are removed; a different identifier on the same line stays visible.
5. **Given** the placeholder-text test assertion, **When** the filter runs, **Then** only that assertion's flagged word is removed.
6. **Given** a workflow without an explicit token permission block, **When** the fix is applied, **Then** the workflow declares the least privilege it needs.

### User Story 3 — Remaining risk is documented and unchanged behaviour is preserved (Priority: P2)

As the repository owner, I need the dependency alert either remediated and verified or left open with a clear reason, and no application behaviour changed.

**Why this priority**: A scanner count is not worth a broken build or an unverified dependency jump.

**Independent Test**: Review the final diff and the recorded check results; confirm no application route, styling, payment, email, storage or security control changed.

**Acceptance Scenarios**:

1. **Given** the reviewed alert set, **When** the diff is inspected, **Then** it contains only scan-filter tooling and its tests, one workflow permission block, a dependency override, the ledger, Spec Kit and Memory Bank records.
2. **Given** a dependency remediation cannot be verified, **When** the task completes, **Then** the alert is reported as outstanding with its measured evidence rather than dismissed.

### Edge Cases

- A recorded line number can be superseded by a later edit while the same finding remains open under a new line.
- A finding can stay open on an earlier analysed commit after its filter landed; the alert closes only on a later scan of the default branch.
- SARIF column values may include the surrounding quotes of a reported token.
- A JSON string can be an object key rather than a value and must not qualify as probe-report data.

## Requirements

- **FR-001**: Every entry in `devskim-alerts.md` MUST be verified against current source before removal.
- **FR-002**: The filter MUST suppress only the reviewed rule, path, line and token combinations, and MUST keep every unreviewed finding visible.
- **FR-003**: Regression tests MUST cover both the suppressed and the rejected case for each new family.
- **FR-004**: The real-SARIF replay gate MUST treat the new families as audited and reject any removal outside the allowlist.
- **FR-005**: The deployment workflow MUST declare the least privilege its steps need.
- **FR-006**: A dependency change MUST keep the committed lockfile consistent and MUST pass the type check, build and tests.
- **FR-007**: The ledger MUST remain an accurate list: no unresolved entry removed, no resolved entry retained.
- **FR-008**: No application route, visual, payment, email, storage or security-control behaviour may change.

## Success Criteria

- **SC-001**: Zero reviewed findings survive the local filter replay, and zero unreviewed findings are removed by it.
- **SC-002**: The repository verification script exits 0 and the production build stays below 495 MiB.
- **SC-003**: The final diff matches the reported file list exactly.
- **SC-004**: Every remaining open alert has a recorded reason and next step.

## Assumptions

- Cloudflare account IDs and pinned commit revisions are public identifiers, not credentials; the corresponding secrets remain in repository or Worker secret storage.
- Committed files under `artifacts/` are review evidence, never part of the Next.js build or public asset output.
- The DevSkim workflow re-scan after merge is the authoritative closure signal for its code-scanning alerts.
