# Feature Specification: SwiftShader Configuration and Graphics-Rendering Architecture

**Feature Branch**: `165-swiftshader-graphics-architecture`
**Created**: 2026-11-15
**Status**: Implemented
**Input**: Owner instruction to complete the SwiftShader Playwright configuration, verify the hardware-accelerated and software-rendered paths, document the site's intended graphics architecture (CSS/Canvas 2D, WebGL, optional WebGPU, graceful fallbacks, future 3D capability without implementing it), and finish through the existing pull request without merging it.

## Context

The repository already has two Playwright configurations (Standard and an opt-in SwiftShader
configuration) and an adaptive graphics-capability layer. The 13-area Playwright skill documents how
to investigate them, but its SwiftShader guidance was written from upstream flag documentation rather
than from this environment. This feature measures what the environment actually supports, keeps only
justified settings, records the results, and writes down the rendering architecture the site is
intended to grow into.

Investigation results (Chromium 156.0.8078.4, no `/dev/dri` or `/dev/nvidia*`):

- WebGL 1 and WebGL 2 work, shaders link and execute, and canvas readback matches the expected pixel
  in every tested configuration.
- WebGPU reports `webgpu: unavailable_software` and `navigator.gpu` is `undefined` with every tested
  flag combination, including `--enable-unsafe-webgpu`, `--enable-features=Vulkan`,
  `--use-vulkan=swiftshader` and `--use-webgpu-adapter=swiftshader`.
- `--enable-webgpu-developer-features` degraded compositing to `disabled_software` and WebGL to
  `enabled_readback` without exposing WebGPU.

## User Scenarios & Testing

### User Story 1 - Trustworthy software-rendered graphics investigation (Priority: P1)

An agent or maintainer needs to exercise the site's WebGL rendering under controlled software
rendering, and needs the reported result to distinguish "WebGL works" from "a launch flag was passed".

**Why this priority**: The primary purpose of the SwiftShader configuration is evidence, and
misreporting an unavailable capability is worse than reporting it unavailable.

**Independent Test**: Launch the committed SwiftShader configuration, read the renderer string, create
a WebGL context, compile and link a shader, read back a pixel, then ask for a WebGPU adapter and record
exactly what the browser returns.

**Acceptance Scenarios**:

1. **Given** the committed SwiftShader configuration, **When** a page creates a WebGL context, **Then**
   the renderer identifies ANGLE/SwiftShader and the context is not null.
2. **Given** a compiled shader, **When** it draws a known colour to a 1×1 viewport, **Then** readback
   returns that colour and `gl.getError()` is `NO_ERROR`.
3. **Given** the same browser, **When** the page requests `navigator.gpu`, **Then** the report states
   the real result (`unavailable_software` / `undefined`) instead of inferring support from flags.

### User Story 2 - Standard remains authoritative (Priority: P1)

Normal QA and CI must keep using the browser's own renderer selection, unchanged, and the
SwiftShader configuration must never become a gate or a substitute for visitor-experience checks.

**Why this priority**: Production preservation is the hard constraint; an investigation configuration
must not leak into the visitor path.

**Independent Test**: Run the Standard tests and confirm the configuration has no channel override and
no launch arguments, while the SwiftShader configuration keeps its explicit ANGLE/SwiftShader request.

**Acceptance Scenarios**:

1. **Given** the Standard configuration, **When** it launches, **Then** it passes no SwiftShader or GPU
   launch arguments and lets Chromium select hardware or software rendering.
2. **Given** the SwiftShader configuration, **When** it launches, **Then** it requests ANGLE/SwiftShader
   explicitly, uses one worker and no retries, and does not update visual baselines.
3. **Given** the repository, **When** the guard tests run, **Then** they reject any unjustified unsafe
   or experimental graphics flag appearing in the committed configuration.

### User Story 3 - Durable architecture guidance (Priority: P2)

A maintainer planning a 3D effect needs to know which rendering layer to use, how capability selection
and fallbacks work, and what is explicitly out of scope, without reading every renderer.

**Why this priority**: It prevents future work from adding a mandatory WebGPU requirement or bypassing
the existing fallback ladder, but it delivers no visitor-facing change.

**Independent Test**: Read the architecture document and confirm it maps each layer, names the
capability-selection and fallback contracts, and separates implemented behaviour from future
capability.

**Acceptance Scenarios**:

