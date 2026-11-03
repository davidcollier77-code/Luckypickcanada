# Updater Scheduler: required GitHub `User-Agent` header and sanitized dispatch diagnostics

## Task and task groups

**Task groups: `troubleshooting` + `testing`.** `troubleshooting` because the change starts from one
reported production defect — the Cloudflare updater scheduler receiving HTTP 403 from GitHub for both
updater workflows — and had to establish the cause before choosing a fix. `testing` because the
deliverable's core requirement is a regression test that pins the new header and proves the diagnostic
output stays sanitized.

**Assigned task:** add `User-Agent: luckypickcanada-updater-scheduler` to the Cloudflare updater
scheduler's GitHub dispatch request, preserve the out-of-band diagnostic logging (`githubStatus`,
`githubBody`, `githubHeaders`, sanitized body, selected response headers), add a test for the header,
and document the requirement — repository source only, no deployment.

## Cause (established, not assumed)

- The Worker sent `Accept`, `Authorization`, `Content-Type` and `X-GitHub-Api-Version` and **no
  `User-Agent`** (`workers/updater-scheduler/src/index.mjs`). Cloudflare Workers `fetch` adds no default
  `User-Agent`.
- GitHub rejects REST requests without one: `403 Request forbidden by administrative rules. Please make
  sure your request has a User-Agent header…`. Reproduced in this workspace against the real
  `/actions/workflows/refresh-docs.yml/dispatches` endpoint with the header suppressed — plain-text body,
  no `x-ratelimit-*` headers, distinct from the JSON bodies GitHub returns for a permission failure
  (`Resource not accessible by personal access token`) or a rate limit.
- Proxy evidence that no Cloudflare dispatch ever reached GitHub: across the full 6 Oct–3 Nov history of
  both workflows (37 and 69 runs), every run is titled `… — schedule` or `… — manual`; zero are
  `— cloudflare`, although both workflows render `dispatch_source` in `run-name`.
- Both updaters were healthy throughout via the native GitHub schedules (3 Nov: spec-kit run #37 →
  commit `b007e8cb`, PR #1693; docs run #69 → commit `6c94bfb5`, PR #1695), and the repository's
  dispatch credential succeeded five times, most recently the canary in deploy run `41229221334`
  (31 Oct 18:23Z). That rules out a missing/expired token, absent `Actions: write`, wrong workflow
  path, or concurrency as the cause.

## Implementation

`workers/updater-scheduler/src/index.mjs`:

- `GITHUB_USER_AGENT = "luckypickcanada-updater-scheduler"` (exported) is now sent on every dispatch
  request. Nothing else about the request changed — same endpoint, `ref: "main"`, `dispatch_source` and
  `scheduler_slot` inputs, same `noRetry()` handling, same 200/204 success path.
- `GitHubDispatchError` carries `githubStatus`, `githubBody` and `githubHeaders` and keeps the existing
  message text `GitHub workflow dispatch failed with HTTP <status>`, so existing log searches and the
  previous `/HTTP 403/` expectation still hold.
- `sanitizeDiagnosticBody` redacts the configured token, `Bearer` values, `gh[pousr]_…` and
  `github_pat_…` strings, collapses the body to one line, and caps it at 500 characters with an explicit
  `…[truncated]` marker.
- `selectDiagnosticHeaders` records only `content-type`, `retry-after`, `x-github-request-id` and the
  three `x-ratelimit-*` headers; a `set-cookie` (or anything else) cannot reach the log.
- The existing `event: "workflow-dispatch"`, `outcome: "failed"` entry gains those three fields; a
  configuration error still logs only `error`. Successful responses are not read or logged beyond their
  status.

Agent Lee's revised implementation is **not** available in this repository or any local branch
(`git log --all -S'githubHeaders'` finds nothing), and the 3 Nov Cloudflare deployment
`9112ced69b34420fbfd69efdef7eee23` has no matching canary run, so it was made outside
`deploy-updater-scheduler.yml`. The diagnostic behaviour was therefore reproduced from the stated
requirements, in the reviewed source, as the single authoritative version.

## Files changed

- `workers/updater-scheduler/src/index.mjs` — header constant, `GitHubDispatchError`, body sanitizer,
  header allowlist, diagnostic logging.
- `workers/updater-scheduler/test/index.node-test.mjs` — exact `User-Agent` assertion; sanitized
  body/header diagnostics; token and `ghp_` redaction; cookies excluded; single-line 512-character
  bound; existing 403/200/204 behaviour retained.
- `workers/updater-scheduler/README.md` — "GitHub API requirements" and "Failure diagnostics" sections;
  security bullet updated to describe redacted diagnostics rather than "never a body".
- `specs/083-updater-scheduler-dispatch-user-agent/{spec,plan,tasks}.md` — new feature cycle (features
  035/036 cover reliability and cutover, not this defect; nothing duplicated).
- `.specify/feature.json` — points at the new feature.

Not changed: any workflow, cron schedule, token, secret, environment variable, Cloudflare binding or
`.docs/` file. The deploy workflow still ships code and secret together after its canary.

## Spec Kit stages and artifacts

Specify → Plan → Tasks → Implement, in order, in
`specs/083-updater-scheduler-dispatch-user-agent/`: `spec.md` (cause, stories, requirements),
`plan.md` (design, rejected alternatives, risks), `tasks.md` (completion state).

## Library documents reviewed

| Document | USED | USEFUL | Explanation |
| --- | --- | --- | --- |
| `.docs/manifest.json` | YES | YES | Routed `troubleshooting` and `testing` to the GitHub/Cloudflare references. |
| `.docs/troubleshooting/_github_docs.md` | YES | NO | 188-line index of GitHub's docs; no dispatch or `User-Agent` content, so the behaviour was proved against the live API instead. |
| `.docs/deep-dive/_cloudflare_workers-sdk.md` | NO | NO | Indexes the Wrangler SDK, not Workers runtime `fetch` header behaviour. |
| `.docs/troubleshooting/_cloudflare_cloudflare-docs_turnstile.md` | NO | NO | Turnstile-specific; unrelated to workflow dispatch. |
| `.docs/troubleshooting/_debian_debian-reference.md` | NO | NO | No Linux/package/process behaviour is involved. |
| `.docs/troubleshooting/_google_eng-practices.md`, `.docs/testing/_google_eng-practices.md` | NO | NO | Optional review guidance; the constraints were already fixed by the reproduced 403 and the existing suite conventions. |

No Context7 invocation (requires per-invocation owner approval) and no external MCP beyond the
connected GitHub integration used to publish this PR.

## Verification (commands actually run)

Environment: cloud Linux worktree, Node v26.13.0, `pnpm@10.30.3` installed to `$HOME/.local` (absent
from the image), dependencies restored with `pnpm install --frozen-lockfile` (lockfile unchanged).

| Check | Command | Result |
| --- | --- | --- |
| Focused Worker suite | `node --test workers/updater-scheduler/test/index.node-test.mjs` | **PASS** — 17 tests, 0 failures |
| Repository gate (Spec Kit artifacts, typecheck, production build, refresh-docs tests) | `./freebuff-verify.sh` | **PASS** — exit 0; all three artifacts verified; build compiled; refresh-docs 19/19 |
| Wrangler dry run (no deploy) | `pnpm exec wrangler deploy --dry-run --config workers/updater-scheduler/wrangler.toml` | **PASS** — exit 0, vars as configured |
| Build size | `du -sb .next public` | **PASS** — 332,572,886 bytes / 317.17 MiB (< 495 MiB) |
| Final diff audit | `git status --porcelain`, `git diff` | **PASS** — exactly the files listed above |

## Outstanding and pending checks (not passed, not claimed)

- **PENDING — this PR's `Verify updater scheduler` job** (`deploy-updater-scheduler.yml`, pull_request
  path): runs the Worker suite, the Spec Kit rebase test, the safe Spec Kit upgrade, `freebuff-verify.sh`,
  the 495 MiB gate and the Wrangler dry run on the PR head.
