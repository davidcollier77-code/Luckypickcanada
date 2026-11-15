# Feature Specification: Adaptive Graphics Capability Foundation

**Feature Branch**: `freebuff/ac8a265279e6080fde702b01`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Ensure Lucky Pick Canada automatically adapts its graphics rendering to each visitor's browser, device and available hardware, without requiring visitors to change browsers or settings. Inspect the existing rendering implementations and establish a shared approach that allows each browser to use its own available hardware acceleration and graphics capabilities; does not force Chrome, SwiftShader or any particular rendering technology; detects which graphics features are actually supported by the visitor's browser and device; provides appropriate fallbacks when hardware acceleration or specific graphics features are unavailable; prevents blank rendering, broken animations and graphics-related errors on devices with limited capabilities; supports modern Chrome, Samsung Internet, Firefox, Edge and Safari, including mobile browsers; avoids unnecessary dependencies, processing overhead and additional costs. Preserve all existing artwork, appearance, animations, sounds and functionality. Do not migrate individual features to GPU rendering as part of this task. Do not change the normal Playwright configuration or force SwiftShader. This establishes the foundation for gradually introducing GPU-accelerated effects into individual features in future tasks, one at a time."

## Context

The site already renders decorative graphics in several independent ways: a homepage star
canvas, an Aurora canvas and an additive WebGL cinematic stage on the Lucky Meter, the Lucky
Card reveal canvases, canvas-confetti celebrations, and canvas-generated share images. These
implementations were built at different times. Their reduced-motion checks, pixel-density
handling, context null checks and failure behaviour are inconsistent, and none of them shares a
capability layer. Some paths assume a 2D context always exists; the WebGL stage has a static
fallback for "WebGL unavailable" but not for a context lost after it starts.

This feature introduces one small shared foundation and adopts it in the existing renderers. It
does not convert any effect to GPU rendering and does not change what a visitor sees on a
capable device.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Capable devices render exactly as before (Priority: P1)

A visitor opens the site on a modern desktop or mobile browser. The browser chooses its own
graphics path, including any hardware acceleration it offers. The artwork, animations, sounds and
layout are the same as today, and no page or feature forces a particular browser, renderer or
software rasterizer.

**Why this priority**: The site's visual identity and existing effects must survive the change.
The foundation is only acceptable if the normal experience is preserved.

**Independent Test**: Load the homepage and the Lucky Meter in the available Chromium browser at
desktop and mobile widths, confirm the canvas and WebGL effects still render, and confirm no
graphics-related console errors appear.

**Acceptance Scenarios**:

1. **Given** a browser with Canvas 2D support, **When** the homepage loads, **Then** the star
   canvas paints and the page keeps its current artwork and layout.
2. **Given** a browser with WebGL support, **When** a Lucky Meter cinematic event runs, **Then**
   the additive event stage renders over the untouched artwork and completes its sequence.
3. **Given** a high-density display, **When** a zero-canvas-count or full-viewport canvas is
   prepared, **Then** its backing resolution is capped by the shared profile while its CSS size
   and composition stay unchanged.
4. **Given** the standard Playwright configuration, **When** visual QA runs, **Then** it uses the
   existing Chromium projects with no graphics launch argument added by this feature.

---

### User Story 2 — Limited devices get a complete page, never a blank or broken one (Priority: P2)

A visitor uses a browser or device where a graphics feature is missing, disabled or lost. The
page still loads, content is readable, and any decorative effect that cannot run is replaced by
its existing static equivalent instead of leaving an empty canvas or throwing an uncaught error.

**Why this priority**: Blank rendering and graphics exceptions are the failure this foundation is
meant to prevent. A graceful static result is better than a broken page.

**Independent Test**: Simulate a missing 2D context and a missing WebGL context in the browser,
then confirm the homepage and the cinematic stage still present their static fallbacks and no
uncaught graphics error is reported.

**Acceptance Scenarios**:

1. **Given** a browser that cannot create a 2D canvas context, **When** a decorative canvas
   tries to initialise, **Then** the canvas skips drawing, the page keeps its backdrop and
   content, and no exception escapes.
2. **Given** a browser without WebGL, **When** a cinematic event would run, **Then** the existing
   static glow appears and the event still reports completion after its documented duration.
