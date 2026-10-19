# Implementation Plan: Repair Gemini PR-Agent Workflow

**Branch**: `fix/gemini-pr-agent-workflow-1530` | **Date**: 2026-10-19 | **Spec**: `.specify/features/034-pr-agent/spec.md`

## Summary

Repair the existing pull-request review workflow by using the supported step-level `env` mapping, selecting Gemini 3.8 Flash, covering the intended PR event types both in GitHub Actions and PR-Agent's own event filter, and safely checking that the repository secret is available before the provider is invoked. Add a targeted static regression test. Leave all other reviewers and application/deployment code unchanged.

## Technical Context

**Language/Version**: YAML workflow configuration; JavaScript tests on the repository's Node.js 22 runtime.

**Primary Dependencies**: Existing pinned `the-pr-agent/pr-agent` GitHub Action at commit `fbf7f6d3fcff6d9bf15aef7d8f4a6c2cacc7ad1f`; existing Vitest dependency. No new dependencies.

**Storage**: GitHub repository Actions secret `GEMINI_API_KEY`; this task does not modify secrets.

**Testing**: Targeted Vitest regression test, full unit tests, TypeScript check, `./jules-verify.sh`, and existing GitHub Actions/OpenNext checks.

**Target Platform**: GitHub Actions pull-request workflows.

**Project Type**: Repository CI/CD workflow correction.

**Performance Goals**: Start a review on supported pull-request events without unnecessary provider calls when the secret is missing.

**Constraints**: Preserve the 495 MiB hard build-size ceiling; retain action commit pin; no changes to CodeRabbit, Amazon Q, Robin retirement, production deployment configuration, app runtime behavior, or dependencies.

**Scale/Scope**: Existing same-repository PRs, including PRs created by repository bots, across the five supported event types.

## Constitution Check

- **Single source of truth**: Root `AGENTS.md` was read first; task artifacts remain under the active Spec Kit feature.
- **Verify before acting**: The workflow on `main` and the merged PR #1527 diff were inspected; the malformed step structure and stale model configuration were confirmed.
- **Implementation sequence**: Specify, plan, tasks, implement, verify, double-check, report, and create a PR are represented by this task's artifacts. The remote GitHub API is used because this session's shell cannot resolve `github.com`; local command runs cannot be claimed.
- **Protect core systems**: Only the PR-Agent workflow and task governance/test documentation are changed. No secret is created or modified; no deployment or runtime system is edited.
- **Resource/build limits**: No build/dependency changes are expected. Required CI will remain the source of truth for repository tests and the 495 MiB check.

## Design Decisions

1. Keep the existing PR-Agent action commit pinned.
2. Put every PR-Agent option in a step-level `env` mapping.
3. Use `GOOGLE_AI_STUDIO.GEMINI_API_KEY` sourced from `secrets.GEMINI_API_KEY`; never print its value.
4. Perform a short preflight that stops clearly when the secret is unavailable.
5. Use matching GitHub Actions and PR-Agent event lists; remove the sender-type filter so bot-originated PR events are eligible.
6. Keep auto review enabled and auto describe/improve disabled to avoid unrelated or repetitive automated actions.
7. Configure PR-Agent's fallback list to the Gemini 3.5 Flash-Lite so a temporary service error does not cause an unrelated default OpenAI model attempt.
8. Add static regression coverage for the exact prior failure pattern.

## Implementation Scope

- Workflow: `.github/workflows/pr-agent.yml`
- Targeted regression test: `__tests__/pr-agent-workflow.test.js`
- Spec Kit artifacts and canonical PR Summary
- Memory Bank current context/progress

## Verification Plan

- Run the targeted Vitest regression test and full unit tests in CI.
- Run TypeScript and `./jules-verify.sh` in CI.
- Confirm the existing OpenNext workflow enforces `.next + public < 495 MiB`.
- Inspect the complete PR diff for workflow syntax, scope, and secret exposure.
- After merge, confirm a new eligible PR event generates a successful PR-Agent run and visible Gemini review. Repository secret existence and API validity remain unknown until a credentialed run completes.
