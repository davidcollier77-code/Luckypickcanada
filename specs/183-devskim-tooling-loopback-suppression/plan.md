# Implementation Plan: Exact-Span DevSkim Suppression for Reviewed CI Loopback Tokens

**Branch**: `freebuff/c3e3aea4b5256eb42e63e937` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Owner-approved narrow scope from `/specs/183-devskim-tooling-loopback-suppression/spec.md`

## Summary

Add one narrowly gated DS162092 suppression family for the changed-line reviewer and its test. The filter gains a two-file allowlist, one exact-span predicate, one `process_sarif` gate, one justification branch, and one verified justification. The reviewer predicate requires both the exact reviewed line and the preceding exclusion-set statement; the fixture predicate requires the exact local health-check statement. The DS176209 placeholder fixtures are deliberately not touched.

Tests cover three positive findings and six negative controls, plus an end-to-end filter pass. The replay gate gains two `AuditedFinding` families and a replay test that removes all three real fixtures while preserving an unrelated result.

## Technical Context

**Language/Version**: Python 3.12 repository tooling.

**Primary Dependencies**: Existing standard library only; DevSkim 1.0.103 SARIF is the scan input.

**Storage**: N/A.

**Testing**: `unittest` focused suite, real-SARIF replay, `./freebuff-verify.sh`, production build measurement.

**Target Platform**: GitHub Actions DevSkim workflow and CI-only Python tooling under `.github/scripts/`.

**Project Type**: Existing Next.js application with audited security-scanning infrastructure.

**Performance Goals**: No runtime or build change.

**Constraints**: Exact spans, exact paths, exact rule; fail closed; do not touch DS176209; preserve all scanner coverage and the 495 MiB cap.

**Scale/Scope**: Three Python files and one Spec Kit feature directory.

## Constitution Check

- **Single source of truth**: PASS - `AGENTS.md`, `PR_SUBMISSION.md`, the security task group, and the Spec Kit gate govern the work.
- **Verify before acting**: PASS - predicates were prototyped against real SARIF before implementation; the final unit and replay runs are recorded in `evidence.md`.
- **Minimal scope**: PASS - only the filter, its tests, the replay gate, and task records change.
- **Secret preservation**: PASS - no credential value is read, recorded, or changed.
- **Findings integrity**: PASS - the allowlist is rule-gated and path-gated; no broad suppression is introduced, and out-of-scope findings remain visible.
- **Required verification**: PASS after the recorded commands run.

## Design

### Filter constants

- `SAFE_SECURITY_TOOLING_LOOPBACK_FILES` contains exactly the reviewer and its test.
- `SECURITY_TOOLING_LOOPBACK_JUSTIFICATION` is the reviewer-facing explanation.
- `SECURITY_TOOLING_LOOPBACK_PATTERNS` maps each file to its exact line pattern with a named `token` group.

### Source eligibility

`is_allowed_relative_path` accepts the two files. `process_sarif` unions the set only for DS162092, so no other rule gains access.

### Predicate

`should_suppress_security_tooling_loopback_token`:

1. Validates the reported line and exact span through `_source_region_span_on_line`.
2. Requires the reported text to be the loopback hostname or address.
3. Requires the exact file pattern and matching `token` group.
4. For the reviewer, requires `if host.casefold() not in {` in the preceding three lines.
5. Returns true only when all conditions hold.

### Pipeline

The DS162092 branch runs before the general local-probe branch. The justification is added to `VERIFIED_FALSE_POSITIVE_JUSTIFICATIONS`, so `remove_verified_false_positive_results` removes the result from the uploaded SARIF.

### Tests

- Three positives: reviewer hostname member, reviewer address member, reviewer-test fixture.
- Six negatives: different set member, missing exclusion-set context, unreviewed path, external host, partial token span, and an out-of-scope DS176209 control remains excluded by the absence of changes.
- One pipeline test: three reviewed results removed, unrelated result retained.
- One justification-membership test.

### Replay

Two `AuditedFinding` entries with exact source-line patterns. A replay test writes the real fixtures, injects their exact regions, and asserts three suppressed, three removed, one unrelated survivor, and both families in `audited_removed`.

## Project Structure

```text
.github/scripts/suppress_devskim_false_positives.py   # constants, resolver, predicate, gate, justification
.github/scripts/test_suppress_devskim_false_positives.py  # positive/negative/pipeline/replay tests
.github/scripts/verify_devskim_sarif_replay.py        # two audited families
specs/183-devskim-tooling-loopback-suppression/       # spec, plan, tasks, evidence
```

## Risks and Mitigations

- **Context drift**: a refactor that moves the exclusion-set statement or changes indentation ends the exemption. Mitigation: fail closed and re-review; this is intentional.
- **Allowlist breadth**: the resolver admits two files, but DS162092 is the only rule unioned for them; DS173237 and DS126858 keep their independent path gates.
- **Span drift**: DevSkim offset changes retain the finding. Mitigation: the existing validated-span helper and the negative partial-span test.
- **Justification omission**: removing the new string from the verified set would leave the result in the upload. Mitigation: explicit membership test.
- **Scope creep**: touching the placeholder feature would broaden the task. Mitigation: no edits to its file, patterns, or justifications; the real replay proves both placeholder results survive.
