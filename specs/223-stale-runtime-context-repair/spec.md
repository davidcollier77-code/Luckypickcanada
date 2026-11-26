# Feature Specification: Reconcile Stale ChatGPT Runtime and Script-Permission Documentation

**Feature Branch**: `docs/2042-runtime-context-repair`
**Created**: 2026-11-26
**Status**: Implemented — pending pull-request verification

## User Scenarios & Testing

### User Story 1 — Apply the current repository execution boundary consistently (Priority: P1)

As the repository owner, I need Spec 220 and all still-relevant repository records to describe the same Node.js, pnpm, Playwright and repository-script permissions as current `AGENTS.md` §6, so future ChatGPT sessions do not incorrectly abandon permitted work.

**Independent Test**: Search the complete changed-document set for blanket prohibitions, read each changed context in full, and compare every current execution statement with live `AGENTS.md` §6.

**Acceptance Scenarios**:
1. Given the repository requires Node.js 26.x and this ChatGPT environment has Node.js 22.16.0, when a command requires the repository runtime, then that operation is marked blocked or unverified for the precise runtime reason.
2. Given a repository script has compatible prerequisites and its execution is safe and authorized, when ChatGPT evaluates it, then the documentation does not prohibit it solely because it is a repository or Freebuff-named script.
3. Given the repository Playwright CLI/setup is unavailable to ChatGPT, when browser testing is required, then documentation preserves the current Python Playwright/installed Chromium and Browserless/Firecrawl fallback policy from `AGENTS.md`.
4. Given historical tasks did not run tests or scripts, when their records are corrected, then the factual non-execution status remains intact while the incorrect blanket-prohibition rationale is removed.

### User Story 2 — Keep Spec 220's dependency task accurate (Priority: P1)

As the owner who authorized the Wrangler/OpenNext dependency work, I need Spec 220 to retain its approved dependency scope and exact toolchain requirements while accurately identifying what is blocked in this ChatGPT session.

**Independent Test**: Read Spec 220's specification, plan and tasks together. Confirm they preserve the approved dependency targets and safeguards, distinguish Node-26-dependent work from compatible independent scripts, and do not claim implementation or verification has occurred.

### User Story 3 — Preserve a reliable active task record (Priority: P1)

As a future contributor, I need the active Spec Kit pointer and Memory Bank to identify this full documentation reconciliation, not a narrow one-file correction.

**Independent Test**: Confirm `.specify/feature.json` points to Spec 223, the three Spec 223 artifacts agree on exact scope, and Memory Bank current context/progress records describe the correction without rewriting unrelated history.

## Requirements

- **FR-001**: Correct the false blanket-prohibition wording in all in-scope repository documents identified by the repository-wide search, including Spec 220's `spec.md`, `plan.md` and `tasks.md`.
- **FR-002**: Correct stale verification explanations in Specs 164, 175, 176, 177, 197 and 216 while preserving historical facts about checks that were not run.
- **FR-003**: Correct the affected Memory Bank context and progress entries. Preserve the four core Memory Bank files and unrelated historical milestones.
- **FR-004**: Keep the Node.js 26.x / pnpm 10.30.3 requirements for project operations that need the repository runtime. Do not imply Node.js 22.x can substitute.
- **FR-005**: State that current `AGENTS.md` §6 permits compatible repository scripts, QA checkers and PR-support utilities when their own runtime, prerequisites, permissions, side effects, network access and costs are acceptable.
- **FR-006**: Preserve the ChatGPT restriction on the repository Playwright CLI/setup and retain the supported browser path described by current `AGENTS.md`.
- **FR-007**: Keep Spec 220's dependency implementation, lockfile generation, tests/builds and production verification explicitly pending until run in a compliant Node.js 26.x / pnpm 10.30.3 environment. Do not implement dependency changes in this documentation PR.
- **FR-008**: Update the active Spec Kit feature pointer and provide complete Spec 223 specification, plan and task artifacts.
- **FR-009**: Do not change `AGENTS.md`, `.docs/manifest.json`, application code, package manifests, lockfiles, QA workflows, checker logic, deployment configuration, Cloudflare settings, secrets or production resources.
- **FR-010**: Do not claim local tests, builds, repository verification scripts or PR-triggered checks passed unless actually executed and observed.

## Scope

The exact intended changed paths are:
- `.specify/feature.json`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`
- `specs/164-playwright-agentmd-guidance/evidence/qa-governance-continuation.md`
- `specs/175-docs-html-normalization/tasks.md`
- `specs/176-gemini-doc-source/plan.md`
- `specs/177-web-images-source-correction/plan.md`
- `specs/197-shared-graphics-toolkit-guidance/plan.md`
- `specs/197-shared-graphics-toolkit-guidance/tasks.md`
- `specs/216-chatgpt-browser-priority/plan.md`
- `specs/220-cloudflare-toolchain-maintenance/spec.md`
- `specs/220-cloudflare-toolchain-maintenance/plan.md`
- `specs/220-cloudflare-toolchain-maintenance/tasks.md`
- `specs/223-stale-runtime-context-repair/spec.md`
- `specs/223-stale-runtime-context-repair/plan.md`
- `specs/223-stale-runtime-context-repair/tasks.md`

## Success Criteria

- **SC-001**: No in-scope current-context statement claims that ChatGPT is categorically prohibited from running repository scripts.
- **SC-002**: Node.js 26.x and pnpm 10.30.3 requirements remain explicit for the Spec 220 dependency work and any project operation that requires them.
- **SC-003**: Compatible independent scripts remain permitted subject to the exact conditions in `AGENTS.md` §6.
- **SC-004**: Historical non-execution facts remain true and are not rewritten as successful verification.
- **SC-005**: Spec 220's dependency scope, version investigation, safeguards and outstanding implementation status remain intact.
- **SC-006**: Spec 223 specification, plan and task list are all present in the PR diff and `.specify/feature.json` points to Spec 223.
- **SC-007**: The complete changed-file inventory matches this specification and the PR QA-scope declaration.
- **SC-008**: No application, dependency, build input, QA workflow, deployment or production configuration changes occur.

## Assumptions

- Current live `AGENTS.md` §6 is authoritative and supersedes older interpretations in historical task records.
- Node.js 22.16.0 and the missing pnpm executable are facts about this ChatGPT session at the time of the startup preflight; they do not establish a blanket prohibition on compatible scripts.
- This task is documentation reconciliation only. The separately owner-authorized Wrangler/OpenNext dependency implementation remains Spec 220 work and is not part of this PR.
- ChatGPT Library files are outside the GitHub repository and cannot be represented as changed files in this repository PR; any Library-only wording requires a separate Library update rather than a fabricated repository path.
