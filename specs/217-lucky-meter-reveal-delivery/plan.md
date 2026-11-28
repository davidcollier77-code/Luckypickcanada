# Implementation Plan: Lucky Meter Reveal Hand-off and Mobile Delivery

**Branch**: `217-lucky-meter-reveal-delivery` | **Date**: 2026-11-24 (reveal revised after owner direction) | **Spec**: `specs/217-lucky-meter-reveal-delivery/spec.md`

**Input**: Feature specification and the Phase 0 evidence in `artifacts/lucky-meter-performance-20261124`, plus the fade benchmark in `specs/217-lucky-meter-reveal-delivery/evidence/fade-benchmark.json`.

## Summary

Three changes to existing modules, in this order.

1. **Investigate the existing 600 ms fade before changing it.** The fade predates this work (`eb5321f5`, #1994) and softens the CSS-to-3D swap. A 16-run benchmark shows it runs *after* the 2.2–2.6 s stall, at 4 composited frames for 600 ms, 2 for 300 ms and 1 for 150 ms. It cannot fix the main stall, but shortening it can remove avoidable post-stall work. The plan measures the production build, applies a written decision rule, and keeps 600 ms when the gain is not measurable. A cut is prohibited.
2. **Reveal only when a frame exists.** Replace the fixed 90 ms readiness timer with a produced-frame gate and a bounded watchdog, so a slow renderer never reveals an unpainted canvas.
3. **Gate celebration audio on activation.** Eight event cues get Howler `preload: false`; the four opening cues stay eager. One set, one API, no hub or manifest change; pre-activation audio falls from 2,889 KiB to ≈589 KiB.

No new dependency, preloader, renderer, audio system or service. Render density, tiers and gates are untouched (measured canvas 328×328 CSS, 1.6 ratio, 0.27 MP).

## Technical Context

**Language/Version**: JavaScript ES modules, Node.js 26.x; Next.js 16.4.3 App Router, React 19.3.1.

**Primary Dependencies**: Existing only — Three.js 0.187 through the shared creative surface, Howler through the existing Lucky Meter audio module.

**Storage**: None.

**Testing**: Vitest + Testing Library (jsdom); Playwright `tests/visual/lucky-meter-daily-resonance.spec.ts`; the Phase 0 probe for transfer/hand-off evidence; a repeatable fade benchmark derived from the deployed harness; `tsc --noEmit`; `./freebuff-verify.sh`.

**Target Platform**: Modern browsers with the existing CSS fallback; server rendering safe.

**Performance Goals**: Pre-activation audio ≤650 KiB and total transfer ≤1,650 KiB cold mobile; the fade keeps its transition while shedding avoidable composited frames; the gate removes premature reveals.

**Constraints**: Preserve composition, palette, storyboard timings, celebration, audio mix, fallback design, render tiers and the 495 MiB cap. No manual deployment step, dependency change or protected configuration change is part of this feature.

**Scale/Scope**: `app/globals.css` (duration only, if supported), `app/lib/lucky-meter/meter-scene.js` (gate), `app/lib/lucky-meter/audio.js` (preload policy), focused tests, one Playwright file, feature evidence.

## Constitution Check

- **Single Source of Truth**: `AGENTS.md` remains authoritative.
- **Verify Before Acting**: canvas, timer, CSS rule, cue sizes and history were inspected; the 3 MP assumption was measured and corrected; the fade benchmark was run before choosing a duration.
- **Implementation Sequence**: specify → plan → tasks → implementation completed under owner approval. The PR was submitted for owner review; the final merge outcome is recorded below.
- **Protect Core Systems**: no payment, auth, database, deployment or secret configuration.
- **Resource Conservation**: no new dependency or service; audio bytes fall.

**Gate result**: PASS.

## Design

### Phase A — fade investigation (foundational, before any reveal edit)

**A1. Why the fade exists.** Recorded in `research.md` R3: introduced with the dimensional vessel, no token or test, purpose is to soften the swap between the CSS approximation and the 3D scene. The plan treats it as intended design, not a defect.

**A2. What is measured.** On the local production build, cold mobile context, four runs per duration for 600, 450, 300, 225 and 150 ms, plus a 0 ms diagnostic control:

- composited transition frames (rAF samples with `0 < opacity < 1`);
- fade window after the stall and total reveal-window long-animation-frame duration;
- the first-composite stall, reported separately so it is not attributed to the fade;
- an opacity curve and two midpoint captures for the visual check.

**A3. Decision rule (binding).** Adopt a shorter duration only if it removes at least one median transition frame and does not worsen reveal-window blocking beyond noise, and the captures still read as a fade. Floor 150 ms. If 300 and 225 ms both fail, keep 600 ms and record that the existing experience was retained. Never remove the transition or use 0 ms.

**A4. Output.** A short decision recorded in `research.md` and `evidence/fade-local-benchmark.json`, naming the chosen duration. Implementation of Phase B may not start until this is written.

### Phase B — presented-frame reveal (US1)

**`app/lib/lucky-meter/meter-scene.js`**

- Replace `readyTimer = window.setTimeout(announceReady, 90)` with a produced-frame gate: after the first rendered frame, wait two animation frames, then announce.
- Cancel the animation-frame handles in `dispose()` and on context loss, as the timer is cancelled today.
- Add `READY_WATCHDOG_MS = 3000`: if no frame is produced, stop the surface and call `onUnavailable()` so the CSS meter remains permanently. Never reveal an empty canvas.
- Keep the `announced` / `failed` guards and "failure wins over a late announcement".
- Do not alter `update()`, frame cadence, the 4 s idle stop, the scene or any timing constant.

**`app/globals.css`**

- Apply **only** the Phase A decision to the canvas host's `transition` duration. Keep `ease`, the `0`/`1` opacity endpoints and every other declaration.
- If the decision is "retain", this file is unchanged.

**`components/LuckyMeterStage.jsx`**

- Owner-approved change: keep the fallback mounted while `renderMode === 'three'` until the canvas host's computed opacity leaves 0 or `transitionend` fires. A 6 s guard stops polling but never removes a fallback while the canvas is transparent. Reset the hold on context loss. This removes the measured 1,976–2,304 ms empty stage without changing the fade, scene or layout.

### Phase C — activation-gated celebration audio (US2)

**`app/lib/lucky-meter/audio.js`**

- Add frozen `CORE_SOUND_KEYS` (`buildup`, `segmentOpen`, `colourPour`, `dockChime`) and export `LUCKY_METER_CORE_SOUND_KEYS`.
- Set `preload: CORE_SOUND_KEYS.has(key)` in the Howl construction loop. Keep the 12 keys, volumes, error handler and one shared set.
- Keep `prepareLuckyMeterAudio`, `getLuckyMeterAudio`, `releaseLuckyMeterAudio` and `LUCKY_METER_AUDIO_FILES` semantics.

**Unchanged:** `app/lib/graphics/experiences.js`, `app/lib/resource-readiness-manifest.js`, the readiness hub, `event-audio.js`, `DailyResonance.tsx`. The activation path already prepares audio; the hub still prepares the set and now fetches only the opening files.

**Verification of the risk:** confirm in a browser that the first celebration cue is requested after activation and arrives before its scheduled moment. If it is late, move that cue into the eager group rather than accepting delayed audio.

### Phase D — evidence and guardrails (US3)

- Reuse `artifacts/lucky-meter-performance-20261124/probe.cjs` for three cold mobile runs on the local production build; compare total and audio transfer, `meter-ready` and the hand-off window with the Phase 0 record.
- Playwright in `tests/visual/lucky-meter-daily-resonance.spec.ts`:
  - the canvas host's computed transition duration is greater than `0s` and equals the chosen value;
  - the reveal is a single fade (no extra animation or second hand-off);
  - before Start, no celebration-cue file is requested; after Start, the full cue set is requested.
- Unit tests:
  - `__tests__/lucky-meter-audio-delivery.test.js` — opening cues eager, event cues deferred, 12 keys and file list unchanged;
  - extend `__tests__/lucky-meter-dimensional-renderers.test.js` — no announce before a frame, announce after frame + two animation frames, watchdog hands to fallback, context loss wins.
- Update timing-only assertions that encode the old 90 ms timer; keep every state, composition and fallback contract.

### Preserved invariants

- Scene, palette, lighting, pointer, chambers, vessel, pour, beam, camera, layout.
- Storyboard timings, 12,000 ms celebration, message typing, dock.
- CSS fallback markup and appearance.
- All 12 audio keys, cue map, mix, volumes, layering.
- `resolveRenderQuality` output, both gates, the measured 1.6 ratio.
- Readiness hub as the single preloader; lazy `three` chunk.

## Project Structure

### Documentation and evidence

```text
specs/217-lucky-meter-reveal-delivery/
├── spec.md
├── research.md
├── plan.md
├── tasks.md
├── checklists/requirements.md
└── evidence/
    ├── fade-benchmark.json          deployed-page benchmark (600/300/150/0)
    ├── fade-local-benchmark.json    production-build benchmark (decision input)
    └── fade-bench.cjs               repeatable local harness
```

### Source and tests

```text
app/globals.css                                  chosen fade duration only
app/lib/lucky-meter/meter-scene.js               produced-frame gate + watchdog
app/lib/lucky-meter/audio.js                     opening eager, celebration deferred
tests/visual/lucky-meter-daily-resonance.spec.ts fade + network assertions
__tests__/lucky-meter-audio-delivery.test.js     cue delivery policy
__tests__/lucky-meter-dimensional-renderers.test.js  readiness gate (extended)
memory-bank/activeContext.md                     after implementation
memory-bank/progress.md                          durable milestone after merge
```

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Shortening the fade is perceived as an abrupt cut | Floor 150 ms, `ease` retained, midpoint captures reviewed; retain 600 ms if the transition is not clearly still a fade. |
| No measurable gain from shortening | Decision rule defaults to 600 ms; only the gate and audio changes then proceed. |
| A shorter fade saves little because the stall dominates | Report both separately; do not present the fade change as a fix for the 2.2–2.6 s block. |
| Watchdog hands a very slow device to CSS permanently | 3 s bound, visually equivalent fallback, recorded if observed. |
| Two animation frames delay the reveal ~32 ms | CSS meter remains complete and visible; imperceptible. |
| A celebration cue is needed sooner than its load | Verify request timing; move early cues to eager. |
| Tests encode the 90 ms timer | Update timing assertions only. |
| Transfer varies with cache/network | Cold context, same profile, three runs, median; production and localhost separated. |
| No GPU device for SC-006 | Record outstanding; do not claim mobile frame improvement from software rendering. |

## QA and Verification

- Phase A evidence and written decision before any reveal edit.
- Focused Vitest: stage, dimensional renderers, event audio, new audio delivery.
- `pnpm exec tsc --noEmit`.
- Playwright `lucky-meter-daily-resonance` on desktop and both mobile projects.
- Three cold mobile probe runs on the local production build; compare with Phase 0; label deployed runs separately.
- `./freebuff-verify.sh`; production build strictly below 495 MiB.
- Full diff review against the preserved invariants.
- Submit one regular, non-draft PR after approval and leave it open for owner review; no manual deployment step is part of implementation.

## Deferred

- Keeping the fallback mounted through the fade (true crossfade) — recorded in `research.md` R7 as a separate owner decision.
- Reducing GPU first-frame work (program count, materials, instancing, precompile).
- Any pixel-ratio, tier or density change; `alpha: false`; removing the idle animation.
- Physical-device and PSI verification of the mobile frame claim.


## Final outcome (2026-11-25 UTC)

- PR [#2033](https://github.com/davidcollier77-code/Luckypickcanada/pull/2033) merged into `main` at `2026-11-25T00:38:11Z` (2026-11-24 20:38:11 Atlantic).
- Merge commit: `ae844b4902a387cde508a4d1a312c9a535ad29ff`; the current `main` ref was checked and points to this same commit.
- The implementation and the post-submission watchdog, audio-loading and Playwright-timeout repairs are complete. SC-006 remains outstanding because this work had software-rendering evidence only, not physical-device GPU verification.
- The feature did not run a manual deployment command. The existing `.github/workflows/deploy-open-next.yml` is triggered by pushes to `main`; deployment success must be taken from that workflow's result, not inferred from the merge record.
