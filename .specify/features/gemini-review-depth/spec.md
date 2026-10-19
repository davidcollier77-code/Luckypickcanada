# Feature Specification: Gemini Review Depth

**Feature Branch**: `fix/gemini-review-depth-1533`

**Created**: 2026-10-19

**Status**: Draft — implementation candidate; current-head verification pending

**Input**: User requested an all-in-one automated PR reviewer that checks bugs, SEO, visuals, performance, security, accessibility, and tests, with detail comparable to Amazon Q.

## User Scenarios & Testing

### User Story 1 — Receive actionable review findings (Priority: P1)

When a pull request changes repository code or configuration, the maintainer needs Gemini to inspect the changed code and relevant surrounding context, then report substantiated defects with enough detail to assess them.

**Why this priority**: Detecting real bugs and regressions is the main value of an automated reviewer.

**Independent Test**: Inspect the generated review for actionable findings that include a relevant code location, trigger, impact, evidence, and an appropriate correction. Review quality still requires a successful live model run.

**Acceptance Scenarios**:

1. **Given** a PR introduces a demonstrable bug, **When** Gemini reviews it, **Then** the review can report the location, realistic trigger, consequence, and smallest practical fix.
2. **Given** the changed code reveals no material defect, **When** Gemini reviews it, **Then** it may return no findings rather than inventing issues.

### User Story 2 — Review relevant quality dimensions (Priority: P2)

The maintainer needs the reviewer to consider bug correctness, security, performance, SEO, visual/UI regressions, accessibility, and testing according to the files changed.

**Why this priority**: A single reviewer should identify cross-cutting regressions without forcing irrelevant checklist findings into every PR.

**Independent Test**: Static regression assertions confirm all review-focus categories and evidence requirements appear in the configured workflow prompt. Actual reviewer quality requires a live review.

**Acceptance Scenarios**:

1. **Given** a PR changes page metadata or rendering behavior, **When** Gemini reviews it, **Then** it considers relevant SEO and indexability risks.
2. **Given** a PR changes UI, CSS, interactions, or animation behavior, **When** Gemini reviews it, **Then** it checks relevant responsive, visual, and accessibility regressions without claiming screenshot validation it did not perform.
3. **Given** a code issue is credible but not fully confirmed, **When** Gemini reports it, **Then** it distinguishes uncertainty from verified evidence.

### User Story 3 — Provide useful inline guidance and risk summary (Priority: P2)

The maintainer needs actionable findings anchored to changed lines, plus a concise risk and merge recommendation.

**Independent Test**: Verify the workflow enables inline key issues and configured risk, merge recommendation, and failure-mode summaries.

**Acceptance Scenarios**:

1. **Given** Gemini detects an actionable changed-line issue, **When** the provider can anchor it, **Then** the review publishes it inline.
2. **Given** findings are capped, **When** more than eight potential issues are considered, **Then** only substantiated high-value findings are selected; the cap is not a target to fill.

## Edge Cases

- The change is documentation-only or does not affect SEO, UI, accessibility, or runtime performance.
- The diff lacks screenshot or browser evidence; Gemini must not claim actual visual QA.
- A finding is speculative, pre-existing, duplicated, or not introduced or materially worsened by the PR.
- Gemini's primary model is temporarily unavailable and the existing configured Gemini fallbacks are used.
- CI or a live provider review cannot run in the connected implementation environment.

## Requirements

### Functional Requirements

- **FR-001**: Workflow MUST preserve Gemini 3.8 Flash as primary and preserve the existing Gemini fallback order.
- **FR-002**: Workflow MUST allow up to eight findings per review, without requiring Gemini to fill the quota.
- **FR-003**: Workflow MUST request inline, line-anchored publication of key findings where supported.
- **FR-004**: The review prompt MUST direct Gemini to check relevant bugs, security, performance, SEO, visuals/UI, accessibility, and test coverage.
- **FR-005**: Findings MUST be actionable and evidence-led, with severity, exact location, trigger, concrete impact, evidence, and practical fix.
- **FR-006**: Review instructions MUST prohibit invented, duplicate, style-only, unrelated, and unsupported findings.
- **FR-007**: Workflow MUST request risk assessment, a merge recommendation, and up to three useful failure modes/test gaps.
- **FR-008**: Workflow MUST preserve review-only mode; automatic description generation and automatic code improvement stay disabled.
- **FR-009**: Regression tests MUST assert the new settings and key review prompt requirements.
- **FR-010**: Verification status and any limits of local or live validation MUST be documented honestly.

## Success Criteria

- **SC-001**: Static regression tests detect missing review-depth options or required focus categories.
- **SC-002**: The workflow retains its existing trigger, credential handling, pinned action, primary model, fallbacks, permissions, and review-only behavior.
- **SC-003**: A successful live Gemini review after the configuration reaches the default branch demonstrates that the settings are applied; no live result is claimed before evidence exists.
