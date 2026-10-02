const fs = require('fs');

// activeContext.md
let activeCtx = fs.readFileSync('memory-bank/activeContext.md', 'utf8');
activeCtx = activeCtx.replace(
  '## Current Focus',
  '## Current Focus\n- Implemented "EXPLORE YOUR LUCK" interactive scroll control in `app/homepage/Hero.js` with subtle visual magic particle effect.'
);
fs.writeFileSync('memory-bank/activeContext.md', activeCtx);

// progress.md
let progress = fs.readFileSync('memory-bank/progress.md', 'utf8');
const entry = `
## 2026-10-02 — Explore Your Luck Interaction

- Implemented an interactive transparent overlay over the baked-in "Explore your luck" arrows in the static hero PNG (\`homepage-hero-lucky-pick-canada.png\`).
- Connected the overlay to an immediate smooth-scroll to the Lucky Meter.
- Included a lightweight 1.25s CSS animation bursting maple leaves (using the existing logo asset \`BackgroundEraser_20260724_163638777.png\`) and gold confetti.
- Adhered strictly to \`prefers-reduced-motion\` to disable animation when necessary while retaining scroll interaction.
- Handled DOM node cleanup safely after animation sequence.
`;

progress = progress.replace('# Progress\n', '# Progress\n' + entry);
fs.writeFileSync('memory-bank/progress.md', progress);
console.log('Updated memory bank.');
