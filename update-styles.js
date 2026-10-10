const fs = require('fs');
const path = require('path');

const jsFile = 'app/lucky-map-of-canada/lucky-map-of-canada.js';
const cssFile = 'themes/default/map.css';

let jsContent = fs.readFileSync(jsFile, 'utf8');

// 1. Primary Action Buttons (Share / View Lucky Stories)
// These buttons currently have extensive inline styles:
// style={{ color: '#06110d', textDecoration: 'none', fontWeight: 950, padding: '0.85rem 1.1rem', borderRadius: 999, background: 'linear-gradient(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%)', border: '1px solid rgba(255, 242, 180, 0.86)' }}
// We'll replace this with a class `map-primary-action` (while keeping `story-link` for hover effects).

jsContent = jsContent.replace(
  /style=\{\{\s*color:\s*'#06110d',\s*textDecoration:\s*'none',\s*fontWeight:\s*950,\s*padding:\s*'0\.85rem 1\.1rem',\s*borderRadius:\s*999,\s*background:\s*'linear-gradient\(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%\)',\s*border:\s*'1px solid rgba\(255, 242, 180, 0\.86\)'\s*\}\}/g,
  'className="story-link map-primary-action"'
);

jsContent = jsContent.replace(
  /style=\{\{\s*color:\s*'#06110d',\s*fontWeight:\s*950,\s*padding:\s*'0\.85rem 1\.1rem',\s*borderRadius:\s*999,\s*background:\s*'linear-gradient\(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%\)',\s*border:\s*'1px solid rgba\(255, 242, 180, 0\.86\)',\s*cursor:\s*'pointer'\s*\}\}/g,
  'className="story-link map-primary-action"'
);

// Share this story inside the card:
jsContent = jsContent.replace(
  /className="story-link" style=\{\{\s*color:\s*'#06110d',\s*fontWeight:\s*950,\s*padding:\s*'0\.65rem 0\.9rem',\s*borderRadius:\s*999,\s*background:\s*'linear-gradient\(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%\)',\s*border:\s*'1px solid rgba\(255, 242, 180, 0\.86\)',\s*cursor:\s*'pointer'\s*\}\}/g,
  'className="story-link map-primary-action map-primary-action--small"'
);


// 2. Map Story Card
// Currently: style={{ padding: '1rem', borderRadius: 22, border: selectedStory?.id === story.id ? '1px solid rgba(250,204,21,0.72)' : '1px solid rgba(255,235,160,0.24)', background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(41,148,107,0.11))' }}
// We'll move the static parts to CSS and keep the dynamic border in inline styles, OR better, use a class `is-selected` for the dynamic part.

jsContent = jsContent.replace(
  /className="map-story-card" style=\{\{\s*padding:\s*'1rem',\s*borderRadius:\s*22,\s*border:\s*selectedStory\?\.id === story\.id \? '1px solid rgba\(250,204,21,0\.72\)' : '1px solid rgba\(255,235,160,0\.24\)',\s*background:\s*'linear-gradient\(145deg, rgba\(255,255,255,0\.1\), rgba\(41,148,107,0\.11\)\)'\s*\}\}/g,
  'className={`map-story-card ${selectedStory?.id === story.id ? \'is-selected\' : \'\'}`}'
);

// 3. Province Selection Card
// Currently: style={{ textAlign: 'left', padding: '0.9rem', borderRadius: 18, border: selectedProvince === province.code ? '1px solid rgba(250,204,21,0.72)' : '1px solid rgba(255,235,160,0.24)', color: '#fff7d6', background: selectedProvince === province.code ? 'linear-gradient(135deg, rgba(244,195,70,0.35), rgba(35,140,101,0.25))' : 'rgba(255,255,255,0.055)', cursor: 'pointer' }}

