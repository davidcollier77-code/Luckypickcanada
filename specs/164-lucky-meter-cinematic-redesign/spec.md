# Feature Specification: Lucky Meter Cinematic Redesign

**Feature Branch**: `freebuff/645448188e4eb950b3b04f32`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Redesign the Lucky Meter into a cinematic, realistically rendered visual experience while preserving its existing functionality, reveal sequence, artwork and, above all, the existing Milky Way background."

## Context

The `/lucky-meter` page renders `DailyResonance`: a welcome line, a text-only
reveal of the percentage and tier, a stacked result card, and an additive WebGL
event stage (meteor, lightning or fireworks) over the existing Milky Way
photograph. The daily result, 4.5-second scramble, 0.8/0.6-second beats, event
durations, sharing and local-midnight rollover are already implemented and
tested. The supplied reference photograph is inspiration for composition and
cinematic depth only; it is not a layout to reproduce.

This feature keeps every existing result, timing, storage and sharing rule and
rebuilds the presentation around a persistent circular meter anchored toward the
bottom of the screen. It strengthens the existing GPU pipeline with layered
near/far rendering, adds recorded firework and thunder audio, and preserves the
Milky Way artwork byte-for-byte and style-for-style.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Preserved Milky Way and cinematic composition (Priority: P1)

A visitor opens the Luck Generator and sees the established Milky Way artwork
exactly as before, with the new experience anchored toward the bottom of the
frame and generous open sky above it. The circular meter is the visual centre,
the Start action sits above it, supporting information is balanced beneath it,
and the Home control is in the top-right corner.

**Why this priority**: The artwork and identity are non-negotiable. Without a
faithful, uncluttered composition the redesign is not acceptable regardless of
its effects.

**Independent Test**: Compare the background `<picture>` sources, sizing,
position and overlay with the previous implementation and inspect the welcome
layout at desktop, tablet, portrait phone and landscape phone widths.

**Acceptance Scenarios**:

1. **Given** the meter page loads, **When** the first frame renders, **Then**
   the Milky Way image, its responsive sources, `object-position`, overlay and
   layering are unchanged and no new effect covers or recolours it.
2. **Given** any supported viewport, **When** the page is shown, **Then** the
   meter, Start button, Home control and supporting content are readable,
   uncut and leave open sky above the meter.
3. **Given** the welcome state, **When** the visitor has not started, **Then**
   no percentage, tier, lucky colour, lucky numbers or result colour is shown.

### User Story 2 — Lifecycle-accurate Home control (Priority: P1)

The Home control follows the reveal. It is visible before Start, disappears the
instant Start is pressed, stays hidden through the scramble, landing, details
and the whole cinematic event including the last falling golden sparks, then
returns. Refreshing during an unfinished reveal does not bring it back early.

**Why this priority**: Home is the visitor's escape hatch and a visible proxy
for whether the daily ritual has finished. Showing it mid-event breaks both the
cinematic illusion and the persisted lifecycle contract.

**Independent Test**: Record Home visibility at every beat, refresh mid-event,
and confirm it only returns after completion. Change the local date and confirm
it returns with the fresh welcome state.

**Acceptance Scenarios**:

1. **Given** the welcome state, **When** it renders, **Then** Home is visible in
   the top-right corner.
2. **Given** Start is pressed, **When** the reveal begins, **Then** Home is
   removed immediately and does not reappear until the event and its sparks end.
3. **Given** a refresh during the scramble or event, **When** today's result is
   restored, **Then** Home stays hidden and the unfinished cinematic resumes,
   completing before Home returns.
4. **Given** local midnight passes, **When** the meter resets, **Then** Home is
   available in the new welcome state.

### User Story 3 — Video-like meteors, lightning and fireworks (Priority: P2)

The visitor watches meteor, lightning or firework events with convincing depth,
perspective, illumination and particle behaviour. Meteors cross both behind and
in front of the meter, lightning branches through background and foreground
with atmospheric light, red fireworks read as dense rounded bursts while white
and silver reads as fine crackling, and the golden finale is a clearly superior
chrysanthemum-plus-willow show whose sparks fall across the interface.

**Why this priority**: Visual quality is the purpose of the redesign. Effects
must read as a produced cinematic sequence, not ordinary decorative motion.

**Independent Test**: Run each event on a capable GPU, inspect near/far
compositing, particle shapes, choreography, the golden sparks over the
interface, and confirm every event ends cleanly with no abrupt canvas clear.

**Acceptance Scenarios**:

1. **Given** the Meteor Shower, **When** it runs, **Then** 12–16 depth-varied
   meteors cross the sky, at least some render in front of the meter and the
   rest behind it, with glowing plasma trails and a dominant close finale.
2. **Given** Cosmic Lightning, **When** it runs, **Then** 5–7 branching strikes
   at varied depths include background and foreground bolts, atmospheric
   illumination and a huge close finale, while the existing lightning sound is
   preserved.
