# Tasks: Unused Documentation Reference Retirement

**Input**: Design documents from `specs/102-unused-reference-retirement/`

**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Baseline and Governance

- [x] T001 Read `AGENTS.md`, `.freebuff/freebuff.md`, Memory Bank, manifest, and affected group instructions.
- [x] T002 Inspect PR #1740 and verify the four target references remain in exactly one group each; confirm NumPy remains in Audio.
- [x] T003 Repeat source-code/dependency searches for PostHog, Magic UI, React Three Fiber, and Upstash Ratelimit; matches are limited to documentation routing and snapshots.

## Phase 2: Retire the Four Unused References

- [x] T004 [US1] Remove the four identifiers from every `groups` array, `sources`, `inventory`, and `githubShas` entry in `.docs/manifest.json`.
- [x] T005 [US1] Remove the PostHog, Magic UI, React Three Fiber, and Upstash Ratelimit route lines from `.freebuff/deep-dive.md`, `.freebuff/polishing.md`, `.freebuff/creation.md`, and `.freebuff/security.md`.
- [x] T006 [US1] Delete the four canonical snapshots under `.docs/deep-dive/`, `.docs/polishing/`, `.docs/creation/`, and `.docs/security/`.
- [x] T007 [US1] Add `__tests__/docs-library-retirement.test.ts` covering the four removals, previous PR #1740 retirements, and NumPy's Audio-only route.

## Phase 3: Spec Kit and Memory

- [x] T008 Update `.specify/feature.json` to `specs/102-unused-reference-retirement` and record the task in `memory-bank/activeContext.md` and `memory-bank/progress.md`.

## Phase 4: Verification

- [ ] T009 Run `pnpm exec vitest run __tests__/docs-library-retirement.test.ts` and the manifest/snapshot consistency audit; record actual results.
- [ ] T010 Run `./freebuff-verify.sh`, record the measured build size against 495 MB, and inspect the final complete diff.
- [ ] T011 Review all PR comments and check runs after opening the PR; update its single canonical summary with actual outcomes and leave it open/unmerged.

## Dependencies

T001–T003 establish the baseline. T004–T007 implement the single independent user story. T008 records the active feature. T009–T011 verify and report it.

## Parallel Opportunities

The four specialist routing edits and four snapshot deletions are independent once the manifest baseline is confirmed. The manifest update and regression test depend on the exact retirement set.

## Implementation Strategy

One cohesive documentation-retirement increment; no application or updater implementation is included.
