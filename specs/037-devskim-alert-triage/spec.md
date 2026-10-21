# Feature Specification: DevSkim Alert Triage and Minimal Remediation

**Feature Branch**: `037-devskim-alert-triage`

**Created**: 2026-10-20

**Status**: Draft

**Input**: User request: Review the code-scanning findings shown in the supplied recording, fix genuine issues, and preserve secrets.

## User Scenarios & Testing

### User Story 1 - Trustworthy security findings (Priority: P1)

As the repository owner, I need each visible alert classified using the specific rule and source context so I can distinguish actionable vulnerabilities from false positives without hiding real risk.

**Why this priority**: Dismissing or suppressing alerts without evidence would make the security dashboard less reliable.

**Independent Test**: Review a finding's exact source line and rule, then verify that its classification follows from the code and any relevant scan result.

**Acceptance Scenarios**:

1. **Given** an alert identifies a suspicious-looking hash in a lockfile, **When** the referenced integrity value and package metadata are examined, **Then** the alert is not treated as a weak-hash use if the actual integrity value is SHA-512 and the match is only the package name.
2. **Given** a secret-scanner-style finding points at a manifest hash, **When** the manifest field is traced to public commit/file checksum metadata, **Then** it is recorded as a false positive without exposing or modifying credentials.
3. **Given** a finding points at code that passes a callback to a timer, **When** the call is verified not to execute user data as a string, **Then** it is not changed merely to silence a heuristic warning.

### User Story 2 - Correct genuine issues minimally (Priority: P1)

As the owner, I need confirmed security weaknesses corrected without changing unrelated application behavior.

**Why this priority**: Real vulnerabilities need a code-level correction, not only a written audit.

**Independent Test**: Inspect the patch and run the narrowest available regression test plus the required repository CI checks.

**Acceptance Scenarios**:

1. **Given** an HTML link opens a new browsing context without protecting the opener relationship, **When** the link is corrected, **Then** it includes `rel="noopener noreferrer"` while preserving its destination, text, and presentation.
2. **Given** an alert is not substantiated by the source, **When** its evidence is recorded, **Then** no source change or dismissal is made just to lower the alert count.

### User Story 3 - Preserve credentials and safeguards (Priority: P1)

As the owner, I need all external credentials and secret-store values preserved, and I must not have secret values exposed in reports or task artifacts.

**Why this priority**: Alert remediation must not disrupt live integrations or leak confidential values.

**Independent Test**: Review the complete diff and task report for secret-store changes, secret literals, scanner suppressions, and unrelated scope changes.

**Acceptance Scenarios**:

1. **Given** a finding resembles a token or key, **When** it is investigated, **Then** no value is copied into logs, reports, comments, or the PR.
2. **Given** an alert cannot be resolved safely or cannot be individually accessed, **When** the task is reported, **Then** it remains explicitly unresolved with the precise limitation rather than being presented as cleared.

### Edge Cases

- The historical dashboard count may have changed; the count in the video is a reported baseline, not a live inventory.
- Public commit hashes, generated file checksums, and package names may look like secrets or weak algorithms while being benign.
- Timer-based UI animation and test utilities may use callbacks and fixed numeric delays that do not evaluate user-controlled strings.
- A real exposure must not be hidden, broadly suppressed, or handled by changing external credentials in this task.
- If the authenticated alert inventory or dismiss-action API is unavailable, only the accessible subset can be verified and any remaining alert action must be documented.

## Requirements

### Functional Requirements

- **FR-001**: The task MUST use the repository's current security governance and keep all changes confined to evidence-based triage, minimal fixes, task evidence, and related regression checks.
- **FR-002**: Each alert that can be inspected MUST be classified as a verified vulnerability, verified false positive, verified resolved/stale finding, or unknown, with its rule/path evidence recorded without secret values.
- **FR-003**: The task MUST NOT bulk-dismiss alerts, hide findings with broad suppressions, weaken scanner configuration, or claim that alerts are cleared without evidence.
- **FR-004**: The task MUST NOT delete, revoke, disable, rotate, replace, or change any external credential or secret-store value, and MUST NOT disclose secret values.
- **FR-005**: The task MUST preserve the read-only status of `.docs/` and MUST NOT change dependency versions or lockfile integrity data merely to remove heuristic matches.
- **FR-006**: Confirmed code vulnerabilities MUST receive the smallest correct fix that preserves unrelated behavior.
- **FR-007**: The gift-email link finding at `app/api/send-gift/route.ts` MUST be checked against the current source and, if still present, corrected by adding opener protection without changing the email's destination, wording, or styling.
- **FR-008**: False positives that cannot be dismissed through an authorized available interface MUST be documented as needing alert-level disposition; their dashboard status MUST NOT be misrepresented.
- **FR-009**: The result MUST include actual current-head scanner/CI outcomes when accessible, a reconciled changed-file list, remaining blockers, and a clear answer on whether any actions remain.

## Key Entities

- **Alert record**: A scanner finding with identifier, source, rule, severity, affected path/location, evidence, classification, verification, and disposition.
- **Remediation record**: The minimal code/test/task-file change supporting a verified fix.
- **Credential follow-up**: A secret-safe record of any genuinely plausible exposure and any required owner action, without the secret value itself.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every alert that is accessible for inspection has a documented, evidence-based classification or an explicit unknown/blocker state.
- **SC-002**: Every confirmed in-scope vulnerability fixed in the task has a corresponding code diff and appropriate test or scanner evidence.
- **SC-003**: Zero external secret-store entries or credential values are changed by the task.
- **SC-004**: No secret values are present in new task artifacts, PR descriptions, comments, or verification output.
- **SC-005**: The task reports the actual remaining alert count only after an authorized live inventory/rescan can verify it; otherwise it explicitly reports the limitation.
- **SC-006**: No unrelated application behavior, visual design, dependency selection, or deployment configuration is changed.

## Assumptions

- The user-supplied recording is a historical view of the Code Scanning page; the recorded count of 113 open and 27 closed is a baseline and must not be assumed current.
- The displayed DevSkim matches require source-context review; package names, public commit hashes, and callback-based timers are not automatically vulnerabilities.
- Owner review and explicit approval remain required before merging.