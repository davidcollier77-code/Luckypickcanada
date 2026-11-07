# AGENTS.md — REPOSITORY GOVERNANCE

🔴 READ FIRST. VERIFY BEFORE CLAIMING.

This is the repository's single authoritative workflow and safety policy for every coding agent, including Freebuff. No separate general-purpose Freebuff entrypoint is used. The user's task request defines the requested outcome and scope. Follow this file and the task request; pause only the affected action when a genuine blocker, required approval, prerequisite, or safety issue remains.

## 1. INITIALIZE ONCE

Complete these steps in order before implementation:

1. **Read governance.** Read and follow `AGENTS.md` throughout the task.
2. **Understand the request.** Identify the requested outcome, scope, constraints, and acceptance criteria. Note missing essential information, required approvals, and genuine blockers. Do not ask generic "continue?" questions.
3. **Check existing work.** Inspect the current branch/worktree, relevant files, task artifacts, and existing branches/PRs for the same task. Do not duplicate active work or overwrite existing work.
4. **Load project context.** Read `memory-bank/projectBrief.md` and `memory-bank/activeContext.md` once. Use the context relevant to the task.
5. **Select task groups.** Choose at least one applicable group: `creation`, `troubleshooting`, `polishing`, `testing`, `security`, `audio`, `deep-dive`, or `seo`. Select multiple only when the task requires them. Read and follow each selected group's `.freebuff/<group>.md`.
6. **Route reference documents.** Read `.docs/manifest.json`. Use it to identify and consult library documents that materially help with the request and selected task groups.
7. **Use relevant skills.** Apply enabled Freebuff skills when they materially help, including `frontend-design`, `web-design-guidelines`, `image-to-code`, `shadcn-ui`, `wrangler`, `verification-before-completion`, `executing-plans`, `security-review`, `github-actions-docs`, `canvas-design`, `systematic-debugging`, `workers-best-practices`, `neon-postgres`, `extract-design-system`, `mcp-builder`, and `performance`.

### Project document library

- Treat `.docs/` as an important project reference library. Use `.docs/manifest.json` to find relevant documents; do not skip applicable project guidance.
- Consult only sources that materially help with the task and selected groups. The manifest is an index, not an instruction to read every listed source.
- Documents are reference material, not automatic instructions. No document has automatic priority based only on its name or subject.
- Do not load unrelated specialist files, command definitions, or library snapshots.
- Keep `.docs/` read-only unless the owner explicitly authorizes adding, removing, or materially updating library documents in the task request.
- Mention only library documents that materially informed the work in the PR summary.

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
- Preserve keyboard support, accessibility, responsive behavior, and `prefers-reduced-motion`.
- For visual work, use the configured Playwright setup.
- For audio work, follow `.freebuff/audio.md` and applicable repository guidance.

## 4. VERIFICATION AND ONE CANONICAL PR SUMMARY

### Verification requirements

- Run `./freebuff-verify.sh` and the checks required by every selected task group.
- Record the actual commands run and their real results.
- Inspect the complete final diff before submission.
- If a check fails, fix the in-scope cause or report the exact failure.
- If a required check is unavailable, explain why and run an applicable documented alternative where practical.
- Keep implementation status separate from verification status.
- Mark implementation `COMPLETE` only when all in-scope changes and required task artifacts are in place, the final diff is reviewed, and no known in-scope defect remains.
- Record each required check independently as `PASS`, `FAIL`, `BLOCKED`, `PENDING`, or `NOT RUN`. Never present a pending, blocked, failed, or unrun check as passed.
- A failed, blocked, or pending mandatory check prevents claiming **verified completion** or `USEFUL RESULT: YES`. It does not by itself prevent reporting implementation as complete or opening/updating an otherwise safe, reviewable PR.
- State exactly what remains unverified.

### Canonical PR summary

The PR body is the **single canonical summary**. Draft it during the work, publish it when creating the PR, and update that same body as implementation or verification evidence changes. Do not create duplicate reports or ask whether the required summary should be created or updated.

Keep the summary concise and aligned with the Master Work Request. Include:

