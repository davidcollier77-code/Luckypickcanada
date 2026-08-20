const fs = require('fs');
const filepath = 'app/components/DailyLuckyMeter.js';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(/setDisplayScore\(0\);/, 'setScore(0);');
content = content.replace(/setDisplayScore\(stored\.lastScore\);/, 'setScore(stored.lastScore);');

fs.writeFileSync(filepath, content);
console.log('Fixed');
