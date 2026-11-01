# Freebuff — Repository Entry Point

Read `AGENTS.md` first. It is the single source of repository-wide workflow and safety rules. This file is a concise entrypoint, not a second governance system.

## Every coding task
- Read `memory-bank/projectBrief.md` and `memory-bank/activeContext.md` once; inspect the current branch, worktree, relevant files, task artifacts, and any existing branch or PR.
- Select exactly one task group. Read the matching `.freebuff/<group>.md` and route relevant reference material through `.docs/manifest.json`.
- For Gemini CLI work, use Creation for implementation/configuration, Troubleshooting for failures, or Deep-dive for investigation. The Gemini CLI documentation itself remains conditional; do not load it just because a task has started.
- Treat the Gemini API Developer Skill as a conditional specialist reference, not a standing requirement. Consult it only when changed work directly involves code that calls, configures, or integrates with the Gemini API or SDK. It is routed through Creation, Troubleshooting, and Deep-dive only. Do not load it solely because a task or PR mentions Gemini. It supplements, but never overrides, `AGENTS.md`; reading it does not authorize an API or model migration.
- The general Gemini API overview is an optional reference at `.docs/creation/_websites_ai_google_dev_gemini-api.md`; consult it for tasks directly involving Gemini API integration or architecture.
- The Gemini CLI snapshot `.docs/<group>/_google-gemini_gemini-cli.md` is an ordinary, optional reference. Consult it only when useful to the task.
- Follow the Spec Kit sequence, verification, scope, concise PR-summary, and no-merge rules in `AGENTS.md`. Keep one task, branch, and PR; reuse existing work.

## Execution and approvals
Respect the active coding agent's execution and authorization controls. Continue without routine confirmations only when the active mode permits it; never bypass a required approval or blocking gate. Neon and Stitch may be used without additional approval when materially relevant and within the user's authorized task scope. Context7 requires explicit owner approval before every invocation. Other MCPs require explicit approval unless separately authorized. Connection or initialization alone is not use.

## PR reporting
Maintain one concise, evidence-based summary in the PR body. Open or update a safe, reviewable PR with truthful pending or failed-check statuses instead of treating those statuses as an automatic PR-creation blocker. Keep implementation and verification status separate. A pending, blocked, or failed mandatory check prevents claiming verified completion or `USEFUL RESULT: YES`. State what remains unverified. Leave the PR open and unmerged.
