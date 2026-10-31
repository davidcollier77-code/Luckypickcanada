# Implementation Plan: Gemini Reviewer Quality, Coverage, and Selected-Finding Workflow

## Approach
Keep the existing reviewer architecture, model chain, provider call, workflow integration, trusted-base checkout, and publication path. Improve the reviewer's judgement inputs, its coverage accounting, how findings are normalized and presented, and how a selected finding is validated and tracked.

## Baseline (verified before editing)
- `.github/scripts/gemini-reviewer.cjs` and `.github/scripts/gemini-autofix.cjs` hold the reviewer and suggestion logic; `.gemini/rules/luckypickcanada.md` is the reviewer skill; `.github/workflows/gemini-reviewer.yml` pins the three model identifiers.
- The reviewer retrieved full source for at most 22 changed text files with a 6,000-character ceiling per file and reported only aggregate counts.
- Findings were rendered in one list with a hard-coded 🔴 marker; coverage warnings lived under "Needs checking".
- A selected finding went straight to suggestion generation with no verification pass and no per-finding outcome.
- `parseJson` accepted only exact JSON after one fence strip; network and timeout failures were not retried.

## Work sequence
1. Add calibration guidance to the reviewer skill and prompts: four-part defect evidence, severity rubric, verified-semantics rules (shell builtins, test-only `eval`, CLI flags), mirrored path-enumeration check, and log-message criteria.
2. Add category classification, severity ordering, and root-cause deduplication in the reviewer.
3. Render the three categories, per-finding checkboxes, selection controls, bounded prompt blocks, and a separate informational coverage section.
4. Add selection commands plus review-body rewrite so Select All / Clear Selection are functional, and derive ids from the current-head review for `@gemini fix selected`.
5. Add independent finding validation, deterministic pre-checks (path, eligibility, added line, duplicates), and fixed/rejected/unresolved outcome reporting in the autofix module.
6. Make source retrieval budget-aware with complete/clipped/patch-only coverage accounting and named disclosures.
7. Add structured-output recovery and transient-failure retry classification without touching the model order, provider, or credentials.
8. Add focused regression tests, update the workflow test's mode-list assertion, and verify with the repository gate.

## Risk controls
- No model, endpoint, credential, workflow-trigger, permission, or Amazon Q change.
- Suggestions remain opt-in native GitHub suggestions on eligible added lines; no edits, commits, pushes, or merges.
- Rejections and unresolved items are reported rather than silently dropped, and unselected findings are untouched.
- Review publication still re-checks the PR head SHA before posting.


## Review follow-up plan

1. Rebuild the outcome cell sanitizer as a complete helper: escape backslashes first, normalize line breaks, then escape Markdown pipes.
2. Restore extractReviewState as a declared function and serialize HTML-comment terminators as JSON Unicode escapes so JSON.parse restores the original text.
3. Remove unnecessary curly-single-quote normalization from both JSON recovery paths; apostrophes are valid JSON string content and must not be rewritten.
4. Make finding deduplication conservative: collapse exact normalized-title duplicates at the same path/line, not substring matches.
5. Add regression coverage for syntax, runtime state extraction, serialization round trips, Markdown escaping, Unicode preservation, retry classification, and distinct same-line findings.
