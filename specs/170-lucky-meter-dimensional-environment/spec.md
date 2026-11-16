# Feature Specification: Lucky Meter Dimensional Environment

**Feature Branch**: `freebuff/51520cf7c26c97a2e1b3bcde`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Deliver a substantial second-pass visual upgrade to the Lucky Meter, making its medallion, golden Canadian maple leaves, meteors, lightning and fireworks significantly more realistic, dimensional and cinematic, while maintaining excellent performance on mobile and desktop."

## Context

This is a refinement of the experience delivered by
`specs/164-lucky-meter-cinematic-redesign`, not a repeat of it. Spec 164 built
the cinematic composition, the far/near additive WebGL stage, the adaptive
quality profile and the recorded audio. Nothing in that feature record is
rewritten here.

Measured inspection of the delivered result at 1440 × 900, 390 × 844 and
412 × 915 identified the remaining artificial qualities:

- The medallion is a stack of CSS circles: a conic-gradient rim, three masked
  conic arcs and a flat dark disc. It reads as a printed sticker, with a bright
  band that is lit from below, no bevel, no thickness and no perspective.
- The two maple leaves are a static 112 × 122 px SVG starburst. They are not a
  Canadian maple-leaf silhouette and they are flat, unmoving and unlit.
- Meteors draw a straight sampled line with a bright dot at the head. There is
  no smoke, no fragment debris, no atmospheric wake and no perspective.
- Lightning is a 2D segment fractal rasterised as point sprites. Both layers
  share one scale, so distance is simulated rather than projected, and the sky
  between strikes is visually identical to the welcome state.
- Fireworks are isolated point shells in a small corner of the sky. The night
  sky behind and around a burst does not change, so nothing appears to be lit.
- The result of a burst is a small, dim, uniformly dotted cluster rather than a
  three-dimensional shell with trails and drifting embers.

The visual identity, typography, colours, copy, audio and choreography are
correct and stay. What changes is that the effects stop being flat animations
laid over a photograph and become geometry and light in one shared space.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A physical gold medallion (Priority: P1)

A visitor sees a crafted circular medallion, not a circular graphic. It has a
raised outer rim, a milled coin edge, a recessed enamel well and a bevelled
inner bezel. Its gold responds to light: a tight specular highlight sweeps
across the rim as the medallion turns slightly toward the pointer, the bevels
catch reflected sky on one side and warm ground light on the other, and the
disc visibly sits in front of the sky rather than on it. The percentage, tier
and supporting reading remain crisp and fully legible on the enamel well.

**Why this priority**: The medallion is the permanent centrepiece. It is on
screen in every state, so its flatness is the most visible defect.

**Independent Test**: Capture the welcome, scrambling and landed states on a
capable WebGL path and a WebGL-disabled path. Confirm the gold carries a moving
specular highlight and a bevel edge, that the centre is a recessed well, that
fallback still renders a complete metallic meter, and that all text is legible.

**Acceptance Scenarios**:

1. **Given** a capable browser, **When** the meter renders, **Then** the
   medallion shows a bevelled rim, a milled edge, a recessed well and a lit
   inner bezel, with at least one highlight that moves as the pointer moves.
2. **Given** a browser without WebGL, **When** the meter renders, **Then** a
   complete static metallic medallion still appears and every label is legible.
3. **Given** any viewport in the supported set, **When** the result lands,
   **Then** the percentage, tier label and tier message are fully inside the
   enamel well without clipping or moving.

### User Story 2 — Golden maple leaves as three-dimensional ornaments (Priority: P1)

Gold maple leaves drift through the scene. Each has a recognisable Canadian
maple-leaf silhouette with eleven points, defined lobes and a stem. They are
extruded and bevelled so they catch light along their edges, they rotate so
their thickness becomes visible, and they sit at genuinely different distances:
some small and hazy near the horizon, some large and sharp crossing the frame,
and occasionally one passing in front of the medallion.

