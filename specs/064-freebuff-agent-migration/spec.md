# Feature Specification: Freebuff Agent Governance Migration

## User problem
The repository's active coding-agent instructions, Spec Kit command paths, and documentation routing still depend on Jules. Jules is being retired as the coding agent, and the scheduled documentation updater could restore the retired Jules library snapshots if its source manifest were reintroduced.

## Desired outcome
Move the repository's active coding-agent governance and Spec Kit command routing to Freebuff, remove the Jules documentation snapshots permanently, and preserve the Gemini reference rules.

## In scope
- Remove `jules.google/docs` and `developers.google.com/jules/api` from all task-group routes, source records, inventory, and SHA records.
- Remove both snapshots from all eight `.docs/` task groups.
- Prevent the documentation updater from restoring the retired source IDs or stale snapshots, including dangling symlinks.
- Move active `.jules/` instructions and Spec Kit command files to `.freebuff/`.
- Update Spec Kit integration configuration, managed-file paths, scheduled updater/rebase scripts, verification callers, and current governance references.
- Rename `jules-verify.sh` to `freebuff-verify.sh`.
- Make the Gemini API Developer Skill mandatory for every coding task and route it through all eight task groups; keep Gemini CLI conditional. Route the general Gemini API overview only to Creation.

## Out of scope
- The separate `workers/jules-bridge` Cloudflare webhook integration remains unchanged because it calls the Jules API directly and needs a separately confirmed replacement before migration.
- Historical task specs, old PR summaries, and past verification records are retained as history.
- No application behavior, production deployment, credentials, or external services are changed.

## Acceptance criteria
1. Neither Jules library source ID or snapshot filename is present in the current `.docs/` manifest or tracked `.docs/` tree.
2. The docs updater filters restored retired IDs and removes stale regular files and dangling symlinks before processing updates.
3. Regression tests cover restored manifest entries, stale snapshot cleanup, and preservation of unrelated documentation.
4. Active agent instructions and Spec Kit commands are under `.freebuff/`; Spec Kit configuration and automation point to the new location.
5. The verification script and its active callers use `freebuff-verify.sh`.
6. The Gemini API Developer Skill remains mandatory in all eight task groups; the general Gemini API overview is routed only to Creation; Gemini CLI remains conditional.
7. The pull request remains open and unmerged for owner review.
