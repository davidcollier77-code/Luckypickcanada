# Tasks: Restore Valid Documentation Manifest

**Input**: `specs/070-manifest-inventory-repair/spec.md` and `plan.md`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Inspect and specify

- [x] T001 Read `AGENTS.md`, the troubleshooting task-group instructions, Spec Kit workflow commands, and the manifest.
- [x] T002 Reproduce the JSON parsing failure at line 408 on `main`.
- [x] T003 Compare the inventory with the union of group references and identify the duplicate Gemini entry and missing MDN image-types entry.
- [x] T004 Record the exact requirements and scope in `spec.md`.

## Phase 2: Plan and implement

- [x] T005 Document the minimal repair and safeguards in `plan.md`.
- [x] T006 Repair `.docs/manifest.json` without changing group routing, source URLs, snapshots, or updater code.
- [x] T007 Add the Spec Kit feature artifacts and point `.specify/feature.json` to feature 070.

## Phase 3: Verification and reporting

- [x] T008 Parse the corrected manifest and assert exact inventory/group-union equality: 51 unique references, no duplicates, no missing or extra entries.
- [x] T009 Confirm unit tests and TypeScript checks passed on the repair branch's first CI attempt.
- [ ] T010 Re-run Spec Kit governance, Visual QA, OpenNext, and security workflows after adding the feature artifacts.
- [ ] T011 Review the final PR diff and update the PR summary with current-head results; leave PR #1664 open and unmerged.

## Verification Record

- **PASS** — The malformed JSON was reproduced on `main` at line 408.
- **PASS** — Corrected JSON parses successfully.
- **PASS** — The 51 unique inventory entries exactly equal the 51 unique task-group references.
- **PASS** — The first PR #1664 CI attempt completed all unit tests and the standalone TypeScript check successfully.
- **FAIL (repaired input)** — The first Spec Kit gate correctly rejected the PR because the three task artifacts were absent. The missing artifacts have now been added; the gate must be rerun.
- **PENDING** — Current-head Spec Kit governance, Visual QA, OpenNext, security, and trusted-base Gemini reviewer checks.
