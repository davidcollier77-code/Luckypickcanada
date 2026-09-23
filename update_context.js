const fs = require('fs');
let context = fs.readFileSync('memory-bank/activeContext.md', 'utf8');

const newEntry = `- Rebuilt Lucky Card Reveal post-flip burnout to accurately reflect 3-stage visual storyboard (Ignition, Active Burnout, clean Dissipation).
- Refined metallic tier colors per governance (Standard: Bronze/Gold, Premium: Pewter/Silver, Flagship: Rich Gold).
- Removed persistent \`tier-glow\` CSS application from card front to ensure perfectly clean dissipation with no lingering halo or grid artifacts.
- Synced explosive/superheated spark colors to tier properties to prevent Premium from receiving warm orange sparks.
- Adjusted \`FINAL_HIT_DISSIPATE\` duration to 4.8s to fully capture the 3-second visual burnout phase cleanly.`;

context = context.replace('## Current Work\n', `## Current Work\n${newEntry}\n`);

fs.writeFileSync('memory-bank/activeContext.md', context);
