const fs = require('fs');

let css = fs.readFileSync('themes/default/homepage.css', 'utf8');
css = css.replace(
  /\.lucky-card-share-button \{[\s\S]*?\n\}/,
  `.lucky-card-share-button {
  background: linear-gradient(to right, #fde68a, #fbbf24, #d97706);
  color: #020617;
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0.5rem 1.25rem;
  letter-spacing: 0.05em;
  border-radius: 9999px;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
  transition: transform 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease;
  border: none;
}`
);

fs.writeFileSync('themes/default/homepage.css', css);
console.log('done');
