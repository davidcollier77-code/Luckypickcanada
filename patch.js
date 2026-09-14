const fs = require('fs');

let content = fs.readFileSync('components/DailyResonance.tsx', 'utf8');

const search = `    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    }));`;

const replace = `    // PERFORMANCE OPTIMIZATION (Bolt ⚡):
    // Moved star initialization outside of the render/resize cycle to prevent
    // recreating the array and objects on every mount. We only initialize if empty.
    if (!starsRef.current || starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 150 }, () => ({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
      }));
    }
    const stars = starsRef.current;`;

content = content.replace(search, replace);

// Now we need to add starsRef to the component
const refSearch = `  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgRequestRef = useRef<number>(0);`;

const refReplace = `  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgRequestRef = useRef<number>(0);
  const starsRef = useRef<Array<{x: number, y: number, radius: number, alpha: number, speed: number}>>([]);`;

content = content.replace(refSearch, refReplace);

fs.writeFileSync('components/DailyResonance.tsx', content);
console.log('Patched');
