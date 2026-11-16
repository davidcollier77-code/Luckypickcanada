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

## Refinement: actionable findings and targeted browser verification

- Each rule gains a `suggestion` produced at finding time: a deterministic
  rewrite where the correction follows from the matched line (focused test,
  `forEach(async ...)`, unused import binding), a named replacement for a
  deprecated API, and a reviewed static correction otherwise. The report renders
  it as "Suggested fix" under evidence, so the comment answers "what now?".
- `suggested_verification` classifies the changed paths once. Rendering paths
  (everything `classify-visual-changes.sh` does not positively exempt) suggest
  the Playwright suite; code paths whose names mark rendering or frame work
  additionally suggest the frame probe. Documentation, tooling, CI and
  unit-test-only changes are told that no browser verification is suggested.
- The classifier stays authoritative: the reviewer mirrors its exemptions and a
  parity test executes both against the same twelve path lists, so the advisory
  suggestion cannot drift from the required gate silently.
- The review report is posted once per pull request and updated in place using a
  sticky marker, with the same text as the job summary. The step is
  `continue-on-error` because the review step already decided pass/fail.

## Checker responsibility separation (follow-up design)

The owner's direction is that one changed-code reviewer must not accumulate every
responsibility. This section records the inventory as built, what belongs
elsewhere, and the order in which separate checkers should be added. Only the
general code-defect row is implemented in this PR.

### Inventory: what runs today

| Responsibility | Mechanism (inspected) | Trigger | Where a developer sees it |
| --- | --- | --- | --- |
| General code defects | `review_pr_changes.py`, 20 rule identifiers (7 hard, 13 advisory) | every pull request (`pull_request_target`) | one sticky PR comment, updated in place |
| Regression / type safety | Vitest suite and `tsc --noEmit` in the Visual QA `verify` job | every pull request | check conclusion and annotations |
| Secrets, tokens, merge markers | reviewer hard rules (5 provider families, private-key block, conflict markers) | every pull request | sticky comment, fails the review |
| Security scanning | DevSkim (`push` main, `pull_request` main, weekly) → SARIF upload, reviewed-false-positive filter, `devskim-alerts.md`; CodeQL default setup | PR, push, schedule | Security tab, `devskim-alerts.md`, check |
| Dependency risk | `.github/dependabot.yml` (npm + github-actions, weekly); reviewer `dependency-addition` | schedule, PR | Dependabot alerts/PRs, sticky comment |
| Protected configuration | `protected-files.yml` (path-filtered), `agents_md_protection.py`, `check_qa_pr_scope.py` | only when those paths change | check with required owner approval |
| Visual / browser | `visual-qa.yml`: `changes` classifier → `verify` (no browser) + 2 gated Playwright shards, Chromium cache validation, 3 projects, committed baselines, `tests/visual/mobile-accessibility.spec.ts`, `security-headers.spec.ts` | `pull_request` on visual/ambiguous paths | shard checks and artifacts |
| Stale or skipped results | `verification-integrity.yml` audits check runs for the current head and reports skipped/unrun as NOT RUN | PR, edited, owner `/approve-` | check conclusion |
| Advisory AI review | `pullfrog.yml` (manual `workflow_dispatch` only), Graphite, Amazon Q | manual / app-driven | PR inline comments (advisory only) |

### Ownership of the requested categories

- **Code QA (general defects)** — this reviewer. Logic and condition errors, error
  handling, deprecated APIs, debug leftovers, unused imports, dependency
  additions. No security triage, no test-quality judgement, no performance
  measurement, no browser work.
- **Security** — DevSkim + CodeQL + Dependabot remain the scanners. The reviewer
  keeps only the hard secret/merge-marker rules that are provable from a patch
  and useful within seconds; injection, XSS and dependency CVEs stay with the
  scanners and `/.freebuff/security.md`.
- **Test quality** — belongs to a separate checker: assertion strength,
  tautological expectations, tests that assert nothing, un-restored mocks,
  missing edge cases. Today only `focused-test` lives here, because a committed
  `.only` is a provable defect rather than a judgement call.
- **Performance** — belongs to a measured budget inside the existing Playwright
  run for performance-sensitive paths, not to a static rule set. The reviewer
  only *suggests* the frame probe.
- **Visual / browser** — `visual-qa.yml` owns it, including responsive layout,
  interactions, accessibility assertions and baselines.
- **Scope, governance, reporting freshness** — the existing scope, protected-file
  and integrity workflows.

### Gaps, and what is already covered

- Covered: general defects, secrets, merge markers, dependency additions,
  visual regressions, stale-check detection, protected configuration.
- Gap: no assertion-quality analysis, so weak tests are found only by humans or
  advisory AI review.
- Gap: no measured performance budget in CI; timing assertions exist in
  `tests/visual/homepage.spec.ts` but nothing fails on a regression.
- Gap: DevSkim and CodeQL findings never reach the PR page as text; a developer
  must open the Security tab.
- Gap: a failing Playwright shard reports a check name and artifacts, not a
  short "what/where/how to fix" line on the PR.
- Manual by design: Lucky Meter thresholds and business rules, architecture,
  dependency upgrade strategy, secret rotation, accessibility judgement beyond
  the automated assertions, visual taste approval, AI-review triage.

### Prioritised implementation sequence (each step is its own small PR)

1. **P0 — general code defects only (this PR).** Add `assignment-in-condition`
   for the `if (x = y)` class, keep the reviewer free of every other
   responsibility. Accepted when the controlled fixtures pass and the report
   still renders one actionable fix per finding.
2. **P1 — test-quality checker.** New dependency-free script over changed test
   files only (`.test.*`, `__tests__/`, `tests/`), with its own sticky comment:
   a test body with no assertion, `expect(true)`/`toBeTruthy()` on a literal,
   `jest.mock`/`vi.mock` without `restoreAllMocks`, and a test whose only
   assertion is a snapshot without a name. Trigger on changed test files; keep
   `focused-test` where it is until the new checker demonstrably covers it.
3. **P2 — security summary on the PR page.** Reuse `summarize_devskim_findings.py`
   output in one comment (and the CodeQL SARIF summary) so findings are readable
   without the Security tab. No new scanner, no new dependency.
4. **P3 — performance budget.** Assert transfer size and a frame-time ceiling in
   the existing Playwright run, on performance-sensitive paths only, using the
   existing shards. Report the measured numbers in the shard summary.
5. **P4 — browser failure summary.** One comment per failing shard listing the
   failing test, its baseline name and the diff artifact link, updated in place.
6. **P5 — reporting hygiene.** One sticky comment per checker, `FAIL` versus
   `WARN` labels, and no new comment on re-run.

### Zero-cost guardrails

Every step uses the existing GitHub Actions minutes, the existing Playwright
install and committed baselines, and repository Python/Node tooling already in
the lockfile. No paid reviewer, metered API, credit card, new service or new
dependency is introduced; Pullfrog stays manual-dispatch and advisory.
