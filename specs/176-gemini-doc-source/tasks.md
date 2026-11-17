# Tasks: Gemini API Documentation Source Correction

**Input**: Design documents from `specs/176-gemini-doc-source/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`

## Phase 1: Preparation

- [X] T001 Read repository governance, PR submission requirements, current manifest, applicable Gemini documentation reference, and documentation refresh workflow.
- [X] T002 Verify the old source failure and identify Google's official full Markdown documentation index.

## Phase 2: User Story 1 — Refresh Official Gemini API Documentation (P1)

**Goal**: Configure the updater to use Google's current official Gemini API documentation index.

**Independent Test**: After merge, run the normal documentation refresh and confirm the Gemini snapshot is Markdown and the Gemini integrity issue is absent.

- [X] T003 Update only the Gemini source URL in `.docs/manifest.json` to `https://aistudio.google.com/llms.txt`.
- [X] T004 Update the active Spec Kit feature pointer in `.specify/feature.json` and record specification, research, plan, task, and checklist artifacts under `specs/176-gemini-doc-source/`.
- [X] T005 Parse the updated manifest and verify the exact Gemini source entry, URL, and absence of the old URL.

## Phase 3: Handoff and Deferred Verification

- [X] T006 Review the complete PR diff against the one-source correction scope and the applicable PR-scope checker requirements.
- [X] T007 Prepare the updated PR handoff with exact changed paths, source evidence, and verification limitations.
- [ ] T008 After the owner merges the PR, allow the next normal documentation refresh to replace the legacy Gemini HTML snapshot and verify that the Gemini download and critical integrity checks pass. **PENDING — owner merge and subsequent workflow run required.**
- [ ] T009 Run the updater's Node.js 26 unit and end-to-end checks in an authorized environment. **NOT RUN in ChatGPT — repository shell-script execution is prohibited and local Node.js is 22 rather than required 26.**

## Dependencies & Execution Order

Preparation and source verification precede the single manifest edit. JSON validation and diff review precede PR handoff. Post-merge refresh is dependent on owner merge and the scheduled workflow.

## Parallel Opportunities

No parallel implementation work is warranted for this one-value source registry correction.

## Implementation Strategy

Deliver the source URL correction in the existing PR. The post-merge scheduled refresh is the independent end-to-end confirmation; do not merge or trigger the workflow from this task.
