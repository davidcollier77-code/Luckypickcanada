# Missing-meter interval: findings and proposed solution

**Status:** investigation complete; owner approved the retained-fallback hand-off on 2026-11-24 and it is implemented in `components/LuckyMeterStage.jsx`.
**Scope:** the interval in which neither the CSS fallback nor a visible WebGL meter is on screen during the Lucky Meter hand-off.
**Evidence:** `fade-local-benchmark.json` (24 cold mobile runs), `fallback-handover.json` (runtime-only retained-fallback simulation), `fade-visual/600ms-retained-stall.png`.
**Host:** software compositing, no hardware GPU, no physical phone (`gpu_compositing: disabled_software`).

## 1. What happens today

The fallback rendered until React set `renderMode = 'three'`, which happens when the scene announces readiness. The same render added `is-ready` to the canvas host (starting the opacity transition) and unmounted the fallback. The canvas was still at opacity 0 at that moment. This section records the pre-change behaviour; the implemented result is in section 4.

Measured on the production build:

| Measurement | 600 ms duration (24 runs) |
| --- | --- |
| Fallback removed | 823–940 ms |
| First visible canvas frame (opacity > 0) | 2,790–3,157 ms |
| Time with neither meter visible | **1,976–2,304 ms** (median ≈2,127 ms) |
| `transitionrun` | 2,837–3,067 ms in 19 runs; at removal in 5 runs |
| `transitionend` | 2,905–3,712 ms |

The same interval appears at every duration. The fade runs after it; shortening the fade does not change it. This is the interval Phase 0 attributed to the first compositor commit of the now-visible WebGL canvas, which on this host performs a synchronous software readback.

## 2. Why scripts cannot repair it after the fact

The fallback removal and the first-composite stall are in the same browser task. A `MutationObserver` callback therefore runs only after the stall: in the first simulation attempt the reinserted clone appeared at ≈3.8 s, after the canvas was already visible. A `requestAnimationFrame` callback is blocked for the same reason. No code that runs after the removal can put a meter back on screen in time.

`transitionrun` is also not a reliable "the canvas is visible" signal: in 5 of 24 runs it fired at the removal moment, yet the first composited frame still arrived ≈2 s later.

## 3. Can the fallback remain visible until the canvas is ready?

Yes. A runtime-only simulation deferred React's fallback removal in the page and retired it at the first visible canvas frame (opacity > 0). Three runs at 600 ms and three at 300 ms:

| Measurement | Simulation result |
| --- | --- |
| Fallback held after readiness | 1,957–2,213 ms |
| Empty stage | **0 ms** |
| Transition frames | 4 (600 ms) / 2 (300 ms), unchanged |
| Reveal blocking | 0 ms, unchanged |
| Layout / composition | complete CSS meter visible mid-stall (`fade-visual/600ms-retained-stall.png`) |

The CSS meter is an absolutely positioned, `aria-hidden`, pointer-transparent sibling underneath the canvas host. Keeping it mounted does not change layout, the readout, the fade, the scene, the audio or the render tier. It simply removes the empty interval.

## 4. Implemented solution (owner-approved)

Only `components/LuckyMeterStage.jsx` changed:

1. The fallback stays rendered while `renderMode === 'three'` until the canvas host's computed opacity leaves 0, sampled on animation frames, or `transitionend` fires for opacity.
2. At the first non-zero opacity sample the fallback retires; the existing 300 ms fade continues over the incoming canvas exactly as before.
3. A 6 s guard stops animation-frame polling if no signal arrives, but it never removes the fallback while opacity is 0. The canvas is then still invisible, so the complete CSS meter is the correct art; `transitionend` can still retire it later. This avoids the race in which a fixed timer removed the fallback during a long first-composite stall.
4. Context loss resets the hold, so the fallback returns immediately as before; context restore re-arms it.

No scene, CSS, audio, timing, layout, render-density or dependency change was required. Playwright on desktop, mobile-390 and mobile-412 observed the ready canvas at opacity 0 with the fallback still mounted, and removal only after opacity became greater than 0; exactly one opacity transition ran. The full Lucky Meter browser suite passed 54/54 with 6 opt-in capture tests skipped.

## 5. Trade-offs and risks

- **Visible behaviour change:** during the first-composite wait the visitor sees the complete CSS meter instead of an empty stage. This was the intended improvement and was explicitly approved by the owner before implementation.
- **Brief overlap:** the fallback is retired on the first visible canvas frame, so it overlaps for at most that frame. There is no full crossfade and no long double-image period.
- **Stuck fallback:** bounded by the retirement fallback; if the canvas never becomes visible, the CSS meter is the correct permanent result.
- **Reduced motion / context loss:** the same rule applies; the fallback is already the recovery surface.
- **No GPU claim:** the simulation is software-path evidence. It shows the interval is removable in the DOM; it does not measure a phone's first-frame cost.

## 6. Relationship to the approved reveal gate

The approved produced-frame gate is still required: it stops the timer from announcing readiness before the renderer has produced a frame, and it adds the bounded no-frame watchdog. It does **not** by itself remove the missing-meter interval, because `requestAnimationFrame` is not a compositor-presentation guarantee. The two changes are complementary:

- the gate decides **whether** the renderer is ready;
- deferring the fallback removal decides **when the CSS meter may leave** the screen.

The second change was approved and implemented alongside the gate; both are part of the Spec 217 result.
