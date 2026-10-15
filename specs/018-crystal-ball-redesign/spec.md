# Crystal Ball Redesign Specification

Replace the incorrect Lucky Meter-style console artwork on the Crystal Ball page with the supplied high-fidelity foreground artwork: a reflective cosmic glass orb, ruby-red maple leaf, emerald four-leaf clover, blue sapphire drop, and ornate gold-and-obsidian pedestal.

## Requirements
- Deliver the foreground through AVIF first, WebP second, and PNG as the final fallback.
- Preserve transparent edges around the orb and pedestal so the existing Milky Way background stays crisp and visible.
- Do not reuse Lucky Meter console artwork. Do not add an aurora layer or a separate background inside the foreground illustration.
- Keep the floating animation, subtle glow, responsive layout, brand plaque, question form, fortune generation, navigation, audio, and accessibility behavior.
- A homepage-style meteor effect is acceptable as a separate optional future enhancement, not a prerequisite for this correction.
- Test actual rendering and image loading at desktop and mobile sizes.
