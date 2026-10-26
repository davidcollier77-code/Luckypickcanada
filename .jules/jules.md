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
Maintain one concise, evidence-based summary in the PR body. Open/update a safe, reviewable PR with truthful pending or failed-check statuses instead of treating those statuses as an automatic PR-creation blocker. A pending or failed mandatory check still prevents declaring the task complete. Leave the PR open and unmerged.
