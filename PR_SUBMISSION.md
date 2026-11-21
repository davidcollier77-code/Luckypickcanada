# PR Submission and Handoff

This is the single source of truth for PR preparation, submission and handoff.

Read it twice for every repository-changing task:

1. **Before implementation begins**, together with the applicable QA checker requirements in Section 9 of `AGENTS.md`. The declarations, protected-file rules and required code-quality review below must shape the task scope, plan and implementation instead of being discovered at submission time.
2. **Immediately before creating the pull request**, as the final submission checklist. Re-read Section 2 and Section 4 and confirm the complete PR body contains every required declaration and result.

The repository's automated PR verification has exactly seven checker categories: **QA Checker**, **DevSkim**, **PR Scope Verification**, **Protected File Changes**, **Verification Integrity**, **Governance and Workflow Verification** and **Dependency Health & Vulnerability Review**. One consolidated report publishes all seven on the pull request, with the statuses `PASSED`, `FAILED`, `WARNING` or `NOT RUN`. Visual QA, the full test suite, the type check, the build and both Playwright shards are supporting results inside the QA Checker category; they are never separate top-level categories.

Dependabot remains the scheduled weekly updater for npm/pnpm and GitHub Actions; its configuration is unchanged. Its status is reported as context inside the Dependency Health & Vulnerability Review category, which runs on every pull request and does not depend on a Dependabot update having run.

## 1. Complete the work before submission

- Complete the authorized scope and required Spec Kit stages and artifacts.
- **Follow Section 8 of `AGENTS.md`.** Inspect the applicable repository workflows, checkers, configurations and scripts. Identify their actual requirements and the issues they are designed to catch; do not rely on names or assumptions.
- Check the planned changes against those requirements before implementation. Before submission, independently review the completed implementation and complete diff against every applicable checker requirement again. Resolve unmet in-scope requirements or record the exact blocker. CI results do not replace this review. Respect protected files and repository boundaries. Do not change `AGENTS.md` unless explicitly authorized.
- Run `./freebuff-verify.sh` and applicable task-group tests or local checks when supported. These checks supplement, but do not replace, the checker-requirement review.
- Fix in-scope failures and unmet requirements. Record any local check that cannot run and the exact reason. Do not treat an environment limitation as an approval loop.
- **Do not wait for GitHub Actions, gatekeepers, automated reviewers or other PR-triggered checks.** Inspect their requirements and review your own work before submission. Post-submission results are for the owner.
- Review the complete diff and repository status. Confirm all changes belong to the task, no required file is missing, no unrelated work is included and no uncommitted changes remain.
- Confirm the branch contains one complete task result and targets the correct base (normally `main`). Do not submit partial or mixed-task work.
- Record the source branch, base branch and full 40-character HEAD SHA. Do not commit again after preparing the PR description.

In the PR description, distinguish **PASS — self-reviewed against documented checker requirements** from checks that actually executed. Mark PR-triggered checks **PENDING — runs after PR creation**. Never claim a workflow ran or passed unless its result was observed. Record actual local check results and explain any checks that could not run.

The PR description is the submitter's task summary and handoff: it contains the declarations, scope declaration and required documentation. The automated workflow publishes the checker results for the current head. Do not copy automated results into the description as if the submitter produced them, and do not open the PR with an incomplete description in expectation of filling it in later.

## 2. Prepare the complete PR description

Write the full PR body before creation. It is the canonical task summary and handoff report. Include all findings, evidence, limitations and remaining work. Do not depend on later comments, edits or separate reports.

Include every section below. `.github/pull_request_template.md` follows this structure.

### Purpose, Task Goal and Scope

Describe the problem, the intended outcome, the task goal, the applicable task groups with brief reasons, and the scope boundaries. List only specialist skills materially used.

### What Changed

Summarize what was actually completed and why. Do not present planned work as completed.

### Files Changed

List every changed file and its purpose. The list must match the final diff and the structured `file_purposes` entries exactly.

### Pre-Submission Code Quality Review

Complete a personal pre-submission code quality review **before opening the PR**. The review must cover:

- code quality;
- correctness;
- duplicate or redundant code;
- obvious errors;
- unnecessary complexity;
- potential security vulnerabilities.

The PR description must contain this exact declaration, character for character:

```text
Pre-Submission Code Quality Review: VERIFIED — Pre-check completed before PR submission.
```

The automated QA Checker verifies that the exact declaration is present. Its presence is the submitter's attestation; it is not proof that the review was actually performed, and the report never claims otherwise.

### QA Scope Declaration

Keep the existing `<!-- qa-scope:start -->` and `<!-- qa-scope:end -->` markers and the complete JSON structure with these fields: `version`, `summary`, `features`, `paths`, `file_purposes`, `shared_dependencies`, `visual_baseline_updates`, `scope_expansion`, `governance_changes`, `visual_impact` and `browser_evidence`.

