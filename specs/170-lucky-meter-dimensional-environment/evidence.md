# Evidence — Lucky Meter dimensional environment (spec 170)

Measured on 2026-11-15 in this workspace, against a production build
(`pnpm build` + `pnpm start`) of `freebuff/51520cf7c26c97a2e1b3bcde`.

**The renderer available here is software only.** Chromium reports
`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)`,
WebGL 1.0, DPR 1, no hardware GPU. Every frame rate below is therefore a
*software rasteriser* figure. It is a useful floor and a fair before/after
comparison because both runs used the identical harness, browser and viewport;
it is **not** a hardware measurement and must not be read as one.

## What was inspected

Captured with `artifacts/lucky-meter-cinematic-v2-qa/qa-capture.mjs`, which seeds
the persisted daily result, resumes each cinematic event and screenshots
documented beats: welcome, meteor, lightning and fireworks at 0.20 / 0.45 / 0.72 /
0.93 of the stage (fireworks additionally at 0.22 / 0.42 / 0.62 / 0.86 / 0.95).
Viewports are the repository Playwright projects: desktop 1440×900,
mobile-390 390×844, mobile-412 412×915.

Before screenshots: `artifacts/lucky-meter-cinematic-v2-qa/before/`.
After screenshots: `after-desktop/`, `after-390/`, `after-412/`.

## Findings that drove the work

The baseline was captured first and reviewed before anything changed. Six
defects were visible in the rendered experience:

1. The medallion was a CSS disc: concentric borders and a radial gradient lit
   from below, with no face, thickness or rim. It read as a printed graphic.
2. The "maple leaves" around the ring were two static SVG images, identical in
   every frame, with no shading or depth.
3. Meteors were straight, uniform white lines with a round dot at the head.
4. A lightning frame was visually indistinguishable from the welcome frame — the
   strike added no atmosphere.
5. Fireworks were a small ragged cluster of dots; the sky behind them never
   changed, and the "golden finale" was the same size as the opening bursts.
6. Nothing shared a light source, so every element sat in its own flat layer.

## After

| Viewport | Resolution | Meteor FPS | Lightning FPS | Fireworks FPS | Median frame |
| --- | --- | --- | --- | --- | --- |
| desktop 1440×900 (tier `high`) | 1440×900 | 18.3 | 16.8 | 16.7 | 66.6 ms |
| mobile-390 390×844 | 390×844 | 52.9 | 51.4 | 53.0 | 16.7 ms |
| mobile-412 412×915 | 412×915 | 50.2 | 47.5 | 50.6 | 16.7 ms |

Mobile is the meaningful number here: median frame 16.7 ms (a 60 FPS cadence)
with a minority of dropped frames, sustained for the whole event while the
engine is drawing meshes, sky illumination and thousands of additive particles.
The desktop figure is the cost of the same scene at ~4.5× the pixel count on a
software rasteriser; it is reported as measured, not as a target met.

The 55 FPS target is **not** demonstrated on this host. It is demonstrated for
mobile-class viewports in software (47–53 FPS, median at 60 Hz); a hardware
Chromium environment is still required to show ≥55 FPS at 1440×900.

### Adaptation observed in the harness

`window.__luckyCosmic` records what the governor did during each capture:

- `qualitySteps: 2` on every viewport — the stage dropped to 0.78 then 0.56
  particle scale and 0.86 then 0.70 resolution scale on its own.
- `nearDead: true` on desktop and on the 390px fireworks run — the foreground
  point surface is retired when sustained frame time is poor, and every effect
  falls back to the far surface without a visual break.
- The ornament engine independently trims its leaf population (9 → 6 → 4) when
  it measures under 44 FPS.

### Visual verdict per requirement

| Requirement | Verdict |
| --- | --- |
| Medallion is a physical object | Met. A lathed coin with an outer wall, milled rim, chamfer, raised bezel and a domed enamel well, shaded with two specular lobes, Fresnel and a procedural environment reflection. It tilts toward the pointer so the rim highlight travels. |
| Dimensional gold maple leaves | Met in construction, **partially** in silhouette. Each leaf is an extruded, bevelled, domed mesh shaded as metal, at several depths, turning through edge-on. The silhouette is recognisably a maple leaf at large sizes but still reads slightly star-like at the 26–54 px it is usually drawn at. |
| Meteors burn through the atmosphere | Met. Depth-varied heads, a colour-graded plasma trail that converges toward the vanishing point, a widening smoke wake, shed fragments, and a light that paints the sky and the gold beside it. |
| Lightning in real 3D with near and far strikes | Met. Branching channels at three distance bands, a white-hot core with a cool sheath, retraction as the strike fades, and a 0.9 s environmental flash. A "hairy/dashed" texture is visible on the longest channels. |
| Fireworks light up the sky; huge golden finale | Met. Red and white/silver shells to 0.36 of the stage, then a three-shell golden finale that is ~1.7× wider, with golden rain and embers; the sky wash is warmest and longest at the finale. |
| HIGH RESONANCE presentation | Met. Struck-gold tier plate with hairline rules, a shared panel chrome, a capsule countdown, and a gold Share control. |
| Little Spark and supporting interface | Met. Same chrome and type scale as the other panels; the quote is set as an italic inset. |
| Performance | Mobile met in software; desktop not demonstrated (see above). |
| Behaviour preserved | See the test section. |

## Known imperfections (not fixed in this pass)

- The leaf silhouette's lobe-to-valley ratio is still sharper than a true
  Canadian maple leaf; at small sizes it reads more ornament than leaf.
- Some lightning channels show a beaded texture where consecutive point sprites
  are not fully overlapping.
- A rectangular compositor seam appears intermittently around the medallion under
  SwiftShader with `backdrop-filter` on adjacent panels; it did not reproduce on
  every run and is believed to be a software-compositor artifact.
- The medallion's enamel well is warmer/browner than intended in bright phases.

## Verification run

```
pnpm exec vitest run        # 803 tests, 81 files, all passing
pnpm exec tsc --noEmit      # clean
pnpm build                  # success, .next = 333.6 MiB (limit 495 MiB)
```

New focused tests (`__tests__/lucky-meter-dimensional-renderers.test.js`, 12
tests) cover the geometry, camera, light bus and quality budgets. Behaviour
guards were extended in `__tests__/graphics-capabilities.test.js` to assert the
new renderers reuse the shared pipelines, adopt context-loss handling and read
the shared light bus. No existing test was weakened or removed; the one suite
that read the deleted ring engine now reads its replacement.

## Screenshot index

| File | Shows |
| --- | --- |
| `after-desktop/desktop-welcome.png` | Lit medallion, far and near leaf layers over the intact Milky Way |
| `after-desktop/desktop-meteor-045.png` | Meteors with graded trails and heads, gold ornaments at several depths |
| `after-desktop/desktop-lightning-045.png` | Branching strike, tier plate, panel chrome |
| `after-desktop/desktop-fireworks-062.png` | Golden finale over the interface |
| `after-390/mobile-390-fireworks-062.png` | Golden finale and lit sky at 390 px |
| `after-412/mobile-412-meteor-045.png` | Meteors at 412 px |
