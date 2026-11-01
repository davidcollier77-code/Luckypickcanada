# Feature Specification: Gemini Reviewer Instruction Consolidation and Library-Context Removal

**Feature Branch**: `freebuff/d83726e9f4ebf83f38ce1768`
**Created**: 2026-11-01 (supersedes the selective document-loading direction of 2026-10-26)
**Status**: In Progress
**Input**: Simplify the Gemini PR reviewer to one root-level instruction file and remove Library
documentation from review context without losing existing reviewer capabilities.

## User Story 1 — One authoritative instruction file (Priority: P1)

As the repository owner, I need Gemini's PR-review instructions to live in one root-level file with
the same simple A/B/C structure as Amazon Q's rules, so the reviewer is easy to audit and cannot
drift between competing rule copies.

**Independent Test**: Inspect `GEMINI_REVIEWER.md`, the reviewer script's rule path, the workflow's
trusted-file integrity check, and the reviewer workflow tests.

**Acceptance Scenarios**:
1. **Given** any review mode, **When** the reviewer builds its model request, **Then** the system
   instruction is the content of root-level `GEMINI_REVIEWER.md`.
2. **Given** the retired `.gemini/rules/luckypickcanada.md` path, **When** the reviewer and workflow
   run, **Then** nothing reads or guards that path, and no second copy of the rules exists.
3. **Given** the new file, **When** it is read, **Then** it contains A — ANALYZE, B — BOUNDARIES and
   C — COMMUNICATE sections plus the existing status-colour, evidence, coverage and fix-control
   rules that the implementation depends on.

## User Story 2 — No Library documentation in review context (Priority: P1)

As the repository owner, I need Gemini reviews to stop selecting, loading and transmitting `.docs/`
documents, so review context is only its standing instructions, the PR description, changed-file
patches, and relevant source retrieved from the repository.

**Independent Test**: Review the reviewer and autofix scripts for document-selection code and assert
their absence in the reviewer test suites.

**Acceptance Scenarios**:
1. **Given** an automatic review, `@gemini full review`, a primary or adversarial pass, or a
   selected-finding fix request, **When** prompts are built, **Then** no `.docs/` document, manifest,
   documentation snapshot, or Gemini API Developer Skill content is included.
2. **Given** the removed selection path, **When** the scripts are loaded, **Then** no documentation
   manifest is parsed at module scope and no document assessment field or report is produced.
3. **Given** a failure that previously produced a manifest coverage gap, **When** the review runs,
   **Then** review behaviour depends only on the PR patches and retrieved source.

## Requirements

- **FR-001**: `GEMINI_REVIEWER.md` at the repository root MUST be Gemini's single authoritative
  PR-review instruction file, in the A/B/C structure modelled on
  `.amazonq/rules/luckypickcanada.md`.
- **FR-002**: Existing Gemini-specific review rules that the implementation relies on (status
  colours, evidence threshold, severity assignment, coverage disclosure, fix controls, no-change
  boundary) MUST be consolidated into that file, not duplicated.
- **FR-003**: `.github/scripts/gemini-reviewer.cjs` MUST load `GEMINI_REVIEWER.md` for every review
  mode and keep failing closed when it is missing or unreadable.
- **FR-004**: The workflow's trusted-file integrity check MUST cover `GEMINI_REVIEWER.md` and no
  longer guard the retired `.gemini/rules` path.
- **FR-005**: `.gemini/rules/luckypickcanada.md` MUST be removed after verifying no supported
  integration reads it.
- **FR-006**: Neither `gemini-reviewer.cjs` nor `gemini-autofix.cjs` MAY select, load, transmit or
  report `.docs/` documents, the documentation manifest, the Gemini API Developer Skill, or document
  assessments.
- **FR-007**: Changed-code patches, bounded relevant-source retrieval, coverage disclosure, batching,
  the adversarial second pass, severity/confidence validation, structured JSON output and recovery,
  the model fallback chain, review formatting and statuses, and owner-controlled opt-in fix
  suggestions MUST be preserved unchanged.
- **FR-008**: Workflow permissions, trusted-base execution, and the no-edit/no-commit/no-merge
  boundary MUST remain unchanged.

## Constraints and exclusions

- Do not modify or disable the Library system, `.docs/manifest.json`, the documentation updater,
  `AGENTS.md`, or Freebuff governance.
- Do not change models, add dependencies, alter workflow triggers or permissions, or redesign the
  reviewer.
- Treat `.docs/` as read-only.

## Success Criteria

- **SC-001**: A reviewer run uses `GEMINI_REVIEWER.md` as its only standing instruction source.
- **SC-002**: No review or fix prompt contains Library documentation content, and no manifest parsing
  occurs.
- **SC-003**: Focused reviewer tests, the full unit suite, TypeScript, and `./freebuff-verify.sh`
  report their actual outcomes.
