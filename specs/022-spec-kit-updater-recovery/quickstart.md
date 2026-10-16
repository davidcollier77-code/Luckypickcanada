# Quickstart: Spec Kit Updater Recovery

## Before merge

1. Inspect the PR diff and confirm the restored `.jules/cmds/speckit.specify.md` has the full command definition.
2. Confirm the file hash equals `21634a45dfcf642fddb1645f4ad2980f98c89778442e47663df8a6c3a1eaf8bc` in `.specify/integrations/generic.manifest.json`.
3. Confirm the workflow contains only the 1:05 AM and 5:05 AM Tuesday/Friday schedule entries, both in `America/Halifax`.

## Verification after merge

Run the workflow manually once through GitHub Actions `workflow_dispatch` before relying on the next scheduled execution. Confirm the upgrade, extension update, integration status, governance check, and PR action each complete as expected.

Run repository governance and build checks:

```bash
./jules-verify.sh
pnpm tsc --noEmit
pnpm run build
```

Measure the build artifacts using the repository's established method. **495 MB is a hard maximum.** Stop if a build reaches or exceeds that limit; report the measured size and do not claim completion.

If the workflow succeeds but reports no changes, confirm the PR action correctly reports no create/update operation and that the retry is not falsely reported as a submitted update.
