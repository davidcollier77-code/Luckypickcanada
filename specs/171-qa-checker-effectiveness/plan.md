# Implementation Plan: QA Checker Effectiveness and Reliability

**Feature**: specs/171-qa-checker-effectiveness

**Base**: main at 4bfec5969d9872e01257f8591ff30292ce3c280a

**Status**: Implemented

## Evidence that drove the plan

Evaluated on the Lucky Meter review cycle of PR #1924 (head `6eb2ae7e`):

| Reviewer | Result on that head |
| --- | --- |
| Amazon Q | 6 inline findings: 3 already fixed in an earlier commit, 1 self-contradicting (its own arithmetic proved the code safe), 1 latent-only with no impact, 1 valid performance finding already fixed |
| Pullfrog | 6 unique one-line findings, posted twice (12 of 18 comments byte-identical); 4 of the 6 unique findings were not defects; the check run failed twice on provider quota |
| Graphite | Check run SKIPPED: "AI code review did not run because this PR is too large" — no feedback at all |
| Verification Integrity | Check run CANCELLED, so the current-head audit never completed |
| PR Scope Verification | FAILURE: the pull request body has no QA scope declaration, so the checker could not compare scope with the diff |
| Visual QA | shard 1 passed, shard 2 failed with 6 annotations |

None of the four defect classes now added was detected by any repository checker.

## Design

### 1. Changed-code reviewer (`.github/scripts/review_pr_changes.py`)

- Add a `classification` field (`confirmed` / `potential`) to every finding. Hard
  rules keep `confirmed`; advisory rules default to `potential`; the new pattern
  rules state their classification explicitly.
- Collapse findings by `(path, line, rule)` instead of including the excerpt.
  Different excerpts for one defect at one location are one finding, and the
  count is reported as `duplicates_collapsed` and `confirmed_count`.
- Add four rules, each chosen for a high signal-to-noise ratio from added lines:
  - `focused-test`: a runner call with `.only` in a test path.
  - `await-in-for-each`: `forEach(async ...)`, whose promises cannot be awaited.
  - `empty-catch-block`: `catch {}` / `catch (e) {}` with no handling.
  - `unused-import`: an import binding referenced nowhere else, restricted to
    fully added files where GitHub supplies every line.
- Render the classification and the duplicate count in the Markdown report.

### 2. Playwright cache validation (`.github/scripts/verify-playwright-cache.sh`, `.github/workflows/visual-qa.yml`)

- Add a read-only script that prints `ready=true` only when the cache contains an
  executable `chrome` or `headless_shell` within one browser revision directory.
- Insert a validation step after the version-keyed cache restore and gate the
  Chromium install on `ready != 'true'` instead of `cache-hit != 'true'`.
- Keep the system-dependency install for a usable cached browser, keep the full
  two-shard Playwright run, and keep `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` on both
  dependency installs.

### 3. Classifier coverage (`__tests__/visual-qa-chromium-cache.test.js`)

- Execute the real classifier against performance-related paths (effect engines,
  performance scripts, performance specs) and ambiguous application code, and
  assert the fail-closed result. No classifier rule changes: the existing
  behaviour was already correct, so the plan is to lock it down with tests.

## Preserved behaviour

- Hard findings still fail the review; advisory findings stay advisory.
- Every existing rule, suppression, redaction and confidence value is unchanged.
- No external reviewer configuration, integration or token is touched.
- Visual QA keeps both shards, all committed baselines, three Playwright
  projects and the same cache key. The change only adds a fallback when the
  restored cache has no usable browser.
- The classifier keeps its exact non-rendering allowlist; no path was removed.

## Risks and mitigations

- **False positives from the new rules.** Each rule is restricted to the pattern
  that is provably wrong (`forEach(async`, same-line empty catch, runner `.only`,
  unreferenced binding in a fully added file), and each has a harmless
  counterpart test. `map(async ...)` is deliberately excluded.
- **A stricter cache gate downloading a browser on every run.** The check runs on
  the restored cache; a warm cache with a normal Playwright install reports
  `ready=true` and keeps the fast path.
- **Rule drift.** The workflow guard tests and the Python fixtures pin the
  behaviour, including the conditions that gate the install.

## Verification plan

- `python3 -m unittest` for every QA checker suite (155 tests).
- `pnpm exec vitest run` for the full unit suite and the workflow/classifier guard.
- `pnpm exec tsc --noEmit`.
- `bash -n` on the new script.
- `./freebuff-verify.sh`, which installs from the lockfile, runs the Spec Kit gate,
  the governance and verification-integrity suites, the type check and the build.
- Production build size measured against the 495 MiB cap.
