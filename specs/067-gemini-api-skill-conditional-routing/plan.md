# Implementation Plan: Conditional Gemini API Developer Skill Routing

**Branch**: `freebuff/gemini-api-skill-conditional-routing-20261101` | **Date**: 2026-11-01 | **Spec**: `specs/067-gemini-api-skill-conditional-routing/spec.md`

## Summary

Remove the universal Gemini API Developer Skill requirement from repository governance, task-group instructions, and the Gemini reviewer. Retain the canonical specialist document in Creation and route it conditionally through Creation, Troubleshooting, and Deep-dive only.

## Technical Context

**Language/Version**: Markdown, JSON, Node.js CommonJS, and TypeScript test sources.
**Primary Dependencies**: Existing repository dependencies only; no new dependency.
**Testing**: Focused Vitest suites `__tests__/gemini-reviewer-context.test.ts` and `__tests__/gemini-reviewer-workflow.test.ts`; `./freebuff-verify.sh`; GitHub Actions PR checks.
**Constraints**: No Gemini API behavior/model change, no new standing skill document, no application functionality changes, no PR merge.

## Design

- Make `AGENTS.md` the source of truth for a conditional API-specific reference rather than a task-wide requirement.
- Align `.freebuff/freebuff.md` and all eight specialist group files with that policy.
- Keep the skill manifest source and inventory entry, but route the skill only to Creation, Troubleshooting, and Deep-dive; remove unrelated group symlinks.
- Determine relevance in the Gemini reviewer using changed-file patches and API-specific code/dependency signals. Ignore titles/descriptions, documentation-only mentions, tests, and routine reviewer/autofix infrastructure edits.
- Load the skill only after changed-file patches are available. For unrelated PRs, continue without it. For relevant API changes, fail closed with an explicit coverage notice if it cannot be loaded.
- Pass the document to targeted-fix suggestions only when the changed code is API-relevant.
- Update focused tests to prove both positive and negative routing cases.

## Governance

The task modifies repository governance and Gemini reviewer automation within the user's explicit authorization. `.docs/` changes are limited to routing links and manifest alignment. No production API, secrets, workflow permissions, or deployment behavior is changed.
