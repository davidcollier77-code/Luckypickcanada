# Feature Specification: Faster, More Reliable PR Checkers and Dedicated AGENTS.md Governance

**Feature Branch**: `fix/141-pr-checker-governance-protection`
**Created**: 2026-11-11
**Status**: Implemented
**Input**: Audit and improve the GitHub-native pull-request checkers, correct the AGENTS.md protection checker so governance updates have a dedicated path, and preserve every existing quality gate.

## Context

The repository runs seven pull-request workflows that are not AI review bots:

| Workflow | Check name | Purpose |
| --- | --- | --- |
| Visual QA | `Visual QA` | Path classification, full Vitest suite, `freebuff-verify.sh` (Spec Kit gate, TypeScript, production build, docs tests), Playwright visual baselines |
| Validate OpenNext Repair | `Validate OpenNext build artifacts` | `next build`, 495 MiB cap, OpenNext build, compiled Tailwind CSS, worker/assets presence, Wrangler build validation |
| DevSkim | `DevSkim scan and Security upload` | Static security scan, audited false-positive suppression, SARIF replay, Security-tab upload |
| Verification Integrity | `Verification Integrity` | Proves checks ran against the current head and reports skipped or unrun checks as **NOT RUN** |
| Protected File Changes | `Detect protected file changes` / `Protected File Authorization` | Fails closed on unreadable change lists and requires the `protected-file-authorization` environment for protected files |
| Deploy Updater Scheduler | `Verify updater scheduler` | Scheduler unit tests, Spec Kit rebase test, real safe upgrade, governance verification, build-size ceiling |
| Pullfrog | advisory AI review | Excluded from this audit as an AI review bot |

Recorded GitHub evidence (workflow run pages, 2026-11-10 and 2026-11-11):

- Visual QA successes: 12 m 14 s, 12 m 17 s, 13 m 9 s, 14 m 55 s. Recent failures: 58 s, 1 m 10 s, 1 m 19 s.
- Validate OpenNext Repair: 1 m 44 s to 2 m 49 s on normal pull requests; 16 m 33 s and 13 h 18 m 53 s on the two docs-refresh pull requests.
- DevSkim: 40 s to 1 m 20 s; 13 h 18 m 53 s on the same docs-refresh pull request.
- Verification Integrity: 17 s to 3 m 7 s, with 10 m 13 s and 12 m 30 s waits; the workflow waits up to 600 s for required checks.
- Protected File Changes: 10 s to 56 s.
- The 13-hour values recur across three workflows for the same pull request, so they are queue/wait time rather than three independent slow steps.

Local reproduction on the checked-out `main` head `62615d1c`:

- `pnpm run test` failed at the governance suite with a parse error in `__tests__/agent-governance-single-source.test.js:108` (missing parenthesis). That single syntax error explains the fast Visual QA failures on every recent pull request, including the two "Update AGENTS.md" pull requests.
- `pnpm exec tsc --noEmit` 6.4 s; the targeted two-file Vitest subset 1.9 s; full Vitest 9.9 s; warm `pnpm install --frozen-lockfile` 4.3 s.
- The Playwright browser could not launch in this sandbox because host libraries (`libnspr4.so`) are absent, so browser duration is taken from the recorded workflow runs, not from a local timing.

Current protection behaviour: `protected-files.yml` treats `AGENTS.md` like any other protected path. Every change needs environment approval and there is no distinction between a dedicated governance pull request and an `AGENTS.md` edit hidden inside an unrelated change. The existing governance test asserts workflow strings only, so it does not exercise the classifier, and its syntax error currently disables it.

## User Scenarios & Testing

### User Story 1 — Update governance through a dedicated pull request (Priority: P1)

As the repository owner, I want an `AGENTS.md` change to be allowed only when the pull request is dedicated to governance, so a legitimate governance update is possible without weakening the approval boundary, while an `AGENTS.md` edit hidden in unrelated work is refused.

**Independent Test**: Run the classifier with three change sets — `AGENTS.md` plus governance tests/protection files, `AGENTS.md` alone, and `AGENTS.md` plus `app/page.tsx` — and inspect the exit code, mode and offending paths.

**Acceptance Scenarios**:

1. **Given** a pull request that changes `AGENTS.md`, the protection workflow, its checker and tests, the governance test, `CODEOWNERS` and `PR_SUBMISSION.md`, **When** the classifier runs, **Then** it reports `dedicated`, exits 0, and the environment authorization gate is still required.
2. **Given** a pull request that changes `AGENTS.md` and `app/page.tsx`, **When** the classifier runs, **Then** it reports `unrelated`, exits 1, and names `app/page.tsx`.
3. **Given** a pull request that changes `AGENTS.md` and `package.json` or another workflow, **When** the classifier runs, **Then** it is refused.
4. **Given** a pull request title or description that claims governance approval, **When** the classifier runs, **Then** the title/description are not accepted as inputs and cannot change the result.

### User Story 2 — Recognise merged governance as the baseline (Priority: P1)

As the repository owner, I want an approved and merged governance update to become the baseline, so later pull requests do not keep reporting the same already-approved change.

**Independent Test**: Classify the same `AGENTS.md` blob against the old base and then against the merged head as the new base. The first is `dedicated`; the second is `unchanged` and allowed.

**Acceptance Scenarios**:

