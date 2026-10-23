# Plan — Safe, Notified Spec Kit Updater

## Technical context
- Generic integration manifest is v1.2.2, installed 2026-10-20; the failed run used CLI 1.2.3.
- The customized managed files are `.jules/cmds/speckit.implement.md` and `.jules/cmds/speckit.plan.md`.
- Runtime: GitHub Actions, Bash/Git, current `specify-cli` via `uvx`; Cloudflare Worker already dispatches GitHub workflows.

## Approach
1. Store the exact upstream baseline associated with the current manifest and the current Jules overlays.
2. Validate live commands against their overlays, temporarily restore the upstream baseline so the ordinary integration upgrader sees its expected installed files, then capture new templates.
3. Apply the saved Jules overlay with a three-way merge. Unrecognized edits and real conflicts fail closed.
4. Send explicit Cloudflare source and approved slot in dispatch inputs. Owner-requested manual Spec Kit runs bypass the daily-success guard; Cloudflare retries retain it.
5. Notify the owner in GitHub for every created/refreshed updater PR with a commit marker, source/slot, and the workflow run link.

## Safety
- No secrets, app runtime, UI, database, or payment behavior changes.
- No blind `--force`; unknown customizations and conflicts abort safely.
- Existing cron and approved slot map stay unchanged.
- No direct production Worker deployment is performed by this PR.

## Verification
- `bash scripts/test-rebase-speckit-customizations.sh`
- `node --test workers/updater-scheduler/test/index.node-test.mjs`
- `./jules-verify.sh`
- Current-head Wrangler dry-run and CI.
- Inspect one real Cloudflare dispatch and its resulting Actions run after deployment.
