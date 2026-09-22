const fs = require('fs');
let css = fs.readFileSync('themes/default/homepage.css', 'utf8');

// There are two definitions for .lucky-card-share-button in the css file.
// The first is around line 207, which is a one-liner.
// The second is around line 370 in a grouped selector.

// Let's remove the .lucky-card-share-button from the grouped selectors,
// and make a new distinct class block for it that reduces its visual footprint but keeps the golden aesthetic.

// 1. Remove from first grouped selector
css = css.replace(
  /\s*\.lucky-moment-reveal-button,\s*\.lucky-card-share-button\s*\{/,
  `\n.lucky-moment-reveal-button {`
);

// 2. Remove from hover grouped selector
css = css.replace(
  /\s*\.lucky-moment-reveal-button:hover,\s*\.lucky-moment-reveal-button:focus-visible,\s*\.lucky-card-share-button:hover,\s*\.lucky-card-share-button:focus-visible\s*\{/,
  `\n.lucky-moment-reveal-button:hover, .lucky-moment-reveal-button:focus-visible {`
);

// 3. Remove from active grouped selector
css = css.replace(
  /\s*\.lucky-moment-reveal-button:active,\s*\.lucky-card-share-button:active\s*\{/,
  `\n.lucky-moment-reveal-button:active {`
);

// 4. Find the first occurrence (line 207 one-liner) and replace it with our new styling
css = css.replace(
  /\.lucky-card-share-button \{[^}]+\}/,
  `.lucky-card-share-button {
  background: linear-gradient(to right, #fef08a, #f59e0b);
  color: #020617;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.5rem 1.25rem;
  letter-spacing: 0.05em;
  border-radius: 9999px;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  border: none;
  cursor: pointer;
  width: auto;
  min-width: 60%;
}`
);

// Add the new hover/active states near it
css = css.replace(
  /\.lucky-card-share-button:hover:not\(:disabled\) \{[^}]+\}/,
  `.lucky-card-share-button:hover:not(:disabled), .lucky-card-share-button:focus-visible:not(:disabled) {
  background: linear-gradient(to right, #fef08a, #f59e0b, #b45309);
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.7);
  transform: scale(1.02);
}`
);

css = css.replace(
  /\.lucky-card-share-button:disabled \{[^}]+\}/,
  `.lucky-card-share-button:disabled { cursor: wait; opacity: 0.75; transform: scale(1); }
.lucky-card-share-button:active:not(:disabled) { transform: scale(0.98); }`
);

fs.writeFileSync('themes/default/homepage.css', css);
console.log('done');
