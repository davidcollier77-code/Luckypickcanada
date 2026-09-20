const fs = require('fs');
let lines = fs.readFileSync('app/lucky-card-reveal.js', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const flipAt = finalStrike + 0.1;')) {
        lines[i] = lines[i].replace('const flipAt = finalStrike + 0.1;', 'const flipAt = finalStrike + 0.8;');
    }
}
fs.writeFileSync('app/lucky-card-reveal.js', lines.join('\n'), 'utf8');
