# Implementation Plan — Tip Jar Glow Pulse Match

## Technical Context

The homepage buttons are rendered in `app/homepage/HomePage.js`. The existing pulse animation is defined by `@keyframes suggestionBtnGlow` and the `.suggestion-btn-glow` selector in `app/globals.css`. The shared gold-button pressed-state override and reduced-motion styling live in `themes/default/homepage.css`.

## Decisions

1. Rename the suggestion-specific class to the reusable `gold-btn-glow` and apply it to both the Tip Jar and Suggestion buttons.
2. Rename the keyframes to `goldBtnGlow` without changing any keyframe shadow values or timing (3s ease-in-out infinite).
3. Update the reduced-motion selector in `app/globals.css` to disable the shared class.
4. Update the active-state selector in `themes/default/homepage.css` so either pulsing button pauses the animation while pressed, allowing the existing flattened active shadow to show.
5. Preserve both shimmer overlays, the 3D raised style, all labels, click/form handlers, and all destinations. This is a CSS/class-name-only visual adjustment with no new asset or dependency.

## Verification Plan

- Inspect the final source to confirm both buttons have `gold-btn-glow`, both old suggestion-only identifiers are gone from the implementation, the original pulse declaration remains `3s ease-in-out infinite`, and reduced-motion/active-state selectors target the shared class.
- Run `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm run build`, and `./jules-verify.sh` where a repository worktree is available.
- Measure the production build against the 495 MiB hard maximum.
- Inspect CI and browser-level visual/interaction checks; report anything unavailable as pending or blocked, never as passed.
