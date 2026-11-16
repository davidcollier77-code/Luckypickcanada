# Feature Specification: QA Checker Effectiveness and Reliability

**Feature Branch**: freebuff/qa-checker-effectiveness

**Created**: 2026-11-16

**Status**: Implemented

**Input**: Findings from the review and fix cycle on Lucky Meter pull request #1924, used as a controlled evaluation of the repository's deterministic QA checkers.

## User Scenarios & Testing

### User Story 1 — A reviewer finding states what kind of defect it is (Priority: P1)

A developer reads the changed-code review. Each finding already names the file, line, rule, confidence and an excerpt. It must also say whether the checker proved a defect or is reporting a pattern whose intent is unproven, and it must not repeat the same defect at the same location.

**Why this priority**: On PR #1924, twelve of eighteen external review comments were byte-identical duplicates, and several findings described patterns that were not defects. A report that cannot separate confirmed defects from potential concerns and that repeats itself wastes the reviewer's time and hides the findings that matter.

**Independent Test**: Run the reviewer against controlled patches and confirm that a proven payload (provider token) is classified `confirmed`, a pattern-only advisory (HTML sink) is `potential`, and a repeated finding at the same path, line and rule is reported once with a duplicate count.

**Acceptance Scenarios**:

1. **Given** a patch that adds a provider token, **When** the reviewer runs, **Then** the finding is severity `hard` and classification `confirmed`.
2. **Given** a patch that adds an unsanitized HTML sink, **When** the reviewer runs, **Then** the finding is severity `warning` and classification `potential`.
3. **Given** the same defect supplied twice at the same location and rule, **When** the reviewer runs, **Then** one finding is reported and the duplicate is counted.

### User Story 2 — Defect classes that the PR cycle exposed are detected (Priority: P1)

A pull request commits a focused test, a floating promise in `forEach`, an empty catch block, or an unused import in a newly added file. The changed-code review must report each one with a practical correction.

**Why this priority**: These are genuine, high-signal defects in the categories the owner asked for (weak tests, asynchronous and resource issues, missing error handling, dead code and unused imports). None of them was detected by any current repository checker on PR #1924; every one was found only by an external AI reviewer or by a human reading the diff.

**Independent Test**: Run the reviewer against one patch per defect class and against a harmless counterpart, and confirm detection on the first and silence on the second.

**Acceptance Scenarios**:

1. **Given** an added `it.only(...)` in a test file, **When** the reviewer runs, **Then** a `focused-test` finding is reported; a `.only` property read outside a test file and `describe.skip(...)` are not reported.
2. **Given** `items.forEach(async ...)` with an `await` body, **When** the reviewer runs, **Then** an `await-in-for-each` finding is reported; `await Promise.all(items.map(async ...))` is not reported.
3. **Given** an empty `catch {}` block, **When** the reviewer runs, **Then** an `empty-catch-block` finding is reported; a catch that logs or rethrows is not reported.
4. **Given** a fully added file whose import bindings are never referenced, **When** the reviewer runs, **Then** each unused binding is reported once; a binding used in JSX, `React` and any modified file are not reported.

### User Story 3 — Browser QA recovers from an unusable cached browser (Priority: P2)

Visual QA restores a version-keyed Chromium cache. If that cache is incomplete or corrupt, the job must install a matching browser instead of failing every visual test at launch.

**Why this priority**: The visual job is the only screenshot and performance coverage for rendering changes. A cache that restores "successfully" but contains no executable turns every such pull request red for an infrastructure reason, and the correctness-preserving response is an install, not a skip.

**Independent Test**: Execute the cache check against a temporary directory containing a cached executable, a non-executable file, a directory named like the browser, and a missing path; confirm `ready=true` only for the executable.

**Acceptance Scenarios**:

1. **Given** a cache containing an executable `chrome`, **When** the check runs, **Then** it reports `ready=true` and the workflow installs only system dependencies.
2. **Given** a missing, empty or non-executable cache, **When** the check runs, **Then** it reports `ready=false` and the workflow installs Chromium.

### User Story 4 — Classifier coverage includes performance changes (Priority: P3)

A pull request that changes rendering, effect or performance tooling must still run browser QA, while documentation and CI-only changes must not.

**Why this priority**: PR #1924 changed rendering code, effect engines and capture tooling; the browser job must stay attached to exactly that class of change and stay off documentation-only changes.

**Independent Test**: Execute the classifier against visual, performance, ordinary-code, documentation, tooling and ambiguous path lists.

**Acceptance Scenarios**:

