# Feature Specification: Reuse an Already Loaded Responsive Image Derivative

**Feature Branch**: `perf/image-derivative-dedupe`

**Created**: 2026-11-18

**Status**: Implemented

**Input**: Owner request, performance improvement 3 of 5: stop the resource-readiness hub downloading a second
derivative of an image the page already painted. The audit identified Lucky Meter fetching 1024w followed by
640w and Crystal Ball fetching the pedestal followed by a separate 420w derivative.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - No second width of the same artwork (Priority: P1)

A visitor loads Lucky Meter or Crystal Ball. The responsive `<picture>` paints the width the browser chose for
the rendered box, and the hub's later route preparation recognises that the same artwork is already in memory,
so it does not download the registered 640w or 420w variant as well.

**Why this priority**: The duplicate derivative adds 61 KB (Lucky Meter 640w) or 67 KB (Crystal Ball 420w) with
no visible difference, on the routes the audit measured.

**Independent Test**: Load each route in a cold browser at the audited viewport and confirm only one derivative
of the flagged artwork is requested.

**Acceptance Scenarios**:

1. **Given** a page that painted `/images/lucky-meter-night-sky-1024w.avif`, **When** the hub prepares
   `/images/lucky-meter-night-sky-640w.avif`, **Then** no request is made and the resource reaches `ready`.
2. **Given** a page that painted `/assets/crystal-ball-pedestal.avif`, **When** the hub prepares
   `/assets/crystal-ball-pedestal-420w.avif`, **Then** no request is made and the resource reaches `ready`.
3. **Given** a derivative that is not loaded, **When** the hub prepares it, **Then** it is requested and
   decoded exactly as before.
4. **Given** a different artwork, directory or format, **When** the hub prepares it, **Then** it is never
   treated as the same image.

---

### User Story 2 - Rendering and quality are unchanged (Priority: P1)

The page keeps displaying the derivative its `<picture>` selected. Reuse only removes the hub's redundant
download; it never substitutes, resizes or degrades the painted image.

**Why this priority**: The audit's constraint is preserving artwork and visual quality.

**Independent Test**: Compare the painted `currentSrc` and `naturalWidth`, and the route's console output,
with and without the change.

**Acceptance Scenarios**:

1. **Given** a loaded route, **When** the hub reuses an image, **Then** the painted image element is untouched.
2. **Given** a route with a pending reveal or interaction, **When** the hub skips, **Then** readiness still
   resolves and no console error appears.

---

### Edge Cases

- Absolute URLs (`img.currentSrc`, resource-timing names) and root-relative manifest URLs must match.
- A failed image load must not be recorded as an available identity.
- Resource-timing entries that delivered no bytes (aborted or failed) must not count as loaded.
- A width token in a filename that is not a derivative suffix (for example `logo-2024.avif`) must be left
  alone.
- WebP, AVIF, PNG and JPEG are separate identities, so a format fallback is never suppressed.
- `resetResourceReadiness()` must forget hub-loaded identities.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The hub MUST NOT request an image resource when any derivative of the same image identity has
  already loaded on the page.
- **FR-002**: Image identity MUST ignore only a `-<digits>w` width token before the file extension, comparing
  path, directory and format.
- **FR-003**: Loaded-ness MUST be established from rendered images, resource-timing entries with delivered
  bytes, or the hub's own successful loads.
- **FR-004**: A reused resource MUST settle as `ready` so dependent readiness gates still complete.
- **FR-005**: An image that is not loaded MUST follow the existing request, decode and retry path.
- **FR-006**: No image element, `srcset`, `sizes`, layout, CSS or asset may be changed.
- **FR-007**: No dependency, API or manifest URL change may be introduced.

### Key Entities

- **Image identity**: the image path with a `-640w`/`-1024w`/`-420w`-style token removed.
- **Loaded evidence**: a rendered image with `complete && naturalWidth > 0`, a resource-timing entry with
  bytes, or a hub load recorded in `loadedImageIdentities`.
- **Reuse result**: `{ reused: true, identity, reason: 'same-image-loaded' }` stored on the resource entry.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Lucky Meter requests 61,326 fewer bytes (the 640w AVIF) at 1024x768@1x and 1440x900@1x.
- **SC-002**: Crystal Ball requests 66,706 fewer bytes (the 420w AVIF) at 1024x768@2x.
- **SC-003**: The painted artwork, its `currentSrc` and its rendered size are identical before and after.
- **SC-004**: Focused and full unit suites, the type check, `./freebuff-verify.sh` and the production build
  pass, and the build stays below 495 MiB.

## Assumptions

- A responsive image derivative of the same artwork differs only by the width token, which is this repository's
  naming convention for every `-<width>w` file.
- Once one width of an artwork is decoded, the hub's job for that artwork is satisfied; the hub's resource is a
  readiness warm-up, not a picture element.
- The browser's own HTTP cache already prevents a second transfer when the hub's URL is exactly the painted
  URL, so the change targets the different-width case the audit recorded.
