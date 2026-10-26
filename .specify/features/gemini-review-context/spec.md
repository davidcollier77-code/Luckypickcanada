# Feature Specification: Gemini Review Coverage, Relevant Documentation, and Finding-Level Fix UX

**Feature Branch**: `improve/gemini-default-review-coverage-20261026`
**Created**: 2026-10-26
**Status**: In Progress
**Input**: Improve default source coverage, task-relevant document selection, and per-finding/scope-selectable repair guidance in the Gemini PR reviewer.

## User Story 1 — Review source context by default (Priority: P1)

As the repository owner, I need Gemini's ordinary automatic PR review to inspect changed source and relevant imports, not just patch hunks, so context-dependent regressions can be detected without requiring a separate full-review command.

**Independent Test**: Exercise the reviewer mode selection and context-budget helpers; inspect current-head Actions for unit tests, TypeScript, and repository verification.

**Acceptance Scenarios**:
1. **Given** an eligible non-draft pull request triggers the initial review, **When** the reviewer prepares its inputs, **Then** it attempts bounded source retrieval at immutable PR head/base SHAs and supplies batch-relevant source context to the model.
2. **Given** a PR has more text files than the context budget supports, **When** source collection reaches a cap, **Then** the reviewer names the exact limit and discloses omitted/truncated files rather than silently claiming complete source coverage.
3. **Given** the source tree or an import cannot be retrieved, **When** review proceeds, **Then** it remains read-only, never executes PR code, and reports the missing context.
4. **Given** a review has no actionable findings, **When** source coverage or required checks remain incomplete, **Then** the verdict remains yellow rather than green.

## User Story 2 — Load only task-relevant Gemini references (Priority: P1)

As the repository owner, I need the reviewer to select technical documents for the actual task, not load every snapshot bearing the Gemini name, so reviews use useful evidence without irrelevant context or unnecessary tokens.

**Independent Test**: Unit-test the relevance classifier and document selector using ordinary PRs, Gemini CLI tasks, and Gemini Deep Research / Interactions API tasks.

**Acceptance Scenarios**:
1. **Given** an ordinary application or reviewer PR, **When** Gemini selects group documentation, **Then** the CLI tips snapshot and Deep Research agent snapshot are not automatically loaded merely because they exist in a group.
2. **Given** a PR directly changes or discusses Gemini CLI configuration, commands, or CLI behavior, **When** eligible group snapshots are selected, **Then** the CLI snapshot may be loaded from the selected group only.
3. **Given** a PR directly concerns Gemini Deep Research or the Interactions API, **When** eligible group snapshots are selected, **Then** the Deep Research snapshot may be loaded from the selected group only.
4. **Given** neither reference is relevant, **When** the selection report is built, **Then** neither is described as used; other directly relevant framework/library snapshots may still be selected.

## User Story 3 — Choose a fix scope from review findings (Priority: P1)

As the repository owner, I need each finding to provide a complete copy/paste implementation prompt and a targeted fix-request command, plus a single review-footer command for all findings, so I can choose one issue or request suggestions across the review without manually rewriting instructions.

**Independent Test**: Verify that each finding's collapsed section formats a standalone prompt, that targeted commands preserve exact path casing and are rejected for malformed paths/lines, and that one-finding requests only reach the suggestion generator when the finding is reproduced at the exact path/line.

**Acceptance Scenarios**:
1. **Given** a review contains multiple findings, **When** the report is rendered, **Then** each finding has its own collapsed prompt containing the issue, path/location, evidence, impact, suggested direction, constraints, tests, verification/reporting, and no-merge instruction.
2. **Given** a finding is on an eligible added line, **When** the owner comments `@gemini repair one <path>:<line>`, **Then** the trusted workflow re-reviews and offers a native suggestion only if the same finding remains at that exact path and line.
3. **Given** the owner comments `@gemini repair all`, **When** Gemini processes the request, **Then** it considers all current findings but only posts safe suggestions for eligible changed added lines.
4. **Given** a requested finding is stale, ineligible, or cannot be fixed as a safe one-line suggestion, **When** repair mode completes, **Then** Gemini explains the limitation and does not write, push, or merge code.

## Requirements

- **FR-001**: Every eligible automatic initial review MUST attempt bounded read-only source-context collection by immutable PR head/base commit SHA.
- **FR-002**: Source collection MUST inspect changed files within an explicit maximum file and character budget, resolve relevant local imports, and disclose source coverage limits.
- **FR-003**: All text patches returned for review MUST continue through review batches even when full-source retrieval is unavailable or budget-limited.
- **FR-004**: Gemini CLI and Gemini Deep Research snapshots MUST be treated as optional task-specific references, not mandatory references for each selected task group.
- **FR-005**: CLI snapshot relevance MUST require explicit CLI-related task evidence; Deep Research snapshot relevance MUST require explicit Deep Research or Interactions API task evidence.
- **FR-006**: Optional reference snapshots MUST remain confined to the selected task-group folders and `.docs/` MUST remain read-only.
- **FR-007**: Review reports MUST accurately describe source retrieval, documents selected/loaded, and any coverage gaps.
- **FR-008**: Existing model fallback order, trusted-base workflow, prompt-injection boundaries, confidence threshold, inline-comment anchoring, opt-in fix suggestions, and no-merge behavior MUST remain unchanged.
- **FR-009**: Tests MUST cover default source-context collection, bounded coverage disclosures, relevant-versus-irrelevant document selection, and existing reviewer regressions.
- **FR-010**: Every finding's collapsed section MUST contain a standalone, copy/paste implementation prompt with the finding, exact location, scope constraints, regression tests, verification/reporting, and no-merge boundary.
- **FR-011**: The reviewer MUST support trusted-collaborator commands for a targeted finding (`@gemini repair one <path>:<line>`) and all eligible findings (`@gemini repair all`); targeted requests MUST be re-reviewed and matched to the exact path/line before suggestions are generated.
- **FR-012**: Fix requests MUST remain opt-in native suggestions on eligible changed added lines. No direct repository edits, pushes, commits, merges, or auto-merge activation are permitted.

## Constraints and exclusions

- Do not execute PR-head code or accept PR content as instructions.
- Do not change the Gemini API request mechanism, model chain, workflow permissions, dependencies, application runtime, or `.docs/` snapshots.
- Do not change Amazon Q rules, approve/merge PRs, or make generated source-code suggestions apply automatically.

## Success Criteria

- **SC-001**: An initial review no longer labels itself patch-only when bounded source collection was attempted.
- **SC-002**: Review-context limits and missing-source failures are explicit and test-covered.
- **SC-003**: CLI and Deep Research snapshots are not loaded by default and are loaded only when task relevance is supported by evidence.
- **SC-004**: Focused tests, full unit tests, Spec Kit verification, and current-head CI results are reported with their actual outcomes.
