# Tasks: Align Link Prefetch with the Adaptive Network Policy

**Feature**: `specs/190-link-prefetch-policy`

## Phase 1: Setup

- [X] T001 Read `AGENTS.md`, `PR_SUBMISSION.md`, the Memory Bank files and the applicable `.docs/` sources.
- [X] T002 Inspect `IntentPrefetchLink`, the adaptive prefetch policy and every `next/link` consumer.
- [X] T003 Confirm the bypass: only the hero used the wrapper; `prepareCodeResource` prefetched without a plan check.

## Phase 2: Alignment

- [X] T004 Route navigation links in the app shell, homepage, legal pages and route components through `IntentPrefetchLink` (11 files).
- [X] T005 Type the wrapper's pass-through props so `.tsx` consumers keep `href`, `className` and data attributes.
- [X] T006 Gate the hub's `code` adapter on `prefetch === 'none'` and on `strong-intent` without intent priority, and pass the job priority to the adapter context.
- [X] T007 Update the three existing markup/import guards to assert the same links and wording through the wrapper.

## Phase 3: Verification

- [X] T008 Add `__tests__/link-prefetch-policy.test.js` (source guard for 11 files, fast/moderate/Save-Data hub policy, current-route skip).
- [X] T009 Run the focused suites, the full unit suite, `tsc --noEmit` and `./freebuff-verify.sh`.
- [X] T010 Measure a clean production build and record the size.
- [X] T011 Capture production-server RSC requests under Save-Data and on a capable connection, including a navigation check.
