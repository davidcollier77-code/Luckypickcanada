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
