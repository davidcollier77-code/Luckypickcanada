const fs = require('fs');
const content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');
const lines = content.split('\n');
let inStrike = false;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('// Strike / Plasma / Lightning')) inStrike = true;
  if (inStrike) console.log(`${i+1}: ${lines[i]}`);
  if (inStrike && lines[i].includes('// Calculate bolt path')) {
    for (let j=1; j<30; j++) console.log(`${i+1+j}: ${lines[i+j]}`);
    break;
  }
}
