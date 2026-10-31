# Tasks: Freebuff Agent Governance Migration

## Inspect
- [x] Inspect the existing PR branch, authoritative `AGENTS.md`, manifest, updater, Spec Kit configuration, active instruction files, verification script, and production Jules webhook integration.
- [x] Distinguish active tooling from historical records and the separate external Jules API integration.

## Implement
- [x] Add a permanent retirement filter for the two Jules library IDs and stale snapshot filenames in the docs updater.
- [x] Add regression coverage for restored manifest entries and stale regular/dangling-symlink snapshot cleanup.
- [x] Remove the two Jules source IDs from all manifest routing, source, inventory, and SHA records.
- [x] Remove both snapshot paths from all eight documentation groups, including shared symlink entries.
- [x] Move active instructions and Spec Kit command definitions from `.jules/` to `.freebuff/`, preserving command contents.
- [x] Update `AGENTS.md`, the Constitution, Spec Kit integration paths, scheduled updater/rebase scripts, and active verification callers.
- [x] Rename the executable verification gate to `freebuff-verify.sh`.
- [x] Route the Gemini API Developer Skill to all eight groups and keep it mandatory for Freebuff and Gemini reviewer runs.
- [x] Keep the general Gemini API overview only in Creation and Gemini CLI conditional.
- [x] Keep the production Jules webhook integration and historical records unchanged.

## Verify and report
- [x] Inspect the current Git tree: no `.jules/` paths or retired Jules snapshots remain.
- [x] Inspect manifest routing: Gemini API Developer Skill is a source in all eight groups; general API overview is Creation-only; Gemini CLI remains conditional.
- [ ] Run `node scripts/test-refresh-docs.js`, `bash scripts/test-rebase-speckit-customizations.sh`, and the Gemini reviewer context/workflow tests on the final branch.
- [ ] Run `./freebuff-verify.sh` and review all current-head GitHub Actions checks.
- [ ] Review the final diff and update the PR summary with final verification results.
