# Feature Specification: QA Checker Hardening

**Feature Branch**: `freebuff/qa-checker-hardening-20261115`

**Created**: 2026-11-15

**Status**: Draft

**Input**: Repair the inherited QA checker crash affecting PR #1904 and strengthen the checker system without duplicating existing security tools or Freebuff verification.

## User Scenarios & Testing

### User Story 1 - Handle Every GitHub File Record (Priority: P1)

A pull request author can rely on the scope checker to process ordinary modified and added files without crashing, while renamed files still contribute both their old and new paths.

**Why this priority**: The current crash blocks Visual QA and PR Scope Verification before any application or security check can run.

**Independent Test**: Run the checker against modified-only, added-only, and renamed file records and confirm every record is classified correctly.

**Acceptance Scenarios**:

1. **Given** a modified file record without `previous_filename`, **When** the checker runs, **Then** it succeeds and includes the current path.
2. **Given** an added file record without `previous_filename`, **When** the checker runs, **Then** it succeeds and includes the current path.
3. **Given** a renamed file record with `previous_filename`, **When** the checker runs, **Then** it includes both paths and preserves duplicate detection.
4. **Given** a rename record missing its previous path, **When** the checker runs, **Then** it fails closed rather than silently treating the rename as an ordinary change.

### User Story 2 - Review Changed Code with Verified Findings (Priority: P1)

A reviewer receives a short, evidence-backed report of high-confidence secrets, merge artifacts, and selected risky patterns in changed lines, while speculative or duplicate findings are suppressed.

**Why this priority**: Security and reliability checks must add value without creating noise or duplicating DevSkim and CodeQL.

**Independent Test**: Run the changed-code reviewer against fixtures containing a private key, provider token, merge marker, unsafe HTML sink, insecure link, placeholder, and clean code.

**Acceptance Scenarios**:

1. **Given** an added private key or recognizable provider token, **When** the reviewer runs, **Then** it reports a hard finding with file and line evidence.
2. **Given** an added merge-conflict marker, **When** the reviewer runs, **Then** it reports a hard finding.
3. **Given** an added unsafe HTML sink or insecure link, **When** the reviewer runs, **Then** it reports an advisory warning that clearly states the uncertainty.
4. **Given** placeholder credentials, environment-variable lookups, documentation, or a clean patch, **When** the reviewer runs, **Then** it does not produce a hard finding.
5. **Given** the same finding repeated in one patch, **When** the report is built, **Then** it appears once.

### User Story 3 - Keep Scope and Visual Evidence Proportionate (Priority: P2)

A PR can declare that a change is visual or non-visual based on its actual impact, while the existing exact-path scope and browser-evidence requirements remain enforceable.

**Why this priority**: Visual QA should run for real rendering changes without forcing unrelated work through unnecessary browser checks.

**Independent Test**: Exercise declarations with and without visual impact, all three approved browser tools, and logic-only changes.

**Acceptance Scenarios**:

1. **Given** a declared visual change, **When** browser evidence is missing, **Then** the checker fails with a clear action.
2. **Given** a declared non-visual change in an otherwise visual path, **When** the scope report is produced, **Then** the declaration is preserved and flagged for reviewer confirmation rather than silently accepted as proof.
3. **Given** Playwright, Firecrawl, or Browserless evidence, **When** it is valid, **Then** all three are accepted equally with their true identity preserved.
4. **Given** documentation-only, CI-only, backend API-only, or unit-test-only changes, **When** Visual QA classification runs, **Then** the Playwright browser shards are not required.
5. **Given** a mixed PR containing any frontend/rendering change alongside backend or CI changes, **When** Visual QA classification runs, **Then** Playwright remains required.
6. **Given** an API-only change explicitly declared as having user-visible browser impact, **When** Visual QA classification runs, **Then** the declared impact still requires browser evidence.

### User Story 4 - Preserve Existing Verification Without Duplication (Priority: P1)

