# Tasks: Lucky Meter — Dimensional Artwork Reconstruction

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1 — Artwork asset

- [x] T001 Produce a faithful rendition of the supplied Lucky Meter artwork (arched crimson banner, twelve-compartment gold wheel, laurel maple medallion, spout, crystal bowl, colour bar, number plaque).
- [x] T002 Store the retained source at `public/assets/lucky-meter-artwork-source.jpg`.
- [x] T003 Generate AVIF primary and WebP fallback derivatives at 880 w and 480 w.
- [x] T004 Declare the artwork AVIF in `app/lib/graphics/experiences.js` so the readiness hub warms it.

## Phase 2 — Materials and helpers

- [x] T005 Extend the enamel shader with depth, internal illumination, a cut edge and optional bubbles.
- [x] T006 Extend the crystal shader with diamond-cut facets, refraction, dispersion, twinkle, brightness and alpha control.
- [x] T007 Add `revolvedRingGeometry` and `beadRingGeometry` (instanced) helpers.
- [x] T008 Add `polishedGold`, `bronze` and `warmGold` metals within the existing material library.

## Phase 3 — Instrument geometry

- [x] T009 Sculpted layered housing: bronze case, revolved gold band, machined highlight rings, instanced rivets.
- [x] T010 Stepped inner bezel with a beaded border and bronze recess behind the plate.
- [x] T011 Enlarge `CHAMBER_CUP` and rebuild compartments as barrel glass, barrel enamel and a cabochon lens in bevelled seats.
- [x] T012 Medallion: red enamel inlay, raised veins, laurel wreath, beaded border, turned rings.
- [x] T013 Bowl: single faceted shell with a thick crystal rim, turned gold foot, sparkle sprites.
- [x] T014 Plaque: gilded frame with a real opening, deep black well, internal light, screws, finial.
- [x] T015 Colour bar: recessed bronze field, turned end caps.
- [x] T016 Banner: stronger arch, second raised enamel field, screws, lettering in front of the field.

## Phase 4 — Artwork as reflection foundation

- [x] T017 Load the artwork AVIF with a WebP fallback and rebuild the environment probe with it.
- [x] T018 Skip the request on the constrained tier and dispose both textures and targets on teardown.

## Phase 5 — Verification

- [x] T019 Focused Vitest suites (`lucky-meter-dimensional-renderers`, `lucky-meter-stage`).
- [x] T020 `tsc --noEmit` clean.
- [x] T021 Visual inspection of the ready state on the repository Playwright CLI at 900 × 1180.
- [x] T022 Production build under the 495 MiB cap.
- [ ] T023 Full Playwright Lucky Meter regression across the three projects (CI-authoritative).
- [ ] T024 Physical-device GPU verification (unavailable in this VM).
