# Plan: Gemini Reviewer Reliability and Clickable Controls

1. **Workflow events:** Trigger on pull-request review and trusted PR-comment edits while executing trusted base-branch code.
2. **State and UI:** Generate SHA-256-derived finding IDs, serialize current-head review state, and render checkboxes for each finding plus "Fix selected findings" and "Fix all findings".
3. **Source context:** Increase changed-file context to 6,000 characters and the total source context budget to 160,000 characters; increase base/import source limits modestly and identify shortened files in coverage notes.
4. **Event handling:** Share checkbox-transition parsing across edited comment/review events. Resolve checked IDs internally, validate review state against the current PR head, and retain `repair one`/`repair all` as optional fallbacks only.
5. **Testing:** Keep state, source-budget, truncation-message, and checkbox-transition regression tests in `__tests__/gemini-reviewer-context.test.ts`, where Vitest discovers them. Do not retain a standalone assertion file that Vitest treats as an empty suite.
6. **Verification:** Run `./jules-verify.sh` and all required PR CI checks; report actual outcomes and leave the PR open.
