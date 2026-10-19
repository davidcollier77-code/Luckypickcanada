# Tasks: Repair Gemini PR-Agent Workflow

**Input**: `.specify/features/034-pr-agent/`

## Phase 1: Investigation and specification

- [x] T001 Inspect the merged PR-Agent workflow, prior implementation diff, required repository governance, and routed troubleshooting references.
- [x] T002 Update `.specify/features/034-pr-agent/spec.md`, `plan.md`, `research.md`, `quickstart.md`, and `checklists/requirements.md` for the confirmed correction.

## Phase 2: Workflow repair

- [x] T003 Correct event handling, step-level secret/configuration mapping, Gemini model selection, same-provider fallback, and missing-secret diagnostics in `.github/workflows/pr-agent.yml`.
- [x] T004 Add workflow regression coverage in `__tests__/pr-agent-workflow.test.js`, using a repository-root path that works in Vitest's runner.
- [x] T005 Update the canonical task summary in `PR_SUMMARY.md` and current repository context in `memory-bank/activeContext.md` and `memory-bank/progress.md`.

## Phase 3: Verification and live acceptance

- [ ] T006 Rerun `pnpm exec vitest run __tests__/pr-agent-workflow.test.js` and `pnpm run test`; resolve in-scope failures. The first full-suite run exposed a URL-base issue in the new test, now corrected.
- [ ] T007 Run `pnpm tsc --noEmit`, `./jules-verify.sh`, Playwright, and the OpenNext/Cloudflare validation including the 495 MiB size gate.
- [ ] T008 Inspect the full PR diff and confirm GitHub Actions checks after PR creation. Local commands are blocked in this session; use actual CI evidence and record its result in `PR_SUMMARY.md`.
- [ ] T009 After the workflow reaches `main`, verify an eligible PR event completes the PR-Agent job and posts a Gemini review. Confirm secret availability without disclosing its value.

## Dependencies and execution order

- T001 precedes the documentation and workflow implementation tasks.
- T003 and T004 are the focused implementation increment.
- T006–T008 depend on the PR branch's CI execution and current-head checks.
- T009 depends on the workflow being available from the default branch and a new eligible PR event.

## Acceptance criteria

- The action configuration is nested under `env:` at the same level as `uses:`.
- The intended model identifier is `gemini/gemini-3.8-flash`.
- GitHub and PR-Agent event lists agree.
- No bot-sender filter blocks agent-created pull requests.
- Missing credentials fail safely and never print their value.
- CodeRabbit, Amazon Q, other application behavior, dependencies, and deployment workflows remain untouched.
