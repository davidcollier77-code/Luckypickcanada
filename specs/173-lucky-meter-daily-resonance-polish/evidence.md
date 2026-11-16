# Evidence: Daily Resonance Polish

## Captures

Harness: `artifacts/lucky-meter-resonance-20261116/capture.mjs`, run against the
local dev server with a deterministic seeded result per tier/event
(`Math.random = 0.5`, `?preview_event=`). The same harness, beats and viewports
produced both sets, so the pairs differ only by the code under test.

| Path | What it shows |
|---|---|
| `before/result-{low,medium,high}-{meteor,lightning,fireworks}.png` | Event-keyed numbers: the same tier shows a different triplet per event (for example `medium-meteor` 3-9-21 and `medium-lightning` 11-22-33) |
| `after/result-*.png` | Every event of a tier shows the tier's triplet (Low 3-9-21, Medium 11-22-33, High 7-8-77) |
| `before/result-medium-lightning.png` | All supporting panels visible in the same beat as the numbers |
| `after/result-medium-lightning.png` | Numbers plate first, then event/colour, then Spark, Share and countdown |
| `before/event-*.png` | Uniform gold leaves, additive sparks only |
| `after/event-meteor.png` | Visible airborne meteors, graded trails, wind-carried autumn leaves |
| `after/event-lightning.png` | Branching strike with near bolt and receding channel |
| `after/event-fireworks.png` | Bursts plus the larger finale shell and shockwave |
| `before/welcome-desktop.png`, `after/welcome-desktop.png` | The stage behind the welcome state, including leaf palette change |
| `before/result-mobile-high-fireworks.png`, `after/result-mobile-high-fireworks.png` | 412 px reading order and fit |
| `before/reduced-motion-low-meteor.png`, `after/reduced-motion-low-meteor.png` | Complete reading, no stage |
| `before/webgl-fallback-lightning.png`, `after/webgl-fallback-lightning.png` | Static CSS fallback with the same numbers |

`capture-report.json` records the DOM values read at each capture, including
`numbers` per tier/event, `mobileNumbers`, `reducedMotionStage: 0` and
`fallbackGlow: 1`.

## Checks actually run

| Check | Command | Result |
|---|---|---|
| Type check | `pnpm exec tsc --noEmit` | PASS, exit 0 |
| Unit/integration suite | `pnpm exec vitest run` | PASS, 87 files, 851 tests |
| Browser suite, all projects | `./scripts/playwright-cli.sh test tests/visual/lucky-meter-daily-resonance.spec.ts --reporter=list` | PASS, 39 tests (desktop, mobile-390, mobile-412) |
| Repository gate | `./freebuff-verify.sh` | PASS, exit 0, 36 updater tests passed |
| Production build size | `du -sb .next public` | PASS, 413 MiB (`.next` 398 MiB, `public` 34 MiB) against the 495 MiB cap |

The browser run uses software rendering (no `/dev/dri` in this workspace), so it
verifies composition, timing, DOM order, reduced motion, fallback and cleanup,
not hardware-GPU frame rate. Audio is verified as cue mapping, queue timing,
gain layering and lifecycle, not by measuring the speakers' output.

## Finale distinctness

`lucky-meter-event-audio.test.js` asserts that the finale's total gain exceeds
every regular pop by a clear margin, that the body layer is lower than the pop's
pitch, and that no layer exceeds unity; `lucky-meter-event-audio-playback.test.jsx`
asserts that a finale detonation starts all of its layers while a regular burst
starts exactly one. The after capture shows the corresponding visual difference:
larger shell, shockwave and a longer golden fall.

## Assets

No audio or image asset was added, replaced or removed. The existing recordings
cover the cues, the new layers reuse them at different rates and gains, and the
provenance record in `public/sounds/lucky-meter-cinematic-audio-sources.md`
remains accurate without change.
