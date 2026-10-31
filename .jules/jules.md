# Jules — Repository Entry Point

Read `AGENTS.md` first. It is the single source of repository-wide workflow and safety rules. This file is a short entrypoint, not a second governance system.

## Every task
- Read `memory-bank/projectBrief.md` and `memory-bank/activeContext.md` once; inspect the current branch, worktree, relevant files, task artifacts, and any existing branch/PR.
- Choose one task group. For Gemini CLI work, route implementation/configuration to Creation, failures to Troubleshooting, or investigation to Deep-dive. Read only the selected group's `.jules/<group>.md`, `.docs/<group>/jules_google_docs.md`, and `.docs/<group>/_websites_ai_google_dev_gemini-api.md`; check `.docs/manifest.json`. Read additional material only when routed or materially relevant.
- The Gemini CLI snapshot is available for reference but is required only for tasks that directly involve Gemini CLI. Do not load it just because a task has started.
- Follow the Spec Kit sequence, verification, concise PR summary, scope, and no-merge rules in `AGENTS.md`. Keep one task, branch, and PR; reuse existing work.

## Execution and approvals
Respect Jules's active execution/authorization mode. Continue without routine confirmations only when that mode permits it; never bypass a required approval or blocking gate. Neon and Stitch may be used without additional approval when materially relevant and within authorized scope. Context7 requires explicit owner approval before every invocation. Other MCPs require explicit approval unless separately authorized. Connection/initialization alone is not use.

## PR reporting
Maintain one concise, evidence-based summary in the PR body. Open/update a safe, reviewable PR with truthful pending or failed-check statuses instead of treating those statuses as an automatic PR-creation blocker. Keep implementation and verification status separate: report implementation `COMPLETE` only when the in-scope changes and required artifacts are in place and the final diff is reviewed. A pending, blocked, or failed mandatory check prevents claiming verified completion or `USEFUL RESULT: YES`, but does not by itself prevent reporting implementation complete or opening/updating a safe, reviewable PR. State what remains unverified. Leave the PR open and unmerged.
