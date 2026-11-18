# Feature Specification: Single-Download Reveal Audio Delivery

**Feature Branch**: `perf/reveal-audio`

**Created**: 2026-11-18

**Status**: Implemented

**Input**: Owner request, performance improvement 2 of 5: eliminate duplicate audio downloads in the reveal. The
audit recorded 2,091,758 bytes, 23 requests and 8 duplicates on the capable profile, and 415,347 bytes, 11
requests and 4 duplicates on the slow profile.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One download per standard cue (Priority: P1)

A visitor opens the Daily Card Reveal. Each of the eight standard-tier cues is downloaded once and used by both
the Web Audio scheduler and the Howler fallback, so a scripted reveal no longer pays for a second copy of every
file.

**Why this priority**: Eight duplicate requests are pure waste and delay the reveal's audio readiness.

**Independent Test**: Open the reveal with a cold cache, record every audio response, and confirm each standard
cue URL appears once.

**Acceptance Scenarios**:

1. **Given** a reveal with a cold cache, **When** its audio is prepared, **Then** each of the eight standard
   URLs is requested exactly once.
2. **Given** a prepared reveal, **When** the Web Audio path runs, **Then** it still decodes the fetched buffers.
3. **Given** a prepared reveal, **When** native Web Audio is unavailable and Howler plays the fallback, **Then**
   the same cue plays with its authored volume, seek and fade.

---

### User Story 2 - Every authored sound is preserved (Priority: P1)

The seven premium/flagship cues, all fifteen unique cue files, all volumes, the preload timing, the scheduled
hits and the fallback behaviour are unchanged.

**Why this priority**: The reveal is a timed cinematic; audio is part of the product.

**Independent Test**: Compare the cue list and volumes in source, then run the existing reveal-related suites.

**Acceptance Scenarios**:

1. **Given** the premium tier, **When** it reveals, **Then** the same seven cues play at the same times.
2. **Given** the standard tier, **When** it reveals, **Then** the same eight cues play at the same times.

---

### Edge Cases

- The preload fetch is blocked or fails: the tier still builds its Howl set from the authored URLs.
- The component unmounts before the fetch settles: no Howls are created afterwards and object URLs are revoked.
- A browser without `URL.createObjectURL`: the failure is caught by the same preload fallback path.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each standard-tier cue MUST be requested at most once per reveal mount.
- **FR-002**: The Web Audio path MUST decode the same fetched bytes as before.
- **FR-003**: Howler MUST receive the fetched bytes instead of re-requesting the URL.
- **FR-004**: Every authored cue, volume, preload flag, seek, fade and schedule MUST be preserved.
- **FR-005**: A failed fetch MUST fall back to the authored URLs so sound is never lost.
- **FR-006**: Object URLs MUST be revoked on unmount, and late fetches MUST NOT create audio after unmount.
- **FR-007**: No dependency, cache-header, CSP, API or playback-order change may be introduced.

### Key Entities

- **Standard cue set**: eight same-origin MP3s used by the standard card tier.
- **Premium cue set**: seven same-origin MP3s used by the premium and flagship tiers.
- **Preload promise**: the single shared promise the reveal awaits before scheduling standard audio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The capable audit's 8 duplicates drop to 0 for the standard cue set.
- **SC-002**: All 15 unique cue files remain referenced and every volume is unchanged.
- **SC-003**: Focused and full unit suites, the type check, `./freebuff-verify.sh` and the production build
  pass, and the build stays below 495 MiB.
- **SC-004**: The reveal's audio readiness, scheduling and fallback show no regression in browser QA.

## Assumptions

- Object URLs are a same-origin, memory-backed source for Howler and do not create a network request.
- The eight standard files total 707,635 bytes, so eliminating the duplicate copy removes roughly that much
  transfer when the full standard set is prepared.
- The seven premium cues remain preloaded as before; this task removes duplicates, not the authored preload
  strategy.
