AGENTS.md — REPOSITORY GOVERNANCE

INSTRUCTION AUTHORITY AND APPLICABILITY

This document establishes the repository governance and operating requirements for ChatGPT and Freebuff.

Every instruction must be interpreted according to its intended applicability.

INSTRUCTION CLASSIFICATIONS

🟢 [BOTH — CHATGPT AND FREEBUFF]

Applies equally to ChatGPT and Freebuff. Both agents must follow these requirements whenever working on, reviewing, modifying or making decisions about this repository.

🔵 [FREEBUFF ONLY]

Applies exclusively to Freebuff. ChatGPT must not treat these instructions as requirements for its own operating procedures.

🟣 [CHATGPT ONLY]

Applies exclusively to ChatGPT. Freebuff must not treat these instructions as requirements for its own operating procedures.

WHICH SECTIONS EACH AGENT MUST FOLLOW

ChatGPT: Follow all sections marked 🟢 BOTH and 🟣 CHATGPT ONLY. Do not apply Freebuff-only operating instructions to ChatGPT.

Freebuff: Follow all sections marked 🟢 BOTH and 🔵 FREEBUFF ONLY. Do not apply ChatGPT-only operating restrictions to Freebuff.

INTERPRETATION RULES

1. Each section inherits the classification of its parent heading unless it has its own explicit classification.
2. An explicitly classified subsection establishes its own applicability.
3. Shared requirements remain binding on both agents, regardless of where they appear in the document.
4. Agent-specific instructions supplement shared requirements; they do not cancel or weaken shared requirements.
5. The written classification is authoritative. Colour and emoji are visual indicators to make the document easier to navigate.
6. Neither agent may assume that an instruction intended exclusively for the other agent applies to its own operating workflow.

---

🟢 SHARED REPOSITORY REQUIREMENTS

[BOTH — CHATGPT AND FREEBUFF]

These requirements apply equally to both agents whenever they work on, review, modify or make decisions about the Luckypickcanada repository.

PROJECT PLATFORMS AND DOCUMENTATION

Lucky Pick Canada uses GitHub for source control, repository management and pull requests, and Cloudflare for its production hosting and deployment. Follow the existing configurations and workflows for both platforms.

Production website: https://luckypickcanada.ca

PR SUBMISSION DOCUMENTATION

"PR_SUBMISSION.md" is mandatory. Read and follow it whenever preparing or submitting a pull request.

It is the single source of truth for PR preparation, reporting, submission, handoff and the hard stop after submission. Do not duplicate its procedures in this file.

1. TASK SCOPE AND EXISTING WORK

Identify the requested outcome, scope, restrictions and acceptance criteria. Follow the owner's instructions.

Do not expand the task or introduce unrelated work.

Account for existing repository changes and active work. Avoid duplicating work, overwriting existing changes or introducing unnecessary conflicts.

2. PRESERVATION AND IMPLEMENTATION

Make focused changes. Preserve existing functionality and unrelated artwork, visuals, wording, layout, navigation, audio, monetization, integrations and data boundaries.

Make the smallest correct change that satisfies the requested outcome.

Identify affected components, dependencies and workflows. Consider related behaviour that could be affected by the changes.

3. PROTECTED AREAS

Changes to protected governance, payment, database, authentication, security, hosting, deployment, environment or secrets configuration require the applicable owner approval.

4. PRODUCTION BUILD-SIZE LIMIT

The production build must remain strictly below 495 MiB.

Both agents must consider expected build impact when planning or proposing repository changes.

Measure the actual production build size whenever performing an authorized production build or verification.

If an agent cannot perform that measurement because of its operating restrictions or unavailable tools, it must identify the measurement as unverified and ensure the required verification is completed in an authorized environment.

Complete as much of the requested task as can be safely delivered while staying below the limit.

If the remaining work would bring the build to 495 MiB or higher, stop at a safe, complete point. Do not compromise functionality, security or quality to fit more work into the PR.

Clearly document what was completed and what remains for a future task or PR. Never leave the application broken or in an incomplete state.

5. PRODUCTION PLATFORM

The production platform is Cloudflare Pages. Follow the existing project configuration.

Do not introduce unnecessary platform changes or additional paid infrastructure.

6. SECURITY AND DATA INTEGRITY

