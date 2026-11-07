# Tasks: Consolidate duplicate map URLs onto `/map`

**Feature**: `specs/107-map-url-consolidation` · **Spec**: `spec.md` · **Plan**: `plan.md`

## Phase 1 — Setup

- [X] T001 Create branch `feat/map-url-consolidation-20261107` from `main` (`700f2077`) and confirm a clean worktree.
- [X] T002 Confirm the baseline: both alias paths returned 200 with the same map body, and the alias route modules exist.

## Phase 2 — Foundational

- [X] T003 Re-read `redirects()` in `next.config.mjs` and confirm the existing `/stories` and host entries that must not change.
- [X] T004 Confirm no test or module imports the alias `page.js` files (they import only the shared `lucky-map-of-canada.js` component), so redirects are sufficient and route removal is out of scope.
- [X] T005 Point `.specify/feature.json` at `specs/107-map-url-consolidation`.

## Phase 3 — User story 1: crawler reaches a legacy URL (P1)

- [X] T006 Add permanent `/lucky-map-of-canada` → `/map` redirect in `next.config.mjs`.
- [X] T007 Add permanent `/where-luck-has-been-found-in-canada` → `/map` redirect in `next.config.mjs`.

**Independent test (executed)**: on a local production build, `curl -sSI` returned
`HTTP/1.1 308 Permanent Redirect` with `location: /map` for both aliases.

## Phase 4 — User story 2: query strings survive (P2)

- [X] T008 Verified by execution: `/lucky-map-of-canada?utm_source=audit-check` → `308` with
  `location: /map?utm_source=audit-check`.

## Phase 5 — User story 3: one reachable map URL for maintainers (P3)

- [X] T009 Added `__tests__/map-url-redirects.test.js` asserting both redirects, the untouched existing redirects and sitemap exclusion.
- [X] T010 Ran the focused Vitest file: 3/3 tests pass.

## Phase 6 — Polish and cross-cutting

- [X] T011 Confirmed by execution: `/map` → 200 with `<title>Lucky Map | LuckyPickCanada.ca</title>` and canonical `/map`; `/stories` → 308 `/map`; `Host: www.luckypickcanada.ca` → 308 `https://luckypickcanada.ca/map`.
- [X] T012 Inspected the complete diff: `next.config.mjs` (+15/−2 including comments), `.specify/feature.json`, the new test and `specs/107-map-url-consolidation/**` only.
- [X] T013 Ran `./freebuff-verify.sh`: exit 0, 36 refresh-docs tests pass, build 372,780,655 B (355.51 MiB) — below the 495 MB ceiling.
- [X] T014 Recorded the task in `memory-bank/activeContext.md` and `memory-bank/progress.md`.
- [ ] T015 Commit, push, open one PR with the canonical summary, and leave it open and unmerged.
- [ ] T016 Record the PR-head CI outcome truthfully (pending is acceptable; never reported as passed).

## Dependencies

- T003–T005 before T006–T007.
- T006–T007 before T008–T010.
- T009–T011 before T012–T013.
- T013 before T015; T015 before T016.

T015 and T016 happen after this commit, so their outcome is recorded in the pull request body rather
than in this file.

## Implementation strategy

Single small increment: the two redirects are the whole behavioural change, guarded by one test and
one executed verification pass. No partial delivery is meaningful — both aliases are consolidated in
one commit.
