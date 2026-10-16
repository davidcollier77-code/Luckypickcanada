# Feature Specification: Reliable Spec Kit Updater with One Retry

**Feature Branch**: `fix/spec-kit-updater-single-retry`  
**Created**: 2026-10-16  
**Status**: Proposed  
**Input**: Owner-authorized repair of the scheduled Spec Kit updater; retain existing times but remove the unnecessary third check.

## User Scenarios & Testing

### User Story 1 — One primary update attempt (Priority: P1)

The repository owner expects the updater to check for a current Spec Kit update on Tuesday and Friday mornings, and to receive a pull request when files actually need updating.

**Why this priority**: The primary run is the normal automation path. It must update the integration and extensions, verify the result, and submit or refresh a PR without making unnecessary repeated checks.

**Independent Test**: Inspect the schedule and execute the updater against a repository state that has no modified managed integration files.

**Acceptance Scenarios**:

1. **Given** the scheduled day is Tuesday or Friday and no successful update PR has been submitted that Halifax-local date, **When** the primary 1:05 AM run starts, **Then** it attempts the integration and extension updates and proceeds through status and governance validation before PR creation.
2. **Given** the updater finds no file changes, **When** the PR action completes with no create/update operation, **Then** no empty update PR is claimed as submitted.

### User Story 2 — Exactly one retry when needed (Priority: P1)

If the first attempt does not successfully create or refresh an update PR, the updater gets one more check at the existing second scheduled time. It does not run a third time that morning.

**Why this priority**: A failed or delayed external update can be retried without spending three scheduled runs on a maintenance task.

**Independent Test**: Verify that there are exactly two schedule entries for the same timezone and weekday set, and inspect the daily guard's success marker.

**Acceptance Scenarios**:

1. **Given** the primary attempt fails before successful PR submission, **When** the 5:05 AM retry starts, **Then** it is allowed to retry the update.
2. **Given** the primary attempt successfully creates or refreshes a PR and records the success marker, **When** the 5:05 AM retry starts, **Then** the guard skips the duplicate update work.
3. **Given** both attempts fail or neither submits a PR, **When** the second attempt ends, **Then** there is no third 9:05 AM scheduled attempt.

### User Story 3 — Preserve managed-command safety (Priority: P1)

The updater must be able to upgrade a managed Spec Kit integration when its command files match the recorded installation, while preserving the CLI's protection against overwriting genuine local edits.

**Why this priority**: Passing the upgrade by blindly forcing it could destroy project-specific instructions.

**Independent Test**: Compare the restored command file's SHA-256 with the entry in `.specify/integrations/generic.manifest.json`; it must match before relying on the next run.

**Acceptance Scenarios**:

1. **Given** the command file is restored to the last known-good managed copy, **When** Spec Kit checks managed-file state, **Then** it sees the expected recorded content rather than the accidental one-line replacement.
2. **Given** a genuinely modified managed command is detected in a future run, **When** the update executes, **Then** the workflow does not automatically force-overwrite it.

## Edge Cases

- The primary run finds no upstream changes; the retry may make one additional check but must not create an empty PR.
- The primary upgrade fails; the retry must remain eligible.
- The primary run creates or refreshes a PR; the existing daily guard must suppress duplicate work in the retry.
- The configured timezone observes daylight-saving changes; both runs must remain expressed in `America/Halifax`.

## Requirements

### Functional Requirements

- **FR-001**: The updater MUST retain Tuesday/Friday scheduling at the existing 1:05 AM Halifax-local primary time.
- **FR-002**: The updater MUST retain only one further scheduled check at the existing 5:05 AM Halifax-local time.
- **FR-003**: The updater MUST NOT schedule a third 9:05 AM check.
- **FR-004**: The second run MUST skip the update steps when an earlier same-day run successfully created or refreshed an update PR.
- **FR-005**: The second run MUST remain eligible when the first run failed or did not submit an update PR.
- **FR-006**: The workflow MUST NOT use `--force` as a blanket workaround for modified managed integration files.
- **FR-007**: The damaged `.jules/cmds/speckit.specify.md` file MUST be restored to the complete managed command content that matches the current installation manifest.
- **FR-008**: Existing `workflow_dispatch`, integration status validation, governance validation, permissions, and PR creation behavior MUST be preserved.
- **FR-009**: The PR description and task records MUST distinguish verified source-level findings from checks that still require execution.

## Success Criteria

- **SC-001**: The workflow contains exactly two scheduled entries for the current Tuesday/Friday schedule and `America/Halifax`.
- **SC-002**: The workflow cannot execute a third scheduled check at 9:05 AM.
- **SC-003**: The restored command file's SHA-256 exactly matches its manifest entry.
- **SC-004**: A successful PR create/update marker suppresses the retry; a failed or no-PR first attempt leaves the retry eligible.
- **SC-005**: No update step uses `--force` to bypass modified-file detection.
- **SC-006**: The post-change governance check, TypeScript check, production build, build-size measurement, and an actual updater run are reported with truthful outcomes before the fix is considered runtime-verified.

## Assumptions

- “Keep the times the same” means retain the first two current times: 1:05 AM as primary and 5:05 AM as the single retry, both Halifax local time.
- A successful update means the existing workflow's PR action created or refreshed a PR and the marker step succeeded.
