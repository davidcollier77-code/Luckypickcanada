const fs = require('fs');

const filePath = 'components/DailyResonance.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldDrawLightning = `      // --- UPDATE & DRAW LIGHTNING ---
      let maxLightningOpacity = 0;
      for (let i = lightningStrikes.length - 1; i >= 0; i--) {
          const l = lightningStrikes[i];
          l.life -= 0.02; // decay
          if (l.life <= 0) {
              lightningStrikes.splice(i, 1);
              continue;
          }

          // Chaotic cinematic flicker
          const flicker = Math.random() > 0.6 ? 0.3 : 1;
          const opacity = l.life * flicker;
          maxLightningOpacity = Math.max(maxLightningOpacity, opacity);

          if (opacity > 0) {
              // Outer glow
              ctx.shadowColor = 'rgba(200, 220, 255, 1)';
              ctx.shadowBlur = 20 * opacity;
              ctx.strokeStyle = \`rgba(180, 200, 255, \${opacity * 0.8})\`;
              ctx.lineWidth = 3;
              ctx.beginPath();
              for (const seg of l.segments) {
                  ctx.moveTo(seg.startX, seg.startY);
                  ctx.lineTo(seg.endX, seg.endY);
              }
              ctx.stroke();

              // Intense core
              ctx.shadowBlur = 0;
              ctx.strokeStyle = \`rgba(255, 255, 255, \${opacity})\`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              for (const seg of l.segments) {
                  ctx.moveTo(seg.startX, seg.startY);
                  ctx.lineTo(seg.endX, seg.endY);
              }
              ctx.stroke();
          }
      }

      if (maxLightningOpacity > 0) {
          // Environmental illumination flash
          const grad = ctx.createRadialGradient(w/2, h/4, 0, w/2, h/4, h);
          grad.addColorStop(0, \`rgba(200, 220, 255, \${maxLightningOpacity * 0.15})\`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect((w/2) - h, (h/4) - h, h * 2, h * 2);
      }`;

const newDrawLightning = `      // --- UPDATE & DRAW LIGHTNING ---
      let maxLightningOpacity = 0;
      for (let i = lightningStrikes.length - 1; i >= 0; i--) {
          const l = lightningStrikes[i];
          l.life -= 0.025; // Snappy cinematic decay
          if (l.life <= 0) {
              lightningStrikes.splice(i, 1);
              continue;
          }

          // Chaotic cinematic flicker based on life phase
          let flicker = 1;
          if (l.life < 0.8 && l.life > 0.3) {
             flicker = Math.random() > 0.5 ? 0.4 : 1;
          } else if (l.life <= 0.3) {
             flicker = Math.random() > 0.7 ? 0 : 0.8;
          }
          const opacity = l.life * flicker;

          if (l.isPrimary) {
             maxLightningOpacity = Math.max(maxLightningOpacity, opacity);
          } else if (maxLightningOpacity === 0) {
             // Secondary strikes still give a tiny bit of environmental flash
             maxLightningOpacity = Math.max(maxLightningOpacity, opacity * 0.3);
          }

          if (opacity > 0) {
              const baseWidth = l.isPrimary ? (isMobile ? 1.5 : 2.5) : (isMobile ? 1.0 : 1.5);

              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              // Multi-pass lighting

              // 1. Broad atmospheric glow (skipped on mobile for performance or kept minimal)
              if (!isMobile || l.isPrimary) {
                  ctx.shadowColor = 'rgba(160, 190, 255, 1)';
                  ctx.shadowBlur = (isMobile ? 15 : 30) * opacity;
                  ctx.strokeStyle = \`rgba(100, 150, 255, \${opacity * 0.4})\`;
                  ctx.lineWidth = baseWidth * 6;
                  ctx.beginPath();
                  for (const seg of l.segments) {
                      ctx.moveTo(seg.startX, seg.startY);
                      ctx.lineTo(seg.endX, seg.endY);
                  }
                  ctx.stroke();
              }

              // 2. Medium luminous body
              ctx.shadowColor = 'rgba(200, 220, 255, 1)';
              ctx.shadowBlur = (isMobile ? 10 : 20) * opacity;
              ctx.strokeStyle = \`rgba(180, 210, 255, \${opacity * 0.8})\`;
              ctx.lineWidth = baseWidth * 2.5;
              ctx.beginPath();
              for (const seg of l.segments) {
                  ctx.moveTo(seg.startX, seg.startY);
                  ctx.lineTo(seg.endX, seg.endY);
              }
              ctx.stroke();

              // 3. Crisp white-hot core
              ctx.shadowBlur = (isMobile ? 2 : 5) * opacity;
              ctx.strokeStyle = \`rgba(255, 255, 255, \${opacity})\`;
              ctx.lineWidth = baseWidth;
              ctx.beginPath();
              for (const seg of l.segments) {
                  ctx.moveTo(seg.startX, seg.startY);
                  ctx.lineTo(seg.endX, seg.endY);
              }
              ctx.stroke();
          }
      }

      if (maxLightningOpacity > 0) {
          // Cinematic environmental flash/bloom
          const flashRadius = isMobile ? h * 0.7 : h;
          const grad = ctx.createRadialGradient(w/2, h/3, 0, w/2, h/3, flashRadius);
          grad.addColorStop(0, \`rgba(200, 220, 255, \${maxLightningOpacity * (isMobile ? 0.2 : 0.25)})\`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          // Bounded fill to prevent massive GPU overdraw
          ctx.fillRect((w/2) - flashRadius, (h/3) - flashRadius, flashRadius * 2, flashRadius * 2);
      }`;

content = content.replace(oldDrawLightning, newDrawLightning);
fs.writeFileSync(filePath, content);
console.log("Updated draw lightning logic.");