- **PENDING — live dispatch.** No deployment was made and no updater was triggered, per the task
  boundaries. Confirmation requires an owner-approved deployment and the next approved slot producing
  `Update Spec Kit — cloudflare` / `Refresh Documentation — cloudflare` runs with a 2xx
  `outcome: "accepted"` log entry.
- **BLOCKED — cloud-side evidence.** This workspace's Cloudflare access exposes DNS tools only, so the
  deployed Worker's code, bindings, secrets and logs cannot be read from here.
- **KNOWN documentation inconsistency (not changed here).** `memory-bank/activeContext.md` still states
  that repository variable `UPDATER_SCHEDULER_ACTIVE=true` is set, but the repository variables API
  returns only `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Native schedules therefore still run, which is the
  intended fallback; correcting that note is outside this task's scope.

## Behaviour preserved, risks, limitations

Preserved: slot mapping for all five Tuesday/Friday targets in both DST states, non-target silence,
`controller.noRetry()` before dispatch, disabled mode, request endpoint/ref/inputs, 200 and 204 handling,
error message text, both updaters' native schedules and manual dispatch, and the deploy workflow with its
canary-then-`--secrets-file` contract. No token, secret, environment variable, schedule or permission was
changed, and no credential value appears in the code, tests, docs or logs.

Risks and limits: if the live 403 turns out to be a credential or rate-limit rejection rather than the
missing header, the header alone will not restore dispatch — the new one-line diagnostics make that
distinguishable. The 500-character cap could truncate an unusually long GitHub explanation (the marker
makes it explicit). Live acceptance remains unverified until a deployment is approved and a real slot
runs.

## PR record

- **PR:** [#1696](https://github.com/davidcollier77-code/Luckypickcanada/pull/1696), branch
  `freebuff/78319e5dc4e17636cb62dc2a`, target `main`, left open and unmerged.
- **Implementation commit:** `55c3e479` — the head every local result above refers to.

## Merge status

Left **OPEN and UNMERGED** for owner review. No merge, no deployment, no updater triggered.

**USEFUL RESULT: NO** — implementation and local gates pass, but the PR-head CI job and the live
dispatch confirmation are PENDING, so verified completion is not claimed.
