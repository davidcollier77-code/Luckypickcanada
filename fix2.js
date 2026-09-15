const fs = require('fs');
let code = fs.readFileSync('components/LuckyGenerator.tsx', 'utf8');
const drawMeteorReplace = `
      // Draw Meteors
      for (let i = s.meteors.length - 1; i >= 0; i--) {
        const m = s.meteors[i];
        m.life += dt;

        // Acceleration / depth simulation
        const accel = 1 + dt * 0.5;
        m.vx *= accel;
        m.vy *= accel;

        m.x += m.vx * dt;
        m.y += m.vy * dt;

        m.trail.unshift({ x: m.x, y: m.y, alpha: 1 });
        if (m.trail.length > (m.isHero ? 25 : 15)) m.trail.pop();

        if (m.trail.length < 2) continue;

        const tail = m.trail[m.trail.length - 1];
        const dist = Math.hypot(m.x - tail.x, m.y - tail.y);
        const actualLen = Math.min(dist, m.len);

        // Atmospheric fade (brighter in middle of screen)
        const atmosphericAlpha = Math.max(0, Math.min(1, Math.sin((Math.max(0, Math.min(height, m.y)) / height) * Math.PI)));
        const baseAlpha = m.isHero ? 1.0 : (0.5 + Math.random() * 0.3) * atmosphericAlpha;

        // Glow layer
        ctx!.beginPath();
        const glowGrad = ctx!.createLinearGradient(m.x, m.y, tail.x, tail.y);
        glowGrad.addColorStop(0, \`rgba(255, 255, 255, \${baseAlpha})\`);
        glowGrad.addColorStop(0.1, \`rgba(150, 220, 255, \${baseAlpha * 0.8})\`);
        glowGrad.addColorStop(0.5, \`rgba(100, 150, 255, \${baseAlpha * 0.4})\`);
        glowGrad.addColorStop(1, 'rgba(50, 100, 200, 0)');
        ctx!.strokeStyle = glowGrad;
        ctx!.lineWidth = m.width * 2.5;
        ctx!.lineCap = 'round';
        ctx!.moveTo(m.x | 0, m.y | 0);
        ctx!.lineTo(tail.x | 0, tail.y | 0);
        ctx!.stroke();

        // Core layer
        ctx!.beginPath();
        const coreGrad = ctx!.createLinearGradient(m.x, m.y, tail.x, tail.y);
        coreGrad.addColorStop(0, \`rgba(255, 255, 255, \${baseAlpha})\`);
        coreGrad.addColorStop(0.3, \`rgba(200, 240, 255, \${baseAlpha * 0.6})\`);
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx!.strokeStyle = coreGrad;
        ctx!.lineWidth = m.width;
        ctx!.moveTo(m.x | 0, m.y | 0);
        ctx!.lineTo(tail.x | 0, tail.y | 0);
        ctx!.stroke();

        // Head bright spot
        const coreSize = m.isHero ? m.width * 1.5 : m.width;
        ctx!.fillStyle = \`rgba(255, 255, 255, \${baseAlpha})\`;
        ctx!.beginPath(); ctx!.arc(m.x | 0, m.y | 0, coreSize, 0, Math.PI * 2); ctx!.fill();

        if (m.isHero && Math.random() > 0.6) {
           spawnDust(m.x, m.y, true);
        }

        if (m.y > height + 200 || m.x < -200 || m.x > width + 200) s.meteors.splice(i, 1);
      }`;
code = code.replace(/\/\/ Draw Meteors[\s\S]*?(?=\/\/ Draw Lightning Bolts)/g, drawMeteorReplace.trim() + "\n\n      ");


const drawBoltReplace = `
      // Draw Lightning Bolts
      function drawBranch(branch: BoltBranch, alpha: number, isGlow: boolean) {
         ctx!.beginPath();
         ctx!.lineWidth = isGlow ? branch.thickness * (branch.thickness > 3 ? 6 : 4) : branch.thickness;
         ctx!.strokeStyle = isGlow ? '#c864ff' : '#ffffff';
         ctx!.globalAlpha = isGlow ? alpha * 0.7 : alpha;
         ctx!.lineJoin = 'miter';
         branch.segments.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
         ctx!.stroke();
         ctx!.globalAlpha = 1.0;
         branch.branches.forEach(b => drawBranch(b, alpha, isGlow));
      }

      for (let i = s.bolts.length - 1; i >= 0; i--) {
        const bolt = s.bolts[i];
        bolt.age += dt;

        // Rapid flashing effect simulating real lightning strike illumination
        const flicker = Math.random() > 0.4 ? 1 : 0.4;
        const alpha = bolt.isHero
           ? Math.max(0, 1 - Math.pow((bolt.age / bolt.life), 2)) * flicker
           : Math.max(0, 1 - (bolt.age / bolt.life)) * flicker;

        if (alpha <= 0) { s.bolts.splice(i, 1); continue; }

        drawBranch(bolt.main, alpha, true);
        if (bolt.isHero && alpha > 0.2) {
            ctx!.beginPath();
            ctx!.lineWidth = bolt.main.thickness * 1.5;
            ctx!.strokeStyle = '#a0e6ff';
            ctx!.globalAlpha = alpha * 0.9;
            bolt.main.segments.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
            ctx!.stroke();
            ctx!.globalAlpha = 1.0;
        }
        drawBranch(bolt.main, alpha, false);
      }`;
