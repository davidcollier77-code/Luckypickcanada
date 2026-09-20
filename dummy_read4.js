const fs = require('fs');
const content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');
const lines = content.split('\n');
let inStrike = false;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('// Strike / Plasma / Lightning')) inStrike = true;
  if (inStrike) console.log(`${i+1}: ${lines[i]}`);
  if (inStrike && lines[i].includes('// Calculate bolt path')) {
    console.log(`${i+2}: ${lines[i+1]}`);
    console.log(`${i+3}: ${lines[i+2]}`);
    console.log(`${i+4}: ${lines[i+3]}`);
    console.log(`${i+5}: ${lines[i+4]}`);
    console.log(`${i+6}: ${lines[i+5]}`);
    break;
  }
}
