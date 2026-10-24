# Tasks: Reliable CodeRabbit CLI Review Reporting

**Input**: Design documents in `specs/049-coderabbit-cli-workflow-reliability/`
**Prerequisites**: `spec.md`, `plan.md`

## Phase 1 — Investigation and specification

- [x] T001 Read `AGENTS.md` first, initialize the required Memory Bank context, select Troubleshooting, and inspect its routed docs and manifest.
- [x] T002 Inspect PR #1592 and PR #1593 workflow logs and verify the exact failing command: `gh api --paginate --slurp ... --jq ...`.
- [x] T003 Inspect the existing workflow and `__tests__/coderabbit-cli-workflow.test.js`; confirm the current assertion explicitly expects the broken option combination.

## Phase 2 — Implementation

- [x] T004 Fix comment lookup to use `gh api --paginate ... --jq ... | tail -n 1`, maintaining one-comment upsert behavior.
- [x] T005 Add bounded sanitized stderr output when CodeRabbit CLI exits nonzero; redact secrets/tokens, strip ANSI escapes, and neutralize workflow-command-looking lines.
- [x] T006 Update the existing Vitest regression test to reject the incompatible option combination and assert diagnostic safeguards.
- [x] T007 Add a post-publication gate so CLI failure/incomplete output cannot produce an overall green workflow result; preserve intentional preflight/bootstrap skips.
- [x] T008 Neutralize both current and legacy workflow-command-looking prefixes in sanitized diagnostics.

## Phase 3 — Verification and reconciliation

- [ ] T009 Run `pnpm exec vitest run __tests__/coderabbit-cli-workflow.test.js`, `pnpm test`, and `./jules-verify.sh` on the final PR head; these cannot be run from this connected GitHub API interface and must remain pending until remote CI evidence exists.
- [ ] T010 Inspect final PR diff and remote check logs; verify publishing no longer fails on incompatible gh CLI options and report any independent CLI/API failure based on the new diagnostics.
- [x] T011 Complete `pr_summary.md` with accurate scope, exact artifacts, stage execution method, and explicit verification limitations.

## Dependencies

- T001–T003 precede the implementation.
- T004–T006 are sequential changes to the same workflow/test pair.
- T007–T008 require GitHub CI after the branch is pushed.
- T009 records only evidenced results.
