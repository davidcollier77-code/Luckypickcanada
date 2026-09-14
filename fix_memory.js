const fs = require('fs');

let activeContext = fs.readFileSync('memory-bank/activeContext.md', 'utf-8');
activeContext = activeContext.replace(
`- Submit PR for Lucky Meter photographic background polish.

## Current Status
- Replaced the procedural Lucky Meter background with a realistic Milky Way photograph sourced via CLI from Wikimedia Commons.
- Refined the Aurora overlay in \`Aurora.tsx\` to use subtle, atmospheric gradients (green, teal, cyan, violet) and eliminated the oversized wave/oval effects.
- Maintained all existing Lucky Meter functionality (timers, visits, persistence, tier calculations, quote engine, sound, interactive reveal fireworks).

- Submit final report and PR for the cinematic fireworks enhancement.`,
`
- Submit final report and PR for the cinematic fireworks enhancement.
- Submit PR for Lucky Meter photographic background polish.
`
);
fs.writeFileSync('memory-bank/activeContext.md', activeContext);

let currentStatusContent = `
- Replaced the procedural Lucky Meter background with a realistic Milky Way photograph sourced via CLI from Wikimedia Commons.
- Refined the Aurora overlay in \`Aurora.tsx\` to use subtle, atmospheric gradients (green, teal, cyan, violet) and eliminated the oversized wave/oval effects.
- Maintained all existing Lucky Meter functionality (timers, visits, persistence, tier calculations, quote engine, sound, interactive reveal fireworks).
`;

let content = fs.readFileSync('memory-bank/activeContext.md', 'utf-8');
content = content.replace('## Current Status', '## Current Status\n' + currentStatusContent.trim());
fs.writeFileSync('memory-bank/activeContext.md', content);
