# Tasks: Repair Gemini PR-Agent Workflow

**Input**: `.specify/features/034-pr-agent/`

## Phase 1: Setup and investigation

- [x] T001 Inspect the merged PR-Agent workflow, PR #1527 implementation diff, repository governance, and required troubleshooting references.
- [x] T002 Update `.specify/features/034-pr-agent/spec.md`, `plan.md`, `research.md`, `quickstart.md`, and `checklists/requirements.md` for the verified repair.

## Phase 2: Foundational regression coverage

**Purpose**: Establish a repeatable guard for the exact workflow configuration failures discovered during investigation.

- [x] T003 Add targeted static workflow regression coverage in `__tests__/pr-agent-workflow.test.js`.

## Phase 3: User Story 1 — Receive a Gemini review (Priority: P1)

**Goal**: PR-Agent is configured to review supported pull-request events using the intended Gemini model, including bot-created PRs.

**Independent Test**: The configuration test confirms correct step-level environment mapping, model identifier, matching event filters, review-only mode, and Gemini-only fallback.

- [x] T004 Correct PR-Agent step environment mapping, model identifier, and Gemini-only fallback in `.github/workflows/pr-agent.yml`.
- [x] T005 Align GitHub and PR-Agent event filters and remove the sender-type exclusion in `.github/workflows/pr-agent.yml`.

## Phase 4: User Story 2 — Diagnose unavailable credentials safely (Priority: P2)

**Goal**: A missing or unavailable Actions secret results in a clear, non-disclosing failure before provider invocation.

**Independent Test**: The preflight fails on an empty value and otherwise logs availability without logging the secret itself.

- [x] T006 Add the secret-presence preflight and safe diagnostic to `.github/workflows/pr-agent.yml`.

## Phase 5: Polish and cross-cutting verification

- [x] T007 Update `PR_SUMMARY.md`, `memory-bank/activeContext.md`, and `memory-bank/progress.md` with observed evidence and verification limitations.
- [ ] T008 Rerun `pnpm exec vitest run __tests__/pr-agent-workflow.test.js` and `pnpm run test` on current head; resolve any in-scope failures.
- [ ] T009 Verify current-head TypeScript, `./jules-verify.sh`, Playwright, OpenNext/Cloudflare build, and the 495 MiB hard cap using GitHub Actions results.
- [ ] T010 After the workflow is available from `main`, confirm a supported PR event completes the Gemini review and publishes a visible review summary.

## Dependencies and execution order

- T001–T002 define the repair and govern the implementation.
- T003 creates regression coverage before finalizing workflow adjustments.
- T004–T006 implement the two prioritized user stories using the same workflow file.
- T008–T009 depend on fresh CI for this commit.
- T010 depends on the workflow being on the default branch and a supported event triggering a credentialed run.

## MVP and acceptance gates

- **MVP**: User Story 1 — a structurally valid workflow using the intended Gemini model on the declared events.
- **Required before merge**: Current-head tests, governance, and build checks must be reviewed.
- **Required before declaring fully operational**: A live post-merge event must produce a successful Gemini review visible on the pull request.