1. **Given** the head `AGENTS.md` blob equals the base blob, **When** the classifier runs, **Then** it reports `unchanged` and allows the pull request.
2. **Given** an approved governance change merged into `main`, **When** a later pull request does not modify `AGENTS.md`, **Then** no governance violation is produced.
3. **Given** missing base or head blob identity, **When** the classifier runs, **Then** it fails closed with an indeterminate result.

### User Story 4 — Failures are visible and not self-inflicted (Priority: P1)

As the repository owner, I want the check suite to stop failing because of a broken governance test and to keep every gate, so red checks mean a real problem.

**Acceptance Scenarios**:

1. **Given** the current `main`, **When** the governance suite runs, **Then** it parses and passes.
2. **Given** a failing Playwright shard, **When** Verification Integrity audits the head, **Then** the Visual QA group is reported `FAIL`, never `PASS`.
3. **Given** any pull request, **When** Visual QA runs, **Then** the full unit suite and `freebuff-verify.sh` still run.

### User Story 3 — Spend less time on repeated or serial browser work (Priority: P2)

As the repository owner, I want duplicated steps removed and the long Playwright phase sharded, so pull-request feedback arrives sooner without losing a single test.

**Independent Test**: Compare the workflow definitions and recorded run durations; confirm the full Vitest suite still runs, `freebuff-verify.sh` still runs TypeScript and the production build, and both Playwright shards execute every spec file across the existing three projects.

**Acceptance Scenarios**:

1. **Given** a pull request that needs visual QA, **When** Visual QA runs, **Then** two Playwright shards run in parallel and both must pass.
2. **Given** a documentation-only pull request, **When** Visual QA runs, **Then** the stable `Visual QA` verification job still runs the unit suite and `freebuff-verify.sh`.
3. **Given** the targeted allowance/Oracle test files, **When** Visual QA runs, **Then** they still execute as part of the full suite.
4. **Given** a build-validation pull request, **When** Validate OpenNext Repair runs, **Then** it reuses the pnpm store, has a bounded timeout, and performs every existing build, size, CSS and artifact check.

## Requirements

### Functional Requirements

- **FR-001**: The protection workflow MUST classify `AGENTS.md` changes as `dedicated`, `unchanged`, `unrelated`, `removed` or indeterminate.
- **FR-002**: A dedicated governance pull request MUST be allowed to include `AGENTS.md`, the protection workflow/checker/tests, the governance test, `CODEOWNERS`, `PR_SUBMISSION.md`, `scripts/verify-startup.sh`, `freebuff-verify.sh`, and permitted Spec Kit, Memory Bank and evidence records.
- **FR-003**: `AGENTS.md` in any pull request that also changes application code, dependencies, other workflows or general documentation MUST be refused, with the offending paths listed.
- **FR-004**: Deleting or renaming `AGENTS.md` away MUST always be refused.
- **FR-005**: The classifier MUST NOT accept title, body, label, comment, branch or reason arguments, and unknown arguments MUST fail.
- **FR-006**: The classifier MUST fail closed on an empty/unreadable change set, unsafe paths, or missing baseline identities.
- **FR-007**: The approved baseline MUST be the `AGENTS.md` on the pull request base branch, so a merged approved change becomes the baseline automatically.
- **FR-008**: The human `protected-file-authorization` environment gate MUST remain required for every protected-file change.
- **FR-009**: The protection workflow MUST run trusted base-branch code (`pull_request.base.sha`), never the pull request head, and MUST NOT check out untrusted code.
- **FR-010**: The governance Vitest suite MUST parse, MUST still assert the current AGENTS.md requirements, and MUST exercise the classifier end to end.
- **FR-011**: Verification Integrity MUST audit every Visual QA shard and report any failed or pending shard as `FAIL`/`PENDING`.
- **FR-012**: Visual QA MUST continue to run the full unit suite and `freebuff-verify.sh` for every pull request, and Playwright must run in two shards that together execute the whole suite.
- **FR-013**: Validate OpenNext Repair MUST retain every existing check, add pnpm-store caching, a bounded timeout, and cancel superseded runs.
- **FR-014**: DevSkim MUST retain its scanner, suppression tests, SARIF replay and uploads; only runtime bounds are added.
- **FR-015**: `freebuff-verify.sh` MUST run the new protection regression suite.

### Success Criteria

- **SC-001**: All 25 protection-classifier tests and all 28 verification-integrity tests pass.
- **SC-002**: The governance Vitest suite passes (8/8).
- **SC-003**: The full Vitest suite passes with no reduction in test files or tests.
- **SC-004**: `./freebuff-verify.sh` passes.
- **SC-005**: The production build stays strictly below 495 MiB.
- **SC-006**: Recorded evidence shows the duplicated steps removed and the Playwright suite split into two complete shards; CI runtime after merge is reported as PENDING until a GitHub run is observed.

## Scope

**In scope**: `.github/workflows/` pull-request checkers, `.github/scripts/` protection and verification tooling, `__tests__/agent-governance-single-source.test.js`, `freebuff-verify.sh`, `.github/CODEOWNERS`, Spec Kit and Memory Bank records.

**Out of scope**: `AGENTS.md` wording, application code, dependencies, scanner scope, `.docs/`, Pullfrog, Browserless, scheduled documentation/Spec Kit updaters, and deployment workflows that do not run on pull requests.
