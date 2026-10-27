# Tasks: Gemini Reviewer Reliability and Clickable Controls

- [x] Create Spec Kit feature artifacts.
- [x] Update reviewer workflow event triggers.
- [x] Track batch and source-context coverage gaps.
- [x] Add SHA-256-derived finding IDs and serialized current-head review state.
- [x] Add selected-finding and fix-all checkbox actions with one-shot transition detection.
- [x] Keep `repair all` and `repair one` as fallbacks without a `repair selected` text command.
- [x] Expand source context bounds and make truncation notes identify shortened files.
- [x] Add Vitest regression tests for finding selection, action transitions, state serialization, and context limits.
- [x] Add submitted-review command routing regression coverage.
- [x] Paginate review-state lookup and fail closed with clear messaging if history cannot be fully read.
- [x] Bound selected finding IDs at 25 unique entries and reject oversized selections without truncating.
- [x] Add tests for multi-page/current-head state lookup, stale or missing state, and explicit pagination-limit failure.
- [ ] Complete final-head `./jules-verify.sh` and required CI checks.
