# Implementation Plan: Reliable CodeRabbit CLI Review Reporting

**Branch**: `fix/coderabbit-cli-workflow-reliability-20261024` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

## Summary

Correct the existing CodeRabbit CLI workflow's comment lookup by removing the unsupported `--slurp`/ `--jq` combination. Preserve pagination and select the last matching ID from the jq output. When the CLI fails, print a bounded, sanitized stderr excerpt in the Actions log so the next failure can be classified.

## Technical Context

- **Language/Version**: GitHub Actions YAML, Bash, Python 3 on `ubuntu-latest`, and JavaScript with the repository's Vitest setup.
- **Primary dependencies**: Existing GitHub CLI; no new package or dependency.
- **Storage**: N/A.
- **Testing**: `pnpm exec vitest run __tests__/coderabbit-cli-workflow.test.js`, full `pnpm test`, `./jules-verify.sh`, and current-head GitHub Actions checks. Connected interface has no repository shell, so local commands cannot be executed here.
- **Target platform**: GitHub Actions pull-request workflow.
- **Constraints**: Preserve existing least-privilege permissions, key preflight-before-checkout, trusted base-commit instructions, pinned CLI, no paid-credit flag, review completeness logic, and human-owned merges. Do not change application code or `AGENTS.md`.

## Constitution Check

- **Single source of truth**: Pass — `AGENTS.md` remains untouched and authoritative.
- **Verify before acting**: Pass in design — diagnosis is based on captured failure logs and current workflow/test sources; final CI remains pending.
- **Protect core systems**: Pass — no production app, deployment, secret value, or business integration is changed.
- **Scope and safety**: Pass — one workflow, its existing regression test, and task-scoped Spec Kit/Memory Bank evidence only.

## Research / Design Decisions

- The recorded log explicitly reports that `--slurp` is incompatible with `--jq` or `--template`. With `--paginate`, remove `--slurp`, run the jq filter per page, and pipe matching IDs to `tail -n 1`.
- The CLI review step already captures stderr to a temp file; add sanitized log output only on a nonzero result.
- The source-level Vitest test already targets the upsert contract; replace the outdated assertion that expected the broken command and add diagnostic assertions.
- Because the first repaired run revealed that continue-on-error made the overall workflow green despite an invalid API key, add a final gate after comment publication so incomplete reviews still fail the check. Keep intentional missing-key/bootstrap skips unchanged.
- Neutralize both current and legacy workflow-command-looking stderr prefixes.
- No optional research, data-model, API-contract, or quickstart artifact is needed.

## Project Structure

- `.github/workflows/coderabbit-cli-review.yml` — fix pagination/query command and reveal safe diagnostics.
- `__tests__/coderabbit-cli-workflow.test.js` — regression assertions.
- `specs/049-coderabbit-cli-workflow-reliability/` — concise task specification, plan, tasks, checklist, and summary.

## Verification Plan

1. Run the focused Vitest test, full test suite, Spec Kit verifier, and applicable CI checks where execution is available.
2. On current PR head, inspect workflow and test results and confirm the review comment step no longer fails with the gh CLI option error.
3. If the CLI itself still fails, use the new sanitized stderr excerpt to classify that failure; do not describe it as fixed merely because comment publishing succeeds.
4. Inspect the final changed-file list and confirm no app, secret, deployment, or unrelated workflow changes.
