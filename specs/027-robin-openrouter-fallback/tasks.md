# Tasks: Robin Cloudflare Workers AI Fallback

## Phase 1 — Setup and specification

- [x] T001 Create the bounded feature specification in `specs/027-robin-openrouter-fallback/spec.md`.
- [x] T002 Record the workflow/history findings and implementation/verification plan in `specs/027-robin-openrouter-fallback/research.md` and `plan.md`.
- [x] T003 Create the requirements quality checklist and update `.specify/feature.json` to the active feature.

## Phase 2 — Workflow repair (US1, US2)

- [x] T004 Keep OpenRouter primary and configure a bounded Cloudflare Workers AI fallback with its own secret, endpoint, and free-tier safety latch in `.github/workflows/robin.yml`.
- [x] T005 Remove the Amazon Q request/acceptance path and require an exact-current-head Robin review before the code-review check passes in `.github/workflows/robin.yml`.
- [x] T006 Add static regression tests for independent provider, free-tier safety latch, quota independence, and current-head verification in `tests/workflows/robin-openrouter-fallback.test.ts`.
- [x] T007 Update `memory-bank/activeContext.md` and `memory-bank/progress.md` with the actual scope, quota caveat, and verification status.

- [x] T011 Harden fallback control flow by making review-lookup errors non-blocking, explicitly export EVENT_NAME, remove duplicate COMMENT_BODY mapping, and add regression assertions.

## Phase 3 — Verification and review

- [x] T008 Run the targeted workflow regression test and full `pnpm test` suite; record actual outcomes.
- [ ] T009 Run `./jules-verify.sh`, inspect final diff and PR checks, and confirm measured build size remains below the 495 MB hard maximum if the verification build runs.
- [ ] T010 Reconcile all changed paths with the final PR summary and report any remaining failed, pending, or unavailable checks.

## Dependencies

T001–T003 establish the task artifacts before implementation. T004–T007 depend on the defined scope and plan. T008–T010 depend on the committed branch and must remain open until verified by actual results.

## Implementation Strategy

The smallest useful unit is the workflow change plus static regression tests. The application runtime and dependency graph remain untouched. Verification may continue via PR checks if the connected local shell is unable to reach GitHub.
