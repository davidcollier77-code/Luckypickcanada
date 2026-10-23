# Plan for Lucky Stories Polish

1. **Update Primary Buttons**
   - In `app/lucky-map-of-canada/lucky-map-of-canada.js`: modify styling of `.story-link` items (and any other primary buttons) to have a crisp 3D gold finish.
   - Adjust `box-shadow` for depth and `linear-gradient` for a polished metallic look.
   - Ensure the `themes/default/map.css` handles hover states appropriately (adding a subtle lift).

2. **Update Secondary Buttons**
   - Locate the "← Back to Lucky Story Map" and "Celebrate" buttons.
   - Convert them from plain text/transparent background to a charcoal/near-black button with gold borders and subtle hover state.

3. **Update Story Cards and Panels**
   - In `app/lucky-map-of-canada/lucky-map-of-canada.js`: change the background gradients of story cards (`map-story-card`, `map-activity-card`, `map-province-card`) from greenish (`rgba(6, 32, 26, ...)`) to a cohesive dark translucent tone (e.g., `rgba(15, 23, 30, ...)`).
   - Ensure selected state of a story removes the green fill and instead uses a subtle gold border and slightly lighter dark glass background.

4. **Add Depth to the Four-Leaf Clover**
   - Wrap the "🍀" emoji instances in a `span` (e.g., `<span className="clover-3d">🍀</span>`).
   - Add `.clover-3d` to `themes/default/map.css` with `text-shadow` or `filter: drop-shadow` to give it dimensionality.
   - Alternatively, add it directly as an inline style.

5. **Fix Full-Story Expansion Scroll**
   - In `app/lucky-map-of-canada/lucky-map-of-canada.js`, modify `openStory(story)` to also include a `setTimeout` (or similar) that scrolls the `storyPanelRef.current` (or the specific story element) into view smoothly, with an offset for the sticky header.

6. **Testing and Verification**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
   - Run `pnpm run build` and `./jules-verify.sh`.
