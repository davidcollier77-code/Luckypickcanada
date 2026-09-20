const fs = require('fs');

let content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

const oldCore = `        ctx.stroke();

        // Inner Core
        ctx.lineWidth = isFinal ? 15 : 6 + (idx * 1.5);
        ctx.strokeStyle = \`rgba(255, 255, 255, \${0.9 * opacity})\`;
        ctx.stroke();`;

const newCore = `        ctx.stroke();

        // Inner Bloom
        if (isFinal) {
           ctx.lineWidth = 40;
           ctx.strokeStyle = \`rgba(\${beamColor}, \${0.8 * opacity})\`;
           ctx.stroke();
        }

        // Inner Core
        ctx.lineWidth = isFinal ? 25 : 6 + (idx * 1.5);
        ctx.strokeStyle = \`rgba(255, 255, 255, \${0.9 * opacity})\`;
        ctx.stroke();`;

content = content.replace(oldCore, newCore);

fs.writeFileSync('app/lucky-card-reveal.js', content, 'utf8');
