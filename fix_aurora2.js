const fs = require('fs');

let content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

// There's a duplicate `ctx.restore();` because of my previous replace.
content = content.replace(`      ctx.restore();\n\n      ctx.restore();`, `      ctx.restore();`);

fs.writeFileSync('app/lucky-card-reveal.js', content, 'utf8');
