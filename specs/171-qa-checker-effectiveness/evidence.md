# Evidence: QA Checker Effectiveness and Reliability

Recorded on branch `freebuff/qa-checker-effectiveness` based on `main` at
`4bfec5969d9872e01257f8591ff30292ce3c280a`.

## 1. Evaluation vehicle — Lucky Meter PR #1924, head `6eb2ae7e`

### 1.1 Check-run outcomes on that head

| Check | Conclusion | Note |
| --- | --- | --- |
| Visual QA | success | verification job: QA checker suites, full unit suite, TypeScript |
| Visual QA (shard 1/2) | success | Playwright shard |
| Visual QA (shard 2/2) | **failure** | 6 annotations; annotation detail was not retrievable through the connected tools |
| Verification Integrity | **cancelled** | the current-head audit never completed, so it is not evidence of a pass |
| PR Scope Verification | **failure** | the PR body has no `<!-- qa-scope:start -->` declaration, so `check_qa_pr_scope.extract_declaration` cannot compare scope with the diff |
| DevSkim scan and Security upload | success | |
| devskim / CodeQL | success | no new alerts |
| Protected File Authorization | success | |
| Validate OpenNext build artifacts | success | |
| Detect visual changes | success | correctly required browser QA for this rendering change |
| pullfrog | **failure** | provider quota (429) on two attempts |
| Graphite / AI Reviews | **skipped** | "AI code review did not run because this PR is too large" |
| Append new alerts and notify owner | skipped | not applicable |

### 1.2 External review findings, verified against the code

| Source | Finding | Disposition | Evidence |
| --- | --- | --- | --- |
| Amazon Q | `near` profile indentation | already fixed | `far:`/`near:` aligned at head; fixed in `f3bae2ff` |
| Amazon Q | unused `SCENE_PACK` | already fixed | no occurrence under `components/` or `app/` |
| Amazon Q | `samples - 1` NaN | already fixed | `Math.max(1, samples - 1)` at `cosmic-event-engine.js:724` |
| Amazon Q | stale light slots | not a defect | `beginMeshFrame` zero-fills both light arrays and `u_lightCount` gates the shader loop |
| Amazon Q | `UNSIGNED_SHORT` index overflow | not a defect | `segments` clamps to 12–480 (~12.5k vertices at the cap) |
| Amazon Q | `hexToRgb` in the hot loop | already fixed | trail colours are module constants (`cosmic-event-engine.js:122-127`) |
| Pullfrog | `geometry = null` after `dispose()` (×2) | not a defect | `geometry` is a construction-time input; the returned engine holds no reference |
| Pullfrog | add `subscribe`/`unsubscribe` to the light bus | not a defect | the bus is a pull model with no subscriber list |
| Pullfrog | `engineRef` nulled before `destroy()` | not a defect | deliberate ordering; `destroy()` is synchronous |
| Pullfrog | no `onRestored` handler (×2) | **confirmed defect** | neither engine passed `onRestored`; fixed in PR #1924 commit `2d487227` |

Totals: 18 inline comments → 6 unique Pullfrog findings + 6 Amazon Q findings,
of which 12 comments were byte-identical duplicates, 3 were already fixed,
4 were not defects, and 1 was a real defect.

## 2. Deterministic checker: detections and non-detections

Controlled fixtures (`__tests__`-independent Python fixtures in
`.github/scripts/test_review_pr_changes.py`):

| Defect class | Fixture | Result | Harmless counterpart | Result |
| --- | --- | --- | --- | --- |
| focused test | `it.only(...)` in `__tests__/*.test.js` | detected, `confirmed` | `list.only(1)` in app code, `describe.skip(...)` | not reported |
| floating promise | `items.forEach(async ...)` | detected, `confirmed` | `await Promise.all(items.map(async ...))` | not reported |
| swallowed error | `} catch { }` | detected, `potential` | `catch (e) { console.warn(e); }` | not reported |
| unused import | unused binding in a fully added file | detected, `confirmed` | JSX-used import, `React` default import, modified file | not reported |

Deduplication: the same defect supplied twice at the same path, line and rule now
produces 1 finding and `duplicates_collapsed: 1`. Before this change the key
included the excerpt, so the same defect with a different excerpt was reported
twice.

Real-diff run against the complete PR #1924 change set (105 file records):

```
records 105 reviewed 104 skipped 1 (binary)
elapsed_s 0.099
hard 0 warnings 2 dupes 0
warning potential type-or-lint-suppression components/LuckyMeterRing.jsx:101
warning potential type-or-lint-suppression components/LuckyMeterRing.jsx:112
```

