# Implementation Requirements Checklist: QA Review Repairs

**Purpose**: Verify that the repair scope follows reviewer evidence, preserves intentional safeguards and remains limited to QA infrastructure.

**Created**: 2026-11-14

**Feature**: `specs/160-qa-review-repairs/spec.md`

**Review Ownership**: Reviewer-owned requirements-quality review. Mark an item `[x]` only after reviewing the requirement and confirming the implementation or plan addresses it.

**Marker Semantics**: `[x]` means the requirement has been reviewed and is satisfied for requirements quality; it does not claim that local tests or GitHub workflows executed.

## Changed-file evidence

- [x] CHK001 Optional or null `previous_filename` is handled for ordinary additions.
- [x] CHK002 Current and previous names share duplicate detection, including cross-record collisions.
- [x] CHK003 Missing or invalid `changed_files` metadata fails with a direct diagnostic.
- [x] CHK004 Boolean changed-file counts are not accepted as integers.

## Paths and diagnostics

- [x] CHK005 Exact paths allow brackets, parentheses, hyphens and spaces.
- [x] CHK006 Glob wildcards, unsafe paths and unsupported punctuation remain rejected.
- [x] CHK007 AVIF screenshot baselines are recognized.
- [x] CHK008 Missing path keys identify the source field.
- [x] CHK009 BLOCKED Markdown uses `none` without joining its characters.

## Evidence and review regression

- [x] CHK010 Known browser-evidence placeholders are rejected, and remote run status is not overstated.
- [x] CHK011 Raw and filtered SARIF errors identify their source files.
- [x] CHK012 Conditional verification groups are tested independently.
- [x] CHK013 Existing empty-pagination jq guards remain present for both API endpoints.
- [x] CHK014 Full-body/head approval binding and exact scope expansion manifest requirements are retained.

## Scope and validation

- [x] CHK015 Production application files, visual assets and screenshot baselines are untouched.
- [x] CHK016 No dependencies, secrets or protected governance files are changed.
- [ ] CHK017 Python tests and syntax checks have executed successfully.
- [ ] CHK018 All applicable PR-triggered CI results have been observed.

## Notes

- Test execution markers remain unchecked until the commands actually execute.
- The checklist records requirements review, not CI verification.
