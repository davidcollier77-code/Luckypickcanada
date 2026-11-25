# Phase 0 Research — Lucky Meter Complete Visitor Experience

**Feature**: `218-lucky-meter-complete-experience`
**Date**: 2026-11-25

This file records the decisions needed to build the focused prototype without creating a parallel graphics system. The full implementation will add research for the transfer path and the cross-DOM/3D number handoff after the visual gate.

## 1. Prototype mounting

**Decision**: Add one scene descriptor to the existing Creative Workbench catalogue and one builder module used by `workbench-runtime.js`.

**Rationale**: `AGENTS.md` requires the existing creative integration, registry and runtime. The workbench is already development-only, 404s in production by default, and mounts through `createCreativeSurface`, the same entry point as the Lucky Meter. A new prototype route would duplicate the sandbox and add a second surface to maintain.

**Alternatives considered**:
- A new `/lucky-meter/prototype` route: rejected for this gate; it would expose unfinished work and duplicate the workbench.
- A one-off HTML/canvas test: rejected; it would not test the production materials, stage and tier behavior.
- Building directly in `meter-scene.js`: rejected before the design is validated; it would destabilize the visitor route and prevent a clean comparison.

## 2. Development stage presets

**Decision**: Give the prototype scene three selectable stage presets: mobile 390 × 844, tablet portrait 820 × 1180 and desktop 1440 × 900. The workbench sizes the stage to the selected preset, centred, while the rest of the UI stays in place.

**Rationale**: The workbench's default canvas is 16:10. The brief prioritises mobile but requires an equally polished tablet and desktop presentation, so evidence must cover all three rather than a cropped desktop frame. These sizes match representative phone, tablet and laptop viewports and keep the evidence comparable across captures.

**Implementation note**: `WORKBENCH_STAGES` and `resolveWorkbenchStage()` live in `app/lib/graphics/workbench.js`; the scene declares `stages: ['mobile', 'tablet', 'desktop']`. `CreativeWorkbench.jsx` exposes a stage selector and `window.__creativeWorkbench.setStage(id)`. A stage change is part of the canvas key and the mount effect dependencies, so the surface is rebuilt at the new size; scenes without presets keep the 16:10 frame.

**Alternatives considered**:
- Capture the 16:10 canvas and crop: rejected; it would not test the real stage size or framing.
- Change the workbench for all scenes: rejected; the presets are scoped to the prototype scene.
- Only test phone plus one desktop crop: rejected; it would not catch tablet-specific edge clipping.

## 3. Responsive camera framing

**Decision**: Keep one perspective camera at `fov 32` and derive its distance and look-at height from the stage size. The pure `instrumentFraming(width, height)` returns:

| Stage | Size | Vertical world extent | Look Y | Distance |
|---|---|---|---|---|
| Phone | ≤ 500 px wide | 6.6 | -0.35 | ≈ 11.51 |
| Tablet portrait | Aspect < 1.05 | 4.5 | -0.2 | ≈ 7.85 |
| Desktop / landscape | Wider than tablet | 4.2 | -0.2 | ≈ 7.32 |

Distance is `verticalExtent / (2 * tan(fov / 2))`; perspective and all world geometry stay identical. At 390 × 844 the 6.6-unit extent gives a horizontal extent of about 3.05 units, so the 2.1-unit wheel occupies about 69% of the width. Tablet portrait uses a slightly wider 4.5-unit extent to keep the bowl and pointer off the stage edge; desktop uses 4.2 so the instrument remains a substantial centred collectible on a landscape screen.

**Rationale**: A single fixed camera distance cannot serve a tall phone and a wide desktop: it either crops the asymmetric bowl/pointer cluster or shrinks the instrument to a thumbnail. Changing only the distance/look-at keeps the wheel circular and the relative spacing intact, with no non-uniform scale. The tablet extent was widened after the first 820×1180 capture showed the bowl rim touching the left edge.

