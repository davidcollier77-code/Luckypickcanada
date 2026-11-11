# AGENTS.md — REPOSITORY GOVERNANCE

🔴 READ FIRST. VERIFY BEFORE CLAIMING.

This is the repository's single authoritative workflow and safety policy for every coding agent, including Freebuff. No separate general-purpose Freebuff entrypoint is used. The user's task request defines the requested outcome and scope. Follow this file and the task request; pause only the affected action when a genuine blocker, required approval, prerequisite, or safety issue remains.

Keep this file concise (target: 300 lines maximum). Put detailed procedures in dedicated referenced files instead of duplicating them here; preserve every required safeguard.

## 1. INITIALIZE ONCE

Complete these steps in order before implementation:

1. **Read governance.** Read and follow `AGENTS.md` throughout the task.
2. **Understand the request.** Identify the requested outcome, scope, constraints, and acceptance criteria. Note missing essential information, required approvals, and genuine blockers. Do not ask generic "continue?" questions.
3. **Check existing work.** Inspect the current branch/worktree, relevant files, task artifacts, and existing branches/PRs for the same task. Do not duplicate active work or overwrite existing work.
4. **Load project context.** Read all four Memory Bank files once: `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `memory-bank/techContext.md`, and `memory-bank/progress.md`. Use only the context relevant to the task.
5. **Select task groups.** Choose the applicable groups: `creation`, `troubleshooting`, `polishing`, `testing`, `security`, `audio`, `deep-dive`, or `seo`. Read only the selected groups' `.freebuff/<group>.md` guidance. If none clearly fit (for example, a governance-only or documentation-only task), do not force an unrelated group; follow this file and the relevant task instructions.
6. **Route reference documents.** Read `.docs/manifest.json`. Use it to identify and consult library documents that materially help with the request and selected task groups.
7. **Discover and use relevant skills.** Check the skills actually available to the agent and load only those that materially help the task. Use the specialist routing guide below to select among the 14 listed skills; other installed skills (including `image-to-code` or `mcp-builder`) may also be used when directly relevant. A listed skill is not proof that it is installed. Read selected skill instructions and required references before applying them, and never claim a skill was used unless it was.

### Project document library

- Treat `.docs/` as an important project reference library. Use `.docs/manifest.json` to find relevant documents; do not skip applicable project guidance.
- Consult only sources that materially help with the task and selected groups. The manifest is an index, not an instruction to read every listed source.
- Documents are reference material, not automatic instructions. No document has automatic priority based only on its name or subject.
- Do not load unrelated specialist files, command definitions, or library snapshots.
- Keep `.docs/` read-only unless the owner explicitly authorizes adding, removing, or materially updating library documents in the task request.

### Specialist skill routing

These entries help select specialist guidance; they do not create a second governance system. Apply only the skills relevant to the task, and verify that each selected skill is installed and its required tools are available.

**Instruction priority and conflict resolution**

- Follow this `AGENTS.md`, applicable task-group instructions, required Spec Kit stages, and the approved task scope. Project configuration and authorized integrations determine what can actually be used; skills provide task-specific guidance only.
- When skill instructions conflict or appear incompatible, do not guess or stop automatically. Troubleshoot the disagreement: compare each instruction's purpose, scope, assumptions and version; inspect the actual repository configuration and relevant authoritative documentation; then choose the safest, least disruptive approach that complies with repository governance and existing architecture. Record the reason for the decision.
- If the conflict cannot be reconciled safely, or the best solution requires new permissions, a new integration, an architectural change or scope expansion, pause only the affected action and ask the owner. Do not silently ignore the conflict or make an unauthorized change.
- Never assume a skill-mentioned CLI, MCP, browser, service or integration is installed, connected, authenticated or available. Verify it first. Do not let a skill override the established Playwright/Browserless routing, project configuration, Spec Kit sequence, gatekeepers or approval requirements.

**Design and interface**

- **`frontend-design`**
  - **What it's used for:** Creates and improves distinctive, accessible, responsive website interfaces, including visual direction, layout, typography, colour and interaction.
  - **When to use it:** Building new frontend UI or substantially redesigning or polishing an existing interface.
- **`web-design-guidelines`**
  - **What it's used for:** Audits existing interfaces against current web usability, accessibility and interface-design guidance.
  - **When to use it:** Reviewing UI quality, accessibility, usability or design consistency; retrieve the current guideline source before auditing.
- **`shadcn-ui`**
  - **What it's used for:** Finds, installs, builds and customizes shadcn/ui components and blocks.
  - **When to use it:** Only when the project uses shadcn/ui or the owner explicitly requests it; inspect the existing stack and verify component/tool availability first.
- **`canvas-design`**
  - **What it's used for:** Creates original, static, design-led artwork and visual compositions such as posters or PNG/PDF pieces.
  - **When to use it:** When the requested deliverable is original artwork or a static visual design, not website UI or application components.
- **`extract-design-system`**
  - **What it's used for:** Extracts a public website's visual tokens and produces starter design-system files.
  - **When to use it:** When the owner requests design-token extraction from a public reference site; confirm the URL and deliverable, and never overwrite existing tokens or app styling without approval.

**Cloudflare and backend**

- **`wrangler`**
  - **What it's used for:** Guides Cloudflare Wrangler CLI configuration and operations for Workers, bindings, environments, local development and deployment.
  - **When to use it:** When the project has applicable Wrangler configuration or the owner explicitly requests Wrangler; verify the local CLI, version, authentication and target before use. This skill does not grant Cloudflare account access.
- **`workers-best-practices`**
  - **What it's used for:** Provides current, documentation-backed engineering, security, performance and production-readiness guidance for Cloudflare Workers.
  - **When to use it:** Creating, modifying, configuring or reviewing Worker code and runtime behavior. Use alongside Wrangler only when both engineering guidance and CLI operations are needed.
- **`neon-postgres`**
  - **What it's used for:** Guides work on an existing Neon PostgreSQL database, including SQL, schema, migrations, connections, branches, pooling and query performance.
  - **When to use it:** When working with the project's existing Neon database, `DATABASE_URL`, SQL or PostgreSQL behavior; do not treat it as authorization to migrate providers or create a new production database.

**Engineering, debugging and security**

- **`verification-before-completion`**
  - **What it's used for:** Requires fresh, direct evidence before claiming a fix, test, build, requirement or task is complete.
  - **When to use it:** Whenever reporting completion, verification, test/build results, bug fixes or PR readiness; follow the repository's stricter QA contract where applicable.
- **`executing-plans`**
  - **What it's used for:** Executes an already-approved implementation plan inline, task by task, with progress tracking and validation.
  - **When to use it:** Only when inline plan execution is the authorized approach; it must not replace, skip or reorder Specify → Plan → Tasks → Implement or override repository execution controls.
- **`systematic-debugging`**
  - **What it's used for:** Finds technical root causes through reproduction, evidence collection, hypothesis testing and focused fixes.
  - **When to use it:** Investigating bugs, failed tests, unexpected behavior, build/deployment failures or performance problems before attempting a fix.
- **`security-review`**
  - **What it's used for:** Reviews code and system paths for credible, exploitable security vulnerabilities and actionable remediation.
  - **When to use it:** Security audits or changes involving authentication, authorization, input handling, APIs, secrets, uploads, dependencies or CI/CD security.

**Automation and performance**

- **`github-actions-docs`**
  - **What it's used for:** Provides current official GitHub Actions documentation guidance for workflow syntax, triggers, jobs, permissions, reusable workflows, artifacts and security.
  - **When to use it:** Creating, updating or explaining GitHub Actions workflows; use actual workflow files and current official documentation as the source of truth.
- **`performance`**
  - **What it's used for:** Measures and improves real website performance, including Core Web Vitals, loading, responsiveness, assets, caching and runtime work.
  - **When to use it:** Investigating slow pages, jank, resource delivery or performance regressions; establish a comparable baseline and change only evidence-supported bottlenecks.

**Overlap and routing notes**

- Choose design guidance by the requested deliverable: website interface, interface audit, existing component library, static artwork or reference-site token extraction.
- Keep Cloudflare CLI operations distinct from Worker engineering guidance. General security reviews and platform-specific security practices may complement one another without replacing either.
- Root-cause investigation, completion evidence and performance measurement are complementary responsibilities, not competing definitions of "done."
- Inline plan execution is an execution aid, not an alternative governance or Spec Kit workflow. Workflow documentation does not override the repository's actual workflow definitions.
- Database guidance applies only within the owner's authorized task scope; it does not approve a provider change, new service or storage migration.

## 2. SPEC KIT AND EXECUTION

- Complete every coding task through all four Spec Kit stages, in order: **specify → plan → tasks → implement**.
- Follow the matching `.freebuff/cmds/speckit.*.md` definitions. All four stages apply; do not mark a stage N/A or invent a result.
- Reuse existing artifacts for the same task. Keep them concise; do not repeat completed stages or create duplicate feature directories.
- If a stage cannot run because of a genuine blocker, report the exact blocker and do not claim that stage is complete.
- Run the verification gate and report its actual outcome.
- Keep one active task per run and one branch/PR per task.
- Follow the active coding agent's execution and authorization controls. Continue without routine confirmation only when that mode authorizes it.
- Pause only for a genuine blocker, missing essential input, required approval, explicit blocking gate, or material safety/security risk.

## 3. SCOPE AND IMPLEMENTATION

- Establish the current baseline before changing code. Make the smallest correct change and preserve unrelated behavior.
- Keep existing visuals, artwork, wording, layout, navigation, functionality, audio, and monetization unchanged unless the user explicitly includes them in scope.
- Do not redesign, replace, or remove existing product behavior or assets to satisfy an unrelated checklist.
- Never expose or commit secrets.
- Never weaken validation, sanitization, authentication, authorization, CAPTCHA/Turnstile, rate limiting, duplicate protection, or environment handling.
- **Code quality and functional integrity are mandatory.** Keep code maintainable, reliable, secure, efficient, and consistent with the existing architecture and project standards.
- Preserve existing behaviour and system integrity. Changes MUST NOT break, weaken, bypass, or compromise existing features, services, integrations, data, or safeguards.
- Assess the impact on interconnected components, APIs, shared utilities, and dependent workflows before changing them.
- Avoid unnecessary complexity, duplicated logic, fragile workarounds, dependencies, and preventable technical debt.
- Prevent regressions by testing new functionality and existing behaviour that could be affected. A successful build alone does NOT prove functional correctness.
- If a requested change conflicts with existing functionality, security, or system integrity, preserve existing safeguards and report the conflict rather than compromising them.
- Preserve keyboard support, accessibility, responsive behavior, and `prefers-reduced-motion`.
- **Browser QA is mandatory for changes that affect browser-visible behavior or end-to-end user workflows.** Use Playwright first for the repository's CLI and Playwright Test workflows. Use Browserless for other direct browser-based tasks when it is the better fit, and as the remote-browser fallback when Playwright is unavailable or fails. For backend-only, infrastructure-only, or documentation-only work with no affected browser workflow, run the relevant automated or integration checks instead. Diagnose failures briefly. Never skip applicable browser QA because a tool fails.
- For direct browser work, use the repository's Microsoft Playwright CLI skill when it is present: read `.agents/skills/playwright-cli/SKILL.md` and invoke the locally installed CLI with `pnpm exec playwright cli`. Do not add a global install or separate CLI package. If the command is unavailable, check the repository's documented setup script and follow it if present; verify availability before proceeding. Use Browserless when a real CLI/browser launch failure blocks Playwright, or when a remote browser is more suitable for the assigned task; record the reason and actual error when it is a fallback. Do not assume a Linux dependency problem in advance or install system packages with elevated privileges.
- The CLI supports eight capability areas: (1) browser automation and interaction; (2) responsive and mobile QA; (3) test generation, execution, debugging and repair; (4) network and API inspection; (5) console debugging, traces and action recordings; (6) visual QA, screenshots and element inspection; (7) cookies, local/session storage and authentication state; and (8) documents, media and PR evidence. Use the relevant skill references for detailed procedures.
- The CLI is for direct agent browser interaction; it does not replace the existing Playwright Test suite, configured desktop/mobile projects, visual baselines, or CI checks.
- For audio work, follow `.freebuff/audio.md` and applicable repository guidance.

## 4. VERIFICATION AND PR READINESS

### QA contract [MANDATORY]

- **Scope [REQUIRED]:** Select checks from acceptance criteria, changed paths, and affected user workflows. Every applicable required check MUST run; an irrelevant check is `N/A` with a brief reason, not a failure. `N/A` never waives Spec Kit or another explicit gate.
- **Spec Kit [GATED]:** Complete all four stages in §2 and pass repository verification. This applies to every task, including documentation and governance work.
- **Browser/visual [CONDITIONAL GATE]:** Changes that can affect rendered output or browser workflows MUST pass the existing Visual QA/Playwright checks, including configured projects and committed baselines. Only positively classified documentation-only changes skip browser steps; empty, unknown, mixed, or unclassifiable changes fail closed and request visual QA. Other workflow gates still run.
- **Browser tools [RESTRICTED]:** Playwright is the primary CLI and test path; Browserless is available for direct browser tasks and as the remote-browser fallback. Automatic PR-checker workflows MUST use the existing Playwright path when visual QA is required and MUST NOT add or invoke Browserless.
- **Gatekeeper preflight [REQUIRED]:** Before implementation, inspect every applicable checked-in Gatekeeper workflow and its referenced scripts/configuration. Identify event and path filters, required artifacts, commands, thresholds, evidence, and failure conditions. Shape the changes and local verification to satisfy those requirements, then compare the final diff against them. Workflow files and their scripts are authoritative; the summaries below are an index, not a substitute for inspection.
- **DevSkim:** Scans pull requests except changes limited to devskim-alerts.md; its workflow also validates the suppression filter and uploads SARIF.
- **Validate OpenNext:** Runs for pull requests and merge groups, builds the app, enforces the 495 MiB size guard, and validates Cloudflare/OpenNext artifacts.
- **Visual QA:** Runs unit tests, TypeScript checking, and ./freebuff-verify.sh on pull requests. Browser visual-regression steps run only when the change classifier says rendered output may be affected. The classifier fails closed when it cannot classify changes.
- **Verification Integrity:** Audits current-HEAD check evidence on PR open/update/reopen. Skipped or unrun checks are not passes.
- **Protected File Authorization:** Applies only when the workflow's listed protected paths change; it requires human authorization before merge.
- **Updater Scheduler validation [PATH-CONDITIONAL]:** Runs on pull requests changing its listed scheduler, Spec Kit updater, documentation-updater, or related feature/memory paths. It tests scheduler mapping and safe dispatch, the Spec Kit customization rebase and safe upgrade in the isolated PR checkout, repository verification, the 495 MiB size guard, and a Wrangler dry-run. Its deployment job runs only on pushes to main; it is skipped for pull requests. Do not alter updater schedules or deploy the scheduler as part of unrelated tasks.
- **GitHub Code Scanning:** The repository receives GitHub Code Scanning Analyze jobs for Actions, JavaScript/TypeScript, and Python through GitHub's dynamic code-scanning workflow. Keep these results distinct from the named repository workflow checks. External review apps are advisory feedback, not proof that tests or builds passed.
- Do not describe workflow triggers as branch-protection-required statuses unless repository rules confirm that separately. The connected GitHub session could not read branch-protection settings, so that configuration remains unverified.
- **Integrations [WHEN USED/CHANGED]:** Verify a real result and relevant failure/fallback behavior, following §5's provider order and approvals. Firecrawl/Crawlbase retrieve page content; they do not replace browser rendering, interaction, or end-to-end checks.
- **Functional/accessibility/security/performance [WHEN AFFECTED]:** Test changed behavior and affected dependencies; preserve keyboard access, labels, contrast, reduced motion, security, and performance requirements where relevant. Do not fail a task for checks unrelated to its scope.
- **Failure diagnosis [REQUIRED]:** Distinguish a confirmed product defect from a flaky/invalid assertion or tool/environment failure. Do not dismiss a test failure as flaky without evidence; a required check blocked by tooling remains unresolved, not passed or a product defect.
- **Reporting [MANDATORY]:** Record each check as PASS, FAIL, BLOCKED, PENDING, NOT RUN, or N/A, with a reason and concise evidence. Put the complete task report in the PR description by following PR_SUBMISSION.md.

### Verification requirements

- Run ./freebuff-verify.sh and the checks required by every selected task group.
- Record the actual commands run and their real results.
- Inspect the complete final diff before submission.
- If a check fails, fix the in-scope cause or record the exact failure.
- If a required check is unavailable, explain why and run an applicable documented alternative where practical. A mandatory pre-submission check that remains failed or blocked prevents PR submission.
- Keep implementation status separate from verification status. Mark implementation COMPLETE only when all in-scope changes and required task artifacts are in place, the final diff is reviewed, and no known in-scope defect remains.
- A check that can only be triggered by PR creation may be recorded as PENDING — runs automatically when the PR is created; never describe it as passed or use that exception to skip an equivalent local check.
- State exactly what remains unverified.

### PR handoff

When implementation, Spec Kit artifacts, applicable pre-submission checks, and the complete diff review are finished, follow PR_SUBMISSION.md. It is the single procedure for preparing the complete PR description, confirming the correct head and base, submitting one non-draft PR, and stopping. Do not duplicate that procedure here.

## 5. APPROVALS, CONNECTED INTEGRATIONS, AND PR OWNERSHIP

### Owner approval

Get explicit owner authorization before changing:

- `AGENTS.md` or repository governance.
- Stripe/payments, database/schema, or authentication/security.
- API routes or existing application functionality.
- Cloudflare Pages hosting, deployment/build configuration, environment variables, or secrets.
- Accessibility/responsive behavior or approved visual/product behavior.
- The documentation updater/refresh system.

A task request that clearly specifies a protected change is explicit authorization for that exact scope; do not ask for the same approval twice. A vague request or indirect implication is not approval. Pause only the affected change when authorization is genuinely missing. Authorization applies only to the specific approved scope and does not authorize wider or unrelated changes.

### Connected Integrations

Use the connected integrations below when they materially support the assigned task. Use the required default and owner-approved fallback as stated. Do not make unnecessary calls, expand task scope through an integration, or claim use when it did not occur.

- **Browserless:** Connected remote-browser capability for direct browser automation, page interaction, screenshots, responsive checks and other browser-based tasks. Use it when it is the better fit for a remote browser or when Playwright is unavailable or fails. No additional approval is required for ordinary, task-scoped browser work.
- **Crawlbase:** Secondary / fallback provider for website content retrieval when Firecrawl is unavailable, fails, is blocked, or cannot retrieve the required content. Do not use both for the same request unless there is a specific reason.
- **Firecrawl:** Primary / preferred provider for website search, crawling, scraping, URL mapping and extracting page content. Use it first when web-content retrieval is needed and its capabilities fit the task.
- **GitHub:** Always available for normal authorized repository work, including repository inspection, file access, branches, commits, issues and pull requests. No additional owner approval is needed for routine use within the assigned task. Existing safeguards for destructive or high-risk actions remain in force.
- **Penpot:** Available whenever useful for UI design, layout exploration, visual concepts and prototyping. It may be used without additional owner approval when relevant and within the authorized task scope.
- **Supabase:** Connected platform tooling for task-scoped Supabase work when materially relevant. It is not an approved storage or database provider for Lucky Pick Canada's production application. Do not migrate production data, change app storage, or connect production features to Supabase under this tooling entry.
- **Turso:** Connected platform tooling for task-scoped Turso work when materially relevant. It is not an approved storage or database provider for Lucky Pick Canada's production application. Do not migrate production data, change app storage, or connect production features to Turso under this tooling entry.

**Playwright CLI is a project-local command-line tool, not a connected integration.** Use `pnpm exec playwright cli` and the existing Playwright package/version for direct CLI work and the Playwright Test suite. Browserless is the only connected remote-browser service retained for direct browser tasks and as the fallback when Playwright is unavailable or fails. Automatic PR-checker workflows MUST use the existing Playwright path when visual QA is required and MUST NOT add or invoke Browserless. Firecrawl and Crawlbase retrieve page content; they do not replace browser rendering, interaction or end-to-end checks. Other connected integrations may be used when they materially help the assigned task and fall within the user's authorization and the integration's permissions. Obtain explicit approval before external side effects, paid usage, destructive actions, or sharing sensitive data beyond the authorized task. Existing approval rules for repository, database, security and deployment changes still apply. A connection or initialization alone does not count as actual integration use.

### PR ownership

- Agents may create/update PRs and run checks.
- Agents must **never merge**, squash-merge, rebase-merge, enable auto-merge, or otherwise complete a PR.
- Leave every PR **OPEN and UNMERGED** for the human owner.

## 6. BUILD, HOSTING, AND EXECUTION SAFETY

- **495 MiB is the absolute hard maximum build size.** The measured production build output MUST remain strictly below 495 MiB. Measure and report every build.
- If a build is predicted to reach the limit, split the work into independently reviewable PRs before adding the change. Each PR must remain below 495 MiB; never raise the cap, bundle changes that push the build to the limit, or treat 495 MiB itself as acceptable. If an actual build reaches or exceeds 495 MiB, stop and report the measured size and safe resume point.
- Use the package manager declared in `package.json` (currently `pnpm@10.30.3`); keep dependency installation and lockfile changes consistent with it. An owner-configured environment startup installer may differ only when it preserves the committed lockfile and dependency resolution. Never use `npm ci`. Inspect `package.json` before using or claiming a script.
- Lucky Pick Canada uses **Cloudflare Pages** for hosting and deployment.
- For hosting/build configuration tasks, use applicable Cloudflare Pages and Wrangler documentation. Keep recommendations and implementation compatible with the existing Cloudflare Pages setup; do not propose unrelated hosting platforms or migrations.
- This hosting information does not authorize deployment, Cloudflare configuration, environment-variable, or secret changes. The approval rules in §5 still apply.
- Cloudflare Pages is the hosting platform, not a connected integration.

## 7. FINAL CHECK

Before reporting **verified completion**, confirm:

1. All four required Spec Kit stages and their artifacts are accounted for.
2. `./freebuff-verify.sh` and all mandatory task-group checks passed.
3. The complete final diff matches the reported files.
4. Verification statuses are accurate and unresolved risks are stated.
5. The PR handoff follows PR_SUBMISSION.md.
6. The PR remains **OPEN and UNMERGED**.

🔴 **NO EVIDENCE = NO CLAIM.**

🔴 **NO VERIFIED RESULT = NO VERIFIED COMPLETION.**

🔴 **NO ACCURATE PR HANDOFF = NO COMPLETION.**