The two warnings are the existing suppression rule on real
`eslint-disable-next-line` comments. The new rules produced **no** findings on
that diff; manual inspection of the added files confirms there is no same-line
empty catch, no `forEach(async ...)`, no focused test and no unused import, so
these are true negatives rather than misses. A multi-line `catch { /* comment */ }`
in `cosmic-event-engine.js` is intentional and outside the same-line rule.

## 3. Browser reliability

`__tests__/visual-qa-chromium-cache.test.js` executes the real cache check:

| Cache state | Output |
| --- | --- |
| executable `chromium-1234/chrome-linux/chrome` | `ready=true` |
| empty directory | `ready=false` |
| non-executable file with the browser path | `ready=false` |
| directory named `chrome` | `ready=false` |
| missing path | `ready=false` |

Workflow guard assertions confirm the install is gated on
`steps.playwright-browser.outputs.ready`, the system-dependency install still runs
for a usable cached browser, the version-keyed cache key and the two Playwright
shards are unchanged, and `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` is still set on both
dependency installs.

## 4. Classifier coverage

Executed classifier assertions now include performance-related paths
(`app/lib/gpu-particles.js`, `components/cosmic-event-engine.js`,
`scripts/measure-performance.mjs`, `tests/performance/*.spec.ts`) → 
`visual_required=true`, mixed performance + documentation → `true`, and ordinary
application code under `app/lib/` → `true` (fail closed). Existing documentation,
tooling, CI-only, agent-skill and Spec Kit cases still return
`visual_required=false`, and the empty/unclassifiable list still returns `true`.

## 5. Commands actually run

| Command | Result |
| --- | --- |
| `python3 -m unittest test_check_qa_pr_scope test_report_visual_qa_install_timings test_review_pr_changes test_summarize_devskim_findings test_verify_pr_verification_status` | 155 tests, OK |
| `pnpm exec vitest run` | 80 files, 793 tests, pass |
| `pnpm exec vitest run __tests__/visual-qa-chromium-cache.test.js` | 35 tests, pass |
| `pnpm exec tsc --noEmit` | exit 0 |
| `bash -n .github/scripts/verify-playwright-cache.sh` | OK |
| `python3 -m py_compile .github/scripts/review_pr_changes.py` | OK |
| `./freebuff-verify.sh` | exit 0 (Spec Kit gate, governance suites, type check, production build, docs tests) |
| Production build size (`.next` + `public`) | 340,039,798 bytes = 324.29 MiB, below the 495 MiB cap |

## 6. Refinement evidence — suggested fixes and targeted browser verification

| Check | Result |
| --- | --- |
| `PYTHONPATH=.github/scripts python3 -m unittest test_review_pr_changes` | 58 tests OK (13 added: suggestions, verification suggestions, classifier parity) |
| `pnpm exec vitest run __tests__/qa-review-comment.test.js` | 5 tests passed |
| Sample report render | findings show "Suggested fix" per rule; a docs-only change set prints "No Playwright verification is suggested" |
| Classifier parity | 12 path lists produce the same decision from the reviewer and `classify-visual-changes.sh`, including CI-only, API, `playwright.config.ts`, standalone Playwright configuration and unknown paths |
| Workflow YAML parse | `pr-scope-verification.yml` parses; permissions `contents: read`, `pull-requests: write`, `issues: read` |

Observed suggestion output for controlled defects:

- `it.only('runs alone', () => {});` → "Remove the focus so the whole suite runs: `it('runs alone', () => {});`"
- `items.forEach(async (item) => ...)` → "Await the work instead of dropping it: `for (const item of items) { await ... }`, or collect the promises and `await Promise.all(...)`."
- `} catch { }` → "`catch (error) { console.error(error); }`, or rethrow after cleanup."
- `document.execCommand('copy')` → "Replace `document.execCommand` with the Clipboard API (`await navigator.clipboard.writeText(text)`)."
- Unused `import { alpha }` → "Delete `import { alpha } from './math';` (line 1) or reference `alpha` in this file."

### Peer-review disposition (Graphite AI review of this PR)

| Claim | Verdict | Action |
| --- | --- | --- |
| `focused-test` matches the surrounding window, so one `.only` yields up to eleven findings | **Rejected — premise is wrong.** `_line_findings` receives the single added line as `text`; `nearby_text` is the window. | Pinned by two executed tests: one `.only` produces one finding, two `.only` lines produce two. |
| An import line with no bindings stays in the reference body, so a module path can count as a use | **Accepted — real false negative.** | Every line beginning with `import` is excluded from the reference search; regression test uses `import './alpha-legacy'` beside an unused `alpha`. |
| Collapsing by `(path, line, rule)` discards the second unused binding on one import line | **Accepted — real dropped finding.** | Key now includes the finding message; `import { alpha, beta }` reports two findings and zero duplicates. |

