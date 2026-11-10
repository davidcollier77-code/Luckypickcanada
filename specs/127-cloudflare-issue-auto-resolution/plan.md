# Implementation Plan: Automatic Cloudflare Observability Issue Resolution

**Branch**: `feature/127-cloudflare-issue-auto-resolution` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/127-cloudflare-issue-auto-resolution/spec.md`

## Summary

Add a protected resolution operation to the already Wrangler-managed site Worker (`luckypickcanada-app`, deployed from `wrangler.jsonc`). It calls the Cloudflare Workers Observability issue API with the `CLOUDFLARE_API_TOKEN` Worker secret and reports success only when Cloudflare's response confirms `status: "resolved"`. A new post-deploy job in the existing `deploy-open-next.yml` workflow — which already gates on the fix's build and successful `wrangler deploy` — collects explicit `Cloudflare-Issue: <uuid>` references from the deployed commits and their pull requests and asks the Worker to resolve them. The existing scanner, webhook, GitHub issue creation, deduplication, notification policy, automations and scheduled workflows are not modified.

## Technical Context

**Language/Version**: TypeScript 5.x on Node 22 (Next.js 16.4.3 App Router), ESM.

**Primary Dependencies**: None added. `fetch`, `crypto.subtle` and `Response` are available in the Workers runtime; the workflow uses `git`, `curl`, `jq`, `gh` already present on GitHub-hosted runners.

**Storage**: No new storage. Nothing is persisted by this feature.

**Testing**: Vitest (`__tests__/cloudflare-observability-issues.test.ts`) for the route and resolution module; `node --test` (`.github/scripts/test-cloudflare-issue-references.node-test.mjs`) for the reference collection; `pnpm tsc --noEmit`, `./freebuff-verify.sh`.

**Target Platform**: Cloudflare Workers via OpenNext (`nodejs_compat`), GitHub Actions.

**Project Type**: Web application plus GitHub automation.

**Performance Goals**: One Cloudflare PATCH request per referenced issue, bounded to ten per request; the post-deploy job adds a few seconds after deploy.

**Constraints**: 495 MiB production build cap; no credential values in the repository, logs or responses; the resolution operation must never become an unauthenticated status-changing endpoint.

**Scale/Scope**: One site Worker, at most ten issues per deployment, one new API route, one post-deploy job step group, two scripts/tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|---|---|
| I. Single source of truth | PASS — `AGENTS.md` and the task request govern; this feature adds no competing governance. |
| II. Verify before acting | PASS — the deployed Worker, existing workflow, protected-file list and Cloudflare API contract were inspected before planning. |
| III. Implementation sequence | PASS — Specify → Plan → Tasks → Implement executed in order with artifacts under one feature directory. |
| IV. Protect core systems | PASS — the Cloudflare/secret change is explicitly requested by the task (Worker secret use and post-deploy resolution); nothing else in the protected set changes. |
| V. Resource conservation | PASS — no `.docs/` change, no new dependency, no documentation-site expansion. |

Post-design re-check: PASS. The Cloudflare deployment surface changes only by the requested post-deploy resolution job, and `wrangler.jsonc` is intentionally untouched so Worker secrets stay outside the repository.

## Project Structure

### Documentation (this feature)

```text
specs/127-cloudflare-issue-auto-resolution/
├── spec.md
├── plan.md
├── tasks.md
├── quickstart.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
app/lib/cloudflare-observability-issues.ts        # resolution module + validation + redaction
app/api/cloudflare-issues/resolve/route.ts        # protected POST route on the deployed Worker
__tests__/cloudflare-observability-issues.test.ts # route/module behaviour
.github/scripts/cloudflare-issue-references.mjs   # deployed-fix reference collection (CLI + exports)
.github/scripts/test-cloudflare-issue-references.node-test.mjs
.github/workflows/deploy-open-next.yml            # new post-deploy resolution job
.specify/feature.json                             # points at this feature
memory-bank/activeContext.md                      # current task state
```

**Structure Decision**: The resolution code lives beside existing `app/lib` helpers and `app/api` route handlers so it ships in the same OpenNext bundle and shares the deployed Worker's secret store. The reference collector is a standalone script because the post-deploy job runs it with `node` outside the application bundle.

## Phase 0: Research

No blocking unknowns remained after inspecting the repository and the published Cloudflare API reference. Recorded decisions:

1. **Which deployed Worker holds the credential** — the site Worker, because it is the Wrangler-managed Worker in this repository (`wrangler.jsonc`) and the one the deploy workflow publishes. The `workers-issues-to-github` bridge that creates the GitHub issues is deployed outside this repository; rewriting it here would risk the existing scanner/webhook/dedup behaviour the request requires preserving.
2. **Cloudflare status update contract** — `PATCH /accounts/{account_id}/workers/observability/issues/{issueId}` with `{"status":"resolved"}` returns the issue in `result`; the caller must require `success: true` and `result.status === "resolved"` before claiming resolution.
3. **How a deployment names its issue** — an explicit `Cloudflare-Issue: <uuid>` trailer in the deployed commit message or pull request body. Deriving the identifier from an unknown third-party issue body format was rejected as unverifiable guesswork.
4. **Where the trigger belongs** — the existing `deploy-open-next.yml` workflow, because it already runs the fix's required checks and the production `wrangler deploy`; a separate workflow would not know that the specific fix deployed.

## Phase 1: Design

### Resolution flow

1. Push to `main` → the existing `deploy` job builds, validates and deploys the Worker.
2. The new `resolve-observability-issues` job runs only after `deploy` succeeds.
3. It collects `Cloudflare-Issue:` references from the commits in `github.event.before..github.sha` and the bodies of the pull requests those commits came from; none found → notice and stop.
4. It POSTs `{"issueIds":[…]}` to `/api/cloudflare-issues/resolve` with the caller credential, retrying a bounded number of times while the new deployment propagates.
5. The route validates the credential and identifiers, PATCHes each issue with `CLOUDFLARE_API_TOKEN`, and returns `200 {resolved:true}` only when every issue is confirmed `resolved`; otherwise `502 {resolved:false, results:[…]}` with redacted reasons.
6. Non-200 outcomes fail the job; a final `if: failure()` step records that the issue remains unresolved in the run summary and as an error annotation.

### Failure and security decisions

- Missing `CLOUDFLARE_ISSUE_RESOLVE_TOKEN` or `CLOUDFLARE_API_TOKEN` closes the route with HTTP 503 instead of failing open.
- The caller credential is compared through SHA-256 digests with a full-length, non-short-circuiting comparison.
- Redaction strips the API token, bearer-shaped strings and GitHub token shapes before any reason is returned or logged.
- A partial batch is a failure: the response and the job never present it as resolved.
- No pull request runs the resolution job (`if: github.ref == 'refs/heads/main'`).

### Preserved behaviour

`.github/workflows/deploy-open-next.yml` keeps its `cloudflare-deploy` concurrency guard, bounded rate-limit retry and all existing verification steps verbatim; the new job is appended. `wrangler.jsonc`, the Workers Observability scanner/automation/policy, the `workers-issues-to-github` bridge and every scheduled workflow are unchanged.
