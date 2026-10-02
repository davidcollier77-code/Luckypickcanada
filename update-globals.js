const fs = require('fs');
const path = 'app/globals.css';
let content = fs.readFileSync(path, 'utf8');

const newCSS = `
@keyframes magic-burst {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(calc(-50% + (var(--tx) * 0.3)), calc(-50% + (var(--ty) * 0.3))) scale(calc(var(--s) * 1.2)) rotate(calc(var(--r) * 0.3));
  }
  100% {
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(var(--s)) rotate(var(--r));
    opacity: 0;
  }
}

.animate-magic-burst {
  animation: magic-burst ease-out forwards;
}
`;

if (!content.includes('@keyframes magic-burst')) {
  fs.writeFileSync(path, content + newCSS);
  console.log('Added CSS to globals.css');
} else {
  console.log('CSS already exists');
}
