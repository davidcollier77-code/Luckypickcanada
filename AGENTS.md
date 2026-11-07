# AGENTS.md — REPOSITORY GOVERNANCE

🔴 READ FIRST. VERIFY BEFORE CLAIMING.

This is the repository's single authoritative workflow and safety policy for every coding agent, including Freebuff. The user's task request defines the requested outcome and scope. If instructions conflict, follow this file and the task request; pause only the affected action when a genuine blocker, approval, prerequisite, or safety issue remains.

## 1. GOVERNANCE AND NON-NEGOTIABLE RULES

- Read and follow `AGENTS.md` throughout every task.
- Follow the user's requested scope and acceptance criteria.
- Do not bypass required approvals or safety controls.
- Do not expose or commit secrets.
- Do not weaken validation, sanitization, authentication, authorization, CAPTCHA/Turnstile, rate limiting, duplicate protection, or environment handling.
- Agents may create and update PRs and run checks.
- Never merge, squash-merge, rebase-merge, enable auto-merge, or otherwise complete a PR.
- Leave every PR **OPEN and UNMERGED** for the human owner.

## 2. INITIALIZE ONCE

Complete these steps in order before implementation:

1. **Read governance.** Read `AGENTS.md` and follow its rules.
2. **Understand the request.** Identify the outcome, scope, constraints, and acceptance criteria. Note missing essential information, required approvals, and genuine blockers. Do not ask generic "continue?" questions.
3. **Check existing work.** Inspect the current branch/worktree, relevant files, task artifacts, and existing branches/PRs for the same task. Do not duplicate active work.
4. **Load project context.** Read `memory-bank/projectBrief.md` and `memory-bank/activeContext.md` once. Use only relevant context.
5. **Select task groups.** Choose at least one applicable group: `creation`, `troubleshooting`, `polishing`, `testing`, `security`, `audio`, `deep-dive`, or `seo`. Select multiple only when needed. Read each selected `.freebuff/<group>.md`.
6. **Route reference documents.** Read `.docs/manifest.json`. Consult only documents that materially help with the request and selected groups.
7. **Use relevant skills.** Apply enabled Freebuff skills when they materially help, including `frontend-design`, `web-design-guidelines`, `image-to-code`, `shadcn-ui`, `wrangler`, `verification-before-completion`, `executing-plans`, `security-review`, `github-actions-docs`, `canvas-design`, `systematic-debugging`, `workers-best-practices`, `neon-postgres`, `extract-design-system`, `mcp-builder`, and `performance`.

- Treat `.docs/` files as ordinary reference material, not automatic instructions.
- Do not read every document, unrelated specialist file, command definition, or library snapshot.
- Keep `.docs/` read-only unless the owner explicitly authorizes adding, removing, or materially updating library documents in the task request.

## 3. SPEC KIT AND TASK EXECUTION

- Complete all four Spec Kit stages in order: **specify → plan → tasks → implement**.
- Follow the matching `.freebuff/cmds/speckit.*.md` definitions.
- Reuse existing artifacts for the same task.
- Keep artifacts concise; do not repeat completed stages or create duplicate feature directories.
- Do not mark a required stage N/A or invent a result.
- If a stage is blocked, report the exact blocker and do not claim completion.
- Keep one active task per run and one branch/PR per task.
- Follow the active coding agent's execution and authorization controls.
- Continue without routine confirmation only when the agent's mode authorizes it.
- Pause only for a genuine blocker, missing essential input, required approval, explicit blocking gate, or material safety/security risk.

## 4. APPROVALS, CONNECTED TOOLS, AND HOSTING

### Owner approval

Get explicit owner authorization before changing:

- `AGENTS.md` or repository governance.
- Stripe/payments.
- Database/schema.
- Authentication/security.
- API routes or existing application functionality.
- Cloudflare Pages hosting, deployment, build configuration, environment variables, or secrets.
- Accessibility/responsive behavior or approved visual/product behavior.
- The documentation updater/refresh system.

- Authorization applies only to the specific approved scope.
- Do not treat approval for one change as approval for related or wider changes.

### Connected MCP integrations

Use these integrations only when they materially help with the task and are within its authorized scope:

- **GitHub:** Repository access and operations, including files, branches, commits, issues, and pull requests. This integration has substantial repository access; use it carefully and only for authorized work.
- **Neon:** Inspecting and managing the PostgreSQL database.
- **Stitch:** UI design, layout concepts, and prototyping.
- **Browserless:** Live website browsing, screenshots, page interaction, and browser testing.
- **Browserbase:** Remote browser sessions, website interaction, and browser-based testing.

