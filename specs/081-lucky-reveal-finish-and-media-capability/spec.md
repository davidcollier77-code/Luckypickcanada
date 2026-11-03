# Feature Specification: Lucky Reveal Finish Polish and Reusable Media Inspection

**Feature Branch**: `freebuff/f42744a86b35d603e40013fd`

**Created**: 2026-11-03

**Status**: Original feature implemented; post-merge build regression hotfix in progress

**Input**: Master Work Request #1 — polish the shipped Lucky Reveal finish (confetti lifecycle, mobile
sharing, number-ball glow finish, one finishing sound cue) and extend the Freebuff workspace so video
frames and audio content can be inspected in future tasks.

## Context (verified before design)

- The one reveal is `LuckyRevealPopup` (`app/lucky-reveal-popup.js`), used by the homepage, the free
  preview and the gift route. `app/lucky-reveal-celebration.jsx` renders the maple-leaf confetti and
  the settled-leaf pile. `app/share-lucky-pick-button.js` renders **Share My Reveal**.
- **Confetti (feature 080, measured in the source):** five waves of 24 + 24 + 14 + 14 + 10 = 86
  maple-leaf particles at 0 / 500 / 1000 ms, `ticks: PARTICLE_LIFETIME_TICKS` = 150, on a canvas that
  lives inside the reveal overlay above the panel (`z-index: 3`). `canvas-confetti` deletes a particle
  when its tick counter reaches `ticks` (`updateFetti` returns `fetti.tick < fetti.totalTicks`), so a
  leaf whose 150 ticks expire while it is still painted on screen vanishes in mid-air. The layer is
  removed by a fixed timer (`CONFETTI_WINDOW_MS = 3500 ms`), not by observing the screen.
- **Sharing:** `handleShare()` builds `{files, title, text}` and calls `navigator.share` only when
  `navigator.canShare(shareData)` accepts the file payload. On Android browsers that accept text
  sharing but not file sharing (or that reject the file payload), the code drops straight to the
  custom download / copy-image / copy-link window without ever requesting the native text/link share
  sheet, and the native payload carries no `url` field.
- **Numbers:** each number ball animates `lucky-number-reveal` followed by an infinite alternating
  `lucky-glow-pulse` (`animationIterationCount: '1, infinite'`). There is no finish sequence and
  nothing is synchronised with the confetti.
- **Sounds:** the reveal plays the opening sparkle (`/sounds/chime-sound.mp3`) and the confetti pop
  (`/sounds/confetti-pop.wav`). No finishing cue exists. Provenance for the Crystal Ball sounds is
  recorded in `public/sounds/crystal-ball-audio-sources.md`, so a new sound needs the same record.
- **Workspace capability:** `scripts/setup-chromium-libs.sh` already provisions Chromium's runtime
  libraries unprivileged into `~/.local/chromium-libs` (no root, no `no-new-privileges` change, no
  sandbox flag). No video/audio tooling exists: `ffmpeg`, `ffprobe` and any audio-understanding model
  are absent, so no task can review a screen recording's audio.
