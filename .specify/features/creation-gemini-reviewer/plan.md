# Plan: Gemini Reviewer Reliability and Clickable Controls

1.  **Workflows:** Update `.github/workflows/gemini-reviewer.yml` to trigger on `issue_comment` (created, edited) and `pull_request_review` (submitted, edited).
2.  **State & UI:** In `.github/scripts/gemini-reviewer.cjs`, implement 12-character SHA-256-derived finding IDs and state serialization. Output clickable finding-selection checkboxes plus action checkboxes in `formatReviewSections`; avoid advertising a new text command.
3.  **Coverage:** Wrap `askModel` loop batches in `try/catch`. Push errors to `coverageGaps` and fix coverage logic to check `coverageGaps.length`.
4.  **Event Handling:** Parse `edited` events with a shared action parser to detect checkbox transitions. Read embedded review state, or locate the newest current-head review for legacy text-command fallback, validate the SHA, and extract selected finding IDs.
5.  **Testing:** Add regression tests in `__tests__/gemini-reviewer-context.test.ts` for ID generation, state extraction, finding selection, one-shot action transitions, and fix-all behavior; update existing UI/workflow assertions.
6.  **Verification:** Run `./jules-verify.sh`.
