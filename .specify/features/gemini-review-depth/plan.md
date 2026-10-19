# Implementation Plan: Gemini Review Depth

**Branch**: `fix/gemini-review-depth-1533` | **Date**: 2026-10-19 | **Spec**: `.specify/features/gemini-review-depth/spec.md`

## Summary

Expand the existing PR-Agent/Gemini code review configuration so it has a less restrictive findings ceiling, can publish line-anchored findings, and follows a repo-specific all-in-one review prompt. Add static regression assertions and evidence documentation; do not change the provider, action version, secrets, triggers, permissions, dependencies, or application runtime.

## Technical Context

- **Language/Version**: YAML workflow configuration and JavaScript test source; repository Node.js 22 / pnpm.
- **Primary Dependencies**: Existing pinned The-PR-Agent action; existing Vitest dev dependency.
- **Storage**: GitHub pull-request review comments; no application data changes.
- **Testing**: `pnpm exec vitest run __tests__/pr-agent-workflow.test.js`; current-head repository CI; `./jules-verify.sh`.
- **Target Platform**: GitHub Actions on pull-request events.
- **Project Type**: Next.js application repository CI/reviewer workflow.
- **Performance Goals**: Avoid extra reviewer workflows or deliberate repeated model calls; one configured automatic review per eligible PR event.
- **Constraints**: Preserve primary/fallback models; keep maximum findings at eight; do not force a maximum number of findings; no API key values exposed; app build-size hard limit remains 495 MB.
- **Scale/Scope**: One existing workflow, one static regression test, and task governance artifacts only.

## Constitution Check

- Verify before acting: repository workflow/test and official PR-Agent configuration docs inspected.
- Single source of truth: `AGENTS.md` remains authoritative; task-specific requirements are recorded here.
- Smallest scoped change: no application runtime, dependency, deployment, secret, or other reviewer configuration changed beyond the requested review output.
- Evidence discipline: local shell tests and live validation are not claimed; CI and a live review remain required.
- Governance limitation: this connected execution environment cannot resolve GitHub from its shell, so the Spec Kit setup scripts and `./jules-verify.sh` could not be executed locally. Treat their current-head CI results as mandatory before merge; this plan does not claim those scripts ran.

## Design Decisions

1. Keep the immutable PR-Agent action reference and existing Gemini primary/fallback chain.
2. Set `pr_reviewer.num_max_findings` to `8`; this is a ceiling, not a target.
3. Enable `pr_reviewer.inline_key_issues` so useful findings can be anchored to changed lines.
4. Request explicit risk assessment, merge recommendation, and failure-mode/test-gap summary using documented PR-Agent settings.
5. Use `pr_reviewer.extra_instructions` for relevant code-review categories and evidence/reporting standards.
6. Extend the existing workflow regression test rather than adding dependencies or a separate workflow.
7. Do not run deliberate repeated Gemini reviews. A naturally triggered run provides the next live acceptance evidence.

## Implementation Scope

- `.github/workflows/pr-agent.yml`
- `__tests__/pr-agent-workflow.test.js`
- `.specify/feature.json`
- `.specify/features/gemini-review-depth/`
- `PR_SUMMARY.md`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`

## Verification Plan

- Inspect the final workflow and regression test on the exact PR head.
- Run the targeted Vitest regression test and the full tests in current-head CI.
- Run `./jules-verify.sh` and review its actual output.
- Inspect the final Git diff and changed-file reconciliation.
- Confirm current-head workflow checks and a measured build-size gate; this is workflow/test-only, so no application build behavior is intentionally changed.
- Do not declare Gemini fully operational until a supported post-merge PR event visibly posts a review using the configured settings.
