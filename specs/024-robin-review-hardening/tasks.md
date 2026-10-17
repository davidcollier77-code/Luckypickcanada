# Tasks: Bounded Robin Review Failover

Input: Design documents in specs/024-robin-review-hardening/

## Phase 1: Specification and planning

- [x] T001 Write the user-focused specification in specs/024-robin-review-hardening/spec.md.
- [x] T002 Record evidence, timeout design, and model choices in specs/024-robin-review-hardening/plan.md and research.md.

## Phase 2: Workflow reliability (P1)

- [x] T003 Replace the reusable workflow call in .github/workflows/robin.yml with the immutable Robin action reference, while preserving event filtering, permissions, concurrency, and advisor-mode review policy.
- [x] T004 Add explicit free primary/fallback model defaults, 120-second request timeouts, three-minute action-step limits, an eight-minute job limit, and a fast secret-presence check.
- [x] T005 Add current-head review detection before fallback and a final recheck so a primary timeout after publishing a review cannot create a duplicate review or silently produce a false failure.
- [x] T006 Document the manual verification steps in specs/024-robin-review-hardening/quickstart.md.

## Phase 3: Verification (P1)

- [ ] T007 Inspect the new pull request's workflow syntax and check results; confirm the primary path's actual duration and posted review.
- [ ] T008 Exercise the fallback path under a controlled primary failure without changing repository secrets; verify fallback starts only when no review was posted and completes or fails within the limits.
- [ ] T009 Run ./jules-verify.sh and review final changes/build results. This connected session has no working local GitHub clone/network, so this remains pending until an available runner executes it.

## Dependencies

T001 → T002 → T003/T004/T005/T006 → T007/T008/T009.
Do not label the fix end-to-end verified until the pending verification tasks pass.
