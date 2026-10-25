# Tasks — Gemini PR Reviewer and Optional Fix Suggestions

- [x] T001 Inspect repository governance, Amazon Q rules, `.docs` manifest/routed snapshots, and existing Gemini reviewer implementation.
- [x] T002 Create dedicated Gemini instructions based on Amazon Q's A–B–C review standards without modifying the original.
- [x] T003 Add a trusted-base GitHub Actions workflow for automatic review, explicit suggestion mode, and manual dispatch.
- [x] T004 Implement Gemini primary/fallback calls, local document selection/reporting, evidence-based findings, inline review comments, and bounded errors.
- [x] T005 Implement opt-in GitHub suggestion blocks, eligible-path filtering, and no-direct-write behavior.
- [x] T006 Add focused workflow/rules/script regression tests including JavaScript syntax checks.
- [ ] T007 Run current-head GitHub Actions/CI, inspect all checks, and reconcile the final diff. Do not claim a check passed until evidence confirms it.
- [ ] T008 After owner-approved activation, verify a naturally occurring automatic review and one explicitly requested suggestion run before claiming live operation is proven.
- [x] T009 Keep the initial automatic review lightweight while making both required Gemini references mandatory for every group selected during explicit full-review or repair-all requests.
- [x] T010 Exclude Jules-specific documents and report selected task groups, exact snapshots loaded, and honest USED/USEFUL evidence.
