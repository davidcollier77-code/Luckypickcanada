const fs = require('fs');

const cssFile = 'public/themes/default/homepage.css';
let css = fs.readFileSync(cssFile, 'utf8');

const unusedClasses = [
    'reference-heading-line', 'experience-brand', 'tip-jar-card', 'tip-jar-kicker',
    'province-map-grid', 'province-map-marker', 'text-container', 'lucky-blackjack',
    'reference-hero-copy', 'reference-hero-title', 'gold-text', 'reference-card',
    'blackjack-table', 'blackjack-card-front-face', 'blackjack-card-back-face',
    'hero-container', 'hero-nav', 'hero-content', 'hero-brand', 'hero-nav-link',
    'hero-text-panel', 'hero-kicker', 'gold-3d', 'hero-copy', 'button-wrapper', 'cta-glow',
    'lucky-meter-info-box', 'navigation-logo', 'homepage-hero-artwork', 'homepage-text-link',
    'homepage-offer-action', 'homepage-map-card', 'homepage-map-cta', 'homepage-footer',
    'flip-card-wrapper', 'lucky-moment-card', 'lucky-moment-card-face', 'lucky-moment-card-back',
    'lucky-moment-card-image'
];

for (const cls of unusedClasses) {
    // Only target rules that define ONLY this class, or this class with pseudo selectors
    // This is safer than replacing the exact string anywhere
    const regex = new RegExp(`^\\.${cls}(:[a-zA-Z0-9_-]+)*\\s*\\{[^}]+\\}`, 'gm');
    css = css.replace(regex, '');
}

fs.writeFileSync(cssFile, css);

const cssFile2 = 'public/themes/default/default.css';
let css2 = fs.readFileSync(cssFile2, 'utf8');
for (const cls of unusedClasses) {
    const regex = new RegExp(`^\\.${cls}(:[a-zA-Z0-9_-]+)*\\s*\\{[^}]+\\}`, 'gm');
    css2 = css2.replace(regex, '');
}
fs.writeFileSync(cssFile2, css2);
