const fs = require('fs');

let content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

const oldAurora = `      const auroraGrad = ctx.createRadialGradient(w/2, sourceY, 0, w/2, sourceY, sourceW);
      const baseColor = tierColors[tier][0];
      auroraGrad.addColorStop(0, \`rgba(\${baseColor}, \${auroraProg * 0.4})\`);
      auroraGrad.addColorStop(0.5, \`rgba(\${baseColor}, \${auroraProg * 0.1})\`);
      auroraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = auroraGrad;
      // Add a slight pulsing/wavy effect
      const wave = Math.sin(elapsed * 2) * 20;
      ctx.fillRect(0, 0, w, sourceY + sourceW + wave);

      // Core energy ball building up
      ctx.beginPath();
      ctx.arc(w/2, sourceY, 30 + Math.sin(elapsed * 5) * 10, 0, Math.PI * 2);
      ctx.fillStyle = \`rgba(255, 255, 255, \${auroraProg * 0.8})\`;
      ctx.fill();`;

const newAurora = `      // Mystical Cosmic Anomaly
      const baseColor = tierColors[tier][0];
      const timeScale = elapsed * 0.5;

      // Layer 1: Atmospheric Glow
      const atmosphericGrad = ctx.createRadialGradient(w/2, sourceY, 0, w/2, sourceY, sourceW * 0.9);
      atmosphericGrad.addColorStop(0, \`rgba(\${baseColor}, \${auroraProg * 0.5})\`);
      atmosphericGrad.addColorStop(0.4, \`rgba(\${baseColor}, \${auroraProg * 0.15})\`);
      atmosphericGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmosphericGrad;
      ctx.fillRect(0, 0, w, sourceY + sourceW);

      ctx.save();
      ctx.translate(w/2, sourceY);

      // Layer 2: Rotating Vortex
      ctx.rotate(timeScale * Math.PI * 0.5);
      const vortexGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 120);
      vortexGrad.addColorStop(0, \`rgba(255, 255, 255, \${auroraProg * 0.9})\`);
      vortexGrad.addColorStop(0.3, \`rgba(\${baseColor}, \${auroraProg * 0.6})\`);
      vortexGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = vortexGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 140 + Math.sin(timeScale * 4) * 20, 80 + Math.cos(timeScale * 3) * 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Layer 3: Counter-rotating plasma filaments
      ctx.rotate(-timeScale * Math.PI * 1.2);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
         ctx.ellipse(0, 0, 100, 20, (i * Math.PI) / 2.5, 0, Math.PI * 2);
      }
      ctx.fillStyle = \`rgba(255, 255, 255, \${auroraProg * 0.3})\`;
      ctx.fill();

      // Layer 4: Dimensional Luminous Core
      ctx.beginPath();
      ctx.arc(0, 0, 25 + Math.sin(timeScale * 8) * 5, 0, Math.PI * 2);
      ctx.fillStyle = \`rgba(255, 255, 255, \${auroraProg})\`;
      ctx.shadowColor = \`rgba(\${baseColor}, 1)\`;
      ctx.shadowBlur = 40;
      ctx.fill();

      ctx.restore();`;

content = content.replace(oldAurora, newAurora);
fs.writeFileSync('app/lucky-card-reveal.js', content, 'utf8');
