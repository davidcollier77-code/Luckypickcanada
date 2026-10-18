# Feature Specification: Homepage SEO Section Background Fix

## Overview
Fix one visual issue on the Lucky Pick Canada homepage. The bottom section headed "About Lucky Pick Canada" needs a sufficiently dark, semi-transparent background so the text is easy to read over the Milky Way starfield. Its container should match the existing "About the Creator & Our Story" teaser above it.

## Scope
- Update `themes/default/homepage.css` to fix the CSS selector so `.homepage-seo-section` receives the same styling as the existing `.homepage-about-teaser` glass-surface container.
- Sync the updated CSS to `public/themes/default/homepage.css`.
- Ensure styling matches the upper reference exactly.

## Out of Scope
- Redesigns, markup changes, logic modifications.
