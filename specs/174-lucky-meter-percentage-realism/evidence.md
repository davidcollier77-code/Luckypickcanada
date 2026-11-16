# Evidence: Percentage-Owned Reveal and Natural Leaf Realism

**Feature**: `specs/174-lucky-meter-percentage-realism`

**Date**: 2026-11-16

**Branch**: `freebuff/e2195ad8bebbd7fee909bb91`

All evidence below was produced in this workspace. The AZ Screen Recorder video
referenced in the mission was **not** available and was not viewed; the
observations used are the owner's written notes plus the fresh captures here.

## 1. Boundary mapping (unit + browser)

`app/lib/lucky-meter/config.js` now carries:

| Band | Tier | Event | Numbers |
| --- | --- | --- | --- |
| 5–30 | Low | Meteor Shower | 3, 9, 21 |
| 31–65 | Medium | Lightning | 11, 22, 33 |
| 66–100 | High | Fireworks | 7, 8, 77 |

Covered by `__tests__/lucky-meter-selection.test.js` (all boundaries, clamping,
event derivation, repeat guard) and by the Playwright spec:

```
[desktop]  5% is low with its tier's event and numbers
[desktop]  30% is low with its tier's event and numbers
[desktop]  31% is medium with its tier's event and numbers
[desktop]  65% is medium with its tier's event and numbers
[desktop]  66% is high with its tier's event and numbers
[desktop]  100% is high with its tier's event and numbers
... same six on mobile-390 and mobile-412
```

Each assertion compares `data-value`, the tier label, the event name and the
three number chips against the same percentage.

## 2. The dial lands on the number it shows

`DailyResonance` seeds a reading, spins to `percentage × 3.6°` and exposes
`data-dial-angle` on `[data-testid="lucky-meter-ring"]`. The Playwright test
"stops on the displayed percentage and reveals that percentage's tier" reads
both the angle and the number after the ring reports `data-phase="landed"` and
asserts `|angle − value × 3.6| ≤ 1°`, including the 0°/100 % wrap.

Captured pointer positions confirm the mapping by eye:

