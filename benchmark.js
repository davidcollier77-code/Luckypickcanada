const { performance } = require('perf_hooks');

const start1 = performance.now();
for (let i = 0; i < 1000; i++) {
  const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * 1920,
    y: Math.random() * 1080,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random(),
    speed: Math.random() * 0.02 + 0.005,
  }));
}
const end1 = performance.now();

console.log(`Original: ${end1 - start1} ms for 1000 iterations`);

const STATIC_STARS = Array.from({ length: 150 }, () => ({
  xRel: Math.random(),
  yRel: Math.random(),
  radius: Math.random() * 1.5 + 0.5,
  alpha: Math.random(),
  speed: Math.random() * 0.02 + 0.005,
}));

const start2 = performance.now();
for (let i = 0; i < 1000; i++) {
  const stars = STATIC_STARS.map(star => ({
    x: star.xRel * 1920,
    y: star.yRel * 1080,
    radius: star.radius,
    alpha: star.alpha,
    speed: star.speed,
  }));
}
const end2 = performance.now();
console.log(`With mapping: ${end2 - start2} ms for 1000 iterations`);
