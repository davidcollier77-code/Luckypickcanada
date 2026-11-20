# Implementation Plan: Lucky Meter Twelve-Stage Cinematic Polish

**Branch**: `freebuff/e2b73e42c5b7204636ab22eb` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/199-lucky-meter-twelve-stage-polish/spec.md`

## Summary

Turn the existing Lucky Meter storyboard into one continuous twelve-stage
cinematic: a layered foreground leaf pile that is carried away by one gust, a
plaque-free 5–100 percentage generation, a seasonal colour settle, a
three-dimensional transparent vessel that opens before it is filled, a Lucky
Number held until the drain completes, the existing tier celebrations at their
established lengths, a maple-leaf Spark cursor, a real final hold and finally
the paired Home/countdown dock.

The work is presentation only. Selection, storage, tiers, messages, palettes,
celebrations, the Milky Way artwork and the shared graphics/readiness/audio
systems are reused unchanged.

## Technical Context

**Language/Version**: JavaScript and TypeScript on Node.js 26.x

**Primary Dependencies**: Next.js 16 App Router, React 19, Tailwind CSS 4,
Howler.js (existing), the existing hand-written WebGL engines. No new
dependency.

**Storage**: Local Storage only, unchanged.

**Testing**: Vitest + Testing Library; Playwright Test (desktop, mobile-390,
mobile-412); repository gate `./freebuff-verify.sh`.

**Target Platform**: Web, Cloudflare Pages production, mobile and desktop.

**Project Type**: Web application (single Next.js project).

**Performance Goals**: No new frame loops, contexts or downloads. The arrival
pile is one Canvas 2D surface that unmounts after the breeze; the vessel is DOM
and CSS 3D, so no additional WebGL context is created.

**Constraints**: Production build strictly below 495 MiB; no competing renderer
or preloader; preserve every WebGL path and Canvas fallback; preserve reduced
motion.

**Scale/Scope**: One experience route (`/lucky-meter`) and its supporting
graphics/audio modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Preserve existing identity and artwork: **PASS** — Milky Way, medallion,
  seasonal palettes and celebrations untouched.
- Extend the shared toolkit rather than compete: **PASS** — no new renderer,
  no new preloader, no new dependency; the arrival stays on the existing Canvas
  capability layer and the vessel adds no rendering context.
- Build size: **PASS** — no dependency or asset added.
- Security and data boundaries: **PASS** — no server, storage or network change.
- QA preservation: **PASS** — the automated checkers and Playwright specs are
  kept; only assertions that encode the superseded timing/composition contract
  are updated to the new contract.

## Project Structure

### Documentation (this feature)

```text
specs/199-lucky-meter-twelve-stage-polish/
├── spec.md
├── plan.md
└── tasks.md
```

### Source (repository root)

```text
app/lib/lucky-meter/storyboard.js        # the single twelve-stage clock
app/lib/lucky-meter/reveal.js            # 5–100 generation sampling
app/lib/lucky-meter/arrival-leaves.js    # layered foreground pile + breeze
app/lib/lucky-meter/event-audio.js       # cue map (number reveal cue)
components/LuckyMeterArrivalLeaves.jsx   # pile renderer, depth order
components/DailyResonance.tsx            # stage controller and vessel markup
components/LuckyMeterSkyWriting.tsx      # maple-leaf writing cursor
app/globals.css                          # vessel, cursor, flash, settle
```

## Phase 0 — Research and decisions

1. **Where the twelve stages live.** `app/lib/lucky-meter/storyboard.js` is
   already the single source read by the component, the copy animators, the
   audio cues and the tests. It gains the new keys, constants and the twelve
   ordered stage descriptors. No second timeline is introduced.
2. **How the vessel is rendered.** The existing shared graphics toolkit is
   reused for the medallion and celebrations, but a second WebGL context for a
   small glass box would cost a context and a draw loop for no gain. The vessel
   is therefore DOM + CSS 3D (`perspective`, `preserve-3d`, layered faces) on
   the established Medallion Gold palette. This keeps the existing WebGL paths
   intact and adds no renderer.
3. **How the pile stays cheap.** The existing arrival canvas, capability layer,
   pixel-ratio cap and reduced-motion path are kept. Only the composition,
   layer depth and count change; the leaf path, shadows and sheen are reused.
4. **How the number stays honest.** `numberReveal` is driven to `0` for the
   whole drain and to `1` only when the pour timer completes, so no frame can
   expose the draw early. The placard renders only when `numberSettled`.
5. **How the timing reaches ~40 s without shortening a finale.** Only the
   non-celebration stages are lengthened. The event duration remains the value
   already stored per result and validated against the documented window.

## Phase 1 — Design

### Storyboard

| # | Stage | Window |
| --- | --- | --- |
| 1 | ready | leaf pile holds (pre-Start) |
| 2 | breeze | gust carries the pile away (pre-Start) |
| 3 | generation | anticipation + generation, plaque hidden, 5–100 |
| 4 | colourSelect | landing beat + seasonal colour settle |
| 5 | vesselOpen | the vessel unfolds and opens |
| 6 | pour | drain and fill on one clock |
| 7 | numberReveal | reveal, two flashes, settle |
| 8 | message | tier sentence written, held, faded |
| 9 | celebration | the tier's own cinematic, full length |
| 10 | spark | maple-leaf cursor writes the Little Spark |
| 11 | hold | the completed scene is held |
| 12 | dock | Home and countdown arrive together |

`buildStoryboard()` exposes exactly these twelve ids for post-Start stages and
the tests assert that every window meets its neighbour.

### Contracts

- `STORYBOARD_TIMING` keys are the only timing inputs.
- `sampleGenerationPercentage(elapsed, duration, final)` returns 5–99 while
  moving and the exact result on the final frame.
- `createArrivalLeaves(random, count, viewport)` returns back-to-front leaves
  below `y = 0.55` on desktop and `y = 0.72` on a phone.
- `sampleArrivalLeaf` supports `driftSign` so the gust opens out from the centre.

## Phase 2 — Implementation

1. Retime and extend the storyboard, and add the twelve-stage descriptor list.
2. Rewrite the arrival composition as a four-layer foreground mound plus side
   drifts, with depth ordering and bi-directional dispersal.
3. Change generation sampling to the real 5–100 scale and start the readout on
   the scale minimum.
4. Remove the continuous drifting-leaf ornament layer from the route.
5. Split the pour into vessel-open and pour progress, holding the number reveal
   at zero until the drain completes; add the two-flash reveal.
6. Replace the flat colour card with the three-dimensional vessel and a flat,
   readable caption.
7. Replace the sky-writing dot with the maple-leaf cursor.
8. Add the number-reveal cue and time the pour cue to the first drop.
9. Update the affected unit and Playwright assertions to the new contract.

## Phase 3 — Verification

1. Focused Vitest suites for the storyboard, reveal, arrival, sky writing,
   audio, lifecycle and daily experience.
2. Full Vitest suite, `tsc --noEmit`, `./freebuff-verify.sh`.
3. Production build and measured size below 495 MiB.
4. Playwright `lucky-meter-daily-resonance` spec on all three projects, plus a
   recorded full-sequence walk and reduced-motion check.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| CSS 3D flattens when a `filter` is applied to the transformed element | The drop shadow lives on the scene wrapper, not on the `preserve-3d` element |
| A longer sequence makes restore points stale | Restore logic is unchanged; the stored duration still governs the celebration |
| Retiming silently breaks an assertion that encoded the old contract | Every timing assertion was updated explicitly to the new contract, not deleted |
| The pile covers the Start control | Composition is bounded below the copy column and asserted in tests |
