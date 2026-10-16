# Research: Spec Kit Updater Recovery

**Date**: 2026-10-16

## Finding 1 — The schedule did run; the updater failed in its upgrade step

**Evidence**: GitHub Actions run [#24](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/38876818987) is a scheduled run on the main commit and completed with failure. The job status shows `Upgrade Spec Kit` failed and all later status/governance/PR steps skipped. Its log says `specify-cli` reported one modified file: `.jules/cmds/speckit.specify.md`, then exited with status 1.

## Finding 2 — The command file was accidentally reduced to one line

The current main version was 84 bytes and only contained a comment. The version at the last known-good integration update commit `903e1f86` contains the full 18,355-character command definition. The integration manifest records this exact managed content with SHA-256:

`21634a45dfcf642fddb1645f4ad2980f98c89778442e47663df8a6c3a1eaf8bc`

The SHA-256 recomputed from the restored content equals the manifest value exactly.

## Finding 3 — Forcing the upgrade is not the safe fix

The failing message explicitly states that modified files can be overwritten with `--force` or resolved manually. The official Spec Kit [integration reference](https://github.com/github/spec-kit/blob/main/docs/reference/integrations.md) documents the same guard: the upgrade blocks locally modified managed files unless force is used. The [upgrade guide](https://github.com/github/spec-kit/blob/main/docs/upgrade.md) recommends inspecting the diff before forcing a local customization overwrite.

**Decision**: Restore the managed file to its exact recorded content rather than bypassing the protection with force.

## Finding 4 — Two scheduled runs are sufficient when the daily guard remains intact

The first two existing schedule entries are kept; the third is removed. The existing marker test means a successful create/update operation suppresses the retry. If the first run fails or doesn't submit a PR, no success marker exists and the second run can retry. No new state or service is required.

## References

- GitHub Actions [schedule event documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows): scheduled events may be delayed/dropped under load, but run #24 was actually created, so the incident at hand is a job-step failure.
- GitHub Actions [timezone support](https://github.blog/changelog/2026-03-19-github-actions-late-march-2026-updates/): IANA time zones are supported for cron schedules.
