# Tasks — Dependabot PR #1563 CI and scan repair

## Implementation
- [x] T001 Read AGENTS.md first and inspect the current PR head, changed files, failing check runs, workflow definitions, and security filter.
- [x] T002 Add a Dependabot-specific skip condition to the Gemini PR-Agent job while preserving fail-closed credential validation for eligible human-authored PRs.
- [x] T003 Add a column-bounded SHA-512 integrity-digest false-positive filter for DevSkim DS126858.
- [x] T004 Add regression tests for PR-Agent's Dependabot condition and positive/negative SHA-512 integrity suppression cases.
- [x] T005 Add this feature's required spec.md, plan.md, and tasks.md artifacts so repository governance verification can run on the CI-repair task.

## Verification
- [ ] T006 Run the focused DevSkim suppression unit tests on the final PR head.
- [ ] T007 Run the focused PR-Agent workflow test, full unit suite, TypeScript, and `./jules-verify.sh` on the final PR head.
- [ ] T008 Confirm DevSkim introduces no new false alert for the SHA-512 SRI string and the visual workflow proceeds through browser tests.
- [ ] T009 Confirm the production build, 495 MiB size cap, and OpenNext/Cloudflare validation pass on the final PR head.
- [ ] T010 Inspect the final PR diff and all current-head checks. Do not merge.
