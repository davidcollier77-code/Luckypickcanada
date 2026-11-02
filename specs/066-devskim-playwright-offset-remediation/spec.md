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

## Follow-up (2026-11-02): DevSkim CI failure caused by line-pinned fixtures

**Status**: Implemented; CI re-run PASSED on head `8f26fecb` (run `41421657355`, all steps success, Code Scanning reports no new alerts).

### Verified cause (from the failed run, not inferred)

- Run `41419872774`, run number `667`, job `DevSkim scan and Security upload` (`125192572027`), head `8f44045a`, PR #1674.
- Steps: **Run DevSkim scanner** PASS, **Validate DevSkim suppression Python syntax** PASS, **Test DevSkim suppression filter** FAIL, **Suppress DevSkim false positives in SARIF** SKIPPED, both SARIF uploads PASS, **Append new alerts and notify owner** SKIPPED because the lint job failed.
- Reproduced locally: `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'` → `Ran 60 tests`, **failures=6, errors=9**.
- Root cause: `DevSkimUtf16OffsetTests` stored the **absolute line numbers** of the audited `test.setTimeout(180_000)` calls in `tests/visual/sitewide-gold-cta.spec.ts` (`54, 120, 154, 174, 193, 208`). PR #1674 merged the two CTA wording entries into one line, deleting a line at line 25, so every later line moved **up by one** (actual: `53, 119, 153, 173, 192, 207`). At the stale numbers the `startswith("test." + "setTimeout(")` guard failed (6 failures) and `_region_for_line()` raised `ValueError: substring not found` from `line.index("setTimeout")` (9 errors). `gold-cta.spec.ts` was unaffected, which is why only the sitewide fixtures failed.
- The suppression logic itself was correct and unchanged: the SARIF filter was never the failing component.

### Requirements added

- **FR-007**: The UTF-16 fixture MUST locate the audited findings by scanning source content, never by a stored line number or offset.
- **FR-008**: Every validation the fixture exercises (snippet, line, start-token, UTF-16 conversion, one-unit-off, surrogate split, unrelated path) MUST remain in force; no skip, no `continue-on-error`, no rule disablement.
- **FR-009**: The fixture MUST fail loudly if an audited spec stops containing the `test.setTimeout(<digits>);` call, so coverage cannot silently disappear.
- **FR-010**: At least one audited spec MUST still contain astral characters before a finding, so the UTF-16/code-point divergence stays exercised.

### Success criteria added

- **SC-005**: The focused Python suite passes at the PR head (measured: 63 tests, `OK`).
- **SC-006**: The DevSkim workflow's suppression-test step passes on the new head.
- **SC-007**: Genuine findings still survive filtering (an off-token timer in an allowlisted spec and a finding in a non-allowlisted path).

## Follow-up 2 (2026-11-02): real-SARIF replay gate

**Status**: Implemented and locally verified.

A passing unit fixture only proves the filter for synthetic regions. The workflow now also replays the scanner's own SARIF through the production entry point (`suppress_sarif`) on a temporary copy and fails the job when an audited false positive survives in real output.

- **FR-011**: The replay MUST invoke the same production entry point the upload uses, so the gate cannot validate a parallel implementation.
- **FR-012**: The gate MUST fail the job when an audited false positive is still present in the filtered payload, when a finding outside the reviewed allowlist was removed, when an approved suppression survives into the filtered SARIF, or when a second pass still finds suppressible results.
- **FR-013**: The gate MUST NOT modify the raw scanner SARIF (it is compared byte-for-byte before and after) and MUST NOT change triggers, permissions, concurrency, or the Monday schedule.
- **SC-008**: A run in which the audited finding is left unsuppressed fails the job instead of silently passing.
- **SC-009**: A run in which a non-allowlisted finding is filtered out fails the job.
- **SC-010**: With real scanner output the gate reports the suppressed/removed/remaining counts and the audited families it removed.

## Baseline integration audit (2026-11-02)

The owner reports Stripe payments and Resend gift email were verified working before the consolidation. This run checked for regressions rather than assuming breakage because credentials are local-absent.

| Area | Check | Result |
| --- | --- | --- |
| Checkout products | `lucky_pick` `unitAmount: 100`, `gift_package` `unitAmount: 199`, `tip` customer-entered (`>= 50`), all `mode: 'payment'`, `currency: 'cad'` | Verified in source and pinned by `__tests__/stripe-product-alignment.test.js` |
| Product names | `Lucky Pick`, `Lucky Pick Gift`, `Tip Jar` | Verified in source; `Lucky Reveal` deliberately absent from Stripe names |
| Unified popup → backend | Popup resolves to the hidden `checkoutType`; only `checkoutType` is read server-side; `deliveryType` is ignored | Verified by source and browser payload assertions |
| Personal reveal cannot email | `validateGiftSession` requires `checkoutType === "gift_package"`; webhook returns early for other types | Verified by `gift-email-error-handling.test.js` (never emails `lucky_pick`) |
| Gift requires recipient | Server rejects `gift_package` without name/valid email; popup marks fields `required` only for the gift | Verified in source and component tests |
| Gift price guard | `amount_total !== 199` and `currency !== "cad"` rejected; asserted equal to the charged price | Verified by a dedicated alignment test |
| Webhook integrity | `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`; invalid signature → 400; only `checkout.session.completed` + `gift_package` proceeds | Verified in source |
| Duplicate delivery | Redis `SET NX` lock with ownership-token release, `giftDeliveredAt`, persisted `pending` payload, stable `Idempotency-Key: gift-<sessionId>`, 23-hour retry window, `review_required` state | Verified by the mocked delivery suite |
| Verify-session endpoint | Single `app/api/verify-session/route.ts`; no `route.js` beside it | Verified by guard test and build artifact |
| No recurring billing | Single session create with `mode: 'payment'`; no `subscription_data`, `recurring`, or stored `price_` ID | Verified by test |
| Deployed env names | `GIFT_FROM_EMAIL` is a plain `wrangler.jsonc` var; `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` are Cloudflare secrets not present in the repository | Partially verified: names and read sites confirmed; deployed values not accessible |
