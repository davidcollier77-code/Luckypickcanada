# Tasks: Inori Review Recovery

- [x] T001 Inspect the existing workflow and the pinned Inori action's failure/output contract.
- [x] T002 Add a single conditional retry for the explicit no-valid-review-batch failure.
- [x] T003 Preserve fail-closed behavior and report effective and initial/recovery outcomes.
- [x] T004 Verify the workflow YAML parses and statically assert the retry condition, identical pinned action/inputs, and final fail-closed guard.
- [ ] T005 Review the pull-request GitHub Actions results and run ./jules-verify.sh when a runnable checkout is available.
- [ ] T006 Perform a final scope, secrets, and changed-file double-check; report any verification limitation.