1. **Given** the architecture document, **When** a maintainer plans a new effect, **Then** they can
   identify CSS/Canvas 2D, WebGL and optional WebGPU roles, the fallback each layer requires, and the
   no-forced-renderer rule.
2. **Given** the investigation results, **When** the document describes WebGPU, **Then** it states that
   WebGPU is optional, currently unavailable in the test environment, and never a production
   requirement.

### Edge Cases

- Host with no GPU: Standard and SwiftShader both render through SwiftShader; the report must say so
  rather than calling Standard "hardware".
- WebGL unavailable or disabled: the Lucky Meter stage must show its static gradient fallback and the
  cinematic must still complete.
- WebGPU unavailable: no production path may depend on it; the probe reports unavailability.
- High-DPI or constrained device: existing pixel-ratio and particle-scale caps still apply.
- Context loss: the existing loss/restore lifecycle is unchanged.
- Reduced motion: existing animation suppression is unchanged.
- AVIF unsupported: the existing WebP fallback continues to serve; this feature does not touch images.

## Requirements

### Functional Requirements

- **FR-001**: The SwiftShader Playwright configuration MUST explicitly request ANGLE/SwiftShader and
  keep the GPU process enabled, one worker and zero retries.
- **FR-002**: The Standard Playwright configuration MUST remain free of channel overrides and launch
  arguments, and MUST remain the configuration used by required QA and CI.
- **FR-003**: The committed SwiftShader configuration MUST NOT include a Chromium flag that produced no
  capability gain in the investigation, or that weakens a browser safeguard without a demonstrated
  need.
- **FR-004**: WebGPU capability MUST be reported from the observed API/adapter/device result, never
  inferred from the presence of a launch flag.
- **FR-005**: Production graphics-capability detection, renderer selection, quality profiles, device
  adaptation and fallback behaviour MUST be preserved exactly.
- **FR-006**: A repository architecture document MUST describe the intended rendering layers, the
  capability-selection contract, the fallback ladder, the relationship to AVIF/WebP image delivery,
  and the requirements for future 3D work.
- **FR-007**: WebGPU MUST NOT become a mandatory production requirement or a production dependency.
- **FR-008**: Guard tests MUST pin the justified SwiftShader arguments and reject unjustified unsafe or
  experimental graphics flags.
- **FR-009**: Documentation MUST state what was tested, the observed renderer, what was unavailable and
  what remains unverified.
- **FR-010**: The feature MUST NOT add dependencies, browsers, paid services, new visual effects,
  image conversions or production renderer changes.
- **FR-011**: The stale package-script reference in the SwiftShader configuration MUST be resolved so
  the documented command exists.
- **FR-012**: The production build MUST remain strictly below 495 MiB.

### Key Entities

- **Rendering layer**: CSS/DOM, Canvas 2D, WebGL (1/2), or WebGPU (optional, future). Each has a
  supported role and a required fallback.
- **Capability profile**: the resolved tier and caps from `app/lib/graphics-capabilities.js`; consumed
  by renderers, never chosen by user agent.
- **Evidence record**: configuration name, renderer string, feature status, probe result and
  limitation, stored with the feature.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Standard Playwright runs the existing suite unchanged, with the browser selecting its own
  renderer.
- **SC-002**: SwiftShader Playwright launches with the committed arguments and reports an
  ANGLE/SwiftShader renderer.
- **SC-003**: A WebGL shader compiles, links, executes and reads back the expected pixel under both
  configurations.
- **SC-004**: WebGPU status is recorded as `unavailable_software` (or the actual observed adapter)
  without a false success claim.
- **SC-005**: With WebGL forced unavailable, the cinematic stage renders its static fallback and still
  reaches completion.
- **SC-006**: Desktop and mobile Playwright projects list and run under both configurations.
- **SC-007**: Focused and full Vitest, `tsc --noEmit`, the repository gate and the production build all
  pass; the build stays below 495 MiB.
- **SC-008**: The configuration, guard test and documentation agree on the exact final flag set.

## Assumptions

- This host has no physical GPU, so no physical-GPU performance claim can be made from it.
- Chromium 156.0.8078.4 is the Playwright-pinned browser for this repository at the time of
  investigation; a future browser may change WebGL/WebGPU availability, which is why the probe, not the
  flag list, is the source of truth.
- The existing graphics-capability layer and visual design are correct and are not being redesigned.
- AVIF/WebP delivery is independent of canvas/WebGL rendering and stays untouched.
