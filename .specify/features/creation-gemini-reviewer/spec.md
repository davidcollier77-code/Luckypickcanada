# Spec: Gemini Reviewer Reliability and Clickable Controls

## Overview
Improve the Gemini PR Reviewer action to guarantee accurate coverage reporting and provide native GitHub clickable controls for finding-level fixes, replacing manual commands while preserving fallback options and safety guarantees.

## Requirements
1. **Coverage Reliability:** Track all failed batches (model timeouts, malformed JSON, truncated responses) in `coverageGaps`. Never claim a review is "Complete." if any required batch failed.
2. **Clickable Controls:** Inject GitHub markdown checkboxes (`- [ ]`) into the review comment for "Fix all findings", "Apply fixes for selected findings", and individual finding selection.
3. **State Management:** Generate collision-resistant short IDs for findings. Serialize finding details and the PR head SHA into a hidden HTML comment (`<!-- gemini-review-state: {...} -->`).
4. **Validation:** On an `edited` event, extract the state. Reject if the PR head SHA is stale. Compare `[x]` vs `[ ]` transitions to trigger actions exactly once.
5. **Fallback Commands:** Preserve `@gemini repair all`, `@gemini repair one`, and add `@gemini repair selected <id1> <id2>`.
6. **Safety:** Do not automatically edit files, commit, push, or merge. Preserve model fallback order, trust checks, and path exclusions.
