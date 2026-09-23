const fs = require('fs');
let code = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

// Update Premium color from blue to pewter/silver.
code = code.replace(
  "premium: '59, 130, 246',",
  "premium: '156, 163, 175', // Pewter/Silver"
);

fs.writeFileSync('app/lucky-card-reveal.js', code);
