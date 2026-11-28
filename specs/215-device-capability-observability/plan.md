# Implementation Plan: Device Capability and Observability

**Branch**: `freebuff/f80579362a5d294f4f4cd86e` | **Date**: 2026-11-24 | **Spec**: `specs/215-device-capability-observability/spec.md`

**Input**: Feature specification from `specs/215-device-capability-observability/spec.md`

## Summary

Extend the two existing layers rather than adding a third. `app/lib/graphics-capabilities.js` gains one cached hardware assessment, a separate live display-demand reading, a consolidated WebGL feature probe and a render-budget diagnostic. `app/lib/adaptive-performance.js` consumes the assessment for its existing device state and gains an observational frame monitor driven by the frame loops that already run. The existing render-quality output, gates, visuals, frame cadence and the cosmic engine's local 42/18 fps governor are unchanged.

## Technical Context

**Language/Version**: JavaScript ES modules on Node.js 26.x; Next.js 16.4.3 client components.

**Primary Dependencies**: Existing repository only. No new package.

**Storage**: None. The assessment cache is page-lifetime memory only.

**Testing**: Vitest with jsdom, focused graphics/adaptive/monitor suites, TypeScript check and the repository verification script.

**Target Platform**: Modern browsers with graceful degradation; server rendering must remain safe.

**Performance Goals**: One shared device assessment, refreshed only at the adaptive plan's reassessment boundary; no additional animation frame loop, timer or listener; no changed GPU budget for existing profiles.

**Constraints**: Preserve every existing render-quality value, visual, animation timing, the 12-second celebration, the resource-readiness hub and the 495 MiB build cap.

**Scale/Scope**: One capability module, one adaptive module, one cosmic frame-loop call site, focused tests, architecture documentation and Memory Bank corrections.

## Constitution Check

- **Single Source of Truth**: `AGENTS.md` remains authoritative. This plan only complements it.
- **Verify Before Acting**: The current code, tests, device matrix and gate arithmetic were inspected before planning.
- **Implementation Sequence**: Specify → plan → tasks → implement is recorded in this feature directory.
- **Protect Core Systems**: No payment, authentication, database, deployment or secret configuration is touched.
- **Resource Conservation**: No dependency, service or paid infrastructure is added.

**Gate result**: PASS.

## Design

### Priority 1 — one capability assessment

`app/lib/graphics-capabilities.js` is the home. It remains dependency-free.

- `readDeviceSignals()` normalizes `navigator.deviceMemory` and `navigator.hardwareConcurrency`; invalid, zero and absent values become `null`.
- `assessDeviceCapabilities()` is pure. Known values at or below 2 produce `constrained`. Both known values at or above 6 produce `high`. If only one value is known, a plentiful value produces `high` and a modest value produces `balanced`. No hints produce `balanced` with `confidence: none`. A missing signal is never low.
- `getDeviceAssessment()` caches the assessment between adaptive-plan reassessments. `refreshDeviceAssessment()` is the one explicit refresh boundary and also invalidates the cached graphics profile. It accepts injected sources only for deterministic tests and does not populate the cache then.
- `getGraphicsProfile()`, `getRenderQuality()` and adaptive `readDeviceState()` keep their existing output shapes and delegate memory/core reads to the assessment.
- `getGraphicsFeatures()` performs one lazy WebGL probe: try WebGL2, then WebGL1; report `webgl`, `webgl2`, scalar limits, Canvas 2D and Path2D; release the probe with `WEBGL_lose_context`. It never requests vendor, renderer or unmasked strings.
- `getAdaptiveCapabilities()` keeps the exact `features` shape `{ canvas2d, webgl, path2d }` and adds `device`, `display`, `graphics`, `renderBudget` and `performance`.

### Priority 2 — capability separate from display demand

- `getDisplayDemand()` reads the live CSS viewport and DPR and returns `{ width, height, pixelRatio, backingPixels, demand }`.
- Demand bands: `light` at or below 1.5 MP, `moderate` at or below 3 MP, `heavy` at or below 6 MP, otherwise `extreme`.
- `describeRenderBudget()` returns the unchanged existing quality profile, the capability assessment, display demand, both gate states and `limitedBy`. Limiters are `surface`, `legacy-pointer-density`, `capability` and `policy`.
- The 3 MP and coarse-pointer DPR-3 gates remain in `resolveRenderQuality`, now referenced through named constants so the retained boundary is explicit. `resolveRenderQuality` output is unchanged.
- No consumer is rewired to the new diagnostics; they are additive.

### Priority 3 — observational monitor

`app/lib/adaptive-performance.js` gains:

- `createPerformanceMonitor()`: injectable clock, visibility source and target source for tests.
- A module singleton, `recordFrameSample(timestamp)`, `getPerformanceSnapshot()` and `resetPerformanceMonitor(reason)`.
- `createAdaptiveFrameLoop()` records the timestamp of each painted frame. `components/cosmic-event-engine.js` records one timestamp per existing frame. No new loop, timer or listener is created.
- Duplicate timestamps from several loops in the same animation frame are ignored.
- A 1,500 ms measurement window, 2,000 ms warm-up, 1,000 ms status hysteresis, 1,000 ms gap reset and visibility/target resets.
- Status thresholds: `critical` below 28 fps, p95 at or above 70 ms or at least 20% long frames; `strained` below 50 fps, p95 at or above 28 ms or at least 5% long frames; otherwise `healthy`.
- Snapshot fields: `status`, `statusSince`, `fps`, `averageFrameMs`, `p95FrameMs`, `longFrameRatio`, `sampleCount`, `windowMs`, `warmupRemainingMs`, `lastResetReason`, `updatedAt` and `target`.
- The cosmic engine's local 42/18 fps step stays exactly as it is and is not wired to the new status.