jsContent = jsContent.replace(
  /className="province-select-card map-province-card" onClick=\{\(\) => selectProvince\(province\.code\)\} style=\{\{\s*textAlign:\s*'left',\s*padding:\s*'0\.9rem',\s*borderRadius:\s*18,\s*border:\s*selectedProvince === province\.code \? '1px solid rgba\(250,204,21,0\.72\)' : '1px solid rgba\(255,235,160,0\.24\)',\s*color:\s*'#fff7d6',\s*background:\s*selectedProvince === province\.code \? 'linear-gradient\(135deg, rgba\(244,195,70,0\.35\), rgba\(35,140,101,0\.25\)\)' : 'rgba\(255,255,255,0\.055\)',\s*cursor:\s*'pointer'\s*\}\}/g,
  'className={`province-select-card map-province-card ${selectedProvince === province.code ? \'is-selected\' : \'\'}`} onClick={() => selectProvince(province.code)}'
);

// 4. Recent Activity Card
// Currently: style={{ display: 'grid', gap: '0.35rem', padding: '0.8rem', border: '1px solid rgba(255,235,160,0.24)', borderRadius: 16, color: '#fff7d6', background: 'rgba(255,255,255,0.055)', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}

jsContent = jsContent.replace(
  /onClick=\{\(\) => openStory\(story\)\} style=\{\{\s*display:\s*'grid',\s*gap:\s*'0\.35rem',\s*padding:\s*'0\.8rem',\s*border:\s*'1px solid rgba\(255,235,160,0\.24\)',\s*borderRadius:\s*16,\s*color:\s*'#fff7d6',\s*background:\s*'rgba\(255,255,255,0\.055\)',\s*cursor:\s*'pointer',\s*font:\s*'inherit',\s*textAlign:\s*'left'\s*\}\}/g,
  'onClick={() => openStory(story)} className="map-activity-card"'
);

fs.writeFileSync(jsFile, jsContent, 'utf8');
console.log('Updated lucky-map-of-canada.js');

// Now update the CSS
let cssContent = fs.readFileSync(cssFile, 'utf8');

const cssToAdd = `
/* --- Extracted Inline Styles (Visual Polish) --- */

.map-primary-action {
  color: #06110d;
  font-weight: 950;
  padding: 0.85rem 1.1rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%);
  border: 1px solid rgba(255, 242, 180, 0.86);
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.map-primary-action--small {
  padding: 0.65rem 0.9rem;
}

.map-story-card {
  padding: 1rem;
  border-radius: 22px;
  border: 1px solid rgba(255, 235, 160, 0.24);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(41, 148, 107, 0.11));
  box-shadow: inset 0 1px rgba(255, 255, 255, .08), 0 10px 24px rgba(0, 0, 0, .16);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.map-story-card.is-selected {
  border-color: rgba(250, 204, 21, 0.72);
}

.map-province-card {
  text-align: left;
  padding: 0.9rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 235, 160, 0.24);
  color: #fff7d6;
  background: rgba(255, 255, 255, 0.055);
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.map-province-card.is-selected {
  border-color: rgba(250, 204, 21, 0.72);
  background: linear-gradient(135deg, rgba(244, 195, 70, 0.35), rgba(35, 140, 101, 0.25));
}

.map-activity-card {
  display: grid;
  gap: 0.35rem;
  padding: 0.8rem;
  border: 1px solid rgba(255, 235, 160, 0.24);
  border-radius: 16px;
  color: #fff7d6;
  background: rgba(255, 255, 255, 0.055);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}
`;

// Remove the old incomplete definitions before appending new ones
cssContent = cssContent.replace(/\.map-story-card\s*\{[^}]*\}/, '');
cssContent = cssContent.replace(/\.map-activity-card:hover,\s*\.map-activity-card:focus-visible,\s*\.map-province-card:hover,\s*\.map-province-card:focus-visible\s*\{[^}]*\}/, `
.map-activity-card:hover, .map-activity-card:focus-visible, .map-province-card:hover, .map-province-card:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(250,204,21,0.7) !important;
  outline: none;
}
`);
cssContent = cssContent.replace(/\.map-activity-card,\s*\.map-province-card\s*\{[^}]*\}/, '');

fs.writeFileSync(cssFile, cssContent + cssToAdd, 'utf8');
console.log('Updated map.css');
