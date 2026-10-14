# Explore Your Luck Interaction Contract

- **Trigger**: Click, keyboard activation, or the existing touch/pen pointer-up path on Explore Your Luck.
- **Reduced motion**: Keep direct scrolling to `#play-explore`; omit the decorative burst and confetti pop sound.
- **Normal interaction**: Request the preloaded local `/sounds/confetti-pop.wav` confetti pop sound synchronously when loaded, launch gold maple-leaf particles at the button's viewport position, and begin the existing 1.5-second eased scroll.
- **Confetti fallback**: If path rendering is unavailable, use the existing gold star/circle particles.
- **Audio fallback**: If the confetti pop sound is still loading, do not play it late after the current interaction; finish loading for a later activation.
- **Must remain unchanged**: Scroll destination, easing, cooldown, interruption listeners, accessible label, touch behavior, homepage wording and layout, hero art and Milky Way background.
