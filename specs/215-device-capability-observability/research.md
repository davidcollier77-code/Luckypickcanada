# Research: Render-Budget Boundary

**Decision**: Keep the 3 MP backing-store gate and the coarse-pointer DPR-3 gate in `resolveRenderQuality` for this feature. Separate capability from display demand and expose the limiter diagnostically. Defer actual gate removal to the adaptive-rendering follow-up.

## Why this boundary

The owner asked for capability detection, not a visual-budget change. Removing either gate changes the visitor's rendered output and GPU work on devices that already receive the conservative path. Without physical-device evidence, that is an unmeasured visual and performance change. The new assessment and diagnostics make the mismatch visible now, so a later decision can be based on the observational monitor rather than guesswork.

## Current matrix (verified from `resolveRenderQuality`)

| Profile | CSS viewport × DPR | Backing pixels | Current tier | Why |
| --- | --- | --- | --- | --- |
| 1080p desktop, 8 GB / 8 cores | 1920 × 1080 @ 1 | 2.074 MP | `high` | Under 3 MP, fine pointer |
| 1440p desktop, 8 GB / 8 cores | 2560 × 1440 @ 1 | 3.686 MP | `balanced` | 3 MP gate |
| 4K desktop, 8 GB / 8 cores | 3840 × 2160 @ 1 | 8.294 MP | `balanced` | 3 MP gate |
| MacBook, 8 GB / 8 cores | 1512 × 982 @ 2 | 5.939 MP | `balanced` | 3 MP gate |
| Galaxy S23, 8 GB / 8 cores | 360 × 780 @ 3 | 2.527 MP | `balanced` | Coarse pointer + DPR ≥ 3 |
| iPhone 15 Pro, 8 GB / 8 cores | 393 × 852 @ 3 | 3.014 MP | `balanced` | 3 MP gate and coarse pointer + DPR ≥ 3 |
| Galaxy A17, 4 GB / 8 cores | 412 × 915 @ 2.625 | 2.598 MP | `balanced` | Memory below 6 GB |
| Pixel 7a, 8 GB / 8 cores | 412 × 915 @ 2.625 | 2.598 MP | `high` | Under 3 MP, fine pointer |

The capability assessment will report `high` for every 8 GB/8-core row, `balanced` for the 4 GB A17, and `none` confidence for a no-hint browser. Save-Data remains a policy constraint, not a capability constraint.

## Option A — keep both gates (chosen)

- Render output is byte-for-byte identical for every existing profile.
- No new GPU work, no new backing-store memory, no visual change.
- `describeRenderBudget` names `surface` for 1440p/4K/MacBook/iPhone and `legacy-pointer-density` for S23/iPhone, so the reason is explicit.
- The monitor can gather evidence on the exact devices that would be affected.

## Option B — remove the 3 MP gate only

| Profile | New tier | Exact visual delta |
| --- | --- | --- |
| 1440p / 4K desktop | `high` | Particle scale 0.85 → 1.2; spark budget 560 → 900; mesh segments 160 → 192; stage max lights 2 → 4; stage anisotropy 4 → 8; stage shadows off → on (the meter requests no shadows). DPR cap unchanged at 1 so no backing-store increase. |
| MacBook | `high` | All of the above plus DPR cap 1.6 → 2, so a 5.94 MP CSS surface goes from 15.2 MP to 23.8 MP backing pixels (+56.25%). |
| Galaxy S23 | `balanced` (unchanged) | Still limited by coarse pointer + DPR 3. |
| iPhone 15 Pro | `balanced` (unchanged) | Still limited by coarse pointer + DPR 3, even though the surface gate no longer applies. |
| Galaxy A17 | `balanced` (unchanged) | Memory still limits capability. |

Performance delta: 1440p/4K gain no pixel cost but gain the cosmic point budget (24,000 → 44,000, +83.3%), live particle budget (4,600 → 7,200, +56.5%) and particle scale (+41.2%), plus the meter geometry/light increases. MacBook additionally gains 56.25% backing pixels. These are code-exact budget changes, not measured frame-time changes.

