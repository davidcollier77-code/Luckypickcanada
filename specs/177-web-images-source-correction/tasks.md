# Tasks: Correct web.dev Images Source Mapping

**Input**: Design documents from `specs/177-web-images-source-correction/`

**Prerequisites**: `spec.md`, `research.md`, `plan.md`

## Phase 1: Inspect and Specify

- [X] T001 Read current `AGENTS.md`, `.docs/manifest.json`, `PR_SUBMISSION.md`, the task-relevant web.dev snapshot, and the documentation-refresh implementation and workflow.
- [X] T002 Verify that the configured URL is the course index and identify the canonical lesson URL from the live web.dev page.
- [X] T003 Review the applicable Spec Kit governance, PR-scope, verification-integrity, checker-suite, and protected-file requirements.

## Phase 2: Plan and Implement

- [X] T004 Replace only the `/websites/web_dev_images` URL value in `.docs/manifest.json` with `https://web.dev/learn/images/cms`.
- [X] T005 Update `.specify/feature.json` and add the task-scoped specification, research, plan, and task records.

## Phase 3: Verify and Hand Off

- [X] T006 Parse the updated manifest as JSON and assert the exact source type, library identifier, and URL.
- [X] T007 Compare the original and updated manifest structures to confirm that no other value, including `lastUpdated`, changed.
- [X] T008 Review the complete planned diff and confirm that no generated snapshot, updater code, workflow, test, dependency, or application file is changed.
- [ ] T009 Run the updater's Node.js 26 unit and end-to-end checks in an authorized environment. **NOT RUN in ChatGPT — repository shell-script execution is prohibited and the available Node.js version is 22.16.0.**
- [ ] T010 After the owner merges the PR, confirm that the next normal documentation refresh processes the corrected web.dev source successfully. **PENDING — owner merge and subsequent scheduled workflow run required.**

## Dependencies and Execution Order

Source verification precedes the one-value manifest correction. JSON and semantic-diff validation precede PR handoff. The full updater refresh is dependent on owner merge and the next normal workflow run.

## Parallel Opportunities

No parallel implementation work is warranted for this one-source correction.

## Implementation Strategy

Deliver the manifest correction in one regular, non-draft, open PR. Do not merge or manually trigger the documentation refresh. The owner retains the merge decision; the next normal refresh provides the post-merge end-to-end check.
