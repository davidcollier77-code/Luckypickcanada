const fs = require('fs');
let code = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

const search = `    // --- FRAMER MOTION CHOREOGRAPHY ---
    const sequence = [];

    // Initial state
    sequence.push([cardRef.current, { y: 0, scale: 1, rotateZ: 0, opacity: 0, filter: "brightness(0)" }, { duration: 0.1 }]);
    sequence.push([cardRef.current, { y: -10 }, { at: "<", duration: 1.5, ease: 'easeOut' }]);`;

const replace = `    // --- FRAMER MOTION CHOREOGRAPHY ---
    const sequence = [];

    // Defensive initialization to prevent Flash of Fully-Formed Card
    // Ensure the browser synchronously hides the element before the next paint
    if (cardRef.current) {
      cardRef.current.style.opacity = '0';
      cardRef.current.style.filter = 'brightness(0)';
    }

    // Initial state (duration: 0.001 to prevent tweening from visible state)
    sequence.push([cardRef.current, { y: 0, scale: 1, rotateZ: 0, opacity: [0, 0], filter: ["brightness(0)", "brightness(0)"] }, { duration: 0.001 }]);
    sequence.push([cardRef.current, { y: -10 }, { at: "<", duration: 1.5, ease: 'easeOut' }]);`;

// Verify the expected source block exists before patching
if (!code.includes(search)) {
  console.error('ERROR: Expected source block not found in app/lucky-card-reveal.js');
  console.error('The file may have already been patched or modified.');
  process.exit(1);
}

code = code.replace(search, replace);
fs.writeFileSync('app/lucky-card-reveal.js', code);
