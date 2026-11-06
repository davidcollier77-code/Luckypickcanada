# Implementation Plan: Unused Documentation Reference Retirement

**Branch**: `docs/retire-unused-library-references-20261106` | **Date**: 2026-11-06 | **Spec**: `spec.md`

**Input**: Feature specification from `specs/102-unused-reference-retirement/spec.md`

## Summary

Remove the four previously identified unused references from the active documentation library. Update the manifest indexes, delete each one-group canonical snapshot, remove each matching specialist routing line, and add a regression test. Preserve the earlier PR #1740 cleanup and NumPy's Audio-only assignment.

## Technical Context

**Language/Version**: JSON, Markdown, TypeScript; repository Node.js 22.x.

**Primary Dependencies**: Existing Vitest test runner; no dependencies added or changed.

**Storage**: `.docs/manifest.json`, the `.docs/<group>/` snapshots, and `.freebuff/<group>.md` specialist instructions.

**Testing**: `pnpm exec vitest run __tests__/docs-library-retirement.test.ts`, manifest/snapshot consistency audit, `./freebuff-verify.sh`.

**Target Platform**: Repository documentation and test tooling; no application deployment.

**Project Type**: Next.js application repository with a versioned agent documentation library.

**Performance Goals**: Not applicable; no application runtime changes.

**Constraints**: Preserve all other sources and URLs; keep build size below the 495 MB hard maximum; do not modify updater scripts, updater tests, workflows, scheduling, Cloudflare Worker configuration, or application files.

**Scale/Scope**: Four one-group references retired; existing NumPy route and prior retirements preserved; no new task groups.

## Constitution Check

- **Smallest correct change**: only the manifest, four specialist routing files, four snapshots, a focused regression test, Spec Kit artifacts, feature pointer, and Memory Bank records change.
- **Documentation authorization**: the task explicitly authorizes removing the four identified library documents.
- **Preservation**: no application, dependency, visual, payment, database, security runtime, updater, workflow, schedule, Cloudflare, or deployment changes.
- **Verification**: test the manifest, exact routes, snapshot absence, previous retirement state, and NumPy Audio mapping.

## Phase 0: Research

PR #1740 records these four sources as `USEFUL: NO` and notes no declared dependency or code reference. Current GitHub code search was repeated for each ID; matches were limited to the documentation snapshots, manifest, and specialist routing lines. No additional external research is necessary.

## Project Structure

### Documentation (this feature)

```text
specs/102-unused-reference-retirement/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Repository paths

```text
.docs/manifest.json
.docs/deep-dive/_posthog_posthog-js.md
.docs/polishing/_magicuidesign_magicui.md
.docs/creation/_pmndrs_react-three-fiber.md
.docs/security/_upstash_ratelimit.md
.freebuff/deep-dive.md
.freebuff/polishing.md
.freebuff/creation.md
.freebuff/security.md
__tests__/docs-library-retirement.test.ts
.specify/feature.json
memory-bank/activeContext.md
memory-bank/progress.md
```

**Structure Decision**: Use the existing documentation index, group instruction files, canonical snapshot locations, and Vitest suite; no new subsystem or runtime feature.

## Complexity Tracking

No constitution violations. No additional dependencies, services, migrations, or architecture changes.
