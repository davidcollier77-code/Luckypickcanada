# Research: Jules Spec Kit Governance

**Date**: 2026-10-09  
**Feature**: [spec.md](spec.md)

## Verified repository evidence

1. `.specify/integration.json` names `generic` as the default and only installed integration, with `commands_dir: .jules/cmds` and `invoke_separator: .`.
2. The four current command definition files exist at `.jules/cmds/speckit.specify.md`, `.jules/cmds/speckit.plan.md`, `.jules/cmds/speckit.tasks.md`, and `.jules/cmds/speckit.implement.md`.
3. PR #1407 added the mandatory sequence to `AGENTS.md` on October 8, 2026.
4. PR #1410 was created and merged on October 9, 2026. Its summary explicitly says `.jules/cmds/speckit.specify.md` was not used because the work was a strict CI/CD task. This is the observed bypass after the governance change.
5. `.specify/memory/constitution.md` still said to use Spec Kit "when required by the task scope", which gave Jules a conflicting task-scope rule to follow.
6. Before this change, `jules-verify.sh` only ran TypeScript, build, and refresh-docs tests; it had no check for active Spec Kit task artifacts. Therefore, its reported PASS did not establish that Spec Kit had been used.

## External documentation reviewed

- Jules Getting Started: https://jules.google/docs/ — documents Jules's support for a root `AGENTS.md`.
- Spec Kit integrations reference: https://github.com/github/spec-kit/blob/main/docs/reference/integrations.md — documents the generic integration's configurable `--commands-dir` for command files.
- Spec Kit workflow reference: https://github.com/github/spec-kit/blob/main/docs/reference/workflows.md — documents workflow command steps and human approval gates.

These references support distinguishing agent instruction files from a terminal executable and checking the exact integration setup. The repository evidence does not establish that Jules natively dispatches these custom slash commands in every session, so the corrected instruction must provide a file-driven procedure rather than assume native dispatch.

## Root cause

The filenames were not the demonstrated problem. The observed failure is a combination of:

- conflicting guidance: `AGENTS.md` required Spec Kit for every Jules task, but the Spec Kit constitution still tied its use to task scope;
- ambiguous execution language: the mandatory instruction required literal slash-command execution but did not say how to execute the Markdown definitions if Jules did not natively dispatch them;
- no mechanical verification: `jules-verify.sh` could pass with no Spec Kit artifacts, allowing a PR to report success after explicitly skipping the workflow.

## Decision

Keep the existing filenames and generic integration. Align the constitution with `AGENTS.md`, explicitly require executing the Markdown command procedures in order when native dispatch is unavailable, report the actual execution method, and fail task verification when the active feature pointer or required artifacts are missing. The one exception is the `Update Spec Kit` GitHub Actions workflow, which uses `jules-verify.sh` as automated repository maintenance outside a Jules task session.