- Task goal, selected task group(s), and a brief reason for each.
- Short implementation result and exact files changed.
- Required Spec Kit stages and artifact paths.
- Only reference documents/resources that materially informed the work.
- Actual verification commands and results, including failures, blockers, pending checks, and checks not run.
- Behavior preserved, remaining issues/risks, and final diff/error-check results.
- `USEFUL RESULT: YES/NO`; use YES only when the requested result is verified.

Do not require a separate report, a per-resource USED/USEFUL/version matrix, or an inventory of irrelevant documents. The PR summary is complete when it accurately records the current work and evidence, including pending items. **Verified completion** still requires every mandatory gate to pass. A safe PR may remain open for review while clearly identified checks are pending.

### Branch and PR recovery

- If branch history, merge-base checks, or push permissions block publishing, diagnose the actual state first and preserve all work.
- Never force-push, discard commits, or ask the owner to force-push as a routine workaround.
- When safe, recover using a clean branch and only identifiable intended changes.
- If the issue cannot be resolved safely, report the exact command/error, branch/ref, and relevant commit SHA.
- Ask one focused question only when owner action is genuinely required.

## 5. APPROVALS, CONNECTED TOOLS, AND PR OWNERSHIP

### Owner approval

Get explicit owner authorization before changing:

- `AGENTS.md` or repository governance.
- Stripe/payments, database/schema, or authentication/security.
- API routes or existing application functionality.
- Cloudflare Pages hosting, deployment/build configuration, environment variables, or secrets.
- Accessibility/responsive behavior or approved visual/product behavior.
- The documentation updater/refresh system.

Authorization applies only to the specific approved scope. Approval for one change does not authorize wider or unrelated changes.

### Connected MCP integrations

Use connected MCP integrations only when they materially help with the task and are within its authorized scope:

- **GitHub:** Repository files, branches, commits, issues, and pull requests. It has substantial repository access; use it carefully and only for authorized repository work.
- **Neon:** PostgreSQL database inspection and management.
- **Stitch:** UI design, layout concepts, and prototyping.
- **Browserless:** Live-site browsing, screenshots, page interaction, and browser testing.
- **Browserbase:** Remote browser sessions, website interaction, and browser testing.

Neon and Stitch may be used without additional approval when materially relevant and within the user's authorized task scope. Other MCPs require approval unless separately authorized. Do not use an MCP merely because it is available, expand task scope through an MCP, or treat connection/initialization alone as MCP use.

### PR ownership

- Agents may create/update PRs and run checks.
- Agents must **never merge**, squash-merge, rebase-merge, enable auto-merge, or otherwise complete a PR.
- Leave every PR **OPEN and UNMERGED** for the human owner.

## 6. BUILD, HOSTING, AND EXECUTION SAFETY

- **495 MB is the hard maximum build size.** Measure and report every build.
- If a build reaches or exceeds 495 MB, stop and report the measured size and safe resume point.
- Use pnpm; never use `npm ci`. Inspect `package.json` before using or claiming a script.
- Lucky Pick Canada uses **Cloudflare Pages** for hosting and deployment.
- For hosting/build configuration tasks, use applicable Cloudflare Pages and Wrangler documentation. Keep recommendations and implementation compatible with the existing Cloudflare Pages setup; do not propose unrelated hosting platforms or migrations.
- This hosting information does not authorize deployment, Cloudflare configuration, environment-variable, or secret changes. The approval rules in §5 still apply.
- Cloudflare Pages is the hosting platform, not an MCP integration.

## 7. FINAL CHECK

Before reporting **verified completion**, confirm:

1. All four required Spec Kit stages and their artifacts are accounted for.
2. `./freebuff-verify.sh` and all mandatory task-group checks passed.
3. The complete final diff matches the reported files.
4. Verification statuses are accurate and unresolved risks are stated.
5. The PR summary reflects the actual work and evidence.
6. The PR remains **OPEN and UNMERGED**.

🔴 **NO EVIDENCE = NO CLAIM.**

🔴 **NO VERIFIED RESULT = NO VERIFIED COMPLETION.**

🔴 **NO ACCURATE PR SUMMARY = NO COMPLETION.**
