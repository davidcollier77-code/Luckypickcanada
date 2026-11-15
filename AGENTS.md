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

6. Check enabled skills. Check Freebuff's Settings → Skills. Use any enabled skills relevant to the task and read their instructions before use. Confirm that any required tools are actually available.
   
   For any task involving Playwright, browser testing, visual QA, performance or rendering profiling, WebGL/WebGPU inspection, or graphics work, read both of these repository files before using or modifying the Playwright setup:
   
   - ".agents/skills/playwright-cli/SKILL.md"
   - ".agents/skills/playwright-cli/references/lucky-pick-canada.md"
   
   Follow their documented CLI commands, wrapper, installation, browser-runtime and setup conventions. Preserve the existing Playwright configuration and keep Standard and SwiftShader testing modes separate. Do not introduce a competing CLI or browser automation setup.

7. Check integrations and tools. Confirm that required integrations and tools are available and operational. Use applicable integrations as needed for the task. Use the repository's Playwright CLI as the primary browser tool. Troubleshoot Playwright issues using the existing setup script and project instructions. If Playwright remains unavailable, use Browserless as the fallback for direct browser tasks.

QA CHECKER REQUIREMENTS — BEFORE TASK SPECIFICATION

Before writing or approving a task specification for work that may be checked by repository QA infrastructure, inspect the applicable QA checker requirements first. This is a task-planning input, not a step to defer until implementation or pre-submission review.

- Identify the workflows, checker scripts, configurations, test suites and written requirements that will evaluate the proposed changes.
- Understand what each applicable checker is designed to detect, enforce or prevent, including its scope, triggers, required inputs, evidence, thresholds, approval conditions and pass/fail behaviour.
- Determine which changed files, application behaviours, safeguards and evidence the checkers will examine. Do not infer their purpose from workflow or script names; inspect their actual definitions and relevant tests.
- Use those requirements when defining the task's scope, constraints, implementation approach, acceptance criteria and verification plan. The task must be designed to satisfy the applicable checks, not discover their expectations after implementation.
- Identify gaps, conflicts, unclear requirements or checker changes needed to support the task. Record them in the specification and raise material conflicts with the owner before implementation.
- Do not weaken, bypass, suppress or redefine an existing check merely to make a task pass. Any proposed change to checker requirements must be explicit, separately justified and authorized where protected files or governance are involved.

8. Follow Spec Kit. Review and follow all nine command definitions in ".freebuff/cmds/speckit.*.md", together with their applicable instructions, current templates and project-constitution requirements. The repository's checked baseline is Spec Kit 1.4.0: four core stages—Specify, Plan, Tasks and Implement—and five supporting commands—Clarify, Analyze, Checklist, Constitution and Converge.
   
   Complete the four core stages in that order for every repository-changing task. Finish Specify, Plan and Tasks before implementation; carry out Implement in Section B using the approved specification, plan and task list. Complete every required section, field and group in each applicable template. Complete conditional sections when they apply. Use optional sections and artifacts only when their instructions or the task call for them; do not invent content or leave required content incomplete. Follow the supporting command definitions when they apply, but do not mechanically run all five supporting commands on every task.
   
   Before starting the workflow, check the installed Spec Kit version, all nine available command definitions, the core-stage names and order, and the required template sections and groups against this baseline. If the version, command set, stages, sequence or required groups change, notify the owner and explain what changed and how it affects our workflow. You are authorized to make the necessary surgical update to AGENTS.md to keep it aligned with the current Spec Kit workflow. Limit the edit strictly to the affected wording, preserve all unrelated governance and requirements, and report exactly what changed. Do not silently change the established workflow.

B — IMPLEMENT

1. Follow the approved plan. Implement the approved specification, plan and task list. Do not skip stages or introduce unapproved work.

2. Keep changes focused. Make the smallest correct change. Preserve existing functionality and unrelated artwork, visuals, wording, layout, navigation, audio, monetization, integrations and data boundaries.

3. Check the impact. Identify affected components, dependencies and workflows. Test related behaviour where changes could cause regressions.

4. Respect protected areas. Changes to protected governance, payment, database, authentication, security, hosting, deployment, environment or secrets configuration require the applicable owner approval.

5. Respect the build-size limit. The production build must remain strictly below 495 MiB. Consider the expected build impact during planning and measure the actual build size during verification. Complete as much of the requested task as can be safely delivered while staying below the limit. If the remaining work would bring the build to 495 MiB or higher, stop at a safe, complete point. Do not compromise functionality, security or quality to fit more work into the PR. Clearly document what was completed and what remains for a future task or PR. Never leave the application broken or in an incomplete state.

6. Use the correct production platform. The production platform is Cloudflare Pages. Follow the existing project configuration.

C — VERIFY AND SUBMIT

1. Verify the implementation. Run "./freebuff-verify.sh" and all applicable task-group checks, tests, builds, browser QA and integration checks.

2. Complete the final checker-requirement review. Before submission, review the completed implementation and complete diff against every applicable checker requirement identified in A.8 and documented in "PR_SUBMISSION.md". Resolve unmet in-scope requirements or record the exact blocker. A passing or pending CI result does not replace this independent review.

3. Confirm build size. Measure the production build and confirm it remains strictly below 495 MiB, as required by B.5.

4. Submit the PR. Every task in which the owner authorizes repository changes must proceed directly from implementation and pre-submission verification to PR preparation and submission, following "PR_SUBMISSION.md". Opening the PR is mandatory task completion, not an optional follow-up. Do not stop after implementation, testing or a completion report, and do not wait for the owner to request the PR or give separate permission. Read-only investigations, audits, recommendations and advice do not require a PR. If the owner explicitly directs that no PR be opened, follow that instruction. If a PR cannot safely be opened, report the exact blocker and preserve the completed work for owner direction. A repository-changing task is not complete until its PR has been successfully opened and handed off.

PROJECT-WIDE TECHNICAL RULES

Playwright Browser Testing (Freebuff only)

Scope: This section governs Freebuff only. For ChatGPT, it overrides the general Playwright CLI instruction: ChatGPT must not use, load, modify or maintain the repository Playwright CLI or its associated startup scripts.

- Interactive browser sessions: Use "./scripts/playwright-cli.sh".
- Option A — Standard: Use "pnpm exec playwright test" for normal QA, visual testing and CI.
- Option B — SwiftShader: Use "pnpm exec playwright test --config=playwright.swiftshader.config.ts" for software-rendered GPU and graphics investigations. This does not measure physical GPU performance.

Keep both modes separate; standard QA and CI must continue using Option A. When Freebuff's environment, dependencies or browser runtime change, verify that the startup, browser-runtime and CLI setup scripts still work. Update the relevant scripts as needed to keep them functional.

- Never weaken security, privacy, validation, authentication, CAPTCHA, Turnstile, rate limiting, duplicate protection or data integrity.
- Use Playwright as the primary browser automation tool. Use Browserless as the remote fallback for direct browser tasks. Automatic PR-checker workflows use Playwright, not Browserless.
- Use Firecrawl as the primary content-retrieval tool and Crawlbase as its fallback. Neither replaces browser rendering or end-to-end testing.
- Do not assume a skill or integration provides access to a tool that is not actually available.
- Avoid unnecessary side effects, paid usage and disclosure of sensitive information, credentials, API keys or secrets.
- External review applications provide advisory feedback only; they do not replace required repository checks.
- Do not claim work or checks are complete without evidence.

NO EVIDENCE = NO CLAIM.

NO VERIFIED RESULT = NO VERIFIED COMPLETION.