- List every changed path exactly; directory-wide wildcards are rejected.
- Add one `file_purposes` entry per declared path. The checker requires the declared paths and purposes to match exactly.
- Declare shared dependencies, visual baseline updates and governance changes honestly.
- `visual_impact` is optional metadata. `{"required": true, "reason": "..."}` forces the automated Visual QA workflow to run; `{"required": false, "reason": "..."}` on a path-classified visual change is surfaced as a reviewer warning.
- `browser_evidence` is optional and is **never required from the submitter**. Playwright runs automatically when required. Do not run a browser, take screenshots or supply manual visual-verification evidence unless the task explicitly asks for it. Any optional reference supplied must name the tool that actually ran (Playwright, Firecrawl or Browserless) and link its run, trace or artifact.

### Scope Changes

If the diff expands beyond the original task, add a line to the PR description that begins with the exact words **Scope changed**, followed by a specific explanation of what was added or changed, and:

1. add the exact path and rationale under `scope_expansion`;
2. add that path and its purpose to `paths` and `file_purposes`;
3. obtain the repository-owner approval comment `/approve-scope <digest>` emitted by the checker.

The words "Scope changed" are a description requirement, not an approval. A scope expansion is never accepted merely because the submitter describes it, and a new commit or PR-description edit invalidates a prior digest approval.

### Protected File Changes

When the task explicitly authorizes changes to protected files, the PR description must contain this exact declaration, character for character:

```text
Human Authorization: APPROVED — Protected-file changes are explicitly authorized by the user as part of the assigned task.
```

This declaration is required in addition to — never instead of — the existing environment-protected human authorization gate. It is not inferred from a PR title, branch name or narrative description. Protected-file detection remains fail-closed, and the owner approval gate remains mandatory before merge.

### Explicit Approval Commands

Only the repository owner can authorize an expansion by posting the exact command emitted by the check:

- Scope expansion: `/approve-scope <digest>`
- Visual baseline update: `/approve-visual-baselines <digest>`
- Governance change: `/approve-governance <digest>`

The approval digest is bound to the current PR head SHA, the complete PR description text, features, exact paths, per-file purposes, shared dependencies, and the relevant baseline/scope/governance entries. Any new commit or PR description edit invalidates prior digest approvals. Editing the PR description is not approval. Protected-file and Agent MD authorization checks remain separate and mandatory.

### Visual Baseline Changes

List only the screenshot files intentionally changed under `visual_baseline_updates`. Every baseline change needs an owner `/approve-visual-baselines <digest>` comment. The update must be limited to the affected feature and viewport; preserve unrelated baselines and keep the old image available in the PR diff/history.

Automated Visual QA runs both Playwright shards against the committed baselines. Submitters are not required to update, regenerate or verify baselines manually.

### Governance Changes

If governance files are intentionally changed, list each exact file and a reason under `governance_changes`, then obtain `/approve-governance <digest>`. The separate protected-file / Agent MD authorization workflow still has to pass.

### Spec Kit and Library Reporting

- Identify the specify, plan, tasks and implement stages and give the paths to their actual artifacts (for example `specs/<feature>/spec.md`, `plan.md` and `tasks.md`, or the existing `.specify/features/<feature>/` layout). Do not claim a stage that was not completed. The automated governance check confirms that the declared `spec.md`, `plan.md` and `tasks.md` appear in this PR's diff.
- Preserve the existing Spec Kit, Memory Bank, task-group and skill reporting. Do not combine categories.
- State the task groups selected from `.freebuff/` and why they apply.
- Include a small table of individual `.docs/` library documents actually opened or consulted. Mark each Useful or Not useful and give a brief task-specific reason. Do not list unconsulted documents or modify `.docs/` for this report.
- Record the Memory Bank files read and how they informed the work.

Governance reporting in the PR description is the submitter's declaration. The consolidated report reports what is declared and whether the declared Spec Kit artifacts appear in the diff; it does not claim to have independently verified anything that only a declaration can support.

### Verification

List every applicable checker and local verification by actual name, status and concise evidence. Use only **PASS, FAIL, BLOCKED, PENDING, NOT RUN** or **N/A**. Explain every status other than PASS.

- Include applicable tests, type checks, builds, repository gates, browser/visual, security, performance, integration, branch-protection and other checks.
- For each applicable repository checker, identify the workflow, configuration or script inspected, summarize the requirements relevant to this change, and state how the completed work was checked against them. **PASS** here means self-reviewed against documented requirements; it does not mean the GitHub workflow ran.
- List commands actually run and their results separately. Never claim a command or test ran if it did not.
- Mark PR-triggered checks **PENDING — runs after PR creation**. Do not wait for them or imply they passed.
- Mark unavailable local checks BLOCKED or NOT RUN and give the exact reason. Do not mislabel environment limitations as product failures or dismiss genuine failures as flaky without evidence.
- Record the measured production build size and confirm it is strictly below 495 MiB. If the measurement could not be performed, mark it unverified and explain what remains.
- Record outstanding limitations and remaining work, and hand off the PR with a clear statement of what the automated workflows still need to prove.

### Final Review and Preserved Behaviour

Confirm the complete diff was reviewed. Identify important behaviour, safeguards, visuals, integrations or data boundaries preserved, and summarize relevant findings and their disposition.

### Remaining Work and Follow-up