Never weaken security, privacy, validation, authentication, CAPTCHA, Turnstile, rate limiting, duplicate protection or data integrity.

Avoid exposing sensitive information, credentials, API keys or secrets.

7. COST CONTROL

Keep the repository, integrations and production infrastructure as close to zero cost as possible.

Prefer existing free services, free tiers and already available integrations. Avoid unnecessary paid usage, duplicated services and unnecessary resource consumption.

8. SPEC KIT REQUIREMENTS

Both ChatGPT and Freebuff must follow the current Spec Kit workflow and instructions in the repository.

- Review and follow the current Spec Kit command definitions, workflow instructions, templates and project-constitution requirements.
- Use the current repository instructions rather than relying on remembered procedures, outdated documentation or assumptions about available commands.
- Complete all required workflow stages in their prescribed order for repository-changing tasks.
- Complete all mandatory template sections and applicable conditional requirements.
- Use supporting commands when their instructions or the task require them. Do not mechanically run optional commands when they are not applicable.
- If the available workflow, commands, stages, sequence, templates or required instructions change, identify the changes and notify the owner.
- Preserve existing repository governance. Any necessary update to AGENTS.md to keep it aligned with the current Spec Kit workflow must be limited strictly to affected wording, preserve unrelated requirements and be reported.
- Do not silently change the established project workflow.

Neither agent should rely on a fixed Spec Kit version, hardcoded command count or outdated snapshot of the workflow.

9. QA CHECKER REQUIREMENTS — BEFORE TASK SPECIFICATION

Both ChatGPT and Freebuff must understand the applicable repository QA checker requirements before preparing or approving a task specification for work that may be checked by repository QA infrastructure.

This is a task-planning requirement, not something to defer until implementation or pre-submission review.

- Identify the workflows, checker scripts, configurations, test suites and written requirements that will evaluate the proposed changes.
- Understand what each applicable checker is designed to detect, enforce or prevent, including its scope, triggers, required inputs, evidence, thresholds, approval conditions and pass/fail behaviour.
- Determine which changed files, application behaviours, safeguards and evidence the checkers will examine. Do not infer their purpose from workflow or script names; inspect their actual definitions and relevant tests.
- Use those requirements when defining the task's scope, constraints, implementation approach, acceptance criteria and verification plan. The task must be designed to satisfy the applicable checks, not discover their expectations after implementation.
- Identify gaps, conflicts, unclear requirements or checker changes needed to support the task. Record them in the specification and raise material conflicts with the owner before implementation.
- Do not weaken, bypass, suppress or redefine an existing check merely to make a task pass.
- Any proposed change to checker requirements must be explicit, separately justified and authorized where protected files or governance are involved.

Execution distinction: Both agents must understand and account for the checker requirements. Each agent must perform only the verification activities permitted by its own operating instructions. An inability to execute a check does not remove the requirement to understand it or ensure that it is completed by an authorized environment.

10. AUTOMATIC PR-CHECKER WORKFLOWS

Automatic PR-checker workflows must continue to use Playwright.

Do not replace or weaken these automated checks as a consequence of an individual agent's browser-tool limitations or fallback arrangements.

11. INTEGRATIONS AND TOOL AVAILABILITY

Use only integrations and tools that are actually available and authorized for the agent performing the task.

Do not assume that an integration, skill or tool provides access to capabilities that are not actually available.

12. EXTERNAL REVIEW APPLICATIONS

External review applications provide advisory feedback only. They do not replace required repository checks or established verification requirements.

13. EVIDENCE AND REPORTING

Do not claim work or checks are complete without evidence.

Distinguish between completed, attempted, failed, unavailable and unverified work. Report limitations and unresolved issues accurately.

NO EVIDENCE = NO CLAIM.

NO VERIFIED RESULT = NO VERIFIED COMPLETION.

---

🔵 FREEBUFF OPERATING INSTRUCTIONS

[FREEBUFF ONLY]

The following sections establish Freebuff's repository preparation, planning, implementation, verification and submission workflow.

They do not prescribe ChatGPT's operating procedures.

A — PREPARE AND PLAN

1. UNDERSTAND THE TASK

Translate the owner's request into a clear task scope, restrictions and acceptance criteria. Follow the shared task-scope requirements.

Do not introduce unapproved work.

2. CHECK EXISTING WORK

