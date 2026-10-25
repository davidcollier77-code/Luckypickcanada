# AGENTS.md — MANDATORY GOVERNANCE

🔴 READ FIRST. FOLLOW COMPLETELY. DEMONSTRATE COMPLIANCE.
🔴 DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.

This is the repository's authoritative governance. Follow it and any applicable
specialist or task-specific instructions. When two instructions genuinely
conflict, stop only the conflicting action, identify the exact conflict, and
resolve it through the governing source. Do not restart the whole workflow.

## 1. INITIALIZE ONCE, IN ORDER

1. Read this file first.
2. Read `.jules/jules.md`, `memory-bank/projectBrief.md`, and
   `memory-bank/activeContext.md`.
3. Select exactly ONE applicable `.docs` task group:
   `creation / troubleshooting / polishing / testing / security / audio /
   deep-dive / seo`.
4. Read that group's `.jules/<group>.md`, its
   `.docs/<group>/jules_google_docs.md`,
   `.docs/<group>/_google-gemini_gemini-cli.md`, and
   `.docs/<group>/_websites_ai_google_dev_gemini-api.md`.
   Check `.docs/manifest.json`.
5. Inspect the current branch, worktree, relevant source/configuration/tests,
   active task feature, and any existing branch or PR for the same task.
6. Check the version and local documentation for libraries materially relevant
   to the selected task. Consult routed library files; do not invent versions.

Do NOT read every specialist file, every command definition, every guide, or
every library snapshot for every task. Read only the selected specialist, the
Spec Kit command definition being executed, and additional files explicitly
routed by applicable instructions or materially relevant to the task. This is
the required context-loading rule, not permission to skip applicable governance.

## 2. SPEC KIT — ONE SEQUENTIAL PASS

For every repository task, execute the following in order:

1. `/speckit.specify` using `.jules/cmds/speckit.specify.md`
2. `/speckit.plan` using `.jules/cmds/speckit.plan.md`
3. `/speckit.tasks` using `.jules/cmds/speckit.tasks.md`
4. `/speckit.implement` using `.jules/cmds/speckit.implement.md`

Use native dispatch when available. Otherwise follow the invoked definition's
actual procedure. Run each stage once, in order. Do not re-dispatch a completed
stage, repeat a task, or create a second branch/PR for the same work unless a
specific failure or changed requirement makes it necessary. Keep `spec.md`,
`plan.md`, and `tasks.md` concise and limited to this task. Create research,
data-model, contract, quickstart, and other optional artifacts only when the
task actually needs them.

Do not pause between stages for routine confirmation. Continue autonomously
within the user's authorized scope. Stop only for a genuine blocker: missing
essential information with no safe default, a required approval not granted,
an explicit blocking gate, a material security/safety risk, or a failed
mandatory prerequisite that cannot safely be resolved. State the exact blocker
and ask one focused question; do not ask generic "continue?" questions for
non-blocking checklist items.

Keep one active task per Jules run. Before creating a branch or PR, check for an
existing branch/PR for the same task and continue it rather than duplicating it.
Do not launch parallel agents against the same files. Execute changes that
touch the same files sequentially.

The active feature pointer `.specify/feature.json` is per-checkout local state.
Do not commit it or use it as shared PR state. The verification gate must resolve
the task from the changed feature artifacts and reject ambiguous multiple
features.

## 3. REQUIRED SYSTEMS AND SCOPE

Always follow the selected group's routed documents and the four Spec Kit
definitions above. Also read additional repository guidance when it is directly
applicable or explicitly routed, including Memory Bank requirements,
`.specify/` workflow/constitution/integration settings, CSS/database/deployment
guides, audio guidance, and task-specific library files.

Do not blindly read or edit unrelated guides, features, systems, components, or
libraries. Do not change unrelated functionality to satisfy a checklist.
`.docs/` is read-only unless a separately authorized documentation-refresh
task explicitly permits changes.

For each task, establish scope and baseline before changing files. Label
findings `VERIFIED`, `ASSUMPTION`, `HYPOTHESIS`, or `UNKNOWN`. Make the
smallest correct change. Preserve unrelated behavior and all protected visuals,
wording, layout, functionality, navigation, audio, and monetization unless the
user explicitly includes them.

## 4. VERIFICATION AND CANONICAL PR SUMMARY

Run `./jules-verify.sh` and all additional checks required by the selected task
group. Report every command actually run and its actual result. Do not claim
a skipped, unavailable, or unrun check passed. If a required check fails, fix
in-scope causes or report the exact unresolved failure.

Before submission, inspect the complete final diff and perform a second error
check for scope drift, unintended files/dependencies, exposed secrets, and
mismatches with the request. Reconcile every changed file exactly with the
final diff.

