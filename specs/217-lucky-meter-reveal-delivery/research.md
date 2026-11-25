# Research: Lucky Meter Reveal Hand-off and Mobile Delivery

**Feature**: `specs/217-lucky-meter-reveal-delivery`
**Date**: 2026-11-24 (fade investigation revised after owner direction)
**Inputs**: `artifacts/lucky-meter-performance-20261124` (Phase 0), repository history and source, a read-only deployed-canvas probe (`canvas-state-mobile.json`), and the fade benchmark in `evidence/fade-benchmark.json`.

---

## R1 — Canvas size and the pixel-ratio question

**Measured (deployed, mobile emulation, 8 s settle):** one visible meter; `data-meter-renderer="three"`; canvas 328×328 CSS; buffer 524×524; effective pixel ratio **1.6**; backing store **274,576 px (0.27 MP)**.

**Consequence:** the shipped meter already runs at the balanced tier's 1.6 cap. Phase 0's hypothesis text assumed DPR 3 (≈3.0 MP); that is false, and the report is corrected. The 1,976–2,118 ms `GLES2::ReadPixels` for a 0.27 MP canvas is a fixed software-GL first-composite cost, not an area cost.

**Decision:** no pixel-ratio, tier or quality change. **Alternatives rejected:** capping to 1.25 or raising to 2 — both change render density with no supporting evidence.

---

## R2 — Why the readiness timer is the portable defect

`meter-scene.js` announces readiness with `setTimeout(announceReady, 90)` after `surface.start()`. `renderer.render()` returns once commands are submitted. On a slow GPU or software compositor the timer can reveal the canvas while its first frame is still outstanding, and the first commit of a now-visible canvas waits for it — the shape Phase 0 measured.

**Decision:** gate the hand-off on a produced frame (two animation frames after the first render) with a bounded watchdog. If no frame exists within 3 s, stop the surface and keep the complete CSS meter permanently.

**Alternatives rejected:** a longer fixed delay (still a guess), `gl.finish()` (blocks the main thread), `compileAsync` alone (does not establish a frame).

**Limit:** the gate removes the premature reveal and the empty-stage wait on failure. It does not remove a slow GPU's first-frame cost.

---

## R3 — The 600 ms fade: purpose and measured impact

