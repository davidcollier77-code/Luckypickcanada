## 2026-09-04 - Polish Lucky Card Reveal Experience
**Learning:** For HTML5 Canvas animations on mobile devices, extracting overlapping full-screen blending operations (like \`ctx.fillRect\` used for flashes or auras) from within loops into a single batched pass is critical to prevent massive GPU overdraw and maintain framerates.
**Action:** Combined overlapping impact flashes and the background aura into a single \`fillRect\` compositing pass at the end of the \`renderCanvas\` frame.
