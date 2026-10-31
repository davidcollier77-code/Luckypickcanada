# Feature Specification: Gemini Reviewer Quality, Coverage, and Selected-Finding Workflow

## User problem
The automatic Gemini reviewer misses real defects that Amazon Q catches, reports no findings on PRs that contain genuine issues, inspects full source for only a fraction of changed files without naming the omissions, exposes a single undifferentiated finding list, and cannot show which selected findings were actually addressed.

Verified comparison case (PR #1656, 84 changed files, merged after review):

| Finding | Amazon Q | Gemini | Verified outcome |
| --- | --- | --- | --- |
| Stale duplicate fetch log in `scripts/refresh-docs.js` | Reported | Missed (zero findings) | Real; removed in `038b5cf9` |
| `.freebuff/` missing from `isEligiblePath` denylist in `.github/scripts/gemini-autofix.cjs` after the `.jules/` → `.freebuff/` migration | Reported | Missed (zero findings) | Real; denylist entry added in `038b5cf9` |
| `eval()` in `scripts/test-refresh-docs.js` | Reported as a concern | Missed | Present; test-only `eval` of the repository's own extracted source, so a robustness concern rather than an exploitable defect |
| `return 1 2>/dev/null || builtin exit 1` in `freebuff-verify.sh` | Reported as a concern | Missed | Not a defect; executed and sourced runs both exit non-zero (measured) |

Gemini's published review for that PR reported zero findings while marking its own coverage incomplete, with a truncated source record for only a few of the 84 files and a duplicated coverage sentence.

## Desired outcome
Improve Gemini's reviewer instructions and reviewer pipeline so it detects real defects at the right severity, states evidence and impact precisely, avoids weak or duplicate findings, discloses exactly which changed files lacked full-source review, and supports a working three-category selection-and-remediation workflow.

## In scope
- Finding categories: 🔴 red critical fixes (CRITICAL/HIGH), 🟡 yellow suggested fixes (MEDIUM), 🔵 additional recommendations (LOW), each with a per-finding checkbox.
- Functional Select All, Clear Selection, Fix selected, and Fix all controls, including text commands that rewrite the current-head review's selection state.
- Independent validation of every selected finding before remediation, with fixed / rejected / unresolved tracking and a stated reason for each outcome.
- Coverage disclosure naming changed files reviewed with complete source, clipped source, or patch only, plus the reason.
- Budget-aware source retrieval that shares the context budget across changed files instead of silently dropping later files.
- Structured-output recovery (fence, prose wrapper, trailing comma, truncated tail), retry classification for transient transport and parse failures, and bounded repair retries that preserve the configured model fallback order.
- Root-cause deduplication and severity-ordered rendering.
- Reviewer-skill calibration from the verified comparison above.
- Bounded review-body size that drops implementation prompts rather than findings.

## Out of scope
- Gemini model identifiers, fallback order, provider, endpoint, API-key handling, and existing retry/fallback behavior.
- Amazon Q configuration, workflow, rules, and review behavior.
- Application behavior, visuals, dependencies, deployment configuration, secrets, and repository governance files.
- Automatic code edits, commits, pushes, or merges.

## Acceptance criteria
1. Three categories are rendered separately, every actionable finding has a checkbox, and coverage warnings appear in a separate informational section with no checkbox.
2. Select All, Clear Selection, Fix selected, and Fix all controls change state or submit selection; unselected findings are never acted on.
3. Each selected finding ends as fixed, rejected, or unresolved with an explanation, and rejected findings state why the current code does not support them.
4. Coverage disclosure names the files that were not fully examined and why.
5. Malformed model output is recovered where possible and otherwise retried, then falls back through the unchanged model chain.
6. The configured model identifiers `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.5-flash-lite` and the existing provider integration remain unchanged.
7. Regression tests cover categories, selection state, validation/tracking, coverage disclosure, parsing recovery, retry classification, and the unchanged model configuration.
8. The pull request remains open and unmerged.