Inspect the current branch, worktree, relevant files, Spec Kit artifacts, existing branches and PRs.

Avoid duplicating active work or overwriting existing changes.

Handle one active task per run.

3. LOAD PROJECT CONTEXT

Read all four Memory Bank files once:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/techContext.md"
- "memory-bank/progress.md"

4. SELECT TASK GROUPS

Review the available task-group instructions in ".freebuff/".

Select the groups that apply to the task: creation, troubleshooting, polishing, testing, security, audio, deep-dive or SEO.

Read and follow the instructions in the selected files. Do not force unrelated groups onto the task.

5. FIND RELEVANT PROJECT DOCUMENTATION

Read ".docs/manifest.json" to identify reference documents that apply to the task.

Read only the documents you need. Do not load the entire library.

Treat these documents as reference material, not automatic instructions. Keep ".docs/" read-only unless the owner authorizes changes.

Keep a record of the task groups selected and the reference documents actually used.

In the completion report, identify the selected groups, list the library documents that were useful to the task, and identify any Freebuff integrations and enabled skills used.

6. CHECK ENABLED SKILLS

Check Freebuff's Settings → Skills.

Use any enabled skills relevant to the task and read their instructions before use. Confirm that any required tools are actually available.

7. CHECK INTEGRATIONS AND TOOLS

Confirm that required integrations and tools are available and operational.

Use applicable integrations as needed for the task.

Do not assume an integration or skill provides access to a tool that is not actually available.

8. PLAYWRIGHT BROWSER TESTING

For any task involving Playwright, browser testing, visual QA, performance or rendering profiling, WebGL/WebGPU inspection or graphics work, read and follow both authoritative repository documents before using or modifying the Playwright setup:

- ".agents/skills/playwright-cli/SKILL.md"
- ".agents/skills/playwright-cli/references/lucky-pick-canada.md"

These two documents contain the authoritative Playwright instructions, commands, procedures, configurations and setup conventions.

Follow their documented CLI commands, wrapper, installation, browser-runtime and setup conventions.

For interactive browser sessions, use the documented repository wrapper:

"./scripts/playwright-cli.sh"

Playwright is Freebuff's primary browser automation tool.

Preserve the existing Playwright configuration and setup. Do not introduce a competing CLI or browser automation setup.

Troubleshooting before fallback

If Playwright encounters an installation, startup, configuration or browser-runtime issue, use the documented troubleshooting procedures and existing repository setup scripts to investigate and resolve it before considering a fallback.

Crawlbase fallback

Only if the Playwright issue cannot be resolved after troubleshooting may Freebuff use Crawlbase as a fallback.

- Crawlbase is Freebuff's first and only fallback for supported content-retrieval and crawling tasks.
- Use it only when necessary for the task.
- Keep retrieval focused on the information required. Avoid unnecessary crawling and resource consumption.
- Crawlbase does not replace interactive browser rendering, visual browser testing or end-to-end browser automation.
- If the task requires browser capabilities that Crawlbase cannot provide and Playwright remains unavailable, document the exact blocker and identify what remains unverified.

Do not introduce additional browser fallback tools.

B — IMPLEMENT

1. FOLLOW THE APPROVED PLAN

Implement the approved specification, plan and task list.

Do not skip required Spec Kit stages or introduce unapproved work.

2. CHECK THE IMPACT

Identify affected components, dependencies and workflows. Test related behaviour where changes could cause regressions.

3. RESPECT PROTECTED AREAS

Follow the shared protected-area and owner-approval requirements.

4. RESPECT THE BUILD-SIZE LIMIT

Follow the shared 495 MiB production build-size requirement.

Consider expected build impact during planning and measure the actual build size during verification.

If the remaining work would bring the build to 495 MiB or higher, stop at a safe, complete point. Do not compromise functionality, security or quality to fit more work into the PR.

Clearly document what was completed and what remains for a future task or PR.

5. USE THE CORRECT PRODUCTION PLATFORM

The production platform is Cloudflare Pages. Follow the existing project configuration and shared platform requirements.

C — VERIFY AND SUBMIT

1. VERIFY THE IMPLEMENTATION

Run "./freebuff-verify.sh" and all applicable task-group checks, tests, builds, browser QA and integration checks.

2. COMPLETE THE FINAL CHECKER-REQUIREMENT REVIEW

