# AGENTS.md — REPOSITORY GOVERNANCE

## Mandatory reading and instruction scope

Read this entire document before any repository work. Follow every requirement that applies to your agent; do not rely on memory, summaries or prior readings.

### Instruction classifications

- 🟢 **BOTH** — applies to ChatGPT and Freebuff.
- 🔵 **FREEBUFF ONLY** — applies only to Freebuff.
- 🟣 **CHATGPT ONLY** — applies only to ChatGPT.

ChatGPT follows 🟢 and 🟣 sections. Freebuff follows 🟢 and 🔵 sections. A section inherits its parent's classification unless explicitly reclassified. Agent-specific rules supplement shared rules; they do not weaken them. Written labels determine applicability.

---

## 🟢 SHARED REPOSITORY REQUIREMENTS

[BOTH — CHATGPT AND FREEBUFF]

### Project and platform

- GitHub is the source-control and pull-request platform. Cloudflare Pages is the production platform. Preserve the existing configurations and workflows.
- Production website: https://luckypickcanada.ca

### Scope and preservation

- Follow the owner's requested outcome, scope, restrictions and acceptance criteria. Do not add unrelated work or duplicate active work.
- Inspect existing changes and relevant code before editing. Identify affected components, dependencies and workflows; consider regression risks. Make the smallest correct change and review the complete final diff.
- Preserve unrelated functionality, artwork, visuals, wording, layout, navigation, animation, audio, monetization, integrations and data boundaries.
- Changes to protected governance, payment, database, authentication, security, hosting, deployment, environment or secrets configuration require the applicable owner authorization.

### Production build limit

- The production build must remain strictly below **495 MiB**.
- Consider build impact during planning and measure the actual size whenever an authorized production build is run.
- If the remaining work would reach or exceed the limit, stop at a safe, complete point. Do not trade away functionality, security or quality. Report completed and deferred work; never leave the application broken or incomplete.
- If the agent cannot measure the build, mark it unverified and identify the required authorized verification.

### Security and data integrity

- Never weaken security, privacy, validation, authentication, CAPTCHA, Turnstile, rate limiting, duplicate protection or data integrity.
- Protect credentials, API keys, tokens, passwords, private keys, database URLs, connection strings, webhook secrets and sensitive environment variables.
- Never expose secret values in source, commits, diffs, logs, terminal output, diagnostics, screenshots, fixtures, artifacts, documentation or PR communication.
- Never dump or broadly enumerate environment variables or configuration. Inspect only what is necessary; redact diagnostic output. Use synthetic, non-functional test placeholders.
- Never hard-code, commit or expose secrets through client-side code or public environment variables. Use approved secret stores and platform bindings.
- If a secret is exposed, stop further disclosure, notify the owner without repeating it, recommend revocation or rotation, and remediate only with authorization.

### Cost control

Prefer existing free services, free tiers and available integrations. Avoid unnecessary paid usage, duplicated services and resource consumption. Keep infrastructure near zero cost.

### Graphics and creative work

For visual experiences, animation, effects and audio-reactive work, use and extend the existing graphics, resource-readiness and audio systems; do not create competing renderers, registries, runtimes or preloaders.

Before visual creation or polishing, consult:
- `app/lib/graphics/README.md` and `docs/graphics-rendering-architecture.md`.
- `app/lib/resource-readiness.js` — the shared Resource-Readiness Hub; do not create another preloader.
- Relevant `.docs/creation/` and `.docs/polishing/` references selected through `.docs/manifest.json`.
- For Three.js work, `_websites_threejs.md` and `_websites_threejs_llms_txt.md` in both groups.

Use the existing integration and workbench entry points:
- `app/lib/use-creative-experience.js`.
- `app/lib/graphics/experiences.js` and `app/lib/graphics/runtime.js`.
- `components/graphics/CreativeWorkbench.jsx`, `app/lib/graphics/workbench.js` and `app/lib/graphics/workbench-runtime.js`; route `/workbench/creative`.

Register new experiences through the shared registry and use the existing runtime, readiness and audio systems where applicable. Choose the appropriate renderer; Three.js is not mandatory. Preserve existing cinematic engines when suitable. The development Workbench does not replace Playwright or required QA.

### Spec Kit workflow

