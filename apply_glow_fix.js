const fs = require('fs');
let code = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

// I missed applying the className change to remove `tier-glow-${selectedCard.tier}` in my earlier JS execution block
code = code.replace(
  "className={`absolute inset-0 rounded-2xl transition-shadow duration-700 ${isRevealed && selectedCard ? \\`tier-glow-\\${selectedCard.tier}\\` : ''}`}",
  "className={`absolute inset-0 rounded-2xl transition-shadow duration-700`}"
);

fs.writeFileSync('app/lucky-card-reveal.js', code);
