const fs = require('fs');
let code = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

// The instructions say: "No after-ring. No persistent halo. No lingering grid. No leftover sparks."
// The card currently receives a class: `tier-glow-${selectedCard.tier}` which adds a permanent box-shadow (halo).
// Let's remove the persistent tier glow from the card front since the user explicitly says "No persistent halo... No unexplained glow."

code = code.replace(
  "className={`absolute inset-0 rounded-2xl transition-shadow duration-700 ${isRevealed && selectedCard ? \\`tier-glow-\\${selectedCard.tier}\\` : ''}`}",
  "className={`absolute inset-0 rounded-2xl transition-shadow duration-700`}"
);

// We need to make sure spark Color for Premium is not blue! But the user says:
// "Standard: warm bronze/gold metallic energy."
// "Premium: pewter/silver metallic energy. Do not turn Premium blue."
// "Flagship: rich gold/antique-gold metallic energy."
// Currently the "superheated" sparks use this logic:
/*
                 let sparkColor = `rgba(${hitColor}, ${sparkAlpha})`;
                 if (Math.random() > 0.5) {
                    const r = 255;
                    const g = 150 + Math.floor(Math.random() * 50);
                    const b = 0;
                    sparkColor = `rgba(${r}, ${g}, ${b}, ${sparkAlpha})`;
                 }
*/
// The above makes all sparks have an orange/gold alternative color.
// For premium (pewter/silver), we should maybe avoid orange sparks and just use brighter silver/white, or maybe keep orange as "superheated".
// But let's look closer: "The burnout uses the same animation structure and timing for all three tiers. Only the metallic color family changes."
// We should parameterize the superheated color by tier, or just use a brighter version of the tier color!

fs.writeFileSync('app/lucky-card-reveal.js', code);