**Why this priority**: The existing leaf artwork is the most cartoonish element
on the page and it carries the Canadian identity of the experience.

**Independent Test**: Capture the frame over several seconds. Confirm the
silhouette is a maple leaf, that leaves show an edge and a thickness as they
rotate, that leaf size and contrast vary with an apparent distance, and that at
least one leaf renders in front of the medallion while others render behind it.

**Acceptance Scenarios**:

1. **Given** the meter page, **When** it is idle, **Then** golden maple leaves
   move slowly through the scene with visible depth ordering.
2. **Given** a leaf rotating, **When** it turns past edge-on, **Then** its
   extruded edge and thickness are visible rather than a flat plane.
3. **Given** the capable quality profile, **When** a near leaf crosses the
   meter, **Then** it renders in front of the medallion and is not clipped by
   it; on a constrained profile that depth layer is omitted entirely.
4. **Given** reduced motion, **When** the page loads, **Then** the leaves are
   drawn in a still, composed arrangement with no animation.

### User Story 3 — Meteors that burn through the atmosphere (Priority: P2)

A shower crosses the sky with real perspective. Heads are small, intensely hot
nuclei with a short-lived flare; behind each is a tapering trail that begins
white, passes through gold and orange into deep red, and dissolves into a
widening smoke wake that lingers after the head has gone. Sparks shed from the
trail, decelerate and fade. Distant meteors are short, dim and slow; close ones
are large, fast and cross the frame.

**Why this priority**: Meteor Shower is the most frequent event, so its
artificiality is the one most often seen.

**Independent Test**: Capture four beats of a meteor event at desktop and
mobile widths. Confirm a colour progression along each trail, a smoke wake that
outlives the head, shed sparks, and a measurable size and speed difference
between the nearest and furthest meteors.

**Acceptance Scenarios**:

1. **Given** the Meteor Shower event, **When** a meteor crosses, **Then** its
   trail shows a head-to-tail colour progression rather than one flat colour.
2. **Given** a meteor that has passed, **When** its head leaves the frame,
   **Then** a smoke wake and embers remain visible for a further moment.
3. **Given** the same event, **When** all meteors are compared, **Then** near
   and far meteors differ in apparent size, brightness and screen speed.

### User Story 4 — Lightning in real space, near and far (Priority: P2)

Strikes are electric discharges inside the sky rather than drawings on it.
Channels branch irregularly, a white-hot core sits inside a cool sheath, and
strikes exist at several distances: thin distant bolts close to the vanishing
point, mid-distance bolts, and at least one close strike that is thick, passes
the frame edge and momentarily lights the whole environment. Each strike lights
the atmosphere around it and the light fades with a flicker rather than
switching off.

**Why this priority**: The current event has no visible atmosphere between
strikes; the lightning reads as a decal, not a discharge.

**Independent Test**: Capture a full lightning event. Confirm at least one
strike renders thin and central and one renders thick and near an edge, that
the surrounding sky brightens measurably at a strike, and that brightness
persists for a short afterglow.

**Acceptance Scenarios**:

1. **Given** the Cosmic Lightning event, **When** strikes are reviewed,
   **Then** at least one distant and one close strike occur with visibly
   different channel thickness and screen position.
2. **Given** a strike, **When** it fires, **Then** a sampled region of sky away
   from the channel measurably brightens compared with the frame before it.
3. **Given** the strike has ended, **When** the next sample is taken, **Then**
   a residual glow is still present rather than an instant return to black.

### User Story 5 — Fireworks that light the night sky, with a golden climax (Priority: P1)

The fireworks display reads as a real show. Red and white/silver shells open
as three-dimensional spheres with individual trails, drifting sparks and fading
embers, at different positions, sizes and distances. Each explosion spreads its
colour across the surrounding sky: the atmosphere brightens, smoke nearby picks
up the red, white and silver light, and the light fades over about a second.
The final shell is unmistakably the climax: a much larger golden multi-shell
explosion with dense cascading trails, a shockwave, a long willow fall and the
strongest, warmest environmental illumination of the whole sequence, which
lingers as the sparks fade.

