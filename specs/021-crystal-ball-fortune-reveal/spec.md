# Crystal Ball Fortune Reveal Enhancement

Objective: Polish the existing Crystal Ball question-and-answer interaction into a coordinated cinematic magical experience.

Requirements:
1. Question submission and scroll: Smoothly scroll the Crystal Ball and fortune panel into view when a question is submitted, avoiding fighting the visitor if they manually scroll.
2. Orb awakening: Coordinate a restrained blue internal glow/flicker (or subtle swirling light) during the loading/generation state.
3. Progressive fortune reveal: Progressively reveal the fortune on the client, splitting by words. Calculate reveal pacing based on the response length.
4. Golden maple-leaf guide: Show one small, polished golden maple leaf gliding down alongside the text as it appears.
5. Completion pulse: Flash a brief, warm-gold pulse on the orb after the final word appears, then return to idle.
6. Repeat readings: Ensure the sequence resets cleanly for subsequent questions.
7. Accessibility: Ensure screen readers announce the full text at once, avoiding character/word-by-word spam. Wrap progressive text in aria-hidden and hide full text for sr-only. Respect prefers-reduced-motion.

Scope: Preserve existing artwork, background, audio, and API routes. Use exactly one task group (polishing).

8. Build correctness: Render each progressively revealed fortune word inside a valid `<span>` element with one stable `key`; do not leave JSX attributes outside an opening element.
