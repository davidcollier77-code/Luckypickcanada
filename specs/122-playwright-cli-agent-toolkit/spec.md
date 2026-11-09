# Feature Specification: Playwright CLI Agent Toolkit

**Feature Branch**: `freebuff/playwright-cli-agent-toolkit-20261109`
**Created**: 2026-11-09
**Status**: Implemented — follow-up verification pending
**Input**: Owner-authorized request to make a reusable official Playwright CLI skill available in the Luckypickcanada repository for Freebuff, covering all eight browser-work capability areas.

## User Scenarios & Testing

### User Story 1 — Freebuff discovers the official skill (Priority: P1)

Freebuff opens a fresh repository checkout and can discover Microsoft's official Playwright CLI skill and its complete reference library without relying on a per-chat MCP configuration.

**Independent Test**: The official skill entrypoint, all ten linked references, license and upstream provenance exist under `.agents/skills/playwright-cli/`.

**Acceptance Scenarios**:
1. Given a fresh checkout, when Freebuff inspects repository skills, then the Playwright CLI skill is available at `.agents/skills/playwright-cli/SKILL.md`.
2. Given a linked specialist guide, when its link is followed, then the referenced file exists in the repository.
3. Given the vendored source, when provenance is inspected, then the exact Microsoft release, commit and Apache-2.0 license are recorded.

### User Story 2 — Freebuff has all eight browser capabilities (Priority: P1)

Freebuff uses one project-aware skill for browser interaction, responsive/mobile QA, test generation and repair, network/API inspection, debugging/tracing, visual inspection, storage/authentication state, and screenshot/video/PDF evidence.

**Independent Test**: A project reference has a clearly identified section and supported commands for each of the eight capabilities, with project-specific safeguards.

**Acceptance Scenarios**:
1. Given a browser task, when Freebuff reads the project guide, then he can identify how to use all eight capability areas.
2. Given responsive verification, when exact site viewports matter, then the guide points to the existing desktop, mobile-390 and mobile-412 test projects.
3. Given test-generation work, when actions are recorded, then Freebuff creates reviewed Playwright tests with explicit assertions and existing project conventions.

### User Story 3 — The CLI reuses the existing project installation (Priority: P1)

Freebuff has a repeatable setup/probe command that uses the already pinned local Playwright package, without adding a global CLI or a second dependency track.

**Independent Test**: The setup script validates the repository's Node/pnpm/local CLI, and has separate opt-in browser-download and headless-launch modes. A Vitest guard protects the skill bundle.

**Acceptance Scenarios**:
1. Given frozen project dependencies, when the setup script runs, then it invokes `pnpm exec playwright cli`.
2. Given an explicit browser-download option, when the script is run, then it installs Chromium with the project-pinned Playwright version without attempting privileged OS installation.
3. Given a missing Linux browser library, when a real launch probe is run, then the error is surfaced as an environment blocker and the existing Browserless fallback policy remains in force.

### User Story 4 — Agent uses the CLI through repository guidance (Priority: P1)

Freebuff can choose and launch the repository's Playwright CLI consistently for direct browser interaction while preserving the existing Playwright Test and Visual QA workflows.

**Independent Test**: `AGENTS.md` points to the vendored skill and local CLI command, describes the documented setup check and evidence-based fallback, and keeps the full Playwright Test suite and CI checks authoritative.

**Acceptance Scenarios**:
1. Given direct browser work, when Freebuff reads repository governance, then it is directed to `.agents/skills/playwright-cli/SKILL.md` and `pnpm exec playwright cli`.
2. Given the CLI command is unavailable, when Freebuff checks prerequisites, then it follows the repository setup script and verifies availability before proceeding.
3. Given a real browser-launch failure blocks the task, when the documented fallback is needed, then Freebuff records the actual error and uses Browserless under the existing policy rather than assuming a Linux issue in advance.
4. Given a task requires automated browser or visual regression coverage, when the CLI is used for direct interaction, then the existing Playwright Test suite, configured viewport projects and CI baselines still run.

## Requirements

- **FR-001**: Store Microsoft's full CLI skill and every linked upstream reference under `.agents/skills/playwright-cli/`.
- **FR-002**: Record the exact upstream tag, commit, URLs, license and local modifications.
- **FR-003**: Use the local project command `pnpm exec playwright cli`; do not recommend a separate global CLI installation by default.
- **FR-004**: Document the eight capability areas: browser interaction; responsive/mobile QA; test generation/run/debug/heal; network/API inspection; console/debugging/traces; visual QA/screenshots; cookies/storage/auth state; PDF/video/evidence.
- **FR-005**: Preserve the existing Playwright Test suite, package alignment, viewport projects, snapshots, traces, videos and baselines.
- **FR-006**: Keep authentication state, cookies, tokens and persistent profiles outside tracked files.
- **FR-007**: Provide a setup script that validates Node, pinned pnpm, local Playwright and CLI; browser install and real launch probe are opt-in.
- **FR-008**: The setup script must not install OS packages, use sudo, change secrets, hosting or application runtime.
- **FR-009**: Add automated static integrity coverage for every upstream reference, license, eight capability sections and dependency reuse.
- **FR-010**: Follow existing browser order: Playwright primary, Browserless fallback, Browserbase only with owner approval.
- **FR-011**: Do not alter MCP configuration, application behavior, existing Playwright config, workflows, package dependencies or lockfile.
- **FR-012**: Document the repository's direct-agent browser workflow in `AGENTS.md`, including the vendored skill, local CLI command, setup check and evidence-based Browserless fallback.
- **FR-013**: State explicitly that direct CLI interaction supplements and does not replace Playwright Test, configured desktop/mobile projects, visual baselines or CI checks.

## Success Criteria

- **SC-001**: All ten upstream references are present and linked from the vendored skill.
- **SC-002**: All eight capability sections are present in the project guide.
- **SC-003**: Setup script validates the local CLI and separates browser installation from a real launch probe.
- **SC-004**: Automated integrity coverage protects the skill bundle and the no-extra-dependency decision.
- **SC-005**: Application files, package manifest, lockfile, Playwright config and Visual QA workflow remain unchanged.
- **SC-006**: PR remains open and unmerged; local and CI statuses are accurately reported.
- **SC-007**: `AGENTS.md` gives Freebuff an unambiguous local CLI path and preserves the full Playwright Test/CI verification contract.
- **SC-008**: The toolkit integrity test runs under the repository's Vitest invocation without depending on `import.meta.url` having a `file:` scheme.

## Assumptions

- The repository continues to use Node.js 22.x, pnpm 10.30.3 and Playwright packages aligned at 1.64.1.
- The official skill is pinned at Microsoft Playwright CLI v0.1.23 and updated deliberately, not fetched dynamically during agent sessions.
- The skill persists in GitHub checkouts; live browser processes do not persist across workspace restarts.
- Downloading Chromium does not guarantee all VM system libraries are installed. No privileged package-manager workaround is introduced.