**Why this priority**: The brief's headline requirement is that fireworks
visibly illuminate the sky, and the golden finale is the payoff of the event.

**Independent Test**: Capture the opening red burst, a silver burst and the
finale. Confirm the sky around each burst changes colour and brightness,
confirm the finale is substantially larger and warmest, and confirm the linger
after the finale.

**Acceptance Scenarios**:

1. **Given** a red or silver burst, **When** it detonates, **Then** the sky
   around it brightens in the burst's colour and then returns over time.
2. **Given** the golden finale, **When** it detonates, **Then** its measured
   illuminated area, peak brightness and warm colour cast all exceed every
   opening burst.
3. **Given** the finale has peaked, **When** the event nears its end, **Then**
   golden sparks, smoke and warm atmosphere are still fading rather than gone.
4. **Given** the existing audio, **When** the finale fires, **Then** the
   existing recorded finale boom still plays unchanged.

### User Story 6 — Premium result presentation and supporting interface (Priority: P3)

HIGH RESONANCE — and the other tiers — are presented inside a refined gold
framed plate with correct hierarchy, letter-spaced small caps and a metallic
treatment that matches the medallion. The Little Spark panel, the decorative
framing, the Share control, the countdown and the Home control share one
consistent, finished visual language.

**Why this priority**: The interface must not look flat next to dimensional
effects, but it must never lose readability.

**Independent Test**: Capture every state at desktop and both mobile widths and
confirm no label drops below 12 px, no text clips, and each control remains in
the same place and keeps working.

**Acceptance Scenarios**:

1. **Given** a landed result, **When** it is displayed, **Then** the tier is
   presented in a framed plate and remains legible at every supported width.
2. **Given** the supporting panels, **When** they appear, **Then** they share
   consistent spacing, borders and typography with the rest of the scene.
3. **Given** any control, **When** it is used, **Then** it behaves exactly as it
   did before this feature.

### User Story 7 — Sustained performance (Priority: P1)

The upgraded visuals stay smooth. Rendering resolution, pixel ratio, particle
counts, shader work and optional layers follow the existing capability profile
and frame-rate governor. A constrained phone reduces cost instead of stuttering,
a hidden tab stops all work, resizing and rotation are handled, a lost context
degrades safely, and every GPU resource is released on teardown.

**Why this priority**: The brief makes performance an acceptance requirement,
not a follow-up.

**Independent Test**: Measure frame timing during each event at desktop and both
mobile widths; force the constrained profile; disable WebGL; hide the tab;
lose a context; enable reduced motion.

**Acceptance Scenarios**:

1. **Given** a capable environment, **When** each event runs, **Then** frame
   timing is measured and reported for every event and viewport.
2. **Given** a constrained profile, **When** the page loads, **Then** no near
   ornament layer and no near effect surface are created.
3. **Given** WebGL is unavailable, **When** the page loads and an event runs,
   **Then** static fallbacks render and the sequence still completes.
4. **Given** the page is hidden, **When** it is restored, **Then** rendering
   resumes without skipping the finale.
5. **Given** the component unmounts, **When** teardown runs, **Then** every
   buffer, program and context handle it created is released.

### Edge Cases

- A very short or landscape viewport: the medallion keeps its percentage,
  tier label and message inside the enamel well.
- The compact 300 × 250 widget: the medallion and leaves stay proportional and
  the leaves do not intrude on the reading.
- WebGL unavailable for one surface but available for another: each renderer
  degrades independently; the medallion falls back to its static form while the
  event stage still runs.
- Context lost mid-event: the stage completes on its safety timer and the
  medallion falls back without leaving an empty hole.
- Reduced motion: no animated leaves, no tilt animation, no event stage; a
  static lit frame is drawn once.
- Extremely wide or 4K surfaces: quality resolves down from backing-store cost
  rather than from an assumed device class.