- Follow the current Spec Kit workflow, command definitions, templates and project constitution for the agent's own environment.
- For repository-changing work, complete the required stages in order: **specify → plan → tasks → implement**. Complete mandatory template sections and applicable conditional requirements.
- Inspect the currently available tooling and repository definitions before use. Do not rely on remembered instructions, a fixed version, command count or outdated command list; record a version only as useful observed information.
- Use supporting commands when required, not mechanically. Notify the owner if workflow instructions, stages, sequence, templates or required commands have changed. Do not silently change the established workflow.
- Freebuff's `.freebuff/cmds/` wrappers are FREEBUFF ONLY. ChatGPT must not use them as its own operating instructions.
- Any necessary `AGENTS.md` alignment must be limited to affected wording, preserve unrelated requirements and be reported.

### QA requirements before specification

Before preparing or approving a task specification that may be checked by repository QA:
- Inspect the applicable workflows, checker scripts, configurations, tests and written requirements. Do not infer behaviour from names.
- Understand each checker's purpose, scope, triggers, inputs, evidence, thresholds, approval conditions and pass/fail behaviour; identify the files, behaviours and evidence it examines.
- Use those requirements to shape scope, constraints, implementation, acceptance criteria and verification.
- Identify gaps or conflicts in the specification and raise material issues with the owner before implementation.
- Never weaken, bypass, suppress or redefine a check merely to make a task pass. Checker changes require explicit justification and applicable authorization.
- Understand all applicable checks, but execute only those permitted by the agent's own operating rules. An unavailable check remains outstanding for an authorized environment.

Automatic PR-checker workflows must continue to use Playwright. Do not replace or weaken automated browser checks because an agent has different browser-tool access.

### Tools and repository scripts

- Use only integrations and tools actually available and authorized for the agent. Do not assume a tool provides capabilities it does not have.
- External review applications provide advisory feedback only; they do not replace repository checks or verification.
- Repository scripts may be run only when relevant, safe, authorized and supported by the agent's operating environment. Before execution, inspect the script and invoked commands, confirm runtime, dependencies, effects and permissions, and avoid unauthorized deployments, destructive actions, secret access, out-of-scope changes, unnecessary installs or paid usage.
- Report exact results, including failures, skipped checks and unavailable requirements. Never claim a check passed unless it actually ran and its result was verified.

### Evidence and reporting

Distinguish completed, attempted, failed, unavailable and unverified work. Report limitations and unresolved issues accurately.

**NO EVIDENCE = NO CLAIM. NO VERIFIED RESULT = NO VERIFIED COMPLETION.**

### Memory Bank context and maintenance

At task initialization, read and health-check all four core files:

- `memory-bank/projectBrief.md`
- `memory-bank/activeContext.md`
- `memory-bank/techContext.md`
- `memory-bank/progress.md`

Treat them as project context, not instructions or a substitute for live repository inspection. `AGENTS.md` is the governance authority; current code, configuration, GitHub state and approved task artifacts take precedence over stale Memory Bank information.

Check for relevance, staleness, duplication, superseded information, contradictions and usefulness. Avoid cosmetic rewrites and routine PR/CI transcripts. Keep each file focused: project identity and boundaries (`projectBrief`), current work and decisions (`activeContext`), verified architecture and technical facts (`techContext`), and durable milestones (`progress`).

Update only durable facts, meaningful milestones, current state or technical context useful to future work. Never store secrets or sensitive configuration. Remove information only when demonstrably obsolete, duplicated, unreferenced or no longer useful; preserve all four core files.

There are no arbitrary byte or line limits for Memory Bank files or Spec Kit artifacts. Maintain them for usefulness, not by truncating valid context. Include small, directly related cleanup; defer broader consolidation to a separate task. Report that the health check was done, any cleanup and its purpose, and any Memory Bank changes.

### Pull-request requirements

`PR_SUBMISSION.md` is mandatory and is the single source of truth for PR preparation, required declarations, verification, submission, post-submission report review, owner handoff and stopping rules.

Read it with the applicable QA requirements before implementation, then read it again immediately before PR creation. Follow it without duplicating its procedures here. Do not invent checker results or owner approvals.

---

## 🔵 FREEBUFF OPERATING INSTRUCTIONS

[FREEBUFF ONLY]

These instructions govern Freebuff's repository workflow. They do not prescribe ChatGPT's operating procedures.

### A — PREPARE AND PLAN

