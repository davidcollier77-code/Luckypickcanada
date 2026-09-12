## 2026-09-04 - Polish Lucky Card Reveal Experience
**Learning:** For HTML5 Canvas animations on mobile devices, extracting overlapping full-screen blending operations (like \`ctx.fillRect\` used for flashes or auras) from within loops into a single batched pass is critical to prevent massive GPU overdraw and maintain framerates.
**Action:** Combined overlapping impact flashes and the background aura into a single \`fillRect\` compositing pass at the end of the \`renderCanvas\` frame.

## 2026-09-06 - Prevent screen readers from announcing decorative SVGs redundantly
**Learning:** When using `<svg>` icons alongside text inside `<button>` elements (or as decorative placeholders), screen readers may announce them confusingly or redundantly. This is a common pattern in components like the Collection Binder.
**Action:** Add `aria-hidden="true"` to all decorative `<svg>` icons inside interactive elements or where text is already present to provide context, so that only the semantic text is announced to assistive technologies.

## 2026-09-12 - Prevent screen readers from announcing loading spinners redundantly
**Learning:** Decorative SVG elements like loading spinners inside interactive elements (e.g., `<button>`) with text can cause screen readers to announce confusing or redundant information. This is an accessibility issue found in the `LuckyGenerator` loading state.
**Action:** Always add `aria-hidden="true"` to loading spinners or decorative `<svg>` icons when semantic text like "Loading..." is already present.
