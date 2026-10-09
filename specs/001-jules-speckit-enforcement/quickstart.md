# Quickstart: Validate Jules Spec Kit Enforcement

## For a Jules task

1. Read `AGENTS.md` first.
2. Follow the command procedures in this order:
   - `.jules/cmds/speckit.specify.md`
   - `.jules/cmds/speckit.plan.md`
   - `.jules/cmds/speckit.tasks.md`
   - `.jules/cmds/speckit.implement.md`
3. Confirm `.specify/feature.json` points to the current feature directory and that `spec.md`, `plan.md`, and `tasks.md` are present, non-empty, and changed in the current task worktree or branch (not reused unchanged from a prior task).
4. Run `./jules-verify.sh`. It runs regression tests for the gate, then fails before build/test checks if the active feature state is missing or incomplete.
5. Report the actual execution method and artifact paths in the GitHub PR Summary.

## Test the verifier

Run:

```bash
bash scripts/test-verify-speckit-task.sh
```

The regression tests check missing state, malformed JSON, path traversal, each missing artifact, stale artifacts from a prior task, and valid new artifacts both in the worktree and committed on a task branch.

The automated GitHub Actions workflow named `Update Spec Kit` remains exempt from the *task-local* artifact gate because that workflow is an updater job, not a Jules task. Its existing integration-status and repository verification steps remain in place.