1. **Given** effect-engine, performance-script and performance-test paths, **When** the classifier runs, **Then** visual QA is required.
2. **Given** documentation, Spec Kit, agent-skill and CI-only paths, **When** the classifier runs, **Then** visual QA is not required.
3. **Given** an unknown path, **When** the classifier runs, **Then** visual QA is required (fail closed).

## Edge Cases

- A `catch` block that is empty but spans several lines is not detected; the rule stays silent rather than guessing (documented limitation).
- A multi-line `import { ... }` statement is not parsed, so an unused binding can be missed but never invented.
- The same rule matching several lines of one defect reports the first location and counts the rest as duplicates.
- A cached browser directory exists with the right name but no executable.
- A changed path list that is empty or unreadable still requests visual QA.

## Requirements

### Functional Requirements

- **FR-001**: Every changed-code review finding MUST carry `classification` of `confirmed` or `potential` alongside severity and confidence.
- **FR-002**: The reviewer MUST collapse identical findings (same path, line, rule and detail) and MUST report how many were collapsed, while keeping distinct defects at one location separate — two unused bindings on one import line are two findings, not one finding plus a duplicate.
- **FR-003**: The reviewer MUST report a focused test committed in a test file, a floating promise passed to `forEach`, an empty catch block and an unused import binding in a fully added file.
- **FR-004**: The reviewer MUST NOT report the corresponding harmless patterns: `.only` outside a test file, `describe.skip`, `Promise.all(...map(async ...))`, a handled catch, a JSX-referenced import, the `React` default import, or an "unused" binding inferred from a modified file's partial patch.
- **FR-005**: The Visual QA job MUST validate the restored Chromium cache before treating it as usable, and MUST install Chromium when no executable is present.
- **FR-006**: The Visual QA job MUST continue to install system dependencies when the cached browser is usable and MUST keep running the full Playwright suite in both shards.
- **FR-007**: The visual change classifier's existing fail-closed behaviour MUST be preserved and MUST be covered for visual, performance, ordinary-code, documentation, tooling and ambiguous change sets.
- **FR-008**: No existing required check may be weakened, skipped or made non-blocking by this change.
- **FR-009**: Every finding MUST carry a concrete `suggestion` that names the correction (the rewritten line, the awaited form, the binding to delete, the replacement API) and MUST be rendered as "Suggested fix" wherever the finding is shown.
- **FR-010**: The review report MUST be published as a pull request comment, updated in place through a sticky marker rather than posted once per run, and a comment failure MUST NOT change the review's pass/fail result.
- **FR-011**: The report MUST suggest Playwright visual verification only when the change set contains rendering paths, and Playwright performance measurement only when it contains performance-sensitive paths.
- **FR-012**: The report MUST state plainly that Playwright is not required for every change, and its suggestion MUST agree with the Visual QA classifier's decision for the same path list.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Controlled fixtures detect each of the four new defect classes and stay silent on all eight harmless counterparts (13 added fixtures, 0 false positives in the committed suite).
- **SC-002**: The reviewer reports one finding plus one collapsed duplicate for a defect supplied twice, where it previously produced one finding with no duplicate accounting.
- **SC-003**: The cache check returns `ready=false` for missing, empty, non-executable and directory-only caches, and `ready=true` only for an executable browser.
- **SC-004**: The classifier suite covers at least one visual, performance, ordinary-code, documentation, tooling and ambiguous path list with executed assertions.
- **SC-005**: The full unit suite, the QA checker suites and the standalone TypeScript check pass, and the production build stays below the 495 MiB cap.
- **SC-006**: Every flagged fixture has a non-empty suggestion of at least 24 characters, and rule-specific fixtures produce the exact correction (rewritten focused test, `for (const entry of items)`, `catch (error)`, the unused binding, `navigator.clipboard`, the added package).
- **SC-007**: A documentation-only change set reports "No Playwright verification is suggested", a rendering change set reports visual verification, and an effect-engine change set reports both visual and performance verification.
- **SC-008**: Twelve path lists produce the same decision from the reviewer's suggestion and from `classify-visual-changes.sh`, including CI-only, API, `playwright.config.ts`, standalone Playwright configuration and unknown paths.

## Assumptions

- Advisory findings remain advisory: they inform the reviewer and do not fail the workflow.
- External AI reviewers (Amazon Q, Graphite, Pullfrog) are advisory and their configuration is outside this scope; this feature improves the repository's own deterministic checks.
- A finding that cannot be proven from the patch is labelled `potential` rather than dropped.
