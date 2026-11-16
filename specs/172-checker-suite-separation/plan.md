# Feature 172 — Plan

## Design

- **One advisory module, four modes.** `checker_suite.py` owns the rendering and
  the rules; each mode is a separate job with its own marker, scope and comment.
  This keeps the checkers independent on the PR page without four copies of the
  same renderer, publisher and tests.
- **Trusted base only.** All jobs check out `main`; the changed-file and
  code-scanning data comes from the GitHub API. No PR code runs beside a token
  with write access.
- **Shared publisher.** `upsert_pr_comment.sh` finds the comment by its marker,
  PATCHes it when present and POSTs otherwise, and refuses an unmarked or
  oversized body so a fix is never cut in half.
- **Visual QA summary after the fact.** `visual-qa.yml` keeps running PR code
  with read-only permissions. A `workflow_run` job on the default branch reads
  the check runs for that head and publishes one summary, so a failed shard is
  readable without opening the workflow and a skipped shard is labelled NOT RUN.
- **Security without a new scanner.** The alerts job reads the code-scanning
  alerts DevSkim and CodeQL already produce. When the API is unavailable the
  comment says so and the job still succeeds.
- **Trigger economy.** Changed-file scope is decided by the scripts, which write
  no comment when nothing relevant changed; the heaviest job is a few seconds and
  no browser is installed by any new job.

## Rules and their harmless counterparts

| Rule | Fires on | Silent on |
| --- | --- | --- |
| `test-without-assertion` | a runner block with no assertion | a block with `expect(...)` |
| `tautological-assertion` | `expect(true).toBe(true)` | `expect(count).toBe(2)` |
| `unnamed-snapshot` | `toMatchSnapshot()` | `toMatchSnapshot('empty')` |
| `mock-without-restore` | `vi.mock(...)` with no restore | `vi.restoreAllMocks()` present |
| `interval-without-clear` | `setInterval(...)` with no clear | `clearInterval(id)` present |
| `listener-without-cleanup` | `addEventListener(...)` with no removal | `removeEventListener(...)` present |
| `animation-frame-without-cancel` | `requestAnimationFrame(...)` with no cancel | `cancelAnimationFrame(id)` present |

## Risks and mitigations

- **Noise from advisory rules.** Each rule needs its positive evidence (an
  assertion, a teardown) absent from the whole patch before it speaks, and every
  rule has a counterpart test.
- **False confidence from the browser summary.** A skipped shard is rendered as
  NOT RUN and only an explicit all-success set produces PASS.
- **Token misuse.** Every workflow is pinned to `pull_request_target` or
  `workflow_run`, checks out `main`, and grants no write scope beyond the comment
  it publishes; the hygiene test enforces this.
- **Comment spam.** One marker per check, update in place, `continue-on-error`
  on publication.

## Verification plan

- `test_checker_suite` (28 controlled fixtures) and the workflow hygiene suite.
- Full Vitest run, `tsc --noEmit`, `./freebuff-verify.sh`, build-size measurement.
- `bash -n` on the publisher.
