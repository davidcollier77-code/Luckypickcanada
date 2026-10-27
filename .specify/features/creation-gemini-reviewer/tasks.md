# Tasks: Gemini Reviewer Reliability and Clickable Controls

- [x] Create Spec Kit files.
- [x] Update `gemini-reviewer.yml` triggers for editable checkbox actions.
- [x] Implement `coverageGaps` tracking for failed model batches.
- [x] Implement SHA-256-derived finding IDs, hidden review state, and checkbox UI.
- [x] Implement shared edited-event action parsing and PR-head SHA validation.
- [x] Resolve selected findings internally; keep only `repair all` and `repair one` as text fallbacks.
- [x] Add regression tests for state serialization, finding selection, and checkbox transitions in the Vitest suite.
- [ ] Run `./jules-verify.sh` and confirm all required checks pass.
