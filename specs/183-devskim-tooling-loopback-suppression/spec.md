# Feature Specification: Exact-Span DevSkim Suppression for Reviewed CI Loopback Tokens

**Feature Branch**: `freebuff/c3e3aea4b5256eb42e63e937`

**Created**: 2026-11-17

**Status**: Implemented; verification recorded in `evidence.md`

**Input**: Owner-approved, narrowed follow-up to `specs/182-devskim-alert-report-review`: suppress only the three DS162092 loopback findings in the changed-line security reviewer and its test, with exact-span predicates, positive/negative tests, and real-SARIF replay coverage.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The reviewer's loopback exclusion set is not reported as debug code (Priority: P1)

As the repository owner, I need DevSkim to stop reporting the two loopback host tokens that the changed-line reviewer uses to recognise local development origins, so scheduled scans do not re-append a reviewed false positive to the shared report.

**Why this priority**: These are the only two DS162092 findings in production CI security tooling; the file is not shipped and the tokens never form an outbound endpoint.

**Independent Test**: Build a SARIF result at each token's exact DevSkim span, run the production filter, and confirm the suppression is added only when the token is a member of the reviewed exclusion set.

**Acceptance Scenarios**:

1. **Given** the reviewer's exclusion-set member for the loopback hostname, **When** the SARIF span covers exactly that token and the preceding statement is the exclusion-set membership test, **Then** the result is suppressed with the reviewed justification.
2. **Given** the same line without the exclusion-set context, **When** the filter runs, **Then** the result is retained.
3. **Given** a different host value in the same set, **When** the filter runs, **Then** the result is retained.

---

### User Story 2 - The reviewer's own loopback fixture is not reported (Priority: P1)

As the repository owner, I need the reviewer test's local health-check URL fixture exempted at its exact token, so the test can keep exercising the reviewer without creating a recurring scan finding.

**Why this priority**: The fixture is test-only and exercises the same reviewer behaviour; leaving it visible would split one reviewed concern across two dispositions.

**Independent Test**: Build the exact fixture line with its DevSkim span, run the filter, and confirm suppression; repeat with an external host and with the fixture in an unreviewed file and confirm retention.

**Acceptance Scenarios**:

1. **Given** the exact reviewer-test fixture line, **When** the span covers the loopback hostname, **Then** the result is suppressed.
2. **Given** an external host on the same fixture line, **When** the filter runs, **Then** the result is retained.
3. **Given** the same fixture text in an unreviewed file, **When** the filter runs, **Then** the result is retained.

---

### User Story 3 - The suppression cannot hide an unrelated finding (Priority: P1)

As the repository owner, I need every predicate to fail closed when the source, path, rule, or reported span no longer matches the reviewed token, so the exemption cannot become a broad suppression.

**Why this priority**: A path-only allowlist or a line-only pattern could hide a future debug endpoint or an unrelated credential finding.

**Independent Test**: Run the negative matrix: a different set member, a missing exclusion-set statement, an unreviewed path, an external host, and a span covering only part of the token. Every case must retain the result.

**Acceptance Scenarios**:

1. **Given** a reported span that covers only a substring of the token, **When** the filter runs, **Then** the result is retained.
2. **Given** a path outside the two reviewed files, **When** the filter runs, **Then** the result is retained before any source predicate is consulted.
3. **Given** the reviewed justification is not in the verified set, **When** SARIF removal runs, **Then** the result remains in the uploaded SARIF.

### Edge Cases

- DevSkim can change its column convention; the filter must validate the absolute offset and snippet and retain the result when they disagree.
- A future edit can add another host to the exclusion set; only the two reviewed tokens are exempt.
- Moving the loopback fixture to a different file or changing its shape must end the exemption.
- The two placeholder test fixtures in the scope checker are deliberately out of scope and must remain visible.
- A markdown or test fixture that contains the token must not itself become a new scanner finding.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The filter MUST allow source inspection of exactly `.github/scripts/review_pr_changes.py` and `.github/scripts/test_review_pr_changes.py` for DS162092 only.
- **FR-002**: The reviewer predicate MUST require the reported token to equal the reviewed loopback hostname or loopback address.
- **FR-003**: The reviewer predicate MUST require the token to match its exact reviewed line pattern, including indentation and quoting.
- **FR-004**: The reviewer predicate MUST require the preceding exclusion-set membership statement; a token elsewhere on the same line or file MUST NOT qualify.
- **FR-005**: The reviewer-test predicate MUST require the exact local health-check fixture statement and the exact loopback hostname token.
- **FR-006**: Every predicate MUST validate the SARIF region against the source text through the existing span validator and MUST fail closed on any mismatch.
- **FR-007**: The reviewed justification MUST be added to `VERIFIED_FALSE_POSITIVE_JUSTIFICATIONS` so the result is removed from the uploaded SARIF, not merely marked suppressed.
- **FR-008**: The two DS176209 placeholder fixtures MUST remain untouched and unsuppressed.
- **FR-009**: The change MUST NOT alter scanner rules, severities, scan globs, workflow triggers, application code, or dependencies.
- **FR-010**: Tests MUST cover each positive finding plus negative controls for a different set member, missing context, unreviewed path, external host, and partial span.
- **FR-011**: The replay gate MUST include both reviewed families and MUST fail when either family survives.
- **FR-012**: Verification MUST include the focused unit suite, real-SARIF replay, `./freebuff-verify.sh`, and a measured production build below 495 MiB.

## Key Entities

- **Reviewed loopback token**: A loopback hostname or address that appears only as an exclusion-set member or test fixture in CI security tooling.
- **Exact span**: The DevSkim region whose validated source slice equals the reviewed token.
- **Verified justification**: A justification string accepted by `remove_verified_false_positive_results`.
- **Replay family**: One `AuditedFinding` that real scanner output must no longer contain after filtering.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The focused suite passes 110 tests, including three positive and six negative cases for this change.
- **SC-002**: Real scanner SARIF with five results reports three suppressed and three removed, leaving exactly the two out-of-scope placeholder results.
- **SC-003**: The replay gate reports both new families as removed and the second filter pass finds zero remaining suppressions.
- **SC-004**: No result outside the two reviewed files or outside DS162092 is suppressed.
- **SC-005**: The production build remains strictly below 495 MiB.
- **SC-006**: No application, workflow, scanner-configuration, dependency, or DS176209 change appears in the final diff.

## Assumptions

- The existing DevSkim 1.0.103 SARIF regions in `/tmp/ds` are real scanner output for the current source.
- Both files are CI-only Python tooling and are not part of the Next.js build or production runtime.
- The owner approved implementation after reviewing the proposal and directed a narrower scope than the five-finding proposal.
- The two DS176209 placeholder fixtures require a separate decision and are intentionally left visible.
