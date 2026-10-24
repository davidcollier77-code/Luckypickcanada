# Tasks: Independent CodeRabbit CLI Review Layer

**Input**: Updated design documents in `specs/048-coderabbit-cli-review-layer/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Setup and Baseline

- [X] T001 Read `AGENTS.md` first, then required Jules/Memory Bank context, the Creation task group and routed documentation, Spec Kit templates/commands, and official CodeRabbit CLI documentation.
- [X] T002 Inspect `main`, the existing task branch/PR, current review and scanner workflows, and existing CodeRabbit configuration. Preserve the current GitHub App and scanner behavior.
- [X] T003 Verify current CLI documentation for `--config`, `--api-key`, `--base`, agent-mode output, headless authentication, and usage credits. Current official reference describes `--config` as additional instructions and provides Markdown examples.

## Phase 2: Preserve the Optional Local CLI Path

- [X] T004 Add `.coderabbit-cli-instructions.md` with focused read-only project review rules independent of `AGENTS.md`.
- [X] T005 Add `scripts/coderabbit-cli-review.sh` with clear worktree/config/CLI prerequisite failures and safely quoted argument forwarding.
- [X] T006 Test the wrapper in an isolated temporary Git worktree using `bash -n` and a mock `cr`; record that this checks argument forwarding but not the live CodeRabbit service.

## Phase 3: Automatic GitHub Actions Review

- [X] T007 Add `.github/workflows/coderabbit-cli-review.yml` for main-targeted PR events with concurrency cancellation, least-privilege permissions, and a missing-secret preflight before checkout.
- [X] T008 Pin the CodeRabbit CLI version, pass base-commit instructions explicitly, use headless API-key authentication, and omit `--use-credits`.
- [X] T009 Parse agent-mode results, distinguish completed from incomplete reviews, and create/update one PR comment without code modification or merge behavior.
- [X] T010 Add `__tests__/coderabbit-cli-workflow.test.js` to guard trigger events, preflight ordering, pinned tooling, trusted instructions, non-use of paid credits, and comment behavior.

## Phase 4: Documentation and Evidence

- [X] T011 Update the README and guide with mobile-browser instructions for storing the CodeRabbit Agentic API key as `CODERABBIT_API_KEY`; retain optional local usage instructions.
- [X] T012 Update this task's `spec.md`, `plan.md`, `tasks.md`, and `pr_summary.md` to match the automatic workflow requirement.
- [ ] T013 Run the new regression test and all required repository checks on the final PR head; observe remote CI and `./jules-verify.sh`. The connector-only environment cannot run the repository shell directly.
- [ ] T014 After merge, configure the API key only if the CodeRabbit account provides eligible CLI access; verify one live run/comment. Keep the paid-credit option disabled and document any account/quota blocker.

## Dependency Order

T001-T003 establish scope and official CLI contracts. T004-T006 preserve the local review option. T007-T010 add the automated workflow and its regression checks. T011-T012 update docs and records. T013-T014 remain verification/setup gates.

## Acceptance Checklist

- [X] Existing CodeRabbit GitHub App and existing scanner/reviewer workflows are unchanged.
- [X] A separate automatic CLI workflow is added for PRs targeting `main`.
- [X] Missing key is detected before PR checkout; no key value is printed or committed.
- [X] Instructions come from the PR base commit, not the reviewed branch.
- [X] Review results update one stable PR comment and incomplete runs cannot be presented as clean.
- [X] No `--use-credits` flag is passed; the workflow does not opt into paid over-limit credits.
- [X] No code-editing, auto-fix, push, approval, or merge behavior is added.
- [ ] CI, `./jules-verify.sh`, account access, and the first live review are verified only after actual evidence is available.
