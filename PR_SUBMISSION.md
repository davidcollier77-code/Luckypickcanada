# PR Submission and Handoff

This file is the single source of truth for preparing and submitting a pull request. Follow it after implementation and verification are complete. AGENTS.md directs agents here at the PR handoff stage.

## 1. Complete the work before submission

- Finish the authorized scope and all required Spec Kit stages and artifacts.
- Follow the Gatekeeper preflight in AGENTS.md: inspect the actual workflows and related scripts for each gatekeeper the changed paths may trigger. Understand their inputs, checks, thresholds, triggers, and failure conditions before finalizing the work.
- Run ./freebuff-verify.sh, the checks required by the selected task groups, and every other applicable check that can be run before PR creation. Complete browser/visual QA when required.
- Fix in-scope failures. Do not submit while an applicable mandatory pre-submission check is failed, blocked, or not run. Resolve environment/tooling blockers or obtain an approved, documented alternative before submitting.
- Review the complete final diff and repository status. Confirm every changed file belongs to this task, no intended file is missing, no unrelated work is included, and no uncommitted changes remain.
- Confirm the source branch contains one complete, stable task result and targets the correct base branch (normally main, unless the task specifies another base). Do not submit a partial or mixed-task branch.
- Record the exact source branch, base branch, and full 40-character commit SHA at the source branch tip. That commit is the intended PR HEAD. Do not make another commit after preparing the description.

PR-triggered workflows that cannot run until a PR exists are the only checks that may be listed as pending at creation. Record them as pending because they have not run yet; do not claim they passed. Their automatic trigger is not permission to skip equivalent checks that can be run before submission.

## 2. Prepare one complete PR description

The PR body is the single canonical task summary. Write the entire description before creating the PR. Do not rely on later comments, body edits, or separate reports to complete it.

Use concise sections and include all of the following:

### Task and Scope

State the task goal and the applicable task groups, with a brief reason for each. List only specialist skills materially used.

### What Changed

Summarize the completed changes and their purpose. Be specific about the delivered result; do not include planned work as completed work.

### Files Changed

List the exact files changed and give a short purpose for each. Reconcile the list against the final diff.

### Spec Kit and Library Reporting

- Name the specify, plan, tasks, and implement stages and give the paths to their actual artifacts.
- Preserve the existing Spec Kit, Memory Bank, task-group, and skill reporting. Do not merge these categories or invent stage completion.
- Include a small table for individual .docs/ library documents only. List only documents actually opened or consulted, mark each Useful or Not useful, and give one brief task-specific reason. Do not list unconsulted documents or unrelated resources. Do not modify .docs/ for this reporting requirement.

### Verification

For every applicable check, provide the actual command or workflow name, status, and concise evidence. Use only these statuses: PASS, FAIL, BLOCKED, PENDING, NOT RUN, or N/A, with a reason for every status other than PASS.

- Include test, type-check, build, repository-gate, browser/visual, security, performance, integration, or other checks when applicable.
- Distinguish local checks completed before submission from PR-triggered workflows that will start automatically after creation.
- Mark a PR-only check PENDING — automatically triggered by PR creation until it actually runs. Never imply that a pending, skipped, or unrun check passed.
- Do not call an environmental/tooling block a product failure or dismiss a genuine failure as flaky without evidence.

### Final Review and Preserved Behaviour

State that the complete final diff was reviewed and describe important behaviour, safeguards, visuals, integrations, or data boundaries that were intentionally preserved. Include relevant self-review findings and their dispositions.

### Remaining Work and Follow-up

List every incomplete in-scope item, deferred item, blocker, unavailable dependency/tool, limitation, and follow-up requiring a separate task or PR. State clearly when no further work is required. Never describe incomplete work as finished.

### Implementation and Verification Status

Report implementation status separately from verification status. Claim IMPLEMENTATION: COMPLETE only when the requested scope and required task artifacts are complete and no known in-scope defect remains. Claim verified completion or USEFUL RESULT: YES only when the requested outcome and all applicable mandatory pre-submission verification are supported by evidence. Otherwise state the exact limitation and use USEFUL RESULT: NO.

### Delivery

Record the source branch, target base branch, and full 40-character intended PR HEAD SHA. State that the PR is to be created as a regular, non-draft pull request and left open and unmerged for the owner. The PR URL and number are returned by GitHub when creation succeeds; do not reserve blank placeholders or claim a PR exists before it is created.

## 3. Submit once with a stable head

Immediately before creation:

1. Reconfirm the source branch, target base, and full HEAD SHA match the prepared PR description.
2. Confirm the complete PR body is final and all required pre-submission checks have their actual results recorded.
3. Create exactly one regular, non-draft PR with that head, base, title, and complete body.
4. Use the creation result to confirm the PR was created open, unmerged, non-draft, and against the intended branches and HEAD SHA.

If a same-task PR already exists, do not create a duplicate. Do not add work to or rewrite a previously submitted PR under this procedure; stop and report the existing PR for owner direction.

## 4. Hard stop after successful submission

Successful creation of the complete, non-draft PR is the end of the agent's work. Stop immediately.

After submission, do not:
- Add commits, push changes, amend or rebase the source branch.
- Edit the PR title or description.
- Add comments, review replies, status updates, or supplemental reports.
- Wait for, poll, monitor, inspect, or respond to CI, gatekeeper, tracker, or automated-review results.
- Resume work because a check starts, finishes, fails, or posts a finding.

GitHub Actions and external gatekeepers may run automatically after creation. Let them run without agent intervention. Any issue they identify becomes a separately authorized follow-up task and a new PR; do not repair or append it to the submitted PR.

The agent's only final handoff is the PR number/link and recorded HEAD SHA, with blockers already disclosed in the PR body. Do not merge, enable auto-merge, or otherwise complete the PR; leave it open and unmerged for the human owner.

## 5. Submission recovery

- If the branch, head/base selection, merge base, or permissions prevent safe creation, diagnose the actual state and preserve all work.
- Never force-push, discard commits, or use history rewriting as a routine workaround.
- If safe recovery is not possible, do not submit. Report the exact command/error, branch/ref, and relevant commit SHA so the owner can decide the next step.
