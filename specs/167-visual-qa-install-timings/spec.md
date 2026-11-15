# Feature Specification: Visual QA Install Timing Report

**Feature Branch**: `freebuff/02773acb0f15757c85d4c07d-install-timings`

**Created**: 2026-11-15

**Status**: Implemented

**Input**: Add a small script that, given a Visual QA run ID, prints the Install dependencies step durations and cache hit/miss states for each shard so the next genuinely visual pull request can be compared with the PR #1914 baseline in one command.

## User Scenarios & Testing

### User Story 1 — One command compares a visual run with the pre-change baseline (Priority: P1)

After a rendering-capable pull request runs Visual QA, the owner runs one command with the run ID and sees each Visual QA job's `Install dependencies` duration next to the PR #1914 baseline of 8 s for the verification job and 7 s for each browser shard, including the delta.

**Why this priority**: This is the requested outcome. The previous comparison required reading job timestamps and logs by hand.

**Independent Test**: Run the report against the recorded PR #1914 job data (offline fixture) and confirm the three rows show 8 s / 7 s / 7 s with zero deltas and the verification job before the shards.

### User Story 2 — Cache states identify the only case where the removed download mattered (Priority: P1)

The report shows whether the pnpm store and the version-keyed Playwright Chromium cache were hits or misses for each job, so a warm run (expected saving: zero) is not confused with a cold pnpm store (where the skipped postinstall download would previously have run).

**Why this priority**: The measured evidence shows warm installs take about 7–8 s with no browser download; only a cold pnpm store makes the removed download observable.

**Independent Test**: Feed real-shaped `@actions/cache` log lines for hits and misses and confirm both cache families are classified with their keys; feed a job with no `Install Playwright Chromium (cache miss)` success and confirm the Chromium state is `hit`.

### User Story 3 — Missing evidence is reported, not guessed (Priority: P2)

A run with no browser shard, an unreadable job log, a running step or an API failure produces an explicit `unknown`, `n/a`, `?` or non-zero exit instead of a fabricated number.

**Independent Test**: Run with empty logs, an in-progress cache step and a missing fixture, and confirm `unknown`/`?` output and exit status 2 for the missing input.

### Edge Cases

- A non-visual run contains only the verification job; the report notes that no Chromium shard ran.
- A job log is unavailable or unauthenticated; pnpm state becomes `unknown` but durations are still reported.
- GitHub serves job logs as a one-entry zip; a corrupt archive is an explicit error.
- A step that has started but not completed has no duration (`?`), never zero.
- The repository is supplied by `--repo`, `GITHUB_REPOSITORY`, or the git origin remote, in that order.

## Requirements

### Functional Requirements

- **FR-001**: The command MUST accept a workflow run ID and use only read-only GitHub REST calls.
- **FR-002**: It MUST report every job whose name starts with `Visual QA` and contains an `Install dependencies` step, excluding `Detect visual changes`; ordering MUST place the verification job before the browser shards.
- **FR-003**: Install duration MUST be whole seconds between the step's start and completion, and the delta MUST be computed against the embedded PR #1914 baseline (`Visual QA` 8 s, shards 7 s).
- **FR-004**: pnpm store and Chromium cache states MUST be reported as `hit`, `miss`, `unknown` or `n/a`, with the cache key when available.
- **FR-005**: Chromium state MUST fall back to the `Install Playwright Chromium (cache miss)` step conclusion when the log is unavailable; `skipped` means hit, `success` means miss.
- **FR-006**: Job logs MUST be decoded as plain text or as a one-entry zip archive; a corrupt archive MUST fail with a clear message.
- **FR-007**: Missing logs MUST NOT fail the report; cache state becomes `unknown`.
- **FR-008**: The report MUST warn when a pnpm store miss is present and explain that this is the only case where the skipped postinstall download mattered.
- **FR-009**: `--json` MUST emit the same data machine-readably, including the baseline reference.
- **FR-010**: The tool MUST NOT print or persist the token, and MUST strip the Authorization header when following the log download redirect to a different host.
- **FR-011**: Offline fixtures MUST allow the report and its tests to run without GitHub access.

### Key Entities

- **Reporter**: `.github/scripts/report_visual_qa_install_timings.py` — reads a run, jobs and logs; prints a table or JSON.
- **Baseline**: PR #1914 run `43730539554` — verification 8 s, shard 1 7 s, shard 2 7 s.
- **Cache record**: family (`pnpm` or `chromium`), state (`hit`/`miss`/`unknown`/`n/a`) and key.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The PR #1914 fixture reports 8 s / 7 s / 7 s with zero deltas and the verification row first.
- **SC-002**: Real-shaped hit and miss log lines produce the correct state and key for both cache families.
- **SC-003**: Missing logs, missing steps and unfinished steps never produce a fabricated duration or cache state.
- **SC-004**: At least 20 offline tests pass and the tool compiles under the QA workflow's Python syntax check.
- **SC-005**: The existing Visual QA jobs, install steps and Playwright provisioning are unchanged apart from running the new test.

## Assumptions

- setup-node and actions/cache log `Cache restored from key:` and `Cache not found for input keys:` through `@actions/cache`.
- The GitHub token is available through `GH_TOKEN`/`GITHUB_TOKEN` or an authenticated `gh` CLI; anonymous read-only metadata access is allowed but may not include logs.
- The baseline timings are stable enough for a ±1 s comparison; smaller differences are run-to-run noise.
