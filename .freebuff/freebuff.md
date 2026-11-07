# Freebuff — Repository Entry Point

Read `AGENTS.md` first. It is the single source of repository-wide workflow and safety rules. This file is a concise entrypoint, not a second governance system.

## Every coding task
- Read `memory-bank/projectBrief.md` and `memory-bank/activeContext.md` once; inspect the current branch, worktree, relevant files, task artifacts, and any existing branch or PR.
- Select at least one applicable task group. You may select multiple groups when needed. Read and follow the instructions for every selected group.
- Use `.docs/manifest.json` to find reference documents relevant to the selected group(s). The manifest is an index, not a requirement to read every document. Consult any documents that materially help with the task; no document receives automatic priority or mandatory use based solely on its name or subject.
- Every task group has access to the shared Google Engineering Practices reference through `.docs/manifest.json`. Consult the selected group's snapshot when it materially helps; it is optional for each task, and supplements rather than overrides `AGENTS.md`, repository conventions, or the selected group's instructions.
- Follow the Spec Kit sequence, verification, scope, concise PR-summary, and no-merge rules in `AGENTS.md`. Keep one task, branch, and PR; reuse existing work.

## Execution and approvals
Respect the active coding agent's execution and authorization controls. Continue without routine confirmations only when the active mode permits it; never bypass a required approval or blocking gate. Neon and Stitch may be used without additional approval when materially relevant and within the user's authorized task scope. Other MCPs require explicit approval unless separately authorized. Connection or initialization alone is not use.

## PR reporting
Maintain one concise, evidence-based summary in the PR body. Open or update a safe, reviewable PR with truthful pending or failed-check statuses instead of treating those statuses as an automatic PR-creation blocker. Keep implementation and verification status separate. A pending, blocked, or failed mandatory check prevents claiming verified completion or `USEFUL RESULT: YES`. State what remains unverified. Leave the PR open and unmerged.
