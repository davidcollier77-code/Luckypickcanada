# Feature Specification: Cold-workspace-safe Freebuff startup command

**Feature Branch**: `209-cold-startup-browser-install-order`

**Created**: 2026-11-22

**Status**: Implemented

**Input**: Owner request: "give me the final copy-paste startup command with `--env` and `--persist` restored and the browser install moved before the strict `--check`, then prove it survives a cold workspace."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A never-provisioned workspace completes startup (Priority: P1)

A Freebuff workspace that has no `node_modules`, no `~/.cache/ms-playwright` and no `~/.local/chromium-libs` runs the documented startup command. The command installs the dependencies, installs the project-pinned Chromium, provisions the Linux runtime libraries, exports and persists the runtime environment, and ends with a passing headless launch probe, without aborting part-way through.

**Why this priority**: on a cold workspace the documented order stops before the browser install, so a fresh image can never finish startup. Every later browser step depends on this working.

**Independent Test**: remove the three paths above and run the documented command as one `bash -lc` shell.

**Acceptance Scenarios**:

1. **Given** a cold workspace, **When** the documented command runs, **Then** it reaches `PASS: Chromium launched and rendered a probe page` with exit status 0.
2. **Given** an already-provisioned workspace, **When** the same command runs again, **Then** the browser download and the library provisioning are both skipped and the probe still passes.

---

### User Story 2 - Documentation and the pinning test cannot drift (Priority: P2)

`README.md` documents exactly one startup command, and `__tests__/freebuff-startup-command.test.js` executes that same string and asserts the step order.

**Why this priority**: the command lives in Freebuff Project Settings, outside the repository. The documentation and the executed assertions are the only places the order can be reviewed and protected.

**Independent Test**: run the suite; then move the install step after the check in the documented command and confirm the suite fails.

**Acceptance Scenarios**:

1. **Given** the documented command, **When** the suite runs, **Then** the fixtures observe install → check → provision → env → persist → probe.
2. **Given** a README edit that moves the browser install after the strict check, **Then** the suite fails.

---

### Edge Cases

- A workspace whose only Playwright browser cache holds a different revision: `--browser-root` fails, so the install repairs it before the strict check runs.
- A machine or image with a system-wide Chromium runtime: the check passes, nothing is downloaded, `--env` prints nothing, and `--persist` still writes the Playwright CLI config.
- A network failure during the Chromium download: startup fails at the install step with the install's own message, not later as a misleading library error at the probe.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The documented command MUST install the project-pinned Chromium before the strict `scripts/setup-chromium-libs.sh --check`.
- **FR-002**: The documented command MUST keep `eval "$(bash scripts/setup-chromium-libs.sh --env)"` and `bash scripts/setup-chromium-libs.sh --persist`.
- **FR-003**: The documented command MUST keep `bash -lc` and `source scripts/bootstrap-pnpm.sh`, so the pnpm PATH export reaches the install under a shell that does not support `source`.
- **FR-004**: The launch probe MUST remain the last step, so it runs in the shell that applied the exported paths.
- **FR-005**: `README.md` and `EXPECTED_STARTUP_COMMAND` MUST stay identical, and the executed suite MUST fail if the install is moved after the strict check.
- **FR-006**: No governance, protected, security, credential, payment or deployment file may change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A cold workspace reaches the probe pass line with exit status 0.
- **SC-002**: `__tests__/freebuff-startup-command.test.js` passes with the reordered command.
- **SC-003**: The production build stays strictly below 495 MiB and no production behaviour changes, because only documentation and a test change.

## Assumptions

- Startup has network access for the pnpm bootstrap, the dependency install and the Chromium download.
- Out of scope: the pre-existing `scripts/verify-startup.sh` / `AGENTS.md` wording drift recorded in `plan.md`. Both are protected governance files and need separate owner authorization.
