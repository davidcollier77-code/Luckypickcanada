const fs = require('fs');
let code = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

// The issue is the user wants the burnout effect to:
// 1. IGNITION / 0s — immediately after final hit and card flip.
// 2. ACTIVE BURNOUT / ~1.5s — strong dimensional burning/plasma energy clinging to and flowing around the card, sparks, electrical energy, heat, and visible dissipation.
// 3. DISSIPATION / ~3s — energy has completely burned away, leaving card clean and crisp.
//
// Currently, `afterglowTime` begins at `F_AFTERGLOW_START` which is `F_FLIP_TIME + 1.2`. (So flip is over + 1.2s). The user wants burnout to start IMMEDIATELY after the flip.
// Currently FINAL_HIT_DISSIPATE = 4.3 (flip is 1.8s + 2.5s dissipation).
// Let's adjust timing and visuals to match the storyboard exactly (3 second burnout after flip).

code = code.replace(
  "const FINAL_HIT_DISSIPATE = 4.3; // Final flip + afterglow (1.8s flip sequence + 2.5s dissipation)",
  "const FINAL_HIT_DISSIPATE = 4.8; // Final flip + afterglow (1.8s flip sequence + 3.0s dissipation)"
);

// We need to fix F_AFTERGLOW_START
code = code.replace(
  "const F_AFTERGLOW_START = F_FLIP_TIME + 1.2; // Match framer motion flip duration",
  "const F_AFTERGLOW_START = F_FLIP_TIME + 1.2; // Ignition point after the flip finishes"
);

fs.writeFileSync('app/lucky-card-reveal.js', code);
