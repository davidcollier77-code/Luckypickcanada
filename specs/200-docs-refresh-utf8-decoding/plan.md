# Implementation Plan: UTF-8-Safe Documentation Refresh

**Branch**: fix/docs-refresh-utf8-stream-decoding | **Date**: 2026-11-20  
**Spec**: spec.md

## Summary

Replace per-chunk string coercion in the documentation HTTP response readers with bounded raw-byte collection and one strict UTF-8 decode after the response completes. Add byte-splitting and malformed-sequence regression tests, and wire the dedicated suite into the existing pull-request QA workflow.

## Technical Context

- **Language/Version**: JavaScript, Node.js 26.x (repository requirement).
- **Primary Dependencies**: Node built-ins only; Buffer and util.TextDecoder. No dependency changes.
- **Storage**: Existing Markdown snapshot files and .docs/manifest.json; no data-model or schema changes.
- **Testing**: node scripts/test-refresh-docs.js; existing pnpm run test, TypeScript and PR QA checks remain.
- **Target Platform**: GitHub Actions on Ubuntu with Node.js 26 and pnpm 10.30.3.
- **Project Type**: Documentation maintenance script and CI regression coverage.
- **Performance Goals**: Bound response memory by the existing 10 MB per-source limit; decode once per response.
- **Constraints**: Preserve updater safeguards, the 495 MiB library cap, schedule, retry timing, source configuration and existing good snapshots.
- **Scale/Scope**: Two HTTP response readers, one focused test harness and one existing QA workflow.

## Constitution Check

- AGENTS.md remains authoritative; no governance policy or protected governance file is changed.
- The user explicitly authorized repair of the updater source, classified as protected by the dedicated Protected File Changes workflow. The PR must include the exact human-authorization declaration, and the separate owner-controlled environment approval remains mandatory before merge.
- Complete specify → plan → tasks → implement in order.
- Keep .docs/ and its manifest read-only; no source URL or snapshot changes are needed.
- No dependency, application, deployment, database or secret changes.
- The updater's existing 10 MB response ceiling and 495 MiB library ceiling remain unchanged.
- CI's existing Playwright workflow remains intact. The changed root scripts/ paths fail closed in the current visual-change classifier, so automated visual shards remain required; no visual baseline changes are expected.

## Research Findings

- The documentation response reader previously used data += chunk for each HTTP data event. Each Buffer is independently converted to text, so a chunk boundary inside a multi-byte UTF-8 sequence can produce U+FFFD even when the complete response bytes are valid.
- The GitHub commit-SHA response reader used the same per-chunk conversion pattern and should be corrected consistently.
- The validator intentionally rejects U+FFFD. Keep that guard; prevent false replacement characters by decoding only after all bytes are combined.
- .docs/manifest.json defines the allowed source URLs and group routing. Recent intermittent rejection of known upstream pages does not prove URL misconfiguration. Do not alter URLs.
- The current visual-qa.yml verification job does not call scripts/test-refresh-docs.js; the suite currently runs only through the broader local verification script. Add it to the Node 26 QA job to make the regressions continuously exercised.

## Design

1. Add a small helper that concatenates Buffer chunks and decodes once with a fatal UTF-8 TextDecoder. Preserve a leading BOM to match the prior Buffer-to-string behavior. Convert decoder failures into a clear invalid-UTF-8 error.
2. In fetchUrlResponse, count raw bytes before retaining each chunk, stop collecting and reject when the existing 10 MB ceiling is crossed, handle response-stream errors, then decode once on end before applying the existing token sanitizer.
3. In getUpstreamSha, use the same helper and byte-based size accounting. Preserve its non-fatal fallback behavior: an oversized, invalid or non-JSON commit response resolves to null, causing the existing byte-comparison fallback rather than breaking the refresh.
4. Update the HTTP test mock to emit Buffer chunks and response-stream errors. Add valid UTF-8 split-boundary and malformed UTF-8 tests. Keep existing size, timeout, redirect, token-sanitization, retry and scheduler assertions.
5. Add the standalone updater test command to the existing visual-qa.yml Node 26 verification job after the general unit suite. Do not change the browser jobs or classifier.

## Project Structure

- scripts/refresh-docs.js — bounded byte collection, strict whole-response UTF-8 decoder and HTTP response readers.
- scripts/test-refresh-docs.js — streamed-byte test mock and decoding regressions.
- .github/workflows/visual-qa.yml — execute the updater test suite in the existing Node 26 verification job.
- specs/200-docs-refresh-utf8-decoding/ — feature specification, plan and task record.

## Complexity Tracking

No additional dependencies, services, configuration surfaces or competing decoding abstractions are introduced. The shared helper is limited to the two existing response readers.
