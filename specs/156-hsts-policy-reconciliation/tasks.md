# Tasks: HSTS Policy Reconciliation

**Input**: Design documents from `/specs/156-hsts-policy-reconciliation/`

**Prerequisites**: plan.md, spec.md, research.md

**Scope guard**: HSTS only. No CSP, other security header, DNS, email-authentication or unrelated
Cloudflare setting changes.

## Phase 1: Setup and Evidence

- [X] T001 Record the live HSTS header on the apex domain, `www`, an API route and a static asset (`research.md`)
- [X] T002 Prove the served value comes from Cloudflare rather than the repository, using paths the Next.js header rule excludes (`research.md`)
- [X] T003 Confirm Cloudflare's HSTS behaviour and 12-month maximum from its documentation (`research.md`)
- [X] T004 Confirm the `includeSubDomains` surface with DNS queries and certificate-transparency data (`research.md`)
- [X] T005 Confirm the domain is not currently preloaded (`research.md`)
- [X] T006 Locate every HSTS definition in the repository and confirm there is only one (`research.md`)

## Phase 2: User Story 1 — Edge and repository declare the same policy (P1)

**Goal**: One-year HSTS with `includeSubDomains`, no `preload`, identical at the edge and in the repository.

**Independent Test**: compare the live header with the `next.config.mjs` value.

- [X] T007 [US1] Change the `Strict-Transport-Security` value in `next.config.mjs` to `max-age=31536000; includeSubDomains`
- [X] T008 [US1] Confirm no `63072000`, no `preload` and no second HSTS definition remains in the configuration
- [X] T009 [P] [US1] Add `__tests__/hsts-policy.test.js` pinning the value, the single-definition rule and the absence of `preload`
- [ ] T010 [US1] Apply the Cloudflare zone HSTS setting: max-age 31536000, includeSubDomains on, preload off, nosniff on — **BLOCKED**: the available credential is unauthorized for zone settings (Cloudflare error 9109); see `evidence.md`
- [ ] T011 [US1] Re-read the Cloudflare setting after the change — **BLOCKED** with T010

## Phase 3: User Story 2 — Every required response path is verified (P2)

**Goal**: apex, `www`, API and static assets all report the target policy.

**Independent Test**: request each path and read the header.

- [ ] T012 [US2] Verify the live apex header after the edge change — **BLOCKED** with T010
- [ ] T013 [US2] Verify `www`, an `/api/*` route and a `/_next/static/*` asset — **BLOCKED** with T010

## Phase 4: Verification and Delivery

- [X] T014 Run the focused HSTS regression test
- [X] T015 Run `./freebuff-verify.sh` and record the result
- [X] T016 Measure the production build and confirm it stays below 495 MiB
- [X] T017 Record verification evidence in `evidence.md`
- [X] T018 Commit, push the branch and open one regular, non-draft PR for review without merging

## Dependencies

- T007 and T009 are independent files and can be done in parallel.
- T010 blocks T011, T012 and T013; the repository work does not depend on it.
- T014–T017 depend on T007 and T009.
- T018 depends on all completed tasks and the recorded blocker.

## Notes

- The Cloudflare half is not optional follow-up: it is part of the approved change. It is recorded
  as BLOCKED, with the exact error and the required permission, so the owner can complete it and
  then verify with the recorded commands.
- The PR does not claim the edge change occurred.
