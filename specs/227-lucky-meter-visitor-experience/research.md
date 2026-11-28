# Research — Lucky Meter Visitor Experience

All findings verified against the repository on 2026-11-27.

## Timing (authoritative: `app/lib/lucky-meter/storyboard.js`)

| Beat | Constant | Cumulative from Start |
|---|---|---|
| anticipation + leaf exit | 1 000 + 900 | 1 900 ms |
| wheel spin | `wheelMs` 4 400 | stops at 6 300 ms |
| percentage window | `percentageMs` 9 400 | 11 300 ms |
| pour | `pourMs` 2 000 | ends 13 300 ms |
| number pause | `numberPauseMs` 1 500 | 14 800 ms |
| transfer | `transferMs` 2 200 | 17 000 ms |
| settle | `transferSettleMs` 700 | 17 700 ms |

**Decision**: no timing value changes. The transfer already owns a 2 900 ms window after the drain; the previous build used it for a decorative beam and popped the number in at 17 700. The new number flight fills the same window.

## Geometry (verified)

- Pointer angle 225° (`POINTER_ANGLE_DEGREES`), `data-pointer="7.5"`, `reveal.js` landing `225° − index × 30°`, and the visual spec's `settledAngle()` all agree.
- Old beam was a `CatmullRomCurve3` through `(-0.72,-0.48)`, `(-0.62,-1.02)`, `(-0.24,-1.3)`; those points lie 0.31 and 0.54 from the bowl centre with a 0.62 radius, i.e. the beam passed through the bowl.
- The pointer was a maple leaf plus a thin arm; there was no open spout mouth and no liquid inside the arm.
- Chambers were flat extruded annular sectors, and the bowl was a bucket profile on a stub foot.
- Nothing existed at the number destination: `beam.to` was `(0.16,-1.2)`, 0.32 from the bowl rim.

**Decision**: rebuild the cups as glass cylinders in a punched gold plate, replace the pointer with an open angle-cut tube, keep the faceted lathe bowl with a taller profile and a fluted foot, and add a real ornate plaque at `(0.74,-1.06)`.

## Audio (verified)

- Twelve shipped recordings; core set `buildup / segmentOpen / colourPour / dockChime`.
- Wired cues: `wheel-start` 6 300, `wheel-stop` 11 300, `colour-pour` 11 300, `number-reveal` 17 700, `dock-arrive`.
- Nothing fires at 13 300 (bowl full) or 14 800 (number detach).

**Decision**: add `bowl-full` (`colourPour` rate 0.7) and `number-depart` (`segmentOpen` rate 1.9). No new files, no new dependency.

## Test constraints (verified)

- `lucky-event-panel` is asserted nowhere; the card can be removed.
- `lucky-number-panel` must be absent before settle, so the plaque's DOM inlay mounts at arrival while the empty recess is canvas art.
- `lucky-colour-panel` carries `data-vessel-*` and must move onto the in-stage colour bar.
- `__tests__/mobile-accessibility.test.js` requires the literal kicker `<p className="text-sm tracking-widest text-slate-400 uppercase mb-4">Daily Resonance Ritual</p>`; it survives as an accessible-only line beside the canvas banner.
- `tests/visual/crystal-ball-daily-limit.spec.ts` reads "Next Resonance In" on `/lucky-meter`; renamed with the chip.
- Four responsive assertions encoded the old stacked layout (`number.y > colour.y`, desktop `flex-direction: row`); they are rewritten to the new composition at equal strictness.
- `Reveal My Resonance` appears in ~30 unit-test matchers; the rename is applied consistently.

## Alternatives considered

- Keeping the annular sectors and painting depth: rejected, the reference cups are physical objects.
- Sending the number through the spout with the liquid: rejected by the owner and by the mechanic (two results must be separate).
- A DOM-only plaque: rejected, the reference plaque is dimensional geometry.
- A new post-processing bloom: rejected, the existing tiers must stay bounded.
