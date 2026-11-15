# Feature Specification: Visual QA Classification Precision and Playwright QA Initialization

**Feature Branch**: `freebuff/02773acb0f15757c85d4c07d`

**Created**: 2026-11-15

**Status**: Implemented

**Input**: Correct the Visual QA change classifier so screenshot regression tests run only when a pull request contains changes capable of affecting the website's rendered appearance, and remove a redundant Playwright browser download from the QA jobs. Preserve fail-closed behaviour, the always-on verification job, the Playwright regression suite and the committed baselines.

## User Scenarios & Testing

### User Story 1 — Non-rendering tooling work does not run screenshot comparisons (Priority: P1)

A pull request that changes only agent/Playwright documentation, standalone Playwright investigation configuration, task records, unit tests or CI automation completes the full verification job without provisioning Chromium or comparing screenshots.

**Why this priority**: This is the requested saving. Those paths cannot change production rendering, so the browser shards only consume runner time.

**Independent Test**: Execute the classifier with those path sets and confirm `visual_required=false`; execute it with frontend, style, asset and configuration paths and confirm `visual_required=true`.

### User Story 2 — A package.json change is decided by its content (Priority: P1)

A change that only adds or edits test/tooling scripts (for example a Playwright command) skips visual QA. A dependency, engine, export, package-manager, pnpm-override, build, dev or unknown-script change still runs it.

**Why this priority**: Exempting `package.json` wholesale would hide dependency and lifecycle changes that can alter rendering; never exempting it makes every test-script addition pay for a browser run.

**Independent Test**: Run the manifest comparator and the classifier against scripts-only and dependency changes and confirm the two produce opposite decisions.

### User Story 3 — Uncertain input still runs visual QA (Priority: P1)

A failed file listing, an empty change set, an unreadable or ambiguous `package.json` comparison, an unexpected classifier value or an unknown path runs the visual job.

**Independent Test**: Execute the classifier with empty, malformed and unknown input and confirm `visual_required=true`; assert that every workflow fallback writes `visual_required=true`.

### User Story 4 — QA browser initialization does not duplicate a download (Priority: P2)

The verification and visual jobs install dependencies without Playwright's npm postinstall downloading a browser, because the visual job provisions Chromium explicitly after restoring its version-keyed cache and the verification job never launches a browser.

**Why this priority**: The postinstall download runs before the cache restore in the visual job and is entirely unused in the verification job. It is pure repeat initialization and network cost.

**Independent Test**: Inspect the installed Playwright package to confirm the postinstall respects `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`, and confirm the workflow sets it only on dependency installation while the explicit `playwright install`/`install-deps` steps and the test command are unchanged.

### Edge Cases

- A `package.json` that is unchanged (for example a mode-only change) is non-rendering.
- A `package.json` removed at the head revision cannot be compared and keeps visual QA.
- A nested manifest such as `workers/updater-scheduler/package.json` stays fail-closed.
- A scripts-only `package.json` in a pull request that also changes `app/` still runs visual QA.
- CRLF input and blank lines remain tolerated.
- The Playwright QA configuration (`playwright.config.ts`) stays on the visual path; only standalone configurations skip.

## Requirements

### Functional Requirements

- **FR-001**: The classifier MUST remain fail-closed for failed listings, empty input, unexpected values and paths that are not positively established as non-rendering.
- **FR-002**: Markdown at any depth, `specs/`, `memory-bank/`, `.docs/`, `.agents/skills/`, `.github/`, `app/api/`, `pages/api/`, `.specify/feature.json` and `__tests__/*.test.*` MUST remain non-rendering.
- **FR-003**: Standalone Playwright configuration files (for example `playwright.swiftshader.config.ts`) MUST be non-rendering; `playwright.config.ts`, visual/e2e tests, frontend code, styles, visual assets and fonts MUST remain rendering.
- **FR-004**: `package.json` MUST NOT be exempt by path. It MAY skip visual QA only when a comparator positively establishes that the base and head manifests differ solely in test/tooling scripts.
- **FR-005**: Dependency, engine, export, package-manager and pnpm-override changes, and any build/dev/start/install/deploy lifecycle or unrecognised script change, MUST keep visual QA.
- **FR-006**: The comparator MUST fail closed (no decision, non-zero exit) on invalid JSON, non-object input, non-string scripts and unreadable files.
- **FR-007**: The workflow MUST supply the comparator's positive result to the classifier and MUST treat a failed or unexpected comparison as rendering-affecting.
- **FR-008**: The `verify` job MUST keep running on every pull request and MUST NOT be gated on the classifier. Only the browser job MAY be gated.
- **FR-009**: The Playwright visual regression tests, projects, baselines, thresholds, retries, sharding and workflow commands MUST remain unchanged.
- **FR-010**: QA dependency installation MUST skip Playwright's npm postinstall browser download while retaining the explicit Chromium installation, system browser dependencies and the same browser version.
- **FR-011**: Regression tests MUST cover documentation-only changes, agent/Playwright documentation, standalone Playwright configuration, scripts-only and dependency `package.json` changes, frontend components and styles, images and fonts, mixed tooling/visual changes, unknown paths, empty and failed classifications, and the merged PR #1914 change set.

### Key Entities

- **Change classifier**: `.github/scripts/classify-visual-changes.sh` — turns a changed-path list plus a `PACKAGE_JSON_SCRIPTS_ONLY` determination into `visual_required=true|false`.
- **Manifest comparator**: `.github/scripts/package-json-scripts-only.mjs` — compares base and head `package.json` content and prints `scripts_only=true|false`.
- **Visual QA workflow**: `.github/workflows/visual-qa.yml` — always-on `verify` job and classifier-gated `visual` job.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The merged PR #1914 changed-file set classifies as `visual_required=false` when its scripts-only `package.json` change is established.
- **SC-002**: Frontend, style, image, font, rendering configuration and mixed change sets classify as `visual_required=true`.
- **SC-003**: Every fail-closed case (failed listing, empty list, unknown path, unreadable/ambiguous manifest) resolves to running visual QA.
- **SC-004**: The focused regression file and the full unit suite pass; TypeScript passes; the production build remains below 495 MiB.
- **SC-005**: The `verify` job, Playwright projects, committed baselines and Playwright test commands are unchanged apart from the QA dependency-install environment.
- **SC-006**: The redundant Playwright postinstall browser download is removed from both QA jobs; the explicit Chromium install and `install-deps` steps remain.

## Assumptions

- Agent skill documents and standalone Playwright investigation configurations are never bundled into the Next.js build and are not used by the CI visual QA job.
- Only test/tooling script names are positively non-rendering; anything else in `package.json` keeps visual QA.
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` affects only the npm postinstall download, not `playwright install`.
