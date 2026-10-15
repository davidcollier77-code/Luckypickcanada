# Crystal Ball Fortune Reveal — Build Repair

Repair the merged Crystal Ball fortune-reveal implementation from PR #1489 after Cloudflare's production build failed to compile `app/components/CrystalBall/CrystalBall.tsx`.

The focused repair must:
- Restore the correctly nested AVIF, WebP, and PNG-fallback `<picture>` markup.
- Keep a single dynamic glow element.
- Remove duplicate JSX attributes.
- Restore controlled question-input updates and the Seek Fortune click handler, including the existing click sound.
- Preserve the existing crystal-ball artwork, fortune panel placement, styles, reveal timing, navigation, and reduced-motion behavior.

Acceptance requires the Crystal Ball interaction test, repository verification, production build, build-size measurement under 495 MB, and successful Cloudflare build. Results must be reported only after the corresponding checks actually run.
