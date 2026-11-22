# Feature Specification: Lucky Meter Approved Build

**Feature Branch**: `freebuff/lucky-meter-build`

**Created**: 2026-11-21

**Status**: Implemented — verification recorded in `evidence.md`

**Input**: Owner instruction: "Complete the approved Lucky Meter Build, delivering the full twelve-stage experience and dimensional vessel exactly as defined in the approved requirements." The documentation PRs #2003 (Spec 199) and #2004 (Spec 200 and Memory Bank) are both merged into `main`; this feature implements the reconciled contract.

## Authority

The approved Lucky Meter Living Requirements Outline and Approval Sheet (21 November 2026)
define this Build. Specs 199 and 200 remain the historical implementation records; their
reconciliation notes identify the clauses that were superseded. This feature implements the
current contract and does not reintroduce superseded requirements:

- square CSS vessel → **cylindrical Three.js vessel**;
- monotonic 5–100 generation → **0 → 100 → fall → rise → erratic → settle**;
- number only after the drain → **progressive top-down reveal during the 4 s drain**;
- per-tier celebration lengths → **one 12,000 ms celebration for every tier**;
- top-right Home dock → **last row of the results panel**;
- ~40 s total → **the emergent 54–57 s total**.

## Context

The Lucky Meter already selects and persists one reading per local day and already owns the
Milky Way artwork, the Medallion Gold identity, the seasonal palettes, the tier thresholds and
messages, the celebration engines, the audio set and the arrival leaves. This Build completes
the approved presentation and refresh behaviour without changing selection, storage schema,
tiers, messages, palettes or unrelated site behaviour.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The approved arrival and generation (Priority: P1)

The visitor lands on `/lucky-meter`. A layered pile of maple leaves rests around the meter,
one natural gust carries every leaf away, and Start appears after a quiet beat. Pressing Start
begins the five-beat generation: the readout starts at 0, rushes to 100, falls, rises, becomes
erratic and settles on the stored 5–100 reading while the wheel stops on the same frame.

**Independent Test**: Start a reading and watch the first ~7 s. The readout's first value is 0,
its peak is 100, it reverses at least twice, and it never equals the stored result before the
last frame. The wheel stops on the stored colour on that same frame.

### User Story 2 - The cylindrical vessel (Priority: P1)

After the colour selection settles, a cylindrical glass tumbler opens over 1.4 s. The selected
colour fills it over 5 s and the full vessel is held for 0.7 s. The vessel then drains over 4 s
while the Lucky Number is revealed progressively from the top down; when the drain ends the
vessel is empty, the number is whole and the empty vessel is highlighted for 1.6 s.

**Independent Test**: A full reading shows `opening → filling → holding → draining → empty`.
During the drain, `data-vessel-fill` falls and `data-number-reveal` rises; at the empty state
the fill is 0 and the reveal is 1.

### User Story 3 - Message, celebration, Spark and dock (Priority: P1)

The exact tier message is written, held and faded, then the tier's own cinematic plays for
exactly 12,000 ms. The maple-leaf cursor then writes the saved Little Spark in 3.8–5.2 s. The
finished scene is held, and only then do Home and the daily countdown appear together in the
last row of the results panel.

**Independent Test**: Walk a reading and confirm the message, celebration, Spark and paired
dock in that order, with Home absent for the entire reveal.

### User Story 4 - Refresh policy D12 (Priority: P1)

If the page is refreshed during a celebration, the same celebration restarts from its first
frame for the full 12,000 ms. The saved percentage, Lucky Number, colour and tier are never
rerolled or re-selected, and an older stored duration never re-times the celebration.

**Independent Test**: Seed a reading with `eventCompleted: false` and a legacy `stageDurationMs`
of 9,000. The restored page mounts the same event with `data-duration="12000"` and the stored
reading is unchanged.

### User Story 5 - Functional fallbacks and preserved identity (Priority: P2)

