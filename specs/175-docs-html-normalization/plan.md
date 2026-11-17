# Implementation Plan: Documentation HTML Normalization

**Branch**: `chatgpt/175-docs-html-normalization` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/175-docs-html-normalization/spec.md`

## Summary

Normalize HTML documentation responses before they reach the existing snapshot validation/write path. Prefer an advertised same-origin Markdown representation; otherwise extract the semantic content into Markdown using the already-installed JSDOM dependency. Reject full HTML documents and standalone unconverted fragments, but preserve valid Markdown that begins with a supported HTML block. Re-fetch legacy HTML snapshots despite unchanged upstream SHA pins.

## Technical Context

**Language/Version**: Node.js 26, CommonJS.

**Primary Dependencies**: Existing `jsdom` 30.0.1 development dependency; Node.js built-in HTTPS, URL and filesystem APIs.

**Storage**: Existing `.docs/<group>/*.md` snapshots and `.docs/manifest.json`; no schema or manifest changes.

**Testing**: `node scripts/test-refresh-docs.js` (unit + existing updater test workflow) and `node scripts/test-refresh-docs-e2e.js` (isolated complete refresh). GitHub Actions provides frozen-install, Vitest, TypeScript, visual-change classification and repository gates.

**Target Platform**: Existing GitHub Actions documentation-refresh runner (Node.js 26); no production runtime change.

**Project Type**: Documentation refresh CLI and test scripts in the existing Next.js repository.

**Performance Goals**: Preserve the existing 15-second request timeout, 10 MB response limit and maximum five redirect hops. Conversion runs only for HTML responses.

**Constraints**: No new dependency; no source URL or generated `.docs/` edits; preserve existing retry, atomic write, reconciliation, link repair, schedule, Atlantic timezone, reporting and 495 MB documentation library cap. No Cloudflare changes.

**Scale/Scope**: 64 routed source entries; one updater, its unit tests and its isolated end-to-end fixture.

## Constitution Check

- **Single source of truth**: PASS — current `AGENTS.md` and Spec Kit artifacts govern the change.
- **Verify before acting**: PASS — current updater, tests, manifest, workflows, dependencies and routed documentation references were inspected.
- **Implementation sequence**: PASS — Specify, Plan, Tasks and Implement artifacts are maintained in this feature directory. ChatGPT followed the command definitions directly because repository setup scripts are unavailable to it.
- **Protected systems**: PASS — no application, payment, authentication, database, deployment, secrets, or Cloudflare configuration changes.
- **Resource conservation**: PASS — reuse existing JSDOM dependency; preserve 495 MB documentation cap; no live refresh during implementation.
- **Documentation library boundary**: PASS — generated `.docs/` snapshots and manifest are not changed by this task.

## Phase 0: Research

Completed. The existing validator's HTML acceptance was confirmed, the Next.js page's official Markdown alternate was verified, the 64-source inventory was classified by URL shape, and the existing JSDOM dependency was confirmed. See [research.md](research.md). A full live MIME audit of all 64 sources was not performed.

## Phase 1: Design and Implementation

1. Capture response Content-Type and final URL while preserving size, timeout and redirect limits.
2. Detect full HTML documents using MIME and document-level body markers without misclassifying valid Markdown HTML blocks.
3. Parse the page for a same-origin HTTPS Markdown alternate and use it when available.
4. Otherwise use JSDOM to remove common page chrome and serialize meaningful documentation blocks to Markdown.
5. Reject raw HTML at final validation, preserving the existing snapshot on failure.
6. Treat legacy HTML snapshots as needing normalization even when their upstream SHA is unchanged.
7. Preserve semantic blocks nested inside unknown page wrappers, cap alternate-fetch redirects, escape Markdown table cell backslashes before pipes, and report failed conversion clearly.
8. Add focused unit tests and an isolated full-workflow regression fixture; do not run the live documentation refresh.

## Project Structure

### Documentation (this feature)

```text
specs/175-docs-html-normalization/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code

```text
scripts/refresh-docs.js
scripts/test-refresh-docs.js
scripts/test-refresh-docs-e2e.js
.specify/feature.json
```

**Structure Decision**: Update the existing CLI, its existing tests, the isolated fixture and the active Spec Kit feature pointer. No new runtime service, dependency, contract, data model or application code is needed.

## Complexity Tracking

No constitution violations. No new dependency, subsystem, service, external interface or production deployment change.
