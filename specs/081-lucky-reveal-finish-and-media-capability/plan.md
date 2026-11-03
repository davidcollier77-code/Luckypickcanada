# Implementation Plan: Lucky Reveal Finish Polish and Reusable Media Inspection

**Feature**: `specs/081-lucky-reveal-finish-and-media-capability`

**Branch**: `freebuff/f42744a86b35d603e40013fd`

## Approach

Four confined changes on the shipped reveal finish, plus one workspace tooling extension. Nothing is
redesigned: leaf artwork, palette, burst shape, panel styling, copy, controls, sharing artwork and
number generation stay as they are.

### 1. Confetti leaves leave the screen naturally (`app/lucky-reveal-celebration.jsx`)

- **Cause of the mid-air disappearances:** `canvas-confetti` ends a particle when its tick counter
  reaches `ticks` (`updateFetti` → `fetti.tick < fetti.totalTicks`), and the shipped component sets
  `ticks: 150`. A leaf still inside the canvas at that tick is deleted while painted. The layer is
  then removed by the fixed `CONFETTI_WINDOW_MS` timer instead of by what is on screen.
- **Fix:** raise `PARTICLE_LIFETIME_TICKS` so the gravity/decay curve always carries a leaf past the
  bottom edge before its lifetime ends, and stop using a fixed window as the completion signal.
  Poll the live canvas (`getImageData`) at a modest interval after the last wave; the first sample
  with no painted pixel means every leaf has left the visible area. Only then fade and unmount the
  particle layer, and report completion upward. A conservative timeout remains as a fallback for a
  canvas that cannot be sampled, and reduced motion still renders nothing.
- Preserve: five waves 24+24+14+14+10 = 86 ≤ 96 particles, origins/angles/colours/leaf shape, the
  particle layer above the panel (leaves may cover reveal content), the static settled-leaf finish.

### 2. Native Android sharing (`app/share-lucky-pick-button.js`)

- Build the native payload as `{ files: [image], title, text, url }` and hand it to
  `navigator.share` when `navigator.canShare` accepts it (or when `canShare` is unavailable).
- If the image payload is unavailable or rejected for a reason other than cancellation, retry with a
  text/link payload (`{ title, text, url }`) so Android still opens its own share sheet. The message
  already contains the website link, so a link-less text share still carries it.
- Only when neither native payload is available does the existing download / copy-image / copy-link
  window open. `AbortError` from either attempt reports "Sharing cancelled." and opens nothing.
- The reveal image is prepared before sharing, so the share call still happens inside the gesture's
  transient activation window.

### 3. Four golden pulses after the confetti (`app/lucky-reveal-popup.js`, celebration component)

- The celebration calls a new `onConfettiSettled` prop exactly once, when the canvas is empty (or the
  fallback timeout fires).
- The popup owns the finish: on that signal it applies a finishing class to the number row wrapper,
  plays the finishing cue once, and clears the class after the fourth pulse so the balls return to
  their resting appearance.
- CSS: replace the perpetual alternating glow with the resting glow the reveal already produced at
  the end of `lucky-number-reveal` (identical shadow/border values), and add a
  `lucky-number-finish-pulse` keyframe animation that runs four times with a small per-ball delay
  (`--finish-delay`), ending at the resting values so clearing the class is seamless.
- `prefers-reduced-motion: reduce` disables the finishing pulse and the finishing sound, and keeps
  the current static behaviour.

### 4. Finishing sound (`app/lib/audio.js`, `public/sounds/`)

- Source one short, gentle magical shimmer / warm chime from a free sound-effect library whose
  licence permits commercial website use; verify the licence text on the live listing/licence page.
- Record title, creator, listing URL, direct source URL, licence and acquisition date next to the
  assets (same convention as `public/sounds/crystal-ball-audio-sources.md`).
- Convert to a small same-origin derivative with FFmpeg (mono, modest sample rate) and add
  `preloadRevealFinishChime()` / `playRevealFinishChime()` mirroring the existing one-shot helpers
  (shared load promise, `playerror` warning, no throw). Preload when the reveal opens; play once
  from the confetti-settled handler, in the same tick as the first pulse.
- The existing opening sparkle and confetti pop are untouched.

### 5. Reusable video and audio inspection (`scripts/`, workspace `$HOME`)

- New idempotent `scripts/setup-media-tools.sh` (unprivileged, no root, no sandbox change) that
  provisions, under `$HOME`:
  - FFmpeg + FFprobe (static build) with `~/.local/bin` symlinks;
  - a private Python virtualenv with the audio-analysis stack and a speech-recognition model;
  - an audio-event (AudioSet) classifier model for non-speech sound content.
- `scripts/inspect-media.py` (or equivalent) exposes repeatable video frame extraction and audio
  review: transcript with timestamps, plus ranked sound-event labels and an audio summary.
- Reuse `scripts/setup-chromium-libs.sh` unchanged; document the tool entry points and record a
  demonstration against recordings built from workspace material (no supplied recording exists in
  this workspace).

## Files

- `app/lucky-reveal-celebration.jsx` — canvas-based completion detection, longer leaf lifetime.
- `app/lucky-reveal-popup.js` — finish state, four pulses, finishing cue, resting appearance.
- `app/lib/audio.js` — finishing chime helpers.
- `app/share-lucky-pick-button.js` — image → text/link native share ladder.
- `public/sounds/` — new finishing sound derivative + provenance record.
- `__tests__/lucky-reveal-finish-phase2.test.js`, updated celebration/popup/share guards.
- `scripts/setup-media-tools.sh`, `scripts/inspect-media.py`, `artifacts/media-inspection/`.
- `specs/081-lucky-reveal-finish-and-media-capability/*`, `.specify/feature.json`.

## Verification

- Focused Vitest suites, full `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`.
- Production build measured against the 495 MB hard maximum.
- Chromium probe (existing `scripts/setup-chromium-libs.sh`) sampling the particle canvas over time:
  leaves painted, canvas empty, layer removed after; number pulses observed after the settle signal;
  reduced-motion path unchanged; both share payloads exercised with a stubbed `navigator.share`.
- Media tooling: `ffprobe`/`ffmpeg` frame extraction plus a real audio review (speech transcript and
  sound-event labels) recorded in `artifacts/media-inspection/`.

## Risks

- Pixel sampling adds short `getImageData` reads during a few seconds of animation; sampling is
  throttled to roughly 5 Hz and stops with the layer.
- Android's real share sheet cannot be opened in this environment; the Web Share API contract is
  exercised with a stubbed `navigator.share`, and device confirmation stays pending.
- Removing the perpetual glow changes an existing (infinite) animation; it is replaced by the same
  resting glow plus the requested four-pulse finish, so the reveal's look is preserved.
- The media stack lives outside the repository and is large; it is provisioned under `$HOME` and
  never enters the build output.
