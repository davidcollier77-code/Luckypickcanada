# Lucky Reveal glow-pulse atmosphere — provenance

`public/sounds/reveal-glow-pulse.wav` is a **procedurally generated** three-second loop that plays
under the revealed number balls' glow animation. It is not a downloaded recording, so it carries no
third-party licence or attribution obligation.

## Recording

- **Title:** Lucky Reveal Glow Pulse (generated atmosphere)
- **Creator:** Generated in this repository by
  [`scripts/generate-reveal-glow-pulse.mjs`](../../scripts/generate-reveal-glow-pulse.mjs)
- **Source URL:** none — no third-party source; the generator is the source.
- **Licence:** Original work of this repository; no external licence applies. No third-party samples,
  loops, or model output are used.
- **Acquired / generated:** 2026-11-03
- **Format:** WAV, PCM 16-bit, mono, 22,050 Hz, exactly 3.000 s (66,150 samples), 132,344 bytes.
- **Regenerate / verify:** `node scripts/generate-reveal-glow-pulse.mjs` and
  `node scripts/generate-reveal-glow-pulse.mjs --check` (byte-for-byte reproducibility).

## Sound design

The atmosphere has to synchronise with the CSS `lucky-glow-pulse` animation, which runs for
`REVEAL_GLOW_PULSE_MS` (3000 ms) and alternates between dim and bright, brightest at the halfway
point of each cycle. To match it, the loop:

- uses a 3.000 s period, exactly the animation duration;
- applies an amplitude envelope of `sin²(π · t / T)`, which is **silent at both loop edges** (so the
  loop joins without a click) and **loudest at 1.5 s**, the animation's brightest moment;
- is built from a very quiet low drone (55 Hz and 82.5 Hz) under band-limited "air" noise, which
  reads as atmosphere rather than as a musical chime or a computer alert;
- is normalised to a peak of 0.26 and played at volume 0.2, below the reveal's sparkle, pop and
  finishing chime, so it sits underneath the other cues.

## Playback

`app/lib/audio.js` provides `preloadRevealGlowPulse()`, `startRevealGlowPulse()` and
`stopRevealGlowPulse()`. The popup starts it on the first number ball's glow frame
(`GLOW_START_MS`, 2.9 s after opening) and stops it, with a 500 ms fade, when the reveal closes or
unmounts. `prefers-reduced-motion: reduce` skips it entirely, matching the reveal's existing sound
policy.

## Existing sounds kept unchanged

The reveal's opening sparkle (`/sounds/chime-sound.mp3`), confetti pop (`/sounds/confetti-pop.wav`),
and finishing chime (`/sounds/reveal-finish-chime.mp3`, provenanced in
`reveal-finish-chime-sources.md`) are unchanged.
