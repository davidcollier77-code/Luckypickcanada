# Spec: Gemini Full-Review Accuracy and Compact Review Context

## Objective
Improve Gemini's ability to find important defects by adding an independent adversarial review pass to every changed-patch batch, protecting against stale review publication, and making the bottom review-context report concise and evidence-based.

## Requirements
1. **Independent second pass**
   - Every primary review batch receives a separate adversarial review using the same changed patch and relevant source context.
   - The second pass independently searches for missed defects instead of validating the first pass.
   - It explicitly considers failure-path rollback, async refresh/state overwrites, untrusted input validation, fallback identity collisions, duplicate/idempotent operations, cache consistency, and test gaps only when applicable to the changed code.
   - It uses the existing Gemini model fallback/retry path and current confidence threshold.
2. **Honest coverage reporting**
   - If either review pass fails for a batch, the final verdict cannot be green.
   - Model failures, incomplete source, truncated patches, document-selection fallback, and relevant document-load failures are disclosed accurately.
   - Findings are scoped to the batch actually supplied to the model and duplicates are discouraged.
3. **Fresh-head check**
   - Re-fetch the current PR metadata immediately before publishing the review.
   - Do not publish findings if the PR head changed during analysis; ask for a fresh full review.
4. **Compact context footer**
   - Replace the verbose task-group/document inventory with a Review context section.
   - Show selected task group(s) and brief reasons.
   - List only local snapshots explicitly assessed as materially useful, with their contribution.
   - If none were confirmed useful, say so.
   - Aggregate genuine selection, loading, and truncation limitations without listing every irrelevant document.
5. **Regression coverage**
   - Unit tests cover the adversarial prompt patterns, batch scope, concise footer, and fresh-head guard.
   - The known Q findings from PR #1634 are used as patterns, not hard-coded defects; current source must still support any finding.

## Scope exclusions
- Do not change Lucky Story, Lucky Map, reaction, API, database, or other application behavior.
- Do not change model names, secrets, repository permissions, automatic-writing behavior, or merge behavior.
- Do not weaken the confidence threshold or turn review findings into automatic code changes.

## Success criteria
- An explicit @gemini full review uses document selection and includes primary plus independent adversarial review for every available patch batch.
- A failure of either pass or stale PR head is never presented as a complete green review.
- Findings from different passes are restricted to changed files in the batch under review.
- The footer is concise and only names documents confirmed materially useful.
- New deterministic tests protect the review prompt and reporting behavior.

## Post-merge runtime regression guard

- The checked-in reviewer entry point MUST parse successfully under the workflow's Node runtime before any event is processed.
- The document-context footer MUST render valid task-group and relevant-document summaries without malformed expressions or duplicated fragments.
- The published top-level review body MUST include the serialized current-head finding state needed by opt-in targeted repair controls.
- The independent adversarial pass MUST be attempted for every patch batch, even when the primary pass returns no findings or fails. Failures of either pass MUST be disclosed as coverage gaps.
- Regression tests MUST assert parser validity, serialized review-state publication, and explicit adversarial-pass failure reporting.
