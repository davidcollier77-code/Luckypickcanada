# Crystal Ball audio asset provenance

Three new sound effects were sourced online on 2026-10-17 and are used only as integrated UI cues on LuckyPickCanada. The original MP3 downloads are temporary acquisition files; the repository keeps same-origin WAV derivatives only.

## 1. Energy bed

- **Title:** Holy Aura Resonance – Magical Energy Loop
- **Artist:** Coghezzi
- **Listing:** https://pixabay.com/sound-effects/people-holy-aura-resonance-magical-energy-loop-533856/
- **Direct source:** https://cdn.pixabay.com/download/audio/2026/05/14/audio_618d222656.mp3?filename=coghezzi-holy-aura-resonance-magical-energy-loop-533856.mp3
- **Listing duration:** 16 seconds
- **Local derivative:** `crystal-ball-energy.wav`

## 2. Reveal cue

- **Title:** Elemental Magic Spell Impact Outgoing
- **Artist:** RescopicSound
- **Listing:** https://pixabay.com/sound-effects/film-special-effects-elemental-magic-spell-impact-outgoing-228342/
- **Direct source:** https://cdn.pixabay.com/download/audio/2024/07/30/audio_e8c15810bd.mp3?filename=rescopicsound-elemental-magic-spell-impact-outgoing-228342.mp3
- **Listing duration:** 3 seconds
- **Local derivative:** `crystal-ball-reveal.wav`

## 3. Falling leaf cue

- **Title:** Sound Effect: Twinkle/Sparkle
- **Artist:** ShidenBeatsMusic
- **Listing:** https://pixabay.com/sound-effects/film-special-effects-sound-effect-twinklesparkle-115095/
- **Direct source:** https://cdn.pixabay.com/download/audio/2022/07/15/audio_89f13f8631.mp3?filename=shidenbeatsmusic-sound-effect-twinklesparkle-115095.mp3
- **Listing duration:** 2 seconds
- **Local derivative:** `crystal-ball-leaf.wav`

## License and acquisition

All three listing pages display **“Free for use under the Pixabay Content License.”** The official license summary says content may be used for free, attribution is not required, and content may be modified/adapted, subject to prohibited uses. We include artist/source attribution here as a provenance record. The sounds are integrated into the website interaction and are not distributed as standalone audio products.

- **License summary:** https://pixabay.com/service/license-summary/
- **Acquisition:** direct HTTPS downloads using `curl -L --fail`; no account/API key or paid CLI is required.
- **Conversion:** FFmpeg command-line conversion to mono, 22,050 Hz, 16-bit PCM WAV. No source MP3 is committed into `public/`.
- **Integrity checks:** validate RIFF/WAVE headers, duration, file size, and non-silent samples before committing.

Source metadata was inspected from the live Pixabay listing pages on 2026-10-17. Review the current full license before materially changing this use case.
