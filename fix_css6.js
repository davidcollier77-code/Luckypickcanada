const fs = require('fs');

const cssFile = 'public/themes/default/homepage.css';
let css = fs.readFileSync(cssFile, 'utf8');

const cssFile2 = 'public/themes/default/default.css';
let css2 = fs.readFileSync(cssFile2, 'utf8');

fs.writeFileSync(cssFile, css);
fs.writeFileSync(cssFile2, css2);
