# Implementation Plan: Use Prepared Context in Spec Kit Stages

**Branch**: `chore/speckit-use-prepared-context` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/167-speckit-prepared-context/spec.md`

## Summary

Update the four core Spec Kit command definitions so they consume repository preparation and feature context already completed by Freebuff. Remove duplicate setup-script, template-resolver, prerequisite-script and extension-hook execution instructions while preserving each stage's existing purpose and validation responsibilities.

## Technical Context

**Language/Version**: Markdown command definitions

**Primary Dependencies**: Existing Freebuff Spec Kit command files and templates

**Storage**: Repository Markdown files; no application data changes

**Testing**: Diff review, command-definition content review, and automatic PR governance/checker workflows

**Target Platform**: GitHub repository

**Project Type**: Repository workflow documentation

**Performance Goals**: No runtime or application performance impact

**Constraints**: Do not modify `AGENTS.md`, the constitution, templates, scripts, application code, workflows or unrelated files. Do not run repository scripts from ChatGPT.

## Constitution Check

- Follow `AGENTS.md` and `PR_SUBMISSION.md`.
- Preserve the required specify → plan → tasks → implement sequence.
- Preserve mandatory stage content and validation.
- Owner explicitly authorized the four command-definition changes.
- No application, deployment, database, payment, security or build configuration changes are in scope.
- No production build is required for Markdown-only changes; PR-triggered checks remain pending until PR creation.

## Project Structure

### Documentation (this feature)

```text
specs/167-speckit-prepared-context/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
.freebuff/cmds/
├── speckit.specify.md
├── speckit.plan.md
├── speckit.tasks.md
└── speckit.implement.md
```

**Structure Decision**: Modify only the four core command definitions. Add the three required feature artifacts so the repository's fail-closed Spec Kit task gate can verify this task.

## Complexity Tracking

No constitution violations or additional architecture are introduced.
