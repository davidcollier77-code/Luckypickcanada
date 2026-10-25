# Tasks — Gemini PR Reviewer and Opt-In Auto-Fix

- [x] T001 Inspect repository governance, Amazon Q rules, the .docs manifest/routed snapshots, model documentation, and existing Gemini reviewer history.
- [x] T002 Create a dedicated Gemini rules file based on Amazon Q without editing the original.
- [x] T003 Design a trusted-base checkout workflow for automatic review, explicit comment-triggered fix, and manual dispatch.
- [x] T004 Implement primary/fallback Gemini API calls, local document selection/reporting, evidence-based findings, inline suggestions, and bounded error reporting.
- [x] T005 Implement opt-in, validated GitHub inline fix suggestions without direct repository writes; do not merge or execute pull-request code.
- [x] T006 Add focused workflow/rules/script regression tests.
- [ ] T007 Run current-head GitHub Actions/CI and `pnpm test`, inspect all checks, and reconcile the final diff. This API-only authoring session cannot run local commands; do not claim tests or `./jules-verify.sh` passed.
- [ ] T008 After the owner merges the PR, verify one naturally occurring eligible PR review and one manually authorized fix attempt before treating live operations as proven.
