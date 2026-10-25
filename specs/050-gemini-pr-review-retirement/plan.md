# Implementation Plan: Retire Gemini PR-Agent Review Workflow

**Branch**: `chore/retire-gemini-pr-agent-20261025` | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)

## Summary

Delete the separate Gemini PR-Agent GitHub Actions workflow and its dedicated static test. Keep PR Insights Tagger, Amazon Q, DevSkim, and every application, runtime, dependency, deployment, and secret configuration unchanged.

## Technical Context

- **Language/Version**: GitHub Actions YAML and JavaScript/Vitest; repository Node.js 22 and pnpm.
- **Primary Dependencies**: None added or removed.
- **Storage**: No application or database data changes.
- **Testing**: Inspect the final tree and diff; inspect current-head GitHub Actions results. Local `pnpm test` and `./jules-verify.sh` cannot be run through this GitHub API-only interface.
- **Target Platform**: GitHub Actions pull-request automation.
- **Constraints**: Do not modify application source, the Oracle API, Cloudflare, repository secrets, `.docs/`, `AGENTS.md`, `package.json`, or `pnpm-lock.yaml`.

## Constitution Check

- **Single source of truth**: Pass — `AGENTS.md` remains unchanged.
- **Verify before acting**: Pass — current workflow, dedicated test, test script list, recent live workflow run, and existing review setup were inspected.
- **Protect core systems**: Pass — no app runtime, API, deployment, or secret value is modified.
- **Scope and safety**: Pass — only the redundant reviewer workflow and its workflow-specific test are deleted; historical feature records are preserved.

## Evidence and Design Decisions

- Repository run [40199155383](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40199155383) executed the Gemini PR-Agent workflow on the one-line smoke-test PR. Gemini 3.8 Flash returned a 503/high-demand response and timed out on retry; the configured Gemini 3.6 Flash fallback completed an analysis that found no issues in the intentionally trivial test. This demonstrates fallback execution but does not establish an advantage over the existing reviewers.
- PR #1598 independently received an automatic PR Insights Tagger summary and an Amazon Q review. PR Insights provides triage metadata rather than a substitute for a full code-quality review.
- Decision: simplify the review stack to the PR Insights Tagger, Amazon Q, and existing security scanners while the owner evaluates another code reviewer.
- Keep `specs/034-pr-agent` and `.specify/features/gemini-review-depth/` unchanged as historical implementation records.
- The `GEMINI_API_KEY` referenced by this workflow is a GitHub Actions secret. The site's Oracle uses a separate Cloudflare runtime environment. This PR does not edit either secret; after merge, the owner may remove the now-unused GitHub Actions secret only after confirming no other workflow references it. Do not remove the Oracle's Cloudflare runtime secret.

## Project Structure / Exact Change Scope

- Delete `.github/workflows/pr-agent.yml`.
- Delete `__tests__/pr-agent-workflow.test.js`.
- Add `specs/050-gemini-pr-review-retirement/{spec,plan,tasks,pr_summary}.md`.
- Add a concise current-state entry to `memory-bank/activeContext.md`.
- Leave historical specs, routed `.docs/` snapshots, all other workflows, application files, packages, lockfiles, and secrets unchanged.

## Verification Plan

1. Inspect both deletion paths and confirm the new feature artifacts exist on the branch.
2. Search the remaining active workflow/test tree for imports or triggers of the retired workflow.
3. Reconcile the full PR diff; confirm Q, PR Insights, DevSkim and Oracle implementation are untouched.
4. Inspect GitHub CI results for the final PR head; report unrelated failures separately.
5. Report local test and `./jules-verify.sh` commands as not run unless they are actually executed. Build-size measurement is not applicable because build/runtime/dependency inputs are unchanged.