3. **Given** Fireworks, **When** it runs, **Then** opening bursts alternate
   visibly different red rounded and white/silver crackling identities, and the
   finale is a large spherical golden chrysanthemum with long willow trails and
   foreground sparks falling over Little Spark, the colour, numbers, Share and
   countdown.
4. **Given** the finale ends, **When** the event duration is reached, **Then**
   sparks have naturally fallen and faded, the canvas fades rather than clearing
   abruptly, and the result remains visible.

### User Story 4 — Adaptive GPU quality and stability (Priority: P3)

The experience uses each browser's own hardware-accelerated graphics path when
available, adapts particle counts, shader work, resolution and pixel ratio to
measured capability and live frame rate, and degrades gracefully when WebGL is
missing or a context is lost.

**Why this priority**: The redesign adds heavy effects and must remain stable,
responsive and usable on the actual range of Chrome, Firefox, Safari, Edge,
Opera and Samsung Internet devices.

**Independent Test**: Run with hardware WebGL, with WebGL disabled, with a lost
context, at several DPRs and viewport sizes, with the tab hidden and restored,
and under reduced motion; compare frame timing and confirm controls stay
clickable.

**Acceptance Scenarios**:

1. **Given** a capable device, **When** the events run, **Then** near/far
   layers, haze and full particle budgets are used and rendering targets 60 FPS.
2. **Given** a constrained device or sustained low frame rate, **When** the
   governor detects it, **Then** resolution and particle budgets step down
   without a visible restart or control lock-up.
3. **Given** WebGL is unavailable, **When** an event runs, **Then** a calm
   static fallback glow appears and completion still fires on schedule.
4. **Given** the page is hidden, **When** it returns, **Then** rendering pauses
   and resumes safely without skipping the finale.
5. **Given** reduced motion, **When** the visitor reveals, **Then** the result
   is presented calmly without scramble, cinematic particles or fireworks.

### User Story 5 — Authentic recorded audio (Priority: P4)

The visitor hears the existing cues plus authentic recorded firework launch and
explosion sounds, a substantially bigger finale boom, and subtle thunder tied
to lightning. No sound is synthesised or AI-generated.

**Why this priority**: Audio is what makes the effects feel physical. It must
remain licensed, subtle and in sync without overpowering the sequence.

**Independent Test**: Inspect the audio provenance record, verify every new
file is a real recording under a free licence, and exercise each cue.

**Acceptance Scenarios**:

1. **Given** the fireworks event, **When** a rocket launches and bursts,
   **Then** recorded whistle and burst cues play in sync, with the finale using
   a noticeably deeper, louder but non-clipping boom.
2. **Given** a lightning strike, **When** it flashes, **Then** the existing
   lightning sound plays and a subtle recorded thunder rumble follows with
   variation and throttling.
3. **Given** the source/licence record, **When** it is reviewed, **Then** every
   new asset lists its provider, item, URL, licence and acquisition date.

### Edge Cases

- Refresh during the scramble, landing, details delay or event: today's result
  is restored, the event resumes for its stored duration, Home remains hidden.
- Storage disabled, full or corrupt: the reveal still runs; lifecycle flags are
  best-effort and Home returns when the in-memory event completes.
- WebGL context lost mid-event: the stage reports completion through its safety
  timer; Home is not stuck hidden and no overlay remains.
- Very short viewports or landscape phones: content can scroll, the meter never
  clips its percentage, and controls remain reachable.
- The compact 300×250 widget: the meter stays visible, the result remains
  readable and the Home control keeps its existing compact behaviour.
- A visitor presses Start repeatedly: the existing guard prevents a second draw.
- Midnight passes during an event: the sequence clears, the meter returns to
  welcome and Home is available for the new day.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Milky Way `<picture>` sources, `sizes`, `object-position`,
  overlay and layer order MUST remain unchanged.
- **FR-002**: The circular meter MUST be visible in the welcome, scramble and
  completed states and MUST NOT reveal percentage, tier or colour before the
  reveal.
- **FR-003**: The meter MUST be anchored toward the bottom of the viewport with
  open sky above, the Start button centrally above it, supporting information
  below/around it and the Home control in the top-right corner.
- **FR-004**: The daily result generation, selection, weighting, repeat guards,
  fixed numbers, colours, Sparks, persistence and local-midnight rollover MUST
  be unchanged.
- **FR-005**: The reveal MUST keep the 4.5-second hidden scramble, 600 ms
  three-flash landing, 800 ms details delay, 600 ms event delay and existing
  event durations.
- **FR-006**: Intermediate percentages MUST never equal or expose the final
  percentage.
- **FR-007**: Home MUST be visible before Start and whenever today's result has
  completed, and hidden from the Start press until the cinematic and its sparks
  finish.
