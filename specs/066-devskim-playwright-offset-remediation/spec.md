# Feature Specification: DevSkim Playwright Offset Remediation

**Feature Branch**: `freebuff/2ace85ab2dc71e6e9586f8de`
**Created**: 2026-11-01
**Status**: Implemented
**Input**: Finish the interrupted DevSkim Code Scanning remediation: verify the UTF-16 code-unit offset normalization for the six `sitewide-gold-cta.spec.ts` findings, complete the inventory scan, reconcile it with `devskim-alerts.md`, and run both outstanding gold CTA Playwright specifications.

## Verified baseline (measured, not assumed)

- A real DevSkim 1.0.100 CLI scan of the two Playwright files produced **6** `DS172411` results for `tests/visual/sitewide-gold-cta.spec.ts` (lines 54, 120, 154, 174, 193, 208) and **4** for `tests/visual/gold-cta.spec.ts` (lines 70, 139, 206, 267). These are exactly the 10 ledger rows for those files (six sitewide, four gold).
- For every result the reported `charOffset` equals the **UTF-16 code-unit** offset of `setTimeout`, not the Python code-point index. The two agree only for the ASCII-only `gold-cta.spec.ts`; for `sitewide-gold-cta.spec.ts` the values differ by 5–7 units because the file contains 7 astral characters (emoji).
- `is_allowed_relative_path()` returned `False` for both spec paths, so neither file's results were ever eligible for the existing narrow `DS172411` test-timeout exception.
- Running the current predicate directly: all four `gold-cta.spec.ts` results validate (`span=(3053, 3160)` etc.), while all six `sitewide-gold-cta.spec.ts` results fail with `span=None` — the exact "previously rejected six" described by the task.

## User Scenarios & Testing

### User Story 1 — Correctly validate DevSkim offsets in non-ASCII files (Priority: P1)

As the repository owner, I want the suppression helper to translate DevSkim's UTF-16 code-unit offsets into Python string indices, so verified false positives in files containing emoji are recognized without widening the allowlist or hiding real findings.

**Independent Test**: Feed the exact SARIF region shapes emitted by the real scanner for `sitewide-gold-cta.spec.ts` into `should_suppress_safe_contextual_finding()`; all six validated `test.setTimeout(...)` regions are suppressed, while a code-point-offset variant, an offset that splits a surrogate pair, and a non-test path are rejected.

**Acceptance Scenarios**:
1. **Given** a `DS172411` region whose `charOffset`/`charLength` are UTF-16 code units in a file containing astral characters, **When** the helper validates it, **Then** the span is located at the correct code-point index and the safe test-timeout exception applies.
2. **Given** the same region with ASCII-only source, **When** the helper validates it, **Then** behaviour is unchanged (code-point and UTF-16 offsets coincide).
3. **Given** an offset one unit off, an offset that lands inside a surrogate pair, or a non-`test.setTimeout` token, **When** the helper validates it, **Then** the finding remains visible.

### User Story 2 — Scope the exception to the two audited Playwright files (Priority: P1)

As the repository owner, I want only these two reviewed spec paths added to the existing contextual allowlist, so the scanner stops re-reporting verified Playwright timeout false positives.

**Independent Test**: `resolve_safe_artifact_uri()` resolves the two exact paths and a neighbouring unrelated path is still ineligible.

### User Story 3 — Reconcile the inventory and run both specs (Priority: P2)

As the repository owner, I want the remaining inventory scan completed and reconciled with the ledger, and both gold CTA Playwright specifications executed, so the PR reports measured results rather than assumptions.

## Requirements

- **FR-001**: The absolute-span validator MUST interpret `charOffset`/`charLength` as UTF-16 code units and convert them to code-point indices before comparing with source text.
- **FR-002**: Conversion MUST fail closed when an offset is negative, non-integral, out of range, or splits a surrogate pair.
- **FR-003**: The snippet, line-number, and start-token validations MUST remain in force unchanged.
- **FR-004**: Only the two exact audited paths MAY be added to the contextual allowlist; no glob, rule disablement, or broad suppression is permitted.
- **FR-005**: A ledger row MAY be removed only after the corresponding result is verified suppressed against real scanner output.
- **FR-006**: Both `tests/visual/sitewide-gold-cta.spec.ts` and `tests/visual/gold-cta.spec.ts` MUST be executed and their actual outcome recorded.

## Success Criteria

- **SC-001**: The focused Python suite passes, including new UTF-16 regression and negative-control cases.
- **SC-002**: Re-running the real scanner output through the filter leaves zero results for the two spec files and preserves unrelated genuine findings.
- **SC-003**: `devskim-alerts.md` retains its heading and append marker and contains only entries whose remediation is verified.
- **SC-004**: Both Playwright specifications run with results recorded honestly, including any blocked steps.

## Assumptions

- DevSkim's UTF-16 offset convention is established by the measured scan above, not by inference from documentation.
- GitHub Code Scanning alert objects cannot be read in this environment without a token; the local scanner plus ledger reconciliation is the available evidence path and is labelled accordingly.
