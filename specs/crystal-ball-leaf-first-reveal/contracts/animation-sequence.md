# UI Interaction Contract — Crystal Ball Reveal

For a non-empty question:
1. Submit enters the existing loading state and begins the energy-gathering glow.
2. After a valid answer is returned: preRevealPulse → leafFalling → revealing → completionPulse → idle.
3. Visible fortune characters remain unrevealed during the flash and leaf-flight stages.
4. Animation end is the normal-motion trigger that unpauses visible character reveal.
5. With prefers-reduced-motion: reduce, skip the flight and render the answer immediately.
6. A completed request does not consume a limited question allowance; later questions in the same visit continue to work.
