const fs = require('fs');
const content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');
const lines = content.split('\n');
let inDraw = false;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('// Draw Aurora / Energy Source at top')) inDraw = true;
  if (inDraw) console.log(`${i+1}: ${lines[i]}`);
  if (inDraw && lines[i].includes('schedule.forEach')) break;
}
