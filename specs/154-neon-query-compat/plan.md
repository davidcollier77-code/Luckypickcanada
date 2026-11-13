# Implementation Plan: Restore Lucky Stories Database Reads

**Branch**: `154-neon-query-compat` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/154-neon-query-compat/spec.md`

## Summary

Restore Lucky Stories read operations after the application upgraded to
`@neondatabase/serverless` 1.2.0. Neon 1.0 changed its HTTP query function so it
can only be called as a tagged template. The four manually parameterized reads
must use the driver's `.query(sqlText, params)` method instead. Keep every
existing SQL statement, parameter placeholder, value array, result mapping and
error behavior unchanged.

## Technical Context

**Language/Version**: JavaScript, Node.js 26.x

**Primary Dependencies**: `@neondatabase/serverless` 1.2.0, Next.js 16.4.3, Vitest

**Storage**: Existing Neon PostgreSQL database; no schema or data changes

**Testing**: Focused Vitest coverage in `__tests__/lucky-stories-pagination.test.js`,
full Vitest suite, TypeScript check, repository verification and Playwright visual QA

**Target Platform**: Cloudflare Pages with OpenNext

**Project Type**: Next.js web application

**Performance Goals**: Preserve the existing bounded summary, recent-activity and paged-story queries.

**Constraints**: Keep all SQL values parameterized; do not use `unsafe()`, interpolate user
values into SQL, change database secrets, change schema or touch stored records. Preserve
the 495 MiB production build ceiling and existing visuals.

**Scale/Scope**: Four parameterized SELECT operations in the Lucky Stories read path and
one focused test file.

## Constitution Check

- **Single source of truth**: Follow `AGENTS.md` and the current Spec Kit artifacts.
- **Verify before acting**: The official Neon 1.0.0 changelog and 1.2.0 project dependency
  were checked; the incompatible call sites were identified in the current source.
- **Implementation sequence**: Specify → Plan → Tasks → Implement.
- **Protect core systems**: Owner authorized this source repair. No production database,
  schema, stored data, secrets, connection configuration, payment, or deployment settings
  are changed.
- **Resource conservation**: No paid services or documentation refreshes.

**Gate**: PASS. No constitution conflict identified.

## Project Structure

```text
app/
└── lucky-stories.js                         # Four parameterized Neon reads
__tests__/
└── lucky-stories-pagination.test.js         # Strict Neon 1.x client mock and regression
specs/154-neon-query-compat/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
└── checklists/
    └── requirements.md
```

**Structure Decision**: Keep the fix in the existing Lucky Stories data module and its
existing pagination test. No new runtime modules, dependencies, routes or schema artifacts.

## Complexity Tracking

No constitution violations or additional architecture complexity.
