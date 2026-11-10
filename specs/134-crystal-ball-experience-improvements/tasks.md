# Tasks: Crystal Ball Experience Improvements and Performance Optimization

**Input**: Design documents from `specs/134-crystal-ball-experience-improvements/`

## Phase 1: Setup and baseline

- [X] T001 Confirm the existing Crystal Ball component, daily-usage module, audio helper, styles, tests and assets; confirm no separate Canadian quote exists in the Crystal Ball.
- [X] T002 Record the Spec Kit artifacts and point `.specify/feature.json` at this feature.
- [X] T003 Capture the production-build baseline: build size, `/crystal-ball` transfer bytes, LCP, CLS, DOM nodes and load timing on desktop and mobile (`perf-measure.mjs`, cold cache, throttled network).

## Phase 2: Greeting

- [X] T004 Add `app/crystal-ball-client/greetings.js` with four greetings, the greeting storage key, validation and the uniform-random no-consecutive-repeat daily selection.
- [X] T005 Move the greeting above the title, give it room and contrast, and type it with the `GoldenLeaf` cursor; respect reduced motion.
- [X] T006 Add Vitest coverage for same-day stability, consecutive-day exclusion, repeat allowance, malformed storage, blocked storage and four-greeting reachability.

## Phase 3: Follow-up experience

- [X] T007 Show the follow-up area only after the fortune reveal finishes; initially an **Ask a Follow-up Question** button.
- [X] T008 Replace the button with a designed gold/glass panel (label, roomy textarea, character count, gold submit, dismiss) that uses the native keyboard.
- [X] T009 On submit, blur the textarea (close the native keyboard), remove the panel, and show the question separately above the answer.
- [X] T010 Type the answer with the same `GoldenLeaf` cursor; keep the original fortune, question and answer visible together; restore full text on refresh and respect reduced motion.
- [X] T011 Keep one follow-up per day, show the limit explanation, never auto-reopen the input, and allow natural mobile scrolling.

## Phase 4: Performance

- [X] T012 Encode compressed MP3 variants of the three Crystal Ball WAVs; keep the WAVs as fallback and prefer compressed sources in `app/lib/audio.js`.
- [X] T013 Defer the Crystal Ball audio download until interaction intent and keep the existing playback lifecycle.
- [X] T014 Add immutable caching for audio assets in `next.config.mjs`.
- [X] T015 Set high fetch priority on the Crystal Ball artwork without changing its `<picture>` sources, dimensions or format order.
- [X] T016 Memoize per-word reading rendering so a typing tick does not re-render the whole fortune/answer.

## Phase 5: Verification and reporting

- [X] T017 Update Vitest and Playwright coverage for the greeting, follow-up button/panel/answer, restored state, daily limit, audio assets/order and artwork delivery.
- [X] T018 Run `./freebuff-verify.sh`, the full Vitest suite, the focused Playwright projects, and measure the production build size against the 495 MiB cap.
- [X] T019 Re-run the performance harness and record before/after evidence on desktop and mobile.
- [X] T020 Audit the complete final diff and error check; update the Memory Bank and publish one open, unmerged PR with the canonical summary and HEAD SHA.
