# Implementation Plan: Stale Runtime-Boundary Context Correction

**Feature**: Spec 223
**Date**: 2026-11-26

## Summary

Make one targeted Memory Bank correction using the exact boundary established by the merged ChatGPT-only `AGENTS.md` §6 and preserve all unrelated Spec 220 content.

## Technical Context

- **Language/Version**: Markdown and JSON; no project runtime required for the content edit.
- **Primary Dependencies**: None.
- **Storage**: Git-tracked repository documentation.
- **Testing**: Source-level text assertions and GitHub diff review; repository CI supplies the PR checker evidence.
- **Target Platform**: GitHub repository.
- **Project Type**: Documentation-only correction.
- **Constraints**: No governance-file, application, dependency, workflow, deployment or production changes.

## Constitution Check

- Scope is limited to the stale sentence and required Spec Kit/Memory Bank records.
- No protected file is changed.
- No application runtime, build or browser behaviour is affected.
- Preserve all other Spec 220 context.

## Implementation

1. Replace the single stale Verification environment sentence with the corrected Node.js/Playwright boundary and compatible-script permission.
2. Add a concise current Active Context entry and Progress record.
3. Point `.specify/feature.json` to Spec 223 and add its specification, plan and task list.

## Verification

- Confirm the old sentence is absent and the replacement is present in the live GitHub file.
- Compare the surrounding Spec 220 block to ensure no unrelated content changed.
- Review the complete PR diff and current-head seven-category report.
- Do not run Node.js 26-dependent project operations under the available Node.js 22 runtime; PR-triggered CI remains the source for automated checker results.
