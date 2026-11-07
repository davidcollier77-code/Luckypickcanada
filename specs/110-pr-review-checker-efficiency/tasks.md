# Tasks: Efficient and Reliable Pull-Request Review Checker

**Input**: Design documents from `specs/110-pr-review-checker-efficiency/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Specification and setup

- [x] T001 Inspect `AGENTS.md`, the Memory Bank, the selected task-group instructions, `.docs/manifest.json`, `.github/workflows/devskim.yml` and the three `.github/scripts/` checker modules.
- [x] T002 Establish which review system this repository owns: all custom LLM reviewers are retired, Pullfrog is console-only and "DO NOT EDIT" — the DevSkim pipeline is the repo-owned reviewer of pull-request changes.
- [x] T003 Record the pre-change baseline: 78 suppression tests pass; `py_compile` clean; build the deterministic filter benchmark and capture `before.json`.
- [x] T004 Profile the real code path and identify the causes: one full read, one full JSON parse and two O(file size) UTF-16 scans per finding.
- [x] T005 Complete `spec.md`, the requirements checklist, `plan.md` and this ordered task list before implementation.

## Phase 2: User Story 1 — Constant cost per source file (Priority: P1)

- [x] T006 [US1] Add `SourceContext` (single text read, single JSON parse, cached line ranges, `bisect`-based `utf16_offset_to_index`) and `SourceCache` to `suppress_devskim_false_positives.py`.
- [x] T007 [US1] Thread an optional `context=` through every suppression predicate and build one `SourceCache` per `process_sarif` run; keep old call signatures working.
- [x] T008 [US1] Prove equivalence: cached conversion equals the reference function for every offset on BMP and astral strings; filtered-SARIF digest and suppressed counts identical at 85/110/160/260/460 findings.

## Phase 3: User Story 2 — Shared replay cache (Priority: P1)

- [x] T009 [US2] Create one `SourceCache` in `verify_devskim_sarif_replay.replay()` and pass it to `_assert_audited_findings_removed`.
- [x] T010 [US2] Prove the strict verdict is unchanged: 8/8 audited families removed, non-allowlisted finding preserved, no family absent, 37.58 ms → 21.06 ms.

## Phase 4: User Story 3 — Distinct findings are not collapsed (Priority: P2)

- [x] T011 [US3] Replace the single identity with `finding_identities` (refined id + legacy id) and skip when either is known; include message, start column and end line for fingerprint-less findings.
- [x] T012 [US3] Prove the gap on the pre-change code (2 distinct findings → 1 entry) and its closure on the new code (2 entries), with duplicates still recorded once and earlier entries never re-appended.

## Phase 5: Verification and delivery

- [x] T013 [Testing] Add regression tests: `Utf16IndexCacheTests`, `SourceCacheEfficiencyTests` (single read/parse/line-range decode, cached vs uncached equivalence), `DevSkimReportIdentityTests`; suite now 87 tests.
- [x] T014 [Testing] Run `py_compile` on all three modules and the suppression suite — PASS.
- [x] T015 [Testing] Run the full Vitest suite, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh` and the build with a size measurement against the 495 MB cap.
  - `./freebuff-verify.sh`: PASS (TypeScript clean, `next build` compiled, refresh-docs 36/36, final "All verification steps passed").
  - Build size: `.next` 300,738,134 B + `public` 32,840,043 B = 333,578,177 B (318.12 MiB), below the 495 MB cap.
  - Full `pnpm exec vitest run`: 48 of 49 files pass, 387 of 388 tests pass; the single failure is `__tests__/agent-governance-single-source.test.js > preserves the MCP connection-versus-use clarification`, which also fails on the base commit because the asserted sentence is absent from `AGENTS.md` at HEAD and this task did not modify `AGENTS.md`. Recorded as a pre-existing, out-of-scope failure rather than fixed here.
- [x] T016 Publish the canonical PR summary, leave the PR open and unmerged, and record the final diff audit.
  - PR #1767 (`perf/devskim-review-checker-20261107` → `main`), open and unmerged; the PR body is the single canonical summary.
  - Final diff audit: 20 files, all accounted for in the PR body; no application, workflow, dependency, lockfile, secret or `.docs/` change; no stray debug code in the Python diff.

## Phase 6: Owner-authorized governance checker correction

- [x] T017 Update `__tests__/agent-governance-single-source.test.js` where it asserted the pre-`d3512df5` wording of the MCP clarification, so it tracks the current `AGENTS.md` §5 sentence. The requirement itself (a listed MCP or a connection alone is not MCP use) is preserved and still asserted; `AGENTS.md` was not modified or reverted.
  - Owner authorization: the task request explicitly asks to update the checker where outdated and not to modify `AGENTS.md`.
- [x] T018 Re-run the governance test, the full Vitest suite, `./freebuff-verify.sh` and the build size check, and record the results.
  - `pnpm exec vitest run __tests__/agent-governance-single-source.test.js`: PASS (4/4).
  - `pnpm exec vitest run`: PASS (49 files, 388 tests).
  - `SPEC_KIT_BASE_REF=f1752c5a ./freebuff-verify.sh`: PASS; the base ref is required because this clone has no local `main`/`origin/main`, so the gate would otherwise compare only working-tree changes.
  - Build: `.next` 318,167,649 B + `public` 32,840,043 B = 351,007,692 B (334.75 MiB), below the 495 MB cap.
