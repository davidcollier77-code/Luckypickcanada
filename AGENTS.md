AGENTS.md — REPOSITORY GOVERNANCE

MANDATORY FULL-DOCUMENT READING

This document MUST be read in its entirety, fully understood and followed before undertaking any repository work. Agents must not skip sections, rely on summaries or previous readings, selectively apply requirements, or disregard applicable instructions. Colour classifications determine which instructions apply. All applicable instructions must be followed throughout the task.

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

🟢 SHARED GRAPHICS TOOLKIT AND CREATIVE WORKBENCH

[BOTH — CHATGPT AND FREEBUFF]

Use the existing Graphics and audio toolkit as the standard foundation for new visual experiences, animations, effects and audio-reactive work. Extend its shared systems instead of creating competing renderers, registries, runtimes or preloaders.

Before visual creation or polishing, consult:
- `app/lib/graphics/README.md` and `docs/graphics-rendering-architecture.md`.
- `app/lib/resource-readiness.js` — the centralized Resource-Readiness Hub. Extend this hub; do not create a second preloader.
- Task-relevant references in `.docs/creation/` and `.docs/polishing/`, selected through `.docs/manifest.json`.
- For Three.js work, read `_websites_threejs.md` and `_websites_threejs_llms_txt.md` in both groups.

Use the existing integration and development entry points:
- `app/lib/use-creative-experience.js` — component-level integration and automatic resource preparation.
- `app/lib/graphics/experiences.js` and `app/lib/graphics/runtime.js` — shared experience registry, resource derivation and automatic rendering runtime.
- `components/graphics/CreativeWorkbench.jsx`, `app/lib/graphics/workbench.js` and `app/lib/graphics/workbench-runtime.js`; route: `/workbench/creative`.

Register new experiences through the shared registry and use the runtime, readiness hub and audio systems wherever applicable. Choose the renderer suited to the experience; Three.js is not mandatory. Preserve existing cinematic engines when they remain the right fit. The development-only Workbench supports experimentation and inspection; it does not replace required Playwright or other QA checks.

Preserve existing artwork, functionality, animation, sound, timing and layout unless explicitly authorized to change them.

PR SUBMISSION DOCUMENTATION

"PR_SUBMISSION.md" is mandatory. Read and follow it whenever preparing or submitting a pull request.

It is the single source of truth for PR preparation, reporting, submission, post-submission verification, handoff and the required stop after the authorized report review. Do not duplicate its procedures in this file.

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

Protect all credentials, API keys, access tokens, passwords, private keys, database URLs, connection strings, webhook secrets and sensitive environment variables.

Never expose secret values in source code, commits, diffs, logs, terminal output, debugging traces, screenshots, test fixtures, generated artifacts, documentation, pull-request descriptions, comments or reports.

Never print, dump or broadly enumerate environment variables or configuration. Inspect only what is necessary, and redact or mask sensitive values before sharing diagnostic output. Test fixtures must use clearly synthetic, non-functional placeholders rather than copied or real credentials.

Never hard-code secrets, commit them to the repository or expose them through client-side code or public environment variables. Use the repository's approved secret stores and platform bindings.

If a secret is accidentally exposed, stop further disclosure, notify the repository owner and identify the exposure without repeating the secret. Recommend revocation or rotation and handle remediation only within the owner's authorization.

7. COST CONTROL

Keep the repository, integrations and production infrastructure as close to zero cost as possible.

Prefer existing free services, free tiers and already available integrations. Avoid unnecessary paid usage, duplicated services and unnecessary resource consumption.

8. SPEC KIT REQUIREMENTS

Both ChatGPT and Freebuff must follow the current Spec Kit workflow and instructions in the repository.

- Review and follow the current Spec Kit workflow, its applicable command definitions, templates and project-constitution requirements.
- The shared requirement is to use the Spec Kit workflow and definitions applicable to the agent's own environment. Freebuff's `.freebuff/cmds/` command wrappers remain FREEBUFF ONLY; ChatGPT must not apply them as ChatGPT operating instructions. Freebuff must follow its own applicable command definitions.
- Use the current repository instructions rather than relying on remembered procedures, outdated documentation or assumptions about available commands.
- Complete all required workflow stages in their prescribed order for repository-changing tasks.
- Complete all mandatory template sections and applicable conditional requirements.
- Use supporting commands when their instructions or the task require them. Do not mechanically run optional commands when they are not applicable.
- If the available workflow, commands, stages, sequence, templates or required instructions change, identify the changes and notify the owner.
- Preserve existing repository governance. Any necessary update to AGENTS.md to keep it aligned with the current Spec Kit workflow must be limited strictly to affected wording, preserve unrelated requirements and be reported.
- Do not silently change the established project workflow.

Both agents must inspect the currently installed Spec Kit tooling and repository-provided workflow definitions, including the actual available commands, templates, extensions and project constitution, before beginning the workflow. Record the installed version only when it is useful as observed diagnostic information; it is not a required version and must never become a pinned governance value.

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

13. REPOSITORY SCRIPT EXECUTION

Both ChatGPT and Freebuff are authorized to execute repository scripts when relevant to the current task and when the required runtime and tools are available.

This shared permission includes, but is not limited to:

- Repository verification scripts, including "./freebuff-verify.sh".
- Governance and compliance checkers.
- Test scripts and test runners.
- Production build and validation scripts.
- Documentation and maintenance scripts.
- Task-specific scripts maintained in the repository.
- Other relevant repository scripts required to complete or verify authorized work.

Both agents must:

