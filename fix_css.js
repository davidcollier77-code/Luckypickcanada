const fs = require('fs');

let content = fs.readFileSync('app/components/DailyLuckyMeter.tsx', 'utf8');

content = content.replace(
  /    50% \{ opacity: 1; transform: translate\(-50%, -50%\) scale\(1\.3\); background: #ffffff; box-shadow: 0 0 10px #ffffff, 0 0 20px var\(--sec-color\); \}\n    100% \{ opacity: 0\.4; transform: translate\(-50%, -50%\) scale\(0\.9\); box-shadow: none; background: #334155; \}\n  \}/g,
  ""
);

fs.writeFileSync('app/components/DailyLuckyMeter.tsx', content);
