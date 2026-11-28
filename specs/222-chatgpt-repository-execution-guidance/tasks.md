# Tasks: ChatGPT Repository Execution Guidance

**Input**: [spec.md](spec.md) and [plan.md](plan.md)

**Prerequisites**: `spec.md` and `plan.md`

## Phase 1 — Inspect and specify

- [x] T001 Read ChatGPT Setup and the complete ChatGPT Library startup README/script; run the documented startup preflight and record the available runtime and bootstrap outcome.
- [x] T002 Read the full live AGENTS.md, PR_SUBMISSION.md, manifest, four Memory Bank files, Spec Kit constitution/templates/workflow definitions, governance test and applicable QA/protected-file workflows.
- [x] T003 Specify the narrow Section 6 correction and preserve the existing Node.js, browser, Freebuff-environment and protected-file boundaries.

## Phase 2 — Implement

- [x] T004 Replace only Section 6 in `AGENTS.md`; name ChatGPT Setup, `/ChatGPT startup script/README.md`, `startup.sh`, the pnpm/Playwright options, the Node.js 22/26 limitation and the repository Playwright CLI limitation.
- [x] T005 Update the existing `__tests__/agent-governance-single-source.test.js` assertions to cover the new instructions and reject a blanket ban on repository scripts or utilities.
- [x] T006 Add this feature's specification, plan and task records; leave the active Spec Kit pointer and unrelated Memory Bank files unchanged to avoid colliding with existing open work.

## Phase 3 — Verify and hand off

- [x] T007 Review the complete proposed path set against the dedicated AGENTS.md protection classifier; confirm the PR contains only governance, its direct regression test and permitted task records.
- [x] T008 Review the complete Section 6/test diff, line count and task scope; inspect applicable QA checker semantics and determine which checks are build/visual-exempt.
- [ ] T009 Run the local focused Vitest governance test and Python protected-file regression suite when the repository checkout and required runtimes are available. This ChatGPT session has no repository checkout or pnpm; its Node.js 22.16.0 runtime cannot satisfy the Node.js 26.x project requirement. The pinned pnpm bootstrap also failed because npm registry DNS returned EAI_AGAIN.
- [ ] T010 After PR creation, inspect the consolidated report for the exact current HEAD SHA and all seven categories; report every pending, blocked or failed result accurately.
- [ ] T011 Hand off the exact `/approve-governance <digest>` command and the separate protected-file GitHub Environment authorization requirement to the owner; do not post approvals or merge.

## Verification Boundary

- ChatGPT startup preflight ran with `bash /mnt/data/luckypickcanada-chatgpt-startup/startup.sh --install-pnpm`.
- Observed runtime: Node.js 22.16.0. The repository requires Node.js 26.x and pnpm 10.30.3 for its full local verification gate.
- The startup script attempted to bootstrap only pnpm 10.30.3; npm registry DNS resolution failed with `EAI_AGAIN`. Project dependencies were not installed.
- Repository scripts with compatible prerequisites remain permitted under the updated Section 6. The local project regression suites are not executed here because no repository checkout or working pnpm installation is present.
- The PR-triggered verification workflows provide the trusted CI evidence; their outcomes remain pending until observed for the submitted PR's exact head.
