AGENTS.md — REPOSITORY GOVERNANCE

This file is the primary repository instruction for Freebuff. Read it before starting work and follow it throughout the task.

PROJECT PLATFORMS

Lucky Pick Canada uses GitHub for source control, repository management and pull requests, and Cloudflare for its production hosting and deployment. Follow the existing configurations and workflows for both platforms.

Production website: https://luckypickcanada.ca

PR submission: "PR_SUBMISSION.md" is mandatory. Read and follow it whenever preparing or submitting a pull request. It is the single source of truth for PR preparation, reporting, submission, handoff and the hard stop after submission. Do not duplicate its procedures in this file.

A — PREPARE AND PLAN

1. Understand the task. Identify the requested outcome, scope, restrictions and acceptance criteria. Follow the owner's instructions. Do not expand the task or introduce unrelated work.

2. Check existing work. Inspect the current branch, worktree, relevant files, Spec Kit artifacts, existing branches and PRs. Avoid duplicating active work or overwriting existing changes. Handle one active task per run.

3. Load project context. Read all four Memory Bank files once:
   
   - "memory-bank/projectBrief.md"
   - "memory-bank/activeContext.md"
   - "memory-bank/techContext.md"
   - "memory-bank/progress.md"

4. Select task groups. Review the available task-group instructions in ".freebuff/". Select the groups that apply to the task: creation, troubleshooting, polishing, testing, security, audio, deep-dive or SEO. Read and follow the instructions in the selected files. Do not force unrelated groups onto the task.

5. Find relevant project documentation. Read ".docs/manifest.json" to identify reference documents that apply to the task. Read only the documents you need. Do not load the entire library. Treat these documents as reference material, not automatic instructions. Keep ".docs/" read-only unless the owner authorizes changes.
   
   Keep a record of the task groups selected and the reference documents actually used. In the completion report, identify the selected groups, list the library documents that were useful to the task, and identify any Freebuff integrations and enabled skills used.

6. Check enabled skills. Check Freebuff's Settings → Skills. Use any enabled skills relevant to the task. Read their instructions before use. Confirm that any required tools are actually available.

7. Check integrations and tools. Confirm that required integrations and tools are available and operational. Use applicable integrations as needed for the task. Use the repository's Playwright CLI as the primary browser tool. Troubleshoot Playwright issues using the existing setup script and project instructions. If Playwright remains unavailable, use Browserless as the fallback for direct browser tasks.

8. Check applicable repository QA and validation requirements. Inspect the relevant workflows, configurations, scripts and referenced requirements. Identify their scope, triggers, qualifications, thresholds and pass/fail conditions. Treat those requirements as targets before implementation. Follow current repository definitions if documentation conflicts, and report any discrepancy. Do not silently change them.

9. Follow Spec Kit in order. Use the instructions in ".freebuff/cmds/speckit.*.md". Complete Specify, Plan and Tasks in sequence before implementation. Carry out the Implement stage in Section B, following the approved specification, plan and task list.

B — IMPLEMENT

1. Follow the approved plan. Implement the approved specification, plan and task list. Do not skip stages or introduce unapproved work.

2. Keep changes focused. Make the smallest correct change. Preserve existing functionality and unrelated artwork, visuals, wording, layout, navigation, audio, monetization, integrations and data boundaries.

3. Check the impact. Identify affected components, dependencies and workflows. Test related behaviour where changes could cause regressions.

4. Respect protected areas. Changes to protected governance, payment, database, authentication, security, hosting, deployment, environment or secrets configuration require the applicable owner approval.

5. Respect the build-size limit. The production build must remain strictly below 495 MiB. Consider the expected build impact during planning and measure the actual build size during verification. Complete as much of the requested task as can be safely delivered while staying below the limit. If the remaining work would bring the build to 495 MiB or higher, stop at a safe, complete point. Do not compromise functionality, security or quality to fit more work into the PR. Clearly document what was completed and what remains for a future task or PR. Never leave the application broken or in an incomplete state.

6. Use the correct production platform. The production platform is Cloudflare Pages. Follow the existing project configuration.

C — VERIFY AND SUBMIT

1. Verify the implementation. Run "./freebuff-verify.sh" and all applicable task-group checks, tests, builds, browser QA and integration checks.

2. Meet repository QA requirements. Confirm all applicable repository QA and validation requirements identified in Stage A have been addressed before PR submission.

3. Confirm build size. Measure the production build and confirm it remains strictly below 495 MiB, as required by B.5.

4. Submit the PR. Every task that authorizes repository changes must proceed directly from implementation and pre-submission verification to PR preparation and submission, following "PR_SUBMISSION.md". Opening the PR is a mandatory part of completing the task—not an optional follow-up. Do not stop after implementation, testing or a completion report, and do not wait for the owner to ask for a PR or give separate permission to open one. If a PR cannot safely be opened, report the exact blocker and preserve the completed work for owner direction. A repository-changing task is not complete until its PR has been successfully opened and handed off.

REPOSITORY QA AND VALIDATION

Applicable repository checks may cover:

- Security and code-quality requirements.
- Application builds and deployment-platform validation.
- Testing, type checking and visual regressions.
- Verification evidence and current-commit integrity.
- Authorization requirements for protected files.
- Scheduler, updater and maintenance changes.
- Supported-language code scanning.

Inspect the actual repository workflows, scripts, configurations and referenced requirements to determine which checks apply and what they require. Do not rely on this summary as a substitute for inspecting their current definitions.

External review applications provide advisory feedback only. They do not replace required repository checks.

PROJECT-WIDE TECHNICAL RULES

- Never weaken security, privacy, validation, authentication, CAPTCHA, Turnstile, rate limiting, duplicate protection or data integrity.
- Use Playwright as the primary browser automation tool. Use Browserless as the remote fallback for direct browser tasks. Automatic PR-checker workflows use Playwright, not Browserless.
- Use Firecrawl as the primary content-retrieval tool and Crawlbase as its fallback. Neither replaces browser rendering or end-to-end testing.
- Do not assume a skill or integration provides access to a tool that is not actually available.
- Avoid unnecessary side effects, paid usage and disclosure of sensitive information, credentials, API keys or secrets.
- Do not claim work or checks are complete without evidence.

NO EVIDENCE = NO CLAIM.

NO VERIFIED RESULT = NO VERIFIED COMPLETION.