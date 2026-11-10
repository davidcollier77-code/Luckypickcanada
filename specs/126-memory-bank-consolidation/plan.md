# Implementation Plan: Memory Bank Consolidation

**Branch**: docs/memory-bank-consolidation-20261109 | **Date**: 2026-11-09 | **Spec**: spec.md

**Input**: Owner-authorized specification in specs/126-memory-bank-consolidation/spec.md.

## Summary
Consolidate the four Memory Bank documents into distinct, concise references; remove stale task transcripts and duplicated PR/CI logs; correct the technical note about the 495 MiB production build cap; and change only the AGENTS.md initialization instruction so agents read all four files.

## Technical Context
**Language/Version**: Markdown and JSON.
**Primary Dependencies**: Existing AGENTS.md, four Memory Bank files, GitHub repository state and Spec Kit templates.
**Storage**: Markdown files in the repository; no application data.
**Testing**: Content/line-count assertions, exact AGENTS.md diff inspection, Spec Kit repository gate, git diff --check and PR CI.
**Target Platform**: GitHub repository documentation.
**Project Type**: Documentation/governance context maintenance.
**Performance Goals**: Reduce initialization reading burden while retaining useful context.
**Constraints**: No application, workflow, integration, dependency, secret, database, hosting or deployment changes. Keep .docs read-only. Preserve the 495 MiB build cap.
**Scale/Scope**: Four Memory Bank files, one AGENTS.md initialization line, .specify/feature.json and feature 126 artifacts.

## Constitution Check
- Single source of truth: PASS — AGENTS.md remains authoritative; Memory Bank contains context only.
- Verify before acting: PASS — inspected main, all four Memory Bank files, AGENTS.md, Spec Kit constitution/templates/commands, manifest and open PR state.
- Required sequence: PARTIAL — the specification, plan, task list and implementation were authored in the required order using the repository command definitions and templates. Native Spec Kit setup/resolver scripts cannot run in this GitHub API-only session; full command-level validation remains pending.
- Protect core systems: PASS — no runtime, database, deployment, secrets or integrations changed.
- Resource conservation: PASS — documentation-only; no dependencies or build changes.

## Phase 0 — Research
- Confirmed main HEAD at task start: 8a477908ad9e0586e31a51ba50a5980f1fa429ef.
- Read AGENTS.md and all four Memory Bank files.
- Initial sizes: projectBrief 27 lines; activeContext 2,289 lines; techContext 33 lines; progress 796 lines.
- Confirmed PR #1795 is merged; PRs #1785, #1783 and #1788 are merged. The only open PR found is #1765, an automated DevSkim alert-report update unrelated to this task.
- Read .docs/manifest.json. No individual reference document materially applies to a Memory Bank consolidation, so .docs remains unchanged.
- Read the Spec Kit constitution and specify/plan/tasks/implement command definitions and source templates. No .specify/extensions.yml was found; no extension hooks are registered.
- No task group applies: this is documentation-only and AGENTS.md says not to force an unrelated group.
- Applied the Web App QA & Release Copilot Get Started routing workflow; this is a documentation change, not an application release audit.

## Phase 1 — Design
- Keep projectBrief stable and product-focused.
- Replace activeContext's concatenated task log with a short current-state and current-task record.
- Replace progress's chronological transcript with selected durable milestones.
- Correct techContext's build-size statement and remove stale environment-variable inventories.
- Change only the AGENTS.md initialization sentence to name all four files.

## Project Structure
AGENTS.md
memory-bank/
  projectBrief.md
  activeContext.md
  techContext.md
  progress.md
.specify/feature.json
specs/126-memory-bank-consolidation/
  spec.md
  plan.md
  tasks.md
  checklists/requirements.md

## Verification Plan
- Check the four files' line counts and distinct purposes.
- Check AGENTS.md diff contains only the requested initialization line.
- Check activeContext PR statuses against GitHub and ensure no merged PR remains listed as active.
- Check progress contains dated, significant milestones and no routine task transcript.
- Run ./freebuff-verify.sh, git diff --check and applicable PR CI. This session has no repository shell; shell-based checks must be reported as BLOCKED unless current-head CI supplies evidence.
- Documentation-only classification may skip browser steps only if the repository classifier positively confirms that classification; all other required checks remain applicable.
