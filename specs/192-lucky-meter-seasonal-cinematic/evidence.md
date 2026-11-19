# Evidence: Lucky Meter Seasonal Cinematic Experience

**Feature**: `specs/192-lucky-meter-seasonal-cinematic`

**Captured**: 2026-11-19

## Before / after

| View | Before | After |
| --- | --- | --- |
| Desktop welcome | `artifacts/lucky-meter-seasonal-cinematic-20261119/before/desktop-welcome.png` | `.../after/desktop-welcome.png` |
| Desktop result | `.../before/desktop-result.png` | `.../after/desktop-autumn.png` |
| Mobile 390 welcome | `.../before/mobile-390-welcome.png` | `.../after/mobile-390-welcome.png` |
| Mobile 390 result | `.../before/mobile-390-result.png` | `.../after/mobile-390-autumn.png` |

Season results captured on desktop and mobile-390: `desktop-{winter,spring,summer,autumn}.png` and
`mobile-390-{winter,spring,summer,autumn}.png`.

The "before" images are the approved previous Lucky Meter (three staggered settles, fixed palette, raised
Spark panel). The "after" images are a completed seeded reading so the wheel, vessel, number, event and dock
are all visible at once.

## Commands and results

| Check | Command | Result |
| --- | --- | --- |
| Type check | `pnpm exec tsc --noEmit` | exit 0 |
| Full unit suite | `pnpm exec vitest run` | 101 files / 1,046 tests passed |
| Browser, desktop | `pnpm exec playwright test tests/visual/lucky-meter-daily-resonance.spec.ts --project=desktop` | 13 passed, 1 skipped |
| Browser, 390 px | `... --project=mobile-390` | 13 passed, 1 skipped |
| Browser, 412 px | `... --project=mobile-412` | 13 passed, 1 skipped |
| Evidence capture | `LUCKY_METER_CAPTURE=1 pnpm exec playwright test ... --grep "captures the arrival"` | 2 passed |
| Repository gate | `./freebuff-verify.sh` | exit 0 (type check, build, Spec Kit gate, governance and docs tests) |
| Production size | clean `pnpm run build`, then `.next` + `public` | 350 MiB (`du -sm`; 334.5 MiB actual), below 495 MiB |

The skipped Playwright test is the opt-in evidence block; it passes when `LUCKY_METER_CAPTURE=1` is set, as
recorded above.

## Visual findings

- The pointer is a gold maple leaf fixed at 6 o'clock; the twelve-season wheel rotates beneath it.
- The selected segment drains into the colour vessel and the number is progressively uncovered.
- Home and the countdown share the upper-right dock only after the Spark is written.
- Autumn, Winter, Spring and Summer wheels use their own exact config colours and the panel matches.
- The Milky Way artwork, position and overlay are unchanged.

## Limitations

- No hardware GPU is available in the capture environment; the medallion is software-rendered.
- Audio cue scheduling is verified by unit tests; the recordings were not listened to in this environment.
- The WebGL fallback is exercised by blocking `getContext('webgl')`, not by disabling a real GPU.
