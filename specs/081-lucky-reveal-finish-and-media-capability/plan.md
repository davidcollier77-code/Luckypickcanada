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


## Post-merge Cloudflare build regression repair (2026-11-03)

- **Observed failure:** the Cloudflare/OpenNext production build at main commit
  `66137dfacd0e3a7ed1cd2bc73b70b702f3ca0184` stopped during Webpack parsing because
  `CONFETTI_WATCH_TIMEOUT_MS` was declared twice in the same module.
- **Root cause:** the source retained the specified 12,000 ms fallback and added an
  unintended second 30,000 ms declaration. The Phase 1 and Phase 2 regression guards
  establish 12,000 ms as the intended safety timeout.
- **Minimal repair:** keep the 12,000 ms declaration, remove the 30,000 ms duplicate,
  and move the accidental top-level 30,000 ms test assertion into the existing
  lifecycle test as a single-declaration assertion. Do not change the timeout's
  behaviour or any reveal feature.
- **Verification:** run the affected component test, Phase 1/Phase 2 reveal tests,
  full Vitest, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`, and the exact
  OpenNext Cloudflare build. Record each result independently; a successful PR-head
  Cloudflare build is required before calling the deployment repair verified.

## Phase 2 — Pulsating audio, chime timing and Share to Apps (2026-11-03)

### 1. Atmosphere synchronised with the ball glow

- `app/lib/audio.js` exports `REVEAL_GLOW_PULSE_MS = 3000`, plus `preloadRevealGlowPulse`,
  `startRevealGlowPulse` (loop, 400 ms fade-in) and `stopRevealGlowPulse` (500 ms fade-out).
- New `public/sounds/reveal-glow-pulse.wav`: generated by `scripts/generate-reveal-glow-pulse.mjs`,
  mono 22,050 Hz 16-bit, exactly 3.000 s, envelope `sin²(π·t/T)` so its loop edges are silent and
  its swell peaks at 1.5 s — the glow's brightest frame. Low drone plus band-limited air, so it is
  atmospheric rather than a chime.
- `app/lucky-reveal-popup.js` starts it at `GLOW_START_MS = (2.0 + 0.9) * 1000` (the first ball's
  glow delay) and stops it in the same effect's cleanup when the reveal closes; the glow's
  `animationDuration` now uses `REVEAL_GLOW_PULSE_MS` so CSS and sound share one constant. Reduced
  motion skips the effect.

### 2. Earlier finishing chime

- `app/lucky-reveal-celebration.jsx` counts painted canvas pixels instead of only testing for any.
  It tracks the peak, fires a new `onConfettiFinishing` exactly once when the count drops to
  `FINISHING_LEAF_RATIO` (8 %) of that peak — a few leaves left — and still removes the layer only
  at zero. `settle()` emits the finishing cue before `onConfettiSettled`, so the fallback-timeout
  path also keeps the chime ahead of the pulses.
- `app/lucky-reveal-popup.js` moves `playRevealFinishChime` out of `startNumberFinish` into
  `startFinishingChime`, wired to `onConfettiFinishing`; the four pulses remain on
  `onConfettiSettled`.

### 3. Share to Apps

- `app/share-lucky-pick-button.js` is now one always-visible group of four actions: **Share to Apps**
  (the gold primary, share-node icon, 52 px min height) and the three preserved actions (Copy the
  website link, Copy the image, Download the image, 48 px min height, icons). No modal hides them.
- The native ladder is unchanged in order (image + message + link, then text + link) but reports an
  explicit graceful fallback when Web Share is absent or both payloads are rejected.
- `app/lucky-reveal-presentation.js` adds `getShareLink(reveal)`: the reveal's same-site HTTPS
  `resultUrl` when supplied, otherwise `LUCKY_SITE_URL`; foreign, insecure and malformed values are
  rejected. Copy link, native payloads and the share text stay tied to the stored result.

### Files

- `app/lib/audio.js`, `app/lucky-reveal-popup.js`, `app/lucky-reveal-celebration.jsx`,
  `app/share-lucky-pick-button.js`, `app/lucky-reveal-presentation.js`.
- `public/sounds/reveal-glow-pulse.wav`, `public/sounds/reveal-glow-pulse-sources.md`,
  `scripts/generate-reveal-glow-pulse.mjs`.
- `__tests__/lucky-reveal-phase2.test.js` plus updated Phase 1/081/075 guards.

### Verification

Focused and full Vitest, `tsc --noEmit`, `./freebuff-verify.sh`, measured production build, and a
Chromium probe of both games with six and seven numbers covering the glow/chime timing and all four
sharing options with stubbed and absent Web Share.

### 2b. Lead-in guarantee for the chime

On a slow or heavily loaded desktop screen the painted canvas can stay populated until the 12 s
safety timeout, where a ratio-only cue would fire on the same tick as the pulse finish. A
`FINISHING_CUE_LEAD_MS = 2500` timer therefore signals the chime 2.5 s before the timeout is allowed
to end the celebration. Whichever cue comes first wins exactly once, so the chime always starts while
the leaves are still on screen and the timeout remains only a safety net.

## Phase 3 — Recorded applause and reliable Android sharing (2026-11-03)

### 1. Replace the synthesised atmosphere with a recorded celebration

- Delete `public/sounds/reveal-glow-pulse.wav`, its provenance file and
  `scripts/generate-reveal-glow-pulse.mjs`; no generated audio remains.
- Source Mixkit sound effect 478, "Small group cheer and applause" (24.484 s, stereo 44.1 kHz 16-bit
  WAV), under the Mixkit Sound Effects Free License. Read the live licence modal: commercial and
  non-commercial use, public web performance, no attribution required, no redistribution as stock.
- Derive `public/sounds/reveal-applause.wav`: 5.6 s from 0.55 s, mono 44.1 kHz 16-bit, 30 ms fade-in,
  1.1 s fade-out (493,918 bytes). Record the source URL, provider, licence URL, commercial-use and
  attribution terms and the acquisition date in `public/sounds/reveal-applause-sources.md`.
- Do not loop it, layer anything under it, or add another ambient bed.

### 2. One finishing cue, after the numbers, with no clashing chime

- `app/lib/audio.js`: remove the glow-pulse and finishing-chime helpers; add
  `preloadRevealApplause()`, `playRevealApplause(sessionId)`, `beginRevealAudioSession()` and
  `endRevealAudioSession()`.
- Keep the celebration's measured 8 % leaf cue and its 2.5 s lead; the popup's `startFinishingApplause`
  now plays the applause there instead of the chime. The four golden pulses stay on the empty-canvas
  `onConfettiSettled` signal, so the applause body carries into them.
- Preserve the opening sparkle and confetti pop. Remove the chime asset, helpers and provenance; the
  chime would otherwise play over the applause.

### 3. Session-owned audio lifecycle

- `revealAudioSessionId` is incremented by `beginRevealAudioSession()` and `endRevealAudioSession()`.
  The popup opens one session while open and ends it in the effect cleanup, which also runs on
  unmount, close and React strict-mode remount.
- `playRevealApplause(sessionId)` ignores stale sessions, records one request per session, stops any
  previous instance before playing, and when still loading starts only after the load resolves *and*
  the session is still current. `endRevealAudioSession()` stops playback immediately.
- No delayed stop timer, no fade timer and no state survives the session, so no stale callback can
  reach a later reveal.

### 4. Share to Apps inside the tap's activation

- Prepare the PNG 1.2 s after the share component mounts (and on demand for copy/download), caching
  the `File` in a ref.
- `shareToApps()` reads the cached file and calls `navigator.share(payload)` synchronously before any
  await; payload choice uses `canShare` (a throwing `canShare` counts as unsupported). Exactly one
  native call per tap: cancellation reports "Sharing cancelled.", a failure reports the explicit
  fallback, and neither retries with a second payload.
- If the image is not ready at the tap, share text + link instead of delaying the sheet.
- `copyLink()` reports success only after `clipboard.writeText` resolves; otherwise it shows the link
  selectable with "Automatic copying is unavailable."
- `getShareLink()` now also rejects query strings, fragments and `cs_test_`/`cs_live_`/`pi_`/`cus_`
  style identifiers, so payment state can never enter a share URL.

### Files

- `app/lib/audio.js`, `app/lucky-reveal-popup.js`, `app/lucky-reveal-celebration.jsx`,
  `app/share-lucky-pick-button.js`, `app/lucky-reveal-presentation.js`.
- `public/sounds/reveal-applause.wav`, `public/sounds/reveal-applause-sources.md`; removed
  `public/sounds/reveal-glow-pulse*`, `public/sounds/reveal-finish-chime*`,
  `scripts/generate-reveal-glow-pulse.mjs`.
- `__tests__/lucky-reveal-phase3.test.js` plus updated Phase 1/081/075 guards.
- `artifacts/reveal-phase3-probe.cjs`; its JSON report is generated locally beside the probe and is not
  committed, so local probe addresses never enter the repository.

### Risks

- A real recording carries room tone and a natural decay; the excerpt is trimmed with fades rather
  than processed, and the mix level (0.55) is chosen to sit under the visual finish.
- Removing the chime is a deliberate sound-design change required to avoid clashing with the applause;
  the opening sparkle and confetti pop are untouched.
- Prewarming the share image costs one canvas draw and one logo decode 1.2 s after the reveal appears;
  it happens once per reveal and is not repeated during the celebration.
- Android's real share sheet still cannot be opened in this workspace; the Web Share contract,
  activation timing and single-attempt behaviour are measured in Chromium with a stubbed panel, and
  physical-device confirmation remains pending.

## Phase 4 — Review repair for PR #1692 (2026-11-03)

1. **Keep the landed retry fix and prove it.** The `/q` commit `f29a544b` clears
   `applauseRequestedSessionId` when `preloadRevealApplause()` rejects. A new jsdom test drives the
   real module with a controllable Howl: the first decode fails, the retry in the same session
   creates a second Howl, receives `load`, plays once, and a third call is still ignored. A second
   case ends the session before the load completes and asserts nothing plays.
2. **Stop committing the generated probe report.** `artifacts/reveal-phase3/report.json` was 894 lines
   of machine output containing the loopback probe origin on 36 lines, which produced 36 DevSkim
   DS162092 notices. The probe still writes the report locally for evidence; it is removed from the
   diff. Probe results stay summarised in the task record and PR body.
3. **Two exact false positives, documented inline instead of suppressed globally.** The DS137138
   warning points at the intentional `http://` negative fixture in the share-link test (never
   fetched), and the DS172411 notice points at the warmup timer's callable arrow callback with a
   fixed delay (no string evaluation). Each receives a one-line `DevSkim: ignore` plus a reason; no
   allowlist, workflow, or scanner configuration is widened.