3. **Given** a WebGL context that is lost after the stage starts, **When** the browser loses the
   drawing buffer, **Then** the stage stops its loop, shows the static glow, and still completes.
4. **Given** a browser without `Path2D`, **When** the maple-leaf confetti shape is prepared,
   **Then** the existing basic-shape fallback is used without a graphics exception.
5. **Given** a browser that cannot create the share-image canvas, **When** a visitor shares a
   card, **Then** the existing user-facing failure message appears instead of a crash.

---

### User Story 3 — Motion preference and tab visibility are handled consistently (Priority: P3)

A visitor who prefers reduced motion receives a calm, static presentation. A visitor who switches
to another tab has decorative animation paused and resumed once when they return, without
duplicated loops or a skipped effect.

**Why this priority**: Reduced motion is an accessibility commitment, and unthrottled background
animation wastes battery and CPU on mobile devices with limited resources.

**Independent Test**: Emulate reduced motion and a hidden document in the browser, then confirm
the canvas paints a static frame, no continuous loop runs, and returning to the page resumes a
single loop.

**Acceptance Scenarios**:

1. **Given** reduced motion, **When** a decorative canvas mounts, **Then** it paints one static
   frame and schedules no continuous animation frame.
2. **Given** a running animation, **When** the document becomes hidden, **Then** its animation
   frame is cancelled.
3. **Given** a hidden document, **When** the visitor returns, **Then** the animation resumes once
   and no duplicate loop is created.
4. **Given** reduced motion, **When** a cinematic event is requested, **Then** the existing calm
   presentation is shown without a WebGL loop.

---

### User Story 4 — The foundation stays small, reusable and cheap (Priority: P4)

A developer adding a future GPU-accelerated effect can use one documented capability layer
instead of writing another ad-hoc browser check. Capability probes run lazily, are cached for the
page lifetime, add no dependency, and do not run in a render loop.

**Why this priority**: The task establishes a foundation for later feature-by-feature work. It
must not become a second compatibility system or add ongoing cost.

**Independent Test**: Inspect and unit-test the shared layer for lazy caching, absence of vendor
sniffing and absence of per-frame probing, and confirm no dependency or service was added.

**Acceptance Scenarios**:

1. **Given** the shared module, **When** it is imported but no graphics feature is requested,
   **Then** no canvas or WebGL probe is performed.
2. **Given** repeated capability questions, **When** the same feature is checked again, **Then**
   the cached result is returned without creating another probe context.
3. **Given** the repository source, **When** graphics support is determined, **Then** there is no
   user-agent test, renderer-vendor test, forced browser flag, or forced SwiftShader path.

### Edge Cases

- A browser returns `null` from `getContext` instead of throwing.
- A browser throws from `getContext` (for example when a context limit is reached).
- A canvas is resized after a context is acquired; the existing transform reset must still apply.
- A WebGL context is lost before the first frame, during the finale, or while the stage is
  unmounting.
- A 2D context is lost and restored; 2D context loss is not universally supported, so the absence
  of the event must remain harmless.
- A device reports no `deviceMemory` or `hardwareConcurrency`; the standard tier must apply.
- A device has Save-Data enabled; it must receive the constrained tier even when its hardware is
  otherwise capable.
- A visitor changes reduced-motion preference while a canvas is mounted.
- The browser is Samsung Internet, Firefox, Edge or Safari; the implementation must rely only on
  standards-based feature detection and must not branch on the browser name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST provide one shared, dependency-free module for graphics
  capability detection and safe context acquisition.
- **FR-002**: Capability detection MUST use standards-based feature detection. It MUST NOT use
  user-agent or browser-name checks, renderer-vendor strings, forced launch flags, or a forced
  rendering technology.
- **FR-003**: The shared module MUST expose lazy, cached checks for Canvas 2D, WebGL and `Path2D`
  support.
- **FR-004**: The shared module MUST expose a safe 2D context getter that returns `null` instead of
  throwing when a context cannot be created.
- **FR-005**: The shared module MUST expose a safe WebGL context getter that tries the standard
  `webgl` context and the legacy `experimental-webgl` context, and MUST NOT reject a
  browser-chosen software rasterizer.
- **FR-006**: The shared module MUST NOT request a specific GPU power preference or set
  `failIfMajorPerformanceCaveat`; the browser must remain free to choose its graphics path.
