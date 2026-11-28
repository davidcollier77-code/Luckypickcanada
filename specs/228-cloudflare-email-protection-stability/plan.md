# Implementation Plan: Stable Cloudflare Email-Protection Links in Documentation

**Branch**: `chatgpt/228-cloudflare-email-protection-stability` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/228-cloudflare-email-protection-stability/spec.md`

## Summary

The NumPy documentation source returns a Cloudflare email-protection anchor whose hexadecimal fragment rotates between otherwise identical responses. The current HTML-to-Markdown converter preserves that generated href, causing a false snapshot diff. Recognize only the exact same-origin Cloudflare endpoint with a hexadecimal fragment and emit the visible anchor label as plain text. Leave all other links unchanged. Add focused converter coverage and an updater-level two-refresh regression.

## Technical Context

**Language/Version**: CommonJS JavaScript, Node.js 26.x.

**Primary Dependencies**: Existing `jsdom` development dependency; Node.js built-ins only. No dependency changes.

**Storage**: Existing `.docs/<group>/*.md` snapshots and `.docs/manifest.json`; no schema or generated documentation changes.

**Testing**: `node scripts/test-refresh-docs.js`, including the updater's isolated end-to-end regression. The existing Visual QA Node 26 Application Verification job already runs this standalone suite.

**Target Platform**: GitHub Actions documentation-refresh and PR verification runners.

**Project Type**: Documentation refresh utility and regression tests.

**Performance Goals**: No additional network requests, dependencies or renderer cost. The check runs only for HTML anchors encountered during existing conversion.

**Constraints**: Preserve source URL, manifest, 10 MB response limit, 15-second request timeout, redirect safety, retry behavior, UTF-8 validation, snapshot preservation, static GSAP policy and the 495 MiB documentation-library limit. Root `scripts/` paths remain subject to build and Playwright QA classifiers. Do not change workflows or weaken QA.

**Scale/Scope**: One converter helper, one unit regression, one two-refresh updater regression and the Spec Kit/Memory Bank handoff.

## Constitution Check

- **Single source of truth**: PASS — current AGENTS.md and the Spec Kit feature artifacts govern the change.
- **Verify before acting**: PASS — current manifest, NumPy snapshot, source code, tests, scheduler workflow, QA classifiers, protected-file workflow and Memory Bank were inspected.
- **Implementation sequence**: PASS — specify → plan → tasks → implement; specification and plan are reviewed before the task list and code changes.
- **Protected systems**: PASS — no manifest, source URL, dependency, workflow, schedule, secrets, application, database or deployment configuration changes. The updater script is protected; the PR will include the exact authorization declaration and the separate protected-file environment authorization gate remains mandatory.
- **Resource conservation**: PASS — reuse the installed JSDOM dependency and existing test harness; no live refresh or paid tool needed.
- **Documentation boundary**: PASS — generated `.docs/` files and manifest remain read-only.

## Research Findings

- The configured NumPy source is `https://numpy.org/doc/stable/reference/arrays.ndarray.html`.
- Two independent Browserless reads returned the same 135,131-character HTML response apart from the hexadecimal fragment attached to the same-origin `/cdn-cgi/l/email-protection` anchor.
- The upstream page's visible link label is `self@value`; the generated href is not part of the substantive reference text.
- The converter preserves anchor hrefs in generated Markdown, turning the rotating fragment into a false content change.
- The manifest's historical NumPy GitHub SHA does not drive the skip decision: `getUpstreamSha()` returns null for this non-GitHub URL, so the updater fetches the configured source and compares normalized content.
- Existing `scripts/test-refresh-docs.js` already runs a complete isolated updater e2e fixture and is wired into the Node 26 Application Verification job in `.github/workflows/visual-qa.yml`. No workflow edit is needed.
- `scripts/refresh-docs.js` is explicitly protected by `.github/workflows/protected-files.yml`. The PR must carry the exact Human Authorization declaration, and the separate protected-file GitHub Environment approval remains a pre-merge requirement.
- The root `scripts/` paths are not positively classified as non-rendering by the build and visual classifiers. Existing build validation and both Playwright shards remain required; no classifier or workflow is being weakened.

## Design

1. In `convertHtmlToMarkdown`, add a small local predicate that resolves the anchor against the page URL and accepts only same-origin HTTPS URLs with the exact Cloudflare email-protection path and a non-empty hexadecimal fragment.
2. In the existing anchor serializer, emit the visible label as plain text for that predicate; otherwise retain the current safeHref and Markdown-link behavior.
3. Add a focused unit test with different tokens, visible label checks, and a normal documentation link.
4. Add an updater-level two-pass regression with a non-GitHub source. The first fetch creates a valid snapshot; the second fetch returns identical content with a different token and must produce no content or manifest timestamp changes.
5. Keep the existing UTF-8, challenge-page, URL/redirect, retry, snapshot-preservation and full isolated end-to-end coverage intact.
6. Update the active Spec Kit feature pointer and concise Memory Bank technical/progress records. Do not edit `.docs/`.

## Project Structure

```text
scripts/refresh-docs.js
scripts/test-refresh-docs.js
specs/228-cloudflare-email-protection-stability/
  spec.md
  plan.md
  research.md
  tasks.md
.specify/feature.json
memory-bank/activeContext.md
memory-bank/techContext.md
memory-bank/progress.md
```

**Structure Decision**: Extend the existing updater and its standalone test harness only. No new package, runtime service, workflow or application code is needed.

## Complexity Tracking

No constitution violations. No additional dependency, subsystem, configuration surface, service, source URL, database or production deployment change.
