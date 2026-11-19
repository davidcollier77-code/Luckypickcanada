# Implementation Plan: Three.js short documentation source

**Branch**: `194-threejs-llms-source` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

## Summary
Add the upstream Three.js concise LLM documentation as a distinct URL source, preserving the existing full reference. Follow the updater's naming and canonical Creation/Polishing symlink conventions.

## Technical Context
**Language/Version**: JSON and Markdown; repository runtime Node.js 26 / pnpm 10.30.3 (not available in this ChatGPT environment).
**Primary Dependencies**: None added.
**Storage**: Git-tracked documentation and manifest.
**Testing**: `scripts/test-refresh-docs.js` and repository documentation integrity checks; execution unavailable here.
**Target Platform**: GitHub repository documentation.
**Project Type**: Documentation maintenance.
**Performance Goals**: No application runtime impact.
**Constraints**: Preserve full Three.js snapshot; no updater or deployment changes; .docs update explicitly authorized by owner; do not claim unrun checks.
**Scale/Scope**: One source, two routed snapshots, manifest, two Memory Bank records and Spec Kit artifacts.

## Constitution Check
- Scope is documentation-only; no protected application, payment, database, hosting or secrets changes.
- Owner explicitly authorized the .docs library change.
- QA checker definitions were inspected: checker_suite treats documentation paths/suffixes as documentation and excludes them from code/test/performance heuristics; automatic PR checkers remain unchanged.
- Local execution is unavailable because Node 26 and pnpm 10.30.3 are absent. Owner authorized documenting this capability limitation; no checks are represented as passed.

## Project Structure
```text
.docs/manifest.json
.docs/creation/_websites_threejs_llms_txt.md
.docs/polishing/_websites_threejs_llms_txt.md -> ../creation/_websites_threejs_llms_txt.md
memory-bank/activeContext.md
memory-bank/progress.md
specs/194-threejs-llms-source/{spec.md,plan.md,research.md,tasks.md}
```

## Design
- New ID: `/websites/threejs_llms_txt`.
- Upstream: `https://threejs.org/docs/llms.txt`.
- Existing ID `/websites/threejs` remains mapped to `https://threejs.org/docs/llms-full.txt`.
- Updater filename convention: replace non-alphanumeric/underscore/hyphen characters in ID with underscores and append `.md`.
- No `githubShas` entry: source is an external URL, not a GitHub source.
- Preserve existing ordering; append new ID to Creation, Polishing and inventory.

## Verification Plan
1. Parse manifest and confirm inventory equals routed-ID union, unique count 66, and both source records.
2. Confirm canonical Creation file content matches the 144-line upstream short document.
3. Confirm Polishing entry is mode 120000 and target is `../creation/_websites_threejs_llms_txt.md`.
4. Confirm existing full snapshot blob and source URL remain unchanged.
5. Run updater unit tests, QA checks and required repository verification only in an authorized Node 26/pnpm environment; this agent cannot execute them.
