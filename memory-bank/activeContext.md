# Active Context — QA checker requirements in task planning

- **Updated:** 2026-11-14
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `chore/159-qa-checker-requirements-first`
- **Base:** `main`
- **Spec Kit feature:** `specs/159-qa-checker-requirements-first`

## Current Task

Add a dedicated planning-stage requirement to AGENTS.md so agents understand the repository QA checkers' actual expectations before writing task specifications. Those expectations must shape task scope, constraints, implementation approach, acceptance criteria and verification planning.

## Scope and safeguards

- Dedicated governance-only change; no application code, QA checker implementation, workflow behaviour, production visuals or screenshot baselines are changed.
- Preserve existing QA requirements and protected-file authorization.
- The new section requires inspection of actual checker definitions and relevant tests, not assumptions based on names.
- Local test execution is unavailable in this connected GitHub-only workspace; do not claim tests passed.