- Every effect must keep the Milky Way artwork underneath visible; no new layer
  may be opaque over it.

## Requirements *(mandatory)*

### Functional Requirements

**Medallion**

- **FR-001**: The medallion MUST be rendered as lit three-dimensional geometry
  with a raised outer rim, a milled edge, a recessed enamel well and a bevelled
  inner bezel, not as stacked CSS circles.
- **FR-002**: Its gold MUST respond to light with a tight specular lobe, a
  broader secondary lobe, a Fresnel-weighted environment reflection and
  contrasting ambient sky and ground light.
- **FR-003**: Its orientation MUST change subtly with pointer position on
  fine-pointer devices and with a slow drift otherwise, so highlights move.
- **FR-004**: The percentage, tier label and tier message MUST remain DOM text
  above the medallion, legible and unclipped at every supported width.
- **FR-005**: With WebGL unavailable the medallion MUST still render a complete,
  static metallic appearance and no GPU resource may leak.

**Leaves**

- **FR-006**: Golden maple leaves MUST be procedurally generated geometry with
  a recognisable Canadian maple-leaf silhouette including eleven points,
  defined lobes and a stem.
- **FR-007**: Each leaf MUST be extruded with a bevelled edge so thickness and
  edge highlights are visible as it rotates.
- **FR-008**: Leaves MUST occupy at least three apparent distances, with size
  and atmospheric contrast varying by depth.
- **FR-009**: On capable profiles at least one leaf MUST be able to render in
  front of the medallion; on constrained profiles that layer MUST NOT exist.
- **FR-010**: Leaf movement MUST be slow and continuous, and MUST stop under
  reduced motion.

**Meteors**

- **FR-011**: Meteor positions, sizes and trail geometry MUST be projected from
  a shared three-dimensional camera so distance changes apparent size and speed.
- **FR-012**: A meteor trail MUST progress through a hot white head, gold, orange
  and deep red into an ember tone.
- **FR-013**: A meteor MUST leave a smoke wake and shed sparks that persist
  briefly after its head has left the frame.
- **FR-014**: Meteor placement MUST include foreground, middle-distance and
  background meteors.

**Lightning**

- **FR-015**: Lightning channels MUST be built as branching polylines in three
  dimensions and projected, so distant strikes converge and close strikes are
  wide.
- **FR-016**: Each channel MUST render a white-hot core inside a cooler sheath
  with irregular flicker and a short afterglow.
- **FR-017**: Each event MUST contain at least one distant, one mid-distance and
  one close strike.
- **FR-018**: A strike MUST raise the brightness of the surrounding sky and that
  light MUST decay rather than switch off.

**Fireworks**

- **FR-019**: Burst particles MUST be distributed on a three-dimensional sphere
  and projected, so different bursts present different apparent shapes.
- **FR-020**: Every burst MUST publish coloured light into the shared
  environment light set, and the surrounding sky MUST visibly brighten.
- **FR-021**: Smoke MUST take its colour from the light currently illuminating
  it.
- **FR-022**: The opening progression MUST remain red then white/silver, in the
  existing order and existing timing.
- **FR-023**: The golden finale MUST be substantially larger than every opening
  burst, with multiple shells, a willow fall and the strongest environmental
  illumination.
- **FR-024**: The finale's sparks, smoke and warm light MUST linger and fade
  naturally inside the existing event duration.
- **FR-025**: The existing finale boom recording MUST remain the finale's sound.

**Presentation**

- **FR-026**: The tier presentation MUST use a framed gold plate with a
  hierarchy and metallic treatment consistent with the medallion.
- **FR-027**: The Little Spark panel, supporting panels, Share control,
  countdown and Home control MUST share one consistent visual language.
- **FR-028**: No visitor-facing label in the Lucky Meter MAY render below 12 px.

**Shared environment**

- **FR-029**: The effects and the medallion MUST share one light model, so an
  explosion or strike measurably changes the illumination of the medallion and
  the leaves.
