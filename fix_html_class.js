const fs = require('fs');

let content = fs.readFileSync('app/layout.js', 'utf8');

content = content.replace(
  /<html lang="en-CA" className=\{`m-0 p-0 \$\{inter\.variable\} \$\{manrope\.variable\} \$\{playfair\.variable\} \$\{cinzel\.variable\}`\}\n\s*>/,
  '<html lang="en-CA" className={`m-0 p-0 ${inter.variable} ${manrope.variable} ${playfair.variable} ${cinzel.variable}`}>'
);

fs.writeFileSync('app/layout.js', content);
