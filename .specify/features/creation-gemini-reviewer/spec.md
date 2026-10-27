# Spec: Gemini Reviewer Reliability and Clickable Controls

## Overview
Improve the Gemini PR Reviewer action to guarantee accurate coverage reporting and provide native GitHub checkbox controls for finding-level repair selection while preserving existing targeted-repair fallbacks and safety guarantees.

## Requirements
1. **Coverage Reliability:** Track all failed batches (model timeouts, malformed JSON, truncated responses) in `coverageGaps`. Never claim a review is "Complete." if any required batch failed.
2. **Clickable Controls:** Inject GitHub Markdown checkboxes (`- [ ]`) beside individual findings and for the two actions "Fix selected findings" and "Fix all findings". Since GitHub Markdown comments do not support custom executable buttons, the action checkboxes trigger the workflow when newly checked.
3. **State Management:** Generate 12-character SHA-256-derived finding IDs. Serialize finding details and the PR head SHA into a hidden HTML comment (`<!-- gemini-review-state: {...} -->`).
4. **Validation:** On an `edited` event, extract the state. Reject if the PR head SHA is stale. Compare `[x]` vs `[ ]` transitions to trigger actions exactly once.
5. **Fallback Commands:** Preserve the existing `@gemini repair all` and `@gemini repair one` commands as optional fallbacks. Do not add or advertise a `repair selected` command; the checkbox action identifies selected finding IDs internally.
6. **Safety:** Do not automatically edit files, commit, push, or merge. Preserve model fallback order, trust checks, and path exclusions.
