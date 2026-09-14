const fs = require('fs');
const content = fs.readFileSync('memory-bank/activeContext.md', 'utf8');
const newContent = content.replace(
  '## Current Status',
  '## Current Status\n- Shifted Daily Resonance container layout downward to restore background/stairs visibility.'
);
fs.writeFileSync('memory-bank/activeContext.md', newContent);