- 49 % → pointer at 176° (just left of six o'clock) — `desktop-dial-spin.png`
- 90 % → pointer at 324° (upper left) — `desktop-landed.png`
- 94 % → pointer at 338° (upper left) — `desktop-result.png`
- 75 % → pointer at 270° (nine o'clock) — `mobile-390-result.png`

## 3. Saved-result normalization

Seeding `{ percentage: 72, tier: low, event: low-meteor, colour: maple-red,
spark: spark-12, dateKey: today }` renders High / Fireworks / 7-8-77 while the
percentage, colour and Spark are unchanged. Covered by
"normalises a stale saved tier and event from its percentage" on all three
projects and by `lucky-meter-selection.test.js`.

## 4. Commands and results

| Command | Result |
| --- | --- |
| `pnpm exec vitest run` (9 Lucky Meter suites) | 90 tests passed |
| `pnpm exec tsc --noEmit` | clean |
| `pnpm exec playwright test tests/visual/lucky-meter-daily-resonance.spec.ts --workers=3` | 45 passed, 6 skipped (capture block), 1.9 min |
| `pnpm build` | compiled successfully, `Build completed successfully` |
| `du -smc .next public` | 423 MiB total (`.next` 389, `public` 34) — below the 495 MiB cap |
| `./freebuff-verify.sh` | see `artifacts/lucky-meter-visual-realism-20261116/freebuff-verify.log` |

The Playwright spec also covers reveal ordering (percentage/tier → numbers →
details → event), reduced motion, the no-WebGL fallback, and stage cleanup
returning Home after the cinematic.

## 5. Screenshots

Before (baseline, captured from the commit `8ae82df0` worktree):
`artifacts/lucky-meter-visual-realism-20261116/before/`
— `desktop-1440-welcome.png`, `desktop-1440-result.png`,
`mobile-390-result.png`, `mobile-412-result.png`.

After (`artifacts/lucky-meter-visual-realism-20261116/after/`, captured by the
opt-in Playwright block with `LUCKY_METER_CAPTURE=1`):

| File | What it shows |
| --- | --- |
| `desktop-welcome.png` | welcome state, thin leaves against the Milky Way |
| `desktop-dial-spin.png` | dial mid-spin, pointer at 176° while the number reads 49 % |
| `desktop-landed.png` | dial landed at 90 % with the pointer matching |
| `desktop-result.png` | finished reading at 94 %, panels and CTA |
| `desktop-fireworks-finale.png` | golden finale with embers over the reading |
| `mobile-390-welcome/-dial-spin/-landed/-result.png` | 390×844 equivalent |
| `mobile-412-welcome/-dial-spin/-landed/-result.png` | 412×915 equivalent |
| `mobile-390-fireworks-finale.png`, `mobile-412-fireworks-finale.png` | finale on phones |

The finale capture waits for the engine's own `finaleSpawned` flag through
`window.__LUCKY_METER_DEBUG__` (enabled only by the capture test), so it lands
on the golden shell rather than guessing at wall-clock time.

## 6. What was not verified

- Audio was not recorded or listened to in this environment. The existing cues
  and their scheduling are unchanged by this work; the audio playback suites
  pass, but "audible" is not something these captures can prove.
- The AZ Screen Recorder video was not watched.
- Screenshots are static frames; motion smoothness was assessed through the
  Playwright interactions, not by watching a recording.

## 7. Live deployment verification (2026-11-16)

The merged deployment (squash commit `21d03280` on `main`, served from
https://luckypickcanada.ca/lucky-meter) was driven directly. The random source
was pinned only around the draw so each generated percentage was exact rather
than a lucky landing; every expectation below is read from the live DOM and the
live `localStorage` record.

| Forced % | Displayed | `data-dial-angle` | Tier shown | Event (stage) | Numbers |
| --- | --- | --- | --- | --- | --- |
| 5 | 5 | 18.00° | Low Resonance | meteor | 3/9/21 |
| 30 | 30 | 108.00° | Low Resonance | meteor | 3/9/21 |
| 31 | 31 | 111.60° | Medium Resonance | lightning | 11/22/33 |
| 65 | 65 | 234.00° | Medium Resonance | lightning | 11/22/33 |
| 66 | 66 | 237.60° | High Resonance | fireworks | 7/8/77 |
| 100 | 100 | 360.00° | High Resonance | fireworks | 7/8/77 |

- **Saved result**: a seeded `{percentage: 72, tier: low, event: meteor,
  colour: maple-red, spark: spark-12, createdAt: 1700000000000}` renders
  High / Fireworks / 7-8-77, keeps Maple Red, #B52B32, the Spark id and the
  original `createdAt`, and does not clear the record (the stored tier stays
  `low`; the reveal is normalized on every read). `storedTier: low, shown: high`.
- **Three-day guard**: with `events: ['lightning','lightning',…]` and a forced
  50 %, the live draw landed on **67 % High**, so the Lightning band was blocked
  and the range still produced a reading.
- **Reduced motion**: the live 31 % reading presented with angle 111.60° and no
  cinematic stage.
- **WebGL**: the reveal completed at 66 % with the Fireworks stage. The probe's
  context override did not force the fallback on the live bundle (the medallion
  still reported `gpu`), so the no-WebGL layout itself is evidenced by the
  local Playwright suite, not by this live run.

### Defect found on the live site

The deployed script contained the new dial logic (`data-dial-angle`) but the
deployed stylesheet contained **none** of the `.resonance-dial*` rules, so the
index rendered as two unstyled spans: computed `position: static`, `width:
auto`, `background: none`. The dial's stopping position was therefore invisible
on production — the live 31 % screenshot shows a clean rim with no pointer.

Fix: the arm and head now carry their geometry, gradient and glow as inline
styles with `data-testid` hooks, and the dead CSS block was removed. A local
production build then reported `position: absolute`, `width: 2px`, resolved
height 51.83 px and the brass gradient, with the head at 9 px, at 1440, 390 and
412 widths, while every boundary angle above stayed exact.

### Preservation proof

- All six Milky Way assets (`lucky-meter-night-sky*` AVIF/WebP at 640/1024/1400)
  are byte-identical to `main`: `git diff --stat main..HEAD -- public/images/…`
  is empty.
- The `<picture>` element in `components/DailyResonance.tsx` is byte-identical
  to `main` (1184 characters compared programmatically).
- Every changed path is inside the Lucky Meter, its tests, the spec/evidence,
  the task artifacts or the Memory Bank; the filtered diff outside those
  prefixes is empty.
