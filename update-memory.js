const fs = require('fs');

// activeContext.md
let activeContext = fs.readFileSync('memory-bank/activeContext.md', 'utf8');
activeContext = activeContext.replace('## Next Steps\n- Submit surgical fix PR for the rocket launch sound.\n', '## Next Steps\n- None at this time.\n');

const newBullet = `- Reduced UI click to generator/rev buildup audio delay from 150ms to 75ms for a tighter, more immediate cinematic initiation.\n- Replaced the generic meteor audio \`mixkit-cinematic-whoosh.mp3\` with a heavier atmospheric tearing asset \`mixkit-meteor.mp3\` from Mixkit.\n- Adjusted Meteor Shower sequence spawn timings to provide deliberate spacing (400ms, 1400ms, 2600ms, 3600ms, 4800ms) ensuring the initial meteor hits immediately post-transition without causing overlapping audio mud.\n- Removed unused \`tierAudioKey\` variable assignment left over from earlier GSAP logic.\n`;

activeContext = activeContext.replace('## Previous Context\n', `## Previous Context\n${newBullet}`);
fs.writeFileSync('memory-bank/activeContext.md', activeContext);

// progress.md
let progress = fs.readFileSync('memory-bank/progress.md', 'utf8');
progress = progress.replace('## Completed Features\n', `## Completed Features\n- Refined Meteor Shower audio and timing for the Daily Resonance Lucky Meter.\n`);
fs.writeFileSync('memory-bank/progress.md', progress);
