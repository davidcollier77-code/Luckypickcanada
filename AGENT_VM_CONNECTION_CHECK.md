# Agent VM connection check

This file was added by an automated agent running in an isolated cloud VM, as a
**live end-to-end test** of its GitHub access to this repository. It is a
throwaway: it changes no code, and the pull request carrying it is intended to be
reviewed and then closed without merging.

## What was verified, and how

Every claim below was produced by running a command, not by asserting that it
should work. The check is re-runnable at any time.

| Capability | Evidence |
| --- | --- |
| Authenticate | Token authenticates as the repository owner (fine-grained credential) |
| Scope | Credential can see **exactly one repository** — this one |
| Clone / read | Real clone of `main` at `eb41d9e` |
| Branch | This branch, created from the current default branch |
| Commit | The commit that adds this file |
| Push | This branch exists on the remote |
| Workflow-file changes | A separate scratch branch touching `.github/workflows/` was pushed and accepted |
| Open a pull request | The pull request carrying this file |
| Continuous integration | The repository's own checks (vitest suite, `tsc --noEmit`) run locally and must pass before a push or PR is permitted |

## What was deliberately *not* done

- **The default branch was never written to.** Commits and pushes are refused
  outright while on `main`.
- **No pull request was merged, and none can be.** There is no merge code path in
  the tooling at all, and a test fails if one is ever added. Merging is a human
  action.
- **No existing file was modified.** This is an addition only.
- **No credential is stored in this repository.** Secrets live outside the
  worktree and are excluded from version control; a scanner gates every commit.

## Cleanup

This branch and its pull request can be deleted and closed at any time. Nothing
else in the repository depends on this file.
