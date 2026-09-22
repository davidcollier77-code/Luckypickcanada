const fs = require('fs');
let css = fs.readFileSync('themes/default/homepage.css', 'utf8');

css = css.replace(
  /\s*\.lucky-moment-reveal-button,\n\.lucky-card-share-button \{/g,
  `\n.lucky-moment-reveal-button {`
);

css = css.replace(
  /\s*\.lucky-moment-reveal-button:hover, \.lucky-moment-reveal-button:focus-visible,\n\.lucky-card-share-button:hover, \.lucky-card-share-button:focus-visible \{/g,
  `\n.lucky-moment-reveal-button:hover, .lucky-moment-reveal-button:focus-visible {`
);

css = css.replace(
  /\s*\.lucky-moment-reveal-button:active,\n\.lucky-card-share-button:active \{/g,
  `\n.lucky-moment-reveal-button:active {`
);

css = css.replace(
  /\.lucky-card-share-button \{[\s\S]*?\}/,
  `.lucky-card-share-button { width: auto; padding: 0.6rem 1.25rem; border-radius: 9999px; color: #020617; background: linear-gradient(to right, #fef08a, #f59e0b); box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); font-weight: 700; font-size: 0.9rem; letter-spacing: 0.05em; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; border: none; }`
);

css = css.replace(
  /\.lucky-card-share-button:hover:not\(:disabled\) \{[\s\S]*?\}/,
  `.lucky-card-share-button:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 0 15px rgba(245, 158, 11, 0.7); background: linear-gradient(to right, #fef08a, #f59e0b, #b45309); }`
);

css = css.replace(
  /\.lucky-card-share-button:disabled \{[\s\S]*?\}/,
  `.lucky-card-share-button:disabled { cursor: wait; opacity: .75; transform: scale(1); }\n.lucky-card-share-button:active:not(:disabled) { transform: scale(0.95); }`
);

fs.writeFileSync('themes/default/homepage.css', css);
console.log('done');
