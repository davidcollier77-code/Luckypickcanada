const fs = require('fs');

let content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

const oldGlow = `        // Outer glow
        ctx.lineWidth = isFinal ? 50 : 20 + (idx * 4);
        ctx.strokeStyle = \`rgba(\${beamColor}, \${0.3 * opacity})\`;
        ctx.lineCap = 'round';

        // Jagged Lightning / Plasma Path`;

const newGlow = `        // Outer glow
        ctx.lineWidth = isFinal ? 80 : 20 + (idx * 4); // Larger impact convergence
        ctx.strokeStyle = \`rgba(\${beamColor}, \${(isFinal ? 0.6 : 0.3) * opacity})\`;
        ctx.lineCap = 'round';

        // Jagged Lightning / Plasma Path`;

content = content.replace(oldGlow, newGlow);

const oldCore = `        ctx.stroke();

        // Core
        ctx.lineWidth = isFinal ? 15 : 6 + (idx * 2);
        ctx.strokeStyle = \`rgba(255, 255, 255, \${opacity})\`;
        ctx.stroke();

        ctx.restore();`;

const newCore = `        ctx.stroke();

        // Inner Bloom
        if (isFinal) {
           ctx.lineWidth = 40;
           ctx.strokeStyle = \`rgba(\${beamColor}, \${0.8 * opacity})\`;
           ctx.stroke();
        }

        // Core
        ctx.lineWidth = isFinal ? 20 : 6 + (idx * 2);
        ctx.strokeStyle = \`rgba(255, 255, 255, \${opacity})\`;
        ctx.stroke();

        ctx.restore();`;

content = content.replace(oldCore, newCore);

fs.writeFileSync('app/lucky-card-reveal.js', content, 'utf8');
