# AGENTS.md — REPOSITORY GOVERNANCE

🔴 READ FIRST. VERIFY BEFORE CLAIMING.

This is the repository's authoritative workflow and safety policy. The user's task request defines the requested outcome and scope. When instructions appear inconsistent, resolve the wording against this file and the task request; pause only the affected action if a genuine authorization, safety, or prerequisite blocker remains.

## 1. INITIALIZE ONCE

1. Read this file first.
2. Read `memory-bank/projectBrief.md` and `memory-bank/activeContext.md` once.
3. Select exactly one applicable group: `creation`, `troubleshooting`, `polishing`, `testing`, `security`, `audio`, `deep-dive`, or `seo`.
4. Read `.docs/manifest.json` for routing, then consult the selected group's documents in `.docs/<group>/` that are useful to the task. The Gemini API reference `.docs/<group>/_websites_ai_google_dev_gemini-api.md` is mandatory for every task: use it as a baseline when interpreting the task and choosing the approach, and continue using it throughout the work. Use the other group documents that materially help with the task; do not read unrelated references.
5. Inspect the current branch/worktree, relevant files and task artifacts, plus any existing branch or PR for the same task. Consult library/version references only when materially relevant.

The Gemini CLI snapshot `.docs/<group>/_google-gemini_gemini-cli.md` is an ordinary reference document within the applicable group, not a separate mandatory reading or special workflow requirement. Consult it only when useful to the task. The manifest is an index, not an instruction to read every listed source. Do not load unrelated specialist files, command definitions, or library snapshots. Treat `.docs/` as read-only unless a specifically authorized documentation-refresh task permits edits.

## 2. SPEC KIT AND EXECUTION

Every Jules task must complete the four core Spec Kit stages in order: `specify → plan → tasks → implement`, following the matching `.jules/cmds/speckit.*.md` definitions. All four stages apply under this repository's workflow; do not mark one N/A or invent a result. Reuse current artifacts for the same task, keep them concise, and do not repeat completed stages or create duplicate feature directories. If a stage cannot run because of a genuine blocker, report the exact blocker and do not claim completion. Run the verification gate and report its actual outcome.

Keep one active task per run and one branch/PR per task. Check for existing work before creating anything new. Respect Jules's active execution/authorization mode: continue without routine confirmation only when that mode authorizes it; never bypass a required approval. Pause only for a genuine blocker, missing essential input, required approval, explicit blocking gate, or material safety/security risk. Do not ask generic "continue?" questions for non-blocking checklist items.

## 3. SCOPE AND IMPLEMENTATION

Establish the baseline, make the smallest correct change, and preserve unrelated behavior. Keep protected visuals, wording, layout, navigation, functionality, audio, and monetization unchanged unless the user explicitly includes them. Do not change unrelated systems to satisfy a checklist. Never expose or commit secrets or weaken validation, sanitization, authentication, authorization, CAPTCHA/Turnstile, rate limiting, duplicate protection, or environment handling.

## 4. VERIFICATION AND ONE CANONICAL PR SUMMARY

Run `./jules-verify.sh` and the checks required by the selected task group. Record the commands actually run and their real results. If a check fails, fix the in-scope cause or report the exact failure. If a required check is unavailable, explain why and run an applicable documented alternative where practical. Keep implementation and verification status separate. Mark implementation `COMPLETE` only when all in-scope changes and required task artifacts are in place, the final diff is reviewed, and no known in-scope defect remains. Record each required check independently as `PASS`, `FAIL`, `BLOCKED`, `PENDING`, or `NOT RUN`. A failed, blocked, or pending mandatory check prevents claiming **verified completion** or `USEFUL RESULT: YES`, but does not by itself prevent reporting implementation as complete or opening/updating an otherwise safe, reviewable PR. State exactly what remains unverified.

Inspect the complete final diff before submission. The PR body is the single canonical summary: draft it during the work, publish it when creating the PR, and update that same body as implementation or verification evidence changes. Never create duplicate reports or PRs, and do not ask whether the required summary should be created or updated. Clearly label checks as `PASS`, `FAIL`, `BLOCKED`, `PENDING`, or `NOT RUN`. Pending checks are a truthful status, not a reason to withhold a safe PR; they must never be presented as passed.

Keep the summary concise and aligned with the Master Work Request. Include:
- Task goal, selected task group, and brief reason for that group.
- Short implementation result and exact files changed.
- Required Spec Kit stages and artifact paths; mention only routed documents/resources that materially informed the work.
- Actual verification commands and results, including anything failed, blocked, pending, or not run.
- Behavior preserved, remaining issues/risks, and the final diff/error check.
- `USEFUL RESULT: YES/NO`; use YES only when the requested result is verified.

Do not require a separate report, a per-resource USED/USEFUL/version matrix, or an inventory of irrelevant documents. The PR summary is complete when it accurately records the current work and evidence, including pending items; **verified completion** still requires every mandatory gate to pass.

If branch history, merge-base checks, or push permissions block publishing, diagnose the actual state first and preserve all work. Never force-push, discard commits, or ask the owner to force-push as a routine workaround. When safe, recover using a clean branch and only identifiable intended changes. If it cannot be resolved safely, report the exact command/error, branch/ref, and relevant commit SHA, then ask one focused question only if owner action is genuinely required.

## 5. APPROVALS AND PR OWNERSHIP

Agents may create/update PRs and run checks, but must **never merge**, squash-merge, rebase-merge, enable auto-merge, or otherwise complete a PR. Leave every PR OPEN and UNMERGED for the human owner.

Explicit owner authorization is required before changing:
- `AGENTS.md` or repository governance;
- Stripe/payments, database/schema, authentication/security;
- API routes or existing application functionality;
- Cloudflare, Vercel, deployment, environment variables, or secrets;
- accessibility/responsive behavior or approved visual/product behavior;
- the documentation updater/refresh system.

Authorization applies only to the specific approved scope. Follow `.jules/jules.md` for MCP approvals. Context7 requires explicit owner approval before each invocation; other MCPs require approval unless separately authorized. Do not use an external MCP merely because it is available.

## 6. BUILD AND EXECUTION SAFETY

495 MB is the hard maximum build size. Measure and report every build; if it reaches or exceeds 495 MB, stop and report the measured size and safe resume point. Use pnpm, never `npm ci`, and inspect `package.json` before using or claiming a script. For visual work, use the configured Playwright setup; for audio work, follow `.jules/audio.md` and applicable repository guidance. Preserve keyboard support, accessibility, responsive behavior, and `prefers-reduced-motion`.

## 7. FINAL CHECK

Before reporting **verified completion**, confirm the required Spec Kit stages/artifacts are accounted for, `./jules-verify.sh` and all mandatory checks passed, the final diff matches the reported files, unresolved risks are stated, and the PR remains open/unmerged. Never call a failed or pending mandatory check a success.

🔴 NO EVIDENCE = NO CLAIM.
🔴 NO VERIFIED RESULT = NO VERIFIED COMPLETION.
🔴 NO ACCURATE PR SUMMARY = NO COMPLETION.
