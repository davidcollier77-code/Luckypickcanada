# Tasks: Gemini Reviewer Source Context

- [x] T001 Read repository governance and inspect the existing reviewer, workflows, rules, tests, and Amazon Q findings on PR #1610.
- [x] T002 Update the feature specification in `.specify/features/gemini-review-context/spec.md` with the verified cross-file, async-ordering, and image-format requirements.
- [x] T003 Update this implementation plan in `.specify/features/gemini-review-context/plan.md`.
- [x] T004 Add bounded read-only source retrieval at immutable PR head/base SHAs and relevant relative-import context in `.github/scripts/gemini-reviewer.cjs`.
- [x] T005 Repair the malformed `clipSource` marker string in `.github/scripts/gemini-reviewer.cjs` that caused a JavaScript syntax error in the previous commit.
- [x] T006 Add explicit async scheduling/call-path and browser image-preload reasoning to `.github/scripts/gemini-reviewer.cjs` and `.gemini/rules/luckypickcanada.md`.
- [x] T007 Add focused reasoning regression tests in `__tests__/gemini-reviewer-context.test.ts`, including fallback import-probe limits.
- [ ] T008 Run targeted/full Vitest and `./jules-verify.sh`; verify results on the exact PR head.
- [ ] T009 Inspect all current-head checks and the complete final diff.
- [ ] T010 Confirm live Gemini reviewer behavior against the preload and async-ordering examples when a suitable PR review can be run.
- [x] T011 Format reviews as red issues, evidence-backed green positives, and yellow coverage gaps in `.github/scripts/gemini-reviewer.cjs`.
- [x] T012 Put suggested fixes in collapsible details sections with copy-friendly text/code blocks and add formatting regression tests.
- [ ] T013 Verify the exact PR-head CI, including new review formatting tests.
- [x] T014 Repair the malformed chained assertion in `__tests__/gemini-reviewer-context.test.ts` and keep the template-literal import assertion separate.
- [ ] T015 Run focused Vitest, `pnpm build`, `./jules-verify.sh`, and verify a successful Cloudflare/OpenNext build for the repair PR head.