- **FR-030**: No new layer MAY obscure the Milky Way artwork; all new effect
  layers MUST be additive or transparent.
- **FR-031**: The far effect layer MUST remain behind the interface and the near
  layer in front of it, both pointer-transparent.

**Preserved behaviour**

- **FR-032**: The three tiers, their labels, thresholds and result assignment
  MUST be unchanged.
- **FR-033**: Result generation, event weighting, repeat guards, colour and
  Spark selection, persistence and local-midnight rollover MUST be unchanged.
- **FR-034**: The reveal sequence, its order, choreography, triggers, timings
  and event durations MUST be unchanged.
- **FR-035**: The Start action, Home navigation and lifecycle, Share behaviour
  and accessibility behaviour MUST be unchanged.
- **FR-036**: All existing audio files, cue assignments and cue timings MUST be
  unchanged, including the larger golden finale boom.
- **FR-037**: The Milky Way `<picture>` sources, sizes, `object-position`,
  overlay and layer order MUST remain byte-identical.
- **FR-038**: No new dependency, route, server write or database change MAY be
  introduced.

**Performance and lifecycle**

- **FR-039**: All new rendering MUST be budgeted from the existing capability
  profile; on the constrained profile the near ornament layer and near effect
  surface MUST NOT be created.
- **FR-040**: Frame timing MUST be measured for each event at desktop and both
  mobile Playwright viewports and reported separately from any software-rendered
  measurement.
- **FR-041**: Rendering MUST pause while the document is hidden and resume
  without skipping the finale.
- **FR-042**: Resize, orientation change and device-pixel-ratio changes MUST be
  handled without visual breakage.
- **FR-043**: WebGL context loss MUST degrade safely and MUST NOT strand the
  sequence or leave an empty layer.
- **FR-044**: Every buffer, program and observer MUST be released on teardown,
  and per-frame work MUST NOT allocate unbounded arrays.
- **FR-045**: Reduced motion MUST suppress all new animation and present a
  static lit composition.

### Key Entities

- **Scene light**: A screen-space coloured light with position, radius,
  intensity and colour, published by the event engine and consumed by the
  medallion and ornament renderers.
- **Lit mesh**: Vertex positions, normals and per-vertex albedo for one
  drawable three-dimensional object.
- **Depth-keyed effect**: An effect particle or structure carrying a camera
  depth that determines its projected size, brightness and screen motion.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a captured frame of the golden finale, the mean luminance of a
  sky region at least 250 px from the burst centre is measurably higher than the
  same region in the welcome frame.
- **SC-002**: The finale's illuminated area and peak luminance both exceed every
  opening red and silver burst measured in the same session and viewport.
- **SC-003**: In a lightning event, at least one strike channel is at least twice
  as wide on screen as another strike in the same event.
- **SC-004**: Meteor trail length and apparent head size differ by at least a
  factor of two between the nearest and furthest meteor in one event.
- **SC-005**: No Lucky Meter label computes below 12 px at 390 px and 412 px
  widths.
- **SC-006**: Every existing Lucky Meter unit, component and Playwright test
  continues to pass with no change to assertions that protect behaviour.
- **SC-007**: On a capable environment, the full sequence sustains at least
  55 FPS over a measured window, and any shortfall is reported with the exact
  environment rather than generalised.
- **SC-008**: `pnpm exec tsc --noEmit`, the full Vitest suite, the production
  build and `./freebuff-verify.sh` pass with the build strictly below 495 MiB.

## Assumptions

- The verification environment exposes no hardware GPU (`/dev/dri` absent), so
  all frame rates measured here are software-rendered and are reported as such.
- The existing WebGL 1 pipeline is extended rather than replaced; no second
  graphics engine and no new dependency is introduced.
- The measured gold palette already recorded in `app/globals.css` remains the
  colour reference for new material work.
- Audio, copy, layout regions, routes and data boundaries are unchanged.
