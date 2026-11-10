# Implementation Plan: Specialist Skill Routing

**Branch**: `docs/agent-skill-routing-20261109` | **Date**: 2026-11-09 | **Spec**: spec.md

**Input**: Owner-authorized feature specification in `specs/125-agent-skill-routing/spec.md`.

## Summary

Update the existing authoritative `AGENTS.md` skill-discovery guidance with concise descriptions and usage triggers for all 14 selected skills. Add a clear precedence and conflict-resolution rule that directs the agent to investigate competing instructions, reconcile them against repository governance and actual project state, choose the safest supported approach, and explain the decision. Preserve all existing project workflows and constraints.

## Technical Context

**Language/Version**: Markdown and JSON only.

**Primary Dependencies**: Existing `AGENTS.md`, the 14 researched skill definitions, current repository configuration and Spec Kit templates/command definitions.

**Storage**: N/A; no application data or database changes.

**Testing**: Exact skill-name/field-count inspection, line count, final diff review, repository verification and PR CI. This session has GitHub API access but no repository shell, so shell-based checks cannot be claimed locally.

**Target Platform**: GitHub repository governance documentation.

**Project Type**: Documentation-only repository instruction update.

**Performance Goals**: No application runtime or build output changes.

**Constraints**: Preserve AGENTS.md as the single authoritative governance source. Retain the existing Playwright-first/Browserless-fallback policy, Spec Kit sequence, Cloudflare/Workers boundaries, existing Neon database scope, PR gatekeepers, updater rules and approval requirements. Do not change application code, integrations, workflow files, dependencies, secrets, database or deployment configuration.

**Scale/Scope**: `AGENTS.md`, `.specify/feature.json`, this feature's Spec Kit artifacts, and the two required Memory Bank records.

## Constitution Check

- **Single source of truth**: PASS — add routing guidance to the existing AGENTS.md; create no secondary governance file.
- **Verify before acting**: PASS — inspected current main, AGENTS.md, project Memory Bank, .docs manifest, Spec Kit constitution/templates/commands and related prior skill/governance work.
- **Implementation sequence**: PARTIAL — use the required Specify → Plan → Tasks → Implement order and record artifacts. The GitHub API-only environment cannot execute repository setup scripts or local slash commands; this limitation must be reported accurately.
- **Protect core systems**: PASS — no application, production database, hosting, secrets or workflow configuration changes.
- **Resource conservation**: PASS — documentation-only; no dependencies or build changes.

## Phase 0 — Research

- Confirmed current `main` HEAD: `bb417f7bab9c287c2fed96ac1f6cb3296945bcc8`.
- Read the authoritative AGENTS.md and its existing skill-discovery instruction.
- Read `memory-bank/projectBrief.md` and `memory-bank/activeContext.md`.
- Inspected `.docs/manifest.json`; no individual library document materially applied, so none was opened or changed.
- Confirmed no task group clearly applies: this is a governance/documentation-only task, which AGENTS.md explicitly permits handling without forcing a task group.
- Reviewed the existing skill/governance Spec Kit work (features 087, 096, 104 and 124) to avoid duplicating or contradicting prior decisions.
- Read the Spec Kit constitution and specify/plan/tasks/implement command definitions. No `.specify/extensions.yml` exists on main, so no extension hooks were registered.
- Used the Web App QA & Release Copilot Get Started workflow to classify the task. This is not a release candidate or application change, so an end-to-end release audit is not applicable.

## Phase 1 — Design

### Routing structure

- Keep the 14 skills in one section within the existing AGENTS.md.
- Give every skill exactly two fields: purpose and trigger.
- Group skills by design/interface, Cloudflare/backend, engineering/debugging/security, and automation/performance.
- Add one conflict-resolution rule: investigate purpose, scope, assumptions, versions and actual project state; reconcile against governance and authoritative docs; choose the safest least disruptive supported approach and document why; escalate only when irreconcilable or requiring approval.
- Keep the specialist list subordinate to repository governance and actual available integrations.

### Files changed

- `AGENTS.md`: update skill discovery and add specialist skill routing.
- `.specify/feature.json`: register feature 125.
- `specs/125-agent-skill-routing/`: specification, plan and task artifacts.
- `memory-bank/activeContext.md`: identify the active task and environment limitations.
- `memory-bank/progress.md`: append the completed implementation milestone and verification status.
- `__tests__/crystal-ball-daily-usage.test.js`: stabilize two date-sensitive unit tests with Vitest fake time; no production runtime code changes.

### Source of truth

The repository's actual configuration and workflow files remain authoritative for tool availability and gate behavior. The skill-routing guide supplements AGENTS.md; it does not create a parallel policy or override existing project instructions.

## Verification Plan

- Verify the 14 requested names appear exactly once in the routing section.
- Verify each entry contains one "What it's used for" field and one "When to use it" field.
- Confirm the conflict-resolution rule directs investigation and a reasoned solution.
- Confirm the AGENTS.md line count remains at or below approximately 285.
- Review the complete PR diff and ensure no unrelated files changed.
- Run `./freebuff-verify.sh`, `git diff --check` and applicable checks in a shell-capable CI runner. These cannot be executed through the current GitHub API-only session.
- No browser tests or production build are needed for a documentation-only change if the Visual QA classifier positively classifies it as documentation-only; other required workflow checks still apply.


## CI Verification Follow-up — 2026-11-09

The initial PR #1795 Visual QA run (workflow 42732428053) reached the targeted unit-test step and failed two assertions in `__tests__/crystal-ball-daily-usage.test.js`. Both tests fixed the fixture date at November 9, while `writeDailyUsage()` used the CI runner's current date (November 10 UTC). The tests now freeze Vitest system time to the fixture date and restore real timers in `afterEach`. Production date and local-midnight behavior remain unchanged.

**Updated verification:** the GitHub API session cannot run repository shell commands, so `./freebuff-verify.sh` and local `git diff --check` remain BLOCKED. The updated PR HEAD must pass its newly triggered targeted unit tests and all applicable CI checks before verified completion. Because a test path changed, the Visual QA classifier and any required browser checks must be allowed to run; do not assume a docs-only skip.