- **FR-007**: The shared module MUST expose a device profile with a conservative performance tier,
  a maximum canvas pixel ratio, and a particle-density scale.
- **FR-008**: Active canvas renderers MUST use the safe 2D context getter and MUST skip their
  decorative drawing when no context is available, without throwing.
- **FR-009**: The active WebGL stage MUST use the safe WebGL context getter and MUST retain its
  existing static-glow fallback when WebGL cannot start.
- **FR-010**: The WebGL stage MUST handle context loss by stopping its loop, releasing its
  animation frame, showing the static-glow fallback, and still completing its callback.
- **FR-011**: Canvas renderers MUST honour `prefers-reduced-motion` at mount and when the
  preference changes, painting a static frame instead of starting a continuous loop.
- **FR-012**: Canvas animation loops MUST stop while the document is hidden and resume without
  creating duplicate loops when it becomes visible.
- **FR-013**: Canvas backing resolution MUST use the shared pixel-ratio cap so high-density
  displays do not allocate unbounded fill-rate work.
- **FR-014**: The device profile MUST apply a reduced particle-density scale only when the device
  is constrained (Save-Data, very low memory, or very low core count), leaving the normal
  presentation unchanged.
- **FR-015**: The maple-leaf confetti shape MUST use its existing basic-shape fallback when
  `Path2D` is unavailable.
- **FR-016**: Canvas-generated share images MUST fail with the existing handled message when a 2D
  context cannot be created, rather than throwing an unhandled error.
- **FR-017**: Existing artwork, layout, copy, animations, sounds, navigation, monetization and
  functionality MUST remain unchanged on capable devices.
- **FR-018**: The feature MUST NOT add a dependency, paid service, hosted runner, build step or
  network request.
- **FR-019**: The normal Playwright configuration and the opt-in SwiftShader configuration MUST
  remain unchanged.
- **FR-020**: Source coverage MUST fail if the shared layer gains a vendor sniff, a forced
  renderer flag, or a `failIfMajorPerformanceCaveat` option.

### Key Entities

- **Graphics profile**: A page-lifetime description of the visitor's device class, maximum canvas
  pixel ratio and particle scale. It is derived from coarse, optional browser hints and has a
  safe default when those hints are absent.
- **Capability result**: A cached boolean for one graphics feature (Canvas 2D, WebGL, `Path2D`).
- **Context watcher**: A cleanup handle that observes context loss and restoration without
  throwing when the browser does not support those events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In the available Chromium desktop and mobile emulation, the homepage and Lucky Meter
  load and render their existing canvas/WebGL effects with zero uncaught graphics errors.
- **SC-002**: With Canvas 2D disabled in the browser, the homepage still renders its content and
  backdrop with zero uncaught graphics errors.
- **SC-003**: With WebGL unavailable, the cinematic stage presents its static fallback and still
  completes within its documented duration plus the existing safety margin.
- **SC-004**: The shared capability module performs no probe at import time and at most one probe
  per feature per page lifetime.
- **SC-005**: The repository source contains no user-agent-based graphics branch and no forced
  browser/renderer flag introduced by this feature.
- **SC-006**: The full unit suite, type check, repository gate and production build pass, with the
  build strictly below 495 MiB.
- **SC-007**: The committed visual QA baselines continue to match in the standard Chromium
  projects.

## Assumptions

- "Modern browsers" means current evergreen Chrome, Edge, Firefox, Samsung Internet and Safari,
  including their mobile versions. Older browsers receive the same graceful static fallbacks.
- Hardware acceleration is chosen by the browser and operating system. The application detects
  availability and adapts quality; it does not attempt to enable, force or benchmark a GPU.
- Software rasterizers such as SwiftShader are valid browser-chosen fallbacks. Detecting them as
  "unsupported" would violate the requirement not to force a rendering technology.
- A device that hides `deviceMemory` or `hardwareConcurrency` is treated as standard, not
  constrained.
- The existing visual baselines were captured at a device pixel ratio of 1, so pixel-ratio caps do
  not change them.
- Share-image generation remains an optional convenience; its existing error message is the
  correct fallback when the canvas is unavailable.
- The unused standalone starfield components are legacy layers but are kept consistent with the
  shared foundation so a future feature cannot reintroduce the same unsafe pattern.
