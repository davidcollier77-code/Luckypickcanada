const fs = require('fs');
const lines = fs.readFileSync('app/lucky-card-reveal.js', 'utf8').split('\n');
const printRange = (start, end) => {
    for (let i = start - 1; i < end && i < lines.length; i++) {
        console.log(`${i+1}: ${lines[i]}`);
    }
}
printRange(380, 410);
