# Tasks for Lucky Stories Polish

1. **Primary Gold Buttons**
   - Identify primary buttons in `app/lucky-map-of-canada/lucky-map-of-canada.js` and `themes/default/map.css`.
   - The current style uses `linear-gradient(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%)`.
   - Update styling to use subtle 3D gold gradients, highlights, and restrained shadows.
   - Refine hover/focus/active states.

2. **Secondary Buttons**
   - Identify secondary actions (like "← Back to Lucky Story Map").
   - Currently, they are transparent with underline. The requirement states: "Give secondary actions a darker charcoal or near-black appearance, complemented by restrained gold accents, borders, or highlights where appropriate... Apply the same attention to depth, contrast, hover feedback".
   - Convert to styled buttons instead of inline links.

3. **Story Cards**
   - Update `.map-story-card`, `.map-activity-card`, and selected states in `lucky-map-of-canada.js`.
   - Currently, selected story uses `linear-gradient(145deg, rgba(6, 32, 26, 0.92), rgba(20, 75, 55, 0.85))`.
   - Change to a translucent dark/charcoal background (`rgba(15, 23, 42, 0.6)` or similar) with gold accents.

4. **Four-Leaf Clover Dimensionality**
   - The clover is a text character "🍀" in `lucky-map-of-canada.js`.
   - Give it "more depth and visual character" (e.g., wrap in a `span` with a subtle drop-shadow or text-shadow for a 3D effect).

5. **Scroll Behavior on Story Expansion**
   - In `openStory` function inside `lucky-map-of-canada.js`, currently no scroll is happening when opening a story. Only when selecting a province.
   - Enhance the scroll logic to target the specific story card or the story panel when a story is expanded, accounting for sticky headers.

6. **Verify and Check**
   - Run visual tests if applicable, build limits, linting.