The repository keeps its existing TypeScript, unit, build, visual, Crystal Ball, DevSkim, CodeQL, governance, and verification-integrity coverage without making QA depend on Freebuff's own verification script.

**Why this priority**: Removing one duplicated responsibility must not weaken unrelated checks or dedicated AI health coverage.

**Independent Test**: Inspect the workflow and run the focused checker, Crystal Ball, TypeScript, unit, and build checks.

**Acceptance Scenarios**:

1. **Given** the Visual QA workflow, **When** it runs, **Then** it runs the full unit suite and a standalone TypeScript check, and does not invoke `freebuff-verify.sh`.
2. **Given** the repository, **When** the change is reviewed, **Then** `freebuff-verify.sh` remains present and its own behavior is not deleted.
3. **Given** the Crystal Ball test inventory, **When** the change is reviewed, **Then** daily fortune, follow-up, quota, timeout, fallback, and browser coverage remain present.
4. **Given** a normal PR, **When** the new reviewer finds only advisory warnings, **Then** the PR is not hard-failed for minor style or speculative concerns.

## Edge Cases

- Missing, empty, malformed, or non-text changed-file records.
- A renamed record with an empty or missing previous path.
- Binary files, minified files, generated files, and patches omitted by GitHub.
- Secrets in test fixtures or documentation versus placeholders and environment lookups.
- A token-like string split across source lines or assembled at runtime.
- Unsafe HTML that is already sanitized, constant, or intentionally trusted.
- An insecure-looking URL used only in documentation or a local test server.
- A visual-impact declaration that conflicts with path-based classification.
- A non-visual declaration used to avoid browser evidence for a genuinely visual change.
- Existing Crystal Ball tests that use mocked AI responses rather than live requests.

## Requirements

### Functional Requirements

- **FR-001**: `changed_paths()` MUST accept modified and added records that omit `previous_filename`.
- **FR-002**: `changed_paths()` MUST include both paths for renames and MUST fail closed when a rename record omits its previous path.
- **FR-003**: Existing exact-path scope validation, changed-file count checks, duplicate detection, governance approvals, baseline approvals, and browser-evidence validation MUST remain in force.
- **FR-004**: The QA system MUST NOT require `freebuff-verify.sh` to be present, loaded, or executed.
- **FR-005**: The Visual QA workflow MUST retain the full unit suite and a standalone TypeScript check after removing the Freebuff verification step.
- **FR-006**: A changed-code reviewer MUST inspect added lines only and report evidence for every finding, including repository-relative path, new-file line, rule, confidence, and a short safely redacted excerpt for secret-like values.
- **FR-007**: The reviewer MUST hard-fail only high-confidence, demonstrable problems: private key blocks, recognizable provider token formats, and merge-conflict markers.
- **FR-008**: The reviewer MUST treat unsafe HTML sinks, dynamic code execution, insecure links, hardcoded credential assignments, dependency additions, type/lint suppressions, debugger statements, and deprecated APIs as advisory warnings unless independently confirmed.
- **FR-009**: The reviewer MUST suppress placeholder credentials, environment-variable lookups, documentation-only matches, local-development URLs, known example tokens, and other known-safe patterns.
- **FR-010**: The reviewer MUST deduplicate findings and MUST NOT repeat generic injection patterns already covered by DevSkim or CodeQL.
- **FR-021**: Secret excerpts MUST be redacted so the review does not copy a discovered credential into logs or the workflow summary.
- **FR-011**: The scope declaration MUST support an optional structured visual-impact assessment with a boolean requirement and a specific reason.
- **FR-012**: A declared visual impact MUST require browser evidence even when path-based detection would not require it.
- **FR-013**: A declared non-visual impact on a path-classified visual change MUST be reported as a reviewer warning, not silently accepted as verification.
- **FR-014**: Playwright, Firecrawl, and Browserless MUST remain equally accepted, with no mandatory preference or execution order.
- **FR-015**: Visual QA MUST remain conditional, MUST honor a declared visual impact even when path classification would skip browser coverage, and MUST preserve existing baselines and shards.
- **FR-022**: Playwright visual/browser shards MUST be skipped for known non-rendering changes limited to CI configuration/scripts, backend API route handlers, documentation, task records, and unit-test-only files.
- **FR-023**: A mixed change set MUST require Playwright when any changed path can affect frontend rendering or browser behavior; non-rendering paths MUST NOT cancel that requirement.
- **FR-024**: The PR scope checker MUST apply the same backend API exclusion to browser-evidence requirements while retaining explicit visual_impact.required: true as an override.
- **FR-025**: Skipping Playwright MUST NOT skip the always-running unit suite, TypeScript check, scope validation, changed-code review, security scans, build validation, or other required CI checks.
- **FR-016**: Crystal Ball daily-fortune and follow-up coverage MUST remain present and runnable without live AI requests.
- **FR-017**: The new checker MUST be dependency-free and complete in seconds for a normal PR.
- **FR-018**: Regression tests MUST cover modified, added, and renamed records, hard findings, warnings, false-positive controls, deduplication, and clean patches.
- **FR-019**: The PR Scope workflow MUST run the changed-code review and surface its warnings and hard failures separately from scope errors.
- **FR-020**: No application feature, artwork, audio, payment, database, authentication, hosting, or deployment behavior may change.