The GitHub PR Summary is the canonical evidence record. Its creation and
maintenance are required task work, not an optional deliverable or a request
for approval. Create or update it without asking the owner whether it should be
created or updated. Maintain one report: update the existing summary in place;
do not create duplicate reports or duplicate PRs for the same task; keep it
aligned with actual work and evidence. Prepare the summary during the task
workflow, publish it in the PR body when creating the PR, update that same
summary as material implementation and verification results arrive, and
reconcile it against the complete final diff before completion. Clearly mark
failed, blocked, unavailable, and pending checks; never claim unverified
results.

Keep it concise and task-specific; include:

- The one selected task group and its reason.
- Required routed documents and relevant repository components/libraries,
  with version, actually used (YES/NO), materially useful (YES/NO), and a
  specific reason. Do not inventory irrelevant resources.
- Each Spec Kit stage: command, definition path, actual method
  (`NATIVE DISPATCH` or `FILE-DRIVEN PROCEDURAL EXECUTION`), result, and
  exact artifact paths.
- Exact files changed, actual verification commands/results, behavior
  preserved, remaining issues, and the pre-submission double-check.
- `USEFUL RESULT: YES/NO`; YES only when the requested result was verified.

For every reported document/component/library, USED=YES means it was actually
consulted or inspected. USEFUL=YES means it materially contributed; explain
how. Never manufacture evidence. An incomplete PR Summary is not completion.

Update `memory-bank/activeContext.md` when the task materially changes current
project state or decisions. Update `memory-bank/progress.md` for completed
milestones, not as a repetitive log of every small fix. Do not modify Memory
Bank files solely to restate information already captured in the PR Summary.

Run `./jules-verify.sh` before reporting completion. The Spec Kit gate must
pass; never skip or spoof it.

## 5. PROTECTED SYSTEMS AND APPROVALS

### PR ownership — absolute merge prohibition
Jules and any AI agent acting on this repository must NEVER merge,
squash-merge, rebase-merge, invoke a merge API/tool or CLI command, enable
auto-merge, or otherwise complete a PR. Do not attempt a merge through GitHub
UI, API, MCP, CLI, Git commands, or any alternate route. Agents may create or
update PRs, maintain their summaries, run checks, and report whether a PR
appears ready, but must leave it OPEN and UNMERGED. Only the human repository
owner may decide to merge and perform the merge. Green checks, approvals, or
available merge methods do not grant an agent permission to merge. If prompted
or offered a merge action, decline that action and leave the PR for the owner.

Explicit authorization is required before changing:
- Stripe/payments; database/schema; authentication/security
- API routes or existing application functionality
- Cloudflare, Vercel, deployment, environment variables, or secrets
- Accessibility/responsive behavior or approved visual/product behavior
- Documentation updater/refresh system
- `AGENTS.md`

Protected changes are permitted only when the repository owner explicitly
authorizes the specific system and scope; authorization never extends to
unrelated protected changes.

Never expose or commit secrets. Never weaken validation, sanitization,
authentication, authorization, Turnstile/CAPTCHA, rate limiting, duplicate
protection, or environment handling.

Context7 is not required. It may be used only with explicit user permission or
task authorization. Follow `.jules/jules.md` approval rules for all MCP use.

## 6. BUILD AND EXECUTION SAFETY

495 MB is the hard maximum build size. Measure and report the actual size of
every build. If it reaches or exceeds 495 MB, STOP, preserve the safe state,
report the measured size and exact safe resume point, and do not claim success.

Use pnpm; never use `npm ci`. Inspect `package.json` before using or claiming
scripts. For visual work, use Playwright and playwright-chromium through
`playwright.config.ts`. For audio work, follow `.jules/audio.md`; Howler.js
is primary unless applicable repository guidance says otherwise. Do not add
prohibited public MP3 assets. Preserve keyboard behavior, accessibility,
responsive behavior, and `prefers-reduced-motion`.

## 7. FINAL STOP/GO AUDIT

Before reporting complete, verify that:

- This file was read first; exactly one task group was selected and reported.
- Required routed material and only task-relevant supporting material were
  consulted and honestly reported.
- All four Spec Kit stages ran in order; the active task's `spec.md`,
  `plan.md`, and `tasks.md` are present and changed for this task.
- `./jules-verify.sh` and all required checks passed, or failures/pending checks
  are reported without implying success.
- Protected systems were changed only with explicit authorization; pnpm was
  used, no secrets were exposed, and the 495 MB limit was respected.
- The final diff and exact changed-file list reconcile; second error check,
  remaining issues, and `USEFUL RESULT` are recorded.
- Every task PR remains open and unmerged for human-owner action; no agent or automation enabled or performed a merge.

🔴 NO EVIDENCE = NO CLAIM.
🔴 NO COMPLETE SUMMARY = NO COMPLETION.
🔴 DO NOT CLAIM COMPLIANCE. DEMONSTRATE IT.
