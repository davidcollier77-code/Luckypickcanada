# Tasks: Gemini Reviewer Reliability and Clickable Controls

- [x] Create Spec Kit files.
- [x] Update `gemini-reviewer.yml` triggers.
- [x] Implement `coverageGaps` error tracking in `gemini-reviewer.cjs`.
- [x] Implement SHA-256-derived finding IDs, hidden state serialization, and checkbox UI.
- [x] Implement `edited` event parsing, transition detection, and SHA validation.
- [x] Use selected finding IDs internally from the checkbox action; no new `repair selected` text command.
- [x] Write regression tests for parsing, state handling, finding selection, and checkbox action transitions.
- [ ] Run `./jules-verify.sh` and ensure tests pass (pending final PR-head CI verification).
