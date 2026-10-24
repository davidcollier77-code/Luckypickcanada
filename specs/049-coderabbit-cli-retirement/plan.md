# Implementation Plan: Retire CodeRabbit CLI Integration

**Branch**: `fix/coderabbit-cli-workflow-reliability-20261024` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

## Summary

Remove the unusable CLI-only review layer and its supporting test, script, instructions, documentation, and README reference. Preserve the existing CodeRabbit GitHub App, other reviewer/scanner workflows, app behavior, and dependencies.

## Technical Context

- **Language/Version**: GitHub Actions YAML, Bash, JavaScript/Vitest, Markdown.
- **Primary Dependencies**: None added or removed; `package.json` and `pnpm-lock.yaml` remain unchanged.
- **Storage**: N/A. Repository secret removal is an owner-operated GitHub settings action, not part of the code diff.
- **Testing**: Inspect the exact branch diff; inspect remote PR checks; run `pnpm test` and `./jules-verify.sh` where shell execution is available. This connected GitHub API interface cannot run repository shell commands.
- **Target Platform**: GitHub repository automation and documentation.
- **Performance Goals**: No application/runtime or build changes.
- **Constraints**: Preserve CodeRabbit GitHub App and all unrelated checks. Do not edit `AGENTS.md`, `.docs/`, deployment or secret values. Build-size measurement is not applicable because app/build/dependency inputs do not change.

## Constitution Check

- **Single source of truth**: Pass — `AGENTS.md` remains untouched and authoritative.
- **Verify before acting**: Pass — PR and repository tree were inspected; CLI failure is recorded in run 40117926386.
- **Protect core systems**: Pass — no application, deployment, secret value, or unrelated integration changes.
- **Scope and safety**: Pass — remove only active CLI files, its README mention, and replace the current task artifacts.

## Research and Design Decisions

- The configured CLI authentication failed with `Invalid or expired API key` in the recorded workflow run. The owner chose to retire this optional layer rather than continue credential experiments.
- Keep `specs/048-coderabbit-cli-review-layer/` unchanged as historical evidence. Use `specs/049-coderabbit-cli-retirement/` for this replacement task's current spec and verification record.
- No extra research/design artifacts or dependencies are warranted.
- The repository secret is not accessible through the available GitHub content interface; the owner will delete `CODERABBIT_API_KEY` through repository Settings.

## Project Structure

- Delete `.github/workflows/coderabbit-cli-review.yml`.
- Delete `__tests__/coderabbit-cli-workflow.test.js`.
- Delete `scripts/coderabbit-cli-review.sh` and `.coderabbit-cli-instructions.md`.
- Delete `docs/coderabbit-cli.md`; remove its README section.
- Update `memory-bank/activeContext.md` and this feature's concise Spec Kit records.
- Leave all other workflow, scanner, configuration, app, dependency, and governance files unchanged.

## Verification Plan

1. Reconcile every changed/deleted path against this plan and ensure no other CodeRabbit App or scanner configuration changed.
2. Inspect the remote checks on the updated PR head; distinguish unrelated existing failures from changes in this PR.
3. Report `pnpm test` and `./jules-verify.sh` as not run if the repository shell remains unavailable.
4. Confirm the owner-managed key removal is still pending until the owner completes it in GitHub settings.
