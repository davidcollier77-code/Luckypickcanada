# Lucky Meter — Phase 0 performance attribution report

**Date:** 24 November 2026
**Scope:** Phase 0 only — baseline evidence, temporary instrumentation, attribution, report.
**Permanent application changes:** none. The three instrumented files were restored byte-for-byte (SHA-256 verified) and `git status` shows only this evidence directory.
**Page under test:** `https://luckypickcanada.ca/lucky-meter` (deployed) and the same commit built locally (`next build --webpack`, `next start`).

---

## 1. What Phase 0 had to answer

1. Establish a reliable, repeatable load baseline for the Lucky Meter.
2. Identify the actual cause of the ~2.6 s first-render long task.
3. Attribute the following long tasks (audio, animation, frame work).
4. Decide, from evidence, what Spec 217 should change.

No composition, audio, hub, registry, adaptive-performance or quality behaviour was modified. The only source edits were temporary `performance.mark` calls and one `renderer.info` snapshot; all were removed and verified by hash.

---

## 2. Method

| Item | Value |
| --- | --- |
| Browser | Playwright-pinned Chromium 156 (`playwright-chromium` 1.65.1) |
| Mobile profile | 390×844, DPR 3, `isMobile`, `hasTouch`, Pixel 7 UA |
| Desktop profile | 1440×900, DPR 1 |
| Cache | cold browser context per run, empty HTTP cache |
| Network / CPU | unthrottled, no CPU throttling (lab baseline) |
| Actions | load only — Start is never pressed |
| Settle window | 8 s after `load` |
| Runs | production mobile ×3, production desktop ×2, localhost mobile ×2 uninstrumented, localhost mobile ×3 instrumented, 1 CPU profile per build, 1 Chrome trace per build |
| PageSpeed | PSI web report (API quota exhausted, HTTP 429) |

**Host limitation (applies to every WebGL number below).** This VM has no GPU. Chromium reports:

```
gpu_compositing: disabled_software
webgl:           unavailable_software
rasterization:   disabled_software
glRenderer:      ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)
```

Software compositing forces a synchronous canvas readback that a GPU-compositing device does not perform in the same way. Section 5 states exactly which conclusions survive that limitation.

Evidence is kept in two clearly separated groups:

- **Production** — the deployed site over Cloudflare's CDN (`baseline-production-*`, `profile-production-mobile.json`, `trace-production-mobile.json`).
- **Localhost** — the same commit, locally built and served (`baseline-local-uninstrumented-*`, `attribution-local-instrumented-*`, `profile-local-instrumented-mobile.json`, `trace-local-instrumented-mobile.json`).

---

## 3. Baseline

### 3.1 Production (deployed, cold context)

| Run | FCP | LCP | Load | Long tasks | TBT | Longest task | Transfer | Audio |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mobile-1 | 1,464 | 1,464 | 1,538 | 14 | 3,466 | **2,510 + 2,378** | 3,817 KiB | 2,889 KiB |
| mobile-2 | 920 | 920 | 1,008 | 17 | 3,323 | **1,750 + 2,257** | 3,817 KiB | 2,889 KiB |
| mobile-3 | 676 | 676 | 743 | 16 | 3,246 | **1,459 + 2,219** | 3,817 KiB | 2,889 KiB |
| desktop-1 | 1,232 | 1,232 | 1,046 | 18 | 3,242 | **2,057 + 2,131** | 3,817 KiB | 2,889 KiB |
| desktop-2 | 672 | 672 | 815 | 17 | 3,405 | **1,649 + 2,318** | 3,817 KiB | 2,889 KiB |

The dominant task is **2,131–2,378 ms** on every production run. It does not vary with the network: FCP moves by 800 ms between runs while the task stays inside a 250 ms band.

### 3.2 Localhost, uninstrumented (reference for instrumentation overhead)

| Run | FCP | Long tasks | TBT | Longest task | Transfer | Audio |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 176 | 18 | 3,200 | 918 + 2,094 | 3,771 KiB | 2,889 KiB |
| 2 | 156 | 16 | 3,223 | 937 + 2,080 | 3,771 KiB | 2,889 KiB |

The deployed and local builds behave identically in structure; only absolute network timings differ.

### 3.3 PageSpeed Insights — mobile (score of record)

`baseline-psi-mobile.json`

