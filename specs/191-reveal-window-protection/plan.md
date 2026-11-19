# Implementation Plan: Protect the Complete Reveal Window

**Feature**: `specs/191-reveal-window-protection`

**Branch**: `perf/reveal-window-protection`

**Base**: `main` at `782ac553`

## Summary

`components/DailyResonance.tsx` held the hub's foreground only while `stageActive` was true. `stageActive` is
set at `anticipationMs + colourSettleMs + eventDelayMs` (8,320 ms) after the press, so the entire pre-roll was
unprotected and the audit saw background work start 975 ms after the press. The hold now moves to the
activation handler: `protectRevealWindow` takes it synchronously, every resume path takes it before its first
animation, and completion, unmount and a bounded safety timer release it.

## Technical Context

- **Runtime**: Next.js 16.4.5, React 19.3.1; hub in `app/lib/resource-readiness.js`
  (`beginActiveExperience`, `isExperienceActive`).
- **Component**: `components/DailyResonance.tsx` (real reveal, framer-motion, Howler, canvas).
- **Tests**: `__tests__/reveal-window-protection.test.jsx` renders the real component against the real hub with
  fake timers and a mocked stage.
- **Constraints**: no change to reveal timings, animations, audio, persistence, copy or reduced motion;
  production build below 495 MiB.

## Constitution Check

- **Preserve the reveal**: only when the existing hub hold is taken and released changes. Every animation,
  sound, persistence call and state transition keeps its current timing and order.
- **Smallest correct change**: one pair of callbacks, one constant pair, three call sites (press, two resume
  branches), one release at completion, one unmount cleanup, and removal of the now-redundant effect.
- **Fail safe**: the hold is idempotent, release is idempotent, the safety timer bounds the worst case, and
  critical/intent work for non-background resources is untouched by design.
- **Honour the manifest's own flag**: a resource marked `background: true` never runs while an experience
  holds the foreground, even when its experience is prepared at critical priority. Without this, the route
  warm-up (`ResourceReadiness` prepares the current route at critical priority after settle) still started
  2.2 s into the reveal in the first production measurement.
- **Protected areas**: no payment, database, authentication, security, hosting, deployment, environment or
  secret file touched.
- **Evidence first**: the `stageActive` effect and the 8.3 s pre-roll were read from source and confirmed
  against the audit's 975 ms measurement before the change.

## Phase 0: Research (repository evidence)

1. The previous effect was `if (!stageActive) return undefined; return beginActiveExperience(...)` — the hold
   begins only after the pre-roll.
2. `animateReveal` schedules `setStageActive(true)` at `colourSettleMs + eventDelayMs`, and it starts
   `anticipationMs` after the press, so the pre-roll is 8,320 ms.
3. `handleStageComplete` already marks the reveal finished; it is the natural release point.
4. The load effect has three resume branches: replay the motions, resume the cinematic, or finish the Spark.
   Only the first two animate, so only they take a hold.
5. `beginActiveExperience` only increments a counter and is exported for this purpose; the hub's
   `backgroundAllowed()` pauses background jobs while it is held and leaves critical/intent jobs running.

## Phase 1: Design

### Files

```
components/DailyResonance.tsx                 # hold at press, release on completion/unmount/safety
__tests__/reveal-window-protection.test.jsx   # real component + real hub behaviour
specs/191-reveal-window-protection/*
artifacts/reveal-protection-20261118/*
```

### Lifecycle

| Moment | Before | After |
| --- | --- | --- |
| Press | nothing held | `beginActiveExperience` in the handler |
| Pre-roll (0–8.32 s) | background jobs run | held |
| Cinematic | held (`stageActive` effect) | held (same hold) |
| Completion | released by effect cleanup | released in `handleStageComplete` |
| Unmount | released by effect cleanup | released by cleanup + timer cleared |
| Stage never completes | held forever | safety timer releases |
| Reduced motion | no hold (no stage) | no hold |

Safety margin: `REVEAL_STAGE_PREROLL_MS + duration + 15,000 ms`, bounded and long enough for the longest
documented event.

## Re-evaluated Constitution Check

No visual, audio, timing, persistence or copy change; only the scope and ownership of the existing hub hold.
No violation.
