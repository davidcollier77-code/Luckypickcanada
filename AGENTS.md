# AGENTS.md — REPOSITORY GOVERNANCE

🔴 READ FIRST. VERIFY BEFORE CLAIMING.

This is the repository's single authoritative workflow and safety policy for every coding agent, including Freebuff. No separate general-purpose Freebuff entrypoint is used. The user's task request defines the outcome and scope. Follow this file and the task request; pause only the affected action when a genuine blocker, required approval, prerequisite, or safety issue remains.

## 1. INITIALIZE ONCE

Complete these steps in order before implementation:

1. Read and follow `AGENTS.md`.
2. Identify the task's requested outcome, scope, constraints, and acceptance criteria. Note missing essential information and required approvals; do not ask generic "continue?" questions.
3. Inspect the current branch/worktree, relevant files, task artifacts, and existing branches/PRs for the same task. Do not duplicate active work.
4. Read `memory-bank/projectBrief.md` and `memory-bank/activeContext.md` once. Use only relevant context.
5. Select at least one applicable task group: `creation`, `troubleshooting`, `polishing`, `testing`, `security`, `audio`, `deep-dive`, or `seo`. Read each selected group's `.freebuff/<group>.md`.
6. Read `.docs/manifest.json` and use it to route only reference documents that materially help with the task and selected groups.
7. Use enabled Freebuff skills when relevant, including `frontend-design`, `web-design-guidelines`, `image-to-code`, `shadcn-ui`, `wrangler`, `verification-before-completion`, `executing-plans`, `security-review`, `github-actions-docs`, `canvas-design`, `systematic-debugging`, `workers-best-practices`, `neon-postgres`, `extract-design-system`, `mcp-builder`, and `performance`.

- Treat `.docs/` as a reference library, not automatic instructions. The manifest is an index, not a requirement to read every source.
- No document has automatic priority or mandatory use based only on its name or subject. Do not load unrelated specialist files, command definitions, or library snapshots.
- Keep `.docs/` read-only unless the owner explicitly authorizes adding, removing, or materially updating library documents in the task request.

## 2. SPEC KIT AND EXECUTION

- Complete every coding task through all four Spec Kit stages, in order: **specify → plan → tasks → implement**.
- Follow the matching `.freebuff/cmds/speckit.*.md` definitions. Do not mark a stage N/A or invent a result.
- Reuse existing artifacts for the same task. Keep them concise; do not repeat completed stages or create duplicate feature directories.
- If a stage is blocked, report the exact blocker and do not claim completion. Run the verification gate and report its actual outcome.
- Keep one active task per run and one branch/PR per task.
- Follow the active agent's execution and authorization controls. Continue without routine confirmation only when that mode authorizes it.
- Pause only for a genuine blocker, missing essential input, required approval, explicit blocking gate, or material safety/security risk.

## 3. SCOPE AND IMPLEMENTATION

- Establish the baseline and make the smallest correct change. Preserve unrelated behavior.
- Keep existing visuals, artwork, wording, layout, navigation, functionality, audio, and monetization unchanged unless the user explicitly includes them in scope.
- Do not change unrelated systems to satisfy a checklist.
- Never expose or commit secrets or weaken validation, sanitization, authentication, authorization, CAPTCHA/Turnstile, rate limiting, duplicate protection, or environment handling.
- Preserve keyboard support, accessibility, responsive behavior, and `prefers-reduced-motion`.
- For visual work, use the configured Playwright setup. For audio work, follow `.freebuff/audio.md` and applicable repository guidance.

## 4. VERIFICATION AND ONE CANONICAL PR SUMMARY

- Run `./freebuff-verify.sh` and the checks required by every selected task group. Record the actual commands and results.
- Inspect the complete final diff. Fix in-scope failures or report the exact failure. If a required check is unavailable, explain why and run a documented alternative where practical.
- Keep implementation and verification status separate. Mark implementation `COMPLETE` only when in-scope changes and required artifacts are in place, the final diff is reviewed, and no known in-scope defect remains.
- Record every required check as `PASS`, `FAIL`, `BLOCKED`, `PENDING`, or `NOT RUN`. Never present pending checks as passed.
- A failed, blocked, or pending mandatory check prevents **verified completion** and `USEFUL RESULT: YES`. It does not by itself prevent reporting implementation as complete or opening/updating a safe, reviewable PR. State exactly what remains unverified.

