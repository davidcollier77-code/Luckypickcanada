# Spec: Gemini Reviewer Reliability and Clickable Controls

## Overview
Improve the Gemini PR Reviewer to report coverage honestly, provide checkbox-driven repair controls, and use relevant source context efficiently while preserving safety guarantees.

## Requirements
1. **Coverage reliability:** Track failed model batches, unavailable files, and clipped source in coverage gaps. Never imply full coverage when source was omitted.
2. **Source context:** Increase bounded full-source context to 6,000 characters per changed file and 160,000 total characters; modestly expand base and local-import context. Preserve patch caps and report which supporting files were shortened.
3. **Clickable controls:** Show checkboxes beside findings and action checkboxes for "Fix selected findings" and "Fix all findings". GitHub Markdown comments do not support custom executable buttons, so newly checked action checkboxes trigger the workflow.
4. **State management:** Use 12-character SHA-256-derived finding IDs and serialize findings with the PR head SHA in a hidden review comment marker.
5. **Validation:** Parse exact supported commands on submitted events; on edited review/comment events, trigger checkbox actions only when an action changes from unchecked to checked. Reject stale PR-head state, map selected finding IDs internally, and fail closed with a clear message when more than 25 unique findings are selected.
8. **Review-state lookup:** Paginate review history to find a valid serialized state for the current PR head. If GitHub retrieval fails or the explicit 100-page safety limit is reached, do not claim the state is missing or generate suggestions; report the lookup failure clearly.
6. **Fallback commands:** Preserve `@gemini repair all` and `@gemini repair one` as optional fallbacks. Do not introduce or advertise a `repair selected` text command.
7. **Safety:** Only request eligible native one-line suggestions. Do not automatically edit files, commit, push, or merge. Preserve model fallback order, trusted event checks, path exclusions, and base-branch workflow execution.
