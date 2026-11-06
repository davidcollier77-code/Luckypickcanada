# Tasks: Lucky Card Reveal Cinematic Enhancement

**Input**: Design documents from `specs/101-lucky-card-reveal-cinematics/`

**Prerequisites**: `plan.md` and `spec.md`

**Tests**: Executable coverage is required by the acceptance criteria (tier escalation for every
tier, the shared finish for every card, and reduced motion). The reveal component is JSX inside a
`.js` file, which the Vitest pipeline cannot render in jsdom, so the rendered behaviour is proven by
the browser harness recorded in `artifacts/reveal-card-cinematics/out/cloud-browser-report.json` and
pinned structurally in the guard.

## Phase 1: Setup

- [X] T001 Confirm the baseline: read `AGENTS.md`, `.freebuff/freebuff.md`, the memory bank, `.freebuff/polishing.md`, `.freebuff/testing.md`, `.docs/manifest.json`, spec 094 and the shipped reveal/tier/test code. Recorded gap: spec 094 shipped a static halo/rim plus one flat sheen and excluded `coast-to-coast-tale` from the finish.

## Phase 2: Foundational

- [X] T002 Extend `app/lucky-card-presentation.js` with `spotlightOpacity`, `shockwaveOpacity`, `shockwaveScale`, `glossOpacity`, `sweepDuration` and `emberOpacity` for all three tiers, keeping the own-property lookup and Standard fallback.

## Phase 3: User Story 1 — The reveal is a cinematic light event (Priority: P1)

**Goal**: The reveal moment is directed with tier-scaled lighting, depth and one-shot effects.

**Independent Test**: Reveal each tier in the browser harness and assert the charging aura,
spotlight, shaft, halo, rim, shockwave and embers exist, are decorative, and escalate by tier.

- [X] T003 [US1] Add the module-scope ember constants and render the `isGenerating` charging aura in `app/lucky-card-reveal.js`.
- [X] T004 [US1] Add the revealed stage layers (spotlight, light shaft, shockwave rings, embers, floor shadow) behind the card, `aria-hidden`, `pointer-events-none`, one-shot and gated on `!shouldReduceMotion`.
- [X] T005 [US1] Cover the stage escalation in `__tests__/lucky-card-tier-presentation.test.js`.

## Phase 4: User Story 2 — Every card shares one premium glossy finish (Priority: P1)

**Goal**: One finish on both faces of all eleven cards, with the artwork untouched.

**Independent Test**: Probe each tier and `coast-to-coast-tale`, assert two finish layers per card,
the tier bloom and single glint on the revealed front, a neutral back, and unchanged artwork URLs.

- [X] T006 [US2] Add the module-scope `CardFinish` component and render it on both card faces in `app/lucky-card-reveal.js`.
- [X] T007 [US2] Apply the finish and the tier ring to `coast-to-coast-tale` while preserving its authored frame.
- [X] T008 [US2] Cover the two-face finish and preserved frame in `__tests__/lucky-card-reveal-presentation.test.js`.

## Phase 5: User Story 3 — The revealed presentation arrives in sequence (Priority: P2)

**Goal**: The tier block, quote and share control settle in after the card lands.

**Independent Test**: Probe the settled opacity/order of the three blocks after a reveal.

- [X] T009 [US3] Convert the tier block, quote panel and share wrapper to staggered `motion` elements in `app/lucky-card-reveal.js` without changing copy, order, classes or layout.

## Phase 6: User Story 4 — Motion preferences and accessibility are preserved (Priority: P2)

- [X] T010 [US4] Gate every one-shot layer on `!shouldReduceMotion` and keep the static lighting, halo, rim and tier accent visible.
- [X] T011 [US4] Assert the reduced-motion path and the decorative attributes in the structural guard.

## Phase 7: Verification and handoff

- [X] T012 Focused suites PASS: `pnpm exec vitest run __tests__/lucky-card-tier-presentation.test.js __tests__/lucky-card-reveal-presentation.test.js` → 2 files / 12 tests passed.
- [X] T013 Full suite PASS: `pnpm exec vitest run` → 44 files / 351 tests passed; type check PASS: `pnpm exec tsc --noEmit` exit 0.
- [X] T014 Browser evidence PARTIAL: the managed cloud-browser harness passed every rendered check for the three tiers, the two-face finish, the stage layers, staged arrival and Coast-to-Coast Tale; 6 initial failures were a harness selector defect (wrong button) and the single entry-name failure was a raw-textContent measurement defect, both re-run. Recorded in `artifacts/reveal-card-cinematics/out/cloud-browser-report.json`. Local Playwright probe **BLOCKED** (Chromium system libraries absent, no root) and reduced-motion browser emulation **NOT RUN**.
- [X] T015 `./freebuff-verify.sh` PASS (exit 0); production build measured `.next` 317,064,504 B + `public` 32,840,043 B = 349,904,547 B (333.7 MiB), below the 495 MB maximum.
- [X] T016 Final diff reviewed; memory bank and the single PR summary updated; PR left open and unmerged.

## Dependencies & Execution Order

1. T002 established the values used by T003, T004, T006 and T009.
2. T006 precedes T007; T004 and T009 are independent of T006.
3. T005, T008 and T011 are executable coverage alongside the implementation.
4. T012–T016 record the actual verification results.

## Implementation Strategy

Deliver the three user stories inside the one component that owns the reveal, driven by the existing
tier module. Do not re-time the flip, the canvas beams or the audio, do not regenerate or re-encode
artwork, and do not touch payments, API routes, data or deployment configuration.
