# Implementation Plan

1. **CSS Splitting:** Remove `homepage.css`, `map.css`, and `hero.css` from the global `themes/default/index.css`. Import them locally within their respective components to allow Next.js to code-split the CSS bundles effectively.
2. **Cache Headers:** In `next.config.mjs`, introduce a specific rule for `/.*\.(avif|webp|png|jpg|jpeg|svg)$` returning `public, max-age=31536000, immutable` headers.
3. **Turnstile Preload Removal:** In `app/page.js`, remove `preload(TURNSTILE_SCRIPT_URL, { as: 'script' })`. Let `@marsidev/react-turnstile` load it asynchronously to free up the critical render path.