4. **Re-verify on the pushed head.** Focused and full Vitest, `tsc --noEmit`, DevSkim suppression
   unit tests and real-SARIF replay, `./freebuff-verify.sh`, measured build, final diff audit, then
   the DevSkim check annotations for the new head and an independent re-review.

## Phase 5 — Reveal roadmap Phase 3 audit (reliability and performance)

**Decision record:** the owner reviewed the audit and chose to keep the reveal's automatic sound with **no
in-app mute button**. An interim mute control built earlier in this task was removed; the reveal's sound
behaviour is the pre-audit behaviour, unchanged.

### 1. Audit the eight Phase 3 requirements (evidence, no change unless a deficiency is confirmed)

- **Mobile 6 and 7 picks (Android):** drive the free Preview Reveal in Chromium with an Android Pixel 7
  user agent at 412x915 and 390x844, for Personal and Gift delivery, and measure the numbers, layout,
  overflow, control hit-testing and overlaps.
- **Sound controls:** search the repository for any sound control. None exists, and the owner's decision is
  that none should exist: the reveal's sound plays automatically.
- **Browser audio restrictions and device mute:** reject every media `play()` like an autoplay policy and
  confirm the reveal logs, never throws and still finishes visually. Device-level mute cannot be tested
  without hardware and is reported as pending; HTML5 media honours it natively.
