# Evidence — Freebuff Playwright Agent Guidance

## Source Review

- Confirmed the repository-pinned interactive launcher is `./scripts/playwright-cli.sh`.
- Confirmed Option A is `pnpm exec playwright test` using `playwright.config.ts`.
- Confirmed Option B is `pnpm exec playwright test --config=playwright.swiftshader.config.ts`, which forces ANGLE/SwiftShader, uses one worker and no retries, and is intended for software-rendered graphics investigations.
- Confirmed README.md already documents the lengthy Freebuff startup procedure; this change does not duplicate it.
- Confirmed the AGENTS.md protection workflow requires a dedicated governance PR and owner authorization before merge.

## Change Scope

- Updated AGENTS.md only within the new Playwright guidance section.
- Extended the existing governance regression test with assertions for the new section.
- Did not change Playwright scripts, browser setup, Playwright configurations, application code or README.md. The protected-file authorization workflow was later corrected in the owner-authorized continuation documented below.

## Verification Status

- **PASS — source review:** Existing launcher and both Playwright mode commands were confirmed from repository files.
- **PASS — scope review:** Changed implementation scope is limited to AGENTS.md and its existing governance test; supporting Spec Kit and Memory Bank records are task documentation.
- **NOT RUN — focused Vitest:** No shell-capable repository checkout is available through the connected GitHub editing interface.
- **NOT RUN — freebuff-verify.sh:** It was not run in that GitHub editing session. The current `AGENTS.md` §6 permits this verification script when its prerequisites and safety conditions are met; its frozen install and project checks require the repository-pinned Node.js 26.x / pnpm 10.30.3 toolchain.
- **PENDING — PR workflows:** Run independently after PR creation; no result is claimed here.

## Owner-Authorized QA Governance Continuation — PR #1908

- The repository owner directly authorized continuation of PR #1908 to consolidate QA-checker requirements, require independent pre-submission self-review and add a direct-human-instruction exception to the post-submission hard stop.
- Removed the duplicate QA-planning paragraph from the earlier Stage A sequence and removed the duplicate generic QA summary section; the dedicated `QA CHECKER REQUIREMENTS — BEFORE TASK SPECIFICATION` section is the single planning-stage source.
- Updated AGENTS.md Section C to require a separate final checker-requirement review of the completed implementation and complete diff. Updated PR_SUBMISSION.md to point to Section A.8, repeat the required independent review at submission, and clarify that CI status does not replace it.
- Updated PR_SUBMISSION.md hard-stop wording so only a clear, direct repository-owner instruction permits specified continuation on an already-submitted PR. The exception does not waive scope declarations, owner approvals, protected-file authorization, QA checks or other gates; the agent stops again after the authorized work and handoff.
- Extended the existing governance regression test to assert the single-source QA section, final review requirement, owner exception and rejection of inferred permission. Test execution remains NOT RUN in this GitHub editing session; no pass is claimed.
- Reviewed the applicable scope checker and protected-file classifier definitions. The PR requires a current-head `/approve-governance <digest>` comment and the independent `protected-file-authorization` environment approval. The owner instruction in this conversation authorizes the work but is not a substitute for those repository gates.
- No application, browser, Playwright runtime, CI workflow, README, visual asset or production build input was changed.

## Current Verification and Delivery

- **PASS — source review:** Applicable checker requirements were inspected from their definitions and relevant tests, not inferred from workflow names.
- **PASS — diff/scope review:** PR changed-file inventory reconciled to the exact manifest recorded in the PR body after documentation updates.
- **NOT RUN — focused Vitest:** No shell-capable repository checkout is available in this GitHub editing session.
- **NOT RUN — `freebuff-verify.sh`:** It was not run in that GitHub editing session. Current `AGENTS.md` §6 does not prohibit ChatGPT from inspecting or running the script when prerequisites are met; the script's project install, tests and build require Node.js 26.x / pnpm 10.30.3.
- **PENDING — PR-triggered checks:** No current-head CI result is represented as passing.
- **PENDING — owner governance approval:** Requires the exact current-head `/approve-governance` comment.
- **PENDING — protected-file authorization:** Requires the configured human environment approval before merge.

## Protected-File Workflow Regression Follow-up

- The first PR-triggered run exposed a Bash parsing defect: tab is IFS whitespace, so a row with an empty `previous_filename` shifted GitHub's `status` value into the previous-path field. The classifier then treated values such as `added` and `modified` as paths and rejected the dedicated governance PR.
- The workflow now reads the GitHub file records as NUL-delimited fields. NUL cannot occur in a repository path, and the loop preserves an empty previous filename without shifting the status field. Non-renames are passed to the classifier as one path; renames retain the existing tab-separated two-path format.
- Added regression coverage for an empty previous-path field and for the workflow's NUL-delimited parsing contract. This change preserves fail-closed behaviour and does not alter protected-file matching or human authorization.
- The root-level Spec Kit evidence record is moved to `specs/164-playwright-agentmd-guidance/evidence/qa-governance-continuation.md`, matching the classifier's existing allowed evidence-record pattern. No classifier exception or broader path allowance is added.
- The first CI run also confirmed the changed-code review had zero hard findings and zero advisory warnings. The scope approval remains separate and pending; the protected-file authorization will be re-evaluated after this fix.
