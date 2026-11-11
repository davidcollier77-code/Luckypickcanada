# PR Submission and Handoff

This is the single source of truth for PR preparation, submission and handoff. Follow it after implementation and verification are complete.

## 1. Complete the work before submission

- Complete the authorized scope and required Spec Kit stages and artifacts.
- **Follow Section A.8 of `AGENTS.md`.** Inspect the applicable repository workflows, checkers, configurations and scripts. Identify their actual requirements and the issues they are designed to catch; do not rely on names or assumptions.
- Check the planned changes against those requirements before implementation. Check the completed changes and final diff against them again before submission. Respect protected files and repository boundaries. Do not change `AGENTS.md` unless explicitly authorized.
- Run `./freebuff-verify.sh` and applicable task-group tests or local checks when supported. These checks supplement, but do not replace, the checker-requirement review.
- Fix in-scope failures and unmet requirements. Record any local check that cannot run and the exact reason. Do not treat an environment limitation as an approval loop.
- **Do not wait for GitHub Actions, gatekeepers, automated reviewers or other PR-triggered checks.** Inspect their requirements and review your own work before submission. Post-submission results are for the owner.
- Review the complete diff and repository status. Confirm all changes belong to the task, no required file is missing, no unrelated work is included and no uncommitted changes remain.
- Confirm the branch contains one complete task result and targets the correct base (normally `main`). Do not submit partial or mixed-task work.
- Record the source branch, base branch and full 40-character HEAD SHA. Do not commit again after preparing the PR description.

In the PR description, distinguish **PASS — self-reviewed against documented checker requirements** from checks that actually executed. Mark PR-triggered checks **PENDING — runs after PR creation**. Never claim a workflow ran or passed unless its result was observed. Record actual local check results and explain any checks that could not run.

## 2. Prepare the complete PR description

Write the full PR body before creation. It is the canonical task summary and handoff report. Include all findings, evidence, limitations and remaining work. Do not depend on later comments, edits or separate reports.

Include these sections:

### Task and Scope
State the task goal, applicable task groups and brief reasons. List only specialist skills materially used.

### What Changed
Summarize what was completed and why. Do not present planned work as completed.

### Files Changed
List every changed file and its purpose. Match the final diff.

### Spec Kit and Library Reporting
- Identify the specify, plan, tasks and implement stages and link or give the paths to their actual artifacts.
- Preserve the existing Spec Kit, Memory Bank, task-group and skill reporting. Do not combine categories or claim stages that were not completed.
- Include a small table of individual `.docs/` library documents actually opened or consulted. Mark each Useful or Not useful and give a brief task-specific reason. Do not list unconsulted documents or modify `.docs/` for this report.

### Verification
List every applicable checker and local verification by actual name, status and concise evidence. Use only **PASS, FAIL, BLOCKED, PENDING, NOT RUN** or **N/A**. Explain every status other than PASS.

- Include applicable tests, type checks, builds, repository gates, browser/visual, security, performance, integration, branch-protection and other checks.
- For each applicable repository checker, identify the workflow, configuration or script inspected, summarize the requirements relevant to this change, and state how the completed work was checked against them. **PASS** here means self-reviewed against documented requirements; it does not mean the GitHub workflow ran.
- List commands actually run and their results separately. Never claim a command or test ran if it did not.
- Mark PR-triggered checks **PENDING — runs after PR creation**. Do not wait for them or imply they passed.
- Mark unavailable local checks BLOCKED or NOT RUN and give the exact reason. Do not mislabel environment limitations as product failures or dismiss genuine failures as flaky without evidence.

### Final Review and Preserved Behaviour
Confirm the complete diff was reviewed. Identify important behaviour, safeguards, visuals, integrations or data boundaries preserved, and summarize relevant findings and their disposition.

### Remaining Work and Follow-up
List incomplete or deferred scope, blockers, unavailable tools or dependencies, limitations and follow-up work requiring separate authorization or a new PR. State when none remain. Do not describe incomplete work as finished.

### Implementation and Verification Status
Report implementation and verification separately. Use **IMPLEMENTATION: COMPLETE** only when the requested scope and artifacts are complete and no known in-scope defect remains. Use **USEFUL RESULT: YES** only when the outcome and all mandatory pre-submission verification are supported by evidence. Otherwise state the limitation and use **USEFUL RESULT: NO**.

### Delivery
Record the source branch, target base and full 40-character intended PR HEAD SHA. State that the PR will be regular, non-draft, open and unmerged for the owner. Do not invent a PR number or URL before creation.

## 3. Submit once

Immediately before creation:

1. Confirm the source branch, base and full HEAD SHA match the prepared description.
2. Confirm the PR body is complete and accurate, including checker self-review, local results and limitations. Do not wait for post-submission checks.
3. Create exactly one regular, non-draft PR with the intended title, head, base and complete body.
4. Confirm from the creation result that it is open, unmerged, non-draft and uses the intended branches and HEAD SHA.

If a same-task PR already exists, do not create a duplicate. Stop and report it for owner direction; do not add work to or rewrite a previously submitted PR under this procedure.

## 4. Hard stop after submission

Successful creation of the complete, non-draft PR ends the agent's work. **Stop immediately.**

After creation, do not:
- Commit, push, amend or rebase.
- Edit the PR title or description.
- Add comments, review replies, status updates or supplemental reports.
- Wait for, poll, monitor, inspect or respond to CI, gatekeeper, tracker or automated-review results.
- Resume work because a check starts, finishes, fails or posts a finding.

Let GitHub Actions and external gatekeepers run independently. Any findings become a separately authorized task and a new PR. Do not repair or append them to the submitted PR.

The only final handoff is the PR number/link and recorded HEAD SHA. Disclose blockers in the PR body before creation. Do not merge, enable auto-merge or otherwise complete the PR. Leave it open and unmerged for the owner.

## 5. Submission recovery

- If branch selection, head/base, merge base or permissions prevent safe creation, diagnose the actual state and preserve all work.
- Never force-push, discard commits or rewrite history as a routine workaround.
- If safe recovery is not possible, do not submit. Report the exact error, branch/ref and relevant commit SHA for the owner.
