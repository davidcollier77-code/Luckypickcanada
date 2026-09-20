const fs = require('fs');
let lines = fs.readFileSync('app/lucky-card-reveal.js', 'utf8').split('\n');

// Find and replace logic for timing

// `const flipAt = finalStrike + 0.1;` appears twice:
// 1. Line 157
// 2. Line 535
let replaced157 = false;
let replaced535 = false;

for (let i = 0; i < lines.length; i++) {
    if (!replaced157 && lines[i].includes('const flipAt = finalStrike + 0.1;') && i < 300) {
        lines[i] = lines[i].replace('0.1', '0.8');
        replaced157 = true;
    }
    else if (!replaced535 && lines[i].includes('const flipAt = finalStrike + 0.1;') && i > 500) {
        lines[i] = lines[i].replace('0.1', '0.8');
        replaced535 = true;
    }
}

console.log("Replaced 157:", replaced157);
console.log("Replaced 535:", replaced535);

fs.writeFileSync('app/lucky-card-reveal.js', lines.join('\n'), 'utf8');
