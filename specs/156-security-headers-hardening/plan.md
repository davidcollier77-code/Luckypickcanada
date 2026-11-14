# Implementation Plan: Security Header Hardening

**Branch**: `feat/security-headers-hardening` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/156-security-headers-hardening/spec.md`

## Summary

Apply the hardened header set in the single existing source of truth: the `headers()` block in `next.config.mjs`. Keep the current Next.js-compatible inline-script allowance, add `script-src-attr 'none'`, remove the unused Google Fonts and Pexels origins, switch the referrer policy to `strict-origin-when-cross-origin`, and delete the obsolete `X-XSS-Protection` header. Preserve every other header and the Stripe Checkout form destination. Add focused unit coverage for the header contract and a Playwright check for live violations, then verify with the repository gate, a production build and response-header inspection.

## Technical Context

**Language/Version**: JavaScript (ES modules), React JSX; Node.js 26.x

**Primary Dependencies**: Existing Next.js App Router 16.4.3, React 19.3.1, Cloudflare Turnstile, Google Analytics and Stripe; no new dependencies

**Storage**: N/A

**Testing**: Vitest for the header contract; Playwright Test for rendered pages and CSP violations

**Target Platform**: Cloudflare Pages with the existing OpenNext application runtime

**Project Type**: Next.js web application

**Performance Goals**: No measurable performance change; header value only

**Constraints**: Preserve Next.js inline bootstrap scripts, Turnstile, Google Analytics, Cloudflare Web Analytics, Stripe Checkout, existing appearance/features, all preserved headers, no new credentials, and the 495 MiB production build cap

**Scale/Scope**: One header block, one focused unit test, one focused browser check, and the Spec Kit artifacts

## Constitution Check

- **Single Source of Truth**: Change only the existing `headers()` configuration in `next.config.mjs`; do not add a second header system.
- **Verify Before Acting**: Live production headers, the rendered HTML, font handling, image origins, forms and the Stripe redirect were inspected before changing anything.
- **Implementation Sequence**: Specify, plan and tasks precede implementation; verification and PR handoff follow.
- **Protect Core Systems**: `next.config.mjs` is a protected file. The owner explicitly requested these header changes, which authorizes this scoped edit; Stripe payment configuration is not changed.
- **Resource Conservation**: No new packages or paid services; local `.docs/` remains read-only.
- **Visual Preservation**: No component, stylesheet or content change.

**Gate**: Pass. The owner's request is the authorization for the protected-file header edit; no other protected surface changes.

## Project Structure

### Documentation (this feature)

```text
specs/156-security-headers-hardening/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code

```text
next.config.mjs
__tests__/security-headers.test.js
tests/visual/security-headers.spec.ts
```

**Structure Decision**: Keep the header configuration in the existing Next.js `headers()` block. Add one focused Vitest file and one focused Playwright spec; no new modules, routes or components.

## Complexity Tracking

No constitution violations or additional architectural complexity are introduced.

## Implementation Phases

### Phase 0: Research

Inspect the current policy, the font and image origins actually used, the rendered HTML for inline handlers and forms, and the live production/edge headers. Findings are recorded in [research.md](research.md).

### Phase 1: Design

No data-model, contract or quickstart artifact is needed:
- No persisted entity or schema change.
- The existing response-header contract is captured directly in the unit test.
- The exact verification steps are recorded in `tasks.md`.

### Phase 2: Implementation

1. Add the header-contract unit test and the Playwright violation check.
2. Tighten the CSP in `next.config.mjs`.
3. Change the referrer policy and remove `X-XSS-Protection`.
4. Leave HSTS and the other preserved headers untouched.
5. Run focused tests, the full repository gate, the production build and local browser checks.
6. Record the live-edge HSTS observation and the exact Cloudflare setting needed, if any.
