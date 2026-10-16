# Research — Crystal Ball Leaf-First Fortune Reveal

- The existing component already uses loading, revealing, and completionPulse states. The gold ballInnerGlowPulse class is currently selected only by completionPulse, which follows the last revealed character; this explains the perceived late flash.
- The main artwork is rendered via the AVIF/WebP/PNG picture fallback. Its pixels are not separate DOM elements, so the falling effect is a separate GoldenLeaf SVG positioned relative to the displayed artwork. The artwork itself must never be hidden or altered.
- Visible text is a character map hidden from screen readers; a separate sr-only paragraph exposes the complete answer. Keep accessible text independent of visual sequencing.
- No user-facing API or persistent model is introduced. Session readings already allow repeated questions, so this change should not add a question cap.
