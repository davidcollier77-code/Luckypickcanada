# Implementation Plan

1. Adjust `timeframeFilter` buttons inline style in `app/lucky-map-of-canada/lucky-map-of-canada.js` to change the inactive button style (light text color, clear border, non-transparent background).
2. Adjust the mapping of `provinceSelections` to conditionally render `null` if `stories.length === 0` to not display 0 count markers when empty.
3. Update `map-statistic` padding and height and grid size in `themes/default/map.css` under the `@media (max-width: 560px)` breakpoint.
4. Add "Read full story" visual cue to the recent activity cards by updating the story preview section in `lucky-map-of-canada.js`.
5. Update introductory paragraph text in `lucky-map-of-canada.js`.
