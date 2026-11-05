# Tasks: Daily Lucky Card Reveal Polish

**Input**: Design documents from `specs/094-lucky-card-reveal-polish/`

**Prerequisites**: `plan.md` and `spec.md`

**Tests**: Executable coverage is required by the feature's acceptance criteria (all three tiers, the
entry affordance and reduced motion).

## Phase 1: User Story 1 — Tappable entry control (Priority: P1)

**Goal**: The single entry button reads and behaves as a real primary action on phone and desktop.

**Independent Test**: Render `/reveal` with no stored card and assert the button's accessible name,
`≥56 px` target classes, pointer cursor, `aria-describedby` target and instruction wording.

- [X] T001 [US1] Add `min-h-14`, `w-full sm:w-auto`, `cursor-pointer` and `touch-manipulation` to the existing entry button without changing its label, handler or gold classes.
- [X] T002 [US1] Add the visible tap instruction, wire it with `aria-describedby`, and switch it to the in-progress message while the draw runs.
- [X] T003 [US1] Cover the entry affordance in `__tests__/components/LuckyCardRevealPresentation.test.jsx`.

## Phase 2: User Story 2 — Tier and card name on the revealed card (Priority: P2)

**Goal**: Every revealed card states its tier and name with a tier-distinct accent.

**Independent Test**: Render a stored Standard, Premium and Flagship card and assert the chip label,
the `h2` card name, the caption and the tier accent; assert an unknown tier falls back to Standard.

- [X] T004 [US2] Add `app/lucky-card-presentation.js` with the three tier palettes, an own-property lookup and a Standard fallback.
- [X] T005 [US2] Render the tier chip, card title and collection caption in `app/lucky-card-reveal.js`, and tint the quote-panel border with the tier accent.
- [X] T006 [US2] Add the tier-tinted inner ring to the revealed card front inside the existing `coast-to-coast-tale` exception.
- [X] T007 [US2] Cover the tier contract, escalation and fallback in `__tests__/lucky-card-tier-presentation.test.js` (executed), and the rendered tier markup in `__tests__/lucky-card-reveal-presentation.test.js` (source guard).

## Phase 3: User Story 3 — Tier-aware reveal moment (Priority: P3)

**Goal**: The reveal gains a tier-coloured halo/rim that escalates with rarity, without touching the
existing choreography.

**Independent Test**: Reveal each tier and assert a `data-card-halo` layer with the matching tier is
present and `aria-hidden`, and that it still renders under reduced motion.

- [X] T008 [US3] Add the `aria-hidden`, `pointer-events-none` halo and rim layers behind the revealed card, fading in only once the card is revealed and not at all under reduced motion.
- [X] T009 [US3] Assert the reduced-motion halo path in the component test.

## Phase 4: Verification and handoff

- [X] T010 Focused suites PASS: `pnpm exec vitest run __tests__/lucky-card-tier-presentation.test.js __tests__/lucky-card-reveal-presentation.test.js __tests__/lucky-card-collection.test.js` → 3 files / 10 tests passed. (The component render test named in the plan was replaced by the source guard: Vitest's Vite/oxc pipeline refuses JSX inside `.js`, so `app/lucky-card-reveal.js` cannot be rendered in jsdom; browser evidence comes from `artifacts/reveal-card-polish/probe.cjs`.)
- [X] T011 Full suite `pnpm exec vitest run` → 45 files / 439 tests passed; `pnpm exec tsc --noEmit` exit 0.
- [X] T012 `./freebuff-verify.sh` exit 0; production build `.next` 298,728,707 B + `public` 32,840,043 B = 331,568,750 B (316.2 MiB), below the 495 MB maximum.
- [X] T012b Browser probe PASS: `node artifacts/reveal-card-polish/probe.cjs` against `next start` on the production build — 51/51 checks (56 px entry target, hover/press states, exact accessible name, instruction copy, draw starts on press, three tier chips/names/captions/accents/halos, unchanged WebP fallback, 0 px overflow, 0 console errors, reduced-motion halo static). Screenshots and `out/report.json` are committed under `artifacts/reveal-card-polish/`.
- [X] T013 Final diff reviewed; `memory-bank/activeContext.md`, `memory-bank/progress.md` and the single PR summary updated; PR left open and unmerged.

## Dependencies & Execution Order

1. T004 establishes the tier contract used by T005/T006/T008.
2. T001–T002, T005–T006 and T008 are the implementation.
3. T003, T007 and T009 are executable coverage written alongside the implementation.
4. T010–T013 are verification and handoff, recorded with their actual results.

## Implementation Strategy

Deliver the three user stories in the one component that owns the reveal. Do not re-time the flip,
the canvas beams or the audio cues, do not regenerate or re-encode artwork, and do not touch payments,
API routes, data or deployment configuration.
