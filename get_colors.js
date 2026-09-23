const fs = require('fs');
const content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('const colors = {'));
const end = lines.findIndex((l, i) => i > start && l.includes('};'));
console.log(lines.slice(start, end + 1).join('\n'));
