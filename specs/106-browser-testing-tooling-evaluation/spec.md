# Feature Specification: Browser-testing tooling evaluation for Lucky Pick Canada

**Feature Branch**: `freebuff/0b08ef27df00c0e858c01702`

**Created**: 2026-11-07

**Status**: Implemented

**Input**: User description: "Investigate and recommend the best browser-testing and visual website inspection tools for Lucky Pick Canada. Evaluate Playwright (including the recurring preview_playwright options.mode error), Puppeteer, Computer Use and Browser Use. Determine which tools are actually available and working in this Linux environment, their capabilities and any installation or configuration requirements. If any are unavailable or unreliable, recommend four additional tools with similar capabilities. Provide a concise report identifying the recommended combination for automated browser testing, mobile testing, screenshots, and visually walking through the website as a visitor would. Do not install anything or modify repository files, dependencies, or configuration. Investigation and recommendation only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose the right tool before browser work (Priority: P1)

A maintainer or coding agent is about to verify a visual change on Lucky Pick Canada. Before starting, they can read a short, evidence-backed table that says which browser tools exist here, which ones actually run, and which one to use for each job, so they do not lose a session to a browser that cannot start.

**Why this priority**: Every visual task in this repository depends on this decision. A wrong choice wastes a session and produces unverifiable claims.

**Independent Test**: A reader with no prior context opens the recommendation artifact and can name the tool to use for automated tests, mobile checks, screenshots and an interactive walkthrough, plus the exact reason for any tool being rejected.

**Acceptance Scenarios**:

1. **Given** a maintainer planning a visual check, **When** they read the report, **Then** every one of the four investigated tools has an explicit status (working, partly working, unavailable) with the evidence that supports it.
2. **Given** the recurring `preview_playwright` failure, **When** the maintainer reads the report, **Then** they see the exact error text, whether repository changes could fix it, and what to use instead.

---

### User Story 2 - Explain and contain the Playwright failure (Priority: P2)

A maintainer hits the recurring `preview_playwright` "options.mode" error or a local Chromium launch failure. The report explains the cause, the bypasses that do work, and the boundaries that no repository change can cross.

**Why this priority**: The failure is recurring across sessions and has previously forced improvised workarounds; without a written boundary the same investigation repeats.

**Independent Test**: The reproduction steps in the report, executed again, produce the same failure and the same successful alternative.

**Acceptance Scenarios**:

1. **Given** the managed browser bridge, **When** any Playwright script is submitted, **Then** the same validation error recurs and the report notes that script content does not change the outcome.
2. **Given** the local sandbox, **When** the bundled Chromium is launched, **Then** it fails on missing shared libraries, and the report records the exact libraries and the privilege constraint that blocks installing them.

---

### User Story 3 - A fallback set when a tool breaks (Priority: P3)

A maintainer needs a substitute when the recommended tool is unavailable, rate-limited or unsuitable (for example real-device mobile testing). Four additional tools are named with their role, requirement and the constraint that applies here.

**Why this priority**: It protects future sessions from re-researching alternatives under time pressure.

**Independent Test**: Each of the four additional tools is listed with the capability it covers and one concrete prerequisite, and none of them is presented as verified working here unless it was.

**Acceptance Scenarios**:

1. **Given** a tool that cannot run locally, **When** the maintainer reads the fallback list, **Then** a tool exists for each of the four requested capabilities (automated testing, mobile, screenshots, walkthrough).

### Edge Cases

- The workspace can be archived and restored: browser caches and running processes do not survive, so any "working" claim must state the setup it depends on.
- The managed cloud browser is shared with the user's visible panel; switching the panel to iframe preview mode ends the automated browser session.
- A cloud preview hostname answers at the edge before the dev server is registered, returning a 404 page that is not an application failure.
- Mobile viewport emulation is a capability of the local/CI browser stack, not of the managed panel browser.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The evaluation MUST state, for Playwright, Puppeteer, Computer Use and Browser Use, whether each is installed, available and actually able to drive a browser in this environment, distinguishing "installed" from "working".
- **FR-002**: The evaluation MUST reproduce the `preview_playwright` `options.mode` failure, record its exact message, and determine whether a repository change can fix it or whether it is platform-side.
- **FR-003**: The evaluation MUST record the installation and configuration requirements for each tool, including runtime versions, system packages, and any required API keys or paid services.
- **FR-004**: Where a tool is unavailable or unreliable, the evaluation MUST recommend four additional tools covering similar capabilities, each with its prerequisite and its status here.
- **FR-005**: The evaluation MUST give one recommended combination covering automated browser testing, mobile testing, screenshots, and an interactive visitor walkthrough.
- **FR-006**: The evaluation MUST NOT install packages, browsers or system libraries and MUST NOT change application code, dependencies, lockfiles or configuration; only Spec Kit artifacts, evidence and Memory Bank records may change.

### Key Entities

- **Tool assessment**: one investigated tool with status, capabilities, requirements, evidence source and verdict.
- **Capability**: automated testing, mobile testing, screenshot capture, interactive walkthrough.
- **Evidence record**: the command or action performed, its raw outcome, and when it was run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four investigated tools carry a status backed by an executed probe or a cited documented requirement; zero tools are described only from memory.
- **SC-002**: The reported error is reproduced at least twice with identical text, showing it is not content-dependent, and at least one working alternative is demonstrated on the real site in the same session.
- **SC-003**: A reader can pick a tool for each of the four capabilities in under one minute from the recommendation section alone.
- **SC-004**: The change set contains zero modifications to application code, `package.json`, `pnpm-lock.yaml`, workflow files, or environment configuration.

## Assumptions

- The repository's Playwright version (1.64.1) and its three Chromium projects remain the canonical automated visual-testing stack; this evaluation does not propose replacing them.
- The GitHub Actions Visual QA workflow, which installs Chromium with its system dependencies on `ubuntu-latest`, is the authoritative environment for visual regression, because local sandbox rendering is blocked by missing system libraries.
- "Computer Use" refers to a model-driven desktop/screenshot agent (Anthropic Claude computer use, OpenAI computer-use/browser tool), not a repository script.
- No paid service may be assumed available: any recommendation that needs an account is marked as requiring owner setup.