- **FR-008**: The completion lifecycle MUST be persisted with today's result so
  a refresh mid-event keeps Home hidden and resumes the unfinished event.
- **FR-009**: Meteors, lightning and fireworks MUST render with the existing
  additive WebGL pipeline extended to separate far and near layers, allowing
  elements to pass behind and in front of the meter without covering the
  background image.
- **FR-010**: Meteor trails MUST include plasma-like glow, atmospheric bloom,
  depth variation and a dominant close finale.
- **FR-011**: Lightning MUST branch at multiple scales, include background and
  foreground strikes, illuminate the atmosphere and end with a huge close
  strike.
- **FR-012**: Red fireworks MUST be dense, rounded and powerful; white/silver
  fireworks MUST be finer, more intricate, crackling and branching; their
  particle behaviour MUST visibly differ.
- **FR-013**: The golden finale MUST combine a large spherical chrysanthemum,
  long willow trails and a substantial number of flickering golden sparks that
  fall across the whole composition in front of the interface.
- **FR-014**: Golden sparks MUST obey gravity, drag and fade, and MUST NOT block
  pointer interaction or make text unreadable.
- **FR-015**: The finale MUST finish naturally inside the existing event
  duration; the canvas MUST fade rather than clear while sparks are visible.
- **FR-016**: The circular meter MUST show slow, smooth, radiant GPU trails and
  layered golden illumination without reducing readability.
- **FR-017**: Graphics capability and measured performance MUST drive particle
  budgets, shader complexity, resolution and pixel ratio; no browser, renderer,
  GPU vendor or software rasterizer may be forced.
- **FR-018**: WebGL unavailability or context loss MUST fall back gracefully and
  still complete the stage.
- **FR-019**: Rendering MUST pause while the page is hidden, resume safely on
  return, and observe resize and orientation changes.
- **FR-020**: WebGL buffers, programs, textures and contexts MUST be released;
  particle arrays MUST be capped and reused.
- **FR-021**: Reduced-motion behaviour MUST remain intact.
- **FR-022**: All controls MUST remain clickable and keyboard reachable
  throughout the sequence.
- **FR-023**: New audio MUST be genuinely recorded, freely licensed and stored
  same-origin, with a provenance and licence record committed alongside it.
- **FR-024**: The existing lightning, meteor, buildup and firework cues MUST be
  preserved unless a cue is explicitly replaced by an approved recording.
- **FR-025**: The final firework MUST use a substantially deeper, louder
  recorded boom than the preceding bursts without clipping or a harsh spike.
- **FR-026**: Thunder MUST be optional, recorded, subtle, varied and linked to
  lightning timing without overpowering the existing strike sound.
- **FR-027**: All audio MUST respect existing autoplay and user-gesture rules
  and the existing volume/preference behaviour.
- **FR-028**: `shareDailyResult()` behaviour, native-share preference,
  cancellation handling and clipboard fallback MUST be unchanged.
- **FR-029**: The completed result MUST persist across refreshes and remain
  visible until the next local-midnight reset.
- **FR-030**: No new dependencies, routes, server writes or database changes may
  be introduced.

### Key Entities

- **Daily result**: The existing immutable record for one local date.
- **Lifecycle record**: Persisted completion flag and event duration associated
  with today's result so refresh can resume or finish the sequence.
- **Render quality profile**: Resolved tier, pixel-ratio cap, particle scale,
  foreground-layer availability and haze availability.
- **Audio asset record**: Title, provider, item URL, licence URL, acquisition
  date and local derivative filename.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The background `<picture>` markup and CSS values used for the
  Milky Way are identical to the previous implementation.
- **SC-002**: Home visibility matches the lifecycle at every tested beat,
  including refresh mid-event, with zero premature appearances.
- **SC-003**: Every existing Lucky Meter unit and component test continues to
  pass after any intentional assertion update for resumed events.
- **SC-004**: On a capable Chromium GPU path, the full sequence sustains at
  least 55 FPS over a 5-second sample and never blocks a control click.
- **SC-005**: With WebGL disabled and with a lost context, the sequence still
  completes and Home returns within the existing duration plus the existing
  450 ms safety margin.
- **SC-006**: Every new audio file has a documented free licence and is a real
  recording; no file is generated or synthesised.
- **SC-007**: `pnpm exec tsc --noEmit`, the focused suites, the production build
  and `./freebuff-verify.sh` pass, with the build strictly below 495 MiB.

## Assumptions

- The supplied photograph is composition inspiration only; the finished layout
  is judged on the existing Lucky Pick Canada identity.
- Native share sheets remain the primary sharing path and are untouched.
- The existing Howler dependency and audio initialisation pattern are reused.
- Chromium is available for executable browser QA; Firefox and WebKit coverage
  is reported honestly if their runtime libraries are unavailable.
- The 300×250 compact widget keeps its existing route and reduced presentation.