- No supplied recording is present in this workspace (no video or audio file exists outside the
  repository's committed SFX), so the media capability is demonstrated on recordings produced from
  workspace-available material.

## User Scenarios & Testing

### US1 — Leaves float all the way off screen (P1)

Someone watching the reveal sees golden maple leaves fall naturally off the bottom of the screen and
keep going until they are all gone. Nothing vanishes mid-air, and the leaves are allowed to pass over
the reveal content while they fall.

**Acceptance**: no particle is deleted while it is still painted inside the visible canvas; the
particle layer stays mounted until the canvas paints nothing (measured), and only then is it
removed; the leaf artwork, palette, burst shape and particle ceiling are unchanged.

### US2 — Native sharing on Android (P1)

On an Android phone, **Share My Reveal** opens the Android share sheet with the reveal image, its
message and the website link whenever the browser supports it.

**Acceptance**: when the browser can share the image, the native sheet opens once with files, the
message and the link; when it cannot share the image, the app requests the native text/link share
before any custom fallback; cancelling either native sheet is reported as cancelled, not as an error;
computers and browsers without Web Share keep the existing download / copy-image / copy-link window.

### US3 — Four golden pulses, then rest (P1)

Only after the confetti has completely left the screen do the revealed number balls glow four gentle,
sequential golden pulses, and then settle back to their normal appearance.

**Acceptance**: the pulse sequence starts only after the confetti layer has finished, runs exactly
four pulses with a gentle per-ball stagger, and returns the balls to their resting appearance; the
resting appearance is visually the current one.

### US4 — One finishing sound cue (P2)

The reveal finishes with one short, gentle, natural-sounding magical shimmer or warm chime, played
once in time with the four pulses. The opening sparkle and the existing confetti pop are preserved.

**Acceptance**: a licensed asset exists locally with provenance (title, creator, source URL, licence,
acquisition date) recorded; it is played once, after the confetti has gone and together with the
first pulse; it is not an electronic beep or a computer alert tone; the opening sparkle and confetti
pop are unchanged.

### US5 — Reusable video and audio inspection (P2)

A future Freebuff task can inspect both video frames and the audio content of a recording with tools
that survive a workspace restart.

**Acceptance**: an idempotent unprivileged setup script provisions FFmpeg/FFprobe and audio-analysis
tooling under `$HOME`; frame extraction and an actual audio review (speech understood, sound events
identified) are demonstrated and recorded; the Chromium setup and its security posture are unchanged.

### Edge cases

- Visitor prefers reduced motion: no confetti, no pulses, no finishing sound; the existing static
  finish and reduced-motion behaviour are preserved.
- The reveal is closed mid-celebration: every timer, the confetti instance and the canvas are
  released immediately.
- The confetti library fails to load or the canvas cannot be sampled: the finish sequence still runs
  from a conservative fallback timeout instead of stalling.
- A browser exposes `navigator.share` but rejects both the file and the text payload: the existing
  custom fallback window opens, and a user cancellation is never shown as a failure.
- The finishing sound is missing or blocked by autoplay policy: the pulses still run and the failure
  is logged, never thrown.

## Requirements

- **FR-001**: The maple-leaf confetti MUST NOT be deleted while it is still visible; each leaf MUST
  be allowed to fall off the bottom of the visible canvas, and the particle layer MUST be removed
  only after the canvas paints nothing.
- **FR-002**: The leaf shape, palette, wave layout, particle ceiling and reveal-content layering MUST
  be preserved, and the leaves MAY cover the reveal content while they fall.
- **FR-003**: **Share My Reveal** MUST use the native share sheet when available: first with the
  reveal image, the message and the website link; otherwise with text and link only; the custom
  download / copy-image / copy-link window MUST remain the final fallback.
- **FR-004**: A cancelled native share MUST be reported as cancelled and MUST NOT open the fallback
  window.
- **FR-005**: The revealed number balls MUST receive exactly four gentle, sequential golden glow
  pulses that begin only after the confetti has completely disappeared, and MUST then return to
  their normal appearance.
- **FR-006**: The finishing polish MUST respect `prefers-reduced-motion`, with no pulses and no
  finishing sound for visitors who reduce motion.
- **FR-007**: One short, gentle, natural-sounding finishing shimmer/chime MUST play once, after the
  confetti has disappeared and together with the four pulses, with provenance and a licence that
  permits commercial web use recorded in the repository.
- **FR-008**: The opening sparkle and the existing confetti pop MUST be preserved.
- **FR-009**: The workspace MUST provide reusable, restart-durable, unprivileged tooling for video
  frame extraction and audio inspection, demonstrated on real recordings, without root privileges,
  without weakening the Chromium sandbox and without disabling `no-new-privileges`.
- **FR-010**: Number generation (`app/lucky-reveal.js`), artwork, layout, prices, payments, gift
  email, database, authentication, APIs and Cloudflare deployment configuration MUST NOT change, and
  the production build MUST stay below the 495 MB hard maximum.

## Key Entities

- **Reveal result**: stored numbers, lucky colour and lucky day presented by the popup and the share
  image. Unchanged by this feature.
- **Finish timeline**: the ordering constraint `confetti visible → confetti gone → 4 pulses + one
  sound → rest`, expressed in the popup and the celebration component.
- **Sound provenance record**: title, creator, listing and source URL, licence, acquisition date and
  local derivative, recorded next to the assets.

## Assumptions

- The reveal image for sharing is the existing 1200x1500 PNG; this feature does not redesign it.
- Android's share sheet behaviour is verified through the browser's Web Share API contract; no
  physical Android device is available in this workspace, so device-level confirmation stays pending
  and is stated as such.
- The finishing sound is chosen from a free sound-effect library whose licence permits commercial use
  in a website; the licence is read from the live listing page at acquisition time.
- Media-inspection tooling lives outside the repository dependency graph (under `$HOME`), like the
  existing Chromium library prefix, so it does not change the production build or its size.

## Success Criteria

- **SC-001**: Sampled frames show painted leaves until the canvas is empty and the layer is removed
  only after that; no frame shows a leaf disappearing inside the visible area.
- **SC-002**: The native share request is issued with files, message and link when supported, and with
  text and link when file sharing is unsupported; the fallback window appears only when both are
  unsupported or rejected.
- **SC-003**: Exactly four pulses are scheduled, they start after the confetti-complete signal, and
  the balls' resting styling is restored afterwards; reduced motion performs neither.
- **SC-004**: Exactly one finishing sound is requested after the confetti completes, from one
  same-origin asset with documented provenance and a commercial-use licence.
- **SC-005**: An actual audio review of a real recording reports its speech content and its sound
  events, and a video review reports sampled frames — both reproducible after a workspace restart.
- **SC-006**: The existing reveal, sharing and payment guards and the full Vitest suite pass,
  `tsc --noEmit` and `./freebuff-verify.sh` pass, and the production build is measured below 495 MB.


## Post-merge build regression — 2026-11-03

The Cloudflare production build on main stopped during Next.js/Webpack parsing because
`CONFETTI_WATCH_TIMEOUT_MS` was declared twice in `app/lucky-reveal-celebration.jsx`
(12,000 ms and 30,000 ms). The established acceptance and regression test specify one
12,000 ms fallback. The hotfix must retain that value, remove the duplicate declaration,
and ensure the regression test asserts that exactly one declaration exists.

**Additional acceptance:** the affected component must parse, the focused and full test
suites must pass, and the OpenNext Cloudflare production build must compile on the hotfix
PR head. No runtime behaviour, confetti timing, reveal appearance, audio, sharing,
number generation, or deployment configuration is to change.

## Phase 2 — Pulsating audio, chime timing and Share to Apps (2026-11-03)

Phase 1 shipped the leaf finish, the four number-ball pulses, the finishing chime and the native
image-share ladder. Phase 2 is a coordinated polish of that shipped experience, without changing any
artwork, number, payment or email behaviour.

### Verified baseline

- The number balls run an infinite 3 s alternating `lucky-glow-pulse` (`animationDuration: '0.9s, 3s'`,
  first glow 2.9 s after the popup opens) and the reveal has no sound underneath it.
- The finishing chime plays from `startNumberFinish`, which the celebration calls only after the
  canvas paints nothing, so the cue starts after every maple leaf has gone.
- Sharing is one **Share My Reveal** button that tries native sharing and opens a custom dialog with
  three actions (Copy the website link, Copy the image, Download the image) only when native sharing
  fails; the dialog is the only place those three actions exist.
- No result link is exposed: the native payload and the copied link are always the site URL.

### User scenarios

- **US6 (P1)** — While the revealed balls breathe with their golden glow, a quiet atmospheric pulse
  breathes with them. It starts on the first glow frame and stops when the reveal closes, and it is
  atmosphere rather than a musical chime.
- **US7 (P1)** — The finishing chime from Phase 1 now begins while the last few maple leaves are
  still falling, instead of waiting for the canvas to be empty; the four number-ball pulses still
  wait for the confetti to disappear.
- **US8 (P1)** — The reveal always offers four clearly visible sharing actions: **Share to Apps**
  (native Android/desktop share panel, result image + numbers + result-or-site link, including
  messaging apps), plus the existing Copy the website link, Copy the image and Download the image.
  If native sharing is unavailable, Share to Apps explains the fallback and the three local actions
  still work.

### Requirements

- **FR-011**: The atmosphere MUST be a seamless 3 s loop whose period equals
  `REVEAL_GLOW_PULSE_MS`, starting on the first number ball's glow frame and stopping with the
  reveal; it MUST be quiet, atmospheric and non-melodic, MUST NOT replace the existing sparkle, pop
  or finishing chime, and MUST be silent for `prefers-reduced-motion: reduce`.
- **FR-012**: The finishing chime MUST start while a few leaves are still painted (a measured
  fraction of the peak painted canvas), exactly once, and MUST NOT be delayed until the canvas is
  empty; the four number-ball pulses MUST still start only after the confetti has completely gone.
- **FR-013**: The reveal MUST show four visible sharing actions in one group: Share to Apps with a
  recognisable share icon and a tap target of at least 44 px, plus the three existing actions with
  their existing labels and behaviour, never hidden behind a modal.
- **FR-014**: Share to Apps MUST use `navigator.share` on supported mobile and desktop browsers,
  first with the result image, message and link and then with text and link, share the stored
  result, and prefer the reveal's same-site result link when one is available. It MUST report
  cancellation without an error and MUST fall back gracefully when Web Share is unavailable.
- **FR-015**: Number generation, artwork, layout, prices, payments, gift email, database, API routes,
  authentication and deployment configuration MUST NOT change, and the production build MUST stay
  below the 495 MB hard maximum.

## Phase 3 — Recorded applause, reliable audio lifecycle and working Android sharing (2026-11-03)

Phase 2 shipped a procedurally generated 3 s atmosphere under the number-ball glow, a musical
finishing chime, and a fourth Share to Apps action. Three problems remained: the atmosphere was a
computer-generated sound rather than a real celebration and it played continuously under the numbers;
the finishing chime began while the applause moment should be the only finishing sound; and Share to
Apps did not open the Android share sheet on a Samsung phone because the 1200×1500 PNG was drawn
inside the tap handler before `navigator.share()`, so the transient user activation had expired.

### Verified baseline

- `app/lib/audio.js` exported `REVEAL_GLOW_PULSE_MS = 3000` with a generated, seamless 3 s WAV played
  as a gapless loop from `GLOW_START_MS`, stopped only by the popup effect's cleanup.
- `public/sounds/reveal-glow-pulse.wav` was produced by `scripts/generate-reveal-glow-pulse.mjs`; its
  provenance recorded the synthesis recipe rather than a recording.
- The finishing chime (`public/sounds/reveal-finish-chime.mp3`, CC0) played from
  `startFinishingChime` on the celebration's 8 % leaf cue.
- `shareToApps()` awaited `prepareShareFile()` (canvas draw + logo decode + `toBlob`) before calling
  `navigator.share`, then could attempt the text payload after a failed image payload — two awaits
  and up to two native attempts inside one tap.
- `copyLink()` set "Website link copied." even when `navigator.clipboard.writeText` was unavailable or
  rejected, i.e. it could report a success that did not happen.
- No `resultUrl` producer existed, so the shared link was the website URL; the reveal route accepts a
  `cs_…` Stripe session id as its `revealId`.

### User scenarios

- **US9 (P1)** — At the finishing celebration the reveal plays one short, warm, real recording of a
  small group applauding and cheering (with a few natural "yay" cheers). Nothing plays continuously
  under the revealed numbers, and the applause plays once and ends naturally.
- **US10 (P1)** — The applause is timed after every number has appeared and had a moment to be read,
  as the leaves finish and the golden pulses begin. The old chime no longer plays over it.
- **US11 (P1)** — Closing the reveal, unmounting it, reopening it, or an audio file that finishes
  loading after the close never leaves sound playing, never starts audio late, and never plays the
  applause twice.
- **US12 (P1)** — On a Samsung/Android phone, tapping Share to Apps opens the native share sheet with
  the reveal image, its numbers and a link, because the image is ready before the tap and
  `navigator.share()` is called directly from it, once. Cancelling, an unsupported device and a
  failing panel each produce a truthful message and leave Copy link, Copy image and Download usable.

### Requirements

- **FR-016**: The synthesised pulse, its WAV asset and its generator MUST be removed, and no
  generated, synthesised or AI-produced replacement may be added.
- **FR-017**: The finishing sound MUST be a real, professionally recorded applause/cheer clip from a
  reputable source whose licence permits commercial use in this paid website, with source URL,
  creator/provider, licence, attribution requirement and acquisition date recorded in the repository.
- **FR-018**: The applause MUST NOT be layered over the removed pulse, MUST NOT loop, and no other
  continuous drone, wind, ocean or ambient sound may play during the reveal.
- **FR-019**: The applause MUST play exactly once per reveal, only after all six or seven numbers
  have appeared, on the finishing cue coordinated with the maple-leaf confetti and the four golden
  pulses. The musical finishing chime MUST be removed so it cannot clash with the applause; the
  opening sparkle and confetti pop MUST be preserved.
- **FR-020**: Audio MUST be owned by a reveal session: closing/unmounting stops it, invalidates any
  in-flight load, clears pending requests, and reopening starts a fresh session. No delayed stop
  timer, stale callback or duplicate playback may survive a reveal.
- **FR-021**: Share to Apps MUST prepare the share image before the tap, MUST call `navigator.share()`
  synchronously from the tap without an intervening await, and MUST make at most one native attempt
  per tap, falling back explicitly when file sharing is unsupported or the call fails.
- **FR-022**: Every sharing/copying status MUST reflect the real outcome; no success message may be
  shown for a failed clipboard write or share.
- **FR-023**: The shared content MUST contain the stored numbers and reveal text, plus a link that is
  same-site, HTTPS, free of query/fragment and free of any Stripe session, payment, customer or secret
  identifier. No result page may be invented; without a safe result URL the website URL is shared.
- **FR-024**: Number generation, artwork, layout, prices, payments, gift email, database, API routes,
  authentication and deployment configuration MUST NOT change, and the build MUST stay below 495 MB.

### Edge cases

- Reduced motion: no confetti, no pulses, no applause; the static finish and silent reveal remain.
- Audio load slower than the reveal: playback starts only inside the still-active session; a load that
  completes after close is discarded.
- Audio load fails or is blocked by autoplay policy: logged, never thrown; the visual finish runs.
- Share image not yet prepared at the tap: the single native call shares text + link rather than
  delaying the sheet.
- `navigator.canShare` throws or rejects the payload: treated as unsupported, with the explicit
  fallback; never retried.
- Share cancelled: "Sharing cancelled." and no fallback dialog or second attempt.
- Clipboard unavailable: the link is shown selectable with a message that it was not copied.

### Success criteria

- **SC-007**: The shipped applause is a real recording with a commercial-use licence and full
  provenance; no generated atmosphere asset or generator remains in the repository.
- **SC-008**: In Chromium, the applause is requested once per reveal, after all numbers are visible,
  while leaves are still painted, and the media element is paused when the reveal closes.
- **SC-009**: A reveal closed while the applause file is delayed by 6 s records zero applause plays
  after the close.
- **SC-010**: The tap-to-`navigator.share` interval is under 100 ms in the probe, with exactly one
  native call per tap for success, cancellation and failure.
- **SC-011**: The full Vitest suite, `tsc --noEmit` and `./freebuff-verify.sh` pass, the production
  build is measured below 495 MB, and a real Android device check is reported as pending if no device
  is available.

## Phase 4 — PR #1692 review repair (2026-11-03)

**Input:** the review findings on PR #1692 at head `a23d975f`, plus the follow-up commit `f29a544b`.

**Verified findings**

- DevSkim reported 38 new annotations on the PR head: one DS137138 warning on
  `__tests__/lucky-reveal-phase3.test.js:286`, one DS172411 notice on the share-image warmup timer in
  `app/share-lucky-pick-button.js:171`, and 36 DS162092 notices on loopback addresses inside the
  committed `artifacts/reveal-phase3/report.json`. All 38 were fetched from the check-run annotations
  and matched to source; none indicates attacker-controlled input, weak cryptography, or a shipped
  insecure request.
- Amazon Q's confirmed finding was real: `playRevealApplause` marked the session as requested before
  the load completed, so a rejected preload left the guard set and every later call for that open
  session was dropped. The `/q` commit reset the guard in the catch block, but had no test and had
  not been exercised locally.

**Requirements**

- FR-025: a failed applause decode must be retryable within the still-open reveal session, and the
  successful retry must still play exactly once.
- FR-026: ending the session before a late decode completes must still prevent playback.
- FR-027: generated local probe output must not be committed when it embeds loopback origins.
- FR-028: scanner findings that are genuine false positives must be documented at the exact line;
  scanner rules, allowlists, and workflow coverage must not be widened.
- FR-029: the recorded applause, lifecycle, sharing, artwork and unrelated behaviour must not change.

## Phase 5 — Reveal roadmap Phase 3 audit: reliability and performance (2026-11-03)

**Input:** Master Work Request #1, Phase 3 of the reveal roadmap (task groups `testing`, `audio`,
`polishing`). Audit the shipped reveal against the eight Phase 3 requirements and repair only
confirmed deficiencies; do not start Phase 4 and do not remove the temporary FREE Preview access.

