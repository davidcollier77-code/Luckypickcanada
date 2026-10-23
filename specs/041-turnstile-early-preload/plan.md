# Implementation Plan: Turnstile Early Script Preload

**Branch**: `fix/turnstile-early-script-preload-20261022` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/041-turnstile-early-preload/spec.md`

## Summary

Use React DOM's `preload()` API during homepage server rendering for the exact Cloudflare Turnstile API URL used by the pinned wrapper. This emits the resource hint in `<head>` while leaving the existing wrapper responsible for injecting/executing the widget after its callback is registered.

## Technical Context

**Language/Version**: JavaScript / React 19.3.x, Next.js 16.4.1, Node.js 22.

**Primary Dependencies**: `@marsidev/react-turnstile` 1.6.1; Playwright 1.63.x.

**Storage**: N/A.

**Testing**: Playwright browser regression, `pnpm run test`, `pnpm exec playwright test`, TypeScript, `./jules-verify.sh`, and Cloudflare/OpenNext build-size checks as available.

**Target Platform**: Next.js App Router deployed to Cloudflare Workers through OpenNext.

**Project Type**: Web application.

**Performance Goals**: The exact Turnstile API resource should be requested from the initial homepage document, before client-side widget initialization needs it.

**Constraints**: Homepage only; one exact URL; no duplicate script loader; preserve all verification/security behavior, styling, wording, and page layout. Do not change dependencies, environment variables, API routes, or deployment configuration.

**Scale/Scope**: One server-rendered page, one browser regression test, and task-scoped Spec Kit artifacts.

## Constitution Check

- **Single source of truth**: Follow `AGENTS.md`; keep the feature's specification, plan, tasks, and PR evidence task-specific.
- **Verify before acting**: The component/package version and the current page/widget wiring were inspected. The user-reported 45-second duration is not independently measured by this session.
- **Protect core systems**: No server token validation, secrets, APIs, database, or deployed Cloudflare configuration will be changed.
- **Testing**: Add a Playwright regression test and run required checks through the available connected repository/CI path.
- **Result**: PASS for scoped preload-only implementation.

## Phase 0: Research

- Reviewed `app/turnstile-field.jsx`, `app/turnstile-config.js`, `app/page.js`, `app/layout.js`, `package.json`, and the related existing tests.
- The installed wrapper's script URL convention uses `onload=onloadTurnstileCallback&render=explicit`. A previous preload URL that omitted the onload callback would not be a byte-for-byte match.
- Cloudflare recommends loading the API early and optionally using a `preconnect` resource hint. The root layout already preconnects to `challenges.cloudflare.com`; the new preload is page-scoped.
- Additional design artifacts (data model, API contract, and quickstart) are unnecessary because this change introduces no new state, API, or workflow.
- Official references: [Cloudflare embed the widget](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/), [React Turnstile script-loading example](https://turnstile.marsidev.com/examples/script-loading).

## Phase 1: Implementation Design

1. Call React DOM's `preload(TURNSTILE_SCRIPT_URL, { as: 'script' })` while rendering the homepage server component. React's resource API emits the hint in `<head>`; do not rely on a literal `<link>` in body markup or execute the script before the wrapper registers its onload callback.
2. Add a Playwright regression test that asserts the hint appears exactly once in the document head on `/` and does not appear on `/about`.
3. Do not change `TurnstileField`, its state machine/callbacks, form layout, or `validatePublicFormSubmission`.

## Project Structure

```text
app/
└── page.js                         # Homepage-only early script preload
tests/visual/
└── turnstile-loading.spec.ts       # Resource-hint regression
specs/041-turnstile-early-preload/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
└── checklists/requirements.md
```

## Complexity Tracking

No constitution violations. No new dependencies, APIs, components, environment variables, or architecture.