| Metric | Value |
| --- | --- |
| **Performance** | **68** |
| Accessibility / Best practices / SEO | 100 / 100 / 100 |
| FCP | 0.9 s |
| LCP | 0.9 s |
| **Total Blocking Time** | **15,500 ms** |
| CLS | 0 |
| Speed Index | 4.2 s |

Diagnostics reported by PSI: minimize main-thread work **40.7 s**, reduce JavaScript execution 1.4 s, avoid enormous payloads **3,589 KiB**, **20 long tasks**, unused JavaScript 128 KiB, render-blocking requests ≈620 ms.

Environment: emulated Moto G Power, Slow 4G, Lighthouse 13.6.0, HeadlessChromium 157.0.8103.38. PSI runs Lighthouse headless without a GPU, so its TBT includes the same software-compositing path measured here. The historic baseline was score 67 / TBT ≈5,140 ms; the new run's 15,500 ms shows how much TBT varies across datacenter hosts, so treat the score as the record and the TBT as an upper bound, not a device budget.

---

## 4. Attribution (temporary instrumentation, localhost build)

### 4.1 Confirmed timeline (three runs, ms from navigation start)

| Mark | Run 1 | Run 2 | Run 3 | Meaning |
| --- | --- | --- | --- | --- |
| `meter-scene-request` | 333 | 317 | 322 | React effect asks for the scene |
| `meter-canvas-appended` | 333 | 317 | 322 | `<canvas>` inserted into the host |
| `meter-surface` | 452 | 438 | 418 | `createCreativeSurface` resolved: Three imported, `WebGLRenderer` + context created |
| `meter-environment` | 511 | 506 | — | PMREM environment built |
| `meter-lights` | 511 | 506 | — | light rig added (+0.7 ms) |
| `meter-geometry` | 538 | 532 | 503 | all meter geometry built |
| `meter-started` | 539 | 533 | 506 | `surface.start()` returned |
| `meter-draw-start` | 541 | 535 | 506 | first frame callback |
| `meter-draw-update-end` | 542 | 536 | 506 | **JS scene update: 1 ms** |
| `meter-first-frame` | 817 | 866 | 786 | after the first draw (GPU work): **275–330 ms** |
| `meter-ready` | 877 | 922 | 823 | `onReady` fired |
| `meter-commit:three` | 2,938 | 3,092 | 2,783 | React effect after the canvas became visible |
| longest task | **901 + 2,036** | **943 + 2,149** | **845 + 1,937** | starts 24–22 ms *after* ready, ends exactly at the commit |

So the 2 s task is **not** scene construction (206–216 ms), **not** React's JavaScript, and **not** the first draw (275–330 ms). It sits between the `setState('three')` and the first painted frame containing the canvas.

### 4.2 CPU profile of the 2 s task (`profile-production-mobile.json`, localhost equivalent)

The 2,046 ms production window contains:

```
2,041.3 ms  (program)        <- no JS frame on the stack
    0.8 ms  (anonymous)     5105-…js   (Howler chunk)
    0.3 ms  Q / j / A …      (bundles)
```

Total JavaScript inside the task: **≈2 ms**. The main thread is not running application code; it is blocked inside native browser work. This rejects "expensive React render", "expensive scene update" and "audio work" as explanations for the task.

### 4.3 Chrome trace of the same window (`trace-*.json`)

Largest-task window, localhost (2,142 ms) and production (2,001 ms) — same structure:

| Event | Category | Localhost | Production |
| --- | --- | --- | --- |
| `ProxyMain::BeginMainFrame` | cc | 2,140 ms ×2 | 1,999 ms ×2 |
| `Commit` | devtools.timeline | 2,136 ms ×2 | 1,995 ms ×2 |
| `LayerTreeHost::DoUpdateLayers` | cc | 2,119 ms ×2 | 1,976 ms ×2 |
| `GLES2::ReadPixels` | gpu | 2,118 ms ×2 | 1,976 ms ×2 |
| `WebGL` / `GPUTask` / `CommandBuffer::Flush` | gpu | 2,117 ms | 1,974 ms |

**Mechanism:** when the CSS fallback is removed and the WebGL canvas becomes visible, the first compositor commit of that layer performs a synchronous canvas readback (`GLES2::ReadPixels`, 1,976–2,118 ms) while the main thread waits in `Commit`. With `gpu_compositing = disabled_software` on this host, that readback is the only way the compositor can obtain the canvas pixels — and it runs on the critical path. The canvas backing store is small: the deployed meter is 328×328 CSS at an effective 1.6 device ratio (524×524 buffer, 0.27 MP), measured after this report (`canvas-state-mobile.json`). The ~2 s cost is therefore **not proportional to canvas area**; it is a one-off software-GL first-composite cost.

