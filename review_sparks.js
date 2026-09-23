const fs = require('fs');
let code = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

// I need to change `colors` object to strictly match metallic color families.
code = code.replace(
  "standard: '217, 119, 6', // Bronze/Copper",
  "standard: '212, 136, 70', // Warm Bronze/Gold"
);
code = code.replace(
  "premium: '156, 163, 175', // Pewter/Silver",
  "premium: '180, 185, 195', // Pewter/Silver"
);
code = code.replace(
  "flagship: '234, 179, 8'",
  "flagship: '218, 165, 32', // Rich Gold/Antique-Gold"
);

// We need to change the spark colors to be based on the tier.
// Replace the sparkColor logic:
//                  // Mix tier-colored sparks with superheated sparks
//                  let sparkColor = `rgba(${hitColor}, ${sparkAlpha})`;
//                  if (Math.random() > 0.5) {
//                     const r = 255;
//                     const g = 150 + Math.floor(Math.random() * 50);
//                     const b = 0;
//                     sparkColor = `rgba(${r}, ${g}, ${b}, ${sparkAlpha})`;
//                  }

const sparkReplace = `                 // Mix tier-colored sparks with superheated metallic variations
                 let sparkColor = \`rgba(\${hitColor}, \${sparkAlpha})\`;
                 if (Math.random() > 0.5) {
                    if (tier === 'premium') {
                       // Superheated silver/white for premium
                       sparkColor = \`rgba(230, 235, 245, \${sparkAlpha})\`;
                    } else if (tier === 'flagship') {
                       // Superheated bright gold for flagship
                       sparkColor = \`rgba(255, 215, 0, \${sparkAlpha})\`;
                    } else {
                       // Superheated warm bronze/orange for standard
                       sparkColor = \`rgba(255, 180, 80, \${sparkAlpha})\`;
                    }
                 }`;

code = code.replace(
  /                 \/\/ Mix tier-colored sparks with superheated sparks[\s\S]*?sparkColor = `rgba\(\${r}, \${g}, \${b}, \${sparkAlpha}\)`;\n                 \}/,
  sparkReplace
);

fs.writeFileSync('app/lucky-card-reveal.js', code);