**Validation**: At 390 × 844 the captures read the wheel at roughly 270 px diameter and the bowl at roughly 158 px wide. At 820 × 1180 the wheel is roughly 551 px and the bowl keeps a visible left margin; at 1440 × 900 the wheel is roughly 450 px and remains centred with all parts visible. READY and FINISHED share the same framing at each size; only the medallion, selected chamber and bowl change.

**Alternatives considered**:
- Fixed `z = 11.5` at every size: rejected; tablet/desktop would be a small thumbnail in a large stage.
- Fixed `z = 7.32` at every size: rejected; phone composition would crop the pointer/bowl.
- Non-uniform stage scaling or CSS transform: rejected; it would distort the circular instrument and text.
- Separate tablet-only camera: unnecessary; one camera with size-derived framing preserves the same perspective.

## 4. Gold material and environment

**Decision**: Reuse the production `materials.gold` preset and create the same small procedural PMREM room used by `meter-scene.js` for reflections.

**Rationale**: A metallic gold material without an environment map reads black or flat. The production scene already solves this with a dark room and warm strip panels; reusing that approach keeps the prototype representative and avoids a new asset or dependency. The room is generated once at mount and disposed with the scene.

**Alternatives considered**:
- `RoomEnvironment` from Three addons: viable, but adds an import path and a generic studio look. The production room is already tuned for this gold.
- A texture-based HDRI: rejected; it would add a download and a licence record for a prototype.

## 5. Faceted crystal bowl

**Decision**: Build the bowl from a single-wall shallow lathe profile with 12 radial segments and flat shading, plus a gold rim tube, gold foot/pedestal and a separate liquid volume with a surface disc. There is no second glass wall; the facets come from the low segment count.

**Rationale**: Flat-shaded low-segment lathe geometry reads as cut crystal facets at phone size without a transmission render pass. The reference bowl is wide and shallow, with a gold foot and a faceted glass wall. A single open shell keeps the silhouette readable and the liquid visible; a separate liquid disc lets the bowl fill without changing the glass. The prototype bowl is 0.62 units in radius and 0.36 units high, with the liquid at 0.27.

**Alternatives considered**:
- The existing lathed tumbler: rejected; it is the wrong silhouette and reads as a drinking glass, not the reference's crystal bowl.
- A high-poly smooth bowl with transmission: rejected for cost and fragility on software WebGL.
- A flat CSS bowl: kept for the no-WebGL fallback, not the primary 3D prototype.

## 6. Medallion flip

**Decision**: Build the medallion as a real gold maple-leaf mesh in front of a dark well and a percentage plane. Animate the leaf group's `rotation.y` from 0 to π, move it up and scale it to roughly 0.28 as it passes halfway, and keep it as the small top-of-well ornament. Fade the percentage plane in from the midpoint.

**Rationale**: The brief requires a physical turn, not a flat fade. A real mesh rotating in perspective gives the correct silhouette, highlight movement and occlusion. The small settled leaf matches the reference's final well. The percentage plane behind it stays crisp and is independent of the 3D rotation.

**Time mapping**: `0.00–1.25 s` turn; `1.25–2.00 s` hold; `2.00–4.00 s` pour/fill; `4.00–6.00 s` finished hold. The centre group counter-rotates against the wheel so the percentage and medallion remain upright while the 12 chambers turn; the chamber frames are pierced with recessed enamel, and the selected chamber gets a gold floor for the empty state.

**Alternatives considered**:
- Rotating the whole wheel: rejected; the wheel must stay locked.
- A DOM 3D flip: rejected for the primary prototype; it would not test the real gold geometry.
- A simple opacity cross-fade: rejected; it does not satisfy the physical-turn requirement.

## 7. Prototype palette and selected result

**Decision**: Use the current date's twelve-colour palette from `sparks-and-seasonal-colours.js`, select the `deep-teal` entry when present, and place it under the fixed 7:30 pointer using the existing `colourPointerRotation` rule.

**Rationale**: The final reference uses Deep Teal (`#32666A`) with a full teal bowl. Using the real palette and the real pointer maths makes the comparison meaningful and avoids a second colour definition. The number shown in the chamber is illustrative only (for example 27); the prototype does not generate or store a result.

