# Implementation Plan: DevSkim Backlog Investigation and Remediation

**Branch**: `freebuff/devskim-backlog-remediation-219` | **Date**: 2026-11-26 | **Spec**: `specs/219-devskim-backlog-remediation/spec.md`

**Input**: Feature specification from `specs/219-devskim-backlog-remediation/spec.md`

## Summary

Investigate the 422 open DevSkim alerts, establish the true cause of the reported increase, and remediate only the reviewed false positives. The work extends the existing exact-span SARIF filter to Spec Kit evidence JSON files and to the production meter watchdog, fixes the report's single-page alert fetch, and adds positive and negative regression coverage. It does not change scanner rules, scan globs, triggers, dependencies or application code.

## Technical Context

**Language/Version**: Python 3 (GitHub Actions runner), Node.js 26.x for the repository test suite

**Primary Dependencies**: `microsoft/DevSkim-Action` v1.0.16 (pinned), `github/codeql-action/upload-sarif` v4.39.3 on `main` (the Dependabot bump to v4.39.4 is unrelated to scanning), GitHub CLI (`gh api`)

**Storage**: N/A

**Testing**: Python `unittest` for the suppression filter and report contract; Vitest for the workflow contract; the existing real-SARIF replay gate

**Target Platform**: GitHub Actions; no application runtime change

**Project Type**: CI security tooling and reporting

**Performance Goals**: The filter remains linear in results per file; the existing per-file source cache is reused. Pagination adds one request per 100 alerts.

**Constraints**: Do not weaken production detection; no manual alert dismissal; no scanner configuration change; preserve the raw SARIF artifact; keep the production build below 495 MiB.

**Scale/Scope**: 422 open alerts (421 DS162092, 1 DS172411), 13 evidence JSON files, one workflow fetch and one workflow contract.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Owner authority and scope**: The task is explicitly authorized as a separate task and branch; PR #2035 is untouched.
- **Security preserved**: Suppression remains rule-scoped, path-scoped and span-validated; the negative matrix proves production findings survive.
- **No unrelated work**: The change set is limited to the filter, its tests, the report fetch, the report/ workflow contract tests, and the Spec 219/Memory Bank records.
- **Build limit**: The change set is `specs/`, `memory-bank/`, `.github/` and `__tests__/`, all build-exempt; the classifier should report the build as not required. If a build is requested, it must be measured below 495 MiB.
- **Governance**: No `AGENTS.md`, protected file, dependency manifest, scanner rule or trigger changes.

## Project Structure

### Documentation (this feature)

```text
specs/219-devskim-backlog-remediation/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
└── evidence.md
```

### Source Code (repository root)

```text
.github/
├── scripts/
│   ├── suppress_devskim_false_positives.py
│   ├── test_suppress_devskim_false_positives.py
│   ├── test_pr_verification_report.py
│   └── verify_devskim_sarif_replay.py
└── workflows/
    └── pr-verification-report.yml

__tests__/
└── checker-suite-workflows.test.js
```

**Structure Decision**: Extend the existing suppression and reporting tooling in place. No new runtime module or dependency is introduced.

## Phase 0: Research

Research is recorded in `research.md`. It establishes:

1. The true open count is 422; the "approximately 100" was the report's unpaginated page cap.
2. All 422 alerts were created by the Spec 217 PR scan at `2026-11-24T23:48:05Z` and confirmed on the default branch after the merge.
3. Dependabot's November 24 npm updates did not touch DevSkim; the November 25 GitHub Actions update changed only the SARIF uploader pin.
4. The 421 DS162092 findings are valid loopback data in documentation JSON; the DS172411 finding is a callable, fixed-delay watchdog.
5. The existing filter already suppresses identical evidence under `artifacts/` and two Spec Kit benchmark files; the evidence directory was the gap.

## Phase 1: Design

- Add `is_local_specs_evidence_path()` and reuse the existing JSON/loopback span validation.
- Add a dedicated meter timer allowlist and exact statement pattern.
- Fix the report fetch with `--paginate --slurp` plus `jq 'add // []'`.
- Add positive and negative tests, including a stale-SARIF note for local verification.

## Phase 2: Tasks

The executable task list and completion record are in `tasks.md`.

## Complexity Tracking

No constitution violations. No new dependency, no new runtime path, and no scanner configuration change.
