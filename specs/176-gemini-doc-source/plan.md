# Implementation Plan: Gemini API Documentation Source Correction

**Branch**: `auto/docs-refresh` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Owner-authorized correction of the Gemini API documentation URL in the open documentation refresh PR.

## Summary

Replace the failed Gemini source URL with Google's current official full documentation index at `https://aistudio.google.com/llms.txt`. Keep the edit limited to one source URL value in `.docs/manifest.json`, update the active Spec Kit feature pointer, and document the work in a new, concise Spec Kit feature folder.

## Technical Context

**Language/Version**: JSON and Markdown; repository runtime is Node.js 26.

**Primary Dependencies**: None added.

**Storage**: Existing `.docs/manifest.json`; existing documentation snapshots remain untouched.

**Testing**: Parse the manifest as JSON and assert the Gemini entry's type and exact URL. Confirm source endpoint content through the official Google documentation index. The normal scheduled documentation refresh is the required post-merge end-to-end check.

**Target Platform**: Existing GitHub documentation-refresh workflow.

**Project Type**: Documentation source registry.

**Performance Goals**: No additional runtime work or dependency.

**Constraints**: Do not change updater code or safeguards, generated snapshots, package manifests, workflows, production configuration, or unrelated source entries. Do not merge the PR.

**Scale/Scope**: One source URL, active feature pointer, and task-scoped Spec Kit records.

## Constitution Check

- **Single source of truth**: PASS — repository manifest remains the source registry.
- **Verify before acting**: PASS — old URL failure and official new documentation index were checked.
- **Implementation sequence**: PASS — specify, plan, tasks, and implementation records are completed directly from the repository's command definitions; setup shell scripts were not executed in this documentation task. Current `AGENTS.md` §6 permits compatible repository scripts when their prerequisites, runtime, permissions and side effects are acceptable; Node-26-dependent project operations remain subject to the Node.js 26.x requirement.
- **Protected systems**: PASS — no protected application, deployment, payment, database, secret, or workflow files are changed.
- **Resource conservation**: PASS — no new dependency, production code, infrastructure, or additional service.
- **Documentation boundary**: PASS — only the approved manifest source value is changed; existing generated snapshots are left for the normal updater.

## Phase 0: Research

Completed. The old source failed due to a cross-origin redirect. Google's current official AI Studio documentation index was verified at `https://aistudio.google.com/llms.txt`; it identifies itself as the full Gemini API documentation index and documents Markdown page endpoints.

## Phase 1: Implementation

1. Replace the single Gemini URL value in `.docs/manifest.json`.
2. Point `.specify/feature.json` to this task's feature folder.
3. Add the concise Spec Kit specification, research, plan, tasks, and requirements checklist.
4. Verify JSON structure, exact URL, old URL absence, changed-file scope, and final PR handoff.
5. Leave the legacy snapshot normalization to the normal refresh after merge.

## Project Structure

```text
.docs/manifest.json
.specify/feature.json
specs/176-gemini-doc-source/
├── spec.md
├── research.md
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md
```

**Structure Decision**: No application code, updater behavior, external contract, data model, package, or deployment structure changes.

## Complexity Tracking

No constitution violations or additional dependencies.