### 4.4 Renderer state at the first presented frame

`renderer.info` one frame after the draw: **46 draw calls, 30,768 triangles, 10 programs, 20 geometries, 4 textures**. That is the whole scene; no second pass, no post-processing. It confirms the scene itself is modest — the cost is in presentation, not in scene complexity.

### 4.5 Audio

| Measurement | Value |
| --- | --- |
| Audio transfer | **2,889 KiB of 3,817 KiB (76 % of the page)** |
| First audio request (production mobile) | 4,081 / 4,435 / 5,376 ms |
| First audio request (localhost) | 3,153–3,441 ms |
| `import('howler')` | 215–217 ms (chunk fetch + parse) |
| 12 × `new Howl` (setup loop) | **33–36 ms** |
| All 12 `onload` callbacks | one timestamp (decode finished together) |
| Decode after last byte | **364–390 ms** |
| Decode on the main thread? | no evidence: all callbacks land in a single short task after `decodeAudioData` |

The audio long tasks the first profile suggested are **not** Howler work. The trace of the audio window (`lucky-audio-prepare-start` → last `onload`) attributes 423 ms of 615 ms to `GLES2::ReadPixels` and 512 ms to compositor `Commit`s — i.e. the animating canvas being read back once per frame. Howler's own contribution is the 215 ms dynamic import plus ~35 ms of object creation.

### 4.6 Following long tasks

After the canvas is visible the idle scene animates for 4 s (`IDLE_STOP_SECONDS`). Each animated frame costs a compositor readback on this host, producing ~100 ms long tasks at roughly 100 ms intervals until the loop stops (19 long tasks; 3,157–3,223 ms TBT locally, 3,246–3,466 ms on production). This is the same mechanism as 4.3, repeated per frame.

### 4.7 Instrumentation overhead check

Uninstrumented localhost: longest 2,080 / 2,094 ms, TBT 3,200 / 3,223 ms.
Instrumented localhost: longest 1,937 / 2,036 / 2,149 ms, TBT 3,157 / 3,182 / 3,215 ms.

No systematic change; the marks did not alter the behaviour under measurement.

---

## 5. Hypothesis verdicts

| # | Hypothesis | Verdict | Evidence |
| --- | --- | --- | --- |
| H1 | First-draw shader compilation causes the big task | **Partly** — first draw is 275–330 ms (a 309 ms task), inside `meter-draw-start → meter-first-frame`; not the 2 s task | 4.1, 4.2 |
| H2 | PMREM + geometry assembly is the cost | **Rejected as main cause** — environment 58–67 ms, lights 0.7 ms, geometry 26 ms, total scene build 206–216 ms | 4.1 |
| H3 | Fallback→canvas swap commit is the cost | **Confirmed on this host** — 2,131–2,378 ms `Commit` → `DoUpdateLayers` → `GLES2::ReadPixels`, JS ≈2 ms, canvas only 0.27 MP | 4.2–4.3 |
| H4 | Howler creation / 12 concurrent decodes block the main thread | **Rejected as main cause** — setup 33–36 ms, decode off-thread; surrounding tasks are canvas readbacks | 4.5 |
| H5 | Aurora's first Canvas 2D frames | **Not observed** — no long task attributable to it in any run | 4.1 |

**What is portable, and what is not.** The *sequence* and the *trigger* are portable: the blocking task is the browser's first compositor commit after the fallback is removed and a full-resolution WebGL canvas becomes visible, not application JavaScript. The *size* of that task is host-dependent. Here it is a readback because the VM composites in software; on a GPU-compositing phone the same wait would be spent producing the canvas's first frame (driver/shader work) instead of reading it back. The original 2,605 ms observation came from a machine this environment cannot reproduce, so Phase 0 can name the mechanism but cannot assign the hardware figure's split between compile and composite. That split needs one GPU-host run with the same marks before Spec 217 commits to a fix.

---

## 6. What this means for Spec 217 (candidates, not yet approved)

