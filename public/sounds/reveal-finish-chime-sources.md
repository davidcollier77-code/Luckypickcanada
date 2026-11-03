# Lucky Reveal finishing chime — provenance

One new sound was sourced online on **2026-11-03** and is used as the Lucky Reveal's finishing
cue: it plays once, after the maple-leaf confetti has left the screen, together with the four golden
number-ball pulses. It is a warm, natural-sounding chime (a soft bell/marimba-like "healing spell"
chime), not a synthesised computer beep or alert tone.

## Recording

- **Title:** Healing Spell Chime (Fantasy RPG)
- **Creator:** Assetsmith
- **Source URL:** https://freesound.org/people/Assetsmith/sounds/876169/
- **Audio content on the record:** Freesound tags the sound as a magical UI chime; the local audio
  review (AudioSet classifier) labels it **Chime**, **Ding**, **Ding-dong**, which matches a warm
  bell chime rather than an electronic beep.
- **Listing duration:** 2.77 seconds (the derivative below is the same length)
- **Licence:** **CC0 1.0 Universal (Public Domain Dedication)**
  - Licence deed: https://creativecommons.org/publicdomain/zero/1.0/
  - The sound page presents the CC0 licence; CC0 places the work in the public domain, so it may be
    used, modified and distributed for **commercial** and non-commercial purposes, without
    attribution. The credit above is kept as a provenance record anyway.
- **Acquired:** 2026-11-03, by direct HTTPS download of the sound's published MP3 preview
  (`https://cdn.freesound.org/previews/876/876169_19429311-lq.mp3`), no account or API key required.
  The downloaded preview was the acquisition file and is **not** committed.
- **Acquisition evidence:** the quoted facts from the sound page and the CC0 deed (page title,
  licence label, licence links, deed wording) are recorded in
  `artifacts/sound-licence/freesound-876169-licence-evidence.txt`. The scraped HTML pages themselves
  are not committed, and nothing from those pages is used as code.

## Local derivative

- **File:** `public/sounds/reveal-finish-chime.mp3` (mono, 44.1 kHz, 128 kbps, 2.77 s, about 44 KB)
- **Conversion:** FFmpeg, no content edits beyond channel/bitrate normalisation:
  `ffmpeg -i <acquired>.mp3 -ac 1 -ar 44100 -codec:a libmp3lame -b:a 128k public/sounds/reveal-finish-chime.mp3`
- **Playback:** `app/lib/audio.js` (`preloadRevealFinishChime` / `playRevealFinishChime`) at volume
  0.3, one shot per reveal, skipped entirely for `prefers-reduced-motion: reduce`.
- **Integrity check:** decoded duration 2.77 s, mean volume about -16 dB, max about -1.5 dB, so the
  file is neither silent nor clipping.

## Existing sounds kept unchanged

The reveal's opening sparkle (`/sounds/chime-sound.mp3`) and its finishing pop
(`/sounds/confetti-pop.wav`) are unchanged; this new cue is the softer closing shimmer that follows
them.

The Crystal Ball cues keep their own record in `public/sounds/crystal-ball-audio-sources.md`.
