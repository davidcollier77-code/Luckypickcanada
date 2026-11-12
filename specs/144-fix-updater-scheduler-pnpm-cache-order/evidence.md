# Evidence: Fix Updater Scheduler pnpm Cache Order

## Confirmed Failure

Workflow run: https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/43134198078/job/130905437429

Job: Verify updater scheduler

Observed error in the Node setup step:

```
Unable to locate executable file: pnpm.
```

The pnpm setup and all later verification steps were skipped.

## Implementation

Moved the existing pinned pnpm setup action before actions/setup-node in both the verification and deployment jobs. Retained the Node.js and pnpm versions, cache path, frozen-lockfile install, all tests and all deployment safeguards.

## Verification Status

- **PASS — source review:** Both jobs now install pnpm before setup-node configures the pnpm cache.
- **PASS — preservation review:** Existing scheduler tests, Spec Kit checks, repository verification, 495 MiB build-size gate, Wrangler dry run, token canary and deployment conditions remain present.
- **PENDING — GitHub Actions:** The new workflow run will verify the setup on a clean hosted runner after PR creation.
- **NOT RUN — local workflow execution:** No local GitHub-hosted runner or shell-based repository test environment was used for this change.
