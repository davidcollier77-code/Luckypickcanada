# PR Summary — Independent CodeRabbit CLI Review Layer

## Task and Scope
- **Task group:** Creation — add a second automatic PR review route without changing application functionality.
- **Goal:** Run CodeRabbit CLI as an extra GitHub Actions layer and publish or refresh the result on the PR, so no local computer/terminal is required. Preserve the existing local wrapper as an optional developer path.
- **Scope:** One new workflow and one regression test; focused documentation and Spec Kit updates. The CodeRabbit GitHub App, PR Agent, DevSkim/CodeQL and other existing scanners, application code, dependencies, deployment, secrets, and `AGENTS.md` remain unchanged.
- **Review behavior:** PRs targeting `main` on `opened`, `reopened`, `synchronize`, and `ready_for_review`; one updatable comment; no code edits, pushes, approvals, or merges.
- **Credential/cost control:** Requires `CODERABBIT_API_KEY` as a repository Actions secret containing a CodeRabbit Agentic API key. Secret is owner-configured; its value was not supplied to or changed by this task. Workflow omits `--use-credits`.
- **Known limitation:** A new PR workflow only becomes active for subsequent PR events after it is merged into `main`. A live CLI run additionally requires eligible CodeRabbit account/seat access and the secret.

## Governance and References
- `AGENTS.md` — read first; required repository workflow and boundaries.
- `.jules/jules.md`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md` — required context read for this task.
- `.jules/creation.md`, `.docs/manifest.json`, `.docs/creation/jules_google_docs.md`, `.docs/creation/developers_google_com_jules_api.md`, `.docs/creation/_google-gemini_gemini-cli.md`, `.docs/creation/_websites_ai_google_dev_gemini-api.md` — routed Creation resources consulted; `.docs/` remains read-only.
- `.specify/memory/constitution.md`, the Spec Kit templates, and the four `.jules/cmds/speckit.*.md` stage definitions — consulted in the initial task pass; this interface has no native slash-command dispatch or mounted repository shell, so the stage method is file-driven procedural execution.
- Official CodeRabbit CLI reference: <https://docs.coderabbit.ai/cli/reference>.
- Official headless CLI integration: <https://docs.coderabbit.ai/cli/headless-cli-integration>.
- Official agent-mode output and exit codes: <https://docs.coderabbit.ai/cli/agent-mode>.
- **Reviewer finding checked:** Amazon Q questioned use of a Markdown file with `--config`. The current official CLI reference defines `--config` as additional instructions and gives Markdown instruction-file examples (for example, `claude.md`). Source inspection supports this usage; a live CLI call is still pending.

## Spec Kit Stage Record
1. `/speckit.specify` — **FILE-DRIVEN PROCEDURAL EXECUTION**; updated `specs/048-coderabbit-cli-review-layer/spec.md`.
2. `/speckit.plan` — **FILE-DRIVEN PROCEDURAL EXECUTION**; updated `specs/048-coderabbit-cli-review-layer/plan.md`.
3. `/speckit.tasks` — **FILE-DRIVEN PROCEDURAL EXECUTION**; updated `specs/048-coderabbit-cli-review-layer/tasks.md`.
4. `/speckit.implement` — **FILE-DRIVEN PROCEDURAL EXECUTION**; new workflow/test plus documentation updates are proposed in this branch. Final CI evidence remains pending.

## Files in the Final PR Diff (10)
- `.coderabbit-cli-instructions.md`
- `.github/workflows/coderabbit-cli-review.yml`
- `__tests__/coderabbit-cli-workflow.test.js`
- `README.md`
- `docs/coderabbit-cli.md`
- `scripts/coderabbit-cli-review.sh`
- `specs/048-coderabbit-cli-review-layer/spec.md`
- `specs/048-coderabbit-cli-review-layer/plan.md`
- `specs/048-coderabbit-cli-review-layer/tasks.md`
- `specs/048-coderabbit-cli-review-layer/pr_summary.md`

## Verification Status — PENDING
- **Existing wrapper source test:** Previously passed in an isolated temporary Git worktree. `bash -n` passed; a mock `cr` confirmed explicit config and review flags were forwarded; missing-CLI and outside-worktree error branches returned expected codes. No real CodeRabbit API call was run.
- **New workflow regression test:** Added to the Vitest suite; latest Visual QA run has not yet completed, so regression-test result is pending.
- **Observed unrelated CI failure:** The DevSkim job's existing suppression test failed with a Python `SyntaxError` at `.github/scripts/test_suppress_devskim_false_positives.py:207` (unterminated string literal). That file is not changed by this PR; the failure is in the merged base/PR checkout and is outside this CLI task's scope. It must be resolved separately before treating all CI as green.
- **YAML/workflow and full repo verification:** Not executed locally. GitHub CI and `./jules-verify.sh` must be checked on the final PR head; do not treat a source-level test as full workflow validation.
- **Secret/account access:** Not verified. The repository integration cannot create or read `CODERABBIT_API_KEY`. A live CI run of the new workflow completed successfully in its safe missing-secret branch: the credential preflight ran and checkout/install/review/comment steps were all skipped. This proves only the missing-key guard works, not a live review.
- **Bootstrap guard:** If the API key is added before this setup PR merges, the workflow explicitly skips when the base commit lacks `.coderabbit-cli-instructions.md` rather than trusting unreviewed PR instructions.
- **Live CLI review and PR comment:** Not run. Requires merge to `main`, owner-configured Agentic API key, and eligible CodeRabbit CLI access.
- **Cost guard:** Source inspection confirms no `--use-credits` argument exists in the workflow. CLI installation is pinned to `0.9.0` and self-updates are disabled. Included allowance/rate limits remain account-specific.

## Behavior Preserved
- Existing CodeRabbit GitHub App behavior and its configuration.
- Existing PR Agent, DevSkim, CodeQL, other scanner workflows, and normal CI.
- No dependency, manifest, application/API runtime, deployment, database, authentication, production environment, or secret changes.
- No automatic fix, push, approval, merge, or build/deploy action.
- Repository governance and `AGENTS.md`.

## Second Error Check
The planned diff is scoped to the CLI review instructions, the new dedicated workflow and its regression test, README/guide, existing local wrapper, and this task's Spec Kit/summary artifacts. The workflow preflights the secret before checkout, sources instructions from the base commit, skips safely when bootstrap instructions are missing, pins the CLI to `0.9.0` with auto-update disabled, uses least-privilege permissions, avoids `pull_request_target`, omits paid-credit authorization, and upserts a single bot comment. The final file diff, regression tests, remote CI, and `./jules-verify.sh` remain pending verification.

## USEFUL RESULT: NO (PENDING)
The automation and setup guidance are drafted but not yet demonstrated by final CI, an owner-provided secret, eligible CodeRabbit CLI access, or a live review. Reassess usefulness only after the workflow runs successfully or records a real account/plan blocker.
