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
| Browser, desktop | `./scripts/playwright-cli.sh test tests/visual/lucky-meter-daily-resonance.spec.ts --project=desktop` | 13 passed, 1 opt-in skip |
| Browser, 390 px | `... --project=mobile-390` | 13 passed, 1 opt-in skip |
| Browser, 412 px | `... --project=mobile-412` | 13 passed, 1 opt-in skip |
| Mobile accessibility | `... tests/visual/mobile-accessibility.spec.ts --project=mobile-390 --project=mobile-412` | 12 passed (both mobile projects, six routes each) |
| Crystal Ball control | `... tests/visual/crystal-ball-interactions.spec.ts --project=desktop` | 1 passed (the CI failure did not reproduce) |
| Evidence capture | `LUCKY_METER_CAPTURE=1 ./scripts/playwright-cli.sh test ... --grep "captures the arrival"` | 2 passed |
| Repository gate | `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh` | exit 0 (Spec Kit gate, governance, type check, build and 48 docs tests) |
| Production size | clean `rm -rf .next && pnpm run build`, then `.next` + `public` | 350 MiB (`du -sm`; 334.28 MiB actual), below 495 MiB |
| Advisory checkers | `checker_suite.py performance` and `test-quality` on the eight changed source/test files | no findings |

The skipped Playwright test is the opt-in evidence block; it passes when `LUCKY_METER_CAPTURE=1` is set, as
recorded above.

## Review repairs (PR #1964)

The repository owner asked for a review and repair of the open PR. Confirmed findings were fixed; potential findings without a reproduction were not treated as defects.

| Finding | Disposition |
| --- | --- |
| The welcome-screen pointer used a gradient defined only inside the conditional wheel SVG, so it painted as a dark outline. | **Fixed.** The gradient now lives in the always-mounted pointer SVG, and the arrival browser test asserts it exists before a reading. |
| The arrival fallback timer was hard-coded to 4,300 ms instead of the storyboard total (1,750 + 1,300 + 700 = 3,750 ms). | **Fixed.** `ARRIVAL_TOTAL_MS` is derived from `STORYBOARD_TIMING` and used by the fallback. |
| `DailyResonance` duplicated `colourPointerRotation` with hard-coded 180°/30°. | **Fixed.** All call sites use the shared `reveal.js` export. |
| `playEventCue` was listed as a dependency of `handleReveal` but was not called there. | **Fixed.** Removed the unused dependency. |
| The tier-message writer reused the Spark punctuation constant. | **Fixed.** Added a dedicated `messagePunctuationPauseMs` with the same 220 ms value so the two writers can evolve independently. |
| Two legacy audio paths omitted the `/sounds/` prefix. | **Verified.** Both files ship from `public/`; the intentional root paths are now documented beside the source map. |
| Mobile `/lucky-meter` and `/` exposed 10–11 px reading text, failing the 12 px Visual QA floor. | **Fixed.** Lucky Meter labels, result text, countdown and Spark header, plus the homepage visits pill, are 12 px. |
| The `landed` phase is a deliberate 450 ms beat that locator polling can miss. | **Test fixed.** The browser test records phase transitions from the first frame and stops its animation-frame loop on `revealed`. |
| Crystal Ball Visual QA failure appeared in the same shard run. | **Not reproducible.** The exact desktop test passes locally (1 passed); no Crystal Ball code changed. |
| WebGL context-loss hardening suggestion. | **Not changed.** It remains a potential hardening follow-up; no context-loss reproduction was available and this repair did not touch the renderer lifecycle. |

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
