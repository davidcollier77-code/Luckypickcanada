# Implementation Plan: Lucky Meter — Dimensional Artwork Reconstruction

**Branch**: `freebuff/53aee5225e9ee1223201acfc` | **Date**: 2026-11-28 | **Spec**: [spec.md](./spec.md)

## Summary

Upgrade the existing single-scene Lucky Meter so every element is a constructed object: a layered gold housing, glazed enamel compartments, a medallion inside decorative rings, thick faceted crystal and a recessed, internally lit plaque. Add the reference artwork to the public assets with AVIF/WebP delivery and feed it into the scene's environment probe as the instrument's reflection source. Nothing about timing, selection, persistence, sound, fallback, layout or background changes.

## Technical Context

**Language/Version**: JavaScript / TypeScript on Next.js 16.4.6 (Node 26 per `package.json` engines).

**Primary Dependencies**: Three.js 0.187 through `app/lib/graphics/runtime.js`, `materials.js`, `lighting.js`, `particles.js`. No new dependency.

**Testing**: Vitest unit suites (`__tests__/lucky-meter-*.test.*`), `tsc --noEmit`, `next build --webpack`, repository Playwright CLI for visual inspection.

**Target Platform**: Mobile-first web on Cloudflare Pages, WebGL with the complete CSS meter as fallback.

**Constraints**: Build strictly below 495 MiB; no background-artwork change; no timing change; no new light beyond the current per-scene budget.

## Constitution Check

- Spec Kit order followed: specify → plan → tasks → implement.
- No security, persistence, rate-limit, payment, hosting or secret change.
- Protected files: none edited.
- Build budget unchanged and measured after implementation.
- Graphics work uses the existing toolkit, registry and readiness hub; no competing renderer.

## Design

### Geometry helpers (new, bounded)

- `revolvedRingGeometry(THREE, profile, segments)` — revolves a closed 2D cross-section into a solid ring lying against the instrument face. Used for the housing, the stepped bezel, the plate lip and the well rings.
- `beadRingGeometry(THREE, options)` — one `InstancedMesh` of small spheres for rivets and beaded borders. `frustumCulled = false` because the batch leaves the geometry's origin.

Both reuse one geometry per feature and one draw call per bead set.

### Materials

- Enamel shader extended with `uGlow`, `uBubbles`, `uSurface`, `uTime`: a depth gradient, internal illumination, a bright cut edge and (optionally) suspended micro-bubbles. The cut is pinned to the enamel's own top so the drain still shortens the mesh.
- Crystal shader extended with `uFacet`, `uFacetCount`, `uTintDeep`, `uBrightness`, `uAlpha`, `uTime`: diamond-cut facets from a quantised view-space normal, refraction through a two-pole sky, per-facet dispersion and twinkle, and a thickness-controlled alpha. One shell of geometry still produces the cut look.
- Two extra metals: mirror `polishedGold` and deep `bronze`, plus a warm self-lit `warmGold` for small ornaments that sit far from the key light.

### Housing

Deep bronze case → sculpted gold band (closed profile: outer wall, rolled lip, chamfer, inner return) → two machined highlight rings → instanced rivets → stepped inner bezel with a beaded border. A bronze recess sits behind the plate so each window reads as a compartment.

### Compartments

Barrel glass shell and barrel enamel column (lathe profiles) plus a convex cabochon lens, in a bevelled gold seat (`torus` stretched on the view axis) with a chamfered gold floor and a thin rim highlight. `CHAMBER_CUP` grows so the twelve circles fill their punched windows while clearing each other.

### Medallion

The shared maple silhouette, smaller than before, with a red enamel inlay inside its gold rim, raised veins, a laurel wreath of sixteen instanced leaves, a beaded border and turned gold rings, all inside the black well. The leaf keeps its flip, shrink and rise; the wreath and rings stay upright.

### Bowl

Double-walled faceted lathe (outer and inner shells), facet edges, a crystal rim with a gold fillet, a turned gold foot profile, and seven billboarded sparkle sprites. The liquid keeps its own profile-following shell.

### Plaque and bar

A gilded frame extruded from a rounded rectangle with a real opening, over a deep bronze case; the black well is set back inside with a glossy near-black material; a warm internal glow rises with the number's arrival; screws and a maple finial sit on the frame. The colour bar gains a recessed bronze field, turned end caps and larger gilt lettering.

### Banner

A stronger arch, a second raised enamel field, polished screw heads and lettering moved in front of the raised field.

### Artwork asset

`public/assets/lucky-meter-artwork-source.jpg` retained, with `.avif`/`.webp` at 880 w and 480 w produced from it. The scene loads the AVIF with a WebP fallback through `THREE.TextureLoader`, then rebuilds the PMREM environment with the artwork as a soft-box panel; the previous probe is disposed. The constrained tier and reduced motion skip the request. The AVIF is also declared in `app/lib/graphics/experiences.js` so the readiness hub warms it.

## Project Structure

```text
public/assets/
├── lucky-meter-artwork-source.jpg   # retained source
├── lucky-meter-artwork.avif/.webp   # 880 w primary + fallback
└── lucky-meter-artwork-480w.avif/.webp

app/lib/lucky-meter/
├── meter-scene.js                   # housing, compartments, medallion, bowl, plaque, banner, bar
└── meter-layout.js                  # cup size, banner height, stage crop

app/lib/graphics/experiences.js      # artwork texture declared for the hub

specs/230-lucky-meter-dimensional-artwork/
├── spec.md, plan.md, tasks.md, evidence/
```

## Risks and Mitigations

- **Tier cost**: all new detail reuses shared geometry or instancing; segment counts derive from the existing tier; no light is added.
- **Shader cost**: bubbles are hashed in the fragment shader and disabled on the constrained tier; facets are computed from the existing normal, not extra geometry.
- **Layout drift**: the stage crop and banner height are shared constants; the DOM overlays are projected from the same framing function.
- **Environment rebuild**: the artwork probe replaces the procedural one once, then disposes the old target; a failed load leaves the procedural probe in place.