1. **Target the reveal commit, not the scene build.** The scene costs ~210 ms to assemble and ~300 ms for its first draw; the swap costs ~2 s here. Any change that shortens the blocking commit has the larger effect.
2. **Avoid animating a WebGL canvas layer with `opacity`.** `.lucky-meter-stage__canvas-host` runs `transition: opacity 600ms` on `is-ready`; the reveal therefore forces repeated composited frames of a full-resolution canvas. A reveal that does not animate the canvas layer (cross-fade via a static poster, or no transition) removes that per-frame work.
3. **Do not cap the pixel ratio on this evidence.** The deployed canvas is already 328×328 CSS at an effective 1.6 ratio (524×524, 0.27 MP), and the blocking cost is not proportional to that area. This item replaces the report's original DPR-3/3.0 MP assumption, which the post-report measurement disproved (`canvas-state-mobile.json`).
4. **Keep the fallback swap out of the animated commit.** Removing the whole CSS fallback subtree in the same commit that makes the canvas visible combines style/layout invalidation with the first canvas composite.
5. **Defer event audio until Start.** 2,889 KiB (76 % of the payload) begins downloading at 3–5.4 s without a Start press; only the three core cues need to precede Start.
6. **Re-measure on a GPU device.** Acceptance gates cannot be validated on a software-compositing host; the PSI score is measurable, the frame budget is not.

None of the above is implemented in Phase 0.

---

## 7. Verification performed

| Check | Result |
| --- | --- |
| Instrumentation removed | `none` — no `Phase 0 instrumentation`, `markPhase0` or `__phase0Renderer` in the three files |
| Original files restored | `sha256sum -c` → `OK` for `components/LuckyMeterStage.jsx`, `app/lib/lucky-meter/meter-scene.js`, `app/lib/lucky-meter/audio.js` |
| Working tree | `git status --porcelain` → only `?? artifacts/lucky-meter-performance-20261124/` |
| Typecheck | `pnpm exec tsc --noEmit` → exit 0 |
| Production build (instrumented tree) | `pnpm build` → exit 0, **368.67 MiB** (limit 495 MiB) |
| PSI API | HTTP 429, daily quota exhausted; web report used instead |
| Local server | stopped after measurement |

The 368.67 MiB figure was measured on the instrumented tree; the restored tree differs only by removal of temporary marks.

**Post-report correction.** A follow-up read-only measurement of the deployed page (`canvas-state-mobile.json`, mobile emulation, 8 s settle) recorded one visible meter: renderer `three`, host opacity `1`, `transition: opacity 0.6s`, canvas 328×328 CSS, buffer 524×524, effective ratio **1.6**, backing store **274,576 px**. The report's original section 6 item 3 and the 4.3 mechanism text assumed DPR 3 (≈3.0 MP); both are corrected above. This also rejects pixel-ratio capping as a fix and shows the 2 s readback is a fixed software-GL cost, not an area cost.

No commit, PR or deployment was made. Phase 0 is measurement-only and the approved plan carries this evidence into the Spec 217 PR; the directory is left untracked for that branch.

---

## 8. Evidence index and reproduction

| File | Contents |
| --- | --- |
| `baseline-production-mobile-{1,2,3}.json` | deployed mobile cold-context runs |
| `baseline-production-desktop-{1,2}.json` | deployed desktop runs |
| `baseline-local-uninstrumented-mobile-{1,2}.json` | localhost reference before instrumentation |
| `attribution-local-instrumented-mobile-{1,2,3}.json` | marked runs (marks, long tasks, LoAF, audio, `renderer.info`) |
| `profile-production-mobile.json`, `profile-local-instrumented-mobile.json` | V8 CPU profiles with per-window frame attribution and clock anchoring |
| `trace-local-instrumented-mobile.json`, `trace-production-mobile.json` | derived trace windows (raw traces were not saved) |
| `baseline-psi-mobile.json` | PageSpeed Insights result and environment |
| `probe.cjs` | load probe (metrics, marks, resources, renderer timeline) |
| `profile.cjs` | CDP sampling profiler with window attribution |
| `trace.cjs` | Chrome trace window aggregation |

```bash
source scripts/bootstrap-pnpm.sh
eval "$(bash scripts/setup-chromium-libs.sh --env)"
node artifacts/lucky-meter-performance-20261124/probe.cjs https://luckypickcanada.ca/lucky-meter out.json
node artifacts/lucky-meter-performance-20261124/profile.cjs https://luckypickcanada.ca/lucky-meter profile.json
node --max-old-space-size=3072 artifacts/lucky-meter-performance-20261124/trace.cjs https://luckypickcanada.ca/lucky-meter trace.json
```
