# Progress

## 2026-10-01 — Homepage Hero Artwork Layout Repair

- Corrected the homepage hero sizing constraint that was making the new foreground artwork render too small inside a landscape-oriented container.
- The hero now uses viewport-height sizing for the artwork stage, a wider 1100px content cap, and a shrink-safe 100svh flex layout while preserving the existing PNG, background, navigation, and scrollable homepage structure.
- Mirrored the CSS change in both theme stylesheet copies used by the application.
- Transparency/checkerboard cleanup was not changed and remains a separate follow-up.
- Verification: code/diff reconciliation completed; browser/build checks remain pending on the PR.

## 2026-10-01 — Homepage & Crystal Ball Visual Polish

- Implemented authorized visual polish on `app/homepage/Hero.js`, `app/homepage/HomePage.js`, `app/layout.js`, and `themes/default/homepage.css`.
- Refined the mobile hero hierarchy and navigation spacing.
- Distinguished CTA buttons, styling secondary buttons with a translucent outline to establish visual hierarchy without losing the gold aesthetic.
- Restored visual pacing by updating padding and spacing clamps in CSS.
- Addressed the stray `blur-2xl` background circle artifact in `Hero.js`.
- Removed old aurora layers in Crystal Ball and extended `.homepage-sky-backdrop` to ensure consistency.

## 2026-09-30 — Homepage Welcome-First Hero (In Progress)

- Authorized visual redesign implemented on `app/homepage/Hero.js`.
- The hero now occupies the initial viewport while the existing Lucky Meter remains intact below the fold.
- Existing Milky Way background and real logo asset are preserved.
- Metallic gold hero typography and the gold maple-leaf `Explore your luck` transition were added.
- Final Playwright/build verification is pending.

- **YYYY-MM-DD**: Restored `app/homepage/Hero.js` to the previous welcome-first hero composition. Updated Playwright visual baselines.
