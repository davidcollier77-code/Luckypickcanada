# Implementation Plan: Independent CodeRabbit CLI Review Layer

**Branch**: `chore/coderabbit-cli-review-layer-20261024` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: Updated feature specification in `specs/048-coderabbit-cli-review-layer/spec.md`

## Summary

Keep the existing optional local CLI wrapper and add an independent GitHub Actions review workflow. On PR events targeting `main`, the workflow checks for an Agentic API key, checks out the PR head only when the key is available, uses review instructions from the base commit, calls CodeRabbit CLI without opting into usage credits, and creates/updates a single PR comment with structured findings or an explicit incomplete status.

## Technical Context

**Language/Version**: GitHub Actions YAML, Bash, Python 3 from `ubuntu-latest`, Markdown, and the existing Vitest test setup.

**Primary Dependencies**: Existing GitHub Actions runner and GitHub CLI; pinned `actions/checkout`; CodeRabbit CLI pinned to 0.9.0. No application dependency or package-manifest change.

**Authentication and storage**: `CODERABBIT_API_KEY` is a GitHub repository Actions secret created by the owner. Its value is never stored in the repository or printed. The CLI gets the key only at runtime.

**Testing**: A Vitest source-level regression test guards the workflow contract; repository CI and the Spec Kit verifier must run on the final PR head. A real review also requires the secret and an account with eligible CLI access.

**Target platform**: GitHub Actions for PRs targeting `main`, with optional local CLI usage for developers with a computer.

**Constraints**:
- Read `AGENTS.md` first and keep it unchanged.
- Do not alter existing CodeRabbit GitHub App settings, current scanner/reviewer workflows, application code, dependencies, deployment, or production secrets.
- Add exactly one independent CLI review workflow; do not add a conventional CodeRabbit app configuration file.
- Check the key before PR checkout; use base-revision instructions so a PR cannot rewrite its own review rules.
- Use least-privilege token permissions and a stable updatable PR comment.
- Do not include `--use-credits`; do not explicitly authorize paid over-limit usage.
- Report quota/API-key prerequisites and unrun live validation honestly.

## Constitution Check

- **Governance**: Pass in design; preserve `AGENTS.md` and follow the repository's Creation path and Spec Kit artifacts.
- **Scope**: Pass in design; the only new automation is the dedicated CodeRabbit CLI workflow and its regression test. Existing scanner workflows are untouched.
- **Security**: The workflow reads the secret in a preflight step before checking out PR content; fork-originated `pull_request` events do not receive the key; the base commit supplies instruction rules; no auto-fix, push, approve, or merge behavior.
- **Cost control**: No `--use-credits` flag. A rate-limited or unauthorized review is surfaced as incomplete, not retried with a paid option.
- **Verification**: Pending final branch CI, `./jules-verify.sh`, and a first live run after merge and secret setup.

## Design Decisions

1. Keep `.coderabbit-cli-instructions.md` as a dedicated instruction file passed explicitly via CLI `--config`; do not add conventional repository CodeRabbit configuration filenames.
2. Preserve `scripts/coderabbit-cli-review.sh` for optional local use.
3. Add `.github/workflows/coderabbit-cli-review.yml` for PR events `opened`, `reopened`, `synchronize`, and `ready_for_review` against `main`, with concurrency cancellation for stale runs.
4. Preflight `secrets.CODERABBIT_API_KEY` before checkout; when missing, add a workflow warning and job summary, then stop successfully without accessing PR content.
5. Pin the CLI to 0.9.0 and use the documented headless API-key flag. Source custom review instructions and the local base branch from the PR base SHA, not the changed PR head.
6. Parse CodeRabbit's documented agent-mode NDJSON output; distinguish `review_completed`/successful skip from missing, invalid, or incomplete completion events; update a single bot comment marked with a stable HTML comment.
7. Keep the reviewer advisory. Do not write to code, auto-fix, create commits, approve, or merge. Do not pass `--use-credits`.
8. Add `__tests__/coderabbit-cli-workflow.test.js` to guard event conditions, preflight ordering, action pinning, trusted instruction source, no paid credits, and comment upsert behavior.
9. Update documentation for mobile-browser setup of a CodeRabbit Agentic API key as the repository secret, alongside existing local commands.
10. No other architectural, data-model, API contract, or application-runtime changes are required.

## Project Structure

- `.coderabbit-cli-instructions.md` — independent reviewer instructions, copied from the PR base by the workflow.
- `.github/workflows/coderabbit-cli-review.yml` — automatic PR review job and one-comment publisher.
- `__tests__/coderabbit-cli-workflow.test.js` — workflow regression contract checks.
- `scripts/coderabbit-cli-review.sh` — optional local wrapper.
- `docs/coderabbit-cli.md` — automated secret setup and optional local usage.
- `specs/048-coderabbit-cli-review-layer/{spec.md,plan.md,tasks.md,pr_summary.md}` — task artifacts and evidence record.

## Verification Plan

1. Inspect the workflow's credential preflight, secret exposure boundaries, action pin, base-ref handling, CLI arguments, output parser, comment upsert, and paid-credit flag absence.
2. Run the new workflow regression test as part of the repo test suite.
3. Inspect the complete final diff twice for unrequested file changes and secrets.
4. Wait for GitHub PR CI, including `./jules-verify.sh`; do not claim local checks ran through the connector-only environment.
5. After merge, have the owner create the Agentic API key and add `CODERABBIT_API_KEY` to repository Actions secrets, then verify one successful or clearly incomplete live review. Do not enable pay-as-you-go just to make the workflow green.

## Remaining Unknowns

- Whether the owner's CodeRabbit account exposes an Agentic API key and an eligible assigned seat.
- The account's included review quota; the workflow will not opt into paid over-limit credits.
- Final CI, live CLI API authentication, and the first posted PR comment remain unverified.