- Do not use an MCP merely because it is available.
- Do not expand task scope or bypass approval requirements through an MCP.
- A connection or initialization alone does not count as MCP use.

### Hosting platform

- Lucky Pick Canada uses **Cloudflare Pages** for hosting and deployment.
- For hosting, build, or deployment-configuration tasks, use applicable Cloudflare Pages and Wrangler documentation.
- Keep recommendations and implementation compatible with the existing Cloudflare Pages setup.
- Do not introduce unrelated hosting platforms, migration suggestions, or platform-specific configuration.
- This hosting information does not authorize deployment or Cloudflare configuration changes; owner approval is still required.
- Cloudflare Pages is the hosting platform, not an MCP integration.

## 5. SCOPE AND IMPLEMENTATION

- Establish the current baseline before changing code.
- Make the smallest correct change.
- Preserve unrelated behavior.
- Keep existing visuals, artwork, wording, layout, navigation, functionality, audio, and monetization unchanged unless the user explicitly includes them in scope.
- Do not change unrelated systems to satisfy a checklist.
- Preserve keyboard support, accessibility, responsive behavior, and `prefers-reduced-motion`.
- For visual work, use the configured Playwright setup.
- For audio work, follow `.freebuff/audio.md` and applicable repository guidance.

## 6. VERIFICATION AND TESTING

- Run `./freebuff-verify.sh`.
- Run the checks required by every selected task group.
- Inspect the complete final diff.
- Record the commands actually run and their real results.
- If a check fails, fix the in-scope cause or report the exact failure.
- If a required check is unavailable, explain why and run an applicable documented alternative where practical.
- Keep implementation status separate from verification status.
- Use only these check statuses: `PASS`, `FAIL`, `BLOCKED`, `PENDING`, or `NOT RUN`.
- A failed, blocked, or pending mandatory check prevents claiming **verified completion** or `USEFUL RESULT: YES`.
- A failed, blocked, or pending check does not by itself prevent reporting implementation as complete or opening/updating an otherwise safe, reviewable PR.
- State exactly what remains unverified.

### Build and execution safety

- **495 MB is the hard maximum build size.**
- Measure and report every build.
- If a build reaches or exceeds 495 MB, stop and report the measured size and safe resume point.
- Use pnpm; never use `npm ci`.
- Inspect `package.json` before using or claiming a script.

## 7. PULL REQUEST SUMMARY AND BRANCH SAFETY

- The PR body is the single canonical summary.
- Draft the summary during the work, publish it when creating the PR, and update that same body as implementation or verification evidence changes.
- Do not create duplicate reports or PRs.
- Do not ask whether the required summary should be created or updated.
- Keep the summary concise and aligned with the Master Work Request.
- Include:
  - Task goal and selected task group(s), with a brief reason for each.
  - Short implementation result and exact files changed.
  - Required Spec Kit stages and artifact paths.
  - Only reference documents/resources that materially informed the work.
  - Actual verification commands and results, including failures, blockers, pending checks, and checks not run.
  - Behavior preserved, remaining issues/risks, and final diff/error-check results.
  - `USEFUL RESULT: YES/NO`; use YES only when the requested result is verified.
- Do not add a separate report, a per-resource USED/USEFUL/version matrix, or an inventory of irrelevant documents.
- Pending checks are truthful statuses, not a reason to withhold a safe PR. Never present them as passed.
- The PR summary is complete when it accurately records the current work and evidence, including pending items. **Verified completion** still requires every mandatory gate to pass.

### Branch and PR recovery

- If branch history, merge-base checks, or push permissions block publishing, diagnose the actual state first and preserve all work.
- Never force-push, discard commits, or ask the owner to force-push as a routine workaround.
- When safe, recover using a clean branch and only identifiable intended changes.
- If the issue cannot be resolved safely, report the exact command/error, branch/ref, and relevant commit SHA.
- Ask one focused question only when owner action is genuinely required.

## 8. FINAL CHECK

Before reporting **verified completion**, confirm:

1. All required Spec Kit stages and artifacts are accounted for.
2. `./freebuff-verify.sh` and all mandatory checks passed.
3. The complete final diff matches the reported files.
4. Remaining issues and risks are stated.
5. The PR remains **OPEN and UNMERGED**.

🔴 **NO EVIDENCE = NO CLAIM.**

🔴 **NO VERIFIED RESULT = NO VERIFIED COMPLETION.**

🔴 **NO ACCURATE PR SUMMARY = NO COMPLETION.**
