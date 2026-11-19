# Tasks: HTML5 Audio Reactivity and Gemini Retirement QA

**Input**: Design documents from `/specs/195-html5-audio-reactivity-gemini-retirement/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Preparation

- [x] T001 Read `AGENTS.md`, `PR_SUBMISSION.md`, the four Memory Bank files, the Audio and Testing task groups, the Spec Kit constitution and the current creative-layer implementation.
- [x] T002 Reproduce the Visual QA failure and identify every affected expectation: `__tests__/reviewer-retirement.test.ts` required the retired deep-dive Gemini snapshot.
- [x] T003 Inspect Howler's HTML5 path, the shared analyser graph, the runtime bindings and the workbench harness before choosing an approach.

## Phase 2: User Story 1 — HTML5 cues drive sound-reactive visuals (P1)

- [x] T004 Add media-element capture to `app/lib/graphics/audio-reactivity.js` using Howler's existing context: audible unity path first, shared analyser second.
- [x] T005 Add fail-safe refusals (unsupported API, non-running context, cross-origin element, already-captured element) and keep the neutral envelope.
- [x] T006 Scan Howler's bounded HTML5 sound pool at most every 500 ms from the frame update, and force a scan from `refresh()`; reconnect captured elements when the analyser is rebuilt.
- [x] T007 Keep HTML5 audible output connected when the shared analyser is released; disconnect only the analysis edge.
- [x] T008 Add the development-only `playHtml5Cue` workbench hook, the HTML5 cue source catalogue and `audio.html5Sources` / `audio.html5Playing` diagnostics.
- [x] T009 Update `app/lib/graphics/README.md` to document capture, playback preservation and fallbacks.

## Phase 3: User Story 2 — Gemini retirement expectations (P1)

- [x] T010 Remove the outdated existence requirement for `.docs/deep-dive/_google-gemini_gemini-skills_gemini-api-dev.md`.
- [x] T011 Assert both retired Gemini API identifiers absent from manifest groups, sources, inventory, SHA pins and `.freebuff/*` routing in `__tests__/docs-library-retirement.test.ts`.
- [x] T012 Assert every snapshot path absent and remove the two orphaned canonical snapshots. No Gemini document was restored, recreated, regenerated or replaced.
- [x] T013 Preserve the Pullfrog key wiring, Oracle runtime integration and historical reviewer specs.

## Phase 4: Verification

- [x] T014 Focused Vitest: `graphics-sound-reactivity`, `docs-library-retirement`, `reviewer-retirement` and `graphics-creative-workbench` pass.
- [x] T015 `node scripts/test-refresh-docs.js`: 48 passed, 0 failed.
- [x] T016 Chromium (repository Playwright wrapper): Web Audio baseline 0.064, HTML5-only peak 0.065 with `html5Sources: 1` and playing, no page errors.
- [x] T017 Chromium fallback with media capture disabled: HTML5 playback reported, captured sources 0, envelope 0, Web Audio baseline still 0.064, no page errors.
- [x] T018 `pnpm exec tsc --noEmit`, full Vitest suite, production build and 495 MiB cap measurement.
- [x] T019 Prepare the PR with the QA scope declaration, browser evidence and complete handoff report.

## Phase 5: Owner-directed review repairs

- [x] T020 Track a captured source even when its analysis edge fails, and retry that edge on later scans and graph rebuilds without re-capturing the element.
- [x] T021 Switch Howler's `autoSuspend` off once a cue is captured and resume a suspended or interrupted context while a captured cue plays, so capture cannot silence a cue through inactivity.
- [x] T022 Reset the HTML5 capture registry between tests so count and de-duplication assertions do not depend on execution order.
- [x] T023 Remove the retired Gemini API mandate from `.freebuff/sentinel.md` and broaden the retirement assertion to every `.freebuff/*.md` routing file.
