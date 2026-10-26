# Tasks: Fix DevSkim Checksum SARIF Span Matching

**Input**: `specs/055-devskim-checksum-sarif-span-fix/spec.md` and `specs/055-devskim-checksum-sarif-span-fix/plan.md`

## Phase 1: Setup

- [x] T001 Inspect `AGENTS.md`, security routing, `.docs/manifest.json`, the prior checksum-cleanup task, the suppression helper, tests, report, and active context.
- [x] T002 Capture scheduled run #40282205671 and inspect its post-filter SARIF artifact to establish the actual region columns, absolute offsets, length, and snippet.

## Phase 2: Foundational

- [x] T003 Add a regression test in `.github/scripts/test_suppress_devskim_false_positives.py` for production-shaped SARIF, the columns-only negative case, and removal from filtered SARIF.

## Phase 3: User Story 1 — Filter the exact checksum false positive safely (Priority: P1)

**Independent Test**: The focused unittest suite proves the actual offset/snippet is accepted only for the exact checksum source region; unrelated/mismatched findings stay visible.

- [x] T004 Update `.github/scripts/suppress_devskim_false_positives.py` to use `_source_region_span_on_line()` and require the full validated span to stay inside the exact quoted checksum.
- [x] T005 Remove only report entry `devskim-id:81298a9d79b888769be1` from `devskim-alerts.md`, preserving the heading and append marker.
- [x] T006 Update `memory-bank/activeContext.md`, `specs/055-devskim-checksum-sarif-span-fix/spec.md`, `specs/055-devskim-checksum-sarif-span-fix/plan.md`, `specs/055-devskim-checksum-sarif-span-fix/tasks.md`, and `specs/055-devskim-checksum-sarif-span-fix/pr_summary.md` with the corrected diagnosis and evidence.
- [ ] T007 Run `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`, `python3 -m py_compile .github/scripts/suppress_devskim_false_positives.py .github/scripts/test_suppress_devskim_false_positives.py`, full CI checks, and `./jules-verify.sh`; record actual results.
- [ ] T008 Inspect the complete final diff and current-head CI; confirm the row stays absent, the checksum/template are unchanged, no unrelated suppressions were broadened, and the PR remains open/unmerged.

## Dependencies and execution order

- T001–T002 establish governance and reproduce the source-range mismatch.
- T003 defines the regression boundary before the implementation change in T004.
- T005 depends on the targeted filter/test correction being represented in the candidate PR.
- T007–T008 remain pending until executable verification is available and current-head GitHub checks can be inspected.

## Implementation strategy

Use a test-first design, make one exact-span correction, remove one known false-positive report row, then rely on actual current-head CI evidence. Do not change the template checksum, scanner rules, workflow triggers/permissions, or unrelated report entries.
