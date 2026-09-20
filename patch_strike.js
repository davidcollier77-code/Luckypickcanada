const fs = require('fs');
let content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

// 4. Enhance Final Strike
const oldFlash = `      // Flash calculation
      if (timeSinceStrike > 0 && timeSinceStrike < 0.5) {
        const flashIntensity = 1 - (timeSinceStrike / 0.5);
        const thisFlashMax = isFinal ? 0.9 : 0.4 + (idx * 0.1);
        if (flashIntensity * thisFlashMax > maxFlashOpacity) {
           maxFlashOpacity = flashIntensity * thisFlashMax;
           flashRgb = beamColor;
           isFinalFlash = isFinal;
        }
      }`;

const newFlash = `      // Flash calculation
      if (timeSinceStrike > 0 && timeSinceStrike < 0.5) {
        const flashIntensity = 1 - (timeSinceStrike / 0.5);
        // Final strike flash is massive and luminous
        const thisFlashMax = isFinal ? 1.0 : 0.4 + (idx * 0.1);
        if (flashIntensity * thisFlashMax > maxFlashOpacity) {
           maxFlashOpacity = flashIntensity * thisFlashMax;
           flashRgb = beamColor;
           isFinalFlash = isFinal;
        }
      }`;
content = content.replace(oldFlash, newFlash);

const oldStrikeOuterGlow = `        // Outer glow
        ctx.lineWidth = isFinal ? 50 : 20 + (idx * 4);
        ctx.strokeStyle = \`rgba(\${beamColor}, \${0.3 * opacity})\`;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Core
        ctx.lineWidth = isFinal ? 15 : 6 + (idx * 2);
        ctx.strokeStyle = \`rgba(255, 255, 255, \${opacity})\`;
        ctx.stroke();`;

const newStrikeOuterGlow = `        // Outer glow
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
        ctx.stroke();`;

content = content.replace(oldStrikeOuterGlow, newStrikeOuterGlow);

fs.writeFileSync('app/lucky-card-reveal.js', content, 'utf8');
