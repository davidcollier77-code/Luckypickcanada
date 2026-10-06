const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf8');
if (!css.includes('.suggestion-btn-glow')) {
  const glowCss = `
@keyframes suggestionBtnGlow {
  0%, 100% {
    box-shadow: 0 4px 10px rgba(0,0,0,0.3), inset 0 2px 2px rgba(255,255,255,0.5), 0 0 15px rgba(234, 190, 82, 0.4);
  }
  50% {
    box-shadow: 0 4px 10px rgba(0,0,0,0.3), inset 0 2px 2px rgba(255,255,255,0.5), 0 0 25px rgba(234, 190, 82, 0.8);
  }
}

.suggestion-btn-glow {
  animation: suggestionBtnGlow 3s ease-in-out infinite;
}
`;
  css += glowCss;
  fs.writeFileSync('app/globals.css', css);
}
