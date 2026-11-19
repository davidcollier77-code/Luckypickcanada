# Evidence: Protect the Complete Reveal Window

**Date**: 2026-11-18
**Branch**: `perf/reveal-window-protection`
**Base**: `main` at `782ac553ffdd0fbb3476e2cc403c3500f981ad4f`
**Task groups**: performance, audio, testing
**Library sources consulted**:
- `.docs/performance/_webdev_performance.md` — useful: foreground work should own the frame; deferring speculative
  work until after a user-visible task is the recommended pattern.
- `.docs/testing/_google_eng-practices.md` — useful: focused behavioural tests around the changed lifecycle.

## Cause

- `components/DailyResonance.tsx` took the hub hold inside `useEffect(() => { if (!stageActive) … })`.
  `stageActive` is set at `anticipationMs + colourSettleMs + eventDelayMs` = 8,320 ms after the press, so the
  whole pre-roll was unprotected.
- The hub itself also allowed the post-settle route warm-up to run during a reveal: `ResourceReadiness`
  prepares the current route at `critical` priority, and `nextRunnableIndex` only consulted
  `backgroundAllowed()` for `background`-priority jobs. A `background: true` resource requested as critical
  therefore ran inside the reveal — measured at **2,183 ms after the press** in a production probe of the
  pre-change build, and consistent with the audit's "background work starting 975 ms after the reveal press".

## Change

- `protectRevealWindow(duration)` takes `beginActiveExperience('lucky-meter-reveal')` synchronously in
  `handleReveal`, before any timer or state update, and in both animating resume branches of the load effect.
- `releaseRevealWindow()` runs in `handleStageComplete`, in the unmount cleanup, and from a bounded safety
  timer (`pre-roll + duration + 15,000 ms`), so the queue can never starve.
- The old `stageActive` effect was removed: one hold, taken at the press and released at completion.
- Reduced motion takes no hold (no pre-roll, no stage).
- `app/lib/resource-readiness.js`: `nextRunnableIndex` now consults `foregroundAllows`, so a resource marked
  `background: true` waits while any experience is active even when its job was requested at critical
  priority. Critical/intent work on non-background resources is unchanged, and the deferred job runs on
  release.

## Measured result

Production server (`next start`), Chromium 1440x900, `/lucky-meter`, one real reveal press, lifecycle read from
`localStorage`:

| Metric | Audit baseline | Pre-change build (this session) | After |
| --- | --- | --- | --- |
| Hold begins | only when `stageActive` (~8.3 s) | ~8.3 s | **0 ms (in the press handler)** |
| Press → reveal motions complete | 8.3 s gap | 8,511 ms | 8,435 ms / 8,372 ms |
| Press → cinematic complete | — | — | 20,800 ms / 20,516 ms |
| Competing (`background: true`) request during the reveal | one, 975 ms after press | sky 640w at **2,183 ms** | **0**; the same request starts at 20,514 ms, i.e. on release |
| Console errors | — | 0 | 0 |

The reveal's own audio cues, `/api/visits` and the button click all still occur at their usual points
(~137 ms after the press when not already preloaded), and the Spark writing still completes after the
cinematic (`sparkCompleted: true` in the final run).

## Checks

| Check | Result |
| --- | --- |
| `npx vitest run __tests__/reveal-window-protection.test.jsx` | PASS — 7 tests (press-time hold, pre-roll survival, completion release, queued background resume, critical unblocked, critical background deferred, unmount release, safety release) |
| `npx vitest run __tests__/resource-readiness.test.js` | PASS — 27 tests (hold semantics unchanged) |
| `npx vitest run` | PASS — 96 files / 995 tests |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm run build` | PASS |
| Clean production build size (`rm -rf .next && pnpm build && du -sb .next`) | 312,629,739 bytes = 298.15 MiB (limit 495 MiB) |
| `./freebuff-verify.sh` | PASS — exit 0 |
| Production browser probe | PASS — see table, 0 console errors |

## Limitations

- The completion timestamps are polled from `localStorage` every 100 ms, so press-to-completion figures carry
  up to ~100 ms of measurement error; the pre-roll itself is timer-driven and deterministic.
- The pre-change measurement was taken with the same probe against the build made before the scheduler
  change; its JSON was then overwritten by the post-change run. The figures quoted above are the probe's
  printed output.
- Hidden-tab behaviour, background-tab throttling and real device thermals are not exercised by the probe.
- The 15 s safety margin is deliberately generous; it only applies when a stage never reports completion.
