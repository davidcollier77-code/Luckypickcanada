# Tasks: About Section Lucky Stories Link Repair

**Input**: Design documents from `/specs/090-about-stories-link/`

## Phase 1: Investigation (baseline, verified)

- [x] T001 Confirm where the link lives: `components/AboutSection.tsx` renders `href="/stories"` for "Community Lucky Stories section".
- [x] T002 Confirm `/stories` is not a page: no `app/stories` directory and no `/stories` entry in `app/sitemap.js`.
- [x] T003 Confirm the actual behaviour: `next.config.mjs` permanently redirects `/stories` → `/map`, so the link lands on the map,
      the same destination as the adjacent "Canadian Lucky Map" link (`grep -n "source: '/stories'" next.config.mjs`).
- [x] T004 Confirm the intended stories destination: `app/homepage/HomePage.js:445` has `id="community-stories"` on the Lucky Stories card.
- [x] T005 Confirm the component's mount status: `grep -rn "AboutSection" app components` returns only its own definition, so it is not
      rendered by any route today (recorded as a limitation, not changed here).

## Phase 2: Implementation

- [x] T006 [US1] Point the stories link at the homepage section: `components/AboutSection.tsx` `href="/stories"` → `href="/#community-stories"`.
- [x] T007 [P] [US1] Update `__tests__/components/AboutSection.test.tsx` to assert `href="/#community-stories"`.
- [x] T008 [P] [US1] Add a regression assertion that no About section link points at `/stories`.
- [x] T009 [US2] Leave the map link (`/map`), the Lucky Meter link (`/lucky-meter`), the heading, the copy and the class names unchanged.
- [x] T010 [US2] Leave the `/stories` → `/map` permanent redirect in `next.config.mjs` unchanged.

## Phase 3: Verification

- [x] T011 Focused unit test: `pnpm exec vitest run __tests__/components/AboutSection.test.tsx` — PASS (5/5).
- [x] T012 Type check: `pnpm exec tsc --noEmit` — PASS (exit 0).
- [x] T013 Repository gate and production build: `SPEC_KIT_BASE_REF=12459425 ./freebuff-verify.sh` — PASS (exit 0).
- [x] T014 Build size against the 495 MB ceiling: `du -sb .next public` — measured and reported in the PR summary.
- [x] T015 Served behaviour: `next start` → `GET /stories` still responds with a permanent redirect to `/map`; `GET /` contains
      `id="community-stories"` — PASS.
- [x] T016 Final diff audit: only `components/AboutSection.tsx`, `__tests__/components/AboutSection.test.tsx`,
      `specs/090-about-stories-link/*` and `.specify/feature.json` are staged; the pre-existing `package.json`
      modification and untracked `bun.lock` are excluded.
- [ ] T017 PR-head CI: PENDING (reported as pending, never as passing).

## Dependencies

- T006–T008 depend on T001–T005.
- T011–T016 depend on T006–T010.
- T017 depends on the pushed branch.
