# Implementation Plan: Gemini Reviewer Fresh Base Checkout

**Branch**: fix/gemini-reviewer-fresh-base-checkout-20261025 | **Date**: 2026-10-25 | **Spec**: specs/053-gemini-reviewer-fresh-base-checkout/spec.md

## Summary

Replace the stale immutable base-SHA checkout expression with the PR base branch name, falling back to the repository default branch on non-PR events. Add a regression assertion that positively requires the new expression and rejects the old one.

## Technical Context

**Language/Version**: GitHub Actions YAML and TypeScript test source; existing Node.js 22 and Vitest setup.
**Dependencies**: No dependency changes.
**Target Platform**: GitHub Actions.
**Testing**: Focused pnpm test -- __tests__/gemini-reviewer-workflow.test.ts, full pnpm test, and ./jules-verify.sh. Actual current-head CI is required because this API-connected session cannot run a repository shell.
**Constraints**: Preserve trusted-base execution, workflow permissions, event triggers, secrets, model fallback chain, and all application behavior. Do not merge this PR.

## Constitution Check

- Change is limited to one workflow expression, its regression assertion, task artifacts, active context, and PR summary: PASS.
- Workflow continues to use trusted base-branch code and never checks out the PR head: PASS by design; confirm in final diff.
- No permissions, secrets, dependencies, or app runtime behavior change: PASS by design.
- Test and end-to-end verification claims are based on actual CI results, not assumed from file inspection: PASS.

## Phase 0 — Research

Verified the failure from run 40240151685. Its syntax error matches the previous failure after PR #1606 was merged. The workflow used github.event.pull_request.base.sha, while a comment-triggered run 40240145268 succeeded on current default-branch code. Inspected AGENTS.md, Jules setup, routed troubleshooting materials, workflow, existing regression test, package scripts, Spec Kit artifacts, and active context. No library or API research is required to change this checkout ref.

## Phase 1 — Design

- Change only .github/workflows/gemini-reviewer.yml checkout ref from base.sha to base.ref, retaining the default-branch fallback.
- Update __tests__/gemini-reviewer-workflow.test.ts to require the new expression and reject the old expression.
- Add this feature's concise spec, plan, tasks, and requirements checklist.
- Update memory-bank/activeContext.md with the verified root cause and honest pending verification.
- Maintain PR_SUMMARY.md as the canonical evidence record.
