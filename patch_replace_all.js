const fs = require('fs');

let content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

const changes = [
  {
    old: `    const schedule = STRIKE_SCHEDULES[tier];
    const finalStrike = schedule[schedule.length - 1];
    const flipAt = finalStrike + 0.1;
    const maxLifetime = flipAt + 3.0;`,
    new: `    const schedule = STRIKE_SCHEDULES[tier];
    const finalStrike = schedule[schedule.length - 1];
    const flipAt = finalStrike + 0.8;
    const maxLifetime = flipAt + 3.0;`
  },
  {
    old: `    const tierColors = {
      standard: ['167, 243, 208', '52, 211, 153', '16, 185, 129'], // Emerald
      premium: ['191, 219, 254', '96, 165, 250', '59, 130, 246', '37, 99, 235', '29, 78, 216'], // Blue
      flagship: ['253, 230, 138', '252, 211, 77', '251, 191, 36', '245, 158, 11', '217, 119, 6', '180, 83, 9', '255, 255, 255'] // Gold to White
    };`,
    new: `    const tierColors = {
      standard: ['14, 165, 233', '217, 70, 239', '180, 83, 9'], // Blue -> Magenta -> Bronze
      premium: ['14, 165, 233', '217, 70, 239', '14, 165, 233', '217, 70, 239', '156, 163, 175'], // Alternating -> Platinum
      flagship: ['14, 165, 233', '217, 70, 239', '14, 165, 233', '217, 70, 239', '14, 165, 233', '217, 70, 239', '234, 179, 8'] // Alternating -> Gold
    };`
  },
  {
    old: `      const auroraGrad = ctx.createRadialGradient(w/2, sourceY, 0, w/2, sourceY, sourceW);
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
      ctx.fill();`,
    new: `      // Mystical Cosmic Anomaly
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

      ctx.restore();`
  },
  {
    old: `      // Flash calculation
      if (timeSinceStrike > 0 && timeSinceStrike < 0.5) {
        const flashIntensity = 1 - (timeSinceStrike / 0.5);
        const thisFlashMax = isFinal ? 0.9 : 0.4 + (idx * 0.1);
        if (flashIntensity * thisFlashMax > maxFlashOpacity) {
           maxFlashOpacity = flashIntensity * thisFlashMax;
           flashRgb = beamColor;
           isFinalFlash = isFinal;
        }
      }`,
    new: `      // Flash calculation
      if (timeSinceStrike > 0 && timeSinceStrike < 0.5) {
        const flashIntensity = 1 - (timeSinceStrike / 0.5);
        // Final strike flash is massive and luminous
        const thisFlashMax = isFinal ? 1.0 : 0.4 + (idx * 0.1);
        if (flashIntensity * thisFlashMax > maxFlashOpacity) {
           maxFlashOpacity = flashIntensity * thisFlashMax;
           flashRgb = beamColor;
           isFinalFlash = isFinal;
        }
      }`
  },
  {
    old: `        // Outer glow
        ctx.lineWidth = isFinal ? 50 : 20 + (idx * 4);
        ctx.strokeStyle = \`rgba(\${beamColor}, \${0.3 * opacity})\`;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Core
        ctx.lineWidth = isFinal ? 15 : 6 + (idx * 2);
        ctx.strokeStyle = \`rgba(255, 255, 255, \${opacity})\`;
        ctx.stroke();`,
    new: `        // Outer glow
        ctx.lineWidth = isFinal ? 80 : 20 + (idx * 4); // Larger impact convergence
        ctx.strokeStyle = \`rgba(\${beamColor}, \${(isFinal ? 0.6 : 0.3) * opacity})\`;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Inner Bloom
        if (isFinal) {
           ctx.lineWidth = 40;
           ctx.strokeStyle = \`rgba(\${beamColor}, \${0.8 * opacity})\`;
           ctx.stroke();
        }

        // White-hot Core
        ctx.lineWidth = isFinal ? 20 : 6 + (idx * 2);
        ctx.strokeStyle = \`rgba(255, 255, 255, \${opacity})\`;
        ctx.stroke();`
  },
  {
    old: `    const finalStrike = schedule[schedule.length - 1];
    const flipAt = finalStrike + 0.1;

    sequence.push([cardRef.current, { x: 0, y: 0, rotateZ: 0, opacity: 1, filter: "brightness(1)" }, { at: flipAt.toString(), duration: 0.8, ease: "circOut" }]);
    sequence.push([cardFlipRef.current, { rotateY: 180 }, { at: flipAt.toString(), duration: 0.8, ease: "circOut" }]);`,
    new: `    const finalStrike = schedule[schedule.length - 1];
    const flipAt = finalStrike + 0.8;

    sequence.push([cardRef.current, { x: 0, y: 0, rotateZ: 0, opacity: 1, filter: "brightness(1)" }, { at: flipAt.toString(), duration: 0.8, ease: "circOut" }]);
    sequence.push([cardFlipRef.current, { rotateY: 180 }, { at: flipAt.toString(), duration: 0.8, ease: "circOut" }]);`
  }
];

let replacedCount = 0;
for (const change of changes) {
    if (content.includes(change.old)) {
        content = content.replace(change.old, change.new);
        replacedCount++;
    } else {
        console.error("COULD NOT FIND:", change.old);
    }
}

console.log(`Replaced ${replacedCount} out of ${changes.length}`);

fs.writeFileSync('app/lucky-card-reveal.js', content, 'utf8');
