# Feature Specification: Selectable Playwright Modes

**Feature Branch**: `freebuff/38a663e10f412e1b8cba2642-playwright-modes`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Implement two selectable Playwright options: Option A — Standard Playwright: Existing Chromium configuration and existing QA checks, unchanged. Option B — SwiftShader Playwright: Enables SwiftShader specifically for GPU and graphics investigations. When following the Playwright instructions, choose Option A for normal QA or Option B when investigating GPU rendering, graphics or related performance. Keep the existing QA checkers unchanged. Do not force SwiftShader on during standard runs or introduce paid services or additional infrastructure."

## Context

The repository has one Playwright Test configuration used by local verification and the
required Visual QA workflow. That configuration launches Chromium's headless shell with no
extra graphics flags. On a machine without a GPU it already renders through SwiftShader,
but that is an implicit fallback: there is no explicit, documented way to request a
software-rendered browser for GPU and graphics investigations without risking the normal QA
path.

This feature adds an opt-in investigation mode alongside the existing standard mode. It
does not add hardware, paid services, new browser dependencies or new CI jobs.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Normal QA stays on the standard configuration (Priority: P1)

A developer or CI workflow runs the existing Playwright command for normal QA. The browser
configuration, projects, checks and results are exactly what they are today; nothing forces
SwiftShader on.

**Why this priority**: Normal QA must remain stable and comparable to committed visual
baselines. An investigation option must never leak into the default path.

**Independent Test**: Run the documented standard command and confirm it uses the existing
`playwright.config.ts`, with no SwiftShader launch arguments.

**Acceptance Scenarios**:

1. **Given** no special option is selected, **When** Playwright tests run, **Then** they use
   the existing standard configuration and its three Chromium projects.
2. **Given** a standard run, **When** the browser is launched, **Then** no SwiftShader-specific
   arguments have been added by this feature.
3. **Given** the required Visual QA workflow, **When** it runs its Playwright shards, **Then**
   it continues to use the standard configuration without any change to its checks.

---

### User Story 2 — Investigate graphics with SwiftShader on purpose (Priority: P2)

A developer investigating GPU rendering, WebGL behaviour or graphics performance selects
the SwiftShader option. Playwright launches Chromium with SwiftShader explicitly enabled so
the software-rendering path is deterministic and identifiable.

**Why this priority**: The investigation path is the reason for the feature. It must be
unambiguous and reproducible without changing the default browser or adding infrastructure.

**Independent Test**: Run the SwiftShader command on a small Playwright check and inspect
the browser's WebGL renderer; it should identify SwiftShader.

**Acceptance Scenarios**:

1. **Given** the SwiftShader option is selected, **When** Chromium launches, **Then** ANGLE
   is configured to use the SwiftShader backend and the GPU process is enabled.
2. **Given** the SwiftShader option is selected, **When** a page creates a WebGL context,
   **Then** the renderer identifies SwiftShader rather than a hardware GPU.
3. **Given** the SwiftShader option is selected, **When** tests run, **Then** they do not
   update or replace committed visual baselines.
4. **Given** a machine that has a hardware GPU, **When** the SwiftShader option is selected,
   **Then** SwiftShader is still requested explicitly.

---

### User Story 3 — Choose the right mode without ambiguity (Priority: P3)

An agent or developer reads the project Playwright guidance and can tell which command to
use for normal QA and which to use for graphics investigations.

**Why this priority**: A selectable option is only useful if the choice is discoverable and
the standard path is clearly the default.

**Independent Test**: Follow the project Playwright guide from a clean checkout and select
each option by its documented command.

**Acceptance Scenarios**:

1. **Given** the Playwright guide, **When** a reader looks for the QA command, **Then** the
   guide names the standard option and says it is the default for normal QA and CI.
2. **Given** the Playwright guide, **When** a reader investigates GPU or graphics behaviour,
   **Then** the guide names the SwiftShader option and its limitations.
3. **Given** the project command list, **When** a reader lists the Playwright scripts,
   **Then** both options are visible and distinguishable.

### Edge Cases

- A standard CI run must never inherit SwiftShader flags from a shell environment.
- The SwiftShader option must not require a different browser download or operating-system package.
- A developer may run either option without starting the other mode first.
- The SwiftShader browser may produce different screenshots from the committed hardware or
  headless-shell baselines; investigation runs must not rewrite those baselines.
- If Chromium cannot launch with the requested flags, the failure must be visible rather than
  silently falling back to a different mode.
- The existing visual QA checker and its source assertions must remain valid without edits.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The existing standard Playwright command MUST continue to use the existing
  `playwright.config.ts` and its current projects, workers, retries, web server and baseline
  behaviour.
- **FR-002**: The standard path MUST NOT add SwiftShader-specific launch arguments.
- **FR-003**: A separate, opt-in SwiftShader configuration MUST exist for graphics investigations.
- **FR-004**: The SwiftShader configuration MUST request the ANGLE SwiftShader backend and
  enable the Chromium GPU process.
- **FR-005**: Selecting the SwiftShader configuration MUST NOT alter the standard configuration
  or the required CI workflow.
- **FR-006**: The feature MUST NOT add a new browser dependency, paid service, hosted runner or
  other infrastructure.
- **FR-007**: The project MUST expose both options through documented, distinguishable commands.
- **FR-008**: The project Playwright guidance MUST state that the standard option is for normal
  QA and the SwiftShader option is for GPU/graphics investigations.
- **FR-009**: Automated source coverage MUST fail if the standard configuration gains SwiftShader
  arguments or if the SwiftShader option loses them.
- **FR-010**: Investigation runs MUST NOT be used to regenerate or update committed visual baselines.
- **FR-011**: Existing QA checker workflows, scripts, tests and pass/fail requirements MUST remain
  unchanged.

### Key Entities

- **Standard option**: The existing Playwright configuration and command used for normal QA and CI.
- **SwiftShader option**: The opt-in configuration and command used to force software WebGL rendering.
- **Mode guidance**: The project-facing instructions that tell a reader which option to select.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The standard command resolves to the existing configuration with zero added
  SwiftShader arguments.
- **SC-002**: The SwiftShader command resolves to a configuration whose launch arguments include
  the SwiftShader backend and GPU-process enablement.
- **SC-003**: A browser launched through the SwiftShader option reports a SwiftShader renderer
  for a WebGL context.
- **SC-004**: Both options are selectable from documented commands without editing files.
- **SC-005**: The required Visual QA workflow and its checker tests pass without changes.
- **SC-006**: Unit tests, the type check, the repository gate and the production build pass, with
  the build below the 495 MiB cap.

## Assumptions

- "SwiftShader" means Chromium's explicit ANGLE/SwiftShader software WebGL path, not a hardware GPU.
- The standard option remains the only mode used by CI and normal QA.
- The SwiftShader option is for investigation and may produce different pixels from committed baselines.
- No new browser binary is required; the existing Playwright Chromium installation is reused.
- The feature is limited to developer tooling and documentation; no user-facing application
  behaviour, artwork, route or data changes are involved.
