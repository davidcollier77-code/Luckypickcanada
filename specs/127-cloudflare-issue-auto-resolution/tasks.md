# Tasks: Automatic Cloudflare Observability Issue Resolution

**Input**: Design documents from `/specs/127-cloudflare-issue-auto-resolution/`

**Prerequisites**: plan.md, spec.md

**Tests**: Included — the request requires the fix to pass the required tests before resolution, and the resolution and collection logic must be proven locally.

**Organization**: Tasks are grouped by user story so each story can be verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Web application plus GitHub automation at the repository root.

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 [P] Add the Cloudflare Observability resolution module with issue-id validation, status confirmation and credential redaction in `app/lib/cloudflare-observability-issues.ts`
- [X] T002 [P] Add the tested deployed-fix reference collector in `.github/scripts/cloudflare-issue-references.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T003 Add the protected resolution route in `app/api/cloudflare-issues/resolve/route.ts`, closed with HTTP 503 when either Worker secret is missing and HTTP 401 without a valid caller credential

**Checkpoint**: The route and collector exist before the workflow or behaviour tests can use them.

---

## Phase 3: User Story 1 - A fixed issue is resolved after the fix deploys (Priority: P1)

**Goal**: A successful production deployment of a fix resolves the referenced Cloudflare issue.

**Independent Test**: Provide a confirmed Cloudflare response to the route and confirm HTTP 200 with `resolved: true` and the expected PATCH; provide commits carrying `Cloudflare-Issue:` and confirm the collector returns that identifier.

### Tests for User Story 1

- [X] T004 [P] [US1] Cover confirmed resolution, outbound PATCH shape and result payload in `__tests__/cloudflare-observability-issues.test.ts`
- [X] T005 [P] [US1] Cover trailer extraction, merge/squash pull-request discovery, de-duplication, the ten-issue cap and the CLI round trip in `.github/scripts/test-cloudflare-issue-references.node-test.mjs`

### Implementation for User Story 1

- [X] T006 [US1] Collect references from the deployed commits and their pull requests, and call the Worker resolver with a bounded retry, in the appended `resolve-observability-issues` job in `.github/workflows/deploy-open-next.yml`
- [X] T007 [US1] Restrict the new job to `github.ref == 'refs/heads/main'` after `needs: deploy` so pull requests never resolve anything

**Checkpoint**: User Story 1 is independently verifiable from the route tests and the collector tests; the workflow wiring is reviewable in the diff.

---

## Phase 4: User Story 2 - Only confirmed resolutions are claimed (Priority: P2)

**Goal**: Any refusal, unconfirmed status, partial batch or transport failure leaves the issue unresolved and is reported.

**Independent Test**: Return a non-resolved status, an HTTP error, a thrown transport error and a mixed batch, and confirm each produces HTTP 502 with `resolved: false` and a redacted reason.

### Tests for User Story 2

- [X] T008 [US2] Cover unconfirmed status, Cloudflare rejection, transport failure with redaction and partial-batch failure in `__tests__/cloudflare-observability-issues.test.ts`

### Implementation for User Story 2

- [X] T009 [US2] Reject a payload whose `success` is not true or whose `result.status` is not `resolved`, in `app/lib/cloudflare-observability-issues.ts`
- [X] T010 [US2] Fail the post-deploy job with an explicit "remain unresolved" error and record it in the run summary when confirmation does not arrive, in `.github/workflows/deploy-open-next.yml`

**Checkpoint**: No code path reports resolution without Cloudflare's confirmation.

---

## Phase 5: User Story 3 - Existing automation and credentials stay protected (Priority: P3)

**Goal**: The endpoint is closed to unauthenticated callers, credentials never leak, and all existing Cloudflare automation is preserved.

**Independent Test**: Call the route without a credential, with a wrong credential and with unset secrets; inspect the diff for changes to the scanner, webhook, issue creation, deduplication, notification policy and scheduled workflows.

### Tests for User Story 3

- [X] T011 [P] [US3] Cover unauthenticated, wrongly authenticated and unconfigured calls, plus validation rejection without any Cloudflare request, in `__tests__/cloudflare-observability-issues.test.ts`

### Implementation for User Story 3

- [X] T012 [US3] Implement digest-based credential comparison and no-store responses in `app/api/cloudflare-issues/resolve/route.ts`
- [X] T013 [US3] Keep `wrangler.jsonc`, the Workers Observability scanner, the generic webhook, GitHub issue creation, `ISSUE_DEDUPE`, the notification policy, the issue automation and every scheduled workflow unchanged
- [X] T014 [US3] Document the two Wrangler-managed Worker secrets and the `Cloudflare-Issue:` reference convention in `specs/127-cloudflare-issue-auto-resolution/quickstart.md` without recording any credential value

**Checkpoint**: The capability is auditable and the existing integration is demonstrably untouched.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T015 [P] Point `.specify/feature.json` at `specs/127-cloudflare-issue-auto-resolution`
- [X] T016 [P] Record current task state in `memory-bank/activeContext.md`
- [X] T017 Run `pnpm exec vitest run __tests__/cloudflare-observability-issues.test.ts`, `node --test .github/scripts/test-cloudflare-issue-references.node-test.mjs`, `pnpm tsc --noEmit` and `./freebuff-verify.sh`; measure the production build output against the 495 MiB cap
- [X] T018 Inspect the complete final diff and publish the canonical PR summary with actual results

---

## Dependencies

- T001 and T002 are independent and parallel.
- T003 depends on T001.
- T004–T005 depend on T001–T002.
- T006 depends on T003 and T002.
- T008–T010 depend on T003.
- T011–T014 depend on T012.
- T015–T018 follow the implementation tasks.

## Parallel Execution Examples

- US1: T004 and T005 can run together (different test files).
- US3: T011 can run while T013 is being audited.
- Polish: T015 and T016 can run together.

## Implementation Strategy

Deliver the route and collector first (Phase 1), wire the post-deploy job (US1), then harden the failure path (US2) and the credential boundary (US3). Each story is verifiable from the focused test files without a deployment.

## Notes

- No new dependency was added; `fetch`, `crypto.subtle` and `Response` are runtime built-ins.
- The Cloudflare status update cannot be exercised locally without a Cloudflare credential; the automated tests use a stubbed transport and the live confirmation is verified by the post-deploy job in CI.
