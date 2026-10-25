# Tasks — Gemini PR Reviewer and Optional Fix Suggestions

- [x] T001 Inspect repository governance, Amazon Q rules, `.docs` manifest/routed snapshots, model history, and existing Gemini reviewer implementation history.
- [x] T002 Create a dedicated Gemini rules file based on Amazon Q without modifying the original.
- [x] T003 Add a trusted-base GitHub Actions workflow for automatic review, explicit suggestion mode, and manual dispatch.
- [x] T004 Implement Gemini primary/fallback calls, local document selection/reporting, evidence-based findings, inline review comments, and bounded errors.
- [x] T005 Implement opt-in GitHub suggestion blocks, eligible-path filtering, and no-direct-write behavior.
- [x] T006 Add focused workflow/rules/script regression tests including JavaScript syntax checks.
- [ ] T007 Run current-head GitHub Actions/CI, inspect all checks, and reconcile the final diff. This API-only session cannot execute local `pnpm test` or `./jules-verify.sh`; do not claim either passed.
- [ ] T008 After the owner merges the PR, verify one naturally occurring eligible PR review and one explicitly requested suggestion run before treating live operation as proven.