**Alternatives considered**:
- Hard-code 12 arbitrary colours: rejected; it would not validate the real chamber palette.
- Use the high-saturation reference colours only: rejected; the production palette must remain authoritative.

## 8. Capture method

**Decision**: Use the repository Playwright wrapper to open the development workbench, select `lucky-meter-instrument`, set each stage preset, freeze the scene at the two timestamps, and capture the stage element to the feature evidence directory.

**Rationale**: The workbench's own PNG capture may be refused for WebGL canvases; the workbench UI itself documents a Playwright stage screenshot as the reliable path. The repository's Playwright wrapper is the documented browser entry point and provisions Chromium.

**Implementation note**: Capture from `http://localhost:3000`, not `127.0.0.1`. The Next development server blocks the cross-origin HMR connection on the loopback IP and the workbench never hydrates. Wait until `getState().stage` matches the preset, `stageSize` matches, and `surface === 'ready'` after `setStage`, then set the time. The stage border adds 1 px to the element screenshot; crop back to the exact preset size before saving.

**Captures**:
- `evidence/ready-{mobile,tablet,desktop}-{size}.png` at `setTime(0)`.
- `evidence/finished-{mobile,tablet,desktop}-{size}.png` at `setTime(4.5)`.

Exact sizes: mobile 390 × 844; tablet 820 × 1180; desktop 1440 × 900.

**Limitation**: The VM has no hardware GPU or physical devices; the captures use software-rendered Chromium at device scale factor 1. They are valid for composition, geometry, safe-margin and material review, not for physical-device frame-rate, high-DPR or cross-browser claims.

## 9. What the prototype deliberately omits

- The Milky Way background (the production route keeps it; the prototype uses a dark halo so the gold and bowl read clearly).
- The ribbon, result plaques, Start/Home/Share controls and Spark (validated after the geometry gate).
- The full reveal sequence and timing (validated in the full implementation).
- Production `meter-scene.js` changes (deferred until the prototype is approved).

## 10. Open questions deferred to the post-prototype review

- Does the faceted bowl read as crystal at 390 px, or does it need more facets/stronger rim highlights?
- Is the medallion's settled position and size correct against the reference's final well?
- Does the gold need a warmer face light or a stronger environment intensity?
- Is the wheel's relative size on mobile correct, or should the stage be slightly narrower/taller?
- Should the chamber number be more/less visible during the drain?
- Is the tablet portrait framing (4.5) the right balance between safe margins and instrument presence?
- Should desktop eventually use the extra width for result plaques or Spark composition rather than a centred collectible only?

## 11. Prototype result (2026-11-25)

The READY and FINISHED captures are in `evidence/`. They confirm:

- The wheel, medallion, pointer, chamber drain and bowl fill are one coherent 3D object at 390 × 844.
- The medallion turns physically; the percentage well and `HIGH RESONANCE` are upright in FINISHED.
- Only the 7:30 chamber drains; the other eleven remain full, and the bowl fills with the autumn Deep Teal.
- The number 27 is legible in the empty chamber on its gold floor.
- The bowl reads as a wide, shallow faceted vessel on a gold foot, not the old tumbler.

Known differences from the references, left for the owner's comparison:

- The prototype intentionally omits the ribbon, plaques, Start/Home/Share controls, Spark and Milky Way route chrome; the lower third is empty.
- The medallion still uses the shared stamped silhouette, which is broader than the new pointer but still more star-like than a natural maple blade. The full implementation can decide whether to adopt the pointer outline for the medallion.
- The enamel has a satin two-lobe specular sheen rather than a full clearcoat environment reflection; the gold frames carry most of the shine.
- The reference's final bowl is more saturated; the prototype uses the real autumn palette, so Deep Teal is slightly muted.

### Refinement pass (owner review, 2026-11-25)

The first captures showed three gaps; all three were refined and both states recaptured:

- **Empty bowl:** replaced the tinted `MeshPhysicalMaterial` shell with a custom Fresnel crystal shader, per-triangle facet normals, white additive facet edges, and thin glass rim/base highlights. The bowl now reads as clear cut crystal in READY and keeps its facets behind the teal fill in FINISHED.
- **Pointer:** replaced the shared long-stem silhouette with a broad five-lobed maple outline, a shortened stem, engraved veins and a soft dark silhouette. The pointer now sits outside the 7:30 rim with its tip touching the selected chamber, leaving `27` fully visible.
- **Enamel:** added a second specular lobe, a Fresnel edge and a warmer sheen to the chamber shader. The fills keep their seasonal saturation instead of washing toward white; the gold frames and bevels carry the hard highlights.

The refined evidence files are `ready-mobile-390x844.png` and `finished-mobile-390x844.png` (exactly 390 × 844).

The prototype is development-only and no visitor route file was changed. Full implementation remains gated on the owner's comparison.

These are visual review questions answered by the owner's comparison, not blockers to the prototype.

## 12. Responsive prototype result (2026-11-25)

**Decision**: Extend the same prototype scene, geometry and renderer to three development stages rather than building a separate responsive mock. The camera framing is size-derived; the workbench stage is selectable and capturable; production responsive layout remains for the next gate.

**Evidence** (all exact-size, software-rendered Chromium):

| State | Mobile | Tablet portrait | Desktop |
|---|---|---|---|
| READY | `ready-mobile-390x844.png` | `ready-tablet-820x1180.png` | `ready-desktop-1440x900.png` |
| FINISHED | `finished-mobile-390x844.png` | `finished-tablet-820x1180.png` | `finished-desktop-1440x900.png` |

**Observations**:

- **Mobile 390×844** keeps the approved composition: crystal bowl clearly empty in READY, broad veined pointer outside the rim, `27` fully visible, saturated two-lobe enamel, and a clearly filled teal bowl in FINISHED. The lower third remains reserved for production plaques/Spark.
- **Tablet 820×1180** keeps the wheel circular and the full instrument visible. The first capture put the bowl rim on the stage edge; widening the tablet extent to 4.5 restored a visible left margin while keeping the instrument large (wheel roughly 551 px). `78%`, `HIGH RESONANCE` and `27` remain readable; the pointer is fully visible.
- **Desktop 1440×900** presents a centred collectible composition with the wheel circular and all parts visible. The landscape side space is deliberate breathing room rather than a stretched phone layout; the wheel remains roughly 450 px and the results are readable. No clipping or distortion.
- All six captures use the same geometry and materials; only camera distance/look-at change with stage size. READY and FINISHED are deterministic at 0.00 s and 4.50 s at every size.

**Limitations**: Software-rendered Chromium at device scale factor 1 only; no physical phone/tablet, high-DPR display, touch input, cross-browser or hardware-GPU verification. The production route's DOM layout, safe zones, Spark and controls are not part of this prototype, so SC-011 is deliberately limited to the prototype's circular wheel, undistorted proportions and stage-edge safe margins. It does not claim production responsiveness; SC-006 and FR-033–FR-036 remain the production acceptance criteria, verified in the full-implementation phase. No visitor route file changed.

**Verification**: focused workbench 18/18; responsive framing 4/4; full Vitest 1,265/1,265 across 113 files; `tsc --noEmit` exit 0; clean production build 394,624 KB (385.38 MiB), below the 495 MiB cap; `git diff --check` clean. Physical-GPU performance remains unverified.

## 13. Production implementation and responsive QA (2026-11-25)