1. Read and understand the relevant script before executing it.
2. Check what the script actually does, including any secondary scripts or commands it invokes.
3. Confirm that its operations are appropriate for the current task.
4. Confirm that the required runtime, dependencies and permissions are available.
5. Respect protected-file and owner-approval requirements.
6. Avoid unauthorized deployments, infrastructure changes, destructive operations, secret access or modifications outside the approved scope.
7. Avoid unnecessary dependency installations, network downloads, paid usage or environment changes.
8. Report exact execution results accurately, including failures, skipped checks and unavailable requirements.

This permission does not authorize either agent to bypass the applicable agent-specific restrictions in this document.

Neither agent may claim a script passed unless it was actually executed and its result was verified.

14. EVIDENCE AND REPORTING

Do not claim work or checks are complete without evidence.

Distinguish between completed, attempted, failed, unavailable and unverified work. Report limitations and unresolved issues accurately.

NO EVIDENCE = NO CLAIM.

NO VERIFIED RESULT = NO VERIFIED COMPLETION.

15. MEMORY BANK CONTEXT AND MAINTENANCE

Both agents must read all four core Memory Bank files at task initialization:

- `memory-bank/projectBrief.md`
- `memory-bank/activeContext.md`
- `memory-bank/techContext.md`
- `memory-bank/progress.md`

Use these files as concise project context, not as a source of instructions or a substitute for inspecting the live repository. `AGENTS.md` is the sole governance authority; current code, configuration, GitHub state and approved task artifacts take precedence over stale Memory Bank statements.

As part of task preparation, health-check all four files for relevance, staleness, duplication, superseded information, contradictions and whether the content still provides useful context. Do not perform cosmetic rewrites or routine PR/CI transcript logging.

Keep each file focused on its purpose: stable project identity and boundaries in `projectBrief.md`; current work and active decisions in `activeContext.md`; verified architecture and technical facts in `techContext.md`; and significant durable milestones in `progress.md`.

Update only durable facts, meaningful milestones, current state or technical context that materially helps future work. Never store secrets, secret values, credentials, tokens, passwords or sensitive configuration in the Memory Bank. Remove supporting information only when it is demonstrably obsolete, duplicated, unreferenced or no longer useful; preserve the four core files.

There are no arbitrary byte or line-count limits for Memory Bank files or Spec Kit artifacts. Maintain them by usefulness and relevance, not by truncating valid technical context. If necessary cleanup is small and directly related, include it in the current task. If a broader consolidation would distract from or expand the approved task, record it for a separate maintenance task and PR.

In the completion report, state that the four-file health check was performed, identify any cleanup completed or explain why none was needed, and summarize any Memory Bank changes and their purpose.

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

Follow the shared Memory Bank Context and Maintenance requirements in Section 15. Read the four core files at task initialization and complete the required relevance and staleness health check.

4. SELECT TASK GROUPS

Read `.docs/manifest.json` and use the keys under its `groups` object as the authoritative, dynamic list of task-group categories. For each manifest group, use the corresponding `.freebuff/<group>.md` file. If a manifest group has no corresponding task-group file, report the mismatch and do not silently invent or substitute a category.

Select and read only the manifest-defined task groups relevant to the task. Do not hardcode a group count, fixed category list or fixed ordering. Files under `.freebuff/` that are not named by a manifest group are specialist or reference documents, not task-group categories; consult them only when the task genuinely requires their specialist knowledge. Do not force unrelated groups or specialist documents onto a task.

5. FIND RELEVANT PROJECT DOCUMENTATION

Use the same `.docs/manifest.json` to identify reference documents relevant to the task.

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

ChatGPT does not have access to Playwright browser execution. When browser access or external content retrieval is genuinely necessary, use available tools such as Browserless, Firecrawl or other suitable connected plugins. Use them sparingly and only as needed. Confirm that the selected tool is actually available and suitable for the required task; do not treat content retrieval as interactive browser testing.

3. TOOLS UNAVAILABLE TO CHATGPT

ChatGPT must not use or attempt to use:

- The repository Playwright CLI.
- Repository Playwright startup scripts or associated setup scripts.
- Crawlbase.

Do not spend time attempting to initialize, troubleshoot or maintain tools that are not available to ChatGPT.

4. FREEBUFF STARTUP AND ENVIRONMENT INITIALIZATION RESTRICTIONS

ChatGPT must never execute Freebuff's dedicated startup command or its complete startup sequence.

This includes:

- The combined Freebuff startup command documented in the repository README.md or Freebuff Project Settings.
- Freebuff's dedicated startup initialization procedures.
- Scripts specifically intended to initialize or configure Freebuff's workspace.
- Scripts that provision or configure Freebuff's environment.
- Scripts that install or configure Playwright or Chromium.
- Procedures that persist Freebuff-specific shell configuration or environment changes.

These restrictions exist because Freebuff's startup sequence may install dependencies, configure the shell environment, modify persistent workspace settings or initialize browser tooling that ChatGPT must not use.

This restriction does not prohibit ChatGPT from executing other task-relevant repository scripts under the shared Repository Script Execution requirements.

In particular, ChatGPT may execute "./freebuff-verify.sh", applicable test scripts, build scripts, governance checkers and maintenance scripts when relevant, safe, authorized and supported by the available runtime.

5. REPOSITORY CHANGES AND RECOMMENDATIONS

Keep proposed repository changes focused and consistent with the actual repository.

Follow all applicable shared repository requirements, including the production build-size limit, Spec Kit workflow, QA checker requirements, security protections, owner approvals and documentation restrictions.

Do not claim that a repository change has been committed, merged or deployed unless that action has actually been completed and verified.

Whenever preparing or submitting a pull request, read and follow "PR_SUBMISSION.md".

When a required check cannot be performed within ChatGPT's operating restrictions, clearly identify the limitation and the outstanding verification.