## Option C — remove both gates

| Profile | New tier | Exact visual delta |
| --- | --- | --- |
| 1440p / 4K / MacBook | `high` | As Option B. |
| Galaxy S23 | `high` | DPR cap 1.6 → 2: 0.72 MP → 1.12 MP backing pixels (+56.25%); particle scale 0.85 → 1.2; spark budget 560 → 900; meter geometry and lights increase. The near/far cosmic surfaces and haze were already enabled in `balanced`, so those do not change. |
| iPhone 15 Pro | `high` | DPR cap 1.6 → 2: 2.57 MP → 4.02 MP (+56.25%); same particle, geometry and light increases. |
| Galaxy A17 | `balanced` | Memory still limits capability. |

Performance delta: the same cosmic +83.3% point budget and +56.5% live-particle budget, plus a 56.25% backing-store increase on every affected DPR ≥ 2 surface. The meter's dust field also rises from 32 to 46 particles (+43.75%), and its body/torus/vessel/well geometry segment counts rise by 28.6% to 71.4% depending on the part. The arrival-leaves canvas uses the same DPR cap and would allocate 56.25% more pixels for its short life.

## Visual-consumer notes

- `foreground` and `haze` are already `true` on both `balanced` and `high`; removing the gates does not add the near cosmic surface. Only `constrained` turns those off.
- The Lucky Meter requests `postProcessing: false`, so bloom/SMAA `resolutionScale` is not part of this meter's delta.
- The meter overrides glass transmission and thickness, so the high-tier material transmission change does not reach its vessel.
- `components/lucky-meter-ornament-engine.js` is not a production consumer. Its `ornament` counts are documented diagnostics, not a live visual change.
- Homepage starfield, Aurora and other surfaces that call `getGraphicsProfile()` use the separate profile cap and are unaffected by these render-quality gates.

## Follow-up research: plan-aware monitor thresholds and report evidence

The original monitor compared every window with a fixed 60 fps policy. That
contradicts the adaptive plan's own 30 fps target: 30 fps delivery produced a
33 ms p95 and could never satisfy a 28 ms bound, so a constrained device stayed
`strained` permanently. The correction scales the existing policy rather than
inventing a second one.

| Active plan target | Healthy at | Strained from | Critical below | Healthy p95 | Critical p95 | Long frame |
| --- | --- | --- | --- | --- | --- | --- |
| 60 fps | 50 fps | 50 fps | 28 fps | 28 ms | 70 ms | 50 ms |
| 30 fps | 25 fps | 25 fps | 14 fps | 56 ms | 140 ms | 100 ms |
| Paused (0 fps) | n/a | n/a | n/a | n/a | n/a | n/a |

The scale factor is `targetFps / 60` for frame-rate floors and the inverse for
time budgets. Long frames use the scaled budget, so ordinary 33 ms frames are
not counted as long under a 30 fps plan. A delivered 12 fps remains below the
14 fps critical floor and is reported as degradation, not as plan compliance.

Evidence classes are `measured`, `insufficient`, `unavailable`, `paused` and
`stale`. `paused` is a plan decision (hidden page, reduced motion or a zero frame
rate); `idle` is a source that stopped delivering while the plan still expects
frames. Neither is a health verdict, so the PR report maps them to `NOT ENOUGH
DATA`. Samples are kept per source because the shared loop can be throttled to
the plan cadence while the cosmic engine is not; one combined window would let a
fast source hide a slow one.

Runtime evidence in CI: the existing Application Verification and Playwright
shards do not measure frame delivery, and adding a measurement would be new
verification work whose result depends on the runner's software renderer. The
report therefore has no runtime snapshot in CI and says `NOT ENOUGH DATA`. A
future local or device capture can be supplied through the report's optional
`--performance` input; that adds no workflow step. The block is informational
and has no effect on the seven categories or the PR status.

## Evidence limits

The VM has no hardware GPU, no Samsung Internet and no Safari/Firefox mobile hardware. The budget deltas above are exact from source; frame-time and thermal effects are not measured. The observational monitor is the instrument for collecting that evidence later.
