# Tasks: Mobile usability and accessibility remediation

**Feature**: `specs/114-mobile-usability-accessibility` · **Spec**: `spec.md` · **Plan**: `plan.md`

## Phase 1 — Setup

- [X] T001 Confirm the clean worktree, that no other feature directory covers this remediation, and that PR #1773 stays untouched (audit only).
- [X] T002 Point `.specify/feature.json` at `specs/114-mobile-usability-accessibility`.
- [X] T003 Record the audit's D3/D4/D5/D8 measurements as the pre-change baseline in `spec.md`.

## Phase 2 — Foundational

- [X] T004 Read the rendered structure: `app/layout.js` (single `<main>`, three footer `<nav>` regions), the homepage hero navigation, the map component and stylesheet, the Crystal Ball component and the Lucky Meter component.
- [X] T005 Confirm the actual causes: nested `<main>` in `CrystalBall.tsx`; eyebrow `H2` before the `H1` in `DailyResonance.tsx`; `outline: none` in `themes/default/map.css` for the map links, gold CTA and secondary buttons; `0.72rem`/`0.78rem`/`0.68rem`/`0.7rem`/`10px`/`11px` caption sizes.
- [X] T006 Build the in-repo measurement harness (`artifacts/a11y-mobile-20261108/measure.mjs`) that records tap-target boxes and hit-tested extents, computed font sizes, `<main>`/heading/nav structure, and a keyboard focus walk.

## Phase 3 — User story 1: usable phone targets (P1)

- [X] T007 [US1] Add `footer nav a` 24 px minimum box in `themes/default/a11y.css`, leaving the footer's existing hit-area expanders and typography in place.
- [X] T008 [US1] Add the transparent `::before` 3 px ring to `.province-marker` in `themes/default/map.css`, keeping the marker's visible size, `::after` twinkle and artwork unchanged.
- [X] T009 [US1] Measure the homepage header links' effective hit area and leave the markup unchanged where it already exceeds 24 px.
- [X] T010 [US1] Re-measure every D3 control at 390 × 844 and record before/after hit areas; check adjacent-control overlap. Result: 12 sampled controls, minimum hit box 32 × 24 px, zero overlaps; province marker visible 22.5 px unchanged with a 28 × 28 px hit area.

## Phase 4 — User story 2: readable mobile type (P1)

- [X] T011 [US2] Raise footer navigation, social, legal and disclaimer text from `10px`/`11px` to `text-xs` in `app/layout.js`.
- [X] T012 [US2] Raise the Lucky Map statistic label and story badge from `0.72rem` to `0.8rem`, and the Crystal Ball quota countdown from `0.78rem` to `0.8rem`.
- [X] T013 [US2] Raise the revealed-card tier chip and series caption from `0.68rem`/`0.7rem` to `0.8rem` in `app/lucky-card-reveal.js`.
- [X] T014 [US2] Raise the mobile offer note, lucky-moment eyebrow and card share status to `0.8rem` in `themes/default/a11y.css`, leaving decorative kickers and artwork labels untouched.
- [X] T015 [US2] Re-enumerate computed font sizes per route at 390 × 844; record min/median and classify any remaining sub-12 px element by role. Result min/median: `/` 10/14.25, `/reveal` 12/12, `/crystal-ball` 9.945/12, `/map` 12/15, `/about` 12/16.875, `/lucky-meter` 12/12. Remaining sub-12 px: aria-hidden `•` separators (10 px, decorative) and the Crystal Ball engraved plaque label (9.945 px, part of the artwork).
- [X] T016 [US2] Review the homepage at 390 × 844 for horizontal overflow, clipped text, control overlap and first-screen touch use. Result: `scrollWidth` 390 = `clientWidth` 390, no horizontally clipped text and no overlapping hit areas.

## Phase 5 — User story 3: correct landmarks, headings and skip navigation (P1)

- [X] T017 [US3] Replace the Crystal Ball component's nested `<main>` with a `<div>` that keeps the same class.
- [X] T018 [US3] Convert the Lucky Meter eyebrow `H2` to a paragraph with identical utility classes so the page starts at `H1`.
- [X] T019 [US3] Add the first-in-body skip link and `id="main-content"`/`tabIndex={-1}` on the shared `<main>` in `app/layout.js`, with the off-screen-until-focused styles in `a11y.css`.
- [X] T020 [US3] Verify one `<main>` per route, the corrected `/lucky-meter` heading sequence, the skip link's focus move and every `<nav>` accessible name in a real browser. Result: `mainCount` 1 with `id="main-content"` on all six routes; `/lucky-meter` order `1,2` (was `2,1,2`); skip link focuses `main#main-content` after Enter; all navs distinctly named (`Primary`, `Footer`, `Social`, `Legal`, `Lucky Map`, `Crystal Ball`).

## Phase 6 — User story 4: visible keyboard focus (P2)

- [X] T021 [US4] Remove the `outline: none` declarations for map controls and add the 3 px gold `:focus-visible` rule in `themes/default/map.css`; add the footer focus ring in `a11y.css`.
- [X] T022 [US4] Tab through `/map` and record `outline-style`/`outline-width` for every focused control, including footer links, the gold CTA and “Back to Home Page”. Result: 43 focused stops, 0 with `outline-style: none`; skip link, `.home-link`, `.story-link` and footer links report a 3 px solid outline.

## Phase 7 — Guard, verify and deliver

- [X] T023 Add `__tests__/mobile-accessibility.test.js` guarding the single-main structure, first heading, skip-link target/visibility rules, focus-outline restoration and the mobile caption/target rules.
- [X] T024 Run the focused Vitest guard, `pnpm exec tsc --noEmit`, and `./freebuff-verify.sh`. Result: guard 15/15 passed, `tsc --noEmit` exit 0, `./freebuff-verify.sh` exit 0 (36 tests passed, 0 failed).
- [X] T025 Measure the production build (`.next` + `public`) against the 495 MB hard maximum and report the size. Result: `.next` 435 MB + `public` 33 MB = 468 MB, under the 495 MB cap.
- [X] T026 Verify desktop presentation at 1440 × 900 is not unintentionally changed. Result: `/reveal`, `/crystal-ball`, `/map`, `/about` and `/lucky-meter` keep a 12 px minimum; `/` keeps its existing 11.2 px eyebrow scale; no horizontal overflow on any route.
- [X] T027 Inspect the complete final diff and confirm only the planned files changed. Result: 10 modified + 4 new paths, all in scope; the dev-server rewrite of `next-env.d.ts` was reverted.
- [X] T028 Update `.specify/feature.json` to point at this feature. The shared memory-bank notes are left to the owner's own workflow so this branch does not overwrite other work in them.
- [ ] T029 Commit, push, open one PR with the canonical summary, and leave it open and unmerged. (Completed at handoff; PR HEAD SHA is recorded in the PR body.)
- [ ] T030 Record the PR-head check status truthfully (pending is acceptable; never reported as passed).

## Dependencies

- T006 before T009/T010, T015/T016, T020, T022.
- T007–T008 before T010; T011–T014 before T015–T016.
- T017–T019 before T020; T021 before T022.
- T023 before T024–T027; T024–T027 before T029–T030.

## Implementation strategy

Two independently verifiable increments in one branch and one PR: mobile usability (targets, type, homepage
review) and accessibility (landmarks, headings, skip link, focus). They share only the new `a11y.css` layer and the
shared layout, and both are required by the same audit remediation.
