const fs = require('fs');

let content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

const oldBurst = `          // Flash Burst
          fgCtx.beginPath();
          const radius = isFinal ? cardW * 1.5 : cardW * 0.8;
          fgCtx.arc(strikeTarget.x, strikeTarget.y, radius, 0, Math.PI * 2);
          const flashGrad = fgCtx.createRadialGradient(strikeTarget.x, strikeTarget.y, 0, strikeTarget.x, strikeTarget.y, radius);
          flashGrad.addColorStop(0, \`rgba(255, 255, 255, \${flashOp})\`);
          flashGrad.addColorStop(0.3, \`rgba(\${beamColor}, \${flashOp * 0.7})\`);
          flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
          fgCtx.fillStyle = flashGrad;
          fgCtx.fill();

          // Impact Particles/Sparks
          const numParticles = isFinal ? 30 : 12;`;

const newBurst = `          // Flash Burst
          fgCtx.beginPath();
          const radius = isFinal ? cardW * 2.5 : cardW * 0.8; // Increased final impact radius
          fgCtx.arc(strikeTarget.x, strikeTarget.y, radius, 0, Math.PI * 2);
          const flashGrad = fgCtx.createRadialGradient(strikeTarget.x, strikeTarget.y, 0, strikeTarget.x, strikeTarget.y, radius);
          flashGrad.addColorStop(0, \`rgba(255, 255, 255, \${flashOp})\`);
          flashGrad.addColorStop(0.3, \`rgba(\${beamColor}, \${flashOp * 0.7})\`);
          flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
          fgCtx.fillStyle = flashGrad;
          fgCtx.fill();

          // Impact Particles/Sparks
          const numParticles = isFinal ? 60 : 12; // Double the particles on final strike`;

content = content.replace(oldBurst, newBurst);

fs.writeFileSync('app/lucky-card-reveal.js', content, 'utf8');
