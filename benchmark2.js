const { performance } = require('perf_hooks');

function bench() {
  const ITERS = 10000;

  // Baseline
  const start1 = performance.now();
  for (let i = 0; i < ITERS; i++) {
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    }));
  }
  const end1 = performance.now();

  // Optimized: static seeds outside
  const STAR_SEEDS = Array.from({ length: 150 }, () => ({
    xRel: Math.random(),
    yRel: Math.random(),
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random(),
    speed: Math.random() * 0.02 + 0.005,
  }));

  const start2 = performance.now();
  for (let i = 0; i < ITERS; i++) {
    const stars = STAR_SEEDS.map(seed => ({
      x: seed.xRel * 1920,
      y: seed.yRel * 1080,
      radius: seed.radius,
      alpha: seed.alpha,
      speed: seed.speed,
    }));
  }
  const end2 = performance.now();

  console.log(`Baseline: ${end1 - start1} ms`);
  console.log(`Optimized: ${end2 - start2} ms`);
}

bench();