The CSS vessel is the first paint and the permanent fallback when WebGL is unavailable or its
context is lost. It presents the same cylindrical silhouette and the same opening, filling,
draining and empty states using the stored HEX value. Reduced motion presents the completed
reading, Spark and dock at once. The Milky Way, artwork, medallion, palettes, thresholds,
messages, selection, storage and audio are unchanged, and the production build stays strictly
below 495 MiB.

## Requirements *(mandatory)*

- **FR-001**: The experience MUST follow the twelve ordered stages: anticipation, generation,
  landing, colour selection, vessel opening, pour, number reveal, message, celebration, Spark,
  hold and dock.
- **FR-002**: Generation MUST run the five beats 0 → 100 → fall → rise → erratic → settle on the
  stored 5–100 result, and MUST never show the stored result before the final frame.
- **FR-003**: The generation window MUST be 5,600 ms and the wheel MUST stop on the same frame.
- **FR-004**: The vessel MUST be the cylindrical Three.js glass tumbler on the shared creative
  surface, registered as `lucky-meter-vessel`, with no second renderer or preloader.
- **FR-005**: The vessel MUST open over 1,400 ms, fill over 5,000 ms, hold full for 700 ms,
  drain over 4,000 ms and be highlighted empty for 1,600 ms.
- **FR-006**: The Lucky Number MUST reveal progressively from the top down during the drain and
  MUST be whole when the vessel is empty.
- **FR-007**: Every tier MUST celebrate for exactly 12,000 ms.
- **FR-008**: D12 — a celebration restarted after a page refresh MUST use the full 12,000 ms
  from its beginning. Stored legacy durations MUST NOT re-time it. The saved percentage, Lucky
  Number, colour, tier and Spark MUST remain unchanged.
- **FR-009**: Home MUST sit in the last row of the results panel from the first paint, MUST be
  hidden from the moment the reveal starts, and MUST return with the countdown only after the
  Spark and the final hold. The countdown MUST NOT appear earlier.
- **FR-010**: The Spark MUST be written by the maple-leaf cursor inside 3,800–5,200 ms.
- **FR-011**: The CSS vessel MUST be a functional first-paint, no-WebGL and context-loss
  fallback with open, fill, drain and empty states and the stored colour.
- **FR-012**: Reduced motion MUST present the completed reading, Spark and paired dock without
  the cinematic.
- **FR-013**: Selection, result schema, tiers, messages, palettes, audio, the Milky Way and
  unrelated site behaviour MUST be preserved.
- **FR-014**: The production build MUST remain strictly below 495 MiB.

## Key Entities

- **Storyboard timing**: the single frozen source for every stage length and the Spark schedule.
- **Vessel beat**: `opening | filling | holding | draining | empty`, exposed for either renderer.
- **Reveal motion**: wheel angle, percentage, wheel drain, vessel fill, stream, number reveal and
  vessel open, all derived from one clock.
- **Persisted lifecycle**: `revealCompleted`, `messageCompleted`, `eventCompleted`,
  `sparkCompleted` and `stageDurationMs` in the existing version 1 payload.

## Success Criteria

- A complete run follows the twelve stages and lands within the emergent 54–57 s total.
- The five-beat generation, vessel sequence, progressive number reveal and 12,000 ms
  celebration are covered by unit and browser tests.
- D12 restart behaviour and the functional CSS fallback are covered by browser tests.
- The full Vitest suite, TypeScript check, production build, `./freebuff-verify.sh` and the
  `lucky-meter-daily-resonance` Playwright spec on desktop and both mobile projects pass.
- The measured production build is strictly below 495 MiB.

## Out of Scope

- Changing selection, the stored reading schema, tier thresholds, messages or palettes.
- Replacing the medallion, wheel, celebration or audio engines.
- New dependencies, paid infrastructure or deployment.
- Regenerating unrelated visual baselines or redesigning other pages.
