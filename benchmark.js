const { performance } = require('perf_hooks');

// Mock structure
const branch = {
    segments: [],
    branches: [],
    thickness: 2
};

for (let i = 0; i < 50; i++) {
    branch.segments.push({ x: Math.random() * 100, y: Math.random() * 100 });
}
for (let i = 0; i < 3; i++) {
    const subBranch = { segments: [], branches: [], thickness: 1 };
    for (let j = 0; j < 20; j++) {
        subBranch.segments.push({ x: Math.random() * 100, y: Math.random() * 100 });
    }
    branch.branches.push(subBranch);
}

const ctx = {
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {}
};

function drawBranchForEach(branch, alpha, isGlow) {
    ctx.beginPath();
    ctx.lineWidth = isGlow ? branch.thickness * (branch.thickness > 3 ? 6 : 4) : branch.thickness;
    ctx.strokeStyle = isGlow ? '#c864ff' : '#ffffff';
    ctx.globalAlpha = isGlow ? alpha * 0.7 : alpha;
    ctx.lineJoin = 'miter';
    branch.segments.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x | 0, p.y | 0) : ctx.lineTo(p.x | 0, p.y | 0));
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    branch.branches.forEach(b => drawBranchForEach(b, alpha, isGlow));
}

function drawBranchFor(branch, alpha, isGlow) {
    ctx.beginPath();
    ctx.lineWidth = isGlow ? branch.thickness * (branch.thickness > 3 ? 6 : 4) : branch.thickness;
    ctx.strokeStyle = isGlow ? '#c864ff' : '#ffffff';
    ctx.globalAlpha = isGlow ? alpha * 0.7 : alpha;
    ctx.lineJoin = 'miter';

    if (branch.segments.length > 0) {
        ctx.moveTo(branch.segments[0].x | 0, branch.segments[0].y | 0);
        for (let idx = 1; idx < branch.segments.length; idx++) {
            ctx.lineTo(branch.segments[idx].x | 0, branch.segments[idx].y | 0);
        }
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    for (let i = 0; i < branch.branches.length; i++) {
        drawBranchFor(branch.branches[i], alpha, isGlow);
    }
}

const ITERATIONS = 100000;
const ROUNDS = 5;

// Warmup
for (let i = 0; i < 10000; i++) {
    drawBranchForEach(branch, 1, false);
    drawBranchFor(branch, 1, false);
}

// Alternate execution order across rounds to minimise JIT and branch-predictor bias
let totalForEach = 0;
let totalFor = 0;

for (let round = 0; round < ROUNDS; round++) {
    if (round % 2 === 0) {
        // forEach first
        const s1 = performance.now();
        for (let i = 0; i < ITERATIONS; i++) drawBranchForEach(branch, 1, false);
        totalForEach += performance.now() - s1;

        const s2 = performance.now();
        for (let i = 0; i < ITERATIONS; i++) drawBranchFor(branch, 1, false);
        totalFor += performance.now() - s2;
    } else {
        // for first
        const s1 = performance.now();
        for (let i = 0; i < ITERATIONS; i++) drawBranchFor(branch, 1, false);
        totalFor += performance.now() - s1;

        const s2 = performance.now();
        for (let i = 0; i < ITERATIONS; i++) drawBranchForEach(branch, 1, false);
        totalForEach += performance.now() - s2;
    }
}

const avgForEach = totalForEach / ROUNDS;
const avgFor = totalFor / ROUNDS;
console.log(`forEach avg (${ROUNDS} rounds): ${avgForEach.toFixed(2)} ms`);
console.log(`for avg    (${ROUNDS} rounds): ${avgFor.toFixed(2)} ms`);
console.log(`Improvement: ${(((avgForEach - avgFor) / avgForEach) * 100).toFixed(2)}%`);
