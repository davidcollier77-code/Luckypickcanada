# Implementation Plan: PR Submission Governance Consolidation

**Branch**: docs/pr-submission-governance-20261111 | **Date**: 2026-11-11 | **Spec**: spec.md

**Input**: Feature specification from specs/136-pr-submission-governance/spec.md

## Summary

Keep AGENTS.md as the sole repository authority while moving detailed PR description, submission, branch validation, and handoff instructions into root PR_SUBMISSION.md. Retain Gatekeeper expectations in AGENTS.md and require pre-work inspection of actual workflows and referenced scripts. Remove the obsolete root PR_SUMMARY.md, whose procedural role is replaced by PR_SUBMISSION.md.

## Technical Context

**Language/Version**: Markdown and JSON documentation only; no application runtime changes.

**Primary Dependencies**: Existing repository governance and Spec Kit files.

**Storage**: N/A.

**Testing**: Static document assertions, AGENTS.md line count, existing governance tests, and ./freebuff-verify.sh when a repository shell is available.

**Target Platform**: GitHub repository documentation.

**Project Type**: Governance/documentation-only change.

**Performance Goals**: AGENTS.md at or below 300 lines; avoid duplicated procedural content in the routinely loaded governance file.

**Constraints**: No application, workflow, integration, dependency, secret, deployment, or .docs changes. Remove obsolete root PR_SUMMARY.md. Leave PRs open and unmerged.

**Scale/Scope**: AGENTS.md, new PR_SUBMISSION.md, Spec Kit task artifacts, active feature pointer, and current task context; delete obsolete root PR_SUMMARY.md.

## Constitution Check

- **Single source of truth**: PASS — AGENTS.md remains authoritative; PR_SUBMISSION.md is a referenced procedure, not another general governance entrypoint.
- **Verify before acting**: PASS — current governance, Gatekeeper summaries, Spec Kit definitions/templates, existing governance test, and the prior PR report were inspected.
- **Implementation sequence**: PASS — specify, plan, tasks and implement artifacts are represented in this feature directory.
- **Protect core systems**: PASS — no application, security, payment, database, integration, deployment or secret change.
- **Resource conservation**: PASS — no dependency or service changes; AGENTS.md is reduced.

## Project Structure

AGENTS.md  
PR_SUBMISSION.md  
.specify/feature.json  
specs/136-pr-submission-governance/{spec.md,plan.md,tasks.md,checklists/requirements.md}  
memory-bank/activeContext.md  
PR_SUMMARY.md (deleted)

**Structure Decision**: Keep concise governance and Gatekeeper readiness in AGENTS.md. Put PR-specific instructions in PR_SUBMISSION.md. Remove the obsolete root PR_SUMMARY.md; retain unrelated historical records.

## Implementation Design

1. Replace the long PR reporting/submission content in AGENTS.md with concise verification rules and a PR_SUBMISSION.md handoff reference.
2. Keep the Gatekeeper summary and add an explicit requirement to inspect applicable workflow definitions and scripts before implementation.
3. Put the complete PR body requirements, pre-submission gate, branch/head/base validation, single non-draft submission, and hard stop in PR_SUBMISSION.md.
4. Update the active Spec Kit feature pointer and active task context.
5. Delete obsolete root PR_SUMMARY.md and update this feature's requirements, plan, and tasks to describe that removal accurately.

## Verification Plan

- Confirm AGENTS.md contains 300 lines or fewer.
- Confirm the Gatekeeper preflight and PR_SUBMISSION.md handoff reference remain.
- Confirm duplicate PR summary/submission/branch-recovery instructions are removed from AGENTS.md.
- Confirm PR_SUBMISSION.md includes What Changed, Files Changed, Verification, Remaining Work, exact head/base, non-draft creation, open/unmerged delivery, and hard stop.
- Confirm root PR_SUMMARY.md is absent and the deletion is included in the branch diff.
- Run existing governance tests and ./freebuff-verify.sh in a repository shell before PR submission. This connected session has GitHub API access but no checked-out repository shell; those checks remain an outstanding verification limitation and must not be represented as passed.

## Complexity Tracking

No constitution violations or added implementation complexity.
