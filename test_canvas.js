const assert = require('assert');

// Simple mockup to check semantic output correctness
const output = [];
const ctx = {
    beginPath: () => output.push('beginPath'),
    moveTo: (x, y) => output.push(`moveTo ${x} ${y}`),
    lineTo: (x, y) => output.push(`lineTo ${x} ${y}`),
    stroke: () => output.push('stroke'),
    lineWidth: 1,
    strokeStyle: '',
    globalAlpha: 1,
    lineJoin: ''
};

function drawBranch(branch, alpha, isGlow) {
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
    for (let i = 0; i < branch.branches.length; i++) drawBranch(branch.branches[i], alpha, isGlow);
}

const mockBranch = {
    thickness: 2,
    segments: [{ x: 10.5, y: 10.5 }, { x: 20.2, y: 20.8 }],
    branches: [
        {
            thickness: 1,
            segments: [{ x: 20.2, y: 20.8 }, { x: 30.1, y: 30.1 }],
            branches: []
        }
    ]
};

drawBranch(mockBranch, 1, false);

assert.deepStrictEqual(output, [
  'beginPath',
  'moveTo 10 10',
  'lineTo 20 20',
  'stroke',
  'beginPath',
  'moveTo 20 20',
  'lineTo 30 30',
  'stroke'
]);
console.log("Semantic check passed!");
