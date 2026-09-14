const fs = require('fs');
let content = fs.readFileSync('memory-bank/activeContext.md', 'utf8');
content = content.replace(
  '## Next Steps\n- Submit final report and PR for the Daily Lucky Meter professional cinematic reveal enhancements.',
  '## Next Steps\n- Submit final report and PR for the layout fixes on the Daily Lucky Meter to restore background visibility.'
);
fs.writeFileSync('memory-bank/activeContext.md', content);