The PR body is the **single canonical summary**. Draft it during the work, publish it when creating the PR, and update that same body as evidence changes. Do not create duplicate reports or ask whether the summary should be created or updated.

Include in the concise PR summary:
- Task goal, selected task group(s), and a brief reason for each.
- Implementation result and exact files changed.
- Required Spec Kit stages and artifact paths.
- Only reference documents/resources that materially informed the work.
- Actual verification commands/results, including failures, blockers, pending checks, and checks not run.
- Preserved behavior, remaining issues/risks, and final diff/error-check results.
- `USEFUL RESULT: YES/NO`; use YES only when the requested result is verified.

Do not create a separate report, a per-resource USED/USEFUL/version matrix, or an inventory of irrelevant documents. The PR summary may accurately report pending items; verified completion still requires every mandatory gate to pass.

If branch history, merge-base checks, or push permissions block publishing, diagnose the actual state and preserve all work. Never force-push, discard commits, or ask the owner to force-push as a routine workaround. Recover on a clean branch only when the intended changes are identifiable and safe. Otherwise report the exact command/error, branch/ref, and relevant commit SHA; ask one focused question only when owner action is required.

## 5. APPROVALS, CONNECTED TOOLS, AND PR OWNERSHIP

- Agents may create/update PRs and run checks, but must **never merge**, squash-merge, rebase-merge, enable auto-merge, or otherwise complete a PR. Leave every PR **OPEN and UNMERGED** for the human owner.
- Get explicit owner authorization before changing:
  - `AGENTS.md` or repository governance;
  - Stripe/payments, database/schema, or authentication/security;
  - API routes or existing application functionality;
  - Cloudflare Pages hosting, deployment/build configuration, environment variables, or secrets;
  - accessibility/responsive behavior or approved visual/product behavior;
  - the documentation updater/refresh system.
- Authorization applies only to the approved scope.

Use connected MCP integrations only when materially relevant:
- **GitHub:** Repository files, branches, commits, issues, and PRs. It has substantial repository access; use it carefully and only for authorized repository work.
- **Neon:** PostgreSQL database inspection and management.
- **Stitch:** UI design and prototyping.
- **Browserless:** Live-site browsing, screenshots, page interaction, and browser testing.
- **Browserbase:** Remote browser sessions, website interaction, and browser testing.

Neon and Stitch may be used without additional approval when materially relevant and within the user's authorized task scope. Other MCPs require approval unless separately authorized. Do not use an MCP merely because it is available, expand scope through an MCP, or treat connection/initialization as actual use.

## 6. BUILD, HOSTING, AND EXECUTION SAFETY

- **495 MB is the hard maximum build size.** Measure and report every build. If it reaches or exceeds 495 MB, stop and report the measured size and safe resume point.
- Use pnpm; never use `npm ci`. Inspect `package.json` before using or claiming a script.
- Lucky Pick Canada uses **Cloudflare Pages** for hosting and deployment. For hosting/build configuration tasks, use applicable Cloudflare Pages and Wrangler documentation. Keep recommendations and implementation compatible with the existing setup; do not propose unrelated hosting platforms or migrations.
- This hosting information does not authorize deployment, Cloudflare configuration, environment-variable, or secret changes. The approval rules in §5 still apply. Cloudflare Pages is the hosting platform, not an MCP integration.

## 7. FINAL CHECK

Before reporting **verified completion**, confirm:

1. All required Spec Kit stages and artifacts are accounted for.
2. `./freebuff-verify.sh` and all mandatory checks passed.
3. The complete final diff matches the reported files.
4. Unresolved risks are stated.
5. The PR remains **OPEN and UNMERGED**.

🔴 **NO EVIDENCE = NO CLAIM.**

🔴 **NO VERIFIED RESULT = NO VERIFIED COMPLETION.**

🔴 **NO ACCURATE PR SUMMARY = NO COMPLETION.**
