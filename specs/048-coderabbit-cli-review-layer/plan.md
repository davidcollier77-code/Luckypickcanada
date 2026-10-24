# Implementation Plan: Independent CodeRabbit CLI Review Layer

**Branch**: `chore/coderabbit-cli-review-layer-20261024` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification in `specs/048-coderabbit-cli-review-layer/spec.md`

## Summary

Add a small, optional local CodeRabbit CLI review path: a dedicated Markdown instruction file, a safe Bash wrapper that passes it with the CLI's documented `--config` flag, and a developer guide. Keep the setup deliberately distinct from conventional repository CodeRabbit app configuration files so existing PR review behavior is not intentionally changed.

## Technical Context

**Language/Version**: Bash compatible with standard macOS/Linux shells; Markdown instructions and docs.

**Primary Dependencies**: Existing Git, installed CodeRabbit CLI executable `cr`; no new application dependency.

**Storage**: Repository text files only. CLI authentication remains local to the maintainer's computer.

**Testing**: Source review of shell argument forwarding and error branches, remote PR/CI checks, and first live CLI review after maintainer installation and authentication.

**Target Platform**: Local developer machines with Git, Bash, and CodeRabbit CLI; installation instructions cover macOS/Linux and Windows PowerShell.

**Project Type**: Developer tooling/documentation for an existing Next.js repository.

**Constraints**:
- Do not modify `AGENTS.md` or import repository governance into the CLI instruction file.
- Do not add conventional `.coderabbit.yaml`, `.coderabbit.yml`, or `.coderabbit.config.ts`.
- Do not change the GitHub App, scanner workflows, checks, dependencies, app source, deployment, or secrets.
- Do not assert an exact free-review quota; use `cr usage`.
- Do not claim local CLI auth/installation/review or shell-based verification occurred in this API-only session.

**Scale/Scope**: One CLI-specific instruction file, one wrapper script, one user guide, and the Spec Kit artifacts plus a scoped PR summary. No extra data models, contracts, or research artifacts are required.

## Constitution Check

- **Single source of truth**: Pass; no changes to repository governance. The CLI rules are review guidance only, separate from `AGENTS.md`.
- **Verify before acting**: Pass; default branch, existing files, task context, and absence of conventional CodeRabbit config files were inspected.
- **Protected systems**: Pass; no application, API, authentication, payment, database, deployment, secret, or CI behavior is intended to change.
- **Resource conservation**: Pass; no new package or service is added.
- **Verification**: Pending implementation and final branch checks. Local command execution is unavailable from the GitHub API connection; do not report local validation as passed.

## Design Decisions

1. Use a Markdown instruction file named `.coderabbit-cli-instructions.md` and pass it explicitly with `cr review --config`. This is intentionally not one of CodeRabbit's conventionally discovered repository configuration filenames.
2. Provide a wrapper invoked as `bash scripts/coderabbit-cli-review.sh ...` so the dedicated instructions are always passed without requiring users to remember the flag. The wrapper checks for a Git worktree, the instructions file, and the CLI executable.
3. Keep reviews manual and opt-in. Do not add a GitHub Actions workflow, mandatory check, scheduled run, or auto-fix behavior.
4. Provide a separate `docs/coderabbit-cli.md` guide for local installation, sign-in, readiness/quota checks, pre-commit reviews, deep branch comparisons, structured findings, and safety expectations.
5. Preserve normal test, CI, security scan, human review and merge processes. The CLI is a second opinion, not an authority or replacement for CI.
6. Keep all review rules specific, high-signal and read-only. Avoid asking the CLI to load `AGENTS.md` or to change the repository's governance.
7. Do not include optional README edits unless needed for discoverability; the dedicated guide's path is recorded in this PR.

## Project Structure

- `.coderabbit-cli-instructions.md` — project-specific independent local review guidance.
- `scripts/coderabbit-cli-review.sh` — forwards supported `cr review` arguments with the explicit instructions file.
- `docs/coderabbit-cli.md` — installation/authentication/usage guide.
- `specs/048-coderabbit-cli-review-layer/{spec.md,plan.md,tasks.md,pr_summary.md}` — task records.

## Verification Plan

1. Inspect the wrapper for safe quoting, strict error handling, and correct argument forwarding.
2. Inspect the instruction file for separation from `AGENTS.md`, the GitHub App, and auto-fix/deploy behavior.
3. Inspect the complete branch diff twice for unrequested file changes.
4. Allow GitHub CI to run; local shell commands cannot be executed through this interface.
5. After merge, install/authenticate the CLI on the user's machine, run `cr doctor` and `cr usage`, then perform one actual review. Record that live result separately from repository CI.

## Remaining Unknowns

- The user's local operating system, CLI installation state, sign-in state, and CodeRabbit account quota are not visible through this repository connection.
- CLI and remote service compatibility for `--deep` must be checked against the user's installed version.