### Executed proof of the published comment

Fixture diff: focused test, floating `forEach` promise, empty catch, deprecated API,
insecure URL, provider token, HTML sink, added dependency and an unused import.
The real renderer produced a 3,988-byte body with 9 findings; every finding block
contains `What happened`, `Evidence` and a non-empty `Suggested fix`:

```
<!-- qa-review-report -->

## Changed-code review: FAIL
...
- **warning · confirmed · focused-test** `__tests__/lucky-meter.test.js:1` (confidence: high)
  - What happened: A focused test was committed, so every other test in this file is silently skipped.
  - Evidence: `it.only('renders the medallion', () => {});`
  - Suggested fix: Remove the focus so the whole suite runs: `it('renders the medallion', () => {});`
- **hard · confirmed · aws-access-key** `app/config.js:1` (confidence: high)
  - What happened: A provider token pattern was added to the repository.
  - Evidence: `[redacted provider token]`
  - Suggested fix: Revoke and rotate the token, remove it from the diff, and read the replacement from the environment or a secret store.
```

The workflow's publish step was extracted from `pr-scope-verification.yml` and
executed with a stub `gh` against that body:

| Scenario | API calls captured | Posted body |
| --- | --- | --- |
| First run, no existing comment | `POST repos/o/r/issues/1925/comments` | byte-identical to the rendered comment |
| Later run, existing id 77 | `PATCH repos/o/r/issues/comments/77` | byte-identical to the rendered comment |
| Body without the sticky marker | none (warns and exits 0) | not published |
| Body over 60,000 bytes | none (warns and exits 0) | refused, never truncated mid-fix |

That execution caught a real defect the tests previously only asserted: the POST
URL had been mangled to `issues/comments/<pr>/comments`, which would have failed
the first publish. The URL is fixed and `__tests__/qa-review-comment.test.js` now
executes the whole chain (fixture diff → Python renderer → workflow step) and
asserts both the create and update paths.

Truncation is now block-safe: `render_comment` admits whole finding blocks while
they fit and replaces the remainder with an omission count that points at the job
summary, so a fix can never be cut in half. A 400-finding report rendered inside
an 8,000-byte cap with every admitted block complete and `N more finding(s)
omitted` recorded.

### Executed gating matrix

Classifier output (executed) and the jobs/steps it controls (taken from
`visual-qa.yml`): the `verify` job has no job-level `if`, so QA checker tests,
the unit suite and the TypeScript check run for every change set, while the
`visual` job, its Chromium install and the baseline check carry
`if: needs.changes.outputs.visual_required == 'true'`.

| Change set | Classifier | Non-browser verification | Browser shards + Chromium install |
| --- | --- | --- | --- |
| Visual (`components/...-engine.js`) | `visual_required=true` | runs | runs |
| Performance (`components/cosmic-event-engine.js`) | `visual_required=true` | runs | runs |
| Ordinary application code (`app/lib/credit-format.js`) | `visual_required=true` (fail closed) | runs | runs |
| Documentation (`docs/qa-checkers.md`) | `visual_required=false` | runs | skipped |
| Tooling / CI (`.github/workflows/visual-qa.yml`, `.freebuff/ci.md`) | `visual_required=false` | runs | skipped |
| Ambiguous (`data/unknown-blob.bin`) | `visual_required=true` (fail closed) | runs | runs |

Scripts under `scripts/` stay fail-closed on purpose: a performance or capture
script is not positively non-rendering, and exempting the directory broke the
repository's existing performance-path expectations, so the exemption was
reverted rather than weakening coverage.

## 7. Limitations

- Playwright visual regression was not executed here: this runner has no GPU and
  no browser install. The committed baselines and both shards are unchanged, and
  the cache change only adds a fallback when the restored browser is unusable.
- The new rules are line-oriented: a multi-line empty catch or a multi-line
  import statement can be missed, and by design neither is guessed.
- External reviewer behaviour (Amazon Q, Graphite, Pullfrog) is unchanged and
  stays advisory; Graphite's size limit and Pullfrog's quota are outside the
  repository's control.
- The 6 Visual QA annotations on PR #1924 shard 2/2 were not retrievable through
  the connected tools, so the specific failing assertions remain unverified.
