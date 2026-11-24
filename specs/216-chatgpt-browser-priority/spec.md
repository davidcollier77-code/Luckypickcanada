# Feature Specification: ChatGPT Browser Access Priority

**Feature Branch**: `chatgpt/216-chatgpt-browser-priority`

**Created**: 2026-11-24

**Status**: In Progress

**Input**: Explicit owner authorization to make ChatGPT's Python Playwright environment the first browser-access option, followed by Browserless and Firecrawl, in the ChatGPT-only section of `AGENTS.md`.

## User Scenarios & Testing

### User Story 1 — Use the ChatGPT-configured browser environment first (Priority: P1)

When ChatGPT needs interactive browser testing or browser access for a repository task, it first uses the Python Playwright setup configured through the ChatGPT Library startup script. It uses the existing asynchronous Python API and already-installed Chromium. Browserless is the next fallback, with Firecrawl used only when Browserless is unavailable or not working.

**Why this priority**: The repository instructions must accurately reflect ChatGPT's available browser-testing environment and avoid sending it to a retrieval tool before its interactive browser setup.

**Independent Test**: Inspect the ChatGPT-only browser rule and the governance regression test. Confirm the priority is Python Playwright, Browserless, then Firecrawl, with no change to the shared automated PR-checker Playwright requirement.

**Acceptance Scenarios**:

1. **Given** the ChatGPT Library startup script has confirmed Python Playwright and Chromium are available, **When** ChatGPT needs interactive browser testing, **Then** it uses the existing Python Playwright async API and installed Chromium first, without installing packages or browser binaries.
2. **Given** the Python Playwright setup is unavailable or unsuccessful, **When** browser access is still required, **Then** ChatGPT uses Browserless next and Firecrawl only if Browserless is unavailable or not working.
3. **Given** an automatic PR-checker workflow needs browser verification, **When** it runs, **Then** it continues to use the repository's Playwright QA workflow independently of ChatGPT's personal browser-tool priority.

### Edge Cases

- Python Playwright is importable but the installed Chromium executable cannot launch; treat the first option as unavailable and use the next fallback.
- Browserless is unavailable or not working; use Firecrawl only for supported retrieval and do not claim it provided interactive browser testing.
- Browserless or Firecrawl retrieval succeeds but interactive rendering was not exercised; report that limitation accurately.
- ChatGPT's startup preflight reports an unsupported Node/pnpm environment; follow the startup and repository-execution restrictions rather than installing or substituting tools.
- Freebuff's browser rules and repository Playwright CLI remain unchanged.

## Requirements

### Functional Requirements

- **FR-001**: The ChatGPT-only browser rule MUST make the Python Playwright setup configured through the ChatGPT Library startup script the first browser-testing option.
- **FR-002**: The rule MUST direct ChatGPT to use the existing Python Playwright async API and installed Chromium; it MUST NOT instruct ChatGPT to install packages or browser binaries.
- **FR-003**: Browserless MUST be the second option when the Python Playwright setup is unavailable or unsuccessful.
- **FR-004**: Firecrawl MUST be used only when Browserless is unavailable or not working, and retrieval MUST NOT be represented as interactive browser testing.
- **FR-005**: The rule MUST preserve the prohibition on the repository Playwright CLI, repository Playwright setup/startup scripts and Crawlbase for ChatGPT.
- **FR-006**: The separate shared requirement that automatic PR-checker workflows continue to use Playwright MUST remain unchanged.

## Success Criteria

- **SC-001**: The ChatGPT-only browser rule states the Python Playwright → Browserless → Firecrawl priority and names the Library startup script, Python async API and installed Chromium.
- **SC-002**: The governance regression test asserts the new priority and no longer asserts that ChatGPT cannot execute Playwright.
- **SC-003**: The regression test continues to assert the shared automatic PR-checker Playwright requirement.
- **SC-004**: No browser workflow, repository startup script, Freebuff instruction, application code, dependency, visual, security or deployment configuration is changed.

## Assumptions

- The Python Playwright package and installed Chromium are managed and preflighted by the ChatGPT Library startup script; the repository task does not install or maintain them.
- Browserless and Firecrawl remain the existing fallbacks; their roles and availability are not changed by this policy update.
- This is a governance and test-contract change only. The website's runtime behavior and the automated CI Playwright suite do not change.
