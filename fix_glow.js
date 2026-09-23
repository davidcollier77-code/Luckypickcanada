const fs = require('fs');
let code = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

code = code.replace(
  "className={`absolute inset-0 rounded-2xl transition-shadow duration-700 ${isRevealed && selectedCard ? `tier-glow-${selectedCard.tier}` : ''}`}",
  "className={`absolute inset-0 rounded-2xl transition-shadow duration-700`}"
);

fs.writeFileSync('app/lucky-card-reveal.js', code);
