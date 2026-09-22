const fs = require('fs');
let css = fs.readFileSync('themes/default/homepage.css', 'utf8');

css = css.replace(
  /\.lucky-moment-reveal-button,\n\.lucky-card-share-button \{/g,
  `.lucky-moment-reveal-button {`
);

css = css.replace(
  /\.lucky-moment-reveal-button:hover, \.lucky-moment-reveal-button:focus-visible,\n\.lucky-card-share-button:hover, \.lucky-card-share-button:focus-visible \{/g,
  `.lucky-moment-reveal-button:hover, .lucky-moment-reveal-button:focus-visible {`
);

css = css.replace(
  /\.lucky-moment-reveal-button:active,\n\.lucky-card-share-button:active \{/g,
  `.lucky-moment-reveal-button:active {`
);

fs.writeFileSync('themes/default/homepage.css', css);
console.log('done');
