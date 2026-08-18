const { performance } = require('perf_hooks');

const runs = 100000;
let alpha = 0.5;
let str;

const startString = performance.now();
for (let i = 0; i < runs; i++) {
  str = `rgba(255, 248, 223, ${alpha})`;
}
const endString = performance.now();
console.log(`String interpolation: ${endString - startString}ms`);

// Emulate setting globalAlpha (no string creation)
const startFloat = performance.now();
for (let i = 0; i < runs; i++) {
  let a = alpha;
}
const endFloat = performance.now();
console.log(`Float assignment: ${endFloat - startFloat}ms`);
