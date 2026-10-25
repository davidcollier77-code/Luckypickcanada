# Tasks — Independent Gemini PR Reviewer

- [x] T001 Inspect Amazon Q review rules, the document-library manifest and snapshots, and the existing Gemini reviewer.
- [x] T002 Create concise Gemini-only instructions based on Amazon Q's A–B–C standards without modifying Amazon Q's rules.
- [x] T003 Add the trusted-base GitHub Actions workflow for automatic reviews, explicit suggestion requests, and manual dispatch.
- [x] T004 Implement Gemini primary/fallback calls, relevant task-group selection, library-document use reporting, evidence-based findings, and bounded errors.
- [x] T005 Implement opt-in GitHub suggestion blocks, eligible-path filtering, and no-direct-write behavior.
- [x] T006 Add focused workflow/rules/script regression tests, including JavaScript syntax checks.
- [ ] T007 Run current-head GitHub Actions/CI, inspect all checks, and reconcile the final diff. Do not claim a check passed until evidence confirms it.
- [ ] T008 After owner-approved activation, verify a naturally occurring automatic review and one explicitly requested suggestion run before claiming live operation is proven.
- [x] T009 Keep automatic initial reviews lightweight; reserve task-group selection and library-document loading for explicit full-review and repair-all requests.
- [x] T010 Restrict supporting snapshots to the selected task group(s) and report exactly which were loaded and useful.
