# Tasks: Reliable Spec Kit Updater with One Retry

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [quickstart.md](quickstart.md)

**Organization**: Tasks grouped by user story; verification tasks remain pending until actually executed.

## Phase 1: Setup

- [x] T001 Inspect the scheduled updater run and identify the failing `Upgrade Spec Kit` step from the GitHub Actions job log.
- [x] T002 Confirm the restored specify command's SHA-256 matches `.specify/integrations/generic.manifest.json`.

## Phase 2: Foundational

- [x] T003 Restore `.jules/cmds/speckit.specify.md` to the known-good managed command content without changing the integration manifest.
- [x] T004 Edit `.github/workflows/update-spec-kit.yml` to retain the 1:05 AM primary and 5:05 AM retry schedules and remove the 9:05 AM third schedule.

## Phase 3: User Story 1 — One primary attempt

- [x] T005 Preserve the primary updater's CLI version, integration upgrade, extension update, integration-status validation, governance validation, and PR creation steps.
- [x] T006 Preserve the success marker and existing daily guard so a successful create/update operation suppresses the retry.

## Phase 4: User Story 2 — Safe retry behavior

- [x] T007 Verify by source inspection that a failed first run does not produce the successful PR-submission marker, leaving the retry eligible.
- [x] T008 Verify by source inspection that the workflow contains no third 9:05 AM schedule and does not add `--force`.

## Phase 5: Verification and double-check

- [ ] T009 Run `./jules-verify.sh` and resolve any in-scope failures.
- [ ] T010 Run `pnpm tsc --noEmit`, `pnpm run build`, and the prescribed build-size measurement; respect the 495 MB hard maximum.
- [ ] T011 Run the updated updater workflow once after the change is merged and inspect every step through PR submission or confirmation that no update is available.
- [ ] T012 Re-inspect the complete final PR diff and confirm the changed-file list matches it exactly.
