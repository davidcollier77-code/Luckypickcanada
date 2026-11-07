# Implementation Plan: Single-Source Freebuff Governance

**Branch**: freebuff/agent-governance-single-source-20261107 | **Date**: 2026-11-07 | **Spec**: spec.md

**Input**: Owner-authorized consolidation request in the conversation.

## Summary

Make AGENTS.md the sole general repository-governance entrypoint for every coding agent, including Freebuff. Preserve the distinct MCP connection/initialization clarification from .freebuff/freebuff.md, remove the redundant entrypoint, keep specialist task-group instructions and Spec Kit commands, and align the saved Freebuff Master Work Request with current PR-summary governance.

## Technical Context

- **Language/Version**: Markdown and JavaScript (existing Vitest setup).
- **Primary Dependencies**: No new dependencies.
- **Storage**: Repository instruction files, Spec Kit artifacts, Memory Bank, and the saved Master Work Request in ChatGPT Library.
- **Testing**: Focused Vitest regression test, repository verification gate, and PR-head GitHub Actions.
- **Target Platform**: GitHub repository and ChatGPT Library.
- **Project Type**: Repository governance/documentation.
- **Performance Goals**: No application runtime or build-size change beyond required repository verification.
- **Constraints**: Preserve all eight .freebuff/<group>.md files, .freebuff/cmds, freebuff-verify.sh, Spec Kit integration settings, historical task records, and unrelated PRs.

## Constitution Check

- **Single source of truth**: PASS — AGENTS.md becomes the only general governance source. Specialist task-group files remain subordinate and scoped.
- **Explicit authorization**: PASS — the repository owner expressly authorized changes to AGENTS.md and the Master Work Request.
- **Scope protection**: PASS — no application, dependency, deployment, payment, database, authentication, or production integration changes.
- **Memory Bank**: PASS — update the current task pointer and record the governance change without rewriting historical entries.
- **PR ownership**: PASS — create/update a reviewable PR and leave it open and unmerged.

## Research Findings

1. AGENTS.md already contains the repository workflow, Spec Kit sequence, verification requirements, scope boundaries, build limit, PR ownership, and canonical PR-summary rules.
2. .freebuff/freebuff.md repeats most of those rules. Its distinct MCP clarification was not present in AGENTS.md and will be preserved there.
3. The shared Google Engineering Practices reference is already routed through .docs/manifest.json and described as optional in the specialist task-group instructions; that routing remains unchanged.
4. The repository has eight specialist task-group files and a separate .freebuff/cmds command directory. They are not the redundant general entrypoint and will remain.
5. The Constitution already establishes AGENTS.md as the canonical authority and says specialist instructions must not override or duplicate it.
6. The only open PR at baseline is unrelated PR #1750; no existing open PR covers this consolidation.

## Design

### Governance changes

- State in AGENTS.md that it is the single authoritative workflow and safety policy for every coding agent, including Freebuff.
- Remove the initialization instruction to read .freebuff/freebuff.md; keep the required Memory Bank, group-selection, manifest, and specialist-file instructions.
- Preserve the distinct MCP clarification in the approvals section.
- Delete only .freebuff/freebuff.md; do not remove the .freebuff directory, specialist group files, or command definitions.

### Saved Master Work Request

- Remove the instruction to read .freebuff/freebuff.md.
- Retain the instruction to follow applicable .freebuff/<group>.md files.
- Replace the separate PR-report and per-document USED/USEFUL/version matrix requirement with the single concise PR-body summary required by AGENTS.md.

### Regression coverage

Add a focused Vitest test proving that the general entrypoint is absent, AGENTS.md is authoritative, the MCP clarification survives, and all eight specialist task-group files remain available.

## Files and Scope

- Update: AGENTS.md
- Delete: .freebuff/freebuff.md
- Add: __tests__/agent-governance-single-source.test.js
- Update: .specify/feature.json, memory-bank/activeContext.md, memory-bank/progress.md
- Add: specs/104-agent-governance-single-source/{spec.md,plan.md,tasks.md,checklists/requirements.md}
- Update outside repository: saved Library file Freebuff_Master_Work_Request_1.md

## Verification Plan

1. Run the focused governance regression test.
2. Run ./freebuff-verify.sh and all checks required by the selected deep-dive and testing groups.
3. Confirm all eight specialist files and Spec Kit commands remain present and unchanged.
4. Search active repository instructions and configuration for references requiring the deleted general entrypoint; retain historical references as historical records.
5. Review the complete PR diff and verify the PR body is the one canonical summary.
6. Record unavailable local execution separately from PR-head CI results. Do not claim a check passed unless its result is observed.

## Risks and Mitigations

- **Risk**: Deleting the entrypoint may remove an instruction not already in AGENTS.md.
  - **Mitigation**: Compare both complete files; transfer the MCP clarification; confirm shared reference guidance remains in specialist instructions.
- **Risk**: Old task records may appear to reference the deleted file.
  - **Mitigation**: Preserve historical artifacts and distinguish them from active configuration/instructions.
- **Risk**: The saved Master Work Request may reintroduce obsolete or contradictory rules.
  - **Mitigation**: Update the Library template and verify its full contents after upload.


## Follow-up Plan — Governance Regression Test Review Finding (2026-11-07)

- **Trigger**: Pullfrog review `5810741955` of merged PR #1751 reported that `beforeAll` was used without being imported from Vitest. The merged test also retained the module-scope file-read issue originally identified by Amazon Q and Graphite.
- **Selected group**: `testing` only; the work is confined to a Vitest regression test and its existing Spec Kit records.
- **Decision**: Do not add a lifecycle hook. Define a small `readAgents()` helper that performs the synchronous read only when invoked from the two test callbacks that need the file. This avoids both module-import-time I/O and an unnecessary hook import.
- **Scope**: Update `__tests__/agent-governance-single-source.test.js`, this existing feature's `spec.md`, `plan.md`, `tasks.md`, and the Memory Bank task/progress records. No application, governance, dependency, workflow, payment, database, authentication, deployment, or documentation-library changes.
- **Research**: No additional external research is material; the defect is directly visible in the merged source and Vitest already exists in the project.
- **Verification**: Focused governance test, full Vitest suite, standalone TypeScript, and `./freebuff-verify.sh`. The pull-request Visual QA workflow runs these repository checks on the submitted head.
- **Delivery**: Publish one follow-up PR against `main`; leave it open and unmerged. Record each check's observed result in the PR body.