### Priority 4 — plan-aware diagnostics and reporting (approved follow-up)

The original monitor compared every source with a fixed 60 fps policy, so a
30 fps plan could never report `healthy`, and a paused or stopped renderer kept
a stale verdict. The follow-up corrects the reference instead of adding a new
system.

- Thresholds scale from `FRAME_MONITOR.referenceFps` to the plan's `frameRate`:
  60 fps keeps 50/28 fps and 28/70 ms; 30 fps becomes 25/14 fps and 56/140 ms with
  a 100 ms long-frame budget. Paused plans have no health thresholds.
- Statuses gain `paused` (plan intentionally expects no frames) and `idle` (the
  plan expects frames but the observed source stopped). `evidence` is
  `measured`, `insufficient`, `unavailable`, `paused` or `stale`; only
  `measured` can support a health claim.
- One monitor keeps a window per existing source (`adaptive-frame-loop` and
  `cosmic-engine`). The aggregate reports the weakest measured source, so a fast
  loop cannot mask a slow one, and the snapshot lists every source separately.
- A plan-target change resets the source window. Gap, hidden, target and manual
  resets and the existing 1 s hysteresis are preserved.
- `getPerformanceDiagnostics()` returns `{ plan, monitor, device }` for the
  Creative Workbench; `getState()` becomes version 2 and keeps its existing
  fields. A compact Performance health panel shows status, fps, target, tier,
  evidence, source and warnings.
- The PR report renders one informational block after the header and before the
  category table. `performance_health_block()` accepts a bare snapshot, a
  Workbench diagnostics payload or a `{ performance }` wrapper. `GOOD` requires
  `evidence: measured`, a healthy classification, a numeric fps/target and
  consistency with the reported healthy floor. `strained` maps to `NEEDS
  ATTENTION` and `critical` to `BAD`; every other state, a malformed payload or a
  snapshot pinned to another commit maps to `NOT ENOUGH DATA`. The block is not a
  category and never influences `overall_status`.
- An optional `--performance <json>` input lets a submitter supply the snapshot.
  No workflow step is added: CI has no runtime frame sample, so the live report
  truthfully shows `NOT ENOUGH DATA`.

### Preserved invariants

- `resolveRenderQuality()` output is byte-for-byte identical.
- `getGraphicsProfile()` returns `standard`/`constrained` with the same caps.
- `readDeviceState()` returns the same keys and semantics.
- `features` remains exactly `{ canvas2d, webgl, path2d }`.
- No visual, effect, animation, loading or timing change.
- The root `ResourceReadiness` → `useAdaptivePlan` → `getAdaptivePlan` → `readDeviceState` chain is still the site-wide primer.
- `app/lib/resource-readiness.js` is untouched.

## Project Structure

### Documentation

```text
specs/215-device-capability-observability/
├── spec.md
├── research.md
├── plan.md
└── tasks.md
```

### Source and tests

```text
app/lib/graphics-capabilities.js          assessment, display demand, feature probe, budget diagnostic
app/lib/adaptive-performance.js           device-state delegation, capabilities, monitor
components/cosmic-event-engine.js         one frame-timestamp sample call
__tests__/graphics-capabilities.test.js   characterization plus new probes
__tests__/adaptive-performance.test.js    capability shape and frame-loop integration
__tests__/performance-monitor.test.js     plan-aware thresholds, pauses, idle sources, per-source windows
components/graphics/CreativeWorkbench.jsx  diagnostics payload and Performance health panel
.github/scripts/pr_verification_report.py  informational performance-health block and --performance
.github/scripts/test_pr_verification_report.py  report-block regression tests
docs/graphics-rendering-architecture.md   capability and monitoring contract
memory-bank/activeContext.md              current feature state
memory-bank/techContext.md                remove stale renderer references
memory-bank/progress.md                   durable milestone
```

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Cache hides a changed hardware hint | Refresh the assessment at the adaptive plan's existing reassessment boundary; policy and input remain live for the existing consumers. |
| Multiple frame loops inflate the measured rate | Ignore samples less than 1 ms apart; all production loops pass the browser's rAF timestamp. |
| Background tab looks critical | Reset on hidden visibility and on gaps longer than 1 s; warm-up applies after every reset. |
| A single stall changes status | Use a 1.5 s window, percentile/long-frame thresholds and 1 s hysteresis. |
| WebGL2 probing changes fallback behaviour | Probe WebGL2 first, then WebGL1; `supportsWebGL()` is true for either; context acquisition functions are unchanged. |
| Diagnostics accidentally change quality | Pin `resolveRenderQuality` output with characterization tests before refactoring; keep gates and return the same profile objects. |
| Hardware evidence is unavailable | Label thresholds provisional and measure nothing beyond code-exact budgets; do not claim hardware frame rates. |

## QA and Verification

- Run focused graphics, adaptive and monitor suites after each priority.
- Run `tsc --noEmit` and the full Vitest suite.
- Run `./freebuff-verify.sh` with the Spec Kit base reference and record the production build size.
- Confirm the build is strictly below 495 MiB.
- Source-path changes may require Visual QA in CI; no visual baseline update is intended.
- No local browser is available for screenshots or hardware frame timing. Report this limitation rather than claiming visual verification.
- Open one regular, non-draft, unmerged PR with the exact declarations and QA scope JSON from `PR_SUBMISSION.md`.

## Deferred

- Removing the 3 MP backing-store gate.
- Removing the coarse-pointer DPR-3 gate.
- Automatic adaptive quality changes based on monitor status.
- Intelligent resource-loading priority changes.
- Frame-cadence and resize/orientation improvements.
