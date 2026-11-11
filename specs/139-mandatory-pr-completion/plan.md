# Implementation Plan: Mandatory Pull Request Completion

**Branch**: `governance/mandatory-pr-completion` | **Date**: 2026-11-11 | **Spec**: spec.md

**Input**: Feature specification from `specs/139-mandatory-pr-completion/spec.md`

## Selected Task Groups

- `deep-dive` — inspect current governance, task execution rules, the PR procedure and checker behavior.
- `security` — preserve the explicit human authorization boundary for protected governance changes.
- `testing` — align and extend the active governance regression test for the changed policy.

## Summary

Clarify that every owner-authorized repository-changing task must automatically proceed to PR preparation and submission after implementation and pre-submission verification. Keep read-only tasks exempt, respect explicit owner directions not to submit, and preserve safe blocker reporting. Update the active governance test to assert the new policy. Leave the protected-file workflow and owner CODEOWNERS rule unchanged.

## Technical Context

**Language/Version**: Markdown and JavaScript (Vitest).

**Primary Dependencies**: Existing GitHub governance files and Vitest; no new dependencies.

**Storage**: Repository documentation and test files only.

**Testing**: Focused `__tests__/agent-governance-single-source.test.js`, full Vitest suite, and `./freebuff-verify.sh` when a shell-capable environment is available.

**Target Platform**: GitHub repository and GitHub Actions.

**Project Type**: Repository governance documentation and regression test.

**Performance Goals**: No application runtime impact.

**Constraints**:
- Preserve existing `AGENTS.md` protections and explicit owner approval.
- Keep detailed PR procedure in `PR_SUBMISSION.md`; do not duplicate it.
- Preserve all existing Spec Kit, build-size, security, deployment and stop-after-submission rules.
- Do not modify PR #1823.
- Leave the resulting PR open, non-draft and unmerged for the owner.
- No application or dependency changes.

**Scale/Scope**: `AGENTS.md`, `__tests__/agent-governance-single-source.test.js`, and the required feature artifacts under `specs/139-mandatory-pr-completion/`.

## Constitution Check

- **Single source of truth**: PASS — `AGENTS.md` remains the sole repository-wide authority; `PR_SUBMISSION.md` remains its single detailed PR procedure.
- **Verify before acting**: PASS — current governance, PR procedure, protected-file workflow, CODEOWNERS, governance test, Spec Kit instructions/templates and Memory Bank context were inspected.
- **Implementation sequence**: PASS — specify, plan, tasks and implementation artifacts are maintained for this change.
- **Protect core systems**: PASS — no application, payment, database, authentication, deployment, integration or secret changes.
- **Human governance approval**: PRESERVED — `AGENTS.md` remains in the existing protected-file workflow and CODEOWNERS.
- **Resource conservation**: PASS — no dependencies, external services or `.docs/` content are changed.

## Project Structure

```text
AGENTS.md
PR_SUBMISSION.md (unchanged)
__tests__/agent-governance-single-source.test.js
.github/workflows/protected-files.yml (unchanged)
.github/CODEOWNERS (unchanged)
specs/139-mandatory-pr-completion/{spec.md,plan.md,tasks.md}
```

**Structure Decision**: Make one focused change to the handoff requirement and one focused regression-test update. Retain the existing protected-file checker and owner authorization workflow without modification.

## Verification Plan

- Run `pnpm exec vitest run __tests__/agent-governance-single-source.test.js`.
- Run the full `pnpm exec vitest run` suite.
- Run `./freebuff-verify.sh`, including the Spec Kit gate, type check, production build and documentation tests.
- Confirm `AGENTS.md` remains below its existing startup size budget and below 300 lines.
- Inspect the complete diff and verify `.github/workflows/protected-files.yml`, `.github/CODEOWNERS`, and `PR_SUBMISSION.md` are unchanged.
- Verify the PR is detected by the existing protected-file checker and requires owner authorization. Do not bypass that gate.
- Report unavailable local execution honestly; PR-triggered checks are pending only after creation.