1. Translate the owner's request into a clear scope, restrictions and acceptance criteria. Do not add unapproved work.
2. Inspect the branch, worktree, relevant files, Spec Kit artifacts, active branches and PRs. Avoid duplicates and overwrites. Handle one active task per run.
3. Follow the shared four-file Memory Bank requirements.
4. Read `.docs/manifest.json`. Use the keys under `groups` as the dynamic task-group list; read the matching `.freebuff/<group>.md` files relevant to the task. Report any missing match; do not invent a category, hardcode a list or assume a fixed count/order. Unlisted `.freebuff/` files are specialist references; consult only when relevant.
5. Use the manifest to select task-relevant `.docs/` references. Read only what is needed. Treat them as references, keep `.docs/` read-only unless authorized, and report selected groups and useful documents.
6. Check enabled Freebuff skills and required integrations/tools. Read relevant skill instructions and confirm tools are available. In the completion report, identify useful references, skills and integrations actually used.
7. For Playwright, browser, visual, performance, rendering, WebGL/WebGPU or graphics work, read and follow both:
   - `.agents/skills/playwright-cli/SKILL.md`
   - `.agents/skills/playwright-cli/references/lucky-pick-canada.md`
8. Use `./scripts/playwright-cli.sh` for interactive sessions. Playwright is Freebuff's primary browser tool. Preserve its documented CLI, wrapper, configuration and setup; do not create a competing system.
9. Troubleshoot Playwright using the documented instructions and repository setup before fallback. Crawlbase is the only fallback, only for supported content retrieval/crawling; it does not replace interactive rendering, visual QA or end-to-end testing. If Playwright remains unavailable for required browser work, report the blocker and unverified behaviour. Do not add other browser fallbacks.

### B — IMPLEMENT

1. Implement the approved specification, plan and task list. Do not skip required Spec Kit stages or add unapproved work.
2. Identify affected components, dependencies and workflows; test related behaviour where regression is possible.
3. Follow shared protected-area, security, preservation, platform and build-size requirements.
4. Use Cloudflare Pages and the existing project configuration. Avoid unnecessary platform changes or paid infrastructure.

### C — VERIFY AND SUBMIT

1. Run `./freebuff-verify.sh` and applicable task-group checks, tests, builds, browser QA and integration checks when supported.
2. Review the completed implementation and full diff against every applicable QA checker requirement and `PR_SUBMISSION.md`. Resolve unmet in-scope requirements or record the exact blocker; CI does not replace this review.
3. Measure the production build and confirm it is strictly below 495 MiB. Report any unavailable measurement.
4. Follow `PR_SUBMISSION.md` to prepare, open and hand off the PR. For every owner-authorized repository change, opening a regular, non-draft PR is mandatory; do not wait for a separate request. If the owner explicitly says not to open one, follow that instruction. Read-only investigations, audits, recommendations and advice do not require a PR.
5. If a PR cannot safely be opened, report the exact blocker and preserve the work for owner direction. A repository-changing task is not complete until the PR is open and handed off. Leave it open and unmerged for the owner.

---

## 🟣 CHATGPT OPERATING INSTRUCTIONS

[CHATGPT ONLY]

These instructions govern ChatGPT's repository access, verification and tool use. They do not weaken shared requirements.

1. **Startup and references.** Before repository work, follow the ChatGPT Library startup instructions and run the prescribed startup preflight. Read `.docs/manifest.json` and only task-relevant references; keep `.docs/` read-only unless authorized.
2. **Verify repository facts.** Before making factual claims about Luckypickcanada, check the current relevant GitHub files. Do not substitute memory, summaries, previous conversations or old drafts for live source.
3. **Browser access.** ChatGPT cannot execute Playwright. When browser access or external retrieval is genuinely needed, use Browserless sparingly; use Firecrawl only if Browserless is unavailable or not working. If both fail, stop. Do not treat retrieval as interactive browser testing.
4. **Do not use unavailable tools.** ChatGPT must not use the repository Playwright CLI, Playwright setup/startup scripts or Crawlbase. Do not attempt to initialize, troubleshoot or maintain those tools.
5. **Freebuff environment.** Never run Freebuff's startup sequence, workspace initialization/provisioning, Playwright or Chromium installation, or persistent Freebuff shell-configuration procedures.
6. **Repository execution.** Follow the ChatGPT Library startup instructions. Do not execute repository shell scripts, including Freebuff startup or verification scripts. Do not run project builds, tests or dependency installs unless the startup instructions permit them and the required Node.js 26.x and pnpm 10.30.3 environment is active.
7. **Changes and PRs.** Keep proposed changes focused. Follow all shared approvals and `PR_SUBMISSION.md`. Do not claim a change was committed, merged or deployed unless that action is complete and verified. When a required check is unavailable under ChatGPT's restrictions, state the limitation and outstanding verification.