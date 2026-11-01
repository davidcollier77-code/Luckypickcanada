# Implementation Plan: Turnstile Early Script Preload

**Branch**: `freebuff/1a7d57e47625ce6441d412f1` | **Date**: 2026-11-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/041-turnstile-early-preload/spec.md`

**Supersedes**: the eager `preload(url, { as: 'script' })` shipped in PR #1568 and deleted by
`7ab4b305`. This plan keeps that mechanism and corrects the one property that made it a mobile
PageSpeed liability.

## Summary

Call React DOM's `preload()` for the wrapper's exact API URL during homepage server rendering, at
`fetchPriority: 'low'`. The hint is emitted into `<head>` of the prerendered homepage document, so
the browser starts the two-hop script fetch while the route's own CSS/JS is still downloading,
instead of after React has hydrated the whole homepage. The script is fetched, not executed, so the
pinned wrapper still registers `window.onloadTurnstileCallback` before it injects the executing tag.

## Technical Context

**Language/Version**: JavaScript / React 19.3.1, Next.js 16.4.3, Node.js 22 target.

**Primary Dependencies**: `@marsidev/react-turnstile` 1.6.1 (loader inspected in `node_modules`);
Playwright 1.63 for the regression test.

**Storage**: N/A.

**Target Platform**: Next.js App Router, statically prerendered homepage, deployed to Cloudflare
Workers via OpenNext.

**Performance Goals**: Move the Turnstile API fetch from *after* hydration to the document-parse
phase without raising its priority above the LCP image or the route's own blocking resources.

**Constraints**: Homepage only; one exact URL; one hint; no duplicate loader; no change to
verification, secrets, environment, API routes, styling or wording.

**Scale/Scope**: One server component line, one Playwright spec, task-scoped Spec Kit artifacts.

## Constitution Check

- **Single source of truth**: `AGENTS.md` followed; artifacts stay task-scoped in the existing
  feature directory.
- **Verify before acting**: the wrapper's loader, the built homepage document, the initial JS/CSS
  set, and the API response/redirect chain were inspected before choosing the fix. The user-reported
  40–60 s duration is not reproducible here and is not claimed as fixed.
- **Protect core systems**: no Cloudflare, secret, environment, authentication, database or payment
  change. The preload cannot mint a token or permit submission.
- **Testing**: one focused Playwright regression plus the repository gate.
- **Result**: PASS for a hint-only change at reduced priority.

## Phase 0: Research

Full findings and measurements: [research.md](research.md).

The decisive facts:

- The wrapper appends its script tag from a mount effect, so without a hint the fetch cannot start
  before hydration.
- The URL 302s to a build-specific path that is cacheable for one year, so an early hint survives a
  slow hydration rather than being a short-lived, wasted download.
- The previous eager hint was removed for critical-path competition, so the correction must keep the
  hint but lower its priority.

## Phase 1: Implementation Design

1. `app/page.js` (server component, `dynamic = 'force-static'`): restore the URL constant and call
   `preload(TURNSTILE_SCRIPT_URL, { as: 'script', fetchPriority: 'low' })` during render. React's
   resource API places the hint in `<head>`; no literal `<link>` in body markup and no early script
   execution.
2. `tests/visual/turnstile-loading.spec.ts`: assert exactly one matching hint on `/` with the exact
   `href` and `fetchpriority="low"`, and none on `/about` or `/map`.
3. Leave `TurnstileField`, its callbacks/state machine, the hidden token field, and
   `validatePublicFormSubmission` untouched.

## Project Structure

```text
app/
└── page.js                                  # homepage-scoped low-priority preload
tests/visual/
└── turnstile-loading.spec.ts                # resource-hint regression
specs/041-turnstile-early-preload/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
└── checklists/requirements.md
```

## Complexity Tracking

No constitution violations. No new dependency, API, component, environment variable, route or
architecture change. `tests/visual/turnstile-loading.spec.ts` already existed and is rewritten, not
duplicated.
