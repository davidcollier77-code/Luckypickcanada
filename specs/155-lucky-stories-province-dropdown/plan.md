# Implementation Plan: Canonical Lucky Stories Province Selection

**Branch**: `feat/lucky-stories-province-dropdown` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/155-lucky-stories-province-dropdown/spec.md`

## Summary

Replace the optional free-text Province or territory field in the Community Stories modal with a required native dropdown containing the existing thirteen canonical full names. Use the existing province list as the single source of truth. Enforce the same canonical allowlist on the server and store the canonical matched name. Preserve legacy province resolution for existing stories and leave the submission security flow intact.

## Technical Context

**Language/Version**: JavaScript (ES modules), React JSX; Node.js 26.x

**Primary Dependencies**: Existing Next.js App Router 16.4.3 and React 19.3.1; no new dependencies

**Storage**: Existing Neon PostgreSQL records; no schema or data changes

**Testing**: Vitest, Testing Library where relevant, Playwright Test

**Target Platform**: Cloudflare Pages with the existing OpenNext application runtime

**Project Type**: Next.js web application

**Performance Goals**: No measurable performance change; reuse a small in-memory list already loaded by the application

**Constraints**: Preserve the existing modal appearance, story submission route and field name, Turnstile, spam protection, validation of other fields, legacy read matching, and the 495 MiB production build cap

**Scale/Scope**: One public form control, its server-side location validation, and focused automated regression coverage

## Constitution Check

- **Single Source of Truth**: Reuse the canonical `storyProvinces` collection; no duplicate province list.
- **Verify Before Acting**: Existing form, resolver, route, tests, workflows and templates were inspected before implementation.
- **Implementation Sequence**: Specify, plan and tasks precede implementation; verification and PR handoff follow.
- **Protect Core Systems**: No database schema/data, secrets, payment, authentication, Cloudflare configuration or deployment changes.
- **Resource Conservation**: No new packages or paid service usage; local `.docs/` remains read-only.
- **Visual Preservation**: Keep the modal's current visual styling; only replace the location input with a styled native select and placeholder.

**Gate**: Pass. No constitution exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/155-lucky-stories-province-dropdown/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code

```text
app/
├── lucky-story-provinces.js
├── lucky-stories.js
└── lucky-map-of-canada/
    └── lucky-map-of-canada.js

__tests__/
└── lucky-stories.test.js

tests/visual/
└── lucky-stories-pagination.spec.ts
```

**Structure Decision**: Extract the existing province records into a dependency-free shared data module consumed by both the server validator and browser form. Re-export the records from the existing server module so current imports remain compatible. Extend current unit and Playwright coverage rather than creating a parallel component, route or test harness.

## Complexity Tracking

No constitution violations or additional architectural complexity are introduced.

## Implementation Phases

### Phase 0: Research

Use the existing canonical province records and preserve the current province resolver. Findings are recorded in [research.md](research.md). No further external research is needed.

### Phase 1: Design

No data-model, contract or quickstart artifact is needed:
- No persisted entity or schema changes.
- The existing POST route and `location` form field remain unchanged; only accepted new values become stricter.
- The exact manual and automated verification steps are recorded in `tasks.md`.

### Phase 2: Implementation

1. Extract the canonical province data into a dependency-free shared module without changing its entries.
2. Add unit coverage for all thirteen canonical names and invalid/missing values.
3. Add browser coverage for the dropdown options, required selection and unchanged submission journey.
4. Implement canonical allowlist validation and the required native dropdown.
5. Run focused tests, full repository verification and applicable Playwright projects where execution is available.
