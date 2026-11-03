# Reveal applause — source and licence

`public/sounds/reveal-applause.wav` is a real studio/library recording of a small group applauding and
cheering. It replaces the synthesised pulse that Phase 2 shipped; nothing in this asset is generated,
synthesised, or AI-produced. It is trimmed, not otherwise processed.

## Source

- **Title:** Small group cheer and applause (Mixkit sound effect 478)
- **Provider / creator:** Mixkit, by Envato. The listing credits the Mixkit library rather than an
  individual recordist, so no personal creator name is published on the item.
- **Sound page:** https://mixkit.co/free-sound-effects/applause/ (item "Small group cheer and applause")
- **Original audio file:** https://assets.mixkit.co/active_storage/sfx/478/478.wav
  (24.484 s, stereo, 44.1 kHz, 16-bit PCM WAV, 4,319,094 bytes)
- **Licence:** Mixkit Sound Effects Free License — https://mixkit.co/license/modal/sfxFree/
  (linked from https://mixkit.co/license/)
- **Acquired:** 2026-11-03

## Commercial use and attribution

The Mixkit Sound Effects Free License states that items "can be used in your commercial and
non-commercial projects for free", including public performance on any web or social media platform
and in an end product that incorporates the item as part of a larger work. It does not require
attribution. It does not permit redistributing the sound on its own as stock, in a tool or template,
or with source files, or claiming it as your own — this repository uses it only as the finishing
sound inside the Lucky Pick reveal, which is an end product, and this record credits the source.

Attribution is therefore **not required**, but the source is recorded here anyway.

## Derivative

A 5.6 s excerpt beginning at 0.55 s was taken from the original and downmixed to mono 16-bit PCM at
44.1 kHz, with a 30 ms fade-in and a 1.1 s fade-out so it ends naturally:

```
python3 - <<'PY'   # equivalent: ffmpeg -ss 0.55 -t 5.6 -i 478.wav -ac 1 -af "afade=t=in:d=0.03,afade=t=out:st=4.5:d=1.1" reveal-applause.wav
# read 478.wav, slice 0.55 s .. 6.15 s, average the two channels, apply the two fades, write mono 16-bit 44.1 kHz
PY
```

Output: `public/sounds/reveal-applause.wav` — 5.600 s, 44,100 Hz, mono, 16-bit, 493,920 bytes.

## Use in the product

`app/lib/audio.js` preloads it and plays it once per reveal, on the celebration's finishing cue (when
only a few maple leaves are still falling, immediately before the four golden number-ball pulses).
There is no continuous background audio: the reveal is otherwise silent after its opening sparkle and
confetti pop, and the previous synthesised atmosphere and finishing chime are removed so nothing
plays underneath or over the applause.
