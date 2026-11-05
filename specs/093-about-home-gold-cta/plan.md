# Implementation Plan: About Page Return to Home Gold CTA

**Branch**: `polish/about-home-gold-cta-20261105` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/093-about-home-gold-cta/spec.md`

## Summary

Replace only the dark styling on the About-page Return to Home link with the existing global `.gold-3d-btn` treatment. Retain the link, homepage destination, visible wording, current wrapper, and sizing. Add a decorative home emoji using the existing `.gold-cta-emoji` convention.

## Technical Context

**Language/Version**: JavaScript (Next.js App Router; repository version).

**Primary Dependencies**: Existing Next.js, Tailwind CSS utilities, global CTA styles, and Playwright test setup. No new dependencies.

**Storage**: N/A.

**Testing**: Existing Playwright visual regression spec at `tests/visual/sitewide-gold-cta.spec.ts`; repository verification gate `./freebuff-verify.sh`.

**Target Platform**: Mobile and desktop web browsers.

**Project Type**: Single Next.js web application.

**Performance Goals**: No added runtime work, network requests, assets, or bundle dependencies.

**Constraints**: Reuse the global measured gold ramp and interaction states; preserve keyboard focus and reduced-motion behavior; keep the 495 MB production-build ceiling; change no unrelated page content.

**Scale/Scope**: One link, one existing browser regression test, and the three required Spec Kit artifacts.

## Constitution Check

- **Single source of truth**: PASS — use `.gold-3d-btn` and `.gold-cta-emoji` from `app/globals.css`; add no competing CSS.
- **Verify before acting**: PASS — inspected `AGENTS.md`, routed polishing/testing instructions, current About page, global CTA definitions, the existing Playwright assertion, active feature numbering, and current PR/branch state.
- **Implementation sequence**: PASS — specification, plan, tasks, implementation, and verification are represented in this feature's artifacts and work sequence.
- **Protect core systems**: PASS — no payments, APIs, database, authentication, deployment, secrets, or unrelated functionality are changed.
- **Accessibility and responsive behavior**: PASS — keep the existing link semantics and wrapper; mark the decorative emoji `aria-hidden`; reuse global focus and reduced-motion styling.

## Phase 0 — Research

No additional research is needed. The authoritative global CTA class, its measured gradient/raised edge, and the existing test that explicitly excludes the About link were inspected directly in the repository.

## Phase 1 — Design

- Source: `app/about/page.js` — change the existing Return to Home link's classes and add the decorative home icon.
- Regression coverage: `tests/visual/sitewide-gold-cta.spec.ts` — replace the obsolete dark-style assertion with checks for the gold gradient, raised edge, accessible name, and unchanged `/` destination.
- Spec Kit metadata: `.specify/feature.json` points to this feature directory.
- No new stylesheet, component, dependency, data model, API contract, or quickstart is necessary.

## Project Structure

```text
app/about/page.js
tests/visual/sitewide-gold-cta.spec.ts
specs/093-about-home-gold-cta/
  spec.md
  plan.md
  tasks.md
.specify/feature.json
memory-bank/activeContext.md
```

**Structure Decision**: Make the smallest change in the existing About route and extend the existing sitewide gold CTA browser test.

## Complexity Tracking

No constitution violations or additional architecture are introduced.