- The visitor route now uses the approved instrument and the corrected timing: the tier sentence starts at lock and is removed before the celebration; the wheel lock, medallion flip, crystal bowl, selected-chamber drain, in-chamber number, golden transfer and separate **Your Lucky Number** panel are all live.
- The finished controls are a corner overlay: countdown upper-left, Home upper-right and a compact Share control directly beneath Home. The temporary tier sentence is not retained in FINISHED; the Spark occupies that reserved sky area.
- Phone 320–430 px keeps the stacked meter, colour plaque and two separate reading panels. It scrolls vertically at 320×568 because the Spark, instrument and results cannot all fit above the fold; there is no horizontal overflow.
- Tablet portrait 820×1180 keeps one readable column with a larger 432 px stage. Desktop 1440×900 uses a deliberate three-part row (Spark, instrument, results). Landscape 844×390 uses a compact row with the season label dropped, the colour name preserved and the legal disclaimer retained in the results column.
- The production framing is `stageFraming()` (3.9 phone, 3.6 larger; look-at −0.15). The prototype keeps `instrumentFraming()` for its workbench stages. No non-uniform scale is used.
- Browser evidence: `evidence/production/ready-mobile-390x844.png`, `generation-mobile-390x844.png`, `pour-mobile-390x844.png`, `finished-mobile-390x844.png`, `finished-tablet-820x1180.png`, `finished-desktop-1440x900.png`, `finished-landscape-844x390.png` and `finished-320x568.png`.
- Focused Playwright coverage sets each viewport explicitly and asserts no horizontal overflow, the desktop/landscape row composition, and the phone stack with the number below the colour. Eight responsive cases plus the finished-resume case pass on the desktop project. The test runner must use Playwright's own `127.0.0.1` web server; a manually started `0.0.0.0` dev server triggers Next's cross-origin dev-resource block for `127.0.0.1`, which prevents hydration in the tests even though `localhost` works for manual inspection.
- The temporary tier sentence has one lifecycle in the animated path: written at lock, settled, then unmounted before the celebration's first frame, and never restored in FINISHED. Under reduced motion no celebration runs, so the complete sentence stays visible with the finished reading; that is the one path where FINISHED retains it. The browser cases assert each path explicitly.
- Limitations remain: software Chromium, DSF 1, no physical devices, high-DPR, touch, cross-browser or hardware-GPU performance evidence.

### 13.1 Playwright version and failure investigation (2026-11-25, post-submission review)

- `package.json`, `pnpm-lock.yaml` and the installed tree all resolve `@playwright/test`, `playwright` and `playwright-chromium` to **1.65.1**. The npm `latest` tag is also 1.65.1; the 1.66 line exists only as `next`/alpha prereleases. There is no stable newer release to adopt, so the dependency is unchanged.
- The earlier browser failures were not a Playwright defect. Three causes were confirmed: two stale Playwright assertions still expected the temporary tier sentence during the celebration, and the reduced-motion case both required the element to be absent and then queried it. All three were test defects, repaired against Spec 218 acceptance scenario 1 and the unit-level lifecycle tests.
- The remaining flakiness is environmental: the generating stage commits on a 1.9 s timer, and under concurrent software-WebGL projects the commit can land after the first generation sample, so the first observed percentage is above zero. CI's retry covers that timing; the production code's start-at-zero sampling is covered by the unit suite. No product change was made for it.
- Server configuration and hydration were also re-checked: Playwright's own `127.0.0.1:3000` web server hydrates correctly, while a manually started `0.0.0.0` server triggers Next's cross-origin dev-resource block for `127.0.0.1`. That is a harness rule, not an application defect.
- The first Visual QA run on the pushed head failed both shards. Shard 1's failure was reproduced locally with `CI=1`: `summer renders its own twelve exact colours and panel values` polled `data-chamber-ids` with `expect.poll`'s default 5 s timeout, and the stage renders one placeholder chamber until the stored reading hydrates. Under the slower CI runner hydration can exceed 5 s. The poll now allows 25 s, the same budget as the spec's other stored-state waits, and still requires all twelve seasonal ids; a local re-run of the four palette cases passed 4/4 and `tsc --noEmit` exited 0. Shard 2 contains thirteen spec files this PR does not modify (`crystal-ball*`, `homepage*`, `mobile-accessibility`, `turnstile-loading` and others), so its result is tracked but not repaired inside the Spec 218 scope.
