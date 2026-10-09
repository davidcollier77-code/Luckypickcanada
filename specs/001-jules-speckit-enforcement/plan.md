# Implementation Plan: Reliable Jules Spec Kit Enforcement

**Branch**: `001-jules-speckit-enforcement` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-jules-speckit-enforcement/spec.md`

## Summary

Reconcile the contradictory governance wording and create a fail-closed task-local check. Make the four command definition files explicit in `AGENTS.md`, explain file-driven execution when Jules cannot natively dispatch a slash command, align the Spec Kit constitution, and validate `.specify/feature.json` plus the required non-empty feature artifacts before task verification continues.

## Technical Context

**Language/Version**: Bash and Node.js already used by the repository

**Primary Dependencies**: Existing Node.js runtime; no new package dependencies

**Storage**: Markdown governance/specification files and ignored per-checkout state at `.specify/feature.json`

**Testing**: Bash syntax checks and hermetic temporary-directory tests for the governance verifier

**Target Platform**: Jules task VM and GitHub Actions

**Project Type**: Repository governance and verification scripts

**Performance Goals**: The governance gate should complete in under one second in a normal checkout.

**Constraints**: Preserve existing build/test checks, the 495 MB hard build limit, the automated Spec Kit updater, and all application behavior. Do not use an unrestricted bypass flag.

## Constitution Check

- **Single source of truth**: PASS — `AGENTS.md` remains canonical; the Spec Kit constitution is aligned to it.
- **Verify before acting**: PASS — the change is based on the observed PR and current repository configuration.
- **Implementation sequence**: PASS — Spec Kit artifacts are created for this governance change and regression tests are included.
- **Protected systems**: PASS — no application runtime, payment, authentication, database, deployment, or secrets are changed. The owner authorized the governance correction.
- **Resource conservation**: PASS — no new dependencies or paid services are introduced.

## Project Structure

```text
AGENTS.md
.specify/
└── memory/constitution.md
jules-verify.sh
scripts/
├── verify-speckit-task.sh
└── test-verify-speckit-task.sh
specs/001-jules-speckit-enforcement/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
└── checklists/requirements.md
```

**Structure Decision**: Keep governance policy in `AGENTS.md`, maintain the Spec Kit constitution as a consistent subordinate principle document, enforce per-task artifacts in a focused shell helper invoked by `jules-verify.sh`, and cover it with dependency-free regression tests. Exempt only the named automated Spec Kit updater workflow from the task-local artifact check because that CI job is not a Jules task.

## Risks and Mitigations

- **Risk**: Jules may not expose the generic command files as native slash commands in every session.  
  **Mitigation**: `AGENTS.md` directs Jules to carry out each exact Markdown command procedure directly when native dispatch is unavailable and requires honest reporting of that method.
- **Risk**: Machine-local `.specify/feature.json` is absent in clean non-task contexts.  
  **Mitigation**: The task verifier fails closed during Jules work; the existing `Update Spec Kit` automation is explicitly recognized as an external maintenance workflow.
- **Risk**: Invalid feature paths could read outside the checkout.  
  **Mitigation**: Resolve paths and reject paths that escape the repository root.
