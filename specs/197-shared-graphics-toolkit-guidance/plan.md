# Implementation Plan: Shared Graphics Toolkit Guidance

**Branch**: `chatgpt/197-shared-graphics-toolkit-guidance` | **Date**: 2026-11-20 | **Spec**: `specs/197-shared-graphics-toolkit-guidance/spec.md`

**Input**: Feature specification from `/specs/197-shared-graphics-toolkit-guidance/spec.md`

## Summary

Add one concise 🟢 shared section to `AGENTS.md` that directs ChatGPT and Freebuff to the existing graphics toolkit, `useCreativeExperience`, the visual registry/runtime, the centralized Resource-Readiness Hub and the development Creative Workbench. Add a focused regression assertion and update the active Spec Kit pointer and Memory Bank task records.

## Technical Context

**Language/Version**: Markdown and JavaScript test source; repository runtime is Node.js 26.x.

**Primary Dependencies**: Existing repository files only; no new dependencies.

**Storage**: Repository documentation and governance files only.

**Testing**: Existing Vitest governance test `__tests__/agent-governance-single-source.test.js`; protected-file and PR-scope GitHub workflows.

**Target Platform**: GitHub repository; no application deployment.

**Project Type**: Next.js repository governance/documentation.

**Performance Goals**: No production runtime or performance change.

**Constraints**: Preserve `AGENTS.md`'s classification hierarchy, exact current governance, protected-file requirements, relevant Spec Kit records and the 495 MiB production-build limit. Do not edit `.docs/`, change application code, add dependencies, or alter visual behaviour.

**Scale/Scope**: One shared guidance section, one regression assertion, one Spec Kit feature record, the active feature pointer and two Memory Bank records.

## Constitution Check

- **Single source of truth**: PASS — the new durable rule is placed in `AGENTS.md`; other records describe the task only.
- **Verify before acting**: PASS — current GitHub paths, the manifest, toolkit implementation and applicable workflows/checkers were inspected.
- **Protect core systems**: PASS — no application, data, payment, authentication, deployment or secrets configuration is changed. The governance PR remains subject to explicit owner authorization.
- **Resource conservation**: PASS — no dependencies, services, assets or build inputs are added.
- **Development workflow**: PASS — specify, plan and tasks records are maintained in the repository's current Spec Kit structure; implementation is documentation plus a focused governance assertion.
- **QA requirements**: PASS — the protected-file classifier, its regression suite, PR-scope approval rules and advisory checker suite were inspected before implementation.
- **Preservation**: PASS — no visitor-facing artwork, animation, sound, timing, layout or application behaviour changes.

## Project Structure

### Documentation (this feature)

```text
specs/197-shared-graphics-toolkit-guidance/
├── spec.md
├── plan.md
└── tasks.md
```

### Source and governance files

- `AGENTS.md` — shared graphics-toolkit requirement.
- `__tests__/agent-governance-single-source.test.js` — regression assertion.
- `.specify/feature.json` — active feature pointer.
- `memory-bank/activeContext.md` and `memory-bank/progress.md` — task-state and milestone records.

**Structure Decision**: Use the existing single-repository Spec Kit layout. No application source, package, asset, API or infrastructure files are required.

## Phase 0 — Research

Current GitHub source inspection resolved the relevant architecture and paths. No additional external research or implementation unknowns remain.

## Phase 1 — Design

No data model or API contract is involved. A separate quickstart is unnecessary; the relevant repository checks and the exact environment limitation are recorded in the task and PR verification report.

## Verification and Limitations

The ChatGPT startup preflight was run in diagnostics-only mode. It reports Node.js 22.16.0 where the repository requires Node.js 26.x, and no installed pnpm CLI where the repository pins 10.30.3. ChatGPT's repository-specific startup instructions prohibit running repository scripts. Therefore, local tests, builds and repository verification scripts are not run in this environment; they must not be represented as passed. The required regression and protected-file checks remain available to the authorized GitHub workflows.