### Key Entities

- **Changed-file record**: GitHub's representation of a path, status, optional previous path, and optional unified-diff patch.
- **Finding**: A rule result with severity, path, line, confidence, excerpt, and explanation.
- **Visual-impact declaration**: An author-supplied statement of whether the change requires browser verification and why.
- **Scope declaration**: The existing exact-path manifest, file purposes, evidence, and approval entries.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The QA checker suite completes with zero `KeyError` failures and includes explicit modified, added, and renamed cases.
- **SC-002**: A clean fixture produces zero findings, while each seeded hard-finding fixture produces exactly one finding at the correct line.
- **SC-003**: Placeholder and environment-variable fixtures produce zero hard findings.
- **SC-004**: The Visual QA workflow contains no reference to `freebuff-verify.sh` and still invokes the unit suite and TypeScript check.
- **SC-005**: All existing Crystal Ball unit and visual test files remain present and focused tests pass.
- **SC-006**: Full TypeScript, unit, build, and repository verification remain green, with the production build below 495 MiB.
- **SC-007**: No application source, visual asset, dependency lockfile, or production configuration is changed.
- **SC-008**: Backend API-only and CI-only fixtures classify as non-visual, while frontend, visual asset, browser-test, and mixed frontend/backend fixtures still require Playwright.
- **SC-009**: The scope checker accepts API-only and CI-only changes without browser evidence but continues to require evidence for frontend paths and explicit visual-impact overrides.

## Assumptions

- GitHub's pull-request files API supplies `previous_filename` only for renames and copies; ordinary records legitimately omit it.
- Unified-diff patches may be absent for binary or oversized files, so the reviewer skips them rather than guessing.
- Provider token prefixes are high-signal; generic secret assignments are too ambiguous for a hard failure and remain advisory.
- Existing DevSkim, CodeQL, TypeScript, unit, and browser suites remain the primary broad scanners.
- `freebuff-verify.sh` remains available for agents, but repository QA does not depend on it.
- Crystal Ball tests already use mocked AI responses and must remain that way.

## Out of Scope

- Changing application code, artwork, audio, pricing, payments, database, authentication, or hosting.
- Replacing DevSkim, CodeQL, Playwright, Vitest, or the existing verification-integrity audit.
- Adding third-party scanning services or packages.
- Weakening the exact-path scope gate or protected-file approvals.
- Repairing unrelated PR #1904 visual findings or its feature branch.
