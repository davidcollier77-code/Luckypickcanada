# Implementation Plan: Correct web.dev Images Source Mapping

**Branch**: `docs/177-web-images-source-correction` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Owner-authorized correction of the web.dev Images source URL in `.docs/manifest.json`.

## Summary

Replace the single incorrect web.dev Images course-index URL with the verified canonical lesson URL `https://web.dev/learn/images/cms`. Preserve the existing library identifier, routing, inventory, snapshot, updater implementation, and all other manifest content.

## Technical Context

**Language/Version**: JSON and Markdown; repository runtime is Node.js 26.

**Primary Dependencies**: None added.

**Storage**: Existing `.docs/manifest.json`; generated documentation snapshots remain untouched.

**Testing**: Parse the manifest as JSON, assert the exact source entry, and compare the semantic manifest before and after to prove only that URL changed. Verify the live lesson response. The normal post-merge documentation refresh is the end-to-end check.

**Target Platform**: Existing GitHub documentation-refresh workflow.

**Project Type**: Documentation source registry.

**Performance Goals**: No runtime or production-performance impact.

**Constraints**: Do not edit generated snapshots, updater code, tests, dependencies, workflow schedules, application files, deployment configuration, or unrelated manifest fields. Do not trigger a manual refresh or merge the PR.

**Scale/Scope**: One manifest URL value, the active Spec Kit feature pointer, and concise task-scoped Spec Kit records.

## Constitution Check

- **Single source of truth**: PASS — `.docs/manifest.json` remains the authoritative documentation source registry.
- **Verify before acting**: PASS — the old URL, candidate URLs, live canonical lesson, and existing snapshot were compared.
- **Implementation sequence**: PASS — the specify, plan, tasks, and implementation records are prepared in order. Repository shell scripts were not executed in this documentation-only task. Current `AGENTS.md` §6 permits compatible repository scripts when their prerequisites, runtime, permissions and side effects are acceptable; Node-26-dependent project operations still require Node.js 26.x.
- **Protected systems**: PASS — no protected application, deployment, payment, database, authentication, secret, or workflow file is changed.
- **Resource conservation**: PASS — no dependency, infrastructure, or additional service is introduced.
- **Documentation boundary**: PASS — only the approved manifest source value is changed; the generated `.docs` snapshot is left for the normal updater.

## Phase 0: Research

Completed. The configured `/learn/images` URL is the course index. The live `/learn/images/cms` page returns HTTP 200 with the exact lesson title and corresponding content. The candidate `/learn/images/site-generators` URL returns HTTP 404. See [research.md](research.md).

## Phase 1: Implementation

1. Change only the source URL for `/websites/web_dev_images` in `.docs/manifest.json`.
2. Update `.specify/feature.json` to point to this feature directory.
3. Add the concise specification, research, plan, and tasks records.
4. Verify JSON validity, the exact source value, semantic equality of all other manifest fields, and the complete changed-file list.
5. Leave the generated snapshot to the next normal post-merge documentation refresh.

## Checker and Verification Review

- `scripts/verify-speckit-task.sh`: requires `spec.md`, `plan.md`, and `tasks.md` together in one changed feature directory; those three artifacts are included.
- `.github/workflows/pr-scope-verification.yml` and `.github/scripts/check_qa_pr_scope.py`: compare the PR's exact declared paths and per-file purposes with the actual diff. The PR description will declare every changed path explicitly.
- `.github/workflows/verification-integrity.yml`: audits verification evidence for the current PR head after PR creation.
- `.github/workflows/checker-suite.yml`: runs advisory changed-file test-quality, resource-use, and security-summary reviews. No tests or runtime resource-management code are changed.
- `.github/workflows/protected-files.yml`: this change touches none of its protected paths and does not require protected-file authorization.
- `.github/workflows/refresh-docs.yml`: runs on its configured schedule or manual dispatch, not on pull-request creation. The next normal refresh after merge is the required end-to-end source verification.

Local repository verification scripts were not executed in this task. The startup preflight reported Node.js 22.16.0 rather than the required Node.js 26.x; any verification command requiring the repository runtime must run under Node.js 26.x. This does not create a blanket prohibition on compatible scripts under current `AGENTS.md` §6.

## Project Structure

```text
.docs/manifest.json
.specify/feature.json
specs/177-web-images-source-correction/
├── spec.md
├── research.md
├── plan.md
└── tasks.md
```

**Structure Decision**: This is a documentation-source metadata correction. No application code, external contract, data model, package, test, updater, or deployment structure changes.

## Complexity Tracking

No constitution violations, new dependencies, or additional systems.
