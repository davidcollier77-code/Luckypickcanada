const fs = require('fs');

const cssFile = 'public/themes/default/homepage.css';
let css = fs.readFileSync(cssFile, 'utf8');

// List of completely unused classes that we know for sure are dead code artifacts
const unusedClasses = [
    'lucky-blackjack', 'blackjack-table', 'blackjack-card-front-face', 'blackjack-card-back-face'
];

for (const cls of unusedClasses) {
    const regex = new RegExp(`^\\.${cls}(:[a-zA-Z0-9_-]+)*\\s*\\{[^}]+\\}`, 'gm');
    css = css.replace(regex, '');
}
fs.writeFileSync(cssFile, css);