- **Reduced motion:** run with `reducedMotion: 'reduce'` and assert no particle canvas, no reveal cue and a
  static finish.
- **Cleanup:** close the reveal and assert the dialog, canvas and celebration layer are gone, no media
  element is playing and no applause starts afterwards.
- **Dependencies, assets and overhead:** list the reveal's sound requests with measured bytes and confirm
  Howler is still the single lazy-loaded audio dependency.
- **Existing functionality:** full Vitest, `tsc --noEmit`, `./freebuff-verify.sh` and the measured build.
- **Visual glitches:** page and panel horizontal overflow, ball containment, and sharing-action clipping
  and overlap.

### 2. Keep the reveal's sound automatic and remove the interim control

- `app/lib/audio.js`, `app/lucky-reveal-popup.js` and `app/lucky-reveal-celebration.jsx` are restored to
  their pre-audit state: no mute flag, no setter/getter, no toggle, no icon, and no muted branch in the
  sparkle, the applause or the confetti pop. Automatic playback is the only path.
- Assets, volumes (sparkle 0.28, pop 0.45, applause 0.55), order (sparkle → pop → applause) and the
  session-based applause lifecycle are untouched.
- Nothing else is touched: no asset re-encode, no dependency change, no CSS keyframe change and no change
  to Crystal Ball, the homepage, payments, email or the map.

### 3. Tests

- `__tests__/reveal-audio-mute.test.js` is deleted; the mute behaviour it covered no longer exists.
- `__tests__/lucky-reveal-phase3.test.js` replaces its mute guards with checks that the panel ships no
  sound control, the audio module holds no mute state, every cue is called unconditionally, and the assets
  and volumes are unchanged.
- `__tests__/components/LuckyRevealCelebration.test.jsx` drops the mute export from its audio mock; its
  existing normal-motion test already proves the pop plays automatically.

### 4. Evidence

- `artifacts/reveal-phase3-audit-probe.cjs` measures the eight requirements per scenario, including that
  the panel contains no mute control and that the sparkle, pop and applause each play once automatically.
  The generated JSON stays local so no probe origin enters the repository.
