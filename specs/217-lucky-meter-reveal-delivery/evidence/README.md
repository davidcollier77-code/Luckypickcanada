# Spec 217 evidence

Everything in this directory is measurement evidence for the Lucky Meter reveal
hand-off and mobile delivery work. Production and localhost evidence are kept
separate and never combined into one number.

## Inputs from Phase 0

The accepted baseline lives in `artifacts/lucky-meter-performance-20261124/`:

| File | What it records |
| --- | --- |
| `phase0-report.md` | Baseline, attribution, the corrected canvas measurement and the host limitation. |
| `baseline-production-mobile-*.json` | Three deployed cold mobile loads (3,817 KiB transfer, 2,889 KiB audio, 2,131–2,378 ms dominant task). |
| `baseline-local-uninstrumented-*.json` | Two local production-build loads with the same structure. |
| `attribution-local-instrumented-*.json` | The instrumented run that produced the mark timeline. |
| `canvas-state-mobile.json` | Deployed probe: one visible meter, `data-meter-renderer="three"`, canvas 328×328 CSS, buffer 524×524, effective ratio 1.6, 0.27 MP. |
| `probe.cjs` | The Phase 0 load probe reused for the post-change transfer comparison. |

`phase0-report.md` is the record of what was measured before this feature. Its
original 3 MP/DPR-3 assumption was disproved by `canvas-state-mobile.json` and
the report was corrected in place; no pixel-ratio or quality change is part of
Spec 217.

## Fade investigation

| File | What it records |
| --- | --- |
| `fade-benchmark.json` | 16 deployed runs (600, 300, 150 and a 0 ms control) with composited transition frames, fade window, long-animation-frame cost and the opacity curve. |
| `fade-local-benchmark.json` | The production-build benchmark required by `plan.md` Phase A: 600, 450, 300, 225 and 150 ms plus a 0 ms diagnostic control, four cold mobile runs each. |
| `fade-bench.cjs` | The repeatable harness that produced `fade-local-benchmark.json`. |
| `fade-visual/` | Opacity curves and midpoint captures used to confirm the transition still reads as a fade. |
| `fallback-handover.json` | Fallback-removal, canvas-visibility and empty-stage timings, plus the runtime-only retained-fallback simulation. |
| `fallback-handover-investigation.md` | Findings, the approved retained-fallback design and its implementation notes. |

The deployed `fade-benchmark.json` used the page as visitors receive it with a
runtime-only CSS duration override. The local benchmark repeats that method on
the production build. A 0 ms variant exists only as a diagnostic control and is
never a candidate duration.

## Results (2026-11-24)

**Fade (T006, applied).** The production build measured 4 / 3 / 2 / 1 / 1 / 0 median transition frames for 600 / 450 / 300 / 225 / 150 / 0 ms, with 0 ms reveal blocking in all 24 runs. **300 ms was adopted** and is now the canvas host's duration in `app/globals.css`; it removes two frames, keeps the transition and `ease`, and still passes through partial opacity. 225 ms and 150 ms collapse to one step and were rejected, and 450 ms passed but removed only one frame. Playwright confirms the computed duration is `0.3s` and that exactly one opacity transition runs on desktop, mobile-390 and mobile-412.

**Missing-meter interval (implemented).** Before the change, the fallback was removed at 823–940 ms and the first visible canvas frame arrived at 2,790–3,157 ms, leaving 1,976–2,304 ms with neither meter. The owner approved the retained-fallback hand-off; `components/LuckyMeterStage.jsx` now keeps the complete CSS meter beneath the canvas until computed opacity leaves 0 or `transitionend` fires. A guard stops polling after 6 s but never removes a fallback while the canvas is transparent, so a longer stall cannot recreate the empty stage. Playwright recorded a ready canvas at opacity 0 with the fallback still mounted, and the fallback was removed only at opacity > 0 on all three projects.

**Audio (T016).** Cold pre-Start load requested exactly the four opening files (604,579 transfer bytes ≈ 590 KiB); the eight celebration files were all requested within 233 ms of Start, finished by 8,773 ms, and the celebration stage did not appear until 33,246 ms (24,473 ms of runway). No page errors.

**Transfer (T017, final build).** Three cold mobile runs on the final combined build: 1,473 KiB total and 590 KiB audio, against the Phase 0 local reference of 3,771 KiB total and 2,889 KiB audio. Both SC-002 targets pass. The 2,410–2,458 ms first-composite task and 3,449–3,540 ms TBT are unchanged; this work does not claim to remove them. Final evidence: `reveal-transfer-final-local.json` and the three source runs.

## Post-submission review repairs (2026-11-25)

Two reviewer findings were validated and repaired in the application code, with a third test-budget repair for CI:

