# Tasks: Robin Review Runtime Hardening

Input: Design documents in specs/024-robin-review-hardening/

## Phase 1: Specification and planning

- [x] T001 Record the user-focused problem and measurable runtime goal in spec.md.
- [x] T002 Document the observed stream-timeout defect and live provider evidence in plan.md and research.md.

## Phase 2: Workflow reliability (P1)

- [x] T003 Replace the moving reusable-workflow call with the immutable Robin action reference.
- [x] T004 Preserve OpenRouter free routing as the default; set a 90-second client timeout, two-minute step cap, four-minute job cap, and safe credential preflight.
- [x] T005 Add a failure/cancellation-aware review lookup and final recheck to prevent a timeout-after-post from becoming a duplicate or false failure.
- [x] T006 Update quickstart.md for the one-attempt bounded flow (no second Robin model handoff).

## Phase 3: Verification (P1)

- [x] T007 Observe a live successful router run and confirm the check finishes within the two-minute action cap; inspect all resulting checks.
- [x] T008 Observe bounded provider failures and confirm the workflow fails closed when it posts no review: attempted models returned 429, 404, 502 or empty output; the slow attempts were stopped at the action cap.
- [ ] T009 Run ./jules-verify.sh locally. This connected session could not resolve github.com for a local clone; repository CI ran the available GitHub checks instead.

## Dependencies

T001 → T002 → T003/T004/T005/T006 → T007/T008/T009.
Do not claim local verification passed; keep T009 unchecked until it actually runs.
