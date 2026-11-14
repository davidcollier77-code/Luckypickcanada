# Feature Specification: QA Review Repairs

**Feature Branch**: `fix/160-qa-review-repairs`
**Created**: 2026-11-14
**Status**: Implemented; verification pending
**Input**: Review PR #1900 reviewer feedback against the submitted QA-infrastructure scope and repair confirmed defects without changing production application behaviour, artwork, or visual baselines.

## User Scenarios & Testing

### User Story 1 — GitHub changed-file evidence is handled safely (Priority: P1)

When the scope checker receives GitHub changed-file records, it distinguishes additions from renames, validates the reported count, and rejects path collisions without blocking ordinary added files.

**Why this priority**: Incorrect assumptions about optional GitHub fields can block valid PRs or weaken confidence in scope enforcement.

**Independent Test**: Run the focused scope-checker unit suite against fixtures representing additions, renames, duplicate paths, missing counts and malformed metadata.

**Acceptance Scenarios**:
1. **Given** an added file record with no `previous_filename` or a null `previous_filename`, **When** changed paths are normalized, **Then** only the current filename is included.
2. **Given** a renamed file and another record whose current filename collides with the rename's previous filename, **When** the inventory is validated, **Then** the duplicate is rejected.
3. **Given** pull-request metadata without `changed_files`, **When** the checker validates the evidence, **Then** it raises a clear missing-field error before comparing counts.
4. **Given** a boolean or mismatched changed-file count, **When** the checker validates the evidence, **Then** the count is rejected.

### User Story 2 — Exact paths and scope diagnostics cover real repository paths (Priority: P1)

A PR author can declare valid exact paths, including Next.js dynamic and route-group segments, while invalid globs, traversal and unsupported punctuation are rejected. Scope errors identify the missing field, and blocked reports render neutral defaults correctly.

**Why this priority**: The scope checker must support real repository filenames and produce actionable failure output.

**Independent Test**: Run unit tests covering route syntax, invalid punctuation, missing entry paths, blocked report formatting and supported screenshot-baseline extensions.

**Acceptance Scenarios**:
1. **Given** an exact path containing brackets, parentheses or hyphens, **When** it is validated, **Then** it is accepted without interpreting those characters as glob syntax.
2. **Given** a path containing an actual glob wildcard or unsupported comma, **When** it is validated, **Then** it is rejected.
3. **Given** an entry missing its `path` field, **When** scope expansion, governance or file-purpose records are parsed, **Then** the error identifies the relevant field.
4. **Given** a BLOCKED report without optional feature/dependency arrays, **When** Markdown is rendered, **Then** each missing list appears as `none`, not a character-spaced string.
5. **Given** a declared screenshot baseline ending in `.avif`, **When** baseline paths are classified, **Then** the file is included in baseline approval checks.

### User Story 3 — Review findings remain regression-protected (Priority: P2)

The QA checker test suite protects the previously implemented reviewer fixes for conditional check grouping, raw/filtered SARIF diagnostics and obvious placeholder browser evidence.

**Why this priority**: Fixes that are already present can regress unless reviewer-discovered behaviour is explicitly tested.

**Independent Test**: Run the focused Python checker suites through the existing Visual QA workflow.

**Acceptance Scenarios**:
1. **Given** two conditional check groups with separate shard results, **When** verification is audited, **Then** each group is evaluated only from its own prefix-matched runs.
2. **Given** malformed data in only one SARIF input, **When** the DevSkim summary is built, **Then** the error identifies whether the raw or filtered file is malformed and names that file.
3. **Given** browser evidence with an obvious placeholder such as `pending-pr-check`, **When** the PR scope declaration is validated, **Then** the placeholder is rejected.
4. **Given** a non-placeholder reference, **When** the declaration is validated, **Then** the checker records the reference but does not claim to fetch it or verify its remote run status.

## Edge Cases

- GitHub omits `previous_filename` on an added file or supplies it as null.
- A rename's previous path collides with another changed file's current path.
- `changed_files` is missing, boolean, negative, or inconsistent with the returned complete inventory.
- Exact Next.js routes contain `[id]` or `(group)`; names also contain hyphens or spaces.
- A path contains comma punctuation, traversal segments, backslashes, or glob wildcards.
- A malformed scope-expansion, governance or file-purpose record has no path.
- A BLOCKED report has no optional arrays.
- A reviewer fixture contains an explicit pending placeholder instead of completed evidence.
- A malformed result exists only in raw SARIF or only in filtered SARIF.
- Conditional check groups contain shard names with overlapping group-like prefixes.

## Requirements

### Functional Requirements

- **FR-001**: The checker MUST treat an absent or null `previous_filename` as no previous path and MUST include both current and previous paths for a rename.
- **FR-002**: The checker MUST detect duplicates across current filenames and rename previous filenames, including cross-record collisions.
- **FR-003**: The checker MUST explicitly require `changed_files` and reject non-integer values, booleans and counts that do not match the complete file-record list.
- **FR-004**: Exact-path validation MUST allow valid brackets, parentheses, hyphens and spaces while rejecting glob wildcards, traversal, backslashes and unsupported punctuation.
- **FR-005**: Screenshot-baseline classification MUST recognize AVIF files in addition to the existing image formats.
- **FR-006**: Missing `path` keys MUST produce field-specific diagnostics in scope-expansion, governance-change and file-purpose entries.
- **FR-007**: BLOCKED Markdown output MUST render absent optional lists as `none` without iterating the characters of that word.
- **FR-008**: Browser-evidence validation MUST reject explicit placeholder references, including `pending-pr-check`; it MUST NOT claim that arbitrary external references were fetched or their completion status verified.
- **FR-009**: Conditional verification groups MUST be prefix-filtered by the specific group name being audited.
- **FR-010**: Malformed raw and filtered SARIF findings MUST be reported with the corresponding input filename in the error.
- **FR-011**: The PR scope workflow MUST retain `jq 'add // []'` for both paginated endpoints so empty results remain JSON arrays.
- **FR-012**: The regression suites MUST cover all repaired behaviours and remain wired into the existing Visual QA checker test step.
- **FR-013**: Approval digests MUST remain bound to the complete PR description and current head; scope-expansion entries MUST remain in the exact paths manifest as well as in the reasoned expansion list.

## Success Criteria

- **SC-001**: The focused scope checker suite includes tests for null/absent previous paths, rename collisions, missing counts, route syntax, AVIF baselines, explicit placeholder evidence and blocked-report formatting.
- **SC-002**: The SARIF suite proves malformed raw and filtered results identify their respective filenames.
- **SC-003**: The verification-integrity suite proves separate conditional check groups cannot borrow one another's shard results.
- **SC-004**: The existing Visual QA workflow runs all three focused Python suites and compiles the applicable checker scripts.
- **SC-005**: The follow-up diff contains no production application code, application feature behaviour or screenshot baseline changes.
- **SC-006**: Verification results are reported truthfully; no test, browser run or workflow is described as passed unless it was executed and observed.

## Assumptions

- PR #1900 remains the parent QA-infrastructure implementation; this follow-up is stacked on `feat/158-qa-infrastructure-integrity`.
- The parent implementation's exact-path manifest, approval rules, protected-file boundaries and PR-head binding remain authoritative.
- Browser evidence references are declarative inputs. This checker can reject explicit placeholders but does not make network calls to validate remote execution status.
- Production application changes, visual assets and screenshot baselines remain out of scope.