Before submission, review the completed implementation and complete diff against every applicable checker requirement identified in the shared QA Checker Requirements section and documented in "PR_SUBMISSION.md".

Resolve unmet in-scope requirements or record the exact blocker.

A passing or pending CI result does not replace this independent review.

3. CONFIRM BUILD SIZE

Measure the production build and confirm it remains strictly below 495 MiB, as required by the shared production build-size requirement.

4. SUBMIT THE PR

Every task in which the owner authorizes repository changes must proceed directly from implementation and pre-submission verification to PR preparation and submission, following "PR_SUBMISSION.md".

Opening the PR is mandatory task completion, not an optional follow-up.

Do not stop after implementation, testing or a completion report, and do not wait for the owner to request the PR or give separate permission.

Read-only investigations, audits, recommendations and advice do not require a PR.

If the owner explicitly directs that no PR be opened, follow that instruction.

If a PR cannot safely be opened, report the exact blocker and preserve the completed work for owner direction.

A repository-changing task is not complete until its PR has been successfully opened and handed off.

---

🟣 CHATGPT OPERATING INSTRUCTIONS

[CHATGPT ONLY]

These instructions govern ChatGPT's repository access, information verification and tool usage.

They do not change or weaken the shared repository requirements.

1. REPOSITORY INFORMATION VERIFICATION

Before providing factual information about Luckypickcanada, verify the relevant information against the actual repository files in GitHub.

Do not rely on memory, previous conversation summaries, old drafts or assumptions as a substitute for checking the current repository when the information can be verified directly.

When repository files have changed, use the current versions as the source of truth.

2. BROWSER AND CONTENT-RETRIEVAL TOOL USAGE

Use browser and content-retrieval tools only when they are genuinely necessary for the task.

First determine whether the task can be completed accurately using repository files, existing conversation context or information already available.

Do not open browser sessions or make external retrieval requests merely because the tools are available.

Primary tool — Browserless

- Browserless is ChatGPT's primary browser tool.
- Use it when the task genuinely requires browser access.
- Minimize usage by keeping sessions, navigation and page requests focused on the exact task.
- Avoid unnecessary repeated visits, requests, page loads and browser sessions.

Fallback — Firecrawl

- Use Firecrawl only when Browserless is unavailable or not working.
- Firecrawl is the fallback for supported content-retrieval tasks.
- Use targeted retrieval. Obtain only the information needed rather than unnecessarily crawling entire websites.
- Do not treat Firecrawl as a replacement for interactive browser rendering or end-to-end browser testing.

If both tools fail

If Browserless and Firecrawl are both unavailable or cannot complete the required task:

- Stop attempting alternative tools.
- Document what failed and what was attempted.
- Identify what remains unverified or incomplete.
- Report that no further fallback is available.

There is no third fallback.

3. TOOLS UNAVAILABLE TO CHATGPT

ChatGPT must not use or attempt to use:

- The repository Playwright CLI.
- Repository Playwright startup scripts or associated setup scripts.
- Crawlbase.

Do not spend time attempting to initialize, troubleshoot or maintain tools that are not available to ChatGPT.

4. REPOSITORY SCRIPTS AND VERIFICATION RESTRICTIONS

ChatGPT must not execute "./freebuff-verify.sh" or any other repository shell script.

This is a ChatGPT-specific operating restriction. It does not remove or modify Freebuff's verification requirements.

When verification requires a repository shell script, Playwright or another unavailable tool:

- Identify the required check.
- Do not attempt to execute the unavailable tool or script.
- Report the verification as outstanding.
- Identify what must be verified in an authorized environment.
- Do not claim that the check passed.

ChatGPT must not load, modify or maintain the repository Playwright CLI or its associated startup and setup scripts.

5. REPOSITORY CHANGES AND RECOMMENDATIONS

Keep proposed repository changes focused and consistent with the actual repository.

Follow all applicable shared repository requirements, including the production build-size limit, Spec Kit workflow, QA checker requirements, security protections, owner approvals and documentation restrictions.

Do not claim that a repository change has been committed, merged or deployed unless that action has actually been completed and verified.

Whenever preparing or submitting a pull request, read and follow "PR_SUBMISSION.md".

When a required check cannot be performed within ChatGPT's operating restrictions, clearly identify the limitation and the outstanding verification.