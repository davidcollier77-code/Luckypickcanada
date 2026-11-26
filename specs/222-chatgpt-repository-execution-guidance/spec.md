# Feature Specification: ChatGPT Repository Execution Guidance

**Feature Branch**: `222-chatgpt-repository-execution-guidance`
**Created**: 2026-11-26
**Status**: Approved for implementation
**Input**: Owner authorization to replace ChatGPT-only Section 6 of `AGENTS.md` with precise instructions for ChatGPT's own Library startup process, the two environment limitations, and permission to use other repository utilities.

## User Scenarios & Testing

### User Story 1 — Correct ChatGPT startup (Priority: P1)

When ChatGPT begins repository work, it follows the named memory and Library instructions, reads the complete README, and runs its own startup script as documented.

**Why this priority**: The startup process establishes ChatGPT's actual runtime and tool capabilities; skipping or confusing it with Freebuff setup causes incorrect execution decisions.

**Independent Test**: Inspect Section 6 and its governance regression assertions for the exact memory name, Library folder, README and script instructions.

**Acceptance Scenarios**:

1. **Given** ChatGPT starts repository work, **When** it consults memory, **Then** it follows **ChatGPT Setup** fully.
2. **Given** ChatGPT Setup directs it to the Library, **When** ChatGPT prepares its environment, **Then** it reads the entire `/ChatGPT startup script/README.md` and runs that folder's `startup.sh` as documented.
3. **Given** pnpm is missing or mismatched, **When** installing the pinned CLI is appropriate and package downloads are available, **Then** ChatGPT uses the documented `--install-pnpm` option without switching Node.js or installing project dependencies.

### User Story 2 — Distinguish the two environment limitations (Priority: P1)

ChatGPT accurately identifies the Node.js and Playwright CLI limitations without treating them as a blanket prohibition on repository work.

**Why this priority**: The previous wording blocked permitted scripts and checks, including Python verification and PR support utilities.

**Independent Test**: The governance regression test confirms Node.js 22.x / 26.x boundaries, Python Playwright usage and the absence of a blanket repository-script prohibition.

**Acceptance Scenarios**:

1. **Given** a command specifically requires Node.js 26.x, **When** ChatGPT is running Node.js 22.x, **Then** it does not install or switch runtimes and records the affected check as blocked or unverified.
2. **Given** interactive browser testing is required, **When** ChatGPT uses its supported browser environment, **Then** it uses its own Python Playwright async API and installed Chromium, not the repository Playwright CLI.
3. **Given** another repository script is relevant and its prerequisites are satisfied, **When** its effects and permissions are safe, **Then** ChatGPT may run it even when its filename contains `freebuff`.

### Edge Cases

- The pinned pnpm CLI bootstrap is unavailable because the package registry cannot be reached.
- A repository script has a compatible interpreter but invokes a Node.js 26-only dependency or command.
- A task requires interactive browser testing but the Python Playwright capability check fails.
- A script has side effects, network access, permission requirements or costs that make execution inappropriate.

## Requirements

### Functional Requirements

- **FR-001**: Section 6 MUST direct ChatGPT to follow **ChatGPT Setup** in ChatGPT memory before repository work.
- **FR-002**: Section 6 MUST name the **`/ChatGPT startup script/`** Library folder, require reading the entire `README.md`, and direct ChatGPT to run that folder's own `startup.sh` as documented.
- **FR-003**: Section 6 MUST describe the documented pinned pnpm bootstrap and optional Python Playwright capability check without implying either installs project dependencies or changes Node.js.
- **FR-004**: Section 6 MUST state that ChatGPT uses Node.js 22.x and cannot run commands that specifically require Node.js 26.x; it MUST prohibit attempts to install or switch to Node.js 26.x and require honest reporting of affected checks.
- **FR-005**: Section 6 MUST state that the repository Playwright CLI does not work in ChatGPT's environment and direct interactive browser testing to ChatGPT's Python Playwright async API and installed Chromium.
- **FR-006**: Section 6 MUST allow other relevant repository scripts, tests, builds, verification utilities and PR-support scripts when their prerequisites and safety conditions are satisfied, without rejecting them because their names contain `freebuff`.
- **FR-007**: The governance regression test MUST assert the new instructions and guard against reinstating the blanket repository-script/build/test prohibition.
- **FR-008**: Preserve all unrelated governance, the protected-file workflow and its human authorization gate; make no application, dependency, deployment, startup Library or CI workflow changes.

## Success Criteria

- **SC-001**: Only the authorized Section 6 wording and the directly related governance test are changed outside the task records.
- **SC-002**: `AGENTS.md` remains at or below 200 lines.
- **SC-003**: The governance test explicitly checks the memory name, Library path, README, startup options, Node.js versions, Python Playwright path, repository CLI limitation, and permission for Freebuff-named repository utilities.
- **SC-004**: The dedicated governance protection classifier accepts the exact task paths and the protected-file workflow continues to require human authorization.
- **SC-005**: The PR remains open, regular (non-draft), and unmerged for owner review.

## Assumptions

- ChatGPT's current installed Node.js is 22.x; the repository requires Node.js 26.x and pnpm 10.30.3 for the full project gate.
- The Library `README.md` and `startup.sh` remain the authority for ChatGPT environment startup.
- Existing Section 4 browser guidance and Section 5 Freebuff-environment boundaries remain unchanged.
- The task does not require visual/browser verification or a production build because it changes only governance text, a unit-test assertion and task documentation.
