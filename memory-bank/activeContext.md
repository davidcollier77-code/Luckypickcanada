# Active Context — Freebuff Playwright Agent Guidance

- **Updated:** 2026-11-15
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `docs/playwright-agentmd-guidance-20261115`
- **Base:** `main` (`e5b86a99`)
- **Spec Kit feature:** `specs/164-playwright-agentmd-guidance`

## Current Task

Add concise Freebuff-only Playwright guidance to AGENTS.md. Document the interactive CLI launcher, Option A (standard Playwright) and Option B (SwiftShader), explicitly exclude ChatGPT from the repository CLI and its setup scripts, and authorize Freebuff to maintain those scripts when environment changes require it.

## Implemented State

- Added the Playwright Browser Testing section under Project-Wide Technical Rules.
- Extended `__tests__/agent-governance-single-source.test.js` to guard the new instructions.
- Left README.md, browser setup scripts, Playwright configurations, CI workflows and application code unchanged.
- Recorded the specification, plan, tasks, checklist and evidence under `specs/164-playwright-agentmd-guidance/`.

## Verification and Handoff

- Source and scope review completed.
- Focused Vitest and local repository verification were not run because this session has no shell-capable repository checkout.
- ChatGPT did not load or execute `freebuff-verify.sh`.
- The dedicated governance PR is pending creation; PR-triggered checks remain pending.
