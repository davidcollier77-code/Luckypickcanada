const fs = require('fs');
const content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');
const lines = content.split('\n');
let inTierColors = false;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('const tierColors = {')) inTierColors = true;
  if (inTierColors) console.log(`${i+1}: ${lines[i]}`);
  if (inTierColors && lines[i].includes('};')) break;
}
