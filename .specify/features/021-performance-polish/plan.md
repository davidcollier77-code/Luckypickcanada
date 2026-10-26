# Performance Polish Plan

1. In `app/homepage/HomePage.js`, wrap canvas dimension reassignment in a conditional to prevent reflow on every scroll event (mobile address bar shifting).
2. In `app/lucky-card-reveal.js`, pull `getBoundingClientRect()` outside the `requestAnimationFrame` block to avoid interleaving reads and writes, and unconditionally setting canvas size.
3. In `app/homepage/Hero.js`, correct the `image/avif` preload hint to `image/webp` to match the actual `<img src>` fallback for browsers that understand preload but do not process AVIF hints correctly.
