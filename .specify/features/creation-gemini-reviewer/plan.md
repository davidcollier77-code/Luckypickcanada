# Plan: Gemini Reviewer Reliability and Clickable Controls

1.  **Workflows:** Update `.github/workflows/gemini-reviewer.yml` to trigger on `issue_comment` (created, edited) and `pull_request_review` (submitted, edited).
2.  **State & UI:** In `.github/scripts/gemini-reviewer.cjs`, implement `generateFindingId()` and state serialization. Output interactive checkboxes in `formatReviewSections`.
3.  **Coverage:** Wrap `askModel` loop batches in `try/catch`. Push errors to `coverageGaps` and fix coverage logic to check `coverageGaps.length`.
4.  **Event Handling:** Parse `edited` events to detect checkbox transitions. Read the hidden state, validate the SHA, and extract selected finding IDs. Map IDs back to original finding details.
5.  **Testing:** Add regression tests in a new `.github/scripts/gemini-reviewer.test.cjs` file to cover state extraction, transition detection, and command parsing.
6.  **Verification:** Run `./jules-verify.sh`.
