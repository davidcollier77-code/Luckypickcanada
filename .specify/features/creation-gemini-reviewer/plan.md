# Plan: Gemini Reviewer Reliability and Clickable Controls

1. **Workflow events:** Trigger on pull-request review and trusted PR-comment edits while executing trusted base-branch code.
2. **State and UI:** Generate SHA-256-derived finding IDs, serialize current-head review state, and render checkboxes for each finding plus "Fix selected findings" and "Fix all findings".
3. **Source context:** Increase changed-file context to 6,000 characters and the total source context budget to 160,000 characters; increase base/import source limits modestly and identify shortened files in coverage notes.
4. **Event handling:** Share event-action resolution across comment/review events. Parse exact repair commands on submitted events; resolve checkbox actions only on edits and only for newly checked controls. Resolve checked IDs internally, limit selected IDs to 25 unique findings with explicit rejection above the limit, and retain `repair one`/`repair all` as optional fallbacks only.
5. **Review state:** Paginate review history, select only serialized state matching the current PR-head SHA, and report retrieval/100-page-limit failures explicitly rather than treating incomplete history as an absent state.
6. **Testing:** Keep state, source-budget, truncation-message, checkbox-transition, submitted-command, selected-ID bound, and paginated-review-state regression tests in `__tests__/gemini-reviewer-context.test.ts`, where Vitest discovers them. Do not retain a standalone assertion file that Vitest treats as an empty suite.
7. **Verification:** Run `./jules-verify.sh` and all required PR CI checks; report actual outcomes and leave the PR open.
