const fs = require('fs');
let content = fs.readFileSync('themes/default/map.css', 'utf8');

content = content.replace(
  /\.story-modal {[^}]*}/,
  `.story-modal { position: relative; width: min(100%, 500px); padding: clamp(1.8rem, 5vw, 2.5rem); border: 1px solid rgba(250, 204, 21, 0.4); border-radius: 24px; color: #fff7d6; box-shadow: 0 24px 60px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.25); background: rgba(10, 15, 25, 0.45); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }`
);

content = content.replace(
  /\.story-modal-backdrop {[^}]*}/,
  `.story-modal-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: safe center; padding: 1rem; background: rgba(4, 10, 16, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); overflow-y: auto; }`
);

fs.writeFileSync('themes/default/map.css', content);