List incomplete or deferred scope, blockers, unavailable tools or dependencies, limitations and follow-up work requiring separate authorization or a new PR. State when none remain. Do not describe incomplete work as finished.

### Implementation and Verification Status

Report implementation and verification separately. Use **IMPLEMENTATION: COMPLETE** only when the requested scope and artifacts are complete and no known in-scope defect remains. Use **USEFUL RESULT: YES** only when the outcome and all mandatory pre-submission verification are supported by evidence. Otherwise state the limitation and use **USEFUL RESULT: NO**.

### Delivery

Record the source branch, target base and full 40-character intended PR HEAD SHA. State that the PR will be regular, non-draft, open and unmerged for the owner. Do not invent a PR number or URL before creation.

## 3. What the automated verification report does

After the PR exists, the **PR Verification Report** workflow publishes one consolidated sticky comment and updates it in place on later runs. It always describes the current PR HEAD SHA. It contains exactly these seven categories:

| # | Category | Responsibility |
| --- | --- | --- |
| 1 | QA Checker | Exact pre-submission declaration; automated changed-code review; test quality; performance/resource cleanup; full unit suite; TypeScript check; production build and build-size gate; both Playwright shards and automated visual results as supporting evidence |
| 2 | DevSkim | DevSkim security scan result, suppression handling, SARIF processing, Security-tab upload and open code-scanning alerts |
| 3 | PR Scope Verification | Exact-path declaration, per-file purposes, scope-expansion wording and owner approval digests, optional visual metadata |
| 4 | Protected File Changes | Protected-file detection, required authorization declaration, and the separate human authorization gate result |
| 5 | Verification Integrity | Whether the results belong to the exact current HEAD SHA; missing, skipped, cancelled, incomplete, stale or outdated results are never reported as passed |
| 6 | Governance and Workflow Verification | Spec Kit stages and artifact evidence, selected task group, Library documents consulted and Memory Bank reporting |
| 7 | Dependency Health & Vulnerability Review | Runs on every PR: changed dependency manifests and lockfiles are checked for consistency and for matching open dependency advisories; unrelated or unchanged outdated dependencies are context only and never fail the PR; the weekly Dependabot schedule is unchanged and not required to have run |

Statuses are exactly **PASSED**, **FAILED**, **WARNING** and **NOT RUN**. Every failure, warning or unrun result is explained with what needs attention. Visual QA and Visual QA Summary never appear as extra top-level categories: their results belong to QA Checker, and both Playwright shards remain visible as supporting evidence.

The workflows publish the real results; the submitter must not invent, pre-fill or claim them. The PR description's own verification section records local command results and marks PR-triggered checks **PENDING**, not passed.

## 4. Submit once

Immediately before creation, re-read this document as the final submission checklist, then:

1. Confirm the source branch, base and full HEAD SHA match the prepared description.
2. Confirm the PR body is complete and accurate, including every required declaration, the QA scope declaration, the Spec Kit/library/Memory Bank reporting, local results and limitations. Do not wait for post-submission checks.
3. Create exactly one regular, non-draft PR with the intended title, head, base and complete body.
4. Confirm from the creation result that it is open, unmerged, non-draft and uses the intended branches and HEAD SHA.

If a same-task PR already exists, do not create a duplicate. Stop and report it for owner direction unless the repository owner directly instructs you to continue or make specified changes to that existing PR. Such an instruction authorizes only the stated work and does not waive scope declarations, protected-file authorization, checker requirements or other repository gates.

## 5. Hard stop after submission

Successful creation of the complete, non-draft PR ends the agent's work. **Stop immediately.**

**Owner-directed exception:** The repository owner may directly instruct the agent to continue work on, or make specified changes to, an already-submitted PR. This must be a clear instruction from the repository owner; the agent must never infer permission from the PR remaining open, comments, CI results, review findings or any other circumstance. The exception authorizes only the work expressly directed. It does not waive scope declarations, required owner-approval comments, protected-file authorization, QA checks or any other repository gate. After completing the expressly authorized changes and updating the PR handoff, stop again. Do not create a duplicate PR.

After creation, do not:

- Commit, push, amend or rebase.
- Edit the PR title or description.
- Add comments, review replies, status updates or supplemental reports.
- Wait for, poll, monitor, inspect or respond to CI, gatekeeper, tracker or automated-review results.
- Resume work because a check starts, finishes, fails or posts a finding.

Let GitHub Actions and external gatekeepers run independently. Any findings become a separately authorized task and a new PR. Do not repair or append them to the submitted PR.

The consolidated seven-category report and every other PR-triggered check run independently after creation. Their results are the owner's to review. The only final handoff is the PR number/link and recorded HEAD SHA. Disclose blockers in the PR body before creation. Do not merge, enable auto-merge or otherwise complete the PR. Leave it open and unmerged for the owner.

## 6. Submission recovery

- If branch selection, head/base, merge base or permissions prevent safe creation, diagnose the actual state and preserve all work.
- Never force-push, discard commits or rewrite history as a routine workaround.
- If safe recovery is not possible, do not submit. Report the exact error, branch/ref and relevant commit SHA for the owner.