- **P2 — watchdog stop and context restore.** A surface stopped by the 3,000 ms no-frame watchdog previously stayed stopped after a context restore. The restore path redrew one frame, which could announce ready and remove the CSS fallback while the animation loop was still off. `meter-scene.js` now tracks the watchdog cause and calls `surface.start()` on restore before re-arming the gate; an explicit `stop()` clears the flag and is still honored. Tests cover watchdog → restore and explicit stop → restore.
- **P3 — repeated deferred-cue loads.** `prepareLuckyMeterAudio({ loadEventCues: true })` called Howler `load()` on all eight celebration cues on every activation. A module-level flag now makes the first load idempotent for the shared set; `reset()`/`releaseLuckyMeterAudio()` clear it so a new set loads normally. Tests cover double activation and release-then-reactivate.
- **Visual QA timeout.** The older `holds Start` test can wait 15 s for Start and 20 s for the first value, exceeding the default 30 s test budget. It now uses `test.slow()`; no assertion changed.

Post-repair verification: focused unit files **24/24**, full suite **1,259/1,259** across 112 files, affected Playwright **9/9** on desktop/mobile-390/mobile-412, 490 Python and 51 docs tests, and a clean build of **437,895,168 bytes (417.61 MiB)** below the 495 MiB cap.

## Host limitation

This workspace has no hardware GPU and no physical phone. Chromium reports
software compositing (`gpu_compositing: disabled_software`), so every WebGL and
compositing number here is a software-path measurement. Frame counts and stalls
are valid for comparing this host against itself; they are not a phone
measurement. SC-006 (a hardware-GPU hand-off with no more than one long task and
none over 500 ms) remains outstanding until it is verified on such a device.

## Reproduction

```bash
source scripts/bootstrap-pnpm.sh
pnpm install --frozen-lockfile
eval "$(bash scripts/setup-chromium-libs.sh --env)"

# 1. Production build (must stay below 495 MiB)
pnpm build
du -sb .next

# 2. Serve it on the recorded local origin
pnpm exec next start -p 3100

# 3. Fade benchmark (four cold mobile runs per duration)
NODE_PATH="$PWD/node_modules" node \
  specs/217-lucky-meter-reveal-delivery/evidence/fade-bench.cjs \
  http://127.0.0.1:3100/lucky-meter \
  --out=specs/217-lucky-meter-reveal-delivery/evidence/fade-local-benchmark.json \
  --runs=4

# 4. Midpoint captures for the visual check
NODE_PATH="$PWD/node_modules" node \
  specs/217-lucky-meter-reveal-delivery/evidence/fade-bench.cjs \
  http://127.0.0.1:3100/lucky-meter \
  --capture \
  --durations=600,450,300,225,150 \
  --runs=1 \
  --out=specs/217-lucky-meter-reveal-delivery/evidence/fade-visual/captures.json

# 5. Post-change transfer comparison (three cold mobile runs)
for i in 1 2 3; do
  NODE_PATH="$PWD/node_modules" node \
    artifacts/lucky-meter-performance-20261124/probe.cjs \
    http://127.0.0.1:3100/lucky-meter \
    "specs/217-lucky-meter-reveal-delivery/evidence/reveal-transfer-local-$i.json" \
    --label="local-reveal-$i"
done
```

`NODE_PATH` is required because the harness lives outside the repository root's
module resolution path when run from a temporary working directory; running it
from the repository root with the command above is equivalent.

## Recording rules

- A cold mobile run uses a fresh browser context (empty HTTP cache), 390×844,
  DPR 3, `isMobile`, `hasTouch` and the Pixel 7 user agent, matching Phase 0.
- Localhost and deployed results are reported separately. A localhost number
  never stands in for a production number.
- The fade's cost is reported separately from the first-composite stall. The
  fade cannot be presented as the cause of the 2.2–2.6 s block.
- An unavailable check is recorded as unavailable, never as passed.

## Limitations

- No hardware GPU and no physical phone: `gpu_compositing: disabled_software`.
  Every frame and blocking number here is a software-path measurement, valid
  for comparing this host with itself, not for describing a phone.
- SC-006 (hardware-GPU hand-off: at most one long task, none over 500 ms) is
  **outstanding**. It cannot be established in this workspace.
- The 2.1–2.2 s first-composite task is the dominant cost and is unchanged by
  the fade duration, the reveal gate or the audio delivery. It is measured
  separately from the fade, whose own blocking was 0 ms.
- Perceived fade smoothness on a 60 fps device is not measurable here. The
  300 ms choice rests on the unchanged CSS ease, the partial-opacity captures
  and the measured 4 → 2 frame reduction, not on a phone observation.
- The retained fallback and 300 ms fade were exercised in local Chromium on
  the software host, not on a phone. SC-006 and perceived smoothness remain
  unverified until a hardware-GPU device is available.
- The production server used the normal `.next` build; `next start` warns that
  `output: standalone` exists, but the build and page were served successfully.
