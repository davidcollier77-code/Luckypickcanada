# Feature Specification: QA Infrastructure Integrity

**Feature Branch**: `feat/158-qa-infrastructure-integrity`
**Created**: 2026-11-14
**Status**: In Progress

## User Scenarios & Testing

### User Story 1 - Verify Declared PR Scope (P1)
Authors declare the affected features, shared dependencies, and exact repository-relative paths in the pull request description. The checker compares that manifest against GitHub's complete changed-file list. Unlisted paths fail the check until the declaration is updated and the repository owner approves the exact expansion digest.

**Independent Test**: Exercise exact matches, omitted paths, renames, malformed declarations, and owner/non-owner/stale-digest approvals.

**Acceptance Scenarios**:
1. A complete exact-path declaration passes.
2. Any undeclared changed path is reported and fails.
3. A rename checks both the previous and current paths.
4. An expansion without exact owner approval fails; the matching owner digest allows only the declared expansion.

### User Story 2 - Control Visual Baselines and Governance (P1)
Intentional screenshot and governance changes are identified explicitly and approved separately. Existing protected-file and Agent MD authorization remains mandatory.

**Independent Test**: Exercise missing, stale and approved baseline/governance declarations.

**Acceptance Scenarios**:
1. Undeclared screenshot changes fail.
2. Declared screenshot changes without owner approval fail.
3. An exact approved baseline list passes without accepting other baselines.
4. `.freebuff/` and relevant `.specify/` governance changes require a reason and owner approval.
5. Agent MD changes still pass through the existing dedicated protected-file process.

### User Story 3 - Accept Accurate Browser Evidence (P1)
The scope report accepts Playwright, Firecrawl or Browserless evidence and records the actual tool identity. It does not change the automatic Playwright workflow or imply one tool is another.

**Independent Test**: Exercise each accepted tool, an unsupported tool, missing evidence and a visual change without evidence.

**Acceptance Scenarios**:
1. Playwright, Firecrawl and Browserless evidence are accepted and identified accurately.
2. Missing evidence for visual changes and unsupported tools fail.
3. Existing Playwright projects, shards and specs remain enabled.

### User Story 4 - Preserve Raw DevSkim Evidence (P1)
The original SARIF is preserved before the existing in-place suppression filter runs. A separate summary reports raw, filtered and removed counts and each remaining finding's rule, severity, confidence, file, line and message. Findings are not automatically labelled vulnerabilities or false positives.

**Independent Test**: Use SARIF fixtures covering remaining, removed, malformed and inconsistent results.

**Acceptance Scenarios**:
1. Raw SARIF is copied before suppression.
2. The existing filtered artifact remains available and a separate raw artifact is uploaded.
3. Remaining findings are shown with their identifying metadata and location.
4. Malformed SARIF or filtered results exceeding raw results fail clearly.
5. The audited suppression rules and replay are unchanged.

### User Story 5 - Preserve Existing QA Coverage (P1)
New checker tests run in addition to the complete existing Vitest suite, Crystal Ball coverage, Playwright visual specs, DevSkim checks, Agent MD checks and verification-integrity workflow.

**Independent Test**: Inspect workflow/spec diffs for deleted/skipped tests or weakened gates and run the new tests where supported.

**Acceptance Scenarios**:
1. Both new Python test modules run in PR verification.
2. All Crystal Ball daily limit, reset, greeting, fortune, follow-up and outage checks remain.
3. Existing Playwright desktop/mobile projects, two shards and baseline validation remain.
4. Existing Agent MD, protected-file, security and verification-integrity checks remain.

## Edge Cases

- Missing, malformed, empty or paginated GitHub changed-file evidence.
- Renamed files, duplicate/unsafe paths, missing or duplicate JSON markers.
- Placeholder descriptions, broad wildcards, stale approvals and non-owner comments.
- Declared baselines absent from the diff or changed baselines omitted from the declaration.
- Spec Kit/Freebuff governance edits and routine active-feature pointer changes.
- Missing browser tool, reference, purpose or unsupported tool name.
- Empty or invalid SARIF, and a filtered result set larger than the raw set.
- Existing application test failures unrelated to QA infrastructure changes.

## Functional Requirements

- **FR-001**: Parse exactly one machine-readable scope declaration from the PR body.
- **FR-002**: Require a meaningful summary, feature list and exact repository-relative path list; reject broad globs and placeholders.
- **FR-003**: Compare declared paths against GitHub's actual changed-file list and fail closed when evidence is incomplete or invalid.
- **FR-004**: Include both prior and current file paths for renames.
- **FR-005**: Require each scope expansion to be in the exact path list with a specific reason and a repository-owner approval bound to a SHA-256 digest of that path/reason mapping.
- **FR-006**: Never treat PR description edits, titles, branches or commits as approval.
- **FR-007**: Require exact baseline declarations and separate repository-owner approval for changed screenshot baselines.
- **FR-008**: Require reasons and explicit approval for governance-instruction changes; retain all existing protected-file authorization.
- **FR-009**: Accept Playwright, Firecrawl and Browserless evidence with a non-empty run/artifact/trace reference and purpose; preserve actual tool identity.
- **FR-010**: Keep the existing automated browser workflow Playwright-based.
- **FR-011**: Preserve raw DevSkim SARIF before the existing in-place suppression filter runs.
- **FR-012**: Retain the filtered SARIF artifact and add a separate raw SARIF artifact.
- **FR-013**: Summarize raw, filtered and removed counts plus all remaining finding locations and metadata.
- **FR-014**: Do not add suppressions or automatically classify findings as true/false positives.
- **FR-015**: Run new QA checker tests in addition to the full existing test suite.
- **FR-016**: Preserve Crystal Ball functionality/visual coverage, all other tests, Playwright projects/shards, security checks and governance checks.
- **FR-017**: Run the new scope workflow from trusted base-branch code with read-only permissions and without executing PR code.
- **FR-018**: Rerun after an owner posts an exact approval command; non-owner comments cannot approve.

## Success Criteria

- **SC-001**: Every changed path in test fixtures is either exact-listed or reported as undeclared.
- **SC-002**: Scope, baseline and governance tests reject missing, non-owner and stale-digest approvals.
- **SC-003**: All three supported browser tools pass validation; unsupported tools fail.
- **SC-004**: Raw SARIF is unchanged by suppression and stored as a separate artifact.
- **SC-005**: Every remaining SARIF result is shown with rule, severity, confidence, file, line and message.
- **SC-006**: New Python checks run alongside the complete existing QA suite.
- **SC-007**: No production application feature, visual asset or Crystal Ball functionality is changed.

## Assumptions

- GitHub PR files and issue-comment APIs are the source of truth for paths and approval comments.
- The repository owner is the only approver for the new digest commands.
- Automatic browser regression remains Playwright-based.
- Previous screenshots remain recoverable through Git history.
- Existing DevSkim suppression and replay are the audited suppression boundary.
- Exact-path matching does not perform semantic code review of individual hunks inside an already-declared file. Such contradictions still require substantive reviewer diff inspection; the checker must not claim otherwise.
- Agent MD remains unchanged unless a necessary, compatible governance change is demonstrated. Existing dedicated protected-file rules take precedence over mixing Agent MD edits into this PR.

## Out of Scope

- Fixing application defects from existing unit or browser tests.
- Changing Lucky Meter, Crystal Ball, Lucky Stories, Lucky Map or production artwork.
- Weakening DevSkim rules, deleting tests or bypassing gates.
- Replacing or reducing the Playwright suites or automatically accepting visual baselines.
- Modifying protected governance files or merging this PR.
