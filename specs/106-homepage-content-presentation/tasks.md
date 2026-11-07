# Tasks: Approved Homepage Content and Presentation Refresh

**Feature**: `specs/106-homepage-content-presentation`
**Branch**: `content/homepage-wording-presentation-20261107`

## Phase 1 — Content

- [x] T001 Add `app/homepage/faq-content.js` with the ten approved questions and answers.
- [x] T002 Point `app/page.js` FAQPage structured data at the shared FAQ module and remove the duplicate array.
- [x] T003 Point `app/homepage/FAQSection.js` at the shared module, render `\n\n` answers as paragraphs, and raise the open container height to 1600 px.
- [x] T004 Replace the Lucky Meter paragraph with the approved wording.
- [x] T005 Replace the Daily Lucky Card Reveal paragraph with the approved wording.
- [x] T006 Replace the Crystal Ball paragraph with the approved wording.
- [x] T007 Set the Lucky Pick section title to "Lucky Pick — Your Little Touch of Luck" and use the approved paragraph as its introduction.
- [x] T008 Replace the Tip Jar heading with "Tip Jar — Help Keep the Luck Rolling" and add the three approved passages.
- [x] T009 Replace the Suggestion Box heading with "Suggestion Box — Your Ideas Help Shape What's Next" and add the four approved passages.
- [x] T010 Apply the approved form labels, required marker, placeholder and "Share Your Idea" button text.
- [x] T011 Replace the Community Map introductory sentence with the two approved passages.

## Phase 2 — Presentation

- [x] T012 Add `.homepage-copy-stack` styles (gold hairline, lead sentence, 1.75 line height, emphasised close) to `themes/default/homepage.css`.
- [x] T013 Widen the Tip Jar card to 760 px and give the Suggestion Box passages a 56ch measure.
- [x] T014 Add `.map-community-intro` styles to `themes/default/map.css`.
- [x] T015 Confirm mobile rhythm, focus outlines, gold 3D buttons, `.gold-shimmer` overlays and `prefers-reduced-motion` behaviour are untouched.

## Phase 3 — Tests

- [x] T016 Add `__tests__/homepage-content-refresh.test.js` covering verbatim copy, removed old copy, form contract, celebration behaviour and the FAQ single-source contract.
- [x] T017 Update `tests/visual/sitewide-gold-cta.spec.ts` for the renamed submit button label.
- [x] T018 Run focused Vitest for the new guard — 18/18 PASS.
- [x] T019 Run the full Vitest suite — 48 files / 382 tests PASS.
- [x] T020 Run `./freebuff-verify.sh` (pnpm frozen install, Spec Kit gates, `tsc --noEmit`, production build, refresh-docs tests) and measure the production build size against the 495 MB maximum — exit 0; 318.11 MiB measured before the final CSS addition, re-measured after it.
- [ ] T021 Regenerate or verify the Playwright visual baselines affected by the homepage copy change — NOT RUN locally (local Chromium unusable, managed Playwright bridge errored); PR-head Visual QA is the verification path, and the viewport baseline covers only the unchanged hero.
- [x] T022 Audit the complete final diff and publish the single canonical PR summary — 15 files, no protected path; PR #1761 open and unmerged.

## Phase 4 — Record

- [x] T023 Update `memory-bank/activeContext.md` and `memory-bank/progress.md` with the task outcome and evidence.

## Phase 5 — Review follow-up (PR #1761 suggestions)

- [x] T024 Align the homepage Lucky Stories card body with the approved introduction passage (first passage, verbatim) and keep the non-testimonial note.
- [x] T025 Keep the card's `EXPLORE LUCKY STORIES` gold button and `/map` destination unchanged.
- [x] T026 Extend `__tests__/homepage-content-refresh.test.js` with the card alignment guard.
- [x] T027 Add `tests/visual/homepage-content-refresh.spec.ts` covering the Experience copy, card, Tip Jar, Suggestion Box form contract, FAQ interaction/clipping and Community Map intro.
- [x] T028 Add a horizontal-overflow check for `/` and `/map` at all three Playwright projects.
- [x] T029 Capture section screenshots as Playwright artifacts; no new committed image baselines.
- [ ] T030 Run the new Playwright spec locally — blocked if the sandbox Chromium cannot launch; the PR-head `Visual QA` workflow is the authoritative run.
- [x] T031 Report the PR-head check results (Visual QA, CodeQL, DevSkim, Graphite) with their real conclusions in the PR body.
- [x] T032 Re-audit the final diff, measure the production build and update the single canonical PR summary.

## Phase 6 — Main-branch integration and conflict repair

- [x] T033 Confirm the shared base, current main/head SHAs and every overlapping path.
- [x] T034 Preserve the main-line map consolidation and all independent homepage-content files in the integrated tree.
- [x] T035 Combine `.specify/feature.json`, `memory-bank/activeContext.md` and `memory-bank/progress.md` without dropping either task's record.
- [x] T036 Create a two-parent merge commit on the PR branch without force-pushing or completing the PR.
- [ ] T037 Verify the new PR head through the required repository gate and PR-head checks; record actual outcomes before claiming verified completion.
