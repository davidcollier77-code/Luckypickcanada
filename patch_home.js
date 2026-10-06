const fs = require('fs');
let code = fs.readFileSync('app/homepage/HomePage.js', 'utf8');

// Notice that the test expects a target `id="lucky-meter"` and scrolls to it.
// When placing the meter in the new grid layout, it appears we nested it inside the div for `.homepage-play-grid` which works, but let's check its scroll offset.
// Also, maybe `document.getElementById('lucky-meter')` isn't returning what's expected if it's hidden or not rendered.
// But it was working before on desktop! And for mobile-412! It failed on mobile-390 timeout.

