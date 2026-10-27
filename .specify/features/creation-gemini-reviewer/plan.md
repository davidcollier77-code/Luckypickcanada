# Plan: Gemini Reviewer Reliability and Clickable Controls

1. **Workflow events:** Trigger on `issue_comment` (created, edited) and `pull_request_review` (submitted, edited) while executing trusted base-branch code.
2. **State and UI:** Generate SHA-256-derived finding IDs, serialize review state with the PR head SHA, and render finding-selection checkboxes plus `Fix selected findings` and `Fix all findings` action checkboxes.
3. **Coverage:** Catch each model batch failure, record it in coverage gaps, and never report complete coverage when a required batch fails.
4. **Source context:** Raise changed-file source from 3,600 to 6,000 characters, total source context from 100,000 to 160,000 characters, and expand base/import context limits modestly. Keep per-patch and file-count caps; report which supporting files were shortened rather than using a vague warning.
5. **Event handling:** Use a shared action parser for newly checked boxes. Verify review state against the current PR head, map selected IDs internally, and preserve only `repair one` and `repair all` as text fallbacks.
6. **Testing:** Keep focused state, selection, action-transition, and context-budget tests in `__tests__/gemini-reviewer-context.test.ts`, discovered by the Vitest runner.
7. **Verification:** Run `./jules-verify.sh` and all required PR CI checks; report the actual results.