**Origin and purpose.** The fade arrived with the dimensional-vessel work (`eb5321f5`, #1994) as `.lucky-vessel--hidden { opacity: 0; transition: opacity 600ms ease }`, then moved onto the canvas host when the scene replaced the CSS vessel. No comment, test or token defines it. Its evident purpose is to soften the swap between the CSS approximation and the 3D scene instead of popping the canvas in. 600 ms is not a house value: the only other 600 ms reference in `globals.css` is an unrelated 1600 ms highlight animation.

**Measured impact.** 16 runs, deployed page, mobile emulation, runtime-only CSS override, cold context, 4 runs per duration; all runs reached `three` and opacity 1. Raw data: `evidence/fade-benchmark.json`.

| Requested duration | Composited transition frames (median) | Fade window after the stall (median) |
| --- | ---: | ---: |
| 600 ms | 4 (range 3–4) | 435 ms (299–463) |
| 300 ms | 2 (2) | 130 ms (111–177) |
| 150 ms | 1 (1) | ≤60 ms |
| 0 ms (diagnostic only) | 0 | 0 |

Opacity timeline for a 600 ms run: `0.00` at ready, still `0.00` for the next **2,207–2,297 ms**, then `0.35 → 0.71 → 0.92 → 1.00` across ~460 ms.

**Key finding.** The dominant 2.2–2.6 s block occurs **while the canvas is at opacity 0**. The fade runs after it. Shortening the fade therefore cannot reduce the main stall; it removes only post-stall composite frames — about 2 frames / 300 ms at 300 ms, and about 3 frames at 150 ms.

**Cost per fade frame.** Chrome long-animation-frame entries spanning the fade interval measured 0–60 ms per run with ≈0–6 ms blocking. So the fade's own main-thread cost on this software host is small (≈0–170 ms across 600 ms) and is expected to be smaller on a GPU device.

**Production-build verification (T003–T006).** 24 cold mobile runs against the current production build (`.next` 386,582,391 bytes, 368.67 MiB) reproduced the deployed shape:

| Requested duration | Median transition frames (range) | Median fade window |
| --- | --- | --- |
| 600 ms | 4 (4) | 528 ms |
| 450 ms | 3 (3) | 385 ms |
| 300 ms | 2 (2) | 249 ms |
| 225 ms | 1 (1) | 108 ms |
| 150 ms | 1 (1) | 108 ms |
| 0 ms (control) | 0 (0) | 0 ms |

Reveal-window long-animation-frame blocking was **0 ms in every run**, and the biggest reveal LoAF was 0 ms. Raw data: `evidence/fade-local-benchmark.json`; partial-opacity captures: `evidence/fade-visual/`.

**Decision (T006). Adopt 300 ms.** It removes two median transition frames (4 → 2), has no blocking regression, and remains a real ease: the transition property, timing function and endpoints are unchanged, partial-opacity frames were captured for both 600 ms and 300 ms, and at a 60 fps phone cadence 300 ms is about 18 steps. 225 ms and 150 ms collapse to a single intermediate frame on this host and are indistinguishable from a cut here, so they fail the fade-preservation test; 150 ms remains the floor rather than the choice. 450 ms also passes numerically (3 frames) but removes only one frame and leaves the partial-visibility window 55 % longer than 300 ms. The software host cannot establish perceived smoothness on a real phone; that limit is recorded, not converted into a claim. A cut was never a candidate.

**Alternatives rejected:** removing the transition (owner direction; also no effect on the main block); lengthening it; a poster-image crossfade (new asset and state for no measured gain).

---

## R4 — Pre-activation audio

**Measured source sizes** (`public/…`, bytes):

| Cue | File | Bytes | Group |
| --- | --- | ---: | --- |
| buildup | `freesound_community-starship-rail-gun-charge-35904.mp3` | 191,040 | opening |
| segmentOpen | `sounds/crystal-ball-leaf.mp3` | 16,970 | opening |
| colourPour | `sounds/mixkit-magic-sparkles.mp3` | 374,934 | opening |
| dockChime | `sounds/chime-sound.mp3` | 20,435 | opening |
| impactMeteor | `dragon-studio-whoosh-cinematic-376875.mp3` | 67,709 | event |
| impactLightning | `sounds/mixkit-cinematic-impact.mp3` | 279,188 | event |
| fireworkBurst | `freesound_community-fireworks-1-94483.mp3` | 222,720 | event |
| fireworkBurstAlt | `sounds/mixkit-magical-impact.mp3` | 143,743 | event |
| willowCrackle | `sounds/mixkit-firework-crackle.mp3` | 707,598 | event |
| fireworkLaunch | `sounds/mixkit-firework-whistle.mp3` | 23,218 | event |
| finaleBoom | `sounds/lucky-meter-finale-boom.wav` | 201,286 | event |
| thunderRumble | `sounds/lucky-meter-thunder-rumble.wav` | 705,644 | event |

Opening group ≈ **603,379 bytes (589 KiB)**; event group ≈ **2,351 KiB**. Phase 0 measured 2,889 KiB requested 3.0–5.4 s after load with no Start press; the activation path also prepares audio, so route-time readiness preparation spends the bytes early.

**Decision:** keep one Howl set and one prepare API; create event cues with `preload: false`. Howler fetches on first `play()` and queues that playback until ready. Opening cues stay eager.

**Alternatives rejected:** splitting the module into two sets and APIs (two sources of truth for one sound set); removing audio from the readiness manifest (loses the opening-cue warm-up); deferring everything to activation (the opening cue fires then, so it would be late).

**Risk:** an event cue needed immediately after activation would load late. The cue map places the first celebration cues after the wheel sequence; the plan verifies request timing and moves any early cue to the eager group.

---

## R5 — Evidence limits

- No hardware GPU and no physical phone here; `gpu_compositing: disabled_software`, and PSI shares that limit.
- The 2,605 ms hardware observation cannot be reproduced here. The feature removes a premature reveal and a known post-stall composite burst; it does not claim the 2.6 s figure is fixed.
- Device criterion SC-006 is verified on a GPU-compositing device or recorded outstanding.

---

## R6 — Deliberately out of scope

- Reducing GPU first-frame work (10 programs, 46 draw calls, instancing, precompile) — needs a GPU baseline.
- `alpha: false` (the scene clears transparent so the sky shows through).
- Removing or shortening the 4 s idle animation.
- Keeping the fallback mounted through the fade (see R7) — a separate owner decision.
- Any new preloader, audio system, dependency, service, route, deployment or quality tier.

---

## R7 — Empty-stage observation (implemented after owner approval)

The fallback unmounts as soon as `renderMode` becomes `three`, while the canvas is still at opacity 0. Measured on the production build (24 cold runs): the fallback was removed at **823–940 ms**, the first visible canvas frame arrived at **2,790–3,157 ms**, and the stage therefore showed neither meter for **1,976–2,304 ms** (median ≈2,127 ms). In 19 of 24 runs the opacity transition did not start until ≈2 s after the removal (`transitionrun` 2,837–3,067 ms); in 5 runs it fired at removal and the first visible frame still arrived ≈2 s later. A MutationObserver cannot repair this: the removal and the first-composite stall happen in the same task, so the callback runs only after the stall. Keeping a meter on screen through the interval requires deferring React's removal itself.

A runtime-only simulation that deferred the fallback removal until the first visible canvas frame (3 runs each at 600 ms and 300 ms) held the complete CSS meter for **1,957–2,213 ms**, reduced the empty stage to **0 ms**, and left the fade (4 / 2 transition frames) and blocking (0 ms) unchanged. The mid-stall capture shows the complete CSS meter rather than an empty stage.

**Implemented (owner-approved).** In `components/LuckyMeterStage.jsx`, the fallback stays mounted while `renderMode === 'three'` until the canvas host's computed opacity leaves 0 (animation-frame samples) or `transitionend` fires; the existing 300 ms fade is unchanged. It is not tied to `transitionrun` (it fired at removal in 5 runs) or `transitionstart` (it can precede the composited frame). A 6 s guard stops polling but never removes the fallback while opacity is 0, so a long first composite cannot recreate the empty stage; if the transition finishes later, `transitionend` retires it. Context loss resets the hold. Playwright on desktop, mobile-390 and mobile-412 recorded the ready canvas at opacity 0 with the fallback present and removal only at opacity > 0; the full Lucky Meter suite passed 54/54 with 6 opt-in captures skipped.

---

## R8 — Decision rule for the fade (binding on implementation)

1. Measure 600, 450, 300, 225 and 150 ms on the local production build, four cold runs each.
2. A shorter duration is adopted only if it reduces the median composited transition frames by at least one **and** does not worsen the reveal-window blocking beyond run-to-run noise.
3. The chosen duration must still read as a fade in the captured midpoint evidence, and must be at least 150 ms.
4. If neither 300 nor 225 ms passes, retain 600 ms and record that the existing experience was kept.
5. A 0 ms variant is a diagnostic control only; it is never a candidate.

**Result (T006).** The production build produced 4 / 3 / 2 / 1 / 1 / 0 median transition frames for 600 / 450 / 300 / 225 / 150 / 0 ms, with 0 ms reveal blocking in all 24 runs. **300 ms was adopted.** 225 ms and 150 ms were rejected because a single intermediate frame reads as a cut on this host; 450 ms passed but was not preferred because it removes only one frame. 600 ms was not retained. The fade itself is unchanged apart from its duration.