### Verified baseline and audit findings

- Six and seven picks render correctly in a Chromium Android-emulated phone and on desktop, and the
  existing reveal behaviour (numbers, colour, day, sharing, close, map call to action) is intact.
- The reveal's audio is the opening sparkle (`/sounds/chime-sound.mp3`), the celebration pop
  (`/sounds/confetti-pop.wav`) and the recorded applause (`/sounds/reveal-applause.wav`, 5.6 s). All
  three start without a separate sound prompt, and the applause alone runs longer than three seconds.
- **Confirmed deficiency:** no sound mute/unmute control existed anywhere in the product
  (`grep -rniE "mute|soundEnabled|audioEnabled|aria-pressed" app` matched only an unrelated map
  filter). A visitor had no way to silence the reveal without muting the device, which fails Phase 3
  requirement 2 and WCAG 2.2 SC 1.4.2 (Audio Control) for the automatic applause.
- Everything else in the audit is a check to evidence, not a change: browser audio restrictions are
  already handled without throwing, `prefers-reduced-motion` already removes the burst, the pulses
  and every cue, and closing the reveal already ends the audio session and releases the canvas.

### Requirements

- **FR-030**: The reveal MUST offer a visible sound mute/unmute control from the moment it opens,
  with a 44 px tap target, an accessible name that states the action, and a pressed state; it MUST
  NOT cover the close control, the numbers, the copy or the sharing actions.
