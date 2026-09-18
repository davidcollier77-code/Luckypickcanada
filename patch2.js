const fs = require('fs');
let code = fs.readFileSync('memory-bank/activeContext.md', 'utf8');

const search = `Focus is currently on monitoring the system and performing routine maintenance.`;
const replace = `Focus is currently on fixing the Lucky Card Reveal initialization timing issue (preventing the card from flashing on screen at the start of generation).`;

if (code.includes(search)) {
    code = code.replace(search, replace);
} else {
    code = code + "\n\nFocus is currently on fixing the Lucky Card Reveal initialization timing issue (preventing the card from flashing on screen at the start of generation).\n";
}

fs.writeFileSync('memory-bank/activeContext.md', code);
