# Implementation Plan: Documentation Refresh Stability and Integrity

**Branch**: `fix/docs-refresh-stability-integrity-20261127` | **Date**: 2026-11-27 | **Spec**: `spec.md`

**Input**: Feature specification from `specs/227-docs-refresh-stability-integrity/spec.md`

## Summary

Add two narrow protections to the existing refresh path: comparison-only decoding of Cloudflare email-protection tokens so rotating ciphertext for one destination does not trigger a rewrite, and an explicit plain-text verification-response signature so challenge content cannot replace documentation. Keep all source and stored document bytes intact apart from a genuine upstream content update.

## Technical Context

- **Language/Version**: JavaScript, repository Node.js 26.x.
- **Primary Dependencies**: Existing Node.js built-ins only (`Buffer`, `TextDecoder`, URL decoding); no dependency changes.
- **Storage**: Existing Markdown snapshots and `.docs/manifest.json`; the repair does not write to the real library.
- **Testing**: `node scripts/test-refresh-docs.js`, including its isolated `scripts/test-refresh-docs-e2e.js` workflow; CI runs the suite in `.github/workflows/visual-qa.yml` under Node.js 26.
- **Target Platform**: Existing GitHub Actions documentation refresh and Node.js 26 verification workflow.
- **Project Type**: Repository documentation maintenance script.
- **Performance Goals**: Comparison normalization remains linear in document length and introduces no network calls or new storage.
- **Constraints**: Keep HTTPS/same-origin rules, 15-second timeout, 10 MB response limit, strict UTF-8 decoding, two-attempt retry, 495 MiB library cap, canonical-copy/symlink model, reports and scheduler unchanged.
- **Scale/Scope**: Two focused validation/comparison behaviors, the existing updater unit/E2E suites and required Spec Kit/Memory Bank records.

## Constitution Check

- `AGENTS.md` remains authoritative; no governance file is changed.
- The owner explicitly authorized this repair, including the protected `scripts/refresh-docs.js` path. The PR must include the exact Human Authorization declaration; the separate protected-file Environment approval remains mandatory before merge.
- Complete specify → plan → tasks → implement in order.
- Do not change the manifest, source URLs, group routing or real `.docs/` files. The current GSAP snapshot remains a known integrity issue until a valid upstream response refreshes it.
- No new dependency, service, application, hosting, deployment, database or secret change.
- Root `scripts/` paths are not positively classified as non-rendering by the current visual classifier; the PR must allow the existing automated Visual QA decision to run and must not weaken that classifier.
- No visual baseline or browser-evidence changes are planned.

## Research Findings

- `/numpy/numpy` uses `https://numpy.org/doc/stable/reference/arrays.ndarray.html`, not a raw GitHub URL. It therefore uses fetch-and-compare rather than the upstream Git commit-SHA shortcut.
- The live snapshot's `__matmul__` link contains `/cdn-cgi/l/email-protection#...`. The current payload decodes to `self@value`; a different XOR token can encode the same destination, while another token can encode a genuinely different address.
- Existing comparison only normalizes line endings/trailing whitespace and specific Google Devsite metadata. It does not recognize Cloudflare's volatile ciphertext.
- The current main-branch `.docs/polishing/_llmstxt_gsap_llms_txt.md` contains only `Please wait while your request is being verified...`. The existing validator recognizes several HTML challenges but not this plain-text response; it currently passes length and readable-word thresholds.
- The updater already rejects invalid downloads before writes, preserves old snapshots on rejection and includes rejection URL/reason in its report. This repair extends those existing controls rather than replacing them.
- The current main GSAP snapshot is already invalid. The library is out of scope for this repair; the regression test will explicitly identify this one known existing invalid snapshot without exempting other documents.

## Design

1. Decode the Cloudflare hexadecimal payload in a dedicated helper: XOR the payload with its first-byte key, strictly decode UTF-8, resolve numeric HTML entities and percent escapes, and accept only one email-like destination.
2. Replace only recognized valid Cloudflare email-protection fragments in a temporary comparison string with a deterministic destination fingerprint. Invalid tokens stay verbatim. Do not change `output`, `contentBefore`, fetched bytes or written snapshots.
3. Route both existing and downloaded documents through one comparison-normalization function alongside the current Devsite and line-ending normalizers.
4. Add the plain-text challenge signature as an anchored start-of-response pattern in the existing error/challenge validator. Ordinary prose mentioning the phrase later in a document remains acceptable.
5. Add unit coverage for same-destination token rotation, genuine destination changes, malformed tokens, exact challenge rejection and valid explanatory prose.
6. Extend the isolated full-refresh test with a seeded valid GSAP snapshot and the exact mocked HTTP 200 challenge response. Prove byte-identical preservation, URL/reason reporting and failure status; hash the real `.docs/` before/after to ensure no library mutation.

## Project Structure

- `scripts/refresh-docs.js` — comparison-only Cloudflare decoding and plain-text challenge rejection.
- `scripts/test-refresh-docs.js` — focused normalizer, validator and refresh-path regressions.
- `scripts/test-refresh-docs-e2e.js` — isolated end-to-end preservation and report regression.
- `specs/227-docs-refresh-stability-integrity/` — specification, plan and tasks.
- `.specify/feature.json` — active feature pointer.
- `memory-bank/activeContext.md`, `techContext.md`, `progress.md` — current task and durable verified technical facts.

## Complexity Tracking

No new dependency, service, data model, network request, workflow, cache or general-purpose URL canonicalization is introduced. The normalizer is restricted to a recognized Cloudflare URL pattern and is used only for content equality.
