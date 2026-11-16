# Tasks: Daily Resonance Polish

**Input**: `/specs/173-lucky-meter-daily-resonance-polish/`

**Prerequisites**: spec.md, plan.md

**Scope guard**: Daily Resonance only. Preserve result generation, weighting,
colours, Sparks, persistence, sharing, routes, the Milky Way artwork,
navigation, the visit counter, reduced motion, WebGL fallbacks and mobile
performance budgets. No dependency, workflow or infrastructure change.

## Phase 1: Evidence and review

- [X] T001 Read AGENTS.md, PR_SUBMISSION.md, the four Memory Bank files, the audio/polishing/testing/deep-dive task groups and specs 160, 164 and 170
- [X] T002 Read the authoritative Playwright skill and Lucky Pick Canada reference before any browser work
- [X] T003 Capture the delivered baseline with a deterministic seeded result at desktop and mobile (`artifacts/lucky-meter-resonance-20261116/before/`)
- [X] T004 Record the defects in the baseline: event-keyed numbers, single-beat details, spawn-time meteor sound, instantaneous thunder, indistinct finale mix, uniform gold leaves, foreground leaves over the reading
- [X] T005 Reconcile number ownership against spec 160 FR-007 and record the preserved Low/Medium/High triplets
- [X] T006 Confirm existing audio is genuine, licensed and adequate; decide no replacement or new asset is needed

## Phase 2: Data model and reveal (blocking)

- [X] T007 Move `numbers` from `EVENTS` to `TIERS` in `app/lib/lucky-meter/config.js`
- [X] T008 Write and validate `tier.numbers` in `app/lib/lucky-meter/selection.js`, including legacy-payload migration without a version bump
- [X] T009 Read numbers from the tier in `app/lib/lucky-meter/share.js`
- [X] T010 Add `numbersDelayMs` and `EVENT_START_MS` to `app/lib/lucky-meter/reveal.js`
- [X] T011 Add `numbersVisible` and the ordered reveal beats in `components/DailyResonance.tsx`
- [X] T012 Render the Lucky Numbers as their own plate before the supporting panels, consistently for every tier

## Phase 3: Event audio

- [X] T013 Add the pure `app/lib/lucky-meter/event-audio.js` cue map, thunder delay routing and sustained-sound list
- [X] T014 Replace the cue if/else chain with the map and keep the rumble throttle
- [X] T015 Add `stopEventAudio()` and call it on stage completion, midnight rollover and unmount; track and clear its timers
- [X] T016 Verify the finale layers a louder, lower boom than every regular pop and that no layer exceeds unity

## Phase 4: Event synchronisation

- [X] T017 Move the meteor whoosh to the on-screen entry and add the ignition flare
- [X] T018 Add the meteor burnout impact flare, embers, shockwave and matching cue
- [X] T019 Queue lightning thunder after a distance-based delay and route near/far/finale rumbles
- [X] T020 Add the deeper finale launch whistle and the finale shockwave and warm illumination
- [X] T021 Add a sorted delayed-cue queue and clear the new state on destroy

## Phase 5: Autumn leaves

- [X] T022 Add `app/lib/lucky-meter/leaf-wind.js` with the seven-colour palette, weighted selection and shared wind field
- [X] T023 Add the per-draw albedo tint to `app/lib/gpu-lighting.js` with an identity default
- [X] T024 Add the neutral-albedo option to `app/lib/gpu-geometry.js` without changing the default look
- [X] T025 Apply per-leaf colour and metal, sharper bevel/doming and larger size ranges in the ornament engine
- [X] T026 Make far leaves wind-carried with wrapping travel and near leaves sway inside the reading lane
- [X] T027 Extend the near-layer exclusion lane so leaves never cover panels, Share or the countdown

## Phase 6: Tests

- [X] T028 Update selection, share, reveal-timing, daily-experience and cinematic-lifecycle tests
- [X] T029 Add deterministic cue-map and thunder-timing tests
- [X] T030 Add deterministic playback tests covering cue → Howl, throttling and cleanup
- [X] T031 Add deterministic palette and wind tests
- [X] T032 Add the Playwright Daily Resonance spec: nine tier × event combinations, reveal order, reduced motion, WebGL fallback and cleanup
- [X] T033 Run the full Vitest suite and the type check
- [X] T034 Run the Playwright spec on desktop, mobile-390 and mobile-412
- [X] T035 Capture the after evidence at the same beats and viewports as the baseline

## Phase 7: Verification and submission

- [X] T036 Run `./freebuff-verify.sh` and measure the production build against the 495 MiB cap
- [X] T037 Self-review the complete diff against the applicable checker requirements
- [X] T038 Prepare and open one regular, non-draft PR following `PR_SUBMISSION.md`

## Phase 8: Review-identified surgical repairs

- [X] T039 Reserve one finale thunder slot while retaining the ordinary two-rumble cap and spacing guard in `components/DailyResonance.tsx`; add playback regression coverage.
- [X] T040 Fade and stop each sustained Howler instance by Sound ID and its authored cue gain; keep the transient finale firework body out of the sustained list.
- [X] T041 Trigger meteor burnout on the first frame its head leaves the viewport and place the effect at its last visible coordinates.
- [X] T042 Keep foreground leaves outside the copy lane on 390 px and 412 px viewports; add deterministic placement regression coverage.
- [X] T043 Update both manual QA harnesses to seed and read `tier.numbers`, not `event.numbers`.

## Phase 9: Post-repair verification

- [ ] T044 Re-run focused and full Vitest, TypeScript, Playwright on desktop/mobile-390/mobile-412, PR checkers and the production build-size measurement on the repair commit.
