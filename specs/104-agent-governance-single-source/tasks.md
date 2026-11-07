# Tasks: Single-Source Freebuff Governance

**Input**: spec.md and plan.md
**Prerequisites**: spec.md, plan.md

## Phase 1: Setup and baseline

- [x] T001 Read AGENTS.md, .freebuff/freebuff.md, the selected deep-dive and testing group instructions, the Memory Bank, Constitution, manifest, and Spec Kit integration configuration.
- [x] T002 Confirm main is at 52f70dd27d475d9d5bc0658e5a28490968e1d471, no open PR covers this task, and PR #1750 is unrelated.
- [x] T003 Compare the complete general entrypoint with AGENTS.md; identify duplicated requirements and preserve the distinct MCP connection/initialization clarification.
- [x] T004 Confirm all eight specialist group files, all current Spec Kit command definitions, and the installed .freebuff/cmds integration are in place.

## Phase 2: Governance implementation

- [x] T005 Update AGENTS.md to name itself as the sole general governance source for every coding agent, remove the redundant entrypoint read, and preserve the MCP clarification.
- [x] T006 Delete only .freebuff/freebuff.md; preserve every specialist group file and Spec Kit command.
- [x] T007 Update .specify/feature.json to point to this feature.
- [x] T008 Add __tests__/agent-governance-single-source.test.js to guard the sole-entrypoint rule and preservation of specialist task-group instructions.
- [ ] T009 Update the saved Library Master Work Request to remove the obsolete entrypoint reference and align reporting with the canonical PR-body summary.

## Phase 3: Memory and verification

- [x] T010 Add the current task and branch to memory-bank/activeContext.md while retaining historical entries.
- [ ] T011 Run the focused governance test and ./freebuff-verify.sh; record actual results and the measured build size.
- [ ] T012 Search and inspect the final active references; confirm only historical records retain old-path mentions.
- [ ] T013 Review the complete final diff, update the canonical PR-body summary with actual verification statuses, and leave the PR open and unmerged.

## Completion Conditions

- The redundant general entrypoint is removed and its unique requirement is preserved in AGENTS.md.
- All specialist instructions and command definitions remain.
- The saved Library Master Work Request is aligned with repository governance.
- Mandatory verification and current PR-head checks are accurately reported.
