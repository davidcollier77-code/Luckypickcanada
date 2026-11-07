# Implementation Plan: Memory Bank Lifecycle and Cleanup

**Branch**: `docs/memory-bank-maintenance-20261106` | **Date**: 2026-11-06 | **Spec**: `spec.md`

## Summary
Clarify a lightweight Memory Bank lifecycle in `AGENTS.md`, keep the Freebuff entrypoint aligned, move permanent Lucky Pick Canada facts into `projectBrief.md`, replace the oversized task diary in `activeContext.md` with current open work, and consolidate completed history in `progress.md`.

## Technical Context
- **Format**: Markdown and one Spec Kit JSON pointer; no application code or dependencies.
- **Repository**: `davidcollier77-code/Luckypickcanada`.
- **Source of truth**: Current repository files, live PR metadata/reviews, and owner-approved product facts. Existing Memory Bank entries are context and must be reconciled against current state.
- **Verification**: Inspect the complete diff, validate Markdown structure and internal references, check for stale PR statuses and secret-like values, then run `./freebuff-verify.sh` and inspect PR-head CI when a repository worktree is available.

## Design Decisions
1. `projectBrief.md` holds permanent project facts and design/product constraints, not task history.
2. `activeContext.md` holds only open/unresolved work and must always state the current status, including when no work is active.
3. `progress.md` records meaningful completed milestones from roughly the latest 30 days. It is not a per-PR diary.
4. Retain older material only when it remains important to architecture, product behavior, decisions, constraints, or lessons.
5. No arbitrary size cap. Concision comes from relevance and consolidation, not deleting useful knowledge.
6. `AGENTS.md` is authoritative; the Freebuff entrypoint only reminds the agent to follow it.

## Scope and Files
- `AGENTS.md` — a short lifecycle rule and a note to consult `progress.md` when relevant.
- `.freebuff/freebuff.md` — one concise maintenance reminder.
- `memory-bank/projectBrief.md` — stable project, architecture, product, and visual facts.
- `memory-bank/activeContext.md` — current open work and this maintenance branch only.
- `memory-bank/progress.md` — consolidated completed milestones.
- `.specify/feature.json` and `specs/104-memory-bank-maintenance/` — task pointer and Spec Kit artifacts.

## Verification Limits
This change is being authored through the GitHub repository API without a local checkout or shell. Repository commands cannot be executed from this session; report them as NOT RUN and use PR-head CI for the executable repository checks. Do not claim a build, test, or repository-gate pass.
