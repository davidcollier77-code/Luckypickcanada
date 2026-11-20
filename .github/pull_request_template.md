## Purpose, task goal and scope

Describe the problem, the intended outcome, the task goal and the scope boundaries. List the task groups selected from `.freebuff/` with a brief reason for each.

## What changed

Summarize what was actually completed and why. Do not describe planned work as completed.

## Files changed

List every changed file and its purpose. The list must match the final diff and the `file_purposes` entries below exactly.

## Pre-Submission Code Quality Review

Complete your personal pre-submission review — code quality, correctness, duplicate or redundant code, obvious errors, unnecessary complexity and potential security vulnerabilities — before opening this PR. Keep this exact declaration only after completing it:

Pre-Submission Code Quality Review: VERIFIED — Pre-check completed before PR submission.

## QA Scope Declaration

Keep the markers and JSON structure. List every intended changed path exactly and add one `file_purposes` entry explaining the intended work in that file. The checker requires the purposes and paths to match exactly. If the diff adds an unlisted file, the scope checker blocks until the path, purpose and expansion reason are added and the repository owner approves the exact expansion digest in a PR comment.

<!-- qa-scope:start -->
{
  "version": 1,
  "summary": "",
  "features": [],
  "paths": [],
  "file_purposes": [],
  "shared_dependencies": [],
  "visual_baseline_updates": [],
  "scope_expansion": [],
  "governance_changes": [],
  "visual_impact": null,
  "browser_evidence": []
}
<!-- qa-scope:end -->

### Scope changes

If the diff expands beyond the original task, add a line in this description that begins with the exact words **Scope changed**, followed by a specific explanation of what was added or changed. Also add the exact path and reason under `scope_expansion` and the path plus purpose to `paths` and `file_purposes`.

"Scope changed" is a description requirement, not an approval. The expansion still needs the repository-owner comment emitted by the checker: `/approve-scope <digest>`. Any new commit or description edit invalidates a prior digest approval.

### Explicit approval commands

Only the repository owner can authorize an expansion by posting the exact command emitted by the check:

- Scope expansion: `/approve-scope <digest>`
- Visual baseline update: `/approve-visual-baselines <digest>`
- Governance change: `/approve-governance <digest>`

The approval digest is bound to the current PR head SHA, the complete PR description text, features, exact paths, per-file purposes, shared dependencies, and the relevant baseline/scope/governance entries. Editing the PR description is not approval. Protected-file and Agent MD authorization checks remain separate and mandatory.

### Protected file authorization

Required only when the assigned task explicitly authorizes changes to protected files. Detection, the environment-protected human approval gate and fail-closed behaviour remain mandatory; this declaration never replaces that gate, and it is never inferred from the title or description.

<!-- Add the exact line below as plain text only when the task explicitly authorizes the protected-file change. It is guidance inside an HTML comment and does not count as the declaration while it stays here.
Human Authorization: APPROVED — Protected-file changes are explicitly authorized by the user as part of the assigned task.
-->

### Visual impact, baselines and browser evidence

`visual_impact` is optional. When present, use an object such as `{"required": true, "reason": "Changes the homepage hero layout and animation"}`. A required declaration forces the automated Visual QA workflow even when path detection would not require it. A non-visual declaration on a path-classified visual change is surfaced as a reviewer warning.

Playwright runs automatically when required, and both shards are reported inside the QA Checker category. **Submitters are not required to run Playwright, take screenshots or provide manual browser evidence.** `browser_evidence` remains an optional array; if you choose to supply a reference, name the tool that actually ran (Playwright, Firecrawl or Browserless) and link its run, trace or artifact. Do not relabel one tool's evidence as another.

List only the screenshot files intentionally changed under `visual_baseline_updates`. Every baseline change needs an owner `/approve-visual-baselines <digest>` comment, must be limited to the affected feature and viewport, and must preserve unrelated baselines with the old image available in the diff/history.

### Governance changes

If governance files are intentionally changed, list each exact file and a reason under `governance_changes`, and obtain `/approve-governance <digest>`. The separate protected-file / Agent MD authorization workflow still has to pass.

## Spec Kit and Library Reporting

Complete every line. The automated Governance and Workflow Verification category checks that these declarations are present and that the declared Spec Kit artifacts appear in this PR's diff.

**Spec Kit stages completed:** replace with the completed stages and their artifact links (specify, plan, tasks, implement).
**Spec Kit artifact paths:** replace with the exact `specs/<feature>/spec.md`, `specs/<feature>/plan.md` and `specs/<feature>/tasks.md` paths (or the `.specify/features/<feature>/` equivalents).
**Task groups selected:** replace with the applicable `.freebuff/<group>.md` files and why each applies.
**Library documents consulted:** replace with a small table of `.docs/` documents actually consulted, marking each Useful or Not useful with a task-specific reason, or state that none applied.
**Memory Bank:** replace with the `memory-bank/` files read and how they informed this task.

These declarations are the submitter's report. The consolidated verification report does not claim to have independently verified Library document use or Memory Bank reading.

## Verification

Record the checks actually run, their results, and any skipped or blocked checks. Distinguish application/test failures, scanner findings, flaky results and infrastructure failures.

- Use only **PASS**, **FAIL**, **BLOCKED**, **PENDING**, **NOT RUN** or **N/A**, and explain every status other than PASS.
- Include local tests, type check, build and the measured production build size (it must be strictly below 495 MiB), plus every applicable repository checker you reviewed.
- Mark PR-triggered checks **PENDING — runs after PR creation**. Do not wait for them before opening the PR and do not report them as passed.
- The consolidated seven-category report uses only **PASSED**, **FAILED**, **WARNING** and **NOT RUN**, and reports the current-head results afterwards for the QA Checker, DevSkim, Dependabot, PR Scope Verification, Protected File Changes, Verification Integrity and Governance and Workflow Verification. Those results are not yours to pre-fill.

## Remaining work and handoff

List incomplete or deferred scope, blockers, unavailable tools or dependencies, limitations and follow-up work requiring separate authorization or a new PR. State when none remain, and hand off the PR with a clear statement of what the automated workflows still need to prove.

## Out of scope

List adjacent features or files that must remain unchanged.