code = code.replace(/\/\/ Draw Lightning Bolts[\s\S]*?(?=\/\/ Draw Fireworks & Sparks)/g, drawBoltReplace.trim() + "\n\n      ");

const drawSparksReplace = `
      // Draw Fireworks & Sparks
      for (let i = s.rockets.length - 1; i >= 0; i--) {
        const r = s.rockets[i];
        r.vy += 320 * dt;
        r.vx *= 1 - dt * 0.3;
        r.x += r.vx * dt;
        r.y += r.vy * dt;

        r.trail.unshift({ x: r.x, y: r.y });
        if (r.trail.length > (r.isHero ? 25 : 18)) r.trail.pop();

        ctx!.strokeStyle = '#ffc864';
        const lastIndex = Math.max(0, r.trail.length - 1);
        ctx!.beginPath();
        const grad = ctx!.createLinearGradient(r.x, r.y, r.trail[lastIndex]?.x || r.x, r.trail[lastIndex]?.y || r.y);
        grad.addColorStop(0, 'rgba(255,200,100,1)');
        grad.addColorStop(1, 'rgba(255,200,100,0)');
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = r.isHero ? 4 : 2;
        ctx!.lineCap = 'round';
        r.trail.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
        ctx!.stroke();

        ctx!.fillStyle = '#ffffff';
        ctx!.beginPath(); ctx!.arc(r.x | 0, r.y | 0, r.isHero ? 3 : 2, 0, Math.PI * 2); ctx!.fill();

        if (r.vy >= -50 || r.y < height * 0.1) {
          if (!r.exploded) { r.exploded = true; explode(r.x, r.y, r.color, r.isHero); }
          s.rockets.splice(i, 1);
        }
      }

      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        sp.age += dt;
        if (sp.age >= sp.life) { s.sparks.splice(i, 1); continue; }

        sp.vy += 180 * dt;
        sp.vx *= 1 - dt * 1.5;
        sp.vy *= 1 - dt * 1.5;

        const flicker = Math.random() > 0.8 ? 0.5 : 1.0;
        const alpha = Math.max(0, 1 - Math.pow(sp.age / sp.life, 1.5)) * flicker;

        sp.x += sp.vx * dt; sp.y += sp.vy * dt;

        sp.trail.unshift({x: sp.x, y: sp.y});
        if (sp.trail.length > Math.max(3, Math.floor(sp.size * 2))) sp.trail.pop();

        if (sp.trail.length > 1) {
            ctx!.beginPath();
            ctx!.lineWidth = sp.size;
            ctx!.lineCap = 'round';
            ctx!.strokeStyle = \`rgba(\${sp.color}, \${alpha * 0.8})\`;
            sp.trail.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
            ctx!.stroke();
        }

        ctx!.fillStyle = \`rgba(\${sp.color}, \${alpha})\`;
        ctx!.beginPath(); ctx!.arc(sp.x | 0, sp.y | 0, sp.size * 0.8, 0, Math.PI * 2); ctx!.fill();

        if (alpha > 0.3) {
            ctx!.fillStyle = \`rgba(\${sp.color}, \${alpha * 0.2})\`;
            ctx!.beginPath(); ctx!.arc(sp.x | 0, sp.y | 0, sp.size * 3, 0, Math.PI * 2); ctx!.fill();
        }
      }`;
code = code.replace(/\/\/ Draw Fireworks & Sparks[\s\S]*?(?=\/\/ \-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-)/g, drawSparksReplace.trim() + "\n\n      // Master Flash\n      if (s.flash > 0) {\n        ctx!.fillStyle = `rgba(255, 255, 255, ${s.flash * 0.8})`;\n        ctx!.fillRect(0, 0, width, height);\n        s.flash = Math.max(0, s.flash - dt * (s.flash > 0.5 ? 2.5 : 1.0));\n      }\n\n    }\n\n    raf = requestAnimationFrame(frame);\n    return () => {\n      cancelAnimationFrame(raf);\n      window.removeEventListener('resize', resize);\n      document.removeEventListener('visibilitychange', onVisibility);\n    };\n  }, [canvasRef, phaseRef, pendingTierRef, revealStartTimeRef, audioCtxRef, audioBuffersRef, buildUpSourceRef, buildUpGainRef, activeSourcesRef, scoreTextRef, setImpactFired, pendingResultRef]);\n}\n\n");
fs.writeFileSync('components/LuckyGenerator.tsx', code);