- **FR-031**: Muting MUST stop the reveal's cues immediately, MUST prevent every later cue in that
  reveal (including a decode that completes after the mute), and MUST NOT replay a cue that was
  consumed while muted. Unmuting MUST restore the cues for the next reveal.
- **FR-032**: The mute preference MUST belong to the page session, MUST survive closing and reopening
  the reveal, and MUST NOT change Crystal Ball, the homepage or any payment, email or database path.
- **FR-033**: The reveal MUST keep working when a browser blocks automatic playback: no thrown error,
  no broken layout, and the visual finish, close control and map call to action stay usable.
- **FR-034**: `prefers-reduced-motion: reduce` MUST still render no particle canvas, request and play
  no reveal sound, and show the static finish; closing MUST remove the reveal, its canvas and its
  layer, and leave no media element playing.
- **FR-035**: The existing sound assets, share artwork, number generation, prices, payments, gift
  email, API routes, database and deployment configuration MUST NOT change, and the production build
  MUST stay below the 495 MB hard maximum.

### Success criteria

- **SC-012**: An Android-emulated Chromium run of both games (six and seven picks) shows the stored
  numbers in range and unique, with no horizontal overflow, no clipped sharing control and no
  overlapping controls or number balls.
- **SC-013**: The mute control reports `aria-pressed` and its label correctly, silences the applause
  when tapped before the cue, and pauses it when tapped during playback, with no later replay.
- **SC-014**: With every `play()` rejected by an autoplay policy, the reveal records the rejected
  attempts, shows no page error, and still completes the visual celebration.
- **SC-015**: The full Vitest suite, `tsc --noEmit` and `./freebuff-verify.sh` pass, and the measured
  production build stays below 495 MB.
- **SC-016**: A physical Android device and audible playback remain reported as pending when no device
  or audio output is available in the workspace.
